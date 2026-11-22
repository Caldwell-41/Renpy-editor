import assert from 'node:assert/strict';
// Focused proof for the Game UI detailed level study (#205). Run once per mock. Retire it when Kris has chosen.
export default async function ({ page, open, capture }) {
  const preset = await page.locator('[data-preset]').inputValue();
  const status = () => page.locator('.gu-footer [role=status]').innerText();
  const name = () => page.locator('.d-name h2').innerText();
  const el = id => page.locator(`[data-main] [data-el="${id}"]`);
  const order = id => page.evaluate(box => [...document.querySelector(`[data-main] [data-el="${box}"]`).children].map(n => n.dataset.el), id);
  const drag = async (from, to, dy = 0) => {
    const a = await el(from).boundingBox(), b = await el(to).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2 + dy, { steps: 6 }); await page.mouse.up();
  };

  // Selection: the group first, then the element. "The box first" starts one step further out.
  await open({ state: 'screen', viewport: 'wide', theme: 'dark' });
  await page.locator('[data-do="go:title"]').click();
  await el('load').click();
  if (preset === 'boxes') { assert.equal(await name(), 'Menu'); await el('load').click(); }
  assert.equal(await name(), 'Menu buttons');
  assert.equal(await page.locator('.d-over .d-sel').count(), 6);
  await capture(`${preset}-group`);
  await el('load').click();
  assert.equal(await name(), 'Load');
  // Inside the group, a click on another member selects that member.
  await el('help').click();
  assert.equal(await name(), 'Help');

  // A group change reaches every member, and the open chain gives the two commands.
  await page.locator('.d-crumbs [data-do="crumb:g:menu"]').click();
  const text = page.locator('[data-in="look:text"]');
  await text.fill('#ff0000'); await text.dispatchEvent('change');
  assert.match(await el('quit').getAttribute('style'), /color:#ff0000/);
  await page.locator('[data-do="menu:chain:text"]').click();
  assert.deepEqual(await page.locator('.gu-pop [role=menuitem]').allInnerTexts(), ['Same as buttons in the game', 'Use for all buttons in the game']);
  await page.locator('[data-do="same:text"]').click();
  assert.match(await el('quit').getAttribute('style'), /color:#f6efe2/);

  // The keyboard: Tab steps through the elements, an arrow key moves one, Esc goes out one step.
  await page.locator('[data-canvas]').focus();
  await page.keyboard.press('Escape');
  assert.equal(await name(), 'Menu');
  await page.keyboard.press('Tab');
  assert.equal(await name(), 'Start');
  await page.keyboard.press('ArrowDown');
  if (preset === 'boxes') assert.match(await el('start').getAttribute('style'), /translate:0cqw 0\.052cqw/);
  else assert.deepEqual((await order('menu')).slice(0, 2), ['load', 'start']);
  await page.keyboard.press('Escape');
  assert.equal(await name(), 'Menu buttons');
  await page.locator('[data-do="undo"]').click();

  // A drag in a column: it lands at the line, or it shifts by pixels.
  await drag('quit', 'load', -4);
  if (preset === 'boxes') assert.match(await status(), /Move Quit/);
  else assert.deepEqual(await order('menu'), ['start', 'quit', 'load', 'prefs', 'about', 'help']);
  await page.locator('[data-do="undo"]').click();

  // A new element: by the selection it lands after the selected button and joins its group. Otherwise the author places it.
  await el('about').click(); await el('about').click();
  await page.locator('[data-do="menu:add"]').click();
  await page.locator('[data-do="add:Button"]').click();
  if (preset !== 'point') { const b = await el('help').boundingBox(); await page.mouse.click(b.x + 10, b.y + 2); }
  assert.deepEqual((await order('menu')).slice(3, 5), ['about', 'new1']);
  assert.match(await status(), /one of the Menu buttons/);
  await capture(`${preset}-added`);
  await page.locator('[data-canvas]').focus();
  await page.keyboard.press('Delete');
  assert.equal((await order('menu')).length, 6);

  // The states: a button with an own Idle fill keeps it in Hover until Hover gets an own value.
  await open({ state: 'button', viewport: 'wide', theme: 'dark' });
  assert.deepEqual(await page.locator('.d-crumbs button').allInnerTexts(), ['Stub box', 'Buttons row', 'Buttons on this screen']);
  await page.locator('[data-do="state:hover"]').first().click();
  assert.match(await el('board').getAttribute('style'), /background:#e8a54b/);
  await capture(`${preset}-states`);
  if (preset === 'boxes') await page.locator('[data-do="cell:hover.fill"]').click();
  if (preset === 'place') { await page.locator('[data-do="menu:diff:hover"]').click(); await page.locator('[data-do="own:hover.fill"]').click(); }
  const fill = page.locator('[data-in="look:hover.fill"]');
  await fill.fill('#ffffff'); await fill.dispatchEvent('change');
  assert.match(await el('board').getAttribute('style'), /background:#ffffff/);
  await capture(`${preset}-hover-own`);

  // Actions, variable text and the source-only part.
  await page.locator('[data-do="menu:act"]').click();
  await page.locator('[data-do="actadd:show"]').click();
  assert.equal(await page.locator('.d-actions li').count(), 3);
  await open({ state: 'text', viewport: 'wide', theme: 'dark' });
  assert.match(await el('detail').innerText(), /Platform 4 · 23:52/);
  await page.locator('[data-do="menu:var"]').click();
  await capture(`${preset}-variables`);
  await page.locator('[data-do="var:tram_wait"]').click();
  assert.match(await el('detail').innerText(), /one way 6/);
  await open({ state: 'source', viewport: 'wide', theme: 'dark' });
  await capture(`${preset}-source`);
  await drag('stops', 'heading');
  assert.match(await status(), /does not move here/);
  await open({ state: 'bar', viewport: 'wide', theme: 'dark' });
  await capture(`${preset}-bar`);
  await open({ state: 'box', viewport: 'wide', theme: 'dark' });
  await capture(`${preset}-box`);
}
