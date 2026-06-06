"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCategoryIcon } from "@/lib/category-icons";
import { TRANSPORT_CATEGORY, CAR_SUBCATEGORY } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type MobilePopularCategoriesProps = {
  items: { category: string; count: number }[];
};

function formatCount(count: number): string {
  return count.toLocaleString("uk-UA");
}

export default function MobilePopularCategories({ items }: MobilePopularCategoriesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeCategory = searchParams.get("category") || "";

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    params.delete("subcategory");
    params.delete("detail");
    params.delete("item");

    if (activeCategory === category) {
      params.delete("category");
    } else {
      params.set("category", category);
      if (category === TRANSPORT_CATEGORY) {
        params.set("subcategory", CAR_SUBCATEGORY);
      }
    }

    const url = params.toString() ? `/?${params.toString()}` : "/";
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }

  return (
    <section className={cn("xl:hidden mb-6", isPending && "opacity-70")}>
      <h2 className="text-base font-bold text-gray-900 mb-3">Популярні категорії</h2>
      <div className="grid grid-cols-5 gap-2">
        {items.map(({ category, count }) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => selectCategory(category)}
              className={cn(
                "flex flex-col items-center rounded-2xl border bg-white p-2 text-center shadow-sm transition-colors",
                isActive ? "border-brand-400 bg-brand-50" : "border-gray-100"
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-xl">
                {getCategoryIcon(category)}
              </span>
              <span className="mt-1.5 text-[9px] font-semibold leading-tight text-gray-800 line-clamp-2">
                {category.split(" ")[0]}
              </span>
              <span className="mt-0.5 text-[9px] text-gray-400">{formatCount(count)}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
