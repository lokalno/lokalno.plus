import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateListingPhotos, hasListingPhotos } from "@/lib/listing-photos";
import { validateListingStock } from "@/lib/listing-stock";
import { validateItemLocation } from "@/lib/listing-location";
import { checkListingContent } from "@/lib/moderation";
import { parsePhotos } from "@/lib/utils";
import { parseTransportVehiclePayload } from "@/lib/vehicle";
import { isPartsListingCategory, parsePartsListingPayload } from "@/lib/parts";
import { isAgriListingCategory, parseAgriListingPayload } from "@/lib/agri";
import { parseListingCategory } from "@/lib/constants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, city: true, avatar: true, createdAt: true },
        },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = session?.user?.id === listing.sellerId;
    const isAdmin = session?.user?.role === "ADMIN";
    if (!isOwner && !isAdmin && listing.status !== "ACTIVE" && listing.status !== "SOLD") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch {
    return NextResponse.json({ error: "Оголошення тимчасово недоступне" }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (listing.sellerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.photos !== undefined) {
      const photosCheck = validateListingPhotos(body.photos);
      if (!photosCheck.ok) {
        return NextResponse.json({ error: photosCheck.error }, { status: 400 });
      }
      body.photos = photosCheck.photos;
    }

    if (body.stock !== undefined) {
      const stockCheck = validateListingStock(body.stock);
      if (!stockCheck.ok) {
        return NextResponse.json({ error: stockCheck.error }, { status: 400 });
      }
      body.stock = stockCheck.stock;
    }

    let autoStatus: string | undefined;
    if (body.stock !== undefined && body.status === undefined) {
      if (
        body.stock > 0 &&
        listing.status === "SOLD" &&
        hasListingPhotos(listing.photos)
      ) {
        autoStatus = "ACTIVE";
      }
    }

    const sellerAllowedStatuses = ["ACTIVE", "SOLD", "HIDDEN"];
    if (body.status !== undefined) {
      const nextStatus = body.status;
      if (!isAdmin && !sellerAllowedStatuses.includes(nextStatus)) {
        return NextResponse.json({ error: "Невірний статус" }, { status: 400 });
      }
      if (!isAdmin && listing.status === "PENDING" && nextStatus === "ACTIVE") {
        return NextResponse.json(
          { error: "Оголошення на модерації — дочекайтеся схвалення адміністратора" },
          { status: 400 }
        );
      }
      if (nextStatus === "ACTIVE" && !hasListingPhotos(listing.photos)) {
        const updatedPhotos =
          body.photos !== undefined ? body.photos : parsePhotos(listing.photos);
        if (!Array.isArray(updatedPhotos) || updatedPhotos.length === 0) {
          return NextResponse.json(
            { error: "Неможливо опублікувати оголошення без фото" },
            { status: 400 }
          );
        }
      }
    }

    if (body.itemLocation !== undefined) {
      const itemLocationCheck = validateItemLocation(body.itemLocation);
      if (!itemLocationCheck.ok) {
        return NextResponse.json({ error: itemLocationCheck.error }, { status: 400 });
      }

      const forbiddenLocation = checkListingContent(itemLocationCheck.value, "");
      if (forbiddenLocation) {
        return NextResponse.json(
          {
            error: `Заборонене слово в позиції на складі: «${forbiddenLocation}».`,
          },
          { status: 400 }
        );
      }

      body.itemLocation = itemLocationCheck.value;
    }

    const nextCategory = body.category !== undefined ? body.category : listing.category;
    const vehicleInput = {
      vehicleYear: body.vehicleYear !== undefined ? body.vehicleYear : listing.vehicleYear,
      vehicleFuel: body.vehicleFuel !== undefined ? body.vehicleFuel : listing.vehicleFuel,
      vehicleTransmission:
        body.vehicleTransmission !== undefined
          ? body.vehicleTransmission
          : listing.vehicleTransmission,
      vehicleBody: body.vehicleBody !== undefined ? body.vehicleBody : listing.vehicleBody,
      vehicleMileage:
        body.vehicleMileage !== undefined ? body.vehicleMileage : listing.vehicleMileage,
      vehicleType: body.vehicleType !== undefined ? body.vehicleType : listing.vehicleType,
      vehicleEngineVolume:
        body.vehicleEngineVolume !== undefined
          ? body.vehicleEngineVolume
          : listing.vehicleEngineVolume,
      vehicleLoadCapacity:
        body.vehicleLoadCapacity !== undefined
          ? body.vehicleLoadCapacity
          : listing.vehicleLoadCapacity,
    };
    const vehicleCheck = parseTransportVehiclePayload(vehicleInput, nextCategory);
    if (!vehicleCheck.ok) {
      return NextResponse.json({ error: vehicleCheck.error }, { status: 400 });
    }

    const { main, sub } = parseListingCategory(nextCategory);
    const isParts = isPartsListingCategory(main, sub);
    const isAgri = isAgriListingCategory(main, sub);
    const partsTouched =
      body.category !== undefined ||
      body.partForVehicle !== undefined ||
      body.partType !== undefined ||
      body.partPopular !== undefined ||
      body.brand !== undefined;
    let partsFields: {
      partForVehicle: string | null;
      partType: string | null;
      partPopular: string | null;
    } | null = null;
    let partsBrand: string | null | undefined;
    let agriVehicleData: typeof vehicleCheck.data | null = null;
    let agriBrand: string | null | undefined;
    if (partsTouched) {
      if (isParts) {
        const partsCheck = parsePartsListingPayload({
          partForVehicle:
            body.partForVehicle !== undefined ? body.partForVehicle : listing.partForVehicle,
          partType: body.partType !== undefined ? body.partType : listing.partType,
          partPopular: body.partPopular !== undefined ? body.partPopular : listing.partPopular,
          brand: body.brand !== undefined ? body.brand : listing.brand,
        });
        if (!partsCheck.ok) {
          return NextResponse.json({ error: partsCheck.error }, { status: 400 });
        }
        partsFields = {
          partForVehicle: partsCheck.data.partForVehicle,
          partType: partsCheck.data.partType,
          partPopular: partsCheck.data.partPopular,
        };
        partsBrand = partsCheck.data.brand;
      } else {
        partsFields = { partForVehicle: null, partType: null, partPopular: null };
        partsBrand = null;
      }
    }

    const agriTouched =
      body.category !== undefined ||
      body.brand !== undefined ||
      body.vehicleType !== undefined ||
      body.vehicleYear !== undefined;
    if (agriTouched) {
      if (isAgri) {
        const agriCheck = parseAgriListingPayload({
          brand: body.brand !== undefined ? body.brand : listing.brand,
          vehicleType: body.vehicleType !== undefined ? body.vehicleType : listing.vehicleType,
          vehicleYear: body.vehicleYear !== undefined ? body.vehicleYear : listing.vehicleYear,
        });
        if (!agriCheck.ok) {
          return NextResponse.json({ error: agriCheck.error }, { status: 400 });
        }
        const { brand: parsedAgriBrand, ...agriVehicleFields } = agriCheck.data;
        agriBrand = parsedAgriBrand;
        agriVehicleData = agriVehicleFields;
      } else {
        agriBrand = null;
        agriVehicleData = {
          vehicleYear: null,
          vehicleFuel: null,
          vehicleTransmission: null,
          vehicleBody: null,
          vehicleMileage: null,
          vehicleType: null,
          vehicleEngineVolume: null,
          vehicleLoadCapacity: null,
        };
      }
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.brand !== undefined && !isParts && !isAgri
          ? { brand: typeof body.brand === "string" && body.brand.trim() ? body.brand.trim() : null }
          : {}),
        ...(partsBrand !== undefined ? { brand: partsBrand } : {}),
        ...(agriBrand !== undefined ? { brand: agriBrand } : {}),
        ...(body.condition !== undefined ? { condition: body.condition } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.itemLocation !== undefined ? { itemLocation: body.itemLocation } : {}),
        ...(body.stock !== undefined ? { stock: body.stock } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(autoStatus ? { status: autoStatus } : {}),
        ...(body.photos !== undefined ? { photos: JSON.stringify(body.photos) } : {}),
        ...(body.allowPriceOffers !== undefined
          ? { allowPriceOffers: Boolean(body.allowPriceOffers) }
          : {}),
        ...(body.category !== undefined ||
        body.vehicleYear !== undefined ||
        body.vehicleFuel !== undefined ||
        body.vehicleTransmission !== undefined ||
        body.vehicleBody !== undefined ||
        body.vehicleMileage !== undefined ||
        body.vehicleType !== undefined ||
        body.vehicleEngineVolume !== undefined ||
        body.vehicleLoadCapacity !== undefined
          ? vehicleCheck.data
          : {}),
        ...(agriVehicleData ? agriVehicleData : {}),
        ...(partsFields ? partsFields : {}),
      },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(session.user.id);
  if (listing.sellerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listing.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
