import assert from 'node:assert/strict';
// Focused proof for the header Undo study. Run once per registered variant; retire after Kris decides.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Header Undo variant"]').inputValue();
  const undo = () => page.locator('.hu-header [data-action="undo"]');
  const redo = () => page.locator('.hu-header [data-action="redo"]');
  const status = () => page.locator('.hu-status').innerText();
  const tip = control => control.locator('xpath=following-sibling::span[contains(@class,"hu-tip")]');
  // Reach a control by keyboard so it gets the focus ring.
  const tabTo = async control => { await control.focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); };
  const shot = name => capture(`${variant}-v1-${name}`);

  for (const theme of ['dark', 'light']) {
    await open({ state: 'ready', viewport: 'wide', theme });
    assert.equal(await undo().getAttribute('aria-label'), 'Undo button resize');
    assert.equal(await redo().getAttribute('aria-disabled'), 'true');
    assert.equal(await page.locator('.hu-main').getAttribute('data-workspace'), 'story');
    await tabTo(undo());
    assert.ok(await tip(undo()).isVisible());
    assert.match(await tip(undo()).innerText(), /Undo button resize/);
    await shot(`ready-focus-${theme}-wide`);

    // The header Undo reverses the Screens resize, opens Screens and selects the button.
    await page.keyboard.press('Enter');
    assert.equal(await status(), 'Undone: button resize');
    assert.equal(await page.locator('.hu-main').getAttribute('data-workspace'), 'screens');
    assert.equal(await page.locator('[data-width]').innerText(), '240');
    assert.equal(await undo().getAttribute('aria-label'), 'Undo dialogue edit in beat 05');
    assert.equal(await redo().getAttribute('aria-label'), 'Redo button resize');
    assert.match(await tip(undo()).innerText(), /Undo dialogue edit in beat 05/);
    await shot(`undone-focus-${theme}-wide`);

    await open({ state: 'empty', viewport: 'wide', theme });
    assert.equal(await undo().getAttribute('aria-disabled'), 'true');
    assert.equal(await redo().getAttribute('aria-disabled'), 'true');
    await tabTo(undo());
    assert.match(await tip(undo()).innerText(), /Nothing to undo/);
    await undo().click({ force: true });
    assert.equal(await status(), 'Ready');
    await shot(`empty-focus-${theme}-wide`);

    for (const state of ['ready', 'undone']) {
      await open({ state, viewport: 'compact', theme });
      await tabTo(undo());
      assert.ok(await tip(undo()).isVisible());
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(overflow <= 0, `compact header overflows by ${overflow}px`);
      await shot(`${state}-focus-${theme}-compact`);
    }
  }

  // Every Undo control and the keyboard run the same command and history.
  await open({ state: 'ready', viewport: 'wide' });
  await page.locator('.hu-scene-history [data-action="undo"]').click();
  assert.equal(await status(), 'Undone: button resize');
  await page.locator('[data-action="story"]').click();
  await page.keyboard.press('ControlOrMeta+Z');
  assert.equal(await status(), 'Undone: dialogue edit in beat 05');
  assert.match(await page.locator('[data-select="05"]').innerText(), /Mara: Hello/);
  await redo().click();
  assert.equal(await status(), 'Redone: dialogue edit in beat 05');
  await page.locator('[data-action="edit-background"]').click();
  assert.equal(await redo().getAttribute('aria-disabled'), 'true', 'a new edit drops Redo');
  console.log(`ok - ${variant}: tooltips and status name the edit, Undo opens Screens, disabled and focus states, compact fit, one shared command`);
}
