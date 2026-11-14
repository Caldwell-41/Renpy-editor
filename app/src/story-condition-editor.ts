// The condition rule builder (UI.md "Condition rule builder"), for condition branches and
// Choice "Only when". It reads and writes ADR 0014's typed condition and never writes raw
// Python. Each rule picks a project variable, a preset test and a value; one All/Any
// switch joins the rules. A condition it cannot show stays as written, with Edit in Source.
// Half-typed numbers stay in their field with a message and are never read.
import { decimalValue, int64 } from "./numeric-input.ts";
import { validateField } from "./authoring-input.ts";
import type { Condition, ConditionExpression } from "./scene-ui.ts";
import { backingSelect, button, element, field, iconButton, segmented, type ChoiceItem } from "./story-editor-controls.ts";
import { typeName, typePhrase, variableMenu, type Variable, type VariableDraft } from "./story-new-variable.ts";

type Variables = readonly Variable[];
type Operator = Extract<ConditionExpression, { type: "compare" }>["operator"];
/** Creates a variable from the variable list. Resolves with it, or undefined when cancelled. */
export type NewVariable = (opener: HTMLElement, initial?: VariableDraft) => Promise<Variable | undefined>;
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
/** Whether a test joins rules with both All (`and`) and Any (`or`). */
function mixesJoins(expression: ConditionExpression): boolean {
  const joins = new Set<string>();
  const visit = (node: ConditionExpression): void => {
    if (node.type === "and" || node.type === "or") { joins.add(node.type); visit(node.left); visit(node.right); }
    else if (node.type === "not") visit(node.operand);
    else if (node.type === "compare") { visit(node.left); visit(node.right); }
  };
  visit(expression); return joins.size === 2;
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

/**
 * Why core could not read a branch's test, and what the author can do (`story-release-fixes`
 * / `a-v2`). `test` is the line as the builder names it, "ticket_count = 2"; `short` names the
 * problem in the Branch path; `reason` and `next` are the builder's two sentences; `create`
 * is a missing variable the author can create, with the type its comparison suggests. The
 * names come from core's `detail`; the renderer never reads the test's Python.
 */
export interface ConditionProblem {
  readonly test: string;
  readonly short: string;
  readonly reason: string;
  readonly next: string;
  readonly create?: VariableDraft;
}
const symbolOf = (op: Operator): string => operators.find(item => item.op === op)!.symbol;
/** The line with = ≠ ≤ ≥ for its comparisons. Quoted text stays as written. */
const symbolLine = (source: string): string => source.trim().replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|==|!=|<=|>=/g, (match, quoted?: string) => quoted ?? operators.find(item => item.python === match)!.symbol);

/** A test core could not read, as its line reads with = ≠ ≤ ≥. */
export const unknownTest = (condition: Condition & { status: "unknown" }): string => symbolLine(condition.source);

/** The problem with a test core could not read, or undefined for a test it read. Custom
 *  Python the builder can't show is not a problem: the builder says so as a hint. */
export function conditionProblem(condition: Condition | undefined): ConditionProblem | undefined {
  if (condition?.status !== "unknown") return undefined;
  const test = unknownTest(condition), detail = condition.detail;
  const problem = (short: string, reason: string, next: string, create?: VariableDraft): ConditionProblem => ({ test, short, reason, next, ...create ? { create } : {} });
  switch (condition.diagnostic) {
    case "missingVariable":
      if (!detail) return problem("not a variable", "This line names a variable the project doesn't have.", "Change this line in Source.");
      return problem("not a variable", `${detail.variable} is not a project variable.`, "Create it, or change this line in Source.", { name: detail.variable, variableType: detail.otherType ?? "bool" });
    case "typeMismatch": {
      const type = detail?.variableType;
      if (!detail || !type) return problem("wrong type", "This line compares values of different types.", "Change this line in Source.");
      if (detail.operator && detail.other !== undefined && detail.otherType) return problem("wrong type", `${detail.variable} is ${typePhrase(type)}, and ${detail.other} is ${typePhrase(detail.otherType)}.`, `Compare it with ${typePhrase(type)} in Source.`);
      if (detail.operator) return problem("wrong type", `${detail.variable} is ${typePhrase(type)}, and ${symbolOf(detail.operator)} only compares numbers.`, "Use = or ≠ in Source.");
      return problem("wrong type", `${detail.variable} is ${typePhrase(type)}, not yes/no.`, "Compare it with a value in Source.");
    }
    case "invalidValue": return problem("invalid number", "A number in this line is out of range.", "Change this line in Source.");
    case "limitExceeded": return problem("too long", "This line is too long for the builder.", "Shorten it in Source.");
    case "unsupportedSyntax": return undefined;
  }
}
/** The builder's message for a problem: why, what to do, and what it can't do until then. */
export function problemText(problem: ConditionProblem, subject: "branch" | "option"): string {
  return `${problem.reason} ${problem.next} Until then, the builder can't edit this ${subject}.`;
}

export interface RuleBuilderOptions {
  /** The Ren'Py keyword its line starts with. */
  readonly keyword: "if" | "elif";
  /** Names the rules for screen readers: "Option 2", "If". `relabel` changes it. */
  readonly label: string;
  /** What the line says with no rules: "Always available", or the reason a test is needed. */
  readonly empty: string;
  /** A branch needs a test; Choice "Only when" may have none. */
  readonly required: boolean;
  /** Opens the condition in Source, for a condition the builder cannot show. */
  readonly source?: () => void;
  /** How a condition the builder cannot show reads. */
  readonly caption?: string;
  /** Offers "+ New variable…" at the end of each variable list, and Create for a test's missing variable. */
  readonly newVariable?: NewVariable;
  /** Story redraws once a missing variable is created, since core reads the test again. */
  readonly created?: () => void;
  /** What the builder edits, as its messages name it: a condition's branch or a Choice's option. */
  readonly subject?: "branch" | "option";
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
  /** Renames the rules for screen readers, as when an option moves. */
  readonly relabel: (label: string) => void;
  /** Story shows a kept draft again: the variable lists follow the project's variables now,
   *  so a variable an Undo removed leaves them and a rule on it says it is gone. */
  readonly refresh: (projectVariables: Variables) => void;
}

/** The rule builder for one condition. `initial` is the condition in source, if any. */
export function buildRuleBuilder(projectVariables: Variables, initial: Condition | undefined, options: RuleBuilderOptions): RuleBuilder {
  // The project's variables, and any the author creates from the list.
  let variables = projectVariables, label = options.label;
  const host = element("div", "story-rules");
  const parsed = initial?.status === "supported" ? rulesOf(initial.expression, variables) : initial ? undefined : { join: "and" as const, rules: [] };
  if (!parsed) {
    const problem = conditionProblem(initial), done = { host, read: () => initial, summary: () => options.caption ?? "", editable: false, capture: () => undefined, restore: () => undefined, relabel: () => undefined, refresh: () => undefined };
    if (problem && initial?.status === "unknown") {
      // A test core could not read: its line in an error box, why, and what to do (story-release-fixes / a-v2).
      const code = element("code", "story-rule-code story-rule-invalid", `${options.keyword} ${initial.source}:`), error = element("p", "story-rule-error", problemText(problem, options.subject ?? "branch"));
      error.id = `story-rule-error-${crypto.randomUUID()}`; code.setAttribute("aria-invalid", "true"); code.setAttribute("aria-describedby", error.id);
      const fixes = element("div", "row-actions story-rule-actions"), create = problem.create, newVariable = options.newVariable;
      if (create && newVariable) { const add: HTMLButtonElement = button(`Create ${create.name}…`, "button secondary", () => { void newVariable(add, create).then(created => { if (created) options.created?.(); }); }); fixes.append(add); }
      if (options.source) fixes.append(button("Edit in Source", "button secondary", options.source));
      host.append(code, error, ...fixes.children.length ? [fixes] : []);
      return done;
    }
    // Custom Python, mixed All and Any, or another test that is not variable-against-value,
    // such as trust > fare. Information, not an error: its line and a hint.
    const note = initial?.status === "supported" && mixesJoins(initial.expression) ? "This mixes All and Any. The builder can't edit it. Edit it in Source." : "The builder can't show this Python. Until then, edit it in Source.";
    host.append(element("code", "story-rule-code", initial?.status === "unknown" ? `${options.keyword} ${initial.source}:` : options.caption ?? ""), element("p", "story-field-hint", note));
    if (options.source) host.append(button("Edit in Source", "button secondary", options.source));
    return done;
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
  const variableItems = (): ChoiceItem[] => variables.map(variable => ({ value: variable.id, label: variable.technicalName, detail: typeName(variable.variableType) }));
  const draw = (): void => {
    const focused = document.activeElement instanceof HTMLElement && host.contains(document.activeElement) ? document.activeElement.closest<HTMLElement>("[data-rule-focus]")?.dataset.ruleFocus : undefined;
    checks = []; host.replaceChildren();
    if (state.rules.length > 1) {
      const match = backingSelect(`${label} match`, [{ value: "and", label: "All" }, { value: "or", label: "Any" }], state.join);
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
    const variable = variables.find(item => item.id === rule.variableId), title = `${label} rule ${index + 1}`;
    const update = (next: Partial<Rule>, redraw = false, notify = false): void => set({ rules: state.rules.map((item, at) => at === index ? { ...item, ...next, original: undefined } : item) }, redraw, notify);
    // The variable list: name and type, as in Story Combined v1, ending with "+ New variable…".
    const pick = backingSelect(`${title} variable`, variableItems(), rule.variableId);
    const newVariable = options.newVariable;
    const { menu, summary } = variableMenu(pick, { label: `${title} variable`, variables: () => variables, ...newVariable ? { create: (opener: HTMLElement) => {
      void newVariable(opener).then(created => {
        if (!created || !host.isConnected) return;
        variables = [...variables.filter(item => item.id !== created.id), created];
        update(defaultRule(created), true, true); refocus(`variable-${index}`);
      });
    } } : {} });
    summary.dataset.ruleFocus = `variable-${index}`;
    // A new variable starts a fresh rule of its type.
    pick.addEventListener("change", () => { const chosen = variables.find(item => item.id === pick.value); if (chosen) { update(defaultRule(chosen), true); refocus(`variable-${index}`); } });
    const remove = iconButton("close", `Remove rule ${index + 1}`, () => { set({ rules: state.rules.filter((_item, at) => at !== index) }, true, true); refocus(state.rules.length ? `variable-${Math.max(0, index - 1)}` : "add"); });
    const top = element("div", "story-rule-top"); top.append(menu, pick, remove);
    const how = element("div", "story-rule-how");
    if (variable?.variableType === "bool") {
      const truth = backingSelect(`${title} comparison`, [{ value: "true", label: "is true" }, { value: "false", label: "is false" }], rule.value === "false" ? "false" : "true");
      truth.addEventListener("change", () => update({ value: truth.value }));
      const control = segmented(truth, [{ value: "true", label: "is true" }, { value: "false", label: "is false" }]); control.dataset.ruleFocus = `test-${index}`;
      how.append(control, truth);
    } else if (variable) {
      const offered = numeric(variable) ? operators : operators.filter(item => item.op === "equal" || item.op === "notEqual");
      const op = backingSelect(`${title} comparison`, offered.map(item => ({ value: item.op, label: item.words })), rule.op);
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
    if (!state.rules.length) { if (options.required) throw Error("Add a rule to this branch."); return undefined; }
    const [first, ...rest] = state.rules.map(rule => expressionOf(rule, variables));
    const expression = rest.reduce<ConditionExpression>((left, right) => ({ type: state.join, left, right }), first!);
    return { status: "supported", expression };
  };
  return {
    host, read, editable: true,
    summary: () => state.rules.map(rule => ruleWords(rule, variables)).join(` ${state.join} `),
    capture: () => state,
    restore: saved => { if (saved) { state = saved as State; draw(); } },
    relabel: next => { if (next !== label) { label = next; draw(); } },
    refresh: next => {
      const shape = (list: Variables): string => JSON.stringify(list.map(item => [item.id, item.technicalName, item.variableType]));
      if (shape(next) !== shape(variables)) { variables = next; draw(); }
    },
  };
}
