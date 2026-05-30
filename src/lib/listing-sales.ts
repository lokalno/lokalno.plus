import { formatListingStock } from "@/lib/listing-stock";

export const listingSoldCountInclude = {
  _count: {
    select: {
      orders: {
        where: { paymentStatus: "PAID" },
      },
    },
  },
} as const;

export type ListingWithSoldCount = {
  _count?: { orders: number };
};

export function getListingSoldCount(listing: ListingWithSoldCount): number {
  return listing._count?.orders ?? 0;
}

export function formatSoldCount(count: number): string {
  if (count <= 0) return "0 шт.";
  return formatListingStock(count);
}

export function formatSoldCountLabel(count: number): string {
  const n = Math.abs(count);
  if (n === 0) return "0 продаж";
  if (n % 10 === 1 && n % 100 !== 11) return `${n} продаж`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} продажі`;
  return `${n} продажів`;
}
