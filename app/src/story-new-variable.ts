// New variable (`story-revamp` / `combined`): the rule builder's variable list creates a
// project variable in place. Name, type and starting value, then Create variable. Core
// writes the `default` statement as one edit with Undo. Escape or Cancel keeps nothing.
import { technicalName, technicalNameInput } from "./authoring-input.ts";
import { decimalValue, int64, type DecimalValue } from "./numeric-input.ts";
import type { SceneWorkspace } from "./scene-ui.ts";
import { backingSelect, button, element, field, iconButton, segmented } from "./story-editor-controls.ts";

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
  return new Promise(resolve => {
    options.host.querySelector(":scope > .story-dialog-backdrop")?.remove();
    const backdrop = element("div", "story-dialog-backdrop");
    const dialog = element("div", "story-dialog story-new-variable"); dialog.role = "dialog"; dialog.setAttribute("aria-modal", "true"); dialog.setAttribute("aria-label", "New variable"); dialog.tabIndex = -1;
    let busy = false;
    const close = (created?: Variable): void => { if (!backdrop.isConnected) return; backdrop.remove(); options.opener.focus(); resolve(created); };
    const head = element("div", "story-dialog-head"); head.append(element("h2", "", "New variable"), iconButton("close", "Close without creating", () => close()));
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
    const problem = element("p", "field-error"); problem.role = "status";
    const cancel = button("Cancel", "button secondary", () => { if (!busy) close(); });
    const submit = button("Create variable", "button primary", () => void create());
    const actions = element("div", "story-dialog-actions"); actions.append(cancel, submit);
    dialog.append(head, field("Name", name), field("Type", segmented(type, types), type), field("Starts as", start), problem,
      element("p", "story-dialog-note", "Written as a default statement in the project. Saves and loads with the game."), actions);
    backdrop.append(dialog);
    const parsed = (): NewVariableRequest => {
      const technical = technicalName(name.value, "Variable name"), raw = startControl.value.trim(), variableType = type.value as Variable["variableType"];
      if (variableType === "bool") return { technicalName: technical, variableType, defaultValue: raw === "true" };
      if (variableType === "int") { if (!int64(raw)) throw Error("Enter a whole number, such as 0 or 12."); return { technicalName: technical, variableType, defaultValue: raw }; }
      if (variableType === "decimal") return { technicalName: technical, variableType, defaultValue: decimalValue(raw) };
      return { technicalName: technical, variableType, defaultValue: startControl.value };
    };
    const create = async (): Promise<void> => {
      if (busy) return;
      let request: NewVariableRequest;
      try { request = parsed(); } catch (error) { problem.textContent = error instanceof Error ? error.message : String(error); (problem.textContent.startsWith("Variable name") ? name : startControl).focus(); return; }
      busy = true; submit.disabled = cancel.disabled = true; problem.textContent = "";
      try { close(await options.create(request)); }
      catch (error) { problem.textContent = `${error instanceof Error ? error.message : "The variable could not be created."} Input retained.`; name.focus(); }
      finally { busy = false; if (backdrop.isConnected) submit.disabled = cancel.disabled = false; }
    };
    name.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); void create(); } });
    dialog.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); if (!busy) close(); } });
    options.host.append(backdrop); name.focus();
  });
}
