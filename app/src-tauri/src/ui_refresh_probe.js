// Explicit disposable-profile native check. Reports exactly what was exercised.
(async()=>{
 const details={stage:'welcome',checks:[],layer:'packaged native WebView; real IPC; synthetic editor input'};
 const wait=async condition=>{const start=performance.now();while(!await condition()){if(performance.now()-start>20000)throw Error(`Timeout at ${details.stage}`);await new Promise(r=>setTimeout(r,20));}};
 const button=name=>[...document.querySelectorAll('button')].find(b=>b.textContent===name);
 const call=async(operation,payload={})=>{const r=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:crypto.randomUUID(),operation,payload}});if(!r.ok)throw Object.assign(Error(`${operation}: ${r.error.code}`),{code:r.error.code});return r.value;};
 const read=(operation,payload={})=>window.__loomlightProbeRetryBusy(()=>call(operation,payload));
 const check=(ok,message)=>{if(!ok)throw Error(message);details.checks.push(message);};
 try{
  await wait(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();await wait(()=>button('Source'));button('Source').click();await wait(()=>document.querySelector('.cm-content')?.contentEditable==='true' && document.querySelector('[data-source-busy]')?.dataset.sourceBusy==='false');
  details.stage='editor';const editor=document.querySelector('.cm-content');check(getComputedStyle(document.querySelector('.cm-editor')).position==='relative','CodeMirror styles accepted by native CSP');
  editor.focus();const selection=getSelection();selection.selectAllChildren(editor);selection.collapseToStart();document.execCommand('insertText',false,'# Native editor check\n');
  await wait(()=>document.querySelector('.source-draft-warning')&&!document.querySelector('.source-draft-warning').hidden);
  const project=await read('project.current');await wait(async()=>(await read('source.list',{sessionId:project.sessionId})).dirtyCount===1);check(true,'Native editor input retained as a session draft');
  const bounds=()=>{const r=document.querySelector('.source-editor-shell').getBoundingClientRect();return [r.x,r.y,r.width,r.height].join(',');};const before=bounds();for(let n=0;n<50;n++)document.querySelector('#app-status').textContent=n%2?'Unsaved Source draft':'Saved';check(bounds()===before,'Status updates preserve native editor geometry');
  details.stage='settings';button('Settings').click();await wait(()=>document.querySelector('.settings-overlay'));button('Close settings').click();check(document.querySelector('.cm-content').textContent.includes('Native editor check'),'Settings return retains draft');
  const p=await read('preferences.read');await window.__loomlightProbeRetryBusy(()=>call('preferences.write',{...p,theme:'light'}));check((await read('preferences.read')).theme==='light','Device preference write and read round trip');
  details.stage='complete';details.passed=true;
 }catch(e){details.passed=false;details.error=String(e);}
 await call('probe.runtimeUiReport',details);
})();
