import type { HelpStarter } from "./screen-contracts.ts";
import type { UiImageAsset } from "./screen-images.ts";

export interface PanelCreation { name: string; starter?: HelpStarter }
interface PanelCreationOptions {
  assets: readonly UiImageAsset[];
  initialName?: string;
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
  const name = input("screen-name", options.initialName ?? "help_panel"); name.ariaLabel = "Screen name"; name.maxLength = 64;
  name.autocomplete = "off"; name.spellcheck = false;
  const starters = element("fieldset", "screen-panels-starters"); starters.append(element("legend", "", "Start with"));
  for (const [value, title, copy] of [["help", "Help panel", "Title, explanation, image and Close. Edit them after creation."], ["blank", "Blank", "Start with an empty panel."]]) {
    const choice = input("starter", value!, "radio"); choice.checked = value === "help";
    const label = element("label", "screen-panels-option");
    const description = element("span"); description.append(element("strong", "", title), element("span", "", copy)); label.append(choice, description); starters.append(label);
  }
  const help = element("section", "screen-panels-help"); help.ariaLabel = "Help starter";
  const title = input("starter-title", "Help");
  const explanation = element("textarea"); explanation.name = "starter-explanation"; explanation.value = "Read this guide while the story continues."; explanation.rows = 2;
  const images = options.assets.filter(asset => asset.kind === "uiImage" && asset.status === "available" && /^[a-f0-9]{64}$/.test(asset.sha256));
  const image = element("select"); image.name = "starter-image";
  for (const asset of images) { const option = element("option", "", asset.displayName); option.value = asset.id; image.append(option); }
  const width = input("starter-width", "320", "number"), height = input("starter-height", "180", "number");
  for (const control of [width, height]) { control.min = "1"; control.max = "16384"; control.step = "1"; }
  const sizes = element("div", "screen-panels-size"); sizes.append(field("Width (px)", width), field("Height (px)", height));
  help.append(field("Title", title), field("Explanation", explanation), field("Project image", image), sizes);
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
  const isHelp = () => [...starters.querySelectorAll<HTMLInputElement>("input")].find(control => control.checked)?.value === "help";
  const refresh = () => { help.hidden = !isHelp(); create.disabled = busy || (isHelp() && !images.length); };
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
        for (const control of [width, height]) {
          invalid = control;
          if (!/^[1-9]\d*$/.test(control.value) || Number(control.value) > 16384) throw Error("Enter a whole size from 1 to 16384 pixels.");
        }
        value.starter = { title: title.value, explanation: explanation.value, assetId: asset.id, expectedAssetSha256: asset.sha256, width: Number(width.value), height: Number(height.value) };
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
  return { element: form, focus: () => name.focus(), hasDraft: () => dirty, dispose: () => { disposed = true; } };
}
