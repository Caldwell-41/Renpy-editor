import { tags } from "@lezer/highlight";
import { sourceOffset } from "./source-textarea.ts";
import { Compartment, EditorState, StateField, StateEffect, Text, Transaction } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab, invertedEffects } from "@codemirror/commands";
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches, openSearchPanel } from "@codemirror/search";
export interface SourceEditor {
  snapshot?:()=>{text:string;selectionStart:number;selectionEnd:number};
  readonly value: string; readonly selectionStart: number; readonly selectionEnd: number;
  readOnly: boolean; ariaBusy: string | null; readonly isConnected: boolean;
  focus():void; select():void; setSelectionRange(from:number,to:number):void;
  hasFocus():boolean; destroy():void; find():void; state():EditorState|undefined;
}
// Preserve the original newline bytes through grouped undo/redo as well as edits.
// CodeMirror Text shares unchanged tree nodes, so history does not retain a full
// copied source string for every keystroke.
interface RawDocument { text: Text; newline: "LF" | "CRLF" }
const restoreRaw = StateEffect.define<RawDocument>();
const rawDocument = StateField.define<RawDocument>({
  create: state => ({ text: state.doc, newline: "LF" }),
  update(value, transaction) {
    const restored = transaction.effects.filter(effect => effect.is(restoreRaw)).at(-1);
    if (restored) return restored.value;
    if (!transaction.docChanged) return value;
    const raw = value.text.toString();
    const edits: { from: number; to: number; insert: Text }[] = [];
    transaction.changes.iterChanges((from, to, _a, _b, insert) => edits.push({
      from: sourceOffset(raw, from), to: sourceOffset(raw, to),
      insert: Text.of(insert.toString().replace(/\n/g, value.newline === "CRLF" ? "\r\n" : "\n").split("\n")),
    }));
    let text = value.text;
    for (const edit of edits.reverse()) text = text.replace(edit.from, edit.to, edit.insert);
    return { ...value, text };
  },
});
let rich = false;
export function enableRichSourceEditor():void { rich=true; }
const renpy=StreamLanguage.define({
  startState:()=>({quote:""}),
  token(stream,state){
    if(state.quote){while(!stream.eol()){if(stream.match(state.quote)){state.quote="";break;}stream.next();}return "string";}
    if(stream.eatSpace())return null;
    if(stream.match(/#.*/))return "comment";
    if(stream.match(/'''|"""/)){state.quote=stream.current();return "string";}
    if(stream.match(/"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?/))return "string";
    if(stream.match(/\b(?:label|scene|show|hide|with|menu|jump|call|return|if|elif|else|define|default|python|init|screen|transform|play|stop|voice|at|as|from|while|for|in|True|False|None)\b/))return "keyword";
    if(stream.match(/\b\d+(?:\.\d+)?\b/))return "number";
    stream.next();return null;
  }
});
export function sourceEditor(parent:HTMLElement, options:{text:string;rawText?:string;newline?:"LF"|"CRLF";from:number;to:number;readOnly:boolean;label:string;change:()=>void;retained?:EditorState}):SourceEditor {
  if(!rich){
    const gutter=document.createElement("pre");gutter.className="source-line-numbers";gutter.ariaHidden="true";
    const text=document.createElement("textarea");text.className="source-editor";text.spellcheck=false;text.wrap="off";text.value=options.text;text.readOnly=options.readOnly;text.ariaLabel=options.label;text.setSelectionRange(options.from,options.to);
    const numbers=()=>gutter.textContent=Array.from({length:text.value.split("\n").length},(_,i)=>String(i+1)).join("\n");numbers();text.addEventListener("scroll",()=>gutter.scrollTop=text.scrollTop);
    text.addEventListener("input",()=>{numbers();options.change();});["select","keyup","mouseup"].forEach(e=>text.addEventListener(e,options.change));parent.append(gutter,text);
    return {get value(){return text.value;},get selectionStart(){return text.selectionStart;},get selectionEnd(){return text.selectionEnd;},get readOnly(){return text.readOnly;},set readOnly(v){text.readOnly=v;},get ariaBusy(){return text.ariaBusy;},set ariaBusy(v){text.ariaBusy=v;},get isConnected(){return text.isConnected;},focus:()=>text.focus(),select:()=>text.select(),setSelectionRange:(a,b)=>text.setSelectionRange(a,b),hasFocus:()=>document.activeElement===text,destroy:()=>{},find:()=>text.focus(),state:()=>undefined};
  }
  const readonly=new Compartment();
  const extensions=[rawDocument,invertedEffects.of(tr=>tr.docChanged?[restoreRaw.of(tr.startState.field(rawDocument))]:[]),lineNumbers(),history(),drawSelection(),highlightActiveLine(),highlightSelectionMatches(),syntaxHighlighting(HighlightStyle.define([{tag:tags.keyword,color:"var(--syntax-keyword)"},{tag:tags.string,color:"var(--syntax-string)"},{tag:tags.comment,color:"var(--syntax-comment)",fontStyle:"italic"},{tag:tags.number,color:"var(--syntax-number)"}])),renpy,
    keymap.of([...defaultKeymap,...historyKeymap,...searchKeymap,indentWithTab]),readonly.of([EditorState.readOnly.of(options.readOnly),EditorView.editable.of(!options.readOnly)]),
    EditorView.contentAttributes.of({"aria-label":options.label,spellcheck:"false"}),
    EditorView.cspNonce.of(document.querySelector<HTMLMetaElement>('meta[name="style-nonce"]')?.content??""),
    EditorView.theme({"&":{height:"100%",fontSize:"var(--source-size)",backgroundColor:"var(--surface-app)",color:"var(--text-primary)"},".cm-scroller":{overflow:"auto",fontFamily:"var(--font-source)",lineHeight:"1.65"},".cm-content":{padding:"16px 0"},".cm-gutters":{backgroundColor:"var(--surface-panel)",color:"var(--text-muted)",borderRight:"1px solid var(--border-normal)"},".cm-activeLine":{backgroundColor:"var(--accent-subtle)"},".cm-cursor":{borderLeftColor:"var(--text-primary)"},".cm-selectionBackground":{backgroundColor:"var(--surface-selected) !important"},".cm-panels":{backgroundColor:"var(--surface-panel)",color:"var(--text-primary)"}}),
    EditorView.updateListener.of(update=>{
      if(update.docChanged||update.selectionSet)options.change();})];
  let state=options.retained;
  if(!state || state.doc.toString()!==options.text)state=EditorState.create({doc:options.text,selection:{anchor:options.from,head:options.to},extensions});
  else state=state.update({effects:StateEffect.reconfigure.of(extensions),selection:{anchor:options.from,head:options.to}}).state;
  state=state.update({effects:restoreRaw.of({text:Text.of((options.rawText??options.text).split("\n")),newline:options.newline??"LF"}),annotations:Transaction.addToHistory.of(false)}).state;
  const view=new EditorView({state,parent});parent.classList.add("rich-source-shell");view.contentDOM.classList.add("source-editor");let locked=options.readOnly;
  return {snapshot:()=>{const raw=view.state.field(rawDocument).text.toString();return {text:raw,selectionStart:sourceOffset(raw,view.state.selection.main.from),selectionEnd:sourceOffset(raw,view.state.selection.main.to)};},get value(){return view.state.doc.toString();},get selectionStart(){return view.state.selection.main.from;},get selectionEnd(){return view.state.selection.main.to;},get readOnly(){return locked;},set readOnly(v){if(v===locked)return;locked=v;view.dispatch({effects:readonly.reconfigure([EditorState.readOnly.of(v),EditorView.editable.of(!v)])});},get ariaBusy(){return view.contentDOM.ariaBusy;},set ariaBusy(v){view.contentDOM.ariaBusy=v;},get isConnected(){return view.dom.isConnected;},focus:()=>view.focus(),select:()=>view.dispatch({selection:{anchor:0,head:view.state.doc.length}}),setSelectionRange:(a,b)=>view.dispatch({selection:{anchor:a,head:b},scrollIntoView:true}),hasFocus:()=>view.hasFocus,destroy:()=>view.destroy(),find:()=>{openSearchPanel(view);},state:()=>view.state};
}
