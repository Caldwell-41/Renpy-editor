import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };

function click(label: string): void {
  const target = [...document.querySelectorAll("button")].find((item) => item.textContent === label);
  assert.ok(target, `missing button ${label}`);
  target.click();
}

function labelledControl<T extends HTMLInputElement | HTMLSelectElement>(label: string): T {
  const wrapper = [...document.querySelectorAll("label")].find((item) => item.firstElementChild?.textContent === label);
  assert.ok(wrapper, `missing field ${label}`);
  const control = wrapper.querySelector("input, select");
  assert.ok(control);
  return control as T;
}

function enter(control: HTMLInputElement | HTMLSelectElement, value: string): void {
  control.value = value;
  control.dispatchEvent(new window.Event("input", { bubbles: true }));
}

test("supporting authoring ignores stale completions and reports persistence truthfully", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement,
    HTMLSelectElement: browser.HTMLSelectElement,
    Event: browser.Event,
    KeyboardEvent: browser.KeyboardEvent,
  });

  const project = (title: string, sessionId: string) => ({
    sessionId, projectId: `project-${sessionId}`, title, folderName: title.toLowerCase(),
    chapterId: "chapter", chapterName: "Chapter 1", sceneId: "scene", sceneName: "Scene 1",
    sdkVersion: "8.5.3", resolution: { width: 1920, height: 1080 },
  });
  const projectA = project("Project A", "session-a");
  const projectB = project("Project B", "session-b");
  const model = {
    schemaVersion: 1, projectId: projectB.projectId,
    characters: [{
      id: "character", technicalName: "alice", displayName: "Alice", dialogueColor: "#abcdef",
      defaultAppearanceId: "appearance-one",
      source: { path: "game/definitions/characters.rpy", statement: "define alice = Character(\"Alice\", color=\"#abcdef\")", sourceRevision: "0".repeat(64) },
    }],
    appearances: [
      { id: "appearance-one", characterId: "character", label: "happy", attributes: { expression: "happy", outfit: "default", pose: "default" }, renderMode: "staticImportedAsset", assetId: "asset-one" },
      { id: "appearance-two", characterId: "character", label: "sad", attributes: { expression: "sad", outfit: "default", pose: "default" }, renderMode: "staticImportedAsset", assetId: "asset-two" },
    ],
    assets: [{ id: "legacy", kind: "background", displayName: "Cafe", relativePath: "game/images/bg_cafe.png", discoveryName: "bg cafe", sha256: "1".repeat(64), byteCount: 4, status: "compatibilityRequired" }],
    variables: [{ id: "score", technicalName: "score", variableType: "int", defaultValue: "9007199254740993", source: { path: "game/definitions/variables.rpy", statement: "default score = 9007199254740993", sourceRevision: "2".repeat(64) } }],
  };

  const opens: Array<ReturnType<typeof deferred<unknown>>> = [];
  const authoringLoads: Array<ReturnType<typeof deferred<unknown>>> = [];
  const characterCreates: Array<ReturnType<typeof deferred<unknown>>> = [];
  const variableCreates: Array<ReturnType<typeof deferred<unknown>>> = [];
  const flushes: Array<ReturnType<typeof deferred<unknown>>> = [];
  const statuses: Array<ReturnType<typeof deferred<unknown>>> = [];
  const calls: Array<{ operation: CoreOperation; payload: Readonly<Record<string, unknown>> }> = [];
  let delayNextAuthoring = false;
  let delayNextVariableCreate = false;
  let delayNextFlush = false;
  let delayNextStatus = false;
  let failVariable = true;
  let importChoiceCount = 0;

  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    calls.push({ operation, payload });
    let result: unknown;
    if (operation === "project.listRecent") result = [];
    else if (operation === "project.openPicker") { const pending = deferred<unknown>(); opens.push(pending); result = await pending.promise; }
    else if (operation === "project.status" && delayNextStatus) { delayNextStatus = false; const pending = deferred<unknown>(); statuses.push(pending); result = await pending.promise; }
    else if (operation === "project.status") result = "saved";
    else if (operation === "project.flush" && delayNextFlush) { delayNextFlush = false; const pending = deferred<unknown>(); flushes.push(pending); result = await pending.promise; }
    else if (operation === "authoring.list" && delayNextAuthoring) { delayNextAuthoring = false; const pending = deferred<unknown>(); authoringLoads.push(pending); result = await pending.promise; }
    else if (operation === "authoring.list") result = model;
    else if (operation === "character.create") { const pending = deferred<unknown>(); characterCreates.push(pending); result = await pending.promise; }
    else if (operation === "variable.create" && delayNextVariableCreate) { delayNextVariableCreate = false; const pending = deferred<unknown>(); variableCreates.push(pending); result = await pending.promise; }
    else if (operation === "variable.create" && failVariable) { failVariable = false; return { protocolVersion: 1, requestId: "test", ok: false, error: { code: "INVALID_PAYLOAD", message: "Variable rejected" } }; }
    else if (operation === "asset.chooseImport") {
      importChoiceCount += 1;
      result = importChoiceCount === 1
        ? { cancelled: true }
        : { authorityId: "retained-import", displayName: "happy.png", byteCount: 4, extension: "png" };
    }
    else result = model;
    return { protocolVersion: 1, requestId: "test", ok: true, value: result as T };
  };

  const { startApplication } = await import("../src/main.js");
  assert.throws(() => window.__loomlightInstallSmokeRequester?.(request), /not enabled/);
  Object.defineProperty(window, "__loomlightScaffoldSmokeMode", {
    value: true, configurable: false, enumerable: false, writable: false,
  });
  const restoreSmokeRequester = window.__loomlightInstallSmokeRequester?.(request);
  assert.equal(typeof restoreSmokeRequester, "function");
  restoreSmokeRequester?.();
  startApplication(request);
  await tick();

  click("Open Loomlight Project");
  click("Open Loomlight Project");
  assert.equal(opens.length, 2);
  opens[1]!.resolve(projectB);
  await tick();
  opens[0]!.resolve(projectA);
  await tick();
  assert.match(document.body.textContent ?? "", /Project B/);
  assert.doesNotMatch(document.body.textContent ?? "", /Project A/);

  delayNextAuthoring = true;
  click("Characters");
  await tick();
  click("Variables");
  await tick();
  authoringLoads[0]!.reject(new Error("obsolete authoring failure"));
  await tick();
  assert.match(document.body.textContent ?? "", /Variables/);
  assert.equal(document.querySelector("#app-status")?.textContent, "Saved");

  click("Characters");
  await tick();
  enter(labelledControl<HTMLInputElement>("Technical variable (fixed after creation)"), "new_character");
  enter(labelledControl<HTMLInputElement>("Display name"), "New Character");
  click("Create Character");
  await tick();
  click("Variables");
  await tick();
  characterCreates[0]!.resolve(model);
  await tick();
  await tick();
  assert.match(document.querySelector("h1")?.textContent ?? "", /Variables/);
  assert.equal(document.querySelector("#app-status")?.textContent, "Saved");

  const technical = labelledControl<HTMLInputElement>("Technical name (fixed after creation)");
  enter(technical, "bad_value");
  const type = labelledControl<HTMLSelectElement>("Type");
  type.value = "int";
  type.dispatchEvent(new window.Event("change", { bubbles: true }));
  const defaultValue = labelledControl<HTMLInputElement>("Default value");
  enter(defaultValue, "9223372036854775807");
  click("Create Variable");
  await tick();
  assert.equal(technical.value, "bad_value");
  assert.equal(defaultValue.value, "9223372036854775807");
  assert.equal(document.activeElement, technical);
  assert.equal(document.querySelector("#app-status")?.textContent, "Variable rejected");

  enter(technical, "maximum");
  click("Create Variable");
  await tick();
  const exactCall = calls.findLast((call) => call.operation === "variable.create");
  assert.equal(exactCall?.payload.defaultValue, "9223372036854775807");

  click("Variables");
  await tick();
  click("Edit default");
  enter(labelledControl<HTMLInputElement>("Default value"), "-9223372036854775808");
  click("Save Default");
  await tick();
  const exactUpdate = calls.findLast((call) => call.operation === "variable.update");
  assert.equal(exactUpdate?.payload.defaultValue, "-9223372036854775808");

  click("Variables");
  await tick();
  const dirty = labelledControl<HTMLInputElement>("Technical name (fixed after creation)");
  enter(dirty, "not_submitted");
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
  await tick();
  assert.equal(document.querySelector("#app-status")?.textContent, "Unsubmitted input — accepted changes saved");

  delayNextStatus = true;
  click("Variables");
  await tick();
  delayNextVariableCreate = true;
  enter(labelledControl<HTMLInputElement>("Technical name (fixed after creation)"), "overlap_success");
  const flushCountBeforeSuccess = calls.filter((call) => call.operation === "project.flush").length;
  click("Create Variable");
  await tick();
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
  await tick();
  assert.equal(calls.filter((call) => call.operation === "project.flush").length, flushCountBeforeSuccess);
  assert.equal(document.querySelector("#app-status")?.textContent, "Authoring operation in progress — no additional Flush started");
  statuses[0]!.resolve("saved");
  await tick();
  assert.equal(document.querySelector("#app-status")?.textContent, "Authoring operation in progress — no additional Flush started");
  variableCreates[0]!.resolve(model);
  await tick();
  await tick();
  assert.equal(document.querySelector("#app-status")?.textContent, "Saved");

  delayNextVariableCreate = true;
  const failedTechnical = labelledControl<HTMLInputElement>("Technical name (fixed after creation)");
  enter(failedTechnical, "overlap_failure");
  const flushCountBeforeFailure = calls.filter((call) => call.operation === "project.flush").length;
  click("Create Variable");
  await tick();
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
  await tick();
  variableCreates[1]!.reject(new Error("Delayed variable rejected"));
  await tick();
  const failedSubmit = [...document.querySelectorAll("button")].find((item) => item.textContent === "Create Variable");
  assert.equal(calls.filter((call) => call.operation === "project.flush").length, flushCountBeforeFailure);
  assert.equal(failedTechnical.value, "overlap_failure");
  assert.equal(failedSubmit?.disabled, false);
  assert.equal(document.activeElement, failedTechnical);
  assert.equal(document.querySelector("#app-status")?.textContent, "Delayed variable rejected");

  delayNextFlush = true;
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
  await tick();
  const variableCountBeforeBlockedCreate = calls.filter((call) => call.operation === "variable.create").length;
  click("Create Variable");
  await tick();
  assert.equal(calls.filter((call) => call.operation === "variable.create").length, variableCountBeforeBlockedCreate);
  assert.equal(failedSubmit?.disabled, false);
  assert.equal(document.querySelector("#app-status")?.textContent, "Flush is still in progress.");
  flushes[0]!.resolve(undefined);
  await tick();
  assert.equal(document.querySelector("#app-status")?.textContent, "Unsubmitted input — accepted changes saved");

  delayNextFlush = true;
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
  await tick();
  click("Assets");
  await tick();
  flushes[1]!.resolve(undefined);
  await tick();
  await tick();
  assert.match(document.querySelector("h1")?.textContent ?? "", /Assets/);
  assert.equal(document.querySelector("#app-status")?.textContent, "Saved");
  enter(labelledControl<HTMLInputElement>("Technical name"), "theme");
  enter(labelledControl<HTMLInputElement>("Display name"), "Theme");
  click("Choose and import…");
  await tick();
  const importButton = [...document.querySelectorAll("button")].find((item) => item.textContent === "Choose and import…");
  assert.equal(importButton?.disabled, false);
  assert.equal(labelledControl<HTMLInputElement>("Technical name").value, "theme");

  click("Repair Ren'Py asset names");
  await tick();
  assert.equal(calls.some((call) => call.operation === "asset.repairCompatibility"), true);
  click("Characters");
  await tick();
  click("Set default");
  await tick();
  assert.equal(calls.some((call) => call.operation === "appearance.setDefault"), true);

  click("Edit");
  enter(labelledControl<HTMLInputElement>("Display name"), "Alice Updated");
  click("Save Character");
  await tick();
  assert.equal(calls.some((call) => call.operation === "character.update"), true);

  click("Characters");
  await tick();
  click("Add Appearance");
  enter(labelledControl<HTMLInputElement>("Expression token"), "delighted");
  click("Choose image…");
  await tick();
  assert.equal(calls.some((call) => call.operation === "asset.import"), true);

  click("Characters");
  await tick();
  enter(labelledControl<HTMLInputElement>("Technical variable (fixed after creation)"), "late_character");
  enter(labelledControl<HTMLInputElement>("Display name"), "Late Character");
  click("Create Character");
  await tick();
  click("Loomlight");
  await tick();
  click("Open Loomlight Project");
  assert.equal(opens.length, 3);
  opens[2]!.resolve(projectA);
  await tick();
  characterCreates[1]!.resolve(model);
  await tick();
  assert.match(document.body.textContent ?? "", /Project A/);
});
