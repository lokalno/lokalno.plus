"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ORDER_RETURN_REASONS,
  ORDER_RETURN_REASON_LABELS,
  getReturnReasonLabel,
  type OrderReturnReason,
} from "@/lib/order-return";
import {
  canRequestOrderReturn,
  formatReturnRequestDeadline,
  isReturnRequestWindowExpired,
} from "@/lib/order-history";

type OrderReturnRequestButtonProps = {
  orderId: string;
  listingId: string;
  sellerId: string;
  status: string;
  completedAt?: Date | string | null;
  returnRequestedAt?: Date | string | null;
  returnReason?: string | null;
  returnReasonNote?: string | null;
};

export default function OrderReturnRequestButton({
  orderId,
  listingId,
  sellerId,
  status,
  completedAt,
  returnRequestedAt,
  returnReason,
  returnReasonNote,
}: OrderReturnRequestButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<OrderReturnReason | "">("");
  const [note, setNote] = useState("");

  if (status !== "COMPLETED" || !completedAt) return null;

  const orderFields = { status, completedAt, returnRequestedAt };

  if (returnRequestedAt) {
    return (
      <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-950">
        <p className="font-semibold">↩️ Запит на повернення надіслано</p>
        <p className="mt-1">
          {getReturnReasonLabel(returnReason, returnReasonNote) || "Очікуйте відповіді продавця."}
        </p>
        <Link
          href={`/messages?listingId=${listingId}&partnerId=${sellerId}`}
          className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Написати продавцю →
        </Link>
      </div>
    );
  }

  if (isReturnRequestWindowExpired(orderFields)) {
    return (
      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        <p className="font-medium text-gray-900">Повернення через сайт недоступне</p>
        <p className="mt-1">
          Термін запиту повернення (3 дні після отримання) минув. Зверніться до продавця напряму.
        </p>
        <Link
          href={`/messages?listingId=${listingId}&partnerId=${sellerId}`}
          className="mt-2 inline-block text-sm font-medium text-brand-700 hover:underline"
        >
          Зв&apos;язатися з продавцем →
        </Link>
      </div>
    );
  }

  if (!canRequestOrderReturn(orderFields)) return null;

  async function submitReturn() {
    if (!reason) return;
    setLoading(true);
    setError("");

    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "request_return",
        returnReason: reason,
        returnReasonNote: note,
      }),
    });
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    setLoading(false);

    if (!res.ok) {
      setError(data?.error || "Не вдалося надіслати запит");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="mt-3 rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2 text-sm text-violet-950">
        <p className="text-xs text-violet-800">
          Запросити повернення можна до {formatReturnRequestDeadline(completedAt!)}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 rounded-lg border border-violet-600 px-3 py-1.5 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Запросити повернення товару
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Запросити повернення</h3>
            <p className="mt-1 text-sm text-gray-500">
              Продавець отримає сповіщення у повідомленнях.
            </p>

            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Причина</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as OrderReturnReason | "")}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Оберіть причину</option>
                {ORDER_RETURN_REASONS.map((item) => (
                  <option key={item} value={item}>
                    {ORDER_RETURN_REASON_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>

            {reason === "OTHER" && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">Опишіть причину</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Коротко опишіть, чому потрібне повернення"
                />
              </div>
            )}

            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                type="button"
                disabled={loading || !reason || (reason === "OTHER" && !note.trim())}
                onClick={submitReturn}
                className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
              >
                {loading ? "..." : "Надіслати запит"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
