import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { elementIcon } from "../screens/elements.ts";
import "./style.css";

type Variant = "inline" | "context" | "focused";
type Kind = "screen" | "fixed" | "frame" | "vbox" | "text" | "textbutton" | "custom";
type Item = { id: string; parent: string; kind: Kind; text: string };
type Snapshot = { nodes: Item[]; selected: string };
type Addition = { kind: Exclude<Kind, "screen" | "custom">; parent: string; text: string; after?: string };
const names: Record<Kind, string> = { screen: "Help screen", fixed: "Free layout group", frame: "Frame", vbox: "Vertical group", text: "Text", textbutton: "Text button", custom: "Custom footer" };
const descriptions: Record<Kind, string> = {
  screen: "The screen contains every element. Its order cannot change.",
  fixed: "Places children freely. Later siblings appear in front.",
  frame: "Adds a background around one child. Add a layout group inside it to hold several elements.",
  vbox: "Places children from top to bottom in source order.",
  text: "Shows literal text. Edit the text under Design.",
  textbutton: "Shows a button label. Editing its label keeps existing actions in Source.",
  custom: "This custom statement stays in Source. Visual structural edits cannot move it.",
};
const variants: Record<Variant, string> = { inline: "Inline composer", context: "Add at selection", focused: "Focused composer" };
const initial = (): Item[] => [
  { id: "root", parent: "", kind: "screen", text: "Help" },
  { id: "layout", parent: "root", kind: "fixed", text: "" },
  { id: "panel", parent: "layout", kind: "frame", text: "" },
  { id: "content", parent: "panel", kind: "vbox", text: "" },
  { id: "title", parent: "content", kind: "text", text: "Help" },
  { id: "body", parent: "content", kind: "text", text: "Click to continue. Scroll back to revisit a line." },
  { id: "close", parent: "content", kind: "textbutton", text: "Close" },
  { id: "custom", parent: "layout", kind: "custom", text: "use custom_help_footer()" },
];
const containers = new Set<Kind>(["screen", "fixed", "frame", "vbox"]);

export function mountComposition(host: HTMLElement, context: LabContext, variant: Variant) {
  let nodes = initial(), selected = "body", step = "choose", addition: Addition | undefined;
  let sequence = 0, dragging: string | undefined, sourceOpen = false;
  let conflict = context.state === "conflict";
  const drafts = new Map<string, string>();
  const history: Snapshot[] = [], future: Snapshot[] = [];
  const current = () => nodes.find(n => n.id === selected)!;
  const children = (id: string) => nodes.filter(n => n.parent === id);
  const label = (n: Item) => n.kind === "text" || n.kind === "textbutton" ? `${names[n.kind]} · ${n.text || "(empty)"}` : names[n.kind];
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: () => drafts.size > 0 || !!addition || history.length > 0 });
  frame.shell.classList.add("compose-lab"); frame.shell.dataset.composer = variant;
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = `#37 · ${variants[variant]}`;
  frame.shell.querySelector(".lp-fiction")!.textContent = "Design draft · Changes stay in browser memory";
  const message = (text: string, error = false) => { frame.status.textContent = text; frame.status.dataset.error = String(error); };
  const remember = () => { history.push({ nodes: structuredClone(nodes), selected }); future.length = 0; };
  function travel(from: Snapshot[], to: Snapshot[]) {
    if (drafts.size || addition) { message("Apply or cancel unfinished changes before using history. Input retained.", true); return; }
    const snapshot = from.pop(); if (!snapshot) return;
    to.push({ nodes: structuredClone(nodes), selected }); nodes = snapshot.nodes;
    selected = nodes.some(n => n.id === selected) ? selected : snapshot.selected;
    render(); message("History restored. The selected element keeps its identity.");
  }
  const undo = action("Undo", () => travel(history, future)), redo = action("Redo", () => travel(future, history));
  const viewSource = action("View sample source", () => { sourceOpen = !sourceOpen; renderSource(); });
  frame.tools.append(undo, redo, viewSource);
  const screenbar = el("div", "compose-screenbar");
  screenbar.append(el("span", "", "Help"), el("span", "", "game/ui/help.rpy"), el("span", "", "Panel"));
  const workspace = el("div", "compose-workspace"), rail = el("nav", "compose-rail"); rail.ariaLabel = "Screen building steps";
  for (const [id, text] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
    rail.append(action(text!, () => { step = id!; renderCard(); syncSelection(); }));
  }
  const stage = el("section", "compose-stage"); stage.ariaLabel = "Screen canvas";
  const canvasHeader = el("div", "compose-canvas-header");
  canvasHeader.append(el("h2", "", "Help"), el("span", "", "1280 × 720 · Fit"));
  const drawing = el("div", "compose-drawing");
  const selectionCaption = el("p", "compose-selection");
  stage.append(canvasHeader, drawing, selectionCaption, el("p", "compose-footnote", "HTML sample. Canvas clicks select elements; buttons do not run game actions."));
  const card = el("section", "compose-editor"); card.ariaLabel = "Element editor";
  workspace.append(rail, stage, card);
  const source = el("pre", "compose-source"); source.ariaLabel = "Sample source";
  frame.content.append(screenbar, workspace, source);

  function ordered(id = "root"): Item[] { const item = nodes.find(n => n.id === id)!; return [item, ...children(id).flatMap(n => ordered(n.id))]; }
  function depth(n: Item): number { return n.parent ? 1 + depth(nodes.find(p => p.id === n.parent)!) : 0; }
  function choose(id: string, design = false) {
    selected = id;
    if (design) { step = "design"; renderCard(); }
    else if (step !== "choose") renderCard();
    else renderSelectionDetails();
    syncSelection();
  }
  function syncSelection() {
    card.querySelectorAll<HTMLElement>("[data-row]").forEach(row => {
      row.ariaSelected = String(row.dataset.row === selected); row.tabIndex = row.dataset.row === selected ? 0 : -1;
    });
    drawing.querySelectorAll<HTMLElement>("[data-pick]").forEach(item => item.dataset.selected = String(item.dataset.pick === selected));
    rail.querySelectorAll("button").forEach((button, i) => button.ariaPressed = String(["choose", "design", "connect"][i] === step));
    selectionCaption.textContent = `${label(current())} · Depth ${depth(current())}${drafts.has(selected) ? " · Draft text" : ""}`;
    undo.disabled = !history.length; redo.disabled = !future.length;
  }
  function guardWrite() {
    if (conflict) { message("Source changed outside this draft. Input retained. Review Source before applying.", true); return false; }
    return true;
  }
  function move(id: string, targetId: string, after: boolean) {
    if (drafts.size || addition) { message("Apply or cancel unfinished changes before reordering. Input retained.", true); return; }
    const item = nodes.find(n => n.id === id)!, target = nodes.find(n => n.id === targetId)!;
    if (!item.parent || item.parent !== target.parent) { message("Reorder within the same parent. Groups keep their children.", true); return; }
    if (id === targetId) return;
    const siblings = children(item.parent), from = siblings.indexOf(item), dest = siblings.indexOf(target);
    if (siblings.slice(Math.min(from, dest), Math.max(from, dest) + 1).some(n => ordered(n.id).some(c => c.kind === "custom"))) {
      message("This move crosses protected source. Order and selection are unchanged.", true); return;
    }
    const reordered = siblings.filter(n => n.id !== id), position = reordered.indexOf(target) + Number(after);
    reordered.splice(position, 0, item);
    if (reordered.every((n, i) => n.id === siblings[i]!.id)) { message("Order unchanged. No history entry added."); return; }
    if (!guardWrite()) return;
    remember(); const blocks = reordered.flatMap(n => ordered(n.id)), first = nodes.indexOf(siblings[0]!);
    const ids = new Set(blocks.map(n => n.id)); nodes = nodes.filter(n => !ids.has(n.id)); nodes.splice(first, 0, ...blocks);
    selected = id; render(); card.querySelector<HTMLElement>(`[data-row="${id}"]`)?.focus();
    message("Order changed in memory. The group and its children move together.");
  }
  function moveBy(offset: number) {
    const siblings = children(current().parent), target = siblings[siblings.indexOf(current()) + offset];
    if (target) move(selected, target.id, offset > 0);
  }
  function beginAddition(parent?: string) {
    if (drafts.size) { message("Apply or cancel the text draft first. Input retained.", true); return; }
    addition ??= { kind: "text", parent: parent ?? (containers.has(current().kind) ? selected : current().parent), text: "New text",
      ...(variant === "context" && !containers.has(current().kind) ? { after: selected } : {}) };
    step = "choose"; renderCard(); syncSelection(); card.querySelector<HTMLElement>('[aria-label="Element type"]')?.focus();
  }
  function add() {
    if (!addition) return;
    const parent = nodes.find(n => n.id === addition!.parent)!;
    if (!containers.has(parent.kind) || (parent.kind === "frame" && children(parent.id).length)) {
      message("A frame holds one child. Select its inner group to add more elements. Input retained.", true); return;
    }
    if ((addition.kind === "text" || addition.kind === "textbutton") && !addition.text.trim()) {
      message("Enter text before adding this element. Input retained.", true); return;
    }
    if (!guardWrite()) return;
    remember(); const item: Item = { id: `new-${++sequence}`, parent: parent.id, kind: addition.kind, text: ["text", "textbutton"].includes(addition.kind) ? addition.text : "" };
    const last = ordered(addition.after ?? parent.id).at(-1)!; nodes.splice(nodes.indexOf(last) + 1, 0, item);
    selected = item.id; addition = undefined; render(); message("Element added in memory. Undo removes this one addition.");
  }
  function renderAddition() {
    const section = el("section", "compose-add"); section.ariaLabel = "Add element";
    section.append(el("h3", "", "Add an element"));
    const type = el("select"); type.ariaLabel = "Element type";
    for (const kind of ["text", "textbutton", "fixed", "frame", "vbox"] as const) type.add(new Option(names[kind], kind));
    type.value = addition!.kind;
    const help = el("p", "compose-type-help", descriptions[addition!.kind]);
    type.onchange = () => { addition!.kind = type.value as Addition["kind"]; renderCard(); syncSelection(); };
    if (variant === "focused") {
      const palette = el("div", "compose-palette"); palette.ariaLabel = "Element types";
      for (const kind of ["text", "textbutton", "fixed", "frame", "vbox"] as const) {
        const choice = action(names[kind], () => { addition!.kind = kind; renderCard(); syncSelection(); });
        choice.prepend(elementIcon(kind)); choice.ariaPressed = String(addition!.kind === kind); palette.append(choice);
      }
      section.append(palette); type.hidden = true;
    }
    section.append(labelled("Element type", type), help);
    const parent = el("select"); parent.ariaLabel = "Add inside";
    for (const n of ordered().filter(n => containers.has(n.kind))) parent.add(new Option(`${"· ".repeat(depth(n))}${names[n.kind]}`, n.id));
    parent.value = addition!.parent; parent.onchange = () => { addition!.parent = parent.value; delete addition!.after; };
    section.append(labelled("Add inside", parent));
    if (["text", "textbutton"].includes(addition!.kind)) {
      const text = el("textarea"); text.value = addition!.text; text.ariaLabel = "New element text";
      text.oninput = () => { addition!.text = text.value; }; section.append(labelled(addition!.kind === "textbutton" ? "Button label" : "Text", text));
    }
    const actions = el("div", "compose-actions");
    actions.append(action("Add element", add, true), action("Cancel addition", () => { addition = undefined; renderCard(); syncSelection(); message("Addition cancelled. No change accepted."); }));
    section.append(actions); return section;
  }
  function renderSelectionDetails() {
    card.querySelector(".compose-selected-details")?.remove();
    if (step !== "choose") return;
    const details = el("div", "compose-selected-details"), n = current();
    details.append(el("strong", "", names[n.kind]), el("p", "", descriptions[n.kind]));
    const order = el("details"); order.append(el("summary", "", "Order and depth"));
    order.append(el("p", "", "Reorder within one parent. In a vertical group, order runs from top to bottom. In a free layout, later siblings appear in front. A group keeps its children."));
    details.append(order);
    const moves = el("div", "compose-actions"), siblings = children(n.parent), index = siblings.indexOf(n);
    const up = action("Move earlier", () => moveBy(-1)), down = action("Move later", () => moveBy(1));
    up.disabled = !n.parent || n.kind === "custom" || index <= 0; down.disabled = !n.parent || n.kind === "custom" || index >= siblings.length - 1;
    moves.append(up, down); details.append(moves);
    if (variant === "context") {
      details.append(action(containers.has(n.kind) ? "Add inside selection" : "Add beside selection", () => beginAddition()));
    }
    card.querySelector(".compose-tree")?.after(details);
  }
  function renderTree() {
    const tree = el("div", "compose-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
    const all = ordered();
    for (const n of all) {
      const row = action(label(n), () => choose(n.id)); row.role = "treeitem"; row.dataset.row = n.id;
      row.prepend(elementIcon(n.kind)); row.ariaLevel = String(depth(n) + 1); row.style.paddingLeft = `${8 + depth(n) * 13}px`;
      row.title = `${names[n.kind]}. ${descriptions[n.kind]} Depth ${depth(n)}.`;
      row.ondblclick = () => choose(n.id, true);
      row.onkeydown = event => {
        if (event.key === "Enter") { event.preventDefault(); choose(n.id, true); }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          if (event.altKey) { selected = n.id; moveBy(event.key === "ArrowDown" ? 1 : -1); }
          else { choose(all[Math.max(0, Math.min(all.length - 1, all.indexOf(n) + (event.key === "ArrowDown" ? 1 : -1)))]!.id); }
          card.querySelector<HTMLElement>(`[data-row="${selected}"]`)?.focus();
        }
      };
      row.draggable = !!n.parent && n.kind !== "custom";
      row.ondragstart = event => { dragging = n.id; event.dataTransfer!.setData("text/plain", n.id); };
      row.ondragover = event => { if (dragging && nodes.find(item => item.id === dragging)?.parent === n.parent) { event.preventDefault(); row.dataset.drop = "true"; } };
      row.ondragleave = () => { delete row.dataset.drop; };
      row.ondrop = event => { event.preventDefault(); if (dragging) move(dragging, n.id, event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2); dragging = undefined; };
      row.ondragend = () => { dragging = undefined; tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(item => delete item.dataset.drop); };
      tree.append(row);
    }
    card.append(tree); renderSelectionDetails();
  }
  function renderCard() {
    card.replaceChildren();
    if (step === "choose") {
      card.append(el("h2", "", addition && variant === "focused" ? "Add an element" : "Choose an element"));
      if (!(addition && variant === "focused")) {
        const toolbar = el("div", "compose-tree-toolbar");
        toolbar.append(action("Add...", () => beginAddition())); card.append(toolbar); renderTree();
        card.append(el("p", "compose-key-help", "Arrows select · Enter opens Design · Alt + arrows reorder"));
      }
      if (addition) {
        const form = renderAddition();
        if (variant === "context") card.querySelector(`[data-row="${selected}"]`)?.after(form);
        else card.append(form);
      }
      else if (variant === "inline") {
        const start = action("Add an element below", () => beginAddition()); start.classList.add("compose-add-start"); card.append(start);
      }
    } else if (step === "design") {
      const n = current(); card.append(el("h2", "", names[n.kind]));
      if (["text", "textbutton"].includes(n.kind)) {
        const text = el("textarea"); text.ariaLabel = n.kind === "textbutton" ? "Button label" : "Text"; text.value = drafts.get(n.id) ?? n.text;
        text.oninput = () => { if (text.value === n.text) drafts.delete(n.id); else drafts.set(n.id, text.value); renderCanvas(); syncSelection(); };
        card.append(labelled(text.ariaLabel!, text));
        const actions = el("div", "compose-actions");
        actions.append(action("Apply changes", () => {
          const value = drafts.get(n.id);
          if (value === undefined || value === n.text) { message("Text unchanged. No history entry added."); return; }
          if (!value.trim()) { message("Enter text before applying. Input retained.", true); return; }
          if (!guardWrite()) return;
          remember(); n.text = value; drafts.delete(n.id); render(); message("Text applied in memory. Existing button actions stay unchanged.");
        }, true), action("Cancel changes", () => { drafts.delete(n.id); render(); message("Text draft cancelled. Saved sample text restored."); }));
        card.append(actions, el("p", "", "Text stays a draft until Apply. Cancel restores the saved text."));
      } else card.append(el("p", "", descriptions[n.kind]));
      card.append(action("Back to elements", () => { step = "choose"; renderCard(); syncSelection(); }));
    } else card.append(el("h2", "", "Connect"), el("p", "", "Existing button actions stay in Source. Action editing belongs to a later ticket."));
  }
  function renderCanvas() {
    drawing.replaceChildren();
    function draw(n: Item): HTMLElement {
      const item = el("div", `compose-art compose-art-${n.kind}`); item.dataset.pick = n.id; item.dataset.selected = String(n.id === selected);
      const pick = action(names[n.kind], () => choose(n.id)); pick.className = "compose-hit"; pick.ariaLabel = `Select ${label(n)}`;
      item.append(pick);
      if (["text", "textbutton"].includes(n.kind)) item.append(el("span", "", drafts.get(n.id) ?? n.text));
      if (n.kind === "custom") item.append(el("span", "", "Custom footer · Source only"));
      for (const child of children(n.id)) item.append(draw(child));
      return item;
    }
    drawing.append(draw(nodes[0]!));
  }
  function renderSource() {
    source.hidden = !sourceOpen; if (!sourceOpen) return;
    source.textContent = ["# Sample only. No project file is read or written.", ...ordered().map(n => {
      const indent = "    ".repeat(depth(n));
      if (n.kind === "screen") return "screen help():";
      if (n.kind === "custom") return `${indent}${n.text}  # preserved custom neighbor`;
      if (n.kind === "textbutton") return `${indent}textbutton ${JSON.stringify(n.text)} action ${n.id === "close" ? 'Hide("help")' : "Null()"}`;
      if (n.kind === "text") return `${indent}text ${JSON.stringify(n.text)}`;
      return `${indent}${n.kind}:${children(n.id).length ? "" : "\n" + indent + "    null"}`;
    })].join("\n");
  }
  function render() { renderCard(); renderCanvas(); renderSource(); syncSelection(); }
  if (context.state === "adding") addition = { kind: "text", parent: "content", text: "Press Escape to open the menu.", ...(variant === "context" ? { after: "body" } : {}) };
  render();
  message(conflict ? "Source conflict sample. Apply, Add and reorder retain input and refuse writes." : "Select a row or canvas item. Add elements and change their order in Choose.");
  if (conflict) {
    const resolve = action("Simulate Source refresh", () => { conflict = false; message("Sample Source refreshed. Retained input can now be applied."); });
    frame.tools.append(resolve);
  }
}
