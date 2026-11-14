// New variable (`story-revamp` / `combined`): the rule builder's variable list creates a
// project variable in place. Name, type and starting value, then Create variable. Core
// writes the `default` statement as one edit with Undo. Escape or Cancel keeps nothing.
import { technicalName, technicalNameInput } from "./authoring-input.ts";
import { decimalValue, int64, type DecimalValue } from "./numeric-input.ts";
import type { SceneWorkspace } from "./scene-ui.ts";
import { backingSelect, button, choose, dropdownKeys, element, field, FieldError, openFormDialog, segmented } from "./story-editor-controls.ts";

export type Variable = SceneWorkspace["authoring"]["variables"][number];
export interface NewVariableRequest {
  readonly technicalName: string;
  readonly variableType: Variable["variableType"];
  readonly defaultValue: boolean | string | DecimalValue;
}
export interface NewVariableOptions {
  readonly host: HTMLElement;
  readonly opener: HTMLElement;
  /** Creates the variable. Resolves with it, or throws with a reason the dialog shows. */
  readonly create: (request: NewVariableRequest) => Promise<Variable>;
}

export const variableTypeName = (variable: Variable): string => ({ bool: "yes/no", int: "whole number", decimal: "decimal", string: "text" })[variable.variableType];
export function variableBadge(variable?: Variable): HTMLElement {
  const node = element("span", "story-type", variable ? ({ bool: "Y/N", int: "#", decimal: "#.#", string: "Aa" })[variable.variableType] : ""); node.setAttribute("aria-hidden", "true"); return node;
}

/**
 * The variable list (`story-revamp` / `combined`): a dropdown of the project's variables by
 * name and type that writes `select`. With `create`, it ends with "+ New variable…", and an
 * empty list says "No variables yet." (`story-release-fixes` / `a-v2`). It redraws when
 * `select` changes; `draw` redraws it after `select` is set without an event.
 */
export function variableMenu(select: HTMLSelectElement, options: { readonly label: string; readonly variables: () => readonly Variable[]; readonly create?: (summary: HTMLElement) => void }): { readonly menu: HTMLDetailsElement; readonly summary: HTMLElement; readonly draw: () => void } {
  const menu = element("details", "story-dropdown story-variable-picker"), summary = element("summary", "story-person"); summary.dataset.control = "";
  const list = element("div", "story-dropdown-list"); list.role = "listbox"; list.setAttribute("aria-label", options.label);
  const draw = (): void => {
    const variables = options.variables(), chosen = variables.find(item => item.id === select.value);
    // A variable that left the project keeps its select's own caption, such as "Missing Variable".
    const name = chosen?.technicalName ?? (select.value ? select.selectedOptions[0]?.textContent ?? undefined : undefined);
    summary.replaceChildren(variableBadge(chosen), element("span", name ? "story-variable-name" : "story-variable-name story-placeholder", name ?? "Choose a variable"), element("span", "story-caret", "▾"));
    summary.setAttribute("aria-label", `${options.label}: ${name ?? "none chosen"}`);
    list.replaceChildren();
    for (const item of variables) {
      const option = button("", "story-dropdown-option", () => { menu.open = false; choose(select, item.id); summary.focus(); });
      option.role = "option"; option.tabIndex = -1; option.dataset.value = item.id; option.setAttribute("aria-selected", String(item.id === select.value)); option.setAttribute("aria-label", `${item.technicalName}, ${variableTypeName(item)}`);
      const text = element("span", "story-variable-text"); text.append(element("span", "story-variable-name", item.technicalName), element("small", "", variableTypeName(item)));
      option.append(variableBadge(item), text); list.append(option);
    }
    if (!variables.length) list.append(element("p", "story-dropdown-empty", "No variables yet."));
    const create = options.create;
    if (create) {
      const option = button("+ New variable…", "story-dropdown-option story-dropdown-create", () => { menu.open = false; create(summary); });
      option.role = "option"; option.tabIndex = -1; option.setAttribute("aria-selected", "false"); list.append(option);
    }
  };
  dropdownKeys(menu, summary, list); select.addEventListener("change", draw); draw(); menu.append(summary, list);
  return { menu, summary, draw };
}

const types = [{ value: "bool", label: "Yes/no" }, { value: "int", label: "Whole number" }, { value: "decimal", label: "Decimal" }, { value: "string", label: "Text" }] as const;

/** Opens New variable. Resolves with the created variable, or undefined when cancelled. */
export function openNewVariable(options: NewVariableOptions): Promise<Variable | undefined> {
  const name = element("input"); name.type = "text"; name.setAttribute("aria-label", "Variable name"); name.placeholder = "e.g. found_letter"; technicalNameInput(name);
  const type = backingSelect("Variable type", types, "bool");
  const start = element("div", "story-variable-start");
  let startControl: HTMLInputElement | HTMLSelectElement;
  const drawStart = (): void => {
    if (type.value === "bool") { const select = element("select"); for (const value of ["false", "true"]) { const option = element("option", "", value); option.value = value; select.append(option); } startControl = select; }
    else { const input = element("input"); input.type = "text"; input.value = type.value === "string" ? "" : "0"; if (type.value !== "string") input.inputMode = "decimal"; startControl = input; }
    startControl.setAttribute("aria-label", "Starts as"); start.replaceChildren(startControl);
  };
  type.addEventListener("change", drawStart); drawStart();
  const parsed = (): NewVariableRequest => {
    let technical: string;
    try { technical = technicalName(name.value, "Variable name"); } catch (error) { throw new FieldError(error instanceof Error ? error.message : String(error), name); }
    const raw = startControl.value.trim(), variableType = type.value as Variable["variableType"];
    if (variableType === "bool") return { technicalName: technical, variableType, defaultValue: raw === "true" };
    if (variableType === "int") { if (!int64(raw)) throw new FieldError("Enter a whole number, such as 0 or 12.", startControl); return { technicalName: technical, variableType, defaultValue: raw }; }
    if (variableType === "decimal") { try { return { technicalName: technical, variableType, defaultValue: decimalValue(raw) }; } catch (error) { throw new FieldError(error instanceof Error ? error.message : String(error), startControl); } }
    return { technicalName: technical, variableType, defaultValue: startControl.value };
  };
  return openFormDialog({
    host: options.host, opener: options.opener, title: "New variable", className: "story-new-variable",
    fields: [field("Name", name), field("Type", segmented(type, types), type), field("Starts as", start)],
    note: "Written as a default statement in the project. Saves and loads with the game.", submitLabel: "Create variable", first: name,
    submit: async () => {
      const request = parsed();
      try { return await options.create(request); } catch (error) { throw new Error(`${error instanceof Error ? error.message : "The variable could not be created."} Input retained.`); }
    },
  });
}
