import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { build, createServer } from "vite";
import { chromium } from "playwright";
import checkShared from "./check-shared.mjs";

const usage = `Usage: npm run design:check -- <screen> <layout> [options]
  --state <id>          One sample state (default: first registered state)
  --viewport <id>       One registered size (default: wide)
  --theme <dark|light>  Default: dark
  --interaction <path>  Explicit check module inside this screen's directory
  --capture            Save a review screenshot

Separate checks, selected by the change:
  npm run design:check -- --approval <screen>
  npm run design:check -- --shared
  npm run design:check -- --build
  npm run design:typecheck
  npm run design:approvals

No arguments prints this help. There is no gallery-wide mode.`;
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    state: { type: "string" }, viewport: { type: "string" }, theme: { type: "string" },
    interaction: { type: "string" }, capture: { type: "boolean" },
    approval: { type: "boolean" }, shared: { type: "boolean" }, build: { type: "boolean" },
    help: { type: "boolean" },
  },
});
if (values.help || process.argv.length === 2) {
  console.log(usage);
  process.exit(values.help ? 0 : 1);
}
const mode = values.shared ? "shared" : values.build ? "build" : values.approval ? "approval" : "prototype";
assert([values.shared, values.build, values.approval].filter(Boolean).length <= 1, "Select one check mode.");
assert.equal(positionals.length, mode === "prototype" ? 2 : mode === "approval" ? 1 : 0, usage);
for (const id of positionals) assert.match(id, /^[a-z][a-z0-9-]*$/, "Pass registered screen/layout IDs.");
if (mode !== "prototype") {
  assert(![values.state, values.viewport, values.theme, values.interaction, values.capture].some(value => value !== undefined), "Sample options belong to prototype checks.");
}
const [screenId, variantId] = positionals;
const lab = new URL("./", import.meta.url);
const app = new URL("../", lab);
const output = await mkdtemp(path.join(tmpdir(), "loomlight-design-check-"));
const report = { mode, basis: "Selected lab proof only; no historical visual fidelity, app persistence or native acceptance", cases: [], approvalChecks: [], checks: [], errors: [] };
let server, browser, page, failure;
try {
  if (mode === "build") {
    const production = await build({
      root: fileURLToPath(app), configFile: fileURLToPath(new URL("vite.config.ts", app)),
      logLevel: "silent", build: { write: false },
    });
    let chunks = 0;
    for (const result of Array.isArray(production) ? production : [production]) for (const entry of result.output) {
      if (entry.type !== "chunk") continue;
      chunks++;
      assert(Object.keys(entry.modules).every(id => !id.replaceAll("\\", "/").includes("/design-lab/")), "Lab code entered production build");
    }
    assert(chunks > 0, "The production build produced no JavaScript chunks");
    report.checks.push("production build excludes Design Lab; dist unchanged");
  } else {
    server = await createServer({
      configFile: fileURLToPath(new URL("vite.config.ts", lab)),
      cacheDir: path.join(output, "vite-cache"), logLevel: "silent",
      server: { host: "127.0.0.1", port: 0, strictPort: false },
    });
    await server.listen();
    const address = server.httpServer.address();
    assert(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    try { browser = await chromium.launch({ channel: "chrome", headless: true }); }
    catch { browser = await chromium.launch({ headless: true }); }
    report.browserVersion = browser.version();
    page = await browser.newPage();
    page.setDefaultTimeout(8000);
    const assets = { enabled: true, errors: [] };
    page.on("pageerror", error => report.errors.push(error.message));
    page.on("response", response => {
      if (assets.enabled && response.status() >= 400) assets.errors.push(`${response.status()}: ${new URL(response.url()).pathname}`);
    });
    page.on("requestfailed", request => {
      const cancelledNavigation = request.resourceType() === "document" && request.failure()?.errorText === "net::ERR_ABORTED";
      if (assets.enabled && !cancelledNavigation) assets.errors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
    });
    // Focused samples stay stable while other agents edit; --shared exercises HMR.
    if (mode !== "shared") await page.routeWebSocket("**", () => {});
    await page.goto(origin);
    const { screens, viewports } = await page.evaluate(async () => {
      const catalog = await import("/registry.ts");
      return {
        screens: catalog.screens.map(({ id, variants, states, approval }) => ({ id, variants: variants.map(item => item.id), states: states.map(item => item.id), approval })),
        viewports: catalog.viewports,
      };
    });
    const selected = screens.find(screen => screen.id === screenId);
    if (screenId) assert(selected, `Unknown Design Lab screen: ${screenId}`);
    if (variantId) assert(selected.variants.includes(variantId), `Unknown layout: ${screenId}/${variantId}`);
    const defaults = {
      screen: screenId ?? "character-notes", variant: variantId ?? "starter",
      state: values.state ?? selected?.states[0] ?? "populated",
      theme: values.theme ?? "dark", viewport: values.viewport ?? "wide",
    };
    // Only this disposable browser sees drafts. Actual approvals remain intact and
    // --approval verifies the selected record using real metadata, without this route.
    if (mode !== "approval") {
      const drafts = screens.map(({ approval }) => ({ ...approval, sourceMatches: {}, record: {
        ...approval.record, currentApproved: null,
        revisions: approval.record.revisions.map(revision => ({ ...revision, approval: null })),
      } }));
      await page.route("**/*design-lab-approvals*", route => route.fulfill({
        contentType: "application/javascript", body: `export const approvalRecords = ${JSON.stringify(drafts)};`,
      }));
    }
    async function ready(target = page) {
      await target.locator('#preview[data-ready="true"], #preview[data-error="true"]').waitFor();
      assert.equal(await target.locator("#preview").getAttribute("data-error"), null, await target.locator("#preview").innerText());
    }
    async function open(options = {}) {
      const sample = { ...defaults, ...options };
      if (mode === "prototype") {
        assert.equal(sample.screen, screenId, "Interaction checks must stay on the selected screen.");
        assert.equal(sample.variant, variantId, "Interaction checks must stay on the selected layout.");
      }
      const screen = screens.find(item => item.id === sample.screen);
      assert(screen?.variants.includes(sample.variant), "Unknown screen/layout selection");
      assert(screen.states.includes(sample.state), `Unknown sample state: ${sample.state}`);
      assert(["dark", "light"].includes(sample.theme), `Unknown theme: ${sample.theme}`);
      const size = viewports.find(item => item.id === sample.viewport);
      assert(size, `Unknown viewport: ${sample.viewport}`);
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.goto(`${origin}/preview.html?${new URLSearchParams(sample)}`);
      await ready();
      assert.equal(await page.locator("#preview").getAttribute("data-screen"), sample.screen);
      assert.equal(await page.locator("#preview").getAttribute("data-variant"), sample.variant);
      assert.equal(await page.locator("#preview").getAttribute("data-state"), sample.state);
      const bounds = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, overflow: document.documentElement.scrollWidth > innerWidth }));
      assert.equal(bounds.theme, sample.theme);
      assert.equal(bounds.overflow, false, `Horizontal overflow: ${JSON.stringify(sample)}`);
      assert.deepEqual(await page.evaluate(async () => (await import("/native.ts")).blockedOperations()), []);
      report.cases.push(sample);
      return page;
    }
    async function capture(name = "review") {
      assert.match(name, /^[a-z0-9-]+$/i, "Use a simple capture name.");
      if (values.capture) await page.screenshot({ path: path.join(output, `${name}.png`) });
    }
    if (mode === "prototype") {
      await open();
      report.checks.push("selected sample readiness, identity, theme, overflow and native refusal");
      if (values.interaction) {
        const checkUrl = new URL(values.interaction, lab);
        assert(checkUrl.href.startsWith(new URL(`screens/${screenId}/`, lab).href) && checkUrl.pathname.endsWith(".mjs"), "Interaction module must be inside the selected screen's directory.");
        const { default: check } = await import(checkUrl.href);
        await check({ page, open, origin, ready, capture });
        report.checks.push("selected interaction");
      }
      await capture();
    } else if (mode === "approval") {
      const { record, sourceMatches } = selected.approval;
      const revision = record.revisions.find(item => item.id === record.currentApproved);
      assert(revision, `No current approval for ${screenId}`);
      const reference = revision.approval.captures[0];
      const viewport = viewports.find(item => item.width === reference.width && item.height === reference.height) ?? viewports[0];
      await page.setViewportSize({ width: reference.width, height: reference.height });
      await page.goto(`${origin}/?${new URLSearchParams({ screen: screenId, variant: revision.variantId, state: reference.state, theme: reference.theme, viewport: viewport.id })}`);
      assert.match(await page.locator(".lab-current-approval").innerText(), new RegExp(revision.id));
      const preview = page.frameLocator('iframe[title="Screen preview"]');
      if (sourceMatches[revision.id]) {
        await ready(preview);
        const recordedSize = reference.width === viewport.width && reference.height === viewport.height;
        assert.match(await page.getByLabel("Design approval", { exact: true }).innerText(), recordedSize ? /Approved/ : /outside recorded comparison states/);
      } else {
        await preview.locator('#preview[data-error="true"]').waitFor();
        assert.match(await preview.locator("#preview").innerText(), /Approved source has changed/);
        assert.match(await page.getByLabel("Design approval", { exact: true }).innerText(), /source changed/);
      }
      report.approvalChecks.push({ screen: screenId, revision: revision.id, sourceMatches: sourceMatches[revision.id] });
    } else {
      await checkShared({ page, open, origin, ready, server, report, assets, screens });
    }
    assert.deepEqual(assets.errors, [], "Failed browser assets");
    assert.deepEqual(report.errors, [], "Uncaught browser errors");
  }
} catch (error) {
  failure = error;
  report.errors.push(error instanceof Error ? error.message : String(error));
  if (page) {
    try { await page.screenshot({ path: path.join(output, "failure.png") }); }
    catch { /* Preserve the original failure when a page cannot be captured. */ }
  }
} finally {
  const cleanup = await Promise.allSettled([browser?.close(), server?.close()]);
  for (const result of cleanup) if (result.status === "rejected") {
    report.errors.push(String(result.reason));
    failure ??= result.reason;
  }
  await writeFile(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
}
console.log(`Design Lab ${mode}: ${report.cases.length} samples, ${report.checks.length} checks, ${report.approvalChecks.length} approvals. Report: ${pathToFileURL(path.join(output, "report.json")).href}`);
if (failure) throw failure;
