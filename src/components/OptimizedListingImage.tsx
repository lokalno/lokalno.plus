import Image from "next/image";
import { isNextImageOptimizableUrl } from "@/lib/listing-image-hosts";

type OptimizedListingImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export default function OptimizedListingImage({
  src,
  alt,
  className = "object-cover",
  priority = false,
}: OptimizedListingImageProps) {
  if (!isNextImageOptimizableUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 240px"
      className={className}
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
