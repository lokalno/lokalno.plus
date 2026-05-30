import fs from "fs";
import path from "path";

type RawItem = {
  object_category: string;
  object_name: string;
  region: string;
  community: string;
};

type Settlement = {
  name: string;
  region: string;
  district: string;
  type: string;
  full: string;
};

const TYPE_PREFIX: Record<string, string> = {
  Місто: "",
  Село: "с. ",
  Селище: "с-ще ",
  СМТ: "смт ",
};

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/([\s-]+)/)
    .map((part) => {
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function normalizeRegion(region: string): string {
  return titleCase(region.replace(/^АВТОНОМНА РЕСПУБЛІКА /, "АР "));
}

const rawPath = path.join(process.cwd(), "scripts/raw-settlements.json");
const outPath = path.join(process.cwd(), "data/settlements.json");

const raw = JSON.parse(fs.readFileSync(rawPath, "utf8")) as RawItem[];

const settlements: Settlement[] = raw.map((item) => {
  const type = item.object_category;
  const name = titleCase(item.object_name);
  const region = normalizeRegion(item.region);
  const district = titleCase(item.community);
  const prefix = TYPE_PREFIX[type] ?? "";
  const shortName = prefix ? `${prefix}${name}` : name;
  const full = `${shortName}, ${district}, ${region}`;

  return { name: shortName, region, district, type, full };
});

settlements.sort((a, b) => a.full.localeCompare(b.full, "uk"));

fs.writeFileSync(outPath, JSON.stringify(settlements));
console.log(`Wrote ${settlements.length} settlements to ${outPath}`);
console.log(`Size: ${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB`);
