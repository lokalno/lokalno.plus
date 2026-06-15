import OptimizedListingImage from "@/components/OptimizedListingImage";
import { isListingVideo } from "@/lib/listing-media";

type ListingMediaPreviewProps = {
  src: string;
  alt?: string;
  className?: string;
  mediaClassName?: string;
  priority?: boolean;
  showPlayBadge?: boolean;
  controls?: boolean;
};

export default function ListingMediaPreview({
  src,
  alt = "",
  className = "",
  mediaClassName = "object-cover",
  priority = false,
  showPlayBadge = false,
  controls = false,
}: ListingMediaPreviewProps) {
  if (isListingVideo(src)) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <video
          src={src}
          className={`h-full w-full ${mediaClassName}`}
          muted={!controls}
          playsInline
          preload="metadata"
          controls={controls}
        />
        {showPlayBadge && !controls && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-base text-white">
              ▶
            </span>
          </span>
        )}
      </div>
    );
  }

  const isRemote = src.startsWith("https://") || src.startsWith("http://");

  if (isRemote) {
    return (
      <div className={`relative ${className}`}>
        <OptimizedListingImage
          src={src}
          alt={alt}
          priority={priority}
          className={mediaClassName}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`${className} ${mediaClassName}`} loading={priority ? "eager" : "lazy"} />
  );
}
