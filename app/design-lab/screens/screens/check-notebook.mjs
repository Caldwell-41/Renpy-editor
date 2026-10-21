import assert from "node:assert/strict";

export default async function checkNotebook({ page, open }) {
  console.log("Screens journey guided-v2: started");
  const button = name => page.getByRole("button", { name, exact: true });
  const field = name => page.getByLabel(name, { exact: true });
  const tree = id => page.locator(`[role=treeitem][data-node-id="${id}"]`);
  const group = async title => page.locator(".sc-property-group").filter({ has: page.locator("summary", { hasText: title }) }).evaluate(node => node.open = true);
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const size = () => page.locator(".sc-game").boundingBox();
  const view = () => page.locator(".nb-workspace").evaluate(node => ({ width: node.style.getPropertyValue("--nb-width"), height: node.style.getPropertyValue("--nb-height") }));
  const drag = async (name, dx, dy, cancel = false) => {
    const handle = page.getByRole("separator", { name, exact: true });
    await handle.scrollIntoViewIfNeeded(); const box = await handle.boundingBox(); assert(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 4 });
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up(); await settle();
  };
  try {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant: "guided" }); await settle(); const original = await size();
    await open({ variant: "guided-v2" }); await settle(); const revised = await size();
    assert(revised.width > original.width * 1.4, `Preview width: ${original.width} -> ${revised.width}`);
    assert(revised.height > original.height * 1.4, "Default preview must be visibly taller");
    assert.equal(await page.locator(".sc-game").evaluate(node => { const game = node.getBoundingClientRect(), view = node.closest(".lp-content").getBoundingClientRect(); return game.top >= view.top && game.bottom <= view.bottom; }), true, "Default game view fits the visible workspace");
    assert.doesNotMatch(await page.locator(".nb-shell").innerText(), /transaction|opaque|serializer|continuations|SDK proof|retained draft/i);
    await field("Help with screen behavior").focus();
    assert.match(await page.getByRole("tooltip").innerText(), /overlay.*story continues/i);
    await page.keyboard.press("Escape"); assert.equal(await page.getByRole("tooltip").count(), 0);
    await field("Help with preview size").hover();
    assert.match(await page.getByRole("tooltip").innerText(), /border.*Game size/s);
    await field("Help with front and back order").click();
    assert.match(await page.getByRole("tooltip").innerText(), /same group.*all its contents/s);
    await page.keyboard.press("Escape");

    await tree("body").click(); await field("Text").fill("Keep my unfinished directions");
    const before = await view(); assert.equal(await button("Undo").isDisabled(), true);
    await drag("Resize preview width", -40, 0);
    assert.equal(parseInt((await view()).width), parseInt(before.width) - 40);
    await drag("Resize preview height", 0, 60);
    assert.equal(parseInt((await view()).height), parseInt(before.height) + 60);
    const resized = await view();
    await drag("Resize preview corner", 20, 30);
    assert.equal(parseInt((await view()).width), parseInt(resized.width) - 20);
    assert.equal(parseInt((await view()).height), parseInt(resized.height) + 30);
    const corner = await view(); await drag("Resize preview height", 0, 45, true);
    assert.deepEqual(await view(), corner, "Escape restores the workspace size");
    await page.getByRole("separator", { name: "Resize preview width", exact: true }).focus(); await page.keyboard.press("ArrowRight");
    assert.equal(parseInt((await view()).width), parseInt(corner.width) + 10);
    await page.getByRole("separator", { name: "Resize preview corner", exact: true }).focus(); await page.keyboard.press("Shift+ArrowDown");
    assert.equal(parseInt((await view()).height), parseInt(corner.height) + 40);
    assert.equal(await field("Game size").inputValue(), "1280 × 720");
    assert.equal(await field("Text").inputValue(), "Keep my unfinished directions");
    assert.equal(await button("Undo").isDisabled(), true, "Workspace resizing creates no source undo entry");
    await button("Focus preview").click(); await settle();
    assert((await size()).width > revised.width * 1.3, "Focus preview uses the notebook's space");
    assert.equal(await page.locator(".nb-notebook").evaluate(node => node.inert), true);
    await page.keyboard.press("Escape");
    assert.equal(await button("Focus preview").isVisible(), true);
    assert.equal(await field("Text").inputValue(), "Keep my unfinished directions");
    await button("Cancel changes").click(); assert.match(await field("Text").inputValue(), /Choose a route/);

    await tree("title").click(); await field("Text").fill("Directions for your next stop"); await button("Apply changes").click();
    assert.match(await page.getByRole("dialog").innerText(), /Help panel, Help dialog/);
    await button("Change only this element").click(); await button("Apply changes").click();
    await button("Undo").click(); assert.equal(await field("Text").inputValue(), "Your next stop");

    // Overlap real demo elements to check painting and pointer targeting, not only labels.
    for (const id of ["body", "map"]) {
      await tree(id).click(); await group("Position & size"); await field("Inside group").selectOption("frame");
      await group("Position & size");
      await field("Horizontal position").fill("328"); await field("Vertical position").fill("274"); await button("Apply changes").click();
    }
    const hit = () => page.locator('[data-canvas-id="map"]').evaluate(node => {
      const box = node.getBoundingClientRect(); return document.elementFromPoint(box.x + 12, box.y + 12)?.getAttribute("data-canvas-id");
    });
    await page.locator(".sc-game").scrollIntoViewIfNeeded(); assert.equal(await hit(), "map");
    await tree("body").click(); await page.locator(".sc-game").scrollIntoViewIfNeeded();
    assert.equal(await hit(), "map", "Selecting an element must not lift it above the next element");
    await button("Bring forward").click(); await page.locator(".sc-game").scrollIntoViewIfNeeded(); assert.equal(await hit(), "body");
    await button("Undo").click(); await page.locator(".sc-game").scrollIntoViewIfNeeded(); assert.equal(await hit(), "map");
    await button("Send backward").click(); await tree("stack").click(); await button("Bring forward").click();
    const order = await page.locator("[data-canvas-id]").evaluateAll(nodes => nodes.map(n => n.dataset.canvasId));
    assert.deepEqual(order, ["frame", "body", "map", "title", "close"], "Moving a group keeps its descendants together");
    await button("Undo").click();

    await button("Buttons & story").click(); await button("Show overlay").click(); await button("Next line").click();
    assert.match(await page.locator(".sc-story-status").innerText(), /overlay stays open/);
    await field("Screen").selectOption("help-dialog"); await button("Open dialog").click(); await button("Next line").click();
    assert.match(await page.locator(".sc-story-status").innerText(), /Close the dialog/);
    await button("Click outside").click(); assert.match(await page.locator(".sc-story-status").innerText(), /leaves the screen open/);
    await button("Close dialog").click(); await button("Press Escape").click();
    assert.match(await page.locator(".sc-story-status").innerText(), /already closed/);
    await button("Select Close Help on canvas").click(); await button("Add action").click();
    assert.match(await page.locator(".sc-action-row").first().innerText(), /Set help_seen to true/);
    assert.match(await page.locator(".sc-action-row").last().innerText(), /Return to story/);
    await button("Move action 2 up").click(); assert.match(await page.getByRole("alert").innerText(), /last action/);

    await open({ variant: "guided-v2", state: "conflict" }); await tree("body").click(); await field("Text").fill("Keep during script review");
    await button("Apply changes").click(); assert.match(await page.getByRole("alert").innerText(), /script changed/);
    await button("Review script change").click(); await button("Apply changes").click(); assert.equal(await field("Text").inputValue(), "Keep during script review");
    await open({ variant: "guided-v2", state: "template" }); await tree("body").click();
    assert.equal(await field("Text").isDisabled(), true); assert.equal(await button("Bring forward").isDisabled(), true);
    await page.setViewportSize({ width: 560, height: 640 }); await open({ variant: "guided-v2", viewport: "compact", theme: "dark", state: "empty" });
    await button("Create first Help screen").click(); await field("Screen name").fill("Station directions"); await button("Create screen").click();
    await drag("Resize preview height", 0, 30); await button("Focus preview").click(); await page.keyboard.press("Escape");
    assert.equal(await field("Screen").locator("option:checked").innerText(), "Station directions");
    console.log("Screens journey guided-v2: passed");
  } catch (error) {
    const state = await page.evaluate(() => ({ variant: new URLSearchParams(location.search).get("variant"), focus: document.activeElement?.getAttribute("aria-label"), workspace: document.querySelector(".nb-workspace")?.getAttribute("style"), status: document.querySelector(".lp-status")?.textContent }));
    throw new Error(`Screens journey guided-v2: ${error.message}\nState: ${JSON.stringify(state)}`, { cause: error });
  }
}
