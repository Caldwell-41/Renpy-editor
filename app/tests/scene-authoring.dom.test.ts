import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";
import {
  deriveScenePreview,
  hasSceneDraft,
  renderRecoverySurface,
  renderSceneAuthoring,
  settleSceneDraft,
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

function foundationModel(): SceneWorkspace {
  const base = sceneModel();
  const group = { groupId: "group", variableId: "flag", otherwise: false };
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    { id:"if", byteStart:15, byteEnd:28, protected:true, conditionalBranch:group, payload:{type:"customCode",source:"    if flag:",reason:"Protected source"} },
    { id:"child", byteStart:28, byteEnd:60, protected:false, owner:{groupId:"group",branchId:"if"}, payload:{type:"dialogue",characterId:"alice",text:"True café 雪"} },
    { id:"else", byteStart:60, byteEnd:70, protected:true, conditionalBranch:{...group,otherwise:true}, payload:{type:"customCode",source:"    else:",reason:"Protected source"} },
    { id:"other", byteStart:70, byteEnd:100, protected:false, owner:{groupId:"group",branchId:"else"}, payload:{type:"dialogue",characterId:"alice",text:"False café 雪"} },
    { id:"return",byteStart:100,byteEnd:111,protected:false,payload:{type:"return"} },
  ] }], authoring:{...base.authoring,variables:[{id:"flag",technicalName:"flag",variableType:"bool",defaultValue:true}]} };
  return model;
}

test("nested child commits carry owner and retain input on stale/session refusal", async () => {
  const browser = installDom(); const model = foundationModel();
  const calls: SceneCommand[] = [];
  const dispose = renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
    status:()=>{}, resolution:{width:1280,height:720}, present:async()=>{throw Error("unexpected media")},
    apply:async command=>{ calls.push(command); throw Error(calls.length===1 ? "SOURCE_CONFLICT" : "STALE_SESSION"); },
  });
  let card = document.querySelector<HTMLElement>('[data-beat-id="child"]')!;
  assert.ok(card.classList.contains("nested-dialogue"));
  assert.equal(document.querySelectorAll(".conditional-branch").length, 2);
  assert.ok([...card.querySelectorAll<HTMLButtonElement>(".beat-controls button,.beat-grip")].every(b=>b.disabled));
  card.querySelector<HTMLButtonElement>(".beat-select")!.click();
  card = document.querySelector<HTMLElement>('[data-beat-id="child"]')!;
  const text = card.querySelector<HTMLTextAreaElement>("textarea")!;
  assert.ok(card.querySelector<HTMLSelectElement>("select")!.disabled);
  text.value = "Retained café 雪"; text.dispatchEvent(new Event("input",{bubbles:true}));
  for (let n=0;n<2;n++) {
    // Shift+Enter remains a text-only child edit; it cannot create another child.
    text.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",ctrlKey:true,shiftKey:true,bubbles:true,cancelable:true}));
    await tick();
    assert.equal(calls[n]!.type,"updateChildDialogue");
    assert.deepEqual(calls[n]!.expectedOwner,{groupId:"group",branchId:"if"});
    assert.equal(calls[n]!.text,"Retained café 雪");
    assert.equal(calls[n]!.expectedSourceRevision,model.scenes[0]!.sourceRevision);
    assert.equal(text.value,"Retained café 雪"); assert.ok(text.isConnected && hasSceneDraft(document.querySelector("#host")!));
    assert.ok(!text.disabled && card.querySelector<HTMLSelectElement>("select")!.disabled);
  }
  const preview = deriveScenePreview(model.scenes[0]!);
  assert.equal(preview.partial,true); assert.equal(preview.variablesUnknown,true);
  assert.notEqual(preview.overlay?.text,"False café 雪","outline must not execute both branches");
  dispose(); browser.happyDOM.abort();
});

test("root controls respect nested children and conditional insertion boundaries", async () => {
  const browser = installDom();
  const base = foundationModel();
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    ...base.scenes[0]!.beats.slice(0, 2),
    { id: "if-trivia", byteStart: 60, byteEnd: 65, protected: true, payload: { type: "customCode", source: "        # before Otherwise", reason: "Protected" } },
    { ...base.scenes[0]!.beats[2]!, byteStart: 65, byteEnd: 75 },
    { id: "else-trivia", byteStart: 75, byteEnd: 80, protected: true, payload: { type: "customCode", source: "        # before child", reason: "Protected" } },
    { ...base.scenes[0]!.beats[3]!, byteStart: 80 },
    { id: "root-one", byteStart: 100, byteEnd: 120, protected: false, payload: { type: "dialogue", characterId: "alice", text: "Root one" } },
    { id: "root-two", byteStart: 120, byteEnd: 140, protected: false, payload: { type: "dialogue", characterId: "alice", text: "Root two" } },
    { ...base.scenes[0]!.beats[4]!, byteStart: 140, byteEnd: 151 },
  ] }] };
  const host = document.querySelector<HTMLElement>("#host")!;
  const calls: SceneCommand[] = [];
  const dispose = renderSceneAuthoring(host, document.querySelector("#tree")!, model, {
    status: () => {}, resolution: { width: 1280, height: 720 }, present: async () => { throw Error("unused"); },
    apply: async command => { calls.push(command); return model; },
  });
  try {
    const root = host.querySelector<HTMLElement>('[data-beat-id="root-one"]')!;
    const controls = root.querySelectorAll<HTMLButtonElement>(".beat-controls button");
    assert.equal(controls[0]!.disabled, true, "root cannot move above an Otherwise child");
    assert.equal(controls[1]!.disabled, false, "root-to-root move stays available");
    const grip = root.querySelector<HTMLButtonElement>(".beat-grip")!;
    const child = host.querySelector<HTMLElement>('[data-beat-id="other"]')!;
    document.elementFromPoint = () => child;
    const pointer = (type: string, x: number): Event => new browser.PointerEvent(type, { button: 0, pointerId: 1, clientX: x, clientY: 20, bubbles: true }) as unknown as Event;
    grip.dispatchEvent(pointer("pointerdown", 10));
    window.dispatchEvent(pointer("pointermove", 30));
    assert.equal(child.classList.contains("drop-before"), false);
    window.dispatchEvent(pointer("pointerup", 30));
    await tick();
    assert.equal(calls.length, 0, "root drag must not cross a child");
    for (const id of ["else", "child", "if-trivia", "else-trivia"]) {
      host.querySelector<HTMLButtonElement>(`[data-beat-id="${id}"] .beat-select`)!.click();
      const additions = host.querySelectorAll<HTMLButtonElement>(".provenance-row button:last-child");
      assert.ok(additions.length > 0);
      assert.ok([...additions].every(button => button.disabled), "Add change here cannot insert inside a branch");
      assert.equal(host.querySelector(".new-beat"), null);
      host.querySelector<HTMLButtonElement>(`[data-beat-id="${id}"] .beat-select`)!.click();
    }
    host.querySelector<HTMLButtonElement>('[data-beat-id="if"] .beat-select')!.click();
    const safeAdd = host.querySelector<HTMLButtonElement>(".provenance-row button:last-child")!;
    assert.equal(safeAdd.disabled, false, "insertion before the whole group is safe");
    safeAdd.click();
    assert.ok(host.querySelector(".new-beat"));
    assert.equal(calls.length, 0);
    host.querySelector<HTMLButtonElement>(".new-beat .text-button")!.click();
    host.querySelector<HTMLButtonElement>('[data-beat-id="root-one"] .beat-select')!.click();
    assert.equal(host.querySelector<HTMLButtonElement>(".provenance-row button:last-child")!.disabled, false, "insertion after the group stays available");
  } finally { dispose(); await browser.happyDOM.close(); }
});

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
  textarea.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, shiftKey:true, bubbles: true }));
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

test("simultaneous Story preview and thumbnail keep their displayed URLs alive", async () => {
  installDom();
  const base = sceneModel();
  const first = base.scenes[0]!;
  const model = { ...base, scenes: [{ ...first, beats: [
    { id: "background", byteStart: 0, byteEnd: 10, protected: false, payload: { type: "background" as const, assetId: "bg", transition: "none" as const } },
    ...first.beats,
  ] }, base.scenes[1]!] };
  const revoked = new Set<string>();
  const originalRevoke = URL.revokeObjectURL;
  URL.revokeObjectURL = (url: string) => { revoked.add(url); originalRevoke(url); };
  let dispose: (() => void) | undefined;
  try {
    dispose = renderSceneAuthoring(document.querySelector("#host")!, document.querySelector("#tree")!, model, {
      status: () => {}, resolution: { width: 1280, height: 720 }, apply: async () => model,
      present: async (assetId, purpose) => ({ assetId, purpose, mimeType: "image/png", dataBase64: "", sha256: "hash", byteCount: 1, width: 1, height: 1, cacheKey: `${assetId}:hash` }),
    });
    await tick();
    const images = [...document.querySelectorAll<HTMLImageElement>(".preview-background, .asset-thumbnail img")];
    assert.equal(images.length, 2);
    for (const image of images) {
      assert.ok(image.src.startsWith("blob:"));
      assert.equal(revoked.has(image.src), false, "a currently displayed image URL was revoked");
    }
    dispose(); dispose = undefined;
    for (const image of images) assert.equal(revoked.has(image.src), true, "view disposal must release its image URLs");
  } finally { dispose?.(); URL.revokeObjectURL = originalRevoke; }
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


test("dialogue navigation protects IME and shares one pending commit",async()=>{
 const browser=installDom();const host=document.querySelector<HTMLElement>("#host")!;host.className="scene-workspace";
 const original=sceneModel();const pending=deferred<SceneWorkspace>();let calls=0;
 const dispose=renderSceneAuthoring(host,document.querySelector("#tree")!,original,{status:()=>{},resolution:{width:1920,height:1080},present:async()=>{throw Error("unused");},apply:async()=>{calls++;return pending.promise;}});
 host.querySelector<HTMLButtonElement>(".beat-select")!.click();const text=host.querySelector("textarea")!;text.value="Kept through navigation";text.dispatchEvent(new window.Event("input",{bubbles:true}));
 text.dispatchEvent(new window.Event("compositionstart"));assert.equal(await settleSceneDraft(host),false);assert.equal(calls,0);
 text.dispatchEvent(new window.Event("compositionend"));const a=settleSceneDraft(host),b=settleSceneDraft(host);assert.equal(calls,1);assert.equal(text.disabled,true);
 pending.resolve({...original,scenes:original.scenes.map((scene,i)=>i?scene:{...scene,beats:scene.beats.map((beat,j)=>j?beat:{...beat,payload:{type:"dialogue",characterId:"alice",text:"Kept through navigation"}})})});
 assert.deepEqual(await Promise.all([a,b]),[true,true]);assert.equal(calls,1);assert.match(host.textContent!,/Kept through navigation/);dispose();await browser.happyDOM.close();
});


test("adding a Beat saves once and returns a collapsed row without a second commit",async()=>{
 const browser=installDom();let model=sceneModel();let calls=0;
 const dispose=renderSceneAuthoring(document.querySelector('#host')!,document.querySelector('#tree')!,model,{status:()=>{},resolution:{width:1920,height:1080},present:async(assetId,purpose)=>({assetId,purpose,mimeType:'image/png',dataBase64:'',sha256:'a',byteCount:1,cacheKey:'a'}),apply:async command=>{
  assert.equal(command.type,'insertBeat');calls++;const scene=model.scenes[0]!;model={...model,scenes:[{...scene,beats:[...scene.beats,{id:'new',byteStart:100,byteEnd:120,protected:false,payload:{type:'narration',text:'New text'}}]},model.scenes[1]!]};return model;
 }});
 click('Add Beat');const type=document.querySelector<HTMLSelectElement>('.new-beat select')!;type.value='narration';type.dispatchEvent(new window.Event('change',{bubbles:true}));
 const text=document.querySelector<HTMLTextAreaElement>('.new-beat textarea')!;text.value='New text';text.dispatchEvent(new window.Event('input',{bubbles:true}));
 [...document.querySelectorAll<HTMLButtonElement>('.new-beat button')].find(b=>b.textContent==='Add Beat')!.click();await tick();
 assert.equal(calls,1);assert.equal(document.querySelector('.new-beat'),null);assert.equal(document.querySelector('.expanded-beat'),null);assert.ok([...document.querySelectorAll('.beat-select')].some(b=>b.textContent?.includes('New text')));
 dispose();await browser.happyDOM.close();
});

test("new Beat waits for its receipt, restores failure input, and focuses the saved row",async()=>{
 const browser=installDom();const host=document.querySelector<HTMLElement>('#host')!;const model=sceneModel();const receipt=deferred<SceneWorkspace>();let calls=0,fail=true;let status='';
 const dispose=renderSceneAuthoring(host,document.querySelector('#tree')!,model,{status:text=>status=text,resolution:{width:1920,height:1080},present:async()=>{throw Error('unused');},apply:async()=>{calls++;if(fail)throw Error('Source changed');return receipt.promise;}});
 click('Add Beat');const form=host.querySelector<HTMLElement>('.new-beat')!;const type=form.querySelector<HTMLSelectElement>('select')!;type.value='narration';type.dispatchEvent(new window.Event('change',{bubbles:true}));const text=form.querySelector<HTMLTextAreaElement>('textarea')!;text.value='Keep this text';text.dispatchEvent(new window.Event('input',{bubbles:true}));
 const confirm=[...form.querySelectorAll('button')].find(b=>b.textContent==='Add Beat')!;const cancel=[...form.querySelectorAll('button')].find(b=>b.textContent==='Cancel')!;
 confirm.click();await tick();assert.equal(status,'Source changed');assert.equal(confirm.disabled,false);assert.equal(text.value,'Keep this text');
 fail=false;confirm.click();confirm.click();cancel.click();assert.equal(calls,2);assert.equal(confirm.disabled,true);assert.equal(cancel.disabled,true);assert.equal(form.isConnected,true);
 const next=structuredClone(model);const beats=[...next.scenes[0]!.beats];beats.splice(1,0,{id:'added',byteStart:35,byteEnd:40,protected:false,payload:{type:'narration',text:'Keep this text'}});receipt.resolve({...next,scenes:next.scenes.map((scene,i)=>i?scene:{...scene,beats})});await tick();
 const row=host.querySelector<HTMLElement>('[data-beat-id="added"]')!;assert.ok(row);assert.equal(document.activeElement,row.querySelector('.beat-select'));assert.equal(row.querySelector('.expanded-beat'),null);assert.equal(host.querySelector('.new-beat'),null);assert.equal(status,'Saved');dispose();await browser.happyDOM.close();
});

test("held Beat drag scrolls the visible writing panel edges and stops on cancellation", async () => {
  const browser = installDom();
  const host = document.querySelector<HTMLElement>("#host")!;
  let writes = 0;
  const frames = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  window.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
  window.cancelAnimationFrame = id => { frames.delete(id); };
  const dispose = renderSceneAuthoring(host, document.querySelector("#tree")!, sceneModel(), {
    status: () => {}, resolution: { width: 1920, height: 1080 },
    present: async () => { throw Error("unused"); }, apply: async () => { writes++; return sceneModel(); },
  });
  try {
    const panel = host.querySelector<HTMLElement>(".beats-region")!;
    const list = host.querySelector<HTMLElement>(".beats-list")!;
    const toolbar = host.querySelector<HTMLElement>(".beats-toolbar")!;
    const grip = host.querySelector<HTMLButtonElement>(".beat-grip")!;
    const bounds = (top: number, bottom: number): DOMRect => ({ left: 0, right: 300, top, bottom, x: 0, y: top, width: 300, height: bottom - top, toJSON: () => ({}) });
    panel.getBoundingClientRect = () => bounds(100, 400);
    toolbar.getBoundingClientRect = () => bounds(100, 160);
    list.getBoundingClientRect = () => bounds(160 - panel.scrollTop, 2160 - panel.scrollTop);
    // Shipped CSS scrolls the panel; the full-height inner list cannot scroll.
    Object.defineProperty(list, "scrollTop", { configurable: true, get: () => 0, set: () => {} });
    panel.scrollTop = 150;
    document.elementFromPoint = () => grip.closest(".beat-card");
    const pointer = (type: string, y: number) => new browser.PointerEvent(type, { button: 0, pointerId: 1, clientX: 100, clientY: y, bubbles: true }) as unknown as Event;
    const frame = () => { const [id, callback] = frames.entries().next().value!; frames.delete(id); callback(0); };
    grip.dispatchEvent(pointer("pointerdown", 220));
    window.dispatchEvent(pointer("pointermove", 390));
    frame(); assert.equal(panel.scrollTop, 160, "held pointer at visible bottom must scroll down");
    frame(); assert.equal(panel.scrollTop, 170, "holding still must keep scrolling");
    window.dispatchEvent(pointer("pointermove", 170));
    frame(); assert.equal(panel.scrollTop, 160, "visible top below sticky toolbar must scroll up");
    window.dispatchEvent(pointer("pointermove", 410));
    frame(); assert.equal(panel.scrollTop, 160, "outside panel must not scroll");
    window.dispatchEvent(pointer("pointermove", 140));
    frame(); assert.equal(panel.scrollTop, 160, "sticky toolbar must not count as a list edge");
    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape" }));
    assert.equal(frames.size, 0);
    assert.equal(document.querySelector(".beat-drag-ghost"), null);
    window.dispatchEvent(pointer("pointerup", 170));
    assert.equal(writes, 0);
  } finally { dispose(); await browser.happyDOM.close(); }
});

test("preview reset updates the divider and layout without a hidden slider",async()=>{
 const browser=installDom();const host=document.querySelector<HTMLElement>('#host')!;
 const dispose=renderSceneAuthoring(host,document.querySelector('#tree')!,sceneModel(),{status:()=>{},resolution:{width:1920,height:1080},present:async()=>{throw Error('unused');},apply:async()=>sceneModel()});
 const divider=host.querySelector<HTMLElement>('.preview-divider')!;divider.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));assert.equal(divider.getAttribute('aria-valuenow'),'36');
 window.dispatchEvent(new window.Event('loomlight-reset-layout'));assert.equal(divider.getAttribute('aria-valuenow'),'34');assert.equal(host.querySelector<HTMLElement>('.scene-stack')!.style.getPropertyValue('--preview-share'),'34fr');assert.equal(host.querySelector('input[type="range"]'),null);dispose();await browser.happyDOM.close();
});

test("pointer Beat reorder cancels outside, on Escape and across protected boundaries",async()=>{
 const browser=installDom();const host=document.querySelector<HTMLElement>('#host')!;let model=sceneModel();
 const beats=[...model.scenes[0]!.beats];beats.splice(1,0,{id:'narration',byteStart:35,byteEnd:40,protected:false,payload:{type:'narration',text:'Second'}});beats[2]={...beats[2]!,byteStart:40};model={...model,scenes:model.scenes.map((scene,i)=>i?scene:{...scene,beats})};
 const calls:SceneCommand[]=[];const dispose=renderSceneAuthoring(host,document.querySelector('#tree')!,model,{status:()=>{},resolution:{width:1920,height:1080},present:async()=>{throw Error('unused');},apply:async command=>{calls.push(command);return model;}});
 const grip=host.querySelector<HTMLButtonElement>('.beat-grip')!;const target=host.querySelector<HTMLElement>('[data-beat-id="narration"]')!;
 let hit:Element|null=target;document.elementFromPoint=()=>hit;
 const pointer=(type:string,x:number)=>new browser.PointerEvent(type,{button:0,pointerId:1,clientX:x,clientY:20,bubbles:true}) as unknown as Event;
 grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));assert.ok(target.classList.contains('drop-after'));window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape'}));window.dispatchEvent(pointer('pointerup',30));assert.equal(calls.length,0);assert.equal(document.querySelector('.beat-drag-ghost'),null);
 hit=null;grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));window.dispatchEvent(pointer('pointerup',30));assert.equal(calls.length,0);
 hit=host.querySelector('[data-beat-id="choice"]');grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));window.dispatchEvent(pointer('pointerup',30));assert.equal(calls.length,0);
 hit=target;for(const cancel of ['pointercancel','blur','lostpointercapture']){grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));if(cancel==='lostpointercapture')grip.dispatchEvent(pointer(cancel,30));else window.dispatchEvent(cancel==='blur'?new window.Event('blur'):pointer(cancel,30));window.dispatchEvent(pointer('pointerup',30));assert.equal(calls.length,0);assert.equal(document.querySelector('.beat-drag-ghost'),null);}
 click('Add Beat');const form=host.querySelector<HTMLElement>('.new-beat')!;form.dataset.unsubmitted='true';grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));window.dispatchEvent(pointer('pointerup',30));assert.equal(calls.length,0);[...form.querySelectorAll('button')].find(b=>b.textContent==='Cancel')!.click();
 hit=target;grip.dispatchEvent(pointer('pointerdown',10));window.dispatchEvent(pointer('pointermove',30));window.dispatchEvent(pointer('pointerup',30));await tick();assert.equal(calls.length,1);assert.equal(calls[0]!.type,'reorderBeat');assert.equal(calls[0]!.toIndex,1);assert.equal(grip.draggable,false);dispose();await browser.happyDOM.close();
});


test("shipped source-foundation native driver completes against strict renderer fixture", async () => {
  const browser = installDom();
  let model = foundationModel(), saved = model, draft: string | undefined;
  const original = readFileSync(new URL("../../../tests/fixtures/source-foundation/scene.rpy", import.meta.url), "utf8").replace(/^\uFEFF/, "");
  let text = original, accepted = text, dispose: (()=>void) | undefined;
  let report!: (value: { passed: boolean; error?: string; checks: string[] })=>void;
  const completed = new Promise<{ passed: boolean; error?: string; checks: string[] }>(resolve=>{report=resolve;});
  const dispatch = async (operation: string, payload: Record<string, any> = {}): Promise<any> => {
    switch(operation) {
      case "project.current": return {sessionId:"native-fixture-session"};
      case "scene.list": return model;
      case "source.open": return {text:draft ?? text,hasBom:true,baseRevision:model.scenes[0]!.sourceRevision,dirty:draft!==undefined};
      case "source.updateDraft": draft=payload.text; return {};
      case "source.discard": draft=undefined; return {};
      case "probe.runtimeUiReport": report(payload as {passed:boolean;checks:string[]}); return {};
      case "scene.apply": {
        const command = payload.command as SceneCommand;
        if (command.type === "updateChildDialogue") {
          const child = model.scenes[0]!.beats.find(b=>b.id===command.beatId)!;
          if (JSON.stringify(command.expectedOwner)!==JSON.stringify(child.owner)) throw Object.assign(Error("owner"),{code:"SCENE_INVARIANT"});
          if(draft!==undefined)throw Object.assign(Error("dirty source"),{code:"DIRTY_SOURCE"});
          text = original.replace("True café 雪",command.text as string); accepted=text;
          model={...model,canUndo:true,canRedo:false,sourceMapRevision:"5".repeat(64),scenes:[{...model.scenes[0]!,sourceRevision:"6".repeat(64),beats:model.scenes[0]!.beats.map(b=>b.id===child.id?{...b,payload:{type:"dialogue",characterId:"alice",text:command.text as string}}:b)}]};
          saved=model;
        } else if(command.type==="undo") { text=original;model={...foundationModel(),canRedo:true}; }
        else if(command.type==="redo") { text=accepted;model=saved; }
        else throw Error(`Unexpected command ${command.type}`);
        return model;
      }
      default:throw Error(`Unexpected operation ${operation}`);
    }
  };
  const welcome=():void=>{
    dispose?.();document.querySelector("#native-close")?.remove();document.querySelector("#host")!.replaceChildren();document.querySelector("#tree")!.replaceChildren();
    const recent=document.createElement("button");recent.textContent="Source foundation fixture";document.querySelector("#host")!.append(recent);
    recent.addEventListener("click",()=>{
      dispose=renderSceneAuthoring(document.querySelector("#host")!,document.querySelector("#tree")!,model,{
        status:message=>{document.querySelector("#app-status")!.textContent=message;},resolution:{width:1280,height:720},present:async()=>{throw Error("unexpected media");},
        apply:(command,expected)=>dispatch("scene.apply",{...expected,command}),
      });
      const close=document.createElement("button");close.id="native-close";close.textContent="Close Project";close.addEventListener("click",welcome);document.body.append(close);
    });
  };
  document.querySelector("#status")!.id="app-status";
  Object.assign(browser, {
    __TAURI_INTERNALS__: {
      invoke: async (_name: string, args: any) => {
        try { return { ok: true, value: await dispatch(args.request.operation, args.request.payload) }; }
        catch (error) { return { ok: false, error: { code: (error as {code?: string}).code ?? "UNEXPECTED" } }; }
      },
    },
  });
  welcome();
  browser.eval(readFileSync(new URL("../../src-tauri/src/native_editor_probe.js",import.meta.url),"utf8"));
  browser.eval(readFileSync(new URL("../../src-tauri/src/source_foundation_probe.js",import.meta.url),"utf8"));
  const result=await completed;
  assert.equal(result.passed,true,JSON.stringify(result));assert.ok(result.checks.length>=10);
  dispose?.();browser.happyDOM.abort();
});
