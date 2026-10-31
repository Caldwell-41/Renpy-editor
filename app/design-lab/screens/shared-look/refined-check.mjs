import assert from "node:assert/strict";

export default async function check({ page, open }) {
  const state = async () => JSON.parse(await page.locator(".lr-state pre").textContent());
  const color = () => page.getByRole("textbox", { name: "Text color", exact: true });
  const review = () => page.getByRole("button", { name: /^Review (2 screens|Help only|1 screen)…$/ });
  const preview = target => page.getByRole("region", { name: `${target} preview`, exact: true });
  await open({ variant: "refined", state: "shared", theme: "dark" });
  assert.equal(await review().isDisabled(), true);
  await color().press("Enter"); assert.equal(await page.getByRole("dialog").count(), 0); assert.equal((await state()).history, 0);
  await page.getByRole("button", { name: "Text color: Copper", exact: true }).click();
  assert.match(await preview("Help").innerText(), /Unsaved preview/); assert.match(await preview("About").innerText(), /Unsaved preview/);
  assert.equal(await preview("Help").locator(".lr-game-panel>p").evaluate(node => getComputedStyle(node).color), "rgb(232, 168, 124)");
  assert.equal(await preview("About").locator(".lr-game-panel>p").evaluate(node => getComputedStyle(node).color), "rgb(232, 168, 124)");
  await color().evaluate(input => { input.focus(); input.setSelectionRange(1, 4); });
  await review().click(); assert.match(await page.getByRole("dialog").innerText(), /Help.*Body text.*Will update/s); assert.match(await page.getByRole("dialog").innerText(), /About.*Body text.*Will update/s);
  await page.getByRole("button", { name: "Keep editing", exact: true }).click();
  assert.deepEqual(await color().evaluate(input => ({ focus: input === document.activeElement, start: input.selectionStart, end: input.selectionEnd })), { focus: true, start: 1, end: 4 });
  assert.equal((await state()).history, 0); assert.equal(await color().inputValue(), "#e8a87c");
  await review().click(); await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).click();
  assert.equal((await state()).accepted.looks.text.values.normal.color, "#e8a87c"); assert.equal((await state()).history, 1);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); assert.equal(await color().inputValue(), "#d9c79f");
  await page.getByRole("button", { name: "Redo", exact: true }).click(); assert.equal(await color().inputValue(), "#e8a87c");
  await page.getByRole("radio", { name: /Only Help/ }).check();
  await page.getByRole("button", { name: "Text color: Sage", exact: true }).click();
  assert.match(await preview("Help").innerText(), /Unsaved preview/); assert.match(await preview("About").innerText(), /Saved look/);
  assert.equal(await preview("About").locator(".lr-game-panel>p").evaluate(node => getComputedStyle(node).color), "rgb(232, 168, 124)");
  await review().click(); assert.match(await page.getByRole("dialog").innerText(), /About.*Stays the same/s);
  await page.getByRole("button", { name: "Apply to Help only", exact: true }).click();
  let result = await state(); assert.notEqual(result.accepted.uses["Help/text"], result.accepted.uses["About/text"]); assert.equal(result.accepted.looks.text.values.normal.color, "#e8a87c"); assert.equal(result.history, 2);
  await page.getByRole("button", { name: "Undo", exact: true }).click(); result = await state(); assert.equal(result.accepted.uses["Help/text"], result.accepted.uses["About/text"]);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await color().fill("invalid"); await review().click(); assert.match(await page.getByRole("region", { name: "Look inspector" }).getByRole("alert").innerText(), /six-digit/); assert.equal(await color().inputValue(), "invalid"); assert.equal((await state()).history, 2);
  await page.getByRole("button", { name: "Cancel changes", exact: true }).click(); assert.equal(await color().inputValue(), "#b5dfc7");
  await page.locator(".lr-state summary").click(); await page.getByRole("button", { name: "Simulate reopen", exact: true }).click(); assert.equal((await state()).history, 0); assert.notEqual((await state()).accepted.uses["Help/text"], (await state()).accepted.uses["About/text"]);
  await open({ variant: "refined", state: "shared", theme: "dark" });
  await page.getByRole("checkbox", { name: "Bold", exact: true }).check(); await review().click(); await page.keyboard.press("Escape"); assert.equal(await page.getByRole("checkbox", { name: "Bold", exact: true }).evaluate(input => input === document.activeElement), true);
  await page.getByRole("button", { name: "Cancel changes", exact: true }).click();
  await page.getByRole("combobox", { name: "Selected element", exact: true }).selectOption("frame");
  await page.getByRole("button", { name: "Background color: Copper", exact: true }).click(); await review().click(); await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).click(); assert.equal((await state()).accepted.looks.frame.values.normal.background, "#e8a87c");
  await page.getByRole("combobox", { name: "Selected element", exact: true }).selectOption("button");
  await page.getByRole("combobox", { name: "Button state", exact: true }).selectOption("hover"); await page.getByRole("button", { name: "Text color: Sage", exact: true }).click(); await review().click(); await page.getByRole("button", { name: "Apply to 2 screens", exact: true }).click(); assert.equal((await state()).accepted.looks.button.values.hover.color, "#b5dfc7"); assert.equal((await state()).accepted.looks.button.values.normal.color, "#d9c79f");
  for (const scenario of ["stale", "missing"]) { await open({ variant: "refined", state: scenario, theme: "dark" }); await page.getByRole("button", { name: "Text color: Copper", exact: true }).click(); await review().click(); assert.match(await page.getByRole("region", { name: "Look inspector" }).getByRole("alert").innerText(), /Nothing was applied/); assert.equal((await state()).history, 0); assert.equal(await color().inputValue(), "#e8a87c"); }
  await open({ variant: "refined", state: "local", theme: "dark" }); await page.getByRole("button", { name: "Use this look on About…", exact: true }).click(); await page.getByRole("button", { name: "Use on About", exact: true }).click(); assert.equal((await state()).accepted.uses["Help/text"], (await state()).accepted.uses["About/text"]);
  await open({ variant: "refined", state: "expression", theme: "dark" }); assert.equal(await color().getAttribute("readonly"), ""); assert.equal(await page.getByRole("button", { name: "Text color: Copper", exact: true }).isDisabled(), true);
  console.log("Refined A2 interactions pass: shared previews, explicit scope, review, copy, focus, history and refusal.");
}
