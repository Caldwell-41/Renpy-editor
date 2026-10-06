import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import { sourceEditor } from '../src/source-editor.ts';
export function losslessEditorProof():{raw:string;after:string;restored:string}{
 const raw='label start:\r\n    "雪 A"\n    # keep this CRLF\r\n    "B"\r\n';const normalized=raw.replace(/\r\n/g,'\n');
 const host=document.createElement('div');document.body.append(host);
 const editor=sourceEditor(host,{rawText:raw,newline:'CRLF',text:normalized,from:0,to:0,readOnly:false,label:'lossless test',change:()=>{}});
 const view=EditorView.findFromDOM(host.querySelector('.cm-editor')!)!;
 view.dispatch({changes:[{from:normalized.indexOf('A'),to:normalized.indexOf('A')+1,insert:'Alpha'},{from:normalized.indexOf('B'),to:normalized.indexOf('B')+1,insert:'Beta'}]});
 const after=editor.snapshot!().text;undo(view);const restored=editor.snapshot!().text;
 // Delete a range spanning unlike line endings. Both redo and grouped history
 // must round-trip the exact original bytes, not the dominant newline style.
 const from=normalized.indexOf('A'),to=normalized.indexOf('B');
 view.dispatch({changes:{from,to,insert:'merged\n'}});
 const merged=editor.snapshot!().text;
 undo(view);if(editor.snapshot!().text!==raw)throw Error('Mixed newline deletion undo changed source bytes');
 redo(view);if(editor.snapshot!().text!==merged)throw Error('Mixed newline deletion redo changed source bytes');
 undo(view);
 view.dispatch({changes:{from:0,insert:'x'},userEvent:'input.type'});
 view.dispatch({changes:{from:1,insert:'y'},userEvent:'input.type'});
 undo(view);if(editor.snapshot!().text!==raw)throw Error('Grouped undo changed source bytes');
 editor.destroy();host.remove();return {raw,after,restored};
}
