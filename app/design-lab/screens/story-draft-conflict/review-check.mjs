import assert from 'node:assert/strict';
// Focused decision proof only. Run for each of the two registered variants.
export default async function ({ page, open, capture }) {
  const variant = await page.locator('[aria-label="Conflict variant"]').inputValue();
  const click = async action => {
    if (['unrelated','other-draft'].includes(action)) await page.locator('.sdc-more summary').click();
    await page.locator(`[data-action="${action}"]`).click();
  };
  const saved = id => page.locator(`[data-saved="${id}"]`).innerText();
  const draft = id => page.locator(`[data-draft="${id}"]`).innerText();
  const type = text => page.getByRole('textbox', { name: 'Beat text', exact: true }).fill(text);
  await open({state:'start',viewport:'wide'});
  await click('draft'); await click('navigate'); await click('unrelated'); await click('navigate');
  assert.equal(await page.getByRole('textbox',{name:'Beat text',exact:true}).inputValue(),'Stay here');
  assert.equal(await page.locator('.sdc-conflict').count(),0);
  await click('save'); assert.equal(await saved('05'),'Stay here');
  assert.equal(await draft('05'),'None');
  await capture(`${variant}-routine`);

  await click('reset'); await click('draft'); await click('navigate'); await click('other-draft'); await click('external');
  assert.match(await page.locator('.sdc-editor-heading').innerText(),/07/);
  assert.equal(await draft('05'),'Stay here'); assert.equal(await saved('05'),'Leave now');
  assert.equal(await page.locator('.sdc-conflict').count(),0);
  assert.equal(await page.locator('dialog[open]').count(),0);
  await capture(`${variant}-away`);
  await click('save');
  assert.equal(await draft('05'),'Stay here'); assert.equal(await draft('07'),"I'll wait by the door.");
  assert.equal(await saved('07'),'The last tram is still waiting.');
  assert.match(await page.locator('.sdc-editor-heading').innerText(),/05/);
  assert.match(await page.locator('.sdc-message').innerText(),/All drafts remain unsaved/);
  assert.equal(await page.locator('.sdc-saved-line').innerText(),'Leave now');
  assert.match(await page.locator('.sdc-conflict').innerText(),/Conflict with source/);
  await capture(`${variant}-save-conflict`);
  await type(''); await click('override-source');
  assert.equal(await saved('05'),'Leave now'); assert.equal(await draft('05'),'');
  assert.equal(await page.locator('.sdc-conflict').count(),1);
  await type('Wait for me.'); await click('override-source');
  assert.equal(await saved('05'),'Wait for me.'); assert.equal(await draft('05'),'None');
  assert.equal(await draft('07'),"I'll wait by the door.");
  await click('navigate'); await click('save'); assert.equal(await draft('07'),'None');
  assert.equal(await saved('07'),"I'll wait by the door.");
  await capture(`${variant}-resolved`);

  await click('jump'); await click('keep-source');
  assert.equal(await saved('05'),'Leave now'); assert.equal(await draft('05'),'None');
  assert.equal(await draft('07'),"I'll wait by the door.");
  await click('save'); assert.equal(await draft('07'),'None');
  assert.equal(await saved('05'),'Leave now');
  await open({state:'conflict',viewport:'compact'});
  await capture(`${variant}-compact`);
  await click('override-source'); assert.equal(await saved('05'),'Stay here');
  assert.equal(await draft('07'),"I'll wait by the door.");
  console.log(`ok - ${variant}: routine draft navigation, unrelated edit, quiet conflict, all-draft Save refusal, validated Override source, Keep source / Discard draft, continue and compact layout`);
}
