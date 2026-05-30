"use client";

import { useEffect, useState } from "react";

type PhotoLightboxProps = {
  photos: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  title?: string;
};

export default function PhotoLightbox({
  photos,
  initialIndex = 0,
  open,
  onClose,
  title,
}: PhotoLightboxProps) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") {
        setIndex((current) => Math.max(0, current - 1));
      }
      if (event.key === "ArrowRight") {
        setIndex((current) => Math.min(photos.length - 1, current + 1));
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, photos.length]);

  if (!open || photos.length === 0) return null;

  const photo = photos[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Перегляд фото"}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 px-3 py-2 text-sm font-medium text-white hover:bg-black/70"
      >
        ✕ Закрити
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            disabled={index === 0}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => Math.max(0, current - 1));
            }}
            className="absolute left-3 sm:left-6 z-10 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Попереднє фото"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={index === photos.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => Math.min(photos.length - 1, current + 1));
            }}
            className="absolute right-3 sm:right-6 z-10 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70 disabled:opacity-30"
            aria-label="Наступне фото"
          >
            ›
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {index + 1} / {photos.length}
          </p>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo}
        alt={title || `Фото ${index + 1}`}
        className="max-h-[92vh] max-w-[92vw] object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
