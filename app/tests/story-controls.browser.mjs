import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const output=process.env.LOOMLIGHT_STORY_CAPTURE_DIR ?? '/private/tmp/loomlight-story-controls-round9';
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
await mkdir(output,{recursive:true});let browser;
const errors=[],results=[];
try{
 await server.listen();try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 const page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(8000);
 await page.route('**/story-controls',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><style>body{margin:0}.review-shell{height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}.review-tree{overflow:auto;border-right:1px solid var(--border-normal);padding:12px}.review-shell>.scene-workspace{height:100vh;box-sizing:border-box}@media(max-width:800px){.review-shell{grid-template-columns:minmax(0,1fr)}.review-tree{display:none}}</style></head><body><div class="review-shell"><aside class="review-tree"></aside><main class="scene-workspace"></main></div></body></html>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/story-controls`);
 await page.evaluate(async()=>{const {renderSceneAuthoring}=await import('/src/scene-ui.ts');const {storyFixture}=await import('/tests/story-controls-fixture.ts');const model=storyFixture(6);window.storyDispose=renderSceneAuthoring(document.querySelector('main'),document.querySelector('aside'),model,{apply:async()=>{throw Error('Capture fixture refuses writes');},status:()=>{},resolution:{width:1280,height:720},present:async()=>{throw Error('No media');},viewScene:()=>{},viewContinuation:()=>{},viewSource:()=>{}});});
 for(const theme of ['light','dark'])for(const spec of [{name:'wide',width:1440,height:900,font:16},{name:'laptop',width:1100,height:760,font:16},{name:'compact',width:720,height:850,font:16},{name:'scaled',width:1100,height:850,font:20}]){
  await page.setViewportSize({width:spec.width,height:spec.height});await page.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=`${font}px`;},{theme,font:spec.font});
  await page.locator('[data-beat-id="choice"] .beat-select').click();
  const panel=page.locator('[data-beat-id="choice"]');await panel.scrollIntoViewIfNeeded();await panel.locator('input[aria-label="Condition value"]').first().focus();
  const geometry=await page.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,panels:[...document.querySelectorAll('.scene-workspace,.beats-region,.choice-options')].map(node=>({class:node.className,overflow:node.scrollWidth>node.clientWidth+2}))}));
  assert.equal(geometry.pageOverflow,false,`${theme}/${spec.name} page overflow`);assert.ok(geometry.panels.every(panel=>!panel.overflow),`${theme}/${spec.name} authoring overflow`);
  const filename=`${theme}-${spec.name}-choice.png`;await page.screenshot({path:`${output}/${filename}`});results.push({theme,layout:spec.name,filename,geometry});
  await page.locator('[data-beat-id="choice"] .beat-select').click();
 }
 await page.setViewportSize({width:1100,height:850});await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.fontSize='16px';});
 await page.locator('[data-beat-id="nested-if-5"] .beat-select').click();await page.locator('[data-beat-id="nested-if-5"] .story-operation').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/dark-deep-condition.png`});
 const deep=await page.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>innerWidth+1,authoringOverflow:document.querySelector('.beats-region').scrollWidth>document.querySelector('.beats-region').clientWidth+2}));assert.equal(deep.pageOverflow,false);assert.equal(deep.authoringOverflow,false);results.push({theme:'dark',layout:'deep',filename:'dark-deep-condition.png',geometry:deep});
 assert.deepEqual(errors,[]);await writeFile(`${output}/result.json`,JSON.stringify({passed:true,layer:'Chromium renderer fixture; synthetic input; no native execution',results,errors},null,2)+'\n');console.log(JSON.stringify({passed:true,captures:results.length,runtimeErrors:errors.length,pageOverflow:false,authoringOverflow:false}));
}finally{await browser?.close();await server.close();}
