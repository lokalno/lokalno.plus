"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  groupAdminUserSalesOrders,
  formatAdminSalesOrderAmount,
  formatAdminSalesOrderMeta,
  type AdminUserSalesHistoryPeriod,
  type AdminUserSalesOrder,
} from "@/lib/admin-user-sales-history";
import { formatAdminMoney } from "@/lib/admin-stats";
import { ORDER_STATUSES } from "@/lib/constants";

type AdminUserSalesHistoryPanelProps = {
  salesOrders: AdminUserSalesOrder[];
  totals: {
    all: number;
    completed: number;
    cancelled: number;
    returns: number;
    revenue: number;
  };
};

const PERIOD_OPTIONS: { key: AdminUserSalesHistoryPeriod; label: string }[] = [
  { key: "day", label: "По днях" },
  { key: "month", label: "По місяцях" },
  { key: "year", label: "По роках" },
];

export default function AdminUserSalesHistoryPanel({
  salesOrders,
  totals,
}: AdminUserSalesHistoryPanelProps) {
  const [period, setPeriod] = useState<AdminUserSalesHistoryPeriod>("month");
  const groups = useMemo(
    () => groupAdminUserSalesOrders(salesOrders, period),
    [salesOrders, period]
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Усього продажів</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totals.all}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Завершено</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{totals.completed}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Скасовано</p>
          <p className="mt-1 text-2xl font-bold text-red-700">{totals.cancelled}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Запити повернення</p>
          <p className="mt-1 text-2xl font-bold text-violet-700">{totals.returns}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-gray-500">Завершені продажі</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{formatAdminMoney(totals.revenue)}</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Вся історія продажів</h2>
            <p className="mt-1 text-sm text-gray-500">
              Усі замовлення цього продавця без обмеження за датою
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setPeriod(option.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                  period === option.key
                    ? "bg-brand-600 text-white"
                    : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Продажів поки немає</div>
        ) : (
          <div className="divide-y">
            {groups.map((group) => (
              <div key={group.key} className="px-5 py-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{group.label}</h3>
                  <p className="text-sm text-gray-500">
                    {group.orders.length} замовл. · {formatAdminMoney(group.totalAmount)}
                  </p>
                </div>
                <div className="space-y-3">
                  {group.orders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/listings/${order.listing.id}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            {order.listing.title}
                          </Link>
                          <p className="mt-1 text-sm text-gray-600">
                            Покупець: {order.buyer.name} · {order.buyer.email}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{formatAdminSalesOrderMeta(order)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand-700">{formatAdminSalesOrderAmount(order)}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {ORDER_STATUSES[order.status] || order.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
