import type { PrismaClient } from "@prisma/client";
import { getOrderTotalAmount, getOrderQuantity } from "@/lib/order-total";
import {
  AUTO_CANCEL_REASON,
  getCancelReasonLabel,
  getOrderCancelRole,
} from "@/lib/order-cancel";
import {
  buildCityMapPoints,
  normalizeCityKey,
  type AdminCityMapPoint,
  type AdminOblastMapStats,
} from "@/lib/ukraine-geo";

export const DEMO_USER_EMAILS = [
  "admin@lokalno.ua",
  "demo@lokalno.ua",
  "seller1@lokalno.ua",
  "seller2@lokalno.ua",
  "seller3@lokalno.ua",
  "seller4@lokalno.ua",
] as const;

export type AdminStatsPeriodKey =
  | "last1h"
  | "last2h"
  | "last3h"
  | "last4h"
  | "last24h"
  | "today"
  | "last48h"
  | "last7d"
  | "yesterday"
  | "last30d"
  | "thisYear"
  | "allTime";

export type AdminPeriodStats = {
  key: AdminStatsPeriodKey;
  label: string;
  registrations: number;
  salesAmount: number;
  salesOrders: number;
  salesItems: number;
  activeUsers: number;
  newListings: number;
  messages: number;
};

export type AdminActivityChartPoint = {
  date: string;
  label: string;
  activeUsers: number;
  registrations: number;
  salesAmount: number;
};

export type AdminWeekdayChartPoint = {
  label: string;
  activeUsers: number;
};

export type AdminActivityChartRange = 7 | 30 | 90;

export type AdminCancellationReasonStat = {
  key: string;
  label: string;
  count: number;
};

export type AdminCancellationStats = {
  sellerCancelled: number;
  buyerCancelled: number;
  autoCancelled: number;
  bySellerReason: AdminCancellationReasonStat[];
  byBuyerReason: AdminCancellationReasonStat[];
};

export type AdminPlatformTotals = {
  totalListings: number;
  activeListings: number;
  totalUsers: number;
  totalEarnings: number;
  paidOrders: number;
};

export type AdminStatsSnapshot = {
  generatedAt: string;
  realUsersTotal: number;
  demoUsersTotal: number;
  totalListingViews: number;
  platformTotals: AdminPlatformTotals;
  periods: AdminPeriodStats[];
  dailyActivity: AdminActivityChartPoint[];
  weekdayActivityByRange: Record<AdminActivityChartRange, AdminWeekdayChartPoint[]>;
  cityMap: {
    cities: AdminCityMapPoint[];
    oblasts: AdminOblastMapStats[];
  };
};

const PERIOD_LABELS: Record<AdminStatsPeriodKey, string> = {
  last1h: "За 1 годину",
  last2h: "За 2 години",
  last3h: "За 3 години",
  last4h: "За 4 години",
  last24h: "За 24 години",
  today: "Сьогодні",
  last48h: "За 2 дні",
  last7d: "За тиждень",
  yesterday: "Вчора",
  last30d: "За місяць",
  thisYear: "За рік",
  allTime: "За весь час",
};

/** Періоди для блоку «Нові реєстрації» в адмінці. */
export const ADMIN_REGISTRATION_PERIOD_KEYS: AdminStatsPeriodKey[] = [
  "last1h",
  "last2h",
  "last3h",
  "last4h",
  "last24h",
  "today",
  "last48h",
  "last7d",
  "allTime",
];

type PaidOrderRow = {
  createdAt: Date;
  paidAt: Date | null;
  quantity: number;
  buyerId: string;
  sellerId: string;
  listing: { price: number };
};

type ActivityRow = {
  createdAt: Date;
  userId: string;
};

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"] as const;

function formatKyivDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00+02:00`);
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getKyivWeekdayIndex(date: Date): number {
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[dayName] ?? 0;
}

function buildKyivDateRange(days: number, now = new Date()): string[] {
  const dates: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
    dates.push(getKyivDateString(date));
  }
  return dates;
}

function collectDailyActiveUsers(
  dateStr: string,
  orders: PaidOrderRow[],
  messages: ActivityRow[],
  listings: ActivityRow[],
  favorites: ActivityRow[],
  demoUserIds: Set<string>
) {
  const ids = new Set<string>();

  for (const order of orders) {
    const at = order.paidAt ?? order.createdAt;
    if (getKyivDateString(at) !== dateStr) continue;
    if (!demoUserIds.has(order.buyerId)) ids.add(order.buyerId);
    if (!demoUserIds.has(order.sellerId)) ids.add(order.sellerId);
  }

  for (const row of [...messages, ...listings, ...favorites]) {
    if (getKyivDateString(row.createdAt) !== dateStr) continue;
    if (!demoUserIds.has(row.userId)) ids.add(row.userId);
  }

  return ids.size;
}

function buildDailyActivitySeries(
  days: number,
  users: { createdAt: Date }[],
  paidOrders: PaidOrderRow[],
  messageRows: ActivityRow[],
  listingRows: ActivityRow[],
  favoriteRows: ActivityRow[],
  demoUserIds: Set<string>,
  now: Date
): AdminActivityChartPoint[] {
  return buildKyivDateRange(days, now).map((dateStr) => {
    const registrations = users.filter((user) => getKyivDateString(user.createdAt) === dateStr).length;
    let salesAmount = 0;

    for (const order of paidOrders) {
      const at = order.paidAt ?? order.createdAt;
      if (getKyivDateString(at) !== dateStr) continue;
      salesAmount += getOrderTotalAmount(order.listing.price, getOrderQuantity(order));
    }

    return {
      date: dateStr,
      label: formatKyivDayLabel(dateStr),
      activeUsers: collectDailyActiveUsers(
        dateStr,
        paidOrders,
        messageRows,
        listingRows,
        favoriteRows,
        demoUserIds
      ),
      registrations,
      salesAmount,
    };
  });
}

function buildWeekdayActivitySeries(
  days: number,
  paidOrders: PaidOrderRow[],
  messageRows: ActivityRow[],
  listingRows: ActivityRow[],
  favoriteRows: ActivityRow[],
  demoUserIds: Set<string>,
  now: Date
): AdminWeekdayChartPoint[] {
  const weekdayUsers = Array.from({ length: 7 }, () => new Set<string>());
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  function addUser(date: Date, userId: string) {
    if (date < cutoff || demoUserIds.has(userId)) return;
    weekdayUsers[getKyivWeekdayIndex(date)].add(userId);
  }

  for (const order of paidOrders) {
    const at = order.paidAt ?? order.createdAt;
    addUser(at, order.buyerId);
    addUser(at, order.sellerId);
  }

  for (const row of [...messageRows, ...listingRows, ...favoriteRows]) {
    addUser(row.createdAt, row.userId);
  }

  return WEEKDAY_LABELS.map((label, index) => ({
    label,
    activeUsers: weekdayUsers[index].size,
  }));
}

export function getTopActiveDays(points: AdminActivityChartPoint[], limit = 5) {
  return [...points].sort((a, b) => b.activeUsers - a.activeUsers).slice(0, limit);
}

function getKyivDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
}

function getKyivYear(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Kyiv", year: "numeric" }).format(date)
  );
}

function getPeriodStart(key: AdminStatsPeriodKey, now = new Date()): Date | null {
  if (key === "allTime") return null;

  const hourMs = 60 * 60 * 1000;
  if (key === "last1h") return new Date(now.getTime() - hourMs);
  if (key === "last2h") return new Date(now.getTime() - 2 * hourMs);
  if (key === "last3h") return new Date(now.getTime() - 3 * hourMs);
  if (key === "last4h") return new Date(now.getTime() - 4 * hourMs);
  if (key === "last24h") return new Date(now.getTime() - 24 * hourMs);
  if (key === "last48h") return new Date(now.getTime() - 48 * hourMs);

  const kyivToday = getKyivDateString(now);

  if (key === "today") {
    return new Date(`${kyivToday}T00:00:00+02:00`);
  }

  if (key === "yesterday") {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const kyivYesterday = getKyivDateString(yesterday);
    return new Date(`${kyivYesterday}T00:00:00+02:00`);
  }

  if (key === "last7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (key === "last30d") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  if (key === "thisYear") {
    const year = getKyivYear(now);
    return new Date(`${year}-01-01T00:00:00+02:00`);
  }

  return null;
}

function getPeriodEnd(key: AdminStatsPeriodKey, now = new Date()): Date | null {
  if (key === "yesterday") {
    const kyivToday = getKyivDateString(now);
    return new Date(`${kyivToday}T00:00:00+02:00`);
  }
  return null;
}

function isInPeriod(date: Date, key: AdminStatsPeriodKey, now = new Date()): boolean {
  const start = getPeriodStart(key, now);
  const end = getPeriodEnd(key, now);

  if (key === "yesterday") {
    return Boolean(start && end && date >= start && date < end);
  }

  if (key === "today") {
    const kyivDate = getKyivDateString(date);
    const kyivToday = getKyivDateString(now);
    return kyivDate === kyivToday;
  }

  if (key === "thisYear") {
    return getKyivYear(date) === getKyivYear(now);
  }

  if (!start) return true;
  return date >= start && date <= now;
}

function sumSales(orders: PaidOrderRow[], key: AdminStatsPeriodKey, now: Date) {
  let salesAmount = 0;
  let salesOrders = 0;
  let salesItems = 0;

  for (const order of orders) {
    const at = order.paidAt ?? order.createdAt;
    if (!isInPeriod(at, key, now)) continue;
    const quantity = getOrderQuantity(order);
    salesAmount += getOrderTotalAmount(order.listing.price, quantity);
    salesOrders += 1;
    salesItems += quantity;
  }

  return { salesAmount, salesOrders, salesItems };
}

function countActiveUsers(
  orders: PaidOrderRow[],
  messages: ActivityRow[],
  listings: ActivityRow[],
  favorites: ActivityRow[],
  demoUserIds: Set<string>,
  key: AdminStatsPeriodKey,
  now: Date
) {
  const ids = new Set<string>();

  for (const order of orders) {
    const at = order.paidAt ?? order.createdAt;
    if (!isInPeriod(at, key, now)) continue;
    if (!demoUserIds.has(order.buyerId)) ids.add(order.buyerId);
    if (!demoUserIds.has(order.sellerId)) ids.add(order.sellerId);
  }

  for (const row of [...messages, ...listings, ...favorites]) {
    if (!isInPeriod(row.createdAt, key, now)) continue;
    if (!demoUserIds.has(row.userId)) ids.add(row.userId);
  }

  return ids.size;
}

function buildUserCountsByCity(users: { city: string }[]) {
  const counts = new Map<string, { label: string; users: number }>();

  for (const user of users) {
    const label = user.city.trim() || "Невідомо";
    const key = normalizeCityKey(label);
    const existing = counts.get(key);
    if (existing) {
      existing.users += 1;
      continue;
    }
    counts.set(key, { label, users: 1 });
  }

  return counts;
}

export async function getAdminCityMapData(prisma: PrismaClient) {
  const users = await prisma.user.findMany({
    where: { email: { notIn: [...DEMO_USER_EMAILS] } },
    select: { city: true },
  });

  return buildCityMapPoints(buildUserCountsByCity(users));
}

export async function getAdminStatsSnapshot(prisma: PrismaClient): Promise<AdminStatsSnapshot> {
  const now = new Date();

  const [
    realUsersTotal,
    demoUsersTotal,
    totalListings,
    activeListings,
    totalListingViewsAgg,
    users,
    demoUsers,
    paidOrders,
    messages,
    listings,
    favorites,
  ] = await Promise.all([
    prisma.user.count({ where: { email: { notIn: [...DEMO_USER_EMAILS] } } }),
    prisma.user.count({ where: { email: { in: [...DEMO_USER_EMAILS] } } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.listing.aggregate({ _sum: { views: true } }),
    prisma.user.findMany({
      where: { email: { notIn: [...DEMO_USER_EMAILS] } },
      select: { createdAt: true, city: true },
    }),
    prisma.user.findMany({
      where: { email: { in: [...DEMO_USER_EMAILS] } },
      select: { id: true },
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", status: { not: "CANCELLED" } },
      select: {
        createdAt: true,
        paidAt: true,
        quantity: true,
        buyerId: true,
        sellerId: true,
        listing: { select: { price: true } },
      },
    }),
    prisma.message.findMany({ select: { createdAt: true, senderId: true } }),
    prisma.listing.findMany({ select: { createdAt: true, sellerId: true } }),
    prisma.favorite.findMany({ select: { createdAt: true, userId: true } }),
  ]);

  const messageRows: ActivityRow[] = messages.map((row) => ({
    createdAt: row.createdAt,
    userId: row.senderId,
  }));
  const listingRows: ActivityRow[] = listings.map((row) => ({
    createdAt: row.createdAt,
    userId: row.sellerId,
  }));
  const favoriteRows: ActivityRow[] = favorites.map((row) => ({
    createdAt: row.createdAt,
    userId: row.userId,
  }));

  const demoUserIds = new Set(demoUsers.map((user) => user.id));

  const periodKeys: AdminStatsPeriodKey[] = [
    "last1h",
    "last2h",
    "last3h",
    "last4h",
    "last24h",
    "today",
    "last48h",
    "last7d",
    "yesterday",
    "last30d",
    "thisYear",
    "allTime",
  ];

  const allTimeSales = sumSales(paidOrders, "allTime", now);
  const platformTotals: AdminPlatformTotals = {
    totalListings,
    activeListings,
    totalUsers: realUsersTotal,
    totalEarnings: allTimeSales.salesAmount,
    paidOrders: allTimeSales.salesOrders,
  };

  const periods = periodKeys.map((key) => {
    const registrations = users.filter((user) => isInPeriod(user.createdAt, key, now)).length;
    const sales = sumSales(paidOrders, key, now);
    const activeUsers = countActiveUsers(
      paidOrders,
      messageRows,
      listingRows,
      favoriteRows,
      demoUserIds,
      key,
      now
    );
    const newListings = listingRows.filter((row) => isInPeriod(row.createdAt, key, now)).length;
    const messageCount = messageRows.filter((row) => isInPeriod(row.createdAt, key, now)).length;

    return {
      key,
      label: PERIOD_LABELS[key],
      registrations,
      ...sales,
      activeUsers,
      newListings,
      messages: messageCount,
    };
  });

  const dailyActivity = buildDailyActivitySeries(
    90,
    users,
    paidOrders,
    messageRows,
    listingRows,
    favoriteRows,
    demoUserIds,
    now
  );

  const weekdayActivityByRange: Record<AdminActivityChartRange, AdminWeekdayChartPoint[]> = {
    7: buildWeekdayActivitySeries(
      7,
      paidOrders,
      messageRows,
      listingRows,
      favoriteRows,
      demoUserIds,
      now
    ),
    30: buildWeekdayActivitySeries(
      30,
      paidOrders,
      messageRows,
      listingRows,
      favoriteRows,
      demoUserIds,
      now
    ),
    90: buildWeekdayActivitySeries(
      90,
      paidOrders,
      messageRows,
      listingRows,
      favoriteRows,
      demoUserIds,
      now
    ),
  };

  const cityMap = buildCityMapPoints(buildUserCountsByCity(users));

  return {
    generatedAt: now.toISOString(),
    realUsersTotal,
    demoUsersTotal,
    totalListingViews: totalListingViewsAgg._sum.views ?? 0,
    platformTotals,
    periods,
    dailyActivity,
    weekdayActivityByRange,
    cityMap,
  };
}

export function formatAdminMoney(amount: number): string {
  return `${Math.round(amount).toLocaleString("uk-UA")} ₴`;
}

export async function getAdminCancellationStats(prisma: PrismaClient): Promise<AdminCancellationStats> {
  const cancelled = await prisma.order.findMany({
    where: { status: "CANCELLED" },
    select: {
      cancelledByRole: true,
      cancelReason: true,
      cancelReasonNote: true,
      cancelledById: true,
      buyerId: true,
      sellerId: true,
    },
  });

  let sellerCancelled = 0;
  let buyerCancelled = 0;
  let autoCancelled = 0;
  const bySellerReason = new Map<string, number>();
  const byBuyerReason = new Map<string, number>();

  for (const order of cancelled) {
    const role =
      getOrderCancelRole(order) ??
      (order.cancelledById === order.buyerId
        ? "BUYER"
        : order.cancelledById === order.sellerId
          ? "SELLER"
          : "SYSTEM");

    if (role === "SELLER") {
      sellerCancelled += 1;
      const key = order.cancelReason || "UNKNOWN";
      bySellerReason.set(key, (bySellerReason.get(key) ?? 0) + 1);
      continue;
    }

    if (role === "BUYER") {
      buyerCancelled += 1;
      const key = order.cancelReason || "UNKNOWN";
      byBuyerReason.set(key, (byBuyerReason.get(key) ?? 0) + 1);
      continue;
    }

    autoCancelled += 1;
    bySellerReason.set(AUTO_CANCEL_REASON, (bySellerReason.get(AUTO_CANCEL_REASON) ?? 0) + 1);
  }

  return {
    sellerCancelled,
    buyerCancelled,
    autoCancelled,
    bySellerReason: [...bySellerReason.entries()]
      .map(([key, count]) => ({
        key,
        label: getCancelReasonLabel(key),
        count,
      }))
      .sort((a, b) => b.count - a.count),
    byBuyerReason: [...byBuyerReason.entries()]
      .map(([key, count]) => ({
        key,
        label: key === "UNKNOWN" ? "Без причини" : getCancelReasonLabel(key),
        count,
      }))
      .sort((a, b) => b.count - a.count),
  };
}
