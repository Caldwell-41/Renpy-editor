import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { CoreOperation, CoreResponse } from "../src/protocol.js";
import { sceneBodies } from "./story-controls-fixture.js";

// Runs the shell in its own file so main.ts module state starts fresh.
const ticks = async (count = 6): Promise<void> => { for (let index = 0; index < count; index += 1) await new Promise(resolve => setTimeout(resolve, 0)); };
const click = (label: string): void => {
  const target = [...document.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === label);
  assert.ok(target, `missing button ${label}`); target.click();
};

test("closing the project asks before discarding Story beat drafts", async () => {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<div id="app"></div>';
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, HTMLTextAreaElement: browser.HTMLTextAreaElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  const project = { sessionId: "close-session", projectId: "close-project", title: "Close Project", folderName: "close-project", chapterId: "chapter", chapterName: "Chapter", sceneId: "scene", sceneName: "Scene", sdkVersion: "8.5.3", resolution: { width: 1280, height: 720 } };
  const scene = {
    projectRevision: "1".repeat(64), sourceMapRevision: "2".repeat(64), entrySceneId: "scene",
    lastOpen: { chapterId: "chapter", sceneId: "scene" },
    chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "scene", chapterId: "chapter", displayName: "Scene", technicalLabel: "scene", sourcePath: "game/scene.rpy", sourceRevision: "3".repeat(64), sourceConflict: false, partial: false,
      ...(beats => ({ beats, bodies: sceneBodies(beats) }))([{ id: "line", byteStart: 15, byteEnd: 30, protected: false, payload: { type: "narration" as const, text: "Hello" } }]) }],
    authoring: { characters: [], appearances: [], assets: [], variables: [] },
  };
  let closes = 0, writes = 0;
  const request = async <T>(operation: CoreOperation): Promise<CoreResponse<T>> => {
    let value: unknown = {};
    if (operation === "project.listRecent") value = [];
    else if (operation === "project.openPicker") value = project;
    else if (operation === "project.status") value = "saved";
    else if (operation === "project.close") { closes += 1; value = null; }
    else if (operation === "source.list") value = { files: [], dirtyCount: 0, draftBytes: 0 };
    else if (operation === "scene.list") value = scene;
    else if (operation === "scene.apply") writes += 1;
    return { protocolVersion: 1, requestId: "test", ok: true, value: value as T };
  };
  const answers: boolean[] = [];
  window.confirm = (() => answers.shift() ?? false) as typeof window.confirm;

  const { startApplication } = await import("../src/main.js");
  startApplication(request);
  await ticks(); click("Open Loomlight Project"); await ticks();
  document.querySelector<HTMLButtonElement>('[data-beat-id="line"] .beat-select')!.click();
  const text = document.querySelector<HTMLTextAreaElement>('[data-beat-id="line"] textarea')!;
  text.value = "Unsaved line"; text.dispatchEvent(new window.Event("input", { bubbles: true })); await ticks();
  assert.match(document.querySelector("#app-status")!.textContent!, /Unsaved changes/);

  answers.push(false); click("Close Project"); await ticks();
  assert.equal(closes, 0); assert.ok(text.isConnected); assert.equal(text.value, "Unsaved line");

  answers.push(true); click("Close Project"); await ticks(10);
  assert.equal(closes, 1); assert.equal(writes, 0);
  await browser.happyDOM.close();
});
