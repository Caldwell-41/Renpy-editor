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
interface Draft { document: ScreenDocument; screen: string; index: number; width: string; height: string }
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
  private readonly rail = el("nav", "screen-steps");
  private readonly drafts = new Map<string, Draft>();
  private documents: ScreenDocument[] = [];
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
    const heading = el("header", "screen-heading"); heading.append(el("h1", "", "Screens"));
    const tools = el("div", "screen-tools");
    tools.append(button("Undo", () => void this.history("undo")), button("Redo", () => void this.history("redo")),
      button("Refresh Source", () => void this.load()), button("View in Source", () => this.openSource()),
      button("Validate screen", () => this.test(true)), button("Test in Ren'Py", () => this.test(false), "button primary"));
    heading.append(tools);
    this.selection.ariaLabel = "Screen"; this.selection.onchange = () => {
      const [path, name] = JSON.parse(this.selection.value) as [string, string];
      this.doc = this.documents.find(d => d.path === path); this.screen = name; this.selected = 0; this.render();
    };
    const picker = el("label", "screen-picker", "Screen "); picker.append(this.selection);
    const limits = el("p", "muted screen-limits", "Existing custom screens · width and height only. Add, movement, styles, assets and Story Connect are not available yet.");
    for (const [id, label] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
      this.rail.append(button(label!, () => { this.step = id!; this.renderCard(); }));
    }
    this.rail.ariaLabel = "Screen building steps";
    const caption = el("div", "screen-canvas-tools");
    caption.append(el("h2", "", "Game preview"), el("span", "", `${actions.resolution.width} × ${actions.resolution.height}`), el("span", "muted", "Fit · schematic"));
    const viewport = el("div", "screen-viewport"); viewport.append(this.canvas);
    this.stage.ariaLabel = "Screen canvas"; this.stage.append(caption, viewport,
      el("p", "muted", "Canvas controls select elements. Ren'Py determines fonts, styling, actions and unsupported layout."));
    const workspace = el("div", "screen-flow"); workspace.append(this.rail, this.stage, this.card);
    this.message.role = "status"; this.message.ariaLive = "polite";
    this.panel.append(heading, picker, workspace, limits, this.message);
    this.panel.addEventListener("keydown", event => {
      if (event.key === "Escape") { if (this.resize) this.cancelResize(); else this.cancel(); event.stopPropagation(); }
    });
    this.observer = new ResizeObserver(() => this.renderCanvas()); this.observer.observe(viewport);
  }
  mount(host: HTMLElement): void { host.append(this.panel); void this.load(); }
  dispose(): void { this.disposed = true; this.observer.disconnect(); this.cancelResize(); }
  hasDraft(): boolean { return this.drafts.size > 0 || !!this.resize; }
  private current(): boolean { return !this.disposed && this.actions.current(); }
  private nodes(): ScreenNode[] { return this.doc?.screens.find(s => s.name === this.screen)?.nodes ?? []; }
  private key(): string { return JSON.stringify([this.doc?.path, this.screen, this.selected]); }
  private draft(): Draft | undefined { return this.drafts.get(this.key()); }
  private note(text: string, error = false): void { this.message.textContent = text; this.message.dataset.error = String(error); }
  async load(): Promise<void> {
    if (this.busy || this.resize) { this.note("Finish the current operation first. Input retained.", true); return; }
    const sequence = ++this.loadSequence;
    try {
      const inventory = await this.actions.request<SourceInventory>("source.list");
      const documents: ScreenDocument[] = [];
      for (const file of inventory.files) {
        if (!/^game\/ui\/[A-Za-z_][A-Za-z_0-9]{0,63}\.rpy$/.test(file.path)) continue;
        documents.push(await this.actions.request<ScreenDocument>("screens.inspect", { path: file.path }));
      }
      if (!this.current() || sequence !== this.loadSequence) return;
      const path = this.doc?.path; this.documents = documents;
      const supported = documents.filter(d => d.screens.length > 0);
      this.doc = supported.find(d => d.path === path) ?? supported[0];
      if (!this.doc?.screens.some(s => s.name === this.screen)) this.screen = this.doc?.screens[0]?.name ?? "";
      this.selected = Math.min(this.selected, Math.max(0, this.nodes().length - 1));
      this.selection.replaceChildren();
      documents.forEach(d => d.screens.forEach(s => { const option = el("option", "", `${s.name} · ${d.path}`); option.value = JSON.stringify([d.path, s.name]); this.selection.append(option); }));
      this.selection.value = JSON.stringify([this.doc?.path, this.screen]);
      this.render(); this.note(this.doc ? this.hasDraft() ? "Source refreshed. Unfinished drafts retain their original revision." : "Saved screen loaded. Unsupported regions remain in Source." : "No supported custom screens in game/ui. Create or edit a screen in Source.");
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
    const node = this.nodes()[this.selected]; if (this.doc) this.actions.source({ path: this.doc.path, expectedRevision: this.doc.revision, byteStart: node?.span.start, byteEnd: node?.span.end });
  }
  private test(validate: boolean): void {
    if (!this.doc || this.busy || this.hasDraft()) { this.note("Apply or cancel unfinished changes before testing the saved screen. Input retained.", true); return; }
    this.actions.preview({ purpose: "screen", path: this.doc.path, screenName: this.screen, expectedRevision: this.doc.revision }, validate);
  }
  private renderCanvas(): void {
    if (this.resize) return;
    this.canvas.replaceChildren();
    const { width, height } = this.actions.resolution;
    const available = this.canvas.parentElement?.clientWidth ?? 600;
    this.scale = Math.max(0.05, Math.min((available - 32) / width, 360 / height, 1));
    this.canvas.style.width = `${width * this.scale}px`; this.canvas.style.height = `${height * this.scale}px`;
    const nodes = this.nodes(), frameIndex = nodes.findIndex(n => n.kind === "frame");
    nodes.forEach((node, index) => {
      if (node.kind === "screen") return;
      const target = button(node.literal ?? names[node.kind] ?? node.kind, () => this.choose(index, true), `screen-node screen-node-${node.kind}`);
      target.ariaLabel = `Select ${node.literal ?? names[node.kind] ?? node.kind}`;
      target.dataset.index = String(index); target.ariaPressed = String(index === this.selected);
      const w = size(node, "xsize"), h = size(node, "ysize");
      if (index === frameIndex) {
        target.textContent = ""; target.ariaLabel = "Select Help frame";
        const fw = w ?? 640, fh = h ?? 360;
        target.style.left = `${(width - fw) * (node.layout.xalign ?? 0) * this.scale}px`;
        target.style.top = `${(height - fh) * (node.layout.yalign ?? 0) * this.scale}px`;
        target.style.width = `${fw * this.scale}px`; target.style.height = `${fh * this.scale}px`;
      } else {
        const frame = nodes[frameIndex], fw = size(frame, "xsize") ?? 640, fh = size(frame, "ysize") ?? 360;
        const left = (width - fw) * (frame?.layout.xalign ?? 0) + 24;
        const top = (height - fh) * (frame?.layout.yalign ?? 0) + 24 + Math.max(0, index - frameIndex - 1) * 48;
        target.style.left = `${left * this.scale}px`; target.style.top = `${top * this.scale}px`;
        target.style.width = `${(w ?? Math.max(48, fw - 48)) * this.scale}px`; target.style.height = `${(h ?? 40) * this.scale}px`;
        target.style.fontSize = `${Math.max(10, 22 * this.scale)}px`;
      }
      this.canvas.append(target);
    }); this.positionSelection();
  }
  private positionSelection(): void {
    this.canvas.querySelector(".screen-selection")?.remove();
    const node = this.nodes()[this.selected], target = this.canvas.querySelector<HTMLElement>(`[data-index="${this.selected}"]`);
    if (!node || !target || size(node, "xsize") === undefined || size(node, "ysize") === undefined) return;
    const draft = this.draft();
    if (draft && [draft.width, draft.height].every(v => /^[1-9]\d*$/.test(v) && Number(v) <= 16384)) {
      const dw = Number(draft.width), dh = Number(draft.height);
      target.style.width = `${dw * this.scale}px`; target.style.height = `${dh * this.scale}px`;
      if (node.kind === "frame") { target.style.left = `${(this.actions.resolution.width - dw) * (node.layout.xalign ?? 0) * this.scale}px`; target.style.top = `${(this.actions.resolution.height - dh) * (node.layout.yalign ?? 0) * this.scale}px`; }
    }
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
      target.style.left = node.kind === "frame" ? `${(this.actions.resolution.width - Number(draft.width)) * ax * this.scale}px` : target.style.left;
      target.style.top = node.kind === "frame" ? `${(this.actions.resolution.height - Number(draft.height)) * ay * this.scale}px` : target.style.top;
      for (const property of ["left", "top", "width", "height"] as const) outline.style[property] = target.style[property];
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
