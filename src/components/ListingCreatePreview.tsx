"use client";

import { useState } from "react";
import { CONDITIONS } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

type ListingCreatePreviewProps = {
  title: string;
  description: string;
  price: string;
  city: string;
  itemLocation: string;
  stock: string;
  brand: string;
  categoryLabel: string;
  condition: string;
  photos: string[];
};

function PreviewMetaRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-gray-600">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function ListingCreatePreview({
  title,
  description,
  price,
  city,
  itemLocation,
  stock,
  brand,
  categoryLabel,
  condition,
  photos,
}: ListingCreatePreviewProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const numericPrice = Number(price);
  const displayTitle = title.trim() || "Назва товару";
  const displayCity = city.trim() || "Місто";
  const displayItemLocation = itemLocation.trim();
  const displayDescription =
    description.trim() ||
    "Тут з’явиться опис вашого товару. Заповніть поле «Опис» зліва.";
  const activePhoto = photos[photoIndex] ?? photos[0];

  return (
    <div className="lg:sticky lg:top-24">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Попередній перегляд</h2>
        <p className="mt-1 text-sm text-gray-500">
          Так ваше оголошення побачать інші користувачі
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative aspect-[4/3] bg-gray-100">
          {activePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activePhoto} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Додайте фото товару
            </div>
          )}
          {photos.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {photos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPhotoIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === photoIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Фото ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3 p-5">
          <h3 className="text-lg font-semibold leading-snug text-gray-900">{displayTitle}</h3>
          <p className="text-2xl font-bold text-gray-900">
            {numericPrice > 0 ? formatPrice(numericPrice) : "0 ₴"}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {displayCity}
          </p>
          {displayItemLocation && (
            <p className="flex items-start gap-1.5 text-sm text-amber-900">
              <span className="mt-0.5 shrink-0">📍</span>
              <span>
                <span className="font-medium">Позиція на складі:</span>{" "}
                <span className="font-mono">{displayItemLocation}</span>
              </span>
            </p>
          )}
          <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{displayDescription}</p>

          <div className="space-y-2 border-t border-gray-100 pt-4">
            <PreviewMetaRow
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              }
              label={`Стан: ${CONDITIONS[condition] || condition}`}
            />
            <PreviewMetaRow
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              }
              label={categoryLabel}
            />
            {brand.trim() && (
              <PreviewMetaRow
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                }
                label={`Бренд: ${brand.trim()}`}
              />
            )}
            <PreviewMetaRow
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              }
              label={`Кількість: ${Number(stock) > 0 ? stock : "1"}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
