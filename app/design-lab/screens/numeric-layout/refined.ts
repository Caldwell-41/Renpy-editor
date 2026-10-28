import type { LabMount } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { icon } from "../../../src/icons.ts";
import "./style.css";
import "./refined.css";

type Layout = "paired" | "axes" | "placement";
type Selection = "frame" | "text" | "vbox";
type Values = Record<string, string>;
const initial = (): Values => ({
  xpos: "0.5", ypos: "0.5", xunit: "relative", yunit: "relative",
  xanchor: "0.5", yanchor: "0.5", xaunit: "relative", yaunit: "relative",
  xsize: "640", ysize: "360", xminimum: "", yminimum: "", xmaximum: "", ymaximum: "",
  left_padding: "24", right_padding: "24", top_padding: "24", bottom_padding: "24", spacing: "16",
});

export function mountRefined(layout: Layout): LabMount {
  return (host, context) => {
    let selected: Selection = context.state === "constrained" ? "text" : context.state === "spacing" ? "vbox" : "frame";
    let conflict = context.state === "conflict";
    const saved = new Map<Selection, Values>([
      ["frame", initial()],
      ["vbox", { ...initial(), xpos: "0", ypos: "0", xanchor: "0", yanchor: "0", xunit: "px", yunit: "px", xaunit: "px", yaunit: "px", xsize: "544", ysize: "240" }],
      ["text", { ...initial(), xpos: "0", ypos: "0", xanchor: "0", yanchor: "0", xunit: "px", yunit: "px", xaunit: "px", yaunit: "px", xsize: "480", ysize: "56" }],
    ]);
    const drafts = new Map<Selection, Values>();
    const history: { selection: Selection; before: Values; after: Values }[] = [], future: typeof history = [];
    const values = () => drafts.get(selected) ?? saved.get(selected)!;
    const frame = labPage(host, context, { screen: "screens", title: "Screens", subtitle: "", dirty: () => drafts.size > 0 });
    frame.shell.classList.add("numeric-lab", "numeric-refined"); frame.shell.dataset.layout = layout;
    frame.heading.querySelector("p")?.remove();
    frame.shell.querySelector(".lp-sample")!.textContent = "#38 · Numeric layout";
    frame.shell.querySelector(".lp-fiction")!.textContent = "Browser sample · Changes stay in memory";
    const undo = action("Undo", () => travel(history, future, false));
    const redo = action("Redo", () => travel(future, history, true));
    frame.tools.append(undo, redo);
    const location = el("div", "numeric-location", "Help / game/ui/help.rpy");
    const rail = el("nav", "numeric-rail"); rail.ariaLabel = "Screen building steps";
    for (const label of ["1  Choose", "2  Design", "3  Connect"]) {
      const button = action(label, () => report("This comparison covers numeric Design fields. Composition and Connect keep their existing controls."));
      button.ariaPressed = String(label.includes("Design")); rail.append(button);
    }
    const workspace = el("div", "numeric-workspace"), stage = el("section", "numeric-stage"); stage.ariaLabel = "Sample canvas";
    const stageHeader = el("div", "numeric-stage-header");
    const aspect = el("select"); aspect.ariaLabel = "Sample resolution";
    for (const [value, label] of [["1280", "1280 × 720"], ["1024", "1024 × 768"]]) {
      const option = el("option", "", label); option.value = value!; aspect.append(option);
    }
    aspect.onchange = () => preview();
    stageHeader.append(el("h2", "", "Help"), aspect);
    const canvas = el("div", "numeric-canvas"), panel = el("div", "numeric-sample-panel");
    const title = el("h3", "", "Help"), body = el("p", "", "Click to continue. Scroll back to revisit a line.");
    const close = action("Close", () => choose("frame"));
    const sampleGroup = el("div", "numeric-sample-group");
    sampleGroup.append(title, body, close); panel.append(sampleGroup);
    const anchorMark = el("span", "numeric-anchor-mark"); anchorMark.ariaHidden = "true";
    canvas.append(panel, anchorMark);
    panel.onclick = e => { if (e.target === panel) choose("frame"); };
    sampleGroup.onclick = e => { if (e.target === sampleGroup || e.target === title) choose("vbox"); };
    body.onclick = () => choose("text");
    const picks = el("div", "numeric-picks"); picks.ariaLabel = "Sample elements";
    for (const [id, label] of [["frame", "Frame"], ["vbox", "Vertical group"], ["text", "Help text"]] as const) {
      const button = action(label, () => choose(id)); button.ariaLabel = label; button.dataset.pick = id; button.prepend(icon(id === "text" ? "source" : "panel")); picks.append(button);
    }
    const source = el("pre", "numeric-source"); source.ariaLabel = "Accepted sample source";
    const sourceDetails = el("details", "numeric-source-details");
    sourceDetails.append(el("summary", "", "Accepted sample source"), source);
    const geometry = el("p", "numeric-geometry"); geometry.role = "status";
    stage.append(stageHeader, canvas, geometry, picks, el("p", "numeric-boundary", "Schematic preview. Frame position, anchor and size update here. Other fields update the sample source."), sourceDetails);
    const inspector = el("section", "numeric-inspector"); inspector.ariaLabel = "Numeric layout editor";
    workspace.append(stage, inspector); frame.content.append(location, rail, workspace);
    const notice = el("p", "numeric-feedback"); notice.role = "alert"; notice.hidden = true;
    const footer = el("div", "numeric-commit");
    const commitState = el("p", "numeric-commit-state");
    const applyButton = el("button", "button primary", "Apply layout"); applyButton.type = "submit"; applyButton.setAttribute("form", "numeric-form");
    const cancel = action("Cancel", discard); cancel.dataset.cancel = "";
    const actions = el("div", "numeric-actions"); actions.append(applyButton, cancel);
    footer.append(notice, commitState, actions);
    const fieldNames = new Map<string, string>();
    let invalidKey: string | undefined;
    const expanded = new Set<string>();
    function report(message: string, error = false) {
      frame.status.textContent = message; notice.textContent = message; notice.hidden = !error;
    }
    function edit(key: string, value: string) {
      const next = { ...values(), [key]: value };
      if (JSON.stringify(next) === JSON.stringify(saved.get(selected))) drafts.delete(selected);
      else drafts.set(selected, next);
      report(drafts.has(selected) ? "Draft retained. Apply saves all layout fields together." : "No pending changes.");
      invalidKey = undefined;
      inspector.querySelectorAll("[aria-invalid]").forEach(input => input.removeAttribute("aria-invalid"));
      sync(); preview();
    }
    function field(key: string, label: string, unit = "px") {
      const input = el("input"); input.type = "text"; input.inputMode = "decimal"; input.value = values()[key] ?? "";
      fieldNames.set(key, label); input.ariaLabel = label; input.placeholder = "Inherited"; input.dataset.field = key;
      input.oninput = () => edit(key, input.value);
      input.id = `numeric-${key}`;
      if (key === invalidKey) input.setAttribute("aria-invalid", "true");
      const control = labelled(label, input);
      if (unit) control.append(el("span", "numeric-unit", unit));
      return control;
    }
    function coordinate(axis: "x" | "y", anchor: boolean) {
      const horizontal = axis === "x", key = `${axis}${anchor ? "anchor" : "pos"}`, unitKey = `${axis}${anchor ? "a" : ""}unit`;
      const label = `${horizontal ? "Horizontal" : "Vertical"} ${anchor ? "anchor" : "position"}`;
      const control = field(key, label, ""), select = el("select"); select.ariaLabel = `${label} unit`;
      control.querySelector(".lp-label")!.textContent = anchor ? "Anchor" : "Position";
      control.classList.add("numeric-coordinate");
      control.title = `In relative units, 0.5 means halfway ${anchor ? "across the element" : "across the parent"}.`;
      for (const [value, text] of [["px", "px"], ["relative", anchor ? "of element" : "of parent"]]) {
        const option = el("option", "", text); option.value = value!; select.append(option);
      }
      select.value = values()[unitKey]!; select.onchange = () => edit(unitKey, select.value);
      control.append(select); return control;
    }
    function group(title: string, children: HTMLElement[], expandable = false) {
      const section = el(expandable ? "details" : "section", "numeric-group");
      section.dataset.group = title.toLowerCase().replaceAll(" ", "-");
      if (section instanceof HTMLDetailsElement) {
        section.open = expanded.has(title);
        section.ontoggle = () => { if (section.open) expanded.add(title); else expanded.delete(title); };
      }
      section.append(el(expandable ? "summary" : "h3", "", title));
      const grid = el("div", "numeric-grid"); grid.append(...children); section.append(grid); return section;
    }
    function setAlignment(x: string, y: string) {
      const next = { ...values(), xpos: x, ypos: y, xanchor: x, yanchor: y,
        xunit: "relative", yunit: "relative", xaunit: "relative", yaunit: "relative" };
      if (JSON.stringify(next) === JSON.stringify(saved.get(selected))) drafts.delete(selected);
      else drafts.set(selected, next);
      invalidKey = undefined; render(); report("Position and anchor changed together in the draft. Apply to save.");
    }
    function alignment() {
      const section = el("section", "numeric-group numeric-placement");
      section.append(el("h3", "", "Align in parent"));
      const buttons = el("div", "numeric-align-grid"); buttons.ariaLabel = "Alignment presets";
      const v = values();
      for (const [row, y] of ["0.0", "0.5", "1.0"].entries()) for (const [col, x] of ["0.0", "0.5", "1.0"].entries()) {
        const label = `${["Top", "Middle", "Bottom"][row]} ${["left", "center", "right"][col]}`;
        const button = action(label, () => setAlignment(x, y));
        button.title = `${label}. Sets position and anchor together.`; button.ariaLabel = label; button.dataset.alignX = x; button.dataset.alignY = y;
        button.ariaPressed = String(v.xunit === "relative" && v.yunit === "relative" && v.xaunit === "relative" && v.yaunit === "relative" &&
          Number(v.xpos) === Number(x) && Number(v.xanchor) === Number(x) && Number(v.ypos) === Number(y) && Number(v.yanchor) === Number(y));
        button.append(el("span", "numeric-align-dot")); buttons.append(button);
      }
      section.append(buttons); return section;
    }
    function pairedCoordinates() {
      const section = el("section", "numeric-group numeric-paired-coordinates");
      section.append(el("h3", "", "Position and anchor"));
      const grid = el("div", "numeric-grid");
      grid.append(el("h4", "numeric-axis-label", "Horizontal"), el("h4", "numeric-axis-label", "Vertical"),
        coordinate("x", false), coordinate("y", false), coordinate("x", true), coordinate("y", true));
      section.append(grid);
      return section;
    }
    function render() {
      const heading = el("div", "numeric-editor-heading");
      const headingText = el("div");
      headingText.append(el("h2", "", selected === "frame" ? "Frame" : selected === "vbox" ? "Vertical group" : "Help text"));
      const marker = el("span", "numeric-draft"); marker.dataset.draft = ""; heading.append(headingText, marker);
      const form = el("form"); form.id = "numeric-form"; form.onsubmit = e => { e.preventDefault(); apply(); };
      if (selected === "text") {
        const constraint = el("div", "numeric-constraint");
        constraint.append(el("p", "", "The vertical group controls this element's vertical placement."),
          action("Edit group spacing", () => choose("vbox")));
        form.append(constraint);
      }
      if (layout === "placement") {
        const quick = el("div", "numeric-quick");
        quick.append(alignment(), group("Size", [field("xsize", "Width"), field("ysize", "Height")])); form.append(quick);
        const exact = el("details", "numeric-group"); exact.dataset.group = "position-and-anchor";
        exact.open = expanded.has("Exact coordinates");
        exact.ontoggle = () => { if (exact.open) expanded.add("Exact coordinates"); else expanded.delete("Exact coordinates"); };
        exact.append(el("summary", "", "Position and anchor"), pairedCoordinates()); form.append(exact);
      } else if (layout === "axes") {
        const axes = el("div", "numeric-axis-columns");
        for (const axis of ["x", "y"] as const) {
          const dimension = axis === "x" ? "width" : "height";
          axes.append(group(axis === "x" ? "Horizontal" : "Vertical", [coordinate(axis, false), coordinate(axis, true),
            field(`${axis}size`, axis === "x" ? "Width" : "Height"), field(`${axis}minimum`, `Minimum ${dimension}`), field(`${axis}maximum`, `Maximum ${dimension}`)]));
        }
        form.append(axes, alignment());
      } else {
        form.append(pairedCoordinates());
        const quick = el("div", "numeric-quick");
        quick.append(group("Size", [field("xsize", "Width"), field("ysize", "Height")]), alignment()); form.append(quick);
      }
      if (layout !== "axes") form.append(group("Size limits", [field("xminimum", "Minimum width"), field("xmaximum", "Maximum width"), field("yminimum", "Minimum height"), field("ymaximum", "Maximum height")], true));
      if (selected === "frame") form.append(group("Padding", [field("left_padding", "Left padding"), field("right_padding", "Right padding"), field("top_padding", "Top padding"), field("bottom_padding", "Bottom padding")], true));
      if (selected === "vbox") form.append(group("Children", [field("spacing", "Spacing")]));
      form.onkeydown = e => { if (e.key === "Escape") { e.preventDefault(); discard(); } };
      inspector.replaceChildren(heading, form, footer); sync(); preview();
    }
    function sync() {
      inspector.querySelector<HTMLElement>("[data-draft]")!.textContent = drafts.has(selected) ? "Unapplied" : "Saved";
      const v = values();
      inspector.querySelectorAll<HTMLButtonElement>("[data-align-x]").forEach(button => {
        button.ariaPressed = String(v.xunit === "relative" && v.yunit === "relative" && v.xaunit === "relative" && v.yaunit === "relative" &&
          Number(v.xpos) === Number(button.dataset.alignX) && Number(v.xanchor) === Number(button.dataset.alignX) &&
          Number(v.ypos) === Number(button.dataset.alignY) && Number(v.yanchor) === Number(button.dataset.alignY));
      });
      commitState.textContent = drafts.has(selected) ? "Draft preview. Enter applies all layout fields." : "No pending changes. Enter applies; Escape cancels.";
      sampleGroup.dataset.selected = String(selected === "vbox");
      inspector.querySelector<HTMLButtonElement>("[data-cancel]")!.disabled = !drafts.has(selected);
      undo.disabled = !history.length; redo.disabled = !future.length;
      picks.querySelectorAll("button").forEach(button => button.ariaPressed = String(button.dataset.pick === selected));
      panel.dataset.selected = String(selected === "frame"); body.dataset.selected = String(selected === "text");
    }
    function validate(): string | undefined {
      invalidKey = undefined;
      const reject = (key: string, message: string) => { invalidKey = key; return message + " Your draft is retained."; };
      const v = values(), numeric = (key: string) => Number(v[key]);
      for (const [key, value] of Object.entries(v)) {
        if (key.endsWith("unit") || value === "") continue;
        if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || !Number.isFinite(Number(value))) return reject(key, `${fieldNames.get(key) ?? key} needs a finite number.`);
        if (!["xpos", "ypos", "xanchor", "yanchor"].includes(key) && (!Number.isInteger(Number(value)) || Number(value) < 0)) return reject(key, `${fieldNames.get(key) ?? key} needs a whole number of pixels at or above zero.`);
      }
      for (const key of ["xsize", "ysize"]) if (numeric(key) <= 0) return reject(key, `${fieldNames.get(key)} must be above zero.`);
      for (const key of ["xpos", "ypos", "xanchor", "yanchor"]) if (v[key] === "") return reject(key, `${fieldNames.get(key) ?? key} needs a value.`);
      for (const axis of ["x", "y"]) for (const anchor of [false, true]) {
        const key = `${axis}${anchor ? "anchor" : "pos"}`, unitKey = `${axis}${anchor ? "a" : ""}unit`;
        if (v[unitKey] === "px" && !Number.isInteger(numeric(key))) return reject(key, `${axis === "x" ? "Horizontal" : "Vertical"} ${anchor ? "anchor" : "position"} in pixels needs a whole number.`);
      }
      for (const axis of ["x", "y"]) if (v[`${axis}minimum`] && v[`${axis}maximum`] && numeric(`${axis}minimum`) > numeric(`${axis}maximum`)) return reject(`${axis}minimum`, `Minimum ${axis === "x" ? "width" : "height"} exceeds its maximum.`);
      for (const axis of ["x", "y"]) {
        const dimension = axis === "x" ? "width" : "height";
        if (v[`${axis}minimum`] && numeric(`${axis}size`) < numeric(`${axis}minimum`)) return reject(`${axis}minimum`, `Minimum ${dimension} exceeds the explicit ${dimension}.`);
        if (v[`${axis}maximum`] && numeric(`${axis}size`) > numeric(`${axis}maximum`)) return reject(`${axis}maximum`, `Maximum ${dimension} is below the explicit ${dimension}.`);
      }
      if (selected === "text" && ["ypos", "yanchor", "yunit", "yaunit"].some(key => v[key] !== saved.get(selected)![key])) return reject("ypos", "The vertical group controls vertical placement. Cancel this change or edit group spacing.");
    }
    function apply() {
      const error = validate(); if (error) {
        render(); report(error, true);
        const input = inspector.querySelector<HTMLInputElement>(`[data-field="${invalidKey}"]`);
        for (const ancestor of inspector.querySelectorAll("details")) if (ancestor.contains(input ?? null)) ancestor.open = true;
        input?.focus({ preventScroll: true }); input?.scrollIntoView({ block: "nearest" }); return;
      }
      if (conflict) { report("Source changed after this draft began. Review Source before applying. Your draft is retained.", true); return; }
      if (!drafts.has(selected)) { report("No change. No history entry added."); return; }
      const next = { ...values() };
      const active = document.activeElement as HTMLInputElement | null;
      const focusKey = active?.dataset.field, caret = active?.selectionStart;
      history.push({ selection: selected, before: { ...saved.get(selected)! }, after: next }); future.length = 0;
      saved.set(selected, next); drafts.delete(selected); render(); report("Layout saved in sample. Undo restores all fields together.");
      if (focusKey) {
        const input = inspector.querySelector<HTMLInputElement>(`[data-field="${focusKey}"]`);
        input?.focus({ preventScroll: true }); if (caret !== null && caret !== undefined) input?.setSelectionRange(caret, caret);
      }
    }
    function discard() {
      const focusKey = (document.activeElement as HTMLElement)?.dataset.field;
      drafts.delete(selected); invalidKey = undefined; render(); report("Draft cancelled. Saved layout restored.");
      if (focusKey) inspector.querySelector<HTMLInputElement>(`[data-field="${focusKey}"]`)?.focus({ preventScroll: true });
    }
    function choose(selection: Selection) { selected = selection; invalidKey = undefined; notice.hidden = true; render(); }
    function travel(from: typeof history, to: typeof history, forward: boolean) {
      if (drafts.size) { report("Apply or cancel unfinished layout changes before using history. Your draft is retained.", true); return; }
      const entry = from.pop(); if (!entry) return;
      to.push(entry); saved.set(entry.selection, { ...(forward ? entry.after : entry.before) }); selected = entry.selection;
      render(); report(forward ? "Redid the layout change." : "Undid the layout change.");
    }
    function preview() {
      const v = selected === "frame" ? values() : saved.get("frame")!;
      const width = Number(aspect.value), height = width === 1280 ? 720 : 768;
      canvas.style.aspectRatio = `${width}/${height}`;
      const number = (key: string, fallback: number) => Number.isFinite(Number(v[key])) && v[key] !== "" ? Number(v[key]) : fallback;
      const w = Math.max(1, number("xsize", 640)), h = Math.max(1, number("ysize", 360));
      const position = (axis: string, available: number, elementSize: number) => (v[`${axis}unit`] === "relative" ? number(`${axis}pos`, 0.5) * available : number(`${axis}pos`, 0)) - (v[`${axis}aunit`] === "relative" ? number(`${axis}anchor`, 0.5) * elementSize : number(`${axis}anchor`, 0));
      panel.style.left = `${position("x", width, w) / width * 100}%`; panel.style.top = `${position("y", height, h) / height * 100}%`;
      panel.style.width = `${w / width * 100}%`; panel.style.height = `${h / height * 100}%`;
      canvas.dataset.draft = String(selected === "frame" && drafts.has(selected));
      const point = (axis: string, available: number) => v[`${axis}unit`] === "relative" ? number(`${axis}pos`, 0.5) * available : number(`${axis}pos`, 0);
      anchorMark.style.left = `${point("x", width) / width * 100}%`;
      anchorMark.style.top = `${point("y", height) / height * 100}%`;
      geometry.textContent = `Frame · ${Math.round(position("x", width, w))}, ${Math.round(position("y", height, h))} px · ${w} × ${h} px${selected === "frame" && drafts.has(selected) ? " · draft" : ""}`;
      picks.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
        const draft = drafts.has(button.dataset.pick as Selection);
        button.dataset.hasDraft = String(draft);
        button.title = draft ? "Unapplied layout draft" : "Select element";
      });
      const accepted = saved.get(selected)!;
      const literal = (key: string, unit: string) => {
        const value = String(Number(accepted[key]));
        return accepted[unit] === "relative" && !value.includes(".") ? `${value}.0` : value;
      };
      const properties = [
        ...[["xpos", "xunit"], ["ypos", "yunit"], ["xanchor", "xaunit"], ["yanchor", "yaunit"]]
          .filter(([key]) => accepted[key!] !== "").map(([key, unit]) => `${key} ${literal(key!, unit!)}`),
        ...["xsize", "ysize", "xminimum", "xmaximum", "yminimum", "ymaximum", ...(selected === "frame" ? ["left_padding", "right_padding", "top_padding", "bottom_padding"] : []), ...(selected === "vbox" ? ["spacing"] : [])]
          .filter(key => accepted[key] !== "").map(key => `${key} ${Number(accepted[key])}`),
      ];
      source.textContent = `# Accepted browser sample\n${selected}:\n${properties.map(property => `    ${property}`).join("\n")}`;
    }
    render();
    if (conflict) report("Source conflict sample. Edit a field and apply to inspect draft retention.");
    return () => frame.shell.remove();
  };
}
