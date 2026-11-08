// Arithmetic for the combined Story mock's Set variable beat (#87/#88).
// Numbers, declared numeric variables, signs, parentheses and + - * / // %. No functions or powers.
// Types follow Ren'Py's Python: / always gives a decimal; // and % of whole numbers stay whole.

export type NumberType = 'whole' | 'decimal';
export type Operation = 'set' | 'add' | 'subtract' | 'multiply' | 'divide' | 'floor' | 'remainder';
export const operations: { key: Operation; label: string; python: string; example: string }[] = [
  { key: 'set', label: 'Set to', python: '=', example: 'trust = 5' },
  { key: 'add', label: 'Add', python: '+=', example: 'trust + 1' },
  { key: 'subtract', label: 'Subtract', python: '-=', example: 'coins − price' },
  { key: 'multiply', label: 'Multiply by', python: '*=', example: 'coins × 2' },
  { key: 'divide', label: 'Divide by', python: '/=', example: 'fare ÷ 2 → decimal' },
  { key: 'floor', label: 'Floor divide by', python: '//=', example: '7 ⌊÷⌋ 2 → 3' },
  { key: 'remainder', label: 'Remainder after dividing by', python: '%=', example: '7 % 3 → 1' },
];

type Op = '+' | '-' | '*' | '/' | '//' | '%';
export type Formula = { k: 'num'; value: number; decimal: boolean } | { k: 'var'; name: string } | { k: 'neg'; a: Formula } | { k: 'bin'; op: Op; a: Formula; b: Formula } | { k: 'group'; a: Formula };
export type Problem = { kind: 'syntax' | 'unsupported' | 'missing' | 'type' | 'zero' | 'target'; message: string };

/** Display symbols are accepted so pasted text from the controls still parses. */
function tokens(text: string): string[] | Problem {
  const source = text.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'); const out: string[] = []; let i = 0;
  while (i < source.length) {
    const rest = source.slice(i), space = /^\s+/.exec(rest); if (space) { i += space[0].length; continue; }
    if (rest.startsWith('**')) return { kind: 'unsupported', message: 'Powers are not supported. Use × to multiply.' };
    const token = /^(\d+\.\d*|\.\d+|\d+|[A-Za-z_][A-Za-z0-9_]*|\/\/|[-+*/%()])/.exec(rest);
    if (!token) return { kind: 'syntax', message: `"${rest[0]}" cannot be used here. Use numbers, variables, + − × ÷ // % and brackets.` };
    out.push(token[0]); i += token[0].length;
  }
  return out;
}

export function parseFormula(text: string): Formula | Problem {
  const list = tokens(text); if (!Array.isArray(list)) return list; if (!list.length) return { kind: 'syntax', message: 'Enter a number or a formula.' };
  let at = 0; const peek = () => list[at], next = () => list[at++]!;
  const fail = (message: string): never => { throw { kind: 'syntax', message } as Problem; };
  function primary(): Formula {
    const t = peek(); if (t === undefined) return fail('The formula ends too early.');
    if (t === '(') { next(); const a = sum(); if (peek() !== ')') fail('A bracket is not closed.'); next(); return { k: 'group', a }; }
    if (/^[\d.]/.test(t)) { next(); return { k: 'num', value: Number(t), decimal: t.includes('.') }; }
    if (/^[A-Za-z_]/.test(t)) { next(); if (peek() === '(') throw { kind: 'unsupported', message: `Functions such as ${t}() are not supported.` } as Problem; return { k: 'var', name: t }; }
    return fail(t === ')' ? 'There is a closing bracket without an opening one.' : `"${t}" needs a number or variable before it.`);
  }
  function unary(): Formula { const t = peek(); if (t === '-' || t === '+') { next(); const a = unary(); return t === '-' ? { k: 'neg', a } : a; } return primary(); }
  function product(): Formula { let a = unary(); while (['*', '/', '//', '%'].includes(peek() ?? '')) { const op = next() as Op; a = { k: 'bin', op, a, b: unary() }; } return a; }
  function sum(): Formula { let a = product(); while (peek() === '+' || peek() === '-') { const op = next() as Op; a = { k: 'bin', op, a, b: product() }; } return a; }
  try { const result = sum(); if (at < list.length) fail(list[at] === ')' ? 'There is a closing bracket without an opening one.' : `Expected an operator before "${list[at]}".`); return result; }
  catch (problem) { return problem as Problem; }
}
export const isProblem = (value: unknown): value is Problem => typeof value === 'object' && value !== null && 'message' in value;

/** Python division semantics: floor division and remainder follow the divisor's sign. */
function apply(op: Op, a: number, b: number): number | undefined {
  if (op === '+') return a + b; if (op === '-') return a - b; if (op === '*') return a * b;
  if (b === 0) return undefined; if (op === '/') return a / b; if (op === '//') return Math.floor(a / b); return a - b * Math.floor(a / b);
}
export function evaluate(node: Formula, values: (name: string) => number | undefined): number | undefined {
  if (node.k === 'num') return node.value; if (node.k === 'var') return values(node.name); if (node.k === 'group') return evaluate(node.a, values);
  if (node.k === 'neg') { const a = evaluate(node.a, values); return a === undefined ? undefined : -a; }
  const a = evaluate(node.a, values), b = evaluate(node.b, values); return a === undefined || b === undefined ? undefined : apply(node.op, a, b);
}
export function variablesIn(node: Formula): string[] { return node.k === 'var' ? [node.name] : node.k === 'num' ? [] : node.k === 'bin' ? [...variablesIn(node.a), ...variablesIn(node.b)] : variablesIn(node.a); }

/** Result type, or the first problem found. lookup returns the declared type, 'other' for yes/no or text, or undefined when missing. */
export function typeOf(node: Formula, lookup: (name: string) => NumberType | 'other' | undefined): NumberType | Problem {
  if (node.k === 'num') return node.decimal ? 'decimal' : 'whole';
  if (node.k === 'var') { const t = lookup(node.name); if (!t) return { kind: 'missing', message: `There is no variable called ${node.name}.` }; if (t === 'other') return { kind: 'type', message: `${node.name} is not a number, so it cannot be used in arithmetic.` }; return t; }
  if (node.k === 'neg' || node.k === 'group') return typeOf(node.a, lookup);
  const a = typeOf(node.a, lookup); if (isProblem(a)) return a; const b = typeOf(node.b, lookup); if (isProblem(b)) return b;
  if (['/', '//', '%'].includes(node.op) && evaluate(node.b, () => undefined) === 0) return { kind: 'zero', message: 'This divides by zero, which stops the game with an error.' };
  return node.op === '/' || a === 'decimal' || b === 'decimal' ? 'decimal' : 'whole';
}

/** The assignment's result type. Whole-number targets refuse decimal results instead of rounding. */
export function check(target: { name: string; type: NumberType }, operation: Operation, text: string, lookup: (name: string) => NumberType | 'other' | undefined) {
  const node = parseFormula(text); if (isProblem(node)) return { problem: node };
  const formula = typeOf(node, lookup); if (isProblem(formula)) return { node, problem: formula };
  if (['divide', 'floor', 'remainder'].includes(operation) && evaluate(node, () => undefined) === 0) return { node, problem: { kind: 'zero', message: 'This divides by zero, which stops the game with an error.' } as Problem };
  const result: NumberType = operation === 'set' ? formula : operation === 'divide' || formula === 'decimal' || target.type === 'decimal' ? 'decimal' : 'whole';
  if (target.type === 'whole' && result === 'decimal') return { node, result, problem: { kind: 'target', message: `${target.name} is a whole number, but this gives a decimal. ${operation === 'divide' ? 'Use Floor divide' : 'Use whole numbers'}, or choose a decimal variable.` } as Problem };
  return { node, result };
}

/** Value after the assignment when the value before and every operand are known. */
export function after(operation: Operation, before: number | undefined, node: Formula, values: (name: string) => number | undefined) {
  const amount = evaluate(node, values); if (amount === undefined) return undefined; if (operation === 'set') return amount; if (before === undefined) return undefined;
  const op = ({ add: '+', subtract: '-', multiply: '*', divide: '/', floor: '//', remainder: '%' } as const)[operation]; return apply(op, before, amount);
}
export function show(value: number, type: NumberType) { return type === 'decimal' ? (Number.isInteger(value) ? value.toFixed(1) : String(Number(value.toFixed(6)))) : String(value); }
/** Ren'Py source for the formula: display symbols become Python operators. */
export function python(text: string) { return text.trim().replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s+/g, ' '); }
