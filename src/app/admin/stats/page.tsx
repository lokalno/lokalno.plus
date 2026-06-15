import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminActivityCharts from "@/components/AdminActivityCharts";
import AdminUkraineMap from "@/components/AdminUkraineMap";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_REGISTRATION_PERIOD_KEYS,
  formatAdminMoney,
  getAdminCancellationStats,
  getAdminStatsSnapshot,
} from "@/lib/admin-stats";
import { formatKyivDayLabel, getSiteTrafficStats } from "@/lib/site-traffic";
export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const [stats, cancellationStats, siteTraffic] = await Promise.all([
    getAdminStatsSnapshot(prisma),
    getAdminCancellationStats(prisma),
    getSiteTrafficStats(prisma),
  ]);
  const registrationPeriods = stats.periods.filter((period) =>
    ADMIN_REGISTRATION_PERIOD_KEYS.includes(period.key)
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
            ← Адмін-панель
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">📊 Статистика платформи</h1>
          <p className="mt-1 text-sm text-gray-500">
            Реальні користувачі, продажі та активність (час за Києвом)
          </p>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
        <div className="border-b border-indigo-50 bg-indigo-50/40 px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Відвідувачі lokalno.plus</h2>
          <p className="mt-1 text-sm text-gray-500">
            Унікальні відвідувачі сайту та перегляди сторінок (час за Києвом)
          </p>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-sm text-gray-600">Сьогодні · унікальні</p>
            <p className="mt-1 text-3xl font-bold text-indigo-700">
              {siteTraffic.todayUniqueVisitors.toLocaleString("uk-UA")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              переглядів: {siteTraffic.todayPageViews.toLocaleString("uk-UA")}
            </p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Вчора · унікальні</p>
            <p className="mt-1 text-3xl font-bold text-gray-800">
              {siteTraffic.yesterdayUniqueVisitors.toLocaleString("uk-UA")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              переглядів: {siteTraffic.yesterdayPageViews.toLocaleString("uk-UA")}
            </p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-600">За 7 днів · унікальні</p>
            <p className="mt-1 text-3xl font-bold text-sky-700">
              {siteTraffic.last7DaysUniqueVisitors.toLocaleString("uk-UA")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              переглядів: {siteTraffic.last7DaysPageViews.toLocaleString("uk-UA")}
            </p>
          </div>
          <div className="rounded-xl border bg-gray-50 p-4">
            <p className="text-sm text-gray-600">За весь час · унікальні</p>
            <p className="mt-1 text-3xl font-bold text-violet-700">
              {siteTraffic.allTimeUniqueVisitors.toLocaleString("uk-UA")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              переглядів: {siteTraffic.allTimePageViews.toLocaleString("uk-UA")}
            </p>
          </div>
        </div>

        <div className="border-t px-5 py-4">
          <p className="text-xs text-gray-500">
            {siteTraffic.trackingSince
              ? `Відстеження з ${formatKyivDayLabel(siteTraffic.trackingSince)}. `
              : "Дані зʼявляться після першого відвідування сайту після оновлення. "}
            Один відвідувач = один браузер на добу. Боти не рахуються.
          </p>
        </div>

        <div className="overflow-x-auto border-t">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">День</th>
                <th className="px-4 py-3">Унікальні відвідувачі</th>
                <th className="px-4 py-3">Перегляди сторінок</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...siteTraffic.dailyLast30Days].reverse().map((day) => (
                <tr key={day.date} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-medium text-gray-900">{day.label}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">
                    {day.uniqueVisitors.toLocaleString("uk-UA")}
                  </td>
                  <td className="px-4 py-3">{day.pageViews.toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Користувачі</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">{stats.platformTotals.totalUsers}</p>
          <p className="mt-1 text-xs text-gray-400">без демо-акаунтів</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Усього оголошень</p>
          <p className="mt-1 text-3xl font-bold text-sky-700">
            {stats.platformTotals.totalListings.toLocaleString("uk-UA")}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            активних: {stats.platformTotals.activeListings.toLocaleString("uk-UA")}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Заробіток продавців</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">
            {formatAdminMoney(stats.platformTotals.totalEarnings)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {stats.platformTotals.paidOrders} оплачених замовлень
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Перегляди оголошень</p>
          <p className="mt-1 text-3xl font-bold text-violet-700">
            {stats.totalListingViews.toLocaleString("uk-UA")}
          </p>
          <p className="mt-1 text-xs text-gray-400">всі перегляди в каталозі</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Активні за 24 год</p>
          <p className="mt-1 text-3xl font-bold text-orange-700">
            {stats.periods.find((period) => period.key === "last24h")?.activeUsers ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-400">замовлення, повідомлення, оголошення</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Активні за тиждень</p>
          <p className="mt-1 text-3xl font-bold text-amber-700">
            {stats.periods.find((period) => period.key === "last7d")?.activeUsers ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-400">унікальні користувачі</p>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">Нові реєстрації</h2>
          <p className="mt-1 text-sm text-gray-500">
            Скільки реальних користувачів зареєструвалось за обраний період (час за Києвом)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Період</th>
                <th className="px-4 py-3">Реєстрації</th>
                <th className="px-4 py-3">Активні корист.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrationPeriods.map((period) => (
                <tr key={period.key} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-semibold text-gray-900">{period.label}</td>
                  <td className="px-4 py-3 text-lg font-bold text-brand-700">
                    {period.registrations.toLocaleString("uk-UA")}
                  </td>
                  <td className="px-4 py-3">{period.activeUsers.toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950">
        <p className="font-semibold">Про активність на сайті</p>
        <p className="mt-1">
          Блок «Відвідувачі lokalno.plus» показує реальні заходи на сайт (унікальні браузери та
          перегляди сторінок). Нижче —{" "}
          <strong>активні зареєстровані користувачі</strong>: ті, хто оформив замовлення, написав
          повідомлення, додав оголошення або додав у обране за обраний період.
        </p>
      </div>

      <div id="ukraine-map" className="mb-8 scroll-mt-24">
        <AdminUkraineMap cities={stats.cityMap.cities} oblasts={stats.cityMap.oblasts} />
      </div>

      <AdminActivityCharts
        dailyActivity={stats.dailyActivity}
        weekdayActivityByRange={stats.weekdayActivityByRange}
      />

      <div className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Скасовані замовлення</h2>
        <p className="mt-1 text-sm text-gray-500">
          Статистика скасувань продавцем та автоматичних скасувань без ТТН
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
            <p className="text-sm text-gray-600">Скасовано продавцем</p>
            <p className="mt-1 text-2xl font-bold text-red-700">
              {cancellationStats.sellerCancelled.toLocaleString("uk-UA")}
            </p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-sm text-gray-600">Автоскасування (без ТТН 3 дні)</p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {cancellationStats.autoCancelled.toLocaleString("uk-UA")}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Скасовано покупцем</p>
            <p className="mt-1 text-2xl font-bold text-gray-700">
              {cancellationStats.buyerCancelled.toLocaleString("uk-UA")}
            </p>
            <p className="mt-1 text-xs text-gray-400">не впливає на рейтинг продавця</p>
          </div>
        </div>

        {cancellationStats.bySellerReason.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Причина</th>
                  <th className="px-4 py-3">Кількість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cancellationStats.bySellerReason.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-gray-900">{row.label}</td>
                    <td className="px-4 py-3 font-semibold">{row.count.toLocaleString("uk-UA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Скасувань від продавця поки немає.</p>
        )}

        <div className="mt-8 border-t pt-6">
          <h3 className="text-base font-bold text-gray-900">Причини скасування покупцем</h3>
          <p className="mt-1 text-sm text-gray-500">
            Чому покупці скасовують замовлення до відправки
          </p>
        </div>

        {cancellationStats.byBuyerReason.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Причина</th>
                  <th className="px-4 py-3">Кількість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cancellationStats.byBuyerReason.map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-gray-900">{row.label}</td>
                    <td className="px-4 py-3 font-semibold">{row.count.toLocaleString("uk-UA")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">Скасувань від покупців з причиною поки немає.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Період</th>
                <th className="px-4 py-3">Нові реєстрації</th>
                <th className="px-4 py-3">Продажі ₴</th>
                <th className="px-4 py-3">Замовлень</th>
                <th className="px-4 py-3">Одиниць товару</th>
                <th className="px-4 py-3">Активні корист.</th>
                <th className="px-4 py-3">Нові оголош.</th>
                <th className="px-4 py-3">Повідомлень</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.periods.map((period) => (
                <tr key={period.key} className="hover:bg-gray-50/70">
                  <td className="px-4 py-3 font-semibold text-gray-900">{period.label}</td>
                  <td className="px-4 py-3">{period.registrations.toLocaleString("uk-UA")}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">
                    {formatAdminMoney(period.salesAmount)}
                  </td>
                  <td className="px-4 py-3">{period.salesOrders.toLocaleString("uk-UA")}</td>
                  <td className="px-4 py-3">{period.salesItems.toLocaleString("uk-UA")}</td>
                  <td className="px-4 py-3">{period.activeUsers.toLocaleString("uk-UA")}</td>
                  <td className="px-4 py-3">{period.newListings.toLocaleString("uk-UA")}</td>
                  <td className="px-4 py-3">{period.messages.toLocaleString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Демо-акаунти ({stats.demoUsersTotal}) не враховуються у реєстраціях. Оновлено:{" "}
        {new Date(stats.generatedAt).toLocaleString("uk-UA", { timeZone: "Europe/Kyiv" })}
      </p>
    </div>
  );
}
