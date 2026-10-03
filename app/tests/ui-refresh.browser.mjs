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

 // Review corrections: controls preserve independent panels and active content.
 // Sidebar controls must fit the existing tracks and never obscure editor headers.
 for(const theme of ['light','dark']) for(const surface of ['Story','Source']) {
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async theme=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({theme});},theme);
  await page.getByRole('button',{name:surface,exact:true}).click();
  await page.locator(surface==='Story'?'.scene-header':'.source-tab-bar').waitFor();
  for(const width of [1440,960,560]) for(const navClosed of [false,true]) for(const treeClosed of [false,true]) {
   await page.setViewportSize({width,height:900});
   const nav=page.locator('.navigation-toggle');
   if((await nav.getAttribute('aria-expanded'))!==String(!navClosed)) await nav.click();
   const treeChanged=(await page.locator('.project-tree-toggle').getAttribute('aria-expanded'))!==String(!treeClosed);
   if(treeChanged) await page.locator(treeClosed?'.project-tree-toggle':'.tree-restore').click();
   const m=await page.evaluate(()=>{
    const box=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
    const nav=document.querySelector('.story-sidebar'),toggle=document.querySelector('.navigation-toggle'),tree=document.querySelector('.project-tree-panel'),treeToggle=document.querySelector('.project-tree-toggle'),restore=document.querySelector('.tree-restore');
    const title=document.querySelector('.scene-header h1');let titleBox;
    if(title){const r=document.createRange();r.selectNodeContents(title);titleBox=box(r);}
    const source=document.querySelector('.source-tab-group');
    return {nav:box(nav),toggle:box(toggle),navOverflow:nav.scrollWidth>nav.clientWidth+1,tree:box(tree),treeToggle:box(treeToggle),restore:box(restore),title:titleBox,source:source?box(source):null,arrow:toggle.querySelector('path').getAttribute('d'),restoreArrow:restore.querySelector('path').getAttribute('d'),hideArrow:treeToggle.querySelector('path').getAttribute('d')};
   });
   assert.equal(Math.round(m.nav.width),navClosed?64:180,JSON.stringify(m));
   assert.equal(m.navOverflow,false,`sidebar control introduced horizontal overflow: ${JSON.stringify(m)}`);
   assert.equal(m.toggle.width,32);assert.equal(m.toggle.height,32);
   assert.ok(m.toggle.x>=m.nav.x&&m.toggle.right<=m.nav.right);
   assert.equal(m.arrow,navClosed?m.restoreArrow:m.hideArrow,'navigation arrow did not reflect state');
   assert.notEqual(m.restoreArrow,m.hideArrow,'restore arrow must point the opposite way');
   if(treeClosed){
    assert.ok(m.restore.right<=(m.title??m.source).x,`restore control overlaps editor heading/tabs: ${JSON.stringify(m)}`);
    if(treeChanged)assert.equal(await page.locator('.tree-restore').evaluate(e=>document.activeElement===e),true);
   }else{
    assert.equal(Math.round(m.tree.width),230);
    assert.equal(m.toggle.y,m.treeToggle.y,'sidebar header controls are not aligned');
    assert.ok(m.treeToggle.x>=m.tree.x&&m.treeToggle.right<=m.tree.right);
   }
  }
  await page.screenshot({path:output+`sidebar-corrected-${surface.toLowerCase()}-${theme}-compact.png`});
  await page.setViewportSize({width:1440,height:900});
  await page.locator('.navigation-toggle').click();
  await page.locator('.tree-restore').click();
 }
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Story',exact:true}).click();
 await page.evaluate(()=>window.dispatchEvent(new Event('loomlight-reset-layout')));
 await page.screenshot({path:output+'sidebar-corrected-expanded.png'});
 const treeBefore=await page.locator('.project-tree-panel').boundingBox();
 await page.getByRole('button',{name:'Toggle navigation size'}).click();
 assert.equal(await page.locator('.story-sidebar').evaluate(el=>Math.round(el.getBoundingClientRect().width)),64);
 assert.equal(await page.locator('.project-tree-panel').evaluate(el=>getComputedStyle(el).display),'block');
 assert.equal((await page.locator('.project-tree-panel').boundingBox()).width,treeBefore.width);
 assert.equal(await page.getByRole('button',{name:'The Apartment',exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'Toggle chapter Chapter One'}).click();
 assert.equal(await page.getByRole('button',{name:'The Apartment',exact:true}).isVisible(),false);
 assert.equal(await page.locator('.scene-header h1').textContent(),'The Apartment');
 await page.getByRole('button',{name:'Toggle chapter Chapter One'}).click();
 await page.getByRole('button',{name:'Writing focus',exact:true}).click();
 assert.equal(await page.locator('.story-sidebar').isVisible(),false);
 assert.equal(await page.locator('.project-tree-panel').isVisible(),false);
 await page.getByRole('button',{name:'Exit Writing focus',exact:true}).click();
 assert.equal(await page.locator('.story-sidebar').evaluate(el=>Math.round(el.getBoundingClientRect().width)),64);
 await page.getByRole('button',{name:'Toggle navigation size'}).click();
 await page.locator('.beat-select').nth(3).click();
 await page.getByRole('button',{name:'Create New Scene',exact:true}).click();
 const choice=await page.locator('.expanded-beat').boundingBox();
 const sceneForm=await page.locator('.choice-new-scene').boundingBox();
 assert.ok(sceneForm.x>=choice.x && sceneForm.x+sceneForm.width<=choice.x+choice.width+1);
 assert.ok((await page.getByRole('button',{name:'Create New Scene',exact:true}).boundingBox()).height<=48);
 await page.screenshot({path:output+'choice-corrections.png'});
 await page.locator('.choice-new-scene').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.locator('.expanded-beat>.row-actions').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Characters',exact:true}).click();
 await page.getByRole('button',{name:'List view',exact:true}).click();
 await page.locator('.catalog-grid .entity-row').nth(1).locator('code').click();
 assert.equal(await page.locator('.catalog-inspector h2').textContent(),'Alice');
 await page.getByRole('button',{name:'Edit Alice',exact:true}).click();
 assert.equal(await page.getByRole('dialog',{name:'Edit Alice',exact:true}).isVisible(),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.getByRole('dialog').count(),0);
 await page.getByRole('button',{name:'Edit Alice',exact:true}).click();
 await page.keyboard.press('Escape'); // Reopening after dismissal must work.
 await page.getByRole('button',{name:'New character',exact:true}).click();
 await page.locator('[aria-modal="true"] input[name="technicalName"]').fill('BEC');
 await page.locator('[aria-modal="true"] input[name="displayName"]').focus();
 assert.equal(await page.locator('[aria-modal="true"] input[name="technicalName"]').inputValue(),'bec');
 await page.screenshot({path:output+'character-modal.png'});
 await page.getByRole('button',{name:'Close New character',exact:true}).click();
 await page.getByRole('button',{name:'Discard changes',exact:true}).click();
 assert.equal(await page.getByRole('dialog').count(),0);
 await page.screenshot({path:output+'characters-list-corrections.png'});
 await page.getByRole('button',{name:'Assets',exact:true}).click();
 assert.equal(await page.locator('.asset-drop-target').isVisible(),true);
 await page.evaluate(()=>window.__loomlightAssetDragState(true));
 assert.equal(await page.locator('.asset-drop-target').getAttribute('data-dragging'),'true');
 await page.evaluate(()=>window.__loomlightAssetDragState(false));
 await page.getByRole('button',{name:'Branches',exact:true}).click();
 assert.ok(await page.locator('.branches-lines path').count()>0);
 await page.getByRole('button',{name:'Scene details',exact:true}).click();
 await page.getByRole('button',{name:'Close Scene details'}).click();
 assert.equal(await page.locator('.branches-controls').isVisible(),false);
 await page.getByRole('button',{name:'Scene details',exact:true}).click();
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('.branches-controls').isVisible(),false);
 await page.getByRole('button',{name:'Source',exact:true}).click();
 for(let i=1;i<=12;i++) await page.getByRole('button',{name:`scenes/extra_scene_${i}.rpy`,exact:true}).click();
 assert.equal(await page.locator('.source-tab-group[data-active="true"]').innerText(),'extra_scene_12.rpy\n×');
 await page.waitForFunction(()=>{const tabs=document.querySelector('.source-tabs').getBoundingClientRect(),active=document.querySelector('.source-tab-group[data-active="true"]').getBoundingClientRect();return active.left>=tabs.left-1&&active.right<=tabs.right+1;});
 const tabViewport=await page.locator('.source-tabs').boundingBox();const activeTab=await page.locator('.source-tab-group[data-active="true"]').boundingBox();
 assert.ok(activeTab.x>=tabViewport.x-1 && activeTab.x+activeTab.width<=tabViewport.x+tabViewport.width+1);
 assert.equal(await page.getByRole('combobox',{name:'Open files',exact:true}).isVisible(),true);
 assert.equal(await page.locator('.source-file-row.selected').innerText(),'scenes/extra_scene_12.rpy');
 await page.screenshot({path:output+'source-tabs-overflow.png'});
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
 await probe.evaluate(()=>{
  const original=HTMLButtonElement.prototype.click;
  HTMLButtonElement.prototype.click=function(){
   if(this.disabled||!this.checkVisibility({visibilityProperty:true}))throw Error(`Smoke clicked unavailable control: ${this.textContent}`);
   return original.call(this);
  };
 });
 await probe.addScriptTag({content:await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8')});
 await probe.addScriptTag({content:await readFile(new URL('../src-tauri/src/smoke_probe.js',import.meta.url),'utf8')});
 await probe.waitForFunction(()=>window.__reviewProbeReport,{},{timeout:30000});
 const report=await probe.evaluate(()=>window.__reviewProbeReport);
 for(const key of ['supportingAuthoringUiPassed','sceneAuthoringUiPassed','sourceAuthoringUiPassed','sourceCommandTracePassed'])assert.equal(report[key],true,JSON.stringify(report));
 await probe.close();
 // Exercise the shipped UI probe itself, including contention while source input
 // is being retained. This is a browser/driver regression, not native acceptance.
 const refresh=await browser.newPage({viewport:{width:1440,height:900}});
 await refresh.route('**/refresh-probe',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div id="app"></div></body></html>'}));
 await refresh.goto(`http://127.0.0.1:${address.port}/refresh-probe`);
 await refresh.evaluate(async()=>{
  const {visualRequest}=await import('/tests/ui-refresh-fixture.ts');
  let loadingScene=false;
  const request=async(operation,payload={})=>{
   if(operation==='scene.list'){
    loadingScene=true;
    try{await new Promise(resolve=>setTimeout(resolve,1200));return await visualRequest(operation,payload);}
    finally{loadingScene=false;}
   }
   if(loadingScene&&operation==='source.list')return {protocolVersion:1,requestId:'fixture',ok:false,error:{code:'RUNTIME_BUSY',message:'Initial scene observation owns the service'}};
   return visualRequest(operation,payload);
  };
  let preferences={schemaVersion:1,theme:'system',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
  const busy=new Map([['project.current',2],['source.list',2],['preferences.write',1]]);
  window.__TAURI_INTERNALS__={invoke:async(_command,{request})=>{
   const response=value=>({protocolVersion:1,requestId:request.requestId,ok:true,value});
   if(request.operation==='probe.runtimeUiReport'){window.__refreshReport=request.payload;window.__busyRemaining=[...busy.values()];return response(null);}
   const remaining=busy.get(request.operation)??0;
   if(remaining){busy.set(request.operation,remaining-1);return {protocolVersion:1,requestId:request.requestId,ok:false,error:{code:'RUNTIME_BUSY',message:'Observation overlaps draft retention'}};}
   if(request.operation==='preferences.write'){preferences=request.payload;return response(preferences);}
   if(request.operation==='preferences.read')return response(preferences);
   return {...await visualRequest(request.operation,request.payload),requestId:request.requestId};
  }};
  const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
  const {startApplication}=await import('/src/main.ts');startApplication(request);
 });
 await refresh.addScriptTag({content:await readFile(new URL('../src-tauri/src/native_editor_probe.js',import.meta.url),'utf8')});
 await refresh.addScriptTag({content:await readFile(new URL('../src-tauri/src/ui_refresh_probe.js',import.meta.url),'utf8')});
 await refresh.waitForFunction(()=>window.__refreshReport,{},{timeout:30000});
 const refreshReport=await refresh.evaluate(()=>window.__refreshReport);
 assert.equal(refreshReport.passed,true,JSON.stringify(refreshReport));assert.equal(refreshReport.checks.length,9);
 assert.deepEqual(await refresh.evaluate(()=>window.__busyRemaining),[0,0,0]);
 await refresh.close();
 // A user may navigate as soon as the shell appears, before a large Story read
 // finishes. Verify the application orders that read ahead of Source loading.
 const early=await browser.newPage({viewport:{width:1100,height:720}});
 await early.route('**/early-navigation',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><div id="app"></div>'}));
 await early.goto(`http://127.0.0.1:${address.port}/early-navigation`);
 await early.evaluate(async()=>{
  const {visualRequest}=await import('/tests/ui-refresh-fixture.ts');
  let held=false;window.__earlyContention=0;
  const request=async(operation,payload={})=>{
   if(operation==='scene.list'){
    held=true;window.__earlyReadStarted=true;
    try{await new Promise(resolve=>setTimeout(resolve,1200));return await visualRequest(operation,payload);}
    finally{held=false;}
   }
   if(operation==='source.list'&&held){window.__earlyContention++;return {protocolVersion:1,requestId:'fixture',ok:false,error:{code:'RUNTIME_BUSY',message:'Initial observation owns service'}};}
   return visualRequest(operation,payload);
  };
  const {enableRichSourceEditor}=await import('/src/source-editor.ts');enableRichSourceEditor();
  const {startApplication}=await import('/src/main.ts');startApplication(request);
 });
 await early.locator('.recent-open').click();
 await early.waitForFunction(()=>window.__earlyReadStarted);
 await early.getByRole('button',{name:'Source',exact:true}).click();
 await early.locator('.cm-content[contenteditable="true"]').waitFor({timeout:5000});
 assert.equal(await early.evaluate(()=>window.__earlyContention),0,'Source raced the in-flight Story read');
 await early.close();
 // Audit regressions use the production renderer with explicitly deferred receipts.
 // Pointer gestures here are browser evidence; native WebView/Explorer drops remain separate.
 const audit=await browser.newPage({viewport:{width:1440,height:900}});
 audit.setDefaultTimeout(8000);
 audit.on('pageerror',e=>errors.push(e.message));
 await audit.route('**/audit-regressions',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><div id="app"></div>'}));
 await audit.goto(`http://127.0.0.1:${address.port}/audit-regressions`);
 await audit.evaluate(async()=>{
  const {visualRequest}=await import('/tests/ui-refresh-fixture.ts');const {startApplication}=await import('/src/main.ts');
  let preferences={schemaVersion:1,theme:'light',density:'default',sourceFontSize:14,rememberLayout:true,layouts:{}};
  window.__TAURI_INTERNALS__={invoke:async(_,{request})=>{if(request.operation==='preferences.write')preferences=structuredClone(request.payload);return {protocolVersion:1,requestId:request.requestId,ok:true,value:preferences};}};
  const authoring=structuredClone((await visualRequest('authoring.list')).value);
  authoring.appearances.push({...authoring.appearances[0],id:'bec-happy',label:'happy',assetId:'bec-happy'});authoring.assets.push({...authoring.assets[3],id:'bec-happy',displayName:'Bec happy'});
  let scene=structuredClone((await visualRequest('scene.list')).value);scene.authoring=authoring;let previous;
  window.__auditCommands=[];window.__auditVariables=[];
  const response=value=>({protocolVersion:1,requestId:'fixture',ok:true,value:structuredClone(value)});
  startApplication(async(op,payload={})=>{
   if(op==='authoring.list'||op==='character.update')return response(authoring);
   if(op==='appearance.setDefault'){authoring.characters.find(c=>c.id===payload.characterId).defaultAppearanceId=payload.appearanceId;return response(authoring);}
   if(op==='variable.create'){window.__auditVariables.push(payload);authoring.variables.push({id:payload.technicalName,source:authoring.variables[0].source,...payload});return response(authoring);}
   if(op==='scene.list')return response(scene);
   if(op==='scene.apply'){
    const command=payload.command;window.__auditCommands.push(command);
    if(command.type==='reorderBeat'){previous=structuredClone(scene);const beats=scene.scenes.find(s=>s.id===command.sceneId).beats;const from=beats.findIndex(b=>b.id===command.beatId);beats.splice(command.toIndex,0,beats.splice(from,1)[0]);scene.canUndo=true;}
    if(command.type==='undo'){scene=previous;previous=undefined;}
    if(command.type==='insertBeat'){await new Promise(resolve=>window.__auditReleaseBeat=resolve);scene.scenes.find(s=>s.id===command.sceneId).beats.push({id:'audit-added',protected:false,byteStart:130,byteEnd:150,payload:command.beat});}
    return response(scene);
   }
   return visualRequest(op,payload);
  });
 });
 await audit.locator('.recent-open').click();await audit.locator('.preview-divider').waitFor();
 const hide=audit.getByRole('button',{name:'Toggle scene or file list',exact:true}),restore=audit.getByRole('button',{name:'Show scene or file list',exact:true});
 assert.equal(await hide.getAttribute('aria-expanded'),'true');assert.equal(await hide.getAttribute('aria-controls'),'project-tree-panel');
 assert.equal(await audit.getByRole('button',{name:'Toggle navigation size',exact:true}).getAttribute('aria-expanded'),'true');
 await hide.click();assert.equal(await audit.locator('.project-tree-toggle').getAttribute('aria-expanded'),'false');assert.equal(await restore.evaluate(e=>document.activeElement===e&&e.checkVisibility()),true);
 await restore.click();assert.equal(await hide.evaluate(e=>document.activeElement===e&&e.checkVisibility()),true);
 await audit.locator('.preview-divider').focus();await audit.keyboard.press('ArrowDown');assert.equal(await audit.locator('.preview-divider').getAttribute('aria-valuenow'),'36');
 await audit.evaluate(()=>window.dispatchEvent(new Event('loomlight-reset-layout')));assert.equal(await audit.locator('.preview-divider').getAttribute('aria-valuenow'),'34');assert.equal(await audit.locator('input[type="range"]').count(),0);
 await audit.locator('.beat-select').nth(3).click();await audit.getByRole('button',{name:'Create New Scene',exact:true}).click();
 for(const width of [1440,560]){
  await audit.setViewportSize({width,height:900});
  const metrics=await audit.locator('.choice-new-scene').evaluate(e=>({overflow:e.scrollWidth>e.clientWidth+1,fields:[...e.querySelectorAll(':scope > .field')].map(f=>f.getBoundingClientRect().x),buttons:[...e.querySelectorAll('button')].map(b=>({height:b.getBoundingClientRect().height,parent:b.parentElement.className,whiteSpace:getComputedStyle(b).whiteSpace}))}));
  assert.equal(metrics.overflow,false);assert.equal(metrics.buttons.length,2);for(const b of metrics.buttons){assert.ok(b.height>=32&&b.height<=40,JSON.stringify(metrics));assert.ok(b.parent.includes('choice-create-actions'));assert.equal(b.whiteSpace,'nowrap');}
  if(width===560)assert.equal(new Set(metrics.fields.map(x=>Math.round(x))).size,1,'compact Choice fields did not stack');
 }
 await hide.click();await audit.getByRole('button',{name:'Writing focus',exact:true}).click();await audit.locator('.choice-new-scene').scrollIntoViewIfNeeded();await audit.screenshot({path:output+'audit-fixed-choice-compact.png'});
 await audit.getByRole('button',{name:'Exit Writing focus',exact:true}).click();await audit.setViewportSize({width:1440,height:900});
 await audit.locator('.choice-new-scene').getByRole('button',{name:'Cancel',exact:true}).click();await audit.locator('.expanded-beat > .row-actions').getByRole('button',{name:'Cancel',exact:true}).click();
 // Real mouse pointer capture, cancellation and protected-boundary rejection.
 const drag=async(target,escape=false)=>{const grip=await audit.locator('[data-beat-id="background"] .beat-grip').boundingBox();const box=await target.boundingBox();await audit.mouse.move(grip.x+grip.width/2,grip.y+grip.height/2);await audit.mouse.down();await audit.mouse.move(box.x+box.width/2,box.y+box.height/2,{steps:8});if(escape)await audit.keyboard.press('Escape');await audit.mouse.up();};
 await drag(audit.locator('[data-beat-id="dialogue"]'),true);assert.equal(await audit.evaluate(()=>window.__auditCommands.filter(c=>c.type==='reorderBeat').length),0);
 await drag(audit.locator('[data-beat-id="choice"]'));assert.equal(await audit.evaluate(()=>window.__auditCommands.filter(c=>c.type==='reorderBeat').length),0);
 await drag(audit.locator('.app-header'));assert.equal(await audit.evaluate(()=>window.__auditCommands.filter(c=>c.type==='reorderBeat').length),0);
 await drag(audit.locator('[data-beat-id="dialogue"]'));await audit.waitForFunction(()=>document.activeElement?.closest('.beat-card')?.dataset.beatId==='background');
 assert.deepEqual(await audit.evaluate(()=>window.__auditCommands.filter(c=>c.type==='reorderBeat').map(c=>c.toIndex)),[2]);assert.equal(await audit.locator('.beat-card').nth(2).getAttribute('data-beat-id'),'background');
 await audit.getByRole('button',{name:'Undo',exact:true}).click();await audit.waitForFunction(()=>document.querySelector('.beat-card')?.dataset.beatId==='background');
 await audit.getByRole('button',{name:'Variables',exact:true}).click();
 const dialog=audit.getByRole('dialog');const type=dialog.locator('.field').filter({has:audit.locator('span:text-is("Type")')}).locator('select');const defaultField=dialog.locator('.field').filter({has:audit.locator('span:text-is("Default value")')});
 for(const [kind,value] of [['int','42'],['string','Discard this'],['bool','true']]){
  await audit.getByRole('button',{name:'New variable',exact:true}).click();await type.selectOption(kind);if(kind==='bool')await defaultField.locator('select').selectOption(value);else await defaultField.locator('input').fill(value);
  await audit.getByRole('button',{name:'Close New variable',exact:true}).click();await audit.getByRole('button',{name:'Discard changes',exact:true}).click();await audit.waitForFunction(()=>document.querySelector('#app-status').textContent==='Saved');
  await audit.getByRole('button',{name:'New variable',exact:true}).click();assert.equal(await type.inputValue(),'bool');assert.equal(await defaultField.locator('select').inputValue(),'false');assert.equal(await defaultField.locator('input').count(),0);
  await type.selectOption(kind);if(kind!=='bool')assert.equal(await defaultField.locator('input').inputValue(),'');await audit.keyboard.press('Escape');if(await audit.getByRole('button',{name:'Discard changes',exact:true}).count())await audit.getByRole('button',{name:'Discard changes',exact:true}).click();
 }
 await audit.getByRole('button',{name:'New variable',exact:true}).click();await dialog.locator('input').fill('audit_flag');await defaultField.locator('select').selectOption('true');await dialog.getByRole('button',{name:'Create Variable',exact:true}).click();await audit.waitForFunction(()=>window.__auditVariables.length===1);assert.deepEqual(await audit.evaluate(()=>window.__auditVariables.map(v=>[v.variableType,v.defaultValue])),[['bool',true]]);
 await audit.getByRole('button',{name:'Characters',exact:true}).click();await audit.getByRole('button',{name:'View appearance happy',exact:true}).click();
 const selectedAppearance=async()=>{assert.equal(await audit.locator('.catalog-inspector .inspector-thumbnail').getAttribute('data-asset-id'),'bec-happy');assert.equal(await audit.getByRole('button',{name:'View appearance happy',exact:true}).getAttribute('aria-pressed'),'true');};
 await audit.getByRole('button',{name:'Edit Bec',exact:true}).click();await audit.getByRole('button',{name:'Save Character',exact:true}).click();await audit.getByRole('button',{name:'View appearance happy',exact:true}).waitFor();await selectedAppearance();
 await audit.locator('.catalog-inspector .appearance-row').filter({has:audit.getByRole('button',{name:'View appearance happy',exact:true})}).getByRole('button',{name:'Set default',exact:true}).click();await audit.waitForFunction(()=>document.querySelector('.appearance-select[data-appearance-id="bec-happy"]')?.dataset.default==='true');await selectedAppearance();
 await audit.getByRole('button',{name:'Assets',exact:true}).click();await audit.getByRole('button',{name:'Characters',exact:true}).click();await audit.getByRole('button',{name:'View appearance happy',exact:true}).waitFor();await selectedAppearance();
 await audit.waitForFunction(()=>[...document.querySelectorAll('.catalog-inspector .appearance-thumbnail')].every(img=>img.complete&&img.naturalWidth>0));await audit.screenshot({path:output+'audit-fixed-appearance.png'});
 await audit.getByRole('button',{name:'Story',exact:true}).click();await audit.getByRole('button',{name:'Add Beat',exact:true}).click();await audit.locator('.new-beat select').first().selectOption('narration');await audit.locator('.new-beat textarea').fill('Saved narration');
 await audit.locator('.new-beat').getByRole('button',{name:'Add Beat',exact:true}).click();await audit.waitForFunction(()=>window.__auditReleaseBeat);
 assert.equal(await audit.locator('.new-beat').getByRole('button',{name:'Add Beat',exact:true}).isDisabled(),true);assert.equal(await audit.locator('.new-beat').getByRole('button',{name:'Cancel',exact:true}).isDisabled(),true);
 await audit.evaluate(()=>document.querySelector('.new-beat button.button.primary').click());assert.equal(await audit.evaluate(()=>window.__auditCommands.filter(c=>c.type==='insertBeat').length),1);
 await audit.evaluate(()=>window.__auditReleaseBeat());await audit.locator('.new-beat').waitFor({state:'detached'});assert.equal(await audit.locator('[data-beat-id="audit-added"] .beat-select').evaluate(e=>document.activeElement===e),true);assert.equal(await audit.locator('[data-beat-id="audit-added"] .expanded-beat').count(),0);
 assert.deepEqual(errors,[]);await audit.close();
 console.log('PASS: all six workspaces in both themes; onboarding, Settings, compact layouts, Source undo; shipped smoke and busy contention; audit regressions for Choice actions, Variable discard/reopen/submission, appearance retention, sidebar focus, divider reset, pending Beat creation and captured pointer reorder/cancellation. Fixture bridge only; not native SDK or security proof.');
} finally {await browser?.close();await server.close();}
