import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateListingPhotos, hasListingPhotos } from "@/lib/listing-photos";
import { validateListingStock } from "@/lib/listing-stock";
import { validateItemLocation } from "@/lib/listing-location";
import { validateListingTitle } from "@/lib/listing-title";
import { checkListingContent } from "@/lib/moderation";
import { parsePhotos } from "@/lib/utils";
import { parseTransportVehiclePayload } from "@/lib/vehicle";
import { isPartsListingCategory, parsePartsListingPayload } from "@/lib/parts";
import { isAgriListingCategory, parseAgriListingPayload } from "@/lib/agri";
import { parseListingCategory } from "@/lib/constants";
import { getListingConditions, parseClothingSizePayload } from "@/lib/clothing-sizes";
import {
  isClothingVariantsCategory,
  serializeListingVariants,
  sumVariantStock,
  validateListingVariants,
  type ListingVariant,
} from "@/lib/listing-variants";
import { deleteListingById } from "@/lib/delete-listing";
import { normalizePromCharacteristics } from "@/lib/prom-import-characteristics";
import { mirrorListingPhotos } from "@/lib/mirror-listing-photo";
import { isExternalListingPhotoUrl } from "@/lib/listing-image-hosts";

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

    return NextResponse.json({
      ...listing,
      promCharacteristics: normalizePromCharacteristics(listing.promCharacteristics),
    });
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

    if (!isAdmin && body.status === "SOLD") {
      body.stock = 0;
      body.status = "ACTIVE";
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

    if (body.title !== undefined) {
      const titleCheck = validateListingTitle(body.title);
      if (!titleCheck.ok) {
        return NextResponse.json({ error: titleCheck.error }, { status: 400 });
      }
      body.title = titleCheck.title;
    }

    const nextTitle = body.title !== undefined ? body.title : listing.title;
    const nextDescription =
      body.description !== undefined ? body.description.trim() : listing.description;
    if (body.title !== undefined || body.description !== undefined) {
      const forbidden = checkListingContent(nextTitle, nextDescription);
      if (forbidden) {
        return NextResponse.json(
          {
            error: `Заборонене слово в оголошенні: «${forbidden}». Оголошення не збережено.`,
          },
          { status: 400 }
        );
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
    const allowedConditions = getListingConditions(main, sub);
    const nextCondition = body.condition !== undefined ? body.condition : listing.condition;
    if (!(nextCondition in allowedConditions)) {
      return NextResponse.json({ error: "Невірний стан товару" }, { status: 400 });
    }

    const sizeTouched = body.category !== undefined || body.itemSize !== undefined;
    const variantsTouched = body.variants !== undefined || body.category !== undefined;
    let parsedItemSize: string | null | undefined;
    let parsedVariantsJson: string | null | undefined;
    let parsedStockFromVariants: number | undefined;

    if (isClothingVariantsCategory(nextCategory)) {
      if (variantsTouched && body.variants !== undefined) {
        if (!Array.isArray(body.variants)) {
          return NextResponse.json(
            { error: "Додайте хоча б один варіант товару." },
            { status: 400 }
          );
        }
        const variantsCheck = validateListingVariants(body.variants as ListingVariant[], nextCategory);
        if (!variantsCheck.ok) {
          return NextResponse.json({ error: variantsCheck.error }, { status: 400 });
        }
        parsedVariantsJson = serializeListingVariants(variantsCheck.variants);
        parsedStockFromVariants = sumVariantStock(variantsCheck.variants);
        parsedItemSize = null;
      }
    } else if (sizeTouched) {
      const sizeCheck = parseClothingSizePayload(
        nextCategory,
        body.itemSize !== undefined ? body.itemSize : listing.itemSize
      );
      if (!sizeCheck.ok) {
        return NextResponse.json({ error: sizeCheck.error }, { status: 400 });
      }
      parsedItemSize = sizeCheck.itemSize;
      if (body.category !== undefined) {
        parsedVariantsJson = null;
      }
    } else if (body.category !== undefined && !isClothingVariantsCategory(nextCategory)) {
      parsedVariantsJson = null;
    }

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

    const nextStatus =
      body.status !== undefined ? body.status : autoStatus !== undefined ? autoStatus : listing.status;
    let mirroredPhotosJson: string | undefined;

    if (nextStatus === "ACTIVE") {
      const currentPhotos =
        body.photos !== undefined ? (body.photos as string[]) : parsePhotos(listing.photos);
      const needsMirror = currentPhotos.some(isExternalListingPhotoUrl);
      if (needsMirror) {
        const mirrored = await mirrorListingPhotos(currentPhotos, listing.sellerId);
        const mirroredCheck = validateListingPhotos(mirrored);
        if (mirroredCheck.ok) {
          mirroredPhotosJson = JSON.stringify(mirroredCheck.photos);
        }
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
        ...(parsedItemSize !== undefined ? { itemSize: parsedItemSize } : {}),
        ...(parsedVariantsJson !== undefined ? { variants: parsedVariantsJson } : {}),
        ...(body.city !== undefined ? { city: body.city } : {}),
        ...(body.itemLocation !== undefined ? { itemLocation: body.itemLocation } : {}),
        ...(parsedStockFromVariants !== undefined
          ? { stock: parsedStockFromVariants }
          : body.stock !== undefined
            ? { stock: body.stock }
            : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(autoStatus ? { status: autoStatus } : {}),
        ...(body.photos !== undefined ? { photos: JSON.stringify(body.photos) } : {}),
        ...(mirroredPhotosJson !== undefined ? { photos: mirroredPhotosJson } : {}),
        ...(body.allowPriceOffers !== undefined
          ? { allowPriceOffers: Boolean(body.allowPriceOffers) }
          : {}),
        ...(body.allowSelfPickup !== undefined
          ? { allowSelfPickup: Boolean(body.allowSelfPickup) }
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

  const result = await deleteListingById(prisma, id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
