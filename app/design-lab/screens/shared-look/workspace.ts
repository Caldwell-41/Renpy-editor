// Throwaway #43 interaction study. All source and revisions below are sample data.
import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { prototypeSwitcher } from "../../prototype-switcher.ts";
import "./style.css";

export type Variant = "inspector" | "library" | "inline";
type Kind = "text" | "frame" | "button";
type Appearance = "normal" | "hover" | "selected" | "disabled";
type Look = { color: string; background: string; borderColor: string; borderWidth: string; size: string; bold: boolean };
type Document = { styles: Record<string, Look>; uses: Record<string, string>; revision: number };
const variants = [
  { id: "inspector", title: "A · Inspector & review dialog" },
  { id: "library", title: "B · Style library & two previews" },
  { id: "inline", title: "C · Inline review worksheet" },
];
const names: Record<Kind, string> = { text: "tram_body", frame: "tram_panel", button: "tram_button" };
const copy = <T,>(value: T): T => structuredClone(value);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const colors: Record<Appearance, string> = { normal: "#d9c79f", hover: "#ffffff", selected: "#c0dfcf", disabled: "#8d9995" };
const initialLook = (): Look => ({ color: "#d9c79f", background: "#263c39", borderColor: "#7d9690", borderWidth: "2", size: "26", bold: false });

export function mountLook(host: HTMLElement, context: LabContext, variant: Variant, standalone = false) {
  let kind: Kind = "text", appearance: Appearance = "normal", screen = "Help";
  let document: Document = { styles: {}, uses: {}, revision: 1 };
  for (const k of ["text", "frame", "button"] as const) {
    const name = names[k]; document.styles[name] = initialLook();
    document.uses[`Help/${k}`] = name;
    document.uses[`About/${k}`] = context.state === "local" ? `${name}_about` : name;
    if (context.state === "local") document.styles[`${name}_about`] = initialLook();
  }
  let draft = copy(initialLook()), baseRevision = 1;
  let problem = context.state === "stale" || context.state === "missing" ? context.state : "";
  let reviewMode: "shared" | "copy" | "attach" = "shared";
  let lastField: HTMLInputElement | null = null, review: HTMLElement | null = null;
  let selection: [number | null, number | null] = [null, null], savedScroll = 0;
  let notice = "Ready in sample";
  const history: Document[] = [], redo: Document[] = [];
  const currentStyle = () => document.uses[`${screen}/${kind}`]!;
  const dirty = () => !same(draft, acceptedLook());
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty });
  frame.shell.classList.add("look-lab"); frame.shell.dataset.lookVariant = variant;
  frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "#43 · Shared looks · Draft";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Fictional sample · No project writes";
  const undoButton = action("Undo", () => travel(history, redo));
  const redoButton = action("Redo", () => travel(redo, history));
  frame.tools.append(undoButton, redoButton, action("Source", openSource));
  const address = el("div", "lk-address", "Help / Body text");
  const rail = el("nav", "lk-rail"); rail.ariaLabel = "Screen building steps";
  rail.append(el("span", "", "1  Choose"), el("strong", "", "2  Design"), el("span", "", "3  Connect"));
  const work = el("div", "lk-work"), library = el("aside", "lk-library"), stage = el("section", "lk-stage"), editor = el("section", "lk-editor");
  stage.ariaLabel = "Screen canvas sample"; editor.ariaLabel = "Look inspector";
  const stageHead = el("div", "lk-stage-head");
  const screenPicker = select("Selected screen", ["Help", "About"], screen, value => {
    if (dirty()) { screenPicker.value = screen; report("Apply or cancel this draft before changing the selected use."); return; }
    screen = value; draft = copy(document.styles[currentStyle()]!); buildFields(); sync();
  });
  stageHead.append(screenPicker, el("span", "", "1280 × 720 · Fit"));
  const canvases = el("div", "lk-canvases");
  const previewNote = el("p", "lk-note", "Draft on selected screen · Schematic canvas; Ren'Py output is not qualified.");
  stage.append(stageHead, canvases, previewNote);
  const title = el("h2", "", "Body text"), styleLine = el("div", "lk-style-line"), fields = el("div", "lk-fields-scroll");
  const kindPicker = select("Element type", ["text", "frame", "button"], kind, value => {
    if (dirty()) { kindPicker.value = kind; report("Apply or cancel this draft before changing the element."); return; }
    kind = value as Kind; appearance = "normal"; draft = copy(document.styles[currentStyle()]!); buildFields(); sync();
  });
  const appearancePicker = select("Appearance sample", ["normal", "hover", "selected", "disabled"], appearance, value => {
    if (dirty()) { appearancePicker.value = appearance; report("Apply or cancel the current appearance draft first."); return; }
    appearance = value as Appearance;
    const key = styleKey(); draft = copy(document.styles[key] ?? { ...document.styles[currentStyle()]!, color: colors[appearance] });
    buildFields(); sync();
  });
  const alert = el("p", "lk-alert"); alert.role = "alert"; alert.hidden = true;
  const footer = el("div", "lk-commit");
  const apply = action(variant === "inline" ? "Review changes" : "Review affected screens", () => openReview("shared"), true);
  const independent = action("Make independent copy", () => openReview("copy"));
  const cancel = action("Cancel draft", () => { draft = acceptedLook(); buildFields(); report("Draft cancelled. No accepted source changed."); sync(); });
  footer.append(apply, independent, cancel);
  editor.append(title, labelled("Element", kindPicker), styleLine, labelled("Appearance", appearancePicker), fields, alert, footer);
  const inspectorState = el("details", "lk-state"), stateText = el("pre");
  inspectorState.append(el("summary", "", "Prototype state & scenarios"), stateText);
  const simulations = el("div", "lk-actions");
  simulations.append(action("Simulate changed use", () => { problem = "stale"; document.revision++; report("A use changed in sample Source. Draft retained."); sync(); }), action("Simulate missing use", () => { problem = "missing"; report("The About use is missing. Draft retained."); sync(); }), action("Simulate reopen", () => {
    if (dirty() || review) { report("Apply or cancel the retained draft and close review before reopening."); return; }
    history.length = 0; redo.length = 0; baseRevision = document.revision; buildFields(); sync(); report("Reopened the accepted sample. References remain intact; history is empty.");
  }));
  inspectorState.append(simulations);
  if (variant === "library") work.append(library);
  work.append(stage, editor); frame.content.append(address, rail, work, inspectorState);
  const disposeSwitcher = standalone ? () => {} : prototypeSwitcher(frame.shell, variants, variant, dirty);

  function styleKey() { return appearance === "normal" ? currentStyle() : `${currentStyle()}:${appearance}`; }
  function acceptedLook() { return copy(document.styles[styleKey()] ?? { ...document.styles[currentStyle()]!, color: colors[appearance] }); }
  // The prototype compares appearance values independently, like Ren'Py state prefixes.
  function isDirty() { return dirty(); }
  function report(message: string) { notice = message; frame.status.textContent = message; stateText.textContent = state(); }
  function select(label: string, values: string[], value: string, change: (value: string) => void) {
    const control = el("select"); control.ariaLabel = label;
    for (const v of values) { const option = el("option", "", v[0]!.toUpperCase() + v.slice(1)); option.value = v; control.append(option); }
    control.value = value; control.onchange = () => change(control.value); return control;
  }
  function section(label: string) {
    const details = el("details", "lk-group"); details.open = true; details.append(el("summary", "", label)); fields.append(details); return details;
  }
  function field(parent: HTMLElement, label: string, key: keyof Omit<Look, "bold">) {
    const input = el("input"); input.type = "text"; input.value = draft[key]; input.dataset.field = key;
    input.readOnly = context.state === "expression"; input.ariaLabel = label;
    input.onfocus = () => { lastField = input; };
    input.oninput = () => { draft[key] = input.value; alert.hidden = true; sync(); };
    input.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); openReview("shared"); } };
    parent.append(labelled(label, input));
  }
  function buildFields() {
    fields.replaceChildren(); lastField = null;
    const text = section("Text"); text.hidden = kind === "frame";
    field(text, "Text color", "color"); field(text, "Size · px", "size");
    const bold = el("input"); bold.type = "checkbox"; bold.checked = draft.bold; bold.disabled = context.state === "expression";
    bold.onchange = () => { draft.bold = bold.checked; sync(); };
    const label = el("label", "lk-check"); label.append(bold, el("span", "", "Bold")); text.append(label);
    const background = section("Background & border"); background.hidden = kind === "text";
    field(background, "Background color", "background"); field(background, "Border color", "borderColor"); field(background, "Border width · px", "borderWidth");
    const layout = section("Layout"); layout.open = false;
    layout.append(el("p", "lk-note", "Existing position, anchor, padding and sizing controls stay with the element. Shared looks change appearance only."));
    if (context.state === "expression") fields.append(el("p", "lk-warning", "This use has a dynamic style expression. Edit it in Source. This sample keeps appearance controls read-only."));
    baseRevision = document.revision;
  }
  function state() {
    return JSON.stringify({ variant, selectedUse: `${screen}/${kind}`, appearance, accepted: document, draft, dirty: isDirty(), problem, history: history.length, redo: redo.length, notice }, null, 2);
  }
  function sync() {
    const style = currentStyle();
    title.textContent = { text: "Body text", frame: "Content frame", button: "Close button" }[kind];
    address.textContent = `${screen} / ${title.textContent}`;
    styleLine.replaceChildren(el("strong", "", style), el("span", "", `${uses(style).length} screen${uses(style).length === 1 ? "" : "s"} · ${isDirty() ? "Draft" : "Accepted"}`));
    appearancePicker.disabled = kind !== "button" || context.state === "expression";
    appearancePicker.value = appearance;
    apply.disabled = !isDirty() || context.state === "expression";
    independent.disabled = context.state === "expression";
    cancel.disabled = !isDirty(); undoButton.disabled = !history.length || isDirty(); redoButton.disabled = !redo.length || isDirty();
    draw(); renderLibrary(); stateText.textContent = state();
  }
  function uses(name: string) { return Object.entries(document.uses).filter(([, style]) => style === name).map(([use]) => use); }
  function renderLibrary() {
    if (variant !== "library") return;
    library.replaceChildren(el("h2", "", "Shared styles"));
    for (const k of ["text", "frame", "button"] as const) {
      const name = document.uses[`${screen}/${k}`]!;
      const b = action("", () => { kindPicker.value = k; kindPicker.onchange!(new Event("change")); });
      b.classList.add("lk-style-row"); b.ariaPressed = String(k === kind); b.ariaLabel = `Edit ${name}`;
      b.append(el("strong", "", name), el("span", "", `${k} · ${uses(name).length} screens`)); library.append(b);
    }
    library.append(el("p", "lk-note", "Ordinary source definitions in game/ui/looks.rpy"));
  }
  function draw() {
    canvases.replaceChildren();
    for (const target of variant === "library" ? ["Help", "About"] : [screen]) {
      const group = el("div", "lk-preview-group"), canvas = el("div", "lk-canvas");
      const name = document.uses[`${target}/${kind}`]!;
      const look = target === screen ? draft : document.styles[appearance === "normal" ? name : `${name}:${appearance}`] ?? { ...document.styles[name]!, color: colors[appearance] };
      const panel = el("div", "lk-game-panel");
      panel.append(el("h3", "", target === "Help" ? "Before the last tram" : "A city after midnight"));
      const text = el("p", "", target === "Help" ? "Follow the line to the water.\nThe last tram leaves at midnight." : "Built for the long way home.\nEvery stop has a story.");
      const button = el("button", "", "Close"); button.type = "button"; button.title = "Canvas sample only; no game action";
      panel.append(text, button); canvas.append(panel);
      const element = kind === "text" ? text : kind === "frame" ? panel : button;
      element.classList.add("lk-selected-element");
      const color = (v: string, fallback: string) => /^#[a-f0-9]{6}$/i.test(v) ? v : fallback;
      if (kind !== "frame") { element.style.color = color(look.color, "#d9c79f"); element.style.fontSize = `${Math.min(40, Math.max(10, +look.size || 26)) * .65}px`; element.style.fontWeight = look.bold ? "700" : "400"; }
      if (kind !== "text") { element.style.backgroundColor = color(look.background, "#263c39"); element.style.border = `${Math.min(8, Math.max(0, +look.borderWidth || 0))}px solid ${color(look.borderColor, "#7d9690")}`; }
      if (appearance === "disabled") element.style.opacity = ".6";
      group.append(el("div", "lk-preview-label", `${target} · ${target === screen && isDirty() ? "Draft" : "Accepted"}`), canvas); canvases.append(group);
    }
  }
  function validate() {
    if (problem === "missing") return "About's use is missing. Nothing was applied. Your draft is retained.";
    if (problem === "stale" || document.revision !== baseRevision) return "A style or use changed since this draft began. Nothing was applied. Your draft is retained.";
    const keys = kind === "text" ? ["color"] : kind === "frame" ? ["background", "borderColor"] : ["color", "background", "borderColor"];
    if (keys.some(k => !/^#[a-f0-9]{6}$/i.test(draft[k as "color"]))) return "Enter a six-digit hex color. Your draft is retained.";
    if (kind !== "frame" && (!/^\d+$/.test(draft.size) || +draft.size < 1 || +draft.size > 256)) return "Size must be a whole number from 1 to 256. Your draft is retained.";
    if (kind !== "text" && (!/^\d+$/.test(draft.borderWidth) || +draft.borderWidth > 32)) return "Border width must be a whole number from 0 to 32. Your draft is retained.";
    return "";
  }
  function openReview(mode: typeof reviewMode) {
    if (review) return;
    if (context.state === "expression") return;
    reviewMode = mode; savedScroll = fields.scrollTop;
    selection = [lastField?.selectionStart ?? null, lastField?.selectionEnd ?? null];
    const inline = variant === "inline";
    const panel = inline ? el("section", "lk-review") : el("dialog", "lk-review lp-dialog");
    panel.ariaLabel = "Review affected screens"; review = panel;
    panel.append(el("h2", "", mode === "copy" ? "Make an independent copy" : mode === "attach" ? "Share this look" : "Review affected screens"));
    panel.append(el("p", "", mode === "copy" ? `Copy ${currentStyle()} with your draft values. Only the selected ${screen} use will change.` : mode === "attach" ? `Use ${currentStyle()} on About. Its local appearance will be replaced.` : `Apply ${appearance} appearance changes to ${currentStyle()}.`));
    const list = el("div", "lk-use-list");
    for (const target of ["Help", "About"]) {
      const key = `${target}/${kind}`, affected = mode === "copy" ? target === screen : mode === "attach" ? target === "About" : document.uses[key] === currentStyle();
      const row = el("div", "lk-use-row");
      row.append(el("strong", "", target), el("span", "", `${kind} · game/ui/${target.toLowerCase()}.rpy`), el("span", "", affected ? mode === "copy" ? "Independent copy" : "Will update" : "Unchanged")); list.append(row);
    }
    panel.append(list);
    const newName = el("input"); newName.value = `${currentStyle()}_${screen.toLowerCase()}`;
    if (mode === "copy") panel.append(labelled("Copy name", newName));
    const changes = el("pre", "lk-diff"); changes.textContent = mode === "attach" ? `About/${kind}\n  style ${document.uses[`About/${kind}`]} → ${currentStyle()}` : Object.entries(draft).filter(([key, value]) => acceptedLook()[key as keyof Look] !== value).map(([key, value]) => `${key}: ${acceptedLook()[key as keyof Look]} → ${value}`).join("\n") || "Appearance unchanged. Copy the reference for independent editing.";
    panel.append(changes);
    const warning = el("p", "lk-alert"); warning.role = "alert"; warning.hidden = true; panel.append(warning);
    const actions = el("div", "lk-actions");
    const commit = action(mode === "copy" ? "Create copy & apply" : mode === "attach" ? "Apply to About" : `Apply to ${uses(currentStyle()).length} screen${uses(currentStyle()).length === 1 ? "" : "s"}`, () => {
      const invalid = validate() || (mode === "copy" && (!/^[a-z][a-z0-9_]*$/.test(newName.value) || document.styles[newName.value]) ? "Choose a new, unused source style name. Your draft is retained." : "");
      if (invalid) { warning.hidden = false; warning.textContent = invalid; report(invalid); return; }
      history.push(copy(document)); redo.length = 0;
      if (mode === "attach") document.uses[`About/${kind}`] = currentStyle();
      else if (mode === "copy") {
        const prior = currentStyle();
        document.styles[newName.value] = copy(document.styles[prior]!);
        for (const state of ["hover", "selected", "disabled"]) if (document.styles[`${prior}:${state}`]) document.styles[`${newName.value}:${state}`] = copy(document.styles[`${prior}:${state}`]!);
        document.uses[`${screen}/${kind}`] = newName.value;
        document.styles[styleKey()] = copy(draft);
      } else document.styles[styleKey()] = copy(draft);
      document.revision++; baseRevision = document.revision; closeReview(); sync(); report("Applied in sample. One history entry; ordinary source references retained.");
    }, true);
    actions.append(action("Back to editing", closeReview), commit); panel.append(actions);
    if (inline) { editor.append(panel); panel.scrollIntoView({ block: "nearest" }); commit.focus(); }
    else { frame.shell.append(panel); (panel as HTMLDialogElement).addEventListener("cancel", event => { event.preventDefault(); closeReview(); }); (panel as HTMLDialogElement).showModal(); }
  }
  function closeReview() {
    if (review instanceof HTMLDialogElement) review.close(); review?.remove(); review = null;
    fields.scrollTop = savedScroll;
    if (lastField?.isConnected) { lastField.focus({ preventScroll: true }); if (selection[0] !== null) lastField.setSelectionRange(...selection); }
    else apply.focus({ preventScroll: true });
  }
  function travel(from: Document[], to: Document[]) {
    if (!from.length || isDirty() || review) return;
    to.push(copy(document)); document = from.pop()!; draft = acceptedLook(); baseRevision = document.revision;
    buildFields(); sync(); report("Sample history restored source definitions and use references together.");
  }
  function source() {
    const lines = ["# Fictional accepted source. Custom neighbors remain opaque.", "# game/ui/looks.rpy"];
    for (const [name, look] of Object.entries(document.styles).filter(([name]) => !name.includes(":"))) {
      lines.push(`style ${name}:`, `    color "${look.color}"`, `    # background/border sample: ${look.background}, ${look.borderColor}, ${look.borderWidth}px`, `    size ${look.size}`, `    bold ${look.bold ? "True" : "False"}`);
      for (const state of ["hover", "selected", "disabled"]) {
        const stateLook = document.styles[`${name}:${state}`];
        if (stateLook) lines.push(`    ${state}_color "${stateLook.color}"`, `    ${state}_size ${stateLook.size}`);
      }
    }
    for (const target of ["Help", "About"]) lines.push(`\n# game/ui/${target.toLowerCase()}.rpy`, `screen ${target.toLowerCase()}():`, "    frame:", `        style "${document.uses[`${target}/frame`]}"`, "        vbox:", `            text "${target === "Help" ? "Follow the line to the water." : "Built for the long way home."}" style ${context.state === "expression" ? "gui.body_style" : `"${document.uses[`${target}/text`]}"`}`, `            textbutton "Close" style "${document.uses[`${target}/button`]}" action Return()`, "    use custom_footer() # Source-only neighbor");
    return lines.join("\n");
  }
  function openSource() {
    const dialog = el("dialog", "lp-dialog lk-source"); dialog.ariaLabel = "Accepted sample source";
    dialog.append(el("h2", "", "Accepted sample source"), el("p", "", "Draft values are excluded. This is an interaction illustration, not qualified Ren'Py serialization."), el("pre", "", source()), action("Back to inspector", () => dialog.close()));
    dialog.onclose = () => { dialog.remove(); lastField?.focus({ preventScroll: true }); }; frame.shell.append(dialog); dialog.showModal();
  }
  if (context.state === "local") stage.append(action("Share with About", () => {
    if (isDirty()) { report("Apply or cancel the current draft before sharing this look."); return; }
    openReview("attach");
  }));
  buildFields(); sync();
  return disposeSwitcher;
}
