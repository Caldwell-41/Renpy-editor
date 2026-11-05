import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));};
function fixture(kind:"dialog"|"panel"|"component"="dialog",bound=false) {
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver});
 let revision="original",authoringRevision="authoring-original",refuse=true;
 const nodes=()=>[{id:"root",kind:"screen",literal:null,span:{start:0,end:200},parentStart:null,layout:{},properties:[],protected:[]},{id:"close",kind:"textbutton",literal:"Close",actions:[],span:{start:20,end:90},parentStart:0,layout:{},properties:[],protected:[],textProperties:{values:{},blocked:{}}},{id:"body",kind:"text",literal:bound?"Coins: [coins!q]":"Coins: 12",variableBindings:bound?[{variableId:"coins"}]:[],span:{start:100,end:150},parentStart:0,layout:{},properties:[],protected:[],textProperties:{values:{},blocked:{}}}];
 const doc=():ScreenDocument=>({path:"game/ui/help.rpy",revision,authoringRevision,partial:false,screens:[{name:"help",nodes:nodes()}]});
 const owner={id:"help",rootId:"root",path:doc().path,name:"help",kind,resolved:true,sourceRevision:revision};
 const writes:Record<string,unknown>[]=[],renders:Record<string,unknown>[]=[],messages:string[]=[];
 const variables=[{id:"seen",technicalName:"help_seen",variableType:"bool",defaultValue:false,source:{sourceRevision:"seen-v1"}},{id:"coins",technicalName:"coins",variableType:"int",defaultValue:"12",source:{sourceRevision:"coins-v1"}},{id:"name",technicalName:"player_name",variableType:"string",defaultValue:"Mara",source:{sourceRevision:"name-v1"}}];
 const workspace=new ScreensWorkspace({resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{messages.push("preview");},saved:()=>{},request:async<T>(op:CoreOperation,payload:Record<string,unknown>={}):Promise<T>=>{
  if(op==="source.list")return {files:[{path:doc().path}]} as T;
  if(op==="screens.list")return {projectRevision:revision,sourceMapRevision:revision,inventoryRevision:revision,owned:[{...owner,sourceRevision:revision},{...owner,id:"about",name:"about",kind:"panel"},{...owner,id:"unsafe",name:"unsafe",kind:"panel"}]} as T;
  if(op==="screens.inspect")return doc() as T;
  if(op==="authoring.list")return {assets:[],variables} as T;
  if(op==="screens.resolveTarget"){const binding=payload.binding as {screenId:string};return {binding:{screenId:binding.screenId,sourceName:binding.screenId},kind:binding.screenId==="help"?kind:"panel",blocking:binding.screenId==="help"&&kind==="dialog",canShowHide:binding.screenId==="about"||binding.screenId==="help"&&kind==="panel",revisions:{source:`${binding.screenId}-source-${revision}`,sourceMap:revision,inventory:revision,effects:revision},effects:{unknown:false}} as T;}
  if(op==="screens.compose"){writes.push(payload);if(refuse)throw Error("SOURCE_CONFLICT");return {document:doc(),selectedId:(payload.command as {nodeId:string}).nodeId,changed:false} as T;}
  if(op==="screens.canvasRender"){renders.push(payload);throw Error("No helper in controller test");}
  throw Error(`Unexpected ${op}`);
 }});
 const find=(label:string)=>{const e=[...workspace.panel.querySelectorAll<HTMLElement>("[aria-label]")].find(e=>e.getAttribute("aria-label")===label);assert.ok(e,label);return e as HTMLSelectElement;};
 const change=(label:string,value:string)=>{const e=find(label);e.value=value;e.dispatchEvent(new window.Event(e.tagName==="SELECT"?"change":"input",{bubbles:true}));};
 const button=(label:string)=>{const e=[...workspace.panel.querySelectorAll("button")].find(e=>e.textContent===label);assert.ok(e,label);e.click();};
 const select=(id:string)=>{if(!workspace.panel.querySelector(`[data-node-id="${id}"]`))button("1  Choose");workspace.panel.querySelector<HTMLElement>(`[data-node-id="${id}"]`)!.dispatchEvent(new window.MouseEvent("dblclick",{bubbles:true}));};
 return {browser,workspace,writes,renders,messages,find,change,button,select,refresh:async()=>{revision="newer";authoringRevision="authoring-newer";await workspace.load();},allow:()=>{refuse=false;},dispose:async()=>{workspace.dispose();await browser.happyDOM.abort();}};
}
test("actions and text share one original-base Apply and retain refused input across refresh and remount",async()=>{
 const f=fixture();try{f.workspace.mount(document.body);await flush();f.select("close");await flush();
 f.change("Add action","setVariable");assert.equal((document.activeElement as HTMLElement)?.dataset.part,"variable");f.change("Action 1 variable","coins");f.change("Action 1 value","42");
 f.change("Add action","showScreen");assert(![...f.find("Action 2 screen").options].some(o=>o.value.includes("unsafe")));
 f.change("Add action","finishInteraction");f.change("Text","Done");f.button("Apply");await flush();
 assert.equal(f.workspace.hasDraft(),true);const first=f.writes[0]!;assert.equal(first.expectedRevision,"original");
 assert.deepEqual(first.command,{type:"formatText",nodeId:"close",values:{text:"Done"},interaction:{expectedAuthoringRevision:"authoring-original",expectedTargetRevisions:[{target:{screenId:"about",sourceName:"about"},revisions:{source:"about-source-original",sourceMap:"original",inventory:"original",effects:"original"}}],actions:[{type:"setVariable",variableId:"coins",value:"42"},{type:"showScreen",target:{screenId:"about",sourceName:"about"}},{type:"finishInteraction"}]}});
 await f.refresh();f.workspace.panel.remove();f.workspace.mount(document.body);await flush();assert.equal(f.find("Action 1 value").value,"42");f.button("Apply");await flush();assert.deepEqual(f.writes[1],first);
 f.button("Cancel");assert.equal(f.workspace.hasDraft(),false);
 }finally{await f.dispose();}
});

test("Insert variable replaces the Text selection, keeps its caret, and samples retain invalid raw input without writes",async()=>{
 const f=fixture();try{f.workspace.mount(document.body);await flush();f.select("body");await flush();
 const input=f.find("Text") as unknown as HTMLTextAreaElement;input.focus();input.setSelectionRange(7,9);f.change("Existing variable","coins");f.button("Insert variable");
 assert.equal(input.value,"Coins: [coins!q]");assert.equal(document.activeElement===input,true);assert.deepEqual([input.selectionStart,input.selectionEnd],[16,16]);
 f.button("Apply");await flush();assert.deepEqual(f.writes[0]!.command,{type:"formatText",nodeId:"body",values:{text:"Coins: [coins!q]"},interaction:{expectedAuthoringRevision:"authoring-original",expectedTargetRevisions:[]}});
 f.button("Cancel");assert.equal(f.workspace.hasDraft(),false);f.button("Sample values");f.change("Sample coins","19");await flush();
 assert.equal(f.workspace.hasDraft(),false);assert.equal(f.writes.length,1);const last=f.renders.at(-1)!;assert.deepEqual(last.variableSamples,[{variableId:"coins",expectedSourceRevision:"coins-v1",value:"19"}]);
 f.change("Sample coins","9223372036854775808");await flush();assert.equal(f.find("Sample coins").value,"9223372036854775808");assert.equal(f.find("Sample coins").getAttribute("aria-invalid"),"true");assert.match(f.workspace.panel.textContent!,/last valid sample/);assert.deepEqual(f.renders.at(-1)!.variableSamples,last.variableSamples);
 f.workspace.panel.remove();f.workspace.mount(document.body);await flush();assert.equal(f.find("Sample coins").value,"9223372036854775808");f.button("Reset samples");await flush();assert.equal(f.find("Sample coins").value,"12");assert.deepEqual(f.renders.at(-1)!.variableSamples,[]);assert.equal(f.writes.length,1);
 }finally{await f.dispose();}
});

test("typed assignments validate without losing input, preserve text-first edits, and keep Finish last through moves and removals",async()=>{
 const f=fixture();try{f.workspace.mount(document.body);await flush();f.select("close");await flush();f.change("Text","Proceed");
 f.change("Add action","setVariable");f.change("Action 1 value","True");f.change("Add action","setVariable");f.change("Action 2 variable","name");f.change("Action 2 value","[opaque_python()] {literal}");f.change("Add action","finishInteraction");
 f.change("Add action","setVariable");f.change("Action 3 variable","coins");f.change("Action 3 value","-0");f.button("Apply");await flush();assert.equal(f.writes.length,0);assert.equal(f.find("Action 3 value").value,"-0");const invalid=f.find("Action 3 value");assert.equal(invalid.getAttribute("aria-invalid"),"true");assert.ok(document.getElementById(invalid.getAttribute("aria-describedby")!));
 f.change("Action 3 value","-9223372036854775808");const earlier=f.workspace.panel.querySelector<HTMLButtonElement>('[aria-label="Move action 3 earlier"]')!;earlier.click();assert.equal(f.find("Action 2 value").value,"-9223372036854775808");assert.equal(document.activeElement?.tagName,"SUMMARY");assert.equal(f.find("Action 4 type").value,"finishInteraction");
 f.button("Apply");await flush();const command=f.writes[0]!.command as {values:unknown;interaction:{actions:unknown[]}};assert.deepEqual(command.values,{text:"Proceed"});assert.deepEqual(command.interaction.actions,[{type:"setVariable",variableId:"seen",value:true},{type:"setVariable",variableId:"coins",value:"-9223372036854775808"},{type:"setVariable",variableId:"name",value:"[opaque_python()] {literal}"},{type:"finishInteraction"}]);
 for(let i=0;i<4;i++)f.change("Add action","setVariable");assert.equal(f.find("Add action").disabled,true);assert.equal(f.find("Action 8 type").value,"finishInteraction");
 f.workspace.panel.querySelector<HTMLButtonElement>('[aria-label="Remove action 1"]')!.click();assert.equal(document.activeElement?.tagName,"SUMMARY");assert.equal(f.find("Add action").disabled,false);
 f.find("Action 1 value").dispatchEvent(new window.KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));assert.equal(f.workspace.hasDraft(),false);assert.equal(f.writes.length,1);
 }finally{await f.dispose();}
});

test("pending Text and action fields restore selection and focus after navigating away and remounting",async()=>{
 const f=fixture();try{f.workspace.mount(document.body);await flush();f.select("body");await flush();f.change("Text","Pending text");let input=f.find("Text") as unknown as HTMLTextAreaElement;input.focus();input.setSelectionRange(2,7);f.select("close");f.select("body");input=f.find("Text") as unknown as HTMLTextAreaElement;assert.equal(input.value,"Pending text");assert.equal(document.activeElement===input,true);assert.deepEqual([input.selectionStart,input.selectionEnd],[2,7]);
 f.select("close");f.change("Add action","setVariable");f.change("Action 1 variable","coins");f.change("Action 1 value","12345");const value=f.find("Action 1 value") as unknown as HTMLInputElement;value.focus();value.setSelectionRange(1,3);await flush();f.select("body");f.button("Return to Close");assert.equal(f.find("Action 1 value").value,"12345");f.workspace.panel.remove();f.workspace.mount(document.body);await flush();const restored=f.find("Action 1 value") as unknown as HTMLInputElement;assert.equal(document.activeElement===restored,true);assert.deepEqual([restored.selectionStart,restored.selectionEnd],[1,3]);
 }finally{await f.dispose();}
});

test("a Panel reviews distinct qualified targets including self and keeps empty action writes explicit",async()=>{
 const f=fixture("panel");try{f.workspace.mount(document.body);await flush();f.select("close");await flush();assert(![...f.find("Add action").options].some(o=>o.value==="finishInteraction"));
 f.change("Add action","hideScreen");f.change("Action 1 screen",JSON.stringify(["help","help"]));f.change("Add action","showScreen");f.change("Action 2 screen",JSON.stringify(["help","help"]));f.change("Add action","hideScreen");f.change("Action 3 screen",JSON.stringify(["about","about"]));f.button("Apply");await flush();
 const command=f.writes[0]!.command as {interaction:{expectedTargetRevisions:unknown[]}};assert.deepEqual(command.interaction.expectedTargetRevisions,[{target:{screenId:"help",sourceName:"help"},revisions:{source:"help-source-original",sourceMap:"original",inventory:"original",effects:"original"}},{target:{screenId:"about",sourceName:"about"},revisions:{source:"about-source-original",sourceMap:"original",inventory:"original",effects:"original"}}]);
 for(let i=0;i<3;i++)f.workspace.panel.querySelector<HTMLButtonElement>('[aria-label="Remove action 1"]')!.click();f.button("Apply");await flush();assert.deepEqual(f.writes.at(-1)!.command,{type:"formatText",nodeId:"close",values:{},interaction:{expectedAuthoringRevision:"authoring-original",expectedTargetRevisions:[],actions:[]}});
 }finally{await f.dispose();}
});

test("component text keeps variable insertion and review controls while its button actions stay read-only",async()=>{
 const f=fixture("component");try{f.workspace.mount(document.body);await flush();f.select("close");await flush();assert.equal(f.find("Add action").disabled,true);assert.equal(f.workspace.panel.querySelector<HTMLFieldSetElement>(".siv-actions fieldset")!.disabled,true);assert.equal(f.workspace.panel.querySelector(".siv-insert"),null);f.select("body");assert.ok(f.find("Existing variable"));assert.equal(f.writes.length,0);
 }finally{await f.dispose();}
});

test("bound Text sends pending templates through the existing core draft-render owner and never an old text-sample override",async()=>{
 const f=fixture("dialog",true);try{f.workspace.mount(document.body);await flush();f.select("body");await flush();f.change("Text","Current balance: [coins!q]");await flush();
 const request=f.renders.at(-1)!;assert.deepEqual(request.textSamples,[]);assert.deepEqual(request.textStyles,[{nodeStart:100,values:{text:"Current balance: [coins!q]"}}]);assert.equal(f.writes.length,0);
 }finally{await f.dispose();}
});
