import { ScreenImages } from "./screen-images.ts";
import { ScreenCanvasFrames } from "./screen-canvas-frames.ts";
import { ScreenLayoutEditor, type NumericLayout, type LayoutEdits } from "./screen-layout.ts";
import { icon } from "./icons.ts";
import { ScreenComposer, screenNodeKey, type CompositionCommand, type CompositionView } from "./screen-composition.ts";
import { layoutFor, saveLayout } from "./preferences.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SourceDocument, SourceInventory, SourceTarget } from "./source-ui.ts";
import type { ScreenPreview } from "./runtime-preparation.ts";

export interface ScreenNode {
  id?: string | null;
  kind: string; literal: string | null; layout: Record<string, number>;
  span: { start: number; end: number }; parentStart: number | null;
  properties: { property: "xsize" | "ysize"; value: number }[];
  position?: { xalign: number; yalign: number } | null;
  numericLayout?: NumericLayout | null;
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
interface Draft { document: ScreenDocument; screen: string; index: number; width: string; height: string; position?: { xalign: number; yalign: number } }
interface CompositionResult { document: ScreenDocument; selectedId: string; changed?: boolean }
type AcceptedEdit =
  | { type: "geometry"; document: ScreenDocument; draft: Draft; key: string }
  | { type: "layout"; document: ScreenDocument; base: ScreenDocument; key: string }
  | { type: "composition"; result: CompositionResult; command: CompositionCommand; base: ScreenDocument; beforeId?: string | null }
  | { type: "history"; direction: "undo" | "redo"; before?: ScreenDocument; selectedId?: string | null; sourceChanged: boolean };
interface Actions {
  projectId?: string;
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
const names: Record<string, string> = { screen: "Screen root", frame: "Help frame", fixed: "Free layout group", window: "Window", hbox: "Horizontal group", grid: "Grid", viewport: "Viewport", vbox: "Vertical group", text: "Text", image: "Image", textbutton: "Button" };

/** One session owns drafts, including while another workspace is visible. Source owns saved values. */
export class ScreensWorkspace {
  readonly panel = el("section", "screens-editor");
  private readonly message = el("p", "screen-message");
  private readonly selection = el("select");
  private readonly card = el("section", "screen-card");
  private readonly canvas = el("div", "screen-game");
  private readonly stage = el("section", "screen-stage");
  private readonly canvasStatus = el("p", "muted screen-canvas-status");
  private readonly selectionPath = el("nav", "screen-selection-path");
  private readonly selectionCaption = el("p", "screen-selection-caption");
  private readonly frames: ScreenCanvasFrames;
  private provisionalMove?: { index: number; position: { xalign: number; yalign: number } };
  private focusResize = false;
  private focusMove = false;
  private readonly gameResolution: {width:number; height:number};
  private zoom = "fit";
  private buttonState = "normal";
  private readonly textSamples = new Map<string,{revision:string; screen:string; path:string; index:number; value:string}>();
  private readonly rail = el("nav", "screen-steps");
  private sourceDialog?: HTMLDialogElement;
  private sourceSequence = 0;
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
  private move?: { xalign:number; yalign:number; x:number; y:number; rangeX:number; rangeY:number; scale:number; pointer:number; target:HTMLElement };
  private readonly observer: ResizeObserver;
  private readonly composer: ScreenComposer;
  private readonly layout: ScreenLayoutEditor;
  private readonly images: ScreenImages;
  // Core history has no entry cap within a session; keep its selection receipts for this workspace's lifetime.
  private readonly compositionHistory: { path: string; before: string; after: string; beforeId?: string | null; afterId: string; removal: boolean }[] = [];
  constructor(private readonly actions: Actions) {
    this.gameResolution = {...actions.resolution};
    this.layout = new ScreenLayoutEditor({
      view: () => {
        const view = this.compositionView();
        const nodes = view && this.images ? this.images.layoutNodes(view) : this.nodes();
        const node = this.images?.hasAddition() ? nodes.at(-1) : nodes[this.selected];
        return this.current() && this.doc && node ? { document:this.doc, screen:this.screen, node, nodes, busy:this.busy, otherDraft:!!this.drafts.size || this.composer.hasDraft() } : undefined;
      },
      commit: async (draft, edits: LayoutEdits) => {
        this.busy = true; this.loadSequence++;
        try {
          const document = await this.actions.coordinate(() => this.actions.request<ScreenDocument>("screens.setLayout", {path:draft.document.path,screenName:draft.screen,expectedRevision:draft.document.revision,nodeStart:draft.node.span.start,values:edits}));
          this.finishAcceptedEdit({type:"layout", document, base:draft.document, key:draft.key});
        } finally { this.busy = false; }
      },
      preview: () => { this.images.sync(); this.renderLayoutDraftMarkers(); this.renderCanvas(); }, note: (text, error) => this.note(text,error), select: node => this.choose(this.nodes().indexOf(node),true),
    });
    this.frames = new ScreenCanvasFrames({
      canvas: this.canvas, status: this.canvasStatus, request: actions.request,
      currentRevision: () => this.current() ? this.doc?.revision : undefined,
      installed: () => this.renderCanvasGuides(),
      invalidated: discardProvisional => this.invalidateGeometry(discardProvisional),
    });
    this.composer = new ScreenComposer({
      view: () => this.compositionView(),
      select: (id, design) => { const index = this.nodes().findIndex(n => screenNodeKey(n) === id); if (index >= 0) { if (design === false) this.step = "choose"; this.choose(index, design); } },
      commit: (command, base) => this.compose(command, base),
      source: node => { void this.openSource(node); },
      note: (text, error) => this.note(text, error), preview: () => { this.updateSizeControls(); this.renderCanvas(); }, newScreen: () => this.beginCreation(), undo: () => void this.history("undo"),
      geometry: host => this.renderGeometry(host),
      image: (card, view) => this.images.render(card, view),
      beginImage: (parentId, document) => this.images.begin(parentId, document),
      otherDraft: () => this.images.hasDraft() || this.layout.hasDraft() || !!this.drafts.size,
      hover: id => this.canvas.querySelectorAll<HTMLElement>(".screen-node").forEach(target => { const node = this.nodes()[Number(target.dataset.index)]; target.dataset.hovered = String(!!node && screenNodeKey(node) === id); }),
    });
    this.images = new ScreenImages({
      view: () => this.compositionView(), current: () => this.current(), request: actions.request, coordinate: actions.coordinate,
      commit: (command, base) => this.compose(command, base),
      redraw: () => { if (this.images.hasAddition()) this.step = "design"; this.renderCard(); }, preview: () => this.renderCanvas(),
      note: (message,error) => this.note(message,error), select: (id, design) => { const index = this.nodes().findIndex(n => n.id === id); if (index >= 0) this.choose(index,design); },
      source: () => { void this.openSource(); }, saved: () => this.saved(false),
      layoutTools: host => { const tools = el("div","screen-image-order"); tools.append(button("Refresh Source",()=>void this.load()),button("Validate screen",()=>this.test(true))); host.append(tools); }, order: host => this.composer.renderOrder(host),
    }, this.layout);
    const heading = el("header", "screen-heading"); heading.append(el("h1", "", "Screens"));
    const tools = el("div", "screen-tools");
    const addImageElement = button("Add element", () => this.composer.beginAddition()); addImageElement.dataset.imageAdd = ""; addImageElement.hidden = true;
    tools.append(addImageElement, button("Undo", () => void this.history("undo")), button("Redo", () => void this.history("redo")),
      button("Refresh Source", () => void this.load()), button("View in Source", () => this.openSource()),
      button("Validate screen", () => this.test(true)), button("Test in Ren'Py", () => this.test(false), "button primary"));
    for (const control of tools.querySelectorAll("button")) if (["Refresh Source","Validate screen","Test in Ren'Py"].includes(control.textContent ?? "")) control.dataset.imageExtra = "";
    heading.append(tools);
    this.selection.ariaLabel = "Screen"; this.selection.onchange = () => {
      if(this.move || this.resize || this.busy || this.images.isSaving() || (this.composer.hasAddition() || this.images.hasAddition())) {
        this.selection.value=this.owned ? JSON.stringify(["owned",this.owned.id]) : JSON.stringify([this.doc?.path,this.screen]);
        this.note("Finish the current operation before changing screens. Input retained.",true);return;
      }
      const [path, name] = JSON.parse(this.selection.value) as [string, string];
      this.owned = path === "owned" ? this.catalog?.owned.find(s => s.id === name) : undefined;
      this.doc = this.documents.find(d => d.path === (this.owned?.path ?? path));
      if (this.owned && !this.owned.resolved) this.doc = undefined;
      this.screen = this.owned?.name ?? name; this.selected = 0; this.render(); this.reportUnresolved();
      this.rememberSelection();
    };
    const picker = el("label", "screen-picker", "Screen "); picker.append(this.selection);
    const limits = el("p", "muted screen-limits", "Supported numeric layout and literal text edits preserve source-only regions. Styles, assets, actions and Story connections retain their Source controls.");
    for (const [id, label] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
      this.rail.append(button(label!, () => { if (this.images.isSaving()) return; this.step = id!; this.renderCard(); }));
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
    caption.append(el("h2", "", "Screen canvas"),aspects,zoom,state,button("Test in Ren'Py", () => this.test(false), "button primary screen-image-test"));
    const viewport = el("div", "screen-viewport"); viewport.append(this.canvas);
    this.canvasStatus.role = "status";
    this.selectionPath.ariaLabel = "Selection path";
    this.stage.ariaLabel = "Screen canvas"; this.stage.append(caption, viewport, this.selectionPath, this.selectionCaption, this.canvasStatus,
      el("p", "muted", "Canvas controls select elements. Editing never runs game scripts or actions. Test in Ren'Py runs accepted source."));
    const canvasJump = button("Show canvas", () => { this.stage.scrollIntoView({block:"start"}); caption.tabIndex = -1; caption.focus({preventScroll:true}); }, "button secondary screen-compose-jump");
    caption.append(button("Back to editing", () => { this.card.scrollIntoView({block:"start"}); (this.card.querySelector<HTMLElement>("textarea") ?? this.card.querySelector<HTMLElement>('[aria-selected="true"]') ?? this.card.querySelector<HTMLElement>("button"))?.focus({preventScroll:true}); }, "button secondary screen-compose-jump"));
    const workspace = el("div", "screen-flow"); workspace.append(this.rail, canvasJump, this.stage, this.card);
    this.message.role = "status"; this.message.ariaLive = "polite";
    this.panel.append(heading, picker, workspace, limits, this.message);
    this.composer.attach(this.panel);
    this.panel.addEventListener("keydown", event => {
      if (this.composer.hasRemoval()) return;
      const field = event.target instanceof HTMLElement && (event.target.matches("input,textarea,select") || event.target.isContentEditable);
      if (!field && !event.isComposing && !event.repeat && !this.composer.hasRemoval() && (event.metaKey || event.ctrlKey) && ["z","y"].includes(event.key.toLowerCase())) {
        event.preventDefault(); event.stopPropagation(); void this.history(event.shiftKey || event.key.toLowerCase() === "y" ? "redo" : "undo"); return;
      }
      if (event.key === "Escape") { if (this.move) this.cancelMove(); else if (this.resize) this.cancelResize(); else if (!this.layout.cancelCurrent()) this.cancel(); event.stopPropagation(); }
    });
    this.observer = new ResizeObserver(() => this.renderCanvas()); this.observer.observe(viewport);
  }
  mount(host: HTMLElement): void { host.append(this.panel); this.frames.invalidate("Checking canvas source."); void this.load(); }
  dispose(): void { this.disposed = true; this.sourceSequence++; this.sourceDialog?.remove(); this.composer.dispose(); this.images.dispose(); this.frames.dispose(); this.observer.disconnect(); this.cancelMove(); this.cancelResize(); this.closeCreationDialog(); }
  hasDraft(): boolean { return this.drafts.size > 0 || !!this.resize || !!this.creation || this.composer.hasDraft() || this.layout.hasDraft() || this.images.hasDraft(); }
  private current(): boolean { return !this.disposed && this.actions.current(); }
  private compositionView(): CompositionView | undefined {
    return this.current() && this.owned?.resolved && this.doc && this.nodes()[this.selected] ? {
      document:this.doc, screenId:this.owned.id, screenName:this.screen, nodes:this.nodes(), selected:this.nodes()[this.selected]!, step:this.step, busy:this.busy,
    } : undefined;
  }
  private nodes(): ScreenNode[] { return this.doc?.screens.find(s => s.name === this.screen)?.nodes ?? []; }
  private key(): string { return JSON.stringify([this.doc?.path, this.screen, this.nodes()[this.selected]?.id ?? this.selected]); }
  private preferenceKey(): string { return `screen-${this.actions.projectId ?? "workspace"}`; }
  private rememberSelection(): void {
    const node = this.nodes()[this.selected];
    if (this.owned && node && this.doc) saveLayout(this.preferenceKey(), { screenSelection: {
      screenId: this.owned.id, elementId: screenNodeKey(node), ...(!node.id ? { sourceRevision: this.doc.revision } : {}),
    } });
  }
  private draft(): Draft | undefined { return this.drafts.get(this.key()); }
  private note(text: string, error = false): void {
    this.message.textContent = text; this.message.dataset.error = String(error);
    const status = this.creationDialog?.querySelector<HTMLElement>('[role="status"]');
    if (status) { status.textContent = text; status.dataset.error = String(error); }
  }
  private saved(sourceChanged: boolean): void {
    if (sourceChanged) this.composer.clearNotice();
    this.actions.saved();
  }
  async load(): Promise<void> {
    if (this.busy || this.resize || this.move || this.composer.hasRemoval()) { this.note("Finish the current operation first. Input retained.", true); return; }
    return this.reload();
  }
  private async reload(render = true): Promise<void> {
    this.composer.clearNotice();
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
      const path = this.doc?.path, selectedId = this.nodes()[this.selected]?.id; this.documents = documents; this.catalog = catalog;
      const supported = documents.filter(d => d.screens.length > 0);
      if (this.owned) this.owned = catalog.owned.find(s => s.id === this.owned!.id) ?? { ...this.owned, resolved: false };
      else if (!path) this.owned = catalog.owned.find(s => s.id === layoutFor(this.preferenceKey()).screenSelection?.screenId) ?? catalog.owned[0];
      this.doc = this.owned ? this.owned.resolved ? supported.find(d => d.path === this.owned!.path) : undefined : supported.find(d => d.path === path) ?? supported[0];
      if (this.owned) this.screen = this.owned.name;
      if (!this.owned && !this.doc?.screens.some(s => s.name === this.screen)) this.screen = this.doc?.screens[0]?.name ?? "";
      const remembered = layoutFor(this.preferenceKey()).screenSelection;
      const preferred = selectedId ?? (remembered?.screenId === this.owned?.id && (!remembered?.sourceRevision || remembered.sourceRevision === this.doc?.revision) ? remembered?.elementId : undefined);
      this.selected = preferred ? Math.max(0, this.nodes().findIndex(n => screenNodeKey(n) === preferred)) : Math.min(this.selected, Math.max(0, this.nodes().length - 1));
      this.selection.replaceChildren();
      const owned = [...catalog.owned];
      if (this.owned && !owned.some(s => s.id === this.owned!.id)) owned.push(this.owned);
      owned.forEach(s => { const option = el("option", "", `${s.name} · ${s.path}${s.resolved ? " · owned" : " · unresolved"}`); option.value = JSON.stringify(["owned", s.id]); this.selection.append(option); });
      documents.forEach(d => d.screens.forEach(s => { if (catalog.owned.some(o => o.path === d.path && o.name === s.name)) return; const option = el("option", "", `${s.name} · ${d.path}`); option.value = JSON.stringify([d.path, s.name]); this.selection.append(option); }));
      this.selection.value = this.owned ? JSON.stringify(["owned", this.owned.id]) : JSON.stringify([this.doc?.path, this.screen]);
      this.images.invalidate();
      if (render) this.render();
      this.note(this.doc ? this.hasDraft() ? "Source refreshed. Unfinished drafts retain their original revision." : "Saved screen loaded. Unsupported regions remain in Source." : "No supported custom screens in game/ui. Create a blank screen from Choose.");
      this.reportUnresolved();
    } catch (error) { if (this.current() && sequence === this.loadSequence) this.note(`${(error as Error).message} Input retained.`, true); }
  }
  private render(): void { this.renderCard(); this.renderCanvas(); }
  private renderLayoutDraftMarkers(): void {
    if (!this.doc) return;
    this.card.querySelectorAll<HTMLButtonElement>('.screen-tree [role="option"],.screen-tree [role="treeitem"]').forEach((row,index) => {
      const node = row.dataset.nodeId ? this.nodes().find(node => screenNodeKey(node) === row.dataset.nodeId) : this.nodes()[index];
      row.ariaLabel ??= row.textContent;
      row.dataset.layoutDraft = String(!!node && this.layout.hasNodeDraft(this.doc!,this.screen,node));
    });
  }
  private choose(index: number, design = false): void {
    if (this.busy || this.images.isSaving() || this.resize || this.move || this.composer.hasRemoval()) return;
    this.selected = index; if (design) this.step = "design";
    this.rememberSelection();
    if (this.owned && !design && this.step === "choose" && this.composer.canKeepTree()) { this.composer.refreshSelection(); this.renderCanvas(); }
    else this.render();
    if (design) this.card.querySelector<HTMLElement>('input[data-image-field="width"],textarea')?.focus({ preventScroll: true });
  }
  private renderCard(): void {
    const scroll = this.card.scrollTop;
    const numeric = this.step === "design" && !!this.nodes()[this.selected]?.numericLayout;
    this.panel.dataset.uiImage = String(this.step === "design" && (this.nodes()[this.selected]?.kind === "image" || this.images.hasAddition()));
    this.panel.querySelector<HTMLElement>("[data-image-add]")!.hidden = this.panel.dataset.uiImage !== "true";
    this.panel.querySelectorAll<HTMLElement>(".screen-tools [data-image-extra]").forEach(control=>control.hidden=this.panel.dataset.uiImage==="true");
    this.images.unmountCard(); this.card.classList.remove("screen-image"); this.card.onkeydown = null;
    this.panel.dataset.numericLayout = String(numeric); this.card.classList.toggle("screen-numeric", numeric);
    [...this.rail.querySelectorAll("button")].forEach((b, i) => b.ariaPressed = String(["choose", "design", "connect"][i] === this.step));
    this.card.replaceChildren(); this.card.ariaLabel = "Selected properties";
    if (this.composer.render(this.card)) {
      this.panel.dataset.composition = "true";
      [...this.rail.querySelectorAll("button")].forEach((b, i) => b.ariaPressed = String(["choose", "design", "connect"][i] === this.step));
      if (this.creation) this.renderCreation(); this.layout.renderRetained(this.card, this.documents); this.images.renderRetained(this.card,this.documents); this.renderLayoutDraftMarkers(); this.card.scrollTop = scroll; return;
    }
    this.card.classList.remove("screen-composer");
    this.panel.dataset.composition = "false";
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
      if (!node.numericLayout) this.card.append(el("p", "muted", `${node.kind} · Edit existing literal dimensions, then apply your changes.`));
      this.renderTextSample(this.card);
      this.renderGeometry(this.card);
    }
    this.card.append(el("p", "muted screen-coverage", this.doc?.partial ? "Partial coverage. Custom Python, actions, styling and unsupported regions are preserved in Source." : "Numeric layout changes use the shared source history."));
    this.layout.renderRetained(this.card, this.documents); this.images.renderRetained(this.card,this.documents);
    this.renderLayoutDraftMarkers();
    this.card.scrollTop = scroll;
  }
  private renderTextSample(host: HTMLElement): void {
    const node = this.nodes()[this.selected];
      if(node && (node.kind==="text" || node.kind==="textbutton")) {
        const label=el("label","screen-text-sample","Canvas text sample");
        const input=el("textarea"); input.ariaLabel="Canvas text sample";input.maxLength=8192;
        input.value=this.textSamples.get(this.key())?.value ?? node.literal ?? "";
        input.oninput=()=>{this.textSamples.set(this.key(),{revision:this.doc!.revision,screen:this.screen,path:this.doc!.path,index:this.selected,value:input.value});this.renderCanvas();};
        label.append(input);host.append(label,el("p","muted","Sample only. Source and runtime values do not change."),button("Use source text",()=>{this.textSamples.delete(this.key());this.renderCard();this.renderCanvas();}));
      }
  }
  private renderGeometry(host: HTMLElement): void {
    const node = this.nodes()[this.selected]; if (!node) return;
    if (node.numericLayout) { const layout = el("section"); host.append(layout); this.layout.render(layout); return; }
    if (this.owned && !node.id) this.renderTextSample(host);
      const details = el("details", "screen-properties"); details.open = !this.owned;
      details.append(el("summary", "", "Position & size"));
      if (size(node, "xsize") !== undefined && size(node, "ysize") !== undefined) {
        const draft = this.draft();
        const fields = el("div", "screen-size-fields");
        for (const [label, key, property] of [["Width", "width", "xsize"], ["Height", "height", "ysize"]] as const) {
          const input = el("input"); input.type = "number"; input.min = "1"; input.max = "16384"; input.step = "1";
          input.ariaLabel = label; input.dataset.size = key; input.value = draft?.[key] ?? String(size(node, property)); input.readOnly = this.busy || !!draft?.position || this.composer.hasTextDrafts();
          const field = el("label", "", `${label} (px)`); field.append(input); fields.append(field);
          input.oninput = () => { if (this.busy || this.draft()?.position || this.composer.hasTextDrafts()) return; const value = this.ensureDraft(); value[key] = input.value; this.renderCanvas(); };
          input.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); void this.apply(); } };
        }
        const actions = el("div", "screen-edit-actions");
        const apply = button(this.owned ? "Apply size" : "Apply changes", () => void this.apply(), "button primary"); apply.ariaDisabled = String(this.busy);
        const cancel = button(this.owned ? "Cancel size" : "Cancel changes", () => this.cancel()); cancel.ariaDisabled = String(this.busy);
        actions.append(apply, cancel); details.append(fields, actions, el("p", "muted", "Whole numbers from 1 to 16384. Use arrows for one pixel; Shift + arrows on the resize handle changes eight pixels."));
      } else details.append(el("p", "muted", "This node needs existing literal xsize and ysize to resize. Other properties remain editable in Source."));
      host.append(details);
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
      this.creation = undefined; this.closeCreationDialog(); this.selected = 0; this.saved(true);
    } catch (error) { if (this.current()) this.note(`${(error as Error).message} Input retained. Cancel creation and refresh Source before trying again.`, true); }
    finally { this.busy = false; if (this.current()) { const input = this.creationDialog?.querySelector<HTMLInputElement>('[aria-label="Screen name"]'); if (input) input.readOnly = false; if (!this.creation) { await this.load(); this.card.querySelector<HTMLElement>('[aria-selected="true"]')?.focus(); } } }
  }
  private updateSizeControls(): void {
    const node = this.nodes()[this.selected], draft = this.draft();
    for (const input of this.card.querySelectorAll<HTMLInputElement>("input[data-size]")) {
      if (input.dataset.layoutField && !draft) continue;
      const key = input.dataset.size as "width" | "height";
      const value = draft?.[key] ?? String(size(node, key === "width" ? "xsize" : "ysize"));
      if (input.value !== value) input.value = value;
      input.readOnly = this.busy || !!draft?.position || this.composer.hasTextDrafts();
    }
    this.card.ariaBusy = String(this.busy);
    this.card.querySelectorAll<HTMLButtonElement>(".screen-edit-actions button").forEach(b => b.ariaDisabled = String(this.busy));
  }
  private refreshGeometryEditor(): void {
    // Geometry changes keep the same controls, but their source bindings need the accepted document.
    const selector = "input,textarea,select,button,summary";
    const focused = [...this.card.querySelectorAll<HTMLElement>(selector)].indexOf(document.activeElement as HTMLElement);
    const textarea = document.activeElement?.matches("textarea,input[type=text]") ? document.activeElement as HTMLTextAreaElement | HTMLInputElement : undefined;
    const selection = textarea ? [textarea.selectionStart, textarea.selectionEnd] as const : undefined;
    const expanded = [...this.card.querySelectorAll("details")].map(details => details.open);
    const scroll = this.card.scrollTop;
    this.renderCard();
    this.card.querySelectorAll("details").forEach((details, index) => { details.open = expanded[index] ?? details.open; });
    const control = this.card.querySelectorAll<HTMLElement>(selector)[focused];
    control?.focus({ preventScroll: true });
    if (selection && control?.matches("textarea,input[type=text]")) (control as HTMLTextAreaElement | HTMLInputElement).setSelectionRange(...selection);
    this.card.scrollTop = scroll;
  }
  private refreshGeometryView(sourceChanged: boolean): void {
    const resizeFocused = document.activeElement?.classList.contains("screen-resize");
    this.focusResize = !!resizeFocused;
    this.focusMove = !!document.activeElement?.matches(".screen-node,.screen-move");
    if (sourceChanged && (this.owned || this.nodes()[this.selected]?.numericLayout)) this.refreshGeometryEditor();
    this.updateSizeControls(); this.renderCanvas();
    if (resizeFocused) this.canvas.querySelector<HTMLElement>(".screen-resize")?.focus();
  }
  private finishAcceptedEdit(edit: AcceptedEdit): void {
    if (!this.current()) return;
    if (edit.type === "history") {
      const { direction, before, selectedId } = edit;
      const entry = [...this.compositionHistory].reverse().find(item => item.path === before?.path && item.path === this.doc?.path
        && (direction === "undo" ? item.after === before?.revision && item.before === this.doc?.revision : item.before === before?.revision && item.after === this.doc?.revision));
      const preferred = entry?.removal ? direction === "undo" ? entry.beforeId : entry.afterId : selectedId;
      const index = this.nodes().findIndex(n => screenNodeKey(n) === preferred);
      if (index >= 0) this.selected = index;
      else if (entry) { const fallback = direction === "undo" ? entry.beforeId : entry.afterId; this.selected = Math.max(0, this.nodes().findIndex(n => screenNodeKey(n) === fallback)); }
      this.rememberSelection();
      if (edit.sourceChanged) this.saved(true);
      this.busy = false; this.render(); this.composer.focusSelection();
      return;
    }

    const document = edit.type === "geometry" || edit.type === "layout" ? edit.document : edit.result.document;
    const base = edit.type === "geometry" ? edit.draft.document : edit.base;
    const sourceChanged = document.revision !== base.revision || edit.type === "composition" && edit.result.changed === true;
    if (edit.type === "composition") this.images.accept(edit.command,base,document);
    this.documents = this.documents.map(d => d.path === document.path ? document : d);
    if (this.doc?.path === document.path) this.doc = document;
    if (this.owned?.path === document.path) this.owned.sourceRevision = document.revision;

    // Settle accepted drafts before rebinding controls or asking the canvas to render.
    if (edit.type === "layout") this.layout.accept(edit.key, base, document);
    else if (edit.type === "geometry") this.drafts.delete(edit.key);
    else {
      this.selected = Math.max(0, this.nodes().findIndex(n => screenNodeKey(n) === edit.result.selectedId));
      this.composer.accept(edit.command, base, document);
      if (sourceChanged) {
        this.compositionHistory.push({ path: base.path, before: base.revision, after: document.revision, beforeId: edit.beforeId, afterId: edit.result.selectedId, removal: edit.command.type === "remove" });
      }
      if (edit.command.type === "remove") this.step = "choose";
    }
    this.rememberSelection(); this.saved(sourceChanged); this.busy = false;

    if (edit.type === "layout") {
      this.note(sourceChanged ? "Layout saved. Undo restores all layout fields together." : "No change. No undo entry added.");
      this.refreshGeometryEditor(); this.updateSizeControls(); this.renderCanvas();
    } else if (edit.type === "geometry") {
      this.note(!sourceChanged ? "No change. No undo entry added." : edit.draft.position ? "Position saved. Undo reverses the move." : "Size saved. Undo reverses both dimensions together.");
      this.refreshGeometryView(sourceChanged);
    } else {
      const command = edit.command;
      if (command.type === "remove") {
        const removed = base.screens.find(s => s.name === this.screen)?.nodes.find(n => n.id === command.nodeId);
        if (removed) this.composer.showRemovalNotice(removed);
        this.note("Element removed. Undo restores its exact source and identity.");
      } else if (command.type === "image" || command.type === "addImage") this.note(sourceChanged ? "Image applied. Undo restores its reference, size and layout together." : "No change. No undo entry added.");
      else if (command.type === "add") this.note("Element added. Undo removes this addition.");
      else if (command.type === "text") this.note(!sourceChanged ? "Text unchanged. No history entry added." : "Text applied. Undo restores the previous text.");
      else this.note(!sourceChanged ? "Order unchanged. No history entry added." : "Order changed. Groups keep their children; Undo restores the order.");
      this.render(); this.composer.focusEditor(command);
    }
  }
  private ensureDraft(): Draft {
    let draft = this.draft();
    if (!draft) { const node = this.nodes()[this.selected]!; draft = { document: this.doc!, screen: this.screen, index: this.selected, width: String(size(node, "xsize")), height: String(size(node, "ysize")) }; this.drafts.set(this.key(), draft); }
    return draft;
  }
  private cancel(): void {
    if (this.busy) { this.note("The edit is being accepted. Input retained until its result arrives."); return; }
    if (this.move) {this.cancelMove();return;}
    if (this.resize) {this.cancelResize();return;}
    if (this.creation) { this.creation = undefined; this.closeCreationDialog(); this.renderCard(); this.card.querySelector<HTMLButtonElement>("button")?.focus(); }
    this.provisionalMove = undefined; this.drafts.delete(this.key()); this.updateSizeControls(); this.renderCanvas(); this.note("Changes cancelled. No source was written.");
  }
  private async apply(): Promise<void> {
    const draft = this.draft(); if (!draft || this.busy) return;
    if (this.composer.hasTextDrafts()) { this.note("Apply or cancel unfinished text edits before accepting dimensions. Input retained.", true); return; }
    this.releaseMove();
    if(this.resize) {
      const {handle,pointer}=this.resize;this.resize=undefined;
      if(handle.hasPointerCapture(pointer))handle.releasePointerCapture(pointer);
    }
    if (![draft.width, draft.height].every(v => /^[1-9]\d*$/.test(v) && Number(v) <= 16384)) { this.note("Enter whole numbers from 1 to 16384. Input retained.", true); return; }
    const key = this.key(); let accepted = false;
    this.busy = true; this.loadSequence++; this.updateSizeControls();
    try {
      const document = await this.actions.coordinate(() => this.actions.request<ScreenDocument>(draft.position ? "screens.setPosition" : "screens.setSize", {
        path: draft.document.path, expectedRevision: draft.document.revision, screenName: draft.screen,
        nodeStart: draft.document.screens.find(s => s.name === draft.screen)!.nodes[draft.index]!.span.start,
        ...(draft.position ?? {width: Number(draft.width), height: Number(draft.height)}),
      }));
      if (!this.current()) return;
      this.finishAcceptedEdit({ type: "geometry", document, draft, key }); accepted = true;
    } catch (error) { if (this.current()) this.note(`${(error as Error).message} Input retained. Review Source, or cancel this draft and refresh.`, true); }
    finally {
      this.busy = false;
      if (this.current() && !accepted) this.refreshGeometryView(false);
    }
  }
  private async compose(command: CompositionCommand, base: ScreenDocument): Promise<void> {
    if (this.busy || this.resize || this.move || this.creation || this.drafts.size || ((this.layout.hasDraft() || this.images.hasDraft()) && command.type !== "image" && command.type !== "addImage") || !this.owned?.resolved) throw new Error("Finish the current edit first");
    if (base.path !== this.owned.path) throw new Error("This draft belongs to another screen");
    this.busy = true; this.loadSequence++;
    const owner = this.owned;
    const beforeId = this.nodes()[this.selected]?.id;
    try {
      const result = await this.actions.coordinate(() => this.actions.request<CompositionResult>("screens.compose", {
        screenId: owner.id, expectedRevision: base.revision, command,
      }));
      this.finishAcceptedEdit({ type: "composition", command, base, result, beforeId });
    } finally { this.busy = false; }
  }
  private async history(type: "undo" | "redo"): Promise<void> {
    if (this.busy || this.hasDraft() || this.composer.hasRemoval()) { this.note("Apply or cancel unfinished changes before Undo or Redo. Input retained.", true); return; }
    const before = this.doc, selectedId = this.nodes()[this.selected]?.id;
    this.busy = true; let accepted = false;
    try {
      await this.actions.coordinate(async () => {
        const model = await this.actions.request<{ projectRevision: string; sourceMapRevision: string }>("scene.list");
        await this.actions.request("scene.apply", { expectedProjectRevision: model.projectRevision, expectedSourceMapRevision: model.sourceMapRevision, command: { type } });
      });
      accepted = true;
    } catch (error) { if (this.current()) this.note((error as Error).message, true); }
    finally {
      if (this.current()) {
        await this.reload(false);
        this.finishAcceptedEdit({ type: "history", direction: type, before, selectedId, sourceChanged: accepted });
      }
      this.busy = false;
    }
  }
  private async openSource(selected = this.nodes()[this.selected]): Promise<void> {
    if (this.owned && !this.owned.resolved) { this.reportUnresolved(); return; }
    const doc = this.doc; if (!doc) return;
    const sequence = ++this.sourceSequence;
    try {
      const source = await this.actions.request<SourceDocument>("source.open", {path:doc.path});
      if (!this.current() || this.doc !== doc || sequence !== this.sourceSequence) return;
      this.sourceDialog?.remove();
      const dialog = el("dialog", "screen-source-dialog"); dialog.ariaLabel = "Screen source";
      dialog.onkeydown = event => event.stopPropagation();
      const close = () => dialog.close();
      const heading = el("div", "screen-source-heading");
      heading.append(el("h2", "", "Screen source"), button("Close source", close));
      const pre = el("pre"); pre.tabIndex = 0;
      const reconciled = !source.dirty && source.baseRevision === doc.revision;
      let offset = source.hasBom ? 3 : 0;
      for (const line of (source.text ?? "Source unavailable.").split(/(?<=\n)/)) {
        const index = reconciled ? this.nodes().findIndex(node => node.span.start === offset) : -1;
        if (index >= 0) {
          const row = button(line, () => { if (this.doc !== doc) { this.note("Source changed. Refresh before selecting this statement.", true); return; } close(); this.choose(index); this.composer.focusSelection(); });
          row.className = "screen-source-line"; row.ariaLabel = `Select ${this.nodes()[index]!.kind} in Source`; pre.append(row);
        } else pre.append(document.createTextNode(line));
        offset += new TextEncoder().encode(line).length;
      }
      dialog.append(heading, el("p", "", reconciled ? "Saved source. Unapplied screen changes are excluded. Select a statement to select its element." : "Source has unfinished or changed content. Open Source to reconcile it before selecting elements."), pre,
        button("Edit in Source", () => { close(); this.actions.source({path:doc.path,expectedRevision:doc.revision,byteStart:selected?.span.start,byteEnd:selected?.span.end}); }));
      dialog.onclose = () => { dialog.remove(); if (this.sourceDialog === dialog) this.sourceDialog = undefined; };
      this.sourceDialog = dialog; this.panel.append(dialog); dialog.showModal(); heading.querySelector("button")?.focus();
    } catch (error) { if (this.current()) this.note((error as Error).message, true); }
  }
  private test(validate: boolean): void {
    if (!this.doc || this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before testing the saved screen. Input retained.", true); return; }
    this.actions.preview({ purpose: "screen", path: this.doc.path, screenName: this.screen, expectedRevision: this.doc.revision }, validate);
  }
  private renderCanvas(): void {
    if (!this.current() || !this.panel.isConnected) return;
    this.selectionPath.replaceChildren();
    let selected = this.nodes()[this.selected], depth = 0;
    const ancestors: ScreenNode[] = [];
    while (selected && depth++ < 33) { ancestors.unshift(selected); selected = this.nodes().find(n => n.span.start === selected!.parentStart)!; }
    for (const node of ancestors) {
      if (this.selectionPath.childElementCount) this.selectionPath.append(el("span", "", "/"));
      const pick = button(this.composer.selectionLabel(node), () => this.choose(this.nodes().indexOf(node)), "button secondary");
      pick.ariaLabel = `Select ancestor ${this.composer.selectionLabel(node)}`; if (node === this.nodes()[this.selected]) pick.ariaCurrent = "true"; this.selectionPath.append(pick);
    }
    const selectedNode = this.nodes()[this.selected];
    this.selectionCaption.textContent = selectedNode ? `${selectedNode.kind} · Nesting level ${Math.max(0, ancestors.length - 1)}` : "";
    const { width, height } = this.gameResolution;
    const available = this.canvas.parentElement?.clientWidth ?? 600;
    this.scale = this.zoom === "100" ? 1 : Math.max(0.05, Math.min((available - (this.owned ? 0 : 32)) / width, 360 / height, 1));
    this.canvas.style.width = `${width * this.scale}px`; this.canvas.style.height = `${height * this.scale}px`;
    if (!this.doc) { this.canvas.replaceChildren(); this.frames.invalidate("Select a supported screen to render."); return; }
    const drafts = [...this.drafts.values()].filter(d => d.document.path === this.doc!.path && d.screen === this.screen);
    const samples=[...this.textSamples.values()].filter(s=>s.path===this.doc!.path && s.screen===this.screen);
    const composition = this.composer.canvasDraft();
    const numeric = this.layout.canvasDraft();
    const images = this.images.canvasDraft();
    if (images.invalid) { this.frames.invalidate("Canvas unavailable for this invalid or stale image draft. Input retained."); return; }
    const virtual = this.compositionView() && this.images.synthetic(this.compositionView()!);
    if (images.addition && virtual) { const values = numeric.layouts.find(l => l.nodeStart === virtual.span.start)?.values; if (values) images.addition.layout = values; }
    if (numeric.invalid) { this.frames.invalidate("Canvas unavailable for this invalid or stale layout draft. Input retained."); return; }
    if (composition.stale) { this.frames.invalidate("Composition draft uses an earlier Source revision. Input retained; review Source before applying."); return; }
    if(samples.some(s=>s.revision!==this.doc!.revision)) {this.frames.invalidate("Text sample uses an earlier Source revision. Edit the sample or use source text. Input retained.");return;}
    if (drafts.some(d => d.document.revision !== this.doc!.revision || ![d.width,d.height].every(v => /^[1-9]\d*$/.test(v) && Number(v) <= 16384))) {
      this.frames.invalidate("Canvas unavailable for this invalid or stale draft. Input retained."); return;
    }
    const textSamples = new Map(samples.map(s => [this.nodes()[s.index]!.span.start, { nodeStart: this.nodes()[s.index]!.span.start, value: s.value }]));
    composition.texts.forEach(sample => textSamples.set(sample.nodeStart, sample));
    const payload = { path:this.doc.path, screenName:this.screen, expectedRevision:this.doc.revision, width, height,
      drafts:drafts.filter(d=>!d.position).map(d => ({ nodeStart:d.document.screens.find(s => s.name === d.screen)!.nodes[d.index]!.span.start, width:Number(d.width), height:Number(d.height) })),
      positions:drafts.filter(d=>d.position).map(d=>({nodeStart:d.document.screens.find(s=>s.name===d.screen)!.nodes[d.index]!.span.start,...d.position!})),
      layouts:numeric.layouts.filter(l => l.nodeStart !== virtual?.span.start), imageSamples:images.samples, ...(images.addition ? {imageAddition:images.addition} : {}), textSamples:[...textSamples.values()],buttonState:this.buttonState, ...(composition.addition ? { addition: composition.addition } : {}) };
    this.frames.render(payload);
  }
  private invalidateGeometry(discardProvisional: boolean): void {
    if (discardProvisional) this.provisionalMove = undefined;
    if (discardProvisional && this.resize) {
      const {handle,pointer}=this.resize; this.resize=undefined;
      if(handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
      this.updateSizeControls();
    }
    if (discardProvisional && this.move) this.releaseMove();
    if (!this.resize && !this.move && !this.provisionalMove) this.canvas.querySelectorAll(".screen-node,.screen-selection,.screen-pending-addition").forEach(e => e.remove());
    if (!discardProvisional) this.showMovement();
  }
  private renderCanvasGuides(): void {
    const installedGeometry = this.frames.geometry;
    if (!this.move && !this.draft() && !this.busy) this.provisionalMove = undefined;
    const composition = this.composer.canvasDraft();
    this.canvasStatus.textContent = composition.addition ? "Draft addition. Not applied to Source." : composition.texts.length ? "Text preview. Not applied to Source." : "Ren'Py canvas. Selection guides are editor overlays.";
    this.canvas.querySelector(".screen-pending-addition")?.remove();
    const present = new Set((installedGeometry ?? []).map(g => this.nodes().findIndex(n => n.span.start === g.start)));
    this.canvas.querySelectorAll<HTMLElement>(".screen-node").forEach(target => {
      if (!present.has(Number(target.dataset.index))) target.remove();
    });
    for (const geometry of installedGeometry ?? []) {
      const index = this.nodes().findIndex(n => n.span.start === geometry.start);
      const node = this.nodes()[index];
      if (!node && geometry.start === composition.additionStart) {
        const guide = el("div", "screen-pending-addition"); guide.ariaLabel = "Draft addition (not applied)";
        for (const [key,value] of Object.entries({left:geometry.x,top:geometry.y,width:geometry.width,height:geometry.height})) guide.style.setProperty(key,`${value*this.scale}px`);
        this.canvas.append(guide); continue;
      }
      if (!node || node.kind === "screen") continue;
      let target = this.canvas.querySelector<HTMLButtonElement>(`[data-index="${index}"]`);
      if (!target) {
        target = button("",() => this.choose(index,!this.owned),`screen-node screen-node-${node.kind}`);
        target.addEventListener("keydown", event => {
          if (event.key === "Enter") { event.preventDefault(); this.choose(index,true); }
        });
      }
      target.ondblclick = () => this.choose(index,true);
      target.ariaLabel = `Select ${node.literal ?? names[node.kind] ?? node.kind}`;
      target.dataset.index = String(index); target.ariaPressed = String(index === this.selected);
      if (!this.move) this.bindMovement(target, index, false);
      for (const [key,value] of Object.entries({left:geometry.x,top:geometry.y,width:geometry.width,height:geometry.height})) target.style.setProperty(key,`${value*this.scale}px`);
      // Reattaching a captured target makes the browser cancel the gesture.
      if (target.parentElement !== this.canvas) this.canvas.append(target);
    }
    if(this.resize || this.move) {
      const outline=this.canvas.querySelector<HTMLElement>(".screen-selection"), target=this.canvas.querySelector<HTMLElement>(`[data-index="${this.selected}"]`);
      if(outline && target) for(const key of ["left","top","width","height"] as const) outline.style[key]=target.style[key];
    } else {
      this.positionSelection();
      if(this.focusResize && document.activeElement===document.body) this.canvas.querySelector<HTMLElement>(".screen-resize")?.focus();
      if(this.focusMove && document.activeElement===document.body) this.canvas.querySelector<HTMLElement>(".screen-move")?.focus();
      this.focusResize=false;
      this.focusMove=false;
    }
    this.showMovement();
    this.positionMoveHandle();
  }
  private bindMovement(target: HTMLButtonElement, index: number, pointer = true): void {
    const node=this.nodes()[index];
    const geometry=this.frames.geometry?.find(g=>g.start===node?.span.start);
    const parent=this.frames.geometry?.find(g=>g.start===node?.parentStart);
    if (!node?.position || !geometry || !parent || size(node,"xsize")===undefined || size(node,"ysize")===undefined) return;
    const rangeX=parent.width-geometry.width,rangeY=parent.height-geometry.height;
    if (rangeX<=0 || rangeY<=0) return;
    target.title="Arrows move one game pixel, Shift by eight. Escape cancels.";
    if (pointer) {
    target.title="Drag to move. Arrows move one game pixel, Shift by eight. Escape cancels.";
    target.onpointerdown=event=>{
      if(event.button!==0 || !this.frames.ready || this.busy || this.hasDraft()) return;
      this.selected=index;this.step="design";this.renderCard();
      this.ensureDraft().position={...node.position!};
      this.updateSizeControls();
      this.move={...node.position!,x:event.clientX,y:event.clientY,rangeX,rangeY,scale:this.scale,pointer:event.pointerId,target};
      this.canvas.dataset.dragging="true";target.setPointerCapture(event.pointerId);target.focus();event.preventDefault();
    };
    target.onpointermove=event=>{
      const move=this.move;if(!move || event.pointerId!==move.pointer) return;
      this.ensureDraft().position={
        xalign:Math.max(0,Math.min(1,move.xalign+Math.round((event.clientX-move.x)/move.scale/8)*8/move.rangeX)),
        yalign:Math.max(0,Math.min(1,move.yalign+Math.round((event.clientY-move.y)/move.scale/8)*8/move.rangeY)),
      };
      this.provisionalMove={index,position:{...this.draft()!.position!}};
      this.showMovement(); this.renderCanvas();
    };
    target.onpointerup=event=>{
      if(!this.move || event.pointerId!==this.move.pointer) return;
      const position=this.draft()?.position,move=this.move;
      this.releaseMove();
      if(position?.xalign===move.xalign && position?.yalign===move.yalign) {this.provisionalMove=undefined;this.drafts.delete(this.key());this.updateSizeControls();this.renderCanvas();return;}
      void this.apply();
    };
    target.onpointercancel=()=>this.cancelMove();
    target.onlostpointercapture=()=>{if(this.move)this.cancelMove();};
    }
    target.onkeydown=event=>{
      if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key) || !this.frames.ready || this.busy || this.hasDraft())return;
      event.preventDefault();this.selected=index;this.step="design";this.renderCard();
      const position={...node.position!},axis=event.key==="ArrowLeft" || event.key==="ArrowRight" ? "xalign":"yalign";
      position[axis]=Math.max(0,Math.min(1,position[axis]+(event.shiftKey?8:1)*(event.key==="ArrowLeft" || event.key==="ArrowUp"?-1:1)/(axis==="xalign"?rangeX:rangeY)));
      this.ensureDraft().position=position;this.provisionalMove={index,position};this.showMovement();void this.apply();
    };
  }
  private showMovement(): void {
    const provisional=this.provisionalMove, geometry=this.frames.geometry;
    if (!provisional || !geometry) return;
    const nodes=this.nodes(), node=nodes[provisional.index];
    const current=geometry.find(g=>g.start===node?.span.start);
    const parent=geometry.find(g=>g.start===node?.parentStart);
    if (!node || !current || !parent) return;
    const dx=parent.x+(parent.width-current.width)*provisional.position.xalign-current.x;
    const dy=parent.y+(parent.height-current.height)*provisional.position.yalign-current.y;
    const descendants=new Set([node.span.start]);
    for (const candidate of nodes) if (candidate.parentStart!==null && descendants.has(candidate.parentStart)) descendants.add(candidate.span.start);
    const ancestors=new Set<number>();
    let ancestor=nodes.find(n=>n.span.start===node.parentStart);
    while(ancestor && ["screen","fixed"].includes(ancestor.kind)) { ancestors.add(ancestor.span.start); ancestor=nodes.find(n=>n.span.start===ancestor!.parentStart); }
    // A composite PNG can move as one piece only when all its painted content
    // belongs to this subtree. Clipped pixels cannot be recovered by translation.
    const isolated=nodes.every(n=>descendants.has(n.span.start) || ancestors.has(n.span.start)) &&
      geometry.filter(g=>descendants.has(g.start)).every(g=>g.x>=0 && g.y>=0 && g.x+g.width<=this.gameResolution.width && g.y+g.height<=this.gameResolution.height);
    const image=this.canvas.querySelector<HTMLImageElement>(".screen-render");
    if (image) image.style.transform=isolated ? `translate(${dx*this.scale}px, ${dy*this.scale}px)` : "";
    this.canvas.dataset.provisional=isolated ? "panel" : "guides";
    this.canvasStatus.textContent=isolated ? "Provisional move. Waiting for Ren'Py confirmation." : "Provisional guides. Panel rendering is pending.";
    for (const g of geometry) {
      if (!descendants.has(g.start)) continue;
      const index=nodes.findIndex(n=>n.span.start===g.start);
      const target=this.canvas.querySelector<HTMLElement>(`[data-index="${index}"].screen-node`);
      if(target) { target.style.left=`${(g.x+dx)*this.scale}px`; target.style.top=`${(g.y+dy)*this.scale}px`; }
    }
    const target=this.canvas.querySelector<HTMLElement>(`[data-index="${provisional.index}"].screen-node`);
    const outline=this.canvas.querySelector<HTMLElement>(".screen-selection");
    if(target && outline) for(const key of ["left","top","width","height"] as const) outline.style[key]=target.style[key];
    this.positionMoveHandle();
  }
  private positionMoveHandle(): void {
    const outline=this.canvas.querySelector<HTMLElement>(".screen-selection"), handle=outline?.querySelector<HTMLElement>(".screen-move");
    if(!outline || !handle) return;
    const x=parseFloat(outline.style.left), y=parseFloat(outline.style.top);
    handle.style.left=`${Math.max(-x,Math.min(0,this.gameResolution.width*this.scale-x-handle.offsetWidth))}px`;
    handle.style.top=`${y>=34 ? -34 : Math.max(-y,Math.min(4,this.gameResolution.height*this.scale-y-30))}px`;
  }
  private releaseMove(): void {
    const move=this.move;this.move=undefined; delete this.canvas.dataset.dragging;
    if(move?.target.hasPointerCapture(move.pointer))move.target.releasePointerCapture(move.pointer);
  }
  private cancelMove(): void {
    if(!this.move)return;
    this.releaseMove();this.provisionalMove=undefined;this.drafts.delete(this.key());this.render();this.note("Move cancelled. No source was written.");
  }
  private positionSelection(): void {
    const node = this.nodes()[this.selected], target = this.canvas.querySelector<HTMLElement>(`[data-index="${this.selected}"]`);
    if (!this.frames.ready || !node || !target || size(node, "xsize") === undefined || size(node, "ysize") === undefined) { this.canvas.querySelector(".screen-selection")?.remove(); return; }
    let outline = this.canvas.querySelector<HTMLElement>(".screen-selection");
    if (outline?.dataset.index !== String(this.selected)) { outline?.remove(); outline = null; }
    if (outline) {
      for (const property of ["left", "top", "width", "height"] as const) outline.style[property] = target.style[property];
      const moveHandle=outline.querySelector<HTMLButtonElement>(".screen-move");
      if(moveHandle && !this.move) this.bindMovement(moveHandle,this.selected);
      this.positionMoveHandle(); return;
    }
    outline = el("div", "screen-selection"); outline.dataset.index=String(this.selected);
    for (const property of ["left", "top", "width", "height"] as const) outline.style[property] = target.style[property];
    const handle = button("", () => {}, "screen-resize"); handle.ariaLabel = "Resize selected element"; handle.title = "Drag to resize. Arrows resize by one pixel, Shift by eight. Escape cancels.";
    handle.onpointerdown = event => {
      const node=this.nodes()[this.selected]!;
      if (event.button !== 0 || !this.frames.ready || this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before resizing.", true); return; }
      const frame = node.kind === "frame", x = frame ? node.layout.xalign ?? 0 : 0, y = frame ? node.layout.yalign ?? 0 : 0;
      if (x >= 1 || y >= 1) { this.note("This anchor needs numeric editing in this slice.", true); return; }
      this.ensureDraft(); this.resize = { width: size(node, "xsize")!, height: size(node, "ysize")!, x: event.clientX, y: event.clientY, pointer: event.pointerId, handle };
      handle.setPointerCapture(event.pointerId); event.preventDefault();
    };
    handle.onpointermove = event => {
      const gesture = this.resize; if (!gesture) return;
      const node=this.nodes()[this.selected]!;
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
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) || !this.frames.ready || this.busy) return;
      event.preventDefault(); if (this.hasDraft()) { this.note("Apply or cancel unfinished changes before resizing.", true); return; }
      const draft = this.ensureDraft(), key = event.key === "ArrowLeft" || event.key === "ArrowRight" ? "width" : "height";
      const amount = (event.shiftKey ? 8 : 1) * (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1);
      draft[key] = String(Math.max(1, Math.min(16384, Number(draft[key]) + amount))); void this.apply();
    };
    if (node.position) {
      const moveHandle=button("Move frame",()=>{},"screen-move");
      const moveIcon=icon("plus");
      moveIcon.querySelector("path")!.setAttribute("d","M12 3v18M3 12h18m-12-6 3-3 3 3m-6 12 3 3 3-3M6 9l-3 3 3 3m12-6 3 3-3 3");
      moveHandle.prepend(moveIcon); this.bindMovement(moveHandle,this.selected); outline.append(moveHandle);
    }
    outline.append(handle); this.canvas.append(outline); this.positionMoveHandle();
  }
  private cancelResize(): void {
    if (!this.resize) return;
    const { handle, pointer } = this.resize; this.resize = undefined;
    if (handle.hasPointerCapture(pointer)) handle.releasePointerCapture(pointer);
    this.drafts.delete(this.key()); this.render(); this.note("Resize cancelled. No source was written.");
  }
}
