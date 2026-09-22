// Independent review diagnostic: required behavior is red on build #88.
// Promote to the normal regression suite when F4 is corrected.
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

test("review: unchanged selection retention re-enables Apply Both", async () => {
  installDom(); let applies = 0;
  let model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), externalText: "external", combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model,
    update: async (request) => { model = { ...model, selectionStart: request.selectionStart, selectionEnd: request.selectionEnd }; return model; },
    applyBoth: async () => { applies++; return model; },
  }));
  await tick();
  const apply = document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!;
  assert.equal(apply.disabled, false);
  document.querySelector<HTMLTextAreaElement>(".source-editor")!.dispatchEvent(new window.Event("mouseup"));
  await tick(); await tick();
  const pending = controller.hasUnretainedInput();
  apply.click(); await tick();
  const actual = { pending, disabled: apply.disabled, applies, staleNoticeHidden: document.querySelector<HTMLElement>(".source-review-stale")!.hidden };
  controller.dispose();
  assert.deepEqual(actual, { pending: false, disabled: false, applies: 1, staleNoticeHidden: true });
});
