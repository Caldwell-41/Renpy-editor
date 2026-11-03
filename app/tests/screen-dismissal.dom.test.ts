import assert from "node:assert/strict";
import test from "node:test";
import {Window} from "happy-dom";
import {ScreenDismissal} from "../src/screen-panels.js";
import type {CompositionCommand,CompositionView} from "../src/screen-composition.js";
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test("bounded dismissal keeps its original document and input across refusal and remount",async()=>{
 const browser=new Window();Object.assign(globalThis,{document:browser.document,HTMLElement:browser.HTMLElement,Event:browser.Event});
 const node={id:"close",kind:"textbutton",literal:"Close",dismissal:"none" as const,layout:{},span:{start:10,end:30},parentStart:0,properties:[],protected:[]};
 const base={path:"game/ui/help.rpy",revision:"original",partial:false,screens:[{name:"help",nodes:[node]}]};
 let view:CompositionView={document:base,screenId:"dialog",screenName:"help",selected:node,nodes:[node],step:"design",busy:false};
 const writes:{command:CompositionCommand;revision:string}[]=[];const messages:string[]=[];
 const editor=new ScreenDismissal({view:()=>view,kind:()=>"dialog",current:()=>true,commit:async(command,doc)=>{writes.push({command,revision:doc.revision});throw Error("SOURCE_CONFLICT");},redraw:()=>{},note:m=>messages.push(m)});
 const host=document.createElement("main");document.body.append(host);editor.render(host);
 const select=host.querySelector("select")!;select.value="finishInteraction";select.dispatchEvent(new Event("change",{bubbles:true}));
 const apply=[...host.querySelectorAll("button")].find(b=>b.textContent==="Apply")!;apply.click();await tick();
 assert.equal(editor.hasDraft(),true);assert.match(messages.at(-1)!,/Input retained/);
 view={...view,document:{...base,revision:"newer"}};host.replaceChildren();editor.render(host);
 assert.equal(host.querySelector("select")!.value,"finishInteraction");[...host.querySelectorAll("button")].find(b=>b.textContent==="Apply")!.click();await tick();
 assert.deepEqual(writes.map(w=>w.revision),["original","original"]);assert.deepEqual(writes[0]!.command,{type:"dismissal",nodeId:"close",action:"finishInteraction"});
 [...host.querySelectorAll("button")].find(b=>b.textContent==="Cancel")!.click();assert.equal(editor.hasDraft(),false);
 editor.dispose();await browser.happyDOM.close();
});

test("removed or custom-action targets keep a reachable source-bound Cancel",async()=>{
 const browser=new Window();Object.assign(globalThis,{document:browser.document,HTMLElement:browser.HTMLElement,Event:browser.Event});
 const node={id:"close",kind:"textbutton",literal:"Close",dismissal:"none" as "none"|null,layout:{},span:{start:10,end:30},parentStart:0,properties:[],protected:[]};
 const base={path:"game/ui/original_help.rpy",revision:"original",partial:false,screens:[{name:"help",nodes:[node]}]};
 let view:CompositionView|undefined={document:base,screenId:"original-screen",screenName:"help",selected:node,nodes:[node],step:"design",busy:false};
 const helper=new ScreenDismissal({view:()=>view,kind:()=>"dialog",current:()=>true,commit:async()=>{throw Error("Must not write");},redraw:()=>{},note:()=>{}});
 const host=document.createElement("main");document.body.append(host);
 for(const mode of ["missing","custom"]){
   view={document:base,screenId:"original-screen",screenName:"help",selected:{...node,dismissal:"none"} as typeof node,nodes:[node],step:"design",busy:false};host.replaceChildren();helper.render(host);
   host.querySelector("select")!.value="finishInteraction";host.querySelector("select")!.dispatchEvent(new Event("change",{bubbles:true}));
   if(mode==="missing")view=undefined;else view={...view,selected:{...node,dismissal:null} as typeof node,document:{...base,path:"game/ui/changed.rpy",revision:"new"}};
   host.replaceChildren();helper.renderRetained(host);assert.match(host.textContent!,/original_help.rpy/);assert.match(host.textContent!,/Close/);
   assert.equal(helper.hasDraft(),true);[...host.querySelectorAll("button")].find(b=>b.textContent==="Cancel action draft")!.click();assert.equal(helper.hasDraft(),false);
 }
 helper.dispose();await browser.happyDOM.close();
});
