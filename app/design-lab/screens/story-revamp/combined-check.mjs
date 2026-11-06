import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../../launch-browser.mjs';
const output = new URL('../../../../.toolchains/story-combined/initial/', import.meta.url);
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
try{
 if(!process.argv.includes('--compact')) {
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
 await page.locator('.sc-conditions [data-action=after-condition-beat-1]').click();await capture('picker-after-condition');assert.doesNotMatch(await page.locator('.sr-insertion-target').innerText(),/Otherwise/);await page.keyboard.press('Escape');
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
  }
  report.checks.push(`${size}: all 20 beat types insert and expose their editor`);
  await open();await page.locator('[data-action=more]').click();await capture(`${size}-more-menu`);await page.getByRole('button',{name:/^Assist with/}).click();await capture(`${size}-assist-instructions`);await page.locator('[data-action=assist-review]').click();await capture(`${size}-assist-review`);await page.locator('[data-action=assist-apply]').click();assert.match(await page.locator('.sr-prose').inputValue(),/Tell me you heard/);await page.locator('[data-action=undo]').click();assert.match(await page.locator('.sr-prose').inputValue(),/I thought I was/);
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:/^View source for/}).click();await capture(`${size}-source`);await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:'Rename this scene…',exact:true}).click();await capture(`${size}-rename`);await page.locator('[data-action=cancel-dialog]').click();
  await page.locator('[data-action=scenes]').click();await capture(`${size}-scenes`);await page.locator('[data-action=new-scene]').click();await page.locator('[data-action=submit-scene]').click();assert.equal(await page.locator('[aria-invalid=true]').count(),1);await capture(`${size}-new-scene-error`);await page.getByRole('textbox',{name:'Scene name',exact:true}).fill('The quiet platform');await page.locator('[data-action=submit-scene]').click();await page.locator('.sr-prose:focus').fill('The station is empty.');await page.locator('.sr-prose').press('Meta+Shift+Enter');await page.locator('.sr-prose:focus').fill('Except for us.');report.checks.push(`${size}: scene validation, creation, next-line focus and Assist Undo`);
  await open();await page.locator('.sc-conditions [data-action=edit-condition-beat-1]').click();await page.locator('.sr-inspector [data-action=beat-menu]').click();await capture(`${size}-beat-menu`);await page.getByRole('button',{name:/^Delete 06 Condition/}).click();await capture(`${size}-delete-condition`);await page.locator('[data-action=cancel-dialog]').click();assert((await state()).scenes[0].beats.some(b=>b.kind==='condition'));await page.locator('.sr-inspector [data-action=beat-menu]').click();await page.getByRole('button',{name:/^Delete 06 Condition/}).click();await page.locator('[data-action=confirm-delete]').click();await page.locator('[data-action=undo]').click();assert((await state()).scenes[0].beats.some(b=>b.kind==='condition'));
  await page.locator('.sc-conditions [data-action=open-branch-ticket-if]').click();await page.locator('.sr-inspector [data-action=beat-menu]').click();await page.getByRole('button',{name:'Move to another branch…',exact:true}).click();await capture(`${size}-move-branch`);await page.locator('[data-action=confirm-move]').click();await page.locator('[data-action=undo]').click();assert.equal((await state()).scenes[0].beats.find(b=>b.kind==='condition').branches[0].beats[0].text,'Keep your ticket. Some doors only open once.');report.checks.push(`${size}: condition deletion/cancel/Undo and moving between branches`);
  await open();await page.locator('[data-track-beat][data-beat-kind=choice]').click();await page.getByRole('textbox',{name:'Option 1 availability',exact:true}).fill('has_ticket');await capture(`${size}-choice`);await page.locator('[data-action=new-choice-0]').click();await capture(`${size}-choice-new-destination`);await page.locator('[data-action=cancel-dialog]').click();await page.locator('[data-action=open-choice-0]').click();await page.locator('[data-action=back-scene]').click();assert.equal(await page.getByRole('textbox',{name:'Option 1 availability',exact:true}).inputValue(),'has_ticket');
  await pick('narration');await page.locator('.sr-prose:focus').fill('No option was available.');let scene=(await state()).scenes[0];const choice=scene.beats.findIndex(b=>b.kind==='choice');assert.equal(scene.beats[choice+1].text,'No option was available.');report.checks.push(`${size}: Choice destination return retains draft; next beat follows unavailable options`);
  await open();await page.locator('[data-track-beat][data-beat-kind=call]').click();await page.locator('[data-action=open-destination]').click();await page.locator('[data-action=back-scene]').click();assert.equal((await state()).selected,'beat-12');
  await page.locator('[data-action=enlarge-stage]').click();await page.locator('[data-action=add-beat]').click();await page.locator('[data-picker-search]').fill('dialogue');await page.keyboard.press('Enter');assert.equal(await page.locator('.sr-content').getAttribute('data-stage-expanded'),'false');await page.locator('.sr-prose:focus').fill('The editor is visible.');report.checks.push(`${size}: Call return and insertion from enlarged stage`);
  await open();await page.locator('[data-action=stage-Mara]').click();await capture(`${size}-stage-object`);await page.locator('[data-action=edit-stage-owner]').click();assert.equal(await page.getByRole('combobox',{name:'Character',exact:true}).inputValue(),'Mara');
  await page.locator('[data-action=more]').click();await page.getByRole('button',{name:'Design notes (future tools)',exact:true}).click();await capture(`${size}-future-notes`);await page.getByRole('button',{name:'Close',exact:true}).click();
 }

 assert.deepEqual(report.errors,[]);report.passed=true;
}catch(error){report.failure=String(error.stack);await capture('failure');throw error;}
finally{await writeFile(new URL('report.json',output),JSON.stringify(report,null,2)+'\n');await browser.close();}
console.log(JSON.stringify(report,null,2));
