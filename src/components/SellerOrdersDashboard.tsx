"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice, parsePhotos } from "@/lib/utils";
import {
  filterSellerOrders,
  formatSellerOrderDate,
  formatSellerOrderNumber,
  getSellerOrderBucket,
  getSellerOrderCounts,
  SELLER_ORDER_FILTER_LABELS,
  SELLER_ORDER_STATUS_LABELS,
  SELLER_ORDER_STATUS_STYLES,
  type SellerOrderFilter,
} from "@/lib/seller-orders";
import { getOrderTotalFromRecord, getOrderUnitPrice, getOrderQuantity, formatOrderQuantityLabel } from "@/lib/order-total";
import SellerOrderToolbar from "@/components/SellerOrderToolbar";
import type { OrderListItem } from "@/components/OrdersList";

type SellerOrdersDashboardProps = {
  orders: OrderListItem[];
  emptyMessage?: string;
};

type StatCardConfig = {
  filter: SellerOrderFilter;
  countKey: keyof ReturnType<typeof getSellerOrderCounts>;
  icon: string;
  ring: string;
  activeRing: string;
  iconBg: string;
  activeBg: string;
};

const STAT_CARDS: StatCardConfig[] = [
  {
    filter: "all",
    countKey: "total",
    icon: "🛒",
    ring: "ring-gray-200",
    activeRing: "ring-brand-500",
    iconBg: "bg-gray-100",
    activeBg: "bg-brand-50",
  },
  {
    filter: "new",
    countKey: "new",
    icon: "🆕",
    ring: "ring-orange-100",
    activeRing: "ring-orange-400",
    iconBg: "bg-orange-50",
    activeBg: "bg-orange-50/80",
  },
  {
    filter: "processing",
    countKey: "processing",
    icon: "⏳",
    ring: "ring-blue-100",
    activeRing: "ring-blue-400",
    iconBg: "bg-blue-50",
    activeBg: "bg-blue-50/80",
  },
  {
    filter: "sent",
    countKey: "sent",
    icon: "📦",
    ring: "ring-violet-100",
    activeRing: "ring-violet-400",
    iconBg: "bg-violet-50",
    activeBg: "bg-violet-50/80",
  },
  {
    filter: "completed",
    countKey: "completed",
    icon: "✅",
    ring: "ring-emerald-100",
    activeRing: "ring-emerald-400",
    iconBg: "bg-emerald-50",
    activeBg: "bg-emerald-50/80",
  },
  {
    filter: "cancelled",
    countKey: "cancelled",
    icon: "✕",
    ring: "ring-red-100",
    activeRing: "ring-red-400",
    iconBg: "bg-red-50",
    activeBg: "bg-red-50/80",
  },
];

export default function SellerOrdersDashboard({
  orders,
  emptyMessage = "Покупці ще не оформили замовлень на ваші товари",
}: SellerOrdersDashboardProps) {
  const [filter, setFilter] = useState<SellerOrderFilter>("all");
  const counts = useMemo(() => getSellerOrderCounts(orders), [orders]);
  const filteredOrders = useMemo(() => filterSellerOrders(orders, filter), [orders, filter]);
  const activeLabel = SELLER_ORDER_FILTER_LABELS[filter];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-brand-50/30 p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Статистика
            </p>
            <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Огляд замовлень</h2>
          </div>
          <p className="text-sm text-gray-500">
            Натисніть на картку, щоб відфільтрувати список
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {STAT_CARDS.map((card) => {
            const active = filter === card.filter;
            const count = counts[card.countKey];

            return (
              <button
                key={card.filter}
                type="button"
                onClick={() => setFilter(card.filter)}
                className={`group relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all duration-200 ${
                  active
                    ? `border-transparent ring-2 ${card.activeRing} shadow-md ${card.activeBg}`
                    : `border-gray-100 hover:border-gray-200 hover:shadow-sm ${card.ring} ring-1 ring-inset`
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p
                      className={`truncate text-[11px] font-medium leading-tight sm:text-xs ${
                        active ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {SELLER_ORDER_FILTER_LABELS[card.filter]}
                    </p>
                    <p
                      className={`mt-1.5 text-2xl font-bold tabular-nums sm:text-3xl ${
                        active ? "text-gray-900" : "text-gray-800"
                      }`}
                    >
                      {count}
                    </p>
                  </div>
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-105 sm:h-10 sm:w-10 sm:text-lg ${
                      active ? card.iconBg : "bg-gray-50"
                    }`}
                  >
                    {card.icon}
                  </span>
                </div>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-400 to-brand-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">
          {activeLabel}
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({filteredOrders.length})
          </span>
        </h3>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl">
            📋
          </div>
          <p className="font-medium text-gray-700">{emptyMessage}</p>
          {filter === "all" && (
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
              Коли хтось оформить покупку на ваше оголошення, замовлення з&apos;явиться тут
              автоматично.
            </p>
          )}
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="mt-4 text-sm font-medium text-brand-700 hover:underline"
            >
              Показати всі замовлення
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const photos = parsePhotos(order.listing.photos);
            const bucket = getSellerOrderBucket(order);
            const statusStyle = SELLER_ORDER_STATUS_STYLES[bucket];
            const quantity = getOrderQuantity(order);
            const orderTotal = getOrderTotalFromRecord(order);
            const createdAt =
              typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt;

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className={`h-1 w-full ${statusStyle.dot}`} />

                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
                  <Link
                    href={`/listings/${order.listing.id}`}
                    className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200/80 sm:h-28 sm:w-28"
                  >
                    {photos[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photos[0]}
                        alt=""
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-3xl">
                        📦
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                            {formatSellerOrderNumber(order.id)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatSellerOrderDate(createdAt)} р.
                          </span>
                        </div>
                        <Link
                          href={`/listings/${order.listing.id}`}
                          className="block text-base font-semibold text-gray-900 hover:text-brand-700 sm:text-lg"
                        >
                          {order.listing.title}
                        </Link>
                        {order.listing.itemLocation && (
                          <p className="mt-1 inline-flex rounded-lg bg-amber-50 px-2 py-1 font-mono text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
                            📍 {order.listing.itemLocation}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          {formatOrderQuantityLabel(quantity)} ·{" "}
                          <span className="font-semibold text-gray-900">
                            {formatPrice(orderTotal)}
                          </span>
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2 self-start">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyle.badge}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {SELLER_ORDER_STATUS_LABELS[bucket]}
                        </span>
                        <SellerOrderToolbar order={order} />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span className="text-gray-400" aria-hidden>
                        👤
                      </span>
                      <span className="truncate">{order.buyer.name}</span>
                      <span className="text-gray-300">·</span>
                      <span className="truncate text-gray-500">Доставка Nova Poshta — у «Деталі замовлення»</span>
                    </div>

                    {order.paymentStatus === "PAID" && bucket !== "completed" && (
                      <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800">
                        <span aria-hidden>✓</span>
                        Оплачено · {formatPrice(orderTotal)} на вашому балансі
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
