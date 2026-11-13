import { assignmentCaption, type ValidateAssignment } from "./story-arithmetic-editor.ts";
import { buildRuleBuilder, type NewVariable, type RuleBuilder, type RuleBuilderOptions } from "./story-condition-editor.ts";
import { openNewVariable, type NewVariableRequest } from "./story-new-variable.ts";
import { validateField } from "./authoring-input.ts";
import { addKindName, openAddBeat, type AddKind, type Placement } from "./story-add-beat.ts";
import { beatLabels, buildBeatEditor, defaultPayload, type BeatEditor, type EditorContext, type EditorInternals } from "./story-beat-editors.ts";
import { buildChoiceEditor, type ChoiceHost, type Ending } from "./story-choice-editor.ts";
import { storyIcon } from "./story-icons.ts";
import { openPlaceTree, type PlaceNode } from "./story-place-tree.ts";
import { button, FieldError, focusFirst, friendlyError, iconButton, labelled, openFormDialog } from "./story-editor-controls.ts";
import { isTextField, typingStepIdleMs, type DraftStep, type DraftStepRecord, type HistoryDirection } from "./project-history.ts";
import type { ResolvedScreenTarget, ScreenCatalog, ScreenEffects, ScreenRevisions, ScreenTargetBinding } from "./screen-contracts.ts";
import { laneGrips, resizeGrip, watchHiddenLanes, type FocusWidths } from "./story-focus.ts";
import { armOf, beatBody, beatNumbers, bodyOf, bodyOwner, laneOf, nodeBeats, nodeRef, ownedBodies, pinRouteLabels, renderBranchPath, renderMarksLegend, renderRoute, renderTracksKey, renderViewSwitch, sameBody, sameNode, samePosition, shorten, trackCopy, trackRoute, unknownCause, endingBeat, type PendingBeat, type RouteView, viewName } from "./story-tracks.ts";
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
interface Character { readonly id: string; readonly displayName: string; readonly technicalName: string; readonly dialogueColor?: string; readonly defaultAppearanceId?: string | null }
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

/** A branch's test as text: its typed condition, or its Variable for older sources. */
function branchTest(branch: ConditionalBranch, model: SceneWorkspace): string {
  return branch.condition ? conditionCaption(branch.condition, model.authoring.variables)
    : model.authoring.variables.find(variable => variable.id === branch.variableId)?.technicalName ?? "Unknown condition";
}
function branchCaption(branch: ConditionalBranch, model: SceneWorkspace): string {
  return branch.otherwise ? "Otherwise" : `${branch.ordinal ? "Else If" : "If"} ${branchTest(branch, model)}`;
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

/**
 * Scene-local state through `throughBeatId`, or through the whole scene. `manualBranches`
 * (groupId → branch) is the route the Branch path opens. A condition or Choice with no
 * open branch stops a whole-scene preview; before the selected beat it leaves its state
 * unknown and the preview continues.
 */
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
  const passClosed = throughBeatId !== undefined && stop >= 0;
  const forget = (beat: SceneBeat): void => {
    if (!unknownBeatIds.includes(beat.id)) unknownBeatIds.push(beat.id);
    background = undefined; backgroundUnknown = true; characters = []; charactersUnknown = true;
    music = undefined; musicUnknown = true; variables = {}; variablesUnknown = true; overlay = undefined;
  };
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
        if (branches.some(branch => branch.id === selected)) { lastVisitedBeatId = beat.id; continue; }
      }
    } else if (beat.owner && beat.id !== throughBeatId) continue;
    lastVisitedBeatId = beat.id;
    if (beat.structuralPlaceholder) continue;
    if (payload.type === "customCode" || previewLogicBoundary(beat)) {
      forget(beat);
      if (payload.type === "customCode") { if (manualBranches && beat.conditionalBranch && !passClosed) break; continue; }
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
      if (!selected || !payload.options.some(option => option.id === selected)) { if (!passClosed || beat.id === throughBeatId) break; forget(beat); }
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

/** The project's scene list beside Story. The scene title opens and closes it. */
export interface SceneList {
  readonly panelId: string;
  readonly open: () => boolean;
  readonly toggle: () => void;
}
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
  readonly status: (message: string, kind?: "normal" | "error", links?: readonly StatusLink[], detail?: StatusDetail) => void;
  readonly sceneList?: SceneList;
  readonly present: (assetId: string, purpose: MediaPresentation["purpose"]) => Promise<MediaPresentation>;
  readonly resolution: { readonly width: number; readonly height: number };
  readonly viewSource?: (path: string, byteStart?: number, byteEnd?: number, expectedRevision?: string) => void;
  /** Creates a project variable from a rule builder's list and returns the new workspace. */
  readonly createVariable?: (request: NewVariableRequest) => Promise<SceneWorkspace>;
}

export interface RecoveryActions {
  readonly resolve: (transactionId: string, resolution: "keepCurrent" | "acceptLoomlight") => Promise<RecoveryReport>;
  readonly status: (message: string, kind?: "normal" | "error") => void;
  readonly completed: () => void;
}

function treeMenu(controls:HTMLElement):HTMLElement {const menu=document.createElement("details");menu.className="tree-menu";const toggle=document.createElement("summary");toggle.textContent="⋯";toggle.ariaLabel="Scene or chapter actions";menu.append(toggle,controls);return menu;}
function input(value = ""): HTMLInputElement {
  const element = document.createElement("input");
  element.type = "text";
  element.value = value;
  return element;
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
  const form = root.querySelector<HTMLElement>('.scene-draft[data-unsubmitted="true"]'); if (form) focusFirst(form);
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
/** How the header save status shows a message: the bold lead of a refusal, and its 560 px form. */
export interface StatusDetail { readonly lead?: string; readonly short?: string }
export interface StoryStatus extends StatusDetail { readonly text: string; readonly kind: "normal" | "error"; readonly links: readonly StatusLink[] }
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
  /** How many beat drafts the project has, for the header save status. */
  draftCount(): number;
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

/** Where Tracks or Reel is scrolled, kept across redraws. */
interface ScrollPosition { readonly left: number; readonly top: number }
const scrollOf = (scroller: HTMLElement | null): ScrollPosition => ({ left: scroller?.scrollLeft ?? 0, top: scroller?.scrollTop ?? 0 });

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
  // Writing focus hides the stage. It and its widths are view state for the project
  // session, outside Undo; the widths live on `host` as custom properties.
  let writingFocus = false;
  const focusWidths: FocusWidths = new Map();
  let stopLaneWatch: (() => void) | undefined;
  const collapsedChapters=new Set<string>();
  // The Branch path route: groupId → open branch or option. View state outside Undo.
  const openBranches = new Map<string, string>();
  // The bottom panel's view of that route. View state outside Undo, kept for the project session.
  let routeView: RouteView = "tracks";
  // A new beat draft shown in the editor, by its draft key. A beat id is `selectedBeatId`.
  let selectedNewDraft: string | undefined;
  // A Story operation form (move, delete, condition, ending) shown in place of the editor.
  let openOperation: HTMLElement | undefined;
  let numbers = new Map<string, string>();
  let editorHost: HTMLElement | undefined, bottomHost: HTMLElement | undefined, effectsHost: HTMLElement | undefined;
  let settling: Promise<boolean> | undefined;
  let composing = false;
  let pendingWrites = 0;
  // "+ New variable…" in a rule builder: core creates the variable as one edit with Undo.
  // Story takes the new workspace without redrawing, so the open draft keeps its input
  // and commits against the new revisions.
  const newVariable: NewVariable = opener => openNewVariable({
    host, opener,
    create: async request => {
      if (!actions.createVariable) throw Error("Create the variable in Variables.");
      if (pendingWrites) throw Error("Wait for the current change to finish.");
      const next = await actions.createVariable(request);
      if (disposed) throw Error("Story closed.");
      model = next; actions.status("Saved");
      const created = next.authoring.variables.find(item => item.technicalName === request.technicalName);
      if (!created) throw Error("Core did not return the new variable. Refresh Story.");
      return created;
    },
  });
  // Story drafts for the project session: beats, a new beat or condition at an insertion
  // place, and a condition's branch tests, new branches and branch deletions. A new beat,
  // condition or branch is a draft from the moment it is added; an existing beat or test
  // only once edited. `beatId` names the beat, branch or condition the draft belongs to.
  // `command` throws when the draft is incomplete, invalid or conflicts with source.
  // For draft steps (ADR 0025), `id` names the draft in core's history, `kind` names its
  // beat, `editors` keep editor state that controls do not show, `detach` removes a new
  // beat's editor, `state` is the draft after its last step (none before its first) and
  // `lastStep` orders Story Save, so the most recently edited draft ends on top. A `last`
  // draft, a branch deletion, saves after the others, so edits inside the branch land first.
  // `conflict` compares the draft with source now (see DraftConflict); `primary` is the
  // field the comparison sits above.
  interface BeatDraft { readonly id: string; readonly panel: HTMLElement; readonly sceneId: string; readonly beatId?: string; readonly place?: () => { body: BodyRef; position: Position }; readonly read?: () => BeatPayload; readonly command: () => SceneCommand; readonly kind: () => string; readonly editors: () => readonly DraftEditor[]; readonly conflict: () => DraftConflict | undefined; readonly primary: () => HTMLElement; readonly detach?: () => void; readonly replaces?: () => string | undefined; readonly nextLine?: () => void; readonly last?: boolean; state?: DraftState; lastStep: number }
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
    if (restoring || disposed || !(target instanceof HTMLElement)) return;
    if (isTextField(target)) {
      // The field's change event follows its typing, which is already a step.
      if (event.type !== "input") return;
      if (openText?.field !== target) { closeText(); openText = { draft, field: target, stepId: startStep(draft, "typing", draft.state) }; }
      const open = openText; clearTimeout(open.timer); open.timer = setTimeout(() => { if (openText === open) closeText(); }, typingStepIdleMs);
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
    draftsChanged(draft);
    // A draft that comes back out of view is revealed in the editor; a shown one keeps focus.
    const scene = model.scenes.find(item => item.id === draft.sceneId);
    if (state && !draft.panel.isConnected && scene && draft.sceneId === selectedSceneId) {
      openOperation = undefined;
      if (draft.beatId) selectBeat(scene, draft.beatId); else { selectedBeatId = undefined; selectedNewDraft = key; const place = draft.place?.().body; if (place) openTo(scene, place); }
      draw();
    } else { refreshPreview(); if (!draft.beatId) redrawBottom(); }
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
  // A picture a picker sheet points at, shown on the stage in place of its beat's draft.
  let sheetPreview: { readonly key: string; readonly payload: BeatPayload } | undefined;
  const withDrafts = (scene: SceneDocument): SceneDocument => {
    const edits = new Map<string, BeatPayload>();
    const unknown = new Set<string>();
    const added: { readonly key: string; readonly payload: BeatPayload; readonly body: BodyRef; readonly position: Position; readonly replaces?: string }[] = [];
    for (const draft of pendingDrafts(scene.id)) {
      const key = draft.beatId ?? draft.panel.dataset.beatDraftKey!;
      const sheet = sheetPreview?.key === key ? sheetPreview.payload : undefined;
      if (!draft.read) continue;
      // Reading an arithmetic draft validates it, so it is not read for the preview.
      if (draft.beatId && scene.beats.find(beat => beat.id === draft.beatId)?.payload.type === "setVariable") { unknown.add(draft.beatId); continue; }
      const payload = sheet ?? readQuietly(draft.read); if (!payload) continue;
      if (draft.beatId) edits.set(draft.beatId, payload);
      else if (draft.place && payload.type !== "setVariable") { const replaced = draft.replaces?.(); added.push({ key, payload, ...draft.place(), ...(replaced ? { replaces: replaced } : {}) }); }
    }
    // A picture pointed at in a sheet previews on a beat the author has not edited yet, too.
    if (sheetPreview && scene.beats.some(beat => beat.id === sheetPreview!.key)) edits.set(sheetPreview.key, sheetPreview.payload);
    if (!edits.size && !unknown.size && !added.length) return scene;
    const beats: SceneBeat[] = scene.beats.map(beat => {
      const payload = edits.get(beat.id);
      // Without the accepted core result, a calculation previews as unknown.
      if (unknown.has(beat.id)) { const { assignment: _accepted, ...rest } = beat; return rest; }
      return payload ? { ...beat, payload } : beat;
    });
    // A valid new beat previews at its place, as a beat in source order. One that replaces an ending takes its place.
    for (const item of added) {
      const owner = item.body.type === "branch" ? { groupId: item.body.groupId, branchId: item.body.branchId } : undefined;
      const beat: SceneBeat = { id: item.key, byteStart: 0, byteEnd: 0, protected: false, payload: item.payload, ...(owner ? { owner } : {}) };
      const replaced = item.replaces === undefined ? -1 : beats.findIndex(other => other.id === item.replaces);
      if (replaced >= 0) { beats[replaced] = { ...beat, ...(beats[replaced]!.owner ? { owner: beats[replaced]!.owner } : {}) }; continue; }
      const position = item.position, anchor = position.type === "before" ? beats.findIndex(other => sameNode(nodeRef(other), position.anchor) && !other.conditionalBranch?.ordinal && !other.conditionalBranch?.otherwise) : -1;
      const last = nodeBeats(scene, item.body).at(-1), after = last ? beats.findIndex(other => other.id === last.id) : item.body.type === "branch" ? beats.findIndex(other => other.id === (item.body as { branchId: string }).branchId) : beats.length - 1;
      // The end of a body follows everything inside its last node.
      let end = after;
      if (last && position.type === "end") { const inner = innerBodies(scene, last); while (end + 1 < beats.length && beats[end + 1]!.owner && inner.has(beats[end + 1]!.owner!.branchId)) end++; }
      beats.splice(anchor >= 0 ? anchor : end + 1, 0, beat);
    }
    return { ...scene, beats };
  };
  let previewTarget: { readonly stage: HTMLElement; readonly sceneId: string } | undefined;
  const refreshPreview = (): void => {
    const scene = previewTarget && model.scenes.find(item => item.id === previewTarget!.sceneId);
    if (!previewTarget?.stage.isConnected || !scene || composing) return;
    mediaGeneration++; previewTarget.stage.replaceChildren(); renderStage(previewTarget.stage, scene);
    if (effectsHost?.isConnected) { effectsHost.replaceChildren(); renderEffects(effectsHost, scene); }
    refreshLanes(scene);
  };
  // Tracks lane text and Reel text follow valid drafts, as the stage does; invalid input
  // keeps the accepted text.
  const refreshLanes = (scene: SceneDocument): void => {
    const shown = withDrafts(scene);
    for (const column of host.querySelectorAll<HTMLElement>(".story-track-column[data-beat-id]")) {
      const beat = shown.beats.find(item => item.id === column.dataset.beatId);
      if (!beat || beat.conditionalBranch || beat.payload.type === "return") continue;
      const lane = laneOf(beat), reel = column.querySelector<HTMLElement>(":scope > .story-track-beat > .story-reel-copy");
      const cell = column.querySelector<HTMLElement>(`:scope > .story-track-beat > .story-lane-${lane}`);
      const text = lane === 5 && !reel ? `${beatName(beat)} · ${beatSummary(beat.payload, model)}` : beatSummary(beat.payload, model);
      const target = reel ?? (lane === 3 ? cell?.querySelector<HTMLElement>(".story-lane-copy") : cell);
      if (target && target.textContent !== text) target.textContent = text;
    }
  };
  const dropDraft = (key: string): void => { beatDrafts.delete(key); draftsChanged(); };
  const redrawBottom = (): void => { const scene = storyScene(model, selectedSceneId); if (scene && bottomHost?.isConnected) drawBottom(scene); };
  // Other open forms (names, moves, condition operations) still settle before navigation.
  const drafts = (): HTMLElement[] => [host, treeHost].flatMap(root => [...root.querySelectorAll<HTMLElement>('.scene-draft[data-unsubmitted="true"]')]).filter(form => !form.closest("[data-beat-draft-key]"));
  const hasDraft = (): boolean => drafts().length > 0;
  const focusDraft = (): void => { const form = drafts()[0] ?? host.querySelector<HTMLElement>("[data-beat-draft-key]"); if (form) focusFirst(form); };
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
    const joined = committed ? [committed, ...discardedBy(command).filter(draft => draft !== committed)] : discardedBy(command);
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

  // Opens every branch on the way to a body, so Tracks shows it.
  const openTo = (scene: SceneDocument, body: BodyRef): void => {
    for (let at: BodyRef | undefined = body, steps = 0; at?.type === "branch" && steps <= 32; steps++) { openBranches.set(at.groupId, at.branchId); at = bodyOf(scene, at)?.parent; }
  };
  // Selects a beat or a branch header and opens the branches around it. Blank lines and
  // comments are not Tracks beats: a target there selects the next beat in its body.
  const selectBeat = (scene: SceneDocument, target: string | undefined): void => {
    const found = target === undefined ? undefined : scene.beats.find(item => item.id === target);
    const shown = !found || found.conditionalBranch || scene.bodies.some(body => body.nodes.some(node => node.beatId === found.id));
    const nodes = found && !shown ? nodeBeats(scene, beatBody(found)) : [];
    const id = shown ? target : (nodes.find(node => node.byteStart >= found!.byteEnd) ?? nodes.at(-1))?.id ?? (found!.owner?.branchId);
    selectedBeatId = id; selectedNewDraft = undefined;
    const beat = id === undefined ? undefined : scene.beats.find(item => item.id === id);
    if (!beat) return;
    openTo(scene, beatBody(beat));
    const header = beat.conditionalBranch;
    if (header && (header.choiceOption || header.ordinal || header.otherwise)) openBranches.set(header.groupId, beat.id);
  };
  // Shows a draft's editor: its scene, its beat or place, and the branches around it.
  const reveal = (draft: BeatDraft): void => {
    const scene = model.scenes.find(item => item.id === draft.sceneId);
    if (scene && scene.id !== selectedSceneId) selectScene(scene.id);
    openOperation = undefined;
    if (scene && draft.beatId) selectBeat(scene, draft.beatId);
    else { selectedBeatId = undefined; selectedNewDraft = draft.panel.dataset.beatDraftKey; const place = draft.place?.().body; if (scene && place) openTo(scene, place); }
    draw();
    draft.editors()[0]?.focus();
  };
  // Reads every pending draft's command. Nothing is sent while any draft fails.
  // Commands go in the order of each draft's last step, so core puts the most recently
  // edited beat on top of the history.
  const preflight = (only?: readonly BeatDraft[]): { readonly drafts: BeatDraft[]; readonly commands: SceneCommand[]; readonly failures: [BeatDraft, string][] } => {
    // Branch removals go last, the deepest first, so a branch inside another goes before it.
    const depth = (draft: BeatDraft): number => { const scene = model.scenes.find(item => item.id === draft.sceneId); return draft.last && scene && draft.beatId ? ancestry(scene, draft.beatId).size : 0; };
    const pending = (only ? pendingDrafts().filter(draft => only.includes(draft)) : pendingDrafts()).sort((a, b) => Number(!!a.last) - Number(!!b.last) || depth(b) - depth(a) || a.lastStep - b.lastStep), commands: SceneCommand[] = [], failures: [BeatDraft, string][] = [];
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
    if (!failing.length) return { text: `${total} unsaved beat ${drafts}. Ready to save.`, kind: "normal", links: [], short: `${total} unsaved` };
    // Each link reveals the scene's first failing draft at the time of the click.
    const open = (sceneId: string): void => { const draft = inProjectOrder([...refusal?.failing.keys() ?? []].filter(item => item.sceneId === sceneId), item => item)[0]; if (draft) reveal(draft); };
    const links = model.scenes.flatMap(scene => {
      const count = failing.filter(draft => draft.sceneId === scene.id).length;
      return count ? [{ label: scene.displayName, count, open: () => open(scene.id) }] : [];
    });
    return { text: `${refusal.lead} ${failing.length} of ${total} ${drafts} ${failing.length === 1 ? "needs" : "need"} changes:`, kind: "error", links, lead: refusal.lead, short: "Nothing saved" };
  };
  // Status changes only when the count or links change, so typing does not replace other status.
  const statusKey = (): string => { const status = saveStatus(); return JSON.stringify(status && [status.text, status.links.map(link => [link.label, link.count])]); };
  const showRefusal = (): void => { const status = saveStatus(); if (status) actions.status(status.text, status.kind, status.links, status); };
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
  // Story Save, of every pending draft or of `only` those, such as a branch deletion and the drafts inside it.
  const saveDrafts = async (only?: readonly BeatDraft[]): Promise<StorySaveOutcome> => {
    if (disposed || actions.current?.() === false || !actions.saveDrafts) return { kind: "blocked" };
    if (settling || pendingWrites) { actions.status("Wait for the current Story change to finish. Nothing saved.", "error"); return { kind: "busy" }; }
    if (hasDraft()) { actions.status("Commit or cancel the open Story form before saving. Nothing saved.", "error"); focusDraft(); return { kind: "blocked" }; }
    closeText();
    const { drafts: saving, commands, failures } = preflight(only);
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
    // An unedited editor is rebuilt from accepted source; only edited ones are drafts.
    for (const [key, draft] of beatDrafts) if (!isPending(draft)) beatDrafts.delete(key);
    mediaGeneration += 1;
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
    const scroll = scrollOf(host.querySelector<HTMLElement>(".story-tracks-scroll"));
    treeHost.replaceChildren();
    host.replaceChildren();
    const selectedScene = storyScene(model, selectedSceneId);
    if (!selectedScene) {
      const empty = document.createElement("p"); empty.className = "error-message"; empty.textContent = "No valid Scene is available."; host.append(empty); return;
    }
    if (selectedBeatId && !selectedScene.beats.some(beat => beat.id === selectedBeatId)) selectedBeatId = undefined;
    if (selectedNewDraft && beatDrafts.get(selectedNewDraft)?.sceneId !== selectedScene.id) selectedNewDraft = undefined;
    numbers = beatNumbers(selectedScene);
    drawTree(selectedScene);
    drawStory(selectedScene, scroll);
    for (const draft of pendingDrafts()) drawConflict(draft);
    settleRefusal();
    markDrafts();
  };

  // A draft whose beat, place or scene left source has no beat to sit under. It shows
  // at the top of the editor, with the comparison and Discard draft. So does a draft in
  // a scene Story cannot map, with its own actions.
  const lostDrafts = (scene: SceneDocument): HTMLElement[] => {
    const away = (draft: BeatDraft): boolean => scene.sourceConflict ? !draft.panel.isConnected : "missing" in (draft.conflict() ?? {});
    return pendingDrafts().filter(draft => (draft.sceneId === scene.id || !model.scenes.some(item => item.id === draft.sceneId)) && away(draft) && draft.panel.dataset.beatDraftKey !== selectedNewDraft && draft.beatId !== selectedBeatId).map(draft => draft.panel);
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
    // A condition or Choice column also marks the drafts inside its branches, open or not.
    const shown = storyScene(model, selectedSceneId);
    const inside = (id: string, drafts?: readonly BeatDraft[]): boolean => {
      const node = shown?.beats.find(beat => beat.id === id);
      return !!shown && !!node && ownedBodies(shown, node).some(body => body.type === "branch" && draftsWithin(shown, body.branchId, drafts));
    };
    // A failing beat's tooltip gives the reason; a conflict's says so.
    const reasons = new Map([...failing].flatMap(([draft, reason]) => draft.beatId ? [[draft.beatId, reason] as const] : []));
    // Reel also shows it under the beat's text (story-combined-status / header-v2).
    const tip = (button: HTMLElement | null, reason: string | undefined): void => {
      if (!button) return;
      if (reason) button.title = reason; else button.removeAttribute("title");
      const line = button.querySelector<HTMLElement>(":scope > .story-reel-reason");
      if (line) { line.textContent = reason ?? ""; line.hidden = !reason; }
    };
    host.querySelectorAll<HTMLElement>(".story-track-column[data-beat-id]").forEach(column => { const id = column.dataset.beatId ?? "", button = column.querySelector<HTMLElement>(":scope > .story-track-beat"); mark(column, button, beats.has(id) || inside(id), failingBeats.has(id) || inside(id, [...failing.keys()]), conflicting.has(id)); tip(button, reasons.get(id) ?? (conflicting.has(id) ? trackCopy.conflict : undefined)); });
    host.querySelectorAll<HTMLElement>(".story-track-pending").forEach(column => { const draft = beatDrafts.get(column.dataset.newBeat ?? ""), button = column.querySelector<HTMLElement>(":scope > .story-track-beat"); mark(column, button, !!draft, !!draft && failing.has(draft)); tip(button, draft && failing.get(draft)); });
    host.querySelectorAll<HTMLElement>(".story-editor-state").forEach(state => {
      // A branch's mark names its own drafts by key; a heading's covers its beat and, for a
      // condition, the drafts in its branches.
      const keyed = state.dataset.draftKeys?.split(" ").flatMap(key => { const draft = beatDrafts.get(key); return draft && isPending(draft) ? [draft] : []; });
      const id = state.dataset.beatId ?? "";
      const fails = keyed ? keyed.some(draft => failing.has(draft)) : failingBeats.has(id), conflict = keyed ? keyed.some(draft => !!draft.conflict()) : conflicting.has(id), has = keyed ? keyed.length > 0 : beats.has(id) || inside(id);
      state.textContent = fails ? `! ${trackCopy.needsChanges}` : conflict ? "! Conflict" : has ? `* ${trackCopy.draft}` : "";
      state.dataset.mark = fails ? "fail" : conflict ? "conflict" : has ? "draft" : "";
    });
    host.querySelectorAll<HTMLElement>(".story-legend-fail").forEach(item => { item.hidden = !failing.size; });
    treeHost.querySelectorAll<HTMLElement>(".tree-scene-row").forEach(row => mark(row, row.querySelector(".tree-scene-open"), scenes.has(row.dataset.sceneId ?? ""), failingScenes.has(row.dataset.sceneId ?? "")));
    for (const draft of beatDrafts.values()) {
      const reason = failing.get(draft);
      let note = draft.panel.querySelector<HTMLElement>(":scope > .story-save-reason");
      if (reason === undefined) { draft.panel.removeAttribute("data-save-refused"); note?.remove(); continue; }
      draft.panel.dataset.saveRefused = "true";
      if (draft.conflict()) { note?.remove(); continue; }
      // The reason sits under the fields, above Commit and Cancel.
      if (!note) { note = document.createElement("p"); note.className = "error-message story-save-reason"; const row = draft.panel.querySelector(":scope > .row-actions"); if (row) row.before(note); else draft.panel.append(note); }
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
    const found=controls.find(control => control.dataset.beatOpener === key) ?? controls.find(control => control.dataset.beatOpener === "root");
    // An opener under the closed More menu returns focus to More itself.
    const opener=found?.closest("details:not([open])")?.querySelector<HTMLElement>(":scope > summary") ?? found;
    opener?.focus({preventScroll:true});
    opener?.scrollIntoView?.({block:"nearest",inline:"nearest"});
  };
  // Opens a new beat draft at a place in a body and shows it in the editor. `replaces`
  // names an ending the new beat takes the place of.
  const insertAt = (scene: SceneDocument, body: BodyRef, position: Position, opener: string, initialType: AddKind, hint?: ScreenInsertion, replaces?: string): void => {
    if (!draftGuard()) return;
    openOperation = undefined;
    const current = model.scenes.find(item => item.id === scene.id); if (!current) return;
    const key = renderNewBeat(current, initialType, body, position, hint, opener, selectedNewDraft ? undefined : selectedBeatId, replaces);
    selectedBeatId = undefined; selectedNewDraft = key; openTo(current, body);
    draw();
    beatDrafts.get(key)?.editors()[0]?.focus();
  };
  // The new beat draft already waiting at a place, if any. Adding there again returns to it.
  const pendingAt = (scene: SceneDocument, body: BodyRef, position: Position): string | undefined => {
    const requested = JSON.stringify({ body, position });
    return [...beatDrafts.entries()].find(([, draft]) => !draft.beatId && draft.sceneId === scene.id && JSON.stringify(draft.place?.()) === requested)?.[0];
  };
  // Where a kind goes at a place, from core's places. An ending goes at the end of its
  // scene, branch or option; where that already ends, it replaces the ending.
  const placeFor = (scene: SceneDocument, body: BodyRef, position: Position, kind: AddKind): { readonly position: Position; readonly replaces?: SceneBeat; readonly unavailable?: string } => {
    if (kind !== "jump" && kind !== "return") return { position };
    const info = bodyOf(scene, body), places = info?.places ?? [];
    if (places.some(place => place.fitsEnding && samePosition(place.position, position))) return { position };
    const end = places.find(place => place.fitsEnding && place.position.type === "end");
    if (end) return { position: end.position };
    const ending = info?.ending, last = ending?.type === "ends" ? scene.beats.find(beat => beat.id === ending.beatId) : undefined;
    if (last && !last.protected && endingBeat(last)) return { position: { type: "before", anchor: nodeRef(last) }, replaces: last };
    return { position, unavailable: last ? `${placeName(scene, body)} already ends at ${numbers.get(last.id) ?? ""} ${nodeName(last)}.` : `An ending cannot go in ${placeName(scene, body)}.` };
  };
  // "Before 05 Mara's line", or "End of …" for a body's end.
  const positionLabel = (scene: SceneDocument, body: BodyRef, position: Position): string => {
    if (position.type === "before") { const anchor = nodeBeats(scene, body).find(beat => sameNode(nodeRef(beat), position.anchor)); return anchor ? `Before ${numbers.get(anchor.id) ?? ""} ${nodeName(anchor)}` : "Before a beat that is no longer in source"; }
    if (body.type === "root") return trackCopy.sceneEnd;
    const header = scene.beats.find(beat => beat.id === body.branchId);
    return header ? trackCopy.endOf(endName(scene, header)) : trackCopy.endOf("a branch that is no longer in source");
  };
  // The node right before a position, as Add a beat names it in After.
  const nodeBefore = (scene: SceneDocument, body: BodyRef, position: Position): SceneBeat | undefined => {
    const nodes = nodeBeats(scene, body);
    if (position.type === "end") return nodes.at(-1);
    const at = nodes.findIndex(beat => sameNode(nodeRef(beat), position.anchor)); return at > 0 ? nodes[at - 1] : undefined;
  };
  // Goes at, In and After for a new beat (story-combined-editor / replace-v2).
  const placement = (scene: SceneDocument, body: BodyRef, position: Position, kind: AddKind): Placement => {
    const resolved = placeFor(scene, body, position, kind), before = nodeBefore(scene, body, resolved.position);
    const replaced = resolved.replaces && `${numbers.get(resolved.replaces.id) ?? ""} ${nodeName(resolved.replaces)}`;
    return {
      goesAt: replaced ? `Replaces ${replaced}` : positionLabel(scene, body, resolved.position), in: pathCaption(scene, body),
      ...(before ? { after: `${numbers.get(before.id) ?? ""} ${nodeName(before)}` } : {}),
      ...(replaced ? { note: `${addKindName(kind)} replaces ${replaced}. Undo restores it.` } : kind === "background" ? { note: "A new background clears the characters on stage." } : {}),
      ...(resolved.unavailable ? { unavailable: resolved.unavailable } : {}),
    };
  };
  // Add a beat at a place: the compact dialog picks the kind, then the new beat opens in the editor.
  // From the scene toolbar, a screen beat starts at the place Screens last used, as Add screen Beat does.
  const addBeat = (scene: SceneDocument, body: BodyRef, position: Position, opener: string, remembered = false): void => {
    if (!draftGuard()) return;
    const current = model.scenes.find(item => item.id === scene.id); if (!current || current.sourceConflict) return;
    const waiting = pendingAt(current, body, position);
    if (waiting) { if (navigate(() => { selectedBeatId = undefined; selectedNewDraft = waiting; openTo(current, body); })) beatDrafts.get(waiting)?.editors()[0]?.focus(); return; }
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    openAddBeat({
      host, opener: trigger, screens: !!(actions.screenCatalog && actions.resolveScreenTarget), where: kind => placement(current, body, position, kind),
      choose: kind => {
        if (remembered && ["showScreen", "hideScreen", "callScreen"].includes(kind)) { openNewBeat(current, kind, null, opener); return; }
        const resolved = placeFor(current, body, position, kind);
        insertAt(current, body, resolved.position, opener, kind, undefined, resolved.replaces?.id);
      },
    });
  };
  // + Add beat in the scene toolbar adds at the scene's default place. Add screen Beat and
  // Add change here name their kind, so they open it directly.
  const openNewBeat = (scene: SceneDocument, initialType?: AddKind, beforeBeatId: string | null = null, opener = "root"): void => {
    const anchor = beforeBeatId ? scene.beats.find(beat => beat.id === beforeBeatId) : undefined;
    const before: Position | undefined = anchor && { type: "before", anchor: nodeRef(anchor) };
    if (anchor && !bodyOf(scene, beatBody(anchor))?.places.some(place => samePosition(place.position, before!))) {
      actions.status(`This beat has no insertion place before it. Use + in ${viewName(routeView)}.`, "error"); return;
    }
    if (!initialType) { addBeat(scene, { type: "root" }, defaultPlace(scene, { type: "root" }), opener, true); return; }
    const screenBeat = ["showScreen", "hideScreen", "callScreen"].includes(initialType);
    const remembered = screenInsertion;
    const hint = !anchor && screenBeat && remembered && (remembered.sceneId === scene.id || !model.scenes.some(item=>item.id===remembered.sceneId)) ? structuredClone(remembered) : undefined;
    const body = anchor ? beatBody(anchor) : hint?.body ?? {type:"root"} as BodyRef;
    insertAt(scene, body, before ?? hint?.position ?? defaultPlace(scene, body), opener, initialType, hint);
  };

  // `staged` images belong to one stage draw and give up when it redraws. Editor and sheet
  // thumbnails outlive stage redraws, so they only need to still be shown.
  const loadImage = async (assetId: string, purpose: "thumbnail" | "imagePreview", image: HTMLImageElement, errorHost: HTMLElement, staged = true): Promise<void> => {
    const generation = staged ? mediaGeneration : undefined;
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
      if (disposed || (generation !== undefined && generation !== mediaGeneration) || !image.isConnected) return;
      const replaced = imageCache.get(assetId);
      // Several images can await the same presentation (canvas and details).
      // Reuse its URL instead of revoking the URL just assigned to another image.
      if (replaced?.key === media.cacheKey) { image.src = replaced.url; return; }
      const url = presentationUrl(media);
      if (replaced) URL.revokeObjectURL(replaced.url);
      imageCache.set(assetId, { key: media.cacheKey, url }); image.src = url;
    } catch (error) {
      if (disposed || (generation !== undefined && generation !== mediaGeneration) || !errorHost.isConnected) return;
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

  // The stage previews the open Branch path route through the selected beat.
  const previewState = (scene: SceneDocument): ScenePreviewState => {
    const forks = scene.beats.some(beat => beat.conditionalBranch), shown = withDrafts(scene);
    // A selected new beat previews through itself once it is valid.
    const through = selectedBeatId ?? (selectedNewDraft && shown.beats.some(beat => beat.id === selectedNewDraft) ? selectedNewDraft : undefined);
    return deriveScenePreview(shown, through, forks ? openBranches : undefined);
  };
  // The game stage keeps the project's width-to-height ratio and fits whole into its slot.
  const renderStage = (stage: HTMLElement, scene: SceneDocument): void => {
    const state = previewState(scene), shown = withDrafts(scene), { width, height } = actions.resolution;
    const title = document.createElement("div"); title.className = "story-stage-title";
    const name = document.createElement("strong"); name.textContent = "Game window";
    const size = document.createElement("span"); size.className = "story-stage-resolution"; size.textContent = `${width} × ${height}`;
    title.append(name, size);
    const slot = document.createElement("div"); slot.className = "story-stage-slot";
    slot.style.setProperty("--stage-w", String(width)); slot.style.setProperty("--stage-h", String(height));
    const canvas = document.createElement("div"); canvas.className = "preview-canvas"; canvas.style.aspectRatio = `${width} / ${height}`; canvas.setAttribute("aria-label", "Game stage");
    const choice = state.overlay?.choice;
    if (state.background) {
      const image = document.createElement("img"); image.className = "preview-background"; image.alt = model.authoring.assets.find((asset) => asset.id === state.background?.assetId)?.displayName ?? "Scene background";
      canvas.append(image); void loadImage(state.background.assetId, "imagePreview", image, canvas);
    } else {
      const empty = document.createElement("p"); empty.className = "preview-empty"; empty.textContent = state.backgroundUnknown ? "Background unknown after code or unevaluated flow" : "No background at this point";
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
    if (choice) canvas.append(...stageChoice(choice, state.overlay!.beatId));
    else if (state.overlay) {
      const overlay = document.createElement("div"); overlay.className = `preview-overlay ${state.overlay.kind}`;
      overlay.textContent = state.overlay.text || (state.overlay.kind === "dialogue" ? "Empty dialogue" : state.overlay.kind);
      if (state.overlay.kind === "dialogue") {
        const beat = shown.beats.find(b => b.id === state.overlay?.beatId);
        if (beat?.payload.type === "dialogue") {
          const characterId = beat.payload.characterId;
          const speaker = document.createElement("strong"); speaker.className = "preview-speaker";
          speaker.textContent = model.authoring.characters.find(character => character.id === characterId)?.displayName ?? ""; overlay.prepend(speaker);
        }
      }
      canvas.append(overlay);
    }
    slot.append(canvas);
    const footer = document.createElement("div"); footer.className = "story-stage-footer";
    const through = document.createElement("span"); through.className = "story-stage-status";
    const at = state.throughBeatId ? shown.beats.find(beat => beat.id === state.throughBeatId) : undefined;
    through.textContent = at ? `Through ${numbers.get(at.id) ?? "New"} · ${beatName(at)}` : "Scene start";
    footer.append(through);
    if (state.partial) { const badge = document.createElement("strong"); badge.className = "partial-badge"; badge.textContent = "Partial / unknown"; footer.append(badge); }
    if (choice) footer.append(previewOptionsMenu(choice));
    stage.append(title, slot, footer);
  };
  // Preview options: per option, an assumed condition result and whether it was picked earlier
  // in this save. They change only the stage: no draft, no Undo entry and no game state.
  type OptionAssumption = { readonly truth?: "true" | "false"; readonly picked?: boolean };
  const assumptions = new Map<string, OptionAssumption>();
  let stageMark: string | undefined;
  const optionKey = (option: ChoiceOption, index: number): string => option.id ?? `new:${index}`;
  // What the game shows for each option under the assumptions. Hide picked wins over Show disabled.
  const optionStates = (choice: Extract<BeatPayload, { type: "choice" }>): ("available" | "marked" | "unknown" | "disabled" | "hidden")[] => choice.options.map((option, index) => {
    const assumed = assumptions.get(optionKey(option, index)) ?? {}, truth = option.condition ? assumed.truth : "true";
    if (assumed.picked && choice.pickedPolicy === "hidePicked") return "hidden";
    if (truth === "false") return option.unavailablePolicy === "showDisabled" ? "disabled" : "hidden";
    if (assumed.picked && choice.pickedPolicy === "markPicked") return truth === undefined ? "unknown" : "marked";
    return truth === undefined ? "unknown" : "available";
  });
  // The game's choice menu: the prompt in the text box, then the options as the player sees them.
  const stageChoice = (choice: Extract<BeatPayload, { type: "choice" }>, beatId: string): HTMLElement[] => {
    const nodes: HTMLElement[] = [];
    const menu = document.createElement("div"); menu.className = "story-game-choices"; menu.dataset.choiceOwner = beatId; menu.setAttribute("aria-label", "Choice options in the game");
    const states = optionStates(choice);
    choice.options.forEach((option, index) => {
      const state = states[index]!; if (state === "hidden") return;
      const item = button("", "story-game-choice"); item.dataset.state = state; item.dataset.optionId = optionKey(option, index); item.dataset.active = String(stageMark === optionKey(option, index));
      if (state === "marked") item.append(Object.assign(document.createElement("span"), { className: "story-stage-mark", textContent: "✓" }));
      if (state === "disabled") item.append(storyIcon("lock"));
      item.append(Object.assign(document.createElement("span"), { textContent: option.text || "New option" }));
      item.setAttribute("aria-label", `Edit option ${index + 1}: ${option.text || "New option"}${state === "disabled" ? ", shown disabled in the game" : state === "marked" ? ", marked as picked" : state === "unknown" ? ", availability unknown" : ""}`);
      item.addEventListener("click", () => editorHost?.querySelectorAll<HTMLInputElement>('input[aria-label="Choice option text"]')[index]?.focus());
      menu.append(item);
    });
    if (!states.some(state => state === "available" || state === "marked" || state === "unknown")) {
      const scene = storyScene(model, selectedSceneId), beat = scene?.beats.find(item => item.id === beatId), next = scene && beat ? continuationAfter(scene, beat) : undefined, where = next ? `at ${next}` : "after the Choice";
      const none = document.createElement("p"); none.className = "story-choice-none";
      none.textContent = states.includes("disabled") ? `Only disabled options are left, so the story continues ${where}. No pick is recorded.` : `No option can be picked, so the story continues ${where}. No pick is recorded.`;
      menu.append(none);
    }
    nodes.push(menu);
    if (choice.prompt) {
      const say = document.createElement("div"); say.className = "preview-overlay dialogue";
      const prompt = choice.prompt;
      if (prompt.type === "dialogue") { const speaker = document.createElement("strong"); speaker.className = "preview-speaker"; speaker.textContent = model.authoring.characters.find(character => character.id === prompt.characterId)?.displayName ?? "Unavailable Character"; say.append(speaker); }
      say.append(prompt.text); nodes.push(say);
    }
    return nodes;
  };
  const markStageOption = (optionId: string | undefined): void => {
    stageMark = optionId;
    for (const item of previewTarget?.stage.querySelectorAll<HTMLElement>(".story-game-choice") ?? []) item.dataset.active = String(item.dataset.optionId === optionId);
  };
  // The stage footer's Preview options menu. Illustrative only.
  const previewOptionsMenu = (choice: Extract<BeatPayload, { type: "choice" }>): HTMLElement => {
    const menu = document.createElement("details"); menu.className = "story-dropdown story-choice-preview";
    const summary = document.createElement("summary"); summary.className = "button secondary"; summary.textContent = "Preview options ▾"; summary.title = "Illustrative: choose what to assume about conditions and picked history";
    const panel = document.createElement("div"); panel.className = "story-choice-preview-panel"; panel.setAttribute("role", "group"); panel.setAttribute("aria-label", "Illustrative option preview");
    const heading = document.createElement("strong"); heading.textContent = "Illustrative preview";
    const hint = document.createElement("p"); hint.className = "story-field-hint"; hint.textContent = "Not a playthrough or a save. Choose what to assume for each option.";
    panel.append(heading, hint);
    choice.options.forEach((option, index) => {
      const key = optionKey(option, index), current = (): OptionAssumption => assumptions.get(key) ?? {};
      const row = document.createElement("div"); row.className = "story-preview-row";
      const number = document.createElement("span"); number.className = "story-option-number"; number.textContent = String(index + 1);
      const name = document.createElement("span"); name.className = "story-preview-name"; name.textContent = option.text || "New option";
      const controls = document.createElement("div"); controls.className = "story-preview-controls";
      const set = (patch: OptionAssumption): void => { assumptions.set(key, { ...current(), ...patch }); const open = menu.open; refreshPreview(); if (open) { const again = previewTarget?.stage.querySelector<HTMLDetailsElement>(".story-choice-preview"); if (again) { again.open = true; again.querySelector<HTMLElement>(`[data-assume="${key}:${String(patch.truth ?? (patch.picked !== undefined ? "picked" : "unknown"))}"]`)?.focus(); } } };
      if (option.condition) for (const [value, text] of [[undefined, "?"], ["true", "True"], ["false", "False"]] as const) {
        const toggle = button(text, "button secondary"); toggle.dataset.assume = `${key}:${value ?? "unknown"}`; toggle.setAttribute("aria-pressed", String(current().truth === value));
        toggle.setAttribute("aria-label", toggle.title = value ? `Assume option ${index + 1}'s condition is ${value}` : `Option ${index + 1}'s availability unknown`);
        toggle.addEventListener("click", () => set({ truth: value })); controls.append(toggle);
      } else { const always = document.createElement("span"); always.className = "story-preview-always"; always.textContent = "Always"; controls.append(always); }
      const picked = button("Picked", "button secondary"); picked.dataset.assume = `${key}:picked`; picked.setAttribute("aria-pressed", String(!!current().picked));
      picked.setAttribute("aria-label", picked.title = `Assume option ${index + 1} was picked earlier in this save`);
      picked.addEventListener("click", () => set({ picked: !current().picked })); controls.append(picked);
      row.append(number, name, controls); panel.append(row);
    });
    menu.addEventListener("keydown", event => { if (event.key === "Escape" && menu.open) { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } });
    menu.append(summary, panel); return menu;
  };
  // In effect at the selected beat: what set each visible item, with Edit and Add change here.
  const renderEffects = (section: HTMLElement, scene: SceneDocument): void => {
    const state = previewState(scene), selected = scene.beats.find(beat => beat.id === selectedBeatId);
    const heading = document.createElement("h3"); heading.textContent = selected ? `In effect at ${numbers.get(selected.id) ?? ""}` : "In effect at the end of the scene";
    section.append(heading);
    const addable = !selected || !!bodyOf(scene, beatBody(selected))?.places.some(place => samePosition(place.position, { type: "before", anchor: nodeRef(selected) }));
    const contribution = (label: string, beatId: string | undefined, addType: AddKind, assetId?: string): void => {
      const row = document.createElement("div"); row.className = "provenance-row";
      if (assetId) { const tile = document.createElement("span"); tile.className = "asset-thumbnail"; const image = document.createElement("img"); image.alt = ""; tile.append(image); row.append(tile); void loadImage(assetId, "thumbnail", image, tile); }
      const name = document.createElement("span"); name.textContent = label; row.append(name);
      if (beatId) { const edit = button(`Edit ${numbers.get(beatId) ?? ""}`, "text-button"); edit.addEventListener("click", () => select(scene, beatId)); row.append(edit); }
      const add = button("Add change here", "text-button"); add.dataset.beatOpener = `change:${addType}`; add.disabled = scene.sourceConflict || !addable; add.addEventListener("click", () => openNewBeat(scene, addType, selectedBeatId ?? null, `change:${addType}`)); row.append(add); section.append(row);
    };
    contribution(state.backgroundUnknown ? "Background · unknown" : state.background ? model.authoring.assets.find(asset => asset.id === state.background?.assetId)?.displayName ?? "Background" : "Background", state.background?.beatId, "background", state.background?.assetId);
    state.characters.forEach((character) => contribution(`${model.authoring.characters.find((item) => item.id === character.characterId)?.displayName ?? "Character"} · ${character.placement}`, character.appearanceBeatId, "changeAppearance", model.authoring.appearances.find(item => item.id === character.appearanceId)?.assetId));
    contribution(state.musicUnknown ? "Music · unknown" : state.music ? model.authoring.assets.find(asset => asset.id === state.music?.assetId)?.displayName ?? "Music" : "Music", state.music?.beatId, "playMusic");
    const knownVariables = Object.entries(state.variables); knownVariables.forEach(([id, value]) => contribution(`Variable ${model.authoring.variables.find((item) => item.id === id)?.technicalName ?? id} = ${String(value.value)}`, value.beatId, "setVariable"));
    if (state.variablesUnknown && !knownVariables.length) { const unknown = document.createElement("p"); unknown.className = "muted"; unknown.textContent = "Variable state is unknown after code or unevaluated flow."; section.append(unknown); }
    // Audio plays only from this explicit action, never on selection.
    const audible = selected?.payload.type === "playSfx" ? selected.payload.assetId : state.music?.assetId;
    if (audible) { const audioHost = document.createElement("div"); audioHost.className = "audio-audition"; const play = button(selected?.payload.type === "playSfx" ? "Audition selected SFX" : "Audition current music"); play.addEventListener("click", () => void audition(audible, audioHost, play)); section.append(play, audioHost); }
  };

  // An operation form: deleting a beat or condition, or unwrapping a branch.
  const operation = (scene: SceneDocument, target: HTMLElement, title: string, fields: readonly HTMLElement[], read: () => SceneCommand, actionLabel: string): HTMLElement => {
    const expected = { projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision };
    const panel = document.createElement("section"); panel.className = "story-operation scene-draft"; panel.setAttribute("aria-label", title);
    const heading = document.createElement("h3"); heading.textContent = title;
    const breadcrumb = document.createElement("p"); breadcrumb.className = "story-breadcrumb"; breadcrumb.textContent = `${scene.displayName} · changes apply once and can be undone`;
    const row = document.createElement("div"); row.className = "row-actions";
    const cancel = button("Cancel", "text-button"); const apply = button(actionLabel, "button primary"); apply.disabled = scene.sourceConflict;
    let pending = false;
    // Closing reopens the editor.
    const close = (): void => { if (pending) return; if (openOperation === panel) openOperation = undefined; panel.remove(); composing = false; draw(); focusColumn(selectedBeatId); };
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
          const saved = await mutate({ sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, ...command }, () => { if (openOperation === panel) openOperation = undefined; }, expected, panel);
          if (saved) focusColumn(selectedBeatId);
          return saved;
        } catch (error) { actions.status(friendlyError(error, "Check these details. Input retained."), "error"); return false; }
        finally { pending = false; if (panel.isConnected) { panel.removeAttribute("aria-busy"); locks.forEach(({ control, disabled }) => { control.disabled = disabled; }); (panel.querySelector<HTMLElement>('[aria-invalid="true"]') ?? panel.querySelector<HTMLElement>("input,select,textarea"))?.focus(); } }
      };
      settling = save().finally(() => { settling = undefined; });
    });
    row.append(cancel, apply); panel.append(heading, breadcrumb, ...fields, row); dirtyDraft(panel, []);
    if (target === operationSlot) { openOperation = panel; operationSlot = undefined; }
    target.append(panel);
    focusFirst(panel); return panel;
  };
  // A standalone operation (move, delete, condition, ending) takes the editor's place,
  // with its beat, condition or option still selected in Tracks.
  let operationSlot: HTMLElement | undefined;
  const prepareOperation = (scene: SceneDocument, beat?: SceneBeat): HTMLElement | undefined => {
    if (!draftGuard()) return;
    if (beat) selectBeat(scene, beat.id);
    openOperation = undefined; draw();
    if (!editorHost) return;
    editorHost.replaceChildren(); delete editorHost.dataset.editorFor;
    operationSlot = editorHost; return editorHost;
  };
  // A new screen beat's place: Insert in and Insert before. It keeps the place the author
  // chose in Screens across workspaces, so it confirms a place that changed before it is
  // used. Move to uses the tree in story-place-tree.ts instead.
  const destinations = (scene: SceneDocument, initialBody: BodyRef, initialPosition?: Position, retained?: ScreenInsertion): { host: HTMLElement; read: () => { body: BodyRef; position: Position } } => {
    const panel = document.createElement("div"); panel.className = "story-destination";
    const parents = scene.bodies.map(item => ({ key: item.body.type === "root" ? "root" : item.body.branchId, body: item.body, label: pathCaption(scene, item.body) }));
    const initialParent = parents.find(item => item.body.type === initialBody.type && (item.body.type === "root" || initialBody.type === "branch" && item.body.groupId === initialBody.groupId && item.body.branchId === initialBody.branchId));
    const parent = selectOf(parents.map(item => ({ value: item.key, label: item.label })), initialParent?.key ?? ""); parent.setAttribute("aria-label", "Insert in");
    if(!parent.value){const missing=document.createElement("option");missing.value="unavailable-body";missing.textContent="Original place unavailable";parent.prepend(missing);parent.value="unavailable-body";}
    const position = document.createElement("select"); position.setAttribute("aria-label", "Insert before");
    const summary = document.createElement("p"); summary.className = "story-insertion"; summary.role = "status";
    let placements: { key: string; position: Position; label: string }[] = [];
    let confirmationRequired = !!retained && (retained.sceneId !== scene.id || retained.expectedSourceRevision !== scene.sourceRevision);
    const confirmationMessage = retained?.sceneId !== scene.id ? "The original insertion Scene is unavailable. Choose a replacement position explicitly. Input retained." : "The original insertion Scene changed. Choose its position explicitly. Input retained.";
    const show = (): void => { summary.textContent = confirmationRequired && !position.value ? confirmationMessage : `Insert in ${parents.find(item => item.key === parent.value)?.label ?? scene.displayName} · ${placements.find(item => item.key === position.value)?.label ?? "Choose a position"}`; };
    const rebuild = (): void => {
      const selectedBody=parents.find(item=>item.key===parent.value);
      if(!selectedBody){placements=[];position.replaceChildren();summary.textContent="The original scene, branch or option is unavailable. Choose one. Input retained.";return;}
      const body = selectedBody.body;
      placements = (bodyOf(scene, body)?.places ?? []).map(({ position }) => ({ key: position.type === "before" ? nodeBeats(scene, body).find(beat => sameNode(nodeRef(beat), position.anchor))?.id ?? "missing" : "end", position, label: positionLabel(scene, body, position) }));
      position.replaceChildren(...placements.map(item => { const option = document.createElement("option"); option.value = item.key; option.textContent = item.label; return option; }));
      const preferred = initialPosition ?? defaultPlace(scene, body); const match = placements.find(item => samePosition(item.position, preferred));
      if (confirmationRequired) { const choose=document.createElement("option");choose.value="";choose.textContent="Choose a position";choose.disabled=true;position.prepend(choose);position.value=""; }
      else if (initialPosition && !match) { const unavailable=document.createElement("option"); unavailable.value="unavailable";unavailable.textContent="Original position unavailable";position.prepend(unavailable);position.value="unavailable"; }
      else position.value = match?.key ?? placements[0]?.key ?? "";
      initialPosition=undefined; show();
    };
    parent.addEventListener("change", rebuild); position.addEventListener("change", () => { if (placements.some(item => item.key === position.value)) confirmationRequired = false; show(); }); rebuild(); panel.append(labelled("Insert in", parent), labelled("Insert before", position), summary);
    const validate = validateField(position, () => { if (!placements.some(item => item.key === position.value)) throw Error(confirmationRequired ? confirmationMessage : `Choose an available position in ${parents.find(item => item.key === parent.value) ? placeName(scene, parents.find(item => item.key === parent.value)!.body) : scene.displayName}.`); });
    return { host: panel, read: () => { validate(); return { body: parents.find(item => item.key === parent.value)!.body, position: placements.find(item => item.key === position.value)!.position }; } };
  };
  // A new condition at a place, with its If test from the rule builder.
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
  // Condition drafts. Each branch's test, a new Else if or Otherwise and a branch removal
  // is its own retained draft, with Commit and Cancel; Story Save saves them with the beat
  // drafts. Their panels sit in the condition editor and redraw it when they end.
  const conditionKey = { newBranch: (groupId: string, otherwise: boolean): string => `branch:${groupId}:${otherwise ? "otherwise" : "elif"}`, removal: (branchId: string): string => `remove:${branchId}` };
  const conditionPanel = (className: string, label: string): HTMLElement => {
    const panel = document.createElement("div"); panel.className = `story-condition-draft ${className}`; panel.role = "group"; panel.setAttribute("aria-label", label);
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; });
    return panel;
  };
  // A rule builder for a test. A new test starts with one rule on the first variable.
  const testBuilder = (word: "If" | "Else if", condition: Condition | undefined, more: Partial<RuleBuilderOptions> = {}): RuleBuilder => {
    const builder = buildRuleBuilder(model.authoring.variables, condition, { keyword: word === "If" ? "if" : "elif", label: word, empty: "Add a rule to give this branch a test.", required: true, newVariable, ...more });
    if (!condition) builder.host.querySelector<HTMLButtonElement>(".story-add-rule")?.click();
    return builder;
  };
  const builderEditor = (panel: HTMLElement, builder?: RuleBuilder): DraftEditor => ({ focus: () => focusFirst(panel), ...builder ? { internals: { capture: builder.capture, restore: builder.restore } } : {} });
  const branchNow = (sceneId: string, id: string): { current?: SceneDocument; node?: SceneBeat } => { const current = model.scenes.find(item => item.id === sceneId); return { current, node: current?.beats.find(item => item.id === id) }; };
  const redrawEditor = (): void => { const current = storyScene(model, selectedSceneId); if (current && editorHost?.isConnected) { drawEditor(current); markDrafts(); } };
  // Commit writes one condition draft. A refused write keeps it, with focus in it.
  const commitCondition = async (draft: BeatDraft, key: string, focusId: string): Promise<void> => {
    if (settling || composing || pendingWrites) return;
    settling = (async (): Promise<boolean> => {
      let command: SceneCommand;
      try { command = draft.command(); } catch (error) { actions.status(friendlyError(error, invalidDraft), "error"); focusFirst(draft.panel); return false; }
      const saved = await mutate(command, () => dropDraft(key), expectedRevisions(model), draft.panel, draft);
      if (saved) focusColumn(focusId); else if (draft.panel.isConnected) focusFirst(draft.panel);
      return saved;
    })().finally(() => { settling = undefined; });
  };
  // Cancel ends the draft as an edit Undo reverses, and returns focus to what started it.
  const cancelCondition = (key: string, focus: string): void => {
    if (pendingWrites || settling) return;
    cancelStep(key); dropDraft(key); redrawEditor(); editorHost?.querySelector<HTMLElement>(focus)?.focus();
  };
  const draftActions = (key: string, commitLabel: string, commit: () => void, focusOnCancel: string): HTMLElement => {
    const row = document.createElement("div"); row.className = "row-actions";
    row.append(button("Cancel", "text-button", () => cancelCondition(key, focusOnCancel)), button(commitLabel, "button primary", commit)); return row;
  };
  const branchSelector = (id: string): string => `.story-branch-editor[data-branch-id="${id}"]`;
  // A branch's test. Otherwise has none.
  const renderConditionBranch = (card: HTMLElement, scene: SceneDocument, beat: SceneBeat): void => {
    const branch = beat.conditionalBranch!, groupId = branch.groupId, word = branch.ordinal ? "Else if" : "If";
    const source = (): void => { if (draftGuard()) actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision); };
    if (branch.otherwise) { const note = document.createElement("p"); note.className = "story-field-hint"; note.textContent = "Runs when no test above is true."; card.append(note); return; }
    const kept = beatDrafts.get(beat.id);
    if (kept) { card.append(kept.panel); return; }
    const builder = testBuilder(word, branch.condition, { ...actions.viewSource ? { source } : {}, ...branch.condition ? { caption: conditionCaption(branch.condition, model.authoring.variables) } : {} });
    if (!builder.editable) { card.append(builder.host); return; }
    // The test commits while the branch's accepted test is unchanged; otherwise it conflicts.
    const accepted = JSON.stringify(branch.condition ?? null);
    const write = (current: SceneDocument, condition: Condition): SceneCommand => ({ type: "updateConditionBranch", sceneId: scene.id, expectedSourceRevision: current.sourceRevision, groupId, branchId: beat.id, expectedBody: beatBody(groupHeader(current, groupId)), condition });
    const command = (): SceneCommand => {
      const { current, node } = branchNow(scene.id, beat.id);
      if (current?.sourceConflict) throw new Error(unreadable);
      if (!current || !node?.conditionalBranch || JSON.stringify(node.conditionalBranch.condition ?? null) !== accepted) throw new Error("Conflict with source. Draft retained.");
      return write(current, builder.read()!);
    };
    const conflict = (): DraftConflict | undefined => {
      const { current, node } = branchNow(scene.id, beat.id);
      if (current?.sourceConflict) return undefined;
      if (!current || !node?.conditionalBranch) return { missing: "This branch is no longer in source." };
      if (JSON.stringify(node.conditionalBranch.condition ?? null) === accepted) return undefined;
      // Override writes this test against the source the comparison shows.
      return { source: node.conditionalBranch.condition ? conditionCaption(node.conditionalBranch.condition, model.authoring.variables) : "No test", override: () => {
        if (settling || pendingWrites || composing) return;
        let condition: Condition; try { condition = builder.read()!; } catch (error) { actions.status(friendlyError(error, invalidDraft), "error"); focusFirst(panel); return; }
        settling = mutate(write(current, condition), () => dropDraft(beat.id), expectedRevisions(model), panel, draft, staleOverride).finally(() => { settling = undefined; });
      } };
    };
    const panel = conditionPanel("story-branch-test", `${word} test`);
    panel.append(builder.host, draftActions(beat.id, "Commit test", () => void commitCondition(draft, beat.id, beat.id), `${branchSelector(beat.id)} .story-branch-test summary`));
    dirtyDraft(panel, []); card.append(panel);
    const draft = keepDraft(beat.id, { panel, sceneId: scene.id, beatId: beat.id, command, kind: () => "condition", conflict, editors: () => [builderEditor(panel, builder)], primary: () => builder.host });
  };
  // A new Else if or Otherwise for a condition, as a draft until it is added. One of each
  // waits per condition; adding again returns to it.
  const newBranch = (scene: SceneDocument, header: SceneBeat, otherwise: boolean): void => {
    const groupId = header.conditionalBranch!.groupId, key = conditionKey.newBranch(groupId, otherwise), word = otherwise ? "Otherwise" : "Else if";
    const waiting = beatDrafts.get(key); if (waiting) { focusFirst(waiting.panel); return; }
    if (!draftGuard()) return;
    const panel = conditionPanel("story-branch-editor story-branch-new", `New ${word}`);
    const head = document.createElement("div"); head.className = "story-branch-head";
    head.append(Object.assign(document.createElement("strong"), { textContent: word }), Object.assign(document.createElement("span"), { className: "story-branch-new-mark", textContent: "New" }));
    panel.append(head);
    const builder = otherwise ? undefined : testBuilder("Else if", undefined);
    // Where an Else if goes among the branches: before a later branch, or after the last Else if.
    const branches = scene.beats.filter(beat => beat.conditionalBranch?.groupId === groupId);
    const positions = branches.slice(1).map(branch => ({ value: branch.id, label: `Before ${branchCaption(branch.conditionalBranch!, model)}` }));
    if (!branches.some(branch => branch.conditionalBranch!.otherwise)) positions.push({ value: "end", label: "After the last Else if" });
    const position = selectOf(positions, branches.find(branch => branch.conditionalBranch!.otherwise)?.id ?? "end"); position.setAttribute("aria-label", "Branch position");
    if (builder) panel.append(builder.host, labelled("Goes", position));
    else panel.append(Object.assign(document.createElement("p"), { className: "story-field-hint", textContent: "Runs when no test above is true. Otherwise goes last." }));
    const conflict = (): DraftConflict | undefined => {
      const { current, node } = branchNow(scene.id, header.id);
      if (current?.sourceConflict) return undefined;
      if (!current || !node) return { missing: "This condition is no longer in source." };
      if (otherwise && current.beats.some(beat => beat.conditionalBranch?.groupId === groupId && beat.conditionalBranch.otherwise)) return { missing: "This condition already has an Otherwise." };
      if (!otherwise && position.value !== "end" && !current.beats.some(beat => beat.id === position.value)) return { missing: "This branch's place is no longer in source." };
      return undefined;
    };
    const command = (): SceneCommand => {
      const { current } = branchNow(scene.id, header.id);
      if (current?.sourceConflict) throw new Error(unreadable);
      const lost = conflict(); if (lost && "missing" in lost) throw new Error(`${lost.missing} Draft retained.`);
      return { type: "addConditionBranch", sceneId: scene.id, expectedSourceRevision: current!.sourceRevision, groupId, expectedBody: beatBody(groupHeader(current!, groupId)), beforeBranchId: otherwise || position.value === "end" ? null : position.value, condition: builder?.read() ?? null };
    };
    panel.append(draftActions(key, otherwise ? "Add Otherwise" : "Add Else If", () => void commitCondition(draft, key, header.id), otherwise ? ".story-add-otherwise" : ".story-add-branch"));
    dirtyDraft(panel, [position]); panel.dataset.unsubmitted = "true";
    // `beatId` is the If header: the condition's column and heading show the draft.
    const draft = keepDraft(key, { panel, sceneId: scene.id, beatId: header.id, command, kind: () => otherwise ? "otherwise" : "else if", conflict,
      editors: () => [builderEditor(panel, builder)], primary: () => builder?.host ?? panel, detach: () => { panel.remove(); redrawEditor(); } });
    // A new branch is a draft from the moment it is added, so adding it is its first step.
    draft.state = captureDraft(draft); startStep(draft, "new", undefined, draft.state);
    redrawEditor(); focusFirst(panel);
  };
  // "Remove this Else if" marks an Else if or Otherwise for removal. Commit or Story Save
  // removes it after the other drafts, so edits inside it land first and Undo brings them
  // back. Its own unsaved test is cancelled, as an edit Undo reverses.
  const markBranchRemoval = (scene: SceneDocument, header: SceneBeat): void => {
    const branch = header.conditionalBranch!, groupId = branch.groupId, key = conditionKey.removal(header.id), name = branchCaption(branch, model);
    const waiting = beatDrafts.get(key); if (waiting) { focusFirst(waiting.panel); return; }
    if (!draftGuard()) return;
    const test = beatDrafts.get(header.id); if (test && isPending(test)) { cancelStep(header.id); dropDraft(header.id); }
    const panel = conditionPanel("story-branch-removal", `Remove ${name}`);
    const copy = document.createElement("p"); copy.className = "story-warn";
    copy.textContent = `Removes ${name} and the beats inside it when you commit or save. Other branches remain.`;
    discardNote(copy, scene, header.id, "Drafts inside it are saved first, so Undo brings them back.");
    const conflict = (): DraftConflict | undefined => { const { current, node } = branchNow(scene.id, header.id); if (current?.sourceConflict) return undefined; return node?.conditionalBranch ? undefined : { missing: "This branch is no longer in source." }; };
    const command = (): SceneCommand => {
      const { current, node } = branchNow(scene.id, header.id);
      if (current?.sourceConflict) throw new Error(unreadable);
      if (!current || !node?.conditionalBranch) throw new Error("This branch is no longer in source. Draft retained.");
      return { type: "removeConditionBranch", sceneId: scene.id, expectedSourceRevision: current.sourceRevision, groupId, branchId: header.id, expectedBody: beatBody(groupHeader(current, groupId)) };
    };
    // Commit saves the drafts inside the branch first, with the removal, as Story Save does.
    const commit = (): void => {
      const { current } = branchNow(scene.id, header.id), inside = current ? pendingDrafts(scene.id).filter(item => item !== draft && draftsWithin(current, header.id, [item])) : [];
      if (inside.length) void saveDrafts([...inside, draft]); else void commitCondition(draft, key, groupHeader(scene, groupId).id);
    };
    panel.append(copy, draftActions(key, "Remove branch", commit, `${branchSelector(header.id)} .story-remove-branch`));
    dirtyDraft(panel, []); panel.dataset.unsubmitted = "true";
    const draft = keepDraft(key, { panel, sceneId: scene.id, beatId: header.id, command, kind: () => "branch removal", conflict, last: true,
      editors: () => [builderEditor(panel)], primary: () => copy, detach: () => { panel.remove(); redrawEditor(); } });
    draft.state = captureDraft(draft); startStep(draft, "new", undefined, draft.state);
    redrawEditor(); focusFirst(panel);
  };
  // The Move to tree: the scene, its branches and options in source order, each with its
  // "Before …" and "End of …" positions from core's places. `moved` is a node being moved:
  // it never goes into its own branches, and its own place is left out.
  const placeTree = (scene: SceneDocument, own: BodyRef, moved?: SceneBeat): { tree: PlaceNode; expanded: string[] } => {
    const inner = moved ? innerBodies(scene, moved) : new Set<string>(), siblings = nodeBeats(scene, own), next = moved && siblings[siblings.indexOf(moved) + 1];
    const stays = (body: BodyRef, position: Position): boolean => !!moved && sameBody(body, own) && (next ? position.type === "before" && sameNode(position.anchor, nodeRef(next)) : position.type === "end");
    const build = (body: BodyRef, depth: number): PlaceNode => {
      const id = body.type === "root" ? "root" : body.branchId, children: PlaceNode[] = [];
      const places = (moved ? movePlaces(scene, moved, body) : bodyOf(scene, body)?.places ?? []).filter(place => !stays(body, place.position));
      const position = (place: Position): void => { if (places.some(item => samePosition(item.position, place))) children.push({ id: `${id}:${children.length}`, label: positionLabel(scene, body, place), place: { body, position: place } }); };
      for (const node of nodeBeats(scene, body)) {
        position({ type: "before", anchor: nodeRef(node) });
        if (node === moved || depth > 32) continue;
        for (const child of ownedBodies(scene, node)) if (child.type === "branch" && !inner.has(child.branchId)) children.push(build(child, depth + 1));
      }
      position({ type: "end" });
      return { id, label: placeName(scene, body), path: pathCaption(scene, body), children };
    };
    // It opens on the beat's own place: the scene, then each branch or option around it.
    const expanded = ["root"]; for (let at: BodyRef | undefined = own, steps = 0; at?.type === "branch" && steps <= 32; steps++) { expanded.splice(1, 0, at.branchId); at = bodyOf(scene, at)?.parent; }
    return { tree: build({ type: "root" }, 0), expanded };
  };
  const findPlace = (node: PlaceNode, match: (node: PlaceNode) => boolean): PlaceNode | undefined => match(node) ? node : node.children?.map(child => findPlace(child, match)).find(Boolean);
  // Move to (story-combined-editor / replace-v2), chosen at the first place after the beat in its own scene, branch or option.
  const moveNodeForm = (scene: SceneDocument, beat: SceneBeat, opener?: HTMLElement): void => {
    if (!draftGuard()) return;
    const own = beatBody(beat), siblings = nodeBeats(scene, own), { tree, expanded } = placeTree(scene, own, beat);
    const positions = findPlace(tree, node => node.id === expanded.at(-1))?.children?.filter(child => child.place && sameBody(child.place.body, own)) ?? [];
    const after = positions.find(child => { const place = child.place!.position; return place.type === "end" || siblings.findIndex(item => sameNode(nodeRef(item), place.anchor)) > siblings.indexOf(beat); }) ?? positions.at(-1);
    const number = numbers.get(beat.id) ?? "";
    openPlaceTree({
      host, opener: opener ?? null, title: `Move ${number} ${beat.conditionalBranch ? "Condition" : nodeName(beat)}`, tree, expanded, ...after ? { chosen: after.id } : {},
      note: beat.conditionalBranch ? "Moves the entire condition and every branch together." : "Moves this beat to the chosen scene, branch or option.",
      move: place => mutate({ type: "moveStoryNode", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, node: nodeRef(beat), expectedBody: own, ...place }, () => { selectedBeatId = beat.id; openTo(model.scenes.find(item => item.id === scene.id) ?? scene, place.body); }).then(saved => { if (saved) focusColumn(beat.id); return saved; }),
    });
  };
  // Story moves only nodes it can edit, never Custom Code, branch headers or read-only Choices.
  const nodeEditable = (beat: SceneBeat): boolean => !readOnlyLogic(beat) && !beat.structuralPlaceholder && (!beat.protected || !!beat.conditionalBranch && !beat.conditionalBranch.ordinal && !beat.conditionalBranch.otherwise);
  const movable = (scene: SceneDocument, beat: SceneBeat, direction: "up" | "down"): boolean => nodeEditable(beat) && !scene.sourceConflict && !!siblingPlace(scene, beat, direction);
  const moveSibling = (scene: SceneDocument, beat: SceneBeat, direction: "up" | "down"): void => {
    if (!movable(scene, beat, direction) || !draftGuard()) return;
    const position = siblingPlace(scene, beat, direction); if (!position) return;
    void mutate({ type: "moveStoryNode", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, node: nodeRef(beat), expectedBody: beatBody(beat), body: beatBody(beat), position }, () => { selectedBeatId = beat.id; }).then(saved => { if (saved) focusColumn(beat.id); });
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
    const copy = document.createElement("p"); const show = (): void => { copy.textContent = `Keep only ${branches.find(item => item.id === branch.value)?.conditionalBranch ? branchCaption(branches.find(item => item.id === branch.value)!.conditionalBranch!, model) : "the selected branch"} in ${pathCaption(scene, beatBody(header))}. Remove the condition and all other branches; their beats are not combined.`; }; branch.addEventListener("change", show); show();
    const note = document.createElement("p"); discardNote(note, scene, groupId, "Unsaved beat drafts in branches you do not keep are discarded.");
    operation(scene, target, "Unwrap one branch", [labelled("Branch to keep", branch), copy, ...(note.textContent ? [note] : [])], () => ({ type: "unwrapCondition", groupId, branchId: required(branch), expectedBody: beatBody(header) }), "Unwrap selected branch");
  };

  // A beat's name in the editor and on the stage: its kind, or its branch for a header.
  const beatName = (beat: SceneBeat): string => beat.conditionalBranch ? beat.conditionalBranch.choiceOption ? "Option" : "Condition" : beatLabels[beat.payload.type];
  const forkCaption = (beat: SceneBeat): string => beat.conditionalBranch ? branchTest(beat.conditionalBranch, model) : "Unknown condition";
  // A branch or option as Tracks and the Branch path name it.
  const branchName = (scene: SceneDocument, header: SceneBeat): string => {
    const branch = header.conditionalBranch; if (!branch) return beatName(header);
    if (branch.choiceOption) { const menu = bodyOf(scene, { type: "branch", groupId: branch.groupId, branchId: header.id })?.owningNode, choice = scene.beats.find(item => item.id === menu)?.payload; const option = choice?.type === "choice" ? choice.options.find(item => item.id === header.id) : undefined; return `Option ${(branch.ordinal ?? 0) + 1} "${option?.text.trim() ?? ""}"`; }
    return branch.otherwise ? "Otherwise" : `${branch.ordinal ? "Else if" : "If"} ${forkCaption(header)}`;
  };
  // An end marker's name: a quoted If or Else if test, option 2 "Leave", or Otherwise.
  const endName = (scene: SceneDocument, header: SceneBeat): string => {
    const branch = header.conditionalBranch; if (!branch) return beatName(header);
    if (branch.choiceOption) { const name = branchName(scene, header); return name.charAt(0).toLowerCase() + name.slice(1); }
    return branch.otherwise ? "Otherwise" : `"${branch.ordinal ? "Else if" : "If"} ${shorten(forkCaption(header))}"`;
  };
  // An editor path: the scene, then each branch or option around the body. Never "body".
  const pathCaption = (scene: SceneDocument, body: BodyRef): string => {
    const parts: string[] = [];
    for (let at: BodyRef | undefined = body, steps = 0; at?.type === "branch" && steps <= 32; steps++) {
      const header = scene.beats.find(beat => beat.id === (at as { branchId: string }).branchId), branch = header?.conditionalBranch;
      parts.unshift(!header || !branch ? "Missing branch" : branch.choiceOption ? branchName(scene, header) : branch.otherwise ? "Otherwise" : `${branch.ordinal ? "Else if" : "If"} ${shorten(forkCaption(header))}`);
      at = bodyOf(scene, at)?.parent;
    }
    return [scene.displayName, ...parts].join(" › ");
  };
  const focusColumn = (id: string | undefined): void => {
    if (id === undefined) return;
    const column = [...host.querySelectorAll<HTMLElement>(".story-route [data-beat-id]")].find(item => item.dataset.beatId === id);
    const control = column?.querySelector<HTMLElement>(":scope > .story-track-beat, :scope > .story-slot-name");
    control?.focus({ preventScroll: true }); if (column) revealColumn(column);
  };
  // Keeps a Tracks or Reel column in view, beside the sticky lane labels in Tracks, without scrolling the page.
  const revealColumn = (column: HTMLElement): void => {
    const scroll = column.closest<HTMLElement>(".story-tracks-scroll"); if (!scroll) return;
    if (writingFocus) {
      // Rows: below the sticky lane labels, without scrolling the page.
      const box = scroll.getBoundingClientRect(), row = column.getBoundingClientRect();
      const top = box.top + (scroll.querySelector<HTMLElement>(".story-track-labels")?.offsetHeight ?? 0), bottom = box.top + scroll.clientHeight;
      if (row.top < top) scroll.scrollTop -= top - row.top; else if (row.bottom > bottom) scroll.scrollTop += Math.min(row.bottom - bottom, row.top - top);
      return;
    }
    const labels = scroll.querySelector<HTMLElement>(".story-track-labels")?.offsetWidth ?? 0;
    const left = column.offsetLeft - labels, right = column.offsetLeft + column.offsetWidth - scroll.clientWidth;
    if (scroll.scrollLeft > left) scroll.scrollLeft = left; else if (scroll.scrollLeft < right) scroll.scrollLeft = right;
  };
  // Navigation: selection, branch switches and views keep drafts and add no history entry.
  // An open form with input refuses it; a form without input closes.
  const navigate = (change: () => void): boolean => {
    if (!draftGuard()) return false;
    openOperation = undefined; change(); draw(); return true;
  };
  const select = (scene: SceneDocument, id: string): void => { if (navigate(() => selectBeat(scene, id))) focusColumn(id); };
  const toggleBranch = (scene: SceneDocument, owner: SceneBeat, body: BodyRef): void => {
    if (body.type !== "branch") return;
    const done = navigate(() => {
      if (openBranches.get(body.groupId) === body.branchId) { openBranches.delete(body.groupId); selectBeat(scene, owner.id); return; }
      openBranches.set(body.groupId, body.branchId);
      selectBeat(scene, nodeBeats(scene, body)[0]?.id ?? body.branchId);
    });
    if (done) [...host.querySelectorAll<HTMLElement>(".story-branch-segment")].find(item => item.dataset.branchId === body.branchId)?.focus();
  };

  // Entering or leaving Writing focus moves no content: the editor, its drafts, focus and
  // caret stay, and only the bottom panel redraws for its rows. Nothing reaches core.
  const focusToggleName = (on: boolean): string => on ? "Show game window" : "Writing focus";
  const setWritingFocus = (scene: SceneDocument, on: boolean, toggle: HTMLButtonElement): void => {
    writingFocus = on; host.dataset.writingFocus = String(on);
    host.closest<HTMLElement>(".project-shell")?.setAttribute("data-writing-focus", String(on));
    toggle.textContent = focusToggleName(on);
    const inPanel = !!bottomHost?.contains(document.activeElement);
    drawBottom(scene, { left: 0, top: 0 });
    if (inPanel) focusColumn(selectedNewDraft ?? selectedBeatId);
  };
  const drawStory = (scene: SceneDocument, scroll?: ScrollPosition): void => {
    const header = document.createElement("header"); header.className = "scene-header";
    const title = document.createElement("h1"); title.title = `${scene.technicalLabel} · ${scene.sourcePath}`;
    // Story Combined v1: the scene title ("Arrival ▾") opens and closes the scene list.
    const list = actions.sceneList;
    if (list) {
      const toggle = button(scene.displayName, "story-scene-toggle"); toggle.setAttribute("aria-controls", list.panelId); toggle.ariaExpanded = String(list.open());
      toggle.addEventListener("click", () => list.toggle()); title.append(toggle);
    } else title.textContent = scene.displayName;
    const history = document.createElement("div"); history.className = "scene-history";
    const mapped = scene.beats.find((beat) => beat.id === selectedBeatId) ?? scene.beats[0];
    const focus = button(focusToggleName(writingFocus)); focus.dataset.writingFocusToggle = "";
    // A mouse press would move focus out of the editor; Writing focus keeps it and the caret.
    focus.addEventListener("mousedown", event => event.preventDefault());
    focus.addEventListener("click", () => setWritingFocus(scene, !writingFocus, focus));
    if (actions.caller && actions.viewScene) { const caller = button("Back to caller"); caller.addEventListener("click", () => { if (draftGuard()) actions.viewScene?.(actions.caller!); }); history.append(caller); }
    const add = button("+ Add beat", "button primary"); add.dataset.beatOpener = "root"; add.disabled = scene.sourceConflict;
    add.addEventListener("click", () => openNewBeat(scene));
    // Story Combined v1 keeps three scene controls; the rest sit under More.
    const viewSource = button("View in Source"); viewSource.disabled = actions.viewSource === undefined; viewSource.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, mapped?.byteStart, mapped?.byteEnd, scene.sourceRevision));
    const more: HTMLButtonElement[] = [viewSource];
    if (actions.screenCatalog && actions.resolveScreenTarget) {
      const screenBeat = button("Add screen Beat"); screenBeat.dataset.beatOpener = "screen"; screenBeat.disabled = scene.sourceConflict;
      screenBeat.addEventListener("click", () => openNewBeat(scene,actions.screenHintKind === "dialog" ? "callScreen" : "showScreen",null,"screen"));
      if (actions.screenHint) screenBeat.title = `Use ${actions.screenHint.sourceName.replaceAll("_"," ")} in this Scene`;
      more.push(screenBeat);
    }
    const addCondition = button("Add Condition"); addCondition.disabled = scene.sourceConflict;
    addCondition.addEventListener("click", () => openNewBeat(scene, "condition")); more.push(addCondition);
    if (actions.assist) more.push(...assistActions(scene));
    history.append(focus, add, moreMenu(more));
    header.append(title, history); host.append(header);
    if (scene.sourceConflict) {
      const conflict = document.createElement("section"); conflict.className = "state-banner error-state"; conflict.role = "alert";
      const heading = document.createElement("h2"); heading.textContent = "Source projection unavailable";
      const copy = document.createElement("p"); copy.textContent = "The current Source is invalid, missing, or unreconciled. The previous visual projection is stale; Scene writes and history remain blocked until the exact source revision is reconciled.";
      conflict.append(heading, copy); host.append(conflict);
    } else if (scene.partial) {
      const partial = document.createElement("p"); partial.className = "state-banner partial-state"; partial.textContent = "Preview and reference certainty are partial because this Scene contains protected Custom Code."; host.append(partial);
    }
    // Story Combined v1: the stage beside the selected-beat editor, the Branch path and Tracks below.
    const combined = document.createElement("div"); combined.className = "story-combined";
    const top = document.createElement("div"); top.className = "story-top";
    const stage = document.createElement("section"); stage.className = "story-stage"; stage.setAttribute("aria-label", "Game window");
    const editor = document.createElement("section"); editor.className = "story-editor"; editor.setAttribute("aria-label", "Selected beat editor");
    const bottom = document.createElement("div"); bottom.className = "story-bottom";
    // Writing focus resizes the sidebar from its left edge. As in combined-v1, the sidebar
    // stays at least 320 px and leaves Tracks or Reel at least 480 px.
    const side = resizeGrip({ key: "focus-side", label: "Sidebar width", host, widths: focusWidths, measure: () => editor.getBoundingClientRect().width, min: 320, max: () => combined.getBoundingClientRect().width - 480, grow: -1 });
    side.classList.add("story-side-grip");
    top.append(stage, editor, side); combined.append(top, bottom); host.append(combined);
    editorHost = editor; bottomHost = bottom;
    previewTarget = { stage, sceneId: scene.id }; renderStage(stage, scene);
    drawBottom(scene, scroll);
    drawEditor(scene);
  };
  // The scene toolbar's More menu. Choosing an item closes it.
  const moreMenu = (items: readonly HTMLButtonElement[]): HTMLElement => {
    const menu = document.createElement("details"); menu.className = "story-more";
    const summary = document.createElement("summary"); summary.className = "button secondary"; summary.textContent = "More";
    const tools = document.createElement("div"); tools.className = "story-more-list"; tools.append(...items);
    tools.addEventListener("click", event => { if ((event.target as Element).closest("button")) menu.open = false; });
    menu.append(summary, tools);
    return menu;
  };
  const assistActions = (scene: SceneDocument): HTMLButtonElement[] => {
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
    return [assist,edits,continuation,card,lore];
  };
  // Switching between Tracks and Reel redraws only the bottom panel: the editor, its
  // drafts and focus, the selection, open branches and new beats stay as they are.
  const showView = (scene: SceneDocument, view: RouteView): void => {
    if (view !== routeView) { routeView = view; drawBottom(scene); }
    bottomHost?.querySelector<HTMLElement>(`.story-view-option[data-view="${view}"]`)?.focus({ preventScroll: true });
  };
  // The Branch path and Tracks or Reel. Redrawn alone when a new beat's place or kind changes.
  const drawBottom = (scene: SceneDocument, scroll?: ScrollPosition): void => {
    if (!bottomHost) return;
    const before = scroll ?? scrollOf(bottomHost.querySelector<HTMLElement>(".story-tracks-scroll"));
    stopLaneWatch?.(); stopLaneWatch = undefined;
    const pending: PendingBeat[] = [...beatDrafts.entries()].flatMap(([key, draft]) => !draft.beatId && draft.sceneId === scene.id && draft.place ? [{ key, ...draft.place(), label: draft.kind() }] : []);
    const items = trackRoute(scene, openBranches, pending);
    const selected = selectedNewDraft ?? selectedBeatId;
    const path = renderBranchPath({ scene, items, numbers, open: openBranches, caption: forkCaption, branchName: header => branchName(scene, header), select: id => select(scene, id), toggle: (owner, body) => toggleBranch(scene, owner, body) });
    const panel = document.createElement("section"); panel.className = "story-panel"; panel.setAttribute("aria-label", viewName(routeView));
    const toolbar = document.createElement("div"); toolbar.className = "story-panel-toolbar";
    // Writing focus has no Key, as in Story Combined v1.
    toolbar.append(renderViewSwitch(routeView, view => showView(scene, view)), ...routeView === "tracks" && !writingFocus ? [renderTracksKey()] : [], renderMarksLegend());
    const scroller = document.createElement("div"); scroller.className = "story-tracks-scroll";
    const accepted = (beat: SceneBeat): { background: boolean; characters: boolean; music: boolean; unknown: boolean } => {
      const state = deriveScenePreview(scene, beat.id, scene.beats.some(item => item.conditionalBranch) ? openBranches : undefined);
      return { background: !!state.background, characters: state.characters.length > 0, music: !!state.music, unknown: state.partial };
    };
    scroller.append(renderRoute({ view: routeView, focus: writingFocus, scene, items, numbers, selected, locked: scene.sourceConflict, label: beatName,
      summary: beat => beat.conditionalBranch ? branchName(scene, beat) : beatSummary(beat.payload, model), branchName: header => branchName(scene, header), endName: header => endName(scene, header),
      sceneName: id => model.scenes.find(item => item.id === id)?.displayName ?? "an unavailable scene", state: accepted,
      select: id => select(scene, id), selectNew: key => { if (navigate(() => { selectedBeatId = undefined; selectedNewDraft = key; })) beatDrafts.get(key)?.editors()[0]?.focus(); },
      insert: (body, position, opener) => addBeat(scene, body, position, opener), move: (beat, direction) => moveSibling(scene, beat, direction) }));
    // The beat columns scroll sideways with the wheel; Writing focus rows scroll as usual.
    scroller.addEventListener("wheel", event => { if (!writingFocus && Math.abs(event.deltaY) > Math.abs(event.deltaX) && scroller.scrollWidth > scroller.clientWidth) { scroller.scrollLeft += event.deltaY; event.preventDefault(); } }, { passive: false });
    panel.append(toolbar, scroller);
    bottomHost.replaceChildren(path, panel);
    scroller.scrollLeft = before.left; scroller.scrollTop = before.top;
    if (!writingFocus) pinRouteLabels(scroller);
    else if (routeView === "tracks") { laneGrips(scroller, host, focusWidths); stopLaneWatch = watchHiddenLanes(scroller, toolbar); }
    const column = [...scroller.querySelectorAll<HTMLElement>("[data-beat-id], [data-new-beat]")].find(item => (item.dataset.beatId ?? item.dataset.newBeat) === selected);
    if (column) revealColumn(column);
    markDrafts();
  };
  // The editor beside the stage: the open operation, the selected new beat, the selected
  // beat, branch or option, or what to do in an empty selection.
  const drawEditor = (scene: SceneDocument): void => {
    const editor = editorHost; if (!editor) return;
    // A redraw closes a picker sheet, and with it the picture it previewed.
    if (sheetPreview) sheetPreview = undefined;
    editor.replaceChildren(); delete editor.dataset.editorFor; delete editor.dataset.sheet; effectsHost = undefined;
    editor.append(...lostDrafts(scene));
    if (openOperation) { editor.append(openOperation); return; }
    const fresh = selectedNewDraft ? beatDrafts.get(selectedNewDraft) : undefined;
    if (fresh) { editor.dataset.editorFor = selectedNewDraft; editor.append(fresh.panel); return; }
    const beat = scene.beats.find(item => item.id === selectedBeatId);
    if (beat) {
      editor.dataset.editorFor = beat.id;
      const branch = beat.conditionalBranch;
      if (branch?.choiceOption) renderOptionEditor(editor, scene, beat);
      else if (branch) renderConditionEditor(editor, scene, beat);
      else {
        const heading = beatHeading(scene, beat); editor.append(heading); renderExistingBeat(editor, scene, beat);
        // A scene-level dialogue line adds the next line from its heading, as Shift+Cmd/Ctrl+Enter does.
        const draft = beatDrafts.get(beat.id);
        if (draft?.nextLine) { const next = button("+ Next line", "button secondary story-next-line"); next.title = "Commit this line and add the next one (Shift+Cmd/Ctrl+Enter)"; next.addEventListener("click", draft.nextLine); next.disabled = scene.sourceConflict; heading.querySelector(".story-editor-state")?.after(next); }
        // Repeat this Choice is changed from its option's Then.
        const owner = beat.payload.type === "repeatChoice" ? bodyOwner(scene, beatBody(beat)) : undefined;
        if (owner?.payload.type === "choice") { const go = button(`Select Choice ${numbers.get(owner.id) ?? ""}`, "button secondary"); go.addEventListener("click", () => select(scene, owner.id)); editor.querySelector(".expanded-beat")?.append(go); }
      }
    } else {
      const empty = document.createElement("div"); empty.className = "story-editor-empty";
      const heading = document.createElement("h2"); heading.textContent = nodeBeats(scene, { type: "root" }).some(item => item.payload.type !== "return") ? "No beat selected" : "No lines yet";
      const copy = document.createElement("p"); copy.textContent = "Select a beat in Tracks or Reel to edit it. Add one with + there or with + Add beat.";
      empty.append(heading, copy); editor.append(empty);
    }
    const effects = document.createElement("section"); effects.className = "story-effects"; effects.setAttribute("aria-label", "In effect");
    editor.append(effects); effectsHost = effects; renderEffects(effects, scene);
  };
  // A node as Move to and Add a beat name it: "Mara's line", "Condition", "Narration".
  const nodeName = (beat: SceneBeat): string => {
    const payload = beat.payload;
    if (!beat.conditionalBranch && payload.type === "dialogue") return `${model.authoring.characters.find(character => character.id === payload.characterId)?.displayName ?? "Unknown Character"}'s line`;
    return beatName(beat);
  };
  // A scene, branch or option by its own name: "Arrival", "If trust ≥ 5", "Option 2 "Leave"".
  const placeName = (scene: SceneDocument, body: BodyRef): string => {
    if (body.type === "root") return scene.displayName;
    const header = scene.beats.find(beat => beat.id === body.branchId);
    return header ? branchName(scene, header) : "a branch that is no longer in source";
  };
  // The number of the beat the story reaches after a node, climbing out of its branches.
  const continuationAfter = (scene: SceneDocument, beat: SceneBeat): string | undefined => {
    const shown = beatNumbers(scene);
    let node: SceneBeat | undefined = beat;
    for (let steps = 0; node && steps <= 32; steps++) {
      const nodes = bodyOf(scene, beatBody(node))?.nodes ?? [], index = nodes.findIndex(item => item.beatId === node!.id), next = nodes[index + 1];
      if (next) return shown.get(next.beatId);
      node = bodyOwner(scene, beatBody(node));
    }
    return undefined;
  };
  // What the Choice editor reads from the scene and does to other beats. A new Choice has no
  // beat yet: its options start empty and it continues where it will be added.
  const choiceHost = (scene: SceneDocument, beat?: SceneBeat): ChoiceHost => {
    const current = (): SceneDocument | undefined => model.scenes.find(item => item.id === scene.id);
    const optionBody = (optionId: string): BodyRef | undefined => { const header = current()?.beats.find(item => item.id === optionId); return header?.conditionalBranch ? { type: "branch", groupId: header.conditionalBranch.groupId, branchId: header.id } : undefined; };
    return {
      structure: () => { const shown = current(), node = beat && shown?.beats.find(item => item.id === beat.id); return shown && (node || !beat) ? { scene: shown, numbers: beatNumbers(shown), locked: shown.sourceConflict || !!node?.protected } : undefined; },
      beatName: item => nodeName(item),
      beatSummary: item => item.conditionalBranch ? branchName(current() ?? scene, item) : beatSummary(item.payload, model),
      sceneName: id => model.scenes.find(item => item.id === id)?.displayName ?? "an unavailable scene",
      continuation: () => { const shown = current(), node = beat && shown?.beats.find(item => item.id === beat.id); return shown && node ? continuationAfter(shown, node) : undefined; },
      select: id => { const shown = current(); if (shown) select(shown, id); },
      openOption: optionId => {
        const shown = current(), body = optionBody(optionId); if (!shown || body?.type !== "branch") return;
        if (navigate(() => { openBranches.set(body.groupId, body.branchId); selectBeat(shown, nodeBeats(shown, body)[0]?.id ?? optionId); })) focusColumn(selectedBeatId);
      },
      addBeat: optionId => { const shown = current(), body = optionBody(optionId); if (shown && body) addBeat(shown, body, defaultPlace(shown, body), `option:${optionId}`); },
      setEnding: (optionId, ending) => setOptionEnding(scene.id, optionId, ending),
      newScene: (optionId, opener) => { if (beat) newSceneFor(scene, beat, optionId, opener); },
      viewSource: item => { const shown = current() ?? scene; actions.viewSource?.(shown.sourcePath, item.byteStart, item.byteEnd, shown.sourceRevision); },
      openScene: sceneId => { if (sceneId === selectedSceneId) return; void settle().then(ok => { if (ok && !disposed) { selectScene(sceneId); draw(); } else if (!ok) actions.status("Complete or cancel this edit before changing scenes.", "error"); }); },
      markStage: markStageOption,
    };
  };
  // "+ New scene…" in an option's scene sheet: the author names the scene and its chapter,
  // then core creates it and sends the option there, in one edit with one Undo. The author
  // stays in this scene (`story-revamp` / `combined`).
  const newSceneFor = (scene: SceneDocument, choice: SceneBeat, optionId: string, opener: HTMLElement): void => {
    if (!draftGuard() || choice.payload.type !== "choice") return;
    const index = choice.payload.options.findIndex(option => option.id === optionId), option = choice.payload.options[index], header = scene.beats.find(item => item.id === optionId);
    if (!option || !header?.conditionalBranch) return;
    const ending = bodyOf(scene, { type: "branch", groupId: header.conditionalBranch.groupId, branchId: optionId })?.ending;
    const last = ending?.type === "ends" ? scene.beats.find(item => item.id === ending.beatId)?.payload : undefined;
    const replaced = last?.type === "jump" ? model.scenes.find(item => item.id === last.sceneId)?.displayName : undefined;
    const name = input(); name.setAttribute("aria-label", "Scene name"); name.placeholder = "For example: Platform at dawn";
    const chapter = entitySelect(model.chapters.map(item => ({ id: item.id, label: item.displayName })), scene.chapterId); chapter.setAttribute("aria-label", "Chapter");
    const context = document.createElement("p"); context.className = "story-dialog-note";
    context.textContent = `Option ${index + 1} "${option.text}" will lead here.${replaced ? ` It currently goes to ${replaced}. The new scene replaces that destination; ${replaced} is kept.` : ""} You stay in this scene.`;
    void openFormDialog({
      host, opener, title: `New scene for option ${index + 1}`, className: "story-new-scene",
      fields: [context, labelled("Scene name", name), labelled("Chapter", chapter)], submitLabel: `Create scene and link option ${index + 1}`, first: name,
      submit: async () => {
        if (!name.value.trim()) throw new FieldError("Enter a scene name.", name);
        const current = model.scenes.find(item => item.id === scene.id);
        if (!current || current.sourceConflict) throw new Error("This scene cannot be changed now. Input retained.");
        const saved = await mutate({ type: "createSceneFromChoice", sceneId: scene.id, expectedSourceRevision: current.sourceRevision, choiceBeatId: choice.id, optionId, chapterId: chapter.value, displayName: name.value.trim() });
        if (!saved) throw new Error("The scene was not created. Input retained.");
        return true;
      },
    }).then(created => { if (created) editorHost?.querySelector<HTMLElement>(`.story-option[data-option-id="${optionId}"] .story-destination-pick`)?.focus(); });
  };
  // Then: an option's ending is its last beat. Continue removes an explicit ending; the
  // others add one at the option's end or change the one there. Each is one edit.
  const setOptionEnding = (sceneId: string, optionId: string, ending: Ending): void => {
    if (!draftGuard()) return;
    const scene = model.scenes.find(item => item.id === sceneId), header = scene?.beats.find(item => item.id === optionId);
    if (!scene || !header?.conditionalBranch) return;
    const body: BodyRef = { type: "branch", groupId: header.conditionalBranch.groupId, branchId: header.id }, info = bodyOf(scene, body);
    const endedBy = info?.ending.type === "ends" ? scene.beats.find(item => item.id === (info.ending as { beatId: string }).beatId) : undefined;
    const explicit = endedBy && endingBeat(endedBy) ? endedBy : undefined;
    let command: SceneCommand;
    if (ending.type === "continue") { if (!explicit) return; command = { type: "removeStoryNode", node: nodeRef(explicit), expectedBody: body }; }
    else {
      const payload: BeatPayload = ending.type === "jump" ? { type: "jump", sceneId: ending.sceneId } : ending.type === "repeatChoice" ? { type: "repeatChoice", target: explicit?.payload.type === "repeatChoice" ? explicit.payload.target : null } : { type: "return" };
      const end = info?.places.find(place => place.fitsEnding && place.position.type === "end")?.position ?? { type: "end" };
      command = explicit ? { type: "updateBodyBeat", beatId: explicit.id, expectedBody: body, beat: payload } : { type: "insertBodyBeat", body, position: end, beat: payload };
    }
    void mutate({ sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, ...command }).then(saved => {
      if (saved) editorHost?.querySelector<HTMLElement>(`.story-option[data-option-id="${optionId}"] .story-outcome > summary, .story-option[data-option-id="${optionId}"] .story-then-add`)?.focus();
    });
  };
  // A node's number and kind, with its move and delete actions in a menu.
  const beatHeading = (scene: SceneDocument, beat: SceneBeat): HTMLElement => {
    const heading = document.createElement("div"); heading.className = "story-editor-heading";
    const number = numbers.get(beat.id) ?? "";
    const title = document.createElement("strong"); title.className = "story-editor-title"; title.textContent = `${number} · ${beatName(beat)}`;
    // The beat's draft mark: "* Draft", "! Conflict" or, after a refused Save, "! Needs changes".
    const state = document.createElement("span"); state.className = "story-editor-state"; state.dataset.beatId = beat.id;
    // A Choice the editor shows read-only says so beside its title (story-combined-editor / replace-v2).
    const locked = readOnlyLogic(beat) ? Object.assign(document.createElement("span"), { className: "story-editor-protected", textContent: "Protected" }) : undefined;
    const editable = nodeEditable(beat);
    const menu = document.createElement("details"); menu.className = "story-beat-menu";
    const summary = document.createElement("summary"); summary.textContent = "⋯"; summary.ariaLabel = `Actions for ${number}`;
    const list = document.createElement("div"); list.className = "story-beat-menu-list";
    const up = button("Move up", "text-button"); up.ariaLabel = `Move beat ${number} up`; up.disabled = !movable(scene, beat, "up");
    up.addEventListener("click", () => moveSibling(scene, beat, "up"));
    const down = button("Move down", "text-button"); down.ariaLabel = `Move beat ${number} down`; down.disabled = !movable(scene, beat, "down");
    down.addEventListener("click", () => moveSibling(scene, beat, "down"));
    const move = button("Move to…", "text-button"); move.disabled = !editable || scene.sourceConflict; move.addEventListener("click", () => { menu.open = false; moveNodeForm(scene, beat, summary); });
    list.append(up, down, move);
    if (!beat.conditionalBranch) { const remove = button("Delete", "text-button story-menu-delete"); remove.ariaLabel = `Delete beat ${number}`; remove.disabled = !editable || beat.payload.type === "return" && !beat.owner || scene.sourceConflict; remove.addEventListener("click", () => removeNodeForm(scene, beat)); list.append(remove); }
    menu.append(summary, list); heading.append(storyIcon(beat.conditionalBranch ? "condition" : beat.payload.type), title, ...locked ? [locked] : [], state, menu);
    return heading;
  };
  // A condition: its group actions, then each branch with its test and its own actions,
  // then any new Else if or Otherwise waiting to be added. The branch open in the Branch
  // path is marked; Open switches it there.
  const renderConditionEditor = (editor: HTMLElement, scene: SceneDocument, selected: SceneBeat): void => {
    const groupId = selected.conditionalBranch!.groupId, node = groupHeader(scene, groupId);
    editor.append(beatHeading(scene, node));
    const caption = document.createElement("p"); caption.className = "story-condition-summary";
    caption.textContent = `Condition · ${node.conditionalBranch?.condition ? conditionCaption(node.conditionalBranch.condition, model.authoring.variables) : "Unknown condition"} · ${scene.beats.filter(item => item.conditionalBranch?.groupId === groupId).length} branches / ${groupCount(scene, node)} Beats`;
    const note = document.createElement("p"); note.className = "story-field-hint"; note.textContent = "The first branch whose test is true runs. Tests are not evaluated in the preview.";
    const tools = document.createElement("div"); tools.className = "row-actions story-editor-tools";
    const otherwise = button("Add Otherwise", "button secondary story-add-otherwise"); otherwise.disabled = scene.sourceConflict || scene.beats.some(item => item.conditionalBranch?.groupId === groupId && item.conditionalBranch.otherwise); otherwise.addEventListener("click", () => newBranch(scene, node, true));
    const unwrap = button("Unwrap…"); unwrap.disabled = scene.sourceConflict; unwrap.addEventListener("click", () => unwrapForm(scene, node));
    const remove = button("Delete condition"); remove.disabled = scene.sourceConflict; remove.addEventListener("click", () => removeNodeForm(scene, node));
    tools.append(otherwise, unwrap, remove); editor.append(caption, note, tools);
    for (const header of scene.beats.filter(item => item.conditionalBranch?.groupId === groupId)) {
      const branch = header.conditionalBranch!, body: BodyRef = { type: "branch", groupId, branchId: header.id };
      const section = document.createElement("section"); section.className = "story-branch-editor"; section.dataset.branchId = header.id;
      section.dataset.arm = String(armOf(scene, body)); section.dataset.shown = String(openBranches.get(groupId) === header.id || selected === header);
      const head = document.createElement("div"); head.className = "story-branch-head";
      const name = document.createElement("strong"); name.textContent = branch.otherwise ? "Otherwise" : branch.ordinal ? "Else if" : "If";
      const open = button("Open", "button secondary"); open.setAttribute("aria-pressed", String(openBranches.get(groupId) === header.id)); open.setAttribute("aria-label", `${openBranches.get(groupId) === header.id ? "Close" : "Open"} ${branchName(scene, header)} in Tracks`);
      open.addEventListener("click", () => toggleBranch(scene, node, body));
      const add = button("+ Beat", "button secondary"); add.dataset.beatOpener = `branch:${header.id}`; add.setAttribute("aria-label", add.title = `Add a beat to ${branchName(scene, header)}`);
      add.disabled = scene.sourceConflict || branch.condition?.status === "unknown";
      add.addEventListener("click", () => addBeat(scene, body, defaultPlace(scene, body), `branch:${header.id}`));
      head.append(name, open, add);
      if (branch.ordinal || branch.otherwise) {
        const drop = iconButton("close", `Remove this ${name.textContent}`, () => markBranchRemoval(scene, header), "story-icon-button story-remove-branch"); drop.disabled = scene.sourceConflict;
        head.append(drop);
      }
      // The branch's draft mark: its test, or its removal.
      const state = document.createElement("span"); state.className = "story-editor-state"; state.dataset.draftKeys = `${header.id} ${conditionKey.removal(header.id)}`; name.after(state);
      section.append(head);
      const removal = beatDrafts.get(conditionKey.removal(header.id));
      if (removal) section.append(removal.panel); else renderConditionBranch(section, scene, header);
      editor.append(section);
    }
    for (const otherwise of [false, true]) { const waiting = beatDrafts.get(conditionKey.newBranch(groupId, otherwise)); if (waiting) editor.append(waiting.panel); }
    const elseif = button("+ Add Else if", "button secondary story-add-branch"); elseif.disabled = scene.sourceConflict; elseif.addEventListener("click", () => newBranch(scene, node, false));
    editor.append(elseif);
  };
  // An option: its place, a way back to its Choice, and its first beats. Then, Only when and
  // its text are edited in the Choice editor.
  const renderOptionEditor = (editor: HTMLElement, scene: SceneDocument, beat: SceneBeat): void => {
    const branch = beat.conditionalBranch!;
    const body: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }, info = bodyOf(scene, body);
    const menu = scene.beats.find(item => item.id === info?.owningNode), index = branch.ordinal ?? 0;
    const section = document.createElement("section"); section.className = "story-option-editor"; section.dataset.optionId = beat.id; section.dataset.arm = String(armOf(scene, body));
    const heading = document.createElement("div"); heading.className = "story-editor-heading";
    const title = document.createElement("strong"); title.className = "story-editor-title"; title.textContent = `${numbers.get(beat.id) ?? ""} · Option ${index + 1}`;
    heading.append(storyIcon("choice"), title);
    const context = document.createElement("p"); context.className = "story-breadcrumb"; context.textContent = pathCaption(scene, body);
    const owner = button(`Edit Choice ${numbers.get(menu?.id ?? "") ?? ""}`, "button secondary"); owner.disabled = !menu;
    owner.addEventListener("click", () => { if (!menu) return; select(scene, menu.id); editorHost?.querySelectorAll<HTMLInputElement>('input[aria-label="Choice option text"]')[index]?.focus(); });
    section.append(heading, context, owner);
    const beats = nodeBeats(scene, body);
    if (!beats.length) {
      const empty = document.createElement("div"); empty.className = "story-editor-empty";
      const name = document.createElement("h2"); name.textContent = `${placeName(scene, body)} has no beats yet.`;
      const copy = document.createElement("p"); copy.textContent = "Write a line or add a background in this option.";
      const start = document.createElement("div"); start.className = "row-actions story-editor-tools";
      for (const [label, kind] of [["Write dialogue", "dialogue"], ["Write narration", "narration"], ["Add background", "background"]] as const) {
        const write = button(label, kind === "dialogue" ? "button primary" : "button secondary"); write.dataset.beatOpener = `first:${beat.id}`; write.disabled = scene.sourceConflict;
        write.addEventListener("click", () => insertAt(scene, body, defaultPlace(scene, body), `first:${beat.id}`, kind)); start.append(write);
      }
      empty.append(name, copy, start); section.append(empty);
    } else {
      const add = button("+ Beat", "button secondary"); add.dataset.beatOpener = `branch:${beat.id}`; add.setAttribute("aria-label", add.title = `Add a beat to ${placeName(scene, body)}`); add.disabled = scene.sourceConflict;
      add.addEventListener("click", () => addBeat(scene, body, defaultPlace(scene, body), `branch:${beat.id}`)); section.append(add);
    }
    editor.append(section);
  };

  const renderExistingBeat = (card: HTMLElement, scene: SceneDocument, beat: SceneBeat): void => {
    const number = numbers.get(beat.id) ?? "";
    if (readOnlyLogic(beat)) {
      // A Choice with an unsupported condition stays as written (story-combined-editor / replace-v2).
      const panel = document.createElement("div"); panel.className = "expanded-beat protected-code story-protected-choice";
      const explanation = document.createElement("p");
      explanation.textContent = "This Choice contains an unsupported condition. Edit it in Source to preserve the expression. Availability is unknown in the editor preview.";
      panel.append(explanation);
      if (beat.payload.type === "choice") {
        const options = document.createElement("ul");
        beat.payload.options.forEach((option, index) => {
          const header = scene.beats.find(item => item.id === option.id), groupId = header?.conditionalBranch?.groupId;
          const ending = groupId === undefined ? undefined : bodyOf(scene, { type: "branch", groupId, branchId: header!.id })?.ending;
          const code = ending?.type === "ends" && scene.beats.find(item => item.id === ending.beatId)?.payload.type === "customCode";
          const item = document.createElement("li"), name = document.createElement("strong"), goes = document.createElement("span"), available = document.createElement("span");
          name.textContent = option.text;
          goes.textContent = `→ Option ${index + 1}'s beats${code ? " · Ends with Custom Code" : ending?.type === "ends" ? "" : ", then continues after the Choice"}`;
          available.textContent = option.condition ? `Available when ${conditionCaption(option.condition, model.authoring.variables)} · Availability unknown` : "Always available";
          item.append(name, goes, available); options.append(item);
        });
        panel.append(options);
      }
      const source = button("Edit in Source", "button secondary"); source.disabled = !actions.viewSource;
      source.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision)); panel.append(source); card.append(panel); return;
    }
    if (beat.protected) {
      const protectedPanel = document.createElement("div"); protectedPanel.className = "protected-code";
      const explanation = document.createElement("p"); explanation.textContent = beat.sourceFallback ?? (beat.payload.type === "customCode" ? beat.payload.reason : "Protected source");
      const source = document.createElement("pre"); source.textContent = beat.payload.type === "customCode" ? beat.payload.source : "";
      protectedPanel.append(explanation, source);
      // The Custom Code beat that may leave its option, at any depth, carries the unknown ending.
      if (scene.bodies.some(item => item.kind === "option" && unknownCause(scene, item.body) === beat)) {
        const note = document.createElement("p"); note.className = "story-warn"; note.textContent = "Ending unknown: Custom Code can leave this option"; protectedPanel.append(note);
      }
      const open = button("Edit in Source", "button secondary"); open.disabled = !actions.viewSource;
      open.addEventListener("click", () => actions.viewSource?.(scene.sourcePath, beat.byteStart, beat.byteEnd, scene.sourceRevision));
      protectedPanel.append(open); card.append(protectedPanel); return;
    }
    const kept = beatDrafts.get(beat.id);
    // A kept draft keeps its fields; what it shows from the scene, such as a Choice's option beats, redraws.
    if (kept) { card.append(kept.panel); for (const editor of kept.editors()) editor.refresh?.(); return; }
    // A draft commits against current revisions while its beat's accepted payload is unchanged.
    // Otherwise it conflicts: only Discard draft or Override source resolves it.
    const accepted = JSON.stringify(beat.payload);
    // The beat in the shown model, and the revisions a write of it expects.
    const located = () => {
      const current = model.scenes.find(item => item.id === scene.id), node = current?.beats.find(item => item.id === beat.id);
      return { current, node, basis: current && node ? { scene: current, expectedBody: beatBody(node), captured: expectedRevisions(model) } : undefined };
    };
    const base = (): { scene: SceneDocument; expectedBody: BodyRef; captured: ExpectedRevisions } => {
      const { current, node, basis } = located();
      if (current?.sourceConflict) throw new Error(unreadable);
      if (!basis || JSON.stringify(node!.payload) !== accepted) throw new Error("Conflict with source. Draft retained.");
      return basis;
    };
    const conflict = (): DraftConflict | undefined => {
      const { current, node, basis } = located();
      if (current?.sourceConflict) return undefined;
      if (!node || !basis) return { missing: "This beat is no longer in source." };
      if (node.protected || node.conditionalBranch || node.structuralPlaceholder || readOnlyLogic(node)) return { missing: "Story can no longer edit this beat. Edit it in Source." };
      if (JSON.stringify(node.payload) === accepted) return undefined;
      // Override writes against exactly the source this comparison shows.
      const reviewed = basis;
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
        return mutate(updateCommand(payload, reviewed), () => dropDraft(beat.id), reviewed.captured, panel, draft, staleOverride);
      })().finally(() => { settling = undefined; });
    };
    const updateCommand = (payload: BeatPayload, current = base()): SceneCommand => ({ type: "updateBodyBeat", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, beatId: beat.id, expectedBody: current.expectedBody, beat: payload });
    const context = editorContext(beat.id, true, assignmentValidation(() => base(), value => updateCommand(value)));
    const editor = beat.payload.type === "choice" ? buildChoiceEditor(beat.payload, context, choiceHost(scene, beat)) : buildBeatEditor(beat.payload, context);
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
    const parent = document.createElement("p"); parent.className = "story-breadcrumb"; parent.textContent = pathCaption(scene, beatBody(beat)); panel.prepend(parent);
    if (beat.payload.type === "call") {
      const called = model.scenes.find(item => beat.payload.type === "call" && item.id === beat.payload.sceneId);
      const open = button("Open called Scene"); open.disabled = !actions.viewScene || !called || called.sourceConflict;
      open.addEventListener("click", () => { if (called && draftGuard()) actions.viewScene?.({ sceneId: called.id, expectedSourceRevision: called.sourceRevision, caller: { sceneId: scene.id, beatId: beat.id, expectedSourceRevision: scene.sourceRevision, caller: actions.caller } }); });
      const continuation = button("View Call continuation"); continuation.disabled = !actions.viewContinuation; continuation.addEventListener("click", () => { if (draftGuard()) actions.viewContinuation?.(scene.id, beat.id, scene.sourceRevision); }); panel.append(open, continuation);
    }
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; });
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => { cancelStep(beat.id); dropDraft(beat.id); draw(); focusColumn(beat.id); });
    if (beat.payload.type === "showScreen" || beat.payload.type === "hideScreen" || beat.payload.type === "callScreen") panel.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.isComposing || composing) return;
      event.preventDefault(); event.stopPropagation(); if (!pendingWrites && !settling && !conflicted()) { cancelStep(beat.id); dropDraft(beat.id); draw(); focusColumn(beat.id); }
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
          await mutate(updateCommand(payload, current), () => { saved=true;dropDraft(beat.id); }, current.captured, panel, draft);
        }
      } catch (error) {
        actions.status(friendlyError(error, `Beat ${number} is invalid`), "error");
        editor.focus();
      }
      if(!saved&&panel.isConnected){restoreControls();editor.focus();}
      // The next line opens for writing; a committed beat stays selected in Tracks.
      if (saved && continueDialogue) editorHost?.querySelector<HTMLElement>("textarea")?.focus(); else if (saved) focusColumn(selectedBeatId);
      return saved;
    };
    editor.primary.addEventListener("compositionstart",()=>{composing=true;});editor.primary.addEventListener("compositionend",()=>{composing=false;});
    commit.addEventListener("click", () => { if(!settling) { settling=save(false).finally(()=>{settling=undefined;}); } });
    // While the comparison shows, only Discard draft or Override source resolves the draft.
    const conflicted = (): boolean => { if (panel.dataset.conflict !== "true") return false; actions.status("Choose Discard draft or Override source. Draft retained."); panel.querySelector<HTMLElement>(".story-resolution button")?.focus(); return true; };
    if (beat.payload.type === "setVariable") panel.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.defaultPrevented) { event.preventDefault(); if (!event.isComposing && !settling && !pendingWrites && !conflicted()) settling = save(false).finally(() => { settling = undefined; }); }
      else if (event.key === "Escape" && !event.defaultPrevented && !event.isComposing) { event.preventDefault(); if (!pendingWrites && !settling && !conflicted()) { actions.status("Use Cancel to discard this draft, or keep editing."); cancel.focus(); } }
    });
    // Cmd/Ctrl+Enter commits a line; Shift adds the next line after a scene-level dialogue line.
    if (beat.payload.type === "dialogue" || beat.payload.type === "narration") editor.primary.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); if(!event.isComposing&&!settling&&!conflicted())settling=save(event.shiftKey).finally(()=>{settling=undefined;}); }
    });
    const screenBeat=["showScreen","hideScreen","callScreen"].includes(beat.payload.type);
    if(screenBeat){panel.classList.add("story-screen-editor");cancel.className="button secondary";}
    actionsRow.append(...(screenBeat?[commit,cancel]:[cancel,commit]));
    // A Return, Stop music or Repeat this Choice has nothing to edit, so it has no Commit or Cancel.
    actionsRow.hidden = !editor.controls.length && beat.payload.type !== "choice";
    const secondary=panel.querySelector("details.story-screen-secondary");panel.append(actionsRow);if(secondary)panel.append(secondary);
    dirtyDraft(panel, editor.controls); card.append(panel);
    const draft = keepDraft(beat.id, { panel, sceneId: scene.id, beatId: beat.id, read: editor.read, command: () => updateCommand(editor.read()), kind: () => beatLabels[beat.payload.type].toLowerCase(), editors: () => [editor], conflict, primary: () => editor.primary,
      ...(beat.payload.type === "dialogue" && !beat.owner ? { nextLine: () => { if (!settling && !conflicted()) settling = save(true).finally(() => { settling = undefined; }); } } : {}) });
  };

  const assignmentValidation = (base: () => { scene: SceneDocument; captured: ExpectedRevisions }, command: (beat: BeatPayload) => SceneCommand): ValidateAssignment => async beat => {
    if (!actions.validateAssignment || disposed || actions.current?.() === false) throw Error("Story session is unavailable.");
    const { scene, captured: expected } = base();
    const result = await actions.validateAssignment(command(beat), expected);
    if (disposed || actions.current?.() === false || result.projectRevision !== expected.projectRevision || result.sourceMapRevision !== expected.sourceMapRevision || result.authoringRevision !== expected.authoringRevision || result.sourceRevision !== scene.sourceRevision) throw Error("Story revision changed. Review the current source before committing.");
    return result;
  };

  // What every beat editor needs from Story: thumbnails, the stage preview of a picture
  // the author points at in a picker sheet, and #96's backend checks.
  const editorContext = (key: string, existing: boolean, validate: ValidateAssignment): EditorContext => ({
    model, existing, actions: liveActions, validate, newVariable,
    thumbnail: (assetId, image, errorHost) => void loadImage(assetId, "thumbnail", image, errorHost, false),
    preview: payload => { sheetPreview = payload ? { key, payload } : undefined; refreshPreview(); },
  });

  // A new condition's fields: its If test, starting with one rule, and Include Otherwise.
  const newConditionEditor = (): { editor: DraftEditor & Pick<BeatEditor, "host" | "controls" | "primary" | "secondary">; read: () => { condition: Condition; otherwise: boolean } } => {
    const builder = testBuilder("If", undefined);
    const otherwise = document.createElement("input"); otherwise.type = "checkbox"; otherwise.setAttribute("aria-label", "Include Otherwise");
    const host = document.createElement("div"); host.className = "beat-fields story-new-condition"; host.append(builder.host, labelled("Include Otherwise", otherwise));
    const primary = (): HTMLElement => host.querySelector<HTMLElement>("summary, input, button") ?? host;
    return {
      editor: { host, controls: [otherwise], get primary() { return primary(); }, ...builderEditor(host, builder) },
      read: () => ({ condition: builder.read()!, otherwise: otherwise.checked }),
    };
  };
  // Builds a new beat draft of one kind and returns its key. Story shows it in the editor
  // and as a pending column in Tracks. A new beat that `replaces` an ending saves as an
  // update of that ending beat.
  const renderNewBeat = (scene: SceneDocument, type: AddKind, body: BodyRef = { type: "root" }, position: Position = defaultPlace(scene, body), insertion?: ScreenInsertion, opener = "root", returnTo?: string, replaces?: string): string => {
    // One pending new beat per insertion place: adding there again returns to it.
    const existing = pendingAt(scene, body, position);
    if (existing) return existing;
    const key = `new:${++newBeatDrafts}`;
    const base = (): { scene: SceneDocument; captured: ExpectedRevisions } => {
      const current = model.scenes.find(item => item.id === scene.id);
      if (!current) throw new Error("This Scene is no longer available. Draft retained.");
      if (current.sourceConflict) throw new Error(unreadable);
      return { scene: current, captured: expectedRevisions(model) };
    };
    const insertCommand = (payload: BeatPayload, location: { body: BodyRef; position: Position }, current = base()): SceneCommand => replaces
      ? { type: "updateBodyBeat", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, beatId: replaces, expectedBody: location.body, beat: payload }
      : { type: "insertBodyBeat", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, ...location, beat: payload };
    // Story Save: a new beat finds its body and anchor by id; if source dropped either, the draft conflicts.
    // Core repeats this check on its candidate (BEAT_DRAFT_CONFLICT); this one lets Story refuse before sending.
    const placeChanged = (current: SceneDocument, location: { body: BodyRef; position: Position }): boolean => {
      const { body, position } = location, kept = body.type === "root" || !!bodyOf(current, body);
      const ending = bodyOf(current, body)?.ending;
      return !kept || (position.type === "before" && !nodeBeats(current, body).some(node => sameNode(nodeRef(node), position.anchor))) || (!!replaces && !(ending?.type === "ends" && ending.beatId === replaces));
    };
    // A new condition adds its If test and, if chosen, an Otherwise; a new beat adds its payload.
    const commandAt = (location: { body: BodyRef; position: Position }, current = base()): SceneCommand => condition
      ? { type: "insertCondition", sceneId: scene.id, expectedSourceRevision: current.scene.sourceRevision, ...location, ...condition.read() }
      : insertCommand(beatEditor!.read(), location, current);
    const savedCommand = (): SceneCommand => {
      const location = chosenLocation(), current = base();
      if (placeChanged(current.scene, location)) throw new Error(`This ${condition ? "condition" : "beat"}'s place changed in source after the draft began. Draft retained.`);
      return commandAt(location, current);
    };
    const openingInsertion = structuredClone(insertion ?? screenInsertion ?? {sceneId:scene.id,body,position,expectedSourceRevision:scene.sourceRevision});
    let rememberedInsertion = false;
    const panel = document.createElement("section"); panel.className = "new-beat scene-draft"; panel.dataset.beatType = type;
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; }); panel.setAttribute("aria-labelledby", `new-beat-title-${key}`);
    const heading = document.createElement("div"); heading.className = "story-editor-heading";
    const title = document.createElement("h3"); title.className = "story-editor-title"; title.id = `new-beat-title-${key}`; title.textContent = `New · ${addKindName(type)}`;
    heading.append(storyIcon(type), title);
    const screenType = ["showScreen", "hideScreen", "callScreen"].includes(type);
    // Until it is added, Move to changes only where the new beat will go. A screen beat picks its place below.
    if (!screenType) {
      const menu = document.createElement("details"); menu.className = "story-beat-menu";
      const summary = document.createElement("summary"); summary.textContent = "⋯"; summary.setAttribute("aria-label", "Actions for the new beat");
      const list = document.createElement("div"); list.className = "story-beat-menu-list";
      const move = button("Move to…", "text-button"); move.addEventListener("click", () => { menu.open = false; moveNewBeat(summary); });
      list.append(move); menu.append(summary, list); heading.append(menu);
    }
    // Goes at, In and After, as Add a beat named them.
    const where = document.createElement("dl"); where.className = "story-where story-new-place";
    const drawWhere = (): void => {
      const current = model.scenes.find(item => item.id === scene.id) ?? scene, place = placement(current, body, position, type);
      where.replaceChildren();
      for (const [term, value] of [["Goes at", place.goesAt], ["In", place.in], ...place.after ? [["After", place.after]] : []] as const) where.append(Object.assign(document.createElement("dt"), { textContent: term }), Object.assign(document.createElement("dd"), { textContent: value }));
    };
    // A screen beat keeps the place it chose in Screens, so it can pick another one here.
    const placementHost = screenType ? destinations(scene,body,position,insertion) : undefined;
    const unavailableScene = !!insertion && insertion.sceneId !== scene.id;
    const usesPlacement = (): boolean => screenType && !!placementHost;
    const chosenLocation = (): { body: BodyRef; position: Position } => usesPlacement() ? placementHost!.read() : unavailableScene ? { body: { type: "root" }, position: defaultPlace(scene, { type: "root" }) } : { body, position };
    // The pending column in Tracks follows the chosen place, with its branches open.
    const relocate=()=>{const current=model.scenes.find(item=>item.id===scene.id);if(current)openTo(current,place().body);redrawBottom();};
    const remember=()=>{if(screenType&&placementHost)try{rememberScreenInsertion({sceneId:scene.id,...placementHost.read(),expectedSourceRevision:scene.sourceRevision});rememberedInsertion=true;return true;}catch{/* Retain the unavailable original position until an explicit choice. */}return false;};
    if (placementHost) {
      // Placement owns its retained navigation state and any incomplete recovery input.
      placementHost.host.classList.add("scene-draft");
      for(const event of ["input","change"])placementHost.host.addEventListener(event,()=>{if(remember())delete placementHost.host.dataset.unsubmitted;else placementHost.host.dataset.unsubmitted="true";relocate();});
      remember();
    }
    const validateNew = assignmentValidation(base, beat => insertCommand(beat, chosenLocation()));
    // A new condition: its If test and whether it has an Otherwise. It has no beat payload.
    const condition = type === "condition" ? newConditionEditor() : undefined;
    const context = editorContext(key, false, validateNew);
    const beatEditor = condition ? undefined : (payload => payload.type === "choice" ? buildChoiceEditor(payload, context, choiceHost(scene)) : buildBeatEditor(payload, context))(defaultPayload(type as BeatPayload["type"], model, actions.screenHint));
    const editor = condition?.editor ?? beatEditor!;
    const secondaryHost = document.createElement("div"); secondaryHost.className = "story-screen-secondary"; if (editor.secondary) secondaryHost.append(editor.secondary);
    if (screenType) panel.classList.add("story-screen-editor");
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", screenType ? "button secondary" : "text-button");
    const cancelDraft=()=>{cancelStep(key);if(rememberedInsertion)rememberScreenInsertion(openingInsertion);panel.remove();dropDraft(key);if(selectedNewDraft===key){selectedNewDraft=undefined;selectedBeatId=returnTo;}draw();focusBeatOpener(opener);};cancel.addEventListener("click",cancelDraft);
    let pending=false;
    panel.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.isComposing || composing || !screenType || event.defaultPrevented) return;
      event.preventDefault(); event.stopPropagation(); if (!pending) cancelDraft();
    });
    const commit = button(condition ? "Add Condition" : "Add Beat", "button primary"); commit.addEventListener("click", async () => {
      if(pending || composing)return;
      try {
        const location=chosenLocation();
        const current=base();
        const command=commandAt(location,current);
        pending=true;panel.dataset.unsubmitted="true";
        const controls=[...panel.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement>("input,select,textarea,button")];
        const locks = controls.map(control => ({ control, disabled: control.disabled }));
        controls.forEach(control=>control.disabled=true);
        let insertedId:string|undefined;
        const saved=await mutate(command, (before,next) => {
          panel.remove();dropDraft(key);if(selectedNewDraft===key)selectedNewDraft=undefined;
          const acceptedScene=next.scenes.find(s=>s.id===scene.id);if(screenType&&acceptedScene)rememberScreenInsertion({sceneId:scene.id,...location,expectedSourceRevision:acceptedScene.sourceRevision});
          const previousIds=new Set(before.scenes.find(s=>s.id===scene.id)?.beats.map(b=>b.id));
          // A replaced ending keeps its beat id.
          insertedId=replaces??next.scenes.find(s=>s.id===scene.id)?.beats.find(b=>!previousIds.has(b.id))?.id;
          // The added beat stays selected, so its editor replaces the draft.
          if(insertedId&&!selectedNewDraft)selectedBeatId=insertedId;
        }, current.captured, panel, draft);
        if(saved&&insertedId)focusColumn(insertedId);
        if(!saved&&panel.isConnected){locks.forEach(({control,disabled})=>{control.disabled=disabled;});editor.focus();}
      } catch (error) {
        actions.status(friendlyError(error, "Beat is invalid"), "error"); editor.focus();
      }finally{pending=false;}
    });
    panel.addEventListener("keydown", event => {
      if (type === "setVariable" && (event.ctrlKey || event.metaKey) && event.key === "Enter" && !event.defaultPrevented && !event.isComposing) { event.preventDefault(); if (!pending && !composing) commit.click(); }
    });
    actionsRow.append(...(screenType?[commit,cancel]:[cancel,commit]));
    drawWhere();
    panel.append(heading, ...placementHost ? [placementHost.host] : [where], editor.host, actionsRow, secondaryHost);
    dirtyDraft(panel, editor.controls);
    // A new beat moves with the place the author chooses, until it is added.
    const place=():{body:BodyRef;position:Position}=>{try{return chosenLocation();}catch{return {body,position};}};
    const moveNewBeat = (opener: HTMLElement): void => {
      const current = model.scenes.find(item => item.id === scene.id); if (!current) return;
      const { tree, expanded } = placeTree(current, body), chosen = findPlace(tree, node => !!node.place && sameBody(node.place.body, body) && samePosition(node.place.position, position));
      openPlaceTree({ host, opener, title: `Move new ${addKindName(type).toLowerCase()}`, note: "Moves this beat to the chosen scene, branch or option. Nothing is written until you add it.", tree, expanded, ...chosen ? { chosen: chosen.id } : {},
        move: async next => {
          const resolved = placeFor(current, next.body, next.position, type), waiting = pendingAt(current, next.body, resolved.position);
          if (resolved.unavailable) { actions.status(`${resolved.unavailable} Draft retained.`, "error"); return false; }
          if (waiting && waiting !== key) { actions.status("A new beat is already waiting there. Draft retained.", "error"); return false; }
          body = next.body; position = resolved.position; replaces = resolved.replaces?.id;
          drawWhere(); relocate(); focusFirst(panel); return true;
        } });
    };
    const draft=keepDraft(key,{panel,sceneId:scene.id,place,replaces:()=>replaces,...beatEditor?{read:beatEditor.read}:{},command:savedCommand,kind:()=>{try{return beatEditor?beatLabels[beatEditor.read().type].toLowerCase():"condition";}catch{return addKindName(type).toLowerCase();}},editors:()=>[editor],primary:()=>editor.primary,
      // A new beat whose scene or branch left source has nowhere to go: only Discard draft resolves it.
      conflict:()=>{
        const current=model.scenes.find(item=>item.id===scene.id),{body:at}=place();
        if(!current)return {missing:"This beat's scene is no longer in source."};
        if(current.sourceConflict||at.type==="root"||current.beats.some(item=>item.id===at.branchId))return undefined;
        return {missing:"This beat's place is no longer in source."};
      },
      detach:()=>{panel.remove();if(selectedNewDraft===key){selectedNewDraft=undefined;if(editorHost?.isConnected){const current=storyScene(model,selectedSceneId);if(current)drawEditor(current);}}}});
    // A new beat is a draft from the moment it is added, so adding it is its first step.
    draft.state=captureDraft(draft);startStep(draft,"new",undefined,draft.state);
    return key;
  };

  { const scene = storyScene(model, selectedSceneId); if (scene && initialBeatId) selectBeat(scene, initialBeatId); }
  draw();
  return {
    host, treeHost,
    update: (next, nextActions, beatId) => {
      if (disposed) return;
      actions = nextActions; model = next;
      screenInsertion = actions.screenInsertion ? structuredClone(actions.screenInsertion) : screenInsertion;
      const sceneId = storyScene(next, actions.sceneId ?? selectedSceneId)?.id;
      // A new target selects its beat; returning to Story keeps the selection.
      if (sceneId !== selectedSceneId || beatId !== undefined) { selectedNewDraft = undefined; openOperation = undefined; }
      selectedSceneId = sceneId;
      const scene = storyScene(next, sceneId);
      if (scene && beatId !== undefined) selectBeat(scene, beatId); else if (beatId !== undefined) selectedBeatId = beatId;
      draw();
      host.closest<HTMLElement>(".project-shell")?.setAttribute("data-writing-focus", String(writingFocus));
    },
    hasDrafts: sceneId => pendingDrafts(sceneId).length > 0,
    draftCount: () => pendingDrafts().length,
    hasOpenForm: hasDraft,
    firstDraft: () => { const draft = pendingDrafts()[0]; return draft && { sceneId: draft.sceneId, ...(draft.beatId ? { beatId: draft.beatId } : {}) }; },
    busy: () => pendingWrites > 0 || settling !== undefined,
    settle,
    save: () => saveDrafts(),
    saveStatus,
    flushSteps: async () => { closeText(); await recording; },
    applyStep,
    ownsDraftField: target => target instanceof HTMLElement && [...beatDrafts.values()].some(draft => draft.panel.contains(target)),
    dispose: () => {
      disposed = true; closeText(); beatDrafts.clear(); steps.clear(); stopLaneWatch?.();
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
// A scene whose source Story cannot map has no beats to compare with. Its drafts are not
// conflicts: they wait, and Commit and Story Save refuse them until Story can read it.
const unreadable = "Story cannot read this scene's source right now. Draft retained.";
// Core refused an Override because the project changed after the comparison showed.
const staleOverride = "Source changed. Review it, then choose again. Draft retained.";

/** A beat draft's controls and its editors' own state, kept for draft-step Undo (ADR 0025). */
interface DraftState { readonly controls: readonly { readonly tag: string; readonly type: string; readonly value: string; readonly checked: boolean }[]; readonly editors: readonly (readonly [EditorInternals, unknown])[] }
const draftControls = (panel: HTMLElement): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] =>
  [...panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")];
/** What draft steps need from an editor: focus, state its controls do not show, and redraw. */
type DraftEditor = Pick<BeatEditor, "focus" | "internals" | "refresh">;
function captureState(panel: HTMLElement, editors: readonly DraftEditor[]): DraftState {
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

function required(control: HTMLSelectElement): string { if (!control.value || control.options[control.selectedIndex]?.dataset.unavailable === "true") { control.focus(); throw new Error("Select an available item first."); } return control.value; }

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
