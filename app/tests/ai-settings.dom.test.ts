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
    assert.equal(button("Refresh models").disabled, true);
    assert.deepEqual(calls.map(c => c.operation), ["ai.profiles"]);
    denied = false;
    button("Reload profiles").click();
    await settled();
    assert.equal(button("Refresh models").disabled, false);
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
    assert.equal(button("Refresh models").disabled,true);assert.equal(button("Re-enter API key").disabled,false);
    assert.equal(document.body.textContent!.includes("cleanup deferred"),true);assert.equal([...document.querySelectorAll("button")].some(b=>b.textContent==="Retry owned credential cleanup"),false);
    assert.equal(button("Retry loading profiles").hidden,true);button("Reload profiles").click();await settle();assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.profiles"]);assert.deepEqual(calls[1]!.payload,{});
    button("Re-enter API key").click();await settle();assert.equal(document.querySelector('[role="status"]')!.textContent,"API key saved; cleanup pending");
    assert.equal(button("Refresh models").disabled,false);assert.equal(button("Replace credential…").disabled,false);assert.deepEqual(calls[2]!.payload,{profileId:"file",token:"owned"});
    assert.equal(document.querySelectorAll('input[type="password"]').length,0);assert.equal(calls.some(c=>c.operation==="ai.discover"||c.operation==="ai.cleanup"),false);
    status="unsupported";saveStatus=undefined;button("Reload profiles").click();await settle();assert.equal(button("Enter credential…").disabled,true);
  }finally{await browser.happyDOM.close();}
});

test("failed entry preserves profile fields and confirmed save with unavailable reload never becomes failed save", async () => {
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});let entries=0;
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string}})=>{
    if(request.operation==="ai.enterCredential"){
      entries++;return entries===1?{protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_SETTINGS_REFUSED",message:"Input retained; retry inside native dialog."}}:{protocolVersion:1,requestId:request.requestId,ok:true,value:{saved:true,reloadRequired:true,cleanupPending:true,saveStatus:"API key saved; cleanup pending; saved profiles could not be reloaded. Retry reading before further changes."}};
    }
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:{token:"saved",cleanup:[],profiles:[{profileId:"file",revision:1,disabled:false,credentialStatus:"missing",discovery:null,settings:{label:"Retained",endpoint:"http://127.0.0.1:8888/v1",model:"synthetic",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024}}]}};
  }}});
  const button=(label:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===label)!;const settle=settled;
  try{
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settle();
    button("Enter credential…").click();await settle();assert.match(document.querySelector('[role="status"]')!.textContent!,/Input retained/);assert.equal((document.querySelector('#studio-profile-name') as HTMLInputElement).value,"Retained");
    button("Enter credential…").click();await settle();assert.equal(document.querySelector('[role="status"]')!.textContent,"API key saved; cleanup pending; saved profiles could not be reloaded. Retry reading before further changes.");assert.equal(button("Save profile").disabled,true);assert.equal(button("Retry loading profiles").disabled,false);assert.equal(button("Enter credential…").disabled,true);assert.equal(button("Remove credential").disabled,true);assert.equal(button("Remove profile").disabled,true);assert.equal(button("Refresh models").disabled,true);
  }finally{await browser.happyDOM.close();}
});

test("public one-shot reload fixture keeps all controls disabled until read-only Retry restores C", async () => {
  const {readFileSync} = await import("node:fs");
  const regression = JSON.parse(readFileSync("tests/fixtures/macos-development-credential-reload-failure.json", "utf8"));
  const fixture = JSON.parse(readFileSync("tests/fixtures/macos-development-credentials.json", "utf8"));
  const browser = new Window(); Object.assign(globalThis, {window:browser, document:browser.document});
  const calls: {operation:string;payload:Record<string,unknown>}[] = [];
  let saved = false, reads = 0;
  const snapshot = () => ({token:saved?"confirmed":"original", cleanup:[{profileId:"legacy",deferred:true}, {profileId:regression.profileId,deferred:true}], profiles:fixture.profileStore.profiles.map((p:{profileId:string;revision:number;settings:unknown}) => ({...p, revision:saved&&p.profileId===regression.profileId?2:1, disabled:false, credentialStatus:saved&&p.profileId===regression.profileId?"configured":"deferred", discovery:null}))});
  Object.assign(browser, {__TAURI_INTERNALS__:{invoke:async (_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}}) => {
    calls.push(request);
    if(request.operation === "ai.enterCredential") {
      assert.equal(saved, false, "another save must never be sent");
      saved = true;
      return {protocolVersion:1,requestId:request.requestId,ok:true,value:regression.expectedResponse};
    }
    assert.equal(request.operation, "ai.profiles", "Retry must never mutate or discover");
    assert.deepEqual(request.payload, {});
    if(saved && ++reads === 1) return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_SETTINGS_REFUSED",message:"Snapshot still unavailable; retained."}};
    return {protocolVersion:1,requestId:request.requestId,ok:true,value:snapshot()};
  }}});
  const button = (label:string) => [...document.querySelectorAll("button")].find(b=>b.textContent===label)!;
  const settle = settled;
  const disabled = () => {
    for(const label of regression.disabledActions) assert.equal(button(label)?.disabled, true, label);
    for(const n of document.querySelectorAll<HTMLInputElement|HTMLSelectElement>("input,select")) assert.equal(n.disabled, true);
    assert.equal(button("Retry loading profiles").disabled, false);
    assert.equal(button("Reload profiles").disabled, false);
  };
  try {
    document.body.innerHTML="<main></main><footer></footer>";
    mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!); await settle();
    const chooser = document.querySelector<HTMLSelectElement>("select")!;
    chooser.value=regression.profileId; chooser.dispatchEvent(new window.Event("change"));
    button("Enter credential…").click(); await settle();
    assert.equal(document.querySelector('[role="status"]')!.textContent,regression.expectedResponse.saveStatus);
    assert.deepEqual(calls[1]!.payload,{profileId:regression.profileId,token:"original"});
    disabled();
    for(const label of regression.disabledActions) button(label).click();
    assert.equal(calls.length,2,"disabled controls cannot dispatch");
    button("Retry loading profiles").click(); await settle(); disabled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Snapshot still unavailable; retained.");
    button("Retry loading profiles").click(); await settle();
    assert.equal(chooser.value,regression.profileId);
    assert.equal(document.querySelector('.studio-settings')!.textContent!.includes("Credential: configured"),true);
    assert.equal(document.querySelector('.studio-settings')!.textContent!.includes("Apple Keychain cleanup deferred; owned references retained."),true);
    assert.equal(button("Replace credential…").disabled,false);
    assert.equal(button("Refresh models").disabled,false);
    assert.equal(button("Save profile").disabled,false);
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.enterCredential","ai.profiles","ai.profiles"]);
    assert.equal(document.querySelectorAll('input[type="password"]').length,0);
  } finally {await browser.happyDOM.close();}
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
    assert(button("Refresh models").disabled);button("Save profile").click();await settle();
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
    button("Test connection").click();await settled();
    assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.testCompatibility","ai.requestStatus","ai.profiles"]);
    assert.deepEqual(calls[1]!.payload,{token:"untested",profileId:"saved",sessionId:null,timeoutSeconds:60});
    assert(document.querySelector('[role="status"]')!.textContent!.includes("Connection tested"));assert(button("Cancel connection test").disabled);
  }finally{await browser.happyDOM.close();}
});

test("failed setup probe remains untested without discovery, automatic retry or proposal",async()=>{
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});const calls:string[]=[];
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string}})=>{
    calls.push(request.operation);const value=request.operation==="ai.testCompatibility"?{requestId:"test-id"}:request.operation==="ai.requestStatus"?{done:true,state:"failed",message:"Unsupported structured response."}:{token:"untested",cleanup:[],profiles:[{profileId:"saved",revision:1,disabled:false,credentialStatus:"configured",compatibilityState:"untested",settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024},discovery:null}]};return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }}});
  try{document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settled();
    [...document.querySelectorAll('button')].find(b=>b.textContent==="Test connection")!.click();await settled();
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
    button("Test connection").click();await waitFor(()=>!!resolveStatus);assert(resolveStatus);button("Cancel connection test").click();await waitFor(()=>document.querySelector('[role="status"]')!.textContent==="Native bridge unavailable; retry Cancel.");
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Native bridge unavailable; retry Cancel.");assert.equal(button("Cancel connection test").disabled,false);
    button("Cancel connection test").click();await settled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Connection test already completed. Its result remains recorded.");
    resolveStatus!({protocolVersion:1,requestId:"late-status",ok:true,value:{done:true,state:"failed",message:"Late failure"}});await settled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Connection test already completed. Its result remains recorded.");
    assert.deepEqual(calls,["ai.profiles","ai.testCompatibility","ai.requestStatus","ai.cancelRequest","ai.cancelRequest","ai.profiles"]);
  }finally{await browser.happyDOM.close();}
});

type SettingsFixture = {label:string;endpoint:string;model:string;privateHttp:boolean;contextCeiling:number;contextBudget:number;maximumResponse:number;temperature?:number;topP?:number};
const fixtureProfile=(profileId:string,label:string)=>({profileId,revision:1,disabled:false,credentialStatus:"configured",settings:{label,endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:8192,contextBudget:4096,maximumResponse:1024} as SettingsFixture,discovery:null});
async function settingsFixture(profiles:ReturnType<typeof fixtureProfile>[]) {
  const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
  const calls:{operation:string;payload:Record<string,unknown>}[]=[];
  const store={profiles,failRead:false,failSave:false,failRemoval:false,cancelEntry:false};
  Object.assign(browser,{__TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
    calls.push(structuredClone(request));
    if((request.operation==="ai.profiles"&&store.failRead)||(request.operation==="ai.saveProfile"&&store.failSave)||(request.operation==="ai.removeProfile"&&store.failRemoval))return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"AI_SETTINGS_REFUSED",message:"Synthetic refusal; saved profiles retained."}};
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
  const edit=(label:string,value:string)=>{const n=input(label);n.value=value;n.dispatchEvent(new window.Event("input",{bubbles:true}));};
  const select=(id:string)=>{const chooser=document.querySelector<HTMLSelectElement>("select")!;chooser.value=id;chooser.dispatchEvent(new window.Event("change"));};
  return {browser,calls,store,input,button,edit,select,controller};
}

test("new Settings defaults and approved placement stay passive; explicit save maps the single context value",async()=>{
  const f=await settingsFixture([]);
  try {
    assert.equal(f.input("Context length").value,"32768");assert.equal(f.input("Maximum response length").value,"8192");
    assert.equal([...document.querySelectorAll("label")].some(n=>n.textContent==="Configured capacity — unverified"||n.textContent==="Total context budget"),false);
    assert.match(document.body.textContent!,/Profiles are saved only on this computer/);assert.match(document.body.textContent!,/Maximum number of tokens to generate\. Reaching this limit may cut the response short\./);
    assert.equal([...document.querySelectorAll("h4")].some(h=>h.textContent==="API Key"),true);
    assert.equal(document.body.textContent!.split("macOS: API keys are encrypted and stored on this computer.").length-1,1);assert.equal(document.body.textContent!.includes("Temporary Mac development storage"),false);
    const setup=[...document.querySelectorAll("section")].find(n=>n.querySelector("h4")?.textContent==="Connection test")!;
    assert.equal([...setup.querySelectorAll("p")].find(n=>n.textContent==="")!.hidden,true,"unsaved profiles have no untested status");assert.match(setup.textContent!,/No project content is sent\./);
    assert.equal(f.input("Model ID").closest(".setting-row")!.nextElementSibling!.querySelector("button"),f.button("Refresh models"));
    const privateRow=f.input("Allow private-network HTTP").closest<HTMLElement>(".setting-row")!;
    assert.equal(f.input("Endpoint").closest(".setting-row")!.nextElementSibling,privateRow);assert.equal(privateRow.hidden,false);assert.equal(f.input("Allow private-network HTTP").checked,false);
    for(const value of ["https://example.test/v1"," HTTPS://example.test/v1 ",""]){f.edit("Endpoint",value);assert.equal(privateRow.hidden,true);assert.equal(f.input("Allow private-network HTTP").checked,false);}
    f.edit("Endpoint","http://192.168.1.2:8888/v1");assert.equal(privateRow.hidden,false);assert.equal(f.input("Allow private-network HTTP").checked,false);
    f.edit("Endpoint","http://127.0.0.1:8888/v1");f.edit("Model ID","fixture");assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles"]);
    f.button("Save profile").click();await settled();
    assert.deepEqual(f.calls[1]!.payload,{token:"fixture-token",profileId:null,settings:{label:"Studio",endpoint:"http://127.0.0.1:8888/v1",model:"fixture",privateHttp:false,contextCeiling:32768,contextBudget:32768,maximumResponse:8192,temperature:1,topP:0.95}});
    assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"new-id");assert.equal(setup.textContent!.includes("Setup not tested yet"),true);assert.deepEqual(f.calls.map(c=>c.operation),["ai.profiles","ai.saveProfile"]);
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
    f.store.cancelEntry=true;f.button("Replace credential…").click();await settled();assert.equal(f.input("Context length").value,"1152");assert.equal(document.querySelector<HTMLSelectElement>("select")!.value,"first");assert.match(document.querySelector('[role="status"]')!.textContent!,/cancelled; saved profile unchanged/);
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
