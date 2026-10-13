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
  control.addEventListener("change", () => { if (!composing) { try { validate(); } catch { /* Field completion displays the error. */ } } });
  return validate;
}
function select(values: readonly { value: string; label: string }[], selected: string): HTMLSelectElement {
  const node = document.createElement("select");
  const choices = values.some(value => value.value === selected) ? values : [{ value: selected, label: selected ? `Unavailable · ${selected}` : "Select a Variable" }, ...values];
  for (const choice of choices) { const option = document.createElement("option"); option.value = choice.value; option.textContent = choice.label; node.append(option); }
  node.value = selected;
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
type Variables = SceneWorkspace["authoring"]["variables"];
type ExpressionEditor = { host: HTMLElement; read: () => ConditionExpression };
function kind(expression: ConditionExpression): string { return expression.type === "compare" ? "compare" : expression.type; }
function defaultExpression(variables: Variables): ConditionExpression {
  const variable = variables[0];
  if (!variable) return { type: "bool", value: true };
  return { type: "compare", operator: "equal", left: { type: "variable", variableId: variable.id, variableType: variable.variableType }, right: variable.variableType === "bool" ? { type: "bool", value: true } : { type: variable.variableType, value: variable.variableType === "int" ? "0" : "" } };
}
function validateExpression(expression: ConditionExpression, variables: Variables): void {
  let count = 0;
  const visit = (node: ConditionExpression, depth: number): "bool" | "int" | "string" => {
    if (++count > 128 || depth > 16) throw Error("Use at most 128 condition terms and 16 levels of nesting.");
    switch (node.type) {
      case "bool": return "bool";
      case "int": if (!int64(node.value)) throw Error("Enter a whole number from -9223372036854775808 to 9223372036854775807, without leading zeros."); return "int";
      case "string": if (new TextEncoder().encode(node.value).length > 4096) throw Error("Use at most 4096 bytes of text in a condition."); return "string";
      case "variable": if (!variables.some(variable => variable.id === node.variableId && variable.variableType === node.variableType)) throw Error("Select an available Variable with the matching type."); return node.variableType;
      case "not": if (visit(node.operand, depth + 1) !== "bool") throw Error("Not needs a true/false condition."); return "bool";
      case "and": case "or": if (visit(node.left, depth + 1) !== "bool" || visit(node.right, depth + 1) !== "bool") throw Error("All of and Any of need true/false conditions."); return "bool";
      case "compare": {
        const left = visit(node.left, depth + 1), right = visit(node.right, depth + 1);
        if (left !== right || (!["equal", "notEqual"].includes(node.operator) && left !== "int")) throw Error("Compare matching types. Ordering is available for whole numbers.");
        return "bool";
      }
    }
  };
  if (visit(expression, 1) !== "bool") throw Error("A condition must be true or false. Add a comparison around text or a whole number.");
}
function simpleComparison(variables: Variables, initial: Extract<ConditionExpression, { type: "compare" }>): ExpressionEditor {
  const host = document.createElement("div"); host.className = "condition-fields";
  const left = initial.left as Extract<ConditionExpression, { type: "variable" }>;
  const variable = select(variables.map(item => ({ value: item.id, label: `${item.technicalName} · ${item.variableType}` })), left.variableId); variable.setAttribute("aria-label", "Condition Variable");
  const operator = select(operators, initial.operator); operator.setAttribute("aria-label", "Condition operator");
  host.append(label("Condition Variable", variable), label("Condition operator", operator));
  const valueHost = document.createElement("div"); host.append(valueHost);
  const stored = new Map<string, string>(); const literal = initial.right as Extract<ConditionExpression, { type: "bool" | "int" | "string" }>;
  stored.set(literal.type, String(literal.value));
  let value: Control; let validateValue: () => void;
  const validateVariable = validateField(variable, () => { if (!variables.some(item => item.id === variable.value)) throw Error("Select an available Variable."); });
  const rebuild = (): void => {
    const selected = variables.find(item => item.id === variable.value);
    const allowed = operators.filter(item => selected?.variableType === "int" || ["equal", "notEqual"].includes(item.value));
    const previous = operator.value;
    const choices = allowed.some(item => item.value === previous) ? allowed : [{ value: previous, label: "Choose a matching operator" }, ...allowed];
    operator.replaceChildren(...choices.map(item => { const option = document.createElement("option"); option.value = item.value; option.textContent = item.label; return option; })); operator.value = previous;
    if (selected?.variableType === "bool") value = select([{ value: "false", label: "False" }, { value: "true", label: "True" }], stored.get("bool") ?? "true");
    else { value = document.createElement("input"); value.type = "text"; value.value = stored.get(selected?.variableType ?? "string") ?? ""; if (selected?.variableType === "int") value.inputMode = "numeric"; }
    value.setAttribute("aria-label", "Condition value"); valueHost.replaceChildren(label("Condition value", value));
    validateValue = validateField(value, () => { if (selected?.variableType === "int" && !int64(value.value)) throw Error("Enter a whole number from -9223372036854775808 to 9223372036854775807, without leading zeros."); });
    for (const event of ["input", "change"]) value.addEventListener(event, () => { stored.set(selected?.variableType ?? "string", value.value); });
  };
  variable.addEventListener("change", rebuild); rebuild();
  const validateOperator = validateField(operator, () => { const selected = variables.find(item => item.id === variable.value); if (!operators.some(item => item.value === operator.value && (selected?.variableType === "int" || ["equal", "notEqual"].includes(item.value)))) throw Error("Choose an operator available for this Variable type."); });
  return { host, read: () => { validateVariable(); validateOperator(); validateValue(); const selected = variables.find(item => item.id === variable.value)!; return { type: "compare", operator: operator.value as Extract<ConditionExpression, { type: "compare" }>["operator"], left: { type: "variable", variableId: selected.id, variableType: selected.variableType }, right: selected.variableType === "bool" ? { type: "bool", value: value.value === "true" } : { type: selected.variableType, value: value.value } }; } };
}
function expressionEditor(variables: Variables, initial: ConditionExpression, depth = 1, operand = false): ExpressionEditor {
  const host = document.createElement("fieldset"); host.className = "condition-expression";
  if (depth > 16) { const message = document.createElement("p"); message.textContent = "Condition nesting exceeds the supported limit. Edit it in Source."; host.append(message); return { host, read: () => { throw Error(message.textContent!); } }; }
  const values = [{ value: "compare", label: "Comparison" }, { value: "and", label: "All of" }, { value: "or", label: "Any of" }, { value: "not", label: "Not" }, { value: "variable", label: operand ? "Variable" : "Boolean Variable" }, { value: "bool", label: "True / False" }, ...(operand ? [{ value: "int", label: "Whole number" }, { value: "string", label: "Text" }] : [])];
  const shape = select(values, kind(initial)); shape.setAttribute("aria-label", "Condition type");
  const body = document.createElement("div"); host.append(label("Condition type", shape), body);
  const drafts = new Map<string, ExpressionEditor>();
  const create = (selected: string, saved?: ConditionExpression): ExpressionEditor => {
    if (selected === "compare") {
      const comparison = saved?.type === "compare" ? saved : defaultExpression(variables);
      const cmp = comparison.type === "compare" ? comparison : { type: "compare" as const, operator: "equal" as const, left: comparison, right: { type: "bool" as const, value: true } };
      if (cmp.left.type === "variable" && ["bool", "int", "string"].includes(cmp.right.type)) return simpleComparison(variables, cmp);
      const panel = document.createElement("div"); panel.className = "condition-operands";
      const operator = select(operators, cmp.operator); operator.setAttribute("aria-label", "Condition operator");
      const left = expressionEditor(variables, cmp.left, depth + 1, true), right = expressionEditor(variables, cmp.right, depth + 1, true);
      panel.append(label("Comparison operator", operator), left.host, right.host);
      return { host: panel, read: () => ({ type: "compare", operator: operator.value as typeof cmp.operator, left: left.read(), right: right.read() }) };
    }
    if (selected === "and" || selected === "or" || selected === "not") {
      const panel = document.createElement("div"); panel.className = "condition-combination";
      const first = saved?.type === "not" ? saved.operand : saved?.type === "and" || saved?.type === "or" ? saved.left : defaultExpression(variables);
      const left = expressionEditor(variables, first, depth + 1); panel.append(left.host);
      if (selected === "not") return { host: panel, read: () => ({ type: "not", operand: left.read() }) };
      const right = expressionEditor(variables, saved?.type === "and" || saved?.type === "or" ? saved.right : { type: "bool", value: true }, depth + 1); panel.append(right.host);
      return { host: panel, read: () => ({ type: selected, left: left.read(), right: right.read() }) };
    }
    const panel = document.createElement("div");
    if (selected === "variable") {
      const allowed = operand ? variables : variables.filter(variable => variable.variableType === "bool");
      const variable = select(allowed.map(item => ({ value: item.id, label: `${item.technicalName} · ${item.variableType}` })), saved?.type === "variable" ? saved.variableId : allowed[0]?.id ?? ""); variable.setAttribute("aria-label", "Condition Variable"); panel.append(label("Condition Variable", variable));
      const validate = validateField(variable, () => { if (!allowed.some(item => item.id === variable.value)) throw Error("Select an available Variable of the matching type."); });
      return { host: panel, read: () => { validate(); const item = allowed.find(item => item.id === variable.value)!; return { type: "variable", variableId: item.id, variableType: item.variableType }; } };
    }
    let value: Control;
    if (selected === "bool") value = select([{ value: "false", label: "False" }, { value: "true", label: "True" }], saved?.type === "bool" ? String(saved.value) : "true");
    else { value = document.createElement("input"); value.type = "text"; value.value = saved?.type === selected && (saved.type === "int" || saved.type === "string") ? saved.value : selected === "int" ? "0" : ""; if (selected === "int") value.inputMode = "numeric"; }
    value.setAttribute("aria-label", "Condition value"); panel.append(label("Condition value", value));
    const validate = validateField(value, () => { if (selected === "int" && !int64(value.value)) throw Error("Enter a canonical whole number within the signed 64-bit range."); });
    return { host: panel, read: () => { validate(); return selected === "bool" ? { type: "bool", value: value.value === "true" } : { type: selected as "int" | "string", value: value.value }; } };
  };
  let editor: ExpressionEditor;
  const draw = (): void => { editor = drafts.get(shape.value) ?? create(shape.value, shape.value === kind(initial) ? initial : undefined); drafts.set(shape.value, editor); body.replaceChildren(editor.host); };
  shape.addEventListener("change", draw); draw();
  return { host, read: () => editor.read() };
}
export function buildConditionEditor(variables: Variables, initial?: Extract<Condition, { status: "supported" }>): { host: HTMLElement; read: () => Extract<Condition, { status: "supported" }> } {
  const editor = expressionEditor(variables, initial?.expression ?? defaultExpression(variables));
  const error = document.createElement("p"); error.className = "field-error"; error.setAttribute("role", "status"); editor.host.append(error);
  return { host: editor.host, read: () => { try { const expression = editor.read(); validateExpression(expression, variables); error.textContent = ""; return { status: "supported", expression }; } catch (failure) { error.textContent = failure instanceof Error ? failure.message : "Check this condition."; throw failure; } } };
}
export function buildAvailabilityEditor(variables: Variables, initial?: Condition): { host: HTMLElement; read: () => Condition | undefined } {
  const host = document.createElement("div"); host.className = "choice-availability";
  const enabled = document.createElement("input"); enabled.type = "checkbox"; enabled.checked = !!initial; enabled.setAttribute("aria-label", "Available when"); host.append(label("Available when…", enabled));
  const editor = buildConditionEditor(variables, initial?.status === "supported" ? initial : undefined); host.append(editor.host); editor.host.hidden = !enabled.checked;
  enabled.addEventListener("change", () => { editor.host.hidden = !enabled.checked; });
  return { host, read: () => { if (!enabled.checked) return undefined; if (initial?.status === "unknown") throw Error("Edit the unsupported condition in Source."); return editor.read(); } };
}
