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
  control.setAttribute("aria-label",caption);
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
  const starters = element("select"); starters.name = "starter";
  for (const [value, title] of [["help", "Help"], ["blank", "Blank"]]) {
    const choice = element("option", "", title); choice.value = value!; starters.append(choice);
  }
  starters.value = options.initialDraft?.starter ?? "help";
  const kinds = element("select"); kinds.name = "screen-kind";
  for (const [value, title] of [["panel", "Panel"], ["dialog", "Dialog"]]) {
    const choice = element("option", "", title); choice.value = value!; kinds.append(choice);
  }
  kinds.value = options.initialDraft?.kind ?? "panel";
  const kind = (): "panel" | "dialog" => kinds.value === "dialog" ? "dialog" : "panel";
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
  thumbnail.style.aspectRatio = `${defaults.width} / ${defaults.height}`;
  const summary = element("div","screen-panels-preview-content"); summary.append(element("strong","",defaults.title),element("p","",defaults.explanation),thumbnail,element("span","","Close"));
  const previewStatus = element("p","screen-panels-preview-status"); previewStatus.role = "status";
  preview.append(summary); help.append(field("Project image",image),preview,previewStatus);
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
  form.append(field("Start with",starters), field("Screen name", name), field("Screen kind",kinds), purpose, help, error, row);
  const validateName=validateField(name,()=>{
    if (!/^[A-Za-z_][A-Za-z_0-9]{0,63}$/.test(name.value)) throw Error("Use letters, numbers and underscores. Start with a letter or underscore.");
  });
  let disposed = false, busy = false, dirty = false, composing = false;
  let unavailableImage: string | undefined;
  const active = () => !disposed && options.current?.() !== false;
  const media = options.presentImage ? new ScreenImageMedia(active,options.presentImage) : undefined;
  let previewGeneration = 0;
  const refreshPreview = () => {
    const generation = ++previewGeneration, asset = images.find(asset => asset.id === image.value && asset.id !== unavailableImage);
    thumbnail.hidden = true; preview.hidden = !asset || !isHelp(); previewStatus.textContent = "";
    if (!media || !asset || !isHelp()) return;
    void media.load(asset).then(value => {
      if (!active() || generation !== previewGeneration) return;
      media.show(thumbnail,value); thumbnail.hidden = false;
    }).catch(() => { if (active() && generation === previewGeneration) previewStatus.textContent = "Image preview unavailable."; });
  };
  const isHelp = () => starters.value === "help";
  const readDraft = (): PanelCreationDraft => ({name:name.value, kind:kind(), starter:isHelp() ? "help" : "blank", assetId:image.value});
  const refresh = () => {
    const dialog=kind()==="dialog";
    summary.querySelector("p")!.textContent=dialog?"Close Help to continue the story.":defaults.explanation;
    purpose.textContent=dialog?"Dialog · Call waits for Finish interaction. Escape finishes it; outside clicks keep it open.":"Panel · stays open while dialogue continues.";
    help.hidden=!isHelp();
    const eligible=images.some(asset=>asset.id===image.value)&&image.value!==unavailableImage;
    create.disabled=busy||(isHelp()&&!eligible);blocked.hidden=eligible;refreshPreview();
  };
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
        if (!asset || asset.id===unavailableImage) throw Error("Help needs an available project UI image. Your name and starter choice are retained.");
        value.starter = { ...defaults, ...(kind()==="dialog"?{explanation:"Close Help to continue the story."}:{}), assetId: asset.id, expectedAssetSha256: asset.sha256 };
      }
      busy = true;
      const controls = [...form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement>("input,select,textarea,button")].map(control => ({ control, disabled: control.disabled }));
      controls.forEach(({ control }) => { control.disabled = true; });
      try { await options.create(value); }
      finally { busy = false; if (active()) { controls.forEach(({ control, disabled }) => { control.disabled = disabled; }); refresh(); } }
    } catch (failure) {
      if (!active()) return;
      if ((failure as {code?:string})?.code === "UI_IMAGE_MISSING") { unavailableImage = image.value; refresh(); }
      dirty = true; error.textContent = `${failure instanceof Error ? failure.message : "Screen could not be created."} Input retained.`; invalid.focus();
    }
  });
  refresh();
  return { element: form, preview, readDraft, focus: () => name.focus(), hasDraft: () => dirty, dispose: () => { disposed = true; previewGeneration++; media?.dispose(); } };
}
