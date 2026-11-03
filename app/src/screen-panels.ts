import type { CompositionCommand, CompositionView } from "./screen-composition.ts";
import type { ScreenDocument } from "./screen-ui.ts";
import type { OwnedScreen } from "./screen-contracts.ts";
import type { HelpStarter } from "./screen-contracts.ts";
import { ScreenImageMedia } from "./screen-image-media.ts";
import type { MediaPresentation } from "./scene-ui.ts";
import type { UiImageAsset } from "./screen-images.ts";
import { validateField } from "./authoring-input.ts";

export interface PanelCreation { name: string; kind?: "panel" | "dialog"; starter?: HelpStarter }
export interface PanelCreationDraft { name: string; kind: "panel" | "dialog"; starter: "help" | "blank"; assetId: string }
interface PanelCreationOptions {
  assets: readonly UiImageAsset[];
  initialName?: string;
  initialDraft?: PanelCreationDraft;
  openAssets?: (draft: PanelCreationDraft) => void;
  presentImage?: (assetId:string) => Promise<MediaPresentation>;
  create: (value: PanelCreation) => Promise<void>;
  cancel: () => void;
  current?: () => boolean;
}

const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const result = document.createElement(tag); result.className = className; result.textContent = text; return result;
};
function field(caption: string, control: HTMLElement) {
  const label = element("label", "field compact-field");
  label.append(element("span", "", caption), control); return label;
}
function input(name: string, value: string, type = "text") {
  const result = element("input"); result.name = name; result.type = type; result.value = value; return result;
}

/** Fields only. ScreensWorkspace owns the catalog snapshot and the accepted create. */
export function buildPanelCreationForm(options: PanelCreationOptions) {
  const form = element("form", "screen-panels-form"); form.noValidate = true;
  const name = input("screen-name", options.initialDraft?.name ?? options.initialName ?? "help_panel"); name.setAttribute("aria-label", "Screen name"); name.maxLength = 64;
  name.autocomplete = "off"; name.spellcheck = false;
  const starters = element("fieldset", "screen-panels-starters"); starters.append(element("legend", "", "Start with"));
  for (const [value, title, copy] of [["help", "Help", "Title, explanation, image and Close. Edit them after creation."], ["blank", "Blank", "Start with an empty screen."]]) {
    const choice = input("starter", value!, "radio"); choice.checked = value === (options.initialDraft?.starter ?? "help");
    const label = element("label", "screen-panels-option");
    const description = element("span"); description.append(element("strong", "", title), element("span", "", copy)); label.append(choice, description); starters.append(label);
  }
  const kinds = element("fieldset", "screen-panels-starters"); kinds.append(element("legend", "", "Screen kind"));
  for (const [value, title, copy] of [["panel", "Panel", "Story continues while the panel is open."], ["dialog", "Dialog", "Call waits until the dialog finishes."]]) {
    const choice = input("screen-kind", value!, "radio"); choice.checked = value === (options.initialDraft?.kind ?? "panel");
    const label = element("label", "screen-panels-option"); const description = element("span");
    description.append(element("strong", "", title), element("span", "", copy)); label.append(choice, description); kinds.append(label);
  }
  const kind = () => [...kinds.querySelectorAll<HTMLInputElement>("input")].find(choice => choice.checked)!.value as "panel" | "dialog";
  const help = element("section", "screen-panels-help"); help.ariaLabel = "Help starter";
  const defaults = {title:"Help",explanation:"Read this guide while the story continues.",width:320,height:180};
  const images = options.assets.filter(asset => asset.kind === "uiImage" && asset.status === "available" && /^[a-f0-9]{64}$/.test(asset.sha256)).map(asset => ({ ...asset }));
  const image = element("select"); image.name = "starter-image";
  for (const asset of images) { const option = element("option", "", asset.displayName); option.value = asset.id; image.append(option); }
  if (options.initialDraft?.assetId) {
    if (!images.some(asset => asset.id === options.initialDraft!.assetId)) {
      const missing = element("option", "", "Original image unavailable"); missing.value = options.initialDraft.assetId; image.prepend(missing);
    }
    image.value = options.initialDraft.assetId;
  }
  const preview = element("section","screen-panels-preview");
  const thumbnail = element("img"); thumbnail.alt = ""; thumbnail.hidden = true;
  const summary = element("div"); summary.append(element("strong","",defaults.title),element("p","",defaults.explanation),element("span","","Close"));
  const previewStatus = element("p","screen-panels-preview-status"); previewStatus.role = "status";
  preview.append(thumbnail,summary); help.append(field("Project image",image),preview,previewStatus);
  if (!images.length) image.disabled = true;
  const blocked = element("p", "screen-panels-blocked", images.length
    ? "The original UI image is unavailable. Choose an available image explicitly or open Assets. Your selection is retained."
    : "Add a UI image first. Open Assets to import an image in Assets with the UI image role, then return to create Help."); blocked.role = "status"; help.append(blocked);
  const assets = options.openAssets ? element("button", "text-button", "Open Assets") : undefined;
  if(assets){assets.type="button";assets.onclick=()=>{if(active()&&!busy)options.openAssets?.(readDraft());};help.append(assets);}
  const error = element("p", "screen-panels-error"); error.role = "alert"; error.ariaLive = "polite";
  const row = element("div", "screen-create-actions");
  const create = element("button", "button primary", "Create screen"); create.type = "submit"; create.disabled = !images.length;
  const cancel = element("button", "button secondary", "Cancel"); cancel.type = "button";
  row.append(create, cancel);
  const purpose = element("p", "screen-panels-purpose");
  form.append(field("Screen name", name), kinds, starters, purpose, help, error, row);
  const validateName=validateField(name,()=>{
    if (!/^[A-Za-z_][A-Za-z_0-9]{0,63}$/.test(name.value)) throw Error("Use letters, numbers and underscores. Start with a letter or underscore.");
  });
  let disposed = false, busy = false, dirty = false, composing = false;
  const active = () => !disposed && options.current?.() !== false;
  const media = options.presentImage ? new ScreenImageMedia(active,options.presentImage) : undefined;
  let previewGeneration = 0;
  const refreshPreview = () => {
    const generation = ++previewGeneration, asset = images.find(asset => asset.id === image.value);
    thumbnail.hidden = true; preview.hidden = !asset; previewStatus.textContent = "";
    if (!media || !asset || !isHelp()) return;
    void media.load(asset).then(value => {
      if (!active() || generation !== previewGeneration) return;
      media.show(thumbnail,value); thumbnail.hidden = false;
    }).catch(() => { if (active() && generation === previewGeneration) previewStatus.textContent = "Image preview unavailable."; });
  };
  const isHelp = () => [...starters.querySelectorAll<HTMLInputElement>("input")].find(control => control.checked)?.value === "help";
  const readDraft = (): PanelCreationDraft => ({name:name.value, kind:kind(), starter:isHelp() ? "help" : "blank", assetId:image.value});
  const refresh = () => { purpose.textContent = kind() === "dialog" ? "Dialog · Close and Escape finish the interaction. Outside clicks keep it open." : "Panel · stays open while dialogue continues."; help.hidden = !isHelp(); const eligible=images.some(asset=>asset.id===image.value);create.disabled = busy || (isHelp() && !eligible);blocked.hidden=eligible;if(assets)assets.hidden=eligible;refreshPreview(); };
  form.addEventListener("change", () => { dirty = true; refresh(); });
  form.addEventListener("input", () => { dirty = true; });
  form.addEventListener("compositionstart", () => { composing = true; });
  form.addEventListener("compositionend", () => { composing = false; });
  cancel.onclick = () => { if (active() && !busy) options.cancel(); };
  form.addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.isComposing) { event.preventDefault(); event.stopPropagation(); if (active() && !busy) options.cancel(); }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault(); if (!active() || busy || composing) return;
    error.textContent = "";
    let invalid: HTMLElement = name;
    try {
      validateName();
      const value: PanelCreation = { name: name.value, ...(kind() === "dialog" ? {kind:"dialog" as const} : {}) };
      if (isHelp()) {
        invalid = image;
        const asset = images.find(asset => asset.id === image.value);
        if (!asset) throw Error("Help needs an available project UI image. Your name and starter choice are retained.");
        value.starter = { ...defaults, assetId: asset.id, expectedAssetSha256: asset.sha256 };
      }
      busy = true;
      const controls = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input,select,textarea,button")].map(control => ({ control, disabled: control.disabled }));
      controls.forEach(({ control }) => { control.disabled = true; });
      try { await options.create(value); }
      finally { busy = false; if (active()) { controls.forEach(({ control, disabled }) => { control.disabled = disabled; }); refresh(); } }
    } catch (failure) {
      if (!active()) return;
      dirty = true; error.textContent = `${failure instanceof Error ? failure.message : "Screen could not be created."} Input retained.`; invalid.focus();
    }
  });
  refresh();
  return { element: form, readDraft, focus: () => name.focus(), hasDraft: () => dirty, dispose: () => { disposed = true; previewGeneration++; media?.dispose(); } };
}

export type DismissalAction = "finishInteraction" | "hideScreen";
interface DismissalHost {
  view: () => CompositionView | undefined;
  kind: () => OwnedScreen["kind"] | undefined;
  current: () => boolean;
  commit: (command: Extract<CompositionCommand,{type:"dismissal"}>, base: ScreenDocument) => Promise<void>;
  redraw: () => void;
  note: (message:string,error?:boolean) => void;
}
interface DismissalDraft { base: ScreenDocument; action:string }

/** Owns only local action drafts. ScreensWorkspace/core own accepted composition. */
export class ScreenDismissal {
  private drafts=new Map<string,DismissalDraft>();
  private saving=false;
  private disposed=false;
  constructor(private readonly host:DismissalHost) {}
  hasDraft():boolean{return this.drafts.size>0;}
  isSaving():boolean{return this.saving;}
  dispose():void{this.disposed=true;this.drafts.clear();}
  render(card:HTMLElement):boolean {
    const view=this.host.view(),kind=this.host.kind();
    if(!view || view.selected.kind!=="textbutton" || !view.selected.id || (kind!=="panel"&&kind!=="dialog"))return false;
    const node=view.selected as typeof view.selected & {dismissal?:"none"|DismissalAction|null};
    const section=element("section","screen-dismissal");
    if(node.dismissal==null){section.append(element("p","","Action is source-only. Use Source to edit it."));card.append(section);return true;}
    const key=JSON.stringify([view.screenId,node.id]),initial=node.dismissal;
    const select=element("select");select.ariaLabel="Button action";
    if(initial==="none"){const none=element("option","","No action");none.value="none";select.append(none);}
    const action=kind==="dialog"?"finishInteraction":"hideScreen";
    const choice=element("option","",action==="finishInteraction"?"Finish interaction":"Hide this panel");choice.value=action;select.append(choice);
    select.value=this.drafts.get(key)?.action??initial;
    const purpose=element("p","",kind==="dialog"?"Finish returns to the Beat after Call screen. Story Return remains a separate operation.":"Hide dismisses this panel while Story continues.");
    const row=element("div","screen-dismissal-actions");
    const apply=element("button","button primary","Apply"),cancel=element("button","button secondary","Cancel");apply.type=cancel.type="button";
    const active=()=>!this.disposed&&this.host.current();
    const refresh=()=>{apply.disabled=view.busy||this.saving||select.value===initial||select.value!==action;cancel.disabled=this.saving||!this.drafts.has(key);select.disabled=view.busy||this.saving;};
    select.onchange=()=>{if(select.value===initial)this.drafts.delete(key);else this.drafts.set(key,{base:this.drafts.get(key)?.base??view.document,action:select.value});refresh();};
    const discard=()=>{if(active()&&!this.saving){this.drafts.delete(key);this.host.redraw();}};
    cancel.onclick=discard;
    section.addEventListener("keydown",event=>{if(event.key==="Escape"&&!event.isComposing){event.preventDefault();event.stopPropagation();discard();}});
    apply.onclick=async()=>{
      const draft=this.drafts.get(key);if(!draft||!active()||this.saving)return;
      if(draft.action!==action){this.host.note("This action does not fit the selected screen. Input retained.",true);return;}
      this.saving=true;refresh();
      try{await this.host.commit({type:"dismissal",nodeId:node.id!,action},draft.base);if(active())this.drafts.delete(key);}
      catch(error){if(active())this.host.note(`${error instanceof Error?error.message:"Action could not be applied."} Input retained.`,true);}
      finally{this.saving=false;if(active()){this.host.redraw();if(section.isConnected)refresh();}}
    };
    refresh();row.append(apply,cancel);section.append(field("Button action",select),purpose,row);card.append(section);return true;
  }
}
