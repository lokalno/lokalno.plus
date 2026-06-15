export function formatStars(rating: number): string {
  const full = Math.round(rating);
  return "⭐".repeat(Math.min(5, Math.max(0, full)));
}

export function getRatingLabel(count: number): string {
  if (count === 0) return "Немає відгуків";
  if (count === 1) return "1 відгук";
  if (count >= 2 && count <= 4) return `${count} відгуки`;
  return `${count} відгуків`;
}

export function getFollowerLabel(count: number): string {
  if (count === 0) return "Немає підписників";
  if (count === 1) return "1 підписник";
  if (count >= 2 && count <= 4) return `${count} підписники`;
  return `${count} підписників`;
}

export function isVerifiedSeller(reviewCount: number, avgRating: number | null): boolean {
  return reviewCount >= 5 && avgRating !== null && avgRating >= 4.5;
}

export type SellerLevel = "NEW" | "TRUSTED" | "TOP";

export function getSellerLevel(params: {
  listingCount: number;
  reviewCount: number;
  avgRating: number | null;
  followerCount: number;
}): SellerLevel {
  const { listingCount, reviewCount, avgRating, followerCount } = params;

  if (
    reviewCount >= 10 &&
    avgRating !== null &&
    avgRating >= 4.5 &&
    listingCount >= 5 &&
    followerCount >= 5
  ) {
    return "TOP";
  }

  if (
    isVerifiedSeller(reviewCount, avgRating) ||
    (reviewCount >= 3 && avgRating !== null && avgRating >= 4) ||
    listingCount >= 8
  ) {
    return "TRUSTED";
  }

  return "NEW";
}

export const SELLER_LEVEL_LABELS: Record<SellerLevel, string> = {
  NEW: "Новий продавець",
  TRUSTED: "Надійний продавець",
  TOP: "ТОП продавець",
};

export const SELLER_LEVEL_STYLES: Record<SellerLevel, string> = {
  NEW: "border-slate-400/50 bg-slate-900/40 text-slate-100",
  TRUSTED: "border-emerald-400/50 bg-emerald-900/30 text-emerald-50",
  TOP: "border-amber-400/70 bg-amber-950/40 text-amber-100",
};

export function formatMemberSinceFull(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** «На Lokalno з червня 2026» */
export function formatMemberSinceMonthYear(date: Date): string {
  const formatted = new Intl.DateTimeFormat("uk-UA", {
    month: "long",
    year: "numeric",
  }).format(date);
  return `На Lokalno з ${formatted}`;
}

export function getDaysOnSite(date: Date, now = new Date()): number {
  const ms = now.getTime() - date.getTime();
  return Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function formatDaysOnSiteLabel(days: number): string {
  if (days === 1) return "1 день";
  if (days >= 2 && days <= 4) return `${days} дні`;
  return `${days} днів`;
}

export function formatMemberTenure(date: Date): string {
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? "рік" : years >= 2 && years <= 4 ? "роки" : "років"}`);
  }
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "місяць" : months >= 2 && months <= 4 ? "місяці" : "місяців"}`);
  }

  return parts.length > 0 ? parts.join(", ") : "менше місяця";
}

export function formatCompletedOrdersLabel(count: number): string {
  const n = Math.abs(count);
  if (n === 0) return "0 замовлень";
  if (n === 1) return "1 замовлення";
  if (n >= 2 && n <= 4) return `${n} замовлення`;
  return `${n} замовлень`;
}

export function getPositiveReviewPercent(reviews: { rating: number }[]): number | null {
  if (reviews.length === 0) return null;
  const positive = reviews.filter((review) => review.rating >= 4).length;
  return Math.round((positive / reviews.length) * 100);
}

export type SellerAchievement = {
  id: string;
  icon: string;
  title: string;
  description: string;
  unlocked: boolean;
};

export function getSellerAchievements(params: {
  listingCount: number;
  reviewCount: number;
  followerCount: number;
  orderCount: number;
  verified: boolean;
}): SellerAchievement[] {
  const { listingCount, reviewCount, followerCount, orderCount, verified } = params;

  return [
    {
      id: "first-listing",
      icon: "📦",
      title: "Перше оголошення",
      description: "Опублікуйте своє перше оголошення",
      unlocked: listingCount >= 1,
    },
    {
      id: "first-order",
      icon: "🛒",
      title: "Перше замовлення",
      description: "Отримайте перше замовлення від покупця",
      unlocked: orderCount >= 1,
    },
    {
      id: "five-reviews",
      icon: "⭐",
      title: "5 відгуків",
      description: "Зберіть 5 відгуків від покупців",
      unlocked: reviewCount >= 5,
    },
    {
      id: "ten-followers",
      icon: "👥",
      title: "10 підписників",
      description: "Наберіть 10 підписників",
      unlocked: followerCount >= 10,
    },
    {
      id: "trusted-seller",
      icon: "🛡️",
      title: "Надійний продавець",
      description: "Статус надійного продавця на платформі",
      unlocked: verified,
    },
    {
      id: "ten-listings",
      icon: "🏆",
      title: "10 оголошень",
      description: "Майте 10 активних оголошень",
      unlocked: listingCount >= 10,
    },
  ];
}
