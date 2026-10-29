import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import check from "./refined-check.mjs";
const origin = "http://127.0.0.1:5176";
const output = new URL("../../../../.toolchains/design-lab/l06/refined/", import.meta.url);
await mkdir(output, { recursive: true });
const report = { cases: [], errors: [], interactions: false };
let browser, failure;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  report.browserVersion = browser.version();
  const page = await browser.newPage(); page.setDefaultTimeout(10000);
  await page.routeWebSocket("**", () => {});
  page.on("pageerror", e => report.errors.push(e.message));
  page.on("response", r => { if (r.status() >= 400) report.errors.push(`${r.status()}: ${new URL(r.url()).pathname}`); });
  async function open({ variant = "refined", state = "placed", theme = "dark", viewport = "wide" } = {}) {
    await page.goto(`${origin}/preview.html?${new URLSearchParams({ screen: "ui-image", variant, state, theme, viewport })}`, { timeout: 45000 });
    await page.locator('#preview[data-ready="true"],#preview[data-error="true"]').waitFor();
    assert.equal(await page.locator("#preview").getAttribute("data-error"), null, await page.locator("#preview").innerText());
    return page;
  }
  if (!process.argv.includes("--interactions-only")) for (const variant of ["refined"]) for (const state of ["placed", "add", "missing", "replaced", "invalid", "conflict"]) for (const theme of ["dark", "light"]) for (const viewport of ["wide", "compact"]) {
    const size = viewport === "wide" ? { width: 1100, height: 720 } : { width: 560, height: 640 };
    await page.setViewportSize(size); await open({ variant, state, theme, viewport });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant}/${state}/${theme}/${viewport}: overflow`);
    assert.deepEqual(await page.evaluate(async () => (await import("/native.ts")).blockedOperations()), []);
    if (state === "placed" || theme === "dark" && viewport === "wide") await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${state}-${theme}-${viewport}.png`, output)) });
    report.cases.push({ variant, state, theme, viewport });
  }
  await check({ page, open, origin }); report.interactions = true;
  assert.deepEqual(report.errors, []);
} catch (error) { failure = error; report.errors.push(String(error)); }
finally { await browser?.close(); await writeFile(new URL(process.argv.includes("--interactions-only") ? "interaction-report.json" : "report.json", output), JSON.stringify(report, null, 2) + "\n"); }
if (failure) throw failure;
console.log(`UI image: ${report.cases.length} cases and interactions passed.`);
