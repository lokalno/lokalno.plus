"use client";

import { useState } from "react";
import Link from "next/link";
import { getDuplicateReasonLabel, type AdminListingDuplicateReport } from "@/lib/admin-listing-duplicates";

type AdminListingDuplicateReportBannerProps = {
  report: AdminListingDuplicateReport;
  listingTitles: Record<string, string>;
};

export default function AdminListingDuplicateReportBanner({
  report,
  listingTitles,
}: AdminListingDuplicateReportBannerProps) {
  const [expanded, setExpanded] = useState(false);

  if (report.duplicateGroupCount === 0) {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="font-medium text-green-900">
          На модерації: {report.totalPending} оголошень · можливих дублікатів не знайдено
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div>
        <p className="font-medium text-amber-950">
          На модерації: {report.totalPending} оголошень · можливих дублікатів:{" "}
          {report.duplicateListingCount} у {report.duplicateGroupCount} групах
        </p>
        <p className="text-sm text-amber-900 mt-1">
          Це лише підказка для модератора. Нічого не видаляється і не відхиляється автоматично.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="text-sm font-medium text-amber-950 underline underline-offset-2"
      >
        {expanded ? "Сховати звіт дублікатів" : "Показати звіт дублікатів"}
      </button>

      {expanded && (
        <div className="space-y-3">
          {report.groups.slice(0, 10).map((group) => (
            <div key={group.groupKey} className="rounded-lg border border-amber-200 bg-white/70 p-3">
              <p className="text-sm font-medium text-gray-900">
                {getDuplicateReasonLabel(group.reason)} · {group.listingIds.length} оголошень
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {group.listingIds.slice(0, 5).map((listingId) => (
                  <li key={listingId}>
                    <Link href={`/listings/${listingId}`} className="text-brand-700 hover:underline">
                      {listingTitles[listingId] ?? listingId}
                    </Link>
                  </li>
                ))}
                {group.listingIds.length > 5 && (
                  <li className="text-gray-500">… і ще {group.listingIds.length - 5}</li>
                )}
              </ul>
            </div>
          ))}
          {report.groups.length > 10 && (
            <p className="text-sm text-gray-600">… і ще {report.groups.length - 10} груп</p>
          )}
        </div>
      )}
    </div>
  );
}
