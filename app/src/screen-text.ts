import type { CompositionCommand, CompositionView } from "./screen-composition.ts";
import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SelectedAsset } from "./asset-import-ui.ts";
import { technicalName, technicalNameInput } from "./authoring-input.ts";
import { ScreenFontMedia, type ProjectFont, type FontReference, type FontPresentation } from "./screen-font-media.ts";
import type { ScreenLayoutEditor, LayoutReservation } from "./screen-layout.ts";

export interface TextProperties {
  values: { font?: string; size?: number; color?: string; align?: number; bold?: boolean; italic?: boolean };
  blocked: Record<string, string>;
  expressions?: Record<string, string>;
}
export interface TextEdits { text?: string; font?: FontReference | null; size?: number | null; color?: string | null; align?: number | null; bold?: boolean | null; italic?: boolean | null }
type Field = "text" | "font" | "size" | "color" | "align" | "bold" | "italic";
type Fields = Record<Field, string>;
interface Draft { key: string; document: ScreenDocument; screenId: string; node: ScreenNode; fields: Fields; font?: FontReference | null }
interface Host {
  view: () => CompositionView | undefined;
  current: () => boolean;
  request: <T>(operation: CoreOperation, payload?: Record<string, unknown>) => Promise<T>;
  coordinate: <T>(task: () => Promise<T>) => Promise<T>;
  commit: (command: CompositionCommand, base: ScreenDocument) => Promise<void>;
  redraw: () => void; preview: () => void; source: () => void; saved: () => void;
  layoutTools: (host: HTMLElement) => void; order: (host: HTMLElement) => void;
  note: (text: string, error?: boolean) => void;
}
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const n = document.createElement(tag); n.className = className; n.textContent = text; return n;
};
const action = (text: string, run: () => void, primary = false) => {
  const b = el("button", `button ${primary ? "primary" : "secondary"}`, text); b.type = "button"; b.onclick = run; return b;
};
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const hex = (s: string) => /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(s);
const fontPath = (font: ProjectFont) => font.relativePath.slice(5);

/** Owns per-text drafts and picker state. ScreensWorkspace owns accepted transactions. */
export class ScreenText {
  private readonly drafts = new Map<string, Draft>();
  private readonly errors = new Map<string, {field: string; text: string}>();
  private readonly scrolls = new Map<string, number>();
  private readonly expanded = new Map<string, boolean>();
  private readonly media: ScreenFontMedia;
  private assets: ProjectFont[] = [];
  private loaded = false;
  private loading?: Promise<void>;
  private disposed = false;
  private generation = 0;
  private card?: HTMLElement;
  private cardKey?: string;
  private keys?: AbortController;
  private submitted?: {draft: Draft; command: CompositionCommand; layout: LayoutReservation};
  private dialog?: HTMLDialogElement;
  private pickerKey?: string;
  private search = "";
  private pickerGeneration = 0;
  private importing = false;
  private choosing = false;
  private preparing = false;
  private staged?: SelectedAsset;
  private importName = "";
  private importDisplay = "";
  private importError = "";
  private stagedValid = false;
  private observer?: IntersectionObserver;
  constructor(private readonly host: Host, private readonly layout: ScreenLayoutEditor) {
    this.media = new ScreenFontMedia(() => this.active(),host.request);
  }
  private active(): boolean { return !this.disposed && this.host.current(); }
  private key(view: CompositionView): string { return `${view.screenId}:${view.selected.id}`; }
  private fields(node: ScreenNode): Fields {
    const v = node.textProperties?.values;
    return {text:node.literal ?? node.textProperties?.expressions?.text ?? "Expression in Source",font:v?.font ?? "",
      size:v?.size === undefined ? "" : String(v.size),color:v?.color ?? "",align:v?.align === undefined ? "" : String(v.align),
      bold:v?.bold === undefined ? "" : v.bold ? "True" : "False",italic:v?.italic === undefined ? "" : v.italic ? "True" : "False"};
  }
  private value(view: CompositionView): Draft {
    return this.drafts.get(this.key(view)) ?? {key:this.key(view),document:view.document,screenId:view.screenId,node:view.selected,fields:this.fields(view.selected)};
  }
  hasDraft(): boolean { return this.drafts.size > 0; }
  hasNodeDraft(screenId: string, nodeId: string): boolean { return this.drafts.has(`${screenId}:${nodeId}`); }
  isSaving(): boolean { return !!this.submitted || this.importing || this.preparing; }
  invalidate(): void { this.loaded = false; this.generation++; this.loading = undefined; }
  unmount(): void {
    if (this.card && this.cardKey) {
      this.scrolls.set(this.cardKey,this.card.querySelector(".screen-text-body")?.scrollTop ?? 0);
      const layout = this.card.querySelector<HTMLDetailsElement>(".screen-text-layout");
      if (layout) this.expanded.set(this.cardKey,layout.open);
    }
    this.keys?.abort(); this.card = undefined; this.cardKey = undefined;
  }
  dispose(): void { this.disposed = true; this.generation++; this.closePicker(false); this.unmount(); this.media.dispose(); }
  private async refreshAssets(): Promise<void> {
    if (this.loaded) return;
    if (this.loading) return this.loading;
    const generation = this.generation;
    const loading = this.host.request<{assets: ProjectFont[]}>("authoring.list").then(model => {
      if (!this.active() || generation !== this.generation) return;
      this.assets = model.assets.filter(a => a.kind === "font"); this.loaded = true; this.sync();
    }).finally(() => { if (this.loading === loading) this.loading = undefined; });
    this.loading = loading; return loading;
  }
  private store(draft: Draft): void {
    const before = this.fields(draft.node);
    if (same(before,draft.fields)) this.drafts.delete(draft.key); else this.drafts.set(draft.key,draft);
    this.sync(); this.host.preview();
  }
  private edit(field: Field, value: string): void {
    const view = this.host.view(); if (!view || this.isSaving() || view.busy || view.selected.textProperties?.blocked[field]) return;
    const draft = this.value(view); draft.fields = {...draft.fields,[field]:value};
    if (this.errors.get(draft.key)?.field === field) this.errors.delete(draft.key);
    this.store(draft);
  }
  render(card: HTMLElement, view: CompositionView): boolean {
    if (!view.selected.id || !view.selected.textProperties || !["text","textbutton"].includes(view.selected.kind)) return false;
    this.card = card; this.cardKey = this.key(view); card.classList.add("screen-text"); card.ariaLabel = "Text editor";
    const heading = el("header", "screen-text-heading"); heading.append(el("h2", "", view.selected.kind === "textbutton" ? "Button text" : "Help text"),el("span","screen-text-draft"));
    const preview = action("Show preview",() => {const stage = card.closest(".screens-editor")?.querySelector<HTMLElement>(".screen-stage");stage?.scrollIntoView({block:"start"});stage?.querySelector<HTMLElement>("button")?.focus();}); preview.classList.add("screen-text-compact"); heading.append(preview);
    const body = el("div", "screen-text-body"), draft = this.value(view);
    const input = (field: "text" | "size" | "color", name: string) => {
      const label = el("label", "screen-text-field", name), control = field === "text" ? el("textarea") : el("input");
      control.ariaLabel = name; control.dataset.textField = field; control.value = draft.fields[field]; control.placeholder = "Default";
      if (control instanceof HTMLTextAreaElement) {control.rows = 3;control.maxLength = 8192;} else if (field === "size") control.inputMode = "numeric";
      control.readOnly = !!view.selected.textProperties?.blocked[field];
      if (control.readOnly && view.selected.textProperties?.expressions?.[field]) control.value = view.selected.textProperties.expressions[field]!;
      control.oninput = () => this.edit(field,control.value); label.append(control);
      if (control.readOnly) label.append(action("Edit in Source",this.host.source));
      if (field === "color") {const swatch = el("span","screen-text-swatch");swatch.ariaHidden = "true";label.append(swatch);}
      const error = el("span", "screen-text-field-error"); error.dataset.textError = field;error.id = `text-${view.selected.id}-${field}-error`;error.role = "alert";label.append(error);control.setAttribute("aria-describedby",error.id);
      return label;
    };
    const content = el("section","screen-text-content");content.append(input("text","Text"));
    const typography = el("section","screen-text-typography");typography.append(el("h3","","Typography"));
    const trigger = action("",() => view.selected.textProperties?.blocked.font ? this.host.source() : void this.openPicker());trigger.ariaLabel = view.selected.textProperties.blocked.font ? "Edit font expression in Source" : "Choose project font";trigger.dataset.textField = "font";trigger.classList.add("screen-text-font");
    typography.append(trigger);
    const warning = el("div","screen-text-font-warning");warning.append(el("p"),action("Choose another font",()=>void this.openPicker()));typography.append(warning);
    const fields = el("div","screen-text-fields");fields.append(input("size","Size · px"),input("color","Color"));
    const select = (field: "align" | "bold" | "italic", name: string, choices: [string,string][]) => {
      const label = el("label","screen-text-field",name), control = el("select");control.ariaLabel = name;control.dataset.textField = field;
      if (draft.fields[field] && !choices.some(([value]) => value === draft.fields[field])) choices.push([draft.fields[field],`Custom · ${draft.fields[field]}`]);
      for (const [value,text] of choices) {const option = el("option","",text);option.value = value;control.append(option);} control.value = draft.fields[field];control.disabled = !!view.selected.textProperties?.blocked[field];
      control.onchange = () => this.edit(field,control.value);label.append(control);if (control.disabled) label.append(action("Edit in Source",this.host.source));return label;
    };
    const row = el("div","screen-text-emphasis");row.append(select("align","Text alignment",[["","Default"],["0","Left"],["0.5","Center"],["1","Right"]]),select("bold","Bold",[["","Default"],["True","On"],["False","Off"]]),select("italic","Italic",[["","Default"],["True","On"],["False","Off"]]));
    typography.append(fields,row);body.append(content,typography);
    const disclosure = el("details","screen-text-layout");disclosure.open = this.expanded.get(this.cardKey) ?? false;disclosure.append(el("summary","","Layout"));
    const layoutHost = el("div");disclosure.append(layoutHost);this.layout.render(layoutHost,{sharedCommit:true});this.host.layoutTools(disclosure);this.host.order(disclosure);body.append(disclosure);
    const commit = el("div","screen-text-commit"), error = el("p","screen-text-error");error.role = "alert";
    const review = action("Review Source",this.host.source);review.dataset.textReview = "";
    const state = el("p","screen-text-state"), actions = el("div","screen-text-actions");
    const apply = action("Apply",()=>void this.apply(),true);apply.dataset.textApply = "";
    const cancel = action("Cancel",()=>this.cancel());cancel.dataset.textCancel = "";actions.append(apply,cancel);commit.append(error,review,state,actions);card.append(heading,body,commit);body.scrollTop = this.scrolls.get(this.cardKey) ?? 0;
    this.keys = new AbortController();card.addEventListener("keydown",event => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Escape") {event.preventDefault();event.stopPropagation();this.cancel();}
      else if (event.key === "Enter" && (!(event.target instanceof HTMLTextAreaElement) || event.ctrlKey || event.metaKey)) {event.preventDefault();event.stopPropagation();void this.apply();}
    },{signal:this.keys.signal});
    void this.refreshAssets().catch(error => {if (this.active()) this.host.note((error as Error).message,true);});this.sync();return true;
  }
  sync(): void {
    const view = this.host.view(), card = this.card;if (!view || !card?.isConnected || this.cardKey !== this.key(view)) return;
    const draft = this.value(view), dirty = this.drafts.has(draft.key) || this.layout.hasNodeDraft(view.document,view.screenName,view.selected), busy = view.busy || this.isSaving();
    const trigger = card.querySelector<HTMLButtonElement>(".screen-text-font")!, font = this.assets.find(a => fontPath(a) === draft.fields.font), blocked = view.selected.textProperties?.blocked.font;
    trigger.replaceChildren(el("strong","",blocked ? view.selected.textProperties?.expressions?.font ?? "Font expression" : font?.displayName ?? (draft.fields.font || "Default font")),el("small","",blocked ? "Expression in Source" : font ? `${fontPath(font)} · ${font.relativePath.endsWith(".otf") ? "OTF" : "TTF"}` : draft.fields.font ? "Not in the project font catalog" : "Inherit from the screen style"),el("span","screen-text-change",blocked ? "Source…" : "Choose…"));trigger.disabled = busy;
    const warning = card.querySelector<HTMLElement>(".screen-text-font-warning")!;
    warning.hidden = !!blocked || !this.loaded || !draft.fields.font || font?.status === "available";
    warning.querySelector("p")!.textContent = font?.status === "missing" ? "Font missing. Restore the file or choose another project font." : "This font is unavailable. Choose another TTF or OTF font.";
    const error = this.errors.get(draft.key);card.querySelector<HTMLElement>(".screen-text-draft")!.textContent = dirty ? "Draft" : "";
    for (const field of ["text","size","color"] as const) {
      const control = card.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[data-text-field="${field}"]`)!;
      control.readOnly = busy || !!view.selected.textProperties?.blocked[field];control.setAttribute("aria-invalid",String(error?.field === field));
      const message = card.querySelector<HTMLElement>(`[data-text-error="${field}"]`)!;message.textContent = error?.field === field ? error.text : "";message.hidden = !message.textContent;
    }
    const color = draft.fields.color;card.querySelector<HTMLElement>(".screen-text-swatch")!.style.backgroundColor = hex(color) ? color : "transparent";
    for (const select of card.querySelectorAll<HTMLSelectElement>("select[data-text-field]")) select.disabled = busy || !!view.selected.textProperties?.blocked[select.dataset.textField!];
    const general = card.querySelector<HTMLElement>(".screen-text-error")!;general.textContent = error && !["text","size","color"].includes(error.field) ? error.text : "";general.hidden = !general.textContent;
    card.querySelector<HTMLElement>("[data-text-review]")!.hidden = error?.field !== "source";
    card.querySelector<HTMLElement>(".screen-text-state")!.textContent = busy ? "Applying text…" : dirty ? "Changes apply to this text only." : "";
    card.querySelector<HTMLButtonElement>("[data-text-apply]")!.disabled = card.querySelector<HTMLButtonElement>("[data-text-cancel]")!.disabled = busy || !dirty;
  }
  private values(draft: Draft, strict: boolean): TextEdits {
    const values: TextEdits = {}, before = this.fields(draft.node), blocked = draft.node.textProperties?.blocked ?? {};
    const fail = (field: string,text: string) => {if (strict) {this.fail(field,text);throw Error(text);}};
    if (!blocked.text && draft.fields.text !== before.text) {
      if (!draft.fields.text.trim()) fail("text","Enter text before applying. Your edits are kept.");else values.text = draft.fields.text;
    }
    for (const field of ["size","color","align","bold","italic"] as const) {
      if (blocked[field] || draft.fields[field] === before[field]) continue;
      const value = draft.fields[field].trim();
      if (field === "size" && value && (!/^\d+$/.test(value) || +value < 1 || +value > 512)) {fail(field,"Use a whole size from 1 to 512 px, or clear it for the default. Your edits are kept.");continue;}
      if (field === "color" && value && !hex(value)) {fail(field,"Use a hex color such as #f1e9d6, or clear it for the default. Your edits are kept.");continue;}
      if (field === "size" || field === "align") values[field] = value ? Number(value) : null;
      else if (field === "color") values.color = value || null;
      else values[field] = value ? value === "True" : null;
    }
    if (!blocked.font && draft.fields.font !== before.font) {
      if (!draft.fields.font) values.font = null;
      else if (draft.font) values.font = draft.font;
      else fail("font","Choose a project font. Your edits are kept.");
    }
    return values;
  }
  private fail(field: string,text: string): void {
    const view = this.host.view();if (!view) return;this.errors.set(this.key(view),{field,text});this.host.note(text,true);this.sync();this.focus(field);
  }
  private focus(field: string): void {
    const selector = field.startsWith("layout:") ? `[data-layout-field="${field.slice(7)}"]` : `[data-text-field="${field}"]`;
    this.card?.querySelector<HTMLElement>(selector)?.focus({preventScroll:true});
  }
  private cancel(): void {
    const view = this.host.view();if (!view || this.isSaving() || view.busy) return;
    const active = (document.activeElement as HTMLElement | null)?.dataset, field = active?.textField ?? (active?.layoutField ? `layout:${active.layoutField}` : undefined);
    this.drafts.delete(this.key(view));this.errors.delete(this.key(view));this.layout.cancelCurrent();this.host.redraw();if (field) this.focus(field);this.host.preview();this.host.note("Text changes cancelled. No source was written.");
  }
  private async apply(): Promise<void> {
    const view = this.host.view();if (!view || this.isSaving() || view.busy) return;
    const draft = this.value(view);let values: TextEdits, layout: ReturnType<ScreenLayoutEditor["currentDraft"]>;
    try {values = this.values(draft,true);layout = this.layout.currentDraft(true);} catch {return;}
    if (!Object.keys(values).length && !layout) return;
    if (layout && layout.document.revision !== draft.document.revision) {this.fail("source","Text and layout use different Source revisions. Your edits are kept.");return;}
    const reservation = this.layout.reserveForComposition(draft.document);
    if (!draft.node.textProperties?.blocked.font && draft.fields.font) {
      this.preparing = true;this.sync();
      try {await this.refreshAssets();const font = this.assets.find(a => fontPath(a) === draft.fields.font);if (!font || font.status !== "available") throw Error("The font is missing or unreadable. Choose another project font. Your edits are kept.");await this.media.load(font);} catch (error) {reservation.release();this.fail("font",(error as Error).message);return;}
      finally {this.preparing = false;if (this.active()) this.sync();}
      if (!this.active()) {reservation.release();return;}
    }
    const active = (document.activeElement as HTMLElement | null)?.dataset, field = active?.textField ?? (active?.layoutField ? `layout:${active.layoutField}` : "text");
    const command: CompositionCommand = {type:"formatText",nodeId:view.selected.id!,values,...(layout ? {layout:layout.values} : {})};
    const submitted = {draft,command,layout:reservation};this.submitted = submitted;this.sync();
    try {await this.host.commit(command,draft.document);if (this.active()) this.focus(field);}
    catch (error) {if (this.active()) this.fail("source",`${(error as Error).message} Your edits are kept.`);}
    finally {if (this.submitted === submitted) this.submitted = undefined;submitted.layout.release();if (this.active()) this.sync();}
  }
  accept(command: CompositionCommand, base: ScreenDocument, accepted: ScreenDocument): void {
    const submitted = this.submitted;
    if (command.type === "formatText" && submitted?.command === command) {this.drafts.delete(submitted.draft.key);this.errors.delete(submitted.draft.key);submitted.layout.accept(accepted);}
    for (const draft of this.drafts.values()) {
      if (draft.document.path !== base.path || draft.document.revision !== base.revision) continue;
      const after = accepted.screens.flatMap(s => s.nodes).find(n => n.id === draft.node.id);
      if (after && same(this.fields(after),this.fields(draft.node))) {draft.node = after;draft.document = accepted;}
    }
  }
  canvasDraft(): {stale: boolean; samples: {nodeStart: number; values: TextEdits}[]} {
    const view = this.host.view(), samples: {nodeStart:number;values:TextEdits}[] = [];let stale = false;
    if (!view) return {stale:this.hasDraft(),samples};
    for (const draft of this.drafts.values()) {
      if (draft.screenId !== view.screenId) continue;
      const node = view.nodes.find(n => n.id === draft.node.id);
      if (!node || draft.document.revision !== view.document.revision) stale = true;
      else samples.push({nodeStart:node.span.start,values:this.values(draft,false)});
    }
    return {stale,samples};
  }
  renderRetained(host: HTMLElement, documents: ScreenDocument[]): void {
    for (const draft of this.drafts.values()) {
      if (documents.some(d => d.path === draft.document.path && d.screens.some(s => s.nodes.some(n => n.id === draft.node.id)))) continue;
      const section = el("section","screen-retained-draft");section.append(el("p","","This text is no longer available in Source. Your draft is retained."));
      const value = el("textarea");value.readOnly = true;value.ariaLabel = "Retained text draft";value.value = Object.entries(draft.fields).map(([k,v]) => `${k}: ${v}`).join("\n");
      section.append(value,action("Discard retained text draft",()=>{this.drafts.delete(draft.key);this.errors.delete(draft.key);section.remove();this.host.preview();}));host.append(section);
    }
  }
  private closePicker(focus = true): void {
    this.pickerGeneration++;this.observer?.disconnect();const dialog = this.dialog;this.dialog = undefined;dialog?.close();dialog?.remove();this.pickerKey = undefined;this.staged = undefined;this.stagedValid = false;this.choosing = false;
    if (focus && this.active()) this.focus("font");
  }
  private async openPicker(): Promise<void> {
    const view = this.host.view();if (!view || this.isSaving() || view.busy) return;
    const generation = ++this.pickerGeneration, key = this.key(view);
    try {await this.refreshAssets();} catch (error) {this.fail("font",(error as Error).message);return;}
    if (!this.active() || generation !== this.pickerGeneration || !this.host.view() || this.key(this.host.view()!) !== key) return;this.closePicker(false);this.pickerKey = key;this.search = "";this.importName = this.importDisplay = this.importError = "";
    const dialog = el("dialog","screen-font-dialog");dialog.ariaLabel = "Choose project font";dialog.oncancel = event => {event.preventDefault();if (!this.importing) {if (this.choosing) this.cancelImport();else this.closePicker();}};
    dialog.onkeydown = event => {event.stopPropagation();if (event.key === "Escape") {event.preventDefault();if (!this.importing) {if (this.choosing) this.cancelImport();else this.closePicker();}return;}if (event.key !== "Tab") return;const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled)')].filter(n => n.getClientRects().length),first = controls[0],last = controls.at(-1);if (event.shiftKey && document.activeElement === first) {event.preventDefault();last?.focus();}else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first?.focus();}};
    this.dialog = dialog;this.card?.closest(".screens-editor")?.append(dialog);this.renderPicker();dialog.showModal();dialog.querySelector<HTMLInputElement>("input")?.focus();
  }
  private renderPicker(): void {
    const dialog = this.dialog, view = this.host.view();if (!dialog || !view) return;this.observer?.disconnect();dialog.replaceChildren();this.choosing = false;
    const heading = el("header");heading.append(el("h2","","Choose project font"),action("Close",()=>this.closePicker()));
    const search = el("input");search.type = "search";search.ariaLabel = "Search project fonts";search.placeholder = "Search project fonts";search.value = this.search;search.oninput = () => {this.search = search.value;this.renderOptions(list);};
    const list = el("div","screen-font-list");dialog.append(heading,search,list,action("Import font…",()=>this.renderImport()));this.renderOptions(list);
  }
  private renderOptions(list: HTMLElement): void {
    const view = this.host.view();if (!view) return;this.observer?.disconnect();list.replaceChildren();
    const inherited = action("Default font · Inherit from the screen style",()=>this.use());inherited.classList.add("screen-font-inherit");list.append(inherited);
    const matches = this.assets.filter(a => `${a.displayName} ${a.relativePath}`.toLowerCase().includes(this.search.toLowerCase()));
    if (!matches.length) list.append(el("p","","No project fonts match this search."));
    const load = (row: HTMLButtonElement,font: ProjectFont) => {
      if (row.dataset.loading) return;row.dataset.loading = "true";
      void this.media.load(font).then(family => {if (!row.isConnected) return;row.querySelector<HTMLElement>(".screen-font-specimen")!.style.fontFamily = family;row.disabled = false;row.querySelector<HTMLElement>(".screen-font-loading")!.textContent = "";}).catch(error => {if (row.isConnected) row.querySelector<HTMLElement>(".screen-font-loading")!.textContent = (error as Error).message;});
    };
    this.observer = new IntersectionObserver(entries => {for (const entry of entries) if (entry.isIntersecting) {const row = entry.target as HTMLButtonElement,font = matches.find(a => a.id === row.dataset.fontId);if (font) load(row,font);}} ,{root:list});
    for (const font of matches) {
      const row = action("",()=>this.use(font));row.classList.add("screen-font-option");row.dataset.fontId = font.id;row.ariaLabel = `Use ${font.displayName}`;row.disabled = true;
      const heading = el("span","screen-font-option-heading");heading.append(el("strong","",font.displayName),el("span","",fontPath(font) === this.value(view).fields.font ? "Selected" : ""));
      row.append(heading,el("small","",`${fontPath(font)} · ${font.relativePath.endsWith(".otf") ? "OTF" : "TTF"}`),el("span","screen-font-specimen",this.value(view).fields.text),el("small","screen-font-loading",font.status === "available" ? "Loading font…" : `Font ${font.status}`));list.append(row);
      if (font.status === "available") this.observer.observe(row);
    }
  }
  private use(font?: ProjectFont): void {
    const view = this.host.view();if (!view || this.key(view) !== this.pickerKey || font && !this.media.get(font)) return;
    const draft = this.value(view);draft.fields = {...draft.fields,font:font ? fontPath(font) : ""};draft.font = font ? {assetId:font.id,expectedAssetSha256:font.sha256} : null;this.errors.delete(draft.key);this.store(draft);this.closePicker();
  }
  private cancelImport(): void {if (this.importing) return;this.pickerGeneration++;this.staged = undefined;this.stagedValid = false;this.renderPicker();this.dialog?.querySelector<HTMLInputElement>("input")?.focus();}
  private renderImport(): void {
    const dialog = this.dialog;if (!dialog) return;this.observer?.disconnect();dialog.replaceChildren();this.choosing = true;
    dialog.append(action("Back to project fonts",()=>this.cancelImport()),el("h2","","Import font"),el("p","screen-font-boundary","TTF or OTF · Up to 16 MiB"));
    const browse = action(this.staged ? "Choose file again…" : "Browse files…",()=>void this.chooseFile());browse.disabled = this.importing;dialog.append(browse);
    if (this.staged) dialog.append(el("p","",this.staged.displayName));
    const input = (name: string,value: string,change: (value: string) => void) => {const label = el("label","screen-text-field",name),control = el("input");control.ariaLabel = name;control.value = value;control.disabled = this.importing;control.oninput = () => change(control.value);label.append(control);dialog.append(label);return control;};
    technicalNameInput(input("Ren'Py name",this.importName,value => {this.importName = value;this.updateDestination();}));input("Display name",this.importDisplay,value => {this.importDisplay = value;});
    dialog.append(el("p","screen-font-destination"),el("p","screen-font-import-error",this.importError));
    const actions = el("div","screen-font-import-actions"),cancel = action("Cancel import",()=>this.cancelImport()),submit = action("Import and use",()=>void this.importFont(),true);cancel.disabled = this.importing;submit.dataset.fontImport = "";submit.disabled = this.importing || !this.staged || !this.stagedValid;actions.append(cancel,submit);dialog.append(actions);this.updateDestination();
  }
  private updateDestination(): void {const target = this.dialog?.querySelector<HTMLElement>(".screen-font-destination");if (target) target.textContent = `Project destination: game/fonts/${this.importName || "font"}.${this.staged?.extension ?? "ttf"}`;}
  private async chooseFile(): Promise<void> {
    const generation = ++this.pickerGeneration, previousValid = this.stagedValid;this.importError = "";this.stagedValid = false;
    const submit = this.dialog?.querySelector<HTMLButtonElement>("[data-font-import]");if (submit) submit.disabled = true;
    try {
      const choice = await this.host.request<SelectedAsset & {cancelled?: boolean}>("asset.chooseFont");
      if (!this.active() || !this.dialog || !this.choosing || generation !== this.pickerGeneration) return;
      if (choice.cancelled) {this.stagedValid = previousValid;this.renderImport();return;}
      this.staged = choice;this.stagedValid = false;
      if (!this.importName) this.importName = choice.displayName.replace(/\.[^.]+$/,"").toLowerCase().replace(/[^a-z0-9_]/g,"_").replace(/^[^a-z]+/,"").slice(0,64) || "font";
      if (!this.importDisplay) this.importDisplay = choice.displayName.replace(/\.[^.]+$/,"");
      await this.host.request<FontPresentation>("asset.previewFont",{authorityId:choice.authorityId});
      if (generation !== this.pickerGeneration || !this.dialog || !this.choosing) return;this.stagedValid = true;
    } catch (error) {if (generation === this.pickerGeneration) this.importError = `${(error as Error).message} Your file and names are kept.`;}
    if (this.active() && generation === this.pickerGeneration && this.dialog && this.choosing) this.renderImport();
  }
  private async importFont(): Promise<void> {
    const selected = this.staged, view = this.host.view();if (!selected || !this.stagedValid || !view || this.importing) return;
    let name: string;try {name = technicalName(this.importName,"Ren'Py name");if (!this.importDisplay.trim()) throw Error("Display name is required.");} catch (error) {this.importError = (error as Error).message;this.renderImport();return;}
    const pickerKey = this.pickerKey;this.importing = true;this.renderImport();this.sync();
    try {
      const model = await this.host.coordinate(()=>this.host.request<{assets: ProjectFont[]}>("asset.import",{authorityId:selected.authorityId,kind:"font",technicalName:name,displayName:this.importDisplay.trim(),characterId:null,expression:null}));
      this.host.saved();this.assets = model.assets.filter(a => a.kind === "font");this.loaded = true;
      const font = this.assets.find(a => a.relativePath === `game/fonts/${name}.${selected.extension}`);if (!font) throw Error("The imported font is unavailable.");
      await this.media.load(font);if (this.active() && this.dialog && this.pickerKey === pickerKey) this.use(font);
    } catch (error) {this.importError = `${(error as Error).message} Your file and names are kept. Choose the file again to retry.`;this.stagedValid = false;}
    finally {this.importing = false;if (this.active()) {if (this.dialog) this.renderImport();this.sync();if (!this.dialog) this.focus("font");}}
  }
}
