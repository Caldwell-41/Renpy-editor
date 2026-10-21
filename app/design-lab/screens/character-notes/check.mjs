import assert from "node:assert/strict";

export default async function check({ page, open }) {
  await open();
  const notes = page.getByRole("textbox", { name: "Writing notes" });
  const original = await notes.inputValue();
  const save = page.getByRole("button", { name: "Save changes", exact: true });
  assert.equal(await save.isDisabled(), true);
  await notes.fill("Draft retained across characters. Café 雪.");
  await page.getByRole("button", { name: "Eli", exact: true }).click();
  await page.getByRole("button", { name: "Mara", exact: true }).click();
  assert.equal(await notes.inputValue(), "Draft retained across characters. Café 雪.");
  await save.click();
  assert.equal(await page.getByRole("status").innerText(), "Saved in sample");
  await notes.fill("Discard this edit");
  await page.getByRole("button", { name: "Discard changes", exact: true }).click();
  assert.equal(await notes.inputValue(), "Draft retained across characters. Café 雪.");
  await page.reload();
  await page.locator('#preview[data-ready="true"]').waitFor();
  assert.equal(await notes.inputValue(), original);

  await open({ state: "save-error" });
  await notes.fill("Keep this draft after refusal");
  await save.click();
  assert.match(await page.getByRole("status").innerText(), /Simulated save failure/);
  assert.equal(await notes.inputValue(), "Keep this draft after refusal");
  assert.equal(await save.isEnabled(), true);
  await open({ state: "empty" });
  assert.equal(await notes.inputValue(), "");
  await page.getByRole("button", { name: "Mara", exact: true }).focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("button", { name: "Eli", exact: true }).evaluate(element => element === document.activeElement), true);
  await open({ state: "long", viewport: "compact" });
  assert(await notes.evaluate(element => element.scrollHeight > element.clientHeight));
  const bounds = await save.boundingBox();
  assert(bounds && bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 560 && bounds.y + bounds.height <= 640, "Save must remain reachable in the compact sample");
}
