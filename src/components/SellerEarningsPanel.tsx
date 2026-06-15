import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/utils";
import type { SellerEarningsStats } from "@/lib/seller-earnings";
import { SELLER_NP_COD_NOTICE } from "@/lib/order-payment";

type SellerEarningsPanelProps = {
  stats: SellerEarningsStats;
};

export default function SellerEarningsPanel({ stats }: SellerEarningsPanelProps) {
  const monthLabel = new Intl.DateTimeFormat("uk-UA", { month: "long" }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-gradient-to-br from-brand-600 to-brand-700 p-6 text-white">
        <p className="text-sm text-brand-100">Зароблено з продажів на lokalno.plus</p>
        <p className="mt-1 text-4xl font-bold">{formatPrice(stats.totalEarned)}</p>
        <p className="mt-3 text-sm leading-relaxed text-brand-100">
          {SELLER_NP_COD_NOTICE} Це статистика для вас — гроші на сайті не зберігаються і не
          виводяться через сайт.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Завершених продажів</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats.completedSalesCount}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">За {monthLabel}</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{formatPrice(stats.monthEarned)}</p>
          <p className="text-xs text-gray-400">{stats.monthSalesCount} продажів</p>
        </div>
        <div className="rounded-xl border bg-white p-4 col-span-2 sm:col-span-2">
          <p className="text-xs text-gray-500">Очікується (замовлення в обробці)</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{formatPrice(stats.pendingAmount)}</p>
          <p className="text-xs text-gray-400">
            {stats.pendingCount}{" "}
            {stats.pendingCount === 1
              ? "замовлення"
              : stats.pendingCount >= 2 && stats.pendingCount <= 4
                ? "замовлення"
                : "замовлень"}
            {" "}— сума після отримання посилки
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900">Історія продажів</h2>
          <Link href="/orders" className="text-sm font-medium text-brand-700 hover:underline">
            Усі замовлення →
          </Link>
        </div>

        {stats.recentSales.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
            <p className="text-3xl mb-2">📦</p>
            <p>Завершених продажів поки немає.</p>
            <p className="mt-1">Після отримання посилки покупцем тут зʼявиться сума.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3 text-sm last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    №{sale.orderNumber} · {sale.listingTitle}
                  </p>
                  <p className="text-xs text-gray-400">
                    {sale.paymentLabel} · {formatDate(sale.date)}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-brand-700">+{formatPrice(sale.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {stats.legacyBalance > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Старий баланс на сайті (архів): {formatPrice(stats.legacyBalance)}</p>
          <p className="mt-1 text-amber-900/80">
            Це залишок від попередньої системи оплати. Нові продажі йдуть лише через Nova Poshta.
          </p>
        </div>
      )}
    </div>
  );
}
