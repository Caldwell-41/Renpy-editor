import assert from 'node:assert/strict';
// Focused proof for the Game UI layout study (#197). Run once per layout. Retire it when Kris has chosen.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Game UI layout"]').inputValue();
  const saveState = () => page.locator('.gu-save-state').innerText();
  const status = () => page.locator('.gu-footer [role=status]').innerText();
  const main = () => page.locator('[data-main]');
  const boxStyle = () => main().locator('[data-part="box"]').getAttribute('style');

  // A setting changes the canvas at once, counts as one unsaved change, and Undo reverses it.
  await open({ state: 'dialogue', viewport: 'wide', theme: 'dark' });
  assert.equal(await saveState(), 'Saved');
  if (variant === 'click') await main().locator('[data-part="box"]').click({ position: { x: 5, y: 5 } });
  const opacity = page.locator('[data-key="say.opacity"]');
  await opacity.focus();
  await page.keyboard.press('ArrowLeft');
  assert.match(await boxStyle(), /--go:81/);
  assert.equal(await saveState(), '1 unsaved change');
  await page.locator('[data-act="undo"]').click();
  assert.match(await boxStyle(), /--go:82/);
  assert.equal(await status(), 'Undone: Dialogue box opacity');

  // A template and a theme each apply in one step and redraw every picture of the screen.
  await page.locator('[data-template="bar"]').first().click();
  assert.equal(await main().locator('.g-say-bar').count(), 1);
  await capture(`${variant}-template`);
  await open({ state: 'themes', viewport: 'wide', theme: 'dark' });
  await page.locator('[data-theme="paper"]').first().click();
  assert.equal(await page.locator('[data-theme="paper"]').first().getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('[data-game]:not([data-over]) .g').first().getAttribute('style'), /--ga:#a3412d/);
  assert.equal(await page.locator('[data-act="undo"]').getAttribute('aria-label'), 'Undo theme "Paper"');
  await capture(`${variant}-theme-paper`);

  // The way into the detailed level, then a drag that moves the element.
  await open({ state: 'title', viewport: 'wide', theme: 'dark' });
  const menu = () => main().locator('[data-part="menu"]');
  if (variant === 'pages') await menu().dblclick({ position: { x: 3, y: 3 } });
  else if (variant === 'board') await page.locator('[data-act="level-elements"]').click();
  if (variant !== 'pages') await menu().click({ position: { x: 3, y: 3 } });
  assert.match(await menu().getAttribute('class'), /is-sel/);
  const from = await menu().boundingBox();
  await page.mouse.move(from.x + 4, from.y + 4);
  await page.mouse.down();
  await page.mouse.move(from.x + 124, from.y + 44, { steps: 4 });
  await page.mouse.up();
  const to = await menu().boundingBox();
  assert.ok(Math.abs(to.x - from.x - 120) < 3 && Math.abs(to.y - from.y - 40) < 3, `moved by ${to.x - from.x}, ${to.y - from.y}`);
  assert.equal(await page.locator('[data-act="undo"]').getAttribute('aria-label'), 'Undo move Menu buttons');
  await capture(`${variant}-dragged`);
  await page.locator('[data-act="save"]').click();
  assert.equal(await saveState(), 'Saved');

  if (variant === 'click') {
    // Try it: the game's own buttons move between screens.
    await page.locator('[data-act="try"]').click();
    await main().locator('[data-goto="save"]').first().click();
    assert.equal(await page.locator('.gu-bar h2').innerText(), 'Save and load');
    await capture('click-try-it');
  }
  if (variant === 'board') {
    await page.locator('[data-act="level-settings"]').click();
    await page.locator('[data-act="home"]').click();
    await page.locator('.gu-board [data-go="choice"]').click();
    assert.equal(await page.locator('.gu-bar h2').innerText(), 'Choices');
  }
}
