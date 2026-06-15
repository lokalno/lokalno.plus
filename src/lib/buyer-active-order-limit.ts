import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Замовлення, що займають слот активного ліміту покупця. */
export const BUYER_ACTIVE_ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED"] as const;

type OrderDb = Pick<typeof prisma, "order"> | Prisma.TransactionClient;

function formatActiveOrdersPhrase(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return `${count} активне замовлення`;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return `${count} активних замовлення`;
  }

  return `${count} активних замовлень`;
}

export function getBuyerActiveOrderLimit(completedOrdersCount: number): number {
  if (completedOrdersCount >= 5) return 10;
  if (completedOrdersCount >= 1) return 5;
  return 3;
}

export function formatBuyerActiveOrderLimitMessage(activeCount: number): string {
  return `У вас уже є ${formatActiveOrdersPhrase(activeCount)}. Завершіть або скасуйте одне з них, щоб оформити нове замовлення.`;
}

export type BuyerActiveOrderLimitSnapshot = {
  activeCount: number;
  completedCount: number;
  limit: number;
  ok: boolean;
  error?: string;
};

export async function getBuyerOrderLimitSnapshot(
  buyerId: string,
  db: OrderDb = prisma
): Promise<BuyerActiveOrderLimitSnapshot> {
  const [activeCount, completedCount] = await Promise.all([
    db.order.count({
      where: {
        buyerId,
        status: { in: [...BUYER_ACTIVE_ORDER_STATUSES] },
      },
    }),
    db.order.count({
      where: {
        buyerId,
        status: "COMPLETED",
      },
    }),
  ]);

  const limit = getBuyerActiveOrderLimit(completedCount);
  const ok = activeCount < limit;

  return {
    activeCount,
    completedCount,
    limit,
    ok,
    ...(ok ? {} : { error: formatBuyerActiveOrderLimitMessage(activeCount) }),
  };
}
