/** Matches core's UTF-8 byte bound for submitted screen text literals. */
export function screenTextByteError(value: string): string | undefined {
  if (new TextEncoder().encode(value).byteLength > 8192) {
    return "Use no more than 8192 UTF-8 bytes. Shorten or split this text. Your edits are kept.";
  }
}
