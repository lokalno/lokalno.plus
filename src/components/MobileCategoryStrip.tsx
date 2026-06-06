"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getCategoryIcon, MOBILE_STRIP_CATEGORIES } from "@/lib/category-icons";
import { TRANSPORT_CATEGORY, CAR_SUBCATEGORY } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

export default function MobileCategoryStrip() {
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
    <section
      className={cn(
        "xl:hidden -mx-1 mb-4",
        isPending && "opacity-70"
      )}
      aria-label="Категорії"
    >
      <div className="flex gap-3 overflow-x-auto overscroll-x-contain px-1 pb-1 scrollbar-hide">
        {MOBILE_STRIP_CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              type="button"
              onClick={() => selectCategory(category)}
              className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5"
            >
              <span
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-full border-2 text-2xl shadow-sm transition-colors",
                  isActive
                    ? "border-brand-500 bg-brand-50"
                    : "border-gray-100 bg-white"
                )}
              >
                {getCategoryIcon(category)}
              </span>
              <span
                className={cn(
                  "max-w-[4.5rem] text-center text-[10px] leading-tight",
                  isActive ? "font-semibold text-brand-700" : "text-gray-600"
                )}
              >
                {category.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
