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

test("frontend operation list contains only bounded Phase 1C through 1E operations", () => {
  assert.deepEqual(CORE_OPERATIONS, [
    "system.health",
    "system.version",
    "probe.denied",
    "probe.redactedError",
    "probe.smokeReport",
    "system.folderName",
    "project.chooseParent",
    "project.validateDestination",
    "project.create",
    "project.listRecent",
    "project.openPicker",
    "project.openRecent",
    "project.removeRecent",
    "project.close",
    "project.current",
    "project.status",
    "project.flush",
    "sdk.discover",
    "sdk.browse",
    "sdk.install",
    "authoring.list",
    "character.create",
    "character.update",
    "appearance.setDefault",
    "asset.chooseImport",
    "asset.import",
    "asset.repairCompatibility",
    "variable.create",
    "variable.update",
    "scene.list",
    "scene.apply",
    "scene.recovery",
    "scene.resolveRecovery",
    "media.present",
  ]);
  assert.equal(CORE_OPERATIONS.some((operation) => /filesystem|shell|process|http|network|credential/i.test(operation)), false);
  assert.equal(CORE_OPERATIONS.some((operation) => operation !== "project.status" && /status|diff|commit|reset|remote/i.test(operation)), false);
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

test("Phase 1C UI source exposes the bounded lifecycle flow", async () => {
  const source = await readFile(new URL("src/main.ts", sourceRoot), "utf8");
  for (const label of [
    "New Project",
    "Open Loomlight Project",
    "Recent Projects",
    "Project details",
    "Ren'Py SDK",
    "Game configuration",
    "Review & Create",
  ]) assert.equal(source.includes(label), true, label);
  for (const operation of [
    "project.chooseParent",
    "project.validateDestination",
    "sdk.discover",
    "sdk.install",
    "sdk.browse",
    "project.create",
    "project.openRecent",
    "project.openPicker",
  ]) assert.equal(source.includes(operation), true, operation);
});

test("Phase 1D supporting surfaces and bounded operations are present", async () => {
  const source = await readFile(new URL("src/main.ts", sourceRoot), "utf8");
  for (const label of ["Characters", "Appearances", "Add Appearance", "Assets", "Variables", "Create Character", "Create Variable"]) {
    assert.equal(source.includes(label), true, label);
  }
  for (const operation of ["authoring.list", "project.status", "project.flush", "character.create", "asset.chooseImport", "asset.import", "appearance.setDefault", "variable.create"]) {
    assert.equal(source.includes(operation), true, operation);
  }
  for (const deferred of ["Run Game", "Branches workspace"]) {
    assert.equal(source.includes(deferred), false, deferred);
  }
  assert.match(source, /fixed after creation/);
  assert.equal(source.includes("window.prompt"), false);
  assert.match(source, /addEventListener\("keydown"/);
  assert.match(source, /inlineEditor/);
});

test("Phase 1E Preview and media stay bounded, responsive, and explicit", async () => {
  const [source, main, css] = await Promise.all([
    readFile(new URL("src/scene-ui.ts", sourceRoot), "utf8"),
    readFile(new URL("src/main.ts", sourceRoot), "utf8"),
    readFile(new URL("src/styles.css", sourceRoot), "utf8"),
  ]);
  for (const marker of ["deriveScenePreview", "Partial / unknown", "Edit Beat", "Add change here", "Audition current music", "audioAudition", "Create New Scene"]) assert.equal(source.includes(marker), true, marker);
  assert.match(source, /disposed \|\| generation !== mediaGeneration/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.doesNotMatch(`${source}\n${main}`, /file:\/\//);
  assert.doesNotMatch(`${source}\n${main}`, /https?:\/\//);
  assert.match(main, /"media\.present"/);
  assert.match(css, /--preview-share: 52fr/);
  assert.match(css, /--beats-share: 48fr/);
  assert.match(css, /@media \(max-width: 680px\)/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("packaged Scene smoke waits for committed renders and uses one terminal Beat", async () => {
  const source = await readFile(new URL("src-tauri/src/smoke_probe.js", sourceRoot), "utf8");
  assert.match(source, /const awaitSceneCommit = async/);
  assert.match(source, /#app-status[^\n]+Saved/);
  assert.match(source, /scene-draft\[data-unsubmitted/);
  assert.equal((source.match(/await awaitSceneCommit\(/g) ?? []).length, 2);
  assert.doesNotMatch(source, /id: "choice"[^\n]+\n\s+\{ id: "return"/);
});

test("desktop manifest grants one local capability and only the host single-instance plugin", async () => {
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
  assert.match(host, /#\[tauri::command\(async\)\]/);
  assert.match(host, /window\.label\(\) != "main"/);
  assert.match(manifest, /^tauri-plugin-single-instance = "=2\.4\.4"$/m);
  const manifestWithoutSingleInstance = manifest.replace(
    /^tauri-plugin-single-instance = "=2\.4\.4"$/m,
    "",
  );
  assert.doesNotMatch(
    `${manifestWithoutSingleInstance}\n${capabilityText}`,
    /tauri-plugin|shell:|fs:|http:|opener:|process:/,
  );
  assert.equal(capabilityText.includes("single-instance"), false);
  const singleInstanceRegistration = host.indexOf(
    ".plugin(tauri_plugin_single_instance::init",
  );
  const desktopSetup = host.indexOf(".setup(move |app|");
  const lifecycleInitialization = host.indexOf("LifecycleService::new(data_root)");
  assert.equal(singleInstanceRegistration >= 0, true);
  assert.equal(singleInstanceRegistration < desktopSetup, true);
  assert.equal(desktopSetup < lifecycleInitialization, true);
  for (const operation of CORE_OPERATIONS) assert.equal(backend.includes(`"${operation}"`), true);
});
