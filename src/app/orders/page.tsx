import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatDate, parsePhotos } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { PAYMENT_STATUSES } from "@/lib/wallet";
import { formatOrderDelivery } from "@/lib/order-shipping";
import OrderActions from "@/components/OrderActions";
import OrderPayButton from "@/components/OrderPayButton";
import ReviewForm from "@/components/ReviewForm";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    include: {
      listing: true,
      buyer: { select: { name: true } },
      seller: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const orderIds = orders.map((o) => o.id);
  const reviews = await prisma.review.findMany({
    where: { orderId: { in: orderIds } },
    select: { orderId: true },
  });
  const reviewedOrderIds = new Set(reviews.map((r) => r.orderId));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Мої замовлення</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Замовлень поки немає
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const photos = parsePhotos(order.listing.photos);
            const isBuyer = order.buyerId === session.user!.id;
            const canReview =
              isBuyer &&
              order.status === "COMPLETED" &&
              !reviewedOrderIds.has(order.id);
            const deliveryLines = formatOrderDelivery(order);

            return (
              <div key={order.id} className="bg-white rounded-xl border p-4 flex gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/listings/${order.listing.id}`}
                    className="font-medium hover:text-brand-700 truncate block"
                  >
                    {order.listing.title}
                  </Link>
                  <p className="text-brand-700 font-bold">{formatPrice(order.listing.price)}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {isBuyer ? (
                      <>
                        Продавець:{" "}
                        <Link href={`/sellers/${order.sellerId}`} className="text-brand-700 hover:underline">
                          {order.seller.name}
                        </Link>
                      </>
                    ) : (
                      `Покупець: ${order.buyer.name}`
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  <p className="text-sm mt-1">
                    Статус:{" "}
                    <span className="font-medium">
                      {ORDER_STATUSES[order.status] || order.status}
                    </span>
                    {" · "}
                    <span className="font-medium">
                      {PAYMENT_STATUSES[order.paymentStatus] || order.paymentStatus}
                    </span>
                  </p>

                  {isBuyer && order.status !== "CANCELLED" && (
                    <OrderPayButton
                      orderId={order.id}
                      price={order.listing.price}
                      paymentStatus={order.paymentStatus}
                    />
                  )}

                  {!isBuyer && order.paymentStatus === "PAID" && (
                    <p className="text-sm text-brand-700 font-medium mt-2">
                      ✓ Оплачено · {formatPrice(order.listing.price)} на вашому балансі
                    </p>
                  )}

                  {deliveryLines.length > 0 && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-gray-700">
                      <p className="font-medium text-blue-900 mb-1">📦 Доставка Nova Poshta</p>
                      {deliveryLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  )}

                  <OrderActions
                    orderId={order.id}
                    status={order.status}
                    isBuyer={isBuyer}
                    isSeller={!isBuyer}
                  />

                  {canReview && <ReviewForm orderId={order.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
