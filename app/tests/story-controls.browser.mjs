// Story Combined layout in Chromium: the stage fits the project ratio whole beside the
// editor, Tracks keeps six lanes, Reel takes the same panel height without moving
// anything else, the Branch path wraps to three rows and then scrolls, and nothing
// overflows the page. Captures go to LOOMLIGHT_STORY_CAPTURE_DIR.
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
const shell='<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><link rel="stylesheet" href="/src/ui-refresh.css"><style>body{margin:0}.review-shell{height:100vh;display:grid;grid-template-columns:230px minmax(0,1fr)}.review-tree{overflow:auto;border-right:1px solid var(--border-normal);padding:12px}.review-shell>.scene-workspace{height:100vh;box-sizing:border-box}.review-shell:has(>[data-writing-focus=true]){grid-template-columns:minmax(0,1fr)}.review-shell:has(>[data-writing-focus=true])>.review-tree{display:none}@media(max-width:800px){.review-shell{grid-template-columns:minmax(0,1fr)}.review-tree{display:none}}</style></head><body><div class="review-shell"><aside class="review-tree"></aside><main class="scene-workspace"></main></div></body></html>';
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
  // Against the Story layout, so a scrolling compact workspace compares the same.
  placed:Object.fromEntries(['.story-panel','.preview-canvas','.story-editor'].map(selector=>{const own=box(document.querySelector(selector)),root=box(document.querySelector('.story-combined'));return [selector,{top:own.top-root.top,left:own.left-root.left,width:own.width,height:own.height}];})),
  pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
},resolution);
const view=name=>page.locator(`.story-view-option[data-view="${name}"]`).click();
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
   // Reel keeps the bottom panel's height, the stage and the editor where Tracks left them.
   await view('reel');const reel=await geometry(resolution);
   assert.deepEqual(reel.placed,g.placed,`${label}: the panel, stage and editor stay put in Reel`);
   assert.equal(reel.pageOverflow,false,`${label}: no page overflow in Reel`);
   if(resolution.width===1280&&theme==='dark')await page.screenshot({path:`${output}/${filename.replace('.png','-reel.png')}`});
   await view('tracks');
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
 // Scrolled past its entry, a branch name stays beside the lane labels and stops before its end.
 const pinned=await page.evaluate(()=>{
  const scroller=document.querySelector('.story-tracks-scroll'),entry=document.querySelector('.story-track-entry[data-branch-id="if"]');
  scroller.scrollLeft=entry.offsetLeft+40;scroller.dispatchEvent(new Event('scroll'));
  const label=entry.querySelector('.story-rail-label').getBoundingClientRect(),lanes=document.querySelector('.story-track-labels').getBoundingClientRect();
  const end=document.querySelector('.story-track-exit[data-branch-id="if"] .story-rail-end').getBoundingClientRect();
  const result={label:label.left,lanes:lanes.right,labelRight:label.right,end:end.left};scroller.scrollLeft=0;scroller.dispatchEvent(new Event('scroll'));return result;
 });
 assert(pinned.label>=pinned.lanes&&pinned.labelRight<=pinned.end,`route label stays beside the lane labels: ${JSON.stringify(pinned)}`);
 // Reel draws the same route lines and keeps the branch name at its left edge.
 await view('reel');
 const reelPinned=await page.evaluate(()=>{
  const scroller=document.querySelector('.story-tracks-scroll'),entry=document.querySelector('.story-reel .story-track-entry[data-branch-id="if"]');
  scroller.scrollLeft=entry.offsetLeft+40;scroller.dispatchEvent(new Event('scroll'));
  const label=entry.querySelector('.story-rail-label').getBoundingClientRect(),edge=scroller.getBoundingClientRect();
  const end=document.querySelector('.story-reel .story-track-exit[data-branch-id="if"] .story-rail-end').getBoundingClientRect();
  const result={label:label.left,edge:edge.left,labelRight:label.right,end:end.left};scroller.scrollLeft=0;scroller.dispatchEvent(new Event('scroll'));return result;
 });
 assert(reelPinned.label>=reelPinned.edge&&reelPinned.labelRight<=reelPinned.end,`Reel route label stays in view: ${JSON.stringify(reelPinned)}`);
 await page.screenshot({path:`${output}/1280x720-dark-laptop-nested-reel.png`});await view('tracks');
 await page.screenshot({path:`${output}/1280x720-dark-laptop-nested.png`});results.push({label:'nested',filename:'1280x720-dark-laptop-nested.png',pathRows:nested.pathRows});
 // Writing focus (story-revamp / combined-v1) hides the stage. The Branch path spans the top; Tracks rows
 // sit beside the editor with six lanes from 900 px, and below the editor with Beat and Beat content under it.
 // Entering, leaving, resizing and window changes keep the editor's focus and caret.
 await mount({width:1280,height:720});await page.setViewportSize({width:1100,height:720});
 await page.locator('.story-branch-segment[data-branch-id="if"]').click();await page.locator('.story-track-column[data-beat-id="a"] > .story-track-beat').click();
 const text=page.locator('.story-editor textarea').first();await text.click();await text.evaluate(field=>field.setSelectionRange(2,5));
 const caret=()=>page.evaluate(()=>{const field=document.activeElement;return field?.tagName==='TEXTAREA'?[field.selectionStart,field.selectionEnd]:field?.className;});
 const keeps=async label=>assert.deepEqual(await caret(),[2,5],`${label}: the editor keeps focus and caret`);
 await page.getByRole('button',{name:'Writing focus',exact:true}).click();await keeps('entering');
 // Two frames let the hidden-lane watcher see a new size.
 const focusGeometry=()=>page.evaluate(async()=>{
  await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
  const box=node=>{const b=node.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width,height:b.height};};
  const scroller=document.querySelector('.story-tracks-scroll');
  return {editor:box(document.querySelector('.story-editor')),panel:box(document.querySelector('.story-panel')),path:box(document.querySelector('.story-branch-path')),
   stage:document.querySelector('.story-stage').getClientRects().length,
   lanes:[...document.querySelectorAll('.story-track-label')].filter(node=>node.getClientRects().length).map(node=>node.innerText.trim()),
   grips:[...document.querySelectorAll('.story-grip')].filter(node=>node.getClientRects().length).length,
   rows:[...document.querySelectorAll('.story-tracks .story-track-column')].slice(0,2).map(node=>box(node).top),
   hidden:[...document.querySelectorAll('.story-lane-edge')].filter(node=>!node.hidden).map(node=>node.textContent),scrollLeft:scroller.scrollLeft,
   pageOverflow:document.documentElement.scrollWidth>innerWidth+1};
 });
 for(const theme of ['dark','light'])for(const [width,height,side] of [[1600,1000,560],[1100,720,400],[900,720,400],[899,720],[560,640]]){
  await page.setViewportSize({width,height});await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);
  const g=await focusGeometry(),label=`Writing focus ${width}x${height}/${theme}`;
  assert.equal(g.stage,0,`${label}: no stage`);assert.equal(g.pageOverflow,false,`${label}: no page overflow`);
  assert(g.path.bottom<=Math.min(g.editor.top,g.panel.top)+1,`${label}: the Branch path is above the editor and Tracks`);
  assert(g.rows[1]>g.rows[0],`${label}: beats are rows`);
  if(side){
   assert(g.editor.left>=g.panel.right&&Math.abs(g.editor.width-side)<=1,`${label}: a ${side} px sidebar beside Tracks (${g.editor.width})`);
   assert.deepEqual(g.lanes,['Beat','Background','Characters','Words','Sound','Flow'],`${label}: six lanes`);assert.equal(g.grips,6,`${label}: sidebar and lane grips`);
  }else{
   assert(g.editor.bottom<=g.panel.top+1,`${label}: the editor sits above Tracks`);
   assert.deepEqual(g.lanes,['Beat','Beat content'],`${label}: two lanes`);assert.equal(g.grips,0,`${label}: no grips`);
  }
  // 1100 px fits every lane, as in the approved capture; 900 px names the ones cut off.
  if(width===1100||width===1600)assert.deepEqual(g.hidden,[],`${label}: no lane hidden`);
  if(width===900)assert.deepEqual(g.hidden,['Sound, Flow ›'],`${label}: the hidden lanes are named`);
  await keeps(label);
  if(theme==='dark'){await page.screenshot({path:`${output}/focus-${width}x${height}.png`});results.push({label,filename:`focus-${width}x${height}.png`,editor:Math.round(g.editor.width)});}
 }
 await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});
 // A pointer drag widens the sidebar without taking focus. Lanes it covers are named; the marker scrolls to them.
 await page.setViewportSize({width:1100,height:720});
 const drag=async(selector,dx,finish=true)=>{const grip=await page.locator(selector).boundingBox(),x=grip.x+grip.width/2,y=grip.y+Math.min(40,grip.height/2);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+dx,y,{steps:4});if(finish)await page.mouse.up();};
 await drag('.story-side-grip',-150);await keeps('dragging the sidebar');
 let g=await focusGeometry();assert(Math.abs(g.editor.width-550)<=1,`the sidebar widens to 550 (${g.editor.width})`);assert.deepEqual(g.hidden,['Sound, Flow ›']);
 await page.screenshot({path:`${output}/focus-1100x720-hidden.png`});
 await page.locator('.story-lane-edge-end').click();g=await focusGeometry();assert(g.scrollLeft>0,'the marker scrolls the lanes into view');assert.equal(g.hidden.length,1);assert.match(g.hidden[0],/^‹ /);
 await text.focus();await text.evaluate(field=>field.setSelectionRange(2,5));
 // Escape cancels a drag; double-click resets the default.
 await drag('.story-side-grip',-60,false);await page.keyboard.press('Escape');await page.mouse.up();
 g=await focusGeometry();assert(Math.abs(g.editor.width-550)<=1,`Escape restores the width before the drag (${g.editor.width})`);await keeps('Escape on a drag');
 await page.locator('.story-side-grip').dblclick();g=await focusGeometry();assert(Math.abs(g.editor.width-400)<=1,'double-click resets the sidebar');
 await page.evaluate(()=>{document.querySelector('.story-tracks-scroll').scrollLeft=0;});
 const lane=()=>page.locator('.story-track-label.story-lane-1').evaluate(node=>node.getBoundingClientRect().width);
 // At 1100 px Words is at its minimum, so a lane widens only once the narrowest sidebar gives Words room.
 await page.locator('.story-side-grip').focus();for(let step=0;step<4;step++)await page.keyboard.press('Shift+ArrowRight');
 g=await focusGeometry();assert(Math.abs(g.editor.width-320)<=1,`the arrow keys narrow the sidebar to its minimum (${g.editor.width})`);
 await text.focus();await text.evaluate(field=>field.setSelectionRange(2,5));
 await drag('.story-track-label.story-lane-1 > .story-grip',30);assert.equal(Math.round(await lane()),126,'the Background lane widens');await keeps('dragging a lane');
 // Reel rows stack too, and leaving Writing focus brings the stage back with the caret in place.
 await view('reel');g=await focusGeometry();
 const reel=await page.evaluate(()=>[...document.querySelectorAll('.story-reel .story-track-column')].slice(0,2).map(node=>node.getBoundingClientRect().top));assert(reel[1]>reel[0],'Reel cards are rows');
 await page.screenshot({path:`${output}/focus-1100x720-reel.png`});await view('tracks');
 await text.focus();await text.evaluate(field=>field.setSelectionRange(2,5));
 await page.getByRole('button',{name:'Show game window',exact:true}).click();assert(await page.locator('.story-stage').isVisible());await keeps('leaving');
 assert.deepEqual(errors,[]);passed=true;console.log(JSON.stringify({passed:true,captures:results.length,runtimeErrors:errors.length}));
}catch(error){failure=String(error);throw error;
}finally{
 if(!passed&&page){await page.screenshot({path:`${output}/failure.png`}).catch(()=>{});await writeFile(`${output}/failure.html`,await page.content()).catch(()=>{});}
 await writeFile(`${output}/result.json`,JSON.stringify({passed,layer:'Chromium renderer fixture; synthetic input; no native execution',results,errors,failure},null,2)+'\n');
 await browser?.close();await server.close();
}
