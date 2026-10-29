import assert from 'node:assert/strict';
import test from 'node:test';
import {driverProcess} from './phase2-driver-process.mjs';
test('ordinary driver startup/reply failures reject promptly and finish owned processes',async()=>{
 for(const source of ["process.exit(2)","console.log('{\"sessionId\":\"fixture\"}');process.stdin.once('data',()=>process.exit(3))","console.log('invalid JSON')","setInterval(()=>{},1000)"]){
  const driver=driverProcess(process.execPath,['-e',source],{timeout:1500});
  try{
   if(source.includes('sessionId')){assert.equal((await driver.next()).sessionId,'fixture');await assert.rejects(driver.request({synthetic:true}),/Driver exit/);}
   else await assert.rejects(driver.next());
  }finally{await assert.rejects(driver.stop());}
 }
 const missing=driverProcess('/definitely-missing-loomlight-fixture',[],{timeout:1500});
 await assert.rejects(missing.next(),/ENOENT/);await assert.rejects(missing.stop(),/ENOENT/);
});
test('fixture construction has its own bound while ordinary replies keep their deadline',async()=>{
 const driver=driverProcess(process.execPath,['-e',`setTimeout(()=>console.log('{"ready":true}'),150);process.stdin.on('data',()=>{});`],{timeout:50,startupTimeout:2000});
 try{
  assert.equal((await driver.next()).ready,true);
  await assert.rejects(driver.request({synthetic:true}),/reply deadline exceeded/);
 }finally{await assert.rejects(driver.stop());}
 assert.equal(driver.exitStatus().exitObserved,true);
});
