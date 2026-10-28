import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

// Browser sample behavior only. Production transactions and SDK geometry have
// separate owners in #38.
export default async function check({ page, open }) {
  const capture = name => page.screenshot({ path: fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/numeric-layout/${name}.png`, import.meta.url)) });
  for (const variant of ["paired-refined", "axes-refined", "placement-refined"]) {
    await page.setViewportSize({ width: 1100, height: 720 });
    await open({ variant, state: "anchored", theme: "dark" });
    const width = page.getByRole("textbox", { name: "Width", exact: true });
    const apply = page.getByRole("button", { name: "Apply layout", exact: true });
    const undo = page.getByRole("button", { name: "Undo", exact: true });
    const redo = page.getByRole("button", { name: "Redo", exact: true });
    const source = page.getByLabel("Accepted sample source", { exact: true });
    const bounds = await apply.boundingBox();
    assert(bounds && bounds.y + bounds.height <= 720, `${variant}: Apply visible without scrolling`);
    await apply.click(); assert.equal(await undo.isDisabled(), true, "No-op has no history");
    await width.fill("720"); await width.press("Enter");
    assert.match(await source.textContent(), /xsize 720/);
    assert.equal(await width.evaluate(el => el === document.activeElement), true, "Enter retains numeric focus");
    await undo.click(); assert.equal(await width.inputValue(), "640");
    await redo.click(); assert.equal(await width.inputValue(), "720");
    await width.fill("-1"); await width.press("Enter");
    assert.equal(await width.inputValue(), "-1");
    assert.equal(await width.getAttribute("aria-invalid"), "true");
    assert.match(await page.getByRole("alert").innerText(), /Width needs a whole number/);
    assert.match(await source.textContent(), /xsize 720/);
    await capture(`${variant}-invalid-dark-wide`);
    await width.press("Escape"); assert.equal(await width.inputValue(), "720");
    if (variant !== "axes-refined") await page.locator('details[data-group="size-limits"] > summary').click();
    const minimum = page.getByRole("textbox", { name: "Minimum width", exact: true });
    await minimum.fill("900"); await minimum.press("Enter");
    assert.match(await page.getByRole("alert").innerText(), /Minimum width exceeds the explicit width/);
    assert.equal(await minimum.inputValue(), "900");
    await minimum.press("Escape");
    await page.getByRole("button", { name: "Bottom right", exact: true }).click();
    await apply.click(); assert.match(await source.textContent(), /xpos 1\.0/);
    assert.match(await source.textContent(), /xanchor 1\.0/);
    await width.fill("800");
    await page.getByRole("button", { name: "Help text", exact: true }).click();
    await page.getByRole("button", { name: "Frame", exact: true }).click();
    assert.equal(await width.inputValue(), "800", "Selection retains draft");
    await width.press("Escape");

    await open({ variant, state: "constrained", theme: "dark" });
    if (variant === "placement-refined") await page.locator('details[data-group="position-and-anchor"] > summary').click();
    const ypos = page.getByRole("textbox", { name: "Vertical position", exact: true });
    await ypos.fill("24"); await ypos.press("Enter");
    assert.equal(await ypos.inputValue(), "24");
    assert.match(await page.getByRole("alert").innerText(), /vertical group controls vertical placement/);
    await capture(`${variant}-constrained-dark-wide`);
    await page.getByRole("button", { name: "Edit group spacing", exact: true }).click();
    assert.equal(await page.getByRole("textbox", { name: "Spacing", exact: true }).inputValue(), "16");
    await capture(`${variant}-spacing-dark-wide`);
    await page.getByRole("button", { name: "Help text", exact: true }).click();
    assert.equal(await ypos.inputValue(), "24", "Parent link retains child draft");

    await open({ variant, state: "conflict", theme: "dark" });
    await width.fill("800"); await width.press("Enter");
    assert.match(await page.getByRole("alert").innerText(), /Source changed/);
    assert.equal(await width.inputValue(), "800"); assert.equal(await undo.isDisabled(), true);
    await capture(`${variant}-conflict-dark-wide`);

    await page.setViewportSize({ width: 560, height: 640 });
    await open({ variant, viewport: "compact", state: "anchored", theme: "dark" });
    await width.fill("700"); await width.press("Enter");
    assert.match(await source.textContent(), /xsize 700/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await capture(`${variant}-editing-dark-compact`);
  }
}
