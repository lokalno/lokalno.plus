"use client";

import { useState } from "react";
import {
  BUYER_CANCEL_REASONS,
  BUYER_CANCEL_REASON_LABELS,
  type BuyerCancelReason,
} from "@/lib/order-cancel";

type OrderBuyerCancelDialogProps = {
  open: boolean;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason: BuyerCancelReason, note: string) => void;
};

export default function OrderBuyerCancelDialog({
  open,
  loading,
  error,
  onClose,
  onConfirm,
}: OrderBuyerCancelDialogProps) {
  const [reason, setReason] = useState<BuyerCancelReason | "">("");
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl">
        <h3 className="text-lg font-bold text-gray-900">Скасувати замовлення</h3>
        <p className="mt-1 text-sm text-gray-500">Оберіть причину скасування.</p>

        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">Причина скасування</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as BuyerCancelReason | "")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Оберіть причину</option>
            {BUYER_CANCEL_REASONS.map((item) => (
              <option key={item} value={item}>
                {BUYER_CANCEL_REASON_LABELS[item]}
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
              placeholder="Коротко опишіть причину скасування"
            />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Назад
          </button>
          <button
            type="button"
            disabled={loading || !reason || (reason === "OTHER" && !note.trim())}
            onClick={() => reason && onConfirm(reason, note)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "..." : "Скасувати замовлення"}
          </button>
        </div>
      </div>
    </div>
  );
}
