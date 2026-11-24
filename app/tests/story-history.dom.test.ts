import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";
import type { SceneBeat } from "../src/scene-ui.js";
import { sceneBodies } from "./story-controls-fixture.js";

// Runs the shell in its own file so main.ts module state starts fresh.
const ticks = async (count = 6): Promise<void> => { for (let index = 0; index < count; index += 1) await new Promise(resolve => setTimeout(resolve, 0)); };
const click = (label: string): void => {
  const target = [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === label);
  assert.ok(target, `missing button ${label}`); target.click();
};

test("Story stays drawn while Undo of a beat delete reloads the scene, then shows the restored beat", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, HTMLTextAreaElement: browser.HTMLTextAreaElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  const project = { sessionId: "history-session", projectId: "history-project", title: "History Project", folderName: "history-project", chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene", sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 } };
  const line = (id: string, text: string, at: number): SceneBeat => ({ id, byteStart: at, byteEnd: at + 15, protected: false, payload: { type: "narration", text } });
  const workspace = (beats: SceneBeat[], revision: string) => ({
    projectRevision: revision.repeat(64), sourceMapRevision: revision.repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: "game/scene.rpy", sourceRevision: revision.repeat(64), sourceConflict: false, partial: false, beats, bodies: sceneBodies(beats) }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  });
  // Beat 02 was deleted; Undo brings it back.
  const deleted = workspace([line("first", "Hello", 15)], "1"), restored = workspace([line("first", "Hello", 15), line("second", "Restored line", 30)], "2");
  const entry = { name: "delete beat 02", item: { type: "story", sceneId: "scene", beatId: "second" } };
  let scenes = deleted, undone = false, held: (() => void) | undefined;
  const request = async <T>(operation: CoreOperation): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "history.state") value = undone ? { undo: null, redo: entry } : { undo: entry, redo: null };
    else if (operation === "history.undo") { undone = true; scenes = restored; value = { entry, history: { undo: null, redo: entry } }; }
    else if (operation === "scene.list") {
      // A slow core: the scene list after Undo waits until the test releases it.
      if (undone) await new Promise<void>(resolve => { held = resolve; });
      value = scenes;
    }
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks(); click("Open Loomlight Project"); await ticks();
  const column = (id: string): Element | null => document.querySelector(`.story-track-column[data-beat-id="${id}"]`);
  assert.ok(column("first"));
  document.querySelector<HTMLButtonElement>('[data-history="undo"]')!.click(); await ticks();
  assert.ok(held, "Undo reloads the scene list");
  // While core answers, the scene the author was looking at stays on screen, held so
  // nothing is typed into the workspace Undo is replacing.
  const story = document.querySelector<HTMLElement>(".scene-workspace")!;
  assert.ok(column("first"), "Story is not blank while Undo runs");
  assert.deepEqual([story.hasAttribute("inert"), story.getAttribute("aria-busy")], [true, "true"]);
  assert.equal(document.querySelector<HTMLElement>("#app")!.dataset.historyOutcome, undefined, "Undo finishes once Story shows its result");
  held!(); await ticks(10);
  assert.ok(column("second"), "the restored beat shows");
  assert.deepEqual([story.hasAttribute("inert"), story.hasAttribute("aria-busy")], [false, false]);
  assert.equal(document.querySelector<HTMLElement>("#app")!.dataset.historyOutcome, "committed");
  assert.equal(document.querySelector<HTMLElement>('.story-track-column[data-beat-id="second"] > .story-track-beat')!.dataset.selected, "true");
  await browser.happyDOM.close();
});
