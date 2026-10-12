// Opt-in public synthetic fixture. Actual UI/IPC/HTTP; no bridge interception.
(async()=>{
 const details={action:'generateCard',stage:'open',checks:[],reviewedBodyDigests:[],layer:'packaged production Assist/IPC/native credential reader plus physical send/accept and layout observation'};
 const check=(ok,name)=>{if(!ok)throw Error(name);details.checks.push(name);};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Object.assign(Error(r.error.message),r.error);return r.value;};
 const read=(op,p={})=>window.__loomlightProbeRetryBusy(()=>call(op,p));
 const wait=async fn=>{const start=performance.now();while(!await fn()){if(performance.now()-start>20000)throw Error('Timeout at '+details.stage);await new Promise(r=>setTimeout(r,40));}};
 const find=window.__loomlightProbeFindButton,root=()=>document.querySelector('.rewrite-panel');
 const click=async label=>{await wait(()=>find(label)&&!find(label).disabled);find(label).click();};
 const input=(name,value)=>{const n=root().querySelector(`[name="${name}"]`);n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));};
 const snapshot=async()=>JSON.stringify(await read('probe.rewriteStage',{stage:'snapshot'}));
 const pause=async stage=>{details.stage=stage;await call('probe.rewriteStage',{stage,announce:true});const start=performance.now();while(!(await read('probe.rewriteStage',{stage})).done){if(performance.now()-start>180000)throw Error('Native observation timeout at '+stage);await new Promise(r=>setTimeout(r,200));}};
 let project,scene,beat;
 const p=()=>({sessionId:project.sessionId});
 const select=async()=>{const w=await read('scene.list',p());scene=w.scenes[0];beat=scene.beats.find(b=>b.payload.type==='narration');const card=document.querySelector(`.beat-card[data-beat-id="${beat.id}"]`);if(!card.classList.contains('selected'))card.querySelector('.beat-select').click();await click('Assist · Draft Character card');await wait(()=>root()?.dataset.busy==='false');const target=root().querySelector('[name="cardTarget"]');target.value=target.options[1].value;target.dispatchEvent(new Event('change'));input('draftSceneTitle','Native Card café 雪');};
 const choices=()=>{const c=[...root().querySelectorAll('fieldset input:not(:disabled)')];check(c.length===2,'Exact approved references available');for(const n of c){n.checked=true;n.dispatchEvent(new Event('change'));}};
 const prepare=async task=>{input('rewriteTask',task);await click('Review complete send');await wait(()=>!find('Generate proposal').disabled);details.reviewedBodyDigests.push(root().dataset.payloadDigest);return [...root().querySelectorAll('section')].find(s=>s.querySelector('h4')?.textContent==='Complete exact request body').querySelector('pre').textContent;};
 const generate=async task=>{await prepare(task);await click('Generate proposal');await wait(()=>root().dataset.busy==='false'&&root().dataset.active==='false');};
 const closeAssist=async()=>{await click('Discard proposal');await wait(()=>root().dataset.busy==='false');input('rewriteTask','');input('draftSceneTitle','');await click('Close Assist');await wait(()=>!root());};
 try{
  await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));project=await read('project.current');
  if(window.__loomlightRewritePhase===2){
   const w=await read('references.list',p()),record=w.document.cards[0],revision=record.revisions.find(v=>v.id===record.approvedRevisionId);
   check(revision.content.title==='Native Card café 雪'&&revision.content.description.includes('Unescaped [str(7)]')&&revision.status==='approved','Process reopen retains approved card and exact revision');
   check((await read('context.options',p())).cardPrompt.customized,'Process reopen retains custom prompt');
   const profiles=await read('ai.profiles');check(profiles.profiles.length===1&&profiles.profiles[0].credentialStatus==='configured','Process reopen retains native credential readability');
  }else{
   const before=await snapshot(),initial=await read('references.list',p()),old=initial.document.cards[0],prior=old.approvedRevisionId;
   const sourceHashes=s=>Object.fromEntries(Object.entries(JSON.parse(s).files).filter(([p])=>p.endsWith('.rpy')));
   await select();choices();const body=await prepare('Keep the meaning.');check(await snapshot()===before,'Preparation writes nothing');const v=JSON.parse(body),u=JSON.parse(v.messages[1].content);
   check(u.references.length===2&&v.messages[0].content==='Draft only the reviewed card; follow the response contract.'&&u.story.cardTarget.recordId===old.id&&u.story.cardTarget.title==='Native Card café 雪'&&v.response_format.json_schema.strict===true,'Complete reviewed body contains selected revisions custom prompt and strict schema');
   check(root().textContent.includes('inference locality Unknown')&&root().textContent.includes('estimated tokens'),'Destination locality and conservative size disclosed');
   for(const theme of ['light','dark']){document.querySelector('.shell-settings').click();await wait(()=>document.querySelector('#setting-theme'));const setting=document.querySelector('#setting-theme');setting.value=theme;setting.dispatchEvent(new Event('change'));await wait(()=>document.documentElement.dataset.theme===theme);await click('Close settings');await pause('observe-'+theme);check(true,'Native '+theme+' send layout observed');}
   await pause('observe-narrow');check(true,'Native compact send layout observed');
   find('Generate proposal').focus();await pause('physical-send');await wait(()=>!find('Save proposed card').disabled);check(await snapshot()===before,'Physical Generate produces inert review with no writes');
   check(root().textContent.includes('Unescaped [str(7)] {a=jump:label}')&&root().textContent.includes('Current approved text stays available')&&root().querySelector('img,script')===null&&root().textContent.includes('Exact metadata changes'),'Card fields provenance and exact metadata review are passive');
   const diff=root().querySelector('.rewrite-result details[data-exact-change]');diff.open=true;const exact=JSON.parse([...diff.querySelectorAll('section')].find(s=>s.querySelector('h4').textContent==='After').querySelector('pre').textContent),preview=exact.cards[0];
   find('Save proposed card').focus();const seq=Number(root().dataset.acceptSequence??0);await pause('physical-accept');await wait(()=>Number(root().dataset.acceptSequence??0)>seq);check(root().dataset.acceptOutcome==='accepted'&&find('Save proposed card').disabled,'Physical acceptance saves once and blocks duplicate click');
   let w=await read('references.list',p()),record=w.document.cards[0],revision=record.revisions.find(v=>v.id===record.currentRevisionId);
   check(record.id===old.id&&record.currentRevisionId===preview.currentRevisionId&&JSON.stringify(w.document)===JSON.stringify(exact),'Core card revision and exact prepared metadata survive');
   check(record.approvedRevisionId===prior&&revision.status==='proposed'&&revision.reviewedAt===null&&revision.content.provenance.kind==='inferred','Acceptance saves proposed text and preserves approved revision');
   check(JSON.stringify(sourceHashes(await snapshot()))===JSON.stringify(sourceHashes(before)),'All runnable source is byte exact');
   const saved=JSON.stringify(w.document);await closeAssist();await click('Undo');await wait(async()=>(await read('references.list',p())).document.cards[0].currentRevisionId===old.currentRevisionId);check(JSON.stringify((await read('references.list',p())).document)===JSON.stringify(initial.document),'One Undo restores exact prior library');await click('Redo');await wait(async()=>JSON.stringify((await read('references.list',p())).document)===saved);check(true,'Redo restores exact proposed metadata');
   await click('Characters');await click('Character cards');await wait(()=>document.querySelector('.reference-library'));const row=document.querySelector(`[data-reference-id="${old.id}"]`);row.click();await wait(()=>find('Approve this card revision'));
   check(document.querySelector('[name="description"]').disabled&&find('Save changes').disabled&&document.querySelector('.reference-library').textContent.includes('Current approved text'),'Proposed form requires separate explicit approval');
   const library=document.querySelector('.reference-library');const mseq=Number(library.dataset.mutationSequence??0);find('Approve this card revision').focus();await pause('physical-approve');await wait(()=>Number(library.dataset.mutationSequence??0)>mseq);
   w=await read('references.list',p());check(w.document.cards[0].approvedRevisionId===revision.id&&w.document.cards[0].revisions.find(v=>v.id===prior).status==='superseded','Physical approval explicitly replaces prior approved revision');
   const approved=JSON.stringify(w.document);await click('Undo');await wait(async()=>JSON.stringify((await read('references.list',p())).document)===saved);check(true,'Approval Undo restores prior approved text');await click('Redo');await wait(async()=>JSON.stringify((await read('references.list',p())).document)===approved);check(true,'Approval Redo restores exact approved revision');
   await click('Story');await wait(()=>document.querySelector('.scene-workspace'));await select();choices();const invalid=await snapshot();await generate('FIXTURE_MALFORMED');check(find('Save proposed card').disabled&&await snapshot()===invalid,'Malformed response writes nothing and retains task');
   await generate('FIXTURE_UNSAFE');check(find('Save proposed card').disabled&&await snapshot()===invalid,'Model approval response writes nothing');
   await prepare('FIXTURE_DELAY');await click('Generate proposal');await wait(()=>root().dataset.active==='true');await wait(async()=>(await read('probe.rewriteStage',{stage:'server-delay'})).done);await click('Cancel request');await wait(()=>root().dataset.active==='false'&&root().dataset.busy==='false');check(find('Save proposed card').disabled&&await snapshot()===invalid,'Cancelled response writes nothing and retains task');
   await generate('Keep the meaning.');check(!find('Save proposed card').disabled,'Fresh valid proposal available after refusal and cancellation');await pause('external-source');const external=await snapshot();const sseq=Number(root().dataset.acceptSequence??0);await click('Save proposed card');await wait(()=>Number(root().dataset.acceptSequence??0)>sseq);check(root().dataset.acceptOutcome==='refused'&&await snapshot()===external,'Stale external source refuses acceptance with zero writes');await pause('restore-source');
   await closeAssist();await click('Close Project');await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));project=await read('project.current');check(JSON.stringify((await read('references.list',p())).document)===approved,'Project reopen retains exact approved card');
  }
  details.stage='complete';details.passed=true;
 }catch(e){details.passed=false;details.errorCode=e.code??'PROBE_ASSERTION';details.failure=String(e).slice(0,200);}
 await call('probe.runtimeUiReport',details);
})();
