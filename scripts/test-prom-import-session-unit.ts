import {
  requiresPromReimportConfirmation,
  shouldRestartPromImportSession,
} from "../src/lib/prom-import-session";

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

console.log("prom-import-session unit tests\n");

assert(
  "completed session requires confirmation by default",
  requiresPromReimportConfirmation("COMPLETED", false)
);
assert(
  "completed session skips confirmation when confirmed",
  !requiresPromReimportConfirmation("COMPLETED", true)
);
assert(
  "in-progress session does not require confirmation",
  !requiresPromReimportConfirmation("IN_PROGRESS", false)
);

assert(
  "confirm reimport restarts completed session",
  shouldRestartPromImportSession("COMPLETED", { confirmReimport: true })
);
assert(
  "completed session does not restart without confirm",
  !shouldRestartPromImportSession("COMPLETED", { forceRestart: false })
);
assert(
  "forceRestart restarts in-progress session",
  shouldRestartPromImportSession("IN_PROGRESS", { forceRestart: true })
);
assert(
  "cancelled session continues without forceRestart",
  !shouldRestartPromImportSession("CANCELLED", {})
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
