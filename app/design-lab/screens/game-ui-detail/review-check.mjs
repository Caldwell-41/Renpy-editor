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
  // One click with the switch in the panel: the click selects the button, and the Look section starts on its look group.
  const oneClick = await page.locator('[data-opt="scope"]').inputValue() === 'panel';
  await el('load').click();
  if (oneClick) {
    assert.equal(await name(), 'Load');
    assert.equal(await page.locator('[data-do="scope:group"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.d-over .d-sel').count(), 1);
    // One frame of corner marks goes around the six neighbors.
    assert.equal(await page.locator('.d-over .d-mark').count(), 1);
  } else {
    if (preset === 'boxes') { assert.equal(await name(), 'Menu'); await el('load').click(); }
    assert.equal(await name(), 'Menu buttons');
    assert.equal(await page.locator('.d-over .d-mark').count(), 1);
  }
  await capture(`${preset}-group`);
  if (!oneClick) await el('load').click();
  assert.equal(await name(), 'Load');
  // Inside the group, a click on another member selects that member.
  await el('help').click();
  assert.equal(await name(), 'Help');

  // A group change reaches every member, and the open chain gives the two commands.
  if (!oneClick) await page.locator('.d-crumbs [data-do="crumb:g:menu"]').click();
  const text = page.locator('[data-in="look:text"]');
  await text.fill('#ff0000'); await text.dispatchEvent('change');
  assert.match(await el('quit').getAttribute('style'), /color:#ff0000/);
  await page.locator('[data-do="menu:chain:text"]').click();
  assert.deepEqual(await page.locator('.gu-pop [role=menuitem]').allInnerTexts(), ['Same as buttons in the game', 'Use for all buttons in the game']);
  await page.locator('[data-do="same:text"]').click();
  assert.match(await el('quit').getAttribute('style'), /color:#f6efe2/);
  if (oneClick) {
    // "This button" changes the one button. The others keep the look of the group.
    await page.locator('[data-do="scope:one"]').click();
    await text.fill('#00ff00'); await text.dispatchEvent('change');
    assert.match(await el('help').getAttribute('style'), /color:#00ff00/);
    assert.match(await el('quit').getAttribute('style'), /color:#f6efe2/);
    // The pointer is over the Look section, so only the one button has marks.
    assert.equal(await page.locator('.d-over .d-mark').count(), 1);
    await page.locator('[data-do="undo"]').click();
    // The selected cell keeps its color.
    await page.locator('[data-do="cell:hover.text"]').click();
    assert.equal(await page.locator('[data-do="cell:hover.text"]').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(232, 165, 75)');
    // With the pointer over the Look section, the outline gives way to corner marks.
    await page.locator('.d-look h3').hover();
    assert.equal(await page.locator('.d-over .d-sel').count(), 0);
    assert.equal(await page.locator('.d-over .d-mark').count(), 1);
    await capture(`${preset}-quiet`);
  }

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
  assert.equal(await name(), oneClick ? 'Menu' : 'Menu buttons');
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
  if (preset === 'boxes' || preset === 'place') { const b = await el('help').boundingBox(); await page.mouse.click(b.x + 10, b.y + 2); }
  assert.deepEqual((await order('menu')).slice(3, 5), ['about', 'new1']);
  assert.match(await status(), /one of the Menu buttons/);
  await capture(`${preset}-added`);
  await page.locator('[data-canvas]').focus();
  await page.keyboard.press('Delete');
  assert.equal((await order('menu')).length, 6);

  // The states: a button with an own Idle fill keeps it in Hover until Hover gets an own value.
  await open({ state: 'button', viewport: 'wide', theme: 'dark' });
  assert.deepEqual(await page.locator('.d-crumbs button').allInnerTexts(), oneClick ? ['Stub box', 'Buttons row'] : ['Stub box', 'Buttons row', 'Buttons on this screen']);
  await page.locator('[data-do="state:hover"]').first().click();
  assert.match(await el('board').getAttribute('style'), /background:#e8a54b/);
  await capture(`${preset}-states`);
  if (preset === 'boxes' || preset === 'chosen') await page.locator('[data-do="cell:hover.fill"]').click();
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
  if (preset !== 'chosen') return;

  // The chosen mix. The states table has a Shadow row, and Glow takes the offset away.
  const style = id => el(id).getAttribute('style');
  await open({ state: 'button', viewport: 'wide', theme: 'dark' });
  await page.locator('[data-do="cell:hover.shadow"]').click();
  await page.locator('[data-do="none:hover.shadow"]').click();
  assert.match(await style('board'), /box-shadow:0cqw 0\.208cqw/);
  await page.locator('[data-do="glow"]').click();
  assert.match(await style('board'), /box-shadow:0cqw 0cqw/);
  await capture('chosen-shadow');
  // A fill fades to a second color.
  await page.locator('[data-do="cell:idle.fill"]').click();
  await page.locator('[data-do="none:fill2"]').click();
  assert.match(await style('board'), /linear-gradient\(to bottom/);
  await capture('chosen-gradient');
  // Duplicate puts the copy after the original.
  await page.locator('[data-do="menu:more"]').click();
  await page.locator('[data-do="duplicate"]').click();
  assert.equal((await order('row')).length, 3);

  // The pin: the element stays where it is, and its position then measures from the new point.
  await open({ state: 'box', viewport: 'wide', theme: 'dark' });
  await el('stamp').click();
  const before = await el('stamp').boundingBox();
  await page.locator('[data-do="pin:mc"]').click();
  const pinned = await el('stamp').boundingBox();
  assert.ok(Math.abs(before.x - pinned.x) < 1 && Math.abs(before.y - pinned.y) < 1);
  assert.match(await page.locator('.gu-panel').innerText(), /From the centre of the screen/);
  // A drag near the middle of the screen snaps to it and shows a guide.
  const stage = await page.locator('[data-main]').boundingBox();
  await page.mouse.move(pinned.x + pinned.width / 2, pinned.y + pinned.height / 2); await page.mouse.down();
  await page.mouse.move(stage.x + stage.width / 2 + 3, stage.y + stage.height * 0.3, { steps: 6 });
  assert.ok(await page.locator('.d-guide').count() >= 1);
  await capture('chosen-guide');
  await page.mouse.up();
  const landed = await el('stamp').boundingBox();
  assert.ok(Math.abs(landed.x + landed.width / 2 - (stage.x + stage.width / 2)) < 1);
  assert.equal(await page.locator('[data-in="pos:x"]').inputValue(), '0');
  // A handle on the left edge keeps the right edge in place.
  const handle = await page.locator('[data-handle="w"]').boundingBox();
  await page.mouse.move(handle.x + 4, handle.y + 4); await page.mouse.down();
  await page.mouse.move(handle.x - 16, handle.y + 4, { steps: 4 }); await page.mouse.up();
  const wider = await el('stamp').boundingBox();
  assert.ok(Math.abs(wider.x + wider.width - (landed.x + landed.width)) < 1.5 && wider.width > landed.width + 15);

  // Drawn or Image: the stock Menu panel starts as an image, and Drawn gives it the box look.
  await page.locator('[data-do="go:title"]').click();
  await el('panel').click({ position: { x: 6, y: 20 } });
  assert.equal(await page.locator('.d-name h2').innerText(), 'Menu panel');
  assert.equal(await page.locator('[data-do="mode:image"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('[data-in="look:fill"]').count(), 0);
  await capture('chosen-image');
  await page.locator('[data-do="mode:drawn"]').click();
  assert.equal(await page.locator('[data-in="look:fill"]').count(), 1);
  // A bar that the player can drag gets a Thumb row.
  // The look switch stays inside the panel with a long group name, and the light sample game shows the marks on white.
  await open({ state: 'text', viewport: 'wide', theme: 'dark' });
  const fits = await page.locator('.d-scope').evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.getBoundingClientRect().right <= node.closest('.gu-panel').getBoundingClientRect().right);
  assert.ok(fits);
  // A long element name clips. The panel keeps its width, and "Add element" stays in view.
  assert.ok(await page.locator('.gu-panel').evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.querySelector('[data-do="menu:add"]').getBoundingClientRect().right <= node.getBoundingClientRect().right));
  await capture('chosen-switch');
  await page.locator('[data-do="go:title"]').click();
  await page.locator('[data-sample]').selectOption('light');
  await el('load').click();
  await capture('chosen-light');
  await page.locator('[data-sample]').selectOption('dark');
  await open({ state: 'bar', viewport: 'wide', theme: 'dark' });
  assert.equal(await page.locator('[data-in="look:thumb"]').count(), 0);
  await page.locator('[data-in="bardrag"]').check();
  assert.equal(await page.locator('[data-in="look:thumb"]').count(), 1);
  await capture('chosen-bar');
}
