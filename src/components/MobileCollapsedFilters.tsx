"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobileCollapsedFiltersProps = {
  children: ReactNode;
};

/** На телефоні — фільтри (місто, ціна, сортування) згорнуті, щоб не закривали категорії. */
export default function MobileCollapsedFilters({ children }: MobileCollapsedFiltersProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="xl:hidden mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800"
      >
        <span>🔎 Фільтри: місто, ціна, сортування</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-[max-height] duration-200",
          open ? "max-h-[2000px] mt-3" : "max-h-0"
        )}
      >
        {children}
      </div>
    </div>
  );
}
