import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions, requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatOrderNumber } from "@/lib/order-number";
import { formatOrderPaymentStatus } from "@/lib/order-payment";
import { prisma } from "@/lib/prisma";
import { getOrderTotalFromRecord } from "@/lib/order-total";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const orders = await prisma.order.findMany({
    include: {
      listing: { select: { title: true, price: true } },
      buyer: { select: { name: true, email: true } },
      seller: { select: { name: true, email: true } },
    },
    orderBy: { orderNumber: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
          ← Адмін-панель
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">🛒 Замовлення</h1>
        <p className="mt-1 text-sm text-gray-500">
          Останні {orders.length} замовлень з номерами {formatOrderNumber(10001)} …
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          Замовлень поки немає
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">ID замовлення</th>
                  <th className="px-4 py-3">Товар</th>
                  <th className="px-4 py-3">Покупець</th>
                  <th className="px-4 py-3">Продавець</th>
                  <th className="px-4 py-3">Сума</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Оплата</th>
                  <th className="px-4 py-3">Дата</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-semibold text-brand-700">
                      {formatOrderNumber(order.orderNumber)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/listings/${order.listingId}`}
                        className="font-medium text-gray-900 hover:text-brand-700"
                      >
                        {order.listing.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{order.buyer.name}</p>
                      <p className="text-xs text-gray-400">{order.buyer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>{order.seller.name}</p>
                      <p className="text-xs text-gray-400">{order.seller.email}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {formatPrice(getOrderTotalFromRecord(order))}
                    </td>
                    <td className="px-4 py-3">
                      {ORDER_STATUSES[order.status] || order.status}
                    </td>
                    <td className="px-4 py-3">
                      {formatOrderPaymentStatus(order.paymentStatus)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
