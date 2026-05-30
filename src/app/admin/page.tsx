import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countOpenSupportTickets } from "@/lib/support-tickets";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const [usersCount, listingsCount, ordersCount, activeListings, pendingReports, pendingListings, openSupport] =
    await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.order.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "PENDING" } }),
    countOpenSupportTickets(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Адмін-панель</h1>

      {pendingListings > 0 && (
        <Link
          href="/admin/listings?status=pending"
          className="mb-4 block rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 hover:from-amber-600 hover:to-amber-700 transition-shadow shadow-md hover:shadow-lg"
        >
          <p className="text-lg font-bold">✓ Підтвердити оголошення</p>
          <p className="text-amber-50 mt-1">
            {pendingListings} нових оголошень чекають модерації — натисніть тут
          </p>
        </Link>
      )}

      {openSupport > 0 && (
        <Link
          href="/admin/support"
          className="mb-8 block rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 hover:from-blue-600 hover:to-blue-700 transition-shadow shadow-md hover:shadow-lg"
        >
          <p className="text-lg font-bold">💬 Нові звернення в підтримку</p>
          <p className="text-blue-50 mt-1">
            {openSupport} повідомлень від користувачів — натисніть тут
          </p>
        </Link>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Користувачі", value: usersCount },
          { label: "Оголошення", value: listingsCount },
          { label: "Активні", value: activeListings },
          { label: "Замовлення", value: ordersCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-brand-700">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/settings"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg mb-1">⚙️ Налаштування сайту</h2>
          <p className="text-sm text-gray-500">Назва, правила, модерація</p>
        </Link>

        <Link
          href="/admin/listings"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow border-yellow-100"
        >
          <h2 className="font-semibold text-lg mb-1">
            📦 Модерація оголошень
            {pendingListings > 0 && (
              <span className="ml-2 text-sm bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                {pendingListings}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Схвалити, приховати, видалити</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
        >
          <h2 className="font-semibold text-lg mb-1">👥 Користувачі</h2>
          <p className="text-sm text-gray-500">Блокування, список</p>
        </Link>

        <Link
          href="/admin/support"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow border-blue-100"
        >
          <h2 className="font-semibold text-lg mb-1">
            💬 Підтримка
            {openSupport > 0 && (
              <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {openSupport}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500">Повідомлення від користувачів</p>
        </Link>

        <Link
          href="/admin/reports"
          className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow border-red-100"
        >
          <h2 className="font-semibold text-lg mb-1">
            🚩 Скарги
            {pendingReports > 0 && (
              <span className="ml-2 text-sm bg-red-600 text-white px-2 py-0.5 rounded-full">
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
