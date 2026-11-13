// The condition rule builder (UI.md "Condition rule builder"), for condition branches and
// Choice "Only when". It reads and writes ADR 0014's typed condition and never writes raw
// Python. Each rule picks a project variable, a preset test and a value; one All/Any
// switch joins the rules. A condition it cannot show stays as written, with Edit in Source.
// Half-typed numbers stay in their field with a message and are never read.
import { decimalValue, int64 } from "./numeric-input.ts";
import { validateField } from "./authoring-input.ts";
import type { Condition, ConditionExpression } from "./scene-ui.ts";
import { backingSelect, button, choose, dropdownKeys, element, field, iconButton, segmented, type ChoiceItem } from "./story-editor-controls.ts";
import type { Variable } from "./story-new-variable.ts";

type Variables = readonly Variable[];
type Operator = Extract<ConditionExpression, { type: "compare" }>["operator"];
/** Creates a variable from the variable list. Resolves with it, or undefined when cancelled. */
export type NewVariable = (opener: HTMLElement) => Promise<Variable | undefined>;
/**
 * One rule as the author left it. `value` is the raw text, which may be half typed.
 * `original` is the rule as source wrote it, kept until the author changes the rule.
 */
interface Rule { readonly variableId: string; readonly op: Operator; readonly value: string; readonly original?: ConditionExpression }
interface State { readonly join: "and" | "or"; readonly rules: readonly Rule[]; readonly touched: boolean }

const operators: readonly { readonly op: Operator; readonly symbol: string; readonly words: string; readonly python: string }[] = [
  { op: "equal", symbol: "=", words: "is", python: "==" }, { op: "notEqual", symbol: "≠", words: "is not", python: "!=" },
  { op: "less", symbol: "<", words: "is less than", python: "<" }, { op: "lessEqual", symbol: "≤", words: "is at most", python: "<=" },
  { op: "greater", symbol: ">", words: "is greater than", python: ">" }, { op: "greaterEqual", symbol: "≥", words: "is at least", python: ">=" },
];
const numeric = (variable?: Variable): boolean => variable?.variableType === "int" || variable?.variableType === "decimal";
const typeName = (variable: Variable): string => ({ bool: "yes/no", int: "whole number", decimal: "decimal", string: "text" })[variable.variableType];
const badge = (variable?: Variable): HTMLElement => {
  const node = element("span", "story-type", variable ? ({ bool: "Y/N", int: "#", decimal: "#.#", string: "Aa" })[variable.variableType] : ""); node.setAttribute("aria-hidden", "true"); return node;
};

/** A number as ADR 0014 carries it: an exact whole number, else a decimal. */
function numberLiteral(raw: string): { readonly type: "int" | "decimal"; readonly value: string } {
  if (/^[+-]?\d+$/.test(raw)) { if (!int64(raw)) throw Error("Enter an exact signed 64-bit whole number, or use decimal notation."); return { type: "int", value: raw }; }
  decimalValue(raw); return { type: "decimal", value: raw };
}

/** The rules a typed condition holds, or undefined when the builder cannot show it. */
function rulesOf(expression: ConditionExpression, variables: Variables): Omit<State, "touched"> | undefined {
  const join = expression.type === "and" || expression.type === "or" ? expression.type : "and";
  const leaves: ConditionExpression[] = [];
  const collect = (node: ConditionExpression, depth: number): boolean => {
    if (depth > 16) return false;
    if (node.type === join && (node.type === "and" || node.type === "or")) return collect(node.left, depth + 1) && collect(node.right, depth + 1);
    leaves.push(node); return true;
  };
  if (!collect(expression, 0)) return undefined;
  const rules: Rule[] = [];
  for (const leaf of leaves) {
    const rule = ruleOf(leaf, variables); if (!rule) return undefined; rules.push({ ...rule, original: leaf });
  }
  return { join, rules };
}
function ruleOf(node: ConditionExpression, variables: Variables): Rule | undefined {
  const known = (id: string, type: Variable["variableType"]): boolean => variables.some(variable => variable.id === id && variable.variableType === type);
  if (node.type === "variable" && node.variableType === "bool" && known(node.variableId, "bool")) return { variableId: node.variableId, op: "equal", value: "true" };
  if (node.type === "not" && node.operand.type === "variable" && node.operand.variableType === "bool" && known(node.operand.variableId, "bool")) return { variableId: node.operand.variableId, op: "equal", value: "false" };
  if (node.type !== "compare" || node.left.type !== "variable" || !known(node.left.variableId, node.left.variableType)) return undefined;
  const { left, right } = node;
  if (left.variableType === "bool" && right.type === "bool" && ["equal", "notEqual"].includes(node.operator)) return { variableId: left.variableId, op: "equal", value: String(right.value === (node.operator === "equal")) };
  if ((left.variableType === "int" || left.variableType === "decimal") && (right.type === "int" || right.type === "decimal")) return { variableId: left.variableId, op: node.operator, value: right.value };
  if (left.variableType === "string" && right.type === "string" && ["equal", "notEqual"].includes(node.operator)) return { variableId: left.variableId, op: node.operator, value: right.value };
  return undefined;
}
function defaultRule(variable: Variable): Rule {
  return variable.variableType === "bool" ? { variableId: variable.id, op: "equal", value: "true" } : numeric(variable) ? { variableId: variable.id, op: "greaterEqual", value: "1" } : { variableId: variable.id, op: "equal", value: "" };
}
/** A rule as the editor writes it: as source wrote it until changed. Throws when its value is incomplete. */
function expressionOf(rule: Rule, variables: Variables): ConditionExpression {
  if (rule.original) return rule.original;
  const variable = variables.find(item => item.id === rule.variableId);
  if (!variable) throw Error("Select an available variable.");
  const ref = { type: "variable" as const, variableId: variable.id, variableType: variable.variableType };
  // A new or changed yes/no rule is a comparison, `flag == True`, as the earlier editor wrote it.
  if (variable.variableType === "bool") return { type: "compare", operator: "equal", left: ref, right: { type: "bool", value: rule.value !== "false" } };
  if (numeric(variable)) return { type: "compare", operator: rule.op, left: ref, right: numberLiteral(rule.value.trim()) };
  if (new TextEncoder().encode(rule.value).length > 4096) throw Error("Use at most 4096 bytes of text in a condition.");
  return { type: "compare", operator: rule.op === "notEqual" ? "notEqual" : "equal", left: ref, right: { type: "string", value: rule.value } };
}
/** How a rule reads in Ren'Py, for the line under the rules. Display only; core writes source. */
function rulePython(rule: Rule, variables: Variables): string {
  const nameOf = (id: string): string => variables.find(item => item.id === id)?.technicalName ?? "missing_variable";
  const original = rule.original;
  if (original?.type === "variable") return nameOf(original.variableId);
  if (original?.type === "not" && original.operand.type === "variable") return `not ${nameOf(original.operand.variableId)}`;
  if (original?.type === "compare" && original.left.type === "variable") {
    const right = original.right, literal = right.type === "bool" ? (right.value ? "True" : "False") : right.type === "string" ? JSON.stringify(right.value) : "value" in right ? String(right.value) : "?";
    return `${nameOf(original.left.variableId)} ${operators.find(item => item.op === original.operator)?.python ?? "=="} ${literal}`;
  }
  const variable = variables.find(item => item.id === rule.variableId), name = nameOf(rule.variableId);
  if (variable?.variableType === "bool") return `${name} == ${rule.value === "false" ? "False" : "True"}`;
  const python = operators.find(item => item.op === rule.op)?.python ?? "==";
  return variable?.variableType === "string" ? `${name} ${python} ${JSON.stringify(rule.value)}` : `${name} ${python} ${rule.value.trim() || "?"}`;
}
/** How a rule reads in a summary: "trust is at least 3". */
function ruleWords(rule: Rule, variables: Variables): string {
  const variable = variables.find(item => item.id === rule.variableId), name = variable?.technicalName ?? "Missing variable";
  if (variable?.variableType === "bool") return `${name} is ${rule.value === "false" ? "false" : "true"}`;
  const words = operators.find(item => item.op === rule.op)?.words ?? "is";
  return variable?.variableType === "string" ? `${name} ${words} "${rule.value}"` : `${name} ${words} ${rule.value.trim()}`;
}

export interface RuleBuilderOptions {
  /** The Ren'Py keyword its line starts with. */
  readonly keyword: "if" | "elif";
  /** Names the rules for screen readers: "Option 2", "If". */
  readonly label: string;
  /** What the line says with no rules: "Always available", or the reason a test is needed. */
  readonly empty: string;
  /** A branch needs a test; Choice "Only when" may have none. */
  readonly required: boolean;
  /** Opens the condition in Source, for a condition the builder cannot show. */
  readonly source?: () => void;
  /** How a condition the builder cannot show reads. */
  readonly caption?: string;
  /** Offers "+ New variable…" at the end of each variable list. */
  readonly newVariable?: NewVariable;
}
export interface RuleBuilder {
  readonly host: HTMLElement;
  /** The typed condition, or undefined for no rules. The original condition when untouched. Throws on incomplete input. */
  readonly read: () => Condition | undefined;
  /** "trust is at least 3 and has_ticket is true", for the Only when line. */
  readonly summary: () => string;
  /** Whether the builder can edit this condition. */
  readonly editable: boolean;
  /** Builder state for draft-step Undo. */
  readonly capture: () => unknown;
  readonly restore: (saved: unknown) => void;
}

/** The rule builder for one condition. `initial` is the condition in source, if any. */
export function buildRuleBuilder(projectVariables: Variables, initial: Condition | undefined, options: RuleBuilderOptions): RuleBuilder {
  // The project's variables, and any the author creates from the list.
  let variables = projectVariables;
  const host = element("div", "story-rules");
  const parsed = initial?.status === "supported" ? rulesOf(initial.expression, variables) : initial ? undefined : { join: "and" as const, rules: [] };
  if (!parsed) {
    // An unknown condition, mixed All and Any, or a test that is not variable-against-value.
    const unknown = initial?.status === "unknown";
    const code = element("code", "story-rule-code", unknown ? `${options.keyword} ${initial.source}:` : options.caption ?? "");
    const note = element("p", "story-field-hint", unknown
      ? "This test uses Python the builder cannot show. It stays as written."
      : "This test mixes All and Any, or compares values the builder cannot show. It stays as written.");
    host.append(code, note);
    if (options.source) host.append(button("Edit in Source", "button secondary", options.source));
    return { host, read: () => initial, summary: () => options.caption ?? "", editable: false, capture: () => undefined, restore: () => undefined };
  }
  let state: State = { ...parsed, touched: false };
  // Reads run every rule's check, so each shows its message beside its field.
  let checks: (() => void)[] = [];
  const code = element("code", "story-rule-code");
  // Controls report their own input and change events to the draft. Adding or removing a
  // rule changes no field, so it reports one change for the draft step.
  const set = (next: Partial<State>, redraw = false, notify = false): void => {
    state = { ...state, ...next, touched: true };
    if (redraw) draw(); else drawCode();
    if (notify) host.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const drawCode = (): void => {
    code.textContent = state.rules.length ? `${options.keyword} ${state.rules.map(rule => rulePython(rule, variables)).join(` ${state.join} `)}:` : options.empty;
    code.classList.toggle("story-rule-empty", !state.rules.length);
  };
  const variableItems = (): ChoiceItem[] => variables.map(variable => ({ value: variable.id, label: variable.technicalName, detail: typeName(variable) }));
  const draw = (): void => {
    const focused = document.activeElement instanceof HTMLElement && host.contains(document.activeElement) ? document.activeElement.closest<HTMLElement>("[data-rule-focus]")?.dataset.ruleFocus : undefined;
    checks = []; host.replaceChildren();
    if (state.rules.length > 1) {
      const match = backingSelect(`${options.label} match`, [{ value: "and", label: "All" }, { value: "or", label: "Any" }], state.join);
      match.addEventListener("change", () => set({ join: match.value as "and" | "or" }));
      const join = segmented(match, [{ value: "and", label: "All" }, { value: "or", label: "Any" }]); join.dataset.ruleFocus = "join";
      host.append(field("Match", join, match));
    }
    state.rules.forEach((rule, index) => host.append(ruleRow(rule, index)));
    const add = button(state.rules.length ? "+ Add rule" : "+ Add a rule", "button secondary story-add-rule", () => {
      const first = variables[0];
      if (first) { set({ rules: [...state.rules, defaultRule(first)] }, true, true); host.querySelectorAll<HTMLElement>("[data-rule-focus^=variable]")[state.rules.length - 1]?.focus(); return; }
      // With no variables yet, the first rule starts by creating one.
      void options.newVariable?.(add).then(created => { if (!created || !host.isConnected) return; variables = [created]; set({ rules: [defaultRule(created)] }, true, true); refocus("variable-0"); });
    });
    add.disabled = !variables.length && !options.newVariable; if (add.disabled) add.title = "Create a variable in Variables first.";
    add.dataset.ruleFocus = "add";
    drawCode(); host.append(add, code);
    if (focused) refocus(focused);
  };
  const refocus = (key: string): void => {
    const target = host.querySelector<HTMLElement>(`[data-rule-focus="${key}"]`);
    (target?.matches("input, summary, button") ? target : target?.querySelector<HTMLElement>('[tabindex="0"]'))?.focus();
  };
  const ruleRow = (rule: Rule, index: number): HTMLElement => {
    const row = element("div", "story-rule"); row.dataset.rule = String(index);
    const variable = variables.find(item => item.id === rule.variableId), title = `${options.label} rule ${index + 1}`;
    const update = (next: Partial<Rule>, redraw = false, notify = false): void => set({ rules: state.rules.map((item, at) => at === index ? { ...item, ...next, original: undefined } : item) }, redraw, notify);
    // The variable list: name and type, as in Story Combined v1.
    const pick = backingSelect(`${title} variable`, variableItems(), rule.variableId);
    const menu = element("details", "story-dropdown story-variable-picker"), summary = element("summary", "story-person"); summary.dataset.control = ""; summary.dataset.ruleFocus = `variable-${index}`;
    summary.append(badge(variable), element("span", "story-variable-name", variable?.technicalName ?? "Choose a variable"), element("span", "story-caret", "▾"));
    summary.setAttribute("aria-label", `${title} variable: ${variable?.technicalName ?? "none chosen"}`);
    const list = element("div", "story-dropdown-list"); list.role = "listbox"; list.setAttribute("aria-label", `${title} variable`);
    for (const item of variables) {
      const option = button("", "story-dropdown-option", () => { menu.open = false; choose(pick, item.id); summary.focus(); });
      option.role = "option"; option.tabIndex = -1; option.dataset.value = item.id; option.setAttribute("aria-selected", String(item.id === rule.variableId)); option.setAttribute("aria-label", `${item.technicalName}, ${typeName(item)}`);
      const text = element("span", "story-variable-text"); text.append(element("span", "story-variable-name", item.technicalName), element("small", "", typeName(item)));
      option.append(badge(item), text); list.append(option);
    }
    const newVariable = options.newVariable;
    if (newVariable) {
      const create = button("+ New variable…", "story-dropdown-option story-dropdown-create", () => {
        menu.open = false;
        void newVariable(summary).then(created => {
          if (!created || !host.isConnected) return;
          variables = [...variables.filter(item => item.id !== created.id), created];
          update(defaultRule(created), true, true); refocus(`variable-${index}`);
        });
      });
      create.role = "option"; create.tabIndex = -1; create.setAttribute("aria-selected", "false"); list.append(create);
    }
    dropdownKeys(menu, summary, list); menu.append(summary, list);
    // A new variable starts a fresh rule of its type.
    pick.addEventListener("change", () => { const chosen = variables.find(item => item.id === pick.value); if (chosen) { update(defaultRule(chosen), true); refocus(`variable-${index}`); } });
    const remove = iconButton("close", `Remove rule ${index + 1}`, () => { set({ rules: state.rules.filter((_item, at) => at !== index) }, true, true); refocus(state.rules.length ? `variable-${Math.max(0, index - 1)}` : "add"); });
    const top = element("div", "story-rule-top"); top.append(menu, pick, remove);
    const how = element("div", "story-rule-how");
    if (variable?.variableType === "bool") {
      const truth = backingSelect(`${title} test`, [{ value: "true", label: "is true" }, { value: "false", label: "is false" }], rule.value === "false" ? "false" : "true");
      truth.addEventListener("change", () => update({ value: truth.value }));
      const control = segmented(truth, [{ value: "true", label: "is true" }, { value: "false", label: "is false" }]); control.dataset.ruleFocus = `test-${index}`;
      how.append(control, truth);
    } else if (variable) {
      const offered = numeric(variable) ? operators : operators.filter(item => item.op === "equal" || item.op === "notEqual");
      const op = backingSelect(`${title} test`, offered.map(item => ({ value: item.op, label: item.words })), rule.op);
      op.addEventListener("change", () => update({ op: op.value as Operator }));
      const control = segmented(op, offered.map(item => ({ value: item.op, label: item.symbol, detail: item.words })), "story-operators"); control.dataset.ruleFocus = `test-${index}`;
      const value = element("input"); value.type = "text"; value.value = rule.value; value.setAttribute("aria-label", `${title} value`); value.dataset.ruleFocus = `value-${index}`;
      value.placeholder = numeric(variable) ? "Number" : "Text"; if (numeric(variable)) value.inputMode = "decimal";
      // The raw text stays as typed. The check runs when the field is finished and on read.
      value.addEventListener("input", () => update({ value: value.value }));
      const check = validateField(value, () => { if (numeric(variable)) { if (!value.value.trim()) throw Error("Enter a number, such as 5 or 2.5."); numberLiteral(value.value.trim()); } });
      checks.push(check);
      how.append(control, op, value);
    } else how.append(element("p", "field-error", "This variable is no longer in the project. Choose another."));
    row.append(top, how); return row;
  };
  draw();
  const read = (): Condition | undefined => {
    if (!state.touched && initial) return initial;
    let failure: unknown;
    for (const check of checks) { try { check(); } catch (error) { failure ??= error; } }
    if (failure) throw failure;
    if (!state.rules.length) { if (options.required) throw Error("Add a rule to give this branch a test."); return undefined; }
    const [first, ...rest] = state.rules.map(rule => expressionOf(rule, variables));
    const expression = rest.reduce<ConditionExpression>((left, right) => ({ type: state.join, left, right }), first!);
    return { status: "supported", expression };
  };
  return {
    host, read, editable: true,
    summary: () => state.rules.map(rule => ruleWords(rule, variables)).join(` ${state.join} `),
    capture: () => state,
    restore: saved => { if (saved) { state = saved as State; draw(); } },
  };
}
