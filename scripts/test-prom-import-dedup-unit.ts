import {
  isLegacyPromListingPhotos,
  resolvePromSkuForLookup,
} from "../src/lib/prom-import-dedup";

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

console.log("prom-import-dedup unit tests\n");

assert(
  "prefers promSku over itemLocation",
  resolvePromSkuForLookup({
    promImportKey: null,
    promUniqueId: null,
    promProductId: null,
    promSku: "Kuz - 004",
    itemLocation: "Other",
  }) === "Kuz - 004"
);

assert(
  "falls back to itemLocation when promSku missing",
  resolvePromSkuForLookup({
    promImportKey: null,
    promUniqueId: null,
    promProductId: null,
    promSku: null,
    itemLocation: "Kuz - 004",
  }) === "Kuz - 004"
);

assert(
  "ignores generic Prom itemLocation placeholder",
  resolvePromSkuForLookup({
    promImportKey: null,
    promUniqueId: null,
    promProductId: null,
    promSku: null,
    itemLocation: "Prom",
  }) === null
);

assert(
  "detects legacy prom photo marker",
  isLegacyPromListingPhotos(
    JSON.stringify(["https://images.prom.ua/7387025345_sportivnyj-kostyum-muzhskoj.jpg"])
  )
);

assert(
  "rejects non-prom photos for legacy marker",
  !isLegacyPromListingPhotos(JSON.stringify(["https://example.com/photo.jpg"]))
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
