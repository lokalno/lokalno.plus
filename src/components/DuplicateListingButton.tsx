"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DuplicateListingButtonProps = {
  listingId: string;
  className?: string;
};

export default function DuplicateListingButton({
  listingId,
  className = "",
}: DuplicateListingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDuplicate() {
    setLoading(true);
    setError("");

    const res = await fetch(`/api/listings/${listingId}/duplicate`, { method: "POST" });
    const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
    setLoading(false);

    if (!res.ok || !data?.id) {
      setError(data?.error || "Не вдалося дублювати оголошення");
      return;
    }

    router.push(`/listings/${data.id}/edit?duplicated=1`);
    router.refresh();
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="w-full rounded-lg border border-gray-300 bg-white py-2 text-center text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? "..." : "Дублювати"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
