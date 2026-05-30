"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MarkSoldButtonProps = {
  listingId: string;
};

export default function MarkSoldButton({ listingId }: MarkSoldButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markSold() {
    if (!confirm("Позначити товар як проданий?")) return;
    setLoading(true);
    await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SOLD" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markSold}
      disabled={loading}
      className="flex-1 text-center border border-gray-400 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
    >
      {loading ? "..." : "✓ Продано"}
    </button>
  );
}
