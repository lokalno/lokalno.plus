"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function MobileHeroSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <form onSubmit={search} className="relative mt-4">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </span>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Що шукаєте?"
        className="w-full rounded-xl border-gray-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm"
      />
    </form>
  );
}
