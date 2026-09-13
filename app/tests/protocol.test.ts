import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { CORE_OPERATIONS, isCoreResponse, PROTOCOL_VERSION } from "../src/protocol.js";

const sourceRoot = new URL("../../", import.meta.url);

test("frontend accepts only the exact versioned result envelope", () => {
  assert.equal(isCoreResponse({ protocolVersion: PROTOCOL_VERSION, requestId: "one", ok: true, value: {} }, "one"), true);
  assert.equal(isCoreResponse({ protocolVersion: 2, requestId: "one", ok: true, value: {} }, "one"), false);
  assert.equal(isCoreResponse({ protocolVersion: 1, requestId: "one", ok: true, value: {}, extra: true }, "one"), false);
  assert.equal(isCoreResponse({ protocolVersion: 1, requestId: "other", ok: true, value: {} }, "one"), false);
  assert.equal(isCoreResponse({ protocolVersion: 1, requestId: "one", ok: false, error: { code: "DENIED", message: "Denied", detail: "leak" } }), false);
});

test("frontend operation list contains only harmless scaffold operations", () => {
  assert.deepEqual(CORE_OPERATIONS, [
    "system.health",
    "system.version",
    "probe.denied",
    "probe.redactedError",
    "probe.smokeReport",
  ]);
  assert.equal(CORE_OPERATIONS.some((operation) => /file|shell|process|http|network|git|renpy|credential/i.test(operation)), false);
});

test("renderer source contains no secret or ambient host bridge", async () => {
  const sources = await Promise.all([
    "src/main.ts",
    "src/bridge.ts",
    "src/protocol.ts",
    "src/ports.ts",
  ].map((path) => readFile(new URL(path, sourceRoot), "utf8")));
  const combined = sources.join("\n");
  assert.doesNotMatch(combined, /process\.env|import\.meta\.env|localStorage|sessionStorage/);
  assert.doesNotMatch(combined, /plugin:(?:fs|shell|http)|readTextFile|Command\.create/);
  assert.match(combined, /invoke\("core_request"/);
});

test("theme exposes all required semantics and reduced motion", async () => {
  const css = await readFile(new URL("src/styles.css", sourceRoot), "utf8");
  for (const token of [
    "surface-app", "surface-panel", "surface-raised", "surface-hover", "surface-selected",
    "text-primary", "text-secondary", "text-muted", "text-disabled", "border-normal",
    "border-strong", "accent-primary", "accent-hover", "accent-subtle", "status-success",
    "status-warning", "status-error", "status-info", "status-partial", "font-ui", "font-source",
    "radius-small", "radius-medium", "elevation-preview",
  ]) assert.match(css, new RegExp(`--${token}:`));
  assert.match(css, /:root\[data-theme="light"\]/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /linear-gradient|radial-gradient|backdrop-filter|text-shadow/);
  for (const line of css.split("\n").filter((entry) => /#[0-9a-f]{3,8}/i.test(entry))) {
    assert.match(line, /^\s+--[a-z-]+:/, `literal colour escaped the token definitions: ${line}`);
  }
});

test("desktop manifest grants one local capability and no ambient plugins", async () => {
  const [configText, capabilityText, permission, manifest, backend, host] = await Promise.all([
    readFile(new URL("src-tauri/tauri.conf.json", sourceRoot), "utf8"),
    readFile(new URL("src-tauri/capabilities/main.json", sourceRoot), "utf8"),
    readFile(new URL("src-tauri/permissions/core-request.toml", sourceRoot), "utf8"),
    readFile(new URL("src-tauri/Cargo.toml", sourceRoot), "utf8"),
    readFile(new URL("src-core/src/lib.rs", sourceRoot), "utf8"),
    readFile(new URL("src-tauri/src/main.rs", sourceRoot), "utf8"),
  ]);
  const config = JSON.parse(configText);
  const capability = JSON.parse(capabilityText);
  assert.deepEqual(config.app.security.capabilities, ["main-local-only"]);
  assert.equal(config.app.security.csp.includes("'unsafe-inline'"), false);
  assert.equal(config.app.security.csp.includes("connect-src ipc: http://ipc.localhost"), true);
  assert.equal(capability.local, true);
  assert.deepEqual(capability.webviews, ["main"]);
  assert.equal("windows" in capability, false);
  assert.deepEqual(capability.permissions, ["allow-loomlight-core"]);
  assert.match(permission, /commands\.allow = \["core_request"\]/);
  assert.match(host, /window\.label\(\) != "main"/);
  assert.doesNotMatch(`${manifest}\n${capabilityText}`, /tauri-plugin|shell:|fs:|http:|opener:|process:/);
  for (const operation of CORE_OPERATIONS) assert.equal(backend.includes(`"${operation}"`), true);
});
