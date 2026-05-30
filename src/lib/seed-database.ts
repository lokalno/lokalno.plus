import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RULES, DEFAULT_PRIVACY } from "@/lib/moderation";
import { CATALOG, CATALOG_COUNT, listingPhotos } from "../../prisma/catalog-data";

const avatar = (seed: string) => `https://picsum.photos/seed/avatar-${seed}/200/200`;

const EXTRA_SELLERS = [
  { email: "seller1@lokalno.ua", name: "Андрій", city: "Київ", avatarSeed: "andriy" },
  { email: "seller2@lokalno.ua", name: "Марія", city: "Львів", avatarSeed: "maria" },
  { email: "seller3@lokalno.ua", name: "Дмитро", city: "Одеса", avatarSeed: "dmytro" },
  { email: "seller4@lokalno.ua", name: "Катерина", city: "Харків", avatarSeed: "kate" },
];

export async function seedDatabase(prisma: PrismaClient) {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {
      rulesContent: DEFAULT_RULES,
      privacyContent: DEFAULT_PRIVACY,
      preModeration: true,
    },
    create: {
      id: 1,
      siteName: "Локально",
      tagline: "Купуй і продавай локально в Україні",
      supportEmail: "support@lokalno.ua",
      rulesContent: DEFAULT_RULES,
      privacyContent: DEFAULT_PRIVACY,
      preModeration: true,
    },
  });

  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@lokalno.ua" },
    update: {},
    create: {
      email: "admin@lokalno.ua",
      passwordHash: adminPassword,
      name: "Адміністратор",
      city: "Київ",
      role: "ADMIN",
    },
  });

  const demoPassword = await bcrypt.hash("demo1234", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@lokalno.ua" },
    update: { avatar: avatar("olena") },
    create: {
      email: "demo@lokalno.ua",
      passwordHash: demoPassword,
      name: "Олена",
      city: "Львів",
      phone: "+380501234567",
      avatar: avatar("olena"),
    },
  });

  const sellerPassword = await bcrypt.hash("seller1234", 12);
  const sellers = [demoUser];

  for (const s of EXTRA_SELLERS) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: { avatar: avatar(s.avatarSeed) },
      create: {
        email: s.email,
        passwordHash: sellerPassword,
        name: s.name,
        city: s.city,
        phone: "+380671234567",
        avatar: avatar(s.avatarSeed),
      },
    });
    sellers.push(user);
  }

  await prisma.report.deleteMany();
  await prisma.review.deleteMany();
  await prisma.sellerFollow.deleteMany();
  await prisma.message.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listing.deleteMany();

  const listings = CATALOG.map((item, index) => {
    const seedKey = `${item.category}-${index}`;
    return {
      title: item.title,
      description: item.description,
      price: item.price,
      category: item.category,
      condition: item.condition,
      city: item.city,
      status: "ACTIVE",
      photos: listingPhotos(seedKey.replace(/\s/g, "")),
      views: Math.floor(Math.random() * 450) + 15,
      sellerId: sellers[index % sellers.length].id,
    };
  });

  await prisma.listing.createMany({ data: listings });

  const firstListings = await prisma.listing.findMany({ take: 5, orderBy: { createdAt: "asc" } });
  if (firstListings.length >= 3 && sellers.length >= 2) {
    await prisma.review.createMany({
      data: [
        {
          orderId: "seed-review-1",
          listingId: firstListings[0].id,
          reviewerId: sellers[1].id,
          sellerId: firstListings[0].sellerId,
          rating: 5,
          comment: "Чудовий продавець, швидко відповів!",
        },
        {
          orderId: "seed-review-2",
          listingId: firstListings[1].id,
          reviewerId: sellers[2].id,
          sellerId: firstListings[1].sellerId,
          rating: 4,
          comment: "Товар як на фото, рекомендую.",
        },
        {
          orderId: "seed-review-3",
          listingId: firstListings[2].id,
          reviewerId: sellers[3].id,
          sellerId: firstListings[2].sellerId,
          rating: 5,
          comment: "Дуже приємна покупка!",
        },
      ],
    });
  }

  const admin = await prisma.user.findUnique({ where: { email: "admin@lokalno.ua" } });
  if (sellers.length >= 3) {
    await prisma.sellerFollow.createMany({
      data: [
        { followerId: demoUser.id, sellerId: sellers[1].id },
        { followerId: demoUser.id, sellerId: sellers[2].id },
        { followerId: sellers[3].id, sellerId: sellers[1].id },
        ...(admin ? [{ followerId: admin.id, sellerId: sellers[1].id }] : []),
      ],
    });
  }

  return {
    listings: CATALOG_COUNT,
    users: sellers.length + 1,
    accounts: {
      admin: "admin@lokalno.ua / admin123",
      demo: "demo@lokalno.ua / demo1234",
      seller: "seller1@lokalno.ua / seller1234",
    },
  };
}
