// Opt-in owned public fixture. Real controllers, IPC and metadata; no requester mocks.
// Reports identifiers/checks only; reference prose is never included in diagnostics.
(async()=>{
 const details={stage:'open',checks:[],layer:'signed native WebView; real IPC; synthetic form input plus physical Save/focus observations'};
 const check=(ok,name)=>{if(!ok)throw Error(name);details.checks.push(name);};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Object.assign(Error(r.error.code),{code:r.error.code});return r.value;};
 const read=(op,payload)=>window.__loomlightProbeRetryBusy(()=>call(op,payload));
 const wait=async(condition)=>{const start=performance.now();while(!await condition()){if(performance.now()-start>20000)throw Error('Timeout at '+details.stage);await new Promise(r=>setTimeout(r,40));}};
 const find=window.__loomlightProbeFindButton;
 const click=async(label)=>{await wait(()=>find(label)&&!find(label).disabled);find(label).click();await wait(()=>document.querySelector('.reference-library')?.dataset.busy!=='true');};
 const input=(name,value)=>{const el=document.querySelector(`.reference-editor [name="${name}"]`);if(!el)throw Error('Missing field '+name);el.focus();el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));};
 const pause=async stage=>{details.stage=stage;await call('probe.referenceStage',{stage,announce:true});const start=performance.now();while(!(await read('probe.referenceStage',{stage})).done){if(performance.now()-start>240000)throw Error('Observation timeout at '+stage);await new Promise(r=>setTimeout(r,200));}};
 const knownCurrent=record=>record.revisions.find(r=>r.id===record.currentRevisionId);
 let project;
 try{
  await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));
  project=await read('project.current');const payload=()=>({sessionId:project.sessionId});const library=()=>read('references.list',payload());
  const sources=await read('source.list',payload());const sourceBefore=await Promise.all(sources.files.filter(f=>f.path.endsWith('.rpy')).map(f=>read('source.open',{...payload(),path:f.path})));
  await click('Characters');await click('Character cards');await wait(()=>document.querySelector('.reference-library'));
  if(window.__loomlightReferencePhase===2){
   const doc=(await library()).document;check(doc.cards.length===1&&doc.loreEntries.length===1,'Process reopen preserves both collections');const card=doc.cards[0];check(card.revisionCounter===3&&card.currentRevisionId===card.approvedRevisionId&&knownCurrent(card).status==='approved','Process reopen preserves exact saved revision number/status');check(doc.externalExtension?.retained===true,'Process reopen retains external unknown extension');
   details.document=doc.cards.map(r=>({id:r.id,revisionCounter:r.revisionCounter,currentRevisionId:r.currentRevisionId,approvedRevisionId:r.approvedRevisionId,statuses:r.revisions.map(v=>({id:v.id,number:v.number,status:v.status}))}));
  }else{
   input('title','Mara');input('aliases','M');input('tags','Station, Lead');input('description','A station keeper. café 雪');input('personality','Patient and observant.');
   await pause('manual-save');await wait(async()=>((await library()).document.cards.length===1));
   const first=(await library()).document;check(knownCurrent(first.cards[0]).content.description==='A station keeper. café 雪','Physical Save routes UI to real metadata');check(first.cards[0].revisionCounter===1&&knownCurrent(first.cards[0]).status==='approved','Initial save creates stable current saved revision');
   input('description','Updated station keeper. café 雪');await click('Save changes');await wait(async()=>((await library()).document.cards[0].revisionCounter===2));const second=(await library()).document;
   check(second.cards[0].id===first.cards[0].id&&second.cards[0].revisions[0].status==='superseded'&&second.cards[0].revisions[0].content.description===knownCurrent(first.cards[0]).content.description,'Replacement preserves prior saved text and stable record ID');
   await click('Undo');await wait(async()=>JSON.stringify((await library()).document)===JSON.stringify(first));await click('Redo');await wait(async()=>JSON.stringify((await library()).document)===JSON.stringify(second));check(true,'Native Undo and Redo restore exact document IDs revisions and statuses');
   input('description','Discard fixture');await click('Discard changes');await click('Keep editing');check(document.querySelector('[name="description"]').value==='Discard fixture','Cancelled discard retains form');await click('Discard changes');await click('Discard and leave');await wait(()=>document.querySelector('[name="description"]').value==='Updated station keeper. café 雪');check(JSON.stringify((await library()).document)===JSON.stringify(second),'Discard restores saved fields without writing');
   input('title','x'.repeat(161));await click('Save changes');await wait(()=>document.querySelector('.reference-library').dataset.busy==='false');check(document.querySelector('[name="title"]').value.length===161&&JSON.stringify((await library()).document)===JSON.stringify(second),'Refused bounds retain data and typed form');await click('Discard changes');await click('Discard and leave');
   const search=document.querySelector('[aria-label="Search cards"]');search.value='unmatched';search.dispatchEvent(new Event('input'));check(!document.querySelector('.reference-entry'),'Search filters visible entries');search.value='';search.dispatchEvent(new Event('input'));const filter=document.querySelector('[aria-label="Filter by tag"]');filter.value='Lead';filter.dispatchEvent(new Event('change'));check(document.querySelectorAll('.reference-entry').length===1,'Tag filter finds saved card');
   input('description','External edit reviewed.');await pause('external-edit');await click('Save changes');await wait(()=>document.querySelector('.reference-library').dataset.busy==='false');check(document.querySelector('[name="description"]').value==='External edit reviewed.'&&(await library()).document.externalExtension.retained===true,'Ordinary external edit refuses stale save and retains draft');
   await click('Reload library');await wait(()=>document.querySelector('.reference-library').dataset.busy==='false');await click('Save changes');await wait(async()=>((await library()).document.cards[0].revisionCounter===3));check((await library()).document.externalExtension.retained===true,'Explicit reload and Save preserve external unknown fields');
   await click('Lorebook');await wait(()=>document.querySelector('.reference-library')?.dataset.kind==='lore');input('title','The last train');input('category','Places');input('tags','Station');input('text','The last train leaves at midnight.');input('subject','Station');await click('Create lore entry');await wait(async()=>((await library()).document.loreEntries.length===1));check(knownCurrent((await library()).document.loreEntries[0]).status==='approved','Lore creation saves author text through production dispatch');
   for(const stage of ['malformed','newer']){await pause(stage);await click('Reload library');await wait(()=>!document.querySelector('.reference-editor input'));check(find('New lore entry').disabled,'Unreadable library refuses creation: '+stage);}
   await pause('restore');await click('Reload library');await wait(()=>document.querySelector('.reference-editor input'));check((await library()).document.cards[0].revisionCounter===3,'Restored external document reopens without implicit repair');
   const final=(await library()).document;await click('Close Project');await click('Source foundation fixture');await wait(()=>document.querySelector('.scene-workspace'));project=await read('project.current');check(JSON.stringify((await library()).document)===JSON.stringify(final),'Close and reopen preserve exact complete metadata');
   const sourceAfter=await Promise.all(sources.files.filter(f=>f.path.endsWith('.rpy')).map(f=>read('source.open',{...payload(),path:f.path})));check(JSON.stringify(sourceAfter.map(v=>v.text))===JSON.stringify(sourceBefore.map(v=>v.text)),'Reference editing preserves all game source text');
   await click('Characters');await click('Character cards');await wait(()=>document.querySelector('.reference-library'));
   for(const theme of ['light','dark']){document.querySelector('.shell-settings').click();await wait(()=>document.querySelector('#setting-theme'));const select=document.querySelector('#setting-theme');select.value=theme;select.dispatchEvent(new Event('change'));await wait(()=>document.documentElement.dataset.theme===theme);await click('Close settings');await pause('observe-'+theme);}
   await pause('observe-narrow');
   check(![...document.querySelectorAll('button')].some(b=>['Approve','Reject','Supersede','Edit'].includes(b.textContent)),'Manual UI has clear Save actions without review bureaucracy');
   details.document=final.cards.map(r=>({id:r.id,revisionCounter:r.revisionCounter,currentRevisionId:r.currentRevisionId,approvedRevisionId:r.approvedRevisionId,statuses:r.revisions.map(v=>({id:v.id,number:v.number,status:v.status}))}));
  }
  details.stage='complete';details.passed=true;
 }catch(error){details.passed=false;details.errorCode=error.code??'PROBE_ASSERTION';details.failure=String(error).slice(0,180);details.referenceBusy=document.querySelector('.reference-library')?.dataset.busy;details.referenceFailure=document.querySelector('.reference-notice')?.dataset.kind;}
 await call('probe.runtimeUiReport',details);
})();
