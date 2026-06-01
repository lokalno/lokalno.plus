import type { Prisma } from "@prisma/client";

export function buildSellerCancelledOrderMessage(listingTitle: string): string {
  return `🔔 Продавець скасував ваше замовлення на «${listingTitle}». Перегляньте деталі в розділі «Мої покупки» або напишіть продавцю, якщо потрібні пояснення.`;
}

export async function notifyBuyerOrderCancelledBySeller(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerCancelledOrderMessage(params.listingTitle),
    },
  });
}

export function buildSellerConfirmedOrderMessage(listingTitle: string): string {
  return `✅ Продавець прийняв ваше замовлення на «${listingTitle}». Незабаром відправимо Nova Poshta по всій Україні — ви отримаєте ТТН для відстеження.`;
}

export async function notifyBuyerOrderConfirmed(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerConfirmedOrderMessage(params.listingTitle),
    },
  });
}

export function buildSellerShippedOrderMessage(listingTitle: string, ttn: string, trackingUrl: string): string {
  return `📦 Ваше замовлення «${listingTitle}» відправлено Nova Poshta по Україні.\nТТН: ${ttn}\nВідстежити: ${trackingUrl}`;
}

export async function notifyBuyerOrderShipped(
  tx: Prisma.TransactionClient,
  params: {
    listingId: string;
    sellerId: string;
    buyerId: string;
    listingTitle: string;
    ttn: string;
    trackingUrl: string;
  }
): Promise<void> {
  await tx.message.create({
    data: {
      listingId: params.listingId,
      senderId: params.sellerId,
      receiverId: params.buyerId,
      content: buildSellerShippedOrderMessage(params.listingTitle, params.ttn, params.trackingUrl),
    },
  });
}
