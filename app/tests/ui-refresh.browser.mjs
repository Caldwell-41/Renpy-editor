import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser;
const output=fileURLToPath(new URL('../../.toolchains/reports/ui-refresh/',import.meta.url));
await mkdir(output,{recursive:true});
try {
 await server.listen();const address=server.httpServer.address();
 try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.setDefaultTimeout(8000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/ui-review',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="light"><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div id="app"></div></body></html>'}));
 await page.addInitScript(()=>{
  let preferences={schemaVersion:1,theme:'system',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
  window.__TAURI_INTERNALS__={invoke:async(_command,{request})=>{
   let value={};
   if(request.operation==='preferences.write')preferences=structuredClone(request.payload);
   if(request.operation.startsWith('preferences.'))value=preferences;
   if(request.operation==='system.version')value={applicationVersion:'0.1.0',protocolVersion:1};
   return {protocolVersion:1,requestId:request.requestId,ok:true,value};
  }};
 });
 await page.goto(`http://127.0.0.1:${address.port}/ui-review`);
 await page.evaluate(async()=>{
  const {startApplication}=await import('/src/main.ts');
  startApplication(async(operation,payload={})=>{
   let value={};
   if(operation==='project.listRecent')value=[{id:'tram',projectId:'tram',title:'The Last Tram',displayPath:'Documents / Stories / The Last Tram',lastOpenedUnixMs:Date.UTC(2026,8,29),status:'available'},{id:'morning',projectId:'morning',title:'A Quiet Morning',displayPath:'Documents / Stories / A Quiet Morning',lastOpenedUnixMs:Date.UTC(2026,8,28),status:'available'}];
   if(operation==='system.folderName')value={folderName:payload.title.toLowerCase().replaceAll(' ','-')};
   if(operation==='project.chooseParent')value={id:'parent',displayPath:'Documents / Stories'};
   if(operation==='project.validateDestination')value={valid:true,displayPath:`Documents / Stories / ${payload.folderName}`,message:'Available'};
   if(operation==='sdk.discover')value=[{id:'sdk',version:'8.5.3',displayName:'Ren’Py 8.5.3',source:'managed',compatible:true,explanation:'Ready to use'}];
   return {protocolVersion:1,requestId:'fixture',ok:true,value};
  });
 });
 await page.locator('.recent-open').first().waitFor();
 await page.screenshot({path:output+'welcome-light.png'});
 await page.evaluate(()=>document.documentElement.dataset.theme='dark');await page.screenshot({path:output+'welcome-dark.png'});
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.screenshot({path:output+'settings-dark.png'});
 await page.getByRole('button',{name:'Close settings'}).click();
 await page.getByRole('button',{name:'New Project',exact:true}).click();
 await page.getByLabel('Game title').fill('The Last Tram');await page.getByRole('button',{name:'Choose parent directory',exact:true}).click();
 await page.getByText('Available',{exact:false}).waitFor();await page.screenshot({path:output+'wizard-details.png'});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('radio').waitFor();await page.screenshot({path:output+'wizard-sdk.png'});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.screenshot({path:output+'wizard-configuration.png'});
 await page.getByRole('button',{name:'Continue',exact:true}).click();await page.screenshot({path:output+'wizard-review.png'});
 const before=await page.locator('.wizard-panel').boundingBox();
 await page.evaluate(()=>{const s=document.querySelector('#app-status');for(let i=0;i<100;i++)s.textContent=i%2?'Unsaved Source draft':'Saved';});
 assert.deepEqual(await page.locator('.wizard-panel').boundingBox(),before,'status changed content geometry');
 await page.setViewportSize({width:560,height:480});await page.screenshot({path:output+'wizard-compact.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'horizontal overflow at minimum window');
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(async()=>{const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();const {visualRequest}=await import('/tests/ui-refresh-fixture.ts');const {startApplication}=await import('/src/main.ts');startApplication(visualRequest);});
 await page.locator('.recent-open').click();await page.getByRole('button',{name:'Add Beat',exact:true}).waitFor();
 for(const theme of ['light','dark']){await page.evaluate(async theme=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({theme});},theme);for(const surface of ['Story','Source','Branches','Characters','Assets','Variables']){await page.getByRole('button',{name:surface,exact:true}).click();await page.locator('#app-status').filter({hasText:'Saved'}).waitFor();if(surface==='Source')await page.locator('.cm-content').waitFor();if(surface==='Branches')await page.locator('.branch-node').first().waitFor();if(surface==='Story')await page.locator('.beat-select').nth(2).click();await page.waitForFunction(()=>[...document.querySelectorAll('.catalog-thumbnail')].every(i=>(i.getAttribute('src')&&i.complete)||i.alt==='Preview unavailable'));await page.screenshot({path:output+surface.toLowerCase()+'-'+theme+'.png'});}}
 await page.setViewportSize({width:1280,height:800});await page.getByRole('button',{name:'Story',exact:true}).click();await page.getByRole('button',{name:'Add Beat',exact:true}).waitFor();await page.screenshot({path:output+'story-laptop.png'});
 await page.setViewportSize({width:560,height:480});await page.getByRole('button',{name:'Source',exact:true}).click();await page.locator('.cm-content').waitFor();await page.screenshot({path:output+'source-minimum.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'source minimum horizontal overflow');
 await page.setViewportSize({width:2560,height:1440});await page.getByRole('button',{name:'Story',exact:true}).click();await page.getByRole('button',{name:'Add Beat',exact:true}).waitFor();await page.screenshot({path:output+'story-1440p.png'});
 await page.setViewportSize({width:1280,height:800});
 for(const density of ['small','large','default']){await page.evaluate(async density=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({density});},density);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${density} interface size`);}
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.screenshot({path:output+'settings-updated.png'});
 await page.setViewportSize({width:560,height:480});await page.screenshot({path:output+'settings-compact.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Settings minimum overflow');await page.getByRole('button',{name:'Close settings'}).click();
 await page.getByRole('button',{name:'Source',exact:true}).click();await page.locator('.cm-content').waitFor();await page.locator('.cm-content').focus();
 const stableBefore=await page.locator('.source-editor-shell').boundingBox();
 await page.evaluate(()=>{for(let i=0;i<50;i++){document.querySelector('#app-status').textContent=i%2?'Unsaved Source draft':'Saved';document.querySelector('.source-draft-warning').hidden=Boolean(i%2);}});
 assert.deepEqual(await page.locator('.source-editor-shell').boundingBox(),stableBefore,'Source status and warning visibility moved editor');assert.equal(await page.locator('.cm-content').evaluate(el=>document.activeElement===el),true,'status update stole focus');
 const rawEvidence=await page.evaluate(async()=>{const {losslessEditorProof}=await import('/tests/source-editor-browser-proof.ts');return losslessEditorProof();});
 assert.equal(rawEvidence.after,rawEvidence.raw.replace('A','Alpha').replace('B','Beta'));assert.equal(rawEvidence.restored,rawEvidence.raw,'rich editor undo preserves mixed line endings');
 assert.deepEqual(errors,[]);
 // Run the shipped native smoke interaction script against real CodeMirror DOM.
 // The desktop/security responses remain stubbed; this checks the driver, not native security.
 const probe=await browser.newPage({viewport:{width:1440,height:900}});
 await probe.route('**/ui-probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div id="app"></div></body></html>'}));
 await probe.goto(`http://127.0.0.1:${address.port}/ui-probe`);
 await probe.evaluate(async()=>{
  window.__loomlightScaffoldSmokeMode=true;window.__loomlightUnauthorisedDenied=true;
  window.__TAURI_INTERNALS__={invoke:async(command,args)=>{
   if(command!=='core_request')throw Error('Denied command stub');
   const request=args.request;
   if(request.operation==='probe.smokeReport'){window.__reviewProbeReport=request.payload;return {ok:true};}
   if(request.operation==='system.health')return Object.keys(request.payload).length?{ok:false,error:{code:'INVALID_PAYLOAD'}}:{ok:true,value:{status:'ready'}};
   if(request.operation==='probe.smokeCheckpoint')return {ok:true};
   return {protocolVersion:1,requestId:request.requestId,ok:true,value:[]};
  }};
  window.fetch=async()=>{throw Error('Denied network stub');};window.open=()=>null;
  const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
  const {startApplication}=await import('/src/main.ts');startApplication(async()=>({protocolVersion:1,requestId:'stub',ok:true,value:[]}));
 });
 await probe.addScriptTag({content:await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8')});
 await probe.addScriptTag({content:await readFile(new URL('../src-tauri/src/smoke_probe.js',import.meta.url),'utf8')});
 await probe.waitForFunction(()=>window.__reviewProbeReport,{},{timeout:30000});
 const report=await probe.evaluate(()=>window.__reviewProbeReport);
 for(const key of ['supportingAuthoringUiPassed','sceneAuthoringUiPassed','sourceAuthoringUiPassed','sourceCommandTracePassed'])assert.equal(report[key],true,JSON.stringify(report));
 await probe.close();
 console.log('PASS: all six workspaces in both themes; onboarding, Settings, minimum/laptop layouts, stable status geometry; mixed-newline rich editor undo; shipped smoke interactions against CodeMirror. Fixture bridge only; not native SDK or security proof.');
} finally {await browser?.close();await server.close();}
