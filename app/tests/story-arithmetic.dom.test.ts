import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { SceneCommand, SceneWorkspace } from "../src/scene-ui.js";
import { renderStoryView, selectBeat, storyEditor, storyFixture, trackColumn } from "./story-controls-fixture.js";

test("imported arithmetic opens as an equation and commits the retained formula through Story", async () => {
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent,Event:browser.Event});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture();
  const model:SceneWorkspace={...base,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,beats:[{id:"arithmetic",byteStart:0,byteEnd:30,protected:false,payload:{type:"setVariable",variableId:"trust",value:{operation:"add",operand:"(trust + 2) * 3"}}}]}]};
  let committed:unknown,inspections=0;
  const dispose=renderStoryView(document.querySelector("main")!,document.querySelector("aside")!,model,{
    validateAssignment:async()=>{inspections++;throw Error("offline");},
    resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:()=>{},
    apply:async(command,expected)=>{committed={command,expected};throw Error("SOURCE_CONFLICT");},
  },"arithmetic").dispose;
  const formula=document.querySelector<HTMLInputElement>('[aria-label="Formula"]');
  assert.ok(formula,"a supported formula must have a formula field");
  assert.equal(formula.value,"(trust + 2) * 3");
  assert.match(document.querySelector('[aria-label="Calculation"]')!.textContent!,/trust.*\+=/);
  formula.focus();formula.setSelectionRange(2,4);
  formula.dispatchEvent(new browser.CompositionEvent("compositionstart",{bubbles:true}) as unknown as Event);
  formula.dispatchEvent(new Event("input",{bubbles:true}));
  formula.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",ctrlKey:true,isComposing:true,bubbles:true}));
  await new Promise(r=>setTimeout(r,160));assert.equal(inspections,0);assert.equal(committed,undefined);assert.equal(formula.value,"(trust + 2) * 3");assert.equal(formula.selectionStart,2);assert.equal(formula.selectionEnd,4);
  formula.dispatchEvent(new browser.CompositionEvent("compositionend",{bubbles:true}) as unknown as Event);
  formula.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",ctrlKey:true,keyCode:229,bubbles:true}));assert.equal(committed,undefined);
  formula.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",ctrlKey:true,bubbles:true}));
  await new Promise(r=>setTimeout(r,0));
  assert.deepEqual(committed,{command:{type:"updateBodyBeat",sceneId:"one",expectedSourceRevision:"source",beatId:"arithmetic",expectedBody:{type:"root"},beat:{type:"setVariable",variableId:"trust",value:{operation:"add",operand:"(trust + 2) * 3"}}},expected:{projectRevision:"project",sourceMapRevision:"map",authoringRevision:"authoring"}});
  assert.equal(formula.value,"(trust + 2) * 3");assert.ok(formula.isConnected&&!formula.disabled);
  dispose();await browser.happyDOM.close();
});

test("an unfinished formula stays in its beat draft across beats, scenes and remounts, and survives a refused Commit",async()=>{
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent,Event:browser.Event});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture(),host=document.querySelector<HTMLElement>("main")!,tree=document.querySelector<HTMLElement>("aside")!;
  const model:SceneWorkspace={...base,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,beats:[{id:"arithmetic",byteStart:0,byteEnd:30,protected:false,payload:{type:"setVariable",variableId:"trust",value:{operation:"add",operand:"trust + 2"}}},{id:"end",byteStart:30,byteEnd:41,protected:false,payload:{type:"return"}}]},base.scenes[1]!]};
  // Core parses formulas; it refuses an unfinished one without writing.
  const sent:string[]=[];const statuses:string[]=[];
  const actions={validateAssignment:async()=>{throw Error("offline");},resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:(value:string)=>{statuses.push(value);},apply:async(command:SceneCommand)=>{sent.push(JSON.stringify(command.beat));throw Error("INVALID_ASSIGNMENT");}};
  const view=renderStoryView(host,tree,model,actions,"arithmetic");
  const formula=host.querySelector<HTMLInputElement>('[aria-label="Formula"]')!;
  formula.focus();formula.value="(trust + ";formula.dispatchEvent(new Event("input",{bubbles:true}));
  const open=(name:string)=>[...tree.querySelectorAll<HTMLButtonElement>(".tree-scene-open")].find(item=>item.textContent===name)!.click();
  selectBeat(host,"end");
  assert.equal(trackColumn(host,"arithmetic")!.dataset.beatDraft,"true");
  open("Shared conversation");await new Promise(r=>setTimeout(r,0));open("Arrival");await new Promise(r=>setTimeout(r,0));
  view.update(model,actions,"arithmetic");
  assert.equal(host.querySelector('[aria-label="Formula"]'),formula);assert.equal(formula.value,"(trust + ");assert.deepEqual(sent,[]);
  [...storyEditor(host).querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent==="Commit Beat")!.click();
  await new Promise(r=>setTimeout(r,0));
  assert.equal(sent.length,1);assert.match(sent[0]!,/\(trust \+ /);assert.match(statuses.at(-1)!,/Input retained/);assert.equal(formula.value,"(trust + ");assert.ok(formula.isConnected);assert.equal(view.hasDrafts("one"),true);
  view.dispose();await browser.happyDOM.close();
});

test("Story and Screens completion replaces a whole identifier or an explicit selection",async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,Event:browser.Event,KeyboardEvent:browser.KeyboardEvent});
 try{
  const {buildAssignmentEditor}=await import('../src/story-arithmetic-editor.js');
  const {screenArithmeticEditor}=await import('../src/screen-arithmetic-editor.js');
  const variable={id:'bonus',technicalName:'bonus',variableType:'int' as const,defaultValue:'2',source:{path:'game/state.rpy',statement:'default bonus = 2',sourceRevision:'v1'}};
  const model=storyFixture();
  for(const kind of ['Story','Screens']){
   const host=kind==='Story'?buildAssignmentEditor({...model,authoring:{...model.authoring,variables:[variable]}},{type:'setVariable',variableId:'bonus',value:{operation:'assign',operand:'bonus'}}).host:screenArithmeticEditor({id:'completion',type:'setVariable',variableId:'bonus',value:'bonus',target:{screenId:'',sourceName:''}},0,{variables:[variable],changed:()=>{}});
   document.body.append(host);const formula=host.querySelector('input')!;
   for(const [raw,start,end,expected,caret] of [['2 + bonus * 3',7,7,'2 + bonus * 3',9],['2 + other * 3',4,9,'2 + bonus * 3',9]] as const){
    formula.value=raw;formula.focus();formula.setSelectionRange(start,end);formula.dispatchEvent(new Event('input',{bubbles:true}));
    formula.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}));
    assert.equal(formula.value,expected,kind);assert.equal(formula.selectionStart,caret,kind);assert.equal(document.activeElement,formula);
   }
   host.remove();
  }
 }finally{await browser.happyDOM.close();}
});

test("Story format errors wait for blur, stay associated, and clear while corrected",async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,Event:browser.Event});
 try{
  const {buildAssignmentEditor}=await import('../src/story-arithmetic-editor.js');const model=storyFixture();
  const editor=buildAssignmentEditor(model,{type:'setVariable',variableId:'trust',value:{operation:'assign',operand:''}},async beat=>({support:beat.value&&typeof beat.value==='object'&&beat.value.operand==='2'?'supported':'refused',assignment:{inferredResultType:'int',state:{status:'unknown',reason:'invalidSyntax'},diagnostics:[{field:'value',reason:'invalidSyntax'}]},variables:model.authoring.variables,capabilities:{operations:['assign'],operators:['+'],maxBytes:100,maxNodes:100,maxDepth:10}} as never));
  document.body.append(editor.host);const field=editor.primary as HTMLInputElement;const settle=()=>new Promise(r=>setTimeout(r,160));
  await settle();assert.notEqual(field.getAttribute('aria-invalid'),'true');
  field.value='1 +';field.dispatchEvent(new Event('input',{bubbles:true}));await settle();assert.notEqual(field.getAttribute('aria-invalid'),'true');
  field.dispatchEvent(new Event('blur'));await settle();assert.equal(field.getAttribute('aria-invalid'),'true');
  const id=field.getAttribute('aria-describedby');assert.ok(id&&document.getElementById(id)?.textContent?.includes('Check the formula'));
  field.value='2';field.dispatchEvent(new Event('input',{bubbles:true}));await settle();assert.notEqual(field.getAttribute('aria-invalid'),'true');
 }finally{await browser.happyDOM.close();}
});
