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
];
const scene=c=>c.workspace().scenes.find(s=>s.id===c.workspace().entrySceneId);
// The scene Story shows, read from the selected row in the actual scene tree.
const shownScene=c=>{const name=c.document.querySelector('.tree-scene-row.selected .tree-scene-open')?.textContent;return c.workspace().scenes.find(s=>s.displayName===name)?.id;};
// Story Combined: a beat is a Tracks column; its editor sits beside the stage. Nested
// beats show once the Branch path opens their branches.
const shownBeats=c=>(c.workspace().scenes.find(s=>s.id===shownScene(c))??scene(c)).beats;
const findRow=(c,id)=>[...c.document.querySelectorAll('.scene-workspace .story-tracks [data-beat-id]')].find(node=>node.dataset.beatId===id);
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
const guard=async(c,choice,index,value)=>{
 await select(c,choice.id);const editor=card(c,choice.id);const option=editor.querySelectorAll('.choice-option')[index];c.assert(option);
 c.enter(option.querySelector('[aria-label="Condition value"]'),value);
 await c.click('Commit Beat',editor);await c.wait(accepted(c,choice.id));
};
const headers=s=>s.beats.filter(b=>b.conditionalBranch&&!b.owner);
const authored={};
// A condition's editor, by its group.
const group=async(c,id)=>{const node=nodeOf(c,id);c.assert(node,`Missing actual condition group ${id}`);return pick(c,node.id);};
// A branch's section of its condition's editor: the branch opens in the Branch path first.
const branchBody=async(c,id)=>{const header=shownBeats(c).find(b=>b.id===id);c.assert(header);reveal(c,id);openBranch(c,id);const editor=await pick(c,nodeOf(c,header.conditionalBranch.groupId).id);const section=editor.querySelector(`.story-branch-editor[data-branch-id="${id}"]`);c.assert(section,`Missing branch editor ${id}`);return section;};
const panel=(c,title)=>{const node=c.document.querySelector(`.story-operation[aria-label="${title}"]`);c.assert(node,`Missing actual operation ${title}`);return node;};
const openHeader=async(c,id)=>{const section=await branchBody(c,id);await c.wait(()=>section.querySelector('.story-operation'));return section.querySelector('.story-operation');};
const applyOperation=async(c,scope,label,type)=>{
 const at=c.requests().length;await c.click(label,scope);
 await c.wait(()=>c.requests().slice(at).some(r=>r.request.operation==='scene.apply'&&r.request.payload.command.type===type));
 await c.settle();c.assert(c.lastMutation()?.response.ok,`Actual ${type} transaction must pass`);
};
const replaceOnce=(c,text,old,next)=>{c.assert.equal(text.split(old).length,2,`Expected unique byte oracle: ${old}`);return text.replace(old,next);};
const bodyRef=header=>({type:'branch',groupId:header.conditionalBranch.groupId,branchId:header.id});
const conditionType=(c,scope,value)=>{const expression=scope.querySelector('.condition-expression');c.assert(expression);c.enter(expression.querySelector(':scope > label select[aria-label="Condition type"]'),value,'change');return expression;};
const compare=(c,expression,name,operator,value)=>{
 const variable=c.workspace().authoring.variables.find(v=>v.technicalName===name);c.assert(variable);
 c.enter(expression.querySelector('[aria-label="Condition Variable"]'),variable.id,'change');
 c.enter(expression.querySelector('[aria-label="Condition operator"]'),operator,'change');
 c.enter(expression.querySelector('[aria-label="Condition value"]'),value,variable.variableType==='bool'?'change':'input');
};
const addNarration=async(c,header,value)=>{
 const before=c.workspace();await c.click(`Add Beat to ${header.conditionalBranch.otherwise?'Otherwise':header.conditionalBranch.ordinal?'Else If':'If'}`,await branchBody(c,header.id));
 const draft=c.document.querySelector('.new-beat');c.assert(draft);c.enter(draft.querySelector(':scope > .field select'),'narration','change');c.enter(draft.querySelector('textarea'),value);
 await applyOperation(c,draft,'Add Beat','insertBodyBeat');const cmd=envelope(c,before,'insertBodyBeat');c.assert.deepEqual(cmd.body,bodyRef(header));
 return scene(c).beats.find(b=>b.payload.text===value);
};
const newHeaders=c=>scene(c).beats.filter(b=>b.conditionalBranch?.groupId===authored.groupId);
const previewBoundary=(c,beat)=>{c.assert(beat);const number=row(c,beat.id).querySelector('.story-lane-0').textContent;c.assert(c.document.querySelector('.story-stage-status').textContent.startsWith(`Through ${number} ·`),`Stage previews through ${number}`);};
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
  await c.click('Add Beat to If',await branchBody(c,header.id));
  const panel=c.document.querySelector('.new-beat');c.assert(panel);c.assert.match(panel.querySelector('.story-insertion').textContent,/If/);
  c.enter(panel.querySelector(':scope > .field select'),'narration','change');
  c.enter(panel.querySelector('textarea'),'Inserted branch café 雪');
  c.enter(panel.querySelector(':scope > .field select'),'call','change');
  c.enter(panel.querySelector(':scope > .field select'),'narration','change');
  c.assert.equal(panel.querySelector('textarea').value,'Inserted branch café 雪');
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
  await c.click('Add Condition',c.document.querySelector('.scene-workspace .scene-history'));let form=panel(c,'Add Condition');
  const expression=conditionType(c,form,'and');let children=expression.querySelector('.condition-combination').querySelectorAll(':scope > .condition-expression');c.assert.equal(children.length,2);
  compare(c,children[0],'precision','greaterEqual','9007199254740993');
  c.enter(children[1].querySelector(':scope > label select[aria-label="Condition type"]'),'not','change');
  const operand=children[1].querySelector('.condition-combination > .condition-expression');
  c.enter(operand.querySelector(':scope > label select[aria-label="Condition type"]'),'bool','change');c.enter(operand.querySelector('[aria-label="Condition value"]'),'false','change');
  await applyOperation(c,form,'Create Condition','insertCondition');const cmd=envelope(c,before,'insertCondition');
  c.assert.deepEqual(cmd.body,{type:'root'});c.assert.equal(cmd.condition.expression.type,'and');c.assert.equal(cmd.condition.expression.left.right.value,'9007199254740993');c.assert.equal(cmd.condition.expression.right.type,'not');
  let current=scene(c),header=current.beats.find(b=>b.conditionalBranch&&!oldIds.includes(b.id));c.assert(header);authored.groupId=header.conditionalBranch.groupId;authored.headerId=header.id;
  let expected=replaceOnce(c,original,'    return\n','    if ((precision >= 9007199254740993) and not False):\n        pass\n    return\n');
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);c.assert(current.beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===header.id));
  before=c.workspace();form=await openHeader(c,header.id);const simple=conditionType(c,form,'bool');c.enter(simple.querySelector('[aria-label="Condition value"]'),'false','change');
  await applyOperation(c,form,'Apply condition','updateConditionBranch');const update=envelope(c,before,'updateConditionBranch');c.assert.equal(update.branchId,header.id);c.assert.deepEqual(update.expectedBody,{type:'root'});
  expected=replaceOnce(c,expected,'    if ((precision >= 9007199254740993) and not False):\n','    if False:\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  before=c.workspace();await c.click('Add Else If',await group(c,authored.groupId));form=panel(c,'Add Else If');
  compare(c,form.querySelector('.condition-expression'),'mood','equal','ready');c.enter(form.querySelector('[aria-label="Branch position"]'),'end','change');
  await applyOperation(c,form,'Create Else If','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').beforeBranchId,null);
  expected=replaceOnce(c,expected,'    if False:\n        pass\n','    if False:\n        pass\n    elif (mood == "ready"):\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  before=c.workspace();await c.click('Add Otherwise',await group(c,authored.groupId));form=panel(c,'Add Otherwise');
  await applyOperation(c,form,'Create Otherwise','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').condition,null);
  expected=replaceOnce(c,expected,'    elif (mood == "ready"):\n        pass\n','    elif (mood == "ready"):\n        pass\n    else:\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  c.assert.equal(newHeaders(c).length,3);c.assert([...c.document.querySelectorAll('.story-branch-group')].some(item=>item.dataset.branchOwner===authored.headerId&&[...item.querySelectorAll('.story-branch-segment')].some(segment=>segment.textContent==='Otherwise')));
  const elseif=newHeaders(c).find(b=>b.conditionalBranch.ordinal===1);before=c.workspace();form=await openHeader(c,elseif.id);compare(c,form.querySelector('.condition-expression'),'mood','equal','blocked');
  await applyOperation(c,form,'Apply condition','updateConditionBranch');c.assert.equal(envelope(c,before,'updateConditionBranch').branchId,elseif.id);
  expected=replaceOnce(c,expected,'elif (mood == "ready")','elif (mood == "blocked")');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  // Cancel resets the branch's clean edit form; its branch action then replaces that clean form.
  form=await openHeader(c,elseif.id);await c.click('Cancel',form);
  before=c.workspace();await c.click('Delete branch',await branchBody(c,elseif.id));form=panel(c,'Delete branch');await applyOperation(c,form,'Delete this branch','removeConditionBranch');
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
  // Create and remove an actual nested condition using its explicit branch body.
  before=c.workspace();await c.click('Add Condition to Otherwise',await branchBody(c,focusBranch.id));form=panel(c,'Add Condition');const nestedExpr=conditionType(c,form,'bool');c.enter(nestedExpr.querySelector('[aria-label="Condition value"]'),'true','change');
  const priorIds=scene(c).beats.map(b=>b.id);await applyOperation(c,form,'Create Condition','insertCondition');c.assert.deepEqual(envelope(c,before,'insertCondition').body,bodyRef(focusBranch));
  const nestedHeader=scene(c).beats.find(b=>b.conditionalBranch&&!priorIds.includes(b.id));c.assert(nestedHeader);c.assert.deepEqual(nestedHeader.owner,{groupId:authored.groupId,branchId:focusBranch.id});
  const nestedBytes=replaceOnce(c,expected,'    if False:\n        pass\n    else:\n        pass\n','    if False:\n        pass\n    else:\n        if True:\n            pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),nestedBytes);
  before=c.workspace();await c.click('Delete condition',await group(c,nestedHeader.conditionalBranch.groupId));form=panel(c,'Delete entire condition');await applyOperation(c,form,'Delete entire condition','removeStoryNode');c.assert.deepEqual(envelope(c,before,'removeStoryNode').expectedBody,bodyRef(focusBranch));
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
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
  const block='    if False:\n        "Movable subtree leaf"\n    else:\n        "Other subtree branch"\n';
  const filled=c.sourceText(await c.snapshot(),s.sourcePath);c.assert.equal(filled,replaceOnce(c,original,'    if False:\n        pass\n    else:\n        pass\n',block));
  const groupMembers=scene(c).beats.filter(b=>b.conditionalBranch?.groupId===authored.groupId||b.owner?.groupId===authored.groupId).map(b=>b.id);
  const originalElse=headers(scene(c)).find(b=>b.conditionalBranch.otherwise&&b.conditionalBranch.groupId!==authored.groupId);c.assert(originalElse);
  before=c.workspace();await c.click('Move to…',await pick(c,authored.headerId));let form=panel(c,'Move story content');c.enter(form.querySelector('[aria-label="Destination body"]'),originalElse.id,'change');c.enter(form.querySelector('[aria-label="Destination position"]'),'end','change');
  await applyOperation(c,form,'Move to destination','moveStoryNode');let command=envelope(c,before,'moveStoryNode');c.assert.deepEqual(command.node,{type:'condition',groupId:authored.groupId});c.assert.deepEqual(command.expectedBody,{type:'root'});c.assert.deepEqual(command.body,bodyRef(originalElse));
  const indented=block.split('\n').map(line=>line?'    '+line:line).join('\n');const movedText=replaceOnce(c,replaceOnce(c,filled,block,''),'    else:\n        pass\n','    else:\n'+indented);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),movedText);c.assert.deepEqual(scene(c).beats.filter(b=>groupMembers.includes(b.id)).map(b=>b.id),groupMembers);
  c.assert.deepEqual(scene(c).beats.find(b=>b.id===authored.headerId).owner,{groupId:originalElse.conditionalBranch.groupId,branchId:originalElse.id});
  before=c.workspace();await c.click('Move to…',await pick(c,authored.headerId));form=panel(c,'Move story content');c.enter(form.querySelector('[aria-label="Destination body"]'),'root','change');
  const terminal=scene(c).beats.find(b=>b.payload.type==='return'&&!b.owner);c.enter(form.querySelector('[aria-label="Destination position"]'),terminal.id,'change');
  await applyOperation(c,form,'Move to destination','moveStoryNode');command=envelope(c,before,'moveStoryNode');c.assert.deepEqual(command.expectedBody,bodyRef(originalElse));c.assert.deepEqual(command.body,{type:'root'});
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),filled);c.assert(!scene(c).beats.find(b=>b.id===authored.headerId).owner);
  c.assert(scene(c).beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===originalElse.id));unchangedOtherSources(c,bytes,await c.snapshot(),s.sourcePath);
 },
 [names[5]]:async c=>{
  let before=c.workspace(),s=scene(c),bytes=await c.snapshot(),original=c.sourceText(bytes,s.sourcePath);
  const block='    if False:\n        "Movable subtree leaf"\n    else:\n        "Other subtree branch"\n';
  const opaqueBlock=replaceOnce(c,block,'        "Movable subtree leaf"\n','        "Movable subtree leaf"\n        python:\n            opaque_deleted = "kept"\n');
  const withOpaque=replaceOnce(c,original,block,opaqueBlock);await editSource(c,withOpaque);before=c.workspace();
  const members=scene(c).beats.filter(b=>b.owner?.groupId===authored.groupId&&!b.conditionalBranch&&!b.structuralPlaceholder);
  c.assert.equal(members.length,4);c.assert.equal(newHeaders(c).length,2);
  c.assert.deepEqual(members.map(b=>b.payload.type),['narration','customCode','customCode','narration']);
  c.assert.deepEqual(members.filter(b=>b.payload.type==='narration').map(b=>b.payload.text),['Movable subtree leaf','Other subtree branch']);
  const opaque=members.filter(b=>b.payload.type==='customCode');c.assert.equal(opaque.length,2);
  for(const beat of opaque){c.assert(beat.protected);c.assert.deepEqual(beat.owner,members[0].owner);}
  const acceptedBytes=Buffer.from(withOpaque,'utf8');
  c.assert.deepEqual(opaque.map(b=>acceptedBytes.subarray(b.byteStart,b.byteEnd).toString('utf8')),['        python:\n','            opaque_deleted = "kept"\n']);
  c.assert.match((await group(c,authored.groupId)).querySelector('.story-condition-summary').textContent,/2 branches \/ 4 Beats/);
  await c.click('Delete condition',await group(c,authored.groupId));let form=panel(c,'Delete entire condition');
  c.assert.match(form.textContent,/all 4 contained Beats/);c.assert(form.textContent.includes(`all ${members.length} contained Beats`));await applyOperation(c,form,'Delete entire condition','removeStoryNode');
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
  // Only the game's choice menu overlays the stage, and it is read-only.
  c.assert.equal(c.document.querySelector('.preview-choice-summary')?.parentElement,c.document.querySelector('.preview-canvas'));c.assert.equal(c.document.querySelectorAll('.preview-choice-summary button').length,0);previewBoundary(c,choice);
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
  const addBeat=async kind=>{await c.click('Add Beat',c.document.querySelector('.scene-workspace .scene-history'));await c.wait(newBeat);
   c.enter(newBeat().querySelector(':scope > .field select'),kind,'change');await c.settle();return newBeat();};
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
  c.assert.equal(status(),`Nothing saved. 1 of 3 drafts needs changes:${entry.displayName} 1`);c.assert.equal(sceneMark('Called scene'),undefined);
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
  const placed=await addBeat('narration');c.enter(placed.querySelector('[aria-label="Insert before"]'),anchor.id,'change');c.enter(placed.querySelector('textarea'),'Story Save placed');await c.settle();
  await c.raw({driver:'externalRemove',path:entry.sourcePath,remove:'    "Nothing available"\n'});const removed=await c.snapshot();
  const conflict=await save();
  c.assert.equal(conflict.find(r=>r.request.operation==='scene.saveDrafts')?.errorCode,'SOURCE_CONFLICT');
  c.assert.deepEqual(c.hashes(c.rpy(await c.snapshot())),c.hashes(c.rpy(removed)),'A conflicting Story Save writes nothing');
  c.assert.equal(status(),`Story changed in source and was refreshed. Nothing saved. 1 of 4 drafts needs changes:${entry.displayName} 1`);
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
  const buttons=scope=>[...scope.querySelectorAll('button')].filter(x=>!x.hidden&&!x.closest('[hidden]')).map(x=>x.textContent);
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
};
