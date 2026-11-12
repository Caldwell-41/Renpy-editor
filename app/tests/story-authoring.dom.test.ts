import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { hasSceneDraft, type SceneWorkspace, type SceneBeat, type SceneCommand } from "../src/scene-ui.js";
import { sceneBodies, renderStoryView } from "./story-controls-fixture.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup(beats: readonly SceneBeat[], apply: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision">) => Promise<SceneWorkspace>) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>';
  const model: SceneWorkspace = { projectRevision: "project-open", sourceMapRevision: "map-open", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" }, chapters: [{ id: "chapter", displayName: "Chapter", directory: "game" }],
    scenes: [{ id: "one", chapterId: "chapter", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/arrival.rpy", sourceRevision: "source-open", sourceConflict: false, partial: false, beats, bodies: sceneBodies(beats) }, { id: "two", chapterId: "chapter", displayName: "Conversation", technicalLabel: "conversation", sourcePath: "game/conversation.rpy", sourceRevision: "other", sourceConflict: false, partial: false, beats: [], bodies: [] }],
    authoring: { characters: [], assets: [], appearances: [], variables: [{ id:"money",technicalName:"money",variableType:"decimal",defaultValue:2.5 },{ id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }, { id: "flag", technicalName: "flag", variableType: "bool", defaultValue: true }] } };
  const host = document.querySelector<HTMLElement>("main")!; const statuses: string[] = [];
  const dispose = renderStoryView(host, document.querySelector("aside")!, model, { apply, status: text => statuses.push(text), resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); } }).dispose;
  return { browser, host, model, statuses, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function click(host: ParentNode, label: string): void { const button = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === label); assert.ok(button, label); button.click(); }
function select(host: ParentNode, label: string, value: string): HTMLSelectElement { const control = host.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)!; assert.ok(control, label); control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); return control; }
const call: SceneBeat = { id: "call", byteStart: 10, byteEnd: 35, protected: false, payload: { type: "call", sceneId: "two", returnLabel: "stable_return" } };
const guard = { status: "supported" as const, expression: { type: "compare" as const, operator: "greaterEqual" as const, left: { type: "variable" as const, variableId: "trust", variableType: "int" as const }, right: { type: "int" as const, value: "5" } } };
const choice: SceneBeat = { id: "choice", byteStart: 35, byteEnd: 65, protected: false, payload: { type: "choice", options: [{ text: "Ready", condition: guard }] } };
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
  const payload = writes[0]!.beat as {options:{condition:{expression:{operator:string;right:{value:string}}}}[]}; assert.equal(payload.options[0]!.condition.expression.right.value, "9223372036854775807"); assert.equal(payload.options[0]!.condition.expression.operator, "greaterEqual"); assert.ok(value.isConnected && !value.disabled && hasSceneDraft(s.host));
  await s.close();
});

test("explicit branch insertion preserves body, before-terminator position, and per-type drafts", async () => {
  const header: SceneBeat = { id: "if", byteStart: 0, byteEnd: 10, protected: true, conditionalBranch: { groupId: "group", ordinal: 0, otherwise: false, condition: guard }, payload: { type: "customCode", source: "if trust >= 5:", reason: "Condition" } };
  const nestedEnd = { ...ending, id: "nested-end", owner: { groupId: "group", branchId: "if" } };
  const writes: SceneCommand[] = []; const s = setup([header, nestedEnd, ending], async command => { writes.push(command); throw Error("Source changed"); });
  click(s.host, "Add Beat to If"); assert.match(s.host.querySelector('.story-insertion')!.textContent!, /Arrival \/ If.*Before Return/);
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

test("guard-only Choice edit preserves raw captions and permits explicit option creation", async () => {
  const raw: SceneBeat = { ...choice, payload: { type: "choice", options: [{ text: "  Ready café 雪  ", condition: guard }, { text: " Neighbor ", condition: guard }] } };
  let saved: SceneCommand | undefined;
  const s = setup([raw, ending], async command => { saved = command; throw Error("Hold input"); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();
  assert.equal([...s.host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "Add option")!.disabled, false);
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

 test("decimal numeric conditions retain thresholds and allow ordering without coercing integer text",async()=>{
 const writes:SceneCommand[]=[];
 const decimalChoice:SceneBeat={...choice,payload:{type:"choice",options:[{text:"Ready",condition:{status:"supported",expression:{type:"compare",operator:"greaterEqual",left:{type:"variable",variableId:"money",variableType:"decimal"},right:{type:"decimal",value:"1.25"}}}}]}};
 const s=setup([decimalChoice,ending],async command=>{writes.push(command);throw Error("Keep draft");});
 try{s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();const value=s.host.querySelector<HTMLInputElement>('[aria-label="Condition value"]')!;assert.equal(value.value,"1.25");value.value="2.75";value.dispatchEvent(new Event("input",{bubbles:true}));click(s.host,"Commit Beat");await tick();assert.equal(writes.length,1);assert.equal(value.value,"2.75");}finally{await s.close();}
 });

test("Choice preview keeps duplicate rows, unknown state and policy outside its live Game stage", async () => {
  const writes: SceneCommand[] = [];
  const selected: SceneBeat = { ...choice, payload: { type: "choice", prompt: { type: "narration", text: "Choose independently" }, pickedPolicy: "hidePicked", options: [{ id: "first", text: "Same" }, { id: "second", text: "Same" }, { id: "locked", text: "Locked", condition: guard, unavailablePolicy: "showDisabled" }] } };
  const s = setup([selected, ending], async command => { writes.push(command); return s.model; });
  try {
    const summary = s.host.querySelector<HTMLElement>('[aria-label="Choice prompt and options. Scroll to read more."]');
    assert.ok(summary, "Choice text has a separate keyboard-scrollable summary");
    assert.equal(summary.tabIndex, 0);
    assert.equal(s.host.querySelector('.preview-canvas')!.contains(summary), false);
    assert.equal(summary.querySelector('.preview-choice-prompt')!.textContent, "NarrationChoose independently");
    assert.deepEqual([...summary.querySelectorAll('.preview-choice-caption')].map(row => row.textContent), ["Same", "Same", "Locked"]);
    assert.deepEqual([...summary.querySelectorAll('.preview-choice-number')].map(row => row.textContent), ["1", "2", "3"]);
    assert.equal(summary.querySelectorAll('.preview-choice-condition').length, 1);
    assert.equal(summary.querySelector('.preview-choice-condition')!.getAttribute('aria-label'), "Condition unknown. If false: Show disabled.");
    assert.match(summary.textContent!, /Picked state unknownHide picked/);
    assert.equal(summary.querySelectorAll('button,input,select').length, 0);
    summary.focus(); summary.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    assert.equal(writes.length, 0);
  } finally { await s.close(); }
});

test("Choice prompt controls retain invalid and refused drafts and preview prompt with options", async () => {
  const writes: SceneCommand[] = [];
  const s = setup([choice, ending], async command => { writes.push(command); throw Error("Source changed. Input retained."); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();
  click(s.host, "+ Prompt");
  const text = s.host.querySelector<HTMLInputElement>('[aria-label="Prompt text"]')!;
  assert.ok(text); assert.equal(document.activeElement, text);
  click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 0); assert.equal(text.getAttribute("aria-invalid"), "true");
  text.value = "Which route?"; text.dispatchEvent(new Event("input", { bubbles: true })); text.dispatchEvent(new Event("blur"));
  click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 1);
  assert.deepEqual(writes[0]!.beat, { ...choice.payload, prompt: { type: "narration", text: "Which route?" } });
  assert.ok(text.isConnected); assert.equal(text.value, "Which route?");
  click(s.host, "Cancel"); assert.equal(hasSceneDraft(s.host), false);
  await s.close();
});

test("illustrative option selection shows a nested prompt with its options without evaluating availability", async () => {
  const { deriveScenePreview } = await import("../src/scene-ui.js");
  const outer: SceneBeat = { ...choice, payload: { type: "choice", prompt: { type: "narration", text: "Outer prompt" }, options: [{ id: "arm", text: "Enter" }] } };
  const arm: SceneBeat = { id: "arm", byteStart: 65, byteEnd: 75, protected: true, conditionalBranch: { choiceOption: true, groupId: "options", ordinal: 0, otherwise: false }, payload: { type: "customCode", source: '"Enter":', reason: "Option" } };
  const nested: SceneBeat = { id: "inner", byteStart: 75, byteEnd: 95, protected: false, owner: { groupId: "options", branchId: "arm" }, payload: { type: "choice", prompt: { type: "dialogue", characterId: "speaker", text: "Inner prompt" }, options: [{ text: "Unknown answer", condition: guard }] } };
  const s = setup([outer, arm, nested, ending], async () => s.model);
  const state = deriveScenePreview(s.model.scenes[0]!, undefined, new Map([["options", "arm"]]));
  assert.equal(state.overlay?.beatId, "inner");
  assert.deepEqual(state.overlay?.choice?.prompt, { type: "dialogue", characterId: "speaker", text: "Inner prompt" });
  assert.equal(state.overlay?.choice?.options[0]?.text, "Unknown answer");
  assert.deepEqual(state.overlay?.choice?.options[0]?.condition, guard);
  assert.deepEqual(state.variables, {});
  await s.close();
});

test("Choice unavailable policy is per option and retained after refusal without guessing live values", async () => {
  const writes: SceneCommand[] = [];
  const s = setup([choice, ending], async command => { writes.push(command); throw Error("Source changed"); });
  s.host.querySelector<HTMLButtonElement>('[data-beat-id="choice"] .beat-select')!.click();
  const row = s.host.querySelector<HTMLElement>('.choice-option')!;
  const policy = row.querySelector<HTMLSelectElement>('[aria-label="If false"]');
  assert.ok(policy, "approved Hide / Show disabled control");
  assert.equal(policy.value, "hide");
  policy.value = "showDisabled"; policy.dispatchEvent(new Event("change", { bubbles: true }));
  click(s.host, "Commit Beat"); await tick();
  const beat = writes[0]!.beat as { options: { unavailablePolicy?: string }[] };
  assert.equal(beat.options[0]!.unavailablePolicy, "showDisabled");

  assert.equal(policy.value, "showDisabled"); assert.ok(policy.isConnected);
  assert.match(s.host.querySelector('.preview-choice-summary')!.textContent!, /Condition unknown/);
  assert.equal(s.host.querySelectorAll('.preview-choice-summary button').length, 0);
  await s.close();
});
