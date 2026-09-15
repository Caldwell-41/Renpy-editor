import { requestCore as desktopRequestCore } from "./bridge.ts";

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
type ProjectSurface = "story" | "characters" | "assets" | "variables";
type PersistenceStatus = "saved" | "conflict" | "recoveryRequired";

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (rootElement === null) throw new Error("Application root is unavailable.");
const root: HTMLDivElement = rootElement;
let viewGeneration = 0;
let operationGeneration = 0;
let currentProject: OpenProject | undefined;
let coreRequester: typeof desktopRequestCore = desktopRequestCore;
let listenersInstalled = false;

interface CompletionToken { view: number; operation: number; sessionId?: string }

function beginView(project?: OpenProject): number {
  operationGeneration += 1;
  viewGeneration += 1;
  currentProject = project;
  return viewGeneration;
}

function beginCompletion(project?: OpenProject): CompletionToken {
  return { view: viewGeneration, operation: ++operationGeneration, sessionId: project?.sessionId };
}

function completionIsCurrent(token: CompletionToken): boolean {
  return token.view === viewGeneration
    && token.operation === operationGeneration
    && token.sessionId === currentProject?.sessionId;
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
function setStatus(message: string, kind: "normal" | "error" = "normal"): void {
  const status = document.querySelector<HTMLElement>("#app-status"); if (status) { status.textContent = message; status.dataset.kind = kind; }
}
async function value<T>(operation: Parameters<typeof desktopRequestCore>[0], payload: Readonly<Record<string, unknown>> = {}): Promise<T> {
  const response = await coreRequester<T>(operation, payload); if (!response.ok) throw new Error(response.error.message); return response.value;
}
async function projectValue<T>(project: OpenProject, operation: Parameters<typeof desktopRequestCore>[0], payload: Readonly<Record<string, unknown>> = {}): Promise<T> {
  if (currentProject?.sessionId !== project.sessionId) throw new Error("This project view is no longer active.");
  return value<T>(operation, { ...payload, sessionId: project.sessionId });
}
function shell(content: HTMLElement): void {
  const main = document.createElement("main"); main.className = "app-shell";
  const header = document.createElement("header"); header.className = "app-header";
  const brand = button("Loomlight", "brand"); brand.addEventListener("click", () => void (async () => { const project = currentProject; if (!project) { await showWelcome(); return; } const token = beginCompletion(project); try { await projectValue(project, "project.close"); if (completionIsCurrent(token)) await showWelcome(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be closed"), "error"); } })());
  const status = document.createElement("span"); status.id = "app-status"; status.className = "app-status"; status.role = "status"; status.ariaLive = "polite"; status.textContent = "Ready";
  header.append(brand, status); main.append(header, content); root.replaceChildren(main);
}

async function showWelcome(): Promise<void> {
  const generation = beginView();
  const section = document.createElement("section"); section.className = "welcome"; section.setAttribute("aria-labelledby", "welcome-title");
  const intro = document.createElement("div"); intro.className = "welcome-intro";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Visual Ren'Py authoring";
  const heading = document.createElement("h1"); heading.id = "welcome-title"; heading.textContent = "Make room for the story.";
  const summary = document.createElement("p"); summary.className = "lede"; summary.textContent = "Create a conventional Ren'Py project with a quiet, structured workspace around it.";
  const actions = document.createElement("div"); actions.className = "actions";
  const create = button("New Project", "button primary"); create.addEventListener("click", () => { resetWizard(); showWizard(); });
  const open = button("Open Loomlight Project"); open.addEventListener("click", () => void openPickedProject()); actions.append(create, open); intro.append(eyebrow, heading, summary, actions);
  const recentSection = document.createElement("div"); recentSection.className = "recent-section"; const recentHeading = document.createElement("h2"); recentHeading.textContent = "Recent Projects"; recentSection.append(recentHeading);
  section.append(intro, recentSection); shell(section);
  try {
    const recents = await value<RecentProject[]>("project.listRecent");
    if (generation !== viewGeneration || currentProject) return;
    if (!recents.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "Projects you create or open will appear here."; recentSection.append(empty); }
    recents.forEach((recent) => recentSection.append(recentRow(recent)));
  } catch (error) { if (generation === viewGeneration && !currentProject) setStatus(message(error, "Recent Projects unavailable"), "error"); }
}

function recentRow(recent: RecentProject): HTMLElement {
  const row = document.createElement("div"); row.className = "recent-row";
  const open = button(recent.title, "recent-open"); open.disabled = recent.status !== "available"; open.addEventListener("click", () => void openRecent(recent.id));
  const detail = document.createElement("span"); detail.className = "recent-detail"; detail.textContent = recent.status === "available" ? recent.displayPath : `${recent.displayPath} — ${recent.status}`;
  const remove = button("Remove", "text-button"); remove.ariaLabel = `Remove ${recent.title} from Recent Projects`; remove.addEventListener("click", async () => { const token = beginCompletion(); try { await value("project.removeRecent", { recentId: recent.id }); if (completionIsCurrent(token)) await showWelcome(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Recent Project could not be removed"), "error"); } });
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
  const proceed = button(wizard.step === 4 ? "Create Project" : "Continue", "button primary"); proceed.disabled = disabled; proceed.addEventListener("click", next); row.append(proceed); panel.append(row);
}

function renderDetails(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 1 of 4", "Project details", "Name the game and choose exactly where its folder will be created.");
  const title = input(); title.value = wizard.title; title.autocomplete = "off";
  const folder = input(); folder.value = wizard.folderName; folder.autocomplete = "off";
  title.addEventListener("input", async () => { wizard.title = title.value; if (!wizard.folderEdited) { const token = beginCompletion(); try { const generated = await value<{folderName: string}>("system.folderName", { title: title.value }); if (!completionIsCurrent(token)) return; folder.value = generated.folderName; wizard.folderName = generated.folderName; await refreshDestination(); } catch { /* continue validation reports it */ } } });
  folder.addEventListener("input", () => { wizard.folderEdited = true; wizard.folderName = folder.value; void refreshDestination(); });
  const location = document.createElement("div"); location.className = "location-row"; const locationText = document.createElement("code"); locationText.textContent = wizard.parent?.displayPath ?? "No parent folder selected";
  const choose = button("Choose…"); choose.addEventListener("click", async () => { const token = beginCompletion(); try { const selected = await value<ParentChoice>("project.chooseParent"); if (!completionIsCurrent(token)) return; if (!selected.cancelled) { wizard.parent = selected; locationText.textContent = selected.displayPath; await refreshDestination(); } } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Folder unavailable"), "error"); } }); location.append(locationText, choose);
  const preview = document.createElement("p"); preview.id = "destination-preview"; preview.className = "path-preview"; preview.textContent = wizard.destination?.displayPath ?? "The exact final path will appear here.";
  panel.append(field("Game title", title), field("Folder name", folder), field("Parent directory", location), preview);
  navigation(panel, () => void (async () => { try { if (!await refreshDestination()) return; if (!wizard.title.trim() || !wizard.destination?.valid) throw new Error(wizard.destination?.message ?? "Complete the project details."); wizard.step = 2; showWizard(); } catch (error) { setStatus(message(error, "Project details are invalid"), "error"); } })());
}
async function refreshDestination(): Promise<boolean> {
  if (!wizard.parent || !wizard.folderName) return true;
  const token = beginCompletion();
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
  const discoveryToken = beginCompletion();
  try { const discovered = await value<SdkInfo[]>("sdk.discover"); if (!completionIsCurrent(discoveryToken)) return; discovered.forEach(addSdk); if (wizard.browsedSdk && !discovered.some((sdk) => sdk.id === wizard.browsedSdk?.id)) addSdk(wizard.browsedSdk); } catch { if (!completionIsCurrent(discoveryToken)) return; if (wizard.browsedSdk) addSdk(wizard.browsedSdk); setStatus("SDK discovery could not be completed", "error"); }
  if (!list.children.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No compatible managed SDK detected."; list.append(empty); }
  const actions = document.createElement("div"); actions.className = "actions";
  const install = button("Install verified 8.5.3", "button primary"); install.addEventListener("click", async () => { const token = beginCompletion(); install.disabled = true; setStatus("Downloading and verifying Ren'Py 8.5.3…"); try { const sdk = await value<SdkInfo>("sdk.install"); if (!completionIsCurrent(token)) return; wizard.sdk = sdk; showWizard(); } catch (error) { if (!completionIsCurrent(token)) return; setStatus(message(error, "SDK installation failed"), "error"); install.disabled = false; } });
  const browse = button("Browse existing SDK"); browse.addEventListener("click", async () => { const token = beginCompletion(); try { const sdk = await value<SdkInfo>("sdk.browse"); if (!completionIsCurrent(token)) return; if (!sdk.cancelled) { wizard.browsedSdk = sdk; wizard.sdk = sdk.compatible ? sdk : undefined; } showWizard(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "SDK is incompatible"), "error"); } }); actions.append(install, browse); panel.append(actions); navigation(panel, () => { if (wizard.sdk?.compatible) { wizard.step = 3; showWizard(); } }, !wizard.sdk?.compatible);
}

function renderConfiguration(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 3 of 4", "Game configuration", "Choose the virtual resolution. Advanced GUI and theme authoring are not part of this step.");
  const preset = document.createElement("select"); [[1920,1080,"Full HD — 1920 × 1080"],[1280,720,"HD — 1280 × 720"],[2560,1440,"QHD — 2560 × 1440"],[0,0,"Custom"]].forEach(([w,h,label]) => { const option = document.createElement("option"); option.value = `${w}x${h}`; option.textContent = String(label); if (w === wizard.resolution.width && h === wizard.resolution.height) option.selected = true; preset.append(option); });
  const width = input("number"); width.min = "640"; width.max = "7680"; width.step = "2"; width.value = String(wizard.resolution.width); const height = input("number"); height.min = "360"; height.max = "4320"; height.step = "2"; height.value = String(wizard.resolution.height);
  const sync = (): void => { wizard.resolution = { width: Number(width.value), height: Number(height.value) }; }; preset.addEventListener("change", () => { const parts = preset.value.split("x"); const w = Number(parts[0] ?? 0); const h = Number(parts[1] ?? 0); if (w && h) { width.value = String(w); height.value = String(h); sync(); } }); width.addEventListener("input", sync); height.addEventListener("input", sync);
  const dimensions = document.createElement("div"); dimensions.className = "dimension-row"; dimensions.append(field("Width", width), field("Height", height)); panel.append(field("Resolution preset", preset), dimensions);
  navigation(panel, () => { sync(); const {width: w,height: h} = wizard.resolution; if (w >= 640 && w <= 7680 && h >= 360 && h <= 4320 && w % 2 === 0 && h % 2 === 0) { wizard.step = 4; showWizard(); } else setStatus("Use even dimensions between 640×360 and 7680×4320.", "error"); });
}
function renderReview(panel: HTMLElement): void {
  wizardHeading(panel, "New Project · 4 of 4", "Review & Create", "The final folder remains absent until generation and Ren'Py validation succeed.");
  const summary = document.createElement("dl"); summary.className = "review-list"; const values: ReadonlyArray<readonly [string, string]> = [["Title",wizard.title],["Final path",wizard.destination?.displayPath ?? ""],["SDK",`Ren'Py ${wizard.sdk?.version ?? ""}`],["Resolution",`${wizard.resolution.width} × ${wizard.resolution.height}`]]; values.forEach(([term,description]) => { const row = document.createElement("div"); const dt = document.createElement("dt"); dt.textContent = term; const dd = document.createElement("dd"); dd.textContent = description; row.append(dt,dd); summary.append(row); });
  const git = input("checkbox"); git.checked = wizard.initializeGit; git.addEventListener("change", () => { wizard.initializeGit = git.checked; }); panel.append(summary, field("Initialize local Git repository", git)); navigation(panel, () => void createProject());
}
async function createProject(): Promise<void> {
  if (!wizard.parent || !wizard.sdk) return; const panel = document.querySelector<HTMLElement>(".wizard-panel"); if (!panel) return; panel.replaceChildren();
  wizardHeading(panel, "Creating project", "Preparing a safe workspace", "Loomlight is generating, validating, and finalising the project. The final destination will not be merged or overwritten.");
  const progress = document.createElement("ol"); progress.className = "progress-list"; ["Preparing private stage","Generating standard Ren'Py project","Initializing local Git (if selected)","Validating with Ren'Py 8.5.3","Finalising without overwrite"].forEach((text,index) => { const item = document.createElement("li"); item.textContent = text; item.dataset.state = index ? "pending" : "active"; progress.append(item); }); panel.append(progress); setStatus("Creating project…");
  const token = beginCompletion();
  try { const result = await value<CreationResult>("project.create", { parentId: wizard.parent.id, title: wizard.title, folderName: wizard.folderName, sdkId: wizard.sdk.id, width: wizard.resolution.width, height: wizard.resolution.height, initializeGit: wizard.initializeGit }); if (!completionIsCurrent(token)) return; if (!result.project) throw new Error("The project was created but did not open."); [...progress.children].forEach((item) => (item as HTMLElement).dataset.state = "complete"); showProject(result.project); }
  catch (error) { if (!completionIsCurrent(token)) return; [...progress.children].forEach((item) => { if ((item as HTMLElement).dataset.state === "active") (item as HTMLElement).dataset.state = "failed"; }); const failure = document.createElement("p"); failure.className = "error-message"; failure.textContent = message(error, "Project creation failed."); panel.append(failure); const back = button("Back to review"); back.addEventListener("click", showWizard); panel.append(back); setStatus("Creation failed", "error"); }
}
async function openPickedProject(): Promise<void> { const token = beginCompletion(); try { const project = await value<OpenProject>("project.openPicker"); if (completionIsCurrent(token) && !project.cancelled) showProject(project); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be opened"), "error"); } }
async function openRecent(id: string): Promise<void> { const token = beginCompletion(); try { const project = await value<OpenProject>("project.openRecent", { recentId: id }); if (completionIsCurrent(token)) showProject(project); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be opened"), "error"); } }
function showProject(project: OpenProject, surface: ProjectSurface = "story"): void {
  const generation = beginView(project);
  const layout = document.createElement("section"); layout.className = "project-shell";
  const sidebar = document.createElement("aside"); sidebar.className = "story-sidebar";
  const projectName = document.createElement("h2"); projectName.textContent = project.title;
  const sectionLabel = document.createElement("p"); sectionLabel.className = "eyebrow"; sectionLabel.textContent = "Project";
  sidebar.append(projectName, sectionLabel);
  (["story", "characters", "assets", "variables"] as const).forEach((name) => {
    const labels: Record<ProjectSurface, string> = { story: "Story", characters: "Characters", assets: "Assets", variables: "Variables" };
    const nav = button(labels[name], `tree-item${surface === name ? " selected" : ""}`);
    if (surface === name) nav.ariaCurrent = "page";
    nav.addEventListener("click", () => showProject(project, name)); sidebar.append(nav);
  });
  if (surface === "story") {
    const chapter = button(project.chapterName, "tree-item chapter"); chapter.ariaExpanded = "true";
    const scene = button(project.sceneName, "tree-item scene"); sidebar.append(chapter, scene);
  }
  const close = button("Close Project", "text-button close-project"); close.addEventListener("click", async () => { const token = beginCompletion(project); try { await projectValue(project, "project.close"); if (completionIsCurrent(token)) await showWelcome(); } catch (error) { if (completionIsCurrent(token)) setStatus(message(error, "Project could not be closed"), "error"); } }); sidebar.append(close);
  const workspace = document.createElement("div"); workspace.className = surface === "story" ? "empty-workspace" : "supporting-workspace";
  layout.append(sidebar, workspace); shell(layout); setStatus("Checking saved state…");
  if (surface === "story") { renderStoryReady(workspace, project); void refreshPersistenceStatus(project, generation); }
  else void renderAuthoringSurface(workspace, project, surface, generation);
}

async function refreshPersistenceStatus(project: OpenProject, generation: number): Promise<void> {
  const token = beginCompletion(project);
  try {
    const state = await projectValue<PersistenceStatus>(project, "project.status");
    if (generation !== viewGeneration || !completionIsCurrent(token)) return;
    setStatus(state === "saved" ? "Saved" : state === "conflict" ? "Conflict — source changed outside Loomlight" : "Recovery required — writes are disabled", state === "saved" ? "normal" : "error");
  } catch (error) {
    if (generation === viewGeneration && completionIsCurrent(token)) setStatus(message(error, "Saved state could not be checked"), "error");
  }
}

function renderStoryReady(workspace: HTMLElement, project: OpenProject): void {
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = `${project.chapterName} · ${project.sceneName}`;
  const title = document.createElement("h1"); title.textContent = "Project ready";
  const copy = document.createElement("p"); copy.className = "panel-copy"; copy.textContent = `Ren'Py ${project.sdkVersion} · ${project.resolution.width} × ${project.resolution.height}. Scene authoring begins in Phase 1E.`;
  workspace.append(eyebrow, title, copy);
}

async function renderAuthoringSurface(workspace: HTMLElement, project: OpenProject, surface: Exclude<ProjectSurface, "story">, generation: number): Promise<void> {
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Supporting authoring";
  const title = document.createElement("h1"); title.textContent = surface[0]!.toUpperCase() + surface.slice(1);
  workspace.append(eyebrow, title);
  const token = beginCompletion(project);
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
  if (host.querySelector(".inline-editor")) return;
  const editor = document.createElement("div"); editor.className = "inline-editor"; editor.role = "group"; editor.ariaLabel = label;
  const actions = document.createElement("div"); actions.className = "row-actions";
  const submit = button(submitLabel, "button primary"); const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => editor.remove());
  submit.addEventListener("click", async () => { const project = currentProject; const token = beginCompletion(project); submit.disabled = true; cancel.disabled = true; setStatus("Saving…"); try { if (await save(token) === false && completionIsCurrent(token)) { submit.disabled = false; cancel.disabled = false; setStatus("No file selected"); controls[0]?.querySelector<HTMLElement>("input, select")?.focus(); } } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; cancel.disabled = false; setStatus(message(error, `${label} could not be saved`), "error"); controls[0]?.querySelector<HTMLElement>("input, select")?.focus(); } });
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
    appearances.forEach((appearance) => { const item = document.createElement("div"); item.className = "appearance-row"; const label = document.createElement("span"); label.textContent = appearance.label; const mode = document.createElement("code"); mode.textContent = `${appearance.attributes.outfit} · ${appearance.attributes.pose}`; const makeDefault = button(character.defaultAppearanceId === appearance.id ? "Default" : "Set default", "text-button"); makeDefault.disabled = character.defaultAppearanceId === appearance.id; makeDefault.addEventListener("click", async () => { const token = beginCompletion(project); makeDefault.disabled = true; setStatus("Saving…"); try { await projectValue(project, "appearance.setDefault", { characterId: character.id, appearanceId: appearance.id }); if (completionIsCurrent(token)) showProject(project, "characters"); } catch (error) { if (!completionIsCurrent(token)) return; makeDefault.disabled = false; setStatus(message(error, "Default appearance could not be changed"), "error"); makeDefault.focus(); } }); item.append(label, mode, makeDefault); list.append(item); });
  });
  const create = supportingSection(); create.append(formHeading("Create Character"));
  const technical = input(); technical.name = "technicalName"; technical.pattern = "[A-Za-z][A-Za-z0-9_]*";
  const display = input(); display.name = "displayName";
  const color = input("color"); color.value = "#c5c8d0"; color.name = "dialogueColor";
  const submit = button("Create Character", "button primary"); submit.addEventListener("click", async () => { const token = beginCompletion(project); submit.disabled = true; setStatus("Saving…"); try { await projectValue(project, "character.create", { technicalName: technical.value, displayName: display.value, dialogueColor: color.value }); if (completionIsCurrent(token)) showProject(project, "characters"); } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; setStatus(message(error, "Character could not be created"), "error"); technical.focus(); } });
  create.append(field("Technical variable (fixed after creation)", technical), field("Display name", display), field("Dialogue colour", color), submit); workspace.append(list, create);
}

function renderAssets(workspace: HTMLElement, project: OpenProject, model: AuthoringMetadata): void {
  const list = supportingSection(); list.append(formHeading("Project assets"));
  (["background", "characterAppearance", "music", "sfx"] as AssetKind[]).forEach((kind) => { const heading = document.createElement("h3"); heading.textContent = { background: "Backgrounds", characterAppearance: "Character appearances", music: "Music", sfx: "SFX" }[kind]; list.append(heading); const assets = model.assets.filter((item) => item.kind === kind); if (!assets.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "None imported."; list.append(empty); } assets.forEach((asset) => { const row = document.createElement("div"); row.className = "entity-row"; const name = document.createElement("strong"); name.textContent = asset.displayName; const path = document.createElement("code"); path.textContent = asset.relativePath; const discovery = document.createElement("span"); discovery.textContent = `Ren'Py: ${asset.discoveryName} · ${asset.status}`; row.append(name, path, discovery); list.append(row); }); });
  if (model.assets.some((asset) => asset.status === "compatibilityRequired")) { const repair = button("Repair Ren'Py asset names", "button secondary"); repair.addEventListener("click", async () => { const token = beginCompletion(project); repair.disabled = true; setStatus("Saving compatibility declarations…"); try { await projectValue(project, "asset.repairCompatibility"); if (completionIsCurrent(token)) showProject(project, "assets"); } catch (error) { if (!completionIsCurrent(token)) return; repair.disabled = false; setStatus(message(error, "Asset compatibility could not be repaired"), "error"); repair.focus(); } }); list.append(repair); }
  const imported = supportingSection(); imported.append(formHeading("Import background or audio"));
  const kind = document.createElement("select"); [["background","Background"],["music","Music"],["sfx","SFX"]].forEach(([value,label]) => { const option = document.createElement("option"); option.value = value!; option.textContent = label!; kind.append(option); });
  const technical = input(); const display = input();
  const choose = button("Choose and import…", "button primary"); choose.addEventListener("click", async () => { const token = beginCompletion(project); choose.disabled = true; try { const selected = await projectValue<ImportChoice>(project, "asset.chooseImport"); if (!completionIsCurrent(token)) return; if (selected.cancelled) { choose.disabled = false; choose.focus(); return; } setStatus("Saving…"); await projectValue(project, "asset.import", { authorityId: selected.authorityId, kind: kind.value, technicalName: technical.value, displayName: display.value, characterId: null, expression: null }); if (completionIsCurrent(token)) showProject(project, "assets"); } catch (error) { if (!completionIsCurrent(token)) return; choose.disabled = false; setStatus(message(error, "Asset could not be imported"), "error"); technical.focus(); } });
  imported.append(field("Asset kind", kind), field("Technical name", technical), field("Display name", display), choose); workspace.append(list, imported);
}

function renderVariables(workspace: HTMLElement, project: OpenProject, model: AuthoringMetadata): void {
  const list = supportingSection(); list.append(formHeading("Variables"));
  if (!model.variables.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No Variables yet."; list.append(empty); }
  model.variables.forEach((variable) => { const row = document.createElement("div"); row.className = "entity-row"; const name = document.createElement("strong"); name.textContent = variable.technicalName; const type = document.createElement("code"); type.textContent = variable.variableType; const current = document.createElement("span"); current.textContent = String(variable.defaultValue); const edit = button("Edit default"); edit.addEventListener("click", () => { const control = variable.variableType === "bool" ? document.createElement("select") : input(); if (variable.variableType === "bool") { [["false", "False"], ["true", "True"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value!; option.textContent = label!; option.selected = String(variable.defaultValue) === value; control.append(option); }); } else { (control as HTMLInputElement).value = String(variable.defaultValue); (control as HTMLInputElement).inputMode = variable.variableType === "int" ? "numeric" : "text"; } inlineEditor(row, `Edit ${variable.technicalName}`, [field("Default value", control)], "Save Default", async (token) => { const entered = (control as HTMLInputElement | HTMLSelectElement).value; if (variable.variableType === "int" && !validInt64(entered)) throw new Error("Enter a canonical signed 64-bit decimal integer."); const defaultValue: boolean | string = variable.variableType === "bool" ? entered === "true" : entered; await projectValue(project, "variable.update", { id: variable.id, expectedSourceRevision: variable.source.sourceRevision, defaultValue }); if (completionIsCurrent(token)) showProject(project, "variables"); }); }); row.append(name, type, current, edit); list.append(row); });
  const create = supportingSection(); create.append(formHeading("Create Variable")); const technical = input(); const type = document.createElement("select"); ["bool", "int", "string"].forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; type.append(option); }); const defaultValue = input(); const boolValue = document.createElement("select"); [["false", "False"], ["true", "True"]].forEach(([value, label]) => { const option = document.createElement("option"); option.value = value!; option.textContent = label!; boolValue.append(option); }); const valueField = field("Default value", boolValue); const syncControl = (): void => { valueField.replaceChildren(document.createElement("span"), type.value === "bool" ? boolValue : defaultValue); valueField.firstElementChild!.textContent = "Default value"; defaultValue.inputMode = type.value === "int" ? "numeric" : "text"; }; type.addEventListener("change", syncControl); syncControl();
  const submit = button("Create Variable", "button primary"); submit.addEventListener("click", async () => { let parsed: boolean | string = defaultValue.value; if (type.value === "bool") parsed = boolValue.value === "true"; if (type.value === "int" && !validInt64(defaultValue.value)) { setStatus("Enter a canonical signed 64-bit decimal integer.", "error"); defaultValue.focus(); return; } const token = beginCompletion(project); submit.disabled = true; setStatus("Saving…"); try { await projectValue(project, "variable.create", { technicalName: technical.value, variableType: type.value, defaultValue: parsed }); if (completionIsCurrent(token)) showProject(project, "variables"); } catch (error) { if (!completionIsCurrent(token)) return; submit.disabled = false; setStatus(message(error, "Variable could not be created"), "error"); technical.focus(); } }); create.append(field("Technical name (fixed after creation)", technical), field("Type", type), valueField, submit); workspace.append(list, create);
}

function validInt64(value: string): boolean { if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false; try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; } }
function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
function hasUnsubmittedInput(): boolean {
  return root.querySelector('[data-unsubmitted="true"]') !== null;
}

function installListeners(): void {
  if (listenersInstalled) return;
  listenersInstalled = true;
  root.addEventListener("input", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".supporting-workspace")) {
      target.dataset.unsubmitted = "true";
      setStatus("Unsubmitted input");
    }
  });
  root.addEventListener("change", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest(".supporting-workspace")) {
      target.dataset.unsubmitted = "true";
      setStatus("Unsubmitted input");
    }
  });
  window.addEventListener("keydown", (event) => {
    if (!((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s")) return;
    event.preventDefault();
    const project = currentProject;
    if (!project) return;
    const token = beginCompletion(project);
    setStatus("Saving…");
    void projectValue(project, "project.flush").then(() => {
      if (!completionIsCurrent(token)) return;
      setStatus(hasUnsubmittedInput() ? "Unsubmitted input — accepted changes saved" : "Saved");
    }).catch((error) => {
      if (completionIsCurrent(token)) setStatus(message(error, "Save could not be confirmed"), "error");
    });
  });
}

export function startApplication(requester: typeof desktopRequestCore = desktopRequestCore): void {
  coreRequester = requester;
  viewGeneration = 0;
  operationGeneration = 0;
  currentProject = undefined;
  resetWizard();
  installListeners();
  void showWelcome();
}
