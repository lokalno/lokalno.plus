"use client";

import { useState } from "react";
import Link from "next/link";
import { REPORT_REASONS } from "@/lib/constants";

type ReportReason = (typeof REPORT_REASONS)[number];

type ReportButtonProps = {
  listingId: string;
  isLoggedIn: boolean;
};

export default function ReportButton({ listingId, isLoggedIn }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason, comment: comment.trim() || null }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setDone(true);
      setOpen(false);
    } else {
      setError(data.error || "Помилка");
    }
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="block w-full text-center text-sm text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-50"
      >
        Поскаржитися (увійдіть)
      </Link>
    );
  }

  if (done) {
    return (
      <p className="text-sm text-center text-green-700 bg-green-50 py-2 rounded-lg">
        Скаргу надіслано. Адмін перегляне її.
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-sm text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-50"
      >
        🚩 Поскаржитися
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-semibold text-lg mb-4">Поскаржитися на оголошення</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Причина</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as ReportReason)}
                >
                  {REPORT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Коментар (необов&apos;язково)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Опишіть проблему..."
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border py-2 rounded-lg hover:bg-gray-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                >
                  {loading ? "Надсилання..." : "Надіслати скаргу"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
