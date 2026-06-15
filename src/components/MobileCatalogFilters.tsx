"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CATEGORY_SUBCATEGORIES,
  listCategoryDetails,
  listCategoryDetailItems,
} from "@/lib/constants";
import CategorySidebar from "@/components/CategorySidebar";
import { cn } from "@/lib/utils";

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
      )}
    >
      {children}
    </button>
  );
}

export default function MobileCatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFullTree, setShowFullTree] = useState(false);

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

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("subcategory");
    params.delete("detail");
    params.delete("item");
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

  function selectDetail(detail: string) {
    if (!activeCategory || !activeSubcategory) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.set("subcategory", activeSubcategory);
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

  function selectItem(item: string) {
    if (!activeCategory || !activeSubcategory || !activeDetail) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", activeCategory);
    params.set("subcategory", activeSubcategory);
    params.set("detail", activeDetail);
    if (item && activeItem === item) {
      params.delete("item");
    } else if (item) {
      params.set("item", item);
    } else {
      params.delete("item");
    }
    pushParams(params);
  }

  const subcategories =
    activeCategory && activeCategory in CATEGORY_SUBCATEGORIES
      ? CATEGORY_SUBCATEGORIES[activeCategory as keyof typeof CATEGORY_SUBCATEGORIES]
      : [];

  const details =
    activeCategory && activeSubcategory
      ? listCategoryDetails(activeCategory, activeSubcategory)
      : [];

  const items =
    activeCategory && activeSubcategory && activeDetail
      ? listCategoryDetailItems(activeCategory, activeSubcategory, activeDetail)
      : [];

  const breadcrumb = [activeCategory, activeSubcategory, activeDetail, activeItem]
    .filter(Boolean)
    .join(" › ");

  return (
    <div className={cn("xl:hidden space-y-3", isPending && "opacity-70")}>
      {activeCategory ? (
        <>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <p className="min-w-0 truncate text-sm font-medium text-gray-900">{breadcrumb}</p>
            <button
              type="button"
              onClick={clearAll}
              className="shrink-0 text-xs font-medium text-brand-700"
            >
              Скинути
            </button>
          </div>

          {subcategories.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">Підкатегорії</p>
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
                <Chip active={!activeSubcategory} onClick={() => selectSubcategory("")}>
                  Усі
                </Chip>
                {subcategories.map((sub) => (
                  <Chip
                    key={sub}
                    active={activeSubcategory === sub}
                    onClick={() => selectSubcategory(sub)}
                  >
                    {sub}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {details.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">Тип</p>
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
                <Chip active={!activeDetail} onClick={() => selectDetail("")}>
                  Усі
                </Chip>
                {details.map((detail) => (
                  <Chip
                    key={detail}
                    active={activeDetail === detail}
                    onClick={() => selectDetail(detail)}
                  >
                    {detail}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">Модель / вид</p>
              <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 scrollbar-hide">
                <Chip active={!activeItem} onClick={() => selectItem("")}>
                  Усі
                </Chip>
                {items.map((item) => (
                  <Chip key={item} active={activeItem === item} onClick={() => selectItem(item)}>
                    {item}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      <button
        type="button"
        onClick={() => setShowFullTree((v) => !v)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-800"
      >
        {showFullTree ? "▲ Сховати повний каталог" : "▼ Весь каталог категорій"}
      </button>

      {showFullTree && (
        <div
          className="max-h-[min(75dvh,36rem)] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <CategorySidebar embedded />
        </div>
      )}
    </div>
  );
}
