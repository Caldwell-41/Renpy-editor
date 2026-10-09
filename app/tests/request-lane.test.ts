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
  const media=lane.run("media.present",async()=>{calls.push("media");});
  const prepare=lane.run("runtime.prepare",async()=>{calls.push("prepare");});
  await Promise.resolve();
  await lane.run("runtime.stop",async()=>{calls.push("stop");});
  assert.deepEqual(calls,["read","stop"]);
  release();await failure;assert.equal(await write,1);
  await sdk;await media; await prepare;
  assert.deepEqual(calls,["read","stop","write","sdk","media","prepare"]);
});

test("workspace observations finish before early Source navigation uses the shared service",async()=>{
  for(const operation of ["scene.list","authoring.list","flow.list"] as const){
    const lane=new RequestLane(),calls:string[]=[];
    let release!:()=>void;
    const observation=lane.run(operation,async()=>{calls.push(operation);await new Promise<void>(resolve=>{release=resolve;});});
    await Promise.resolve();
    const source=lane.run("source.list",async()=>{calls.push("source.list");});
    await Promise.resolve();
    try{assert.deepEqual(calls,[operation],"Source must not contend with an unfinished workspace observation");}
    finally{release();await observation;await source;}
    assert.deepEqual(calls,[operation,"source.list"]);
  }
});

test("Close Project waits for a saved-state observation and dispatches exactly once",async()=>{
  const lane=new RequestLane(),calls:string[]=[];let release!:()=>void;let checkedOut=false;
  const observation=lane.run("project.status",async()=>{checkedOut=true;calls.push("status");await new Promise<void>(resolve=>{release=resolve;});checkedOut=false;});
  await Promise.resolve();
  const close=lane.run("project.close",async()=>{calls.push("close");if(checkedOut)throw new Error("RUNTIME_BUSY");return "closed";});
  // Observe failure immediately without leaving an unhandled rejected promise.
  const outcome=close.then(value=>({value}),error=>({error}));
  try{await Promise.resolve();assert.deepEqual(calls,["status"],"Close must wait for the host's checked-out service, without replaying the write");}
  finally{release();await observation;await outcome;}
  assert.equal(await close,"closed");assert.deepEqual(calls,["status","close"]);
});

test("reference observations and saves share the persistence lane without replay",async()=>{
 const lane=new RequestLane(),calls:string[]=[];let release!:()=>void;
 const status=lane.run("project.status",async()=>{calls.push("status");await new Promise<void>(r=>{release=r;});});
 await Promise.resolve();const refs=lane.run("references.list",async()=>{calls.push("references.list");});
 const save=lane.run("references.apply",async()=>{calls.push("references.apply");});
 await Promise.resolve();try{assert.deepEqual(calls,["status"]);}finally{release();await status;await refs;await save;}
 assert.deepEqual(calls,["status","references.list","references.apply"]);
});
