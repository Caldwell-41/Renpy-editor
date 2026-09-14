import "./styles.css";
import { requestCore } from "./bridge.ts";

interface ParentChoice { id: string; displayPath: string; cancelled?: boolean }
interface DestinationPreview { valid: boolean; displayPath: string; message: string }
interface SdkInfo { id: string; version: string; displayName: string; source: string; compatible: boolean; explanation: string; cancelled?: boolean }
interface RecentProject { id: string; projectId: string; title: string; displayPath: string; lastOpenedUnixMs: number; status: "available" | "missing" | "invalid" }
interface Resolution { width: number; height: number }
interface OpenProject { projectId: string; title: string; folderName: string; chapterId: string; chapterName: string; sceneId: string; sceneName: string; sdkVersion: string; resolution: Resolution; cancelled?: boolean }
interface CreationResult { status: string; project?: OpenProject }

const rootElement = document.querySelector<HTMLDivElement>("#app");
if (rootElement === null) throw new Error("Application root is unavailable.");
const root: HTMLDivElement = rootElement;

const wizard = {
  step: 1, title: "", folderName: "", folderEdited: false,
  parent: undefined as ParentChoice | undefined,
  destination: undefined as DestinationPreview | undefined,
  sdk: undefined as SdkInfo | undefined,
  resolution: { width: 1920, height: 1080 }, initializeGit: true,
};

function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button"); element.type = "button"; element.className = className; element.textContent = label; return element;
}
function setStatus(message: string, kind: "normal" | "error" = "normal"): void {
  const status = document.querySelector<HTMLElement>("#app-status"); if (status) { status.textContent = message; status.dataset.kind = kind; }
}
async function value<T>(operation: Parameters<typeof requestCore>[0], payload: Readonly<Record<string, unknown>> = {}): Promise<T> {
  const response = await requestCore<T>(operation, payload); if (!response.ok) throw new Error(response.error.message); return response.value;
}
function shell(content: HTMLElement): void {
  const main = document.createElement("main"); main.className = "app-shell";
  const header = document.createElement("header"); header.className = "app-header";
  const brand = button("Loomlight", "brand"); brand.addEventListener("click", () => void showWelcome());
  const status = document.createElement("span"); status.id = "app-status"; status.className = "app-status"; status.role = "status"; status.ariaLive = "polite"; status.textContent = "Ready";
  header.append(brand, status); main.append(header, content); root.replaceChildren(main);
}

async function showWelcome(): Promise<void> {
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
    if (!recents.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "Projects you create or open will appear here."; recentSection.append(empty); }
    recents.forEach((recent) => recentSection.append(recentRow(recent)));
  } catch (error) { setStatus(message(error, "Recent Projects unavailable"), "error"); }
}

function recentRow(recent: RecentProject): HTMLElement {
  const row = document.createElement("div"); row.className = "recent-row";
  const open = button(recent.title, "recent-open"); open.disabled = recent.status !== "available"; open.addEventListener("click", () => void openRecent(recent.id));
  const detail = document.createElement("span"); detail.className = "recent-detail"; detail.textContent = recent.status === "available" ? recent.displayPath : `${recent.displayPath} — ${recent.status}`;
  const remove = button("Remove", "text-button"); remove.ariaLabel = `Remove ${recent.title} from Recent Projects`; remove.addEventListener("click", async () => { await value("project.removeRecent", { recentId: recent.id }); await showWelcome(); });
  row.append(open, detail, remove); return row;
}

function resetWizard(): void { Object.assign(wizard, { step: 1, title: "", folderName: "", folderEdited: false, parent: undefined, destination: undefined, sdk: undefined, resolution: { width: 1920, height: 1080 }, initializeGit: true }); }
function showWizard(): void {
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
  title.addEventListener("input", async () => { wizard.title = title.value; if (!wizard.folderEdited) { try { const generated = await value<{folderName: string}>("system.folderName", { title: title.value }); folder.value = generated.folderName; wizard.folderName = generated.folderName; await refreshDestination(); } catch { /* continue validation reports it */ } } });
  folder.addEventListener("input", () => { wizard.folderEdited = true; wizard.folderName = folder.value; void refreshDestination(); });
  const location = document.createElement("div"); location.className = "location-row"; const locationText = document.createElement("code"); locationText.textContent = wizard.parent?.displayPath ?? "No parent folder selected";
  const choose = button("Choose…"); choose.addEventListener("click", async () => { try { const selected = await value<ParentChoice>("project.chooseParent"); if (!selected.cancelled) { wizard.parent = selected; locationText.textContent = selected.displayPath; await refreshDestination(); } } catch (error) { setStatus(message(error, "Folder unavailable"), "error"); } }); location.append(locationText, choose);
  const preview = document.createElement("p"); preview.id = "destination-preview"; preview.className = "path-preview"; preview.textContent = wizard.destination?.displayPath ?? "The exact final path will appear here.";
  panel.append(field("Game title", title), field("Folder name", folder), field("Parent directory", location), preview);
  navigation(panel, () => void (async () => { try { await refreshDestination(); if (!wizard.title.trim() || !wizard.destination?.valid) throw new Error(wizard.destination?.message ?? "Complete the project details."); wizard.step = 2; showWizard(); } catch (error) { setStatus(message(error, "Project details are invalid"), "error"); } })());
}
async function refreshDestination(): Promise<void> {
  if (!wizard.parent || !wizard.folderName) return; wizard.destination = await value<DestinationPreview>("project.validateDestination", { parentId: wizard.parent.id, folderName: wizard.folderName });
  const preview = document.querySelector<HTMLElement>("#destination-preview"); if (preview) { preview.textContent = `${wizard.destination.displayPath} — ${wizard.destination.message}`; preview.dataset.valid = String(wizard.destination.valid); }
}

async function renderSdk(panel: HTMLElement): Promise<void> {
  wizardHeading(panel, "New Project · 2 of 4", "Ren'Py SDK", "Loomlight supports exactly Ren'Py 8.5.3 for this project.");
  const list = document.createElement("div"); list.className = "sdk-list"; panel.append(list);
  const addSdk = (sdk: SdkInfo): void => { const row = document.createElement("label"); row.className = "sdk-row"; const radio = input("radio"); radio.name = "sdk"; radio.disabled = !sdk.compatible; radio.checked = wizard.sdk?.id === sdk.id; radio.addEventListener("change", () => { wizard.sdk = sdk; showWizard(); }); const copy = document.createElement("span"); const strong = document.createElement("strong"); strong.textContent = sdk.displayName; const detail = document.createElement("small"); detail.textContent = `${sdk.source} · ${sdk.explanation}`; copy.append(strong, detail); row.append(radio, copy); list.append(row); };
  try { (await value<SdkInfo[]>("sdk.discover")).forEach(addSdk); } catch { setStatus("SDK discovery could not be completed", "error"); }
  if (!list.children.length) { const empty = document.createElement("p"); empty.className = "muted"; empty.textContent = "No compatible managed SDK detected."; list.append(empty); }
  const actions = document.createElement("div"); actions.className = "actions";
  const install = button("Install verified 8.5.3", "button primary"); install.addEventListener("click", async () => { install.disabled = true; setStatus("Downloading and verifying Ren'Py 8.5.3…"); try { wizard.sdk = await value<SdkInfo>("sdk.install"); showWizard(); } catch (error) { setStatus(message(error, "SDK installation failed"), "error"); install.disabled = false; } });
  const browse = button("Browse existing SDK"); browse.addEventListener("click", async () => { try { const sdk = await value<SdkInfo>("sdk.browse"); if (!sdk.cancelled && sdk.compatible) wizard.sdk = sdk; showWizard(); } catch (error) { setStatus(message(error, "SDK is incompatible"), "error"); } }); actions.append(install, browse); panel.append(actions); navigation(panel, () => { if (wizard.sdk?.compatible) { wizard.step = 3; showWizard(); } }, !wizard.sdk?.compatible);
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
  try { const result = await value<CreationResult>("project.create", { parentId: wizard.parent.id, title: wizard.title, folderName: wizard.folderName, sdkId: wizard.sdk.id, width: wizard.resolution.width, height: wizard.resolution.height, initializeGit: wizard.initializeGit }); if (!result.project) throw new Error("The project was created but did not open."); [...progress.children].forEach((item) => (item as HTMLElement).dataset.state = "complete"); showProject(result.project); }
  catch (error) { [...progress.children].forEach((item) => { if ((item as HTMLElement).dataset.state === "active") (item as HTMLElement).dataset.state = "failed"; }); const failure = document.createElement("p"); failure.className = "error-message"; failure.textContent = message(error, "Project creation failed."); panel.append(failure); const back = button("Back to review"); back.addEventListener("click", showWizard); panel.append(back); setStatus("Creation failed", "error"); }
}
async function openPickedProject(): Promise<void> { try { const project = await value<OpenProject>("project.openPicker"); if (!project.cancelled) showProject(project); } catch (error) { setStatus(message(error, "Project could not be opened"), "error"); } }
async function openRecent(id: string): Promise<void> { try { showProject(await value<OpenProject>("project.openRecent", { recentId: id })); } catch (error) { setStatus(message(error, "Project could not be opened"), "error"); } }
function showProject(project: OpenProject): void {
  const layout = document.createElement("section"); layout.className = "project-shell"; const sidebar = document.createElement("aside"); sidebar.className = "story-sidebar";
  const projectName = document.createElement("h2"); projectName.textContent = project.title; const sectionLabel = document.createElement("p"); sectionLabel.className = "eyebrow"; sectionLabel.textContent = "Story";
  const chapter = button(project.chapterName, "tree-item chapter"); chapter.ariaExpanded = "true"; const scene = button(project.sceneName, "tree-item scene selected"); scene.ariaCurrent = "page"; sidebar.append(projectName, sectionLabel, chapter, scene);
  const workspace = document.createElement("div"); workspace.className = "empty-workspace"; const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = `${project.chapterName} · ${project.sceneName}`; const title = document.createElement("h1"); title.textContent = "Project ready"; const copy = document.createElement("p"); copy.className = "panel-copy"; copy.textContent = `Ren'Py ${project.sdkVersion} · ${project.resolution.width} × ${project.resolution.height}. Scene authoring begins in Phase 1E.`; const close = button("Close Project"); close.addEventListener("click", async () => { await value("project.close"); await showWelcome(); }); workspace.append(eyebrow,title,copy,close); layout.append(sidebar,workspace); shell(layout); setStatus("Saved");
}
function message(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
void showWelcome();
