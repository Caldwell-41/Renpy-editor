import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function checkContinuity({ page, open }) {
  const output = new URL("../../../../.toolchains/design-lab/pages/screens/", import.meta.url);
  const button = name => page.getByRole("button", { name, exact: true });
  const field = name => page.getByLabel(name, { exact: true });
  const section = name => page.locator(`.sc-property-group[data-group="${name}"]`);
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const state = () => page.locator(".sc-property-group").evaluateAll(sections => Object.fromEntries(sections.map(section => [section.dataset.group, section.open])));
  const expand = async (name, open = true) => {
    if (await section(name).evaluate(section => section.open) !== open) await section(name).locator("summary").click({ position: { x: 8, y: 8 } });
  };
  const focused = locator => locator.evaluate(control => control === document.activeElement);
  const design = variant => button(variant === "flow" ? "2  Design" : variant === "direct" ? "Edit element" : "Position & look").click();
  await page.setViewportSize({ width: 1100, height: 720 });
  for (const variant of ["guided-v2", "direct", "flow"]) {
    await open({ variant }); await design(variant);
    await expand("Text & image", false); await expand("Font & color"); await expand("Reuse this look");
    const before = await state();
    await button("Give this element its own look").scrollIntoViewIfNeeded();
    const scrollBefore = await page.locator(".nb-notebook").evaluate(panel => panel.scrollTop);
    await button("Give this element its own look").click(); await settle();
    assert.deepEqual(await state(), before, "Reuse actions retain open and deliberately closed sections");
    assert.match(await section("Reuse this look").innerText(), /has its own look/);
    assert.equal(await focused(button("Give this element its own look")), true);
    assert.equal(await button("Give this element its own look").evaluate(control => { const box = control.getBoundingClientRect(), panel = control.closest(".nb-notebook").getBoundingClientRect(); return box.top >= panel.top && box.bottom <= panel.bottom; }), true, "The changed control stays in the editing panel's visible area");
    if (scrollBefore > 0) assert(await page.locator(".nb-notebook").evaluate(panel => panel.scrollTop > 0), "Rebuilding does not reset the panel to its top");
    await button("Use the shared heading look").click(); assert.deepEqual(await state(), before);
    await button("Give this element its own look").click();

    await expand("Text & image"); const beforePicker = await state();
    await button("Choose a font").click(); await field("Example font").selectOption("NotoSerif-Regular.otf"); await button("Use font").click(); await settle();
    assert.deepEqual(await state(), beforePicker, "Font selection preserves other expanded sections");
    assert.equal(await field("Font").inputValue(), "NotoSerif-Regular.otf");
    assert.equal(await focused(button("Choose a font")), true, "Font selection returns focus to its launcher");
    await button("Choose a font").click(); await field("Example font").selectOption("NotoSans-Regular.ttf"); await button("Cancel selection").click(); await settle();
    assert.equal(await field("Font").inputValue(), "NotoSerif-Regular.otf"); assert.deepEqual(await state(), beforePicker);
    assert.equal(await focused(button("Choose a font")), true);
    await button("Choose a font").click(); await page.keyboard.press("Escape"); await settle(); assert.equal(await focused(button("Choose a font")), true);

    await expand("Position & size"); const beforeUnits = await state(); await field("Position units").focus(); await field("Position units").selectOption("relative"); await settle();
    assert.deepEqual(await state(), beforeUnits, "Position controls use the same section-state preservation");
    assert.equal(await focused(field("Position units")), true);
    await button("Apply changes").click(); assert.deepEqual(await state(), beforeUnits);
    await expand("Font & color", false); const remembered = await state(); await button("Cancel changes").click(); assert.deepEqual(await state(), remembered);
    await button("Select Instructions on canvas").click(); await button("Select Help title on canvas").click();
    assert.deepEqual(await state(), remembered, "Each element remembers its editing sections");
    assert.equal(await field("Font").inputValue(), "NotoSerif-Regular.otf");
    console.log(`Screens Design section continuity ${variant}: passed`);
  }
  await open({ variant: "flow" }); await button("Select Tram map on canvas").click(); await expand("Reuse this look");
  const imageState = await state(); await button("Browse example images").click(); await field("Example image").selectOption("help-symbol.png"); await button("Use image").click(); await settle();
  assert.deepEqual(await state(), imageState); assert.equal(await focused(button("Browse example images")), true);

  await open({ variant: "flow" }); await button("3  Connect").click(); await button("Select Close Help on canvas").click();
  const actionState = await state(); await button("Add action").click(); await settle();
  assert.deepEqual(await state(), actionState); assert.equal(await focused(button("Add action")), true);
  await button("Remove action 2").click(); await settle();
  assert.deepEqual(await state(), actionState);
  assert.equal(await section("What this button does").locator("summary").evaluate(summary => summary === document.activeElement), true, "Removing a focused control returns to its section heading");

  await page.setViewportSize({ width: 560, height: 640 }); await open({ variant: "flow", theme: "dark", viewport: "compact" }); await button("2  Design").click();
  await expand("Reuse this look"); await button("Give this element its own look").click(); await settle();
  assert.equal(await section("Reuse this look").evaluate(section => section.open), true); assert.equal(await focused(button("Give this element its own look")), true);
  await page.screenshot({ path: fileURLToPath(new URL("flow-reuse-dark-compact.png", output)) });
  await expand("Font & color"); await button("Choose a font").click(); await field("Example font").selectOption("NotoSerif-Regular.otf");
  await page.screenshot({ path: fileURLToPath(new URL("flow-font-picker-dark-compact.png", output)) });
  await button("Use font").click(); await settle();
  assert.equal(await section("Font & color").evaluate(section => section.open), true); assert.equal(await section("Reuse this look").evaluate(section => section.open), true);
  assert.equal(await focused(button("Choose a font")), true);
  console.log("Screens image picker, action focus and compact Design continuity: passed");
}
