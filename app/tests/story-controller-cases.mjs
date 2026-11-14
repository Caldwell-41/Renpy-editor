// Real production Story/Source/Branches DOM scenarios. All mutations use UI callbacks.
// The full gate refuses missing cases until reviewed broad controls are implemented here.
const names=[
 'Guarded Choice actual Story dispatch preserves exact neighbours',
 'Call destination actual Story dispatch preserves its return label',
 'Explicit branch Beat insertion captures body and sibling position',
 'Condition builder and If Else If Otherwise controls preserve exact ownership',
 'Nested keyboard and explicit cross-body moves preserve subtree identity',
 'Delete versus unwrap and empty bodies preserve safe source boundaries',
 'Manual branch preview and Branches navigation agree with exact Source locations',
 'Cancel and dirty Source draft refusal retain pending author input',
 'Ordinary external edits and stale revisions refuse with zero source writes',
 'Beat drafts stay attached across scenes and workspaces until Commit or Cancel',
 'Story Save accepts every beat draft across scenes in one transaction, or none',
 'Beat draft conflicts resolve with Discard draft or Override source',
 'Reel edits and inserts through the shared drafts and commands, and view switches keep them',
 'Writing focus keeps drafts, focus and caret, and edits, inserts and resizes through the shared commands',
 'Branch beat drafts stay with their branch through ordinary external edits',
 'Missing and mismatched condition Variables show their reason in Tracks, Branch path and the builder',
 'Undo of a nested beat keeps Redo when the host refuses a history read as busy',
];
const scene=c=>c.workspace().scenes.find(s=>s.id===c.workspace().entrySceneId);
// The scene Story shows, read from the selected row in the actual scene tree.
const shownScene=c=>{const name=c.document.querySelector('.tree-scene-row.selected .tree-scene-open')?.textContent;return c.workspace().scenes.find(s=>s.displayName===name)?.id;};
// Story Combined: a beat is a Tracks or Reel column; its editor sits beside the stage.
// Nested beats show once the Branch path opens their branches.
const shownBeats=c=>(c.workspace().scenes.find(s=>s.id===shownScene(c))??scene(c)).beats;
const findRow=(c,id)=>[...c.document.querySelectorAll('.scene-workspace .story-route [data-beat-id]')].find(node=>node.dataset.beatId===id);
const row=(c,id)=>{const node=findRow(c,id);c.assert(node,`Missing Tracks column ${id}`);return node;};
const card=(c,id)=>c.document.querySelector(`.scene-workspace .story-editor[data-editor-for="${id}"]`);
const openBranch=(c,branchId)=>{const segment=[...c.document.querySelectorAll('.scene-workspace .story-branch-segment')].find(item=>item.dataset.branchId===branchId);c.assert(segment,`Missing Branch path switch ${branchId}`);if(segment.ariaPressed!=='true')segment.click();};
const reveal=(c,id)=>{const beats=shownBeats(c),chain=[];let beat=beats.find(b=>b.id===id);while(beat?.owner){chain.unshift(beat.owner.branchId);beat=beats.find(b=>b.id===beat.owner.branchId);}for(const branch of chain)openBranch(c,branch);};
const nodeOf=(c,groupId)=>shownBeats(c).find(b=>b.conditionalBranch?.groupId===groupId&&!b.conditionalBranch.ordinal&&!b.conditionalBranch.otherwise&&!b.conditionalBranch.choiceOption);
// Selects a beat, or a condition by its If header, and returns its editor.
const pick=async(c,id)=>{reveal(c,id);const target=row(c,id).querySelector(':scope > .story-track-beat, :scope > .story-slot-name');if(target.dataset.selected!=='true')target.click();await c.wait(()=>card(c,id));return card(c,id);};
// Changes are settled once the editor holds no unsubmitted input.
const accepted=(c,id)=>()=>c.lastMutation()?.response.ok&&!card(c,id)?.querySelector('[data-unsubmitted="true"]');
const text=c=>async()=>c.sourceText(await c.snapshot(),scene(c).sourcePath);
const source=c=>async()=>c.call('source.open',{path:scene(c).sourcePath});
const select=async(c,id)=>{await pick(c,id);await c.wait(()=>card(c,id).querySelector('.expanded-beat'));};
const envelope=(c,before,command)=>{
 const result=c.lastMutation();c.assert(result?.response.ok,'Actual Host must accept the DOM authoring request');
 c.assert.equal(result.request.operation,'scene.apply');c.assert.equal(result.request.payload.sessionId,c.session());
 c.assert.equal(result.request.payload.expectedProjectRevision,before.projectRevision);
 c.assert.equal(result.request.payload.expectedSourceMapRevision,before.sourceMapRevision);
 c.assert.equal(result.request.payload.command.expectedSourceRevision,before.scenes.find(s=>s.id===before.entrySceneId).sourceRevision);
 c.assert.equal(result.request.payload.command.type,command);return result.request.payload.command;
};
const unchangedOtherSources=(c,before,after,path)=>{
 c.assert.deepEqual(Object.fromEntries(Object.entries(c.rpy(after)).filter(([p])=>p!==path)),Object.fromEntries(Object.entries(c.rpy(before)).filter(([p])=>p!==path)));
};
// An option's Only when opens from Edit; its first rule's number is the test value.
const guard=async(c,choice,index,value)=>{
 await select(c,choice.id);const editor=card(c,choice.id);const option=editor.querySelectorAll('.story-option')[index];c.assert(option);
 option.querySelector('.story-guard > button').click();
 c.enter(option.querySelector(`[aria-label="Option ${index+1} rule 1 value"]`),value);
 await c.click('Commit Beat',editor);await c.wait(accepted(c,choice.id));
};
// Add a beat: pick a kind in the open dialog; its new beat opens in the editor.
const pickIn=async(c,kind)=>{await c.wait(()=>c.document.querySelector('.scene-workspace .story-add-beat'));c.document.querySelector(`.scene-workspace .story-add-beat [data-insert-kind="${kind}"]`).click();await c.wait(()=>c.document.querySelector('.scene-workspace .new-beat'));};
// A branch's + Beat opens Add a beat for that branch.
const addIn=async(c,header,kind)=>{const section=await branchBody(c,header.id);section.querySelector(`[data-beat-opener="branch:${header.id}"]`).click();await pickIn(c,kind);return c.document.querySelector('.scene-workspace .new-beat');};
// The rule builder: a rule's variable list, its test switch and its value.
const ruleOf=(scope,index)=>scope.querySelectorAll('.story-rule')[index];
const pickVariable=(c,scope,index,name)=>{const rule=ruleOf(scope,index);rule.querySelector('.story-variable-picker > summary').click();const option=[...rule.querySelectorAll('[role=option]')].find(item=>item.querySelector('.story-variable-name')?.textContent===name);c.assert(option,`variable ${name}`);option.click();};
const pickTest=(c,scope,index,label)=>{const radio=[...ruleOf(scope,index).querySelectorAll('[role=radio]')].find(item=>item.textContent===label||item.getAttribute('aria-label')===label);c.assert(radio,`test ${label}`);radio.click();};
const ruleValue=(c,scope,index,value)=>c.enter(ruleOf(scope,index).querySelector('.story-rule-how > input'),value);
// Move to: open a place in the tree, then choose one of its positions.
const movePick=(c,dialog,place,label)=>{const node=dialog.querySelector(`[data-node="${place}"]`);c.assert(node,`place ${place}`);if(node.getAttribute('aria-expanded')!=='true')node.click();
 const position=[...dialog.querySelectorAll(`[data-node^="${place}:"]`)].find(item=>item.textContent.slice(1)===label||label instanceof RegExp&&label.test(item.textContent));c.assert(position,`position ${label}`);position.click();};
const headers=s=>s.beats.filter(b=>b.conditionalBranch&&!b.owner);
const authored={};
// A condition's editor, by its group.
const group=async(c,id)=>{const node=nodeOf(c,id);c.assert(node,`Missing actual condition group ${id}`);return pick(c,node.id);};
// A branch's section of its condition's editor: the branch opens in the Branch path first.
const branchBody=async(c,id)=>{const header=shownBeats(c).find(b=>b.id===id);c.assert(header);reveal(c,id);openBranch(c,id);const editor=await pick(c,nodeOf(c,header.conditionalBranch.groupId).id);const section=editor.querySelector(`.story-branch-editor[data-branch-id="${id}"]`);c.assert(section,`Missing branch editor ${id}`);return section;};
const panel=(c,title)=>{const node=c.document.querySelector(`.story-operation[aria-label="${title}"]`);c.assert(node,`Missing actual operation ${title}`);return node;};
// A branch's test is a retained draft panel with Commit test and Cancel.
const openHeader=async(c,id)=>{const section=await branchBody(c,id);await c.wait(()=>section.querySelector('.story-branch-test'));return section.querySelector('.story-branch-test');};
const conditionDraft=(c,label)=>{const node=c.document.querySelector(`.story-condition-draft[aria-label="${label}"]`);c.assert(node,`Missing condition draft ${label}`);return node;};
const applyOperation=async(c,scope,label,type)=>{
 const at=c.requests().length;await c.click(label,scope);
 await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.apply'&&r.request.payload.command.type===type));
 await c.settle();c.assert(c.lastMutation()?.response.ok,`Actual ${type} transaction must pass`);
};
const replaceOnce=(c,text,old,next)=>{c.assert.equal(text.split(old).length,2,`Expected unique byte oracle: ${old}`);return text.replace(old,next);};
const bodyRef=header=>({type:'branch',groupId:header.conditionalBranch.groupId,branchId:header.id});
const addNarration=async(c,header,value)=>{
 const before=c.workspace();const draft=await addIn(c,header,'narration');c.assert(draft);c.enter(draft.querySelector('textarea'),value);
 await applyOperation(c,draft,'Add Beat','insertBodyBeat');const cmd=envelope(c,before,'insertBodyBeat');c.assert.deepEqual(cmd.body,bodyRef(header));
 return scene(c).beats.find(b=>b.payload.text===value);
};
const newHeaders=c=>scene(c).beats.filter(b=>b.conditionalBranch?.groupId===authored.groupId);
const previewBoundary=(c,beat)=>{c.assert(beat);const number=row(c,beat.id).querySelector('.story-beat-number').textContent;c.assert(c.document.querySelector('.story-stage-status').textContent.startsWith(`Through ${number} ·`),`Stage previews through ${number}`);};
// Wait real mounted controls and typed completion, never the shell alone.
const mountedSourceEditor=(c,path)=>{
 const surface=c.document.querySelector('.source-workspace'),editor=surface?.querySelector('textarea.source-editor');
 const active=surface?.querySelector('.source-tab-group[data-active="true"]');
 return surface?.isConnected&&surface.dataset.sourceBusy==='false'&&surface.querySelector('.source-header h1')?.textContent===path&&active?.title===path&&editor?.isConnected&&!editor.disabled&&!editor.readOnly?editor:undefined;
};
const successfulOpen=(c,from,path,owner)=>c.requests().slice(from).some(r=>r.request.operation==='source.open'&&r.request.payload.path===path&&r.request.payload.sessionId===owner&&r.responseOk);
const openSourceEditor=async(c,path)=>{
 const owner=c.session();await c.click('Source');
 const find=()=>[...c.document.querySelectorAll('.source-file-tree .source-file-open')].find(b=>b.title===path&&b.isConnected&&!b.disabled);
 await c.wait(()=>c.session()===owner&&find());
 const from=c.requests().length;find().click();
 await c.wait(()=>c.session()===owner&&successfulOpen(c,from,path,owner)&&mountedSourceEditor(c,path));await c.settle();
 c.assert.equal(c.session(),owner);const ready=mountedSourceEditor(c,path);c.assert(ready,'Exact current Source editor must remain ready after typed opening settles');return ready;
};
const goStory=async(c,sceneId=scene(c).id)=>{
 const from=c.requests().length,owner=c.session();await c.click('Story');
 await c.wait(()=>c.session()===owner&&shownScene(c)===sceneId&&c.document.querySelector('.scene-workspace .story-track-column')&&c.requests().slice(from).some(r=>r.request.operation==='scene.list'&&r.request.payload.sessionId===owner&&r.responseOk));await c.settle();
};
const openBranches=async(c,sceneId,routeId)=>{
 const from=c.requests().length,owner=c.session();await c.click('Branches');
 const selected=()=>c.document.querySelector('[aria-label="Selected Scene"]');
 await c.wait(()=>c.session()===owner&&selected()?.isConnected&&!selected().disabled&&[...selected().options].some(o=>o.value===sceneId)&&c.requests().slice(from).some(r=>r.request.operation==='flow.list'&&r.request.payload.sessionId===owner&&r.responseOk));
 c.enter(selected(),sceneId,'change');
 if(routeId!==undefined){const routes=()=>c.document.querySelector('[aria-label="Selected route"]');await c.wait(()=>routes()?.isConnected&&!routes().disabled&&[...routes().options].some(o=>o.value===routeId));c.enter(routes(),routeId,'change');}
 await c.settle();c.assert.equal(c.session(),owner);
};
// Exact fixture changes still travel through production Source DOM and its typed requester.
const editSource=async(c,expected)=>{
 const path=scene(c).sourcePath,before=await c.snapshot(),at=c.requests().length,owner=c.session();
 const editor=await openSourceEditor(c,path);
 const editorText=expected.startsWith('\ufeff')?expected.slice(1):expected;c.enter(editor,editorText);
 await c.wait(async()=>(await c.call('source.open',{path})).text===editorText);await c.settle();
 await c.click('Save Source',c.document.querySelector('.app-header'));
 await c.wait(()=>c.session()===owner&&c.requests().slice(at).some(r=>r.request.operation==='source.save'&&r.request.payload.path===path&&r.request.payload.sessionId===owner&&r.responseOk)&&mountedSourceEditor(c,path)?.value===editorText);await c.settle();
 await goStory(c);
 const after=await c.snapshot();c.assert.equal(c.sourceText(after,path),expected);unchangedOtherSources(c,before,after,path);
 c.assert.equal((await c.call('source.list')).dirtyCount,0);
};
const treeControls=c=>{
 const selected=c.document.querySelector('.tree-scene-row.selected');c.assert(selected);
 const menu=selected.querySelector('.tree-menu');c.assert(menu);if(!menu.open)menu.querySelector('summary').click();
 const controls=[c.document.querySelector('.tree-heading button'),[...c.document.querySelectorAll('.tree-new-scene')].find(b=>b.textContent==='+ New Scene'),[...menu.querySelectorAll('button')].find(b=>b.textContent==='Rename')];
 controls.forEach(control=>c.assert(control?.isConnected&&!control.hidden));return controls;
};
// Example scenes by name, and opening one from the scene tree.
const byName=(c,name)=>c.workspace().scenes.find(s=>s.displayName===name);
const beatIn=(c,name,test)=>byName(c,name).beats.find(test);
const openScene=async(c,name)=>{const id=byName(c,name).id;
 [...c.document.querySelectorAll('.tree-scene-open')].find(x=>x.textContent===name).click();
 await c.wait(()=>shownScene(c)===id&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();};
// The assembled release journey on the public example (story-release.dispatch.mjs).
export const RELEASE_JOURNEY='Drafts across scenes and views, refused Save, Commit, Source edit, B conflict, Save and Undo/Redo keep unrelated source';
// Story controls the other cases leave out, on the public example after the journey.
export const STORY_CONTROLS='Stage media, Audition, Add change here, + Next line, Select Choice, + New variable, + New scene, and chapter and scene moves and deletes reach real core';
export const storyCases={
 [names[0]]:async c=>{
  const before=c.workspace(),s=scene(c),choice=s.beats.find(b=>b.payload.type==='choice');c.assert(choice);
  const bytes=await c.snapshot();const original=c.sourceText(bytes,s.sourcePath);
  const stable=s.beats.map(b=>b.id);const neighbor=structuredClone(choice.payload.options[1]);
  await guard(c,choice,0,'6');
  const command=envelope(c,before,'updateBodyBeat');
  c.assert.equal(command.beatId,choice.id);c.assert.deepEqual(command.expectedBody,{type:'root'});
  c.assert.equal(command.beat.options[0].condition.expression.right.value,'6');
  c.assert.deepEqual(command.beat.options[1],neighbor);
  const after=await c.snapshot();const actual=c.sourceText(after,s.sourcePath);
  c.assert.equal(original.split('"Ready route" if trust >= 5:').length,2);
  c.assert.equal(actual,original.replace('"Ready route" if trust >= 5:','"Ready route" if (trust >= 6):'));
  c.assert.deepEqual(scene(c).beats.map(b=>b.id),stable);unchangedOtherSources(c,bytes,after,s.sourcePath);
  c.assert(actual.startsWith('\ufeff'));c.assert(actual.includes('# exact Story fixture café 雪'));
  const flow=await c.call('flow.list',{refresh:true});const edge=flow.edges.find(e=>e.beatId===choice.id&&e.optionOrdinal===0);
  c.assert(edge);c.assert.equal(edge.condition.expression.right.value,'6');
  // A Source-authored unsupported guard must make the whole Choice inert in Story.
  const supported=actual;const unknown=replaceOnce(c,supported,'"Low route" if trust >= 0 and trust < 5:','"Low route" if custom_check():');
  await editSource(c,unknown);const unknownChoice=scene(c).beats.find(b=>b.id===choice.id);c.assert(unknownChoice);
  c.assert.equal(unknownChoice.payload.options[1].condition.status,'unknown');const from=c.requests().length;
  await select(c,unknownChoice.id);const editor=card(c,unknownChoice.id);
  c.assert(editor.querySelector('.expanded-beat.protected-code'));c.assert(!editor.querySelector('input,textarea,select'));
  c.assert.match(editor.textContent,/unsupported condition.*Edit it in Source/);
  for(const button of editor.querySelectorAll('.story-beat-menu button'))c.assert(button.disabled,'Unknown Choice authoring controls must be disabled');
  c.assert(![...editor.querySelectorAll('button')].some(b=>b.textContent==='Commit Beat'));
  c.key(row(c,unknownChoice.id).querySelector('.story-track-beat'),'ArrowUp',{altKey:true});await c.settle();
  c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),unknown);await editSource(c,supported);
 },
 [names[1]]:async c=>{
  const before=c.workspace(),s=scene(c),call=s.beats.find(b=>b.payload.type==='call');c.assert(call);
  const destination=before.scenes.find(s=>s.displayName==='High ending');c.assert(destination);
  const oldDestination=before.scenes.find(s=>s.id===call.payload.sceneId);const savedLabel=call.payload.returnLabel;
  const bytes=await c.snapshot();const original=c.sourceText(bytes,s.sourcePath);
  await select(c,call.id);const editor=card(c,call.id);c.enter(editor.querySelector('[aria-label="Call destination Scene"]'),destination.id,'change');
  await c.click('Commit Beat',editor);await c.wait(accepted(c,call.id));
  const command=envelope(c,before,'updateBodyBeat');c.assert.deepEqual(command.expectedBody,{type:'root'});
  c.assert.equal(command.beat.sceneId,destination.id);c.assert.equal(command.beat.returnLabel,savedLabel);
  const after=await c.snapshot();c.assert.equal(c.sourceText(after,s.sourcePath),original.replace(`call ${oldDestination.technicalLabel} from ${savedLabel}`,`call ${destination.technicalLabel} from ${savedLabel}`));
  c.assert.equal(scene(c).beats.find(b=>b.id===call.id).payload.returnLabel,savedLabel);unchangedOtherSources(c,bytes,after,s.sourcePath);
  const flow=await c.call('flow.list',{refresh:true}),edge=flow.edges.find(e=>e.kind==='call'&&e.beatId===call.id);c.assert(edge?.continuation?.location);
  await select(c,call.id);await c.click('Open called Scene',card(c,call.id));await c.wait(()=>shownScene(c)===destination.id&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();
  c.assert([...c.document.querySelectorAll('.scene-workspace button')].some(b=>b.textContent==='Back to caller'));
  await c.click('Back to caller');await c.wait(()=>shownScene(c)===s.id&&findRow(c,call.id)?.querySelector('.story-track-beat')?.dataset.selected==='true'&&card(c,call.id));await c.settle();
  await c.click('View Call continuation',card(c,call.id));await c.wait(()=>findRow(c,edge.continuation.beatId)?.querySelector('.story-track-beat')?.dataset.selected==='true'&&card(c,edge.continuation.beatId));await c.settle();
  const continuation=scene(c).beats.find(b=>b.id===edge.continuation.beatId);c.assert.equal(continuation.payload.text,'Caller resumed');c.assert(!continuation.owner);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(after));
 },
 [names[2]]:async c=>{
  const before=c.workspace(),s=scene(c),header=headers(s).find(b=>b.conditionalBranch.ordinal===0);c.assert(header);
  const body={type:'branch',groupId:header.conditionalBranch.groupId,branchId:header.id};const bytes=await c.snapshot();
  const original=c.sourceText(bytes,s.sourcePath);const originalIds=s.beats.map(b=>b.id);
  const panel=await addIn(c,header,'narration');c.assert(panel);
  // The new beat names where it goes: at the end of the If, in that branch.
  const where=[...panel.querySelectorAll('.story-where dd')].map(item=>item.textContent);
  c.assert.match(where[0],/^End of "If .+"$/);c.assert.match(where[1],new RegExp(`^${s.displayName} › If `));c.assert.equal(where[2],`${row(c,shownBeats(c).find(b=>b.payload.text==='Nested retained').id).querySelector('.story-beat-number').textContent} Narration`);
  c.enter(panel.querySelector('textarea'),'Inserted branch café 雪');
  await c.click('Add Beat',panel);await c.wait(()=>c.lastMutation()?.response.ok&&!c.document.querySelector('.new-beat'));
  const command=envelope(c,before,'insertBodyBeat');c.assert.deepEqual(command.body,body);c.assert.deepEqual(command.position,{type:'end'});
  const after=await c.snapshot();c.assert.equal(c.sourceText(after,s.sourcePath),original.replace('    elif trust == 4:\n','        "Inserted branch café 雪"\n    elif trust == 4:\n'));
  const added=scene(c).beats.find(b=>!originalIds.includes(b.id));c.assert.equal(added.payload.text,'Inserted branch café 雪');
  c.assert.deepEqual(added.owner,{groupId:body.groupId,branchId:body.branchId});
  c.assert.deepEqual(scene(c).beats.filter(b=>originalIds.includes(b.id)).map(b=>b.id),originalIds);
  // The added beat stays selected inside its open branch.
  c.assert.equal(row(c,added.id).dataset.depth,'1');c.assert.equal(card(c,added.id)?.dataset.editorFor,added.id);unchangedOtherSources(c,bytes,after,s.sourcePath);
 },
 [names[3]]:async c=>{
  let before=c.workspace(),bytes=await c.snapshot(),original=c.sourceText(bytes,scene(c).sourcePath);const oldIds=scene(c).beats.map(b=>b.id);
  // The rule builder starts with one rule on the first variable. Two rules join with All.
  // A new condition is a draft, like a new beat, until Add Condition.
  await c.click('Add Condition',c.document.querySelector('.scene-workspace .scene-history'));let form=c.document.querySelector('.scene-workspace .new-beat');c.assert.equal(form?.dataset.beatType,'condition');
  pickVariable(c,form,0,'precision');ruleValue(c,form,0,'9007199254740993');
  await c.click('+ Add rule',form);pickVariable(c,form,1,'trust');pickTest(c,form,1,'is less than');ruleValue(c,form,1,'5');
  c.assert.equal(form.querySelector('.story-rule-code').textContent,'if precision >= 9007199254740993 and trust < 5:');
  await applyOperation(c,form,'Add Condition','insertCondition');const cmd=envelope(c,before,'insertCondition');
  c.assert.deepEqual(cmd.body,{type:'root'});c.assert.equal(cmd.condition.expression.type,'and');c.assert.deepEqual(cmd.condition.expression.left.right,{type:'int',value:'9007199254740993'});c.assert.equal(cmd.condition.expression.right.operator,'less');
  let current=scene(c),header=current.beats.find(b=>b.conditionalBranch&&!oldIds.includes(b.id));c.assert(header);authored.groupId=header.conditionalBranch.groupId;authored.headerId=header.id;
  let expected=replaceOnce(c,original,'    return\n','    if ((precision >= 9007199254740993) and (trust < 5)):\n        pass\n    return\n');
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);c.assert(current.beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===header.id));
  // Editing the If test in place: remove the first rule and commit the test.
  before=c.workspace();form=await openHeader(c,header.id);c.assert.equal(ruleOf(form,0).querySelector('.story-variable-name').textContent,'precision');
  await c.click('Remove rule 1',form);await applyOperation(c,form,'Commit test','updateConditionBranch');const update=envelope(c,before,'updateConditionBranch');c.assert.equal(update.branchId,header.id);c.assert.deepEqual(update.expectedBody,{type:'root'});
  expected=replaceOnce(c,expected,'    if ((precision >= 9007199254740993) and (trust < 5)):\n','    if (trust < 5):\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  before=c.workspace();await c.click('+ Add Else if',await group(c,authored.groupId));form=conditionDraft(c,'New Else if');
  pickVariable(c,form,0,'mood');ruleValue(c,form,0,'ready');c.enter(form.querySelector('[aria-label="Branch position"]'),'end','change');
  await applyOperation(c,form,'Add Else If','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').beforeBranchId,null);
  expected=replaceOnce(c,expected,'    if (trust < 5):\n        pass\n','    if (trust < 5):\n        pass\n    elif (mood == "ready"):\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  before=c.workspace();await c.click('Add Otherwise',(await group(c,authored.groupId)).querySelector('.story-editor-tools'));form=conditionDraft(c,'New Otherwise');
  await applyOperation(c,form,'Add Otherwise','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').condition,null);
  expected=replaceOnce(c,expected,'    elif (mood == "ready"):\n        pass\n','    elif (mood == "ready"):\n        pass\n    else:\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  c.assert.equal(newHeaders(c).length,3);c.assert([...c.document.querySelectorAll('.story-branch-group')].some(item=>item.dataset.branchOwner===authored.headerId&&[...item.querySelectorAll('.story-branch-segment')].some(segment=>segment.textContent==='Otherwise')));
  const elseif=newHeaders(c).find(b=>b.conditionalBranch.ordinal===1);before=c.workspace();form=await openHeader(c,elseif.id);ruleValue(c,form,0,'blocked');
  await applyOperation(c,form,'Commit test','updateConditionBranch');c.assert.equal(envelope(c,before,'updateConditionBranch').branchId,elseif.id);
  expected=replaceOnce(c,expected,'elif (mood == "ready")','elif (mood == "blocked")');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  // A half-typed number stays in its field, marked, and Commit test sends nothing.
  form=await openHeader(c,header.id);const at=c.requests().length;ruleValue(c,form,0,'-');ruleOf(form,0).querySelector('.story-rule-how > input').dispatchEvent(new c.document.defaultView.Event('blur'));
  c.assert.equal(ruleOf(form,0).querySelector('.story-rule-how > input').getAttribute('aria-invalid'),'true');await c.click('Commit test',form);await c.settle();
  c.assert.equal(c.requests().slice(at).filter(r=>r.request.operation==='scene.apply').length,0);c.assert.equal(ruleOf(form,0).querySelector('.story-rule-how > input').value,'-');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  await c.click('Cancel',form);
  // "Remove this Else if" marks the Else if; Remove branch removes it.
  before=c.workspace();const marked=await branchBody(c,elseif.id);await c.click('Remove this Else if',marked);await c.settle();form=c.document.querySelector(`.story-branch-editor[data-branch-id="${elseif.id}"] .story-branch-removal`);c.assert(form);await applyOperation(c,form,'Remove branch','removeConditionBranch');
  c.assert.equal(envelope(c,before,'removeConditionBranch').branchId,elseif.id);
  expected=replaceOnce(c,expected,'    elif (mood == "blocked"):\n        pass\n','');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  c.assert.deepEqual(newHeaders(c).map(b=>b.id),[header.id,newHeaders(c).find(b=>b.conditionalBranch.otherwise).id]);
  unchangedOtherSources(c,bytes,await c.snapshot(),current.sourcePath);
  const controlsAt=c.requests().length,controlBytes=await c.snapshot();
  // The Branch path opens and closes branches; it writes nothing.
  const focusBranch=newHeaders(c).find(b=>b.conditionalBranch.otherwise),segment=id=>[...c.document.querySelectorAll('.story-branch-segment')].find(item=>item.dataset.branchId===id);
  openBranch(c,focusBranch.id);await c.settle();c.assert.equal(segment(focusBranch.id).ariaPressed,'true');c.assert(c.document.querySelector(`.story-track-slot[data-branch-id="${focusBranch.id}"]`),'An empty Otherwise is one named slot');
  segment(focusBranch.id).click();await c.settle();c.assert.equal(segment(focusBranch.id).ariaPressed,'false');c.assert.equal(c.document.querySelector(`.story-track-slot[data-branch-id="${focusBranch.id}"]`),null);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(controlBytes));c.assert.equal(c.requests().slice(controlsAt).filter(r=>r.request.operation==='scene.apply').length,0);
  // Create and remove an actual nested condition: Add a beat in Otherwise offers Condition, which starts on the first variable.
  before=c.workspace();form=await addIn(c,focusBranch,'condition');
  const priorIds=scene(c).beats.map(b=>b.id);await applyOperation(c,form,'Add Condition','insertCondition');c.assert.deepEqual(envelope(c,before,'insertCondition').body,bodyRef(focusBranch));
  const nestedHeader=scene(c).beats.find(b=>b.conditionalBranch&&!priorIds.includes(b.id));c.assert(nestedHeader);c.assert.deepEqual(nestedHeader.owner,{groupId:authored.groupId,branchId:focusBranch.id});
  const nestedBytes=replaceOnce(c,expected,'    if (trust < 5):\n        pass\n    else:\n        pass\n','    if (trust < 5):\n        pass\n    else:\n        if (flag == True):\n            pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),nestedBytes);
  before=c.workspace();await c.click('Delete condition',await group(c,nestedHeader.conditionalBranch.groupId));form=panel(c,'Delete entire condition');await applyOperation(c,form,'Delete entire condition','removeStoryNode');c.assert.deepEqual(envelope(c,before,'removeStoryNode').expectedBody,bodyRef(focusBranch));
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  // Story Save writes a test edit and a new Else if as condition drafts, one Undo each.
  const header2=c.document.querySelector('.app-header'),statusLine=c.document.querySelector('#app-status'),saveAt=c.requests().length;
  form=await openHeader(c,header.id);ruleValue(c,form,0,'6');
  await c.click('+ Add Else if',await group(c,authored.groupId));form=conditionDraft(c,'New Else if');pickVariable(c,form,0,'mood');ruleValue(c,form,0,'late');
  await select(c,scene(c).beats.find(b=>!b.owner&&b.payload.type==='return').id);c.assert.equal(row(c,header.id).dataset.beatDraft,'true');
  c.assert.equal(c.requests().slice(saveAt).filter(r=>r.request.operation==='scene.apply').length,0,'Condition drafts write nothing before Save');
  await c.click('Save',header2);await c.wait(()=>statusLine.textContent==='Saved'&&c.requests().slice(saveAt).some(r=>r.request.operation==='scene.saveDrafts'));await c.settle();
  const saved=c.requests().slice(saveAt).find(r=>r.request.operation==='scene.saveDrafts');
  c.assert.deepEqual(saved.request.payload.commands.map(command=>command.type),['updateConditionBranch','addConditionBranch']);
  const savedText=replaceOnce(c,replaceOnce(c,expected,'    if (trust < 5):\n','    if (trust < 6):\n'),'    if (trust < 6):\n        pass\n','    if (trust < 6):\n        pass\n    elif (mood == "late"):\n        pass\n');
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),savedText);c.assert.equal(row(c,header.id).dataset.beatDraft,'false');
  for(let i=0;i<2;i+=1){await c.history('undo');await c.settle();}
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected,'Two Undos reverse the two saved condition drafts');
 },
 [names[4]]:async c=>{
  let before=c.workspace(),s=scene(c),bytes=await c.snapshot(),original=c.sourceText(bytes,s.sourcePath);
  const inserted=s.beats.find(b=>b.payload.text==='Inserted branch café 雪');c.assert(inserted);const firstBody={type:'branch',...inserted.owner};
  reveal(c,inserted.id);const selectButton=row(c,inserted.id).querySelector('.story-track-beat');c.key(selectButton,'ArrowUp',{altKey:true});
  await c.wait(()=>c.lastMutation()?.request.payload.command.type==='moveStoryNode'&&c.lastMutation().response.ok);await c.settle();
  const moved=envelope(c,before,'moveStoryNode');c.assert.deepEqual(moved.expectedBody,firstBody);c.assert.deepEqual(moved.body,firstBody);
  original=replaceOnce(c,original,'        "Nested retained"\n        "Inserted branch café 雪"\n','        "Inserted branch café 雪"\n        "Nested retained"\n');c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),original);
  c.assert.deepEqual(scene(c).beats.find(b=>b.id===inserted.id).owner,inserted.owner);
  let branch=newHeaders(c).find(b=>!b.conditionalBranch.ordinal);const leaf=await addNarration(c,branch,'Movable subtree leaf');c.assert(leaf);authored.leafId=leaf.id;
  branch=newHeaders(c).find(b=>b.conditionalBranch.otherwise);const other=await addNarration(c,branch,'Other subtree branch');c.assert(other);authored.otherId=other.id;
  const block='    if (trust < 5):\n        "Movable subtree leaf"\n    else:\n        "Other subtree branch"\n';
  const filled=c.sourceText(await c.snapshot(),s.sourcePath);c.assert.equal(filled,replaceOnce(c,original,'    if (trust < 5):\n        pass\n    else:\n        pass\n',block));
  const groupMembers=scene(c).beats.filter(b=>b.conditionalBranch?.groupId===authored.groupId||b.owner?.groupId===authored.groupId).map(b=>b.id);
  const originalElse=headers(scene(c)).find(b=>b.conditionalBranch.otherwise&&b.conditionalBranch.groupId!==authored.groupId);c.assert(originalElse);
  // Move to opens the tree on the condition's place; the original Otherwise is a closed place in it.
  const moveDialog=()=>c.document.querySelector('.scene-workspace .story-move');
  before=c.workspace();await c.click('Move to…',await pick(c,authored.headerId));let form=moveDialog();c.assert(form);c.assert.equal(form.querySelector(`[data-node="${originalElse.id}"]`).getAttribute('aria-expanded'),'false');
  movePick(c,form,originalElse.id,'End of Otherwise');c.assert.match(form.querySelector('.story-summary').textContent,/· End of Otherwise$/);
  await applyOperation(c,form,'Move','moveStoryNode');let command=envelope(c,before,'moveStoryNode');c.assert.deepEqual(command.node,{type:'condition',groupId:authored.groupId});c.assert.deepEqual(command.expectedBody,{type:'root'});c.assert.deepEqual(command.body,bodyRef(originalElse));
  const indented=block.split('\n').map(line=>line?'    '+line:line).join('\n');const movedText=replaceOnce(c,replaceOnce(c,filled,block,''),'    else:\n        pass\n','    else:\n'+indented);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),movedText);c.assert.deepEqual(scene(c).beats.filter(b=>groupMembers.includes(b.id)).map(b=>b.id),groupMembers);
  c.assert.deepEqual(scene(c).beats.find(b=>b.id===authored.headerId).owner,{groupId:originalElse.conditionalBranch.groupId,branchId:originalElse.id});
  before=c.workspace();await c.click('Move to…',await pick(c,authored.headerId));form=moveDialog();
  movePick(c,form,'root',/^○Before \d+ Return$/);
  await applyOperation(c,form,'Move','moveStoryNode');command=envelope(c,before,'moveStoryNode');c.assert.deepEqual(command.expectedBody,bodyRef(originalElse));c.assert.deepEqual(command.body,{type:'root'});
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),filled);c.assert(!scene(c).beats.find(b=>b.id===authored.headerId).owner);
  c.assert(scene(c).beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===originalElse.id));unchangedOtherSources(c,bytes,await c.snapshot(),s.sourcePath);
 },
 [names[5]]:async c=>{
  let before=c.workspace(),s=scene(c),bytes=await c.snapshot(),original=c.sourceText(bytes,s.sourcePath);
  const block='    if (trust < 5):\n        "Movable subtree leaf"\n    else:\n        "Other subtree branch"\n';
  const opaqueBlock=replaceOnce(c,block,'        "Movable subtree leaf"\n','        "Movable subtree leaf"\n        python:\n            opaque_deleted = "kept"\n');
  const withOpaque=replaceOnce(c,original,block,opaqueBlock);await editSource(c,withOpaque);before=c.workspace();
  const members=scene(c).beats.filter(b=>b.owner?.groupId===authored.groupId&&!b.conditionalBranch&&!b.structuralPlaceholder);
  c.assert.equal(members.length,3);c.assert.equal(newHeaders(c).length,2);
  // The python: block and its deeper line are one Custom Code beat (B12).
  c.assert.deepEqual(members.map(b=>b.payload.type),['narration','customCode','narration']);
  c.assert.deepEqual(members.filter(b=>b.payload.type==='narration').map(b=>b.payload.text),['Movable subtree leaf','Other subtree branch']);
  const opaque=members.filter(b=>b.payload.type==='customCode');c.assert.equal(opaque.length,1);
  for(const beat of opaque){c.assert(beat.protected);c.assert.deepEqual(beat.owner,members[0].owner);}
  const acceptedBytes=Buffer.from(withOpaque,'utf8');
  c.assert.deepEqual(opaque.map(b=>acceptedBytes.subarray(b.byteStart,b.byteEnd).toString('utf8')),['        python:\n            opaque_deleted = "kept"\n']);
  c.assert.match((await group(c,authored.groupId)).querySelector('.story-condition-summary').textContent,/2 branches \/ 3 Beats/);
  await c.click('Delete condition',await group(c,authored.groupId));let form=panel(c,'Delete entire condition');
  c.assert.match(form.textContent,/all 3 contained Beats/);c.assert(form.textContent.includes(`all ${members.length} contained Beats`));await applyOperation(c,form,'Delete entire condition','removeStoryNode');
  c.assert.deepEqual(envelope(c,before,'removeStoryNode').node,{type:'condition',groupId:authored.groupId});c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,withOpaque,opaqueBlock,''));c.assert.equal(newHeaders(c).length,0);
  await c.history('undo');await c.settle();c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),withOpaque);
  await editSource(c,original);
  before=c.workspace();const leaf=scene(c).beats.find(b=>b.id===authored.leafId);c.assert(leaf);await c.click('Delete',await pick(c,leaf.id));form=panel(c,'Delete Beat');await applyOperation(c,form,'Delete this Beat','removeStoryNode');
  c.assert.deepEqual(envelope(c,before,'removeStoryNode').expectedBody,{type:'branch',...leaf.owner});c.assert(scene(c).beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===leaf.owner.branchId));
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,original,'        "Movable subtree leaf"\n','        pass\n'));
  await c.history('undo');await c.settle();c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),original);
  before=c.workspace();const selected=newHeaders(c).find(b=>b.conditionalBranch.otherwise);await c.click('Unwrap…',await group(c,authored.groupId));form=panel(c,'Unwrap one branch');
  c.enter(form.querySelector('[aria-label="Branch to keep"]'),selected.id,'change');c.assert.match(form.textContent,/Remove the condition and all other branches/);await applyOperation(c,form,'Unwrap selected branch','unwrapCondition');
  const command=envelope(c,before,'unwrapCondition');c.assert.equal(command.branchId,selected.id);c.assert.equal(command.groupId,authored.groupId);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,original,block,'    "Other subtree branch"\n'));
  c.assert.equal(newHeaders(c).length,0);c.assert(!scene(c).beats.some(b=>b.id===authored.leafId));c.assert(!scene(c).beats.find(b=>b.id===authored.otherId).owner);
  unchangedOtherSources(c,bytes,await c.snapshot(),s.sourcePath);
 },
 [names[6]]:async c=>{
  const bytes=await c.snapshot(),path=scene(c).sourcePath,accepted=c.sourceText(bytes,path);
  const terminalFixture=replaceOnce(c,replaceOnce(c,accepted,'        "Nested retained"\n','        $ trust = 9\n        "Nested retained"\n        return\n        $ trust = 42\n        "After branch terminal"\n'),'    "Nothing available"\n','    $ trust = 77\n    "Nothing available"\n');
  await editSource(c,terminalFixture);const s=scene(c),from=c.requests().length,choice=s.beats.find(b=>b.payload.type==='choice'),root=headers(s).find(b=>b.conditionalBranch.ordinal===0);
  const terminalBytes=await c.snapshot();
  const effects=()=>c.document.querySelector('.story-effects').textContent,stage=()=>c.document.querySelector('.preview-canvas').textContent;
  const segment=id=>[...c.document.querySelectorAll('.story-branch-segment')].find(item=>item.dataset.branchId===id);
  await select(c,choice.id);const pending=card(c,choice.id).querySelector('[aria-label="Choice option text"]');c.enter(pending,'Preview preserves unfinished input');
  // With the condition closed, the stage shows the selected Choice and leaves the condition's state unknown.
  c.assert.equal(segment(root.id).ariaPressed,'false');
  previewBoundary(c,choice);c.assert(!stage().includes('Caller resumed'));c.assert(!stage().includes('Nothing available'));
  for(const value of [9,42,77])c.assert(!effects().includes(`Variable trust = ${value}`));c.assert.equal(c.document.querySelector('.preview-empty').textContent,'Background unknown after code or unevaluated flow');
  // Opening If in the Branch path follows that branch to its Return. The Choice draft stays with its beat.
  openBranch(c,root.id);await c.settle();const branchReturn=s.beats.find(b=>b.payload.type==='return'&&b.owner?.branchId===root.id);await pick(c,branchReturn.id);
  c.assert.equal(c.document.querySelector('.preview-overlay').textContent,'Return to caller or main menu');previewBoundary(c,branchReturn);
  c.assert(effects().includes('Variable trust = 9'));c.assert(!effects().includes('Variable trust = 42'));
  c.assert(!stage().includes('After branch terminal'));c.assert(!stage().includes('Caller resumed'));
  const otherwise=headers(s).find(b=>b.conditionalBranch.groupId===root.conditionalBranch.groupId&&b.conditionalBranch.otherwise);openBranch(c,otherwise.id);await c.settle();await pick(c,choice.id);
  c.assert.equal(card(c,choice.id).querySelector('[aria-label="Choice option text"]'),pending);c.assert.equal(pending.value,'Preview preserves unfinished input');c.assert(!pending.disabled);
  // Only the game's choice menu overlays the stage. Its buttons go to the option in the editor and write nothing.
  const menu=c.document.querySelector('.story-game-choices');c.assert.equal(menu?.parentElement,c.document.querySelector('.preview-canvas'));
  menu.querySelector('.story-game-choice').click();c.assert.equal(c.document.activeElement,pending);previewBoundary(c,choice);
  c.assert(!effects().includes('Variable trust = 77'));c.assert(!stage().includes('Nothing available'));
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(terminalBytes));c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  await c.click('Cancel',card(c,choice.id));
  // A root Return before the menu independently proves that later root effects stay invisible.
  const rootTerminalFixture=replaceOnce(c,accepted,'    menu:\n','    return\n    "After root terminal"\n    menu:\n');
  await editSource(c,rootTerminalFixture);const rootNow=headers(scene(c)).find(b=>b.id===root.id);c.assert(rootNow);
  openBranch(c,otherwise.id);await c.settle();const rootReturn=scene(c).beats.find(b=>b.payload.type==='return'&&!b.owner);await pick(c,rootReturn.id);
  c.assert.equal(c.document.querySelector('.preview-overlay').textContent,'Return to caller or main menu');previewBoundary(c,rootReturn);
  c.assert(!stage().includes('After root terminal'));c.assert(!stage().includes('Ready route'));
  c.assert.equal(c.sourceText(await c.snapshot(),path),rootTerminalFixture);await editSource(c,accepted);await openBranches(c,s.id);
  const flow=await c.call('flow.list',{refresh:true});const call=flow.edges.find(e=>e.sceneId===s.id&&e.kind==='call');c.assert(call?.location);
  await c.wait(()=>[...c.document.querySelector('[aria-label="Selected route"]').options].some(o=>o.value===call.id));c.enter(c.document.querySelector('[aria-label="Selected route"]'),call.id,'change');c.assert.match(c.document.querySelector('.branches-workspace').textContent,/Call Scene returns to its continuation/);
  await c.click('Open Scene');await c.wait(()=>findRow(c,call.beatId)?.querySelector('.story-track-beat')?.dataset.selected==='true'&&card(c,call.beatId));await c.settle();
  c.assert.equal(shownScene(c),s.id);c.assert.equal(scene(c).beats.find(b=>b.id===call.beatId).payload.type,'call');
  await openBranches(c,s.id,call.id);
  await c.click('Open continuation in Story');await c.wait(()=>findRow(c,call.continuation.beatId)?.querySelector('.story-track-beat')?.dataset.selected==='true'&&card(c,call.continuation.beatId));await c.settle();c.assert.equal(scene(c).beats.find(b=>b.id===call.continuation.beatId).payload.text,'Caller resumed');
  await openBranches(c,s.id);
  const bodyEdge=flow.edges.find(e=>e.sceneId===s.id&&e.destination.kind==='body'&&e.destination.owner);c.assert(bodyEdge?.destination.location);
  c.enter(c.document.querySelector('[aria-label="Selected route"]'),bodyEdge.id,'change');await c.click('Open destination body in Story');
  const body=bodyEdge.destination,targetId=body.beatId??body.owner.branchId;
  // Story selects the destination body's first Tracks beat, or the body's own slot when it is empty.
  const inBody=()=>{const shown=c.document.querySelector('.scene-workspace .story-editor')?.dataset.editorFor,beat=shownBeats(c).find(b=>b.id===shown);return !!beat&&(beat.owner?.branchId===body.owner.branchId||beat.id===body.owner.branchId);};
  await c.wait(inBody);await c.settle();
  const target=scene(c).beats.find(b=>b.id===targetId);c.assert(target);c.assert(target.owner?.branchId===body.owner.branchId||target.id===body.owner.branchId);c.assert.equal(scene(c).sourceRevision,body.location.revision);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(bytes));await openBranches(c,s.id,call.id);
  const at=c.requests().length,sourceOwner=c.session();await c.click('View origin in Source');await c.wait(()=>c.session()===sourceOwner&&successfulOpen(c,at,call.location.path,sourceOwner)&&mountedSourceEditor(c,call.location.path));await c.settle();
  const request=c.requests().slice(at).find(r=>r.request.operation==='source.open'&&r.request.payload.expectedRevision);c.assert(request);
  c.assert.equal(request.request.payload.path,call.location.path);c.assert.equal(request.request.payload.expectedRevision,call.location.revision);c.assert.equal(request.request.payload.byteStart,call.location.byteStart);c.assert.equal(request.request.payload.byteEnd,call.location.byteEnd);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(bytes));await goStory(c);
 },
 [names[7]]:async c=>{
  const s=scene(c),choice=s.beats.find(b=>b.payload.type==='choice');const accepted=await c.snapshot();const from=c.requests().length;
  await select(c,choice.id);let beatEditor=card(c,choice.id);const input=beatEditor.querySelector('[aria-label="Choice option text"]');c.enter(input,'Cancelled intent');
  const draftTree=c.workspace().scenes.map(item=>[item.id,item.displayName]);const draftControls=treeControls(c);for(const control of draftControls){c.assert(!control.disabled);control.click();await c.settle();
   // A beat draft does not block tree forms; cancelling one leaves the draft untouched.
   const inline=c.document.querySelector('.tree-inline');if(inline){await c.click('Cancel',inline);await c.settle();}
   c.assert.equal(input.value,'Cancelled intent');c.assert(input.isConnected);}
  c.assert.deepEqual(c.workspace().scenes.map(item=>[item.id,item.displayName]),draftTree);
  await c.click('Cancel',beatEditor);c.assert.deepEqual(await c.snapshot(),accepted);c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  // Hold only a validated response to one actual UI request, after Host dispatch, to inspect pending locks.
  await select(c,choice.id);beatEditor=card(c,choice.id);const pendingCaption=beatEditor.querySelector('[aria-label="Choice option text"]');c.enter(pendingCaption,'Pending tree guard intent');
  const beforePending=c.workspace(),treeBefore=beforePending.scenes.map(item=>[item.id,item.displayName]);const controls=treeControls(c),at=c.requests().length;
  await c.pendingWrite('updateBodyBeat',()=>c.click('Commit Beat',beatEditor),async()=>{
   c.assert(pendingCaption.disabled&&pendingCaption.isConnected);c.assert.equal(pendingCaption.value,'Pending tree guard intent');
   for(const control of controls){c.assert(control.disabled,'Tree authoring controls must lock during the actual pending write');control.click();}
   c.assert(!c.document.querySelector('.tree-inline'));c.assert.deepEqual(c.workspace().scenes.map(item=>[item.id,item.displayName]),treeBefore);
  });
  await c.wait(()=>c.lastMutation()?.response.ok&&!card(c,choice.id)?.querySelector('[data-unsubmitted="true"]'));await c.settle();envelope(c,beforePending,'updateBodyBeat');
  c.assert.equal(c.requests().slice(at).filter(r=>r.request.operation==='scene.apply').length,1);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,c.sourceText(accepted,s.sourcePath),'"Ready route" if (trust >= 6):','"Pending tree guard intent" if (trust >= 6):'));
  await c.history('undo');await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));
  const editor=await openSourceEditor(c,s.sourcePath);
  const retained=editor.value+'# retained unaccepted Source draft\n';c.enter(editor,retained);
  await c.wait(async()=> (await source(c)()).text===retained);const draft=await source(c)();c.assert(draft.draftVersion>0);c.assert.equal(draft.baseRevision,s.sourceRevision);
  await goStory(c);
  await select(c,choice.id);beatEditor=card(c,choice.id);const pending=beatEditor.querySelector('[aria-label="Choice option text"]');c.enter(pending,'Retained intent after Source refusal');
  const beforeDirtyRefusal=await c.snapshot();await c.click('Commit Beat',beatEditor);await c.wait(()=>c.lastMutation()&&!c.lastMutation().response.ok&&!pending.disabled);
  c.assert.equal(c.lastMutation().response.error.code,'DIRTY_SOURCE');c.assert.deepEqual(await c.snapshot(),beforeDirtyRefusal,'Dirty Source refusal must preserve all source, maps and project metadata');
  c.assert.equal(pending.value,'Retained intent after Source refusal');c.assert(pending.isConnected);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));c.assert.equal((await source(c)()).text,retained);
  await c.click('Cancel',beatEditor);await openSourceEditor(c,s.sourcePath);
  await c.click('Discard Draft',c.document.querySelector('.source-workspace'));
  const modal=c.document.querySelector('.source-discard-confirmation');c.assert(modal);
  const discardAt=c.requests().length;await c.click('Discard Draft',modal);await c.wait(()=>!c.document.querySelector('.source-discard-confirmation')&&mountedSourceEditor(c,s.sourcePath)&&c.requests().slice(discardAt).some(r=>r.request.operation==='source.discard'&&r.request.payload.path===s.sourcePath&&r.responseOk));await c.settle();c.assert.equal((await c.call('source.list')).dirtyCount,0);
  await goStory(c);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));
 },
 [names[8]]:async c=>{
  const before=c.workspace(),s=scene(c),choice=s.beats.find(b=>b.payload.type==='choice');const accepted=await c.snapshot();
  await select(c,choice.id);const beatEditor=card(c,choice.id);const input=beatEditor.querySelector('[aria-label="Choice option text"]');c.enter(input,'External refusal keeps this intent');
  const external=await c.raw({driver:'externalAppend',path:s.sourcePath});const externalSnapshot=await c.snapshot();
  c.assert.deepEqual(externalSnapshot[s.sourcePath],external.externalBytes);
  await c.click('Commit Beat',beatEditor);await c.wait(()=>c.lastMutation()&&!c.lastMutation().response.ok&&!input.disabled);
  const refused=c.lastMutation();c.assert.equal(refused.request.payload.expectedProjectRevision,before.projectRevision);
  c.assert.equal(refused.request.payload.expectedSourceMapRevision,before.sourceMapRevision);
  c.assert.equal(refused.request.payload.command.expectedSourceRevision,s.sourceRevision);
  c.assert.equal(refused.response.error.code,'SOURCE_CONFLICT');c.assert.equal(input.value,'External refusal keeps this intent');c.assert(input.isConnected);
  c.assert.deepEqual(await c.snapshot(),externalSnapshot,'Refusal must preserve exact external bytes and all project metadata');
  await c.click('Cancel',beatEditor);const editor=await openSourceEditor(c,s.sourcePath);c.assert(editor.value.includes('# ordinary external Story writer'));
  const saveAt=c.requests().length;await c.click('Save Source',c.document.querySelector('.app-header'));await c.wait(()=>mountedSourceEditor(c,s.sourcePath)&&c.requests().slice(saveAt).some(r=>r.request.operation==='project.flush'&&r.request.payload.sessionId===c.session()&&r.responseOk));await c.settle();
  await goStory(c);
  const refreshed=scene(c).beats.find(b=>b.id===choice.id);c.assert(refreshed);await select(c,refreshed.id);
  const freshCard=card(c,refreshed.id);c.enter(freshCard.querySelector('[aria-label="Choice option text"]'),'Fresh ordinary external revision');
  await c.click('Commit Beat',freshCard);await c.wait(()=>c.lastMutation()?.response.ok&&!card(c,refreshed.id)?.querySelector('[data-unsubmitted="true"]'));
  c.assert(c.sourceText(await c.snapshot(),s.sourcePath).includes('# ordinary external Story writer'));
  unchangedOtherSources(c,accepted,await c.snapshot(),s.sourcePath);
 },
 [names[9]]:async c=>{
  const entry=scene(c),called=c.workspace().scenes.find(x=>x.displayName==='Called scene');c.assert(called);
  const narration=id=>c.workspace().scenes.find(x=>x.id===id).beats.find(b=>b.payload.type==='narration'&&!b.owner);
  const a=narration(entry.id),b=narration(called.id);c.assert(a&&b);
  const accepted=await c.snapshot(),from=c.requests().length;
  const writes=()=>c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length;
  const openScene=async id=>{const name=c.workspace().scenes.find(x=>x.id===id).displayName;
   [...c.document.querySelectorAll('.tree-scene-open')].find(x=>x.textContent===name).click();
   await c.wait(()=>shownScene(c)===id&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();};
  const type=async(id,text)=>{await select(c,id);c.enter(card(c,id)?.querySelector('textarea'),text);await c.settle();};
  // Two drafts in two scenes. Navigation between beats, scenes and workspaces never writes.
  // Selecting another beat leaves A's draft marked in Tracks.
  await type(a.id,'Draft A kept');await pick(c,c.workspace().scenes.find(x=>x.id===entry.id).beats.find(x=>x.payload.type==='choice').id);await c.settle();
  c.assert.equal(row(c,a.id).dataset.beatDraft,'true');c.assert(!card(c,a.id)?.querySelector('textarea'));
  await openScene(called.id);await type(b.id,'Draft B kept');
  const owner=c.session();await c.click('Source');await c.wait(()=>c.session()===owner&&c.document.querySelector('.source-workspace'));await c.settle();
  await goStory(c,called.id);c.assert.equal(writes(),0);c.assert.deepEqual(await c.snapshot(),accepted);
  await select(c,b.id);c.assert.equal(card(c,b.id)?.querySelector('textarea').value,'Draft B kept');
  // Commit accepts only the selected beat; the other scene's draft stays unsaved.
  await c.click('Commit Beat',card(c,b.id));await c.wait(()=>c.lastMutation()?.response.ok&&!card(c,b.id)?.querySelector('[data-unsubmitted="true"]'));await c.settle();
  c.assert.equal(writes(),1);const committed=await c.snapshot();
  c.assert(c.sourceText(committed,called.sourcePath).includes('Draft B kept'));
  c.assert.equal(c.sourceText(committed,entry.sourcePath),c.sourceText(accepted,entry.sourcePath));unchangedOtherSources(c,accepted,committed,called.sourcePath);
  // Cancel removes the remaining draft without a write.
  await openScene(entry.id);c.assert.equal(row(c,a.id).dataset.beatDraft,'true');
  await select(c,a.id);c.assert.equal(card(c,a.id)?.querySelector('textarea').value,'Draft A kept');
  await c.click('Cancel',card(c,a.id));await c.settle();
  c.assert.equal(row(c,a.id).dataset.beatDraft,'false');c.assert.equal(writes(),1);c.assert.deepEqual(await c.snapshot(),committed);
 },
 [names[10]]:async c=>{
  const entry=scene(c),called=c.workspace().scenes.find(x=>x.displayName==='Called scene');c.assert(called);
  const narration=id=>c.workspace().scenes.find(x=>x.id===id).beats.find(b=>b.payload.type==='narration'&&!b.owner);
  const a=narration(entry.id),b=narration(called.id),choice=entry.beats.find(x=>x.payload.type==='choice'),anchor=entry.beats.find(x=>x.payload.text==='Nothing available');c.assert(a&&b&&choice&&anchor);
  const from=c.requests().length,ops=name=>c.requests().slice(from).filter(r=>r.request.operation===name);
  const header=c.document.querySelector('.app-header'),statusLine=c.document.querySelector('#app-status'),status=()=>statusLine.textContent;
  const links=()=>[...c.document.querySelectorAll('#app-status .status-link')].map(x=>x.getAttribute('aria-label'));
  const sceneMark=name=>[...c.document.querySelectorAll('.tree-scene-row')].find(x=>x.querySelector('.tree-scene-open')?.textContent===name)?.dataset.saveRefused;
  const newBeat=()=>c.document.querySelector('.scene-workspace .new-beat');
  const optionText=()=>card(c,choice.id)?.querySelector('[aria-label="Choice option text"]');
  const openScene=async id=>{const name=c.workspace().scenes.find(x=>x.id===id).displayName;
   [...c.document.querySelectorAll('.tree-scene-open')].find(x=>x.textContent===name).click();
   await c.wait(()=>shownScene(c)===id&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();};
  const type=async(id,text)=>{await select(c,id);c.enter(card(c,id)?.querySelector('textarea'),text);await c.settle();};
  const addBeat=async kind=>{await c.click('+ Add beat',c.document.querySelector('.scene-workspace .scene-history'));await pickIn(c,kind);await c.settle();return newBeat();};
  const save=async()=>{const at=c.requests().length,before=status();await c.click('Save',header);
   await c.wait(()=>!c.document.querySelector('.scene-workspace [disabled].story-track-beat')&&status()!==before&&/^(Saved|Nothing saved|Story changed)/.test(status()));await c.settle();return c.requests().slice(at);};
  // Four drafts in two scenes. A Choice update and a new Choice have no option text.
  await type(a.id,'Story Save A');await select(c,choice.id);c.enter(optionText(),'');
  await openScene(called.id);await type(b.id,'Story Save B');await addBeat('choice');
  const accepted=await c.snapshot();
  const refused=await save();
  c.assert(!refused.some(r=>r.request.operation==='scene.saveDrafts'),'An invalid draft must stop Story Save before any request');
  c.assert.deepEqual(c.hashes(await c.snapshot()),c.hashes(accepted),'A refused Story Save writes nothing');
  c.assert.equal(status(),`Nothing saved. 2 of 4 drafts need changes:${entry.displayName} 1Called scene 1`);
  c.assert.deepEqual(links(),[`${entry.displayName}, 1 to fix`,'Called scene, 1 to fix']);
  c.assert.equal(shownScene(c),entry.id,'Story Save reveals the first failing draft in its own scene');
  c.assert.equal(row(c,choice.id).dataset.saveRefused,'true');c.assert.equal(row(c,a.id).dataset.saveRefused,undefined);c.assert.equal(row(c,a.id).dataset.beatDraft,'true');
  c.assert.match(card(c,choice.id)?.querySelector('.story-save-reason')?.textContent??'',/Choice text is required/);
  c.assert.deepEqual([sceneMark(entry.displayName),sceneMark('Called scene')],['true','true']);
  // A scene link opens that scene's failing draft. Cancelling it lowers the counts and clears its scene's mark.
  await c.click('Called scene, 1 to fix',statusLine);await c.wait(()=>shownScene(c)===called.id&&newBeat());
  c.assert.equal(newBeat().dataset.saveRefused,'true');
  await c.click('Cancel',newBeat());await c.settle();
  c.assert.equal(status(),`Nothing saved. 1 of 3 drafts need changes:${entry.displayName} 1`);c.assert.equal(sceneMark('Called scene'),undefined);
  // Fixing the last failing draft clears every mark.
  await c.click(`${entry.displayName}, 1 to fix`,statusLine);await c.wait(()=>shownScene(c)===entry.id&&optionText());
  c.enter(optionText(),choice.payload.options[0].text);await c.settle();
  c.assert.equal(status(),'3 unsaved beat drafts. Ready to save.');c.assert.equal(row(c,choice.id).dataset.saveRefused,undefined);c.assert.equal(sceneMark(entry.displayName),undefined);
  // An ordinary external edit makes the request stale: core refuses with no writes and Story refreshes.
  const external=await c.raw({driver:'externalAppend',path:entry.sourcePath});const externalSnapshot=await c.snapshot();
  c.assert.deepEqual(externalSnapshot[entry.sourcePath],external.externalBytes);
  const stale=await save(),staleSave=stale.find(r=>r.request.operation==='scene.saveDrafts');
  // The refresh may record the external revision in the source map; scripts stay as the external writer left them.
  c.assert.equal(staleSave?.errorCode,'SOURCE_CONFLICT');c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(externalSnapshot)),'A stale Story Save writes nothing');
  c.assert(stale.some(r=>r.request.operation==='scene.list'&&r.responseOk),'A stale refusal refreshes Story');
  c.assert.equal(status(),"Story changed in source and was refreshed. Nothing saved. Save again.");c.assert.equal(ops('project.flush').length,0);
  // A new beat placed before a beat that source then removes conflicts, marked like any failing draft.
  // The Choice column's + adds right after it, before "Nothing available".
  row(c,choice.id).querySelector(`[data-beat-opener="after:${choice.id}"]`).click();await pickIn(c,'narration');const placed=newBeat();
  c.assert.equal(placed.querySelector('.story-where dd').textContent,`Before ${row(c,anchor.id).querySelector('.story-beat-number').textContent} Narration`);c.enter(placed.querySelector('textarea'),'Story Save placed');await c.settle();
  await c.raw({driver:'externalRemove',path:entry.sourcePath,remove:'    "Nothing available"\n'});const removed=await c.snapshot();
  const conflict=await save();
  c.assert.equal(conflict.find(r=>r.request.operation==='scene.saveDrafts')?.errorCode,'SOURCE_CONFLICT');
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(removed)),'A conflicting Story Save writes nothing');
  c.assert.equal(status(),`Story changed in source and was refreshed. Nothing saved. 1 of 4 drafts need changes:${entry.displayName} 1`);
  c.assert.equal(newBeat().dataset.saveRefused,'true');
  c.assert.equal(newBeat().querySelector('.story-save-reason')?.textContent,"This beat's place changed in source after the draft began. Draft retained.");
  await c.click('Cancel',newBeat());await c.settle();c.assert.equal(status(),'3 unsaved beat drafts. Ready to save.');
  // The next Save accepts the three drafts in one request and clears the refusal.
  const saved=await save(),request=saved.find(r=>r.request.operation==='scene.saveDrafts');
  c.assert(request?.responseOk);c.assert.equal(request.request.payload.commands.length,3);c.assert.equal(request.request.payload.drafts.length,3);c.assert.equal(status(),'Saved');
  c.assert.equal(c.document.querySelector('[data-save-refused]'),null);c.assert.deepEqual(links(),[]);
  c.assert.equal(ops('scene.apply').length,0);c.assert.equal(ops('project.flush').length,0);
  const after=await c.snapshot();
  c.assert.equal(c.sourceText(after,entry.sourcePath),replaceOnce(c,c.sourceText(removed,entry.sourcePath),`"${a.payload.text}"`,'"Story Save A"'));
  c.assert.equal(c.sourceText(after,called.sourcePath),replaceOnce(c,c.sourceText(accepted,called.sourcePath),`"${b.payload.text}"`,'"Story Save B"'));
  const others=snapshot=>Object.fromEntries(Object.entries(c.hashes(c.rpy(snapshot))).filter(([p])=>![entry.sourcePath,called.sourcePath].includes(p)));
  c.assert.deepEqual(others(after),others(removed));
  for(const id of [a.id,b.id])c.assert(!c.document.querySelector(`[data-beat-id="${id}"][data-beat-draft="true"]`));
  // One entry per beat whose bytes changed, the most recently edited on top. The Choice
  // draft was set back to its saved text, so it adds none.
  const undoName=()=>c.document.querySelector('.app-header [data-history="undo"]').getAttribute('aria-label');
  c.assert.equal(undoName(),'Undo narration edit in Called scene');
  await c.history('undo');await c.settle();const undone=await c.snapshot();
  c.assert.equal(c.sourceText(undone,called.sourcePath),c.sourceText(accepted,called.sourcePath),'Undo reverses B first');
  c.assert.equal(c.sourceText(undone,entry.sourcePath),c.sourceText(after,entry.sourcePath),'A stays saved');
  c.assert.equal(undoName(),`Undo narration edit in ${entry.displayName}`);
  await c.history('undo');await c.settle();
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(removed)),'Two Undos revert the Story Save');
  // As the last case, the harness then reopens the project and checks these accepted bytes.
  for(const direction of ['redo','redo']){await c.history(direction);await c.settle();}
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(after)));
 },
 [names[11]]:async c=>{
  const entry=scene(c),byName=name=>c.workspace().scenes.find(x=>x.displayName===name);
  const called=byName('Called scene'),high=byName('High ending'),low=byName('Low ending');c.assert(called&&high&&low);
  const narration=id=>c.workspace().scenes.find(x=>x.id===id).beats.find(b=>b.payload.type==='narration'&&!b.owner);
  // A and L conflict, H leaves source, and B only sees an unrelated change in its file.
  const a=narration(entry.id),b=narration(called.id),h=narration(high.id),l=narration(low.id);c.assert(a&&b&&h&&l);
  const from=c.requests().length,ops=name=>c.requests().slice(from).filter(r=>r.request.operation===name);
  // Leaving Story rebuilds the shell, so the header and status line are read when used.
  const header=()=>c.document.querySelector('.app-header'),status=()=>c.document.querySelector('#app-status').textContent;
  const undoName=()=>header().querySelector('[data-history="undo"]').getAttribute('aria-label');
  const openScene=async id=>{const name=c.workspace().scenes.find(x=>x.id===id).displayName;
   [...c.document.querySelectorAll('.tree-scene-open')].find(x=>x.textContent===name).click();
   await c.wait(()=>shownScene(c)===id&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();};
  const open=async id=>{if(!card(c,id))await select(c,id);return card(c,id);};
  const type=async(id,text)=>{c.enter((await open(id)).querySelector('textarea'),text);await c.settle();};
  // Story reads source again when the author comes back from another workspace.
  const refresh=async()=>{const shown=shownScene(c),owner=c.session();await c.click('Branches');await c.wait(()=>c.session()===owner&&c.document.querySelector('.branches-workspace'));await c.settle();await goStory(c,shown);};
  const lost=()=>c.document.querySelector('.scene-workspace .story-editor > [data-beat-draft-key]');
  // A closed menu's options are not shown.
  const buttons=scope=>[...scope.querySelectorAll('button')].filter(x=>!x.hidden&&!x.closest('[hidden]')&&!x.closest('details:not([open]) > :not(summary)')).map(x=>x.textContent);
  for(const [id,text] of [[a.id,'Conflict draft A'],[b.id,'Other draft B'],[h.id,'Lost draft H'],[l.id,'Discarded draft L']]){
   await openScene(c.workspace().scenes.find(x=>x.beats.some(y=>y.id===id)).id);await type(id,text);}
  // Ordinary external edits. Source has not opened the Called, High or Low files in this session (#168).
  await c.raw({driver:'externalReplace',path:entry.sourcePath,remove:`"${a.payload.text}"`,insert:'"Source edit one"'});
  await c.raw({driver:'externalRemove',path:high.sourcePath,remove:`    "${h.payload.text}"\n`});
  await c.raw({driver:'externalReplace',path:low.sourcePath,remove:`"${l.payload.text}"`,insert:'"Source L changed"'});
  await c.raw({driver:'externalAppend',path:called.sourcePath});
  // The refresh records the external revisions in project metadata; scripts stay as the writer left them.
  const changed=await c.snapshot();await refresh();
  // Conflicts are marked quietly. The unrelated change leaves B as an ordinary draft with Commit.
  await openScene(called.id);c.assert.equal(row(c,b.id).dataset.beatConflict,undefined);c.assert.equal(row(c,b.id).dataset.beatDraft,'true');
  c.assert.equal((await open(b.id)).querySelector('.story-conflict'),null);c.assert.deepEqual(buttons(card(c,b.id)?.querySelector('.expanded-beat > .row-actions')),['Cancel','Commit Beat']);
  await openScene(entry.id);c.assert.equal(row(c,a.id).dataset.beatConflict,'true');c.assert.equal(card(c,a.id)?.querySelector('.story-conflict')??null,null,'A conflict waits until the author returns to the beat');
  c.assert(!/conflict/i.test(status()),'A conflict does not prompt');
  // Story Save reveals the first conflict and saves none of the drafts.
  const at=c.requests().length,before=status();await c.click('Save',header());
  await c.wait(()=>status()!==before&&/^Nothing saved/.test(status()));await c.settle();
  c.assert(!c.requests().slice(at).some(r=>r.request.operation==='scene.saveDrafts'),'A conflict stops Story Save before any request');
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(changed)),'A refused Story Save writes nothing');
  c.assert.equal(status(),`Nothing saved. 3 of 4 drafts need changes:${entry.displayName} 1High ending 1Low ending 1`);
  c.assert.equal(shownScene(c),entry.id);const editorA=card(c,a.id);c.assert(editorA,'Save reveals A in the editor');c.assert.equal(row(c,a.id).dataset.saveRefused,'true');
  c.assert.equal(editorA.querySelector('.story-conflict > strong')?.textContent,'Conflict with source');
  c.assert.equal(editorA.querySelector('.story-conflict-source')?.textContent,'Source edit one');c.assert.equal(editorA.querySelector('.story-save-reason'),null);
  c.assert.equal(c.labelled('Your draft',editorA).value,'Conflict draft A');
  c.assert.deepEqual(buttons(editorA.querySelector('.expanded-beat')).slice(-2),['Discard draft','Override source'],'Discard draft and Override source sit together below the draft');
  // A draft whose beat left source shows the comparison with no source text, and only Discard draft.
  await openScene(high.id);c.assert(lost());c.assert.equal(lost().querySelector('textarea').value,'Lost draft H');
  c.assert.equal(lost().querySelector('.story-conflict > p').textContent,'This beat is no longer in source.');c.assert.deepEqual(buttons(lost()),['Discard draft']);
  await c.click('Discard draft',lost());await c.settle();c.assert.equal(lost(),null);
  c.assert.equal(undoName(),'Undo discard of narration draft in High ending');
  // Discard draft keeps source and removes only that draft. Undo brings it back with its comparison; neither writes.
  await openScene(low.id);const lowCard=await open(l.id);c.assert.equal(lowCard.querySelector('.story-conflict-source').textContent,'Source L changed');
  // A valid conflicting draft still previews on the stage.
  await c.wait(()=>c.document.querySelector('.preview-overlay')?.textContent.includes('Discarded draft L'));
  await c.click('Discard draft',lowCard);await c.settle();
  c.assert.equal(row(c,l.id).dataset.beatDraft,'false');c.assert.equal(card(c,l.id)?.querySelector('textarea').value,'Source L changed','The beat stays open on source');
  c.assert.equal(undoName(),'Undo discard of narration draft in Low ending');
  await c.history('undo');await c.wait(()=>card(c,l.id)?.querySelector('textarea')?.value==='Discarded draft L');await c.settle();
  c.assert.equal(card(c,l.id)?.querySelector('.story-conflict-source').textContent,'Source L changed');c.assert.equal(row(c,l.id).dataset.beatConflict,'true');
  await c.history('redo');await c.wait(()=>findRow(c,l.id)?.dataset.beatDraft==='false');await c.settle();
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(changed)),'Discard draft and its Undo write nothing');
  // Override source refuses empty text and keeps the draft.
  await openScene(entry.id);const field=async()=>(await open(a.id)).querySelector('textarea');
  c.enter(await field(),'  ');await c.settle();const empty=c.requests().length;
  await c.click('Override source',card(c,a.id));await c.settle();
  c.assert.equal(c.requests().slice(empty).filter(r=>r.request.operation==='scene.apply').length,0);
  c.assert.equal(status(),'Enter text before overriding the source. Draft retained.');c.assert.equal((await field()).value,'  ');
  // A further source change refuses Override with no write, keeps the input and refreshes the comparison.
  c.enter(await field(),'Override A');await c.settle();
  const reviewed=c.workspace().scenes.find(x=>x.id===entry.id).sourceRevision;
  await c.raw({driver:'externalReplace',path:entry.sourcePath,remove:'"Source edit one"',insert:'"Source edit two"'});const twice=await c.snapshot();
  const staleAt=c.requests().length;await c.click('Override source',card(c,a.id));
  await c.wait(()=>status()==='Source changed. Review it, then choose again. Draft retained.');await c.settle();
  const stale=c.requests().slice(staleAt).find(r=>r.request.operation==='scene.apply');
  c.assert.equal(stale?.errorCode,'SOURCE_CONFLICT');c.assert.equal(stale.request.payload.command.expectedSourceRevision,reviewed,'Override uses the revision the author reviewed');
  c.assert.deepEqual(stale.request.payload.drafts?.length,1);
  c.assert(c.requests().slice(staleAt).some(r=>r.request.operation==='scene.list'&&r.responseOk));
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(twice)),'A stale Override writes nothing');
  c.assert.equal(card(c,a.id)?.querySelector('.story-conflict-source')?.textContent,'Source edit two');c.assert.equal((await field()).value,'Override A');
  // Override saves only this beat against the refreshed source. B stays an unsaved draft.
  const overrideAt=c.requests().length;await c.click('Override source',card(c,a.id));
  await c.wait(()=>c.requests().slice(overrideAt).some(r=>r.request.operation==='scene.apply'&&r.responseOk));await c.settle();
  const applied=c.requests().slice(overrideAt).filter(r=>r.request.operation==='scene.apply');
  c.assert.equal(applied.length,1);c.assert.equal(applied[0].request.payload.command.type,'updateBodyBeat');c.assert.equal(applied[0].request.payload.command.beatId,a.id);
  const overridden=await c.snapshot();
  c.assert.equal(c.sourceText(overridden,entry.sourcePath),replaceOnce(c,c.sourceText(twice,entry.sourcePath),'"Source edit two"','"Override A"'));
  unchangedOtherSources(c,twice,overridden,entry.sourcePath);
  c.assert.equal(row(c,a.id).dataset.beatDraft,'false');c.assert.equal(row(c,a.id).dataset.beatConflict,undefined);
  await openScene(called.id);c.assert.equal(row(c,b.id).dataset.beatDraft,'true');c.assert.equal((await open(b.id)).querySelector('textarea').value,'Other draft B');
  // Override is one edit: Undo restores the source it replaced, without the draft, and Redo applies it again.
  c.assert.equal(undoName(),`Undo narration edit in ${entry.displayName}`);
  await c.history('undo');await c.settle();c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(twice)));
  await c.wait(()=>shownScene(c)===entry.id&&findRow(c,a.id));c.assert.equal(row(c,a.id).dataset.beatDraft,'false');
  await c.history('redo');await c.settle();c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(overridden)));
  // Story Save then saves the remaining draft, so an accepted transaction ends the case.
  const saveAt=c.requests().length;await c.click('Save',header());
  await c.wait(()=>c.requests().slice(saveAt).some(r=>r.request.operation==='scene.saveDrafts'&&r.responseOk));await c.settle();
  c.assert(c.sourceText(await c.snapshot(),called.sourcePath).includes('"Other draft B"'));c.assert.equal(status(),'Saved');
  c.assert.equal(ops('project.flush').length,0);
 },
 [names[12]]:async c=>{
  // The last case ended with a Story Save, whose workspace the harness does not record; read it.
  await c.call('scene.list');
  const entry=scene(c),beats=entry.beats,header=()=>c.document.querySelector('.app-header'),status=()=>c.document.querySelector('#app-status').textContent;
  const nested=beats.find(b=>b.payload.type==='narration'&&b.payload.text==='Nested retained');c.assert(nested?.owner);
  const otherwise=beats.find(b=>b.conditionalBranch?.groupId===nested.owner.groupId&&b.conditionalBranch.otherwise);c.assert(otherwise);
  c.assert.equal(entry.bodies.find(b=>b.body.type==='branch'&&b.body.branchId===otherwise.id)?.nodes.length,0,'Otherwise starts empty');
  const choice=beats.find(b=>b.payload.type==='choice'&&!b.owner);c.assert(choice);
  const ifHeader=beats.find(b=>b.id===nested.owner.branchId),returnBeat=beats.find(b=>b.payload.type==='return'&&!b.owner);c.assert(ifHeader&&returnBeat);
  const opaque=beats.find(b=>b.protected&&!b.owner&&b.payload.type==='customCode'&&b.payload.source.includes('opaque_neighbor'));c.assert(opaque);
  const view=async name=>{await c.click(name,c.document.querySelector('.scene-workspace .story-view-switch'));
   await c.wait(()=>c.document.querySelector(`.scene-workspace .story-view-option[data-view="${name.toLowerCase()}"]`)?.getAttribute('aria-pressed')==='true');};
  const inReel=id=>!!row(c,id).closest('.story-reel'),newBeat=()=>c.document.querySelector('.scene-workspace .new-beat');
  const original=await c.snapshot();
  // Protected source selected in Reel keeps its explanation and its way to Source. Reel stays the view after Source.
  await view('Reel');const guarded=(await pick(c,opaque.id)).querySelector('.protected-code');c.assert(inReel(opaque.id)&&guarded);
  c.assert.equal(guarded.querySelector('p').textContent,opaque.sourceFallback??opaque.payload.reason);c.assert(guarded.querySelector('pre').textContent.includes('opaque_neighbor'));
  c.assert.equal(card(c,opaque.id).querySelector('textarea,input,select'),null,'Story offers no fields for protected source');
  await c.click('Edit in Source',guarded);await c.wait(()=>mountedSourceEditor(c,entry.sourcePath));await c.settle();
  await goStory(c);c.assert(c.document.querySelector('.scene-workspace .story-reel'),'Reel stays the view after Source');
  // The scene's Return ends it, so Reel offers no + after it.
  c.assert.equal(row(c,returnBeat.id).querySelector('.story-track-insert'),null,'Reel offers no + after a Return');
  // In Reel: edit a nested beat, empty a Choice option (invalid), and start the first beat of the empty Otherwise.
  await select(c,nested.id);c.assert(inReel(nested.id));previewBoundary(c,nested);
  c.enter(card(c,nested.id).querySelector('textarea'),'Nested from Reel');await c.settle();
  await select(c,choice.id);c.enter(card(c,choice.id).querySelector('[aria-label="Choice option text"]'),'');await c.settle();
  // A new beat started from a card's + in Reel cancels with no write; the other drafts stay.
  reveal(c,nested.id);const cancelAt=c.requests().length;row(c,nested.id).querySelector('.story-track-insert').click();await pickIn(c,'narration');
  c.enter(newBeat().querySelector('textarea'),'Cancelled in Reel');await c.settle();c.assert(c.document.querySelector('.scene-workspace .story-reel .story-track-pending'));
  await c.click('Cancel',newBeat());await c.wait(()=>!newBeat());await c.settle();
  c.assert.equal(c.document.querySelector('.scene-workspace .story-track-pending'),null);c.assert.deepEqual(await c.snapshot(),original);
  c.assert(!c.requests().slice(cancelAt).some(r=>r.request.operation==='scene.apply'));c.assert.equal(row(c,choice.id).dataset.beatDraft,'true');
  openBranch(c,otherwise.id);await c.click('+ Add a beat',row(c,otherwise.id));await pickIn(c,'narration');
  c.enter(newBeat().querySelector('textarea'),'Otherwise from Reel');await c.settle();
  // Switching views sends nothing, adds no history entry, and keeps the drafts, selection, open branch and new beat's place.
  const place=()=>{const node=c.document.querySelector('.scene-workspace .story-track-pending');return node&&[node.dataset.depth,node.dataset.arm,node.querySelector('.story-track-beat').dataset.selected];};
  const steps=await c.call('history.state'),at=c.requests().length,panel=newBeat(),inside=place();c.assert.deepEqual(inside?.slice(0,1).concat(inside?.[2]),['1','true']);
  await view('Tracks');c.assert.deepEqual(place(),inside);c.assert.equal(row(c,choice.id).dataset.beatDraft,'true');
  await view('Reel');c.assert.deepEqual(place(),inside);
  c.assert.equal(c.requests().length,at,'View switches send no request');c.assert.deepEqual(await c.call('history.state'),steps,'View switches add no history entry');
  c.assert.equal(newBeat(),panel);c.assert.equal(panel.querySelector('textarea').value,'Otherwise from Reel');c.assert.deepEqual(await c.snapshot(),original);
  // Add Beat in Reel inserts into Otherwise through the shared command.
  let before=c.workspace();await c.click('Add Beat',panel);await c.wait(()=>c.lastMutation()?.response.ok&&!newBeat());await c.settle();
  c.assert.deepEqual(envelope(c,before,'insertBodyBeat').body,bodyRef(otherwise));
  const slotted=await c.snapshot();
  c.assert.equal(c.sourceText(slotted,entry.sourcePath),replaceOnce(c,c.sourceText(original,entry.sourcePath),'    else:\n        pass\n','    else:\n        "Otherwise from Reel"\n'));
  unchangedOtherSources(c,original,slotted,entry.sourcePath);
  // The End of marker of the If branch adds its last beat, before the Else if.
  openBranch(c,ifHeader.id);const exit=c.document.querySelector(`.scene-workspace .story-reel .story-track-exit[data-branch-id="${ifHeader.id}"]`);c.assert(exit);
  await c.click(exit.querySelector('.story-track-end').getAttribute('aria-label'),exit);await pickIn(c,'narration');
  c.enter(newBeat().querySelector('textarea'),'End of If from Reel');await c.settle();
  before=c.workspace();await c.click('Add Beat',newBeat());await c.wait(()=>c.lastMutation()?.response.ok&&!newBeat());await c.settle();
  const ended=envelope(c,before,'insertBodyBeat');c.assert.deepEqual([ended.body,ended.position],[bodyRef(ifHeader),{type:'end'}]);
  const inserted=await c.snapshot();
  c.assert.equal(c.sourceText(inserted,entry.sourcePath),replaceOnce(c,c.sourceText(slotted,entry.sourcePath),'    elif trust == 4:\n','        "End of If from Reel"\n    elif trust == 4:\n'));
  // Story Save refuses the invalid draft and writes nothing. Reel shows why, and both drafts survive another switch.
  const refusedAt=c.requests().length,was=status();await c.click('Save',header());
  await c.wait(()=>status()!==was&&/^Nothing saved/.test(status()));await c.settle();
  c.assert(!c.requests().slice(refusedAt).some(r=>r.request.operation==='scene.saveDrafts'));c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(inserted));
  c.assert.equal(status(),`Nothing saved. 1 of 2 drafts need changes:${entry.displayName} 1`);
  c.assert(inReel(choice.id));
  await view('Tracks');await view('Reel');
  c.assert.equal(row(c,choice.id).dataset.saveRefused,'true');c.assert.equal(card(c,choice.id).querySelector('[aria-label="Choice option text"]').value,'','The invalid draft is retained');
  await c.click('Cancel',card(c,choice.id));await c.settle();c.assert.equal(row(c,choice.id).dataset.beatDraft,'false');
  // Commit in Reel saves the nested beat in its own branch.
  await select(c,nested.id);c.assert.equal(card(c,nested.id).querySelector('textarea').value,'Nested from Reel');
  before=c.workspace();await c.click('Commit Beat',card(c,nested.id));await c.wait(accepted(c,nested.id));await c.settle();
  c.assert.deepEqual(envelope(c,before,'updateBodyBeat').expectedBody,{type:'branch',...nested.owner});
  const committed=await c.snapshot();
  c.assert.equal(c.sourceText(committed,entry.sourcePath),replaceOnce(c,c.sourceText(inserted,entry.sourcePath),'"Nested retained"','"Nested from Reel"'));
  // Undo and Redo reach the same edit and keep Reel. The harness then reopens the project and checks these bytes.
  await c.history('undo');await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(inserted));
  await c.history('redo');await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(committed));
  c.assert(c.document.querySelector('.scene-workspace .story-reel'),'Undo and Redo keep the Reel view');
 },
 [names[13]]:async c=>{
  await c.call('scene.list');
  const entry=scene(c),beats=entry.beats,header=()=>c.document.querySelector('.app-header'),status=()=>c.document.querySelector('#app-status').textContent;
  const nested=beats.find(b=>b.payload.type==='narration'&&b.payload.text==='Nested from Reel');c.assert(nested?.owner);
  const ifHeader=beats.find(b=>b.id===nested.owner.branchId),choice=beats.find(b=>b.payload.type==='choice'&&!b.owner);c.assert(ifHeader&&choice);
  const workspace=()=>c.document.querySelector('.scene-workspace'),toggle=()=>workspace().querySelector('[data-writing-focus-toggle]');
  const newBeat=()=>c.document.querySelector('.scene-workspace .new-beat');
  const place=()=>{const node=c.document.querySelector('.scene-workspace .story-track-pending');return node&&[node.dataset.depth,node.dataset.arm,node.querySelector('.story-track-beat').dataset.selected];};
  await c.click('Tracks',workspace().querySelector('.story-view-switch'));
  const original=await c.snapshot();
  // Drafts before Writing focus: an invalid Choice option and nested typing with a caret inside it.
  await select(c,choice.id);c.enter(card(c,choice.id).querySelector('[aria-label="Choice option text"]'),'');await c.settle();
  await select(c,nested.id);const field=card(c,nested.id).querySelector('textarea');c.enter(field,'Nested in focus');await c.settle();field.setSelectionRange(3,6);
  const stage=workspace().querySelector('.story-stage-status').textContent;
  // Entering and leaving send nothing, add no history entry, and keep the editor, its focus and caret, the selection and the open branch.
  const steps=await c.call('history.state'),at=c.requests().length;
  const same=()=>{c.assert.equal(c.document.activeElement,field);c.assert.deepEqual([field.selectionStart,field.selectionEnd,field.value],[3,6,'Nested in focus']);
   c.assert.equal(card(c,nested.id)?.querySelector('textarea'),field);c.assert.equal(row(c,nested.id).querySelector('.story-track-beat').dataset.selected,'true');
   c.assert.equal(workspace().querySelector(`.story-branch-segment[data-branch-id="${ifHeader.id}"]`).ariaPressed,'true');c.assert.equal(row(c,choice.id).dataset.beatDraft,'true');};
  toggle().click();c.assert.equal(workspace().dataset.writingFocus,'true');c.assert.equal(toggle().textContent,'Show game window');same();
  c.assert.equal(workspace().querySelector('.story-stage-status').textContent,stage,'Hiding the stage changes no preview state');
  c.assert.equal(workspace().querySelectorAll('.story-track-label > .story-grip').length,5,'Every lane but Words has a grip');
  c.assert.equal(workspace().querySelector('.story-track-key'),null,'Writing focus has no Key');
  toggle().click();c.assert.equal(workspace().dataset.writingFocus,'false');same();toggle().click();same();
  // Keyboard resizing: arrows set a session width, Escape cancels, double-click and Enter reset. The editor keeps its text and caret.
  const side=workspace().querySelector('.story-side-grip'),lane=workspace().querySelector('.story-track-label.story-lane-1 > .story-grip'),width=key=>workspace().style.getPropertyValue(`--${key}`);
  c.key(side,'ArrowLeft');c.assert.equal(width('focus-side'),'320px');c.key(side,'Escape');c.assert.equal(width('focus-side'),'');
  c.key(side,'ArrowLeft',{shiftKey:true});side.dispatchEvent(new c.document.defaultView.MouseEvent('dblclick',{bubbles:true}));c.assert.equal(width('focus-side'),'');
  c.key(lane,'ArrowRight');c.assert.equal(width('lane-1'),'40px');c.key(lane,'Enter');c.assert.equal(width('lane-1'),'');c.key(lane,'ArrowRight');
  // A width survives redraws: arrow keys move between rows, and the draft and caret stay with the beat.
  const button=()=>row(c,nested.id).querySelector('.story-track-beat');c.key(button(),'ArrowDown');await c.settle();
  c.assert.equal(button().dataset.selected,'false');c.key(c.document.querySelector('.scene-workspace .story-track-beat[data-selected="true"]'),'ArrowUp');await c.settle();
  c.assert.equal(card(c,nested.id).querySelector('textarea'),field);c.assert.equal(width('lane-1'),'40px');field.focus();same();
  c.assert.equal(c.requests().length,at,'Writing focus, resizing and row moves send no request');c.assert.deepEqual(await c.call('history.state'),steps,'They add no history entry');
  c.assert.deepEqual(await c.snapshot(),original);
  // A new beat from the labelled first marker keeps its place through leaving and entering Writing focus, then inserts through the shared command.
  const entryMark=workspace().querySelector(`.story-track-entry[data-branch-id="${ifHeader.id}"] > button`);c.assert(entryMark?.textContent.startsWith('+ First beat in If '),`labelled entry marker: ${entryMark?.textContent}`);
  entryMark.click();await pickIn(c,'narration');c.enter(newBeat().querySelector('textarea'),'First in focus');await c.settle();
  const panel=newBeat(),inside=place();c.assert.equal(inside?.[0],'1');
  toggle().click();c.assert.deepEqual(place(),inside);c.assert.equal(newBeat(),panel);toggle().click();c.assert.deepEqual(place(),inside);
  let before=c.workspace();await c.click('Add Beat',panel);await c.wait(()=>c.lastMutation()?.response.ok&&!newBeat());await c.settle();
  const first=envelope(c,before,'insertBodyBeat');c.assert.deepEqual(first.body,bodyRef(ifHeader));c.assert.equal(first.position.type,'before');
  const inserted=await c.snapshot();
  c.assert.equal(replaceOnce(c,c.sourceText(inserted,entry.sourcePath),'        "First in focus"\n',''),c.sourceText(original,entry.sourcePath),'One line is added');
  const ifBody=scene(c).bodies.find(b=>b.body.type==='branch'&&b.body.branchId===ifHeader.id);c.assert.equal(scene(c).beats.find(b=>b.id===ifBody.nodes[0].beatId)?.payload.text,'First in focus','It is the first beat in the If');
  unchangedOtherSources(c,original,inserted,entry.sourcePath);c.assert.equal(workspace().dataset.writingFocus,'true');
  // Story Save refuses the invalid Choice draft and writes nothing; both drafts stay.
  const refusedAt=c.requests().length,was=status();await c.click('Save',header());
  await c.wait(()=>status()!==was&&/^Nothing saved/.test(status()));await c.settle();
  c.assert(!c.requests().slice(refusedAt).some(r=>r.request.operation==='scene.saveDrafts'));c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(inserted));
  c.assert.equal(row(c,choice.id).dataset.saveRefused,'true');c.assert.equal(card(c,choice.id).querySelector('[aria-label="Choice option text"]').value,'');
  await c.click('Cancel',card(c,choice.id));await c.settle();
  // Commit in Writing focus saves the nested beat; Undo and Redo reach it and keep Writing focus.
  await select(c,nested.id);c.assert.equal(card(c,nested.id).querySelector('textarea').value,'Nested in focus');
  before=c.workspace();await c.click('Commit Beat',card(c,nested.id));await c.wait(accepted(c,nested.id));await c.settle();
  c.assert.deepEqual(envelope(c,before,'updateBodyBeat').expectedBody,{type:'branch',...nested.owner});
  const committed=await c.snapshot();
  c.assert.equal(c.sourceText(committed,entry.sourcePath),replaceOnce(c,c.sourceText(inserted,entry.sourcePath),'"Nested from Reel"','"Nested in focus"'));
  await c.history('undo');await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(inserted));
  await c.history('redo');await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(committed));
  c.assert.equal(workspace().dataset.writingFocus,'true','Undo and Redo keep Writing focus');c.assert.equal(width('lane-1'),'40px','and the session widths');
  toggle().click();c.assert.equal(workspace().dataset.writingFocus,'false');
 },
 [names[14]]:async c=>{
  await c.call('scene.list');
  const entry=scene(c),path=entry.sourcePath,header=()=>c.document.querySelector('.app-header'),status=()=>c.document.querySelector('#app-status').textContent;
  const ifHeader=shownBeats(c).find(b=>b.id===shownBeats(c).find(x=>x.payload.text==='Nested in focus')?.owner?.branchId);c.assert(ifHeader);
  const inIf=text=>scene(c).beats.find(b=>b.payload.text===text&&b.owner?.branchId===ifHeader.id);
  const refresh=async()=>{const owner=c.session();await c.click('Branches');await c.wait(()=>c.session()===owner&&c.document.querySelector('.branches-workspace'));await c.settle();await goStory(c,entry.id);};
  const type=async(beat,text)=>{c.assert(beat);await select(c,beat.id);c.enter(card(c,beat.id).querySelector('textarea'),text);await c.settle();};
  const panel=id=>c.document.querySelector(`.scene-workspace [data-beat-draft-key="${id}"]`);
  const buttons=scope=>[...scope.querySelectorAll('button')].filter(x=>!x.hidden&&!x.closest('[hidden]')).map(x=>x.textContent);
  // One ordinary external write while the draft waits; Story reads it on return from Branches.
  const external=async(edit,id)=>{await c.raw({driver:'externalReplace',path,...edit(c.sourceText(await c.snapshot(),path))});const changed=await c.snapshot();await refresh();c.assert.equal(panel(id)?.querySelector('textarea')?.value!==undefined,true,'The draft is retained');return changed;};
  // Story Save refuses a draft whose beat left its branch, writes nothing and shows the conflict with only Discard draft.
  const refusedThenDiscarded=async(id,changed)=>{
   const at=c.requests().length,was=status();await c.click('Save',header());await c.wait(()=>status()!==was&&/^Nothing saved/.test(status()));await c.settle();
   c.assert(!c.requests().slice(at).some(r=>r.request.operation==='scene.saveDrafts'),'The conflict stops Save before any request');
   c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(changed)),'A refused Save writes nothing');
   c.assert.equal(status(),`Nothing saved. 1 of 1 draft needs changes:${entry.displayName} 1`);
   c.assert.equal(panel(id).querySelector('.story-conflict > p')?.textContent,'This beat is no longer in source.');
   c.assert.deepEqual(buttons(panel(id)).filter(x=>['Commit Beat','Override source','Discard draft'].includes(x)),['Discard draft']);
   await c.click('Discard draft',panel(id));await c.settle();c.assert.equal(!!panel(id)?.querySelector('.story-conflict'),false);c.assert.equal(!!c.document.querySelector('.scene-workspace [data-beat-draft="true"]'),false,'Discard draft leaves no draft');
  };
  const move=(line,after)=>text=>{const from=text.indexOf(line),to=text.indexOf(after)+after.length;c.assert(from>=0&&to>from);const middle=text.slice(from+line.length,to);return {remove:line+middle,insert:middle+line};};
  // (a) The external edit cuts the nested beat's line from If and pastes it into the Else if.
  // Story Save still refuses it; the draft names where the beat went, and Override source
  // writes the draft to the beat there (story-release-fixes / a-v2).
  const a=inIf('Nested in focus');await type(a,'Draft from If');
  const movedOut=await external(move('        "Nested in focus"\n','        "Boundary preserved"\n'),a.id);
  const moved=scene(c).beats.find(x=>x.id===a.id);c.assert(moved?.owner&&moved.owner.branchId!==ifHeader.id,'Core keeps the beat in its new branch');
  {const at=c.requests().length,was=status();await c.click('Save',header());await c.wait(()=>status()!==was&&/^Nothing saved/.test(status()));await c.settle();
   c.assert(!c.requests().slice(at).some(r=>r.request.operation==='scene.saveDrafts'),'The conflict stops Save before any request');}
  const copy=panel(a.id).querySelector('.story-conflict > p').textContent,to=copy.match(/^This beat moved to (.+) in source\. Your draft is still for this beat\.$/)?.[1];
  c.assert(to,copy);c.assert.equal(panel(a.id).querySelector('.story-conflict label > span').textContent,`Source, now in ${to}`);
  c.assert.equal(panel(a.id).querySelector('.story-conflict-source').textContent,'Nested in focus');
  c.assert.deepEqual(buttons(panel(a.id)).filter(x=>['Commit Beat','Override source','Discard draft',`Show it in ${to}`].includes(x)),[`Show it in ${to}`,'Discard draft','Override source']);
  await c.click('Override source',panel(a.id));await c.settle();c.assert.equal(status(),'Saved');
  c.assert.equal(!!panel(a.id)?.querySelector('.story-conflict'),false);c.assert.equal(!!c.document.querySelector('.scene-workspace [data-beat-draft="true"]'),false,'Override source leaves no draft');
  c.assert.equal(c.sourceText(await c.snapshot(),path),replaceOnce(c,c.sourceText(movedOut,path),'"Nested in focus"','"Draft from If"'));
  c.assert.equal(scene(c).beats.find(x=>x.id===a.id)?.owner?.branchId,moved.owner.branchId);
  // (b) It adds an earlier condition holding an identical line. The If's own lines did not
  // change, so the draft stays with its beat there, and Commit writes only the If's copy.
  const b=inIf('First in focus');await type(b,'Draft from If');
  const earlier=await external(()=>({remove:'    if flag:\n',insert:'    if trust == 9:\n        "First in focus"\n    if flag:\n'}),b.id);
  c.assert.equal(!!panel(b.id).querySelector('.story-conflict'),false,'No conflict');c.assert.equal(scene(c).beats.find(x=>x.id===b.id)?.owner?.branchId,b.owner.branchId);
  const beforeB=c.workspace();await c.click('Commit Beat',card(c,b.id));await c.wait(accepted(c,b.id));await c.settle();
  c.assert.deepEqual(envelope(c,beforeB,'updateBodyBeat').expectedBody,{type:'branch',...b.owner});
  const was=c.sourceText(earlier,path),own=was.indexOf('"First in focus"',was.indexOf('    if flag:\n'));c.assert(own>was.indexOf('"First in focus"'),'The If holds the second copy');
  c.assert.equal(c.sourceText(await c.snapshot(),path),was.slice(0,own)+'"Draft from If"'+was.slice(own+'"First in focus"'.length));
  // (c) It adds an identical copy of the condition's If and the beat's line above them.
  const copied=inIf('End of If from Reel');await type(copied,'Draft from If');
  await refusedThenDiscarded(copied.id,await external(()=>({remove:'    if trust == 9:\n',insert:'    if flag:\n        "End of If from Reel"\n    if trust == 9:\n'}),copied.id));
  // An unrelated external edit leaves a branch draft with its beat: Commit writes only that line.
  const branch=scene(c).beats.find(x=>x.payload.text==='Inserted branch café 雪');c.assert(branch?.owner);
  await type(branch,'Kept in its branch');
  const unrelated=await external(()=>({remove:'        "Boundary preserved"\n',insert:'        "Boundary edited outside"\n'}),branch.id);
  c.assert.equal(!!panel(branch.id).querySelector('.story-conflict'),false,'No conflict');c.assert.equal(scene(c).beats.find(x=>x.id===branch.id)?.owner?.branchId,branch.owner.branchId);
  const before=c.workspace();await c.click('Commit Beat',card(c,branch.id));await c.wait(accepted(c,branch.id));await c.settle();
  c.assert.deepEqual(envelope(c,before,'updateBodyBeat').expectedBody,{type:'branch',...branch.owner});
  const committed=await c.snapshot();
  c.assert.equal(c.sourceText(committed,path),replaceOnce(c,c.sourceText(unrelated,path),'"Inserted branch café 雪"','"Kept in its branch"'));
  unchangedOtherSources(c,unrelated,committed,path);
 },
 [names[15]]:async c=>{
  await c.call('scene.list');
  const entry=scene(c),path=entry.sourcePath,status=()=>c.document.querySelector('#app-status').textContent;
  // Ordinary external edits: a whole number compared with a yes/no, and a Variable the project lacks.
  await c.raw({driver:'externalReplace',path,remove:'    if trust == 9:\n',insert:'    if trust == True:\n'});
  await c.raw({driver:'externalReplace',path,remove:'    elif trust == 4:\n',insert:'    elif missing_flag == 4:\n'});
  const changed=await c.snapshot(),owner=c.session();
  await c.click('Branches');await c.wait(()=>c.session()===owner&&c.document.querySelector('.branches-workspace'));await c.settle();await goStory(c,entry.id);
  const branchOf=source=>shownBeats(c).find(b=>b.conditionalBranch?.condition?.source===source);
  // Each test names its problem and what to do (story-release-fixes / a-v2): the builder,
  // Branch path, Tracks entry and the condition's summary and Tracks cell.
  const shown=async(source,word,test,short,message)=>{
   const branch=branchOf(source);c.assert(branch);c.assert.equal(branch.conditionalBranch.condition.status,'unknown');
   const ifId=nodeOf(c,branch.conditionalBranch.groupId).id,reason=message.slice(0,message.indexOf('.')+1);
   const section=await branchBody(c,branch.id),workspace=c.document.querySelector('.scene-workspace');
   c.assert.equal(workspace.querySelector(`.story-branch-segment[data-branch-id="${branch.id}"]`).title,`Close ${word} ${test}, needs changes: ${reason}`);
   c.assert.equal(workspace.querySelector(`.story-branch-segment[data-branch-id="${branch.id}"]`).textContent,`${word} !`);
   c.assert.equal(workspace.querySelector(`.story-track-entry[data-branch-id="${branch.id}"] [title]`).title,`${word} ${test}`);
   const code=section.querySelector('.story-rule-code');
   c.assert.equal(code.textContent,`${word==='If'?'if':'elif'} ${source}:`);c.assert.equal(code.getAttribute('aria-invalid'),'true');
   c.assert.equal(c.document.getElementById(code.getAttribute('aria-describedby')).textContent,message);
   c.assert.equal([...section.querySelectorAll('button')].find(b=>b.textContent==='Edit in Source')?.disabled,false);
   c.assert.equal(section.querySelector(`[data-beat-opener="branch:${branch.id}"]`).disabled,true,'+ Beat is off while the builder cannot edit the test');
   const flow=findRow(c,ifId).querySelector('.story-lane-5');c.assert.equal(flow.textContent,'1 branch to fix');c.assert(flow.classList.contains('story-lane-warn'));
   const caption=workspace.querySelector(`.story-branch-group[data-branch-owner="${ifId}"] .story-branch-test`);
   c.assert.deepEqual([...card(c,ifId).querySelectorAll('.story-condition-problems li > span')].map(item=>item.textContent),[`${word} ${test}: ${reason}`]);
   return {test:caption.textContent,warn:caption.classList.contains('story-branch-warn'),summary:card(c,ifId).querySelector('.story-condition-summary').textContent,section};
  };
  const mismatch=await shown('trust == True','If','trust = True','wrong type',"trust is a whole number, and True is yes/no. Compare it with a whole number in Source. Until then, the builder can't edit this branch.");
  c.assert.deepEqual({test:mismatch.test,warn:mismatch.warn,summary:mismatch.summary},{test:'trust = True · wrong type',warn:true,summary:'Condition · trust = True · 1 branches / 1 Beats'});
  // The Branch path caption follows the open Else if and names its problem; the summary keeps the If test.
  const missing=await shown('missing_flag == 4','Else if','missing_flag = 4','not a variable',"missing_flag is not a project variable. Create it, or change this line in Source. Until then, the builder can't edit this branch.");
  c.assert.equal(missing.test,'missing_flag = 4 · not a variable');c.assert.equal(missing.warn,true);c.assert.match(missing.summary,/^Condition · flag · 3 branches \/ \d+ Beats$/);
  c.assert.deepEqual([...missing.section.querySelectorAll('.story-rule-actions > button')].map(b=>b.textContent),['Create missing_flag…','Edit in Source']);
  // An unrelated draft still saves.
  const root=scene(c).beats.find(b=>b.payload.text==='Override A'&&!b.owner);c.assert(root);
  await select(c,root.id);c.enter(card(c,root.id).querySelector('textarea'),'Saved beside unknown tests');await c.settle();
  const at=c.requests().length;await c.click('Save',c.document.querySelector('.app-header'));
  await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.saveDrafts'&&r.responseOk));await c.settle();c.assert.equal(status(),'Saved');
  const saved=await c.snapshot();
  c.assert.equal(c.sourceText(saved,path),replaceOnce(c,c.sourceText(changed,path),'"Override A"','"Saved beside unknown tests"'));
  unchangedOtherSources(c,changed,saved,path);
  // Create missing_flag… opens the shared New variable dialog for it, as a whole number to match 4.
  // Cancel keeps nothing.
  const elseIf=branchOf('missing_flag == 4'),section=await branchBody(c,elseIf.id),writes=c.requests().length;
  [...section.querySelectorAll('button')].find(b=>b.textContent==='Create missing_flag…').click();
  const dialog=c.document.querySelector('.story-new-variable');c.assert.equal(dialog.querySelector('input[aria-label="Variable name"]').value,'missing_flag');
  c.assert.equal(dialog.querySelector('select[aria-label="Variable type"]').value,'int');
  await c.click('Cancel',dialog);c.assert.equal(c.document.querySelector('.story-new-variable'),null);
  c.assert.equal(c.requests().slice(writes).filter(r=>r.request.operation==='variable.create').length,0);
  // Create variable makes the test editable in the builder. The scene source and every beat ID stay.
  const ids=shownBeats(c).map(b=>b.id);
  [...(await branchBody(c,elseIf.id)).querySelectorAll('button')].find(b=>b.textContent==='Create missing_flag…').click();
  const create=c.requests().length;await c.click('Create variable',c.document.querySelector('.story-new-variable'));
  await c.wait(()=>c.requests().slice(create).some(r=>r.request.operation==='variable.create'));await c.settle();
  // Each read after the creation succeeds; the status names no refusal.
  const reads=c.requests().slice(create).map(r=>`${r.request.operation} ${r.responseOk?'ok':r.errorCode}`);
  c.assert.deepEqual(reads.filter(r=>!r.endsWith(' ok')),[],`${reads.join(', ')}; status: ${status()}`);
  c.assert.equal(c.document.querySelector('.story-new-variable'),null);
  c.assert.deepEqual(shownBeats(c).map(b=>b.id),ids);c.assert.equal(branchOf('missing_flag == 4'),undefined);
  c.assert.equal(shownBeats(c).find(b=>b.id===elseIf.id).conditionalBranch.condition.status,'supported');
  const editable=await branchBody(c,elseIf.id);
  c.assert.equal(editable.querySelector('.story-rule-code[aria-invalid="true"]'),null);c.assert(editable.querySelector('select[aria-label$=" comparison"]'));
  c.assert.equal(editable.querySelector(`[data-beat-opener="branch:${elseIf.id}"]`).disabled,false,'+ Beat works once the builder can edit the test');
  const group=nodeOf(c,elseIf.conditionalBranch.groupId).id;
  c.assert.equal(card(c,group).querySelector('.story-condition-problems'),null);c.assert(!findRow(c,group).querySelector('.story-lane-5').classList.contains('story-lane-warn'));
  c.assert.equal(c.sourceText(await c.snapshot(),path),c.sourceText(saved,path));
  // Undo removes the variable again; the test goes back to unknown on the same beats.
  await c.history('undo');await c.settle();
  c.assert.deepEqual(shownBeats(c).map(b=>b.id),ids);c.assert(branchOf('missing_flag == 4'));
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(saved));
 },
 // The source-foundation runtime probe reads source while the app reads history, so the
 // native host can refuse the app's history.state as busy. Undo must still leave Redo.
 [names[16]]:async c=>{
  if(!c.document.querySelector('.scene-workspace .story-track-column')){await c.click('Story',c.document.querySelector('.story-sidebar'));await c.wait(()=>c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();}
  if(shownScene(c)!==scene(c).id)await openScene(c,scene(c).displayName);
  const s=scene(c),before=await c.snapshot(),original=c.sourceText(before,s.sourcePath);
  // A narration line, written once, in a top-level branch that the Branch path offers.
  const segment=id=>[...c.document.querySelectorAll('.scene-workspace .story-branch-segment')].some(item=>item.dataset.branchId===id);
  const child=s.beats.find(b=>b.owner&&b.payload.type==='narration'&&!b.protected&&!s.beats.find(h=>h.id===b.owner.branchId)?.owner&&segment(b.owner.branchId)&&original.split(`"${b.payload.text}"`).length===2);c.assert(child,'A nested narration child');
  const editor=await pick(c,child.id),form=editor.querySelector('.expanded-beat');
  c.enter(editor.querySelector('textarea'),'Redo survives a busy read');await c.click('Commit Beat',editor);
  await c.wait(()=>!form.isConnected&&c.lastMutation()?.response.ok);await c.settle();
  const committed=await c.snapshot();
  c.assert.equal(c.sourceText(committed,s.sourcePath),replaceOnce(c,original,`"${child.payload.text}"`,'"Redo survives a busy read"'));
  // Every history read until Undo settles is refused before dispatch, as a concurrent read would be.
  c.busy('history.state',2);await c.history('undo');await c.settle();
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(before));
  // No input follows: Story shows the undone beat, and Redo stays available.
  await c.wait(()=>card(c,child.id)?.querySelector('textarea')?.value===child.payload.text);await c.settle();
  c.assert.equal((await c.call('history.state')).redo?.name,`narration edit in ${s.displayName}`);
  const redo=c.document.querySelector('.app-header [data-history="redo"]');c.assert.notEqual(redo.getAttribute('aria-disabled'),'true','Header Redo stays available after Undo');
  c.assert.equal(card(c,child.id).querySelector('.expanded-beat').dataset.unsubmitted,undefined,'Showing the undone beat starts no draft');
  await c.history('redo');await c.settle();
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(committed));c.assert.equal(c.document.querySelector('.scene-workspace [data-unsubmitted="true"]'),null);
 },
 [RELEASE_JOURNEY]:async c=>{
  const view=async(c,name)=>{await c.click(name,c.document.querySelector('.scene-workspace .story-view-switch'));
   await c.wait(()=>c.document.querySelector(`.scene-workspace .story-view-option[data-view="${name.toLowerCase()}"]`)?.getAttribute('aria-pressed')==='true');};
  const focusToggle=c=>c.document.querySelector('.scene-workspace [data-writing-focus-toggle]');
  const status=c=>c.document.querySelector('#app-status').textContent;
  const header=c=>c.document.querySelector('.app-header');
  const path=(c,name)=>byName(c,name).sourcePath;
  const text=(c,snapshot,name)=>c.sourceText(snapshot,path(c,name));
  // Every .rpy file but the named scenes'.
  const others=(c,snapshot,names)=>Object.fromEntries(Object.entries(c.hashes(c.rpy(snapshot))).filter(([p])=>!names.map(n=>path(c,n)).includes(p)));
  const initial=await c.snapshot(),from=c.requests().length;
  const writes=()=>c.requests().slice(from).filter(r=>['scene.apply','scene.saveDrafts','source.save'].includes(r.request.operation)).length;
  // Four drafts in four scenes and four places: a beat two branches deep through the
  // Branch path in Tracks, a dialogue line in Reel, a Set variable in Writing focus, and
  // a beat inside a Choice option.
  const boundary=beatIn(c,'Platform',b=>b.payload.text==='Boundary branch');c.assert(boundary?.owner);
  await view(c,'Tracks');await select(c,boundary.id);
  c.assert(c.document.querySelector(`.scene-workspace .story-branch-segment[data-branch-id="${boundary.owner.branchId}"]`)?.ariaPressed==='true','The Branch path opens the Else if');
  c.enter(card(c,boundary.id).querySelector('textarea'),'Boundary draft');await c.settle();
  await openScene(c,'Tram');await view(c,'Reel');
  const line=beatIn(c,'Tram',b=>b.payload.text==='Room for one more?');await select(c,line.id);
  c.enter(card(c,line.id).querySelector('textarea'),'Room for two?');await c.settle();
  await openScene(c,'Variables');await view(c,'Tracks');focusToggle(c).click();
  const fare=beatIn(c,'Variables',b=>b.payload.type==='setVariable'&&b.payload.value?.operation==='add');c.assert(fare);
  await select(c,fare.id);const formula=()=>card(c,fare.id).querySelector('[aria-label="Formula"]');
  c.enter(formula(),'fare +');await c.settle();
  await openScene(c,'Choices');
  const glass=beatIn(c,'Choices',b=>b.payload.text==='Rain streaks the glass.');c.assert(glass?.owner);
  await select(c,glass.id);c.enter(card(c,glass.id).querySelector('textarea'),'Rain on the glass.');await c.settle();
  // Leaving Writing focus, other workspaces and other views keeps all four drafts and writes nothing.
  focusToggle(c).click();
  const owner=c.session();await c.click('Source');await c.wait(()=>c.session()===owner&&c.document.querySelector('.source-workspace'));await c.settle();
  await c.click('Branches');await c.wait(()=>c.document.querySelector('.branches-workspace'));await c.settle();
  await goStory(c,byName(c,'Choices').id);await view(c,'Reel');await view(c,'Tracks');
  const kept=[['Platform',boundary.id,'Boundary draft'],['Tram',line.id,'Room for two?'],['Choices',glass.id,'Rain on the glass.']];
  for(const [name,id,value] of kept){await openScene(c,name);c.assert.equal(row(c,id).dataset.beatDraft,'true');
   await select(c,id);c.assert.equal(card(c,id).querySelector('textarea').value,value,`${name} keeps its draft`);}
  await openScene(c,'Variables');await select(c,fare.id);c.assert.equal(formula().value,'fare +');
  c.assert.equal(writes(),0);c.assert.deepEqual(await c.snapshot(),initial,'Drafts write nothing');
  // The Code scene's broken tests give their reason in the Branch path (story-release-fixes / a-v2). Custom Python is not a problem.
  await openScene(c,'Code');const segments=[...c.document.querySelectorAll('.scene-workspace .story-branch-segment')].map(x=>x.title);
  for(const caption of ['Show If trust in (1, 2)','Show If missing_flag = 4, needs changes: missing_flag is not a project variable.','Show Else if mood, needs changes: mood is text, not yes/no.'])
   c.assert(segments.includes(caption),`The Branch path shows ${caption}`);
  // Its Custom Code, not its tests, is why the preview is partial.
  c.assert.equal(c.document.querySelector('.scene-workspace .partial-state').textContent,'Preview and reference certainty are partial because this Scene contains protected Custom Code.');
  // The main Save refuses while the Set variable draft is invalid, writes nothing and
  // reveals that draft.
  let at=c.requests().length,was=status(c);await c.click('Save',header(c));
  await c.wait(()=>status(c)!==was&&/^Nothing saved/.test(status(c)));await c.settle();
  // Core checks a formula, so the one request is refused whole.
  c.assert.deepEqual(c.requests().slice(at).filter(r=>r.request.operation==='scene.saveDrafts').map(r=>r.errorCode),['INVALID_ARITHMETIC_SYNTAX']);
  c.assert.equal(status(c),'Nothing saved. 1 of 4 drafts need changes:Variables 1');
  c.assert.equal(shownScene(c),byName(c,'Variables').id);c.assert.equal(row(c,fare.id).dataset.saveRefused,'true');
  c.assert.deepEqual(await c.snapshot(),initial,'A refused Save writes nothing');
  // Ordinary external edits: the Boundary line itself, and an unrelated line in Choices.
  // Story reads them on return from Branches.
  await c.raw({driver:'externalReplace',path:path(c,'Platform'),remove:'bec "Boundary branch"',insert:'bec "Boundary changed outside"'});
  await c.raw({driver:'externalReplace',path:path(c,'Choices'),remove:'"The doors close."',insert:'"The doors slide shut."'});
  const external=await c.snapshot();
  await c.click('Branches');await c.wait(()=>c.document.querySelector('.branches-workspace'));await c.settle();await goStory(c,byName(c,'Variables').id);
  // The unrelated edit leaves the option draft as it was; the Boundary draft shows the B conflict.
  await openScene(c,'Choices');c.assert.equal(row(c,glass.id).dataset.beatConflict,undefined);c.assert.equal(row(c,glass.id).dataset.beatDraft,'true');
  await openScene(c,'Platform');c.assert.equal(row(c,boundary.id).dataset.beatConflict,'true');
  await select(c,boundary.id);const conflict=card(c,boundary.id);
  c.assert.equal(conflict.querySelector('.story-conflict > strong')?.textContent,'Conflict with source');
  c.assert.equal(conflict.querySelector('.story-conflict-source')?.textContent,'Boundary changed outside');
  c.assert.equal(c.labelled('Your draft',conflict).value,'Boundary draft');
  // Override source writes the draft over the changed line, in its own branch.
  at=c.requests().length;await c.click('Override source',conflict);
  await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.apply'&&r.responseOk));await c.settle();
  c.assert.deepEqual(c.requests().slice(at).find(r=>r.request.operation==='scene.apply').request.payload.command.expectedBody,{type:'branch',...boundary.owner});
  const overridden=await c.snapshot();
  c.assert.equal(text(c,overridden,'Platform'),replaceOnce(c,text(c,external,'Platform'),'bec "Boundary changed outside"','bec "Boundary draft"'));
  c.assert.deepEqual(others(c,overridden,['Platform']),others(c,external,['Platform']));
  // Commit saves only the Tram line.
  await openScene(c,'Tram');await select(c,line.id);
  await c.click('Commit Beat',card(c,line.id));await c.wait(accepted(c,line.id));await c.settle();
  const committed=await c.snapshot();
  c.assert.equal(text(c,committed,'Tram'),replaceOnce(c,text(c,overridden,'Tram'),'eli "Room for one more?"','eli "Room for two?"'));
  c.assert.deepEqual(others(c,committed,['Tram']),others(c,overridden,['Tram']));
  // A Source edit in another workspace, between Story edits.
  const codePath=path(c,'Code'),editor=await openSourceEditor(c,codePath);
  const edited=replaceOnce(c,editor.value,'"End of the line."','"Last stop."');c.enter(editor,edited);
  await c.wait(async()=>(await c.call('source.open',{path:codePath})).text===edited);await c.settle();
  at=c.requests().length;await c.click('Save Source',header(c));
  await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='source.save'&&r.responseOk)&&mountedSourceEditor(c,codePath)?.value===edited);await c.settle();
  await goStory(c,byName(c,'Tram').id);
  const sourced=await c.snapshot();c.assert.equal(text(c,sourced,'Code'),edited);
  c.assert.deepEqual(others(c,sourced,['Code']),others(c,committed,['Code']));
  // Fixing the Set variable lets the main Save accept both remaining drafts in one request.
  await openScene(c,'Variables');await select(c,fare.id);c.enter(formula(),'0.5');await c.settle();
  at=c.requests().length;await c.click('Save',header(c));
  await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.saveDrafts'&&r.responseOk));await c.settle();
  c.assert.equal(status(c),'Saved');
  c.assert.equal(c.requests().slice(at).find(r=>r.request.operation==='scene.saveDrafts').request.payload.commands.length,2);
  const saved=await c.snapshot();
  c.assert.equal(text(c,saved,'Variables'),replaceOnce(c,text(c,sourced,'Variables'),'$ fare += 0.25','$ fare += 0.5'));
  c.assert.equal(text(c,saved,'Choices'),replaceOnce(c,text(c,sourced,'Choices'),'"Rain streaks the glass."','"Rain on the glass."'));
  c.assert.deepEqual(others(c,saved,['Variables','Choices']),others(c,sourced,['Variables','Choices']));
  // Undo walks back across Story and Source, newest first: the Save's two beats (the
  // last edited first), the Source edit, the Commit and the override. It ends at the
  // bytes the external writer left; every other file has its first bytes.
  const undo=async()=>{await c.history('undo');await c.settle();return c.hashes(c.rpy(await c.snapshot()));};
  const without=(snapshot,name,from)=>({...c.hashes(c.rpy(snapshot)),[path(c,name)]:c.hashes(c.rpy(from))[path(c,name)]});
  c.assert.deepEqual(await undo(),without(saved,'Variables',sourced));
  for(const expected of [sourced,committed,overridden,external])c.assert.deepEqual(await undo(),c.hashes(c.rpy(expected)));
  c.assert.deepEqual(others(c,external,['Platform','Choices']),others(c,initial,['Platform','Choices']));
  c.assert.equal(header(c).querySelector('[data-history="undo"]').getAttribute('aria-disabled'),'true','Nothing is left to undo');
  // Redo replays all five. The harness then undoes and redoes once more, reopens the
  // project in a new process and checks every source byte.
  for(let index=0;index<5;index++){await c.history('redo');await c.settle();}
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(saved)));
  // An ordinary save that an I/O failure stopped after staging leaves its journal. Story
  // shows Recovery required on its next read; keeping the current files resumes writing.
  await c.raw({driver:'interruptedSave',path:path(c,'Tram')});
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(saved)),'The interrupted save left every source as it was');
  await c.click('Branches');await c.wait(()=>c.document.querySelector('.branches-workspace'));await c.settle();
  const recovery=()=>c.document.querySelector('.recovery-workspace');
  await c.click('Story');await c.wait(()=>recovery()?.querySelector('.recovery-item'));await c.settle();
  c.assert.equal(recovery().querySelector('h1').textContent,'Recovery required');c.assert.equal(status(c),'Recovery required — writes are disabled');
  // Only the interrupted save shows; finished transactions are not recovery work.
  c.assert.equal(recovery().querySelectorAll('.recovery-item').length,1,[...recovery().querySelectorAll('.recovery-item p:first-of-type')].map(p=>p.textContent).join(', '));
  const item=recovery().querySelector('.recovery-item');
  c.assert.deepEqual([...item.querySelectorAll('tr td:first-child')].map(cell=>cell.textContent),[path(c,'Tram')]);
  c.assert.equal(item.querySelector('p.muted').textContent,'The current project bytes are still the verified base. Keeping them is supported.');
  const keep=[...item.querySelectorAll('button')].find(b=>b.textContent==='Keep current project files');c.assert(keep?.disabled,'Keep waits for the review checkbox');
  const reviewed=c.labelled('I reviewed the affected files and retained evidence',item);reviewed.checked=true;reviewed.dispatchEvent(new window.Event('change',{bubbles:true}));
  at=c.requests().length;await c.click('Keep current project files',item);
  await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.resolveRecovery'&&r.responseOk)&&c.document.querySelector('.scene-workspace .story-track-column'));await c.settle();
  c.assert.equal(recovery(),null);c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(saved)),'Keeping the current files writes no source');
 },
 [STORY_CONTROLS]:async c=>{
  const status=()=>c.document.querySelector('#app-status').textContent;
  const path=name=>byName(c,name).sourcePath;
  const effects=()=>c.document.querySelector('.scene-workspace .story-effects');
  // Story keeps each picture core presents, so an earlier view may have asked for it.
  const presented=(from,purpose,assetId)=>c.requests().slice(from).some(r=>r.request.operation==='media.present'&&(!purpose||r.request.payload.purpose===purpose)&&r.request.payload.assetId===assetId&&r.responseOk);
  const applied=(from,type)=>c.requests().slice(from).find(r=>r.request.operation==='scene.apply'&&r.request.payload.command.type===type&&r.responseOk);
  const writes=from=>c.requests().slice(from).filter(r=>['scene.apply','scene.saveDrafts','source.save','variable.create'].includes(r.request.operation)).length;
  // Only the named files changed.
  const othersKept=(before,after,paths)=>{const strip=snapshot=>Object.fromEntries(Object.entries(c.hashes(c.rpy(snapshot))).filter(([p])=>!paths.includes(p)));c.assert.deepEqual(strip(after),strip(before));};
  // The stage asks core for the background picture at the selected beat.
  await openScene(c,'Tram');
  const background=beatIn(c,'Tram',b=>b.payload.type==='background'),music=beatIn(c,'Tram',b=>b.payload.type==='playMusic');
  const line=beatIn(c,'Tram',b=>b.payload.type==='dialogue'&&b.payload.text==='The last tram is late again.');c.assert(background&&music&&line);
  let from=c.requests().length;await select(c,line.id);
  await c.wait(()=>presented(0,undefined,background.payload.assetId)&&c.document.querySelector('.scene-workspace .preview-canvas img.preview-background')?.getAttribute('src'));
  // Audition plays the music in effect only when pressed.
  c.assert(!presented(from,'audioAudition',music.payload.assetId),'Selecting a beat plays nothing');
  from=c.requests().length;await c.click('Audition current music',effects());
  await c.wait(()=>presented(from,'audioAudition',music.payload.assetId)&&effects()?.querySelector('.audio-audition audio'));
  c.assert.equal(status(),'Audio audition started by user');c.assert.equal(writes(from),0);
  // Add change here on the Background row opens a background beat at this line.
  let before=await c.snapshot();
  const backgroundRow=[...effects().querySelectorAll('.provenance-row')].find(r=>r.querySelector('.asset-thumbnail'));c.assert(backgroundRow);
  from=c.requests().length;await c.click('Add change here',backgroundRow);
  const change=c.document.querySelector('.scene-workspace .new-beat');c.assert(change);
  await c.click('Add Beat',change);await c.wait(()=>applied(from,'insertBodyBeat'));await c.settle();
  c.assert.deepEqual(applied(from,'insertBodyBeat').request.payload.command.position,{type:'before',anchor:{type:'beat',beatId:line.id}});
  let after=await c.snapshot();
  const lines=t=>c.sourceText(t,path('Tram')).split('\n'),at=lines(before).indexOf('    mara "The last tram is late again."');
  c.assert.deepEqual(lines(after).filter((_,i)=>i!==at),lines(before),'One line is added');c.assert.match(lines(after)[at],/^    scene bg /);
  othersKept(before,after,[path('Tram')]);
  // + Next line commits the line and adds an empty line for the same speaker after it.
  before=after;await select(c,line.id);c.enter(card(c,line.id).querySelector('textarea'),'The last tram is later still.');await c.settle();
  from=c.requests().length;await c.click('+ Next line',card(c,line.id));await c.wait(()=>applied(from,'continueDialogue'));await c.settle();
  after=await c.snapshot();
  c.assert.equal(c.sourceText(after,path('Tram')),replaceOnce(c,c.sourceText(before,path('Tram')),'    mara "The last tram is late again."\n','    mara "The last tram is later still."\n    mara ""\n'));
  othersKept(before,after,[path('Tram')]);
  // A Repeat this Choice beat's Select Choice opens its Choice, and writes nothing.
  await openScene(c,'Choices');
  const repeat=beatIn(c,'Choices',b=>b.payload.type==='repeatChoice'),menu=beatIn(c,'Choices',b=>b.payload.type==='choice'&&b.payload.options.some(o=>o.id===repeat?.owner?.branchId));c.assert(repeat&&menu);
  from=c.requests().length;await select(c,repeat.id);
  await c.click(`Select Choice ${row(c,menu.id).querySelector('.story-beat-number').textContent}`,card(c,repeat.id));await c.wait(()=>card(c,menu.id));
  c.assert.equal(writes(from),0);
  // + New variable… in a new condition's rule creates the variable through core; the
  // rule then uses it. Cancelling the condition writes no scene.
  before=await c.snapshot();from=c.requests().length;
  await c.click('+ Add beat',c.document.querySelector('.scene-workspace'));await pickIn(c,'condition');
  const condition=c.document.querySelector('.scene-workspace .new-beat'),picker=()=>condition.querySelector('.story-variable-picker > summary');
  picker().click();await c.click('+ New variable…',condition);
  const dialog=()=>c.document.querySelector('.scene-workspace .story-new-variable');c.assert(dialog());
  c.enter(dialog().querySelector('input[aria-label="Variable name"]'),'late_tram');await c.click('Create variable',dialog());
  await c.wait(()=>!dialog()&&c.requests().slice(from).some(r=>r.request.operation==='variable.create'&&r.responseOk));await c.settle();
  c.assert.equal(picker().getAttribute('aria-label'),'If rule 1 variable: late_tram');
  c.assert(c.workspace().authoring.variables.some(v=>v.technicalName==='late_tram'));
  await c.click('Cancel',condition);await c.settle();c.assert(!applied(from,'insertCondition'),'Cancel adds no condition');
  after=await c.snapshot();c.assert.match(c.sourceText(after,'game/definitions/variables.rpy'),/^default late_tram = False$/m);
  othersKept(before,after,['game/definitions/variables.rpy']);
  // A new Set variable's formula check waits for each write in flight, "+ New variable…"
  // and an Undo alike, and sends the revisions that write makes (B23). The three Undos
  // after Cancel bring the draft back, then its earlier variable, then remove the variable.
  before=await c.snapshot();from=c.requests().length;
  const pause=ms=>new Promise(r=>setTimeout(r,ms)),undoLabel=()=>c.document.querySelector('.app-header [data-history="undo"]').getAttribute('aria-label');
  const checks=()=>c.requests().slice(from).filter(r=>r.request.operation==='scene.validateAssignment');
  await c.click('+ Add beat',c.document.querySelector('.scene-workspace'));await pickIn(c,'setVariable');await c.settle();
  const counter=c.document.querySelector('.scene-workspace .new-beat'),variableMenu=()=>counter.querySelector('.story-variable-picker > summary');
  const formula=()=>counter.querySelector('[aria-label="Formula"]'),feedback=()=>counter.querySelector('.story-formula-feedback').textContent;
  const listed=()=>{variableMenu().click();const names=[...counter.querySelectorAll('.story-variable-picker .story-variable-name')].map(n=>n.textContent);variableMenu().click();return names;};
  variableMenu().click();[...counter.querySelectorAll('.story-variable-picker [role=option]')].find(o=>o.querySelector('.story-variable-name')?.textContent==='trust').click();
  c.enter(formula(),'trust + 1');await c.wait(()=>checks().length);await c.settle();
  // New variable takes focus from the formula, whose check then runs during Create variable.
  variableMenu().click();await c.click('+ New variable…',counter);
  c.enter(dialog().querySelector('input[aria-label="Variable name"]'),'late_count');await c.click('Whole number',dialog());
  await c.pendingWrite('variable.create',()=>c.click('Create variable',dialog()),()=>pause(300));
  await c.wait(()=>!dialog());await c.settle();
  c.assert.equal(variableMenu().getAttribute('aria-label'),'Variable: late_count');
  await c.click('Cancel',counter);await c.settle();
  // Undo of Cancel shows the draft in the editor, selectable from its Tracks column.
  c.assert.equal(undoLabel(),'Undo cancel of set variable draft in Choices');
  await c.history('undo');await c.settle();
  c.assert.equal(c.document.querySelector('.scene-workspace .story-editor .new-beat'),counter,'The restored draft shows in the editor');
  c.assert.equal(status(),'1 unsaved beat draft');c.assert.equal(variableMenu().getAttribute('aria-label'),'Variable: late_count');
  await select(c,repeat.id);c.assert(!counter.isConnected);
  c.document.querySelector(`.scene-workspace .story-track-pending[data-new-beat="${counter.dataset.beatDraftKey}"] > .story-track-beat`).click();
  await c.wait(()=>c.document.querySelector('.scene-workspace .story-editor .new-beat')===counter);
  c.assert.equal(undoLabel(),'Undo set variable change in Choices');
  await c.history('undo');await c.settle();
  c.assert.equal(variableMenu().getAttribute('aria-label'),'Variable: trust');c.assert.equal(formula().value,'trust + 1');
  // The Undo button takes focus from the formula, whose check then runs during the Undo.
  c.assert.equal(undoLabel(),'Undo new variable late_count');
  formula().focus();c.document.querySelector('.app-header [data-history="undo"]').focus();
  await c.pendingWrite('history.undo',()=>c.history('undo'),()=>pause(300));await c.settle();
  c.assert.doesNotMatch(c.sourceText(await c.snapshot(),'game/definitions/variables.rpy'),/late_count/);
  await c.click('Story',c.document.querySelector('.story-sidebar'));
  await c.wait(()=>c.document.querySelector('.scene-workspace .story-editor .new-beat')===counter);await c.settle();
  await c.wait(()=>!/Checking/.test(feedback()));
  c.assert.deepEqual(checks().map(r=>r.errorCode??'ok').filter(code=>code!=='ok'),[],'Every check sends current revisions');
  c.assert.doesNotMatch(feedback(),/outside Loomlight/);
  c.assert.equal(variableMenu().getAttribute('aria-label'),'Variable: trust');c.assert(!listed().includes('late_count'),'The draft no longer offers the removed variable');
  await c.click('Cancel',counter);await c.settle();
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(before),'The draft and the Undone variable leave every file as it was');
  // The scene tree: a new chapter, a scene in it, moving that scene to the first chapter,
  // then deleting the scene and the empty chapter. Each is one Story write.
  const tree=()=>c.document.querySelector('.story-tree'),chapterGroup=name=>[...tree().querySelectorAll('.tree-chapter')].find(g=>g.querySelector('.tree-chapter-row strong')?.textContent===name);
  const sceneRow=name=>[...tree().querySelectorAll('.tree-scene-row')].find(r=>r.querySelector('.tree-scene-open')?.textContent===name);
  const named=async(scope,value,type)=>{const at=c.requests().length;const inline=scope.querySelector(':scope > .tree-inline');c.assert(inline);c.enter(inline.querySelector('input'),value);await c.click('Save',inline);await c.wait(()=>applied(at,type));await c.settle();};
  const menuOf=row=>{const menu=row.querySelector('.tree-menu');if(!menu.open)menu.querySelector('summary').click();return menu;};
  const firstChapter=c.workspace().chapters[0];before=await c.snapshot();
  await c.click('New Chapter',tree().querySelector('.tree-heading'));await named(tree(),'Night','createChapter');
  const nightChapter=c.workspace().chapters.find(ch=>ch.displayName==='Night');c.assert(nightChapter);
  await c.click('+ New Scene',chapterGroup('Night'));await named(chapterGroup('Night'),'Spare','createScene');
  c.assert.equal(byName(c,'Spare').chapterId,nightChapter.id);const spareInNight=byName(c,'Spare').sourcePath;
  c.assert((await c.snapshot())[spareInNight],'The scene file is in the Night chapter');
  // The menu's controls name their scene or chapter in ariaLabel.
  from=c.requests().length;let menuNode=menuOf(sceneRow('Spare'));const destination=menuNode.querySelector('select');c.assert.equal(destination.ariaLabel,'Destination chapter for Spare');
  c.enter(destination,firstChapter.id,'change');await c.click('Move',menuNode);
  await c.wait(()=>applied(from,'moveScene'));await c.settle();
  c.assert.equal(byName(c,'Spare').chapterId,firstChapter.id);after=await c.snapshot();
  c.assert(!after[spareInNight]&&after[byName(c,'Spare').sourcePath],'Move writes the scene file in the first chapter');
  from=c.requests().length;menuNode=menuOf(sceneRow('Spare'));c.assert.equal([...menuNode.querySelectorAll('button')].find(b=>b.textContent==='Delete').ariaLabel,'Delete scene Spare');await c.click('Delete',menuNode);await c.click('Delete scene',sceneRow('Spare'));
  await c.wait(()=>applied(from,'deleteScene'));await c.settle();c.assert.equal(byName(c,'Spare'),undefined);
  from=c.requests().length;menuNode=menuOf(chapterGroup('Night').querySelector('.tree-chapter-row'));c.assert.equal([...menuNode.querySelectorAll('button')].find(b=>b.textContent==='Delete').ariaLabel,'Delete empty chapter Night');await c.click('Delete',menuNode);await c.click('Confirm delete',chapterGroup('Night'));
  await c.wait(()=>applied(from,'deleteChapter'));await c.settle();
  c.assert.deepEqual(c.workspace().chapters.map(ch=>ch.id),[firstChapter.id]);
  after=await c.snapshot();c.assert.deepEqual(c.hashes(c.rpy(after)),c.hashes(c.rpy(before)),'The scene and chapter leave no file behind');
  // + New scene… in an option's scene sheet creates the scene and sends that option there.
  // It writes last, so the harness's Undo and Redo after this case reverse source.
  const first=beatIn(c,'Choices',b=>b.payload.type==='choice'&&b.payload.options[0]?.text==='By the window');c.assert(first);
  await openScene(c,'Choices');before=await c.snapshot();await select(c,first.id);from=c.requests().length;
  await c.click('Change where option 3 goes: Variables',card(c,first.id));
  await c.click('+ New scene…',c.document.querySelector('.scene-workspace .story-sheet'));
  const sceneDialog=()=>c.document.querySelector('.scene-workspace .story-new-scene');c.assert(sceneDialog());
  c.enter(sceneDialog().querySelector('input[aria-label="Scene name"]'),'Night bus');await c.click('Create scene and link option 3',sceneDialog());
  await c.wait(()=>applied(from,'createSceneFromChoice')&&!sceneDialog());await c.settle();
  const night=byName(c,'Night bus');c.assert.equal(night?.chapterId,byName(c,'Choices').chapterId);
  after=await c.snapshot();
  c.assert.equal(c.sourceText(after,path('Choices')),replaceOnce(c,c.sourceText(before,path('Choices')),`jump ${byName(c,'Variables').technicalLabel}\n`,`jump ${night.technicalLabel}\n`));
  c.assert(c.sourceText(after,night.sourcePath).startsWith(`label ${night.technicalLabel}:`));
  othersKept(before,after,[path('Choices'),night.sourcePath]);
 },
};
