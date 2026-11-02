// Main navigation and production Help/Story controls against the real core. No SDK/helper.
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {randomUUID,createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {mkdir,writeFile,access,readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {driverProcess} from './phase2-driver-process.mjs';

const output=resolve(process.env.PANEL_MAIN_OUTPUT??'../.toolchains/help-ui/main-01');
await mkdir(output,{recursive:false});
const scratch=join(tmpdir(),`loomlight-help-controller-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target','debug/examples/help-controller-driver'+(process.platform==='win32'?'.exe':'')),[scratch]);
const receipts=[],errors=[],checks=[];
const result={passed:false,rendererToCore:true,sdkExecuted:false,nativeWebView:false,physicalInput:false,
  candidate:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim()};
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const script=await readFile(new URL(import.meta.url));await writeFile(join(output,'harness.mjs'),script);result.harnessSHA256=hash(script);
let browser,page,server,session;
const rpc=async request=>{
  // This journey checks authoring, not the separately qualified engine canvas.
  if(['screens.canvasRender','screens.canvasStatus'].includes(request.operation))return {ok:true,value:{phase:'unavailable',message:'Canvas rendering is outside this authoring journey.'}};
  const response=await child.request(request);receipts.push({request,response});if(response.value?.sessionId)session=response.value.sessionId;return response;
};
const call=async(operation,payload={})=>{
  const response=await rpc({protocolVersion:1,requestId:randomUUID(),operation,payload:{sessionId:session,...payload}});
  assert.equal(response.ok,true,JSON.stringify(response));return response.value;
};
const read=async path=>(await call('source.open',{path})).text;
const sourceApplyCount=()=>receipts.filter(r=>r.request.operation==='scene.apply'&&r.request.payload.command.type!=='selectScene').length;
try{
  assert.equal((await child.next()).ready,true);
  const recent=(await call('project.listRecent'))[0];await call('project.openRecent',{recentId:recent.id});
  const choice=await child.request({driver:'choosePanelImage'});
  const assets=await call('asset.import',{authorityId:choice.authorityId,kind:'uiImage',technicalName:'panel_emblem',displayName:'Panel emblem'});
  assert(assets.assets.some(asset=>asset.kind==='uiImage'&&asset.status==='available'));
  const original=await call('scene.list'),entry=original.scenes.find(scene=>scene.id===original.lastOpen.sceneId);
  const storyBefore=await read(entry.sourcePath);await call('project.close');session=undefined;
  server=await createServer({root:resolve('.'),cacheDir:join(output,'vite-cache'),logLevel:'error',server:{host:'127.0.0.1',port:0}});await server.listen();
  browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1100,height:720},colorScheme:'dark'});
  page.on('pageerror',error=>errors.push(error.message));await page.exposeBinding('helpRpc',(_,request)=>rpc(request));
  const styles=['styles','ui-refresh','screen-ui','screen-panels','screen-components'];
  await page.route('**/help-controller',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8">'+styles.map(name=>`<link rel="stylesheet" href="/src/${name}.css">`).join('')+'<div id="app"></div>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/help-controller`);
  await page.evaluate(async()=>{const {startApplication}=await import('/src/main.ts');startApplication((operation,payload)=>window.helpRpc({protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}));});
  await page.locator('.recent-open').click();await page.getByRole('button',{name:'Screens',exact:true}).click();
  const ui=page.locator('.screens-editor');await ui.getByRole('button',{name:'New screen',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'New screen',exact:true});await dialog.getByLabel('Screen name',{exact:true}).fill('travel_help');
  await dialog.locator('.screen-panels-preview img').waitFor({state:'visible'});
  assert.equal(await dialog.locator('input:not([type=radio])').count(),1,'Only the approved name field precedes creation');
  for(const [width,height] of [[1100,720],[560,640]]){
    await page.setViewportSize({width,height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.screenshot({path:join(output,`new-help-dark-${width}.png`),fullPage:true});
  }
  await page.setViewportSize({width:1100,height:720});
  await dialog.getByRole('button',{name:'Create screen',exact:true}).click();await dialog.waitFor({state:'detached'});
  await page.waitForFunction(()=>document.querySelector('.screen-picker select')?.selectedOptions[0]?.textContent.includes('travel help'));
  const owner=(await call('screens.list')).owned.find(owner=>owner.name==='travel_help');assert(owner?.resolved);
  const accepted=await read(owner.path);assert.match(accepted,/text "Help"/);assert.match(accepted,/action Hide\("travel_help"\)/);
  assert.equal(receipts.filter(r=>r.request.operation==='screens.create').length,1);
  checks.push('Main New screen creates the typed Help starter once, with real passive asset preview and ordinary nodes');
  await ui.getByRole('button',{name:/^1\s+Choose$/}).click();await ui.getByRole('treeitem',{name:'Text · Help',exact:true}).press('Enter');
  const text=ui.getByRole('textbox',{name:'Text',exact:true});await text.fill('Travel help');await ui.locator('[data-text-apply]').click();
  await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled===true);
  const edited=await read(owner.path);assert.equal(edited,accepted.replace('text "Help"','text "Travel help"'));
  checks.push('Appearance edits after creation use the existing text transaction and preserve all other starter bytes');
  const beforeHandoff=sourceApplyCount();await ui.getByRole('button',{name:/^3\s+Use in Story$/}).click();
  await page.getByRole('button',{name:'Add screen Beat',exact:true}).waitFor();assert.equal(sourceApplyCount(),beforeHandoff);
  assert.equal(await read(entry.sourcePath),storyBefore,'Navigation creates no Beat');
  await page.getByRole('button',{name:'Add screen Beat',exact:true}).click();
  let draft=page.locator('.new-beat');await draft.getByLabel('Panel screen',{exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.new-beat [aria-label="Panel screen"]')?.disabled===false);
  assert.equal(await draft.getByLabel('Panel screen',{exact:true}).inputValue(),owner.id);
  await draft.getByRole('button',{name:'Add Beat',exact:true}).click();await draft.waitFor({state:'detached'});
  let model=await call('scene.list'),scene=model.scenes.find(scene=>scene.id===entry.id),shown=scene.beats.find(beat=>beat.payload.type==='showScreen');
  assert.equal(shown.payload.target.screenId,owner.id);assert.equal(shown.payload.target.sourceName,owner.name);
  const shownSource=await read(entry.sourcePath);assert.equal(shownSource,storyBefore.replace('    return','    show screen travel_help\r\n    return'));
  await page.screenshot({path:join(output,'show-story-dark-wide.png'),fullPage:true});
  checks.push('Use in Story only navigates; explicit Add screen Beat captures the selected stable Panel and authors exact Show Source');
  await page.getByRole('button',{name:'Add screen Beat',exact:true}).click();draft=page.locator('.new-beat');
  await draft.locator('select').first().selectOption('hideScreen');await page.waitForFunction(()=>document.querySelector('.new-beat [aria-label="Panel screen"]')?.disabled===false);
  await draft.getByRole('button',{name:'Add Beat',exact:true}).click();await draft.waitFor({state:'detached'});
  const hidden=await read(entry.sourcePath);assert.equal(hidden,shownSource.replace('    return','    hide screen travel_help\r\n    return'));
  await page.locator('.scene-history').getByRole('button',{name:'Undo',exact:true}).click();await page.waitForFunction(()=>![...document.querySelectorAll('.beat-card')].some(card=>card.textContent.includes('Hide screen')));
  assert.equal(await read(entry.sourcePath),shownSource);await page.locator('.scene-history').getByRole('button',{name:'Redo',exact:true}).click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.beat-card')].some(card=>card.textContent.includes('Hide screen')));assert.equal(await read(entry.sourcePath),hidden);
  await page.getByRole('button',{name:'Close Project',exact:true}).click();await page.locator('.recent-open').click();
  await page.getByRole('button',{name:'Story',exact:true}).click();await page.getByRole('button',{name:'Add screen Beat',exact:true}).waitFor();
  model=await call('scene.list');scene=model.scenes.find(scene=>scene.id===entry.id);
  assert.equal(await read(entry.sourcePath),hidden);assert.equal(await read(owner.path),edited);
  assert.deepEqual(scene.beats.filter(beat=>['showScreen','hideScreen'].includes(beat.payload.type)).map(beat=>beat.payload.target),[{screenId:owner.id,sourceName:owner.name},{screenId:owner.id,sourceName:owner.name}]);
  checks.push('Main Hide, one-step Undo/Redo and project reopen retain exact Story bytes, bindings and edited Help');
  assert.deepEqual(errors,[]);result.passed=true;result.hashes={created:hash(accepted),edited:hash(edited),show:hash(shownSource),hide:hash(hidden)};
}catch(error){result.failure={message:error.message,stack:error.stack};if(page){await writeFile(join(output,'failure.txt'),await page.locator('body').innerText());await page.screenshot({path:join(output,'failure.png'),fullPage:true});}throw error;}
finally{
  await browser?.close();await server?.close();
  try{await child.stop();await assert.rejects(access(scratch));result.cleanupComplete=true;}catch(error){result.passed=false;result.cleanupFailure=error.message;throw error;}
  finally{result.driver=child.exitStatus();result.checks=checks;await writeFile(join(output,'receipts.json'),JSON.stringify(receipts,null,2));await writeFile(join(output,'result.json'),JSON.stringify(result,null,2));}
}
console.log(`PASS ${checks.length} main Help/Story renderer/core groups. No SDK/native proof.`);
