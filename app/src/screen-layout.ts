import type { ScreenDocument, ScreenNode } from "./screen-ui.ts";
import { validateField } from "./authoring-input.ts";

export type LayoutUnit = "pixels" | "relative" | "count";
export interface LayoutValue { unit: LayoutUnit; value: number }
export interface NumericLayout { values: Record<string, LayoutValue>; blocked: Record<string, string>; sourceBlocked?: Record<string, string>; sizingNote?: string | null; allowsEmptyCells?: boolean }
export type LayoutEdits = Record<string, LayoutValue | null>;
export interface LayoutReservation {
  accept: (accepted: ScreenDocument) => void;
  release: () => void;
}
interface Field { text: string; unit: LayoutUnit }
interface Draft { key: string; document: ScreenDocument; screen: string; node: ScreenNode; fields: Record<string, Field> }
interface View { document: ScreenDocument; screen: string; node: ScreenNode; nodes: ScreenNode[]; busy: boolean; otherDraft: boolean }
interface Host {
  view: () => View | undefined;
  commit: (draft: Draft, edits: LayoutEdits) => Promise<void>;
  preview: () => void;
  note: (text: string, error?: boolean) => void;
  select: (node: ScreenNode) => void;
}
const labels: Record<string, string> = {
  columns: "Columns", rows: "Rows",
  xpos: "Horizontal position", ypos: "Vertical position", xanchor: "Horizontal anchor", yanchor: "Vertical anchor",
  xsize: "Width", ysize: "Height", xminimum: "Minimum width", xmaximum: "Maximum width", yminimum: "Minimum height", ymaximum: "Maximum height",
  left_padding: "Left padding", right_padding: "Right padding", top_padding: "Top padding", bottom_padding: "Bottom padding", spacing: "Spacing",
};
const coordinate = (key: string) => ["xpos", "ypos", "xanchor", "yanchor"].includes(key);
const nodeKey = (node: ScreenNode) => node.id ?? JSON.stringify([node.kind, node.literal, node.span.start]);
const draftKey = (document: ScreenDocument, screen: string, node: ScreenNode) => JSON.stringify([document.path, screen, nodeKey(node)]);
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = "") => {
  const result = document.createElement(tag); result.className = className; result.textContent = text; return result;
};
const action = (text: string, callback: () => void) => { const button = el("button", "button secondary", text); button.type = "button"; button.onclick = callback; return button; };
let sequence = 0;

/** Per-element numeric drafts retain their source revision until acceptance or Cancel. */
export class ScreenLayoutEditor {
  private readonly drafts = new Map<string, Draft>();
  private readonly emptyUnits = new Map<string, Record<string, LayoutUnit>>();
  private readonly expanded = new Map<string, Set<string>>();
  private readonly formId = `screen-layout-${++sequence}`;
  private hostElement?: HTMLElement;
  private readonly errors = new Map<string, { text: string; field?: string }>();
  private readonly fieldValidators = new Map<string, () => void>();
  private composing = false;
  private saving = false;
  private sharedCommit = false;
  constructor(private readonly host: Host) {}
  hasDraft(): boolean { return this.drafts.size > 0; }
  hasNodeDraft(document: ScreenDocument, screen: string, node: ScreenNode): boolean { return this.drafts.has(draftKey(document, screen, node)); }
  renderRetained(host: HTMLElement, documents: ScreenDocument[]): void {
    for (const [key, draft] of this.drafts) {
      const nodes = documents.find(document => document.path === draft.document.path)?.screens.find(screen => screen.name === draft.screen)?.nodes;
      if (nodes?.some(node => nodeKey(node) === nodeKey(draft.node))) continue;
      const section = el("section", "screen-retained-draft");
      section.append(el("p", "", "The element is no longer available in Source. Your layout draft is retained here."));
      const input = el("textarea"); input.ariaLabel = "Retained layout draft"; input.readOnly = true;
      input.value = Object.keys(this.edits(draft.fields, draft.node)).map(key => `${labels[key]}: ${draft.fields[key]!.text || "Inherited"}${draft.fields[key]!.text ? draft.fields[key]!.unit === "pixels" ? " px" : coordinate(key) && key.endsWith("anchor") ? " of element" : " of parent" : ""}`).join("\n");
      section.append(input, action("Discard retained layout draft", () => {
        this.drafts.delete(key); this.emptyUnits.delete(key); this.errors.delete(key); section.remove(); this.host.preview(); this.host.note("Retained layout draft discarded. No source was written.");
      }));
      host.append(section);
    }
  }
  canvasDraft(): { invalid: boolean; layouts: { nodeStart: number; values: LayoutEdits }[] } {
    const view = this.host.view(); if (!view) return { invalid:this.hasDraft(), layouts:[] };
    const layouts: { nodeStart: number; values: LayoutEdits }[] = [];
    for (const draft of this.drafts.values()) {
      if (draft.document.path !== view.document.path || draft.screen !== view.screen) continue;
      const node = view.nodes.find(node => nodeKey(node) === nodeKey(draft.node));
      if (!node || draft.document.revision !== view.document.revision || this.validate({...view,node},draft.fields)) return {invalid:true,layouts:[]};
      layouts.push({nodeStart:node.span.start,values:this.edits(draft.fields,draft.node)});
    }
    return {invalid:false,layouts};
  }
  currentDraft(validate = false): { document: ScreenDocument; values: LayoutEdits } | undefined {
    const view = this.host.view(); if (!view) return;
    const draft = this.drafts.get(this.key(view)); if (!draft) return;
    if (validate) {
      const invalid = this.validate(view, draft.fields);
      if (invalid) { this.fail(invalid.text, invalid.key); throw Error(invalid.text); }
    }
    return { document:draft.document, values:this.edits(draft.fields,draft.node) };
  }
  /** A combined Apply reserves layout even when only the other fields changed. */
  reserveForComposition(base: ScreenDocument): LayoutReservation {
    const view = this.host.view(), key = view ? this.key(view) : "";
    this.saving = true; this.sync();
    return {
      accept: accepted => this.accept(key, base, accepted),
      release: () => { this.saving = false; this.sync(); },
    };
  }
  cancelCurrent(): boolean { const view = this.host.view(); if (!view || !this.drafts.has(this.key(view))) return false; this.cancel(); return true; }
  private key(view: View): string { return draftKey(view.document, view.screen, view.node); }
  private fields(node: ScreenNode): Record<string, Field> {
    return Object.fromEntries(Object.keys(labels).map(key => [key, { text: node.numericLayout?.values[key] === undefined ? "" : String(node.numericLayout.values[key]!.value), unit: node.numericLayout?.values[key]?.unit ?? (["columns", "rows"].includes(key) ? "count" : "pixels") }]));
  }
  private current(view: View): Record<string, Field> {
    const draft = this.drafts.get(this.key(view)); if (draft) return draft.fields;
    const fields = this.fields(view.node);
    for (const [key,unit] of Object.entries(this.emptyUnits.get(this.key(view)) ?? {})) if (!fields[key]!.text) fields[key]!.unit = unit;
    return fields;
  }
  private edits(fields: Record<string, Field>, node: ScreenNode): LayoutEdits {
    const result: LayoutEdits = {};
    for (const [key, field] of Object.entries(fields)) {
      const value = field.text.trim() === "" ? null : { unit: field.unit, value: Number(field.text) };
      const before = node.numericLayout?.values[key];
      if (value === null ? before !== undefined : !before || value.unit !== before.unit || value.value !== before.value) result[key] = value;
    }
    return result;
  }
  private edit(key: string, change: Partial<Field>): void {
    const view = this.host.view(); if (!view || view.busy || this.saving) return;
    const id = this.key(view), fields = structuredClone(this.current(view)); fields[key] = { ...fields[key]!, ...change };
    if (change.unit && !fields[key]!.text) this.emptyUnits.set(id, {...this.emptyUnits.get(id),[key]:change.unit});
    if (!Object.keys(this.edits(fields, view.node)).length) this.drafts.delete(id);
    else {
      const draft = this.drafts.get(id) ?? { key: id, document: view.document, screen: view.screen, node: view.node, fields };
      draft.fields = fields; this.drafts.set(id, draft);
    }
    this.errors.delete(id);
    if (!this.composing) for (const input of this.hostElement?.querySelectorAll<HTMLInputElement>('input[aria-invalid="true"]') ?? []) {
      try { this.fieldValidators.get(input.dataset.layoutField!)?.(); } catch { /* Refresh only errors already shown. */ }
    }
    this.sync(); this.host.preview();
  }
  accept(key: string, base: ScreenDocument, accepted: ScreenDocument): void {
    this.drafts.delete(key); this.emptyUnits.delete(key); this.errors.delete(key); this.saving = false;
    for (const draft of this.drafts.values()) {
      if (!draft.node.id || draft.document.path !== base.path || draft.document.revision !== base.revision) continue;
      const node = accepted.screens.find(screen => screen.name === draft.screen)?.nodes.find(node => node.id === draft.node.id);
      if (node && node.kind === draft.node.kind && JSON.stringify(node.numericLayout) === JSON.stringify(draft.node.numericLayout)) {
        draft.document = accepted; draft.node = node;
      }
    }
  }
  private validate(view: View, fields: Record<string, Field>, completed?: string): { key: string; text: string } | undefined {
    const edits = this.edits(fields, view.node);
    if (view.node.kind === "grid") {
      for (const key of ["columns", "rows"]) {
        if (completed && completed !== key) continue;
        const value = Number(fields[key]!.text);
        if (!/^\d+$/.test(fields[key]!.text.trim()) || !Number.isInteger(value) || value < 1 || value > 64) return {key,text:`${labels[key]} needs a whole number from 1 to 64. Input retained.`};
      }
      const children = view.nodes.filter(node => node.parentStart === view.node.span.start).length;
      if (Number(fields.columns!.text) * Number(fields.rows!.text) < children) return {key:completed === "rows" ? "rows" : "columns",text:`The grid needs room for ${children} children. Increase columns or rows. Input retained.`};
    }
    for (const [key, field] of Object.entries(fields)) {
      if (completed && key !== completed) continue;
      if (field.text.trim() === "") continue;
      const value = Number(field.text);
      if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(field.text.trim()) || !Number.isFinite(value)) return { key, text: `${labels[key]} needs a finite number. Input retained.` };
      if (Math.abs(value) > 16384 || field.unit === "pixels" && !Number.isInteger(value) || !coordinate(key) && value < (key.endsWith("size") ? 1 : 0)) return { key, text: `${labels[key]} needs ${coordinate(key) ? "a supported coordinate" : "a whole number of pixels"} within ${coordinate(key) ? "−16384 to 16384" : key.endsWith("size") ? "1 to 16384" : "0 to 16384"}. Input retained.` };
      if (key in edits && view.node.numericLayout?.blocked[key]) return { key, text: `${view.node.numericLayout.blocked[key]} Input retained.` };
    }
    for (const key of Object.keys(edits)) if ((!completed || key === completed) && view.node.numericLayout?.blocked[key]) return { key, text: `${view.node.numericLayout.blocked[key]} Input retained.` };
    for (const axis of ["x", "y"]) {
      if (completed && ![`${axis}size`, `${axis}minimum`, `${axis}maximum`].includes(completed)) continue;
      const size = fields[`${axis}size`]!.text, min = fields[`${axis}minimum`]!.text, max = fields[`${axis}maximum`]!.text;
      if (size && (min || max)) return { key: `${axis}minimum`, text: `Clear ${axis === "x" ? "Width" : "Height"} before setting its limits. Ren'Py's fixed size sets both bounds. Input retained.` };
      if (min && max && Number(min) > Number(max)) return { key: `${axis}minimum`, text: `Minimum ${axis === "x" ? "width" : "height"} exceeds its maximum. Input retained.` };
    }
  }
  private fail(text: string, key?: string): void {
    const view = this.host.view(); if (view) this.errors.set(this.key(view), { text, field: key }); this.host.note(text, true); this.sync();
    const input = key && this.hostElement?.querySelector<HTMLInputElement>(`[data-layout-field="${key}"]`);
    if (input) { try { this.fieldValidators.get(key)?.(); } catch { /* The shared validator displays the field error. */ } const details = input.closest("details"); if (details) details.open = true; input.focus({ preventScroll: true }); input.scrollIntoView({ block: "nearest" }); }
  }
  private async apply(): Promise<void> {
    const view = this.host.view(); if (!view || view.busy || this.saving || this.composing) return;
    const draft = this.drafts.get(this.key(view));
    if (!draft) { this.host.note("No change. No undo entry added."); return; }
    const invalid = this.validate(view, draft.fields); if (invalid) { this.fail(invalid.text, invalid.key); return; }
    if (view.otherDraft) { this.fail("Apply or cancel the other unfinished edit first. Layout input retained."); return; }
    if (draft.document.revision !== view.document.revision) { this.fail("This layout draft uses an earlier Source revision. Input retained. Review Source, or cancel this draft before editing again."); return; }
    this.saving = true; this.sync();
    try { await this.host.commit(draft, this.edits(draft.fields, draft.node)); }
    catch (error) { this.fail(`${(error as Error).message} Input retained. Review Source, or cancel this draft and refresh.`); }
    finally { this.saving = false; this.sync(); }
  }
  private cancel(): void {
    const view = this.host.view(); if (!view || view.busy || this.saving || this.composing) return;
    const key = (document.activeElement as HTMLElement | null)?.dataset.layoutField;
    this.drafts.delete(this.key(view)); this.emptyUnits.delete(this.key(view)); this.errors.delete(this.key(view)); const host = this.hostElement; if (host) this.render(host,this.sharedCommit);
    if (key) this.hostElement?.querySelector<HTMLInputElement>(`[data-layout-field="${key}"]`)?.focus({ preventScroll: true });
    this.host.note("Layout changes cancelled. No source was written."); this.host.preview();
  }
  render(host: HTMLElement, sharedCommit = false): void {
    this.sharedCommit = sharedCommit;
    const view = this.host.view(); if (!view?.node.numericLayout) return;
    for (const details of this.hostElement?.querySelectorAll<HTMLDetailsElement>("details[data-layout-owner]") ?? []) {
      const expanded = this.expanded.get(details.dataset.layoutOwner!) ?? new Set<string>();
      if (details.open) expanded.add(details.dataset.layoutGroup!); else expanded.delete(details.dataset.layoutGroup!);
      this.expanded.set(details.dataset.layoutOwner!, expanded);
    }
    this.hostElement = host; this.fieldValidators.clear(); this.composing = false; host.classList.add("screen-layout"); host.replaceChildren();
    const heading = el("div", "layout-heading"); heading.append(el("h3", "", ({fixed:"Free layout group",frame:"Frame",window:"Window",vbox:"Vertical group",hbox:"Horizontal group",grid:"Grid",viewport:"Viewport",text:"Text",textbutton:"Button",image:"Image"} as Record<string,string>)[view.node.kind] ?? view.node.kind), el("span", "layout-state"));
    const form = el("form", "layout-form"); form.id = this.formId;
    form.addEventListener("compositionstart", () => { this.composing = true; });
    form.addEventListener("compositionend", () => { this.composing = false; });
    form.onsubmit = event => { event.preventDefault(); if (!this.sharedCommit) void this.apply(); };
    form.onkeydown = event => {
      if (this.composing || event.isComposing || event.keyCode === 229) { event.stopPropagation(); return; }
      if (this.sharedCommit) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); this.cancel(); }
      else if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); void this.apply(); }
    };
    const fields = this.current(view);
    const field = (key: string) => {
      const label = el("label", "layout-field"), input = el("input"); input.type = "text"; input.inputMode = "decimal";
      input.ariaLabel = labels[key]!; input.dataset.layoutField = key; input.value = fields[key]!.text; input.placeholder = view.node.numericLayout?.blocked[key] ? "Source" : "Inherited";
      if (key === "xsize" || key === "ysize") input.dataset.size = key === "xsize" ? "width" : "height";
      input.oninput = () => this.edit(key, { text: input.value });
      this.fieldValidators.set(key, validateField(input, () => {
        const current = this.host.view(); if (!current) return;
        const invalid = this.validate(current, this.current(current), key);
        if (invalid) { this.errors.set(this.key(current), {text:invalid.text,field:invalid.key}); this.sync(); throw Error(invalid.text); }
        if (this.errors.get(this.key(current))?.field === key) this.errors.delete(this.key(current));
        this.sync();
      }));
      label.append(el("span", "layout-label", coordinate(key) ? key.endsWith("anchor") ? "Anchor" : "Position" : labels[key]), input);
      if (coordinate(key)) {
        label.classList.add("layout-coordinate"); const unit = el("select"); unit.ariaLabel = `${labels[key]} unit`;
        for (const [value, text] of [["pixels", "px"], ["relative", key.endsWith("anchor") ? "of element" : "of parent"]]) { const option = el("option", "", text); option.value = value!; unit.append(option); }
        unit.value = fields[key]!.unit; unit.title = "Relative 0.5 means half of the parent or element. Changing units keeps the typed number.";
        unit.onchange = () => {
          this.edit(key, { unit: unit.value as LayoutUnit });
          if (!this.composing) { try { this.fieldValidators.get(key)?.(); } catch { /* A unit selection completes this coordinate. */ } }
        }; label.append(unit);
      } else if (!["columns", "rows"].includes(key)) label.append(el("span", "layout-unit", "px"));
      return label;
    };
    const group = (name: string, keys: string[], expandable = false) => {
      const section = el(expandable ? "details" : "section", "layout-group"); section.append(el(expandable ? "summary" : "h3", "", name));
      if (section instanceof HTMLDetailsElement) {
        const owner = this.key(view), expanded = this.expanded.get(owner) ?? new Set<string>(); this.expanded.set(owner, expanded);
        section.dataset.layoutOwner = owner; section.dataset.layoutGroup = name; section.open = expanded.has(name);
        section.ontoggle = () => { if (section.open) expanded.add(name); else expanded.delete(name); };
      }
      const grid = el("div", "layout-grid"); grid.append(...keys.map(field)); section.append(grid); return section;
    };
    const parent = view.nodes.find(node => node.span.start === view.node.parentStart);
    if (view.node.kind === "grid") {
      const grid = group("Grid", ["columns", "rows", "spacing"]);
      const policy = view.node.numericLayout.allowsEmptyCells === true ? "Empty cells are allowed." : "Empty-cell policy stays in Source. Child-count changes are unavailable.";
      grid.append(el("p", "layout-sizing-note", `${view.nodes.filter(n => n.parentStart === view.node.span.start).length} children · Rows fill left to right. ${policy}`));
      if (view.node.numericLayout.blocked.columns) grid.append(el("p", "layout-sizing-note", view.node.numericLayout.blocked.columns));
      form.append(grid);
    }
    if (parent?.kind === "vbox") {
      const constraint = el("div", "layout-constraint"); constraint.append(el("p", "", "The vertical group controls this element's vertical placement."), action("Edit group spacing", () => this.host.select(parent))); form.append(constraint);
    }
    if (parent && ["hbox", "grid"].includes(parent.kind)) {
      const constraint = el("div", "layout-constraint");
      constraint.append(el("p", "", parent.kind === "grid" ? "The grid controls cell placement and order." : "The horizontal group controls this element's horizontal placement."), action(parent.kind === "grid" ? "Edit grid" : "Edit horizontal group", () => this.host.select(parent))); form.append(constraint);
    }
    const coordinates = group("Position and anchor", ["xpos", "ypos", "xanchor", "yanchor"]);
    const grid = coordinates.querySelector(".layout-grid")!;
    grid.prepend(el("h4", "layout-axis", "Horizontal"), el("h4", "layout-axis", "Vertical")); form.append(coordinates);
    const quick = el("div", "layout-quick"); if (!sharedCommit) quick.append(group("Size", ["xsize", "ysize"]));
    const alignment = el("section", "layout-group"); alignment.append(el("h3", "", "Align in parent"));
    const presets = el("div", "layout-presets"); presets.ariaLabel = "Alignment presets";
    for (const [row, y] of [0, 0.5, 1].entries()) for (const [column, x] of [0, 0.5, 1].entries()) {
      const name = `${["Top", "Middle", "Bottom"][row]} ${["left", "center", "right"][column]}`;
      const preset = action(name, () => { for (const [key,value] of [["xpos",x],["xanchor",x],["ypos",y],["yanchor",y]] as const) this.edit(key, {text:String(value),unit:"relative"}); if (this.hostElement) this.render(this.hostElement,this.sharedCommit); });
      preset.ariaLabel = preset.title = name; preset.dataset.alignX = String(x); preset.dataset.alignY = String(y); preset.append(el("span", "layout-dot")); presets.append(preset);
    }
    alignment.append(presets); quick.append(alignment); form.append(quick);
    if (view.node.numericLayout.sizingNote) form.append(el("p", "layout-sizing-note", view.node.numericLayout.sizingNote));
    form.append(group("Size limits", ["xminimum", "xmaximum", "yminimum", "ymaximum"], true));
    if (["frame", "window"].includes(view.node.kind)) form.append(group("Padding", ["left_padding", "right_padding", "top_padding", "bottom_padding"], true));
    if (["vbox", "hbox"].includes(view.node.kind)) form.append(group("Children", ["spacing"]));
    const commit = el("div", "layout-commit"), feedback = el("p", "layout-feedback"); feedback.role = "alert";
    const state = el("p", "layout-commit-state"), actions = el("div", "layout-actions");
    const apply = el("button", "button primary", "Apply layout"); apply.type = "submit"; apply.setAttribute("form", this.formId);
    const cancel = action("Cancel layout", () => this.cancel()); actions.append(apply, cancel); commit.append(feedback, state, actions);
    heading.hidden = commit.hidden = sharedCommit; host.append(heading, form, commit); this.sync();
    const error = this.errors.get(this.key(view));
    if (error?.field) { try { this.fieldValidators.get(error.field)?.(); } catch { /* Retain the field's explanation after remounting. */ } }
  }
  sync(): void {
    const view = this.host.view(), host = this.hostElement; if (!view || !host?.isConnected) return;
    const dirty = this.drafts.has(this.key(view)), fields = this.current(view);
    host.querySelector<HTMLElement>(".layout-state")!.textContent = dirty ? "Unapplied" : "Saved";
    const error = this.errors.get(this.key(view));
    const feedback = host.querySelector<HTMLElement>(".layout-feedback")!; feedback.textContent = error?.text ?? ""; feedback.hidden = !error;
    if (error?.field) feedback.removeAttribute("role"); else feedback.role = "alert";
    host.querySelector<HTMLElement>(".layout-commit-state")!.textContent = dirty ? "Draft preview. Enter applies all layout fields." : "No pending changes. Enter applies; Escape cancels.";
    host.querySelectorAll<HTMLInputElement>("input").forEach(input => { input.readOnly = view.busy || this.saving; });
    host.querySelectorAll<HTMLSelectElement>("select").forEach(select => select.disabled = view.busy || this.saving);
    host.querySelectorAll<HTMLButtonElement>("button").forEach(button => {
      const disabled = view.busy || this.saving || button.textContent === "Cancel layout" && !dirty;
      if (button.type === "submit") { button.ariaDisabled = String(disabled); button.disabled = false; }
      else button.disabled = disabled;
    });
    host.querySelectorAll<HTMLButtonElement>("[data-align-x]").forEach(button => button.ariaPressed = String(["xpos", "xanchor", "ypos", "yanchor"].every(key => fields[key]!.text !== "" && fields[key]!.unit === "relative" && Number(fields[key]!.text) === Number(key.startsWith("x") ? button.dataset.alignX : button.dataset.alignY))));
  }
}
