import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { renderSceneAuthoring, type SceneWorkspace } from "../src/scene-ui.js";
import { storyFixture } from "./story-controls-fixture.js";

test("imported arithmetic opens as an equation and commits the retained formula through Story", async () => {
  const browser = new Window({url:"http://tauri.localhost"});
  Object.assign(globalThis, {window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,KeyboardEvent:browser.KeyboardEvent});
  document.body.innerHTML='<main></main><aside></aside>';
  const base=storyFixture();
  const model:SceneWorkspace={...base,authoringRevision:"authoring",scenes:[{...base.scenes[0]!,beats:[{id:"arithmetic",byteStart:0,byteEnd:30,protected:false,payload:{type:"setVariable",variableId:"trust",value:{operation:"add",operand:"(trust + 2) * 3"}}}]}]};
  let committed:unknown;
  const dispose=renderSceneAuthoring(document.querySelector("main")!,document.querySelector("aside")!,model,{
    resolution:{width:1280,height:720},present:async()=>{throw Error("no media");},status:()=>{},
    apply:async(command,expected)=>{committed={command,expected};throw Error("SOURCE_CONFLICT");},
  },"arithmetic");
  const formula=document.querySelector<HTMLInputElement>('[aria-label="Formula"]');
  assert.ok(formula,"a supported formula must have a formula field");
  assert.equal(formula.value,"(trust + 2) * 3");
  assert.match(document.querySelector('[aria-label="Calculation"]')!.textContent!,/trust.*\+=/);
  formula.dispatchEvent(new KeyboardEvent("keydown", {key:"Enter",ctrlKey:true,bubbles:true}));
  await new Promise(r=>setTimeout(r,0));
  assert.deepEqual(committed,{command:{type:"updateBodyBeat",sceneId:"one",expectedSourceRevision:"source",beatId:"arithmetic",expectedBody:{type:"root"},beat:{type:"setVariable",variableId:"trust",value:{operation:"add",operand:"(trust + 2) * 3"}}},expected:{projectRevision:"project",sourceMapRevision:"map",authoringRevision:"authoring"}});
  assert.equal(formula.value,"(trust + 2) * 3");assert.ok(formula.isConnected&&!formula.disabled);
  dispose();await browser.happyDOM.close();
});
