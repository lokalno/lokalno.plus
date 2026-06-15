const NEXT_IMAGE_HOST_SUFFIXES = [".public.blob.vercel-storage.com"] as const;

const NEXT_IMAGE_HOSTS = new Set(["picsum.photos", "images.unsplash.com"]);

/** URLs allowed through next/image optimization (must match next.config remotePatterns). */
export function isNextImageOptimizableUrl(src: string): boolean {
  if (!src.startsWith("http://") && !src.startsWith("https://")) {
    return false;
  }

  try {
    const { hostname } = new URL(src);
    if (NEXT_IMAGE_HOSTS.has(hostname)) return true;
    return NEXT_IMAGE_HOST_SUFFIXES.some(
      (suffix) => hostname === suffix.slice(1) || hostname.endsWith(suffix)
    );
  } catch {
    return false;
  }
}

export function isExternalListingPhotoUrl(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  if (url.startsWith("data:")) return false;
  if (url.includes(".public.blob.vercel-storage.com")) return false;
  return true;
}
