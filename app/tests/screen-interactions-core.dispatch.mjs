// Selected production workspace -> real source/history/planner dispatch. No helper or SDK.
// Requires the combined backend and variable.create in the bounded Help driver's allowlist.
import assert from 'node:assert/strict';
import {mkdir,realpath,writeFile,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Window} from 'happy-dom';
import {driverProcess} from './phase2-driver-process.mjs';
import {ScreensWorkspace} from '../dist-tests/src/screen-ui.js';
const output=resolve(process.env.SCREEN_INTERACTIONS_CORE_OUTPUT??`target/screen-interactions-core-${randomUUID()}`);await mkdir(output,{recursive:true});
const scratch=join(await realpath(output),`loomlight-help-controller-interactions-${randomUUID()}`);
const child=driverProcess(resolve(process.env.CARGO_TARGET_DIR??'target',`debug/examples/help-controller-driver${process.platform==='win32'?'.exe':''}`),[scratch]);
const browser=new Window();Object.assign(globalThis,{window:browser,document:browser.document,HTMLElement:browser.HTMLElement,HTMLInputElement:browser.HTMLInputElement,HTMLSelectElement:browser.HTMLSelectElement,HTMLTextAreaElement:browser.HTMLTextAreaElement,HTMLDetailsElement:browser.HTMLDetailsElement,ResizeObserver:browser.ResizeObserver,Event:browser.Event,KeyboardEvent:browser.KeyboardEvent});
let session,workspace,refuse=false;
const result={passed:false,controllerToCore:true,sdkExecuted:false,helperExecuted:false,stages:[],refusals:[],canvasPlans:[]};
async function call(operation,payload={}) {
 assert(!operation.startsWith('runtime.')&&!['screens.canvasRender','screens.canvasStatus'].includes(operation));
 const response=await child.request({protocolVersion:1,requestId:randomUUID().replaceAll('-',''),operation,payload:{...payload,...(session&&!['project.listRecent','project.openRecent'].includes(operation)?{sessionId:session}:{})}});
 if(!response.ok){result.refusals.push({operation,code:response.error.code});throw Object.assign(Error(response.error.message),{code:response.error.code});}return response.value;
}
const source=async path=>(await call('source.open',{path})).text;
async function saveSource(path,text){const base=await call('source.open',{path});const draft=await call('source.updateDraft',{path,expectedBaseRevision:base.baseRevision,text,selectionStart:0,selectionEnd:0});await call('source.save',{path,expectedBaseRevision:draft.baseRevision,expectedDraftVersion:draft.draftVersion});}
async function wait(check,label){const deadline=Date.now()+5000;while(!await check()){if(Date.now()>deadline)throw Error(`Did not settle: ${label}`);await new Promise(r=>setTimeout(r,5));}}
const writes=[];
const control=label=>{const node=workspace.panel.querySelector(`[aria-label="${label}"]`)??workspace.panel.querySelector(`[aria-label="${label.replace(/ value$/,' formula')}"]`);assert(node,label);return node;};
const change=(label,value)=>{const node=control(label);node.value=value;node.dispatchEvent(new Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}));};
const button=label=>{const node=[...workspace.panel.querySelectorAll('button')].find(n=>n.textContent===label);assert(node,label);node.click();};
const select=id=>{if(!workspace.panel.querySelector(`[data-node-id="${id}"]`))button('1  Choose');const row=workspace.panel.querySelector(`[data-node-id="${id}"]`);assert(row,id);row.dispatchEvent(new browser.MouseEvent('dblclick',{bubbles:true}));};
async function apply(){const before=writes.length;button('Apply');await wait(()=>writes.length>before&&!(workspace.panel.querySelector('.screen-text-state')?.textContent??'').includes('Applying changes'),'Apply');}
async function history(direction,path,expected,expectedText){button(direction);await wait(async()=>await source(path)===expected&&workspace.panel.querySelector('[data-text-field="text"]')?.value===expectedText&&workspace.panel.querySelector('[data-text-field="text"]')?.readOnly===false,`${direction} and refreshed controls`);}
async function mount(owner){
 workspace?.dispose();document.body.replaceChildren();workspace=new ScreensWorkspace({resolution:{width:1280,height:720},current:()=>true,coordinate:task=>task(),source:()=>{},preview:()=>{throw Error('No deliberate execution');},saved:()=>{},request:async(operation,payload)=>{
  if(operation==='screens.canvasRender'){const plan=await call('screens.canvasPlan',payload);result.canvasPlans.push({payload,plan});return {phase:'unavailable',message:'Offline planner proof. No helper started.'};}
  if(operation==='screens.compose'&&!payload.validateOnly){writes.push(structuredClone(payload));if(refuse)throw Error('Retained test refusal');}
  return call(operation,payload);
 }});workspace.mount(document.body);await wait(()=>workspace.panel.querySelector(`[data-node-id]`),'workspace load');const picker=workspace.panel.querySelector('.screen-picker select');picker.value=JSON.stringify(['owned',owner.id]);picker.dispatchEvent(new Event('change',{bubbles:true}));
}
try{
 assert.equal((await child.next()).ready,true);const recent=(await call('project.listRecent'))[0],opened=await call('project.openRecent',{recentId:recent.id});session=opened.sessionId;const projectId=opened.projectId,opaqueNeighbor=await source('game/ui/help.rpy');
 for(const [technicalName,variableType,defaultValue]of [['seen','bool',false],['coins','int','12'],['player_name','string','Mara']])await call('variable.create',{technicalName,variableType,defaultValue});
 const variables=(await call('authoring.list')).variables,variable=name=>variables.find(v=>v.technicalName===name);
 let catalog=await call('screens.list');let made=await call('screens.create',{name:'interaction_dialog',kind:'dialog',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});const owner=made.owned.find(s=>s.name==='interaction_dialog');
 catalog=await call('screens.list');made=await call('screens.create',{name:'interaction_panel',kind:'panel',expectedProjectRevision:catalog.projectRevision,expectedSourceMapRevision:catalog.sourceMapRevision,expectedInventoryRevision:catalog.inventoryRevision});const panel=made.owned.find(s=>s.name==='interaction_panel');
 let doc=await call('screens.inspect',{path:owner.path});let added=await call('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'add',parentId:owner.rootId,kind:'text',text:'Coins: 12'}});const bodyId=added.selectedId;
 added=await call('screens.compose',{screenId:owner.id,expectedRevision:added.document.revision,command:{type:'add',parentId:owner.rootId,kind:'textbutton',text:'Close'}});const buttonId=added.selectedId;
 const beforeText=await source(owner.path);await mount(owner);select(bodyId);const input=control('Text');input.focus();input.setSelectionRange(7,9);change('Existing variable',variable('coins').id);button('Insert variable');assert.equal(input.value,'Coins: [coins!q]');assert.equal(input.selectionStart,16);
 await apply();assert.equal(workspace.hasDraft(),false);let afterText=await source(owner.path);assert.equal(afterText,beforeText.replace('text "Coins: 12"','text "Coins: [coins!q]"'));
 doc=await call('screens.inspect',{path:owner.path});assert.deepEqual(doc.screens[0].nodes.find(n=>n.id===bodyId).variableBindings,[{variableId:variable('coins').id}]);
 await history('Undo',owner.path,beforeText,'Coins: 12');await history('Redo',owner.path,afterText,'Coins: [coins!q]');result.stages.push('actual Text selection insertion -> mixed binding -> one history entry');
 change('Text','Balance: [coins!q]');await apply();assert.equal(workspace.hasDraft(),false);
 assert.equal(await source(owner.path),afterText.replace('Coins: [coins!q]','Balance: [coins!q]'));afterText=await source(owner.path);
 select(buttonId);change('Text','Continue');control('Size · px').value='27';control('Size · px').dispatchEvent(new Event('input',{bubbles:true}));
 const width=workspace.panel.querySelector('[data-layout-field="xsize"]');assert(width);width.value='240';width.dispatchEvent(new Event('input',{bubbles:true}));const background=workspace.panel.querySelector('[data-appearance-field="background"]');assert(background);background.value='#345';background.dispatchEvent(new Event('input',{bubbles:true}));
 for(const [index,name,value]of [[1,'seen','True'],[2,'coins','9223372036854775807'],[3,'player_name','[opaque_python()] {literal}']]){change('Add action','setVariable');change(`Action ${index} variable`,variable(name).id);change(`Action ${index} value`,value);}
 change('Add action','showScreen');const panelChoice=JSON.stringify([panel.id,panel.name]);change('Action 4 screen',panelChoice);change('Add action','hideScreen');change('Action 5 screen',panelChoice);change('Add action','finishInteraction');
 refuse=true;await apply();assert.equal(workspace.hasDraft(),true);const rejected=writes.at(-1);workspace.panel.remove();workspace.mount(document.body);await wait(()=>workspace.panel.querySelector('[aria-label="Action 3 value"]'),'remount draft');assert.equal(control('Action 3 value').value,'[opaque_python()] {literal}');refuse=false;await apply();assert.equal(workspace.hasDraft(),false);assert.deepEqual(writes.at(-1),rejected);assert.equal(writes.at(-1).command.interaction.expectedTargetRevisions.length,1);
 const afterActions=await source(owner.path);assert.match(afterActions,/SetVariable\("seen", True\)/);assert.match(afterActions,/9223372036854775807/);assert.match(afterActions,/textbutton "Continue"/);assert.match(afterActions,/text_size 27/);assert.match(afterActions,/xsize 240/);assert.match(afterActions,/background "#345"/);assert.deepEqual(writes.at(-1).command.layout,{xsize:{unit:'pixels',value:240}});
 await history('Undo',owner.path,afterText,'Close');await history('Redo',owner.path,afterActions,'Continue');result.stages.push('bool/int/string + Show/Hide + Finish + text/typography/appearance/layout -> refused remount -> single Apply/Undo/Redo');
 select(buttonId);change('Action 1 value','True');await apply();assert.equal(await source(owner.path),afterActions);await history('Undo',owner.path,afterText,'Close');await history('Redo',owner.path,afterActions,'Continue');
 select(buttonId);change('Action 1 value','False');button('Cancel');assert.equal(await source(owner.path),afterActions);assert.equal(workspace.hasDraft(),false);
 button('Sample values');change('Sample coins','9007199254740993');change('Sample seen','True');change('Sample player_name','[opaque_python()] {literal}');await wait(()=>result.canvasPlans.at(-1)?.payload.variableSamples?.length===3,'typed samples to real planner');
 const sampled=result.canvasPlans.at(-1);assert.equal(sampled.payload.textSamples.length,0);assert(sampled.plan.nodes.some(n=>n.literal==='Balance: 9007199254740993'));assert.deepEqual(sampled.payload.variableSamples.map(s=>s.value),['9007199254740993',true,'[opaque_python()] {literal}']);assert.equal(await source(owner.path),afterActions);assert.equal(workspace.hasDraft(),false);
 const sampleToggle=workspace.panel.querySelector('.siv-sample-toggle');assert.equal(sampleToggle.textContent,'Sample values (3 overrides)');sampleToggle.click();assert.equal(sampleToggle.getAttribute('aria-expanded'),'false');assert.equal(sampleToggle.textContent,'Sample values (3 overrides)');sampleToggle.click();
 change('Sample coins','bad');assert.equal(control('Sample coins').value,'bad');assert.equal(control('Sample coins').getAttribute('aria-invalid'),'true');assert.equal(result.canvasPlans.at(-1).payload.variableSamples[0].value,'9007199254740993');result.stages.push('typed editor-only samples -> real data-only planner; invalid raw input retains last valid value and source');
 select(buttonId);change('Text','Retained state draft');
 for(const [state,prefix]of [['hover','hover_'],['selected','selected_'],['selectedHover','selected_'],['disabled','insensitive_'],['selectedDisabled','selected_'],['normal','']]){
  change('Button state (sample)',state);await wait(()=>result.canvasPlans.at(-1)?.payload.buttonState===state,'sample state to real planner');
  assert.equal(workspace.panel.querySelector('[data-appearance-field="state"]').value,prefix);
  assert.equal(control('Text').value,'Retained state draft');
  assert.equal(result.canvasPlans.at(-1).plan.buttonState,state);assert.equal(result.canvasPlans.at(-1).payload.variableSamples.length,3);
 }
 button('Cancel');button('Reset samples');await wait(()=>result.canvasPlans.at(-1)?.payload.variableSamples.length===0,'reset samples to real planner');assert.equal(await source(owner.path),afterActions);assert.equal(workspace.hasDraft(),false);result.stages.push('canvas state and inspector synchronize through real planner; mixed samples, retained draft, Cancel and Reset leave accepted Source unchanged');
 select(bodyId);change('Text','Coins: [missing_name!q]');await apply();assert.equal(workspace.hasDraft(),true);assert.equal(control('Text').value,'Coins: [missing_name!q]');button('Cancel');assert.equal(await source(owner.path),afterActions);
 select(buttonId);change('Action 2 value','8');await saveSource(owner.path,afterActions+'# competing accepted Source\n');await workspace.load();await apply();assert.equal(workspace.hasDraft(),true);assert.equal(control('Action 2 value').value,'8');button('Cancel');assert.equal(await source(owner.path),afterActions+'# competing accepted Source\n');result.stages.push('unknown binding and stale original Source refuse while retaining drafts; whole-draft Cancel restores accepted Source');
 workspace.dispose();workspace=undefined;await call('project.close');session=undefined;const reopened=(await call('project.listRecent')).find(p=>p.projectId===projectId);session=(await call('project.openRecent',{recentId:reopened.id})).sessionId;
 doc=await call('screens.inspect',{path:owner.path});assert.equal(doc.screens[0].nodes.find(n=>n.id===buttonId).actions.length,6);assert.equal(await source(owner.path),afterActions+'# competing accepted Source\n');await mount(owner);select(bodyId);assert.equal(control('Text').value,'Balance: [coins!q]');assert.equal(await source('game/ui/help.rpy'),opaqueNeighbor);result.stages.push('reopen preserves accepted mixed binding/actions, exact Source and opaque neighbor bytes');// A public-core arithmetic action must survive the existing production draft owner.
 const arithmeticActions=structuredClone(doc.screens[0].nodes.find(n=>n.id===buttonId).actions);
 arithmeticActions[1].value={operation:'add',operand:'coins'};
 const targets=[];for(const action of arithmeticActions)if(action.target&&!targets.some(t=>t.target.screenId===action.target.screenId)){const resolved=await call('screens.resolveTarget',{binding:action.target});targets.push({target:action.target,revisions:resolved.revisions});}
 await call('screens.compose',{screenId:owner.id,expectedRevision:doc.revision,command:{type:'actions',nodeId:buttonId,actions:arithmeticActions,expectedAuthoringRevision:doc.authoringRevision,expectedTargetRevisions:targets}});
 const arithmeticSource=await source(owner.path);await workspace.load();select(buttonId);change('Action 2 value','coins');change('Text','Arithmetic retained');await apply();
 assert.deepEqual(writes.at(-1).command.interaction.actions,arithmeticActions);
 const renamedArithmetic=await source(owner.path);assert.equal(renamedArithmetic,arithmeticSource.replace('textbutton "Continue"','textbutton "Arithmetic retained"'));
 await history('Undo',owner.path,arithmeticSource,'Continue');await history('Redo',owner.path,renamedArithmetic,'Arithmetic retained');
 workspace.dispose();workspace=undefined;await call('project.close');session=undefined;session=(await call('project.openRecent',{recentId:(await call('project.listRecent')).find(p=>p.projectId===projectId).id})).sessionId;
 const finalArithmetic=await call('screens.inspect',{path:owner.path});assert.deepEqual(finalArithmetic.screens[0].nodes.find(n=>n.id===buttonId).actions,arithmeticActions);assert.equal(await source(owner.path),renamedArithmetic);
 result.stages.push('public arithmetic -> actual action draft -> unrelated production edit -> core source/history/reopen preserves formula and timing');result.passed=true;
}catch(error){result.failure={message:error.message,stack:error.stack};result.failureState={message:workspace?.panel.querySelector('.screen-message')?.textContent,text:workspace?.panel.querySelector('[data-text-field="text"]')?.value,history:session?await call('scene.list'):undefined};throw error;}
finally{workspace?.dispose();await browser.happyDOM.close();try{await child.stop();await assert.rejects(access(scratch));result.cleanupComplete=true;}finally{result.driver=child.exitStatus();await writeFile(join(output,'result.json'),JSON.stringify(result,null,2)+'\n');}}
console.log('PASS actual ScreensWorkspace -> core source/history/planner/reopen. No helper, engine, native or fidelity claim.');
