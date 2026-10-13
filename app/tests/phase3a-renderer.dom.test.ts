import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";
import { conditionCaption, deriveScenePreview, hasSceneDraft, renderSceneAuthoring, type Condition, type SceneBeat, type SceneWorkspace } from "../src/scene-ui.js";
import { renderBranches, type FlowWorkspace } from "../src/branches-ui.js";
import { routeBranches } from "../src/branches-routing.js";
import { renderSourceWorkspace, type SourceTarget } from "../src/source-ui.js";

const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
const guard: Condition = { status: "supported", expression: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "9223372036854775807" } } };
const unknown: Condition = { status: "unknown", source: "custom_check()", diagnostic: "unsupportedSyntax" };
function setup(): { browser: Window; host: HTMLElement; tree: HTMLElement } {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event });
  document.body.innerHTML = '<aside id="tree"></aside><main id="host"></main>';
  return { browser, host: document.querySelector("main")!, tree: document.querySelector("aside")! };
}
function model(beats: readonly SceneBeat[]): SceneWorkspace {
  return { projectRevision: "project", sourceMapRevision: "map", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" }, chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }], canUndo: false, canRedo: false,
    scenes: [{ id: "one", chapterId: "chapter", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/arrival.rpy", sourceRevision: "saved", sourceConflict: false, partial: false, beats }, { id: "two", chapterId: "chapter", displayName: "Shared conversation", technicalLabel: "shared", sourcePath: "game/shared.rpy", sourceRevision: "other", sourceConflict: false, partial: false, beats: [] }],
    authoring: { characters: [], appearances: [], assets: [], variables: [{ id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }] } };
}
const call: SceneBeat = { id: "call", byteStart: 40, byteEnd: 95, protected: false, payload: { type: "call", sceneId: "two", returnLabel: "_loomlight_return_stable" } };
const choice: SceneBeat = { id: "choice", byteStart: 95, byteEnd: 180, protected: false, payload: { type: "choice", options: [{ text: "High trust", destinationSceneId: "two", condition: guard }, { text: "Custom", destinationSceneId: "two", condition: unknown }, { text: "Ordinary", destinationSceneId: "two" }] } };

test("Call and guarded Choice are read-only with exact Source navigation and no mutations", async () => {
  const { browser, host, tree } = setup(); const writes: unknown[] = []; const sources: unknown[] = [];
  const dispose = renderSceneAuthoring(host, tree, model([call, choice]), { apply: async command => { writes.push(command); throw Error("Unexpected write"); }, status: () => {}, present: async () => { throw Error("Unexpected media"); }, resolution: { width: 1280, height: 720 }, viewSource: (...args) => sources.push(args), assist: () => { throw Error("Unexpected AI action"); } });
  for (const beat of [call, choice]) {
    let card = host.querySelector<HTMLElement>(`[data-beat-id="${beat.id}"]`)!;
    assert.ok([...card.querySelectorAll<HTMLButtonElement>(".beat-controls button,.beat-grip")].every(button => button.disabled));
    card.querySelector<HTMLButtonElement>(".beat-select")!.click();
    card = host.querySelector<HTMLElement>(`[data-beat-id="${beat.id}"]`)!;
    assert.equal(card.querySelectorAll("input,textarea,select").length, 0);
    assert.equal(card.querySelector(".scene-draft"), null); assert.equal(hasSceneDraft(host), false);
    assert.ok(![...card.querySelectorAll("button")].some(button => button.textContent === "Commit Beat"));
    const source = [...card.querySelectorAll("button")].find(button => button.textContent === "View in Source")!; source.click();
    if (beat.id === "call") assert.match(card.textContent!, /Shared conversation · Returns to next Beat/);
    else { assert.match(card.textContent!, /trust is at least 9223372036854775807/); assert.match(card.textContent!, /Unknown condition: custom_check\(\)/); assert.match(card.textContent!, /Availability unknown/); }
  }
  assert.deepEqual(sources, [["game/arrival.rpy", 40, 95, "saved"], ["game/arrival.rpy", 95, 180, "saved"]]);
  assert.deepEqual(writes, []);
  assert.equal([...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Assist · Continue Scene")!.disabled, true);
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Add Beat")!.click();
  assert.ok(![...host.querySelectorAll<HTMLOptionElement>(".new-beat option")].some(option => option.value === "call"));
  dispose(); await browser.happyDOM.close();
});

test("Call and every guarded option leave preview state unknown without filtering choices", () => {
  const before: SceneBeat = { id: "set", byteStart: 0, byteEnd: 40, protected: false, payload: { type: "setVariable", variableId: "trust", value: "9223372036854775807" } };
  const scene = model([before, call, choice]).scenes[0]!;
  const called = deriveScenePreview(scene, "call");
  assert.equal(called.partial, true); assert.equal(called.variablesUnknown, true); assert.deepEqual(called.variables, {}); assert.deepEqual(called.unknownBeatIds, ["call"]); assert.equal(called.overlay?.kind, "call");
  const chosen = deriveScenePreview(scene, "choice");
  assert.deepEqual(chosen.unknownBeatIds, ["call", "choice"]); assert.equal(chosen.partial, true);
  assert.match(chosen.overlay!.text, /High trust \(availability unknown\).*Custom \(availability unknown\).*Ordinary/);
});

test("recursive and unknown branch captions remain accurate and do not execute sibling bodies", async () => {
  const { browser, host, tree } = setup();
  const branches: SceneBeat[] = [{ id: "elif", byteStart: 0, byteEnd: 20, protected: true, conditionalBranch: { groupId: "group", ordinal: 1, otherwise: false, condition: { status: "supported", expression: { type: "and", left: guard.expression, right: { type: "not", operand: { type: "bool", value: false } } } } }, payload: { type: "customCode", source: "elif trust >= 9223372036854775807 and not False:", reason: "Read-only branch" } }, { id: "unknown", byteStart: 20, byteEnd: 40, protected: true, conditionalBranch: { groupId: "group", ordinal: 2, otherwise: false, condition: unknown }, payload: { type: "customCode", source: "elif custom_check():", reason: "Read-only branch" } }];
  const dispose = renderSceneAuthoring(host, tree, model(branches), { apply: async () => { throw Error("Unexpected write"); }, status: () => {}, present: async () => { throw Error("Unexpected media"); }, resolution: { width: 1280, height: 720 } });
  assert.match(host.querySelector('[data-beat-id="elif"] .beat-select')!.textContent!, /Else If.*trust is at least 9223372036854775807.*and Not \(False\)/);
  assert.match(host.querySelector('[data-beat-id="unknown"] .beat-select')!.textContent!, /Else If Unknown condition: custom_check\(\)/);
  assert.equal(deriveScenePreview(model(branches).scenes[0]!).partial, true);
  assert.equal(conditionCaption({ status: "supported", expression: { type: "string", value: '雪 "quoted"' } }), '"雪 \\"quoted\\""');
  dispose(); await browser.happyDOM.close();
});

test("Branches presents body, guards and Call continuations with exact source locations", async () => {
  const { browser, host } = setup(); const location = { path: "game/arrival.rpy", revision: "saved", byteStart: 40, byteEnd: 95 }; const body = { sceneId: "one", beatId: "child", owner: { groupId: "group", branchId: "if" }, location: { ...location, byteStart: 180, byteEnd: 200 } };
  let flow: FlowWorkspace = { revision: "flow", entrySceneId: "one", partial: true, stale: false, overLimit: false, notice: "Possible flow", nodes: [{ sceneId: "one", name: "Arrival", label: "arrival", location, partial: true, stale: false }], edges: [{ id: "call", sceneId: "one", beatId: "call", optionOrdinal: null, text: "Call Shared", kind: "call", editable: true, location, destination: { kind: "body", ...body }, continuation: body, condition: unknown, guardPath: [{ branchId: "if", branch: { groupId: "group", otherwise: false, ordinal: 0, condition: guard } }] }] };
  const sources: unknown[] = []; const scenes: unknown[] = [];
  const dispose = renderBranches(host, { load: async () => flow, source: target => sources.push(target), scene: (...args) => scenes.push(args), status: () => {} }); await tick();
  const choose = (label: string, value: string): void => { const select = host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!; select.value = value; select.dispatchEvent(new window.Event("change")); };
  choose("Selected Scene", "one"); choose("Selected route", "call");
  assert.match(host.textContent!, /Call Scene returns to its continuation/); assert.match(host.textContent!, /Conditions are not evaluated/); assert.match(host.textContent!, /Availability unknown/);
  assert.ok(![...host.querySelectorAll("button")].some(button => button.textContent === "Edit Choice / Jump"));
  for (const label of ["View origin in Source", "View destination body in Source", "View continuation in Source"]) [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === label)!.click();
  assert.deepEqual(sources, [location, body.location, body.location]); assert.deepEqual(scenes, []);
  assert.deepEqual(routeBranches(new Map([["one", { x: 0, y: 0 }]]), flow.edges), [], "body flow must not become a misleading Scene self-loop");
  flow = { ...flow, revision: "missing-body", edges: [{ ...flow.edges[0]!, destination: { kind: "body", ...body, location: null }, continuation: { ...body, location: null } }] };
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Refresh flow")!.click(); await tick();
  for (const label of ["View destination body in Source", "View continuation in Source"]) assert.equal([...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === label)!.disabled, true);
  dispose(); await browser.happyDOM.close();
});

test("mapped Story source revision is forwarded through main and retained by Source on refusal", async () => {
  // main keeps the established draft/navigation guard; this assertion covers the
  // adapter wiring. The Source controller below exercises the captured target.
  const main = await readFile(new URL("../../src/main.ts", import.meta.url), "utf8");
  assert.match(main, /viewSource: \(path, byteStart, byteEnd, expectedRevision\) => \{ void requestProjectNavigation\(project, "source", \{ path, byteStart, byteEnd, expectedRevision \}\); \}/);
  const { browser, host, tree } = setup(); const opened: SourceTarget[] = []; const statuses: string[] = []; let writes = 0;
  const target = { path: "game/arrival.rpy", byteStart: call.byteStart, byteEnd: call.byteEnd, expectedRevision: "saved" };
  const controller = renderSourceWorkspace(host, tree, { files: [{ path: target.path, state: "clean", dirty: false, readOnly: false }], dirtyCount: 0, draftBytes: 0 }, {
    open: async captured => { opened.push(captured); throw Error("Mapped Source changed. Refresh the selection."); },
    update: async () => { writes++; throw Error("Unexpected update"); }, save: async () => { writes++; throw Error("Unexpected save"); }, discard: async () => { throw Error("Unexpected discard"); }, applyBoth: async () => { writes++; throw Error("Unexpected merge"); },
    status: text => statuses.push(text), reloadInventory: async () => ({ files: [], dirtyCount: 0, draftBytes: 0 }), viewScene: () => {}, requestSave: async () => {}, registerController: () => () => {}, runCoordinated: async (_label, task) => task(), refreshPersistence: () => {},
  }, target);
  await tick(); assert.deepEqual(opened, [{ ...target, selectionStart: undefined, selectionEnd: undefined }]); assert.equal(writes, 0); assert.match(statuses.at(-1)!, /Mapped Source changed/); assert.equal(host.querySelector(".source-editor"), null);
  controller.dispose(); await browser.happyDOM.close();
});

test("ordinary neighbors cannot move through read-only Call and guarded Choice rows", async () => {
  const { browser, host, tree } = setup();
  const first: SceneBeat = { id: "before", byteStart: 0, byteEnd: 40, protected: false, payload: { type: "narration", text: "Before" } };
  const after: SceneBeat = { id: "after", byteStart: 180, byteEnd: 210, protected: false, payload: { type: "narration", text: "After" } };
  let writes = 0;
  const dispose = renderSceneAuthoring(host, tree, model([first, call, choice, after]), { apply: async () => { writes++; throw Error("Unexpected move"); }, status: () => {}, present: async () => { throw Error("Unexpected media"); }, resolution: { width: 1280, height: 720 } });
  const down = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.ariaLabel === "Move beat 1 down")!; const up = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.ariaLabel === "Move beat 4 up")!;
  assert.equal(down.disabled, true); assert.equal(up.disabled, true); down.click(); up.click(); assert.equal(writes, 0);
  dispose(); await browser.happyDOM.close();
});
