export function formatPrice(price: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function parsePhotos(photos: string): string[] {
  if (!photos?.trim()) return [];

  try {
    const parsed = JSON.parse(photos);
    if (Array.isArray(parsed)) {
      return parsed.filter((p): p is string => typeof p === "string" && p.trim());
    }
    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed];
    }
  } catch {
    if (
      photos.startsWith("http") ||
      photos.startsWith("data:") ||
      photos.startsWith("/")
    ) {
      return [photos];
    }
  }

  return [];
}

export function formatViews(count: number): string {
  const n = Math.abs(count);
  if (n % 10 === 1 && n % 100 !== 11) return `${n} перегляд`;
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} перегляди`;
  return `${n} переглядів`;
}

export function formatTimeAgo(date: Date | string): string {
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "щойно";
  if (mins < 60) return `${mins} хв тому`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} год тому`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн тому`;
  return formatDate(date);
}

export function shortLocation(city: string): string {
  const part = city.split(",")[0]?.trim();
  return part || city;
}

export function formatSellerLocation(city: string): string {
  const parts = city.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return city;

  const town = parts[0];
  const region = parts.find((p) => /область/i.test(p));
  if (region) return `${town}, ${region}`;

  return parts.length >= 2 ? `${town}, ${parts[1]}` : town;
}

export function formatTenure(date: Date | string): string {
  const start = new Date(date);
  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;

  if (months < 1) return "менше місяця";

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  const yearPart =
    years > 0
      ? years === 1
        ? "1 рік"
        : years >= 2 && years <= 4
          ? `${years} роки`
          : `${years} років`
      : "";

  const monthPart =
    remMonths > 0
      ? remMonths === 1
        ? "1 місяць"
        : remMonths >= 2 && remMonths <= 4
          ? `${remMonths} місяці`
          : `${remMonths} місяців`
      : "";

  if (yearPart && monthPart) return `${yearPart} ${monthPart}`;
  return yearPart || monthPart || "менше місяця";
}

export function getTypicalResponseLabel(reviewCount: number, listingCount: number): string {
  if (reviewCount >= 10 || listingCount >= 5) return "за 15 хвилин";
  if (reviewCount >= 1 || listingCount >= 1) return "протягом години";
  return "—";
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
