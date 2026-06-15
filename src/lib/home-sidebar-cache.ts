import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { withListingCoverPhotoOnly } from "@/lib/listing-photos";

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
    }).then((rows) => rows.map(withListingCoverPhotoOnly)),
  ["home-latest-listings-v2"],
  { revalidate: 60 }
);

export const getPopularSidebarListings = unstable_cache(
  async () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentPopular = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        views: { gt: 0 },
        createdAt: { gte: weekAgo },
      },
      orderBy: [{ views: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        price: true,
        photos: true,
        views: true,
        city: true,
      },
    });

    const result =
      recentPopular.length >= 3
        ? recentPopular
        : await prisma.listing.findMany({
            where: { status: "ACTIVE", views: { gt: 0 } },
            orderBy: [{ views: "desc" }, { createdAt: "desc" }],
            take: 5,
            select: {
              id: true,
              title: true,
              price: true,
              photos: true,
              views: true,
              city: true,
            },
          });

    return result.map(withListingCoverPhotoOnly);
  },
  ["home-popular-listings-v2"],
  { revalidate: 120 }
);
