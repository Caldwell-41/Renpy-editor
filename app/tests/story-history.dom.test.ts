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

test("Story stays drawn while Undo of a beat delete reloads the scene, and Redo works before it arrives", async () => {
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
  // Beat 02 was deleted; Undo brings it back and Redo deletes it again.
  const deleted = workspace([line("first", "Hello", 15)], "1"), restored = workspace([line("first", "Hello", 15), line("second", "Restored line", 30)], "2");
  const entry = { name: "delete beat 02", item: { type: "story", sceneId: "scene", beatId: "second" } };
  let scenes = deleted, undone = false, slow = false;
  const held: (() => void)[] = [], steps: string[] = [];
  const request = async <T>(operation: CoreOperation): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "history.state") value = undone ? { undo: null, redo: entry } : { undo: entry, redo: null };
    else if (operation === "history.undo" || operation === "history.redo") {
      steps.push(operation); undone = operation === "history.undo"; scenes = undone ? restored : deleted;
      value = { entry, history: undone ? { undo: null, redo: entry } : { undo: entry, redo: null } };
    } else if (operation === "scene.list") {
      // A slow core: while `slow`, each scene list waits until the test releases it.
      if (slow) await new Promise<void>(resolve => { held.push(resolve); });
      value = scenes;
    }
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks(); click("Open Loomlight Project"); await ticks();
  const column = (id: string): Element | null => document.querySelector(`.story-track-column[data-beat-id="${id}"]`);
  const story = (): HTMLElement => document.querySelector<HTMLElement>(".scene-workspace")!;
  const heldState = (): [boolean, string | null] => [story().hasAttribute("inert"), story().getAttribute("aria-busy")];
  assert.ok(column("first"));
  slow = true; document.querySelector<HTMLButtonElement>('[data-history="undo"]')!.click(); await ticks();
  assert.equal(held.length, 1, "Undo reloads the scene list");
  // While core answers, the scene the author was looking at stays on screen, held so
  // nothing is typed into the workspace Undo is replacing.
  assert.ok(column("first"), "Story is not blank while Undo runs");
  assert.deepEqual(heldState(), [true, "true"]);
  slow = false; held.shift()!(); await ticks(10);
  assert.ok(column("second"), "the restored beat shows");
  assert.deepEqual(heldState(), [false, null]);
  assert.equal(document.querySelector<HTMLElement>('.story-track-column[data-beat-id="second"] > .story-track-beat')!.dataset.selected, "true");
  // Redo pressed before an Undo's scene list arrives is not dropped: it runs after it.
  document.querySelector<HTMLButtonElement>('[data-history="redo"]')!.click(); await ticks();
  slow = true; document.querySelector<HTMLButtonElement>('[data-history="undo"]')!.click(); await ticks();
  assert.equal(held.length, 1);
  slow = false; document.querySelector<HTMLButtonElement>('[data-history="redo"]')!.click(); await ticks();
  held.shift()!(); await ticks(10);
  assert.deepEqual(steps, ["history.undo", "history.redo", "history.undo", "history.redo"]);
  assert.ok(column("first")); assert.equal(column("second"), null, "Redo's result shows, not the older Undo's");
  assert.deepEqual(heldState(), [false, null]);
  await browser.happyDOM.close();
});
