import assert from "node:assert/strict";
export default async function check({page, open}) {
  const state = async () => JSON.parse(await page.locator('.ui-state pre').textContent());
  const editor = () => page.getByRole('region', {name:'Text editor'});
  const size = () => page.getByRole('textbox', {name:'Size · px', exact:true});
  const content = () => page.getByRole('textbox', {name:'Text', exact:true});
  const apply = () => page.locator('[data-apply]');
  const cancel = () => page.locator('[data-cancel-draft]');
  for (const variant of ['inspector','library','strip']) {
    console.log('Checking',variant);
    await open({variant,state:'text',theme:'dark'});
    assert.equal((await state()).history,0); assert.equal(await apply().isDisabled(),true);
    await size().fill('32'); await apply().click(); assert.equal((await state()).accepted[1].size,'32'); assert.equal((await state()).history,1);
    await page.getByRole('button',{name:'Undo',exact:true}).click(); assert.equal(await size().inputValue(),'26');
    await page.getByRole('button',{name:'Redo',exact:true}).click(); assert.equal(await size().inputValue(),'32');
    await content().fill('Retained draft');
    await page.getByRole('main').getByRole('button',{name:'Source',exact:true}).click();
    assert.match(await page.getByLabel('Accepted sample source').innerText(),/last tram/);
    await page.getByRole('button',{name:'Back to editing',exact:true}).click(); assert.equal(await content().inputValue(),'Retained draft');
    await page.getByRole('navigation',{name:'Selection path'}).getByRole('button',{name:'Heading'}).click();
    await page.getByRole('navigation',{name:'Selection path'}).getByRole('button',{name:'Body · Draft'}).click(); assert.equal(await content().inputValue(),'Retained draft');
    await cancel().click(); assert.match(await content().inputValue(),/last tram/);
    await size().fill('0'); await apply().click(); assert.equal(await size().inputValue(),'0'); assert.equal((await state()).history,1); assert.match(await editor().getByRole('alert').innerText(),/whole size/); await cancel().click();
    await page.getByLabel('Color',{exact:true}).fill('https://example.invalid/font'); await apply().click(); assert.match(await editor().getByRole('alert').innerText(),/hex color/); await cancel().click();
    await page.getByLabel('Text alignment',{exact:true}).selectOption('0.5'); await page.getByLabel('Bold',{exact:true}).selectOption('True'); await page.getByLabel('Italic',{exact:true}).selectOption('True'); await apply().click();
    await page.getByRole('main').getByRole('button',{name:'Source',exact:true}).click(); const source=await page.getByLabel('Accepted sample source').innerText(); assert.match(source,/text_align 0.5/); assert.match(source,/bold True/); assert.match(source,/italic True/); assert.match(source,/use custom_help_footer\(\)/); await page.getByRole('button',{name:'Back to editing',exact:true}).click();
    if (variant==='library') await page.getByRole('button',{name:'Use Wayfarer Serif',exact:true}).click();
    else { await page.getByRole('button',{name:'Choose project font',exact:true}).click(); await page.getByRole('searchbox',{name:'Find project font'}).fill('wayfarer'); await page.getByRole('button',{name:'Use Wayfarer Serif',exact:true}).click(); assert.equal(await page.getByRole('button',{name:'Choose project font'}).evaluate(e=>e===document.activeElement),true); }
    assert.equal((await state()).drafts[0].font,'wayfarer'); await apply().click();
    await page.locator('.ui-state summary').click(); await page.getByRole('button',{name:'Simulate reopen',exact:true}).click(); assert.equal((await state()).accepted[1].font,'wayfarer'); assert.equal((await state()).history,0);
    await open({variant,state:'expression',theme:'dark'}); assert.equal(await content().getAttribute('readonly'),''); assert.equal(await size().getAttribute('readonly'),'');
    await page.getByLabel('Color',{exact:true}).fill('#abc'); await apply().click(); assert.equal((await state()).accepted[1].font,'gui.text_font'); assert.equal((await state()).accepted[1].text,'_("Choose a route.")');
    for (const sample of ['missing','invalid','conflict']) {
      await open({variant,state:sample,theme:'dark'}); await content().fill('Keep this text'); await apply().click(); assert.equal(await content().inputValue(),'Keep this text'); assert.equal((await state()).history,0); assert.equal((await state()).drafts.length,1); assert.match(await editor().getByRole('alert').innerText(),/kept/);
    }
  }
  await open({variant:'inspector',state:'text',theme:'dark'});
  await content().fill('Keep while choosing'); await page.getByRole('button',{name:'Choose project font'}).click();
  await page.getByRole('searchbox',{name:'Find project font'}).fill('no such font'); assert.match(await page.getByRole('dialog').innerText(),/No matching project fonts/);
  await page.getByRole('button',{name:'Cancel',exact:true}).last().click(); assert.equal(await page.getByRole('button',{name:'Choose project font'}).evaluate(e=>e===document.activeElement),true); assert.equal(await content().inputValue(),'Keep while choosing');
  await page.getByRole('button',{name:'Choose project font'}).click(); await page.keyboard.press('Escape'); assert.equal(await page.getByRole('button',{name:'Choose project font'}).evaluate(e=>e===document.activeElement),true);
  await page.getByRole('button',{name:'Choose project font'}).click(); await page.getByRole('button',{name:'Import…',exact:true}).click(); await page.getByRole('combobox',{name:'Sample file'}).selectOption('invalid'); await page.getByRole('button',{name:'Import and use'}).click(); assert.match(await page.getByRole('dialog').getByRole('alert').innerText(),/not a readable font/); assert.equal((await state()).fonts.length,3);
  await page.getByRole('button',{name:'Cancel import'}).click(); assert.equal(await content().inputValue(),'Keep while choosing');
  await page.getByRole('button',{name:'Choose project font'}).click(); await page.getByRole('button',{name:'Import…',exact:true}).click(); await page.getByRole('combobox',{name:'Sample file'}).selectOption('otf'); await page.getByRole('button',{name:'Import and use'}).click(); assert.equal((await state()).fonts.length,4); assert.equal((await state()).drafts[0].font,'departure-otf'); await cancel().click(); assert.equal((await state()).fonts.length,4); assert.equal((await state()).accepted[1].font,'tram');
  await size().fill('44'); await size().press('Enter'); assert.equal((await state()).accepted[1].size,'44'); assert.equal(await size().evaluate(e=>e===document.activeElement),true);
  await size().fill('48'); await size().press('Escape'); assert.equal(await size().inputValue(),'44'); assert.equal(await size().evaluate(e=>e===document.activeElement),true);
  await page.getByRole('button',{name:'Choose project font'}).click(); const count=await page.getByRole('dialog').getByRole('button').count(); assert(count>3); await page.keyboard.press('Escape');
  console.log('Font interactions passed: formats, draft retention, focus return, expressions, history and reopen.');
}
