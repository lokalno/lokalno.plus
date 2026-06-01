"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  buildSellerAnalyticsSeries,
  getAnalyticsTotals,
  type AnalyticsChartPoint,
} from "@/lib/seller-analytics-charts";
import {
  SELLER_STATS_PERIOD_LABELS,
  type SellerStatsPeriod,
} from "@/lib/seller-order-analytics";
import type { OrderListItem } from "@/components/OrdersList";

type SellerAnalyticsDashboardProps = {
  orders: OrderListItem[];
  totalViews: number;
};

const PERIODS: SellerStatsPeriod[] = ["day", "week", "month", "year"];

function AnalyticsBarChart({
  title,
  subtitle,
  points,
  valueKey,
  barClassName,
  formatValue,
}: {
  title: string;
  subtitle: string;
  points: AnalyticsChartPoint[];
  valueKey: "income" | "orders";
  barClassName: string;
  formatValue: (value: number) => string;
}) {
  const max = Math.max(...points.map((point) => point[valueKey]), 1);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>

      {points.every((point) => point[valueKey] === 0) ? (
        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
          Немає даних за обраний період
        </div>
      ) : (
        <div className="h-52">
          <div className="flex h-44 items-end gap-1.5 sm:gap-2">
            {points.map((point) => {
              const value = point[valueKey];
              const height = Math.max(4, Math.round((value / max) * 100));

              return (
                <div
                  key={`${point.label}-${valueKey}`}
                  className="group flex min-w-0 flex-1 flex-col items-center"
                >
                  <div className="relative flex h-40 w-full items-end justify-center">
                    <div
                      className={`w-full max-w-10 rounded-t-md transition-all ${barClassName}`}
                      style={{ height: `${value === 0 ? 0 : height}%` }}
                      title={`${point.label}: ${formatValue(value)}`}
                    />
                    <span className="pointer-events-none absolute -top-6 hidden rounded bg-gray-900 px-2 py-0.5 text-[10px] text-white group-hover:block">
                      {formatValue(value)}
                    </span>
                  </div>
                  <span className="mt-2 w-full truncate text-center text-[10px] text-gray-500 sm:text-[11px]">
                    {point.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerAnalyticsDashboard({
  orders,
  totalViews,
}: SellerAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<SellerStatsPeriod>("month");
  const points = useMemo(() => buildSellerAnalyticsSeries(orders, period), [orders, period]);
  const totals = useMemo(() => getAnalyticsTotals(points), [points]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-brand-50/40 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              Аналітика
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Графіки продажів</h1>
            <p className="mt-1 text-sm text-gray-500">
              Дохід і активність продажів за обраний період
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {PERIODS.map((value) => {
              const active = period === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs font-medium text-emerald-700">Дохід</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{formatPrice(totals.income)}</p>
          </div>
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-xs font-medium text-blue-700">Замовлення</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totals.orders}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4">
            <p className="text-xs font-medium text-violet-700">Перегляди оголошень</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalViews}</p>
          </div>
        </div>
      </div>

      <AnalyticsBarChart
        title="Графік продажів"
        subtitle="Дохід від оплачених замовлень"
        points={points}
        valueKey="income"
        barClassName="bg-gradient-to-t from-brand-700 to-brand-500"
        formatValue={(value) => formatPrice(value)}
      />

      <AnalyticsBarChart
        title="Активність продажів"
        subtitle="Кількість замовлень у кожному інтервалі"
        points={points}
        valueKey="orders"
        barClassName="bg-gradient-to-t from-sky-700 to-sky-400"
        formatValue={(value) => String(value)}
      />

      <p className="text-center text-sm text-gray-500">
        <Link href="/orders" className="font-medium text-brand-700 hover:underline">
          ← Повернутися до замовлень
        </Link>
      </p>
    </div>
  );
}
