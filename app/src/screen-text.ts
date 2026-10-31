import { ScreenCanvasFrames } from "./screen-canvas-frames.ts";
import type { CompositionCommand, CompositionView } from "./screen-composition.ts";
import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";
import type { CoreOperation } from "./protocol.ts";
import type { SelectedAsset } from "./asset-import-ui.ts";
import { technicalName, technicalNameInput, technicalNameHelp, validateField } from "./authoring-input.ts";
import { ScreenFontMedia, type ProjectFont, type FontReference, type FontPresentation } from "./screen-font-media.ts";
import type { ScreenLayoutEditor, LayoutReservation } from "./screen-layout.ts";

export interface TextProperties {
  values: { font?: string; size?: number; color?: string; align?: number; bold?: boolean; italic?: boolean; [key:string]:unknown };
  blocked: Record<string, string>;
  expressions?: Record<string, string>;
}
export interface TextEdits { appearance?: Record<string,string|number|boolean|{color:string;width:number}|FontReference|null>; text?: string; font?: FontReference | null; size?: number | null; color?: string | null; align?: number | null; bold?: boolean | null; italic?: boolean | null }
export interface StyleUse {path:string; screenName:string; nodeId:string|null; nodeStart:number}
export interface StyleDefinition {name:string; path:string; kind:string; values:TextProperties["values"]; uses:StyleUse[]; error:string|null}
export interface StyleCatalog {error?:string|null; revision:string; definitions:StyleDefinition[]}
export interface StyleEdit {scope:"shared"|"local"|"create"; name:string; expectedRevision:string}
type Field = "text" | "font" | "size" | "color" | "align" | "bold" | "italic";
type Fields = Record<Field, string>;
type TextField = "text" | "size" | "color";
interface Draft { key: string; document: ScreenDocument; screenId: string; node: ScreenNode; fields: Fields; appearance:Record<string,string>; edited:Set<string>; font?: FontReference | null; style?: StyleEdit }
interface Host {
  view: () => CompositionView | undefined;
  styles?: () => StyleCatalog | undefined;
  buttonSample?: (state:string) => void;
  documents?: () => readonly ScreenDocument[];
  inspect: (path:string) => Promise<ScreenDocument>;
  resolution?: {width:number;height:number};
  reviewing?: (active:boolean) => void;
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
  private readonly fieldErrors = new Map<string, Set<string>>();
  private readonly fieldValidators = new Map<string, () => void>();
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
  private styleDialog?: HTMLDialogElement;
  private dismissStyle?: () => void;
  private lastField?: string;
  private readonly appearanceStates = new Map<string,string>();
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
  private readonly importFieldErrors = new Set<string>();
  private readonly importValidators = new Map<string, {control: HTMLInputElement; validate: () => void}>();
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
    return this.drafts.get(this.key(view)) ?? {key:this.key(view),document:view.document,screenId:view.screenId,node:view.selected,fields:this.fields(view.selected),appearance:this.extraFields(view.selected.textProperties?.values??{}),edited:new Set(), ...(view.selected.style && this.host.styles?.() ? {style:{scope:"shared",name:view.selected.style.name,expectedRevision:this.host.styles()!.revision}} : {})};
  }
  hasDraft(): boolean { return this.drafts.size > 0; }
  hasNodeDraft(screenId: string, nodeId: string): boolean { return this.drafts.has(`${screenId}:${nodeId}`); }
  isSaving(): boolean { return !!this.submitted || this.importing || this.preparing || !!this.styleDialog; }
  invalidate(): void { this.loaded = false; this.generation++; this.loading = undefined; }
  unmount(): void {
    if (this.card && this.cardKey) {
      this.scrolls.set(this.cardKey,this.card.querySelector(".screen-text-body")?.scrollTop ?? 0);
      const layout = this.card.querySelector<HTMLDetailsElement>(".screen-text-layout");
      if (layout) this.expanded.set(this.cardKey,layout.open);
    }
    this.keys?.abort(); this.fieldValidators.clear(); this.card = undefined; this.cardKey = undefined;
  }
  dispose(): void { this.disposed = true; this.generation++; this.closePicker(false); this.dismissStyle?.(); this.styleDialog?.remove(); this.styleDialog = undefined; this.unmount(); this.media.dispose(); }
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
  private store(draft: Draft, view: CompositionView): void {
    if (same(this.fields(view.selected),draft.fields) && same(this.extraFields(view.selected.textProperties?.values??{}),draft.appearance) && (!draft.style || draft.style.scope === "shared" && draft.style.name === view.selected.style?.name)) {
      this.drafts.delete(draft.key);this.errors.delete(draft.key);this.fieldErrors.delete(draft.key);
    } else this.drafts.set(draft.key,draft);
    this.sync(); this.host.preview();
  }
  private edit(field: Field, value: string): void {
    const view = this.host.view(); if (!view || this.isSaving() || view.busy || view.selected.textProperties?.blocked[field]) return;
    const draft = this.value(view); draft.fields = {...draft.fields,[field]:value};
    if(field!=="text")this.markEdited(draft,field,value!==this.appearanceFields(this.styleValues(draft))[field]);
    this.store(draft,view);
  }
  render(card: HTMLElement, view: CompositionView): boolean {
    if (!view.selected.id || !view.selected.textProperties || !["text","textbutton","frame","window"].includes(view.selected.kind)) return false;
    this.card = card; this.cardKey = this.key(view); card.classList.add("screen-text"); card.ariaLabel = "Text editor";
    const heading = el("header", "screen-text-heading"); heading.append(el("h2", "", view.selected.kind === "textbutton" ? "Button appearance" : view.selected.kind === "frame" || view.selected.kind === "window" ? "Frame appearance" : "Help text"),el("span","screen-text-draft"));
    const preview = action("Show preview",() => {const stage = card.closest(".screens-editor")?.querySelector<HTMLElement>(".screen-stage");stage?.scrollIntoView({block:"start"});stage?.querySelector<HTMLElement>("button")?.focus();}); preview.classList.add("screen-text-compact"); heading.append(preview);
    const body = el("div", "screen-text-body"), draft = this.value(view);
    const input = (field: TextField, name: string) => {
      const label = el("label", "screen-text-field", field === "text" ? "" : name), control = field === "text" ? el("textarea") : el("input");
      control.ariaLabel = name; control.dataset.textField = field; control.value = draft.fields[field]; control.placeholder = "Default";
      if (control instanceof HTMLTextAreaElement) {control.rows = 3;control.maxLength = 8192;} else if (field === "size") control.inputMode = "numeric";
      control.readOnly = !!view.selected.textProperties?.blocked[field];
      if (control.readOnly && view.selected.textProperties?.expressions?.[field]) control.value = view.selected.textProperties.expressions[field]!;
      control.oninput = () => this.edit(field,control.value); label.append(control);
      if (control.readOnly) label.append(action("Edit in Source",this.host.source));
      if (field === "color") {const swatch = el("span","screen-text-swatch");swatch.ariaHidden = "true";label.append(swatch);}
      this.registerField(view,field,control,() => control.readOnly ? undefined : this.fieldError(field,control.value));
      return label;
    };
    const content = el("section","screen-text-content");
    const localLabel = el("div","screen-text-local-label");localLabel.append(el("strong","","Text content"),el("span","","This element only"));
    content.append(localLabel,input("text","Text"));content.hidden=!["text","textbutton"].includes(view.selected.kind);
    const typography = el("section","screen-text-typography");
    if (view.selected.style || this.host.styles?.()) {typography.classList.add("screen-style-appearance");typography.append(this.renderScope());}
    else typography.append(el("h3","","Typography"));
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
    typography.append(fields,row);
    if(["frame","window"].includes(view.selected.kind)){trigger.hidden=true;warning.hidden=true;fields.hidden=true;row.hidden=true;}
    if(["frame","window","textbutton"].includes(view.selected.kind)) {const extra=el("div","screen-appearance-fields");this.renderAppearance(extra,view);typography.append(extra);}
    body.append(content,typography);
    const disclosure = el("details","screen-text-layout");disclosure.open = this.expanded.get(this.cardKey) ?? false;const layoutSummary = el("summary","","Layout"), local = el("span","screen-text-local-scope","This element only");layoutSummary.append(local);disclosure.append(layoutSummary);
    const layoutHost = el("div");disclosure.append(layoutHost);this.layout.render(layoutHost,{sharedCommit:true});this.host.layoutTools(disclosure);this.host.order(disclosure);body.append(disclosure);
    const commit = el("div","screen-text-commit"), error = el("p","screen-text-error");error.role = "alert";
    const review = action("Review Source",this.host.source);review.dataset.textReview = "";
    const state = el("p","screen-text-state"), actions = el("div","screen-text-actions");
    const apply = action("Apply",()=>void this.apply(),true);apply.dataset.textApply = "";
    const cancel = action("Cancel",()=>this.cancel());cancel.dataset.textCancel = "";actions.append(apply,cancel);commit.append(error,review,state,actions);card.append(heading,body,commit);body.scrollTop = this.scrolls.get(this.cardKey) ?? 0;
    this.keys = new AbortController();card.addEventListener("focusin",event=>{const target=event.target as HTMLElement;if(target.dataset.textField)this.lastField=target.dataset.textField;if(target.dataset.appearanceField)this.lastField=`appearance:${target.dataset.appearanceField}`;if(target.dataset.layoutField)this.lastField=`layout:${target.dataset.layoutField}`;},{signal:this.keys.signal});card.addEventListener("keydown",event => {
      if (event.isComposing || event.keyCode === 229 || (event.target as HTMLElement).closest(".screen-style-heading")) return;
      if (event.key === "Escape") {event.preventDefault();event.stopPropagation();this.cancel();}
      else if (event.key === "Enter" && !(event.target as HTMLElement).closest("button") && (!(event.target instanceof HTMLTextAreaElement) || event.ctrlKey || event.metaKey)) {event.preventDefault();event.stopPropagation();void this.apply();}
    },{signal:this.keys.signal});
    void this.refreshAssets().catch(error => {if (this.active()) this.host.note((error as Error).message,true);});this.sync();
    for (const field of this.fieldErrors.get(this.key(view)) ?? []) {try {this.fieldValidators.get(field)?.();} catch { /* Restore this element's field error after navigation. */ }}
    return true;
  }
  sync(): void {
    const view = this.host.view(), card = this.card;if (!view || !card?.isConnected || this.cardKey !== this.key(view)) return;
    this.syncScope();
    const draft = this.value(view), dirty = this.drafts.has(draft.key) || this.layout.hasNodeDraft(view.document,view.screenName,view.selected), busy = view.busy || this.isSaving();
    const trigger = card.querySelector<HTMLButtonElement>(".screen-text-font")!, font = this.assets.find(a => fontPath(a) === draft.fields.font), blocked = view.selected.textProperties?.blocked.font;
    trigger.replaceChildren(el("strong","",blocked ? view.selected.textProperties?.expressions?.font ?? "Font expression" : font?.displayName ?? (draft.fields.font || "Default font")),el("small","",blocked ? "Expression in Source" : font ? `${fontPath(font)} · ${font.relativePath.endsWith(".otf") ? "OTF" : "TTF"}` : draft.fields.font ? "Not in the project font catalog" : "Inherit from the screen style"),el("span","screen-text-change",blocked ? "Source…" : "Choose…"));trigger.disabled = busy;
    const warning = card.querySelector<HTMLElement>(".screen-text-font-warning")!;
    warning.hidden = ["frame","window"].includes(view.selected.kind) || !!blocked || !this.loaded || !draft.fields.font || font?.status === "available";
    warning.querySelector("p")!.textContent = font?.status === "missing" ? "Font missing. Restore the file or choose another project font." : "This font is unavailable. Choose another TTF or OTF font.";
    const error = this.errors.get(draft.key);card.querySelector<HTMLElement>(".screen-text-draft")!.textContent = dirty ? "Draft" : "";
    for (const field of ["text","size","color"] as const) {
      const control = card.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[data-text-field="${field}"]`)!;
      control.readOnly = busy || !!view.selected.textProperties?.blocked[field];
    }
    for(const control of card.querySelectorAll<HTMLInputElement|HTMLSelectElement>("[data-appearance-field]"))control.disabled=busy;
    const color = draft.fields.color;card.querySelector<HTMLElement>(".screen-text-swatch")!.style.backgroundColor = hex(color) ? color : "transparent";
    for (const select of card.querySelectorAll<HTMLSelectElement>("select[data-text-field]")) select.disabled = busy || !!view.selected.textProperties?.blocked[select.dataset.textField!];
    const general = card.querySelector<HTMLElement>(".screen-text-error")!;general.textContent = error && !["text","size","color"].includes(error.field) ? error.text : "";general.hidden = !general.textContent;
    card.querySelector<HTMLElement>("[data-text-review]")!.hidden = error?.field !== "source";
    const style=this.styleAction(draft,this.values(draft,false)),uses=this.uses(draft),screens=new Set(uses.map(u=>JSON.stringify([u.path,u.screenName]))).size,shared=style?.scope==="shared"&&Object.keys(this.sharedValues(draft,this.values(draft,false))).length>0;
    card.querySelector<HTMLElement>(".screen-text-state")!.textContent = busy ? "Applying changes…" : dirty ? shared ? `Shared appearance changes apply to ${screens} screens and ${uses.length} elements. Text content and Layout change this element only.` : "Changes apply to this element only." : "";
    card.querySelector<HTMLButtonElement>("[data-text-apply]")!.textContent=style ? shared ? `Apply to ${screens} ${screens===1?"screen":"screens"}…` : "Apply to this element…" : "Apply";
    card.querySelector<HTMLButtonElement>("[data-text-apply]")!.disabled = card.querySelector<HTMLButtonElement>("[data-text-cancel]")!.disabled = busy || !dirty;
  }
  private styleAction(draft:Draft,values:TextEdits):StyleEdit|undefined {
    return draft.style&&(draft.style.scope!=="shared"||draft.style.name!==draft.node.style?.name||Object.keys(this.sharedValues(draft,values)).length)?{...draft.style}:undefined;
  }
  private styleOwns(draft:Draft,key:string):boolean {
    return this.definition(draft)?.kind!=="text"||!/(?:background|border(?:Color|Width)?)$/.test(key);
  }
  private sharedValues(draft:Draft,values:TextEdits):TextEdits {
    const shared={...values};delete shared.text;
    if(shared.appearance){const appearance=Object.fromEntries(Object.entries(shared.appearance).filter(([key])=>this.styleOwns(draft,key)));if(Object.keys(appearance).length)shared.appearance=appearance;else delete shared.appearance;}
    return shared;
  }
  private uses(draft:Draft):StyleUse[] {
    const uses=[...this.definition(draft)?.uses??[]],view=this.host.view();
    if(view&&!uses.some(u=>u.path===draft.document.path&&u.nodeId===draft.node.id))uses.push({path:draft.document.path,screenName:view.screenName,nodeId:draft.node.id!,nodeStart:draft.node.span.start});
    return uses;
  }
  private previewValues(draft:Draft):TextEdits {
    const values=this.values(draft,false);
    if(draft.style?.scope!=="shared"||draft.style.name===draft.node.style?.name)return values;
    const fields=draft.fields,font=this.assets.find(a=>fontPath(a)===fields.font),definition=this.definition(draft);
    const appearance:NonNullable<TextEdits["appearance"]>={};
    for(const key of new Set([...Object.keys(draft.node.textProperties?.values??{}),...Object.keys(definition?.values??{})])) {
      if(["font","size","color","align","bold","italic"].includes(key))continue;
      if(!this.styleOwns(draft,key)||this.appearanceBlocked(draft.node,key))continue;
      const value=definition?.values[key];
      if(key.endsWith("_font")&&typeof value==="string") {
        const asset=this.assets.find(a=>fontPath(a)===value);
        if(asset)appearance[key]={assetId:asset.id,expectedAssetSha256:asset.sha256};
      } else appearance[key]=(value??null) as NonNullable<TextEdits["appearance"]>[string];
    }
    Object.assign(appearance,values.appearance);values.appearance=appearance;
    if(["frame","window"].includes(draft.node.kind))return values;
    return {...values,size:fields.size?Number(fields.size):null,color:fields.color||null,align:fields.align?Number(fields.align):null,bold:fields.bold?fields.bold==="True":null,italic:fields.italic?fields.italic==="True":null,...(!fields.font?{font:null}:font?{font:{assetId:font.id,expectedAssetSha256:font.sha256}}:{})};
  }
  private definition(draft: Draft): StyleDefinition | undefined { return this.host.styles?.()?.definitions.find(d=>d.name===draft.style?.name); }
  private styleValues(draft: Draft): TextProperties["values"] {
    const original=draft.node.textProperties?.values??{};
    if(!draft.style||draft.style.scope==="create"||draft.style.name===draft.node.style?.name)return original;
    return {...Object.fromEntries(Object.entries(original).filter(([key])=>!this.styleOwns(draft,key))),...this.definition(draft)?.values??{}};
  }
  private markEdited(draft:Draft,field:string,changed:boolean):void {
    if(changed)draft.edited.add(field);else draft.edited.delete(field);
  }
  private renderScope(): HTMLElement {
    const group=el("div","screen-style-heading");
    group.append(el("h3","screen-style-title"),el("p","screen-style-name"));
    const modes=el("div","screen-style-modes");
    for(const [scope,label] of [["shared","All elements using this style"],["local","This element only"]] as const) {
      const b=action(label,()=>{const view=this.host.view();if(!view||this.isSaving()||view.busy)return;const draft=this.value(view);if(!draft.style)return;draft.style={...draft.style,scope};this.store(draft,view);});b.dataset.styleScope=scope;modes.append(b);
    }
    const tools=el("div","screen-style-tools");tools.append(action("Change style…",()=>void this.chooseStyle()),action("View uses",()=>{const view=this.host.view();if(view)void this.reviewStyle(this.value(view),false);}));group.append(modes,tools);return group;
  }
  private syncScope(): void {
    const view=this.host.view(),group=this.card?.querySelector<HTMLElement>(".screen-style-heading");if(!view||!group)return;
    const draft=this.value(view),def=this.definition(draft),uses=this.uses(draft),screens=new Set(uses.map(u=>JSON.stringify([u.path,u.screenName]))).size;
    group.dataset.scope=draft.style?.scope??"local";const appearance=group.closest<HTMLElement>(".screen-style-appearance");if(appearance)appearance.dataset.scope=group.dataset.scope;
    group.querySelector(".screen-style-title")!.textContent=draft.style?.scope==="shared" ? `Editing ${uses.length} elements across ${screens} screens` : "Editing this element only";
    group.querySelector(".screen-style-name")!.textContent=def ? `Style · ${this.styleName(def.name)}` : draft.style?.scope==="create"?`New style · ${this.styleName(draft.style.name)}`:view.selected.style?.error ?? this.host.styles?.()?.error ?? "Style · This element has no shared style";
    for(const b of group.querySelectorAll<HTMLButtonElement>("[data-style-scope]")){b.ariaPressed=String(b.dataset.styleScope===(draft.style?.scope??"local"));b.disabled=this.isSaving()||view.busy||!draft.style||draft.style.scope==="create"||!!def?.error;}
    for(const b of group.querySelectorAll<HTMLButtonElement>(".screen-style-tools button"))b.disabled=this.isSaving()||view.busy;
  }
  private async reviewStyle(draft: Draft, apply: boolean): Promise<boolean> {
    if(this.styleDialog || !this.active())return false;
    const def=this.definition(draft);if((!def && draft.style?.scope !== "create") || def?.error || !draft.style){this.fail("source",def?.error??"The style is missing. Your edits are kept.");return false;}
    const current=this.host.view();if(!current||current.document.path!==draft.document.path||current.selected.id!==draft.node.id)return false;
    const selectedUse={path:draft.document.path,screenName:current.screenName,nodeId:draft.node.id!,nodeStart:draft.node.span.start};
    const sharedChange=draft.style.scope==="shared"&&Object.keys(this.sharedValues(draft,this.values(draft,false))).length>0;
    const uses=apply&&!sharedChange ? [selectedUse] : this.uses(draft);
    if(!uses.some(u=>u.path===selectedUse.path&&u.nodeId===selectedUse.nodeId))uses.push(selectedUse);
    const dialog=el("dialog","screen-style-dialog");dialog.ariaLabel=apply ? "Review style changes" : "Style uses";
    dialog.append(el("h2","",dialog.ariaLabel),el("p","",`${uses.length} elements across ${new Set(uses.map(u=>JSON.stringify([u.path,u.screenName]))).size} screens`));
    const list=el("ul","screen-style-uses"),content=el("div","screen-style-content"),preview=el("section","screen-style-preview"),canvas=el("div","screen-style-canvas"),previewHeading=el("h3"),status=el("p");status.role="status";preview.append(previewHeading,canvas,status);content.append(list,preview);
    const grouped=new Map<string,{name:string;path:string;count:number}>();for(const use of uses){const key=JSON.stringify([use.path,use.screenName]),row=grouped.get(key)??{name:use.screenName,path:use.path,count:0};row.count++;grouped.set(key,row);}
    let currentDocument:ScreenDocument|undefined,previewSequence=0;
    const frames=new ScreenCanvasFrames({canvas,status,request:this.host.request,currentRevision:()=>this.active()?currentDocument?.revision:undefined,installed:()=>{},invalidated:()=>{}});
    const show=async(row:{name:string;path:string})=>{
      const sequence=++previewSequence;
      previewHeading.textContent=row.name;currentDocument=undefined;
      frames.invalidate("Loading screen from Source…");canvas.replaceChildren();
      for(const b of list.querySelectorAll<HTMLButtonElement>("button"))b.ariaPressed=String(b.dataset.path===row.path&&b.dataset.screen===row.name);
      try {
        const inspected=await this.host.inspect(row.path);
        if(sequence!==previewSequence||this.styleDialog!==dialog||!this.active())return;
        currentDocument=inspected;
      } catch(error) {
        if(sequence===previewSequence&&this.styleDialog===dialog)status.textContent=`${(error as Error).message} Open Source to review this use.`;
        return;
      }
      const values=apply?this.values(draft,false):{},samples:{nodeStart:number;values:TextEdits}[]=[];
      for(const use of uses.filter(u=>u.path===row.path&&u.screenName===row.name)){
        const selected=use.path===draft.document.path&&use.nodeId===draft.node.id;
        const edits=apply&&selected?this.previewValues(draft):this.sharedValues(draft,values);
        if(Object.keys(edits).length)samples.push({nodeStart:use.nodeStart,values:edits});
      }
      const layout=apply?this.layout.currentDraft(false):undefined;
      frames.render({path:row.path,screenName:row.name,expectedRevision:currentDocument.revision,...this.host.resolution??{width:1280,height:720},buttonState:this.appearanceStates.get(draft.key)==="insensitive_"?"disabled":this.appearanceStates.get(draft.key)?.replace("_","")||"normal",textStyles:samples,...(layout&&row.path===draft.document.path&&row.name===current.screenName?{layouts:[{nodeStart:draft.node.span.start,values:layout.values}]}:{})});
    };
    for(const row of grouped.values()){const li=el("li"),b=action("",()=>show(row));b.dataset.path=row.path;b.dataset.screen=row.name;b.append(el("strong","",row.name),el("span","",`${row.count} ${row.count===1?"element":"elements"}`),el("small","",row.path));li.append(b);list.append(li);}dialog.append(content);
    if(apply){
      const changes=this.values(draft,false),labels:Record<string,string>={text:"Text content",font:"Font",size:"Size",color:"Color",align:"Text alignment",bold:"Bold",italic:"Italic"};
      for(const [key,value] of Object.entries(changes)) {
        if(key==="appearance") {for(const [property,after] of Object.entries(value as NonNullable<TextEdits["appearance"]>))dialog.append(el("p","",`${property.replaceAll("_"," ")}: ${after===null?"Inherited":typeof after==="object"?"color" in after?`${after.color}, ${after.width} px`:this.assets.find(a=>a.id===after.assetId)?.displayName??"Project font":String(after)}`));}
        else {const before=draft.node.textProperties?.values[key]??(key==="text"?draft.node.literal:"Inherited"),after=key==="font"?this.assets.find(a=>fontPath(a)===draft.fields.font)?.displayName??"Inherited":value===null?"Inherited":String(value);dialog.append(el("p","",`${labels[key]??key}: ${String(before)} to ${after}`));}
      }
      dialog.append(el("p","",draft.style.scope==="shared"?"Appearance changes update this style. Text content and Layout remain local.":draft.style.scope==="create"?"Create a style for this element.":"Create an independent copy for this element, including its appearance values."));
    }
    const activeField=this.lastField,control=activeField&&this.fieldControl(activeField) as HTMLInputElement|HTMLTextAreaElement|undefined,selection=control&&"selectionStart" in control?{start:control.selectionStart,end:control.selectionEnd}:undefined;
    const scroll=this.card?.querySelector(".screen-text-body")?.scrollTop??0;
    return new Promise(resolve=>{
      const close=(accepted:boolean)=>{
        previewSequence++;frames.dispose();dialog.close();dialog.remove();if(this.styleDialog===dialog){this.styleDialog=undefined;this.dismissStyle=undefined;}
        this.host.reviewing?.(false);
        if(this.active()){
          this.sync();if(activeField){this.focus(activeField);const field=this.fieldControl(activeField);if(selection&&(field instanceof HTMLTextAreaElement||field instanceof HTMLInputElement&&["text","search","tel","url","password"].includes(field.type)))field.setSelectionRange(selection.start,selection.end);}
          const body=this.card?.querySelector(".screen-text-body");if(body)body.scrollTop=scroll;
        }
        resolve(accepted);
      };
      this.dismissStyle=()=>close(false);
      dialog.oncancel=event=>{event.preventDefault();close(false);};dialog.onkeydown=event=>event.stopPropagation();
      const actions=el("div","screen-style-actions");actions.append(action("Keep editing",()=>close(false)));if(apply)actions.append(action(sharedChange?"Apply to all elements":"Apply to this element",()=>close(true),true));dialog.append(actions);this.styleDialog=dialog;this.host.reviewing?.(true);this.card?.closest(".screens-editor")?.append(dialog);this.sync();dialog.showModal();const row=grouped.values().next().value;if(row)show(row);actions.querySelector("button")?.focus();
    });
  }
  private extraFields(values:TextProperties["values"]):Record<string,string> {
    const fields:Record<string,string>={};for(const prefix of ["","hover_","selected_","insensitive_"]) {
      if(prefix)fields[prefix+"color"]=typeof values[prefix+"color"]==="string"?String(values[prefix+"color"]):"";
      fields[prefix+"background"]=typeof values[prefix+"background"]==="string"?String(values[prefix+"background"]):"";
      const border=values[prefix+"border"] as {color?:string;width?:number}|undefined;fields[prefix+"borderColor"]=border?.color??"";fields[prefix+"borderWidth"]=border?.width===undefined?"":String(border.width);
    }return fields;
  }
  private appearanceProperty(key:string):string {return key.replace(/border(?:Color|Width)$/, "border");}
  private appearanceBlocked(node:ScreenNode,key:string):string|undefined {return node.textProperties?.blocked[this.appearanceProperty(key)];}
  private renderAppearance(host:HTMLElement,view:CompositionView):void {
    for(const key of this.fieldValidators.keys())if(key.startsWith("appearance:"))this.fieldValidators.delete(key);
    host.replaceChildren();const draft=this.value(view),state=this.appearanceStates.get(draft.key)??"",frame=["frame","window"].includes(view.selected.kind);
    if(!frame){const label=el("label","screen-text-field","Appearance state"),stateControl=el("select");stateControl.ariaLabel="Appearance state";stateControl.dataset.appearanceField="state";
      for(const [value,name] of [["","Normal"],["hover_","Hover"],["selected_","Selected"],["insensitive_","Disabled"]]){const option=el("option","",name);option.value=value!;stateControl.append(option);}stateControl.value=state;
      stateControl.onchange=()=>{this.appearanceStates.set(draft.key,stateControl.value);this.host.buttonSample?.(stateControl.value==="insensitive_"?"disabled":stateControl.value.replace("_","")||"normal");this.renderAppearance(host,view);host.querySelector<HTMLElement>("select")?.focus({preventScroll:true});};label.append(stateControl);host.append(label);
    }
    const input=(name:string,key:string)=>{const label=el("label","screen-text-field",name),control=el("input");control.ariaLabel=name;control.dataset.appearanceField=key;const blocked=this.appearanceBlocked(view.selected,key);
      control.readOnly=!!blocked;control.value=blocked?view.selected.textProperties?.expressions?.[this.appearanceProperty(key)]??"Source-only":draft.appearance[key]??"";control.placeholder=blocked?"Source-only":"Inherit";
      control.addEventListener("input",()=>{if(this.isSaving()||view.busy||this.appearanceBlocked(view.selected,key))return;const value=this.value(view);value.appearance={...value.appearance,[key]:control.value};this.markEdited(value,`appearance:${key}`,control.value!==this.extraFields(this.styleValues(value))[key]);this.store(value,view);});label.append(control);host.append(label);
      if(blocked) {
        const help=el("p","",`Source-only. ${blocked}`);help.id=`appearance-source-${view.selected.span.start}-${key}`;
        control.setAttribute("aria-describedby",help.id);label.append(help,action("Edit in Source",this.host.source));
      }
      this.registerField(view,`appearance:${key}`,control,()=>this.appearanceBlocked(view.selected,key)?undefined:this.appearanceError(key,this.value(view).appearance));
      if(key.endsWith("borderColor")||key.endsWith("borderWidth")) {
        const peer=`appearance:${key.replace(/border(Color|Width)$/,key.endsWith("Color")?"borderWidth":"borderColor")}`;
        let composing=false;
        control.addEventListener("compositionstart",()=>{composing=true;});control.addEventListener("compositionend",()=>{composing=false;});
        const validatePeer=()=>{try{this.fieldValidators.get(peer)?.();}catch{/* Display the dependent error beside its field. */}};
        control.addEventListener("blur",()=>{if(!composing)validatePeer();});
        control.addEventListener("input",()=>{if(!composing&&this.fieldErrors.get(draft.key)?.has(peer))validatePeer();});
      }
    };
    if(state)input("State text color",state+"color");
    if(this.definition(draft)?.kind==="text") {
      const local=el("div","screen-text-local-label");local.append(el("strong","","Background and border"),el("span","","This element only"));host.append(local);
    }
    input("Background color",state+"background");input("Border color",state+"borderColor");input("Border width · px",state+"borderWidth");
    if(!frame)host.append(el("p","screen-appearance-limit","State overrides support text color, background and border. Other state properties stay in Source."));
    for(const field of this.fieldErrors.get(draft.key)??[])if(field.startsWith("appearance:")){try{this.fieldValidators.get(field)?.();}catch{/* Restore errors when changing appearance states. */}}
  }
  private styleName(name:string):string {return name.startsWith("ll_copy_")?"Independent style":name.replace(/^ll_/,"").replaceAll("_"," ").replace(/^./,s=>s.toUpperCase());}
  private appearanceFields(values:TextProperties["values"]):Omit<Fields,"text"> {return {font:values.font??"",size:values.size===undefined?"":String(values.size),color:values.color??"",align:values.align===undefined?"":String(values.align),bold:values.bold===undefined?"":values.bold?"True":"False",italic:values.italic===undefined?"":values.italic?"True":"False"};}
  private async chooseStyle(): Promise<void> {
    const view=this.host.view(),catalog=this.host.styles?.();if(!view||!catalog||this.isSaving()||view.busy)return;
    const draft=this.value(view),dialog=el("dialog","screen-style-dialog");dialog.ariaLabel="Choose style";dialog.append(el("h2","","Choose style"));
    const close=()=>{dialog.close();dialog.remove();if(this.styleDialog===dialog){this.styleDialog=undefined;this.dismissStyle=undefined;}this.sync();if(this.lastField)this.focus(this.lastField);};
    const choose=(style:StyleEdit,def?:StyleDefinition)=>{
      draft.style=style;
      if(def) {
        const extra=this.extraFields(def.values);for(const key of Object.keys(extra))if(this.styleOwns(draft,key)&&!draft.edited.has(`appearance:${key}`))draft.appearance[key]=extra[key]!;
        const fields=this.appearanceFields(def.values);
        for(const field of ["font","size","color","align","bold","italic"] as const)if(!draft.edited.has(field)) {
          draft.fields[field]=fields[field];
          if(field==="font"){const font=this.assets.find(a=>fontPath(a)===fields.font);draft.font=font?{assetId:font.id,expectedAssetSha256:font.sha256}:undefined;}
        }
      }
      close();this.store(draft,view);this.host.redraw();if(this.lastField)this.focus(this.lastField);
    };
    for(const def of catalog.definitions.filter(d=>(d.kind===view.selected.kind||d.kind==="text"&&view.selected.kind==="textbutton")&&!d.error)) {
      const b=action(`${this.styleName(def.name)} · ${def.uses.length} elements`,()=>choose({scope:"shared",name:def.name,expectedRevision:catalog.revision},def));b.classList.add("screen-style-option");dialog.append(b);
    }
    if(catalog.error){dialog.append(el("p","",catalog.error),action("Review Source",()=>{close();this.host.source();}));}
    if(!view.selected.style&&!catalog.error){
      const label=el("label","screen-text-field","Style name"),input=el("input");input.ariaLabel="Style name";technicalNameInput(input);label.append(input,el("p","",technicalNameHelp));dialog.append(label);
      const validate=validateField(input,()=>{const name=technicalName(input.value,"Style name");if(catalog.definitions.some(d=>d.name===name))throw Error("That style name already exists.");});
      dialog.append(action("Create style",()=>{try{validate();}catch{input.focus();return;}choose({scope:"create",name:technicalName(input.value,"Style name"),expectedRevision:catalog.revision});}));
    }
    this.dismissStyle=close;dialog.append(action("Keep editing",close));dialog.oncancel=e=>{e.preventDefault();close();};dialog.onkeydown=e=>e.stopPropagation();this.styleDialog=dialog;this.card?.closest(".screens-editor")?.append(dialog);this.sync();dialog.showModal();dialog.querySelector<HTMLElement>("button,input")?.focus();
  }
  private fieldError(field: TextField, value: string): string | undefined {
    if (field === "text" && !value.trim()) return "Enter text before applying. Your edits are kept.";
    if (field === "size" && value.trim() && (!/^\d+$/.test(value.trim()) || +value < 1 || +value > 512)) return "Use a whole size from 1 to 512 px, or clear it for the default. Your edits are kept.";
    if (field === "color" && value.trim() && !hex(value.trim())) return "Use a hex color such as #f1e9d6, or clear it for the default. Your edits are kept.";
  }
  private registerField(view:CompositionView,field:string,control:HTMLInputElement|HTMLTextAreaElement,check:()=>string|undefined):void {
    const key=this.key(view);
    this.fieldValidators.set(field,validateField(control,()=>{
      const message=check(),errors=this.fieldErrors.get(key)??new Set<string>();
      if(message){errors.add(field);this.fieldErrors.set(key,errors);throw Error(message);}
      errors.delete(field);if(!errors.size)this.fieldErrors.delete(key);
    }));
  }
  private appearanceError(key:string,fields:Record<string,string>):string|undefined {
    const value=fields[key]??"";
    if(key.endsWith("borderColor")||key.endsWith("borderWidth")) {
      const prefix=key.replace(/border(Color|Width)$/,"");
      if(!fields[prefix+"borderColor"]&&!fields[prefix+"borderWidth"])return;
      if(key.endsWith("Color")?!hex(value):!/^\d+$/.test(value)||+value<1||+value>32)return "Use a border color and whole width from 1 to 32 px, or clear both. Your edits are kept.";
    } else if(value&&!hex(value))return "Enter a hex color such as #f1e9d6, or clear it for the inherited value. Your edits are kept.";
  }
  private validateDraft(draft:Draft):void {
    const problems=new Map<string,string>();
    for(const field of ["text","size","color"] as const) {
      if(draft.node.textProperties?.blocked[field]||["frame","window"].includes(draft.node.kind))continue;
      const message=this.fieldError(field,draft.fields[field]);if(message)problems.set(field,message);
    }
    for(const key of Object.keys(draft.appearance)){if(this.appearanceBlocked(draft.node,key))continue;const message=this.appearanceError(key,draft.appearance);if(message)problems.set(`appearance:${key}`,message);}
    const errors=this.fieldErrors.get(draft.key)??new Set<string>();
    for(const key of Object.keys(draft.appearance)){const field=`appearance:${key}`;if(problems.has(field))errors.add(field);else errors.delete(field);}
    if(errors.size)this.fieldErrors.set(draft.key,errors);else this.fieldErrors.delete(draft.key);
    for(const validate of this.fieldValidators.values()){try{validate();}catch{/* Report all visible field errors before focusing the first. */}}
    const first=problems.entries().next().value;if(!first)return;
    if(first[0].startsWith("appearance:")) {
      const key=first[0].slice(11),state=["hover_","selected_","insensitive_"].find(prefix=>key.startsWith(prefix))??"";
      this.appearanceStates.set(draft.key,state);
      this.host.buttonSample?.(state==="insensitive_"?"disabled":state.replace("_","")||"normal");
      const host=this.card?.querySelector<HTMLElement>(".screen-appearance-fields"),view=this.host.view();if(host&&view)this.renderAppearance(host,view);
    }
    this.fail(...first);throw Error(first[1]);
  }
  private values(draft: Draft, strict: boolean): TextEdits {
    if(strict)this.validateDraft(draft);
    const values: TextEdits = {}, before = this.fields(draft.node), blocked = draft.node.textProperties?.blocked ?? {};
    if (draft.style?.scope === "shared") Object.assign(before,this.appearanceFields(this.styleValues(draft)));
    const fail = (field: string,text: string) => {if (strict) {this.fail(field,text);throw Error(text);}};
    if (!blocked.text && draft.fields.text !== before.text) {
      const problem = this.fieldError("text",draft.fields.text);if (problem) fail("text",problem);else values.text = draft.fields.text;
    }
    for (const field of ["size","color","align","bold","italic"] as const) {
      if (blocked[field] || draft.fields[field] === before[field]) continue;
      const value = draft.fields[field].trim();
      const problem = (field === "size" || field === "color") && this.fieldError(field,value);if (problem) {fail(field,problem);continue;}
      if (field === "size" || field === "align") values[field] = value ? Number(value) : null;
      else if (field === "color") values.color = value || null;
      else values[field] = value ? value === "True" : null;
    }
    if (!blocked.font && draft.fields.font !== before.font) {
      if (!draft.fields.font) values.font = null;
      else if (draft.font) values.font = draft.font;
      else fail("font","Choose a project font. Your edits are kept.");
    }
    const base=this.extraFields(draft.style?.scope==="shared" ? this.styleValues(draft) : draft.node.textProperties?.values??{}),appearance:NonNullable<TextEdits["appearance"]>={};
    for(const prefix of ["","hover_","selected_","insensitive_"]) {
      for(const suffix of ["color","background"]) {
        const key=prefix+suffix;if(key==="color"||blocked[key]||draft.appearance[key]===base[key])continue;
        const value=draft.appearance[key]??"",problem=this.appearanceError(key,draft.appearance);if(problem){fail(`appearance:${key}`,problem);continue;}appearance[key]=value||null;
      }
      const colorKey=prefix+"borderColor",widthKey=prefix+"borderWidth";
      if(blocked[prefix+"border"]||draft.appearance[colorKey]===base[colorKey]&&draft.appearance[widthKey]===base[widthKey])continue;
      const color=draft.appearance[colorKey]??"",width=draft.appearance[widthKey]??"";
      if(!color&&!width)appearance[prefix+"border"]=null;
      else {
        const colorError=this.appearanceError(colorKey,draft.appearance),widthError=this.appearanceError(widthKey,draft.appearance);
        if(colorError||widthError)fail(`appearance:${colorError?colorKey:widthKey}`,(colorError||widthError)!);
        else appearance[prefix+"border"]={color,width:+width};
      }
    }
    if(Object.keys(appearance).length)values.appearance=appearance;
    return values;
  }
  private fail(field: string,text: string): void {
    const view = this.host.view();if (!view) return;
    const validator = this.fieldValidators.get(field);
    if (validator) {try {validator();} catch { /* Submission focuses the same invalid control. */ }}
    else this.errors.set(this.key(view),{field,text});
    this.host.note(text,true);this.sync();this.focus(field);
  }
  private fieldControl(field:string): HTMLElement|undefined {
    const selector=field.startsWith("appearance:")?`[data-appearance-field="${field.slice(11)}"]`:field.startsWith("layout:")?`[data-layout-field="${field.slice(7)}"]`:`[data-text-field="${field}"]`;
    return this.card?.querySelector<HTMLElement>(selector)??undefined;
  }
  private focus(field:string):void {this.fieldControl(field)?.focus({preventScroll:true});}
  private cancel(): void {
    const view = this.host.view();if (!view || this.isSaving() || view.busy) return;
    const active = (document.activeElement as HTMLElement | null)?.dataset, field = active?.textField ?? (active?.layoutField ? `layout:${active.layoutField}` : undefined);
    this.drafts.delete(this.key(view));this.errors.delete(this.key(view));this.fieldErrors.delete(this.key(view));this.layout.cancelCurrent();this.host.redraw();if (field) this.focus(field);this.host.preview();this.host.note("Text changes cancelled. No source was written.");
  }
  private async apply(): Promise<void> {
    const view = this.host.view();if (!view || this.isSaving() || view.busy) return;
    const draft = this.value(view);let values: TextEdits, layout: ReturnType<ScreenLayoutEditor["currentDraft"]>;
    try {values = this.values(draft,true);layout = this.layout.currentDraft(true);} catch {return;}
    if (!Object.keys(values).length && !layout && (!draft.style || draft.style.scope === "shared" && draft.style.name === view.selected.style?.name)) return;
    if (layout && layout.document.revision !== draft.document.revision) {this.fail("source","Text and layout use different Source revisions. Your edits are kept.");return;}
    const reservation = this.layout.reserveForComposition(draft.document);
    if (!draft.node.textProperties?.blocked.font && draft.fields.font) {
      this.preparing = true;this.sync();
      try {await this.refreshAssets();const font = this.assets.find(a => fontPath(a) === draft.fields.font);if (!font || font.status !== "available") throw Error("The font is missing or unreadable. Choose another project font. Your edits are kept.");await this.media.load(font);} catch (error) {reservation.release();this.fail("font",(error as Error).message);return;}
      finally {this.preparing = false;if (this.active()) this.sync();}
      if (!this.active()) {reservation.release();return;}
    }
    const active = (document.activeElement as HTMLElement | null)?.dataset, field = this.lastField ?? active?.textField ?? (active?.layoutField ? `layout:${active.layoutField}` : "text");
    const style=this.styleAction(draft,values);
    const command: CompositionCommand = {type:"formatText",nodeId:view.selected.id!,values,...(style ? {style} : {}),...(layout ? {layout:layout.values} : {})};
    if (style && !(await this.reviewStyle(draft, true))) {reservation.release();return;}
    const submitted = {draft,command,layout:reservation};this.submitted = submitted;this.sync();
    try {await this.host.commit(command,draft.document);if (this.active()) this.focus(field);}
    catch (error) {if (this.active()) this.fail("source",`${(error as Error).message} Your edits are kept.`);}
    finally {if (this.submitted === submitted) this.submitted = undefined;submitted.layout.release();if (this.active()) this.sync();}
  }
  accept(command: CompositionCommand, base: ScreenDocument, accepted: ScreenDocument): void {
    const submitted = this.submitted;
    if (command.type === "formatText" && submitted?.command === command) {this.drafts.delete(submitted.draft.key);this.errors.delete(submitted.draft.key);this.fieldErrors.delete(submitted.draft.key);submitted.layout.accept(accepted);}
    for (const draft of this.drafts.values()) {
      if (draft.document.path !== base.path || draft.document.revision !== base.revision) continue;
      const after = accepted.screens.flatMap(s => s.nodes).find(n => n.id === draft.node.id);
      if (after && same(this.fields(after),this.fields(draft.node))) {draft.node = after;draft.document = accepted;}
    }
  }
  canvasDraft(): {stale: boolean; samples: {nodeStart: number; values: TextEdits}[]} {
    const view=this.host.view(),samples=new Map<number,TextEdits>();let stale=false;
    if(!view)return {stale:this.hasDraft(),samples:[]};
    for(const draft of this.drafts.values()) {
      const own=draft.screenId===view.screenId,shared=draft.style?.scope==="shared"&&Object.keys(this.sharedValues(draft,this.values(draft,false))).length>0;
      if(!own&&!shared)continue;
      const source=this.host.documents?.().find(d=>d.path===draft.document.path)??(own?view.document:undefined);
      if(!source||source.revision!==draft.document.revision||draft.style&&this.host.styles?.()?.revision!==draft.style.expectedRevision){stale=true;continue;}
      const targets=view.nodes.filter(n=>own&&n.id===draft.node.id||shared&&n.style?.name===draft.style?.name);
      if(own&&!targets.some(n=>n.id===draft.node.id)){stale=true;continue;}
      for(const node of targets){const selected=own&&node.id===draft.node.id,values=selected?this.previewValues(draft):this.sharedValues(draft,this.values(draft,false));
        const existing=samples.get(node.span.start);if(existing&&!same(existing,values))stale=true;else samples.set(node.span.start,values);
      }
    }
    return {stale,samples:[...samples].map(([nodeStart,values])=>({nodeStart,values}))};
  }
  renderRetained(host: HTMLElement, documents: ScreenDocument[]): void {
    for (const draft of this.drafts.values()) {
      if (documents.some(d => d.path === draft.document.path && d.screens.some(s => s.nodes.some(n => n.id === draft.node.id)))) continue;
      const section = el("section","screen-retained-draft");section.append(el("p","","This text is no longer available in Source. Your draft is retained."));
      const value = el("textarea");value.readOnly = true;value.ariaLabel = "Retained text draft";value.value = Object.entries(draft.fields).map(([k,v]) => `${k}: ${v}`).join("\n");
      section.append(value,action("Discard retained text draft",()=>{this.drafts.delete(draft.key);this.errors.delete(draft.key);this.fieldErrors.delete(draft.key);section.remove();this.host.preview();}));host.append(section);
    }
  }
  private closePicker(focus = true): void {
    this.pickerGeneration++;this.importValidators.clear();this.importFieldErrors.clear();this.observer?.disconnect();const dialog = this.dialog;this.dialog = undefined;dialog?.close();dialog?.remove();this.pickerKey = undefined;this.staged = undefined;this.stagedValid = false;this.choosing = false;
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
    const dialog = this.dialog, view = this.host.view();if (!dialog || !view) return;this.importValidators.clear();this.observer?.disconnect();dialog.replaceChildren();this.choosing = false;
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
      void this.media.load(font).then(family => {if (!row.isConnected) return;row.querySelector<HTMLElement>(".screen-font-specimen")!.style.fontFamily = family;row.disabled = false;row.querySelector<HTMLElement>(".screen-font-loading")!.textContent = "";}).catch(error => {if (row.isConnected) row.querySelector<HTMLElement>(".screen-font-loading")!.textContent = (error as Error).message;}).finally(() => {delete row.dataset.loading;});
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
    const view = this.host.view();if (!view || this.key(view) !== this.pickerKey) return;
    const draft = this.value(view);draft.fields = {...draft.fields,font:font ? fontPath(font) : ""};draft.font = font ? {assetId:font.id,expectedAssetSha256:font.sha256} : null;this.markEdited(draft,"font",draft.fields.font!==this.appearanceFields(this.styleValues(draft)).font);this.errors.delete(draft.key);this.store(draft,view);this.closePicker();
  }
  private cancelImport(): void {if (this.importing) return;this.pickerGeneration++;this.staged = undefined;this.stagedValid = false;this.renderPicker();this.dialog?.querySelector<HTMLInputElement>("input")?.focus();}
  private renderImport(): void {
    const dialog = this.dialog;if (!dialog) return;this.importValidators.clear();this.observer?.disconnect();dialog.replaceChildren();this.choosing = true;
    dialog.append(action("Back to project fonts",()=>this.cancelImport()),el("h2","","Import font"),el("p","screen-font-boundary","TTF or OTF · Up to 16 MiB"));
    const browse = action(this.staged ? "Choose file again…" : "Browse files…",()=>void this.chooseFile());browse.disabled = this.importing;dialog.append(browse);
    if (this.staged) dialog.append(el("p","",this.staged.displayName));
    const input = (name: string,value: string,change: (value: string) => void,check: (value: string) => void) => {
      const label = el("label","screen-text-field",name),control = el("input");control.ariaLabel = name;control.value = value;control.disabled = this.importing;control.oninput = () => change(control.value);label.append(control);dialog.append(label);
      const validate = validateField(control,() => {
        if (control.disabled) return;
        try {check(control.value);this.importFieldErrors.delete(name);}
        catch (error) {this.importFieldErrors.add(name);throw error;}
      });
      this.importValidators.set(name,{control,validate});
      if (this.importFieldErrors.has(name) && !control.disabled) {try {validate();} catch { /* Keep staged-name errors when the import form remounts. */ }}
      return control;
    };
    technicalNameInput(input("Ren'Py name",this.importName,value => {this.importName = value;this.updateDestination();},value => {technicalName(value,"Ren'Py name");}));
    input("Display name",this.importDisplay,value => {this.importDisplay = value;},value => {if (!value.trim()) throw Error("Display name is required.");});
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
    let invalid: HTMLInputElement | undefined;
    for (const {control,validate} of this.importValidators.values()) {try {validate();} catch {invalid ??= control;}}
    if (invalid) {invalid.focus();return;}
    const name = technicalName(this.importName,"Ren'Py name");
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
