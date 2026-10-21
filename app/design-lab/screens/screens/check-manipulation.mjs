import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export default async function checkManipulation({ page, open }) {
  const output = new URL("../../../../.toolchains/design-lab/pages/screens/", import.meta.url); await mkdir(output, { recursive: true });
  const button = name => page.getByRole("button", { name, exact: true });
  const field = name => page.getByLabel(name, { exact: true });
  const node = id => page.locator(`[data-canvas-id="${id}"]`);
  const position = id => node(id).evaluate(el => ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) }));
  const drag = async (id, { shift = false, cancel = false } = {}) => {
    await node(id).scrollIntoViewIfNeeded(); const box = await node(id).boundingBox(); assert(box);
    if (shift) await page.keyboard.down("Shift");
    await page.mouse.move(box.x + 6, box.y + 6); await page.mouse.down();
    await page.mouse.move(box.x + 38, box.y + 22, { steps: 5 });
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up(); if (shift) await page.keyboard.up("Shift");
  };
  const grip = async (name, dx, dy, cancel = false) => {
    const handle = button(name); await handle.scrollIntoViewIfNeeded(); const box = await handle.boundingBox(); assert(box);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, { steps: 5 });
    if (cancel) await page.keyboard.press("Escape"); await page.mouse.up();
  };
  await page.setViewportSize({ width: 1100, height: 720 });
  for (const variant of ["guided-v2", "direct", "flow"]) {
    console.log(`Screens direct manipulation ${variant}: started`);
    await open({ variant });
    assert.equal(await page.locator('[data-node-id="title"]').getAttribute("aria-selected"), "true");
    await drag("body");
    assert.equal(await field("Element name").inputValue(), "Instructions", "Dragging an unselected item selects it on the first press");
    assert(Number(await field("Vertical position").inputValue()) > 274);
    assert.equal((Number(await field("Horizontal position").inputValue()) - 328) % 8, 0);
    await button("Undo").click(); assert.equal(await field("Vertical position").inputValue(), "274");
    await drag("body", { shift: true }); assert(Number(await field("Width").inputValue()) > 360);
    await button("Undo").click(); assert.equal(await field("Width").inputValue(), "360");
    assert.equal(await page.locator(".sc-element-resize").count(), 8);
    await grip("Resize Instructions right edge", 22, 0); assert(Number(await field("Width").inputValue()) > 360);
    await button("Undo").click();
    await grip("Resize Instructions left edge", 22, 0);
    assert.equal(Number(await field("Horizontal position").inputValue()) + Number(await field("Width").inputValue()), 328 + 360, "Resizing the left edge keeps the right edge fixed");
    await button("Undo").click();
    await grip("Resize Instructions bottom right", 20, 20, true); assert.equal(await field("Width").inputValue(), "360");
    await button("Resize Instructions right edge").focus(); await page.keyboard.press("ArrowRight"); assert.equal(await field("Width").inputValue(), "361");
    assert.match(page.url(), new RegExp(`variant=${variant}`)); await button("Undo").click();
    const beforeMap = await position("map"); await drag("map", { cancel: true });
    assert.deepEqual(await position("map"), beforeMap); assert.equal(await button("Undo").isDisabled(), true);
    const frame = await position("frame"), body = await position("body"); await drag("frame");
    const movedFrame = await position("frame"), movedBody = await position("body");
    // The browser rounds serialized percentages; movement snaps to integer game pixels.
    const delta = (after, before, size) => Math.round((after - before) * size / 100);
    assert.equal(delta(movedBody.x, body.x, 1280), delta(movedFrame.x, frame.x, 1280), "A group's contents move with it");
    assert.equal(delta(movedBody.y, body.y, 720), delta(movedFrame.y, frame.y, 720));
    await button("Undo").click(); assert.deepEqual(await position("frame"), frame); assert.deepEqual(await position("body"), body);
    console.log(`Screens direct manipulation ${variant}: passed`);
  }
  await open({ variant: "flow" }); await button("Select Tram map on canvas").click();
  await page.locator('.sc-property-group[data-group="Position & size"]').evaluate(el => el.open = true);
  await field("Horizontal anchor").fill("0.5"); await field("Vertical anchor").fill("0.5");
  await field("Position units").selectOption("relative"); await button("Apply changes").click();
  const mapBefore = await node("map").boundingBox();
  await grip("Resize Tram map right edge", 22, 0);
  const mapAfter = await node("map").boundingBox();
  assert(Number(await field("Width").inputValue()) > 214);
  assert(Math.abs(Number(await field("Width").inputValue()) / Number(await field("Height").inputValue()) - 214 / 124) < 0.00002, "Image resizing keeps its proportions");
  assert(Math.abs(mapBefore.x - mapAfter.x) < 0.05 && Math.abs(mapBefore.y - mapAfter.y) < 0.05, "Relative positions and centered anchors keep the opposite edges fixed");
  await button("Undo").click(); assert.equal(await field("Width").inputValue(), "214");
  await open({ variant: "flow" });
  await field("Element type").selectOption("vbox"); await button("Add element").click();
  await button("1  Choose").click(); await page.locator('[data-node-id="body"]').click();
  await page.locator('.sc-property-group[data-group="Position & size"]').evaluate(el => el.open = true);
  await field("Inside group").selectOption("node-1"); await button("Apply changes").click();
  const body = await position("body"); await drag("body");
  assert.deepEqual(await position("body"), body);
  assert.match(await page.locator(".lp-status").innerText(), /arranges its items automatically/);
  assert.match(await page.locator(".nb-stage>.sc-note").innerText(), /automatically/);

  await open({ variant: "flow" }); await button("3  Connect").click();
  assert.equal(await page.locator(".flow-card-heading h2").innerText(), "Help title");
  assert.equal(await page.locator(".flow-element-type").innerText(), "Text");
  await button("Select Close Help on canvas").click();
  assert.equal(await page.locator(".flow-card-heading h2").innerText(), "Close Help");
  assert.equal(await page.locator(".flow-element-type").innerText(), "Button");
  await page.locator(".nb-notebook").evaluate(el => el.scrollTop = 0);
  await page.screenshot({ path: fileURLToPath(new URL("flow-connect-light-wide.png", output)) });
  await field("Help with game variables").click(); assert.match(await page.getByRole("tooltip").innerText(), /story remembers/); await page.keyboard.press("Escape");
  await field("Help with action values").click(); assert.match(await page.getByRole("tooltip").innerText(), /true for Yes or false for No/); await page.keyboard.press("Escape");
  assert.equal(await page.locator(".flow-element-type").evaluate(el => parseFloat(getComputedStyle(el).fontSize) < parseFloat(getComputedStyle(el.previousElementSibling).fontSize)), true);
  assert.doesNotMatch(await page.locator(".nb-shell").innerText(), /Try values and button states|Try it in the story|No pending changes|Type & color/);
  await field("Help with preview values").click(); assert.match(await page.getByRole("tooltip").innerText(), /only the preview/); await page.keyboard.press("Escape");
  await page.locator(".sc-samples>summary").click({ position: { x: 8, y: 8 } }); await field("Button appearance").selectOption("disabled");
  assert.equal(await page.locator(".sc-samples").evaluate(section => section.open), true, "Changing preview values keeps the controls open");
  assert.equal(await node("close").getAttribute("data-appearance"), "disabled"); assert.equal(await node("title").getAttribute("data-appearance"), "normal");
  await field("Example value for destination").fill("Old town"); await field("Example value for destination").press("Tab");
  assert.match(await node("body").innerText(), /Old town/);
  await field("Example value for help_seen").selectOption("true");
  assert.equal(await button("Open dialog").isVisible(), false, "The screen test shows controls for the selected opening behavior");
  await field("Help with screen test").click(); assert.match(await page.getByRole("tooltip").innerText(), /without launching/); await page.keyboard.press("Escape");
  await button("1  Choose").click(); await page.locator('[data-node-id="title"]').click();
  await button("Choose a font").click(); await field("Example font").selectOption("NotoSerif-Regular.otf"); await button("Use font").click();
  await page.locator('.sc-property-group[data-group="Font & color"]').evaluate(el => el.open = true);
  assert.equal(await field("Font").inputValue(), "NotoSerif-Regular.otf"); await button("Cancel changes").click();

  // Visiting a shared look must not turn its old unchanged form into a dirty edit.
  await open({ variant: "flow" }); await field("Screen").selectOption("help-dialog"); await field("Screen").selectOption("help-panel");
  await button("2  Design").click(); await page.locator('.sc-property-group[data-group="Font & color"]').evaluate(el => el.open = true);
  await field("Text size").fill("36"); await button("Apply changes").click(); await button("Apply to these screens").click();
  await button("Undo").click(); assert.equal(await field("Text size").inputValue(), "32");
  await page.setViewportSize({ width: 560, height: 640 }); await open({ variant: "flow", state: "dialog", theme: "dark", viewport: "compact" });
  await button("3  Connect").click(); await button("Select Close Help on canvas").click(); await page.locator(".flow-card-heading").scrollIntoViewIfNeeded();
  await page.screenshot({ path: fileURLToPath(new URL("flow-connect-dark-compact.png", output)) });
  await open({ variant: "flow", theme: "dark", viewport: "compact" }); await page.locator('[role=treeitem][data-node-id="body"]').hover();
  await page.screenshot({ path: fileURLToPath(new URL("flow-choose-dark-compact.png", output)) });
  console.log("Screens copy, Connect context and automatic layout: passed");
}
