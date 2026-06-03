import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assertNotBanned, getInitialListingStatus } from "@/lib/user-check";
import { checkListingContent } from "@/lib/moderation";
import { validateListingPhotos } from "@/lib/listing-photos";
import { validateListingStock } from "@/lib/listing-stock";
import { validateItemLocation } from "@/lib/listing-location";
import { parseTransportVehiclePayload } from "@/lib/vehicle";
import { isPartsListingCategory, parsePartsListingPayload } from "@/lib/parts";
import { isAgriListingCategory, parseAgriListingPayload } from "@/lib/agri";
import { parseListingCategory } from "@/lib/constants";

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
    const { title, description, price, category, brand, condition, city, itemLocation, photos, stock, allowPriceOffers, vehicleYear, vehicleFuel, vehicleTransmission, vehicleBody, vehicleMileage, vehicleType, vehicleEngineVolume, vehicleLoadCapacity, partForVehicle, partType, partPopular } =
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

    const vehicleCheck = parseTransportVehiclePayload(
      {
        vehicleYear,
        vehicleFuel,
        vehicleTransmission,
        vehicleBody,
        vehicleMileage,
        vehicleType,
        vehicleEngineVolume,
        vehicleLoadCapacity,
      },
      category
    );
    if (!vehicleCheck.ok) {
      return NextResponse.json({ error: vehicleCheck.error }, { status: 400 });
    }

    const { main, sub } = parseListingCategory(category);
    const isParts = isPartsListingCategory(main, sub);
    const isAgri = isAgriListingCategory(main, sub);
    const emptyParts: {
      partForVehicle: string | null;
      partType: string | null;
      partPopular: string | null;
    } = { partForVehicle: null, partType: null, partPopular: null };
    let partsFields = emptyParts;
    let listingBrand = typeof brand === "string" && brand.trim() ? brand.trim() : null;
    let vehicleData = vehicleCheck.data;
    if (isParts) {
      const partsCheck = parsePartsListingPayload({
        partForVehicle,
        partType,
        partPopular,
        brand,
      });
      if (!partsCheck.ok) {
        return NextResponse.json({ error: partsCheck.error }, { status: 400 });
      }
      listingBrand = partsCheck.data.brand;
      partsFields = {
        partForVehicle: partsCheck.data.partForVehicle,
        partType: partsCheck.data.partType,
        partPopular: partsCheck.data.partPopular,
      };
    } else if (isAgri) {
      const agriCheck = parseAgriListingPayload({
        brand,
        vehicleType,
        vehicleYear,
      });
      if (!agriCheck.ok) {
        return NextResponse.json({ error: agriCheck.error }, { status: 400 });
      }
      listingBrand = agriCheck.data.brand;
      const { brand: _agriBrand, ...agriVehicleFields } = agriCheck.data;
      vehicleData = agriVehicleFields;
    }

    const listing = await prisma.listing.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        brand: listingBrand,
        condition,
        city,
        itemLocation: normalizedItemLocation,
        photos: JSON.stringify(photosCheck.photos),
        stock: stockCheck.stock,
        allowPriceOffers: Boolean(allowPriceOffers),
        sellerId: session.user.id,
        status: initialStatus,
        ...vehicleData,
        ...partsFields,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Помилка створення" }, { status: 500 });
  }
}
