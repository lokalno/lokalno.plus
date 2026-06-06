"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { UKRAINIAN_CITIES } from "@/lib/constants";

export default function MobileSearchBar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");

  function search(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    if (city) params.set("city", city);
    else params.delete("city");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form
      id="mobile-search"
      onSubmit={search}
      className="xl:hidden flex items-center gap-2 border-t border-gray-100 bg-white px-3 py-2.5"
    >
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-[7.5rem] shrink-0 rounded-xl border-gray-200 bg-gray-50 py-2.5 text-xs"
        aria-label="Місто"
      >
        <option value="">Вся Україна</option>
        {UKRAINIAN_CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Що шукаєте?"
        className="min-w-0 flex-1 rounded-xl py-2.5 text-sm"
      />
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Знайти
      </button>
    </form>
  );
}
