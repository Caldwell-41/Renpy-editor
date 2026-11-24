import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";
import type { SceneBeat } from "../src/scene-ui.js";
import { sceneBodies } from "./story-controls-fixture.js";

// Runs the shell in its own file so main.ts module state starts fresh.
const ticks = async (count = 6): Promise<void> => { for (let index = 0; index < count; index += 1) await new Promise(resolve => setTimeout(resolve, 0)); };

test("keyboard Undo and Redo of typing keep focus and caret in the beat draft field through the reload", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, HTMLTextAreaElement: browser.HTMLTextAreaElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  const project = { sessionId: "keys-session", projectId: "keys-project", title: "Keys Project", folderName: "keys-project", chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene", sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 } };
  const beat: SceneBeat = { id: "first", byteStart: 15, byteEnd: 30, protected: false, payload: { type: "narration", text: "Hello" } };
  const scenes = {
    projectRevision: "1".repeat(64), sourceMapRevision: "1".repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: "game/scene.rpy", sourceRevision: "1".repeat(64), sourceConflict: false, partial: false, beats: [beat], bodies: sceneBodies([beat]) }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  };
  // Core keeps one draft step: the typing in beat 01.
  let recorded: { stepId: string; draft: string; name: string; item: unknown } | undefined, undone = false;
  const state = () => recorded ? (undone ? { undo: null, redo: recorded } : { undo: recorded, redo: null }) : { undo: null, redo: null };
  const request = async <T>(operation: CoreOperation, payload?: unknown): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "history.state") value = state();
    else if (operation === "history.draftStep") { const { sessionId: _, ...step } = payload as typeof recorded & { sessionId: string }; recorded = step; value = state(); }
    else if (operation === "history.undo" || operation === "history.redo") {
      undone = operation === "history.undo";
      value = { entry: recorded, step: { stepId: recorded!.stepId, draft: recorded!.draft }, history: state() };
    } else if (operation === "scene.list") value = scenes;
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === "Open Loomlight Project")!.click(); await ticks();
  document.querySelector<HTMLElement>('.story-track-column[data-beat-id="first"] .story-track-beat')!.click(); await ticks();
  const field = (): HTMLTextAreaElement => document.querySelector<HTMLTextAreaElement>(".story-editor textarea")!;
  field().focus(); field().value = "Hello there"; field().dispatchEvent(new Event("input", { bubbles: true })); await ticks();
  assert.ok(recorded, "typing records a draft step");
  const mac = /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
  const press = (shift: boolean): void => { field().setSelectionRange(2, 2); document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "z", shiftKey: shift, metaKey: mac, ctrlKey: !mac, bubbles: true, cancelable: true })); };
  const caret = (): [boolean, number, number] => [document.activeElement === field(), field().selectionStart, field().selectionEnd];
  press(false); await ticks(10);
  assert.equal(field().value, "Hello", "Undo reverses the typing");
  assert.deepEqual(caret(), [true, 2, 2], "Undo keeps focus and caret in the field");
  press(true); await ticks(10);
  assert.equal(field().value, "Hello there", "Redo restores the typing");
  assert.deepEqual(caret(), [true, 2, 2], "Redo keeps focus and caret in the field");
  await browser.happyDOM.close();
});
