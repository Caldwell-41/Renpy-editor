import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import {
  renderSourceWorkspace,
  type SourceDocument,
  type SourceInventory,
} from "../src/source-ui.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };

function installDom(): void {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<aside id="tree"></aside><main id="host"></main>';
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLTextAreaElement: browser.HTMLTextAreaElement,
    Event: browser.Event,
    KeyboardEvent: browser.KeyboardEvent,
  });
}

function inventory(state: SourceDocument["state"] = "clean", dirty = false): SourceInventory {
  return { files: [{ path: "game/scene.rpy", state, sceneId: "scene", dirty, readOnly: false }], dirtyCount: dirty ? 1 : 0, draftBytes: dirty ? 32 : 0 };
}

function documentModel(overrides: Partial<SourceDocument> = {}): SourceDocument {
  return {
    path: "game/scene.rpy", text: 'label scene:\n    "Hello 😀"\n    return\n', state: "clean", editable: true,
    dirty: false, baseRevision: "a".repeat(64), liveRevision: "a".repeat(64), draftVersion: 0,
    hasBom: false, newline: "LF", partial: true, diagnostics: [], selectionStart: 17, selectionEnd: 27,
    ranges: [
      { sceneId: "scene", beatId: "beat", kind: "narration", byteStart: 17, byteEnd: 33, editorStart: 17, editorEnd: 29, protected: false },
      { sceneId: "scene", beatId: "opaque", kind: "customCode", byteStart: 33, byteEnd: 40, editorStart: 29, editorEnd: 36, protected: true },
    ],
    selectedSceneId: "scene", selectedBeatId: "beat", canApplyBoth: false,
    ...overrides,
  };
}

test("Source workspace retains drafts, uses Source-focused save, and bridges exact selection", async () => {
  installDom();
  let model = documentModel();
  const calls: string[] = [];
  let viewed = "";
  let globalSaveShortcuts = 0;
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") globalSaveShortcuts += 1;
  });
  const dispose = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), {
    status: (message) => { calls.push(`status:${message}`); },
    reloadInventory: async () => inventory(model.state, model.dirty),
    open: async () => model,
    update: async (request) => {
      calls.push(`update:${request.selectionStart}:${request.selectionEnd}`);
      model = { ...model, text: request.text, dirty: true, state: "dirty", draftVersion: model.draftVersion + 1, selectedSceneId: undefined, selectedBeatId: undefined };
      return model;
    },
    save: async (request) => {
      calls.push(`save:${request.expectedDraftVersion}`);
      model = { ...model, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      return model;
    },
    discard: async () => model,
    applyBoth: async () => model,
    viewScene: (sceneId, beatId) => { viewed = `${sceneId}:${beatId}`; },
  });
  await tick();
  assert.match(document.querySelector("#tree")?.textContent ?? "", /scene\.rpy/);
  assert.match(document.querySelector("#host")?.textContent ?? "", /Custom Code/);
  const view = [...document.querySelectorAll("button")].find((item) => item.textContent === "View selected Beat in Scene")!;
  view.click(); assert.equal(viewed, "scene:beat");
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Changed"); editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await tick(); await tick();
  assert.equal(model.dirty, true);
  assert.match(document.querySelector(".source-draft-warning")?.textContent ?? "", /only for this session/i);
  const savesBeforeUndo = calls.filter((call) => call.startsWith("save:")).length;
  editor.dispatchEvent(new window.KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
  await tick();
  assert.equal(calls.filter((call) => call.startsWith("save:")).length, savesBeforeUndo);
  const sourceSave = new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true });
  const unhandled = editor.dispatchEvent(sourceSave);
  await tick(); await tick();
  assert.equal(unhandled, false);
  assert.equal(globalSaveShortcuts, 0);
  assert.equal(calls.some((call) => call.startsWith("save:")), true);
  assert.equal(model.dirty, false);
  const savedEditor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  dispose();
  savedEditor.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true }));
  await tick();
  assert.equal(globalSaveShortcuts, 1);
});

test("Source conflict exposes both retained versions and only offers Apply Both with proof", async () => {
  installDom();
  let model = documentModel({
    state: "conflict", dirty: true, canApplyBoth: true, externalText: "external", combinedPreview: "combined",
    selectedSceneId: undefined, selectedBeatId: undefined,
  });
  let applied = false;
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), {
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model, discard: async () => model,
    applyBoth: async () => { applied = true; model = documentModel(); return model; }, viewScene: () => {},
  });
  await tick();
  assert.match(document.body.textContent ?? "", /both retained/i);
  assert.match(document.querySelector(".source-conflict pre")?.textContent ?? "", /combined/);
  const apply = [...document.querySelectorAll("button")].find((item) => item.textContent === "Apply Both")!; apply.click(); await tick();
  assert.equal(applied, true);
  assert.equal(document.querySelector(".source-conflict"), null);
});

test("destructive Source draft actions require confirmation and Cancel changes nothing", async () => {
  installDom();
  let model = documentModel({ state: "dirty", dirty: true });
  let discarded = 0;
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("dirty", true), {
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model,
    discard: async () => { discarded += 1; model = documentModel(); return model; },
    applyBoth: async () => model, viewScene: () => {},
  });
  await tick();

  const discard = [...document.querySelectorAll("button")].find((item) => item.textContent === "Discard Draft")!;
  discard.click();
  assert.equal(discarded, 0);
  assert.match(document.querySelector(".source-discard-confirmation")?.textContent ?? "", /permanently discards/i);
  [...document.querySelectorAll<HTMLButtonElement>(".source-discard-confirmation button")].find((item) => item.textContent === "Cancel")!.click();
  assert.equal(discarded, 0);
  assert.equal(model.dirty, true);

  discard.click();
  [...document.querySelectorAll<HTMLButtonElement>(".source-discard-confirmation button")].find((item) => item.textContent === "Discard Draft")!.click();
  await tick(); await tick();
  assert.equal(discarded, 1);
  assert.equal(model.dirty, false);
});

test("conflict Copy Draft copies bytes and external reload requires confirmation", async () => {
  installDom();
  let model = documentModel({ state: "conflict", dirty: true, externalText: "external", selectedSceneId: undefined, selectedBeatId: undefined });
  let copied = "";
  let discarded = 0;
  Object.defineProperty(window.navigator, "clipboard", { configurable: true, value: { writeText: async (value: string) => { copied = value; } } });
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), {
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model,
    discard: async () => { discarded += 1; model = documentModel(); return model; },
    applyBoth: async () => model, viewScene: () => {},
  });
  await tick();

  [...document.querySelectorAll("button")].find((item) => item.textContent === "Copy Draft")!.click();
  await tick();
  assert.equal(copied, model.text);

  const reload = [...document.querySelectorAll("button")].find((item) => item.textContent === "Reload External / Discard Draft")!;
  reload.click();
  assert.equal(discarded, 0);
  [...document.querySelectorAll<HTMLButtonElement>(".source-discard-confirmation button")].find((item) => item.textContent === "Cancel")!.click();
  assert.equal(discarded, 0);
  assert.equal(model.state, "conflict");

  reload.click();
  [...document.querySelectorAll<HTMLButtonElement>(".source-discard-confirmation button")].find((item) => item.textContent === "Reload External")!.click();
  await tick(); await tick();
  assert.equal(discarded, 1);
  assert.equal(model.state, "clean");
});
