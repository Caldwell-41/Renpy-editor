export type VariableType = "bool" | "int" | "string";
export interface Assignment { scene: string; beat: number; value: string }
export interface Variable { id: string; name: string; type: VariableType; value: string; line: number; assignments: Assignment[] }
export const typeNames: Record<VariableType, string> = { bool: "Boolean", int: "Integer", string: "Text" };

export function fixture(state: string): Variable[] {
  if (state === "empty") return [];
  const result: Variable[] = [
    { id: "met-ada", name: "met_ada", type: "bool", value: "false", line: 4, assignments: [{ scene: "The last departure", beat: 6, value: "true" }] },
    { id: "trust", name: "ada_trust", type: "int", value: "0", line: 5, assignments: [{ scene: "A seat by the window", beat: 9, value: "1" }, { scene: "The rain stops", beat: 4, value: "3" }] },
    { id: "ticket", name: "ticket_message", type: "string", value: "One way to the coast", line: 6, assignments: [{ scene: "The ticket office", beat: 3, value: "Return before sunrise" }] },
    { id: "promise", name: "kept_the_promise", type: "bool", value: "false", line: 7, assignments: [] },
    { id: "fare", name: "tram_fare", type: "int", value: "4", line: 8, assignments: [{ scene: "The ticket office", beat: 2, value: "6" }] },
    { id: "destination", name: "chosen_destination", type: "string", value: "", line: 9, assignments: [] },
  ];
  if (state === "long") {
    result[2]!.value = ("Ada unfolds the ticket. The ink has run in the rain, but the destination is still legible. She waits for an answer before the conductor returns.\n\n").repeat(12);
    for (let i = 0; i < 24; i++) result.push({ id: `chapter-${i}`, name: `chapter_${i + 1}_complete`, type: "bool", value: "false", line: i + 10, assignments: [] });
  }
  return result;
}

export function validInt64(value: string): boolean {
  if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false;
  try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; }
  catch { return false; }
}
export function declaration(variable: Variable): string {
  const value = variable.type === "bool" ? (variable.value === "true" ? "True" : "False") : variable.type === "string" ? JSON.stringify(variable.value) : variable.value;
  return `default ${variable.name} = ${value}`;
}
