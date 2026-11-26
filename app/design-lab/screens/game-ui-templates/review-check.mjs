import assert from 'node:assert/strict';
// PROTOTYPE proof for #222. Draws each template large with each theme, and walks the sheet through
// a template choice, "Custom" and the question. Set TEMPLATE_SHOTS to a folder to save each large picture.
// Retire it when Kris has chosen.
const pages = { title: 4, say: 3, choice: 3, history: 3 };
export default async function ({ page, open, capture }) {
  const shots = process.env.TEMPLATE_SHOTS;
  if (/screen=game-ui-templates/.test(page.url())) {
    for (const [id, count] of Object.entries(pages)) {
      await open({ state: id, viewport: 'wide', theme: 'dark' });
      assert.equal(await page.locator('.tp-row').count(), 7);
      assert.equal(await page.locator('.tp-row').first().locator('.tp-thumb').count(), count);
      await capture(`board-${id}`);
      if (!shots) continue;
      await page.locator('.tp-thumb').first().click();
      for (let i = 0; i < count; i++) {
        for (const theme of ["Ren'Py default", 'Lantern', 'Harbor', 'Paper', 'Signal', 'Hollow', 'Sweet']) {
          await page.locator('.tp-large-bar .tp-seg button', { hasText: theme }).click();
          await page.locator('.tp-large .gp-stage').screenshot({ path: `${shots}/${id}-${i + 1}-${theme.toLowerCase().replace(/[^a-z]+/g, '')}.png` });
        }
        await page.keyboard.press('ArrowRight');
      }
    }
  } else {
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
    await page.locator('[data-template=center]').click();
    assert.equal(await page.locator('.tp-ask').count(), 1, 'a layout of the author\'s own asks first');
    await capture('sheet-question');
    await page.locator('[data-ask=yes]').click();
    assert.match(await page.locator('.tp-template-text').innerText(), /Centered/);
  }
}
