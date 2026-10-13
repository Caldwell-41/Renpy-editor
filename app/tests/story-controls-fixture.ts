import type { Condition, SceneBeat, SceneWorkspace } from "../src/scene-ui.ts";
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
  add({ id: "choice", protected: false, payload: { type: "choice", options: [{ text: "  Ask about the tram  ", destinationSceneId: "two", condition: trustCondition }, { text: "Leave it for now", destinationSceneId: "two", condition: flagCondition }] } });
  add({ id: "call", protected: false, payload: { type: "call", sceneId: "two", returnLabel: "stable_return" } });
  add({ id: "after-call", protected: false, payload: { type: "narration", text: "The conversation has ended." } });
  add({ id: "end", protected: false, payload: { type: "return" } });
  return { projectRevision: "project", sourceMapRevision: "map", entrySceneId: "one", lastOpen: { chapterId: "chapter", sceneId: "one" }, canUndo: true, canRedo: false,
    chapters: [{ id: "chapter", displayName: "The Last Tram", directory: "game" }], scenes: [{ id: "one", chapterId: "chapter", displayName: "Arrival", technicalLabel: "arrival", sourcePath: "game/arrival.rpy", sourceRevision: "source", sourceConflict: false, partial: false, beats }, { id: "two", chapterId: "chapter", displayName: "Shared conversation", technicalLabel: "shared", sourcePath: "game/shared.rpy", sourceRevision: "other", sourceConflict: false, partial: false, beats: [{ id: "callee", byteStart: 20, byteEnd: 40, protected: false, payload: { type: "narration", text: "We meet again." } }] }], authoring: { characters: [], assets: [], appearances: [], variables: [{ id: "flag", technicalName: "flag", variableType: "bool", defaultValue: true }, { id: "trust", technicalName: "trust", variableType: "int", defaultValue: "0" }, { id: "name", technicalName: "name", variableType: "string", defaultValue: "Bec" }] } };
}
