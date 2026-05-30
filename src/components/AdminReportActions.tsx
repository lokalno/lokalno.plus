"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

type AdminReportActionsProps = {
  reportId: string;
  listingId: string;
};

export default function AdminReportActions({ reportId, listingId }: AdminReportActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve(hideListing: boolean) {
    setLoading(true);
    await fetch(`/api/admin/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", hideListing }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2 shrink-0">
      <Link
        href={`/listings/${listingId}`}
        className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
      >
        Переглянути
      </Link>
      <button
        onClick={() => resolve(false)}
        disabled={loading}
        className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
      >
        Вирішено
      </button>
      <button
        onClick={() => resolve(true)}
        disabled={loading}
        className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
      >
        Приховати товар
      </button>
    </div>
  );
}
