/** Decimal form transport only. Arithmetic parsing and admission belong to core. */
export function decimalValue(raw: string): number {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()) || !Number.isFinite(Number(raw))) {
    throw Error("Enter a finite decimal number, such as 2.5.");
  }
  return Number(raw);
}
