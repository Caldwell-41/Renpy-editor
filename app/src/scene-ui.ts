import { assignmentCaption, buildAssignmentEditor, type ValidateAssignment } from "./story-arithmetic-editor.ts";
import { layoutFor, saveLayout } from "./preferences.ts";
import { buildAvailabilityEditor, buildConditionEditor } from "./story-condition-editor.ts";
import { validateField } from "./authoring-input.ts";
import { isTextField, type DraftStep, type DraftStepRecord, type HistoryDirection } from "./project-history.ts";
import type { ResolvedScreenTarget, ScreenCatalog, ScreenEffects, ScreenRevisions, ScreenTargetBinding } from "./screen-contracts.ts";
export type PlacementRef = "left" | "centre" | "right";
export type TransitionRef = "none" | "dissolve" | "fade";

export type ConditionExpression =
  | { readonly type: "bool"; readonly value: boolean }
  | { readonly type: "int" | "decimal" | "string"; readonly value: string }
  | { readonly type: "variable"; readonly variableId: string; readonly variableType: "bool" | "int" | "decimal" | "string" }
  | { readonly type: "compare"; readonly operator: "equal" | "notEqual" | "less" | "lessEqual" | "greater" | "greaterEqual"; readonly left: ConditionExpression; readonly right: ConditionExpression }
  | { readonly type: "not"; readonly operand: ConditionExpression }
  | { readonly type: "and" | "or"; readonly left: ConditionExpression; readonly right: ConditionExpression };
export type Condition =
  | { readonly status: "supported"; readonly expression: ConditionExpression }
  | { readonly status: "unknown"; readonly source: string; readonly diagnostic: "unsupportedSyntax" | "limitExceeded" | "missingVariable" | "typeMismatch" | "invalidValue" };

export type ChoicePrompt =
  | { readonly type: "narration"; readonly text: string }
  | { readonly type: "dialogue"; readonly characterId: string; readonly text: string };

export interface ChoiceOption {
  readonly unavailablePolicy?: "hide" | "showDisabled";
  readonly text: string;
  readonly id?: string;
  readonly condition?: Condition;
}

export interface IntegerAdjustment { readonly operation: "assign" | "add" | "subtract" | "multiply" | "divide" | "floorDivide" | "remainder"; readonly operand: string }
export type ArithmeticUnknown = "unobservedCurrentValue" | "unsupportedControlFlow" | "integerOverflow" | "nonFiniteResult" | "incompatibleTarget" | "invalidOperand" | "invalidSyntax" | "missingVariable" | "incompatibleOperand" | "zeroDivisor" | "limitExceeded";
export type AssignmentState = { readonly status: "known"; readonly value: boolean | number | string } | { readonly status: "unknown"; readonly reason: ArithmeticUnknown };
export type PickedPolicy = "showNormally" | "markPicked" | "hidePicked";
export type BeatPayload =
  | { readonly type: "background"; readonly assetId: string; readonly transition: TransitionRef }
  | { readonly type: "showCharacter"; readonly characterId: string; readonly appearanceId: string; readonly placement: PlacementRef; readonly transition: TransitionRef }
  | { readonly type: "hideCharacter"; readonly characterId: string; readonly transition: TransitionRef }
  | { readonly type: "showScreen" | "hideScreen" | "callScreen"; readonly target: ScreenTargetBinding; readonly revisions?: ScreenRevisions | null }
  | { readonly type: "changeAppearance"; readonly characterId: string; readonly appearanceId: string; readonly transition: TransitionRef }
  | { readonly type: "placement"; readonly characterId: string; readonly placement: PlacementRef }
  | { readonly type: "dialogue"; readonly characterId: string; readonly text: string }
  | { readonly type: "narration"; readonly text: string }
  | { readonly type: "playMusic"; readonly assetId: string }
  | { readonly type: "stopMusic" }
  | { readonly type: "playSfx"; readonly assetId: string }
  | { readonly type: "transition"; readonly transition: Exclude<TransitionRef, "none"> }
  | { readonly type: "setVariable"; readonly variableId: string; readonly value: boolean | number | string | IntegerAdjustment }
  | { readonly type: "choice"; readonly prompt?: ChoicePrompt; readonly pickedPolicy?: PickedPolicy; readonly options: readonly ChoiceOption[] }
  | { readonly type: "jump"; readonly sceneId: string }
  | { readonly type: "call"; readonly sceneId: string; readonly returnLabel: string | null }
  | { readonly type: "repeatChoice"; readonly target?: string | null }
  | { readonly type: "return" }
  | { readonly type: "customCode"; readonly source: string; readonly reason: string };

export interface BeatOwner { readonly groupId: string; readonly branchId: string }
export interface ConditionalBranch { readonly choiceOption?: boolean; readonly groupId: string; readonly variableId?: string; readonly otherwise: boolean; readonly ordinal?: number; readonly condition?: Condition }
export interface SceneBeat {
  readonly assignment?: { readonly inferredResultType: "bool" | "int" | "decimal" | "string" | null; readonly readVariables: readonly { readonly variableId: string; readonly technicalName: string; readonly variableType: "bool" | "int" | "decimal" | "string" }[]; readonly diagnostics: readonly { readonly field: "value.operand" | "variableId"; readonly reason: ArithmeticUnknown }[]; readonly reads: readonly string[]; readonly writes: readonly string[]; readonly state: AssignmentState };
  readonly screenEffects?: ScreenEffects;
  readonly owner?: BeatOwner;
  readonly conditionalBranch?: ConditionalBranch;
  readonly structuralPlaceholder?: boolean;
  readonly id: string;
  readonly byteStart: number;
  readonly byteEnd: number;
  readonly protected: boolean;
  readonly sourceFallback?: string;
  readonly payload: BeatPayload;
}

export type BodyRef = { readonly type: "root" } | { readonly type: "branch"; readonly groupId: string; readonly branchId: string };
export type NodeRef = { readonly type: "beat"; readonly beatId: string } | { readonly type: "condition"; readonly groupId: string };
export type Position = { readonly type: "before"; readonly anchor: NodeRef } | { readonly type: "end" };
export interface InsertionPlace { readonly position: Position; readonly fitsEnding: boolean }
export type BodyEnding = { readonly type: "ends"; readonly beatId: string } | { readonly type: "continues" } | { readonly type: "unknown" };
/** One body as core reads it from source. Its nodes name beats in `beats` by ID. */
export interface SceneBody {
  readonly body: BodyRef;
  readonly kind: "scene" | "branch" | "option";
  readonly number?: number;
  readonly parent?: BodyRef;
  readonly owningNode?: string;
  readonly nodes: readonly { readonly beatId: string; readonly bodies?: readonly BodyRef[] }[];
  readonly ending: BodyEnding;
  readonly places: readonly InsertionPlace[];
  readonly defaultPlace?: Position;
}
export function beatBody(beat: SceneBeat): BodyRef {
  return beat.owner ? { type: "branch", ...beat.owner } : { type: "root" };
}
function sameBody(a: BodyRef, b: BodyRef): boolean {
  return a.type === "root" ? b.type === "root" : b.type === "branch" && a.groupId === b.groupId && a.branchId === b.branchId;
}
function sameNode(a: NodeRef, b: NodeRef): boolean {
  return a.type === "beat" ? b.type === "beat" && a.beatId === b.beatId : b.type === "condition" && a.groupId === b.groupId;
}
function samePosition(a: Position, b: Position): boolean {
  return a.type === "end" ? b.type === "end" : b.type === "before" && sameNode(a.anchor, b.anchor);
}
function bodyOf(scene: SceneDocument, body: BodyRef): SceneBody | undefined {
  return scene.bodies.find(item => sameBody(item.body, body));
}
/** A body's nodes as beats, in source order. */
function nodeBeats(scene: SceneDocument, body: BodyRef): SceneBeat[] {
  return (bodyOf(scene, body)?.nodes ?? []).flatMap(node => scene.beats.find(beat => beat.id === node.beatId) ?? []);
}
function nodeRef(beat: SceneBeat): NodeRef {
  return beat.conditionalBranch ? { type: "condition", groupId: beat.conditionalBranch.groupId } : { type: "beat", beatId: beat.id };
}
function defaultPlace(scene: SceneDocument, body: BodyRef): Position {
  return bodyOf(scene, body)?.defaultPlace ?? { type: "end" };
}
/** Whether this node is where its body ends. */
function endsBody(scene: SceneDocument, beat: SceneBeat): boolean {
  const ending = bodyOf(scene, beatBody(beat))?.ending;
  return ending?.type === "ends" && ending.beatId === beat.id;
}
/** Places for a moved node: the destination's places without the node's own place.
 *  A node that ends its body goes only where an ending fits. Core still checks the move. */
function movePlaces(scene: SceneDocument, moved: SceneBeat, body: BodyRef): InsertionPlace[] {
  const own = nodeRef(moved), ends = endsBody(scene, moved);
  return (bodyOf(scene, body)?.places ?? []).filter(place => !(place.position.type === "before" && sameNode(place.position.anchor, own)) && (!ends || place.fitsEnding));
}
/** Branch IDs of every body inside a condition or Choice, nested ones included. */
function innerBodies(scene: SceneDocument, node: SceneBeat): Set<string> {
  const inner = new Set<string>();
  for (const item of scene.bodies) if (item.body.type === "branch" && (item.owningNode === node.id || item.parent?.type === "branch" && inner.has(item.parent.branchId))) inner.add(item.body.branchId);
  return inner;
}
function bodyCaption(scene: SceneDocument, body: BodyRef, model: SceneWorkspace): string {
  const parts: string[] = [];
  const menus = scene.beats.filter(beat => beat.payload.type === "choice");
  let current = bodyOf(scene, body);
  if (!current && body.type === "branch") parts.push("Missing branch");
  for (let steps = 0; current && current.kind !== "scene" && steps <= 16; steps++) {
    const owner = scene.beats.find(beat => beat.id === current!.owningNode), branchId = current.body.type === "branch" ? current.body.branchId : "";
    const option = owner?.payload.type === "choice" ? owner.payload.options.find(item => item.id === branchId) : undefined;
    const branch = scene.beats.find(beat => beat.id === branchId)?.conditionalBranch;
    parts.unshift(current.kind === "option" ? `Choice ${menus.indexOf(owner!) + 1} / Option ${current.number}: ${option?.text ?? "Option"}` : branch ? branchCaption(branch, model) : "Missing branch");
    current = current.parent && bodyOf(scene, current.parent);
  }
  return `${scene.displayName} / ${parts.length ? parts.join(" / ") : "Scene body"}`;
}
export interface ScreenInsertion { readonly sceneId:string; readonly body:BodyRef; readonly position:Position; readonly expectedSourceRevision:string }
export interface StoryTarget { readonly sceneId: string; readonly beatId?: string; readonly expectedSourceRevision?: string; readonly body?: BodyRef; readonly caller?: StoryTarget; readonly screenHint?: ScreenTargetBinding; readonly screenHintKind?: "panel" | "dialog"; readonly screenInsertion?: ScreenInsertion }

export interface SceneDocument {
  readonly id: string;
  readonly chapterId: string;
  readonly displayName: string;
  readonly technicalLabel: string;
  readonly sourcePath: string;
  readonly sourceRevision: string;
  readonly sourceConflict: boolean;
  readonly partial: boolean;
  readonly beats: readonly SceneBeat[];
  readonly bodies: readonly SceneBody[];
}

interface Chapter { readonly id: string; readonly displayName: string; readonly directory: string }
interface Character { readonly id: string; readonly displayName: string; readonly technicalName: string }
interface Appearance { readonly id: string; readonly characterId: string; readonly label: string; readonly assetId?: string }
interface Asset { readonly id: string; readonly kind: "background" | "characterAppearance" | "uiImage" | "music" | "sfx"; readonly displayName: string; readonly status: string; readonly sha256?: string }
interface Variable { readonly id: string; readonly technicalName: string; readonly variableType: "bool" | "int" | "decimal" | "string"; readonly defaultValue: boolean | number | string }

export interface SceneWorkspace {
  readonly authoringRevision?: string;
  readonly projectRevision: string;
  readonly sourceMapRevision: string;
  readonly entrySceneId: string;
  readonly lastOpen: { readonly chapterId: string; readonly sceneId: string };
  readonly chapters: readonly Chapter[];
  readonly scenes: readonly SceneDocument[];
  readonly authoring: {
    readonly characters: readonly Character[];
    readonly appearances: readonly Appearance[];
    readonly assets: readonly Asset[];
    readonly variables: readonly Variable[];
  };
}

/** Read the core's typed expression without evaluating project state. */
export function conditionCaption(condition: Condition, variables?: SceneWorkspace["authoring"]["variables"]): string {
  if (condition.status === "unknown") {
    const reason = { unsupportedSyntax: "unsupported expression", limitExceeded: "expression limit exceeded", missingVariable: "missing Variable", typeMismatch: "Variable type mismatch", invalidValue: "invalid value" }[condition.diagnostic];
    return `Unknown condition: ${condition.source} (${reason})`;
  }
  let remaining = 128;
  const caption = (expression: ConditionExpression, depth = 0): string => {
    if (--remaining < 0 || depth > 16) return "Unknown expression";
    switch (expression.type) {
      case "bool": return expression.value ? "True" : "False";
      case "int": case "decimal": return expression.value;
      case "string": return JSON.stringify(expression.value);
      case "variable": return variables ? variables.find(variable => variable.id === expression.variableId)?.technicalName ?? "Missing Variable" : `Variable (${expression.variableId})`;
      case "compare": {
        const operator = { equal: "is", notEqual: "is not", less: "is less than", lessEqual: "is at most", greater: "is greater than", greaterEqual: "is at least" }[expression.operator];
        return `(${caption(expression.left, depth + 1)} ${operator} ${caption(expression.right, depth + 1)})`;
      }
      case "not": return `Not (${caption(expression.operand, depth + 1)})`;
      case "and": case "or": return `(${caption(expression.left, depth + 1)} ${expression.type} ${caption(expression.right, depth + 1)})`;
    }
  };
  return caption(condition.expression);
}

function branchCaption(branch: ConditionalBranch, model: SceneWorkspace): string {
  if (branch.otherwise) return "Otherwise";
  const condition = branch.condition ? conditionCaption(branch.condition, model.authoring.variables)
    : model.authoring.variables.find(variable => variable.id === branch.variableId)?.technicalName ?? "Unknown condition";
  return `${branch.ordinal ? "Else If" : "If"} ${condition}`;
}

function readOnlyLogic(beat: SceneBeat): boolean {
  return beat.payload.type === "choice" && beat.payload.options.some(option => option.condition?.status === "unknown");
}
function previewLogicBoundary(beat: SceneBeat): boolean {
  return beat.payload.type === "call" || beat.payload.type === "showScreen" || beat.payload.type === "hideScreen" || beat.payload.type === "callScreen" || (beat.payload.type === "choice" && beat.payload.options.some(option => option.condition !== undefined));
}

export interface MediaPresentation {
  readonly assetId: string;
  readonly purpose: "thumbnail" | "imagePreview" | "audioAudition";
  readonly mimeType: string;
  readonly dataBase64: string;
  readonly sha256: string;
  readonly byteCount: number;
  readonly width?: number;
  readonly height?: number;
  readonly cacheKey: string;
}

export interface PreviewCharacter {
  readonly characterId: string;
  readonly appearanceId: string;
  readonly placement: PlacementRef;
  readonly visibleBeatId: string;
  readonly appearanceBeatId: string;
  readonly placementBeatId: string;
}

export interface ScenePreviewState {
  readonly throughBeatId?: string;
  readonly partial: boolean;
  readonly unknownBeatIds: readonly string[];
  readonly background?: { readonly assetId: string; readonly beatId: string };
  readonly backgroundUnknown: boolean;
  readonly characters: readonly PreviewCharacter[];
  readonly charactersUnknown: boolean;
  readonly music?: { readonly assetId: string; readonly beatId: string };
  readonly musicUnknown: boolean;
  readonly variables: Readonly<Record<string, { readonly value: boolean | number | string; readonly beatId: string }>>;
  readonly variablesUnknown: boolean;
  readonly overlay?: { readonly kind: "dialogue" | "narration" | "choice" | "jump" | "call" | "return" | "repeatChoice"; readonly text: string; readonly beatId: string; readonly choice?: Extract<BeatPayload, { type: "choice" }> };
}

function renderChoiceSummary(choice: Extract<BeatPayload, { type: "choice" }>, characters: SceneWorkspace["authoring"]["characters"]): HTMLElement {
  const text = (tag: string, className: string, value: string): HTMLElement => {
    const node = document.createElement(tag); node.className = className; node.textContent = value; return node;
  };
  const summary = document.createElement("div"); summary.className = "preview-choice-summary";
  summary.tabIndex = 0; summary.setAttribute("role", "region");
  summary.setAttribute("aria-label", "Choice prompt and options. Scroll to read more.");
  if (choice.prompt) {
    const prompt = document.createElement("div"); prompt.className = "preview-choice-prompt";
    const speaker = choice.prompt.type === "narration" ? "Narration" : characters.find(character => choice.prompt?.type === "dialogue" && character.id === choice.prompt.characterId)?.displayName ?? "Unavailable Character";
    prompt.append(text("strong", "preview-choice-speaker", speaker), text("span", "preview-choice-prompt-text", choice.prompt.text)); summary.append(prompt);
  }
  if (choice.pickedPolicy && choice.pickedPolicy !== "showNormally") {
    const picked = document.createElement("div"); picked.className = "preview-choice-picked";
    picked.append(text("span", "preview-choice-unknown", "Picked state unknown"), text("span", "preview-choice-policy", choice.pickedPolicy === "markPicked" ? "Mark picked" : "Hide picked")); summary.append(picked);
  }
  const options = document.createElement("ol"); options.className = "preview-choice-options";
  options.setAttribute("aria-label", "Choice options, read only");
  choice.options.forEach((option, index) => {
    const row = document.createElement("li"); row.className = "preview-choice-option";
    row.append(text("span", "preview-choice-number", String(index + 1)), text("span", "preview-choice-caption", option.text));
    if (option.condition) {
      const condition = text("span", "preview-choice-condition", "Condition unknown");
      const policy = `If false: ${option.unavailablePolicy === "showDisabled" ? "Show disabled" : "Hide"}`;
      condition.title = policy; condition.setAttribute("aria-label", `Condition unknown. ${policy}.`); row.append(condition);
    }
    options.append(row);
  });
  summary.append(options); return summary;
}

export function deriveScenePreview(scene: SceneDocument, throughBeatId?: string, manualBranches?: ReadonlyMap<string, string>): ScenePreviewState {
  const stop = throughBeatId === undefined ? scene.beats.length - 1 : scene.beats.findIndex((beat) => beat.id === throughBeatId);
  const limit = stop < 0 ? scene.beats.length - 1 : stop;
  let background: ScenePreviewState["background"];
  let backgroundUnknown = false;
  let characters: PreviewCharacter[] = [];
  let charactersUnknown = false;
  let music: ScenePreviewState["music"];
  let musicUnknown = false;
  let variables: Record<string, { value: boolean | number | string; beatId: string }> = {};
  let variablesUnknown = false;
  let overlay: ScenePreviewState["overlay"];
  const unknownBeatIds: string[] = [];
  let lastVisitedBeatId: string | undefined;
  for (const beat of scene.beats.slice(0, limit + 1)) {
    const payload = beat.payload;
    if (manualBranches) {
      let body = beatBody(beat); let active = true; const seen = new Set<string>();
      while (body.type === "branch" && !seen.has(body.branchId)) {
        if (manualBranches.get(body.groupId) !== body.branchId) { active = false; break; }
        const branchId = body.branchId; seen.add(branchId); const header = scene.beats.find(item => item.id === branchId); body = header ? beatBody(header) : { type: "root" };
      }
      if (!active) continue;
      if (beat.conditionalBranch) {
        if (beat.conditionalBranch.ordinal || beat.conditionalBranch.otherwise) continue;
        const groupId = beat.conditionalBranch.groupId;
        const selected = manualBranches.get(groupId);
        const branches = scene.beats.filter(item => item.conditionalBranch?.groupId === groupId);
        if (branches.some(branch => branch.id === selected) || (selected === "no-match" && !branches.some(branch => branch.conditionalBranch?.otherwise))) { lastVisitedBeatId = beat.id; continue; }
      }
    } else if (beat.owner && beat.id !== throughBeatId) continue;
    lastVisitedBeatId = beat.id;
    if (beat.structuralPlaceholder) continue;
    if (payload.type === "customCode" || previewLogicBoundary(beat)) {
      unknownBeatIds.push(beat.id); background = undefined; backgroundUnknown = true;
      characters = []; charactersUnknown = true; music = undefined; musicUnknown = true;
      variables = {}; variablesUnknown = true; overlay = undefined;
      if (payload.type === "customCode") { if (manualBranches && beat.conditionalBranch) break; continue; }
    }
    switch (payload.type) {
      case "background": background = { assetId: payload.assetId, beatId: beat.id }; backgroundUnknown = false; characters = []; charactersUnknown = false; break;
      case "showCharacter": {
        characters = characters.filter((item) => item.characterId !== payload.characterId);
        characters.push({ characterId: payload.characterId, appearanceId: payload.appearanceId, placement: payload.placement, visibleBeatId: beat.id, appearanceBeatId: beat.id, placementBeatId: beat.id });
        break;
      }
      case "hideCharacter": characters = characters.filter((item) => item.characterId !== payload.characterId); break;
      case "changeAppearance": characters = characters.map((item) => item.characterId === payload.characterId ? { ...item, appearanceId: payload.appearanceId, appearanceBeatId: beat.id } : item); break;
      case "placement": characters = characters.map((item) => item.characterId === payload.characterId ? { ...item, placement: payload.placement, placementBeatId: beat.id } : item); break;
      case "playMusic": music = { assetId: payload.assetId, beatId: beat.id }; musicUnknown = false; break;
      case "stopMusic": music = undefined; musicUnknown = false; break;
      case "setVariable": {
        if (typeof payload.value === "object") {
          const state = beat.assignment?.state;
          if (state?.status === "known" && !manualBranches) variables[payload.variableId] = { value: state.value, beatId: beat.id };
          else { delete variables[payload.variableId]; variablesUnknown = true; unknownBeatIds.push(beat.id); }
        } else variables[payload.variableId] = { value: payload.value, beatId: beat.id };
        break;
      }
      case "dialogue": overlay = { kind: "dialogue", text: payload.text, beatId: beat.id }; break;
      case "narration": overlay = { kind: "narration", text: payload.text, beatId: beat.id }; break;
      case "choice": overlay = { kind: "choice", choice: payload, text: "", beatId: beat.id }; break;
      case "jump": overlay = { kind: "jump", text: "Jump", beatId: beat.id }; break;
      case "call": overlay = { kind: "call", text: "Call Scene · preview state unknown", beatId: beat.id }; break;
      case "repeatChoice": overlay = { kind: "repeatChoice", text: "Repeat this Choice. Live availability is unknown.", beatId: beat.id }; break;
      case "return": overlay = { kind: "return", text: "Return to caller or main menu", beatId: beat.id }; break;
      case "playSfx": case "transition": break;
      case "showScreen": case "hideScreen": case "callScreen": break;
    }
    if (payload.type === "choice") {
      if (!unknownBeatIds.includes(beat.id)) unknownBeatIds.push(beat.id);
      const firstOption = scene.beats.find(b => b.id === payload.options[0]?.id);
      const selected = firstOption?.conditionalBranch && manualBranches?.get(firstOption.conditionalBranch.groupId);
      if (!selected || !payload.options.some(option => option.id === selected)) break;
    }
    if (payload.type === "jump" || payload.type === "repeatChoice" || payload.type === "return") break;
  }
  return { throughBeatId: lastVisitedBeatId, partial: unknownBeatIds.length > 0, unknownBeatIds, background, backgroundUnknown, characters, charactersUnknown, music, musicUnknown, variables, variablesUnknown, overlay };
}

export type SceneCommand = Readonly<Record<string, unknown>> & { readonly type: string };

export interface RecoveryEvidence { readonly path: string; readonly acceptedRetained: boolean; readonly displacedRetained: boolean }
export type RecoveryMutationState = "preparedWithoutStage" | "stagedWithBaseIntact" | "exchangeCompleteExpected" | "exchangeCompleteConflict" | "externalRevisionWithAcceptedCopy" | "durable" | "ambiguous";
export interface RecoveryItem {
  readonly transactionId: string;
  readonly state: { readonly name: string };
  readonly code?: string;
  readonly mutations: readonly RecoveryMutationState[];
  readonly affected: readonly RecoveryEvidence[];
}
export interface RecoveryReport { readonly items: readonly RecoveryItem[] }

export interface SceneActions {
  readonly screenCatalog?: () => Promise<ScreenCatalog>;
  readonly resolveScreenTarget?: (binding: ScreenTargetBinding) => Promise<ResolvedScreenTarget>;
  readonly screenHint?: ScreenTargetBinding;
  readonly screenHintKind?: "panel" | "dialog";
  readonly screenInsertion?: ScreenInsertion;
  readonly rememberScreenInsertion?: (target:ScreenInsertion) => void;
  readonly current?: () => boolean;
  readonly caller?: StoryTarget;
  readonly viewScene?: (target: StoryTarget) => void;
  readonly viewContinuation?: (sceneId: string, beatId: string, expectedSourceRevision: string) => void;
  readonly assist?: (sceneId: string, beatId: string, action?: string) => void;
  readonly layoutKey?: string;
  /** Scene to show first; falls back to the project's last open scene. */
  readonly sceneId?: string;
  /** Records a scene the author selected. Selection never writes project files. */
  readonly rememberScene?: (sceneId: string) => void;
  /** Called when the number of pending beat drafts changes. */
  readonly draftsChanged?: () => void;
  readonly validateAssignment?: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision" | "authoringRevision">) => Promise<AssignmentDraftValidation>;
  /** `drafts` names the beat drafts the command commits or discards; core joins their draft steps. */
  readonly apply: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision" | "authoringRevision">, drafts?: readonly string[]) => Promise<SceneWorkspace>;
  /** Story Save: accepts every beat draft command in one transaction, or none. `drafts[i]` is the draft `commands[i]` saves. */
  readonly saveDrafts?: (commands: readonly SceneCommand[], expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision" | "authoringRevision">, drafts: readonly string[]) => Promise<SceneWorkspace>;
  /** Adds a draft step to the project history (ADR 0025). */
  readonly recordStep?: (step: DraftStepRecord) => Promise<void>;
  /** Reads the current workspace, so Story can refresh after a stale refusal. */
  readonly load?: () => Promise<SceneWorkspace>;
  readonly status: (message: string, kind?: "normal" | "error", links?: readonly StatusLink[]) => void;
  readonly present: (assetId: string, purpose: MediaPresentation["purpose"]) => Promise<MediaPresentation>;
  readonly resolution: { readonly width: number; readonly height: number };
  readonly viewSource?: (path: string, byteStart?: number, byteEnd?: number, expectedRevision?: string) => void;
}

export interface RecoveryActions {
  readonly resolve: (transactionId: string, resolution: "keepCurrent" | "acceptLoomlight") => Promise<RecoveryReport>;
  readonly status: (message: string, kind?: "normal" | "error") => void;
  readonly completed: () => void;
}

const beatLabels: Record<BeatPayload["type"], string> = {
  background: "Background",
  showCharacter: "Show Character",
  hideCharacter: "Hide Character",
  showScreen: "Show screen",
  callScreen: "Call screen",
  hideScreen: "Hide screen",
  changeAppearance: "Change Appearance",
  placement: "Placement",
  dialogue: "Dialogue",
  narration: "Narration",
  playMusic: "Play Music",
  stopMusic: "Stop Music",
  playSfx: "Play SFX",
  transition: "Transition",
  setVariable: "Set Variable",
  choice: "Choice",
  jump: "Jump",
  call: "Call Scene",
  repeatChoice: "Repeat this Choice",
  return: "Return",
  customCode: "Custom Code",
};

function treeMenu(controls:HTMLElement):HTMLElement {const menu=document.createElement("details");menu.className="tree-menu";const toggle=document.createElement("summary");toggle.textContent="⋯";toggle.ariaLabel="Scene or chapter actions";menu.append(toggle,controls);return menu;}
function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function input(value = ""): HTMLInputElement {
  const element = document.createElement("input");
  element.type = "text";
  element.value = value;
  return element;
}

function labelled(label: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = document.createElement("label");
  wrapper.className = "field compact-field";
  const caption = document.createElement("span");
  caption.textContent = label;
  wrapper.append(caption, control);
  return wrapper;
}

function selectOf<T extends string>(values: readonly { readonly value: T; readonly label: string }[], selected?: string): HTMLSelectElement {
  const control = document.createElement("select");
  for (const item of values) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    control.append(option);
  }
  if (selected !== undefined) control.value = selected;
  return control;
}

function entitySelect(values: readonly { readonly id: string; readonly label: string }[], selected?: string): HTMLSelectElement {
  const items = values.map((item) => ({ value: item.id, label: item.label }));
  const missing = selected !== undefined && !values.some(item => item.id === selected);
  if (missing || !items.length) items.unshift({ value: selected ?? "", label: selected ? `Unavailable · ${selected}` : "Select an item" });
  const control = selectOf(items, selected);
  if (missing || !values.length) control.options[0]!.dataset.unavailable = "true";
  return control;
}

const trackedDrafts = new WeakSet<HTMLElement>();
const trackedDraftControls = new WeakSet<HTMLElement>();
function dirtyDraft(group: HTMLElement, controls: readonly HTMLElement[]): void {
  group.classList.add("scene-draft");
  for (const control of controls) if (!trackedDraftControls.has(control)) { trackedDraftControls.add(control); for (const event of ["input", "change"]) control.addEventListener(event, () => { group.dataset.unsubmitted = "true"; }); }
  if (trackedDrafts.has(group)) return;
  trackedDrafts.add(group);
  for (const event of ["input", "change"]) group.addEventListener(event, event => { if (event.target instanceof HTMLElement && event.target.closest(".scene-draft") === group) group.dataset.unsubmitted = "true"; });
}

export function hasSceneDraft(root: ParentNode = document): boolean {
  return root.querySelector('.scene-draft[data-unsubmitted="true"]') !== null;
}

export function focusSceneDraft(root: ParentNode = document): void {
  root.querySelector<HTMLElement>('.scene-draft[data-unsubmitted="true"] input, .scene-draft[data-unsubmitted="true"] textarea, .scene-draft[data-unsubmitted="true"] select')?.focus();
}

function friendlyError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function presentationUrl(media: MediaPresentation): string {
  const binary = atob(media.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: media.mimeType }));
}

type ExpectedRevisions = Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision" | "authoringRevision">;
const expectedRevisions = (model: SceneWorkspace): ExpectedRevisions => ({ projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision, ...(model.authoringRevision ? { authoringRevision: model.authoringRevision } : {}) });

/** The scene Story shows: the preferred scene if it exists, else the project's last open scene. */
export function storyScene(model: SceneWorkspace, preferred?: string): SceneDocument | undefined {
  return model.scenes.find(scene => scene.id === preferred) ?? model.scenes.find(scene => scene.id === model.lastOpen.sceneId) ?? model.scenes[0];
}

/** A status-line link: one scene and its failing drafts after a refused Story Save. */
export interface StatusLink { readonly label: string; readonly count: number; readonly open: () => void }
export interface StoryStatus { readonly text: string; readonly kind: "normal" | "error"; readonly links: readonly StatusLink[] }
/** A beat draft that stopped a Story Save, and why. */
export interface StorySaveFailure { readonly sceneId: string; readonly beatId?: string; readonly message: string }
export type StorySaveOutcome =
  | { readonly kind: "saved" }
  | { readonly kind: "busy" | "blocked" }
  // Every failing draft, in project order. Story reveals the first.
  | { readonly kind: "refused"; readonly failures: readonly StorySaveFailure[] };

/**
 * The Story view for one open project session. The shell keeps it while the author
 * visits other workspaces, so beat drafts and their editors survive (ADR 0024).
 */
export interface StoryView {
  readonly host: HTMLElement;
  readonly treeHost: HTMLElement;
  /** Shows a fresh workspace model, keeping every beat draft. */
  update(model: SceneWorkspace, actions: SceneActions, initialBeatId?: string): void;
  /** Whether beat drafts exist in the project, or in one scene. */
  hasDrafts(sceneId?: string): boolean;
  /** True while a Story write is in flight. */
  busy(): boolean;
  /** Whether a Story form other than a beat draft (a name, a move, a condition operation) has input. */
  hasOpenForm(): boolean;
  /** Where to reveal a pending beat draft. */
  firstDraft(): { readonly sceneId: string; readonly beatId?: string } | undefined;
  /** Resolves true when the author may leave Story; beat drafts never block. */
  settle(): Promise<boolean>;
  /** Story Save: checks every pending beat draft, then saves all of them or none. */
  save(): Promise<StorySaveOutcome>;
  /** The refusal status while a refused Story Save has drafts left to save. */
  saveStatus(): StoryStatus | undefined;
  /** Ends an unfinished typing step and resolves once every draft step has reached core. */
  flushSteps(): Promise<void>;
  /** Restores a beat draft to its state before (Undo) or after (Redo) a draft step. False for an unknown step. */
  applyStep(step: DraftStep, direction: HistoryDirection): boolean;
  /** Whether a field belongs to a beat draft, where Cmd/Ctrl+Z runs project Undo. */
  ownsDraftField(target: EventTarget | null): boolean;
  dispose(): void;
}

export function renderStoryView(
  host: HTMLElement,
  treeHost: HTMLElement,
  initial: SceneWorkspace,
  initialActions: SceneActions,
  initialBeatId?: string,
): StoryView {
  let actions = initialActions;
  const liveActions = new Proxy({} as SceneActions, { get: (_target, key) => actions[key as keyof SceneActions] });
  let model = initial;
  let screenInsertion = actions.screenInsertion ? structuredClone(actions.screenInsertion) : undefined;
  const rememberScreenInsertion = (insertion: ScreenInsertion): void => {
    screenInsertion = structuredClone(insertion);
    actions.rememberScreenInsertion?.(structuredClone(insertion));
  };
  let selectedBeatId: string | undefined = initialBeatId;
  let selectedSceneId = storyScene(initial, actions.sceneId)?.id;
  const selectScene = (sceneId: string): void => { selectedSceneId = sceneId; actions.rememberScene?.(sceneId); };
  let mediaGeneration = 0;
  const imageCache = new Map<string, { readonly key: string; readonly url: string }>();
  const pendingImages = new Map<string, Promise<MediaPresentation>>();
  const audioUrls = new Set<string>();
  let disposed = false;
  let writingFocus = false;
  const collapsedChapters=new Set<string>();
  const collapsedConditions = new Set<string>();
  const manualBranches = new Map<string, string>();
  let focusedBranch: string | undefined;
  const layoutObservers:ResizeObserver[]=[];
  let resetPreviewAllocation:(()=>void)|undefined;
  let cancelBeatDrag:(()=>void)|undefined;
  const resetLayout=():void=>resetPreviewAllocation?.();
  window.addEventListener("loomlight-reset-layout",resetLayout);
  let settling: Promise<boolean> | undefined;
  let composing = false;
  let pendingWrites = 0;
  // Beat drafts for the project session, keyed by beat id or by a new beat's insertion place.
  // A new beat is a draft from the moment it is added; an existing beat only once edited.
  // `command` throws when the draft is incomplete, invalid or conflicts with source.
  // For draft steps (ADR 0025), `id` names the draft in core's history, `kind` names its
  // beat, `editors` keep editor state that controls do not show, `detach` removes a new
  // beat's editor, `state` is the draft after its last step (none before its first) and
  // `lastStep` orders Story Save, so the most recently edited beat ends on top.
  // `conflict` compares the draft with source now (see DraftConflict); `primary` is the
  // field the comparison sits above.
  interface BeatDraft { readonly id: string; readonly panel: HTMLElement; readonly sceneId: string; readonly beatId?: string; readonly place?: () => { body: BodyRef; position: Position }; readonly read?: () => BeatPayload; readonly command: () => SceneCommand; readonly kind: () => string; readonly editors: () => readonly BeatEditor[]; readonly conflict: () => DraftConflict | undefined; readonly primary: () => HTMLElement; readonly detach?: () => void; state?: DraftState; lastStep: number }
  let newBeatDrafts = 0, draftSequence = 0;
  const beatDrafts = new Map<string, BeatDraft>();
  const invalidDraft = "This beat draft is invalid. Draft retained.";
  // After a refused Story Save: each failing draft and why, until it is saved or cancelled.
  let refusal: { readonly lead: string; readonly failing: Map<BeatDraft, string> } | undefined;
  const isPending = (draft: BeatDraft): boolean => !draft.beatId || draft.panel.dataset.unsubmitted === "true";
  const pendingDrafts = (sceneId?: string): BeatDraft[] => [...beatDrafts.values()].filter(draft => isPending(draft) && (sceneId === undefined || draft.sceneId === sceneId));
  let reportedDrafts = 0;
  const draftsChanged = (edited?: BeatDraft): void => {
    settleRefusal(edited);
    markDrafts();
    const count = pendingDrafts().length;
    if (count !== reportedDrafts) { reportedDrafts = count; actions.draftsChanged?.(); }
  };
  const keepDraft = (key: string, fields: Omit<BeatDraft, "id" | "lastStep" | "state">): BeatDraft => {
    const draft: BeatDraft = { ...fields, id: `draft:${++draftSequence}`, lastStep: 0 };
    draft.panel.dataset.beatDraftKey = key; beatDrafts.set(key, draft);
    for (const event of ["input", "change"]) draft.panel.addEventListener(event, stepEvent(draft));
    draft.panel.addEventListener("focusout", event => { if (openText?.field === event.target) closeText(); });
    for (const event of ["input", "change"]) draft.panel.addEventListener(event, () => draftsChanged(draft));
    // Text previews as the author types; other fields preview once complete.
    let typing: ReturnType<typeof setTimeout> | undefined;
    draft.panel.addEventListener("input", event => { if ((event.target as HTMLElement | null)?.tagName === "TEXTAREA") { clearTimeout(typing); typing = setTimeout(refreshPreview, 150); } });
    draft.panel.addEventListener("change", refreshPreview);
    draftsChanged();
    return draft;
  };

  // Draft steps (ADR 0025). Each step adds an entry to core's project history when it
  // starts, so it keeps its place among other edits. Core holds only its id, its
  // draft, a name and an item; Story keeps the draft's controls before and after it.
  // A text step ends when its field loses focus or after 2 seconds without typing.
  // Each change to another control is one step.
  // `sequence` and `previous` are the draft's `lastStep` after and before the step.
  const steps = new Map<string, { readonly draft: BeatDraft; readonly sequence: number; readonly previous: number; readonly before?: DraftState; after?: DraftState }>();
  let stepSequence = 0, restoring = false, recording: Promise<unknown> = Promise.resolve();
  let openText: { readonly draft: BeatDraft; readonly field: EventTarget; readonly stepId: string; timer?: ReturnType<typeof setTimeout> } | undefined;
  let openChange: string | undefined;
  const captureDraft = (draft: BeatDraft): DraftState => captureState(draft.panel, draft.editors());
  const stepName = (draft: BeatDraft, kind: "typing" | "change" | "new" | "cancel" | "discard"): string => {
    const scene = model.scenes.find(item => item.id === draft.sceneId)?.displayName ?? "a scene", beat = draft.kind();
    return `${kind === "new" ? `new ${beat} draft` : kind === "cancel" || kind === "discard" ? `${kind} of ${beat} draft` : `${beat} ${kind}`} in ${scene}`;
  };
  const startStep = (draft: BeatDraft, kind: Parameters<typeof stepName>[1], before: DraftState | undefined, after?: DraftState): string => {
    const stepId = `step:${++stepSequence}`;
    steps.set(stepId, { draft, sequence: stepSequence, previous: draft.lastStep, before, after }); draft.lastStep = stepSequence;
    const sent = actions.recordStep?.({ stepId, draft: draft.id, name: stepName(draft, kind), item: { type: "story", sceneId: draft.sceneId, beatId: draft.beatId ?? null } });
    // A step core refuses has no entry to undo; the draft keeps its input.
    recording = Promise.all([recording, sent?.catch(() => undefined)]);
    return stepId;
  };
  const endStep = (stepId: string): void => {
    const step = steps.get(stepId); if (!step) return;
    step.after = captureDraft(step.draft); step.draft.state = step.after;
  };
  const closeText = (): void => {
    if (!openText) return;
    const { stepId, timer } = openText; clearTimeout(timer); openText = undefined; endStep(stepId);
  };
  const stepEvent = (draft: BeatDraft) => (event: Event): void => {
    const target = event.target;
    if (restoring || disposed || !(target instanceof HTMLElement) || target.closest(".choice-new-scene")) return;
    if (isTextField(target)) {
      // The field's change event follows its typing, which is already a step.
      if (event.type !== "input") return;
      if (openText?.field !== target) { closeText(); openText = { draft, field: target, stepId: startStep(draft, "typing", draft.state) }; }
      const open = openText; clearTimeout(open.timer); open.timer = setTimeout(() => { if (openText === open) closeText(); }, 2000);
      return;
    }
    closeText();
    // A control can fire input and change, and an editor can re-dispatch one: together they are one step.
    if (openChange) return;
    const stepId = openChange = startStep(draft, "change", draft.state);
    queueMicrotask(() => { openChange = undefined; endStep(stepId); });
  };
  const forgetSteps = (drafts: readonly BeatDraft[]): void => { for (const [id, step] of steps) if (drafts.includes(step.draft)) steps.delete(id); };
  // Cancel and Discard draft are edits: Undo of either brings the draft back.
  const cancelStep = (key: string, kind: "cancel" | "discard" = "cancel"): void => {
    const draft = beatDrafts.get(key);
    if (!draft || !isPending(draft)) return;
    closeText(); startStep(draft, kind, captureDraft(draft)); draft.state = undefined;
  };
  // Undo or Redo of a step sets its draft to that step's state; no state ends the draft.
  const applyStep = (step: DraftStep, direction: HistoryDirection): boolean => {
    const record = steps.get(step.stepId); if (!record || disposed) return false;
    closeText();
    const { draft } = record, state = direction === "undo" ? record.before : record.after, key = draft.panel.dataset.beatDraftKey!;
    restoring = true;
    try {
      if (!state) {
        if (beatDrafts.get(key) === draft) beatDrafts.delete(key);
        delete draft.panel.dataset.unsubmitted; draft.detach?.();
      } else {
        beatDrafts.set(key, draft);
        if (draft.beatId) draft.panel.dataset.unsubmitted = "true";
        restoreState(draft.panel, state);
      }
    } finally { restoring = false; }
    draft.state = state; draft.lastStep = direction === "undo" ? record.previous : record.sequence;
    draftsChanged(draft); refreshPreview();
    return true;
  };
  // Reads a draft without moving focus or the caret, which a failing field read can do.
  const keepFocus = <T,>(read: () => T): T => {
    const active = document.activeElement as (HTMLElement & Partial<Pick<HTMLInputElement, "selectionStart" | "selectionEnd" | "setSelectionRange">>) | null;
    const caret = active?.setSelectionRange ? { start: active.selectionStart ?? null, end: active.selectionEnd ?? null } : undefined;
    try { return read(); } finally {
      if (active && document.activeElement !== active) { active.focus({ preventScroll: true }); if (caret) active.setSelectionRange?.(caret.start, caret.end); }
    }
  };
  // Valid beat drafts preview on the stage; invalid input previews the accepted beat.
  const readQuietly = (read: () => BeatPayload): BeatPayload | undefined => { try { return keepFocus(read); } catch { return undefined; } };
  const withDrafts = (scene: SceneDocument): SceneDocument => {
    const edits = new Map<string, BeatPayload>();
    const unknown = new Set<string>();
    for (const draft of pendingDrafts(scene.id)) {
      if (!draft.beatId || !draft.read) continue;
      // Reading an arithmetic draft validates it, so it is not read for the preview.
      if (scene.beats.find(beat => beat.id === draft.beatId)?.payload.type === "setVariable") { unknown.add(draft.beatId); continue; }
      const payload = readQuietly(draft.read); if (payload) edits.set(draft.beatId, payload);
    }
    if (!edits.size && !unknown.size) return scene;
    return { ...scene, beats: scene.beats.map(beat => {
      const payload = edits.get(beat.id);
      // Without the accepted core result, a calculation previews as unknown.
      if (unknown.has(beat.id)) { const { assignment: _accepted, ...rest } = beat; return rest; }
      return payload ? { ...beat, payload } : beat;
    }) };
  };
  let previewTarget: { readonly preview: HTMLElement; readonly sceneId: string } | undefined;
  const refreshPreview = (): void => {
    const scene = previewTarget && model.scenes.find(item => item.id === previewTarget!.sceneId);
    if (!previewTarget?.preview.isConnected || !scene || composing) return;
    mediaGeneration++; previewTarget.preview.replaceChildren(); renderPreview(previewTarget.preview, scene);
  };
  const dropDraft = (key: string): void => { beatDrafts.delete(key); draftsChanged(); };
  // Other open forms (names, moves, condition operations) still settle before navigation.
  const drafts = (): HTMLElement[] => [host, treeHost].flatMap(root => [...root.querySelectorAll<HTMLElement>('.scene-draft[data-unsubmitted="true"]')]).filter(form => !form.closest("[data-beat-draft-key]"));
  const hasDraft = (): boolean => drafts().length > 0;
  const focusDraft = (): void => { (drafts()[0] ?? host.querySelector<HTMLElement>("[data-beat-draft-key]"))?.querySelector<HTMLElement>("input, textarea, select")?.focus(); };
  const settle = async (): Promise<boolean> => {
    if (settling) await settling.catch(() => false);
    if (pendingWrites || composing || hasDraft()) { focusDraft(); return false; }
    return true;
  };

  // Locks every Story control while a write is in flight; the result unlocks them.
  const lockStory = (): (() => void) => {
    const locks = [host, treeHost].flatMap(root => [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input,select,textarea,button")]).map(control => ({ control, disabled: control.disabled }));
    locks.forEach(({ control }) => { control.disabled = true; }); pendingWrites++;
    return () => { pendingWrites--; locks.forEach(({ control, disabled }) => { if (control.isConnected) control.disabled = disabled; }); };
  };

  // Reloads Story after core refuses a stale request, keeping every draft. A failed
  // read keeps the shown model. False when the session ended meanwhile.
  const reload = async (): Promise<boolean> => {
    try { model = await actions.load!(); } catch { /* Keep the shown model; the author can try again. */ }
    if (disposed || actions.current?.() === false) return false;
    draw();
    return true;
  };

  // `committed` is the beat draft a Commit saves. A removal discards the drafts inside
  // what it removes. Core joins both drafts' steps into this edit (ADR 0025).
  // With `staleStatus`, a stale refusal reloads Story and reports that status (ADR 0007: no retry).
  const mutate = async (command: SceneCommand, after?: (before: SceneWorkspace, next: SceneWorkspace) => void, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision" | "authoringRevision"> = model, owner?: HTMLElement, committed?: BeatDraft, staleStatus?: string): Promise<boolean> => {
    if(disposed || actions.current?.() === false)return false;
    if (drafts().some(draft => draft !== owner && !owner?.contains(draft))) { actions.status("Complete or cancel the other edit first. Input retained.", "error"); focusDraft(); return false; }
    if (pendingWrites) { actions.status("Wait for the current change to finish.", "error"); return false; }
    const before = model;
    const joined = committed ? [committed] : discardedBy(command);
    closeText();
    const unlock = lockStory();
    actions.status("Saving…");
    try {
      const next = await actions.apply(command, expected, joined.map(draft => draft.id));
      if (disposed || actions.current?.() === false) return false;
      model = next;
      forgetSteps(joined);
      if (removals.has(command.type)) dropRemovedDrafts(next);
      // A command that creates a scene opens it; other commands keep the author's selection.
      if (!before.scenes.some(scene => scene.id === next.lastOpen.sceneId)) selectScene(next.lastOpen.sceneId);
      after?.(before, next);
      draw();
      actions.status("Saved");
      return true;
    } catch (error) {
      if (disposed || actions.current?.() === false) return false;
      if (staleStatus && (error as { code?: string }).code === "SOURCE_CONFLICT" && actions.load) {
        if (await reload()) actions.status(staleStatus, "error");
        return false;
      }
      actions.status(`${friendlyError(error, "Scene change could not be saved")} Input retained. If this source structure cannot be moved safely, edit it in Source.`, "error");
      focusDraft();
      return false;
    } finally { unlock(); }
  };

  // Shows a draft's editor: its scene, its beat and any condition that hides it.
  const reveal = (draft: BeatDraft): void => {
    const scene = model.scenes.find(item => item.id === draft.sceneId);
    if (scene && scene.id !== selectedSceneId) selectScene(scene.id);
    const place = draft.place?.().body, anchor = draft.beatId ?? (place?.type === "branch" ? place.branchId : undefined);
    if (scene && anchor) {
      const ids = ancestry(scene, anchor);
      for (const id of ids) collapsedConditions.delete(id);
      if (focusedBranch && !ids.has(focusedBranch)) focusedBranch = undefined;
    }
    selectedBeatId = draft.beatId;
    draw();
    draft.panel.querySelector<HTMLElement>("input, textarea, select")?.focus();
  };
  // Reads every pending draft's command. Nothing is sent while any draft fails.
  // Commands go in the order of each draft's last step, so core puts the most recently
  // edited beat on top of the history.
  const preflight = (): { readonly drafts: BeatDraft[]; readonly commands: SceneCommand[]; readonly failures: [BeatDraft, string][] } => {
    const pending = pendingDrafts().sort((a, b) => a.lastStep - b.lastStep), commands: SceneCommand[] = [], failures: [BeatDraft, string][] = [];
    for (const draft of pending) { try { commands.push(draft.command()); } catch (error) { failures.push([draft, friendlyError(error, invalidDraft)]); } }
    return { drafts: pending, commands, failures };
  };
  // A draft's place in project order: its scene, then its beat or insertion point.
  const projectOrder = (draft: BeatDraft): readonly [number, number] => {
    const sceneIndex = model.scenes.findIndex(item => item.id === draft.sceneId), scene = model.scenes[sceneIndex];
    if (!scene) return [model.scenes.length, 0];
    // A beat or anchor that left source sorts after the scene's beats.
    const at = (node: NodeRef): number => { const index = scene.beats.findIndex(beat => JSON.stringify(nodeRef(beat)) === JSON.stringify(node)); return index < 0 ? scene.beats.length + 1 : index; };
    if (draft.beatId) return [sceneIndex, at({ type: "beat", beatId: draft.beatId })];
    const place = draft.place?.();
    if (!place) return [sceneIndex, scene.beats.length];
    if (place.position.type === "before") return [sceneIndex, at(place.position.anchor) - 0.5];
    const { body } = place, last = nodeBeats(scene, body).at(-1);
    if (last) return [sceneIndex, scene.beats.indexOf(last) + 0.5];
    return [sceneIndex, body.type === "branch" ? scene.beats.findIndex(beat => beat.id === body.branchId) + 0.5 : scene.beats.length];
  };
  const inProjectOrder = <T,>(items: readonly T[], draft: (item: T) => BeatDraft): T[] => {
    const order = new Map(items.map(item => [item, projectOrder(draft(item))]));
    return [...items].sort((a, b) => { const [x, y] = [order.get(a)!, order.get(b)!]; return x[0] - y[0] || x[1] - y[1]; });
  };
  // The status line after a refused Save: the failing count, then one link per scene.
  const saveStatus = (): StoryStatus | undefined => {
    if (!refusal || !host.isConnected) return undefined;
    const total = pendingDrafts().length, failing = [...refusal.failing.keys()], drafts = total === 1 ? "draft" : "drafts";
    if (!failing.length) return { text: `${total} unsaved beat ${drafts}. Ready to save.`, kind: "normal", links: [] };
    // Each link reveals the scene's first failing draft at the time of the click.
    const open = (sceneId: string): void => { const draft = inProjectOrder([...refusal?.failing.keys() ?? []].filter(item => item.sceneId === sceneId), item => item)[0]; if (draft) reveal(draft); };
    const links = model.scenes.flatMap(scene => {
      const count = failing.filter(draft => draft.sceneId === scene.id).length;
      return count ? [{ label: scene.displayName, count, open: () => open(scene.id) }] : [];
    });
    return { text: `${refusal.lead} ${failing.length} of ${total} ${drafts} ${failing.length === 1 ? "needs" : "need"} changes:`, kind: "error", links };
  };
  // Status changes only when the count or links change, so typing does not replace other status.
  const statusKey = (): string => { const status = saveStatus(); return JSON.stringify(status && [status.text, status.links.map(link => [link.label, link.count])]); };
  const showRefusal = (): void => { const status = saveStatus(); if (status) actions.status(status.text, status.kind, status.links); };
  // Drops failing drafts that were saved or cancelled, and rechecks the one the author edited.
  const settleRefusal = (edited?: BeatDraft): void => {
    if (!refusal) return;
    const before = statusKey(), live = new Set(pendingDrafts());
    for (const draft of refusal.failing.keys()) if (!live.has(draft)) refusal.failing.delete(draft);
    if (edited && refusal.failing.has(edited)) {
      try { keepFocus(edited.command); refusal.failing.delete(edited); } catch (error) { refusal.failing.set(edited, friendlyError(error, invalidDraft)); }
    }
    if (!live.size) { refusal = undefined; return; }
    if (statusKey() !== before) showRefusal();
  };
  // Marks every failing draft, reveals the first in project order and shows the count with a link per scene.
  const refuseSave = (unordered: readonly (readonly [BeatDraft, string])[], lead = "Nothing saved."): StorySaveOutcome => {
    const failures = inProjectOrder(unordered, ([draft]) => draft);
    refusal = { lead, failing: new Map(failures) };
    reveal(failures[0]![0]);
    showRefusal();
    return { kind: "refused", failures: failures.map(([draft, message]) => ({ sceneId: draft.sceneId, ...(draft.beatId ? { beatId: draft.beatId } : {}), message })) };
  };
  const saveDrafts = async (): Promise<StorySaveOutcome> => {
    if (disposed || actions.current?.() === false || !actions.saveDrafts) return { kind: "blocked" };
    if (settling || pendingWrites) { actions.status("Wait for the current Story change to finish. Nothing saved.", "error"); return { kind: "busy" }; }
    if (hasDraft()) { actions.status("Commit or cancel the open Story form before saving. Nothing saved.", "error"); focusDraft(); return { kind: "blocked" }; }
    closeText();
    const { drafts: saving, commands, failures } = preflight();
    if (failures.length) return refuseSave(failures);
    const expected = expectedRevisions(model);
    refusal = undefined; markDrafts();
    const unlock = lockStory();
    actions.status("Saving…");
    try {
      const next = await actions.saveDrafts(commands, expected, saving.map(draft => draft.id));
      if (disposed || actions.current?.() === false) return { kind: "blocked" };
      for (const [key, draft] of beatDrafts) if (saving.includes(draft)) { if (!draft.beatId) draft.panel.remove(); beatDrafts.delete(key); }
      forgetSteps(saving);
      model = next; selectedBeatId = undefined;
      draw(); draftsChanged();
      return { kind: "saved" };
    } catch (error) {
      if (disposed || actions.current?.() === false) return { kind: "blocked" };
      const { code, actionIndex } = error as { code?: string; actionIndex?: number };
      // A stale model refreshes; only drafts whose own beat changed then conflict (ADR 0007: no retry).
      if (code === "SOURCE_CONFLICT" && actions.load) {
        if (!await reload()) return { kind: "blocked" };
        const conflicts = preflight().failures;
        if (conflicts.length) return refuseSave(conflicts, "Story changed in source and was refreshed. Nothing saved.");
        actions.status("Story changed in source and was refreshed. Nothing saved. Save again.", "error");
        return { kind: "refused", failures: [] };
      }
      const reason = friendlyError(error, "Story drafts could not be saved.");
      const refused = actionIndex === undefined ? undefined : saving[actionIndex];
      if (refused) return refuseSave([[refused, reason]]);
      actions.status(`Nothing saved. ${reason} Drafts retained.`, "error");
      return { kind: "refused", failures: [] };
    } finally { unlock(); }
  };

  const draftGuard = (): boolean => {
    if (settling || pendingWrites) { actions.status("Wait for the current Beat change to finish.", "error"); focusDraft(); return false; }
    if (!hasDraft()) return true;
    actions.status("Commit or cancel the open form before navigating.", "error");
    focusDraft();
    return false;
  };
  // Removing beats the author chose discards their drafts after a confirmed operation.
  const removals = new Set(["removeStoryNode", "removeConditionBranch", "unwrapCondition", "deleteScene"]);
  // Core already dropped the steps of the drafts `mutate` named. Any other draft keeps
  // its steps, so their Undo still brings it back.
  const dropRemovedDrafts = (next: SceneWorkspace): void => {
    for (const [key, draft] of beatDrafts) {
      const scene = next.scenes.find(item => item.id === draft.sceneId);
      const place = draft.place?.().body, body = place?.type === "branch" ? place.branchId : undefined;
      if (!scene || [draft.beatId, body].some(id => id && !scene.beats.some(beat => beat.id === id))) beatDrafts.delete(key);
    }
    draftsChanged();
  };
  // The pending drafts a removal discards, as its confirmation says: those inside the
  // removed scene, beat, condition or branch, except a kept branch when unwrapping.
  const discardedBy = (command: SceneCommand): BeatDraft[] => {
    const scene = model.scenes.find(item => item.id === command.sceneId);
    if (!scene || !removals.has(command.type)) return [];
    const within = (id: unknown): BeatDraft[] => typeof id === "string" ? pendingDrafts(scene.id).filter(draft => draftsWithin(scene, id, [draft])) : [];
    if (command.type === "deleteScene") return pendingDrafts(scene.id);
    if (command.type === "unwrapCondition") { const kept = within(command.branchId); return within(command.groupId).filter(draft => !kept.includes(draft)); }
    const node = command.node as NodeRef | undefined;
    return within(command.type === "removeConditionBranch" ? command.branchId : node?.type === "beat" ? node.beatId : node?.groupId);
  };
  // Ids of a beat and every branch, group and beat that contains it.
  const ancestry = (scene: SceneDocument, beatId: string): Set<string> => {
    const ids = new Set<string>();
    let node = scene.beats.find(beat => beat.id === beatId);
    for (let steps = 0; node && steps <= scene.beats.length; steps++) {
      ids.add(node.id); if (node.conditionalBranch) ids.add(node.conditionalBranch.groupId);
      const owner: SceneBeat["owner"] = node.owner; if (!owner) break;
      ids.add(owner.groupId); ids.add(owner.branchId); node = scene.beats.find(beat => beat.id === owner.branchId);
    }
    return ids;
  };
  // Whether any of `drafts` (by default the scene's pending drafts) sits inside node `id`.
  const draftsWithin = (scene: SceneDocument, id: string, drafts: readonly BeatDraft[] = pendingDrafts(scene.id)): boolean => drafts.some(draft => {
    const place = draft.place?.().body;
    const anchor = draft.beatId ?? (place?.type === "branch" ? place.branchId : undefined);
    return draft.sceneId === scene.id && !!anchor && ancestry(scene, anchor).has(id);
  });
  const discardNote = (copy: HTMLElement, scene: SceneDocument, id: string, text = "Its unsaved beat drafts are discarded."): void => { if (draftsWithin(scene, id)) copy.textContent += ` ${text}`; };

  const draw = (): void => {
    cancelBeatDrag?.();
    layoutObservers.splice(0).forEach(o=>o.disconnect());
    // An unedited editor is rebuilt from accepted source; only edited ones are drafts.
    for (const [key, draft] of beatDrafts) if (!isPending(draft)) beatDrafts.delete(key);
    mediaGeneration += 1;
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
    treeHost.replaceChildren();
    host.replaceChildren();
    const selectedScene = storyScene(model, selectedSceneId);
    if (!selectedScene) {
      const empty = document.createElement("p"); empty.className = "error-message"; empty.textContent = "No valid Scene is available."; host.append(empty); return;
    }
    drawTree(selectedScene);
    drawBeats(selectedScene);
    restoreNewBeatDrafts(selectedScene);
    showLostDrafts(selectedScene);
    for (const draft of pendingDrafts()) drawConflict(draft);
    settleRefusal();
    markDrafts();
  };

  // A draft whose beat, place or scene left source has no beat to sit under. It shows
  // above the shown scene's beats, with the comparison and Discard draft.
  const showLostDrafts = (scene: SceneDocument): void => {
    const lost = pendingDrafts().filter(draft => (draft.sceneId === scene.id || !model.scenes.some(item => item.id === draft.sceneId)) && "missing" in (draft.conflict() ?? {}));
    host.querySelector(".beats-list")?.prepend(...lost.map(draft => draft.panel));
  };
  // Shows or clears a draft's comparison (approved B, `story-draft-conflict` / `compact-v2`):
  // Conflict with source and the source text above the draft's field, then Discard draft
  // and Override source in place of its own actions.
  const drawConflict = (draft: BeatDraft): void => {
    const { panel } = draft, conflict = draft.conflict();
    panel.querySelectorAll(".story-conflict, .story-resolution").forEach(node => node.remove());
    panel.querySelectorAll<HTMLElement>("[data-draft-label]").forEach(caption => { caption.textContent = caption.dataset.draftLabel!; delete caption.dataset.draftLabel; });
    const own = panel.querySelector<HTMLElement>(":scope > .row-actions");
    if (own) own.hidden = !!conflict;
    if (!conflict) { delete panel.dataset.conflict; return; }
    panel.dataset.conflict = "true";
    // Dialogue and narration keep their text field: the comparison goes right above it.
    const field = draft.primary(), caption = field.tagName === "TEXTAREA" && panel.contains(field) ? field.closest("label")?.querySelector<HTMLElement>(":scope > span") ?? undefined : undefined;
    const section = document.createElement("section"); section.className = "story-conflict"; section.tabIndex = -1; section.setAttribute("aria-label", "Conflict with source");
    const heading = document.createElement("strong"); heading.textContent = "Conflict with source";
    const copy = document.createElement("p"); section.append(heading, copy);
    if ("missing" in conflict) copy.textContent = conflict.missing;
    else {
      copy.textContent = "The source changed after you started editing.";
      const source = document.createElement("output"); source.className = "story-conflict-source"; source.textContent = conflict.source;
      section.append(labelled("Source", source));
    }
    if (caption) { caption.dataset.draftLabel = caption.textContent ?? ""; caption.textContent = "Your draft"; caption.parentElement!.before(section); }
    else {
      const top = panel.querySelector(":scope > .story-breadcrumb, :scope > h3");
      if (top) top.after(section); else panel.prepend(section);
    }
    const resolution = document.createElement("div"); resolution.className = "story-resolution";
    const row = document.createElement("div"); row.className = "row-actions";
    const discard = button("Discard draft", "button secondary"); discard.addEventListener("click", () => discardDraft(draft));
    row.append(discard); resolution.append(row);
    if ("override" in conflict) {
      const override = button("Override source", "button primary"); override.addEventListener("click", conflict.override);
      const note = document.createElement("p"); note.textContent = "Other drafts stay unsaved.";
      row.append(override); resolution.append(note);
    }
    if (own) own.before(resolution); else panel.append(resolution);
  };
  // Discard draft keeps source and removes only this draft. Like Cancel, it is an edit
  // that Undo reverses. The beat stays selected, so its editor shows source.
  const discardDraft = (draft: BeatDraft): void => {
    if (settling || pendingWrites) return;
    const key = draft.panel.dataset.beatDraftKey!;
    cancelStep(key, "discard"); draft.detach?.(); dropDraft(key); draw();
  };

  // A body's beat list: the root list or a condition or Choice branch.
  const bodyList = (body: BodyRef): HTMLElement | undefined => body.type === "root"
    ? host.querySelector<HTMLElement>(".beats-list") ?? undefined
    : [...host.querySelectorAll<HTMLElement>(".story-branch-body")].find(node => node.dataset.branchId === body.branchId);
  const restoreNewBeatDrafts = (scene: SceneDocument): void => {
    for (const draft of beatDrafts.values()) if (!draft.beatId && draft.sceneId === scene.id && draft.place) bodyList(draft.place().body)?.prepend(draft.panel);
  };
  // Quiet markers: the Screens draft convention on beat rows and scene rows. A draft
  // that conflicts with source gets a quiet "!". After a refused Save, failing drafts
  // get a red "!" and show why in their editor; a conflict shows its comparison instead.
  const markDrafts = (): void => {
    const beats = new Set(pendingDrafts().flatMap(draft => draft.beatId ? [draft.beatId] : []));
    const scenes = new Set(pendingDrafts().map(draft => draft.sceneId));
    const conflicting = new Set(pendingDrafts().filter(draft => draft.conflict()).flatMap(draft => draft.beatId ? [draft.beatId] : []));
    const failing = refusal?.failing ?? new Map<BeatDraft, string>();
    const failingBeats = new Set([...failing.keys()].flatMap(draft => draft.beatId ? [draft.beatId] : []));
    const failingScenes = new Set([...failing.keys()].map(draft => draft.sceneId));
    const mark = (node: HTMLElement, label: Element | null, has: boolean, fails = false, conflict = false): void => {
      node.dataset.beatDraft = String(has);
      if (fails) node.dataset.saveRefused = "true"; else node.removeAttribute("data-save-refused");
      if (conflict) node.dataset.beatConflict = "true"; else node.removeAttribute("data-beat-conflict");
      if (has) label?.setAttribute("aria-description", fails ? "Unsaved draft. Needs changes." : conflict ? "Unsaved draft. Conflict with source." : "Unsaved draft"); else label?.removeAttribute("aria-description");
    };
    host.querySelectorAll<HTMLElement>(".beat-card").forEach(card => { const id = card.dataset.beatId ?? ""; mark(card, card.querySelector(":scope > .beat-compact > .beat-select"), beats.has(id), failingBeats.has(id), conflicting.has(id)); });
    const shown = storyScene(model, selectedSceneId);
    host.querySelectorAll<HTMLElement>(".story-condition-group").forEach(group => { const id = group.dataset.conditionGroupId ?? ""; mark(group, group.querySelector(":scope > .story-group-heading > strong"), !!shown && draftsWithin(shown, id), !!shown && draftsWithin(shown, id, [...failing.keys()])); });
    treeHost.querySelectorAll<HTMLElement>(".tree-scene-row").forEach(row => mark(row, row.querySelector(".tree-scene-open"), scenes.has(row.dataset.sceneId ?? ""), failingScenes.has(row.dataset.sceneId ?? "")));
    for (const draft of beatDrafts.values()) {
      const reason = failing.get(draft);
      let note = draft.panel.querySelector<HTMLElement>(":scope > .story-save-reason");
      if (reason === undefined) { draft.panel.removeAttribute("data-save-refused"); note?.remove(); continue; }
      draft.panel.dataset.saveRefused = "true";
      if (draft.conflict()) { note?.remove(); continue; }
      if (!note) { note = document.createElement("p"); note.className = "error-message story-save-reason"; draft.panel.prepend(note); }
      if (note.textContent !== reason) note.textContent = reason;
    }
  };

  const treeName = (target: HTMLElement, label: string, initial: string, command: (displayName: string) => SceneCommand): void => {
    if (!draftGuard()) return;
    const expected = { projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision };
    inlineName(target, label, initial, displayName => {
      const panel = target.querySelector<HTMLElement>(":scope > .tree-inline");
      if (!panel || disposed || actions.current?.() === false) return Promise.resolve(false);
      return mutate(command(displayName), undefined, expected, panel);
    });
  };
  const drawTree = (selectedScene: SceneDocument): void => {
    const heading = document.createElement("div"); heading.className = "tree-heading";
    const label = document.createElement("p"); label.className = "eyebrow"; label.textContent = "Story tree";
    const create = button("New Chapter", "text-button");
    create.addEventListener("click", () => treeName(treeHost, "Chapter name", "New Chapter", displayName => ({ type: "createChapter", displayName })));
    heading.append(label, create); treeHost.append(heading);
    model.chapters.forEach((chapter, chapterIndex) => {
      const chapterGroup = document.createElement("section"); chapterGroup.className = "tree-chapter";
      const row = document.createElement("div"); row.className = "tree-chapter-row";
      const name = document.createElement("strong"); name.textContent = chapter.displayName;
      const tools = document.createElement("div"); tools.className = "tree-tools";
      const rename = button("Rename", "icon-button"); rename.ariaLabel = `Rename chapter ${chapter.displayName}`;
      rename.addEventListener("click", () => treeName(chapterGroup, "Chapter name", chapter.displayName, displayName => ({ type: "renameChapter", chapterId: chapter.id, displayName })));
      const up = button("↑", "icon-button"); up.ariaLabel = `Move chapter ${chapter.displayName} up`; up.disabled = chapterIndex === 0;
      up.addEventListener("click", () => void mutate({ type: "moveChapter", chapterId: chapter.id, direction: "up" }));
      const down = button("↓", "icon-button"); down.ariaLabel = `Move chapter ${chapter.displayName} down`; down.disabled = chapterIndex === model.chapters.length - 1;
      down.addEventListener("click", () => void mutate({ type: "moveChapter", chapterId: chapter.id, direction: "down" }));
      const remove = button("Delete", "icon-button"); remove.ariaLabel = `Delete empty chapter ${chapter.displayName}`;
      remove.disabled = model.chapters.length === 1 || model.scenes.some((scene) => scene.chapterId === chapter.id);
      remove.addEventListener("click", () => confirmAction(chapterGroup, `Delete empty chapter “${chapter.displayName}”?`, () => mutate({ type: "deleteChapter", chapterId: chapter.id })));
      tools.append(rename, up, down, remove); const disclosure=button(collapsedChapters.has(chapter.id)?"▸":"▾","icon-button chapter-disclosure");disclosure.ariaLabel=`Toggle chapter ${chapter.displayName}`;disclosure.ariaExpanded=String(!collapsedChapters.has(chapter.id));
      disclosure.onclick=()=>{const collapsed=!collapsedChapters.has(chapter.id);if(collapsed)collapsedChapters.add(chapter.id);else collapsedChapters.delete(chapter.id);chapterGroup.querySelectorAll<HTMLElement>(".tree-scene-row,.tree-new-scene").forEach(e=>e.hidden=collapsed);disclosure.textContent=collapsed?"▸":"▾";disclosure.ariaExpanded=String(!collapsed);};row.append(disclosure,name, treeMenu(tools)); chapterGroup.append(row);
      const scenes = model.scenes.filter((scene) => scene.chapterId === chapter.id);
      scenes.forEach((scene, sceneIndex) => {
        const sceneRow = document.createElement("div"); sceneRow.className = `tree-scene-row${scene.id === selectedScene.id ? " selected" : ""}`; sceneRow.dataset.sceneId = scene.id;
        const open = button(scene.displayName, "tree-scene-open");
        if (scene.id === selectedScene.id) open.ariaCurrent = "page";
        open.addEventListener("click",()=>{if(scene.id!==selectedScene.id)void settle().then(ok=>{if(ok&&!disposed){selectScene(scene.id);draw();}else if(!ok) actions.status("Complete or cancel this edit before changing scenes.","error");});});
        const controls = document.createElement("div"); controls.className = "tree-tools";
        const renameScene = button("Rename", "icon-button"); renameScene.ariaLabel = `Rename scene ${scene.displayName}`;
        renameScene.addEventListener("click", () => treeName(sceneRow, "Scene name", scene.displayName, displayName => ({ type: "renameScene", sceneId: scene.id, displayName })));
        const moveUp = button("↑", "icon-button"); moveUp.ariaLabel = `Move scene ${scene.displayName} up`; moveUp.disabled = sceneIndex === 0;
        moveUp.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "up", expectedSourceRevision: scene.sourceRevision }));
        const moveDown = button("↓", "icon-button"); moveDown.ariaLabel = `Move scene ${scene.displayName} down`; moveDown.disabled = sceneIndex === scenes.length - 1;
        moveDown.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "down", expectedSourceRevision: scene.sourceRevision }));
        const removeScene = button("Delete", "icon-button"); removeScene.ariaLabel = `Delete scene ${scene.displayName}`;
        removeScene.disabled = scene.id === model.entrySceneId || model.scenes.length === 1;
        removeScene.addEventListener("click", () => confirmAction(sceneRow, `Delete Scene “${scene.displayName}”? Incoming or opaque references will refuse this operation.${pendingDrafts(scene.id).length ? " Its unsaved beat drafts are discarded." : ""}`, () => mutate({ type: "deleteScene", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision })));
        controls.append(renameScene, moveUp, moveDown, removeScene);
        if (model.chapters.length > 1) {
          const target = entitySelect(model.chapters.filter((item) => item.id !== chapter.id).map((item) => ({ id: item.id, label: item.displayName })));
          target.ariaLabel = `Destination chapter for ${scene.displayName}`;
          const move = button("Move", "icon-button"); move.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: target.value, direction: null, expectedSourceRevision: scene.sourceRevision }));
          controls.append(target, move);
        }
        sceneRow.append(open, treeMenu(controls)); chapterGroup.append(sceneRow);
      });
      const newScene = button("+ New Scene", "tree-new-scene");
      newScene.addEventListener("click", () => treeName(chapterGroup, "Scene name", "New Scene", displayName => ({ type: "createScene", chapterId: chapter.id, displayName })));
      if(actions.assist){const draft=button("Assist · Draft Scene","tree-new-scene");draft.ariaLabel=`Draft Scene in ${chapter.displayName}`;draft.onclick=()=>{if(draftGuard())actions.assist?.(chapter.id,"","draftScene");};chapterGroup.append(draft);}
      chapterGroup.append(newScene);chapterGroup.querySelectorAll<HTMLElement>(".tree-scene-row,.tree-new-scene").forEach(e=>e.hidden=collapsedChapters.has(chapter.id)); treeHost.append(chapterGroup);
    });
  };

  const focusBeatOpener = (key: string): void => {
    const controls = [...host.querySelectorAll<HTMLButtonElement>("button[data-beat-opener]")].filter(control => !control.disabled && !control.closest("[hidden]"));
    const opener=controls.find(control => control.dataset.beatOpener === key) ?? controls.find(control => control.dataset.beatOpener === "root");
    opener?.focus({preventScroll:true});
    opener?.scrollIntoView?.({block:"nearest",inline:"nearest"});
  };
  const openNewBeat = (scene: SceneDocument, initialType: BeatPayload["type"] = actions.screenHintKind === "dialog" ? "callScreen" : "dialogue", beforeBeatId: string | null = null, opener = "root"): void => {
    if (!draftGuard()) return;
    const anchor = beforeBeatId ? scene.beats.find(beat => beat.id === beforeBeatId) : undefined;
    if (anchor && !nodeBeats(scene, { type: "root" }).includes(anchor)) {
      actions.status("Add a root Beat before or after the whole condition group.", "error"); return;
    }
    selectedBeatId = undefined;
    draw();
    const current = model.scenes.find((item) => item.id === scene.id);
    const list = host.querySelector<HTMLElement>(".beats-list");
    if (current && list) {
      const screenBeat = ["showScreen", "hideScreen", "callScreen"].includes(initialType);
      const remembered = screenInsertion;
      const hint = !anchor && screenBeat && remembered && (remembered.sceneId === scene.id || !model.scenes.some(item=>item.id===remembered.sceneId)) ? structuredClone(remembered) : undefined;
      const body = hint?.body ?? {type:"root"} as BodyRef;
      renderNewBeat(list, current, initialType, body, anchor ? {type:"before",anchor:nodeRef(anchor)} : hint?.position ?? defaultPlace(current, body), hint, opener);
    }
  };

  const loadImage = async (assetId: string, purpose: "thumbnail" | "imagePreview", image: HTMLImageElement, errorHost: HTMLElement): Promise<void> => {
    const generation = mediaGeneration;
    const assetHash = model.authoring.assets.find((asset) => asset.id === assetId)?.sha256;
    const cached = imageCache.get(assetId);
    if (cached && assetHash && cached.key.endsWith(assetHash)) { image.src = cached.url; return; }
    if (cached) { URL.revokeObjectURL(cached.url); imageCache.delete(assetId); }
    try {
      let pending = pendingImages.get(assetId);
      if (!pending) {
        pending = actions.present(assetId, purpose);
        pendingImages.set(assetId, pending);
        void pending.then(() => pendingImages.delete(assetId), () => pendingImages.delete(assetId));
      }
      const media = await pending;
      if (disposed || generation !== mediaGeneration || !image.isConnected) return;
      const replaced = imageCache.get(assetId);
      // Several images can await the same presentation (canvas and details).
      // Reuse its URL instead of revoking the URL just assigned to another image.
      if (replaced?.key === media.cacheKey) { image.src = replaced.url; return; }
      const url = presentationUrl(media);
      if (replaced) URL.revokeObjectURL(replaced.url);
      imageCache.set(assetId, { key: media.cacheKey, url }); image.src = url;
    } catch (error) {
      if (disposed || generation !== mediaGeneration || !errorHost.isConnected) return;
      image.remove(); const message = document.createElement("span"); message.className = "preview-media-error"; message.textContent = friendlyError(error, "Media unavailable"); errorHost.append(message);
    }
  };

  const audition = async (assetId: string, hostElement: HTMLElement, trigger: HTMLButtonElement): Promise<void> => {
    const generation = mediaGeneration; trigger.disabled = true; actions.status("Preparing audio audition…");
    try {
      const media = await actions.present(assetId, "audioAudition");
      if (disposed || generation !== mediaGeneration || !hostElement.isConnected) return;
      const url = presentationUrl(media); audioUrls.add(url);
      const audio = document.createElement("audio"); audio.controls = true; audio.autoplay = true; audio.src = url; audio.addEventListener("ended", () => { URL.revokeObjectURL(url); audioUrls.delete(url); });
      hostElement.replaceChildren(audio); actions.status("Audio audition started by user");
    } catch (error) { if (generation === mediaGeneration) { trigger.disabled = false; actions.status(friendlyError(error, "Audio audition unavailable"), "error"); trigger.focus(); } }
  };

  const renderPreview = (preview: HTMLElement, scene: SceneDocument): void => {
    const hasConditions = scene.beats.some(beat => beat.conditionalBranch);
    const state = deriveScenePreview(withDrafts(scene), hasConditions ? undefined : selectedBeatId, hasConditions ? manualBranches : undefined);
    if (hasConditions) {
      const manual = document.createElement("div"); manual.className = "illustrative-preview";
      const heading = document.createElement("h3"); heading.textContent = "Illustrative branch preview";
      const note = document.createElement("p"); note.textContent = "Manual selection · not a playthrough. Choose each encountered fork. Conditions and Choice availability are not evaluated."; manual.append(heading, note);
      for (const first of scene.beats.filter(beat => beat.conditionalBranch && !beat.conditionalBranch.ordinal && !beat.conditionalBranch.otherwise)) {
        const groupId = first.conditionalBranch!.groupId;
        const branches = scene.beats.filter(beat => beat.conditionalBranch?.groupId === groupId);
        const choices = [{ value: "", label: "Choose a branch" }, ...branches.map(branch => ({ value: branch.id, label: branchCaption(branch.conditionalBranch!, model) })), ...(!branches.some(branch => branch.conditionalBranch!.otherwise) ? [{ value: "no-match", label: "No branch matches · continue" }] : [])];
        const selector = selectOf(choices, manualBranches.get(groupId) ?? ""); selector.setAttribute("aria-label", `Illustrative branch ${groupId}`); selector.dataset.previewGroupId = groupId;
        selector.addEventListener("change", () => { if (selector.value) manualBranches.set(groupId, selector.value); else manualBranches.delete(groupId); mediaGeneration++; preview.replaceChildren(); renderPreview(preview, scene); });
        manual.append(labelled(`Preview condition ${conditionCaption(first.conditionalBranch!.condition ?? { status: "supported", expression: { type: "bool", value: true } }, model.authoring.variables)}`, selector));
      }
      preview.append(manual);
    }
    const selectedIndex = state.throughBeatId ? scene.beats.findIndex((beat) => beat.id === state.throughBeatId) : scene.beats.length - 1;
    const header = document.createElement("div"); header.className = "preview-header";
    const heading = document.createElement("h2"); heading.textContent = "Scene Preview";
    const through = document.createElement("span"); through.textContent = selectedIndex >= 0 ? `Through Beat ${selectedIndex + 1}` : "Scene start";
    if (state.partial) { const badge = document.createElement("strong"); badge.className = "partial-badge"; badge.textContent = "Partial / unknown"; header.append(heading, through, badge); } else header.append(heading, through);
    const choice = state.overlay?.choice;
    const surround = document.createElement("div"); surround.className = choice ? "preview-surround choice-preview" : "preview-surround";
    const canvas = document.createElement("div"); canvas.className = "preview-canvas"; canvas.style.aspectRatio = `${actions.resolution.width} / ${actions.resolution.height}`;
    if (state.background) {
      const image = document.createElement("img"); image.className = "preview-background"; image.alt = model.authoring.assets.find((asset) => asset.id === state.background?.assetId)?.displayName ?? "Scene background";
      canvas.append(image); void loadImage(state.background.assetId, "imagePreview", image, canvas);
    } else {
      const empty = document.createElement("p"); empty.className = "preview-empty"; empty.textContent = state.backgroundUnknown ? "Background unknown after code or unevaluated flow" : "No background at this point";
      if (choice && state.backgroundUnknown) { empty.title = empty.textContent; empty.textContent = "Background unknown"; }
      canvas.append(empty);
    }
    for (const visible of state.characters) {
      const figure = document.createElement("figure"); figure.className = `preview-character ${visible.placement}`;
      const appearance = model.authoring.appearances.find((item) => item.id === visible.appearanceId);
      const character = model.authoring.characters.find((item) => item.id === visible.characterId);
      if (appearance?.assetId) { const image = document.createElement("img"); image.alt = `${character?.displayName ?? "Character"} — ${appearance.label}`; figure.append(image); void loadImage(appearance.assetId, "imagePreview", image, figure); }
      const caption = document.createElement("figcaption"); caption.textContent = character?.displayName ?? "Character"; figure.append(caption); canvas.append(figure);
    }
    if (state.charactersUnknown) { const unknown = document.createElement("span"); unknown.className = "preview-unknown-layer"; unknown.textContent = "Other character state may be unknown"; canvas.append(unknown); }
    if (state.overlay && !choice) {
      const overlay = document.createElement("div"); overlay.className = `preview-overlay ${state.overlay.kind}`;
      overlay.textContent = state.overlay.text || (state.overlay.kind === "dialogue" ? "Empty dialogue" : state.overlay.kind);
      if (state.overlay.kind === "dialogue") {
        const beat = scene.beats.find(b => b.id === state.overlay?.beatId);
        if (beat?.payload.type === "dialogue") {
          const characterId = beat.payload.characterId;
          const name = document.createElement("strong"); name.className = "preview-speaker";
          name.textContent = model.authoring.characters.find(character => character.id === characterId)?.displayName ?? ""; overlay.prepend(name);
        }
      }
      canvas.append(overlay);
    }
    let stage = surround;
    if (choice) {
      stage = document.createElement("div"); stage.className = "preview-game-stage"; stage.setAttribute("aria-label", "Game stage");
      stage.append(canvas); surround.append(stage, renderChoiceSummary(choice, model.authoring.characters));
    } else surround.append(canvas);
    preview.append(header, surround);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        const bounds = stage.getBoundingClientRect(), ratio = actions.resolution.width / actions.resolution.height;
        const width = Math.max(1, Math.min(bounds.width, bounds.height * ratio));
        canvas.style.width = `${width}px`; canvas.style.height = `${width / ratio}px`;
      });
      observer.observe(stage); layoutObservers.push(observer);
    }

    const details = document.createElement("div"); details.className = "preview-details scene-context-inspector";details.hidden=!(actions.layoutKey&&layoutFor(actions.layoutKey).inspectorOpen);
    const toggle=button("Scene details");toggle.ariaExpanded=String(!details.hidden);toggle.addEventListener("click",()=>{details.hidden=!details.hidden;toggle.ariaExpanded=String(!details.hidden);if(actions.layoutKey)saveLayout(actions.layoutKey,{inspectorOpen:!details.hidden});});header.append(toggle);
    const close=button("Close details");close.addEventListener("click",()=>{details.hidden=true;toggle.ariaExpanded="false";toggle.focus();if(actions.layoutKey)saveLayout(actions.layoutKey,{inspectorOpen:false});});details.append(close);
    const provenance = document.createElement("div"); provenance.className = "preview-provenance";
    const provenanceHeading = document.createElement("h3"); provenanceHeading.textContent = "Visible state and provenance"; provenance.append(provenanceHeading);
    const contribution = (label: string, beatId: string | undefined, addType: BeatPayload["type"]): void => {
      const row = document.createElement("div"); row.className = "provenance-row"; const name = document.createElement("span"); name.textContent = label; row.append(name);
      if (beatId) { const index = scene.beats.findIndex((beat) => beat.id === beatId); const edit = button(`Edit Beat ${index + 1}`, "text-button"); edit.addEventListener("click", () => { if (draftGuard()) { selectedBeatId = beatId; draw(); host.querySelector<HTMLElement>(".beat-card.selected")?.scrollIntoView?.({ block: "nearest" }); } }); row.append(edit); }
      const add = button("Add change here", "text-button"); add.dataset.beatOpener = `change:${addType}`; add.disabled = !!selectedBeatId && !nodeBeats(scene, { type: "root" }).some(beat => beat.id === selectedBeatId); add.addEventListener("click", () => openNewBeat(scene, addType, selectedBeatId ?? null, `change:${addType}`)); row.append(add); provenance.append(row);
    };
    contribution(state.backgroundUnknown ? "Background · unknown" : "Background", state.background?.beatId, "background");
    state.characters.forEach((character) => contribution(`${model.authoring.characters.find((item) => item.id === character.characterId)?.displayName ?? "Character"} · ${character.placement}`, character.appearanceBeatId, "changeAppearance"));
    contribution(state.musicUnknown ? "Music · unknown" : "Music", state.music?.beatId, "playMusic");
    const knownVariables = Object.entries(state.variables); knownVariables.forEach(([id, value]) => contribution(`Variable ${model.authoring.variables.find((item) => item.id === id)?.technicalName ?? id} = ${String(value.value)}`, value.beatId, "setVariable"));
    if (state.variablesUnknown && !knownVariables.length) { const unknown = document.createElement("p"); unknown.className = "muted"; unknown.textContent = "Variable state is unknown after code or unevaluated flow."; provenance.append(unknown); }
    details.append(provenance);
    const media = document.createElement("div"); media.className = "preview-media"; const mediaHeading = document.createElement("h3"); mediaHeading.textContent = "Scene media"; media.append(mediaHeading);
    const referenced = new Set<string>(); if (state.background) referenced.add(state.background.assetId); state.characters.forEach((character) => { const assetId = model.authoring.appearances.find((item) => item.id === character.appearanceId)?.assetId; if (assetId) referenced.add(assetId); });
    for (const assetId of referenced) { const tile = document.createElement("div"); tile.className = "asset-thumbnail"; const image = document.createElement("img"); const asset = model.authoring.assets.find((item) => item.id === assetId); image.alt = asset?.displayName ?? "Asset thumbnail"; const label = document.createElement("span"); label.textContent = asset?.displayName ?? "Asset"; tile.append(image, label); media.append(tile); void loadImage(assetId, "thumbnail", image, tile); }
    const selectedBeat = scene.beats.find((beat) => beat.id === selectedBeatId);
    const audible = selectedBeat?.payload.type === "playSfx" ? selectedBeat.payload.assetId : state.music?.assetId;
    if (audible) { const audioHost = document.createElement("div"); audioHost.className = "audio-audition"; const play = button(selectedBeat?.payload.type === "playSfx" ? "Audition selected SFX" : "Audition current music"); play.addEventListener("click", () => void audition(audible, audioHost, play)); media.append(play, audioHost); }
    details.append(media); preview.append(details);
  };

  const operation = (scene: SceneDocument, target: HTMLElement, title: string, fields: readonly HTMLElement[], read: () => SceneCommand, actionLabel: string, focusId?: string): HTMLElement => {
    const expected = { projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision };
    const panel = document.createElement("section"); panel.className = "story-operation scene-draft"; panel.setAttribute("aria-label", title);
    const heading = document.createElement("h3"); heading.textContent = title;
    const breadcrumb = document.createElement("p"); breadcrumb.className = "story-breadcrumb"; breadcrumb.textContent = `${scene.displayName} · changes apply once and can be undone`;
    const row = document.createElement("div"); row.className = "row-actions";
    const cancel = button("Cancel", "text-button"); const apply = button(actionLabel, "button primary"); apply.disabled = scene.sourceConflict;
    let pending = false;
    const close = (): void => { if (pending) return; panel.remove(); selectedBeatId = undefined; composing = false; target.querySelector<HTMLElement>(".beat-select")?.focus(); };
    cancel.addEventListener("click", close);
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; });
    panel.addEventListener("keydown", event => { if (event.key !== "Escape") return; event.preventDefault(); if (pending) return; if (panel.dataset.unsubmitted === "true") { actions.status("Use Cancel to discard this draft, or keep editing."); cancel.focus(); } else close(); });
    apply.addEventListener("click", () => {
      if (pending || settling || composing) return;
      const save = async (): Promise<boolean> => {
        let locks: { control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement; disabled: boolean }[] = [];
        try {
          const command = read(); pending = true; panel.dataset.unsubmitted = "true"; panel.setAttribute("aria-busy", "true");
          locks = [...panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input,select,textarea,button")].map(control => ({ control, disabled: control.disabled })); locks.forEach(({ control }) => { control.disabled = true; });
          const saved = await mutate({ sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, ...command }, () => { selectedBeatId = undefined; }, expected, panel);
          if (saved && focusId) { const row = [...host.querySelectorAll<HTMLElement>("[data-beat-id]")].find(item => item.dataset.beatId === focusId); row?.scrollIntoView?.({ block: "nearest" }); row?.querySelector<HTMLElement>(".beat-select")?.focus(); }
          return saved;
        } catch (error) { actions.status(friendlyError(error, "Check these details. Input retained."), "error"); return false; }
        finally { pending = false; if (panel.isConnected) { panel.removeAttribute("aria-busy"); locks.forEach(({ control, disabled }) => { control.disabled = disabled; }); (panel.querySelector<HTMLElement>('[aria-invalid="true"]') ?? panel.querySelector<HTMLElement>("input,select,textarea"))?.focus(); } }
      };
      settling = save().finally(() => { settling = undefined; });
    });
    row.append(cancel, apply); panel.append(heading, breadcrumb, ...fields, row); dirtyDraft(panel, []); target.append(panel);
    panel.querySelector<HTMLElement>("input,select,textarea")?.focus(); return panel;
  };
  const prepareOperation = (scene: SceneDocument, beat?: SceneBeat): HTMLElement | undefined => {
    if (!draftGuard()) return;
    selectedBeatId = undefined;
    if (beat?.conditionalBranch) collapsedConditions.delete(beat.conditionalBranch.groupId);
    let parent = beat ? beatBody(beat) : { type: "root" } as BodyRef;
    while (parent.type === "branch") { const owner = parent; collapsedConditions.delete(owner.groupId); const header = scene.beats.find(item => item.id === owner.branchId); parent = header ? beatBody(header) : { type: "root" }; }
    draw();
    return beat?.conditionalBranch?.choiceOption ? [...host.querySelectorAll<HTMLElement>(".story-choice-option")].find(item => item.dataset.optionId === beat.id)
      : beat ? [...host.querySelectorAll<HTMLElement>(".beat-card")].find(item => item.dataset.beatId === beat.id) : host.querySelector<HTMLElement>(".beats-list") ?? undefined;
  };
  const destinations = (scene: SceneDocument, initialBody: BodyRef, exclude?: SceneBeat, initialPosition?: Position, insertion = false, retained?: ScreenInsertion): { host: HTMLElement; read: () => { body: BodyRef; position: Position } } => {
    const panel = document.createElement("div"); panel.className = "story-destination";
    // A node never moves into its own bodies.
    const inner = exclude ? innerBodies(scene, exclude) : new Set<string>();
    const parents = scene.bodies.filter(item => item.body.type === "root" || !inner.has(item.body.branchId))
      .map(item => ({ key: item.body.type === "root" ? "root" : item.body.branchId, body: item.body, label: bodyCaption(scene, item.body, model) }));
    const initialParent = parents.find(item => item.body.type === initialBody.type && (item.body.type === "root" || initialBody.type === "branch" && item.body.groupId === initialBody.groupId && item.body.branchId === initialBody.branchId));
    const parent = selectOf(parents.map(item => ({ value: item.key, label: item.label })), initialParent?.key ?? ""); parent.setAttribute("aria-label", insertion ? "Insert in" : "Destination body");
    if(insertion && !parent.value){const missing=document.createElement("option");missing.value="unavailable-body";missing.textContent="Original body unavailable";parent.prepend(missing);parent.value="unavailable-body";}
    const position = document.createElement("select"); position.setAttribute("aria-label", insertion ? "Insert before" : "Destination position");
    const summary = document.createElement("p"); summary.className = "story-insertion"; if (insertion) summary.role = "status";
    let placements: { key: string; position: Position; label: string }[] = [];
    let confirmationRequired = !!retained && (retained.sceneId !== scene.id || retained.expectedSourceRevision !== scene.sourceRevision);
    const confirmationMessage = retained?.sceneId !== scene.id ? "The original insertion Scene is unavailable. Choose a replacement position explicitly. Input retained." : "The original insertion Scene changed. Choose its position explicitly. Input retained.";
    const show = (): void => { summary.textContent = confirmationRequired && !position.value ? confirmationMessage : `${insertion ? "Insert in" : "Move to"} ${parents.find(item => item.key === parent.value)?.label ?? "Missing body"} · ${placements.find(item => item.key === position.value)?.label ?? "Choose a position"}`; };
    const rebuild = (): void => {
      const selectedBody=parents.find(item=>item.key===parent.value);
      if(!selectedBody){placements=[];position.replaceChildren();summary.textContent="Original body unavailable. Choose a body explicitly. Input retained.";return;}
      const body = selectedBody.body, nodes = nodeBeats(scene, body);
      placements = (exclude ? movePlaces(scene, exclude, body) : bodyOf(scene, body)?.places ?? []).map(({ position }) => {
        const anchor = position.type === "before" ? nodes.find(beat => sameNode(nodeRef(beat), position.anchor)) : undefined;
        return anchor ? { key: anchor.id, position, label: `Before ${anchor.conditionalBranch ? "Condition" : beatLabels[anchor.payload.type]} · ${beatSummary(anchor.payload, model)}` } : { key: "end", position, label: "End of body" };
      });
      position.replaceChildren(...placements.map(item => { const option = document.createElement("option"); option.value = item.key; option.textContent = item.label; return option; }));
      const preferred = initialPosition ?? defaultPlace(scene, body); const match = placements.find(item => samePosition(item.position, preferred));
      if (confirmationRequired) { const choose=document.createElement("option");choose.value="";choose.textContent="Choose a position";choose.disabled=true;position.prepend(choose);position.value=""; }
      else if (insertion && initialPosition && !match) { const unavailable=document.createElement("option"); unavailable.value="unavailable";unavailable.textContent="Original position unavailable";position.prepend(unavailable);position.value="unavailable"; }
      else position.value = match?.key ?? placements[0]?.key ?? "";
      initialPosition=undefined; show();
    };
    parent.addEventListener("change", rebuild); position.addEventListener("change", () => { if (placements.some(item => item.key === position.value)) confirmationRequired = false; show(); }); rebuild(); panel.append(labelled(insertion ? "Insert in" : "Destination body", parent), labelled(insertion ? "Insert before" : "Destination position", position), summary);
    const validate = validateField(position, () => { if (!placements.some(item => item.key === position.value)) throw Error(confirmationRequired ? confirmationMessage : "Choose an available position in this body."); });
    return { host: panel, read: () => { validate(); return { body: parents.find(item => item.key === parent.value)!.body, position: placements.find(item => item.key === position.value)!.position }; } };
  };
  const openConditionForm = (scene: SceneDocument, body: BodyRef, position: Position): void => {
    const branch = body.type === "branch" ? scene.beats.find(beat => beat.id === body.branchId) : undefined;
    const target = prepareOperation(scene, branch); if (!target) return;
    const builder = buildConditionEditor(model.authoring.variables);
    const otherwise = document.createElement("input"); otherwise.type = "checkbox"; otherwise.setAttribute("aria-label", "Include Otherwise");
    const location = document.createElement("p"); location.className = "story-insertion";
    const anchor = position.type === "before" ? position.anchor : undefined;
    location.textContent = `Insert Condition in ${bodyCaption(scene, body, model)} · ${anchor ? `Before ${anchor.type === "condition" ? "Condition" : beatLabels[scene.beats.find(beat => beat.id === anchor.beatId)!.payload.type]}` : "End of body"}`;
    operation(scene, target, "Add Condition", [location, builder.host, labelled("Include Otherwise", otherwise)], () => ({ type: "insertCondition", body, position, condition: builder.read(), otherwise: otherwise.checked }), "Create Condition");
  };
  const groupHeader = (scene: SceneDocument, groupId: string): SceneBeat => scene.beats.find(beat => beat.conditionalBranch?.groupId === groupId && !beat.conditionalBranch.ordinal && !beat.conditionalBranch.otherwise)!;
  const groupCount = (scene: SceneDocument, header: SceneBeat): number => { const inner = innerBodies(scene, header); return scene.beats.filter(beat => !beat.conditionalBranch && !beat.structuralPlaceholder && !!beat.owner && inner.has(beat.owner.branchId)).length; };
  // Move up or down: the listed place one node earlier or later, never across protected Custom Code.
  const siblingPlace = (scene: SceneDocument, beat: SceneBeat, direction: "up" | "down"): Position | undefined => {
    const siblings = nodeBeats(scene, beatBody(beat)), index = siblings.indexOf(beat);
    const crossed = siblings[direction === "up" ? index - 1 : index + 1];
    if (index < 0 || !crossed || crossed.protected && !crossed.conditionalBranch) return undefined;
    const anchor = direction === "up" ? crossed : siblings[index + 2];
    const target: Position = anchor ? { type: "before", anchor: nodeRef(anchor) } : { type: "end" };
    return movePlaces(scene, beat, beatBody(beat)).some(place => samePosition(place.position, target)) ? target : undefined;
  };
  const addBranchForm = (scene: SceneDocument, header: SceneBeat, otherwise: boolean): void => {
    const target = prepareOperation(scene, header); if (!target) return;
    const groupId = header.conditionalBranch!.groupId, expectedBody = beatBody(header);
    const branches = scene.beats.filter(beat => beat.conditionalBranch?.groupId === groupId);
    const builder = otherwise ? undefined : buildConditionEditor(model.authoring.variables);
    const positions = branches.slice(1).map(branch => ({ value: branch.id, label: `Before ${branchCaption(branch.conditionalBranch!, model)}` }));
    if (!branches.some(branch => branch.conditionalBranch!.otherwise)) positions.push({ value: "end", label: "After the last Else If" });
    const position = selectOf(positions, branches.find(branch => branch.conditionalBranch!.otherwise)?.id ?? "end"); position.setAttribute("aria-label", "Branch position");
    const info = document.createElement("p"); info.textContent = otherwise ? "Otherwise goes last and runs when no earlier branch matches." : "The first matching branch wins. Choose this Else If's position.";
    const validate = validateField(position, () => { if (!positions.some(item => item.value === position.value)) throw Error("Choose a branch position."); });
    operation(scene, target, otherwise ? "Add Otherwise" : "Add Else If", [info, ...(builder ? [builder.host, labelled("Branch position", position)] : [])], () => { if (builder) validate(); return { type: "addConditionBranch", groupId, expectedBody, beforeBranchId: otherwise || position.value === "end" ? null : position.value, condition: builder?.read() ?? null }; }, otherwise ? "Create Otherwise" : "Create Else If", header.id);
  };
  const renderConditionBranch = (card: HTMLElement, scene: SceneDocument, beat: SceneBeat): void => {
    const branch = beat.conditionalBranch!, header = groupHeader(scene, branch.groupId);
    const note = document.createElement("p"); note.className = "story-breadcrumb"; note.textContent = `${bodyCaption(scene, { type: "branch", groupId: branch.groupId, branchId: beat.id }, model)} · Branch ${(branch.ordinal ?? 0) + 1}. First matching branch wins.`; card.append(note);
    if (!branch.otherwise && branch.condition?.status === "supported") {
      const builder = buildConditionEditor(model.authoring.variables, branch.condition);
      operation(scene, card, branch.ordinal ? "Edit Else If" : "Edit Condition", [builder.host], () => ({ type: "updateConditionBranch", groupId: branch.groupId, branchId: beat.id, expectedBody: beatBody(header), condition: builder.read() }), "Apply condition", beat.id);
    } else if (!branch.otherwise) { const source = button("View condition in Source"); source.disabled = !actions.viewSource; source.addEventListener("click", () => { if (draftGuard()) actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision); }); card.append(source); }
    if (branch.ordinal || branch.otherwise) {
      const remove = button("Delete branch"); remove.disabled = scene.sourceConflict;
      remove.addEventListener("click", () => { const target = prepareOperation(scene, beat); if (!target) return; const copy = document.createElement("p"); copy.textContent = `Delete ${branchCaption(branch, model)} and its contained Beats. Other branches remain.`; discardNote(copy, scene, beat.id); operation(scene, target, "Delete branch", [copy], () => ({ type: "removeConditionBranch", groupId: branch.groupId, branchId: beat.id, expectedBody: beatBody(header) }), "Delete this branch", header.id); }); card.append(remove);
    }
  };
  const moveNodeForm = (scene: SceneDocument, beat: SceneBeat): void => {
    const target = prepareOperation(scene, beat); if (!target) return;
    const destination = destinations(scene, beatBody(beat), beat);
    const note = document.createElement("p"); note.textContent = beat.conditionalBranch ? "Moves the entire condition and every branch together." : "Moves this Beat to the chosen body and position.";
    operation(scene, target, "Move story content", [note, destination.host], () => ({ type: "moveStoryNode", node: nodeRef(beat), expectedBody: beatBody(beat), ...destination.read() }), "Move to destination", beat.id);
  };
  const moveSibling = (scene: SceneDocument, beat: SceneBeat, direction: "up" | "down"): void => {
    if (!draftGuard()) return;
    const position = siblingPlace(scene, beat, direction); if (!position) return;
    void mutate({ type: "moveStoryNode", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, node: nodeRef(beat), expectedBody: beatBody(beat), body: beatBody(beat), position }, () => { selectedBeatId = undefined; }).then(saved => { if (saved) [...host.querySelectorAll<HTMLElement>(".beat-card")].find(item => item.dataset.beatId === beat.id)?.querySelector<HTMLElement>(".beat-select")?.focus(); });
  };
  const removeNodeForm = (scene: SceneDocument, beat: SceneBeat): void => {
    const target = prepareOperation(scene, beat); if (!target) return;
    const copy = document.createElement("p"); copy.textContent = beat.conditionalBranch ? `Delete ${branchCaption(beat.conditionalBranch, model)} and all ${groupCount(scene, beat)} contained Beats. Use Unwrap to keep one selected branch instead.` : `Delete this ${beatLabels[beat.payload.type]} Beat. If its branch becomes empty, Source keeps pass.`;
    discardNote(copy, scene, beat.conditionalBranch?.groupId ?? beat.id);
    operation(scene, target, beat.conditionalBranch ? "Delete entire condition" : "Delete Beat", [copy], () => ({ type: "removeStoryNode", node: nodeRef(beat), expectedBody: beatBody(beat) }), beat.conditionalBranch ? "Delete entire condition" : "Delete this Beat");
  };
  const unwrapForm = (scene: SceneDocument, header: SceneBeat): void => {
    const target = prepareOperation(scene, header); if (!target) return;
    const groupId = header.conditionalBranch!.groupId;
    const branches = scene.beats.filter(beat => beat.conditionalBranch?.groupId === groupId);
    const branch = selectOf(branches.map(item => ({ value: item.id, label: branchCaption(item.conditionalBranch!, model) })), branches[0]?.id); branch.setAttribute("aria-label", "Branch to keep");
    const copy = document.createElement("p"); const show = (): void => { copy.textContent = `Keep only ${branches.find(item => item.id === branch.value)?.conditionalBranch ? branchCaption(branches.find(item => item.id === branch.value)!.conditionalBranch!, model) : "the selected branch"} in ${bodyCaption(scene, beatBody(header), model)}. Remove the condition and all other branches; their bodies are not combined.`; }; branch.addEventListener("change", show); show();
    const note = document.createElement("p"); discardNote(note, scene, groupId, "Unsaved beat drafts in branches you do not keep are discarded.");
    operation(scene, target, "Unwrap one branch", [labelled("Branch to keep", branch), copy, ...(note.textContent ? [note] : [])], () => ({ type: "unwrapCondition", groupId, branchId: required(branch), expectedBody: beatBody(header) }), "Unwrap selected branch");
  };

  const drawBeats = (scene: SceneDocument): void => {
    const header = document.createElement("header"); header.className = "scene-header";
    const titleBlock = document.createElement("div");
    const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = model.chapters.find((chapter) => chapter.id === scene.chapterId)?.displayName ?? "Scene";
    const title = document.createElement("h1"); title.textContent = scene.displayName;
    const technical = document.createElement("code"); technical.textContent = `${scene.technicalLabel} · ${scene.sourcePath}`;
    titleBlock.append(eyebrow, title, technical);
    const history = document.createElement("div"); history.className = "scene-history";
    const mapped = scene.beats.find((beat) => beat.id === selectedBeatId) ?? scene.beats[0];
    const viewSource = button("View in Source"); viewSource.disabled = actions.viewSource === undefined; viewSource.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, mapped?.byteStart, mapped?.byteEnd, scene.sourceRevision));
    const focus = button(writingFocus ? "Exit Writing focus" : "Writing focus");focus.ariaPressed=String(writingFocus);focus.addEventListener("click",()=>{writingFocus=!writingFocus;host.dataset.writingFocus=String(writingFocus);host.closest<HTMLElement>(".project-shell")?.setAttribute("data-writing-focus",String(writingFocus));focus.textContent=writingFocus?"Exit Writing focus":"Writing focus";focus.ariaPressed=String(writingFocus);});
    if (actions.caller && actions.viewScene) { const caller = button("Back to caller"); caller.addEventListener("click", () => { if (draftGuard()) actions.viewScene?.(actions.caller!); }); history.append(caller); }
    if (focusedBranch) { const all = button("Show whole Scene"); all.addEventListener("click", () => { if (draftGuard()) { focusedBranch = undefined; draw(); } }); history.append(all); }
    history.append(viewSource, focus); header.append(titleBlock, history); host.append(header);
    if (scene.sourceConflict) {
      const conflict = document.createElement("section"); conflict.className = "state-banner error-state"; conflict.role = "alert";
      const heading = document.createElement("h2"); heading.textContent = "Source projection unavailable";
      const copy = document.createElement("p"); copy.textContent = "The current Source is invalid, missing, or unreconciled. The previous visual projection is stale; Scene writes and history remain blocked until the exact source revision is reconciled.";
      conflict.append(heading, copy); host.append(conflict);
    } else if (scene.partial) {
      const partial = document.createElement("p"); partial.className = "state-banner partial-state"; partial.textContent = "Preview and reference certainty are partial because this Scene contains protected Custom Code."; host.append(partial);
    }
    const stack = document.createElement("div"); stack.className = "scene-stack";
    const preview = document.createElement("section"); preview.className = "preview-region"; preview.setAttribute("aria-label", "Scene Preview");
    const beatsRegion = document.createElement("section"); beatsRegion.className = "beats-region"; beatsRegion.setAttribute("aria-label", "Beats writing surface");
    stack.append(preview, beatsRegion); host.append(stack); previewTarget = { preview, sceneId: scene.id }; renderPreview(preview, scene);
    const toolbar = document.createElement("div"); toolbar.className = "beats-toolbar";
    const heading = document.createElement("h2"); heading.textContent = "Beats";
    const add = button("Add Beat", "button primary"); add.dataset.beatOpener = "root"; add.disabled = scene.sourceConflict;
    add.addEventListener("click", () => openNewBeat(scene));
    let allocation=actions.layoutKey ? layoutFor(actions.layoutKey).previewPercent ?? 34 : 34;
    const divider=document.createElement("div");divider.className="preview-divider";divider.role="separator";divider.tabIndex=0;divider.ariaLabel="Resize scene preview";divider.setAttribute("aria-orientation","horizontal");divider.setAttribute("aria-valuemin","20");divider.setAttribute("aria-valuemax","70");
    const adjust=(value:number,remember=false):void=>{allocation=Math.min(70,Math.max(20,Math.round(value)));stack.style.setProperty("--preview-share",`${allocation}fr`);stack.style.setProperty("--beats-share",`${100-allocation}fr`);divider.setAttribute("aria-valuenow",String(allocation));if(remember&&actions.layoutKey)saveLayout(actions.layoutKey,{previewPercent:allocation});};
    adjust(allocation);resetPreviewAllocation=()=>adjust(34);
    divider.addEventListener("keydown",e=>{if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();adjust(allocation+(e.key==="ArrowUp"?-2:2),true);}});
    let dragging=false;divider.addEventListener("pointerdown",e=>{dragging=true;divider.setPointerCapture(e.pointerId);});divider.addEventListener("pointermove",e=>{if(dragging){const b=stack.getBoundingClientRect();adjust((e.clientY-b.top)/b.height*100);}});divider.addEventListener("pointerup",()=>{dragging=false;adjust(allocation,true);});divider.addEventListener("pointercancel",()=>{dragging=false;});stack.insertBefore(divider,beatsRegion);
    const tools = document.createElement("div"); tools.className = "beats-tools";tools.append(add);
    if (actions.screenCatalog && actions.resolveScreenTarget) {
      const screenBeat = button("Add screen Beat"); screenBeat.dataset.beatOpener = "screen"; screenBeat.disabled = scene.sourceConflict;
      screenBeat.addEventListener("click", () => openNewBeat(scene,actions.screenHintKind === "dialog" ? "callScreen" : "showScreen",null,"screen"));
      if (actions.screenHint) screenBeat.title = `Use ${actions.screenHint.sourceName.replaceAll("_"," ")} in this Scene`;
      tools.append(screenBeat);
    }
    const addCondition = button("Add Condition"); addCondition.disabled = scene.sourceConflict;
    addCondition.addEventListener("click", () => openConditionForm(scene, { type: "root" }, defaultPlace(scene, { type: "root" }))); tools.append(addCondition);
    if (actions.assist) {
      const selected=scene.beats.find(b=>b.id===selectedBeatId);
      const assist=button("Assist · Rewrite dialogue");
      assist.disabled=!selected||selected.protected||!!selected.owner||!!selected.conditionalBranch||!["dialogue","narration"].includes(selected.payload.type);
      assist.addEventListener("click",()=>{if(selected&&draftGuard())actions.assist?.(scene.id,selected.id);});
      const continuation=button("Assist · Continue Scene");
      const anchorIndex=scene.beats.findIndex(b=>b.id===selected?.id),terminalKinds=["return","jump","choice"];
      const adjacent=scene.beats.slice(Math.max(0,anchorIndex-1),anchorIndex+1);
      continuation.disabled=!selected||scene.sourceConflict||scene.beats.some(previewLogicBoundary)||!terminalKinds.includes(scene.beats.at(-1)?.payload.type??"")||scene.beats.slice(0,-1).some(b=>terminalKinds.includes(b.payload.type))||adjacent.some(b=>b.protected||!!b.owner||!!b.conditionalBranch)||!!scene.beats.at(-1)?.protected||!!scene.beats.at(-1)?.owner||!!scene.beats.at(-1)?.conditionalBranch;
      continuation.addEventListener("click",()=>{if(selected&&draftGuard())actions.assist?.(scene.id,selected.id,"continueScene");});
      const card=button("Assist · Draft Character card");card.disabled=assist.disabled||scene.sourceConflict;
      card.onclick=()=>{if(selected&&draftGuard())actions.assist?.(scene.id,selected.id,"generateCard");};
      const lore=button("Assist · Draft lore entry");lore.disabled=card.disabled;
      lore.onclick=()=>{if(selected&&draftGuard())actions.assist?.(scene.id,selected.id,"generateLore");};
      const edits=button("Assist · Edit Scene");edits.disabled=scene.sourceConflict||(assist.disabled&&continuation.disabled);
      edits.onclick=()=>{if(selected&&draftGuard())actions.assist?.(scene.id,selected.id,"editScene");};
      tools.append(assist,edits,continuation,card,lore);
    }
    toolbar.append(heading, tools); beatsRegion.append(toolbar);
    const reserveToolbar=():void=>{
      const height=toolbar.getBoundingClientRect().height;
      const controlHeight=Math.max(0,...[...toolbar.querySelectorAll("button")].map(control=>control.getBoundingClientRect().height));
      const focusClearance=4;
      const sticky=height+controlHeight+focusClearance*2<=beatsRegion.clientHeight;
      toolbar.style.position=sticky?"sticky":"static";
      beatsRegion.style.scrollPaddingTop=`${sticky?height+focusClearance:focusClearance}px`;
    };reserveToolbar();
    if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(reserveToolbar);observer.observe(toolbar);observer.observe(beatsRegion);layoutObservers.push(observer);}
    const list = document.createElement("div"); list.className = "beats-list"; list.setAttribute("role", "list"); beatsRegion.append(list);
    let drag:{id:string;from:number;pointerId:number;startX:number;startY:number;x:number;y:number;active:boolean;target?:number;grip:HTMLButtonElement;ghost?:HTMLElement}|undefined;
    let scrollFrame:number|undefined;
    const cancelDrag=():void=>{
      if(scrollFrame!==undefined)window.cancelAnimationFrame(scrollFrame);scrollFrame=undefined;
      const previous=drag;drag=undefined;previous?.ghost?.remove();
      if(previous?.grip.hasPointerCapture?.(previous.pointerId))previous.grip.releasePointerCapture(previous.pointerId);
      list.querySelectorAll(".drop-before,.drop-after,.dragging-beat").forEach(e=>e.classList.remove("drop-before","drop-after","dragging-beat"));
      window.removeEventListener("pointermove",moveDrag);window.removeEventListener("pointerup",dropDrag);window.removeEventListener("pointercancel",cancelDrag);window.removeEventListener("keydown",escapeDrag);window.removeEventListener("blur",cancelDrag);
    };
    cancelBeatDrag=cancelDrag;
    const updateTarget=():void=>{
      if(!drag)return;drag.target=undefined;
      list.querySelectorAll(".drop-before,.drop-after").forEach(e=>e.classList.remove("drop-before","drop-after"));
      const card=document.elementFromPoint(drag.x,drag.y)?.closest<HTMLElement>(".beat-card");
      if(!card||!list.contains(card))return;
      const target=scene.beats.findIndex(b=>b.id===card.dataset.beatId);
      if(target<0||target===drag.from)return;
      const interval=scene.beats.slice(Math.min(target,drag.from),Math.max(target,drag.from)+1);
      if(interval.some(b=>b.owner||b.protected||previewLogicBoundary(b)||["choice","jump","return"].includes(b.payload.type))||interval.some((b,i)=>i>0&&interval[i-1]!.byteEnd!==b.byteStart))return;
      drag.target=target;card.classList.add(target>drag.from?"drop-after":"drop-before");
    };
    const scrollDrag=():void=>{
      if(!drag?.active)return;
      // The panel owns scrolling; the list can extend far beyond its viewport.
      const bounds=beatsRegion.getBoundingClientRect(), content=list.getBoundingClientRect();
      const top=Math.max(bounds.top,content.top,toolbar.getBoundingClientRect().bottom);
      const bottom=Math.min(bounds.bottom,content.bottom);
      if(drag.x>=Math.max(bounds.left,content.left)&&drag.x<=Math.min(bounds.right,content.right)&&drag.y>=top&&drag.y<=bottom){const delta=drag.y<top+32?-10:drag.y>bottom-32?10:0;if(delta){beatsRegion.scrollTop+=delta;updateTarget();}}
      scrollFrame=window.requestAnimationFrame(scrollDrag);
    };
    const moveDrag=(event:PointerEvent):void=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      drag.x=event.clientX;drag.y=event.clientY;
      if(!drag.active&&Math.hypot(drag.x-drag.startX,drag.y-drag.startY)<6)return;
      event.preventDefault();
      if(!drag.active){drag.active=true;drag.grip.closest(".beat-card")?.classList.add("dragging-beat");const ghost=document.createElement("div");ghost.className="beat-drag-ghost";ghost.textContent=drag.grip.closest(".beat-compact")?.querySelector(".beat-select")?.textContent??"Move Beat";ghost.setAttribute("aria-hidden","true");document.body.append(ghost);drag.ghost=ghost;scrollFrame=window.requestAnimationFrame(scrollDrag);}
      drag.ghost!.style.left=`${drag.x+12}px`;drag.ghost!.style.top=`${drag.y+12}px`;updateTarget();
    };
    const dropDrag=(event:PointerEvent):void=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      drag.x=event.clientX;drag.y=event.clientY;if(drag.active)updateTarget();
      const {id,from,target,active,grip}=drag;cancelDrag();
      const moved=scene.beats.find(b=>b.id===id),onto=target===undefined?undefined:scene.beats[target];
      if(!active||!moved||!onto||target===undefined){if(grip.isConnected)grip.focus();return;}
      // Dropping below the start lands after the target; above it, before the target.
      const siblings=nodeBeats(scene,{type:"root"}),anchor=target>from?siblings[siblings.findIndex(b=>b.id===onto.id)+1]:onto;
      const position:Position=anchor?{type:"before",anchor:nodeRef(anchor)}:{type:"end"};
      if(!movePlaces(scene,moved,{type:"root"}).some(place=>samePosition(place.position,position))){actions.status("This beat cannot move there. Choose a listed place with Move to….","error");if(grip.isConnected)grip.focus();return;}
      void mutate({type:"moveStoryNode",sceneId:scene.id,expectedSourceRevision:scene.sourceRevision,node:nodeRef(moved),expectedBody:beatBody(moved),body:{type:"root"},position})
        .then(saved=>{if(saved)[...host.querySelectorAll<HTMLElement>(".beat-card")].find(row=>row.dataset.beatId===id)?.querySelector<HTMLElement>(".beat-grip")?.focus();});
    };
    const escapeDrag=(event:KeyboardEvent):void=>{if(event.key==="Escape"&&drag){event.preventDefault();const grip=drag.grip;cancelDrag();grip.focus();}};
    const branchHosts = new Map<string, HTMLElement>();
    const groupHosts = new Map<string, HTMLElement>();
    scene.beats.forEach((beat, index) => {
      if (beat.conditionalBranch?.choiceOption) {
        const branch = beat.conditionalBranch;
        const body: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }, info = bodyOf(scene, body);
        const menu = scene.beats.find(item => item.id === info?.owningNode);
        const option = menu?.payload.type === "choice" ? menu.payload.options.find(o => o.id === beat.id) : undefined;
        // Then edits an explicit ending beat. Custom Code that ends the option is edited in Source.
        const bodyEnding = info?.ending, endedAt = bodyEnding?.type === "ends" ? scene.beats.find(item => item.id === bodyEnding.beatId) : undefined;
        const code = endedAt?.payload.type === "customCode" ? endedAt : undefined;
        const explicit = endedAt && ["jump", "repeatChoice", "return"].includes(endedAt.payload.type) ? endedAt : undefined;
        const endingText = code?.payload.type === "customCode" ? `Ends with Custom Code: ${code.payload.source.trim()}` : bodyEnding?.type === "unknown" ? "Ending unknown: Custom Code can leave this option" : endedAt ? "Explicit transfer at the end of this option" : "Continue after the Choice";
        const section = document.createElement("section"); section.className = "story-choice-option story-branch-body"; section.dataset.optionId = beat.id; section.dataset.branchId = beat.id;
        section.style.setProperty("--option-color", ["var(--choice-arm-one)", "var(--choice-arm-two)", "var(--choice-arm-three)", "var(--choice-arm-four)"][(branch.ordinal ?? 0) % 4]!);
        const heading = document.createElement("strong"); heading.textContent = `${(branch.ordinal ?? 0) + 1}. ${option?.text ?? "Option"}`;
        const availability = document.createElement("p"); availability.textContent = option?.condition ? `Only when ${conditionCaption(option.condition, model.authoring.variables)}` : "Always available";
        const add = button("Add a Beat", "text-button"); add.dataset.beatOpener = `branch:${beat.id}`; add.disabled = scene.sourceConflict;
        add.addEventListener("click", () => { if (!draftGuard()) return; renderNewBeat(section, scene, "narration", body, defaultPlace(scene, body), undefined, `branch:${beat.id}`); });
        const then = button("Then", "text-button"); then.disabled = scene.sourceConflict || !!menu?.protected;
        then.addEventListener("click", () => {
          const target = prepareOperation(scene); if (!target) return;
          const ending = explicit;
          const kind = selectOf([{ value: "continue", label: "Continue after the Choice" }, { value: "jump", label: "Go to a Scene" }, { value: "repeatChoice", label: "Repeat this Choice" }, { value: "return", label: "Return to caller or main menu" }], ending?.payload.type ?? "continue"); kind.setAttribute("aria-label", "Then");
          const destination = entitySelect(model.scenes.map(s => ({ id: s.id, label: s.displayName })), ending?.payload.type === "jump" ? ending.payload.sceneId : ""); destination.setAttribute("aria-label", "Destination Scene");
          const destinationLabel = labelled("Destination Scene", destination); const show = (): void => { destinationLabel.hidden = kind.value !== "jump"; }; kind.addEventListener("change", show); show();
          const notes: HTMLElement[] = [];
          if (code || bodyEnding?.type === "unknown") { const note = document.createElement("p"); note.className = "story-continuation"; note.textContent = endingText; notes.push(note); }
          if (code) {
            kind.disabled = true;
            const source = button("Edit in Source", "button secondary"); source.disabled = !actions.viewSource;
            source.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, code.byteStart, code.byteEnd, scene.sourceRevision)); notes.push(source);
          }
          const panel = operation(scene, target, "Option ending", [...notes, labelled("Then", kind), destinationLabel], () => {
            if (code) throw Error("Custom Code ends this option. Edit it in Source.");
            if (kind.value === "continue") { if (!ending && menu) return { type: "updateBodyBeat", beatId: menu.id, expectedBody: beatBody(menu), beat: menu.payload }; if (!ending) throw Error("The owning Choice is unavailable."); return { type: "removeStoryNode", node: nodeRef(ending), expectedBody: body }; }
            const payload: BeatPayload = kind.value === "jump" ? { type: "jump", sceneId: required(destination) } : kind.value === "repeatChoice" ? { type: "repeatChoice", target: ending?.payload.type === "repeatChoice" ? ending.payload.target : null } : { type: "return" };
            return ending ? { type: "updateBodyBeat", beatId: ending.id, expectedBody: body, beat: payload } : { type: "insertBodyBeat", body, position: { type: "end" }, beat: payload };
          }, "Apply ending");
          if (code) panel.querySelectorAll<HTMLButtonElement>(".row-actions .button.primary").forEach(apply => { apply.disabled = true; });
        });
        const following = document.createElement("p"); following.className = "story-continuation"; following.textContent = endingText;
        const context = document.createElement("p"); context.className = "story-breadcrumb"; context.textContent = bodyCaption(scene, body, model);
        const addCondition = button("Add Condition", "text-button"); addCondition.disabled = scene.sourceConflict;
        addCondition.addEventListener("click", () => openConditionForm(scene, body, defaultPlace(scene, body)));
        const focus = button("Focus this branch", "text-button"); focus.addEventListener("click", () => { if (draftGuard()) { focusedBranch = beat.id; draw(); } });
        following.textContent += ` · ${bodyCaption(scene, info?.parent ?? { type: "root" }, model)}`;
        section.append(heading, context, availability, add, addCondition, focus, then, following); (beat.owner ? branchHosts.get(beat.owner.branchId) ?? list : list).append(section); branchHosts.set(beat.id, section); return;
      }
      const card = document.createElement("article"); card.className = `beat-card${selectedBeatId === beat.id ? " selected" : ""}`; card.setAttribute("role", "listitem");card.dataset.beatId=beat.id;
      if (beat.owner) { card.classList.add("nested-dialogue"); card.dataset.groupId=beat.owner.groupId; card.dataset.branchId=beat.owner.branchId; }
      if (beat.conditionalBranch) card.classList.add("conditional-branch");
      const compact = document.createElement("div"); compact.className = "beat-compact";
      const select = button(`${index + 1}. ${beat.conditionalBranch ? branchCaption(beat.conditionalBranch, model) : beatLabels[beat.payload.type]}`, "beat-select"); select.ariaExpanded = String(selectedBeatId === beat.id);
      const summary = document.createElement("span"); summary.className = "beat-summary"; summary.textContent = beat.structuralPlaceholder ? "Empty branch" : beat.conditionalBranch ? `Branch ${(beat.conditionalBranch.ordinal ?? 0) + 1} · first match wins` : beatSummary(beat.payload, model);
      select.append(summary); select.addEventListener("click",()=>{const selectBeat=():void=>{selectedBeatId=selectedBeatId===beat.id?undefined:beat.id;draw();[...host.querySelectorAll<HTMLElement>(".beat-card")].find(item=>item.dataset.beatId===beat.id)?.querySelector<HTMLElement>(".beat-select")?.focus();};if(!settling&&!pendingWrites&&!hasDraft()){selectBeat();return;}if(hasDraft()){actions.status("Commit or cancel the open form before changing Beats.","error");focusDraft();return;}actions.status("Wait for the current Beat change to finish.","error");});
      const controls = document.createElement("div"); controls.className = "beat-controls";
      const nodeEditable = !readOnlyLogic(beat) && !beat.structuralPlaceholder && (!beat.protected || !!beat.conditionalBranch && !beat.conditionalBranch.ordinal && !beat.conditionalBranch.otherwise);
      const up = button("↑", "icon-button"); up.ariaLabel = `Move beat ${index + 1} up`; up.disabled = !nodeEditable || !siblingPlace(scene, beat, "up") || scene.sourceConflict;
      up.addEventListener("click", () => moveSibling(scene, beat, "up"));
      const down = button("↓", "icon-button"); down.ariaLabel = `Move beat ${index + 1} down`; down.disabled = !nodeEditable || !siblingPlace(scene, beat, "down") || scene.sourceConflict;
      down.addEventListener("click", () => moveSibling(scene, beat, "down"));
      const remove = button("Delete", "icon-button"); remove.ariaLabel = `Delete beat ${index + 1}`; remove.disabled = !nodeEditable || beat.payload.type === "return" && !beat.owner || scene.sourceConflict;
      remove.addEventListener("click", () => removeNodeForm(scene, beat));
      const move = button("Move to…", "text-button"); move.disabled = !nodeEditable || scene.sourceConflict; move.addEventListener("click", () => moveNodeForm(scene, beat));
      select.addEventListener("keydown", event => { if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const direction = event.key === "ArrowUp" ? "up" : "down"; if (!(direction === "up" ? up : down).disabled) moveSibling(scene, beat, direction); } });
      const grip=button("⠿","icon-button beat-grip");grip.draggable=false;grip.ariaLabel=`Drag beat ${index+1} to reorder`;grip.title="Drag to reorder; use arrow controls with the keyboard";grip.disabled=!!beat.owner||beat.protected||previewLogicBoundary(beat)||["choice","jump","return"].includes(beat.payload.type)||scene.sourceConflict;
      grip.addEventListener("lostpointercapture",e=>{if(drag?.pointerId===e.pointerId)cancelDrag();});
      grip.addEventListener("pointerdown",e=>{if(e.button!==0||grip.disabled)return;if(hasDraft()||settling){actions.status("Complete or cancel the current edit first.","error");return;}e.preventDefault();cancelDrag();grip.focus();drag={id:beat.id,from:index,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,active:false,grip};grip.setPointerCapture?.(e.pointerId);window.addEventListener("pointermove",moveDrag,{passive:false});window.addEventListener("pointerup",dropDrag);window.addEventListener("pointercancel",cancelDrag);window.addEventListener("keydown",escapeDrag);window.addEventListener("blur",cancelDrag);});
      controls.append(up, down, remove, move); compact.append(grip,select, controls); card.append(compact);
      if (selectedBeatId === beat.id) renderExistingBeat(card, scene, beat, index);
      if (beat.conditionalBranch) {
        const branch = beat.conditionalBranch;
        let group = groupHosts.get(branch.groupId);
        if (!group) {
          group = document.createElement("section"); group.className = "story-condition-group"; group.dataset.conditionGroupId = branch.groupId;
          let depth = 0, parent = beatBody(beat); while (parent.type === "branch" && depth < 16) { depth++; const owner = parent; const header = scene.beats.find(item => item.id === owner.branchId); parent = header ? beatBody(header) : { type: "root" }; }
          if (depth >= 3) group.style.paddingInlineStart = "0";
          const heading = document.createElement("div"); heading.className = "story-group-heading";
          const selected = scene.beats.find(item => item.id === selectedBeatId);
          if (selected && (selected.conditionalBranch?.groupId === branch.groupId || !!selected.owner && innerBodies(scene, beat).has(selected.owner.branchId))) group.classList.add("selected");
          const caption = document.createElement("strong"); caption.textContent = `Condition · ${branch.condition ? conditionCaption(branch.condition, model.authoring.variables) : "Unknown condition"} · ${scene.beats.filter(item => item.conditionalBranch?.groupId === branch.groupId).length} branches / ${groupCount(scene, beat)} Beats${group.classList.contains("selected") ? " · Contains selection" : ""}`;
          const collapse = button(collapsedConditions.has(branch.groupId) ? "Expand condition" : "Collapse condition"); collapse.setAttribute("aria-expanded", String(!collapsedConditions.has(branch.groupId))); collapse.dataset.collapseGroupId = branch.groupId;
          collapse.addEventListener("click", () => { if (!draftGuard()) return; if (collapsedConditions.has(branch.groupId)) collapsedConditions.delete(branch.groupId); else collapsedConditions.add(branch.groupId); draw(); [...host.querySelectorAll<HTMLElement>("[data-collapse-group-id]")].find(item => item.dataset.collapseGroupId === branch.groupId)?.focus(); });
          const elseif = button("Add Else If"); elseif.disabled = scene.sourceConflict; elseif.addEventListener("click", () => addBranchForm(scene, beat, false));
          const otherwise = button("Add Otherwise"); otherwise.disabled = scene.sourceConflict || scene.beats.some(item => item.conditionalBranch?.groupId === branch.groupId && item.conditionalBranch.otherwise); otherwise.addEventListener("click", () => addBranchForm(scene, beat, true));
          const unwrap = button("Unwrap…"); unwrap.disabled = scene.sourceConflict; unwrap.addEventListener("click", () => unwrapForm(scene, beat));
          const remove = button("Delete condition"); remove.disabled = scene.sourceConflict; remove.addEventListener("click", () => removeNodeForm(scene, beat));
          heading.append(caption, collapse, elseif, otherwise, unwrap, remove);
          const branches = document.createElement("div"); branches.className = "story-branches"; branches.hidden = collapsedConditions.has(branch.groupId); group.append(heading, branches);
          (beat.owner ? branchHosts.get(beat.owner.branchId) ?? list : list).append(group); groupHosts.set(branch.groupId, group);
          const continuation = document.createElement("p"); continuation.className = "story-continuation"; continuation.textContent = "Continue after condition · reached by branches that fall through"; group.after(continuation);
        }
        const body = document.createElement("section"); body.className = "story-branch-body"; body.dataset.branchId = beat.id;
        body.append(card); group.querySelector(".story-branches")!.append(body); branchHosts.set(beat.id, body);
        const addChild = button(`Add Beat to ${branch.otherwise ? "Otherwise" : branch.ordinal ? "Else If" : "If"}`);
        addChild.dataset.beatOpener = `branch:${beat.id}`;
        addChild.disabled = scene.sourceConflict || branch.condition?.status === "unknown";
        addChild.addEventListener("click", () => {
          if (!draftGuard()) return;
          selectedBeatId = undefined; draw();
          const target = [...host.querySelectorAll<HTMLElement>(".story-branch-body")].find(node => node.dataset.branchId === beat.id);
          if (target) { const parent: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }; renderNewBeat(target, scene, "dialogue", parent, defaultPlace(scene, parent), undefined, `branch:${beat.id}`); }
        });
        const addCondition = button(`Add Condition to ${branch.otherwise ? "Otherwise" : branch.ordinal ? "Else If" : "If"}`); addCondition.disabled = scene.sourceConflict;
        addCondition.addEventListener("click", () => { const parent: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }; openConditionForm(scene, parent, defaultPlace(scene, parent)); });
        const focus = button("Focus this branch", "text-button"); focus.addEventListener("click", () => { if (draftGuard()) { focusedBranch = beat.id; collapsedConditions.delete(branch.groupId); draw(); } });
        body.append(addChild, addCondition, focus);
      } else (beat.owner ? branchHosts.get(beat.owner.branchId) ?? list : list).append(card);
    });
    if (focusedBranch) {
      const target = branchHosts.get(focusedBranch);
      if (target) { for (const child of [...list.children]) if (!child.contains(target) && child !== target) (child as HTMLElement).hidden = true; for (const body of branchHosts.values()) if (body !== target && !body.contains(target) && !target.contains(body)) body.hidden = true; const breadcrumb = document.createElement("p"); breadcrumb.className = "story-breadcrumb"; const header = scene.beats.find(beat => beat.id === focusedBranch)!; breadcrumb.textContent = bodyCaption(scene, { type: "branch", groupId: header.conditionalBranch!.groupId, branchId: header.id }, model); list.prepend(breadcrumb); }
    }
  };

  const renderExistingBeat = (card: HTMLElement, scene: SceneDocument, beat: SceneBeat, index: number): void => {
    if (readOnlyLogic(beat)) {
      const panel = document.createElement("div"); panel.className = "expanded-beat protected-code";
      const explanation = document.createElement("p");
      explanation.textContent = "This Choice contains an unsupported condition. Edit it in Source to preserve the expression. Availability is unknown in the editor preview.";
      panel.append(explanation);
      if (beat.payload.type === "choice") {
        const options = document.createElement("ul");
        for (const option of beat.payload.options) {
          const item = document.createElement("li"); const destination = "Option body, then shared continuation";
          item.textContent = `${option.text} → ${destination} · ${option.condition ? `Available when ${conditionCaption(option.condition, model.authoring.variables)} · Availability unknown` : "Always available"}`;
          options.append(item);
        }
        panel.append(options);
      }
      const source = button("View in Source", "button secondary"); source.disabled = !actions.viewSource;
      source.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision)); panel.append(source); card.append(panel); return;
    }
    if (beat.conditionalBranch) { renderConditionBranch(card, scene, beat); return; }
    if (beat.structuralPlaceholder) { const empty = document.createElement("p"); empty.textContent = "Empty branch · source keeps pass until a Beat is added."; card.append(empty); return; }
    if (beat.protected) {
      const protectedPanel = document.createElement("div"); protectedPanel.className = "protected-code";
      const explanation = document.createElement("p"); explanation.textContent = beat.sourceFallback ?? (beat.payload.type === "customCode" ? beat.payload.reason : "Protected source");
      const source = document.createElement("pre"); source.textContent = beat.payload.type === "customCode" ? beat.payload.source : "";
      const open = button("View in Source", "button secondary"); open.disabled = !actions.viewSource;
      open.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision));
      protectedPanel.append(explanation, source, open); card.append(protectedPanel); return;
    }
    const kept = beatDrafts.get(beat.id);
    if (kept) { card.append(kept.panel); return; }
    // A draft commits against current revisions while its beat's accepted payload is unchanged.
    // Otherwise it conflicts: only Discard draft or Override source resolves it.
    const accepted = JSON.stringify(beat.payload);
    const base = (): { scene: SceneDocument; expectedBody: BodyRef; captured: ExpectedRevisions } => {
      const current = model.scenes.find(item => item.id === scene.id), node = current?.beats.find(item => item.id === beat.id);
      if (!current || !node || JSON.stringify(node.payload) !== accepted) throw new Error("Conflict with source. Draft retained.");
      return { scene: current, expectedBody: beatBody(node), captured: expectedRevisions(model) };
    };
    const conflict = (): DraftConflict | undefined => {
      const current = model.scenes.find(item => item.id === scene.id), node = current?.beats.find(item => item.id === beat.id);
      if (current?.sourceConflict) return { missing: unreadable };
      if (!current || !node) return { missing: "This beat is no longer in source." };
      if (node.protected || node.conditionalBranch || node.structuralPlaceholder || readOnlyLogic(node)) return { missing: "Story can no longer edit this beat. Edit it in Source." };
      if (JSON.stringify(node.payload) === accepted) return undefined;
      // Override writes against exactly the source this comparison shows.
      const reviewed = { scene: current, expectedBody: beatBody(node), captured: expectedRevisions(model) };
      const { payload } = node, sameSpeaker = payload.type === "dialogue" && beat.payload.type === "dialogue" && payload.characterId === beat.payload.characterId;
      return { source: payload.type === "narration" || sameSpeaker ? payload.text : beatSummary(payload, model), override: () => override(reviewed) };
    };
    // Override source validates the editor and saves only this beat. A stale revision
    // reloads Story, so the author reviews the newer source before overriding again.
    const override = (reviewed: ReturnType<typeof base>): void => {
      if (settling || pendingWrites || composing) return;
      settling = (async (): Promise<boolean> => {
        let payload: BeatPayload;
        try { payload = editor.read(); } catch (error) { actions.status(friendlyError(error, invalidDraft), "error"); editor.focus(); return false; }
        if (editor.primary.tagName === "TEXTAREA" && !(editor.primary as HTMLTextAreaElement).value.trim()) { actions.status("Enter text before overriding the source. Draft retained.", "error"); editor.primary.focus(); return false; }
        return mutate(updateCommand(payload, reviewed), () => dropDraft(beat.id), reviewed.captured, panel, draft, "The source changed again. Review it, then choose again. Draft retained.");
      })().finally(() => { settling = undefined; });
    };
    const updateCommand = (payload: BeatPayload, current = base()): SceneCommand => ({ type: "updateBodyBeat", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, beatId: beat.id, expectedBody: current.expectedBody, beat: payload });
    const editor = buildBeatEditor(model, beat.payload, true, liveActions, assignmentValidation(() => base(), value => updateCommand(value)));
    const panel = editor.host; panel.classList.add("expanded-beat");panel.dataset.beatType=beat.payload.type;
    if (beat.payload.type === "showScreen" || beat.payload.type === "hideScreen" || beat.payload.type === "callScreen") {
      const details = document.createElement("details"), summary = document.createElement("summary"); summary.textContent = "Source and effects";
      const effect = document.createElement("p"); effect.textContent = !beat.screenEffects || beat.screenEffects.unknown
        ? "Effects unknown. Custom or unresolved actions may change play state."
        : beat.screenEffects.finishesInteraction ? "Qualified Return() finishes this dialog interaction. Normal play owns continuation." : "Qualified panel actions are recorded. This editor does not execute them.";
      details.className="story-screen-secondary";
      const context = document.createElement("pre");context.textContent=`${beat.payload.type === "callScreen" ? "call" : beat.payload.type === "showScreen" ? "show" : "hide"} screen ${beat.payload.target.sourceName}`;
      details.append(summary, effect, context); panel.append(details);
    }
    const parent = document.createElement("p"); parent.className = "story-breadcrumb"; parent.textContent = bodyCaption(scene, beatBody(beat), model); panel.prepend(parent);
    if (beat.payload.type === "call") {
      const called = model.scenes.find(item => beat.payload.type === "call" && item.id === beat.payload.sceneId);
      const open = button("Open called Scene"); open.disabled = !actions.viewScene || !called || called.sourceConflict;
      open.addEventListener("click", () => { if (called && draftGuard()) actions.viewScene?.({ sceneId: called.id, expectedSourceRevision: called.sourceRevision, caller: { sceneId: scene.id, beatId: beat.id, expectedSourceRevision: scene.sourceRevision, caller: actions.caller } }); });
      const continuation = button("View Call continuation"); continuation.disabled = !actions.viewContinuation; continuation.addEventListener("click", () => { if (draftGuard()) actions.viewContinuation?.(scene.id, beat.id, scene.sourceRevision); }); panel.append(open, continuation);
    }
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; });
    if (beat.payload.type === "choice") {
      const createDestination = button("Create New Scene", "button secondary");
      createDestination.disabled = beat.payload.options.some(option => !!option.condition);
      createDestination.addEventListener("click", () => {
        if (panel.dataset.unsubmitted === "true") {
          actions.status("Commit or cancel current Choice edits before creating a destination.", "error");
          editor.focus();
          return;
        }
        if (panel.querySelector(".choice-new-scene")) return;
        const form = document.createElement("div"); form.className = "choice-new-scene scene-draft";
        const optionText = input(); const sceneName = input("New Scene");
        const chapter = entitySelect(model.chapters.map((item) => ({ id: item.id, label: item.displayName })), scene.chapterId);
        const cancelNew = button("Cancel", "text-button"); cancelNew.addEventListener("click", () => form.remove());
        const createNew = button("Create Scene and option", "button primary");
        createNew.addEventListener("click", () => {
          try {
            const current = base();
            void mutate({ type: "createSceneFromChoice", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, choiceBeatId: beat.id, optionText: requiredText(optionText, "Choice text"), chapterId: required(chapter), displayName: requiredText(sceneName, "Scene name") }, () => dropDraft(beat.id), current.captured, form, draft);
          } catch (error) { actions.status(friendlyError(error, "New Scene details are invalid"), "error"); optionText.focus(); }
        });
        cancelNew.className="button secondary";
        const creationActions=document.createElement("div");creationActions.className="row-actions choice-create-actions";creationActions.append(cancelNew,createNew);
        form.append(labelled("Choice text", optionText), labelled("New Scene name", sceneName), labelled("Chapter", chapter), creationActions);
        dirtyDraft(form, [optionText, sceneName, chapter]); panel.append(form); optionText.focus();
      });
      panel.append(createDestination);
    }
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => { cancelStep(beat.id); dropDraft(beat.id); selectedBeatId = undefined; draw(); if (beat.payload.type === "setVariable") host.querySelector<HTMLElement>(`[data-beat-id="${beat.id}"] .beat-select`)?.focus(); });
    if (beat.payload.type === "showScreen" || beat.payload.type === "hideScreen" || beat.payload.type === "callScreen") panel.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.isComposing || composing) return;
      event.preventDefault(); event.stopPropagation(); if (!pendingWrites && !settling) { cancelStep(beat.id); dropDraft(beat.id); selectedBeatId = undefined; draw(); }
    });
    const commit = button("Commit Beat", "button primary"); commit.disabled = scene.sourceConflict;
    const save = async (continueDialogue: boolean): Promise<boolean> => {
      if(composing)return false;
      let saved=false;
      let restoreControls = (): void => {};
      try {
        const payload = editor.read();
        const current = base();
        panel.dataset.unsubmitted = "true";
        const locks = [...panel.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement|HTMLTextAreaElement>("input,button,select,textarea")].map(control => ({ control, disabled: control.disabled }));
        locks.forEach(({ control }) => { control.disabled = true; });
        restoreControls = () => locks.forEach(({ control, disabled }) => { control.disabled = disabled; });
        if (continueDialogue && !beat.owner && payload.type === "dialogue") {
          const oldIds = new Set(model.scenes.find((item) => item.id === scene.id)?.beats.map((item) => item.id));
          await mutate({ type: "continueDialogue", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, beatId: beat.id, characterId: payload.characterId, text: payload.text }, (_before, next) => {
            saved=true;dropDraft(beat.id);selectedBeatId = next.scenes.find((item) => item.id === scene.id)?.beats.find((item) => item.payload.type === "dialogue" && !oldIds.has(item.id))?.id;
          }, current.captured, panel, draft);
        } else {
          await mutate(updateCommand(payload, current), () => { saved=true;dropDraft(beat.id);selectedBeatId = undefined; }, current.captured, panel, draft);
        }
      } catch (error) {
        actions.status(friendlyError(error, `Beat ${index + 1} is invalid`), "error");
        editor.focus();
      }
      if(!saved&&panel.isConnected){restoreControls();editor.focus();}
      return saved;
    };
    editor.primary.addEventListener("compositionstart",()=>{composing=true;});editor.primary.addEventListener("compositionend",()=>{composing=false;});
    commit.addEventListener("click", () => { if(!settling) { settling=save(false).finally(()=>{settling=undefined;}); } });
    if (beat.payload.type === "setVariable") panel.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.defaultPrevented) { event.preventDefault(); if (!event.isComposing && !settling && !pendingWrites) settling = save(false).finally(() => { settling = undefined; }); }
      else if (event.key === "Escape" && !event.defaultPrevented && !event.isComposing) { event.preventDefault(); if (!pendingWrites && !settling) { actions.status("Use Cancel to discard this draft, or keep editing."); cancel.focus(); } }
    });
    if (beat.payload.type === "dialogue") editor.primary.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); if(!event.isComposing&&!settling)settling=save(event.shiftKey).finally(()=>{settling=undefined;}); }
    });
    const screenBeat=["showScreen","hideScreen","callScreen"].includes(beat.payload.type);
    if(screenBeat){panel.classList.add("story-screen-editor");cancel.className="button secondary";}
    actionsRow.append(...(screenBeat?[commit,cancel]:[cancel,commit]));
    const secondary=panel.querySelector("details.story-screen-secondary");panel.append(actionsRow);if(secondary)panel.append(secondary);
    dirtyDraft(panel, editor.controls); card.append(panel);
    const draft = keepDraft(beat.id, { panel, sceneId: scene.id, beatId: beat.id, read: editor.read, command: () => updateCommand(editor.read()), kind: () => beatLabels[beat.payload.type].toLowerCase(), editors: () => [editor], conflict, primary: () => editor.primary });
  };

  const assignmentValidation = (base: () => { scene: SceneDocument; captured: ExpectedRevisions }, command: (beat: BeatPayload) => SceneCommand): ValidateAssignment => async beat => {
    if (!actions.validateAssignment || disposed || actions.current?.() === false) throw Error("Story session is unavailable.");
    const { scene, captured: expected } = base();
    const result = await actions.validateAssignment(command(beat), expected);
    if (disposed || actions.current?.() === false || result.projectRevision !== expected.projectRevision || result.sourceMapRevision !== expected.sourceMapRevision || result.authoringRevision !== expected.authoringRevision || result.sourceRevision !== scene.sourceRevision) throw Error("Story revision changed. Review the current source before committing.");
    return result;
  };

  const renderNewBeat = (list: HTMLElement, scene: SceneDocument, initialType: BeatPayload["type"] = "dialogue", body: BodyRef = { type: "root" }, position: Position = defaultPlace(scene, body), insertion?: ScreenInsertion, opener = "root"): void => {
    // One pending new beat per insertion place: adding there again returns to it.
    const requested = JSON.stringify({ body, position });
    const existing = [...beatDrafts.values()].find(draft => !draft.beatId && draft.sceneId === scene.id && JSON.stringify(draft.place?.()) === requested);
    if (existing) { if (!existing.panel.isConnected) list.prepend(existing.panel); existing.panel.querySelector<HTMLElement>("select, input, textarea")?.focus(); return; }
    const key = `new:${++newBeatDrafts}`;
    const base = (): { scene: SceneDocument; captured: ExpectedRevisions } => {
      const current = model.scenes.find(item => item.id === scene.id);
      if (!current) throw new Error("This Scene is no longer available. Draft retained.");
      return { scene: current, captured: expectedRevisions(model) };
    };
    const insertCommand = (payload: BeatPayload, location: { body: BodyRef; position: Position }, current = base()): SceneCommand => ({ type: "insertBodyBeat", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, ...location, beat: payload });
    // Story Save: a new beat finds its body and anchor by id; if source dropped either, the draft conflicts.
    // Core repeats this check on its candidate (BEAT_DRAFT_CONFLICT); this one lets Story refuse before sending.
    const savedCommand = (): SceneCommand => {
      const payload = editor.read(), location = chosenLocation(), current = base(), { body, position } = location;
      const bodyKept = body.type === "root" || !!bodyOf(current.scene, body);
      if (!bodyKept || (position.type === "before" && !nodeBeats(current.scene, body).some(node => sameNode(nodeRef(node), position.anchor)))) throw new Error("This beat's place changed in source after the draft began. Draft retained.");
      return insertCommand(payload, location, current);
    };
    const openingInsertion = structuredClone(insertion ?? screenInsertion ?? {sceneId:scene.id,body,position,expectedSourceRevision:scene.sourceRevision});
    let rememberedInsertion = false;
    const panel = document.createElement("section"); panel.className = "new-beat scene-draft";
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; }); panel.setAttribute("aria-labelledby", "new-beat-title");
    const heading = document.createElement("h3"); heading.id = "new-beat-title"; heading.textContent = "Add Beat";
    const types = (Object.keys(beatLabels) as BeatPayload["type"][]).filter((type) => type !== "customCode" && type !== "repeatChoice");
    const type = selectOf(types.map((value) => ({ value, label: beatLabels[value] })), initialType); type.setAttribute("aria-label", "Beat type");
    const destination = document.createElement("p"); destination.className = "story-insertion";
    const insertionAnchor = position.type === "before" ? position.anchor : undefined;
    const anchor = insertionAnchor ? nodeBeats(scene, body).find(beat => sameNode(nodeRef(beat), insertionAnchor)) : undefined;
    destination.textContent = `Insert in ${bodyCaption(scene, body, model)} · ${anchor ? `Before ${anchor.conditionalBranch ? "Condition" : beatLabels[anchor.payload.type]}` : "End of body"}`;
    const placement=destinations(scene,body,undefined,position,true,insertion);
    const screenType=()=>["showScreen","hideScreen","callScreen"].includes(type.value);
    const unavailableScene = !!insertion && insertion.sceneId !== scene.id;
    const usesPlacement = (): boolean => screenType() || !insertion && !screenInsertion;
    const chosenLocation = (): { body: BodyRef; position: Position } => usesPlacement() ? readLocation() : unavailableScene ? { body: { type: "root" }, position: defaultPlace(scene, { type: "root" }) } : { body, position };
    const readLocation=placement.read;
    const pendingMarker=document.createElement("div");pendingMarker.className="story-screen-pending";pendingMarker.role="status";
    const updatePendingMarker=()=>{
      pendingMarker.remove();if(!screenType())return;
      let location;try{location=readLocation();}catch{return;}
      const body=location.body;
      const bodyHost=body.type==="root"?host.querySelector<HTMLElement>(".beats-list"):[...host.querySelectorAll<HTMLElement>(".story-branch-body")].find(node=>node.dataset.branchId===body.branchId);
      if(!bodyHost)return;
      for(let parent=bodyHost.parentElement;parent&&parent!==host;parent=parent.parentElement){
        if(!parent.classList.contains("story-branches"))continue;
        parent.hidden=false;const group=parent.parentElement,id=group?.dataset.conditionGroupId;
        if(id)collapsedConditions.delete(id);group?.querySelector("[data-collapse-group-id]")?.setAttribute("aria-expanded","true");
      }
      const anchor=location.position.type==="before"?location.position.anchor:undefined;
      const before=anchor?.type==="beat"?[...bodyHost.querySelectorAll<HTMLElement>(".beat-card")].find(node=>node.dataset.beatId===anchor.beatId):anchor?.type==="condition"?[...bodyHost.querySelectorAll<HTMLElement>(".story-condition-group")].find(node=>node.dataset.conditionGroupId===anchor.groupId):undefined;
      pendingMarker.textContent=`Pending ${beatLabels[type.value as BeatPayload["type"]]}`;
      if(before)before.before(pendingMarker);else bodyHost.append(pendingMarker);
    };
    const remember=()=>{if(screenType())try{rememberScreenInsertion({sceneId:scene.id,...readLocation(),expectedSourceRevision:scene.sourceRevision});rememberedInsertion=true;return true;}catch{/* Retain the unavailable original position until an explicit choice. */}return false;};
    // Placement owns its retained navigation state and any incomplete recovery input.
    placement.host.classList.add("scene-draft");
    for(const event of ["input","change"])placement.host.addEventListener(event,()=>{if(remember())delete placement.host.dataset.unsubmitted;else placement.host.dataset.unsubmitted="true";updatePendingMarker();});
    const editorHost = document.createElement("div"),secondaryHost=document.createElement("div");secondaryHost.className="story-screen-secondary";
    const validateNew = assignmentValidation(base, beat => insertCommand(beat, chosenLocation()));
    let editor = buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model, actions.screenHint), false, liveActions, validateNew);
    const typeDrafts = new Map<string, BeatEditor>([[type.value, editor]]);
    const replaceEditor = (): void => { placement.host.hidden=!usesPlacement();if(placement.host.hidden)delete placement.host.dataset.unsubmitted;destination.hidden=screenType();remember();editor = typeDrafts.get(type.value) ?? buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model, actions.screenHint), false, liveActions, validateNew); typeDrafts.set(type.value, editor); editorHost.replaceChildren(editor.host);secondaryHost.replaceChildren(...(editor.secondary?[editor.secondary]:[]));panel.classList.toggle("story-screen-editor",screenType());dirtyDraft(panel, editor.controls); };
    type.addEventListener("change", replaceEditor); replaceEditor();
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", screenType()?"button secondary":"text-button");
    const cancelDraft=()=>{cancelStep(key);if(rememberedInsertion)rememberScreenInsertion(openingInsertion);pendingMarker.remove();panel.remove();dropDraft(key);focusBeatOpener(opener);};cancel.addEventListener("click",cancelDraft);
    type.addEventListener("change",()=>{cancel.className=screenType()?"button secondary":"text-button";updatePendingMarker();});
    let pending=false;
    panel.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.isComposing || composing || !["showScreen", "hideScreen", "callScreen"].includes(type.value)) return;
      event.preventDefault(); event.stopPropagation(); if (!pending) cancelDraft();
    });
    const commit = button("Add Beat", "button primary"); commit.addEventListener("click", async () => {
      if(pending || composing)return;
      try {
        const payload = editor.read();
        const location=chosenLocation();
        const current=base();
        pending=true;panel.dataset.unsubmitted="true";
        const controls=[...panel.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement>("input,select,textarea,button")];
        const locks = controls.map(control => ({ control, disabled: control.disabled }));
        controls.forEach(control=>control.disabled=true);
        let insertedId:string|undefined;
        const saved=await mutate(insertCommand(payload, location, current), (before,next) => {
          selectedBeatId = undefined;panel.remove();dropDraft(key);
          const acceptedScene=next.scenes.find(s=>s.id===scene.id);if(screenType()&&acceptedScene)rememberScreenInsertion({sceneId:scene.id,...location,expectedSourceRevision:acceptedScene.sourceRevision});
          const previousIds=new Set(before.scenes.find(s=>s.id===scene.id)?.beats.map(b=>b.id));
          insertedId=next.scenes.find(s=>s.id===scene.id)?.beats.find(b=>!previousIds.has(b.id))?.id;
        }, current.captured, panel, draft);
        if(saved&&insertedId){const row=[...host.querySelectorAll<HTMLElement>(".beat-card")].find(row=>row.dataset.beatId===insertedId);row?.scrollIntoView?.({block:"nearest"});row?.querySelector<HTMLElement>(".beat-select")?.focus({preventScroll:true});}
        if(!saved&&panel.isConnected){locks.forEach(({control,disabled})=>{control.disabled=disabled;});editor.focus();}
      } catch (error) {
        actions.status(friendlyError(error, "Beat is invalid"), "error"); editor.focus();
      }finally{pending=false;}
    });
    panel.addEventListener("keydown", event => {
      if (type.value === "setVariable" && (event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.defaultPrevented && !event.isComposing) { event.preventDefault(); if (!pending && !composing) commit.click(); }
    });
    const orderActions=()=>actionsRow.replaceChildren(...(screenType()?[commit,cancel]:[cancel,commit]));orderActions();type.addEventListener("change",orderActions);
    dirtyDraft(panel,[type]);panel.append(heading,destination,labelled("Beat type",type),placement.host,editorHost,actionsRow,secondaryHost);list.prepend(panel);
    // A new beat moves with the place the author chooses, until it is added.
    const place=():{body:BodyRef;position:Position}=>{try{return chosenLocation();}catch{return {body,position};}};
    placement.host.addEventListener("change",()=>{const target=bodyList(place().body);if(target&&panel.parentElement!==target)target.prepend(panel);});
    const draft=keepDraft(key,{panel,sceneId:scene.id,place,read:()=>editor.read(),command:savedCommand,kind:()=>beatLabels[type.value as BeatPayload["type"]].toLowerCase(),editors:()=>[...typeDrafts.values()],primary:()=>editor.primary,
      // A new beat whose scene or branch left source has nowhere to go: only Discard draft resolves it.
      conflict:()=>{const current=model.scenes.find(item=>item.id===scene.id),{body:at}=place();if(!current)return {missing:"This beat's scene is no longer in source."};if(current.sourceConflict)return {missing:unreadable};return at.type==="branch"&&!current.beats.some(item=>item.id===at.branchId)?{missing:"This beat's place is no longer in source."}:undefined;},
      detach:()=>{pendingMarker.remove();panel.remove();}});updatePendingMarker();
    // A new beat is a draft from the moment it is added, so adding it is its first step.
    draft.state=captureDraft(draft);startStep(draft,"new",undefined,draft.state);type.focus();
  };

  draw();
  return {
    host, treeHost,
    update: (next, nextActions, beatId) => {
      if (disposed) return;
      actions = nextActions; model = next;
      screenInsertion = actions.screenInsertion ? structuredClone(actions.screenInsertion) : screenInsertion;
      selectedSceneId = storyScene(next, actions.sceneId ?? selectedSceneId)?.id;
      selectedBeatId = beatId;
      draw();
      host.closest<HTMLElement>(".project-shell")?.setAttribute("data-writing-focus", String(writingFocus));
    },
    hasDrafts: sceneId => pendingDrafts(sceneId).length > 0,
    hasOpenForm: hasDraft,
    firstDraft: () => { const draft = pendingDrafts()[0]; return draft && { sceneId: draft.sceneId, ...(draft.beatId ? { beatId: draft.beatId } : {}) }; },
    busy: () => pendingWrites > 0 || settling !== undefined,
    settle,
    save: saveDrafts,
    saveStatus,
    flushSteps: async () => { closeText(); await recording; },
    applyStep,
    ownsDraftField: target => target instanceof HTMLElement && !target.closest(".choice-new-scene") && [...beatDrafts.values()].some(draft => draft.panel.contains(target)),
    dispose: () => {
      disposed = true; closeText(); beatDrafts.clear(); steps.clear();
      cancelBeatDrag?.();window.removeEventListener("loomlight-reset-layout",resetLayout);
      layoutObservers.splice(0).forEach(o=>o.disconnect());
      mediaGeneration += 1;
      pendingImages.clear();
      for (const image of imageCache.values()) URL.revokeObjectURL(image.url);
      imageCache.clear();
      for (const url of audioUrls) URL.revokeObjectURL?.(url);
      audioUrls.clear();
    },
  };
}

function inlineName(host: HTMLElement, label: string, current: string, commit: (value: string) => Promise<unknown>): void {
  if (host.querySelector(":scope > .tree-inline")) return;
  const panel = document.createElement("div"); panel.className = "tree-inline scene-draft";
  const name = input(current); const save = button("Save", "button primary"); const cancel = button("Cancel", "text-button");
  save.addEventListener("click", async () => { if (!name.value.trim()) { name.setCustomValidity("A display name is required."); name.reportValidity(); name.focus(); return; } await commit(name.value.trim()); });
  cancel.addEventListener("click", () => panel.remove()); panel.append(labelled(label, name), cancel, save); dirtyDraft(panel, [name]); host.append(panel); name.select();
}

function confirmAction(host: HTMLElement, copy: string, commit: () => Promise<unknown>): void {
  if (host.querySelector(":scope > .confirm-row")) return;
  const panel = document.createElement("div"); panel.className = "confirm-row"; const text = document.createElement("span"); text.textContent = copy;
  const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => panel.remove()); const confirm = button("Confirm delete", "button danger"); confirm.addEventListener("click", () => void commit()); panel.append(text, cancel, confirm); host.append(panel);
}

function beatSummary(payload: BeatPayload, model: SceneWorkspace): string {
  const character = (id: string): string => model.authoring.characters.find((item) => item.id === id)?.displayName ?? "Unknown Character";
  const asset = (id: string): string => model.authoring.assets.find((item) => item.id === id)?.displayName ?? "Unknown Asset";
  const scene = (id: string): string => model.scenes.find((item) => item.id === id)?.displayName ?? "Unknown Scene";
  switch (payload.type) {
    case "background": return `${asset(payload.assetId)} · ${payload.transition}`;
    case "showCharacter": return `${character(payload.characterId)} · ${payload.placement}`;
    case "hideCharacter": return character(payload.characterId);
    case "showScreen": return `${payload.target.sourceName} · Dialogue continues`;
    case "hideScreen": return `${payload.target.sourceName} · Removes the panel`;
    case "callScreen": return `${payload.target.sourceName} · Waits for Finish interaction`;
    case "changeAppearance": return character(payload.characterId);
    case "placement": return `${character(payload.characterId)} · ${payload.placement}`;
    case "dialogue": return `${character(payload.characterId)}: ${payload.text || "Empty dialogue"}`;
    case "narration": return payload.text || "Empty narration";
    case "playMusic": case "playSfx": return asset(payload.assetId);
    case "stopMusic": return "Stop current music";
    case "transition": return payload.transition;
    case "setVariable": return assignmentCaption(payload, model.authoring.variables);
    case "choice": return `${payload.options.length} option${payload.options.length === 1 ? "" : "s"}${payload.options.some(option => option.condition) ? " · Conditional availability unknown" : ""}`;
    case "jump": return scene(payload.sceneId);
    case "call": return `${scene(payload.sceneId)} · Returns to next Beat`;
    case "repeatChoice": return "Repeat this Choice";
    case "return": return "Return to caller or main menu";
    case "customCode": return payload.reason;
  }
}

/**
 * How a beat draft disagrees with source now. `source` is the beat's current source text,
 * and `override` saves the draft against exactly that revision. A beat, place or scene
 * that left source has only `missing`, which says why there is no source text.
 */
type DraftConflict = { readonly source: string; readonly override: () => void } | { readonly missing: string };
// A scene whose source Story cannot map has no beats to compare with, so its drafts wait.
const unreadable = "Story cannot read this scene's source right now. The draft stays until it can.";

/** What an editor keeps outside its controls, such as a Choice's option rows, for draft-step Undo. */
interface EditorInternals { readonly capture: () => unknown; readonly restore: (saved: unknown) => void }
interface BeatEditor { readonly host: HTMLElement; readonly controls: readonly HTMLElement[]; readonly primary: HTMLElement; readonly secondary?: HTMLElement; readonly read: () => BeatPayload; readonly focus: () => void; readonly internals?: EditorInternals }

/** A beat draft's controls and its editors' own state, kept for draft-step Undo (ADR 0025). */
interface DraftState { readonly controls: readonly { readonly tag: string; readonly type: string; readonly value: string; readonly checked: boolean }[]; readonly editors: readonly (readonly [EditorInternals, unknown])[] }
// A Choice's nested Create New Scene form is not part of its draft.
const draftControls = (panel: HTMLElement): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] =>
  [...panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")].filter(control => !control.closest(".choice-new-scene"));
function captureState(panel: HTMLElement, editors: readonly BeatEditor[]): DraftState {
  return {
    controls: draftControls(panel).map(control => ({ tag: control.tagName, type: control.type, value: control.value, checked: control instanceof HTMLInputElement && control.checked })),
    editors: editors.flatMap(editor => editor.internals ? [[editor.internals, editor.internals.capture()] as const] : []),
  };
}
// Sets each control in document order. A changed control fires input and change, so a
// select that swaps the fields after it shows the right ones before they are set.
// Editor state is set before the controls, so its fields exist, and again after, so a
// control's own change handler cannot override it.
function restoreState(panel: HTMLElement, state: DraftState): void {
  for (const [editor, value] of state.editors) editor.restore(value);
  state.controls.forEach((saved, index) => {
    const control = draftControls(panel)[index];
    if (!control || control.tagName !== saved.tag || control.type !== saved.type) return;
    const toggle = control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio");
    if (toggle ? control.checked === saved.checked : control.value === saved.value) return;
    if (toggle) control.checked = saved.checked; else control.value = saved.value;
    for (const type of ["input", "change"]) control.dispatchEvent(new Event(type, { bubbles: true }));
  });
  for (const [editor, value] of state.editors) editor.restore(value);
}

function buildScreenBeatEditor(payload: Extract<BeatPayload, { type: "showScreen" | "hideScreen" | "callScreen" }>, existing: boolean, actions?: SceneActions): BeatEditor {
  const calling=payload.type==="callScreen",kind=calling?"dialog":"panel",caption=calling?"Dialog":"Panel";
  const intent = { ...payload.target }, originalRevisions = payload.revisions ? { ...payload.revisions } : undefined;
  const host = document.createElement("div"); host.className = "beat-fields story-screen-fields";
  const picker = document.createElement("select"); picker.setAttribute("aria-label", `${caption} screen`); picker.disabled = true;
  const purpose = document.createElement("p"); purpose.textContent = calling ? "Call waits for Finish interaction. Dialog defaults use Close and Escape; outside clicks keep it open. Scene Call and Story Return are separate operations." : payload.type === "showScreen"
    ? "Show keeps the panel open while dialogue continues. Hide, Close and game Escape dismiss it. Outside clicks keep it open."
    : "Hide removes the panel at this point in the story. Dialogue continues.";
  const message = document.createElement("p"); message.role = "status"; message.ariaLive = "polite"; message.textContent = `Loading ${kind} screens…`;
  host.append(labelled(`${caption} screen`, picker), purpose, message);
  const secondary=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Source and effects";
  const effects=document.createElement("p");effects.textContent="No screen Beat has been added. Source shows accepted appearance.";
  const source=button("View screen in Source","text-button");source.disabled=true;secondary.append(summary,effects,source);
  let captured: { target: ScreenTargetBinding; revisions: ScreenRevisions } | undefined;
  let generation = 0;
  const panels = new Map<string, ScreenTargetBinding>();
  const placeholder = (label: string) => { const option = document.createElement("option"); option.value = intent.screenId; option.textContent = label; option.dataset.unavailable = "true"; picker.replaceChildren(option); };
  placeholder(intent.sourceName || `Loading ${kind}s…`);
  const fail = (error: unknown) => { captured = undefined;source.disabled=true;source.onclick=null;effects.textContent="No available accepted screen source for this selection."; message.textContent = `${friendlyError(error, `${caption} target unavailable.`)} Choose an available ${kind} explicitly. Input retained.`; };
  const resolve = async () => {
    const run = ++generation; captured = undefined;source.disabled=true;source.onclick=null;
    const binding = panels.get(picker.value);
    if (!binding || !actions?.resolveScreenTarget) { fail(Error(`${caption} target unavailable.`)); return; }
    message.textContent = `Checking ${kind}…`;
    try {
      const resolved = await actions.resolveScreenTarget({ ...binding });
      if (run !== generation || actions.current?.() === false) return;
      if (resolved.kind !== kind || resolved.binding.screenId !== binding.screenId || resolved.binding.sourceName !== binding.sourceName) throw Error(`${caption} identity changed.`);
      if(calling && (!resolved.blocking || resolved.effects.unknown)) throw Error("Call needs a blocking Dialog with known interaction effects.");
      effects.textContent=resolved.effects.unknown ? "Effects unknown. Review accepted Source before play." : resolved.effects.finishesInteraction ? "Accepted Return() can finish this dialog. Normal play owns continuation." : "Accepted panel effects are qualified.";
      source.disabled=!actions.viewSource;source.onclick=()=>actions.viewSource?.(resolved.path,undefined,undefined,resolved.revisions.source);
      captured = { target: { ...resolved.binding }, revisions: { ...resolved.revisions } };
      message.textContent = resolved.effects.unknown ? "Some screen effects are unknown. Review Source and effects before play." : `${caption} ready.`;
    } catch (error) { if (run === generation) fail(error); }
  };
  picker.addEventListener("change", () => { void resolve(); });
  void (async () => {
    try {
      if (!actions?.screenCatalog || !actions.resolveScreenTarget) throw Error(`${caption} screens are unavailable in this workspace.`);
      const catalog = await actions.screenCatalog();
      if (actions.current?.() === false) return;
      const owned = catalog.owned.filter(screen => screen.kind === kind && screen.resolved);
      picker.replaceChildren();
      for (const screen of owned) {
        const option = document.createElement("option"); option.value = screen.id; option.textContent = screen.name; picker.append(option);
        panels.set(screen.id, { screenId: screen.id, sourceName: screen.name });
      }
      const match = owned.find(screen => screen.id === intent.screenId && screen.name === intent.sourceName);
      if (intent.screenId && !match) {
        const option = document.createElement("option"); option.value = ""; option.textContent = `${intent.sourceName} · Unavailable`; option.dataset.unavailable = "true"; picker.prepend(option); picker.value = "";
        fail(Error(`The original ${kind} is missing or renamed.`));
      } else if (!owned.length) { placeholder(`No available ${caption} screens`); fail(Error(`Create a ${caption} in Screens first.`)); }
      else if (existing) {
        picker.value = intent.screenId;
        if (!originalRevisions) fail(Error("The original target is unresolved."));
        else if (match?.sourceRevision !== originalRevisions.source) fail(Error(`The ${kind} changed after this Beat was loaded.`));
        else { captured = { target: { ...intent }, revisions: originalRevisions }; message.textContent = `${caption} ready.`; }
      } else { if (match) picker.value = match.id; await resolve(); }
      picker.disabled = !owned.length;
    } catch (error) { fail(error); }
  })();
  return { host, secondary:existing?undefined:secondary, controls: [picker], primary: picker, focus: () => picker.focus(), read: () => {
    if (!captured || picker.selectedOptions[0]?.dataset.unavailable === "true") throw Error(message.textContent || `Select an available ${caption} first.`);
    return { type: payload.type, target: { ...captured.target }, revisions: { ...captured.revisions } };
  } };
}

function buildBeatEditor(model: SceneWorkspace, payload: BeatPayload, existing = false, actions?: SceneActions, validate?: ValidateAssignment): BeatEditor {
  if (payload.type === "setVariable") return buildAssignmentEditor(model, payload, validate);
  if (payload.type === "showScreen" || payload.type === "hideScreen" || payload.type === "callScreen") return buildScreenBeatEditor(payload, existing, actions);
  const host = document.createElement("div"); host.className = "beat-fields"; const controls: HTMLElement[] = [];
  const add = (label: string, control: HTMLElement): void => { controls.push(control); host.append(labelled(label, control)); };
  const transitions = (includeNone = true) => selectOf(([...(includeNone ? [{ value: "none" as const, label: "None" }] : []), { value: "dissolve" as const, label: "Dissolve" }, { value: "fade" as const, label: "Fade" }]), "transition" in payload ? payload.transition : "none");
  const placements = (selected?: string) => selectOf([{ value: "left" as const, label: "Left" }, { value: "centre" as const, label: "Centre" }, { value: "right" as const, label: "Right" }], selected);
  const characters = (selected?: string) => entitySelect(model.authoring.characters.map((item) => ({ id: item.id, label: item.displayName })), selected);
  const assets = (kind: Asset["kind"], selected?: string) => entitySelect(model.authoring.assets.filter((item) => item.kind === kind && item.status === "available").map((item) => ({ id: item.id, label: item.displayName })), selected);
  const scenes = (selected?: string) => entitySelect(model.scenes.map((item) => ({ id: item.id, label: item.displayName })), selected);
  let read: () => BeatPayload, internals: EditorInternals | undefined;
  switch (payload.type) {
    case "background": { const asset = assets("background", payload.assetId); const transition = transitions(); add("Background", asset); add("Transition", transition); read = () => ({ type: "background", assetId: required(asset), transition: transition.value as TransitionRef }); break; }
    case "showCharacter": { const character = characters(payload.characterId); const appearance = entitySelect(model.authoring.appearances.map((item) => ({ id: item.id, label: item.label })), payload.appearanceId); const placement = placements(payload.placement); const transition = transitions(); add("Character", character); add("Appearance", appearance); add("Placement", placement); add("Transition", transition); read = () => ({ type: "showCharacter", characterId: required(character), appearanceId: required(appearance), placement: placement.value as PlacementRef, transition: transition.value as TransitionRef }); break; }
    case "hideCharacter": { const character = characters(payload.characterId); const transition = transitions(); add("Character", character); add("Transition", transition); read = () => ({ type: "hideCharacter", characterId: required(character), transition: transition.value as TransitionRef }); break; }
    case "changeAppearance": { const character = characters(payload.characterId); const appearance = entitySelect(model.authoring.appearances.map((item) => ({ id: item.id, label: item.label })), payload.appearanceId); const transition = transitions(); add("Character", character); add("Appearance", appearance); add("Transition", transition); read = () => ({ type: "changeAppearance", characterId: required(character), appearanceId: required(appearance), transition: transition.value as TransitionRef }); break; }
    case "placement": { const character = characters(payload.characterId); const placement = placements(payload.placement); add("Character", character); add("Placement", placement); read = () => ({ type: "placement", characterId: required(character), placement: placement.value as PlacementRef }); break; }
    case "dialogue": { const character = characters(payload.characterId); const text = document.createElement("textarea"); text.value = payload.text; text.rows = 4; add("Speaker", character); add("Dialogue", text); read = () => ({ type: "dialogue", characterId: required(character), text: text.value }); break; }
    case "narration": { const text = document.createElement("textarea"); text.value = payload.text; text.rows = 4; add("Narration", text); read = () => ({ type: "narration", text: text.value }); break; }
    case "playMusic": { const asset = assets("music", payload.assetId); add("Music", asset); read = () => ({ type: "playMusic", assetId: required(asset) }); break; }
    case "stopMusic": read = () => ({ type: "stopMusic" }); break;
    case "playSfx": { const asset = assets("sfx", payload.assetId); add("SFX", asset); read = () => ({ type: "playSfx", assetId: required(asset) }); break; }
    case "transition": { const transition = transitions(false); add("Transition", transition); read = () => ({ type: "transition", transition: transition.value as "dissolve" | "fade" }); break; }
    case "choice": {
      const picked = selectOf([{ value: "showNormally", label: "Show normally" }, { value: "markPicked", label: "Mark picked" }, { value: "hidePicked", label: "Hide picked" }], payload.pickedPolicy ?? "showNormally");
      picked.setAttribute("aria-label", "Picked options");
      let pickedChanged = false;
      picked.addEventListener("change", () => { pickedChanged = true; host.dispatchEvent(new Event("input", { bubbles: true })); });
      host.append(labelled("Picked options", picked));
      const promptRow = document.createElement("div"); promptRow.className = "choice-prompt";
      let hasPrompt = !!payload.prompt;
      const promptText = input(payload.prompt?.text ?? ""); promptText.setAttribute("aria-label", "Prompt text");
      const speaker = entitySelect([{ id: "narration", label: "Narration (no speaker)" }, ...model.authoring.characters.map(c => ({ id: c.id, label: c.displayName }))], payload.prompt?.type === "dialogue" ? payload.prompt.characterId : "narration");
      speaker.setAttribute("aria-label", "Prompt speaker");
      const validatePrompt = validateField(promptText, () => { if (hasPrompt) requiredText(promptText, "Prompt text"); });
      const addPrompt = button("+ Prompt", "text-button"); addPrompt.setAttribute("aria-label", "Add a prompt shown with the options");
      const removePrompt = button("Remove prompt", "text-button");
      const drawPrompt = (): void => {
        promptRow.replaceChildren();
        if (hasPrompt) promptRow.append(labelled("Prompt", speaker), labelled("Prompt text", promptText), removePrompt);
        else { const empty = document.createElement("span"); empty.textContent = "No prompt with the options"; promptRow.append(empty, addPrompt); }
      };
      const changePrompt = (enabled: boolean): void => { hasPrompt = enabled; drawPrompt(); host.dispatchEvent(new Event("input", { bubbles: true })); (enabled ? promptText : addPrompt).focus(); };
      addPrompt.addEventListener("click", () => changePrompt(true)); removePrompt.addEventListener("click", () => changePrompt(false));
      controls.push(speaker, promptText); drawPrompt(); host.append(promptRow);
      const optionHost = document.createElement("div"); optionHost.className = "choice-options"; host.append(optionHost);
      const rows: { id?: string; text: HTMLInputElement; row: HTMLElement; guard: ReturnType<typeof buildAvailabilityEditor>; policy: HTMLSelectElement; validateText: () => void }[] = [];
      const redraw = (): void => { rows.forEach((row, index) => { row.row.querySelector("strong")!.textContent = `Option ${index + 1}`; optionHost.append(row.row); }); host.dispatchEvent(new Event("input", { bubbles: true })); };
      const addOption = (option: ChoiceOption = { text: "" }): void => {
        const row = document.createElement("div"); row.className = "choice-option";
        const number = document.createElement("strong"); number.textContent = `Option ${rows.length + 1}`;
        const text = input(option.text); text.setAttribute("aria-label", "Choice option text");
        row.append(number, labelled("Choice option text", text));
        const validateText = validateField(text, () => { requiredText(text, "Choice text"); });
        const guard = buildAvailabilityEditor(model.authoring.variables, option.condition); row.append(guard.host);
        const policy = selectOf([{ value: "hide", label: "Hide" }, { value: "showDisabled", label: "Show disabled" }], option.unavailablePolicy ?? "hide");
        policy.setAttribute("aria-label", "If false");
        const policyField = labelled("If false", policy); guard.host.append(policyField);
        const refreshPolicy = (): void => { policyField.hidden = !guard.host.querySelector<HTMLInputElement>('input[aria-label="Available when"]')!.checked; };
        guard.host.addEventListener("change", refreshPolicy); refreshPolicy();
        const remove = button("Remove option", "text-button"); remove.addEventListener("click", () => { const index = rows.findIndex(item => item.row === row); if (index >= 0) rows.splice(index, 1); row.remove(); redraw(); });
        const up = button("Move option up", "text-button"), down = button("Move option down", "text-button");
        const move = (delta: number): void => { const index = rows.findIndex(item => item.row === row), to = index + delta; if (to < 0 || to >= rows.length) return; [rows[index], rows[to]] = [rows[to]!, rows[index]!]; redraw(); };
        up.addEventListener("click", () => move(-1)); down.addEventListener("click", () => move(1));
        const note = document.createElement("p"); note.textContent = option.id ? "Option body follows below. Then changes only its ending." : "Starts empty. Continue after the Choice.";
        row.append(note, up, down, remove); rows.push({ ...(option.id ? { id: option.id } : {}), text, row, guard, policy, validateText }); controls.push(text); optionHost.append(row);
      };
      payload.options.forEach(addOption); if (!rows.length) addOption();
      const addChoice = button("Add option", "text-button"); addChoice.addEventListener("click", () => { addOption(); redraw(); }); host.append(addChoice);
      // Draft-step Undo restores the prompt, the option rows and their order.
      internals = {
        capture: () => ({ hasPrompt, pickedChanged, rows: [...rows] }),
        restore: saved => { const kept = saved as { hasPrompt: boolean; pickedChanged: boolean; rows: typeof rows }; hasPrompt = kept.hasPrompt; pickedChanged = kept.pickedChanged; rows.splice(0, rows.length, ...kept.rows); optionHost.replaceChildren(); drawPrompt(); redraw(); },
      };
      const note = document.createElement("p"); note.textContent = "Each option runs its own Beats, then continues after the Choice. Availability is unknown in this preview."; host.append(note);
      read = () => {
        if (!rows.length) throw new Error("A Choice needs at least one option.");
        validatePrompt();
        const prompt: ChoicePrompt | undefined = hasPrompt ? speaker.value === "narration" ? { type: "narration", text: promptText.value } : { type: "dialogue", characterId: required(speaker), text: promptText.value } : undefined;
        return { type: "choice", ...((payload.pickedPolicy || pickedChanged) ? { pickedPolicy: picked.value as PickedPolicy } : {}), ...(prompt ? { prompt } : {}), options: rows.map(row => { row.validateText(); const condition = row.guard.read(); return { ...(row.id ? { id: row.id } : {}), text: row.text.value, ...(condition ? { condition, ...(row.policy.value === "showDisabled" ? { unavailablePolicy: "showDisabled" as const } : {}) } : {}) }; }) };
      }; break;
    }
    case "jump": { const destination = scenes(payload.sceneId); add("Destination Scene", destination); read = () => ({ type: "jump", sceneId: required(destination) }); break; }
    case "call": {
      const destination = scenes(payload.sceneId); destination.setAttribute("aria-label", "Call destination Scene");
      const validate = validateField(destination, () => { required(destination); });
      add("Call destination Scene", destination);
      const note = document.createElement("p"); note.textContent = "Returns to the next Beat. The editor preview does not execute the called Scene."; host.append(note);
      read = () => { validate(); return { type: "call", sceneId: required(destination), returnLabel: payload.returnLabel }; }; break;
    }
    case "repeatChoice": read = () => payload; break;
    case "return": read = () => ({ type: "return" }); break;
    case "customCode": read = () => payload; break;
  }
  const primary = controls[controls.length - 1] ?? host;
  return { host, controls, primary, read: read!, ...(internals ? { internals } : {}), focus: () => (host.querySelector<HTMLElement>('[aria-invalid="true"]') ?? controls[0] as HTMLElement | undefined)?.focus() };
}

function defaultPayload(type: BeatPayload["type"], model: SceneWorkspace, screenHint?: ScreenTargetBinding): BeatPayload {
  const characterId = model.authoring.characters[0]?.id ?? ""; const appearanceId = model.authoring.appearances.find((item) => item.characterId === characterId)?.id ?? "";
  switch (type) {
    case "background": return { type, assetId: model.authoring.assets.find((item) => item.kind === "background")?.id ?? "", transition: "none" };
    case "showCharacter": return { type, characterId, appearanceId, placement: "centre", transition: "none" };
    case "hideCharacter": return { type, characterId, transition: "none" };
    case "showScreen": case "hideScreen": case "callScreen": return { type, target: screenHint ? { ...screenHint } : { screenId: "", sourceName: "" } };
    case "changeAppearance": return { type, characterId, appearanceId, transition: "none" };
    case "placement": return { type, characterId, placement: "centre" };
    case "dialogue": return { type, characterId, text: "" };
    case "narration": return { type, text: "" };
    case "playMusic": return { type, assetId: model.authoring.assets.find((item) => item.kind === "music")?.id ?? "" };
    case "stopMusic": return { type };
    case "playSfx": return { type, assetId: model.authoring.assets.find((item) => item.kind === "sfx")?.id ?? "" };
    case "transition": return { type, transition: "dissolve" };
    case "setVariable": { const variable = model.authoring.variables[0]; return { type, variableId: variable?.id ?? "", value: variable?.defaultValue ?? "" }; }
    case "choice": return { type, pickedPolicy: "showNormally", options: [{ text: "" }] };
    case "jump": return { type, sceneId: model.scenes[0]?.id ?? "" };
    case "call": return { type, sceneId: model.scenes[0]?.id ?? "", returnLabel: null };
    case "repeatChoice": return { type };
    case "return": return { type };
    case "customCode": return { type, source: "", reason: "Protected source" };
  }
}

function required(control: HTMLSelectElement): string { if (!control.value || control.options[control.selectedIndex]?.dataset.unavailable === "true") { control.focus(); throw new Error("Select an available item first."); } return control.value; }
function requiredText(control: HTMLInputElement, name: string): string { if (!control.value.trim()) { control.focus(); throw new Error(`${name} is required.`); } return control.value.trim(); }

export function renderRecoverySurface(host: HTMLElement, report: RecoveryReport, actions: RecoveryActions): void {
  host.replaceChildren(); host.className = "recovery-workspace";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Read-only project inspection";
  const title = document.createElement("h1"); title.textContent = "Recovery required";
  const copy = document.createElement("p"); copy.className = "panel-copy"; copy.textContent = "Loomlight will not write project files until each interrupted transaction reaches a proven terminal state. Evidence is retained after resolution.";
  host.append(eyebrow, title, copy);
  if (!report.items.length) { const done = document.createElement("p"); done.className = "state-banner success-state"; done.textContent = "Recovery is complete. Revalidating the project…"; host.append(done); actions.completed(); return; }
  for (const item of report.items) {
    const panel = document.createElement("section"); panel.className = "recovery-item";
    const heading = document.createElement("h2"); heading.textContent = `Transaction ${item.transactionId}`;
    const state = document.createElement("p"); state.textContent = `Journal state: ${item.state.name}${item.code ? ` · ${item.code}` : ""}`;
    const evidence = document.createElement("table"); const head = document.createElement("thead"); const headRow = document.createElement("tr"); ["Affected path", "Accepted copy", "Displaced copy"].forEach((label) => { const th = document.createElement("th"); th.textContent = label; headRow.append(th); }); head.append(headRow); const body = document.createElement("tbody");
    item.affected.forEach((entry) => { const row = document.createElement("tr"); [entry.path, entry.acceptedRetained ? "Retained" : "Not present", entry.displacedRetained ? "Retained" : "Not present"].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }); body.append(row); }); evidence.append(head, body);
    const safeKeep = item.mutations.every((value) => value === "preparedWithoutStage" || value === "stagedWithBaseIntact");
    const safeAccept = item.mutations.every((value) => value === "exchangeCompleteExpected" || value === "durable");
    const explanation = document.createElement("p"); explanation.className = safeKeep || safeAccept ? "muted" : "error-message";
    explanation.textContent = safeKeep ? "The current project bytes are still the verified base. Keeping them is supported." : safeAccept ? "Every target contains the verified Loomlight result. Accepting it is supported." : "This state is ambiguous. Loomlight will retain evidence and remain blocked; no automatic resolution is offered.";
    panel.append(heading, state, evidence, explanation);
    if (safeKeep || safeAccept) {
      const confirm = document.createElement("input"); confirm.type = "checkbox"; confirm.id = `confirm-${item.transactionId}`;
      const confirmLabel = labelled("I reviewed the affected files and retained evidence", confirm);
      const resolve = button(safeKeep ? "Keep current project files" : "Accept verified Loomlight files", "button danger"); resolve.disabled = true; confirm.addEventListener("change", () => { resolve.disabled = !confirm.checked; });
      resolve.addEventListener("click", async () => { resolve.disabled = true; actions.status("Resolving and revalidating…"); try { const next = await actions.resolve(item.transactionId, safeKeep ? "keepCurrent" : "acceptLoomlight"); renderRecoverySurface(host, next, actions); } catch (error) { resolve.disabled = !confirm.checked; actions.status(friendlyError(error, "Recovery could not be resolved"), "error"); confirm.focus(); } });
      panel.append(confirmLabel, resolve);
    }
    host.append(panel);
  }
}

/** scene.validateAssignment accepts the same revision-bound Set variable command as scene.apply. */
export interface AssignmentDraftValidation {
  readonly targetVariableId: string;
  readonly value: unknown;
  readonly support: "supported" | "refused";
  readonly assignment: NonNullable<SceneBeat["assignment"]>;
  readonly projectRevision: string;
  readonly sourceMapRevision: string;
  readonly authoringRevision: string;
  readonly sourceRevision: string;
  readonly variables: readonly (SceneWorkspace["authoring"]["variables"][number] & { readonly source: { readonly path: string; readonly statement: string; readonly sourceRevision: string } })[];
  readonly capabilities: {
    readonly operators: readonly string[];
    readonly operations: readonly IntegerAdjustment["operation"][];
    readonly maxBytes: number; readonly maxNodes: number; readonly maxDepth: number;
    readonly integerTransport: "signedI64String"; readonly decimalTransport: "finiteFloat64OrNegativeZero"; readonly functions: false;
  };
}
