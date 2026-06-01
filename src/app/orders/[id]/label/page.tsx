import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatOrderPaymentStatus } from "@/lib/order-payment";
import NovaPoshtaSellerGuide from "@/components/NovaPoshtaSellerGuide";
import { formatOrderDelivery } from "@/lib/order-shipping";
import { buildOrderLabelQrPayload } from "@/lib/order-label";
import {
  formatBuyerPhone,
  formatSellerOrderDate,
  formatSellerOrderNumber,
} from "@/lib/seller-orders";
import { getOrderTotalAmount, getOrderQuantity, formatOrderQuantityLabel } from "@/lib/order-total";
import { formatPrice } from "@/lib/utils";
import OrderLabelPrintButton from "@/components/OrderLabelPrintButton";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function OrderLabelPage({ params }: Params) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/orders/${id}/label`);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      listing: { select: { title: true, price: true } },
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
  });

  if (!order || order.sellerId !== session.user.id) {
    notFound();
  }

  const deliveryLines = formatOrderDelivery(order);
  const quantity = getOrderQuantity(order);
  const orderTotal = getOrderTotalAmount(order.listing.price, quantity);
  const qrPayload = buildOrderLabelQrPayload(order);
  const qrDataUrl = await QRCode.toDataURL(qrPayload, {
    width: 240,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="mx-auto max-w-lg px-4 py-6 print:max-w-none print:p-0">
        <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
          <Link href="/orders" className="text-sm font-medium text-brand-700 hover:underline">
            ← Назад до замовлень
          </Link>
          <OrderLabelPrintButton />
        </div>

        <article className="overflow-hidden rounded-2xl border border-gray-300 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
          <header className="border-b border-gray-200 bg-brand-600 px-6 py-4 text-white print:bg-white print:text-black">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-90 print:text-gray-600">
              lokalno.plus
            </p>
            <h1 className="mt-1 text-xl font-bold">
              Етикетка Nova Poshta · {formatSellerOrderNumber(order.id)}
            </h1>
            <p className="mt-1 text-sm opacity-90 print:text-gray-600">
              {formatSellerOrderDate(order.createdAt)} р.
            </p>
          </header>

          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto]">
            <div className="space-y-5 text-sm">
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Отримувач
                </h2>
                {deliveryLines.length > 0 ? (
                  <div className="space-y-1 text-base text-gray-900">
                    {deliveryLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Адресу доставки не вказано</p>
                )}
              </section>

              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Замовлення
                </h2>
                <p className="font-semibold text-gray-900">{order.listing.title}</p>
                <p className="mt-1 text-gray-700">
                  {formatOrderQuantityLabel(quantity)} · {formatPrice(orderTotal)}
                </p>
                <p className="mt-1 text-gray-600">
                  Покупець: {order.buyer.name}
                  {order.recipientPhone ? ` · ${formatBuyerPhone(order.recipientPhone)}` : ""}
                </p>
                <p className="mt-1 text-gray-600">
                  Статус: {ORDER_STATUSES[order.status] || order.status} ·{" "}
                  {formatOrderPaymentStatus(order.paymentStatus)}
                </p>
                <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-950">
                  Контроль оплати (NP): {formatPrice(orderTotal)}
                </p>
              </section>

              {order.novaPoshtaTtn && (
                <section className="rounded-lg border border-violet-200 bg-violet-50 p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-700">
                    ТТН Nova Poshta
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-violet-950">
                    {order.novaPoshtaTtn}
                  </p>
                </section>
              )}
            </div>

            <aside className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center print:border-gray-400">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR-код для Nova Poshta"
                width={200}
                height={200}
                className="h-[200px] w-[200px]"
              />
              <p className="mt-3 text-xs font-medium text-gray-700">
                {order.novaPoshtaTtn
                  ? "Покажіть QR на відділенні або наклейте на посилку для відстеження ТТН"
                  : "Покажіть QR на відділенні Nova Poshta з даними отримувача"}
              </p>
            </aside>
          </div>

          <footer className="border-t border-gray-200 bg-gray-50 px-6 py-4 text-xs text-gray-600 print:bg-white">
            <NovaPoshtaSellerGuide codAmount={orderTotal} compact />
          </footer>
        </article>
      </div>
    </div>
  );
}
