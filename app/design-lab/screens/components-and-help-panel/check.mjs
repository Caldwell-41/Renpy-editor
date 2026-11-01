import assert from "node:assert/strict";

// Shared by the normal Design Lab page runner and the offline review runner.
export default async function check({ page, open, capture = async () => {} }) {
  for (const variant of ["inspector", "library", "worksheet"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant, state: "group", theme: "dark", viewport: "wide" });
    const click = (action) => page.locator(`[data-action="${action}"]`).first().click();
    const dialog = () => page.locator("dialog[open]");
    const lab = async () => { if (!await page.locator(".cp-lab").evaluate(d => d.open)) await page.getByText("Lab controls and simulation limits", { exact: true }).click(); };
    await click("extract"); await dialog().locator('[name="component-name"]').fill("help"); await click("confirm-extract");
    await page.getByText("That source name is already owned.", { exact: false }).waitFor();
    await dialog().locator('[name="component-name"]').fill("route_guide"); await click("confirm-extract");
    await page.getByText("Editing shared component", { exact: true }).waitFor();
    await click("add-use"); await dialog().locator('[name="insert-screen"]').selectOption("screen-about");
    assert.equal(await dialog().locator('[name="insert-parent"]').inputValue(), "panel-frame");
    await click("confirm-insert"); await page.getByText("Editing 2 uses across 2 screens", { exact: true }).waitFor();
    await page.locator('[name="title"]').fill("A guide for night travellers"); await click("apply");
    const review = variant === "worksheet" ? page.locator(".cp-inline-review") : dialog();
    assert.deepEqual(await review.locator("tbody tr td:first-child").allTextContents(), ["help", "about"]);
    await capture(`${variant}-shared-review-dark-wide`);
    await click("confirm-apply"); await page.getByText("References and effects", { exact: true }).click(); await click("source-component");
    assert.match(await dialog().innerText(), /A guide for night travellers/); await click("dialog-close");
    await click("copy"); await dialog().locator('[name="component-name"]').fill("about_guide"); await click("confirm-copy");
    await page.getByText("Editing independent component", { exact: true }).waitFor();
    await page.locator('[name="title"]').fill("About this route"); await click("apply"); await click("confirm-apply");
    await page.locator('[name="screen"]').first().selectOption("screen-help");
    assert.equal(await page.locator('[name="title"]').inputValue(), "A guide for night travellers");
    await click("source"); assert.match(await dialog().innerText(), /use route_guide/); await click("dialog-close");
    await click("undo"); await click("redo"); await lab(); await click("reopen");
    await page.locator('[name="title"]').fill("Retain me");
    await lab();
    await page.locator('[name="external"]').selectOption("conflict");
    await page.locator('[name="title"]').fill("Retain me after more typing"); await click("apply");
    assert.equal(await page.locator('[name="title"]').inputValue(), "Retain me after more typing");
    await page.getByRole("alert").filter({ hasText: "Draft retained" }).waitFor();
    await capture(`${variant}-retained-draft-dark-wide`);
    await page.locator('[name="title"]').press("Escape"); assert.equal(await page.locator('[name="title"]').inputValue(), "A guide for night travellers");
    await lab();
    await page.locator('[name="external"]').selectOption("rename"); await click("copy");
    await page.getByText("Component unavailable.", { exact: false }).first().waitFor(); assert.equal(await dialog().count(), 0);

    await open({ variant, state: "starter", theme: "dark" });
    await dialog().locator('[name="new-name"]').fill("travel_help"); await click("confirm-new");
    assert.equal(await page.locator('[name="title"]').inputValue(), "Help");
    assert.equal(await page.locator(".cp-canvas-image img").evaluate(img => img.complete && img.naturalWidth > 0), true);
    await page.locator('[data-select="close"]').first().click(); await page.locator('[name="close-label"]').fill("Back to the story"); await click("apply"); await click("confirm-apply");
    await click("source"); assert.match(await dialog().innerText(), /textbutton "Back to the story" action Hide/); await click("dialog-close");
    await page.locator('[data-select="group"]').first().click();
    await click("image"); await dialog().locator('[name="node-width"]').fill("360"); await click("node-draft");
    await click("apply"); await click("confirm-apply"); await click("source");
    assert.match(await dialog().innerText(), /xsize 360 ysize 180/); await click("dialog-close");
    await click("step-connect"); await click("add-beat"); await dialog().locator('[name="beat-screen"]').selectOption("screen-help"); await click("confirm-beat");
    await page.locator('[data-action^="beat-source-"]').first().click(); assert.match(await dialog().innerText(), /show screen help/); await click("dialog-close");
    await click("add-beat"); await dialog().locator('[name="beat-kind"]').selectOption("hide"); await click("confirm-beat");
    await click("play"); assert.equal(await page.locator('[data-action="play-close"]').evaluate(b => b === document.activeElement), true);
    await click("play-next"); assert.equal(await page.locator(".cp-play-panel").isVisible(), true);
    await capture(`${variant}-dialogue-continues-dark-wide`);
    await click("play-outside"); assert.equal(await page.locator(".cp-play-panel").isVisible(), true);
    await page.keyboard.press("Escape"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false);
    assert.equal(await page.locator('[data-action="play-next"]').evaluate(b => b === document.activeElement), true);
    await click("play-show"); await click("play-close"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false);
    await click("play-show"); await click("play-hide"); assert.equal(await page.locator(".cp-play-panel").isVisible(), false);
    await dialog().locator('[data-action="dialog-close"]').last().click();
    await lab();
    await page.locator('[name="external"]').selectOption("panel-rename"); await click("play");
    await page.getByText("Target unavailable. Playback refused", { exact: false }).waitFor();
    assert.equal(await dialog().count(), 0);

    await page.setViewportSize({ width: 560, height: 640 }); await open({ variant, state: "shared", theme: "dark", viewport: "compact" });
    await page.locator('[name="title"]').fill("Compact draft"); await click("apply");
    await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).waitFor();
    await capture(`${variant}-shared-review-dark-compact`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
}
