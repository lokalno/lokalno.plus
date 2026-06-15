"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MarkSoldButtonProps = {
  listingId: string;
  disabled?: boolean;
};

export default function MarkSoldButton({ listingId, disabled = false }: MarkSoldButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markSold() {
    if (disabled) return;
    if (!confirm("Позначити товар як розпроданий? Оголошення залишиться на сайті, кількість стане 0.")) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: 0 }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(typeof data.error === "string" ? data.error : "Не вдалося оновити оголошення");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markSold}
      disabled={loading || disabled}
      className="flex-1 text-center border border-gray-400 text-gray-700 py-2 rounded-lg hover:bg-gray-50"
    >
      {loading ? "..." : disabled ? "Розпродано" : "✓ Продано"}
    </button>
  );
}
