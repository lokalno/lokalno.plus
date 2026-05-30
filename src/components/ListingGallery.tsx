"use client";

import { useState } from "react";
import PhotoLightbox from "@/components/PhotoLightbox";

type ListingGalleryProps = {
  photos: string[];
  title: string;
};

export default function ListingGallery({ photos, title }: ListingGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const main = photos[active] || photos[0];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setActive(index);
    setLightboxOpen(true);
  }

  if (photos.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
        📦
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => openLightbox(active)}
          className="relative block w-full rounded-xl border overflow-hidden group cursor-zoom-in"
          aria-label="Відкрити фото на весь екран"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={main}
            alt={title}
            className="w-full aspect-square object-cover group-hover:brightness-95 transition"
          />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">
            🔍 На весь екран
          </span>
        </button>

        {photos.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => openLightbox(i)}
                className={`aspect-square rounded-lg overflow-hidden border-2 cursor-zoom-in ${
                  active === i ? "border-brand-600" : "border-transparent"
                }`}
                aria-label={`Відкрити фото ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center">
          {photos.length} фото · натисніть, щоб відкрити
        </p>
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
