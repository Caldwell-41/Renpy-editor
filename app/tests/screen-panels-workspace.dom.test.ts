import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreensWorkspace, type ScreenDocument } from "../src/screen-ui.js";
import type { CoreOperation } from "../src/protocol.js";
import type { OwnedScreen, ScreenCatalog } from "../src/screen-contracts.js";
const flush=async()=>{for(let i=0;i<8;i++)await new Promise(r=>setTimeout(r,0));};
function fixture(kind: OwnedScreen["kind"] = "panel", availableImage = true, dismissal?: "none" | "finishInteraction" | "hideScreen" | null) {
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver});
 let owned:OwnedScreen[]=[{id:"existing",rootId:"root",path:"game/ui/existing.rpy",name:"existing",kind,resolved:true,sourceRevision:"accepted"}];
 let assetRevision=0;
 const catalog=():ScreenCatalog=>({projectRevision:`project-${assetRevision}`,sourceMapRevision:"map",inventoryRevision:`inventory-${assetRevision}`,owned});
 const documents=():ScreenDocument[]=>owned.map(s=>({path:s.path,revision:s.sourceRevision!,partial:false,screens:[{name:s.name,nodes:[{id:s.rootId,kind:"screen",literal:null,layout:{},span:{start:0,end:20},parentStart:null,properties:[{property:"xsize",value:200},{property:"ysize",value:100}],protected:[]},...(dismissal===undefined?[]:[{id:"button",kind:"textbutton",literal:"Done",layout:{},span:{start:21,end:50},parentStart:0,properties:[],protected:[],dismissal}])]}]}));
 const writes:Record<string,unknown>[]=[];const story:unknown[]=[];const storyKinds:unknown[]=[];let fail=false, renamed=false;
 const workspace=new ScreensWorkspace({projectId:"project",resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{},saved:()=>{},openAssets:async()=>{workspace.panel.remove();},useInStory:async (binding,kind)=>{story.push(binding);storyKinds.push(kind);},request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
  if(operation==="source.list")return {files:documents().map(d=>({path:d.path}))} as T;
  if(operation==="screens.list")return catalog() as T;
  if(operation==="screens.inspect")return documents().find(d=>d.path===payload?.path) as T;
  if(operation==="authoring.list")return {assets:availableImage?[{id:"image",kind:"uiImage",displayName:"Route",relativePath:"game/images/route.png",sha256:"a".repeat(64),status:"available"}]:[]} as T;
  if(operation==="screens.create"){writes.push(payload!);if(fail)throw Error("Source changed");owned=[...owned,{id:"new",rootId:"new-root",path:`game/ui/${payload!.name}.rpy`,name:String(payload!.name),kind:"panel",resolved:true,sourceRevision:"created"}];return catalog() as T;}
  if(operation==="screens.compose"){writes.push(payload!);if(fail)throw Error("Source changed");dismissal="finishInteraction";owned[0]!.sourceRevision="changed";return {document:documents()[0],selectedId:"button",changed:true} as T;}
  if(operation==="screens.resolveTarget")return {binding:renamed?{screenId:"existing",sourceName:"renamed"}:payload!.binding,kind} as T;
  if(operation==="screens.canvasStatus")return {phase:"unavailable",reason:"No renderer in DOM test"} as T;
  throw Error(`Unexpected ${operation}`);
 }});
 workspace.mount(document.body);const click=(label:string)=>{const b=[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===label);assert.ok(b,`Missing ${label}`);b.click();};
 return {workspace,click,writes,story,storyKinds,customAction:()=>{dismissal=null;},importImage:()=>{availableImage=true;assetRevision++;},fail:()=>{fail=true;},allow:()=>{fail=false;},rename:()=>{renamed=true;},close:async()=>{workspace.dispose();await browser.happyDOM.abort();}};
}

test("New screen mounts the real Help form and retains its fields after a refused create",async()=>{
 const f=fixture();try{await flush();f.click("New screen");await flush();
 const dialog=document.querySelector("section.screen-create")!;assert.ok(dialog.querySelector('.screen-panels-help'),dialog.outerHTML);
 assert.equal(dialog.parentElement?.classList.contains("screen-card"),true);assert.equal(document.querySelector("dialog.screen-create"),null);assert.ok(document.querySelector(".screen-starter-canvas .screen-panels-preview"));
 const name=dialog.querySelector<HTMLInputElement>('[name="screen-name"]')!;name.value="route_help";name.dispatchEvent(new window.Event("input",{bubbles:true}));
 f.fail();dialog.querySelector("form")!.dispatchEvent(new window.Event("submit",{bubbles:true,cancelable:true}));await flush();
 assert.equal(f.writes.length,1);assert.equal(f.writes[0]!.name,"route_help");assert.equal((f.writes[0]!.starter as Record<string,unknown>).assetId,"image");
 assert.equal(name.value,"route_help");assert.match(dialog.textContent!,/Source changed.*Input retained/);
 }finally{await f.close();}
});

test("Use in Story passes a stable panel hint without creating a Beat",async()=>{
 const f=fixture();try{await flush();f.click("3  Use in Story");await flush();assert.deepEqual(f.story,[{screenId:"existing",sourceName:"existing"}]);assert.deepEqual(f.writes,[]);}finally{await f.close();}
});

test("Use in Story passes Dialog kind and refuses a changed identity without writing",async()=>{
 const f=fixture("dialog");try{await flush();f.click("3  Use in Story");await flush();
 assert.deepEqual(f.story,[{screenId:"existing",sourceName:"existing"}]);assert.deepEqual(f.storyKinds,["dialog"]);
 f.rename();f.click("3  Use in Story");await flush();assert.equal(f.story.length,1);assert.match(document.querySelector(".screen-message")!.textContent!,/selected screen changed/);assert.deepEqual(f.writes,[]);
 }finally{await f.close();}
});

test("Use in Story retains an unfinished appearance draft across workspace remount",async()=>{
 const f=fixture("dialog");try{await flush();f.click("2  Design");
 const width=document.querySelector<HTMLInputElement>('[data-size="width"]');assert.ok(width);
 width.value="317";width.dispatchEvent(new window.Event("input",{bubbles:true}));assert.equal(f.workspace.hasDraft(),true);
 f.click("3  Use in Story");await flush();assert.equal(f.story.length,1);assert.deepEqual(f.writes,[]);
 f.workspace.panel.remove();f.workspace.mount(document.body);await flush();
 assert.equal(f.workspace.hasDraft(),true);assert.equal(document.querySelector<HTMLInputElement>('[data-size="width"]')?.value,"317");assert.deepEqual(f.writes,[]);
 }finally{await f.close();}
});

test("Assets return retains Dialog Help creation inputs and refreshes its acceptance catalog",async()=>{
 const f=fixture("panel",false);try{await flush();f.click("New screen");await flush();
 const name=document.querySelector<HTMLInputElement>('[name="screen-name"]')!;name.value="route_dialog";name.dispatchEvent(new window.Event("input",{bubbles:true}));
 const kind=document.querySelector<HTMLSelectElement>('[name="screen-kind"]')!;assert.ok(kind);kind.value="dialog";kind.dispatchEvent(new window.Event("change",{bubbles:true}));
 f.click("Open Assets");await flush();assert.equal(f.workspace.panel.isConnected,false);assert.equal(f.writes.length,0);
 f.importImage();f.workspace.mount(document.body);await flush();
 assert.equal(document.querySelector<HTMLInputElement>('[name="screen-name"]')!.value,"route_dialog");assert.equal(document.querySelector<HTMLSelectElement>('[name="screen-kind"]')!.value,"dialog");
 document.querySelector("section.screen-create form")!.dispatchEvent(new window.Event("submit",{bubbles:true,cancelable:true}));await flush();
 assert.equal(f.writes.length,1);assert.equal(f.writes[0]!.kind,"dialog");assert.equal((f.writes[0]!.starter as Record<string,unknown>).assetId,"image");assert.equal(f.writes[0]!.expectedProjectRevision,"project-1");assert.equal(f.writes[0]!.expectedInventoryRevision,"inventory-1");
 }finally{await f.close();}
});

test("the selected button inspector routes a retained Finish draft through revision-bound composition",async()=>{
 const f=fixture("dialog",true,"none");try{await flush();
 document.querySelector<HTMLElement>('[data-node-id="button"]')!.dispatchEvent(new window.MouseEvent("dblclick",{bubbles:true}));
 const action=document.querySelector<HTMLSelectElement>('.screen-dismissal select')!;assert.ok(action);action.value="finishInteraction";action.dispatchEvent(new window.Event("change"));
 assert.equal(f.workspace.hasDraft(),true);f.fail();document.querySelector<HTMLButtonElement>(".screen-dismissal .button.primary")!.click();await flush();
 assert.equal(f.workspace.hasDraft(),true);assert.equal(f.writes[0]!.expectedRevision,"accepted");assert.deepEqual(f.writes[0]!.command,{type:"dismissal",nodeId:"button",action:"finishInteraction"});
 f.workspace.panel.remove();f.workspace.mount(document.body);await flush();assert.equal(document.querySelector<HTMLSelectElement>('.screen-dismissal select')!.value,"finishInteraction");
 f.allow();document.querySelector<HTMLButtonElement>(".screen-dismissal .button.primary")!.click();await flush();
 assert.equal(f.workspace.hasDraft(),false);assert.equal(f.writes.length,2);assert.equal(f.writes[1]!.expectedRevision,"accepted");assert.match(document.querySelector(".screen-message")!.textContent!,/Button action applied/);
 }finally{await f.close();}
});

test("a refreshed custom button action keeps Cancel reachable for the original Finish draft",async()=>{
 const f=fixture("dialog",true,"none");try{await flush();
 document.querySelector<HTMLElement>('[data-node-id="button"]')!.dispatchEvent(new window.MouseEvent("dblclick",{bubbles:true}));
 const action=document.querySelector<HTMLSelectElement>('.screen-dismissal select')!;action.value="finishInteraction";action.dispatchEvent(new window.Event("change"));
 f.customAction();await f.workspace.load();assert.equal(f.workspace.hasDraft(),true);assert.match(document.querySelector(".screen-dismissal-retained")!.textContent!,/Finish interaction draft retained/);
 f.click("Cancel action draft");assert.equal(f.workspace.hasDraft(),false);assert.equal(f.writes.length,0);
 }finally{await f.close();}
});

test("creation Cancel and Escape restore focus to New screen without writing",async()=>{
 const f=fixture();try{await flush();
 for(const action of ["Cancel","Escape"]){
  f.click("New screen");await flush();
  const dialog=document.querySelector("section.screen-create")!,name=dialog.querySelector<HTMLInputElement>('[name="screen-name"]')!;name.focus();
  if(action==="Cancel")([...dialog.querySelectorAll<HTMLButtonElement>('button[type="button"]')].find(button=>button.textContent==="Cancel"))!.click();
  else name.dispatchEvent(new window.KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));
  assert.equal(dialog.isConnected,false);assert.equal(document.activeElement?.textContent,"New screen");assert.deepEqual(f.writes,[]);
 }
 }finally{await f.close();}
});
