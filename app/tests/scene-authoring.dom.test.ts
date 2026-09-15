import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import {
  hasSceneDraft,
  renderRecoverySurface,
  renderSceneAuthoring,
  type RecoveryReport,
  type SceneCommand,
  type SceneWorkspace,
} from "../src/scene-ui.js";

const tick = async (): Promise<void> => { await new Promise((resolve) => setTimeout(resolve, 0)); };

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
      appearances: [{ id: "alice-happy", characterId: "alice", label: "happy" }],
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
    apply: async () => { throw new Error("Source revision changed"); },
  });
  const dialogue = [...document.querySelectorAll("button")].find((item) => item.textContent?.startsWith("1. Dialogue"))!; dialogue.click();
  const textarea = document.querySelector<HTMLTextAreaElement>("textarea")!; textarea.value = "Unsaved words"; textarea.dispatchEvent(new window.Event("input", { bubbles: true }));
  click("Commit Beat"); await tick();
  assert.equal(document.querySelector<HTMLTextAreaElement>("textarea")?.value, "Unsaved words");
  assert.equal(document.activeElement, document.querySelector(".expanded-beat select"));
  assert.equal(status, "Source revision changed");
});
