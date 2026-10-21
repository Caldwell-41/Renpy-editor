// Three throwaway Screens variants on the existing lab route, selected by ?variant=.
import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import { prototypeSwitcher } from "../../prototype-switcher.ts";
import { variants } from "./definition.ts";
import { fixture, help, kinds, node, variables, type Screen, type ScreenNode, type Action } from "./fixture.ts";
import "./screens.css";

type Layout = "workbench" | "canvas" | "guided";
const copy = <T>(value: T): T => structuredClone(value);
function select(options: readonly (readonly [string, string])[], value: string) {
  const input = el("select"); options.forEach(([id, title]) => input.add(new Option(title, id))); input.value = value; return input;
}
const pairs = (items: readonly string[]) => items.map(item => [item, item] as const);

export function mountScreens(host: HTMLElement, context: LabContext, layout: Layout) {
  let screens = fixture(context.state);
  let screenId = context.state === "template" ? "template-0" : context.state === "dialog" ? "help-dialog" : screens[0]!.id;
  let selected = context.state === "template" ? "frame" : "title";
  const drafts = new Map<string, ScreenNode>();
  let conflict = context.state === "conflict", gesture: { node: ScreenNode; startX: number; startY: number; dx: number; dy: number; resize: boolean } | undefined;
  let lastPreview = "No runtime preview requested", previewRevision = 0, previewScreenId = "", sampleAppearance = "normal", zoom = "Fit", aspect = "1280 × 720", step = "compose";
  let storyVisible = false, storyWaiting = false, continuations = 0, output = "The last tram is waiting.", sequence = 0;
  let storyExpanded = false, samplesExpanded = false;
  let canvasObserver: ResizeObserver | undefined;
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
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "Design the Help your player sees", dirty: () => anyDirty() || history.length > 0 });
  frame.shell.classList.add("sc-shell", `sc-${layout}`);
  const nav = frame.shell.querySelector('nav[aria-label="Project navigation"]')!;
  const navItem = action("Screens", () => {}); navItem.className = "tree-item selected"; navItem.ariaCurrent = "page"; navItem.title = "Screens"; navItem.prepend(icon("panel")); nav.insertBefore(navItem, nav.lastElementChild);
  const status = (message: string, error = false) => { frame.status.textContent = message; frame.status.role = error ? "alert" : "status"; };
  const undo = action("Undo", () => { if (anyDirty()) { status("Apply or cancel property drafts before Undo.", true); return; } if (history.length) { future.push(copy(screens)); screens = history.pop()!; drafts.clear(); render(); status("Undid one sample change."); } });
  const redo = action("Redo", () => { if (anyDirty()) { status("Apply or cancel property drafts before Redo.", true); return; } if (future.length) { history.push(copy(screens)); screens = future.pop()!; drafts.clear(); render(); status("Redid one sample change."); } });
  frame.tools.append(action("New screen", newScreen, true), undo, redo, action("Preview in Ren'Py", () => {
    previewRevision = current().revision; previewScreenId = screenId; lastPreview = `Simulated preview request for ${current().name}, revision ${previewRevision}. No Ren'Py window opened.`; renderInfo(); status(lastPreview);
  }));
  const screenbar = el("div", "sc-screenbar");
  const picker = select(screens.map(s => [s.id, s.name]), screenId); picker.ariaLabel = "Screen";
  picker.onchange = () => {
    screenId = picker.value; selected = "title"; storyVisible = false; storyWaiting = false;
    output = "Selected a different screen. The connection sample reset without continuing the story.";
    render(); status("Selected screen. Property drafts retained; connection sample reset.");
  };
  const mode = select([["panel", "Panel · story continues"], ["blocking", "Blocking dialog · waits for Close"]], current().mode); mode.ariaLabel = "Screen behavior";
  mode.onchange = () => {
    if (current().template) return;
    if (anyDirty()) { mode.value = current().mode; status("Apply or cancel retained property drafts before changing screen behavior.", true); return; }
    saveHistory(); current().mode = mode.value as Screen["mode"];
    current().nodes.forEach(n => n.actions.forEach(a => { if (a.kind === "hide" || a.kind === "finish") a.kind = current().mode === "panel" ? "hide" : "finish"; }));
    storyVisible = false; storyWaiting = false; output = "Screen behavior changed. The connection sample reset without a continuation.";
    current().revision++; drafts.clear(); render(); status("Updated behavior and matching dismissal actions. Connection sample reset without continuing.");
  };
  screenbar.append(labelled("Screen", picker), labelled("Screen behavior", mode));
  const workspace = el("div", "sc-workspace");
  const hierarchy = el("section", "sc-hierarchy"), stage = el("section", "sc-stage"), inspector = el("section", "sc-inspector");
  hierarchy.ariaLabel = "Screen hierarchy"; stage.ariaLabel = "Screen canvas"; inspector.ariaLabel = "Selected properties";
  const tabs = el("nav", "sc-steps"); tabs.ariaLabel = "Notebook sections";
  for (const [id, title] of [["compose", "1. Compose"], ["layout", "2. Arrange"], ["behavior", "3. Connect"]]) tabs.append(action(title!, () => { step = id!; render(); }));
  if (layout === "workbench") workspace.append(hierarchy, stage, inspector);
  else if (layout === "canvas") { const dock = el("div", "sc-bottom-dock"); dock.append(hierarchy, inspector); workspace.append(stage, dock); }
  else { const notebook = el("div", "sc-notebook"); notebook.append(tabs, hierarchy, inspector); workspace.append(notebook, stage); }
  const info = el("div", "sc-info"); frame.content.append(screenbar, workspace, info);
  const cleanupSwitcher = prototypeSwitcher(frame.shell, variants, layout, () => anyDirty() || history.length > 0);

  function saveHistory() { history.push(copy(screens)); future.length = 0; }
  function choose(id: string) { selected = id; render(); }
  function dialog(title: string, text: string) {
    const d = el("dialog", "lp-dialog sc-dialog"); d.ariaLabel = title;
    d.append(el("h2", "", title), el("p", "", text)); d.onclose = () => d.remove(); frame.shell.append(d); return d;
  }
  function newScreen() {
    const d = dialog("New screen", "Choose a blank screen or ordinary editable Help controls. Changes stay in this preview.");
    const name = el("input"); name.value = "Station Help";
    const starter = select([["panel", "Help panel"], ["blocking", "Help dialog"], ["blank", "Blank screen"]], "panel");
    d.append(labelled("Screen name", name), labelled("Starter", starter), action("Cancel creation", () => d.close()), action("Create screen", () => {
      if (!name.value.trim()) { status("Enter a screen name.", true); return; }
      saveHistory(); const s = help(`custom-${++sequence}`, starter.value === "blocking" ? "blocking" : "panel"); s.name = name.value.trim();
      if (starter.value === "blank") s.nodes = s.nodes.slice(0, 1);
      screens.push(s); screenId = s.id; selected = s.nodes.at(-1)!.id; d.close(); render(); status("Created an editable screen in sample memory.");
    }, true)); d.showModal(); name.focus();
  }
  function render() {
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
    hierarchy.replaceChildren(el("h2", "", layout === "guided" ? "Build your screen" : "Hierarchy"));
    if (context.state === "empty" && !screens.some(s => !s.template)) hierarchy.append(el("p", "muted", "No custom screens yet. Start with a Help panel or blank screen."), action("Create first Help screen", newScreen, true));
    const tree = el("div", "sc-tree"); tree.role = "tree"; tree.ariaLabel = "Screen elements";
    current().nodes.forEach(n => {
      const b = action(`${n.name} · ${n.kind}`, () => choose(n.id)); b.role = "treeitem"; b.ariaSelected = String(selected === n.id); b.dataset.nodeId = n.id;
      b.className = `sc-tree-node${selected === n.id ? " selected" : ""}`;
      b.style.paddingLeft = `${10 + (n.parent === "stack" ? 24 : n.parent === "frame" ? 16 : n.parent ? 8 : 0)}px`;
      b.onkeydown = e => {
        const index = current().nodes.findIndex(x => x.id === selected);
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); choose(current().nodes[Math.max(0, Math.min(current().nodes.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))]!.id); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); const next = e.key === "ArrowLeft" ? target()?.parent : current().nodes.find(n => n.parent === selected)?.id; if (next) choose(next); hierarchy.querySelector<HTMLElement>(`[data-node-id="${selected}"]`)?.focus(); }
      }; tree.append(b);
    }); hierarchy.append(tree);
    const addKind = select(pairs(kinds), "text"); addKind.ariaLabel = "Element type";
    const add = action("Add element", () => {
      saveHistory(); const n = node(`node-${++sequence}`, addKind.value, `New ${addKind.value}`, 344, 360, 300, 48);
      n.parent = current().nodes.some(n => n.id === "stack") ? "stack" : "root"; n.shared = n.kind === "component";
      if (n.kind === "textbutton" || n.kind === "imagebutton") n.actions = [{ kind: current().mode === "panel" ? "hide" : "finish", variable: "help_seen", value: "true" }];
      current().nodes.push(n); current().revision++; selected = n.id; render(); status("Added one sample element.");
    }); add.disabled = current().template;
    hierarchy.append(labelled("Add element type", addKind), add);
    const moves = el("div", "sc-actions");
    for (const [offset, label] of [[-1, "Move element up"], [1, "Move element down"]] as const) {
      const b = action(label, () => {
        const children = current().nodes.filter(n => n.parent === target()!.parent), i = children.findIndex(n => n.id === selected), neighbor = children[i + offset];
        if (!neighbor) { status("The element is already at this edge of its container."); return; }
        saveHistory(); const nodes = current().nodes, a = nodes.indexOf(target()!), b = nodes.indexOf(neighbor); [nodes[a], nodes[b]] = [nodes[b]!, nodes[a]!]; current().revision++; render(); status("Reordered siblings in one sample change.");
      }); b.disabled = current().template || !target()?.parent; moves.append(b);
    }
    const remove = action("Remove element", () => {
      if (current().nodes.some(n => n.parent === selected)) { status("Move or remove this container's children first.", true); return; }
      saveHistory(); current().nodes = current().nodes.filter(n => n.id !== selected); current().revision++; drafts.delete(key()); selected = current().nodes[0]!.id; render(); status("Removed one sample element.");
    }); remove.disabled = current().template || !target()?.parent; moves.append(remove); hierarchy.append(moves);
    hierarchy.append(el("p", "muted sc-note", "Arrow Up/Down selects in the tree. Move buttons reorder siblings. Containers keep their child layout rules."));
  }
  function renderCanvas() {
    canvasObserver?.disconnect();
    stage.replaceChildren();
    const toolbar = el("div", "sc-canvas-toolbar"); toolbar.append(el("h2", "", layout === "canvas" ? "Player view" : "Canvas"));
    const ratio = select(pairs(["1280 × 720", "960 × 720"]), aspect); ratio.ariaLabel = "Sample game dimensions"; ratio.onchange = () => { aspect = ratio.value; renderCanvas(); renderInfo(); };
    const zoomInput = select(pairs(["Fit", "75%", "100%"]), zoom); zoomInput.ariaLabel = "Canvas zoom"; zoomInput.onchange = () => { zoom = zoomInput.value; renderCanvas(); renderInfo(); };
    toolbar.append(ratio, zoomInput); stage.append(toolbar);
    const note = el("p", "sc-canvas-caption", "Layout approximation · sample data · controls select, never run actions"); stage.append(note);
    const scroll = el("div", "sc-canvas-scroll"), canvas = el("div", "sc-game"); canvas.ariaLabel = "Fictional game canvas";
    canvas.style.aspectRatio = aspect === "1280 × 720" ? "16 / 9" : "4 / 3";
    canvas.style.width = zoom === "Fit" ? "100%" : zoom === "75%" ? "750px" : "1000px";
    canvas.append(el("div", "sc-scenery", "THE LAST TRAM"), el("p", "sc-game-dialogue", "Ada  ·  The last tram leaves at midnight."));
    const width = aspect === "1280 × 720" ? 1280 : 960;
    const appearance = sampleAppearance;
    for (const n of current().nodes.filter(n => !["root", "stack"].includes(n.id))) {
      const b = el("button", `sc-canvas-node sc-kind-${n.kind}${selected === n.id ? " selected" : ""}`); b.type = "button"; b.dataset.canvasId = n.id; b.ariaLabel = `Select ${n.name} on canvas`; b.ariaPressed = String(selected === n.id);
      const x = n.coordinates === "relative" ? Number(n.x) * width : Number(n.x), y = n.coordinates === "relative" ? Number(n.y) * 720 : Number(n.y);
      b.style.left = `${100 * x / width}%`; b.style.top = `${100 * y / 720}%`; b.style.width = `${100 * Number(n.width) / width}%`; b.style.height = `${100 * Number(n.height) / 720}%`;
      b.style.transform = `translate(${-100 * Number(n.anchorX)}%,${-100 * Number(n.anchorY)}%)`;
      b.style.color = n.color; b.style.fontWeight = n.bold ? "700" : "400"; b.style.fontStyle = n.italic ? "italic" : "normal"; b.style.textAlign = n.alignment as "left";
      if (n.kind === "text" || n.kind === "textbutton") b.style.fontSize = `${Number(n.size) / 12.8}cqw`;
      if (["frame", "window", "textbutton", "imagebutton", "bar", "viewport", "component"].includes(n.kind)) { b.style.background = n.background; b.style.borderColor = n.border; }
      if (n.kind === "text" || n.kind === "textbutton") b.textContent = n.text.replaceAll("[destination]", sample.destination).replaceAll("[courage]", sample.courage).replaceAll("[help_seen]", sample.help_seen);
      else if (n.kind === "image" || n.kind === "imagebutton") { b.textContent = "Station  •••  Harbour"; b.classList.add("sc-map"); }
      else if (n.kind === "bar") { b.textContent = `${n.variable}  ${sample.courage} / ${n.maximum}`; b.style.background = `linear-gradient(90deg,var(--accent-primary) ${sample.courage}%,var(--surface-panel) ${sample.courage}%)`; }
      else if (!["frame", "fixed"].includes(n.kind)) b.textContent = n.name;
      b.dataset.appearance = appearance;
      b.onclick = () => { if (!gesture) choose(n.id); };
      b.onpointerdown = e => {
        if (selected !== n.id || e.button !== 0) return;
        if (changed()) { status("Apply or cancel this draft before dragging.", true); return; }
        const parent = layoutParent(n);
        if (parent) { status(`The ${parent.kind} arranges this child. Edit spacing or reorder it in the hierarchy.`); return; }
        const resize = e.shiftKey; gesture = { node: copy(n), startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, resize };
        b.setPointerCapture(e.pointerId); e.preventDefault();
      };
      b.onpointermove = e => {
        if (!gesture) return;
        const rect = canvas.getBoundingClientRect(); gesture.dx = Math.round((e.clientX - gesture.startX) * width / rect.width / 8) * 8; gesture.dy = Math.round((e.clientY - gesture.startY) * 720 / rect.height / 8) * 8;
        if (gesture.resize) { b.style.width = `${100 * Math.max(24, Number(n.width) + gesture.dx) / width}%`; b.style.height = `${100 * Math.max(24, Number(n.height) + gesture.dy) / 720}%`; }
        else { b.style.left = `${100 * (x + gesture.dx) / width}%`; b.style.top = `${100 * (y + gesture.dy) / 720}%`; }
        status("Gesture draft. Release to apply once; Escape cancels. Shift-drag resizes. Snapping 8 game pixels.");
      };
      b.onpointerup = () => {
        if (!gesture) return; const g = gesture; gesture = undefined;
        if (g.dx || g.dy) { saveHistory(); if (g.resize) { n.width = String(Math.max(24, Number(n.width) + g.dx)); n.height = String(Math.max(24, Number(n.height) + g.dy)); } else { n.x = String(Number(n.x) + g.dx / (n.coordinates === "relative" ? width : 1)); n.y = String(Number(n.y) + g.dy / (n.coordinates === "relative" ? 720 : 1)); } current().revision++; drafts.delete(key()); render(); status("Applied one canvas gesture. Undo reverses the whole gesture."); }
      };
      b.onkeydown = e => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault(); const parent = layoutParent(n); if (parent) { status(`The ${parent.kind} positions this child. Edit parent spacing or reorder siblings.`); return; }
        const d = draft()!; const coordinate = e.key === "ArrowLeft" || e.key === "ArrowRight" ? "x" : "y"; d[coordinate] = String(Number(d[coordinate]) + ((e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 1) * (e.shiftKey ? 8 : 1) / (d.coordinates === "relative" ? (coordinate === "x" ? width : 720) : 1)); renderInspector(); renderInfo(); status("Keyboard position draft. Apply or Cancel in properties.");
      }; canvas.append(b);
    }
    const canvasHelp = el("p", "muted sc-note", "Select an element, then drag its free-positioned container. Shift-drag resizes. Game dimensions and canvas zoom are separate. The second aspect uses this same layout.");
    scroll.append(canvas); stage.append(scroll, canvasHelp);
    const sampleControls = el("details", "sc-samples"); sampleControls.append(el("summary", "", "Sample data and appearances"));
    sampleControls.open = samplesExpanded; sampleControls.ontoggle = () => { if (sampleControls.isConnected) samplesExpanded = sampleControls.open; };
    const appearanceInput = select(pairs(["normal", "hover", "selected", "disabled"]), sampleAppearance); appearanceInput.ariaLabel = "Sample appearance"; appearanceInput.onchange = () => { sampleAppearance = appearanceInput.value; renderCanvas(); renderInfo(); };
    sampleControls.append(labelled("Sample appearance", appearanceInput));
    variables.forEach(v => { const input = el("input"); input.value = sample[v.id as keyof typeof sample]; input.ariaLabel = `Sample ${v.id}`; input.onchange = () => { if ((v.type === "int" && !/^-?\d+$/.test(input.value)) || (v.type === "bool" && !["true", "false"].includes(input.value))) { status(`Enter a ${v.type} sample value.`, true); return; } sample[v.id as keyof typeof sample] = input.value; renderCanvas(); renderInfo(); }; sampleControls.append(labelled(`${v.id} (${v.type})`, input)); });
    sampleControls.append(el("p", "muted", "Sample values affect this canvas only. They are neither source values nor a reconstructed game state.")); stage.append(sampleControls);
    const journey = el("details", "sc-story"); journey.open = storyExpanded || layout === "guided" && step === "behavior"; journey.ontoggle = () => { if (journey.isConnected) storyExpanded = journey.open; }; journey.append(el("summary", "", "Try the Help story connection"));
    const storyButtons = el("div", "sc-actions");
    storyButtons.append(action("Show screen", () => { if (current().mode === "blocking") { status("Choose a panel for Show; use Call for this blocking screen.", true); return; } storyVisible = true; storyWaiting = false; output = "Help panel is visible. Dialogue can continue."; renderCanvas(); }), action("Hide screen", () => { if (current().mode === "blocking") { status("A called dialog finishes interaction. Hide is for shown panels.", true); return; } storyVisible = false; output = "Help panel hidden."; renderCanvas(); }), action("Call screen", () => { if (current().mode !== "blocking") { status("Choose Help dialog for Call. This sample qualifies its blocking context.", true); return; } storyVisible = true; storyWaiting = true; output = "Waiting for Help dialog to finish. Underlying interaction is blocked."; renderCanvas(); }), action("Continue dialogue", () => { output = storyWaiting ? "Dialog still blocks dialogue. Close it first." : storyVisible ? "Ada continues speaking; Help stays visible." : "Ada continues speaking."; renderCanvas(); }));
    const dismiss = () => { if (!storyVisible) { output = "No active screen interaction to dismiss."; renderCanvas(); return; } storyVisible = false; if (storyWaiting) { storyWaiting = false; continuations++; } output = `Dismissed using ${current().mode === "panel" ? "Hide" : "Finish interaction"}. Continuations ${continuations}.`; renderCanvas(); };
    storyButtons.append(action(current().mode === "panel" ? "Close shown panel" : "Finish called interaction", dismiss), action("Simulate game Escape", dismiss), action("Click outside sample", () => { output = "Outside click leaves the screen open."; renderCanvas(); }));
    journey.append(storyButtons, el("p", "sc-story-status", `${output} Visible ${storyVisible}. Waiting ${storyWaiting}. Continuations ${continuations}.`), el("p", "muted", "Story connection simulation. Real Show/Hide/Call Beats, keyboard focus and dismissal still need product integration and SDK proof.")); stage.append(journey);
    if (layout === "canvas") {
      const side = el("div", "sc-canvas-side"); side.append(note, canvasHelp, sampleControls, journey); stage.append(side);
    }
    const fit = () => {
      if (zoom !== "Fit") return;
      canvas.style.width = `${Math.max(1, Math.min(scroll.clientWidth - 8, (scroll.clientHeight - 8) * width / 720))}px`;
    };
    canvasObserver = new ResizeObserver(fit); canvasObserver.observe(scroll); fit();
  }
  function renderInspector() {
    inspector.replaceChildren(); const d = draft(); if (!d) return;
    inspector.append(el("h2", "", d.name));
    const state = el("p", "sc-draft-status"); state.textContent = changed() ? "Property draft · not applied" : "Saved sample values"; inspector.append(state);
    if (current().template) inspector.append(el("p", "sc-protected", "Protected template. Required IDs, parameters, actions and dynamic controls stay fixed. Edit supported layout and appearance only. Sample who/what and list items are fictional."));
    const applyBar = el("div", "sc-apply"); applyBar.append(action("Apply properties", () => applyDraft()), action("Cancel properties", () => { drafts.delete(key()); renderInspector(); renderInfo(); status("Cancelled property draft. Saved sample values restored."); })); inspector.append(applyBar);
    const group = (title: string, opened = false) => { const details = el("details", "sc-property-group"); details.open = opened; details.append(el("summary", "", title)); inspector.append(details); return details; };
    const input = (parent: HTMLElement, title: string, property: keyof ScreenNode, type = "text", disabled = false) => {
      const control = el(type === "textarea" ? "textarea" : "input") as HTMLInputElement | HTMLTextAreaElement;
      if (control instanceof HTMLInputElement) control.type = type === "textarea" ? "text" : type;
      control.value = String(d[property]); control.disabled = disabled;
      control.oninput = () => { (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Property draft · not applied"; renderInfo(); };
      parent.append(labelled(title, control)); return control;
    };
    const choice = (parent: HTMLElement, title: string, property: keyof ScreenNode, options: readonly (readonly [string, string])[]) => { const control = select(options, String(d[property])); control.onchange = () => {
      if (property === "coordinates" && control.value !== d.coordinates) {
        const width = aspect === "1280 × 720" ? 1280 : 960, divisor = control.value === "relative" ? 1 : -1;
        d.x = String(Number(d.x) * Math.pow(width, -divisor)); d.y = String(Number(d.y) * Math.pow(720, -divisor));
      }
      (d as unknown as Record<string, unknown>)[property] = control.value; state.textContent = "Property draft · not applied";
      if (property === "coordinates" || property === "parent") renderInspector(); renderInfo();
    }; parent.append(labelled(title, control)); return control; };
    const check = (parent: HTMLElement, title: string, property: "bold" | "italic" | "aspect") => { const control = el("input"); control.type = "checkbox"; control.checked = d[property]; control.onchange = () => { d[property] = control.checked; state.textContent = "Property draft · not applied"; renderInfo(); }; parent.append(labelled(title, control)); };
    const content = group("Content and asset", true);
    input(content, "Element name", "name");
    if (["text", "textbutton", "component"].includes(d.kind)) { input(content, "Text content", "text", "textarea", current().template); content.append(el("p", "muted", "Use [destination], [courage] or [help_seen] to display an existing variable.")); }
    if (["image", "imagebutton"].includes(d.kind)) { choice(content, "UI image asset", "asset", pairs(["tram-map.webp", "help-symbol.png", "paper-panel.jpg"])); check(content, "Preserve image aspect", "aspect"); content.append(el("p", "muted", "Asset and aspect controls retain sample values. The canvas uses one map placeholder; real image loading and aspect sizing are later product work.")); }
    content.append(action("Import font or UI image", () => { const modal = dialog("Project asset picker", "Simulated project-owned assets. TTF/OTF fonts and PNG/JPEG/WebP UI images need typed import/discovery integration in the product."); modal.append(el("p", "", "NotoSans-Regular.ttf · NotoSerif-Regular.otf · tram-map.webp · help-symbol.png"), action("Use sample UI image", () => { d.asset = "help-symbol.png"; modal.close(); renderInspector(); status("Selected fictional project asset. Apply to keep the draft."); }), action("Close asset picker", () => modal.close())); modal.showModal(); }));
    const position = group("Layout", layout !== "guided" || step === "layout");
    const containers = current().nodes.filter(n => n.id !== d.id && ["fixed", "frame", "window", "vbox", "hbox", "grid", "viewport"].includes(n.kind));
    if (d.parent) choice(position, "Parent container", "parent", containers.map(n => [n.id, `${n.name} (${n.kind})`])).disabled = current().template;
    choice(position, "Coordinate units", "coordinates", [["px", "Game pixels"], ["relative", "Relative (0 to 1)"]]);
    const numbers = el("div", "sc-number-grid");
    for (const [property, title] of [["x", "X position"], ["y", "Y position"], ["width", "Width"], ["height", "Height"], ["anchorX", "X anchor"], ["anchorY", "Y anchor"], ["minWidth", "Minimum width"], ["maxWidth", "Maximum width"], ["padding", "Padding"], ["spacing", "Spacing"]] as const) input(numbers, title, property, "number"); position.append(numbers);
    choice(position, "Alignment", "alignment", pairs(["left", "center", "right"]));
    position.append(el("p", "muted", "Position, size and anchors change the sample rectangle. Limits, padding, spacing and parent changes retain values only; the canvas does not calculate container reflow."));
    if (layoutParent(d)) position.append(el("p", "muted", `Parent ${layoutParent(d)!.kind} governs child placement. Reorder siblings or edit parent spacing. The prototype uses fixed sample geometry; real container reflow remains product work.`));
    const appearance = group("Text and appearance");
    choice(appearance, "Project font", "font", pairs(["NotoSans-Regular.ttf", "NotoSerif-Regular.otf"])); input(appearance, "Text size", "size", "number"); input(appearance, "Text color", "color"); check(appearance, "Bold", "bold"); check(appearance, "Italic", "italic"); input(appearance, "Background color", "background"); input(appearance, "Border color", "border");
    appearance.append(el("p", "muted", `The ${sampleAppearance} sample uses a fixed visual effect. Colors, bold, italic and scaled text size change the canvas. Font choice retains a value while the canvas keeps its CSS font. Separate per-state style values and native text metrics require later product work.`));
    const reusable = group("Shared style and component");
    reusable.append(el("p", "", d.shared ? "Shared Help heading style. Also used by Help panel and Help dialog." : "Independent element. Changes affect only this screen."), action("Use shared Help style", () => { d.shared = true; renderInspector(); renderInfo(); }), action("Make independent copy", () => { d.shared = false; renderInspector(); renderInfo(); status("Independent-copy draft. Apply to detach this use."); }));
    reusable.append(el("p", "muted", "Components have no parameters. Applying a shared style lists affected screens first."));
    if (["bar", "viewport"].includes(d.kind)) { const bindings = group("Variable binding and limits", true); choice(bindings, "Integer variable", "variable", [["courage", "courage (Integer)"]]); input(bindings, "Lower limit", "minimum", "number"); input(bindings, "Upper limit", "maximum", "number"); bindings.append(el("p", "muted", "Bar binds to an existing integer variable. Viewport scrolling is an inert illustration here.")); }
    if (["textbutton", "imagebutton"].includes(d.kind)) renderActions(group("Ordered button actions", true), d);
    const limits = group("Source and coverage"); limits.append(el("p", "sc-protected", "Partial coverage · custom Python neighbor preserved. General Python, unsupported expressions, arbitrary actions and dynamic imports stay in Source."), el("pre", "sc-source", sourceSummary()), action("View in Source", () => showSource()), action("Reconcile supported Source edit", () => {
      const modal = dialog("Supported Source edit", "Simulate changing only this element's text in Source. The protected neighboring block stays intact.");
      const text = el("textarea"); text.value = target()!.text; modal.append(labelled("Source text value", text), action("Cancel source edit", () => modal.close()), action("Reconcile text change", () => { if (current().template) { status("This template text is a protected runtime binding.", true); return; } saveHistory(); target()!.text = text.value; current().revision++; drafts.delete(key()); modal.close(); render(); status("Reconciled supported text in sample memory; custom neighbor retained."); })); modal.showModal();
    }));
  }
  function renderActions(parent: HTMLElement, d: ScreenNode) {
    if (current().template) { parent.append(el("p", "sc-protected", "Template actions are protected. This adapter keeps its required Ren'Py behavior.")); return; }
    parent.append(el("p", "", current().mode === "panel" ? "Panel dismissal uses Hide screen. Close and game Escape dismiss; outside click keeps it open." : "Called dialog dismissal uses Finish interaction. Finish must be the last action. Close and game Escape dismiss; outside click keeps it open."));
    d.actions.forEach((a, index) => {
      const row = el("div", "sc-action-row"); row.append(el("span", "", `${index + 1}. ${a.kind === "set" ? `Set ${a.variable} = ${a.value}` : a.kind === "hide" ? "Hide this screen" : "Finish interaction"}`));
      for (const [offset, label] of [[-1, "up"], [1, "down"]] as const) { const b = action(`Move action ${index + 1} ${label}`, () => { const next = index + offset; const candidate = copy(d.actions); [candidate[index], candidate[next]] = [candidate[next]!, candidate[index]!]; if (candidate.findIndex(x => x.kind === "finish") >= 0 && candidate.at(-1)!.kind !== "finish") { status("Finish interaction must stay last.", true); return; } d.actions = candidate; renderInspector(); renderInfo(); }); b.disabled = index + offset < 0 || index + offset >= d.actions.length; row.append(b); }
      row.append(action(`Remove action ${index + 1}`, () => { d.actions.splice(index, 1); renderInspector(); renderInfo(); })); parent.append(row);
    });
    const type = select([["set", "Set existing variable"], [current().mode === "panel" ? "hide" : "finish", current().mode === "panel" ? "Hide this screen" : "Finish interaction"]], "set");
    const variable = select(variables.map(v => [v.id, `${v.id} (${v.type})`]), "help_seen"), value = el("input"); value.value = "true";
    variable.onchange = () => { value.value = variables.find(v => v.id === variable.value)!.value; };
    parent.append(labelled("Action type", type), labelled("Action variable", variable), labelled("Literal value", value), action("Add action", () => {
      if (type.value === "set") {
        const t = variables.find(v => v.id === variable.value)!.type;
        if ((t === "bool" && !["true", "false"].includes(value.value)) || (t === "int" && !/^-?\d+$/.test(value.value))) { status("Enter a literal matching the selected variable type.", true); return; }
      }
      const a: Action = { kind: type.value as Action["kind"], variable: variable.value, value: value.value };
      if (a.kind === "finish" && d.actions.some(x => x.kind === "finish")) { status("Finish interaction already ends this sequence.", true); return; }
      const finish = d.actions.findIndex(x => x.kind === "finish"); if (finish >= 0) d.actions.splice(finish, 0, a); else d.actions.push(a);
      renderInspector(); renderInfo(); status("Added an action draft. Actions stay inert on the canvas.");
    }));
  }
  function applyDraft(confirmed = false) {
    const d = draft(); if (!d || !changed()) { status("No property changes to apply."); return; }
    for (const field of ["x", "y", "width", "height", "anchorX", "anchorY", "minWidth", "maxWidth", "padding", "spacing", "size"] as const) {
      if (!d[field].trim() || !Number.isFinite(Number(d[field])) || (!["x", "y"].includes(field) && Number(d[field]) < 0)) { status(`Invalid ${field}. Your draft is retained.`, true); return; }
    }
    if (Number(d.width) <= 0 || Number(d.height) <= 0 || Number(d.anchorX) > 1 || Number(d.anchorY) > 1 || Number(d.minWidth) > Number(d.maxWidth)) { status("Check positive sizes, anchors from 0 to 1, and size limits. Draft retained.", true); return; }
    const seen = new Set([d.id]); let parent = d.parent;
    while (parent) { if (seen.has(parent)) { status("A container cannot become its own descendant. Draft retained.", true); return; } seen.add(parent); parent = current().nodes.find(n => n.id === parent)?.parent ?? ""; }
    if (![d.color, d.background, d.border].every(c => /^#[0-9a-f]{6}$/i.test(c))) { status("Use six-digit hex colors. Your draft is retained.", true); return; }
    if (conflict) { status("Source conflict. Property draft retained; reconcile the saved revision before Apply.", true); renderInfo(); return; }
    const affected = screens.filter(s => s.nodes.some(n => n.shared));
    if (d.shared && affected.length > 1 && !confirmed) {
      const modal = dialog("Apply shared style?", `This style also changes ${affected.map(s => s.name).join(", ")}. Text content stays local to the selected element.`);
      modal.append(action("Keep draft", () => modal.close()), action("Make a copy instead", () => { d.shared = false; modal.close(); renderInspector(); renderInfo(); }), action("Apply to all listed screens", () => { modal.close(); applyDraft(true); }, true)); modal.showModal(); return;
    }
    saveHistory(); current().nodes[current().nodes.findIndex(n => n.id === selected)] = copy(d); current().revision++;
    if (d.shared) screens.filter(s => s.id !== screenId).forEach(s => s.nodes.filter(n => n.shared).forEach(n => { for (const property of ["font", "size", "color", "bold", "italic", "background", "border"] as const) Object.assign(n, { [property]: d[property] }); s.revision++; }));
    drafts.delete(key()); render(); status("Applied properties in one sample undo entry.");
  }
  function sourceSummary() {
    const n = target(); return `# Illustrative source; not a serializer\nscreen ${current().id.replaceAll("-", "_")}():\n    # ${current().mode}; ${current().nodes.length} editable sample nodes\n    ${n?.kind ?? "fixed"} ${JSON.stringify(n?.text ?? "")}:\n        xpos ${n?.x ?? 0}\n        ypos ${n?.y ?? 0}\n\n# Protected neighbor (unchanged)\ninit python:\n    def custom_help_logic():\n        return "source only"`;
  }
  function showSource() { const d = dialog("Screen source and protected regions", "Illustrative source navigation. Actual source ownership, editing and transaction integration are separate product work."); d.append(el("pre", "sc-source", sourceSummary()), action("Close source view", () => d.close())); d.showModal(); }
  function renderInfo() {
    info.replaceChildren();
    const saved = el("span", "sc-revision", `Sample revision ${current().revision} · ${changed() ? "Draft retained" : "Saved sample"} · ${previewScreenId !== screenId ? "No native preview for this screen" : previewRevision !== current().revision ? "Preview stale" : "Preview request matches sample"}`);
    info.append(saved, action("Source limits", showSource));
    if (conflict) info.append(el("span", "sc-conflict", "Source conflict"), action("Rebase retained sample draft", () => { conflict = false; renderInfo(); status("Simulated conflict resolved. Draft retained for explicit Apply."); }));
    const state = el("details", "sc-state"); state.append(el("summary", "", "Prototype state and limits"), el("pre", "", JSON.stringify({ layout, screen: current().name, behavior: current().mode, selected, propertyDrafts: [...drafts.keys()].filter(id => { const [sid, nid] = id.split(":"); return JSON.stringify(screens.find(s => s.id === sid)?.nodes.find(n => n.id === nid)) !== JSON.stringify(drafts.get(id)); }), revision: current().revision, undoEntries: history.length, redoEntries: future.length, conflict, appearance: sampleAppearance, sampleValues: sample, gameDimensions: aspect, canvasZoom: zoom, runtime: lastPreview }, null, 2)), el("p", "", "Browser memory only. The canvas approximates geometry and fonts. Source serialization, asset imports, template adapters, per-state styles, sharing, runtime preview, keyboard focus and native dismissal need product integration and their named checks.")); info.append(state);
  }
  const escape = (e: KeyboardEvent) => { if (e.key === "Escape" && gesture) { e.preventDefault(); gesture = undefined; renderCanvas(); status("Cancelled canvas gesture. Saved values unchanged."); } };
  document.addEventListener("keydown", escape); render();
  return () => { document.removeEventListener("keydown", escape); canvasObserver?.disconnect(); cleanupSwitcher(); };
}
