import { Suspense, type ReactNode } from "react";
import HomeCatalogResults, { homeCatalogCacheKey } from "@/components/HomeCatalogResults";
import HomeCatalogSkeleton from "@/components/HomeCatalogSkeleton";
import MobileCategoryStrip from "@/components/MobileCategoryStrip";
import MobileCatalogFilters from "@/components/MobileCatalogFilters";
import MobileCollapsedFilters from "@/components/MobileCollapsedFilters";
import { HomeLeftSidebar, HomeRightSidebarPanel } from "@/components/HomeSidebars";
import { parsePageParam } from "@/lib/catalog";

export const revalidate = 60;
import { hasTransportSearchFilters } from "@/lib/vehicle";
import { hasPartsSearchFilters } from "@/lib/parts";
import { hasAgriSearchFilters } from "@/lib/agri";

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

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const showLanding = !hasActiveFilters(params) && page === 1;
  const catalogKey = homeCatalogCacheKey(params);

  let filters: ReactNode;
  if (!showLanding) {
    const { default: HomeTransportFilters } = await import("@/components/HomeTransportFilters");
    filters = (
      <HomeTransportFilters category={params.category} subcategory={params.subcategory} />
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 xl:px-4 py-4 xl:py-6">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:gap-6">
        <aside className="xl:col-span-2 hidden xl:block">
          <HomeLeftSidebar />
        </aside>

        <div className="xl:col-span-7">
          {!showLanding && (
            <Suspense fallback={null}>
              <div className="mb-3 xl:hidden space-y-3">
                <MobileCategoryStrip />
                <MobileCatalogFilters />
              </div>
            </Suspense>
          )}

          <Suspense key={catalogKey} fallback={<HomeCatalogSkeleton />}>
            <HomeCatalogResults params={params} />
          </Suspense>

          {!showLanding && (
            <Suspense fallback={null}>
              <MobileCollapsedFilters>{filters}</MobileCollapsedFilters>
            </Suspense>
          )}
        </div>

        <aside className="xl:col-span-3 hidden xl:block">
          <HomeRightSidebarPanel showLanding={showLanding} transportFilters={!showLanding ? filters : undefined} />
        </aside>
      </div>
    </div>
  );
}
