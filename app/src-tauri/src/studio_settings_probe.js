// Explicit disposable packaged proof. Native secure entry is driven by the host
// agent; synthetic keys never appear in the IPC payload or evidence report.
(async()=>{
 const details={stage:'open',checks:[],layer:'packaged WebView/IPC and native secure entry; synthetic UI input'};
 const check=(value,message)=>{if(!value)throw Error(message);details.checks.push(message);};
 const wait=async f=>{const end=performance.now()+180000;while(!await f()){if(performance.now()>end)throw Error(`Timeout: ${details.stage}`);await new Promise(r=>setTimeout(r,100));}};
 const button=name=>window.__loomlightProbeFindButton(name);
 const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Error(r.error.code);return r.value;};
 const field=name=>document.querySelector(`input[aria-label="${name}"]`);
 const fill=(name,value)=>{const n=field(name);n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));};
 try {
  await click('Settings');await click('AI providers');await wait(()=>button('Save profile')&&!button('Save profile').disabled);
  let initial=await call('ai.profiles');
  if(initial.profiles.length===0){
   details.stage='create';fill('Model ID','synthetic-model');await click('Save profile');await wait(()=>button('Enter credential…')&&!button('Enter credential…').disabled);
   check((await call('ai.profiles')).profiles.length===1,'Actual settings Save created one profile without discovery');
   details.stage='native-entry-alpha';await click('Enter credential…');await wait(()=>button('Replace credential…')&&!button('Replace credential…').disabled);
   check((await call('ai.profiles')).profiles[0].credentialStatus==='configured','Native secure entry produced redacted configured status');
   details.stage='native-replace-beta';await click('Replace credential…');await wait(()=>button('Replace credential…')&&!button('Replace credential…').disabled);
   const state=await call('ai.profiles');check(state.cleanup.length===0&&state.profiles[0].revision===3,'Actual native replacement published before old-entry cleanup');
   fill('Maximum response','768');check(button('Refresh models').disabled,'Unsaved limit change disables discovery');await click('Save profile');await wait(()=>!button('Save profile').disabled);
   check((await call('ai.profiles')).profiles[0].settings.maximumResponse===768,'Changed token default saved');
   details.stage='native-cancel';await click('Replace credential…');await wait(()=>document.querySelector('.studio-settings [role="status"]').textContent.includes('cancelled'));
   check((await call('ai.profiles')).profiles[0].credentialStatus==='configured','Native cancellation preserved active key');
   await click('Close settings');await click('Settings');await click('AI providers');await wait(()=>button('Replace credential…')&&!button('Replace credential…').disabled);
   check(field('Maximum response').value==='768','Settings close/reopen retained changed defaults');
   check(!document.querySelector('.studio-settings input[type="password"]'),'No secret field in WebView');
   const refused=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation:'ai.enterCredential',payload:{profileId:state.profiles[0].profileId,token:state.token,key:'injected-secret'}}});check(!refused.ok,'Renderer-supplied key rejected before native dialog');
  }else{
   check(initial.profiles[0].credentialStatus==='configured'&&initial.profiles[0].settings.maximumResponse===768,'Second packaged process reopened remembered native key and token defaults');
   check(initial.profiles[0].discovery===null,'No persisted/default discovery readiness');
   details.stage='explicit-discovery';
   const fixture=await call('probe.studioReuseQualification');
   check(fixture.reused&&fixture.originalPreserved,'Existing qualification key reused privately and retained');
   await click('Reload saved profiles');await wait(()=>!button('Refresh models').disabled);
   await click('Refresh models');await wait(()=>!button('Save profile').disabled);
   const discovered=await call('ai.profiles');
   check(discovered.profiles[0].discovery?.selectedAvailable===true,'Explicit production authenticated GET found the selected Studio model');
   fill('Maximum response','512');await click('Save profile');await wait(()=>!button('Save profile').disabled);
   check((await call('ai.profiles')).profiles[0].discovery===null,'Saved revision change invalidated discovery readiness');
   await click('Remove credential');await wait(()=>button('Enter credential…')&&!button('Enter credential…').disabled);
   const removed=await call('ai.profiles');check(removed.profiles[0].disabled&&removed.profiles[0].credentialStatus==='missing'&&removed.cleanup.length===0,'Actual removal disabled profile before owned native deletion');
   await click('Remove profile');await wait(()=>!button('Save profile').disabled);
   check((await call('ai.profiles')).profiles.length===0,'Actual profile removal left no active profile or owned cleanup');
  }
  details.stage='complete';await call('probe.runtimeUiReport',{passed:true,...details});
 }catch(error){details.error=String(error);await call('probe.runtimeUiReport',{passed:false,...details});}
})();
