// Bounded JSON-line ownership for the synthetic native integration driver.
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
export function driverProcess(executable,args,{timeout=15000}={}){
 const child=spawn(executable,args,{stdio:['pipe','pipe','inherit']});
 const lines=createInterface({input:child.stdout}),queued=[],waiters=[];
 let failure,finished,exitError,lane=Promise.resolve(),resolveExit;
 const exited=new Promise(r=>{resolveExit=r;});
 const fail=error=>{failure??=error;for(const w of waiters.splice(0)){clearTimeout(w.timer);w.reject(failure);}};
 child.on('error',error=>{fail(error);finished={error};resolveExit(finished);});
 child.stdin.on('error',fail);
 child.on('exit',(code,signal)=>{finished={code,signal};exitError=Error(`Driver exit ${code} (${signal??'no signal'})`);fail(exitError);resolveExit(finished);});
 lines.on('line',line=>{
  try{const value=JSON.parse(line);if(waiters.length){const w=waiters.shift();clearTimeout(w.timer);w.resolve(value);}else queued.push(value);}
  catch(error){fail(error);child.kill();}
 });
 const next=()=>{
  if(queued.length)return Promise.resolve(queued.shift());
  if(failure)return Promise.reject(failure);
  return new Promise((resolve,reject)=>{
   const w={resolve,reject,timer:setTimeout(()=>{fail(Error('Driver reply deadline exceeded'));child.kill();},timeout)};
   waiters.push(w);
  });
 };
 const request=value=>{
  const pending=lane.then(async()=>{
   if(failure)throw failure;
   const response=next();child.stdin.write(JSON.stringify(value)+'\n');return response;
  });lane=pending.catch(()=>{});return pending;
 };
 const boundedExit=async()=>{
  let timer;
  const value=await Promise.race([exited,new Promise(r=>{timer=setTimeout(()=>r(null),timeout);})]);clearTimeout(timer);return value;
 };
 const stop=async()=>{
  if(!finished)child.stdin.end();
  let result=finished??await boundedExit();
  if(!result){child.kill();result=await boundedExit();}
  if(!result){child.kill('SIGKILL');result=await boundedExit();}
  lines.close();
  if(!result)throw Error('Driver did not exit within cleanup deadline');
  if(failure&&failure!==exitError)throw failure;
  if(result.error||result.code!==0)throw result.error??Error(`Driver cleanup exit ${result.code} (${result.signal??'no signal'})`);
 };
 return {next,request,stop};
}
