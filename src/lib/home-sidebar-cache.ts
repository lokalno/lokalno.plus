import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getPopularCities = unstable_cache(
  async () => {
    const cityGroups = await prisma.listing.groupBy({
      by: ["city"],
      where: { status: "ACTIVE" },
      _count: { city: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    });
    return cityGroups.map((g) => ({ city: g.city, count: g._count.city }));
  },
  ["home-popular-cities-v1"],
  { revalidate: 120 }
);

export const getLatestSidebarListings = unstable_cache(
  async () =>
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, price: true, photos: true, createdAt: true },
    }),
  ["home-latest-listings-v1"],
  { revalidate: 60 }
);
