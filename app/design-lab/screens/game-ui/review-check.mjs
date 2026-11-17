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
  const modeless = variant === 'click' || variant === 'blend';
  const sheet = variant === 'refined' || variant === 'blend';
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
  if (sheet) await page.locator('[data-act="menu-template"]').click();
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
  if (variant === 'pages' || variant === 'council') await menu().dblclick({ position: { x: 3, y: 3 } });
  else if (variant === 'refined') {
    // Layout A: a click finds the settings, and that group offers the way into the detailed level.
    await menu().click({ position: { x: 3, y: 3 } });
    assert.equal(await page.locator('.gu-group.is-hit h3').innerText(), 'Menu');
    await page.locator('[data-act="edit-hit"]').click();
  } else if (variant === 'board') await page.locator('[data-act="level-elements"]').click();
  if (modeless || variant === 'board') await menu().click({ position: { x: 3, y: 3 } });
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
  if (variant === 'council') {
    // Layout C: the element list is a menu, and the element carries across the Settings / Elements switch.
    await page.locator('[data-act="menu-elements"]').click();
    await capture('council-element-menu');
    await page.locator('.gu-el-pop [data-select="title"]').click();
    assert.match(await main().locator('[data-part="title"]').getAttribute('class'), /is-sel/);
    await page.locator('[data-act="level-settings"]').click();
    assert.equal(await page.locator('.gu-group.is-hit h3').innerText(), 'Game title');
    await page.locator('[data-act="level-elements"]').click();
    assert.match(await main().locator('[data-part="title"]').getAttribute('class'), /is-sel/);
    // Undo keeps the element selected, and one Escape returns to its settings.
    await page.locator('[data-offset="x"]').fill('40');
    await page.locator('[data-offset="x"]').press('Tab');
    await page.locator('[data-act="undo"]').click();
    assert.match(await main().locator('[data-part="title"]').getAttribute('class'), /is-sel/);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-act="level-settings"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.gu-group.is-hit h3').innerText(), 'Game title');
    // A screen with no settings page opens on its elements, and Settings is off for it.
    await page.locator('.gu-list [data-go="notify"]').click();
    assert.equal(await page.locator('[data-act="level-elements"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-act="level-settings"]').getAttribute('aria-disabled'), 'true');
    await capture('council-no-settings-page');
    // The canvas stays in one place between a screen with templates and a screen with none.
    const at = await main().boundingBox();
    await page.locator('.gu-list [data-go="title"]').click();
    assert.equal((await main().boundingBox()).y, at.y);
    // A screen that draws a button state lists the Button sample, and the sample menus fit the toolbar.
    await page.locator('.gu-list [data-go="save"]').click();
    assert.equal(await page.locator('.gu-bar [data-sample-key="state"]').count(), 1);
    assert.ok(await page.locator('.gu-bar').evaluate(node => node.scrollWidth <= node.clientWidth), 'the sample menus overflow the toolbar');
    await page.locator('.gu-list [data-go="choice"]').click();
    assert.equal(await page.locator('[data-act="level-settings"]').getAttribute('aria-pressed'), 'true');
    await main().locator('[data-part="button"]').first().click({ position: { x: 3, y: 3 } });
    assert.equal(await page.locator('.gu-group.is-hit h3').innerText(), 'Buttons');
    await capture('council-part-clicked');
  }
  if (sheet) {
    // A screen with no settings page opens on its elements with no dead end.
    await page.locator('[data-act="others"]').click();
    await page.locator('.gu-list [data-go="notify"]').click();
    assert.equal(await page.locator('.gu-panel h2').first().innerText(), 'Notices');
    assert.equal(await page.locator('.gu-panel [data-act="level-settings"]').count(), 0);
  }
  if (variant === 'blend') {
    // Zoom, the collapsing panels and the narrow window.
    await open({ state: 'title', viewport: 'wide', theme: 'dark' });
    const width = async () => (await main().boundingBox()).width;
    const fit = await width();
    await page.locator('[data-act="toggle-list"]').click();
    await page.locator('[data-act="toggle-panel"]').click();
    assert.ok(await width() > fit + 300, 'the canvas takes the space of both panels');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-act')), 'toggle-panel');
    await capture('blend-panels-collapsed');
    await page.locator('[data-act="toggle-panel"]').click();
    await page.locator('[data-act="toggle-list"]').click();
    await page.locator('[data-act="zoom-100"]').click();
    assert.equal(Math.round(await width()), 1920);
    await capture('blend-zoom-100');
    await open({ state: 'dialogue', viewport: 'compact', theme: 'dark' });
    const canvasBox = await main().boundingBox(), panelBox = await page.locator('.gu-panel').boundingBox();
    assert.ok(panelBox.y >= canvasBox.y + canvasBox.height, 'the panel sits under the canvas');
    assert.equal(await page.locator('[data-act="toggle-list"]').getAttribute('aria-expanded'), 'false');
    assert.ok(await page.locator('[data-key="say.opacity"]').isVisible());
    await capture('blend-compact');
  }
  if (variant === 'board') {
    await page.locator('[data-act="level-settings"]').click();
    await page.locator('[data-act="home"]').click();
    await page.locator('.gu-board [data-go="choice"]').click();
    assert.equal(await page.locator('.gu-bar h2').innerText(), 'Choices');
  }
}
