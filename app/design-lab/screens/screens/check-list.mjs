import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function checkList({ page, open }) {
  const output = new URL("../../../../.toolchains/design-lab/pages/screens/", import.meta.url);
  const button = name => page.getByRole("button", { name, exact: true });
  const field = name => page.getByLabel(name, { exact: true });
  const row = id => page.locator(`[role=treeitem][data-node-id="${id}"]`);
  const ids = () => page.locator("[role=treeitem]").evaluateAll(rows => rows.map(row => row.dataset.nodeId));
  const original = ["root", "frame", "stack", "title", "body", "map", "close"];
  const positions = () => page.locator("[data-canvas-id]").evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.canvasId, [node.style.left, node.style.top]])));
  const positionGroup = () => page.locator('.sc-property-group[data-group="Position & size"]').evaluate(group => group.open = true);
  async function drag(id, beside, after = true) {
    await row(beside).scrollIntoViewIfNeeded();
    const target = await row(beside).boundingBox(); assert(target);
    await row(id).dragTo(row(beside), { targetPosition: { x: 20, y: after ? target.height - 3 : 3 } });
  }
  const choose = async variant => {
    if (variant === "flow") await button("1  Choose").click();
    else if (variant === "guided-v2") await button("Elements").click();
    else if (!await row("body").isVisible()) await button("Elements").click();
  };
  await page.setViewportSize({ width: 1100, height: 720 });
  for (const variant of ["guided-v2", "direct", "flow"]) {
    await open({ variant }); await choose(variant);
    await row("body").click();
    assert.equal(await row("body").getAttribute("aria-selected"), "true");
    assert.equal(await row("body").isVisible(), true, "Single click keeps the element list open");
    assert.equal(await page.locator(".nb-workspace").getAttribute("data-step"), "compose");
    await row("body").dblclick();
    assert.equal(await page.locator(".nb-workspace").getAttribute("data-step"), "layout");
    assert.equal(await field("Element name").inputValue(), "Instructions");
    await positionGroup();
    assert.equal(await field("Help with depth").locator("xpath=ancestor::details").getAttribute("data-group"), "Position & size");
    assert.equal(await button("Bring forward").isVisible(), true);
    assert.doesNotMatch(await page.locator(".nb-shell").innerText(), /Front & back/);
    await choose(variant);
    const before = await positions(), currentStep = await page.locator(".nb-workspace").getAttribute("data-step");
    await drag("body", "close");
    assert.deepEqual(await ids(), ["root", "frame", "stack", "title", "map", "close", "body"]);
    assert.deepEqual(await positions(), before, "Reordering changes depth without moving elements");
    assert.equal(await row("body").getAttribute("aria-selected"), "true");
    assert.equal(await page.locator(".nb-workspace").getAttribute("data-step"), currentStep, "Dragging keeps the current editing step");
    await button("Undo").click(); assert.deepEqual(await ids(), original);
    await button("Redo").click(); assert.equal((await ids()).at(-1), "body");
    await button("Undo").click();
    await drag("body", "map", false); assert.deepEqual(await ids(), original);
    assert.equal(await button("Undo").isDisabled(), true, "Dropping at the current position adds no history");
    await drag("body", "frame"); assert.deepEqual(await ids(), original);
    assert.equal(await button("Undo").isDisabled(), true, "Reordering keeps the current parent");
    await row("body").focus(); await page.keyboard.press("Alt+ArrowDown");
    assert.deepEqual(await ids(), ["root", "frame", "stack", "title", "map", "body", "close"]);
    await button("Undo").click();
    await row("body").focus(); await page.keyboard.press("Enter");
    assert.equal(await page.locator(".nb-workspace").getAttribute("data-step"), "layout");
    console.log(`Screens element-list ordering ${variant}: passed`);
  }

  await open({ variant: "flow" });
  // A real held pointer drag must show its insertion marker, then Escape cancels it.
  await row("close").scrollIntoViewIfNeeded(); const source = await row("body").boundingBox(), target = await row("close").boundingBox(); assert(source && target);
  await page.mouse.move(source.x + 25, source.y + source.height / 2); await page.mouse.down();
  await page.mouse.move(source.x + 36, source.y + source.height / 2, { steps: 3 });
  await page.mouse.move(target.x + 25, target.y + target.height - 3, { steps: 5 });
  await page.mouse.move(target.x + 26, target.y + target.height - 3);
  assert.equal(await row("close").getAttribute("data-drop"), "after");
  assert.equal(await page.getByRole("tooltip").count(), 0, "Help does not obscure a dragged row");
  await page.screenshot({ path: fileURLToPath(new URL("flow-list-drag-light-wide.png", output)) });
  await page.keyboard.press("Escape"); await page.mouse.up();
  assert.deepEqual(await ids(), original); assert.equal(await page.locator("[data-drop],.sc-tree-node.dragging").count(), 0);
  assert.equal(await button("Undo").isDisabled(), true);

  await row("body").dblclick(); await field("Text").fill("Keep these unfinished directions"); await choose("flow");
  await drag("body", "close"); assert.deepEqual(await ids(), original);
  assert.match(await page.getByRole("alert").innerText(), /Apply or cancel/);
  await row("body").dblclick(); assert.equal(await field("Text").inputValue(), "Keep these unfinished directions"); await button("Cancel changes").click();

  await choose("flow"); await field("Element type").selectOption("fixed"); await button("Add element").click();
  await choose("flow"); await row("map").dblclick(); await positionGroup(); await field("Inside group").selectOption("node-1"); await button("Apply changes").click();
  await choose("flow"); const grouped = await ids(), geometry = await positions();
  await drag("node-1", "title", false);
  assert.deepEqual(await ids(), ["root", "frame", "stack", "node-1", "map", "title", "body", "close"]);
  assert.deepEqual(await positions(), geometry, "A reordered group keeps its children and their geometry");
  await button("Undo").click(); assert.deepEqual(await ids(), grouped);

  await open({ variant: "flow", state: "template" });
  const protectedSelection = await field("Element name").inputValue();
  assert.equal(await page.locator('[role=treeitem][draggable=true]').count(), 0);
  await row("body").focus(); await page.keyboard.press("Alt+ArrowDown"); assert.deepEqual(await ids(), original);
  assert.equal(await button("Undo").isDisabled(), true);
  await button("2  Design").click(); assert.equal(await field("Element name").inputValue(), protectedSelection, "A refused reorder keeps internal and visible selection unchanged");

  await page.setViewportSize({ width: 560, height: 640 }); await open({ variant: "flow", theme: "dark", viewport: "compact" });
  await drag("body", "close"); assert.equal((await ids()).at(-1), "body"); await button("Undo").click();
  await row("body").dblclick(); await positionGroup(); await page.locator(".nb-order").scrollIntoViewIfNeeded();
  await page.screenshot({ path: fileURLToPath(new URL("flow-depth-dark-compact.png", output)) });
  console.log("Screens list cancellation, draft guard, group movement, template protection and compact depth: passed");
}
