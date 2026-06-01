import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import AdminOrderSupportSearch from "@/components/AdminOrderSupportSearch";
import { authOptions, requireAdmin } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatOrderNumber, parseOrderNumberQuery } from "@/lib/order-number";
import { formatOrderPaymentStatus } from "@/lib/order-payment";
import { prisma } from "@/lib/prisma";
import { getOrderTotalFromRecord } from "@/lib/order-total";
import { formatDate, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

export default async function AdminOrderSupportPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");

  const isAdmin = await requireAdmin(session.user.id);
  if (!isAdmin) redirect("/");

  const rawQuery = params.q?.trim() ?? "";
  const parsedNumber = rawQuery ? parseOrderNumberQuery(rawQuery) : null;

  const order =
    parsedNumber != null
      ? await prisma.order.findUnique({
          where: { orderNumber: parsedNumber },
          include: {
            listing: { select: { id: true, title: true, price: true } },
            buyer: { select: { name: true, email: true, phone: true } },
            seller: { select: { name: true, email: true } },
          },
        })
      : null;

  const orderTotal = order ? getOrderTotalFromRecord(order) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/admin" className="text-sm font-medium text-brand-700 hover:underline">
        ← Адмін-панель
      </Link>

      <h1 className="mt-2 text-2xl font-bold text-gray-900">
        🛠️ Замовлення · технічна підтримка
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Пошук замовлення за номером для підтримки користувачів. Приклад:{" "}
        <span className="font-mono text-gray-700">ORD-10001</span>,{" "}
        <span className="font-mono text-gray-700">#ORD-10002</span> або{" "}
        <span className="font-mono text-gray-700">10003</span>.
      </p>

      <Suspense fallback={<div className="mb-6 h-11 animate-pulse rounded-xl bg-gray-100" />}>
        <AdminOrderSupportSearch />
      </Suspense>

      {!rawQuery && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
          <p className="text-3xl">🔎</p>
          <p className="mt-2">Введіть номер замовлення та натисніть «Знайти»</p>
        </div>
      )}

      {rawQuery && parsedNumber == null && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">Невірний формат номера</p>
          <p className="mt-1">
            Використовуйте формат <span className="font-mono">ORD-10001</span> або лише цифри, наприклад{" "}
            <span className="font-mono">10001</span>.
          </p>
        </div>
      )}

      {rawQuery && parsedNumber != null && !order && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          <p className="text-3xl">📭</p>
          <p className="mt-2">
            Замовлення <span className="font-mono font-semibold">{formatOrderNumber(parsedNumber)}</span>{" "}
            не знайдено
          </p>
        </div>
      )}

      {order && (
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b bg-violet-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              Знайдено замовлення
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-violet-950">
              {formatOrderNumber(order.orderNumber)}
            </p>
          </div>

          <dl className="divide-y divide-gray-100 text-sm">
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">ID замовлення</dt>
              <dd className="font-mono font-semibold text-brand-700">
                {formatOrderNumber(order.orderNumber)}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Товар</dt>
              <dd>
                <Link
                  href={`/listings/${order.listing.id}`}
                  className="font-medium text-gray-900 hover:text-brand-700"
                >
                  {order.listing.title}
                </Link>
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Покупець</dt>
              <dd className="text-gray-900">
                <p className="font-medium">{order.buyer.name}</p>
                <p className="text-xs text-gray-500">{order.buyer.email}</p>
                {order.buyer.phone && (
                  <p className="text-xs text-gray-500">{order.buyer.phone}</p>
                )}
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Статус</dt>
              <dd className="font-medium text-gray-900">
                {ORDER_STATUSES[order.status] || order.status}
                <span className="mt-1 block text-xs font-normal text-gray-500">
                  Оплата: {formatOrderPaymentStatus(order.paymentStatus)}
                </span>
              </dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Дата створення</dt>
              <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Сума замовлення</dt>
              <dd className="text-lg font-bold text-emerald-700">{formatPrice(orderTotal)}</dd>
            </div>
            <div className="grid gap-1 px-5 py-4 sm:grid-cols-[9rem_1fr]">
              <dt className="text-gray-500">Продавець</dt>
              <dd className="text-gray-900">
                <p className="font-medium">{order.seller.name}</p>
                <p className="text-xs text-gray-500">{order.seller.email}</p>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
