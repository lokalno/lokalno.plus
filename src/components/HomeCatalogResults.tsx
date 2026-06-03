import HeroSection from "@/components/HeroSection";
import MarketplaceCard from "@/components/MarketplaceCard";
import Pagination from "@/components/Pagination";
import PopularCategories from "@/components/PopularCategories";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { LISTINGS_PER_PAGE } from "@/lib/catalog";
import { buildListingCategoryFilter } from "@/lib/constants";
import {
  buildMotoWhere,
  buildVehicleWhere,
  effectiveCarSubcategory,
  hasTransportSearchFilters,
  isCarCatalogContext,
  isMotoCatalogContext,
} from "@/lib/vehicle";
import type { ListingWithSoldCount } from "@/lib/listing-sales";

type HomeListing = ListingWithSoldCount & {
  id: string;
  title: string;
  price: number;
  city: string;
  photos: string;
  createdAt: Date;
  views?: number;
  seller?: { name: string; storeName: string | null };
};

const listingSoldCountInclude = {
  _count: {
    select: {
      orders: { where: { paymentStatus: "PAID" as const } },
      favorites: true,
    },
  },
};

export type HomeCatalogParams = {
  city?: string;
  category?: string;
  subcategory?: string;
  detail?: string;
  item?: string;
  q?: string;
  sort?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
  carBrand?: string;
  motoBrand?: string;
  motoType?: string;
  yearFrom?: string;
  yearTo?: string;
  engineVolumeFrom?: string;
  engineVolumeTo?: string;
  fuel?: string;
  transmission?: string;
  body?: string;
  mileageMax?: string;
  carCondition?: string;
  motoCondition?: string;
  approxPrice?: string;
};

function getOrderBy(sort?: string) {
  switch (sort) {
    case "price_asc":
      return { price: "asc" as const };
    case "price_desc":
      return { price: "desc" as const };
    case "views":
      return { views: "desc" as const };
    default:
      return { createdAt: "desc" as const };
  }
}

function parsePageParam(page?: string): number {
  const n = parseInt(page || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function hasActiveFilters(params: HomeCatalogParams) {
  return Boolean(
    params.city ||
      params.category ||
      params.subcategory ||
      params.detail ||
      params.item ||
      params.q ||
      params.minPrice ||
      params.maxPrice ||
      hasTransportSearchFilters(params) ||
      (params.sort && params.sort !== "new")
  );
}

function buildWhere(params: HomeCatalogParams) {
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const priceFilter: { gte?: number; lte?: number } = {};
  if (minPrice !== undefined && !Number.isNaN(minPrice)) priceFilter.gte = minPrice;
  if (maxPrice !== undefined && !Number.isNaN(maxPrice)) priceFilter.lte = maxPrice;

  const carContext = isCarCatalogContext(params.category, params.subcategory);
  const motoContext = isMotoCatalogContext(params.category, params.subcategory);
  const categorySub = carContext
    ? effectiveCarSubcategory(params.subcategory)
    : params.subcategory;

  return {
    status: "ACTIVE" as const,
    ...(params.city ? { city: params.city } : {}),
    ...buildListingCategoryFilter(
      params.category,
      categorySub,
      params.detail,
      params.item
    ),
    ...(motoContext
      ? buildMotoWhere({
          motoBrand: params.motoBrand,
          motoType: params.motoType,
          yearFrom: params.yearFrom,
          yearTo: params.yearTo,
          engineVolumeFrom: params.engineVolumeFrom,
          engineVolumeTo: params.engineVolumeTo,
          fuel: params.fuel,
          mileageMax: params.mileageMax,
          motoCondition: params.motoCondition,
          approxPrice: params.approxPrice,
        })
      : {}),
    ...(carContext
      ? buildVehicleWhere({
          carBrand: params.carBrand,
          yearFrom: params.yearFrom,
          yearTo: params.yearTo,
          fuel: params.fuel,
          transmission: params.transmission,
          body: params.body,
          mileageMax: params.mileageMax,
          carCondition: params.carCondition,
          approxPrice: params.approxPrice,
        })
      : {}),
    ...(params.q
      ? {
          OR: [{ title: { contains: params.q } }, { description: { contains: params.q } }],
        }
      : {}),
    ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
  };
}

export default async function HomeCatalogResults({ params }: { params: HomeCatalogParams }) {
  const page = parsePageParam(params.page);
  const showLanding = !hasActiveFilters(params) && page === 1;
  const where = buildWhere(params);

  let total = 0;
  let listings: HomeListing[] = [];
  let recommended: HomeListing[] = [];
  let popularNearby: HomeListing[] = [];
  let dbUnavailable = false;

  try {
    [total, listings, recommended, popularNearby] = await Promise.all([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: {
          seller: { select: { name: true, storeName: true } },
          ...listingSoldCountInclude,
        },
        orderBy: getOrderBy(params.sort),
        skip: (page - 1) * LISTINGS_PER_PAGE,
        take: LISTINGS_PER_PAGE,
      }),
      showLanding
        ? prisma.listing.findMany({
            where: { status: "ACTIVE" },
            include: listingSoldCountInclude,
            orderBy: { views: "desc" },
            take: 8,
          })
        : Promise.resolve([]),
      showLanding
        ? prisma.listing.findMany({
            where: { status: "ACTIVE" },
            include: listingSoldCountInclude,
            orderBy: { createdAt: "desc" },
            take: 4,
          })
        : Promise.resolve([]),
    ]);
  } catch {
    dbUnavailable = true;
  }

  const totalPages = Math.max(1, Math.ceil(total / LISTINGS_PER_PAGE));
  const baseParams: Record<string, string> = {};
  if (params.city) baseParams.city = params.city;
  if (params.category) baseParams.category = params.category;
  if (params.subcategory) baseParams.subcategory = params.subcategory;
  if (params.detail) baseParams.detail = params.detail;
  if (params.item) baseParams.item = params.item;
  if (params.q) baseParams.q = params.q;
  if (params.sort && params.sort !== "new") baseParams.sort = params.sort;
  if (params.minPrice) baseParams.minPrice = params.minPrice;
  if (params.maxPrice) baseParams.maxPrice = params.maxPrice;
  if (params.carBrand) baseParams.carBrand = params.carBrand;
  if (params.motoBrand) baseParams.motoBrand = params.motoBrand;
  if (params.motoType) baseParams.motoType = params.motoType;
  if (params.yearFrom) baseParams.yearFrom = params.yearFrom;
  if (params.yearTo) baseParams.yearTo = params.yearTo;
  if (params.engineVolumeFrom) baseParams.engineVolumeFrom = params.engineVolumeFrom;
  if (params.engineVolumeTo) baseParams.engineVolumeTo = params.engineVolumeTo;
  if (params.fuel) baseParams.fuel = params.fuel;
  if (params.transmission) baseParams.transmission = params.transmission;
  if (params.body) baseParams.body = params.body;
  if (params.mileageMax) baseParams.mileageMax = params.mileageMax;
  if (params.carCondition) baseParams.carCondition = params.carCondition;
  if (params.motoCondition) baseParams.motoCondition = params.motoCondition;
  if (params.approxPrice) baseParams.approxPrice = params.approxPrice;

  if (dbUnavailable) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Каталог тимчасово недоступний — база даних оновлюється. Спробуйте оновити сторінку через
        кілька хвилин.
      </div>
    );
  }

  return (
    <>
      {showLanding && <HeroSection />}

      {showLanding && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Рекомендовані оголошення</h2>
            <span className="text-sm text-gray-500">{total} всього</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {recommended.map((listing) => (
              <MarketplaceCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {showLanding && popularNearby.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Поблизу вас</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 h-40 md:h-auto min-h-[160px] flex items-center justify-center text-gray-400 text-sm bg-gradient-to-br from-brand-50 to-white">
              <div className="text-center">
                <span className="text-3xl">🗺️</span>
                <p className="mt-2 text-gray-500">Оголошення поруч</p>
              </div>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-3">
              {popularNearby.map((listing) => (
                <MarketplaceCard key={listing.id} listing={listing} badge="new" />
              ))}
            </div>
          </div>
        </section>
      )}

      {showLanding && (
        <Suspense fallback={null}>
          <PopularCategories />
        </Suspense>
      )}

      {(hasActiveFilters(params) || page > 1) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {total} {total === 1 ? "оголошення" : "оголошень"}
              {params.city ? ` · ${params.city.split(",")[0]}` : ""}
              {params.category ? ` · ${params.category}` : ""}
              {params.carBrand ? ` · ${params.carBrand}` : ""}
              {params.motoBrand ? ` · ${params.motoBrand}` : ""}
              {params.motoType ? ` · ${params.motoType}` : ""}
              {params.subcategory ? ` · ${params.subcategory}` : ""}
              {params.detail ? ` · ${params.detail}` : ""}
              {params.item ? ` · ${params.item}` : ""}
            </h2>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center text-gray-500">
              <p className="text-4xl mb-3">🔍</p>
              <p>Оголошень не знайдено</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <MarketplaceCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination page={page} totalPages={totalPages} baseParams={baseParams} />
            </>
          )}
        </section>
      )}

      {showLanding && !hasActiveFilters(params) && (
        <section className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Усі оголошення</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.slice(0, 6).map((listing) => (
              <MarketplaceCard key={`all-${listing.id}`} listing={listing} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function homeCatalogCacheKey(params: HomeCatalogParams): string {
  return [
    params.city ?? "",
    params.category ?? "",
    params.subcategory ?? "",
    params.detail ?? "",
    params.item ?? "",
    params.q ?? "",
    params.sort ?? "",
    params.page ?? "",
    params.minPrice ?? "",
    params.maxPrice ?? "",
    params.carBrand ?? "",
    params.motoBrand ?? "",
    params.motoType ?? "",
    params.yearFrom ?? "",
    params.yearTo ?? "",
    params.engineVolumeFrom ?? "",
    params.engineVolumeTo ?? "",
    params.fuel ?? "",
    params.transmission ?? "",
    params.body ?? "",
    params.mileageMax ?? "",
    params.carCondition ?? "",
    params.motoCondition ?? "",
    params.approxPrice ?? "",
  ].join("|");
}
