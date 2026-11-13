// Move to (`story-combined-editor` / `replace-v2`): a tree of the scene, its branches and
// its options in source order, with "Before …" and "End of …" positions from core's
// insertion places. It opens on the beat's own location, with the rest closed. The tree
// is one tab stop: Up and Down move, Right opens or moves in, Left closes or moves out,
// Enter selects and Escape cancels.
import type { BodyRef, Position } from "./scene-ui.ts";
import { button, element, iconButton } from "./story-editor-controls.ts";

/** A scene, branch or option with its positions and inner places, or one position. */
export interface PlaceNode {
  readonly id: string;
  readonly label: string;
  /** For a place: its editor path, "Arrival › If trust ≥ 5". */
  readonly path?: string;
  readonly children?: readonly PlaceNode[];
  /** For a position: where the beat would go. */
  readonly place?: { readonly body: BodyRef; readonly position: Position };
}
export interface PlaceTreeOptions {
  readonly host: HTMLElement;
  readonly opener?: HTMLElement | null;
  readonly title: string;
  readonly note: string;
  readonly tree: PlaceNode;
  /** Places open at the start: the beat's own location and the places around it. */
  readonly expanded: readonly string[];
  /** The position chosen at the start, if any. */
  readonly chosen?: string;
  /** Moves the beat. Resolves true once it moved; the dialog then closes. */
  readonly move: (place: { readonly body: BodyRef; readonly position: Position }) => Promise<boolean>;
}

export function openPlaceTree(options: PlaceTreeOptions): () => void {
  options.host.querySelector(":scope > .story-dialog-backdrop")?.remove();
  const nodes = new Map<string, PlaceNode>(), parents = new Map<string, string>();
  const index = (node: PlaceNode): void => { nodes.set(node.id, node); for (const child of node.children ?? []) { parents.set(child.id, node.id); index(child); } };
  index(options.tree);
  const expanded = new Set(options.expanded);
  let chosen = options.chosen && nodes.get(options.chosen)?.place ? options.chosen : undefined;
  let focusId = chosen ?? options.expanded.at(-1) ?? options.tree.id;
  // The place the summary names while no position is chosen.
  let pickedPlace = chosen ? parents.get(chosen)! : focusId;
  let busy = false;
  const backdrop = element("div", "story-dialog-backdrop");
  const dialog = element("div", "story-dialog story-move"); dialog.role = "dialog"; dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-label", options.title); dialog.tabIndex = -1;
  const close = (refocus = true): void => { if (!backdrop.isConnected) return; backdrop.remove(); if (refocus) options.opener?.focus(); };
  const head = element("div", "story-dialog-head"); head.append(element("h2", "", options.title), iconButton("close", "Close without moving", () => close()));
  const tree = element("ul", "story-place-tree"); tree.role = "tree"; tree.setAttribute("aria-label", "Move to");
  const summary = element("p", "story-summary"); summary.role = "status";
  const cancel = button("Cancel", "button secondary", () => close());
  const confirm = button("Move", "button primary", () => void run());
  const actions = element("div", "story-dialog-actions"); actions.append(cancel, confirm);
  dialog.append(head, element("p", "story-dialog-note", options.note), tree, summary, element("p", "story-hint", "Arrow keys move · Right opens · Left closes · Enter selects · Escape cancels"), actions);
  backdrop.append(dialog);
  const visible = (node: PlaceNode = options.tree): PlaceNode[] => [node, ...node.children && expanded.has(node.id) ? node.children.flatMap(child => visible(child)) : []];
  const level = (id: string): number => { let depth = 1; for (let at = parents.get(id); at; at = parents.get(at)) depth++; return depth; };
  const draw = (refocus = false): void => {
    tree.replaceChildren();
    for (const node of visible()) {
      const item = element("li", node.children ? "story-place" : "story-position"); item.role = "treeitem"; item.dataset.node = node.id;
      item.setAttribute("aria-level", String(level(node.id))); item.style.setProperty("--depth", String(level(node.id) - 1)); item.tabIndex = node.id === focusId ? 0 : -1;
      if (node.children) item.setAttribute("aria-expanded", String(expanded.has(node.id))); else item.setAttribute("aria-selected", String(node.id === chosen));
      const mark = element("span", "story-place-mark", node.children ? expanded.has(node.id) ? "▾" : "▸" : node.id === chosen ? "●" : "○"); mark.setAttribute("aria-hidden", "true");
      item.append(mark, element("span", "", node.label));
      item.addEventListener("click", () => { focusId = node.id; if (node.children && expanded.has(node.id) && pickedPlace === node.id && !chosen) expanded.delete(node.id); else select(node); draw(true); });
      tree.append(item);
    }
    const position = chosen ? nodes.get(chosen) : undefined;
    summary.textContent = position ? `Move to ${nodes.get(parents.get(position.id)!)?.path ?? ""} · ${position.label}` : `Choose an available position in ${nodes.get(pickedPlace)?.label ?? options.tree.label}.`;
    summary.classList.toggle("story-summary-choose", !position);
    if (refocus) tree.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  };
  /** Selecting a position chooses it. Selecting a place opens it and asks for a position there. */
  const select = (node: PlaceNode): void => {
    focusId = node.id;
    if (node.children) { expanded.add(node.id); pickedPlace = node.id; chosen = undefined; } else { chosen = node.id; pickedPlace = parents.get(node.id)!; }
  };
  tree.addEventListener("keydown", event => {
    const list = visible(), at = list.findIndex(node => node.id === focusId), node = list[at]; if (!node) return;
    if (event.key === "ArrowDown") focusId = list[at + 1]?.id ?? focusId;
    else if (event.key === "ArrowUp") focusId = list[at - 1]?.id ?? focusId;
    else if (event.key === "ArrowRight") { if (node.children && !expanded.has(node.id)) expanded.add(node.id); else if (node.children?.[0]) focusId = node.children[0].id; }
    else if (event.key === "ArrowLeft") { if (node.children && expanded.has(node.id)) expanded.delete(node.id); else focusId = parents.get(node.id) ?? focusId; }
    else if (event.key === "Enter") select(node);
    else return;
    event.preventDefault(); event.stopPropagation(); draw(true);
  });
  const run = async (): Promise<void> => {
    const place = chosen ? nodes.get(chosen)?.place : undefined;
    if (!place) { draw(); tree.querySelector<HTMLElement>('[tabindex="0"]')?.focus(); return; }
    if (busy) return;
    busy = true; confirm.disabled = cancel.disabled = true;
    try { if (await options.move(place)) close(false); }
    finally { busy = false; if (backdrop.isConnected) { confirm.disabled = cancel.disabled = false; confirm.focus(); } }
  };
  dialog.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (!busy) close(); return; }
    if (event.key === "Tab") { const stops = [tree.querySelector<HTMLElement>('[tabindex="0"]'), cancel, confirm, dialog.querySelector<HTMLElement>(".story-dialog-head button")].filter((stop): stop is HTMLElement => !!stop && !(stop as HTMLButtonElement).disabled); const at = stops.indexOf(document.activeElement as HTMLElement); event.preventDefault(); stops[(at + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus(); }
  });
  backdrop.addEventListener("pointerdown", event => { if (event.target === backdrop && !busy) close(); });
  draw(); options.host.append(backdrop); tree.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  return close;
}
