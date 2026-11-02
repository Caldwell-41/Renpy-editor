import assert from "node:assert/strict";

export default async function refinedCheck({ page, open, capture = async () => {} }) {
  const click = action => page.locator(`[data-action="${action}"]`).first().click();
  const dialog = () => page.locator("dialog[open]");
  const start = async (state = "shared", size = { width: 1100, height: 720 }) => { await page.setViewportSize(size); await open({ variant: "refined", state, theme: "dark" }); };
  async function source() { await click("source"); const text = await dialog().innerText(); await click("dialog-close"); return text; }
  async function copyForHelp(name = "help_guide") {
    await click("copy"); await dialog().locator('[name="component-name"]').fill(name); await dialog().locator('[name="component-name"]').press("Enter");
    // HTMLDialogElement.close restores focus asynchronously. A screenshot used
    // to hide this boundary in offline review; the full gate has no capture wait.
    await page.waitForFunction(() => !document.querySelector("dialog[open]") && document.activeElement?.getAttribute("name") === "title");
  }

  await start("group"); await click("extract"); await dialog().locator('[name="component-name"]').press("Enter");
  await page.getByRole("heading", { name: "Route guide", exact: true }).waitFor();
  await page.locator('.cp-scope [data-action="add-use"]').click();
  assert.equal(await dialog().locator('[name="insert-screen"]').inputValue(), "screen-about");
  await click("confirm-insert"); await page.getByText("Shared by Help and About", { exact: true }).waitFor();
  await page.locator('[name="title"]').fill("Shared night guide"); await click("apply");
  assert.deepEqual(await dialog().locator(".cp-affected tbody td:first-child").allTextContents(), ["Help", "About"]);
  assert.deepEqual(await dialog().locator(".cp-change-table tbody td:first-child").allTextContents(), ["Title"]);
  await capture("refined-shared-review-dark-wide"); await click("back-review");
  assert.equal(await page.locator('[name="title"]').inputValue(), "Shared night guide");
  await click("apply"); await click("confirm-apply");
  await page.locator('[name="screen"]').selectOption("screen-help");

  // Copy accepts the saved original. A verified refresh then moves the pending
  // draft to fresh child IDs; Apply remains the second ordinary history entry.
  await start(); await page.locator('[name="title"]').fill("Only Help changes"); await copyForHelp();
  assert.equal(await page.locator('[name="title"]').inputValue(), "Only Help changes");
  assert.equal(await page.locator('[data-action="apply"]').isEnabled(), true);
  let text = await source(); assert.match(text, /use help_guide/); assert.doesNotMatch(text, /Only Help changes/);
  await capture("refined-copy-with-draft-dark-wide");
  await click("apply"); assert.equal(await dialog().count(), 0); assert.match(await source(), /use help_guide/);
  await page.locator('[name="screen"]').selectOption("screen-about"); assert.equal(await page.locator('[name="title"]').inputValue(), "Find your way");
  await page.locator('[name="screen"]').selectOption("screen-help");
  await click("undo"); assert.match(await source(), /use help_guide/); assert.equal(await page.locator('[name="title"]').inputValue(), "Find your way");
  await click("undo"); assert.match(await source(), /use route_guide/);
  await click("redo"); assert.match(await source(), /use help_guide/);
  await click("redo"); assert.equal(await page.locator('[name="title"]').inputValue(), "Only Help changes");

  await start(); await page.locator('[name="title"]').fill("Discard these edits"); await copyForHelp(); await click("cancel");
  assert.match(await source(), /use help_guide/); assert.equal(await page.locator('[name="title"]').inputValue(), "Find your way");
  await page.getByRole("status").filter({ hasText: "The copy is still here" }).waitFor();
  await click("undo"); assert.match(await source(), /use route_guide/);

  // A failed refresh acknowledges the committed copy and retains the unbound
  // original intent. It cannot Apply until a successful verified refresh.
  await start("copy-refresh-failure");
  await page.getByText("Copy created. Your edits are still unsaved.", { exact: true }).waitFor();
  assert.equal(await page.locator('[data-action="apply"]').isDisabled(), true);
  assert.equal(await page.locator('[name="title"]').inputValue(), "Help for night travellers");
  assert.match(await source(), /use help_guide/);
  await page.locator('[name="title"]').fill("Still retained after typing");
  await click("new"); assert.equal(await dialog().count(), 0);
  assert.equal(await page.locator('[name="title"]').inputValue(), "Still retained after typing");
  await capture("refined-copy-reload-dark-wide"); await click("reload-copy");
  assert.equal(await page.locator('[name="title"]').inputValue(), "Still retained after typing");
  assert.equal(await page.locator('[data-action="apply"]').isEnabled(), true);
  await click("apply"); await click("undo"); assert.match(await source(), /use help_guide/);
  await click("undo"); assert.match(await source(), /use route_guide/);
  await start("copy-refresh-failure"); await click("cancel");
  assert.match(await source(), /use help_guide/); assert.equal(await page.locator('[data-action="reload-copy"]').count(), 0);

  await start(); await page.locator('[name="title"]').fill("Keep stale intent");
  await page.locator(".cp-lab summary").click(); await page.locator('[name="external"]').selectOption("conflict"); await click("copy");
  assert.equal(await dialog().count(), 0); assert.equal(await page.locator('[name="title"]').inputValue(), "Keep stale intent");
  await page.getByRole("alert").filter({ hasText: "Source changed" }).waitFor();
  await click("cancel"); await page.locator('[name="external"]').selectOption("delete"); await click("copy");
  assert.equal(await dialog().count(), 0); await page.getByRole("alert").filter({ hasText: "Can't find" }).waitFor();

  await start("starter"); await dialog().locator('[name="new-name"]').fill("night_help"); await dialog().locator('[name="starter-image"]').selectOption("route");
  await dialog().locator('[name="new-name"]').press("Enter"); await page.getByText("Only Night help", { exact: true }).waitFor();
  await page.locator('[name="title"]').fill("On the night tram"); await click("apply"); assert.equal(await dialog().count(), 0);
  await click("image"); await dialog().locator('[name="node-width"]').fill("360"); await click("node-draft"); await click("apply");
  assert.match(await source(), /ui\/route_map\.svg.*xsize 360/);
  await click("step-connect"); await click("add-beat");
  assert.equal(await dialog().locator('[name="beat-screen"]').inputValue(), "screen-created-1");
  await click("confirm-beat"); await click("play"); await click("play-next");
  assert.equal(await page.locator(".cp-play-panel").isVisible(), true); await capture("refined-dialogue-continues-dark-wide");
  await click("play-outside"); assert.equal(await page.locator(".cp-play-panel").isVisible(), true);
  await page.keyboard.press("Escape"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false);
  await click("play-show"); await click("play-close"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false);
  await click("play-show"); await click("play-hide"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false); await click("dialog-close");

  await start("no-images"); await page.getByText("Add a UI image first.", { exact: true }).waitFor();
  assert.equal(await dialog().locator('[data-action="confirm-new"]').isDisabled(), true); assert.equal(await dialog().locator("img").count(), 0);
  await dialog().locator('[name="new-name"]').fill("still_needs_image"); await dialog().locator('[name="starter"][value="blank"]').check();
  assert.equal(await dialog().locator('[data-action="confirm-new"]').isEnabled(), true); await dialog().locator('[name="starter"][value="help"]').check();
  assert.equal(await dialog().locator('[data-action="confirm-new"]').isDisabled(), true);
  assert.equal(await dialog().locator('[name="new-name"]').inputValue(), "still_needs_image"); await click("dialog-close");
  assert.equal(await page.locator('[data-action="undo"]').isDisabled(), true);

  await start("shared", { width: 560, height: 640 });
  const box = await page.locator('[data-action="apply"]').boundingBox(); assert(box && box.y >= 0 && box.y + box.height <= 640);
  await page.locator('[name="title"]').fill("Compact Help only"); await copyForHelp();
  await capture("refined-copy-with-draft-dark-compact"); await page.locator('[name="title"]').press("Escape");
  assert.equal(await page.locator('[name="title"]').inputValue(), "Find your way"); assert.match(await source(), /use help_guide/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}
