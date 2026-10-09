// Exactly two explicitly selected Windows phases. Native input is host-driven;
// this actual Settings controller never receives synthetic secret values.
(async()=>{
 const phase=window.__loomlightWindowsStudioPhase;
 const evidence=window.__loomlightWindowsEvidence===true;
 const epoch=()=>performance.timeOrigin+performance.now();
 const clientTimings=[];let requestTiming=null;
 const reloadProof=window.__loomlightWindowsReloadProof===true;
 const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const details={phase,stage:'open',checks:[],layer:'packaged Windows WebView/IPC/native Credential Manager'};
 const check=(v,m)=>{if(!v)throw Error(m);details.checks.push(m);};
 // Operator capture/interpretation has its own bounded allowance. Product waits
 // remain 15 s (discovery cleanup 2 s); no polling hold starts a product action.
 const observationMs=evidence&&phase===2?180000:15000;
 const wholeEnd=performance.now()+(evidence&&phase===2?1800000:300000);
 const wait=async(f,ms=15000)=>{const end=Math.min(wholeEnd,performance.now()+ms);while(true){const done=await f();if(performance.now()>end)throw Error(`Timeout: ${details.stage}`);if(done)return;await new Promise(r=>setTimeout(r,100));}};
 let entryResponse=null;const operations=[];
 const observe=event=>{const {operation,response,started,ended}=event.detail;
  operations.push(operation);
  if(operation==='ai.enterCredential'&&response?.ok)entryResponse=response.value;
  if(evidence&&operation==='ai.discover')requestTiming={requestStarted:started,requestEnded:ended};
 };
 if(reloadProof||evidence)window.addEventListener('loomlight-windows-probe-response',observe);
 const button=name=>window.__loomlightProbeFindButton(name);
 const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
 const call=async(operation,payload={})=>{if(reloadProof||evidence)operations.push(operation);const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Error(`${operation}: ${r.error.code}`);return r.value;};
 const step=async name=>{details.stage=name;await call('probe.windowsStudioStep',{step:name});};
 const showStatus=()=>document.querySelector('.studio-settings [role="status"]').scrollIntoView({block:'center'});
 const hold=async name=>{if(evidence)await wait(async()=>(await call('probe.windowsStudioStep',{step:name+'-observed'})).observed===true,observationMs);};
 const checkpoint=async name=>{showStatus();await step(name);await hold(name);};
 const status=()=>document.querySelector('.studio-settings [role="status"]').textContent;
 const select=id=>{const n=document.querySelector('.studio-settings select');n.value=id;n.dispatchEvent(new Event('change',{bubbles:true}));};
 const ready=()=>button('Save profile')&&!button('Save profile').disabled;
 const enter=async(stage,expected)=>{await step(stage);await click(button('Replace credential…')?'Replace credential…':'Enter credential…');await wait(ready,120000);details.nativeStatus=status();if(!status().startsWith(expected))throw Error(`Native entry result: ${status()}`);};
 const discover=async()=>{const old=await call('ai.profiles');const actionStarted=epoch();requestTiming=null;await click('Refresh models');await wait(ready);const completed=epoch();if(evidence){if(!requestTiming)throw Error('Client discovery timing missing');const timing={actionStarted,...requestTiming,completed};if(timing.requestEnded-timing.requestStarted>15000||completed-timing.requestEnded>2000)throw Error('Client discovery deadline exceeded');clientTimings.push(timing);details.clientTimings=clientTimings;}const next=await call('ai.profiles');check(status()==='model available; discovery only'&&next.profiles.find(p=>p.profileId===A).discovery?.selectedAvailable===true,'Explicit authenticated discovery completed in this action');check(next.token===old.token,'Discovery did not persist profile changes');if(evidence)await checkpoint('get-'+clientTimings.length+'-complete');};
 try {
  check(phase===1||phase===2,'Fixed Windows phase selected');
  await click('Settings');await click('AI providers');await wait(ready);
  let initial=await call('ai.profiles');check(initial.profiles.length===2&&initial.cleanup.length===1,'Shared v2 profiles and foreign cleanup retained');
  select(A);
  if(phase===1){
   check(initial.profiles.every(p=>p.credentialStatus==='missing'),'Initial fixture has no native keys');
   await enter('alpha-entry','API key saved; cleanup pending');await checkpoint('alpha-saved');
   let saved=await call('ai.profiles');check(saved.profiles[0].credentialStatus==='configured'&&saved.profiles[0].revision===2&&saved.cleanup.length===1,'Retained-field Retry saved A while foreign cleanup remained pending');
   select(B);await enter('gamma-entry','API key saved');await checkpoint('gamma-saved');
   const beforeCancel=await call('ai.profiles');select(A);await step('cancel-entry');await click('Replace credential…');await wait(()=>ready()&&status().includes('cancelled'),120000);
   check(JSON.stringify(await call('ai.profiles'))===JSON.stringify(beforeCancel),'Failed native entry then Cancel preserved complete redacted snapshot');await checkpoint('cancelled');
   await discover();await discover();
  }else{
   check(initial.profiles.every(p=>p.credentialStatus==='configured')&&initial.profiles.every(p=>p.discovery===null),'Full process reopen reused both remembered keys without discovery');await checkpoint('reopened');
   await discover();
   if(reloadProof){
    await step('beta-entry');await click('Replace credential…');
    await wait(()=>entryResponse!==null,120000);
    const expected={saved:true,cleanupPending:true,reloadRequired:true,saveStatus:'API key saved; cleanup pending; saved profiles could not be reloaded. Retry reading before further changes.'};
    check(JSON.stringify(entryResponse)===JSON.stringify(expected)||
     (Object.keys(entryResponse).length===4&&Object.entries(expected).every(([k,v])=>entryResponse[k]===v)),
     'Windows confirmed beta save requires read-only Settings reload');
    await wait(()=>status()===expected.saveStatus&&!button('Retry').disabled);
    const controls=[...document.querySelectorAll('.studio-settings input,.studio-settings select,.studio-settings button')];
    check(controls.length>10&&controls.every(n=>['Retry','Reload saved profiles'].includes(n.textContent)?!n.disabled:n.disabled),
     'All Settings mutation and discovery controls disabled; read-only Retry enabled');
    details.reloadResponse=entryResponse;showStatus();await step('beta-reload-required');
    await wait(async()=> (await call('probe.windowsStudioStep',{step:'beta-reload-observed'})).observed===true,observationMs);
    const beforeRetry=await call('ai.profiles'),start=operations.length;
    await click('Retry');await wait(ready);
    const afterRetry=await call('ai.profiles');
    check(JSON.stringify(beforeRetry)===JSON.stringify(afterRetry)&&
     JSON.stringify(operations.slice(start))===JSON.stringify(['ai.profiles','ai.profiles'])&&
     document.querySelector('.studio-settings select').value===A&&afterRetry.profiles[0].credentialStatus==='configured',
     'Read-only Retry restored configured A without entry, Save or discovery');
    await checkpoint('beta-reloaded');
   }else await enter('beta-entry','API key saved; cleanup pending');
   await step('beta-saved');
   const replaced=await call('ai.profiles');check(replaced.profiles[0].revision===3&&replaced.profiles[1].revision===2&&replaced.profiles[1].credentialStatus==='configured'&&replaced.cleanup.length===1,'Replacement preserved B and retired only owned A');await discover();
   await click('Remove credential');await wait(()=>ready()&&status()==='Removed; cleanup pending');
   const removed=await call('ai.profiles');check(removed.profiles[0].disabled&&removed.profiles[0].credentialStatus==='missing'&&removed.profiles[1].credentialStatus==='configured','Removal disabled A and preserved B');await checkpoint('removed');
   await click('Remove profile');await wait(ready);select(B);await click('Remove credential');await wait(()=>ready()&&status()==='Removed');await click('Remove profile');await wait(ready);
   const final=await call('ai.profiles');check(final.profiles.length===0&&final.cleanup.length===1,'All Windows keys/profiles removed; foreign owned cleanup retained');
  }
  check(!document.querySelector('.studio-settings input[type="password"]'),'WebView contains no secret field');
  await checkpoint('complete');details.stage='complete';await call('probe.runtimeUiReport',{passed:true,...details});
 }catch(error){details.nativeStatus=status();details.error=String(error);await call('probe.runtimeUiReport',{passed:false,...details});}
 finally{window.removeEventListener('loomlight-windows-probe-response',observe);}
})();
