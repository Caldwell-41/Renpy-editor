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
    // The label of a setting opens the line it writes, and the unsaved count opens the list of pending lines.
    await open({ state: 'dialogue', viewport: 'wide', theme: 'dark' });
    await page.locator('[data-set="say.height"][data-value="l"]').click();
    await page.locator('[data-what="say.height"]').click();
    assert.match(await page.locator('.gu-writes').innerText(), /gui\.rpy · line 101[\s\S]*- define gui\.textbox_height = "m"[\s\S]*\+ define gui\.textbox_height = "l"/);
    await capture('blend-what-this-writes');
    await page.locator('.gu-list [data-go="look"]').click();
    await page.locator('[data-key="gui.accent"]').fill('#3366cc');
    await page.locator('[data-key="gui.accent"]').dispatchEvent('change');
    assert.equal(await saveState(), '2 unsaved changes');
    await page.locator('[data-act="menu-changes"]').click();
    assert.match(await page.locator('.gu-changes').innerText(), /Save writes these 2 lines[\s\S]*gui\.accent_color = "#3366cc"[\s\S]*Also redraws 34 of the 52 pictures/);
    await capture('blend-changes');
    await page.locator('[data-revert="v:gui.accent"]').click();
    assert.equal(await saveState(), '1 unsaved change');
    await page.locator('[data-revert="v:say.height"]').click();
    assert.equal(await saveState(), 'Saved');
    assert.equal(await page.locator('.gu-changes').count(), 0);
    // An element that a setting switches on or off shows that setting when it is selected.
    await open({ state: 'dialogue', viewport: 'wide', theme: 'dark' });
    await main().locator('[data-part="arrow"]').click();
    assert.equal(await page.locator('.gu-panel [data-key="say.arrow"]').count(), 1);
    // A checkbox row opens its source line from its own button.
    await page.locator('.gu-panel [data-what="say.arrow"]').click();
    assert.match(await page.locator('.gu-writes').innerText(), /define gui\.textbox_arrow = True/);
    await page.locator('.gu-panel [data-what="say.arrow"]').click();
    // Undo on the screen in view keeps the selection.
    await page.locator('.gu-panel [data-key="say.arrow"]').click();
    await page.locator('[data-act="undo"]').click();
    assert.equal(await page.locator('.gu-panel h2').first().innerText(), 'Continue arrow');
    // The dialogue box behind Choices belongs to the Dialogue box screen. It opens there and does not move here.
    await page.locator('.gu-list [data-go="choice"]').click();
    // The button sample shows the game's hover look, and pointing at the panel does not wipe it.
    await page.locator('[data-sample-key="state"]').selectOption('hover');
    await page.locator('[data-hover-part="button"]').first().hover();
    await page.mouse.move(600, 5);
    assert.match(await main().locator('[data-part="button"]').first().getAttribute('class'), /is-hover/);
    await page.locator('[data-sample-key="state"]').selectOption('idle');
    await main().locator('[data-part="box"]').click({ position: { x: 6, y: 6 } });
    assert.match(await page.locator('.gu-panel').innerText(), /This is part of Dialogue box/);
    await page.locator('[data-open-part="say:box"]').click();
    assert.equal(await page.locator('.gu-list [aria-current]').innerText(), 'Dialogue box');
    assert.equal(await page.locator('.gu-panel h2').first().innerText(), 'Box');
    // An inherited setting keeps its control. The first change gives the screen its own value, and the chain returns it.
    assert.equal(await page.locator('[data-row="say.fill"] .gu-linked').count(), 1);
    await page.locator('[data-key="say.fill"]').fill('#22384a');
    await page.locator('[data-key="say.fill"]').dispatchEvent('change');
    assert.match(await main().locator('[data-part="box"]').getAttribute('style'), /--gp:#22384a/);
    await page.locator('[data-same="say.fill"]').click();
    assert.equal(await page.locator('[data-row="say.fill"] .gu-linked').count(), 1);
    // A new button takes its words from the Text field, and the element list stays open across a selection.
    await page.locator('[data-act="deselect"]').click();
    await page.locator('[data-act="menu-add"]').click();
    await page.locator('[data-add="Button"]').click();
    await page.locator('[data-added-text]').fill('Chapters');
    await page.locator('[data-added-text]').press('Enter');
    assert.equal(await main().locator('[data-part="new1"]').innerText(), 'Chapters');
    // Revert in the list of pending lines takes back one added element and leaves the other.
    await page.locator('[data-act="menu-add"]').click();
    await page.locator('[data-add="Text"]').click();
    await page.locator('[data-act="menu-changes"]').click();
    await page.locator('[data-revert="a:say:new2"]').click();
    await page.keyboard.press('Escape');
    assert.equal(await main().locator('[data-part="new1"]').count(), 1);
    assert.equal(await main().locator('[data-part="new2"]').count(), 0);
    assert.equal(await page.locator('.gu-panel h2').first().innerText(), 'Dialogue box');
    await page.locator('[data-act="all-parts"]').click();
    await page.locator('.gu-els [data-select="box"]').click();
    assert.equal(await page.locator('.gu-els [data-select="box"]').getAttribute('aria-pressed'), 'true');
    await page.locator('[data-act="undo"]').click();
    await page.locator('[data-act="undo"]').click();
    await main().locator('[data-part="box"]').click({ position: { x: 6, y: 6 } });
    // One template choice is one pending edit with one Revert, and the header keeps its height at every name.
    await page.locator('[data-act="deselect"]').click();
    await page.locator('[data-act="menu-template"]').click();
    assert.equal(await saveState(), '1 unsaved change');
    await page.locator('[data-template="bare"]').click();
    assert.equal(await saveState(), '2 unsaved changes');
    await page.locator('[data-act="menu-changes"]').click();
    assert.match(await page.locator('.gu-changes').innerText(), /Save writes these 4 lines[\s\S]*Dialogue box · Template: Bare text/);
    await page.locator('[data-revert="t:say:bare"]').click();
    assert.equal(await saveState(), '1 unsaved change');
    await page.keyboard.press('Escape');
    await main().locator('[data-part="arrow"]').click();
    const tall = (await page.locator('.gu-el-head').boundingBox()).height;
    await main().locator('[data-part="box"]').click({ position: { x: 6, y: 6 } });
    assert.equal((await page.locator('.gu-el-head').boundingBox()).height, tall);
    // At 100% the selected element is in view.
    await page.locator('[data-act="zoom-100"]').click();
    const viewBox = await page.locator('.gu-view').boundingBox(), boxBox = await main().locator('[data-part="box"]').boundingBox();
    assert.ok(boxBox.y < viewBox.y + viewBox.height && boxBox.y + boxBox.height > viewBox.y, 'the selected box shows at 100%');
    await capture('blend-zoom-on-selection');
    // Zoom, the collapsing panels and the narrow window.
    await open({ state: 'title', viewport: 'wide', theme: 'dark' });
    const width = async () => (await main().boundingBox()).width;
    const fit = await width();
    await page.locator('[data-act="toggle-list"]').click();
    await page.locator('[data-act="toggle-panel"]').click();
    assert.ok(await width() > fit + 300, 'the canvas takes the space of both panels');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-act')), 'toggle-panel');
    assert.equal(await page.locator('.gu-list, .gu-panel').count(), 0);
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
