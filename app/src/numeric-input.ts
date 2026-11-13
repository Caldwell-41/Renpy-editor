/** Decimal form transport only. Arithmetic parsing and admission belong to core. */
export type DecimalValue = number | "-0.0";

export function decimalValue(raw: string): DecimalValue {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(raw.trim()) || !Number.isFinite(Number(raw))) {
    throw Error("Enter a finite decimal number, such as 2.5.");
  }
  return Object.is(Number(raw), -0) ? "-0.0" : Number(raw);
}

/** An exact signed 64-bit whole number in canonical form, as core stores it. */
export function int64(raw: string): boolean {
  if (!/^-?(0|[1-9][0-9]*)$/.test(raw) || raw === "-0") return false;
  try { const parsed = BigInt(raw); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; }
}
