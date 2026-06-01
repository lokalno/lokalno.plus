import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AdminActivityCharts from "@/components/AdminActivityCharts";
import AdminUkraineMap from "@/components/AdminUkraineMap";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAdminMoney, getAdminStatsSnapshot } from "@/lib/admin-stats";
export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const stats = await getAdminStatsSnapshot(prisma);
  const allTime = stats.periods.find((period) => period.key === "allTime");

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

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Реальні користувачі</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">{stats.realUsersTotal}</p>
          <p className="mt-1 text-xs text-gray-400">без демо-акаунтів</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Загальні продажі</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">
            {formatAdminMoney(allTime?.salesAmount ?? 0)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {allTime?.salesOrders ?? 0} замовлень · {allTime?.salesItems ?? 0} одиниць
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
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950">
        <p className="font-semibold">Про час на сайті</p>
        <p className="mt-1">
          Точний час перебування ще не відстежується. Нижче показано{" "}
          <strong>активних користувачів</strong> — тих, хто оформив замовлення, написав
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
