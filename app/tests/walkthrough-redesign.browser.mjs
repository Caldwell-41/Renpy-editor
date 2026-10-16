/** Current source components, passive public fixtures, and blocked persistence/network.
 * This driver coordinates UI actions; it never emulates a save, restore or source transaction.
 */
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const projectRoot=fileURLToPath(new URL('../../',import.meta.url));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function inputSnapshot(){
 const names=[];
 async function collect(relative){
  for(const entry of await readdir(path.join(projectRoot,relative),{withFileTypes:true})){
   const name=relative+'/'+entry.name;
   if(entry.isDirectory())await collect(name);else if(entry.isFile())names.push(name);
  }
 }
 await collect('app/src');
 names.push('app/tests/walkthrough-redesign.browser.mjs','app/package.json','app/package-lock.json','app/vite.config.ts','app/tsconfig.json');
 const files={};for(const name of names.sort())files[name]=hash(await readFile(path.join(projectRoot,name)));
 const git=(...args)=>execFileSync('git',args,{cwd:projectRoot,encoding:'utf8'}).trim();
 return {checkoutHead:git('rev-parse','HEAD'),checkoutTree:git('rev-parse','HEAD^{tree}'),dirty:!!git('status','--porcelain','--untracked-files=normal'),files};
}
const surfaces=process.env.LOOMLIGHT_UI_SURFACES==='settings'?['settings']:['characters','relationships','knowledge','history','lorebook','settings','assist'];
const output=process.env.LOOMLIGHT_UI_OUTPUT??fileURLToPath(new URL('../../.toolchains/walkthrough-redesign/browser/',import.meta.url));
await mkdir(output,{recursive:true});
const beforeInputs=await inputSnapshot();
await writeFile(path.join(output,'input-identity-before.json'),JSON.stringify(beforeInputs,null,2)+'\n');
const server=await createServer({root:fileURLToPath(new URL('../',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const report={inputIdentity:{basis:'Working-tree file hashes; checkout HEAD alone does not identify uncommitted renderer inputs',before:beforeInputs,after:null,unchanged:false,changedInputs:[]},fixture:'Synthetic public data; production source components; persistence and external networking blocked',receipts:[],errors:[],prohibited:[],behaviors:[],cleanup:{browser:'not-started',server:'not-started'}};
let browser,page,origin,failure,activeCase;
const html=`<!doctype html><html data-theme="light"><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"></head><body><div class="app-shell"><header class="app-header"><span class="brand">Loomlight</span><span class="header-project">The Last Tram · Public fixture</span></header><div class="project-shell"><nav class="story-sidebar" aria-label="Project navigation"><h2>The Last Tram</h2><button class="tree-item">Story</button><button class="tree-item selected">Characters</button><button class="tree-item">Lorebook</button><button class="tree-item">Source</button></nav><main class="supporting-workspace" id="surface"><div id="creation" class="reference-page-header"><h1>Characters</h1></div></main></div><footer class="app-footer">Public fixture · Saving sends nothing</footer></div></body></html>`;
const frame=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
const visibleBounds=async(page,selectors)=>page.evaluate(selectors=>selectors.map(selector=>{
 const element=document.querySelector(selector);if(!element)throw Error('Missing required action: '+selector);
 const r=element.getBoundingClientRect(),style=getComputedStyle(element);
 const center=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
 return {selector,label:element.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,
  visible:r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1&&style.visibility!=='hidden'&&!!center&&(center===element||element.contains(center))};
}),selectors);
function requireVisible(bounds,context){assert(bounds.length>0,context+': no actions');assert(bounds.every(b=>b.visible),context+': obscured required action '+JSON.stringify(bounds));}
async function footerBounds(page){return visibleBounds(page,['.reference-editor .reference-form-footer button:nth-last-child(2)','.reference-editor .reference-form-footer button:last-child']);}
async function selectCard(page,key,size){
 if(await page.getByRole('button',{name:'Show character list',exact:true}).isVisible())await page.getByRole('button',{name:'Show character list',exact:true}).click();
 await page.locator(`.reference-entry[data-entry-key="${key}"]`).click();
 await page.waitForFunction(key=>document.querySelector('.character-workspace')?.dataset.selectedKey===key,key);
 if(size==='compact')await page.getByRole('button',{name:'Collapse character list',exact:true}).click();
 await frame(page);
}
async function anchors(page){return page.evaluate(()=>Object.fromEntries(['.reference-identity-header','.reference-form-footer','.reference-page-header','.reference-form-footer button:nth-last-child(2)','.reference-form-footer button:last-child'].map(selector=>{
 const r=document.querySelector(selector).getBoundingClientRect();return [selector,{top:r.top,bottom:r.bottom,left:r.left,right:r.right}];
})));}
function sameVerticalAnchors(a,b,context){for(const selector of Object.keys(a))for(const edge of (selector==='.reference-form-footer'?['bottom']:['top','bottom']))assert(Math.abs(a[selector][edge]-b[selector][edge])<=1,context+': shifted '+selector+' '+edge+' '+JSON.stringify({a,b}));}

async function mount(page,surface,theme,size){
 await page.goto(origin+'/ui-fixture');
 await page.evaluate(async({surface,theme,size})=>{
  window.fixtureCalls=[];window.fixtureProhibited=[];
  const profiles={token:'synthetic-profile-token',profiles:[{profileId:'synthetic-profile',revision:1,disabled:false,credentialStatus:'configured',compatibilityState:'ready',compatibilityPayload:'{"messages":[{"role":"user","content":"Synthetic connection test only"}]}',discovery:null,settings:{label:'Local Studio · public fixture',endpoint:'http://127.0.0.1:8888/v1',model:'synthetic-model',privateHttp:false,contextBudget:32768,contextCeiling:32768,maximumResponse:16384,thinking:true,temperature:1,topP:.95}}],cleanup:[],storageNotice:'Temporary Mac development storage · synthetic fixture'};
  const preferences={schemaVersion:1,theme,density:'default',sourceFontSize:14,rememberLayout:false,layouts:{}};
  const refuse=operation=>{window.fixtureProhibited.push(operation);throw Error('Fixture blocks persistence/network: '+operation);};
  window.__TAURI_INTERNALS__={invoke:async(_,{request})=>{
   window.fixtureCalls.push(request.operation);
   const value=request.operation==='ai.profiles'?profiles:request.operation==='preferences.read'?preferences:request.operation==='ai.readModelLoadSettings'?{modelId:'synthetic-model',resolvedModelId:'synthetic-model:Q4_K_M',requested:{contextLength:32768,parallel:1,gpuMemoryMode:'manual',fit:'off'},saved:{contextLength:32768,parallel:1,gpuMemoryMode:'manual',fit:'off'},effective:{contextLength:22528,parallel:2,gpuMemoryMode:'auto',fit:null},autoSwitchEnabled:false,applied:false,warnings:['Fitting is unverified. Unsloth Studio may filter the requested fit argument during loading.'],message:'Synthetic read-only model-load report.'}:refuse(request.operation);
   return {ok:true,value,protocolVersion:1,requestId:request.requestId};
  }};
  const {loadPreferences}=await import('/src/preferences.ts');await loadPreferences();
  document.documentElement.dataset.theme=theme;
  document.querySelector('.project-shell').dataset.navigationCollapsed=String(size==='compact');
  const navigation=surface==='lorebook'?'Lorebook':surface==='assist'?'Story':surface==='settings'?null:'Characters';
  const {icon}=await import('/src/icons.ts');
  for(const item of document.querySelectorAll('.story-sidebar>.tree-item')){const title=item.textContent.trim(),selected=title===navigation;item.prepend(icon(title.toLowerCase()));item.title=title;item.setAttribute('aria-label',title);item.classList.toggle('selected',selected);if(selected)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}
  window.fixtureExpectedNavigation=navigation;
  const host=document.querySelector('#surface'),creation=document.querySelector('#creation');
  creation.querySelector('h1').textContent=surface==='assist'?'Story':surface==='settings'?'Settings':surface==='lorebook'?'Lorebook':'Characters';
  const {emptyReference,renderReferenceLibrary}=await import('/src/reference-ui.ts');
  const revision=(id,number,content,status='approved')=>({id,number,status,createdAt:`2026-10-15T00:0${number}:00Z`,reviewedAt:'2026-10-15T00:03:00Z',reviewNote:'Public synthetic author intent',supersedes:null,supersededBy:null,content});
  const content=(title,description)=>({...emptyReference('card'),title,description,provenance:{kind:'userAuthored',notes:'Retained provenance'},scope:{type:'route',sceneIds:['scene-1']},citations:[],links:[{type:'scene',id:'scene-1',futureLink:'retained'}],linkedLoreIds:['legacy-lore'],futureContent:{retained:true}});
  const mara=content('Mara','A patient tram conductor who notices what passengers leave unsaid. She keeps a notebook of lost belongings and tries to return each one before the last service.');
  Object.assign(mara,{linkedCharacterId:'game-mara',personality:'Reserved, observant and quietly stubborn. She notices a broken promise before she notices a compliment.',motivations:'Get every passenger home safely, even when the timetable has stopped making sense.',appearanceNotes:'A rain-dark coat, silver ticket punch and an old wool scarf.',background:Array(5).fill('Mara grew up beside the old station. The night shift taught her to remember faces, listen before answering and leave a lamp burning for late arrivals.').join('\n\n'),speakingStyle:'Short sentences, gentle humour and practical questions. Let pauses carry what she does not say.',exampleDialogue:'“Last tram?”\nShe checks the empty platform.\n“Then we had better wait another minute.”',knowledgeNotes:'She knows the timetable and the maintenance tunnels. She has not learned why the last service keeps arriving late. She keeps one unposted letter hidden in her notebook.',relationships:[{target:{type:'character',id:'game-ivo'},text:'Trusts his practical judgement, but notices how he avoids the old waiting room.',futureRelationship:'retained'},{target:{type:'lore',id:'legacy-lore'},text:'A retained non-character relationship note.'}]});
  const previous={...emptyReference('card'),title:'Mara',description:'Earlier writing: Mara trusts the timetable, even when the platform is empty.'};
  const ivo=content('Ivo of the northern line','A restless apprentice who prefers a clear task to an uncertain conversation.');
  const elsie=content('Elsie of Lantern Street',Array(4).fill('Elsie collects unclaimed letters and keeps their stories in careful order. She always remembers the person who last asked after a missing name.').join('\n\n'));
  const cards=[{id:'mara',revisionCounter:2,currentRevisionId:'mara-r2',approvedRevisionId:'mara-r2',revisions:[revision('mara-r1',1,previous,'superseded'),revision('mara-r2',2,mara)]},{id:'ivo',revisionCounter:1,currentRevisionId:'ivo-r1',approvedRevisionId:'ivo-r1',revisions:[revision('ivo-r1',1,ivo)]},{id:'elsie',revisionCounter:1,currentRevisionId:'elsie-r1',approvedRevisionId:'elsie-r1',revisions:[revision('elsie-r1',1,elsie)]}];
  const projectContext={id:'world-tone',revisionCounter:1,currentRevisionId:'world-tone-r1',revisions:[{id:'world-tone-r1',number:1,createdAt:'2026-10-15T00:01:00Z',content:{world:Array(5).fill('The final tram crosses a coastal city after midnight. The station clock runs five minutes slow, the platform lamp stays lit and the remaining passengers are waiting for news from the northern line. Everyone begins with different pieces of the same story.').join('\n\n'),tone:'Quiet, observant and gently uncanny. Use concrete details, restrained humour and patient pauses. Let character cards guide each individual voice.'},futureRevision:'retained'}]};
  const model={document:{schemaVersion:1,projectId:'synthetic-public-project',cards,loreEntries:[{id:'legacy-lore',revisionCounter:1,currentRevisionId:'legacy-r1',approvedRevisionId:'legacy-r1',revisions:[revision('legacy-r1',1,{...emptyReference('lore'),title:'The last timetable',text:'Retained independent lore entry.'})]}],projectContext,futureLibrary:{retained:true}},revision:'synthetic-reference-token',diagnostic:null,entities:[{kind:'character',id:'game-mara',title:'Mara',revision:'source-mara'},{kind:'character',id:'game-ivo',title:'Ivo',revision:'source-ivo'},{kind:'character',id:'game-only',title:'Nell · game character',revision:'source-nell'},{kind:'card',id:'mara',title:'Mara',revision:'mara-r2'},{kind:'card',id:'ivo',title:'Ivo of the northern line',revision:'ivo-r1'},{kind:'card',id:'elsie',title:'Elsie of Lantern Street',revision:'elsie-r1'},{kind:'lore',id:'legacy-lore',title:'The last timetable',revision:'legacy-r1'},{kind:'scene',id:'scene-1',title:'Platform at dusk',revision:'source-scene'}],issues:[],canUndo:true,canRedo:false};
  window.fixtureModel=model;window.fixtureBaseline=JSON.stringify(model);
  const referenceActions={creationHost:creation,current:()=>true,guard:async()=>true,status:()=>{},workspaceKey:'synthetic:characters',load:async()=>{window.fixtureCalls.push('references.list');return model;},apply:async command=>refuse('references.apply:'+command.type)};
  if(surface==='settings'){
   const {openSettings}=await import('/src/settings-ui.ts');openSettings();
   if(size==='compact'){const select=document.querySelector('[aria-label="Settings category"]');select.value='AI providers';select.dispatchEvent(new Event('change',{bubbles:true}));}
   else [...document.querySelectorAll('button')].find(b=>b.textContent==='AI providers').click();
  }else if(surface==='assist'){
   const {mountRewrite}=await import('/src/rewrite-ui.ts');
   const options={prompt:{revision:'prompt-r1'},structureRevision:'structure-r1',targets:[{sceneId:'scene-1',beatId:'beat-1',sourceRevision:'source-r1',label:'Platform at dusk · Narration'}],references:[{kind:'card',recordId:'mara',revisionId:'mara-r2',title:'Mara',number:2,eligible:true},{kind:'lore',recordId:'legacy-lore',revisionId:'legacy-r1',title:'The last timetable',number:1,eligible:true}],projectContext};
   window.fixtureController=mountRewrite(host,'scene-1','beat-1',{current:()=>true,accepted:()=>refuse('rewrite.accepted'),call:async operation=>{window.fixtureCalls.push(operation);if(operation==='context.options')return options;if(operation==='ai.profiles')return profiles;return refuse(operation);}});
  }else{
   const kind=surface==='lorebook'?'lore':'card';creation.querySelector('h1').textContent=kind==='lore'?'Lorebook':'Characters';
   window.fixtureController=renderReferenceLibrary(host,kind,model,referenceActions);
  }
 },{surface,theme,size});
}

async function exerciseCharacters(page,size){
 await page.locator('.character-workspace[data-busy="false"]').waitFor();
 await selectCard(page,'card:mara',size);
 const initial=await anchors(page);
 const description=page.locator('[name="description"]');
 await description.fill('Draft retained across cards and panels. Café 雪. '+(await description.inputValue()));
 const draft=await description.inputValue();
 await description.evaluate(element=>{element.focus();element.setSelectionRange(6,14);element.closest('.reference-writing-body').scrollTop=120;});
 const remembered=await page.evaluate(()=>({scroll:document.querySelector('.reference-writing-body').scrollTop,start:document.querySelector('[name="description"]').selectionStart,end:document.querySelector('[name="description"]').selectionEnd}));
 const cardAnchors=[];
 for(const key of ['card:ivo','card:elsie','card:mara']){await selectCard(page,key,size);const current=await anchors(page);sameVerticalAnchors(initial,current,'card '+key);cardAnchors.push({key,anchors:current});requireVisible(await footerBounds(page),'card '+key+' footer');}
 assert.equal(await description.inputValue(),draft,'Card switching lost draft');
 const restored=await description.evaluate(element=>({start:element.selectionStart,end:element.selectionEnd,scroll:element.closest('.reference-writing-body').scrollTop,focus:document.activeElement===element}));
 assert.equal(restored.start,remembered.start);assert.equal(restored.end,remembered.end);assert(Math.abs(restored.scroll-remembered.scroll)<=1,'Card switching lost writing scroll');
 // Compact selection deliberately transfers focus to the shared collapse control.
 if(size==='wide')assert.equal(restored.focus,true,'Saved field focus was not restored');
 if(await page.getByRole('button',{name:'Show character list',exact:true}).isVisible())await page.getByRole('button',{name:'Show character list',exact:true}).click();
 const beforeCollapse=await anchors(page);
 await page.getByRole('button',{name:'Collapse character list',exact:true}).click();await frame(page);
 const collapsed=await anchors(page);sameVerticalAnchors(beforeCollapse,collapsed,'panel collapse');
 assert.equal(await description.inputValue(),draft);assert.equal(await page.getByRole('button',{name:'Show character list',exact:true}).evaluate(el=>document.activeElement===el),true);
 await page.getByRole('button',{name:'Show character list',exact:true}).click();await frame(page);
 assert.equal(await description.inputValue(),draft);
 await selectCard(page,'character:game-only',size);
 assert.equal(await page.locator('[name="description"]').inputValue(),'','Game-only character acquired invented writing');
 assert.equal(await page.locator('[name="knowledgeNotes"]').inputValue(),'');
 assert.match(await page.locator('.reference-character-state').textContent(),/In game/);
 await selectCard(page,'card:ivo',size);assert.match(await page.locator('.reference-character-state').textContent(),/Planning only/);
 await selectCard(page,'card:mara',size);assert.equal(await description.inputValue(),draft);
 const forbidden=await page.locator('.reference-library').evaluate(root=>['linkedLoreIds','scope','provenance','links'].filter(name=>root.querySelector(`[name="${name}"]`)));
 assert.deepEqual(forbidden,[],'Legacy hidden controls resurfaced');
 await page.locator('.reference-writing-body').evaluate(element=>{element.scrollTop=0;});
 return {draftSwitchPreserved:true,selectionPreserved:true,scrollPreserved:true,sharedCollapseFocus:true,gameOnlyEmpty:true,planningStatus:true,cardAnchors};
}

async function exerciseSurface(page,surface,size){
 if(surface==='settings'){
  await page.locator('.studio-settings[data-busy="false"]').waitFor();
  assert.equal(await page.getByLabel('Context length',{exact:true}).inputValue(),'32768');assert.equal(await page.getByLabel('Maximum response length',{exact:true}).inputValue(),'16384');assert.equal(await page.getByLabel('Thinking',{exact:true}).isChecked(),true);
  assert.deepEqual(await page.locator('.studio-group').evaluateAll(groups=>groups.slice(0,4).map(group=>group.className.includes('studio-connect')?'connect':group.className.includes('studio-model-choice')?'model':group.querySelector('h4')?.textContent)),['Connection','API Key','connect','model']);
  assert.equal(await page.getByLabel('Parallel slots',{exact:true}).inputValue(),'1');assert.equal(await page.getByLabel('GPU memory mode',{exact:true}).inputValue(),'manual');assert.equal(await page.getByLabel('Automatic memory fitting',{exact:true}).inputValue(),'off');
  const captures=[];
  for(const [view,group,selectors] of [
   ['connection','.studio-group',['#studio-profile-name','#studio-endpoint']],
   ['connect','.studio-connect',[]],
   ['response','#studio-thinking',['#studio-context-length','#studio-maximum-response-length','#studio-thinking']],
  ]){
   await page.locator(group).first().evaluate((element,view)=>(view==='connect'?element.previousElementSibling:view==='response'?element.closest('.studio-group'):element).scrollIntoView({block:'start'}),view);
   await frame(page);
   const required=view==='connect'?['.studio-connect button:first-child','.studio-group:has(+ .studio-connect) .studio-actions button:first-child']:selectors;
   const actions=await visibleBounds(page,required);requireVisible(actions,`settings ${view} ${size}`);
   const theme=await page.evaluate(()=>document.documentElement.dataset.theme);
   const name=`settings-${view}-${theme}-${size}.png`;await page.screenshot({path:path.join(output,name)});
   captures.push({view,image:name,imageSha256:hash(await readFile(path.join(output,name))),actionsVisible:true,actions});
  }
  await page.getByRole('button',{name:'Read model-load settings',exact:true}).click();
  await page.locator('.studio-model-load-report[data-outcome="read"]').waitFor();
  assert.match(await page.locator('.studio-model-load-report').textContent(),/Actually loaded.*22,528/s);assert.match(await page.locator('.studio-model-load-warnings').textContent(),/Fitting is unverified/);
  await page.getByLabel('Parallel slots',{exact:true}).evaluate(element=>element.closest('.studio-model-loading').scrollIntoView({block:'start'}));
  return {actions:['.studio-save-actions button'],captures,behavior:{configurableLoadDefaults:true,requestedSavedLoadedDistinct:true,readOnlyReport:true,mismatchWarning:true,oneContextField:await page.getByLabel('Context length',{exact:true}).count()===1}};
 }
 if(surface==='assist'){
  await page.locator('.rewrite-panel[data-busy="false"]').waitFor();
  await page.getByLabel('Task',{exact:true}).fill('Make the image more vivid while preserving the speaker and meaning.');
  const shared=page.getByLabel('Include project world & tone',{exact:true});assert.equal(await shared.isChecked(),true);await shared.uncheck();assert.equal(await shared.isChecked(),false);await shared.check();
  assert.equal(await page.getByRole('button',{name:'Review complete send',exact:true}).isEnabled(),true);
  await page.locator('.rewrite-body').evaluate(element=>{element.scrollTop=0;});
  return {actions:['.rewrite-footer .primary:not([hidden])'],behavior:{sharedContextExplicit:true,sendRemainsExplicit:true}};
 }
 await page.locator('.reference-library[data-busy="false"]').waitFor();
 if(surface==='lorebook'){
  assert.equal(await page.locator('.project-lorebook textarea').count(),2);assert.equal(await page.locator('.project-lorebook input,.project-lorebook select').count(),0);
  const world=page.locator('[name="world"]');await world.fill((await world.inputValue())+'\n\nDraft opening-world detail.');
  const scroll=await page.locator('.reference-writing-body').evaluate(element=>{element.scrollTop=element.scrollHeight;return {top:element.scrollTop,clientHeight:element.clientHeight,scrollHeight:element.scrollHeight};});
  assert(scroll.top>0,'Lorebook body does not scroll');requireVisible(await footerBounds(page),'Scrolled Lorebook footer');
  await page.locator('.reference-writing-body').evaluate(element=>{element.scrollTop=0;});
  return {actions:['.reference-form-footer button:nth-last-child(2)','.reference-form-footer button:last-child'],behavior:{twoFieldsOnly:true,bodyScroll:scroll,fixedFooter:true}};
 }
 let behavior={};
 if(surface==='characters')behavior=await exerciseCharacters(page,size);
 else{
  await selectCard(page,'card:mara',size);
  if(surface==='relationships'){
   await page.getByRole('tab',{name:'Relationships',exact:true}).click();
   await page.locator('.reference-relationship').first().locator('summary').click();
   await page.locator('.reference-relationship[open] textarea').fill('Trusts Ivo, but watches for the moment when he changes the subject.');
   await page.getByRole('button',{name:'Add relationship',exact:true}).click();
   const opened=page.locator('.reference-relationship[open]');assert.equal(await opened.count(),1);await opened.locator('select').selectOption('card:elsie');await opened.locator('textarea').fill('Greets Elsie warmly and asks which letters still need an answer.');
   assert.equal(await page.getByRole('button',{name:'Save relationship',exact:true}).count(),0);behavior={oneOpenRelationship:true,directEntryEditing:true,workspaceSaveOnly:true};
  }else if(surface==='knowledge'){
   await page.getByRole('tab',{name:'Starting knowledge & secrets',exact:true}).click();
   assert.match(await page.locator('.reference-knowledge-guides').textContent(),/What secrets do they keep/);
   await page.locator('[name="knowledgeNotes"]').fill('At the start, Mara knows the timetable. She has not learned why the final tram is late. She keeps the unposted letter secret.');behavior={startingOnly:true,oneKnowledgeField:await page.locator('[name="knowledgeNotes"]').count()===1};
  }else if(surface==='history'){
   await page.locator('[name="description"]').fill('Unsaved writing draft, retained while inspecting recent versions.');
   await page.getByRole('button',{name:'Version history',exact:true}).click();await page.locator('.reference-version-dialog').waitFor();
   const restore=page.getByRole('button',{name:'Restore this version',exact:true});assert.equal(await restore.isDisabled(),true,'Dirty draft must block restoration');assert.match(await page.locator('.reference-version-dialog').textContent(),/Save or discard/);assert.match(await page.locator('.reference-version-dialog').textContent(),/Earlier writing: Mara trusts the timetable/);
   return {actions:['.reference-version-dialog button:not([data-restore])'],behavior:{historyReadable:true,dirtyRestoreDisabled:true,priorWritingVisible:true}};
  }
 }
 await page.locator('.reference-writing-body').evaluate(element=>{element.scrollTop=0;});
 const body=await page.locator('.reference-writing-body').evaluate(element=>({clientHeight:element.clientHeight,scrollHeight:element.scrollHeight}));
 if(surface==='characters')assert(body.scrollHeight>body.clientHeight,'Overview body must scroll with growing content');
 return {actions:['.reference-form-footer button:nth-last-child(2)','.reference-form-footer button:last-child'],behavior:{...behavior,body,fixedFooter:true}};
}

try{
 await server.listen();report.cleanup.server='open';origin=`http://127.0.0.1:${server.httpServer.address().port}`;
 try{browser=await chromium.launch({channel:'chrome',headless:true});}catch{browser=await chromium.launch({headless:true});}
 report.cleanup.browser='open';report.runtime={node:process.version,browser:await browser.version()};page=await browser.newPage();page.on('pageerror',error=>report.errors.push(error.message));
 await page.route('**/*',route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==origin||request.method()!=='GET'){report.prohibited.push(request.method()+' '+url.origin+url.pathname);return route.abort();}
  if(url.pathname==='/ui-fixture')return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
  return route.continue();
 });
 for(const [size,width,height] of [['wide',1440,900],['compact',600,720]])for(const theme of ['light','dark'])for(const surface of surfaces){
  activeCase={surface,theme,size,width,height};await page.setViewportSize({width,height});await mount(page,surface,theme,size);
  const result=await exerciseSurface(page,surface,size);await frame(page);
  const actions=await visibleBounds(page,result.actions);requireVisible(actions,`${surface} ${theme} ${size}`);
  const state=await page.evaluate(()=>({viewportOverflow:document.documentElement.scrollWidth>innerWidth,prohibited:window.fixtureProhibited,calls:window.fixtureCalls,fixtureUnchanged:JSON.stringify(window.fixtureModel)===window.fixtureBaseline,navigation:[...document.querySelectorAll('.story-sidebar>.tree-item.selected')].map(item=>item.textContent.trim()),expectedNavigation:window.fixtureExpectedNavigation}));
  assert.equal(state.viewportOverflow,false,`${surface} ${theme} ${size}: viewport overflow`);assert.deepEqual(state.prohibited,[]);assert.equal(state.fixtureUnchanged,true,'Rendering mutated saved fixture data');assert.deepEqual(state.navigation,state.expectedNavigation?[state.expectedNavigation]:[],'Fixture navigation does not match surface');
  const image=`${surface}-${theme}-${size}.png`;await page.screenshot({path:path.join(output,image)});
  report.receipts.push({surface,theme,size,image,imageSha256:hash(await readFile(path.join(output,image))),width,height,viewportOverflow:state.viewportOverflow,actionsVisible:actions.every(action=>action.visible),actions,calls:state.calls,...(result.captures?{captures:result.captures}:{})});report.behaviors.push({surface,theme,size,...result.behavior});
  console.log(`PASS: ${surface} ${theme} ${size}`);
 }
 assert.equal(report.receipts.length,surfaces.length*4);assert.deepEqual(report.errors,[]);assert.deepEqual(report.prohibited,[]);
}catch(error){
 failure=error;report.errors.push(error instanceof Error?error.message:String(error));report.failedCase=activeCase??null;
 if(page&&!page.isClosed()){
  try{const image='failure.png';await page.screenshot({path:path.join(output,image)});report.failureScreenshot={image,imageSha256:hash(await readFile(path.join(output,image))),case:activeCase??null};}
  catch(screenshotError){report.errors.push('Failure screenshot could not be retained: '+screenshotError.message);}
 }
}
finally{
 try{if(browser){await browser.close();report.cleanup.browser='closed';}}catch(error){report.errors.push('Browser cleanup: '+error.message);failure??=error;}
 try{await server.close();report.cleanup.server='closed';}catch(error){report.errors.push('Server cleanup: '+error.message);failure??=error;}
 try{
  const after=await inputSnapshot();report.inputIdentity.after=after;
  await writeFile(path.join(output,'input-identity-after.json'),JSON.stringify(after,null,2)+'\n');
  const changed=[...new Set([...Object.keys(beforeInputs.files),...Object.keys(after.files)])].filter(name=>beforeInputs.files[name]!==after.files[name]);
  report.inputIdentity.changedInputs=changed;report.inputIdentity.unchanged=changed.length===0&&beforeInputs.checkoutHead===after.checkoutHead;
  if(!report.inputIdentity.unchanged){const error=Error('Renderer batch input identity changed: '+JSON.stringify({files:changed,beforeHead:beforeInputs.checkoutHead,afterHead:after.checkoutHead}));report.errors.push(error.message);failure??=error;}
 }catch(error){report.errors.push('Input identity could not be checked: '+error.message);failure??=error;}
 await writeFile(path.join(output,'metrics.json'),JSON.stringify(report,null,2)+'\n');
}
if(failure)throw failure;
console.log(`PASS: ${report.receipts.length} selected source-component captures; both themes, wide/compact, stable hashed inputs, explicit UI actions; blocked persistence/network`);
