import { EditorView } from '@codemirror/view';
import { sourceEditor } from '../src/source-editor.ts';
// Edits keep the original bytes outside the changed range. The editor keeps no text
// history: project Undo restores Source drafts from core (UI.md "Story Undo").
export function losslessEditorProof():{raw:string;after:string;merged:string;undoHandled:boolean;blurs:number}{
 const raw='label start:\r\n    "雪 A"\n    # keep this CRLF\r\n    "B"\r\n';const normalized=raw.replace(/\r\n/g,'\n');
 const host=document.createElement('div');document.body.append(host);let blurs=0;
 const editor=sourceEditor(host,{rawText:raw,newline:'CRLF',text:normalized,from:0,to:0,readOnly:false,label:'lossless test',change:()=>{},blur:()=>{blurs+=1;}});
 const view=EditorView.findFromDOM(host.querySelector('.cm-editor')!)!;
 // Cmd/Ctrl+Z is left to the shell's project Undo, and leaving the editor ends a typing step.
 view.focus();const undo=new KeyboardEvent('keydown',{key:'z',metaKey:true,ctrlKey:true,bubbles:true,cancelable:true});view.contentDOM.dispatchEvent(undo);
 const undoHandled=undo.defaultPrevented;view.contentDOM.blur();
 view.dispatch({changes:[{from:normalized.indexOf('A'),to:normalized.indexOf('A')+1,insert:'Alpha'},{from:normalized.indexOf('B'),to:normalized.indexOf('B')+1,insert:'Beta'}]});
 const after=editor.snapshot!().text;
 // Delete a range spanning unlike line endings: the bytes around it stay as they were.
 const edited=after.replace(/\r\n/g,'\n'),from=edited.indexOf('Alpha'),to=edited.indexOf('Beta');
 view.dispatch({changes:{from,to,insert:'merged\n'}});
 const merged=editor.snapshot!().text;
 editor.destroy();host.remove();return {raw,after,merged,undoHandled,blurs};
}
