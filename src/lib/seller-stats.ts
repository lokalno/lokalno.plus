export function formatStars(rating: number): string {
  const full = Math.round(rating);
  return "⭐".repeat(Math.min(5, Math.max(0, full)));
}

export function getRatingLabel(count: number): string {
  if (count === 0) return "Немає відгуків";
  if (count === 1) return "1 відгук";
  if (count >= 2 && count <= 4) return `${count} відгуки`;
  return `${count} відгуків`;
}

export function getFollowerLabel(count: number): string {
  if (count === 0) return "Немає підписників";
  if (count === 1) return "1 підписник";
  if (count >= 2 && count <= 4) return `${count} підписники`;
  return `${count} підписників`;
}

export function isVerifiedSeller(reviewCount: number, avgRating: number | null): boolean {
  return reviewCount >= 5 && avgRating !== null && avgRating >= 4.5;
}

export type SellerLevel = "NEW" | "TRUSTED" | "TOP";

export function getSellerLevel(params: {
  listingCount: number;
  reviewCount: number;
  avgRating: number | null;
  followerCount: number;
}): SellerLevel {
  const { listingCount, reviewCount, avgRating, followerCount } = params;

  if (
    reviewCount >= 10 &&
    avgRating !== null &&
    avgRating >= 4.5 &&
    listingCount >= 5 &&
    followerCount >= 5
  ) {
    return "TOP";
  }

  if (
    isVerifiedSeller(reviewCount, avgRating) ||
    (reviewCount >= 3 && avgRating !== null && avgRating >= 4) ||
    listingCount >= 8
  ) {
    return "TRUSTED";
  }

  return "NEW";
}

export const SELLER_LEVEL_LABELS: Record<SellerLevel, string> = {
  NEW: "New Seller",
  TRUSTED: "Trusted Seller",
  TOP: "Top Seller",
};

export const SELLER_LEVEL_STYLES: Record<SellerLevel, string> = {
  NEW: "bg-slate-500/25 border-slate-200/30 text-slate-100",
  TRUSTED: "bg-emerald-500/25 border-emerald-200/35 text-emerald-50",
  TOP: "bg-amber-500/30 border-amber-200/40 text-amber-50",
};
