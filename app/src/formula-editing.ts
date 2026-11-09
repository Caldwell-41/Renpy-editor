/** The identifier around a caret, or the author's explicit selection. No formula parsing. */
export function formulaCompletionRange(input: HTMLInputElement) {
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  if (start !== end) return { start, end, prefix: "", selected: true };
  const prefix = /[A-Za-z_][A-Za-z0-9_]*$/.exec(input.value.slice(0, start))?.[0] ?? "";
  const suffix = /^[A-Za-z0-9_]*/.exec(input.value.slice(end))![0];
  return { start: start - prefix.length, end: end + suffix.length, prefix, selected: false };
}
