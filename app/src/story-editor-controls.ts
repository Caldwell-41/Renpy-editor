// Shared Story editor controls from Story Combined v1 (`story-revamp` / `combined-v1`;
// UI.md "Media pickers"): switches for short choices, portrait lists for speakers and
// characters, icon lists for audio, and picture rows whose Change opens a picker sheet
// over the editor. Each visible control drives a hidden `<select>` that holds its value.
// The beat draft owner captures and restores that select like any other field (ADR 0025),
// and the visible control redraws from its change event.
import { storyIcon } from "./story-icons.ts";

export interface ChoiceItem {
  readonly value: string;
  readonly label: string;
  readonly detail?: string;
  /** An asset shown as a picture, loaded as a thumbnail. */
  readonly asset?: string;
  readonly icon?: string;
  /** A character's dialogue colour, shown on the portrait ring. */
  readonly ring?: string;
}
/** Loads an asset's thumbnail into an image; a failure replaces it with a message in `host`. */
export type Thumbnail = (assetId: string, image: HTMLImageElement, host: HTMLElement) => void;

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node;
}
export function button(text: string, className = "button secondary", run?: () => void): HTMLButtonElement {
  const node = element("button", className, text); node.type = "button"; if (run) node.addEventListener("click", run); return node;
}
/** A labelled form field: the label text above its control. */
export function labelled(text: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = element("label", "field compact-field"); wrapper.append(element("span", "", text), control); return wrapper;
}
export function friendlyError(error: unknown, fallback: string): string { return error instanceof Error ? error.message : fallback; }
export function iconButton(icon: string, label: string, run: () => void, className = "story-icon-button"): HTMLButtonElement {
  const node = button("", className, run); node.append(storyIcon(icon)); node.setAttribute("aria-label", node.title = label); return node;
}
/** A labelled group: the label above, then its control. */
export function field(label: string, ...children: (Node | string)[]): HTMLElement {
  const node = element("div", "story-field"); node.role = "group"; node.setAttribute("aria-label", label);
  node.append(element("span", "story-field-label", label), ...children); return node;
}
const fire = (control: HTMLElement): void => { control.dispatchEvent(new Event("change", { bubbles: true })); };

/** The hidden select a visible control writes. A value missing from `items` stays selected and reads as unavailable. */
export function backingSelect(label: string, items: readonly ChoiceItem[], selected?: string): HTMLSelectElement {
  const select = element("select", "story-backing"); select.hidden = true; select.tabIndex = -1; select.setAttribute("aria-label", label);
  const missing = selected !== undefined && !items.some(item => item.value === selected);
  if (missing || !items.length) {
    const option = element("option", "", selected ? `Unavailable · ${selected}` : "Select an item"); option.value = selected ?? ""; option.dataset.unavailable = "true"; select.append(option);
  }
  for (const item of items) { const option = element("option", "", item.label); option.value = item.value; select.append(option); }
  if (selected !== undefined) select.value = selected;
  return select;
}
/** Sets a backing select as the author's choice: one change event, as a real select fires. */
export function choose(select: HTMLSelectElement, value: string): void {
  if (select.value === value || select.disabled) return;
  select.value = value; fire(select);
}
export const unavailable = (select: HTMLSelectElement): boolean => !select.value || select.options[select.selectedIndex]?.dataset.unavailable === "true";
/** The visible control a backing select belongs to. */
const visibleOf = (select: HTMLSelectElement): HTMLElement | undefined =>
  select.parentElement?.querySelector<HTMLElement>(":scope > [data-control]") ?? undefined;
/** Marks a choice as needing a change, focuses its visible control and throws. */
export function refuseChoice(select: HTMLSelectElement, message: string): never {
  const control = visibleOf(select), focus = control?.matches("summary, button, [tabindex]") ? control : control?.querySelector<HTMLElement>('[tabindex="0"], summary, button');
  let error = select.parentElement?.querySelector<HTMLElement>(":scope > .field-error");
  control?.setAttribute("aria-invalid", "true");
  if (!error) { error = element("span", "field-error"); error.role = "alert"; select.parentElement?.append(error); }
  error.textContent = message;
  focus?.focus(); throw new Error(message);
}
/** Reads a required choice. An unavailable one is marked and focused, and nothing is read. */
export function requireChoice(select: HTMLSelectElement, message = "Select an available item first."): string {
  if (unavailable(select)) refuseChoice(select, message);
  visibleOf(select)?.removeAttribute("aria-invalid"); select.parentElement?.querySelector(":scope > .field-error")?.remove();
  return select.value;
}
/** Clears a choice's error once the author picks an available value. */
function clearsError(select: HTMLSelectElement): void {
  select.addEventListener("change", () => { if (!unavailable(select)) { visibleOf(select)?.removeAttribute("aria-invalid"); select.parentElement?.querySelector(":scope > .field-error")?.remove(); } });
}
const labelOf = (select: HTMLSelectElement): string => select.options[select.selectedIndex]?.textContent ?? "";

/** Arrow keys move between radios and choose the one they reach, as a native radio group does. */
function radioKeys(buttons: readonly HTMLButtonElement[]): void {
  buttons.forEach((radio, index) => radio.addEventListener("keydown", event => {
    const step = ["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 0;
    if (!step) return;
    event.preventDefault(); const next = buttons[(index + step + buttons.length) % buttons.length]!; next.click(); next.focus();
  }));
}
function syncRadios(select: HTMLSelectElement, buttons: readonly HTMLButtonElement[]): void {
  const sync = (): void => buttons.forEach(radio => { const on = radio.dataset.value === select.value; radio.setAttribute("aria-checked", String(on)); radio.tabIndex = on || (unavailable(select) && radio === buttons[0]) ? 0 : -1; });
  select.addEventListener("change", sync); sync();
}

/** A switch for a short choice, such as Left, Centre and Right. */
export function segmented(select: HTMLSelectElement, items: readonly ChoiceItem[], className = ""): HTMLElement {
  const group = element("div", `story-segmented ${className}`.trim()); group.role = "radiogroup"; group.setAttribute("aria-label", select.getAttribute("aria-label") ?? ""); group.dataset.control = "";
  const buttons = items.map(item => {
    const radio = button(item.label, "story-segment", () => choose(select, item.value)); radio.role = "radio"; radio.dataset.value = item.value;
    if (item.detail) radio.setAttribute("aria-label", radio.title = item.detail);
    return radio;
  });
  radioKeys(buttons); syncRadios(select, buttons); group.append(...buttons); clearsError(select);
  return group;
}
/** A list of named rows with an icon, for music and sound effects. Selecting one never plays it. */
export function listChoice(select: HTMLSelectElement, items: readonly ChoiceItem[], icon: string): HTMLElement {
  const list = element("div", "story-option-list"); list.role = "radiogroup"; list.setAttribute("aria-label", select.getAttribute("aria-label") ?? ""); list.dataset.control = "";
  const buttons = items.map(item => { const radio = button("", "story-option-row", () => choose(select, item.value)); radio.role = "radio"; radio.dataset.value = item.value; radio.setAttribute("aria-label", item.label); radio.append(storyIcon(icon), element("span", "", item.label)); return radio; });
  if (!items.length) list.append(element("p", "story-field-hint", "None available in this project."));
  radioKeys(buttons); syncRadios(select, buttons); list.append(...buttons); clearsError(select);
  return list;
}

/** A character portrait: the thumbnail of an appearance, ringed in the character's colour. */
function avatar(item: ChoiceItem | undefined, thumbnail: Thumbnail, icon = "narration"): HTMLElement {
  const node = element("span", "story-avatar"); node.setAttribute("aria-hidden", "true");
  if (item?.ring) node.style.setProperty("--ring", item.ring);
  if (item?.asset) { const image = element("img"); image.alt = ""; node.append(image); thumbnail(item.asset, image, node); }
  else node.append(storyIcon(item?.icon ?? icon));
  return node;
}
/** A dropdown list with portraits, for speakers and characters. */
export function personList(select: HTMLSelectElement, items: readonly ChoiceItem[], thumbnail: Thumbnail): HTMLElement {
  const menu = element("details", "story-dropdown"); const summary = element("summary", "story-person"); summary.dataset.control = "";
  const list = element("div", "story-dropdown-list"); list.role = "listbox"; list.setAttribute("aria-label", select.getAttribute("aria-label") ?? "");
  const draw = (): void => {
    const current = items.find(item => item.value === select.value);
    summary.replaceChildren(avatar(current, thumbnail), element("span", "story-person-name", current?.label ?? labelOf(select)), element("span", "story-caret", "▾"));
    summary.setAttribute("aria-label", `${select.getAttribute("aria-label")}: ${current?.label ?? labelOf(select)}`);
    for (const option of list.querySelectorAll<HTMLElement>("[role=option]")) option.setAttribute("aria-selected", String(option.dataset.value === select.value));
  };
  for (const item of items) {
    const option = button("", "story-dropdown-option", () => { menu.open = false; choose(select, item.value); summary.focus(); });
    option.role = "option"; option.dataset.value = item.value; option.setAttribute("aria-label", item.label); option.tabIndex = -1;
    option.append(avatar(item, thumbnail), element("span", "story-person-name", item.label)); list.append(option);
  }
  dropdownKeys(menu, summary, list); select.addEventListener("change", draw); draw(); clearsError(select);
  menu.append(summary, list); return menu;
}
/** Up and Down move through a dropdown's options; Escape closes it and returns to its summary. */
export function dropdownKeys(menu: HTMLDetailsElement, summary: HTMLElement, list: HTMLElement): void {
  list.addEventListener("keydown", event => {
    const items = [...list.querySelectorAll<HTMLElement>("[role=option]:not([aria-disabled=true])")], at = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); items[(at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); }
    else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); }
  });
  // An open list scrolls the editor down to show its last rows; it never scrolls sideways.
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;
    const box = menu.closest<HTMLElement>(".story-editor"), over = box ? list.getBoundingClientRect().bottom - box.getBoundingClientRect().bottom : 0;
    if (box && over > 0) box.scrollTop += over + 4;
    (list.querySelector<HTMLElement>('[aria-selected="true"]') ?? list.querySelector<HTMLElement>("[role=option]"))?.focus({ preventScroll: true });
  });
  // Leaving the menu closes it.
  menu.addEventListener("focusout", event => { if (menu.open && !menu.contains(event.relatedTarget as Node | null) && event.relatedTarget) menu.open = false; });
}

export interface SheetOptions {
  readonly kind: "background" | "expression" | "scene";
  readonly title: string;
  readonly search: string;
  readonly items: readonly ChoiceItem[];
  readonly selected: string;
  /** What Escape keeps, named in the close button and the hint. */
  readonly keep: string;
  readonly hint: string;
  readonly thumbnail: Thumbnail;
  readonly choose: (value: string) => void;
  /** Shows a tile's value on the stage while the author points at or focuses it; undefined stops. */
  readonly preview?: (value?: string) => void;
  readonly extra?: readonly HTMLElement[];
}
/**
 * A picker sheet over the editor: search, a grid of picture tiles and arrow keys. Pointing
 * at or focusing a tile previews it; click or Enter chooses it; Escape or Close keeps the
 * current value. Focus returns to `trigger` when the sheet closes. Nothing here is a draft field.
 */
export function openSheet(trigger: HTMLElement, options: SheetOptions): void {
  const host = trigger.closest<HTMLElement>(".story-editor") ?? trigger.parentElement!;
  host.querySelector(":scope > .story-sheet")?.remove();
  const sheet = element("section", "story-sheet"); sheet.role = "dialog"; sheet.setAttribute("aria-label", options.title); sheet.dataset.sheet = options.kind;
  // The sheet covers the editor's visible area, wherever it is scrolled.
  if (host.classList.contains("story-editor")) { sheet.style.top = `${host.scrollTop}px`; sheet.style.height = `${host.clientHeight}px`; host.dataset.sheet = "open"; }
  let previewing: string | undefined;
  const preview = (value?: string): void => { if (previewing !== value) { previewing = value; options.preview?.(value); } };
  const close = (refocus = true): void => { if (!sheet.isConnected) return; preview(undefined); sheet.remove(); delete host.dataset.sheet; if (refocus) trigger.focus(); };
  const head = element("header", "story-sheet-head");
  head.append(element("h3", "", options.title), iconButton("close", `Close and keep ${options.keep}`, () => close()));
  const search = element("input", "story-sheet-search"); search.type = "search"; search.placeholder = options.search; search.setAttribute("aria-label", options.search);
  const grid = element("div", `story-tiles story-tiles-${options.kind}`); grid.role = "listbox"; grid.setAttribute("aria-label", options.title);
  const tiles = options.items.map(item => {
    const tile = button("", "story-tile", () => { close(false); options.choose(item.value); trigger.focus(); });
    tile.role = "option"; tile.dataset.value = item.value; tile.tabIndex = item.value === options.selected ? 0 : -1;
    tile.setAttribute("aria-selected", String(item.value === options.selected)); tile.setAttribute("aria-label", `${item.label}${item.value === options.selected ? ", current" : ""}`);
    const picture = element("span", "story-tile-image"); picture.setAttribute("aria-hidden", "true");
    if (item.asset) { const image = element("img"); image.alt = ""; picture.append(image); options.thumbnail(item.asset, image, picture); } else picture.classList.add("story-tile-blank");
    tile.append(picture, element("span", "story-tile-name", item.label)); if (item.detail) tile.append(element("span", "story-tile-detail", item.detail));
    tile.addEventListener("pointerenter", () => preview(item.value)); tile.addEventListener("focus", () => preview(item.value));
    return tile;
  });
  grid.addEventListener("pointerleave", () => { if (!grid.contains(document.activeElement)) preview(undefined); });
  grid.addEventListener("keydown", event => {
    const shown = tiles.filter(tile => !tile.hidden), at = shown.indexOf(document.activeElement as HTMLButtonElement);
    const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: 2, ArrowUp: -2 } as Record<string, number>)[event.key];
    if (step === undefined || at < 0) return;
    event.preventDefault(); shown[Math.max(0, Math.min(shown.length - 1, at + step))]?.focus();
  });
  const empty = element("p", "story-sheet-empty", "No matches. Clear the search to see everything."); empty.hidden = true;
  search.addEventListener("input", event => {
    event.stopPropagation();
    const query = search.value.trim().toLowerCase();
    for (const tile of tiles) tile.hidden = !!query && !(tile.textContent ?? "").toLowerCase().includes(query);
    empty.hidden = tiles.some(tile => !tile.hidden);
  });
  search.addEventListener("change", event => event.stopPropagation());
  search.addEventListener("keydown", event => { if (event.key === "ArrowDown") { event.preventDefault(); tiles.find(tile => !tile.hidden)?.focus(); } });
  sheet.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); } });
  if (!tiles.length) { empty.textContent = "None available in this project."; empty.hidden = false; }
  grid.append(...tiles); sheet.append(head, search, grid, empty, ...options.extra ?? [], element("p", "story-sheet-hint", options.hint));
  host.append(sheet);
  (tiles.find(tile => tile.getAttribute("aria-selected") === "true") ?? tiles[0] ?? search).focus({ preventScroll: true });
}

export interface PictureOptions {
  readonly kind: "background" | "expression";
  readonly items: readonly ChoiceItem[];
  readonly thumbnail: Thumbnail;
  /** The sheet's title, such as "Choose Mara's expression". */
  readonly title: () => string;
  readonly search: string;
  /** The line under the name, such as "Clears characters from the stage". */
  readonly note: () => string;
  readonly empty: string;
  readonly preview?: (value?: string) => void;
}
/** A picture row: thumbnail, name and Change, which opens the picker sheet. */
export function pictureField(select: HTMLSelectElement, options: PictureOptions): HTMLElement {
  const row = element("div", "story-asset-row"); row.dataset.control = "";
  const picture = element("span", `story-thumb story-thumb-${options.kind}`); picture.setAttribute("aria-hidden", "true");
  const text = element("span", "story-asset-text"); const name = element("strong"), note = element("span");
  text.append(name, note);
  const change = button("Change", "button secondary story-change");
  const draw = (): void => {
    const current = options.items.find(item => item.value === select.value), label = current?.label ?? (unavailable(select) ? labelOf(select) : options.empty);
    name.textContent = label; note.textContent = options.note();
    picture.replaceChildren(); picture.classList.toggle("story-thumb-blank", !current?.asset);
    if (current?.asset) { const image = element("img"); image.alt = ""; picture.append(image); options.thumbnail(current.asset, image, picture); }
    change.setAttribute("aria-label", `Change ${select.getAttribute("aria-label")?.toLowerCase()}: ${label}`);
  };
  change.addEventListener("click", () => openSheet(change, {
    kind: options.kind, title: options.title(), search: options.search, items: options.items, selected: select.value, thumbnail: options.thumbnail,
    keep: options.items.find(item => item.value === select.value)?.label ?? "the current value",
    hint: `Point at a picture to preview it on the stage. Click to use it. Esc keeps ${options.items.find(item => item.value === select.value)?.label ?? "the current value"}.`,
    choose: value => choose(select, value), ...(options.preview ? { preview: options.preview } : {}),
  }));
  // "story-redraw" redraws the row when what it offers changes, such as the character.
  select.addEventListener("change", draw); select.addEventListener("story-redraw", draw); draw(); clearsError(select);
  row.append(picture, text, change); return row;
}

/** Moves focus to an editor's first invalid field, or its first control. */
export function focusFirst(host: HTMLElement): void {
  (host.querySelector<HTMLElement>('[aria-invalid="true"]:not([hidden])') ?? host.querySelector<HTMLElement>('input:not([type=hidden]):not([hidden]), textarea, summary, [role=radio][tabindex="0"], button:not([disabled])'))?.focus();
}
