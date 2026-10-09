import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { Script } from "node:vm";

const source=readFileSync(new URL("../../src-tauri/src/reference_library_probe.js",import.meta.url),"utf8");
test("native reference probe handles refusal codes and semantic equality without overriding Tauri",()=>{
  const setup=source.split("\n").filter(line=>/^ const (mutationReply|canonical|same)=/.test(line)).join("\n");
  const internal={};Object.defineProperty(internal,"invoke",{value:()=>{},writable:false});
  const context:any={window:{__TAURI_INTERNALS__:internal},Error,Object};
  new Script(setup+"\nglobalThis.rules={mutationReply,same};").runInNewContext(context);
  context.rules.mutationReply({ok:true});
  const failure={ok:false,error:{code:"HISTORY_BOUNDARY"}};
  assert.throws(()=>context.rules.mutationReply(failure),(error:any)=>error.code==="HISTORY_BOUNDARY");
  context.rules.mutationReply(failure,"HISTORY_BOUNDARY");
  assert.throws(()=>context.rules.mutationReply({ok:true},"INVALID_REFERENCE"),(error:any)=>error.code==="PROBE_EXPECTED_REFUSAL");
  assert.equal(source.includes("window.__TAURI_INTERNALS__.invoke="),false);
  assert.equal(context.rules.same([{target:{type:"card",id:"a"},revision:"r"}],[{revision:"r",target:{id:"a",type:"card"}}]),true);
  assert.equal(context.rules.same([1,2],[2,1]),false);assert.equal(context.rules.same({a:"r"},{a:"changed"}),false);
});
