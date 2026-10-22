import { icon } from "./icons.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SourceInventory, SourceTarget } from "./source-ui.ts";
import type { ScreenPreview } from "./runtime-preparation.ts";

export interface ScreenNode {
  kind: string; literal: string | null; layout: Record<string, number>;
  span: { start: number; end: number }; parentStart: number | null;
  properties: { property: "xsize" | "ysize"; value: number }[];
  protected: { start: number; end: number }[];
}
export interface ScreenDocument {
  path: string; revision: string; partial: boolean;
  screens: { name: string; nodes: ScreenNode[] }[];
}
interface OwnedScreen { id: string; rootId: string; path: string; name: string; resolved: boolean; sourceRevision: string | null }
interface ScreenCatalog {
  projectRevision: string; sourceMapRevision: string; inventoryRevision: string; owned: OwnedScreen[];
}
interface Draft { document: ScreenDocument; screen: string; index: number; width: string; height: string }
interface CanvasFrame {
  phase: "starting" | "ready" | "stale" | "unavailable";
  frameId?: string; revision?: string; image?: string; width?: number; height?: number;
  buttonState?: string;
  message?: string;
  geometry?: { start: number; x: number; y: number; width: number; height: number }[];
}
interface Actions {
  resolution: { width: number; height: number };
  request: <T>(operation: CoreOperation, payload?: Record<string, unknown>) => Promise<T>;
  coordinate: <T>(task: () => Promise<T>) => Promise<T>;
  current: () => boolean;
  source: (target: SourceTarget) => void;
  preview: (target: ScreenPreview, validate: boolean) => void;
  saved: () => void;
}
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
};
const button = (label: string, run: () => void, className = "button secondary") => {
  const result = el("button", className, label); result.type = "button"; result.onclick = run; return result;
};
const size = (node: ScreenNode | undefined, property: "xsize" | "ysize") => node?.properties.find(p => p.property === property)?.value;
const names: Record<string, string> = { screen: "Screen root", frame: "Help frame", fixed: "Free layout group", vbox: "Vertical group", text: "Text", image: "Image", textbutton: "Button" };

/** One session owns drafts, including while another workspace is visible. Source owns saved values. */
export class ScreensWorkspace {
  readonly panel = el("section", "screens-editor");
  private readonly message = el("p", "screen-message");
  private readonly selection = el("select");
  private readonly card = el("section", "screen-card");
  private readonly canvas = el("div", "screen-game");
  private readonly stage = el("section", "screen-stage");
  private readonly canvasStatus = el("p", "muted screen-canvas-status");
  private frame?: CanvasFrame;
  private canvasKey = "";
  private canvasSequence = 0;
  private canvasTimer?: ReturnType<typeof setTimeout>;
  private geometryCurrent = false;
  private focusResize = false;
  private readonly gameResolution: {width:number; height:number};
  private zoom = "fit";
  private buttonState = "normal";
  private readonly textSamples = new Map<string,{revision:string; screen:string; path:string; index:number; value:string}>();
  private readonly rail = el("nav", "screen-steps");
  private readonly drafts = new Map<string, Draft>();
  private documents: ScreenDocument[] = [];
  private catalog?: ScreenCatalog;
  private owned?: OwnedScreen;
  private creation?: { name: string; base: ScreenCatalog };
  private creationDialog?: HTMLDialogElement;
  private doc?: ScreenDocument;
  private screen = "";
  private selected = 0;
  private step = "choose";
  private busy = false;
  private disposed = false;
  private loadSequence = 0;
  private scale = 1;
  private resize?: { width: number; height: number; x: number; y: number; pointer: number; handle: HTMLElement };
  private readonly observer: ResizeObserver;
  constructor(private readonly actions: Actions) {
    this.gameResolution = {...actions.resolution};
    const heading = el("header", "screen-heading"); heading.append(el("h1", "", "Screens"));
    const tools = el("div", "screen-tools");
    tools.append(button("Undo", () => void this.history("undo")), button("Redo", () => void this.history("redo")),
      button("Refresh Source", () => void this.load()), button("View in Source", () => this.openSource()),
      button("Validate screen", () => this.test(true)), button("Test in Ren'Py", () => this.test(false), "button primary"));
    heading.append(tools);
    this.selection.ariaLabel = "Screen"; this.selection.onchange = () => {
      const [path, name] = JSON.parse(this.selection.value) as [string, string];
      this.owned = path === "owned" ? this.catalog?.owned.find(s => s.id === name) : undefined;
      this.doc = this.documents.find(d => d.path === (this.owned?.path ?? path));
      if (this.owned && !this.owned.resolved) this.doc = undefined;
      this.screen = this.owned?.name ?? name; this.selected = 0; this.render(); this.reportUnresolved();
    };
    const picker = el("label", "screen-picker", "Screen "); picker.append(this.selection);
    const limits = el("p", "muted screen-limits", "Blank custom screens and existing width and height edits. Adding elements, movement, styles, assets and Story Connect are not available yet.");
    for (const [id, label] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
      this.rail.append(button(label!, () => { this.step = id!; this.renderCard(); }));
    }
    this.rail.ariaLabel = "Screen building steps";
    const caption = el("div", "screen-canvas-tools");
    const aspects = el("select"); aspects.ariaLabel = "Canvas resolution (sample)";
    const secondary = actions.resolution.width===1024 && actions.resolution.height===768 ? {width:1280,height:720} : {width:1024,height:768};
    const resolutions=[actions.resolution,secondary];
    for (const [index,resolution] of resolutions.entries()) {
      const option=el("option","",`${index===0 ? "Project" : "Sample"} ${resolution.width} × ${resolution.height}`);
      option.value=`${resolution.width}x${resolution.height}`; aspects.append(option);
    }
    aspects.onchange=() => {
      if(this.hasDraft()) { aspects.value=`${this.gameResolution.width}x${this.gameResolution.height}`; this.note("Apply or cancel the draft before changing the canvas resolution. Input retained."); return; }
      const resolution=resolutions.find(r=>`${r.width}x${r.height}`===aspects.value); if(!resolution)return;
      Object.assign(this.gameResolution,resolution); this.renderCanvas();
    };
    const zoom=el("select"); zoom.ariaLabel="Canvas zoom";
    for (const [value,label] of [["fit","Fit"],["100","100% (game pixels)"]]) { const option=el("option","",label); option.value=value!; zoom.append(option); }
    zoom.onchange=() => {this.zoom=zoom.value; this.renderCanvas();};
    const state=el("select"); state.ariaLabel="Button state (sample)";
    for(const value of ["normal","hover"]) {const option=el("option","",`Button sample: ${value}`);option.value=value;state.append(option);}
    state.onchange=()=>{this.buttonState=state.value;this.renderCanvas();};
    caption.append(el("h2", "", "Screen canvas"),aspects,zoom,state);
    const viewport = el("div", "screen-viewport"); viewport.append(this.canvas);
    this.canvasStatus.role = "status";
    this.stage.ariaLabel = "Screen canvas"; this.stage.append(caption, viewport, this.canvasStatus,
      el("p", "muted", "Canvas controls select elements. Editing never runs game scripts or actions. Test in Ren'Py runs accepted source."));
    const workspace = el("div", "screen-flow"); workspace.append(this.rail, this.stage, this.card);
    this.message.role = "status"; this.message.ariaLive = "polite";
    this.panel.append(heading, picker, workspace, limits, this.message);
    this.panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { if (this.resize) this.cancelResize(); else this.cancel(); event.stopPropagation(); }
    });
    this.observer = new ResizeObserver(() => this.renderCanvas()); this.observer.observe(viewport);
  }
  mount(host: HTMLElement): void { host.append(this.panel); void this.load(); }
  dispose(): void { this.disposed = true; this.canvasSequence++; clearTimeout(this.canvasTimer); this.observer.disconnect(); this.cancelResize(); this.closeCreationDialog(); }
  hasDraft(): boolean { return this.drafts.size > 0 || !!this.resize || !!this.creation; }
  private current(): boolean { return !this.disposed && this.actions.current(); }
  private nodes(): ScreenNode[] { return this.doc?.screens.find(s => s.name === this.screen)?.nodes ?? []; }
  private key(): string { return JSON.stringify([this.doc?.path, this.screen, this.selected]); }
  private draft(): Draft | undefined { return this.drafts.get(this.key()); }
  private note(text: string, error = false): void {
    this.message.textContent = text; this.message.dataset.error = String(error);
    const status = this.creationDialog?.querySelector<HTMLElement>('[role="status"]');
    if (status) { status.textContent = text; status.dataset.error = String(error); }
  }
  async load(): Promise<void> {
    if (this.busy || this.resize) { this.note("Finish the current operation first. Input retained.", true); return; }
    const sequence = ++this.loadSequence;
    try {
      const inventory = await this.actions.request<SourceInventory>("source.list");
      const catalog = await this.actions.request<ScreenCatalog>("screens.list");
      const documents: ScreenDocument[] = [];
      for (const file of inventory.files) {
        if (!/^game\/ui\/[A-Za-z_][A-Za-z_0-9]{0,63}\.rpy$/.test(file.path)) continue;
        if (catalog.owned.some(s => s.path === file.path && !s.resolved)) continue;
        try { documents.push(await this.actions.request<ScreenDocument>("screens.inspect", { path: file.path })); }
        catch (error) {
          const owned = catalog.owned.find(s => s.path === file.path);
          if (!owned) throw error;
          owned.resolved = false;
        }
      }
      if (!this.current() || sequence !== this.loadSequence) return;
      catalog.owned.forEach(owned => {
        const document = documents.find(d => d.path === owned.path);
        if (!document || document.revision !== owned.sourceRevision || !document.screens.some(s => s.name === owned.name)) owned.resolved = false;
      });
      const path = this.doc?.path; this.documents = documents; this.catalog = catalog;
      const supported = documents.filter(d => d.screens.length > 0);
      if (this.owned) this.owned = catalog.owned.find(s => s.id === this.owned!.id) ?? { ...this.owned, resolved: false };
      else if (!path) this.owned = catalog.owned[0];
      this.doc = this.owned ? this.owned.resolved ? supported.find(d => d.path === this.owned!.path) : undefined : supported.find(d => d.path === path) ?? supported[0];
      if (this.owned) this.screen = this.owned.name;
      if (!this.owned && !this.doc?.screens.some(s => s.name === this.screen)) this.screen = this.doc?.screens[0]?.name ?? "";
      this.selected = Math.min(this.selected, Math.max(0, this.nodes().length - 1));
      this.selection.replaceChildren();
      const owned = [...catalog.owned];
      if (this.owned && !owned.some(s => s.id === this.owned!.id)) owned.push(this.owned);
      owned.forEach(s => { const option = el("option", "", `${s.name} · ${s.path}${s.resolved ? " · owned" : " · unresolved"}`); option.value = JSON.stringify(["owned", s.id]); this.selection.append(option); });
      documents.forEach(d => d.screens.forEach(s => { if (catalog.owned.some(o => o.path === d.path && o.name === s.name)) return; const option = el("option", "", `${s.name} · ${d.path}`); option.value = JSON.stringify([d.path, s.name]); this.selection.append(option); }));
      this.selection.value = this.owned ? JSON.stringify(["owned", this.owned.id]) : JSON.stringify([this.doc?.path, this.screen]);
      this.render(); this.note(this.doc ? this.hasDraft() ? "Source refreshed. Unfinished drafts retain their original revision." : "Saved screen loaded. Unsupported regions remain in Source." : "No supported custom screens in game/ui. Create a blank screen from Choose.");
      this.reportUnresolved();
    } catch (error) { if (this.current() && sequence === this.loadSequence) this.note(`${(error as Error).message} Input retained.`, true); }
  }
  private render(): void { this.renderCard(); this.renderCanvas(); }
  private choose(index: number, design = false): void {
    if (this.resize) return;
    this.selected = index; if (design) this.step = "design"; this.render();
  }
  private renderCard(): void {
    const scroll = this.card.scrollTop;
    [...this.rail.querySelectorAll("button")].forEach((b, i) => b.ariaPressed = String(["choose", "design", "connect"][i] === this.step));
    this.card.replaceChildren(); this.card.ariaLabel = "Selected properties";
    const node = this.nodes()[this.selected];
    this.card.append(el("h2", "", this.step === "choose" ? "Choose an element" : names[node?.kind ?? ""] ?? "Screen"));
    if (this.step === "choose") {
      this.card.append(button("New blank screen", () => this.beginCreation()));
      if (this.creation) this.renderCreation();
      this.card.append(el("p", "muted", "Click a row to select it. Double-click or Enter opens Design."));
      const list = el("div", "screen-tree"); list.role = "listbox"; list.ariaLabel = "Elements";
      this.nodes().forEach((node, index) => {
        const row = button(`${names[node.kind] ?? node.kind}${node.literal ? ` · ${node.literal}` : ""}`, () => this.choose(index));
        row.prepend(icon(node.kind === "image" ? "assets" : node.kind === "text" ? "source" : "panel"));
        row.role = "option"; row.ariaSelected = String(index === this.selected); row.tabIndex = index === this.selected ? 0 : -1;
        let depth = 0, parent = node.parentStart;
        while (parent !== null && depth < 32) { depth++; parent = this.nodes().find(n => n.span.start === parent)?.parentStart ?? null; }
        row.style.paddingLeft = `${12 + depth * 14}px`; row.title = `${names[node.kind] ?? node.kind}. ${node.protected.length ? "Contains source-only details." : "Supported node."}`;
        row.ondblclick = () => this.choose(index, true);
        row.onkeydown = event => {
          if (event.key === "Enter") { event.preventDefault(); this.choose(index, true); }
          if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); this.choose(Math.max(0, Math.min(this.nodes().length - 1, index + (event.key === "ArrowUp" ? -1 : 1)))); this.card.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(); }
        };
        list.append(row);
      }); this.card.append(list);
    } else if (this.step === "connect") {
      this.card.append(el("p", "muted", "Button actions and Story connections remain in Source. The canvas never runs game actions."), button("View in Source", () => this.openSource()));
    } else if (node) {
      this.card.append(el("p", "muted", `${node.kind} · Edit existing literal dimensions, then apply your changes.`));
      if(node.kind==="text" || node.kind==="textbutton") {
        const label=el("label","screen-text-sample","Canvas text sample");
        const input=el("textarea"); input.ariaLabel="Canvas text sample";input.maxLength=8192;
        input.value=this.textSamples.get(this.key())?.value ?? node.literal ?? "";
        input.oninput=()=>{this.textSamples.set(this.key(),{revision:this.doc!.revision,screen:this.screen,path:this.doc!.path,index:this.selected,value:input.value});this.renderCanvas();};
        label.append(input);this.card.append(label,el("p","muted","Sample only. Source and runtime values do not change."),button("Use source text",()=>{this.textSamples.delete(this.key());this.renderCard();this.renderCanvas();}));
      }
      const details = el("details", "screen-properties"); details.open = true;
      details.append(el("summary", "", "Position & size"));
      if (size(node, "xsize") !== undefined && size(node, "ysize") !== undefined) {
        const draft = this.draft();
        const fields = el("div", "screen-size-fields");
        for (const [label, key, property] of [["Width", "width", "xsize"], ["Height", "height", "ysize"]] as const) {
          const input = el("input"); input.type = "number"; input.min = "1"; input.max = "16384"; input.step = "1";
          input.ariaLabel = label; input.dataset.size = key; input.value = draft?.[key] ?? String(size(node, property)); input.readOnly = this.busy;
          const field = el("label", "", `${label} (px)`); field.append(input); fields.append(field);
          input.oninput = () => { if (this.busy) return; const value = this.ensureDraft(); value[key] = input.value; this.renderCanvas(); };
          input.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); void this.apply(); } };
        }
        const actions = el("div", "screen-edit-actions");
        const apply = button("Apply changes", () => void this.apply(), "button primary"); apply.ariaDisabled = String(this.busy);
        const cancel = button("Cancel changes", () => this.cancel()); cancel.ariaDisabled = String(this.busy);
        actions.append(apply, cancel); details.append(fields, actions, el("p", "muted", "Whole numbers from 1 to 16384. Use arrows for one pixel; Shift + arrows on the resize handle changes eight pixels."));
      } else details.append(el("p", "muted", "This node needs existing literal xsize and ysize to resize. Other properties remain editable in Source."));
      this.card.append(details);
    }
    this.card.append(el("p", "muted screen-coverage", this.doc?.partial ? "Partial coverage. Custom Python, actions, styling and unsupported regions are preserved in Source." : "Only existing literal dimensions can change here."));
    this.card.scrollTop = scroll;
  }
  private reportUnresolved(): void {
    if (this.owned && !this.owned.resolved) this.note(`Unresolved owned screen ${this.owned.name}. Review its declaration and ownership marker in ${this.owned.path}, then refresh Source.`, true);
  }
  private beginCreation(): void {
    if (this.busy || this.hasDraft() || !this.catalog) { this.note("Finish or cancel unfinished changes before creating a screen. Input retained.", true); return; }
    this.creation = { name: "", base: this.catalog }; this.renderCard(); this.creationDialog?.querySelector<HTMLInputElement>('[aria-label="Screen name"]')?.focus();
  }
  private renderCreation(): void {
    if (this.creationDialog?.isConnected) return;
    const input = el("input"); input.ariaLabel = "Screen name"; input.value = this.creation!.name; input.maxLength = 64;
    input.readOnly = this.busy; input.oninput = () => { if (!this.busy && this.creation) this.creation.name = input.value; };
    input.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); void this.create(); } };
    const label = el("label", "", "Screen name"); label.append(input);
    const form = el("dialog", "screen-create"); form.ariaLabel = "New blank screen";
    const actions = el("div", "screen-create-actions");
    actions.append(button("Cancel creation", () => { if (!this.busy) { this.creation = undefined; this.closeCreationDialog(); this.renderCard(); this.card.querySelector<HTMLButtonElement>("button")?.focus(); this.note("Creation cancelled. No source was written."); } }), button("Create blank screen", () => void this.create(), "button primary"));
    const status = el("p"); status.role = "status"; status.ariaLive = "polite";
    form.append(el("h2", "", "New blank screen"), label, el("p", "muted", "Use a source name such as travel_notes. Use letters, numbers and underscores, starting with a letter or a single underscore."), status, actions);
    form.oncancel = event => { event.preventDefault(); this.cancel(); };
    this.creationDialog = form; this.panel.append(form); form.showModal();
  }
  private closeCreationDialog(): void {
    this.creationDialog?.close(); this.creationDialog?.remove(); this.creationDialog = undefined;
  }
  private async create(): Promise<void> {
    const draft = this.creation; if (!draft || this.busy) return;
    if (!/^[A-Za-z_][A-Za-z_0-9]{0,63}$/.test(draft.name)) { this.note("Enter a valid screen name. Input retained.", true); return; }
    this.busy = true; this.loadSequence++; this.creationDialog!.querySelector<HTMLInputElement>('[aria-label="Screen name"]')!.readOnly = true;
    try {
      const catalog = await this.actions.coordinate(() => this.actions.request<ScreenCatalog>("screens.create", {
        name: draft.name, expectedProjectRevision: draft.base.projectRevision, expectedSourceMapRevision: draft.base.sourceMapRevision, expectedInventoryRevision: draft.base.inventoryRevision,
      }));
      if (!this.current()) return;
      this.owned = catalog.owned.find(s => !draft.base.owned.some(old => old.id === s.id));
      this.creation = undefined; this.closeCreationDialog(); this.selected = 0; this.actions.saved();
    } catch (error) { if (this.current()) this.note(`${(error as Error).message} Input retained. Cancel creation and refresh Source before trying again.`, true); }
    finally { this.busy = false; if (this.current()) { const input = this.creationDialog?.querySelector<HTMLInputElement>('[aria-label="Screen name"]'); if (input) input.readOnly = false; if (!this.creation) { await this.load(); this.card.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(); } } }
  }
  private updateSizeControls(): void {
    const node = this.nodes()[this.selected], draft = this.draft();
    for (const input of this.card.querySelectorAll<HTMLInputElement>("input[data-size]")) {
      const key = input.dataset.size as "width" | "height";
      const value = draft?.[key] ?? String(size(node, key === "width" ? "xsize" : "ysize"));
      if (input.value !== value) input.value = value;
      input.readOnly = this.busy;
    }
    this.card.ariaBusy = String(this.busy);
    this.card.querySelectorAll<HTMLButtonElement>(".screen-edit-actions button").forEach(b => b.ariaDisabled = String(this.busy));
  }
  private ensureDraft(): Draft {
    let draft = this.draft();
    if (!draft) { const node = this.nodes()[this.selected]!; draft = { document: this.doc!, screen: this.screen, index: this.selected, width: String(size(node, "xsize")), height: String(size(node, "ysize")) }; this.drafts.set(this.key(), draft); }
    return draft;
  }
  private cancel(): void {
    if (this.busy) { this.note("The edit is being accepted. Input retained until its result arrives."); return; }
    if (this.creation) { this.creation = undefined; this.closeCreationDialog(); this.renderCard(); this.card.querySelector<HTMLButtonElement>("button")?.focus(); }
    this.drafts.delete(this.key()); this.updateSizeControls(); this.renderCanvas(); this.note("Changes cancelled. No source was written.");
  }
  private async apply(): Promise<void> {
    const draft = this.draft(); if (!draft || this.busy) return;
    if (![draft.width, draft.height].every(v => /^[1-9]\d*$/.test(v) && Number(v) <= 16384)) { this.note("Enter whole numbers from 1 to 16384. Input retained.", true); return; }
    const key = this.key(); this.busy = true; this.loadSequence++; this.updateSizeControls();
    try {
      const document = await this.actions.coordinate(() => this.actions.request<ScreenDocument>("screens.setSize", {
        path: draft.document.path, expectedRevision: draft.document.revision, screenName: draft.screen,
        nodeStart: draft.document.screens.find(s => s.name === draft.screen)!.nodes[draft.index]!.span.start,
        width: Number(draft.width), height: Number(draft.height),
      }));
      if (!this.current()) return;
      this.drafts.delete(key); this.documents = this.documents.map(d => d.path === document.path ? document : d);
      if (this.doc?.path === document.path) this.doc = document;
      this.note(document.revision === draft.document.revision ? "No change. No undo entry added." : "Size saved. Undo reverses both dimensions together."); this.actions.saved();
    } catch (error) { if (this.current()) this.note(`${(error as Error).message} Input retained. Review Source, or cancel this draft and refresh.`, true); }
    finally {
      this.busy = false;
      if (this.current()) {
        const resizeFocused = document.activeElement?.classList.contains("screen-resize");
        this.focusResize = !!resizeFocused;
        this.updateSizeControls(); this.renderCanvas();
        if (resizeFocused) this.canvas.querySelector<HTMLElement>(".screen-resize")?.focus();
      }
    }
  }
  private async history(type: "undo" | "redo"): Promise<void> {
    if (this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before Undo or Redo. Input retained.", true); return; }
    this.busy = true;
    try {
      await this.actions.coordinate(async () => {
        const model = await this.actions.request<{ projectRevision: string; sourceMapRevision: string }>("scene.list");
        await this.actions.request("scene.apply", { expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: { type } });
      });
      if (this.current()) this.actions.saved();
    } catch (error) { if (this.current()) this.note((error as Error).message, true); }
    finally { this.busy = false; if (this.current()) await this.load(); }
  }
  private openSource(): void {
    if (this.owned && !this.owned.resolved) { this.reportUnresolved(); return; }
    const node = this.nodes()[this.selected]; if (this.doc) this.actions.source({ path: this.doc.path, expectedRevision: this.doc.revision, byteStart: node?.span.start, byteEnd: node?.span.end });
  }
  private test(validate: boolean): void {
    if (!this.doc || this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before testing the saved screen. Input retained.", true); return; }
    this.actions.preview({ purpose: "screen", path: this.doc.path, screenName: this.screen, expectedRevision: this.doc.revision }, validate);
  }
  private renderCanvas(): void {
    if (!this.current()) return;
    const { width, height } = this.gameResolution;
    const available = this.canvas.parentElement?.clientWidth ?? 600;
    this.scale = this.zoom === "100" ? 1 : Math.max(0.05, Math.min((available - 32) / width, 360 / height, 1));
    this.canvas.style.width = `${width * this.scale}px`; this.canvas.style.height = `${height * this.scale}px`;
    if (!this.doc) { this.canvas.replaceChildren(); this.invalidateCanvas("Select a supported screen to render."); return; }
    const drafts = [...this.drafts.values()].filter(d => d.document.path === this.doc!.path && d.screen === this.screen);
    const samples=[...this.textSamples.values()].filter(s=>s.path===this.doc!.path && s.screen===this.screen);
    if(samples.some(s=>s.revision!==this.doc!.revision)) {this.invalidateCanvas("Text sample uses an earlier Source revision. Edit the sample or use source text. Input retained.");return;}
    if (drafts.some(d => d.document.revision !== this.doc!.revision || ![d.width,d.height].every(v => /^[1-9]\d*$/.test(v) && Number(v) <= 16384))) {
      this.invalidateCanvas("Canvas unavailable for this invalid or stale draft. Input retained."); return;
    }
    const payload = { path:this.doc.path, screenName:this.screen, expectedRevision:this.doc.revision, width, height,
      drafts:drafts.map(d => ({ nodeStart:d.document.screens.find(s => s.name === d.screen)!.nodes[d.index]!.span.start, width:Number(d.width), height:Number(d.height) })),
      textSamples:samples.map(s=>({nodeStart:this.nodes()[s.index]!.span.start,value:s.value})),buttonState:this.buttonState };
    const key = JSON.stringify(payload);
    if (key === this.canvasKey) { if (this.geometryCurrent) this.showFrame(); return; }
    this.canvasKey = key;
    this.invalidateCanvas(this.frame?.image ? "Updating canvas. Previous image is out of date." : "Starting the Ren'Py canvas helper…", false);
    const sequence = this.canvasSequence;
    const update = async () => {
      try {
        let frame = await this.actions.request<CanvasFrame>("screens.canvasRender",payload);
        const poll = async (): Promise<void> => {
          if (!this.current() || sequence !== this.canvasSequence) return;
          if (frame.phase === "starting" && frame.frameId) {
            this.canvasTimer = setTimeout(() => { void (async () => {
              try { frame = await this.actions.request<CanvasFrame>("screens.canvasStatus",{frameId:frame.frameId}); await poll(); }
              catch (error) { if (this.current() && sequence === this.canvasSequence) this.invalidateCanvas(`${(error as Error).message} Drafts retained.`); }
            })(); },16);
          } else if (frame.phase === "ready" && frame.revision === this.doc?.revision && frame.image?.startsWith("data:image/png;base64,")) {
            this.frame = frame; this.showFrame(sequence);
            const health = async (): Promise<void> => {
              if(!this.current() || sequence!==this.canvasSequence || !frame.frameId) return;
              try {
                const current=await this.actions.request<CanvasFrame>("screens.canvasStatus",{frameId:frame.frameId,includeImage:false});
                if(!this.current() || sequence!==this.canvasSequence) return;
                if(current.phase!=="ready") {this.invalidateCanvas(current.message ?? "Canvas unavailable. Drafts retained.");return;}
                this.canvasTimer=setTimeout(()=>{void health();},500);
              } catch(error) {if(this.current() && sequence===this.canvasSequence) this.invalidateCanvas(`${(error as Error).message} Drafts retained.`);}
            };
            if(frame.frameId) this.canvasTimer=setTimeout(()=>{void health();},500);
          } else this.invalidateCanvas(frame.message ?? "Canvas unavailable. Drafts retained; open Source or use Test in Ren'Py.");
        };
        await poll();
      } catch (error) { if (this.current() && sequence === this.canvasSequence) this.invalidateCanvas(`${(error as Error).message} Drafts retained.`); }
    };
    this.canvasTimer = setTimeout(() => { void update(); },0);
  }
  private invalidateCanvas(message: string, resetKey = true): void {
    this.canvasSequence++; clearTimeout(this.canvasTimer); this.geometryCurrent = false;
    if (resetKey) this.canvasKey = "";
    if (resetKey && this.resize) {
      const {handle,pointer}=this.resize; this.resize=undefined;
      if(handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
      this.updateSizeControls();
    }
    if (!this.resize) this.canvas.querySelectorAll(".screen-node,.screen-selection").forEach(e => e.remove());
    this.canvas.dataset.stale = "true"; this.canvasStatus.textContent = message;
  }
  private showFrame(sequence = this.canvasSequence): void {
    const frame = this.frame; if (!frame?.image) return;
    if (!this.resize) this.canvas.replaceChildren(); this.canvas.dataset.renderer = "renpy";
    const image = this.canvas.querySelector<HTMLImageElement>(".screen-render") ?? el("img", "screen-render");
    image.setAttribute("aria-label", "Ren'Py screen canvas"); image.alt = "Inert screen rendering";
    image.dataset.buttonState=frame.buttonState ?? "";
    image.onload = () => {
      if (!this.current() || sequence !== this.canvasSequence) return;
      this.geometryCurrent = true; this.canvas.dataset.stale = "false"; this.canvasStatus.textContent = "Ren'Py canvas. Selection guides are editor overlays.";
      for (const geometry of frame.geometry ?? []) {
        const index = this.nodes().findIndex(n => n.span.start === geometry.start);
        const node = this.nodes()[index]; if (!node || node.kind === "screen") continue;
        const target = this.canvas.querySelector<HTMLButtonElement>(`[data-index="${index}"]`) ?? button("",() => this.choose(index,true),`screen-node screen-node-${node.kind}`);
        target.ariaLabel = `Select ${node.literal ?? names[node.kind] ?? node.kind}`;
        target.dataset.index = String(index); target.ariaPressed = String(index === this.selected);
        for (const [key,value] of Object.entries({left:geometry.x,top:geometry.y,width:geometry.width,height:geometry.height})) target.style.setProperty(key,`${value*this.scale}px`);
        this.canvas.append(target);
      }
      if(this.resize) {
        const outline=this.canvas.querySelector<HTMLElement>(".screen-selection"), target=this.canvas.querySelector<HTMLElement>(`[data-index="${this.selected}"]`);
        if(outline && target) for(const key of ["left","top","width","height"] as const) outline.style[key]=target.style[key];
      } else {
        this.positionSelection();
        if(this.focusResize && document.activeElement===document.body) this.canvas.querySelector<HTMLElement>(".screen-resize")?.focus();
        this.focusResize=false;
      }
    };
    image.onerror=() => {if(this.current() && sequence===this.canvasSequence) this.invalidateCanvas("Canvas image unavailable. Drafts retained.");};
    image.src = frame.image; this.canvas.append(image);
  }
  private positionSelection(): void {
    this.canvas.querySelector(".screen-selection")?.remove();
    const node = this.nodes()[this.selected], target = this.canvas.querySelector<HTMLElement>(`[data-index="${this.selected}"]`);
    if (!this.geometryCurrent || !node || !target || size(node, "xsize") === undefined || size(node, "ysize") === undefined) return;
    const outline = el("div", "screen-selection");
    for (const property of ["left", "top", "width", "height"] as const) outline.style[property] = target.style[property];
    const handle = button("", () => {}, "screen-resize"); handle.ariaLabel = "Resize selected element"; handle.title = "Drag to resize. Arrows resize by one pixel, Shift by eight. Escape cancels.";
    handle.onpointerdown = event => {
      if (event.button !== 0 || this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before resizing.", true); return; }
      const frame = node.kind === "frame", x = frame ? node.layout.xalign ?? 0 : 0, y = frame ? node.layout.yalign ?? 0 : 0;
      if (x >= 1 || y >= 1) { this.note("This anchor needs numeric editing in this slice.", true); return; }
      this.ensureDraft(); this.resize = { width: size(node, "xsize")!, height: size(node, "ysize")!, x: event.clientX, y: event.clientY, pointer: event.pointerId, handle };
      handle.setPointerCapture(event.pointerId); event.preventDefault();
    };
    handle.onpointermove = event => {
      const gesture = this.resize; if (!gesture) return;
      const draft = this.draft()!, ax = node.kind === "frame" ? node.layout.xalign ?? 0 : 0, ay = node.kind === "frame" ? node.layout.yalign ?? 0 : 0;
      draft.width = String(Math.max(24, Math.min(16384, Math.round((gesture.width + (event.clientX - gesture.x) / this.scale / (1 - ax)) / 8) * 8)));
      draft.height = String(Math.max(24, Math.min(16384, Math.round((gesture.height + (event.clientY - gesture.y) / this.scale / (1 - ay)) / 8) * 8)));
      target.style.width = `${Number(draft.width) * this.scale}px`; target.style.height = `${Number(draft.height) * this.scale}px`;
      target.style.left = node.kind === "frame" ? `${(this.gameResolution.width - Number(draft.width)) * ax * this.scale}px` : target.style.left;
      target.style.top = node.kind === "frame" ? `${(this.gameResolution.height - Number(draft.height)) * ay * this.scale}px` : target.style.top;
      for (const property of ["left", "top", "width", "height"] as const) outline.style[property] = target.style[property];
      this.renderCanvas();
    };
    handle.onpointerup = () => { if (!this.resize) return; this.resize = undefined; void this.apply(); };
    handle.onpointercancel = () => this.cancelResize();
    handle.onlostpointercapture = () => { if (this.resize) this.cancelResize(); };
    handle.onkeydown = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || this.busy) return;
      event.preventDefault(); if (this.hasDraft()) { this.note("Apply or cancel unfinished changes before resizing.", true); return; }
      const draft = this.ensureDraft(), key = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "width" : "height";
      const amount = (event.shiftKey ? 8 : 1) * (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1);
      draft[key] = String(Math.max(1, Math.min(16384, Number(draft[key]) + amount))); void this.apply();
    };
    outline.append(handle); this.canvas.append(outline);
  }
  private cancelResize(): void {
    if (!this.resize) return;
    const { handle, pointer } = this.resize; this.resize = undefined;
    if (handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
    this.drafts.delete(this.key()); this.render(); this.note("Resize cancelled. No source was written.");
  }
}
