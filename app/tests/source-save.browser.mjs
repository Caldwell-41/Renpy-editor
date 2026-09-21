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
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${address.port}/tests/source-save-browser.html`);
  const editor = page.locator(".source-editor");
  await editor.waitFor();
  await editor.fill('label scene:\n    "Changed in Chromium"\n    return\n');
  await page.waitForFunction(() => window.__sourceBrowserEvidence?.dirty === true);
  await page.getByRole("button", { name: "Save Source" }).click();
  await page.waitForFunction(() => window.__sourceBrowserEvidence?.saves === 1 && window.__sourceBrowserEvidence?.dirty === false);
  const acceptedVersion = await page.evaluate(() => window.__sourceBrowserEvidence.draftVersion);
  await page.locator(".source-editor").evaluate((element) => {
    const editor = element;
    editor.focus();
    editor.setSelectionRange(3, 3);
    editor.dispatchEvent(new Event("select", { bubbles: true }));
  });
  await page.waitForFunction(() => window.__sourceBrowserEvidence?.updates >= 2);
  await page.waitForTimeout(50);
  const evidence = await page.evaluate(() => ({
    acceptedText: window.__sourceBrowserEvidence.acceptedText,
    dirty: window.__sourceBrowserEvidence.dirty,
    draftVersion: window.__sourceBrowserEvidence.draftVersion,
    flushes: window.__sourceBrowserEvidence.flushes,
    saves: window.__sourceBrowserEvidence.saves,
    updates: window.__sourceBrowserEvidence.updates,
  }));
  assert.match(evidence.acceptedText, /Changed in Chromium/);
  assert.equal(evidence.saves, 1);
  assert.equal(evidence.flushes, 0);
  assert.equal(evidence.dirty, false);
  assert.equal(evidence.draftVersion, acceptedVersion);
  process.stdout.write(`source-browser: passed saves=${evidence.saves} flushes=${evidence.flushes} updates=${evidence.updates} dirty=${evidence.dirty}\n`);
} finally {
  await browser?.close();
  await server.close();
}
