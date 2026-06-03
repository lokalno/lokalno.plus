"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  getCategoryDetailOptions,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function CategorySidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";
  const activeDetail = searchParams.get("detail") || "";

  function pushParams(params: URLSearchParams) {
    params.delete("page");
    router.push(`/?${params.toString()}`);
  }

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category && activeCategory === category) {
      params.delete("category");
      params.delete("subcategory");
      params.delete("detail");
    } else if (category) {
      params.set("category", category);
      params.delete("subcategory");
      params.delete("detail");
    } else {
      params.delete("category");
      params.delete("subcategory");
      params.delete("detail");
    }
    pushParams(params);
  }

  function selectSubcategory(subcategory: string) {
    if (!activeCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.delete("detail");
    if (subcategory && activeSubcategory === subcategory) {
      params.delete("subcategory");
    } else if (subcategory) {
      params.set("subcategory", subcategory);
    } else {
      params.delete("subcategory");
    }
    pushParams(params);
  }

  function selectDetail(subcategory: string, detail: string) {
    if (!activeCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.set("subcategory", subcategory);
    if (detail && activeDetail === detail) {
      params.delete("detail");
    } else if (detail) {
      params.set("detail", detail);
    } else {
      params.delete("detail");
    }
    pushParams(params);
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
      >
        <li>
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
              !activeCategory
                ? "border border-brand-200 bg-brand-50 font-medium text-brand-700"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            Усі категорії
          </button>
        </li>
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category;
          const subcategories =
            category in CATEGORY_SUBCATEGORIES
              ? CATEGORY_SUBCATEGORIES[category as keyof typeof CATEGORY_SUBCATEGORIES]
              : [];

          return (
            <li key={category}>
              <button
                type="button"
                onClick={() => selectCategory(category)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "border border-brand-200 bg-brand-50 font-medium text-brand-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {category}
              </button>
              {isActive && subcategories.length > 0 && (
                <ul className="ml-2 mt-1 space-y-0.5 border-l border-gray-200 pl-2">
                  <li>
                    <button
                      type="button"
                      onClick={() => selectSubcategory("")}
                      className={cn(
                        "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                        !activeSubcategory
                          ? "bg-brand-50 font-medium text-brand-700"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      Усі в категорії
                    </button>
                  </li>
                  {subcategories.map((sub) => {
                    const detailOptions = getCategoryDetailOptions(category, sub);
                    const isSubActive = activeSubcategory === sub;

                    return (
                      <li key={sub}>
                        <button
                          type="button"
                          onClick={() => selectSubcategory(sub)}
                          className={cn(
                            "w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                            isSubActive && !activeDetail
                              ? "bg-brand-50 font-medium text-brand-700"
                              : isSubActive
                                ? "font-medium text-brand-700"
                                : "text-gray-600 hover:bg-gray-50"
                          )}
                        >
                          {sub}
                        </button>
                        {isSubActive && detailOptions.length > 0 && (
                          <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                            <li>
                              <button
                                type="button"
                                onClick={() => selectDetail(sub, "")}
                                className={cn(
                                  "w-full rounded-md px-2 py-1 text-left text-[11px] transition-colors",
                                  !activeDetail
                                    ? "bg-brand-50 font-medium text-brand-700"
                                    : "text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                Усі в «{sub}»
                              </button>
                            </li>
                            {detailOptions.map((detail) => (
                              <li key={detail}>
                                <button
                                  type="button"
                                  onClick={() => selectDetail(sub, detail)}
                                  className={cn(
                                    "w-full rounded-md px-2 py-1 text-left text-[11px] transition-colors",
                                    activeDetail === detail
                                      ? "bg-brand-50 font-medium text-brand-700"
                                      : "text-gray-500 hover:bg-gray-50"
                                  )}
                                >
                                  {detail}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
