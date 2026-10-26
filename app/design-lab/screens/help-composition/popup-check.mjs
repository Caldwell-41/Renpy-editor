import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export default async function check({ page, open }) {
  const output = new URL("../../../../.toolchains/design-lab/pages/help-composition/popup/", import.meta.url);
  await mkdir(output, { recursive: true });
  const capture = name => page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)) });
  const show = state => open({ variant: "workflow-popup", state, theme: "dark" });
  const row = id => page.locator(`[data-row="${id}"]`);
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  const redo = page.getByRole("button", { name: "Redo", exact: true });
  const source = async () => {
    await page.getByRole("button", { name: "View sample source", exact: true }).click();
    const value = await page.locator(".compose-source").innerText();
    await page.getByRole("button", { name: "Close source", exact: true }).click(); return value;
  };
  const dialog = page.getByRole("dialog", { name: /^Remove / });
  const remove = page.getByRole("button", { name: "Remove element", exact: true });
  const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
  const geometry = () => page.evaluate(() => [...document.querySelectorAll(".compose-stage, .compose-editor, .compose-tree, .lp-content")].map(el => {
    const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height, el.scrollTop];
  }));
  const focused = id => row(id).evaluate(el => el === document.activeElement);
  await page.setViewportSize({ width: 1440, height: 900 });
  await show("nested");
  const initial = await source();
  await capture("01-complete-workflow");
  const before = await geometry();
  await remove.click();
  assert.deepEqual(await geometry(), before, "Opening confirmation must not shift the workspace");
  assert.equal(await row("body").count(), 1, "Every removal needs confirmation");
  assert.equal(await cancel.evaluate(el => el === document.activeElement), true);
  assert.equal(await page.locator(".compose-source").textContent(), initial);
  await cancel.press("Shift+Tab");
  assert.equal(await dialog.getByRole("button", { name: "Remove text", exact: true }).evaluate(el => el === document.activeElement), true);
  await page.keyboard.press("Tab");
  assert.equal(await cancel.evaluate(el => el === document.activeElement), true, "Tab stays inside the dialog");
  await capture("02-leaf-confirmation");
  await cancel.press("Escape");
  assert.deepEqual(await geometry(), before);
  assert.equal(await remove.evaluate(el => el === document.activeElement), true);
  assert.equal(await undo.isDisabled(), true);
  await remove.click();
  await cancel.click();
  assert.equal(await remove.evaluate(el => el === document.activeElement), true);
  await remove.click();
  await dialog.getByRole("button", { name: "Remove text", exact: true }).click();
  assert.equal(await row("body").count(), 0);
  assert.equal(await focused("close"), true);
  assert.equal(await row("close").getAttribute("aria-selected"), "true");
  for (const key of ["Delete", "Backspace"]) {
    await row("close").dispatchEvent("keydown", { key, repeat: true, bubbles: true });
    assert.equal(await row("close").count(), 1, "Holding a removal key must preserve the fallback element");
    assert.equal(await focused("close"), true);
  }
  assert.match(await source(), /use custom_help_footer/);
  await capture("03-leaf-removed");
  await page.getByRole("button", { name: "Undo removal", exact: true }).click();
  assert.equal(await focused("body"), true);
  assert.equal(await source(), initial);
  assert.equal(await undo.isDisabled(), true, "One removal must make one history entry");
  await redo.click();
  assert.equal(await row("body").count(), 0);
  assert.equal(await focused("close"), true);
  await undo.click();

  await row("content").click();
  await page.getByRole("button", { name: "Remove element", exact: true }).click();
  const review = dialog;
  assert.match(await review.innerText(), /3 children/);
  assert.match(await review.innerText(), /Text button · Close/);
  assert.equal(await page.locator(".compose-source").textContent(), initial, "Review must not apply removal");
  await capture("04-group-confirmation");
  await cancel.press("Escape");
  assert.equal(await remove.evaluate(el => el === document.activeElement), true);
  assert.equal(await source(), initial);
  assert.equal(await undo.isDisabled(), true);
  await page.getByRole("button", { name: "Remove element", exact: true }).click();
  await page.getByRole("button", { name: "Remove group and 3 children", exact: true }).click();
  for (const id of ["content", "title", "body", "close"]) assert.equal(await row(id).count(), 0);
  assert.equal(await focused("panel"), true, "An only child's removal selects its parent");
  await undo.click();
  assert.equal(await focused("content"), true);
  assert.equal(await source(), initial);
  assert.equal(await undo.isDisabled(), true);
  await redo.click();
  assert.equal(await focused("panel"), true);
  await undo.click();

  // Last sibling selects its previous sibling; Delete follows the same operation.
  await row("close").click(); await row("close").press("Delete");
  assert.equal(await row("close").count(), 1);
  await cancel.press("Escape");
  assert.equal(await focused("close"), true);
  await row("close").press("Backspace");
  await dialog.getByRole("button", { name: "Remove text button", exact: true }).click();
  assert.equal(await focused("body"), true); await undo.click();
  assert.equal(await source(), initial);

  // Protected node, containing group, and root all refuse without a history entry.
  for (const id of ["custom", "layout", "root"]) {
    await row(id).click(); await row(id).press("Delete");
    assert.equal(await row(id).getAttribute("aria-selected"), "true");
    assert.equal(await source(), initial);
    assert.equal(await undo.isDisabled(), true);
  }
  await row("layout").click(); await row("layout").press("Delete");
  await capture("05-protected-group");

  // A pending text edit is never discarded by removal.
  await row("body").press("Enter");
  const text = page.getByRole("textbox", { name: "Text", exact: true });
  await text.fill("Keep this exact draft");
  await page.getByRole("button", { name: "Back to elements", exact: true }).click();
  await page.getByRole("button", { name: "Remove element", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /unfinished edits/);
  assert.equal(await source(), initial);
  await page.getByRole("button", { name: "Resume edit", exact: true }).click();
  assert.equal(await text.inputValue(), "Keep this exact draft");

  await show("conflict");
  await page.getByRole("button", { name: "Cancel changes", exact: true }).click();
  await page.getByRole("button", { name: "Back to elements", exact: true }).click();
  await page.getByRole("button", { name: "Remove element", exact: true }).click();
  assert.match(await page.getByRole("alert").innerText(), /Source changed/);
  assert.equal(await source(), initial);
  assert.equal(await undo.isDisabled(), true);

  await page.setViewportSize({ width: 560, height: 640 });
  await show("nested"); await row("content").click();
  await remove.scrollIntoViewIfNeeded();
  const compact = await geometry();
  await remove.click();
  assert.deepEqual(await geometry(), compact, "Compact confirmation must retain scroll and layout");
  await capture("06-compact-group-confirmation");
  await cancel.click();
  assert.deepEqual(await geometry(), compact);
  assert.equal(await remove.evaluate(el => el === document.activeElement), true);
  await remove.click();
  await page.getByRole("button", { name: "Remove group and 3 children", exact: true }).click();
  assert.equal(await focused("panel"), true);
}
