"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminListingActionsProps = {
  listingId: string;
  status: string;
};

export default function AdminListingActions({ listingId, status }: AdminListingActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteListing() {
    if (!confirm("Видалити оголошення?")) return;
    setLoading(true);
    await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 flex-wrap shrink-0">
      {status === "PENDING" && (
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading}
          className="text-sm bg-brand-600 text-white px-4 py-2 rounded-xl hover:bg-brand-700 font-semibold"
        >
          ✓ Підтвердити
        </button>
      )}
      {status === "ACTIVE" ? (
        <button
          onClick={() => updateStatus("HIDDEN")}
          disabled={loading}
          className="text-sm border px-3 py-1 rounded-lg hover:bg-gray-50"
        >
          Приховати
        </button>
      ) : status !== "PENDING" ? (
        <button
          onClick={() => updateStatus("ACTIVE")}
          disabled={loading}
          className="text-sm bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
        >
          Показати
        </button>
      ) : null}
      <button
        onClick={deleteListing}
        disabled={loading}
        className="text-sm text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
      >
        Видалити
      </button>
    </div>
  );
}
