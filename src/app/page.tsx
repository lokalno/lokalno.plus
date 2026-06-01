import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CategorySidebar from "@/components/CategorySidebar";
import PopularCitiesSidebar from "@/components/PopularCitiesSidebar";
import SearchFilters from "@/components/SearchFilters";
import HeroSection from "@/components/HeroSection";
import PopularCategories from "@/components/PopularCategories";
import MarketplaceCard from "@/components/MarketplaceCard";
import HomeRightSidebar from "@/components/HomeRightSidebar";
import Pagination from "@/components/Pagination";
import { LISTINGS_PER_PAGE, parsePageParam } from "@/lib/catalog";
import type { ListingWithSoldCount } from "@/lib/listing-sales";

type HomeListing = ListingWithSoldCount & {
  id: string;
  title: string;
  price: number;
  city: string;
  photos: string;
  createdAt: Date;
  views?: number;
  seller?: { name: string };
};

const listingSoldCountInclude = {
  _count: {
    select: {
      orders: { where: { paymentStatus: "PAID" as const } },
      favorites: true,
    },
  },
};

type SearchParams = Promise<{
  city?: string;
  category?: string;
  q?: string;
  sort?: string;
  page?: string;
  minPrice?: string;
  maxPrice?: string;
}>;

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

function hasActiveFilters(params: {
  city?: string;
  category?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  return Boolean(
    params.city ||
      params.category ||
      params.q ||
      params.minPrice ||
      params.maxPrice ||
      (params.sort && params.sort !== "new")
  );
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = parsePageParam(params.page);
  const showLanding = !hasActiveFilters(params) && page === 1;

  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;

  const priceFilter: { gte?: number; lte?: number } = {};
  if (minPrice !== undefined && !Number.isNaN(minPrice)) priceFilter.gte = minPrice;
  if (maxPrice !== undefined && !Number.isNaN(maxPrice)) priceFilter.lte = maxPrice;

  const where = {
    status: "ACTIVE" as const,
    ...(params.city ? { city: params.city } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.q
      ? {
          OR: [
            { title: { contains: params.q } },
            { description: { contains: params.q } },
          ],
        }
      : {}),
    ...(Object.keys(priceFilter).length > 0 ? { price: priceFilter } : {}),
  };

  let total = 0;
  let listings: HomeListing[] = [];
  let recommended: HomeListing[] = [];
  let popularNearby: HomeListing[] = [];
  let latestListings: {
    id: string;
    title: string;
    price: number;
    photos: string;
    createdAt: Date;
  }[] = [];
  let cityGroups: { city: string; _count: { city: number } }[] = [];
  let sellerRows: {
    id: string;
    name: string;
    avatar: string | null;
    listings: { id: string }[];
    reviewsReceived: { rating: number }[];
    _count: { followers: number };
  }[] = [];
  let dbUnavailable = false;

  try {
    [total, listings, recommended, popularNearby, latestListings, cityGroups, sellerRows] =
      await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      include: {
        seller: { select: { name: true } },
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
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, price: true, photos: true, createdAt: true },
    }),
    prisma.listing.groupBy({
      by: ["city"],
      where: { status: "ACTIVE" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),
    prisma.user.findMany({
      where: { banned: false, listings: { some: { status: "ACTIVE" } } },
      select: {
        id: true,
        name: true,
        avatar: true,
        listings: { where: { status: "ACTIVE" }, select: { id: true } },
        reviewsReceived: { select: { rating: true } },
        _count: { select: { followers: true } },
      },
      take: 30,
    }),
  ]);
  } catch {
    dbUnavailable = true;
  }

  const popularCities = cityGroups.map((g) => ({ city: g.city, count: g._count.city }));

  const bestSellers = sellerRows
    .map((s) => ({
      id: s.id,
      name: s.name,
      avatar: s.avatar,
      listingCount: s.listings.length,
      avgRating:
        s.reviewsReceived.length > 0
          ? s.reviewsReceived.reduce((a, r) => a + r.rating, 0) / s.reviewsReceived.length
          : null,
      followers: s._count.followers,
    }))
    .sort((a, b) => {
      const scoreA = (a.avgRating ?? 0) * 10 + a.listingCount + a.followers;
      const scoreB = (b.avgRating ?? 0) * 10 + b.listingCount + b.followers;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const totalPages = Math.max(1, Math.ceil(total / LISTINGS_PER_PAGE));
  const baseParams: Record<string, string> = {};
  if (params.city) baseParams.city = params.city;
  if (params.category) baseParams.category = params.category;
  if (params.q) baseParams.q = params.q;
  if (params.sort && params.sort !== "new") baseParams.sort = params.sort;
  if (params.minPrice) baseParams.minPrice = params.minPrice;
  if (params.maxPrice) baseParams.maxPrice = params.maxPrice;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {dbUnavailable && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Каталог тимчасово недоступний — база даних оновлюється. Спробуйте оновити сторінку через
          кілька хвилин.
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left sidebar */}
        <aside className="lg:col-span-2 hidden lg:block">
          <Suspense fallback={<div className="h-64 bg-white rounded-xl border animate-pulse" />}>
            <CategorySidebar />
          </Suspense>
          <PopularCitiesSidebar cities={popularCities} />
        </aside>

        {/* Main content */}
        <div className="lg:col-span-7">
          {showLanding && <HeroSection />}

          {!showLanding && (
            <Suspense fallback={null}>
              <div className="mb-4 lg:hidden">
                <SearchFilters />
              </div>
            </Suspense>
          )}

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

          {showLanding && hasActiveFilters(params) === false && (
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
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {!showLanding && (
              <Suspense fallback={null}>
                <SearchFilters />
              </Suspense>
            )}
            <HomeRightSidebar bestSellers={bestSellers} latestListings={latestListings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
