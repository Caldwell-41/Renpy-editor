import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { approvalFixture } from "./approval-fixture.mjs";

const lab = new URL("./", import.meta.url);
const app = new URL("../", lab);
const sourceUrl = path => "/@fs/" + path.replaceAll("\\", "/").replace(/^\/+/, "");

export default async function checkShared({ page, open, origin, ready, server, report, assets, screens }) {
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
  report.checks.push("draft/current/superseded labels; history; approval scope; hot-reload/changed-source refusal; unchanged repository approval");

  assert.deepEqual(assets.errors, [], "Failed browser assets");
  assets.enabled = false;
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
  await page.getByLabel("Theme", { exact: true }).selectOption("dark");
  await page.getByLabel("Preview size", { exact: true }).selectOption("compact");
  const galleryLinks = await page.locator(".gallery-layout-link").evaluateAll(links => links.map(link => link.href));
  assert.equal(galleryLinks.length, screens.reduce((sum, screen) => sum + screen.variants.length, 0));
  assert(galleryLinks.every(href => { const q = new URL(href).searchParams; return q.get("theme") === "dark" && q.get("viewport") === "compact"; }));
  await page.setViewportSize({ width: 560, height: 640 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  report.checks.push("gallery lists all drafts; page search; theme and viewport links; compact layout");
  assert.deepEqual(report.errors, [], "Uncaught browser errors");
  report.checks.push("controls; iframe viewport; theme; sample reset; invalid selection refusal");
}
