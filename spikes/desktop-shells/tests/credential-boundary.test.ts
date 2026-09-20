import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const read = (relative: string) => readFile(path.resolve(relative), "utf8");

test("credential probes remain main/core-only with no renderer operation", async () => {
  const [contracts, preload, electron, tauri] = await Promise.all([
    read("src/shared/contracts.ts"),
    read("src/electron/preload.cts"),
    read("src/electron/main.ts"),
    read("src-tauri/src/main.rs"),
  ]);
  assert.doesNotMatch(contracts, /credential|secret/i);
  assert.doesNotMatch(preload, /credential|secret/i);
  assert.match(electron, /LOOMLIGHT_SPIKE_CREDENTIAL_PROBE/);
  assert.match(electron, /safeStorage\.encryptStringAsync/);
  assert.match(tauri, /LOOMLIGHT_SPIKE_CREDENTIAL_PROBE/);
  assert.match(tauri, /keyring::Entry::new/);
  assert.doesNotMatch(tauri.match(/fn desktop_operation[\s\S]*?\n}/)?.[0] ?? "", /credential|secret/i);
});

test("credential evidence scripts enforce timeout, output bound, and plaintext scan", async () => {
  const [runner, scanner] = await Promise.all([
    read("scripts/run-credential-probe.mjs"),
    read("scripts/scan-credential-leaks.mjs"),
  ]);
  assert.match(runner, /30_000/);
  assert.match(runner, /65_536/);
  assert.match(runner, /rendererCreated !== false/);
  assert.match(scanner, /git.*ls-files/s);
  assert.match(scanner, /credential-plaintext-scan/);
});
