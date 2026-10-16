/** Real rendered Settings/probe/close-guard integration. Synthetic IPC is not native proof. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

const output=process.env.LOOMLIGHT_RECOVERY_OUTPUT;
assert(output,'Explicit evidence output required');await mkdir(output,{recursive:true});
const probe=await readFile(new URL('../src-tauri/src/windows_studio_probe.js',import.meta.url),'utf8');
const helper=await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8');
const fixture=JSON.parse(await readFile(new URL('./fixtures/windows-studio-credentials.json',import.meta.url),'utf8'));
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;const cases=[];let passed=false;
try{
 await server.listen();const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 try{browser=await chromium.launch({channel:'chrome',headless:true});}catch{browser=await chromium.launch({headless:true});}
 for(const [defect,width,height] of [['none',992,665],['none',1440,900],['collapsed-retry',992,665],['disabled-retry',992,665]]){
  const page=await browser.newPage({viewport:{width,height}});page.setDefaultTimeout(5000);const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.route('**/*',route=>{
    const url=new URL(route.request().url());assert.equal(url.origin,origin,'Only local fixture resources allowed');assert.equal(route.request().method(),'GET');
    return url.pathname==='/connection-recovery'?route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div id="app"></div></body></html>'}):route.continue();
   });
   await page.exposeFunction('__observeRecovery',async()=>{
    assert.equal(await page.getByText('Profile saved; saved profiles could not be reloaded. Retry loading profiles before further changes.',{exact:true}).isVisible(),true,'Reload error must be rendered');
    const retry=page.getByRole('button',{name:'Retry loading profiles',exact:true});
    if(!await retry.isVisible())throw Error('Rendered recovery Retry is not visible');
    if(!await retry.isEnabled())throw Error('Rendered recovery Retry is disabled');
    assert.equal(await page.locator('.studio-maintenance').evaluate(n=>n.open),true);
    for(const name of ['Save profile','Connect','Replace credential…','Remove credential'])assert.equal(await page.getByRole('button',{name,exact:true}).isDisabled(),true,name);
    return true;
   });
   await page.goto(origin+'/connection-recovery');
   await page.evaluate(async({fixture,defect})=>{
    const A=fixture.profiles[0].profileId;let profiles=fixture.profiles.map(p=>({profileId:p.profileId,revision:2,settings:p.settings,disabled:false,credentialStatus:'configured',discovery:null}));
    let draft,confirmed=false,refused=false;window.recoveryEvidence={calls:[],reports:[],gets:0,closeCommands:0,observationFailure:null};
    const snapshot=()=>structuredClone({token:profiles.map(p=>p.revision).join('-'),profiles,cleanup:[{profileId:A,deferred:false}]});
    const request=async(operation,payload={})=>{
     window.recoveryEvidence.calls.push(operation);let value={};
     if(operation==='project.listRecent')value=[];
     else if(operation.startsWith('preferences.'))value={schemaVersion:1,theme:'system',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
     else if(operation==='system.version')value={applicationVersion:'0.1.0',protocolVersion:1};
     else if(operation==='ai.profiles'){
      if(confirmed&&!refused){refused=true;throw Error('One selected post-save snapshot refusal');}value=snapshot();
     }else if(operation==='ai.beginConnection'){
      const p=profiles.find(p=>p.profileId===payload.profileId);draft={draftId:'browser-owned-draft',profileId:p.profileId,revision:1,credentialReady:true,state:'ready',models:[],message:'Connect to retrieve models.'};value=structuredClone(draft);
     }else if(operation==='ai.enterConnectionKey'){draft.revision++;value=structuredClone(draft);}
     else if(operation==='ai.connect'){window.recoveryEvidence.gets++;draft.state='connected';draft.models=['loomlight-synthetic-model'];draft.message='Connected. Choose a model, then Save profile.';value=structuredClone(draft);}
     else if(operation==='ai.saveConnection'){const p=profiles.find(p=>p.profileId===draft.profileId);p.revision++;p.settings=structuredClone(payload.settings);confirmed=true;value={saved:true,profileId:p.profileId,cleanupPending:true};}
     else if(operation==='ai.discardConnection')value={};
     else if(operation==='ai.removeCredential'){const p=profiles.find(p=>p.profileId===payload.profileId);p.revision++;p.disabled=true;p.credentialStatus='missing';value={...snapshot(),saveStatus:p.profileId===A?'Removed; cleanup pending':'Removed'};}
     else if(operation==='ai.removeProfile'){profiles=profiles.filter(p=>p.profileId!==payload.profileId);value=snapshot();}
     else if(operation==='probe.windowsStudioStep'){
      if(payload.step==='beta-reload-required'){
       if(defect==='collapsed-retry')document.querySelector('.studio-maintenance').open=false;
       if(defect==='disabled-retry')[...document.querySelectorAll('button')].find(n=>n.textContent==='Retry loading profiles').disabled=true;
      }
      if(payload.step==='beta-reload-observed'){
       try{await window.__observeRecovery();}catch(error){window.recoveryEvidence.observationFailure=error.message;throw error;}
      }
      value={observed:true,recorded:true};
     }else if(operation==='probe.runtimeUiReport'){window.recoveryEvidence.reports.push(payload);value={recorded:true};}
     else throw Error('Unexpected fixture operation '+operation);
     return value;
    };
    window.__TAURI_INTERNALS__={invoke:async(command,{request:r}={})=>{
     if(command==='complete_application_close'){window.recoveryEvidence.closeCommands++;return;}
     if(command!=='core_request')throw Error('Unexpected command');
     assertPublic(r.payload);
     try{return {protocolVersion:1,requestId:r.requestId,ok:true,value:await request(r.operation,r.payload)};}
     catch(error){return {protocolVersion:1,requestId:r.requestId,ok:false,error:{code:'FIXTURE_REFUSED',message:error.message}};}
    }};
    function assertPublic(payload){if(Object.keys(payload).some(k=>['key','secret','password'].includes(k)))throw Error('Secret IPC refused');}
    const {startApplication}=await import('/src/main.ts');
    startApplication(async(op,payload={})=>({protocolVersion:1,requestId:'shell-fixture',ok:true,value:await request(op,payload)}));
    window.__loomlightWindowsStudioPhase=2;window.__loomlightWindowsEvidence=true;window.__loomlightWindowsReloadProof=true;
   },{fixture,defect});
   await page.getByRole('button',{name:'Settings',exact:true}).waitFor();
   await page.evaluate(source=>window.eval(source),helper);
   await page.evaluate(source=>window.eval(source),probe);
   const result=await page.evaluate(()=>window.recoveryEvidence);
   assert.equal(result.reports.length,1);assert.equal(result.reports[0].passed,defect==='none',JSON.stringify(result));
   assert.equal(result.gets,defect==='none'?3:2);
   if(defect!=='none')assert.match(result.observationFailure,/Retry is (?:not visible|disabled)/);
   // Known-bad cleanup must be refused by the real main.ts guard while Settings is open.
   await page.evaluate(()=>window.__loomlightRequestApplicationClose());
   assert.equal(await page.evaluate(()=>window.recoveryEvidence.closeCommands),0,'Open Settings must block application close');
   await page.getByRole('button',{name:'Close settings',exact:true}).click();
   assert.equal(await page.locator('[aria-modal="true"]').count(),0);
   await page.evaluate(()=>window.__loomlightRequestApplicationClose());
   await page.waitForFunction(()=>window.recoveryEvidence.closeCommands===1);
   assert.deepEqual(errors,[]);
   cases.push({defect,width,height,reportPassed:result.reports[0].passed,GETs:result.gets,closeGuardRejectedOpenModal:true,closeCompletedAfterSettings:true});
  }finally{await page.close();}
 }
 passed=true;
}finally{
 const cleanup={browser:'not-started',server:'not-started'},failures=[];
 try{await browser?.close();cleanup.browser='closed';}catch(error){cleanup.browser='failed';failures.push(error);}
 try{await server.close();cleanup.server='closed';}catch(error){cleanup.server='failed';failures.push(error);}
 await writeFile(`${output}/result.json`,JSON.stringify({passed:passed&&failures.length===0,layer:'Chromium production renderer/probe/app-close guard with synthetic IPC; not native acceptance',browser:browser?.version(),cases,cleanup},null,2)+'\n');
 if(failures.length)throw new AggregateError(failures,'Recovery browser cleanup failed');
}
console.log('PASS: rendered recovery visibility, rejecting cases and actual Settings/application close guard');
