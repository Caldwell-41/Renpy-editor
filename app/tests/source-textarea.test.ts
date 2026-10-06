import assert from "node:assert/strict";
import test from "node:test";
import { sourceTextareaSnapshot,textareaOffset,textareaText } from "../src/source-textarea.js";
test("diagnostic textarea offsets preserve CRLF, Unicode and untouched mixed newlines without creating a text edit",()=>{
  const text='label 雪:\r\n    "😀"\r\n# mixed\n';
  const visible=textareaText(text), start=visible.indexOf('    '),end=visible.indexOf('\n',start);
  const snapshot=sourceTextareaSnapshot({text,newline:"CRLF"},{value:visible,selectionStart:start,selectionEnd:end});
  assert.equal(snapshot.text,text); assert.equal(snapshot.selectionStart,text.indexOf('    '));
  assert.equal(textareaOffset(text,snapshot.selectionStart),start);assert.equal(textareaOffset(text,snapshot.selectionEnd),end);
  const edited=sourceTextareaSnapshot({text,newline:"CRLF"},{value:visible.replace('😀','😀a'),selectionStart:end+1,selectionEnd:end+1});
  assert.equal(edited.text,text.replace('😀','😀a'));assert.ok(edited.text.endsWith('# mixed\n'));
});
