export const LISTINGS_PER_PAGE = 24;

export function parsePageParam(page?: string): number {
  const n = parseInt(page || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
