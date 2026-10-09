import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { emptyReference, renderReferenceLibrary, type ReferenceWorkspace, type ReferenceCommand } from "../src/reference-ui.js";

const tick=async()=>{await new Promise(r=>setTimeout(r,0));};
test("reference forms retain refused drafts, serialize saves and preserve nested link extensions",async()=>{
  const browser=new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLSelectElement:browser.HTMLSelectElement,Event:browser.Event});
  document.body.innerHTML='<header></header><main></main>';
  const content=emptyReference("card");content.title="Bec";content.description="Saved text";content.links=[{type:"lore",id:"lost",futureLink:{note:"keep"}} as unknown as typeof content.links[number]];
  content.relationships=[{target:{type:"card",id:"old",futureTarget:{note:"keep"}},text:"Saved relationship"} as unknown as NonNullable<typeof content.relationships>[number]];
  const record={id:"record",revisionCounter:1,currentRevisionId:"revision",approvedRevisionId:"revision",revisions:[{id:"revision",number:1,status:"approved",content,createdAt:"2026-10-09T00:00:00Z",reviewedAt:"2026-10-09T00:00:00Z"}]};
  const model:ReferenceWorkspace={document:{schemaVersion:1,projectId:"project",cards:[record],loreEntries:[]},revision:"token",diagnostic:null,entities:[{kind:"card",id:"old",title:"Old target",revision:null},{kind:"card",id:"new",title:"New target",revision:null}],issues:[],canUndo:true,canRedo:false};
  const commands:ReferenceCommand[]=[];let resolve!:(v:ReferenceWorkspace)=>void;let reject!:(e:Error)=>void;
  let leave=false;const controller=renderReferenceLibrary(document.querySelector("main")!,"card",model,{creationHost:document.querySelector("header")!,current:()=>true,guard:async()=>leave,status:()=>{},load:async()=>model,apply:async(command,expected)=>{assert.equal(expected,"token");commands.push(command);return new Promise((a,b)=>{resolve=a;reject=b;});}});
  const enter=(name:string,value:string)=>{const input=document.querySelector<HTMLInputElement|HTMLTextAreaElement>(`[name="${name}"]`)!;input.value=value;input.dispatchEvent(new window.Event("input",{bubbles:true}));};
  const click=(label:string)=>{const b=[...document.querySelectorAll("button")].find(b=>b.textContent===label);assert.ok(b,label);b.click();};
  assert.equal([...document.querySelectorAll("button")].some(b=>["Edit","Approve","Reject","Supersede"].includes(b.textContent!)),false);
  const relationshipTarget=[...document.querySelectorAll("label")].find(l=>l.querySelector("span")?.textContent==="Related character or entry")!.querySelector("select")!;relationshipTarget.value="card:new";relationshipTarget.dispatchEvent(new window.Event("change"));
  enter("description","Draft café 雪");const first=controller.save();assert.equal(controller.isBusy(),true);await controller.save();assert.equal(commands.length,1);
  assert.ok(commands[0]?.type==="save");assert.deepEqual(commands[0].fields.links,content.links);assert.deepEqual(commands[0].fields.relationships?.[0]?.target,{type:"card",id:"new",futureTarget:{note:"keep"}});assert.equal(document.querySelector<HTMLButtonElement>(".reference-details button")!.disabled,true);
  reject(new Error("External reference changes detected"));await first;assert.equal(document.querySelector<HTMLTextAreaElement>('[name="description"]')!.value,"Draft café 雪");assert.equal(document.querySelector(".reference-editor")!.getAttribute("data-unsubmitted"),"true");
  click("Discard changes");await tick();assert.equal(document.querySelector<HTMLTextAreaElement>('[name="description"]')!.value,"Draft café 雪");leave=true;click("Discard changes");await tick();assert.equal(document.querySelector<HTMLTextAreaElement>('[name="description"]')!.value,"Saved text");
  enter("description","Another draft");click("All character cards");await tick();assert.equal(document.querySelector(".reference-library")!.getAttribute("data-browsing"),"true");assert.equal(document.querySelector(".reference-editor")!.hasAttribute("data-unsubmitted"),false);
  click("Bec");await tick();enter("title","");await controller.save();assert.equal(commands.length,1);assert.equal(document.activeElement?.getAttribute("name"),"title");
  enter("title","Bec updated");const next=controller.save();resolve({...model,revision:"saved-token",document:{...model.document!,cards:[{...record,revisions:[{...record.revisions[0]!,content:{...content,title:"Bec updated"}}]}]}});await next;assert.equal(document.querySelector(".reference-editor")!.hasAttribute("data-unsubmitted"),false);assert.equal(document.activeElement?.getAttribute("name"),"title");
  controller.dispose();assert.equal(document.querySelector("header")!.children.length,0);await browser.happyDOM.close();
});
