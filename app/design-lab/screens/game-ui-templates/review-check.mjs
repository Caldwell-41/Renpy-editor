import assert from 'node:assert/strict';
// PROTOTYPE proof for #222. Draws each template large with each theme. Set TEMPLATE_SHOTS to a folder to save each large picture.
// Retire it when Kris has chosen.
const pages = { title: 3, say: 3, choice: 3, history: 3 };
export default async function ({ page, open, capture }) {
  const shots = process.env.TEMPLATE_SHOTS;
  {
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
      if (id !== 'title') continue;
      // The title templates again, on an author's picture.
      await page.locator('[data-sample=titleBg][data-value=picture]').click();
      for (let i = 0; i < count; i++) {
        for (const theme of ["Ren'Py default", 'Lantern', 'Harbor', 'Paper', 'Signal', 'Hollow', 'Sweet']) {
          await page.locator('.tp-large-bar .tp-seg button', { hasText: theme }).click();
          await page.locator('.tp-large .gp-stage').screenshot({ path: `${shots}/title-${i + 1}-${theme.toLowerCase().replace(/[^a-z]+/g, '')}-picture.png` });
        }
        await page.keyboard.press('ArrowRight');
      }
    }
  }
}
