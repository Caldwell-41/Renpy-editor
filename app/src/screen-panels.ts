import type { HelpStarter } from "./screen-contracts.ts";
import { ScreenImageMedia } from "./screen-image-media.ts";
import type { MediaPresentation } from "./scene-ui.ts";
import type { UiImageAsset } from "./screen-images.ts";

export interface PanelCreation { name: string; starter?: HelpStarter }
interface PanelCreationOptions {
  assets: readonly UiImageAsset[];
  initialName?: string;
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
  const name = input("screen-name", options.initialName ?? "help_panel"); name.setAttribute("aria-label", "Screen name"); name.maxLength = 64;
  name.autocomplete = "off"; name.spellcheck = false;
  const starters = element("fieldset", "screen-panels-starters"); starters.append(element("legend", "", "Start with"));
  for (const [value, title, copy] of [["help", "Help panel", "Title, explanation, image and Close. Edit them after creation."], ["blank", "Blank", "Start with an empty panel."]]) {
    const choice = input("starter", value!, "radio"); choice.checked = value === "help";
    const label = element("label", "screen-panels-option");
    const description = element("span"); description.append(element("strong", "", title), element("span", "", copy)); label.append(choice, description); starters.append(label);
  }
  const help = element("section", "screen-panels-help"); help.ariaLabel = "Help starter";
  const defaults = {title:"Help",explanation:"Read this guide while the story continues.",width:320,height:180};
  const images = options.assets.filter(asset => asset.kind === "uiImage" && asset.status === "available" && /^[a-f0-9]{64}$/.test(asset.sha256)).map(asset => ({ ...asset }));
  const image = element("select"); image.name = "starter-image";
  for (const asset of images) { const option = element("option", "", asset.displayName); option.value = asset.id; image.append(option); }
  const preview = element("section","screen-panels-preview");
  const thumbnail = element("img"); thumbnail.alt = ""; thumbnail.hidden = true;
  const summary = element("div"); summary.append(element("strong","",defaults.title),element("p","",defaults.explanation),element("span","","Close"));
  const previewStatus = element("p","screen-panels-preview-status"); previewStatus.role = "status";
  preview.append(thumbnail,summary); help.append(field("Project image",image),preview,previewStatus);
  if (!images.length) {
    image.disabled = true;
    const blocked = element("p", "screen-panels-blocked", "Add a UI image first. Cancel, import an image in Assets with the UI image role, then return to create Help."); blocked.role = "status"; help.append(blocked);
  }
  const error = element("p", "screen-panels-error"); error.role = "alert"; error.ariaLive = "polite";
  const row = element("div", "screen-create-actions");
  const create = element("button", "button primary", "Create screen"); create.type = "submit"; create.disabled = !images.length;
  const cancel = element("button", "button secondary", "Cancel"); cancel.type = "button";
  row.append(create, cancel);
  form.append(field("Screen name", name), starters, element("p", "screen-panels-purpose", "Panel · stays open while dialogue continues."), help, error, row);
  let disposed = false, busy = false, dirty = false, composing = false;
  const active = () => !disposed && options.current?.() !== false;
  const media = options.presentImage ? new ScreenImageMedia(active,options.presentImage) : undefined;
  let previewGeneration = 0;
  const refreshPreview = () => {
    const generation = ++previewGeneration, asset = images.find(asset => asset.id === image.value);
    thumbnail.hidden = true; previewStatus.textContent = "";
    if (!media || !asset || !isHelp()) return;
    void media.load(asset).then(value => {
      if (!active() || generation !== previewGeneration) return;
      media.show(thumbnail,value); thumbnail.hidden = false;
    }).catch(() => { if (active() && generation === previewGeneration) previewStatus.textContent = "Image preview unavailable."; });
  };
  const isHelp = () => [...starters.querySelectorAll<HTMLInputElement>("input")].find(control => control.checked)?.value === "help";
  const refresh = () => { help.hidden = !isHelp(); create.disabled = busy || (isHelp() && !images.length); refreshPreview(); };
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
      if (!/^[A-Za-z_][A-Za-z_0-9]{0,63}$/.test(name.value)) throw Error("Use letters, numbers and underscores. Start with a letter or underscore.");
      const value: PanelCreation = { name: name.value };
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
  refreshPreview();
  return { element: form, focus: () => name.focus(), hasDraft: () => dirty, dispose: () => { disposed = true; previewGeneration++; media?.dispose(); } };
}
