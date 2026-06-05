import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import AdminUkraineMap from "@/components/AdminUkraineMap";
import { authOptions, requireAdmin } from "@/lib/auth";
import { getAdminCityMapData } from "@/lib/admin-stats";
import { prisma } from "@/lib/prisma";
import { countOpenSupportTickets } from "@/lib/support-tickets";
import { DEMO_SELLER_EMAILS } from "@/lib/purge-demo-listings";
import AdminPurgeDemoButton from "@/components/AdminPurgeDemoButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const [
    usersCount,
    listingsCount,
    ordersCount,
    activeListings,
    pendingReports,
    pendingListings,
    openSupport,
    pendingWithdrawals,
    cityMap,
    demoListingsCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.order.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "PENDING" } }),
    countOpenSupportTickets(),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    getAdminCityMapData(prisma),
    prisma.listing.count({
      where: { seller: { email: { in: [...DEMO_SELLER_EMAILS] } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Адмін-панель</h1>

      <div className="mb-6">
        <AdminPurgeDemoButton demoListingsCount={demoListingsCount} />
      </div>

      {pendingListings > 0 && (
        <Link
          href="/admin/listings?status=pending"
          className="mb-4 block rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white shadow-md transition-shadow hover:from-amber-600 hover:to-amber-700 hover:shadow-lg"
        >
          <p className="text-lg font-bold">✓ Підтвердити оголошення</p>
          <p className="mt-1 text-amber-50">
            {pendingListings} нових оголошень чекають модерації — натисніть тут
          </p>
        </Link>
      )}

      {openSupport > 0 && (
        <Link
          href="/admin/support"
          className="mb-8 block rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-md transition-shadow hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
        >
          <p className="text-lg font-bold">💬 Нові звернення в підтримку</p>
          <p className="mt-1 text-blue-50">
            {openSupport} повідомлень від користувачів — натисніть тут
          </p>
        </Link>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Користувачі", value: usersCount },
          { label: "Оголошення", value: listingsCount },
          { label: "Активні", value: activeListings },
          { label: "Замовлення", value: ordersCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 text-center">
            <p className="text-2xl font-bold text-brand-700">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div id="ukraine-map" className="mb-8 scroll-mt-24">
        <AdminUkraineMap cities={cityMap.cities} oblasts={cityMap.oblasts} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/admin/stats"
          className="rounded-xl border border-brand-100 bg-white p-6 transition-shadow hover:shadow-md sm:col-span-2"
        >
          <h2 className="mb-1 text-lg font-semibold">📊 Статистика платформи</h2>
          <p className="text-sm text-gray-500">
            Продажі, графіки активності, таблиця по періодах
          </p>
        </Link>

        <Link
          href="/admin/settings"
          className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">⚙️ Налаштування сайту</h2>
          <p className="text-sm text-gray-500">Назва, правила, модерація</p>
        </Link>

        <Link
          href="/admin/listings"
          className="rounded-xl border border-yellow-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">
            📦 Модерація оголошень
            {pendingListings > 0 && (
              <span className="ml-2 rounded-full bg-yellow-500 px-2 py-0.5 text-sm text-white">
                {pendingListings}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Схвалити, приховати, видалити</p>
        </Link>

        <Link
          href="/admin/order-support"
          className="rounded-xl border border-violet-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">🛠️ Замовлення · технічна підтримка</h2>
          <p className="text-sm text-gray-500">
            Пошук за ORD-10001, ORD-10002 … для підтримки
          </p>
        </Link>

        <Link
          href="/admin/orders"
          className="rounded-xl border border-violet-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">🛒 Замовлення</h2>
          <p className="text-sm text-gray-500">
            Список замовлень з номерами ORD-10001 …
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="rounded-xl border bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">👥 Користувачі</h2>
          <p className="text-sm text-gray-500">Блокування, список</p>
        </Link>

        <Link
          href="/admin/support"
          className="rounded-xl border border-blue-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">
            💬 Підтримка
            {openSupport > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-sm text-white">
                {openSupport}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Повідомлення від користувачів</p>
        </Link>

        <Link
          href="/admin/withdrawals"
          className="rounded-xl border border-green-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">
            💰 Виведення коштів
            {pendingWithdrawals > 0 && (
              <span className="ml-2 rounded-full bg-green-600 px-2 py-0.5 text-sm text-white">
                {pendingWithdrawals}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Перекази на банківські картки</p>
        </Link>

        <Link
          href="/admin/reports"
          className="rounded-xl border border-red-100 bg-white p-6 transition-shadow hover:shadow-md"
        >
          <h2 className="mb-1 text-lg font-semibold">
            🚩 Скарги
            {pendingReports > 0 && (
              <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-sm text-white">
                {pendingReports}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Скарги на заборонені товари</p>
        </Link>
      </div>
    </div>
  );
}
