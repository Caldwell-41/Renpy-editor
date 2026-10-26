// The packaged L02 controller against real core services. Chrome is not native proof.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID, createHash} from 'node:crypto';
import {createServer} from 'vite';
import {chromium, webkit} from 'playwright';
import {driverProcess} from './phase2-driver-process.mjs';
import {spawnSync} from 'node:child_process';

const output = resolve(process.env.COMPOSITION_OUTPUT ?? '../.toolchains/screen-composition/browser-01');
const canvas = process.env.COMPOSITION_CANVAS === '1';
await mkdir(output, {recursive:true});
const child = driverProcess(resolve(`target/debug/examples/help-controller-driver${process.platform === 'win32' ? '.exe' : ''}`), [join(tmpdir(), `loomlight-help-controller-${randomUUID()}`), ...(canvas ? ['composition-canvas'] : [])]);
const server = await createServer({root:resolve('.'), logLevel:'error', server:{host:'127.0.0.1',port:0}});
const receipts = [], errors = [];
let browser, page;
try {
  assert.equal((await child.next(canvas ? 180000 : 15000)).ready, true); await server.listen();
  browser = process.env.COMPOSITION_BROWSER === 'webkit' ? await webkit.launch({headless:true}) : await chromium.launch({channel:'chrome',headless:true});
  page = await browser.newPage({viewport:{width:1100,height:800},colorScheme:'dark'});
  page.on('pageerror', error => errors.push(error.message));
  await page.exposeBinding('compositionRpc', async (_, request) => {
    if (request.operation === 'probe.runtimeUiReport') { receipts.push({request}); return {ok:true,protocolVersion:1,requestId:request.requestId,value:{recorded:true}}; }
    const response = await child.request(request); receipts.push({request,response}); return response;
  });
  await page.exposeBinding('compositionObserve', async (_, name) => {
    if(name === 'composition-passed' && canvas) {
      await page.locator('.screen-game[data-stale="false"] .screen-node[data-index="5"]').waitFor({timeout:30000});
      const before = await page.evaluate(() => window.compositionRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation:'project.current',payload:{}}));
      const sessionId = before.value.sessionId;
      const read = () => page.evaluate(async sessionId => (await window.compositionRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation:'source.open',payload:{sessionId,path:'game/ui/travel_notes.rpy'}})).value.text, sessionId);
      const sourceBefore = await read();
      await page.locator('.screen-node[data-index="5"]').click();
      assert.equal(await page.locator('.screen-tree [aria-selected="true"]').getAttribute('aria-label'),'Text · Your next stop');
      await page.locator('.screen-node[data-index="5"]').dblclick(); await page.getByLabel('Text',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Back to elements',exact:true}).click();
      await page.getByRole('button',{name:'Add element',exact:true}).click(); await page.getByLabel('New element text',{exact:true}).fill('Unapplied canvas draft');
      await page.locator('.screen-game[data-stale="false"] .screen-pending-addition').waitFor({timeout:30000});
      assert.equal(await read(), sourceBefore, 'the real helper previews an addition without a source write');
      await page.screenshot({path:join(output,'draft-addition-helper.png'),fullPage:true});
      await page.getByRole('button',{name:'Cancel',exact:true}).click();
      assert.equal(await read(), sourceBefore);
    }
    await page.screenshot({path:join(output, `${name}.png`),fullPage:true});
  });
  await page.route('**/composition-driver', route => route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><link rel="stylesheet" href="/src/screen-ui.css"><div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/composition-driver`);
  await page.evaluate(async () => {
    window.__TAURI_INTERNALS__ = {invoke:async (_, args) => { const result = await window.compositionRpc(args.request); if(args.request.operation === 'probe.runtimeUiReport') window.__compositionReport = args.request.payload; return result; }};
    window.__loomlightCompositionObserve = name => window.compositionObserve(name);
    const {enableRichSourceEditor} = await import('/src/source-editor.ts'); enableRichSourceEditor();
    const {startApplication} = await import('/src/main.ts'); const {requestCore} = await import('/src/bridge.ts'); startApplication(requestCore);
  });
  await page.evaluate(await readFile('src-tauri/src/native_editor_probe.js','utf8'));
  await page.evaluate(await readFile('src-tauri/src/screen_composition_probe.js','utf8'));
  await page.waitForFunction(() => window.__compositionReport, {}, {timeout:120000});
  const report = await page.evaluate(() => window.__compositionReport);
  await writeFile(join(output,'result.json'),JSON.stringify({controllerTestOnly:true,nativeWebView:false,browser:browser.version(),report},null,2));
  assert.equal(report.passed,true,JSON.stringify(report)); assert.deepEqual(errors,[]);
  const gate = spawnSync(process.env.HARNESS_PYTHON ?? 'python3', ['-c', 'import json,sys;sys.path.insert(0,"scripts");from runtime_probe_cases import runtime_report_ok;assert runtime_report_ok("screen-composition",json.load(sys.stdin))'],
    {input:JSON.stringify({evidence:'runtime-ui-packaged',case:'screen-composition',passed:true,cleanupComplete:true,details:report}),encoding:'utf8'});
  assert.equal(gate.status,0,gate.stdout+gate.stderr);
  await writeFile(join(output,'accepted.rpy'),report.acceptedSource);
  await writeFile(join(output,'accepted.sha256'),createHash('sha256').update(report.acceptedSource).digest('hex')+'\n');
  const ui=page.locator('.screens-editor'), body=ui.locator(`[data-node-id="${report.identities[5]}"]`), title=ui.locator(`[data-node-id="${report.identities[4]}"]`);
  await title.dragTo(body,{targetPosition:{x:20,y:3}});
  await page.waitForFunction(() => document.querySelector('.screen-message')?.textContent.includes('Order changed'));
  const reordered = await child.request({driver:'snapshot',path:report.identity.path});
  assert.ok(Buffer.from(reordered.source).toString().indexOf('text "Travel notes"') < Buffer.from(reordered.source).toString().indexOf('text "Next stop:'));
  await ui.getByRole('button',{name:'Undo',exact:true}).click();
  await page.waitForFunction(ids => document.querySelectorAll('.screen-tree [data-node-id]')[4]?.dataset.nodeId === ids[5] && document.querySelector('.screen-tree [aria-selected="true"]')?.dataset.nodeId === ids[4], report.identities);
  await body.click();
  await page.getByRole('button',{name:'Toggle navigation size',exact:true}).click();
  for(const [width,height] of [[1100,800],[560,720]]) {
    await page.setViewportSize({width,height});
    await page.waitForFunction(() => document.querySelector('.screen-canvas-status')?.textContent.includes('unresolved source dependencies'));
    await page.screenshot({path:join(output,`production-dark-${width}.png`),fullPage:true});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false,'composition fits the viewport');
    await title.click(); const remove=ui.getByRole('button',{name:'Remove element',exact:true}); await remove.scrollIntoViewIfNeeded();
    const position=await ui.locator('.screen-card').evaluate(element => ({x:element.getBoundingClientRect().x,y:element.getBoundingClientRect().y,scroll:element.scrollTop,panel:element.closest('.screens-editor').scrollTop}));
    await remove.click();
    const cancel=page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}); await cancel.waitFor();
    assert.equal(await cancel.evaluate(element => document.activeElement === element),true);
    assert.deepEqual(await ui.locator('.screen-card').evaluate(element => ({x:element.getBoundingClientRect().x,y:element.getBoundingClientRect().y,scroll:element.scrollTop,panel:element.closest('.screens-editor').scrollTop})),position,'confirmation preserves panel position and scroll');
    await page.screenshot({path:join(output,`confirmation-dark-${width}.png`),fullPage:true});
    await page.keyboard.press('Escape');
  }
  await page.setViewportSize({width:1100,height:800}); await title.click(); await ui.getByRole('button',{name:'Remove element',exact:true}).click();
  await child.request({driver:'externalAppend',path:report.identity.path});
  await page.getByRole('dialog').getByRole('button',{name:'Remove text',exact:true}).click();
  await page.getByRole('dialog').getByText(/Nothing removed/).waitFor();
  assert.equal(Buffer.from((await child.request({driver:'snapshot',path:report.identity.path})).source).toString(),report.acceptedSource+'# ordinary external writer\r\n');
  await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  await writeFile(join(output,'additional-checks.json'),JSON.stringify({passed:true,pointerReorder:true,stationaryConfirmations:true,staleRemovalRetained:true,helperCanvas:canvas},null,2));
  console.log(`PASS ${report.stages.length - 1} composition UI-to-core groups; browser rehearsal only.`);
} catch(error) {
  if(page){await writeFile(join(output,'failure.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}
  throw error;
} finally {await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));await browser?.close();await server.close();await child.stop();}
