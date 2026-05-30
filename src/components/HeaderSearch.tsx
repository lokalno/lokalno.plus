"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { UKRAINIAN_CITIES } from "@/lib/constants";

export default function HeaderSearch() {
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
    <form onSubmit={search} className="flex-1 max-w-2xl hidden md:flex items-center gap-0">
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-36 shrink-0 rounded-l-xl rounded-r-none border-r-0 py-2.5 text-sm bg-gray-50"
        aria-label="Регіон"
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
        className="flex-1 rounded-none border-x-0 py-2.5 text-sm"
      />
      <button
        type="submit"
        className="shrink-0 bg-brand-600 text-white px-5 py-2.5 rounded-r-xl hover:bg-brand-700 font-medium text-sm"
      >
        Пошук
      </button>
    </form>
  );
}
