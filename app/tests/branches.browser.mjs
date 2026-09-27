// Real service fixture + unchanged production renderer. Synthetic Chromium input only.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { arch, cpus, release } from "node:os";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const sha256 = bytes => createHash("sha256").update(bytes).digest("hex");
const p95 = values => [...values].sort((a, b) => a - b)[Math.ceil(values.length * .95) - 1];
const evidenceDir = process.env.LOOMLIGHT_BRANCHES_EVIDENCE_DIR;
const traced = process.env.LOOMLIGHT_BRANCHES_TRACE === "1";
if (traced && !evidenceDir) throw new Error("Tracing requires LOOMLIGHT_BRANCHES_EVIDENCE_DIR.");
if (!process.env.LOOMLIGHT_FLOW_EVIDENCE) throw new Error("Set LOOMLIGHT_FLOW_EVIDENCE to the core flow_observed_budget_fixture output.");
const fixtureBytes = await readFile(process.env.LOOMLIGHT_FLOW_EVIDENCE);
const fixture = JSON.parse(fixtureBytes);
assert.equal(fixture.nodes.length, 500); assert.equal(fixture.edges.length, 2000);
if (evidenceDir) await mkdir(evidenceDir, { recursive: true });
const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceHashes = {};
for (const name of ["tests/branches.browser.mjs", "src/branches-ui.ts", "src/styles.css", "package-lock.json"]) {
  sourceHashes[name] = sha256(await readFile(join(appRoot, name)));
}
const report = {
  schemaVersion: 2, status: "in_progress", traced, fixtureSha256: sha256(fixtureBytes), sourceHashes,
  gitHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: appRoot, encoding: "utf8" }).trim(),
  environment: { platform: process.platform, arch: arch(), osRelease: release(), cpu: cpus()[0]?.model,
    node: process.version, playwright: JSON.parse(await readFile(join(appRoot, "node_modules/playwright/package.json"))).version,
    runnerImage: process.env.ImageOS ?? null, runnerImageVersion: process.env.ImageVersion ?? null },
  layer: "Chromium; synthetic keyboard and service-produced fixture, not packaged IPC/native input",
  endpoints: { original: "dispatch-to-first-rAF continuation (legacy gate)",
    visible: "dispatch-to-first-rAF and dispatch-to-second-rAF continuation (rendering-opportunity diagnostic, not guaranteed presentation)" },
  nodes: 500, edges: 2000, original: [], visible: [], noInput: [], captures: [], pageErrors: [], cleanup: {},
};
const server = await createServer({ root: appRoot, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
let browser, tracing = false, deadline;
const near = (a, b) => assert.ok(Math.abs(a - b) < .1, `Geometry changed: ${a} vs ${b}`);
try {
  await server.listen();
  report.serverPort = server.httpServer.address().port;
  browser = await chromium.launch({ channel: "chrome", headless: true, ...(process.env.LOOMLIGHT_BROWSER_EXECUTABLE ? { executablePath: process.env.LOOMLIGHT_BROWSER_EXECUTABLE } : {}) });
  report.browser = await browser.version();
  // Fixed workload + deadline bound trace collection even if rAF stops arriving.
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  deadline = setTimeout(() => { report.deadlineExceeded = true; void page.close().catch(() => {}); }, 60_000);
  page.setDefaultTimeout(10_000);
  page.on("pageerror", error => report.pageErrors.push(error.message));
  const browserCdp = await browser.newBrowserCDPSession();
  const system = await browserCdp.send("SystemInfo.getInfo");
  report.gpu = system.gpu;
  report.browserProcesses = (await browserCdp.send("SystemInfo.getProcessInfo")).processInfo;
  if (traced) {
    const start = performance.now();
    await browser.startTracing(page, { path: join(evidenceDir, "trace.json"),
      categories: ["devtools.timeline", "blink.user_timing", "cc", "gpu", "viz", "disabled-by-default-devtools.screenshot"] });
    tracing = true;
    report.traceStartWallMs = performance.now() - start;
  }
  await page.route("**/__branches", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><head><link rel="stylesheet" href="/src/styles.css"></head><body><main class="branches-workspace" id="host"></main></body></html>' }));
  await page.goto(`http://127.0.0.1:${report.serverPort}/__branches`);
  report.initialLayoutMs = await page.evaluate(async fixture => {
    const { renderBranches } = await import("/src/branches-ui.ts");
    const host = document.querySelector("#host"); const start = performance.now();
    window.__branchesFixture = fixture; window.__branchesCalls = [];
    window.__disposeBranches = renderBranches(host, { load: async () => window.__holdFlowRefresh ? new Promise(resolve => { window.__releaseFlowRefresh = resolve; }) : window.__branchesFixture, source: location => window.__branchesCalls.push(["source",location]), scene: (node,edge) => window.__branchesCalls.push(["scene",node.sceneId,edge?.beatId]), status: () => {} });
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    return performance.now() - start;
  }, fixture);
  assert.equal(await page.locator(".branch-node").count(), 500);
  assert.equal(await page.locator("path[data-edge-id]").count(), 2000);
  await page.evaluate(() => { window.__holdFlowRefresh = true; });
  await page.getByRole("button", { name: "Refresh flow", exact: true }).click();
  assert.match(await page.locator(".branches-observation").textContent(), /Checking disk/);
  await page.locator(".branches-viewport").focus();

  const geometry = () => page.evaluate(() => {
    const view = document.querySelector(".branches-viewport"), canvas = document.querySelector(".branches-canvas");
    const outer = view.getBoundingClientRect();
    const viewport = { left: outer.left + view.clientLeft, top: outer.top + view.clientTop, width: view.clientWidth, height: view.clientHeight };
    viewport.right = viewport.left + viewport.width; viewport.bottom = viewport.top + viewport.height;
    const intersection = box => Math.max(0, Math.min(box.right, viewport.right) - Math.max(box.left, viewport.left)) * Math.max(0, Math.min(box.bottom, viewport.bottom) - Math.max(box.top, viewport.top));
    const svg = document.querySelector(".branches-lines").getBoundingClientRect().toJSON();
    const nodes = [...canvas.querySelectorAll(".branch-node")];
    return { transform: canvas.style.transform, viewport, svg, intersection: intersection(svg),
      visibility: document.visibilityState, focused: document.hasFocus(), viewportFocused: document.activeElement === view,
      nodes: nodes.length, edges: canvas.querySelectorAll("path[data-edge-id]").length,
      representatives: [nodes[0], nodes[250], nodes[499]].map(node => ({ id: node.dataset.sceneId,
        box: node.getBoundingClientRect().toJSON(), intersection: intersection(node.getBoundingClientRect()) })) };
  });
  // Geometry reads, screenshots and trace marks stay outside timed input intervals.
  const sample = (sequence, index, key, secondRaf) => page.evaluate(async ({ sequence, index, key, secondRaf, traced }) => {
    const mark = `m1-${sequence}-${index}`;
    if (traced) performance.mark(`${mark}-before`);
    const start = performance.now();
    if (key) document.querySelector(".branches-viewport").dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    const dispatchEnd = performance.now();
    const raf1Timestamp = await new Promise(requestAnimationFrame);
    const raf1End = performance.now();
    let raf2Timestamp = null, end = raf1End;
    if (secondRaf) { raf2Timestamp = await new Promise(requestAnimationFrame); end = performance.now(); }
    if (traced) {
      // Backdated User Timing entries correlate exact timer boundaries in the trace.
      for (const [name, startTime] of Object.entries({ start, dispatchEnd, raf1End, end })) performance.mark(`${mark}-${name}`, { startTime });
    }
    return { index, key, start, dispatchEnd, raf1Timestamp, raf1End, raf2Timestamp, end,
      dispatchMs: dispatchEnd - start, dispatchToRafMs: raf1End - start, renderingOpportunityMs: secondRaf ? end - start : null };
  }, { sequence, index, key, secondRaf, traced });
  const checkTiming = sample => {
    assert.ok(sample.start <= sample.dispatchEnd && sample.dispatchEnd <= sample.raf1End && sample.raf1End <= sample.end);
    // rAF's supplied timestamp may precede dispatch; it is not the callback-entry time.
    if (sample.raf2Timestamp !== null) assert.ok(sample.raf2Timestamp > sample.raf1Timestamp);
  };

  report.originalBefore = await geometry();
  for (let index = 0; index < 30; index++) {
    const value = await sample("original", index, "ArrowRight", false);
    report.original.push(value); checkTiming(value);
  }
  report.originalAfter = await geometry();
  report.panFrameSamplesMs = report.original.map(value => value.dispatchToRafMs); // Historical output aliases.
  report.panDispatchSamplesMs = report.original.map(value => value.dispatchMs);
  report.panFrameP95Ms = p95(report.panFrameSamplesMs);
  report.panDispatchMaxMs = Math.max(...report.panDispatchSamplesMs);

  await page.getByRole("button", { name: "Fit graph", exact: true }).click();
  await page.locator(".branches-viewport").focus();
  const baseline = report.visibleBaseline = await geometry();
  assert.ok(baseline.intersection > 0 && baseline.representatives[0].intersection > 0);
  let previous = baseline;
  for (let index = 0; index < 30; index++) {
    // Rightward first: fitted x=0 <-> x=40 keeps the complete horizontal graph extent in view.
    const value = await sample("visible", index, index % 2 ? "ArrowRight" : "ArrowLeft", true);
    report.visible.push(value);
    value.geometry = await geometry();
    checkTiming(value);
    const current = value.geometry, offset = index % 2 ? 0 : 40;
    assert.notEqual(current.transform, previous.transform);
    assert.equal(current.nodes, 500); assert.equal(current.edges, 2000);
    assert.equal(current.visibility, "visible"); assert.equal(current.focused, true); assert.equal(current.viewportFocused, true);
    assert.ok(current.intersection > 0 && current.representatives[0].intersection > 0);
    assert.deepEqual(current.viewport, baseline.viewport);
    near(current.svg.left, baseline.svg.left + offset); near(current.svg.top, baseline.svg.top);
    near(current.svg.width, baseline.svg.width); near(current.svg.height, baseline.svg.height);
    for (let n = 0; n < current.representatives.length; n++) {
      const actual = current.representatives[n], expected = baseline.representatives[n];
      assert.equal(actual.id, expected.id);
      near(actual.box.left, expected.box.left + offset); near(actual.box.top, expected.box.top);
      near(actual.box.width, expected.box.width); near(actual.box.height, expected.box.height);
    }
    if (evidenceDir && index < 2) {
      // Separate frame evidence, NOT a screenshot-based latency endpoint. No scrolling/clicking.
      const { left: x, top: y, width, height } = current.viewport;
      const start = performance.now(), file = `visible-${index}.png`;
      const bytes = await page.screenshot({ path: join(evidenceDir, file), clip: { x, y, width, height } });
      report.captures.push({ index, file, sha256: sha256(bytes), wallMs: performance.now() - start });
      assert.deepEqual(await geometry(), current);
    }
    previous = current;
  }
  if (evidenceDir) assert.notEqual(report.captures[0].sha256, report.captures[1].sha256);
  report.visibleDispatchToRafP95Ms = p95(report.visible.map(value => value.dispatchToRafMs));
  report.visibleRenderingOpportunityP95Ms = p95(report.visible.map(value => value.renderingOpportunityMs));
  report.panDuringHeldRefresh = true;
  assert.match(await page.locator(".branches-observation").textContent(), /Checking disk/);

  if (traced) {
    // Fixed no-input control after Fit, same per-sample CDP schedule/two-rAF endpoint.
    // Fit may leave graphics work pending; no warm-up or discarded samples.
    await page.getByRole("button", { name: "Fit graph", exact: true }).click();
    await page.locator(".branches-viewport").focus();
    for (let index = 0; index < 30; index++) {
      const value = await sample("no-input", index, null, true);
      report.noInput.push(value); checkTiming(value);
      value.geometry = await geometry();
      assert.deepEqual(value.geometry, baseline);
    }
    report.noInputRenderingOpportunityP95Ms = p95(report.noInput.map(value => value.renderingOpportunityMs));
  }
  await page.getByRole("button", {name:"Zoom in",exact:true}).click();
  await page.getByRole("button", {name:"Fit graph",exact:true}).click();
  await page.getByLabel("Selected Scene",{exact:true}).selectOption(fixture.nodes[0].sceneId);
  const edge=fixture.edges.find(edge=>edge.sceneId===fixture.nodes[0].sceneId && edge.editable);
  await page.getByLabel("Selected route",{exact:true}).selectOption(edge.id);
  await page.getByRole("button",{name:"Edit Choice / Jump",exact:true}).click();
  assert.equal((await page.evaluate(()=>window.__branchesCalls))[0][2],edge.beatId);
  await page.evaluate(() => { window.__holdFlowRefresh=false; window.__releaseFlowRefresh({...window.__branchesFixture, observation:{status:"checked",checkedAt:Date.now()}}); });
  await page.waitForFunction(() => document.querySelector(".branches-observation").textContent.startsWith("Checked at"));
  report.navigationAndRefresh = "pass";
  // Small subview only after all full-workload measurements and assertions.
  await page.evaluate(() => { window.__branchesFixture={...window.__branchesFixture,revision:"visual-subview",nodes:window.__branchesFixture.nodes.slice(0,5),edges:window.__branchesFixture.edges.filter(edge=>window.__branchesFixture.nodes.slice(0,5).some(node=>node.sceneId===edge.sceneId))}; });
  await page.getByRole("button",{name:"Refresh flow",exact:true}).click();
  await page.getByRole("button",{name:"Fit graph",exact:true}).click();
  if(process.env.LOOMLIGHT_BRANCHES_SCREENSHOT) await page.screenshot({path:process.env.LOOMLIGHT_BRANCHES_SCREENSHOT,fullPage:true});
  await page.setViewportSize({width:640,height:800});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  report.resize640 = "pass";
  assert.deepEqual(report.pageErrors,[]);
  report.budgetStatus = report.initialLayoutMs < 2000 && report.panFrameP95Ms < 100 && report.visibleDispatchToRafP95Ms < 100 && report.visibleRenderingOpportunityP95Ms < 100 ? "pass" : "fail";
  assert.ok(report.initialLayoutMs < 2000, `Initial layout ${report.initialLayoutMs}ms exceeds 2000ms`);
  assert.ok(Math.max(...report.original.concat(report.visible).map(value => value.dispatchMs)) < 100, "Synchronous input dispatch blocked during held refresh");
  assert.ok(report.panFrameP95Ms < 100, `Original dispatch-to-rAF p95 ${report.panFrameP95Ms}ms exceeds 100ms`);
  assert.ok(report.visibleDispatchToRafP95Ms < 100, `Visible dispatch-to-rAF p95 ${report.visibleDispatchToRafP95Ms}ms exceeds 100ms`);
  assert.ok(report.visibleRenderingOpportunityP95Ms < 100, `Visible rendering-opportunity diagnostic p95 ${report.visibleRenderingOpportunityP95Ms}ms exceeds 100ms`);
  report.status = "pass";
} catch (error) {
  report.status = "fail"; report.failure = String(error); process.exitCode = 1;
} finally {
  clearTimeout(deadline);
  // Independent cleanup attempts preserve partial samples/trace on assertion failures.
  if (tracing) {
    const start = performance.now();
    try { await browser.stopTracing(); report.traceSaved = true; }
    catch (error) { report.traceFailure = String(error); report.status = "fail"; process.exitCode = 1; }
    report.traceStopWallMs = performance.now() - start;
  }
  for (const [name, close] of [["browser", () => browser?.close()], ["server", () => server.close()]]) {
    try { await close(); report.cleanup[name] = "closed"; }
    catch (error) { report.cleanup[name] = String(error); report.status = "fail"; process.exitCode = 1; }
  }
  const json = JSON.stringify(report);
  if (evidenceDir) await writeFile(join(evidenceDir, "report.json"), `${json}\n`);
  console.log(json);
}
