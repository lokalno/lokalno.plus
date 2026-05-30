import fs from "fs";
import path from "path";
import { UKRAINIAN_CITIES } from "./constants";

export type Settlement = {
  name: string;
  region: string;
  district: string;
  type: string;
  full: string;
};

let cached: Settlement[] | null = null;

export function loadSettlements(): Settlement[] {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "data/settlements.json");
  cached = JSON.parse(fs.readFileSync(filePath, "utf8")) as Settlement[];
  return cached;
}

const defaultSuggestions: Settlement[] = UKRAINIAN_CITIES.map((city) => ({
  name: city,
  region: city,
  district: "",
  type: "Місто",
  full: city,
}));

function hasLatin(text: string): boolean {
  return /[a-z]/i.test(text);
}

const QUERY_ALIASES: Record<string, string> = {
  tatarbynary: "татарбунари",
  tatarbunary: "татарбунари",
  tatarbunari: "татарбунари",
};

function normalizeQuery(raw: string): Set<string> {
  const queries = new Set<string>([raw]);
  const alias = QUERY_ALIASES[raw];
  if (alias) queries.add(alias);
  if (hasLatin(raw)) {
    queries.add(latinToCyrillic(raw));
  }
  return queries;
}

/** Latin transliteration for search (tatarbunary → татарбунари). */
export function latinToCyrillic(input: string): string {
  let s = input.toLowerCase().trim();
  const multi: [string, string][] = [
    ["shch", "щ"],
    ["sch", "щ"],
    ["zh", "ж"],
    ["ch", "ч"],
    ["sh", "ш"],
    ["yu", "ю"],
    ["ya", "я"],
    ["ye", "є"],
    ["yi", "ї"],
    ["iu", "ю"],
    ["kh", "х"],
    ["ts", "ц"],
  ];
  for (const [from, to] of multi) {
    s = s.split(from).join(to);
  }
  const map: Record<string, string> = {
    a: "а",
    b: "б",
    c: "к",
    d: "д",
    e: "е",
    f: "ф",
    g: "г",
    h: "г",
    i: "і",
    j: "й",
    k: "к",
    l: "л",
    m: "м",
    n: "н",
    o: "о",
    p: "п",
    q: "к",
    r: "р",
    s: "с",
    t: "т",
    u: "у",
    v: "в",
    w: "в",
    x: "кс",
    y: "и",
    z: "з",
  };
  return s.replace(/[a-z]/g, (ch) => map[ch] ?? ch);
}

function plainName(name: string): string {
  return name.replace(/^(с\.|смт|с-ще)\s+/i, "").toLowerCase();
}

function scoreMatch(item: Settlement, q: string): number {
  const name = item.name.toLowerCase();
  const base = plainName(item.name);
  const full = item.full.toLowerCase();
  const district = item.district.toLowerCase();

  if (base === q || name === q) return 1000;
  if (base.startsWith(q) || name.startsWith(q)) return 800;
  if (base.includes(q)) return item.type === "Місто" ? 650 : 450;
  if (name.includes(q)) return item.type === "Місто" ? 550 : 350;
  if (full.includes(q) && !district.includes(q)) return 200;
  if (district.includes(q) && !base.includes(q) && !name.includes(q)) return 40;
  if (full.includes(q)) return 80;
  return 0;
}

export function searchSettlements(query: string, limit = 25): Settlement[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return defaultSuggestions.slice(0, limit);

  const queries = normalizeQuery(raw);

  const all = loadSettlements();
  const scored: { item: Settlement; score: number }[] = [];

  for (const item of all) {
    let best = 0;
    for (const q of queries) {
      best = Math.max(best, scoreMatch(item, q));
    }
    if (best > 0) scored.push({ item, score: best });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.item.full.localeCompare(b.item.full, "uk")
  );

  return scored.slice(0, limit).map((s) => s.item);
}

export function findSettlement(value: string): Settlement | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const exact = loadSettlements().find((s) => s.full === trimmed || s.name === trimmed);
  if (exact) return exact;

  return defaultSuggestions.find((s) => s.full === trimmed || s.name === trimmed);
}
