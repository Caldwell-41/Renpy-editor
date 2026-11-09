import assert from 'node:assert/strict';
// Public mock interaction boundary approved in #87 and this design assignment.
export default async function ({page,open,capture}) {
  await open({state:'button',viewport:'wide'});
  const formula=page.getByRole('textbox',{name:'Action 1 formula',exact:true});
  await formula.fill('trust +');
  await page.getByRole('button',{name:'Apply action draft',exact:true}).click();
  assert.equal(await formula.inputValue(),'trust +');
  assert.equal(await formula.getAttribute('aria-invalid'),'true');
  assert.equal(await formula.evaluate(e=>e===document.activeElement),true);
  await page.getByRole('button',{name:'Edit reward button',exact:true}).click();
  await page.getByRole('button',{name:'Edit continue button',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Action 1 formula',exact:true}).inputValue(),'trust +');
  await capture('retained-invalid');
  await page.getByRole('textbox',{name:'Action 1 formula',exact:true}).fill('bo');
  await page.locator('[aria-label="Action 1 variable suggestions"]').getByRole('button',{name:'bonus',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Action 1 formula',exact:true}).inputValue(),'bonus');

  await open({state:'button',viewport:'wide'});
  await page.locator('[data-step="1"]').focus();
  await page.keyboard.press('ArrowDown');
  assert.equal(await page.getByRole('textbox',{name:'Action 2 formula',exact:true}).isVisible(),true);
  await page.getByRole('textbox',{name:'Action 2 formula',exact:true}).fill('bonus');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Keep editing',exact:true}).click();
  assert.equal(await page.getByRole('textbox',{name:'Action 2 formula',exact:true}).evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.getByRole('textbox',{name:'Action 2 formula',exact:true}).inputValue(),'bonus');

}
