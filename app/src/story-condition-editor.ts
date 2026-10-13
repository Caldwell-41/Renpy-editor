import type { Condition, ConditionExpression, SceneWorkspace } from "./scene-ui.ts";

type Control = HTMLInputElement | HTMLSelectElement;
let errorSequence = 0;
/** Completion/submission validation. Incomplete typing and IME remain untouched. */
export function validateField(control: Control, check: () => void): () => void {
  const error = document.createElement("span"); error.className = "field-error"; error.id = `story-field-error-${++errorSequence}`; error.hidden = true;
  control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
  let composing = false;
  const validate = (): void => {
    try { check(); control.removeAttribute("aria-invalid"); error.hidden = true; error.textContent = ""; }
    catch (failure) {
      error.textContent = failure instanceof Error ? failure.message : "Check this field."; error.hidden = false;
      if (!error.isConnected) control.insertAdjacentElement("afterend", error);
      control.setAttribute("aria-invalid", "true"); throw failure;
    }
  };
  control.addEventListener("compositionstart", () => { composing = true; });
  control.addEventListener("compositionend", () => { composing = false; });
  control.addEventListener("blur", () => { if (!composing) { try { validate(); } catch { /* Display beside the field. */ } } });
  control.addEventListener("input", () => { if (!composing && control.getAttribute("aria-invalid") === "true") { try { validate(); } catch { /* Keep current error. */ } } });
  return validate;
}
function select(values: readonly { value: string; label: string }[], selected: string): HTMLSelectElement {
  const node = document.createElement("select");
  const choices = values.some(value => value.value === selected) ? values : [{ value: selected, label: selected ? `Unavailable · ${selected}` : "Select a Variable" }, ...values];
  for (const choice of choices) { const option = document.createElement("option"); option.value = choice.value; option.textContent = choice.label; option.selected = choice.value === selected; node.append(option); }
  return node;
}
function label(text: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = document.createElement("label"); wrapper.className = "field compact-field";
  const caption = document.createElement("span"); caption.textContent = text; wrapper.append(caption, control); return wrapper;
}
function int64(value: string): boolean {
  if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false;
  try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; }
}
const operators = [
  { value: "equal", label: "is" }, { value: "notEqual", label: "is not" }, { value: "less", label: "is less than" },
  { value: "lessEqual", label: "is at most" }, { value: "greater", label: "is greater than" }, { value: "greaterEqual", label: "is at least" },
];
/** First typed guard slice. Complex supported trees remain intact until explicitly replaced. */
export function buildAvailabilityEditor(variables: SceneWorkspace["authoring"]["variables"], initial?: Condition): { host: HTMLElement; read: () => Condition | undefined } {
  const host = document.createElement("div"); host.className = "choice-availability";
  const enabled = document.createElement("input"); enabled.type = "checkbox"; enabled.checked = !!initial; enabled.setAttribute("aria-label", "Available when");
  host.append(label("Available when…", enabled));
  const body = document.createElement("div"); body.className = "condition-fields"; host.append(body); body.hidden = !enabled.checked;
  let changed = false;
  let reader: () => Condition;
  const build = (expression?: ConditionExpression): void => {
    body.replaceChildren();
    const comparison = expression?.type === "compare" && expression.left.type === "variable" && ["bool", "int", "string"].includes(expression.right.type) ? expression : undefined;
    const simple = !expression || !!comparison || (expression.type === "variable" && expression.variableType === "bool");
    if (!simple || initial?.status === "unknown") {
      const note = document.createElement("p"); note.textContent = "The existing expression is retained. Use Source to inspect its full structure.";
      const replace = document.createElement("button"); replace.type = "button"; replace.className = "button secondary"; replace.textContent = "Replace condition";
      replace.addEventListener("click", () => { changed = true; build(); host.dispatchEvent(new Event("input", { bubbles: true })); }); body.append(note, replace);
      reader = () => initial!; return;
    }
    const initialVariable = comparison?.left.type === "variable" ? comparison.left.variableId : expression?.type === "variable" ? expression.variableId : variables[0]?.id ?? "";
    const variable = select(variables.map(item => ({ value: item.id, label: `${item.technicalName} · ${item.variableType}` })), initialVariable); variable.setAttribute("aria-label", "Condition Variable");
    const operator = select(operators, comparison?.operator ?? "equal"); operator.setAttribute("aria-label", "Condition operator");
    body.append(label("Condition Variable", variable), label("Condition operator", operator));
    const valueHost = document.createElement("div"); body.append(valueHost);
    const stored = new Map<string, string>();
    const literal = comparison?.right;
    if (literal && (literal.type === "int" || literal.type === "string" || literal.type === "bool")) stored.set(literal.type, String(literal.value));
    if (expression?.type === "bool") stored.set("bool", String(expression.value));
    if (expression?.type === "variable") stored.set("bool", "true");
    let value: Control; let validateValue: () => void;
    const validateVariable = validateField(variable, () => { if (!variables.some(item => item.id === variable.value)) throw Error("Select an available Variable."); });
    const rebuild = (): void => {
      const selected = variables.find(item => item.id === variable.value);
      const allowed = operators.filter(item => selected?.variableType === "int" || ["equal", "notEqual"].includes(item.value));
      const previousOperator = operator.value;
      operator.replaceChildren(...allowed.map(item => { const option = document.createElement("option"); option.value = item.value; option.textContent = item.label; return option; }));
      operator.value = allowed.some(item => item.value === previousOperator) ? previousOperator : "equal";
      if (selected?.variableType === "bool") value = select([{ value: "false", label: "False" }, { value: "true", label: "True" }], stored.get("bool") ?? "true");
      else { value = document.createElement("input"); value.type = "text"; value.value = stored.get(selected?.variableType ?? "string") ?? ""; if (selected?.variableType === "int") value.inputMode = "numeric"; }
      value.setAttribute("aria-label", "Condition value"); valueHost.replaceChildren(label("Condition value", value));
      validateValue = validateField(value, () => { if (selected?.variableType === "int" && !int64(value.value)) throw Error("Enter a whole number from -9223372036854775808 to 9223372036854775807, without leading zeros."); });
      value.addEventListener("input", () => { stored.set(selected?.variableType ?? "string", value.value); });
      value.addEventListener("change", () => { stored.set(selected?.variableType ?? "string", value.value); });
    };
    variable.addEventListener("change", rebuild); rebuild();
    reader = () => {
      validateVariable(); validateValue();
      if (!changed && initial) return initial;
      const selected = variables.find(item => item.id === variable.value)!;
      const right: ConditionExpression = selected.variableType === "bool" ? { type: "bool", value: value.value === "true" } : { type: selected.variableType, value: value.value };
      return { status: "supported", expression: { type: "compare", operator: operator.value as "equal", left: { type: "variable", variableId: selected.id, variableType: selected.variableType }, right } };
    };
  };
  build(initial?.status === "supported" ? initial.expression : undefined);
  body.addEventListener("input", () => { changed = true; }); body.addEventListener("change", () => { changed = true; });
  enabled.addEventListener("change", () => { body.hidden = !enabled.checked; });
  return { host, read: () => enabled.checked ? reader() : undefined };
}
