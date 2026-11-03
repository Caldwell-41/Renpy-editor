import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { renderSceneAuthoring, type SceneActions, type SceneCommand, type SceneWorkspace } from "../src/scene-ui.js";
import type { ResolvedScreenTarget, ScreenCatalog, ScreenTargetBinding } from "../src/screen-contracts.js";
import { storyFixture } from "./story-controls-fixture.js";

const binding: ScreenTargetBinding = { screenId: "panel-id", sourceName: "help_panel" };
const revisions = { source: "panel-source", sourceMap: "map", inventory: "inventory", effects: "effect" };
const target: ResolvedScreenTarget = { binding, kind: "panel", path: "game/ui/help.rpy", rootId: "root", revisions, effects: { revision: "effect", unknown: true, hiddenScreens: ["panel-id"], dependencies: [] } };
const catalog: ScreenCatalog = { projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory", owned: [
  { id: "component-id", name: "guide", path: "game/ui/guide.rpy", rootId: "component-root", kind: "component", resolved: true, sourceRevision: "component-source" },
  { id: "missing-id", name: "missing", path: "game/ui/missing.rpy", rootId: "missing-root", kind: "panel", resolved: false, sourceRevision: null },
  { id: binding.screenId, name: binding.sourceName, path: target.path, rootId: target.rootId, kind: "panel", resolved: true, sourceRevision: revisions.source },
] };
const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
function button(host: ParentNode, text: string) { const result = [...host.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === text); assert.ok(result, text); return result; }
function fixture(): SceneWorkspace { const base = storyFixture(); return { ...base, scenes: [{ ...base.scenes[0]!, beats: [
  { id: "line", byteStart: 20, byteEnd: 40, protected: false, payload: { type: "narration", text: "The tram moves." } },
  { id: "end", byteStart: 40, byteEnd: 51, protected: false, payload: { type: "return" } },
] }] }; }
function setup(overrides: Partial<SceneActions> = {}, model = fixture()) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>'; const host = document.querySelector<HTMLElement>("main")!;
  const commands: SceneCommand[] = [], resolutions: ScreenTargetBinding[] = [], messages: string[] = [];
  const dispose = renderSceneAuthoring(host, document.querySelector("aside")!, model, {
    resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, status: value => messages.push(value),
    apply: async command => { commands.push(command); throw Error("STALE_SCREEN_REVISION"); },
    screenCatalog: async () => catalog, resolveScreenTarget: async value => { resolutions.push(value); return structuredClone(target); }, ...overrides,
  });
  return { host, commands, resolutions, messages, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function openNew(host: HTMLElement, type: string) {
  button(host, "Add Beat").click();
  const panel = host.querySelector<HTMLElement>(".new-beat")!;
  const select = panel.querySelector<HTMLSelectElement>("select")!; select.value = type; select.dispatchEvent(new Event("change", { bubbles: true })); return panel;
}

test("Story Show picker resolves only owned Panels and retains captured revisions after a refused Apply", async () => {
  const s = setup(); const panel = openNew(s.host, "showScreen"); await tick();
  const picker = panel.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  assert.ok(picker); assert.deepEqual([...picker.options].map(item => item.value), [binding.screenId]);
  assert.deepEqual(s.resolutions, [binding]);
  assert.match(panel.textContent!, /dialogue continues/);
  button(panel, "Add Beat").click(); await tick(); button(panel, "Add Beat").click(); await tick();
  assert.equal(s.commands.length, 2);
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  assert.deepEqual(s.commands[1], s.commands[0]); assert.equal(s.resolutions.length, 1);
  assert.equal(picker.value, binding.screenId); assert.ok(panel.isConnected); assert.match(s.messages.at(-1)!, /Input retained/);
  await s.close();
});

test("editor Escape cancels a new Hide operation without sending a game action or Beat write", async () => {
  const s = setup(); const panel = openNew(s.host, "hideScreen"); await tick();
  panel.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(panel.isConnected, false); assert.equal(s.commands.length, 0);
  await s.close();
});

test("renamed hint retains its original intent until the author explicitly selects the current Panel", async () => {
  const renamed = { ...catalog, owned: catalog.owned.map(screen => screen.id === binding.screenId ? { ...screen, name: "renamed_help" } : screen) };
  const s = setup({ screenHint: binding, screenCatalog: async () => renamed, resolveScreenTarget: async value => ({ ...target, binding: value }) });
  assert.equal(s.commands.length, 0); assert.equal(s.host.querySelector(".new-beat"), null);
  const panel = openNew(s.host, "hideScreen"); await tick();
  const picker = panel.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  assert.match(picker.selectedOptions[0]!.textContent!, /help_panel.*Unavailable/);
  button(panel, "Add Beat").click(); await tick(); assert.equal(s.commands.length, 0);
  picker.value = binding.screenId; picker.dispatchEvent(new Event("change", { bubbles: true })); await tick();
  button(panel, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "hideScreen", target: { ...binding, sourceName: "renamed_help" }, revisions });
  await s.close();
});

test("existing screen Beats keep exact Source navigation, conservative effects and editor cancellation", async () => {
  const base = fixture(), sourceCalls: unknown[][] = [];
  const screenBeat = { id: "show", byteStart: 40, byteEnd: 67, protected: false, screenEffects: target.effects, payload: { type: "showScreen" as const, target: binding, revisions } };
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [base.scenes[0]!.beats[0]!, screenBeat, { ...base.scenes[0]!.beats[1]!, byteStart: 67, byteEnd: 78 }] }] };
  const s = setup({ viewSource: (...args) => { sourceCalls.push(args); } }, model);
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="show"] .beat-select')!.click(); await tick();
  const editor = s.host.querySelector<HTMLElement>('[data-beat-type="showScreen"]')!;
  assert.match(editor.textContent!, /Effects unknown/);
  assert.equal(s.resolutions.length, 0, "workspace revisions must not be refreshed by opening the row");
  button(s.host, "View in Source").click(); assert.deepEqual(sourceCalls, [[model.scenes[0]!.sourcePath, 40, 67, "source"]]);
  editor.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  assert.equal(editor.isConnected, false); assert.equal(s.commands.length, 0);
  await s.close();
});

test("unresolved typed Beat stays protected even when a different Panel has the same source name", async () => {
  const base = fixture(); const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    { id: "unresolved", byteStart: 20, byteEnd: 47, protected: true, payload: { type: "showScreen", target: { screenId: "deleted-panel", sourceName: "help_panel" } } }, base.scenes[0]!.beats[1]!,
  ] }] };
  const s = setup({}, model); s.host.querySelector<HTMLButtonElement>('[data-beat-id="unresolved"] .beat-select')!.click(); await tick();
  assert.equal(s.host.querySelector('[aria-label="Panel screen"]'), null); assert.equal(s.resolutions.length, 0); assert.equal(s.commands.length, 0);
  assert.match(s.host.querySelector('[data-beat-id="unresolved"]')!.textContent!, /Protected source/);
  await s.close();
});

test("late target resolution cannot replace the author's newer explicit Panel selection", async () => {
  let finish!: (value: ResolvedScreenTarget) => void;
  const nextBinding = { screenId: "about-panel", sourceName: "about" };
  const nextTarget = { ...target, binding: nextBinding, revisions: { ...revisions, source: "about-source" } };
  const s = setup({ screenCatalog: async () => ({ ...catalog, owned: [...catalog.owned, { ...catalog.owned[2]!, id: nextBinding.screenId, name: nextBinding.sourceName }] }),
    resolveScreenTarget: async value => value.screenId === binding.screenId ? new Promise(resolve => { finish = resolve; }) : nextTarget });
  const draft = openNew(s.host, "showScreen"); await tick();
  const picker = draft.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!;
  picker.value = nextBinding.screenId; picker.dispatchEvent(new Event("change", { bubbles: true })); await tick();
  finish(target); await tick(); button(draft, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: nextBinding, revisions: nextTarget.revisions });
  await s.close();
});

test("a new screen draft captures the navigation hint before the asynchronous catalog read", async () => {
  const hint = { ...binding }; let finish!: (value: ScreenCatalog) => void;
  const s = setup({ screenHint: hint, screenCatalog: async () => new Promise(resolve => { finish = resolve; }) });
  const draft = openNew(s.host, "showScreen"); hint.sourceName = "different_name"; finish(catalog); await tick();
  button(draft, "Add Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  await s.close();
});

test("existing Show draft captures its workspace revisions before catalog refresh settles", async () => {
  const supplied = { ...revisions }, base = fixture(); let finish!: (value: ScreenCatalog) => void;
  const model: SceneWorkspace = { ...base, scenes: [{ ...base.scenes[0]!, beats: [
    { id: "show", byteStart: 20, byteEnd: 47, protected: false, payload: { type: "showScreen", target: binding, revisions: supplied } }, base.scenes[0]!.beats[1]!,
  ] }] };
  const s = setup({ screenCatalog: async () => new Promise(resolve => { finish = resolve; }) }, model);
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="show"] .beat-select')!.click(); supplied.source = "newer-revision"; finish(catalog); await tick();
  button(s.host.querySelector('[data-beat-type="showScreen"]')!, "Commit Beat").click(); await tick();
  assert.deepEqual(s.commands[0]!.beat, { type: "showScreen", target: binding, revisions });
  await s.close();
});

test("Use in Story offers an explicit screen Beat action with the selected panel hint", async () => {
  const s = setup({screenHint:{...binding}});
  try {
    button(s.host,"Add screen Beat").click();await tick();
    const draft=s.host.querySelector<HTMLElement>(".new-beat")!;
    assert.equal(draft.querySelector<HTMLSelectElement>("select")!.value,"showScreen");
    assert.equal(draft.querySelector<HTMLSelectElement>('[aria-label="Panel screen"]')!.value,binding.screenId);
    assert.deepEqual(s.commands,[]);
  } finally {await s.close();}
});
