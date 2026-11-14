import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import type { SceneCommand, SceneWorkspace } from "../src/scene-ui.js";
import { chooseIn, editorProject, pickKind, press, renderStoryView, sceneBodies, selectBeat, storyBeat, storyEditor, storyFixture, texts, trackColumn } from "./story-controls-fixture.js";
import { mountStory } from "./story-dom-mount.js";
const tick = async (): Promise<void> => { await new Promise(resolve => setTimeout(resolve, 0)); };

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

test("a Set variable check waits for Story's own write and never tests the revisions that write replaces",async()=>{
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent,Event:browser.Event});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture(),host=document.querySelector<HTMLElement>("main")!;
  const scene=(revision:string,beats:SceneWorkspace["scenes"][number]["beats"]):SceneWorkspace=>({...base,projectRevision:`project-${revision}`,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,sourceRevision:`source-${revision}`,beats,bodies:sceneBodies(beats)},base.scenes[1]!]});
  const end={id:"end",byteStart:30,byteEnd:41,protected:false,payload:{type:"return" as const}};
  const arithmetic=(operand:string,id="arithmetic",byteStart=0)=>({id,byteStart,byteEnd:byteStart+30,protected:false,payload:{type:"setVariable" as const,variableId:"trust",value:{operation:"add" as const,operand}}});
  const checks:{project:string;source:string}[]=[];let finish!:(next:SceneWorkspace)=>void;
  const view=renderStoryView(host,document.querySelector("aside")!,scene("1",[arithmetic("trust + 2"),end]),{
    validateAssignment:async(command,expected)=>{checks.push({project:expected.projectRevision,source:String((command as {expectedSourceRevision?:unknown}).expectedSourceRevision)});throw Error("offline");},
    resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:()=>{},
    apply:async()=>new Promise<SceneWorkspace>(resolve=>{finish=resolve;}),
  },"arithmetic");
  const wait=()=>new Promise(r=>setTimeout(r,200));
  const formula=()=>host.querySelector<HTMLInputElement>('.story-editor [aria-label="Formula"]')!;
  const press=(scope:ParentNode,label:string)=>[...scope.querySelectorAll<HTMLButtonElement>("button")].find(item=>item.textContent===label)!.click();
  try{
    // Commit Beat: the write is in flight while the formula's check comes due.
    formula().value="trust + 3";formula().dispatchEvent(new Event("input",{bubbles:true}));await wait();
    let sent=checks.length;press(storyEditor(host),"Commit Beat");await wait();
    assert.deepEqual(checks.slice(sent),[],"No check runs against the revisions a pending Commit replaces");
    finish(scene("2",[arithmetic("trust + 3"),end]));await wait();
    assert.ok(checks.slice(sent).every(check=>check.project==="project-2"&&check.source==="source-2"),JSON.stringify(checks.slice(sent)));
    // Add Beat: a new Set variable beat, the same way.
    press(host,"+ Add beat");const variable=pickKind(host,"Set variable").querySelector<HTMLSelectElement>('[aria-label="Variable"]')!;
    variable.value="trust";variable.dispatchEvent(new Event("change",{bubbles:true}));
    formula().value="trust + 1";formula().dispatchEvent(new Event("input",{bubbles:true}));await wait();
    sent=checks.length;press(host.querySelector(".new-beat")!,"Add Beat");await wait();
    assert.deepEqual(checks.slice(sent),[],"No check runs against the revisions a pending Add Beat replaces");
    finish(scene("3",[arithmetic("trust + 3"),arithmetic("trust + 1","added",30),{...end,byteStart:60,byteEnd:71}]));await wait();
    assert.ok(checks.slice(sent).every(check=>check.project==="project-3"&&check.source==="source-3"),JSON.stringify(checks.slice(sent)));
  }finally{view.dispose();await browser.happyDOM.close();}
});

test("a Set variable draft whose variable left the project shows Missing Variable, with no check or conflict",async()=>{
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent,Event:browser.Event});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture(),host=document.querySelector<HTMLElement>("main")!;
  const beats=[{id:"arithmetic",byteStart:0,byteEnd:30,protected:false,payload:{type:"setVariable" as const,variableId:"trust",value:{operation:"add" as const,operand:"trust + 2"}}},{id:"end",byteStart:30,byteEnd:41,protected:false,payload:{type:"return" as const}}];
  const model:SceneWorkspace={...base,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,beats,bodies:sceneBodies(beats)},base.scenes[1]!]};
  // An Undo of "+ New variable…" removes the variable; the scene's source is unchanged.
  const removed:SceneWorkspace={...model,projectRevision:"project-2",authoringRevision:"authoring-2",authoring:{...model.authoring,variables:model.authoring.variables.filter(item=>item.id!=="trust")}};
  let checks=0;const statuses:string[]=[],applied:unknown[]=[];
  const actions={validateAssignment:async()=>{checks++;throw Error("offline");},resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:(value:string)=>{statuses.push(value);},apply:async(command:SceneCommand)=>{applied.push(command);throw Error("refused");}};
  const view=renderStoryView(host,document.querySelector("aside")!,model,actions,"arithmetic");
  const editor=()=>storyEditor(host),summary=()=>editor().querySelector<HTMLElement>(".story-variable-picker > summary")!;
  try{
    const formula=editor().querySelector<HTMLInputElement>('[aria-label="Formula"]')!;
    formula.value="trust + 3";formula.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(r=>setTimeout(r,200));
    const sent=checks;view.update(removed,actions,"arithmetic");await new Promise(r=>setTimeout(r,200));
    assert.equal(summary().getAttribute("aria-label"),"Variable: Missing Variable");
    summary().click();assert.ok(!texts(editor().querySelector(".story-variable-picker [role=listbox]")!,".story-variable-name").includes("trust"),"The list offers only project variables");summary().click();
    assert.equal(editor().querySelector('[aria-label="Formula"]'),null);assert.equal(editor().querySelector<HTMLInputElement>('input[aria-label="Value"]')!.value,"trust + 3");
    assert.equal(checks,sent,"A missing variable sends no check");assert.equal(editor().querySelector(".story-conflict"),null);
    assert.equal(trackColumn(host,"arithmetic")!.dataset.beatDraft,"true");
    press(editor(),"Commit Beat");await tick();
    assert.deepEqual(applied,[]);assert.match(statuses.at(-1)!,/Select a declared Variable/);
  }finally{view.dispose();await browser.happyDOM.close();}
});

test("Escape in a Set variable editor asks for Cancel only while it has a draft, and the hint ends with its editor",async()=>{
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent,Event:browser.Event});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture(),host=document.querySelector<HTMLElement>("main")!;
  const beats=[{id:"arithmetic",byteStart:0,byteEnd:30,protected:false,payload:{type:"setVariable" as const,variableId:"trust",value:{operation:"add" as const,operand:"trust + 2"}}},{id:"end",byteStart:30,byteEnd:41,protected:false,payload:{type:"return" as const}}];
  const model:SceneWorkspace={...base,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,beats,bodies:sceneBodies(beats)},base.scenes[1]!]};
  const statuses:string[]=[];let refreshed=0;
  const actions={validateAssignment:async()=>{throw Error("offline");},resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:(value:string)=>{statuses.push(value);},draftsChanged:()=>{refreshed++;},apply:async()=>{throw Error("refused");}};
  const view=renderStoryView(host,document.querySelector("aside")!,model,actions,"arithmetic");
  const escape=():void=>{storyEditor(host).querySelector<HTMLElement>(".story-variable-picker > summary")!.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));};
  const hint="Use Cancel to discard this draft, or keep editing.";
  try{
    escape();
    assert.ok(!statuses.includes(hint),"Escape with no draft names no draft");
    const formula=storyEditor(host).querySelector<HTMLInputElement>('[aria-label="Formula"]')!;
    formula.value="trust + 3";formula.dispatchEvent(new Event("input",{bubbles:true}));await tick();
    escape();assert.equal(statuses.at(-1),hint);
    const before=refreshed;selectBeat(host,"end");await tick();
    assert.ok(refreshed>before,"Leaving the editor restores the usual status");
  }finally{view.dispose();await browser.happyDOM.close();}
});

test("Set variable's list ends with + New variable…, says when there are none, and selects the new variable", async () => {
  const empty = editorProject([storyBeat("words", { type: "narration", text: "The timetable has not changed in thirty years." })]);
  const model: SceneWorkspace = { ...empty, authoring: { ...empty.authoring, variables: [] } };
  const requests: unknown[] = [];
  const s = mountStory(model, { createVariable: async request => {
    requests.push(request);
    return { ...model, projectRevision: "project-2", authoring: { ...model.authoring, variables: [{ id: "count", technicalName: request.technicalName, variableType: request.variableType, defaultValue: "0" }] } };
  } });
  selectBeat(s.host, "words"); press(s.host, "+ Add beat"); const panel = pickKind(s.host, "Set variable");
  const summary = (): HTMLElement => panel.querySelector<HTMLElement>(".story-variable-picker > summary")!;
  assert.equal(summary().textContent, "Choose a variable▾");
  summary().click();
  assert.deepEqual(texts(panel.querySelector(".story-variable-picker [role=listbox]")!, ":scope > *"), ["No variables yet.", "+ New variable…"]);
  const value = panel.querySelector<HTMLInputElement>('input[aria-label="Value"]')!;
  assert.equal(value.disabled, true); assert.equal(value.placeholder, "Choose a variable first");
  press(panel, "+ New variable…");
  const dialog = s.host.querySelector<HTMLElement>(".story-new-variable")!;
  const name = dialog.querySelector<HTMLInputElement>('input[aria-label="Variable name"]')!; name.value = "ticket_count"; name.dispatchEvent(new Event("input", { bubbles: true }));
  chooseIn(dialog, "Variable type", "Whole number");
  press(dialog, "Create variable"); await tick();
  assert.deepEqual(requests, [{ technicalName: "ticket_count", variableType: "int", defaultValue: "0" }]);
  assert.equal(summary().getAttribute("aria-label"), "Variable: ticket_count"); assert.equal(document.activeElement, summary());
  assert.ok(panel.querySelector('input[aria-label="Formula"]'), "A whole number takes a calculation");
  await s.close();
});
