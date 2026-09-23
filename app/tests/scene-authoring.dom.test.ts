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
} from "../src/scene-ui.js";

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

test("Scene authoring exposes hierarchy, every Beat, natural dialogue continuation, and Create New Scene", async () => {
  const browser = installDom(); let model = sceneModel(); const calls: SceneCommand[] = []; let status = "";
  renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status: (message) => { status = message; },
    resolution: { width: 1920, height: 1080 },
    present: async (assetId, purpose) => ({ assetId, purpose, mimeType: "image/png", dataBase64: "", sha256: "a", byteCount: 24, width: 1, height: 1, cacheKey: `${assetId}:a` }),
    apply: async (command, expected) => {
      assert.equal(expected.projectRevision, model.projectRevision); calls.push(command);
      if (command.type === "continueDialogue") {
        const first = model.scenes[0]!;
        model = { ...model, projectRevision: "5".repeat(64), sourceMapRevision: "6".repeat(64), canUndo: true, scenes: [{ ...first, sourceRevision: "7".repeat(64), beats: [
          { ...first.beats[0]!, payload: { type: "dialogue", characterId: "alice", text: String(command.text) } },
          { id: "dialogue-next", byteStart: 35, byteEnd: 48, protected: false, payload: { type: "dialogue", characterId: "alice", text: "" } },
          ...first.beats.slice(1),
        ] }, model.scenes[1]!] };
      }
      return model;
    },
  });

  assert.match(document.querySelector("#tree")?.textContent ?? "", /Opening/);
  assert.match(document.querySelector("#tree")?.textContent ?? "", /Garden/);
  assert.ok([...document.querySelectorAll("button")].some((item) => item.ariaLabel === "Move chapter Opening down"));
  assert.ok([...document.querySelectorAll("button")].some((item) => item.ariaLabel === "Move scene Arrival down"));

  const dialogue = [...document.querySelectorAll("button")].find((item) => item.textContent?.startsWith("1. Dialogue"));
  assert.ok(dialogue); dialogue.click();
  const textarea = document.querySelector<HTMLTextAreaElement>("textarea"); assert.ok(textarea);
  textarea.value = "First line\nSecond line"; textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
  assert.equal(hasSceneDraft(document), true);
  textarea.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
  await tick();
  assert.equal(calls.at(-1)?.type, "continueDialogue");
  assert.equal(calls.at(-1)?.text, "First line\nSecond line");
  assert.equal(status, "Saved");
  assert.match(document.body.textContent ?? "", /Empty dialogue/);

  click("Add Beat");
  const type = [...document.querySelectorAll("label")].find((item) => item.firstElementChild?.textContent === "Beat type")?.querySelector("select");
  assert.ok(type);
  const options = [...type.options].map((option) => option.textContent);
  for (const label of ["Background", "Show Character", "Hide Character", "Change Appearance", "Placement", "Dialogue", "Narration", "Play Music", "Stop Music", "Play SFX", "Transition", "Set Variable", "Choice", "Jump", "Return / End"]) assert.ok(options.includes(label), label);
  click("Cancel");

  const choice = [...document.querySelectorAll("button")].find((item) => item.textContent?.startsWith("3. Choice"));
  assert.ok(choice); choice.click(); click("Create New Scene");
  const newFields = [...document.querySelectorAll(".choice-new-scene input")];
  assert.equal(newFields.length, 2);
  (newFields[0] as HTMLInputElement).value = "Stay"; (newFields[0] as HTMLInputElement).dispatchEvent(new window.Event("input", { bubbles: true }));
  (newFields[1] as HTMLInputElement).value = "Quiet room"; (newFields[1] as HTMLInputElement).dispatchEvent(new window.Event("input", { bubbles: true }));
  click("Create Scene and option"); await tick();
  assert.equal(calls.at(-1)?.type, "createSceneFromChoice");
  assert.equal(calls.at(-1)?.optionText, "Stay");
});

test("recovery UI offers only proven resolutions and keeps ambiguous transactions blocked", async () => {
  installDom(); const host = document.querySelector<HTMLElement>("#host")!; const calls: string[] = [];
  const report: RecoveryReport = { items: [
    { transactionId: "safe", state: { name: "recoveryRequired" }, mutations: ["stagedWithBaseIntact"], affected: [{ path: "game/scene.rpy", acceptedRetained: true, displacedRetained: true }] },
    { transactionId: "ambiguous", state: { name: "recoveryRequired" }, mutations: ["ambiguous"], affected: [{ path: "game/other.rpy", acceptedRetained: true, displacedRetained: true }] },
  ] };
  renderRecoverySurface(host, report, {
    status: () => {}, completed: () => {},
    resolve: async (id, resolution) => { calls.push(`${id}:${resolution}`); return { items: [] }; },
  });
  assert.match(host.textContent, /game\/scene\.rpy/); assert.match(host.textContent, /accepted copy/i); assert.match(host.textContent, /ambiguous/i);
  assert.equal([...host.querySelectorAll("button")].filter((item) => item.textContent?.includes("project files")).length, 1);
  const checkbox = host.querySelector<HTMLInputElement>("#confirm-safe")!; const resolve = [...host.querySelectorAll("button")].find((item) => item.textContent === "Keep current project files")!;
  assert.equal(resolve.disabled, true); checkbox.click(); assert.equal(resolve.disabled, false); resolve.click(); await tick();
  assert.deepEqual(calls, ["safe:keepCurrent"]);
});

test("failed Beat validation preserves the draft and restores focus", async () => {
  installDom(); const model = sceneModel(); let status = "";
  renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status: (message) => { status = message; },
    resolution: { width: 1920, height: 1080 },
    present: async (assetId, purpose) => ({ assetId, purpose, mimeType: "image/png", dataBase64: "", sha256: "a", byteCount: 24, width: 1, height: 1, cacheKey: `${assetId}:a` }),
    apply: async () => { throw new Error("Source revision changed"); },
  });
  const dialogue = [...document.querySelectorAll("button")].find((item) => item.textContent?.startsWith("1. Dialogue"))!; dialogue.click();
  const textarea = document.querySelector<HTMLTextAreaElement>("textarea")!; textarea.value = "Unsaved words"; textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
  click("Commit Beat"); await tick();
  assert.equal(document.querySelector<HTMLTextAreaElement>("textarea")?.value, "Unsaved words");
  assert.equal(document.activeElement, document.querySelector(".expanded-beat select"));
  assert.equal(status, "Source revision changed");
});

test("preview reconstruction is Beat-local, provenance-aware, and truthful after Custom Code", () => {
  const scene = sceneModel().scenes[0]!;
  const authored = { ...scene, beats: [
    { id: "background", byteStart: 10, byteEnd: 20, protected: false, payload: { type: "background", assetId: "bg", transition: "none" } as const },
    { id: "show", byteStart: 20, byteEnd: 30, protected: false, payload: { type: "showCharacter", characterId: "alice", appearanceId: "alice-happy", placement: "left", transition: "none" } as const },
    { id: "opaque", byteStart: 30, byteEnd: 40, protected: true, payload: { type: "customCode", source: "python:", reason: "Runtime-dependent" } as const },
    { id: "dialogue-after", byteStart: 40, byteEnd: 50, protected: false, payload: { type: "dialogue", characterId: "alice", text: "After" } as const },
  ] };
  const known = deriveScenePreview(authored, "show");
  assert.equal(known.partial, false); assert.equal(known.background?.beatId, "background"); assert.equal(known.characters[0]?.appearanceBeatId, "show");
  const partial = deriveScenePreview(authored, "dialogue-after");
  assert.equal(partial.partial, true); assert.equal(partial.background, undefined); assert.equal(partial.backgroundUnknown, true);
  assert.equal(partial.characters.length, 0); assert.equal(partial.charactersUnknown, true); assert.equal(partial.overlay?.text, "After");
  assert.deepEqual(partial.unknownBeatIds, ["opaque"]);
});

test("preview presents images through the bounded bridge and auditions audio only on request", async () => {
  installDom(); let model = sceneModel(); const first = model.scenes[0]!;
  model = { ...model, scenes: [{ ...first, beats: [
    { id: "bg-beat", byteStart: 10, byteEnd: 20, protected: false, payload: { type: "background", assetId: "bg", transition: "none" } },
    { id: "show-beat", byteStart: 20, byteEnd: 30, protected: false, payload: { type: "showCharacter", characterId: "alice", appearanceId: "alice-happy", placement: "centre", transition: "none" } },
    { id: "music-beat", byteStart: 30, byteEnd: 40, protected: false, payload: { type: "playMusic", assetId: "music" } },
    { id: "line-beat", byteStart: 40, byteEnd: 50, protected: false, payload: { type: "dialogue", characterId: "alice", text: "Preview line" } },
    { id: "end-beat", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "return" } },
  ] }, model.scenes[1]!] };
  const calls: Array<{ assetId: string; purpose: string }> = [];
  renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status: () => {}, resolution: { width: 1280, height: 720 }, apply: async () => model,
    present: async (assetId, purpose) => { calls.push({ assetId, purpose }); return { assetId, purpose, mimeType: purpose === "audioAudition" ? "audio/ogg" : "image/png", dataBase64: "", sha256: "hash", byteCount: 24, width: purpose === "audioAudition" ? undefined : 1, height: purpose === "audioAudition" ? undefined : 1, cacheKey: `${assetId}:hash` }; },
  });
  await tick();
  assert.equal(calls.some((call) => call.purpose === "audioAudition"), false);
  assert.equal(calls.filter((call) => call.assetId === "bg").length, 1);
  assert.equal(calls.filter((call) => call.assetId === "appearance").length, 1);
  assert.match(document.querySelector(".preview-overlay")?.textContent ?? "", /Return \/ End/);
  assert.ok([...document.querySelectorAll("button")].some((item) => item.textContent?.startsWith("Edit Beat")));
  assert.ok([...document.querySelectorAll("button")].some((item) => item.textContent === "Add change here"));
  click("Audition current music"); await tick();
  assert.equal(calls.some((call) => call.assetId === "music" && call.purpose === "audioAudition"), true);
});

test("pending media is cancelled logically and disposed with the project view", async () => {
  installDom(); let model = sceneModel(); const first = model.scenes[0]!;
  model = { ...model, scenes: [{ ...first, beats: [
    { id: "background-only", byteStart: 10, byteEnd: 20, protected: false, payload: { type: "background", assetId: "bg", transition: "none" } },
    { id: "return-only", byteStart: 20, byteEnd: 30, protected: false, payload: { type: "return" } },
  ] }, model.scenes[1]!] };
  const pending = deferred<{ assetId: string; purpose: "thumbnail"; mimeType: string; dataBase64: string; sha256: string; byteCount: number; width: number; height: number; cacheKey: string }>();
  const dispose = renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status: () => {}, resolution: { width: 16, height: 9 }, apply: async () => model,
    present: async () => pending.promise,
  });
  const oldImage = document.querySelector<HTMLImageElement>(".preview-background")!;
  assert.equal(oldImage.src, ""); dispose(); document.querySelector("#host")!.replaceChildren();
  pending.resolve({ assetId: "bg", purpose: "thumbnail", mimeType: "image/png", dataBase64: "iVBORw0KGgo=", sha256: "hash", byteCount: 8, width: 1, height: 1, cacheKey: "bg:hash" });
  await tick();
  assert.equal(oldImage.src, "");
});

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

test("Background resolves default-layer uncertainty after Custom Code without clearing music or variable uncertainty", () => {
  const scene = sceneModel().scenes[0]!;
  const actual = deriveScenePreview({ ...scene, beats: [
    { id: "custom", byteStart: 0, byteEnd: 10, protected: true, payload: { type: "customCode", source: "$ unknown()", reason: "unknown staging" } },
    { id: "show", byteStart: 10, byteEnd: 20, protected: false, payload: { type: "showCharacter", characterId: "alice", appearanceId: "alice-happy", placement: "left", transition: "none" } },
    { id: "bg", byteStart: 20, byteEnd: 30, protected: false, payload: { type: "background", assetId: "bg", transition: "none" } },
  ] }, "bg");
  assert.deepEqual(actual.characters, []);
  assert.equal(actual.charactersUnknown, false);
  assert.equal(actual.backgroundUnknown, false);
  assert.equal(actual.background?.beatId, "bg");
  assert.equal(actual.musicUnknown, true);
  assert.equal(actual.variablesUnknown, true);
  assert.equal(actual.partial, true);
  assert.deepEqual(actual.unknownBeatIds, ["custom"]);
});
