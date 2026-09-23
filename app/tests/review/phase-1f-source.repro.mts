// Retained closeout diagnostic; scenario is also in the normal Source regression suite.
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import {
  renderSourceWorkspace,
  type SourceActions,
  type SourceDocument,
  type SourceInventory,
} from "../../src/source-ui.ts";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: Error) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, decline) => { resolve = accept; reject = decline; });
  return { promise, resolve, reject };
}

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

function sourceActions(overrides: Partial<SourceActions>): SourceActions {
  const fallback = documentModel();
  return {
    status: () => {},
    reloadInventory: async () => inventory(),
    open: async () => fallback,
    update: async () => fallback,
    save: async () => fallback,
    discard: async () => fallback,
    applyBoth: async () => fallback,
    viewScene: () => {},
    requestSave: async (controller, intent) => { await controller.executeSave(intent, async () => {}); },
    registerController: () => () => {},
    runCoordinated: async (_label, task) => task(),
    refreshPersistence: () => {},
    ...overrides,
  };
}

test("closeout: editing after review must not apply an undisplayed combination", async () => {
  installDom(); let applies = 0;
  let model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), externalText: "external", combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model,
    update: async (request) => { model = { ...model, text: request.text, draftVersion: 2, combinedPreview: "different unreviewed combination" }; return model; },
    applyBoth: async () => { applies += 1; return model; },
  }));
  await tick();
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value += "\n# changed draft"; editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await tick(); await tick();
  assert.equal(document.querySelector(".source-conflict pre")!.textContent, "reviewed combined");
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === "Apply Both")!.click();
  await tick(); await tick(); controller.dispose();
  assert.equal(applies, 0, "stale displayed combination must require fresh review");
});
