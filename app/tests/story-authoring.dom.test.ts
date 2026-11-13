import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { hasSceneDraft, type SceneWorkspace, type SceneBeat, type SceneCommand } from "../src/scene-ui.js";
import { chooseIn, openGuard, optionBlocks, pickKind, press, sceneBodies, renderStoryView, selectBeat, type } from "./story-controls-fixture.js";
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
  selectBeat(s.host, "call");
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
  selectBeat(s.host, "call");
  const field = s.host.querySelector<HTMLSelectElement>('select[aria-label="Call destination Scene"]')!;
  assert.equal(field.value, "missing"); assert.match(field.selectedOptions[0]!.textContent!, /Unavailable/);
  field.dispatchEvent(new Event("blur")); assert.equal(field.getAttribute("aria-invalid"), "true"); click(s.host, "Commit Beat"); await tick(); assert.equal(writes, 0); assert.equal(field.value, "missing"); assert.equal(document.activeElement, field);
  await s.close();
});

test("guarded Choice validates exact integer at blur/submission; IME and failed writes retain every field", async () => {
  const writes: SceneCommand[] = []; const s = setup([choice, ending], async command => { writes.push(command); throw Error("Map changed. Input retained."); });
  selectBeat(s.host, "choice");
  const value = openGuard(optionBlocks(s.host)[0]!).querySelector<HTMLInputElement>('input[aria-label="Only when rule 1 value"]')!;
  assert.equal(value.value, "5");
  type(value, "9223372036854775808"); assert.equal(value.hasAttribute("aria-invalid"), false);
  value.dispatchEvent(new Event("blur")); assert.equal(value.getAttribute("aria-invalid"), "true"); click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 0); assert.equal(value.value, "9223372036854775808"); assert.equal(document.activeElement, value);
  value.dispatchEvent(new Event("compositionstart", { bubbles: true })); type(value, "9223372036854775807"); click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 0);
  value.dispatchEvent(new Event("compositionend", { bubbles: true })); value.dispatchEvent(new Event("blur")); assert.equal(value.hasAttribute("aria-invalid"), false); click(s.host, "Commit Beat"); await tick();
  const payload = writes[0]!.beat as {options:{condition:{expression:{operator:string;right:{value:string}}}}[]}; assert.equal(payload.options[0]!.condition.expression.right.value, "9223372036854775807"); assert.equal(payload.options[0]!.condition.expression.operator, "greaterEqual"); assert.ok(value.isConnected && !value.disabled && hasSceneDraft(s.host));
  await s.close();
});

test("a branch's new beat goes before its ending and names its place", async () => {
  const header: SceneBeat = { id: "if", byteStart: 0, byteEnd: 10, protected: true, conditionalBranch: { groupId: "group", ordinal: 0, otherwise: false, condition: guard }, payload: { type: "customCode", source: "if trust >= 5:", reason: "Condition" } };
  const nestedEnd = { ...ending, id: "nested-end", owner: { groupId: "group", branchId: "if" } };
  const writes: SceneCommand[] = []; const s = setup([header, nestedEnd, ending], async command => { writes.push(command); throw Error("Source changed"); });
  selectBeat(s.host, "if"); press(s.host, 'Add a beat to If (trust is at least 5)');
  const draft = pickKind(s.host, "Narration");
  assert.deepEqual([...draft.querySelectorAll(".story-where dd")].map(item => item.textContent), ["Before 01.1 Return", 'Arrival › If (trust is at least 5)']);
  const text = draft.querySelector<HTMLTextAreaElement>("textarea")!; assert.equal(document.activeElement, text); type(text, "Retained narration");
  click(draft, "Add Beat"); await tick();
  assert.deepEqual(writes[0], { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: "source-open", body: { type: "branch", groupId: "group", branchId: "if" }, position: { type: "before", anchor: { type: "beat", beatId: "nested-end" } }, beat: { type: "narration", text: "Retained narration" } });
  assert.equal(text.value, "Retained narration"); assert.ok(text.isConnected); await s.close();
});

test("root Call insertion is explicit before Return and generates no renderer-owned return label", async () => {
  const writes: SceneCommand[] = []; const s = setup([ending], async command => { writes.push(command); return s.model; });
  click(s.host, "+ Add beat"); pickKind(s.host, "Call scene"); select(s.host, "Call destination Scene", "two"); click(s.host.querySelector('.new-beat')!, "Add Beat"); await tick();
  assert.deepEqual(writes[0], { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: "source-open", body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "end" } }, beat: { type: "call", sceneId: "two", returnLabel: null } }); await s.close();
});

test("guard-only Choice edit preserves raw captions and permits explicit option creation", async () => {
  const raw: SceneBeat = { ...choice, payload: { type: "choice", options: [{ text: "  Ready café 雪  ", condition: guard }, { text: " Neighbor ", condition: guard }] } };
  let saved: SceneCommand | undefined;
  const s = setup([raw, ending], async command => { saved = command; throw Error("Hold input"); });
  selectBeat(s.host, "choice");
  assert.equal([...s.host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === "+ Add option")!.disabled, false);
  const value = openGuard(optionBlocks(s.host)[0]!).querySelector<HTMLInputElement>('input[aria-label="Only when rule 1 value"]')!; type(value, "6"); click(s.host, "Commit Beat"); await tick();
  assert.deepEqual((saved!.beat as {options:{text:string}[]}).options.map(option => option.text), ["  Ready café 雪  ", " Neighbor "]); await s.close();
});

test("unchanged pending commit blocks another draft and late disposed refusal cannot affect replacement view", async () => {
  let reject!: (error: Error) => void; const pending = new Promise<SceneWorkspace>((_, fail) => { reject = fail; });
  const s = setup([call, ending], async () => pending);
  selectBeat(s.host, "call"); click(s.host, "Commit Beat");
  assert.equal(hasSceneDraft(s.host), true); click(s.host, "+ Add beat"); assert.equal(s.host.querySelector(".new-beat"), null);
  const statusCount = s.statuses.length; await s.close(); reject(Error("Late old-session refusal")); await tick(); assert.equal(s.statuses.length, statusCount);
});

 test("decimal numeric conditions retain thresholds and allow ordering without coercing integer text",async()=>{
 const writes:SceneCommand[]=[];
 const decimalChoice:SceneBeat={...choice,payload:{type:"choice",options:[{text:"Ready",condition:{status:"supported",expression:{type:"compare",operator:"greaterEqual",left:{type:"variable",variableId:"money",variableType:"decimal"},right:{type:"decimal",value:"1.25"}}}}]}};
 const s=setup([decimalChoice,ending],async command=>{writes.push(command);throw Error("Keep draft");});
 try{selectBeat(s.host, "choice");const value=openGuard(optionBlocks(s.host)[0]!).querySelector<HTMLInputElement>('[aria-label="Only when rule 1 value"]')!;assert.equal(value.value,"1.25");type(value,"2.75");click(s.host,"Commit Beat");await tick();assert.equal(writes.length,1);assert.equal(value.value,"2.75");
  const condition=(writes[0]!.beat as {options:{condition:{expression:{right:unknown}}}[]}).options[0]!.condition;assert.deepEqual(condition.expression.right,{type:"decimal",value:"2.75"});}finally{await s.close();}
 });

test("Preview options change only the stage: hidden, disabled, marked and unknown options, and none to pick", async () => {
  const writes: SceneCommand[] = [];
  const selected: SceneBeat = { ...choice, payload: { type: "choice", prompt: { type: "narration", text: "Choose independently" }, pickedPolicy: "markPicked", options: [{ id: "first", text: "Same" }, { id: "second", text: "Same" }, { id: "locked", text: "Locked", condition: guard, unavailablePolicy: "showDisabled" }] } };
  const s = setup([selected, ending], async command => { writes.push(command); return s.model; });
  try {
    const stage = (): { text: string; state: string }[] => [...s.host.querySelectorAll<HTMLElement>(".preview-canvas .story-game-choice")].map(item => ({ text: item.textContent!, state: item.dataset.state! }));
    // Only the game's text box and choice menu sit on the stage; an unguarded option is available, a guarded one unknown.
    assert.equal(s.host.querySelector(".preview-canvas .preview-overlay")!.textContent, "Choose independently");
    assert.deepEqual(stage(), [{ text: "Same", state: "available" }, { text: "Same", state: "available" }, { text: "Locked", state: "unknown" }]);
    const preview = s.host.querySelector<HTMLElement>(".story-choice-preview")!;
    press(preview, "Assume option 3's condition is false");
    assert.deepEqual(stage().at(-1), { text: "Locked", state: "disabled" });
    press(s.host.querySelector(".story-choice-preview")!, "Assume option 1 was picked earlier in this save");
    assert.deepEqual(stage()[0], { text: "✓Same", state: "marked" }, "Marked follows option 1's identity, not its text");
    assert.equal(stage()[1]!.state, "available");
    press(s.host.querySelector(".story-choice-preview")!, "Assume option 2 was picked earlier in this save");
    press(s.host.querySelector(".story-choice-preview")!, "Assume option 3's condition is true");
    assert.deepEqual(stage().map(item => item.state), ["marked", "marked", "available"]);
    assert.equal(writes.length, 0); assert.equal(hasSceneDraft(s.host), false, "Preview options are not a draft");
  } finally { await s.close(); }
  // With nothing selectable, the stage says the story continues and records no pick.
  const hidden: SceneBeat = { ...choice, payload: { type: "choice", pickedPolicy: "hidePicked", options: [{ id: "only", text: "Only" }] } };
  const t = setup([hidden, ending], async () => t.model);
  try {
    press(t.host.querySelector(".story-choice-preview")!, "Assume option 1 was picked earlier in this save");
    assert.equal(t.host.querySelectorAll(".preview-canvas .story-game-choice").length, 0);
    assert.equal(t.host.querySelector(".story-choice-none")!.textContent, "No option can be picked, so the story continues at 02. No pick is recorded.");
  } finally { await t.close(); }
});

test("Choice prompt: + Prompt adds a narration or Character line, an empty prompt is none, and a refused write keeps it", async () => {
  const writes: SceneCommand[] = [];
  const s = setup([choice, ending], async command => { writes.push(command); throw Error("Source changed. Input retained."); });
  selectBeat(s.host, "choice");
  click(s.host, "+ Prompt");
  const text = s.host.querySelector<HTMLInputElement>('[aria-label="Prompt text"]')!;
  assert.ok(text); assert.equal(document.activeElement, text);
  click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 1); assert.deepEqual(writes[0]!.beat, choice.payload);
  type(text, "Which route?");
  click(s.host, "Commit Beat"); await tick(); assert.equal(writes.length, 2);
  assert.deepEqual(writes[1]!.beat, { ...choice.payload, prompt: { type: "narration", text: "Which route?" } });
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
  selectBeat(s.host, "choice");
  const block = optionBlocks(s.host)[0]!;
  assert.match(block.querySelector(".story-guard")!.textContent!, /Only when trust is at least 5/);
  const policy = block.querySelector<HTMLSelectElement>('select[aria-label="Option 1 if false"]')!;
  assert.equal(policy.value, "hide");
  chooseIn(block, "Option 1 if false", "Show disabled");
  click(s.host, "Commit Beat"); await tick();
  const beat = writes[0]!.beat as { options: { unavailablePolicy?: string }[] };
  assert.equal(beat.options[0]!.unavailablePolicy, "showDisabled");
  assert.equal(policy.value, "showDisabled"); assert.ok(policy.isConnected);
  assert.equal(s.host.querySelector<HTMLElement>(".story-game-choice")!.dataset.state, "unknown", "The stage never guesses the live value");
  await s.close();
});
