// Retained closeout diagnostic; scenarios are also in the normal Scene regression suite.
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import {
  deriveScenePreview,
  hasSceneDraft,
  renderRecoverySurface,
  renderSceneAuthoring,
  type RecoveryReport,
  type SceneCommand,
  type SceneWorkspace,
} from "../../src/scene-ui.ts";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } { let resolve!: (value: T) => void; const promise = new Promise<T>((accept) => { resolve = accept; }); return { promise, resolve }; }

function installDom(): Window {
  const browser = new Window({ url: "http://tauri.localhost" });
  browser.document.body.innerHTML = '<aside id="tree"></aside><main id="host"></main><div id="status"></div>';
  Object.assign(globalThis, {
    window: browser,
    document: browser.document,
    HTMLElement: browser.HTMLElement,
    HTMLInputElement: browser.HTMLInputElement,
    HTMLSelectElement: browser.HTMLSelectElement,
    Event: browser.Event,
    KeyboardEvent: browser.KeyboardEvent,
  });
  return browser;
}

function click(label: string): void {
  const target = [...document.querySelectorAll("button")].find((item) => item.textContent === label);
  assert.ok(target, `missing button ${label}`); target.click();
}

function sceneModel(): SceneWorkspace {
  return {
    projectRevision: "1".repeat(64), sourceMapRevision: "2".repeat(64), entrySceneId: "scene-one",
    lastOpen: { chapterId: "chapter-one", sceneId: "scene-one" }, canUndo: false, canRedo: false,
    chapters: [
      { id: "chapter-one", displayName: "Opening", directory: "game/chapters/chapter_01" },
      { id: "chapter-two", displayName: "Branches", directory: "game/chapters/chapter_02" },
    ],
    scenes: [
      {
        id: "scene-one", chapterId: "chapter-one", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/chapters/chapter_01/scene_001.rpy", sourceRevision: "3".repeat(64), sourceConflict: false, partial: false,
        beats: [
          { id: "dialogue", byteStart: 15, byteEnd: 35, protected: false, payload: { type: "dialogue", characterId: "alice", text: "Hello" } },
          { id: "choice", byteStart: 35, byteEnd: 80, protected: false, payload: { type: "choice", options: [{ text: "Go", destinationSceneId: "scene-two" }] } },
          { id: "return", byteStart: 80, byteEnd: 91, protected: false, payload: { type: "return" } },
        ],
      },
      { id: "scene-two", chapterId: "chapter-two", displayName: "Garden", technicalLabel: "garden", sourcePath: "game/chapters/chapter_02/scene_001.rpy", sourceRevision: "4".repeat(64), sourceConflict: false, partial: false, beats: [{ id: "return-two", byteStart: 14, byteEnd: 25, protected: false, payload: { type: "return" } }] },
    ],
    authoring: {
      characters: [{ id: "alice", displayName: "Alice", technicalName: "alice" }],
      appearances: [{ id: "alice-happy", characterId: "alice", label: "happy", assetId: "appearance" }],
      assets: [
        { id: "bg", kind: "background", displayName: "Cafe", status: "available" },
        { id: "appearance", kind: "characterAppearance", displayName: "Alice Happy", status: "available" },
        { id: "music", kind: "music", displayName: "Theme", status: "available" },
        { id: "sfx", kind: "sfx", displayName: "Bell", status: "available" },
      ],
      variables: [{ id: "score", technicalName: "score", variableType: "int", defaultValue: "0" }],
    },
  };
}

test("closeout: Background clears previously visible Characters", () => {
  const scene = sceneModel().scenes[0]!;
  const actual = deriveScenePreview({ ...scene, beats: [
    { id: "show", byteStart: 0, byteEnd: 10, protected: false, payload: { type: "showCharacter", characterId: "alice", appearanceId: "alice-happy", placement: "left", transition: "none" } },
    { id: "bg", byteStart: 10, byteEnd: 20, protected: false, payload: { type: "background", assetId: "bg", transition: "none" } },
  ] }, "bg");
  assert.equal(actual.characters.length, 0);
});
test("closeout: Add change here retains selected Beat anchor", async () => {
  installDom(); const base = sceneModel(); const calls: SceneCommand[] = [];
  const first = base.scenes[0]!;
  const model = { ...base, scenes: [{ ...first, beats: [
    { id: "show", byteStart: 0, byteEnd: 10, protected: false, payload: { type: "showCharacter", characterId: "alice", appearanceId: "alice-happy", placement: "left", transition: "none" } as const },
    ...first.beats,
  ] }, base.scenes[1]!] };
  renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status: () => {}, resolution: { width: 1920, height: 1080 },
    present: async (assetId, purpose) => ({ assetId, purpose, mimeType: "image/png", dataBase64: "", sha256: "a", byteCount: 24, width: 1, height: 1, cacheKey: `${assetId}:a` }),
    apply: async (command) => { calls.push(command); return model; },
  });
  [...document.querySelectorAll("button")].find(item => item.textContent?.startsWith("2. Dialogue"))!.click();
  click("Add change here"); document.querySelector<HTMLButtonElement>(".new-beat .button.primary")!.click(); await tick();
  assert.equal(calls.at(-1)?.beforeBeatId, "dialogue");
});
