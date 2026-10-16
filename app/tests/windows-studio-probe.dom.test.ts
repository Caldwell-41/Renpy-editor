import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {Window} from 'happy-dom';
import {mountStudioSettings} from '../src/ai-settings-ui.ts';
const script=readFileSync('src-tauri/src/windows_studio_probe.js','utf8');
const fixture=JSON.parse(readFileSync('tests/fixtures/windows-studio-credentials.json','utf8'));
const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
async function scenario(phase:number,failedGet=false,reloadProof=false,defect='',evidence=false,signal?:AbortSignal){
 const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document});
 let profiles=fixture.profiles.map((p:{profileId:string;settings:Record<string,unknown>})=>({profileId:p.profileId,settings:structuredClone(p.settings),revision:phase===1?1:2,disabled:false,credentialStatus:phase===1?'missing':'configured',discovery:null}));
 let entries=0,gets=0,removals=0,reloadReads=0,confirmed=false,failedReload=false,draftNumber=0;
 let draft:{draftId:string;revision:number;profileId:string;credentialReady:boolean;state:string;models:string[];message:string}|undefined;
 const snapshot=()=>structuredClone({token:profiles.map((p:{revision:number})=>p.revision).join('-'),profiles,cleanup:[{profileId:A,deferred:false}]});
 const holds:string[]=[],reports:Record<string,unknown>[]=[];
 Object.assign(browser,{
  __loomlightWindowsStudioPhase:phase,__loomlightWindowsEvidence:evidence,__loomlightWindowsReloadProof:reloadProof,__loomlightProbeSignal:signal,
  __loomlightProbeFindButton:(name:string)=>{
   const found=[...document.querySelectorAll('button')].find(b=>b.textContent===name&&!b.hidden&&!b.closest('[hidden]'));
   if(defect==='retry-noop'&&confirmed&&name==='Retry loading profiles'&&found&&!found.dataset.noop){found.dataset.noop='true';found.addEventListener('click',event=>{event.stopImmediatePropagation();[...document.querySelectorAll('button')].find(b=>b.textContent==='Save profile')!.disabled=false;},true);}
   if(defect==='closed-maintenance'&&name==='Retry loading profiles')document.querySelector<HTMLDetailsElement>('.studio-maintenance')!.open=false;
   return found;
  },
  __TAURI_INTERNALS__:{invoke:async(_:string,{request}:{request:{requestId:string;operation:string;payload:Record<string,unknown>}})=>{
   const {operation,payload}=request;assert(!Object.keys(payload).some(k=>['key','password','secret'].includes(k)),'No secret IPC');
   const ok=(value:unknown)=>({protocolVersion:1,requestId:request.requestId,ok:true,value});
   const refused=(message:string)=>({protocolVersion:1,requestId:request.requestId,ok:false,error:{code:'FIXTURE_REFUSED',message}});
   const p=profiles.find((p:{profileId:string})=>p.profileId===(draft?.profileId??payload.profileId));
   switch(operation){
    case 'ai.profiles':
     if(confirmed){reloadReads++;if(!failedReload&&defect!=='absent-reload'){failedReload=true;return refused('One post-save read failed');}if(defect==='retry-mutates'&&reloadReads===3)profiles[0]!.revision++;}
     return ok(snapshot());
    case 'probe.windowsStudioStep':if(String(payload.step).endsWith('-observed')){holds.push(String(payload.step));return ok({observed:true});}return ok({recorded:true});
    case 'ai.beginConnection':{
     const saved=profiles.find((p:{profileId:string})=>p.profileId===payload.profileId);assert(saved);
     draft={draftId:'windows-draft-'+(++draftNumber),revision:1,profileId:saved.profileId,credentialReady:saved.credentialStatus==='configured',state:'ready',models:[],message:'Enter key, then Connect.'};return ok(structuredClone(draft));
    }
    case 'ai.enterConnectionKey':assert(draft);entries++;if(phase===1&&(entries===1||entries===4))return ok({...draft,cancelled:true});draft.revision++;draft.credentialReady=true;return ok(structuredClone(draft));
    case 'ai.connect':assert(draft);gets++;if(failedGet&&gets===2)return refused('Refused synthetic discovery');draft.state='connected';draft.models=['loomlight-synthetic-model'];draft.message='Connected. Choose a model, then Save profile.';return ok(structuredClone(draft));
    case 'ai.saveConnection':
     assert(p&&draft?.state==='connected');p.revision++;p.credentialStatus='configured';p.settings=structuredClone(payload.settings);p.discovery=null;
     confirmed=phase===2&&reloadProof;return ok({saved:true,profileId:p.profileId,cleanupPending:p.profileId===A&&defect!=='wrong-response'});
    case 'ai.discardConnection':if(draft?.draftId===payload.draftId)draft=undefined;return ok({});
    case 'ai.removeCredential':{
     const saved=profiles.find((p:{profileId:string})=>p.profileId===payload.profileId);assert(saved);removals++;saved.revision++;saved.disabled=true;saved.credentialStatus='missing';return ok({...snapshot(),saveStatus:'Removed'+(saved.profileId===A?'; cleanup pending':'')});
    }
    case 'ai.removeProfile':profiles=profiles.filter((p:{profileId:string})=>p.profileId!==payload.profileId);return ok(snapshot());
    case 'probe.runtimeUiReport':reports.push(payload);return ok({recorded:true});
    default:throw Error('Unexpected '+operation);
   }
  }}
 });
 Object.defineProperty(Reflect.get(browser,'__TAURI_INTERNALS__'),'invoke',{writable:false,configurable:false});
 let controller:ReturnType<typeof mountStudioSettings>|undefined;
 try{
  document.body.innerHTML='<button>Settings</button><button>AI providers</button><main></main><footer></footer>';
  document.querySelectorAll('button')[1]!.addEventListener('click',()=>{controller=mountStudioSettings(document.querySelector('main')!,document.querySelector('footer')!);});
  await browser.eval(script);assert.equal(reports.length,1);return {report:reports[0]!,entries,gets,removals,reloadReads,holds};
 }finally{controller?.dispose();await browser.happyDOM.close();}
}
test('prepared Windows probe drives both actual Settings phases with exact secret-free operations',{timeout:10000},async t=>{
 for(const phase of [1,2]){const r=await scenario(phase,false,false,'',false,t.signal);assert.equal(r.report.passed,true,JSON.stringify(r.report));assert.equal(r.entries,phase===1?4:1);assert.equal(r.gets,phase===1?4:3);assert.equal(r.removals,phase===1?0:2);}
});
test('Windows probe rejects failed discovery despite earlier availability',{timeout:5000},async t=>{
 const r=await scenario(2,true,false,'',false,t.signal);assert.equal(r.report.passed,false);assert.equal(r.gets,2);
});
test('Windows beta reload branch drives actual disabled controls and one read-only Retry, retaining original phase assertions',{timeout:5000},async t=>{
 const r=await scenario(2,false,true,'',false,t.signal);assert.equal(r.report.passed,true,JSON.stringify(r.report));assert.deepEqual(r.report.reloadResponse,{saved:true,profileId:A,cleanupPending:true});assert.equal(r.entries,1);assert.equal(r.gets,3);assert.equal(r.removals,2);
 for(const marker of ['Windows confirmed beta save requires read-only Settings reload','All Settings mutation and discovery controls disabled; read-only Retry enabled','Read-only Retry restored configured A without entry, Save or discovery'])assert((r.report.checks as string[]).includes(marker));
});
test('Windows beta reload gate rejects missing response, wrong pending status and Retry mutation',{timeout:5000},async t=>{
 for(const defect of ['absent-reload','wrong-response','retry-mutates']){const r=await scenario(2,false,true,defect,false,t.signal);assert.equal(r.report.passed,false,defect);assert.equal(r.entries,1);assert.equal(r.gets,2);assert.equal(r.removals,0);}
});
test('Windows beta reload gate rejects a Retry that enables controls without reading profiles',{timeout:5000},async t=>{
 const r=await scenario(2,false,true,'retry-noop',false,t.signal);assert.equal(r.report.passed,false);assert.equal(r.entries,1);assert.equal(r.gets,2);assert.equal(r.removals,0);
});
test('Windows current probe rejects a Retry inside a closed maintenance disclosure',{timeout:5000},async t=>{
 const r=await scenario(2,false,true,'closed-maintenance',true,t.signal);
 assert.equal(r.report.passed,false);assert.equal(r.gets,2);assert.equal(r.removals,0);
 assert.match(String(r.report.error),/Recovery Retry is rendered/);
});
test('opt-in evidence holds each confirmation and records actual client discovery intervals',{timeout:10000},async t=>{
 for(const phase of [1,2]){
  const r=await scenario(phase,false,phase===2,'',true,t.signal);assert.equal(r.report.passed,true,JSON.stringify(r.report));
  assert.deepEqual(r.holds,phase===1?['preflight-cancelled-observed','alpha-saved-observed','gamma-saved-observed','cancelled-observed','get-1-complete-observed','get-2-complete-observed','complete-observed']:['reopened-observed','get-1-complete-observed','beta-reload-observed','beta-reloaded-observed','get-2-complete-observed','removed-observed','complete-observed']);
  const timings=r.report.clientTimings as {actionStarted:number;requestStarted:number;requestEnded:number;completed:number}[];assert.equal(timings.length,2);for(const v of timings)assert(v.actionStarted<=v.requestStarted&&v.requestStarted<=v.requestEnded&&v.requestEnded<=v.completed);
 }
 const ordinary=await scenario(1,false,false,'',false,t.signal);assert.deepEqual(ordinary.holds,[]);assert.equal(ordinary.report.clientTimings,undefined);
});

test('Windows current validator accepts the real producer including early Cancel and reload',{timeout:10000},async t=>{
 for(const phase of [1,2]){
  const {report}=await scenario(phase,false,phase===2,'',true,t.signal);
  const result=spawnSync(process.env.HARNESS_PYTHON??(process.platform==='win32'?'python':'python3'),['-c',"import importlib.util,json,sys; s=importlib.util.spec_from_file_location('probe','scripts/studio_connection_native.py'); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); d=json.load(sys.stdin); p=d['phase']; m.validate_report([dict(evidence='runtime-ui-packaged',case='studio-settings',passed=True,cleanupComplete=True,details=d)],p,[dict(sequence=n+1,label=label,accepted=True) for n,label in enumerate(m.SCHEDULE[p])],0)"],{input:JSON.stringify(report),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }
});
