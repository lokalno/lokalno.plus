"use client";

import { useEffect, useState } from "react";

type OrderLabelDevNoticeProps = {
  open: boolean;
  onClose: () => void;
};

export function OrderLabelDevNotice({ open, onClose }: OrderLabelDevNoticeProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-label-dev-title"
        className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl" aria-hidden>
            🚧
          </span>
          <div>
            <h2 id="order-label-dev-title" className="text-lg font-bold text-gray-900">
              Етикетка / QR — скоро
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              Кнопка «Етикетка / QR» знаходиться в оновленнях та в розробці.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">
              На даний момент роздрукувати етикетку вдома неможливо — лише на відділенні Nova
              Poshta під час оформлення відправлення.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Зрозуміло
        </button>
      </div>
    </div>
  );
}

type OrderLabelButtonProps = {
  className: string;
  label?: string;
};

export default function OrderLabelButton({
  className,
  label = "Етикетка / QR",
}: OrderLabelButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <span aria-hidden>🖨️</span>
        {label}
      </button>
      <OrderLabelDevNotice open={open} onClose={() => setOpen(false)} />
    </>
  );
}
