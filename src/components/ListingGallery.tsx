"use client";

import { useState } from "react";
import { parsePhotos } from "@/lib/utils";

type ListingGalleryProps = {
  photos: string[];
  title: string;
};

export default function ListingGallery({ photos, title }: ListingGalleryProps) {
  const [active, setActive] = useState(0);
  const main = photos[active] || photos[0];

  if (photos.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
        📦
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={main}
        alt={title}
        className="w-full aspect-square object-cover rounded-xl border"
      />
      {photos.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square rounded-lg overflow-hidden border-2 ${
                active === i ? "border-brand-600" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 text-center">{photos.length} фото</p>
    </div>
  );
}
