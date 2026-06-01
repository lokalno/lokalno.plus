import { getNovaPoshtaTrackingUrl } from "@/lib/order-shipping";
import { formatSellerOrderNumber } from "@/lib/seller-orders";

export type OrderLabelSource = {
  id: string;
  orderNumber: number;
  status: string;
  paymentStatus: string;
  quantity?: number;
  novaPoshtaTtn?: string | null;
  createdAt: Date | string;
  listing: { title: string; price: number };
  buyer: { name: string };
  recipientFirstName: string;
  recipientLastName: string;
  recipientPhone: string;
  deliveryOblast: string;
  deliveryRaion: string;
  deliveryCity: string;
  deliveryWarehouse: string;
};

export function buildOrderLabelQrPayload(order: OrderLabelSource): string {
  if (order.novaPoshtaTtn) {
    return getNovaPoshtaTrackingUrl(order.novaPoshtaTtn);
  }

  const recipient = `${order.recipientLastName} ${order.recipientFirstName}`.trim();
  const lines = [
    `LOKALNO.PLUS ${formatSellerOrderNumber(order)}`,
    recipient ? `Отримувач: ${recipient}` : "",
    order.recipientPhone ? `Тел.: ${order.recipientPhone}` : "",
    order.deliveryCity
      ? `Адреса: ${order.deliveryCity}, ${order.deliveryRaion}, ${order.deliveryOblast}`
      : "",
    order.deliveryWarehouse ? `Nova Poshta: ${order.deliveryWarehouse}` : "",
    `Товар: ${order.listing.title}`,
  ].filter(Boolean);

  return lines.join("\n");
}
