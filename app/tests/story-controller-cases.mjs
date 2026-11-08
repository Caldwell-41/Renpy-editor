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
];
const scene=c=>c.workspace().scenes.find(s=>s.id===c.workspace().entrySceneId);
const findRow=(c,id)=>c.document.querySelector(`.scene-workspace [data-beat-id="${id}"]`);
const row=(c,id)=>{const node=findRow(c,id);c.assert(node);return node;};
const text=c=>async()=>c.sourceText(await c.snapshot(),scene(c).sourcePath);
const source=c=>async()=>c.call('source.open',{path:scene(c).sourcePath});
const select=async(c,id)=>{row(c,id).querySelector('.beat-select').click();await c.wait(()=>row(c,id).querySelector('.expanded-beat'));};
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
 await select(c,choice.id);const card=row(c,choice.id);const option=card.querySelectorAll('.choice-option')[index];c.assert(option);
 c.enter(option.querySelector('[aria-label="Condition value"]'),value);
 await c.click('Commit Beat',card);await c.wait(()=>c.lastMutation()?.response.ok&&!row(c,choice.id).querySelector('.expanded-beat'));
};
const headers=s=>s.beats.filter(b=>b.conditionalBranch&&!b.owner);
const authored={};
const group=(c,id)=>{const node=c.document.querySelector(`[data-condition-group-id="${id}"]`);c.assert(node,`Missing actual condition group ${id}`);return node;};
const branchBody=(c,id)=>{const node=c.document.querySelector(`.story-branch-body[data-branch-id="${id}"]`);c.assert(node);return node;};
const panel=(c,title)=>{const node=c.document.querySelector(`.story-operation[aria-label="${title}"]`);c.assert(node,`Missing actual operation ${title}`);return node;};
const openHeader=async(c,id)=>{row(c,id).querySelector('.beat-select').click();await c.wait(()=>row(c,id).querySelector('.story-operation'));return row(c,id).querySelector('.story-operation');};
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
 const before=c.workspace();await c.click(`Add Beat to ${header.conditionalBranch.otherwise?'Otherwise':header.conditionalBranch.ordinal?'Else If':'If'}`,branchBody(c,header.id));
 const draft=c.document.querySelector('.new-beat');c.assert(draft);c.enter(draft.querySelector(':scope > .field select'),'narration','change');c.enter(draft.querySelector('textarea'),value);
 await applyOperation(c,draft,'Add Beat','insertBodyBeat');const cmd=envelope(c,before,'insertBodyBeat');c.assert.deepEqual(cmd.body,bodyRef(header));
 return scene(c).beats.find(b=>b.payload.text===value);
};
const newHeaders=c=>scene(c).beats.filter(b=>b.conditionalBranch?.groupId===authored.groupId);
const previewBoundary=(c,beat)=>{c.assert(beat);const ordinal=scene(c).beats.findIndex(item=>item.id===beat.id)+1;c.assert.equal(c.document.querySelector('.preview-header > span').textContent,`Through Beat ${ordinal}`);};
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
 await c.wait(()=>c.session()===owner&&c.workspace().lastOpen.sceneId===sceneId&&c.document.querySelector('.scene-workspace .beat-card')&&c.requests().slice(from).some(r=>r.request.operation==='scene.list'&&r.request.payload.sessionId===owner&&r.responseOk));await c.settle();
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
  await select(c,unknownChoice.id);const card=row(c,unknownChoice.id);
  c.assert(card.querySelector('.expanded-beat.protected-code'));c.assert(!card.querySelector('input,textarea,select'));
  c.assert.match(card.textContent,/unsupported condition.*Edit it in Source/);
  for(const button of card.querySelectorAll('.beat-controls button'))c.assert(button.disabled,'Unknown Choice authoring controls must be disabled');
  c.assert(![...card.querySelectorAll('button')].some(b=>b.textContent==='Commit Beat'));
  c.key(card.querySelector('.beat-select'),'ArrowUp',{altKey:true});await c.settle();
  c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),unknown);await editSource(c,supported);
 },
 [names[1]]:async c=>{
  const before=c.workspace(),s=scene(c),call=s.beats.find(b=>b.payload.type==='call');c.assert(call);
  const destination=before.scenes.find(s=>s.displayName==='High ending');c.assert(destination);
  const oldDestination=before.scenes.find(s=>s.id===call.payload.sceneId);const savedLabel=call.payload.returnLabel;
  const bytes=await c.snapshot();const original=c.sourceText(bytes,s.sourcePath);
  await select(c,call.id);const card=row(c,call.id);c.enter(card.querySelector('[aria-label="Call destination Scene"]'),destination.id,'change');
  await c.click('Commit Beat',card);await c.wait(()=>c.lastMutation()?.response.ok&&!row(c,call.id).querySelector('.expanded-beat'));
  const command=envelope(c,before,'updateBodyBeat');c.assert.deepEqual(command.expectedBody,{type:'root'});
  c.assert.equal(command.beat.sceneId,destination.id);c.assert.equal(command.beat.returnLabel,savedLabel);
  const after=await c.snapshot();c.assert.equal(c.sourceText(after,s.sourcePath),original.replace(`call ${oldDestination.technicalLabel} from ${savedLabel}`,`call ${destination.technicalLabel} from ${savedLabel}`));
  c.assert.equal(scene(c).beats.find(b=>b.id===call.id).payload.returnLabel,savedLabel);unchangedOtherSources(c,bytes,after,s.sourcePath);
  const flow=await c.call('flow.list',{refresh:true}),edge=flow.edges.find(e=>e.kind==='call'&&e.beatId===call.id);c.assert(edge?.continuation?.location);
  await select(c,call.id);await c.click('Open called Scene',row(c,call.id));await c.wait(()=>c.workspace().lastOpen.sceneId===destination.id&&c.document.querySelector('.scene-workspace .beat-card'));await c.settle();
  c.assert([...c.document.querySelectorAll('.scene-workspace button')].some(b=>b.textContent==='Back to caller'));
  await c.click('Back to caller');await c.wait(()=>c.workspace().lastOpen.sceneId===s.id&&findRow(c,call.id)?.classList.contains('selected'));await c.settle();
  await c.click('View Call continuation',row(c,call.id));await c.wait(()=>c.document.querySelector(`.beat-card.selected[data-beat-id="${edge.continuation.beatId}"]`));await c.settle();
  const continuation=scene(c).beats.find(b=>b.id===edge.continuation.beatId);c.assert.equal(continuation.payload.text,'Caller resumed');c.assert(!continuation.owner);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(after));
 },
 [names[2]]:async c=>{
  const before=c.workspace(),s=scene(c),header=headers(s).find(b=>b.conditionalBranch.ordinal===0);c.assert(header);
  const body={type:'branch',groupId:header.conditionalBranch.groupId,branchId:header.id};const bytes=await c.snapshot();
  const original=c.sourceText(bytes,s.sourcePath);const originalIds=s.beats.map(b=>b.id);
  await c.click('Add Beat to If',c.document.querySelector(`.story-branch-body[data-branch-id="${header.id}"]`));
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
  c.assert.equal(row(c,added.id).closest('.story-branch-body').dataset.branchId,header.id);unchangedOtherSources(c,bytes,after,s.sourcePath);
 },
 [names[3]]:async c=>{
  let before=c.workspace(),bytes=await c.snapshot(),original=c.sourceText(bytes,scene(c).sourcePath);const oldIds=scene(c).beats.map(b=>b.id);
  await c.click('Add Condition',c.document.querySelector('.beats-tools'));let form=panel(c,'Add Condition');
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
  before=c.workspace();await c.click('Add Else If',group(c,authored.groupId).querySelector('.story-group-heading'));form=panel(c,'Add Else If');
  compare(c,form.querySelector('.condition-expression'),'mood','equal','ready');c.enter(form.querySelector('[aria-label="Branch position"]'),'end','change');
  await applyOperation(c,form,'Create Else If','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').beforeBranchId,null);
  expected=replaceOnce(c,expected,'    if False:\n        pass\n','    if False:\n        pass\n    elif (mood == "ready"):\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  before=c.workspace();await c.click('Add Otherwise',group(c,authored.groupId).querySelector('.story-group-heading'));form=panel(c,'Add Otherwise');
  await applyOperation(c,form,'Create Otherwise','addConditionBranch');c.assert.equal(envelope(c,before,'addConditionBranch').condition,null);
  expected=replaceOnce(c,expected,'    elif (mood == "ready"):\n        pass\n','    elif (mood == "ready"):\n        pass\n    else:\n        pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  c.assert.equal(newHeaders(c).length,3);c.assert(group(c,authored.groupId).querySelector('.story-group-heading').textContent.includes('Otherwise'));
  const elseif=newHeaders(c).find(b=>b.conditionalBranch.ordinal===1);before=c.workspace();form=await openHeader(c,elseif.id);compare(c,form.querySelector('.condition-expression'),'mood','equal','blocked');
  await applyOperation(c,form,'Apply condition','updateConditionBranch');c.assert.equal(envelope(c,before,'updateConditionBranch').branchId,elseif.id);
  expected=replaceOnce(c,expected,'elif (mood == "ready")','elif (mood == "blocked")');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  row(c,elseif.id).querySelector('.beat-select').click();await c.wait(()=>row(c,elseif.id).querySelector('.story-operation'));
  await c.click('Cancel',row(c,elseif.id).querySelector('.story-operation'));row(c,elseif.id).querySelector('.beat-select').click();await c.wait(()=>row(c,elseif.id).querySelector('button'));
  // Opening a clean header edit permits its branch action; prepareOperation replaces that clean form.
  before=c.workspace();await c.click('Delete branch',row(c,elseif.id));form=panel(c,'Delete branch');await applyOperation(c,form,'Delete this branch','removeConditionBranch');
  c.assert.equal(envelope(c,before,'removeConditionBranch').branchId,elseif.id);
  expected=replaceOnce(c,expected,'    elif (mood == "blocked"):\n        pass\n','');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
  c.assert.deepEqual(newHeaders(c).map(b=>b.id),[header.id,newHeaders(c).find(b=>b.conditionalBranch.otherwise).id]);
  unchangedOtherSources(c,bytes,await c.snapshot(),current.sourcePath);
  const controlsAt=c.requests().length,controlBytes=await c.snapshot();
  await c.click('Collapse condition',group(c,authored.groupId).querySelector('.story-group-heading'));c.assert(group(c,authored.groupId).querySelector('.story-branches').hidden);
  await c.click('Expand condition',group(c,authored.groupId).querySelector('.story-group-heading'));c.assert(!group(c,authored.groupId).querySelector('.story-branches').hidden);
  const focusBranch=newHeaders(c).find(b=>b.conditionalBranch.otherwise);await c.click('Focus this branch',branchBody(c,focusBranch.id));c.assert(c.document.querySelector('.story-breadcrumb').textContent.includes('Otherwise'));
  c.assert([...c.document.querySelectorAll('.beats-list > *')].some(node=>node.hidden));await c.click('Show whole Scene');c.assert(!group(c,authored.groupId).querySelector('.story-branches').hidden);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(controlBytes));c.assert.equal(c.requests().slice(controlsAt).filter(r=>r.request.operation==='scene.apply').length,0);
  // Create and remove an actual nested condition using its explicit branch body.
  before=c.workspace();await c.click('Add Condition to Otherwise',branchBody(c,focusBranch.id));form=panel(c,'Add Condition');const nestedExpr=conditionType(c,form,'bool');c.enter(nestedExpr.querySelector('[aria-label="Condition value"]'),'true','change');
  const priorIds=scene(c).beats.map(b=>b.id);await applyOperation(c,form,'Create Condition','insertCondition');c.assert.deepEqual(envelope(c,before,'insertCondition').body,bodyRef(focusBranch));
  const nestedHeader=scene(c).beats.find(b=>b.conditionalBranch&&!priorIds.includes(b.id));c.assert(nestedHeader);c.assert.deepEqual(nestedHeader.owner,{groupId:authored.groupId,branchId:focusBranch.id});
  const nestedBytes=replaceOnce(c,expected,'    if False:\n        pass\n    else:\n        pass\n','    if False:\n        pass\n    else:\n        if True:\n            pass\n');c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),nestedBytes);
  before=c.workspace();await c.click('Delete condition',group(c,nestedHeader.conditionalBranch.groupId).querySelector('.story-group-heading'));form=panel(c,'Delete entire condition');await applyOperation(c,form,'Delete entire condition','removeStoryNode');c.assert.deepEqual(envelope(c,before,'removeStoryNode').expectedBody,bodyRef(focusBranch));
  c.assert.equal(c.sourceText(await c.snapshot(),current.sourcePath),expected);
 },
 [names[4]]:async c=>{
  let before=c.workspace(),s=scene(c),bytes=await c.snapshot(),original=c.sourceText(bytes,s.sourcePath);
  const inserted=s.beats.find(b=>b.payload.text==='Inserted branch café 雪');c.assert(inserted);const firstBody={type:'branch',...inserted.owner};
  const selectButton=row(c,inserted.id).querySelector('.beat-select');c.key(selectButton,'ArrowUp',{altKey:true});
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
  before=c.workspace();await c.click('Move to…',row(c,authored.headerId));let form=panel(c,'Move story content');c.enter(form.querySelector('[aria-label="Destination body"]'),originalElse.id,'change');c.enter(form.querySelector('[aria-label="Destination position"]'),'end','change');
  await applyOperation(c,form,'Move to destination','moveStoryNode');let command=envelope(c,before,'moveStoryNode');c.assert.deepEqual(command.node,{type:'condition',groupId:authored.groupId});c.assert.deepEqual(command.expectedBody,{type:'root'});c.assert.deepEqual(command.body,bodyRef(originalElse));
  const indented=block.split('\n').map(line=>line?'    '+line:line).join('\n');const movedText=replaceOnce(c,replaceOnce(c,filled,block,''),'    else:\n        pass\n','    else:\n'+indented);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),movedText);c.assert.deepEqual(scene(c).beats.filter(b=>groupMembers.includes(b.id)).map(b=>b.id),groupMembers);
  c.assert.deepEqual(scene(c).beats.find(b=>b.id===authored.headerId).owner,{groupId:originalElse.conditionalBranch.groupId,branchId:originalElse.id});
  before=c.workspace();await c.click('Move to…',row(c,authored.headerId));form=panel(c,'Move story content');c.enter(form.querySelector('[aria-label="Destination body"]'),'root','change');
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
  c.assert.match(group(c,authored.groupId).querySelector('.story-group-heading').textContent,/2 branches \/ 4 Beats/);
  await c.click('Delete condition',group(c,authored.groupId).querySelector('.story-group-heading'));let form=panel(c,'Delete entire condition');
  c.assert.match(form.textContent,/all 4 contained Beats/);c.assert(form.textContent.includes(`all ${members.length} contained Beats`));await applyOperation(c,form,'Delete entire condition','removeStoryNode');
  c.assert.deepEqual(envelope(c,before,'removeStoryNode').node,{type:'condition',groupId:authored.groupId});c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,withOpaque,opaqueBlock,''));c.assert.equal(newHeaders(c).length,0);
  await c.click('Undo');await c.wait(()=>c.lastMutation()?.request.payload.command.type==='undo'&&c.lastMutation().response.ok);await c.settle();c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),withOpaque);
  await editSource(c,original);
  before=c.workspace();const leaf=scene(c).beats.find(b=>b.id===authored.leafId);c.assert(leaf);await c.click('Delete',row(c,leaf.id));form=panel(c,'Delete Beat');await applyOperation(c,form,'Delete this Beat','removeStoryNode');
  c.assert.deepEqual(envelope(c,before,'removeStoryNode').expectedBody,{type:'branch',...leaf.owner});c.assert(scene(c).beats.some(b=>b.structuralPlaceholder&&b.owner?.branchId===leaf.owner.branchId));
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,original,'        "Movable subtree leaf"\n','        pass\n'));
  await c.click('Undo');await c.wait(()=>c.lastMutation()?.request.payload.command.type==='undo'&&c.lastMutation().response.ok);await c.settle();c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),original);
  before=c.workspace();const selected=newHeaders(c).find(b=>b.conditionalBranch.otherwise);await c.click('Unwrap…',group(c,authored.groupId).querySelector('.story-group-heading'));form=panel(c,'Unwrap one branch');
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
  await select(c,choice.id);const card=row(c,choice.id),pending=card.querySelector('[aria-label="Choice option text"]');c.enter(pending,'Preview preserves unfinished input');
  const selector=c.document.querySelector(`select[data-preview-group-id="${root.conditionalBranch.groupId}"]`);c.assert(selector);c.assert.equal(selector.value,'');
  previewBoundary(c,root);c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('Caller resumed'));c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('Nothing available'));
  c.assert(!c.document.querySelector('.preview-details').textContent.includes('Variable trust = 9'));c.assert(!c.document.querySelector('.preview-details').textContent.includes('Variable trust = 42'));c.assert(!c.document.querySelector('.preview-details').textContent.includes('Variable trust = 77'));c.assert.equal(c.document.querySelector('.preview-empty').textContent,'Background unknown after code or unevaluated flow');
  c.enter(selector,root.id,'change');c.assert.equal(pending.value,'Preview preserves unfinished input');c.assert(pending.isConnected&&!pending.disabled);
  c.assert.equal(c.document.querySelector('.preview-overlay').textContent,'Return / End');previewBoundary(c,s.beats.find(b=>b.payload.type==='return'&&b.owner?.branchId===root.id));
  c.assert(c.document.querySelector('.preview-details').textContent.includes('Variable trust = 9'));c.assert(!c.document.querySelector('.preview-details').textContent.includes('Variable trust = 42'));
  c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('After branch terminal'));
  c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('Caller resumed'));
  c.assert.match(c.document.querySelector('.illustrative-preview').textContent,/Manual selection.*not a playthrough/);c.assert.match(c.document.querySelector('.illustrative-preview').textContent,/Choice availability are not evaluated/);
  const otherwise=headers(s).find(b=>b.conditionalBranch.groupId===root.conditionalBranch.groupId&&b.conditionalBranch.otherwise);c.enter(c.document.querySelector(`select[data-preview-group-id="${root.conditionalBranch.groupId}"]`),otherwise.id,'change');c.assert.equal(pending.value,'Preview preserves unfinished input');
  c.assert(c.document.querySelector('.preview-overlay').classList.contains('choice'));previewBoundary(c,choice);
  c.assert(!c.document.querySelector('.preview-details').textContent.includes('Variable trust = 77'));
  c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('Nothing available'));
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(terminalBytes));c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  await c.click('Cancel',card);
  // A root Return before the menu independently proves that later root effects stay invisible.
  const rootTerminalFixture=replaceOnce(c,accepted,'    menu:\n','    return\n    "After root terminal"\n    menu:\n');
  await editSource(c,rootTerminalFixture);const rootNow=headers(scene(c)).find(b=>b.id===root.id);c.assert(rootNow);
  c.enter(c.document.querySelector(`select[data-preview-group-id="${rootNow.conditionalBranch.groupId}"]`),otherwise.id,'change');
  c.assert.equal(c.document.querySelector('.preview-overlay').textContent,'Return / End');previewBoundary(c,scene(c).beats.find(b=>b.payload.type==='return'&&!b.owner));
  c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('After root terminal'));c.assert(!c.document.querySelector('.preview-canvas').textContent.includes('Ready route'));
  c.assert.equal(c.sourceText(await c.snapshot(),path),rootTerminalFixture);await editSource(c,accepted);await openBranches(c,s.id);
  const flow=await c.call('flow.list',{refresh:true});const call=flow.edges.find(e=>e.sceneId===s.id&&e.kind==='call');c.assert(call?.location);
  await c.wait(()=>[...c.document.querySelector('[aria-label="Selected route"]').options].some(o=>o.value===call.id));c.enter(c.document.querySelector('[aria-label="Selected route"]'),call.id,'change');c.assert.match(c.document.querySelector('.branches-workspace').textContent,/Call Scene returns to its continuation/);
  await c.click('Open Scene');await c.wait(()=>c.document.querySelector(`.beat-card.selected[data-beat-id="${call.beatId}"]`));await c.settle();
  c.assert.equal(c.workspace().lastOpen.sceneId,s.id);c.assert.equal(scene(c).beats.find(b=>b.id===call.beatId).payload.type,'call');
  await openBranches(c,s.id,call.id);
  await c.click('Open continuation in Story');await c.wait(()=>c.document.querySelector(`.beat-card.selected[data-beat-id="${call.continuation.beatId}"]`));await c.settle();c.assert.equal(scene(c).beats.find(b=>b.id===call.continuation.beatId).payload.text,'Caller resumed');
  await openBranches(c,s.id);
  const bodyEdge=flow.edges.find(e=>e.sceneId===s.id&&e.destination.kind==='body'&&e.destination.owner);c.assert(bodyEdge?.destination.location);
  c.enter(c.document.querySelector('[aria-label="Selected route"]'),bodyEdge.id,'change');await c.click('Open destination body in Story');
  const body=bodyEdge.destination,targetId=body.beatId??body.owner.branchId;await c.wait(()=>c.document.querySelector(`.beat-card.selected[data-beat-id="${targetId}"]`));await c.settle();
  const target=scene(c).beats.find(b=>b.id===targetId);c.assert(target);c.assert(target.owner?.branchId===body.owner.branchId||target.id===body.owner.branchId);c.assert.equal(scene(c).sourceRevision,body.location.revision);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(bytes));await openBranches(c,s.id,call.id);
  const at=c.requests().length,sourceOwner=c.session();await c.click('View origin in Source');await c.wait(()=>c.session()===sourceOwner&&successfulOpen(c,at,call.location.path,sourceOwner)&&mountedSourceEditor(c,call.location.path));await c.settle();
  const request=c.requests().slice(at).find(r=>r.request.operation==='source.open'&&r.request.payload.expectedRevision);c.assert(request);
  c.assert.equal(request.request.payload.path,call.location.path);c.assert.equal(request.request.payload.expectedRevision,call.location.revision);c.assert.equal(request.request.payload.byteStart,call.location.byteStart);c.assert.equal(request.request.payload.byteEnd,call.location.byteEnd);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(bytes));await goStory(c);
 },
 [names[7]]:async c=>{
  const s=scene(c),choice=s.beats.find(b=>b.payload.type==='choice');const accepted=await c.snapshot();const from=c.requests().length;
  await select(c,choice.id);let card=row(c,choice.id);const input=card.querySelector('[aria-label="Choice option text"]');c.enter(input,'Cancelled intent');
  const draftTree=c.workspace().scenes.map(item=>[item.id,item.displayName]);const draftControls=treeControls(c);for(const control of draftControls){c.assert(!control.disabled);control.click();await c.settle();c.assert(!c.document.querySelector('.tree-inline'));c.assert.equal(input.value,'Cancelled intent');c.assert(input.isConnected);}
  c.assert.deepEqual(c.workspace().scenes.map(item=>[item.id,item.displayName]),draftTree);
  await c.click('Cancel',card);c.assert.deepEqual(await c.snapshot(),accepted);c.assert.equal(c.requests().slice(from).filter(r=>r.request.operation==='scene.apply').length,0);
  // Hold only a validated response to one actual UI request, after Host dispatch, to inspect pending locks.
  await select(c,choice.id);card=row(c,choice.id);const pendingCaption=card.querySelector('[aria-label="Choice option text"]');c.enter(pendingCaption,'Pending tree guard intent');
  const beforePending=c.workspace(),treeBefore=beforePending.scenes.map(item=>[item.id,item.displayName]);const controls=treeControls(c),at=c.requests().length;
  await c.pendingWrite('updateBodyBeat',()=>c.click('Commit Beat',card),async()=>{
   c.assert(pendingCaption.disabled&&pendingCaption.isConnected);c.assert.equal(pendingCaption.value,'Pending tree guard intent');
   for(const control of controls){c.assert(control.disabled,'Tree authoring controls must lock during the actual pending write');control.click();}
   c.assert(!c.document.querySelector('.tree-inline'));c.assert.deepEqual(c.workspace().scenes.map(item=>[item.id,item.displayName]),treeBefore);
  });
  await c.wait(()=>c.lastMutation()?.response.ok&&!row(c,choice.id).querySelector('.expanded-beat'));await c.settle();envelope(c,beforePending,'updateBodyBeat');
  c.assert.equal(c.requests().slice(at).filter(r=>r.request.operation==='scene.apply').length,1);
  c.assert.equal(c.sourceText(await c.snapshot(),s.sourcePath),replaceOnce(c,c.sourceText(accepted,s.sourcePath),'"Ready route" if (trust >= 6):','"Pending tree guard intent" if (trust >= 6):'));
  await c.click('Undo');await c.wait(()=>c.lastMutation()?.request.payload.command.type==='undo'&&c.lastMutation().response.ok);await c.settle();c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));
  const editor=await openSourceEditor(c,s.sourcePath);
  const retained=editor.value+'# retained unaccepted Source draft\n';c.enter(editor,retained);
  await c.wait(async()=> (await source(c)()).text===retained);const draft=await source(c)();c.assert(draft.draftVersion>0);c.assert.equal(draft.baseRevision,s.sourceRevision);
  await goStory(c);
  await select(c,choice.id);card=row(c,choice.id);const pending=card.querySelector('[aria-label="Choice option text"]');c.enter(pending,'Retained intent after Source refusal');
  const beforeDirtyRefusal=await c.snapshot();await c.click('Commit Beat',card);await c.wait(()=>c.lastMutation()&&!c.lastMutation().response.ok&&!pending.disabled);
  c.assert.equal(c.lastMutation().response.error.code,'DIRTY_SOURCE');c.assert.deepEqual(await c.snapshot(),beforeDirtyRefusal,'Dirty Source refusal must preserve all source, maps and project metadata');
  c.assert.equal(pending.value,'Retained intent after Source refusal');c.assert(pending.isConnected);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));c.assert.equal((await source(c)()).text,retained);
  await c.click('Cancel',card);await openSourceEditor(c,s.sourcePath);
  await c.click('Discard Draft',c.document.querySelector('.source-workspace'));
  const modal=c.document.querySelector('.source-discard-confirmation');c.assert(modal);
  const discardAt=c.requests().length;await c.click('Discard Draft',modal);await c.wait(()=>!c.document.querySelector('.source-discard-confirmation')&&mountedSourceEditor(c,s.sourcePath)&&c.requests().slice(discardAt).some(r=>r.request.operation==='source.discard'&&r.request.payload.path===s.sourcePath&&r.responseOk));await c.settle();c.assert.equal((await c.call('source.list')).dirtyCount,0);
  await goStory(c);
  c.assert.deepEqual(c.rpy(await c.snapshot()),c.rpy(accepted));
 },
 [names[8]]:async c=>{
  const before=c.workspace(),s=scene(c),choice=s.beats.find(b=>b.payload.type==='choice');const accepted=await c.snapshot();
  await select(c,choice.id);const card=row(c,choice.id);const input=card.querySelector('[aria-label="Choice option text"]');c.enter(input,'External refusal keeps this intent');
  const external=await c.raw({driver:'externalAppend',path:s.sourcePath});const externalSnapshot=await c.snapshot();
  c.assert.deepEqual(externalSnapshot[s.sourcePath],external.externalBytes);
  await c.click('Commit Beat',card);await c.wait(()=>c.lastMutation()&&!c.lastMutation().response.ok&&!input.disabled);
  const refused=c.lastMutation();c.assert.equal(refused.request.payload.expectedProjectRevision,before.projectRevision);
  c.assert.equal(refused.request.payload.expectedSourceMapRevision,before.sourceMapRevision);
  c.assert.equal(refused.request.payload.command.expectedSourceRevision,s.sourceRevision);
  c.assert.equal(refused.response.error.code,'SOURCE_CONFLICT');c.assert.equal(input.value,'External refusal keeps this intent');c.assert(input.isConnected);
  c.assert.deepEqual(await c.snapshot(),externalSnapshot,'Refusal must preserve exact external bytes and all project metadata');
  await c.click('Cancel',card);const editor=await openSourceEditor(c,s.sourcePath);c.assert(editor.value.includes('# ordinary external Story writer'));
  const saveAt=c.requests().length;await c.click('Save Source',c.document.querySelector('.app-header'));await c.wait(()=>mountedSourceEditor(c,s.sourcePath)&&c.requests().slice(saveAt).some(r=>r.request.operation==='project.flush'&&r.request.payload.sessionId===c.session()&&r.responseOk));await c.settle();
  await goStory(c);
  const refreshed=scene(c).beats.find(b=>b.id===choice.id);c.assert(refreshed);await select(c,refreshed.id);
  const freshCard=row(c,refreshed.id);c.enter(freshCard.querySelector('[aria-label="Choice option text"]'),'Fresh ordinary external revision');
  await c.click('Commit Beat',freshCard);await c.wait(()=>c.lastMutation()?.response.ok&&!row(c,refreshed.id).querySelector('.expanded-beat'));
  c.assert(c.sourceText(await c.snapshot(),s.sourcePath).includes('# ordinary external Story writer'));
  unchangedOtherSources(c,accepted,await c.snapshot(),s.sourcePath);
 },
};
