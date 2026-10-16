import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { mountStudioSettings } from "../src/ai-settings-ui.ts";

function waitFor(predicate:()=>boolean):Promise<void> {
  if(predicate())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const observer=new window.MutationObserver(()=>{if(predicate()){clearTimeout(deadline);observer.disconnect();resolve();}});
    const deadline=setTimeout(()=>{observer.disconnect();reject(Error("Expected Settings state was not reached"));},2000);
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,characterData:true});
  });
}
const settled=()=>waitFor(()=>document.querySelector<HTMLElement>(".studio-settings")?.dataset.busy==="false");


test("Keychain access error remains visible without retry, discovery or secret IPC", async () => {
  const browser = new Window();
  Object.assign(globalThis, { window: browser, document: browser.document });
  const calls: {operation:string; payload:Record<string,unknown>}[] = [];
  const message = "Keychain access needs attention. Saved references are retained.";
  let denied = true;
  Object.assign(browser, {__TAURI_INTERNALS__: {invoke: async (_:string, {request}:{request:{requestId:string; operation:string; payload:Record<string,unknown>}}) => {
    calls.push(request);
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:{token:"saved",cleanup:[],profiles:[{
      profileId:"saved-profile",revision:1,disabled:false,credentialStatus:denied?"unavailable":"configured",credentialError:denied?message:null,
      settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024},discovery:null,
    }]}};
  }}});
  try {
    document.body.innerHTML = "<main></main><footer></footer>";
    mountStudioSettings(document.querySelector("main")!, document.querySelector("footer")!);
    await settled();
    assert.equal(document.querySelector('[role="status"]')?.textContent, message);
    const button = (label:string) => [...document.querySelectorAll("button")].find(b => b.textContent === label)!;
    assert.equal(button("Connect").disabled, true);
    assert.deepEqual(calls.map(c => c.operation), ["ai.profiles"]);
    denied = false;
    button("Reload profiles").click();
    await settled();
    assert.equal(button("Connect").disabled, false);
    assert.deepEqual(calls.map(c => c.operation), ["ai.profiles", "ai.profiles"]);
    assert.deepEqual(calls.map(c => c.payload), [{}, {}]);
    assert.equal(document.querySelectorAll('input[type="password"]').length, 0);
  } finally { await browser.happyDOM.close(); }
});

test("file recovery Retry is read-only, deferred cleanup retained and saved-pending never asks to save again", async () => {
  const browser = new Window(); Object.assign(globalThis, {window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];
  let status="unavailable",saveStatus:string|undefined;
  const message="Your saved API key couldn't be read. Re-enter it to restore AI access.";
  const snapshot=()=>({token:"owned",storageNotice:"Temporary Mac development storage: same-login software may decrypt keys.",saveStatus,cleanup:[{profileId:"legacy",deferred:true}],profiles:[{profileId:"file",revision:1,disabled:false,credentialStatus:status,credentialError:status==="configured"?null:message,discovery:null,settings:{label:"Retained",endpoint:"http://127.0.0.1:8888/v1",model:"synthetic",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024}}]});
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    calls.push(request); if(request.operation==="ai.enterCredential"){status="configured";saveStatus="API key saved; cleanup pending";}
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:snapshot()};
  }}});
  const button=(label:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===label)!;
  const settle=settled;
  try {
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settle();
    assert.equal(button("Connect").disabled,true);assert.equal(button("Re-enter API key").disabled,false);
    assert.equal(document.body.textContent!.includes("cleanup deferred"),true);assert.equal([...document.querySelectorAll("button")].some(b=>b.textContent==="Retry owned credential cleanup"),false);
    assert.equal(button("Retry loading profiles").hidden,true);button("Reload profiles").click();await settle();assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.profiles"]);assert.deepEqual(calls[1]!.payload,{});
    status="configured";saveStatus="API key saved; cleanup pending";button("Reload profiles").click();await settle();assert.equal(document.querySelector('[role="status"]')!.textContent,"API key saved; cleanup pending");
    assert.equal(button("Connect").disabled,false);assert.equal(button("Replace credential…").disabled,false);assert.deepEqual(calls[2]!.payload,{});
    assert.equal(document.querySelectorAll('input[type="password"]').length,0);assert.equal(calls.some(c=>c.operation==="ai.discover"||c.operation==="ai.cleanup"),false);
    status="unsupported";saveStatus=undefined;button("Reload profiles").click();await settle();assert.equal(button("Enter credential…").disabled,true);
  }finally{await browser.happyDOM.close();}
});

test("draft key entry failure and cancel preserve saved profile fields and keep raw keys out of IPC",async()=>{
  const f=await settingsFixture([fixtureProfile("saved","Retained")]);const before=structuredClone(f.store.profiles);
  try{
    f.store.failKey=true;f.button("Replace credential…").click();await settled();assert.match(document.querySelector('.studio-connect')!.textContent!,/Native entry refused/);assert.equal(f.input("Profile name").value,"Retained");assert.deepEqual(f.store.profiles,before);
    f.store.failKey=false;f.store.cancelEntry=true;f.button("Replace credential…").click();await settled();assert.deepEqual(f.store.profiles,before);
    assert.equal(document.querySelectorAll('input[type="password"]').length,0);assert.equal(f.calls.some(c=>JSON.stringify(c.payload).includes("fixture-secret")),false);
    assert.equal(f.calls.some(c=>["ai.saveProfile","ai.saveConnection","ai.discover","ai.testCompatibility"].includes(c.operation)),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("confirmed connected-profile save with failed reload disables writes until read-only retry",async()=>{
  const f=await settingsFixture([]);
  try{
    f.button("Enter credential…").click();await settled();f.button("Connect").click();await settled();f.edit("Model ID","fixture");f.store.failReadAfterSave=true;
    f.button("Save profile").click();await settled();assert.match(document.querySelector('[role="status"]')!.textContent!,/Profile saved.*could not be reloaded/);
    assert.equal(f.button("Save profile").disabled,true);assert.equal(f.button("Retry loading profiles").hidden,false);assert.equal(f.button("Enter credential…").disabled,true);
    const writes=f.calls.filter(c=>c.operation==="ai.saveConnection").length;f.store.failRead=false;f.button("Retry loading profiles").click();await settled();assert.equal(f.input("Model ID").value,"fixture");assert.equal(f.calls.filter(c=>c.operation==="ai.saveConnection").length,writes);assert.equal(f.calls.at(-1)!.operation,"ai.profiles");
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("sampling defaults, explicit save, invalid refusal and saved reload never send inference", async () => {
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];
  let settings={label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024} as Record<string,unknown>;
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    calls.push(request);if(request.operation==="ai.saveProfile")settings={...request.payload.settings as Record<string,unknown>};
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:{token:"saved",cleanup:[],profiles:[{profileId:"saved-profile",revision:1,disabled:false,credentialStatus:"configured",settings,discovery:null}]}};
  }}});
  const settle=settled;
  try{
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settle();
    const input=(label:string)=>document.getElementById([...document.querySelectorAll("label")].find(n=>n.textContent===label)!.htmlFor) as HTMLInputElement;
    const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;
    assert.equal(input("Temperature").value,"1");assert.equal(input("Top-p").value,"0.95");
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles"]);
    input("Temperature").value="0.8";input("Top-p").value="0.9";input("Temperature").dispatchEvent(new window.Event("input",{bubbles:true}));
    assert.equal(button("Connect").disabled,false);button("Save profile").click();await settle();
    assert.equal((calls[1]!.payload.settings as Record<string,unknown>).temperature,0.8);
    assert.equal((calls[1]!.payload.settings as Record<string,unknown>).topP,0.9);
    button("Reload profiles").click();await settle();assert.equal(input("Temperature").value,"0.8");assert.equal(input("Top-p").value,"0.9");
    for(const bad of ["","-0.1","1.1","NaN"]){input("Top-p").value=bad;button("Save profile").click();await settle();assert.equal(calls.length,3);}
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.saveProfile","ai.profiles"]);
  }finally{await browser.happyDOM.close();}
});

test("setup preflight is explicit, previews synthetic body and reloads configuration-bound readiness", async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];let ready=false;
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    calls.push(request);
    const value=request.operation==="ai.testCompatibility"?{requestId:"test-id"}:request.operation==="ai.requestStatus"?(ready=true,{done:true,state:"completed",message:null}):{token:ready?"tested":"untested",cleanup:[],profiles:[{profileId:"saved",revision:1,disabled:false,credentialStatus:"configured",compatibilityState:ready?"ready":"untested",compatibilityPayload:'{"messages":[{"content":"synthetic"}],"enable_tools":false}',settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024},discovery:null}]};
    return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }}});
  try{
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();
    const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles"]);assert(document.querySelector('details pre')!.textContent!.includes('"enable_tools":false'));
    button("Test response format").click();await settled();
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.testCompatibility","ai.requestStatus","ai.profiles"]);
    assert.deepEqual(calls[1]!.payload,{token:"untested",profileId:"saved",sessionId:null,timeoutSeconds:60});
    assert(document.querySelector('[role="status"]')!.textContent!.includes("Response format tested"));assert(button("Cancel response format test").disabled);
  }finally{await browser.happyDOM.close();}
});

test("failed setup probe remains untested without discovery, automatic retry or proposal",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});const calls:string[]=[];
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string}})=>{
    calls.push(request.operation);const value=request.operation==="ai.testCompatibility"?{requestId:"test-id"}:request.operation==="ai.requestStatus"?{done:true,state:"failed",message:"Unsupported structured response."}:{token:"untested",cleanup:[],profiles:[{profileId:"saved",revision:1,disabled:false,credentialStatus:"configured",compatibilityState:"untested",settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024},discovery:null}]};return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }}});
  try{document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();
    [...document.querySelectorAll('button')].find(b=>b.textContent==="Test response format")!.click();await settled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Unsupported structured response.");
    assert.deepEqual(calls,["ai.profiles","ai.testCompatibility","ai.requestStatus","ai.profiles"]);
  }finally{await browser.happyDOM.close();}
});

test("setup cancel preserves completed publication and ignores a stale awaited status",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  let resolveStatus:((value:unknown)=>void)|undefined;const calls:string[]=[];let failCancel=true;
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string}})=>{
    calls.push(request.operation);
    if(request.operation==="ai.requestStatus")return await new Promise(r=>{resolveStatus=r;});
    if(request.operation==="ai.cancelRequest"&&failCancel){failCancel=false;throw Error("Native bridge unavailable; retry Cancel.");}
    const value=request.operation==="ai.testCompatibility"?{requestId:"test-id"}:request.operation==="ai.cancelRequest"?{state:"completed",done:true}:{token:"saved",cleanup:[],profiles:[{profileId:"saved",revision:1,disabled:false,credentialStatus:"configured",compatibilityState:"ready",settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024},discovery:null}]};return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }}});
  try{document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();
    const button=(label:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent===label)!;
    button("Test response format").click();await waitFor(()=>!!resolveStatus);assert(resolveStatus);assert.equal(button("Read model-load settings").disabled,true);assert.equal(button("Apply model-load settings").disabled,true);button("Cancel response format test").click();await waitFor(()=>document.querySelector('[role="status"]')!.textContent==="Native bridge unavailable; retry Cancel.");
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Native bridge unavailable; retry Cancel.");assert.equal(button("Cancel response format test").disabled,false);
    button("Cancel response format test").click();await settled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Response format test already completed. Its result remains recorded.");
    resolveStatus!({protocolVersion:1,requestId:"late-status",ok:true,value:{done:true,state:"failed",message:"Late failure"}});await settled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Response format test already completed. Its result remains recorded.");
    assert.deepEqual(calls,["ai.profiles","ai.testCompatibility","ai.requestStatus","ai.cancelRequest","ai.cancelRequest","ai.profiles"]);
  }finally{await browser.happyDOM.close();}
});

type SettingsFixture = {label:string;endpoint:string;model:string;privateHttp:boolean;contextCeiling:number;contextBudget:number;maximumResponse:number;thinking?:boolean;temperature?:number;topP?:number;modelLoad?:{parallel:number;gpuMemoryMode:"auto"|"manual";fit:"on"|"off"}};
const fixtureProfile=(profileId:string,label:string)=>({profileId,revision:1,disabled:false,credentialStatus:"configured",settings:{label,endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024} as SettingsFixture,discovery:null});
async function settingsFixture(profiles:ReturnType<typeof fixtureProfile>[]) {
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];
  const store:{profiles:ReturnType<typeof fixtureProfile>[];failRead:boolean;failSave:boolean;failRemoval:boolean;cancelEntry:boolean;failKey:boolean;failConnect:boolean;failReadAfterSave:boolean;pendingConnect?:Promise<unknown>;connectStarted?:()=>void;management?: (operation:string,payload:Record<string,unknown>)=>unknown|Promise<unknown>}={profiles,failRead:false,failSave:false,failRemoval:false,failKey:false,failConnect:false,failReadAfterSave:false,cancelEntry:false};
  let draft:{draftId:string;revision:number;credentialReady:boolean;state:string;message:string;models:string[]}|null=null;
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    calls.push(structuredClone(request));
    const ok=(value:unknown)=>({protocolVersion:1,requestId:request.requestId,ok:true,value});
    const refused=(message:string)=>({protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_CONNECTION_REFUSED",message}});
    if(request.operation==="ai.beginConnection"){draft={draftId:"draft-1",revision:1,credentialReady:store.profiles.some(p=>p.profileId===request.payload.profileId),state:"ready",message:"Enter key, then Connect.",models:[]};return ok(structuredClone(draft));}
    if(request.operation==="ai.enterConnectionKey"){
      if(store.failKey)return refused("Native entry refused; draft retained.");
      if(store.cancelEntry)return ok({...draft,cancelled:true});
      draft={...draft!,revision:draft!.revision+1,credentialReady:true,state:"ready",models:[],message:"Key ready; Connect."};return ok(structuredClone(draft));
    }
    if(request.operation==="ai.connect"&&store.pendingConnect){store.connectStarted?.();return ok(await store.pendingConnect);}
    if(request.operation==="ai.connect"){draft={...draft!,state:store.failConnect?"failed":"connected",message:store.failConnect?"Authentication failed; check key and Connect again.":"Connected. Choose a model.",models:store.failConnect?[]:["fixture","second-model"]};return ok(structuredClone(draft));}
    if(request.operation==="ai.connectionStatus")return ok(structuredClone(draft));
    if(request.operation==="ai.cancelConnection"){draft={...draft!,state:"cancelled",message:"Cancelled; draft retained.",models:[]};return ok(structuredClone(draft));}
    if(request.operation==="ai.discardConnection"){const result=draft;draft=null;return ok(result);}
    if(request.operation==="ai.saveConnection"){
      if(store.failSave)return refused("Synthetic save refusal; draft retained.");
      const profile=store.profiles.find(p=>p.profileId===document.querySelector<HTMLSelectElement>('select')!.value);
      if(profile)profile.settings=structuredClone(request.payload.settings) as SettingsFixture;else store.profiles.push({...fixtureProfile("new-id",""),settings:structuredClone(request.payload.settings) as SettingsFixture});
      if(store.failReadAfterSave)store.failRead=true;return ok({saved:true,profileId:profile?.profileId??"new-id",cleanupPending:false});
    }

    if((request.operation==="ai.profiles"&&store.failRead)||(request.operation==="ai.saveProfile"&&store.failSave)||(request.operation==="ai.removeProfile"&&store.failRemoval))return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_SETTINGS_REFUSED",message:"Synthetic refusal; saved profiles retained."}};
    if(request.operation==="ai.readModelLoadSettings"||request.operation==="ai.applyModelLoadSettings"){
      if(!store.management)throw Error("Unexpected model-load management operation");
      return {protocolVersion:1,requestId:request.requestId,ok:true,value:await store.management(request.operation,request.payload)};
    }
    if(request.operation==="ai.enterCredential"&&store.cancelEntry)return {protocolVersion:1,requestId:request.requestId,ok:true,value:{cancelled:true}};
    if(request.operation==="ai.saveProfile") {
      const profile=store.profiles.find(p=>p.profileId===request.payload.profileId);
      if(profile)profile.settings=structuredClone(request.payload.settings) as SettingsFixture;
      else store.profiles.push({...fixtureProfile("new-id",""),settings:structuredClone(request.payload.settings) as SettingsFixture});
    }
    if(request.operation==="ai.removeProfile")store.profiles=store.profiles.filter(p=>p.profileId!==request.payload.profileId);
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:{token:"fixture-token",profiles:structuredClone(store.profiles),cleanup:[],storageNotice:"Temporary Mac development storage: encrypted local files plus a saved unencrypted unlock key."}};
  }}});
  document.body.innerHTML="<main></main><footer></footer>";
  const controller=mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();
  const input=(label:string)=>document.getElementById([...document.querySelectorAll("label")].find(n=>n.textContent===label)!.htmlFor) as HTMLInputElement;
  const button=(label:string)=>[...document.querySelectorAll<HTMLButtonElement>("button")].find(b=>b.textContent===label&&!b.closest("[hidden]"))!;
  const edit=(label:string,value:string)=>{const n=input(label);n.value=value;n.dispatchEvent(new window.Event(n.tagName==="SELECT"?"change":"input",{bubbles:true}));};
  const select=(id:string)=>{const chooser=document.querySelector<HTMLSelectElement>("select")!;chooser.value=id;chooser.dispatchEvent(new window.Event("change"));};
  return {browser,calls,store,input,button,edit,select,controller};
}

test("new Settings defaults and approved placement stay passive; explicit save maps the single context value",async()=>{
  const f=await settingsFixture([]);
  try {
    assert.equal(f.input("Context length").value,"32768");assert.equal(f.input("Maximum response length").value,"16384");
    assert.equal([...document.querySelectorAll("label")].some(n=>n.textContent==="Configured capacity — unverified"||n.textContent==="Total context budget"),false);
    assert.match(document.body.textContent!,/Profiles are saved only on this computer/);assert.match(document.body.textContent!,/Maximum number of tokens to generate\. Reaching this limit may cut the response short\./);
    assert.equal([...document.querySelectorAll("h4")].some(h=>h.textContent==="API Key"),true);
    assert.equal(document.body.textContent!.split("macOS: API keys are encrypted and stored on this computer.").length-1,1);assert.equal(document.body.textContent!.includes("Temporary Mac development storage"),false);
    const setup=[...document.querySelectorAll("section")].find(n=>n.querySelector("h4")?.textContent==="Response format test")!;
    assert.equal([...setup.querySelectorAll("p")].find(n=>n.textContent==="")!.hidden,true,"unsaved profiles have no untested status");assert.match(setup.textContent!,/No project content is sent\./);
    assert.equal(f.input("Model ID").disabled,true);assert.equal(f.button("Save profile").disabled,true);assert.equal(f.button("Enter credential…").disabled,false);
    const order=[...document.querySelectorAll(".setting-row label, .studio-connect button")].map(n=>n.textContent);assert(order.indexOf("Endpoint")<order.indexOf("Connect"));
    const privateRow=f.input("Allow private-network HTTP").closest<HTMLElement>(".setting-row")!;
    assert.equal(f.input("Endpoint").closest(".setting-row")!.nextElementSibling,privateRow);assert.equal(privateRow.hidden,false);assert.equal(f.input("Allow private-network HTTP").checked,false);
    for(const value of ["https://example.test/v1"," HTTPS://example.test/v1 ",""]){f.edit("Endpoint",value);assert.equal(privateRow.hidden,true);assert.equal(f.input("Allow private-network HTTP").checked,false);}
    f.edit("Endpoint","http://192.168.1.2:8888/v1");assert.equal(privateRow.hidden,false);assert.equal(f.input("Allow private-network HTTP").checked,false);
    f.edit("Endpoint","http://127.0.0.1:8888/v1");assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles"]);
    f.button("Enter credential…").click();await settled();assert.equal(f.input("Model ID").disabled,true);f.button("Connect").click();await settled();assert.equal(f.input("Model ID").disabled,false);f.edit("Model ID","fixture");
    f.button("Save profile").click();await settled();
    assert.deepEqual(f.calls.find(c=>c.operation==="ai.saveConnection")!.payload,{draftId:"draft-1",revision:2,settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:32768,contextBudget:32768,maximumResponse:16384,thinking:true,temperature:1,topP:0.95,modelLoad:{parallel:1,gpuMemoryMode:"manual",fit:"off"}}});
    assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"new-id");assert.equal(setup.textContent!.includes("Response format not tested yet"),true);assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles","ai.beginConnection","ai.enterConnectionKey","ai.connect","ai.saveConnection","ai.discardConnection","ai.profiles"]);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("thinking defaults on, explicit off survives save and reload, and failed saves retain the toggle draft",async()=>{
  const profile=fixtureProfile("saved","Saved");profile.settings.thinking=false;
  const f=await settingsFixture([profile]);
  try {
    assert.equal(f.input("Thinking").checked,false);assert.equal(f.input("Maximum response length").value,"1024");
    f.select("");assert.equal(f.input("Thinking").checked,true);assert.equal(f.input("Maximum response length").value,"16384");
    f.select("saved");f.input("Thinking").checked=true;f.input("Thinking").dispatchEvent(new window.Event("change",{bubbles:true}));
    assert.equal(document.querySelector<HTMLElement>(".studio-settings")!.dataset.dirty,"true");
    f.store.failSave=true;f.button("Save profile").click();await settled();assert.equal(f.input("Thinking").checked,true);assert.equal(f.store.profiles[0]!.settings.thinking,false);
    f.store.failSave=false;f.button("Save profile").click();await settled();assert.equal(f.store.profiles[0]!.settings.thinking,true);
    f.input("Thinking").checked=false;f.input("Thinking").dispatchEvent(new window.Event("change",{bubbles:true}));f.button("Save profile").click();await settled();
    f.button("Reload profiles").click();await settled();assert.equal(f.input("Thinking").checked,false);assert.equal(f.input("Maximum response length").value,"1024");
    assert.equal(f.calls.some(c=>["ai.discover","ai.testCompatibility","ai.sendSynthetic"].includes(c.operation)),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("draft authentication failure retains entered details and explicit retry discovers models without saving or inference",async()=>{
  const f=await settingsFixture([]);
  try{
    f.edit("Profile name","My draft");f.edit("Endpoint","http://192.168.1.2:8888/v1");f.input("Allow private-network HTTP").checked=true;f.input("Allow private-network HTTP").dispatchEvent(new window.Event("change"));
    f.button("Enter credential…").click();await settled();f.store.failConnect=true;f.button("Connect").click();await settled();
    assert.match(document.querySelector('.studio-connect')!.textContent!,/Authentication failed/);assert.equal(f.input("Profile name").value,"My draft");assert.equal(f.input("Endpoint").value,"http://192.168.1.2:8888/v1");assert.equal(f.input("Model ID").disabled,true);assert.equal(f.button("Save profile").disabled,true);assert.equal(f.store.profiles.length,0);
    f.store.failConnect=false;f.button("Connect").click();await settled();assert.equal(f.input("Model ID").disabled,false);assert.deepEqual([...document.querySelectorAll('datalist option')].map(n=>(n as HTMLOptionElement).value),["fixture","second-model"]);
    assert.equal(f.calls.some(c=>["ai.saveProfile","ai.saveConnection","ai.testCompatibility","ai.sendSynthetic","ai.applyModelLoadSettings"].includes(c.operation)),false);
    assert.equal(JSON.stringify(f.calls).includes("fixture-secret"),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("cancelled and late connection results cannot attach to another selected profile or changed address",async()=>{
  const profiles=[fixtureProfile("first","First"),fixtureProfile("second","Second")],f=await settingsFixture(profiles),before=structuredClone(profiles),pending=held<unknown>();
  try{
    const started=held<void>();f.store.connectStarted=()=>started.resolve();f.store.pendingConnect=pending.promise;f.button("Connect").click();await started.promise;
    assert.equal(f.button("Cancel connection").disabled,false);f.button("Cancel connection").click();await settled();f.select("second");
    pending.resolve({draftId:"draft-1",revision:1,credentialReady:true,state:"connected",message:"OLD RESULT",models:["wrong-old-model"]});
    await Promise.resolve();await Promise.resolve();assert.equal(document.querySelector<HTMLSelectElement>('select')!.value,"second");assert.equal(document.body.textContent!.includes("OLD RESULT"),false);assert.equal(f.input("Model ID").value,"fixture");assert.deepEqual(f.store.profiles,before);
    f.store.pendingConnect=undefined;f.button("Connect").click();await settled();f.edit("Endpoint","http://127.0.0.1:9999/v1");assert.equal(f.input("Model ID").value,"");assert.equal(f.input("Model ID").disabled,true);assert.equal(f.button("Save profile").disabled,true);assert.match(document.querySelector('.studio-connect')!.textContent!,/Address changed/);
    assert.equal(f.calls.some(c=>["ai.saveProfile","ai.saveConnection","ai.testCompatibility","ai.applyModelLoadSettings"].includes(c.operation)),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("connected-profile save failure retains the completed draft and explicit retry saves once",async()=>{
  const f=await settingsFixture([]);
  try{
    f.button("Enter credential…").click();await settled();f.button("Connect").click();await settled();f.edit("Model ID","second-model");f.store.failSave=true;
    f.button("Save profile").click();await settled();assert.equal(f.store.profiles.length,0);assert.equal(f.input("Model ID").value,"second-model");assert.equal(f.input("Thinking").checked,true);assert.equal(f.input("Maximum response length").value,"16384");assert.equal(f.button("Save profile").disabled,false);
    f.store.failSave=false;f.button("Save profile").click();await settled();assert.equal(f.store.profiles.length,1);assert.equal(f.store.profiles[0]!.settings.model,"second-model");assert.equal(f.store.profiles[0]!.settings.thinking,true);assert.equal(f.calls.filter(c=>c.operation==="ai.saveConnection").length,2);
    assert.equal(f.calls.some(c=>["ai.testCompatibility","ai.sendSynthetic","ai.applyModelLoadSettings"].includes(c.operation)),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("legacy values remain untouched on open/reload and only map together on explicit successful save",async()=>{
  const profiles=[fixtureProfile("first","First"),fixtureProfile("second","Second")];profiles[1]!.settings.maximumResponse=768;
  const before=structuredClone(profiles);const f=await settingsFixture(profiles);
  try {
    f.select("second");assert.equal(f.input("Context length").value,"4096");assert.equal(f.input("Maximum response length").value,"768");
    f.button("Reload profiles").click();await settled();assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.deepEqual(f.store.profiles,before);
    f.select("");f.button("Reload profiles").click();await settled();assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"");assert.equal(f.input("Context length").value,"32768");
    f.select("second");f.edit("Context length","16384");f.edit("Profile name","Second draft");
    const confirmations:string[]=[];Object.assign(window,{confirm:(text:string)=>{confirmations.push(text);return false;}});
    const count=f.calls.length;f.button("Reload profiles").click();f.select("first");assert.equal(f.calls.length,count);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.equal(f.input("Profile name").value,"Second draft");assert.equal(confirmations.length,2);
    f.store.failSave=true;f.button("Save profile").click();await settled();assert.equal(f.input("Context length").value,"16384");assert.equal(f.input("Profile name").value,"Second draft");assert.equal(document.querySelector<HTMLElement>(".studio-settings")!.dataset.dirty,"true");assert.deepEqual(f.store.profiles,before);
    assert.equal([...document.querySelectorAll("button")].find(b=>b.textContent==="Retry loading profiles")!.hidden,true,"failed save is not a read failure");
    f.store.failRead=true;Object.assign(window,{confirm:()=>true});f.button("Reload profiles").click();await settled();assert.equal(f.input("Profile name").value,"Second draft");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.equal(f.button("Retry loading profiles").hidden,false);
    f.store.failRead=false;f.button("Retry loading profiles").click();await settled();assert.equal(f.input("Profile name").value,"Second");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.deepEqual(f.calls.at(-1)!.payload,{});assert.deepEqual(f.store.profiles,before);
    f.store.failSave=false;f.edit("Context length","16384");f.button("Save profile").click();await settled();assert.equal(f.store.profiles[1]!.settings.contextCeiling,16384);assert.equal(f.store.profiles[1]!.settings.contextBudget,16384);assert.equal(f.store.profiles[1]!.settings.maximumResponse,768);assert.deepEqual(f.store.profiles[0],before[0]);
    assert.equal(f.calls.some(c=>["ai.discover","ai.testCompatibility","ai.enterCredential","ai.removeProfile"].includes(c.operation)),false);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("Danger Zone names the selected local profile; cancel, switch and failure preserve it before confirmed removal",async()=>{
  const f=await settingsFixture([fixtureProfile("first","First"),fixtureProfile("second","Second <draft>")]);
  try {
    f.select("second");f.button("Remove profile").click();assert.equal(f.calls.length,1);
    const danger=document.querySelector<HTMLElement>(".studio-danger-zone")!;
    assert.match(danger.textContent!,/Remove “Second <draft>” from this computer\?/);assert.match(danger.textContent!,/locally saved API key/);assert.match(danger.textContent!,/does not revoke the key at Studio/);assert.equal(danger.querySelector("draft"),null);
    assert.equal(document.activeElement,f.button("Cancel"));f.button("Cancel").click();assert.equal(f.calls.length,1);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");
    f.button("Remove profile").click();f.select("first");assert.equal(danger.querySelector<HTMLElement>("div")!.hidden,true);assert.equal(f.calls.length,1);
    f.select("second");f.store.failRemoval=true;f.button("Remove profile").click();f.button("Remove profile").click();await settled();assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.equal(f.input("Profile name").value,"Second <draft>");assert.equal(f.store.profiles.length,2);assert.match(document.querySelector('[role="status"]')!.textContent!,/Synthetic refusal/);
    f.button("Cancel").click();f.store.failRemoval=false;f.button("Remove profile").click();f.button("Remove profile").click();await settled();assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles","ai.removeProfile","ai.removeProfile"]);assert.deepEqual(f.calls.at(-1)!.payload,{token:"fixture-token",profileId:"second"});assert.equal(f.store.profiles.length,1);assert.equal(f.store.profiles[0]!.profileId,"first");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"");
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("context validation rejects invalid totals and insufficient response room without dispatch or draft loss",async()=>{
  const f=await settingsFixture([fixtureProfile("first","First")]);
  try {
    for(const value of ["","255","2000001","256.5"]){f.edit("Context length",value);f.button("Save profile").click();assert.equal(f.calls.length,1);assert.equal(f.input("Context length").getAttribute("aria-invalid"),"true");assert.equal(f.input("Context length").value,value);}
    f.edit("Context length","1152");f.edit("Maximum response length","1024");f.button("Save profile").click();assert.equal(f.calls.length,1);assert.equal(document.activeElement,f.input("Maximum response length"));
    f.edit("Maximum response length","1023");f.button("Save profile").click();await settled();assert.equal(f.calls.length,2);assert.equal(f.store.profiles[0]!.settings.contextBudget,1152);
    f.store.cancelEntry=true;f.button("Replace credential…").click();await settled();assert.equal(f.input("Context length").value,"1152");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"first");assert.equal(f.store.profiles[0]!.settings.maximumResponse,1023);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("initial profile read failure exposes only read retry and successful retry chooses the first saved profile",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});let reads=0;const operations:string[]=[];
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    operations.push(request.operation);assert.deepEqual(request.payload,{});return ++reads===1?{protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_SETTINGS_REFUSED",message:"Read unavailable; retained."}}:{protocolVersion:1,requestId:request.requestId,ok:true,value:{token:"loaded",profiles:[fixtureProfile("first","First")],cleanup:[]}};
  }}});
  try {
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();const retry=[...document.querySelectorAll("button")].find(b=>b.textContent==="Retry loading profiles")!;
    assert.equal(retry.hidden,false);assert.equal(retry.disabled,false);assert.equal([...document.querySelectorAll("button")].find(b=>b.textContent==="Save profile")!.disabled,true);
    retry.click();await settled();assert.equal(retry.hidden,true);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"first");assert.deepEqual(operations,["ai.profiles","ai.profiles"]);
  }finally{await browser.happyDOM.close();}
});

type LoadValues={contextLength:number;parallel:number;gpuMemoryMode:"auto"|"manual";fit:"on"|"off"};
type LoadReport={modelId:string;resolvedModelId?:string;requested:LoadValues;saved:Partial<LoadValues>|null;effective:Partial<LoadValues>|null;autoSwitchEnabled:boolean|null;applied:boolean;warnings:string[];message:string};
function loadReport(patch:Partial<LoadReport>={}):LoadReport{return {modelId:"fixture",resolvedModelId:"fixture:Q4_K_M",requested:{contextLength:4096,parallel:1,gpuMemoryMode:"manual",fit:"off"},saved:{contextLength:4096,parallel:1,gpuMemoryMode:"manual",fit:"off"},effective:{contextLength:4096,parallel:1,gpuMemoryMode:"manual",fit:"off"},autoSwitchEnabled:true,applied:false,warnings:[],message:"Synthetic model-load settings read.",...patch};}
const held=<T>()=>{let resolve!:(value:T)=>void,reject!:(error:unknown)=>void;const promise=new Promise<T>((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test("model-load defaults are configurable and serialize only on explicit local profile Save",async()=>{
  const profile=fixtureProfile("legacy","Legacy"),original=structuredClone(profile),f=await settingsFixture([profile]);
  try{
    assert.equal(f.input("Parallel slots").value,"1");assert.equal(f.input("GPU memory mode").value,"manual");assert.equal(f.input("Automatic memory fitting").value,"off");assert.equal(f.input("Context length").value,"4096");assert.equal(document.querySelectorAll('#studio-context-length').length,1);assert.equal(document.querySelector('input[aria-label*="CPU"]'),null);assert.equal(f.store.profiles[0]!.settings.modelLoad,undefined);assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles"]);
    assert.equal(f.button("Read model-load settings").disabled,false);assert.equal(f.button("Apply model-load settings").disabled,true);f.button("Apply model-load settings").click();assert.equal(f.calls.length,1);assert.match(document.querySelector('.studio-model-loading')!.textContent!,/Save profile first/);
    f.store.management=()=>loadReport();f.button("Read model-load settings").click();await settled();assert.equal(f.store.profiles[0]!.settings.modelLoad,undefined);assert.deepEqual(f.store.profiles[0],original);assert.deepEqual(f.calls[1]!.payload,{token:"fixture-token",profileId:"legacy"});assert.equal(f.button("Apply model-load settings").disabled,true);
    f.edit("Context length","65536");f.edit("Parallel slots","4");f.edit("GPU memory mode","auto");f.edit("Automatic memory fitting","on");assert.equal(document.querySelector<HTMLElement>('.studio-model-load-report')!.hidden,true);assert.equal(f.button("Read model-load settings").disabled,true);assert.equal(f.button("Apply model-load settings").disabled,true);assert.equal(f.store.profiles[0]!.settings.modelLoad,undefined);
    for(const invalid of ["0","65","1.5",""]){f.edit("Parallel slots",invalid);f.button("Save profile").click();assert.equal(f.calls.length,2);assert.equal(f.input("Parallel slots").getAttribute("aria-invalid"),"true");assert.equal(f.input("Parallel slots").value,invalid);}
    f.edit("Parallel slots","4");f.button("Save profile").click();await settled();const saved=f.calls[2]!.payload.settings as SettingsFixture;assert.deepEqual(saved.modelLoad,{parallel:4,gpuMemoryMode:"auto",fit:"on"});assert.equal(saved.contextBudget,65536);assert.equal(saved.contextCeiling,65536);assert.equal(saved.maximumResponse,1024);assert.deepEqual(f.store.profiles[0]!.settings.modelLoad,saved.modelLoad);assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles","ai.readModelLoadSettings","ai.saveProfile"]);assert.equal(f.button("Apply model-load settings").disabled,false);
    f.button("Reload profiles").click();await settled();assert.equal(f.input("Parallel slots").value,"4");assert.equal(f.input("GPU memory mode").value,"auto");assert.equal(f.input("Automatic memory fitting").value,"on");assert.equal(f.calls.some(c=>c.operation==="ai.applyModelLoadSettings"),false,"saving and reopening never apply settings to Studio");
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("model-load Read and Apply target only the clean saved selected profile and never replace its snapshot",async()=>{
  const profiles=[fixtureProfile("first","First"),fixtureProfile("second","Second")];profiles[1]!.settings.model="second-model";profiles[1]!.settings.modelLoad={parallel:3,gpuMemoryMode:"auto",fit:"on"};const before=structuredClone(profiles),f=await settingsFixture(profiles);
  try{
    const report=loadReport({modelId:"second-model",resolvedModelId:"second-model:Q8",requested:{contextLength:4096,parallel:3,gpuMemoryMode:"auto",fit:"on"},saved:{contextLength:4096,parallel:3,gpuMemoryMode:"auto",fit:"on"},effective:{contextLength:4096,parallel:3,gpuMemoryMode:"auto",fit:"on"}});
    f.store.management=operation=>operation==="ai.applyModelLoadSettings"?{...report,applied:true,message:"Synthetic selected-model override saved."}:report;
    f.select("second");assert.equal(f.input("Parallel slots").value,"3");assert.equal(f.input("GPU memory mode").value,"auto");assert.equal(f.calls.length,1);f.button("Read model-load settings").click();await settled();
    const rendered=document.querySelector<HTMLElement>('.studio-model-load-report')!;assert.equal(rendered.dataset.outcome,"read");assert.equal(rendered.dataset.modelId,"second-model");assert.match(rendered.textContent!,/Studio override target: second-model:Q8/);assert.deepEqual([...rendered.querySelectorAll('thead th')].map(n=>n.textContent),["Setting","Requested","Saved in Studio","Actually loaded"]);assert.deepEqual([...rendered.querySelectorAll('tbody tr')].map(n=>[...n.querySelectorAll('td')].map(c=>c.textContent)),[["4,096 tokens","4,096 tokens","4,096 tokens"],["3","3","3"],["Automatic","Automatic","Automatic"],["On","On","On"]]);assert.equal(rendered.querySelector("input,select"),null);
    f.button("Apply model-load settings").click();await settled();assert.equal(rendered.dataset.outcome,"applied");assert.match(rendered.textContent!,/An active model has not been reloaded/);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.equal(f.input("Profile name").value,"Second");assert.equal(f.input("Parallel slots").value,"3");assert.deepEqual(f.store.profiles,before);assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles","ai.readModelLoadSettings","ai.applyModelLoadSettings"]);assert.deepEqual(f.calls.slice(1).map(c=>c.payload),[{token:"fixture-token",profileId:"second"},{token:"fixture-token",profileId:"second"}]);assert.equal(f.calls.some(c=>c.operation==="ai.saveProfile"||c.operation==="ai.discover"||c.operation==="ai.testCompatibility"),false);
    f.store.management=()=>({...report,applied:false,warnings:["Read-back differs from the requested configuration."],message:"Settings were written, but read-back is not confirmed."});f.button("Apply model-load settings").click();await settled();assert.equal(rendered.dataset.outcome,"unverified");assert.match(rendered.textContent!,/update was sent, but its saved configuration is unverified/);assert.equal(rendered.textContent!.includes("No model-load settings were applied by this action"),false);assert.equal(f.calls.filter(c=>c.operation==="ai.applyModelLoadSettings").length,2,"only the two explicit Apply actions write");
    f.select("first");assert.equal(rendered.hidden,true);assert.equal(f.input("Parallel slots").value,"1");assert.equal(f.input("GPU memory mode").value,"manual");
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("model-load partial state is unverified and mismatches or disabled auto-switch are visible warnings",async()=>{
  const f=await settingsFixture([fixtureProfile("saved","Saved")]);
  try{
    f.store.management=()=>loadReport({requested:{contextLength:32768,parallel:1,gpuMemoryMode:"manual",fit:"off"},saved:{contextLength:16384},effective:{contextLength:8192,parallel:2},autoSwitchEnabled:false,warnings:["Studio cannot verify GPU memory mode."]});f.button("Read model-load settings").click();await settled();
    const rendered=document.querySelector<HTMLElement>('.studio-model-load-report')!,warnings=rendered.querySelector('.studio-model-load-warnings')!;assert.equal(rendered.dataset.outcome,"read");assert.equal(warnings.getAttribute('role')??(warnings as HTMLElement).role,"status");assert.match(warnings.textContent!,/Configuration warnings/);assert.match(warnings.textContent!,/Studio cannot verify GPU memory mode/);assert.match(warnings.textContent!,/Actually loaded: Context length is 8,192 tokens; requested 32,768 tokens/);assert.match(warnings.textContent!,/Actually loaded: Parallel slots is 2; requested 1/);assert.match(warnings.textContent!,/Automatic model switching is off/);assert.match(rendered.textContent!,/Loomlight has not changed this server-wide setting/);assert.equal([...rendered.querySelectorAll('tbody td')].filter(n=>n.textContent==="Unverified").length,5);assert.equal(rendered.querySelector('.error-message'),null,"different actual values are not a failed request");
    f.store.management=()=>loadReport({saved:null,effective:null,autoSwitchEnabled:null,warnings:[]});f.button("Read model-load settings").click();await settled();assert.equal([...rendered.querySelectorAll('tbody td')].filter(n=>n.textContent==="Unverified").length,8);assert.match(rendered.textContent!,/Automatic model switching: Unverified/);assert.match(rendered.textContent!,/Automatic model switching is unverified/);
    f.edit("GPU memory mode","auto");assert.equal(rendered.hidden,true,"a select change clears the clean profile's report");assert.equal(document.querySelector<HTMLElement>('.studio-settings')!.dataset.dirty,"true");assert.equal(f.button("Read model-load settings").disabled,true);
    f.edit("Model ID","Changed model draft");assert.equal(rendered.hidden,true);assert.equal(f.button("Apply model-load settings").disabled,true);Object.assign(window,{confirm:()=>false});f.button("Reload profiles").click();assert.equal(f.input("Model ID").value,"Changed model draft");assert.equal(f.input("GPU memory mode").value,"auto");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"saved");assert.equal(f.calls.length,3);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("model-load busy and failed actions retain fields and selection and never automatically retry an uncertain Apply",async()=>{
  const second=fixtureProfile("second","Second");second.settings.modelLoad={parallel:1,gpuMemoryMode:"manual",fit:"off"};const f=await settingsFixture([fixtureProfile("first","First"),second]),read=held<LoadReport>();f.store.management=()=>read.promise;
  try{
    f.select("second");f.button("Read model-load settings").click();assert.equal(f.controller.canLeave(),false);assert.equal(f.button("Read model-load settings").disabled,true);assert.equal(f.button("Apply model-load settings").disabled,true);assert.equal(f.button("Test response format").disabled,true);assert.equal(f.button("Save profile").disabled,true);f.select("first");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");read.reject(Error("Synthetic management bridge unavailable"));await settled();assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.equal(f.input("Profile name").value,"Second");assert.equal(f.input("Context length").value,"4096");assert.equal(f.input("Parallel slots").value,"1");assert.match(document.querySelector('.studio-model-load-report')!.textContent!,/could not be read/);assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent==="Retry loading profiles")!.hidden,true,"management read failure is separate from profile read failure");
    f.store.management=()=>{throw Error("Synthetic Apply response was lost");};f.button("Apply model-load settings").click();await settled();assert.match(document.querySelector('.studio-model-load-report')!.textContent!,/server may already have saved settings/);assert.match(document.querySelector('.studio-model-load-report')!.textContent!,/Read model-load settings before applying again/);assert.equal(f.calls.filter(c=>c.operation==="ai.applyModelLoadSettings").length,1);assert.equal(f.controller.canLeave(),true);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");
    f.edit("Parallel slots","5");assert.equal(document.querySelector<HTMLElement>('.studio-model-load-report')!.hidden,true);f.button("Read model-load settings").click();f.button("Apply model-load settings").click();assert.equal(f.calls.length,3);f.store.failSave=true;f.button("Save profile").click();await settled();assert.equal(f.input("Parallel slots").value,"5");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"second");assert.deepEqual(f.store.profiles[1]!.settings.modelLoad,{parallel:1,gpuMemoryMode:"manual",fit:"off"});assert.equal(f.button("Apply model-load settings").disabled,true);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});

test("model-load management requires configured enabled profiles and refuses reports for another saved model",async()=>{
  const missing=fixtureProfile("missing","Missing");missing.credentialStatus="missing";const disabled=fixtureProfile("disabled","Disabled");disabled.disabled=true;const f=await settingsFixture([missing,disabled,fixtureProfile("configured","Configured")]);
  try{
    for(const id of ["missing","disabled"]){f.select(id);assert.equal(f.button("Read model-load settings").disabled,true);assert.equal(f.button("Apply model-load settings").disabled,true);f.button("Read model-load settings").click();f.button("Apply model-load settings").click();assert.equal(f.calls.length,1);}
    f.select("configured");f.store.management=()=>loadReport({modelId:"other-model",resolvedModelId:"other-model:Q4"});f.button("Read model-load settings").click();await settled();assert.equal(document.querySelector<HTMLElement>('.studio-model-load-report')!.dataset.outcome,"error");assert.match(document.querySelector('.studio-model-load-report')!.textContent!,/different model/);assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"configured");assert.equal(f.input("Model ID").value,"fixture");assert.equal(document.querySelector('.studio-model-load-report table'),null);assert.equal(f.store.profiles[2]!.settings.modelLoad,undefined);
  }finally{f.controller.dispose();await f.browser.happyDOM.close();}
});
