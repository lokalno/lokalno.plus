import { UKRAINE_CITIES_GEO } from "./ukraine-cities-geo";

export const UKRAINE_MAP_VIEW_BOX = { width: 1000, height: 670 } as const;

const LNG_MIN = 22.05;
const LNG_MAX = 40.25;
const LAT_MIN = 44.35;
const LAT_MAX = 52.4;

export type AdminCityMapPoint = {
  key: string;
  name: string;
  label: string;
  users: number;
  x: number;
  y: number;
  oblastId: string;
  onMap: boolean;
};

export type AdminOblastMapStats = {
  id: string;
  name: string;
  users: number;
};

export const OBLAST_LABELS_UK: Record<string, string> = {
  cherkasy: "Черкаська",
  chernihiv: "Чернігівська",
  chernivtsi: "Чернівецька",
  crimea: "Крим",
  dnipropetrovsk: "Дніпропетровська",
  donetsk: "Донецька",
  "ivano-frankivsk": "Івано-Франківська",
  kharkiv: "Харківська",
  kherson: "Херсонська",
  khmelnytskyi: "Хмельницька",
  kirovohrad: "Кіровоградська",
  kyiv: "Київська",
  "kyiv-city": "м. Київ",
  luhansk: "Луганська",
  lviv: "Львівська",
  mykolaiv: "Миколаївська",
  odessa: "Одеська",
  poltava: "Полтавська",
  rivne: "Рівненська",
  sumy: "Сумська",
  ternopil: "Тернопільська",
  vinnytsia: "Вінницька",
  volyn: "Волинська",
  zakarpattia: "\u0417\u0430\u043A\u0430\u0440\u043F\u0430\u0442\u0441\u044C\u043A\u0430",
  zaporizhia: "Запорізька",
  zhytomyr: "Житомирська",
};

const REGION_TO_OBLAST: Record<string, string> = {
  "вінницька": "vinnytsia",
  "волинська": "volyn",
  "луганська": "luhansk",
  "дніпропетровська": "dnipropetrovsk",
  "донецька": "donetsk",
  "житомирська": "zhytomyr",
  "\u0437\u0430\u043A\u0430\u0440\u043F\u0430\u0442\u0441\u044C\u043A\u0430": "zakarpattia",
  "запорізька": "zaporizhia",
  "івано-франківська": "ivano-frankivsk",
  "київська": "kyiv",
  "кіровоградська": "kirovohrad",
  "крим": "crimea",
  "автономна республіка крим": "crimea",
  "львівська": "lviv",
  "миколаївська": "mykolaiv",
  "одеська": "odessa",
  "полтавська": "poltava",
  "рівненська": "rivne",
  "сумська": "sumy",
  "тернопільська": "ternopil",
  "харківська": "kharkiv",
  "херсонська": "kherson",
  "хмельницька": "khmelnytskyi",
  "черкаська": "cherkasy",
  "чернівецька": "chernivtsi",
  "чернігівська": "chernihiv",
};

export function normalizeCityKey(value: string): string {
  const part = value.split(",")[0]?.trim() ?? value.trim();
  return part.replace(/^(с\.|смт|с-ще)\s+/i, "").toLowerCase();
}

export function projectLatLng(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * UKRAINE_MAP_VIEW_BOX.width;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * UKRAINE_MAP_VIEW_BOX.height;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export function extractRegionFromCity(value: string): string | null {
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length < 2) return null;
  const region = parts[parts.length - 1]?.toLowerCase() ?? "";
  return region.replace(/\s*область$/i, "").trim() || null;
}

export function regionToOblastId(region: string | null): string | null {
  if (!region) return null;
  const normalized = region.toLowerCase().replace(/\s*область$/i, "").trim();
  return REGION_TO_OBLAST[normalized] ?? null;
}

const GEO_BY_KEY = new Map(
  UKRAINE_CITIES_GEO.map((city) => [normalizeCityKey(city.name), city] as const)
);

function resolveOblastId(cityLabel: string, key: string): string | null {
  const fromRegion = regionToOblastId(extractRegionFromCity(cityLabel));
  if (fromRegion) return fromRegion;
  return GEO_BY_KEY.get(key)?.oblastId ?? null;
}

export function buildCityMapPoints(userCounts: Map<string, { label: string; users: number }>): {
  cities: AdminCityMapPoint[];
  oblasts: AdminOblastMapStats[];
} {
  const merged = new Map<string, AdminCityMapPoint>();

  for (const city of UKRAINE_CITIES_GEO) {
    const key = normalizeCityKey(city.name);
    const stats = userCounts.get(key);
    const { x, y } = projectLatLng(city.lat, city.lng);
    merged.set(key, {
      key,
      name: city.name,
      label: stats?.label ?? city.name,
      users: stats?.users ?? 0,
      x,
      y,
      oblastId: city.oblastId,
      onMap: true,
    });
  }

  for (const [key, stats] of userCounts) {
    if (merged.has(key)) {
      const existing = merged.get(key)!;
      existing.users = stats.users;
      existing.label = stats.label;
      continue;
    }

    merged.set(key, {
      key,
      name: stats.label.split(",")[0]?.trim() || stats.label,
      label: stats.label,
      users: stats.users,
      x: 0,
      y: 0,
      oblastId: resolveOblastId(stats.label, key) ?? "",
      onMap: false,
    });
  }

  const cities = [...merged.values()].sort(
    (a, b) => b.users - a.users || a.name.localeCompare(b.name, "uk")
  );

  const oblastUsers = new Map<string, number>();
  for (const [key, stats] of userCounts) {
    const oblastId = resolveOblastId(stats.label, key);
    if (!oblastId) continue;
    oblastUsers.set(oblastId, (oblastUsers.get(oblastId) ?? 0) + stats.users);
  }

  const oblasts = Object.entries(OBLAST_LABELS_UK).map(([id, name]) => ({
    id,
    name,
    users: oblastUsers.get(id) ?? 0,
  }));

  return { cities, oblasts };
}

export function oblastFill(users: number, maxUsers: number): string {
  if (users <= 0) return "#eef2f7";
  const ratio = Math.min(1, users / Math.max(maxUsers, 1));
  const alpha = 0.18 + ratio * 0.72;
  return `rgba(234, 88, 12, ${alpha.toFixed(2)})`;
}

export function cityDotRadius(users: number, maxUsers: number): number {
  if (users <= 0) return 3.5;
  const ratio = Math.min(1, users / Math.max(maxUsers, 1));
  return 4 + ratio * 10;
}
