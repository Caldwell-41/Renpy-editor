import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument, type ScreenNode } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";
import type { OwnedScreen, ResolvedScreenTarget } from "../src/screen-contracts.js";
const flush=async()=>{for(let i=0;i<10;i++)await new Promise(r=>setTimeout(r,0));};

test("Edit component selects the verified owner in both the editor and Screen selector",async()=>{
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver});
 const owner=(id:string,kind:"panel"|"component"):OwnedScreen=>({id,rootId:`${id}-root`,path:`game/ui/${id}.rpy`,name:id,kind,resolved:true,sourceRevision:`${id}-source`});
 const panel=owner("about","panel"),component=owner("route_guide","component");
 const node=(id:string,kind:string,start:number,parentStart:number|null):ScreenNode=>({id,kind,literal:null,layout:{},span:{start,end:start+30},parentStart,properties:[],protected:[]});
 const documents:ScreenDocument[]=[{path:panel.path,revision:panel.sourceRevision!,partial:false,screens:[{name:panel.name,nodes:[node(panel.rootId,"screen",0,null),{...node("use-guide","use",20,0),literal:component.name,component:{componentId:component.id,resolved:true,sourceRevision:component.sourceRevision}}]}]},
 {path:component.path,revision:component.sourceRevision!,partial:false,screens:[{name:component.name,nodes:[node(component.rootId,"screen",0,null),node("contents","vbox",20,0)]}]}];
 const target=(owner:OwnedScreen):ResolvedScreenTarget=>({binding:{screenId:owner.id,sourceName:owner.name},kind:owner.kind,path:owner.path,rootId:owner.rootId,revisions:{source:owner.sourceRevision!,sourceMap:"map",inventory:"inventory",effects:"effects"},effects:{revision:"effects",unknown:false,hiddenScreens:[],dependencies:[]}});
 const calls:CoreOperation[]=[];
 const workspace=new ScreensWorkspace({projectId:"component-selection",resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{},saved:()=>{},request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
  calls.push(operation);
  if(operation==="source.list")return {files:documents.map(d=>({path:d.path}))} as T;
  if(operation==="screens.list")return {projectRevision:"project",sourceMapRevision:"map",inventoryRevision:"inventory",owned:[panel,component]} as T;
  if(operation==="screens.inspect")return documents.find(d=>d.path===payload?.path) as T;
  if(operation==="screens.resolveTarget")return target((payload!.binding as {screenId:string}).screenId===panel.id?panel:component) as T;
  if(operation==="screens.componentReview")return {component:target(component),affectedScreens:[panel],uses:[],complete:true} as T;
  if(operation==="screens.canvasStatus")return {phase:"unavailable",reason:"No renderer"} as T;
  throw Error(`Unexpected ${operation}`);
 }});
 try {
  workspace.mount(document.body);await flush();
  document.querySelector<HTMLButtonElement>('[data-node-id="use-guide"]')!.click();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent==="2  Design")!.click();
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent==="Edit component")!.click();await flush();
  const picker=[...document.querySelectorAll<HTMLSelectElement>("select")].find(s=>s.ariaLabel==="Screen")!;
  assert.equal(picker.value,JSON.stringify(["owned",component.id]));
  assert.match(document.querySelector(".screen-component-scope")!.textContent!,/About/);
  assert.equal(calls.filter(op=>["screens.compose","screens.componentExtract","screens.componentPlace","screens.componentCopy"].includes(op)).length,0);
 }finally{workspace.dispose();await browser.happyDOM.abort();}
});
