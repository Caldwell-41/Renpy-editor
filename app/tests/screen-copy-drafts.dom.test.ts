import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreenImages } from "../src/screen-images.js";
import { ScreenLayoutEditor } from "../src/screen-layout.js";
import type { CompositionView } from "../src/screen-composition.js";

function fixture() {
  const browser = new Window();
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLDetailsElement:browser.HTMLDetailsElement});
  const original: CompositionView = {document:{path:"game/ui/shared.rpy",revision:"accepted",partial:false,screens:[]},screenId:"shared",screenName:"shared",nodes:[],selected:null!,step:"design",busy:false};
  original.nodes = [{id:"root",kind:"screen",literal:null,layout:{},span:{start:0,end:80},parentStart:null,properties:[],protected:[]},
    {id:"group",kind:"vbox",literal:null,layout:{},span:{start:20,end:80},parentStart:0,properties:[],protected:[],numericLayout:{values:{spacing:{unit:"pixels",value:8}},blocked:{}}}];
  original.selected = original.nodes[1]!; original.document.screens=[{name:"shared",nodes:original.nodes}];
  let current=original;
  const editor=new ScreenLayoutEditor({view:()=>({document:current.document,screen:current.screenName,node:current.selected,nodes:current.nodes,busy:false,otherDraft:false}),commit:async()=>{throw Error("Copy must not apply layout");},preview:()=>{},note:()=>{},select:()=>{}});
  const host=browser.document.createElement("section");browser.document.body.append(host);editor.render(host as unknown as HTMLElement);
  const edit=(value:string)=>{const input=host.querySelector('[data-layout-field="spacing"]') as unknown as HTMLInputElement;assert.ok(input);input.value=value;input.dispatchEvent(new browser.Event("input",{bubbles:true}) as unknown as Event);};
  const fresh=structuredClone(original);fresh.screenId="copy";fresh.screenName="copy";fresh.document.path="game/ui/copy.rpy";fresh.document.revision="copied";fresh.nodes[0]!.id="new-root";fresh.nodes[1]!.id="new-group";fresh.selected=fresh.nodes[1]!;fresh.document.screens=[{name:"copy",nodes:fresh.nodes}];
  return {editor,original,fresh,edit,getView:()=>current,setView:(view:CompositionView)=>{current=view;},close:()=>browser.happyDOM.abort()};
}

test("layout copy transfer retains latest input until all fresh targets are verified",async()=>{
  const f=fixture();try {
    f.edit("12");const transfer=f.editor.captureCopyDraft(f.original)!;transfer.validate();
    assert.throws(()=>transfer.prepare(f.fresh,new Map()),/copied|target/i);
    assert.equal(f.editor.hasNodeDraft(f.original.document,"shared",f.original.selected),true);
    f.edit("14");const commit=transfer.prepare(f.fresh,new Map([["group","new-group"]]));
    assert.equal(f.editor.hasNodeDraft(f.original.document,"shared",f.original.selected),true);
    f.setView(f.fresh);commit();
    assert.equal(f.editor.hasNodeDraft(f.original.document,"shared",f.original.selected),false);
    assert.deepEqual(f.editor.currentDraft(true)?.values,{spacing:{unit:"pixels",value:14}});
    assert.equal(f.editor.currentDraft()?.document.revision,"copied");
  } finally {await f.close();}
});

test("invalid layout refuses copy transfer; Cancel discards only the captured draft",async()=>{
  const f=fixture();try {
    f.edit("-1");const transfer=f.editor.captureCopyDraft(f.original)!;
    assert.throws(()=>transfer.validate(),/finite|needs/i);
    assert.equal(f.editor.hasDraft(),true);transfer.cancel();assert.equal(f.editor.hasDraft(),false);
  } finally {await f.close();}
});


test("image copy transfer keeps pending size and verifies the copied node and parent",async()=>{
  const f=fixture();const host=document.createElement("section");document.body.append(host);
  for (const view of [f.original,f.fresh]) {
    view.selected.kind="image";view.selected.literal="images/seal.png";
    view.selected.numericLayout={values:{xsize:{unit:"pixels",value:160},ysize:{unit:"pixels",value:80}},blocked:{}};
  }
  const images=new ScreenImages({view:f.getView,current:()=>true,request:async<T>(operation:string):Promise<T>=>{
    if(operation==="authoring.list")return {assets:[{id:"seal",kind:"uiImage",displayName:"Seal",relativePath:"game/images/seal.png",sha256:"asset",status:"available",naturalWidth:160,naturalHeight:80}]} as T;
    throw Error("No passive media needed for draft transfer");
  },coordinate:task=>task(),commit:async()=>{throw Error("Copy must not apply image");},redraw:()=>{},preview:()=>{},note:()=>{},select:()=>{},source:()=>{},saved:()=>{},layoutTools:()=>{},order:()=>{}},f.editor);
  try {
    await images.refreshAssets();images.render(host,f.original);
    const width=host.querySelector<HTMLInputElement>('[data-image-field="width"]')!;assert.ok(width);width.value="320";width.dispatchEvent(new window.Event("input",{bubbles:true}));
    const transfer=images.captureCopyDraft(f.original)!;transfer.validate();
    assert.throws(()=>transfer.prepare(f.fresh,new Map([["group","new-group"]])),/parent|target/i);
    assert.equal(images.hasDraft(),true);
    const commit=transfer.prepare(f.fresh,new Map([["root","new-root"],["group","new-group"]]));
    f.setView(f.fresh);commit();images.render(host,f.fresh);
    assert.equal(host.querySelector<HTMLInputElement>('[data-image-field="width"]')!.value,"320");
    assert.equal(host.querySelector<HTMLInputElement>('[data-image-field="height"]')!.value,"160");
    images.captureCopyDraft(f.fresh)!.cancel();assert.equal(images.hasDraft(),false);
  } finally {images.dispose();await f.close();}
});
