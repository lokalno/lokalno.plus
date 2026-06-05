"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminPurgeDemoButtonProps = {
  demoListingsCount: number;
};

export default function AdminPurgeDemoButton({ demoListingsCount }: AdminPurgeDemoButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (demoListingsCount === 0 && !result) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Тестових оголошень немає — каталог готовий до публічного запуску.
      </div>
    );
  }

  async function handlePurge() {
    const confirmed = window.confirm(
      `Видалити ${demoListingsCount} тестових оголошень?\n\n` +
        "Будуть видалені оголошення демо-продавців (demo@, seller1–4@) разом із повʼязаними замовленнями та повідомленнями. " +
        "Реальні оголошення користувачів не зачепляться."
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/admin/purge-demo-listings", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Помилка видалення");
      return;
    }

    setResult(
      `Видалено ${data.listings} оголошень, ${data.orders} замовлень, ${data.messages} повідомлень.`
    );
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="font-medium text-amber-900">🚀 Підготовка до запуску</p>
      <p className="mt-1 text-sm text-amber-800">
        Зараз у каталозі {demoListingsCount} тестових оголошень від демо-акаунтів (seed-дані).
        Перед публічним запуском їх варто прибрати.
      </p>
      {result && <p className="mt-2 text-sm font-medium text-green-800">{result}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {demoListingsCount > 0 && (
        <button
          type="button"
          onClick={handlePurge}
          disabled={loading}
          className="mt-3 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Видалення..." : "Видалити тестові оголошення"}
        </button>
      )}
    </div>
  );
}
