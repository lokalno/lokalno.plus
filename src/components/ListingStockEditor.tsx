"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatListingStock } from "@/lib/listing-stock";

type ListingStockEditorProps = {
  listingId: string;
  initialStock: number;
  listingStatus: string;
};

export default function ListingStockEditor({
  listingId,
  initialStock,
  listingStatus,
}: ListingStockEditorProps) {
  const router = useRouter();
  const [stock, setStock] = useState(String(initialStock));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setStock(String(initialStock));
  }, [initialStock]);

  async function handleSave() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(stock) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не вдалося зберегти");

      setSuccess("Кількість оновлено");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка збереження");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/70 p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-brand-900">Кількість на складі</p>
        <p className="text-xs text-brand-700 mt-1">
          Зараз: {formatListingStock(initialStock)}
          {listingStatus === "SOLD" && " · оголошення позначене як продане"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="number"
          min="1"
          max="9999"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="flex-1"
          aria-label="Кількість в наявності"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || stock === String(initialStock)}
          className="sm:w-auto px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Збереження..." : "Зберегти кількість"}
        </button>
      </div>

      <p className="text-xs text-gray-600">
        Можна змінити в будь-який час — також через «Редагувати оголошення».
      </p>

      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-brand-700">{success}</p>}
    </div>
  );
}
