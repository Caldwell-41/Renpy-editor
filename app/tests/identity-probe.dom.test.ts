import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Window } from "happy-dom";
import { mountStudioSettings } from "../src/ai-settings-ui.ts";

const script = readFileSync("src-tauri/src/studio_identity_probe.js", "utf8");
const endpoint = "http://127.0.0.1:12345/v1";
type Profile = {profileId:string; revision:number; disabled:boolean; credentialStatus:string;
  settings:Record<string,unknown>; discovery:null|{selectedAvailable:boolean;models:string[];status:string}};
async function scenario(phase:number, failSecondDiscovery=false) {
  const browser = new Window();
  Object.assign(globalThis, {window:browser, document:browser.document});
  let profile:Profile|undefined = phase === 1 ? undefined : {
    profileId:"disposable", revision:2, disabled:phase===4, credentialStatus:phase===4?"missing":"configured",
    settings:{label:"Disposable identity proof",endpoint,model:"loomlight-synthetic-model",privateHttp:false,
      contextCeiling:8192,contextBudget:4096,maximumResponse:1024}, discovery:null,
  };
  let entries=0, gets=0, deleted=false;
  const calls:string[]=[];
  const reports:Record<string,unknown>[]=[];
  const snapshot=()=>structuredClone({token:"current",profiles:profile?[profile]:[],cleanup:[]});
  Object.assign(browser, {
    __loomlightIdentityProbe:{phase,endpoint},
    __loomlightProbeFindButton:(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===name),
    __TAURI_INTERNALS__:{invoke:async (_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
      const {operation,payload}=request; calls.push(operation);
      assert.ok(!Object.keys(payload).some(k=>["key","secret","password"].includes(k)), "No secret IPC");
      let value:unknown;
      switch(operation) {
        case "ai.profiles": value=snapshot();break;
        case "ai.saveProfile":
          profile={profileId:"disposable",revision:1,disabled:false,credentialStatus:"missing",settings:payload.settings as Record<string,unknown>,discovery:null};value=snapshot();break;
        case "ai.enterCredential":
          assert.ok(profile);entries++;profile.revision++;profile.credentialStatus="configured";profile.discovery=null;value=snapshot();break;
        case "ai.discover":
          gets++;assert.ok(profile);
          if(failSecondDiscovery&&gets===2)return {ok:false,error:{code:"TEST_REFUSED",message:"Test discovery refused"}};
          profile.discovery={selectedAvailable:true,models:["loomlight-synthetic-model"],status:"model available; discovery only"};value=snapshot();break;
        case "ai.removeCredential":
          assert.ok(profile);deleted=true;profile.disabled=true;profile.credentialStatus="missing";profile.discovery=null;value=snapshot();break;
        case "ai.removeProfile": profile=undefined;value=snapshot();break;
        case "probe.studioIdentityAudit":
          value={active:profile?.credentialStatus==="configured"?1:0,retiredAbsent:phase===3?entries+Number(deleted):0,cleanup:0,processId:42,executablePath:"/fixture/Loomlight.app/Contents/MacOS/loomlight"};break;
        case "probe.runtimeUiReport":reports.push(payload);value={recorded:true};break;
        default:throw Error(`Unexpected operation ${operation}`);
      }
      return {protocolVersion:1,requestId:request.requestId,ok:true,value};
    }},
  });
  try {
    document.body.innerHTML="<button>Settings</button><button>AI providers</button><main></main><footer></footer>";
    document.querySelectorAll("button")[1]!.addEventListener("click",()=>mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!));
    await browser.eval(script);
    assert.equal(reports.length,1);
    return {report:reports[0]!,entries,gets,profile,calls};
  } finally {await browser.happyDOM.close();}
}

test("prepared identity probe drives all four actual Settings DOM flows with no secret IPC",{timeout:10000},async()=>{
  for(const phase of [1,2,3,4]) {
    const result=await scenario(phase);
    assert.equal(result.report.passed,true,JSON.stringify(result.report));
    assert.equal(result.gets,[2,2,4,0][phase-1]);
    assert.equal(result.entries,[1,0,1,0][phase-1]);
    assert.ok(!result.calls.includes("probe.studioReuseQualification"));
    if(phase===3)assert.equal(result.profile?.credentialStatus,"missing");
    if(phase===4)assert.equal(result.profile,undefined);
  }
});
test("prepared identity probe rejects a failed second discovery despite stale successful evidence",{timeout:5000},async()=>{
  const result=await scenario(2,true);
  assert.equal(result.report.passed,false);
  assert.equal(result.gets,2);
  assert.equal(result.report.stage,"discovery-2");
});
