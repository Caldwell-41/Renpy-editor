import assert from "node:assert/strict";

export default async function check({ page, open }) {
  const state = async () => JSON.parse(await page.locator(".lk-state pre").textContent());
  const color = () => page.getByRole("textbox", { name: "Text color", exact: true });
  const review = () => page.getByRole("button", { name: /^(Review affected screens|Review changes)$/ });
  const commit = () => page.getByRole("button", { name: "Apply to 2 screens", exact: true });
  for (const variant of ["inspector", "library", "inline"]) {
    await open({ variant, state: "shared", theme: "dark" });
    assert.equal(await review().isDisabled(), true);
    await color().press("Enter"); assert.equal(await page.locator(".lk-review").count(), 0); assert.equal((await state()).history, 0);
    await page.getByRole("checkbox", { name: "Bold", exact: true }).focus();
    await page.getByRole("button", { name: "Make independent copy", exact: true }).click();
    assert.equal(await page.getByRole("combobox", { name: "Element type", exact: true }).isDisabled(), true);
    assert.equal(await page.getByRole("combobox", { name: "Selected screen", exact: true }).isDisabled(), true);
    assert.equal(await color().isDisabled(), true);
    await page.getByRole("button", { name: "Back to editing", exact: true }).click();
    assert.equal(await page.getByRole("checkbox", { name: "Bold", exact: true }).evaluate(input => input === document.activeElement), true);
    await color().fill("#abcdef");
    const beforeReview = await color().evaluate(input => {
      input.focus(); input.setSelectionRange(2, 5);
      const body = document.querySelector(".lk-fields-scroll"); body.scrollTop = 16;
      document.querySelector(".lk-group:last-child").open = true;
      return { scroll: body.scrollTop };
    });
    await review().click();
    assert.match(await page.locator(".lk-review").innerText(), /Help/);
    assert.match(await page.locator(".lk-review").innerText(), /About/);
    await page.getByRole("button", { name: "Back to editing", exact: true }).click();
    assert.equal((await state()).history, 0); assert.equal(await color().inputValue(), "#abcdef");
    assert.deepEqual(await color().evaluate(input => ({ focus: input === document.activeElement, start: input.selectionStart, end: input.selectionEnd, scroll: document.querySelector(".lk-fields-scroll").scrollTop, open: document.querySelector(".lk-group:last-child").open })), { focus: true, start: 2, end: 5, scroll: beforeReview.scroll, open: true });
    await review().click(); await commit().click();
    let result = await state(); assert.equal(result.history, 1); assert.equal(result.accepted.styles.tram_body.color, "#abcdef");
    assert.equal(result.accepted.uses["Help/text"], "tram_body"); assert.equal(result.accepted.uses["About/text"], "tram_body");
    assert.equal(await review().isDisabled(), true);
    await page.getByRole("button", { name: "Undo", exact: true }).click(); assert.equal(await color().inputValue(), "#d9c79f");
    await page.getByRole("button", { name: "Redo", exact: true }).click(); assert.equal(await color().inputValue(), "#abcdef");
    await color().fill("#fedcba"); await page.getByRole("button", { name: "Make independent copy", exact: true }).click();
    await page.getByRole("button", { name: "Create copy & apply", exact: true }).click();
    result = await state(); assert.equal(result.accepted.uses["Help/text"], "tram_body_help"); assert.equal(result.accepted.uses["About/text"], "tram_body");
    assert.equal(result.accepted.styles.tram_body.color, "#abcdef"); assert.equal(result.accepted.styles.tram_body_help.color, "#fedcba"); assert.equal(result.history, 2);
    await page.getByRole("button", { name: "Undo", exact: true }).click(); assert.equal((await state()).accepted.uses["Help/text"], "tram_body");
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await page.locator(".lk-state summary").click(); await page.getByRole("button", { name: "Simulate reopen", exact: true }).click();
    assert.equal((await state()).history, 0); assert.equal((await state()).accepted.uses["Help/text"], "tram_body_help");
    await color().fill("bad color"); await review().click(); await page.getByRole("button", { name: "Apply to 1 screen", exact: true }).click();
    assert.match(await page.locator(".lk-review [role=alert]").innerText(), /hex color/); assert.equal((await state()).history, 0);
    await page.getByRole("button", { name: "Back to editing", exact: true }).click(); await page.getByRole("button", { name: "Cancel draft", exact: true }).click();
    assert.equal(await color().inputValue(), "#fedcba"); assert.equal((await state()).history, 0);
    for (const sample of ["stale", "missing"]) {
      await open({ variant, state: sample, theme: "dark" }); await color().fill("#abcdef"); await review().click(); await commit().click();
      assert.match(await page.locator(".lk-review [role=alert]").innerText(), /draft is retained/); assert.equal((await state()).history, 0); assert.equal((await state()).draft.color, "#abcdef");
    }
    await open({ variant, state: "local", theme: "dark" });
    await page.getByRole("button", { name: "Share with About", exact: true }).click(); await page.getByRole("button", { name: "Apply to About", exact: true }).click();
    assert.equal((await state()).accepted.uses["About/text"], "tram_body"); assert.equal((await state()).history, 1);
    await page.getByRole("button", { name: "Share with About", exact: true }).click(); assert.equal(await page.locator(".lk-review").count(), 0); assert.equal((await state()).history, 1);
    await open({ variant, state: "shared", theme: "dark" });
    await page.getByRole("combobox", { name: "Element type", exact: true }).selectOption("button");
    await page.getByRole("combobox", { name: "Appearance sample", exact: true }).selectOption("hover");
    assert.equal(await review().isDisabled(), true); await color().fill("#aabbcc"); await review().click(); await commit().click();
    result = await state(); assert.equal(result.accepted.styles["tram_button:hover"].color, "#aabbcc"); assert.equal(result.accepted.styles.tram_button.color, "#d9c79f");
    await open({ variant, state: "expression", theme: "dark" }); assert.equal(await color().getAttribute("readonly"), ""); assert.equal(await review().isDisabled(), true);
  }
  console.log("Shared-look mock interactions pass for all three layouts.");
  await (await import("./refined-check.mjs")).default({ page, open });
}
