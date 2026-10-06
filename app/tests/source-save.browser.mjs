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
      if(model === "rich"){await editor.focus();await editor.press("Home");await editor.press("ArrowRight");}else await page.locator(".source-editor").evaluate((element) => {
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

  for (const mode of ["faithful","rich"]) {
  const faithful = await exercise(mode);
  assert.match(faithful.acceptedText, /Changed in Chromium/);
  assert.equal(faithful.saves, 1);
  assert.equal(faithful.flushes, 0);
  assert.equal(faithful.dirty, false);
  assert.equal(faithful.draftVersion, faithful.acceptedVersion);
  process.stdout.write(`source-browser-green: faithful-clean-assertion=true saves=${faithful.saves} flushes=${faithful.flushes} updates=${faithful.updates} dirty=${faithful.dirty}\n`);
  }
  for (const mode of ["faithful", "rich"]) {
    const page = await browser.newPage();
    try {
      await page.goto(`http://127.0.0.1:${address.port}/tests/source-save-browser.html?model=${mode}`);
      const editor = page.locator(".source-editor");
      await editor.fill('label scene:\n    "Keyboard Save"\n    return\n');
      await editor.focus();
      await page.evaluate(async () => {
        const controller = window.__sourceBrowserEvidence.controller;
        const captured = controller.captureSaveIntent("keyboard", true);
        if (captured.kind !== "captured") throw new Error("Keyboard Save did not capture focused input");
        await controller.executeSave(captured.intent, async () => {});
      });
      assert.equal(await editor.evaluate(element => document.activeElement === element), true, `${mode}: keyboard Save lost typing focus`);
      const readText = () => editor.evaluate(element => element instanceof HTMLTextAreaElement ? element.value : element.textContent);
      const before = await readText();
      // Send keys to the current focus; locator.press/type would refocus and conceal the regression.
      await page.keyboard.type("# Continue editing");
      assert.notEqual(await readText(), before, `${mode}: typing after Save was ignored`);
      process.stdout.write(`source-keyboard-save-focus: ${mode} PASS\n`);
    } finally { await page.close(); }
  }
} finally {
  await browser?.close();
  await server.close();
}
