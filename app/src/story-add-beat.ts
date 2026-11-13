// Add a beat, the compact pick-one dialog (UI.md "Pick-one dialogs";
// `story-combined-editor` / `replace-v2`). Rows are grouped with a search; the details
// pane names the highlighted kind and where it goes: Goes at, In and After, and any
// ending it replaces. Click or Enter adds the highlighted row; Escape or Close cancels.
import type { BeatPayload } from "./scene-ui.ts";
import { beatLabels } from "./story-beat-editors.ts";
import { element, iconButton } from "./story-editor-controls.ts";
import { storyIcon } from "./story-icons.ts";

/** A beat kind Add a beat offers. A condition is a node, not a beat payload. */
export type AddKind = Exclude<BeatPayload["type"], "customCode" | "repeatChoice"> | "condition";
// Each kind's name comes from beatLabels, so Add a beat, the new beat and its title agree.
const kinds: readonly (readonly [AddKind, string, string, string])[] = ([
  ["dialogue", "Write", "A spoken line with a speaker."],
  ["narration", "Write", "Story text with no speaker."],
  ["background", "Stage", "Sets the scene and clears characters."],
  ["showCharacter", "Stage", "Puts a character on the stage."],
  ["hideCharacter", "Stage", "Takes a character off the stage."],
  ["changeAppearance", "Stage", "Changes a shown character's expression."],
  ["placement", "Stage", "Moves a shown character."],
  ["transition", "Stage", "Animates the next visual change."],
  ["playMusic", "Audio", "Starts a music track."],
  ["stopMusic", "Audio", "Stops the current music."],
  ["playSfx", "Audio", "Plays a sound once."],
  ["choice", "Flow", "Options the player picks from."],
  ["condition", "Flow", "Branches on a test, then the story continues."],
  ["call", "Flow", "Visits a scene, then comes back."],
  ["jump", "Flow", "Goes to a scene and does not return."],
  ["return", "Flow", "Returns to the caller, or the main menu."],
  ["setVariable", "State", "Stores a value for later conditions."],
  ["showScreen", "Screens", "Shows a screen while the story continues."],
  ["hideScreen", "Screens", "Hides a screen while the story continues."],
  ["callScreen", "Screens", "Opens a screen and waits for it to close."],
] as const).map(([kind, group, description]) => [kind, kind === "condition" ? "Condition" : beatLabels[kind], group, description] as const);
const aliases: Partial<Record<AddKind, string>> = { condition: "if else branch test", placement: "position move", call: "shared conversation returns", choice: "menu options decision", setVariable: "flag counter value", showScreen: "panel", callScreen: "dialog", playSfx: "sfx" };
export const addKindName = (kind: AddKind): string => kinds.find(item => item[0] === kind)?.[1] ?? kind;

/** Where a kind goes at the dialog's place, as the details pane names it. */
export interface Placement {
  /** "End of option 2 "Leave"", "Before 05 Mara's line", or what it replaces. */
  readonly goesAt: string;
  /** "The last service › Option 2 "Leave"". */
  readonly in: string;
  /** The node before it: "07.2.1 Narration". */
  readonly after?: string;
  /** A note under the place: a replaced ending, or what the beat does to the stage. */
  readonly note?: string;
  /** Why this kind cannot go here. */
  readonly unavailable?: string;
}
export interface AddBeatOptions {
  /** Where the dialog mounts: the Story workspace. */
  readonly host: HTMLElement;
  /** Focus returns here when the dialog closes without adding. */
  readonly opener?: HTMLElement | null;
  readonly screens: boolean;
  readonly where: (kind: AddKind) => Placement;
  readonly choose: (kind: AddKind) => void;
}

/** Opens Add a beat. */
export function openAddBeat(options: AddBeatOptions): void {
  options.host.querySelector(":scope > .story-dialog-backdrop")?.remove();
  const offered = kinds.filter(([, , group]) => group !== "Screens" || options.screens);
  const backdrop = element("div", "story-dialog-backdrop");
  const dialog = element("div", "story-dialog story-add-beat"); dialog.role = "dialog"; dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-label", "Add a beat"); dialog.tabIndex = -1;
  const close = (refocus = true): void => { if (!backdrop.isConnected) return; backdrop.remove(); if (refocus) options.opener?.focus(); };
  const head = element("div", "story-dialog-head"); head.append(element("h2", "", "Add a beat"), iconButton("close", "Close without adding", () => close()));
  const search = element("label", "story-search"); const query = element("input"); query.type = "search"; query.placeholder = "Search beats"; query.setAttribute("aria-label", "Find a beat");
  query.role = "combobox"; query.setAttribute("aria-autocomplete", "list"); query.setAttribute("aria-expanded", "true");
  search.append(storyIcon("search"), query);
  const results = element("div", "story-results"); results.role = "listbox"; results.setAttribute("aria-label", "Beat types"); results.id = `story-add-beat-${crypto.randomUUID()}`; query.setAttribute("aria-controls", results.id);
  const details = element("div", "story-picker-details"); details.setAttribute("aria-live", "polite");
  const body = element("div", "story-picker-body"); body.append(results, details);
  const hint = element("p", "story-hint", "Click or Enter adds · Escape cancels");
  dialog.append(head, search, body, hint); backdrop.append(dialog);
  let items: HTMLButtonElement[] = [], active = 0;
  const add = (button: HTMLButtonElement | undefined): void => {
    if (!button || button.getAttribute("aria-disabled") === "true") return;
    close(false); options.choose(button.dataset.insertKind as AddKind);
  };
  const highlight = (): void => {
    items.forEach((item, index) => { item.setAttribute("aria-selected", String(index === active)); item.dataset.highlighted = String(index === active); });
    const button = items[active]; details.replaceChildren();
    if (!button) { query.removeAttribute("aria-activedescendant"); return; }
    query.setAttribute("aria-activedescendant", button.id); button.scrollIntoView?.({ block: "nearest" });
    const [kind, title, , description] = kinds.find(item => item[0] === button.dataset.insertKind)!, place = options.where(kind);
    const where = element("dl", "story-where");
    const row = (term: string, value: string, accent = false): void => { where.append(element("dt", "", term), element("dd", accent ? "story-where-at" : "", value)); };
    row("Goes at", place.goesAt, true); row("In", place.in); if (place.after) row("After", place.after);
    details.append(element("h3", "", title), element("p", "", description), where);
    if (place.unavailable) details.append(element("p", "story-warn", place.unavailable));
    else if (place.note) details.append(element("p", "story-picker-note", place.note));
  };
  const filter = (): void => {
    results.replaceChildren(); items = []; active = 0;
    const text = query.value.trim().toLowerCase();
    const matches = offered.filter(([kind, title, group]) => `${kind} ${title} ${group} ${aliases[kind] ?? ""}`.toLowerCase().includes(text));
    const rank = (title: string): number => title.toLowerCase() === text ? 0 : title.toLowerCase().startsWith(text) ? 1 : title.toLowerCase().includes(text) ? 2 : 3;
    const groups = text ? [["Results", [...matches].sort((a, b) => rank(a[1]) - rank(b[1]))] as const] : [...new Set(matches.map(item => item[2]))].map(group => [group, matches.filter(item => item[2] === group)] as const);
    for (const [group, entries] of groups) {
      const section = element("section"); section.role = "group"; section.setAttribute("aria-label", group); section.append(element("h4", "", group));
      for (const [kind, title] of entries) {
        const button = element("button", "story-result"); button.type = "button"; button.role = "option"; button.tabIndex = -1; button.id = `${results.id}-${kind}`; button.dataset.insertKind = kind;
        const place = options.where(kind); if (place.unavailable) button.setAttribute("aria-disabled", "true");
        button.append(storyIcon(kind), element("span", "", title));
        button.addEventListener("pointerenter", () => { active = items.indexOf(button); highlight(); });
        button.addEventListener("click", () => { active = items.indexOf(button); add(button); });
        items.push(button); section.append(button);
      }
      results.append(section);
    }
    results.dataset.layout = text ? "list" : "groups";
    if (!items.length) { const empty = element("p", "story-picker-empty", "No beat matches that search."); results.append(empty); }
    highlight();
  };
  query.addEventListener("input", filter);
  query.addEventListener("keydown", event => {
    if (event.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); active = Math.max(0, Math.min(items.length - 1, active + (event.key === "ArrowDown" ? 1 : -1))); highlight(); items[active]?.scrollIntoView?.({ block: "nearest" }); }
    else if (event.key === "Enter") { event.preventDefault(); add(items[active]); }
  });
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); return; }
    // Tab stays in the dialog.
    if (event.key === "Tab") { const stops = [query, ...dialog.querySelectorAll<HTMLElement>(".story-dialog-head button")]; const at = stops.indexOf(document.activeElement as HTMLElement); event.preventDefault(); stops[(at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]!.focus(); }
  });
  backdrop.addEventListener("pointerdown", event => { if (event.target === backdrop) close(); });
  filter(); options.host.append(backdrop); query.focus();
}
