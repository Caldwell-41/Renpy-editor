import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const screenId = process.argv[2];
if (!screenId || !/^[a-z][a-z0-9-]+$/.test(screenId)) throw new Error("Pass one registered screen ID.");
const origin = "http://127.0.0.1:5174";
const output = new URL(`../../.toolchains/design-lab/pages/${screenId}/`, import.meta.url);
const report = { screen: screenId, cases: [], errors: [], interactions: false };
await mkdir(output, { recursive: true });
let browser, failure;
try {
  try { browser = await chromium.launch({ channel: "chrome", headless: true }); }
  catch { browser = await chromium.launch({ headless: true }); }
  report.browserVersion = browser.version();
  const page = await browser.newPage(); page.setDefaultTimeout(8000);
  // Page owners edit different files concurrently. Freeze each document until its
  // next explicit navigation; the full integration check still verifies HMR.
  await page.routeWebSocket("**", () => {});
  page.on("pageerror", error => report.errors.push(error.message));
  page.on("response", response => { if (response.status() >= 400) report.errors.push(`${response.status()}: ${new URL(response.url()).pathname}`); });
  await page.goto(origin);
  const catalog = await page.evaluate(async id => {
    const { screens, viewports } = await import("/registry.ts");
    const screen = screens.find(s => s.id === id);
    if (!screen) throw new Error(`Screen is not registered: ${id}`);
    return { variants: screen.variants.map(v => v.id), states: screen.states.map(s => s.id), check: screen.check, viewports };
  }, screenId);
  async function ready(target = page) {
    await target.locator('#preview[data-ready="true"],#preview[data-error="true"]').waitFor();
    assert.equal(await target.locator("#preview").getAttribute("data-error"), null, await target.locator("#preview").innerText());
  }
  async function open({ screen = screenId, variant = catalog.variants[0], state = catalog.states[0], theme = "light", viewport = "wide" } = {}) {
    await page.goto(`${origin}/preview.html?${new URLSearchParams({ screen, variant, state, theme, viewport })}`); await ready(); return page;
  }
  for (const variant of catalog.variants) for (const state of catalog.states) for (const theme of ["light", "dark"]) for (const viewport of catalog.viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await open({ variant, state, theme, viewport: viewport.id });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant}/${state}/${theme}/${viewport.id}: overflow`);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
    assert.deepEqual(await page.evaluate(async () => (await import("/native.ts")).blockedOperations()), []);
    if (state === catalog.states[0]) {
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${theme}-${viewport.id}.png`, output)) });
    }
    report.cases.push({ variant, state, theme, viewport: viewport.id });
  }
  if (catalog.check) {
    const checkUrl = new URL(catalog.check, import.meta.url);
    assert(checkUrl.href.startsWith(new URL("./", import.meta.url).href));
    await (await import(checkUrl.href)).default({ page, open, origin, ready }); report.interactions = true;
  }
  assert.deepEqual(report.errors, [], "Browser errors");
} catch (error) { failure = error; report.errors.push(error instanceof Error ? error.message : String(error)); }
finally {
  await browser?.close(); await writeFile(new URL("report.json", output), JSON.stringify(report, null, 2) + "\n");
}
if (failure) throw failure;
console.log(`${screenId}: ${report.cases.length} rendered cases and interactions=${report.interactions}. Captures: .toolchains/design-lab/pages/${screenId}/`);
