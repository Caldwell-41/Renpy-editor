import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildRuleBuilder } from "../src/story-condition-editor.js";
import { deriveScenePreview, hasSceneDraft, type SceneCommand, type SceneWorkspace, type StoryTarget } from "../src/scene-ui.js";
import { renderBranches, type FlowBody } from "../src/branches-ui.js";
import { chooseIn, flagCondition, openBranch, pickKind, press, selectBeat, storyEditor, storyFixture, renderStoryView, trackColumn, type } from "./story-controls-fixture.js";
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

test("rule builder reads variable rules, keeps half-typed numbers and leaves a test it cannot show as written", async () => {
  const s = setup(); const variables = s.model.authoring.variables;
  const trust = { type: "variable" as const, variableId: "trust", variableType: "int" as const }, flag = { type: "variable" as const, variableId: "flag", variableType: "bool" as const };
  const original = { status: "supported" as const, expression: { type: "and" as const, left: { type: "and" as const, left: { type: "compare" as const, operator: "greaterEqual" as const, left: trust, right: { type: "int" as const, value: "9223372036854775807" } }, right: flag }, right: { type: "compare" as const, operator: "notEqual" as const, left: { type: "variable" as const, variableId: "name", variableType: "string" as const }, right: { type: "string" as const, value: "Bec" } } } };
  const builder = buildRuleBuilder(variables, original, { keyword: "if", label: "If", empty: "", required: true }); document.body.append(builder.host);
  // Untouched, it reads back the exact condition from source.
  assert.equal(builder.read(), original); assert.equal(builder.host.querySelector(".story-rule-code")!.textContent, 'if trust >= 9223372036854775807 and flag and name != "Bec":');
  const radio = (label: string, index: number): HTMLButtonElement => [...builder.host.querySelectorAll<HTMLElement>(".story-rule")[index]!.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(item => item.textContent === label || item.getAttribute("aria-label") === label)!;
  radio("is at most", 0).click(); radio("is false", 1).click(); [...builder.host.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(item => item.textContent === "Any")!.click();
  const value = builder.host.querySelector<HTMLInputElement>('input[aria-label="If rule 1 value"]')!;
  value.value = "-"; value.dispatchEvent(new Event("input", { bubbles: true }));
  assert.equal(value.hasAttribute("aria-invalid"), false, "Typing never marks a half-typed number");
  value.dispatchEvent(new Event("blur")); assert.equal(value.getAttribute("aria-invalid"), "true"); assert.throws(() => builder.read()); assert.equal(value.value, "-");
  value.value = "1.5"; value.dispatchEvent(new Event("input", { bubbles: true })); assert.equal(value.hasAttribute("aria-invalid"), false);
  assert.deepEqual(builder.read(), { status: "supported", expression: { type: "or", left: { type: "or", left: { type: "compare", operator: "lessEqual", left: trust, right: { type: "decimal", value: "1.5" } }, right: { type: "not", operand: flag } }, right: original.expression.right } });
  // Removing a rule leaves the others; the last rule cannot leave a branch without a test.
  for (const remove of [...builder.host.querySelectorAll<HTMLButtonElement>('button[aria-label^="Remove rule"]')].reverse()) remove.click();
  assert.throws(() => builder.read(), /Add a rule/);
  // Mixed All and Any stays as written, with Edit in Source.
  let opened = 0;
  const mixed = { status: "supported" as const, expression: { type: "and" as const, left: flag, right: { type: "or" as const, left: flag, right: { type: "not" as const, operand: flag } } } };
  const readOnly = buildRuleBuilder(variables, mixed, { keyword: "elif", label: "Else if", empty: "", required: true, source: () => { opened++; }, caption: "flag and (flag or not flag)" });
  assert.equal(readOnly.editable, false); assert.equal(readOnly.read(), mixed); assert.equal(readOnly.host.querySelector("input, select"), null);
  [...readOnly.host.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === "Edit in Source")!.click(); assert.equal(opened, 1);
  await s.close();
});

test("create Condition writes the rule builder's typed test at the root place in one command", async () => {
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!;
  assert.deepEqual([...panel.querySelectorAll(".story-where dd")].map(item => item.textContent), ["Before 05 Return", "Arrival", "04 Narration"]);
  // The form starts with one rule on the first variable; a second rule joins it.
  press(panel, "+ Add rule"); const rule = panel.querySelectorAll<HTMLElement>(".story-rule")[1]!;
  rule.querySelector<HTMLElement>(".story-variable-picker > summary")!.click(); chooseIn(rule, "If rule 2 variable", "trust, whole number");
  chooseIn(panel, "If match", "Any"); type(panel.querySelector<HTMLInputElement>('input[aria-label="If rule 2 value"]')!, "3");
  assert.equal(panel.querySelector(".story-rule-code")!.textContent, "if flag or trust >= 3:");
  (panel.querySelector<HTMLInputElement>('input[aria-label="Include Otherwise"]')!).checked = true; button(panel, "Create Condition").click(); await tick();
  const command = s.calls[0]!.command; assert.equal(command.type, "insertCondition"); assert.deepEqual(command.body, { type: "root" }); assert.equal(command.otherwise, true); assert.deepEqual(s.calls[0]!.expected, { projectRevision: "project", sourceMapRevision: "map" });
  assert.deepEqual(command.condition, { status: "supported", expression: { type: "or", left: { type: "variable", variableId: "flag", variableType: "bool" }, right: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "3" } } } });
  await s.close();
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

test("Move to opens on the beat's own place, leaves its place out and keeps the choice on core refusal", async () => {
  const s = setup(async () => { throw Error("Cannot safely promote inline comments. Use Source."); }); button(selectBeat(s.host, "a", "if"), "Move to…").click();
  const dialog = s.host.querySelector<HTMLElement>(".story-move")!; assert.equal(dialog.getAttribute("aria-label"), "Move 01.1 Narration");
  const items = (): { text: string; level: string; open: string | null; chosen: string | null }[] => [...dialog.querySelectorAll<HTMLElement>("[role=treeitem]")].map(item => ({ text: item.textContent!.slice(1), level: item.getAttribute("aria-level")!, open: item.getAttribute("aria-expanded"), chosen: item.getAttribute("aria-selected") }));
  // The scene and If are open; the other branches stay closed. 01.1 and the place after it are left out.
  assert.deepEqual(items().filter(item => item.open !== null).map(item => [item.text, item.open]), [["Arrival", "true"], ["If flag", "true"], ["If (trust is at least 5)", "false"], ['Else if (trust is at least 5)', "false"], ["Otherwise", "false"]]);
  assert.ok(!items().some(item => item.text === "Before 01.1 Narration" || item.text === "Before 01.2 Narration"));
  assert.deepEqual(items().find(item => item.chosen === "true")?.text, "Before 01.3 Condition");
  assert.equal(dialog.querySelector(".story-summary")!.textContent, "Move to Arrival › If flag · Before 01.3 Condition");
  // Keyboard: Down to the Otherwise branch, Right opens it, Down and Enter choose its end.
  const tree = dialog.querySelector<HTMLElement>("[role=tree]")!; const key = (name: string): void => { tree.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true })); };
  while (document.activeElement?.textContent !== "▸Otherwise") key("ArrowDown");
  key("ArrowRight"); key("ArrowDown"); key("Enter");
  assert.equal(dialog.querySelector(".story-summary")!.textContent, "Move to Arrival › Otherwise · End of Otherwise");
  button(dialog, "Move").click(); await tick();
  assert.deepEqual(s.calls[0]!.command, { sceneId: "one", expectedSourceRevision: "source", type: "moveStoryNode", node: { type: "beat", beatId: "a" }, expectedBody: { type: "branch", groupId: "group", branchId: "if" }, body: { type: "branch", groupId: "group", branchId: "otherwise" }, position: { type: "end" } });
  assert.ok(dialog.isConnected, "A refused move keeps the dialog and the chosen place"); assert.equal(dialog.querySelector('[aria-selected="true"]')!.textContent, "●End of Otherwise"); assert.match(s.status.at(-1)!, /Input retained/);
  // Escape closes it without sending anything.
  dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(dialog.isConnected, false); assert.equal(s.calls.length, 1);
  await s.close();
});

test("whole condition move excludes own descendant bodies; headers never become ordinary Beat targets", async () => {
  const s = setup(); button(selectBeat(s.host, "if"), "Move to…").click(); const dialog = s.host.querySelector<HTMLElement>(".story-move")!;
  assert.deepEqual([...dialog.querySelectorAll<HTMLElement>('[role=treeitem][aria-expanded]')].map(item => item.textContent), ["▾Arrival"]);
  button(dialog, "Move").click(); await tick(); assert.deepEqual(s.calls[0]!.command.node, { type: "condition", groupId: "group" });
  // An Else If header is a branch of its condition, never a Tracks beat of its own.
  openBranch(s.host, "elif"); assert.equal(trackColumn(s.host, "elif"), undefined); assert.ok(trackColumn(s.host, "maybe")); await s.close();
});

test("delete whole group and selected unwrap remain distinct; initial If cannot be removed as a branch", async () => {
  const s = setup(); const branches = selectBeat(s.host, "if").querySelectorAll<HTMLElement>(".story-branch-editor");
  assert.deepEqual([...branches].map(section => [section.dataset.branchId, [...section.querySelectorAll("button")].some(button => button.textContent === "Delete branch")]), [["if", false], ["elif", true], ["otherwise", true]]);
  button(storyEditor(s.host), "Unwrap…").click(); let panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Unwrap one branch"]')!; choose(panel, "Branch to keep", "elif"); button(panel, "Unwrap selected branch").click(); await tick();
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
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!; chooseIn(panel, "If rule 1 test", "is false");
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

test("Tracks insertion markers open Add a beat at the place core lists for them", async () => {
  const s = setup(); const opener = (key: string) => s.host.querySelector<HTMLButtonElement>(`.story-tracks [data-beat-opener="${key}"]`)!;
  // Each marker opens Add a beat, which names where the beat goes: Goes at, In and After.
  const place = (key: string): string[] => {
    opener(key).click(); const dialog = s.host.querySelector<HTMLElement>(".story-add-beat")!; assert.ok(dialog, key);
    const result = [...dialog.querySelectorAll(".story-where dd")].map(item => item.textContent!);
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(s.host.querySelector(".story-add-beat"), null); return result;
  };
  assert.deepEqual(place("after:call"), ["Before 04 Narration", "Arrival", "03 Call Scene"]);
  assert.deepEqual(place("end:scene"), ["Before 05 Return", "Arrival", "04 Narration"]);
  openBranch(s.host, "if");
  assert.deepEqual(place("after:if"), ["Before 02 Choice", "Arrival", "01 Condition"]);
  assert.deepEqual(place("last:if"), ['End of "If flag"', "Arrival › If flag", "01.3 Condition"]);
  openBranch(s.host, "otherwise");
  assert.deepEqual(place("first:otherwise"), ["End of Otherwise", "Arrival › Otherwise"]);
  assert.equal(s.calls.length, 0, "Escape adds nothing");
  // An ending goes at the end; where the scene already ends, Add a beat names the ending it replaces.
  opener("after:call").click(); const dialog = s.host.querySelector<HTMLElement>(".story-add-beat")!;
  dialog.querySelector<HTMLElement>('[data-insert-kind="jump"]')!.dispatchEvent(new Event("pointerenter"));
  assert.deepEqual([...dialog.querySelectorAll(".story-where dd")].map(item => item.textContent), ["Replaces 05 Return", "Arrival", "04 Narration"]);
  assert.equal(dialog.querySelector(".story-picker-note")!.textContent, "Jump replaces 05 Return. Undo restores it.");
  // Enter adds the highlighted beat through the ordinary insert command at that place.
  const search = dialog.querySelector<HTMLInputElement>('input[aria-label="Find a beat"]')!; type(search, "narr");
  search.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); const panel = s.host.querySelector<HTMLElement>(".new-beat")!;
  type(panel.querySelector<HTMLTextAreaElement>("textarea")!, "Inserted from Tracks");
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
  // The scene's Return ends it, so Reel offers no + after it either.
  assert.equal(trackColumn(s.host, "end")!.querySelector(".story-track-insert"), null); assert.ok(trackColumn(s.host, "after-call")!.querySelector(".story-track-insert"));
  // Edit a nested beat in Reel, then switch: the same editor keeps its draft, and nothing is sent.
  trackColumn(s.host, "deep")!.querySelector<HTMLButtonElement>(".story-track-beat")!.click(); const field = textarea(s.host);
  field.value = "Still writing"; field.dispatchEvent(new Event("input", { bubbles: true })); await tick();
  view("tracks"); assert.equal(textarea(s.host), field); assert.equal(field.value, "Still writing");
  assert.deepEqual(selected(), ["deep"]); assert.deepEqual(pressed(), ["if", "nested-if-0"]); assert.equal(trackColumn(s.host, "deep")!.dataset.beatDraft, "true");
  assert.equal(document.activeElement?.getAttribute("data-view"), "tracks", "focus stays on the view switch");
  // Add the first beat of the empty Otherwise from Reel. The new beat keeps its place in Tracks.
  view("reel"); openBranch(s.host, "otherwise"); assert.ok(trackColumn(s.host, "otherwise")?.classList.contains("story-track-slot"));
  button(trackColumn(s.host, "otherwise")!, "+ Add a beat").click(); pickKind(s.host, "Narration"); await tick();
  const added = storyEditor(s.host).querySelector<HTMLElement>(".new-beat")!; textarea(s.host).value = "First in Otherwise"; textarea(s.host).dispatchEvent(new Event("input", { bubbles: true })); await tick();
  const placed = route().find(item => item.includes("story-track-pending")); assert.ok(placed?.endsWith("|new|1"), "the new beat sits inside Otherwise");
  view("tracks"); assert.equal(route().find(item => item.includes("story-track-pending")), placed); assert.deepEqual(selected(), ["new"]);
  assert.equal(storyEditor(s.host).querySelector(".new-beat"), added); assert.equal(textarea(s.host).value, "First in Otherwise");
  // The nested draft is marked on its closed condition in both views.
  assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true"); view("reel"); assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true");
  assert.deepEqual(s.calls, [], "switching views commits nothing"); await s.close();
});
