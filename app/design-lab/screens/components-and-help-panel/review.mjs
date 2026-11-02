import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
import check from "./check.mjs";
import refinedCheck from "./refined-check.mjs";

const output = new URL("../../../../.toolchains/components-and-help-panel/", import.meta.url);
await mkdir(output, { recursive: true });
const report = { cases: [], errors: [], interactions: false, mode: "offline Design Lab export" };
const refinedOnly = process.argv.includes("--refined-only");
let browser, failure;
try {
  browser = await chromium.launch({ headless: true }); report.browserVersion = browser.version();
  const page = await browser.newPage(); page.setDefaultTimeout(8000);
  page.on("pageerror", error => report.errors.push(error.message));
  async function open({ variant = "inspector", state = "shared", theme = "dark" } = {}) {
    const url = new URL("comparison.html", output); url.search = new URLSearchParams({ variant, state, theme }).toString();
    await page.goto(url.href); await page.locator('#study[data-ready="true"]').waitFor(); return page;
  }
  if (!process.argv.includes("--interactions-only")) {
    for (const variant of refinedOnly ? ["refined"] : ["refined", "inspector", "library", "worksheet"]) for (const state of ["group", "shared", "starter", "no-images", "story", "conflict", "missing", "copy-refresh-failure"]) for (const theme of ["dark", "light"]) for (const size of [{ id: "wide", width: 1100, height: 720 }, { id: "compact", width: 560, height: 640 }]) {
      await page.setViewportSize(size); await open({ variant, state, theme });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant}/${state}/${theme}/${size.id}: overflow`);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme);
      assert.equal(await page.locator("img").evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), true);
      if (["shared", "no-images", "copy-refresh-failure"].includes(state) || theme === "dark" && size.id === "wide" || variant === "refined" && state === "group") await page.screenshot({ path: new URL(`${variant}-${state}-${theme}-${size.id}.png`, output).pathname });
      report.cases.push({ variant, state, theme, ...size });
    }
  }
  await (refinedOnly ? refinedCheck : check)({ page, open, capture: name => page.screenshot({ path: new URL(`${name}.png`, output).pathname }) }); report.interactions = true; assert.deepEqual(report.errors, []);
} catch (error) { failure = error; report.errors.push(String(error)); }
finally { await browser?.close(); await writeFile(new URL(refinedOnly ? "refined-report.json" : process.argv.includes("--interactions-only") ? "interactions.json" : "report.json", output), JSON.stringify(report, null, 2) + "\n"); }
if (failure) throw failure;
console.log(`Components / Help: ${report.cases.length} render cases; interactions passed.`);
