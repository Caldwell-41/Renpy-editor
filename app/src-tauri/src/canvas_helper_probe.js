// Synthetic DOM actions in the packaged WebView, using production requests and pixels.
(async () => {
  const stages=[],frames=[]; let stage="open",serial=0,latest,startupImageLoadMilliseconds;
  const started=performance.now(),delay=ms=>new Promise(r=>setTimeout(r,ms));
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const until=async predicate=>{const deadline=performance.now()+30000;while(!predicate()){if(performance.now()>deadline)throw Error(`Timeout: ${stage}`);await delay(20);}};
  window.__loomlightCanvasEvidence=true;
  window.addEventListener("loomlight-canvas-probe-response",event=>{const response=event.detail.response;if(response?.ok && response.value?.phase==="ready" && response.value.image)latest=response.value;});
  const call=async(operation,payload={})=>{
    const response=await window.__TAURI_INTERNALS__.invoke("core_request",{request:{protocolVersion:1,requestId:`canvas-${++serial}`,operation,payload}});
    if(!response.ok)throw Object.assign(Error(`${operation}: ${response.error.code}`),{code:response.error.code}); return response.value;
  };
  const read=(operation,payload)=>window.__loomlightProbeRetryBusy(()=>call(operation,payload));
  const find=window.__loomlightProbeFindButton;
  const click=async label=>{await until(()=>find(label));find(label).click();await delay(20);};
  const checkpoint=name=>{stage=name;stages.push({stage,elapsedMs:performance.now()-started});};
  const fresh=()=>document.querySelector('.screen-game')?.dataset.stale==="false";
  const width=()=>document.querySelector('.screens-editor [aria-label="Width"]');
  const edit=value=>{const input=width();input.focus();input.value=String(value);input.dispatchEvent(new Event("input",{bubbles:true}));return input;};
  try {
    await until(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();
    await until(()=>find("Screens"));
    await call("probe.canvasObservation",{announce:true});
    const observationDeadline=performance.now()+10000;
    while(!(await call("probe.canvasObservation")).ready){assert(performance.now()<observationDeadline,"External observer unavailable");await delay(20);}
    const startup=performance.now();find("Screens").click();
    await until(()=>fresh() && latest?.width===1280);
    startupImageLoadMilliseconds=performance.now()-startup;
    const project=await read("project.current"),sessionId=project.sessionId;
    const before=await read("source.open",{sessionId,path:"game/ui/help.rpy"});
    frames.push(latest); checkpoint("project-frame-passed");
    const row=[...document.querySelectorAll('.screen-tree [role="option"]')].find(e=>e.textContent==="Help frame");
    row.dispatchEvent(new MouseEvent("dblclick",{bubbles:true}));await until(width);
    const input=edit(760);await until(()=>fresh() && latest.geometry.some(g=>g.width===760 && g.height===360));
    assert(document.activeElement===input,"Helper rendering must preserve the focused field");
    assert((await read("source.open",{sessionId,path:"game/ui/help.rpy"})).text===before.text,"A provisional render must not write source");
    await click("Cancel changes");await until(()=>fresh() && width()?.value==="640"); checkpoint("draft-cancel-focus-passed");
    edit(760);await click("Apply changes");await until(()=>document.querySelector('.screen-message')?.textContent.startsWith("Size saved"));
    assert((await read("source.open",{sessionId,path:"game/ui/help.rpy"})).text===before.text.replace("xsize 640","xsize 760"),"Only the accepted token may change");
    await click("Undo");await until(()=>width()?.value==="640" && fresh());
    await click("Redo");await until(()=>width()?.value==="760" && fresh());
    await click("Undo");await until(()=>width()?.value==="640" && fresh()); checkpoint("source-history-passed");
    const aspect=document.querySelector('[aria-label="Canvas resolution (sample)"]');
    aspect.value="1024x768";aspect.dispatchEvent(new Event("change"));
    await until(()=>fresh() && latest?.width===1024);frames.push(latest);checkpoint("second-aspect-passed");
    const zoom=document.querySelector('[aria-label="Canvas zoom"]');zoom.value="100";zoom.dispatchEvent(new Event("change"));
    assert(document.querySelector('.screen-game').style.width==="1024px","100% must use logical game pixels");checkpoint("logical-pixels-passed");
    await click("Close Project");await until(()=>document.querySelector('.recent-open'));
    checkpoint("project-close-passed");checkpoint("complete");
    await call("probe.runtimeUiReport",{passed:true,scenario:"canvas-helper",stage,stages,frames,startupImageLoadMilliseconds,nativeWebView:true,nativeKeyboard:false,nativeFocusObserved:false,warmPresentationProof:false});
  } catch(error) {
    await call("probe.runtimeUiReport",{passed:false,scenario:"canvas-helper",stage,stages,frames,error:String(error),body:document.body.innerText.slice(-5000)});
  }
})();
