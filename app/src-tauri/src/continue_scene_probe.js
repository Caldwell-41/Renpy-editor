// Opt-in public synthetic fixture. Actual UI/IPC/HTTP; no bridge interception.
(async()=>{
 const details={action:'continueScene',stage:'open',checks:[],reviewedBodyDigests:[],layer:'packaged production Assist/IPC/native credential reader plus physical send/accept and layout observation'};
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
 const select=async()=>{const w=await read('scene.list',p());scene=w.scenes[0];beat=scene.beats.at(-1);const card=document.querySelector(`.beat-card[data-beat-id="${beat.id}"]`);if(!card.classList.contains("selected"))card.querySelector(".beat-select").click();await click('Assist · Continue Scene');await wait(()=>root()?.dataset.busy==='false');};
 const choices=()=>{const c=[...root().querySelectorAll('fieldset input:not(:disabled)')];check(c.length===2,'Exact approved references available');for(const n of c){n.checked=true;n.dispatchEvent(new Event('change'));}};
 const prepare=async task=>{input('rewriteTask',task);await click('Review complete send');await wait(()=>!find('Generate proposal').disabled);details.reviewedBodyDigests.push(root().dataset.payloadDigest);return [...root().querySelectorAll('section')].find(s=>s.querySelector('h4')?.textContent==='Complete exact request body').querySelector('pre').textContent;};
 const generate=async task=>{await prepare(task);await click('Generate proposal');await wait(()=>root().dataset.busy==='false'&&root().dataset.active==='false');};
 const closeAssist=async()=>{await click('Discard proposal');await wait(()=>root().dataset.busy==='false');input('rewriteTask','');await click('Close Assist');await wait(()=>!root());};
 try{
  await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));project=await read('project.current');
  const sourceInitial=await read('source.list',p());const gameInitial=await Promise.all(sourceInitial.files.map(f=>read('source.open',{...p(),path:f.path})));
  if(window.__loomlightRewritePhase===2){
   const reopened=await read('scene.list',p());const narration=reopened.scenes[0].beats.find(b=>b.payload.text?.includes('New [[str(7)]')).payload.text;
   check(narration.includes('New [[str(7)] {{a=jump:label}')&&reopened.scenes[0].beats.some(b=>b.payload.text?.includes('[flag] {b}friend{/b}'))&&reopened.scenes[0].beats.at(-1).payload.type==='return','Process reopen retains accepted group and existing terminal');
   check((await read('context.options',p())).continuePrompt.customized,'Process reopen retains custom prompt');
   const profiles=await read('ai.profiles');check(profiles.profiles.length===1&&profiles.profiles[0].credentialStatus==='configured','Process reopen retains native credential readability');
   details.stage='complete';details.passed=true;
  }else{
   const before=await snapshot();await select();choices();const body=await prepare('Keep the meaning.');
   check(await snapshot()===before,'Preparation writes nothing');const v=JSON.parse(body),u=JSON.parse(v.messages[1].content);
   check(u.references.length===2&&v.messages[0].content==='Continue only at the saved anchor; follow the response contract.'&&u.story.anchor.beforeBeatId===beat.id&&u.story.terminal.id===beat.id&&v.response_format.json_schema.strict===true,'Complete reviewed body contains selected revisions custom prompt and strict schema');
   check(root().textContent.includes('inference locality Unknown')&&root().textContent.includes('UTF-8 byte estimate'),'Destination locality and conservative size disclosed');
   for(const theme of ['light','dark']){
    document.querySelector('.shell-settings').click();await wait(()=>document.querySelector('#setting-theme'));const setting=document.querySelector('#setting-theme');setting.value=theme;setting.dispatchEvent(new Event('change'));await wait(()=>document.documentElement.dataset.theme===theme);await click('Close settings');
    await pause('observe-'+theme);check(true,'Native '+theme+' send layout observed');
   }
   await pause('observe-narrow');check(true,'Native compact send layout observed');
   find('Generate proposal').focus();await pause('physical-send');await wait(()=>!find('Accept Beat group').disabled);
   check(await snapshot()===before,'Physical Generate produces inert review with no writes');
   check(root().textContent.includes('New [str(7)] {a=jump:label}')&&root().textContent.includes('Whole Beat group (new text is literal)')&&root().textContent.includes('Preserved insertion anchor and terminal')&&root().querySelector('img,script')===null&&root().querySelector('details summary').textContent.includes('Exact Source changes'),'Whole group and exact source diff are inert and disclose anchor and terminal');
   root().querySelector('details').open=true;find('Accept Beat group').focus();const sequence=Number(root().dataset.acceptSequence??0);await pause('physical-accept');await wait(()=>Number(root().dataset.acceptSequence??0)>sequence);
   check(root().dataset.acceptOutcome==='accepted'&&find('Accept Beat group').disabled,'Physical acceptance saves once and blocks duplicate click');
   const accepted=await read('scene.list',p());let saved=await read('source.open',{...p(),path:scene.sourcePath});const acceptedText=saved.text;const beforeText=gameInitial.find(f=>f.path===scene.sourcePath).text;const beforeBytes=new TextEncoder().encode(beforeText),afterBytes=new TextEncoder().encode(acceptedText);const offset=beat.byteStart,added=afterBytes.length-beforeBytes.length;check(JSON.stringify([...beforeBytes.slice(0,offset)])===JSON.stringify([...afterBytes.slice(0,offset)])&&JSON.stringify([...beforeBytes.slice(offset)])===JSON.stringify([...afterBytes.slice(offset+added)]),'Surrounding source is byte exact across group insertion');check(accepted.scenes[0].beats.length===scene.beats.length+2&&scene.beats.every(old=>accepted.scenes[0].beats.some(b=>b.id===old.id&&JSON.stringify(b.payload)===JSON.stringify(old.payload)))&&accepted.scenes[0].beats.at(-1).id===beat.id,'Core group IDs are new and all existing Beats terminal and payloads survive');
   check(accepted.scenes[0].beats.some(b=>b.payload.text?.includes('New [[str(7)] {{a=jump:label}')),'Accepted source encodes generated expressions and action tags literally');
   const unrelatedBefore=gameInitial.filter(f=>f.path!==scene.sourcePath).map(f=>[f.path,f.text]);const unrelatedAfter=await Promise.all(unrelatedBefore.map(async([path])=>[path,(await read('source.open',{...p(),path})).text]));check(JSON.stringify(unrelatedBefore)===JSON.stringify(unrelatedAfter)&&acceptedText.includes('opaque_neighbor = "kept"'),'Unrelated and custom source preserved');
   await closeAssist();await click('Undo');await wait(async()=>(await read('source.open',{...p(),path:scene.sourcePath})).text!==acceptedText);const undone=(await read('source.open',{...p(),path:scene.sourcePath})).text;check(undone===gameInitial.find(f=>f.path===scene.sourcePath).text,'One Undo restores exact prior source');await click('Redo');await wait(async()=>(await read('source.open',{...p(),path:scene.sourcePath})).text===acceptedText);check(true,'Redo restores exact accepted source');
   await select();choices();const invalid=await snapshot();await generate('FIXTURE_MALFORMED');check(find('Accept Beat group').disabled&&await snapshot()===invalid,'Malformed response writes nothing and retains task');
   await prepare('FIXTURE_UNSAFE');await click('Generate proposal');await wait(()=>root().dataset.active==='false'&&root().dataset.busy==='false');check(find('Accept Beat group').disabled&&await snapshot()===invalid,'Unsafe group response writes nothing');
   await prepare('FIXTURE_DELAY');await click('Generate proposal');await wait(()=>root().dataset.active==='true');await wait(async()=>(await read('probe.rewriteStage',{stage:'server-delay'})).done);await click('Cancel request');await wait(()=>root().dataset.active==='false'&&root().dataset.busy==='false');check(find('Accept Beat group').disabled&&await snapshot()===invalid,'Cancelled response writes nothing and retains task');
   await generate('Keep the meaning.');check(!find('Accept Beat group').disabled,'Fresh valid proposal available after refusal and cancellation');await pause('external-source');const external=await snapshot();const seq=Number(root().dataset.acceptSequence??0);await click('Accept Beat group');await wait(()=>Number(root().dataset.acceptSequence??0)>seq);check(root().dataset.acceptOutcome==='refused'&&await snapshot()===external,'Stale external source refuses acceptance with zero writes');await pause('restore-source');
   await closeAssist();await click('Close Project');await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));project=await read('project.current');check((await read('source.open',{...p(),path:scene.sourcePath})).text===acceptedText,'Project reopen retains accepted source');
   details.stage='complete';details.passed=true;
  }
 }catch(e){details.passed=false;details.errorCode=e.code??'PROBE_ASSERTION';details.failure=String(e).slice(0,200);}
 await call('probe.runtimeUiReport',details);
})();
