import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
export default async function check({ page, open }) {
  for (const variant of ["atlas", "desk"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant });
    async function chooseScene(id) {
      if (await page.getByLabel("Selected scene", { exact: true }).isVisible()) await page.getByLabel("Selected scene", { exact: true }).selectOption(id);
      else await page.locator(`[data-index-scene="${id}"]`).click();
    }
    const graph = page.getByLabel("Branch graph. Arrow keys pan, plus and minus zoom, Home fits the graph.", { exact: true });
    const canvas = page.locator(".bf-canvas");
    const before = await canvas.getAttribute("style");
    await graph.focus(); await page.keyboard.press("ArrowRight");
    assert.notEqual(await canvas.getAttribute("style"), before);
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByRole("button", { name: "Focus selection", exact: true }).click();
    assert.equal(await page.getByLabel("Graph zoom", { exact: true }).textContent(), "100%");
    await page.getByRole("button", { name: "Fit graph", exact: true }).click();
    await page.getByRole("button", { name: "Select route: Follow the music", exact: true }).click();
    assert.equal(await page.getByRole("button", { name: "Edit Choice / Jump", exact: true }).isVisible(), true);
    await page.locator('.bf-routes [data-route="signal-choice"]').click();
    assert.match(await page.locator(".bf-route-context").innerText(), /If has_ticket is true/);
    assert.match(await page.locator(".bf-route-context").innerText(), /not evaluated/);
    await page.getByRole("button", { name: "View origin in Source", exact: true }).click();
    await page.getByRole("dialog", { name: "Source navigation preview" }).waitFor();
    assert.match(await page.locator(".bf-source").innerText(), /if has_ticket/);
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("button", { name: "View origin in Source", exact: true }).evaluate(e => e === document.activeElement), true);
    await page.locator('.bf-routes [data-route="platform-body"]').click();
    await page.getByRole("button", { name: "Open destination body in Story", exact: true }).click();
    assert.match(await page.getByRole("dialog").innerText(), /Otherwise body/);
    await page.getByRole("button", { name: "Back to Branches", exact: true }).click();
    await chooseScene("market");
    await page.locator('.bf-routes [data-route="memory-call"]').click();
    await page.getByRole("button", { name: "Open continuation in Story", exact: true }).click();
    assert.match(await page.getByRole("dialog").innerText(), /Back at the market/);
    await page.keyboard.press("Escape");
    await chooseScene("signal");
    await page.locator('.bf-routes [data-route="signal-missing"]').click();
    assert.match(await page.locator(".bf-route-context").innerText(), /Missing destination label/);
    await page.locator('.bf-routes [data-route="signal-unknown"]').click();
    await page.getByRole("button", { name: "View unmapped destination", exact: true }).click();
    assert.match(await page.locator(".bf-source").innerText(), /next_stop/);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Close Scene details", exact: true }).click();
    assert.equal(await page.locator(".bf-inspector").isHidden(), true);
    await page.getByRole("button", { name: "Scene details", exact: true }).click();
    assert.match(await page.locator(".bf-route-context").innerText(), /Unresolved custom flow/);
    await page.getByRole("button", { name: "Refresh flow", exact: true }).click();
    await page.getByRole("button", { name: "Refresh flow", exact: true }).isEnabled();
    await page.waitForFunction(() => document.querySelector(".bf-observation").textContent.includes("Sample snapshot"));
    assert.match(await page.locator(".bf-route-context").innerText(), /Unresolved custom flow/);
    if (variant === "desk") {
      await page.getByLabel("Find a scene", { exact: true }).fill("borrowed");
      assert.equal(await page.locator(".bf-index-scene").count(), 1);
      await page.locator(".bf-index-scene").click();
      assert.match(await page.locator(".bf-detail-title").innerText(), /borrowed memory/);
    }
    await open({ variant, state: "error" });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/branches/${variant}-light-error.png`, import.meta.url)) });
    assert.match(await page.locator(".bf-observation").innerText(), /last observed saved flow/);
    await page.getByRole("button", { name: "Retry refresh", exact: true }).click();
    await page.waitForFunction(() => document.querySelector(".bf-observation").dataset.error === "false");
    assert.equal(await page.locator(".bf-node").count() > 0, true);
    await open({ variant, state: "empty" });
    assert.equal(await page.getByRole("heading", { name: "No scenes mapped yet" }).isVisible(), true);
    await page.getByRole("button", { name: "Open Source", exact: true }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 560, height: 640 });
    await open({ variant, state: "long", theme: "dark", viewport: "compact" });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/branches/${variant}-dark-long-compact.png`, import.meta.url)) });
    await chooseScene("signal");
    await page.locator('.bf-routes [data-route="signal-unknown"]').click();
    await page.getByRole("button", { name: "View unmapped destination", exact: true }).click();
    assert.equal(await page.getByRole("dialog").isVisible(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert(await page.locator(".bf-inspector").evaluate(e => e.scrollHeight > e.clientHeight));
    await page.getByRole("button", { name: "Close Scene details", exact: true }).click();
    assert.equal(await page.locator(".bf-inspector").isHidden(), true);
    await page.getByRole("button", { name: "Scene details", exact: true }).click();
    assert.equal(await page.locator(".bf-inspector").isVisible(), true);
  }
}
