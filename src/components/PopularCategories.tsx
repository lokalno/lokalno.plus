"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES, CATEGORY_ICONS } from "@/lib/constants";

export default function PopularCategories() {  const router = useRouter();
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
      <div className="flex flex-wrap gap-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => select(cat)}
            className="flex flex-col items-center gap-2 group"
          >
            <span className="w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl group-hover:border-brand-500 group-hover:bg-brand-50 transition-colors shadow-sm">
              {CATEGORY_ICONS[cat]}
            </span>
            <span className="text-xs text-gray-600 group-hover:text-brand-700 max-w-[72px] text-center leading-tight">
              {cat}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
