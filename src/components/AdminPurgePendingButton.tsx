"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPurgePendingButtonProps = {
  pendingCount: number;
};

export default function AdminPurgePendingButton({ pendingCount }: AdminPurgePendingButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (pendingCount === 0 && !result) {
    return null;
  }

  async function handlePurge() {
    const confirmed = window.confirm(
      `Видалити всі ${pendingCount} оголошень з модерації?\n\n` +
        "Оголошення будуть видалені назавжди разом із повʼязаними повідомленнями та скаргами. " +
        "Активні замовлення по такому оголошенню блокують видалення — такі позиції буде пропущено."
    );
    if (!confirmed) return;

    const typed = window.prompt(
      `Щоб підтвердити, введіть число ${pendingCount}:`
    );
    if (typed !== String(pendingCount)) {
      setError("Скасовано: число не співпало.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/purge-pending-listings", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Помилка видалення");
      return;
    }

    const skippedNote =
      data.skipped > 0
        ? ` Пропущено ${data.skipped} (є активні замовлення або інша помилка).`
        : "";

    setResult(`Видалено ${data.deleted} оголошень з модерації.${skippedNote}`);
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">Масове видалення</p>
      <p className="mt-1 text-sm text-red-800">
        На модерації зараз {pendingCount}{" "}
        {pendingCount === 1 ? "оголошення" : pendingCount < 5 ? "оголошення" : "оголошень"}.
        Можна видалити всі одразу — лише зі статусом «На модерації».
      </p>
      {result && <p className="mt-2 text-sm font-medium text-green-800">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      {pendingCount > 0 && (
        <button
          type="button"
          onClick={handlePurge}
          disabled={loading}
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Видалення..." : "Видалити всі з модерації"}
        </button>
      )}
    </div>
  );
}
