// Story release fixes (#120, story-release-fixes / a-v2), through the production Story controls.
import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { Condition, SceneActions, SceneBeat, SceneCommand, SceneWorkspace } from "../src/scene-ui.js";
import { buildRuleBuilder } from "../src/story-condition-editor.js";
import { chooseIn, choosePlace, editorFixture, pickKind, press, renderStoryView, sceneBodies, selectBeat, storyEditor, type } from "./story-controls-fixture.js";
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
  await s.close();
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

/** Condition 01: If has_ticket, two Else if tests core could not read, and Otherwise. */
function brokenCondition(missing: Condition = { status: "unknown", source: "ticket_count == 2", diagnostic: "missingVariable" }): SceneWorkspace {
  const header = (id: string, ordinal: number, condition?: Condition): SceneBeat => beat(id, { type: "customCode", source: "", reason: "Condition header" }, { protected: true, conditionalBranch: { groupId: "test", ordinal, otherwise: !condition, ...condition ? { condition } : {} } });
  const inside = (id: string, branchId: string): SceneBeat => beat(id, { type: "narration", text: `Inside ${branchId}.` }, { owner: { groupId: "test", branchId } });
  const model = project([
    header("if", 0, { status: "supported", expression: { type: "variable", variableId: "flag", variableType: "bool" } }), inside("in-if", "if"),
    header("missing", 1, missing), inside("in-missing", "missing"),
    header("type", 2, { status: "unknown", source: "destination >= 3", diagnostic: "typeMismatch" }), inside("in-type", "type"),
    header("else", 3), inside("in-else", "else"),
    beat("after", { type: "narration", text: "The doors close behind them." }),
  ]);
  return { ...model, authoring: { ...model.authoring, variables: [...model.authoring.variables, { id: "destination", technicalName: "destination", variableType: "string", defaultValue: "Depot" }] } };
}

test("a condition names each branch the builder can't edit, why, and what to do, in the builder, Tracks and the Branch path", async () => {
  const fixed = brokenCondition({ status: "supported", expression: { type: "compare", operator: "equal", left: { type: "variable", variableId: "count", variableType: "int" }, right: { type: "int", value: "2" } } });
  const requests: unknown[] = [];
  const s = mount(brokenCondition(), { createVariable: async request => { requests.push(request); return { ...fixed, projectRevision: "project-2", authoring: { ...fixed.authoring, variables: [...fixed.authoring.variables, { id: "count", technicalName: "ticket_count", variableType: "int", defaultValue: "0" }] } }; } });
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
  const s = mount(brokenCondition()), variables = editorFixture().authoring.variables;
  const flag = { type: "variable" as const, variableId: "flag", variableType: "bool" as const };
  const shown = (condition: Condition, subject?: "branch" | "option"): HTMLElement => { const builder = buildRuleBuilder(variables, condition, { keyword: "if", label: "Only when", empty: "", required: false, newVariable: async () => undefined, source: () => {}, ...subject ? { subject } : {} }); document.body.append(builder.host); return builder.host; };
  const missing = shown({ status: "unknown", source: "ticket_count == 2", diagnostic: "missingVariable" }, "option");
  assert.equal(missing.querySelector(".story-rule-error")!.textContent, "ticket_count is not a project variable. Create it, or change this line in Source. Until then, the builder can't edit this option.");
  assert.equal(shown({ status: "unknown", source: "renpy.seen_label('x')", diagnostic: "unsupportedSyntax" }).querySelector(".story-rule-error")!.textContent, "The builder can't show this Python. Until then, edit it in Source.");
  assert.equal(shown({ status: "supported", expression: { type: "and", left: flag, right: { type: "or", left: flag, right: flag } } }).querySelector(".story-field-hint")!.textContent, "This mixes All and Any. The builder can't edit it. Edit it in Source.");
  // Screen readers name each rule's test a comparison.
  const rule = shown({ status: "supported", expression: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "3" } } });
  chooseIn(rule, "Only when rule 1 comparison", "≤"); assert.ok(rule.querySelector('select[aria-label="Only when rule 1 comparison"]'));
  await s.close();
});

test("Add a beat says Condition branches on a variable, and a branch with no rules says to add one", async () => {
  const s = mount(brokenCondition());
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

test("a draft whose beat moved to another branch names where it went, and Override source writes it there", async () => {
  const header = (id: string, ordinal: number, otherwise = false): SceneBeat => beat(id, { type: "customCode", source: "", reason: "Condition header" }, { protected: true, conditionalBranch: { groupId: "test", ordinal, otherwise, ...otherwise ? {} : { condition: { status: "supported", expression: { type: "variable", variableId: "flag", variableType: "bool" } } } } });
  const line = beat("eli", { type: "dialogue", characterId: "eli", text: "Keep your ticket. Some doors only open once." }, { owner: { groupId: "test", branchId: "if" } });
  const before = [header("if", 0), line, header("else", 1, true), beat("pass", { type: "customCode", source: "        pass", reason: "Empty branch" }, { protected: true, structuralPlaceholder: true, owner: { groupId: "test", branchId: "else" } }), beat("after", { type: "narration", text: "The doors close behind them." })];
  const s = mount(project(before));
  const draft = selectBeat(s.host, "eli", "if").querySelector<HTMLTextAreaElement>("textarea")!;
  draft.value = "Keep your ticket. Some doors only open once, and this one is closing."; draft.dispatchEvent(new Event("input", { bubbles: true }));
  // Source moves the line into Otherwise.
  const moved = project([before[0]!, before[2]!, { ...line, owner: { groupId: "test", branchId: "else" } }, before[4]!]);
  s.view.update(moved, { apply: async command => { s.calls.push(command); return moved; }, status: () => {}, resolution: { width: 1280, height: 720 }, present: async () => { throw Error("No media"); } });
  const panel = s.host.querySelector<HTMLElement>('.story-editor [data-beat-draft-key="eli"]')!;
  assert.equal(panel.querySelector(".story-conflict > p")!.textContent, "This beat moved to Otherwise in source. Your draft is still for this beat.");
  assert.equal(panel.querySelector(".story-conflict label > span")!.textContent, "Source, now in Otherwise");
  assert.equal(panel.querySelector(".story-conflict-source")!.textContent, "Keep your ticket. Some doors only open once.");
  assert.deepEqual(texts(panel, ".story-resolution button"), ["Discard draft", "Override source"]);
  assert.equal(panel.querySelector(".story-resolution p")!.textContent, "Override source saves your draft to this beat in Otherwise. Other drafts stay unsaved.");
  // Show it in Otherwise opens that branch with the beat selected.
  press(panel, "Show it in Otherwise");
  assert.equal([...s.host.querySelectorAll<HTMLElement>(".story-branch-segment")].find(item => item.dataset.branchId === "else")!.ariaPressed, "true");
  assert.equal(s.host.querySelector<HTMLElement>('.story-route [data-beat-id="eli"] > .story-track-beat')!.dataset.selected, "true");
  press(s.host.querySelector<HTMLElement>('[data-beat-draft-key="eli"]')!, "Override source"); await tick();
  assert.deepEqual(s.calls.at(-1), { type: "updateBodyBeat", sceneId: "one", expectedSourceRevision: "source-one", beatId: "eli", expectedBody: { type: "branch", groupId: "test", branchId: "else" }, beat: { type: "dialogue", characterId: "eli", text: "Keep your ticket. Some doors only open once, and this one is closing." } });
  await s.close();
});

/** A Story with one owned panel screen, for screen beats. */
function withScreens(model: SceneWorkspace, extra: Partial<SceneActions> = {}) {
  const binding = { screenId: "panel-id", sourceName: "timetable" }, revisions = { source: "panel-source", sourceMap: "map", inventory: "inventory", effects: "effect" };
  return mount(model, { screenCatalog: async () => ({ projectRevision: "project", sourceMapRevision: "map", inventoryRevision: "inventory", owned: [{ id: binding.screenId, name: binding.sourceName, path: "game/ui/timetable.rpy", rootId: "root", kind: "panel", resolved: true, sourceRevision: revisions.source }] }),
    resolveScreenTarget: async () => ({ binding, kind: "panel", blocking: false, canShowHide: true, path: "game/ui/timetable.rpy", rootId: "root", revisions, effects: { revision: "effect", unknown: false, shownScreens: [], assignedVariables: [], hiddenScreens: [], finishesInteraction: false, dependencies: [] } }), ...extra });
}
const screenScene = (): SceneWorkspace => project([beat("words", { type: "narration", text: "The timetable has not changed in thirty years." }), beat("line", { type: "dialogue", characterId: "mara", text: "You heard the bell too?" }), beat("close", { type: "narration", text: "The doors close behind them." })]);
const where = (panel: ParentNode): string[] => texts(panel, ".story-where > *");

test("a new screen beat uses Goes at, In and After, and ⋯ Move to…, like other beats", async () => {
  const model = screenScene(), scene = model.scenes[0]!;
  const s = withScreens(model, { screenInsertion: { sceneId: "one", body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "close" } }, expectedSourceRevision: scene.sourceRevision } });
  press(s.host, "Add screen Beat"); await tick();
  const panel = s.host.querySelector<HTMLElement>(".new-beat")!;
  assert.deepEqual(where(panel), ["Goes at", "Before 03 Narration", "In", "The last service", "After", "02 Mara's line"]);
  assert.equal(panel.querySelector('[aria-label="Insert in"], [aria-label="Insert before"]'), null);
  await choosePlace(s.host, panel, "Before 02 Mara's line");
  assert.deepEqual(where(panel), ["Goes at", "Before 02 Mara's line", "In", "The last service", "After", "01 Narration"]);
  press(panel, "Add Beat"); await tick();
  assert.deepEqual(s.calls.at(-1), { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: scene.sourceRevision, body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "line" } }, beat: { type: "showScreen", target: { screenId: "panel-id", sourceName: "timetable" }, revisions: { source: "panel-source", sourceMap: "map", inventory: "inventory", effects: "effect" } } });
  await s.close();
});

test("a place picked in Screens that changed reads Choose a place, and Add Beat refuses until one is chosen", async () => {
  const s = withScreens(screenScene(), { screenInsertion: { sceneId: "one", body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "gone" } }, expectedSourceRevision: "older" } });
  press(s.host, "Add screen Beat"); await tick();
  const panel = s.host.querySelector<HTMLElement>(".new-beat")!;
  assert.deepEqual(where(panel), ["Goes at", "Choose a place", "In", "The last service"]);
  assert.equal(panel.querySelector(".story-place-note > p")!.textContent, "The scene changed after you picked this place in Screens. Choose where this beat goes.");
  assert.ok(panel.querySelector(".story-where-warn")); assert.equal(panel.querySelector<HTMLElement>(".story-beat-menu")!.hidden, true);
  press(panel, "Add Beat"); await tick();
  assert.deepEqual(s.calls, []); assert.equal(s.status.at(-1), "Choose where this beat goes. Draft retained.");
  await choosePlace(s.host, panel, "Before 03 Narration");
  assert.deepEqual(where(panel), ["Goes at", "Before 03 Narration", "In", "The last service", "After", "02 Mara's line"]);
  assert.equal(panel.querySelector<HTMLElement>(".story-place-note")!.hidden, true);
  press(panel, "Add Beat"); await tick();
  assert.deepEqual(s.calls.length, 1);
  await s.close();
});

/** The last service with protected Custom Code at 04, between Mara's line and Eli's line. */
const protectedScene = (): SceneWorkspace => project([
  beat("bg", { type: "background", assetId: "platform", transition: "none" }),
  beat("show", { type: "showCharacter", characterId: "mara", appearanceId: "mara-neutral", placement: "centre", transition: "none" }),
  beat("line", { type: "dialogue", characterId: "mara", text: "You heard the bell too?" }),
  beat("code", { type: "customCode", source: "    $ renpy.notify(\"Last call\")", reason: "Custom Code" }, { protected: true }),
  beat("eli", { type: "dialogue", characterId: "eli", text: "Last call. Are you getting on?" }),
  beat("close", { type: "narration", text: "The doors close behind them." }),
]);

test("the + on the beat before protected Custom Code adds right before the region", async () => {
  const model = protectedScene(), s = mount(model);
  const plus = s.host.querySelector<HTMLButtonElement>('.story-route [data-beat-opener="after:line"]')!;
  assert.equal(plus.title, "Add after 03 Mara's line, before 04 Custom Code"); assert.equal(plus.ariaLabel, plus.title);
  plus.click();
  const panel = pickKind(s.host, "Narration");
  assert.deepEqual(where(panel), ["Goes at", "Before 04 Custom Code", "In", "The last service", "After", "03 Mara's line"]);
  type(panel.querySelector("textarea")!, "The bell rings twice.");
  press(panel, "Add Beat"); await tick();
  assert.deepEqual(s.calls.at(-1), { type: "insertBodyBeat", sceneId: "one", expectedSourceRevision: model.scenes[0]!.sourceRevision, body: { type: "root" }, position: { type: "before", anchor: { type: "beat", beatId: "code" } }, beat: { type: "narration", text: "The bell rings twice." } });
  // The region itself adds after it.
  assert.equal(s.host.querySelector<HTMLButtonElement>('.story-route [data-beat-opener="after:code"]')!.title, "Add after 04 Custom Code");
  await s.close();
});

test("Move to lists the place before protected Custom Code, shows the region and the beat's own place, and preselects nothing", async () => {
  const model = protectedScene(), s = mount(model);
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
  const s = mount(protectedScene());
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
  const s = mount(chapters()), tree = document.querySelector("aside")!;
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
  const s = mount(chapters(), { apply: refused({ beats: [reference("leave", "jump"), reference("depot-line", "call", "platform", "Platform 4")], protectedCode: [] }) }), tree = document.querySelector("aside")!;
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
  let s = mount(chapters(), { apply: refused({ beats: [], protectedCode: [reference("code", "customCode")] }) });
  let refusal = refusalOf(await deleteScene(document.querySelector("aside")!, "Depot"));
  assert.equal(refusal.head, "Can't delete \"Depot\". Custom Code may jump to it, and Loomlight can't check where it goes:");
  assert.deepEqual(refusal.rows, [["The last service", "05.3.1 Custom Code"]]);
  assert.equal(refusal.tail, "Change that code in Source first. Nothing was deleted.");
  const row = refusal.block.previousElementSibling as HTMLElement;
  press(refusal.block, "Close"); assert.equal(refusal.block.isConnected, false); assert.equal(document.activeElement, row.querySelector(".tree-scene-open"));
  await s.close();
  s = mount(chapters(), { apply: refused({ beats: [reference("leave", "jump")], protectedCode: [reference("depot-line", "customCode", "two", "Depot")] }) });
  refusal = refusalOf(await deleteScene(document.querySelector("aside")!, "Depot"));
  assert.equal(refusal.head, "Can't delete \"Depot\". 1 beat goes to it, and it holds Custom Code that deleting would drop:");
  assert.deepEqual(refusal.rows, [["The last service", "05.2.2 Jump"], ["Depot", "02 Custom Code"]]);
  assert.equal(refusal.tail, "Change or remove them, then delete again. Nothing was deleted.");
  await s.close();
});
