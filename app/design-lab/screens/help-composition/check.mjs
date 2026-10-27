import assert from "node:assert/strict";
import checkWorkflow from "./workflow-check.mjs";
import checkPopup from "./popup-check.mjs";

// This proves the C2 browser sample loop, not native source writes or Ren'Py rendering.
export default async function check({ page, open }) {
  await checkWorkflow({ page, open, variant: "workflow-popup" });
  await checkPopup({ page, open });
  await page.setViewportSize({ width: 1280, height: 720 });
  const show = state => open({ variant: "focused-refined", state, theme: "dark" });
  const text = page.getByRole("textbox", { name: "New element text" });
  const pending = page.getByLabel("Pending element preview");
  await show("adding");
  await page.getByRole("button", { name: "View sample source" }).click();
  const source = page.getByLabel("Sample source");
  const before = await source.innerText();
  await text.fill("An unsaved addition");
  assert.equal(await pending.innerText(), "An unsaved addition");
  assert.equal(await source.innerText(), before, "Pending preview must not change accepted source");
  await text.press("Escape");
  assert.equal(await pending.count(), 0);
  assert.equal(await source.innerText(), before);
  assert.equal(await page.getByRole("treeitem", { name: /Text · Click/ }).evaluate(el => el === document.activeElement), true);
  await page.getByRole("button", { name: "Add...", exact: true }).click();
  assert.equal(await text.evaluate(el => el === document.activeElement), true);
  await text.fill("Accepted sample addition");
  await text.press("Control+Enter");
  assert.match(await source.innerText(), /Accepted sample addition/);
  assert.equal(await page.getByRole("treeitem", { name: "Text · Accepted sample addition", exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await source.innerText(), before);

  await show("adding");
  await text.fill("Keep my input");
  await page.getByLabel("Add inside", { exact: true }).selectOption("panel");
  assert.equal(await pending.count(), 0, "Occupied frames must not show an invalid child preview");
  await page.getByRole("button", { name: "Add text", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /frame holds one child/);
  assert.equal(await text.inputValue(), "Keep my input");
  await page.getByLabel("Add inside", { exact: true }).selectOption("content");
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.equal(await pending.innerText(), "Keep my input");
  await text.fill("");
  await page.getByRole("button", { name: "Add text", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /Enter text/);

  await show("conflict");
  await page.getByRole("button", { name: "Add...", exact: true }).click();
  await text.fill("Retained after source conflict");
  await page.getByRole("button", { name: "Add text", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /Source changed/);
  assert.equal(await text.inputValue(), "Retained after source conflict");
}
