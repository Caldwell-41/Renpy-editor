import assert from 'node:assert/strict';
// PROTOTYPE proof for #215. Draws each theme's six screens large and checks the board, the tables and the
// three creation layouts. Set THEMES_SHOTS to a folder to save each large screen. Retire it when Kris has chosen.
export default async function ({ page, open, capture }) {
  const variant = new URL(page.url()).searchParams.get('variant') ?? page.url();
  const shots = process.env.THEMES_SHOTS;
  if (/board/.test(variant)) {
    await open({ state: 'large', viewport: 'wide', theme: 'dark' });
    assert.equal(await page.locator('.tm-row').count(), 7);
    for (const hover of [false, true]) {
      if (hover) await page.locator('[data-sample=state][data-value=hover]').click();
      for (let i = 0; i < 7; i++) {
        for (const screen of ['Title screen', 'Dialogue box', 'Choices', 'Save and load', 'Options', 'Confirm prompt']) {
          await page.locator('.tm-tabs button', { hasText: screen }).click();
          const name = (await page.locator('.tm-large-bar h3').innerText()).toLowerCase().replace(/[^a-z]+/g, '-');
          if (shots && (!hover || ['Title screen', 'Choices'].includes(screen))) await page.locator('.tm-large .gt-stage').screenshot({ path: `${shots}/${name}${hover ? '-hover' : ''}-${screen.toLowerCase().replace(/ /g, '-')}.png` });
        }
        await page.keyboard.press('ArrowRight');
      }
    }
    await open({ state: 'values', viewport: 'wide', theme: 'dark' });
    assert.ok(await page.locator('.tm-values tbody tr').count() > 40);
    await capture('values');
    await open({ state: 'fonts', viewport: 'wide', theme: 'dark' });
    assert.equal(await page.locator('.tm-fontlist tbody tr').count(), 13);
    await capture('fonts');
  } else {
    await open({ state: 'idle', viewport: 'wide', theme: 'dark' });
    await capture('first');
    if (/review/.test(variant)) {
      await page.locator('[data-sheet=open]').click();
      await capture('sheet');
      await page.locator('[data-choose=lantern]').click();
      assert.match(await page.locator('.tm-review').innerText(), /Lantern/);
    } else {
      await page.locator('input[value=signal]').check({ force: true });
      assert.equal(await page.locator('input[value=signal]').isChecked(), true);
    }
    await capture('chosen');
  }
}
