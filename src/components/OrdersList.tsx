"use client";

import Link from "next/link";
import { getSellerDisplayName } from "@/lib/seller-display-name";
import { formatOrderNumber } from "@/lib/order-number";
import { formatPrice, formatDate, parsePhotos } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatOrderDelivery } from "@/lib/order-shipping";
import { getOrderTotalFromRecord, getOrderUnitPrice, getOrderQuantity, formatOrderQuantityLabel } from "@/lib/order-total";
import { getBuyerOrderStatusBanner } from "@/lib/order-status-ui";
import OrderActions from "@/components/OrderActions";
import { OrderTrackingInfo } from "@/components/OrderShipForm";
import OrderPaymentInfo from "@/components/OrderPaymentInfo";
import ReviewForm from "@/components/ReviewForm";

export type OrderListItem = {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  quantity?: number;
  unitPrice?: number | null;
  buyerId: string;
  sellerId: string;
  cancelledById?: string | null;
  novaPoshtaTtn?: string | null;
  shippedAt?: Date | string | null;
  createdAt: Date | string;
  listing: {
    id: string;
    title: string;
    price: number;
    photos: string;
    itemLocation?: string | null;
  };
  buyer: { name: string };
  seller: { name: string; storeName?: string | null };
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  deliveryOblast: string;
  deliveryRaion: string;
  deliveryCity: string;
  deliveryWarehouse: string;
  deliveryMethod: string;
};

type OrdersListProps = {
  orders: OrderListItem[];
  currentUserId: string;
  reviewedOrderIds: Set<string>;
  emptyMessage?: string;
  sellerView?: boolean;
};

export default function OrdersList({
  orders,
  currentUserId,
  reviewedOrderIds,
  emptyMessage = "Замовлень поки немає",
  sellerView = false,
}: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const photos = parsePhotos(order.listing.photos);
        const isBuyer = order.buyerId === currentUserId;
        const isSeller = order.sellerId === currentUserId;
        const canReview =
          isBuyer && order.status === "COMPLETED" && !reviewedOrderIds.has(order.id);
        const deliveryLines = formatOrderDelivery(order);
        const quantity = getOrderQuantity(order);
        const unitPrice = getOrderUnitPrice(order);
        const orderTotal = getOrderTotalFromRecord(order);
        const buyerStatusBanner = isBuyer
          ? getBuyerOrderStatusBanner(order.status, {
              cancelledBySeller:
                order.status === "CANCELLED" && order.cancelledById === order.sellerId,
              cancelledByBuyer:
                order.status === "CANCELLED" && order.cancelledById === order.buyerId,
              novaPoshtaTtn: order.novaPoshtaTtn,
            })
          : null;

        return (
          <div key={order.id} className="flex gap-4 rounded-xl border bg-white p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">📦</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="mb-1 text-xs font-semibold text-gray-500">{formatOrderNumber(order.orderNumber)}</p>
              <Link
                href={`/listings/${order.listing.id}`}
                className="block truncate font-medium hover:text-brand-700"
              >
                {order.listing.title}
              </Link>
              <p className="font-bold text-brand-700">{formatPrice(orderTotal)}</p>
              {quantity > 1 && (
                <p className="text-xs text-gray-500">
                  {formatOrderQuantityLabel(quantity)} × {formatPrice(unitPrice)}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {sellerView || isSeller ? (
                  <>Покупець: {order.buyer.name}</>
                ) : isBuyer ? (
                  <>
                    Продавець:{" "}
                    <Link
                      href={`/sellers/${order.sellerId}`}
                      className="text-brand-700 hover:underline"
                    >
                      {getSellerDisplayName(order.seller)}
                    </Link>
                  </>
                ) : (
                  `Покупець: ${order.buyer.name}`
                )}
              </p>
              <p className="text-xs text-gray-400">
                {formatDate(
                  typeof order.createdAt === "string"
                    ? new Date(order.createdAt)
                    : order.createdAt
                )}
              </p>
              <p className="mt-1 text-sm">
                Статус:{" "}
                <span className="font-medium">
                  {ORDER_STATUSES[order.status] || order.status}
                </span>
              </p>

              {buyerStatusBanner && (
                <div className={`mt-3 rounded-lg border p-3 text-sm ${buyerStatusBanner.className}`}>
                  <p className="font-semibold">{buyerStatusBanner.title}</p>
                  <p className="mt-1">{buyerStatusBanner.message}</p>
                </div>
              )}

              <OrderPaymentInfo
                paymentStatus={order.paymentStatus}
                orderTotal={orderTotal}
                isBuyer={isBuyer}
                isSeller={isSeller}
                orderStatus={order.status}
              />

              {deliveryLines.length > 0 && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-sm text-gray-700">
                  <p className="mb-1 font-medium text-blue-900">📦 Доставка Nova Poshta</p>
                  {deliveryLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              )}

              {order.novaPoshtaTtn && (order.status === "SHIPPED" || order.status === "COMPLETED") && (
                <OrderTrackingInfo ttn={order.novaPoshtaTtn} />
              )}

              <OrderActions
                orderId={order.id}
                status={order.status}
                isBuyer={isBuyer}
                isSeller={isSeller}
                deliveryLines={deliveryLines}
                codAmount={orderTotal}
              />

              {canReview && <ReviewForm orderId={order.id} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
