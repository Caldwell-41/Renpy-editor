// Story Combined layout in Chromium: the stage fits the project ratio whole beside the
// editor, Tracks keeps six lanes, the Branch path wraps to three rows and then scrolls,
// and nothing overflows the page. Captures go to LOOMLIGHT_STORY_CAPTURE_DIR.
import assert from 'node:assert/strict';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const output=process.env.LOOMLIGHT_STORY_CAPTURE_DIR ?? join(tmpdir(),'loomlight-story-combined');
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),logLevel:'error',server:{host:'127.0.0.1',port:0}});
await mkdir(output,{recursive:true});let browser;
const errors=[],results=[];let page,passed=false,failure;
const shell='<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><style>body{margin:0}.review-shell{height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}.review-tree{overflow:auto;border-right:1px solid var(--border-normal);padding:12px}.review-shell>.scene-workspace{height:100vh;box-sizing:border-box}@media(max-width:800px){.review-shell{grid-template-columns:minmax(0,1fr)}.review-tree{display:none}}</style></head><body><div class="review-shell"><aside class="review-tree"></aside><main class="scene-workspace"></main></div></body></html>';
const mount=resolution=>page.evaluate(async resolution=>{
 window.storyDispose?.();document.querySelector('main').replaceChildren();document.querySelector('aside').replaceChildren();
 const {renderStoryView}=await import('/tests/story-controls-fixture.ts');const {storyFixture}=await import('/tests/story-controls-fixture.ts');
 window.storyDispose=renderStoryView(document.querySelector('main'),document.querySelector('aside'),storyFixture(6),{apply:async()=>{throw Error('Capture fixture refuses writes');},status:()=>{},resolution,present:async()=>{throw Error('No media');},viewScene:()=>{},viewContinuation:()=>{},viewSource:()=>{}}).dispose;
},resolution);
const geometry=resolution=>page.evaluate(resolution=>{
 const box=node=>{const b=node.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,width:b.width,height:b.height};};
 const canvas=box(document.querySelector('.preview-canvas')),slot=box(document.querySelector('.story-stage-slot')),editor=box(document.querySelector('.story-editor'));
 const path=document.querySelector('.story-branch-path'),line=parseFloat(getComputedStyle(document.querySelector('.story-branch-group')??path).height)||28;
 return {canvas,slot,editor,ratio:canvas.width/canvas.height,expected:resolution.width/resolution.height,
  // Whole and uncropped: the canvas sits inside its slot and fills it along one side.
  inside:canvas.left>=slot.left-1&&canvas.right<=slot.right+1&&canvas.top>=slot.top-1&&canvas.bottom<=slot.bottom+1,
  fills:Math.abs(canvas.width-slot.width)<=2||Math.abs(canvas.height-slot.height)<=2,
  lanes:[...document.querySelectorAll('.story-track-label')].map(node=>node.textContent),
  pathRows:Math.round(path.querySelector('.story-branch-groups').scrollHeight/line),pathScrolls:path.scrollHeight>path.clientHeight+1,
  pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
},resolution);
try{
 await server.listen();try{browser=await chromium.launch({channel:'chrome'});}catch{browser=await chromium.launch();}
 page=await browser.newPage();page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(8000);
 await page.route('**/story-controls',route=>route.fulfill({contentType:'text/html',body:shell}));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/story-controls`);
 const specs=[{name:'wide',width:1440,height:900,font:16},{name:'laptop',width:1100,height:720,font:16},{name:'compact',width:560,height:640,font:16},{name:'scaled',width:1100,height:850,font:20}];
 // 16:9 is the sample ratio; 4:3 and a portrait game must fit just as whole.
 for(const resolution of [{width:1280,height:720},{width:1024,height:768},{width:720,height:1280}]){
  await mount(resolution);
  for(const theme of ['dark','light'])for(const spec of specs){
   await page.setViewportSize({width:spec.width,height:spec.height});await page.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=`${font}px`;},{theme,font:spec.font});
   await page.locator('.story-track-beat').first().click();
   const g=await geometry(resolution),label=`${resolution.width}x${resolution.height}/${theme}/${spec.name}`;
   assert(Math.abs(g.ratio-g.expected)<0.02,`${label}: stage keeps the project ratio (${g.ratio})`);
   assert(g.inside&&g.fills,`${label}: stage fits its slot whole`);
   assert.deepEqual(g.lanes,['Beat','Background','Characters','Words','Sound','Flow'],`${label}: six lanes`);
   assert.equal(g.pageOverflow,false,`${label}: no page overflow`);
   if(spec.width>=900)assert(g.editor.left>=g.slot.right-1,`${label}: the editor sits beside the stage`);
   const filename=`${resolution.width}x${resolution.height}-${theme}-${spec.name}.png`;
   if(resolution.width===1280||spec.name==='laptop')await page.screenshot({path:`${output}/${filename}`});
   results.push({label,filename,stage:{width:Math.round(g.canvas.width),height:Math.round(g.canvas.height)}});
  }
 }
 // Opening every nested condition wraps the Branch path; beyond three rows it scrolls.
 await mount({width:1280,height:720});await page.setViewportSize({width:1100,height:720});await page.evaluate(()=>{document.documentElement.dataset.theme='dark';document.documentElement.style.fontSize='16px';});
 for(const id of ['if','nested-if-0','nested-if-1','nested-if-2','nested-if-3','nested-if-4','nested-if-5'])await page.locator(`.story-branch-segment[data-branch-id="${id}"]`).click();
 await page.locator('.story-track-column[data-beat-id="deep"] > .story-track-beat').click();
 const nested=await geometry({width:1280,height:720});
 assert(nested.pathRows<=3&&!nested.pathScrolls,`up to three rows wrap without scrolling (${nested.pathRows} rows)`);
 assert(nested.inside&&Math.abs(nested.ratio-nested.expected)<0.02,'the stage still fits whole');assert.equal(nested.pageOverflow,false);
 await page.setViewportSize({width:900,height:720});const narrow=await geometry({width:1280,height:720});
 assert(narrow.pathRows>3&&narrow.pathScrolls,`a longer path scrolls after three rows (${narrow.pathRows} rows)`);assert.equal(narrow.pageOverflow,false);
 await page.setViewportSize({width:1100,height:720});
 assert.equal(await page.locator('.story-track-entry .story-rail-label').count()>0,true,'open branches label their route line');
 await page.screenshot({path:`${output}/1280x720-dark-laptop-nested.png`});results.push({label:'nested',filename:'1280x720-dark-laptop-nested.png',pathRows:nested.pathRows});
 // Writing focus hides the stage and keeps the editor, Branch path and Tracks.
 await page.getByRole('button',{name:'Writing focus',exact:true}).click();
 assert.equal(await page.locator('.story-stage').isVisible(),false);assert(await page.locator('.story-editor').isVisible()&&await page.locator('.story-branch-path').isVisible()&&await page.locator('.story-tracks').isVisible());
 await page.getByRole('button',{name:'Exit Writing focus',exact:true}).click();assert(await page.locator('.story-stage').isVisible());
 assert.deepEqual(errors,[]);passed=true;console.log(JSON.stringify({passed:true,captures:results.length,runtimeErrors:errors.length}));
}catch(error){failure=String(error);throw error;
}finally{
 if(!passed&&page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await writeFile(`${output}/failure.html`,await page.content()).catch(()=>{});}
 await writeFile(`${output}/result.json`,JSON.stringify({passed,layer:'Chromium renderer fixture; synthetic input; no native execution',results,errors,failure},null,2)+'\n');
 await browser?.close();await server.close();
}
