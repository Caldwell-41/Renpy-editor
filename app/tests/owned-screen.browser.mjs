// Production renderer, ApplicationHost, Source and transactions on a disposable project.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID, createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {mkdir, writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';

const output=resolve(process.env.OWNED_SCREEN_OUTPUT??'../.toolchains/owned-screen/browser-01');
await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`)]);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const receipts=[],cases=[],errors=[];
let browser,page,session;
const rpc=async request=>{const response=await child.request(request);receipts.push({request,response});return response;};
const call=async(operation,payload={})=>{
  const response=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId:session,...payload}});
  assert.equal(response.ok,true,JSON.stringify(response));return response.value;
};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
try {
  assert.equal((await child.next()).ready,true);await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:720}});
  page.on('pageerror',error=>errors.push(error.message));await page.exposeBinding('ownedRpc',(_,request)=>rpc(request));
  await page.route('**/owned-driver',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/owned-driver`);
  await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication(async(operation,payload)=>window.ownedRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
  await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
  const ui=page.locator('.screens-editor');await ui.getByRole('option',{name:'Screen root',exact:true}).waitFor();
  session=receipts.findLast(r=>r.request.operation==='screens.list').request.payload.sessionId;
  const initial=await call('screens.list');assert.deepEqual(initial.owned,[]);
  const helpBefore=(await call('source.open',{path:'game/ui/help.rpy'})).text;
  const catalog=()=>call('screens.list');
  const start=async name=>{await ui.getByRole('button',{name:'1  Choose',exact:true}).click();await ui.getByRole('button',{name:'New blank screen',exact:true}).click();await ui.getByLabel('Screen name',{exact:true}).fill(name);};
  await start('cancelled_screen');await ui.getByRole('button',{name:'Cancel creation',exact:true}).click();assert.deepEqual(await catalog(),initial);
  await start('escape_screen');await ui.getByLabel('Screen name',{exact:true}).press('Escape');assert.deepEqual(await catalog(),initial);cases.push('Cancel and Escape leave the source inventory and metadata revisions unchanged');
  await start('2invalid');await ui.getByRole('button',{name:'Create blank screen',exact:true}).click();await ui.getByRole('dialog').getByText('Enter a valid screen name. Input retained.',{exact:true}).waitFor();assert.equal(await ui.getByLabel('Screen name',{exact:true}).inputValue(),'2invalid');
  await ui.getByLabel('Screen name',{exact:true}).fill('loomlight_help');await ui.getByRole('button',{name:'Create blank screen',exact:true}).click();await ui.getByRole('dialog').getByText(/Input retained. Cancel creation/).waitFor();assert.equal(await ui.getByLabel('Screen name',{exact:true}).inputValue(),'loomlight_help');assert.deepEqual(await catalog(),initial);
  await ui.getByRole('button',{name:'Cancel creation',exact:true}).click();cases.push('invalid input and a cross-file declaration collision retain the creation draft and write nothing');
  await start('travel_notes');await ui.getByLabel('Screen name',{exact:true}).press('Enter');
  await page.waitForFunction(()=>document.querySelector('.screen-picker select')?.selectedOptions[0]?.textContent.includes('travel_notes'));
  const accepted=await catalog(),owned=accepted.owned[0];assert.equal(owned.name,'travel_notes');assert.equal(owned.resolved,true);assert.notEqual(owned.id,owned.rootId);
  assert.deepEqual(JSON.parse(await ui.getByLabel('Screen',{exact:true}).inputValue()),['owned',owned.id]);
  assert.equal(await ui.getByRole('treeitem',{name:'Screen root',exact:true}).getAttribute('aria-selected'),'true');
  assert.equal(await ui.locator('.screen-node').count(),0,'a blank screen contains no invented canvas controls');
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();
  const editor=page.locator('textarea.source-editor');await editor.waitFor();
  const source=await editor.inputValue();assert.ok(source.endsWith('screen travel_notes():\n    pass\n'));
  const selected=await editor.evaluate(e=>e.value.slice(e.selectionStart,e.selectionEnd));assert.equal(selected,'screen travel_notes():\n    pass\n');
  await writeFile(join(output,'accepted.rpy'),source);await writeFile(join(output,'identity.json'),JSON.stringify(owned,null,2));
  await page.getByRole('button',{name:'Screens',exact:true}).click();cases.push('actual Choose to core creates one owned definition, selects its root and opens the exact Source declaration');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await ui.getByText(/Unresolved owned screen travel_notes/).waitFor();assert.deepEqual((await catalog()).owned,[]);
  await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.screen-tree [aria-selected="true"]')?.getAttribute('aria-label')==='Screen root');assert.deepEqual((await catalog()).owned,accepted.owned);cases.push('one shared Undo removes creation and ownership; one Redo restores both IDs without retargeting');
  await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByRole('treeitem',{name:'Screen root',exact:true}).waitFor();
  session=receipts.findLast(r=>r.request.operation==='screens.list').request.payload.sessionId;
  assert.deepEqual((await catalog()).owned,accepted.owned);assert.deepEqual(JSON.parse(await ui.getByLabel('Screen',{exact:true}).inputValue()),['owned',owned.id]);cases.push('project close and reopen retains the screen/root identities and selects the owned screen');
  await start('stale_draft');await rpc({driver:'externalAppend'});await ui.getByRole('button',{name:'Create blank screen',exact:true}).click();await ui.getByRole('dialog').getByText(/Input retained. Cancel creation/).waitFor();assert.equal(await ui.getByLabel('Screen name',{exact:true}).inputValue(),'stale_draft');assert.deepEqual((await catalog()).owned,accepted.owned);
  await ui.getByRole('button',{name:'Cancel creation',exact:true}).click();await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();await ui.getByText('Saved screen loaded. Unsupported regions remain in Source.',{exact:true}).waitFor();cases.push('an ordinary external change refuses a stale creation and retains its input');
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();await editor.waitFor();await editor.fill('# Source offset\n'+source.replace('    pass','    text "Travel notes"'));await page.getByRole('button',{name:'Save Source',exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('#app-status')?.textContent==='Saved');
  await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByRole('treeitem',{name:'Text · Travel notes',exact:true}).waitFor();const reconciled=(await catalog()).owned[0];for(const key of ['id','rootId','name','path','resolved'])assert.deepEqual(reconciled[key],owned[key]);cases.push('a real Source edit and shifted byte offsets reconcile the owned root');
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();await editor.waitFor();await editor.fill((await editor.inputValue()).replace('screen travel_notes():','screen renamed_notes():'));await page.getByRole('button',{name:'Save Source',exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('#app-status')?.textContent==='Saved');await page.getByRole('button',{name:'Screens',exact:true}).click();await ui.getByText(/Unresolved owned screen travel_notes/).waitFor();
  assert.deepEqual(JSON.parse(await ui.getByLabel('Screen',{exact:true}).inputValue()),['owned',owned.id]);assert.equal((await catalog()).owned[0].resolved,false);assert.equal(await ui.locator('.screen-tree [role="option"]').count(),0);cases.push('a Source rename shows the original unresolved identity and does not select a neighboring declaration');
  const helpAfter=(await call('source.open',{path:'game/ui/help.rpy'})).text;assert.equal(helpAfter,helpBefore+'# ordinary external writer\r\n');
  for(const theme of ['light','dark'])for(const [width,height] of [[1100,720],[560,640]]){await page.setViewportSize({width,height});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await page.screenshot({path:join(output,`unresolved-${theme}-${width}.png`),fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  assert.deepEqual(errors,[]);
  await writeFile(join(output,'result.json'),JSON.stringify({passed:true,cases,owned,acceptedSHA256:hash(source),browser:browser.version(),rendererToCore:true,nativeWebView:false,sdkExecuted:false},null,2));
  console.log(`PASS ${cases.length} owned-screen renderer/core groups.`);
} catch(error){if(page){await writeFile(join(output,'failure.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}throw error;}
finally {await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));await browser?.close();await server.close();await child.stop();}
