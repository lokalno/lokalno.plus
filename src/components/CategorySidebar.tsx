"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORIES,
  CATEGORY_SUBCATEGORIES,
  listCategoryDetailItems,
  listCategoryDetails,
} from "@/lib/constants";
import { CAR_SUBCATEGORY, TRANSPORT_CATEGORY } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

type CategorySidebarProps = {
  /** У мобільному «Весь каталог» — без sticky, прокрутка зовнішнього контейнера. */
  embedded?: boolean;
};

export default function CategorySidebar({ embedded = false }: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";
  const activeDetail = searchParams.get("detail") || "";
  const activeItem = searchParams.get("item") || "";

  function pushParams(params: URLSearchParams) {
    params.delete("page");
    const url = params.toString() ? `/?${params.toString()}` : "/";
    startTransition(() => {
      router.replace(url, { scroll: false });
    });
  }

  function clearNestedFilters(params: URLSearchParams) {
    params.delete("subcategory");
    params.delete("detail");
    params.delete("item");
  }

  function selectCategory(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category && activeCategory === category) {
      params.delete("category");
      clearNestedFilters(params);
    } else if (category) {
      params.set("category", category);
      clearNestedFilters(params);
      if (category === TRANSPORT_CATEGORY) {
        params.set("subcategory", CAR_SUBCATEGORY);
      }
    } else {
      params.delete("category");
      clearNestedFilters(params);
    }
    pushParams(params);
  }

  function selectSubcategory(subcategory: string) {
    if (!activeCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.delete("detail");
    params.delete("item");
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
    params.delete("item");
    if (detail && activeDetail === detail) {
      params.delete("detail");
    } else if (detail) {
      params.set("detail", detail);
    } else {
      params.delete("detail");
    }
    pushParams(params);
  }

  function selectItem(subcategory: string, detail: string, item: string) {
    if (!activeCategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.set("subcategory", subcategory);
    params.set("detail", detail);
    if (item && activeItem === item) {
      params.delete("item");
    } else if (item) {
      params.set("item", item);
    } else {
      params.delete("item");
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
    <div
      className={cn(
        "flex flex-col bg-white",
        embedded
          ? "p-2"
          : "rounded-xl border border-gray-200 p-4 xl:sticky xl:top-20 xl:max-h-[calc(100dvh-5.5rem)]",
        isPending && "opacity-70"
      )}
      aria-busy={isPending}
    >
      <h2 className="mb-3 shrink-0 text-sm font-bold text-gray-900">
        Каталог
        {isPending && <span className="ml-2 text-xs font-normal text-gray-400">завантаження…</span>}
      </h2>
      <ul
        className={cn(
          "space-y-1",
          embedded
            ? ""
            : "-mr-1 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
        )}
        onWheel={embedded ? undefined : handleCatalogWheel}
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
                  {subcategories.map((sub) => {
                    const detailOptions = listCategoryDetails(category, sub);
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
                            {detailOptions.map((detail) => {
                              const itemOptions = listCategoryDetailItems(category, sub, detail);
                              const isDetailActive = activeDetail === detail;

                              return (
                                <li key={detail}>
                                  <button
                                    type="button"
                                    onClick={() => selectDetail(sub, detail)}
                                    className={cn(
                                      "w-full rounded-md px-2 py-1 text-left text-[11px] transition-colors",
                                      isDetailActive && !activeItem
                                        ? "bg-brand-50 font-medium text-brand-700"
                                        : isDetailActive
                                          ? "font-medium text-brand-700"
                                          : "text-gray-500 hover:bg-gray-50"
                                    )}
                                  >
                                    {detail}
                                  </button>
                                  {isDetailActive && itemOptions.length > 0 && (
                                    <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                                      {itemOptions.map((item) => (
                                        <li key={item}>
                                          <button
                                            type="button"
                                            onClick={() => selectItem(sub, detail, item)}
                                            className={cn(
                                              "w-full rounded-md px-2 py-1 text-left text-[10px] transition-colors",
                                              activeItem === item
                                                ? "bg-brand-50 font-medium text-brand-700"
                                                : "text-gray-500 hover:bg-gray-50"
                                            )}
                                          >
                                            {item}
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
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
