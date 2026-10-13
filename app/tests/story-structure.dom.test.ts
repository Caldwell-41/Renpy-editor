import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { buildConditionEditor } from "../src/story-condition-editor.js";
import { deriveScenePreview, hasSceneDraft, renderSceneAuthoring, type SceneCommand, type SceneWorkspace, type StoryTarget } from "../src/scene-ui.js";
import { renderBranches, type FlowBody } from "../src/branches-ui.js";
import { flagCondition, storyFixture } from "./story-controls-fixture.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };
function setup(apply?: (command: SceneCommand) => Promise<SceneWorkspace>, fixture = storyFixture(3)) {
  const browser = new Window(); Object.assign(globalThis, { window: browser, document: browser.document, HTMLElement: browser.HTMLElement, HTMLInputElement: browser.HTMLInputElement, HTMLSelectElement: browser.HTMLSelectElement, Event: browser.Event, KeyboardEvent: browser.KeyboardEvent });
  document.body.innerHTML = '<main></main><aside></aside>'; const host = document.querySelector<HTMLElement>("main")!; const model = fixture; const calls: { command: SceneCommand; expected: unknown }[] = []; const status: string[] = []; const navigation: StoryTarget[] = []; const continuations: unknown[] = [];
  const dispose = renderSceneAuthoring(host, document.querySelector("aside")!, model, { apply: async (command, expected) => { calls.push({ command, expected }); return apply ? apply(command) : model; }, resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); }, status: text => status.push(text), viewScene: target => navigation.push(target), viewContinuation: (...args) => continuations.push(args), viewSource: () => {} });
  return { browser, host, model, calls, status, navigation, continuations, close: async () => { dispose(); await browser.happyDOM.close(); } };
}
function button(host: ParentNode, text: string): HTMLButtonElement { const found = [...host.querySelectorAll<HTMLButtonElement>("button")].find(button => button.textContent === text); assert.ok(found, text); return found; }
function choose(host: ParentNode, aria: string, value: string): HTMLSelectElement { const control = host.querySelector<HTMLSelectElement>(`select[aria-label="${aria}"]`)!; assert.ok(control, aria); control.value = value; control.dispatchEvent(new Event("change", { bubbles: true })); return control; }
function row(host: ParentNode, id: string): HTMLElement { return host.querySelector<HTMLElement>(`[data-beat-id="${id}"]`)!; }
function open(host: ParentNode, id: string): void { row(host, id).querySelector<HTMLButtonElement>(".beat-select")!.click(); }

test("full condition builder hydrates All/Any/Not, exact values and boolean comparison operands without flattening", async () => {
  const s = setup(); const expression = { type: "and" as const, left: { type: "not" as const, operand: { type: "variable" as const, variableId: "flag", variableType: "bool" as const } }, right: { type: "or" as const, left: { type: "compare" as const, operator: "equal" as const, left: { type: "bool" as const, value: true }, right: { type: "not" as const, operand: { type: "bool" as const, value: false } } }, right: { type: "compare" as const, operator: "greaterEqual" as const, left: { type: "variable" as const, variableId: "trust", variableType: "int" as const }, right: { type: "int" as const, value: "9223372036854775807" } } } };
  const editor = buildConditionEditor(s.model.authoring.variables, { status: "supported", expression }); document.body.append(editor.host); assert.deepEqual(editor.read().expression, expression); await s.close();
});

test("create Condition submits explicit root anchor and full typed boolean combinations in one command", async () => {
  const s = setup(); button(s.host, "Add Condition").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!;
  choose(panel, "Condition type", "and"); const children = panel.querySelectorAll<HTMLElement>(".condition-combination > .condition-expression"); choose(children[0]!, "Condition type", "not"); choose(children[1]!, "Condition type", "bool");
  (panel.querySelector<HTMLInputElement>('input[aria-label="Include Otherwise"]')!).checked = true; button(panel, "Create Condition").click(); await tick();
  const command = s.calls[0]!.command; assert.equal(command.type, "insertCondition"); assert.deepEqual(command.body, { type: "root" }); assert.deepEqual(command.position, { type: "before", anchor: { type: "beat", beatId: "end" } }); assert.equal((command.condition as {expression:{type:string}}).expression.type, "and"); assert.equal(command.otherwise, true); assert.deepEqual(s.calls[0]!.expected, { projectRevision: "project", sourceMapRevision: "map" }); await s.close();
});

test("Else If insertion exposes first-match order and captures containing group parent", async () => {
  const s = setup(); const group = s.host.querySelector<HTMLElement>('[data-condition-group-id="group"]')!; button(group.querySelector('.story-group-heading')!, "Add Else If").click();
  const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Add Else If"]')!; choose(panel, "Branch position", "elif"); button(panel, "Create Else If").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "addConditionBranch"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" }); assert.equal(s.calls[0]!.command.beforeBranchId, "elif"); await s.close();
});

test("nested Otherwise creation and condition editing use group-parent qualification, not selected branch ownership", async () => {
  const s = setup(); const nested = s.host.querySelector<HTMLElement>('[data-condition-group-id="nested-0"]')!; button(nested.querySelector('.story-group-heading')!, "Add Otherwise").click(); button(s.host.querySelector('.story-operation')!, "Create Otherwise").click(); await tick();
  assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); assert.equal(s.calls[0]!.command.condition, null); assert.equal(s.calls[0]!.command.beforeBranchId, null);
  open(s.host, "nested-if-0"); const editor = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Edit Condition"]')!; button(editor, "Apply condition").click(); await tick(); assert.deepEqual(s.calls[1]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); await s.close();
});

test("explicit leaf move shows destination, excludes pass anchors and retains every field on core refusal", async () => {
  const s = setup(async () => { throw Error("Cannot safely promote inline comments. Use Source."); }); button(row(s.host, "a"), "Move to…").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Move story content"]')!;
  choose(panel, "Destination body", "otherwise"); assert.deepEqual([...panel.querySelector<HTMLSelectElement>('select[aria-label="Destination position"]')!.options].map(option => option.value), ["end"]); button(panel, "Move to destination").click(); await tick();
  assert.deepEqual(s.calls[0]!.command, { sceneId: "one", expectedSourceRevision: "source", type: "moveStoryNode", node: { type: "beat", beatId: "a" }, expectedBody: { type: "branch", groupId: "group", branchId: "if" }, body: { type: "branch", groupId: "group", branchId: "otherwise" }, position: { type: "end" } });
  assert.ok(panel.isConnected && hasSceneDraft(s.host)); assert.equal(panel.querySelector<HTMLSelectElement>('select[aria-label="Destination body"]')!.value, "otherwise"); assert.match(s.status.at(-1)!, /Input retained/); await s.close();
});

test("whole condition move excludes own descendant bodies; headers never become ordinary Beat targets", async () => {
  const s = setup(); button(row(s.host, "if"), "Move to…").click(); const panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Move story content"]')!; assert.deepEqual([...panel.querySelector<HTMLSelectElement>('select[aria-label="Destination body"]')!.options].map(option => option.value), ["root"]); button(panel, "Move to destination").click(); await tick(); assert.deepEqual(s.calls[0]!.command.node, { type: "condition", groupId: "group" }); assert.equal(button(row(s.host, "elif"), "Move to…").disabled, true); await s.close();
});

test("keyboard up/down moves use immediate body siblings and one captured transaction", async () => {
  const s = setup(); row(s.host, "a").querySelector<HTMLElement>(".beat-select")!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true })); await tick();
  assert.deepEqual(s.calls[0]!.command.position, { type: "before", anchor: { type: "condition", groupId: "nested-0" } }); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "branch", groupId: "group", branchId: "if" }); await s.close();
});

test("delete whole group and selected unwrap remain distinct; initial If cannot be removed as a branch", async () => {
  const s = setup(); open(s.host, "if"); assert.equal([...row(s.host, "if").querySelectorAll("button")].some(button => button.textContent === "Delete branch"), false); button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Unwrap…").click(); let panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Unwrap one branch"]')!; choose(panel, "Branch to keep", "elif"); button(panel, "Unwrap selected branch").click(); await tick();
  assert.equal(s.calls[0]!.command.type, "unwrapCondition"); assert.equal(s.calls[0]!.command.branchId, "elif"); assert.deepEqual(s.calls[0]!.command.expectedBody, { type: "root" });
  button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Delete condition").click(); panel = s.host.querySelector<HTMLElement>('.story-operation[aria-label="Delete entire condition"]')!; button(panel, "Delete entire condition").click(); await tick(); assert.equal(s.calls[1]!.command.type, "removeStoryNode"); assert.deepEqual(s.calls[1]!.command.node, { type: "condition", groupId: "group" }); await s.close();
});

test("manual preview never runs sibling bodies and changing its selection retains editing draft", async () => {
  const s = setup(); const scene = s.model.scenes[0]!;
  const preview = deriveScenePreview({ ...scene, beats: scene.beats.filter(beat => ["if", "a", "elif", "maybe", "otherwise", "empty"].includes(beat.id)) }, undefined, new Map([["group", "elif"]])); assert.equal(preview.overlay?.text, "Maybe another time."); assert.equal(preview.partial, false);
  open(s.host, "a"); const text = row(s.host, "a").querySelector<HTMLTextAreaElement>("textarea")!; text.value = "Retained draft"; text.dispatchEvent(new Event("input", { bubbles: true })); const selector = s.host.querySelector<HTMLSelectElement>('select[data-preview-group-id="group"]')!; selector.value = "otherwise"; selector.dispatchEvent(new Event("change", { bubbles: true })); assert.ok(text.isConnected); assert.equal(text.value, "Retained draft"); assert.equal(s.calls.length, 0); await s.close();
});

test("collapse cannot hide drafts; branch focus retains ancestors and empty pass is inert", async () => {
  const s = setup(); open(s.host, "a"); const text = row(s.host, "a").querySelector<HTMLTextAreaElement>("textarea")!; text.value = "Draft"; text.dispatchEvent(new Event("input", { bubbles: true })); button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Collapse condition").click(); assert.ok(text.isConnected); assert.equal(s.host.querySelector<HTMLElement>('[data-condition-group-id="group"] > .story-branches')!.hidden, false);
  button(row(s.host, "a"), "Cancel").click(); button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Collapse condition").click(); assert.equal(s.host.querySelector<HTMLElement>('[data-condition-group-id="group"] > .story-branches')!.hidden, true); button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Expand condition").click();
  button(s.host.querySelector('[data-branch-id="nested-if-2"].story-branch-body')!, "Focus this branch").click(); assert.ok(button(s.host, "Show whole Scene")); assert.match(s.host.querySelector('.beats-list > .story-breadcrumb')!.textContent!, /Arrival.*If.*trust/);
  const emptyScene = { ...s.model.scenes[0]!, beats: s.model.scenes[0]!.beats.filter(beat => ["if", "otherwise", "empty"].includes(beat.id)) }; const state = deriveScenePreview(emptyScene, undefined, new Map([["group", "otherwise"]])); assert.equal(state.partial, false); assert.equal(state.overlay, undefined); await s.close();
});

test("Call navigation captures target and caller revisions; continuation requests core-mapped location", async () => {
  const s = setup(); open(s.host, "call"); button(row(s.host, "call"), "Open called Scene").click(); assert.deepEqual(s.navigation[0], { sceneId: "two", expectedSourceRevision: "other", caller: { sceneId: "one", beatId: "call", expectedSourceRevision: "source", caller: undefined } }); button(row(s.host, "call"), "View Call continuation").click(); assert.deepEqual(s.continuations[0], ["one", "call", "source"]); await s.close();
});

test("Branches forwards selected guarded origin and exact body/continuation targets", async () => {
  const s = setup(); s.host.replaceChildren(); const location = { path: "game/arrival.rpy", revision: "source", byteStart: 20, byteEnd: 40 }; const body: FlowBody = { sceneId: "one", beatId: "a", owner: { groupId: "group", branchId: "if" }, location }; const calls: unknown[] = [];
  const edge = { id: "edge", sceneId: "one", beatId: "if", optionOrdinal: null, text: "If", kind: "guard", editable: true, location, destination: { kind: "body" as const, ...body }, continuation: body, condition: flagCondition };
  const dispose = renderBranches(s.host, { load: async () => ({ revision: "flow", entrySceneId: "one", nodes: [{ sceneId: "one", name: "Arrival", label: "arrival", location, partial: false, stale: false }], edges: [edge], partial: false, stale: false, overLimit: false, notice: "Observed" }), scene: (node, selected) => calls.push({ node, selected }), body: target => calls.push(target), source: () => {}, status: () => {} }); await tick(); choose(s.host, "Selected Scene", "one"); choose(s.host, "Selected route", "edge"); button(s.host, "Open Scene").click(); button(s.host, "Open destination body in Story").click(); button(s.host, "Open continuation in Story").click(); assert.equal((calls[0] as {selected:unknown}).selected, edge); assert.deepEqual(calls.slice(1), [{ kind: "body", ...body }, body]); dispose(); await s.close();
});

test("manual selected branch terminals and Choices stop before unvisited root effects", async () => {
  const s = setup(); const header = s.model.scenes[0]!.beats[0]!;
  for (const payload of [{ type: "return" as const }, { type: "jump" as const, sceneId: "two" }, { type: "choice" as const, options: [{ text: "Leave", destinationSceneId: "two" }] }]) {
    const scene = { ...s.model.scenes[0]!, beats: [header, { id: "terminal", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload }, { id: "unreachable-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "999" } }, { id: "unreachable-text", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "narration" as const, text: "Must not appear" } }] };
    const state = deriveScenePreview(scene, undefined, new Map([["group", "if"]])); assert.equal(state.overlay?.kind, payload.type); assert.equal(state.variables.trust, undefined); assert.notEqual(state.overlay?.text, "Must not appear"); assert.equal(state.throughBeatId, "terminal");
  }
  const guarded = { ...s.model.scenes[0]!, beats: [header, { id: "guarded", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload: { type: "choice" as const, options: [{ text: "Leave", destinationSceneId: "two", condition: flagCondition }] } }, { id: "unvisited-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "999" } }, { id: "unvisited-background", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "background" as const, assetId: "bg", transition: "none" as const } }, { id: "possible", byteStart: 70, byteEnd: 80, protected: false, payload: { type: "narration" as const, text: "Possible continuation" } }] };
  const state = deriveScenePreview(guarded, undefined, new Map([["group", "if"]])); assert.equal(state.partial, true); assert.equal(state.variablesUnknown, true); assert.deepEqual(state.unknownBeatIds, ["guarded"]); assert.equal(state.overlay?.kind, "choice"); assert.notEqual(state.overlay?.text, "Possible continuation"); assert.equal(state.throughBeatId, "guarded"); assert.equal(state.variables.trust, undefined); assert.equal(state.background, undefined); await s.close();
});

test("whole-group confirmation and collapse summary count protected Custom Code and branches", async () => {
  const fixture = storyFixture(); const scene = fixture.scenes[0]!;
  const opaque = { id: "opaque", byteStart: 65, byteEnd: 70, protected: true, owner: { groupId: "group", branchId: "if" }, payload: { type: "customCode" as const, source: "        custom_code()", reason: "Unsupported source" } };
  const s = setup(undefined, { ...fixture, scenes: [{ ...scene, beats: [...scene.beats.slice(0, 3), opaque, ...scene.beats.slice(3)] }, fixture.scenes[1]!] });
  assert.match(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading > strong')!.textContent!, /3 branches \/ 5 Beats/);
  button(s.host.querySelector('[data-condition-group-id="group"] > .story-group-heading')!, "Delete condition").click(); assert.match(s.host.querySelector('.story-operation[aria-label="Delete entire condition"]')!.textContent!, /all 5 contained Beats/); await s.close();
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
  open(s.host, "if"); button(row(s.host, "if"), "Apply condition").click(); const tree = document.querySelector<HTMLElement>("aside")!; assert.equal(button(tree, "New Chapter").disabled, true); button(tree, "New Chapter").click(); assert.equal(tree.querySelector(".tree-inline"), null); assert.equal(s.calls.length, 1); finish(s.model); await tick(); assert.equal(button(tree, "New Chapter").disabled, false); await s.close();
});

test("unresolved manual conditions stop at the actual header; explicit no-match visits the chosen continuation", async () => {
  const s = setup(); const header = s.model.scenes[0]!.beats[0]!;
  const scene = { ...s.model.scenes[0]!, beats: [header, { id: "body", owner: { groupId: "group", branchId: "if" }, byteStart: 40, byteEnd: 50, protected: false, payload: { type: "narration" as const, text: "Selected body" } }, { id: "root-value", byteStart: 50, byteEnd: 60, protected: false, payload: { type: "setVariable" as const, variableId: "trust", value: "42" } }, { id: "root-background", byteStart: 60, byteEnd: 70, protected: false, payload: { type: "background" as const, assetId: "bg", transition: "none" as const } }, { id: "root-text", byteStart: 70, byteEnd: 80, protected: false, payload: { type: "narration" as const, text: "Explicit continuation" } }] };
  for (const choice of [undefined, "removed-branch"]) { const state = deriveScenePreview(scene, undefined, choice ? new Map([["group", choice]]) : new Map()); assert.equal(state.partial, true); assert.equal(state.throughBeatId, "if"); assert.equal(state.variables.trust, undefined); assert.equal(state.background, undefined); assert.equal(state.overlay, undefined); }
  const matched = deriveScenePreview(scene, "body", new Map([["group", "if"]])); assert.equal(matched.overlay?.text, "Selected body"); assert.equal(matched.throughBeatId, "body");
  const noMatch = deriveScenePreview(scene, undefined, new Map([["group", "no-match"]])); assert.equal(noMatch.variables.trust?.value, "42"); assert.equal(noMatch.background?.assetId, "bg"); assert.equal(noMatch.overlay?.text, "Explicit continuation"); assert.equal(noMatch.throughBeatId, "root-text"); await s.close();
});
