import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// A2 browser workflow only. This does not establish core, disk, native or SDK behavior.
export default async function check({ page, open }) {
  const capture = name => page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/l06/refined/${name}.png`, import.meta.url)) });
  const width = page.getByRole("textbox", { name: "Width", exact: true });
  const height = page.getByRole("textbox", { name: "Height", exact: true });
  const apply = page.getByRole("button", { name: "Apply image", exact: true });
  const cancel = page.getByRole("button", { name: "Cancel", exact: true });
  const undo = page.getByRole("button", { name: "Undo", exact: true });
  const redo = page.getByRole("button", { name: "Redo", exact: true });
  const picker = page.locator(".ir-picker[open]");
  const mainSource = page.getByRole("main").getByRole("button", { name: "Source", exact: true });
  const source = page.getByLabel("Accepted sample source", { exact: true });
  await page.setViewportSize({ width: 1100, height: 720 });
  await open({ variant: "refined", state: "placed", theme: "dark" });
  assert.equal(await apply.isDisabled(), true, "Unchanged Apply is disabled");
  assert.equal(await cancel.isDisabled(), true, "Unchanged Cancel is disabled");
  await width.fill("400"); assert.equal(await height.inputValue(), "225");
  await width.press("Enter"); assert.equal(await apply.isDisabled(), true);
  assert.equal(await width.evaluate(e => e === document.activeElement), true, "Apply keeps numeric focus");
  await undo.click(); assert.equal(await width.inputValue(), "320");
  await redo.click(); assert.equal(await width.inputValue(), "400");
  await width.fill("-1"); await width.press("Enter");
  assert.equal(await width.inputValue(), "-1"); assert.equal(await width.getAttribute("aria-invalid"), "true");
  assert.equal(await width.evaluate(e => e === document.activeElement), true, "Error focuses the incorrect field");
  assert.match(await page.getByRole("alert").innerText(), /Width needs a whole number/);
  await capture("refined-invalid-size-dark-wide");
  await width.press("Escape"); assert.equal(await width.inputValue(), "400");
  assert.equal(await width.evaluate(e => e === document.activeElement), true, "Cancel keeps numeric focus");

  await width.fill("480"); await mainSource.click();
  assert.match(await source.textContent(), /xsize 400/); assert.doesNotMatch(await source.textContent(), /xsize 480/);
  await page.locator("dialog[open]").getByRole("button", { name: "Back to editing", exact: true }).click();
  assert.equal(await width.inputValue(), "480");
  await page.getByRole("button", { name: "1  Choose", exact: true }).click();
  await page.getByRole("button", { name: "Help text", exact: true }).click();
  await page.getByRole("button", { name: "Return to image", exact: true }).click();
  assert.equal(await width.inputValue(), "480", "Selection retains draft");
  await page.locator(".ir-asset-trigger").click();
  await page.getByRole("searchbox", { name: "Search UI images", exact: true }).fill("not-a-real-image");
  assert.match(await picker.innerText(), /No UI images match/);
  await capture("refined-no-results-dark-wide");
  await page.getByRole("button", { name: "Clear search", exact: true }).click();
  await picker.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await width.inputValue(), "480");
  await page.locator(".ir-asset-trigger").click();
  await picker.getByRole("button", { name: "Use Night ticket", exact: true }).click();
  assert.equal(await height.inputValue(), "192");
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
  assert.equal(await width.evaluate(e => e === document.activeElement), true, "Picking an image proceeds to size");
  await cancel.click(); assert.equal(await width.inputValue(), "400");

  // File-picker and staged-import cancellation happen inside one chooser.
  await width.fill("500"); await page.locator(".ir-asset-trigger").click();
  await picker.getByRole("button", { name: "Import image…", exact: true }).click();
  await picker.getByRole("button", { name: "Simulate file picker Cancel", exact: true }).click();
  assert.match(await picker.innerText(), /Choose image/);
  await picker.getByRole("button", { name: "Import image…", exact: true }).click();
  await picker.getByRole("button", { name: "Browse files…", exact: true }).click();
  await picker.getByRole("textbox", { name: "Display name", exact: true }).fill("Draft station seal");
  await capture("refined-import-dark-wide");
  await picker.getByRole("button", { name: "Cancel import", exact: true }).click();
  assert.equal(await picker.getByRole("button", { name: "Use Draft station seal", exact: true }).count(), 0);
  await picker.getByRole("button", { name: "Close", exact: true }).click();
  assert.equal(await width.inputValue(), "500");
  await page.locator(".ir-asset-trigger").click();
  await picker.getByRole("button", { name: "Import image…", exact: true }).click();
  await picker.getByRole("button", { name: "Browse files…", exact: true }).click();
  await picker.getByRole("button", { name: "Import and use", exact: true }).click();
  assert.equal(await width.inputValue(), "500"); assert.equal(await height.inputValue(), "500");
  await apply.click(); await mainSource.click(); assert.match(await source.textContent(), /station_seal.png/);
  await page.locator("dialog[open]").getByRole("button", { name: "Back to editing", exact: true }).click();
  await undo.click(); assert.equal(await width.inputValue(), "400");

  // Adding a second ordinary node stays in this screen; Cancel restores selection.
  await page.getByRole("button", { name: "Add element", exact: true }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Image", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Add image", exact: true }).isDisabled(), true);
  await cancel.click(); assert.equal(await width.inputValue(), "400");
  await page.getByRole("button", { name: "Add element", exact: true }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Image", exact: true }).click();
  await page.locator(".ir-asset-trigger").click(); await picker.getByRole("button", { name: "Use Route marker", exact: true }).click();
  await width.fill("128"); await page.getByRole("button", { name: "Add image", exact: true }).click();
  assert.equal(await page.locator(".ir-game-image").count(), 2);
  await mainSource.click(); assert.match(await source.textContent(), /tram_emblem.png/); assert.match(await source.textContent(), /route_marker.png/);
  await page.locator("dialog[open]").getByRole("button", { name: "Back to editing", exact: true }).click();
  await undo.click(); assert.equal(await page.locator(".ir-game-image").count(), 1);
  await redo.click(); assert.equal(await page.locator(".ir-game-image").count(), 2);
  assert.equal(await width.inputValue(), "128");
  await width.fill("160");
  await page.getByRole("button", { name: "Select image Tram emblem", exact: true }).click(); assert.equal(await width.inputValue(), "400");
  await page.getByRole("button", { name: "Select image Route marker", exact: true }).click(); assert.equal(await width.inputValue(), "160");
  await cancel.click();

  for (const state of ["missing", "replaced", "invalid", "conflict"]) {
    await open({ variant: "refined", state, theme: "dark" }); await width.fill("500"); await apply.click();
    assert.equal(await width.inputValue(), "500");
    assert.match(await page.getByRole("alert").innerText(), state === "missing" ? /missing/ : state === "replaced" ? /changed/ : state === "invalid" ? /decoded/ : /Source changed/);
    assert.equal(await undo.isDisabled(), true);
    await capture(`refined-${state}-draft-dark-wide`);
    if (state === "replaced") {
      await page.getByRole("button", { name: "Review changed image", exact: true }).click(); await capture("refined-review-replacement-dark-wide");
      await page.getByRole("button", { name: "Use changed image", exact: true }).click();
      assert.equal(await width.inputValue(), "500"); assert.equal(await height.inputValue(), "200");
      assert.equal(await page.getByRole("checkbox", { name: "Preserve aspect ratio", exact: true }).isChecked(), true);
      await apply.click(); assert.equal(await undo.isDisabled(), false);
    }
  }
  await page.setViewportSize({ width: 560, height: 640 });
  await open({ variant: "refined", state: "placed", theme: "dark", viewport: "compact" });
  const initialBounds = await apply.boundingBox(); assert(initialBounds && initialBounds.y + initialBounds.height <= 572, "Compact Apply is fully visible before any scrolling");
  await width.fill("360"); await width.press("Enter"); assert.equal(await width.inputValue(), "360");
  assert.equal(await height.inputValue(), "203");
  const bounds = await apply.boundingBox(); assert(bounds && bounds.y >= 0 && bounds.y + bounds.height <= 640, "Compact Apply remains reachable in viewport");
  await capture("refined-editing-dark-compact");
  await page.getByText("Prototype tools", { exact: true }).click();
  await page.getByRole("button", { name: "Simulate reopen", exact: true }).click();
  assert.equal(await width.inputValue(), "360");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.getByRole("button", { name: "Previous variant", exact: true }).click();
  await page.waitForURL(/variant=inspector/);
  await page.getByRole("button", { name: "Next variant", exact: true }).click();
  await page.waitForURL(/variant=refined/);

}
