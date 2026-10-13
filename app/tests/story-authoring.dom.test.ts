import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { hasSceneDraft, renderSceneAuthoring, type SceneWorkspace, type SceneBeat, type SceneCommand } from "../src/scene-ui.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup(beats: readonly SceneBeat[], apply: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision">) => Promise<SceneWorkspace>) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>';
  const model: SceneWorkspace = { projectRevision: "project-open", sourceMapRevision: "map-open", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" }, canUndo: false, canRedo: false, chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "one", chapterId: "chapter", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/arrival.rpy", sourceRevision: "source-open", sourceConflict: false, partial: false, beats }, { id: "two", chapterId: "chapter", displayName: "Conversation", technicalLabel: "conversation", sourcePath: "game/conversation.rpy", sourceRevision: "other", sourceConflict: false, partial: false, beats: [] }],
    authoring: { characters: [], assets: [], appearances: [], variables: [{ id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }, { id: "flag", technicalName: "flag", variableType: "bool", defaultValue: true }] } };
  const host = document.querySelector<HTMLElement>("main")!; const statuses: string[] = [];
  const dispose = renderSceneAuthoring(host, document.querySelector("aside")!, model, { apply, status: text => statuses.push(text), resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); } });
  return { browser, host, model, statuses, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function click(host: ParentNode, label: string): void { const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === label); assert.ok(button, label); button.click(); }
function select(host: ParentNode, label: string, value: string): HTMLSelectElement { const control = host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!; assert.ok(control, label); control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); return control; }
const call: SceneBeat = { id: "call", byteStart: 10, byteEnd: 35, protected: false, payload: { type: "call", sceneId: "two", returnLabel: "stable_return" } };
const guard = { status: "supported" as const, expression: { type: "compare" as const, operator: "greaterEqual" as const, left: { type: "variable" as const, variableId: "trust", variableType: "int" as const }, right: { type: "int" as const, value: "5" } } };
const choice: SceneBeat = { id: "choice", byteStart: 35, byteEnd: 65, protected: false, payload: { type: "choice", options: [{ text: "Ready", destinationSceneId: "two", condition: guard }] } };
const ending: SceneBeat = { id: "end", byteStart: 65, byteEnd: 75, protected: false, payload: { type: "return" } };

test("Call edit keeps label and captured envelopes; stale refusal keeps fields and disabled controls", async () => {
  const writes: { command: SceneCommand; expected: unknown }[] = [];
  const s = setup([call, ending], async (command, expected) => { writes.push({ command, expected }); throw Error("Source changed. Input retained."); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="call"] .beat-select')!.click();
  select(s.host, "Call destination Scene", "one");
  const field = s.host.querySelector<HTMLSelectElement>('select[aria-label="Call destination Scene"]')!;
  field.disabled = true; click(s.host, "Commit Beat"); await tick();
  assert.equal(field.disabled, true); assert.ok(field.isConnected && hasSceneDraft(s.host)); assert.equal(field.value, "one");
  assert.deepEqual(writes, [{ command: { type: "updateBodyBeat", sceneId: "one", expectedSourceRevision: "source-open", beatId: "call", expectedBody: { type: "root" }, beat: { type: "call", sceneId: "one", returnLabel: "stable_return" } }, expected: { projectRevision: "project-open", sourceMapRevision: "map-open" } }]);
  assert.match(s.statuses.at(-1)!, /Source changed/); click(s.host, "Cancel"); assert.equal(hasSceneDraft(s.host), false); await s.close();
});

test("missing Call destination stays visible, fails blur and submission, and never chooses first Scene", async () => {
  let writes = 0; const missing: SceneBeat = { ...call, payload: { type: "call", sceneId: "missing", returnLabel: "stable_return" } };
  const s = setup([missing], async () => { writes++; return s.model; });
  s.host.querySelector<HTMLButtonElement>('.beat-select')!.click();
  const field = s.host.querySelector<HTMLSelectElement>('select[aria-label="Call destination Scene"]')!;
  assert.equal(field.value, "missing"); assert.match(field.selectedOptions[0]!.textContent!, /Unavailable/);
  field.dispatchEvent(new Event("blur")); assert.equal(field.getAttribute("aria-invalid"), "true"); click(s.host, "Commit Beat"); await tick(); assert.equal(writes, 0); assert.equal(field.value, "missing"); assert.equal(document.activeElement, field);
  await s.close();
});

test("guarded Choice validates exact integer at blur/submission; IME and failed writes retain every field", async () => {
  const writes: SceneCommand[] = []; const s = setup([choice, ending], async command => { writes.push(command); throw Error("Map changed. Input retained."); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();
  const value = s.host.querySelector<HTMLInputElement>('input[aria-label="Condition value"]')!;
  value.value = "9223372036854775808"; value.dispatchEvent(new Event("input", { bubbles: true })); assert.equal(value.hasAttribute("aria-invalid"), false);
  value.dispatchEvent(new Event("blur")); assert.equal(value.getAttribute("aria-invalid"), "true"); click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 0); assert.equal(value.value, "9223372036854775808"); assert.equal(document.activeElement, value);
  value.dispatchEvent(new Event("compositionstart", { bubbles: true })); value.value = "9223372036854775807"; value.dispatchEvent(new Event("input", { bubbles: true })); click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 0);
  value.dispatchEvent(new Event("compositionend", { bubbles: true })); value.dispatchEvent(new Event("blur")); assert.equal(value.hasAttribute("aria-invalid"), false); click(s.host, "Commit Beat"); await tick();
  const payload = writes[0]!.beat as {options:{condition:{expression:{right:{value:string}}}}[]}; assert.equal(payload.options[0]!.condition.expression.right.value, "9223372036854775807"); assert.ok(value.isConnected && !value.disabled && hasSceneDraft(s.host));
  await s.close();
});

test("explicit branch insertion preserves body, before-terminator position, and per-type drafts", async () => {
  const header: SceneBeat = { id: "if", byteStart: 0, byteEnd: 10, protected: true, conditionalBranch: { groupId: "group", ordinal: 0, otherwise: false, condition: guard }, payload: { type: "customCode", source: "if trust >= 5:", reason: "Condition" } };
  const nestedEnd = { ...ending, id: "nested-end", owner: { groupId: "group", branchId: "if" } };
  const writes: SceneCommand[] = []; const s = setup([header, nestedEnd, ending], async command => { writes.push(command); throw Error("Source changed"); });
  click(s.host, "Add Beat to If"); assert.match(s.host.querySelector('.story-insertion')!.textContent!, /Arrival \/ Condition \/ If.*Before Return/);
  const type = s.host.querySelector<HTMLSelectElement>('.new-beat > .field select')!; type.value = "narration"; type.dispatchEvent(new Event("change"));
  const text = s.host.querySelector<HTMLTextAreaElement>('.new-beat textarea')!; text.value = "Retained narration"; text.dispatchEvent(new Event("input"));
  type.value = "call"; type.dispatchEvent(new Event("change")); type.value = "narration"; type.dispatchEvent(new Event("change")); assert.equal(s.host.querySelector<HTMLTextAreaElement>('.new-beat textarea')!.value, "Retained narration");
  click(s.host.querySelector('.new-beat')!, "Add Beat"); await tick();
  assert.deepEqual(writes[0], { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: "source-open", body: { type: "branch", groupId: "group", branchId: "if" }, position: { type: "before", anchor: { type: "beat", beatId: "nested-end" } }, beat: { type: "narration", text: "Retained narration" } });
  assert.equal(text.value, "Retained narration"); assert.ok(text.isConnected); await s.close();
});

test("root Call insertion is explicit before Return and generates no renderer-owned return label", async () => {
  const writes: SceneCommand[] = []; const s = setup([ending], async command => { writes.push(command); return s.model; });
  click(s.host, "Add Beat"); const type = s.host.querySelector<HTMLSelectElement>('.new-beat > .field select')!; type.value = "call"; type.dispatchEvent(new Event("change")); select(s.host, "Call destination Scene", "two"); click(s.host.querySelector('.new-beat')!, "Add Beat"); await tick();
  assert.deepEqual(writes[0], { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: "source-open", body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "end" } }, beat: { type: "call", sceneId: "two", returnLabel: null } }); await s.close();
});

test("guard-only Choice edit preserves raw captions and guarded option-count controls stay constrained", async () => {
  const raw: SceneBeat = { ...choice, payload: { type: "choice", options: [{ text: "  Ready café 雪  ", destinationSceneId: "two", condition: guard }, { text: " Neighbor ", destinationSceneId: "two", condition: guard }] } };
  let saved: SceneCommand | undefined;
  const s = setup([raw, ending], async command => { saved = command; throw Error("Hold input"); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();
  for (const label of ["Add option", "Remove", "Create New Scene"]) assert.ok([...s.host.querySelectorAll<HTMLButtonElement>("button")].filter(button => button.textContent === label).every(button => button.disabled));
  const value = s.host.querySelector<HTMLInputElement>('input[aria-label="Condition value"]')!; value.value = "6"; value.dispatchEvent(new Event("input", { bubbles: true })); click(s.host, "Commit Beat"); await tick();
  assert.deepEqual((saved!.beat as {options:{text:string}[]}).options.map(option => option.text), ["  Ready café 雪  ", " Neighbor "]); await s.close();
});

test("unchanged pending commit blocks another draft and late disposed refusal cannot affect replacement view", async () => {
  let reject!: (error: Error) => void; const pending = new Promise<SceneWorkspace>((_, fail) => { reject = fail; });
  const s = setup([call, ending], async () => pending);
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="call"] .beat-select')!.click(); click(s.host, "Commit Beat");
  assert.equal(hasSceneDraft(s.host), true); click(s.host, "Add Beat"); assert.equal(s.host.querySelector(".new-beat"), null);
  const statusCount = s.statuses.length; await s.close(); reject(Error("Late old-session refusal")); await tick(); assert.equal(s.statuses.length, statusCount);
});
