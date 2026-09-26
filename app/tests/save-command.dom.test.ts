import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";
import type { SourceDocument, SourceInventory } from "../src/source-ui.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };
const ticks = async (count = 4): Promise<void> => { for (let index = 0; index < count; index += 1) await tick(); };

function click(label: string): void {
  const target = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === label);
  assert.ok(target, `missing button ${label}`);
  target.click();
}

function saveEvent(options: { meta?: boolean; ctrl?: boolean; shift?: boolean; alt?: boolean; repeat?: boolean; composing?: boolean } = {}): KeyboardEvent {
  const event = new window.KeyboardEvent("keydown", {
    key: "s",
    bubbles: true,
    cancelable: true,
    ctrlKey: options.ctrl,
    metaKey: options.meta,
    shiftKey: options.shift,
    altKey: options.alt,
    repeat: options.repeat,
  });
  if (options.composing) Object.defineProperty(event, "isComposing", { value: true });
  return event;
}

test("the shell owns Save routing across Source, clean fallback, modifiers, remount, modal, and retention failure", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "Win32" });
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement,
    HTMLSelectElement: browser.HTMLSelectElement,
    HTMLTextAreaElement: browser.HTMLTextAreaElement,
    Event: browser.Event,
    KeyboardEvent: browser.KeyboardEvent,
  });

  const project = {
    sessionId: "save-session", projectId: "save-project", title: "Save Project", folderName: "save-project",
    chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene",
    sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 },
  };
  let acceptedText = 'label scene:\n    "Hello"\n    return\n';
  let retainedDraft: string | undefined;
  let model: SourceDocument = {
    path: "game/scene.rpy", text: acceptedText, state: "clean", editable: true, dirty: false,
    baseRevision: "a".repeat(64), liveRevision: "a".repeat(64), draftVersion: 0,
    hasBom: false, newline: "LF", partial: false, diagnostics: [], ranges: [],
    selectionStart: 0, selectionEnd: 0, canApplyBoth: false,
  };
  const inventory = (): SourceInventory => ({
    files: [
      { path: model.path, state: model.state, dirty: model.dirty, readOnly: false },
      ...(otherSourceDirty ? [{ path: "game/other.rpy", state: "dirty" as const, dirty: true, readOnly: false }] : []),
    ],
    dirtyCount: Number(model.dirty) + Number(otherSourceDirty),
    draftBytes: (model.dirty ? (model.text?.length ?? 0) : 0) + (otherSourceDirty ? 32 : 0),
  });
  const calls: CoreOperation[] = [];
  let saves = 0;
  let saveAlls = 0;
  let flushes = 0;
  let closes = 0;
  let failNextRetention = false;
  let otherSourceDirty = false;
  const authoring = {
    schemaVersion: 1,
    projectId: project.projectId,
    characters: [],
    appearances: [],
    assets: [],
    variables: [],
  };
  const emptyScene = {
    projectRevision: "1".repeat(64), sourceMapRevision: "2".repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" }, canUndo: false, canRedo: false,
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: model.path, sourceRevision: model.baseRevision, sourceConflict: false, partial: false, beats: [] }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  };

  const request = async <T>(operation: CoreOperation, payload: Readonly<Record<string, unknown>> = {}): Promise<CoreResponse<T>> => {
    calls.push(operation);
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = model.state === "conflict" || model.state === "invalid" ? "conflict" : model.dirty || otherSourceDirty ? "pendingValidation" : "saved";
    else if (operation === "project.flush") { flushes += 1; value = null; }
    else if (operation === "project.close") { closes += 1; value = null; }
    else if (operation === "source.list") value = inventory();
    else if (operation === "flow.list") value = { revision: "flow", entrySceneId: "scene", nodes: [], edges: [], partial: false, stale: false, overLimit: false, notice: "Accepted source" };
    else if (operation === "source.open") value = model;
    else if (operation === "source.updateDraft") {
      if (failNextRetention) {
        failNextRetention = false;
        return { protocolVersion: 1, requestId: "test", ok: false, error: { code: "DRAFT_LIMIT", message: "Latest Source input could not be retained" } };
      }
      const text = String(payload.text);
      const nextDraft = text === acceptedText ? undefined : text;
      const changed = retainedDraft !== nextDraft;
      retainedDraft = nextDraft;
      model = {
        ...model,
        text,
        dirty: nextDraft !== undefined,
        state: nextDraft === undefined ? "clean" : "dirty",
        draftVersion: model.draftVersion + Number(changed),
        selectionStart: Number(payload.selectionStart),
        selectionEnd: Number(payload.selectionEnd),
      };
      value = model;
    } else if (operation === "source.save") {
      saves += 1;
      acceptedText = retainedDraft ?? acceptedText;
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = model;
    } else if (operation === "source.saveAll") {
      saveAlls += 1;
      acceptedText = retainedDraft ?? acceptedText;
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = inventory();
    } else if (operation === "source.discardAll") {
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      value = inventory();
    } else if (operation === "authoring.list") value = authoring;
    else if (operation === "scene.list") value = emptyScene;
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks();
  click("Open Loomlight Project");
  await ticks();
  click("Source");
  await ticks();

  let editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Shell-owned");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  editor.focus();
  const dirtyShortcut = saveEvent({ ctrl: true });
  editor.dispatchEvent(dirtyShortcut);
  await ticks(8);
  assert.equal(dirtyShortcut.defaultPrevented, true);
  assert.equal(saves, 1);
  assert.equal(flushes, 0);
  assert.match(acceptedText, /Shell-owned/);

  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  for (const event of [
    saveEvent({ ctrl: true, shift: true }),
    saveEvent({ ctrl: true, alt: true }),
    saveEvent({ meta: true }),
  ]) editor.dispatchEvent(event);
  await ticks();
  assert.equal(saves, 1);
  assert.equal(flushes, 0);

  editor.dispatchEvent(saveEvent({ ctrl: true, composing: true }));
  editor.dispatchEvent(saveEvent({ ctrl: true, repeat: true }));
  await ticks();
  assert.equal(saves, 1);
  assert.equal(flushes, 0);

  Object.defineProperty(browser.navigator, "platform", { configurable: true, value: "MacIntel" });
  const cleanMacShortcut = saveEvent({ meta: true });
  editor.dispatchEvent(cleanMacShortcut);
  await ticks(6);
  assert.equal(cleanMacShortcut.defaultPrevented, true);
  assert.equal(saves, 1);
  assert.equal(flushes, 1);

  editor.value = acceptedText + "# Branch navigation draft\n";
  editor.selectionStart = 7; editor.selectionEnd = 9;
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  const beforeBranchesSaves = saves;
  click("Branches"); await ticks();
  assert.ok(document.querySelector(".branches-viewport"));
  assert.equal(saves, beforeBranchesSaves);
  assert.equal(model.dirty, true);
  click("Source"); await ticks();
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  assert.equal(editor.value, model.text);
  assert.equal(editor.selectionStart, 7); assert.equal(editor.selectionEnd, 9);

  click("Characters");
  await ticks();
  const supportingInput = document.querySelector<HTMLInputElement>('input[name="technicalName"]')!;
  supportingInput.value = "unsubmitted_character";
  supportingInput.dispatchEvent(new window.Event("input", { bubbles: true }));
  otherSourceDirty = true;
  const flushesBeforeCombinedCase = flushes;
  const savesBeforeCombinedCase = saves;
  const saveAllsBeforeCombinedCase = saveAlls;
  const supportingMutationsBefore = calls.filter((operation) => [
    "character.create", "character.update", "variable.create", "variable.update", "asset.import", "asset.repairCompatibility",
  ].includes(operation)).length;
  const nonSourceShortcut = saveEvent({ meta: true });
  window.dispatchEvent(nonSourceShortcut);
  await ticks(5);
  assert.equal(nonSourceShortcut.defaultPrevented, true);
  assert.equal(flushes, flushesBeforeCombinedCase + 1, JSON.stringify(calls.slice(-20)));
  assert.equal(saves, savesBeforeCombinedCase);
  assert.equal(saveAlls, saveAllsBeforeCombinedCase);
  assert.equal(calls.filter((operation) => [
    "character.create", "character.update", "variable.create", "variable.update", "asset.import", "asset.repairCompatibility",
  ].includes(operation)).length, supportingMutationsBefore);
  assert.equal(document.querySelector("#app-status")?.textContent, "Pending validation");
  assert.equal(supportingInput.value, "unsubmitted_character");
  assert.equal(flushes, 2);
  assert.equal(saves, 1);

  click("Source");
  await ticks();
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Shell-owned", "Remounted");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  editor.focus();
  editor.dispatchEvent(saveEvent({ meta: true }));
  await ticks(8);
  assert.equal(saves, 2);
  assert.equal(flushes, 2, JSON.stringify(calls.slice(-20)));

  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Remounted", "Modal draft");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await ticks();
  click("Close Project");
  await ticks();
  assert.ok(document.querySelector(".leave-source-dialog"));
  const savesBeforeModalShortcut = saves;
  const flushesBeforeModalShortcut = flushes;
  window.dispatchEvent(saveEvent({ meta: true }));
  await ticks();
  assert.equal(saves, savesBeforeModalShortcut);
  assert.equal(flushes, flushesBeforeModalShortcut);
  click("Cancel");
  assert.equal(closes, 0);
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Modal draft/);

  failNextRetention = true;
  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Modal draft", "Unretained close");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await ticks();
  click("Close Project");
  await ticks();
  assert.equal(document.querySelector(".leave-source-dialog"), null);
  assert.equal(closes, 0);
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Unretained close/);
  assert.match(document.querySelector("#app-status")?.textContent ?? "", /could not be retained/);
});
