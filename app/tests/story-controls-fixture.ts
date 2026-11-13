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
