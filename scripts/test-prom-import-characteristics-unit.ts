import {
  extractPromColor,
  extractPromSize,
  normalizePromCharacteristics,
  parsePromCharacteristicsFromRow,
  parsePromVariantGroupId,
  promCharacteristicsToDb,
} from "../src/lib/prom-import-characteristics";
import { buildPromListingSpecs } from "../src/lib/prom-listing-specs";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(` FAIL ${name}`);
  }
}

console.log("prom-import-characteristics unit tests\n");

const row = {
  ID_групи_різновидів: "12345",
  Назва_Характеристики: "Колір",
  Одиниця_виміру_Характеристики: "",
  Значення_Характеристики: "світло-сірий",
  Назва_Характеристики_2: "Розмір одягу",
  Одиниця_виміру_Характеристики_2: "",
  Значення_Характеристики_2: "XS-XXL",
  Назва_Характеристики_3: "Матеріал",
  Значення_Характеристики_3: "бавовна",
};

const characteristics = parsePromCharacteristicsFromRow(row);

assert("parses variant group id", parsePromVariantGroupId(row) === "12345");
assert("parses 3 characteristics", characteristics.length === 3);
assert("extracts prom color", extractPromColor(characteristics) === "світло-сірий");
assert("extracts prom size", extractPromSize(characteristics) === "XS-XXL");

const promSpecs = buildPromListingSpecs(
  {
    promColor: "світло-сірий",
    promSize: "XS-XXL",
    promCharacteristics: promCharacteristicsToDb(characteristics),
  },
  { usesVariants: false, hasItemSize: false }
);

assert("shows prom color in listing specs", promSpecs.some((item) => item.label === "Колір (Prom)"));
assert("shows prom size in listing specs", promSpecs.some((item) => item.label === "Розмір (Prom)"));
assert(
  "skips duplicate color/size rows from JSON",
  promSpecs.filter((item) => item.label === "Колір" || item.label === "Розмір одягу").length === 0
);
assert(
  "hides prom size when itemSize is used",
  buildPromListingSpecs(
    { promColor: "червоний", promSize: "M" },
    { usesVariants: false, hasItemSize: true }
  ).some((item) => item.label === "Розмір (Prom)") === false
);

const legacyJson = JSON.stringify(characteristics);
assert(
  "reads legacy TEXT JSON string in listing specs",
  buildPromListingSpecs({ promCharacteristics: legacyJson }).some((item) => item.label === "Матеріал")
);
assert(
  "reads JSON array in listing specs",
  buildPromListingSpecs({ promCharacteristics: characteristics }).some((item) => item.label === "Матеріал")
);
assert("normalizePromCharacteristics handles legacy string", normalizePromCharacteristics(legacyJson).length === 3);
assert("normalizePromCharacteristics handles array", normalizePromCharacteristics(characteristics).length === 3);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
