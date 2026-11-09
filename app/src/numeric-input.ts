/** Decimal form transport only. Arithmetic parsing and admission belong to core. */
export type DecimalValue = number | "-0.0";

export function decimalValue(raw: string): DecimalValue {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()) || !Number.isFinite(Number(raw))) {
    throw Error("Enter a finite decimal number, such as 2.5.");
  }
  return Object.is(Number(raw), -0) ? "-0.0" : Number(raw);
}
