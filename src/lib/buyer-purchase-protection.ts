import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NOT_RECEIVED_BY_BUYER_STATUS = "NOT_RECEIVED_BY_BUYER";

export const BUYER_NOT_RECEIVED_AUTO_BLOCK_COUNT = 3;
export const BUYER_NOT_RECEIVED_AUTO_BLOCK_DAYS = 30;

export const BUYER_SELLER_WARNING_MESSAGE =
  "У покупця вже були неотримані замовлення";

type UserDb = Pick<typeof prisma, "user" | "order"> | Prisma.TransactionClient;

export type BuyerOrderStats = {
  total: number;
  completed: number;
  notReceived: number;
  cancelled: number;
};

export type BuyerPurchaseBlockSnapshot = {
  blocked: boolean;
  reason?: string;
  blockedUntil?: Date | null;
  notReceivedCount: number;
};

export async function getBuyerOrderStats(
  buyerId: string,
  db: UserDb = prisma
): Promise<BuyerOrderStats> {
  const [total, completed, notReceived, cancelled] = await Promise.all([
    db.order.count({ where: { buyerId } }),
    db.order.count({ where: { buyerId, status: "COMPLETED" } }),
    db.order.count({ where: { buyerId, status: NOT_RECEIVED_BY_BUYER_STATUS } }),
    db.order.count({ where: { buyerId, status: "CANCELLED" } }),
  ]);

  return { total, completed, notReceived, cancelled };
}

export function formatBuyerPurchasesBlockedMessage(
  snapshot: BuyerPurchaseBlockSnapshot
): string {
  if (snapshot.blockedUntil) {
    const until = new Intl.DateTimeFormat("uk-UA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(snapshot.blockedUntil);
    return `Оформлення нових замовлень тимчасово обмежено до ${until}. ${
      snapshot.reason || "Зверніться до підтримки, якщо вважаєте це помилкою."
    }`;
  }

  return (
    snapshot.reason ||
    "Оформлення нових замовлень тимчасово обмежено. Зверніться до підтримки."
  );
}

export async function getBuyerPurchaseBlockSnapshot(
  buyerId: string,
  db: UserDb = prisma
): Promise<BuyerPurchaseBlockSnapshot> {
  const user = await db.user.findUnique({
    where: { id: buyerId },
    select: {
      buyerNotReceivedCount: true,
      buyerPurchasesBlocked: true,
      buyerPurchasesBlockedUntil: true,
      buyerPurchasesBlockedReason: true,
    },
  });

  if (!user) {
    return { blocked: true, reason: "Користувача не знайдено", notReceivedCount: 0 };
  }

  const now = new Date();
  let blockedUntil = user.buyerPurchasesBlockedUntil;

  if (
    blockedUntil &&
    blockedUntil.getTime() <= now.getTime() &&
    !user.buyerPurchasesBlocked
  ) {
    await db.user.update({
      where: { id: buyerId },
      data: {
        buyerPurchasesBlockedUntil: null,
        buyerPurchasesBlockedReason: null,
      },
    });
    blockedUntil = null;
  }

  const blockedByAdmin = user.buyerPurchasesBlocked;
  const blockedByTime = Boolean(blockedUntil && blockedUntil.getTime() > now.getTime());

  return {
    blocked: blockedByAdmin || blockedByTime,
    blockedUntil,
    notReceivedCount: user.buyerNotReceivedCount,
    ...(blockedByAdmin
      ? {
          reason:
            user.buyerPurchasesBlockedReason ||
            "Оформлення замовлень обмежено адміністратором",
        }
      : blockedByTime
        ? {
            reason:
              user.buyerPurchasesBlockedReason ||
              "Автоматичне обмеження після повторних неотриманих посилок",
          }
        : {}),
  };
}

export async function assertBuyerCanPurchase(
  buyerId: string,
  db: UserDb = prisma
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Не залежить від того, чи користувач також продає на маркетплейсі.
  const snapshot = await getBuyerPurchaseBlockSnapshot(buyerId, db);
  if (!snapshot.blocked) return { ok: true };
  return { ok: false, error: formatBuyerPurchasesBlockedMessage(snapshot) };
}

export function shouldWarnSellerAboutBuyer(notReceivedCount: number): boolean {
  return notReceivedCount >= 1;
}

export async function applyBuyerNotReceivedPenalty(
  tx: Prisma.TransactionClient,
  buyerId: string
): Promise<{ newCount: number; autoBlocked: boolean }> {
  // Застосовується до будь-якого користувача в ролі покупця, включно з продавцями.
  const user = await tx.user.update({
    where: { id: buyerId },
    data: {
      buyerNotReceivedCount: { increment: 1 },
    },
    select: { buyerNotReceivedCount: true },
  });

  if (user.buyerNotReceivedCount >= BUYER_NOT_RECEIVED_AUTO_BLOCK_COUNT) {
    const until = new Date();
    until.setDate(until.getDate() + BUYER_NOT_RECEIVED_AUTO_BLOCK_DAYS);

    await tx.user.update({
      where: { id: buyerId },
      data: {
        buyerPurchasesBlockedUntil: until,
        buyerPurchasesBlockedReason:
          "Автоматичне обмеження: 3 неотримані посилки з Nova Poshta",
      },
    });

    return { newCount: user.buyerNotReceivedCount, autoBlocked: true };
  }

  return { newCount: user.buyerNotReceivedCount, autoBlocked: false };
}
