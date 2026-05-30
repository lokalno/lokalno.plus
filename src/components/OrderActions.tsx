"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderActionsProps = {
  orderId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
};

export default function OrderActions({ orderId, status, isBuyer, isSeller }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    router.refresh();
  }

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {isSeller && status === "PENDING" && (
        <button
          onClick={() => updateStatus("CONFIRMED")}
          disabled={loading}
          className="text-sm bg-brand-600 text-white px-3 py-1 rounded-lg hover:bg-brand-700"
        >
          Підтвердити
        </button>
      )}
      {(isBuyer || isSeller) && (
        <button
          onClick={() => updateStatus("COMPLETED")}
          disabled={loading}
          className="text-sm border border-brand-600 text-brand-700 px-3 py-1 rounded-lg hover:bg-brand-50"
        >
          Завершити
        </button>
      )}
      <button
        onClick={() => updateStatus("CANCELLED")}
        disabled={loading}
        className="text-sm text-red-600 px-3 py-1 rounded-lg hover:bg-red-50"
      >
        Скасувати
      </button>
    </div>
  );
}
