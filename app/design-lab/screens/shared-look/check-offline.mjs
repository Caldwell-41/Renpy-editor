// Runs the registered interaction check and rendering matrix without a server.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import check from "./check.mjs";

const output = new URL("../../../../.toolchains/l07-shared-look/", import.meta.url);
const html = readFileSync(new URL("shared-look.html", output), "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
page.setDefaultTimeout(6000);
const errors = [], requests = [], cases = [];
page.on("pageerror", error => errors.push(error.message));
page.on("request", request => requests.push(request.url()));
async function open({ variant = "inspector", state = "shared", theme = "dark" } = {}) {
  await page.goto("about:blank"); await page.setContent(html);
  await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  await page.getByRole("navigation", { name: "Compare shared-look designs" }).locator(`[data-variant=${variant}]`).click();
  await page.getByRole("combobox", { name: "Sample scenario" }).selectOption(state);
}
try {
  mkdirSync(output, { recursive: true });
  for (const width of [1100, 728, 560]) for (const theme of ["dark", "light"]) for (const variant of ["refined", "inspector", "library", "inline"]) for (const state of ["shared", "local", "stale", "missing", "expression"]) {
    await page.setViewportSize({ width, height: 850 }); await open({ variant, theme, state });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant}/${state}/${width}/${theme}: horizontal overflow`);
    assert.equal(await page.getByRole("region", { name: "Look inspector" }).isVisible(), true);
    if (state === "shared") await page.screenshot({ path: fileURLToPath(new URL(`${variant}-${theme}-${width}.png`, output)) });
    cases.push({ variant, state, width, theme });
  }
  await page.setViewportSize({ width: 1100, height: 850 }); await check({ page, open });
  assert.deepEqual(errors, []); assert.deepEqual(requests, []);
  writeFileSync(new URL("check.json", output), JSON.stringify({ browser: browser.version(), cases, interactions: "passed", requests, errors }, null, 2));
  console.log(`${cases.length} render cases pass; no network requests or browser errors.`);
} finally { await browser.close(); }
