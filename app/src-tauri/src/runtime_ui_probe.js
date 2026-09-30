(async () => {
  const started = performance.now();
  const stages = [];
  let stage = "open";
  const mode = window.__loomlightRuntimeProbeCase;
  const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
  const until = async (condition, limit = 190000) => { const start = performance.now(); while (!condition()) { if (performance.now()-start > limit) throw new Error(`Timeout: ${stage}`); await delay(30); } };
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const find = window.__loomlightProbeFindButton;
  const click = async label => { await until(() => find(label) && !find(label).disabled,15000); find(label).click(); await delay(30); };
  let serial = 0;
  const call = async (operation,payload={}) => {
    const response = await window.__TAURI_INTERNALS__.invoke("core_request",{request:{protocolVersion:1,requestId:`r2-${++serial}`,operation,payload}});
    if (!response.ok) throw Object.assign(new Error(`${operation}: ${response.error.code}`), {code:response.error.code}); return response.value;
  };
  const read = (operation,payload={}) => window.__loomlightProbeRetryBusy(() => call(operation,payload));
  const settled = async () => until(() => /^(Saved|Unsaved Source draft)$/.test(document.querySelector('#app-status')?.textContent ?? ""));
  const checkpoint = name => { stages.push({stage:name,elapsedMs:Math.round(performance.now()-started)}); stage=name; };
  const trust = async () => {
    await until(() => document.querySelector('.runtime-dialog') || /Running|Failed|Validation finished|Runtime action failed/.test(document.querySelector('.runtime-panel [role="status"]')?.textContent ?? ""));
    if (find("Trust for this session and continue")) {
      assert(document.activeElement?.textContent === "Cancel","Trust defaults to Cancel");
      document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"Tab",bubbles:true,cancelable:true}));
      assert(document.activeElement?.textContent === "Trust for this session and continue","Synthetic Tab reaches grant");
      await click("Trust for this session and continue");
    }
  };
  const editSource = async (path, transform) => {
    checkpoint("source-view-open"); await click("Source"); await until(() => document.querySelector(`button[title="${path}"]`) && !document.querySelector(`button[title="${path}"]`).disabled,20000); document.querySelector(`button[title="${path}"]`).click();
    await until(() => document.querySelector(` .source-editor[aria-label="Source editor for ${path}"]`) && !window.__loomlightProbeEditor(document.querySelector(` .source-editor[aria-label="Source editor for ${path}"]`)).readOnly,20000);
    checkpoint("source-input-ready");
    const input = window.__loomlightProbeEditor(document.querySelector(` .source-editor[aria-label="Source editor for ${path}"]`));
    input.focus(); input.value = transform(input.value); input.dispatchEvent(new Event("input",{bubbles:true}));
    checkpoint("source-save-click"); await click("Save Source");
    await until(() => document.querySelector('#app-status')?.textContent === "Saved",20000);
  };
  try {
    await click("Runtime UI fixture");
    await until(() => find("Run Game")); await settled();
    assert(!/Running|Validating/.test(document.querySelector('.runtime-panel [role="status"]').textContent),"Opening must not execute");
    const project = await read("project.current");
    let sessionId = project.sessionId;
    if (mode === "compile" || mode === "lint") {
      checkpoint("validate-and-navigate"); await click("Validate"); await trust();
      await until(() => [...document.querySelectorAll('.runtime-diagnostics button')].some(b => b.textContent.includes("雪 diagnostic.rpy:2")));
      await until(() => /Failed/.test(document.querySelector('.runtime-panel [role="status"]').textContent));
      assert(/Failed/.test(document.querySelector('.runtime-panel [role="status"]').textContent),"SDK failure remains failure");
      document.querySelector('.runtime-diagnostics button').click();
      await until(() => document.querySelector(' .source-editor[aria-label="Source editor for game/雪 diagnostic.rpy"]'));
      const input = window.__loomlightProbeEditor(document.querySelector(' .source-editor[aria-label="Source editor for game/雪 diagnostic.rpy"]'));
      input.focus(); // CodeMirror synchronizes its retained selection on the next view update.
      await until(() => input.selectionStart === "label diagnostic_case:\n".length,15000);
      assert(input.selectionStart === "label diagnostic_case:\n".length,"Exact editor line start after CRLF normalization");
      assert(input.value.slice(input.selectionStart,input.selectionEnd).includes(mode === "compile" ? "not a statement" : "loomlight_image_that_does_not_exist"),"SDK navigation selected the actual failing line");
      const reopened = await read("source.open",{sessionId,path:"game/雪 diagnostic.rpy"});
      assert(reopened.text.replace(/\r\n?/g,"\n") === input.value,"real service agrees with rendered source");
      checkpoint("diagnostics-real-ipc-passed");
    } else {
      if (mode !== "runtime-error") {
        checkpoint("branches-destination-edit"); await click("Branches");
        await until(() => document.querySelectorAll('.branch-node').length === 3); await click("Scene details");
        const select = document.querySelector('select[aria-label="Selected Scene"]');
        select.value = project.sceneId; select.dispatchEvent(new Event("change"));
        const routes = document.querySelector('select[aria-label="Selected route"]');
        routes.value = [...routes.options].find(o => o.value)?.value; routes.dispatchEvent(new Event("change"));
        await click("Edit Choice / Jump"); await until(() => document.querySelectorAll('select[aria-label="Choice destination Scene"]').length === 2);
        const destinations = [...document.querySelectorAll('select[aria-label="Choice destination Scene"]')];
        // Swap the destinations using visible authoring controls, then restore them.
        const initial = destinations.map(d => d.value);
        destinations[0].value=initial[1]; destinations[0].dispatchEvent(new Event("change",{bubbles:true}));
        await click("Commit Beat"); await settled();
        let flow = await read("flow.list",{sessionId});
        const assertChangedDestinations = graph => {
          const choices = graph.edges.filter(e=>e.sceneId===project.sceneId && e.kind==="choice");
          assert(choices.length === 2,"Graph retains exactly two authored choice edges");
          assert(choices.every(e=>e.destination.kind === "resolved" && e.destination.sceneId===initial[1]),"Both accepted choice destinations reflect the edit");
        };
        assert(initial[0] !== initial[1],"Fixture starts with distinct route destinations");
        assertChangedDestinations(flow);
        const origin = flow.nodes.find(node=>node.sceneId===project.sceneId);
        const destination = flow.nodes.find(node=>node.sceneId===initial[1]);
        assert(origin?.location?.path && destination?.label,"Edited route has a proven source and destination label");
        const accepted = await read("source.open",{sessionId,path:origin.location.path});
        assert(accepted.state === "clean" && !accepted.dirty && typeof accepted.text === "string","Destination edit is accepted Source text");
        const jumps = accepted.text.split(/\r?\n/).map(line=>line.trim()).filter(line=>line.startsWith("jump "));
        assert(jumps.length === 2 && jumps.every(line=>line===`jump ${destination.label}`),"Accepted source contains both changed destinations");
        checkpoint("branches-close-reopen");
        await click("Close Project"); await click("Runtime UI fixture");
        await until(() => find("Run Game")); await settled();
        const reopenedProject = await read("project.current");
        assert(reopenedProject.sessionId !== sessionId && reopenedProject.sceneId === project.sceneId,"Graph reopen uses a new session for the same entry Scene");
        sessionId = reopenedProject.sessionId;
        const reopenedOrigin = await read("source.open",{sessionId,path:origin.location.path});
        assert(reopenedOrigin.state === "clean" && !reopenedOrigin.dirty && reopenedOrigin.text === accepted.text && reopenedOrigin.baseRevision === accepted.baseRevision,"Changed destination bytes and revision survive project reopen");
        flow = await read("flow.list",{sessionId,refresh:true});
        assertChangedDestinations(flow);
        checkpoint("branches-destination-reopen-passed");
        await click("Branches"); await until(() => document.querySelectorAll('.branch-node').length === 3); await click("Scene details");
        const sceneSelect = document.querySelector('select[aria-label="Selected Scene"]'); sceneSelect.value=project.sceneId; sceneSelect.dispatchEvent(new Event("change"));
        const routeSelect = document.querySelector('select[aria-label="Selected route"]'); routeSelect.value=[...routeSelect.options].find(o=>o.value)?.value; routeSelect.dispatchEvent(new Event("change"));
        await click("Edit Choice / Jump"); await until(() => document.querySelector('select[aria-label="Choice destination Scene"]'));
        const restore=document.querySelector('select[aria-label="Choice destination Scene"]'); restore.value=initial[0]; restore.dispatchEvent(new Event("change",{bubbles:true})); await click("Commit Beat"); await settled();
        checkpoint("branches-real-edit-restored");
      }
      if (document.querySelector(".runtime-panel").hidden) await click("Runtime & diagnostics");
      await click("Enable controlled play"); await click("Add controlled play helper");
      await until(() => /helper saved/.test(document.querySelector('.runtime-panel [role="status"]').textContent));
      let draftPath;
      if (mode === "route-b") {
        checkpoint("draft-refusal-choices");
        draftPath="game/chapters/chapter_01/scene_001.rpy";
        await click("Source"); await until(()=>document.querySelector(`button[title="${draftPath}"]`) && !document.querySelector(`button[title="${draftPath}"]`).disabled,20000);
        document.querySelector(`button[title="${draftPath}"]`).click();
        await until(()=>document.querySelector(` .source-editor[aria-label="Source editor for ${draftPath}"]`) && !window.__loomlightProbeEditor(document.querySelector(` .source-editor[aria-label="Source editor for ${draftPath}"]`)).readOnly,20000);
        const input=window.__loomlightProbeEditor(document.querySelector(` .source-editor[aria-label="Source editor for ${draftPath}"]`));
        input.value="label changed_mapped_label:\n    return\n"; input.dispatchEvent(new Event("input",{bubbles:true}));
        checkpoint("draft-run-cancel"); await click("Run Game"); await click("Cancel");
        await until(()=>!find("Run Game").disabled,15000);
        assert(input.value.includes("changed_mapped_label"),"Cancel retains local draft");
        checkpoint("draft-save-all-refusal"); await click("Run Game"); await click("Save All and continue");
        await until(()=>!find("Run Game").disabled,15000);
        assert(!find("Trust for this session and continue"),"refused Save All never reaches trust/spawn");
        assert((await read("source.open",{sessionId,path:draftPath})).dirty,"Refused draft remains recoverable");
        checkpoint("draft-cancel-save-refusal-passed");
      }
      checkpoint("normal-run"); await click("Run Game");
      if (draftPath) await click("Use saved revision");
      await trust();
      if (mode === "runtime-error") {
        await until(() => /R2_RUNTIME_ERROR_ORACLE/.test(document.querySelector('.runtime-output').textContent));
        await until(() => /Failed|failed/.test(document.querySelector('.runtime-panel [role="status"]').textContent));
        await click("Stop"); await until(() => find("Run Game") && !find("Run Game").disabled);
        checkpoint("runtime-failure-passed");
      } else {
        const route=mode === "route-b" ? "b" : "a";
        await until(() => document.querySelector('.runtime-output').textContent.includes(`R2_ROUTE_${route}_DIALOGUE_STATE_ASSET_PASS`));
        assert(!document.querySelector('.runtime-output').textContent.includes(`R2_ROUTE_${route === "a" ? "b" : "a"}_`),"Only selected route ran");
        await until(() => /^Running/.test(document.querySelector('.runtime-panel [role="status"]').textContent));
        const runningObservedAt = performance.now();
        checkpoint("route-running-observed");
        if (draftPath) {
          await click("Discard Draft");
          await until(()=>document.querySelector('.source-discard-confirmation'));
          [...document.querySelectorAll('.source-discard-confirmation button')].find(b=>b.textContent==="Discard Draft").click();
          await until(()=>!document.querySelector('.source-discard-confirmation'));
        }
        checkpoint("script-save-during-play");
        await editSource("game/雪 diagnostic.rpy",text=>text+"# Saved while running.\n");
        await until(() => document.querySelector('.runtime-revision').textContent.includes("Started from an earlier revision"));
        while (performance.now()-runningObservedAt < 9500) {
          assert(/^Running/.test(document.querySelector('.runtime-panel [role="status"]').textContent),"Normal play stays running after route readiness");
          await delay(Math.min(100,9500-(performance.now()-runningObservedAt)));
        }
        const runningObservedMs = performance.now()-runningObservedAt;
        assert(runningObservedMs >= 9500 && /^Running/.test(document.querySelector('.runtime-panel [role="status"]').textContent),"Normal play survives at least 9.5 seconds after observed route readiness");
        stages.push({stage:"long-run-duration-passed",elapsedMs:Math.round(performance.now()-started),runningObservedMs});
        let exitRefused=false;
        try { await window.__TAURI_INTERNALS__.invoke("complete_application_close"); } catch(error) { exitRefused=String(error).includes("Close the project through its runtime and draft flow first."); }
        assert(exitRefused,"native exit refuses an open project");
        window.__loomlightRequestApplicationClose(); await click("Cancel");
        assert(/Running/.test(document.querySelector('.runtime-panel [role="status"]').textContent),"Cancel native close retains the game");
        await click("Stop"); await until(() => /Cancelled \/ stopped/.test(document.querySelector('.runtime-panel [role="status"]').textContent));
        await until(() => find("Run Game") && !find("Run Game").disabled);
        checkpoint("long-run-save-stop-passed");
        await click("Close Project"); await click("Runtime UI fixture");
        await until(() => find("Run Game")); await settled();
        const next = await read("project.current"); assert(next.sessionId !== sessionId,"reopen has new session identity");
        const reopened=await read("source.open",{sessionId:next.sessionId,path:"game/雪 diagnostic.rpy"});
        assert(reopened.text.includes("# Saved while running."),"accepted Source bytes survive reopen");
        checkpoint("disk-reopen-passed");
      }
    }
    assert(document.documentElement.scrollWidth <= window.innerWidth + 2,"no page overflow at package viewport");
    checkpoint("complete");
    await call("probe.runtimeUiReport",{passed:true,stage,stages,layer:"packaged WebView, synthetic DOM input, real IPC/service/SDK",nativeKeyboard:false});
  } catch (error) {
    await call("probe.runtimeUiReport",{passed:false,stage,stages,sourceState:document.querySelector(".source-document-state")?.textContent,sourceBusy:document.querySelector(".source-workspace")?.dataset.sourceBusy,saveTrace:window.__loomlightReadSaveTrace?.(),error:String(error),runtimeStatus:document.querySelector('.runtime-panel [role="status"]')?.textContent,notice:document.querySelector('.runtime-panel [role="alert"]')?.textContent,appStatus:document.querySelector("#app-status")?.textContent,output:document.querySelector(".runtime-output")?.textContent?.slice(-8192),dialog:document.querySelector(".runtime-dialog")?.textContent?.slice(0,2000),elapsedMs:Math.round(performance.now()-started)});
  }
})();
