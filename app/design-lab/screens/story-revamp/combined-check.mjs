import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../launch-browser.mjs';
const output = new URL(`../../../../.toolchains/story-combined/${process.env.STORY_CHECK_OUTPUT ?? 'initial'}/`, import.meta.url);
await mkdir(output, {recursive:true});
const report={renders:[],checks:[],errors:[]};
const browser=await launchBrowser({channel:'chrome',headless:true});
const page=await browser.newPage(); page.setDefaultTimeout(6000);
page.on('pageerror',e=>report.errors.push(e.message));
await page.routeWebSocket('**',()=>{});
const origin='http://127.0.0.1:5176';
async function open(state='populated',mode='tracks'){
  await page.goto(`${origin}/preview.html?screen=story-revamp&variant=combined&state=${state}&theme=dark&viewport=wide`);
  await page.locator('#preview[data-ready=true]').waitFor();
  await page.locator(`[data-action=bottom-${mode}]`).click();
  await page.locator('.sr-workarea').evaluate(n=>n.scrollTop=0);
}
async function capture(name){await page.screenshot({path:fileURLToPath(new URL(name+'.png',output))});}
async function state(){await page.locator('.sr-state').evaluate(n=>n.open=true);const value=JSON.parse(await page.locator('.sr-state pre').innerText());await page.locator('.sr-state').evaluate(n=>n.open=false);return value;}
async function pick(kind){await page.locator('[data-action=add-beat]').click();await page.locator('[data-picker-search]').fill(kind);await page.locator(`[data-insert-kind=${kind}]`).click();}
async function settled(){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function selectedVisible(mode){
 await settled();
 return page.evaluate(mode=>{
  const item=document.querySelector(`[data-${mode==='tracks'?'track':'reel'}-beat][data-selected=true]`);
  const area=document.querySelector(mode==='tracks'?'.sr-tracks-scroll':'.sc-reel');
  const r=item.getBoundingClientRect(), a=area.getBoundingClientRect();
  return {visible:r.top>=a.top-1&&r.bottom<=a.bottom+1,top:r.top,bottom:r.bottom,areaTop:a.top,areaBottom:a.bottom};
 },mode);
}
try{
 if(!process.argv.includes('--compact')) {
 // Pointer hit-testing catches menus covered by a neighbouring stacking context.
 await page.setViewportSize({width:560,height:640});
 for(const mode of ['tracks','reel']) for(const focus of [false,true]) for(const kind of ['background','call','setVariable','customCode']){
  await open(kind==='customCode'?'protected':'populated',mode);if(focus)await page.locator('[data-action=toggle-focus]').click();
  if(kind==='setVariable')await pick(kind);else await page.locator(`[data-${mode==='tracks'?'track':'reel'}-beat][data-beat-kind=${kind}]`).click();
  await page.locator('.sr-inspector [data-action=beat-menu]').click();
  const hit=await page.locator('.sr-inspector .sr-row-popover button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {text:n.textContent,visible:r.top>=0&&r.bottom<=innerHeight,hit:[.1,.5,.9].every(f=>n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height*f)))};}));
  assert(hit.every(n=>n.visible&&n.hit),`${mode}/${focus}/${kind}: menu actions must be visible and hit-testable: ${JSON.stringify(hit)}`);
  await capture(`compact-${mode}-${focus?'focus':'main'}-menu-${kind}`);
  if(kind==='background') { await page.getByRole('button',{name:'Move later',exact:true}).click();assert.equal((await state()).scenes[0].beats[1].kind,'background');await page.locator('[data-action=undo]').click(); }
  else if(kind==='call') { await page.getByRole('button',{name:'View source',exact:true}).click();assert.equal(await page.locator('dialog[open]').count(),1);await page.keyboard.press('Escape'); }
  else if(kind==='setVariable') { await page.getByRole('button',{name:'Move to another branch…',exact:true}).click();assert.equal(await page.locator('[data-action=confirm-move]').count(),1);await page.locator('[data-action=cancel-dialog]').click(); }
  else { const colours=await page.locator('.sr-inspector .sr-row-popover button:disabled').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).color));assert.equal(new Set(colours).size,1,'All disabled actions share the disabled colour');await page.keyboard.press('Escape'); }
 }
 report.checks.push('Compact normal/focus menus hit-test three points on every item in both modes; Background Move later, Call View source and Set variable Move open normally; protected Delete matches disabled states');
 for(const width of [1600,1100]){
  await page.setViewportSize({width,height:width===1600?1000:720});await open('populated','reel');
  await page.locator('.sr-prose').fill('A realistic longer line with enough words to fill the entire card width and continue across several rows without running under its insertion control. Another sentence takes this past seven lines at laptop size, so its last visible line must remain whole and end with an ellipsis.');
  const collision=await page.locator('.sc-reel-column').evaluateAll(nodes=>nodes.some(n=>{const p=n.querySelector('p'),button=n.querySelector('.sr-gap');if(!p||!button)return false;const r=p.getBoundingClientRect(),b=button.getBoundingClientRect();return r.left<b.right&&r.right>b.left&&r.top<b.bottom&&r.bottom>b.top;}));assert.equal(collision,false,'Reel prose and insertion controls must not overlap');
  const fits=await page.locator('.sc-reel-column p').evaluateAll(nodes=>nodes.every(n=>{const r=n.getBoundingClientRect(),strip=n.closest('.sr-reel-strip').getBoundingClientRect(),line=parseFloat(getComputedStyle(n).lineHeight);return r.bottom<=strip.bottom+1&&Math.abs(r.height/line-Math.round(r.height/line))<.05;}));assert(fits,'Long Reel prose shows complete lines inside the strip');
  await capture(`${width}-reel-long-prose`);
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
  const partial=await page.locator('.sr-reel-strip').evaluate(n=>{const edge=n.getBoundingClientRect().left;return [...n.querySelectorAll('.sc-reel-column,.sc-track-mark')].some(c=>{const r=c.getBoundingClientRect();return r.left<edge-1&&r.right>edge+1;});});assert.equal(partial,false,'Reel reveal aligns a complete first card');
  await capture(`${width}-reel-complete-columns`);
 }
 report.checks.push('Wide/laptop Reel long prose clears insertion buttons and nested selection snaps to a whole first column');
 for(const [width,height] of [[1600,1000],[1100,720],[560,640]]) for(const mode of ['tracks','reel']){
  await page.setViewportSize({width,height});await open('populated',mode);await pick('jump');await settled();
  const area=page.locator(mode==='tracks'?'.sr-tracks-scroll':'.sc-reel>.sr-reel-strip');
  await area.evaluate(n=>n.scrollLeft=n.scrollWidth);await settled();
  const geometry=await area.evaluate(n=>{const bounds=n.getBoundingClientRect(),edge=n.querySelector('.sr-track-labels')?.getBoundingClientRect().right??bounds.left;const selected=n.querySelector('[data-selected=true]').getBoundingClientRect();return {partial:[...n.querySelectorAll('.sr-track-column,.sc-reel-column,.sc-track-mark')].some(c=>{const r=c.getBoundingClientRect();return r.left<edge-1&&r.right>edge+1;}),selected:selected.left>=edge-1&&selected.right<=bounds.right+1};});
  assert.equal(geometry.partial,false,`${width}/${mode}: end of strip must start with a complete column`);assert.equal(geometry.selected,true);
  await capture(`${width}-${mode}-strip-end`);
 }
 report.checks.push('Both modes at all three sizes align a complete first column at maximum scroll while keeping the final beat visible');
 for(const mode of ['tracks','reel']) for(const focus of [false,true]){
  await page.setViewportSize({width:560,height:640});await open('empty',mode);if(focus)await page.locator('[data-action=toggle-focus]').click();
  assert.match(await page.locator('.sr-inspector').innerText(),/Returns to the calling scene, or ends the story/);
  await page.locator('.sr-inspector [data-action=beat-menu]').click();assert.equal(await page.getByRole('button',{name:/^Delete 01 Return/}).isDisabled(),true);
  await capture(`compact-${mode}-${focus?'focus':'main'}-empty-ending`);await page.keyboard.press('Escape');
 }
 report.checks.push('Empty scene retains start-writing actions and exposes the selected Return explanation and protected ending menu');
 // Opened branch removal must reconcile both the model and view history.
 for(const mode of ['tracks','reel']) for(const focus of [false,true]){
  await page.setViewportSize({width:1100,height:720});await open('populated',mode);
  if(focus)await page.locator('[data-action=toggle-focus]').click();
  await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();
  await page.getByRole('button',{name:'+ Add Else if',exact:true}).click();
  const branch=(await state()).scenes[0].beats.find(b=>b.id==='beat-1').branches.find(b=>b.name==='Else if').id;
  await page.locator(`.sc-conditions [data-action="open-branch-${branch}"]`).click();
  await page.locator('[data-action=undo]').click();
  assert.equal(await page.locator('.sr-inspector').count(),1,'Undo opened Else-if retains editor');
  assert.equal((await state()).visibleBranches['beat-1'],undefined);
  await page.locator('[data-action=redo]').click();
  assert.equal((await state()).visibleBranches['beat-1'],branch,'Redo restores opened branch');
  await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();
  await page.getByRole('button',{name:'Remove this Else if',exact:true}).click();
  assert.equal(await page.locator('.sr-inspector').count(),1,'Removing opened Else-if retains editor');
  assert.equal((await state()).visibleBranches['beat-1'],undefined);
  await page.locator('[data-action=undo]').click();assert.equal((await state()).visibleBranches['beat-1'],branch);
  await page.locator('[data-action=redo]').click();assert.equal((await state()).visibleBranches['beat-1'],undefined);
  assert.deepEqual(report.errors,[]);await capture(`${mode}-${focus?'focus':'main'}-else-if-history`);
 }
 report.checks.push('Opened Else-if removal and Undo/Redo preserve a usable editor and valid branch state in both modes and focus states');
 for(const mode of ['tracks','reel']){
  await page.setViewportSize({width:1100,height:720});await open('populated',mode);await page.locator('[data-action=toggle-focus]').click();
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
  await page.locator('[data-action=next-dialogue]').click();await page.locator('.sr-prose').fill('A draft kept through resizing.');await page.locator('.sr-prose').evaluate(n=>n.setSelectionRange(7,12));
  await page.setViewportSize({width:560,height:640});await settled();
  assert.equal((await selectedVisible(mode)).visible,true,'Responsive focus reveals selected nested line');
  assert.equal(await page.locator('.sr-prose').inputValue(),'A draft kept through resizing.');
  assert.deepEqual(await page.locator('.sr-prose').evaluate(n=>[n.selectionStart,n.selectionEnd]),[7,12]);await capture(`compact-${mode}-resized-focus`);
  await page.setViewportSize({width:1600,height:1000});await open('populated',mode);await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
  await page.locator('[data-action=inside-ticket-if]').click();assert.match(await page.locator('.sr-insertion-target').innerText(),/before 06\.1/);
  await page.locator('[data-picker-search]').fill('narration');await page.keyboard.press('Enter');await page.locator('.sr-prose').fill('First in this branch.');
  let branch=(await state()).scenes[0].beats.find(b=>b.id==='beat-1').branches[0];assert.equal(branch.beats[0].text,'First in this branch.');
  await page.locator('[data-action=next-dialogue]').click();await page.locator('.sr-prose').fill('Still narration.');
  branch=(await state()).scenes[0].beats.find(b=>b.id==='beat-1').branches[0];assert.equal(branch.beats[1].kind,'narration');
  await page.locator('.sr-prose').press('Shift+Meta+Enter');await settled();branch=(await state()).scenes[0].beats.find(b=>b.id==='beat-1').branches[0];assert.equal(branch.beats[2].kind,'narration');
  await page.locator('[data-action=append-ticket-if]').click();await page.locator('[data-picker-search]').fill('narration');await page.keyboard.press('Enter');await page.locator('.sr-prose').fill('Last in this branch.');
  branch=(await state()).scenes[0].beats.find(b=>b.id==='beat-1').branches[0];assert.equal(branch.beats.at(-1).text,'Last in this branch.');
  await capture(`${mode}-branch-first-last`);
  await page.locator('.sc-conditions [data-action=open-branch-ticket-else]').press('Enter');await settled();
  assert.equal(await page.locator('.sc-conditions [data-action=open-branch-ticket-else]').evaluate(n=>document.activeElement===n),true,'Keyboard branch switch retains strip focus');
 }
 report.checks.push('Responsive focus preserves visible selection, draft and caret; first/last branch insertion matches placement; repeated narration retains type; keyboard branch switching retains focus');
 // Measure outcomes without scrollIntoView: helpers must not repair navigation.
 for(const [width,height] of [[1600,1000],[1100,720]]){
  await page.setViewportSize({width,height});await open('populated','reel');
  await page.locator('[data-action=toggle-focus]').click();
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
  await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
  assert.match(await page.locator('.lp-status').innerText(),/editing 06\.2\.1 Mara/);
  assert.equal((await selectedVisible('reel')).visible,true,'Nested Reel selection must reveal itself');
  await page.locator('[data-action=next-dialogue]').click();
  assert.equal((await selectedVisible('reel')).visible,true,'New Reel line must reveal itself');
  await page.locator('.sr-prose:focus').fill('Visible while writing.');
  await page.locator('[data-action=bottom-tracks]').click();
  await page.locator('[data-action=bottom-reel]').click();
  assert.equal((await selectedVisible('reel')).visible,true,'Mode switch reveals selected Reel row');
  assert.equal(await page.locator('.sr-prose').inputValue(),'Visible while writing.');
  await capture(`${width}-reel-writing-position`);
  await open();await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
  await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
  const partial=await page.locator('.sr-tracks-scroll').evaluate(n=>{const edge=n.querySelector('.sr-track-labels').getBoundingClientRect().right;return [...n.querySelectorAll('.sr-track-column,.sc-track-mark')].some(c=>{const r=c.getBoundingClientRect();return r.left<edge-1&&r.right>edge+1;});});
  assert.equal(partial,false,'Programmatic reveal aligns the first visible track column');
  await page.locator('[data-track-beat][data-selected=true]').press('Home');await settled();
  const left=await page.evaluate(()=>({beat:document.querySelector('[data-track-beat][data-selected=true]').getBoundingClientRect().left,labels:document.querySelector('.sr-track-labels').getBoundingClientRect().right}));
  assert(left.beat>=left.labels-1,`Selected Home column behind labels: ${JSON.stringify(left)}`);
  await capture(`${width}-tracks-home`);
 }
 report.checks.push('Wide/laptop Reel branch/next-line/mode-switch visibility and Tracks Home clears sticky labels');
 await page.setViewportSize({width:560,height:640});
 for(const mode of ['tracks','reel']){
  await open('populated',mode);await page.locator('[data-action=toggle-focus]').click();await settled();
  assert.equal((await selectedVisible(mode)).visible,true,'Compact focus reveals selected row on entry');
  const boxes=await page.evaluate(()=>Object.fromEntries(['.sc-conditions','.sr-inspector-heading','.sr-prose'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return [s,{top:r.top,bottom:r.bottom}]})));
  assert(boxes['.sr-inspector-heading'].top>=boxes['.sc-conditions'].bottom-1,'Compact focus editor heading must start below Conditions');
  assert(boxes['.sr-prose'].bottom<=640-28,'Compact focus prose must be visible on entry');
  await capture(`compact-${mode}-focus-entry`);
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
  await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
  await page.locator('.sc-conditions [data-action=open-branch-inner-else]').click();await settled();
  const visible=await page.locator('.sc-condition-groups').evaluate(n=>{const a=n.getBoundingClientRect(),r=n.querySelector('[data-action=open-branch-inner-else]').getBoundingClientRect();return r.left>=a.left-1&&r.right<=a.right+1;});
  assert(visible,'Selected nested Otherwise must remain visible after redraw');
 }
 report.checks.push('Compact focus enters with editor visible; nested branch controls remain visible after navigation');
 await page.setViewportSize({width:1600,height:1000});await open('populated','reel');
 await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
 await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();
 await page.locator('[data-action="06-if-rule-1-is-false"]').click();await settled();
 const condition=page.locator('[data-action="06-if-rule-1-is-false"]');
 assert.equal(await page.locator('[data-reel-beat=beat-1] p').innerText(),'If has_ticket is false');
 assert.equal(await condition.evaluate(n=>document.activeElement===n),true);
 await capture('condition-label-sync');
 await page.locator('[data-action=add-beat]').click();await page.locator('[data-picker-search]').fill('return');
 assert.match(await page.locator('.sr-insertion-target').innerText(),/^Goes at the end of /);
 await page.keyboard.press('Enter');await page.locator('[data-action=add-beat]').click();await page.locator('[data-picker-search]').fill('jump');
 assert.match(await page.locator('.sr-insertion-target').innerText(),/^Replaces .*Return/);
 await capture('picker-replace-ending');await page.locator('[data-picker-search]').fill('nothing matches this');
 assert.match(await page.locator('.sr-picker-empty').innerText(),/No beat matches/);assert.equal(await page.getByRole('button',{name:'Clear search',exact:true}).count(),1);
 assert.equal(await page.locator('[data-action=picker-confirm]').count(),0,'Add a beat adds on click or Enter, with no confirm button');await page.keyboard.press('Escape');
 report.checks.push('Condition text synchronizes without losing focus; ending destinations and empty-search action are accurate');
 for(const mode of ['tracks','reel']) for(const focused of [false,true]){
  for(const source of ['entry','gap']){
   await open('populated',mode);if(focused)await page.locator('[data-action=toggle-focus]').click();
   await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
   await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
   const owner=page.locator(mode==='tracks'?'.sr-track-column[data-column=beat-1]':'.sc-reel-column[data-column=beat-1]');
   assert.equal(await owner.locator('.sr-gap').count(),0,'An open condition must not show a gap at its branch entry');
   await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();
   await page.locator('[data-action="06-if-rule-1-is-false"]').click();
   const control=source==='entry'?page.locator('[data-action=inside-inner-if]'):page.locator('[data-gap-before=beat-3]');
   if(source==='gap')assert.match(await control.getAttribute('title'),/has_ticket is false/);
   await control.click();
   assert.match(await page.locator('.sr-insertion-target').innerText(),/If has_ticket is false.*If trust is at least 5/);
   await capture(`${mode}-${focused?'focus':'main'}-${source}-live-destination`);
   await page.locator('[data-picker-search]').fill('narration');await page.keyboard.press('Enter');await settled();
   assert.match(await page.locator('.lp-status').innerText(),/has_ticket is false/);
   assert.equal(await page.locator('.sr-prose:focus').count(),1);
  }
  await page.locator('[data-action=boundary-after-beat-1]').click();
  assert.match(await page.locator('.sr-insertion-target').innerText(),/after 06 Condition and its branches/);
  await page.keyboard.press('Escape');
 }
 report.checks.push('Both modes/focus states resolve live nested insertion paths; open conditions have no misleading gap; after-condition names branch ownership');
 await page.setViewportSize({width:560,height:640});
 for(const mode of ['tracks','reel']){
  await open('populated',mode);await page.locator('[data-action=toggle-focus]').click();
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
  await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();await settled();
  assert.equal((await selectedVisible(mode)).visible,true,'Compact focus selected row stays visible beside editor');
  const container=mode==='tracks'?'.sr-tracks-scroll':'.sc-reel';
  const beforeScroll=await page.locator(container).evaluate(n=>n.scrollTop);
  const selectedBox=await page.locator(`[data-${mode==='tracks'?'track':'reel'}-beat][data-selected=true]`).boundingBox();
  await page.mouse.click(selectedBox.x+selectedBox.width/2,selectedBox.y+selectedBox.height/2);await settled();
  assert.equal(await page.locator(container).evaluate(n=>n.scrollTop),beforeScroll,'Click-to-edit preserves list position');
  await page.locator('.sr-prose').fill('I kept the ticket because I thought you might come back. Every Thursday, I waited beneath the station clock until the last service left. Then the timetable changed, and your handwriting appeared beside the new stop. I know how that sounds. The stationmaster said it was a printing error, but he would not look me in the eye. Tonight I want to know where that tram goes, and I would rather not find out alone.');
  assert.equal((await selectedVisible(mode)).visible,true);
  await page.locator('[data-action=next-dialogue]').click();await settled();
  assert.equal((await selectedVisible(mode)).visible,true,'Repeated compact writing reveals the new row');
  await page.locator('.sr-prose:focus').fill('The next line stays beside the list.');
  const row=page.locator(`[data-${mode==='tracks'?'track':'reel'}-beat][data-selected=true]`);await row.focus();await row.press('ArrowUp');await settled();
  assert.equal((await selectedVisible(mode)).visible,true,'Keyboard selection is visible');
  await page.keyboard.press('Enter');await settled();assert.equal(await page.locator('.sr-prose:focus').count(),1);
  await capture(`compact-${mode}-repeat-writing`);
 }
 report.checks.push('Compact focus preserves list scroll through click-to-edit, long prose and repeated next-line creation');
 for(const [size,width,height] of [['wide',1600,1000],['laptop',1100,720],['compact',560,640]]){
  await page.setViewportSize({width,height});
  for(const mode of ['tracks','reel']){
   await open('populated',mode);
   const stage=await page.locator('[data-stage]').boundingBox();
   report.renders.push({size,mode,stage}); await capture(`${size}-${mode}-main`);
   assert(Math.abs(stage.width/stage.height-16/9)<.01,'Stage aspect');
   assert(stage.width >= (size==='wide'?960:size==='laptop'?620:480),`${size} stage too small: ${stage.width}`);
   await page.locator('[data-action=toggle-focus]').click(); await capture(`${size}-${mode}-focus`);
   assert.equal(await page.locator('[data-stage]:visible').count(),0);
   await page.locator('.sc-conditions').scrollIntoViewIfNeeded();
   await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();
   await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
   await capture(`${size}-${mode}-nested-focus`);
   const text=page.locator('.sr-prose'); await text.fill('A draft inside the nested branch.');
   const before=await state(); const target=await page.locator('[data-action=add-beat]').getAttribute('title');
   await page.locator(`[data-action=bottom-${mode==='tracks'?'reel':'tracks'}]`).click();
   const after=await state(); assert.equal(after.selected,before.selected);assert.deepEqual(after.scenes,before.scenes);assert.equal(after.editingBranch,before.editingBranch);assert.equal(await page.locator('[data-action=add-beat]').getAttribute('title'),target);
   assert.equal(await page.locator('.sr-prose').inputValue(),'A draft inside the nested branch.');
   await page.locator(`[data-action=bottom-${mode}]`).click();
   await page.locator('[data-action=toggle-focus]').click(); await page.locator('.sr-workarea').evaluate(n=>n.scrollTop=0); await capture(`${size}-${mode}-nested-main`);
   const dimensions=await page.locator('[data-stage]').boundingBox(); assert.equal(dimensions.width,stage.width,'Branch navigation must not shrink stage');
   report.checks.push(`${size}/${mode}: nested draft, selection, branch, target survive bottom/focus switches`);
  }
 }
 await page.setViewportSize({width:1600,height:1000});await open();
 const before=await page.locator('[data-stage]').boundingBox();await page.locator('[data-action=bottom-reel]').click();assert.deepEqual(await page.locator('[data-stage]').boundingBox(),before);report.checks.push('Stage geometry is identical across bottom modes');
 await page.locator('[data-action=add-beat]').click(); await capture('picker-common');
 await page.locator('[data-picker-search]').fill('return');assert.equal(await page.locator('[data-insert-kind]').first().getAttribute('data-insert-kind'),'return');await capture('picker-return');
 await page.locator('[data-picker-search]').fill('no beat matches');await capture('picker-empty');await page.keyboard.press('Escape');await page.locator('dialog[open]').waitFor({state:'hidden'});
 await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sc-conditions [data-action=open-branch-inner-else]').click();
 await page.locator('[data-action=add-beat]').click();assert.match(await page.locator('.sr-insertion-target').innerText(),/If has_ticket.*Otherwise/);await page.locator('[data-picker-search]').fill('narration');await page.keyboard.press('Enter');await page.locator('.sr-prose:focus').fill('Owned by inner Otherwise.');
 let sample=await state();assert(sample.scenes[0].beats.find(b=>b.kind==='condition').branches[0].beats.find(b=>b.kind==='condition').branches[1].beats.some(b=>b.text==='Owned by inner Otherwise.'));report.checks.push('Keyboard picker inserts into nested Otherwise');
 await page.locator('[data-action=boundary-after-beat-1]').click();await capture('picker-after-condition');assert.doesNotMatch(await page.locator('.sr-insertion-target').innerText(),/Otherwise/);await page.keyboard.press('Escape');
 await open('empty');await pick('condition');await page.locator('.sr-inspector [data-action^=open-branch-]').first().click();await page.locator('[data-action=bottom-reel]').click();await page.locator('[data-action=add-beat]').click();assert.match(await page.locator('.sr-insertion-target').innerText(),/If/);await page.locator('[data-picker-search]').fill('dialogue');await page.keyboard.press('Enter');await page.locator('.sr-prose:focus').fill('First line in an empty branch.');report.checks.push('Empty branch retains insertion target across modes');
 for(const sampleState of ['empty','protected']){await open(sampleState);await capture(sampleState);if(sampleState==='protected'){await page.locator('[data-track-beat][data-beat-kind=customCode]').click();await capture('protected-editor');}}
 }
 // Secondary controls and dialogs, including every supported beat editor.
 const types=['dialogue','narration','background','showCharacter','hideCharacter','changeAppearance','placement','transition','playMusic','stopMusic','playSfx','choice','condition','call','jump','return','setVariable','showScreen','hideScreen','callScreen'];
 for(const [size,width,height] of (process.argv.includes('--compact') ? [['compact',560,640]] : [['wide',1600,1000],['compact',560,640]])){
  await page.setViewportSize({width,height});
  for(const kind of types){
   await open('populated');await pick(kind);
   assert.equal((await state()).scenes[0].beats.some(b=>b.kind===kind),true);
   await page.locator('.sr-inspector').scrollIntoViewIfNeeded();await capture(`${size}-editor-${kind}`);
   assert(await page.locator('.sr-inspector:visible').count());
   if(kind==='setVariable') { assert.equal(await page.locator('.sr-inspector summary[data-action=set-variable]').getAttribute('aria-label'),'Variable: has_ticket');assert.equal(await page.locator('.sr-inspector [data-action=value-true]').getAttribute('aria-checked'),'true'); }
   if(kind.endsWith('Screen')){const summary=await page.locator(`[data-track-beat][data-selected=true] [data-track="${size==='compact'?3:5}"]`).innerText();assert.match(summary,/screen · Help$/);assert.equal((summary.match(/screen/g)||[]).length,1);}
  }
  report.checks.push(`${size}: all 20 beat types insert and expose their editor`);
  await open();await page.locator('[data-action=more]').click();await capture(`${size}-more-menu`);await page.getByRole('button',{name:/^Assist with/}).click();await capture(`${size}-assist-instructions`);await page.locator('[data-action=assist-review]').click();await capture(`${size}-assist-review`);await page.locator('[data-action=assist-apply]').click();assert.match(await page.locator('.sr-prose').inputValue(),/Tell me you heard/);await page.locator('[data-action=undo]').click();assert.match(await page.locator('.sr-prose').inputValue(),/I thought I was/);
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:/^View source for/}).click();await capture(`${size}-source`);await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:'Rename this scene…',exact:true}).click();await capture(`${size}-rename`);await page.locator('[data-action=cancel-dialog]').click();
  await page.locator('[data-action=scenes]').click();await capture(`${size}-scenes`);await page.locator('[data-action=new-scene]').click();await page.locator('[data-action=submit-scene]').click();assert.equal(await page.locator('[aria-invalid=true]').count(),1);await capture(`${size}-new-scene-error`);await page.getByRole('textbox',{name:'Scene name',exact:true}).fill('The quiet platform');await page.locator('[data-action=submit-scene]').click();await page.locator('.sr-prose:focus').fill('The station is empty.');await page.locator('.sr-prose').press('Meta+Shift+Enter');await page.locator('.sr-prose:focus').fill('Except for us.');report.checks.push(`${size}: scene validation, creation, next-line focus and Assist Undo`);
  await open();await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();await page.locator('.sr-inspector [data-action=beat-menu]').click();await capture(`${size}-beat-menu`);await page.getByRole('button',{name:/^Delete 06 Condition/}).click();await capture(`${size}-delete-condition`);await page.locator('[data-action=cancel-dialog]').click();assert((await state()).scenes[0].beats.some(b=>b.kind==='condition'));await page.locator('.sr-inspector [data-action=beat-menu]').click();await page.getByRole('button',{name:/^Delete 06 Condition/}).click();await page.locator('[data-action=confirm-delete]').click();await page.locator('[data-action=undo]').click();assert((await state()).scenes[0].beats.some(b=>b.kind==='condition'));
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sr-inspector [data-action=beat-menu]').click();await page.getByRole('button',{name:'Move to another branch…',exact:true}).click();await capture(`${size}-move-branch`);await page.locator('[data-action=confirm-move]').click();await page.locator('[data-action=undo]').click();assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='condition').branches[0].beats[0].text,'Keep your ticket. Some doors only open once.');report.checks.push(`${size}: condition deletion/cancel/Undo and moving between branches`);
  await open();await page.locator('[data-track-beat][data-beat-kind=choice]').click();await page.locator('[data-action=guard-0-add-rule]').click();await capture(`${size}-choice`);await page.locator('[data-action=change-destination-1]').click();await page.locator('[data-action=new-choice-1]').click();await capture(`${size}-choice-new-destination`);await page.locator('[data-action=cancel-dialog]').click();await page.locator('[data-action=open-choice-1]').click();await page.locator('[data-action=back-scene]').click();assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='choice').options[0].guard,'has_ticket is true');
  await pick('narration');await page.locator('.sr-prose:focus').fill('No option was available.');let scene=(await state()).scenes[0];const choice=scene.beats.findIndex(b=>b.kind==='choice');assert.equal(scene.beats[choice+1].text,'No option was available.');report.checks.push(`${size}: Choice destination return retains draft; next beat follows unavailable options`);
  await open();await page.locator('[data-track-beat][data-beat-kind=call]').click();await page.locator('[data-action=open-destination]').click();await page.locator('[data-action=back-scene]').click();assert.equal((await state()).selected,'beat-12');
  await page.locator('[data-action=enlarge-stage]').click();await page.locator('[data-action=add-beat]').click();await page.locator('[data-picker-search]').fill('dialogue');await page.keyboard.press('Enter');assert.equal(await page.locator('.sr-content').getAttribute('data-stage-expanded'),'false');await page.locator('.sr-prose:focus').fill('The editor is visible.');report.checks.push(`${size}: Call return and insertion from enlarged stage`);
  await open();await page.locator('[data-action=stage-Mara]').click();await capture(`${size}-stage-object`);await page.locator('[data-action=edit-stage-owner]').click();assert.equal(await page.locator('.sr-inspector summary[data-action=character]').getAttribute('aria-label'),'Character: Mara');
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:'Design notes (future tools)',exact:true}).click();await capture(`${size}-future-notes`);await page.getByRole('button',{name:'Close',exact:true}).click();
 }

 // The compact editor scrolls independently; its longer structured forms remain usable.
 await page.setViewportSize({width:560,height:640});
 for(const kind of ['choice','condition','showCharacter','setVariable']){
  await open();await pick(kind);await page.locator('[data-action=toggle-focus]').click();
  assert.equal((await selectedVisible('tracks')).visible,true,'Compact focus property editor keeps selected row visible');
  const field=page.locator('.sr-inspector .sr-fields input,.sr-inspector .sr-fields select,.sr-inspector .sr-fields textarea,.sr-inspector .sr-fields button').last();
  await field.focus();await settled();
  assert(await field.evaluate(n=>{const r=n.getBoundingClientRect(),a=n.closest('.sr-inspector').getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===n;}),`${kind}: last compact focus field must be reachable and unobscured`);
  await capture(`compact-focus-editor-${kind}`);
 }
 await open('empty');await page.locator('[data-action=toggle-focus]').click();await capture('compact-focus-empty');
 await open('protected');await page.locator('[data-track-beat][data-beat-kind=customCode]').click();await page.locator('[data-action=toggle-focus]').click();
 await page.locator('.sr-inspector [data-action=beat-menu]').click();assert.equal(await page.getByRole('button',{name:/^Delete .*Protected source/}).isDisabled(),true);await capture('compact-focus-protected-menu');await page.keyboard.press('Escape');
 report.checks.push('Compact focus structured fields, empty state, protected disabled action and keyboard focus remain reachable');
 // Revision: visual pickers preview on the stage, keep the current value on Escape and apply with Undo.
 await page.setViewportSize({width:1600,height:1000});await open('populated');
 await page.locator('[data-track-beat][data-beat-kind=showCharacter]').click();await page.locator('[data-action=change-expression]').click();
 await page.locator('[data-action=sheet-smile]').hover();
 assert.match(await page.locator('[data-stage-character=Mara] img').getAttribute('src'),/mara-smile/);assert.match(await page.locator('.sc-preview-tag').innerText(),/Previewing Smile/);await capture('revision-expression-preview');
 await page.keyboard.press('Escape');await settled();assert.equal(await page.locator('.sc-sheet').count(),0);
 assert.equal(await page.locator('[data-action=change-expression]').evaluate(n=>document.activeElement===n),true,'Escape returns focus to Change');
 assert.match(await page.locator('[data-stage-character=Mara] img').getAttribute('src'),/mara-neutral/);
 await page.locator('[data-action=change-expression]').click();await page.locator('[data-action=sheet-smile]').click();
 assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='showCharacter').asset,'Smile');
 await page.locator('[data-action=undo]').click();assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='showCharacter').asset,'Neutral');
 await page.locator('[data-track-beat][data-beat-kind=background]').click();await page.locator('[data-action=change-background]').click();await page.locator('[data-action=sheet-tram-interior]').click();
 assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='background').asset,'Tram interior');assert.match(await page.locator('.sr-backdrop').getAttribute('src'),/tram-interior/);
 await page.locator('[data-track-beat][data-beat-kind=dialogue]').first().click();await page.locator('summary[data-action=speaker]').click();
 await page.locator('[data-action=speaker-option-eli]').click();assert.equal((await state()).scenes[0].beats.find(b=>b.id==='beat-11').speaker,'Eli');
 report.checks.push('Revision: expression and background sheets preview on the stage, Escape keeps the value, click applies with Undo; speaker list changes the speaker');
 await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sc-conditions [data-action=open-branch-inner-if]').click();
 assert.equal(await page.locator('.sc-conditions [data-action=open-branch-inner-if]').getAttribute('aria-pressed'),'true');
 assert.deepEqual(await page.locator('.sc-tracks .sc-track-mark').evaluateAll(n=>n.map(m=>m.dataset.branchBoundary)),['entry','entry','exit','exit','after'],'Nested branches get entry, exit and after markers in order');
 await page.locator('[data-action=toggle-focus]').click();await settled();
 assert.equal(await page.locator('.sc-tracks .sr-track-label:visible').count(),6,'Writing focus Tracks shows every lane');await capture('revision-focus-lanes');
 report.checks.push('Revision: Branch path switches carry state; nested markers are ordered; writing focus Tracks shows all six lanes');
 // Revision: condition builder rules, All/Any, created variables with Undo, and planned Add/Subtract.
 await page.setViewportSize({width:1600,height:1000});await open('populated');
 await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();
 await page.locator('[data-action=test-ticket-if-add-rule]').click();await page.locator('summary[data-action=test-ticket-if-rule-1-variable]').click();await page.locator('[data-action=test-ticket-if-rule-1-variable-trust]').click();
 await page.getByRole('textbox',{name:'06 If rule 2 value',exact:true}).fill('5');
 let condition=()=>state().then(v=>v.scenes[0].beats.find(b=>b.id==='beat-1').branches[0].condition);
 assert.equal(await condition(),'has_ticket is true and trust is at least 5');assert.match(await page.locator('.sc-branch[data-branch=ticket-if] .sc-test-code').innerText(),/^if has_ticket and trust >= 5:$/);
 await page.locator('[data-action="06-if-match-any"]').click();assert.equal(await condition(),'has_ticket is true or trust is at least 5');
 await page.locator('[data-action="06-if-rule-2-operator-is-less-than"]').click();assert.equal(await condition(),'has_ticket is true or trust is less than 5');
 await page.locator('summary[data-action=test-ticket-if-rule-0-variable]').click();await page.locator('[data-action=test-ticket-if-rule-0-variable-new]').click();
 await page.getByRole('textbox',{name:'Variable name',exact:true}).fill('Bad Name');await page.locator('[data-action=create-variable]').click();assert.match(await page.locator('.sc-field-error').innerText(),/lowercase/);
 await page.getByRole('textbox',{name:'Variable name',exact:true}).fill('found_letter');await page.locator('[data-action=create-variable]').click();
 assert.equal(await condition(),'found_letter is true or trust is less than 5');
 await page.locator('[data-action=undo]').click();assert.equal(await condition(),'has_ticket is true or trust is less than 5');
 await page.locator('summary[data-action=test-ticket-if-rule-0-variable]').click();assert.equal(await page.locator('[data-action=test-ticket-if-rule-0-variable-found_letter]').count(),0,'Undo removes the created variable');await page.keyboard.press('Escape');
 await capture('revision-condition-builder');
 await pick('setVariable');await page.locator('summary[data-action=set-variable]').click();await page.locator('[data-action=set-variable-trust]').click();await page.locator('[data-action=change-add]').click();
 assert.match(await page.locator('.sr-inspector .sc-test-code').innerText(),/^\$ trust \+= 1$/);assert.match(await page.locator('.sr-inspector').innerText(),/Planned: Loomlight does not write/);
 report.checks.push('Revision: condition rules build tests with presets, All/Any and the Ren\'Py line; new variables validate and undo; Set variable shows planned Add');
 // Revision: Choice options pick scenes from pictures, keep availability to one line and mark their stage button.
 await open('populated');await page.locator('[data-track-beat][data-beat-kind=choice]').click();
 const options=()=>state().then(v=>v.scenes[0].beats.find(b=>b.kind==='choice').options);
 assert.match(await page.locator('[data-choice-index="1"] .sc-guard').innerText(),/Only when trust is at least 3/);
 await page.locator('[data-choice-index="1"] .sc-option-top input').focus();
 assert.equal(await page.locator('.sr-stage [data-stage-choice="1"]').first().getAttribute('data-active'),'true','Focused option marks its stage button');
 await page.locator('[data-action=change-destination-1]').click();
 assert.equal(await page.locator('[data-sheet=destination] [aria-selected=true]').getAttribute('data-value'),'Departure');
 await page.keyboard.press('Escape');assert.equal(await page.locator('[data-action=change-destination-1]').evaluate(n=>document.activeElement===n),true,'Escape returns focus to the destination');
 await page.locator('[data-action=change-destination-1]').click();await page.locator('[data-action=sheet-a-familiar-stranger]').click();
 assert.equal((await options())[1].target,'stranger');
 await page.locator('[data-action=undo]').click();assert.equal((await options())[1].target,'departure');
 await page.locator('[data-action=guard-1-edit]').click();await settled();assert.equal(await page.locator('[data-action=guard-1-rule-0-variable]').evaluate(n=>document.activeElement===n),true,'Edit opens the rule builder');
 await page.locator('[data-action=guard-1-done]').click();assert.equal(await page.locator('[data-action=guard-1-edit]').count(),1);
 await capture('revision-choice');
 report.checks.push('Revision: Choice destinations pick from scene pictures with Escape and Undo; availability collapses to one line; focused options mark their stage button');
 // Revision: choice options have their own beats and an outcome; Tracks and Branch path show option paths.
 await open('populated');await page.locator('[data-track-beat][data-beat-kind=choice]').click();
 assert.deepEqual((await options()).map(o=>o.outcome),['continue','jump','call']);
 assert.equal(await page.locator('.sc-conditions .sc-option-segment').count(),3,'Branch path lists choice options');
 await page.locator('[data-action=option-2-then]').click();await page.locator('[data-action=option-2-then-continue]').click();
 assert.equal((await options())[1].outcome,'continue');assert.equal(await page.locator('[data-action=change-destination-1]').count(),0,'Continue has no destination');
 await page.locator('[data-action=undo]').click();assert.equal((await options())[1].outcome,'jump');
 await page.locator('[data-action=add-caption]').click();await settled();await page.getByRole('textbox',{name:'Line shown with the choices',exact:true}).fill('Where to, then?');
 assert.equal(await page.locator('.sr-stage .sr-saybox p').first().innerText(),'Where to, then?','Caption shows with the choices');
 await page.locator('[data-action=add-choice-option]').click();let menu=(await state()).scenes[0].beats.find(b=>b.kind==='choice');
 assert.equal(menu.options.length,4);assert.equal(menu.branches.length,4,'New option gets its own body');
 await page.locator('[data-action=remove-choice-0]').click();menu=(await state()).scenes[0].beats.find(b=>b.kind==='choice');
 assert.equal(menu.branches.some(b=>b.beats.length),false,'Removing an option removes its beats');
 await page.locator('[data-action=undo]').click();await page.locator('[data-action=open-option-0]').click();
 assert.equal(await page.locator('.sr-inspector .sc-crumb').first().innerText(),'Option 1 · Ask about the last tram');
 assert.match(await page.locator('.sc-tracks .sc-rail-end').first().innerText(),/then 09/);
 await capture('revision-choice-outcomes');
 report.checks.push('Revision: choice options carry beats and an outcome (continue, scene, visit, menu again, end); caption shows on stage; option paths appear in Branch path and Tracks; add/remove keeps bodies with Undo');
 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error.stack);await capture('failure');throw error;}
finally{await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
