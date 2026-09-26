/** HTML textarea exposes LF offsets; Source protocol retains original line endings. */
export function textareaText(text: string): string { return text.replace(/\r\n?/g, "\n"); }
export function textareaOffset(text: string, offset: number): number { return textareaText(text.slice(0,offset)).length; }
function sourceOffset(text: string, offset: number): number {
  let raw=0, visible=0;
  while(raw<text.length && visible<offset) {
    if(text[raw]==="\r" && text[raw+1]==="\n") raw+=2; else raw+=1;
    visible+=1;
  }
  return raw;
}
export function sourceTextareaSnapshot(source: { text?: string; newline: "LF" | "CRLF" }, input: Pick<HTMLTextAreaElement,"value"|"selectionStart"|"selectionEnd">): { text: string; selectionStart: number; selectionEnd: number } {
  const original=source.text ?? "", before=textareaText(original), after=textareaText(input.value);
  let text=original;
  if(before!==after) {
    let prefix=0, suffix=0;
    while(prefix<before.length && prefix<after.length && before[prefix]===after[prefix]) prefix++;
    while(suffix<before.length-prefix && suffix<after.length-prefix && before[before.length-1-suffix]===after[after.length-1-suffix]) suffix++;
    const changed=after.slice(prefix,after.length-suffix).replace(/\n/g,source.newline==="CRLF" ? "\r\n" : "\n");
    // Keep unchanged prefixes/suffixes byte-for-byte, including mixed newline files.
    text=original.slice(0,sourceOffset(original,prefix))+changed+original.slice(sourceOffset(original,before.length-suffix));
  }
  return { text, selectionStart:sourceOffset(text,input.selectionStart), selectionEnd:sourceOffset(text,input.selectionEnd) };
}
