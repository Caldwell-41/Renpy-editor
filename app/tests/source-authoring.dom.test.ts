import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import {
  renderSourceWorkspace,
  type SourceActions,
  type SourceDocument,
  type SourceInventory,
} from "../src/source-ui.js";

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

test("Source workspace retains drafts, uses the shared toolbar Save executor, and bridges exact selection", async () => {
  installDom();
  let model = documentModel();
  const calls: string[] = [];
  let viewed = "";
  let globalSaveShortcuts = 0;
  window.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") globalSaveShortcuts += 1;
  });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
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
  }));
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
  const immediateSave = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!;
  immediateSave.click();
  immediateSave.click();
  await tick(); await tick();
  assert.equal(globalSaveShortcuts, 0);
  assert.equal(calls.some((call) => call.startsWith("save:")), true);
  assert.equal(model.dirty, false);
  const savedEditor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  controller.dispose();
  savedEditor.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true, cancelable: true }));
  await tick();
  assert.equal(globalSaveShortcuts, 1);
});

test("selection notifications after Source Save do not re-dirty accepted text", async () => {
  installDom();
  let model = documentModel();
  let acceptedText = model.text ?? "";
  let saves = 0;
  let flushes = 0;
  let failInventoryAfterAcceptance = false;
  let saveOutcome = "";
  const statuses: string[] = [];
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    status: (message) => { statuses.push(message); },
    reloadInventory: async () => {
      if (failInventoryAfterAcceptance) throw new Error("status service unavailable");
      return inventory(model.state, model.dirty);
    },
    open: async () => model,
    update: async (request) => {
      const dirty = request.text !== acceptedText;
      const changed = model.text !== request.text || model.dirty !== dirty;
      model = { ...model, text: request.text, dirty, state: dirty ? "dirty" : "clean", draftVersion: model.draftVersion + Number(changed) };
      return model;
    },
    save: async () => {
      saves += 1;
      acceptedText = model.text ?? "";
      model = { ...model, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      return model;
    },
    discard: async () => model,
    applyBoth: async () => model,
    viewScene: () => {},
    requestSave: async (controller, intent) => {
      failInventoryAfterAcceptance = true;
      saveOutcome = (await controller.executeSave(intent, async () => { flushes += 1; })).kind;
    },
  }));
  await tick();
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Changed");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await tick(); await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!.click();
  await tick(); await tick();
  const redrawn = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  redrawn.dispatchEvent(new window.Event("select", { bubbles: true }));
  await tick(); await tick();
  assert.equal(acceptedText.includes("Changed"), true);
  assert.equal(saves, 1);
  assert.equal(flushes, 0);
  assert.equal(model.dirty, false);
  assert.equal(saveOutcome, "accepted");
  assert.match(statuses.at(-1) ?? "", /accepted, but project state could not be confirmed/i);
});

test("immediate Save waits for latest retention, coalesces duplicates, and fails closed on retention error", async () => {
  installDom();
  let model = documentModel();
  const pendingUpdates: Array<ReturnType<typeof deferred<SourceDocument>>> = [];
  const pendingSaves: Array<ReturnType<typeof deferred<SourceDocument>>> = [];
  const savedTexts: string[] = [];
  const statuses: string[] = [];
  let requestPromise: Promise<void> | undefined;
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    status: (message) => { statuses.push(message); },
    reloadInventory: async () => inventory(model.state, model.dirty),
    open: async () => model,
    update: async () => {
      const pending = deferred<SourceDocument>();
      pendingUpdates.push(pending);
      return pending.promise;
    },
    save: async () => {
      savedTexts.push(model.text ?? "");
      const pending = deferred<SourceDocument>();
      pendingSaves.push(pending);
      return pending.promise;
    },
    requestSave: async (sourceController, intent) => {
      requestPromise = sourceController.executeSave(intent, async () => { throw new Error("dirty Save must not Flush"); }).then(() => undefined);
      await requestPromise;
    },
  }));
  await tick();
  let editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Latest");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  const delayedSave = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!;
  delayedSave.click();
  delayedSave.click();
  await tick();
  assert.equal(pendingUpdates.length, 1);
  assert.equal(editor.readOnly, true);
  assert.equal(pendingSaves.length, 0);
  const saveButton = [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!;
  assert.equal(saveButton.disabled, true);

  model = { ...model, text: editor.value, dirty: true, state: "dirty", draftVersion: 1 };
  pendingUpdates[0]!.resolve(model);
  await tick();
  assert.equal(pendingSaves.length, 1);
  assert.deepEqual(savedTexts, [model.text]);
  model = { ...model, dirty: false, state: "clean", draftVersion: 2 };
  pendingSaves[0]!.resolve(model);
  await requestPromise;
  await tick();
  assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")?.readOnly, false);

  editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Latest", "Unretained");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!.click();
  await tick();
  pendingUpdates[1]!.reject(new Error("Draft limit reached; latest text retained locally"));
  await requestPromise;
  await tick();
  assert.equal(pendingSaves.length, 1);
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Unretained/);
  assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")?.readOnly, false);
  assert.match(statuses.at(-1) ?? "", /Draft limit reached/);

  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!.click();
  await tick();
  assert.equal(pendingUpdates.length, 3);
  model = { ...model, text: editor.value, dirty: true, state: "dirty", draftVersion: 3 };
  pendingUpdates[2]!.resolve(model);
  await tick();
  assert.equal(pendingSaves.length, 2);
  assert.match(savedTexts.at(-1) ?? "", /Unretained/);
  model = { ...model, dirty: false, state: "clean", draftVersion: 4 };
  pendingSaves[1]!.resolve(model);
  await requestPromise;
  await tick();
  assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")?.readOnly, false);
  controller.dispose();
});

test("stale completion and old disposal cannot replace or unregister a remounted same-path controller", async () => {
  installDom();
  let activeController: import("../src/source-ui.js").SourceWorkspaceController | undefined;
  let registration = 0;
  const registerController: SourceActions["registerController"] = (controller) => {
    const token = ++registration;
    activeController = controller;
    return () => { if (registration === token) activeController = undefined; };
  };
  let oldModel = documentModel();
  const oldSave = deferred<SourceDocument>();
  let oldRequest: Promise<void> | undefined;
  const oldController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    registerController,
    reloadInventory: async () => inventory(oldModel.state, oldModel.dirty),
    open: async () => oldModel,
    update: async (request) => {
      oldModel = { ...oldModel, text: request.text, dirty: true, state: "dirty", draftVersion: oldModel.draftVersion + 1 };
      return oldModel;
    },
    save: async () => oldSave.promise,
    requestSave: async (controller, intent) => {
      oldRequest = controller.executeSave(intent, async () => {}).then(() => undefined);
      await oldRequest;
    },
  }));
  await tick();
  const oldEditor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  oldEditor.value = oldEditor.value.replace("Hello", "Old pending");
  oldEditor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!.click();
  await tick();

  const newModel = documentModel({ text: 'label scene:\n    "New controller"\n    return\n' });
  const newController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    registerController,
    open: async () => newModel,
    reloadInventory: async () => inventory(),
  }));
  await tick();
  assert.equal(activeController, newController);
  oldController.dispose();
  assert.equal(activeController, newController);
  oldSave.resolve({ ...oldModel, dirty: false, state: "clean", draftVersion: oldModel.draftVersion + 1 });
  await oldRequest;
  await tick();
  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /New controller/);
  assert.equal(activeController, newController);
  newController.dispose();
});

test("delayed confirmed Discard cannot redraw or retarget a replacement controller", async () => {
  installDom();
  let activeController: import("../src/source-ui.js").SourceWorkspaceController | undefined;
  let registration = 0;
  const registerController: SourceActions["registerController"] = (controller) => {
    const token = ++registration;
    activeController = controller;
    return () => { if (registration === token) activeController = undefined; };
  };
  let status = "";
  const delayedDiscard = deferred<SourceDocument>();
  let discardStarted = 0;
  const oldModel = documentModel({ state: "dirty", dirty: true, text: 'label scene:\n    "Old draft"\n    return\n' });
  const oldController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("dirty", true), sourceActions({
    registerController,
    status: (message) => { status = message; },
    open: async () => oldModel,
    reloadInventory: async () => inventory("dirty", true),
    discard: async () => { discardStarted += 1; return delayedDiscard.promise; },
  }));
  await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Discard Draft")!.click();
  [...document.querySelectorAll<HTMLButtonElement>(".source-discard-confirmation button")].find((item) => item.textContent === "Discard Draft")!.click();
  await tick();
  assert.equal(discardStarted, 1);

  oldController.dispose();
  const replacementModel = documentModel({ text: 'label scene:\n    "Replacement after discard"\n    return\n' });
  const replacement = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    registerController,
    status: (message) => { status = message; },
    open: async () => replacementModel,
    reloadInventory: async () => inventory(),
  }));
  await tick();
  const replacementEditor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  replacementEditor.focus();
  status = "Replacement ready";
  delayedDiscard.resolve(documentModel());
  await tick(); await tick();

  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Replacement after discard/);
  assert.equal(document.querySelector(".source-document-state")?.textContent, "Clean");
  assert.equal(activeController, replacement);
  assert.equal(status, "Replacement ready");
  assert.equal(document.activeElement, replacementEditor);
  replacement.dispose();
});

test("delayed Apply Both cannot redraw or retarget a replacement controller", async () => {
  installDom();
  let activeController: import("../src/source-ui.js").SourceWorkspaceController | undefined;
  let registration = 0;
  const registerController: SourceActions["registerController"] = (controller) => {
    const token = ++registration;
    activeController = controller;
    return () => { if (registration === token) activeController = undefined; };
  };
  let status = "";
  const delayedApplyBoth = deferred<SourceDocument>();
  let applyBothStarted = 0;
  const conflictModel = documentModel({
    state: "conflict", dirty: true, canApplyBoth: true, externalText: "external", combinedPreview: "combined",
    text: 'label scene:\n    "Old conflict"\n    return\n', selectedSceneId: undefined, selectedBeatId: undefined,
  });
  const oldController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    registerController,
    status: (message) => { status = message; },
    open: async () => conflictModel,
    reloadInventory: async () => inventory("conflict", true),
    update: async () => conflictModel,
    applyBoth: async () => { applyBothStarted += 1; return delayedApplyBoth.promise; },
  }));
  await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Apply Both")!.click();
  await tick();
  assert.equal(applyBothStarted, 1);

  oldController.dispose();
  const replacementModel = documentModel({ text: 'label scene:\n    "Replacement after merge"\n    return\n' });
  const replacement = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    registerController,
    status: (message) => { status = message; },
    open: async () => replacementModel,
    reloadInventory: async () => inventory(),
  }));
  await tick();
  const replacementEditor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  replacementEditor.focus();
  status = "Replacement ready";
  delayedApplyBoth.resolve(documentModel());
  await tick(); await tick();

  assert.match(document.querySelector<HTMLTextAreaElement>(".source-editor")?.value ?? "", /Replacement after merge/);
  assert.equal(document.querySelector(".source-document-state")?.textContent, "Clean");
  assert.equal(activeController, replacement);
  assert.equal(status, "Replacement ready");
  assert.equal(document.activeElement, replacementEditor);
  replacement.dispose();
});

test("Source observation is suppressed during Save and resumes after the barrier releases", async () => {
  installDom();
  Object.defineProperty(window, "__TAURI_INTERNALS__", { configurable: true, value: {} });
  let observationCallback: (() => void) | undefined;
  window.setInterval = ((handler: TimerHandler) => {
    observationCallback = handler as () => void;
    return 1;
  }) as typeof window.setInterval;
  let model = documentModel();
  let openCalls = 0;
  const delayedSave = deferred<SourceDocument>();
  let saveStarted = 0;
  let saveRequest: Promise<void> | undefined;
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
    open: async () => { openCalls += 1; return model; },
    reloadInventory: async () => inventory(model.state, model.dirty),
    update: async (request) => {
      model = { ...model, text: request.text, dirty: true, state: "dirty", draftVersion: model.draftVersion + 1 };
      return model;
    },
    save: async () => { saveStarted += 1; return delayedSave.promise; },
    requestSave: async (sourceController, intent) => {
      saveRequest = sourceController.executeSave(intent, async () => {}).then(() => undefined);
      await saveRequest;
    },
  }));
  await tick();
  assert.ok(observationCallback);
  assert.equal(openCalls, 1);

  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value = editor.value.replace("Hello", "Held save");
  editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  await tick(); await tick();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find((item) => item.textContent === "Save Source")!.click();
  await tick();
  assert.equal(saveStarted, 1);
  observationCallback!();
  await tick();
  assert.equal(openCalls, 1);

  model = { ...model, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
  delayedSave.resolve(model);
  await saveRequest;
  await tick();
  let observationTimeout: (() => void) | undefined;
  window.setTimeout = ((handler: TimerHandler) => {
    observationTimeout = handler as () => void;
    return 2;
  }) as typeof window.setTimeout;
  observationCallback!();
  assert.ok(observationTimeout);
  assert.equal(openCalls, 1);
  observationTimeout!();
  await tick(); await tick();
  assert.equal(openCalls, 2);
  controller.dispose();
});

test("Source conflict exposes both retained versions and only offers Apply Both with proof", async () => {
  installDom();
  let model = documentModel({
    state: "conflict", dirty: true, canApplyBoth: true, externalText: "external", combinedPreview: "combined",
    selectedSceneId: undefined, selectedBeatId: undefined,
  });
  let applied = false;
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model, discard: async () => model,
    applyBoth: async () => { applied = true; model = documentModel(); return model; }, viewScene: () => {},
  }));
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
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("dirty", true), sourceActions({
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model,
    discard: async () => { discarded += 1; model = documentModel(); return model; },
    applyBoth: async () => model, viewScene: () => {},
  }));
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
  renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    status: () => {}, reloadInventory: async () => inventory(model.state, model.dirty), open: async () => model,
    update: async () => model, save: async () => model,
    discard: async () => { discarded += 1; model = documentModel(); return model; },
    applyBoth: async () => model, viewScene: () => {},
  }));
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

test("unchanged selection retention re-enables a reviewed Apply Both after settlement", async () => {
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
  assert.equal(apply.disabled, true, "retention must block acceptance while pending");
  await tick(); await tick();
  assert.equal(controller.hasUnretainedInput(), false);
  assert.equal(apply.disabled, false);
  assert.equal(document.querySelector<HTMLElement>(".source-review-stale")!.hidden, true);
  apply.click(); await tick();
  assert.equal(applies, 1);
  controller.dispose();
});

test("settling an older selection cannot enable Apply Both over newer pending input", async () => {
  installDom(); const first = deferred<SourceDocument>(); const second = deferred<SourceDocument>();
  let updates = 0; let applies = 0;
  const model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model, update: async () => (++updates === 1 ? first.promise : second.promise),
    applyBoth: async () => { applies++; return model; },
  }));
  await tick();
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  const apply = document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!;
  editor.dispatchEvent(new window.Event("mouseup"));
  editor.value += "# newer"; editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  first.resolve(model); await tick();
  assert.equal(controller.hasUnretainedInput(), true);
  assert.equal(apply.disabled, true);
  apply.dispatchEvent(new window.Event("click")); await tick();
  assert.equal(applies, 0);
  second.resolve({ ...model, text: editor.value, draftVersion: 2, combinedPreview: "new combination" });
  await tick(); await tick();
  assert.equal(apply.disabled, true);
  assert.equal(document.querySelector<HTMLElement>(".source-review-stale")!.hidden, false);
  controller.dispose();
});

test("failed selection retention does not enable Apply Both", async () => {
  installDom(); const pending = deferred<SourceDocument>(); let applies = 0;
  const model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model, update: async () => pending.promise,
    applyBoth: async () => { applies++; return model; },
  }));
  await tick();
  const apply = document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!;
  document.querySelector<HTMLTextAreaElement>(".source-editor")!.dispatchEvent(new window.Event("mouseup"));
  pending.reject(new Error("Draft retention failed")); await tick(); await tick();
  assert.equal(controller.hasUnretainedInput(), true);
  assert.equal(apply.disabled, true);
  apply.dispatchEvent(new window.Event("click")); await tick();
  assert.equal(applies, 0);
  controller.dispose();
});

test("disposed selection completion cannot change the replacement document's controls", async () => {
  installDom(); const oldRetention = deferred<SourceDocument>(); const newRetention = deferred<SourceDocument>();
  const oldModel = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), combinedPreview: "old combination" });
  const oldController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => oldModel, update: async () => oldRetention.promise,
  }));
  await tick();
  document.querySelector<HTMLTextAreaElement>(".source-editor")!.dispatchEvent(new window.Event("mouseup"));
  await tick();
  oldController.dispose();
  const replacement = documentModel({ path: "game/replacement.rpy", state: "conflict", dirty: true,
    draftVersion: 3, canApplyBoth: true, liveRevision: "f".repeat(64), combinedPreview: "new combination" });
  const replacementController = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => replacement, update: async () => newRetention.promise,
  }), { path: replacement.path });
  await tick();
  const apply = document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!;
  assert.equal(apply.disabled, false);
  document.querySelector<HTMLTextAreaElement>(".source-editor")!.dispatchEvent(new window.Event("mouseup"));
  assert.equal(apply.disabled, true);
  oldRetention.resolve(oldModel); await tick(); await tick();
  assert.equal(apply.disabled, true);
  assert.match(document.querySelector("#host")?.textContent ?? "", /replacement\.rpy/);
  newRetention.resolve(replacement); await tick(); await tick();
  assert.equal(apply.disabled, false);
  replacementController.dispose();
});

test("Apply Both keeps the displayed identity across delayed retention and requires refreshed review", async () => {
  installDom();
  const pending = deferred<SourceDocument>();
  const calls: Parameters<SourceActions["applyBoth"]>[0][] = [];
  let model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), externalText: "external", combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model, update: async () => pending.promise,
    applyBoth: async (request) => { calls.push(request); return { ...model, state: "clean", dirty: false, canApplyBoth: false }; },
  }));
  await tick();
  const oldButton = document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!;
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value += "\n# newer"; editor.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(oldButton.disabled, true);
  oldButton.dispatchEvent(new window.Event("click")); // even a queued/stale event must refuse
  await tick(); assert.equal(calls.length, 0);
  model = { ...model, text: editor.value, draftVersion: 2, combinedPreview: "new combined" };
  pending.resolve(model); await tick(); await tick();
  assert.equal(oldButton.disabled, true);
  assert.equal(document.querySelector<HTMLElement>(".source-review-stale")!.hidden, false);
  [...document.querySelectorAll("button")].find(item => item.textContent === "Refresh")!.click();
  await tick(); await tick();
  assert.equal(document.querySelector(".source-conflict pre")!.textContent, "new combined");
  oldButton.dispatchEvent(new window.Event("click")); await tick(); assert.equal(calls.length, 0);
  document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!.click();
  await tick(); await tick();
  assert.deepEqual(calls, [{ path: model.path, expectedBaseRevision: model.baseRevision, expectedDraftVersion: 2,
    expectedExternalRevision: model.liveRevision, expectedCombinedText: "new combined" }]);
  controller.dispose();
});

test("Apply Both refuses a changed external revision returned while settling the captured draft", async () => {
  installDom(); const pending = deferred<SourceDocument>(); let applies = 0;
  const model = documentModel({ state: "conflict", dirty: true, draftVersion: 1, canApplyBoth: true,
    liveRevision: "e".repeat(64), combinedPreview: "reviewed combined" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("conflict", true), sourceActions({
    open: async () => model, update: async () => pending.promise,
    applyBoth: async () => { applies++; return model; },
  }));
  await tick();
  // Selection changes require retention but do not alter the reviewed text/version.
  document.querySelector<HTMLTextAreaElement>(".source-editor")!.selectionStart = 0;
  document.querySelector<HTMLButtonElement>('[data-source-action="apply-both"]')!.click(); await tick();
  pending.resolve({ ...model, liveRevision: "f".repeat(64), combinedPreview: "unreviewed external" });
  await tick(); await tick();
  assert.equal(applies, 0);
  assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")!.value, model.text);
  controller.dispose();
});

test("runtime preparation retains current Source input and Scene forms under the existing lease", async () => {
  const { prepareRuntimeInput } = await import("../src/runtime-preparation.js");
  for (const choice of ["cancel", "saved", "saveAll", "commitScene"] as const) {
    installDom();
    let model = documentModel();
    const calls: string[] = [];
    const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory(), sourceActions({
      open: async () => model,
      reloadInventory: async () => inventory(model.state, model.dirty),
      update: async (request) => { calls.push("retain"); model = { ...model, text: request.text, dirty: true, state: "dirty", draftVersion: model.draftVersion + 1 }; return model; },
    }));
    await tick();
    const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
    editor.value = editor.value.replace("Hello", "Pending"); // Deliberately before input event.
    const scene = document.createElement("section");
    if (choice === "commitScene" || choice === "saved") { scene.className = "scene-draft"; scene.dataset.unsubmitted = "true"; scene.innerHTML = '<input value="uncommitted">'; document.body.append(scene); }
    const preparation = await prepareRuntimeInput("run", "sdk-capability", {
      controller, sceneRoot: document, current: () => true, coordinate: async (task) => task(),
      choose: async ({ sourceDrafts, pendingScene }) => { assert.equal(sourceDrafts, 1); assert.equal(pendingScene, choice === "saved" || choice === "commitScene"); return choice; },
      request: async <T>(operation: import("../src/protocol.js").CoreOperation) => {
        calls.push(operation);
        if (operation === "source.saveAll") model = { ...model, dirty: false, state: "clean", baseRevision: "b".repeat(64) };
        if (operation === "source.list" || operation === "source.saveAll") return inventory(model.state, model.dirty) as T;
        assert.equal(operation, "runtime.prepare");
        assert.equal(editor.readOnly, true);
        return { preparationId: "prepared", savedRevision: "saved", draftCount: model.dirty ? 1 : 0, trustId: null } as T;
      },
    });
    assert.equal(calls[0], "retain");
    assert.equal(Boolean(preparation), choice === "saved" || choice === "saveAll");
    assert.equal(calls.includes("source.saveAll"), choice === "saveAll");
    assert.match(model.text!, /Pending/);
    assert.equal(model.dirty, choice !== "saveAll");
    if (scene.isConnected) assert.equal(scene.querySelector("input")?.value, "uncommitted");
    assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")!.readOnly, false);
    controller.dispose();
  }
});

test("runtime Save All failure releases the Source lease and never prepares execution", async () => {
  const { prepareRuntimeInput } = await import("../src/runtime-preparation.js");
  installDom();
  const model = documentModel({ dirty: true, state: "dirty" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("dirty", true), sourceActions({ open: async () => model }));
  await tick();
  const calls: string[] = [];
  await assert.rejects(prepareRuntimeInput("validate", "sdk", {
    controller, sceneRoot: document, current: () => true, coordinate: async (task) => task(), choose: async () => "saveAll",
    request: async <T>(operation: import("../src/protocol.js").CoreOperation) => {
      calls.push(operation);
      if (operation === "source.list") return inventory("dirty", true) as T;
      throw new Error("Save refused");
    },
  }), /Save refused/);
  assert.deepEqual(calls, ["source.list", "source.saveAll"]);
  assert.equal(document.querySelector<HTMLTextAreaElement>(".source-editor")!.readOnly, false);
  assert.equal(model.dirty, true);
  controller.dispose();
});

test("runtime inventory ticket releases Source lease before cancellable long work", async () => {
  const { prepareRuntimeInput } = await import("../src/runtime-preparation.js");
  installDom();
  let model = documentModel({ dirty: true, state: "dirty" });
  const controller = renderSourceWorkspace(document.querySelector("#host")!, document.querySelector("#tree")!, inventory("dirty", true), sourceActions({
    open: async () => model,
    update: async (request) => { model = { ...model, text: request.text, draftVersion: model.draftVersion + 1 }; return model; },
  }));
  await tick();
  const editor = document.querySelector<HTMLTextAreaElement>(".source-editor")!;
  editor.value += "\n# retained during preparation";
  const abort = new AbortController();
  let coordinating = false;
  let cancelled = false;
  let observed = false;
  const result = await prepareRuntimeInput("run", "sdk", {
    controller, sceneRoot: document, current: () => true, signal: abort.signal,
    coordinate: async task => { coordinating = true; try { return await task(); } finally { coordinating = false; } },
    choose: async () => "saved",
    request: async <T>(operation: import("../src/protocol.js").CoreOperation) => {
      if (operation === "source.list") return inventory("dirty", true) as T;
      if (operation === "runtime.prepare") return { pending: true, requestToken: "ticket" } as T;
      assert.equal(coordinating, false);
      assert.equal(editor.readOnly, false);
      if (operation === "runtime.cancelRequest") { cancelled = true; return { cancelled: true } as T; }
      assert.equal(operation, "runtime.requestStatus");
      observed = true; abort.abort();
      return (cancelled ? { pending: false, response: { ok: false, error: { code: "RUNTIME_CANCELLED" } } } : { pending: true, response: null }) as T;
    },
  });
  assert.equal(result, undefined);
  assert.equal(observed, true);
  assert.equal(cancelled, true);
  assert.match(editor.value, /retained during preparation/);
  assert.match(model.text!, /retained during preparation/);
  assert.equal(model.dirty, true);
  controller.dispose();
});
