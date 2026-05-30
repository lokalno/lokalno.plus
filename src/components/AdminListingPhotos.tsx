"use client";

import { useEffect, useState } from "react";

type AdminListingPhotosProps = {
  listingId: string;
};

function isBrokenPhotoUrl(photo: string): boolean {
  return photo.startsWith("/uploads/");
}

export default function AdminListingPhotos({ listingId }: AdminListingPhotosProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/listings/${listingId}/photos`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPhotos(Array.isArray(data.photos) ? data.photos : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  function markFailed(index: number) {
    setFailed((prev) => new Set(prev).add(index));
  }

  function photoBroken(index: number): boolean {
    const photo = photos[index];
    return !photo || isBrokenPhotoUrl(photo) || failed.has(index);
  }

  const hasBrokenPhotos = photos.some((photo, index) => photoBroken(index));

  if (loading) {
    return (
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border bg-gray-100 animate-pulse shrink-0" />
    );
  }

  if (photos.length === 0) {
    return (
      <div className="shrink-0 space-y-1">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border bg-gray-100 flex items-center justify-center text-3xl">
          📦
        </div>
        <p className="text-[10px] text-red-600 max-w-[112px]">Фото відсутні в базі</p>
      </div>
    );
  }

  const previewBroken = photoBroken(0);

  return (
    <div className="shrink-0 space-y-2">
      {previewBroken ? (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-red-200 bg-red-50 flex flex-col items-center justify-center text-center p-2">
          <span className="text-2xl">⚠️</span>
          <span className="text-[10px] text-red-700 mt-1 leading-tight">
            Фото не завантажилось
          </span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={photos[0]}
          alt=""
          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border bg-gray-100"
          onError={() => markFailed(0)}
        />
      )}

      {photos.length > 1 && (
        <div className="flex flex-wrap gap-1 max-w-[112px]">
          {photos.slice(1, 5).map((photo, i) => {
            const index = i + 1;
            const isBroken = photoBroken(index);
            return isBroken ? (
              <div
                key={index}
                className="w-12 h-12 rounded-lg border border-red-200 bg-red-50 flex items-center justify-center text-xs"
              >
                ⚠️
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={index}
                src={photo}
                alt=""
                className="w-12 h-12 object-cover rounded-lg border bg-gray-100"
                onError={() => markFailed(index)}
              />
            );
          })}
        </div>
      )}

      {hasBrokenPhotos && (
        <p className="text-[10px] text-amber-800 max-w-[112px] leading-tight">
          Попросіть продавця відредагувати оголошення і завантажити фото знову.
        </p>
      )}
    </div>
  );
}
