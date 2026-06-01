"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrderShipForm from "@/components/OrderShipForm";

type OrderActionsProps = {
  orderId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  deliveryLines?: string[];
  embedded?: boolean;
  showShipForm?: boolean;
};

export default function OrderActions({
  orderId,
  status,
  isBuyer,
  isSeller,
  deliveryLines = [],
  embedded = false,
  showShipForm = true,
}: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(newStatus: string) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Не вдалося оновити замовлення");
      return;
    }

    router.refresh();
  }

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  async function cancelOrder() {
    const confirmed = isSeller
      ? confirm(
          "Скасувати це замовлення? Покупець отримає сповіщення у повідомленнях і в розділі «Мої покупки»."
        )
      : confirm("Скасувати це замовлення?");
    if (!confirmed) return;
    await updateStatus("CANCELLED");
  }

  return (
    <div className={embedded ? "" : "mt-3"}>
      {isSeller && status === "PENDING" && (
        <p className="mb-2 text-xs text-gray-500">
          Підтвердіть замовлення, потім у цьому вікні оформіть відправку Nova Poshta і вкажіть ТТН.
        </p>
      )}

      {showShipForm && isSeller && status === "CONFIRMED" && (
        <OrderShipForm
          orderId={orderId}
          deliveryLines={deliveryLines}
          showDeliveryAddress={false}
        />
      )}

      {error && <p className="mb-2 text-xs text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {isSeller && status === "PENDING" && (
          <button
            type="button"
            onClick={() => updateStatus("CONFIRMED")}
            disabled={loading}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "..." : "Підтвердити замовлення"}
          </button>
        )}
        {(isBuyer || isSeller) && status === "SHIPPED" && (
          <button
            type="button"
            onClick={() => updateStatus("COMPLETED")}
            disabled={loading}
            className="rounded-lg border border-brand-600 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50 disabled:opacity-50"
          >
            Завершити
          </button>
        )}
        {status !== "SHIPPED" && (
          <button
            type="button"
            onClick={cancelOrder}
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Скасувати
          </button>
        )}
      </div>
    </div>
  );
}
