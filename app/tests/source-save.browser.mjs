import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0, strictPort: false },
});
let browser;
try {
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") throw new Error("Vite did not expose a browser-test port.");
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true, ...(process.env.LOOMLIGHT_BROWSER_EXECUTABLE ? { executablePath: process.env.LOOMLIGHT_BROWSER_EXECUTABLE } : {}) });
  }
  const exercise = async (model) => {
    const page = await browser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${address.port}/tests/source-save-browser.html?model=${model}`);
      const editor = page.locator(".source-editor");
      await editor.waitFor();
      await editor.fill('label scene:\n    "Changed in Chromium"\n    return\n');
      await page.waitForFunction(() => window.__sourceBrowserEvidence?.dirty === true);
      await page.getByRole("button", { name: "Save Source" }).click();
      await page.waitForFunction(() =>
        window.__sourceBrowserEvidence?.saves === 1
        && document.querySelector("#host")?.getAttribute("data-source-busy") === "false",
      );
      const updatesBeforeSelection = await page.evaluate(() => window.__sourceBrowserEvidence.updates);
      await page.locator(".source-editor").evaluate((element) => {
        const editor = element;
        editor.focus();
        editor.setSelectionRange(3, 3);
        editor.dispatchEvent(new Event("select", { bubbles: true }));
      });
      await page.waitForFunction(
        (minimum) => window.__sourceBrowserEvidence?.updates > minimum,
        updatesBeforeSelection,
      );
      return await page.evaluate(() => ({
        acceptedText: window.__sourceBrowserEvidence.acceptedText,
        dirty: window.__sourceBrowserEvidence.dirty,
        draftVersion: window.__sourceBrowserEvidence.draftVersion,
        flushes: window.__sourceBrowserEvidence.flushes,
        saves: window.__sourceBrowserEvidence.saves,
        updates: window.__sourceBrowserEvidence.updates,
        acceptedVersion: window.__sourceBrowserEvidence.acceptedVersion,
      }));
    } finally {
      await page.close();
    }
  };

  const legacy = await exercise("legacy");
  assert.match(legacy.acceptedText, /Changed in Chromium/);
  assert.equal(legacy.saves, 1);
  assert.equal(legacy.flushes, 0);
  assert.equal(legacy.dirty, true);
  assert.ok(legacy.draftVersion > legacy.acceptedVersion);
  process.stdout.write(`source-browser-red: legacy-clean-assertion=false saves=${legacy.saves} flushes=${legacy.flushes} updates=${legacy.updates} dirty=${legacy.dirty}\n`);

  const faithful = await exercise("faithful");
  assert.match(faithful.acceptedText, /Changed in Chromium/);
  assert.equal(faithful.saves, 1);
  assert.equal(faithful.flushes, 0);
  assert.equal(faithful.dirty, false);
  assert.equal(faithful.draftVersion, faithful.acceptedVersion);
  process.stdout.write(`source-browser-green: faithful-clean-assertion=true saves=${faithful.saves} flushes=${faithful.flushes} updates=${faithful.updates} dirty=${faithful.dirty}\n`);
} finally {
  await browser?.close();
  await server.close();
}
