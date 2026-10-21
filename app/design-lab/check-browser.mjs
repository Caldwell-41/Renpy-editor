import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build, createServer } from "vite";
import { chromium } from "playwright";
import { approvalFixture } from "./approval-fixture.mjs";

const lab = new URL("./", import.meta.url);
const app = new URL("../", lab);
const output = new URL("../../.toolchains/design-lab/", lab);
// Use one canonical URL per source module, including on Windows.
const sourceUrl = path => "/@fs/" + path.replaceAll("\\", "/").replace(/^\/+/, "");
assert.equal(sourceUrl("/sample/app/src/preferences.ts"), "/@fs/sample/app/src/preferences.ts");
assert.equal(sourceUrl("C:\\sample\\app\\src\\preferences.ts"), "/@fs/C:/sample/app/src/preferences.ts");
const report = { basis: "Local browser samples only; no app persistence or native acceptance", cases: [], checks: [], errors: [] };
const server = await createServer({
  configFile: fileURLToPath(new URL("vite.config.ts", lab)),
  logLevel: "silent",
  server: { host: "127.0.0.1", port: 0, strictPort: false },
});
let browser;
let failure;
try {
  await server.listen();
  const address = server.httpServer.address();
  assert(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  try { browser = await chromium.launch({ channel: "chrome", headless: true }); }
  catch { browser = await chromium.launch({ headless: true }); }
  report.browserVersion = browser.version();
  const page = await browser.newPage();
  page.setDefaultTimeout(8000);
  const errors = [];
  const assetErrors = [];
  let checkAssets = true;
  page.on("pageerror", error => errors.push(error.message));
  page.on("response", response => {
    if (checkAssets && response.status() >= 400) assetErrors.push(`${response.status()}: ${new URL(response.url()).pathname}`);
  });
  page.on("requestfailed", request => {
    // Parent reloads cancel an in-flight iframe document. Readiness checks still
    // require the replacement document; failed scripts/styles remain errors.
    const cancelledNavigation = request.resourceType() === "document" && request.failure()?.errorText === "net::ERR_ABORTED";
    if (checkAssets && !cancelledNavigation) assetErrors.push(`${new URL(request.url()).pathname}: ${request.failure()?.errorText}`);
  });
  await page.goto(origin);
  assert.match(await page.getByLabel("Design approval", { exact: true }).innerText(), /Draft/);
  assert.equal(await page.locator(".lab-current-approval").innerText(), "No approved layout");
  const { screens, viewports } = await page.evaluate(async () => {
    const catalog = await import("/registry.ts");
    return {
      screens: catalog.screens.map(({ id, variants, states, check }) => ({ id, variants: variants.map(item => item.id), states: states.map(item => item.id), check })),
      viewports: catalog.viewports,
    };
  });
  assert(screens.length > 0, "No screens registered");
  assert.equal(new Set(screens.map(screen => screen.id)).size, screens.length, "Duplicate screen IDs");
  await mkdir(output, { recursive: true });

  async function ready(target = page) {
    await target.locator('#preview[data-ready="true"], #preview[data-error="true"]').waitFor();
    assert.equal(await target.locator("#preview").getAttribute("data-error"), null, await target.locator("#preview").innerText());
  }
  async function open({ screen = "character-notes", variant = "starter", state = "populated", theme = "light", viewport = "wide" } = {}) {
    const query = new URLSearchParams({ screen, variant, state, theme, viewport });
    await page.goto(`${origin}/preview.html?${query}`);
    await ready();
    return page;
  }

  for (const screen of screens) {
    assert(screen.variants.length > 0 && screen.states.length > 0, "Each screen needs a layout and sample state");
    assert.equal(new Set(screen.variants).size, screen.variants.length, "Duplicate layout IDs");
    assert.equal(new Set(screen.states).size, screen.states.length, "Duplicate sample IDs");
    for (const variant of screen.variants) for (const state of screen.states) for (const theme of ["light", "dark"]) for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await open({ screen: screen.id, variant, state, theme, viewport: viewport.id });
      const bounds = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      assert.equal(bounds.theme, theme);
      assert.equal(bounds.overflow, false, `Horizontal overflow: ${screen.id}/${variant}/${state}/${theme}/${viewport.id}`);
      assert.deepEqual(await page.evaluate(async () => (await import("/native.ts")).blockedOperations()), []);
      if (state === screen.states[0]) {
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await page.screenshot({ path: fileURLToPath(new URL(`${screen.id}-${variant}-${theme}-${viewport.id}.png`, output)) });
      }
      report.cases.push({ screen: screen.id, variant, state, theme, viewport: viewport.id });
    }
    if (screen.check) {
      const checkUrl = new URL(screen.check, lab);
      assert(checkUrl.href.startsWith(lab.href), "Interaction checks belong inside Design Lab");
      const { default: check } = await import(checkUrl.href);
      const openScreen = (options = {}) => open({ screen: screen.id, variant: screen.variants[0], state: screen.states[0], ...options });
      await check({ page, open: openScreen, origin, ready });
      report.checks.push(`${screen.id}: interactions`);
    }
  }

  await page.setViewportSize({ width: 1100, height: 720 });
  await open({ screen: "source", variant: "workbench", theme: "dark" });
  const navigationDraft = (await page.locator(".sl-editor").inputValue()) + "\n# Retained until page switch\n";
  await page.locator(".sl-editor").fill(navigationDraft);
  await page.getByRole("button", { name: "Lorebook", exact: true }).click();
  await page.getByRole("dialog", { name: "Leave this sample?", exact: true }).waitFor();
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.equal(await page.locator(".sl-editor").inputValue(), navigationDraft);
  await page.getByRole("button", { name: "Lorebook", exact: true }).click();
  await Promise.all([
    page.waitForURL(url => url.searchParams.get("screen") === "lorebook" && url.pathname === "/"),
    page.getByRole("button", { name: "Leave sample", exact: true }).click(),
  ]);
  const navigationFrame = page.frameLocator('iframe[title="Screen preview"]');
  await ready(navigationFrame);
  assert.equal(await navigationFrame.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await navigationFrame.getByRole("button", { name: "Lorebook", exact: true }).getAttribute("aria-current"), "page");
  for (const [title, screen] of [["Runtime & diagnostics", "runtime"], ["Studio request", "studio-request"], ["Settings", "settings"]]) {
    await Promise.all([
      page.waitForURL(url => url.searchParams.get("screen") === screen),
      navigationFrame.getByRole("button", { name: title, exact: true }).click(),
    ]);
    await ready(navigationFrame);
    assert.equal(await navigationFrame.locator(".lp-heading h1").innerText(), title);
  }
  assert.equal(await navigationFrame.locator(".lp-navigation .tree-item").last().getAttribute("aria-label"), "Settings");
  await Promise.all([
    page.waitForURL(url => url.searchParams.get("screen") === "welcome"),
    navigationFrame.getByRole("button", { name: "Go to Home", exact: true }).click(),
  ]);
  await ready(navigationFrame);
  assert.equal(await navigationFrame.getByRole("button", { name: "Home", exact: true }).getAttribute("aria-current"), "page");
  report.checks.push("shared navigation retains a cancelled draft; confirms sample reset; preserves theme; links Runtime, Studio request, Settings and Home");

  // Intercept only this disposable browser's virtual metadata. Repository records stay unchanged.
  const otherRecords = await page.evaluate(async () => (await import("/registry.ts")).screens.filter(item => item.id !== "character-notes").map(item => item.approval));
  const synthetic = [{ path: "docs/design/example/approval.json", record: approvalFixture(), sourceMatches: { "older-v1": true, "starter-v1": true } }, ...otherRecords];
  await page.route("**/*design-lab-approvals*", route => route.fulfill({
    contentType: "application/javascript", body: `export const approvalRecords = ${JSON.stringify(synthetic)};`,
  }));
  await page.goto(origin + "/?state=populated&theme=light&viewport=wide");
  await ready(page.frameLocator("iframe"));
  assert.equal(await page.getByLabel("Design approval", { exact: true }).innerText(), "Approved · starter-v1");
  assert.match(await page.locator(".lab-current-approval a").getAttribute("href"), /variant=starter/);
  await page.getByText("Approval history", { exact: true }).click();
  assert.match(await page.locator(".lab-history").innerText(), /older-v1 · Superseded/);
  assert.match(await page.locator(".lab-history").innerText(), /Replaces older-v1 · Synthetic replacement reason/);
  assert.match(await page.locator(".lab-history").innerText(), /Superseded by starter-v1 on 2000-01-01/);
  await page.goto(origin + "/?state=empty&theme=light&viewport=wide");
  assert.match(await page.getByLabel("Design approval", { exact: true }).innerText(), /outside recorded comparison states/);
  synthetic[0].sourceMatches["starter-v1"] = false;
  await Promise.all([
    page.waitForEvent("framenavigated", { predicate: target => target === page.mainFrame() }),
    Promise.resolve().then(() => server.watcher.emit("all", "change", fileURLToPath(new URL("src/styles.css", app)))),
  ]);
  assert.match(await page.getByLabel("Design approval", { exact: true }).innerText(), /source changed/);
  const changedReference = page.frameLocator("iframe").locator('#preview[data-error="true"]');
  await changedReference.waitFor();
  assert.match(await changedReference.innerText(), /Approved source has changed/);
  synthetic[0].sourceMatches["starter-v1"] = true;
  synthetic[0].record.revisions[1].approval.reason = "Synthetic record refresh";
  await Promise.all([
    page.waitForEvent("framenavigated", { predicate: target => target === page.mainFrame() }),
    Promise.resolve().then(() => server.watcher.emit("all", "change", fileURLToPath(new URL("../../docs/design/design-lab-character-notes/approval.json", lab)))),
  ]);
  await ready(page.frameLocator("iframe"));
  await page.getByText("Approval history", { exact: true }).click();
  assert.match(await page.locator(".lab-history").innerText(), /Synthetic record refresh/);
  await page.unroute("**/*design-lab-approvals*");
  await page.goto(origin);
  assert.equal(await page.locator(".lab-current-approval").innerText(), "No approved layout");
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator(".lab-header").count(), 1, "Live reload must leave one control header");
  assert.equal(await page.locator(".lab-stage").count(), 1, "Live reload must leave one preview stage");
  await page.screenshot({ path: fileURLToPath(new URL("approval-controls.png", output)) });
  report.checks.push("draft/current/superseded labels; history; approval scope; hot-reload/changed-source refusal; unchanged repository approval");

  assert.deepEqual(assetErrors, [], "Failed browser assets");
  checkAssets = false;
  await open();
  const refusal = await page.evaluate(async preferencesPath => {
    const { invoke, blockedOperations } = await import("/native.ts");
    const { saveLayout, readPreferences } = await import(preferencesPath);
    saveLayout("sample-only", { treeCollapsed: true });
    const before = blockedOperations();
    let message = "";
    try { await invoke("core_request", { request: { operation: "project.flush", requestId: "sample" } }); }
    catch (error) { message = error.message; }
    return { before, blocked: blockedOperations(), message, rememberLayout: readPreferences().rememberLayout };
  }, sourceUrl(fileURLToPath(new URL("src/preferences.ts", app))));
  assert.equal(refusal.rememberLayout, false);
  assert.deepEqual(refusal.before, []);
  assert.deepEqual(refusal.blocked, ["project.flush"]);
  assert.match(refusal.message, /refuses native operation/);
  await assert.rejects(server.pluginContainer.resolveId("@tauri-apps/api/window", fileURLToPath(new URL("preview.ts", lab))), /blocks native APIs/);
  await assert.rejects(server.transformRequest(sourceUrl(fileURLToPath(new URL("src/bootstrap.ts", app)))), /production application entry/);
  assert.equal((await page.request.post(origin + "/")).status(), 405);
  let crossOriginRequests = 0;
  await page.route("http://127.0.0.1:65432/**", route => { crossOriginRequests++; return route.abort(); });
  const crossOriginFetch = await page.evaluate(async () => {
    try { await fetch("http://127.0.0.1:65432/design-lab-network-probe"); return "unexpected success"; }
    catch { return "refused"; }
  });
  assert.equal(crossOriginFetch, "refused");
  assert.equal(crossOriginRequests, 0, "CSP must refuse other origins before a request is made");
  report.checks.push("native refusal; memory-only preferences; entry isolation; read-only server; network CSP");

  await page.goto(origin + "/?screen=character-notes&variant=starter&viewport=compact&theme=dark");
  const frame = page.frameLocator('iframe[title="Screen preview"]');
  await ready(frame);
  assert.equal(await frame.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator("iframe").evaluate(element => element.contentWindow.innerWidth), 560);
  await frame.getByRole("textbox", { name: "Writing notes" }).fill("Disposable draft");
  await Promise.all([
    page.waitForEvent("framenavigated", { predicate: target => target.parentFrame() !== null }),
    page.getByRole("button", { name: "Reset sample", exact: true }).click(),
  ]);
  await ready(frame);
  assert.notEqual(await frame.getByRole("textbox", { name: "Writing notes" }).inputValue(), "Disposable draft");
  await Promise.all([
    page.waitForURL(url => url.searchParams.get("state") === "save-error"),
    page.getByLabel("Sample state", { exact: true }).selectOption("save-error"),
  ]);
  await ready(page.frameLocator("iframe"));
  assert.match(page.url(), /state=save-error/);
  await page.goto(origin + "/preview.html?screen=missing");
  await page.locator('#preview[data-error="true"]').waitFor();
  assert.match(await page.locator("#preview").innerText(), /Unknown Design Lab screen/);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(origin + "/catalog.html");
  assert.equal(await page.locator(".gallery-card").count(), screens.length);
  await page.getByRole("searchbox", { name: "Find a page", exact: true }).fill("No such app page");
  assert.equal(await page.locator(".gallery-card").count(), 0);
  assert.equal(await page.locator(".gallery-empty").isVisible(), true);
  await page.getByRole("searchbox", { name: "Find a page", exact: true }).fill("");
  await page.screenshot({ path: fileURLToPath(new URL("catalog-light-wide.png", output)) });
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await page.getByLabel("Preview size", { exact: true }).selectOption("compact");
  const galleryLinks = await page.locator(".gallery-layout-link").evaluateAll(links => links.map(link => link.href));
  assert.equal(galleryLinks.length, screens.reduce((sum, screen) => sum + screen.variants.length, 0));
  assert(galleryLinks.every(href => { const q = new URL(href).searchParams; return q.get("theme") === "dark" && q.get("viewport") === "compact"; }));
  await page.setViewportSize({ width: 560, height: 640 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: fileURLToPath(new URL("catalog-dark-compact.png", output)) });
  report.checks.push("gallery lists all drafts; page search; theme and viewport links; compact layout");
  assert.deepEqual(errors, [], "Uncaught browser errors");
  report.checks.push("controls; iframe viewport; theme; sample reset; invalid selection refusal");

  const production = await build({
    root: fileURLToPath(app), configFile: fileURLToPath(new URL("vite.config.ts", app)),
    logLevel: "silent", build: { write: false },
  });
  let chunks = 0;
  for (const result of Array.isArray(production) ? production : [production]) for (const entry of result.output) {
    if (entry.type === "chunk") {
      chunks++;
      assert(Object.keys(entry.modules).every(id => !id.replaceAll("\\", "/").includes("/design-lab/")), "Lab code entered production build");
    }
  }
  assert(chunks > 0, "The production build produced no JavaScript chunks");
  report.checks.push("production build excludes Design Lab; build inspected without writing dist");
} catch (error) {
  failure = error;
  report.errors.push(error instanceof Error ? error.message : String(error));
} finally {
  const cleanup = await Promise.allSettled([browser?.close(), server.close()]);
  for (const result of cleanup) if (result.status === "rejected") {
    report.errors.push(String(result.reason));
    failure ??= result.reason;
  }
  await mkdir(output, { recursive: true });
  await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2) + "\n");
}
if (failure) throw failure;
console.log(`Design Lab passed: ${report.cases.length} rendered cases, ${report.checks.length} check groups. Local report: .toolchains/design-lab/report.json`);
