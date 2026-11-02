import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";
import type { OwnedScreen, ScreenCatalog } from "../src/screen-contracts.js";
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,0));};
function fixture() {
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver});
 let owned:OwnedScreen[]=[{id:"existing",rootId:"root",path:"game/ui/existing.rpy",name:"existing",kind:"panel",resolved:true,sourceRevision:"accepted"}];
 const catalog=():ScreenCatalog=>({projectRevision:"project",sourceMapRevision:"map",inventoryRevision:"inventory",owned});
 const documents=():ScreenDocument[]=>owned.map(s=>({path:s.path,revision:s.sourceRevision!,partial:false,screens:[{name:s.name,nodes:[{id:s.rootId,kind:"screen",literal:null,layout:{},span:{start:0,end:20},parentStart:null,properties:[],protected:[]}]}]}));
 const writes:Record<string,unknown>[]=[];const story:unknown[]=[];let fail=false;
 const workspace=new ScreensWorkspace({projectId:"project",resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{},saved:()=>{},useInStory:async binding=>{story.push(binding);},request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
  if(operation==="source.list")return {files:documents().map(d=>({path:d.path}))} as T;
  if(operation==="screens.list")return catalog() as T;
  if(operation==="screens.inspect")return documents().find(d=>d.path===payload?.path) as T;
  if(operation==="authoring.list")return {assets:[{id:"image",kind:"uiImage",displayName:"Route",relativePath:"game/images/route.png",sha256:"a".repeat(64),status:"available"}]} as T;
  if(operation==="screens.create"){writes.push(payload!);if(fail)throw Error("Source changed");owned=[...owned,{id:"new",rootId:"new-root",path:`game/ui/${payload!.name}.rpy`,name:String(payload!.name),kind:"panel",resolved:true,sourceRevision:"created"}];return catalog() as T;}
  if(operation==="screens.resolveTarget")return {binding:payload!.binding,kind:"panel"} as T;
  if(operation==="screens.canvasStatus")return {phase:"unavailable",reason:"No renderer in DOM test"} as T;
  throw Error(`Unexpected ${operation}`);
 }});
 workspace.mount(document.body);const click=(label:string)=>{const b=[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===label);assert.ok(b,`Missing ${label}`);b.click();};
 return {workspace,click,writes,story,fail:()=>{fail=true;},close:async()=>{workspace.dispose();await browser.happyDOM.abort();}};
}

test("New screen mounts the real Help form and retains its fields after a refused create",async()=>{
 const f=fixture();try{await flush();f.click("New screen");await flush();
 const dialog=document.querySelector("dialog.screen-create")!;assert.ok(dialog.querySelector('.screen-panels-help'),dialog.outerHTML);
 const name=dialog.querySelector<HTMLInputElement>('[name="screen-name"]')!;name.value="route_help";name.dispatchEvent(new window.Event("input",{bubbles:true}));
 f.fail();dialog.querySelector("form")!.dispatchEvent(new window.Event("submit",{bubbles:true,cancelable:true}));await flush();
 assert.equal(f.writes.length,1);assert.equal(f.writes[0]!.name,"route_help");assert.equal((f.writes[0]!.starter as Record<string,unknown>).assetId,"image");
 assert.equal(name.value,"route_help");assert.match(dialog.textContent!,/Source changed.*Input retained/);
 }finally{await f.close();}
});

test("Use in Story passes a stable panel hint without creating a Beat",async()=>{
 const f=fixture();try{await flush();f.click("3  Use in Story");await flush();assert.deepEqual(f.story,[{screenId:"existing",sourceName:"existing"}]);assert.deepEqual(f.writes,[]);}finally{await f.close();}
});

test("creation Cancel and Escape restore focus to New screen without writing",async()=>{
 const f=fixture();try{await flush();
 for(const action of ["Cancel","Escape"]){
  f.click("New screen");await flush();
  const dialog=document.querySelector("dialog.screen-create")!,name=dialog.querySelector<HTMLInputElement>('[name="screen-name"]')!;name.focus();
  if(action==="Cancel")(dialog.querySelector<HTMLButtonElement>('button[type="button"]'))!.click();
  else name.dispatchEvent(new window.KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));
  assert.equal(dialog.isConnected,false);assert.equal(document.activeElement?.textContent,"New screen");assert.deepEqual(f.writes,[]);
 }
 }finally{await f.close();}
});
