import assert from 'node:assert/strict';
// Focused proof for the save refusal study. Run once per registered variant.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Refusal variant"]').inputValue();
  const status = () => page.locator('.ssr-status-line').innerText();
  const heading = () => page.locator('.sdc-editor-heading').innerText();
  const scene = () => page.locator('.ssr-scene-picker>button').innerText();
  const draft = key => page.locator(`[data-draft="${key}"]`).textContent();
  const saved = key => page.locator(`[data-saved="${key}"]`).textContent();
  const click = action => page.locator(`[data-action="${action}"]`).click();
  const text = value => page.getByRole('textbox', { name: 'Beat text', exact: true }).fill(value);
  const failMarks = () => page.locator('.ssr-fail').count();
  const shot = async name => { await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)); await capture(name); };

  // Save from the depot scene refuses and reveals the first failing draft in project order.
  await open({ state: 'pending', viewport: 'wide' });
  assert.match(await status(), /5 unsaved beat drafts/);
  await click('save');
  assert.match(await status(), /Nothing saved/);
  assert.match(await scene(), /The last service/);
  assert.match(await heading(), /05 · Dialogue/);
  assert.equal(await page.locator('.sdc-conflict').count(), 1);
  for (const key of ['service:05', 'service:07', 'depot:03', 'depot:04', 'depot:05']) assert.notEqual(await draft(key), 'None');
  await shot(`${variant}-refused-wide`);

  if (variant === 'marked') {
    assert.match(await status(), /3 of 5 drafts need changes/);
    assert.equal(await failMarks(), 1); // 05 fails; 07 stays a plain draft.
    await page.locator('[data-scene-jump="depot"]').click();
    assert.match(await heading(), /03 · Dialogue/);
    assert.equal(await failMarks(), 2);
    assert.match(await page.locator('.ssr-field-error').innerText(), /Choose a speaker/);
    await shot(`${variant}-depot-wide`);
    await page.locator('select[aria-label="Speaker"]').selectOption('Eli');
    assert.match(await status(), /2 of 5 drafts need changes/);
    assert.equal(await failMarks(), 1);
  }
  if (variant === 'stepper') {
    assert.match(await status(), /3 drafts need changes/);
    assert.match(await page.locator('.ssr-stepper output').innerText(), /1 of 3/);
    await click('next-failure');
    assert.match(await scene(), /Morning at the depot/); assert.match(await heading(), /03/);
    await click('next-failure');
    assert.match(await heading(), /04/);
    assert.match(await page.locator('.ssr-field-error').innerText(), /Close \{i\} with \{\/i\}/);
    await shot(`${variant}-step-3-wide`);
    await click('next-failure'); assert.match(await heading(), /05 · Dialogue/);
    await click('previous-failure'); assert.match(await heading(), /04/);
    await text('{i}The first tram leaves at six.{/i}');
    assert.match(await page.locator('.ssr-stepper output').innerText(), /– of 2/);
    await click('previous-failure'); assert.match(await heading(), /03/);
  }
  if (variant === 'first') {
    assert.match(await status(), /Fix beat 05 in The last service/);
    assert.equal(await failMarks(), 0);
    await click('override');
    assert.equal(await saved('service:05'), 'Mara: Stay here');
    assert.match(await status(), /4 unsaved beat drafts/);
    await click('save');
    assert.match(await status(), /Fix beat 03 in Morning at the depot/);
    assert.match(await page.locator('.ssr-field-error').innerText(), /Choose a speaker/);
    // Only the revealed draft shows its error; beat 04 waits for the next Save.
    await page.locator('[data-select="04"]').click();
    assert.equal(await page.locator('.ssr-field-error').count(), 0);
    await shot(`${variant}-second-save-wide`);
  }

  // Fixing every failure lets one Save write all remaining drafts.
  await open({ state: 'refused', viewport: 'wide' });
  await click('discard');
  await page.locator('[data-action="scenes"]').click(); await page.locator('[data-scene="depot"]').click();
  await page.locator('[data-select="03"]').click(); await page.locator('select[aria-label="Speaker"]').selectOption('Eli');
  await page.locator('[data-select="04"]').click(); await text('{i}The first tram leaves at six.{/i}');
  await click('save');
  assert.match(await status(), /Saved 4 beat drafts/);
  assert.equal(await saved('depot:03'), "Eli: You missed the last tram, didn't you?");
  assert.equal(await saved('service:05'), 'Mara: Leave now');

  await open({ state: 'refused', viewport: 'compact' });
  await shot(`${variant}-refused-compact`);
  await page.locator('.sdc-editor').scrollIntoViewIfNeeded();
  await shot(`${variant}-refused-compact-editor`);
  console.log(`ok - ${variant}: refusal keeps all drafts, reveals the first failure across scenes, variant display, fix-all then one Save, compact layout`);
}
