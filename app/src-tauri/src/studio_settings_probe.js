// Opt-in current Settings contract. Keys enter native drafts; Save publishes them.
(async()=>{
 const details={contract:2,stage:'open',checks:[],layer:'packaged WebView/IPC and native secure entry; synthetic UI input'};
 const check=(value,message)=>{if(!value)throw Error(message);details.checks.push(message);};
 const wait=async f=>{const end=performance.now()+180000;while(!await f()){if(window.__loomlightProbeSignal?.aborted)throw Error('Probe cancelled');if(performance.now()>end)throw Error(`Timeout: ${details.stage}`);await new Promise(r=>setTimeout(r,100));}};
 const button=name=>window.__loomlightProbeFindButton(name);
 const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Error(r.error.code);return r.value;};
 const field=name=>[...document.querySelectorAll('.studio-settings input')].find(n=>n.ariaLabel===name);
 const fill=(name,value)=>{const n=field(name);n.value=value;n.dispatchEvent(new Event('input',{bubbles:true}));};
 const settled=()=>wait(()=>document.querySelector('.studio-settings')?.dataset.busy==='false');
 const connect=async()=>{const before=await call('ai.profiles');await click('Connect');await settled();check(document.querySelector('.studio-connect [role="status"]').textContent.startsWith('Connected.'),'Explicit production authenticated GET retrieved current models');check(JSON.stringify(await call('ai.profiles'))===JSON.stringify(before),'Connect did not persist profiles or key');};
 const saveKey=async()=>{await connect();fill('Model ID','synthetic-model');await click('Save profile');await settled();};
 try{
  await click('Settings');await click('AI providers');await settled();
  const initial=await call('ai.profiles');
  if(initial.profiles.length===0){
   check(button('Save profile').disabled&&field('Model ID').disabled,'New profile requires native key and Connect before model or Save');
   details.stage='native-entry-alpha';await click('Enter credential…');await settled();check((await call('ai.profiles')).profiles.length===0,'Native draft entry did not publish a profile');await saveKey();
   const saved=await call('ai.profiles');check(saved.profiles.length===1&&saved.profiles[0].credentialStatus==='configured','Atomic Save published one completed profile and native key');
   details.stage='native-replace-beta';await click('Replace credential…');await settled();check(JSON.stringify(await call('ai.profiles'))===JSON.stringify(saved),'Native replacement remained staged before Save');await saveKey();
   const state=await call('ai.profiles');check(state.cleanup.length===0&&state.profiles[0].revision===saved.profiles[0].revision+1,'Native replacement published before old-entry cleanup');
   fill('Maximum response length','768');await click('Save profile');await settled();check((await call('ai.profiles')).profiles[0].settings.maximumResponse===768,'Changed token default saved');
   details.stage='native-cancel';const before=await call('ai.profiles');await click('Replace credential…');await settled();check(document.querySelector('.studio-connect [role="status"]').textContent.includes('cancelled')&&JSON.stringify(await call('ai.profiles'))===JSON.stringify(before),'Native cancellation preserved the saved profile and key');
   await click('Close settings');await click('Settings');await click('AI providers');await settled();check(field('Maximum response length').value==='768','Settings close/reopen retained changed defaults');
   const refused=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation:'ai.beginConnection',payload:{token:state.token,profileId:state.profiles[0].profileId,endpoint:state.profiles[0].settings.endpoint,privateHttp:false,key:'injected-secret'}}});check(!refused.ok,'Renderer-supplied key rejected before native dialog');
  }else{
   check(initial.profiles[0].credentialStatus==='configured'&&initial.profiles[0].settings.maximumResponse===768,'Second process reopened saved key and response limit');
   check(initial.profiles[0].discovery===null,'Discovery not persisted');await connect();
   fill('Maximum response length','512');await click('Save profile');await settled();check((await call('ai.profiles')).profiles[0].compatibilityState!=='ready','Saved revision invalidates readiness');
   await click('Remove credential');await settled();const removed=await call('ai.profiles');check(removed.profiles[0].disabled&&removed.profiles[0].credentialStatus==='missing'&&removed.cleanup.length===0,'Removal disabled profile before owned deletion');
   await click('Remove profile');await click('Remove profile');await settled();check((await call('ai.profiles')).profiles.length===0,'Profile removal left no active profile');
  }
  check(!document.querySelector('.studio-settings input[type="password"]'),'No secret field in WebView');
  details.stage='complete';await call('probe.runtimeUiReport',{passed:true,...details});
 }catch(error){details.error=String(error);await call('probe.runtimeUiReport',{passed:false,...details});}
})();
