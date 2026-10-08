import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Window } from "happy-dom";
import { mountStudioSettings } from "../src/ai-settings-ui.ts";
const script = readFileSync("src-tauri/src/windows_studio_probe.js", "utf8");
const fixture = JSON.parse(readFileSync("tests/fixtures/windows-studio-credentials.json", "utf8"));
async function scenario(phase:number, failedGet=false) {
  const browser = new Window(); Object.assign(globalThis,{window:browser,document:browser.document});
  let profiles=fixture.profiles.map((p:{profileId:string;settings:Record<string,unknown>})=>({profileId:p.profileId,settings:structuredClone(p.settings),revision:phase===1?1:2,disabled:false,credentialStatus:phase===1?"missing":"configured",discovery:null as null|{selectedAvailable:boolean;models:string[];status:string}}));
  let entries=0,gets=0,removals=0;
  const snapshot=()=>structuredClone({token:profiles.map((p:{revision:number})=>p.revision).join("-"),profiles,cleanup:[{profileId:fixture.profiles[0].profileId,deferred:false}]});
  const reports:Record<string,unknown>[]=[];
  Object.assign(browser,{
    __loomlightWindowsStudioPhase:phase,
    __loomlightProbeFindButton:(name:string)=>[...document.querySelectorAll("button")].find(b=>b.textContent===name),
    __TAURI_INTERNALS__:{invoke:async (_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
      const {operation,payload}=request;
      assert.ok(!Object.keys(payload).some(k=>["key","password","secret"].includes(k)),"No secret IPC");
      let value:unknown;
      const p=profiles.find((p:{profileId:string})=>p.profileId===payload.profileId);
      switch(operation){
        case "ai.profiles":value=snapshot();break;
        case "probe.windowsStudioStep":value={recorded:true};break;
        case "ai.enterCredential":
          entries++; assert.ok(p);
          if(phase===1&&entries===3){value={cancelled:true};break;}
          p.revision++;p.credentialStatus="configured";p.discovery=null;
          value={...snapshot(),saveStatus:`API key saved${p.profileId===fixture.profiles[0].profileId?"; cleanup pending":""}`};break;
        case "ai.discover":
          gets++;assert.ok(p);
          if(failedGet&&gets===2)return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:"FIXTURE_REFUSED",message:"Refused synthetic discovery"}};
          p.discovery={selectedAvailable:true,models:["loomlight-synthetic-model"],status:"model available; discovery only"};value=snapshot();break;
        case "ai.removeCredential":
          removals++;assert.ok(p);p.revision++;p.disabled=true;p.credentialStatus="missing";p.discovery=null;
          value={...snapshot(),saveStatus:`Removed${p.profileId===fixture.profiles[0].profileId?"; cleanup pending":""}`};break;
        case "ai.removeProfile":profiles=profiles.filter((p:{profileId:string})=>p.profileId!==payload.profileId);value=snapshot();break;
        case "probe.runtimeUiReport":reports.push(payload);value={recorded:true};break;
        default:throw Error(`Unexpected ${operation}`);
      }
      return {protocolVersion:1,requestId:request.requestId,ok:true,value};
    }}
  });
  try {
    document.body.innerHTML="<button>Settings</button><button>AI providers</button><main></main><footer></footer>";
    document.querySelectorAll("button")[1]!.addEventListener("click",()=>mountStudioSettings(document.querySelector("main")!,document.querySelector("footer")!));
    await browser.eval(script);assert.equal(reports.length,1);return {report:reports[0]!,entries,gets,removals};
  }finally{await browser.happyDOM.close();}
}
test("prepared Windows probe drives both actual Settings phases with exact secret-free operations",{timeout:10000},async()=>{
  for(const phase of [1,2]){const result=await scenario(phase);assert.equal(result.report.passed,true,JSON.stringify(result.report));assert.equal(result.entries,phase===1?3:1);assert.equal(result.gets,2);assert.equal(result.removals,phase===1?0:2);}
});
test("Windows probe rejects failed discovery despite earlier availability",{timeout:5000},async()=>{
  const result=await scenario(2,true);assert.equal(result.report.passed,false);assert.equal(result.gets,2);
});
