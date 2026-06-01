"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function AdminOrderSupportSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("q", trimmed);
    router.push(
      params.toString() ? `/admin/order-support?${params.toString()}` : "/admin/order-support"
    );
  }

  function clear() {
    setQuery("");
    router.push("/admin/order-support");
  }

  return (
    <form onSubmit={submit} className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ORD-10001, #ORD-10002 або 10003"
        className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-mono text-sm"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Знайти
        </button>
        {searchParams.get("q") && (
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Скинути
          </button>
        )}
      </div>
    </form>
  );
}
