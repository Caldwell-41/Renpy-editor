// The header's project Undo and Redo: one shell command for every workspace
// (UI.md "Story Undo", ADR 0025). Approved layout: header-undo / icons-v1.
import { icon } from "./icons.ts";

/** The item an entry reveals; core's `HistoryItem`. */
export type HistoryItem =
  | { readonly type: "story"; readonly sceneId: string | null; readonly beatId: string | null }
  | { readonly type: "screen"; readonly path: string; readonly screen: string; readonly nodeId: string | null; readonly parentId: string | null }
  | { readonly type: "source"; readonly path: string }
  | { readonly type: "prompt"; readonly action: string }
  | { readonly type: "reference"; readonly kind: "card" | "lore" | "context"; readonly recordId: string | null }
  | { readonly type: "variable" }
  | { readonly type: "asset" };
export interface HistoryLabel { readonly name: string; readonly item: HistoryItem }
export interface HistoryState { readonly undo: HistoryLabel | null; readonly redo: HistoryLabel | null }
/** One unfinished draft edit's place in core's history; core's `DraftStep` (ADR 0025). */
export interface DraftStep { readonly stepId: string; readonly draft: string }
/** `history.draftStep`: a draft step with its name and the item Undo reveals. */
export interface DraftStepRecord extends DraftStep, HistoryLabel {}
/** `step` is present when Undo or Redo moved over a draft step, which writes nothing. */
export interface HistoryStep { readonly entry: HistoryLabel; readonly step?: DraftStep; readonly history: HistoryState }
export type HistoryDirection = "undo" | "redo";

export const emptyHistory: HistoryState = { undo: null, redo: null };

export const isMacPlatform = (): boolean => /Mac|iPhone|iPad|iPod/.test(window.navigator.platform);
/** Cmd on macOS and Ctrl elsewhere, alone with no Alt. */
export const hasPrimaryModifier = (event: KeyboardEvent): boolean => !event.altKey && (isMacPlatform() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey);
const shortcut = (direction: HistoryDirection): string => direction === "undo" ? isMacPlatform() ? "⌘Z" : "Ctrl+Z" : isMacPlatform() ? "⇧⌘Z" : "Ctrl+Y";

/** Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z, and Ctrl+Y off macOS. */
export function historyShortcut(event: KeyboardEvent): HistoryDirection | undefined {
  if (!hasPrimaryModifier(event)) return undefined;
  const key = event.key.toLowerCase();
  if (key === "z") return event.shiftKey ? "redo" : "undo";
  if (key === "y" && !isMacPlatform() && !event.shiftKey) return "redo";
  return undefined;
}

const textInputs = new Set(["text", "search", "email", "url", "tel", "password", "number"]);
/** A field whose own text Undo Cmd/Ctrl+Z keeps: text inputs, text areas and editors such as Source. */
export function isTextField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement || target.isContentEditable) return true;
  return target instanceof HTMLInputElement && textInputs.has(target.type);
}

/** The header Undo and Redo: icon buttons whose tooltip and name carry the next edit. */
export function historyControls(run: (direction: HistoryDirection) => void): { readonly element: HTMLElement; update(state: HistoryState): void } {
  const element = document.createElement("div"); element.className = "header-history"; element.setAttribute("role", "group"); element.setAttribute("aria-label", "Project history");
  const controls = (["undo", "redo"] as const).map(direction => {
    const wrapper = document.createElement("span"); wrapper.className = "header-history-command";
    const button = document.createElement("button"); button.type = "button"; button.className = "button header-history-button";
    button.dataset.history = direction; button.setAttribute("aria-keyshortcuts", direction === "undo" ? "Meta+Z Control+Z" : "Meta+Shift+Z Control+Y");
    button.append(icon(direction));
    const tip = document.createElement("span"); tip.className = "header-history-tip"; tip.setAttribute("aria-hidden", "true");
    const text = document.createElement("span"); const key = document.createElement("kbd"); key.textContent = shortcut(direction); tip.append(text, key);
    button.addEventListener("click", () => { if (button.getAttribute("aria-disabled") !== "true") run(direction); });
    wrapper.append(button, tip); element.append(wrapper);
    return { direction, button, text };
  });
  const update = (state: HistoryState): void => {
    for (const { direction, button, text } of controls) {
      const entry = state[direction], word = direction === "undo" ? "Undo" : "Redo";
      button.setAttribute("aria-label", entry ? `${word} ${entry.name}` : word);
      button.setAttribute("aria-disabled", String(!entry));
      text.textContent = entry ? `${word} ${entry.name}` : `Nothing to ${direction}`;
    }
  };
  update(emptyHistory);
  return { element, update };
}
