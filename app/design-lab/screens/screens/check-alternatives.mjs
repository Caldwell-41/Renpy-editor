import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export default async function checkAlternatives({ page, open }) {
  const output = new URL("../../../../.toolchains/design-lab/pages/screens/", import.meta.url); await mkdir(output, { recursive: true });
  const button = name => page.getByRole("button", { name, exact: true });
  const field = name => page.getByLabel(name, { exact: true });
  const tree = id => page.locator(`[role=treeitem][data-node-id="${id}"]`);
  for (const variant of ["direct", "flow"]) {
    console.log(`Screens journey ${variant}: started`);
    const choose = async id => {
      if (variant === "direct") { if (!await tree(id).isVisible()) await button("Elements").click(); }
      else await button("1  Choose").click();
      await tree(id).click();
    };
    const connect = async () => button(variant === "direct" ? "Try story" : "3  Connect").click();
    try {
      await page.setViewportSize({ width: 1100, height: 720 }); await open({ variant });
      if (variant === "direct") await button("Elements").click();
      await tree("body").hover(); assert.match(await page.getByRole("tooltip").innerText(), /Words shown to the player/);
      await tree("body").focus(); await page.keyboard.press("Escape");
      await page.keyboard.press("ArrowLeft");
      assert.equal(await tree("stack").getAttribute("aria-selected"), "true");
      assert.equal(await tree("stack").isVisible(), true, "Arrow browsing stays in the element list");
      assert.match(page.url(), new RegExp(`variant=${variant}`));
      await page.keyboard.press("ArrowDown");
      assert.equal(await tree(variant === "flow" ? "stack" : "title").getAttribute("aria-selected"), "true", "Keyboard browsing follows the visible list order");
      await field("Element type").selectOption("imagebutton"); await field("Help with element type").click();
      assert.match(await page.getByRole("tooltip").innerText(), /different pictures/); await page.keyboard.press("Escape");
      await tree("body").click(); assert.equal(await field("Text").isVisible(), true);
      assert.equal(await page.locator(".sc-hierarchy").isVisible(), false, "Choosing an item reveals its focused edit card");
      await page.screenshot({ path: fileURLToPath(new URL(`${variant}-editing-wide.png`, output)) });
      assert.equal(await page.evaluate(() => {
        const canvas = document.querySelector(".nb-stage").getBoundingClientRect(), panel = document.querySelector(".nb-notebook").getBoundingClientRect(); return panel.left >= canvas.right;
      }), true, "Detailed editing reserves space beside the preview");
      await field("Text").fill(`Keep ${variant} directions`); await field("Screen behavior").selectOption("blocking");
      assert.match(await page.getByRole("alert").innerText(), /Apply or cancel/);
      await button("Focus preview").click(); assert.equal(await page.locator(".nb-notebook").isVisible(), false);
      await page.keyboard.press("Escape"); assert.equal(await field("Text").inputValue(), `Keep ${variant} directions`);
      await field("Screen").selectOption("help-dialog"); await field("Screen").selectOption("help-panel");
      await choose("body"); assert.equal(await field("Text").inputValue(), `Keep ${variant} directions`);
      await button("Apply changes").click(); await button("Undo").click(); assert.match(await field("Text").inputValue(), /Choose a route/);
      if (variant === "direct") await button("Elements").click(); else await button("1  Choose").click();
      await field("Element type").selectOption("textbutton"); await button("Add element").click();
      assert.equal(await field("Element name").inputValue(), "New button"); assert.equal(await field("Text").isVisible(), true);
      await button("Undo").click();
      await connect(); await button("Show overlay").click(); await button("Next line").click();
      assert.match(await page.locator(".sc-story-status").innerText(), /overlay stays open/);
      await field("Screen").selectOption("help-dialog"); await button("Open dialog").click(); await button("Next line").click();
      assert.match(await page.locator(".sc-story-status").innerText(), /Close the dialog/);
      await button("Select Close Help on canvas").click(); await button("Add action").click();
      assert.match(await page.locator(".sc-action-row").first().innerText(), /Set help_seen to true/);
      await button("Move action 2 up").click(); assert.match(await page.getByRole("alert").innerText(), /last action/);
      await button("Cancel changes").click(); await button("Close dialog").click();
      assert.match(await page.locator(".sc-story-status").innerText(), /continued 1 time/);
      await open({ variant, state: "conflict" }); await choose("body"); await field("Text").fill("Keep while reviewing the script");
      await button("Apply changes").click(); assert.match(await page.getByRole("alert").innerText(), /script changed/);
      await button("Review script change").click(); await button("Apply changes").click(); assert.equal(await field("Text").inputValue(), "Keep while reviewing the script");
      await open({ variant, state: "template" }); await choose("body"); assert.equal(await field("Text").isDisabled(), true);
      await page.setViewportSize({ width: 560, height: 640 }); await open({ variant, viewport: "compact", theme: "dark", state: "empty" });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      assert.equal(await page.locator(".sc-game").evaluate(node => { const game = node.getBoundingClientRect(), viewport = node.closest(".lp-content").getBoundingClientRect(); return game.top >= viewport.top && game.bottom <= viewport.bottom + 1; }), true, "Compact default preview shows the complete game rectangle");
      if (variant === "direct") await button("Elements").click();
      await button("Create first Help screen").click(); await field("Screen name").fill(`${variant} Help`); await button("Create screen").click();
      await button("Focus preview").click(); await page.keyboard.press("Escape");
      assert.equal(await field("Screen").locator("option:checked").innerText(), `${variant} Help`);
      console.log(`Screens journey ${variant}: passed`);
    } catch (error) {
      const state = await page.evaluate(() => ({ step: document.querySelector(".nb-workspace")?.getAttribute("data-step"), selected: document.querySelector('[aria-selected=true][data-node-id]')?.getAttribute("data-node-id"), status: document.querySelector(".lp-status")?.textContent }));
      throw new Error(`Screens journey ${variant}: ${error.message}\nState: ${JSON.stringify(state)}`, { cause: error });
    }
  }
}
