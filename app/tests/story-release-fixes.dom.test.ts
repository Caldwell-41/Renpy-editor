// Story release fixes (#120, story-release-fixes / a-v2), through the production Story controls.
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { SceneActions, SceneBeat, SceneCommand, SceneWorkspace } from "../src/scene-ui.js";
import { chooseIn, editorFixture, pickKind, press, renderStoryView, sceneBodies, selectBeat, storyEditor } from "./story-controls-fixture.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };

/** editorFixture's project, with scene one holding `beats`. */
function project(beats: readonly SceneBeat[]): SceneWorkspace {
  const model = editorFixture();
  return { ...model, scenes: model.scenes.map(scene => scene.id === "one" ? { ...scene, beats, bodies: sceneBodies(beats) } : scene) };
}
function mount(model: SceneWorkspace, extra: Partial<SceneActions> = {}) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLTextAreaElement: browser.HTMLTextAreaElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = "<main></main><aside></aside>";
  const host = document.querySelector<HTMLElement>("main")!, calls: SceneCommand[] = [], status: string[] = [];
  const view = renderStoryView(host, document.querySelector("aside")!, model, { apply: async command => { calls.push(command); return model; }, status: text => status.push(text), resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, viewSource: () => {}, ...extra });
  return { host, calls, status, view, close: async () => { view.dispose(); await browser.happyDOM.close(); } };
}
let offset = 0;
const beat = (id: string, payload: SceneBeat["payload"], more: Partial<SceneBeat> = {}): SceneBeat => ({ id, byteStart: offset += 20, byteEnd: offset + 20, protected: false, payload, ...more });
const texts = (scope: ParentNode, selector: string): string[] => [...scope.querySelectorAll(selector)].map(node => node.textContent ?? "");

test("the Transition editor names the stage beats it animates, back to the last line, choice or transition", async () => {
  const s = mount(project([
    beat("words", { type: "narration", text: "The timetable has not changed in thirty years." }),
    beat("bg", { type: "background", assetId: "platform", transition: "none" }),
    beat("music", { type: "playMusic", assetId: "night" }),
    beat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-neutral", placement: "centre", transition: "none" }),
    beat("fade", { type: "transition", transition: "fade" }),
    beat("line", { type: "dialogue", characterId: "mara", text: "You heard the bell too?" }),
    beat("move", { type: "placement", characterId: "mara", placement: "left" }),
    beat("again", { type: "transition", transition: "dissolve" }),
    beat("faded", { type: "transition", transition: "fade" }),
  ]));
  const editor = selectBeat(s.host, "fade"), help = (): HTMLElement => editor.querySelector<HTMLElement>(".story-transition-help")!;
  assert.deepEqual(texts(help(), "p, li"), ["This fade animates 2 beats above it:", "02 Background · Rainy platform", "04 Show character · Mara",
    "A transition animates the stage beats between it and the last line, choice or transition above it. To animate a beat below, move this Transition under that beat."]);
  // The help follows the chosen transition.
  chooseIn(editor, "Transition", "Dissolve");
  assert.equal(help().querySelector("p")!.textContent, "This dissolve animates 2 beats above it:");
  // One beat, and none: a transition right after another has nothing above it to animate.
  assert.equal(selectBeat(s.host, "again").querySelector(".story-transition-help p")!.textContent, "This dissolve animates 1 beat above it:");
  const none = selectBeat(s.host, "faded").querySelector<HTMLElement>(".story-transition-help")!;
  assert.equal(none.querySelector("p")!.textContent, "This fade animates no beats above it."); assert.equal(none.querySelector("li"), null);
  await s.close();
});

test("Add a beat describes Transition by what it animates, and a new Transition names the beats above its place", async () => {
  const s = mount(project([
    beat("bg", { type: "background", assetId: "platform", transition: "none" }),
    beat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-neutral", placement: "centre", transition: "dissolve" }),
    beat("hide", { type: "hideCharacter", characterId: "eli", transition: "none" }),
  ]));
  selectBeat(s.host, "hide"); press(s.host, "+ Add beat");
  const dialog = s.host.querySelector<HTMLElement>(".story-add-beat")!;
  [...dialog.querySelectorAll<HTMLButtonElement>(".story-result")].find(item => item.textContent === "Transition")!.dispatchEvent(new Event("pointerenter"));
  assert.equal(dialog.querySelector(".story-picker-details > p")!.textContent, "Animates the stage changes above it, since the last line or choice.");
  // A stage beat with its own transition already animated itself, so the new beat stops there.
  const panel = pickKind(s.host, "Transition");
  assert.deepEqual(texts(panel.querySelector(".story-transition-help")!, "li"), ["03 Hide character · Eli"]);
  assert.equal(storyEditor(s.host).contains(panel), true);
  await s.close(); void tick;
});

test("the Tracks Characters lane names the character, expression and position", async () => {
  const s = mount(project([
    beat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-concerned", placement: "left", transition: "none" }),
    beat("look", { type: "changeAppearance", characterId: "eli", appearanceId: "eli-neutral", transition: "none" }),
    beat("move", { type: "placement", characterId: "mara", placement: "centre" }),
    beat("hide", { type: "hideCharacter", characterId: "eli", transition: "dissolve" }),
  ]));
  const lane = (id: string): string => [...s.host.querySelectorAll<HTMLElement>(".story-route [data-beat-id]")].find(column => column.dataset.beatId === id)!.querySelector(".story-lane-2")!.textContent!;
  assert.deepEqual(["show", "look", "move", "hide"].map(lane), ["Mara · Concerned · Left", "Eli · Neutral", "Mara → Centre", "Hide Eli"]);
  await s.close();
});

test("Set variable's list ends with + New variable…, says when there are none, and selects the new variable", async () => {
  const empty = project([beat("words", { type: "narration", text: "The timetable has not changed in thirty years." })]);
  const model: SceneWorkspace = { ...empty, authoring: { ...empty.authoring, variables: [] } };
  const requests: unknown[] = [];
  const s = mount(model, { createVariable: async request => {
    requests.push(request);
    return { ...model, projectRevision: "project-2", authoring: { ...model.authoring, variables: [{ id: "count", technicalName: request.technicalName, variableType: request.variableType, defaultValue: "0" }] } };
  } });
  selectBeat(s.host, "words"); press(s.host, "+ Add beat"); const panel = pickKind(s.host, "Set variable");
  const summary = (): HTMLElement => panel.querySelector<HTMLElement>(".story-variable-picker > summary")!;
  assert.equal(summary().textContent, "Choose a variable▾");
  summary().click();
  assert.deepEqual(texts(panel.querySelector(".story-variable-picker [role=listbox]")!, ":scope > *"), ["No variables yet.", "+ New variable…"]);
  const value = panel.querySelector<HTMLInputElement>('input[aria-label="Value"]')!;
  assert.equal(value.disabled, true); assert.equal(value.placeholder, "Choose a variable first");
  press(panel, "+ New variable…");
  const dialog = s.host.querySelector<HTMLElement>(".story-new-variable")!;
  const name = dialog.querySelector<HTMLInputElement>('input[aria-label="Variable name"]')!; name.value = "ticket_count"; name.dispatchEvent(new Event("input", { bubbles: true }));
  chooseIn(dialog, "Variable type", "Whole number");
  press(dialog, "Create variable"); await tick();
  assert.deepEqual(requests, [{ technicalName: "ticket_count", variableType: "int", defaultValue: "0" }]);
  assert.equal(summary().getAttribute("aria-label"), "Variable: ticket_count"); assert.equal(document.activeElement, summary());
  assert.ok(panel.querySelector('input[aria-label="Formula"]'), "A whole number takes a calculation");
  await s.close();
});
