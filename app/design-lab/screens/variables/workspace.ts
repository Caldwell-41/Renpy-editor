import type { LabContext } from "../../contracts.ts";
import { action, element as el, labelled, labPage } from "../../page.ts";
import { technicalName, technicalNameInput, technicalNameHelp } from "../../../src/authoring-input.ts";
import { declaration, fixture, typeNames, validInt64, type Variable, type VariableType } from "./fixture.ts";
import "./variables.css";

type Draft = { name: string; type: VariableType; value: string };
const makeSelect = (options: [string, string][], value: string) => {
  const select = el("select");
  for (const [id, label] of options) { const option = el("option", "", label); option.value = id; select.append(option); }
  select.value = value; return select;
};

export function mountVariables(host: HTMLElement, context: LabContext, layout: "ledger" | "notebook") {
  const variables = fixture(context.state);
  const drafts = new Map<string, Draft>();
  let selected = layout === "ledger" ? variables[0]?.id : undefined;
  let creation: Draft | undefined;
  let searchTerm = "", typeFilter = "all", busy = false, disposed = false;
  let failurePending = context.state === "error";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const changed = (id: string) => {
    const original = variables.find(item => item.id === id), draft = drafts.get(id);
    return !!original && !!draft && original.value !== draft.value;
  };
  const anyDirty = () => !!creation && (creation.name !== "" || creation.value !== "false" || creation.type !== "bool") || [...drafts.keys()].some(changed);
  const frame = labPage(host, context, { screen: "variables", title: "Variables", subtitle: "Define the values your story starts with", dirty: anyDirty });
  frame.shell.classList.add("vl-shell", `vl-${layout}`);
  const newButton = action("New variable", () => {
    if (busy) return;
    creation ??= { name: "", type: "bool", value: "false" }; selected = "new"; render();
    frame.content.querySelector<HTMLInputElement>('[aria-label="Technical name"]')?.focus();
  }, true);
  frame.tools.append(newButton);
  const workspace = el("div", "vl-workspace"), browse = el("section", "vl-browse"), editor = el("section", "vl-editor");
  browse.ariaLabel = "Variable definitions"; editor.ariaLabel = "Variable editor";
  const toolbar = el("div", "vl-toolbar");
  const search = el("input"); search.type = "search"; search.placeholder = "Find a variable…"; search.ariaLabel = "Search variables";
  const filter = makeSelect([["all", "All types"], ["bool", "Boolean"], ["int", "Integer"], ["string", "Text"]], "all"); filter.ariaLabel = "Filter by type";
  const count = el("span", "vl-count muted"); count.ariaLive = "polite";
  toolbar.append(search, filter);
  const collection = el("div", "vl-collection");
  browse.append(toolbar, count, collection); workspace.append(browse, editor); frame.content.append(workspace);
  search.oninput = () => { searchTerm = search.value.toLowerCase(); renderCollection(); };
  filter.onchange = () => { typeFilter = filter.value; renderCollection(); };
  const setStatus = (message: string) => { frame.status.textContent = message; };
  function promptDiscard(message: string, onDiscard: () => void, returnFocus: HTMLElement) {
    const dialog = el("dialog", "lp-dialog"); dialog.ariaLabel = "Discard this draft?";
    dialog.append(el("h2", "", "Discard this draft?"), el("p", "", message));
    const keep = action("Keep editing", () => dialog.close());
    dialog.append(keep, action("Discard draft", () => { dialog.close(); onDiscard(); }));
    dialog.onclose = () => { dialog.remove(); if (returnFocus.isConnected) returnFocus.focus(); };
    frame.shell.append(dialog); dialog.showModal(); keep.focus();
  }
  function selectVariable(id: string) {
    if (busy) return;
    selected = id; render();
    editor.querySelector<HTMLElement>("h2")?.focus();
  }
  function renderCollection() {
    collection.replaceChildren();
    const matches = variables.filter(item => item.name.includes(searchTerm) && (typeFilter === "all" || item.type === typeFilter));
    count.textContent = `${matches.length} ${matches.length === 1 ? "definition" : "definitions"}${drafts.size && [...drafts.keys()].some(changed) ? " · Unsaved drafts kept" : ""}`;
    if (!matches.length) {
      const empty = el("div", "vl-empty");
      empty.append(el("h2", "", variables.length ? "No matching variables" : "Give your story a starting point"), el("p", "muted", variables.length ? "Try another name or type." : "A Boolean can remember a choice. An Integer can count trust. Text can hold a destination."));
      empty.append(variables.length ? action("Clear filters", () => { searchTerm = ""; typeFilter = "all"; search.value = ""; filter.value = "all"; renderCollection(); search.focus(); }) : action("Create first variable", () => newButton.click(), true));
      collection.append(empty); return;
    }
    if (layout === "ledger") {
      const header = el("div", "vl-row vl-row-head"); header.ariaHidden = "true";
      for (const title of ["Name / type", "Default", ""]) header.append(el("span", "", title)); collection.append(header);
      for (const variable of matches) collection.append(variableCard(variable));
    } else {
      for (const type of ["bool", "int", "string"] as const) {
        const items = matches.filter(item => item.type === type); if (!items.length) continue;
        const group = el("section", "vl-group");
        const title = el("h2", "vl-group-title", `${typeNames[type]} · ${items.length}`);
        const copy = { bool: "Remember whether something happened", int: "Count what changes in the story", string: "Keep words for later" }[type];
        title.append(el("span", "muted", copy)); group.append(title);
        const cards = el("div", "vl-cards"); for (const variable of items) cards.append(variableCard(variable));
        group.append(cards); collection.append(group);
      }
    }
  }
  function variableCard(variable: Variable) {
    const row = el("article", layout === "ledger" ? "vl-row" : "vl-card");
    row.classList.toggle("vl-selected", selected === variable.id); row.dataset.variable = variable.id;
    const name = el("div", "vl-identity"), open = action(variable.name, () => selectVariable(variable.id));
    open.className = "vl-open"; open.ariaLabel = `Edit ${variable.name}`; name.append(open, el("span", "vl-type", typeNames[variable.type]));
    if (changed(variable.id)) name.append(el("span", "vl-draft-tag", "Draft kept"));
    const value = el("code", "vl-value", variable.type === "string" ? JSON.stringify(variable.value) : variable.value === "true" ? "True" : variable.value === "false" ? "False" : variable.value);
    value.title = variable.value || "Empty text";
    const usage = el("span", "vl-usage muted", `${variable.assignments.length} known ${variable.assignments.length === 1 ? "assignment" : "assignments"}`);
    row.append(name, value, usage); return row;
  }
  function render() {
    workspace.classList.toggle("vl-editing", !!selected);
    renderCollection(); renderEditor();
    newButton.disabled = busy;
  }
  function renderEditor() {
    editor.replaceChildren(); editor.hidden = !selected;
    if (!selected) return;
    const isNew = selected === "new", variable = variables.find(item => item.id === selected);
    if (!isNew && !variable) { selected = undefined; return; }
    let draft: Draft;
    if (isNew) draft = creation!;
    else { draft = drafts.get(variable!.id) ?? { name: variable!.name, type: variable!.type, value: variable!.value }; drafts.set(variable!.id, draft); }
    const top = el("div", "vl-editor-top");
    const back = action(layout === "notebook" ? "All variables" : "Close editor", () => {
      selected = undefined; render(); setStatus(anyDirty() ? "Draft kept. Select its variable to continue." : "Ready in sample");
      (collection.querySelector<HTMLElement>(`[data-variable="${variable?.id}"] .vl-open`) ?? newButton).focus();
    }); back.disabled = busy; back.classList.add("vl-back"); top.append(back);
    const heading = el("h2", "", isNew ? "New variable" : variable!.name); heading.tabIndex = -1;
    const description = el("p", "muted vl-editor-intro", isNew ? "Choose a name and a starting value." : "This default applies when a new game starts. Story beats can change it later.");
    const body = el("div", "vl-editor-body"), form = el("form", "vl-form");
    form.noValidate = true;
    const error = el("p", "vl-error"); error.role = "alert"; error.hidden = true;
    const name = el("input"); name.value = draft.name; name.readOnly = !isNew; name.ariaLabel = "Technical name";
    technicalNameInput(name); name.oninput = () => { draft.name = name.value; sync(); };
    const nameField = labelled("Technical name", name, isNew ? `${technicalNameHelp} Start with a letter. The name is fixed after creation.` : "This name and type are fixed after creation.");
    const type = makeSelect([["bool", "Boolean"], ["int", "Integer"], ["string", "Text"]], draft.type); type.ariaLabel = "Type"; type.disabled = !isNew;
    const typeField = labelled("Type", type);
    const fields = el("div", "vl-fields");
    if (isNew) fields.append(nameField, typeField);
    else {
      const identity = el("div", "vl-fixed-identity"); identity.append(el("span", "vl-type", `${typeNames[draft.type]} · ${draft.type}`), el("span", "muted", "Name and type fixed"));
      fields.append(identity);
    }
    let valueControl: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const valueHost = el("div", "vl-value-field");
    const updateValueControl = () => {
      if (draft.type === "bool") valueControl = makeSelect([["false", "False"], ["true", "True"]], draft.value);
      else if (draft.type === "string") { const area = el("textarea"); area.rows = 5; area.value = draft.value; valueControl = area; }
      else { const input = el("input"); input.inputMode = "numeric"; input.value = draft.value; valueControl = input; }
      valueControl.ariaLabel = "Default value";
      valueControl.oninput = () => { draft.value = valueControl.value; sync(); };
      valueControl.onchange = () => { draft.value = valueControl.value; sync(); };
      const help = draft.type === "bool" ? "Choose True or False. There is no implied third state." : draft.type === "int" ? "A whole number from -9223372036854775808 to 9223372036854775807. No leading zeroes, spaces or plus sign." : "Text is kept exactly as entered. Empty text is valid.";
      valueHost.replaceChildren(labelled("Default value", valueControl, help));
    };
    type.onchange = () => { draft.type = type.value as VariableType; draft.value = draft.type === "bool" ? "false" : draft.type === "int" ? "0" : ""; updateValueControl(); sync(); };
    updateValueControl();
    fields.append(valueHost); form.append(fields, error);
    const footer = el("div", "vl-editor-footer"), draftStatus = el("span", "vl-draft-state muted");
    const cancel = action("Cancel editing", () => {
      const discard = () => {
        if (isNew) { creation = undefined; selected = undefined; } else drafts.delete(variable!.id);
        render(); setStatus("Draft discarded in sample");
        if (!isNew) editor.querySelector<HTMLElement>('[aria-label="Default value"]')?.focus(); else newButton.focus();
      };
      if (isNew ? anyDirty() : changed(variable!.id)) promptDiscard("Only this variable's unsaved changes will be discarded.", discard, cancel); else { selected = undefined; render(); newButton.focus(); }
    });
    const save = action(isNew ? "Create variable" : "Save default", () => form.requestSubmit(), true);
    function sync() {
      const dirty = isNew || changed(variable!.id);
      save.disabled = busy || !dirty; cancel.disabled = busy;
      draftStatus.textContent = busy ? "Saving…" : dirty ? "Unsaved changes" : "Saved default";
      renderCollection();
    }
    form.onsubmit = event => {
      event.preventDefault(); if (busy || save.disabled) return;
      error.hidden = true; valueControl.removeAttribute("aria-invalid"); name.removeAttribute("aria-invalid");
      try {
        if (isNew) {
          draft.name = technicalName(draft.name);
          if (variables.some(item => item.name === draft.name)) throw new Error("A variable already uses this name. Choose another technical name.");
          name.value = draft.name;
        }
        if (draft.type === "int" && !validInt64(draft.value)) { valueControl.setAttribute("aria-invalid", "true"); valueControl.focus(); throw new Error("Enter a canonical signed 64-bit decimal integer. For example, 0 or -12."); }
      } catch (caught) {
        error.textContent = caught instanceof Error ? caught.message : String(caught); error.hidden = false;
        setStatus("Check the highlighted field. Your draft is kept.");
        if (valueControl.getAttribute("aria-invalid") !== "true") { name.setAttribute("aria-invalid", "true"); name.focus(); }
        return;
      }
      busy = true; sync(); back.disabled = true; newButton.disabled = true;
      for (const control of [name, type, valueControl]) control.disabled = true;
      setStatus("Saving in sample…");
      timer = setTimeout(() => {
        if (disposed) return;
        busy = false; back.disabled = false; newButton.disabled = false;
        name.disabled = false; type.disabled = !isNew; valueControl.disabled = false;
        if (failurePending) {
          failurePending = false; error.textContent = "Simulated save failure. Your draft is kept. Try saving again."; error.hidden = false;
          setStatus("Simulated save failure. Your draft is kept."); sync(); save.focus(); return;
        }
        if (isNew) {
          const created: Variable = { id: `new-${variables.length}`, name: draft.name, type: draft.type, value: draft.value, line: variables.length + 4, assignments: [] };
          variables.push(created); creation = undefined; selected = created.id; searchTerm = ""; typeFilter = "all"; search.value = ""; filter.value = "all";
        } else { variable!.value = draft.value; drafts.delete(variable!.id); }
        render(); setStatus(isNew ? "Variable created in sample" : "Default saved in sample");
        editor.querySelector<HTMLElement>("h2")?.focus();
      }, 240);
    };
    footer.append(draftStatus, cancel, save); form.append(footer); body.append(form);
    if (!isNew) {
      const related = el("section", "vl-related"); related.append(el("h3", "", "Assigned in"), el("p", "muted vl-limitation", "Known Set Variable beats only. Custom code is not included."));
      for (const assignment of variable!.assignments) {
        const link = action("", () => { if (!busy) frame.navigate("story"); }); link.className = "vl-assignment";
        link.ariaLabel = `Open ${assignment.scene}, Beat ${assignment.beat} in Story`;
        link.append(el("span", "", assignment.scene), el("small", "muted", `Beat ${assignment.beat}`), el("code", "", `= ${assignment.value}`)); related.append(link);
      }
      if (!variable!.assignments.length) related.append(el("p", "muted", "No known assignments."));
      const details = el("details", "vl-declaration"), summary = el("summary", "", "View declaration");
      details.append(summary, el("p", "muted", `game/state.rpy · Line ${variable!.line}`), el("pre", "", declaration(variable!))); related.append(details); body.append(related);
    }
    editor.append(top, heading, description, body); sync();
    if (context.state === "error" && failurePending) {
      const note = el("p", "vl-scenario-note", "Sample condition: the next save will fail once. Your draft stays available for retry."); body.prepend(note);
    }
  }
  render();
  return () => { disposed = true; if (timer) clearTimeout(timer); };
}
