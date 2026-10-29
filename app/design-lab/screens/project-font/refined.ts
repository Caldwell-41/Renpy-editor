// A2 refines A: compare the current text in project fonts, edit, then Apply. Memory only.
import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { coordinates, labels, unitFor, validate as validateLayout } from "../nested-layout/refined-model.ts";
import "../ui-image/style.css";
import "./style.css";
import "./refined.css";

type Variant = "refined" | "inspector" | "library" | "strip";
type Fields = Record<string, string>;
interface TextNode { id: string; text: string; font: string; size: string; color: string; align: string; bold: string; italic: string; layout: Fields }
interface Font { id: string; name: string; path: string; format: string; family: string; status: "ready" | "missing" | "invalid" }
const clone = <T,>(x: T): T => structuredClone(x);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const variants: Variant[] = ["refined", "inspector", "library", "strip"];
const names = ["A2 · Text inspector", "A · Inspector & chooser", "B · Inline font browser", "C · Formatting strip"];
const fontFixture = (): Font[] => [
  { id: "tram", name: "Tram Sans", path: "fonts/tram-sans.ttf", format: "TTF", family: "sans-serif", status: "ready" },
  { id: "wayfarer", name: "Wayfarer Serif", path: "fonts/wayfarer.otf", format: "OTF", family: "serif", status: "ready" },
  { id: "signal", name: "Signal Mono", path: "fonts/signal-mono.ttf", format: "TTF", family: "monospace", status: "ready" },
];
const node = (id: string, text: string, size: string): TextNode => ({ id, text, font: "tram", size, color: "#f1e9d6", align: "0.0", bold: "", italic: "", layout: { xpos: "0", xanchor: "0", xunit: "px", xaunit: "px", xsize: "640" } });
export const mount: LabMount = (host, context) => {
  const variant: Variant = "refined";
  const fonts = fontFixture();
  if (context.state === "missing" || context.state === "invalid") fonts[0]!.status = context.state;
  let nodes = [node("title", "Help", "38"), node("body", "Choose a route.\nThe last tram leaves at midnight.", "26")];
  if (context.state === "long") nodes[1]!.text = "Choose a route before the last tram leaves at midnight. You can return to the map at any time. Some routes open only after you speak to the driver.\n\nClick or press Enter to advance. Press H to hide the interface.";
  const expressions = context.state === "expression";
  if (expressions) { nodes[1]!.text = '_("Choose a route.")'; nodes[1]!.font = "gui.text_font"; nodes[1]!.size = "gui.text_size"; }
  let selected = "body", step = "design", conflict = context.state === "conflict", focused = false;
  let history: TextNode[][] = [], future: TextNode[][] = [];
  const drafts = new Map<string, TextNode>();
  let feedback = "Ready", lastApplied = "";
  const problems = new Map<string, { key: string; text: string }>();
  const scrolls = new Map<string, number>(), disclosures = new Map<string, Set<string>>();
  const problem = () => problems.get(selected);
  const rememberScroll = () => { const body = editor.querySelector(".ui-editor-body"); if (body) scrolls.set(`${selected}/${step}`, body.scrollTop); };
  const clearProblem = () => problems.delete(selected);
  let modal: HTMLDialogElement | null = null;
  const current = () => nodes.find(n => n.id === selected)!;
  const value = () => drafts.get(selected) ?? current();
  const fontFor = (id = value().font) => fonts.find(f => f.id === id);
  const unsupported = (key: string) => expressions && selected === "body" && ["text", "font", "size"].includes(key);
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: () => drafts.size > 0 });
  frame.shell.classList.add("image-lab", "font-lab", "font-refined"); frame.shell.dataset.fontVariant = variant;
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "#39 · A2 · Prototype";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Prototype · Memory only";
  const undo = action("Undo", () => travel(history, future)), redo = action("Redo", () => travel(future, history));
  const source = action("Source", () => openSource()); frame.tools.append(undo, redo, source);
  const address = el("div", "ui-address", "Help / game/ui/help.rpy");
  const rail = el("nav", "ui-rail"); rail.ariaLabel = "Screen building steps";
  for (const [id, name] of [["choose", "1  Choose"], ["design", "2  Design"], ["connect", "3  Connect"]]) {
    const b = action(name!, () => { rememberScroll(); step = id!; renderEditor(); sync(); }); b.dataset.step = id; rail.append(b);
  }
  const work = el("div", "ui-work"), stage = el("section", "ui-stage"), editor = el("section", "ui-editor");
  editor.ariaLabel = "Text editor"; stage.ariaLabel = "Screen canvas";
  const stageHead = el("div", "ui-stage-heading");
  const resolution = select("Sample resolution", [["1280", "1280 × 720"], ["1024", "1024 × 768"]], "1280", draw);
  const focus = action("Focus preview", () => { focused = !focused; work.dataset.focus = String(focused); focus.textContent = focused ? "Back to editing" : "Focus preview"; requestAnimationFrame(draw); });
  const editJump = action("Edit text", () => { editor.scrollIntoView({ block: "start" }); editor.querySelector<HTMLElement>('[data-field="text"]')?.focus(); }); editJump.classList.add("pfr-compact");
  stageHead.append(el("h2", "", "Help"), resolution, focus, editJump);
  const canvasWrap = el("div", "ui-canvas-wrap"), canvas = el("div", "ui-canvas pf-canvas"); canvas.ariaLabel = "Schematic Help canvas"; canvasWrap.append(canvas);
  const path = el("nav", "ui-path"); path.ariaLabel = "Selection path";
  const previewState = el("p", "ui-caption");
  const previewFoot = el("div", "pf-preview-foot"); previewFoot.append(previewState, action("Test in Ren'Py", () => dialog("Test accepted source", d => {
    d.append(el("p", "", drafts.size ? "Your draft is kept. A real test would use the last accepted source, without these edits." : "A real test would use accepted source at the project resolution."), el("p", "ui-note", "This sample starts no SDK. Actual font use, wrapping and placement need Ren'Py qualification."), action("Close", () => d.close()));
  })));
  const coverage = el("div", "ui-coverage"); coverage.append(el("span", "", "Partial coverage · Custom footer stays in Source"), action("Inspect footer", () => openSource()));
  stage.append(stageHead, canvasWrap, path, previewFoot, coverage);
  const state = el("details", "ui-state"), stateText = el("pre"); state.append(el("summary", "", "Prototype tools"), el("p", "ui-note", "Fonts use browser family stand-ins. Files, source, history and reopen are simulated."), stateText, action("Simulate reopen", reopen)); stage.append(state);
  work.append(stage, editor); frame.content.append(address, rail, work);
  const switcher = el("div", "ui-switcher"); switcher.ariaLabel = "Prototype variants";
  switcher.append(action("Previous variant", () => switchVariant(-1)), el("span", "", names[variants.indexOf(variant)]!), action("Next variant", () => switchVariant(1))); frame.shell.append(switcher);
  let applyButton: HTMLButtonElement, cancelButton: HTMLButtonElement, error: HTMLElement, draftLabel: HTMLElement, commitState: HTMLElement, sourceRepair: HTMLButtonElement;
  function report(text: string) { feedback = text; frame.status.textContent = text; }
  function edit(key: string, text: string, layout = false) {
    if (unsupported(key)) return;
    const next = clone(value()); if (layout) next.layout[key] = text; else (next as unknown as Fields)[key] = text;
    same(next, current()) ? drafts.delete(selected) : drafts.set(selected, next); if (problem()?.key === key) clearProblem(); lastApplied = ""; sync();
  }
  function choose(id: string) { rememberScroll(); selected = id; step = "design"; renderEditor(); sync(); }
  function input(key: string, name: string, multiline = false, layout = false) {
    const n = value(), field = multiline ? el("textarea") : el("input");
    field.value = layout ? n.layout[key] ?? "" : (n as unknown as Fields)[key]!;
    field.dataset.field = key; field.readOnly = unsupported(key); field.placeholder = "Default";
    if (field instanceof HTMLTextAreaElement) field.rows = 3;
    else if (key === "size" || layout) field.inputMode = "decimal";
    field.oninput = () => edit(key, field.value, layout);
    field.onkeydown = e => { if (e.key === "Enter" && !multiline || e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); apply(); } else if (e.key === "Escape") { e.preventDefault(); cancel(); } };
    const label = labelled(name, field);
    if (unsupported(key)) { const note = el("span", "pf-expression"); note.append(el("span", "", "Expression"), action("Edit in Source", openSource)); label.append(note); }
    const message = el("p", "pfr-field-error"); message.dataset.error = key; message.id = `font-${selected}-${key}-error`; message.role = "alert"; message.hidden = true; field.setAttribute("aria-describedby", message.id); label.append(message);
    if (key === "color") { const swatch = el("span", "pfr-color"); swatch.ariaHidden = "true"; swatch.dataset.swatch = ""; label.append(swatch); }
    return label;
  }
  function group(name: string) { const g = el("section", "ui-group"); g.append(el("h3", "", name)); return g; }
  function fontTrigger() {
    const f = fontFor(), row = action("", openPicker); row.classList.add("pf-font-trigger"); row.dataset.field = "font"; row.ariaLabel = "Choose project font";
    if (unsupported("font")) { row.onclick = openSource; row.ariaLabel = "Edit font expression in Source"; row.append(el("code", "", value().font), el("small", "", "Expression"), el("span", "pf-change", "Source…")); }
    else { row.append(el("strong", "", f?.name ?? "Default font"), el("small", "", f ? `${f.path} · ${f.format}` : "Inherit from the screen style"), el("span", "pf-change", "Choose…")); }
    return row;
  }
  function typography() {
    const g = group("Typography");
    g.append(fontTrigger());
    const warning = el("div", "pf-font-warning"); warning.dataset.fontWarning = ""; warning.id = `font-${selected}-font-error`;
    const warningText = el("p"); warningText.dataset.warningText = "";
    warning.append(warningText, action("Choose another font", openPicker)); g.append(warning);
    g.querySelector('[data-field="font"]')?.setAttribute("aria-describedby", warning.id);
    const fields = el("div", "ui-fields pf-type-fields"); fields.append(input("size", "Size · px"), input("color", "Color"));
    fields.append(labelled("Text alignment", select("Text alignment", [["", "Default"], ["0.0", "Left"], ["0.5", "Center"], ["1.0", "Right"]], value().align, v => edit("align", v))));
    const emphasis = el("div", "pf-emphasis"); emphasis.append(labelled("Bold", select("Bold", [["", "Default"], ["True", "On"], ["False", "Off"]], value().bold, v => edit("bold", v))), labelled("Italic", select("Italic", [["", "Default"], ["True", "On"], ["False", "Off"]], value().italic, v => edit("italic", v)))); fields.append(emphasis); g.append(fields); return g;
  }
  function layout() {
    const owner = selected, details = el("details", "ui-group pf-layout"); details.open = disclosures.get(selected)?.has("layout") ?? false; details.append(el("summary", "", "Layout")); details.ontoggle = () => rememberDisclosure("layout", details.open, owner);
    details.append(el("p", "ui-note", "Inside Help content · Vertical group. The group sets vertical placement. Text alignment only aligns lines inside the text box."));
    const fields = el("div", "ui-fields");
    for (const key of coordinates) {
      const field = input(key, labels[key]!, false, true), control = field.querySelector("input")!;
      const locked = key.startsWith("y"); if (locked) { control.readOnly = true; control.placeholder = "From group"; }
      const units = select(`${labels[key]} unit`, [["px", "px"], ["relative", "fraction"]], value().layout[unitFor[key]!] ?? "px", v => edit(unitFor[key]!, v, true)); units.disabled = locked; field.append(units); fields.append(field);
    }
    details.append(fields);
    const shortcuts = el("div", "pf-shortcuts");
    for (const [name, number] of [["Left", "0"], ["Center", "0.5"], ["Right", "1"]]) shortcuts.append(action(`Place ${name!.toLowerCase()}`, () => { const next = clone(value()); next.layout.xpos = next.layout.xanchor = number!; next.layout.xunit = next.layout.xaunit = "relative"; drafts.set(selected, next); renderEditor(); sync(); }));
    details.append(shortcuts); const sizes = el("div", "ui-fields"); for (const key of ["xsize", "ysize"]) sizes.append(input(key, labels[key]!, false, true)); details.append(sizes);
    const limits = el("details", "ui-group"); limits.open = disclosures.get(selected)?.has("limits") ?? false; limits.ontoggle = () => rememberDisclosure("limits", limits.open, owner); limits.append(el("summary", "", "Size limits")); const lf = el("div", "ui-fields"); for (const key of ["xminimum", "xmaximum", "yminimum", "ymaximum"]) lf.append(input(key, labels[key]!, false, true)); limits.append(lf); details.append(limits);
    return details;
  }
  function renderEditor() {
    const oldScroll = scrolls.get(`${selected}/${step}`) ?? 0;
    editor.replaceChildren(); const heading = el("div", "ui-editor-head"); draftLabel = el("span", "ui-draft"); heading.append(el("h2", "", selected === "title" ? "Heading text" : "Help text"), draftLabel);
    const previewJump = action("Show preview", () => { stage.scrollIntoView({ block: "start" }); stageHead.tabIndex = -1; stageHead.focus(); }); previewJump.classList.add("pfr-compact"); heading.append(previewJump); editor.append(heading);
    const body = el("div", "ui-editor-body"); editor.append(body);
    if (step === "choose") {
      body.append(el("h3", "", "Help"), el("p", "ui-note", "Free layout / Help frame / Vertical group"));
      for (const n of nodes) { const b = action(`${n.id === "title" ? "Heading" : "Body"} · ${drafts.has(n.id) ? "Draft" : "Text"}`, () => choose(n.id)); b.classList.add("ui-tree-row"); body.append(b); }
      body.append(action("Custom footer · Source", () => openSource()));
    } else if (step === "connect") body.append(el("p", "ui-note", "Text displays content and has no game action."), action("Back to text", () => { step = "design"; renderEditor(); sync(); }));
    else {
      const content = el("section", "ui-group pfr-content"); content.append(input("text", "Text", true)); body.append(content, typography(), layout());
    }
    const commit = el("div", "ui-commit"); error = el("p", "ui-feedback"); error.role = "alert"; error.hidden = true;
    applyButton = action("Apply", apply, true); applyButton.dataset.apply = ""; cancelButton = action("Cancel", cancel); cancelButton.dataset.cancelDraft = "";
    const actions = el("div", "ui-actions"); actions.append(applyButton, cancelButton);
    commitState = el("p", "pfr-commit-state"); sourceRepair = action("Review Source", openSource); sourceRepair.hidden = true;
    commit.append(error, sourceRepair, commitState, actions); editor.append(commit); body.scrollTop = oldScroll;
  }
  function validate() {
    const n = value(), f = fontFor();
    if (!unsupported("font") && n.font && (!f || f.status !== "ready")) return { key: "font", text: f?.status === "missing" ? "Font missing. Restore the file or choose another project font." : "This font cannot be read. Choose another TTF or OTF font." };
    if (!unsupported("size") && n.size && (!/^\d+$/.test(n.size) || +n.size < 1 || +n.size > 512)) return { key: "size", text: "Use a whole size from 1 to 512 px, or clear it for the default." };
    if (n.color && !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(n.color)) return { key: "color", text: "Use a hex color such as #f1e9d6, or clear it for the default." };
    const problem = validateLayout({ id: n.id, kind: "text", parent: "stack", text: n.text, props: n.layout }, { id: n.id, kind: "text", parent: "stack", text: current().text, props: current().layout }, { id: "stack", kind: "vbox", parent: "frame", text: "", props: {} }, 0);
    if (problem) return { key: problem.key, text: problem.text };
    if (conflict) return { key: "", text: "Source changed. Review the accepted source. Your draft is kept." };
  }
  function apply() {
    const invalid = validate(); if (invalid) { problems.set(selected, { ...invalid, text: `${invalid.text} Your edits are kept.` }); sync();
      const field = editor.querySelector<HTMLElement>(`[data-field="${invalid.key}"]`); if (field) { let parent = field.parentElement; while (parent && parent !== editor) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; } field.focus(); } return; }
    if (!drafts.has(selected) || same(value(), current())) { drafts.delete(selected); clearProblem(); report("No changes to apply."); sync(); return; }
    history.push(clone(nodes)); future = []; nodes = nodes.map(n => n.id === selected ? clone(value()) : n); drafts.delete(selected); clearProblem(); lastApplied = selected; report("Text applied."); sync();
  }
  function cancel() { const key = (document.activeElement as HTMLElement)?.dataset.field; rememberScroll(); drafts.delete(selected); clearProblem(); lastApplied = ""; renderEditor(); sync(); if (key) editor.querySelector<HTMLElement>(`[data-field="${key}"]`)?.focus(); report("Text changes cancelled."); }
  function travel(from: TextNode[][], to: TextNode[][]) {
    if (drafts.size) { problems.set(selected, { key: "", text: "Apply or cancel pending edits before using history. Your drafts are kept." }); sync(); return; }
    if (!from.length) return; rememberScroll(); to.push(clone(nodes)); nodes = from.pop()!; problems.clear(); lastApplied = ""; renderEditor(); sync(); report("Sample history restored.");
  }
  function reopen() { if (drafts.size) { problems.set(selected, { key: "", text: "Apply or cancel pending edits before reopening. Your drafts are kept." }); sync(); return; } history = []; future = []; renderEditor(); sync(); report("Accepted sample text reopened in memory."); }
  function sync() {
    undo.disabled = !history.length; redo.disabled = !future.length;
    if (applyButton) {
      const invalid = problem(); applyButton.disabled = !drafts.has(selected); cancelButton.disabled = !drafts.has(selected);
      error.hidden = !invalid || !!invalid.key; error.textContent = invalid?.text ?? "";
      sourceRepair.hidden = !conflict || !invalid || !!invalid.key;
      draftLabel.textContent = drafts.has(selected) ? "Draft" : "";
      commitState.textContent = drafts.has(selected) ? "Changes apply to this text only." : lastApplied === selected ? "Text applied" : "";
      commitState.hidden = !commitState.textContent;
      for (const message of editor.querySelectorAll<HTMLElement>('[data-error]')) { message.hidden = message.dataset.error !== invalid?.key; message.textContent = message.hidden ? "" : invalid?.text ?? ""; }
      for (const field of editor.querySelectorAll<HTMLElement>('[data-field]')) field.setAttribute("aria-invalid", String(!!invalid?.key && field.dataset.field === invalid.key));
    }
    rail.querySelectorAll<HTMLButtonElement>("button").forEach(b => b.ariaPressed = String(b.dataset.step === step));
    const f = fontFor(), warning = editor.querySelector<HTMLElement>("[data-font-warning]");
    if (warning) {
      warning.hidden = unsupported("font") || !value().font || f?.status === "ready";
      warning.setAttribute("role", problem()?.key === "font" ? "alert" : "status");
      warning.querySelector<HTMLElement>('[data-warning-text]')!.textContent = f?.status === "missing" ? "Font missing. Your edits are kept. Restore the file or choose another font." : "Font unreadable. Your edits are kept. Choose another TTF or OTF.";
    }
    const swatch = editor.querySelector<HTMLElement>('[data-swatch]'); if (swatch) { swatch.style.backgroundColor = validColor(value().color) ? value().color : "transparent"; }
    stateText.textContent = JSON.stringify({ variant, selected, accepted: nodes, drafts: [...drafts.values()], fonts, conflict, history: history.length, redo: future.length, feedback }, null, 2);
    path.replaceChildren(); for (const label of ["Help", "Help frame", "Vertical group"]) path.append(action(label, () => report("Existing container controls retain their approved scope. Select a text element below.")));
    for (const n of nodes) { const b = action(`${n.id === "title" ? "Heading" : "Body"}${drafts.has(n.id) ? " · Draft" : ""}`, () => choose(n.id)); b.ariaPressed = String(n.id === selected); path.append(b); }
    const invalid = validate();
    const fallback = !unsupported("font") && value().font && fontFor()?.status !== "ready";
    previewState.textContent = `${drafts.size ? "Draft" : "Accepted"} · Schematic${fallback ? " · Fallback font" : invalid?.key === "size" || invalid?.key === "color" ? " · Last valid typography" : ""}`; draw();
  }
  function draw() {
    const width = canvasWrap.clientWidth; if (!width) return;
    const gameWidth = +resolution.value, gameHeight = gameWidth === 1280 ? 720 : 768;
    const scale = width / gameWidth; canvas.style.width = `${width}px`; canvas.style.height = `${gameHeight * scale}px`;
    const game = el("div", "pf-game"); Object.assign(game.style, { width: `${gameWidth}px`, height: `${gameHeight}px`, transform: `scale(${scale})` });
    const panel = el("div", "pf-game-panel"); game.append(panel);
    for (const accepted of nodes) {
      const n = drafts.get(accepted.id) ?? accepted, font = fonts.find(f => f.id === n.font), text = action(n.id === "body" && expressions ? "Choose a route." : n.text, () => choose(n.id)); text.classList.add("pf-game-text"); text.dataset.selected = String(n.id === selected);
      text.style.fontFamily = font?.status === "ready" ? font.family : "sans-serif"; text.style.fontSize = `${validSize(n.size) ? +n.size : validSize(accepted.size) ? +accepted.size : 26}px`;
      text.style.color = validColor(n.color) ? n.color : validColor(accepted.color) ? accepted.color : "#f1e9d6"; text.style.fontWeight = n.bold === "True" ? "700" : "400"; text.style.fontStyle = n.italic === "True" ? "italic" : "normal";
      text.style.textAlign = n.align === "0.5" ? "center" : n.align === "1.0" ? "right" : "left"; text.style.width = `${Math.min(900, +(n.layout.xsize || 640))}px`; panel.append(text);
    }
    panel.append(el("p", "pf-game-help", "Click or Enter to advance. H hides the interface."), action("Close", () => report("Close selected in sample. No game action runs.")));
    canvas.replaceChildren(game); canvas.dataset.draft = String(drafts.size > 0);
  }
  function dialog(title: string, build: (d: HTMLDialogElement) => void, returnTo: HTMLElement | null = document.activeElement as HTMLElement) {
    const d = el("dialog", "ui-dialog pf-dialog"); d.ariaLabel = title; d.append(el("h2", "", title)); build(d); frame.shell.append(d); modal = d;
    d.onclose = () => { d.remove(); if (modal === d) modal = null; returnTo?.focus({ preventScroll: true }); }; d.showModal(); return d;
  }
  function openPicker() {
    const trigger = editor.querySelector<HTMLElement>('[data-field="font"]'); rememberScroll();
    let searchText = "", staged = "ttf", importing = false;
    const picker = dialog("Choose project font", d => {
      function finish(id: string) { edit("font", id); d.close(); renderEditor(); sync(); editor.querySelector<HTMLElement>('[data-field="font"]')?.focus(); }
      function renderChoose() {
        importing = false; d.ariaLabel = "Choose project font"; d.replaceChildren(el("h2", "", "Choose project font"));
        const toolbar = el("div", "pf-picker-toolbar"), search = el("input"); search.type = "search"; search.ariaLabel = "Find project font"; search.placeholder = "Find a font…"; search.value = searchText;
        toolbar.append(search, action("Import font…", renderImport));
        const list = el("div", "pf-font-list"); list.ariaLabel = "Project fonts";
        function renderList() {
          list.replaceChildren();
          if (!searchText) { const inherited = action("Default font · Inherit from style", () => finish("")); inherited.classList.add("pf-font-option", "pfr-inherit"); inherited.ariaPressed = String(!value().font); list.append(inherited); }
          const matches = fonts.filter(f => `${f.name} ${f.path} ${f.format}`.toLowerCase().includes(searchText.toLowerCase()));
          for (const f of matches) {
            const row = action("", () => finish(f.id)); row.classList.add("pf-font-option"); row.ariaLabel = `Use ${f.name}`; row.ariaPressed = String(value().font === f.id); row.disabled = f.status !== "ready";
            const words = el("span", "pfr-font-meta"), heading = el("span", "pfr-font-heading"); heading.append(el("strong", "", f.name));
            if (value().font === f.id) heading.append(el("span", "pfr-selected", "Selected"));
            words.append(heading, el("small", "", `${f.path} · ${f.format}${f.status !== "ready" ? ` · ${f.status}` : ""}`));
            const specimen = el("span", "pf-specimen", unsupported("text") ? "Choose a route." : value().text.replace(/\s+/g, " ") || "Aa Bb Cc 012345"); specimen.style.fontFamily = f.family; row.append(words, specimen); list.append(row);
          }
          if (!matches.length) list.append(el("p", "ui-note", "No matching project fonts. Try another name or import a font."));
        }
        search.oninput = () => { searchText = search.value; renderList(); };
        d.append(toolbar, list, el("p", "pf-boundary", "TTF and OTF · Prototype specimens use browser font stand-ins."), action("Cancel", () => d.close())); renderList();
        requestAnimationFrame(() => search.focus());
      }
      function renderImport() {
        importing = true; d.ariaLabel = "Import project font"; d.replaceChildren(el("h2", "", "Import project font"));
        const back = action("Back to project fonts", renderChoose); back.classList.add("pfr-back");
        const message = el("p", "ui-feedback"); message.role = "alert"; message.hidden = true;
        const choice = select("Sample file", [["ttf", "Departure Sans.ttf"], ["otf", "Departure Serif.otf"], ["invalid", "damaged-font.ttf"]], staged, next => { staged = next; message.hidden = true; destination.textContent = `game/fonts/${staged === "invalid" ? "damaged-font.ttf" : `departure.${staged}`}`; });
        const destination = el("code", "pfr-destination", `game/fonts/${staged === "invalid" ? "damaged-font.ttf" : `departure.${staged}`}`);
        const actions = el("div", "ui-actions"); actions.append(action("Import and use", () => {
          if (staged === "invalid") { message.textContent = "This file is not a readable font. Choose another TTF or OTF. Your text edits are kept."; message.hidden = false; choice.focus(); return; }
          const id = `departure-${staged}`;
          if (!fonts.some(f => f.id === id)) fonts.push({ id, name: staged === "ttf" ? "Departure Sans" : "Departure Serif", path: `fonts/departure.${staged}`, format: staged.toUpperCase(), family: staged === "ttf" ? "sans-serif" : "serif", status: "ready" });
          finish(id); report("Font imported. Apply to use it for this text.");
        }, true), action("Cancel import", renderChoose));
        d.append(back, labelled("Sample file", choice), el("span", "pfr-import-label", "Project destination"), destination, el("p", "ui-note", "Import is simulated. No file is read or copied."), message, actions);
        requestAnimationFrame(() => choice.focus());
      }
      d.oncancel = event => { if (importing) { event.preventDefault(); renderChoose(); } };
      renderChoose();
    }, trigger);
    picker.classList.add("pfr-picker");
  }
  function sourceText() {
    return ['# Fictional source. Custom statements are preserved in the sample.', 'screen help():', '    frame:', '        vbox:', ...nodes.flatMap(n => {
      const expression = expressions && n.id === "body", lines = [`            text ${expression ? n.text : JSON.stringify(n.text)}:`];
      for (const key of ["font", "size", "color", "align", "bold", "italic"] as const) {
        const value = n[key]; if (!value) continue;
        const mapped = key === "align" ? "text_align" : key;
        const literal = key === "font" ? expression ? value : JSON.stringify(fonts.find(f => f.id === value)?.path ?? value) : key === "color" ? JSON.stringify(value) : value;
        lines.push(`                ${mapped} ${literal}`);
      }
      for (const [key, value] of Object.entries(n.layout)) if (value && !key.endsWith("unit")) lines.push(`                ${key} ${value}`);
      return lines;
    }), '    # Keep this custom source unchanged.', '    use custom_help_footer()'].join("\n");
  }
  function openSource() {
    dialog("Source · Help", d => {
      d.append(el("p", "ui-note", "Accepted sample source. Pending text edits stay in the inspector.")); const code = el("pre", "ui-source", sourceText()); code.ariaLabel = "Accepted sample source"; d.append(code);
      if (conflict) d.append(action("Simulate reconcile", () => { if (drafts.size) { report("Source conflict remains. Text drafts are kept."); return; } conflict = false; d.close(); clearProblem(); renderEditor(); sync(); report("Sample Source reconciled."); }));
      d.append(action("Back to editing", () => d.close()));
    });
  }
  function rememberDisclosure(key: string, open: boolean, owner: string) { let set = disclosures.get(owner); if (!set) disclosures.set(owner, set = new Set()); open ? set.add(key) : set.delete(key); }
  function validSize(value: string) { return /^\d+$/.test(value) && +value >= 1 && +value <= 512; }
  function validColor(value: string) { return /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value); }
  function select(name: string, choices: string[][], value: string, changed: (value: string) => void) { const s = el("select"); s.ariaLabel = name; for (const [id, text] of choices) { const o = el("option", "", text); o.value = id!; s.append(o); } s.value = value; s.onchange = () => changed(s.value); return s; }
  function switchVariant(delta: number) { const q = new URLSearchParams(location.search); q.set("variant", variants[(variants.indexOf(variant) + delta + variants.length) % variants.length]!); location.search = q.toString(); }
  const keys = (e: KeyboardEvent) => { if (["ArrowLeft", "ArrowRight"].includes(e.key) && !modal && !(e.target instanceof HTMLElement && e.target.closest("input,textarea,select,[contenteditable]"))) { e.preventDefault(); switchVariant(e.key === "ArrowRight" ? 1 : -1); } };
  document.addEventListener("keydown", keys); const observer = new ResizeObserver(draw); observer.observe(canvasWrap);
  renderEditor(); sync();
  return () => { observer.disconnect(); document.removeEventListener("keydown", keys); modal?.remove(); };
}
