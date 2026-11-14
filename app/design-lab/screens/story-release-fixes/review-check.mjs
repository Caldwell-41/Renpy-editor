import assert from 'node:assert/strict';
// Focused proof and review captures for the release fixes study. Run once per variant, and once with --theme light.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Fix variant"]').inputValue();
  const theme = await page.evaluate(() => document.documentElement.dataset.theme || 'dark');
  const shell = () => page.locator('.srf-shell').innerText();
  const shot = async name => { await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0)); await capture(`${variant}-${name}-${theme}`); };
  const states = ['diagnostics', 'set-variable', 'protected', 'move-protected', 'delete-scene', 'transition', 'transition-add', 'moved-draft', 'screen-beat', 'screen-beat-changed', 'tracks-summary'];
  const viewports = theme === 'dark' ? ['wide', 'compact'] : ['wide'];

  for (const viewport of viewports) {
    for (const state of states) {
      await open({ state, viewport, theme });
      const text = await shell();
      // House copy rules: no em dashes and no curly quotes in anything the mock shows.
      assert.doesNotMatch(text, /[—“”‘’]/, `${state}: em dash or curly quote`);
      if (state === 'diagnostics') {
        assert.doesNotMatch(text, /uses Python the builder cannot show/);
        assert.match(text, /ticket_count is not a project variable/);
        assert.match(text, /destination is text/);
      }
      if (state === 'set-variable') assert.match(await page.locator('.srf-list').innerText(), /No variables yet\.[\s\S]*\+ New variable…/);
      if (state === 'move-protected') {
        const tree = await page.locator('.sce-tree2').innerText();
        assert.match(tree, /Before 09 Custom Code/);
        assert.equal(await page.locator('.sce-tree2 [aria-selected=true]').count(), 0, 'Move to preselects nothing');
      }
      if (state === 'delete-scene') {
        await page.getByRole('button', { name: 'Delete scene', exact: true }).click();
        const refusal = await shell();
        assert.match(refusal, /Can't delete "Platform 4"\.\s+2 beats go to it/);
        assert.match(refusal, /Nothing was deleted\./);
        assert.doesNotMatch(refusal, /Input retained|moved safely/);
      }
      if (state === 'transition' || state === 'transition-add') assert.doesNotMatch(text, /next visual change/);
      if (state === 'transition-add') assert.match(await page.locator('.sce-picker-details').innerText(), /Animates the stage changes above it/);
      if (state === 'moved-draft') { assert.match(text, /This beat moved to Otherwise in source\./); assert.doesNotMatch(text, /no longer in source/); }
      if (state === 'screen-beat') { assert.doesNotMatch(text, /Insert in|Insert before/); assert.match(text, /Goes at\s+Before 06 Narration/); }
      if (state === 'tracks-summary' && viewport === 'wide') assert.match(text, /Eli · Concerned/);
      await shot(`${state}-${viewport}`);
      if (state === 'diagnostics') {
        // The Else if tests sit below the fold: a second capture shows them.
        await page.locator('.srf-branch[data-branch=missing]').evaluate(n => n.scrollIntoView({ block: 'start' }));
        await shot(`${state}-branches-${viewport}`);
      }
    }
  }
  if (theme !== 'dark') { console.log(`ok - ${variant}: ${states.length} states, light, wide`); return; }

  // B9: + New variable… creates and selects the variable.
  await open({ state: 'set-variable', viewport: 'wide' });
  await page.getByRole('option', { name: '+ New variable…' }).click();
  await page.getByLabel('Variable name').fill('tickets_left');
  await page.getByRole('button', { name: 'Create variable' }).click();
  assert.match(await page.locator('.sdc-editor').innerText(), /tickets_left/);
  assert.match(await page.locator('.scs-footer').innerText(), /Created tickets_left\. Undo removes it\./);

  // D2/B5: creating the missing variable clears that problem and leaves one.
  await open({ state: 'diagnostics', viewport: 'wide' });
  if (variant === 'a') await page.getByRole('button', { name: 'Create ticket_count…' }).click();
  else { await page.getByRole('button', { name: /Else if ticket_count = 2 variable/ }).click(); await page.getByRole('option', { name: '+ New variable…' }).click(); }
  assert.equal(await page.getByLabel('Variable name').inputValue(), 'ticket_count');
  await page.getByRole('button', { name: 'Create variable' }).click();
  assert.doesNotMatch(await page.locator('.sdc-editor').innerText(), /ticket_count is not a project variable/);
  assert.match(await page.locator('.sdc-editor').innerText(), /destination is text/);

  // B8: + before the region opens Add a beat at Before 09 Custom Code; Move to takes a position there.
  await open({ state: 'protected', viewport: 'wide' });
  await page.locator(variant === 'a' ? '.srf-plus[data-after="08"]' : '.srf-slot').click();
  assert.match(await page.locator('.sce-picker-details').innerText(), /Goes at\s+Before 09 Custom Code[\s\S]*After\s+08 Mara's line/);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Actions for 10/ }).click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Move', exact: true }).click();
  assert.match(await page.locator('.scs-footer').innerText(), /Moved 10 Eli's line to Before 09 Custom Code\./);

  // B13: a changed place asks for a choice before Add Beat works.
  await open({ state: 'screen-beat-changed', viewport: 'wide' });
  await page.getByRole('button', { name: 'Add Beat', exact: true }).click();
  assert.match(await page.locator('.scs-footer').innerText(), /Choose a place for this beat first\./);
  await page.getByRole('button', { name: 'Choose a place…' }).click();
  await page.locator('[data-place="Before 06 Narration"]').click();
  await page.getByRole('button', { name: 'Choose', exact: true }).click();
  assert.match(await page.locator('.sdc-editor').innerText(), /Goes at\s+Before 06 Narration[\s\S]*After\s+05 Mara's line/);
  console.log(`ok - ${variant}: ${states.length} states at wide and compact, B9, D2, B8 and B13 interactions`);
}
