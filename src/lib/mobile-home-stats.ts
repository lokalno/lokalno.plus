import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export type MobileHomeStats = {
  listingsCount: number;
  sellersCount: number;
  categoryCounts: { category: string; count: number }[];
};

const MOBILE_FEATURED_CATEGORIES = [
  "Транспорт",
  "Електроніка",
  "Нерухомість",
  "Дім і сад",
  "Одяг і взуття",
] as const;

async function loadMobileHomeStats(): Promise<MobileHomeStats> {
  try {
    const [listingsCount, sellersGrouped, categoryGrouped] = await Promise.all([
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.findMany({
        where: { status: "ACTIVE" },
        select: { sellerId: true },
        distinct: ["sellerId"],
      }),
      prisma.listing.groupBy({
        by: ["category"],
        where: { status: "ACTIVE" },
        _count: { category: true },
      }),
    ]);

    const countMap = new Map(categoryGrouped.map((row) => [row.category, row._count.category]));

    return {
      listingsCount,
      sellersCount: sellersGrouped.length,
      categoryCounts: MOBILE_FEATURED_CATEGORIES.map((category) => ({
        category,
        count: countMap.get(category) ?? 0,
      })),
    };
  } catch {
    return {
      listingsCount: 0,
      sellersCount: 0,
      categoryCounts: MOBILE_FEATURED_CATEGORIES.map((category) => ({
        category,
        count: 0,
      })),
    };
  }
}

export const getMobileHomeStats = unstable_cache(
  loadMobileHomeStats,
  ["mobile-home-stats-v1"],
  { revalidate: 120 }
);

export function formatStatCount(value: number): string {
  return `${value.toLocaleString("uk-UA")}+`;
}
