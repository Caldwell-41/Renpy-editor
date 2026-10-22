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
const rpc=async request=>{const response=await child.request(request);receipts.push({request,response});return response;};
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
let browser,page;
const hash=source=>createHash('sha256').update(Buffer.from(source)).digest('hex');
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
  await ui.getByLabel('Height',{exact:true}).press('Enter'); await ui.getByText('Size saved. Undo reverses both dimensions together.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement===window.__helpFocus && window.__helpFocus.isConnected),true,'Enter Apply retains original focused numeric control');
  const accepted=await snapshot();assert.equal(accepted.toString(),baseline.toString().replace('640','811').replace('360','407'));
  assert.equal(receipts.filter(r=>r.request.operation==='screens.setSize').length,1);cases.push('renderer/core atomic minimal two-token patch; opaque neighbors byte-identical');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='640');assert.deepEqual(await snapshot(),baseline);
  await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='811');assert.deepEqual(await snapshot(),accepted);
  await ui.getByLabel('Width',{exact:true}).fill('811');await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText('No change. No undo entry added.',{exact:true}).waitFor();
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='640');assert.deepEqual(await snapshot(),baseline);cases.push('atomic shared Undo/Redo and no-op adds no history');
  await ui.getByLabel('Width',{exact:true}).fill('0');await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText('Enter whole numbers from 1 to 16384. Input retained.',{exact:true}).waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'0');assert.deepEqual(await snapshot(),baseline);
  await ui.getByRole('button',{name:'Cancel changes',exact:true}).click();await ui.getByLabel('Width',{exact:true}).fill('900');await ui.getByLabel('Width',{exact:true}).press('Escape');assert.deepEqual(await snapshot(),baseline);assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'640');cases.push('invalid numeric fields retained; Cancel/Escape write nothing');
  await rpc({driver:'hold'});await ui.getByLabel('Width',{exact:true}).fill('750');await ui.getByRole('button',{name:'Apply changes',exact:true}).evaluate(button=>window.__helpFocus=button);await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText(/Input retained. Review Source/).waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'750');assert.equal(await page.evaluate(()=>document.activeElement===window.__helpFocus && window.__helpFocus.isConnected),true,'refused Apply retains focused button');await rpc({driver:'release'});assert.deepEqual(await snapshot(),baseline);cases.push('actual held ApplicationHost owner rejects mutation and retains input and button focus');
  await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText('Size saved. Undo reverses both dimensions together.',{exact:true}).waitFor();
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();
  const editor=page.locator('textarea.source-editor');await editor.waitFor();const text=await editor.inputValue();await editor.fill(text.replace('750','752'));await page.getByRole('button',{name:'Save Source',exact:true}).first().click();
  await page.waitForFunction(()=>document.querySelector('#app-status')?.textContent==='Saved');await page.getByRole('button',{name:'Screens',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='752');cases.push('supported Source edit reconciles through actual Source Save');
  const session=receipts.filter(r=>r.request.operation==='screens.inspect').at(-1).request.payload.sessionId;
  const call=async(operation,payload={})=>rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId:session,...payload}});
  const opened=(await call('source.open',{path:'game/ui/help.rpy'})).value;
  await call('source.updateDraft',{path:'game/ui/help.rpy',expectedBaseRevision:opened.baseRevision,text:opened.text+'# pending Source',selectionStart:0,selectionEnd:0});
  await ui.getByLabel('Width',{exact:true}).fill('820');await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText(/Input retained. Review Source/).waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'820');await call('source.discard',{path:'game/ui/help.rpy'});cases.push('actual dirty Source refusal retains numeric draft');
  await ui.getByRole('button',{name:'Cancel changes',exact:true}).click();await rpc({driver:'externalAppend'});const external=await snapshot();
  await ui.getByLabel('Width',{exact:true}).fill('830');await ui.getByRole('button',{name:'Apply changes',exact:true}).click();await ui.getByText(/Input retained. Review Source/).waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'830');assert.deepEqual(await snapshot(),external);cases.push('ordinary external conflict retains draft and source');
  await ui.getByRole('button',{name:'Cancel changes',exact:true}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByText('Saved screen loaded. Unsupported regions remain in Source.',{exact:true}).waitFor();
  const handle=ui.getByRole('button',{name:'Resize selected element',exact:true});await handle.focus();await handle.press('Shift+ArrowRight');await ui.getByText('Size saved. Undo reverses both dimensions together.',{exact:true}).waitFor();assert.equal(await ui.getByLabel('Width',{exact:true}).inputValue(),'760');
  const beforePointer=await snapshot();let rect=await handle.boundingBox();await page.mouse.move(rect.x+6,rect.y+6);await page.mouse.down();await page.mouse.move(rect.x+20,rect.y+18);await page.keyboard.press('Escape');await page.mouse.up();assert.deepEqual(await snapshot(),beforePointer);
  rect=await handle.boundingBox();await page.mouse.move(rect.x+6,rect.y+6);await page.mouse.down();await page.mouse.move(rect.x+20,rect.y+18);await page.mouse.up();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value!=='760' && [...document.querySelectorAll('.screens-editor button')].find(b=>b.textContent==='Apply changes')?.getAttribute('aria-disabled')==='false');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screens-editor [aria-label="Width"]')?.value==='760');assert.deepEqual(await snapshot(),beforePointer);cases.push('keyboard and completed pointer resize; one undo entry; Escape cancellation');
  await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await ui.getByRole('option',{name:'Help frame',exact:true}).click();assert.equal(await ui.getByRole('button',{name:'Select Help frame',exact:true}).getAttribute('aria-pressed'),'true');await ui.getByRole('option',{name:'Help frame',exact:true}).press('Enter');await ui.getByLabel('Width',{exact:true}).waitFor();cases.push('Choose/canvas selection synchronization and Enter opens Design');
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
  for(const theme of ['light','dark'])for(const [width,height] of [[1100,720],[560,640]]){
    await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);
    await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    comparisonLayouts.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,shells:document.querySelectorAll('.app-shell').length,headers:document.querySelectorAll('.app-header').length,header:document.querySelector('.app-header')?.getBoundingClientRect().toJSON(),footer:document.querySelector('.app-footer')?.getBoundingClientRect().toJSON()})));
    await page.screenshot({path:join(output,`production-comparison-design-${theme}-${width}.png`)});
    if(width===560){await ui.getByLabel('Width',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:join(output,`production-comparison-inspector-${theme}-${width}.png`)});}
    await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await page.evaluate(()=>{document.querySelectorAll('*').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});});await page.screenshot({path:join(output,`production-comparison-choose-${theme}-${width}.png`)});
    await ui.getByRole('option',{name:'Help frame',exact:true}).dblclick();
  }
  assert.deepEqual(errors,[]);
  await writeFile(join(output,'result.json'),JSON.stringify({passed:true,cases,comparisonLayouts,baselineSHA256:hash(baseline),acceptedSHA256:hash(beforePointer),browser:browser.version(),rendererToCore:true,nativeWebView:false,sdkExecuted:false},null,2));
  console.log(`PASS ${cases.length} real renderer/core groups; no SDK or native WebView execution.`);
} catch(error) {
  if(page){await writeFile(join(output,'failure.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}
  throw error;
} finally {await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));await browser?.close();await server.close();await child.stop();}
