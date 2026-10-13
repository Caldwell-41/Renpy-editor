import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const previewProof=process.argv.includes('--preview-proof');
const output=process.env.LOOMLIGHT_STORY_CAPTURE_DIR ?? '/private/tmp/loomlight-story-controls-round9';
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
await mkdir(output,{recursive:true});let browser;
const errors=[],results=[];let page,passed=false,failure;
const previewReady=async()=>{
 await page.waitForFunction(()=>{
  const canvas=document.querySelector('.preview-canvas'),surround=document.querySelector('.preview-surround');
  if(!canvas||!surround)return false;
  const c=canvas.getBoundingClientRect(),s=surround.getBoundingClientRect(),font=parseFloat(getComputedStyle(document.documentElement).fontSize);
  return c.height>=8*font-4&&Math.abs(c.width/c.height-1280/720)<0.02&&c.top>=s.top-1&&c.bottom<=s.bottom+1;
 });
};
const previewGeometry=()=>page.evaluate(()=>{
 const box=node=>{const b=node.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};};
 const preview=document.querySelector('.preview-region'),canvas=document.querySelector('.preview-canvas'),message=canvas.querySelector('.preview-empty'),manual=document.querySelector('.illustrative-preview');
 const c=box(canvas),p=box(preview),m=box(message),font=parseFloat(getComputedStyle(document.documentElement).fontSize);
 return {canvas:c,preview:p,message:m,minimumCanvasHeight:8*font-4,messageText:message.textContent,messageFits:message.scrollHeight<=message.clientHeight+1,
  canvasVisible:c.top>=p.top-1&&c.bottom<=p.bottom+1&&c.top>=-1&&c.bottom<=innerHeight+1,
  messageVisible:m.top>=c.top-1&&m.bottom<=c.bottom+1&&m.left>=c.left-1&&m.right<=c.right+1,
  manualHeight:manual.clientHeight,manualScrollHeight:manual.scrollHeight,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
  authoringOverflow:document.querySelector('.beats-region').scrollWidth>document.querySelector('.beats-region').clientWidth+2};
});
const capturePreview=async(theme,spec,state)=>{
 await previewReady();await page.locator('.preview-canvas').scrollIntoViewIfNeeded();
 const geometry=await previewGeometry();results.push({theme,layout:spec.name,state,geometry});
 assert(geometry.canvasVisible&&geometry.canvas.height>=geometry.minimumCanvasHeight,`${theme}/${spec.name}/${state}: canvas clipped or unreadably short`);
 assert(geometry.messageVisible&&geometry.messageFits,`${theme}/${spec.name}/${state}: unknown-state message clipped`);
 assert.match(geometry.messageText,/unknown after code or unevaluated flow/);assert(!geometry.pageOverflow&&!geometry.authoringOverflow);
 const filename=`${theme}-${spec.name}-${state}.png`;await page.screenshot({path:`${output}/${filename}`});results.at(-1).filename=filename;
};
const allocation=async value=>{
 const divider=page.getByRole('separator',{name:'Resize scene preview'});await divider.focus();
 const old=Number(await divider.getAttribute('aria-valuenow'));assert(old>=20&&old<=70);
 for(let n=0;n<Math.abs(value-old)/2;n++)await divider.press(value<old?'ArrowUp':'ArrowDown');
 assert.equal(await divider.getAttribute('aria-valuenow'),String(value));
 if(value===20||value===70){
  await divider.press(value===20?'ArrowUp':'ArrowDown');assert.equal(await divider.getAttribute('aria-valuenow'),String(value));
 }
};
const selectors=async()=>{
 const choices=page.locator('.illustrative-preview select');assert.equal(await choices.count(),7);
 await choices.last().focus();
 await page.waitForFunction(()=>{const manual=document.querySelector('.illustrative-preview'),target=[...manual.querySelectorAll('select')].at(-1),m=manual.getBoundingClientRect(),s=target.getBoundingClientRect();return document.activeElement===target&&manual.scrollTop>0&&s.top>=m.top-1&&s.bottom<=m.bottom+1;});
 assert.equal(await choices.last().inputValue(),'');
 const lastAccess=await page.evaluate(()=>({scrollTop:document.querySelector('.illustrative-preview').scrollTop,focusedGroup:document.activeElement.dataset.previewGroupId}));
 await choices.first().focus();
 await page.waitForFunction(()=>{const manual=document.querySelector('.illustrative-preview'),target=manual.querySelector('select'),m=manual.getBoundingClientRect(),s=target.getBoundingClientRect();return document.activeElement===target&&s.top>=m.top-1&&s.bottom<=m.bottom+1;});
 results.at(-1).selectorAccess={last:lastAccess,firstFocused:await choices.first().evaluate(node=>node===document.activeElement)};
};
try{
 await server.listen();try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(8000);
 await page.route('**/story-controls',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><style>body{margin:0}.review-shell{height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}.review-tree{overflow:auto;border-right:1px solid var(--border-normal);padding:12px}.review-shell>.scene-workspace{height:100vh;box-sizing:border-box}@media(max-width:800px){.review-shell{grid-template-columns:minmax(0,1fr)}.review-tree{display:none}}</style></head><body><div class="review-shell"><aside class="review-tree"></aside><main class="scene-workspace"></main></div></body></html>'}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/story-controls`);
 await page.evaluate(async()=>{const {renderSceneAuthoring}=await import('/src/scene-ui.ts');const {storyFixture}=await import('/tests/story-controls-fixture.ts');const model=storyFixture(6);window.storyDispose=renderSceneAuthoring(document.querySelector('main'),document.querySelector('aside'),model,{apply:async()=>{throw Error('Capture fixture refuses writes');},status:()=>{},resolution:{width:1280,height:720},present:async()=>{throw Error('No media');},viewScene:()=>{},viewContinuation:()=>{},viewSource:()=>{}});});
 for(const theme of ['light','dark'])for(const spec of [{name:'wide',width:1440,height:900,font:16},{name:'laptop',width:1100,height:760,font:16},{name:'compact',width:720,height:850,font:16},{name:'scaled',width:1100,height:850,font:20}]){
  await page.setViewportSize({width:spec.width,height:spec.height});await page.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=`${font}px`;},{theme,font:spec.font});
  if(previewProof){
   await allocation(34);await capturePreview(theme,spec,'default');await selectors();
   if(['laptop','scaled'].includes(spec.name)){
    for(const value of [20,70]){await allocation(value);await capturePreview(theme,spec,`divider-${value}`);await selectors();}
    await page.getByRole('button',{name:'Writing focus',exact:true}).click();
    assert.equal(await page.locator('.preview-region').isVisible(),false);assert.equal(await page.locator('.preview-divider').isVisible(),false);
    assert.equal(await page.getByRole('button',{name:'Exit Writing focus',exact:true}).getAttribute('aria-pressed'),'true');
    const filename=`${theme}-${spec.name}-writing.png`;await page.screenshot({path:`${output}/${filename}`});results.push({theme,layout:spec.name,state:'writing',filename,previewHidden:true,dividerHidden:true});
    await page.getByRole('button',{name:'Exit Writing focus',exact:true}).click();await allocation(34);await previewReady();
   }
   continue;
  }
  await page.locator('[data-beat-id="choice"] .beat-select').click();
  const panel=page.locator('[data-beat-id="choice"]');await panel.scrollIntoViewIfNeeded();await panel.locator('input[aria-label="Condition value"]').first().focus();
  const geometry=await page.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>window.innerWidth+1,panels:[...document.querySelectorAll('.scene-workspace,.beats-region,.choice-options')].map(node=>({class:node.className,overflow:node.scrollWidth>node.clientWidth+2}))}));
  assert.equal(geometry.pageOverflow,false,`${theme}/${spec.name} page overflow`);assert.ok(geometry.panels.every(panel=>!panel.overflow),`${theme}/${spec.name} authoring overflow`);
  const filename=`${theme}-${spec.name}-choice.png`;await page.screenshot({path:`${output}/${filename}`});results.push({theme,layout:spec.name,filename,geometry});
  await page.locator('[data-beat-id="choice"] .beat-select').click();
 }
 if(!previewProof){
 await page.setViewportSize({width:1100,height:850});await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.fontSize='16px';});
 await page.locator('[data-beat-id="nested-if-5"] .beat-select').click();await page.locator('[data-beat-id="nested-if-5"] .story-operation').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/dark-deep-condition.png`});
 const deep=await page.evaluate(()=>({pageOverflow:document.documentElement.scrollWidth>innerWidth+1,authoringOverflow:document.querySelector('.beats-region').scrollWidth>document.querySelector('.beats-region').clientWidth+2}));assert.equal(deep.pageOverflow,false);assert.equal(deep.authoringOverflow,false);results.push({theme:'dark',layout:'deep',filename:'dark-deep-condition.png',geometry:deep});
 }
 assert.deepEqual(errors,[]);passed=true;console.log(JSON.stringify({passed:true,previewProof,captures:results.length,runtimeErrors:errors.length}));
}catch(error){failure=String(error);throw error;
}finally{
 if(!passed&&page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await writeFile(`${output}/failure.html`,await page.content()).catch(()=>{});}
 await writeFile(`${output}/result.json`,JSON.stringify({passed,previewProof,layer:'Chromium renderer fixture; synthetic input; no native execution',results,errors,failure},null,2)+'\n');
 await browser?.close();await server.close();
}
