"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminBuyerPurchaseActionsProps = {
  userId: string;
  purchasesBlocked: boolean;
};

export default function AdminBuyerPurchaseActions({
  userId,
  purchasesBlocked,
}: AdminBuyerPurchaseActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updatePurchases(action: "block_purchases" | "unblock_purchases") {
    let reason: string | undefined;
    if (action === "block_purchases") {
      reason =
        prompt("Причина обмеження покупок (необов'язково):") ||
        "Обмежено адміністратором";
    }

    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        ...(reason ? { buyerPurchasesBlockedReason: reason } : {}),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      alert(data?.error || "Не вдалося оновити статус покупок");
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!purchasesBlocked ? (
        <button
          type="button"
          onClick={() => updatePurchases("block_purchases")}
          disabled={loading}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? "..." : "Заблокувати покупки"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => updatePurchases("unblock_purchases")}
          disabled={loading}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "..." : "Розблокувати покупки"}
        </button>
      )}
    </div>
  );
}
