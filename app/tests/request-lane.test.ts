import assert from "node:assert/strict";
import test from "node:test";
import { RequestLane } from "../src/request-lane.js";
test("Source retention, SDK discovery and runtime submission are ordered while Stop stays independent",async()=>{
  const lane=new RequestLane(),calls:string[]=[];
  let release!:()=>void;
  const held=lane.run("project.status",async()=>{calls.push("read");await new Promise<void>(resolve=>{release=resolve;});throw new Error("read failed");});
  const failure=assert.rejects(held,/read failed/);
  const write=lane.run("source.updateDraft",async()=>{calls.push("write");return 1;});
  const sdk=lane.run("sdk.discover",async()=>{calls.push("sdk");});
  const prepare=lane.run("runtime.prepare",async()=>{calls.push("prepare");});
  await Promise.resolve();
  await lane.run("runtime.stop",async()=>{calls.push("stop");});
  assert.deepEqual(calls,["read","stop"]);
  release();await failure;assert.equal(await write,1);
  await sdk; await prepare;
  assert.deepEqual(calls,["read","stop","write","sdk","prepare"]);
});
