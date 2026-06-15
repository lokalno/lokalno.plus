const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"] as const;

export const LISTING_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export function isListingVideo(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith("data:video/")) return true;

  const path = url.split("?")[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

export function isListingImage(url: string): boolean {
  return !isListingVideo(url);
}

export function isAllowedListingVideoMime(type: string): boolean {
  return LISTING_VIDEO_MIME_TYPES.includes(type as (typeof LISTING_VIDEO_MIME_TYPES)[number]);
}

export function listingMediaKindLabel(url: string): "відео" | "фото" {
  return isListingVideo(url) ? "відео" : "фото";
}
