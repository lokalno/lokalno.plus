"use client";

import { useState } from "react";
import PhotoLightbox from "@/components/PhotoLightbox";
import FavoriteButton from "@/components/FavoriteButton";
import OptimizedListingImage from "@/components/OptimizedListingImage";

type ListingGalleryProps = {
  photos: string[];
  title: string;
  compact?: boolean;
  favorite?: {
    listingId: string;
    isLoggedIn: boolean;
    initialFavorited: boolean;
  };
};

const COMPACT_GALLERY_MAX = "max-w-[calc(260px+6cm)]";
const COMPACT_GALLERY_HEIGHT = "max-h-[calc(260px+6cm)]";

export default function ListingGallery({
  photos,
  title,
  compact = false,
  favorite,
}: ListingGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const main = photos[active] || photos[0];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setActive(index);
    setLightboxOpen(true);
  }

  function showPrev() {
    if (photos.length <= 1) return;
    setActive((index) => (index - 1 + photos.length) % photos.length);
  }

  function showNext() {
    if (photos.length <= 1) return;
    setActive((index) => (index + 1) % photos.length);
  }

  if (photos.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-4xl ${
          compact ? `aspect-[4/5] w-full ${COMPACT_GALLERY_MAX} ${COMPACT_GALLERY_HEIGHT}` : "aspect-square"
        }`}
      >
        📦
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-2 ${compact ? `w-full ${COMPACT_GALLERY_MAX}` : ""}`}>
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {favorite && (
            <FavoriteButton
              listingId={favorite.listingId}
              isLoggedIn={favorite.isLoggedIn}
              initialFavorited={favorite.initialFavorited}
              variant="gallery"
            />
          )}

          <button
            type="button"
            onClick={() => openLightbox(active)}
            className={`group relative block w-full cursor-zoom-in ${
              compact ? `aspect-[4/5] ${COMPACT_GALLERY_HEIGHT}` : "aspect-square"
            }`}
            aria-label="Відкрити фото на весь екран"
          >
            <OptimizedListingImage
              src={main}
              alt={title}
              priority
              className="object-cover transition group-hover:brightness-[0.98]"
            />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                className={`absolute left-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-md transition hover:bg-white ${
                  compact ? "h-8 w-8 text-base" : "left-3 h-10 w-10 text-lg"
                }`}
                aria-label="Попереднє фото"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={showNext}
                className={`absolute right-2 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 shadow-md transition hover:bg-white ${
                  compact ? "h-8 w-8 text-base" : "right-3 h-10 w-10 text-lg"
                }`}
                aria-label="Наступне фото"
              >
                ›
              </button>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  compact ? "h-11 w-11" : "h-16 w-16"
                } ${
                  active === i ? "border-brand-600 ring-1 ring-brand-600" : "border-gray-200"
                }`}
                aria-label={`Фото ${i + 1}`}
                aria-current={active === i ? "true" : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        title={title}
      />
    </>
  );
}
