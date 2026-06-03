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

  function handleCatalogWheel(e: React.WheelEvent<HTMLUListElement>) {
    const list = e.currentTarget;
    if (list.scrollHeight <= list.clientHeight) return;

    const goingUp = e.deltaY < 0;
    const goingDown = e.deltaY > 0;
    const atTop = list.scrollTop <= 0;
    const atBottom = list.scrollTop + list.clientHeight >= list.scrollHeight - 1;

    if ((goingUp && !atTop) || (goingDown && !atBottom)) {
      e.stopPropagation();
    }
  }

  return (
    <div className="sticky top-20 flex max-h-[calc(100dvh-5.5rem)] flex-col rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="mb-3 shrink-0 text-sm font-bold text-gray-900">Каталог</h2>
      <ul
        className="-mr-1 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
        onWheel={handleCatalogWheel}
      >        <li>
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
