import { renderStoryView as renderStory, type BodyRef, type Condition, type InsertionPlace, type SceneActions, type SceneBeat, type SceneBody, type SceneWorkspace } from "../src/scene-ui.ts";
/** Gives every scene the small bodies value its current beats describe. */
export function withBodies(model: SceneWorkspace): SceneWorkspace {
  return { ...model, scenes: model.scenes.map(scene => ({ ...scene, bodies: sceneBodies(scene.beats) })) };
}
/** Story for presentation tests: each model it shows, including accepted results, gets
 *  bodies from `withBodies`. Hand-built beats then never carry stale bodies. */
export const renderStoryView: typeof renderStory = (host, tree, model, actions, beatId) => {
  const wrap = (next: SceneActions): SceneActions => ({ ...next, apply: async (command, expected) => withBodies(await next.apply(command, expected)) });
  const view = renderStory(host, tree, withBodies(model), wrap(actions), beatId);
  return { ...view, update: (next, nextActions, selected) => view.update(withBodies(next), wrap(nextActions), selected) };
};
/** A small bodies value for presentation tests. Real endings and places come from
 *  core and are tested against it. A body ends at its first Jump, Repeat or Return, or
 *  at a node that `ends` names; otherwise it continues. */
export function sceneBodies(beats: readonly SceneBeat[], ends: readonly string[] = []): SceneBody[] {
  const parentOf = (beat: SceneBeat): BodyRef => beat.owner ? { type: "branch", ...beat.owner } : { type: "root" };
  const owned = (body: BodyRef, beat: SceneBeat): boolean => body.type === "root" ? !beat.owner : beat.owner?.groupId === body.groupId && beat.owner.branchId === body.branchId;
  const shells: Omit<SceneBody, "nodes" | "ending" | "places" | "defaultPlace">[] = [{ body: { type: "root" }, kind: "scene" }];
  for (const beat of beats) {
    const branch = beat.conditionalBranch; if (!branch) continue;
    const owner = branch.choiceOption ? beats.find(b => b.payload.type === "choice" && b.payload.options.some(o => o.id === beat.id)) : beats.find(b => b.conditionalBranch?.groupId === branch.groupId && !b.conditionalBranch.ordinal && !b.conditionalBranch.otherwise);
    shells.push({ body: { type: "branch", groupId: branch.groupId, branchId: beat.id }, kind: branch.choiceOption ? "option" : "branch", number: (branch.ordinal ?? 0) + 1, parent: parentOf(beat), ...(owner ? { owningNode: owner.id } : {}) });
  }
  return shells.map(shell => {
    const trivia = (beat: SceneBeat): boolean => !beat.conditionalBranch && beat.payload.type === "customCode" && (!beat.payload.source.trim() || beat.payload.source.trim().startsWith("#"));
    const nodes = beats.filter(beat => owned(shell.body, beat) && !trivia(beat) && !beat.structuralPlaceholder && !beat.conditionalBranch?.choiceOption && !beat.conditionalBranch?.otherwise && !beat.conditionalBranch?.ordinal);
    const ending = nodes.findIndex(beat => ends.includes(beat.id) || ["jump", "repeatChoice", "return"].includes(beat.payload.type)), reached = ending < 0 ? nodes : nodes.slice(0, ending + 1);
    const places: InsertionPlace[] = reached.filter(beat => !beat.protected || beat.conditionalBranch).map(beat => ({ position: { type: "before" as const, anchor: beat.conditionalBranch ? { type: "condition" as const, groupId: beat.conditionalBranch.groupId } : { type: "beat" as const, beatId: beat.id } }, fitsEnding: false }));
    if (ending < 0) places.push({ position: { type: "end" }, fitsEnding: true });
    return { ...shell, nodes: nodes.map(beat => ({ beatId: beat.id, bodies: shells.filter(item => item.owningNode === beat.id).map(item => item.body) })),
      ending: ending < 0 ? { type: "continues" as const } : { type: "ends" as const, beatId: nodes[ending]!.id }, places, defaultPlace: ending < 0 ? { type: "end" as const } : places.at(-1)?.position };
  });
}
export const trustCondition: Condition = { status: "supported", expression: { type: "compare", operator: "greaterEqual", left: { type: "variable", variableId: "trust", variableType: "int" }, right: { type: "int", value: "5" } } };
export const flagCondition: Condition = { status: "supported", expression: { type: "variable", variableId: "flag", variableType: "bool" } };
export function storyFixture(deep = 1): SceneWorkspace {
  let offset = 20; const beats: SceneBeat[] = [];
  const add = (beat: Omit<SceneBeat, "byteStart" | "byteEnd">): void => { beats.push({ ...beat, byteStart: offset, byteEnd: offset + 20 }); offset += 20; };
  const header = (id: string, groupId: string, ordinal: number, otherwise: boolean, condition?: Condition, owner?: SceneBeat["owner"]): void => add({ id, owner, protected: true, conditionalBranch: { groupId, ordinal, otherwise, condition }, payload: { type: "customCode", source: otherwise ? "else:" : "if flag:", reason: "Condition header" } });
  header("if", "group", 0, false, flagCondition);
  add({ id: "a", protected: false, owner: { groupId: "group", branchId: "if" }, payload: { type: "narration", text: "I can tell you what happened." } });
  add({ id: "b", protected: false, owner: { groupId: "group", branchId: "if" }, payload: { type: "narration", text: "Listen carefully." } });
  let parent = { groupId: "group", branchId: "if" };
  for (let index = 0; index < deep; index++) { const id = `nested-if-${index}`, groupId = `nested-${index}`; header(id, groupId, 0, false, trustCondition, parent); parent = { groupId, branchId: id }; }
  add({ id: "deep", protected: false, owner: parent, payload: { type: "narration", text: "A quiet detail café 雪." } });
  header("elif", "group", 1, false, trustCondition);
  add({ id: "maybe", protected: false, owner: { groupId: "group", branchId: "elif" }, payload: { type: "narration", text: "Maybe another time." } });
  header("otherwise", "group", 2, true);
  add({ id: "empty", protected: true, structuralPlaceholder: true, owner: { groupId: "group", branchId: "otherwise" }, payload: { type: "customCode", source: "        pass", reason: "Empty branch" } });
  add({ id: "choice", protected: false, payload: { type: "choice", options: [{ text: "  Ask about the tram  ", condition: trustCondition }, { text: "Leave it for now", condition: flagCondition }] } });
  add({ id: "call", protected: false, payload: { type: "call", sceneId: "two", returnLabel: "stable_return" } });
  add({ id: "after-call", protected: false, payload: { type: "narration", text: "The conversation has ended." } });
  add({ id: "end", protected: false, payload: { type: "return" } });
  return { projectRevision: "project", sourceMapRevision: "map", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" },
    chapters: [{ id: "chapter", displayName: "The Last Tram", directory: "game" }], scenes: [{ id: "one", chapterId: "chapter", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/arrival.rpy", sourceRevision: "source", sourceConflict: false, partial: false, beats, bodies: sceneBodies(beats) }, { id: "two", chapterId: "chapter", displayName: "Shared conversation", technicalLabel: "shared", sourcePath: "game/shared.rpy", sourceRevision: "other", sourceConflict: false, partial: false, beats: [{ id: "callee", byteStart: 20, byteEnd: 40, protected: false, payload: { type: "narration", text: "We meet again." } }], bodies: [{ body: { type: "root" }, kind: "scene", nodes: [{ beatId: "callee" }], ending: { type: "continues" }, places: [{ position: { type: "end" }, fitsEnding: true }], defaultPlace: { type: "end" } }] }], authoring: { characters: [], assets: [], appearances: [], variables: [{ id: "flag", technicalName: "flag", variableType: "bool", defaultValue: true }, { id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }, { id: "name", technicalName: "name", variableType: "string", defaultValue: "Bec" }] } };
}

/** Story Combined test helpers: Tracks or Reel columns, the Branch path and the editor beside the stage. */
export function trackColumn(host: ParentNode, id: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>(".story-route [data-beat-id]")].find(column => column.dataset.beatId === id);
}
export function storyEditor(host: ParentNode): HTMLElement {
  const editor = host.querySelector<HTMLElement>(".story-editor"); if (!editor) throw Error("Story editor is not shown"); return editor;
}
/** Opens a branch or option in the Branch path, as the author does. */
export function openBranch(host: ParentNode, branchId: string): void {
  const segment = [...host.querySelectorAll<HTMLButtonElement>(".story-branch-segment")].find(item => item.dataset.branchId === branchId);
  if (!segment) throw Error(`No Branch path switch for ${branchId}`);
  if (segment.ariaPressed !== "true") segment.click();
}
/** Selects a beat by its Tracks or Reel column, opening the named branches first, and returns the editor. */
export function selectBeat(host: ParentNode, id: string, ...branches: string[]): HTMLElement {
  for (const branch of branches) openBranch(host, branch);
  const column = trackColumn(host, id); if (!column) throw Error(`No Tracks column for ${id}`);
  const select = column.querySelector<HTMLButtonElement>(":scope > .story-track-beat, :scope > .story-slot-name"); if (!select) throw Error(`No select control for ${id}`);
  select.click();
  return storyEditor(host);
}

/** A scene for the Combined beat editors: pictures, characters, a condition and a Choice
 *  whose options own beats. Option 1 may leave through Custom Code (ending unknown),
 *  option 2 jumps, and Custom Code ends option 3. Bodies are complete, so tests render it
 *  with the production Story view rather than `withBodies`. */
export function editorFixture(): SceneWorkspace {
  let offset = 20; const beats: SceneBeat[] = [];
  const add = (beat: Omit<SceneBeat, "byteStart" | "byteEnd">): void => { beats.push({ ...beat, byteStart: offset, byteEnd: offset + 20 }); offset += 20; };
  const option = (id: string, ordinal: number): void => add({ id, protected: true, conditionalBranch: { groupId: "menu", choiceOption: true, ordinal, otherwise: false }, payload: { type: "customCode", source: "", reason: "Option" } });
  const opt = (branchId: string) => ({ groupId: "menu", branchId });
  add({ id: "bg", protected: false, payload: { type: "background", assetId: "platform", transition: "none" } });
  add({ id: "show", protected: false, payload: { type: "showCharacter", characterId: "mara", appearanceId: "mara-neutral", placement: "centre", transition: "dissolve" } });
  add({ id: "line", protected: false, payload: { type: "dialogue", characterId: "mara", text: "You heard the bell too?" } });
  add({ id: "if", protected: true, conditionalBranch: { groupId: "test", ordinal: 0, otherwise: false, condition: trustCondition }, payload: { type: "customCode", source: "if trust >= 5:", reason: "Condition header" } });
  add({ id: "inside", protected: false, owner: { groupId: "test", branchId: "if" }, payload: { type: "narration", text: "She nods." } });
  add({ id: "else", protected: true, conditionalBranch: { groupId: "test", ordinal: 1, otherwise: true }, payload: { type: "customCode", source: "else:", reason: "Condition header" } });
  add({ id: "pass", protected: true, structuralPlaceholder: true, owner: { groupId: "test", branchId: "else" }, payload: { type: "customCode", source: "        pass", reason: "Empty branch" } });
  add({ id: "choice", protected: false, payload: { type: "choice", prompt: { type: "dialogue", characterId: "eli", text: "Last call. Are you getting on?" }, pickedPolicy: "showNormally", options: [{ id: "opt1", text: "Ask about the last tram" }, { id: "opt2", text: "Leave" }, { id: "opt3", text: "Wait for the next service", condition: trustCondition }] } });
  option("opt1", 0);
  add({ id: "ask", protected: false, owner: opt("opt1"), payload: { type: "dialogue", characterId: "mara", text: "The last tram doesn't stop here." } });
  add({ id: "maybe", protected: true, owner: opt("opt1"), payload: { type: "customCode", source: '$ renpy.jump("depot") if late else None', reason: "Custom Code" } });
  option("opt2", 1);
  add({ id: "walk", protected: false, owner: opt("opt2"), payload: { type: "narration", text: "Mara turns up her collar." } });
  add({ id: "leave", protected: false, owner: opt("opt2"), payload: { type: "jump", sceneId: "two" } });
  option("opt3", 2);
  add({ id: "code", protected: true, owner: opt("opt3"), payload: { type: "customCode", source: "$ renpy.jump(next_stop)", reason: "Custom Code" } });
  add({ id: "close", protected: false, payload: { type: "narration", text: "The doors close behind them." } });
  add({ id: "end", protected: false, payload: { type: "return" } });
  const bodies = sceneBodies(beats, ["code"]).map(body => body.body.type === "branch" && body.body.branchId === "opt1" ? { ...body, ending: { type: "unknown" as const } } : body);
  const scene = (id: string, displayName: string, own: SceneBeat[]) => ({ id, chapterId: "chapter", displayName, technicalLabel: id, sourcePath: `game/${id}.rpy`, sourceRevision: `source-${id}`, sourceConflict: false, partial: false, beats: own, bodies: id === "one" ? bodies : sceneBodies(own) });
  return { projectRevision: "project", sourceMapRevision: "map", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" }, chapters: [{ id: "chapter", displayName: "The Last Tram", directory: "game" }],
    scenes: [scene("one", "The last service", beats), scene("two", "Depot", [{ id: "depot-bg", byteStart: 20, byteEnd: 40, protected: false, payload: { type: "background", assetId: "depot", transition: "none" } }, { id: "depot-line", byteStart: 40, byteEnd: 60, protected: false, payload: { type: "narration", text: "The depot is dark." } }])],
    authoring: {
      characters: [{ id: "mara", displayName: "Mara", technicalName: "mara", dialogueColor: "#e0a0b0", defaultAppearanceId: "mara-neutral" }, { id: "eli", displayName: "Eli", technicalName: "eli", dialogueColor: "#8fc4e8", defaultAppearanceId: "eli-neutral" }],
      appearances: [{ id: "mara-neutral", characterId: "mara", label: "Neutral", assetId: "mara-neutral-image" }, { id: "mara-concerned", characterId: "mara", label: "Concerned", assetId: "mara-concerned-image" }, { id: "eli-neutral", characterId: "eli", label: "Neutral", assetId: "eli-neutral-image" }],
      assets: [{ id: "platform", kind: "background", displayName: "Rainy platform", status: "available" }, { id: "depot", kind: "background", displayName: "Depot at night", status: "available" }, { id: "dawn", kind: "background", displayName: "Station at dawn", status: "available" },
        { id: "mara-neutral-image", kind: "characterAppearance", displayName: "Mara neutral", status: "available" }, { id: "mara-concerned-image", kind: "characterAppearance", displayName: "Mara concerned", status: "available" }, { id: "eli-neutral-image", kind: "characterAppearance", displayName: "Eli neutral", status: "available" },
        { id: "night", kind: "music", displayName: "Night service", status: "available" }, { id: "bell", kind: "sfx", displayName: "Tram bell", status: "available" }],
      variables: [{ id: "flag", technicalName: "has_ticket", variableType: "bool", defaultValue: true }, { id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }, { id: "fare", technicalName: "fare", variableType: "decimal", defaultValue: 2.5 }, { id: "mood", technicalName: "mood", variableType: "string", defaultValue: "calm" }],
    } };
}

/** Presses a button by its text or accessible name. */
export function press(scope: ParentNode, label: string): HTMLButtonElement {
  const found = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(item => item.textContent === label || item.getAttribute("aria-label") === label);
  if (!found) throw Error(`No button ${label}`);
  found.click(); return found;
}
/** Picks a kind in the open Add a beat dialog and returns the new beat's editor panel. */
export function pickKind(host: ParentNode, kind: string): HTMLElement {
  const dialog = host.querySelector<HTMLElement>(".story-add-beat"); if (!dialog) throw Error("Add a beat is not open");
  const row = [...dialog.querySelectorAll<HTMLButtonElement>(".story-result")].find(item => item.textContent === kind); if (!row) throw Error(`No beat kind ${kind}`);
  row.click();
  const panel = host.querySelector<HTMLElement>(".story-editor .new-beat"); if (!panel && kind !== "Condition") throw Error(`No new ${kind} beat`);
  return panel ?? host.querySelector<HTMLElement>('.story-operation[aria-label="Add Condition"]')!;
}
/** Chooses a value in a switch, list or menu by the group's label and the value's text. */
export function chooseIn(scope: ParentNode, group: string, value: string): void {
  const control = [...scope.querySelectorAll<HTMLElement>("[role=radiogroup], [role=listbox]")].find(item => item.getAttribute("aria-label") === group);
  if (!control) throw Error(`No ${group}`);
  const option = [...control.querySelectorAll<HTMLButtonElement>("[role=radio], [role=option]")].find(item => item.textContent === value || item.getAttribute("aria-label") === value);
  if (!option) throw Error(`No ${value} in ${group}`);
  option.click();
}
/** A Choice editor's option blocks, in order. */
export function optionBlocks(scope: ParentNode): HTMLElement[] { return [...scope.querySelectorAll<HTMLElement>(".story-option")]; }
/** Opens an option's Only when rule builder and returns it. */
export function openGuard(block: HTMLElement): HTMLElement {
  const toggle = [...block.querySelectorAll<HTMLButtonElement>(".story-guard > button")][0]; if (toggle) toggle.click();
  const rules = block.querySelector<HTMLElement>(".story-rules"); if (!rules) throw Error("No rule builder"); return rules;
}
/** Types into a field as the author does: the value, then an input event. */
export function type(control: HTMLInputElement | HTMLTextAreaElement, value: string): void { control.value = value; control.dispatchEvent(new Event("input", { bubbles: true })); }
