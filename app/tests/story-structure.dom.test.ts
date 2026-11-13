import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildConditionEditor } from "../src/story-condition-editor.js";
import { deriveScenePreview, hasSceneDraft, type SceneCommand, type SceneWorkspace, type StoryTarget } from "../src/scene-ui.js";
import { renderBranches, type FlowBody } from "../src/branches-ui.js";
import { flagCondition, openBranch, selectBeat, storyEditor, storyFixture, renderStoryView, trackColumn } from "./story-controls-fixture.js";
import { shorten } from "../src/story-tracks.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup(apply?: (command: SceneCommand) => Promise<SceneWorkspace>, fixture = storyFixture(3)) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>'; const host = document.querySelector<HTMLElement>("main")!; const model = fixture; const calls: { command: SceneCommand; expected: unknown }[] = []; const status: string[] = []; const navigation: StoryTarget[] = []; const continuations: unknown[] = [];
  const dispose = renderStoryView(host, document.querySelector("aside")!, model, { apply: async (command, expected) => { calls.push({ command, expected }); return apply ? apply(command) : model; }, resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, status: text => status.push(text), viewScene: target => navigation.push(target), viewContinuation: (...args) => continuations.push(args), viewSource: () => {} }).dispose;
  return { browser, host, model, calls, status, navigation, continuations, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function button(host: ParentNode, text: string): HTMLButtonElement { const found = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === text); assert.ok(found, text); return found; }
function choose(host: ParentNode, aria: string, value: string): HTMLSelectElement { const control = host.querySelector<HTMLSelectElement>(`select[aria-label="${aria}"]`)!; assert.ok(control, aria); control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); return control; }
function textarea(host: ParentNode): HTMLTextAreaElement { return storyEditor(host).querySelector<HTMLTextAreaElement>("textarea")!; }

test("full condition builder hydrates All/Any/Not, exact values and boolean comparison operands without flattening", async () => {
  const s = setup(); const expression = { type: "and" as const, left: { type: "not" as const, operand: { type: "variable" as const, variableId: "flag", variableType: "bool" as const } }, right: { type: "or" as const, left: { type: "compare" as const, operator: "equal" as const, left: { type: "bool" as const, value: true }, right: { type: "not" as const, operand: { type: "bool" as const, value: false } } }, right: { type: "compare" as const, operator: "greaterEqual" as const, left: { type: "variable" as const, variableId: "trust", variableType: "int" as const }, right: { type: "int" as const, value: "9223372036854775807" } } } };
  const editor = buildConditionEditor(s.model.authoring.variables, { status: "supported", expression }); document.body.append(editor.host); assert.deepEqual(editor.read().expression, expression); await s.close();
});

test("create Condition submits the root body and full typed boolean combinations in one command", async () => {
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!;
  choose(panel, "Condition type", "and"); const children = panel.querySelectorAll<HTMLElement>(".condition-combination > .condition-expression"); choose(children[0]!, "Condition type", "not"); choose(children[1]!, "Condition type", "bool");
  (panel.querySelector<HTMLInputElement>('input[aria-label="Include Otherwise"]')!).checked = true; button(panel, "Create Condition").click(); await tick();
  const command = s.calls[0]!.command; assert.equal(command.type, "insertCondition"); assert.deepEqual(command.body, { type: "root" }); assert.equal((command.condition as {expression:{type:string}}).expression.type, "and"); assert.equal(command.otherwise, true); assert.deepEqual(s.calls[0]!.expected, { projectRevision: "project", sourceMapRevision: "map" }); await s.close();
});

test("Else If insertion exposes first-match order and captures containing group parent", async () => {
  const s = setup(); button(selectBeat(s.host, "if"), "Add Else If").click();
  const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Else If"]')!; choose(panel, "Branch position", "elif"); button(panel, "Create Else If").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "addConditionBranch"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" }); assert.equal(s.calls[0]!.command.beforeBranchId, "elif"); await s.close();
});

test("nested Otherwise creation and condition editing use group-parent qualification, not selected branch ownership", async () => {
  const s = setup(); button(selectBeat(s.host, "nested-if-0", "if"), "Add Otherwise").click(); button(s.host.querySelector('.story-operation[aria-label="Add Otherwise"]')!, "Create Otherwise").click(); await tick();
  assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); assert.equal(s.calls[0]!.command.condition, null); assert.equal(s.calls[0]!.command.beforeBranchId, null);
  // The accepted operation returns to the nested condition, whose editor edits its If test.
  const editor = storyEditor(s.host).querySelector<HTMLElement>('.story-operation[aria-label="Edit Condition"]')!; button(editor, "Apply condition").click(); await tick(); assert.deepEqual(s.calls[1]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); await s.close();
});

test("explicit leaf move shows destination and retains every field on core refusal", async () => {
  const s = setup(async () => { throw Error("Cannot safely promote inline comments. Use Source."); }); button(selectBeat(s.host, "a", "if"), "Move to…").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Move story content"]')!;
  choose(panel, "Destination body", "otherwise"); button(panel, "Move to destination").click(); await tick();
  assert.deepEqual(s.calls[0]!.command, { sceneId: "one", expectedSourceRevision: "source", type: "moveStoryNode", node: { type: "beat", beatId: "a" }, expectedBody: { type: "branch", groupId: "group", branchId: "if" }, body: { type: "branch", groupId: "group", branchId: "otherwise" }, position: { type: "end" } });
  assert.ok(panel.isConnected && hasSceneDraft(s.host)); assert.equal(panel.querySelector<HTMLSelectElement>('select[aria-label="Destination body"]')!.value, "otherwise"); assert.match(s.status.at(-1)!, /Input retained/); await s.close();
});

test("whole condition move excludes own descendant bodies; headers never become ordinary Beat targets", async () => {
  const s = setup(); button(selectBeat(s.host, "if"), "Move to…").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Move story content"]')!; assert.deepEqual([...panel.querySelector<HTMLSelectElement>('select[aria-label="Destination body"]')!.options].map(option => option.value), ["root"]); button(panel, "Move to destination").click(); await tick(); assert.deepEqual(s.calls[0]!.command.node, { type: "condition", groupId: "group" });
  // An Else If header is a branch of its condition, never a Tracks beat of its own.
  openBranch(s.host, "elif"); assert.equal(trackColumn(s.host, "elif"), undefined); assert.ok(trackColumn(s.host, "maybe")); await s.close();
});

test("delete whole group and selected unwrap remain distinct; initial If cannot be removed as a branch", async () => {
  const s = setup(); assert.equal([...selectBeat(s.host, "if").querySelectorAll("button")].some(button => button.textContent === "Delete branch"), false); button(storyEditor(s.host), "Unwrap…").click(); let panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Unwrap one branch"]')!; choose(panel, "Branch to keep", "elif"); button(panel, "Unwrap selected branch").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "unwrapCondition"); assert.equal(s.calls[0]!.command.branchId, "elif"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" });
  button(storyEditor(s.host), "Delete condition").click(); panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Delete entire condition"]')!; button(panel, "Delete entire condition").click(); await tick(); assert.equal(s.calls[1]!.command.type, "removeStoryNode"); assert.deepEqual(s.calls[1]!.command.node, { type: "condition", groupId: "group" }); await s.close();
});

test("manual preview never runs sibling bodies and switching branches retains the editing draft", async () => {
  const s = setup(); const scene = s.model.scenes[0]!;
  const preview = deriveScenePreview({ ...scene, beats: scene.beats.filter(beat => ["if", "a", "elif", "maybe", "otherwise", "empty"].includes(beat.id)) }, undefined, new Map([["group", "elif"]])); assert.equal(preview.overlay?.text, "Maybe another time."); assert.equal(preview.partial, false);
  selectBeat(s.host, "a", "if"); const text = textarea(s.host); text.value = "Retained draft"; text.dispatchEvent(new Event("input", { bubbles: true }));
  // The Branch path switch moves the route and selection; the draft stays with its beat.
  openBranch(s.host, "otherwise"); assert.equal(trackColumn(s.host, "a"), undefined); assert.equal(storyEditor(s.host).dataset.editorFor, "otherwise");
  selectBeat(s.host, "a", "if"); assert.equal(textarea(s.host), text); assert.equal(text.value, "Retained draft"); assert.equal(s.calls.length, 0); await s.close();
});

test("a closed branch marks its draft on the condition; nested paths stay navigable and empty pass is inert", async () => {
  const s = setup(); selectBeat(s.host, "a", "if"); const text = textarea(s.host); text.value = "Draft"; text.dispatchEvent(new Event("input", { bubbles: true }));
  // Closing the branch hides its beats; the condition column marks the draft inside it.
  openBranch(s.host, "if"); s.host.querySelector<HTMLButtonElement>('.story-branch-segment[data-branch-id="if"]')!.click();
  assert.equal(trackColumn(s.host, "a"), undefined); assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true");
  selectBeat(s.host, "a", "if"); assert.equal(textarea(s.host), text); assert.equal(text.value, "Draft");
  button(storyEditor(s.host), "Cancel").click(); assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "false");
  // Every nested condition on the route gets its own Branch path switch.
  const editor = selectBeat(s.host, "deep", "nested-if-0", "nested-if-1", "nested-if-2");
  assert.deepEqual([...s.host.querySelectorAll<HTMLElement>(".story-branch-group")].map(group => group.dataset.branchOwner), ["if", "nested-if-0", "nested-if-1", "nested-if-2"]);
  assert.match(editor.querySelector(".story-breadcrumb")!.textContent!, /Arrival.*If.*trust/);
  const emptyScene = { ...s.model.scenes[0]!, beats: s.model.scenes[0]!.beats.filter(beat => ["if", "otherwise", "empty"].includes(beat.id)) }; const state = deriveScenePreview(emptyScene, undefined, new Map([["group", "otherwise"]])); assert.equal(state.partial, false); assert.equal(state.overlay, undefined); await s.close();
});

test("Call navigation captures target and caller revisions; continuation requests core-mapped location", async () => {
  const s = setup(); const editor = selectBeat(s.host, "call"); button(editor, "Open called Scene").click(); assert.deepEqual(s.navigation[0], { sceneId: "two", expectedSourceRevision: "other", caller: { sceneId: "one", beatId: "call", expectedSourceRevision: "source", caller: undefined } }); button(editor, "View Call continuation").click(); assert.deepEqual(s.continuations[0], ["one", "call", "source"]); await s.close();
});

test("Branches forwards selected guarded origin and exact body/continuation targets", async () => {
  const s = setup(); s.host.replaceChildren(); const location = { path: "game/arrival.rpy", revision: "source", byteStart: 20, byteEnd: 40 }; const body: FlowBody = { sceneId: "one", beatId: "a", owner: { groupId: "group", branchId: "if" }, location }; const calls: unknown[] = [];
  const edge = { id: "edge", sceneId: "one", beatId: "if", optionOrdinal: null, text: "If", kind: "guard", editable: true, location, destination: { kind: "body" as const, ...body }, continuation: body, condition: flagCondition };
  const dispose = renderBranches(s.host, { load: async () => ({ revision: "flow", entrySceneId: "one", nodes: [{ sceneId: "one", name: "Arrival", label: "arrival", location, partial: false, stale: false }], edges: [edge], partial: false, stale: false, overLimit: false, notice: "Observed" }), scene: (node, selected) => calls.push({ node, selected }), body: target => calls.push(target), source: () => {}, status: () => {} }); await tick(); choose(s.host, "Selected Scene", "one"); choose(s.host, "Selected route", "edge"); button(s.host, "Open Scene").click(); button(s.host, "Open destination body in Story").click(); button(s.host, "Open continuation in Story").click(); assert.equal((calls[0] as {selected:unknown}).selected, edge); assert.deepEqual(calls.slice(1), [{ kind: "body", ...body }, body]); dispose(); await s.close();
});

test("manual selected branch terminals and Choices stop before unvisited root effects", async () => {
  const s = setup(); const header = s.model.scenes[0]!.beats[0]!;
  for (const payload of [{ type: "return" as const }, { type: "jump" as const, sceneId: "two" }, { type: "choice" as const, options: [{ text: "Leave" }] }]) {
    const scene = { ...s.model.scenes[0]!, beats: [header, { id: "terminal", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload }, { id: "unreachable-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "999" } }, { id: "unreachable-text", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "narration" as const, text: "Must not appear" } }] };
    const state = deriveScenePreview(scene, undefined, new Map([["group", "if"]])); assert.equal(state.overlay?.kind, payload.type); assert.equal(state.variables.trust, undefined); assert.notEqual(state.overlay?.text, "Must not appear"); assert.equal(state.throughBeatId, "terminal");
  }
  const guarded = { ...s.model.scenes[0]!, beats: [header, { id: "guarded", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload: { type: "choice" as const, options: [{ text: "Leave", condition: flagCondition }] } }, { id: "unvisited-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "999" } }, { id: "unvisited-background", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "background" as const, assetId: "bg", transition: "none" as const } }, { id: "possible", byteStart: 70, byteEnd: 80, protected: false, payload: { type: "narration" as const, text: "Possible continuation" } }] };
  const state = deriveScenePreview(guarded, undefined, new Map([["group", "if"]])); assert.equal(state.partial, true); assert.equal(state.variablesUnknown, true); assert.deepEqual(state.unknownBeatIds, ["guarded"]); assert.equal(state.overlay?.kind, "choice"); assert.notEqual(state.overlay?.text, "Possible continuation"); assert.equal(state.throughBeatId, "guarded"); assert.equal(state.variables.trust, undefined); assert.equal(state.background, undefined); await s.close();
});

test("whole-group confirmation and collapse summary count protected Custom Code and branches", async () => {
  const fixture = storyFixture(); const scene = fixture.scenes[0]!;
  const opaque = { id: "opaque", byteStart: 65, byteEnd: 70, protected: true, owner: { groupId: "group", branchId: "if" }, payload: { type: "customCode" as const, source: "        custom_code()", reason: "Unsupported source" } };
  const s = setup(undefined, { ...fixture, scenes: [{ ...scene, beats: [...scene.beats.slice(0, 3), opaque, ...scene.beats.slice(3)] }, fixture.scenes[1]!] });
  assert.match(selectBeat(s.host, "if").querySelector(".story-condition-summary")!.textContent!, /3 branches \/ 5 Beats/);
  button(storyEditor(s.host), "Delete condition").click(); assert.match(s.host.querySelector('.story-operation[aria-label="Delete entire condition"]')!.textContent!, /all 5 contained Beats/); await s.close();
});

test("dirty structural input blocks tree New/Rename entry; dirty tree input blocks unrelated Story forms", async () => {
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!; choose(panel, "Condition type", "not");
  const tree = document.querySelector<HTMLElement>("aside")!;
  button(tree, "New Chapter").click(); button(tree, "+ New Scene").click(); for (const rename of [...tree.querySelectorAll<HTMLButtonElement>("button")].filter(button => button.textContent === "Rename")) rename.click();
  assert.equal(tree.querySelector(".tree-inline"), null); assert.ok(panel.isConnected && hasSceneDraft(s.host)); assert.equal(s.calls.length, 0);
  button(panel, "Cancel").click(); button(tree, "New Chapter").click(); const name = tree.querySelector<HTMLInputElement>(".tree-inline input")!; name.value = "Retained chapter name"; name.dispatchEvent(new Event("input", { bubbles: true })); button(s.host, "Add Condition").click(); assert.equal(s.host.querySelector(".story-operation"), null); assert.equal(name.value, "Retained chapter name"); assert.ok(name.isConnected); await s.close();
});

test("unchanged pending condition commit locks tree authoring and cannot admit another tree draft", async () => {
  let finish!: (value: SceneWorkspace) => void; const pending = new Promise<SceneWorkspace>(resolve => { finish = resolve; }); const s = setup(async () => pending);
  button(selectBeat(s.host, "if"), "Apply condition").click(); const tree = document.querySelector<HTMLElement>("aside")!; assert.equal(button(tree, "New Chapter").disabled, true); button(tree, "New Chapter").click(); assert.equal(tree.querySelector(".tree-inline"), null); assert.equal(s.calls.length, 1); finish(s.model); await tick(); assert.equal(button(tree, "New Chapter").disabled, false); await s.close();
});

test("unresolved manual conditions stop a whole-scene preview at the header, and pass it with unknown state toward a selected beat", async () => {
  const s = setup(); const header = s.model.scenes[0]!.beats[0]!;
  const scene = { ...s.model.scenes[0]!, beats: [header, { id: "body", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload: { type: "narration" as const, text: "Selected body" } }, { id: "root-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "42" } }, { id: "root-background", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "background" as const, assetId: "bg", transition: "none" as const } }, { id: "root-text", byteStart: 70, byteEnd: 80, protected: false, payload: { type: "narration" as const, text: "Explicit continuation" } }] };
  for (const choice of [undefined, "removed-branch"]) { const state = deriveScenePreview(scene, undefined, choice ? new Map([["group", choice]]) : new Map()); assert.equal(state.partial, true); assert.equal(state.throughBeatId, "if"); assert.equal(state.variables.trust, undefined); assert.equal(state.background, undefined); assert.equal(state.overlay, undefined); }
  const matched = deriveScenePreview(scene, "body", new Map([["group", "if"]])); assert.equal(matched.overlay?.text, "Selected body"); assert.equal(matched.throughBeatId, "body");
  // Toward a selected beat, a closed condition leaves state unknown and the preview continues.
  const passed = deriveScenePreview(scene, "root-text", new Map()); assert.equal(passed.overlay?.text, "Explicit continuation"); assert.equal(passed.throughBeatId, "root-text"); assert.equal(passed.background?.assetId, "bg"); assert.equal(passed.variables.trust?.value, "42"); assert.equal(passed.partial, true); assert.deepEqual(passed.unknownBeatIds, ["if"]);
  const unknown = deriveScenePreview(scene, "root-value", new Map()); assert.equal(unknown.background, undefined); assert.equal(unknown.backgroundUnknown, true); await s.close();
});


test("end markers and editor paths name the scene, branch or option and never say body", async () => {
  const fixture = storyFixture(); const scene = fixture.scenes[0]!;
  const menu = { id: "menu", byteStart: 900, byteEnd: 910, protected: false, payload: { type: "choice" as const, options: [{ id: "stay", text: "Stay" }, { id: "leave", text: "Leave" }] } };
  const option = (id: string, ordinal: number) => ({ id, byteStart: 910 + ordinal, byteEnd: 911 + ordinal, protected: true, conditionalBranch: { choiceOption: true, groupId: "options", ordinal, otherwise: false }, payload: { type: "customCode" as const, source: "option", reason: "Option" } });
  const line = { id: "leaving", byteStart: 920, byteEnd: 930, protected: false, owner: { groupId: "options", branchId: "leave" }, payload: { type: "narration" as const, text: "She walks into the rain." } };
  const beats = [...scene.beats.filter(beat => beat.id !== "end"), menu, option("stay", 0), option("leave", 1), line];
  const s = setup(undefined, { ...fixture, scenes: [{ ...scene, beats }, fixture.scenes[1]!] });
  const ends = (): string[] => [...s.host.querySelectorAll<HTMLElement>(".story-track-end-text")].map(node => node.textContent!);
  assert.deepEqual(ends(), ["End of scene"]);
  openBranch(s.host, "if"); openBranch(s.host, "leave");
  assert.deepEqual(ends(), ['End of "If flag"', 'End of option 2 "Leave"', "End of scene"]);
  assert.equal(selectBeat(s.host, "leaving").querySelector(".story-breadcrumb")!.textContent, 'Arrival › Option 2 "Leave"');
  assert.doesNotMatch(s.host.textContent!, /\bbody\b/i);
  // Long conditions shorten with whole words, then an ellipsis, as in the Branch path.
  assert.equal(shorten("has_ticket and trust ≥ 3 and not missed_tram"), "has_ticket and trust ≥ 3…"); assert.equal(shorten("trust ≥ 5"), "trust ≥ 5");
  await s.close();
});

test("Tracks insertion markers open a new beat at the place core lists for them", async () => {
  const s = setup(); const opener = (key: string) => s.host.querySelector<HTMLButtonElement>(`.story-tracks [data-beat-opener="${key}"]`)!;
  // Each marker opens a new beat whose Insert in and Insert before name its core place.
  const place = (key: string): [string, string] => {
    opener(key).click(); const panel = s.host.querySelector<HTMLElement>(".new-beat")!; assert.ok(panel, key);
    const result: [string, string] = [panel.querySelector<HTMLSelectElement>('[aria-label="Insert in"]')!.value, panel.querySelector<HTMLSelectElement>('[aria-label="Insert before"]')!.value];
    button(panel, "Cancel").click(); return result;
  };
  assert.deepEqual(place("after:call"), ["root", "after-call"]);
  assert.deepEqual(place("end:scene"), ["root", "end"]);
  openBranch(s.host, "if");
  assert.deepEqual(place("after:if"), ["root", "choice"]);
  assert.deepEqual(place("last:if"), ["if", "end"]);
  openBranch(s.host, "otherwise");
  assert.deepEqual(place("first:otherwise"), ["otherwise", "end"]);
  // The added beat goes through the ordinary insert command at that place.
  opener("after:call").click(); const panel = s.host.querySelector<HTMLElement>(".new-beat")!;
  choose(panel, "Beat type", "narration"); const text = panel.querySelector<HTMLTextAreaElement>("textarea")!; text.value = "Inserted from Tracks"; text.dispatchEvent(new Event("input", { bubbles: true }));
  button(panel, "Add Beat").click(); await tick();
  assert.deepEqual({ body: s.calls[0]!.command.body, position: s.calls[0]!.command.position }, { body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "after-call" } } });
  await s.close();
});

test("Reel draws the Tracks route; switching views keeps selection, branches, a new beat's place and drafts, and sends nothing", async () => {
  const s = setup(undefined, storyFixture(1)); const view = (name: string): void => { s.host.querySelector<HTMLButtonElement>(`.story-view-option[data-view="${name}"]`)!.click(); };
  const route = (): string[] => [...s.host.querySelectorAll<HTMLElement>(".story-route > :not(.story-track-labels)")].map(item => `${item.className}|${item.dataset.beatId ?? item.dataset.branchId ?? (item.dataset.newBeat ? "new" : "")}|${item.dataset.depth ?? ""}`);
  const pressed = (): string[] => [...s.host.querySelectorAll<HTMLElement>(".story-branch-segment")].filter(item => item.ariaPressed === "true").map(item => item.dataset.branchId!);
  const selected = (): string[] => [...s.host.querySelectorAll<HTMLElement>('.story-route [data-selected="true"]')].map(item => item.closest<HTMLElement>("[data-beat-id], [data-new-beat]")!.dataset.beatId ?? "new");
  // Tracks starts selected. Reel shows the same route: nested beats, markers and the empty slot.
  assert.equal(s.host.querySelector('.story-view-option[aria-pressed="true"]')?.textContent, "Tracks");
  openBranch(s.host, "if"); openBranch(s.host, "nested-if-0"); const tracks = route().map(item => item.replace("story-route story-tracks", "")); view("reel");
  assert.equal(s.host.querySelector(".story-panel")?.getAttribute("aria-label"), "Reel"); assert.equal(s.host.querySelector(".story-track-labels"), null);
  assert.deepEqual(route(), tracks); assert.ok(route().some(item => item.startsWith("story-track-column|deep|2")));
  // Edit a nested beat in Reel, then switch: the same editor keeps its draft, and nothing is sent.
  trackColumn(s.host, "deep")!.querySelector<HTMLButtonElement>(".story-track-beat")!.click(); const field = textarea(s.host);
  field.value = "Still writing"; field.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  view("tracks"); assert.equal(textarea(s.host), field); assert.equal(field.value, "Still writing");
  assert.deepEqual(selected(), ["deep"]); assert.deepEqual(pressed(), ["if", "nested-if-0"]); assert.equal(trackColumn(s.host, "deep")!.dataset.beatDraft, "true");
  assert.equal(document.activeElement?.getAttribute("data-view"), "tracks", "focus stays on the view switch");
  // Add the first beat of the empty Otherwise from Reel. The new beat keeps its place in Tracks.
  view("reel"); openBranch(s.host, "otherwise"); assert.ok(trackColumn(s.host, "otherwise")?.classList.contains("story-track-slot"));
  button(trackColumn(s.host, "otherwise")!, "+ Add a beat").click(); await tick();
  const added = storyEditor(s.host).querySelector<HTMLElement>(".new-beat")!; textarea(s.host).value = "First in Otherwise"; textarea(s.host).dispatchEvent(new Event("input", { bubbles: true })); await tick();
  const placed = route().find(item => item.includes("story-track-pending")); assert.ok(placed?.endsWith("|new|1"), "the new beat sits inside Otherwise");
  view("tracks"); assert.equal(route().find(item => item.includes("story-track-pending")), placed); assert.deepEqual(selected(), ["new"]);
  assert.equal(storyEditor(s.host).querySelector(".new-beat"), added); assert.equal(textarea(s.host).value, "First in Otherwise");
  // The nested draft is marked on its closed condition in both views.
  assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true"); view("reel"); assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true");
  assert.deepEqual(s.calls, [], "switching views commits nothing"); await s.close();
});
