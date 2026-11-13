import assert from 'node:assert/strict';
// Focused proof and review captures for the Story Combined editor study. Run once per variant.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Editor variant"]').inputValue();
  const text = () => page.locator('.sce-shell').innerText();
  const shot = async name => { await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)); await capture(name); };

  for (const viewport of ['wide', 'compact']) {
    await open({ state: 'choice', viewport });
    const all = await text();
    assert.match(all, /Ends with Custom Code: renpy\.jump\(next_stop\)/);
    assert.match(all, /Ending unknown: Custom Code can leave this option/);
    assert.doesNotMatch(all, /\bbody\b/i);
    // Option 3 ends with Custom Code: its Then never claims "Continue after the Choice".
    const option3 = await page.locator('fieldset.sce-option').nth(2).innerText();
    assert.doesNotMatch(option3, /Continue after the Choice/);
    if (variant === 'replace') assert.equal(await page.locator('fieldset.sce-option').nth(2).locator('.sce-menu-button').count(), 0);
    else assert.equal(await page.locator('fieldset.sce-option').nth(2).locator('.sce-menu-button[aria-disabled=true]').count(), 1);
    await shot(`${variant}-choice-dark-${viewport}`);

    await open({ state: 'custom-code', viewport });
    assert.equal(await page.locator('fieldset.sce-option').nth(2).getByText('Ends with Custom Code').isVisible(), true);
    await shot(`${variant}-custom-code-dark-${viewport}`);

    await open({ state: 'then-menu', viewport });
    assert.match(await page.locator('.sce-menu-list').innerText(), /Option 1's beats follow below\. Then changes only its ending\./);
    await shot(`${variant}-then-menu-dark-${viewport}`);

    await open({ state: 'add-beat', viewport });
    assert.match(await page.locator('.sce-dialog').innerText(), /End of option 2 "Leave"/);
    assert.doesNotMatch(await page.locator('.sce-dialog').innerText(), /\bbody\b/i);
    await shot(`${variant}-add-beat-dark-${viewport}`);

    await open({ state: 'move', viewport });
    const move = await page.locator('.sce-dialog').innerText();
    assert.match(move, /Moves this beat to the chosen scene, branch or option\./);
    assert.match(await page.locator('.sce-summary').innerText(), /Move to The last service › If has_ticket and trust ≥ 3… › If trust ≥ 5 · End of "If trust ≥ 5"/);
    assert.doesNotMatch(move, /\bbody\b/i);
    await shot(`${variant}-move-dark-${viewport}`);

    await open({ state: 'protected', viewport });
    assert.match(await text(), /Option 2's beats, then continues after the Choice/);
    await shot(`${variant}-protected-dark-${viewport}`);
  }

  // Interaction: choosing another place updates the summary; Escape closes; + Beat opens Add a beat.
  await open({ state: 'move', viewport: 'wide' });
  if (variant === 'label') await page.locator('select[aria-label="Move to"]').selectOption('3');
  else if (variant === 'blank') await page.locator('input[data-place="3"][data-position="1"]').check();
  else await page.locator('[data-place-row="3"]').click();
  assert.match(await page.locator('.sce-summary').innerText(), /Option 2 "Leave" · End of option 2 "Leave"/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.sce-dialog').count(), 0);
  await page.locator('fieldset.sce-option').nth(1).getByRole('button', { name: 'Add a beat to option 2' }).click();
  assert.equal(await page.locator('.sce-dialog').count(), 1);
  console.log(`ok - ${variant}: six states at wide and compact, Custom Code endings, no "body", Move to and Add a beat`);
}
