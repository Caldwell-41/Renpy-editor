import assert from 'node:assert/strict';
// PROTOTYPE proof for #222. Walks the sheet through a template choice, "Custom" and the question.
// Retire it when the build tree takes the sheet.
export default async function ({ page, open, capture }) {
  await open({ state: 'title', viewport: 'wide', theme: 'dark' });
  assert.match(await page.locator('.tp-template-text').innerText(), /Ren'Py default/);
  await capture('sheet-open');
  await page.locator('[data-template=row]').click();
  assert.match(await page.locator('.tp-template-text').innerText(), /Bottom row/);
  assert.equal(await page.locator('.tp-pop').count(), 0, 'a choice closes the sheet');
  await page.locator('[data-hand]').click();
  assert.match(await page.locator('.tp-template-text').innerText(), /Custom/);
  await page.locator('[data-open]').click();
  await capture('sheet-custom');
  await page.locator('[data-template=right]').click();
  assert.equal(await page.locator('.tp-ask').count(), 1, 'a layout of the author\'s own asks first');
  await capture('sheet-question');
  await page.locator('[data-ask=yes]').click();
  assert.match(await page.locator('.tp-template-text').innerText(), /Right column/);
}
