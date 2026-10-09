import test from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { openStudioRequest } from '../src/studio-request-ui.ts';
const settle=()=>new Promise(r=>setTimeout(r,20));
test('explicit synthetic send, cancel and late responses never cross the renderer guard',async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];let resolveStatus:((v:unknown)=>void)|undefined;
  const pending={requestId:'owned',state:'sending',done:false,httpStatus:null,elapsedMs:1,estimatedInput:200,margin:128,maximumResponse:1024,message:null,completion:null};
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{calls.push(request);const result=(v:unknown)=>({protocolVersion:1,requestId:request.requestId,ok:true,value:v});
    if(request.operation==='ai.profiles')return result({token:'immutable',profiles:[{profileId:'profile',credentialStatus:'configured',disabled:false,settings:{label:'Synthetic',endpoint:'http://127.0.0.1:46082/v1',model:'synthetic-model',contextBudget:4096,maximumResponse:1024}}]});
    if(request.operation==='ai.sendSynthetic')return result(pending);
    if(request.operation==='ai.cancelRequest')return result({...pending,state:'cancelled',done:true,message:'Client request cancelled; server computation may continue.'});
    if(request.operation==='ai.requestStatus')return new Promise(r=>{resolveStatus=v=>r(result(v));});
    throw Error('Unexpected call');
  }}});
  const button=(text:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===text)!;
  try{openStudioRequest('session');await settle();assert.deepEqual(calls.map(c=>c.operation),['ai.profiles']);assert.equal(document.querySelector('[aria-modal="true"]'),null);
    button('Send synthetic request').click();await settle();assert.deepEqual(calls[1]!.payload,{token:'immutable',profileId:'profile',sessionId:'session',timeoutSeconds:600});assert.equal(button('Send synthetic request').disabled,true);assert.equal(button('Cancel request').disabled,false);
    button('Cancel request').click();await settle();assert.match(document.querySelector('.studio-request-status')!.textContent!,/cancelled/);
    resolveStatus!({...pending,state:'completed',done:true,completion:{text:'LATE MUST NOT APPEAR',usage:{},finishReason:'stop'}});await settle();assert.equal(document.querySelector('.studio-request-output')!.textContent,'');assert.match(document.querySelector('.studio-request-status')!.textContent!,/cancelled/);
    assert.equal(calls.filter(c=>c.operation==='ai.sendSynthetic').length,1);button('Close request panel').click();await settle();assert.equal(document.querySelector('.studio-request'),null);
  }finally{await browser.happyDOM.close();}
});
test('completion renders literally and missing usage stays unknown',async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string}})=>({protocolVersion:1,requestId:request.requestId,ok:true,value:request.operation==='ai.profiles'?{token:'snapshot',profiles:[{profileId:'owned',credentialStatus:'configured',disabled:false,settings:{label:'Synthetic',endpoint:'http://127.0.0.1:46082/v1',model:'synthetic-model',contextBudget:4096,maximumResponse:1024}}]}:{requestId:'owned',state:'completed',done:true,httpStatus:200,elapsedMs:12,estimatedInput:200,margin:128,maximumResponse:1024,message:null,completion:{text:'<img src=x onerror=bad()>',model:'synthetic-model',finishReason:'stop',responseBytes:200,usage:{promptTokens:null,completionTokens:null,totalTokens:null,reasoningTokens:null}}}})}});
  try{openStudioRequest(null);await settle();[...document.querySelectorAll('button')].find(b=>b.textContent==='Send synthetic request')!.click();await settle();assert.match(document.querySelector('.studio-request-status')!.textContent!,/Completed.*HTTP 200.*usage input unknown, output unknown, total unknown, reasoning unknown/);assert.equal(document.querySelector('.studio-request-output')!.textContent,'<img src=x onerror=bad()>');assert.equal(document.querySelector('.studio-request-output img'),null);[...document.querySelectorAll('button')].find(b=>b.textContent==='Close request panel')!.click();await settle();}finally{await browser.happyDOM.close();}
});
