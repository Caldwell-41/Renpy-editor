import assert from "node:assert/strict";
import test from "node:test";
import { ScreenComponents, type ScreenComponentsHost } from "../src/screen-components.ts";
import type { CompositionView, CopyDraftParticipant } from "../src/screen-composition.ts";
import type { ComponentReview, ScreenCatalog, ScreenRevisions, ResolvedScreenTarget } from "../src/screen-contracts.ts";
import type { ScreenNode } from "../src/screen-ui.ts";
import type { CoreOperation } from "../src/protocol.ts";
import { Window } from "happy-dom";

const revisions: ScreenRevisions = {source:"source",sourceMap:"map",inventory:"inventory",effects:"effects"};
const node = (id:string,kind:string,start:number,parentStart:number|null):ScreenNode => ({id,kind,literal:null,span:{start,end:start+10},parentStart,layout:{},properties:[],protected:[]});
function fixture() {
  const nodes = [node("root","screen",0,null),node("group","vbox",20,0)];
  const view:CompositionView = {document:{path:"game/ui/help.rpy",revision:"source",partial:false,screens:[{name:"help",nodes}]},screenId:"panel",screenName:"help",nodes,selected:nodes[1]!,step:"design",busy:false};
  const catalog:ScreenCatalog = {projectRevision:"project",sourceMapRevision:"map",inventoryRevision:"inventory",owned:[{id:"panel",rootId:"root",path:view.document.path,name:"help",kind:"panel",resolved:true,sourceRevision:"source"}]};
  const resolved:ResolvedScreenTarget = {binding:{screenId:"panel",sourceName:"help"},kind:"panel",blocking:false,canShowHide:true,path:view.document.path,rootId:"root",revisions,effects:{revision:"effects",unknown:false,shownScreens:[],assignedVariables:[],hiddenScreens:[],finishesInteraction:false,dependencies:[]}};
  const calls:{operation:string;payload?:Record<string,unknown>}[] = [];
  let saved = 0;
  const host:ScreenComponentsHost = {view:()=>view,catalog:()=>catalog,current:()=>true,
    request:async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T> => {calls.push({operation,payload});return (operation==="screens.resolveTarget"?resolved:operation==="screens.componentPrepareExtract"?{screenId:"panel",nodeId:"group",path:view.document.path,sourceRevision:"source",span:{start:20,end:30},source:"    vbox:\n"}:{componentId:"component",screenId:"panel",useId:"use"}) as T;},
    coordinate:task=>task(),accepted:async()=>{saved++;return view;},openDefinition:async()=>view,source:()=>{},redraw:()=>{},note:()=>{}};
  return {controller:new ScreenComponents(host),host,view,catalog,calls,saved:()=>saved,markSaved:()=>{saved++;}};
}

test("extract preparation captures exact Source without writing; naming submits one typed transaction",async()=>{
  const h=fixture();
  const prepared=await h.controller.prepareExtract();
  assert.equal(prepared.source,"    vbox:\n");
  assert.equal(h.saved(),0);
  assert.deepEqual(h.calls.map(c=>c.operation),["screens.resolveTarget","screens.componentPrepareExtract"]);
  await h.controller.extract("route_guide");
  assert.deepEqual(h.calls.at(-1),{operation:"screens.componentExtract",payload:{target:{screenId:"panel",sourceName:"help"},expected:revisions,expectedProjectRevision:"project",nodeId:"group",name:"route_guide"}});
  assert.equal(h.saved(),1);
});

test("structural extraction and placement keep current-owner pending fields on their original target",async()=>{
  const h=fixture();h.host.captureDrafts=()=>[{validate:()=>{},prepare:()=>()=>{},cancel:()=>{throw Error("Must retain input");}}];
  await assert.rejects(h.controller.prepareExtract(),/Apply or cancel/);
  await assert.rejects(h.controller.place("component","group"),/Apply or cancel/);
  assert.equal(h.calls.length,0);assert.equal(h.saved(),0);
});

test("placement requires an explicit current parent and preserves typed component intent",async()=>{
  const h=fixture();
  h.catalog.owned.push({id:"component",rootId:"component-root",name:"route_guide",path:"game/ui/route_guide.rpy",kind:"component",resolved:true,sourceRevision:"component-source"});
  const request=h.host.request;
  h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T> => {
    if(operation==="screens.resolveTarget" && (payload?.binding as {screenId:string}).screenId==="component")return {binding:{screenId:"component",sourceName:"route_guide"},kind:"component",blocking:false,canShowHide:false,path:"game/ui/route_guide.rpy",rootId:"component-root",revisions:{...revisions,source:"component-source"},effects:{revision:"effects",unknown:false,shownScreens:[],assignedVariables:[],hiddenScreens:[],finishesInteraction:false,dependencies:[]}} as T;
    return request<T>(operation,payload);
  };
  await assert.rejects(h.controller.place("component","missing"),/parent/);
  assert.equal(h.saved(),0);
  await h.controller.place("component","group");
  assert.deepEqual(h.calls.at(-1),{operation:"screens.componentPlace",payload:{component:{screenId:"component",sourceName:"route_guide"},expectedComponent:{...revisions,source:"component-source"},target:{screenId:"panel",sourceName:"help"},expectedTarget:revisions,parentId:"group"}});
  assert.equal(h.saved(),1);
});

function copyFixture() {
  const h=fixture();
  const panel=h.view;
  panel.selected={...node("use","use",20,0),literal:"route_guide",component:{componentId:"component",resolved:true,sourceRevision:"component-source"}};
  panel.nodes[1]=panel.selected;
  const definition=(id:string,name:string,revision:string):CompositionView=>{
    const nodes=[node(id+"-root","screen",0,null),node(id+"-group","vbox",40,0),{...node(id+"-text","text",90,40),literal:"Accepted",textProperties:{values:{size:20},blocked:{}}}];
    return {document:{path:`game/ui/${name}.rpy`,revision,partial:false,screens:[{name,nodes}]},screenId:id,screenName:name,nodes,selected:nodes[2]!,step:"design",busy:false};
  };
  const original=definition("component","route_guide","component-source"), fresh=definition("copy","help_guide","copy-source");
  h.catalog.owned.push({id:"component",rootId:"component-root",name:"route_guide",path:original.document.path,kind:"component",resolved:true,sourceRevision:"component-source"});
  const review=(view:CompositionView):ComponentReview=>({component:{binding:{screenId:view.screenId,sourceName:view.screenName},kind:"component",blocking:false,canShowHide:false,path:view.document.path,rootId:view.nodes[0]!.id!,revisions:{...revisions,source:view.document.revision},effects:{revision:"effects",unknown:false,shownScreens:[],assignedVariables:[],hiddenScreens:[],finishesInteraction:false,dependencies:[]}},affectedScreens:[h.catalog.owned[0]!],uses:[{screenId:"panel",componentId:view.screenId,nodeId:"use",path:panel.document.path,screenName:"help",span:{start:20,end:30},sourceRevision:"source",resolved:true}],complete:true});
  let current=panel, failRefresh=true, accepted=0, transferred=0, draft="Pending";
  const events:string[]=[];
  const participant:CopyDraftParticipant={validate:()=>{events.push("validate");},prepare:(view,ids)=>{
    assert.equal(view.document.revision,"copy-source");assert.equal(ids.get("component-text"),"copy-text");events.push("prepare");
    return ()=>{events.push("commit:"+draft);transferred++;};},cancel:()=>{draft="";events.push("cancel");}};
  h.host.captureDrafts=()=>[participant];h.host.view=()=>current;
  h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
    h.calls.push({operation,payload});
    if(operation==="screens.componentReview")return review(payload?.componentId==="copy"?fresh:original) as T;
    if(operation==="screens.resolveTarget")return ((payload?.binding as {screenId:string}).screenId==="panel"?{...review(original).component,binding:{screenId:"panel",sourceName:"help"},kind:"panel",blocking:false,canShowHide:true,path:panel.document.path,revisions}:review(fresh).component) as T;
    if(operation==="screens.componentCopy")return {componentId:"copy",screenId:"panel",useId:"use"} as T;
    throw Error(operation);
  };
  h.host.openDefinition=async(id)=>{current=id==="copy"?fresh:original;return current;};
  h.host.accepted=async()=>{accepted++;h.markSaved();if(failRefresh)throw Error("refresh refused");
    h.catalog.owned.push({id:"copy",rootId:"copy-root",name:"help_guide",path:fresh.document.path,kind:"component",resolved:true,sourceRevision:"copy-source"});
    return {...panel,selected:{...panel.selected,component:{componentId:"copy",resolved:true,sourceRevision:"copy-source"}}};};
  return {...h,panel,original,fresh,events,editDraft:(value:string)=>{draft=value;},refresh:()=>{failRefresh=false;},accepted:()=>accepted,transferred:()=>transferred};
}

test("accepted copy keeps the original draft through failed refresh; Reload verifies fresh IDs before transfer",async()=>{
  const h=copyFixture();
  const capture=h.host.captureDrafts!;h.host.captureDrafts=(view,trackNewDrafts)=>{if(trackNewDrafts!==true)return [];return capture(view);};
  await h.controller.editUse();
  await assert.rejects(h.controller.makeCopy("help_guide"),/Copy created/);
  assert.equal(h.saved(),1);assert.equal(h.transferred(),0);assert.equal(h.controller.hasPendingCopy(),true);
  await assert.rejects(h.controller.place("component","component-group"),/copy/i);
  h.editDraft("Latest pending values");h.refresh();await h.controller.reloadCopy();
  assert.equal(h.accepted(),2);assert.equal(h.transferred(),1);assert.equal(h.controller.hasPendingCopy(),false);
  assert.deepEqual(h.events,["validate","prepare","commit:Latest pending values"]);
  assert.equal(h.calls.filter(c=>c.operation==="screens.componentCopy").length,1);
});

test("component Source completion cannot navigate after leaving or remounting Screens",async()=>{
 for(const boundary of ["dispose","remount"]){
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=copyFixture(),host=document.createElement("section");document.body.append(host);let release!:(value:unknown)=>void,navigations=0;
  const request=h.host.request,waiting=new Promise(resolve=>{release=resolve;});
  h.host.source=()=>{navigations++;};h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>operation==="screens.inspect"?await waiting as T:request<T>(operation,payload);
  try{
   h.controller.renderScope(host,h.original);await new Promise(resolve=>setTimeout(resolve,0));
   [...host.querySelectorAll("button")].find(button=>button.textContent==="Open Source")!.click();await new Promise(resolve=>setTimeout(resolve,0));
   if(boundary==="dispose")h.controller.dispose();else h.controller.invalidate();
   release(h.original.document);await new Promise(resolve=>setTimeout(resolve,0));assert.equal(navigations,0);
  }finally{h.controller.dispose();await browser.happyDOM.abort();}
 }
});

test("copied numeric properties may move in Source but changed property values cannot receive a draft",async()=>{
  for(const changed of [false,true]) {
    const h=copyFixture();h.refresh();
    Object.assign(h.original.nodes[1]!,{properties:[{property:"xsize",value:500,span:{start:55,end:65}}]});
    Object.assign(h.fresh.nodes[1]!,{properties:[{property:"xsize",value:changed?501:500,span:{start:85,end:95}}]});
    await h.controller.editUse();
    if(changed) {
      await assert.rejects(h.controller.makeCopy("help_guide"),/accepted content changed/);
      assert.equal(h.transferred(),0);assert.equal(h.controller.hasPendingCopy(),true);
      assert.equal(h.host.view()?.screenId,"component","Failed verification returns to the retained original fields");
    } else {
      await h.controller.makeCopy("help_guide");assert.equal(h.transferred(),1);assert.equal(h.controller.hasPendingCopy(),false);
    }
  }
});

test("copy prepares every draft before moving any; Cancel keeps the already accepted copy",async()=>{
  const h=copyFixture();h.refresh();
  const first=h.host.captureDrafts!(h.original)[0]!;let cancelled=0;
  h.host.captureDrafts=()=>[first,{validate:()=>{},prepare:()=>{throw Error("Copied image cannot be verified");},cancel:()=>{cancelled++;}}];
  await h.controller.editUse();await assert.rejects(h.controller.makeCopy("help_guide"),/Copied image cannot be verified/);
  assert.equal(h.transferred(),0);assert.equal(h.controller.hasPendingCopy(),true);assert.deepEqual(h.events,["validate","prepare"]);
  h.controller.cancelCopy();
  assert.equal(h.controller.hasPendingCopy(),false);assert.equal(cancelled,1);assert.deepEqual(h.events,["validate","prepare","cancel"]);
  assert.equal(h.calls.filter(call=>call.operation==="screens.componentCopy").length,1);
  assert.equal(h.calls.some(call=>call.operation==="scene.apply"),false,"Cancel never reverses the accepted copy");
});

test("ambiguous copied identities retain the original draft and an incomplete review admits no shared write",async()=>{
  const h=copyFixture();h.refresh();h.fresh.nodes[1]!.id=h.fresh.nodes[0]!.id;
  await h.controller.editUse();await assert.rejects(h.controller.makeCopy("help_guide"),/identities.*ambiguous/);
  assert.equal(h.transferred(),0);assert.equal(h.controller.hasPendingCopy(),true);
  h.controller.cancelCopy();
  const other=copyFixture();await other.controller.editUse();const request=other.host.request;
  other.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
    const result=await request<T>(operation,payload);
    return (operation==="screens.componentReview"?{...result,complete:false}:result) as T;
  };
  await assert.rejects(other.controller.reviewChanges([{label:"Text",before:"Accepted",after:"Pending"}]),/incomplete/);
  assert.equal(other.saved(),0);
});

test("shared review lists all affected screens and only changed fields; Cancel keeps the draft and confirms exact revisions",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=copyFixture();
  try {
    await h.controller.editUse();
    const request=h.host.request;
    h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{
      const result=await request<T>(operation,payload);
      if(operation!=="screens.componentReview")return result;
      const review=result as ComponentReview;
      return {...review,affectedScreens:[...review.affectedScreens,{...h.catalog.owned[0]!,id:"about",name:"about"}],uses:[...review.uses,{...review.uses[0]!,screenId:"about",nodeId:"other-use"}]} as T;
    };
    const changes=[{label:"Text",before:"Accepted",after:"Pending"},{label:"Size",before:"20 px",after:"20 px"}];
    const first=h.controller.reviewChanges(changes);await new Promise(resolve=>setTimeout(resolve,0));
    let dialog=document.querySelector("dialog")!;assert.ok(dialog);
    assert.match(dialog.textContent??"",/Help/);assert.match(dialog.textContent??"",/Current/);assert.match(dialog.textContent??"",/After Apply/);
    assert.match(dialog.textContent??"",/Pending/);assert.equal(dialog.textContent?.includes("Size"),false);
    [...dialog.querySelectorAll("button")].find(button=>button.textContent==="Keep editing")!.click();
    assert.equal(await first,undefined);assert.equal(h.saved(),0);
    const second=h.controller.reviewChanges(changes);await new Promise(resolve=>setTimeout(resolve,0));
    dialog=document.querySelector("dialog")!;
    [...dialog.querySelectorAll("button")].find(button=>button.textContent==="Apply to 2 screens")!.click();
    assert.deepEqual(await second,{...revisions,source:"component-source"});
    assert.equal(h.calls.some(c=>c.operation==="screens.compose"),false,"Review never creates another save owner");
  } finally {h.controller.dispose();await browser.happyDOM.abort();}
});

test("Make component keeps the entered name on refusal and Cancel writes nothing",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=fixture(),tools=document.createElement("div");document.body.append(tools);
  try {
    h.controller.renderGroupTools(tools);
    [...tools.querySelectorAll("button")].find(button=>button.textContent==="Make component…")!.click();
    await new Promise(resolve=>setTimeout(resolve,0));
    const dialog=document.querySelector("dialog")!;assert.ok(dialog);
    const field=dialog.querySelector("input")!;field.value="bad.name";
    dialog.querySelector("form")!.requestSubmit();
    await new Promise(resolve=>setTimeout(resolve,0));assert.equal(field.value,"bad.name");assert.equal(field.getAttribute("aria-invalid"),"true");
    const error=document.getElementById(field.getAttribute("aria-describedby")!);
    assert.ok(error && !error.hidden);assert.match(error.textContent!,/Component name must begin with a letter/);
    assert.equal(document.activeElement,field);
    assert.equal(h.saved(),0);
    [...dialog.querySelectorAll("button")].find(button=>button.textContent==="Cancel")!.click();
    assert.equal(document.querySelector("dialog"),null);assert.equal(h.calls.some(call=>call.operation==="screens.componentExtract"),false);
  } finally {h.controller.dispose();await browser.happyDOM.abort();}
});

test("a component with one direct use captures admission without another shared confirmation",async()=>{
  const h=copyFixture();await h.controller.editUse();
  assert.deepEqual(await h.controller.reviewChanges([{label:"Text",before:"Accepted",after:"Pending"}]),{...revisions,source:"component-source"});
  assert.equal(h.saved(),0);
});

test("Choose keeps the ordinary element tree available when a component use is selected",()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=copyFixture();h.panel.step="choose";const card=document.createElement("section");
  try {assert.equal(h.controller.renderUse(card,h.panel),false);assert.equal(card.childElementCount,0);}
  finally {h.controller.dispose();void browser.happyDOM.abort();}
});

test("untouched naming and insertion Cancel preserve the original launch control and focus",async()=>{
  for(const label of ["Make component…","Add component…"]) {
    const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
    const h=fixture(),tools=document.createElement("div");document.body.append(tools);
    h.catalog.owned.push({id:"component",rootId:"component-root",path:"game/ui/guide.rpy",name:"guide",kind:"component",resolved:true,sourceRevision:"component-source"});
    h.host.redraw=()=>{tools.replaceChildren();h.controller.renderGroupTools(tools);};
    try {
      h.host.redraw();const launch=[...tools.querySelectorAll("button")].find(button=>button.textContent===label)!;
      launch.focus();launch.click();await new Promise(resolve=>setTimeout(resolve,0));
      const dialog=document.querySelector("dialog")!;assert.ok(dialog);
      [...dialog.querySelectorAll("button")].find(button=>button.textContent==="Cancel")!.click();
      assert.equal(launch.isConnected,true);assert.equal(document.activeElement===launch,true);
      assert.equal(h.saved(),0);
    } finally {h.controller.dispose();await browser.happyDOM.abort();}
  }
});

test("a replacement scope receives the shared affected-screen request after the previous render unmounts",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=copyFixture(),host=document.createElement("section");document.body.append(host);
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});const request=h.host.request;
  h.host.request=async<T>(operation:CoreOperation,payload?:Record<string,unknown>):Promise<T>=>{if(operation==="screens.componentReview")await gate;return request<T>(operation,payload);};
  try {
    h.controller.renderScope(host,h.original);host.replaceChildren();h.controller.renderScope(host,h.original);
    release();await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(host.textContent?.includes("Loading affected screens"),false);
    assert.equal(host.querySelector<HTMLElement>(".screen-component-scope")?.dataset.componentRevision,"component-source");
  } finally {h.controller.dispose();await browser.happyDOM.abort();}
});

test("an affected use opens its exact Source span after dismissing the reference dialog",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement});
  const h=copyFixture(),host=document.createElement("section");document.body.append(host);let target:unknown;
  h.host.source=value=>{assert.equal(document.querySelector("dialog")===null,true);target=value;};
  try {
    h.controller.renderScope(host,h.original);await new Promise(resolve=>setTimeout(resolve,0));
    [...host.querySelectorAll("button")].find(button=>button.textContent==="Used on 1 screen")!.click();await new Promise(resolve=>setTimeout(resolve,0));
    document.querySelector<HTMLButtonElement>("dialog .screen-component-references button")!.click();
    assert.deepEqual(target,{path:"game/ui/help.rpy",expectedRevision:"source",byteStart:20,byteEnd:30});
  } finally {h.controller.dispose();await browser.happyDOM.abort();}
});
