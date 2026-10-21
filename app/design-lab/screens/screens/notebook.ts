// Revised notebook prototype. Game edits and workspace sizes stay in browser memory.
import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { prototypeSwitcher } from "../../prototype-switcher.ts";
import { variants } from "./definition.ts";
import { fixture, help, kinds, node, variables, type Screen, type ScreenNode, type Action } from "./fixture.ts";
import "./screens.css";
import "./notebook.css";

type Layout = "workbench" | "canvas" | "guided";
const copy = <T>(value: T): T => structuredClone(value);
function select(options: readonly (readonly [string, string])[], value: string) {
  const input = el("select"); options.forEach(([id, title]) => input.add(new Option(title, id))); input.value = value; return input;
}
const pairs = (items: readonly string[]) => items.map(item => [item, item] as const);
const kindNames: Record<string, string> = { fixed: "Free-position group", frame: "Panel", window: "Window", vbox: "Vertical group", hbox: "Horizontal group", grid: "Grid", text: "Text", image: "Image", textbutton: "Button", imagebutton: "Image button", bar: "Value bar", viewport: "Scrolling area", component: "Reusable group" };
const kindName = (kind: string) => kindNames[kind] ?? kind;
const valueTypes: Record<string, string> = { bool: "Yes/no", int: "Whole number", string: "Text" };
const valueType = (kind: string) => valueTypes[kind] ?? kind;

function mountNotebook(host: HTMLElement, context: LabContext, layout: Layout) {
  let screens = fixture(context.state);
  let screenId = context.state === "template" ? "template-0" : context.state === "dialog" ? "help-dialog" : screens[0]!.id;
  let selected = context.state === "template" ? "frame" : "title";
  const drafts = new Map<string, ScreenNode>();
  let conflict = context.state === "conflict", gesture: { node: ScreenNode; startX: number; startY: number; dx: number; dy: number; resize: boolean } | undefined;
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
    previewRevision = current().revision; previewScreenId = screenId; lastPreview = `Desktop testing is not connected in this demo. ${current().name} is ready to test when this feature is built.`; renderInfo(); status(lastPreview);
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
  const cleanupSwitcher = prototypeSwitcher(frame.shell, variants, "guided-v2", () => anyDirty() || history.length > 0);
  previewHeight = Math.max(300, Math.min(640, frame.content.clientHeight - screenbar.offsetHeight - 10));

  function helpTip(title: string, message: string) {
    const button = action("?", () => show()); button.className = "nb-help"; button.ariaLabel = `Help with ${title}`;
    const id = `notebook-help-${++helpSequence}`;
    const show = () => {
      closeHelp?.();
      const tip = el("div", "nb-tooltip", message); tip.id = id; tip.role = "tooltip"; frame.shell.append(tip);
      button.setAttribute("aria-describedby", id); button.ariaExpanded = "true";
      const box = button.getBoundingClientRect();
      tip.style.left = `${Math.max(8, Math.min(innerWidth - tip.offsetWidth - 8, box.left))}px`;
      tip.style.top = `${Math.max(8, Math.min(innerHeight - tip.offsetHeight - 8, box.bottom + 7))}px`;
      closeHelp = () => { tip.remove(); button.removeAttribute("aria-describedby"); button.ariaExpanded = "false"; closeHelp = undefined; };
    };
    button.onmouseenter = show; button.onfocus = show;
    button.onmouseleave = () => { if (document.activeElement !== button) closeHelp?.(); };
    button.onblur = () => closeHelp?.();
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
    handle.ariaLabel = title; handle.title = kind === "width" ? "Drag left for a wider preview. Left and right arrow keys also work." : kind === "corner" ? "Drag right and down for a larger preview. Arrow keys also work." : "Drag down for a taller preview. Up and down arrow keys also work.";
    handle.role = "separator"; handle.tabIndex = 0; handle.setAttribute("aria-orientation", kind === "width" ? "vertical" : "horizontal");
    handle.onpointerdown = event => {
      if (event.button !== 0) return;
      closeHelp?.(); viewDrag = { x: event.clientX, y: event.clientY, width: notebookWidth, height: previewHeight, kind };
      handle.setPointerCapture(event.pointerId); event.preventDefault();
    };
    handle.onpointermove = event => {
      if (!viewDrag) return;
      const maximum = Math.max(240, workspace.clientWidth - 320);
      if (kind !== "height" && innerWidth >= 760) notebookWidth = Math.max(240, Math.min(maximum, viewDrag.width + (event.clientX - viewDrag.x) * (kind === "corner" ? -1 : 1)));
      if (kind !== "width") previewHeight = Math.max(300, Math.min(1200, viewDrag.height + event.clientY - viewDrag.y));
      setViewSize();
    };
    handle.onpointerup = () => { viewDrag = undefined; status("Preview area resized. Your game size and element changes are kept."); };
    handle.onpointercancel = () => cancelViewResize();
    handle.onkeydown = event => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); const amount = event.shiftKey ? 40 : 10;
      if (kind !== "height" && innerWidth >= 760 && ["ArrowLeft", "ArrowRight"].includes(event.key)) notebookWidth = Math.max(240, Math.min(Math.max(240, workspace.clientWidth - 320), notebookWidth + (event.key === "ArrowLeft" ? -amount : amount) * (kind === "corner" ? -1 : 1)));
      if (kind !== "width" && ["ArrowUp", "ArrowDown"].includes(event.key)) previewHeight = Math.max(300, Math.min(1200, previewHeight + (event.key === "ArrowUp" ? -amount : amount)));
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
  function reorder(offset: number) {
    if (anyDirty()) { status("Apply or cancel your changes before changing the order.", true); return; }
    const n = target()!, siblings = current().nodes.filter(other => other.parent === n.parent);
    const index = siblings.indexOf(n), other = siblings[index + offset]; if (!other) return;
    saveHistory(); const a = current().nodes.indexOf(n), b = current().nodes.indexOf(other);
    [current().nodes[a], current().nodes[b]] = [current().nodes[b]!, current().nodes[a]!]; current().revision++;
    render(); status(layoutParent(n) ? "Item order changed. This group arranges its items automatically." : offset > 0 ? "Element moved forward." : "Element moved backward.");
  }

  function saveHistory() { history.push(copy(screens)); future.length = 0; }
  function choose(id: string) { selected = id; render(); }
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
  function render() {
    closeHelp?.(); setViewSize();
    if (!current()) screenId = screens[0]!.id;
    if (!target()) selected = current().nodes[0]?.id ?? "root";
    picker.replaceChildren(...screens.map(s => new Option(s.name, s.id))); picker.value = screenId;
    mode.value = current().mode; mode.disabled = current().template;
    undo.disabled = !history.length; redo.disabled = !future.length;
    workspace.dataset.step = step;
    tabs.querySelectorAll("button").forEach((button, index) => button.ariaPressed = String(["compose", "layout", "behavior"][index] === step));
    renderTree(); renderCanvas(); renderInspector(); renderInfo();
  }
  function renderTree() {
    hierarchy.replaceChildren(el("h2", "", layout === "guided" ? "Elements" : "Elements"));
    if (context.state === "empty" && !screens.some(s => !s.template)) hierarchy.append(el("p", "muted", "Create your first screen with a Help example or a blank page."), action("Create first Help screen", newScreen, true));
    const tree = el("div", "sc-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
    orderedNodes().forEach(n => {
      const b = action(`${n.name} · ${kindName(n.kind)}`, () => choose(n.id)); b.role = "treeitem"; b.ariaSelected = String(selected === n.id); b.dataset.nodeId = n.id;
      b.className = `sc-tree-node${selected === n.id ? " selected" : ""}`;
      b.style.paddingLeft = `${10 + (n.parent === "stack" ? 24 : n.parent === "frame" ? 16 : n.parent ? 8 : 0)}px`;
      b.onkeydown = e => {
        const ordered = orderedNodes(), index = ordered.findIndex(x => x.id === selected);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); choose(ordered[Math.max(0, Math.min(ordered.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))]!.id); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const next = e.key === "ArrowLeft" ? target()?.parent : current().nodes.find(n => n.parent === selected)?.id; if (next) choose(next); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
      }; tree.append(b);
    }); hierarchy.append(tree);
    const addKind = select(kinds.map(kind => [kind, kindName(kind)]), "text"); addKind.ariaLabel = "Element type";
    const add = action("Add element", () => {
      saveHistory(); const n = node(`node-${++sequence}`, addKind.value, `New ${kindName(addKind.value).toLowerCase()}`, 344, 360, 300, 48);
      n.parent = current().nodes.some(n => n.id === "stack") ? "stack" : "root"; n.shared = n.kind === "component";
      if (n.kind === "textbutton" || n.kind === "imagebutton") n.actions = [{ kind: current().mode === "panel" ? "hide" : "finish", variable: "help_seen", value: "true" }];
      current().nodes.push(n); current().revision++; selected = n.id; render(); status("Element added.");
    }); add.disabled = current().template;
    hierarchy.append(labelled("Add element type", addKind), add);
    const moves = el("div", "sc-actions nb-order");
    const orderHeading = el("h3", "", "Front & back");
    orderHeading.append(helpTip("front and back order", "Select an element, then use Bring forward or Send backward. Later items in the same group cover earlier ones. A group and all its contents move together. In a vertical, horizontal or grid group, these buttons change item order instead."));
    hierarchy.append(orderHeading);
    const siblings = current().nodes.filter(n => n.parent === target()?.parent), index = siblings.findIndex(n => n.id === selected);
    if (target()?.parent) hierarchy.append(el("p", "nb-order-position", `Order ${index + 1} of ${siblings.length} in ${current().nodes.find(n => n.id === target()!.parent)?.name}. ${layoutParent(target()!) ? "This group arranges items in list order." : "Later items appear in front."}`));
    for (const [offset, title] of [[-1, "Send backward"], [1, "Bring forward"]] as const) {
      const button = action(title, () => reorder(offset));
      button.disabled = current().template || !target()?.parent || index + offset < 0 || index + offset >= siblings.length; moves.append(button);
    }
    const remove = action("Remove element", () => {
      if (current().nodes.some(n => n.parent === selected)) { status("Move or remove the items inside this group first.", true); return; }
      saveHistory(); current().nodes = current().nodes.filter(n => n.id !== selected); current().revision++; drafts.delete(key()); selected = current().nodes[0]!.id; render(); status("Element removed.");
    }); remove.disabled = current().template || !target()?.parent; moves.append(remove); hierarchy.append(moves);
    hierarchy.append(el("p", "muted sc-note", "Choose an element here or click it in the preview. Use the arrow keys to browse the list."));
  }
  function renderCanvas() {
    canvasObserver?.disconnect();
    stage.replaceChildren(); playground.replaceChildren();
    const toolbar = el("div", "sc-canvas-toolbar"); toolbar.append(el("h2", "", layout === "canvas" ? "Game preview" : "Game preview"));
    const ratio = select(pairs(["1280 × 720", "960 × 720"]), aspect); ratio.ariaLabel = "Game size"; ratio.onchange = () => { aspect = ratio.value; renderCanvas(); renderInfo(); };
    const zoomInput = select(pairs(["Fit", "75%", "100%"]), zoom); zoomInput.ariaLabel = "Zoom"; zoomInput.onchange = () => { zoom = zoomInput.value; renderCanvas(); renderInfo(); };
    const focus = action(focusPreview ? "Back to editing" : "Focus preview", () => { focusPreview = !focusPreview; setViewSize(); renderCanvas(); stage.querySelector<HTMLButtonElement>(".nb-focus-button")?.focus(); }); focus.classList.add("nb-focus-button"); focus.ariaPressed = String(focusPreview);
    toolbar.append(ratio, zoomInput, focus, helpTip("preview size", "Drag the left border to make the preview wider, or the bottom border to make it taller. The corner changes both. Use the arrow keys when a border is focused. Escape cancels a drag. Game size changes separately in the Game size menu.")); stage.append(toolbar);
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
      b.dataset.appearance = appearance;
      b.onclick = () => { if (!gesture) choose(n.id); };
      b.onpointerdown = e => {
        if (selected !== n.id || e.button !== 0) return;
        if (changed()) { status("Apply or cancel your changes before dragging.", true); return; }
        const parent = layoutParent(n);
        if (parent) { status(`This ${kindName(parent.kind).toLowerCase()} places its items automatically. Change their order or the group spacing.`); return; }
        const resize = e.shiftKey; gesture = { node: copy(n), startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, resize };
        b.setPointerCapture(e.pointerId); e.preventDefault();
      };
      b.onpointermove = e => {
        if (!gesture) return;
        const rect = canvas.getBoundingClientRect(); gesture.dx = Math.round((e.clientX - gesture.startX) * width / rect.width / 8) * 8; gesture.dy = Math.round((e.clientY - gesture.startY) * 720 / rect.height / 8) * 8;
        if (gesture.resize) { b.style.width = `${100 * Math.max(24, Number(n.width) + gesture.dx) / width}%`; b.style.height = `${100 * Math.max(24, Number(n.height) + gesture.dy) / 720}%`; }
        else { b.style.left = `${100 * (x + gesture.dx) / width}%`; b.style.top = `${100 * (y + gesture.dy) / 720}%`; }
        status("Release to keep the move. Escape cancels it. Hold Shift to resize instead. Movement snaps to 8 game pixels.");
      };
      b.onpointerup = () => {
        if (!gesture) return; const g = gesture; gesture = undefined;
        if (g.dx || g.dy) { saveHistory(); if (g.resize) { n.width = String(Math.max(24, Number(n.width) + g.dx)); n.height = String(Math.max(24, Number(n.height) + g.dy)); } else { n.x = String(Number(n.x) + g.dx / (n.coordinates === "relative" ? width : 1)); n.y = String(Number(n.y) + g.dy / (n.coordinates === "relative" ? 720 : 1)); } current().revision++; drafts.delete(key()); render(); status("Move applied. Undo restores its previous size and position."); }
      };
      b.onkeydown = e => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault(); const parent = layoutParent(n); if (parent) { status(`This ${kindName(parent.kind).toLowerCase()} places its items automatically. Change their order or the group spacing.`); return; }
        const d = draft()!; const coordinate = e.key === "ArrowLeft" || e.key === "ArrowRight" ? "x" : "y"; d[coordinate] = String(Number(d[coordinate]) + ((e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1) * (e.shiftKey ? 8 : 1) / (d.coordinates === "relative" ? (coordinate === "x" ? width : 720) : 1)); renderInspector(); renderInfo(); status("Position changed. Choose Apply to keep it or Cancel to restore it.");
      }; canvas.append(b);
    }
    const canvasHelp = el("p", "muted sc-note", "Drag an element to move it. Hold Shift while dragging to resize it. Automatically arranged items move with their group.");
    scroll.append(canvas); stage.append(scroll, canvasHelp);
    const sampleControls = el("details", "sc-samples"); sampleControls.append(el("summary", "", "Try values and button states"));
    sampleControls.open = samplesExpanded; sampleControls.ontoggle = () => { if (sampleControls.isConnected) samplesExpanded = sampleControls.open; };
    const appearanceInput = select(pairs(["normal", "hover", "selected", "disabled"]), sampleAppearance); appearanceInput.ariaLabel = "Button state"; appearanceInput.onchange = () => { sampleAppearance = appearanceInput.value; renderCanvas(); renderInfo(); };
    sampleControls.append(labelled("Button state", appearanceInput));
    variables.forEach(v => { const input = el("input"); input.value = sample[v.id as keyof typeof sample]; input.ariaLabel = `Try ${v.id}`; input.onchange = () => { if ((v.type === "int" && !/^-?\d+$/.test(input.value)) || (v.type === "bool" && !["true", "false"].includes(input.value))) { status(`Enter a ${valueType(v.type).toLowerCase()} value.`, true); return; } sample[v.id as keyof typeof sample] = input.value; renderCanvas(); renderInfo(); }; sampleControls.append(labelled(`${v.id} (${valueType(v.type)})`, input)); });
    sampleControls.append(el("p", "muted", "These values only change this preview. Your game variables are unchanged.")); playground.append(sampleControls);
    const journey = el("details", "sc-story"); journey.open = storyExpanded || layout === "guided" && step === "behavior"; journey.ontoggle = () => { if (journey.isConnected) storyExpanded = journey.open; }; journey.append(el("summary", "", "Try it in the story"));
    const storyButtons = el("div", "sc-actions");
    storyButtons.append(action("Show overlay", () => { if (current().mode === "blocking") { status("This screen pauses the story. Choose Open dialog.", true); return; } storyVisible = true; storyWaiting = false; output = "The overlay is open. You can continue the story."; renderCanvas(); }), action("Hide overlay", () => { if (current().mode === "blocking") { status("Use Close dialog to return to the story.", true); return; } storyVisible = false; output = "The overlay is closed."; renderCanvas(); }), action("Open dialog", () => { if (current().mode !== "blocking") { status("Choose Help dialog above to try a screen that pauses the story.", true); return; } storyVisible = true; storyWaiting = true; output = "The dialog is open. Close it to continue the story."; renderCanvas(); }), action("Next line", () => { output = storyWaiting ? "Close the dialog before continuing." : storyVisible ? "Ada keeps speaking. The overlay stays open." : "Ada continues speaking."; renderCanvas(); }));
    const dismiss = () => { if (!storyVisible) { output = "The screen is already closed."; renderCanvas(); return; } storyVisible = false; if (storyWaiting) { storyWaiting = false; continuations++; } output = `Screen closed. The story has continued ${continuations} ${continuations === 1 ? "time" : "times"}.`; renderCanvas(); };
    storyButtons.append(action(current().mode === "panel" ? "Close overlay" : "Close dialog", dismiss), action("Press Escape", dismiss), action("Click outside", () => { output = "Clicking outside leaves the screen open."; renderCanvas(); }));
    journey.append(storyButtons, el("p", "sc-story-status", output), el("p", "muted", "This story example is a demo. It does not launch your game.")); playground.append(journey);
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
    const state = el("p", "sc-draft-status"); state.textContent = changed() ? "Unapplied changes" : "No pending changes"; inspector.append(state);
    if (current().template) inspector.append(el("p", "sc-protected", "You can change the look of this game screen. Its required text and controls stay in place so it keeps working."));
    const applyBar = el("div", "sc-apply"); applyBar.append(action("Apply changes", () => applyDraft()), action("Cancel changes", () => { drafts.delete(key()); renderInspector(); renderInfo(); status("Changes cancelled. Previous values restored."); })); inspector.append(applyBar);
    const group = (title: string, opened = false) => { const details = el("details", "sc-property-group"); details.open = opened; details.append(el("summary", "", title)); inspector.append(details);
      const explanations: Record<string, string> = {
        "Position & size": "Position sets where an element sits. An anchor chooses which point on the element meets that position. Use 0 for the start, 0.5 for the center, and 1 for the end. Fractional positions use the game width and height; 0.5 is halfway.",
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
      control.oninput = () => { (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Unapplied changes"; renderInfo(); };
      parent.append(labelled(title, control)); return control;
    };
    const choice = (parent: HTMLElement, title: string, property: keyof ScreenNode, options: readonly (readonly [string, string])[]) => { const control = select(options, String(d[property])); control.onchange = () => {
      if (property === "coordinates" && control.value !== d.coordinates) {
        const width = aspect === "1280 × 720" ? 1280 : 960, divisor = control.value === "relative" ? 1 : -1;
        d.x = String(Number(d.x) * Math.pow(width, -divisor)); d.y = String(Number(d.y) * Math.pow(720, -divisor));
      }
      (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Unapplied changes";
      if (property === "coordinates" || property === "parent") renderInspector(); renderInfo();
    }; parent.append(labelled(title, control)); return control; };
    const check = (parent: HTMLElement, title: string, property: "bold" | "italic" | "aspect") => { const control = el("input"); control.type = "checkbox"; control.checked = d[property]; control.onchange = () => { d[property] = control.checked; state.textContent = "Unapplied changes"; renderInfo(); }; parent.append(labelled(title, control)); };
    const content = group("Text & image", true);
    input(content, "Element name", "name");
    if (["text", "textbutton", "component"].includes(d.kind)) { input(content, "Text", "text", "textarea", current().template); content.append(el("p", "muted", "Use [destination], [courage] or [help_seen] to display an existing variable.")); }
    if (["image", "imagebutton"].includes(d.kind)) { choice(content, "Image", "asset", pairs(["tram-map.webp", "help-symbol.png", "paper-panel.jpg"])); check(content, "Keep image proportions", "aspect"); content.append(el("p", "muted", "This demo uses the same map drawing for every image. Your choice is kept when you apply it.")); }
    content.append(action("Choose a font or image", () => { const modal = dialog("Project fonts and images", "Choose a font or image from your project. This demo only includes the example files listed below."); modal.append(el("p", "", "NotoSans-Regular.ttf · NotoSerif-Regular.otf · tram-map.webp · help-symbol.png"), action("Use this image", () => { d.asset = "help-symbol.png"; modal.close(); renderInspector(); status("Image selected. Choose Apply changes to keep it."); }), action("Close file picker", () => modal.close())); modal.showModal(); }));
    const position = group("Position & size", layout !== "guided" || step === "layout");
    const containers = current().nodes.filter(n => n.id !== d.id && ["fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"].includes(n.kind));
    if (d.parent) choice(position, "Inside group", "parent", containers.map(n => [n.id, `${n.name} (${kindName(n.kind)})`])).disabled = current().template;
    choice(position, "Position units", "coordinates", [["px", "Pixels"], ["relative", "Fraction of game size (0 to 1)"]]);
    const numbers = el("div", "sc-number-grid");
    for (const [property, title] of [["x", "Horizontal position"], ["y", "Vertical position"], ["width", "Width"], ["height", "Height"], ["anchorX", "Horizontal anchor"], ["anchorY", "Vertical anchor"], ["minWidth", "Minimum width"], ["maxWidth", "Maximum width"], ["padding", "Padding"], ["spacing", "Spacing"]] as const) input(numbers, title, property, "number"); position.append(numbers);
    choice(position, "Alignment", "alignment", pairs(["left", "center", "right"]));
    position.append(el("p", "muted", "Position, size and anchors update the preview. Spacing, size limits and changing groups are saved here but are not drawn in this demo."));
    if (layoutParent(d)) position.append(el("p", "muted", `This item belongs to a ${kindName(layoutParent(d)!.kind).toLowerCase()}. That group arranges its items automatically. This demo shows their starting positions.`));
    const appearance = group("Type & color");
    choice(appearance, "Font", "font", pairs(["NotoSans-Regular.ttf", "NotoSerif-Regular.otf"])); input(appearance, "Text size", "size", "number"); input(appearance, "Text color", "color"); check(appearance, "Bold", "bold"); check(appearance, "Italic", "italic"); input(appearance, "Background color", "background"); input(appearance, "Border color", "border");
    appearance.append(el("p", "muted", "Color, bold, italic and text size update the preview. Font choices are saved here; this demo uses one typeface."));
    const reusable = group("Reuse this look");
    reusable.append(el("p", "", d.shared ? "This heading shares its look with headings on other screens." : "This element has its own look."), action("Use the shared heading look", () => { d.shared = true; renderInspector(); renderInfo(); }), action("Give this element its own look", () => { d.shared = false; renderInspector(); renderInfo(); status("Choose Apply changes to give this element its own look."); }));
    reusable.append(el("p", "muted", "Before a shared change is applied, you can review the screens that will change."));
    if (["bar", "viewport"].includes(d.kind)) { const bindings = group("Value & range", true); choice(bindings, "Number variable", "variable", [["courage", "courage (whole number)"]]); input(bindings, "Minimum value", "minimum", "number"); input(bindings, "Maximum value", "maximum", "number"); bindings.append(el("p", "muted", "A value bar shows a number from your game. Scrolling areas are a still example in this demo.")); }
    if (["textbutton", "imagebutton"].includes(d.kind)) renderActions(group("What this button does", true), d);
    const limits = group("Script & custom code"); limits.append(el("p", "sc-protected", "Custom code stays in your script. Open the script to edit code that has no visual control here."), el("pre", "sc-source", sourceSummary()), action("View script", () => showSource()), action("Try a script change", () => {
      const modal = dialog("Change text in the script", "Try changing this element's text. This demo leaves the custom code beside it alone.");
      const text = el("textarea"); text.value = target()!.text; modal.append(labelled("Text in script", text), action("Cancel script change", () => modal.close()), action("Use text change", () => { if (current().template) { status("The game supplies this text, so it cannot be replaced here.", true); return; } saveHistory(); target()!.text = text.value; current().revision++; drafts.delete(key()); modal.close(); render(); status("Text updated in this demo. Custom code was left alone."); })); modal.showModal();
    }));
  }
  function renderActions(parent: HTMLElement, d: ScreenNode) {
    if (current().template) { parent.append(el("p", "sc-protected", "This game screen needs these button actions to work. You can change how the button looks.")); return; }
    parent.append(el("p", "", current().mode === "panel" ? "Close and Escape hide this overlay. Clicking outside leaves it open." : "Close and Escape return to the story. Put Return to story last. Clicking outside leaves the dialog open."));
    d.actions.forEach((a, index) => {
      const row = el("div", "sc-action-row"); row.append(el("span", "", `${index + 1}. ${a.kind === "set" ? `Set ${a.variable} to ${a.value}` : a.kind === "hide" ? "Close this overlay" : "Return to story"}`));
      for (const [offset, label] of [[-1, "up"], [1, "down"]] as const) { const b = action(`Move action ${index + 1} ${label}`, () => { const next = index + offset; const candidate = copy(d.actions); [candidate[index], candidate[next]] = [candidate[next]!, candidate[index]!]; if (candidate.findIndex(x => x.kind === "finish") >= 0 && candidate.at(-1)!.kind !== "finish") { status("Return to story must be the last action.", true); return; } d.actions = candidate; renderInspector(); renderInfo(); }); b.disabled = index + offset < 0 || index + offset >= d.actions.length; row.append(b); }
      row.append(action(`Remove action ${index + 1}`, () => { d.actions.splice(index, 1); renderInspector(); renderInfo(); })); parent.append(row);
    });
    const type = select([["set", "Change a game variable"], [current().mode === "panel" ? "hide" : "finish", current().mode === "panel" ? "Close this overlay" : "Return to story"]], "set");
    const variable = select(variables.map(v => [v.id, `${v.id} (${valueType(v.type)})`]), "help_seen"), value = el("input"); value.value = "true";
    variable.onchange = () => { value.value = variables.find(v => v.id === variable.value)!.value; };
    parent.append(labelled("Action type", type), labelled("Game variable", variable), labelled("New value", value), action("Add action", () => {
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
    if (gesture) { event.preventDefault(); gesture = undefined; renderCanvas(); status("Move cancelled."); return; }
    if (focusPreview) { event.preventDefault(); focusPreview = false; setViewSize(); renderCanvas(); stage.querySelector<HTMLButtonElement>(".nb-focus-button")?.focus(); }
  };
  document.addEventListener("keydown", escape); render();
  return () => { document.removeEventListener("keydown", escape); canvasObserver?.disconnect(); closeHelp?.(); cleanupSwitcher(); };
}

export const mount = (host: HTMLElement, context: LabContext) => mountNotebook(host, context, "guided");
