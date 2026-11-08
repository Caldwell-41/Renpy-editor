import assert from 'node:assert/strict';

export default async function check({ page, open }) {
  // The harness checks one selected layout; run once per reference layout. combined-check.mjs covers the combined mock.
  const variant = new URL(page.url()).searchParams.get('variant');
  assert.ok(['cue-sheet', 'shot-reel', 'stage-tracks'].includes(variant), 'Select a reference layout for this check.');
  await open({ variant, state: 'empty', theme: 'dark', viewport: 'wide' });
  await page.locator('[data-action="scenes"]').click();
  await page.getByRole('button', { name: '+ New scene', exact: true }).click();
  await page.getByRole('textbox', { name: 'Scene name', exact: true }).fill('A light in the distance');
  await page.locator('[data-action="submit-scene"]').click();
  await page.locator('.sr-prose').first().press('/');
  await page.locator('[data-picker-search]').fill('music');
  await page.locator('[data-picker-search]').press('Enter');
  await page.locator('select[aria-label="Music"]:focus').waitFor();
  await page.getByText('Prototype state · memory only', { exact: true }).click();
  const slashState = JSON.parse(await page.locator('.sr-state pre').innerText());
  assert.equal(slashState.scenes.find(s => s.name === 'A light in the distance').beats.length, 2, 'Slash replaces the empty line instead of adding a blank beat');
  await page.locator('[data-action=undo]').click();
  await page.locator('.sr-prose').first().fill('The last tram is running late.');
  await page.locator('[data-action="toggle-focus"]').click();
  assert.equal(await page.locator('.sr-prose').first().inputValue(), 'The last tram is running late.');
  assert.equal(await page.locator('[data-stage]:visible').count(), 0);
  await page.locator('[data-action="add-beat"]').click();
  await page.locator('[data-picker-search]').fill('music');
  await page.locator('[data-insert-kind=playMusic]').click();
  await page.getByRole('combobox', { name: 'Music', exact: true }).selectOption('Last departure');
  await page.locator('[data-action=undo]').click();
  await page.locator('[data-action=undo]').click();
  assert.equal(await page.locator('.sr-prose').first().inputValue(), 'The last tram is running late.');
  await page.locator('[data-action="add-beat"]').click();
  await page.locator('[data-picker-search]').fill('choice');
  await page.locator('[data-insert-kind=choice]').click();
  await page.getByRole('textbox', { name: 'Option 1 text', exact: true }).fill('Follow the light');
  await page.getByRole('textbox', { name: 'Option 1 availability', exact: true }).fill('has_ticket is true');
  await page.locator('[data-action="toggle-focus"]').click();
  assert.equal(await page.getByRole('textbox', { name: 'Option 1 text', exact: true }).inputValue(), 'Follow the light');
  assert.equal(await page.getByRole('textbox', { name: 'Option 1 availability', exact: true }).inputValue(), 'has_ticket is true');
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('ArrowRight');
  await page.locator('[data-modal="switch-layout"]').waitFor();
  await page.locator('[data-action="cancel-layout"]').click();
  assert.equal(await page.locator('[data-ready="true"]').getAttribute('data-variant'), variant);

  await open({ variant, state: 'branching', theme: 'dark', viewport: 'wide' });
  if (variant === 'shot-reel') {
    await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).first().click();
    await page.locator('.sr-reel-target button').filter({ hasText: /^Open Otherwise/ }).click();
    await page.locator('[data-action="add-beat"]').click();
  } else {
    if (variant === 'stage-tracks') { await page.locator('.sr-track-band button').filter({ hasText: /^Otherwise$/ }).first().click(); await page.locator('[data-action="add-beat"]').click(); }
    else await page.getByRole('button', { name: '+ Add beat to Otherwise', exact: true }).first().click();
  }
  assert.match(await page.locator('.sr-insertion-target').innerText(), /Otherwise/);
  await page.locator('[data-picker-search]').fill('narration');
  await page.locator('[data-insert-kind=narration]').click();
  await page.locator('.sr-prose:focus').fill('This belongs only to Otherwise.');
  await page.getByText('Prototype state · memory only', { exact: true }).click();
  const state = JSON.parse(await page.locator('.sr-state pre').innerText());
  const group = state.scenes[0].beats.find(b => b.kind === 'condition');
  assert(group.branches.find(b => b.name === 'Otherwise').beats.some(b => b.text === 'This belongs only to Otherwise.'));
  assert(!group.branches.find(b => b.name === 'If').beats.some(b => b.text === 'This belongs only to Otherwise.'));
  await page.locator('[data-action=undo]').click();
  if (variant === 'shot-reel') assert.match(await page.locator('.sr-reel-target').innerText(), /Otherwise/);
  if (variant === 'stage-tracks') assert.match(await page.locator('.sr-current-body').innerText(), /Otherwise/);
  if (variant === 'cue-sheet') {
    await page.locator('.sr-condition').filter({ has: page.locator('.sr-cue-value').filter({ hasText: 'If trust is at least 5' }) }).last().getByRole('button', {name: /Show 2 branches/}).click();
    assert(await page.locator('.sr-prose').evaluateAll(areas => areas.some(area => area.value === 'There is something I should tell you.')), 'Nested Cue sheet body is editable');
  }
  if (variant === 'shot-reel') {
    await open({ variant, state: 'empty', theme: 'dark', viewport: 'wide' });
    await page.locator('[data-action="add-beat"]').click();
    await page.locator('[data-picker-search]').fill('condition');
    await page.locator('[data-insert-kind=condition]').click();
    assert.equal(await page.locator('.sr-inspector input').first().inputValue(), '', 'New conditions start without a sample test');
    await page.locator('.sr-inspector [data-action^="open-branch-"]').first().click();
    await page.locator('[data-action="add-beat"]').click();
    assert.match(await page.locator('.sr-insertion-target').innerText(), /› If/);
    await page.locator('[data-picker-search]').fill('dialogue');
    await page.locator('[data-insert-kind=dialogue]').click();
    await page.locator('.sr-prose:focus').fill('The first line belongs inside If.');
    assert.match(await page.locator('.sr-reel-target').innerText(), /If/);
    await open({ variant, state: 'branching', theme: 'dark', viewport: 'wide' });
    await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).click();
    await page.locator('.sr-inspector [data-action^="open-branch-"]').first().click();
    await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).click();
    await page.locator('.sr-inspector [data-action^="open-branch-"]').first().click();
    await page.locator('[data-action="scene-path"]').click();
    assert.equal(await page.locator('.sr-reel-beat[data-selected="true"]').count(), 1, 'Returning from a nested branch selects its scene-level ancestor');
  }
}
