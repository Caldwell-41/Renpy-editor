// Exactly two explicitly selected Windows phases. Native input is host-driven;
// this actual Settings controller never receives synthetic secret values.
(async()=>{
 const phase=window.__loomlightWindowsStudioPhase;
 const A='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', B='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
 const details={phase,stage:'open',checks:[],layer:'packaged Windows WebView/IPC/native Credential Manager'};
 const check=(v,m)=>{if(!v)throw Error(m);details.checks.push(m);};
 const wait=async f=>{const end=performance.now()+120000;while(!await f()){if(performance.now()>end)throw Error(`Timeout: ${details.stage}`);await new Promise(r=>setTimeout(r,100));}};
 const button=name=>window.__loomlightProbeFindButton(name);
 const click=async name=>{await wait(()=>button(name)&&!button(name).disabled);button(name).click();};
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Error(`${operation}: ${r.error.code}`);return r.value;};
 const step=async name=>{details.stage=name;await call('probe.windowsStudioStep',{step:name});};
 const status=()=>document.querySelector('.studio-settings [role="status"]').textContent;
 const select=id=>{const n=document.querySelector('.studio-settings select');n.value=id;n.dispatchEvent(new Event('change',{bubbles:true}));};
 const ready=()=>button('Save profile')&&!button('Save profile').disabled;
 const enter=async(stage,expected)=>{await step(stage);await click(button('Replace credential…')?'Replace credential…':'Enter credential…');await wait(ready);details.nativeStatus=status();if(!status().startsWith(expected))throw Error(`Native entry result: ${status()}`);};
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
   const beforeCancel=await call('ai.profiles');select(A);await step('cancel-entry');await click('Replace credential…');await wait(()=>ready()&&status().includes('cancelled'));
   check(JSON.stringify(await call('ai.profiles'))===JSON.stringify(beforeCancel),'Failed native entry then Cancel preserved complete redacted snapshot');await step('cancelled');
   await discover();await discover();
  }else{
   check(initial.profiles.every(p=>p.credentialStatus==='configured')&&initial.profiles.every(p=>p.discovery===null),'Full process reopen reused both remembered keys without discovery');await step('reopened');
   await discover();await enter('beta-entry','API key saved; cleanup pending');await step('beta-saved');
   const replaced=await call('ai.profiles');check(replaced.profiles[0].revision===3&&replaced.profiles[1].revision===2&&replaced.profiles[1].credentialStatus==='configured'&&replaced.cleanup.length===1,'Replacement preserved B and retired only owned A');await discover();
   await click('Remove credential');await wait(()=>ready()&&status()==='Removed; cleanup pending');
   const removed=await call('ai.profiles');check(removed.profiles[0].disabled&&removed.profiles[0].credentialStatus==='missing'&&removed.profiles[1].credentialStatus==='configured','Removal disabled A and preserved B');await step('removed');
   await click('Remove profile');await wait(ready);select(B);await click('Remove credential');await wait(()=>ready()&&status()==='Removed');await click('Remove profile');await wait(ready);
   const final=await call('ai.profiles');check(final.profiles.length===0&&final.cleanup.length===1,'All Windows keys/profiles removed; foreign owned cleanup retained');
  }
  check(!document.querySelector('.studio-settings input[type="password"]'),'WebView contains no secret field');
  await step('complete');details.stage='complete';await call('probe.runtimeUiReport',{passed:true,...details});
 }catch(error){details.nativeStatus=status();details.error=String(error);await call('probe.runtimeUiReport',{passed:false,...details});}
})();
