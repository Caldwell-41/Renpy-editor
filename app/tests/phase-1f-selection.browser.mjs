// Real-browser regression for settled selection and reviewed Apply Both availability.
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const server = await createServer({
  root: fileURLToPath(new URL("..", import.meta.url)),
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
let browser;
try {
  await server.listen();
  const address = server.httpServer.address();
  try { browser = await chromium.launch({ channel: "chrome", headless: true }); }
  catch { browser = await chromium.launch({ headless: true, ...(process.env.LOOMLIGHT_BROWSER_EXECUTABLE ? { executablePath: process.env.LOOMLIGHT_BROWSER_EXECUTABLE } : {}) }); }
  const page = await browser.newPage();
  await page.route("**/__selection_review", route => route.fulfill({
    contentType: "text/html",
    body: '<!doctype html><aside id="tree"></aside><main id="host"></main>',
  }));
  await page.goto(`http://127.0.0.1:${address.port}/__selection_review`);
  await page.evaluate(async () => {
    const { renderSourceWorkspace } = await import("/src/source-ui.ts");
    let model = {
      path: "game/custom.rpy", text: "ALPHA beta gamma\n", state: "conflict", editable: true,
      dirty: true, baseRevision: "a".repeat(64), liveRevision: "e".repeat(64), draftVersion: 1,
      hasBom: false, newline: "LF", partial: true, diagnostics: [], selectionStart: 0, selectionEnd: 0,
      ranges: [], canApplyBoth: true, externalText: "alpha beta GAMMA\n", combinedPreview: "ALPHA beta GAMMA\n",
    };
    const inventory = { files: [{ path: model.path, state: "conflict", dirty: true, readOnly: false }], dirtyCount: 1, draftBytes: 17 };
    window.__selectionReview = { updates: 0, applies: 0, observations: 0 };
    // Enable the production observation timer, keeping IPC as a faithful selection-only double.
    window.__TAURI_INTERNALS__ = {};
    window.__selectionController = renderSourceWorkspace(document.querySelector("#host"), document.querySelector("#tree"), inventory, {
      status: () => {}, reloadInventory: async () => inventory,
      open: async () => { window.__selectionReview.observations++; return model; },
      update: async (request) => {
        window.__selectionReview.updates++;
        model = { ...model, selectionStart: request.selectionStart, selectionEnd: request.selectionEnd };
        return model;
      },
      save: async () => model, discard: async () => model,
      applyBoth: async () => { window.__selectionReview.applies++; return model; },
      viewScene: () => {}, requestSave: async () => {}, registerController: () => () => {},
      runCoordinated: async (_label, task) => task(), refreshPersistence: () => {},
    });
  });
  await page.locator(".source-editor").waitFor();
  await page.locator(".source-editor").click();
  await page.waitForFunction(() => window.__selectionReview.updates > 0 && !window.__selectionController.hasUnretainedInput());
  // Wait for a real scheduled observation, not a fixed sleep: an unchanged observation must not hide the defect.
  await page.waitForFunction(() => window.__selectionReview.observations > 1);
  const beforeApply = await page.evaluate(() => ({
    pending: window.__selectionController.hasUnretainedInput(),
    disabled: document.querySelector('[data-source-action="apply-both"]').disabled,
    staleNoticeHidden: document.querySelector(".source-review-stale").hidden,
    observations: window.__selectionReview.observations,
  }));
  assert.equal(beforeApply.pending, false);
  assert.equal(beforeApply.disabled, false, "settled selection must enable the reviewed combination");
  assert.equal(beforeApply.staleNoticeHidden, true);
  assert.ok(beforeApply.observations >= 2);
  await page.locator('[data-source-action="apply-both"]').click();
  await page.waitForFunction(() => window.__selectionReview.applies === 1);
  console.log(JSON.stringify({ beforeApply, applies: 1 }));
  await page.evaluate(() => window.__selectionController.dispose());
} finally {
  await browser?.close();
  await server.close();
}
