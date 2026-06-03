import { Suspense } from "react";
import CategorySidebar from "@/components/CategorySidebar";
import PopularCitiesSidebar from "@/components/PopularCitiesSidebar";
import SearchFilters from "@/components/SearchFilters";
import CarSearchFilters from "@/components/CarSearchFilters";
import MotoSearchFilters from "@/components/MotoSearchFilters";
import HomeRightSidebar from "@/components/HomeRightSidebar";
import HomeCatalogResults, { homeCatalogCacheKey } from "@/components/HomeCatalogResults";
import HomeCatalogSkeleton from "@/components/HomeCatalogSkeleton";
import { getPopularCities, getLatestSidebarListings } from "@/lib/home-sidebar-cache";
import { parsePageParam } from "@/lib/catalog";
import {
  hasTransportSearchFilters,
  isCarCatalogContext,
  isMotoCatalogContext,
} from "@/lib/vehicle";

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
}>;

function hasActiveFilters(params: {
  city?: string;
  category?: string;
  subcategory?: string;
  detail?: string;
  item?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
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
}) {
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

function transportFilters(params: {
  category?: string;
  subcategory?: string;
}) {
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
              <div className="mb-4 lg:hidden">{transportFilters(params)}</div>
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
