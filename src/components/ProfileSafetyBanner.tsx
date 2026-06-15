"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "lokalno-profile-safety-dismissed";

export default function ProfileSafetyBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <div className="relative rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 pr-9 text-sm text-emerald-950">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
        aria-label="Закрити"
      >
        ×
      </button>
      <p className="font-semibold">🛡️ Порада для безпеки</p>
      <p className="mt-1 text-emerald-900/90 leading-snug">
        Не переходьте в месенджери та не надсилайте передоплату.
      </p>
      <Link href="/rules" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
        Дізнатися більше →
      </Link>
    </div>
  );
}
