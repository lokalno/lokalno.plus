import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileCabinetShell from "@/components/ProfileCabinetShell";
import SellerPriceOffersPanel from "@/components/SellerPriceOffersPanel";
import { getSellerCabinetBadges } from "@/lib/seller-cabinet-badges";
import { getSellerOrderCounts } from "@/lib/seller-orders";
import { markSellerPriceOffersRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function SellerPriceOffersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/price-offers");
  }

  const userId = session.user.id;

  const [user, offers, badges, orders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        avatar: true,
        reviewsReceived: { select: { rating: true } },
      },
    }),
    prisma.priceOffer.findMany({
      where: { listing: { sellerId: userId } },
      include: {
        listing: {
          select: { id: true, title: true, price: true, photos: true, status: true },
        },
        buyer: { select: { id: true, name: true, city: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    getSellerCabinetBadges(userId),
    prisma.order.findMany({
      where: { sellerId: userId },
      select: { status: true, paymentStatus: true, createdAt: true },
    }),
  ]);

  if (!user) redirect("/login?callbackUrl=/profile/price-offers");

  await markSellerPriceOffersRead(userId);

  const reviewCount = user.reviewsReceived.length;
  const avgRating =
    reviewCount > 0
      ? user.reviewsReceived.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : null;

  const orderCounts = getSellerOrderCounts(
    orders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
    }))
  );

  return (
    <>
      <div className="border-b border-brand-100/80 bg-gradient-to-br from-amber-50 via-white to-brand-50/40">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Кабінет продавця
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Пропозиції цін
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Клієнти запропонували свою ціну — погодьте або відхиліть
            </p>
          </div>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white/80 px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow"
          >
            ← До замовлень
          </Link>
        </div>
      </div>

      <ProfileCabinetShell
        userName={user.name}
        userAvatar={user.avatar}
        rating={avgRating}
        reviewCount={reviewCount}
        active="price-offers"
        variant="compact"
        orderBadge={orderCounts.new + orderCounts.processing}
        messageBadge={badges.unreadMessages}
        listingBadge={badges.listingCount}
        followerBadge={badges.followerCount}
        priceOfferBadge={badges.pendingPriceOffers}
      >
        <SellerPriceOffersPanel
          initialOffers={offers.map((offer) => ({
            ...offer,
            createdAt: offer.createdAt.toISOString(),
            respondedAt: offer.respondedAt?.toISOString() ?? null,
          }))}
        />
      </ProfileCabinetShell>
    </>
  );
}
