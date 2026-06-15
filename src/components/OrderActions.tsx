"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import OrderShipForm from "@/components/OrderShipForm";
import OrderSellerCancelDialog from "@/components/OrderSellerCancelDialog";
import OrderBuyerCancelDialog from "@/components/OrderBuyerCancelDialog";
import { formatTtnDeadline, isPastTtnDeadline } from "@/lib/order-cancel";
import type { SellerCancelReason, BuyerCancelReason } from "@/lib/order-cancel";
import {
  BUYER_SELLER_WARNING_MESSAGE,
  shouldWarnSellerAboutBuyer,
} from "@/lib/buyer-purchase-protection";

type OrderActionsProps = {
  orderId: string;
  status: string;
  isBuyer: boolean;
  isSeller: boolean;
  createdAt?: Date | string;
  deliveryLines?: string[];
  codAmount?: number;
  embedded?: boolean;
  showShipForm?: boolean;
  buyerNotReceivedCount?: number;
};

export default function OrderActions({
  orderId,
  status,
  isBuyer,
  isSeller,
  createdAt,
  deliveryLines = [],
  codAmount,
  embedded = false,
  showShipForm = true,
  buyerNotReceivedCount = 0,
}: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [buyerCancelDialogOpen, setBuyerCancelDialogOpen] = useState(false);

  async function patchOrder(body: Record<string, unknown>) {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Не вдалося оновити замовлення");
      return false;
    }

    router.refresh();
    return true;
  }

  async function updateStatus(newStatus: string) {
    return patchOrder({ status: newStatus });
  }

  if (
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "NOT_RECEIVED_BY_BUYER"
  ) {
    return null;
  }

  async function cancelAsBuyer(reason: BuyerCancelReason, note: string) {
    const ok = await patchOrder({
      status: "CANCELLED",
      cancelReason: reason,
      cancelReasonNote: note,
    });
    if (ok) {
      setBuyerCancelDialogOpen(false);
    }
  }

  async function cancelAsSeller(reason: SellerCancelReason, note: string) {
    const ok = await patchOrder({
      status: "CANCELLED",
      cancelReason: reason,
      cancelReasonNote: note,
    });
    if (ok) {
      setCancelDialogOpen(false);
    }
  }

  async function markNotReceivedByBuyer() {
    const confirmed = confirm(
      "Підтвердити, що покупець не забрав посилку з Nova Poshta?\n\nЗамовлення отримає статус «Не отримано покупцем», товар повернеться на склад."
    );
    if (!confirmed) return;

    await patchOrder({ action: "not_received_by_buyer" });
  }

  const showTtnDeadline =
    isSeller &&
    createdAt &&
    (status === "PENDING" || status === "CONFIRMED") &&
    !isPastTtnDeadline(createdAt);

  const showBuyerWarning =
    isSeller && shouldWarnSellerAboutBuyer(buyerNotReceivedCount);

  return (
    <div className={embedded ? "" : "mt-3"}>
      {showBuyerWarning && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          ⚠️ {BUYER_SELLER_WARNING_MESSAGE}
        </div>
      )}

      {isSeller && status === "PENDING" && (
        <p className="mb-2 text-xs text-gray-500">
          Підтвердіть замовлення, оформіть посилку в Nova Poshta з контролем оплати та вкажіть ТТН.
        </p>
      )}

      {showTtnDeadline && (
        <p className="mb-2 text-xs text-amber-700">
          До {formatTtnDeadline(createdAt)} потрібно вказати ТТН, інакше замовлення скасується автоматично.
        </p>
      )}

      {showShipForm && isSeller && status === "CONFIRMED" && (
        <OrderShipForm
          orderId={orderId}
          deliveryLines={deliveryLines}
          codAmount={codAmount}
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
            {isBuyer ? "Отримав і оплатив на NP" : "Покупець отримав"}
          </button>
        )}
        {isSeller && status === "SHIPPED" && (
          <button
            type="button"
            onClick={markNotReceivedByBuyer}
            disabled={loading}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            Покупець не забрав посилку
          </button>
        )}
        {status !== "SHIPPED" && (
          <button
            type="button"
            onClick={() =>
              isSeller ? setCancelDialogOpen(true) : setBuyerCancelDialogOpen(true)
            }
            disabled={loading}
            className="rounded-lg px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Скасувати
          </button>
        )}
      </div>

      <OrderBuyerCancelDialog
        open={buyerCancelDialogOpen}
        loading={loading}
        error={error}
        onClose={() => {
          setBuyerCancelDialogOpen(false);
          setError("");
        }}
        onConfirm={cancelAsBuyer}
      />

      <OrderSellerCancelDialog
        open={cancelDialogOpen}
        loading={loading}
        error={error}
        onClose={() => {
          setCancelDialogOpen(false);
          setError("");
        }}
        onConfirm={cancelAsSeller}
      />
    </div>
  );
}
