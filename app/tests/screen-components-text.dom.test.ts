import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { ScreenText } from "../src/screen-text.ts";
import { ScreenLayoutEditor } from "../src/screen-layout.ts";
import type { CompositionCommand, CompositionView } from "../src/screen-composition.ts";

test("component text draft keeps its original target until verified transfer and then uses the inspected revision",async()=>{
  const browser=new Window();
  Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLDetailsElement:browser.HTMLDetailsElement,IntersectionObserver:browser.IntersectionObserver});
  const make=(id:string,revision:string):CompositionView=>{
    const node={id,kind:"text",literal:"Accepted",span:{start:30,end:80},parentStart:null,layout:{},properties:[],protected:[],textProperties:{values:{size:20},blocked:{}}};
    return {document:{path:`game/ui/${id}.rpy`,revision,partial:false,screens:[{name:id,nodes:[node]}]},screenId:id,screenName:id,nodes:[node],selected:node,step:"design",busy:false};
  };
  const original=make("original","original-source"),fresh=make("copy","inspected-copy-source");let view=original;
  for(const target of [original,fresh])target.selected.style={name:"body",error:null};
  let styleRevision="before-copy",changedStyle=false;
  const commits:{command:CompositionCommand;revision:string}[]=[];let blocked=true,cancelled=0;
  const layout=new ScreenLayoutEditor({view:()=>undefined,commit:async()=>{},preview:()=>{},note:()=>{},select:()=>{}});
  const text=new ScreenText({view:()=>view,styles:()=>({revision:styleRevision,definitions:[{name:"body",path:"game/ui/styles.rpy",kind:"text",values:{size:changedStyle?21:20},uses:[],error:null}]}),current:()=>true,writeBlocked:()=>blocked,cancelComponentCopy:()=>{cancelled++;},request:async<T>()=>({assets:[]} as T),coordinate:task=>task(),inspect:async()=>view.document,
    commit:async(command,base)=>{commits.push({command,revision:base.revision});},redraw:()=>render(),preview:()=>{},source:()=>{},saved:()=>{},layoutTools:()=>{},order:()=>{},note:()=>{}},layout);
  const card=document.createElement("section");document.body.append(card);
  function render(){text.unmount();card.replaceChildren();text.render(card,view);}
  const fill=(value:string)=>{const input=card.querySelector("textarea")!;input.value=value;input.dispatchEvent(new window.Event("input"));};
  try {
    render();assert.equal(text.captureComponentDrafts(original).length,0);
    const [participant]=text.captureComponentDrafts(original,true);assert.ok(participant);
    styleRevision="after-copy";
    fill("First typed after Copy failed");participant.cancel();assert.equal(text.hasNodeDraft("original","original"),false);
    render();fill("Pending");
    assert.equal(card.querySelector("textarea")!.readOnly,false,"Recovery still permits typing");
    assert.equal(card.querySelector<HTMLButtonElement>("[data-text-apply]")!.disabled,true);
    participant.validate();
    assert.throws(()=>participant.prepare(fresh,new Map()),/copied/);
    assert.equal(text.hasNodeDraft("original","original"),true);
    fill("Latest pending input");
    card.querySelector("textarea")!.focus();card.querySelector("textarea")!.setSelectionRange(2,7);
    changedStyle=true;assert.throws(()=>participant.prepare(fresh,new Map([["original","copy"]])),/Style/);changedStyle=false;
    const attach=participant.prepare(fresh,new Map([["original","copy"]]));
    assert.equal(text.hasNodeDraft("original","original"),true);assert.equal(text.hasNodeDraft("copy","copy"),false);
    attach();view=fresh;render();
    assert.equal(text.hasNodeDraft("original","original"),false);assert.equal(card.querySelector("textarea")!.value,"Latest pending input");
    assert.equal(document.activeElement===card.querySelector("textarea"),true);assert.deepEqual([card.querySelector("textarea")!.selectionStart,card.querySelector("textarea")!.selectionEnd],[2,7]);
    blocked=false;text.sync();
    card.querySelector<HTMLButtonElement>("[data-text-apply]")!.click();await new Promise(resolve=>setTimeout(resolve,0));
    assert.equal(commits[0]?.revision,"inspected-copy-source");
    assert.deepEqual(commits[0]?.command,{type:"formatText",nodeId:"copy",values:{text:"Latest pending input"}});
    blocked=true;text.sync();card.querySelector<HTMLButtonElement>("[data-text-cancel]")!.click();
    assert.equal(cancelled,1);assert.equal(text.hasNodeDraft("copy","copy"),true,"Pending-copy Cancel delegates all participant cancellation to its workflow owner");
  } finally {text.dispose();await browser.happyDOM.abort();}
});
