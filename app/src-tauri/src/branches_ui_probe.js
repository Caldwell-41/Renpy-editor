// Explicit native probe only: unchanged packaged renderer, real IPC, no SDK execution.
(async () => {
  const report = { layer: "packaged WKWebView/WebView2; synthetic DOM input; real IPC/services", visible: [], noInput: [], operations: {}, stage: "open", nativeInput: false, traced: false };
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async (condition, limit = 20000) => { const start = performance.now(); while (!condition()) { if (performance.now() - start > limit) throw new Error(`Timeout: ${report.stage}`); await delay(8); } };
  const find = label => [...document.querySelectorAll("button")].find(button => button.textContent === label);
  const click = async label => { await until(() => find(label) && !find(label).disabled); find(label).click(); };
  const raf = () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`rAF timeout: ${report.stage}`)), 5000);
    requestAnimationFrame(timestamp => { clearTimeout(timer); resolve(timestamp); });
  });
  const frames = async () => { await raf(); await raf(); };
  let serial = 0;
  const call = async (operation, payload = {}) => {
    const response = await window.__TAURI_INTERNALS__.invoke("core_request", { request: { protocolVersion: 1, requestId: `n1-${++serial}`, operation, payload } });
    if (!response.ok) throw new Error(`${operation}: ${response.error.code}`);
    return response.value;
  };
  const graphReady = () => document.querySelectorAll(".branch-node").length === 500 && document.querySelectorAll("path[data-edge-id]").length === 2000 && /^Checked at/.test(document.querySelector(".branches-observation")?.textContent ?? "");
  const checkModel = flow => {
    assert(flow.nodes.length === 500 && flow.edges.length === 2000, "full real-service graph");
    assert(!flow.stale && !flow.partial && !flow.overLimit, "complete real-service observation");
  };
  const geometry = () => {
    const view = document.querySelector(".branches-viewport"), canvas = document.querySelector(".branches-canvas");
    const r = view.getBoundingClientRect();
    const viewport = [r.left + view.clientLeft, r.top + view.clientTop, view.clientWidth, view.clientHeight];
    const box = element => { const b = element.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
    const intersection = b => Math.max(0, Math.min(b[0] + b[2], viewport[0] + viewport[2]) - Math.max(b[0], viewport[0])) * Math.max(0, Math.min(b[1] + b[3], viewport[1] + viewport[3]) - Math.max(b[1], viewport[1]));
    const nodes = [...canvas.querySelectorAll(".branch-node")];
    const svg = box(document.querySelector(".branches-lines"));
    const representatives = [0, 250, 499].map(index => box(nodes[index]));
    return { transform: canvas.style.transform, viewport, svg, representatives, svgIntersection: intersection(svg), firstNodeIntersection: intersection(representatives[0]), nodes: nodes.length, edges: canvas.querySelectorAll("path[data-edge-id]").length, visibility: document.visibilityState, focused: document.hasFocus(), viewportFocused: document.activeElement === view };
  };
  const sample = async (population, index, key) => {
    // Append before waiting so timeouts retain partial samples; no capture/trace here.
    const value = { index, key, start: performance.now() }; population.push(value);
    if (key) document.querySelector(".branches-viewport").dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    value.dispatchEnd = performance.now();
    value.raf1Timestamp = await raf(); value.raf1End = performance.now();
    value.raf2Timestamp = await raf(); value.end = performance.now();
    value.dispatchMs = value.dispatchEnd - value.start;
    value.firstRafMs = value.raf1End - value.start; value.secondRafMs = value.end - value.start;
    value.geometry = geometry();
    assert(value.start <= value.dispatchEnd && value.dispatchEnd <= value.raf1End && value.raf1End <= value.end && value.raf2Timestamp > value.raf1Timestamp, "monotonic callback endpoints");
    return value;
  };
  const stats = (values, key) => { const sorted = values.map(value => value[key]).sort((a, b) => a - b); return { count: sorted.length, p95: sorted[Math.ceil(sorted.length * .95) - 1], max: sorted[sorted.length - 1], atOrAbove100: sorted.filter(value => value >= 100).length }; };
  const near = (a, b) => assert(Math.abs(a - b) < .15, `geometry ${a} != ${b}`);
  try {
    report.environment = { userAgent: navigator.userAgent, platform: navigator.platform, devicePixelRatio, viewport: [innerWidth, innerHeight], screen: [screen.width, screen.height, screen.availWidth, screen.availHeight], timeOrigin: performance.timeOrigin };
    await until(() => find("Branches performance fixture"));
    let start = performance.now(); await click("Branches performance fixture");
    await until(() => find("Branches") && document.querySelector("#app-status")?.textContent === "Saved");
    report.operations.openToSceneReadyMs = performance.now() - start;
    assert(!/Running|Validating/.test(document.querySelector(".runtime-panel [role=status]")?.textContent ?? ""), "inspection does not execute");
    const project = await call("project.current"); let sessionId = project.sessionId;
    start = performance.now(); await click("Branches"); await until(graphReady); await frames();
    report.operations.branchesToCheckedTwoRafMs = performance.now() - start;
    if (window.__loomlightRuntimeProbeCase === "branches-interactive") return; // Native driver owns the one bounded session.
    report.stage = "real-service-refresh";
    start = performance.now(); const flow = await call("flow.list", { sessionId, refresh: true });
    report.operations.flowRefreshIpcMs = performance.now() - start; checkModel(flow);
    assert(flow.observation.status === "checked", "completed disk response");
    report.workload = { nodes: flow.nodes.length, edges: flow.edges.length, revision: flow.revision };
    report.stage = "visible-30";
    await click("Fit graph"); document.querySelector(".branches-viewport").focus(); await frames();
    const baseline = report.baseline = geometry();
    for (let index = 0; index < 30; index++) {
      const value = await sample(report.visible, index, index % 2 ? "ArrowRight" : "ArrowLeft");
      const current = value.geometry, offset = index % 2 ? 0 : 40;
      assert(current.nodes === 500 && current.edges === 2000 && current.visibility === "visible" && current.focused && current.viewportFocused, "full focused foreground graph per input");
      assert(current.svgIntersection > 0 && current.firstNodeIntersection > 0, "graph remains visibly intersecting");
      assert(current.transform !== (index ? report.visible[index - 1].geometry.transform : baseline.transform), "input transforms graph");
      assert(JSON.stringify(current.viewport) === JSON.stringify(baseline.viewport), "stable viewport");
      for (const [actual, expected] of [[current.svg, baseline.svg], ...current.representatives.map((box, n) => [box, baseline.representatives[n]])]) {
        near(actual[0], expected[0] + offset); for (let n = 1; n < 4; n++) near(actual[n], expected[n]);
      }
    }
    report.stage = "no-input-30";
    for (let index = 0; index < 30; index++) {
      const value = await sample(report.noInput, index, null);
      assert(JSON.stringify(value.geometry) === JSON.stringify(baseline), "no-input geometry/focus stable");
    }
    report.stats = Object.fromEntries(["visible", "noInput"].map(name => [name, Object.fromEntries(["dispatchMs", "firstRafMs", "secondRafMs"].map(key => [key, stats(report[name], key)]))]));
    report.stage = "refresh-ui";
    start = performance.now(); await click("Refresh flow");
    assert(document.querySelector(".branches-observation").textContent === "Checking disk", "refresh feedback");
    document.querySelector(".branches-viewport").focus();
    report.refreshPan = []; await sample(report.refreshPan, 0, "ArrowLeft");
    await until(graphReady); await frames();
    report.operations.refreshClickToCheckedTwoRafMs = performance.now() - start;
    assert(report.refreshPan[0].geometry.transform !== baseline.transform, "pan serviced while refresh requested");
    report.stage = "ordinary-edit";
    const select = document.querySelector('select[aria-label="Selected Scene"]'); select.value = project.sceneId; select.dispatchEvent(new Event("change"));
    const routes = document.querySelector('select[aria-label="Selected route"]'); routes.value = [...routes.options].find(option => option.value)?.value; routes.dispatchEvent(new Event("change"));
    await click("Edit Choice / Jump"); await until(() => document.querySelectorAll('input[aria-label="Choice option text"]').length === 4);
    const input = document.querySelector('input[aria-label="Choice option text"]'); input.value = "Route A"; input.dispatchEvent(new Event("input", { bubbles: true }));
    start = performance.now(); await click("Commit Beat"); await until(() => !input.isConnected && document.querySelector("#app-status")?.textContent === "Saved"); await frames();
    report.operations.commitClickToSavedTwoRafMs = performance.now() - start;
    start = performance.now(); const edited = await call("flow.list", { sessionId });
    report.operations.postEditObservedFlowIpcMs = performance.now() - start; checkModel(edited);
    assert(edited.edges.some(edge => edge.sceneId === project.sceneId && edge.text === "Route A"), "accepted caption in model");
    report.postEditObservation = edited.observation;
    start = performance.now(); await click("Branches"); await until(graphReady); await frames();
    report.operations.returnToBranchesCheckedTwoRafMs = performance.now() - start;
    await click("Close Project"); await click("Branches performance fixture"); await until(() => find("Branches") && document.querySelector("#app-status")?.textContent === "Saved");
    const reopened = await call("project.current"); assert(reopened.sessionId !== sessionId, "new session on reopen"); sessionId = reopened.sessionId;
    const persisted = await call("flow.list", { sessionId, refresh: true }); checkModel(persisted);
    assert(persisted.edges.some(edge => edge.sceneId === project.sceneId && edge.text === "Route A"), "accepted edit survives disk reopen");
    await click("Source"); await until(() => document.querySelector('button[title="game/chapters/chapter_01/scene_000.rpy"]'));
    document.querySelector('button[title="game/chapters/chapter_01/scene_000.rpy"]').click();
    await until(() => document.querySelector("textarea")?.value.includes('"Route A"'));
    report.sourceReopen = "accepted caption visible";
    await click("Close Project");
    report.stage = "complete";
    report.proxyBudgetStatus = report.stats.visible.firstRafMs.p95 < 100 && report.stats.visible.secondRafMs.p95 < 100 ? "pass" : "fail";
    report.passed = report.proxyBudgetStatus === "pass";
  } catch (error) { report.passed = false; report.error = String(error); report.appStatus = document.querySelector("#app-status")?.textContent; }
  await call("probe.runtimeUiReport", report);
})();
