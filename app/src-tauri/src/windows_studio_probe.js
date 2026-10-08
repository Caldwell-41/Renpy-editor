// Exactly two explicitly selected Windows phases. Native input is host-driven;
// this actual Settings controller never receives synthetic secret values.
(async()=>{
 const phase=window.__loomlightWindowsStudioPhase;
 const reloadProof=window.__loomlightWindowsReloadProof===true;
 const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const details={phase,stage:'open',checks:[],layer:'packaged Windows WebView/IPC/native Credential Manager'};
 const check=(v,m)=>{if(!v)throw Error(m);details.checks.push(m);};
 const wholeEnd=performance.now()+300000;
 const wait=async(f,ms=15000)=>{const end=Math.min(wholeEnd,performance.now()+ms);while(!await f()){if(performance.now()>end)throw Error(`Timeout: ${details.stage}`);await new Promise(r=>setTimeout(r,100));}};
 const originalInvoke=window.__TAURI_INTERNALS__.invoke;
 let entryResponse=null;const operations=[];
 if(reloadProof)window.__TAURI_INTERNALS__.invoke=async function(command,args){
  const result=await originalInvoke.call(this,command,args);
  if(command==='core_request'){operations.push(args.request.operation);if(args.request.operation==='ai.enterCredential'&&result.ok)entryResponse=result.value;}
  return result;
 };
 const button=name=>window.__loomlightProbeFindButton(name);
 const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Error(`${operation}: ${r.error.code}`);return r.value;};
 const step=async name=>{details.stage=name;await call('probe.windowsStudioStep',{step:name});};
 const status=()=>document.querySelector('.studio-settings [role="status"]').textContent;
 const select=id=>{const n=document.querySelector('.studio-settings select');n.value=id;n.dispatchEvent(new Event('change',{bubbles:true}));};
 const ready=()=>button('Save profile')&&!button('Save profile').disabled;
 const enter=async(stage,expected)=>{await step(stage);await click(button('Replace credential…')?'Replace credential…':'Enter credential…');await wait(ready,120000);details.nativeStatus=status();if(!status().startsWith(expected))throw Error(`Native entry result: ${status()}`);};
 const discover=async()=>{const old=await call('ai.profiles');await click('Refresh models');await wait(ready);const next=await call('ai.profiles');check(status()==='model available; discovery only'&&next.profiles.find(p=>p.profileId===A).discovery?.selectedAvailable===true,'Explicit authenticated discovery completed in this action');check(next.token===old.token,'Discovery did not persist profile changes');};
 try {
  check(phase===1||phase===2,'Fixed Windows phase selected');
  await click('Settings');await click('AI providers');await wait(ready);
  let initial=await call('ai.profiles');check(initial.profiles.length===2&&initial.cleanup.length===1,'Shared v2 profiles and foreign cleanup retained');
  select(A);
  if(phase===1){
   check(initial.profiles.every(p=>p.credentialStatus==='missing'),'Initial fixture has no native keys');
   await enter('alpha-entry','API key saved; cleanup pending');await step('alpha-saved');
   let saved=await call('ai.profiles');check(saved.profiles[0].credentialStatus==='configured'&&saved.profiles[0].revision===2&&saved.cleanup.length===1,'Retained-field Retry saved A while foreign cleanup remained pending');
   select(B);await enter('gamma-entry','API key saved');await step('gamma-saved');
   const beforeCancel=await call('ai.profiles');select(A);await step('cancel-entry');await click('Replace credential…');await wait(()=>ready()&&status().includes('cancelled'),120000);
   check(JSON.stringify(await call('ai.profiles'))===JSON.stringify(beforeCancel),'Failed native entry then Cancel preserved complete redacted snapshot');await step('cancelled');
   await discover();await discover();
  }else{
   check(initial.profiles.every(p=>p.credentialStatus==='configured')&&initial.profiles.every(p=>p.discovery===null),'Full process reopen reused both remembered keys without discovery');await step('reopened');
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
    details.reloadResponse=entryResponse;await step('beta-reload-required');
    // Keep the failed-reload UI visible until the host has captured it. This
    // read-only polling shares the fixed 15 s confirmation cap, never a new save.
    await wait(async()=> (await call('probe.windowsStudioStep',{step:'beta-reload-observed'})).observed===true);
    const beforeRetry=await call('ai.profiles'),start=operations.length;
    await click('Retry');await wait(ready);
    const afterRetry=await call('ai.profiles');
    check(JSON.stringify(beforeRetry)===JSON.stringify(afterRetry)&&
     JSON.stringify(operations.slice(start))===JSON.stringify(['ai.profiles','ai.profiles'])&&
     document.querySelector('.studio-settings select').value===A&&afterRetry.profiles[0].credentialStatus==='configured',
     'Read-only Retry restored configured A without entry, Save or discovery');
    await step('beta-reloaded');
   }else await enter('beta-entry','API key saved; cleanup pending');
   await step('beta-saved');
   const replaced=await call('ai.profiles');check(replaced.profiles[0].revision===3&&replaced.profiles[1].revision===2&&replaced.profiles[1].credentialStatus==='configured'&&replaced.cleanup.length===1,'Replacement preserved B and retired only owned A');await discover();
   await click('Remove credential');await wait(()=>ready()&&status()==='Removed; cleanup pending');
   const removed=await call('ai.profiles');check(removed.profiles[0].disabled&&removed.profiles[0].credentialStatus==='missing'&&removed.profiles[1].credentialStatus==='configured','Removal disabled A and preserved B');await step('removed');
   await click('Remove profile');await wait(ready);select(B);await click('Remove credential');await wait(()=>ready()&&status()==='Removed');await click('Remove profile');await wait(ready);
   const final=await call('ai.profiles');check(final.profiles.length===0&&final.cleanup.length===1,'All Windows keys/profiles removed; foreign owned cleanup retained');
  }
  check(!document.querySelector('.studio-settings input[type="password"]'),'WebView contains no secret field');
  await step('complete');details.stage='complete';await call('probe.runtimeUiReport',{passed:true,...details});
 }catch(error){details.nativeStatus=status();details.error=String(error);await call('probe.runtimeUiReport',{passed:false,...details});}
 finally{if(reloadProof)window.__TAURI_INTERNALS__.invoke=originalInvoke;}
})();
