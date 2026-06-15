import { randomUUID } from "crypto";
import type { PrismaClient } from "@prisma/client";

export const VISITOR_COOKIE = "lokalno_vid";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type SiteTrafficStats = {
  trackingSince: string | null;
  todayPageViews: number;
  todayUniqueVisitors: number;
  yesterdayPageViews: number;
  yesterdayUniqueVisitors: number;
  last7DaysPageViews: number;
  last7DaysUniqueVisitors: number;
  last30DaysPageViews: number;
  last30DaysUniqueVisitors: number;
  allTimePageViews: number;
  allTimeUniqueVisitors: number;
  dailyLast30Days: {
    date: string;
    label: string;
    pageViews: number;
    uniqueVisitors: number;
  }[];
};

export function buildEmptySiteTrafficStats(now = new Date()): SiteTrafficStats {
  const todayKey = getKyivDateString(now);
  const dailyLast30Days = Array.from({ length: 30 }, (_, index) => {
    const date = shiftKyivDate(todayKey, index - 29);
    return {
      date,
      label: formatKyivDayLabel(date),
      pageViews: 0,
      uniqueVisitors: 0,
    };
  });

  return {
    trackingSince: null,
    todayPageViews: 0,
    todayUniqueVisitors: 0,
    yesterdayPageViews: 0,
    yesterdayUniqueVisitors: 0,
    last7DaysPageViews: 0,
    last7DaysUniqueVisitors: 0,
    last30DaysPageViews: 0,
    last30DaysUniqueVisitors: 0,
    allTimePageViews: 0,
    allTimeUniqueVisitors: 0,
    dailyLast30Days,
  };
}

export function getKyivDateString(date = new Date()): string {
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Kyiv" });
}

export function kyivDateToUtcDate(kyivDate: string): Date {
  return new Date(`${kyivDate}T00:00:00+02:00`);
}

export function shiftKyivDate(kyivDate: string, days: number): string {
  const base = kyivDateToUtcDate(kyivDate);
  base.setUTCDate(base.getUTCDate() + days);
  return getKyivDateString(base);
}

export function formatKyivDayLabel(kyivDate: string): string {
  const date = kyivDateToUtcDate(kyivDate);
  return date.toLocaleDateString("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "numeric",
    month: "short",
  });
}

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|uptime|monitor/i.test(
    userAgent
  );
}

export function normalizeVisitorId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^[a-f0-9-]{16,64}$/i.test(trimmed)) return null;
  return trimmed;
}

export function createVisitorId(): string {
  return randomUUID();
}

export function shouldTrackSiteTraffic(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") return false;
  return true;
}

export async function recordSiteVisit(
  prisma: PrismaClient,
  visitorId: string,
  now = new Date()
): Promise<{ pageViews: number; uniqueVisitors: number }> {
  const day = kyivDateToUtcDate(getKyivDateString(now));

  await prisma.siteTrafficDay.upsert({
    where: { day },
    create: { day, pageViews: 0, uniqueVisitors: 0 },
    update: {},
  });

  let isNewVisitor = false;
  try {
    await prisma.siteTrafficVisitor.create({
      data: { day, visitorId },
    });
    isNewVisitor = true;
  } catch {
    // already counted for this visitor today
  }

  const updated = await prisma.siteTrafficDay.update({
    where: { day },
    data: {
      pageViews: { increment: 1 },
      ...(isNewVisitor ? { uniqueVisitors: { increment: 1 } } : {}),
    },
  });

  return {
    pageViews: updated.pageViews,
    uniqueVisitors: updated.uniqueVisitors,
  };
}

async function countUniqueVisitorsSince(
  prisma: PrismaClient,
  fromDay: Date
): Promise<number> {
  const rows = await prisma.siteTrafficVisitor.findMany({
    where: { day: { gte: fromDay } },
    distinct: ["visitorId"],
    select: { visitorId: true },
  });
  return rows.length;
}

export async function getSiteTrafficStats(prisma: PrismaClient): Promise<SiteTrafficStats> {
  try {
    return await loadSiteTrafficStats(prisma);
  } catch {
    return buildEmptySiteTrafficStats();
  }
}

async function loadSiteTrafficStats(prisma: PrismaClient): Promise<SiteTrafficStats> {
  const now = new Date();
  const todayKey = getKyivDateString(now);
  const today = kyivDateToUtcDate(todayKey);
  const yesterdayKey = shiftKyivDate(todayKey, -1);
  const yesterday = kyivDateToUtcDate(yesterdayKey);
  const last7From = kyivDateToUtcDate(shiftKyivDate(todayKey, -6));
  const last30From = kyivDateToUtcDate(shiftKyivDate(todayKey, -29));

  const [
    todayRow,
    yesterdayRow,
    last30Rows,
    totals,
    trackingSinceRow,
    last7Unique,
    last30Unique,
    allTimeUnique,
  ] = await Promise.all([
    prisma.siteTrafficDay.findUnique({ where: { day: today } }),
    prisma.siteTrafficDay.findUnique({ where: { day: yesterday } }),
    prisma.siteTrafficDay.findMany({
      where: { day: { gte: last30From } },
      orderBy: { day: "asc" },
    }),
    prisma.siteTrafficDay.aggregate({
      _sum: { pageViews: true, uniqueVisitors: true },
    }),
    prisma.siteTrafficDay.findFirst({ orderBy: { day: "asc" }, select: { day: true } }),
    countUniqueVisitorsSince(prisma, last7From),
    countUniqueVisitorsSince(prisma, last30From),
    prisma.siteTrafficVisitor.findMany({
      distinct: ["visitorId"],
      select: { visitorId: true },
    }),
  ]);

  const last7PageViews = last30Rows
    .filter((row) => row.day >= last7From)
    .reduce((sum, row) => sum + row.pageViews, 0);
  const last30PageViews = last30Rows.reduce((sum, row) => sum + row.pageViews, 0);

  const dailyByKey = new Map(
    last30Rows.map((row) => [getKyivDateString(row.day), row] as const)
  );
  const dailyLast30Days = Array.from({ length: 30 }, (_, index) => {
    const date = shiftKyivDate(todayKey, index - 29);
    const row = dailyByKey.get(date);
    return {
      date,
      label: formatKyivDayLabel(date),
      pageViews: row?.pageViews ?? 0,
      uniqueVisitors: row?.uniqueVisitors ?? 0,
    };
  });

  return {
    trackingSince: trackingSinceRow ? getKyivDateString(trackingSinceRow.day) : null,
    todayPageViews: todayRow?.pageViews ?? 0,
    todayUniqueVisitors: todayRow?.uniqueVisitors ?? 0,
    yesterdayPageViews: yesterdayRow?.pageViews ?? 0,
    yesterdayUniqueVisitors: yesterdayRow?.uniqueVisitors ?? 0,
    last7DaysPageViews: last7PageViews,
    last7DaysUniqueVisitors: last7Unique,
    last30DaysPageViews: last30PageViews,
    last30DaysUniqueVisitors: last30Unique,
    allTimePageViews: totals._sum.pageViews ?? 0,
    allTimeUniqueVisitors: allTimeUnique.length,
    dailyLast30Days,
  };
}
