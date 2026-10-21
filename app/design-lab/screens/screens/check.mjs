import assert from "node:assert/strict";
import checkNotebook from "./check-notebook.mjs";

export default async function check({ page, open }) {
  const tree = id => page.locator(`[role="treeitem"][data-node-id="${id}"]`);
  const property = title => page.getByLabel(title, { exact: true });
  const group = async title => {
    const details = page.locator(".sc-property-group").filter({ has: page.locator("summary", { hasText: title }) });
    await details.evaluate(node => node.open = true);
  };
  const story = async () => page.locator(".sc-story").evaluate(node => node.open = true);
  const visibleText = async target => {
    await target.scrollIntoViewIfNeeded();
    await page.waitForFunction(node => node.checkVisibility({ contentVisibilityAuto: true }) && node.innerText.trim().length > 0, await target.elementHandle());
    return target.innerText();
  };
  for (const variant of ["workbench", "canvas", "guided"]) {
    console.log(`Screens journey ${variant}: started`);
    try {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const geometry = await page.evaluate(() => {
      const game = document.querySelector(".sc-game").getBoundingClientRect();
      const viewport = document.querySelector(".sc-canvas-scroll").getBoundingClientRect();
      const stage = document.querySelector(".sc-stage").getBoundingClientRect();
      const dock = document.querySelector(".sc-bottom-dock")?.getBoundingClientRect();
      const info = document.querySelector(".sc-info").getBoundingClientRect();
      const instructions = document.querySelector('[data-canvas-id="body"]');
      return { fit: game.left >= viewport.left - 1 && game.right <= viewport.right + 1 && game.top >= viewport.top - 1 && game.bottom <= viewport.bottom + 1 && game.bottom <= stage.bottom + 1, dockClear: !dock || dock.bottom <= info.top + 1, textFits: instructions.scrollHeight <= instructions.clientHeight + 1 };
    });
    assert.equal(geometry.fit, true, `${variant}: Fit must show the complete game rectangle`);
    assert.equal(geometry.dockClear, true, `${variant}: lower dock must not overlap revision/status`);
    assert.equal(geometry.textFits, true, `${variant}: Help instructions must fit their sample rectangle`);
    assert.match(await page.locator(".sc-revision").innerText(), /Sample revision 1/);
    assert.equal(await property("Text content").inputValue(), "Your next stop");
    await property("Text content").fill("Keep this Help draft");
    await property("Screen behavior").selectOption("blocking");
    assert.match(await page.getByRole("alert").innerText(), /Apply or cancel retained/);
    assert.equal(await property("Text content").inputValue(), "Keep this Help draft");
    assert.equal(await property("Screen behavior").inputValue(), "panel");
    await page.getByRole("button", { name: "Cancel properties", exact: true }).click();
    assert.equal(await property("Text content").inputValue(), "Your next stop");
    await property("Text content").fill("Help before your next stop");
    await page.getByRole("button", { name: "Apply properties", exact: true }).click();
    await page.getByRole("dialog", { name: "Apply shared style?", exact: true }).waitFor();
    assert.match(await page.getByRole("dialog").innerText(), /Help panel, Help dialog/);
    await page.getByRole("button", { name: "Make a copy instead", exact: true }).click();
    await page.getByRole("button", { name: "Apply properties", exact: true }).click();
    assert.match(await page.locator(".sc-revision").innerText(), /revision 2/);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await property("Text content").inputValue(), "Your next stop");
    await tree("body").click();
    assert.equal(await page.locator('[data-canvas-id="body"]').getAttribute("aria-pressed"), "true");
    await page.getByRole("button", { name: "Select Help title on canvas", exact: true }).click();
    assert.equal(await tree("title").getAttribute("aria-selected"), "true");
    await tree("title").focus(); await page.keyboard.press("ArrowLeft");
    assert.match(page.url(), new RegExp(`variant=${variant}`));
    assert.equal(await tree("stack").getAttribute("aria-selected"), "true");
    await tree("frame").click(); await group("Layout");
    await property("Coordinate units").selectOption("relative");
    assert.equal(Number(await property("X position").inputValue()), 280 / 1280);
    await page.getByRole("button", { name: "Cancel properties", exact: true }).click();
    const frameNode = page.locator('[data-canvas-id="frame"]');
    await frameNode.focus(); await page.keyboard.press("ArrowRight");
    assert.match(page.url(), new RegExp(`variant=${variant}`));
    assert.equal(await property("X position").inputValue(), "281");
    await page.getByRole("button", { name: "Cancel properties", exact: true }).click();
    await tree("frame").click(); const box = await frameNode.boundingBox(); assert(box);
    await page.mouse.move(box.x + 5, box.y + 5); await page.mouse.down(); await page.mouse.move(box.x + 25, box.y + 18); await page.keyboard.press("Escape"); await page.mouse.up();
    assert.equal(await property("X position").inputValue(), "280");
    await property("Screen").selectOption("help-panel"); await story();
    await page.getByRole("button", { name: "Show screen", exact: true }).click(); await story();
    await page.getByRole("button", { name: "Continue dialogue", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Help stays visible/);
    await story(); await page.getByRole("button", { name: "Hide screen", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Visible false/);
    await property("Screen").selectOption("help-dialog"); await story();
    await page.getByRole("button", { name: "Call screen", exact: true }).click(); await story();
    await page.getByRole("button", { name: "Continue dialogue", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /blocks dialogue/);
    await story(); await page.getByRole("button", { name: "Click outside sample", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Visible true. Waiting true/);
    await story(); await page.getByRole("button", { name: "Finish called interaction", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Continuations 1/);
    await story(); await page.getByRole("button", { name: "Simulate game Escape", exact: true }).click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Continuations 1/);
    await tree("close").click();
    await page.getByRole("button", { name: "Add action", exact: true }).click();
    assert.match(await visibleText(page.locator(".sc-action-row").first()), /Set help_seen = true/, `${variant}: first visible action assigns the variable`);
    assert.match(await visibleText(page.locator(".sc-action-row").last()), /Finish interaction/, `${variant}: last visible action finishes interaction`);
    await page.getByRole("button", { name: "Move action 2 up", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /must stay last/);
    await page.getByRole("button", { name: "Cancel properties", exact: true }).click();
    await story(); await page.getByRole("button", { name: "Call screen", exact: true }).click();
    await property("Screen").selectOption("help-panel");
    assert.match(await page.locator(".sc-story-status").innerText(), /Waiting false/);
    await open({ variant, state: "template" });
    assert.equal(await property("Screen behavior").isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Add element", exact: true }).isDisabled(), true);
    await tree("body").click(); assert.equal(await property("Text content").isDisabled(), true);
    await tree("close").click();
    const protectedActions = page.locator(".sc-property-group .sc-protected").filter({ hasText: "Template actions are protected" });
    assert.match(await visibleText(protectedActions), /Template actions are protected/, `${variant}: template action protection is visible`);
    await open({ variant, state: "conflict" }); await tree("body").click();
    await property("Text content").fill("Retain during source conflict");
    await page.getByRole("button", { name: "Apply properties", exact: true }).click();
    assert.match(await page.getByRole("alert").innerText(), /Source conflict/);
    assert.equal(await property("Text content").inputValue(), "Retain during source conflict");
    await page.getByRole("button", { name: "Rebase retained sample draft", exact: true }).click();
    await page.getByRole("button", { name: "Apply properties", exact: true }).click();
    assert.equal(await property("Text content").inputValue(), "Retain during source conflict");
    await page.setViewportSize({ width: 560, height: 640 });
    await open({ variant, state: "empty", viewport: "compact", theme: "dark" });
    await page.getByRole("button", { name: "Create first Help screen", exact: true }).click();
    await property("Screen name").fill("Station instructions");
    await property("Starter").selectOption("blocking");
    await page.getByRole("button", { name: "Create screen", exact: true }).click();
    assert.equal(await property("Screen behavior").inputValue(), "blocking");
    assert.equal(await property("Screen").locator("option:checked").innerText(), "Station instructions");
    await page.getByRole("button", { name: "Next prototype layout", exact: true }).click();
    await page.getByRole("dialog", { name: "Switch prototype layout?", exact: true }).waitFor();
    await page.getByRole("button", { name: "Keep editing", exact: true }).click();
    await open({ variant, viewport: "compact" });
    await page.getByRole("button", { name: "Next prototype layout", exact: true }).click();
    const variantIds = await page.evaluate(async () => (await import("/screens/screens/definition.ts")).variants.map(v => v.id));
    const next = variantIds[(variantIds.indexOf(variant) + 1) % variantIds.length];
    await page.waitForURL(new RegExp(`variant=${next}`));
    await page.locator('#preview[data-ready="true"]').waitFor();
    console.log(`Screens journey ${variant}: passed`);
    } catch (error) {
      const state = await page.evaluate(() => ({
        selected: document.querySelector('[role="treeitem"][aria-selected="true"]')?.getAttribute("data-node-id"),
        actions: [...document.querySelectorAll(".sc-action-row")].map(row => ({
          renderedText: row.innerText, text: row.textContent,
          groupOpen: row.closest("details")?.open,
          contentVisibility: getComputedStyle(row.closest("details")).contentVisibility,
          visible: row.checkVisibility({ contentVisibilityAuto: true }),
        })),
      })).catch(diagnosticError => ({ diagnosticError: String(diagnosticError) }));
      throw new Error(`Screens journey ${variant}: ${error.message}\nState: ${JSON.stringify(state)}`, { cause: error });
    }
  }
  await checkNotebook({ page, open });
}
