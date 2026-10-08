import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { mountStudioSettings } from "../src/ai-settings-ui.ts";

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
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(document.querySelector('[role="status"]')?.textContent, message);
    const button = (label:string) => [...document.querySelectorAll("button")].find(b => b.textContent === label)!;
    assert.equal(button("Refresh models").disabled, true);
    assert.deepEqual(calls.map(c => c.operation), ["ai.profiles"]);
    denied = false;
    button("Reload saved profiles").click();
    await new Promise(resolve => setTimeout(resolve, 20));
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
  const settle=()=>new Promise(resolve=>setTimeout(resolve,20));
  try {
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settle();
    assert.equal(button("Refresh models").disabled,true);assert.equal(button("Re-enter API key").disabled,false);
    assert.equal(document.body.textContent!.includes("cleanup deferred"),true);assert.equal([...document.querySelectorAll("button")].some(b=>b.textContent==="Retry owned credential cleanup"),false);
    button("Retry").click();await settle();assert.deepEqual(calls.map(c=>c.operation),["ai.profiles","ai.profiles"]);assert.deepEqual(calls[1]!.payload,{});
    button("Re-enter API key").click();await settle();assert.equal(document.querySelector('[role="status"]')!.textContent,"API key saved; cleanup pending");
    assert.equal(button("Refresh models").disabled,false);assert.equal(button("Replace credential…").disabled,false);assert.deepEqual(calls[2]!.payload,{profileId:"file",token:"owned"});
    assert.equal(document.querySelectorAll('input[type="password"]').length,0);assert.equal(calls.some(c=>c.operation==="ai.discover"||c.operation==="ai.cleanup"),false);
    status="unsupported";saveStatus=undefined;button("Retry").click();await settle();assert.equal(button("Enter credential…").disabled,true);
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
  const button=(label:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===label)!;const settle=()=>new Promise(resolve=>setTimeout(resolve,20));
  try{
    document.body.innerHTML="<main></main><footer></footer>";mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!);await settle();
    button("Enter credential…").click();await settle();assert.match(document.querySelector('[role="status"]')!.textContent!,/Input retained/);assert.equal((document.querySelector('#studio-profile-name') as HTMLInputElement).value,"Retained");
    button("Enter credential…").click();await settle();assert.equal(document.querySelector('[role="status"]')!.textContent,"API key saved; cleanup pending; saved profiles could not be reloaded. Retry reading before further changes.");assert.equal(button("Save profile").disabled,true);assert.equal(button("Retry").disabled,false);assert.equal(button("Enter credential…").disabled,true);assert.equal(button("Remove credential").disabled,true);assert.equal(button("Remove profile").disabled,true);assert.equal(button("Refresh models").disabled,true);
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
  const settle = () => new Promise(resolve=>setTimeout(resolve,20));
  const disabled = () => {
    for(const label of regression.disabledActions) assert.equal(button(label)?.disabled, true, label);
    for(const n of document.querySelectorAll<HTMLInputElement|HTMLSelectElement>("input,select")) assert.equal(n.disabled, true);
    assert.equal(button("Retry").disabled, false);
    assert.equal(button("Reload saved profiles").disabled, false);
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
    button("Retry").click(); await settle(); disabled();
    assert.equal(document.querySelector('[role="status"]')!.textContent,"Snapshot still unavailable; retained.");
    button("Retry").click(); await settle();
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
