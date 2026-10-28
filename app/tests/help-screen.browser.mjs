// Real production renderer and Rust dispatch/service. No SDK or native WebView claim.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID, createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';
const output=resolve(process.env.HELP_SCREEN_OUTPUT??'../.toolchains/help-screen/local3');
await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`)]);
const receipts=[],errors=[],cases=[],comparisonLayouts=[];
let busyInspectOnce=true;
let ownerHeld=false,releasePending,releaseTimer,firstFailure;
let holdBusyLayoutReply=false;
const busyLayoutReply=Promise.withResolvers(),deliverBusyLayoutReply=Promise.withResolvers();
const releaseOwner=()=>{
  if(!ownerHeld)return releasePending??Promise.resolve();
  ownerHeld=false;
  const request={driver:'release'};
  releasePending=child.request(request).then(response=>{receipts.push({request,response});return response;});
  return releasePending;
};
const rpc=async request=>{
  if(request.driver==='release')return releaseOwner();
  if(request.operation==='screens.inspect'&&busyInspectOnce){
    busyInspectOnce=false;await rpc({driver:'hold'});
    const response=await child.request(request);receipts.push({request,response});
    assert.equal(response.error?.code,'RUNTIME_BUSY');releaseTimer=setTimeout(()=>void releaseOwner().catch(error=>errors.push(String(error))),100);return response;
  }
  const response=await child.request(request);receipts.push({request,response});
  if(request.driver==='hold'){ownerHeld=true;releasePending=undefined;}
  if(holdBusyLayoutReply&&request.operation==='screens.setLayout'&&response.error?.code==='RUNTIME_BUSY'){
    holdBusyLayoutReply=false;busyLayoutReply.resolve(response);await deliverBusyLayoutReply.promise;
  }
  return response;
};
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,page;
const hash=source=>createHash('sha256').update(Buffer.from(source)).digest('hex');
const focusState=()=>page.evaluate(()=>{
  const controlState=control=>control?{
    tagName:control.tagName,role:control.getAttribute('role'),ariaLabel:control.getAttribute('aria-label'),
    disabled:control.disabled??null,ariaDisabled:control.getAttribute('aria-disabled'),connected:control.isConnected,
  }:null;
  return {
    sameControl:document.activeElement===window.__helpFocus,
    expected:controlState(window.__helpFocus),actual:controlState(document.activeElement),
    width:document.querySelector('.screens-editor input[aria-label="Width"]')?.value,
    message:document.querySelector('.screen-message')?.textContent,
  };
});
try {
  assert.equal((await child.next()).ready,true); await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:720}});
  page.on('pageerror',e=>errors.push(e.message));await page.exposeBinding('helpRpc',(_,request)=>rpc(request));
  await page.route('**/help-driver',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/help-driver`);
  await page.evaluate(async()=>{window.__helpRequests=[];const {startApplication}=await import('/src/main.ts');startApplication(async(operation,payload)=>{
    const request={protocolVersion:1,requestId:crypto.randomUUID(),operation,payload};window.__helpRequests.push(request);
    return window.helpRpc(request);
  });});
  await page.locator('.recent-open').click(); await page.getByRole('button',{name:'Screens',exact:true}).click();
  const ui=page.locator('.screens-editor'); await ui.getByRole('option',{name:'Help frame',exact:true}).waitFor();
  assert.deepEqual(JSON.parse(await ui.getByLabel('Screen',{exact:true}).inputValue()),['game/ui/help.rpy','loomlight_help']);
  await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.screen-message')?.textContent.includes('refreshed') || document.querySelector('.screen-message')?.textContent.includes('loaded'));
  assert.deepEqual(JSON.parse(await ui.getByLabel('Screen',{exact:true}).inputValue()),['game/ui/help.rpy','loomlight_help']);cases.push('screenless style file sorts first; actual Help selected on initial load and refresh');
  const snapshot=async()=>Buffer.from((await rpc({driver:'snapshot'})).source);
  const baseline=await snapshot();
  await ui.getByRole('option',{name:'Help frame',exact:true}).dblclick();
  await ui.getByLabel('Width',{exact:true}).fill('811');await ui.getByLabel('Height',{exact:true}).fill('407');
  await ui.getByLabel('Height',{exact:true}).evaluate(input=>window.__helpFocus=input);
  await ui.getByLabel('Height',{exact:true}).press('Enter'); await ui.getByText('Layout saved. Undo restores all layout fields together.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('[data-layout-field=ysize]')),true,'Enter Apply retains focus in the same numeric field');
  const accepted=await snapshot();assert.equal(accepted.toString(),baseline.toString().replace('640','811').replace('360','407'));
  assert.equal(receipts.filter(r=>r.request.operation==='screens.setLayout').length,1);cases.push('renderer/core atomic minimal two-token patch; opaque neighbors byte-identical');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='640');assert.deepEqual(await snapshot(),baseline);
  await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='811');assert.deepEqual(await snapshot(),accepted);
  await ui.getByLabel('Width',{exact:true}).fill('811');await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText('No change. No undo entry added.',{exact:true}).waitFor();
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='640');assert.deepEqual(await snapshot(),baseline);cases.push('atomic shared Undo/Redo and no-op adds no history');
  await ui.getByLabel('Width',{exact:true}).fill('0');await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText('Width needs a whole number of pixels within 1 to 16384. Input retained.',{exact:true}).first().waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'0');assert.deepEqual(await snapshot(),baseline);
  await ui.getByRole('button',{name:'Cancel layout',exact:true}).click();await ui.getByLabel('Width',{exact:true}).fill('900');await ui.getByLabel('Width',{exact:true}).press('Escape');assert.deepEqual(await snapshot(),baseline);assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'640');cases.push('invalid numeric fields retained; Cancel/Escape write nothing');
  await rpc({driver:'hold'});holdBusyLayoutReply=true;
  await ui.getByLabel('Width',{exact:true}).fill('750');await ui.getByRole('button',{name:'Apply layout',exact:true}).evaluate(button=>window.__helpFocus=button);await ui.getByRole('button',{name:'Apply layout',exact:true}).click();
  let replyTimer;
  try{await Promise.race([busyLayoutReply.promise,new Promise((_,reject)=>{replyTimer=setTimeout(()=>reject(Error('Held layout request did not return RUNTIME_BUSY')),15000);})]);}finally{clearTimeout(replyTimer);}
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await writeFile(join(output,'ownership-focus-pending.json'),JSON.stringify(await focusState(),null,2));
  const pendingWrites=receipts.filter(receipt=>receipt.request.operation==='screens.setLayout').length;
  await page.keyboard.press('Enter');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
  assert.equal(receipts.filter(receipt=>receipt.request.operation==='screens.setLayout').length,pendingWrites,'Enter cannot dispatch a second write while Apply is pending');
  deliverBusyLayoutReply.resolve();
  await ui.getByText(/Input retained. Review Source/).first().waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'750');await writeFile(join(output,'ownership-focus.json'),JSON.stringify(await focusState(),null,2));assert.equal(await page.evaluate(()=>document.activeElement===window.__helpFocus && window.__helpFocus.isConnected),true,'refused Apply retains focused button');await rpc({driver:'release'});assert.deepEqual(await snapshot(),baseline);cases.push('actual held ApplicationHost owner rejects mutation and retains input and button focus');
  await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText('Layout saved. Undo restores all layout fields together.',{exact:true}).waitFor();
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();
  const editor=page.locator('textarea.source-editor');await editor.waitFor();const text=await editor.inputValue();await editor.fill(text.replace('750','752'));await page.getByRole('button',{name:'Save Source',exact:true}).first().click();
  await page.waitForFunction(()=>document.querySelector('#app-status')?.textContent==='Saved');await page.getByRole('button',{name:'Screens',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='752');cases.push('supported Source edit reconciles through actual Source Save');
  const session=receipts.filter(r=>r.request.operation==='screens.inspect').at(-1).request.payload.sessionId;
  const call=async(operation,payload={})=>rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId:session,...payload}});
  const opened=(await call('source.open',{path:'game/ui/help.rpy'})).value;
  await call('source.updateDraft',{path:'game/ui/help.rpy',expectedBaseRevision:opened.baseRevision,text:opened.text+'# pending Source',selectionStart:0,selectionEnd:0});
  await ui.getByLabel('Width',{exact:true}).fill('820');await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText(/Input retained. Review Source/).first().waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'820');await call('source.discard',{path:'game/ui/help.rpy'});cases.push('actual dirty Source refusal retains numeric draft');
  await ui.getByRole('button',{name:'Cancel layout',exact:true}).click();await rpc({driver:'externalAppend'});const external=await snapshot();
  await ui.getByLabel('Width',{exact:true}).fill('830');await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText(/Input retained. Review Source/).first().waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'830');assert.deepEqual(await snapshot(),external);cases.push('ordinary external conflict retains draft and source');
  await ui.getByRole('button',{name:'Cancel layout',exact:true}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByText('Saved screen loaded. Unsupported regions remain in Source.',{exact:true}).waitFor();
  await ui.getByLabel('Width',{exact:true}).fill('760');await ui.getByRole('button',{name:'Apply layout',exact:true}).click();await ui.getByText('Layout saved. Undo restores all layout fields together.',{exact:true}).waitFor();
  const beforePointer=await snapshot();
  assert.equal(await ui.getByRole('button',{name:'Resize selected element',exact:true}).count(),0,'Unresolved styles and opaque layout cannot supply guessed gesture geometry');
  await ui.locator('.screen-canvas-status').filter({hasText:/unresolved/}).waitFor();cases.push('unsupported composition keeps numeric editing and refuses fabricated canvas geometry');
  await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await ui.getByRole('option',{name:'Help frame',exact:true}).press('Enter');await ui.getByLabel('Width',{exact:true}).waitFor();cases.push('element list and Source remain usable without a qualified canvas');
  await writeFile(join(output,'accepted.rpy'),beforePointer);
  await page.getByRole('button',{name:'Toggle navigation size',exact:true}).click();
  for(const theme of ['light','dark'])for(const [width,height] of [[1100,720],[560,640]]){
    await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.screenshot({path:join(output,`production-design-${theme}-${width}.png`),fullPage:true});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(width===560){await ui.getByLabel('Width',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`production-inspector-${theme}-${width}.png`)});}
    await ui.getByRole('button',{name:'1  Choose',exact:true}).click();
    await ui.getByRole('option',{name:'Help frame',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`production-choose-${theme}-${width}.png`)});
    await ui.getByRole('option',{name:'Help frame',exact:true}).press('Enter');
  }
  await page.setViewportSize({width:1100,height:720});await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByRole('option',{name:'Help frame',exact:true}).dblclick();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'760');assert.deepEqual(await snapshot(),beforePointer);cases.push('close/open new project session retains accepted source');
  await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['game/ui/z_compare.rpy','flow_help']));
  await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await ui.getByRole('option',{name:'Help frame',exact:true}).dblclick();
  await ui.getByLabel('Width',{exact:true}).fill('640');await ui.getByLabel('Width',{exact:true}).press('Enter');
  await ui.getByText('Layout saved. Undo restores all layout fields together.',{exact:true}).waitFor();
  for(const theme of ['light','dark'])for(const [width,height] of [[1100,720],[560,640]]){
    await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    comparisonLayouts.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,shells:document.querySelectorAll('.app-shell').length,headers:document.querySelectorAll('.app-header').length,header:document.querySelector('.app-header')?.getBoundingClientRect().toJSON(),footer:document.querySelector('.app-footer')?.getBoundingClientRect().toJSON()})));
    await page.screenshot({path:join(output,`production-comparison-design-${theme}-${width}.png`)});
    if(width===1100) {
      const geometry=await ui.locator('.screen-layout').evaluate(host=>({width:host.getBoundingClientRect().width,applyBottom:host.querySelector('.layout-actions').getBoundingClientRect().bottom,fieldHeight:host.querySelector('input').getBoundingClientRect().height,viewport:innerHeight}));
      assert.equal(geometry.fieldHeight,32);assert(geometry.applyBottom<=geometry.viewport-26,JSON.stringify(geometry));
      await ui.locator('.layout-group summary').first().click();
      await ui.getByLabel('Minimum width',{exact:true}).scrollIntoViewIfNeeded();
      assert(await ui.getByRole('button',{name:'Apply layout',exact:true}).isVisible());
      await ui.locator('.layout-group summary').first().click();
    }
    if(width===560){await ui.getByLabel('Width',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`production-comparison-inspector-${theme}-${width}.png`)});}
    await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});await page.screenshot({path:join(output,`production-comparison-choose-${theme}-${width}.png`)});
    await ui.getByRole('option',{name:'Help frame',exact:true}).dblclick();
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(output,'result.json'),JSON.stringify({passed:true,cases,comparisonLayouts,baselineSHA256:hash(baseline),acceptedSHA256:hash(beforePointer),browser:browser.version(),rendererToCore:true,nativeWebView:false,sdkExecuted:false},null,2));
  console.log(`PASS ${cases.length} real renderer/core groups; no SDK or native WebView execution.`);
} catch(error) {
  firstFailure=error;
  await Promise.allSettled([
    writeFile(join(output,'failure-error.txt'),error.stack??String(error)),
    ...(page?[
      page.locator('body').innerText().then(text=>writeFile(join(output,'failure.txt'),text)),
      focusState().then(state=>writeFile(join(output,'failure-state.json'),JSON.stringify(state,null,2))),
      page.screenshot({path:join(output,'failure.png'),fullPage:true}),
    ]:[]),
  ]);
  throw error;
} finally {
  clearTimeout(releaseTimer);
  deliverBusyLayoutReply.resolve();
  const cleanupErrors=[];
  for(const [name,close] of [['release held owner',releaseOwner],['browser',()=>browser?.close()],['server',()=>server.close()],['driver',()=>child.stop()]]){
    try{await close();}catch(error){cleanupErrors.push({name,error:String(error)});}
  }
  await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));
  await writeFile(join(output,'cleanup.json'),JSON.stringify({ownerHeld,driver:child.exitStatus(),errors:cleanupErrors},null,2));
  if(cleanupErrors.length){
    console.error('Help controller cleanup failed:',cleanupErrors);
    if(!firstFailure)throw Error('Help controller cleanup failed; see cleanup.json');
  }
}
