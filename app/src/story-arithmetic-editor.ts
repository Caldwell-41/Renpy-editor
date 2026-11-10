import { formulaCompletionRange } from "./formula-editing.ts";
import type { AssignmentDraftValidation, ArithmeticUnknown, BeatPayload, IntegerAdjustment, SceneWorkspace } from "./scene-ui.ts";

type SetVariable = Extract<BeatPayload, { type: "setVariable" }>;
export type ValidateAssignment = (beat: SetVariable) => Promise<AssignmentDraftValidation>;
export const assignmentOperations: readonly { key: IntegerAdjustment["operation"]; label: string; symbol: string; example: string }[] = [
  { key: "assign", label: "Set to", symbol: "=", example: "trust = 5" },
  { key: "add", label: "Add", symbol: "+=", example: "trust + 1" },
  { key: "subtract", label: "Subtract", symbol: "-=", example: "coins − price" },
  { key: "multiply", label: "Multiply by", symbol: "*=", example: "coins × 2" },
  { key: "divide", label: "Divide by", symbol: "/=", example: "fare ÷ 2 → decimal" },
  { key: "floorDivide", label: "Floor divide by", symbol: "//=", example: "7 // 2 → 3" },
  { key: "remainder", label: "Remainder after dividing by", symbol: "%=", example: "7 % 3 → 1" },
];
const reasons: Record<ArithmeticUnknown, string> = {
  invalidOperand: "Enter a number or formula.", invalidSyntax: "Check the formula. Use numbers, variables, signs and parentheses.",
  missingVariable: "Unknown variable. Use a declared numeric variable.", incompatibleOperand: "This variable is not a number.",
  incompatibleTarget: "This gives a decimal. Choose a decimal variable or a whole-number formula. Ordinary division always gives a decimal.",
  zeroDivisor: "This divides by zero.", integerOverflow: "This result exceeds the signed 64-bit integer range.",
  nonFiniteResult: "This calculation cannot produce a finite decimal.", limitExceeded: "This formula exceeds the supported calculation limits.",
  unobservedCurrentValue: "Current value unknown. Declaration defaults are not current Story values.",
  unsupportedControlFlow: "Current value unknown after code or unevaluated flow.",
};
const typeName = (type: string): string => type === "int" ? "whole number" : type;
function node<K extends keyof HTMLElementTagNameMap>(tag: K, className = "", text = ""): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.className = className; element.textContent = text; return element;
}
function field(text: string, control: HTMLElement): HTMLLabelElement {
  const label = node("label", "field compact-field"); label.append(node("span", "", text), control); return label;
}
export function assignmentCaption(payload: SetVariable, variables: SceneWorkspace["authoring"]["variables"]): string {
  const name = variables.find(v => v.id === payload.variableId)?.technicalName ?? "Missing Variable";
  const value = payload.value;
  return typeof value === "object" ? `${name} ${assignmentOperations.find(op => op.key === value.operation)?.symbol ?? "?"} ${value.operand}`
    : `${name} = ${typeof payload.value === "boolean" ? payload.value ? "True" : "False" : String(payload.value)}`;
}

/** Only presents core inspection. Formula text never runs or evaluates in the renderer. */
export function buildAssignmentEditor(model: SceneWorkspace, payload: SetVariable, validate?: ValidateAssignment) {
  const host = node("div", "beat-fields story-arithmetic-editor"), variable = node("select"); variable.setAttribute("aria-label", "Variable");
  let variables = model.authoring.variables;
  for (const v of variables) { const option = node("option", "", `${v.technicalName} · ${typeName(v.variableType)}`); option.value = v.id; variable.append(option); }
  if (!variables.some(v => v.id === payload.variableId)) { const missing = node("option", "", "Missing Variable"); missing.value = payload.variableId; variable.prepend(missing); }
  variable.value = payload.variableId;
  const editor = node("div"); host.append(field("Variable", variable), editor);
  const drafts = new Map<string, { operation: IntegerAdjustment["operation"]; text: string }>();
  let operation: IntegerAdjustment["operation"] = typeof payload.value === "object" ? payload.value.operation : "assign";
  let text = typeof payload.value === "object" ? payload.value.operand : String(payload.value);
  let primary: HTMLInputElement | HTMLSelectElement, generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finishField = () => {};
  let capabilities: AssignmentDraftValidation["capabilities"] | undefined;
  const controls: HTMLElement[] = [variable];
  const read = (): SetVariable => {
    const target = variables.find(v => v.id === variable.value);
    if (!target) throw Error("Select a declared Variable. Input retained.");
    return { type: "setVariable", variableId: target.id, value: target.variableType === "bool" ? primary.value === "true" : target.variableType === "string" ? primary.value : { operation, operand: primary.value } };
  };
  function rebuild() {
    generation++; clearTimeout(timer); finishField = () => {}; variable.removeAttribute("aria-describedby"); variable.removeAttribute("aria-invalid"); editor.replaceChildren(); controls.splice(1);
    const target = variables.find(v => v.id === variable.value);
    if (!target || target.variableType === "bool" || target.variableType === "string") {
      if (target?.variableType === "bool") { const choice = node("select"); for (const value of ["false", "true"]) { const option = node("option", "", value === "true" ? "True" : "False"); option.value = value; choice.append(option); } choice.value = text === "true" ? "true" : "false"; primary = choice; }
      else { primary = node("input"); primary.value = text; }
      primary.setAttribute("aria-label", "Value"); primary.addEventListener("input", () => text = primary.value); primary.addEventListener("change", () => text = primary.value);
      controls.push(primary); editor.append(field("Value", primary)); return;
    }
    const equation = node("div", "story-equation"); equation.role = "group"; equation.setAttribute("aria-label", "Calculation");
    const menu = node("details", "story-operation-menu"), summary = node("summary"), list = node("div", "story-operation-list"); list.role = "listbox"; list.setAttribute("aria-label", "Change");
    const formula = node("input", "story-formula"); primary = formula; formula.value = text; formula.setAttribute("aria-label", "Formula");
    formula.autocomplete = "off"; formula.spellcheck = false; formula.placeholder = "Number or formula, e.g. (bonus + 2) * 3";
    formula.role = "combobox"; formula.setAttribute("aria-autocomplete", "list"); formula.setAttribute("aria-expanded", "false");
    const feedback = node("div", "story-formula-feedback"); feedback.id = `story-feedback-${crypto.randomUUID()}`; feedback.ariaLive = "off"; formula.setAttribute("aria-describedby", feedback.id); variable.setAttribute("aria-describedby", feedback.id);
    const code = node("code", "story-assignment-source");
    const suggestions = node("div", "story-formula-suggestions"); suggestions.role = "listbox"; suggestions.setAttribute("aria-label", "Variables"); suggestions.hidden = true;
    let active = 0, composing = false, showErrors = false;
    function closeSuggestions() { suggestions.hidden = true; formula.setAttribute("aria-expanded", "false"); formula.removeAttribute("aria-activedescendant"); }

    function suggest() {
      const range = formulaCompletionRange(formula), part = range.prefix, matches = part || range.selected ? variables.filter(v => ["int", "decimal"].includes(v.variableType) && v.technicalName.startsWith(part) && v.technicalName !== part) : [];
      suggestions.replaceChildren(); active = Math.min(active, Math.max(0, matches.length - 1));
      closeSuggestions(); suggestions.hidden = !matches.length; formula.setAttribute("aria-expanded", String(!!matches.length));
      matches.forEach((v, index) => {
        const item = node("button", "", `${v.technicalName} · ${typeName(v.variableType)}`); item.type = "button"; item.role = "option"; item.tabIndex = -1;
        item.id = `${suggestions.id}-${index}`; item.setAttribute("aria-selected", String(index === active));
        item.addEventListener("mousedown", event => event.preventDefault());
        item.addEventListener("click", () => { formula.focus(); formula.setRangeText(v.technicalName, range.start, range.end, "end"); formula.setSelectionRange(range.start + v.technicalName.length, range.start + v.technicalName.length); formula.dispatchEvent(new Event("input", { bubbles: true })); closeSuggestions(); }); suggestions.append(item);
      });
      if (matches.length) formula.setAttribute("aria-activedescendant", suggestions.children[active]!.id);
    }
    // Each editor needs its own list identity, including multiple retained insertion forms.
    suggestions.id = `story-variables-${crypto.randomUUID()}`; formula.setAttribute("aria-controls", suggestions.id);
    let menuIdentity = "";
    function operationMenu() {
      const available = assignmentOperations.filter(op => !capabilities || capabilities.operations.includes(op.key));
      const identity = `${operation}:${available.map(op => op.key).join(",")}`;
      if (identity === menuIdentity) return;
      menuIdentity = identity;
      list.replaceChildren(); const selected = assignmentOperations.find(op => op.key === operation)!;
      summary.textContent = `${selected.symbol} ▾`; summary.setAttribute("aria-label", `Change: ${selected.label}`);
      for (const op of available) {
        const item = node("button"); item.type = "button"; item.role = "option"; item.setAttribute("aria-label", op.label); item.setAttribute("aria-selected", String(op.key === operation));
        const words = node("span"); words.append(node("strong", "", op.label), node("small", "", op.example)); item.append(node("span", "story-operation-symbol", op.symbol), words);
        item.addEventListener("click", () => { operation = op.key; menu.open = false; operationMenu(); summary.focus(); host.dispatchEvent(new Event("input", { bubbles: true })); schedule(); }); list.append(item);
      }
    }
    function sourceCaption() { code.textContent = `$ ${target!.technicalName} ${assignmentOperations.find(op => op.key === operation)!.symbol} ${formula.value || "?"}`; }
    async function inspect() {
      if (!host.isConnected || composing || (!formula.value && !showErrors)) return;
      const own = ++generation; sourceCaption(); formula.removeAttribute("aria-invalid"); variable.removeAttribute("aria-invalid"); feedback.textContent = "Checking formula…";
      if (!validate) { feedback.textContent = "Formula feedback unavailable. Commit validates through the Story backend."; return; }
      try {
        const result = await validate(read());
        if (own !== generation || !host.isConnected) return;
        variables = result.variables; capabilities = result.capabilities; operationMenu(); feedback.replaceChildren();
        const inferred = result.assignment.inferredResultType;
        if (inferred) feedback.append(node("p", "story-formula-type", `Gives a ${typeName(inferred)}${target!.variableType === "decimal" && inferred === "int" ? ", stored as a decimal" : ""}.`));
        for (const diagnostic of result.assignment.diagnostics) {
          if (result.support === "refused" && !showErrors) continue;
          feedback.append(node("p", result.support === "refused" ? "story-formula-problem" : "story-formula-unknown", reasons[diagnostic.reason]));
          if (result.support === "refused") (diagnostic.field === "variableId" ? variable : formula).setAttribute("aria-invalid", "true");
        }
        const state = result.assignment.state;
        if (result.support !== "refused" && (state.status === "known" || !result.assignment.diagnostics.some(d => d.reason === state.reason))) feedback.append(node("p", "story-formula-state", state.status === "known" ? `Draft result ${String(state.value)}` : reasons[state.reason]));
        feedback.title = `Core limits: ${capabilities.maxBytes} bytes, ${capabilities.maxNodes} nodes, depth ${capabilities.maxDepth}. Operators: ${capabilities.operators.join(" ")}.`;
      } catch (error) { if (own === generation && host.isConnected) feedback.textContent = `${error instanceof Error ? error.message : "Formula feedback unavailable."} Input retained.`; }
    }
    function schedule() { generation++; clearTimeout(timer); if (composing) return; sourceCaption(); if (!formula.value && !showErrors) { feedback.textContent = ""; return; } feedback.textContent = "Checking formula…"; timer = setTimeout(() => void inspect(), 120); }
    formula.addEventListener("compositionstart", () => { composing = true; generation++; clearTimeout(timer); closeSuggestions(); });
    formula.addEventListener("compositionend", () => { composing = false; text = formula.value; schedule(); });
    formula.addEventListener("input", () => { text = formula.value; showErrors = formula.getAttribute("aria-invalid") === "true" || variable.getAttribute("aria-invalid") === "true"; feedback.ariaLive = "off"; schedule(); if (!composing) suggest(); });
    formula.addEventListener("blur", () => { closeSuggestions(); if (!composing) { showErrors = true; feedback.ariaLive = "polite"; schedule(); } });
    finishField = () => { showErrors = true; feedback.ariaLive = "polite"; schedule(); };
    formula.addEventListener("keydown", event => {
      if (composing || event.isComposing || event.keyCode === 229) { event.stopPropagation(); return; }
      if (suggestions.hidden) return;
      const items = [...suggestions.children] as HTMLButtonElement[];
      if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); active = (active + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((item, index) => item.setAttribute("aria-selected", String(index === active))); formula.setAttribute("aria-activedescendant", items[active]!.id); }
      else if (["Enter", "Tab"].includes(event.key)) { event.preventDefault(); event.stopPropagation(); items[active]?.click(); }
      else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeSuggestions(); }
    });
    list.addEventListener("keydown", event => { const items = [...list.querySelectorAll("button")], at = items.indexOf(document.activeElement as HTMLButtonElement); if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); items[(at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus(); } else if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } });
    menu.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); menu.open = false; summary.focus(); } });
    menu.addEventListener("toggle", () => { if (menu.open && !list.contains(document.activeElement)) list.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus(); });
    operationMenu(); menu.append(summary, list); equation.append(node("span", "story-equation-target", target.technicalName), menu, formula, suggestions);
    controls.push(formula); const calculation = node("div", "field compact-field"); calculation.append(node("span", "", "Calculation"), equation); editor.append(calculation, feedback, code); sourceCaption(); schedule();
  }
  variable.addEventListener("change", () => { drafts.set(editor.dataset.variableId ?? payload.variableId, { operation, text }); const draft = drafts.get(variable.value); operation = draft?.operation ?? "assign"; text = draft?.text ?? ""; editor.dataset.variableId = variable.value; rebuild(); });
  rebuild();
  return { host, controls, get primary() { return primary; }, read: () => { finishField(); return read(); }, focus: () => primary.focus() };
}
