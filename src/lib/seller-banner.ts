/** Default cover when seller has not uploaded a banner — real city photo, not abstract color. */
export const DEFAULT_SELLER_BANNER =
  "https://images.unsplash.com/photo-1480714378409-67cf3d894bc4?auto=format&fit=crop&w=1800&q=80";

export function resolveSellerBannerUrl(banner: string | null | undefined): string {
  return banner?.trim() ? banner.trim() : DEFAULT_SELLER_BANNER;
}
