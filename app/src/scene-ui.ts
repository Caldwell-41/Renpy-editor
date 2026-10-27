import { layoutFor, saveLayout } from "./preferences.ts";
import { buildAvailabilityEditor, buildConditionEditor } from "./story-condition-editor.ts";
import { validateField } from "./authoring-input.ts";
export type PlacementRef = "left" | "centre" | "right";
export type TransitionRef = "none" | "dissolve" | "fade";

export type ConditionExpression =
  | { readonly type: "bool"; readonly value: boolean }
  | { readonly type: "int" | "string"; readonly value: string }
  | { readonly type: "variable"; readonly variableId: string; readonly variableType: "bool" | "int" | "string" }
  | { readonly type: "compare"; readonly operator: "equal" | "notEqual" | "less" | "lessEqual" | "greater" | "greaterEqual"; readonly left: ConditionExpression; readonly right: ConditionExpression }
  | { readonly type: "not"; readonly operand: ConditionExpression }
  | { readonly type: "and" | "or"; readonly left: ConditionExpression; readonly right: ConditionExpression };
export type Condition =
  | { readonly status: "supported"; readonly expression: ConditionExpression }
  | { readonly status: "unknown"; readonly source: string; readonly diagnostic: "unsupportedSyntax" | "limitExceeded" | "missingVariable" | "typeMismatch" | "invalidValue" };

export interface ChoiceOption {
  readonly text: string;
  readonly destinationSceneId: string;
  readonly condition?: Condition;
}

export type BeatPayload =
  | { readonly type: "background"; readonly assetId: string; readonly transition: TransitionRef }
  | { readonly type: "showCharacter"; readonly characterId: string; readonly appearanceId: string; readonly placement: PlacementRef; readonly transition: TransitionRef }
  | { readonly type: "hideCharacter"; readonly characterId: string; readonly transition: TransitionRef }
  | { readonly type: "changeAppearance"; readonly characterId: string; readonly appearanceId: string; readonly transition: TransitionRef }
  | { readonly type: "placement"; readonly characterId: string; readonly placement: PlacementRef }
  | { readonly type: "dialogue"; readonly characterId: string; readonly text: string }
  | { readonly type: "narration"; readonly text: string }
  | { readonly type: "playMusic"; readonly assetId: string }
  | { readonly type: "stopMusic" }
  | { readonly type: "playSfx"; readonly assetId: string }
  | { readonly type: "transition"; readonly transition: Exclude<TransitionRef, "none"> }
  | { readonly type: "setVariable"; readonly variableId: string; readonly value: boolean | string }
  | { readonly type: "choice"; readonly options: readonly ChoiceOption[] }
  | { readonly type: "jump"; readonly sceneId: string }
  | { readonly type: "call"; readonly sceneId: string; readonly returnLabel: string | null }
  | { readonly type: "return" }
  | { readonly type: "customCode"; readonly source: string; readonly reason: string };

export interface BeatOwner { readonly groupId: string; readonly branchId: string }
export interface ConditionalBranch { readonly groupId: string; readonly variableId?: string; readonly otherwise: boolean; readonly ordinal?: number; readonly condition?: Condition }
export interface SceneBeat {
  readonly owner?: BeatOwner;
  readonly conditionalBranch?: ConditionalBranch;
  readonly structuralPlaceholder?: boolean;
  readonly id: string;
  readonly byteStart: number;
  readonly byteEnd: number;
  readonly protected: boolean;
  readonly payload: BeatPayload;
}

export type BodyRef = { readonly type: "root" } | { readonly type: "branch"; readonly groupId: string; readonly branchId: string };
export type NodeRef = { readonly type: "beat"; readonly beatId: string } | { readonly type: "condition"; readonly groupId: string };
export type Position = { readonly type: "before"; readonly anchor: NodeRef } | { readonly type: "end" };
export function beatBody(beat: SceneBeat): BodyRef {
  return beat.owner ? { type: "branch", ...beat.owner } : { type: "root" };
}
function sameBody(beat: SceneBeat, body: BodyRef): boolean {
  return body.type === "root" ? !beat.owner : beat.owner?.groupId === body.groupId && beat.owner.branchId === body.branchId;
}
function bodyNodes(scene: SceneDocument, body: BodyRef): readonly SceneBeat[] {
  return scene.beats.filter(beat => !beat.structuralPlaceholder && sameBody(beat, body) && (!beat.conditionalBranch || (!beat.conditionalBranch.otherwise && !beat.conditionalBranch.ordinal))
    && !(beat.payload.type === "customCode" && !beat.conditionalBranch && (!beat.payload.source.trim() || beat.payload.source.trimStart().startsWith("#"))));
}
function nodeRef(beat: SceneBeat): NodeRef {
  return beat.conditionalBranch ? { type: "condition", groupId: beat.conditionalBranch.groupId } : { type: "beat", beatId: beat.id };
}
function terminates(beat: SceneBeat, scene: SceneDocument, depth = 0): boolean {
  if (depth > 16) return false;
  if (beat.conditionalBranch) {
    const groupId = beat.conditionalBranch.groupId;
    const branches = scene.beats.filter(item => item.conditionalBranch?.groupId === groupId);
    return branches.some(branch => branch.conditionalBranch?.otherwise) && branches.every(branch => bodyNodes(scene, { type: "branch", groupId: beat.conditionalBranch!.groupId, branchId: branch.id }).some(child => terminates(child, scene, depth + 1)));
  }
  return ["jump", "return"].includes(beat.payload.type) || (beat.payload.type === "choice" && beat.payload.options.some(option => !option.condition));
}
function defaultInsertion(scene: SceneDocument, body: BodyRef): Position {
  const terminal = bodyNodes(scene, body).find(beat => terminates(beat, scene));
  return terminal ? { type: "before", anchor: nodeRef(terminal) } : { type: "end" };
}
function rootInsertionIsNested(scene: SceneDocument, beforeBeatId: string | null): boolean {
  const target = scene.beats.find(beat => beat.id === beforeBeatId);
  if (!target) return false;
  if (target.owner || (target.conditionalBranch && (target.conditionalBranch.otherwise || target.conditionalBranch.ordinal))) return true;
  const extent = (groupId: string, depth = 0): number => {
    if (depth > 16) return Number.MAX_SAFE_INTEGER;
    return Math.max(0, ...scene.beats.filter(beat => beat.owner?.groupId === groupId || beat.conditionalBranch?.groupId === groupId).map(beat => beat.conditionalBranch && beat.conditionalBranch.groupId !== groupId ? extent(beat.conditionalBranch.groupId, depth + 1) : beat.byteEnd));
  };
  return scene.beats.some(beat => beat.conditionalBranch && beat.byteStart < target.byteStart && target.byteStart < extent(beat.conditionalBranch.groupId));
}

function bodyCaption(scene: SceneDocument, body: BodyRef, model: SceneWorkspace): string {
  const parts: string[] = [];
  let parent = body;
  const seen = new Set<string>();
  while (parent.type === "branch" && !seen.has(parent.branchId)) {
    seen.add(parent.branchId);
    const owner = parent;
    const branch = scene.beats.find(beat => beat.id === owner.branchId && beat.conditionalBranch?.groupId === owner.groupId);
    parts.unshift(branch?.conditionalBranch ? branchCaption(branch.conditionalBranch, model) : "Missing branch");
    parent = branch ? beatBody(branch) : { type: "root" };
  }
  return `${scene.displayName} / ${parts.length ? parts.join(" / ") : "Scene body"}`;
}
function insideCondition(scene: SceneDocument, body: BodyRef, groupId: string): boolean {
  let current = body; const seen = new Set<string>();
  while (current.type === "branch" && !seen.has(current.branchId)) {
    if (current.groupId === groupId) return true;
    const branchId = current.branchId; seen.add(branchId); const header = scene.beats.find(beat => beat.id === branchId); current = header ? beatBody(header) : { type: "root" };
  }
  return false;
}
export interface StoryTarget { readonly sceneId: string; readonly beatId?: string; readonly expectedSourceRevision?: string; readonly body?: BodyRef; readonly caller?: StoryTarget }

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
}

interface Chapter { readonly id: string; readonly displayName: string; readonly directory: string }
interface Character { readonly id: string; readonly displayName: string; readonly technicalName: string }
interface Appearance { readonly id: string; readonly characterId: string; readonly label: string; readonly assetId?: string }
interface Asset { readonly id: string; readonly kind: "background" | "characterAppearance" | "music" | "sfx"; readonly displayName: string; readonly status: string; readonly sha256?: string }
interface Variable { readonly id: string; readonly technicalName: string; readonly variableType: "bool" | "int" | "string"; readonly defaultValue: boolean | string }

export interface SceneWorkspace {
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
  readonly canUndo: boolean;
  readonly canRedo: boolean;
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
      case "int": return expression.value;
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
  return beat.payload.type === "call" || (beat.payload.type === "choice" && beat.payload.options.some(option => option.condition !== undefined));
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
  readonly variables: Readonly<Record<string, { readonly value: boolean | string; readonly beatId: string }>>;
  readonly variablesUnknown: boolean;
  readonly overlay?: { readonly kind: "dialogue" | "narration" | "choice" | "jump" | "call" | "return"; readonly text: string; readonly beatId: string };
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
  let variables: Record<string, { value: boolean | string; beatId: string }> = {};
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
      case "setVariable": variables[payload.variableId] = { value: payload.value, beatId: beat.id }; break;
      case "dialogue": overlay = { kind: "dialogue", text: payload.text, beatId: beat.id }; break;
      case "narration": overlay = { kind: "narration", text: payload.text, beatId: beat.id }; break;
      case "choice": overlay = { kind: "choice", text: payload.options.map((option) => `${option.text}${option.condition ? " (availability unknown)" : ""}`).join(" · "), beatId: beat.id }; break;
      case "jump": overlay = { kind: "jump", text: "Jump", beatId: beat.id }; break;
      case "call": overlay = { kind: "call", text: "Call Scene · preview state unknown", beatId: beat.id }; break;
      case "return": overlay = { kind: "return", text: "Return / End", beatId: beat.id }; break;
      case "playSfx": case "transition": break;
    }
    if (payload.type === "choice") { if (!unknownBeatIds.includes(beat.id)) unknownBeatIds.push(beat.id); break; }
    if (payload.type === "jump" || payload.type === "return") break;
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
  readonly current?: () => boolean;
  readonly caller?: StoryTarget;
  readonly viewScene?: (target: StoryTarget) => void;
  readonly viewContinuation?: (sceneId: string, beatId: string, expectedSourceRevision: string) => void;
  readonly assist?: (sceneId: string, beatId: string, action?: string) => void;
  readonly layoutKey?: string;
  readonly apply: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision">) => Promise<SceneWorkspace>;
  readonly status: (message: string, kind?: "normal" | "error") => void;
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
  return: "Return / End",
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

const draftSettlers = new WeakMap<HTMLElement, () => Promise<boolean>>();
export async function settleSceneDraft(root: HTMLElement): Promise<boolean> {
  const host = root.matches(".scene-workspace") ? root : root.querySelector<HTMLElement>(".scene-workspace");
  return host && draftSettlers.has(host) ? draftSettlers.get(host)!() : !hasSceneDraft(root);
}

export function renderSceneAuthoring(
  host: HTMLElement,
  treeHost: HTMLElement,
  initial: SceneWorkspace,
  actions: SceneActions,
  initialBeatId?: string,
): () => void {
  let model = initial;
  let selectedBeatId: string | undefined = initialBeatId;
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
  const previewObservers:ResizeObserver[]=[];
  let resetPreviewAllocation:(()=>void)|undefined;
  let cancelBeatDrag:(()=>void)|undefined;
  const resetLayout=():void=>resetPreviewAllocation?.();
  window.addEventListener("loomlight-reset-layout",resetLayout);
  let saveDialogue: (()=>Promise<boolean>) | undefined;
  let settling: Promise<boolean> | undefined;
  let composing = false;
  let pendingWrites = 0;
  const drafts = (): HTMLElement[] => [host, treeHost].flatMap(root => [...root.querySelectorAll<HTMLElement>('.scene-draft[data-unsubmitted="true"]')]);
  const hasDraft = (): boolean => drafts().length > 0;
  const focusDraft = (): void => { if (hasSceneDraft(host)) focusSceneDraft(host); else focusSceneDraft(treeHost); };
  const settle = (): Promise<boolean> => {
    if(settling)return settling;
    if (pendingWrites || hasSceneDraft(treeHost)) { focusDraft(); return Promise.resolve(false); }
    if(!hasDraft())return Promise.resolve(true);
    if(composing || !saveDialogue){focusDraft();return Promise.resolve(false);}
    settling=saveDialogue().finally(()=>{settling=undefined;});return settling;
  };
  draftSettlers.set(host,settle);

  const mutate = async (command: SceneCommand, after?: (before: SceneWorkspace, next: SceneWorkspace) => void, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision"> = model, owner?: HTMLElement): Promise<boolean> => {
    if(disposed || actions.current?.() === false)return false;
    if (drafts().some(draft => draft !== owner)) { actions.status("Complete or cancel the other edit first. Input retained.", "error"); focusDraft(); return false; }
    if (pendingWrites) { actions.status("Wait for the current change to finish.", "error"); return false; }
    const before = model;
    const locks = [host, treeHost].flatMap(root => [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input,select,textarea,button")]).map(control => ({ control, disabled: control.disabled }));
    locks.forEach(({ control }) => { control.disabled = true; }); pendingWrites++;
    actions.status("Saving…");
    try {
      const next = await actions.apply(command, expected);
      if (disposed || actions.current?.() === false) return false;
      model = next;
      after?.(before, next);
      draw();
      actions.status("Saved");
      return true;
    } catch (error) {
      if (disposed || actions.current?.() === false) return false;
      actions.status(`${friendlyError(error, "Scene change could not be saved")} Input retained. If this source structure cannot be moved safely, edit it in Source.`, "error");
      focusDraft();
      return false;
    } finally { pendingWrites--; locks.forEach(({ control, disabled }) => { if (control.isConnected) control.disabled = disabled; }); }
  };

  const draftGuard = (): boolean => {
    if (settling || pendingWrites) { actions.status("Wait for the current Beat change to finish.", "error"); focusDraft(); return false; }
    if (!hasDraft()) return true;
    actions.status("Commit or cancel the Scene editor before navigating.", "error");
    focusDraft();
    return false;
  };

  const draw = (): void => {
    cancelBeatDrag?.();
    saveDialogue = undefined;previewObservers.splice(0).forEach(o=>o.disconnect());
    mediaGeneration += 1;
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
    treeHost.replaceChildren();
    host.replaceChildren();
    const selectedScene = model.scenes.find((scene) => scene.id === model.lastOpen.sceneId) ?? model.scenes[0];
    if (!selectedScene) {
      const empty = document.createElement("p"); empty.className = "error-message"; empty.textContent = "No valid Scene is available."; host.append(empty); return;
    }
    drawTree(selectedScene);
    drawBeats(selectedScene);
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
        const sceneRow = document.createElement("div"); sceneRow.className = `tree-scene-row${scene.id === selectedScene.id ? " selected" : ""}`;
        const open = button(scene.displayName, "tree-scene-open");
        if (scene.id === selectedScene.id) open.ariaCurrent = "page";
        open.addEventListener("click",()=>{if(scene.id!==selectedScene.id)void settle().then(ok=>{if(ok)void mutate({type:"selectScene",sceneId:scene.id});else actions.status("Complete or cancel this edit before changing scenes.","error");});});
        const controls = document.createElement("div"); controls.className = "tree-tools";
        const renameScene = button("Rename", "icon-button"); renameScene.ariaLabel = `Rename scene ${scene.displayName}`;
        renameScene.addEventListener("click", () => treeName(sceneRow, "Scene name", scene.displayName, displayName => ({ type: "renameScene", sceneId: scene.id, displayName })));
        const moveUp = button("↑", "icon-button"); moveUp.ariaLabel = `Move scene ${scene.displayName} up`; moveUp.disabled = sceneIndex === 0;
        moveUp.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "up", expectedSourceRevision: scene.sourceRevision }));
        const moveDown = button("↓", "icon-button"); moveDown.ariaLabel = `Move scene ${scene.displayName} down`; moveDown.disabled = sceneIndex === scenes.length - 1;
        moveDown.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "down", expectedSourceRevision: scene.sourceRevision }));
        const removeScene = button("Delete", "icon-button"); removeScene.ariaLabel = `Delete scene ${scene.displayName}`;
        removeScene.disabled = scene.id === model.entrySceneId || model.scenes.length === 1;
        removeScene.addEventListener("click", () => confirmAction(sceneRow, `Delete Scene “${scene.displayName}”? Incoming or opaque references will refuse this operation.`, () => mutate({ type: "deleteScene", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision })));
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

  const openNewBeat = (scene: SceneDocument, initialType: BeatPayload["type"] = "dialogue", beforeBeatId: string | null = null): void => {
    if (!draftGuard()) return;
    const anchor = beforeBeatId ? scene.beats.find(beat => beat.id === beforeBeatId) : undefined;
    if (anchor?.owner || (anchor?.conditionalBranch && (anchor.conditionalBranch.otherwise || anchor.conditionalBranch.ordinal))) {
      actions.status("Add a root Beat before or after the whole condition group.", "error"); return;
    }
    selectedBeatId = undefined;
    draw();
    const current = model.scenes.find((item) => item.id === scene.id);
    const list = host.querySelector<HTMLElement>(".beats-list");
    if (current && list) renderNewBeat(list, current, initialType, { type: "root" }, anchor ? { type: "before", anchor: nodeRef(anchor) } : defaultInsertion(current, { type: "root" }));
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
    const state = deriveScenePreview(scene, hasConditions ? undefined : selectedBeatId, hasConditions ? manualBranches : undefined);
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
    const surround = document.createElement("div"); surround.className = "preview-surround";
    const canvas = document.createElement("div"); canvas.className = "preview-canvas"; canvas.style.aspectRatio = `${actions.resolution.width} / ${actions.resolution.height}`;
    if (state.background) {
      const image = document.createElement("img"); image.className = "preview-background"; image.alt = model.authoring.assets.find((asset) => asset.id === state.background?.assetId)?.displayName ?? "Scene background";
      canvas.append(image); void loadImage(state.background.assetId, "imagePreview", image, canvas);
    } else {
      const empty = document.createElement("p"); empty.className = "preview-empty"; empty.textContent = state.backgroundUnknown ? "Background unknown after code or unevaluated flow" : "No background at this point"; canvas.append(empty);
    }
    for (const visible of state.characters) {
      const figure = document.createElement("figure"); figure.className = `preview-character ${visible.placement}`;
      const appearance = model.authoring.appearances.find((item) => item.id === visible.appearanceId);
      const character = model.authoring.characters.find((item) => item.id === visible.characterId);
      if (appearance?.assetId) { const image = document.createElement("img"); image.alt = `${character?.displayName ?? "Character"} — ${appearance.label}`; figure.append(image); void loadImage(appearance.assetId, "imagePreview", image, figure); }
      const caption = document.createElement("figcaption"); caption.textContent = character?.displayName ?? "Character"; figure.append(caption); canvas.append(figure);
    }
    if (state.charactersUnknown) { const unknown = document.createElement("span"); unknown.className = "preview-unknown-layer"; unknown.textContent = "Other character state may be unknown"; canvas.append(unknown); }
    if (state.overlay) { const overlay = document.createElement("div"); overlay.className = `preview-overlay ${state.overlay.kind}`; overlay.textContent = state.overlay.text || (state.overlay.kind === "dialogue" ? "Empty dialogue" : state.overlay.kind);if(state.overlay.kind==="dialogue"){const beat=scene.beats.find(b=>b.id===state.overlay?.beatId);if(beat?.payload.type==="dialogue"){const character=model.authoring.characters.find(c=>c.id===(beat.payload as {characterId:string}).characterId);const name=document.createElement("strong");name.textContent=character?.displayName??"";name.className="preview-speaker";overlay.prepend(name);}} canvas.append(overlay); }
    surround.append(canvas); preview.append(header, surround);
    if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(()=>{const b=surround.getBoundingClientRect();const ratio=actions.resolution.width/actions.resolution.height;const width=Math.max(1,Math.min(b.width,b.height*ratio));canvas.style.width=`${width}px`;canvas.style.height=`${width/ratio}px`;});observer.observe(surround);previewObservers.push(observer);}

    const details = document.createElement("div"); details.className = "preview-details scene-context-inspector";details.hidden=!(actions.layoutKey&&layoutFor(actions.layoutKey).inspectorOpen);
    const toggle=button("Scene details");toggle.ariaExpanded=String(!details.hidden);toggle.addEventListener("click",()=>{details.hidden=!details.hidden;toggle.ariaExpanded=String(!details.hidden);if(actions.layoutKey)saveLayout(actions.layoutKey,{inspectorOpen:!details.hidden});});header.append(toggle);
    const close=button("Close details");close.addEventListener("click",()=>{details.hidden=true;toggle.ariaExpanded="false";toggle.focus();if(actions.layoutKey)saveLayout(actions.layoutKey,{inspectorOpen:false});});details.append(close);
    const provenance = document.createElement("div"); provenance.className = "preview-provenance";
    const provenanceHeading = document.createElement("h3"); provenanceHeading.textContent = "Visible state and provenance"; provenance.append(provenanceHeading);
    const contribution = (label: string, beatId: string | undefined, addType: BeatPayload["type"]): void => {
      const row = document.createElement("div"); row.className = "provenance-row"; const name = document.createElement("span"); name.textContent = label; row.append(name);
      if (beatId) { const index = scene.beats.findIndex((beat) => beat.id === beatId); const edit = button(`Edit Beat ${index + 1}`, "text-button"); edit.addEventListener("click", () => { if (draftGuard()) { selectedBeatId = beatId; draw(); host.querySelector<HTMLElement>(".beat-card.selected")?.scrollIntoView?.({ block: "nearest" }); } }); row.append(edit); }
      const add = button("Add change here", "text-button"); add.disabled = rootInsertionIsNested(scene, selectedBeatId ?? null); add.addEventListener("click", () => openNewBeat(scene, addType, selectedBeatId ?? null)); row.append(add); provenance.append(row);
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
    return beat ? [...host.querySelectorAll<HTMLElement>(".beat-card")].find(item => item.dataset.beatId === beat.id) : host.querySelector<HTMLElement>(".beats-list") ?? undefined;
  };
  const destinations = (scene: SceneDocument, initialBody: BodyRef, exclude?: SceneBeat): { host: HTMLElement; read: () => { body: BodyRef; position: Position } } => {
    const panel = document.createElement("div"); panel.className = "story-destination";
    const parents: { key: string; body: BodyRef; label: string }[] = [{ key: "root", body: { type: "root" }, label: bodyCaption(scene, { type: "root" }, model) }];
    for (const branch of scene.beats.filter(beat => beat.conditionalBranch)) {
      const body: BodyRef = { type: "branch", groupId: branch.conditionalBranch!.groupId, branchId: branch.id };
      if (exclude?.conditionalBranch && insideCondition(scene, body, exclude.conditionalBranch.groupId)) continue;
      parents.push({ key: branch.id, body, label: bodyCaption(scene, body, model) });
    }
    const parent = selectOf(parents.map(item => ({ value: item.key, label: item.label })), initialBody.type === "root" ? "root" : initialBody.branchId); parent.setAttribute("aria-label", "Destination body");
    const position = document.createElement("select"); position.setAttribute("aria-label", "Destination position");
    const summary = document.createElement("p"); summary.className = "story-insertion";
    let placements: { key: string; position: Position; label: string }[] = [];
    const show = (): void => { summary.textContent = `Move to ${parents.find(item => item.key === parent.value)?.label ?? "Missing body"} · ${placements.find(item => item.key === position.value)?.label ?? "Choose a position"}`; };
    const rebuild = (): void => {
      const body = parents.find(item => item.key === parent.value)!.body;
      const siblings = bodyNodes(scene, body).filter(beat => beat.id !== exclude?.id);
      placements = siblings.filter(beat => (!beat.protected || !!beat.conditionalBranch) && (!exclude || !terminates(exclude, scene))).map(beat => ({ key: beat.id, position: { type: "before", anchor: nodeRef(beat) } as Position, label: `Before ${beat.conditionalBranch ? "Condition" : beatLabels[beat.payload.type]} · ${beatSummary(beat.payload, model)}` }));
      if (!siblings.some(beat => terminates(beat, scene))) placements.push({ key: "end", position: { type: "end" }, label: "End of body" });
      position.replaceChildren(...placements.map(item => { const option = document.createElement("option"); option.value = item.key; option.textContent = item.label; return option; }));
      const preferred = defaultInsertion(scene, body); const match = placements.find(item => JSON.stringify(item.position) === JSON.stringify(preferred)); position.value = match?.key ?? placements[0]?.key ?? ""; show();
    };
    parent.addEventListener("change", rebuild); position.addEventListener("change", show); rebuild(); panel.append(labelled("Destination body", parent), labelled("Destination position", position), summary);
    const validate = validateField(position, () => { if (!placements.some(item => item.key === position.value)) throw Error("Choose an available position in this body."); });
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
  const groupCount = (scene: SceneDocument, groupId: string): number => scene.beats.filter(beat => !beat.conditionalBranch && !beat.structuralPlaceholder && insideCondition(scene, beatBody(beat), groupId)).length;
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
      remove.addEventListener("click", () => { const target = prepareOperation(scene, beat); if (!target) return; const copy = document.createElement("p"); copy.textContent = `Delete ${branchCaption(branch, model)} and its contained Beats. Other branches remain.`; operation(scene, target, "Delete branch", [copy], () => ({ type: "removeConditionBranch", groupId: branch.groupId, branchId: beat.id, expectedBody: beatBody(header) }), "Delete this branch", header.id); }); card.append(remove);
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
    const siblings = bodyNodes(scene, beatBody(beat)), index = siblings.findIndex(item => item.id === beat.id);
    if (index < 0 || (direction === "up" ? index === 0 : index === siblings.length - 1)) return;
    const anchor = direction === "up" ? siblings[index - 1] : siblings[index + 2];
    const position: Position = anchor ? { type: "before", anchor: nodeRef(anchor) } : { type: "end" };
    void mutate({ type: "moveStoryNode", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, node: nodeRef(beat), expectedBody: beatBody(beat), body: beatBody(beat), position }, () => { selectedBeatId = undefined; }).then(saved => { if (saved) [...host.querySelectorAll<HTMLElement>(".beat-card")].find(item => item.dataset.beatId === beat.id)?.querySelector<HTMLElement>(".beat-select")?.focus(); });
  };
  const removeNodeForm = (scene: SceneDocument, beat: SceneBeat): void => {
    const target = prepareOperation(scene, beat); if (!target) return;
    const copy = document.createElement("p"); copy.textContent = beat.conditionalBranch ? `Delete ${branchCaption(beat.conditionalBranch, model)} and all ${groupCount(scene, beat.conditionalBranch.groupId)} contained Beats. Use Unwrap to keep one selected branch instead.` : `Delete this ${beatLabels[beat.payload.type]} Beat. If its branch becomes empty, Source keeps pass.`;
    operation(scene, target, beat.conditionalBranch ? "Delete entire condition" : "Delete Beat", [copy], () => ({ type: "removeStoryNode", node: nodeRef(beat), expectedBody: beatBody(beat) }), beat.conditionalBranch ? "Delete entire condition" : "Delete this Beat");
  };
  const unwrapForm = (scene: SceneDocument, header: SceneBeat): void => {
    const target = prepareOperation(scene, header); if (!target) return;
    const groupId = header.conditionalBranch!.groupId;
    const branches = scene.beats.filter(beat => beat.conditionalBranch?.groupId === groupId);
    const branch = selectOf(branches.map(item => ({ value: item.id, label: branchCaption(item.conditionalBranch!, model) })), branches[0]?.id); branch.setAttribute("aria-label", "Branch to keep");
    const copy = document.createElement("p"); const show = (): void => { copy.textContent = `Keep only ${branches.find(item => item.id === branch.value)?.conditionalBranch ? branchCaption(branches.find(item => item.id === branch.value)!.conditionalBranch!, model) : "the selected branch"} in ${bodyCaption(scene, beatBody(header), model)}. Remove the condition and all other branches; their bodies are not combined.`; }; branch.addEventListener("change", show); show();
    operation(scene, target, "Unwrap one branch", [labelled("Branch to keep", branch), copy], () => ({ type: "unwrapCondition", groupId, branchId: required(branch), expectedBody: beatBody(header) }), "Unwrap selected branch");
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
    const undo = button("Undo"); undo.disabled = !model.canUndo; undo.addEventListener("click", () => { if (draftGuard()) void mutate({ type: "undo" }); });
    const redo = button("Redo"); redo.disabled = !model.canRedo; redo.addEventListener("click", () => { if (draftGuard()) void mutate({ type: "redo" }); });
    const focus = button(writingFocus ? "Exit Writing focus" : "Writing focus");focus.ariaPressed=String(writingFocus);focus.addEventListener("click",()=>{writingFocus=!writingFocus;host.dataset.writingFocus=String(writingFocus);host.closest<HTMLElement>(".project-shell")?.setAttribute("data-writing-focus",String(writingFocus));focus.textContent=writingFocus?"Exit Writing focus":"Writing focus";focus.ariaPressed=String(writingFocus);});
    if (actions.caller && actions.viewScene) { const caller = button("Back to caller"); caller.addEventListener("click", () => { if (draftGuard()) actions.viewScene?.(actions.caller!); }); history.append(caller); }
    if (focusedBranch) { const all = button("Show whole Scene"); all.addEventListener("click", () => { if (draftGuard()) { focusedBranch = undefined; draw(); } }); history.append(all); }
    history.append(viewSource, focus, undo, redo); header.append(titleBlock, history); host.append(header);
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
    stack.append(preview, beatsRegion); host.append(stack); renderPreview(preview, scene);
    const toolbar = document.createElement("div"); toolbar.className = "beats-toolbar";
    const heading = document.createElement("h2"); heading.textContent = "Beats";
    const add = button("Add Beat", "button primary"); add.disabled = scene.sourceConflict;
    add.addEventListener("click", () => openNewBeat(scene));
    let allocation=actions.layoutKey ? layoutFor(actions.layoutKey).previewPercent ?? 34 : 34;
    const divider=document.createElement("div");divider.className="preview-divider";divider.role="separator";divider.tabIndex=0;divider.ariaLabel="Resize scene preview";divider.setAttribute("aria-orientation","horizontal");divider.setAttribute("aria-valuemin","20");divider.setAttribute("aria-valuemax","70");
    const adjust=(value:number,remember=false):void=>{allocation=Math.min(70,Math.max(20,Math.round(value)));stack.style.setProperty("--preview-share",`${allocation}fr`);stack.style.setProperty("--beats-share",`${100-allocation}fr`);divider.setAttribute("aria-valuenow",String(allocation));if(remember&&actions.layoutKey)saveLayout(actions.layoutKey,{previewPercent:allocation});};
    adjust(allocation);resetPreviewAllocation=()=>adjust(34);
    divider.addEventListener("keydown",e=>{if(e.key==="ArrowUp"||e.key==="ArrowDown"){e.preventDefault();adjust(allocation+(e.key==="ArrowUp"?-2:2),true);}});
    let dragging=false;divider.addEventListener("pointerdown",e=>{dragging=true;divider.setPointerCapture(e.pointerId);});divider.addEventListener("pointermove",e=>{if(dragging){const b=stack.getBoundingClientRect();adjust((e.clientY-b.top)/b.height*100);}});divider.addEventListener("pointerup",()=>{dragging=false;adjust(allocation,true);});divider.addEventListener("pointercancel",()=>{dragging=false;});stack.insertBefore(divider,beatsRegion);
    const tools = document.createElement("div"); tools.className = "beats-tools";tools.append(add);
    const addCondition = button("Add Condition"); addCondition.disabled = scene.sourceConflict;
    addCondition.addEventListener("click", () => openConditionForm(scene, { type: "root" }, defaultInsertion(scene, { type: "root" }))); tools.append(addCondition);
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
      const {id,target,active,grip}=drag;cancelDrag();
      if(active&&target!==undefined)void mutate({type:"reorderBeat",sceneId:scene.id,expectedSourceRevision:scene.sourceRevision,beatId:id,toIndex:target}).then(saved=>{if(saved)[...host.querySelectorAll<HTMLElement>(".beat-card")].find(row=>row.dataset.beatId===id)?.querySelector<HTMLElement>(".beat-grip")?.focus();});
      else if(grip.isConnected)grip.focus();
    };
    const escapeDrag=(event:KeyboardEvent):void=>{if(event.key==="Escape"&&drag){event.preventDefault();const grip=drag.grip;cancelDrag();grip.focus();}};
    const branchHosts = new Map<string, HTMLElement>();
    const groupHosts = new Map<string, HTMLElement>();
    scene.beats.forEach((beat, index) => {
      const card = document.createElement("article"); card.className = `beat-card${selectedBeatId === beat.id ? " selected" : ""}`; card.setAttribute("role", "listitem");card.dataset.beatId=beat.id;
      if (beat.owner) { card.classList.add("nested-dialogue"); card.dataset.groupId=beat.owner.groupId; card.dataset.branchId=beat.owner.branchId; }
      if (beat.conditionalBranch) card.classList.add("conditional-branch");
      const compact = document.createElement("div"); compact.className = "beat-compact";
      const select = button(`${index + 1}. ${beat.conditionalBranch ? branchCaption(beat.conditionalBranch, model) : beatLabels[beat.payload.type]}`, "beat-select"); select.ariaExpanded = String(selectedBeatId === beat.id);
      const summary = document.createElement("span"); summary.className = "beat-summary"; summary.textContent = beat.structuralPlaceholder ? "Empty branch" : beat.conditionalBranch ? `Branch ${(beat.conditionalBranch.ordinal ?? 0) + 1} · first match wins` : beatSummary(beat.payload, model);
      select.append(summary); select.addEventListener("click",()=>{const selectBeat=():void=>{selectedBeatId=selectedBeatId===beat.id?undefined:beat.id;draw();[...host.querySelectorAll<HTMLElement>(".beat-card")].find(item=>item.dataset.beatId===beat.id)?.querySelector<HTMLElement>(".beat-select")?.focus();};if(!hasDraft()&&!settling&&!pendingWrites){selectBeat();return;}void settle().then(ok=>{if(ok)selectBeat();else actions.status("Complete or cancel the current edit before changing Beats.","error");});});
      const controls = document.createElement("div"); controls.className = "beat-controls";
      const nodeEditable = !readOnlyLogic(beat) && !beat.structuralPlaceholder && (!beat.protected || !!beat.conditionalBranch && !beat.conditionalBranch.ordinal && !beat.conditionalBranch.otherwise);
      const siblings = bodyNodes(scene, beatBody(beat)); const ordinal = siblings.findIndex(item => item.id === beat.id);
      const up = button("↑", "icon-button"); up.ariaLabel = `Move beat ${index + 1} up`; up.disabled = !nodeEditable || ordinal <= 0 || terminates(beat, scene) || !!siblings[ordinal - 1]?.protected && !siblings[ordinal - 1]?.conditionalBranch || scene.sourceConflict;
      up.addEventListener("click", () => moveSibling(scene, beat, "up"));
      const down = button("↓", "icon-button"); down.ariaLabel = `Move beat ${index + 1} down`; down.disabled = !nodeEditable || ordinal < 0 || ordinal === siblings.length - 1 || terminates(beat, scene) || !!siblings[ordinal + 1] && terminates(siblings[ordinal + 1]!, scene) || !!siblings[ordinal + 1]?.protected && !siblings[ordinal + 1]?.conditionalBranch || scene.sourceConflict;
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
          if (selected && (selected.conditionalBranch?.groupId === branch.groupId || insideCondition(scene, beatBody(selected), branch.groupId))) group.classList.add("selected");
          const caption = document.createElement("strong"); caption.textContent = `Condition · ${branch.condition ? conditionCaption(branch.condition, model.authoring.variables) : "Unknown condition"} · ${scene.beats.filter(item => item.conditionalBranch?.groupId === branch.groupId).length} branches / ${groupCount(scene, branch.groupId)} Beats${group.classList.contains("selected") ? " · Contains selection" : ""}`;
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
        addChild.disabled = scene.sourceConflict || branch.condition?.status === "unknown";
        addChild.addEventListener("click", () => {
          if (!draftGuard()) return;
          selectedBeatId = undefined; draw();
          const target = [...host.querySelectorAll<HTMLElement>(".story-branch-body")].find(node => node.dataset.branchId === beat.id);
          if (target) { const parent: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }; renderNewBeat(target, scene, "dialogue", parent, defaultInsertion(scene, parent)); }
        });
        const addCondition = button(`Add Condition to ${branch.otherwise ? "Otherwise" : branch.ordinal ? "Else If" : "If"}`); addCondition.disabled = scene.sourceConflict;
        addCondition.addEventListener("click", () => { const parent: BodyRef = { type: "branch", groupId: branch.groupId, branchId: beat.id }; openConditionForm(scene, parent, defaultInsertion(scene, parent)); });
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
          const item = document.createElement("li"); const destination = model.scenes.find(scene => scene.id === option.destinationSceneId)?.displayName ?? "Missing Scene";
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
      const explanation = document.createElement("p"); explanation.textContent = beat.payload.type === "customCode" ? beat.payload.reason : "Protected source";
      const source = document.createElement("pre"); source.textContent = beat.payload.type === "customCode" ? beat.payload.source : "";
      protectedPanel.append(explanation, source); card.append(protectedPanel); return;
    }
    const captured = { projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision };
    const expectedBody = beatBody(beat);
    const editor = buildBeatEditor(model, beat.payload, true);
    const panel = editor.host; panel.classList.add("expanded-beat");panel.dataset.beatType=beat.payload.type;
    const parent = document.createElement("p"); parent.className = "story-breadcrumb"; parent.textContent = bodyCaption(scene, expectedBody, model); panel.prepend(parent);
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
            void mutate({ type: "createSceneFromChoice", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, choiceBeatId: beat.id, optionText: requiredText(optionText, "Choice text"), chapterId: required(chapter), displayName: requiredText(sceneName, "Scene name") }, undefined, captured, form);
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
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => { selectedBeatId = undefined; draw(); });
    const commit = button("Commit Beat", "button primary"); commit.disabled = scene.sourceConflict;
    const save = async (continueDialogue: boolean): Promise<boolean> => {
      if(composing)return false;
      let saved=false;
      let restoreControls = (): void => {};
      try {
        const payload = editor.read();
        panel.dataset.unsubmitted = "true";
        const locks = [...panel.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement|HTMLTextAreaElement>("input,button,select,textarea")].map(control => ({ control, disabled: control.disabled }));
        locks.forEach(({ control }) => { control.disabled = true; });
        restoreControls = () => locks.forEach(({ control, disabled }) => { control.disabled = disabled; });
        if (continueDialogue && !beat.owner && payload.type === "dialogue") {
          const oldIds = new Set(model.scenes.find((item) => item.id === scene.id)?.beats.map((item) => item.id));
          await mutate({ type: "continueDialogue", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, characterId: payload.characterId, text: payload.text }, (_before, next) => {
            saved=true;selectedBeatId = next.scenes.find((item) => item.id === scene.id)?.beats.find((item) => item.payload.type === "dialogue" && !oldIds.has(item.id))?.id;
          }, captured, panel);
        } else {
          await mutate({ type: "updateBodyBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, expectedBody, beat: payload }, () => { saved=true;selectedBeatId = undefined; }, captured, panel);
        }
      } catch (error) {
        actions.status(friendlyError(error, `Beat ${index + 1} is invalid`), "error");
        editor.focus();
      }
      if(!saved&&panel.isConnected){restoreControls();editor.focus();}
      return saved;
    };
    if(beat.payload.type==="dialogue")saveDialogue=()=>save(false);
    editor.primary.addEventListener("compositionstart",()=>{composing=true;});editor.primary.addEventListener("compositionend",()=>{composing=false;});
    commit.addEventListener("click", () => { if(!settling) { settling=save(false).finally(()=>{settling=undefined;}); } });
    if (beat.payload.type === "dialogue") editor.primary.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); if(!event.isComposing&&!settling)settling=save(event.shiftKey).finally(()=>{settling=undefined;}); }
    });
    actionsRow.append(cancel, commit); panel.append(actionsRow); dirtyDraft(panel, editor.controls); card.append(panel);
  };

  const renderNewBeat = (list: HTMLElement, scene: SceneDocument, initialType: BeatPayload["type"] = "dialogue", body: BodyRef = { type: "root" }, position: Position = defaultInsertion(scene, body)): void => {
    if (host.querySelector(".new-beat")) return;
    const captured = { projectRevision: model.projectRevision, sourceMapRevision: model.sourceMapRevision };
    const panel = document.createElement("section"); panel.className = "new-beat scene-draft";
    panel.addEventListener("compositionstart", () => { composing = true; }); panel.addEventListener("compositionend", () => { composing = false; }); panel.setAttribute("aria-labelledby", "new-beat-title");
    const heading = document.createElement("h3"); heading.id = "new-beat-title"; heading.textContent = "Add Beat";
    const types = (Object.keys(beatLabels) as BeatPayload["type"][]).filter((type) => type !== "customCode");
    const type = selectOf(types.map((value) => ({ value, label: beatLabels[value] })), initialType);
    const destination = document.createElement("p"); destination.className = "story-insertion";
    const insertionAnchor = position.type === "before" ? position.anchor : undefined;
    const anchor = insertionAnchor ? bodyNodes(scene, body).find(beat => JSON.stringify(nodeRef(beat)) === JSON.stringify(insertionAnchor)) : undefined;
    destination.textContent = `Insert in ${bodyCaption(scene, body, model)} · ${anchor ? `Before ${anchor.conditionalBranch ? "Condition" : beatLabels[anchor.payload.type]}` : "End of body"}`;
    const editorHost = document.createElement("div");
    let editor = buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model));
    const typeDrafts = new Map<string, BeatEditor>([[type.value, editor]]);
    const replaceEditor = (): void => { editor = typeDrafts.get(type.value) ?? buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model)); typeDrafts.set(type.value, editor); editorHost.replaceChildren(editor.host); dirtyDraft(panel, editor.controls); };
    type.addEventListener("change", replaceEditor); replaceEditor();
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => panel.remove());
    let pending=false;
    const commit = button("Add Beat", "button primary"); commit.addEventListener("click", async () => {
      if(pending || composing)return;
      try {
        const payload = editor.read();
        pending=true;panel.dataset.unsubmitted="true";
        const controls=[...panel.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLButtonElement>("input,select,textarea,button")];
        const locks = controls.map(control => ({ control, disabled: control.disabled }));
        controls.forEach(control=>control.disabled=true);
        let insertedId:string|undefined;
        const saved=await mutate({ type: "insertBodyBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, body, position, beat: payload }, (before,next) => {
          selectedBeatId = undefined;
          const previousIds=new Set(before.scenes.find(s=>s.id===scene.id)?.beats.map(b=>b.id));
          insertedId=next.scenes.find(s=>s.id===scene.id)?.beats.find(b=>!previousIds.has(b.id))?.id;
        }, captured, panel);
        if(saved&&insertedId){const row=[...host.querySelectorAll<HTMLElement>(".beat-card")].find(row=>row.dataset.beatId===insertedId);row?.scrollIntoView?.({block:"nearest"});row?.querySelector<HTMLElement>(".beat-select")?.focus({preventScroll:true});}
        if(!saved&&panel.isConnected){locks.forEach(({control,disabled})=>{control.disabled=disabled;});editor.focus();}
      } catch (error) {
        actions.status(friendlyError(error, "Beat is invalid"), "error"); editor.focus();
      }finally{pending=false;}
    });
    actionsRow.append(cancel, commit); dirtyDraft(panel, [type]); panel.append(heading, destination, labelled("Beat type", type), editorHost, actionsRow); list.prepend(panel); type.focus();
  };

  draw();
  return () => {
    disposed = true;
    cancelBeatDrag?.();window.removeEventListener("loomlight-reset-layout",resetLayout);
    draftSettlers.delete(host);previewObservers.splice(0).forEach(o=>o.disconnect());
    mediaGeneration += 1;
    pendingImages.clear();
    for (const image of imageCache.values()) URL.revokeObjectURL(image.url);
    imageCache.clear();
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
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
    case "changeAppearance": return character(payload.characterId);
    case "placement": return `${character(payload.characterId)} · ${payload.placement}`;
    case "dialogue": return `${character(payload.characterId)}: ${payload.text || "Empty dialogue"}`;
    case "narration": return payload.text || "Empty narration";
    case "playMusic": case "playSfx": return asset(payload.assetId);
    case "stopMusic": return "Stop current music";
    case "transition": return payload.transition;
    case "setVariable": return `${model.authoring.variables.find((item) => item.id === payload.variableId)?.technicalName ?? "variable"} = ${String(payload.value)}`;
    case "choice": return `${payload.options.length} option${payload.options.length === 1 ? "" : "s"}${payload.options.some(option => option.condition) ? " · Conditional availability unknown" : ""}`;
    case "jump": return scene(payload.sceneId);
    case "call": return `${scene(payload.sceneId)} · Returns to next Beat`;
    case "return": return "Scene terminal";
    case "customCode": return payload.reason;
  }
}

interface BeatEditor { readonly host: HTMLElement; readonly controls: readonly HTMLElement[]; readonly primary: HTMLElement; readonly read: () => BeatPayload; readonly focus: () => void }

function buildBeatEditor(model: SceneWorkspace, payload: BeatPayload, existing = false): BeatEditor {
  const host = document.createElement("div"); host.className = "beat-fields"; const controls: HTMLElement[] = [];
  const add = (label: string, control: HTMLElement): void => { controls.push(control); host.append(labelled(label, control)); };
  const transitions = (includeNone = true) => selectOf(([...(includeNone ? [{ value: "none" as const, label: "None" }] : []), { value: "dissolve" as const, label: "Dissolve" }, { value: "fade" as const, label: "Fade" }]), "transition" in payload ? payload.transition : "none");
  const placements = (selected?: string) => selectOf([{ value: "left" as const, label: "Left" }, { value: "centre" as const, label: "Centre" }, { value: "right" as const, label: "Right" }], selected);
  const characters = (selected?: string) => entitySelect(model.authoring.characters.map((item) => ({ id: item.id, label: item.displayName })), selected);
  const assets = (kind: Asset["kind"], selected?: string) => entitySelect(model.authoring.assets.filter((item) => item.kind === kind && item.status === "available").map((item) => ({ id: item.id, label: item.displayName })), selected);
  const scenes = (selected?: string) => entitySelect(model.scenes.map((item) => ({ id: item.id, label: item.displayName })), selected);
  let read: () => BeatPayload;
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
    case "setVariable": {
      const variable = entitySelect(model.authoring.variables.map((item) => ({ id: item.id, label: `${item.technicalName} · ${item.variableType}` })), payload.variableId);
      const valueHost = document.createElement("div"); let value: HTMLInputElement | HTMLSelectElement;
      const rebuild = (): void => { const selected = model.authoring.variables.find((item) => item.id === variable.value); if (selected?.variableType === "bool") value = selectOf([{ value: "false", label: "False" }, { value: "true", label: "True" }], String(payload.value)); else { value = input(String(payload.value)); if (selected?.variableType === "int") value.inputMode = "numeric"; } controls.push(value); valueHost.replaceChildren(value); };
      variable.addEventListener("change", rebuild); rebuild(); add("Variable", variable); host.append(labelled("Value", valueHost));
      read = () => { const selected = model.authoring.variables.find((item) => item.id === required(variable)); if (!selected) throw new Error("Select a Variable."); if (selected.variableType === "bool") return { type: "setVariable", variableId: selected.id, value: value.value === "true" }; if (selected.variableType === "int" && !validInt64(value.value)) throw new Error("Enter a canonical signed 64-bit decimal integer."); return { type: "setVariable", variableId: selected.id, value: value.value }; }; break;
    }
    case "choice": {
      const countLocked = existing && payload.options.some(option => !!option.condition);
      const optionHost = document.createElement("div"); optionHost.className = "choice-options"; host.append(optionHost);
      const rows: { text: HTMLInputElement; destination: HTMLSelectElement; row: HTMLElement; guard: ReturnType<typeof buildAvailabilityEditor>; validateText: () => void; validateDestination: () => void }[] = [];
      const addOption = (option: ChoiceOption = { text: "", destinationSceneId: model.scenes[0]?.id ?? "" }): void => {
        const row = document.createElement("div"); row.className = "choice-option";
        const text = input(option.text); text.setAttribute("aria-label", "Choice option text");
        const destination = scenes(option.destinationSceneId); destination.setAttribute("aria-label", "Choice destination Scene");
        row.append(labelled("Choice option text", text), labelled("Choice destination Scene", destination));
        const validateText = validateField(text, () => { requiredText(text, "Choice text"); });
        const validateDestination = validateField(destination, () => { required(destination); });
        const guard = buildAvailabilityEditor(model.authoring.variables, option.condition); row.append(guard.host);
        const remove = button("Remove", "text-button"); remove.disabled = countLocked; remove.addEventListener("click", () => { const index = rows.findIndex(item => item.row === row); if (index >= 0) rows.splice(index, 1); row.remove(); host.dispatchEvent(new Event("input", { bubbles: true })); });
        row.append(remove); rows.push({ text, destination, row, guard, validateText, validateDestination }); controls.push(text, destination); optionHost.append(row);
      };
      payload.options.forEach(addOption); if (!rows.length) addOption();
      const addChoice = button("Add option", "text-button"); addChoice.disabled = countLocked; addChoice.addEventListener("click", () => { addOption(); host.dispatchEvent(new Event("input", { bubbles: true })); }); host.append(addChoice);
      const note = document.createElement("p"); note.textContent = "Availability is unknown in the editor preview. If no options are available, execution continues at the next Beat." + (countLocked ? " To change the number of options, edit this Choice in Source." : ""); host.append(note);
      read = () => {
        if (!rows.length) throw new Error("A Choice needs at least one option.");
        const options = rows.map(row => { row.validateText(); row.validateDestination(); const condition = row.guard.read(); return { text: row.text.value, destinationSceneId: required(row.destination), ...(condition ? { condition } : {}) }; });
        return { type: "choice", options };
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
    case "return": read = () => ({ type: "return" }); break;
    case "customCode": read = () => payload; break;
  }
  const primary = controls[controls.length - 1] ?? host;
  return { host, controls, primary, read: read!, focus: () => (host.querySelector<HTMLElement>('[aria-invalid="true"]') ?? controls[0] as HTMLElement | undefined)?.focus() };
}

function defaultPayload(type: BeatPayload["type"], model: SceneWorkspace): BeatPayload {
  const characterId = model.authoring.characters[0]?.id ?? ""; const appearanceId = model.authoring.appearances.find((item) => item.characterId === characterId)?.id ?? "";
  switch (type) {
    case "background": return { type, assetId: model.authoring.assets.find((item) => item.kind === "background")?.id ?? "", transition: "none" };
    case "showCharacter": return { type, characterId, appearanceId, placement: "centre", transition: "none" };
    case "hideCharacter": return { type, characterId, transition: "none" };
    case "changeAppearance": return { type, characterId, appearanceId, transition: "none" };
    case "placement": return { type, characterId, placement: "centre" };
    case "dialogue": return { type, characterId, text: "" };
    case "narration": return { type, text: "" };
    case "playMusic": return { type, assetId: model.authoring.assets.find((item) => item.kind === "music")?.id ?? "" };
    case "stopMusic": return { type };
    case "playSfx": return { type, assetId: model.authoring.assets.find((item) => item.kind === "sfx")?.id ?? "" };
    case "transition": return { type, transition: "dissolve" };
    case "setVariable": { const variable = model.authoring.variables[0]; return { type, variableId: variable?.id ?? "", value: variable?.defaultValue ?? "" }; }
    case "choice": return { type, options: [{ text: "", destinationSceneId: model.scenes[0]?.id ?? "" }] };
    case "jump": return { type, sceneId: model.scenes[0]?.id ?? "" };
    case "call": return { type, sceneId: model.scenes[0]?.id ?? "", returnLabel: null };
    case "return": return { type };
    case "customCode": return { type, source: "", reason: "Protected source" };
  }
}

function required(control: HTMLSelectElement): string { if (!control.value || control.selectedOptions[0]?.dataset.unavailable === "true") { control.focus(); throw new Error("Select an available item first."); } return control.value; }
function requiredText(control: HTMLInputElement, name: string): string { if (!control.value.trim()) { control.focus(); throw new Error(`${name} is required.`); } return control.value.trim(); }
function validInt64(value: string): boolean { if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false; try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; } }

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
