import type { Prisma } from "@prisma/client";
import { formatOrderNumber } from "@/lib/order-number";

function orderRef(orderNumber: number): string {
  return formatOrderNumber(orderNumber);
}

export function buildSellerNewOrderMessage(
  orderNumber: number,
  listingTitle: string,
  buyerName: string
): string {
  return `🛒 Нове замовлення ${orderRef(orderNumber)} на «${listingTitle}» від ${buyerName}. Перегляньте в розділі «Мої замовлення».`;
}

export async function notifySellerNewOrder(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    buyerName: string;
    orderNumber: number;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.buyerId,
      receiverId: params.sellerId,
      content: buildSellerNewOrderMessage(
        params.orderNumber,
        params.listingTitle,
        params.buyerName
      ),
    },
  });
}

export function buildSellerCancelledOrderMessage(
  orderNumber: number,
  listingTitle: string
): string {
  return `🔔 Продавець скасував ${orderRef(orderNumber)} на «${listingTitle}». Перегляньте деталі в розділі «Мої покупки» або напишіть продавцю, якщо потрібні пояснення.`;
}

export async function notifyBuyerOrderCancelledBySeller(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    orderNumber: number;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerCancelledOrderMessage(params.orderNumber, params.listingTitle),
    },
  });
}

export function buildSellerConfirmedOrderMessage(
  orderNumber: number,
  listingTitle: string
): string {
  return `✅ Продавець прийняв ${orderRef(orderNumber)} на «${listingTitle}». Незабаром відправимо Nova Poshta по всій Україні — ви отримаєте ТТН для відстеження.`;
}

export async function notifyBuyerOrderConfirmed(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    orderNumber: number;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerConfirmedOrderMessage(params.orderNumber, params.listingTitle),
    },
  });
}

export function buildSellerShippedOrderMessage(
  orderNumber: number,
  listingTitle: string,
  ttn: string,
  trackingUrl: string
): string {
  return `📦 ${orderRef(orderNumber)} «${listingTitle}» відправлено Nova Poshta по Україні.\nТТН: ${ttn}\nВідстежити: ${trackingUrl}`;
}

export async function notifyBuyerOrderShipped(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    orderNumber: number;
    ttn: string;
    trackingUrl: string;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerShippedOrderMessage(
        params.orderNumber,
        params.listingTitle,
        params.ttn,
        params.trackingUrl
      ),
    },
  });
}
