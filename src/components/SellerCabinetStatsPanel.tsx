"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  getSellerPeriodStats,
  SELLER_STATS_PERIOD_LABELS,
  type SellerStatsPeriod,
} from "@/lib/seller-order-analytics";
import type { OrderListItem } from "@/components/OrdersList";

type SellerCabinetStatsPanelProps = {
  orders: OrderListItem[];
};

const PERIODS: SellerStatsPeriod[] = ["day", "week", "month", "year"];

export default function SellerCabinetStatsPanel({ orders }: SellerCabinetStatsPanelProps) {
  const [period, setPeriod] = useState<SellerStatsPeriod>("week");
  const stats = useMemo(() => getSellerPeriodStats(orders, period), [orders, period]);

  return (
    <aside className="w-full xl:sticky xl:top-20">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-br from-brand-50/80 to-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">
            Статистика замовлень
          </p>
          <p className="mt-1 text-sm text-gray-500">Період перегляду</p>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {PERIODS.map((value) => {
              const active = period === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                    active
                      ? "bg-brand-600 text-white shadow-sm"
                      : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {SELLER_STATS_PERIOD_LABELS[value]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
            <p className="text-xs font-medium text-orange-700">Нові замовлення</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{stats.newOrders}</p>
            <p className="mt-1 text-xs text-gray-500">за обраний період</p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium text-emerald-700">Дохід</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">
              {formatPrice(stats.income)}
            </p>
            <p className="mt-1 text-xs text-gray-500">оплачені замовлення</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-medium text-gray-500">Усього</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                {stats.totalOrders}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-medium text-gray-500">Завершені</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-gray-900">
                {stats.completedOrders}
              </p>
            </div>
          </div>

          <Link
            href="/profile/analytics"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
          >
            Переглянути аналітику
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
