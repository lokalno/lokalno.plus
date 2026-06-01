import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned, getInitialListingStatus } from "@/lib/user-check";
import { checkListingContent } from "@/lib/moderation";
import { validateListingPhotos } from "@/lib/listing-photos";
import { validateListingStock } from "@/lib/listing-stock";
import { validateItemLocation } from "@/lib/listing-location";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const sellerId = searchParams.get("sellerId");
  const statusParam = searchParams.get("status") || "ACTIVE";
  const allowedStatuses = ["ACTIVE", "SOLD"];
  const status = allowedStatuses.includes(statusParam) ? statusParam : "ACTIVE";

  try {
    const listings = await prisma.listing.findMany({
      where: {
        status,
        ...(city ? { city } : {}),
        ...(category ? { category } : {}),
        ...(sellerId ? { sellerId } : {}),
        ...(q
          ? {
              OR: [{ title: { contains: q } }, { description: { contains: q } }],
            }
          : {}),
      },
      include: {
        seller: {
          select: { id: true, name: true, city: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(listings);
  } catch {
    return NextResponse.json({ error: "Каталог тимчасово недоступний" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const banCheck = await assertNotBanned(session.user.id);
  if (!banCheck.ok) {
    return NextResponse.json({ error: banCheck.error }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, price, category, brand, condition, city, itemLocation, photos, stock, allowPriceOffers } =
      body;

    if (!title || !description || !price || !category || !condition || !city) {
      return NextResponse.json(
        { error: "Заповніть усі обов'язкові поля" },
        { status: 400 }
      );
    }

    const itemLocationCheck = validateItemLocation(itemLocation);
    if (!itemLocationCheck.ok) {
      return NextResponse.json({ error: itemLocationCheck.error }, { status: 400 });
    }

    const forbidden = checkListingContent(title.trim(), description.trim());
    if (forbidden) {
      return NextResponse.json(
        { error: `Заборонене слово в оголошенні: «${forbidden}». Оголошення не опубліковано.` },
        { status: 400 }
      );
    }

    const normalizedItemLocation = itemLocationCheck.value;
    if (normalizedItemLocation) {
      const forbiddenLocation = checkListingContent(normalizedItemLocation, "");
      if (forbiddenLocation) {
        return NextResponse.json(
          {
            error: `Заборонене слово в розташуванні товару: «${forbiddenLocation}». Оголошення не опубліковано.`,
          },
          { status: 400 }
        );
      }
    }

    const photosCheck = validateListingPhotos(photos);
    if (!photosCheck.ok) {
      return NextResponse.json({ error: photosCheck.error }, { status: 400 });
    }

    const stockCheck = validateListingStock(stock ?? 1);
    if (!stockCheck.ok) {
      return NextResponse.json({ error: stockCheck.error }, { status: 400 });
    }

    const initialStatus = await getInitialListingStatus();

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        brand: typeof brand === "string" && brand.trim() ? brand.trim() : null,
        condition,
        city,
        itemLocation: normalizedItemLocation,
        photos: JSON.stringify(photosCheck.photos),
        stock: stockCheck.stock,
        allowPriceOffers: Boolean(allowPriceOffers),
        sellerId: session.user.id,
        status: initialStatus,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Помилка створення" }, { status: 500 });
  }
}
