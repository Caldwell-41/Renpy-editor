import assert from 'node:assert/strict';
// Focused proof and review captures for the Story Combined status study. Run once per variant.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Status variant"]').inputValue();
  const shell = () => page.locator('.scs-shell').innerText();
  const heading = () => page.locator('.sdc-editor-heading').innerText();
  const shot = async name => { await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)); await capture(name); };

  for (const viewport of ['wide', 'compact']) {
    await open({ state: 'pending', viewport });
    assert.match(await shell(), /5 unsaved/);
    assert.equal(await page.locator('.scs-draft-mark').count() >= 2, true);
    assert.doesNotMatch(await shell(), /\bbody\b/i);
    if (viewport === 'wide') for (const text of ['End of "If trust ≥ 5"', 'End of option 2 "Leave"', 'End of scene']) assert.equal(await page.getByRole('button', { name: `Add a beat at ${text}`, exact: true }).count(), 1);
    await shot(`${variant}-pending-dark-${viewport}`);

    await open({ state: 'refused', viewport });
    assert.match(await shell(), /Nothing saved/);
    if (variant !== 'footer' || viewport === 'wide') assert.match(await page.locator('.scs-shell').innerText(), /3 of 5 drafts need changes/);
    assert.match(await heading(), /^05 · Dialogue/);
    assert.equal(await page.locator('.scs-fail').count(), 1);
    assert.match(await page.locator('#scs-error-text').innerText(), /Close \{i\} with \{\/i\}/);
    assert.equal(await page.locator('[data-action=undo]').count(), 1);
    assert.equal(await page.locator('.scs-toolbar [data-action=undo]').count(), 0);
    await shot(`${variant}-refused-dark-${viewport}`);

    await open({ state: 'conflict', viewport });
    assert.match(await heading(), /^04 · Dialogue/);
    assert.equal(await page.locator('.sdc-conflict').count(), 1);
    assert.match(await page.locator('.scs-reel-conflict').innerText(), /Conflict with source/);
    await shot(`${variant}-conflict-dark-${viewport}`);

    await open({ state: 'undone', viewport });
    assert.match(await shell(), /Undone: dialogue edit in beat 06\.2\.1/);
    assert.match(await heading(), /^06\.2\.1 · Dialogue/);
    await page.locator('[data-action=undo]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-action=redo]').getAttribute('aria-label'), 'Redo dialogue edit in beat 06.2.1');
    await shot(`${variant}-undone-dark-${viewport}`);
  }

  // Interaction: Redo restores the draft, a scene link reveals the first failure there, fixing it updates the count.
  await open({ state: 'refused', viewport: 'wide' });
  await page.locator('[data-scene-jump="depot"]').click();
  assert.match(await heading(), /^03 · Dialogue/);
  await page.locator('select[aria-label="Speaker"]').selectOption('Eli');
  assert.match(await page.locator('.scs-shell').innerText(), /2 of 5 drafts need changes/);
  await page.locator('[data-action=undo]').click();
  assert.match(await page.locator('.scs-shell').innerText(), /3 of 5 drafts need changes/);
  await page.locator('[data-action=redo]').click();
  assert.match(await shell(), /Redone: dialogue edit in beat 03/);
  console.log(`ok - ${variant}: four states at wide and compact, scene link, live count, Undo and Redo`);
}
