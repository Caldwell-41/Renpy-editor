// Focused production-main/core proof for the final A4 review corrections. No SDK.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID, createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, join} from 'node:path';
import {mkdir, readFile, writeFile, rename, access} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
import {productionStylesheetLinks} from './production-stylesheets.mjs';

const output=resolve(process.env.A4_RECOVERY_OUTPUT??`target/help-a4-recovery-${randomUUID()}`);
await mkdir(output,{recursive:true});
const scratch=join(output,`loomlight-help-controller-${randomUUID()}`);
const executable=resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`);
const candidate=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(process.env.A4_EXPECTED_CANDIDATE)assert.equal(candidate,process.env.A4_EXPECTED_CANDIDATE);
execFileSync('git',['diff','--quiet','HEAD','--','src','src-core','Cargo.toml','Cargo.lock']);
const frontendTree=execFileSync('git',['rev-parse','HEAD:app/src'],{encoding:'utf8'}).trim(),coreTree=execFileSync('git',['rev-parse','HEAD:app/src-core'],{encoding:'utf8'}).trim();
const driverSha256=createHash('sha256').update(await readFile(executable)).digest('hex');
const child=driverProcess(executable,[scratch]);
const result={passed:false,candidate,frontendTree,coreTree,driverSha256,sdkExecuted:false,engineBoundary:'intercepted before dispatch',checks:[],captures:[],pageErrors:[],refusals:[]};
const requests=[];let session,server,browser,page;
async function rpc(request){
 if(['screens.canvasRender','screens.canvasStatus'].includes(request.operation))return {ok:true,value:{phase:'unavailable',reason:'Engine rendering is outside this focused authoring check.'}};
 assert(!/^(runtime\.|sdk\.|renpy\.)/.test(request.operation),'No execution operation is selected');
 const response=await child.request(request);requests.push({operation:request.operation,ok:response.ok});
 if(response.value?.sessionId)session=response.value.sessionId;
 if(!response.ok)result.refusals.push({operation:request.operation,code:response.error.code});
 return response;
}
async function call(operation,payload={}){
 const response=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{...(session?{sessionId:session}:{}),...payload}});
 assert.equal(response.ok,true,JSON.stringify(response));return response.value;
}
async function apply(command){const model=await call('scene.list');return call('scene.apply',{expectedProjectRevision:model.projectRevision,expectedSourceMapRevision:model.sourceMapRevision,command});}
const count=operation=>requests.filter(item=>item.operation===operation).length;
async function capture(label){
 for(const [width,height] of [[1100,720],[560,640]]){
  await page.setViewportSize({width,height});const file=join(output,`${label}-${width}.png`);await page.screenshot({path:file});
  result.captures.push({label,width,height,scale:1,theme:'dark',sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
 }
 await page.setViewportSize({width:1100,height:720});
}
try{
 assert.equal((await child.next()).ready,true);
 server=await createServer({root:resolve('.'),configFile:false,cacheDir:join(output,'vite-cache'),logLevel:'error',server:{host:'127.0.0.1',port:0}});await server.listen();
 browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:720},deviceScaleFactor:1,colorScheme:'dark'});page.setDefaultTimeout(8000);
 page.on('pageerror',error=>result.pageErrors.push(error.message));await page.exposeBinding('helpRpc',(_,request)=>rpc(request));
 const styles=await productionStylesheetLinks();await page.route('**/a4-recovery',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8">${styles}<div id="app"></div>`}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/a4-recovery`);
 await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.helpRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
 await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
 const ui=page.locator('.screens-editor'),form=ui.locator('section.screen-create');
 await ui.getByRole('button',{name:'New screen',exact:true}).click();await form.getByLabel('Screen name').fill('a4_dialog');await form.getByLabel('Screen kind',{exact:true}).selectOption('dialog');
 assert(await form.getByRole('button',{name:'Create screen'}).isDisabled());assert.equal(await page.locator('dialog.screen-create').count(),0);
 await form.getByRole('button',{name:'Open Assets'}).click();await page.getByRole('button',{name:'Screens',exact:true}).click();await form.getByText(/Add a UI image first/).waitFor();
 assert.equal(await form.getByLabel('Screen name').inputValue(),'a4_dialog');assert.equal(await form.getByLabel('Screen kind',{exact:true}).inputValue(),'dialog');assert.equal(await form.getByLabel('Start with',{exact:true}).inputValue(),'help');assert.equal(count('screens.create'),0);
 await capture('no-image-inspector');await form.getByRole('button',{name:'Cancel',exact:true}).click();result.checks.push('inline inspector and no-image Assets round trip retain typed creation intent');

 const choice=await child.request({driver:'choosePanelImage'});const imported=await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'a4_seal',displayName:'A4 seal'});const asset=imported.assets.find(item=>item.kind==='uiImage');assert(asset);
 await ui.getByRole('button',{name:'New screen',exact:true}).click();await form.getByLabel('Screen name').fill('a4_dialog');await form.getByLabel('Screen kind',{exact:true}).selectOption('dialog');
 await ui.locator('.screen-starter-canvas img').waitFor({state:'visible'});
 const geometry=await page.evaluate(()=>{const card=document.querySelector('.screen-card').getBoundingClientRect(),preview=document.querySelector('.screen-starter-canvas .screen-panels-preview').getBoundingClientRect(),form=document.querySelector('section.screen-create');return {cardLeft:card.left,previewRight:preview.right,previewWidth:preview.width,previewHeight:preview.height,formScrollWidth:form.scrollWidth,formWidth:form.clientWidth};});
 assert(geometry.previewWidth>200&&geometry.previewRight<=geometry.cardLeft);assert(geometry.formScrollWidth<=geometry.formWidth);result.previewGeometry=geometry;
 await capture('typed-starter-inspector');await page.setViewportSize({width:560,height:640});assert(await ui.locator('.screen-stage').isHidden());await page.setViewportSize({width:1100,height:720});
 const assetPath=join(scratch,'synthetic-project',asset.relativePath),withheld=`${assetPath}.withheld`;await rename(assetPath,withheld);
 try{
  await form.getByRole('button',{name:'Create screen'}).click();await form.getByRole('alert').getByText(/retained/i).waitFor();assert(await form.getByRole('button',{name:'Create screen'}).isDisabled());assert(await form.getByRole('button',{name:'Open Assets'}).isVisible());
  await form.getByRole('button',{name:'Open Assets'}).click();await page.getByRole('button',{name:'Screens',exact:true}).click();await form.getByText(/Add a UI image first/).waitFor();
  assert.equal(await form.locator('[name="starter-image"]').inputValue(),asset.id);assert.equal(await form.getByLabel('Screen name').inputValue(),'a4_dialog');assert.equal(await form.getByLabel('Screen kind',{exact:true}).inputValue(),'dialog');assert(await form.getByRole('button',{name:'Create screen'}).isDisabled());
  await capture('unavailable-image-return');assert.equal((await call('screens.list')).owned.some(item=>item.name==='a4_dialog'),false);
 }finally{await rename(withheld,assetPath);}
 await form.getByRole('button',{name:'Cancel',exact:true}).click();result.checks.push('disappeared image refuses create and remains reachable through real Assets return without retargeting');
 await ui.getByRole('button',{name:'New screen',exact:true}).click();await form.getByLabel('Screen name').fill('a4_dialog');await form.getByLabel('Screen kind',{exact:true}).selectOption('dialog');await form.getByRole('button',{name:'Create screen'}).click();await form.waitFor({state:'detached'});
 const owner=(await call('screens.list')).owned.find(item=>item.name==='a4_dialog');assert(owner);const source=(await call('source.open',{path:owner.path})).text;assert(source.includes('modal True')&&source.includes('action Return()'));

 let model=await call('scene.list');
 // Select a reference-free disposable scenario through deliberate Source writes.
 // The source-foundation fixture otherwise contains protected Python Beats, which
 // correctly prevent every Scene deletion. Production guards remain unchanged.
 result.initialProtectedScenes=model.scenes.filter(scene=>scene.beats.some(beat=>beat.protected)).length;
 for(const scene of model.scenes){
  const opened=await call('source.open',{path:scene.sourcePath});
  const prepared=await call('source.updateDraft',{path:scene.sourcePath,expectedBaseRevision:opened.baseRevision,text:`label ${scene.technicalLabel}:\n    "A4 recovery follows this line."\n    return\n`,selectionStart:0,selectionEnd:0});
  await call('source.save',{path:scene.sourcePath,expectedBaseRevision:prepared.baseRevision,expectedDraftVersion:prepared.draftVersion});
 }
 const beforeIds=new Set(model.scenes.map(item=>item.id));model=await apply({type:'createScene',chapterId:model.chapters[0].id,displayName:'Temporary insertion'});const temporary=model.scenes.find(item=>!beforeIds.has(item.id));assert(temporary);await apply({type:'selectScene',sceneId:temporary.id});
 await page.getByRole('button',{name:'Story',exact:true}).click();await page.getByRole('button',{name:'Add screen Beat',exact:true}).click();let draft=page.locator('.new-beat');await draft.locator('select').first().selectOption('callScreen');await draft.getByText('Dialog ready.').waitFor();await draft.getByRole('button',{name:'Cancel',exact:true}).click();
 await apply({type:'deleteScene',sceneId:temporary.id,expectedSourceRevision:temporary.sourceRevision});
 await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByRole('button',{name:/^3\s+Use in Story$/}).click();await page.getByRole('button',{name:'Add screen Beat',exact:true}).click();draft=page.locator('.new-beat');await draft.getByText(/original insertion Scene is unavailable/).waitFor();await draft.getByText('Dialog ready.').waitFor();
 const writes=count('scene.apply');await draft.getByRole('button',{name:'Add Beat',exact:true}).click();assert.equal(count('scene.apply'),writes);assert.equal(await page.locator('.story-screen-pending').count(),0);
 model=await call('scene.list');const current=model.scenes.find(item=>item.id===model.lastOpen.sceneId),anchor=current.beats.find(item=>!item.owner&&!item.conditionalBranch&&!item.protected&&item.payload.type!=='customCode');assert(anchor);
 await draft.getByLabel('Insert before').selectOption(anchor.id);const marker=page.locator('.story-screen-pending');await marker.waitFor();assert.equal(await marker.evaluate(element=>element.nextElementSibling.dataset.beatId),anchor.id);
 const cancelStyle=await draft.getByRole('button',{name:'Cancel',exact:true}).evaluate(element=>getComputedStyle(element).borderTopStyle);assert.equal(cancelStyle,'solid');await capture('recovered-pending-anchor');
 await draft.getByRole('button',{name:'Add Beat',exact:true}).click();await draft.waitFor({state:'detached'});assert.equal(await page.locator('.story-screen-pending').count(),0);
 model=await call('scene.list');const beats=model.scenes.find(item=>item.id===current.id).beats,callIndex=beats.findIndex(item=>item.payload.type==='callScreen');assert(callIndex>=0&&beats[callIndex+1]?.id===anchor.id);result.checks.push('deleted remembered Scene recovers through production main and accepts only explicitly selected placement');result.checks.push('pending marker matches the accepted anchor, Cancel is outlined and successful acceptance removes the marker');
 const document=await call('screens.inspect',{path:owner.path});
 await call('screens.compose',{screenId:owner.id,expectedRevision:document.revision,command:{type:'add',parentId:owner.rootId,kind:'textbutton',text:'Pending close'}});
 await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByRole('treeitem',{name:'Text button · Pending close',exact:true}).press('Enter');await ui.locator('.screen-dismissal select').selectOption('finishInteraction');
 const base=await call('source.open',{path:owner.path}),renamed=await call('source.updateDraft',{path:owner.path,expectedBaseRevision:base.baseRevision,text:base.text.replace('screen a4_dialog():','screen renamed_a4_dialog():'),selectionStart:0,selectionEnd:0});
 await call('source.save',{path:owner.path,expectedBaseRevision:renamed.baseRevision,expectedDraftVersion:renamed.draftVersion});
 await ui.getByRole('button',{name:/^1\s+Choose$/}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
 const retained=ui.locator('.screen-dismissal-retained');await retained.getByText(/Pending close/).waitFor();await capture('unresolved-action-draft');await retained.getByRole('button',{name:'Cancel action draft'}).click();await retained.waitFor({state:'detached'});
 await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.locator('.recent-open').waitFor();result.checks.push('an unresolved screen keeps its original Finish draft cancellable and does not trap project close');
 assert.equal(result.checks.length,5);assert.deepEqual(result.pageErrors,[]);result.passed=true;
}catch(error){result.failure={message:error.message,stack:error.stack};if(page){await writeFile(join(output,'failure.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}throw error;}
finally{
 await browser?.close();await server?.close();
 try{await child.stop();await assert.rejects(access(scratch));result.cleanupComplete=true;}catch(error){result.passed=false;result.cleanupFailure=error.message;throw error;}
 finally{result.driver=child.exitStatus();result.requests=requests;await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}
}
console.log(`PASS A4 recovery: ${result.checks.length} production-main/core groups; no SDK/helper.`);
