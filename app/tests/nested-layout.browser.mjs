// Production application, controller, dispatch and transaction/history service.
// Rendering is unavailable in this check; SDK geometry is qualified separately.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile} from 'node:fs/promises';
import {driverProcess} from './phase2-driver-process.mjs';

const output=resolve(process.env.NESTED_LAYOUT_OUTPUT ?? '../.toolchains/l04/controller');
await mkdir(output,{recursive:true});
const child=driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[join(tmpdir(),`loomlight-help-controller-${randomUUID()}`),'canvas-position']);
const server=await createServer({root:resolve('.'),logLevel:'error',server:{host:'127.0.0.1',port:0}});
const errors=[],receipts=[],plans=[];
let browser,sessionId,passed=false;
const rpc=async request=>{
  if(request.operation==='screens.canvasStatus')return {ok:true,value:{phase:'unavailable',message:'SDK rendering is qualified separately.'}};
  if(request.operation==='screens.canvasRender') {
    const plan=await child.request({...request,operation:'screens.canvasPlan'});plans.push(plan);
    return {ok:true,value:{phase:'unavailable',message:'SDK rendering is qualified separately.'}};
  }
  const response=await child.request(request);receipts.push({operation:request.operation,ok:response.ok});
  if(response.value?.sessionId)sessionId=response.value.sessionId;
  return response;
};
const request=async(operation,payload={})=>{
  const result=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId,...payload}});
  assert.equal(result.ok,true,JSON.stringify(result));return result.value;
};
try {
  assert.equal((await child.next()).ready,true);await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:800}});page.setDefaultTimeout(8000);
  await page.routeWebSocket('**',()=>{});page.on('pageerror',error=>errors.push(error.message));
  await page.exposeBinding('nestedRpc',(_,request)=>rpc(request));
  await page.route('**/nested-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/nested-controller`);
  await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.nestedRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
  await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
  await page.evaluate(async()=>{const {updatePreferences}=await import('/src/preferences.ts');await updatePreferences({theme:'dark'});});
  await page.getByRole('button',{name:'Toggle navigation size',exact:true}).click();
  const catalog=await request('screens.list');
  const created=await request('screens.create',{name:'nested',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});
  const owner=created.owned.find(screen=>screen.name==='nested');
  const ui=page.locator('.screens-editor');
  await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
  await ui.getByLabel('Screen',{exact:true}).selectOption(JSON.stringify(['owned',owner.id]));
  await ui.getByRole('button',{name:'1  Choose',exact:true}).click();
  const read=async()=>(await request('source.open',{path:owner.path})).text;
  const initial=await read();
  await ui.getByRole('button',{name:'Add element',exact:true}).click();
  await ui.getByRole('button',{name:'Grid',exact:true}).click();
  await ui.getByRole('button',{name:'Add grid',exact:true}).click();
  await ui.getByRole('treeitem',{name:'Grid',exact:true}).waitFor();
  assert.match(await read(),/grid 2 2:/);assert.match(await read(),/allow_underfull True/);
  await ui.getByRole('treeitem',{name:'Grid',exact:true}).dblclick();
  const columns=ui.getByRole('textbox',{name:'Columns',exact:true}), rows=ui.getByRole('textbox',{name:'Rows',exact:true}),spacing=ui.getByRole('textbox',{name:'Spacing',exact:true});
  assert.equal(await columns.inputValue(),'2');await columns.fill('3');await rows.fill('1');await spacing.fill('8');await columns.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.layout-state')?.textContent==='Saved');
  assert.equal(await columns.evaluate(element=>document.activeElement===element),true);
  const accepted=await read();assert.match(accepted,/grid 3 1:/);assert.match(accepted,/spacing 8/);
  await columns.fill('0');await columns.press('Enter');assert.equal(await columns.getAttribute('aria-invalid'),'true');assert.equal(await read(),accepted);
  await columns.press('Escape');assert.equal(await columns.inputValue(),'3');
  await ui.getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-layout-field=columns]')?.value==='2');
  await ui.getByRole('button',{name:'Redo',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-layout-field=columns]')?.value==='3');assert.equal(await read(),accepted);
  await page.screenshot({path:join(output,'grid-dark-wide.png'),fullPage:true});
  await columns.fill('4');
  await ui.getByRole('button',{name:'View in Source',exact:true}).first().click();
  const sourceDialog=page.getByRole('dialog',{name:'Screen source',exact:true});
  await sourceDialog.waitFor();
  assert.match(await sourceDialog.locator('pre').innerText(),/grid 3 1:/);
  assert.doesNotMatch(await sourceDialog.locator('pre').innerText(),/grid 4 1:/);
  await page.keyboard.press('Escape');assert.equal(await columns.inputValue(),'4');
  await columns.press('Escape');
  await ui.getByRole('button',{name:'Back to elements',exact:true}).click();
  for(const text of ['One','Two','Three']) {
    await ui.getByRole('button',{name:'Add element',exact:true}).click();
    await ui.getByRole('textbox',{name:'New element text',exact:true}).fill(text);
    await ui.getByRole('button',{name:'Add text',exact:true}).click();
    await ui.getByRole('treeitem',{name:`Text · ${text}`,exact:true}).waitFor();
  }
  await ui.getByRole('treeitem',{name:'Grid',exact:true}).dblclick();
  const fullGrid=await read();await columns.fill('1');await columns.press('Enter');
  await ui.getByText(/The grid needs room for 3 children/).first().waitFor();assert.equal(await read(),fullGrid);
  await columns.press('Escape');
  await ui.getByRole('button',{name:'Back to elements',exact:true}).click();
  await ui.getByRole('treeitem',{name:'Text · One',exact:true}).dblclick();
  const width=ui.getByRole('textbox',{name:'Width',exact:true});await width.fill('120');
  await ui.getByRole('button',{name:'Edit grid',exact:true}).click();
  await columns.fill('4');await columns.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.layout-state')?.textContent==='Saved');
  await ui.getByRole('button',{name:'Back to elements',exact:true}).click();
  assert.equal(await ui.getByRole('treeitem',{name:'Text · One',exact:true}).getAttribute('data-layout-draft'),'true');
  await ui.getByRole('treeitem',{name:'Text · One',exact:true}).dblclick();assert.equal(await width.inputValue(),'120');
  await width.press('Enter');await page.waitForFunction(()=>document.querySelector('.layout-state')?.textContent==='Saved');
  assert.match(await read(),/xsize 120/);
  await width.fill('130');
  const source=await request('source.open',{path:owner.path}),changed=source.text.replace('xsize 120','xsize 125');
  const draft=await request('source.updateDraft',{path:owner.path,expectedBaseRevision:source.baseRevision,text:changed,selectionStart:0,selectionEnd:0});
  await request('source.save',{path:owner.path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});
  await ui.getByRole('button',{name:'Refresh Source',exact:true}).click();
  await ui.getByText('Source refreshed. Unfinished drafts retain their original revision.',{exact:true}).waitFor();
  await width.press('Enter');await ui.getByText(/This layout draft uses an earlier Source revision/).first().waitFor();
  assert.equal(await width.inputValue(),'130');assert.equal(await read(),changed);
  await width.press('Escape');assert.equal(await width.inputValue(),'125');
  assert.deepEqual(errors,[]);assert(plans.length>0);passed=true;
} catch(error) {errors.push(String(error));throw error;}
finally {
  await writeFile(join(output,'result.json'),JSON.stringify({passed,controllerAndRealCore:true,sdkGeometry:false,receipts,errors},null,2));
  await browser?.close();await server.close();await child.stop();
}
