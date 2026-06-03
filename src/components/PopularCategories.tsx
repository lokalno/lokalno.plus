"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";

export default function PopularCategories() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Популярні категорії</h2>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => select(cat)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
          >
            {cat}
          </button>
        ))}
      </div>
    </section>
  );
}
