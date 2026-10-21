// Three disposable Screens layouts share fictional editing actions and keep state in memory.
import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { prototypeSwitcher } from "../../prototype-switcher.ts";
import { variants } from "./definition.ts";
import { elementHelp, elementIcon } from "./elements.ts";
import { directLayout, flowLayout } from "./layouts.ts";
import { bottomRight, resized, resizeEdges, type ResizeEdge } from "./resize.ts";
import { fixture, help, kinds, node, variables, type Screen, type ScreenNode, type Action } from "./fixture.ts";
import "./screens.css";
import "./notebook.css";
import "./alternatives.css";

type Layout = "guided-v2" | "direct" | "flow";
const copy = <T>(value: T): T => structuredClone(value);
function select(options: readonly (readonly [string, string])[], value: string) {
  const input = el("select"); options.forEach(([id, title]) => input.add(new Option(title, id))); input.value = value; return input;
}
const pairs = (items: readonly string[]) => items.map(item => [item, item] as const);
const kindNames: Record<string, string> = { fixed: "Free layout group", frame: "Panel", window: "Window", vbox: "Vertical group", hbox: "Horizontal group", grid: "Grid", text: "Text", image: "Image", textbutton: "Button", imagebutton: "Image button", bar: "Value bar", viewport: "Scrolling area", component: "Reusable group" };
const kindName = (kind: string) => kindNames[kind] ?? kind;
const valueTypes: Record<string, string> = { bool: "Yes/no", int: "Whole number", string: "Text" };
const valueType = (kind: string) => valueTypes[kind] ?? kind;

export function mountScreenDemo(host: HTMLElement, context: LabContext, layout: Layout) {
  let screens = fixture(context.state);
  let screenId = context.state === "template" ? "template-0" : context.state === "dialog" ? "help-dialog" : screens[0]!.id;
  let selected = context.state === "template" ? "frame" : "title";
  const drafts = new Map<string, ScreenNode>();
  let conflict = context.state === "conflict", gesture: { node: ScreenNode; children: ScreenNode[]; startX: number; startY: number; dx: number; dy: number; resize?: ResizeEdge } | undefined;
  let skipCanvasClick = false;
  let listDrag: { id: string; parent: string } | undefined;
  let lastPreview = "Game testing has not been requested.", previewRevision = 0, previewScreenId = "", sampleAppearance = "normal", zoom = "Fit", aspect = "1280 × 720", step = "compose";
  let storyVisible = false, storyWaiting = false, continuations = 0, output = "The last tram is waiting.", sequence = 0;
  let storyExpanded = false, samplesExpanded = false;
  let canvasObserver: ResizeObserver | undefined;
  let notebookWidth = 300, previewHeight = Math.max(420, Math.min(640, innerHeight - 250)), focusPreview = false;
  let viewDrag: { x: number; y: number; width: number; height: number; kind: string } | undefined;
  let closeHelp: (() => void) | undefined;
  let helpSequence = 0;
  const sample = { help_seen: "false", courage: "35", destination: "The harbour" };
  const history: Screen[][] = [], future: Screen[][] = [];
  const current = () => screens.find(s => s.id === screenId)!;
  const target = () => current().nodes.find(n => n.id === selected);
  const layoutParent = (n: ScreenNode) => current().nodes.find(parent => parent.id === n.parent && ["vbox", "hbox", "grid"].includes(parent.kind));
  const key = () => `${screenId}:${selected}`;
  const draft = () => { if (!target()) return undefined; if (!drafts.has(key())) drafts.set(key(), copy(target()!)); return drafts.get(key())!; };
  const changed = () => !!target() && !!drafts.get(key()) && JSON.stringify(target()) !== JSON.stringify(drafts.get(key()));
  const anyDirty = () => [...drafts].some(([id, value]) => {
    const [sid, nid] = id.split(":"); const saved = screens.find(s => s.id === sid)?.nodes.find(n => n.id === nid);
    return saved && JSON.stringify(saved) !== JSON.stringify(value);
  });
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "Build and arrange your game screens", dirty: () => anyDirty() || history.length > 0 });
  frame.shell.classList.add("sc-shell", "sc-guided", "nb-shell");
  frame.shell.querySelector(".lp-fiction")!.textContent = "Design demo · Changes reset when you reload";
  frame.shell.querySelector(".lp-sample")!.textContent = "Design demo";
  const nav = frame.shell.querySelector('nav[aria-label="Project navigation"]')!;
  const navItem = action("Screens", () => {}); navItem.className = "tree-item selected"; navItem.ariaCurrent = "page"; navItem.title = "Screens"; navItem.prepend(icon("panel")); nav.insertBefore(navItem, nav.lastElementChild);
  const status = (message: string, error = false) => { frame.status.textContent = message; frame.status.role = error ? "alert" : "status"; };
  const undo = action("Undo", () => { if (anyDirty()) { status("Apply or cancel your changes before undoing.", true); return; } if (history.length) { future.push(copy(screens)); screens = history.pop()!; drafts.clear(); render(); status("Change undone."); } });
  const redo = action("Redo", () => { if (anyDirty()) { status("Apply or cancel your changes before redoing.", true); return; } if (future.length) { history.push(copy(screens)); screens = future.pop()!; drafts.clear(); render(); status("Change restored."); } });
  frame.tools.append(action("New screen", newScreen, true), undo, redo, action("Test in Ren'Py", () => {
    previewRevision = current().revision; previewScreenId = screenId; lastPreview = "This mockup does not open Ren'Py. Use Test opening and closing under Connect to check the example screen."; renderInfo(); status(lastPreview);
  }));
  const screenbar = el("div", "sc-screenbar");
  const picker = select(screens.map(s => [s.id, s.name]), screenId); picker.ariaLabel = "Screen";
  picker.onchange = () => {
    screenId = picker.value; selected = "title"; storyVisible = false; storyWaiting = false;
    output = "Choose Show or Open dialog to try this screen in the story.";
    render(); status("Screen selected. Your unfinished changes are kept.");
  };
  const mode = select([["panel", "Overlay · story keeps going"], ["blocking", "Dialog · story pauses"]], current().mode); mode.ariaLabel = "Screen behavior";
  mode.onchange = () => {
    if (current().template) return;
    if (anyDirty()) { mode.value = current().mode; status("Apply or cancel your changes before changing how this screen opens.", true); return; }
    saveHistory(); current().mode = mode.value as Screen["mode"];
    current().nodes.forEach(n => n.actions.forEach(a => { if (a.kind === "hide" || a.kind === "finish") a.kind = current().mode === "panel" ? "hide" : "finish"; }));
    storyVisible = false; storyWaiting = false; output = "Try opening this screen with its new setting.";
    current().revision++; drafts.clear(); render(); status("Screen behavior updated. Its Close button uses the matching action.");
  };
  const behaviorField = labelled("Screen behavior", mode); behaviorField.querySelector(".lp-label")!.append(helpTip("screen behavior", "An overlay stays on screen while the story continues. A dialog pauses the story until the player closes it. Close and Escape dismiss both; clicking outside leaves them open."));
  screenbar.append(labelled("Screen", picker), behaviorField);
  const workspace = el("div", "sc-workspace");
  const hierarchy = el("section", "sc-hierarchy"), stage = el("section", "sc-stage"), inspector = el("section", "sc-inspector");
  hierarchy.ariaLabel = "Screen hierarchy"; stage.ariaLabel = "Screen canvas"; inspector.ariaLabel = "Selected properties";
  const tabs = el("nav", "sc-steps"); tabs.ariaLabel = "Notebook sections";
  for (const [id, title] of [["compose", "Elements"], ["layout", "Position & look"], ["behavior", "Buttons & story"]]) tabs.append(action(title!, () => { step = id!; render(); }));
  workspace.classList.add("nb-workspace"); stage.classList.add("nb-stage");
  const notebook = el("div", "sc-notebook nb-notebook"), playground = el("section", "nb-playground"); notebook.append(tabs, hierarchy, inspector, playground);
  const divider = resizeHandle("Resize preview width", "width");
  workspace.append(notebook, divider, stage);
  const info = el("div", "sc-info"); frame.content.append(screenbar, workspace, info);
  const parts = { workspace, notebook, hierarchy, stage, inspector, playground, tabs, divider, step: (id: string) => { step = id; render(); } };
  const view = layout === "direct" ? directLayout(parts) : layout === "flow" ? flowLayout(parts) : undefined;
  frame.shell.dataset.layout = layout;
  const cleanupSwitcher = prototypeSwitcher(frame.shell, variants, layout, () => anyDirty() || history.length > 0);
  previewHeight = Math.max(300, Math.min(640, frame.content.clientHeight - screenbar.offsetHeight - 10));

  function explain(control: HTMLElement, message: string | (() => string)) {
    const id = `notebook-help-${++helpSequence}`;
    const show = () => {
      if (listDrag) return;
      closeHelp?.();
      const tip = el("div", "nb-tooltip", typeof message === "function" ? message() : message); tip.id = id; tip.role = "tooltip"; frame.shell.append(tip);
      control.setAttribute("aria-describedby", id);
      const box = control.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, box.left))}px`;
      tip.style.top = `${Math.max(8, Math.min(innerHeight - tip.offsetHeight - 8, box.bottom + 7))}px`;
      closeHelp = () => { tip.remove(); control.removeAttribute("aria-describedby"); closeHelp = undefined; };
    };
    control.onmouseenter = show; control.onfocus = show;
    control.onmouseleave = () => { if (document.activeElement !== control) closeHelp?.(); };
    control.onblur = () => closeHelp?.();
    return show;
  }
  function helpTip(title: string, message: string | (() => string)) {
    const button = el("button", "nb-help", "?"); button.type = "button"; button.ariaLabel = `Help with ${title}`;
    const show = explain(button, message);
    button.onclick = event => { event.preventDefault(); event.stopPropagation(); show(); };
    return button;
  }
  function setViewSize() {
    workspace.style.setProperty("--nb-width", `${notebookWidth}px`);
    workspace.style.setProperty("--nb-height", `${previewHeight}px`);
    workspace.classList.toggle("nb-focused", focusPreview); notebook.inert = focusPreview;
    frame.shell.classList.toggle("nb-preview-only", focusPreview);
    workspace.style.setProperty("--nb-focus-height", `${frame.content.clientHeight}px`);
  }
  function resizeHandle(title: string, kind: "width" | "height" | "corner") {
    const handle = el("button", `nb-resize nb-resize-${kind}`); handle.type = "button";
    handle.ariaLabel = title; handle.title = kind === "width" ? "Drag toward the editing panel for a wider preview. Left and right arrow keys also work." : kind === "corner" ? "Drag right and down for a larger preview. Arrow keys also work." : "Drag down for a taller preview. Up and down arrow keys also work.";
    handle.role = "separator"; handle.tabIndex = 0; handle.setAttribute("aria-orientation", kind === "width" ? "vertical" : "horizontal");
    handle.onpointerdown = event => {
      if (event.button !== 0) return;
      closeHelp?.(); viewDrag = { x: event.clientX, y: event.clientY, width: notebookWidth, height: previewHeight, kind };
      handle.setPointerCapture(event.pointerId); event.preventDefault();
    };
    handle.onpointermove = event => {
      if (!viewDrag) return;
      const maximum = Math.max(240, workspace.clientWidth - 320);
      if (kind !== "height" && innerWidth >= 760) notebookWidth = Math.max(240, Math.min(maximum, viewDrag.width + (event.clientX - viewDrag.x) * (kind === "corner" || layout !== "guided-v2" ? -1 : 1)));
      if (kind !== "width") previewHeight = Math.max(innerWidth < 760 ? 200 : 300, Math.min(1200, viewDrag.height + event.clientY - viewDrag.y));
      setViewSize();
    };
    handle.onpointerup = () => { if (!viewDrag) return; viewDrag = undefined; status("Preview area resized. Your game size and element changes are kept."); };
    handle.onpointercancel = () => cancelViewResize();
    handle.onkeydown = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); const amount = event.shiftKey ? 40 : 10;
      if (kind !== "height" && innerWidth >= 760 && ["ArrowLeft", "ArrowRight"].includes(event.key)) notebookWidth = Math.max(240, Math.min(Math.max(240, workspace.clientWidth - 320), notebookWidth + (event.key === "ArrowLeft" ? -amount : amount) * (kind === "corner" || layout !== "guided-v2" ? -1 : 1)));
      if (kind !== "width" && ["ArrowUp", "ArrowDown"].includes(event.key)) previewHeight = Math.max(innerWidth < 760 ? 200 : 300, Math.min(1200, previewHeight + (event.key === "ArrowUp" ? -amount : amount)));
      setViewSize(); status("Preview area resized. Game size is unchanged.");
    };
    return handle;
  }
  function cancelViewResize() {
    if (!viewDrag) return;
    notebookWidth = viewDrag.width; previewHeight = viewDrag.height; viewDrag = undefined; setViewSize(); status("Preview resize cancelled.");
  }
  function orderedNodes(parent = ""): ScreenNode[] {
    return current().nodes.filter(n => n.parent === parent).flatMap(n => [n, ...orderedNodes(n.id)]);
  }
  function reorder(offset: number, id = selected) {
    const n = current().nodes.find(item => item.id === id)!, siblings = current().nodes.filter(other => other.parent === n.parent);
    const index = siblings.indexOf(n), other = siblings[index + offset]; if (!other) return;
    moveInList(n.id, other.id, offset > 0);
  }
  function moveInList(id: string, beside: string, after: boolean) {
    if (anyDirty()) { status("Apply or cancel your changes before changing the order.", true); return; }
    const n = current().nodes.find(item => item.id === id), other = current().nodes.find(item => item.id === beside);
    if (current().template || !n?.parent || n.id === other?.id || n.parent !== other?.parent) return;
    const siblings = current().nodes.filter(item => item.parent === n.parent), ordered = siblings.filter(item => item !== n);
    ordered.splice(ordered.indexOf(other) + Number(after), 0, n);
    if (ordered.every((item, index) => item === siblings[index])) { status("Order unchanged."); return; }
    const positionOpen = inspector.querySelector<HTMLDetailsElement>('[data-group="Position & size"]')?.open;
    saveHistory(); let index = 0;
    current().nodes = current().nodes.map(item => item.parent === n.parent ? ordered[index++]! : item);
    current().revision++; selected = n.id; render();
    if (positionOpen) inspector.querySelector<HTMLDetailsElement>('[data-group="Position & size"]')!.open = true;
    status(layoutParent(n) ? "Item order changed. This group arranges its items automatically." : "Element order changed. Later items appear in front.");
  }

  function saveHistory() {
    // Unchanged forms must not become stale drafts when a group or shared look changes.
    for (const [id, value] of drafts) {
      const [sid, nid] = id.split(":"), saved = screens.find(s => s.id === sid)?.nodes.find(n => n.id === nid);
      if (saved && JSON.stringify(saved) === JSON.stringify(value)) drafts.delete(id);
    }
    history.push(copy(screens)); future.length = 0;
  }
  function choose(id: string, browse = false, keepTree = false) { selected = id; if (!browse) { if (layout !== "guided-v2" && step !== "behavior") step = "layout"; view?.select(); } render(keepTree); }
  function dialog(title: string, text: string) {
    const d = el("dialog", "lp-dialog sc-dialog"); d.ariaLabel = title;
    d.append(el("h2", "", title), el("p", "", text)); d.onclose = () => d.remove(); frame.shell.append(d); return d;
  }
  function newScreen() {
    const d = dialog("New screen", "Start with a blank screen or a Help example. You can edit every item in the example.");
    const name = el("input"); name.value = "Station Help";
    const starter = select([["panel", "Help panel"], ["blocking", "Help dialog"], ["blank", "Blank screen"]], "panel");
    d.append(labelled("Screen name", name), labelled("Starter", starter), action("Cancel creation", () => d.close()), action("Create screen", () => {
      if (!name.value.trim()) { status("Enter a screen name.", true); return; }
      saveHistory(); const s = help(`custom-${++sequence}`, starter.value === "blocking" ? "blocking" : "panel"); s.name = name.value.trim();
      if (starter.value === "blank") s.nodes = s.nodes.slice(0, 1);
      screens.push(s); screenId = s.id; selected = s.nodes.at(-1)!.id; d.close(); render(); status("Screen created in this demo.");
    }, true)); d.showModal(); name.focus();
  }
  function render(keepTree = false) {
    closeHelp?.(); setViewSize();
    if (!current()) screenId = screens[0]!.id;
    if (!target()) selected = current().nodes[0]?.id ?? "root";
    picker.replaceChildren(...screens.map(s => new Option(s.name, s.id))); picker.value = screenId;
    mode.value = current().mode; mode.disabled = current().template;
    undo.disabled = !history.length; redo.disabled = !future.length;
    workspace.dataset.step = step;
    tabs.querySelectorAll("button").forEach((button, index) => button.ariaPressed = String(["compose", "layout", "behavior"][index] === step));
    renderTree(keepTree); renderCanvas(); renderInspector(); renderInfo();
    const n = target(); if (n) view?.update({ name: n.name, kind: kindName(n.kind), parent: current().nodes.find(p => p.id === n.parent)?.name ?? "", step, button: ["textbutton", "imagebutton"].includes(n.kind) });
  }
  function renderTree(keepRows = false) {
    const existingTree = keepRows ? hierarchy.querySelector<HTMLElement>(".sc-tree") : null;
    // Keep clicked rows mounted so the browser can deliver a double-click to that row.
    for (const child of [...hierarchy.children]) if (child !== existingTree) child.remove();
    const heading = el("h2", "nb-elements-heading", "Elements");
    heading.append(helpTip("elements", "Elements are the text, images, buttons and groups that make up a screen. Click a row to select it. Double-click or press Enter to open Design. Drag a row before or after another item in the same group to change its order. Later items appear in front. Groups keep their contents together.")); hierarchy.prepend(heading);
    if (context.state === "empty" && !screens.some(s => !s.template)) hierarchy.append(el("p", "muted", "Create your first screen with a Help example or a blank page."), action("Create first Help screen", newScreen, true));
    const tree = existingTree ?? el("div", "sc-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
    const elements = orderedNodes();
    const clearDrop = () => tree.querySelectorAll<HTMLElement>("[data-drop]").forEach(row => delete row.dataset.drop);
    const endDrag = () => { listDrag = undefined; clearDrop(); tree.querySelectorAll(".dragging").forEach(row => row.classList.remove("dragging")); };
    if (!existingTree) elements.forEach(n => {
      const b = action(`${n.name} · ${kindName(n.kind)}`, () => choose(n.id, true, true)); b.role = "treeitem"; b.ariaSelected = String(selected === n.id); b.dataset.nodeId = n.id;
      b.className = `sc-tree-node${selected === n.id ? " selected" : ""}`;
      b.ondblclick = () => { step = "layout"; choose(n.id); };
      b.draggable = !current().template && !!n.parent;
      b.ondragstart = e => {
        if (!b.draggable || anyDirty()) { e.preventDefault(); status("Apply or cancel your changes before changing the order.", true); return; }
        closeHelp?.(); listDrag = { id: n.id, parent: n.parent }; b.classList.add("dragging");
        e.dataTransfer!.effectAllowed = "move"; e.dataTransfer!.setData("text/plain", n.name);
        status("Drop before or after an item in the same group. Escape cancels.");
      };
      const dropPosition = (e: DragEvent) => {
        if (!listDrag || listDrag.id === n.id || listDrag.parent !== n.parent) return;
        return e.clientY >= b.getBoundingClientRect().top + b.offsetHeight / 2;
      };
      b.ondragover = e => {
        clearDrop(); const after = dropPosition(e);
        if (after === undefined) { if (e.dataTransfer) e.dataTransfer.dropEffect = "none"; return; }
        e.preventDefault(); e.dataTransfer!.dropEffect = "move";
        const marker = after ? orderedNodes(n.id).at(-1)?.id ?? n.id : n.id;
        tree.querySelector<HTMLElement>(`[data-node-id="${marker}"]`)!.dataset.drop = after ? "after" : "before";
      };
      b.ondragleave = e => { if (!(e.relatedTarget instanceof Node) || !b.contains(e.relatedTarget)) clearDrop(); };
      b.ondrop = e => {
        const after = dropPosition(e), source = listDrag?.id; e.preventDefault(); endDrag();
        if (source && after !== undefined) { moveInList(source, n.id, after); hierarchy.querySelector<HTMLElement>(`[data-node-id="${source}"]`)?.focus(); }
      };
      b.ondragend = () => { if (listDrag) { endDrag(); status("Order unchanged."); } };
      const name = el("span", "", b.textContent ?? ""); b.replaceChildren(elementIcon(n.kind), name);
      explain(b, `${kindName(n.kind)}. ${elementHelp[n.kind] ?? "An element on this screen."}`);
      let depth = 0, parent = n.parent;
      while (parent) { depth++; parent = current().nodes.find(item => item.id === parent)?.parent ?? ""; }
      b.style.paddingLeft = `${10 + depth * 12}px`; b.ariaLevel = String(depth + 1);
      b.onkeydown = e => {
        if (e.key === "Enter") { e.preventDefault(); step = "layout"; choose(n.id); return; }
        if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); reorder(e.key === "ArrowUp" ? -1 : 1, n.id); hierarchy.querySelector<HTMLElement>(`[data-node-id="${n.id}"]`)?.focus(); return; }
        const ordered = elements, index = ordered.findIndex(x => x.id === selected);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); choose(ordered[Math.max(0, Math.min(ordered.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))]!.id, true); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const next = e.key === "ArrowLeft" ? target()?.parent : current().nodes.find(n => n.parent === selected)?.id; if (next) choose(next, true); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
      }; tree.append(b);
    });
    tree.querySelectorAll<HTMLElement>("[data-node-id]").forEach(row => { row.classList.toggle("selected", row.dataset.nodeId === selected); row.ariaSelected = String(row.dataset.nodeId === selected); });
    if (!existingTree) hierarchy.append(tree);
    if (layout !== "flow") hierarchy.insertBefore(el("p", "muted sc-note", "Click to select. Double-click or press Enter to open Design. Drag rows to reorder within a group."), tree);
    if (current().template) hierarchy.insertBefore(el("p", "muted sc-note", "This template's element order is protected."), tree);
    const addKind = select(kinds.map(kind => [kind, kindName(kind)]), "text"); addKind.ariaLabel = "Element type";
    const add = action("Add element", () => {
      saveHistory(); const n = node(`node-${++sequence}`, addKind.value, `New ${kindName(addKind.value).toLowerCase()}`, 344, 360, 300, 48);
      n.parent = current().nodes.some(n => n.id === "stack") ? "stack" : "root"; n.shared = n.kind === "component";
      if (n.kind === "textbutton" || n.kind === "imagebutton") n.actions = [{ kind: current().mode === "panel" ? "hide" : "finish", variable: "help_seen", value: "true" }];
      current().nodes.push(n); current().revision++; selected = n.id; if (layout !== "guided-v2") { step = "layout"; view?.select(); } render(); status("Element added.");
    }); add.disabled = current().template;
    const addField = labelled("Add element type", addKind);
    addField.querySelector(".lp-label")!.append(helpTip("element type", () => `${kindName(addKind.value)}. ${elementHelp[addKind.value]}`));
    const addDescription = el("p", "muted nb-element-description", elementHelp[addKind.value]);
    addKind.onchange = () => { closeHelp?.(); addDescription.textContent = elementHelp[addKind.value]!; };
    hierarchy.append(addField, addDescription, add);
    const remove = action("Remove element", () => {
      if (current().nodes.some(n => n.parent === selected)) { status("Move or remove the items inside this group first.", true); return; }
      saveHistory(); current().nodes = current().nodes.filter(n => n.id !== selected); current().revision++; drafts.delete(key()); selected = current().nodes[0]!.id; render(); status("Element removed.");
    }); remove.disabled = current().template || !target()?.parent; hierarchy.append(remove);
    hierarchy.append(el("p", "muted sc-note", "Use arrow keys to browse the list. Alt + Up or Down changes the selected item's order."));
  }
  function renderDepth(parent: HTMLElement) {
    const heading = el("h3", "", "Depth");
    heading.append(helpTip("depth", "Depth controls which items cover others in the same group. Later items appear in front. Drag rows under Elements, or use Bring forward and Send backward. A group keeps all its contents together. Vertical, horizontal and grid groups use this order to arrange their items instead. This is separate from the order of whole screens."));
    parent.append(heading);
    const siblings = current().nodes.filter(n => n.parent === target()?.parent), index = siblings.findIndex(n => n.id === selected);
    parent.append(el("p", "nb-order-position", target()?.parent ? `Item ${index + 1} of ${siblings.length} in ${current().nodes.find(n => n.id === target()!.parent)?.name}. ${layoutParent(target()!) ? "This group arranges items in list order." : "Later items appear in front."}` : "The screen root contains every element. Its depth cannot change."));
    parent.append(el("p", "muted", "Order changes take effect immediately. Undo restores the previous order."));
    const moves = el("div", "sc-actions nb-order");
    for (const [offset, title] of [[-1, "Send backward"], [1, "Bring forward"]] as const) {
      const button = action(title, () => reorder(offset));
      button.disabled = current().template || !target()?.parent || index + offset < 0 || index + offset >= siblings.length; moves.append(button);
    }
    parent.append(moves);
  }
  function renderCanvas() {
    canvasObserver?.disconnect();
    // Read the live disclosure state before replacing controls; toggle events are asynchronous.
    const previousSamples = playground.querySelector<HTMLDetailsElement>(".sc-samples"), previousStory = playground.querySelector<HTMLDetailsElement>(".sc-story");
    if (previousSamples) samplesExpanded = previousSamples.open;
    if (previousStory) storyExpanded = previousStory.open;
    if (step === "behavior" && playground.dataset.step !== step) storyExpanded = true;
    playground.dataset.step = step;
    stage.replaceChildren(); playground.replaceChildren();
    const toolbar = el("div", "sc-canvas-toolbar"); toolbar.append(el("h2", "", "Game preview"));
    const ratio = select(pairs(["1280 × 720", "960 × 720"]), aspect); ratio.ariaLabel = "Game size"; ratio.onchange = () => { aspect = ratio.value; renderCanvas(); renderInfo(); };
    const zoomInput = select(pairs(["Fit", "75%", "100%"]), zoom); zoomInput.ariaLabel = "Zoom"; zoomInput.onchange = () => { zoom = zoomInput.value; renderCanvas(); renderInfo(); };
    const focus = action(focusPreview ? "Back to editing" : "Focus preview", () => { focusPreview = !focusPreview; setViewSize(); renderCanvas(); stage.querySelector<HTMLButtonElement>(".nb-focus-button")?.focus(); }); focus.classList.add("nb-focus-button"); focus.ariaPressed = String(focusPreview);
    toolbar.append(ratio, zoomInput, focus, helpTip("preview size", "Drag the divider toward the editing panel for a wider preview, or the bottom border for a taller preview. The corner changes both. Use arrow keys when a border is focused. Escape cancels a drag. Game size changes separately in its menu."), helpTip("moving elements", "Drag an element to move it. Drag its edge or corner handles to resize it, or hold Shift while dragging the element. Images keep their proportions when Keep image proportions is checked. Escape cancels. Movement snaps to 8 game pixels. Items in vertical, horizontal or grid groups use automatic placement; resize them with their handles, change their order, or move the group.")); stage.append(toolbar);
    const note = el("p", "sc-canvas-caption", "Click an element to edit it. Buttons in this preview do not run game actions."); stage.append(note);
    const scroll = el("div", "sc-canvas-scroll"), canvas = el("div", "sc-game"); canvas.ariaLabel = "Game preview";
    canvas.style.aspectRatio = aspect === "1280 × 720" ? "16 / 9" : "4 / 3";
    canvas.style.width = zoom === "Fit" ? "100%" : `${(aspect === "1280 × 720" ? 1280 : 960) * (zoom === "75%" ? .75 : 1)}px`;
    canvas.append(el("div", "sc-scenery", "THE LAST TRAM"), el("p", "sc-game-dialogue", "Ada  ·  The last tram leaves at midnight."));
    const width = aspect === "1280 × 720" ? 1280 : 960;
    const appearance = sampleAppearance;
    for (const n of orderedNodes().filter(n => !["root", "stack"].includes(n.id))) {
      const b = el("button", `sc-canvas-node sc-kind-${n.kind}${selected === n.id ? " selected" : ""}`); b.type = "button"; b.dataset.canvasId = n.id; b.ariaLabel = `Select ${n.name} on canvas`; b.ariaPressed = String(selected === n.id);
      const x = n.coordinates === "relative" ? Number(n.x) * width : Number(n.x), y = n.coordinates === "relative" ? Number(n.y) * 720 : Number(n.y);
      b.style.left = `${100 * x / width}%`; b.style.top = `${100 * y / 720}%`; b.style.width = `${100 * Number(n.width) / width}%`; b.style.height = `${100 * Number(n.height) / 720}%`;
      b.style.transform = `translate(${-100 * Number(n.anchorX)}%,${-100 * Number(n.anchorY)}%)`;
      b.style.color = n.color; b.style.fontWeight = n.bold ? "700" : "400"; b.style.fontStyle = n.italic ? "italic" : "normal"; b.style.textAlign = n.alignment as "left";
      if (n.kind === "text" || n.kind === "textbutton") b.style.fontSize = `${Number(n.size) * 100 / width}cqw`;
      if (["frame", "window", "textbutton", "imagebutton", "bar", "viewport", "component"].includes(n.kind)) { b.style.background = n.background; b.style.borderColor = n.border; }
      if (n.kind === "text" || n.kind === "textbutton") b.textContent = n.text.replaceAll("[destination]", sample.destination).replaceAll("[courage]", sample.courage).replaceAll("[help_seen]", sample.help_seen);
      else if (n.kind === "image" || n.kind === "imagebutton") { b.textContent = "Station  •••  Harbour"; b.classList.add("sc-map"); }
      else if (n.kind === "bar") { b.textContent = `${n.variable}  ${sample.courage} / ${n.maximum}`; b.style.background = `linear-gradient(90deg,var(--accent-primary) ${sample.courage}%,var(--surface-panel) ${sample.courage}%)`; }
      else if (!["frame", "fixed"].includes(n.kind)) b.textContent = n.name;
      b.dataset.appearance = ["textbutton", "imagebutton"].includes(n.kind) ? appearance : "normal";
      b.onclick = () => { if (!gesture && !skipCanvasClick) choose(n.id); };
      let selectionBox: HTMLElement | undefined;
      const paintSelection = (geometry: Pick<ScreenNode, "x" | "y" | "width" | "height">) => {
        if (!selectionBox) return;
        const px = Number(geometry.x) * (n.coordinates === "relative" ? width : 1), py = Number(geometry.y) * (n.coordinates === "relative" ? 720 : 1);
        selectionBox.style.left = `${100 * (px - Number(n.anchorX) * Number(geometry.width)) / width}%`;
        selectionBox.style.top = `${100 * (py - Number(n.anchorY) * Number(geometry.height)) / 720}%`;
        selectionBox.style.width = `${100 * Number(geometry.width) / width}%`; selectionBox.style.height = `${100 * Number(geometry.height) / 720}%`;
      };
      const beginGesture = (e: PointerEvent, edge?: ResizeEdge) => {
        if (e.button !== 0) return; skipCanvasClick = false; closeHelp?.();
        if (anyDirty()) { status("Apply or cancel your changes before dragging.", true); return; }
        const resize = edge ?? (e.shiftKey ? bottomRight : undefined), parent = layoutParent(n);
        if (parent && !resize) { status(`${parent.name} arranges its items automatically. Resize the item, move the group, or change its order under Position & size.`); return; }
        selected = n.id;
        canvas.querySelectorAll<HTMLButtonElement>("[data-canvas-id]").forEach(item => { item.classList.toggle("selected", item.dataset.canvasId === selected); item.ariaPressed = String(item.dataset.canvasId === selected); });
        if (!edge) canvas.querySelectorAll(".sc-selection-box").forEach(box => box.remove());
        gesture = { node: copy(n), children: copy(orderedNodes(n.id)), startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, resize };
        b.setPointerCapture(e.pointerId); e.preventDefault();
      };
      b.onpointerdown = e => beginGesture(e);
      b.onpointermove = e => {
        if (!gesture) return;
        const rect = canvas.getBoundingClientRect(); gesture.dx = Math.round((e.clientX - gesture.startX) * width / rect.width / 8) * 8; gesture.dy = Math.round((e.clientY - gesture.startY) * 720 / rect.height / 8) * 8;
        if (gesture.resize) {
          const geometry = resized(gesture.node, gesture.resize, gesture.dx, gesture.dy, width);
          b.style.left = `${100 * Number(geometry.x) * (n.coordinates === "relative" ? width : 1) / width}%`; b.style.top = `${100 * Number(geometry.y) * (n.coordinates === "relative" ? 720 : 1) / 720}%`;
          b.style.width = `${100 * Number(geometry.width) / width}%`; b.style.height = `${100 * Number(geometry.height) / 720}%`; paintSelection(geometry);
        }
        else { b.style.left = `${100 * (x + gesture.dx) / width}%`; b.style.top = `${100 * (y + gesture.dy) / 720}%`;
          for (const child of gesture.children) { const item = canvas.querySelector<HTMLElement>(`[data-canvas-id="${child.id}"]`); if (item) { item.style.left = `${100 * (Number(child.x) * (child.coordinates === "relative" ? width : 1) + gesture.dx) / width}%`; item.style.top = `${100 * (Number(child.y) * (child.coordinates === "relative" ? 720 : 1) + gesture.dy) / 720}%`; } }
        }
        status(gesture.resize ? "Release to keep this size. Escape cancels it." : "Release to keep the move. Escape cancels it.");
      };
      b.onpointerup = () => {
        if (!gesture) return; const g = gesture; gesture = undefined; skipCanvasClick = true;
        if (g.dx || g.dy) { saveHistory(); if (g.resize) { Object.assign(n, resized(g.node, g.resize, g.dx, g.dy, width)); } else {
          for (const original of [g.node, ...g.children]) { const item = current().nodes.find(item => item.id === original.id)!; item.x = String(Number(original.x) + g.dx / (original.coordinates === "relative" ? width : 1)); item.y = String(Number(original.y) + g.dy / (original.coordinates === "relative" ? 720 : 1)); }
        } current().revision++; drafts.delete(key()); choose(n.id); status(g.resize ? "Size changed. Undo restores the previous size." : "Element moved. Undo restores the previous position."); }
        else choose(n.id);
      };
      b.onpointercancel = () => { if (gesture) { gesture = undefined; render(); status("Move cancelled."); } };
      b.onkeydown = e => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault(); const parent = layoutParent(n); if (parent) { status(`This ${kindName(parent.kind).toLowerCase()} places its items automatically. Change their order or the group spacing.`); return; }
        if (selected !== n.id) choose(n.id);
        const d = draft()!; const coordinate = e.key === "ArrowLeft" || e.key === "ArrowRight" ? "x" : "y"; d[coordinate] = String(Number(d[coordinate]) + ((e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1) * (e.shiftKey ? 8 : 1) / (d.coordinates === "relative" ? (coordinate === "x" ? width : 720) : 1)); renderInspector(); renderInfo(); status("Position changed. Choose Apply changes to keep it or Cancel changes to restore it.");
      }; canvas.append(b);
      if (selected === n.id) {
        selectionBox = el("div", "sc-selection-box"); paintSelection(n);
        for (const edge of resizeEdges) {
          const handle = el("button", `sc-element-resize sc-element-resize-${edge.id}`); handle.type = "button"; handle.ariaLabel = `Resize ${n.name} ${edge.label}`;
          handle.title = "Drag to resize. Arrow keys make small changes. Shift uses larger changes. Escape cancels a drag.";
          handle.onpointerdown = e => { e.stopPropagation(); beginGesture(e, edge); };
          handle.onclick = e => { e.preventDefault(); e.stopPropagation(); };
          handle.onkeydown = e => {
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
            e.preventDefault(); if (anyDirty()) { status("Apply or cancel your changes before resizing.", true); return; }
            const amount = e.shiftKey ? 8 : 1, dx = e.key === "ArrowLeft" ? -amount : e.key === "ArrowRight" ? amount : 0, dy = e.key === "ArrowUp" ? -amount : e.key === "ArrowDown" ? amount : 0;
            const geometry = resized(n, edge, dx, dy, width);
            if (geometry.width === n.width && geometry.height === n.height) return;
            saveHistory(); Object.assign(n, geometry); current().revision++; render(); stage.querySelector<HTMLButtonElement>(`.sc-element-resize-${edge.id}`)?.focus(); status("Size changed. Undo restores the previous size.");
          };
          selectionBox.append(handle);
        }
        canvas.append(selectionBox);
      }
    }
    const canvasHelp = el("p", "muted sc-note", target() && layoutParent(target()!) ? "This group places its items automatically. Drag handles to resize; change item order to move." : "Drag an element to move it. Drag its handles to resize. Escape cancels.");
    scroll.append(canvas); stage.append(scroll, canvasHelp);
    const sampleControls = el("details", "sc-samples"), valuesHeading = el("summary", "", "Change preview values");
    valuesHeading.append(helpTip("preview values", "Game variables can change the words and numbers shown on a screen. Enter example values here to check the layout. Button appearance lets you see a button normally, under the pointer, selected or unavailable. These settings affect only the preview."));
    sampleControls.append(valuesHeading, el("p", "muted", "Change the example values shown in text and bars, or check how buttons look under the pointer."));
    sampleControls.open = samplesExpanded; sampleControls.ontoggle = () => { if (sampleControls.isConnected) samplesExpanded = sampleControls.open; };
    const appearanceInput = select([["normal", "Normal"], ["hover", "Pointer over button"], ["selected", "Selected"], ["disabled", "Unavailable"]], sampleAppearance); appearanceInput.ariaLabel = "Button appearance"; appearanceInput.onchange = () => { sampleAppearance = appearanceInput.value; renderCanvas(); renderInfo(); };
    sampleControls.append(labelled("Button appearance", appearanceInput));
    variables.forEach(v => { const input = v.type === "bool" ? select([["false", "No"], ["true", "Yes"]], sample[v.id as keyof typeof sample]) : el("input"); input.value = sample[v.id as keyof typeof sample]; input.ariaLabel = `Example value for ${v.id}`; input.onchange = () => { if (v.type === "int" && !/^-?\d+$/.test(input.value)) { status("Enter a whole number for this example value.", true); return; } sample[v.id as keyof typeof sample] = input.value; renderCanvas(); renderInfo(); }; sampleControls.append(labelled(`${v.id} (${valueType(v.type)})`, input)); });
    sampleControls.append(el("p", "muted", "These example values affect this preview only. Your game keeps its own values.")); playground.append(sampleControls);
    const journey = el("details", "sc-story"); journey.open = storyExpanded; journey.ontoggle = () => { if (journey.isConnected) storyExpanded = journey.open; };
    const journeyHeading = el("summary", "", "Test opening and closing"); journeyHeading.append(helpTip("screen test", "Open this screen, then continue the example dialogue. An overlay lets dialogue continue while it stays visible. A dialog waits until Close or Escape. Clicking outside leaves either screen open. This test checks those rules without launching Ren'Py."));
    journey.append(journeyHeading, el("p", "muted", current().mode === "panel" ? "Show the overlay, then continue the example dialogue. The overlay stays open as the story continues." : "Open the dialog, then continue the example dialogue. The story waits until you close the dialog."));
    const storyButtons = el("div", "sc-actions");
    storyButtons.append(action("Show overlay", () => { if (current().mode === "blocking") { status("This screen pauses the story. Choose Open dialog.", true); return; } storyVisible = true; storyWaiting = false; output = "The overlay is open. You can continue the story."; renderCanvas(); }), action("Hide overlay", () => { if (current().mode === "blocking") { status("Use Close dialog to return to the story.", true); return; } storyVisible = false; output = "The overlay is closed."; renderCanvas(); }), action("Open dialog", () => { if (current().mode !== "blocking") { status("Choose Help dialog above to try a screen that pauses the story.", true); return; } storyVisible = true; storyWaiting = true; output = "The dialog is open. Close it to continue the story."; renderCanvas(); }), action("Continue dialogue", () => { output = storyWaiting ? "Close the dialog before continuing." : storyVisible ? "Ada keeps speaking. The overlay stays open." : "Ada continues speaking."; renderCanvas(); }));
    const dismiss = () => { if (!storyVisible) { output = "The screen is already closed."; renderCanvas(); return; } storyVisible = false; if (storyWaiting) { storyWaiting = false; continuations++; } output = `Screen closed. The story has continued ${continuations} ${continuations === 1 ? "time" : "times"}.`; renderCanvas(); };
    storyButtons.append(action(current().mode === "panel" ? "Close overlay" : "Close dialog", dismiss), action("Press Escape", dismiss), action("Click outside", () => { output = "Clicking outside leaves the screen open."; renderCanvas(); }));
    storyButtons.querySelectorAll("button").forEach(button => { button.hidden = current().mode === "blocking" ? ["Show overlay", "Hide overlay"].includes(button.textContent!) : button.textContent === "Open dialog"; });
    journey.append(storyButtons, el("p", "sc-story-status", output), el("p", "muted", "This test uses example dialogue. It does not start Ren'Py or change your game.")); playground.append(journey);
    const bottom = resizeHandle("Resize preview height", "height"), corner = resizeHandle("Resize preview corner", "corner");
    stage.append(bottom, corner);
    const fit = () => {
      if (zoom !== "Fit") return;
      canvas.style.width = `${Math.max(1, Math.min(scroll.clientWidth - 8, (scroll.clientHeight - 8) * width / 720))}px`;
    };
    canvasObserver = new ResizeObserver(fit); canvasObserver.observe(scroll); fit();
  }
  function renderInspector() {
    inspector.replaceChildren(); const d = draft(); if (!d) return;
    inspector.append(el("h2", "", d.name));
    const state = el("p", "sc-draft-status"); state.textContent = changed() ? "Changes waiting to be applied" : "No changes to apply"; inspector.append(state);
    if (current().template) inspector.append(el("p", "sc-protected", "You can change the look of this game screen. Its required text and controls stay in place so it keeps working."));
    const applyBar = el("div", "sc-apply"); applyBar.append(action("Apply changes", () => applyDraft()), action("Cancel changes", () => { drafts.delete(key()); renderInspector(); renderInfo(); status("Changes cancelled. Previous values restored."); })); inspector.append(applyBar);
    const group = (title: string, opened = false) => { const details = el("details", "sc-property-group"); details.dataset.group = title; details.open = opened; details.append(el("summary", "", title)); inspector.append(details);
      const explanations: Record<string, string> = {
        "Position & size": "Position sets where an element sits. An anchor chooses the point on the element placed there. Use 0 for the start, 0.5 for the center, and 1 for the end. Fractional positions use the game size. Padding is space inside a group; spacing is the gap between its items.",
        "Reuse this look": "A shared look keeps matching elements consistent across screens. Apply shows which screens will change. Choose a separate look to change only this element.",
        "Value & range": "Choose a whole-number game variable and the lowest and highest values that the bar represents. For example, courage from 0 to 100.",
        "What this button does": "Actions run in the order shown when the player clicks the button in the game. Change a variable before returning to the story. Buttons in this preview only select elements.",
        "Script & custom code": "The script is your game's Ren'Py code. Visual controls edit the supported parts. Custom code stays in place and can be edited in the script.",
      };
      if (explanations[title]) details.querySelector("summary")!.append(helpTip(title, explanations[title]!));
      return details; };
    const input = (parent: HTMLElement, title: string, property: keyof ScreenNode, type = "text", disabled = false) => {
      const control = el(type === "textarea" ? "textarea" : "input") as HTMLInputElement | HTMLTextAreaElement;
      if (control instanceof HTMLInputElement) control.type = type === "textarea" ? "text" : type;
      control.value = String(d[property]); control.disabled = disabled;
      control.oninput = () => { (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Changes waiting to be applied"; renderInfo(); };
      const explanations: Record<string, string> = { "Element name": "This name identifies the element in the editor. Change Text to edit the words the player sees.", "Horizontal anchor": "The point across this element placed at its horizontal position. Use 0 for the left edge, 0.5 for the center, or 1 for the right edge.", "Vertical anchor": "The point down this element placed at its vertical position. Use 0 for the top edge, 0.5 for the center, or 1 for the bottom edge.", "Padding": "Space inside a group, between its border and the items it contains.", "Spacing": "The gap between items in a vertical, horizontal or grid group.", "Minimum width": "The smallest width this element may use when the game arranges it.", "Maximum width": "The largest width this element may use when the game arranges it." };
      if (explanations[title]) explain(control, explanations[title]!);
      parent.append(labelled(title, control)); return control;
    };
    const choice = (parent: HTMLElement, title: string, property: keyof ScreenNode, options: readonly (readonly [string, string])[]) => { const control = select(options, String(d[property])); control.onchange = () => {
      if (property === "coordinates" && control.value !== d.coordinates) {
        const width = aspect === "1280 × 720" ? 1280 : 960, divisor = control.value === "relative" ? 1 : -1;
        d.x = String(Number(d.x) * Math.pow(width, -divisor)); d.y = String(Number(d.y) * Math.pow(720, -divisor));
      }
      (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Changes waiting to be applied";
      if (property === "coordinates" || property === "parent") renderInspector(); renderInfo();
    }; parent.append(labelled(title, control)); return control; };
    const check = (parent: HTMLElement, title: string, property: "bold" | "italic" | "aspect") => { const control = el("input"); control.type = "checkbox"; control.checked = d[property]; control.onchange = () => { d[property] = control.checked; state.textContent = "Changes waiting to be applied"; renderInfo(); }; parent.append(labelled(title, control)); };
    const content = group("Text & image", true);
    input(content, "Element name", "name");
    if (["text", "textbutton", "component"].includes(d.kind)) { input(content, "Text", "text", "textarea", current().template); content.append(el("p", "muted", "Write [destination] to show that game variable in the text. Change its example value under Connect to check how the text looks.")); }
    if (["image", "imagebutton"].includes(d.kind)) { choice(content, "Image", "asset", pairs(["tram-map.webp", "help-symbol.png", "paper-panel.jpg"])); check(content, "Keep image proportions", "aspect"); content.append(el("p", "muted", "This demo uses the same map drawing for every image. Your choice is kept when you apply it.")); }
    const imageElement = ["image", "imagebutton"].includes(d.kind);
    if (imageElement || ["text", "textbutton", "component"].includes(d.kind)) content.append(action(imageElement ? "Browse example images" : "Choose a font", () => {
      const modal = dialog(imageElement ? "Example images" : "Example fonts", "Choose one of the example files. Apply changes to keep your choice on this element.");
      const files = imageElement ? ["tram-map.webp", "help-symbol.png", "paper-panel.jpg"] : ["NotoSans-Regular.ttf", "NotoSerif-Regular.otf"], picker = select(pairs(files), imageElement ? d.asset : d.font);
      modal.append(labelled(imageElement ? "Example image" : "Example font", picker), action("Cancel selection", () => modal.close()), action(imageElement ? "Use image" : "Use font", () => { if (imageElement) d.asset = picker.value; else d.font = picker.value; modal.close(); renderInspector(); renderInfo(); status("File selected. Apply changes to keep it."); })); modal.showModal();
    }));
    const position = group("Position & size", layout === "guided-v2" && step === "layout");
    const containers = current().nodes.filter(n => n.id !== d.id && ["fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"].includes(n.kind));
    if (d.parent) choice(position, "Inside group", "parent", containers.map(n => [n.id, `${n.name} (${kindName(n.kind)})`])).disabled = current().template;
    choice(position, "Position units", "coordinates", [["px", "Pixels"], ["relative", "Fraction of game size (0 to 1)"]]);
    const numbers = el("div", "sc-number-grid");
    for (const [property, title] of [["x", "Horizontal position"], ["y", "Vertical position"]] as const) input(numbers, title, property, "number"); position.append(numbers);
    renderDepth(position);
    const dimensions = el("div", "sc-number-grid");
    for (const [property, title] of [["width", "Width"], ["height", "Height"], ["anchorX", "Horizontal anchor"], ["anchorY", "Vertical anchor"], ["minWidth", "Minimum width"], ["maxWidth", "Maximum width"], ["padding", "Padding"], ["spacing", "Spacing"]] as const) input(dimensions, title, property, "number"); position.append(dimensions);
    choice(position, "Alignment", "alignment", pairs(["left", "center", "right"]));
    position.append(el("p", "muted", "Apply changes to update the position and size. This mockup keeps spacing and size limits, but does not draw their effects."));
    if (layoutParent(d)) position.append(el("p", "muted", `${layoutParent(d)!.name} arranges this item automatically. Use its Depth controls to change the item order, or choose a free layout group under Inside group to drag it.`));
    const appearance = group("Font & color");
    choice(appearance, "Font", "font", pairs(["NotoSans-Regular.ttf", "NotoSerif-Regular.otf"])); input(appearance, "Text size", "size", "number"); input(appearance, "Text color", "color"); check(appearance, "Bold", "bold"); check(appearance, "Italic", "italic"); input(appearance, "Background color", "background"); input(appearance, "Border color", "border");
    appearance.append(el("p", "muted", "Apply changes to update the text size and colors. This mockup keeps your font choice, but draws one example font."));
    const reusable = group("Reuse this look");
    reusable.append(el("p", "", d.shared ? "This heading shares its look with headings on other screens." : "This element has its own look."), action("Use the shared heading look", () => { d.shared = true; renderInspector(); renderInfo(); }), action("Give this element its own look", () => { d.shared = false; renderInspector(); renderInfo(); status("Choose Apply changes to give this element its own look."); }));
    reusable.append(el("p", "muted", "Before a shared change is applied, you can review the screens that will change."));
    if (["bar", "viewport"].includes(d.kind)) { const bindings = group("Value & range", true); choice(bindings, "Number variable", "variable", [["courage", "courage (whole number)"]]); input(bindings, "Minimum value", "minimum", "number"); input(bindings, "Maximum value", "maximum", "number"); bindings.append(el("p", "muted", "A value bar shows a number from your game. Scrolling areas are a still example in this demo.")); }
    if (["textbutton", "imagebutton"].includes(d.kind)) renderActions(group("What this button does", true), d);
    const limits = group("Script & custom code"); limits.append(el("p", "sc-protected", "Custom code stays in your script. Open the script to edit code that has no visual control here."), el("pre", "sc-source", sourceSummary()), action("View script", () => showSource()), action("Edit example script text", () => {
      const modal = dialog("Change text in the script", "Try changing this element's text. This demo leaves the custom code beside it alone.");
      const text = el("textarea"); text.value = target()!.text; modal.append(labelled("Text in script", text), action("Cancel script change", () => modal.close()), action("Apply text edit", () => { if (current().template) { status("The game supplies this text, so it cannot be replaced here.", true); return; } saveHistory(); target()!.text = text.value; current().revision++; drafts.delete(key()); modal.close(); render(); status("Text updated in this demo. Custom code was left alone."); })); modal.showModal();
    }));
  }
  function renderActions(parent: HTMLElement, d: ScreenNode) {
    if (current().template) { parent.append(el("p", "sc-protected", "This game screen needs these button actions to work. You can change how the button looks.")); return; }
    parent.append(el("p", "", "These actions run from top to bottom when the player clicks this button."), el("p", "muted", current().mode === "panel" ? "Close and Escape hide this overlay. Clicking outside leaves it open." : "Return to story closes the dialog and continues the story. Keep it last."));
    d.actions.forEach((a, index) => {
      const row = el("div", "sc-action-row"); row.append(el("span", "", `${index + 1}. ${a.kind === "set" ? `Set ${a.variable} to ${a.value}` : a.kind === "hide" ? "Close this overlay" : "Return to story"}`));
      for (const [offset, label] of [[-1, "up"], [1, "down"]] as const) { const b = action(`Move action ${index + 1} ${label}`, () => { const next = index + offset; const candidate = copy(d.actions); [candidate[index], candidate[next]] = [candidate[next]!, candidate[index]!]; if (candidate.findIndex(x => x.kind === "finish") >= 0 && candidate.at(-1)!.kind !== "finish") { status("Return to story must be the last action.", true); return; } d.actions = candidate; renderInspector(); renderInfo(); }); b.disabled = index + offset < 0 || index + offset >= d.actions.length; row.append(b); }
      row.append(action(`Remove action ${index + 1}`, () => { d.actions.splice(index, 1); renderInspector(); renderInfo(); })); parent.append(row);
    });
    const type = select([["set", "Change a game variable"], [current().mode === "panel" ? "hide" : "finish", current().mode === "panel" ? "Close this overlay" : "Return to story"]], "set");
    const variable = select(variables.map(v => [v.id, `${v.id} (${valueType(v.type)})`]), "help_seen"), value = el("input"); value.value = "true";
    const variableField = labelled("Game variable", variable), valueField = labelled("New value", value);
    variableField.querySelector(".lp-label")!.append(helpTip("game variables", "A game variable is a named value the story remembers, such as whether Help was opened or the player's courage. Choose the value this button should change."));
    valueField.querySelector(".lp-label")!.append(helpTip("action values", () => variables.find(v => v.id === variable.value)!.type === "bool" ? "For a yes/no variable, enter true for Yes or false for No." : variables.find(v => v.id === variable.value)!.type === "int" ? "Enter a whole number, such as 35. The button will set this variable to that number." : "Enter the text this variable should contain."));
    variable.onchange = () => { value.value = variables.find(v => v.id === variable.value)!.value; };
    type.onchange = () => { variableField.hidden = valueField.hidden = type.value !== "set"; };
    parent.append(labelled("Action type", type), variableField, valueField, action("Add action", () => {
      if (type.value === "set") {
        const t = variables.find(v => v.id === variable.value)!.type;
        if ((t === "bool" && !["true", "false"].includes(value.value)) || (t === "int" && !/^-?\d+$/.test(value.value))) { status("Enter a value that matches this variable: true/false, a whole number, or text.", true); return; }
      }
      const a: Action = { kind: type.value as Action["kind"], variable: variable.value, value: value.value };
      if (a.kind === "finish" && d.actions.some(x => x.kind === "finish")) { status("This button already returns to the story.", true); return; }
      const finish = d.actions.findIndex(x => x.kind === "finish"); if (finish >= 0) d.actions.splice(finish, 0, a); else d.actions.push(a);
      renderInspector(); renderInfo(); status("Action added. Choose Apply changes to keep it. Preview buttons only select elements.");
    }));
  }
  function applyDraft(confirmed = false) {
    const d = draft(); if (!d || !changed()) { status("There are no changes to apply."); return; }
    const fieldNames = { x: "horizontal position", y: "vertical position", width: "width", height: "height", anchorX: "horizontal anchor", anchorY: "vertical anchor", minWidth: "minimum width", maxWidth: "maximum width", padding: "padding", spacing: "spacing", size: "text size" };
    for (const field of Object.keys(fieldNames) as (keyof typeof fieldNames)[]) {
      if (!d[field].trim() || !Number.isFinite(Number(d[field])) || (!["x", "y"].includes(field) && Number(d[field]) < 0)) { status(`Check the ${fieldNames[field]} value. Your changes are kept.`, true); return; }
    }
    if (Number(d.width) <= 0 || Number(d.height) <= 0 || Number(d.anchorX) > 1 || Number(d.anchorY) > 1 || Number(d.minWidth) > Number(d.maxWidth)) { status("Use sizes above zero, anchors between 0 and 1, and a minimum no larger than the maximum. Your changes are kept.", true); return; }
    const seen = new Set([d.id]); let parent = d.parent;
    while (parent) { if (seen.has(parent)) { status("A group cannot go inside one of its own items. Your changes are kept.", true); return; } seen.add(parent); parent = current().nodes.find(n => n.id === parent)?.parent ?? ""; }
    if (![d.color, d.background, d.border].every(c => /^#[0-9a-f]{6}$/i.test(c))) { status("Use a color such as #234567. Your changes are kept.", true); return; }
    if (conflict) { status("The script changed while you were editing. Keep your changes and review the script before applying them.", true); renderInfo(); return; }
    const affected = screens.filter(s => s.nodes.some(n => n.shared));
    if (d.shared && affected.length > 1 && !confirmed) {
      const modal = dialog("Change the shared look?", `This look is used on ${affected.map(s => s.name).join(", ")}. Only the selected element's text will change.`);
      modal.append(action("Keep editing", () => modal.close()), action("Change only this element", () => { d.shared = false; modal.close(); renderInspector(); renderInfo(); }), action("Apply to these screens", () => { modal.close(); applyDraft(true); }, true)); modal.showModal(); return;
    }
    saveHistory(); current().nodes[current().nodes.findIndex(n => n.id === selected)] = copy(d); current().revision++;
    if (d.shared) screens.filter(s => s.id !== screenId).forEach(s => s.nodes.filter(n => n.shared).forEach(n => { for (const property of ["font", "size", "color", "bold", "italic", "background", "border"] as const) Object.assign(n, { [property]: d[property] }); s.revision++; }));
    drafts.delete(key()); render(); status("Changes applied. Undo restores them together.");
  }
  function sourceSummary() {
    const n = target(); return `# Example script for this demo\nscreen ${current().id.replaceAll("-", "_")}():\n    # ${current().mode}; ${current().nodes.length} elements\n    ${n?.kind ?? "fixed"} ${JSON.stringify(n?.text ?? "")}:\n        xpos ${n?.x ?? 0}\n        ypos ${n?.y ?? 0}\n\n# Custom code is kept\ninit python:\n    def custom_help_logic():\n        return "source only"`;
  }
  function showSource() { const d = dialog("Screen script", "This is an example of the screen script. It does not write to a game file."); d.append(el("pre", "sc-source", sourceSummary()), action("Close script", () => d.close())); d.showModal(); }
  function renderInfo() {
    info.replaceChildren();
    info.append(el("span", "sc-revision", changed() ? "You have unapplied changes." : "Changes are kept in this demo."), action("View script", showSource));
    if (previewScreenId === screenId) info.append(el("span", "muted", previewRevision !== current().revision ? "Test preview needs updating." : lastPreview));
    if (conflict) info.append(el("span", "sc-conflict", "The script changed."), action("Review script change", () => { conflict = false; renderInfo(); status("Script change reviewed. Your changes are still ready to apply."); }));
    const about = el("details", "sc-state"); about.append(el("summary", "", "About this demo"), el("p", "", "You can try the controls without changing a game. Fonts, images, automatic layouts and custom code are simplified here. Reloading starts again.")); info.append(about);
  }
  const escape = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (closeHelp) { event.preventDefault(); closeHelp(); return; }
    if (viewDrag) { event.preventDefault(); cancelViewResize(); return; }
    if (gesture) { event.preventDefault(); gesture = undefined; render(); status("Move cancelled."); return; }
    if (focusPreview) { event.preventDefault(); focusPreview = false; setViewSize(); renderCanvas(); stage.querySelector<HTMLButtonElement>(".nb-focus-button")?.focus(); }
  };
  document.addEventListener("keydown", escape); render();
  if (innerWidth < 760 && layout !== "guided-v2") {
    previewHeight = Math.max(200, frame.content.getBoundingClientRect().bottom - stage.getBoundingClientRect().top);
    setViewSize();
  }
  return () => { document.removeEventListener("keydown", escape); canvasObserver?.disconnect(); closeHelp?.(); cleanupSwitcher(); };
}

export const mount = (host: HTMLElement, context: LabContext) => mountScreenDemo(host, context, "guided-v2");
