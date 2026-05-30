import type { Prisma } from "@prisma/client";

export async function creditSellerForPaidOrder(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { listing: { select: { title: true, price: true } } },
  });

  if (!order || order.paymentStatus !== "UNPAID") {
    throw new Error("ALREADY_PAID");
  }

  if (order.status === "CANCELLED") {
    throw new Error("ORDER_CANCELLED");
  }

  const amount = order.listing.price;

  await tx.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      paidAt: new Date(),
    },
  });

  await tx.user.update({
    where: { id: order.sellerId },
    data: { balance: { increment: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      userId: order.sellerId,
      amount,
      type: "SALE",
      description: `Оплата за «${order.listing.title}»`,
      orderId: order.id,
    },
  });
}

export async function reversePaidOrder(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { listing: { select: { title: true, price: true } } },
  });

  if (!order || order.paymentStatus !== "PAID") {
    return;
  }

  const amount = order.listing.price;

  await tx.order.update({
    where: { id: orderId },
    data: { paymentStatus: "REFUNDED" },
  });

  await tx.user.update({
    where: { id: order.sellerId },
    data: { balance: { decrement: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      userId: order.sellerId,
      amount: -amount,
      type: "SALE_REFUND",
      description: `Повернення оплати за «${order.listing.title}»`,
      orderId: order.id,
    },
  });
}
