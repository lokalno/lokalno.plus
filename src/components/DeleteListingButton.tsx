"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteListingButtonProps = {
  listingId: string;
  listingTitle?: string;
  redirectTo?: string;
  className?: string;
  compact?: boolean;
  onDeleted?: () => void;
};

export default function DeleteListingButton({
  listingId,
  listingTitle,
  redirectTo,
  className = "",
  compact = false,
  onDeleted,
}: DeleteListingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const label = listingTitle ? `«${listingTitle}»` : "це оголошення";
    if (
      !window.confirm(
        `Видалити ${label}?\n\nОголошення зникне з каталогу без можливості відновити.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Не вдалося видалити");
      return;
    }

    onDeleted?.();

    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    router.refresh();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={
          compact
            ? "text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
            : "w-full rounded-lg border border-red-200 bg-white py-2 text-center text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        }
      >
        {loading ? "..." : compact ? "Видалити" : "🗑 Видалити оголошення"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
