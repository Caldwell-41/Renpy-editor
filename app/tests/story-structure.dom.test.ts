import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildRuleBuilder } from "../src/story-condition-editor.js";
import { deriveScenePreview, type Condition, type SceneActions, type SceneBeat, type SceneCommand, type SceneWorkspace, type StoryTarget } from "../src/scene-ui.js";
import { renderBranches, type FlowBody } from "../src/branches-ui.js";
import { chooseIn, editorFixture, editorProject, flagCondition, withBodies, mountStory, openBranch, pickKind, placeRows, press, selectBeat, storyBeat, storyEditor, storyFixture, renderStoryView, texts, trackColumn, type } from "./story-controls-fixture.js";
import { shorten } from "../src/story-tracks.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup(apply?: (command: SceneCommand) => Promise<SceneWorkspace>, fixture = storyFixture(3), extra: Partial<SceneActions> = {}) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>'; const host = document.querySelector<HTMLElement>("main")!; const model = fixture; const calls: { command: SceneCommand; expected: unknown }[] = []; const status: string[] = []; const navigation: StoryTarget[] = []; const continuations: unknown[] = [];
  const view = renderStoryView(host, document.querySelector("aside")!, model, { apply: async (command, expected) => { calls.push({ command, expected }); return apply ? apply(command) : model; }, resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, status: text => status.push(text), viewScene: target => navigation.push(target), viewContinuation: (...args) => continuations.push(args), viewSource: () => {}, ...extra }); const dispose = view.dispose;
  return { browser, host, model, calls, status, navigation, continuations, view, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function button(host: ParentNode, text: string): HTMLButtonElement { const found = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === text); assert.ok(found, text); return found; }
function choose(host: ParentNode, aria: string, value: string): HTMLSelectElement { const control = host.querySelector<HTMLSelectElement>(`select[aria-label="${aria}"]`)!; assert.ok(control, aria); control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); return control; }
function textarea(host: ParentNode): HTMLTextAreaElement { return storyEditor(host).querySelector<HTMLTextAreaElement>("textarea")!; }

test("rule builder reads variable rules, keeps half-typed numbers and leaves a test it cannot show as written", async () => {
  const s = setup(); const variables = s.model.authoring.variables;
  const trust = { type: "variable" as const, variableId: "trust", variableType: "int" as const }, flag = { type: "variable" as const, variableId: "flag", variableType: "bool" as const };
  const original = { status: "supported" as const, expression: { type: "and" as const, left: { type: "and" as const, left: { type: "compare" as const, operator: "greaterEqual" as const, left: trust, right: { type: "int" as const, value: "9223372036854775807" } }, right: flag }, right: { type: "compare" as const, operator: "notEqual" as const, left: { type: "variable" as const, variableId: "name", variableType: "string" as const }, right: { type: "string" as const, value: "Bec" } } } };
  const builder = buildRuleBuilder(variables, original, { keyword: "if", label: "If", empty: "", required: true }); document.body.append(builder.host);
  // Untouched, it reads back the exact condition from source, and each rule shows as written.
  assert.equal(builder.read(), original); assert.equal(builder.host.querySelector(".story-rule-code")!.textContent, 'if trust >= 9223372036854775807 and flag and name != "Bec":');
  const radio = (label: string, index: number): HTMLButtonElement => [...builder.host.querySelectorAll<HTMLElement>(".story-rule")[index]!.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(item => item.textContent === label || item.getAttribute("aria-label") === label)!;
  radio("is at most", 0).click(); radio("is false", 1).click(); [...builder.host.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(item => item.textContent === "Any")!.click();
  const value = builder.host.querySelector<HTMLInputElement>('input[aria-label="If rule 1 value"]')!;
  value.value = "-"; value.dispatchEvent(new Event("input", { bubbles: true }));
  assert.equal(value.hasAttribute("aria-invalid"), false, "Typing never marks a half-typed number");
  value.dispatchEvent(new Event("blur")); assert.equal(value.getAttribute("aria-invalid"), "true"); assert.throws(() => builder.read()); assert.equal(value.value, "-");
  value.value = "1.5"; value.dispatchEvent(new Event("input", { bubbles: true })); assert.equal(value.hasAttribute("aria-invalid"), false);
  assert.deepEqual(builder.read(), { status: "supported", expression: { type: "or", left: { type: "or", left: { type: "compare", operator: "lessEqual", left: trust, right: { type: "decimal", value: "1.5" } }, right: { type: "compare", operator: "equal", left: flag, right: { type: "bool", value: false } } }, right: original.expression.right } });
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

test("changing one rule keeps every other rule as source wrote it", async () => {
  const s = setup(); const variables = s.model.authoring.variables;
  const flag = { type: "variable" as const, variableId: "flag", variableType: "bool" as const }, trust = { type: "variable" as const, variableId: "trust", variableType: "int" as const };
  const notFlag = { type: "not" as const, operand: flag }, unchanged = { type: "compare" as const, operator: "notEqual" as const, left: flag, right: { type: "bool" as const, value: false } };
  const original = { status: "supported" as const, expression: { type: "and" as const, left: { type: "and" as const, left: notFlag, right: unchanged }, right: { type: "compare" as const, operator: "greaterEqual" as const, left: trust, right: { type: "int" as const, value: "3" } } } };
  const builder = buildRuleBuilder(variables, original, { keyword: "if", label: "If", empty: "", required: true }); document.body.append(builder.host);
  assert.equal(builder.host.querySelector(".story-rule-code")!.textContent, "if not flag and flag != False and trust >= 3:");
  type(builder.host.querySelector<HTMLInputElement>('input[aria-label="If rule 3 value"]')!, "4");
  assert.deepEqual(builder.read(), { status: "supported", expression: { type: "and", left: { type: "and", left: notFlag, right: unchanged }, right: { type: "compare", operator: "greaterEqual", left: trust, right: { type: "int", value: "4" } } } });
  assert.equal(builder.host.querySelector(".story-rule-code")!.textContent, "if not flag and flag != False and trust >= 4:");
  await s.close();
});

test("+ New variable creates a project variable in place and the rule uses it", async () => {
  const requests: unknown[] = [];
  const s = setup(undefined, storyFixture(3), { createVariable: async request => {
    requests.push(request);
    return withBodies({ ...s.model, projectRevision: "project-2", authoring: { ...s.model.authoring, variables: [...s.model.authoring.variables, { id: "late", technicalName: request.technicalName, variableType: request.variableType, defaultValue: false }] } });
  } });
  button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>(".story-editor .new-beat")!;
  const summary = (): HTMLElement => panel.querySelector<HTMLElement>(".story-variable-picker > summary")!;
  const dialog = (): HTMLElement | null => s.host.querySelector<HTMLElement>(".story-new-variable");
  // Escape keeps nothing and returns to the variable list.
  summary().click(); press(panel, "+ New variable…"); assert(dialog());
  dialog()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(dialog(), null); assert.equal(document.activeElement, summary()); assert.deepEqual(requests, []);
  // An invalid name stays in its field with the reason; nothing is created.
  summary().click(); press(panel, "+ New variable…");
  const name = dialog()!.querySelector<HTMLInputElement>('input[aria-label="Variable name"]')!; type(name, "9 late");
  press(dialog()!, "Create variable"); await tick();
  assert.match(dialog()!.querySelector(".field-error")!.textContent!, /^Variable name must begin with a letter/); assert.equal(name.value, "9 late"); assert.deepEqual(requests, []);
  type(name, "late_tram"); press(dialog()!, "Create variable"); await tick();
  assert.deepEqual(requests, [{ technicalName: "late_tram", variableType: "bool", defaultValue: false }]);
  assert.equal(dialog(), null); assert.equal(summary().getAttribute("aria-label"), "If rule 1 variable: late_tram");
  assert.equal(panel.querySelector(".story-rule-code")!.textContent, "if late_tram == True:");
  // The condition commits against the workspace the new variable came from.
  button(panel, "Add Condition").click(); await tick();
  assert.deepEqual(s.calls[0]!.command.type === "insertCondition" && s.calls[0]!.command.condition, { status: "supported", expression: { type: "compare", operator: "equal", left: { type: "variable", variableId: "late", variableType: "bool" }, right: { type: "bool", value: true } } });
  assert.deepEqual(s.calls[0]!.expected, { projectRevision: "project-2", sourceMapRevision: "map" });
  await s.close();
});

test("a new condition is a draft that writes the rule builder's typed test at its place in one command", async () => {
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>(".story-editor .new-beat")!;
  assert.equal(panel.dataset.beatType, "condition"); assert.equal(panel.querySelector(".story-editor-title")!.textContent, "New · Condition");
  assert.deepEqual([...panel.querySelectorAll(".story-where dd")].map(item => item.textContent), ["Before 05 Return", "Arrival", "04 Narration"]);
  // The form starts with one rule on the first variable; a second rule joins it.
  press(panel, "+ Add rule"); const rule = panel.querySelectorAll<HTMLElement>(".story-rule")[1]!;
  rule.querySelector<HTMLElement>(".story-variable-picker > summary")!.click(); chooseIn(rule, "If rule 2 variable", "trust, whole number");
  chooseIn(panel, "If match", "Any"); type(panel.querySelector<HTMLInputElement>('input[aria-label="If rule 2 value"]')!, "3");
  assert.equal(panel.querySelector(".story-rule-code")!.textContent, "if flag == True or trust >= 3:");
  // It waits as a draft, like a new beat: navigation keeps it and writes nothing.
  const otherwise = panel.querySelector<HTMLInputElement>('input[aria-label="Include Otherwise"]')!; otherwise.checked = true; otherwise.dispatchEvent(new Event("change", { bubbles: true }));
  selectBeat(s.host, "a", "if"); assert.equal(s.calls.length, 0); assert.equal(s.host.querySelector<HTMLElement>(".story-track-pending")!.dataset.beatDraft, "true");
  s.host.querySelector<HTMLElement>(".story-track-pending > .story-track-beat")!.click(); assert.equal(storyEditor(s.host).querySelector(".new-beat"), panel);
  button(panel, "Add Condition").click(); await tick();
  const command = s.calls[0]!.command; assert.equal(command.type, "insertCondition"); assert.deepEqual(command.body, { type: "root" }); assert.equal(command.otherwise, true); assert.deepEqual(s.calls[0]!.expected, { projectRevision: "project", sourceMapRevision: "map" });
  assert.deepEqual(command.condition, { status: "supported", expression: { type: "or", left: { type: "compare", operator: "equal", left: { type: "variable", variableId: "flag", variableType: "bool" }, right: { type: "bool", value: true } }, right: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "3" } } } });
  await s.close();
});

test("a new Else if is a draft that exposes first-match order and captures the containing group parent", async () => {
  const s = setup(); button(selectBeat(s.host, "if"), "+ Add Else if").click();
  const panel = s.host.querySelector<HTMLElement>('.story-branch-new[aria-label="New Else if"]')!; choose(panel, "Branch position", "elif");
  // Adding again returns to the waiting draft.
  button(storyEditor(s.host), "+ Add Else if").click(); assert.equal(s.host.querySelectorAll(".story-branch-new").length, 1);
  button(panel, "Add Else If").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "addConditionBranch"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" }); assert.equal(s.calls[0]!.command.beforeBranchId, "elif"); await s.close();
});

test("nested Otherwise creation and condition editing use group-parent qualification, not selected branch ownership", async () => {
  const s = setup(); button(selectBeat(s.host, "nested-if-0", "if"), "Add Otherwise").click(); button(s.host.querySelector('.story-branch-new[aria-label="New Otherwise"]')!, "Add Otherwise").click(); await tick();
  assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); assert.equal(s.calls[0]!.command.condition, null); assert.equal(s.calls[0]!.command.beforeBranchId, null);
  // The nested condition's editor edits its If test as a draft with Commit test.
  const test = storyEditor(s.host).querySelector<HTMLElement>('.story-branch-test[aria-label="If comparison"]')!; button(test, "Commit test").click(); await tick();
  assert.equal(s.calls[1]!.command.type, "updateConditionBranch"); assert.deepEqual(s.calls[1]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); await s.close();
});

test("Move to opens on the beat's own place with nothing chosen, leaves its place out and keeps the choice on core refusal", async () => {
  const s = setup(async () => { throw Error("Cannot safely promote inline comments. Use Source."); }); button(selectBeat(s.host, "a", "if"), "Move to…").click();
  const dialog = s.host.querySelector<HTMLElement>(".story-move")!; assert.equal(dialog.getAttribute("aria-label"), "Move 01.1 Narration");
  const items = (): { text: string; level: string; open: string | null; chosen: string | null }[] => [...dialog.querySelectorAll<HTMLElement>("[role=treeitem]")].map(item => ({ text: item.textContent!.slice(1), level: item.getAttribute("aria-level")!, open: item.getAttribute("aria-expanded"), chosen: item.getAttribute("aria-selected") }));
  // The scene and If are open; the other branches stay closed. 01.1 and the place after it are left out.
  assert.deepEqual(items().filter(item => item.open !== null).map(item => [item.text, item.open]), [["Arrival", "true"], ["If flag", "true"], ["If (trust is at least 5)", "false"], ['Else if (trust is at least 5)', "false"], ["Otherwise", "false"]]);
  assert.ok(!items().some(item => item.text === "Before 01.1 Narration" || item.text === "Before 01.2 Narration"));
  assert.equal(items().find(item => item.text === "01.1 Narration · here now")?.chosen, null);
  assert.equal(items().find(item => item.chosen === "true"), undefined);
  assert.equal(dialog.querySelector(".story-summary")!.textContent, "01.1 Narration is first in If flag now. Choose where to move it.");
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
  // Move needs a chosen place.
  button(dialog, "Move").click(); await tick(); assert.equal(s.calls.length, 0);
  dialog.querySelector<HTMLElement>("[role=treeitem][aria-selected]")!.click();
  button(dialog, "Move").click(); await tick(); assert.deepEqual(s.calls[0]!.command.node, { type: "condition", groupId: "group" });
  // An Else If header is a branch of its condition, never a Tracks beat of its own.
  openBranch(s.host, "elif"); assert.equal(trackColumn(s.host, "elif"), undefined); assert.ok(trackColumn(s.host, "maybe")); await s.close();
});

test("delete whole group and selected unwrap remain distinct; initial If cannot be removed as a branch", async () => {
  const s = setup(); const branches = selectBeat(s.host, "if").querySelectorAll<HTMLElement>(".story-branch-editor");
  assert.deepEqual([...branches].map(section => [section.dataset.branchId, [...section.querySelectorAll("button")].some(button => button.getAttribute("aria-label")?.startsWith("Remove this "))]), [["if", false], ["elif", true], ["otherwise", true]]);
  button(storyEditor(s.host), "Unwrap…").click(); let panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Unwrap one branch"]')!; choose(panel, "Branch to keep", "elif"); button(panel, "Unwrap selected branch").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "unwrapCondition"); assert.equal(s.calls[0]!.command.branchId, "elif"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" });
  button(storyEditor(s.host), "Delete condition").click(); panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Delete entire condition"]')!; button(panel, "Delete entire condition").click(); await tick(); assert.equal(s.calls[1]!.command.type, "removeStoryNode"); assert.deepEqual(s.calls[1]!.command.node, { type: "condition", groupId: "group" }); await s.close();
});

test("Unwrap with no branch to keep marks the field, writes nothing, and Apply focuses it", async () => {
  const s = setup(); selectBeat(s.host, "if");
  button(storyEditor(s.host), "Unwrap…").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Unwrap one branch"]')!;
  const branch = choose(panel, "Branch to keep", "none"); assert.equal(branch.value, "");
  button(panel, "Unwrap selected branch").click(); await tick();
  assert.equal(s.calls.length, 0); assert.equal(branch.getAttribute("aria-invalid"), "true"); assert.equal(document.activeElement, branch);
  choose(panel, "Branch to keep", "elif"); button(panel, "Unwrap selected branch").click(); await tick();
  assert.equal(s.calls[0]!.command.branchId, "elif"); await s.close();
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

test("a manual branch preview keeps a constant Set variable, such as fare = 4.50, and drops one that reads a variable", async () => {
  const s = setup(); const header = s.model.scenes[0]!.beats[0]!;
  const assigned = (id: string, operand: string, readVariables: { variableId: string; technicalName: string; variableType: "decimal" }[]) => ({ id, owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false,
    payload: { type: "setVariable" as const, variableId: id, value: { operation: "assign" as const, operand } },
    assignment: { inferredResultType: "decimal" as const, readVariables, diagnostics: [], reads: readVariables.map(v => v.technicalName), writes: [id], state: { status: "known" as const, value: 4.5 } } });
  const scene = { ...s.model.scenes[0]!, beats: [header, assigned("fare", "4.50", []), assigned("tip", "fare * 1", [{ variableId: "fare", technicalName: "fare", variableType: "decimal" }])] };
  const state = deriveScenePreview(scene, "tip", new Map([["group", "if"]]));
  assert.equal(state.variables.fare?.value, 4.5); assert.equal(state.variables.tip, undefined); assert.deepEqual(state.unknownBeatIds, ["tip"]); await s.close();
});

test("whole-group confirmation and collapse summary count protected Custom Code and branches", async () => {
  const fixture = storyFixture(); const scene = fixture.scenes[0]!;
  const opaque = { id: "opaque", byteStart: 65, byteEnd: 70, protected: true, owner: { groupId: "group", branchId: "if" }, payload: { type: "customCode" as const, source: "        custom_code()", reason: "Unsupported source" } };
  const s = setup(undefined, { ...fixture, scenes: [{ ...scene, beats: [...scene.beats.slice(0, 3), opaque, ...scene.beats.slice(3)] }, fixture.scenes[1]!] });
  assert.match(selectBeat(s.host, "if").querySelector(".story-condition-summary")!.textContent!, /3 branches \/ 5 Beats/);
  button(storyEditor(s.host), "Delete condition").click(); assert.match(s.host.querySelector('.story-operation[aria-label="Delete entire condition"]')!.textContent!, /all 5 contained Beats/); await s.close();
});

test("a condition draft waits while tree New works; dirty tree input blocks adding a condition", async () => {
  const s = setup(); const tree = document.querySelector<HTMLElement>("aside")!;
  button(tree, "New Chapter").click(); const name = tree.querySelector<HTMLInputElement>(".tree-inline input")!; name.value = "Retained chapter name"; name.dispatchEvent(new Event("input", { bubbles: true }));
  button(s.host, "Add Condition").click(); assert.equal(s.host.querySelector(".new-beat"), null); assert.equal(name.value, "Retained chapter name"); assert.ok(name.isConnected);
  button(tree.querySelector<HTMLElement>(".tree-inline")!, "Cancel").click();
  button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>(".story-editor .new-beat")!; chooseIn(panel, "If rule 1 comparison", "is false");
  button(tree, "New Chapter").click(); assert.ok(tree.querySelector(".tree-inline")); assert.ok(panel.isConnected && s.view.hasDrafts()); assert.equal(s.calls.length, 0); await s.close();
});

test("unchanged pending condition commit locks tree authoring and cannot admit another tree draft", async () => {
  let finish!: (value: SceneWorkspace) => void; const pending = new Promise<SceneWorkspace>(resolve => { finish = resolve; }); const s = setup(async () => pending);
  button(selectBeat(s.host, "if").querySelector<HTMLElement>('.story-branch-test[aria-label="If comparison"]')!, "Commit test").click(); const tree = document.querySelector<HTMLElement>("aside")!; assert.equal(button(tree, "New Chapter").disabled, true); button(tree, "New Chapter").click(); assert.equal(tree.querySelector(".tree-inline"), null); assert.equal(s.calls.length, 1); finish(s.model); await tick(); assert.equal(button(tree, "New Chapter").disabled, false); await s.close();
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
  assert.deepEqual(place("after:call"), ["Before 04 Narration", "Arrival", "03 Call scene"]);
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

test("a Choice's option beats number by option, as 05.2.1, in Tracks, Reel, the Choice editor and Move to", async () => {
  const s = setup(undefined, editorFixture());
  // story-combined-editor / replace-v2: Choice, option, beat. A condition's branches count on (01.1, 01.2).
  const number = (id: string): string | undefined => trackColumn(s.host, id)?.querySelector(".story-beat-number")?.textContent ?? undefined;
  openBranch(s.host, "opt1"); assert.deepEqual(["ask", "maybe"].map(number), ["05.1.1", "05.1.2"]);
  openBranch(s.host, "opt2"); assert.deepEqual(["walk", "leave"].map(number), ["05.2.1", "05.2.2"]);
  openBranch(s.host, "opt3"); assert.equal(number("code"), "05.3.1");
  s.host.querySelector<HTMLButtonElement>('.story-view-option[data-view="reel"]')!.click(); assert.equal(number("code"), "05.3.1", "Reel");
  const editor = selectBeat(s.host, "choice");
  assert.deepEqual([...editor.querySelectorAll(".story-option-beat-number")].map(item => item.textContent), ["05.1.1", "05.1.2", "05.2.1", "05.3.1"]);
  button(selectBeat(s.host, "walk", "opt2"), "Move to…").click();
  assert.equal(s.host.querySelector<HTMLElement>(".story-move")!.getAttribute("aria-label"), "Move 05.2.1 Narration");
  await s.close();
});

test("the toolbar's + Add beat adds after the selected beat in its own scene, branch or option, never past its ending", async () => {
  const s = setup();
  // story-revamp / combined-v1: the toolbar adds after the selection, at most at the place before its body's ending.
  const place = (id: string, ...branches: string[]): string[] => {
    selectBeat(s.host, id, ...branches); button(s.host, "+ Add beat").click();
    const dialog = s.host.querySelector<HTMLElement>(".story-add-beat")!; assert.ok(dialog, id);
    const result = [...dialog.querySelectorAll(".story-where dd")].map(item => item.textContent!);
    dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); return result;
  };
  assert.deepEqual(place("a", "if"), ["Before 01.2 Narration", "Arrival › If flag", "01.1 Narration"]);
  assert.deepEqual(place("b"), ["Before 01.3 Condition", "Arrival › If flag", "01.2 Narration"]);
  assert.deepEqual(place("nested-if-0"), ['End of "If flag"', "Arrival › If flag", "01.3 Condition"]);
  assert.deepEqual(place("call"), ["Before 04 Narration", "Arrival", "03 Call scene"]);
  assert.deepEqual(place("end"), ["Before 05 Return", "Arrival", "04 Narration"]);
  // The new beat goes where the dialog said.
  selectBeat(s.host, "a"); button(s.host, "+ Add beat").click(); const panel = pickKind(s.host, "Narration");
  type(panel.querySelector<HTMLTextAreaElement>("textarea")!, "After the first line"); button(panel, "Add Beat").click(); await tick();
  assert.deepEqual({ body: s.calls[0]!.command.body, position: s.calls[0]!.command.position }, { body: { type: "branch", groupId: "group", branchId: "if" }, position: { type: "before", anchor: { type: "beat", beatId: "b" } } });
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

test("picker sheets preview on hover and focus, apply on click and keep the value on Escape", async () => {
  const s = setup(undefined, editorFixture());
  try {
    const stage = (): string[] => [...s.host.querySelectorAll<HTMLImageElement>(".preview-canvas .preview-background, .preview-canvas .preview-character img")].map(image => image.alt);
    const tile = (value: string): HTMLButtonElement => s.host.querySelector<HTMLButtonElement>(`.story-sheet .story-tile[data-value="${value}"]`)!;
    let editor = selectBeat(s.host, "bg");
    const background = (): HTMLSelectElement => storyEditor(s.host).querySelector<HTMLSelectElement>('select[aria-label="Background"]')!;
    assert.equal(stage()[0], "Rainy platform");
    const change = press(editor, "Change background: Rainy platform");
    // Pointing at or focusing a tile previews it on the stage; nothing becomes a draft.
    tile("depot").dispatchEvent(new Event("pointerenter")); assert.equal(stage()[0], "Depot at night");
    tile("dawn").focus(); assert.equal(stage()[0], "Station at dawn");
    assert.equal(background().value, "platform"); assert.equal(s.view.hasDrafts(), false);
    // Escape closes the sheet, restores the stage and keeps the value.
    tile("dawn").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert.equal(s.host.querySelector(".story-sheet"), null); assert.equal(document.activeElement, change);
    assert.equal(stage()[0], "Rainy platform"); assert.equal(background().value, "platform"); assert.equal(s.view.hasDrafts(), false);
    // Click applies the picture to the draft without a write.
    press(editor, "Change background: Rainy platform"); tile("depot").click();
    assert.equal(s.host.querySelector(".story-sheet"), null); assert.equal(background().value, "depot");
    assert.equal(stage()[0], "Depot at night"); assert.equal(s.view.hasDrafts(), true); assert.equal(s.calls.length, 0);
    press(storyEditor(s.host), "Cancel"); await tick();
    // The expression sheet previews the character's appearance the same way.
    editor = selectBeat(s.host, "show"); assert(stage().includes("Mara — Neutral"));
    press(editor, "Change expression: Neutral"); tile("mara-concerned").dispatchEvent(new Event("pointerenter"));
    assert(stage().includes("Mara — Concerned")); assert.equal(s.view.hasDrafts(), false);
    tile("mara-concerned").dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    assert(stage().includes("Mara — Neutral")); assert.equal(s.view.hasDrafts(), false);
  } finally { await s.close(); }
});

test("condition drafts are retained and marked, and Story Save saves them with the branch deletion last", async () => {
  const saved: { commands: readonly SceneCommand[]; drafts: readonly string[] }[] = [];
  const s = setup(undefined, storyFixture(3), { saveDrafts: async (commands, _expected, drafts) => { saved.push({ commands, drafts }); return s.model; } });
  const branch = (id: string): HTMLElement => storyEditor(s.host).querySelector<HTMLElement>(`.story-branch-editor[data-branch-id="${id}"]`)!;
  selectBeat(s.host, "if");
  // Editing the If test makes it a draft; the condition's column and the branch show it.
  chooseIn(branch("if").querySelector<HTMLElement>(".story-branch-test")!, "If rule 1 comparison", "is false");
  assert.equal(trackColumn(s.host, "if")!.dataset.beatDraft, "true");
  assert.equal(branch("if").querySelector(".story-editor-state")!.textContent, "* Draft");
  // "Remove this Else if" marks the Else if; + Add Else if adds a new one. Neither writes.
  press(branch("elif"), "Remove this Else if"); assert.ok(branch("elif").querySelector(".story-branch-removal"));
  button(storyEditor(s.host), "+ Add Else if").click(); assert.ok(storyEditor(s.host).querySelector(".story-branch-new"));
  assert.equal(s.calls.length, 0);
  // Leaving the condition and coming back keeps all three.
  selectBeat(s.host, "a", "if"); selectBeat(s.host, "if");
  assert.equal(branch("if").querySelector<HTMLElement>('[role=radiogroup][aria-label="If rule 1 comparison"] [aria-checked=true]')?.textContent, "is false");
  assert.ok(branch("elif").querySelector(".story-branch-removal")); assert.ok(storyEditor(s.host).querySelector(".story-branch-new"));
  assert.equal((await s.view.save()).kind, "saved");
  assert.deepEqual(saved[0]!.commands.map(command => command.type), ["updateConditionBranch", "addConditionBranch", "removeConditionBranch"]);
  assert.equal(new Set(saved[0]!.drafts).size, 3);
  await s.close();
});

test("+ New scene in an option's scene sheet sends that option to a new scene in one command", async () => {
  const s = setup(undefined, editorFixture());
  const option = (id: string): HTMLElement => storyEditor(s.host).querySelector<HTMLElement>(`.story-option[data-option-id="${id}"]`)!;
  const dialog = (): HTMLElement | null => s.host.querySelector<HTMLElement>(".story-new-scene");
  selectBeat(s.host, "choice");
  // Option 2 goes to Depot: its destination opens the sheet, whose "+ New scene…" names what it replaces.
  press(option("opt2"), "Change where option 2 goes: Depot"); press(s.host.querySelector<HTMLElement>(".story-sheet")!, "+ New scene…");
  assert.equal(s.host.querySelector(".story-sheet"), null); assert.equal(dialog()!.getAttribute("aria-label"), "New scene for option 2");
  assert.equal(dialog()!.querySelector(".story-dialog-note")!.textContent, 'Option 2 "Leave" will lead here. It currently goes to Depot. The new scene replaces that destination; Depot is kept. You stay in this scene.');
  // An empty name stays with the reason; Escape keeps nothing.
  press(dialog()!, "Create scene and link option 2"); await tick();
  assert.equal(dialog()!.querySelector(".field-error")!.textContent, "Enter a scene name."); assert.equal(s.calls.length, 0);
  dialog()!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); assert.equal(dialog(), null); assert.equal(s.calls.length, 0);
  // Option 1 continues: Then's Go to a scene opens the same sheet.
  option("opt1").querySelector<HTMLElement>(".story-outcome > summary")!.click();
  [...option("opt1").querySelectorAll<HTMLElement>(".story-outcome [role=option]")].find(item => item.getAttribute("aria-label")!.startsWith("Go to a scene."))!.click();
  press(s.host.querySelector<HTMLElement>(".story-sheet")!, "+ New scene…");
  assert.equal(dialog()!.querySelector(".story-dialog-note")!.textContent, 'Option 1 "Ask about the last tram" will lead here. You stay in this scene.');
  type(dialog()!.querySelector<HTMLInputElement>('input[aria-label="Scene name"]')!, "Quiet room");
  press(dialog()!, "Create scene and link option 1"); await tick();
  assert.deepEqual(s.calls.map(call => call.command), [{ type: "createSceneFromChoice", sceneId: "one", expectedSourceRevision: "source-one", choiceBeatId: "choice", optionId: "opt1", chapterId: "chapter", displayName: "Quiet room" }]);
  assert.equal(dialog(), null);
  await s.close();
});

test("Remove branch saves the drafts inside the branch first, and cancels the branch's own test", async () => {
  const saved: { commands: readonly SceneCommand[] }[] = [];
  const s = setup(undefined, storyFixture(3), { saveDrafts: async commands => { saved.push({ commands }); return s.model; } });
  const branch = (id: string): HTMLElement => storyEditor(s.host).querySelector<HTMLElement>(`.story-branch-editor[data-branch-id="${id}"]`)!;
  // A beat draft inside the Else if, and an edit to the Else if's own test.
  type(selectBeat(s.host, "maybe", "elif").querySelector("textarea")!, "Edited inside");
  selectBeat(s.host, "if"); chooseIn(branch("elif").querySelector<HTMLElement>(".story-branch-test")!, "Else if rule 1 comparison", "≤");
  press(branch("elif"), "Remove this Else if");
  const removal = branch("elif").querySelector<HTMLElement>(".story-branch-removal")!;
  assert.match(removal.textContent!, /Drafts inside it are saved first/);
  assert.equal(branch("elif").querySelector(".story-branch-test"), null);
  press(removal, "Remove branch"); await tick();
  assert.deepEqual(saved[0]!.commands.map(command => command.type), ["updateBodyBeat", "removeConditionBranch"], "the cancelled test is not saved; the inner beat saves before the removal");
  assert.equal(s.calls.length, 0);
  await s.close();
});

test("the Tracks Characters lane names the character, expression and position", async () => {
  const s = mountStory(editorProject([
    storyBeat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-concerned", placement: "left", transition: "none" }),
    storyBeat("look", { type: "changeAppearance", characterId: "eli", appearanceId: "eli-neutral", transition: "none" }),
    storyBeat("move", { type: "placement", characterId: "mara", placement: "centre" }),
    storyBeat("hide", { type: "hideCharacter", characterId: "eli", transition: "dissolve" }),
  ]));
  const lane = (id: string): string => [...s.host.querySelectorAll<HTMLElement>(".story-route [data-beat-id]")].find(column => column.dataset.beatId === id)!.querySelector(".story-lane-2")!.textContent!;
  assert.deepEqual(["show", "look", "move", "hide"].map(lane), ["Mara · Concerned · Left", "Eli · Neutral", "Mara → Centre", "Hide Eli"]);
  await s.close();
});

/** Condition 01: If has_ticket, two Else if tests core could not read, and Otherwise. */
function brokenCondition(missing: Condition = { status: "unknown", source: "ticket_count == 2", diagnostic: "missingVariable" }): SceneWorkspace {
  const header = (id: string, ordinal: number, condition?: Condition): SceneBeat => storyBeat(id, { type: "customCode", source: "", reason: "Condition header" }, { protected: true, conditionalBranch: { groupId: "test", ordinal, otherwise: !condition, ...condition ? { condition } : {} } });
  const inside = (id: string, branchId: string): SceneBeat => storyBeat(id, { type: "narration", text: `Inside ${branchId}.` }, { owner: { groupId: "test", branchId } });
  const model = editorProject([
    header("if", 0, { status: "supported", expression: { type: "variable", variableId: "flag", variableType: "bool" } }), inside("in-if", "if"),
    header("missing", 1, missing), inside("in-missing", "missing"),
    header("type", 2, { status: "unknown", source: "destination >= 3", diagnostic: "typeMismatch" }), inside("in-type", "type"),
    header("else", 3), inside("in-else", "else"),
    storyBeat("after", { type: "narration", text: "The doors close behind them." }),
  ]);
  return { ...model, authoring: { ...model.authoring, variables: [...model.authoring.variables, { id: "destination", technicalName: "destination", variableType: "string", defaultValue: "Depot" }] } };
}

test("a condition names each branch the builder can't edit, why, and what to do, in the builder, Tracks and the Branch path", async () => {
  const fixed = brokenCondition({ status: "supported", expression: { type: "compare", operator: "equal", left: { type: "variable", variableId: "count", variableType: "int" }, right: { type: "int", value: "2" } } });
  const requests: unknown[] = [];
  const s = mountStory(brokenCondition(), { createVariable: async request => { requests.push(request); return { ...fixed, projectRevision: "project-2", authoring: { ...fixed.authoring, variables: [...fixed.authoring.variables, { id: "count", technicalName: "ticket_count", variableType: "int", defaultValue: "0" }] } }; } });
  const flow = (): HTMLElement => [...s.host.querySelectorAll<HTMLElement>(".story-route [data-beat-id]")].find(column => column.dataset.beatId === "if")!.querySelector<HTMLElement>(".story-lane-5")!;
  assert.equal(flow().textContent, "2 branches to fix"); assert.ok(flow().classList.contains("story-lane-warn"));
  const editor = selectBeat(s.host, "if");
  assert.deepEqual(texts(editor, ".story-condition-problems li > span"), ["Else if ticket_count = 2: ticket_count is not a project variable.", "Else if destination ≥ 3: destination is text, and ≥ only compares numbers."]);
  const branch = (id: string): HTMLElement => editor.querySelector<HTMLElement>(`.story-branch-editor[data-branch-id="${id}"]`)!;
  assert.deepEqual(["if", "missing", "type", "else"].map(id => branch(id).querySelector(".story-branch-head > strong")!.textContent), ["If", "Else if !", "Else if !", "Otherwise"]);
  const code = branch("missing").querySelector<HTMLElement>(".story-rule-code")!;
  assert.equal(code.textContent, "elif ticket_count == 2:"); assert.equal(code.getAttribute("aria-invalid"), "true");
  assert.equal(document.getElementById(code.getAttribute("aria-describedby")!)!.textContent, "ticket_count is not a project variable. Create it, or change this line in Source. Until then, the builder can't edit this branch.");
  assert.deepEqual(texts(branch("missing"), ".story-rule-actions > button"), ["Create ticket_count…", "Edit in Source"]);
  assert.equal(branch("type").querySelector(".story-rule-error")!.textContent, "destination is text, and ≥ only compares numbers. Use = or ≠ in Source. Until then, the builder can't edit this branch.");
  assert.deepEqual(texts(branch("type"), ".story-rule-actions > button"), ["Edit in Source"]);
  // The Branch path caption follows the pressed branch and names its problem.
  const caption = (): HTMLElement => s.host.querySelector<HTMLElement>(".story-branch-test")!;
  assert.deepEqual(texts(s.host, ".story-branch-segment"), ["If", "Else if !", "Else if !", "Otherwise"]);
  press(branch("type"), "Open");
  assert.equal(caption().textContent, "destination ≥ 3 · wrong type"); assert.ok(caption().classList.contains("story-branch-warn"));
  [...s.host.querySelectorAll<HTMLButtonElement>(".story-branch-segment")].find(item => item.dataset.branchId === "else")!.click();
  assert.equal(caption().textContent, "has_ticket"); assert.equal(caption().classList.contains("story-branch-warn"), false);
  // Create ticket_count… opens New variable for it; the branch the variable fixes leaves the list.
  press(selectBeat(s.host, "if").querySelector<HTMLElement>('.story-branch-editor[data-branch-id="missing"]')!, "Create ticket_count…");
  const dialog = s.host.querySelector<HTMLElement>(".story-new-variable")!;
  assert.equal(dialog.querySelector<HTMLInputElement>('input[aria-label="Variable name"]')!.value, "ticket_count");
  press(dialog, "Create variable"); await tick();
  assert.deepEqual(requests, [{ technicalName: "ticket_count", variableType: "int", defaultValue: "0" }]);
  assert.deepEqual(texts(storyEditor(s.host), ".story-condition-problems li > span"), ["Else if destination ≥ 3: destination is text, and ≥ only compares numbers."]);
  assert.equal(flow().textContent, "1 branch to fix");
  await s.close();
});

test("the rule builder words each problem for a branch or an option, and names its comparisons", async () => {
  const s = mountStory(brokenCondition()), variables = editorFixture().authoring.variables;
  const flag = { type: "variable" as const, variableId: "flag", variableType: "bool" as const };
  const shown = (condition: Condition, subject?: "branch" | "option"): HTMLElement => { const builder = buildRuleBuilder(variables, condition, { keyword: "if", label: "Option 1", empty: "", required: false, newVariable: async () => undefined, source: () => {}, ...subject ? { subject } : {} }); document.body.append(builder.host); return builder.host; };
  const missing = shown({ status: "unknown", source: "ticket_count == 2", diagnostic: "missingVariable" }, "option");
  assert.equal(missing.querySelector(".story-rule-error")!.textContent, "ticket_count is not a project variable. Create it, or change this line in Source. Until then, the builder can't edit this option.");
  assert.equal(shown({ status: "unknown", source: "renpy.seen_label('x')", diagnostic: "unsupportedSyntax" }).querySelector(".story-rule-error")!.textContent, "The builder can't show this Python. Until then, edit it in Source.");
  assert.equal(shown({ status: "supported", expression: { type: "and", left: flag, right: { type: "or", left: flag, right: flag } } }).querySelector(".story-field-hint")!.textContent, "This mixes All and Any. The builder can't edit it. Edit it in Source.");
  // Screen readers name each rule's test a comparison.
  const rule = shown({ status: "supported", expression: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "3" } } });
  chooseIn(rule, "Option 1 rule 1 comparison", "≤"); assert.ok(rule.querySelector('select[aria-label="Option 1 rule 1 comparison"]'));
  await s.close();
});

test("Add a beat says Condition branches on a variable, and a branch with no rules says to add one", async () => {
  const s = mountStory(brokenCondition());
  const editor = selectBeat(s.host, "if");
  assert.ok(editor.querySelector('.story-branch-test[aria-label="If comparison"]'));
  press(editor.querySelector<HTMLElement>('.story-branch-editor[data-branch-id="if"]')!, "Remove rule 1");
  assert.equal(editor.querySelector('.story-branch-editor[data-branch-id="if"] .story-rule-code')!.textContent, "Add a rule to this branch.");
  press(editor.querySelector<HTMLElement>('.story-branch-editor[data-branch-id="if"]')!, "Commit test"); await tick();
  assert.equal(s.status.at(-1), "Add a rule to this branch."); assert.deepEqual(s.calls, []);
  press(s.host, "+ Add beat"); const dialog = s.host.querySelector<HTMLElement>(".story-add-beat")!;
  [...dialog.querySelectorAll<HTMLButtonElement>(".story-result")].find(item => item.textContent === "Condition")!.dispatchEvent(new Event("pointerenter"));
  assert.equal(dialog.querySelector(".story-picker-details > p")!.textContent, "Branches on a variable, then the story continues.");
  await s.close();
});

/** The last service with protected Custom Code at 04, between Mara's line and Eli's line. */
const protectedScene = (): SceneWorkspace => editorProject([
  storyBeat("bg", { type: "background", assetId: "platform", transition: "none" }),
  storyBeat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-neutral", placement: "centre", transition: "none" }),
  storyBeat("line", { type: "dialogue", characterId: "mara", text: "You heard the bell too?" }),
  storyBeat("code", { type: "customCode", source: "    $ renpy.notify(\"Last call\")", reason: "Custom Code" }, { protected: true }),
  storyBeat("eli", { type: "dialogue", characterId: "eli", text: "Last call. Are you getting on?" }),
  storyBeat("close", { type: "narration", text: "The doors close behind them." }),
]);


test("the + on the beat before protected Custom Code adds right before the region", async () => {
  const model = protectedScene(), s = mountStory(model);
  const plus = s.host.querySelector<HTMLButtonElement>('.story-route [data-beat-opener="after:line"]')!;
  assert.equal(plus.title, "Add after 03 Mara's line, before 04 Custom Code"); assert.equal(plus.ariaLabel, plus.title);
  plus.click();
  const panel = pickKind(s.host, "Narration");
  assert.deepEqual(placeRows(panel), ["Goes at", "Before 04 Custom Code", "In", "The last service", "After", "03 Mara's line"]);
  type(panel.querySelector("textarea")!, "The bell rings twice.");
  press(panel, "Add Beat"); await tick();
  assert.deepEqual(s.calls.at(-1), { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: model.scenes[0]!.sourceRevision, body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "code" } }, beat: { type: "narration", text: "The bell rings twice." } });
  // The region itself adds after it.
  assert.equal(s.host.querySelector<HTMLButtonElement>('.story-route [data-beat-opener="after:code"]')!.title, "Add after 04 Custom Code");
  await s.close();
});

test("Move to lists the place before protected Custom Code, shows the region and the beat's own place, and preselects nothing", async () => {
  const model = protectedScene(), s = mountStory(model);
  press(selectBeat(s.host, "eli"), "Move to…");
  const dialog = s.host.querySelector<HTMLElement>(".story-move")!;
  const rows = (): string[] => [...dialog.querySelectorAll<HTMLElement>("[role=treeitem]")].map(item => `${item.getAttribute("aria-disabled") === "true" ? "-" : item.getAttribute("aria-selected") === "true" ? "*" : " "}${item.lastElementChild!.textContent}`);
  // Before 06 Narration would leave 05 where it is, so it is not offered.
  assert.deepEqual(rows(), [" The last service", " Before 01 Background", " Before 02 Show character", " Before 03 Mara's line", " Before 04 Custom Code",
    "-04 Custom Code · protected, stays in place", "-05 Eli's line · here now", " End of scene"]);
  assert.equal(dialog.querySelector(".story-dialog-note")!.textContent, "Moves this beat to the chosen scene, branch or option. Protected Custom Code stays where it is.");
  assert.equal(dialog.querySelector(".story-summary")!.textContent, "05 Eli's line is after 04 Custom Code now. Choose where to move it.");
  // A row that can't be chosen stays unchosen, by click and by keyboard.
  const row = (text: string): HTMLElement => [...dialog.querySelectorAll<HTMLElement>("[role=treeitem]")].find(item => item.lastElementChild!.textContent === text)!;
  row("04 Custom Code · protected, stays in place").click();
  assert.equal(dialog.querySelector('[aria-selected="true"]'), null);
  press(dialog, "Move"); await tick(); assert.deepEqual(s.calls, []);
  const tree = dialog.querySelector<HTMLElement>("[role=tree]")!, key = (name: string): void => { tree.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true })); };
  row("Before 04 Custom Code").click(); key("ArrowDown");
  assert.equal(document.activeElement!.textContent!.slice(1), "End of scene");
  key("ArrowUp"); key("Enter");
  assert.equal(dialog.querySelector(".story-summary")!.textContent, "Move to The last service · Before 04 Custom Code");
  press(dialog, "Move"); await tick();
  assert.deepEqual(s.calls.at(-1), { type: "moveStoryNode", sceneId: "one", expectedSourceRevision: model.scenes[0]!.sourceRevision, node: { type: "beat", beatId: "eli" }, expectedBody: { type: "root" }, body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "code" } } });
  await s.close();
});

test("Move to never offers the place that leaves a beat where it is", async () => {
  const s = mountStory(protectedScene());
  const offered = (id: string): string[] => { press(selectBeat(s.host, id), "Move to…"); const dialog = s.host.querySelector<HTMLElement>(".story-move")!; const list = texts(dialog, '[role=treeitem][aria-selected]').map(text => text.slice(1)); press(dialog, "Close without moving"); return list; };
  assert.deepEqual(offered("line"), ["Before 01 Background", "Before 02 Show character", "Before 05 Eli's line", "Before 06 Narration", "End of scene"]);
  assert.deepEqual(offered("close"), ["Before 01 Background", "Before 02 Show character", "Before 03 Mara's line", "Before 04 Custom Code", "Before 05 Eli's line"]);
  await s.close();
});

/** editorFixture with a second chapter: Depot and Platform 4 in Chapter 2. */
function chapters(): SceneWorkspace {
  const model = editorFixture(), platform = { ...model.scenes[1]!, id: "platform", displayName: "Platform 4", technicalLabel: "platform", sourcePath: "game/platform.rpy", chapterId: "second" };
  return { ...model, chapters: [...model.chapters, { id: "second", displayName: "Chapter 2", directory: "game/chapter_02" }], scenes: [...model.scenes.map(scene => scene.id === "two" ? { ...scene, chapterId: "second" } : scene), platform] };
}
const scenesOf = (tree: ParentNode): string[] => [...tree.querySelectorAll<HTMLElement>(".tree-chapter")].flatMap(chapter => [chapter.querySelector(".tree-chapter-toggle")!.textContent!,
  ...[...chapter.querySelectorAll<HTMLElement>(".tree-scene-open")].filter(row => !row.closest("[hidden]")).map(row => `  ${row.textContent}`)]);


test("the scene list groups scenes under chapter headings that collapse and expand", async () => {
  const s = mountStory(chapters()), tree = document.querySelector("aside")!;
  assert.deepEqual(scenesOf(tree), ["▾The Last Tram", "  The last service", "▾Chapter 2", "  Depot", "  Platform 4"]);
  const toggle = [...tree.querySelectorAll<HTMLButtonElement>(".tree-chapter-toggle")].find(item => item.textContent === "▾Chapter 2")!;
  const scenes = document.getElementById(toggle.getAttribute("aria-controls")!)!;
  assert.equal(toggle.ariaExpanded, "true"); assert.ok(scenes.classList.contains("tree-chapter-scenes")); assert.equal(scenes.querySelectorAll(".tree-scene-row").length, 2);
  // The chapter's own actions stay in its menu beside the heading.
  assert.deepEqual(texts(toggle.closest(".tree-chapter-row")!, ".tree-menu button"), ["Rename", "↑", "↓", "Delete"]);
  toggle.click();
  assert.equal(toggle.ariaExpanded, "false"); assert.equal(scenes.hidden, true);
  assert.deepEqual(scenesOf(tree), ["▾The Last Tram", "  The last service", "▸Chapter 2"]);
  // Collapsing is view state: it sends nothing and outlasts a redraw.
  selectBeat(s.host, "line");
  assert.deepEqual(scenesOf(tree), ["▾The Last Tram", "  The last service", "▸Chapter 2"]);
  [...tree.querySelectorAll<HTMLButtonElement>(".tree-chapter-toggle")].find(item => item.textContent === "▸Chapter 2")!.click();
  assert.deepEqual(scenesOf(tree), ["▾The Last Tram", "  The last service", "▾Chapter 2", "  Depot", "  Platform 4"]);
  assert.deepEqual(s.calls, []);
  await s.close();
});

/** Deletes a scene from its menu in the scene list, as the author does, and returns its row. */
async function deleteScene(tree: ParentNode, name: string): Promise<HTMLElement> {
  const row = [...tree.querySelectorAll<HTMLElement>(".tree-scene-row")].find(item => item.querySelector(".tree-scene-open")!.textContent === name)!;
  row.querySelector<HTMLElement>(".tree-menu > summary")!.click();
  press(row.querySelector(".tree-menu")!, "Delete");
  assert.equal(row.querySelector(".confirm-row > span")!.textContent, `Delete scene "${name}"? Undo restores it.`);
  press(row, "Confirm delete"); await tick();
  return row;
}
const refused = (references: { beats: object[]; protectedCode: object[] }) => async (): Promise<never> => { throw Object.assign(Error("The Scene has incoming or unknown references and cannot be deleted safely."), { code: "INCOMING_REFERENCE", references }); };
const reference = (beatId: string, kind: string, sceneId = "one", sceneName = "The last service") => ({ sceneId, sceneName, beatId, kind });
const refusalOf = (row: HTMLElement) => {
  const block = row.nextElementSibling as HTMLElement;
  assert.ok(block.classList.contains("story-scene-refusal")); assert.equal(block.role, "alert"); assert.equal(document.activeElement, block);
  return { block, head: block.querySelector(".story-refusal-head > p")!.textContent, rows: [...block.querySelectorAll<HTMLButtonElement>(".story-refusal-row")].map(item => texts(item, "span")), tail: block.querySelector(".story-refusal-tail")!.textContent };
};


test("a refused scene delete names each beat that goes to it in the scene list, and each opens that beat", async () => {
  const s = mountStory(chapters(), { apply: refused({ beats: [reference("leave", "jump"), reference("depot-line", "call", "platform", "Platform 4")], protectedCode: [] }) }), tree = document.querySelector("aside")!;
  const row = await deleteScene(tree, "Depot");
  const refusal = refusalOf(row);
  assert.equal(row.querySelector(".confirm-row"), null);
  assert.equal(refusal.head, "Can't delete \"Depot\". 2 beats go to it:");
  assert.deepEqual(refusal.rows, [["The last service", "05.2.2 Jump"], ["Platform 4", "02 Call scene"]]);
  assert.equal(refusal.tail, "Change or remove them, then delete again. Nothing was deleted.");
  assert.equal(s.status.at(-1), "Can't delete \"Depot\". Nothing was deleted.");
  // A row opens its beat, in its option.
  refusal.block.querySelector<HTMLButtonElement>(".story-refusal-row")!.click(); await tick();
  assert.equal(s.host.querySelector<HTMLElement>('.story-route [data-beat-id="leave"] > .story-track-beat')!.dataset.selected, "true");
  assert.equal(document.activeElement, s.host.querySelector('.story-route [data-beat-id="leave"] > .story-track-beat'));
  await s.close();
});

test("the refusal names Custom Code that may jump to the scene, or Custom Code inside it, and × closes it", async () => {
  let s = mountStory(chapters(), { apply: refused({ beats: [], protectedCode: [reference("code", "customCode")] }) });
  let refusal = refusalOf(await deleteScene(document.querySelector("aside")!, "Depot"));
  assert.equal(refusal.head, "Can't delete \"Depot\". Custom Code may jump to it, and Loomlight can't check where it goes:");
  assert.deepEqual(refusal.rows, [["The last service", "05.3.1 Custom Code"]]);
  assert.equal(refusal.tail, "Change that code in Source first. Nothing was deleted.");
  const row = refusal.block.previousElementSibling as HTMLElement;
  press(refusal.block, "Close"); assert.equal(refusal.block.isConnected, false); assert.equal(document.activeElement, row.querySelector(".tree-scene-open"));
  await s.close();
  s = mountStory(chapters(), { apply: refused({ beats: [reference("leave", "jump")], protectedCode: [reference("depot-line", "customCode", "two", "Depot")] }) });
  refusal = refusalOf(await deleteScene(document.querySelector("aside")!, "Depot"));
  assert.equal(refusal.head, "Can't delete \"Depot\". 1 beat goes to it, and it holds Custom Code that deleting would drop:");
  assert.deepEqual(refusal.rows, [["The last service", "05.2.2 Jump"], ["Depot", "02 Custom Code"]]);
  assert.equal(refusal.tail, "Change or remove them, then delete again. Nothing was deleted.");
  await s.close();
});
