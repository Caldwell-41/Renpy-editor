import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { elementIcon } from "../screens/elements.ts";
import "./style.css";
import "./workflow.css";
import "./removal.css";

type Kind = "screen" | "fixed" | "frame" | "vbox" | "text" | "textbutton" | "custom";
type Item = { id: string; parent: string; kind: Kind; text: string };
type Snapshot = { nodes: Item[]; selected: string; restoreSelection?: boolean };
type Addition = { kind: Exclude<Kind, "screen" | "custom">; parent: string; text: string };
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

export const mount: LabMount = (host, context) => {
  let nodes = initial(), selected = "body", step = "choose", addition: Addition | undefined;
  let formError = "";
  let removal: string | undefined;
  let removedNotice = "";
  let sequence = 0, dragging: string | undefined;
  let sourceReturn: HTMLElement | null = null;
  let conflict = context.state === "conflict";
  const drafts = new Map<string, string>();
  const history: Snapshot[] = [], future: Snapshot[] = [];
  const current = () => nodes.find(n => n.id === selected)!;
  const children = (id: string) => nodes.filter(n => n.parent === id);
  function displayName(n: Item) {
    if (n.kind === "screen") return "Help";
    if (["text", "textbutton"].includes(n.kind)) return n.text || "(empty)";
    const peers = children(n.parent).filter(peer => peer.kind === n.kind);
    return peers.length > 1 ? `${names[n.kind]} ${peers.indexOf(n) + 1}` : names[n.kind];
  }
  const label = (n: Item) => n.kind === "text" || n.kind === "textbutton" ? `${names[n.kind]} · ${n.text || "(empty)"}` : displayName(n);
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: () => drafts.size > 0 || !!addition || history.length > 0 });
  frame.shell.classList.add("compose-lab", "compose-workflow-proto", "compose-removal"); frame.shell.dataset.composer = "focused";
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "#37 · Compose and remove elements";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Design draft · Changes stay in browser memory";
  const message = (text: string, error = false) => {
    frame.status.textContent = text; frame.status.dataset.error = String(error);
    formError = error ? text : "";
    const feedback = card.querySelector<HTMLElement>(".workflow-feedback");
    if (feedback) { feedback.textContent = formError; feedback.hidden = !formError; }
  };
  const remember = (restoreSelection = false) => {
    removedNotice = ""; history.push({ nodes: structuredClone(nodes), selected, restoreSelection }); future.length = 0;
  };
  function travel(from: Snapshot[], to: Snapshot[]) {
    if (drafts.size || addition) { message("Apply or cancel unfinished changes before using history. Input retained.", true); return; }
    const snapshot = from.pop(); if (!snapshot) return;
    to.push({ nodes: structuredClone(nodes), selected, restoreSelection: snapshot.restoreSelection }); nodes = snapshot.nodes;
    selected = snapshot.restoreSelection ? snapshot.selected : nodes.some(n => n.id === selected) ? selected : snapshot.selected;
    removal = undefined; removedNotice = "";
    render(); focusRow(); message("History restored. The selected element keeps its identity.");
  }
  const undo = action("Undo", () => travel(history, future)), redo = action("Redo", () => travel(future, history));
  const viewSource = action("View sample source", openSource);
  frame.tools.append(undo, redo, viewSource);
  const screenbar = el("div", "compose-screenbar");
  screenbar.append(el("span", "", "Help"), el("span", "", "game/ui/help.rpy"), el("span", "", "Panel"));
  const workspace = el("div", "compose-workspace"), rail = el("nav", "compose-rail"); rail.ariaLabel = "Screen building steps";
  for (const [id, text] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
    rail.append(action(text!, () => { step = id!; removal = undefined; clearFormError(); renderCard(); renderCanvas(); syncSelection(); }));
  }
  const stage = el("section", "compose-stage"); stage.ariaLabel = "Screen canvas";
  const canvasHeader = el("div", "compose-canvas-header");
  canvasHeader.append(el("h2", "", "Help"), el("span", "", "1280 × 720 · Fit"));
  const drawing = el("div", "compose-drawing");
  const selectionCaption = el("p", "compose-selection");
  const breadcrumb = el("nav", "workflow-breadcrumb"); breadcrumb.ariaLabel = "Selection path";
  stage.append(canvasHeader, drawing, breadcrumb, selectionCaption, el("p", "compose-footnote", "HTML sample. Canvas clicks select elements; buttons do not run game actions."));
  const card = el("section", "compose-editor"); card.ariaLabel = "Element editor";
  const canvasJump = action("Show canvas", () => { stage.scrollIntoView({ block: "start" }); canvasHeader.tabIndex = -1; canvasHeader.focus({ preventScroll: true }); });
  canvasJump.classList.add("workflow-compact-jump");
  const editorJump = action("Back to editing", () => {
    card.scrollIntoView({ block: "start" });
    const target = card.querySelector<HTMLElement>("textarea") ?? card.querySelector<HTMLElement>(`[data-row="${selected}"]`);
    target?.focus({ preventScroll: true });
  });
  editorJump.classList.add("workflow-compact-jump"); canvasHeader.append(editorJump);
  workspace.append(rail, canvasJump, stage, card);
  const source = el("pre", "compose-source"); source.ariaLabel = "Sample source";
  const sourceDialog = el("dialog", "workflow-source-dialog"); sourceDialog.ariaLabel = "Sample source";
  const sourceHeader = el("div", "workflow-panel-heading");
  const closeSource = action("Close source", () => sourceDialog.close());
  sourceHeader.append(el("h2", "", "Sample source"), closeSource);
  const sourceNotice = el("p", "", "Accepted sample only. Pending edits are not applied here. No project file is read or written.");
  const refresh = action("Simulate source refresh", () => {
    conflict = false; sourceDialog.close(); render(); message("Sample source refreshed. Your draft is ready to apply.");
    card.querySelector<HTMLElement>("textarea")?.focus();
  });
  sourceDialog.append(sourceHeader, sourceNotice, source, refresh);
  sourceDialog.onclose = () => { sourceReturn?.focus(); };
  frame.content.append(screenbar, workspace); frame.shell.append(sourceDialog);
  function openSource() {
    sourceReturn = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    renderSource(); refresh.hidden = !conflict;
    sourceNotice.textContent = conflict
      ? "Source conflict sample. Your input is retained. This preview can simulate a source refresh; it does not reconcile real files."
      : "Accepted sample only. Pending edits are not applied here. No project file is read or written.";
    sourceDialog.showModal(); closeSource.focus();
  }

  function ordered(id = "root"): Item[] { const item = nodes.find(n => n.id === id)!; return [item, ...children(id).flatMap(n => ordered(n.id))]; }
  function depth(n: Item): number { return n.parent ? 1 + depth(nodes.find(p => p.id === n.parent)!) : 0; }
  function choose(id: string, design = false) {
    if (removal) { removal = undefined; renderCanvas(); }
    selected = id; clearFormError();
    if (design) step = "design";
    if (step === "choose" && !addition) renderSelectionDetails();
    else renderCard();
    syncSelection();
    if (design) card.querySelector<HTMLElement>("textarea")?.focus();
    else card.querySelector<HTMLElement>(`[data-row="${selected}"]`)?.scrollIntoView({ block: "nearest" });
  }
  function hover(id?: string) {
    drawing.querySelectorAll<HTMLElement>("[data-pick]").forEach(item => item.dataset.hovered = String(item.dataset.pick === id));
  }
  function syncSelection() {
    card.querySelectorAll<HTMLElement>("[data-row]").forEach(row => {
      row.ariaSelected = String(row.dataset.row === selected); row.tabIndex = row.dataset.row === selected ? 0 : -1;
    });
    drawing.querySelectorAll<HTMLElement>("[data-pick]").forEach(item => item.dataset.selected = String(item.dataset.pick === selected));
    rail.querySelectorAll("button").forEach((button, i) => button.ariaPressed = String(["choose", "design", "connect"][i] === step));
    selectionCaption.textContent = `${names[current().kind]} · Nesting level ${depth(current())}${drafts.has(selected) ? " · Unapplied text" : ""}`;
    breadcrumb.replaceChildren();
    const ancestors: Item[] = []; let item: Item | undefined = current();
    while (item) { ancestors.unshift(item); item = nodes.find(n => n.id === item!.parent); }
    for (const n of ancestors) {
      if (breadcrumb.childElementCount) breadcrumb.append(el("span", "", "/"));
      const pick = action("", () => choose(n.id));
      pick.append(el("span", "workflow-path-label", displayName(n)));
      pick.ariaLabel = `Select ancestor ${label(n)}`; pick.title = label(n);
      if (n.id === selected) pick.ariaCurrent = "true";
      breadcrumb.append(pick);
    }
    undo.disabled = !history.length; redo.disabled = !future.length;
    canvasHeader.querySelector("span")!.textContent = addition ? "Draft addition · Not applied" : drafts.size ? "Text preview · Not applied" : "1280 × 720 · Fit";
  }
  function guardWrite() {
    if (conflict) { message("Source changed outside this draft. Input retained. Review Source before applying.", true); return false; }
    return true;
  }
  function moveRefusal(id: string, targetId: string) {
    const item = nodes.find(n => n.id === id)!, target = nodes.find(n => n.id === targetId)!;
    if (!item.parent || item.parent !== target.parent) return "Move within the same parent. This does not change an element's container.";
    const siblings = children(item.parent), from = siblings.indexOf(item), dest = siblings.indexOf(target);
    if (siblings.slice(Math.min(from, dest), Math.max(from, dest) + 1).some(n => ordered(n.id).some(c => c.kind === "custom"))) {
      return "Custom footer is source-only. You cannot move this element across it. Order and selection are unchanged.";
    }
    return "";
  }
  function move(id: string, targetId: string, after: boolean) {
    removal = undefined;
    if (drafts.size || addition) { message("Apply or cancel unfinished changes before reordering. Input retained.", true); return; }
    if (id === targetId) return;
    const refusal = moveRefusal(id, targetId); if (refusal) { message(refusal, true); return; }
    const item = nodes.find(n => n.id === id)!, target = nodes.find(n => n.id === targetId)!;
    const siblings = children(item.parent);
    const reordered = siblings.filter(n => n.id !== id), position = reordered.indexOf(target) + Number(after);
    reordered.splice(position, 0, item);
    if (reordered.every((n, i) => n.id === siblings[i]!.id)) { message("Order unchanged. No history entry added."); return; }
    if (!guardWrite()) return;
    remember(); const blocks = reordered.flatMap(n => ordered(n.id)), first = nodes.indexOf(siblings[0]!);
    const ids = new Set(blocks.map(n => n.id)); nodes = nodes.filter(n => !ids.has(n.id)); nodes.splice(first, 0, ...blocks);
    selected = id; render(); card.querySelector<HTMLElement>(`[data-row="${id}"]`)?.focus();
    message(`${names[item.kind]} moved ${after ? "after" : "before"} ${label(target)}. Undo restores the order.`);
  }
  function moveBy(offset: number) {
    const siblings = children(current().parent), target = siblings[siblings.indexOf(current()) + offset];
    if (target) move(selected, target.id, offset > 0);
  }
  function focusRow() { card.querySelector<HTMLElement>(`[data-row="${selected}"]`)?.focus(); }
  function clearFormError() {
    formError = "";
    const feedback = card.querySelector<HTMLElement>(".workflow-feedback");
    if (feedback) { feedback.textContent = ""; feedback.hidden = true; }
  }
  function cancelAddition() {
    addition = undefined; formError = ""; render(); focusRow();
    message("Addition cancelled. Nothing changed.");
  }
  function beginAddition(parent?: string) {
    removal = undefined;
    if (drafts.size) { message("Apply or cancel the text draft first. Input retained.", true); return; }
    addition ??= { kind: "text", parent: parent ?? (containers.has(current().kind) ? selected : current().parent), text: "" };
    step = "choose"; formError = ""; render();
    card.querySelector<HTMLElement>('[aria-label="New element text"]')?.focus();
  }
  function add() {
    if (!addition) return;
    const parent = nodes.find(n => n.id === addition!.parent)!;
    if (!containers.has(parent.kind) || (parent.kind === "frame" && children(parent.id).length)) {
      message("A frame holds one child. Select its inner group to add more elements. Input retained.", true); return;
    }
    if ((addition.kind === "text" || addition.kind === "textbutton") && !addition.text.trim()) {
      message("Enter text before adding this element. Input retained.", true);
      card.querySelector<HTMLElement>('[aria-label="New element text"]')?.focus(); return;
    }
    if (!guardWrite()) return;
    remember(); const item: Item = { id: `new-${++sequence}`, parent: parent.id, kind: addition.kind, text: ["text", "textbutton"].includes(addition.kind) ? addition.text : "" };
    const last = ordered(parent.id).at(-1)!; nodes.splice(nodes.indexOf(last) + 1, 0, item);
    selected = item.id; addition = undefined; formError = ""; render(); focusRow();
    message(`${names[item.kind]} added. Enter opens Design. Undo removes this addition.`);
  }
  function parentPath(id: string): string {
    const n = nodes.find(item => item.id === id)!;
    return n.parent ? `${parentPath(n.parent)} / ${displayName(n)}` : "Help";
  }
  function renderAddition() {
    const section = el("section", "compose-add"); section.ariaLabel = "Add element";
    section.onkeydown = event => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); cancelAddition(); }
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); add(); }
    };
    const palette = el("div", "compose-palette"); palette.ariaLabel = "Element types";
    for (const kind of ["text", "textbutton", "fixed", "frame", "vbox"] as const) {
      const choice = action(names[kind], () => {
        addition!.kind = kind; clearFormError(); renderCard(); renderCanvas(); syncSelection();
        card.querySelector<HTMLElement>(`[data-kind="${kind}"]`)?.focus();
      });
      choice.dataset.kind = kind;
      choice.prepend(elementIcon(kind)); choice.ariaPressed = String(addition!.kind === kind); palette.append(choice);
    }
    const typeHelp = addition!.kind === "text" ? "Instructions, headings or other text."
      : addition!.kind === "textbutton" ? "A clickable label. New buttons start without an action."
      : descriptions[addition!.kind];
    section.append(palette, el("p", "compose-type-help", typeHelp));
    const parent = el("select"); parent.ariaLabel = "Add inside";
    for (const n of ordered().filter(n => containers.has(n.kind))) {
      parent.add(new Option(parentPath(n.id), n.id));
    }
    parent.value = addition!.parent;
    parent.onchange = () => {
      addition!.parent = parent.value; clearFormError(); renderCard(); renderCanvas(); syncSelection();
      card.querySelector<HTMLElement>('[aria-label="Add inside"]')?.focus();
    };
    section.append(labelled("Add inside", parent));
    const last = children(addition!.parent).at(-1);
    const destination = nodes.find(n => n.id === addition!.parent)!;
    const occupied = destination.kind === "frame" && !!last;
    const position = el("p", "compose-insertion", occupied
      ? "This frame already has a child. Choose its inner group to add another element."
      : last ? `At the end, after ${label(last)}.` : "First element in this container.");
    position.dataset.invalid = String(occupied); section.append(position);
    if (["text", "textbutton"].includes(addition!.kind)) {
      const text = el("textarea"); text.value = addition!.text; text.ariaLabel = "New element text";
      text.placeholder = addition!.kind === "textbutton" ? "Button label" : "Write the text to display";
      text.oninput = () => { addition!.text = text.value; clearFormError(); renderCanvas(); };
      section.append(labelled(addition!.kind === "textbutton" ? "Button label" : "Text", text));
    }
    const actions = el("div", "compose-actions compose-add-actions");
    actions.append(action(`Add ${addition!.kind === "textbutton" ? "button" : names[addition!.kind].toLowerCase()}`, add, true), action("Cancel", cancelAddition));
    section.append(actions, el("p", "compose-key-help", "Ctrl / ⌘ + Enter to add · Esc to cancel"));
    return section;
  }
  function removalRefusal(id: string) {
    const n = nodes.find(item => item.id === id)!;
    if (!n.parent) return "The Help screen itself cannot be removed here.";
    if (ordered(id).some(item => item.kind === "custom")) return n.kind === "custom"
      ? "Custom footer is source-only. Visual removal cannot change it."
      : `${displayName(n)} contains Custom footer, which is source-only. Remove its editable children individually or inspect the source.`;
    return "";
  }
  function requestRemoval() {
    clearFormError();
    if (drafts.size || addition) { message("Apply or cancel unfinished edits before removing elements. Your input is retained.", true); return; }
    const refusal = removalRefusal(selected);
    if (refusal) { message(current().parent ? "Nothing removed. Custom footer is source-only." : "Nothing removed. Keep the Help screen root.", true); return; }
    if (!guardWrite()) return;
    if (children(selected).length) {
      removal = selected; renderSelectionDetails(); renderCanvas(); syncSelection();
      card.querySelector<HTMLElement>('[data-cancel-removal]')?.focus();
    } else removeElement(selected);
  }
  function cancelRemoval() {
    removal = undefined; renderSelectionDetails(); renderCanvas(); syncSelection(); focusRow();
    message("Removal cancelled. Nothing changed.");
  }
  function removeElement(id: string) {
    if (drafts.size || addition) { message("Apply or cancel unfinished edits before removing elements. Your input is retained.", true); return; }
    const refusal = removalRefusal(id);
    if (refusal) { message(refusal, true); return; }
    if (!guardWrite()) return;
    const item = nodes.find(n => n.id === id)!;
    const subtree = ordered(id), siblings = children(item.parent), index = siblings.indexOf(item);
    const fallback = siblings[index + 1]?.id ?? siblings[index - 1]?.id ?? item.parent;
    const description = subtree.length > 1 ? `${displayName(item)} and ${subtree.length - 1} ${subtree.length === 2 ? "child" : "children"}` : label(item);
    remember(true);
    const removedIds = new Set(subtree.map(n => n.id)); nodes = nodes.filter(n => !removedIds.has(n.id));
    selected = fallback; removal = undefined; removedNotice = `Removed ${description}.`;
    render(); focusRow(); message(`${removedNotice} Undo restores ${subtree.length > 1 ? "them" : "it"}.`);
  }
  function removalReview() {
    const group = nodes.find(n => n.id === removal)!;
    const descendants = ordered(group.id).slice(1);
    const review = el("section", "workflow-removal-review"); review.ariaLabel = "Review group removal";
    review.append(el("h3", "", `Remove ${displayName(group)}?`), el("p", "", `This also removes ${descendants.length} ${descendants.length === 1 ? "child" : "children"}:`));
    const list = el("ul", "workflow-removal-list");
    for (const n of descendants) { const entry = el("li", "", label(n)); entry.style.marginLeft = `${(depth(n) - depth(group) - 1) * 12}px`; list.append(entry); }
    const actions = el("div", "compose-actions");
    const cancel = action("Keep group", cancelRemoval); cancel.dataset.cancelRemoval = "true";
    const confirm = action(`Remove group and ${descendants.length} ${descendants.length === 1 ? "child" : "children"}`, () => removeElement(group.id));
    confirm.classList.add("workflow-destructive");
    actions.append(cancel, confirm);
    review.append(list, el("p", "", "Undo restores the group and its children."), actions);
    review.onkeydown = event => { if (event.key === "Escape") { event.preventDefault(); cancelRemoval(); } };
    return review;
  }
  function renderSelectionDetails() {
    card.querySelector(".compose-selected-details")?.remove();
    if (step !== "choose" || addition) return;
    const details = el("section", "compose-selected-details"), n = current();
    details.ariaLabel = "Selected element";
    const siblings = children(n.parent), index = siblings.indexOf(n);
    details.append(el("strong", "", `${["text", "textbutton"].includes(n.kind) ? names[n.kind] : displayName(n)} · Nesting level ${depth(n)}`));
    if (n.parent) details.append(el("p", "workflow-position", `${names[nodes.find(p => p.id === n.parent)!.kind]} · ${index + 1} of ${siblings.length}`));
    const actions = el("div", "compose-actions");
    if (["text", "textbutton"].includes(n.kind)) actions.append(action(drafts.has(n.id) ? "Resume edit" : "Edit text", () => choose(n.id, true), true));
    else if (n.kind === "custom") actions.append(action("View in Source", openSource));
    else actions.append(action("Add inside", () => beginAddition(n.id), true));
    if (n.parent && n.kind !== "custom") {
      const vertical = nodes.find(p => p.id === n.parent)?.kind === "vbox";
      for (const [offset, name] of [[-1, vertical ? "Move up" : "Move earlier"], [1, vertical ? "Move down" : "Move later"]] as const) {
        const target = siblings[index + offset];
        const button = action(name, () => moveBy(offset));
        button.disabled = !target;
        button.title = target ? moveRefusal(n.id, target.id) || `${name} within ${names[nodes.find(p => p.id === n.parent)!.kind]}` : "Already at the end of this group";
        actions.append(button);
      }
    }
    details.append(actions);
    const refusal = removalRefusal(n.id);
    if (removal === n.id) details.append(removalReview());
    else if (refusal) {
      details.append(el("p", "workflow-removal-limit", refusal));
      if (n.kind !== "custom" && n.parent) details.append(action("View protected source", openSource));
    } else {
      const remove = action("Remove element", requestRemoval); remove.classList.add("workflow-remove-command");
      details.append(remove);
    }
    if (n.kind === "custom") details.append(el("p", "workflow-protection", "Source-only element. Select it to inspect it; visual edits cannot change it or move other elements across it."));
    else {
      const help = el("details", "workflow-help"); help.append(el("summary", "", "Type and order help"));
      help.append(el("p", "", descriptions[n.kind]), el("p", "", "In a vertical group, order runs top to bottom. In a free layout, later siblings appear in front. Groups move with their children. Reordering keeps the same parent."));
      details.append(help);
    }
    card.querySelector(".compose-tree")?.after(details);
  }
  function renderTree() {
    const tree = el("div", "compose-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
    const all = ordered();
    for (const n of all) {
      const row = action("", () => choose(n.id)); row.role = "treeitem"; row.dataset.row = n.id; row.ariaLabel = label(n);
      row.append(elementIcon(n.kind), el("span", "workflow-row-label", displayName(n)));
      if (n.kind === "custom") row.append(el("span", "workflow-row-note", "Source only"));
      if (drafts.has(n.id)) row.append(el("span", "workflow-row-note", "Draft"));
      row.ariaLevel = String(depth(n) + 1); row.style.paddingLeft = `${6 + depth(n) * 12}px`;
      row.title = `${label(n)}. ${descriptions[n.kind]} Nesting level ${depth(n)}.`;
      row.onmouseenter = () => hover(n.id); row.onmouseleave = () => hover();
      row.ondblclick = () => choose(n.id, true);
      row.onkeydown = event => {
        if (event.key === "Delete" || event.key === "Backspace") {
          event.preventDefault();
          if (event.repeat) return;
          if (selected !== n.id) choose(n.id);
          requestRemoval();
        }
        if (event.key === "Escape" && removal) { event.preventDefault(); cancelRemoval(); }
        if (event.key === "Enter") { event.preventDefault(); choose(n.id, true); }
        if (event.key === "ArrowLeft" && n.parent) { event.preventDefault(); choose(n.parent); focusRow(); }
        if (event.key === "ArrowRight" && children(n.id).length) { event.preventDefault(); choose(children(n.id)[0]!.id); focusRow(); }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          if (event.altKey) { selected = n.id; moveBy(event.key === "ArrowDown" ? 1 : -1); }
          else choose(all[Math.max(0, Math.min(all.length - 1, all.indexOf(n) + (event.key === "ArrowDown" ? 1 : -1)))]!.id);
          focusRow();
        }
      };
      row.draggable = !!n.parent && n.kind !== "custom";
      row.ondragstart = event => {
        dragging = n.id; selected = n.id; renderSelectionDetails(); syncSelection();
        event.dataTransfer!.setData("text/plain", n.id); event.dataTransfer!.effectAllowed = "move";
      };
      row.ondragover = event => {
        if (!dragging) return;
        event.preventDefault(); const refusal = moveRefusal(dragging, n.id);
        const after = event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2;
        tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(item => delete item.dataset.drop);
        row.dataset.drop = refusal ? "blocked" : after ? "after" : "before";
        event.dataTransfer!.dropEffect = refusal ? "none" : "move";
        message(refusal || `Drop ${after ? "after" : "before"} ${label(n)} in ${names[nodes.find(p => p.id === n.parent)!.kind]}.`, !!refusal);
      };
      row.ondragleave = () => { delete row.dataset.drop; };
      row.ondrop = event => {
        event.preventDefault(); const from = dragging; dragging = undefined;
        tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(item => delete item.dataset.drop);
        if (from) move(from, n.id, event.clientY > row.getBoundingClientRect().top + row.offsetHeight / 2);
      };
      row.ondragend = () => {
        if (dragging) message("Move cancelled. Order is unchanged.");
        dragging = undefined; tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(item => delete item.dataset.drop);
      };
      tree.append(row);
    }
    card.append(tree); renderSelectionDetails();
  }
  function applyText() {
    const n = current(), value = drafts.get(n.id);
    if (value === undefined || value === n.text) return;
    if (!value.trim()) { message("Enter text before applying. Your input is retained.", true); return; }
    if (!guardWrite()) return;
    remember(); n.text = value; drafts.delete(n.id); clearFormError(); render();
    card.querySelector<HTMLElement>("textarea")?.focus(); message("Text applied. Undo restores the previous text.");
  }
  function cancelText() {
    drafts.delete(selected); clearFormError(); render();
    card.querySelector<HTMLElement>("textarea")?.focus(); message("Text restored. Nothing applied.");
  }
  function pendingNotice() {
    const pending = el("div", "workflow-pending-list");
    for (const [id] of drafts) {
      if (step === "design" && id === selected) continue;
      const n = nodes.find(item => item.id === id)!;
      pending.append(action(`Resume draft: ${n.text || names[n.kind]}`, () => choose(id, true)));
    }
    if (addition && step !== "choose") pending.append(action("Resume unfinished addition", () => { step = "choose"; renderCard(); syncSelection(); }));
    return pending;
  }
  function renderCard() {
    const scroll = card.scrollTop;
    card.replaceChildren();
    if (removedNotice) {
      const notice = el("div", "workflow-removal-result"); notice.role = "status";
      notice.append(el("span", "", removedNotice), action("Undo removal", () => travel(history, future)));
      card.append(notice);
    }
    const heading = el("div", "workflow-panel-heading");
    if (step === "choose") {
      heading.append(el("h2", "", addition ? "Add an element" : "Elements"));
      if (!addition) heading.append(action("Add element", () => beginAddition(), true));
      card.append(heading, pendingNotice());
      if (addition) card.append(renderAddition());
      else {
        renderTree();
        card.append(el("p", "compose-key-help", "Arrows select · Enter edits · Alt + ↑ / ↓ reorders · Delete removes"));
      }
    } else if (step === "design") {
      const n = current();
      heading.append(el("h2", "", ["text", "textbutton"].includes(n.kind) ? n.kind === "text" ? "Edit text" : "Edit button label" : names[n.kind]));
      card.append(heading, el("p", "workflow-edit-location", `${parentPath(n.parent || n.id)} · Nesting level ${depth(n)}`), pendingNotice());
      if (["text", "textbutton"].includes(n.kind)) {
        const text = el("textarea"); text.ariaLabel = n.kind === "textbutton" ? "Button label" : "Text"; text.value = drafts.get(n.id) ?? n.text;
        const dirty = el("p", "workflow-draft-state"); dirty.role = "status";
        const apply = action("Apply changes", applyText, true), cancel = action("Cancel changes", cancelText);
        const update = () => {
          const changed = drafts.has(n.id); apply.disabled = cancel.disabled = !changed;
          dirty.textContent = changed ? "Unapplied changes. The canvas shows your draft." : "No unapplied changes.";
        };
        text.oninput = () => {
          if (text.value === n.text) drafts.delete(n.id); else drafts.set(n.id, text.value);
          clearFormError(); renderCanvas(); syncSelection(); update();
        };
        text.onkeydown = event => {
          if (event.key === "Escape") { event.preventDefault(); cancelText(); }
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); applyText(); }
        };
        const actions = el("div", "compose-actions workflow-edit-actions"); actions.append(apply, cancel);
        card.append(labelled(n.kind === "textbutton" ? "Button label" : "Text", text), dirty, actions);
        if (n.kind === "textbutton") card.append(el("p", "", n.id === "close" ? "Its Close action stays unchanged when you edit the label." : "This button has no action yet."));
        card.append(el("p", "compose-key-help", "Ctrl / ⌘ + Enter applies · Esc restores saved text")); update();
      } else {
        card.append(el("p", "", descriptions[n.kind]));
        card.append(n.kind === "custom" ? action("View in Source", openSource) : action("Add inside this group", () => beginAddition(n.id), true));
      }
      card.append(action("Back to elements", () => { step = "choose"; clearFormError(); renderCard(); syncSelection(); focusRow(); }));
    } else {
      heading.append(el("h2", "", "Connect")); card.append(heading, pendingNotice(), el("strong", "", label(current())));
      card.append(el("p", "", current().kind === "textbutton" ? current().id === "close" ? "This button closes Help. Editing its label preserves that action." : "This new button has no action." : "This element has no button action."));
      card.append(action("View in Source", openSource), el("p", "", "Action editing is outside this composition prototype."));
    }
    const feedback = el("p", "workflow-feedback", formError); feedback.role = "alert"; feedback.hidden = !formError;
    card.append(feedback);
    if (conflict) card.append(action("Review source conflict", openSource));
    card.scrollTop = scroll;
  }
  function renderCanvas() {
    drawing.replaceChildren();
    const parent = addition && nodes.find(n => n.id === addition!.parent);
    const previewable = addition && parent && !(parent.kind === "frame" && children(parent.id).length)
      && (!["text", "textbutton"].includes(addition.kind) || !!addition.text.trim());

    function draw(n: Item): HTMLElement {
      const item = el("div", `compose-art compose-art-${n.kind}`); item.dataset.pick = n.id; item.dataset.selected = String(n.id === selected);
      if (drafts.has(n.id)) item.dataset.draft = "true";
      if (n.id === "title") item.dataset.heading = "true";
      if (removal && ordered(removal).some(target => target.id === n.id)) item.dataset.removal = "true";
      const pick = action(names[n.kind], () => choose(n.id));
      pick.ondblclick = () => choose(n.id, true);
      pick.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); choose(n.id, true); } }; pick.className = "compose-hit"; pick.ariaLabel = `Select ${label(n)}`;
      item.append(pick);
      if (["text", "textbutton"].includes(n.kind)) item.append(el("span", "", drafts.get(n.id) ?? n.text));
      if (n.kind === "custom") item.append(el("span", "", "Custom footer · Source only"));
      for (const child of children(n.id)) item.append(draw(child));
      if (previewable && addition!.parent === n.id) {
        const pending = el("div", `compose-art compose-art-${addition!.kind} compose-pending`);
        pending.ariaLabel = "Pending element preview";
        pending.append(el("span", "", ["text", "textbutton"].includes(addition!.kind) ? addition!.text : names[addition!.kind]));
        item.append(pending);
      }
      return item;
    }
    drawing.append(draw(nodes[0]!));
  }
  function renderSource() {
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
  if (context.state === "adding") addition = { kind: "text", parent: "content", text: "Press Escape to open the menu." };
  if (conflict) { step = "design"; drafts.set("body", "Click to advance. Scroll back to read earlier lines."); }
  render();
  message(conflict ? "Source conflict sample. Apply, Add, reorder and removal retain input and refuse writes." : "Select a row or canvas item. Add elements and change their order in Choose.");
};
