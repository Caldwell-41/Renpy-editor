import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=process.env.LOOMLIGHT_UI_OUTPUT?process.env.LOOMLIGHT_UI_OUTPUT.replace(/\\/g,'/')+'/':fileURLToPath(new URL('../../.toolchains/phase2-ui-refinement/ci-browser/',import.meta.url));await mkdir(out,{recursive:true});
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});let browser;
const receipts=[];
try {
 await server.listen();try{browser=await chromium.launch({channel:'chrome',headless:true});}catch{browser=await chromium.launch({headless:true});}
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/ui-fixture',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html data-theme="light"><head><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div class="app-shell"><header class="app-header"><span class="brand">Loomlight</span><span class="header-project">The Last Tram · Public fixture</span></header><div class="project-shell"><nav class="story-sidebar"><h2>The Last Tram</h2><button class="tree-item selected">Story</button><button class="tree-item">Characters</button><button class="tree-item">Lorebook</button><button class="tree-item">Source</button></nav><main class="supporting-workspace"><header id="creation"></header><div id="surface"></div></main></div><footer class="app-footer">Public fixture · No provider connection</footer></div></body></html>'}));
 for(const surface of ['settings','assist','send','proposal','card','lore']) {
  await page.setViewportSize({width:1440,height:900});await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/ui-fixture`);
  await page.evaluate(async surface=>{
   const profile={profileId:'fixture-profile',revision:1,disabled:false,credentialStatus:'configured',compatibilityState:'ready',discovery:null,settings:{label:'Local Studio',endpoint:'http://127.0.0.1:8888/v1',model:'public-fixture-model',privateHttp:false,contextBudget:4096,contextCeiling:8192,maximumResponse:1024,temperature:1,topP:.95}};
   window.fixtureCalls=[];
   const profiles={token:'profile-token',profiles:[profile],cleanup:[]};
   if(surface==='settings'){
    window.__TAURI_INTERNALS__={invoke:async(_,{request})=>{window.fixtureCalls.push(request.operation);if(request.operation!=='ai.profiles')throw Error('No network or writes allowed');return {ok:true,value:profiles,protocolVersion:1,requestId:request.requestId};}};
    const {openSettings}=await import('/src/settings-ui.ts');openSettings();[...document.querySelectorAll('button')].find(b=>b.textContent==='AI providers').click();return;
   }
   if(['assist','send','proposal'].includes(surface)){
    const {mountRewrite}=await import('/src/rewrite-ui.ts');
    const options={prompt:{revision:'prompt-r1'},editPrompt:{revision:'edit-r1'},structureRevision:'structure-r1',targets:[{sceneId:'scene-1',beatId:'beat-1',sourceRevision:'source-r1',label:'Platform at dusk · Narration'}],anchors:[],characters:[],references:[{kind:'card',recordId:'card-1',revisionId:'card-r2',title:'Mara',number:2,eligible:true},{kind:'lore',recordId:'lore-1',revisionId:'lore-r1',title:'The last service',number:1,eligible:true},{kind:'lore',recordId:'lore-2',revisionId:'lore-r2',title:'Old timetable · supporting source changed',number:2,eligible:false}]};
    const prepared={token:'send-token',payloadDigest:'public-body-digest',serializedPayload:JSON.stringify({model:'public-fixture-model',messages:[{role:'system',content:'Preserve speaker and formatting. Return permitted changes only.'},{role:'user',content:'Make the image more vivid without changing the meaning. Saved text: The last tram waited in the rain.'}],max_tokens:1024,temperature:1,top_p:.95,stream:false},null,2),destination:{provider:'Unsloth Studio',endpoint:profile.settings.endpoint,model:profile.settings.model,connectionLocation:'Literal loopback HTTP',inferenceLocality:'Unknown',retention:'Studio may retain content.'},size:{estimatedInputTokens:680,maximumResponse:1024,margin:128,total:1832,contextBudget:4096,contextCeiling:8192},context:{included:[{kind:'card',title:'Mara',revision:'card-r2'}],excluded:['Old timetable: stale supporting source'],dependencies:[],unrelatedDraftsExcluded:[],exclusionPolicy:['Only explicitly selected approved saved references']},protected:[],responseMode:'Structured proposal; thinking off; no streaming'};
    window.fixtureReview={proposalId:'proposal-1',previewDigest:'public-patch-digest',target:{sceneId:'scene-1',beatId:'beat-1'},beforeSegments:[{literal:'The last tram waited in the rain.'}],segments:[{literal:'Rain traced silver lines down the windows of the waiting tram.'}],protected:[],patches:[{path:'game/platform.rpy',before:'    "The last tram waited in the rain."',after:'    "Rain traced silver lines down the windows of the waiting tram."'}],uncertainty:'Preview only. The game has not been run.'};
    const actions={current:()=>true,accepted:()=>{},call:async(op)=>{window.fixtureCalls.push(op);if(op==='context.options')return options;if(op==='ai.profiles')return profiles;if(op==='rewrite.prepare')return prepared;if(op==='rewrite.send')return {requestId:'fixture-request',state:'completed',done:true,message:null,proposal:window.fixtureReview};throw Error('No network or writes allowed');}};
    window.fixtureController=mountRewrite(document.querySelector('#surface'),'scene-1','beat-1',actions);return;
   }
   const {renderReferenceLibrary,emptyReference}=await import('/src/reference-ui.ts');const kind=surface==='card'?'card':'lore';
   const content=emptyReference(kind);content.title=kind==='card'?'Mara':'The last service';content.description='A patient tram conductor who notices what passengers leave unsaid.';content.personality='Calm, observant and quietly stubborn.';content.text='The final tram leaves just after midnight. The old station clock runs five minutes slow.';content.category='Places';content.tags=['station','night'];content.provenance={kind:'userAuthored',notes:''};
   const next={...content,...(kind==='card'?{description:'An observant conductor who keeps a small notebook of lost belongings.'}:{text:'After midnight, the last tram stops only when the platform lamp is lit.'}),provenance:{kind:'inferred',notes:'Generated draft; needs your review'}};
   const record={id:'record-1',revisionCounter:2,currentRevisionId:'new-r2',approvedRevisionId:'old-r1',revisions:[{id:'old-r1',number:1,status:'approved',content,createdAt:'2026-10-13T00:00:00Z',reviewedAt:'2026-10-13T00:00:00Z'},{id:'new-r2',number:2,status:'proposed',content:next,createdAt:'2026-10-13T00:00:01Z',reviewedAt:null}]};
   const model={document:{schemaVersion:1,projectId:'public-fixture',cards:kind==='card'?[record]:[],loreEntries:kind==='lore'?[record]:[]},revision:'reference-token',diagnostic:null,entities:[],issues:[],canUndo:true,canRedo:false};
   window.fixtureController=renderReferenceLibrary(document.querySelector('#surface'),kind,model,{creationHost:document.querySelector('#creation'),current:()=>true,status:()=>{},guard:async()=>true,load:async()=>model,apply:async()=>{throw Error('No writes allowed');}});
  },surface);
  if(['assist','send','proposal'].includes(surface)){
   await page.waitForFunction(()=>document.querySelector('.rewrite-panel')?.dataset.busy==='false');
   await page.getByLabel('Task',{exact:true}).fill('Make the image more vivid without changing the meaning.');
   if(surface!=='assist')await page.getByRole('button',{name:'Review complete send',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('.rewrite-panel')?.dataset.busy==='false');
   if(surface==='proposal'){await page.getByRole('button',{name:'Generate proposal',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.rewrite-panel')?.dataset.busy==='false');}
  }else if(surface==='settings')await page.waitForFunction(()=>!document.querySelector('.studio-actions button')?.disabled);else {await page.waitForFunction(()=>document.querySelector('[name=title]')?.disabled);}
  for(const [name,width,height,density] of [['wide',1440,900,'normal'],['compact',600,720,'normal'],['scaled',600,720,'large']])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height});await page.evaluate(({theme,density})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.density=density;}, {theme,density});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:`${out}${surface}-${theme}-${name}.png`});
   const metrics=await page.evaluate(()=>{
    const root=document.querySelector('.settings-content,.rewrite-panel,.reference-library');const box=root.getBoundingClientRect();
    const visible=n=>{for(let parent=n.parentElement;parent;parent=parent.parentElement)if(parent.hidden||(parent.tagName==='DETAILS'&&!parent.open&&!parent.querySelector('summary')?.contains(n)))return false;return n.getClientRects().length>0;};const rows=[...root.querySelectorAll('button,input,select,textarea')].filter(visible);
    const primaries=[...root.querySelectorAll('button.primary')].filter(visible);const bounds=primaries.map(n=>{const b=n.getBoundingClientRect();return {label:n.textContent,top:b.top,bottom:b.bottom,visible:b.top>=0&&b.bottom<=innerHeight};});return {primaryActions:bounds,viewportOverflow:document.documentElement.scrollWidth>innerWidth,contentWidth:root.clientWidth,contentScrollWidth:root.scrollWidth,contentHeight:root.clientHeight,contentScrollHeight:root.scrollHeight,visibleControls:rows.length,offscreenControls:rows.filter(n=>{const b=n.getBoundingClientRect();return b.bottom>box.bottom||b.top<box.top;}).length,callOperations:window.fixtureCalls};
   });receipts.push({surface,theme,name,width,height,density,...metrics});if(['assist','send','proposal'].includes(surface)&&!metrics.primaryActions.every(a=>a.visible))throw Error('Primary action obscured at '+surface+' '+theme+' '+name);
  }
 }
 await writeFile(out+'metrics.json',JSON.stringify({input:'current CI candidate; workflow supplies exact SHA',fixture:'public; renderer-only; blocked writes/network',receipts,errors},null,2));
 if(errors.length)throw Error('Browser runtime errors');if(receipts.some(r=>r.viewportOverflow))throw Error('Page-wide horizontal overflow');console.log('PASS: assistance renderer36 captures, both themes/wide/compact/scaled, primary Assist actions visible, no viewport overflow, no real provider or persistence');console.log(JSON.stringify({captures:receipts.length,errors,metrics:receipts.filter(r=>r.theme==='light'&&r.name!=='scaled')},null,2));
}finally{await browser?.close();await server.close();}
