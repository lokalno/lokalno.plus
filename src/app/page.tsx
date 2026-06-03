import { Suspense } from "react";
import CategorySidebar from "@/components/CategorySidebar";
import PopularCitiesSidebar from "@/components/PopularCitiesSidebar";
import SearchFilters from "@/components/SearchFilters";
import CarSearchFilters from "@/components/CarSearchFilters";
import MotoSearchFilters from "@/components/MotoSearchFilters";
import TruckSearchFilters from "@/components/TruckSearchFilters";
import PartsSearchFilters from "@/components/PartsSearchFilters";
import AgriSearchFilters from "@/components/AgriSearchFilters";
import HomeRightSidebar from "@/components/HomeRightSidebar";
import HomeCatalogResults, { homeCatalogCacheKey } from "@/components/HomeCatalogResults";
import HomeCatalogSkeleton from "@/components/HomeCatalogSkeleton";
import { getPopularCities, getLatestSidebarListings } from "@/lib/home-sidebar-cache";
import { parsePageParam } from "@/lib/catalog";
import {
  hasTransportSearchFilters,
  isCarCatalogContext,
  isMotoCatalogContext,
  isTruckCatalogContext,
} from "@/lib/vehicle";
import { hasPartsSearchFilters, isPartsCatalogContext } from "@/lib/parts";
import { hasAgriSearchFilters, isAgriCatalogContext } from "@/lib/agri";

type SearchParams = Promise<{
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
  truckBrand?: string;
  truckType?: string;
  yearFrom?: string;
  yearTo?: string;
  engineVolumeFrom?: string;
  engineVolumeTo?: string;
  loadCapacityMin?: string;
  loadCapacityMax?: string;
  fuel?: string;
  transmission?: string;
  body?: string;
  mileageMax?: string;
  carCondition?: string;
  motoCondition?: string;
  truckCondition?: string;
  approxPrice?: string;
  partFor?: string;
  partType?: string;
  partPopular?: string;
  partBrand?: string;
  partsCondition?: string;
  agriBrand?: string;
  agriType?: string;
  agriCondition?: string;
}>;

function hasActiveFilters(params: Record<string, string | undefined>) {
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
      hasPartsSearchFilters(params) ||
      hasAgriSearchFilters(params) ||
      (params.sort && params.sort !== "new")
  );
}

function transportFilters(params: { category?: string; subcategory?: string }) {
  if (isAgriCatalogContext(params.category, params.subcategory)) {
    return <AgriSearchFilters />;
  }
  if (isPartsCatalogContext(params.category, params.subcategory)) {
    return <PartsSearchFilters />;
  }
  if (isTruckCatalogContext(params.category, params.subcategory)) {
    return <TruckSearchFilters />;
  }
  if (isMotoCatalogContext(params.category, params.subcategory)) {
    return <MotoSearchFilters />;
  }
  if (isCarCatalogContext(params.category, params.subcategory)) {
    return <CarSearchFilters />;
  }
  return <SearchFilters />;
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const showLanding = !hasActiveFilters(params) && page === 1;

  const [popularCities, latestListings] = await Promise.all([
    getPopularCities(),
    getLatestSidebarListings(),
  ]);

  const catalogKey = homeCatalogCacheKey(params);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-2 hidden lg:block">
          <Suspense fallback={<div className="h-64 bg-white rounded-xl border animate-pulse" />}>
            <CategorySidebar />
          </Suspense>
          <PopularCitiesSidebar cities={popularCities} />
        </aside>

        <div className="lg:col-span-7">
          {!showLanding && (
            <Suspense fallback={null}>
              <div className="mb-4 space-y-4 lg:hidden">
                <CategorySidebar />
                {transportFilters(params)}
              </div>
            </Suspense>
          )}

          <Suspense key={catalogKey} fallback={<HomeCatalogSkeleton />}>
            <HomeCatalogResults params={params} />
          </Suspense>
        </div>

        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {!showLanding && <Suspense fallback={null}>{transportFilters(params)}</Suspense>}
            <HomeRightSidebar latestListings={latestListings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
