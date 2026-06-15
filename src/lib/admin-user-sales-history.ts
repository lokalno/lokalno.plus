import type { PrismaClient } from "@prisma/client";
import { formatOrderNumber } from "@/lib/order-number";
import { getOrderTotalFromRecord } from "@/lib/order-total";
import { formatPrice, formatDate } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import { getReturnReasonLabel } from "@/lib/order-return";
import { getCancelReasonLabel } from "@/lib/order-cancel";
import { getSellerDisplayName } from "@/lib/seller-display-name";

export type AdminUserSalesHistoryPeriod = "day" | "month" | "year";

export type AdminUserSalesOrder = {
  id: string;
  orderNumber: number;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  returnRequestedAt: Date | null;
  returnReason: string | null;
  returnReasonNote: string | null;
  cancelReason: string | null;
  cancelReasonNote: string | null;
  quantity: number;
  listing: { id: string; title: string; price: number };
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; storeName: string | null; email: string };
  orderTotal: number;
};

export type AdminUserSalesGroup = {
  key: string;
  label: string;
  orders: AdminUserSalesOrder[];
  totalAmount: number;
};

function getPeriodKey(date: Date, period: AdminUserSalesHistoryPeriod): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (period === "year") return String(year);
  if (period === "month") return `${year}-${month}`;
  return `${year}-${month}-${day}`;
}

function getPeriodLabel(key: string, period: AdminUserSalesHistoryPeriod): string {
  if (period === "year") return key;

  if (period === "month") {
    const [year, month] = key.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(date);
  }

  const [year, month, day] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function groupAdminUserSalesOrders(
  orders: AdminUserSalesOrder[],
  period: AdminUserSalesHistoryPeriod
): AdminUserSalesGroup[] {
  const groups = new Map<string, AdminUserSalesOrder[]>();

  for (const order of orders) {
    const key = getPeriodKey(order.createdAt, period);
    const bucket = groups.get(key) ?? [];
    bucket.push(order);
    groups.set(key, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, bucket]) => ({
      key,
      label: getPeriodLabel(key, period),
      orders: bucket.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      totalAmount: bucket.reduce((sum, order) => sum + order.orderTotal, 0),
    }));
}

export async function getAdminUserSalesHistory(userId: string, prisma: PrismaClient) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      storeName: true,
      email: true,
      city: true,
      createdAt: true,
      role: true,
      banned: true,
    },
  });

  if (!user) return null;

  const orders = await prisma.order.findMany({
    where: { sellerId: userId },
    include: {
      listing: { select: { id: true, title: true, price: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, storeName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const salesOrders: AdminUserSalesOrder[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    returnRequestedAt: order.returnRequestedAt,
    returnReason: order.returnReason,
    returnReasonNote: order.returnReasonNote,
    cancelReason: order.cancelReason,
    cancelReasonNote: order.cancelReasonNote,
    quantity: order.quantity,
    listing: order.listing,
    buyer: order.buyer,
    seller: order.seller,
    orderTotal: getOrderTotalFromRecord(order),
  }));

  return {
    user,
    sellerDisplayName: getSellerDisplayName(user),
    salesOrders,
    totals: {
      all: salesOrders.length,
      completed: salesOrders.filter((order) => order.status === "COMPLETED").length,
      cancelled: salesOrders.filter((order) => order.status === "CANCELLED").length,
      returns: salesOrders.filter((order) => Boolean(order.returnRequestedAt)).length,
      revenue: salesOrders
        .filter((order) => order.status === "COMPLETED")
        .reduce((sum, order) => sum + order.orderTotal, 0),
    },
  };
}

export function formatAdminSalesOrderMeta(order: AdminUserSalesOrder): string {
  const parts = [
    `Замовлення: ${formatOrderNumber(order.orderNumber)}`,
    `Статус: ${ORDER_STATUSES[order.status] || order.status}`,
    `Дата покупки: ${formatDate(order.createdAt)}`,
  ];

  if (order.completedAt) {
    parts.push(`Отримано: ${formatDate(order.completedAt)}`);
  }
  if (order.cancelledAt) {
    parts.push(`Скасовано: ${formatDate(order.cancelledAt)}`);
  }
  if (order.returnRequestedAt) {
    parts.push(
      `Повернення: ${formatDate(order.returnRequestedAt)} · ${getReturnReasonLabel(order.returnReason, order.returnReasonNote)}`
    );
  }
  if (order.status === "CANCELLED" && order.cancelReason) {
    parts.push(`Причина скасування: ${getCancelReasonLabel(order.cancelReason, order.cancelReasonNote)}`);
  }

  return parts.join(" · ");
}

export function formatAdminSalesOrderAmount(order: AdminUserSalesOrder): string {
  return formatPrice(order.orderTotal);
}
