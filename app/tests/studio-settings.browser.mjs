import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const output=fileURLToPath(new URL('../../.toolchains/reports/studio-settings/',import.meta.url));await mkdir(output,{recursive:true});
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/studio-review',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="light"><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div class="app-shell"></div></body></html>'}));
 await page.addInitScript(()=>{
  let revision=0,profiles=[],cleanup=[];window.studioCalls=[];let keyStatus='missing';
  window.__TAURI_INTERNALS__={invoke:async(_,{request})=>{
   window.studioCalls.push(structuredClone(request));const {operation:op,payload:p}=request;let value={token:String(revision),profiles:structuredClone(profiles),cleanup};
   if(op==='ai.saveProfile'){revision++;if(profiles.length){profiles[0].settings=p.settings;profiles[0].revision++;profiles[0].discovery=null;}else profiles=[{profileId:'fixture',revision:1,settings:p.settings,credentialStatus:'missing',disabled:false,discovery:null}];}
   if(op==='ai.enterCredential'){keyStatus='configured';profiles[0].credentialStatus=keyStatus;profiles[0].revision++;revision++;}
   if(op==='ai.discover')profiles[0].discovery={models:['synthetic-model'],selectedAvailable:true,status:'model available; discovery only'};
   if(op==='ai.removeCredential'){profiles[0].disabled=true;profiles[0].credentialStatus='missing';profiles[0].discovery=null;revision++;}
   if(op==='ai.removeProfile'){profiles=[];revision++;}
   value={token:String(revision),profiles:structuredClone(profiles),cleanup};return{protocolVersion:1,requestId:request.requestId,ok:true,value};
  }};
 });
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/studio-review`);
 await page.evaluate(async()=>{const {openSettings}=await import('/src/settings-ui.ts');openSettings();});await page.getByRole('button',{name:'AI providers',exact:true}).click();
 await page.getByRole('button',{name:'Save profile',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('.studio-actions button').disabled);
 assert.deepEqual(await page.evaluate(()=>window.studioCalls.map(c=>c.operation)),['ai.profiles']);
 assert.equal(await page.locator('.studio-settings input[type="password"]').count(),0);
 await page.getByLabel('Model ID',{exact:true}).fill('synthetic-model');await page.getByRole('button',{name:'Save profile',exact:true}).click();await page.getByRole('button',{name:'Enter credential…',exact:true}).waitFor();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Enter credential…').disabled);
 assert.equal(await page.evaluate(()=>window.studioCalls.filter(c=>c.operation==='ai.discover').length),0,'save never discovers');
 await page.getByRole('button',{name:'Enter credential…',exact:true}).click();await page.getByRole('button',{name:'Replace credential…',exact:true}).waitFor();
 await page.screenshot({path:output+'studio-light-wide.png'});await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:output+'studio-dark-wide.png'});
 await page.getByRole('button',{name:'Refresh models',exact:true}).click();await page.getByText('model available; discovery only',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.studioCalls.filter(c=>c.operation==='ai.discover').length),1);
 await page.getByLabel('Maximum response',{exact:true}).fill('768');assert.equal(await page.getByRole('button',{name:'Refresh models',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Save profile',exact:true}).click();await page.getByText('Not checked for this saved configuration',{exact:true}).waitFor();
 await page.setViewportSize({width:600,height:720});await page.screenshot({path:output+'studio-dark-compact.png'});await page.evaluate(()=>document.documentElement.dataset.theme='light');await page.screenshot({path:output+'studio-light-compact.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'compact panel must not overflow');
 const panel=page.locator('.settings-content');await panel.evaluate(n=>n.scrollTop=n.scrollHeight);assert.equal(await page.getByRole('button',{name:'Remove profile',exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'Remove credential',exact:true}).click();await page.getByText('Credential: missing',{exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Refresh models',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Remove profile',exact:true}).click();await page.getByText('Credential: not configured',{exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>window.studioCalls.some(c=>Object.keys(c.payload).some(k=>/key|secret|password/i.test(k)))),false,'secret-free IPC');
 assert.deepEqual(errors,[]);console.log('Studio settings browser: PASS (no default network, explicit actions, invalidation, secret-free IPC, both themes/wide/compact)');
}finally{await browser?.close();await server.close();}
