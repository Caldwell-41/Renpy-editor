import { assetImport, type ImportBatch } from "./asset-import-ui.ts";
import { icon } from "./icons.ts";
import { catalogue } from "./catalog-ui.ts";
import { operationProgress } from "./operation-progress.ts";
import { openSettings } from "./settings-ui.ts";
import { layoutFor, saveLayout } from "./preferences.ts";
import { RequestLane } from "./request-lane.ts";
import { RuntimeWorkspace } from "./runtime-ui.ts";
import { renderBranches, type FlowWorkspace } from "./branches-ui.ts";
import { completeApplicationClose, requestCore as desktopRequestCore } from "./bridge.ts";
import {
  focusSceneDraft,
  settleSceneDraft,
  hasSceneDraft,
  renderRecoverySurface,
  renderSceneAuthoring,
  type RecoveryReport,
  type SceneCommand,
  type SceneWorkspace,
  type MediaPresentation,
} from "./scene-ui.ts";
import {
  renderSourceWorkspace,
  type SourceDocument,
  type SourceInventory,
  type SourceSaveIntent,
  type SourceTarget,
  type SourceWorkspaceController,
} from "./source-ui.ts";

interface ParentChoice { id: string; displayPath: string; cancelled?: boolean }
interface DestinationPreview { valid: boolean; displayPath: string; message: string }
interface SdkInfo { id: string; version: string; displayName: string; source: string; compatible: boolean; explanation: string; cancelled?: boolean }
interface RecentProject { id: string; projectId: string; title: string; displayPath: string; lastOpenedUnixMs: number; status: "available" | "missing" | "invalid" }
interface Resolution { width: number; height: number }
interface OpenProject { sessionId: string; projectId: string; title: string; folderName: string; chapterId: string; chapterName: string; sceneId: string; sceneName: string; sdkVersion: string; resolution: Resolution; cancelled?: boolean }
interface CreationResult { status: string; project?: OpenProject }
type AssetKind = "background" | "characterAppearance" | "music" | "sfx";
type VariableType = "bool" | "int" | "string";
interface SourceDefinition { path: string; statement: string; sourceRevision: string }
interface Character { id: string; technicalName: string; displayName: string; dialogueColor: string; defaultAppearanceId?: string; source: SourceDefinition }
interface Appearance { id: string; characterId: string; label: string; attributes: Record<string, string>; renderMode: string; assetId: string }
interface Asset { id: string; kind: AssetKind; displayName: string; relativePath: string; discoveryName: string; sha256: string; byteCount: number; status: string }
interface Variable { id: string; technicalName: string; variableType: VariableType; defaultValue: boolean | string; source: SourceDefinition }
interface AuthoringMetadata { schemaVersion: number; projectId: string; characters: Character[]; appearances: Appearance[]; assets: Asset[]; variables: Variable[] }
interface ImportChoice { authorityId: string; displayName: string; byteCount: number; extension: string; cancelled?: boolean }
type ProjectSurface = "story" | "source" | "branches" | "characters" | "assets" | "variables";
type PersistenceStatus = "saved" | "pendingValidation" | "conflict" | "recoveryRequired";
interface SceneTarget { readonly sceneId: string; readonly beatId: string; readonly expectedSourceRevision?: string }
type ProjectTarget = SourceTarget | SceneTarget;

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (rootElement === null) throw new Error("Application root is unavailable.");
const root: HTMLDivElement = rootElement;
let viewGeneration = 0;
let operationGeneration = 0;
let operationGenerations = new WeakMap<object, number>();
const operationScopes = {
  projectOpen: {}, projectClose: {}, projectCreate: {}, persistence: {},
  authoringLoad: {}, sceneLoad: {}, sourceLoad: {}, sourceSave: {}, sourceNavigation: {}, recovery: {}, wizardDestination: {}, wizardSdk: {},
};
const activeAuthoringOperations = new Map<string, number>();
const activeFlushOperations = new Map<string, number>();
const sourceActionScopes = new Map<string, object>();
let currentProject: OpenProject | undefined;
let coreRequester: typeof desktopRequestCore = desktopRequestCore;
let listenersInstalled = false;
let disposeCatalogue: (()=>void) | undefined;
let disposeSceneView: (() => void) | undefined;
let disposeBranchesView: (() => void) | undefined;
let disposeSourceView: (() => void) | undefined;
let sourceRegistrationSequence = 0;
let activeSourceController: { readonly token: number; readonly project: OpenProject; readonly controller: SourceWorkspaceController } | undefined;
let statusRequestSequence = 0;
let runtimeWorkspace: RuntimeWorkspace | undefined;
let lifecycleBusy = false;
let stageDroppedAssets: ((batch:ImportBatch)=>void)|undefined;

declare global {
  interface Window {
    __loomlightDropUnavailable?: ()=>void;
    __loomlightReceiveAssets?: (sessionId:string,batch:ImportBatch)=>void;
    __loomlightScaffoldSmokeMode?: boolean;
    __loomlightInstallSmokeRequester?: (requester: typeof desktopRequestCore) => () => void;
    __loomlightReadSaveTrace?: () => readonly string[];
    __loomlightRequestApplicationClose?: () => void;
  }
}

const saveCommandTrace: string[] = [];
function recordSaveTrace(entry: string): void {
  if (window.__loomlightScaffoldSmokeMode !== true) return;
  saveCommandTrace.push(entry);
  if (saveCommandTrace.length > 32) saveCommandTrace.shift();
}

Object.defineProperty(window, "__loomlightReadSaveTrace", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: (): readonly string[] => [...saveCommandTrace],
});

Object.defineProperty(window, "__loomlightInstallSmokeRequester", {
  configurable: false,
  enumerable: false,
  writable: false,
  value: (requester: typeof desktopRequestCore): (() => void) => {
    if (window.__loomlightScaffoldSmokeMode !== true) throw new Error("Packaged smoke mode is not enabled.");
    const previous = coreRequester;
    coreRequester = requester;
    return (): void => { coreRequester = previous; };
  },
});

interface CompletionToken { view: number; operation: number; scope: object; sessionId?: string }

function beginView(project?: OpenProject): number {
  disposeCatalogue?.();disposeCatalogue=undefined;
  if (currentProject?.sessionId !== project?.sessionId) { runtimeWorkspace?.dispose(); runtimeWorkspace = undefined; }
  disposeBranchesView?.();
  disposeBranchesView = undefined;
  disposeSceneView?.();
  disposeSceneView = undefined;
  disposeSourceView?.();
  disposeSourceView = undefined;
  viewGeneration += 1;
  currentProject = project;
  return viewGeneration;
}

function beginCompletion(project?: OpenProject, scope: object = operationScopes.persistence): CompletionToken {
  const operation = ++operationGeneration;
  operationGenerations.set(scope, operation);
  return { view: viewGeneration, operation, scope, sessionId: project?.sessionId };
}

function completionIsCurrent(token: CompletionToken): boolean {
  return token.view === viewGeneration
    && token.operation === operationGenerations.get(token.scope)
    && token.sessionId === currentProject?.sessionId;
}

function beginAuthoringCompletion(project: OpenProject, scope: object): CompletionToken | undefined {
  if (activeFlushOperations.has(project.sessionId)) {
    setStatus("Flush is still in progress.");
    return undefined;
  }
  if (activeAuthoringOperations.has(project.sessionId)) {
    setStatus("Another authoring operation is still in progress.", "error");
    return undefined;
  }
  const token = beginCompletion(project, scope);
  activeAuthoringOperations.set(project.sessionId, token.operation);
  return token;
}

function finishAuthoringCompletion(token: CompletionToken): void {
  if (token.sessionId && activeAuthoringOperations.get(token.sessionId) === token.operation) {
    activeAuthoringOperations.delete(token.sessionId);
    refreshPersistenceAfterStaleCompletion(token);
  }
}

function finishFlushCompletion(token: CompletionToken): void {
  if (token.sessionId && activeFlushOperations.get(token.sessionId) === token.operation) {
    activeFlushOperations.delete(token.sessionId);
    refreshPersistenceAfterStaleCompletion(token);
  }
}

function refreshPersistenceAfterStaleCompletion(token: CompletionToken): void {
  const project = currentProject;
  if (project && project.sessionId === token.sessionId && token.view !== viewGeneration) {
    void refreshPersistenceStatus(project, viewGeneration);
  }
}

async function runAuthoringOperation<T>(project: OpenProject, scope: object, task: () => Promise<T>): Promise<T> {
  const token = beginAuthoringCompletion(project, scope);
  if (!token) throw new Error("Another persistence operation is still in progress.");
  try {
    return await task();
  } finally {
    finishAuthoringCompletion(token);
  }
}

function registerSourceController(project: OpenProject, controller: SourceWorkspaceController): () => void {
  const token = ++sourceRegistrationSequence;
  activeSourceController = { token, project, controller };
  return () => {
    if (activeSourceController?.token === token) activeSourceController = undefined;
  };
}

function currentSourceController(project: OpenProject): SourceWorkspaceController | undefined {
  const registration = activeSourceController;
  return registration?.project.sessionId === project.sessionId ? registration.controller : undefined;
}

function hasBlockingModal(): boolean {
  return document.querySelector<HTMLElement>('[aria-modal="true"]') !== null;
}

function persistenceMessage(state: PersistenceStatus, localPending: boolean): { readonly text: string; readonly kind: "normal" | "error" } {
  if (state === "recoveryRequired") return { text: "Recovery required — writes are disabled", kind: "error" };
  if (state === "conflict") return { text: "Conflict — Source is invalid, missing, or changed outside Loomlight", kind: "error" };
  if (localPending || state === "pendingValidation") return { text: "Unsaved Source draft", kind: "normal" };
  return { text: hasUnsubmittedInput() ? "Unsubmitted input — accepted changes saved" : "Saved", kind: "normal" };
}

const wizard = {
  step: 1, title: "", folderName: "", folderEdited: false,
  parent: undefined as ParentChoice | undefined,
  destination: undefined as DestinationPreview | undefined,
  sdk: undefined as SdkInfo | undefined,
  browsedSdk: undefined as SdkInfo | undefined,
  resolution: { width: 1920, height: 1080 }, initializeGit: true,
};

function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button"); element.type = "button"; element.className = className; element.textContent = label; return element;
}
let routineStatusTimer:ReturnType<typeof setTimeout>|undefined;
function setStatus(message: string, kind: "normal" | "error" = "normal"): void {
  if(routineStatusTimer)clearTimeout(routineStatusTimer);
  const status=document.querySelector<HTMLElement>("#app-status");
  const apply=():void=>{if(status?.isConnected&&(status.textContent!==message||status.dataset.kind!==kind)){status.textContent=message;status.title=message;status.dataset.kind=kind;}};
  if(kind==="normal"&&["Saving…","Checking saved state…"].includes(message))routineStatusTimer=setTimeout(apply,200);else apply();
}
const requestLane = new RequestLane();
async function value<T>(operation: Parameters<typeof desktopRequestCore>[0], payload: Readonly<Record<string, unknown>> = {}): Promise<T> {
  const capturedView = viewGeneration;
  const retryableRead = ["sdk.discover", "project.status", "source.list", "source.open", "scene.list", "authoring.list", "flow.list", "runtime.resolveDiagnostic"].includes(operation);
  for (let attempt = 0; ; attempt += 1) {
    const requester = coreRequester;
    const response = await requestLane.run(operation, () => requester<T>(operation, payload));
    if (response.ok) return response.value;
    // The host has not checked out the service for this refusal. Retry only reads;
    // writes, trust and process starts are never replayed after an ambiguous result.
    if (!retryableRead || response.error.code !== "RUNTIME_BUSY" || attempt >= 40 || viewGeneration !== capturedView) throw Object.assign(new Error(response.error.message), {code:response.error.code});
    await new Promise(resolve => setTimeout(resolve,25));
  }
}
async function projectValue<T>(project: OpenProject, operation: Parameters<typeof desktopRequestCore>[0], payload: Readonly<Record<string, unknown>> = {}): Promise<T> {
  if (currentProject?.sessionId !== project.sessionId) throw new Error("This project view is no longer active.");
  return value<T>(operation, { ...payload, sessionId: project.sessionId });
}
function shell(content: HTMLElement): void {
  const main = document.createElement("main"); main.className = "app-shell";
  const header = document.createElement("header"); header.className = "app-header";
  const brand = button("Loomlight", "brand"); brand.addEventListener("click", () => void (async () => { if (lifecycleBusy || !await allowSceneNavigation()) return; const project = currentProject; if (!project) { await showWelcome(); return; } await requestProjectClose(project); })());
  const status = document.createElement("span"); status.id = "app-status"; status.className = "app-status"; status.role = "status"; status.ariaLive = "polite"; status.textContent = "Ready";
  const projectLabel = document.createElement("span"); projectLabel.className = "header-project"; projectLabel.textContent = currentProject?.title ?? "";
  brand.prepend(icon("story")); header.append(brand, projectLabel);
  const footer = document.createElement("footer"); footer.className = "app-footer";
  const context = document.createElement("span"); context.textContent = currentProject ? "Local project" : "Local workspace";
  const settings = button("Settings", "text-button shell-settings"); settings.addEventListener("click", () => openSettings(currentProject ? { ...currentProject, runtime: () => { if(runtimeWorkspace){ runtimeWorkspace.panel.hidden=false; runtimeWorkspace.panel.focus(); } } } : undefined));
  footer.append(context,status,settings); main.append(header, content, footer); root.replaceChildren(main);
}

async function showWelcome(): Promise<void> {
  const generation = beginView();
  const section = document.createElement("section"); section.className = "welcome"; section.setAttribute("aria-labelledby", "welcome-title");
  const intro = document.createElement("div"); intro.className = "welcome-intro";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Visual Ren'Py authoring";
  const heading = document.createElement("h1"); heading.id = "welcome-title"; heading.textContent = "Your next story starts here.";
  const summary = document.createElement("p"); summary.className = "lede"; summary.textContent = "Create a project or pick up where you left off.";
  const actions = document.createElement("div"); actions.className = "actions";
  const create = button("New Project", "button primary"); create.addEventListener("click", () => { resetWizard(); showWizard(); });
  const open = button("Open Loomlight Project"); open.addEventListener("click", () => void openPickedProject()); actions.append(create, open); intro.append(eyebrow, heading, summary, actions);
  const recentSection = document.createElement("div"); recentSection.className = "recent-section"; const recentHeading = document.createElement("h2"); recentHeading.textContent = "Recent Projects"; recentSection.append(recentHeading);
  section.append(intro, recentSection); shell(section);
  try {
    const recents = await value<RecentProject[]>("project.listRecent");
    if (generation !== viewGeneration || currentProject) return;

    const search = input("search"); search.className="recent-search"; search.placeholder="Find a project…"; search.ariaLabel="Find a project";
    const results=document.createElement("div"); const empty=document.createElement("p");empty.className="muted";
    const filter=():void=>{results.replaceChildren(); const matches=recents.filter(r=>`${r.title} ${r.displayPath}`.toLowerCase().includes(search.value.toLowerCase())); matches.forEach(r=>results.append(recentRow(r))); empty.textContent=recents.length ? "No matching projects." : "Projects you create or open will appear here."; empty.hidden=matches.length>0;};
    recentSection.append(search,results,empty); search.addEventListener("input",filter);filter();
  } catch (error) { if (generation === viewGeneration && !currentProject) setStatus(message(error, "Recent Projects unavailable"), "error"); }
}

function recentRow(recent: RecentProject): HTMLElement {
  const row = document.createElement("div"); row.className = "recent-row";
  const open = button(recent.title, "recent-open"); open.disabled = recent.status !== "available"; open.addEventListener("click", () => void openRecent(recent.id));
  const detail = document.createElement("span"); detail.className = "recent-detail"; detail.textContent = recent.status === "available" ? recent.displayPath : `${recent.displayPath} — ${recent.status}`;
  const remove = button("Remove", "text-button"); remove.ariaLabel = `Remove ${recent.title} from Recent Projects`; remove.addEventListener("click", async () => { const token = beginCompletion(undefined, remove); try { await value("project.removeRecent", { recentId: recent.id }); if (completionIsCurrent(token)) await showWelcome(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Recent Project could not be removed"), "error"); } });
  const last=document.createElement("span");last.className="recent-time";last.textContent=recent.lastOpenedUnixMs ? new Intl.DateTimeFormat(undefined,{dateStyle:"medium"}).format(recent.lastOpenedUnixMs) : ""; open.append(last);
  row.append(open, detail, remove); return row;
}

function resetWizard(): void { Object.assign(wizard, { step: 1, title: "", folderName: "", folderEdited: false, parent: undefined, destination: undefined, sdk: undefined, browsedSdk: undefined, resolution: { width: 1920, height: 1080 }, initializeGit: true }); }
function showWizard(): void {
  beginView();
  const layout = document.createElement("section"); layout.className = "wizard-layout";
  const rail = document.createElement("nav"); rail.className = "step-rail"; rail.ariaLabel = "New Project steps";
  ["Project details", "Ren'Py SDK", "Game configuration", "Review & Create"].forEach((label, index) => { const item = document.createElement("span"); item.textContent = `${index + 1}. ${label}`; if (wizard.step === index + 1) item.ariaCurrent = "step"; rail.append(item); });
  const panel = document.createElement("div"); panel.className = "wizard-panel"; layout.append(rail, panel); shell(layout);
  if (wizard.step === 1) renderDetails(panel); else if (wizard.step === 2) void renderSdk(panel); else if (wizard.step === 3) renderConfiguration(panel); else renderReview(panel);
}
function wizardHeading(panel: HTMLElement, eyebrowText: string, title: string, description: string): void {
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = eyebrowText; const heading = document.createElement("h1"); heading.textContent = title; const copy = document.createElement("p"); copy.className = "panel-copy"; copy.textContent = description; panel.append(eyebrow, heading, copy);
}
function field(label: string, control: HTMLElement): HTMLLabelElement { const wrapper = document.createElement("label"); wrapper.className = "field"; const text = document.createElement("span"); text.textContent = label; wrapper.append(text, control); return wrapper; }
function input(type = "text"): HTMLInputElement { const element = document.createElement("input"); element.type = type; return element; }
function navigation(panel: HTMLElement, next: () => void, disabled = false): void {
  const row = document.createElement("div"); row.className = "wizard-actions";
  if (wizard.step > 1) { const back = button("Back"); back.addEventListener("click", () => { wizard.step -= 1; showWizard(); }); row.append(back); }
  else { const home=button("Back to home","text-button");home.addEventListener("click",()=>void showWelcome());row.append(home); }
  const proceed = button(wizard.step === 4 ? "Create Project" : "Continue", "button primary"); proceed.disabled = disabled; proceed.addEventListener("click", next); row.append(proceed); panel.append(row);
}

function renderDetails(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 1 of 4", "Project details", "Name the game and choose exactly where its folder will be created.");
  const title = input(); title.value = wizard.title; title.autocomplete = "off";
  const folder = input(); folder.value = wizard.folderName; folder.autocomplete = "off";
  title.addEventListener("input", async () => { wizard.title = title.value; if (!wizard.folderEdited) { const token = beginCompletion(undefined, operationScopes.wizardDestination); try { const generated = await value<{folderName: string}>("system.folderName", { title: title.value }); if (!completionIsCurrent(token)) return; folder.value = generated.folderName; wizard.folderName = generated.folderName; await refreshDestination(); } catch { /* continue validation reports it */ } } });
  folder.addEventListener("input", () => { wizard.folderEdited = true; wizard.folderName = folder.value; void refreshDestination(); });
  const location = document.createElement("div"); location.className = "location-row"; const locationText = document.createElement("code"); locationText.textContent = wizard.parent?.displayPath ?? "No parent folder selected";
  const choose = button("Choose…"); choose.ariaLabel = "Choose parent directory"; choose.addEventListener("click", async () => { const token = beginCompletion(undefined, operationScopes.wizardDestination); try { const selected = await value<ParentChoice>("project.chooseParent"); if (!completionIsCurrent(token)) return; if (!selected.cancelled) { wizard.parent = selected; locationText.textContent = selected.displayPath; await refreshDestination(); } } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Folder unavailable"), "error"); } }); location.append(locationText, choose);
  const preview = document.createElement("p"); preview.id = "destination-preview"; preview.className = "path-preview"; preview.textContent = wizard.destination?.displayPath ?? "The exact final path will appear here.";
  panel.append(field("Game title", title), field("Folder name", folder), field("Parent directory", location), preview);
  navigation(panel, () => void (async () => { try { if (!await refreshDestination()) return; if (!wizard.title.trim() || !wizard.destination?.valid) throw new Error(wizard.destination?.message ?? "Complete the project details."); wizard.step = 2; showWizard(); } catch (error) { setStatus(message(error, "Project details are invalid"), "error"); } })());
}
async function refreshDestination(): Promise<boolean> {
  if (!wizard.parent || !wizard.folderName) return true;
  const token = beginCompletion(undefined, operationScopes.wizardDestination);
  const destination = await value<DestinationPreview>("project.validateDestination", { parentId: wizard.parent.id, folderName: wizard.folderName });
  if (!completionIsCurrent(token)) return false;
  wizard.destination = destination;
  const preview = document.querySelector<HTMLElement>("#destination-preview"); if (preview) { preview.textContent = `${wizard.destination.displayPath} — ${wizard.destination.message}`; preview.dataset.valid = String(wizard.destination.valid); }
  return true;
}

async function renderSdk(panel: HTMLElement): Promise<void> {
  wizardHeading(panel, "New Project · 2 of 4", "Ren'Py SDK", "Loomlight supports exactly Ren'Py 8.5.3 for this project.");
  const list = document.createElement("div"); list.className = "sdk-list"; panel.append(list);
  const addSdk = (sdk: SdkInfo): void => { const row = document.createElement("label"); row.className = "sdk-row"; const radio = input("radio"); radio.name = "sdk"; radio.disabled = !sdk.compatible; radio.checked = wizard.sdk?.id === sdk.id; radio.addEventListener("change", () => { wizard.sdk = sdk; showWizard(); }); const copy = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent = sdk.displayName; const detail = document.createElement("small"); detail.textContent = `${sdk.source} · ${sdk.explanation}`; copy.append(strong, detail); row.append(radio, copy); list.append(row); };
  const discoveryToken = beginCompletion(undefined, operationScopes.wizardSdk);
  try { const discovered = await value<SdkInfo[]>("sdk.discover"); if (!completionIsCurrent(discoveryToken)) return; if(!wizard.sdk && discovered.filter(s=>s.compatible).length===1)wizard.sdk=discovered.find(s=>s.compatible); discovered.forEach(addSdk); if (wizard.browsedSdk && !discovered.some((sdk) => sdk.id === wizard.browsedSdk?.id)) addSdk(wizard.browsedSdk); } catch { if (!completionIsCurrent(discoveryToken)) return; if (wizard.browsedSdk) addSdk(wizard.browsedSdk); setStatus("SDK discovery could not be completed", "error"); }
  if (!list.children.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No compatible managed SDK detected."; list.append(empty); }
  const actions = document.createElement("div"); actions.className = "actions";
  const install = button("Install verified 8.5.3", wizard.sdk?.compatible ? "button secondary" : "button primary"); install.addEventListener("click", async () => {
    if(lifecycleBusy)return; lifecycleBusy=true;
    const token=beginCompletion(undefined,operationScopes.wizardSdk); const controls=[...panel.querySelectorAll<HTMLButtonElement>("button")]; const prior=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);
    const progress=operationProgress(list,"sdk.install");setStatus("Installing SDK…");
    try { const sdk=await value<SdkInfo>("sdk.install"); if(!completionIsCurrent(token))return;wizard.sdk=sdk;showWizard();setStatus("SDK ready"); }
    catch(error){if(completionIsCurrent(token)){progress.fail(message(error,"SDK installation failed"));controls.forEach((c,i)=>c.disabled=prior[i]!);setStatus(message(error,"SDK installation failed"),"error");}}
    finally {progress.dispose();lifecycleBusy=false;}
  });
  const browse = button("Browse existing SDK"); browse.addEventListener("click", async () => { const token = beginCompletion(undefined, operationScopes.wizardSdk); try { const sdk = await value<SdkInfo>("sdk.browse"); if (!completionIsCurrent(token)) return; if (!sdk.cancelled) { wizard.browsedSdk = sdk; wizard.sdk = sdk.compatible ? sdk : undefined; } showWizard(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "SDK is incompatible"), "error"); } }); actions.append(install, browse); panel.append(actions); navigation(panel, () => { if (wizard.sdk?.compatible) { wizard.step = 3; showWizard(); } }, !wizard.sdk?.compatible);
}

function renderConfiguration(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 3 of 4", "Game configuration", "Choose the size of your game window. You can use a preset or enter custom dimensions.");
  const preset = document.createElement("select"); [[1920,1080,"Full HD — 1920 × 1080"],[1280,720,"HD — 1280 × 720"],[2560,1440,"QHD — 2560 × 1440"],[0,0,"Custom"]].forEach(([w,h,label]) => { const option = document.createElement("option"); option.value = `${w}x${h}`; option.textContent = String(label); if (w === wizard.resolution.width && h === wizard.resolution.height) option.selected = true; preset.append(option); });
  const width = input("number"); width.min = "640"; width.max = "7680"; width.step = "2"; width.value = String(wizard.resolution.width); const height = input("number"); height.min = "360"; height.max = "4320"; height.step = "2"; height.value = String(wizard.resolution.height);
  const sync = (): void => { wizard.resolution = { width: Number(width.value), height: Number(height.value) }; }; preset.addEventListener("change", () => { const parts = preset.value.split("x"); const w = Number(parts[0] ?? 0); const h = Number(parts[1] ?? 0); if (w && h) { width.value = String(w); height.value = String(h); sync(); } }); width.addEventListener("input", sync); height.addEventListener("input", sync);
  const dimensions = document.createElement("div"); dimensions.className = "dimension-row"; dimensions.append(field("Width", width), field("Height", height));if(!["1920x1080","1280x720","2560x1440"].includes(`${wizard.resolution.width}x${wizard.resolution.height}`))preset.value="0x0";dimensions.hidden=preset.value!=="0x0";preset.addEventListener("change",()=>{dimensions.hidden=preset.value!=="0x0";}); panel.append(field("Resolution preset", preset), dimensions);
  navigation(panel, () => { sync(); const {width: w,height: h} = wizard.resolution; if (w >= 640 && w <= 7680 && h >= 360 && h <= 4320 && w % 2 === 0 && h % 2 === 0) { wizard.step = 4; showWizard(); } else setStatus("Use even dimensions between 640×360 and 7680×4320.", "error"); });
}
function renderReview(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 4 of 4", "Review & Create", "Check your project details. Loomlight will create and validate the game, then open it.");
  const summary = document.createElement("dl"); summary.className = "review-list"; const values: ReadonlyArray<readonly [string, string]> = [["Title",wizard.title],["Final path",wizard.destination?.displayPath ?? ""],["SDK",`Ren'Py ${wizard.sdk?.version ?? ""}`],["Resolution",`${wizard.resolution.width} × ${wizard.resolution.height}`]]; values.forEach(([term,description]) => { const row = document.createElement("div"); const dt = document.createElement("dt"); dt.textContent = term; const dd = document.createElement("dd"); dd.textContent = description; row.append(dt,dd); summary.append(row); });
  const gitRow=document.createElement("div");const gitTerm=document.createElement("dt");gitTerm.textContent="Local Git";const gitSummary=document.createElement("dd");gitSummary.textContent=wizard.initializeGit?"Initialize repository":"Not enabled";gitRow.append(gitTerm,gitSummary);summary.append(gitRow);
  const git = input("checkbox"); git.checked = wizard.initializeGit; git.addEventListener("change", () => { wizard.initializeGit = git.checked;gitSummary.textContent=git.checked?"Initialize repository":"Not enabled"; }); const advanced=document.createElement("details");advanced.className="advanced-options";const advancedLabel=document.createElement("summary");advancedLabel.textContent="Advanced";advanced.append(advancedLabel,field("Initialize local Git repository",git));panel.append(summary,advanced); navigation(panel, () => void createProject());
}
async function createProject(): Promise<void> {
  if(lifecycleBusy || !wizard.parent || !wizard.sdk)return;
  const panel=document.querySelector<HTMLElement>(".wizard-panel");if(!panel)return;
  lifecycleBusy=true;panel.replaceChildren();wizardHeading(panel,"New project · 4 of 4","Creating your project",wizard.title);
  const progress=operationProgress(panel,"project.create",wizard.initializeGit);const busy=button("Creating…","button primary");busy.disabled=true;const actions=document.createElement("div");actions.className="wizard-actions";actions.append(busy);panel.append(actions);
  const token=beginCompletion(undefined,operationScopes.projectCreate);setStatus("Creating project…");
  try {
    const result=await value<CreationResult>("project.create",{parentId:wizard.parent.id,title:wizard.title,folderName:wizard.folderName,sdkId:wizard.sdk.id,width:wizard.resolution.width,height:wizard.resolution.height,initializeGit:wizard.initializeGit});
    if(!completionIsCurrent(token))return;if(!result.project)throw Object.assign(new Error("Project created, but could not open. Open the created folder."),{code:"CREATED_NOT_OPENED"});showProject(result.project);
  }catch(error){if(!completionIsCurrent(token))return;progress.fail(message(error,"Project creation failed"));actions.replaceChildren();const created=(error as {code?:string}).code==="CREATED_NOT_OPENED";const back=button(created?"Back to home":"Back to review");back.addEventListener("click",()=>{if(created)void showWelcome();else showWizard();});actions.append(back);if(created){const open=button("Open created project…","button primary");open.addEventListener("click",()=>void openPickedProject());actions.append(open);}setStatus(message(error,"Creation failed"),"error");}
  finally{progress.dispose();lifecycleBusy=false;}
}

async function openPickedProject(): Promise<void> { const token = beginCompletion(undefined, operationScopes.projectOpen); try { const project = await value<OpenProject>("project.openPicker"); if (completionIsCurrent(token) && !project.cancelled) showProject(project); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be opened"), "error"); } }
async function openRecent(id: string): Promise<void> { const token = beginCompletion(undefined, operationScopes.projectOpen); try { const project = await value<OpenProject>("project.openRecent", { recentId: id }); if (completionIsCurrent(token)) showProject(project); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be opened"), "error"); } }
function showProject(project: OpenProject, surface: ProjectSurface = "story", target?: ProjectTarget): void {
  const generation = beginView(project);
  const layout = document.createElement("section"); layout.className = "project-shell";
  const layoutKey=`${project.projectId}:${surface}`; layout.dataset.navigationCollapsed=String(layoutFor(layoutKey).navigationCollapsed);
  const sidebar = document.createElement("aside"); sidebar.className = "story-sidebar";
  const projectName = document.createElement("h2"); projectName.textContent = project.title;
  const sectionLabel = document.createElement("p"); sectionLabel.className = "eyebrow"; sectionLabel.textContent = "Project";
  sidebar.append(projectName, sectionLabel);
  (["story", "source", "branches", "characters", "assets", "variables"] as const).forEach((name) => {
    const labels: Record<ProjectSurface, string> = { story: "Story", source: "Source", branches: "Branches", characters: "Characters", assets: "Assets", variables: "Variables" };
    const nav = button(labels[name], `tree-item${surface === name ? " selected" : ""}`);
    nav.prepend(icon(name));nav.title=labels[name];nav.ariaLabel=labels[name];
    if (surface === name) nav.ariaCurrent = "page";
    nav.addEventListener("click", () => {
      if (surface === name && name === "story") return;
      void requestProjectNavigation(project, name);
    });
    sidebar.append(nav);
  });
  const collapse=button("Collapse navigation","text-button navigation-toggle"); collapse.ariaLabel="Toggle navigation size";collapse.addEventListener("click",()=>{const collapsed=layout.dataset.navigationCollapsed!=="true";layout.dataset.navigationCollapsed=String(collapsed);saveLayout(layoutKey,{navigationCollapsed:collapsed});collapse.textContent=collapsed?"Expand":"Collapse navigation";});sidebar.append(collapse);
  const tree = document.createElement("div"); tree.className = "story-tree";
  const treePanel=document.createElement("aside");treePanel.className="project-tree-panel";treePanel.ariaLabel=surface==="story"?"Scenes":"Project files";treePanel.append(tree);
  const hasTree=surface==="story"||surface==="source";
  if(hasTree){layout.classList.add("with-tree");layout.dataset.treeCollapsed=String(layoutFor(layoutKey).treeCollapsed || window.innerWidth<900);const toggle=button("Scenes / files","text-button project-tree-toggle");toggle.ariaLabel="Toggle scene or file list";toggle.addEventListener("click",()=>{layout.dataset.treeCollapsed=String(layout.dataset.treeCollapsed!=="true");saveLayout(layoutKey,{treeCollapsed:layout.dataset.treeCollapsed==="true"});});sidebar.append(toggle);}
  if(hasTree){let width=layoutFor(layoutKey).treeWidth??230;layout.style.setProperty("--tree-width",`${width}px`);const resize=document.createElement("div");resize.className="tree-divider";resize.role="separator";resize.tabIndex=0;resize.ariaLabel="Resize scene or file list";resize.setAttribute("aria-orientation","vertical");treePanel.append(resize);const setWidth=(next:number,save=false):void=>{width=Math.max(160,Math.min(400,Math.round(next)));layout.style.setProperty("--tree-width",`${width}px`);resize.setAttribute("aria-valuenow",String(width));if(save)saveLayout(layoutKey,{treeWidth:width});};resize.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setWidth(width+(e.key==="ArrowLeft"?-10:10),true);}});let start:number|undefined;resize.addEventListener("pointerdown",e=>{start=e.clientX-width;resize.setPointerCapture(e.pointerId);});resize.addEventListener("pointermove",e=>{if(start!==undefined)setWidth(e.clientX-start);});resize.addEventListener("pointerup",()=>{start=undefined;setWidth(width,true);});resize.addEventListener("pointercancel",()=>{start=undefined;});}
  const close = button("Close Project", "text-button close-project"); close.addEventListener("click", async () => { if (!await allowSceneNavigation() || hasBlockingModal()) return; await requestProjectClose(project); }); sidebar.append(close);
  const workspace = document.createElement("div"); workspace.className = surface === "story" ? "scene-workspace" : surface === "source" ? "source-workspace" : surface === "branches" ? "branches-workspace" : "supporting-workspace";
  layout.append(sidebar);if(hasTree)layout.append(treePanel);layout.append(workspace); shell(layout);
  runtimeWorkspace ??= new RuntimeWorkspace({ sessionId: project.sessionId, sdkVersion: project.sdkVersion,
    request: (operation, payload) => value(operation, operation.startsWith("sdk.") ? payload : { ...payload, sessionId: project.sessionId }),
    current: () => currentProject?.sessionId === project.sessionId,
    capture: () => { const capturedGeneration = viewGeneration; return { controller: currentSourceController(project), sceneRoot: root, current: () => capturedGeneration === viewGeneration }; },
    coordinate: task => runAuthoringOperation(project, runtimeWorkspace!, task),
    navigate: target => requestProjectNavigation(project, "source", target),
    refreshPersistence: () => { if (currentProject?.sessionId === project.sessionId) void refreshPersistenceStatus(project, viewGeneration); },
  });
  const shellSave=button(surface==="source"?"Save Source":"Save");shellSave.addEventListener("click",()=>{if(hasBlockingModal())return;const controller=currentSourceController(project);const capture=controller?.captureSaveIntent("toolbar",false);if(controller&&capture?.kind==="captured")void requestSourceSave(project,controller,capture.intent);else if(capture?.kind==="blocked")setStatus(capture.message,"error");else requestProjectFlush(project);});
  document.querySelector(".app-header")?.append(shellSave);
  const settingsButton=document.querySelector<HTMLElement>(".shell-settings");if(settingsButton){settingsButton.classList.add("sidebar-settings");sidebar.insertBefore(settingsButton,close);}
  document.querySelector(".app-header")?.append(runtimeWorkspace.toolbar);
  document.querySelector(".app-shell")?.append(runtimeWorkspace.panel);
  runtimeWorkspace.panel.hidden=true;
  const runtimeToggle=button("Runtime & diagnostics","text-button runtime-toggle");runtimeToggle.addEventListener("click",()=>{if(runtimeWorkspace){runtimeWorkspace.panel.hidden=!runtimeWorkspace.panel.hidden;runtimeToggle.ariaExpanded=String(!runtimeWorkspace.panel.hidden);}});document.querySelector(".app-footer")?.append(runtimeToggle);
  setStatus("Checking saved state…");
  if (surface === "story") void renderStorySurface(workspace, tree, project, generation, target && "sceneId" in target ? target : undefined);
  else if (surface === "source") void renderSourceSurface(workspace, tree, project, generation, target && "path" in target ? target : undefined);
  else if (surface === "branches") {
    disposeBranchesView = renderBranches(workspace, {
      layoutKey,
      load: (refresh) => projectValue<FlowWorkspace>(project, "flow.list", { refresh }),
      source: (location) => { void requestProjectNavigation(project, "source", location ? { path: location.path, byteStart: location.byteStart, byteEnd: location.byteEnd, expectedRevision: location.revision } : undefined); },
      scene: (node, edge) => { void requestProjectNavigation(project, "story", { sceneId: node.sceneId, beatId: edge?.beatId ?? "", expectedSourceRevision: node.location?.revision }); },
      status: setStatus,
    });
    void refreshPersistenceStatus(project, generation);
  }
  else void renderAuthoringSurface(workspace, project, surface, generation);
}

async function requestProjectNavigation(project: OpenProject, surface: ProjectSurface, target?: ProjectTarget): Promise<void> {
  if (hasBlockingModal()) return;
  if((hasSceneDraft(root)||hasUnsubmittedInput()) && !await allowSceneNavigation())return;
  const controller = currentSourceController(project);
  if (!controller) {
    showProject(project, surface, target);
    return;
  }
  try {
    const transition = await runAuthoringOperation(project, operationScopes.sourceNavigation, () => controller.prepareTransition("navigation"));
    if (!transition) return;
    try {
      if (currentProject?.sessionId === project.sessionId) showProject(project, surface, target);
    } finally {
      transition.release();
    }
  } catch (error) {
    if (currentProject?.sessionId === project.sessionId) setStatus(message(error, "Source input could not be retained before navigation"), "error");
  }
}

async function requestSourceSave(project: OpenProject, controller: SourceWorkspaceController, intent: SourceSaveIntent): Promise<void> {
  if (currentSourceController(project) !== controller) {
    setStatus("The captured Source editor is no longer active.", "error");
    return;
  }
  recordSaveTrace(`route=source;origin=${intent.origin};generation=${intent.documentGeneration};phase=start`);
  try {
    const outcome = await runAuthoringOperation(project, operationScopes.sourceSave, () => controller.executeSave(
      intent,
      () => projectValue(project, "project.flush"),
    ));
    recordSaveTrace(`route=source;origin=${intent.origin};generation=${intent.documentGeneration};phase=${outcome.kind};status=${document.querySelector<HTMLElement>("#app-status")?.textContent ?? "missing"}`);
    if (outcome.kind === "busy" || outcome.kind === "blocked") setStatus(outcome.message, "error");
    if (currentProject?.sessionId === project.sessionId) {
      await refreshPersistenceStatus(
        project,
        viewGeneration,
        outcome.kind === "accepted" ? "Source accepted, but project status could not be confirmed" : undefined,
      );
    }
  } catch (error) {
    recordSaveTrace(`route=source;origin=${intent.origin};generation=${intent.documentGeneration};phase=error`);
    if (currentProject?.sessionId === project.sessionId) setStatus(message(error, "Save could not be started"), "error");
  }
}

async function refreshPersistenceStatus(project: OpenProject, generation: number, acceptedStatusFailure?: string): Promise<void> {
  const requestSequence = ++statusRequestSequence;
  const token = beginCompletion(project, operationScopes.persistence);
  try {
    const state = await projectValue<PersistenceStatus>(project, "project.status");
    if (requestSequence !== statusRequestSequence || generation !== viewGeneration || !completionIsCurrent(token)) return;
    if (activeAuthoringOperations.has(project.sessionId) || activeFlushOperations.has(project.sessionId)) return;
    const rendered = persistenceMessage(state, currentSourceController(project)?.hasUnretainedInput() ?? false);
    setStatus(rendered.text, rendered.kind);
  } catch (error) {
    if (requestSequence === statusRequestSequence && generation === viewGeneration && completionIsCurrent(token)) {
      const detail = message(error, "Saved state could not be checked");
      setStatus(acceptedStatusFailure ? `${acceptedStatusFailure}: ${detail}` : detail, "error");
    }
  }
}

async function renderStorySurface(workspace: HTMLElement, tree: HTMLElement, project: OpenProject, generation: number, target?: SceneTarget): Promise<void> {
  const token = beginCompletion(project, operationScopes.sceneLoad);
  try {
    const persistence = await projectValue<PersistenceStatus>(project, "project.status");
    if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    if (persistence === "recoveryRequired") {
      const report = await projectValue<RecoveryReport>(project, "scene.recovery");
      if (generation !== viewGeneration || !completionIsCurrent(token)) return;
      tree.replaceChildren();
      renderRecoverySurface(workspace, report, {
        status: setStatus,
        resolve: async (transactionId, resolution) => {
          const recoveryToken = beginAuthoringCompletion(project, operationScopes.recovery);
          if (!recoveryToken) throw new Error("Another persistence operation is still in progress.");
          try { return await projectValue<RecoveryReport>(project, "scene.resolveRecovery", { transactionId, resolution }); }
          finally { finishAuthoringCompletion(recoveryToken); }
        },
        completed: () => showProject(project, "story"),
      });
      setStatus("Recovery required — writes are disabled", "error");
      return;
    }
    let model = await projectValue<SceneWorkspace>(project, "scene.list");
    if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    if (target?.expectedSourceRevision) {
      const scene = model.scenes.find((item) => item.id === target.sceneId);
      if (!scene || scene.sourceConflict || scene.sourceRevision !== target.expectedSourceRevision || (target.beatId && !scene.beats.some((beat) => beat.id === target.beatId))) {
        setStatus("The mapped origin changed. Return to Branches and refresh the selection.", "error");
        const back = button("Return to Branches"); back.addEventListener("click", () => { void requestProjectNavigation(project, "branches"); }); workspace.append(back);
        return;
      }
    }
    if (target && model.lastOpen.sceneId !== target.sceneId) {
      model = await projectValue<SceneWorkspace>(project, "scene.apply", { expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: { type: "selectScene", sceneId: target.sceneId } });
      if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    }
    disposeSceneView = renderSceneAuthoring(workspace, tree, model, {
      status: setStatus,
      resolution: project.resolution,
      present: (assetId, purpose) => projectValue(project, "media.present", { assetId, purpose }),
      viewSource: (path, byteStart, byteEnd) => { void requestProjectNavigation(project, "source", { path, byteStart, byteEnd }); },
      layoutKey: `${project.projectId}:story`,
      apply: async (command: SceneCommand, expected) => {
        const operationToken = beginAuthoringCompletion(project, command);
        if (!operationToken) throw new Error("Another persistence operation is still in progress.");
        try {
          return await projectValue<SceneWorkspace>(project, "scene.apply", {
            expectedProjectRevision: expected.projectRevision,
            expectedSourceMapRevision: expected.sourceMapRevision,
            command,
          });
        } finally { finishAuthoringCompletion(operationToken); }
      },
    }, target?.beatId);
    setStatus(persistence === "pendingValidation" ? "Unsaved Source draft" : persistence === "conflict" ? "Conflict — Source is invalid, missing, or changed outside Loomlight" : "Saved", persistence === "conflict" ? "error" : "normal");
  } catch (error) {
    if (generation === viewGeneration && completionIsCurrent(token)) setStatus(message(error, "Scene workspace could not be loaded"), "error");
  }
}

async function renderSourceSurface(workspace: HTMLElement, tree: HTMLElement, project: OpenProject, generation: number, target?: SourceTarget): Promise<void> {
  const token = beginCompletion(project, operationScopes.sourceLoad);
  try {
    const inventory = await projectValue<SourceInventory>(project, "source.list");
    if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    const controller = renderSourceWorkspace(workspace, tree, inventory, {
      layoutKey: `${project.projectId}:source`,
      status: setStatus,
      reloadInventory: () => projectValue<SourceInventory>(project, "source.list"),
      open: (selection) => projectValue<SourceDocument>(project, "source.open", { ...selection }),
      update: (request) => projectValue<SourceDocument>(project, "source.updateDraft", request),
      save: (request) => projectValue<SourceDocument>(project, "source.save", request),
      discard: (path) => projectValue<SourceDocument>(project, "source.discard", { path }),
      applyBoth: (request) => projectValue<SourceDocument>(project, "source.applyBoth", request),
      viewScene: (sceneId, beatId) => { void requestProjectNavigation(project, "story", { sceneId, beatId }); },
      requestSave: (sourceController, intent) => requestSourceSave(project, sourceController, intent),
      registerController: (sourceController) => registerSourceController(project, sourceController),
      runCoordinated: (label, task) => {
        let scope = sourceActionScopes.get(label);
        if (!scope) { scope = {}; sourceActionScopes.set(label, scope); }
        return runAuthoringOperation(project, scope, task);
      },
      refreshPersistence: () => { void refreshPersistenceStatus(project, viewGeneration); },
    }, target);
    disposeSourceView = controller.dispose;
    await refreshPersistenceStatus(project, generation);
  } catch (error) {
    if (generation === viewGeneration && completionIsCurrent(token)) setStatus(message(error, "Source workspace could not be loaded"), "error");
  }
}

async function requestProjectClose(project: OpenProject, afterClose: () => void | Promise<void> = showWelcome): Promise<void> {
  if (document.querySelector(".leave-source-dialog") || !await allowSceneNavigation()) return;
  try { if (runtimeWorkspace && !await runtimeWorkspace.beforeClose()) return; }
  catch (error) { setStatus(message(error, "Runtime cleanup failed"), "error"); return; }
  const controller = currentSourceController(project);
  let transition: Awaited<ReturnType<SourceWorkspaceController["prepareTransition"]>>;
  let inventory: SourceInventory;
  try {
    inventory = await runAuthoringOperation(project, operationScopes.projectClose, async () => {
      transition = controller ? await controller.prepareTransition("leave") : undefined;
      if (controller && !transition) throw new Error("Source input could not be retained; the project remains open.");
      const currentInventory = await projectValue<SourceInventory>(project, "source.list");
      if (!currentInventory.dirtyCount) await projectValue(project, "project.close");
      return currentInventory;
    });
    if (!inventory.dirtyCount) {
      transition?.release();
      if (currentProject?.sessionId === project.sessionId) await afterClose();
      return;
    }
    const restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    const backdrop = document.createElement("div"); backdrop.className = "leave-source-dialog"; backdrop.role = "dialog"; backdrop.setAttribute("aria-modal", "true"); backdrop.setAttribute("aria-labelledby", "leave-source-title");
    const panel = document.createElement("section");
    const heading = document.createElement("h2"); heading.id = "leave-source-title"; heading.textContent = "Unaccepted Source drafts";
    const copy = document.createElement("p"); copy.textContent = `${inventory.dirtyCount} Source draft${inventory.dirtyCount === 1 ? " is" : "s are"} held only for this session. Save all, discard all, or cancel closing.`;
    const actions = document.createElement("div"); actions.className = "row-actions";
    controller?.setModalBlocked(true);
    const finishDialog = (restore: boolean): void => {
      backdrop.removeEventListener("keydown", trapFocus);
      backdrop.remove();
      controller?.setModalBlocked(false);
      transition?.release();
      if (restore && restoreFocus?.isConnected) restoreFocus.focus();
    };
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => finishDialog(true));
    const discard = button("Discard All", "button danger");
    const save = button("Save All", "button primary");
    const run = async (operation: "source.saveAll" | "source.discardAll"): Promise<void> => {
      save.disabled = true; discard.disabled = true; cancel.disabled = true; setStatus(operation === "source.saveAll" ? "Validating all Source drafts…" : "Discarding Source drafts…");
      try {
        await runAuthoringOperation(project, operation === "source.saveAll" ? save : discard, async () => {
          await projectValue<SourceInventory>(project, operation);
          await projectValue(project, "project.close");
        });
        finishDialog(false);
        if (currentProject?.sessionId === project.sessionId) await afterClose();
      }
      catch (error) { save.disabled = false; discard.disabled = false; cancel.disabled = false; setStatus(message(error, operation === "source.saveAll" ? "No Source files were saved" : "Source drafts were not discarded"), "error"); save.focus(); }
    };
    const trapFocus = (event: KeyboardEvent): void => {
      if (event.key === "Escape") { event.preventDefault(); cancel.click(); return; }
      if (event.key !== "Tab") return;
      const controls = [cancel, discard, save].filter((item) => !item.disabled);
      if (!controls.length) return;
      const first = controls[0]!; const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    backdrop.addEventListener("keydown", trapFocus);
    discard.addEventListener("click", () => void run("source.discardAll")); save.addEventListener("click", () => void run("source.saveAll"));
    actions.append(cancel, discard, save); panel.append(heading, copy, actions); backdrop.append(panel); root.querySelector(".app-shell")?.append(backdrop); save.focus();
  } catch (error) {
    transition?.release();
    setStatus(message(error, "Project could not be closed"), "error");
  }
}

async function renderAuthoringSurface(workspace: HTMLElement, project: OpenProject, surface: Exclude<ProjectSurface, "story" | "source" | "branches">, generation: number): Promise<void> {
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Supporting authoring";
  const title = document.createElement("h1"); title.textContent = surface[0]!.toUpperCase() + surface.slice(1);
  workspace.append(title);
  const token = beginCompletion(project, operationScopes.authoringLoad);
  try {
    const model = await projectValue<AuthoringMetadata>(project, "authoring.list");
    if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    if (surface === "characters") renderCharacters(workspace, project, model);
    if (surface === "assets") renderAssets(workspace, project, model);
    if (surface === "variables") renderVariables(workspace, project, model);
    await refreshPersistenceStatus(project, generation);
  } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Authoring data could not be loaded"), "error"); }
}

function formHeading(text: string): HTMLHeadingElement { const heading = document.createElement("h2"); heading.textContent = text; return heading; }
function supportingSection(): HTMLElement { const section = document.createElement("section"); section.className = "supporting-section"; return section; }
function inlineEditor(host: HTMLElement, label: string, controls: HTMLElement[], submitLabel: string, save: (token: CompletionToken) => Promise<boolean | void>): void {
  host = host.closest(".catalog-body")?.querySelector<HTMLElement>(".catalog-inspector > div") ?? host;
  if (host.querySelector(".inline-editor")) return;
  const editor = document.createElement("div"); editor.className = "inline-editor"; editor.role = "group"; editor.ariaLabel = label;
  const actions = document.createElement("div"); actions.className = "row-actions";
  const submit = button(submitLabel, "button primary"); const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => editor.remove());
  submit.addEventListener("click", async () => { const project = currentProject; if (!project) return; const token = beginAuthoringCompletion(project, submit); if (!token) return; submit.disabled = true; cancel.disabled = true; setStatus("Saving…"); try { if (await save(token) === false && completionIsCurrent(token)) { submit.disabled = false; cancel.disabled = false; setStatus("No file selected"); controls[0]?.querySelector<HTMLElement>("input, select")?.focus(); } } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; cancel.disabled = false; setStatus(message(error, `${label} could not be saved`), "error"); controls[0]?.querySelector<HTMLElement>("input, select")?.focus(); } finally { finishAuthoringCompletion(token); } });
  actions.append(cancel, submit); editor.append(...controls, actions); host.append(editor); controls[0]?.querySelector<HTMLElement>("input, select")?.focus();
}

function renderCharacters(workspace: HTMLElement, project: OpenProject, model: AuthoringMetadata): void {
  const list = supportingSection(); list.append(formHeading("Characters"));
  if (!model.characters.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No Characters yet."; list.append(empty); }
  model.characters.forEach((character) => {
    const row = document.createElement("div"); row.className = "entity-row";
    const summary = document.createElement("div"); const name = document.createElement("strong"); name.textContent = character.displayName; const technical = document.createElement("code"); technical.textContent = character.technicalName; summary.append(name, technical);
    const appearanceCount = model.appearances.filter((item) => item.characterId === character.id).length; const detail = document.createElement("span"); detail.textContent = `${appearanceCount} appearance${appearanceCount === 1 ? "" : "s"}`;
    const actions = document.createElement("div"); actions.className = "row-actions"; const edit = button("Edit"); edit.addEventListener("click", () => { const displayName = input(); displayName.value = character.displayName; const dialogueColor = input("color"); dialogueColor.value = character.dialogueColor; inlineEditor(row, `Edit ${character.displayName}`, [field("Display name", displayName), field("Dialogue colour", dialogueColor)], "Save Character", async (token) => { if (!displayName.value.trim()) throw new Error("Display name is required."); await projectValue(project, "character.update", { id: character.id, expectedSourceRevision: character.source.sourceRevision, displayName: displayName.value.trim(), dialogueColor: dialogueColor.value }); if (completionIsCurrent(token)) showProject(project, "characters"); }); }); const add = button("Add Appearance"); add.addEventListener("click", () => { const expression = input(); expression.pattern = "[A-Za-z][A-Za-z0-9_]*"; inlineEditor(row, `Add appearance for ${character.displayName}`, [field("Expression token", expression)], "Choose image…", async (token) => { if (!expression.value.trim()) throw new Error("Expression token is required."); const selected = await projectValue<ImportChoice>(project, "asset.chooseImport"); if (!completionIsCurrent(token)) return; if (selected.cancelled) return false; await projectValue(project, "asset.import", { authorityId: selected.authorityId, kind: "characterAppearance", technicalName: expression.value.trim(), displayName: `${character.displayName} — ${expression.value.trim()}`, characterId: character.id, expression: expression.value.trim() }); if (completionIsCurrent(token)) showProject(project, "characters"); return true; }); }); actions.append(edit, add); row.append(summary, detail, actions); list.append(row);
    const appearancesHeading = document.createElement("h3"); appearancesHeading.textContent = `${character.displayName} Appearances`; list.append(appearancesHeading);
    const appearances = model.appearances.filter((item) => item.characterId === character.id);
    appearances.forEach((appearance) => { const item = document.createElement("div"); item.className = "appearance-row"; const label = document.createElement("span"); label.textContent = appearance.label; const mode = document.createElement("code"); mode.textContent = `${appearance.attributes.outfit} · ${appearance.attributes.pose}`; const makeDefault = button(character.defaultAppearanceId === appearance.id ? "Default" : "Set default", "text-button"); makeDefault.disabled = character.defaultAppearanceId === appearance.id; makeDefault.addEventListener("click", async () => { const token = beginAuthoringCompletion(project, makeDefault); if (!token) return; makeDefault.disabled = true; setStatus("Saving…"); try { await projectValue(project, "appearance.setDefault", { characterId: character.id, appearanceId: appearance.id }); if (completionIsCurrent(token)) showProject(project, "characters"); } catch (error) { if (!completionIsCurrent(token)) return; makeDefault.disabled = false; setStatus(message(error, "Default appearance could not be changed"), "error"); makeDefault.focus(); } finally { finishAuthoringCompletion(token); } }); item.append(label, mode, makeDefault); list.append(item); });
  });
  const create = supportingSection(); create.append(formHeading("Create Character"));
  const technical = input(); technical.name = "technicalName"; technical.pattern = "[A-Za-z][A-Za-z0-9_]*";
  const display = input(); display.name = "displayName";
  const color = input("color"); color.value = "#c5c8d0"; color.name = "dialogueColor";
  const submit = button("Create Character", "button primary"); submit.addEventListener("click", async () => { const token = beginAuthoringCompletion(project, submit); if (!token) return; submit.disabled = true; setStatus("Saving…"); try { await projectValue(project, "character.create", { technicalName: technical.value, displayName: display.value, dialogueColor: color.value }); if (completionIsCurrent(token)) showProject(project, "characters"); } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; setStatus(message(error, "Character could not be created"), "error"); technical.focus(); } finally { finishAuthoringCompletion(token); } });
  create.append(field("Technical variable (fixed after creation)", technical), field("Display name", display), field("Dialogue colour", color), submit); workspace.append(list, create);
  const rows=[...list.querySelectorAll<HTMLElement>(":scope > .entity-row")];
  const infos=model.characters.map((character,i)=>{const extra:HTMLElement[]=[];let cursor=rows[i]?.nextElementSibling;while(cursor&&!cursor.classList.contains("entity-row")){const next=cursor.nextElementSibling;extra.push(cursor as HTMLElement);cursor=next;}return {id:character.id,label:character.displayName,assetId:model.appearances.find(a=>a.id===character.defaultAppearanceId)?.assetId??model.appearances.find(a=>a.characterId===character.id)?.assetId,extra};});
  disposeCatalogue=catalogue(workspace,list,create,"Characters",infos,id=>projectValue<MediaPresentation>(project,"media.present",{assetId:id,purpose:"thumbnail"}));
}

function renderAssets(workspace: HTMLElement, project: OpenProject, model: AuthoringMetadata): void {
  const list = supportingSection(); list.append(formHeading("Project assets"));
  (["background", "characterAppearance", "music", "sfx"] as AssetKind[]).forEach((kind) => { const heading = document.createElement("h3"); heading.textContent = { background: "Backgrounds", characterAppearance: "Character appearances", music: "Music", sfx: "SFX" }[kind]; list.append(heading); const assets = model.assets.filter((item) => item.kind === kind); if (!assets.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "None imported."; list.append(empty); } assets.forEach((asset) => { const row = document.createElement("div"); row.className = "entity-row"; const name = document.createElement("strong"); name.textContent = asset.displayName; const path = document.createElement("code"); path.textContent = asset.relativePath; const discovery = document.createElement("span"); discovery.textContent = `Ren'Py: ${asset.discoveryName} · ${asset.status}`; row.append(name, path, discovery); list.append(row); }); });
  if (model.assets.some((asset) => asset.status === "compatibilityRequired")) { const repair = button("Repair Ren'Py asset names", "button secondary"); repair.addEventListener("click", async () => { const token = beginAuthoringCompletion(project, repair); if (!token) return; repair.disabled = true; setStatus("Saving compatibility declarations…"); try { await projectValue(project, "asset.repairCompatibility"); if (completionIsCurrent(token)) showProject(project, "assets"); } catch (error) { if (!completionIsCurrent(token)) return; repair.disabled = false; setStatus(message(error, "Asset compatibility could not be repaired"), "error"); repair.focus(); } finally { finishAuthoringCompletion(token); } }); list.append(repair); }
  const imported = supportingSection(); imported.append(formHeading("Import assets"));
  const importer=assetImport(imported,model.characters,{
    choose:()=>projectValue<ImportBatch>(project,"asset.chooseImports"),
    import:async payload=>{await runAuthoringOperation(project,imported,()=>projectValue(project,"asset.import",payload));},
    complete:()=>{if(currentProject?.sessionId===project.sessionId)showProject(project,"assets");},status:message=>setStatus(message,"error")
  });stageDroppedAssets=importer.stage;workspace.append(list,imported);
  const ordered=(["background","characterAppearance","music","sfx"] as AssetKind[]).flatMap(k=>model.assets.filter(a=>a.kind===k));
  const repair=list.querySelector<HTMLButtonElement>(":scope > button"); if(repair)workspace.append(repair);
  const disposeCards=catalogue(workspace,list,imported,"Assets",ordered.map(a=>{
    const kind={background:"Background",characterAppearance:"Character image",music:"Music",sfx:"Sound effect"}[a.kind];
    const metadata=document.createElement("dl");metadata.className="asset-metadata";
    for(const [label,value] of [["Type",kind],["Ren’Py name",a.discoveryName],["Project path",a.relativePath],["File size",`${(a.byteCount/1024).toFixed(1)} KB`],["Status",a.status]]){const term=document.createElement("dt");term.textContent=label!;const detail=document.createElement("dd");detail.textContent=value!;metadata.append(term,detail);}
    return {id:a.id,label:a.displayName,kind,assetId:["background","characterAppearance"].includes(a.kind)?a.id:undefined,extra:[metadata]};
  }),id=>projectValue<MediaPresentation>(project,"media.present",{assetId:id,purpose:"thumbnail"}));
  disposeCatalogue=()=>{disposeCards();importer.dispose();stageDroppedAssets=undefined;};
}

function renderVariables(workspace: HTMLElement, project: OpenProject, model: AuthoringMetadata): void {
  const list = supportingSection(); list.append(formHeading("Variables"));
  if (!model.variables.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No Variables yet."; list.append(empty); }
  model.variables.forEach((variable) => { const row = document.createElement("div"); row.className = "entity-row"; const name = document.createElement("strong"); name.textContent = variable.technicalName; const type = document.createElement("code"); type.textContent = variable.variableType; const current = document.createElement("span"); current.textContent = String(variable.defaultValue); const edit = button("Edit default"); edit.addEventListener("click", () => { const control = variable.variableType === "bool" ? document.createElement("select") : input(); if (variable.variableType === "bool") { [["false", "False"], ["true", "True"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value!; option.textContent = label!; option.selected = String(variable.defaultValue) === value; control.append(option); }); } else { (control as HTMLInputElement).value = String(variable.defaultValue); (control as HTMLInputElement).inputMode = variable.variableType === "int" ? "numeric" : "text"; } inlineEditor(row, `Edit ${variable.technicalName}`, [field("Default value", control)], "Save Default", async (token) => { const entered = (control as HTMLInputElement | HTMLSelectElement).value; if (variable.variableType === "int" && !validInt64(entered)) throw new Error("Enter a canonical signed 64-bit decimal integer."); const defaultValue: boolean | string = variable.variableType === "bool" ? entered === "true" : entered; await projectValue(project, "variable.update", { id: variable.id, expectedSourceRevision: variable.source.sourceRevision, defaultValue }); if (completionIsCurrent(token)) showProject(project, "variables"); }); }); row.append(name, type, current, edit); list.append(row); });
  const create = supportingSection(); create.append(formHeading("Create Variable")); const technical = input(); const type = document.createElement("select"); ["bool", "int", "string"].forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; type.append(option); }); const defaultValue = input(); const boolValue = document.createElement("select"); [["false", "False"], ["true", "True"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value!; option.textContent = label!; boolValue.append(option); }); const valueField = field("Default value", boolValue); const syncControl = (): void => { valueField.replaceChildren(document.createElement("span"), type.value === "bool" ? boolValue : defaultValue); valueField.firstElementChild!.textContent = "Default value"; defaultValue.inputMode = type.value === "int" ? "numeric" : "text"; }; type.addEventListener("change", syncControl); syncControl();
  const submit = button("Create Variable", "button primary"); submit.addEventListener("click", async () => { let parsed: boolean | string = defaultValue.value; if (type.value === "bool") parsed = boolValue.value === "true"; if (type.value === "int" && !validInt64(defaultValue.value)) { setStatus("Enter a canonical signed 64-bit decimal integer.", "error"); defaultValue.focus(); return; } const token = beginAuthoringCompletion(project, submit); if (!token) return; submit.disabled = true; setStatus("Saving…"); try { await projectValue(project, "variable.create", { technicalName: technical.value, variableType: type.value, defaultValue: parsed }); if (completionIsCurrent(token)) showProject(project, "variables"); } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; setStatus(message(error, "Variable could not be created"), "error"); technical.focus(); } finally { finishAuthoringCompletion(token); } }); create.append(field("Technical name (fixed after creation)", technical), field("Type", type), valueField, submit); workspace.append(list, create);
  const assignmentPanels=model.variables.map(v=>{const panel=document.createElement("section");panel.className="variable-assignments";const heading=formHeading("Assigned in");const note=document.createElement("p");note.className="muted";note.textContent="Known Set Variable Beats only. Custom code is not included.";const result=document.createElement("div");result.textContent="Loading known assignments…";const declaration=document.createElement("details");const label=document.createElement("summary");label.textContent="View declaration";const code=document.createElement("pre");code.textContent=v.source.statement;declaration.append(label,code);panel.append(heading,note,result,declaration);return {panel,result};});
  disposeCatalogue=catalogue(workspace,list,create,"Variables",model.variables.map((v,i)=>({id:v.id,label:v.technicalName,kind:{bool:"Boolean",int:"Integer",string:"Text"}[v.variableType],extra:[assignmentPanels[i]!.panel]})),id=>projectValue<MediaPresentation>(project,"media.present",{assetId:id,purpose:"thumbnail"}));
  const generation=viewGeneration;
  void projectValue<SceneWorkspace>(project,"scene.list").then(scenes=>{if(generation!==viewGeneration)return;model.variables.forEach((v,i)=>{const result=assignmentPanels[i]!.result;result.replaceChildren();let count=0;scenes.scenes.forEach(scene=>scene.beats.forEach((beat,index)=>{if(beat.payload.type!=="setVariable"||beat.payload.variableId!==v.id)return;count++;const link=button(`${scene.displayName} · Beat ${index+1} · ${String(beat.payload.value)}`,"assignment-link");link.addEventListener("click",()=>void requestProjectNavigation(project,"story",{sceneId:scene.id,beatId:beat.id,expectedSourceRevision:scene.sourceRevision}));result.append(link);}));if(!count)result.textContent="No known assignments.";});}).catch(()=>{if(generation===viewGeneration)assignmentPanels.forEach(p=>p.result.textContent="Assignments unavailable. Try reopening this page.");});
}

function validInt64(value: string): boolean { if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false; try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; } }
function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
function hasUnsubmittedInput(): boolean {
  return root.querySelector('[data-unsubmitted="true"]') !== null;
}

async function allowSceneNavigation(): Promise<boolean> {
  if (hasBlockingModal()) return false;
  const supporting = root.querySelector(".supporting-workspace");
  if (supporting?.querySelector('[data-unsubmitted="true"]') && !activeAuthoringOperations.has(currentProject?.sessionId ?? "")) {
    return new Promise(resolve => {
      const previous = document.activeElement as HTMLElement | null;
      const backdrop = document.createElement("div"); backdrop.className = "leave-source-dialog";
      backdrop.role = "dialog"; backdrop.setAttribute("aria-modal", "true"); backdrop.setAttribute("aria-label", "Unsubmitted changes");
      const panel = document.createElement("section");
      const title = document.createElement("h2"); title.textContent = "Keep editing?";
      const copy = document.createElement("p"); copy.textContent = "This page has unsubmitted changes or staged imports. Stay to finish them, or discard them and leave. Imported originals are unaffected.";
      const actions = document.createElement("div"); actions.className = "row-actions";
      const stay = button("Keep editing", "button primary"); const discard = button("Discard and leave", "button danger");
      const finish = (leave: boolean): void => {
        backdrop.remove();
        if (leave) supporting.querySelectorAll<HTMLElement>('[data-unsubmitted="true"]').forEach(el => delete el.dataset.unsubmitted);
        else previous?.focus();
        resolve(leave);
      };
      stay.addEventListener("click", () => finish(false)); discard.addEventListener("click", () => finish(true));
      backdrop.addEventListener("keydown", event => {
        if (event.key === "Escape") { event.preventDefault(); finish(false); }
        if (event.key === "Tab") { event.preventDefault(); (document.activeElement === stay ? discard : stay).focus(); }
      });
      actions.append(stay, discard); panel.append(title, copy, actions); backdrop.append(panel); root.append(backdrop); stay.focus();
    });
  }
  if (!hasSceneDraft(root) || await settleSceneDraft(root)) return true;
  setStatus("Commit or cancel the Scene editor before navigating.", "error");
  focusSceneDraft(root);
  return false;
}

function isMacPlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
}

function isSaveShortcut(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== "s" || event.altKey || event.shiftKey) return false;
  return isMacPlatform()
    ? event.metaKey && !event.ctrlKey
    : event.ctrlKey && !event.metaKey;
}

function requestProjectFlush(project: OpenProject): void {
  if (activeAuthoringOperations.has(project.sessionId)) {
    setStatus("Authoring operation in progress — no additional Flush started");
    return;
  }
  if (activeFlushOperations.has(project.sessionId)) {
    setStatus("Flush is still in progress.");
    return;
  }
  const token = beginCompletion(project, operationScopes.persistence);
  activeFlushOperations.set(project.sessionId, token.operation);
  recordSaveTrace("route=flush;origin=keyboard;context=non-source;phase=start");
  setStatus("Saving…");
  void projectValue(project, "project.flush").then(async () => {
    if (!completionIsCurrent(token)) return;
    const state = await projectValue<PersistenceStatus>(project, "project.status");
    if (!completionIsCurrent(token)) return;
    const rendered = persistenceMessage(state, currentSourceController(project)?.hasUnretainedInput() ?? false);
    setStatus(rendered.text, rendered.kind);
    recordSaveTrace(`route=flush;origin=keyboard;context=non-source;phase=completed;status=${rendered.text}`);
  }).catch((error) => {
    recordSaveTrace("route=flush;origin=keyboard;context=non-source;phase=error");
    if (completionIsCurrent(token)) setStatus(message(error, "Save could not be confirmed"), "error");
  }).finally(() => {
    finishFlushCompletion(token);
  });
}

function installListeners(): void {
  if(!listenersInstalled)window.addEventListener("loomlight-reset-layout",()=>{const layout=root.querySelector<HTMLElement>(".project-shell");if(layout){layout.dataset.navigationCollapsed="false";layout.dataset.treeCollapsed=String(window.innerWidth<900);layout.style.setProperty("--tree-width","230px");}const preview=root.querySelector<HTMLInputElement>('input[aria-label="Preview vertical allocation"]');if(preview){preview.value="34";preview.dispatchEvent(new Event("input"));}root.querySelectorAll<HTMLElement>(".scene-context-inspector,.source-mapping,.branches-controls").forEach(panel=>{if(!panel.querySelector('[data-unsubmitted="true"]'))panel.hidden=true;});});
  if (listenersInstalled) return;
  listenersInstalled = true;
  root.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".inline-editor, .catalog-create")) {
      target.dataset.unsubmitted = "true";
      setStatus("Unsubmitted input");
    }
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".inline-editor, .catalog-create")) {
      target.dataset.unsubmitted = "true";
      setStatus("Unsubmitted input");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (!isSaveShortcut(event)) return;
    event.preventDefault();
    const project = currentProject;
    if (!project) return;
    if (event.isComposing) {
      recordSaveTrace("route=suppressed;origin=keyboard;reason=composition");
      setStatus("Finish text composition before saving.");
      return;
    }
    if (event.repeat) {
      recordSaveTrace("route=suppressed;origin=keyboard;reason=repeat");
      setStatus("Save is already being handled.");
      return;
    }
    if (hasBlockingModal()) { recordSaveTrace("route=suppressed;origin=keyboard;reason=modal"); return; }
    const controller = currentSourceController(project);
    const source = controller?.captureSaveIntent("keyboard", true);
    if (controller && source?.kind === "captured") {
      void requestSourceSave(project, controller, source.intent);
      return;
    }
    if (source?.kind === "blocked") {
      setStatus(source.message, "error");
      return;
    }
    requestProjectFlush(project);
  });
}

export function startApplication(requester: typeof desktopRequestCore = desktopRequestCore): void {
  runtimeWorkspace?.dispose(); runtimeWorkspace = undefined;
  coreRequester = requester;
  saveCommandTrace.length = 0;
  viewGeneration = 0;
  operationGeneration = 0;
  operationGenerations = new WeakMap<object, number>();
  activeAuthoringOperations.clear();
  activeFlushOperations.clear();
  statusRequestSequence += 1;
  currentProject = undefined;
  disposeSceneView?.();
  disposeSceneView = undefined;
  disposeSourceView?.();
  disposeSourceView = undefined;
  activeSourceController = undefined;
  resetWizard();
  installListeners();
  void showWelcome();
}

export function requestApplicationExit(closeWindow: () => Promise<void>): boolean {
  if(lifecycleBusy){setStatus("Please wait for the current operation to finish before closing.");return true;}
  const project = currentProject;
  if (!project) return false;
  void requestProjectClose(project, closeWindow);
  return true;
}

// Native close/quit enters the same runtime cleanup and Source leave flow.
window.__loomlightRequestApplicationClose = async () => {
  if(lifecycleBusy){setStatus("Please wait for the current operation to finish before closing.");return;}
  if (!await allowSceneNavigation() || hasBlockingModal()) return;
  const project=currentProject;
  const finish=async () => { await showWelcome(); await completeApplicationClose(); };
  void (project ? requestProjectClose(project,finish) : completeApplicationClose()).catch(error=>setStatus(message(error,"Application close could not finish"),"error"));
};

window.__loomlightDropUnavailable=()=>setStatus("Wait for the current operation to finish, then drop the files again.","error");
window.__loomlightReceiveAssets=(sessionId,batch)=>{if(currentProject?.sessionId!==sessionId)return;if(stageDroppedAssets)stageDroppedAssets(batch);else setStatus("Open Assets to drop files for import.");};
