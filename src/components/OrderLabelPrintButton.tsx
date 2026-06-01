"use client";

export default function OrderLabelPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
    >
      🖨️ Друкувати
    </button>
  );
}
