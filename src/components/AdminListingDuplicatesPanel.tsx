"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminListingActions from "@/components/AdminListingActions";
import { LISTING_STATUSES } from "@/lib/constants";
import type { AdminListingDuplicateSibling } from "@/lib/admin-listing-duplicates";
import { formatPrice, formatDate } from "@/lib/utils";

type AdminListingDuplicatesPanelProps = {
  listingTitle: string;
  siblings: AdminListingDuplicateSibling[];
};

export default function AdminListingDuplicatesPanel({
  listingTitle,
  siblings,
}: AdminListingDuplicatesPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (siblings.length <= 1) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 font-medium text-amber-900 hover:bg-amber-100"
      >
        Переглянути дублікати
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Можливі дублікати: ${listingTitle}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Можливі дублікати</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {listingTitle} · знайдено {siblings.length - 1} схожих оголошень. Рішення приймає
                  модератор — нічого не змінюється автоматично.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
              >
                ✕ Закрити
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5 space-y-4">
              {siblings.map((sibling) => (
                <div
                  key={sibling.id}
                  className={`rounded-xl border p-4 ${
                    sibling.isCurrent
                      ? "border-brand-300 bg-brand-50/40"
                      : "border-amber-200 bg-amber-50/20"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/listings/${sibling.id}`}
                          className="font-medium text-brand-800 hover:underline"
                          target="_blank"
                        >
                          {sibling.title}
                        </Link>
                        {sibling.isCurrent && (
                          <span className="rounded-md bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                            Поточне
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatPrice(sibling.price)} · {sibling.city} · {sibling.sellerName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {LISTING_STATUSES[sibling.status] || sibling.status} ·{" "}
                        {formatDate(sibling.createdAt)} · Prom: {sibling.promLabel}
                      </p>
                      <p className="mt-2 text-xs text-amber-900">{sibling.matchReasonLabel}</p>
                      {sibling.sellerEmail && (
                        <p className="mt-1 text-xs text-gray-500">{sibling.sellerEmail}</p>
                      )}
                    </div>
                    <AdminListingActions
                      listingId={sibling.id}
                      status={sibling.status}
                      hasPhotos={sibling.hasPhotos}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
