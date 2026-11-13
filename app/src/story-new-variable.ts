// New variable (`story-revamp` / `combined`): the rule builder's variable list creates a
// project variable in place. Name, type and starting value, then Create variable. Core
// writes the `default` statement as one edit with Undo. Escape or Cancel keeps nothing.
import { technicalName, technicalNameInput } from "./authoring-input.ts";
import { decimalValue, int64, type DecimalValue } from "./numeric-input.ts";
import type { SceneWorkspace } from "./scene-ui.ts";
import { backingSelect, element, field, FieldError, openFormDialog, segmented } from "./story-editor-controls.ts";

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
    host: options.host, opener: options.opener, title: "New variable", className: "story-new-variable", closeLabel: "Close without creating",
    fields: [field("Name", name), field("Type", segmented(type, types), type), field("Starts as", start)],
    note: "Written as a default statement in the project. Saves and loads with the game.", submitLabel: "Create variable", first: name,
    submit: async () => {
      const request = parsed();
      try { return await options.create(request); } catch (error) { throw new Error(`${error instanceof Error ? error.message : "The variable could not be created."} Input retained.`); }
    },
  });
}
