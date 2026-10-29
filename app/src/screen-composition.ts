import { icon } from "./icons.ts";
import { validateField } from "./authoring-input.ts";
import type { LayoutEdits } from "./screen-layout.ts";
import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";

export interface CompositionView {
  document: ScreenDocument; screenId: string; screenName: string; nodes: ScreenNode[];
  selected: ScreenNode; step: string; busy: boolean;
}
interface ImageSelection { assetId: string; expectedAssetSha256: string; replacementSha256?: string; width: number; height: number; layout?: LayoutEdits }
export type CompositionCommand =
  | ({ type: "addImage"; parentId: string } & ImageSelection)
  | ({ type: "image"; nodeId: string; parentId?: string } & ImageSelection)
  | { type: "add"; parentId: string; kind: string; text: string }
  | { type: "text"; nodeId: string; text: string }
  | { type: "reorder"; nodeId: string; targetId: string; after: boolean }
  | { type: "remove"; nodeId: string };
interface Host {
  view: () => CompositionView | undefined;
  select: (id: string, design?: boolean) => void;
  commit: (command: CompositionCommand, base: ScreenDocument) => Promise<void>;
  source: (node: ScreenNode) => void;
  note: (message: string, error?: boolean) => void;
  preview: () => void;
  newScreen: () => void;
  undo: () => void;
  geometry: (host: HTMLElement) => void;
  hover: (id?: string) => void;
  image?: (card: HTMLElement, view: CompositionView) => boolean;
  beginImage?: (parentId: string, document: ScreenDocument) => void;
  otherDraft?: () => boolean;
}
interface Addition { parentId: string; kind: string; text: string; document: ScreenDocument }
interface TextDraft { screenId: string; nodeId: string; value: string; document: ScreenDocument }
const names: Record<string, string> = { screen: "Screen root", fixed: "Free layout group", frame: "Frame", window: "Window", vbox: "Vertical group", hbox: "Horizontal group", grid: "Grid", viewport: "Viewport", text: "Text", textbutton: "Text button", custom: "Source-only element", image: "Image" };
const help: Record<string, string> = {
  screen: "The screen contains every element. Its order cannot change.",
  fixed: "Places children freely. Later siblings appear in front.",
  frame: "Adds a background around one child. Add a layout group inside it to hold several elements.",
  vbox: "Places children from top to bottom in source order.",
  hbox: "Places children from left to right in source order.",
  grid: "Fills rows from left to right in source order. New grids allow empty cells and refuse additions beyond capacity.",
  window: "Contains one child. Use a layout group inside it for several elements.",
  viewport: "Clips one child at the initial top-left. Width and height set the visible opening. Scrolling controls remain in Source.",
  text: "Shows literal text. Edit the text under Design.",
  textbutton: "Shows a button label. Editing its label keeps existing actions in Source.",
  custom: "This region stays in Source. Visual structural edits cannot move or remove it.",
};
const containers = new Set(["screen", "fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"]);
let confirmationSequence = 0;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
};
const action = (label: string, callback: () => void, primary = false) => {
  const b = el("button", `button${primary ? " primary" : " secondary"}`, label); b.type = "button"; b.onclick = callback; return b;
};
export const screenNodeKey = (node: ScreenNode) => node.id ?? `source-at-${node.span.start}`;

function elementIcon(kind: string) {
  const result = icon(kind === "text" ? "source" : "panel");
  const paths: Record<string, string> = {
    fixed: "M3 3h18v18H3zM7 7h4v4H7zM13 13h4v4h-4z", frame: "M3 4h18v16H3zM6 7h12v10H6z",
    vbox: "M5 3h14v4H5zM5 10h14v4H5zM5 17h14v4H5z", text: "M4 5h16M12 5v14M8 19h8M4 5v3M20 5v3",
    textbutton: "M3 6h18v12H3zM7 12h10",
  };
  if (paths[kind]) result.querySelector("path")!.setAttribute("d", paths[kind]!);
  return result;
}

/** Owns composition drafts and controls. The workspace completes accepted edits before rendering. */
export class ScreenComposer {
  private card?: HTMLElement;
  private addition?: Addition;
  private readonly texts = new Map<string, TextDraft>();
  private saving = false;
  private error = "";
  private textValidation?: () => void;
  private dragging?: { id: string; document: ScreenDocument };
  private readonly dialog = el("dialog", "screen-removal-dialog");
  private readonly notice = el("div", "screen-removal-notice");
  private panel?: HTMLElement;
  private removal?: { node: ScreenNode; document: ScreenDocument; invoker: HTMLElement | null; cardScroll: number; panelScroll: number };
  constructor(private readonly host: Host) {}
  hasDraft(): boolean { return !!this.addition || this.texts.size > 0; }
  hasAddition(): boolean { return !!this.addition; }
  hasTextDrafts(): boolean { return this.texts.size > 0; }
  canvasDraft(): { stale: boolean; texts: { nodeStart: number; value: string }[]; addition?: { parentStart: number; kind: string; text: string }; additionStart?: number } {
    const view = this.host.view(); if (!view) return { stale: false, texts: [] };
    const texts: { nodeStart: number; value: string }[] = []; let stale = false;
    for (const draft of this.texts.values()) {
      if (draft.screenId !== view.screenId) continue;
      const node = view.nodes.find(n => n.id === draft.nodeId);
      if (!node || draft.document.revision !== view.document.revision) stale = true;
      else texts.push({ nodeStart: node.span.start, value: draft.value });
    }
    const parent = this.addition && view.nodes.find(n => n.id === this.addition!.parentId);
    if (this.addition && (!parent || this.addition.document.revision !== view.document.revision)) stale = true;
    return { stale, texts, ...(parent && this.addition ? { addition: { parentStart: parent.span.start, kind: this.addition.kind, text: this.addition.text }, additionStart: Math.max(...view.nodes.map(n => n.span.end)) + 1 } : {}) };
  }
  dispose(): void { this.dialog.remove(); this.notice.remove(); this.card = undefined; }
  attach(panel: HTMLElement): void {
    this.panel = panel;
    this.dialog.oncancel = event => { event.preventDefault(); this.cancelRemoval(); };
    this.dialog.onkeydown = event => {
      if (event.key !== "Tab") return;
      const buttons = [...this.dialog.querySelectorAll("button")].filter(b => !b.disabled), first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus({ preventScroll: true }); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus({ preventScroll: true }); }
    };
    this.notice.role = "status"; this.notice.hidden = true; panel.append(this.dialog, this.notice);
  }
  hasRemoval(): boolean { return !!this.removal; }
  clearNotice(): void { this.notice.hidden = true; }
  focusSelection(): void { this.focusRow(); }
  accept(command: CompositionCommand, base: ScreenDocument, accepted: ScreenDocument): void {
    const view = this.host.view(); if (!view) return;
    if (command.type === "add") this.addition = undefined;
    if (command.type === "text") {
      const key = `${view.screenId}:${command.nodeId}`, draft = this.texts.get(key);
      for (const other of this.texts.values()) {
        if (other === draft || other.screenId !== view.screenId || other.document.revision !== base.revision) continue;
        const before = other.document.screens.find(s => s.name === view.screenName)?.nodes.find(n => n.id === other.nodeId);
        const after = accepted.screens.find(s => s.name === view.screenName)?.nodes.find(n => n.id === other.nodeId);
        if (before && after && before.kind === after.kind && before.literal === after.literal) other.document = accepted;
      }
      this.texts.delete(key);
    }
    if (command.type === "remove") this.closeRemoval();
    this.saving = false; this.error = "";
  }
  showRemovalNotice(node: ScreenNode): void {
    this.notice.replaceChildren(el("span", "", `Removed ${node.literal ?? names[node.kind] ?? node.kind}.`), action("Undo removal", this.host.undo), action("Dismiss", () => { this.clearNotice(); this.focusRow(); }));
    this.notice.hidden = false;
  }
  focusEditor(command: CompositionCommand): void {
    if (command.type === "text") this.card?.querySelector("textarea")?.focus({ preventScroll: true });
    else this.focusRow();
  }
  selectionLabel(node: ScreenNode): string { const view = this.host.view(); return view ? this.name(view, node) : node.literal ?? names[node.kind] ?? node.kind; }
  canKeepTree(): boolean { return !this.addition && !!this.card?.querySelector(".screen-tree"); }
  private parent(view: CompositionView, node: ScreenNode) { return view.nodes.find(n => n.span.start === node.parentStart); }
  private depth(view: CompositionView, node: ScreenNode): number { const p = this.parent(view, node); return p ? 1 + this.depth(view, p) : 0; }
  private name(view: CompositionView, node: ScreenNode): string {
    if (node.kind === "screen") return view.screenName;
    if (node.literal) return node.literal;
    const peers = view.nodes.filter(n => n.parentStart === node.parentStart && n.kind === node.kind);
    return `${names[node.kind] ?? node.kind}${peers.length > 1 ? ` ${peers.indexOf(node) + 1}` : ""}`;
  }
  private path(view: CompositionView, node: ScreenNode): string { const p = this.parent(view, node); return p ? `${this.path(view, p)} / ${this.name(view, node)}` : view.screenName; }
  private textKey(view: CompositionView) { return `${view.screenId}:${screenNodeKey(view.selected)}`; }
  private renderRetainedDrafts(card: HTMLElement, view?: CompositionView): boolean {
    let rendered = false;
    const recovery = (value: string, discard: () => void) => {
      const section = el("section", "screen-retained-draft");
      section.append(el("p", "", "The element is no longer available in Source. Your unfinished text is retained here."));
      const input = el("textarea"); input.ariaLabel = "Retained text draft"; input.readOnly = true; input.value = value;
      section.append(input, action("Discard retained draft", () => { discard(); section.remove(); this.render(); this.host.preview(); })); card.append(section); rendered = true;
    };
    for (const [key, draft] of this.texts) {
      if (view && (draft.screenId !== view.screenId || view.nodes.some(node => node.id === draft.nodeId))) continue;
      recovery(draft.value, () => { this.texts.delete(key); });
    }
    if (this.addition && (!view || !view.nodes.some(node => node.id === this.addition!.parentId))) {
      recovery(this.addition.text, () => { this.addition = undefined; });
    }
    return rendered;
  }
  private focusRow(): void {
    const view = this.host.view();
    if (view) [...this.card?.querySelectorAll<HTMLButtonElement>("button[data-node-id]") ?? []].find(row => row.dataset.nodeId === screenNodeKey(view.selected))?.focus({ preventScroll: true });
  }
  private children(view: CompositionView, node: ScreenNode) { return view.nodes.filter(n => n.parentStart === node.span.start); }
  private movable(view: CompositionView, node: ScreenNode) {
    return node.parentStart !== null && view.nodes.filter(n => n.span.start >= node.span.start && n.span.start < node.span.end).every(n => !!n.id && n.kind !== "custom" && !n.protected.length);
  }
  private moveRefusal(view: CompositionView, node: ScreenNode, target: ScreenNode): string {
    if (node.parentStart === null || node.parentStart !== target.parentStart) return "Move within the same parent. Order and selection are unchanged.";
    const start = Math.min(node.span.start, target.span.start), end = Math.max(node.span.end, target.span.end);
    const siblings = view.nodes.filter(n => n.parentStart === node.parentStart && n.span.start >= start && n.span.start < end);
    const parent = this.parent(view, node)!;
    return siblings.some(n => !this.movable(view, n)) || parent.protected.some(p => p.start < end && p.end > start)
      ? "This move crosses protected source-only content. Order and selection are unchanged." : "";
  }
  private showError(text: string): void {
    this.error = text; this.host.note(text, true);
    const feedback = this.card?.querySelector<HTMLElement>(".screen-composition-feedback");
    if (feedback) { feedback.textContent = text; feedback.hidden = false; }
  }
  refreshSelection(): void {
    const view = this.host.view(); if (!view || !this.card) return;
    this.card.querySelectorAll<HTMLElement>("[data-node-id]").forEach(row => {
      row.ariaSelected = String(row.dataset.nodeId === screenNodeKey(view.selected)); row.tabIndex = row.ariaSelected === "true" ? 0 : -1;
    });
    this.card.querySelector(".screen-composition-details")?.remove();
    const details = el("section", "screen-composition-details"); details.ariaLabel = "Selected element";
    details.append(el("strong", "", `${names[view.selected.kind] ?? view.selected.kind} · Nesting level ${this.depth(view, view.selected)}`));
    const actions = el("div", "screen-edit-actions");
    if (["text", "textbutton"].includes(view.selected.kind) && view.selected.id) actions.append(action(this.texts.has(this.textKey(view)) ? "Resume edit" : "Edit text", () => this.host.select(screenNodeKey(view.selected), true), true));
    else if (view.selected.kind === "image" && view.selected.id) actions.append(action("Edit image", () => this.host.select(screenNodeKey(view.selected), true), true));
    else if (containers.has(view.selected.kind) && view.selected.id) actions.append(action("Add inside", () => this.beginAddition(), true));
    else actions.append(action("View in Source", () => this.host.source(view.selected)));
    const parent = this.parent(view, view.selected);
    if (parent && view.selected.kind !== "custom") {
      const siblings = this.children(view, parent), index = siblings.indexOf(view.selected);
      for (const [offset, label] of [[-1, parent.kind === "vbox" ? "Move up" : "Move earlier"], [1, parent.kind === "vbox" ? "Move down" : "Move later"]] as const) {
        const target = siblings[index + offset], move = action(label, () => { if (target) void this.reorder(view.selected, target, offset > 0); });
        move.disabled = !target || this.saving; move.title = target ? this.moveRefusal(view, view.selected, target) || label : "Already at the end of this group";
        actions.append(move);
      }
    }
    const info = el("details"); info.append(el("summary", "", "Type and order help"), el("p", "", help[view.selected.kind] ?? help.custom));
    details.append(actions, info); this.card.querySelector(".screen-tree")?.after(details);
    if (this.movable(view, view.selected)) details.insertBefore(action("Remove element", () => this.requestRemoval()), info);
    else details.insertBefore(el("p", "screen-removal-limit", view.selected.parentStart === null ? "The screen root cannot be removed here." : "This element contains source-only content. View Source to inspect its protection."), info);
  }
  render(card = this.card): boolean {
    const view = this.host.view(); if (!card) return false;
    this.textValidation = undefined;
    if (!view) {
      if (!this.hasDraft()) return false;
      this.card = card; card.replaceChildren(); card.classList.add("screen-composer");
      return this.renderRetainedDrafts(card);
    }
    this.card = card; const scroll = card.scrollTop;
    card.replaceChildren(); card.classList.add("screen-composer"); card.ariaLabel = "Element editor";
    if (view.step === "design" && this.host.image?.(card, view)) return true;
    if (view.step === "choose") {
      const heading = el("header", "screen-composition-heading"); heading.append(el("h2", "", this.addition ? "Add an element" : "Elements"));
      if (!this.addition) heading.append(action("Add element", () => this.beginAddition(), true));
      card.append(heading);
      if (this.addition) this.renderAddition(view, card);
      else {
        const pending = el("div", "screen-pending-texts");
        for (const draft of this.texts.values()) {
          if (draft.screenId !== view.screenId) continue;
          const node = view.nodes.find(n => n.id === draft.nodeId);
          if (node) pending.append(action(`Resume edit · ${this.name(view, node)}`, () => this.host.select(draft.nodeId, true)));
        }
        card.append(pending);
        this.renderRetainedDrafts(card, view);
        const tree = el("div", "screen-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
        for (const node of view.nodes) {
          const id = screenNodeKey(node), row = action("", () => this.host.select(id));
          row.role = "treeitem"; row.dataset.nodeId = id; row.ariaLabel = `${names[node.kind] ?? node.kind}${node.literal ? ` · ${node.literal}` : ""}`;
          row.append(elementIcon(node.kind), el("span", "screen-row-label", this.name(view, node)));
          if (!node.id || node.kind === "custom") row.append(el("span", "screen-row-note", "Source only"));
          if (this.texts.has(`${view.screenId}:${screenNodeKey(node)}`)) row.append(el("span", "screen-row-note", "Draft"));
          row.ariaLevel = String(this.depth(view, node) + 1); row.style.paddingLeft = `${6 + this.depth(view, node) * 12}px`;
          row.title = `${help[node.kind] ?? help.custom} Nesting level ${this.depth(view, node)}.`;
          row.ondblclick = () => this.host.select(id, true);
          row.onmouseenter = () => this.host.hover(id); row.onmouseleave = () => this.host.hover();
          row.disabled = this.saving || view.busy;
          row.onkeydown = event => {
            if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); if (!event.repeat) { this.host.select(id); this.requestRemoval(); } return; }
            if (event.key === "Enter") { event.preventDefault(); this.host.select(id, true); }
            if (["ArrowUp", "ArrowDown"].includes(event.key)) {
              event.preventDefault(); const index = view.nodes.indexOf(node);
              if (event.altKey) {
                const siblings = view.nodes.filter(n => n.parentStart === node.parentStart), target = siblings[siblings.indexOf(node) + (event.key === "ArrowDown" ? 1 : -1)];
                if (target) void this.reorder(node, target, event.key === "ArrowDown");
              } else { this.host.select(screenNodeKey(view.nodes[Math.max(0, Math.min(view.nodes.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]!)); this.focusRow(); }
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault(); const target = event.key === "ArrowLeft" ? this.parent(view, node) : this.children(view, node)[0];
              if (target) { this.host.select(screenNodeKey(target)); this.focusRow(); }
            }
          };
          row.draggable = this.movable(view, node) && !this.saving;
          row.ondragstart = event => {
            if (this.hasDraft() || this.host.otherDraft?.() || this.saving || view.busy) { event.preventDefault(); this.showError("Apply or cancel unfinished changes before reordering. Input retained."); return; }
            this.dragging = { id, document: view.document }; this.host.select(id);
            event.dataTransfer?.setData("text/plain", id); if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
          };
          const clearDrop = () => tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(item => delete item.dataset.drop);
          row.ondragover = event => {
            const from = view.nodes.find(n => screenNodeKey(n) === this.dragging?.id); if (!from) return;
            event.preventDefault(); clearDrop();
            const refusal = this.moveRefusal(view, from, node), after = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
            row.dataset.drop = refusal ? "blocked" : after ? "after" : "before";
            if (event.dataTransfer) event.dataTransfer.dropEffect = refusal ? "none" : "move";
          };
          row.ondragleave = clearDrop;
          row.ondragend = () => { this.dragging = undefined; clearDrop(); };
          row.ondrop = event => {
            event.preventDefault(); const drag = this.dragging; this.dragging = undefined; clearDrop();
            const from = view.nodes.find(n => screenNodeKey(n) === drag?.id);
            if (from && drag) void this.reorder(from, node, event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2, drag.document);
          };
          tree.append(row);
        }
        card.append(tree); this.refreshSelection();
        card.append(el("p", "screen-composition-help", "Arrows select · Enter edits · Alt + ↑ / ↓ reorders · Delete reviews removal"), action("New blank screen", this.host.newScreen));
      }
    } else if (view.step === "design" && ["text", "textbutton"].includes(view.selected.kind) && view.selected.id) {
      this.renderText(view, card);
      this.host.geometry(card);
    } else if (view.step === "design" && view.selected.numericLayout) {
      this.host.geometry(card);
      const tools = el("div", "screen-edit-actions screen-container-actions");
      tools.append(action("View in Source", () => this.host.source(view.selected)));
      if (containers.has(view.selected.kind) && view.selected.id) tools.append(action("Add inside this group", () => this.beginAddition()));
      tools.append(action("Back to elements", () => { this.host.select(screenNodeKey(view.selected), false); this.focusRow(); }));
      card.append(tools);
    } else {
      card.append(el("h2", "", view.step === "connect" ? "Connect" : names[view.selected.kind] ?? view.selected.kind),
        el("p", "", view.step === "connect" ? "Button actions and Story connections remain in Source. Canvas controls never run game actions." : help[view.selected.kind] ?? help.custom),
        action("View in Source", () => this.host.source(view.selected)));
      if (view.step === "design") {
        if (containers.has(view.selected.kind) && view.selected.id) card.append(action("Add inside this group", () => this.beginAddition(), true));
        this.host.geometry(card);
        card.append(action("Back to elements", () => { this.host.select(screenNodeKey(view.selected), false); this.focusRow(); }));
      }
    }
    if (view.step !== "choose") this.renderRetainedDrafts(card, view);
    const feedback = el("p", "screen-composition-feedback", this.error); feedback.hidden = !this.error; feedback.role = "alert"; card.append(feedback);
    card.scrollTop = scroll; return true;
  }
  renderOrder(host: HTMLElement): void {
    const view = this.host.view(); if (!view) return;
    const parent = this.parent(view, view.selected);
    const controls = el("div", "screen-image-order");
    if (parent) {
      const siblings = this.children(view, parent), index = siblings.indexOf(view.selected);
      for (const [offset, label] of [[-1, "Move earlier"], [1, "Move later"]] as const) {
        const target = siblings[index + offset];
        const move = action(label, () => { if (target) void this.reorder(view.selected, target, offset > 0); });
        move.disabled = !target || view.busy; controls.append(move);
      }
    }
    controls.append(action("Remove image…", () => this.requestRemoval())); host.append(controls);
  }
  beginAddition(): void {
    const view = this.host.view(); if (!view || this.saving || view.busy) return;
    if (this.texts.size || this.host.otherDraft?.()) { this.host.note("Apply or cancel unfinished text edits first. Input retained.", true); return; }
    const target = containers.has(view.selected.kind) ? view.selected : this.parent(view, view.selected);
    if (!target?.id) { this.host.note("Choose an owned container. Input retained.", true); return; }
    this.addition = { parentId: target.id, kind: "text", text: "", document: view.document }; this.error = "";
    if (view.step !== "choose") this.host.select(screenNodeKey(view.selected), false);
    this.render(); this.card?.querySelector<HTMLElement>("textarea")?.focus(); this.host.preview();
  }
  private renderAddition(view: CompositionView, card: HTMLElement): void {
    const draft = this.addition!;
    const form = el("section", "screen-addition"); form.ariaLabel = "Add element";
    const palette = el("div", "screen-element-palette"); palette.ariaLabel = "Element types";
    for (const kind of ["text", "textbutton", "image", "fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"]) {
      const choice = action(names[kind]!, () => { if (kind === "image" && this.host.beginImage) { this.addition = undefined; this.host.beginImage(draft.parentId, draft.document); return; } draft.kind = kind; this.error = ""; this.render(); this.card?.querySelector<HTMLElement>(`[data-kind="${kind}"]`)?.focus({ preventScroll: true }); this.host.preview(); });
      choice.dataset.kind = kind;
      choice.prepend(elementIcon(kind)); choice.ariaPressed = String(draft.kind === kind); choice.disabled = this.saving; palette.append(choice);
    }
    const parent = el("select"); parent.ariaLabel = "Add inside"; parent.disabled = this.saving;
    view.nodes.filter(n => n.id && containers.has(n.kind)).forEach(n => { const option = el("option", "", this.path(view, n)); option.value = n.id!; parent.append(option); });
    parent.value = draft.parentId; parent.onchange = () => { draft.parentId = parent.value; this.error = ""; this.render(); this.card?.querySelector("select")?.focus({ preventScroll: true }); this.host.preview(); };
    const destination = el("label", "field", "Add inside"); destination.append(parent);
    form.append(palette, el("p", "", help[draft.kind]!), destination);
    const parentNode = view.nodes.find(n => n.id === draft.parentId), last = parentNode && this.children(view, parentNode).at(-1);
    form.append(el("p", "screen-add-position", parentNode && ["frame", "window", "viewport"].includes(parentNode.kind) && (last || parentNode.protected.length) ? `This ${parentNode.kind} already has a child. Choose its inner group to add another element.`
      : last ? `At the end, after ${this.name(view, last)}.` : "First element in this container."));
    if (["text", "textbutton"].includes(draft.kind)) {
      const text = el("textarea"); text.ariaLabel = "New element text"; text.value = draft.text; text.maxLength = 8192; text.readOnly = this.saving;
      text.required = true;
      text.oninput = () => { draft.text = text.value; this.host.preview(); };
      this.textValidation = validateField(text, () => { if (!text.value.trim()) throw Error("Enter text before adding this element. Input retained."); });
      const label = el("label", "field", draft.kind === "textbutton" ? "Button label" : "Text"); label.append(text); form.append(label);
    }
    const cancel = () => { if (this.saving) return; this.addition = undefined; this.error = ""; this.render(); this.focusRow(); this.host.preview(); this.host.note("Addition cancelled. Nothing changed."); };
    form.onkeydown = event => {
      if (event.isComposing) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel(); }
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); void this.add(); }
    };
    const actions = el("div", "screen-edit-actions");
    const add = action(`Add ${draft.kind === "textbutton" ? "button" : names[draft.kind]!.toLowerCase()}`, () => void this.add(), true), stop = action("Cancel", cancel);
    add.disabled = stop.disabled = this.saving; actions.append(add, stop); form.append(actions); card.append(form);
  }
  private validateTextInput(): boolean {
    try { this.textValidation?.(); return true; }
    catch { this.card?.querySelector("textarea")?.focus({ preventScroll: true }); return false; }
  }
  private async add(): Promise<void> {
    const draft = this.addition; if (!draft || this.saving) return;
    if (!this.validateTextInput()) return;
    this.saving = true; this.render();
    try {
      await this.host.commit({ type: "add", parentId: draft.parentId, kind: draft.kind, text: draft.text }, draft.document);
    } catch (error) {
      if (!this.host.view()) return;
      this.error = `${(error as Error).message}. Input retained.`; this.host.note(this.error, true);
      this.saving = false; this.render(); this.card?.querySelector<HTMLElement>("textarea")?.focus(); this.host.preview();
    } finally { this.saving = false; }
  }
  private renderText(view: CompositionView, card: HTMLElement): void {
    const key = this.textKey(view), draft = this.texts.get(key);
    card.append(el("h2", "", view.selected.kind === "textbutton" ? "Edit button label" : "Edit text"), el("p", "screen-edit-location", `${this.path(view, this.parent(view, view.selected) ?? view.selected)} · Nesting level ${this.depth(view, view.selected)}`));
    const input = el("textarea"); input.ariaLabel = view.selected.kind === "textbutton" ? "Button label" : "Text";
    input.value = draft?.value ?? view.selected.literal ?? ""; input.maxLength = 8192; input.readOnly = this.saving;
    input.required = true;
    this.textValidation = validateField(input, () => { if (!input.value.trim()) throw Error("Enter text before applying. Input retained."); });
    const label = el("label", "field", input.ariaLabel); label.append(input); card.append(label);
    const state = el("p", "screen-text-draft-state", draft ? "Unapplied changes. The canvas shows your draft." : "No unapplied changes."); state.role = "status";
    const actions = el("div", "screen-edit-actions");
    const apply = action("Apply changes", () => void this.applyText(), true);
    const cancel = action("Cancel changes", () => { if (this.saving) return; this.texts.delete(key); this.error = ""; this.render(); this.card?.querySelector("textarea")?.focus({ preventScroll: true }); this.host.preview(); this.host.note("Text draft cancelled. Saved text restored."); });
    apply.disabled = cancel.disabled = this.saving || !draft; actions.append(apply, cancel);
    input.oninput = () => {
      if (input.value === view.selected.literal) this.texts.delete(key);
      else this.texts.set(key, { screenId: view.screenId, nodeId: view.selected.id!, document: this.texts.get(key)?.document ?? view.document, value: input.value });
      apply.disabled = cancel.disabled = !this.texts.has(key); state.textContent = this.texts.has(key) ? "Unapplied changes. The canvas shows your draft." : "No unapplied changes."; this.host.preview();
    };
    input.onkeydown = event => {
      if (event.isComposing) return;
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void this.applyText(); }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancel.click(); }
    };
    card.append(state, actions, el("p", "screen-composition-help", "Ctrl / ⌘ + Enter applies · Esc restores saved text"), action("Back to elements", () => { this.host.select(screenNodeKey(view.selected), false); this.focusRow(); }));
  }
  private async applyText(): Promise<void> {
    const view = this.host.view(); if (!view || this.saving) return;
    const key = this.textKey(view), draft = this.texts.get(key); if (!draft) return;
    if (!this.validateTextInput()) return;
    this.saving = true; this.render();
    try {
      await this.host.commit({ type: "text", nodeId: draft.nodeId, text: draft.value }, draft.document);
    } catch (error) {
      if (!this.host.view()) return;
      this.error = `${(error as Error).message}. Input retained.`; this.host.note(this.error, true);
      this.saving = false; this.render(); this.card?.querySelector("textarea")?.focus({ preventScroll: true }); this.host.preview();
    } finally { this.saving = false; }
  }
  private async reorder(node: ScreenNode, target: ScreenNode, after: boolean, base?: ScreenDocument): Promise<void> {
    const view = this.host.view(); if (!view || this.saving || view.busy) return;
    if (this.hasDraft() || this.host.otherDraft?.()) { this.showError("Apply or cancel unfinished changes before reordering. Input retained."); return; }
    const refusal = this.moveRefusal(view, node, target); if (refusal) { this.showError(refusal); return; }
    if (node === target) return;
    this.saving = true; this.render();
    try {
      await this.host.commit({ type: "reorder", nodeId: node.id!, targetId: target.id!, after }, base ?? view.document);
    } catch (error) {
      if (!this.host.view()) return;
      this.showError(`${(error as Error).message}. Order and input retained.`);
      this.saving = false; this.render(); this.focusRow();
    } finally { this.saving = false; }
  }
  private requestRemoval(): void {
    const view = this.host.view(); if (!view || this.saving || view.busy || this.removal) return;
    if (this.hasDraft() || this.host.otherDraft?.()) { this.showError("Apply or cancel unfinished edits before removing elements. Input retained."); return; }
    const parent = this.parent(view, view.selected);
    if (parent?.kind === "grid" && parent.numericLayout?.allowsEmptyCells !== true) { this.showError("This grid's empty-cell policy stays in Source. Removal could leave it incomplete; nothing changed."); return; }
    if (!this.movable(view, view.selected)) { this.showError("The screen root and protected source-only elements cannot be removed. Selection is unchanged."); return; }
    const node = view.selected, descendants = view.nodes.filter(n => n.span.start > node.span.start && n.span.start < node.span.end);
    this.removal = { node, document: view.document, invoker: document.activeElement instanceof HTMLElement ? document.activeElement : null,
      cardScroll: this.card?.scrollTop ?? 0, panelScroll: this.panel?.scrollTop ?? 0 };
    this.dialog.replaceChildren();
    const title = el("h2", "", descendants.length ? `Remove ${this.name(view, node)}?` : `Remove ${(names[node.kind] ?? node.kind).toLowerCase()}?`);
    const description = el("p", "", descendants.length ? `This removes the group and ${descendants.length} ${descendants.length === 1 ? "child" : "children"}:` : `This removes the selected element from ${view.screenName}:`);
    title.id = `screen-remove-${++confirmationSequence}`; description.id = `${title.id}-description`;
    this.dialog.setAttribute("aria-labelledby", title.id); this.dialog.setAttribute("aria-describedby", description.id);
    this.dialog.append(title, description);
    if (descendants.length) {
      const list = el("ul", "screen-removal-list");
      for (const n of descendants) { const entry = el("li", "", `${names[n.kind] ?? n.kind} · ${this.name(view, n)}`); entry.style.marginLeft = `${Math.max(0, this.depth(view, n) - this.depth(view, node) - 1) * 12}px`; list.append(entry); }
      this.dialog.append(list);
    } else this.dialog.append(el("p", "screen-removal-target", this.name(view, node)));
    const actions = el("div", "screen-edit-actions");
    const cancel = action("Cancel", () => this.cancelRemoval()); cancel.autofocus = true;
    const confirm = action(descendants.length ? `Remove group and ${descendants.length} ${descendants.length === 1 ? "child" : "children"}` : `Remove ${(names[node.kind] ?? node.kind).toLowerCase()}`, () => void this.remove());
    confirm.classList.add("screen-destructive"); actions.append(cancel, confirm);
    const feedback = el("p", "screen-removal-error"); feedback.role = "status"; feedback.hidden = true;
    this.dialog.append(el("p", "", descendants.length ? "Undo restores the group and its children." : "You can undo this removal."), feedback, actions);
    this.panel?.classList.add("screen-removal-open");
    const affected = new Set([node, ...descendants].map(n => n.span.start));
    this.panel?.querySelectorAll<HTMLElement>(".screen-node").forEach(target => { target.dataset.removal = String(affected.has(view.nodes[Number(target.dataset.index)]?.span.start ?? -1)); });
    this.dialog.setAttribute("aria-modal", "true"); this.dialog.showModal(); cancel.focus({ preventScroll: true });
  }
  private closeRemoval(): void {
    this.dialog.close(); this.dialog.removeAttribute("aria-modal"); this.removal = undefined; this.panel?.classList.remove("screen-removal-open");
    this.panel?.querySelectorAll<HTMLElement>("[data-removal]").forEach(target => delete target.dataset.removal);
  }
  private cancelRemoval(): void {
    if (this.saving || !this.removal) return;
    const pending = this.removal; this.closeRemoval();
    pending.invoker?.focus({ preventScroll: true });
    if (this.card) this.card.scrollTop = pending.cardScroll;
    if (this.panel) this.panel.scrollTop = pending.panelScroll;
    this.host.note("Removal cancelled. Nothing changed.");
  }
  private async remove(): Promise<void> {
    const pending = this.removal; if (!pending || this.saving) return;
    this.saving = true; this.dialog.querySelectorAll("button").forEach(b => b.disabled = true);
    try {
      await this.host.commit({ type: "remove", nodeId: pending.node.id! }, pending.document);
    } catch (error) {
      if (!this.host.view()) return;
      const feedback = this.dialog.querySelector<HTMLElement>(".screen-removal-error");
      if (feedback) { feedback.textContent = `${(error as Error).message}. Nothing removed. Cancel and review Source; input is retained.`; feedback.hidden = false; }
    } finally { this.saving = false; if (this.host.view()) this.dialog.querySelectorAll("button").forEach(b => b.disabled = false); }
  }
}
