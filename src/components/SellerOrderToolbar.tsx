"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrderDetailsModal from "@/components/OrderDetailsModal";
import OrderLabelButton from "@/components/OrderLabelDevNotice";
import type { OrderListItem } from "@/components/OrdersList";

type SellerOrderToolbarProps = {
  order: OrderListItem;
};

const toolbarBtnBase =
  "inline-flex w-full min-h-[2.625rem] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-xs font-semibold leading-tight shadow-sm transition sm:min-w-[13.75rem] sm:text-sm";

export default function SellerOrderToolbar({ order }: SellerOrderToolbarProps) {
  const router = useRouter();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirmOrder() {
    setConfirmLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setConfirmLoading(false);

    if (!res.ok) {
      setError(data?.error || "Не вдалося підтвердити замовлення");
      return;
    }

    router.refresh();
  }

  return (
    <>
      <div className="flex w-full flex-col items-stretch gap-2 sm:w-[13.75rem]">
        <button
          type="button"
          onClick={() => setDetailsOpen(true)}
          className={`${toolbarBtnBase} border border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800`}
        >
          <span aria-hidden>👁️</span>
          Деталі замовлення
        </button>
        <OrderLabelButton
          className={`${toolbarBtnBase} border border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-300 hover:bg-violet-100`}
        />
        {order.status === "PENDING" && (
          <button
            type="button"
            onClick={confirmOrder}
            disabled={confirmLoading}
            className={`${toolbarBtnBase} bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50`}
          >
            <span aria-hidden>✓</span>
            {confirmLoading ? "..." : "Підтвердити замовлення"}
          </button>
        )}
        {error && <p className="text-right text-xs text-red-700">{error}</p>}
      </div>

      <OrderDetailsModal
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        isSeller
      />
    </>
  );
}
