// Qualification setup/readback only. Measured actions must arrive as trusted OS events.
(async () => {
  let stage = "setup", serial = 0, latest, gesture, eventOverflow = false;
  const rows = [], events = [];
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const until = async predicate => {
    const deadline = performance.now() + 180000;
    while (!predicate()) { assert(!eventOverflow, "Native event limit exceeded"); assert(performance.now() < deadline, `Timeout: ${stage}`); await pause(20); }
  };
  const call = async (operation, payload = {}) => {
    const result = await window.__TAURI_INTERNALS__.invoke("core_request", {request: {
      protocolVersion: 1, requestId: `canvas-input-${++serial}`, operation, payload,
    }});
    if (!result.ok) {
      const error = Error(`${operation}: ${result.error.code}`);
      error.code = result.error.code;
      throw error;
    }
    return result.value;
  };
  const read = (operation, payload) => window.__loomlightProbeRetryBusy(() => call(operation, payload));
  const find = window.__loomlightProbeFindButton;
  const field = () => document.querySelector('.screens-editor [aria-label="Width"]');
  const fresh = () => document.querySelector('.screen-game')?.dataset.stale === "false";
  const named = e => e?.getAttribute("aria-label") || e?.textContent?.trim().slice(0,60) || e?.tagName;
  const listen = event => {
    if (!event.target.closest?.(".screens-editor")) return;
    if (events.length >= 4096) { eventOverflow = true; return; }
    events.push({stage, type:event.type, trusted:event.isTrusted, at:performance.now(),
      key:event.type === "keydown" ? event.key : undefined, target:named(event.target), x:event.clientX, y:event.clientY, pointerId:event.pointerId});
  };
  for (const type of ["keydown", "input", "pointerdown", "pointermove", "pointerup"]) document.addEventListener(type, listen, true);
  const trusted = (type, key) => events.some(e => e.stage === stage && e.type === type && e.trusted && (!key || e.key === key));
  const instructions = {
    "draft-width-760":"1/8: In Width, select all and type 760. Do not press Enter yet.",
    "escape-cancel":"2/8: Press Escape. Width should return to 640.",
    "enter-apply-752":"3/8: In Width, select all, type 752, then press Enter.",
    "keyboard-undo":"4/8: Undo is focused. Press Enter to restore width 640.",
    "resize-arrow-right":"5/8: The resize handle is focused. Press Right Arrow once.",
    "move-arrow-right":"6/8: The Help frame is focused. Press Right Arrow once.",
    "drag-frame":"7/8: Drag the Move frame handle a short distance right and down. Stay inside the canvas; use no modifier keys.",
    "drag-resize":"8/8: Drag the small bottom-right resize handle a short distance right and down. Stay inside the canvas; use no modifier keys.",
  };
  const guide=document.createElement("div"); guide.setAttribute("role","status");
  guide.style.cssText="position:fixed;bottom:0;left:0;right:0;z-index:99999;padding:10px;background:#111;color:#fff;font:14px sans-serif;pointer-events:none";
  document.body.append(guide);
  const announce = async (next, control) => {
    stage = next; guide.textContent=instructions[next];
    if (control) control.focus(); // Setup only; native driver verifies actual focus before sending.
    const r = control?.getBoundingClientRect();
    await call("probe.canvasInputStage", {stage, control:named(control), focused:document.activeElement === control,
      rect:r && {x:r.x,y:r.y,width:r.width,height:r.height}, rows});
  };
  window.__loomlightCanvasEvidence = true;
  window.addEventListener("loomlight-canvas-probe-response", event => {
    const result = event.detail.response;
    if (result?.ok && result.value?.phase === "ready" && result.value.image) latest = result.value;
  });
  try {
    await until(() => document.querySelector('.recent-open'));
    document.querySelector('.recent-open').click(); await until(() => find("Screens")); find("Screens").click();
    await until(() => fresh() && latest);
    const project = await read("project.current"), sessionId = project.sessionId;
    const source = () => read("source.open", {sessionId, path:"game/ui/help.rpy"});
    const original = (await source()).text;
    const accepted = async (expected, matches = actual => actual === expected) => {
      const deadline = performance.now() + 15000;
      let document;
      do {
        document = await source();
        assert(performance.now() < deadline, "Accepted source did not settle");
        if (!matches(document.text)) await pause(20);
      } while (!matches(document.text));
      await until(() => fresh() && latest?.revision === document.baseRevision);
      return document;
    };
    const restored = () => accepted(original);
    const frameGeometry = () => latest.geometry.find(g => g.width >= 600 && g.height >= 300 && g.width < 1280);
    const checkGeometry = (x,y,width,height) => {
      const g=frameGeometry();
      assert(g && g.x===x && g.y===y && g.width===width && g.height===height, `Accepted frame geometry differs: ${JSON.stringify({actual:g,expected:{x,y,width,height}})}`);
    };
    const gestureResult = async (resize) => {
      const path=events.filter(e => e.stage===stage && e.trusted);
      const down=path.find(e=>e.type==="pointerdown");
      const up=path.find(e=>e.type==="pointerup" && e.pointerId===down?.pointerId && e.at>=down.at);
      const moves=path.filter(e=>e.type==="pointermove" && e.pointerId===down?.pointerId && e.at>=down.at && e.at<=up?.at);
      assert(down && up && moves.length>=3, "Gesture path missing");
      const last=moves.at(-1), scale=document.querySelector('.screen-game').getBoundingClientRect().width/1280;
      const dx=(last.x-down.x)/scale, dy=(last.y-down.y)/scale;
      let expected=original, x=320,y=180,width=640,height=360;
      if(resize) {
        width=Math.round((640+2*dx)/8)*8;height=Math.round((360+2*dy)/8)*8;
        expected=expected.replace("xsize 640",`xsize ${width}`).replace("ysize 360",`ysize ${height}`);
        x=(1280-width)/2;y=(720-height)/2;
      } else {
        x=Math.max(0,Math.min(640,x+Math.round(dx/8)*8));
        y=Math.max(0,Math.min(360,y+Math.round(dy/8)*8));
        const pos=(n,d)=>{const v=n/d;return Number.isInteger(v)?`${v}.0`:String(v);};
        expected=expected.replace("xalign 0.5",`xalign ${pos(x,640)}`).replace("yalign 0.5",`yalign ${pos(y,360)}`);
      }
      // Retain the actual displacement inputs even if accepted-source readback fails.
      gesture={stage,resize,down,last,up,scale,dx,dy,x,y,width,height};
      assert(expected!==original,"Gesture was a no-op");
      const savedDocument = await accepted(expected, resize ? undefined : actual => window.__loomlightProbePositionSourceMatches(actual, expected));
      if (resize) checkGeometry(x,y,width,height);
      else {
        // Match geometry exactly to the admitted source's float values. Keep the
        // independently calculated snapped position above as the input oracle.
        const alignment = name => Number(savedDocument.text.split('\n').find(line => line.trimStart().startsWith(`${name} `)).trim().split(' ')[1]);
        gesture.savedAlignment = {xalign:alignment('xalign'), yalign:alignment('yalign')};
        checkGeometry(gesture.savedAlignment.xalign * 640,gesture.savedAlignment.yalign * 360,width,height);
      }
      return {dx,dy,x,y,width,height,pointerMoves:moves.length};
    };
    const row = [...document.querySelectorAll('.screen-tree [role="option"]')].find(e => e.textContent === "Help frame");
    row.dispatchEvent(new MouseEvent("dblclick", {bubbles:true})); await until(field);
    await announce("draft-width-760", field());
    await until(() => trusted("keydown") && trusted("input") && field()?.value === "760" && fresh());
    assert(latest.geometry.some(g => g.width === 760 && g.height === 360), "Draft geometry missing");
    assert(document.activeElement === field(), "Field focus lost during helper update");
    assert((await source()).text === original, "Draft wrote source"); rows.push({stage, passed:true});
    await announce("escape-cancel", field());
    await until(() => trusted("keydown", "Escape") && field()?.value === "640" && fresh());
    assert((await source()).text === original, "Cancel wrote source"); rows.push({stage, passed:true});
    await announce("enter-apply-752", field());
    await until(() => trusted("keydown", "Enter") && field()?.value === "752" && fresh() && document.querySelector('.screen-message')?.textContent.startsWith("Size saved"));
    await accepted(original.replace("xsize 640", "xsize 752")); checkGeometry(264,180,752,360); rows.push({stage, passed:true});
    await announce("keyboard-undo", find("Undo"));
    await until(() => trusted("keydown", "Enter") && field()?.value === "640" && fresh());
    assert((await source()).text === original, "Accepted source did not settle"); rows.push({stage, passed:true});
    const handle = () => document.querySelector('.screen-resize');
    await until(handle); await announce("resize-arrow-right", handle());
    await until(() => trusted("keydown", "ArrowRight") && field()?.value === "641" && fresh());
    await accepted(original.replace("xsize 640", "xsize 641")); checkGeometry(319.5,180,641,360); rows.push({stage, passed:true});
    find("Undo").click(); await restored();
    const frame = () => [...document.querySelectorAll('.screen-node')].find(e => e.getAttribute("aria-label") === "Select Help frame");
    await until(frame); await announce("move-arrow-right", frame());
    await until(() => trusted("keydown", "ArrowRight") && fresh() && document.querySelector('.screen-message')?.textContent.startsWith("Position saved"));
    await accepted(original.replace("xalign 0.5", "xalign 0.5015625")); checkGeometry(321,180,640,360); rows.push({stage, passed:true});
    find("Undo").click(); await restored();
    assert((await source()).text === original, "Move Undo failed");
    await announce("drag-frame", document.querySelector(".screen-move"));
    await until(() => trusted("pointerup") && fresh() && document.querySelector('.screen-message')?.textContent.startsWith("Position saved"));
    assert(trusted("pointerdown") && events.filter(e => e.stage === stage && e.type === "pointermove" && e.trusted).length >= 3, "Drag path missing");
    const movement=await gestureResult(false); rows.push({stage, passed:true, geometry:movement});
    find("Undo").click(); await restored(); assert((await source()).text === original, "Drag Undo failed");
    await announce("drag-resize", handle());
    await until(() => trusted("pointerup") && fresh() && field()?.value !== "640");
    assert(trusted("pointerdown") && events.filter(e => e.stage === stage && e.type === "pointermove" && e.trusted).length >= 3, "Resize path missing");
    const resizing=await gestureResult(true); rows.push({stage, passed:true, geometry:resizing});
    find("Undo").click(); await restored();
    assert((await source()).text === original, "Resize Undo failed");
    find("Close Project").click(); await until(() => document.querySelector('.recent-open'));
    await call("probe.runtimeUiReport", {passed:true, scenario:"canvas-input", stage:"complete", rows, events:events.filter(e => e.type !== "pointermove"), pointerMoves:events.filter(e => e.type === "pointermove").length,
      gesture,inputKind:"trusted-events", nativeInputQualified:false, warmPresentationProof:false, perceivedSmoothnessProof:false});
  } catch (error) {
    await call("probe.runtimeUiReport", {passed:false, scenario:"canvas-input", stage, rows, gesture, events:events.filter(e => e.type !== "pointermove"), pointerMoves:events.filter(e => e.type === "pointermove").length, error:String(error)});
  }
})();
