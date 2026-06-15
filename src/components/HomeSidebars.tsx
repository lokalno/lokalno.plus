import { Suspense, type ReactNode } from "react";
import CategorySidebar from "@/components/CategorySidebar";
import PopularCitiesSidebar from "@/components/PopularCitiesSidebar";
import { getPopularCities, getLatestSidebarListings, getPopularSidebarListings } from "@/lib/home-sidebar-cache";
import HomeRightSidebar from "@/components/HomeRightSidebar";
import HomeHowItWorks from "@/components/HomeHowItWorks";
import HomePopularListings from "@/components/HomePopularListings";

type HomeSidebarsProps = {
  showLanding: boolean;
  transportFilters?: ReactNode;
};

async function LeftSidebar() {
  const cities = await getPopularCities();
  return (
    <>
      <Suspense fallback={<div className="h-64 bg-white rounded-xl border animate-pulse" />}>
        <CategorySidebar />
      </Suspense>
      <PopularCitiesSidebar cities={cities} />
    </>
  );
}

async function RightSidebar({ showLanding, transportFilters }: HomeSidebarsProps) {
  const [latestListings, popularListings] = await Promise.all([
    getLatestSidebarListings(),
    showLanding ? getPopularSidebarListings() : Promise.resolve([]),
  ]);

  return (
    <div className="sticky top-20 space-y-4">
      {!showLanding && transportFilters}
      {showLanding && <HomeHowItWorks />}
      {showLanding && <HomePopularListings listings={popularListings} />}
      <HomeRightSidebar latestListings={latestListings} />
    </div>
  );
}

export function HomeLeftSidebar() {
  return (
    <Suspense fallback={<div className="h-64 bg-white rounded-xl border animate-pulse" />}>
      <LeftSidebar />
    </Suspense>
  );
}

export function HomeRightSidebarPanel({ showLanding, transportFilters }: HomeSidebarsProps) {
  return (
    <Suspense fallback={<div className="h-48 bg-white rounded-xl border animate-pulse" />}>
      <RightSidebar showLanding={showLanding} transportFilters={transportFilters} />
    </Suspense>
  );
}
