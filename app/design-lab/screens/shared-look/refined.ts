// A2 experience study. All document data and writes stay in browser memory.
import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import "./refined.css";

type Kind = "text" | "frame" | "button";
type Appearance = "normal" | "hover" | "selected" | "disabled";
type Look = { color: string; size: string; bold: boolean; background: string; borderColor: string; borderWidth: string };
type Sample = { looks: Record<string, { name: string; values: Record<Appearance, Look> }>; uses: Record<string, string>; revision: number };
const kinds: Kind[] = ["text", "frame", "button"];
const titles: Record<Kind, string> = { text: "Body text", frame: "Content frame", button: "Close button" };
const states: Appearance[] = ["normal", "hover", "selected", "disabled"];
const clone = <T,>(value: T): T => structuredClone(value);
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const look = (): Look => ({ color: "#d9c79f", size: "26", bold: false, background: "#263c39", borderColor: "#7d9690", borderWidth: "2" });

export const mount: LabMount = (host, context) => {
  let sample: Sample = { looks: {}, uses: {}, revision: 1 };
  for (const kind of kinds) {
    const values = Object.fromEntries(states.map(state => [state, { ...look(), color: { normal: "#d9c79f", hover: "#ffffff", selected: "#b5dfc7", disabled: "#939d98" }[state] }])) as Record<Appearance, Look>;
    sample.looks[kind] = { name: titles[kind], values };
    sample.uses[`Help/${kind}`] = kind;
    sample.uses[`About/${kind}`] = context.state === "local" ? `${kind}_about` : kind;
    if (context.state === "local") sample.looks[`${kind}_about`] = clone(sample.looks[kind]!);
  }
  let screen = "Help", kind: Kind = "text", appearance: Appearance = "normal", scope = "shared";
  let problem = ["stale", "missing"].includes(context.state) ? context.state : "";
  let draft = clone(look()), revision = sample.revision;
  let lastField: HTMLInputElement | HTMLSelectElement | null = null, dialog: HTMLDialogElement | null = null;
  let selection: [number | null, number | null] = [null, null], scroll = 0;
  const undoStack: Sample[] = [], redoStack: Sample[] = [];
  const styleId = () => sample.uses[`${screen}/${kind}`]!;
  const accepted = () => sample.looks[styleId()]!.values[appearance];
  const uses = () => Object.keys(sample.uses).filter(key => sample.uses[key] === styleId());
  const copying = () => scope === "local" && uses().length > 1;
  const dirty = () => !equal(draft, accepted()) || copying();
  const affected = () => copying() ? [`${screen}/${kind}`] : uses();
  const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty });
  frame.shell.classList.add("look-refined"); frame.heading.querySelector("p")?.remove();
  frame.shell.querySelector(".lp-sample")!.textContent = "A2 · Shared looks · Draft";
  frame.shell.querySelector(".lp-fiction")!.textContent = "Browser mock · Changes stay here";
  const undo = action("Undo", () => travel(undoStack, redoStack)), redo = action("Redo", () => travel(redoStack, undoStack));
  frame.tools.append(undo, redo, action("Source", openSource));
  const work = el("div", "lr-work"), stage = el("section", "lr-stage"), editor = el("section", "lr-editor");
  stage.ariaLabel = "Look previews"; editor.ariaLabel = "Look inspector";
  const previews = el("div", "lr-previews");
  stage.append(previews, el("p", "lr-preview-note", "Both screens are shown so you can see where your changes will go. Preview only; nothing applies until you confirm."));
  const selectionRow = el("div", "lr-selection");
  const screenPicker = picker("Editing screen", ["Help", "About"], screen, value => changeSelection(() => { screen = value; }));
  const kindPicker = picker("Selected element", kinds, kind, value => changeSelection(() => { kind = value as Kind; appearance = "normal"; }));
  selectionRow.append(labelled("Screen", screenPicker), labelled("Element", kindPicker));
  const title = el("h2"), sharing = el("p", "lr-sharing"), fields = el("div", "lr-fields");
  const appliesTo = el("fieldset", "lr-scope"); appliesTo.append(el("legend", "", "Where should this change apply?"));
  const sharedRadio = radio("shared"), localRadio = radio("local");
  const sharedLabel = el("span"), localLabel = el("span");
  const sharedChoice = el("label", "lr-scope-choice"), localChoice = el("label", "lr-scope-choice");
  sharedChoice.append(sharedRadio, sharedLabel); localChoice.append(localRadio, localLabel); appliesTo.append(sharedChoice, localChoice);
  const attach = action("Use this look on About…", () => openReview(true));
  const error = el("p", "lr-error"); error.role = "alert"; error.hidden = true;
  const commit = el("div", "lr-commit"), commitSummary = el("p");
  const review = action("Review changes", () => openReview(), true);
  const cancel = action("Cancel changes", () => { draft = clone(accepted()); scope = "shared"; renderFields(); report("Changes cancelled. Both screens keep their saved look."); sync(); });
  commit.append(commitSummary, review, cancel);
  editor.append(selectionRow, title, sharing, fields, appliesTo, attach, error, commit);
  work.append(stage, editor); frame.content.append(work);
  const diagnostics = el("details", "lr-state"); diagnostics.append(el("summary", "", "Prototype details"));
  const stateText = el("pre"), controls = el("div", "lr-debug-actions");
  controls.append(action("Simulate changed use", () => { problem = "stale"; sample.revision++; report("A use changed in sample Source. Your changes are retained."); sync(); }), action("Simulate reopen", () => {
    if (dirty() || dialog) { report("Apply or cancel your changes before reopening the sample."); return; }
    undoStack.length = 0; redoStack.length = 0; revision = sample.revision; sync(); report("Sample reopened with its saved looks and references.");
  }));
  diagnostics.append(el("p", "", "Appearance is schematic. Source, saves and history are simulated; no project or Ren'Py process is opened."), stateText, controls); frame.content.append(diagnostics);

  function report(text: string) { frame.status.textContent = text; }
  function picker(label: string, choices: readonly string[], value: string, change: (value: string) => void) {
    const select = el("select"); select.ariaLabel = label;
    for (const choice of choices) { const option = el("option", "", kinds.includes(choice as Kind) ? titles[choice as Kind] : choice[0]!.toUpperCase() + choice.slice(1)); option.value = choice; select.append(option); }
    select.value = value; select.onfocus = () => { lastField = select; }; select.onchange = () => change(select.value); return select;
  }
  function radio(value: string) {
    const input = el("input"); input.type = "radio"; input.name = "lr-scope"; input.value = value;
    input.onfocus = () => { lastField = input; }; input.onchange = () => { scope = value; error.hidden = true; sync(); }; return input;
  }
  function changeSelection(change: () => void) {
    if (dirty()) { screenPicker.value = screen; kindPicker.value = kind; report("Apply or cancel your changes before selecting another element."); return; }
    change(); scope = "shared"; draft = clone(accepted()); revision = sample.revision; renderFields(); sync();
  }
  function field(parent: HTMLElement, label: string, key: keyof Omit<Look, "bold">, colors = false) {
    const row = el("div", "lr-property");
    const input = el("input"); input.type = "text"; input.value = draft[key]; input.ariaLabel = label; input.dataset.field = key;
    input.readOnly = context.state === "expression"; input.onfocus = () => { lastField = input; };
    input.oninput = () => { draft[key] = input.value; error.hidden = true; sync(); };
    input.onkeydown = event => { if (event.key === "Enter") { event.preventDefault(); if (dirty()) openReview(); } };
    row.append(labelled(label, input));
    if (colors) {
      const swatches = el("div", "lr-swatches"); swatches.ariaLabel = `${label} presets`;
      for (const [name, value] of [["Warm cream", "#d9c79f"], ["Copper", "#e8a87c"], ["Sage", "#b5dfc7"], ["White", "#ffffff"]]) {
        const button = action("", () => { draft[key] = value!; input.value = value!; lastField = input; error.hidden = true; sync(); });
        button.ariaLabel = `${label}: ${name}`; button.title = name!; button.dataset.swatch = value; button.dataset.property = key; button.style.setProperty("--swatch", value!); button.disabled = input.readOnly; swatches.append(button);
      }
      row.append(swatches);
    }
    parent.append(row);
  }
  function renderFields() {
    fields.replaceChildren(); if (!lastField?.isConnected) lastField = null;
    if (kind === "button") fields.append(labelled("Button state", picker("Button state", states, appearance, value => {
      if (dirty()) { const select = fields.querySelector("select")!; select.value = appearance; report("Apply or cancel this state before editing another."); return; }
      appearance = value as Appearance; draft = clone(accepted()); renderFields(); sync();
    })));
    if (kind !== "frame") {
      field(fields, "Text color", "color", true);
      const type = el("div", "lr-type-row"); field(type, "Size · px", "size");
      const bold = el("input"); bold.type = "checkbox"; bold.checked = draft.bold; bold.disabled = context.state === "expression"; bold.onfocus = () => { lastField = bold; }; bold.onchange = () => { draft.bold = bold.checked; sync(); };
      const label = el("label", "lr-bold"); label.append(bold, el("span", "", "Bold")); type.append(label); fields.append(type);
    }
    if (kind !== "text") {
      const background = el("details", "lr-section"); background.open = true; background.append(el("summary", "", "Background & border"));
      field(background, "Background color", "background", true); field(background, "Border color", "borderColor"); field(background, "Border width · px", "borderWidth"); fields.append(background);
    }
    if (context.state === "expression") fields.append(el("p", "lr-error", "This element uses a dynamic style expression. Edit its appearance in Source."));
  }
  function sync() {
    const shared = uses().length > 1, changed = dirty();
    title.textContent = `${titles[kind]} look`;
    sharing.textContent = shared ? "Help and About use the same look. Choose whether to keep them in sync." : `This look belongs to ${screen} only.`;
    sharedRadio.checked = scope === "shared"; localRadio.checked = scope === "local";
    sharedLabel.replaceChildren(el("strong", "", "Help and About"), el("small", "", "Update their shared look together"));
    localLabel.replaceChildren(el("strong", "", `Only ${screen}`), el("small", "", "Make this element independent"));
    appliesTo.hidden = !shared; appliesTo.disabled = context.state === "expression";
    attach.hidden = context.state !== "local" || screen !== "Help" || sample.uses[`About/${kind}`] === styleId(); attach.disabled = changed || context.state === "expression";
    review.textContent = copying() ? `Review ${screen} only…` : `Review ${affected().length} screen${affected().length === 1 ? "" : "s"}…`;
    review.disabled = !changed || context.state === "expression"; cancel.disabled = !changed;
    commitSummary.textContent = changed ? copying() ? `${screen} gets its own look. The other screen stays as it is.` : `Your changes will update ${affected().map(key => key.split("/")[0]).join(" and ")}.` : "Choose a color or change the size to preview your edit.";
    undo.disabled = !undoStack.length || changed; redo.disabled = !redoStack.length || changed;
    fields.querySelectorAll<HTMLButtonElement>("[data-swatch]").forEach(button => button.ariaPressed = String(button.dataset.swatch === draft[button.dataset.property as keyof Look]));
    draw(); stateText.textContent = JSON.stringify({ accepted: sample, draft, selectedUse: `${screen}/${kind}`, appearance, scope, dirty: changed, history: undoStack.length, redo: redoStack.length, problem }, null, 2);
  }
  function draw() {
    previews.replaceChildren();
    for (const target of ["Help", "About"]) {
      const changing = dirty() && affected().includes(`${target}/${kind}`), group = el("section", "lr-screen-preview"); group.ariaLabel = `${target} preview`;
      const heading = el("div", "lr-preview-heading"); heading.append(el("h2", "", target), el("span", "", changing ? "Unsaved preview" : "Saved look"));
      const canvas = el("div", "lr-canvas"), panel = el("div", "lr-game-panel");
      const headingText = el("h3", "", target === "Help" ? "Before the last tram" : "A city after midnight");
      const body = el("p", "", target === "Help" ? "Follow the line to the water.\nThe last tram leaves at midnight." : "Built for the long way home.\nEvery stop has a story.");
      const close = el("button", "", "Close"); close.type = "button"; close.title = "Select the button; no game action runs";
      const nodes = { text: body, frame: panel, button: close };
      for (const type of kinds) {
        const id = sample.uses[`${target}/${type}`]!, saved = sample.looks[id]!.values[type === "button" ? appearance : "normal"];
        const values = type === kind && changing ? draft : saved, node = nodes[type];
        const color = (value: string, fallback: string) => /^#[\da-f]{6}$/i.test(value) ? value : fallback;
        if (type !== "text") { node.style.background = color(values.background, "#263c39"); node.style.border = `${Math.min(8, Math.max(0, +values.borderWidth || 0))}px solid ${color(values.borderColor, "#7d9690")}`; }
        if (type !== "frame") { node.style.color = color(values.color, "#d9c79f"); node.style.fontSize = `${Math.min(44, Math.max(10, +values.size || 26)) * .7}px`; node.style.fontWeight = values.bold ? "700" : "400"; }
        if (type === kind) node.classList.add("lr-picked");
        node.onclick = event => { event.stopPropagation(); screenPicker.value = target; kindPicker.value = type; changeSelection(() => { screen = target; kind = type; appearance = "normal"; }); };
      }
      panel.append(headingText, body, close); canvas.append(panel); group.append(heading, canvas); previews.append(group);
    }
  }
  function validation() {
    if (problem === "missing") return "The About use is missing. Nothing was applied. Your changes are still here.";
    if (problem === "stale" || revision !== sample.revision) return "A look or use changed in Source. Nothing was applied. Your changes are still here.";
    const colorKeys = kind === "text" ? ["color"] : kind === "frame" ? ["background", "borderColor"] : ["color", "background", "borderColor"];
    if (colorKeys.some(key => !/^#[\da-f]{6}$/i.test(draft[key as "color"]))) return "Enter colors as six-digit hex values, such as #e8a87c.";
    if (kind !== "frame" && (!/^\d+$/.test(draft.size) || +draft.size < 1 || +draft.size > 256)) return "Enter a whole text size from 1 to 256.";
    if (kind !== "text" && (!/^\d+$/.test(draft.borderWidth) || +draft.borderWidth > 32)) return "Enter a whole border width from 0 to 32.";
    return "";
  }
  function openReview(attachUse = false) {
    if (dialog || context.state === "expression" || (!dirty() && !attachUse)) return;
    const invalid = validation(); if (invalid) { error.textContent = invalid; error.hidden = false; return; }
    selection = lastField instanceof HTMLInputElement ? [lastField.selectionStart, lastField.selectionEnd] : [null, null]; scroll = fields.scrollTop;
    const modal = el("dialog", "lr-review lp-dialog"); dialog = modal; modal.ariaLabel = "Review look changes";
    modal.append(el("h2", "", attachUse ? "Use this look on About?" : copying() ? `Change only ${screen}?` : "Update the shared look?"));
    modal.append(el("p", "", attachUse ? "About will use the same look as Help." : copying() ? `We'll make an independent copy for ${screen}. The other screen keeps its current look.` : `${affected().map(key => key.split("/")[0]).join(" and ")} will use your updated ${titles[kind].toLowerCase()} look.`));
    for (const target of ["Help", "About"]) {
      const affectedUse = attachUse ? target === "About" : affected().includes(`${target}/${kind}`), row = el("div", "lr-review-use");
      row.append(el("strong", "", target), el("span", "", titles[kind]), el("span", "", affectedUse ? "Will update" : "Stays the same")); modal.append(row);
    }
    const changes = el("div", "lr-diff");
    if (!attachUse) for (const key of Object.keys(draft) as Array<keyof Look>) if (draft[key] !== accepted()[key]) {
      const labels = { color: "Text color", size: "Size", bold: "Bold", background: "Background", borderColor: "Border color", borderWidth: "Border width" };
      const row = el("div"); row.append(el("span", "", labels[key]), el("span", "", `${accepted()[key]} → ${draft[key]}`)); changes.append(row);
    }
    const warning = el("p", "lr-error"); warning.role = "alert"; warning.hidden = true;
    const actions = el("div", "lr-review-actions"); actions.append(action("Keep editing", closeReview), action(attachUse ? "Use on About" : copying() ? `Apply to ${screen} only` : `Apply to ${affected().length} screen${affected().length === 1 ? "" : "s"}`, () => {
      const invalid = validation(); if (invalid) { warning.hidden = false; warning.textContent = invalid; return; }
      undoStack.push(clone(sample)); redoStack.length = 0;
      if (attachUse) sample.uses[`About/${kind}`] = styleId();
      else {
        if (copying()) { const old = styleId(), id = `${old}_${screen.toLowerCase()}_${sample.revision}`; sample.looks[id] = clone(sample.looks[old]!); sample.looks[id]!.name = `${titles[kind]} / ${screen}`; sample.uses[`${screen}/${kind}`] = id; }
        sample.looks[styleId()]!.values[appearance] = clone(draft);
      }
      sample.revision++; revision = sample.revision; scope = "shared"; closeReview(); sync(); report(attachUse ? "About now shares this look with Help." : "Look applied. Undo restores the appearance and its uses together.");
    }, true));
    modal.append(changes, warning, actions); modal.addEventListener("cancel", event => { event.preventDefault(); closeReview(); }); frame.shell.append(modal); modal.showModal();
  }
  function closeReview() {
    dialog?.close(); dialog?.remove(); dialog = null; fields.scrollTop = scroll;
    if (lastField?.isConnected) { lastField.focus({ preventScroll: true }); if (lastField instanceof HTMLInputElement && selection[0] !== null) lastField.setSelectionRange(...selection); }
    else review.focus({ preventScroll: true });
  }
  function travel(from: Sample[], to: Sample[]) {
    if (!from.length || dirty() || dialog) return;
    to.push(clone(sample)); sample = from.pop()!; revision = sample.revision; scope = "shared"; draft = clone(accepted()); renderFields(); sync(); report("Saved appearance and references restored together.");
  }
  function openSource() {
    const modal = el("dialog", "lp-dialog lr-source"); modal.ariaLabel = "Sample Source";
    const code = Object.entries(sample.looks).map(([id, style]) => `style tram_${id}:\n    color "${style.values.normal.color}"\n    size ${style.values.normal.size}\n    bold ${style.values.normal.bold ? "True" : "False"}`).join("\n\n") + "\n\n" + Object.entries(sample.uses).map(([key, id]) => `${key}: style "tram_${id}"`).join("\n");
    modal.append(el("h2", "", "Saved sample Source"), el("p", "", "Illustrative definitions and references. Pending changes are excluded. Actual Ren'Py serialization remains unqualified."), el("pre", "", code), action("Back to look", () => modal.close()));
    modal.onclose = () => modal.remove(); frame.shell.append(modal); modal.showModal();
  }
  renderFields(); sync(); report("Select a color to see this shared look change on both screens.");
};
