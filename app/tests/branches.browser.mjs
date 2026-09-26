// Render the unchanged 500-Scene fixture emitted by the real core service.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";
if (!process.env.LOOMLIGHT_FLOW_EVIDENCE) throw new Error("Set LOOMLIGHT_FLOW_EVIDENCE to the core flow_budget_fixture output.");
const fixture = JSON.parse(await readFile(process.env.LOOMLIGHT_FLOW_EVIDENCE, "utf8"));
assert.equal(fixture.nodes.length, 500); assert.equal(fixture.edges.length, 2000);
const server = await createServer({ root: fileURLToPath(new URL("..", import.meta.url)), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: "chrome", headless: true, ...(process.env.LOOMLIGHT_BROWSER_EXECUTABLE ? { executablePath: process.env.LOOMLIGHT_BROWSER_EXECUTABLE } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.route("**/__branches", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><head><link rel="stylesheet" href="/src/styles.css"></head><body><main class="branches-workspace" id="host"></main></body></html>' }));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__branches`);
  const timing = await page.evaluate(async fixture => {
    const { renderBranches } = await import("/src/branches-ui.ts");
    const host = document.querySelector("#host"); const start = performance.now();
    window.__branchesFixture = fixture; window.__branchesCalls = [];
    window.__disposeBranches = renderBranches(host, { load: async () => window.__branchesFixture, source: location => window.__branchesCalls.push(["source",location]), scene: (node,edge) => window.__branchesCalls.push(["scene",node.sceneId,edge?.beatId]), status: () => {} });
    await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame);
    return performance.now() - start;
  }, fixture);
  assert.equal(await page.locator(".branch-node").count(), 500);
  assert.equal(await page.locator("path[data-edge-id]").count(), 2000);
  const samples = [];
  await page.locator(".branches-viewport").focus();
  for (let index=0; index<30; index++) {
    samples.push(await page.evaluate(async () => { const start=performance.now(); document.querySelector(".branches-viewport").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true})); await new Promise(requestAnimationFrame); return performance.now()-start; }));
  }
  const p95=samples.sort((a,b)=>a-b)[Math.ceil(samples.length*.95)-1];
  await page.getByRole("button",{name:"Zoom in",exact:true}).click();
  await page.getByRole("button",{name:"Fit graph",exact:true}).click();
  await page.getByLabel("Selected Scene",{exact:true}).selectOption(fixture.nodes[0].sceneId);
  const edge=fixture.edges.find(edge=>edge.sceneId===fixture.nodes[0].sceneId && edge.editable);
  await page.getByLabel("Selected route",{exact:true}).selectOption(edge.id);
  await page.getByRole("button",{name:"Edit Choice / Jump",exact:true}).click();
  assert.equal((await page.evaluate(()=>window.__branchesCalls))[0][2],edge.beatId);
  // Use a small subview of the same service fixture for a readable visual review.
  await page.evaluate(() => { window.__branchesFixture={...window.__branchesFixture,revision:"visual-subview",nodes:window.__branchesFixture.nodes.slice(0,5),edges:window.__branchesFixture.edges.filter(edge=>window.__branchesFixture.nodes.slice(0,5).some(node=>node.sceneId===edge.sceneId))}; });
  await page.getByRole("button",{name:"Refresh flow",exact:true}).click();
  await page.getByRole("button",{name:"Fit graph",exact:true}).click();
  if(process.env.LOOMLIGHT_BRANCHES_SCREENSHOT) await page.screenshot({path:process.env.LOOMLIGHT_BRANCHES_SCREENSHOT,fullPage:true});
  await page.setViewportSize({width:640,height:800});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({browser:await browser.version(),layer:`${process.platform} Chromium; synthetic keyboard and service-produced fixture, not packaged IPC/native input`,nodes:500,edges:2000,initialLayoutMs:timing,panFrameP95Ms:p95,panFrameSamplesMs:samples,budgetStatus:timing<2000&&p95<100?"pass":"fail",resize640:"pass",pageErrors:errors}));
  assert.ok(timing<2000,`Initial layout ${timing}ms exceeds 2000ms`);
  assert.ok(p95<100,`Pan/frame p95 ${p95}ms exceeds 100ms`);
} finally { await browser?.close(); await server.close(); }
