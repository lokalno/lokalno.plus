import type { Listing } from "@prisma/client";
import type { Prisma } from "@prisma/client";

type ListingDuplicateSource = Pick<
  Listing,
  | "title"
  | "description"
  | "price"
  | "category"
  | "brand"
  | "itemSize"
  | "variants"
  | "condition"
  | "city"
  | "itemLocation"
  | "photos"
  | "stock"
  | "allowPriceOffers"
  | "allowSelfPickup"
  | "vehicleYear"
  | "vehicleFuel"
  | "vehicleTransmission"
  | "vehicleBody"
  | "vehicleMileage"
  | "vehicleType"
  | "vehicleEngineVolume"
  | "vehicleLoadCapacity"
  | "partForVehicle"
  | "partType"
  | "partPopular"
>;

export function buildDuplicateListingData(
  listing: ListingDuplicateSource,
  sellerId: string,
  status: "PENDING" | "ACTIVE"
): Prisma.ListingCreateInput {
  return {
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category,
    brand: listing.brand,
    itemSize: listing.itemSize,
    variants: listing.variants,
    condition: listing.condition,
    city: listing.city,
    itemLocation: listing.itemLocation,
    photos: listing.photos,
    stock: listing.stock > 0 ? listing.stock : 1,
    allowPriceOffers: listing.allowPriceOffers,
    allowSelfPickup: listing.allowSelfPickup,
    vehicleYear: listing.vehicleYear,
    vehicleFuel: listing.vehicleFuel,
    vehicleTransmission: listing.vehicleTransmission,
    vehicleBody: listing.vehicleBody,
    vehicleMileage: listing.vehicleMileage,
    vehicleType: listing.vehicleType,
    vehicleEngineVolume: listing.vehicleEngineVolume,
    vehicleLoadCapacity: listing.vehicleLoadCapacity,
    partForVehicle: listing.partForVehicle,
    partType: listing.partType,
    partPopular: listing.partPopular,
    status,
    views: 0,
    seller: { connect: { id: sellerId } },
  };
}
