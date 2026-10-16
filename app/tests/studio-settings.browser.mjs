/** Current Settings controller with a passive public IPC fixture; no native/HTTP acceptance. */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const output=process.env.LOOMLIGHT_UI_OUTPUT??fileURLToPath(new URL('../../.toolchains/reports/studio-settings/',import.meta.url));await mkdir(output,{recursive:true});
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 await page.route('**/*',route=>{const url=new URL(route.request().url());assert.equal(url.origin,origin,'external networking blocked');assert.equal(route.request().method(),'GET');return url.pathname==='/studio-review'?route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="light"><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div class="app-shell"></div></body></html>'}):route.continue();});
 await page.addInitScript(()=>{
  let revision=0,profiles=[],draft=null,sequence=0;window.studioCalls=[];
  const snapshot=()=>({token:String(revision),profiles:structuredClone(profiles),cleanup:[]});
  window.__TAURI_INTERNALS__={invoke:async(_,{request})=>{
   window.studioCalls.push(structuredClone(request));const {operation:op,payload:p}=request;let value;
   if(op==='ai.profiles')value=snapshot();
   else if(op==='ai.beginConnection'){draft={draftId:'browser-'+(++sequence),revision:1,credentialReady:profiles.some(v=>v.profileId===p.profileId&&v.credentialStatus==='configured'),state:'ready',message:'Enter key, then Connect.',models:[]};value=structuredClone(draft);}
   else if(op==='ai.enterConnectionKey'){draft.revision++;draft.credentialReady=true;value=structuredClone(draft);}
   else if(op==='ai.connect'){if(!draft.credentialReady)throw Error('No native draft key');draft.state='connected';draft.message='Connected. Choose a model, then Save profile.';draft.models=['synthetic-model'];value=structuredClone(draft);}
   else if(op==='ai.saveConnection'){if(draft.state!=='connected')throw Error('No discovery');revision++;profiles=[{profileId:'fixture',revision,settings:p.settings,credentialStatus:'configured',disabled:false,discovery:null}];value={saved:true,profileId:'fixture',cleanupPending:false};}
   else if(op==='ai.saveProfile'){revision++;profiles[0].settings=p.settings;profiles[0].revision++;value=snapshot();}
   else if(op==='ai.discardConnection'){if(draft?.draftId===p.draftId)draft=null;value={};}
   else if(op==='ai.removeCredential'){profiles[0].disabled=true;profiles[0].credentialStatus='missing';revision++;value=snapshot();}
   else if(op==='ai.removeProfile'){profiles=[];revision++;value=snapshot();}
   else throw Error('Unexpected operation '+op);
   return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }};
 });
 await page.goto(origin+'/studio-review');await page.evaluate(async()=>{const {openSettings}=await import('/src/settings-ui.ts');openSettings();});await page.getByRole('button',{name:'AI providers',exact:true}).click();
 const settled=()=>page.locator('.studio-settings[data-busy="false"]').waitFor();await settled();
 assert.deepEqual(await page.evaluate(()=>window.studioCalls.map(c=>c.operation)),['ai.profiles']);
 assert.equal(await page.getByLabel('Thinking',{exact:true}).isChecked(),true);assert.equal(await page.getByLabel('Maximum response length',{exact:true}).inputValue(),'16384');assert.equal(await page.getByRole('button',{name:'Save profile',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Enter credential…',exact:true}).click();await settled();assert.equal(await page.getByRole('button',{name:'Save profile',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Connect',exact:true}).click();await settled();await page.getByLabel('Model ID',{exact:true}).fill('synthetic-model');await page.getByRole('button',{name:'Save profile',exact:true}).click();await settled();
 assert.equal(await page.getByRole('button',{name:'Replace credential…',exact:true}).isEnabled(),true);
 await page.getByLabel('Maximum response length',{exact:true}).fill('768');await page.getByLabel('Thinking',{exact:true}).uncheck();await page.getByRole('button',{name:'Save profile',exact:true}).click();await settled();
 await page.getByText('Profile maintenance',{exact:true}).click();await page.getByRole('button',{name:'Reload profiles',exact:true}).click();await settled();assert.equal(await page.getByLabel('Thinking',{exact:true}).isChecked(),false);assert.equal(await page.getByLabel('Maximum response length',{exact:true}).inputValue(),'768');
 for(const [size,width,height]of [['wide',1440,1000],['compact',600,720]])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.getByLabel('Thinking',{exact:true}).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:path.join(output,`studio-${theme}-${size}.png`)});
 }
 await page.getByRole('button',{name:'Remove credential',exact:true}).click();await settled();assert.equal(await page.getByRole('button',{name:'Connect',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Remove profile',exact:true}).click();await page.getByRole('button',{name:'Remove profile',exact:true}).click();await settled();
 assert.equal(await page.locator('.studio-settings input[type="password"]').count(),0);
 assert.equal(await page.evaluate(()=>window.studioCalls.some(c=>Object.keys(c.payload).some(k=>/key|secret|password/i.test(k)))),false);
 assert.equal(await page.evaluate(()=>window.studioCalls.some(c=>['ai.testCompatibility','ai.syntheticRequest','ai.startRequest'].includes(c.operation))),false);
 assert.deepEqual(errors,[]);console.log('PASS: current Settings native-draft IPC sequence, explicit Connect/Save, thinking persistence, no generation, secret-free payloads and four layout captures');
}finally{await browser?.close();await server.close();}
