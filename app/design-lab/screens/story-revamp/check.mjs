import assert from 'node:assert/strict';

export default async function check({ page, open }) {
  for (const variant of ['cue-sheet', 'shot-reel', 'stage-tracks']) {
    await open({ variant, state: 'empty', theme: 'dark', viewport: 'wide' });
    await page.getByRole('button', { name: 'Scenes', exact: true }).click();
    await page.getByRole('button', { name: '+ New scene', exact: true }).click();
    await page.getByRole('textbox', { name: 'Scene name', exact: true }).fill('A light in the distance');
    await page.getByRole('button', { name: 'Create scene', exact: true }).click();
    await page.locator('.sr-prose').first().press('/');
    await page.getByRole('searchbox', { name: 'Find a beat' }).fill('music');
    await page.getByRole('searchbox', { name: 'Find a beat' }).press('Enter');
    await page.locator('select[aria-label="Music"]:focus').waitFor();
    await page.getByText('Prototype state · memory only', { exact: true }).click();
    const slashState = JSON.parse(await page.locator('.sr-state pre').innerText());
    assert.equal(slashState.scenes.find(s => s.name === 'A light in the distance').beats.length, 2, 'Slash replaces the empty line instead of adding a blank beat');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.locator('.sr-prose').first().fill('The last tram is running late.');
    await page.getByRole('button', { name: 'Writing focus', exact: true }).click();
    assert.equal(await page.locator('.sr-prose').first().inputValue(), 'The last tram is running late.');
    assert.equal(await page.locator('[data-stage]:visible').count(), 0);
    await page.getByRole('button', { name: '+ Add beat', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Find a beat' }).fill('music');
    await page.getByRole('button', { name: 'Play music', exact: true }).click();
    await page.getByRole('combobox', { name: 'Music', exact: true }).selectOption('Last departure');
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    assert.equal(await page.locator('.sr-prose').first().inputValue(), 'The last tram is running late.');
    await page.getByRole('button', { name: '+ Add beat', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Find a beat' }).fill('choice');
    await page.getByRole('button', { name: /^Choice/ }).click();
    await page.getByRole('textbox', { name: 'Choice 1 text', exact: true }).fill('Follow the light');
    await page.getByRole('textbox', { name: 'Choice 1 availability', exact: true }).fill('has_ticket is true');
    await page.getByRole('button', { name: 'Visual mode', exact: true }).click();
    assert.equal(await page.getByRole('textbox', { name: 'Choice 1 text', exact: true }).inputValue(), 'Follow the light');
    assert.equal(await page.getByRole('textbox', { name: 'Choice 1 availability', exact: true }).inputValue(), 'has_ticket is true');
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('ArrowRight');
    await page.getByRole('dialog', { name: 'Switch prototype layout?', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Keep editing', exact: true }).click();
    assert.equal(await page.locator('[data-ready="true"]').getAttribute('data-variant'), variant);

    await open({ variant, state: 'branching', theme: 'dark', viewport: 'wide' });
    if (variant === 'shot-reel') {
      await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).first().click();
      await page.locator('.sr-reel-branches button').filter({ hasText: 'Otherwise' }).click();
      await page.getByRole('button', { name: '+ Add beat', exact: true }).click();
    } else {
      if (variant === 'stage-tracks') await page.locator('.sr-track-band button').filter({ hasText: /^Otherwise$/ }).first().click();
      await page.getByRole('button', { name: '+ Add beat to Otherwise', exact: true }).first().click();
    }
    assert.match(await page.locator('.sr-insertion-target').innerText(), /Otherwise/);
    await page.getByRole('searchbox', { name: 'Find a beat' }).fill('narration');
    await page.getByRole('button', { name: 'Narration', exact: true }).click();
    await page.locator('.sr-prose:focus').fill('This belongs only to Otherwise.');
    await page.getByText('Prototype state · memory only', { exact: true }).click();
    const state = JSON.parse(await page.locator('.sr-state pre').innerText());
    const group = state.scenes[0].beats.find(b => b.kind === 'condition');
    assert(group.branches.find(b => b.name === 'Otherwise').beats.some(b => b.text === 'This belongs only to Otherwise.'));
    assert(!group.branches.find(b => b.name === 'If').beats.some(b => b.text === 'This belongs only to Otherwise.'));
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    if (variant === 'shot-reel') assert.match(await page.locator('.sr-reel-target').innerText(), /Otherwise/);
    if (variant === 'stage-tracks') assert.match(await page.locator('.sr-current-body').innerText(), /Otherwise/);
    if (variant === 'cue-sheet') {
      await page.locator('.sr-cue').filter({ hasText: 'If trust is at least 5' }).click();
      assert(await page.locator('.sr-prose').evaluateAll(areas => areas.some(area => area.value === 'There is something I should tell you.')), 'Nested Cue sheet body is editable');
    }
    if (variant === 'shot-reel') {
      await open({ variant, state: 'empty', theme: 'dark', viewport: 'wide' });
      await page.getByRole('button', { name: '+ Add beat', exact: true }).click();
      await page.getByRole('searchbox', { name: 'Find a beat' }).fill('condition');
      await page.getByRole('button', { name: 'Condition', exact: true }).click();
      await page.getByRole('button', { name: 'Open body', exact: true }).first().click();
      await page.getByRole('button', { name: '+ Add beat', exact: true }).click();
      assert.match(await page.locator('.sr-insertion-target').innerText(), /\/ If has_ticket is true/);
      await page.getByRole('searchbox', { name: 'Find a beat' }).fill('dialogue');
      await page.getByRole('button', { name: 'Dialogue', exact: true }).click();
      await page.locator('.sr-prose:focus').fill('The first line belongs inside If.');
      assert.match(await page.locator('.sr-reel-target').innerText(), /If has_ticket is true/);
      await open({ variant, state: 'branching', theme: 'dark', viewport: 'wide' });
      await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).click();
      await page.getByRole('button', { name: 'Open body', exact: true }).first().click();
      await page.locator('.sr-reel-beat').filter({ hasText: 'Condition' }).click();
      await page.getByRole('button', { name: 'Open body', exact: true }).first().click();
      await page.getByRole('button', { name: '← Scene body', exact: true }).click();
      assert.equal(await page.locator('.sr-reel-beat[data-selected="true"]').count(), 1, 'Returning from a nested branch selects its scene-level ancestor');
    }
  }
}
