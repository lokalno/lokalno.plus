"use client";

import { useEffect } from "react";
import Link from "next/link";
import OrderLabelButton from "@/components/OrderLabelDevNotice";
import { formatPrice, parsePhotos } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatOrderPaymentStatus } from "@/lib/order-payment";
import OrderPaymentInfo from "@/components/OrderPaymentInfo";
import { formatOrderDelivery } from "@/lib/order-shipping";
import {
  formatSellerOrderDate,
  formatSellerOrderNumber,
  getSellerOrderBucket,
  SELLER_ORDER_STATUS_LABELS,
} from "@/lib/seller-orders";
import { getOrderTotalFromRecord, getOrderUnitPrice, getOrderQuantity, formatOrderQuantityLabel } from "@/lib/order-total";
import OrderActions from "@/components/OrderActions";
import { OrderTrackingInfo } from "@/components/OrderShipForm";
import type { OrderListItem } from "@/components/OrdersList";

type OrderDetailsModalProps = {
  order: OrderListItem;
  open: boolean;
  onClose: () => void;
  isSeller?: boolean;
};

export default function OrderDetailsModal({
  order,
  open,
  onClose,
  isSeller = false,
}: OrderDetailsModalProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const photos = parsePhotos(order.listing.photos);
  const deliveryLines = formatOrderDelivery(order);
  const quantity = getOrderQuantity(order);
  const unitPrice = getOrderUnitPrice(order);
  const orderTotal = getOrderTotalFromRecord(order);
  const createdAt =
    typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt;
  const bucket = getSellerOrderBucket(order);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Закрити"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`order-details-${order.id}`}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Деталі замовлення
            </p>
            <h2 id={`order-details-${order.id}`} className="text-lg font-bold text-gray-900">
              {formatSellerOrderNumber(order)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
          >
            Закрити
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200">
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">📦</div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/listings/${order.listing.id}`}
                className="font-semibold text-gray-900 hover:text-brand-700"
              >
                {order.listing.title}
              </Link>
              {order.listing.itemLocation && (
                <p className="mt-2 inline-flex rounded-lg bg-amber-50 px-2.5 py-1 font-mono text-sm font-semibold text-amber-950 ring-1 ring-amber-200">
                  📍 Склад: {order.listing.itemLocation}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600">
                {formatOrderQuantityLabel(quantity)} ·{" "}
                <span className="font-semibold text-gray-900">{formatPrice(orderTotal)}</span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {formatSellerOrderDate(createdAt)} р.
              </p>
            </div>
          </div>

          <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Статус</dt>
              <dd className="font-medium text-gray-900">
                {SELLER_ORDER_STATUS_LABELS[bucket]} · {ORDER_STATUSES[order.status] || order.status}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Оплата</dt>
              <dd className="font-medium text-gray-900 text-right">
                {formatOrderPaymentStatus(order.paymentStatus)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Покупець</dt>
              <dd className="font-medium text-gray-900">{order.buyer.name}</dd>
            </div>
          </dl>

          <OrderPaymentInfo
            paymentStatus={order.paymentStatus}
            orderTotal={orderTotal}
            isSeller={isSeller}
            orderStatus={order.status}
          />

          {deliveryLines.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm">
              <p className="mb-2 font-semibold text-blue-900">📦 Доставка Nova Poshta</p>
              {order.variantColor && order.variantSize && (
                <p className="text-gray-700">
                  Варіант: {order.variantColor}, розмір {order.variantSize}
                </p>
              )}
              {deliveryLines.map((line) => (
                <p key={line} className="text-gray-700">
                  {line}
                </p>
              ))}
            </div>
          )}

          {order.novaPoshtaTtn && (
            <OrderTrackingInfo ttn={order.novaPoshtaTtn} />
          )}

          {isSeller &&
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED" &&
            order.status !== "NOT_RECEIVED_BY_BUYER" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-3 text-sm font-semibold text-gray-900">Дії з замовленням</p>
              <OrderActions
                orderId={order.id}
                status={order.status}
                isBuyer={false}
                isSeller
                createdAt={order.createdAt}
                deliveryLines={deliveryLines}
                codAmount={orderTotal}
                embedded
                buyerNotReceivedCount={order.buyer.buyerNotReceivedCount ?? 0}
              />
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            {isSeller ? (
              <OrderLabelButton
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900 hover:bg-violet-100"
                label="Етикетка / QR"
              />
            ) : (
              <Link
                href={`/orders/${order.id}/label`}
                target="_blank"
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-violet-300 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-900 hover:bg-violet-100"
              >
                🖨️ Роздрукувати етикетку / QR
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Закрити
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
