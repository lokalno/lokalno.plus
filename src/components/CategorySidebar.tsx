"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function CategorySidebar() {  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category && activeCategory === category) {
      params.delete("category");
    } else if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
      <h2 className="text-sm font-bold text-gray-900 mb-3">Каталог</h2>
      <ul className="space-y-1">
        <li>
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
              !activeCategory
                ? "bg-brand-50 text-brand-700 font-medium border border-brand-200"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Усі категорії
          </button>
        </li>
        {CATEGORIES.map((category) => (
          <li key={category}>
            <button
              type="button"
              onClick={() => selectCategory(category)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                activeCategory === category
                  ? "bg-brand-50 text-brand-700 font-medium border border-brand-200"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {category}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
