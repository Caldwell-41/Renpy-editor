// Focused production equation control/keyboard comparison with the immutable #88 reference.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
import {productionStylesheetLinks} from './production-stylesheets.mjs';
const approved='6ecf64704044a6fee9fc4ee6b3a54985d84b9b10';
const output=resolve(process.env.STORY_ARITHMETIC_BROWSER_OUTPUT??`../.toolchains/arithmetic-96/browser-${randomUUID()}`);await mkdir(output,{recursive:true});
// Read-only reference materialization, without creating a checkout or changing approval metadata.
const pinned=path=>execFileSync('git',['show',`${approved}:${path}`],{encoding:'utf8'});
execFileSync('git',['diff','--exit-code',approved,'--','app/design-lab/screens/story-revamp','app/design-lab/page.ts','app/design-lab/page.css','app/src/icons.ts']);
const scratch=join(output,`loomlight-help-controller-${randomUUID()}`),child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target','debug/examples/help-controller-driver'+(process.platform==='win32'?'.exe':'')),[scratch]);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,session,project,scene;const result={passed:false,approved,scopedReference:true,actualCore:true,sdkExecuted:false,nativeWebView:false,cases:[],errors:[]};
async function call(operation,payload={}){const r=await child.request({protocolVersion:1,requestId:randomUUID().replaceAll('-',''),operation,payload:{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})}});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;}
try{
 assert.equal((await child.next()).ready,true);const recent=(await call('project.listRecent'))[0];project=await call('project.openRecent',{recentId:recent.id});session=project.sessionId;
 for(const [technicalName,variableType,defaultValue] of [['trust','int','99'],['bonus','int','7'],['money','decimal',99.5]])await call('variable.create',{technicalName,variableType,defaultValue});
 const model=await call('scene.list');scene=model.scenes.find(s=>s.id===model.entrySceneId);
 const source=await call('source.open',{path:scene.sourcePath});const draft=await call('source.updateDraft',{path:scene.sourcePath,expectedBaseRevision:source.baseRevision,text:(await readFile(new URL('../../tests/fixtures/arithmetic-96/story.rpy',import.meta.url),'utf8')).replace('ENTRY_LABEL',scene.technicalLabel),selectionStart:0,selectionEnd:0});await call('source.save',{path:scene.sourcePath,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});await call('project.close');session=undefined;
 await server.listen();browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();page.setDefaultTimeout(10000);page.on('pageerror',e=>result.errors.push(e.message));
 await page.exposeBinding('arithmeticRpc',async(_,request)=>{assert(!request.operation.startsWith('runtime.')||request.operation==='runtime.status');const response=await child.request(request);if(response.ok&&request.operation==='project.openRecent')session=response.value.sessionId;return response;});
 await page.route('**/story-arithmetic',async route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html data-theme="dark"><head>${await productionStylesheetLinks()}</head><body><div id="app"></div></body></html>`}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/story-arithmetic`);
 await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.arithmeticRpc({protocolVersion:1,requestId:crypto.randomUUID().replaceAll('-',''),operation,payload}));});
 await page.locator('.recent-open').click();await page.locator('.story-track-column').first().waitFor();
 const live=await call('scene.list'),beat=live.scenes.find(s=>s.id===scene.id).beats.find(b=>b.payload.value?.operation==='add');
 await page.locator(`.story-track-column[data-beat-id="${beat.id}"] > .story-track-beat`).click();await page.getByRole('button',{name:'Writing focus',exact:true}).click();
 const formula=page.getByRole('combobox',{name:'Formula'});await formula.fill('bon');await page.keyboard.press('Tab');assert.equal(await formula.inputValue(),'bonus');assert(await formula.evaluate(n=>document.activeElement===n));
 await formula.fill('1 // 0');await page.getByLabel('Change: Add',{exact:true}).click();await page.getByRole('option',{name:'Floor divide by',exact:true}).focus();await page.getByText('This divides by zero.',{exact:true}).waitFor();assert(await page.getByRole('option',{name:'Floor divide by',exact:true}).evaluate(n=>document.activeElement===n),'Backend feedback must retain operation-menu focus');await page.keyboard.press('Escape');
 await formula.fill('(bonus + 2) * 3');await page.getByLabel('Change: Add',{exact:true}).click();await page.getByRole('option',{name:'Floor divide by',exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await formula.inputValue(),'(bonus + 2) * 3');assert.equal(await page.getByLabel('Change: Floor divide by',{exact:true}).count(),1);
 await page.getByLabel('Change: Floor divide by',{exact:true}).click();await page.keyboard.press('Escape');assert(await page.getByLabel('Change: Floor divide by',{exact:true}).evaluate(n=>document.activeElement===n));
 await page.getByLabel('Change: Floor divide by',{exact:true}).click();await page.getByRole('option',{name:'Add',exact:true}).click();await formula.fill('1 // 0');await formula.blur();await page.getByText('This divides by zero.',{exact:true}).waitFor();assert.equal(await formula.getAttribute('aria-invalid'),'true');await formula.fill('(bonus + 2) * 3');await page.getByText('Current value unknown. Declaration defaults are not current Story values.',{exact:true}).waitFor();
 const reference=await browser.newPage();reference.setDefaultTimeout(10000);
 await reference.route('**/reference-styles.css',r=>r.fulfill({contentType:'text/css',body:pinned('app/src/styles.css')}));await reference.route('**/reference-refresh.css',r=>r.fulfill({contentType:'text/css',body:pinned('app/src/ui-refresh.css')}));
 await reference.route('**/arithmetic-reference',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html data-theme="dark"><link rel="stylesheet" href="/reference-styles.css"><link rel="stylesheet" href="/reference-refresh.css"><body><main id="preview"></main></body></html>'}));
 await reference.goto(`http://127.0.0.1:${server.httpServer.address().port}/arithmetic-reference`);await reference.evaluate(async()=>{const {mountStudy}=await import('/design-lab/screens/story-revamp/study.ts');window.disposeReference=mountStudy(document.querySelector('#preview'),{state:'populated',theme:'dark'},'combined');});
 await reference.locator('[data-action=bottom-tracks]').click();await reference.locator('[data-track-beat][data-beat-kind=choice]').click();await reference.locator('[data-action=open-choice-3]').click();await reference.locator('[data-track-beat][data-beat-kind=setVariable]').nth(1).click();await reference.getByRole('combobox',{name:'Formula'}).fill('(bonus + 2) * 3');
 const geometry=async(page,selector)=>page.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {width:r.width,height:r.height,font:s.font,fontSize:s.fontSize,color:s.color,background:s.backgroundColor,visible:r.width>0&&r.height>0,overflow:document.documentElement.scrollWidth>innerWidth+1};});
 for(const size of [{name:'wide',width:1600,height:1000},{name:'compact',width:720,height:850}]){
  await page.setViewportSize(size);await reference.setViewportSize(size);await formula.scrollIntoViewIfNeeded();await reference.getByRole('combobox',{name:'Formula'}).scrollIntoViewIfNeeded();
  const production=await geometry(page,'.story-formula'),approvedControl=await geometry(reference,'.sc-formula');assert(production.visible&&approvedControl.visible&&!production.overflow);assert.equal(production.height,approvedControl.height,"Match the approved rendered field height");
  const files={production:`${size.name}-production.png`,reference:`${size.name}-reference.png`,productionControl:`${size.name}-production-control.png`,referenceControl:`${size.name}-reference-control.png`};
  await page.screenshot({path:join(output,files.production)});await reference.screenshot({path:join(output,files.reference)});await page.locator('.story-arithmetic-editor').screenshot({path:join(output,files.productionControl)});await reference.locator('[data-editor-for][data-kind=setVariable]').screenshot({path:join(output,files.referenceControl)});
  result.cases.push({size,production,approvedControl,files});
 }
 await formula.fill('1 /');await page.getByRole('button',{name:'Show game window',exact:true}).click();assert.equal(await formula.inputValue(),'1 /');await page.getByRole('button',{name:'Writing focus',exact:true}).click();assert.equal(await formula.inputValue(),'1 /');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 const accepted=await call('source.open',{path:scene.sourcePath});assert(accepted.text.includes('$ trust += (bonus + 2) * 3  # imported compound'));
 result.keyboard={suggestionTab:true,suggestionFocus:true,operationEnterEscape:true,formulaRetained:true,writingFocus:true,cancelNoWrite:true};assert.deepEqual(result.errors,[]);result.passed=true;
}catch(error){result.failure={message:error.message,stack:error.stack};if(browser)for(const [i,page] of browser.contexts().flatMap(c=>c.pages()).entries()){await page.screenshot({path:join(output,`failure-${i}.png`)}).catch(()=>{});}throw error;}
finally{await browser?.close();await server.close();await child.stop();result.driver=child.exitStatus();await assert.rejects(access(scratch));result.cleanupComplete=true;for(const c of result.cases)for(const filename of Object.values(c.files)){const bytes=await readFile(join(output,filename));(result.captures??=[]).push({filename,sha256:createHash('sha256').update(bytes).digest('hex')});}await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}
console.log('PASS focused real-browser arithmetic controls/core and scoped approved reference comparison.');
