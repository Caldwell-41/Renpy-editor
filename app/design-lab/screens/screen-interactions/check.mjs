import assert from 'node:assert/strict';
export default async function check({page,open}){
  for(const variant of ['inspector-v2','worksheet-v2','workspace-v2']){
    await open({variant,state:'button',theme:'dark',viewport:'wide'});
    await page.locator('.siv-actions').waitFor();
    assert.equal(await page.locator('.screens-editor').count(),1);
    assert.equal(await page.locator('.screen-flow .screen-stage').count(),1);
    assert.equal(await page.locator('.screen-card .siv-actions').count(),1);
    assert.equal(await page.getByLabel('Add action',{exact:true}).count(),1);
    assert.equal(await page.locator('[data-text-apply]').count(),1);
    assert.equal(await page.locator('.siv-sample-toggle').count(),1);
    await page.getByRole('button',{name:'Move action 2 earlier',exact:true}).click();
    const rows=page.locator('.siv-sequence>li');
    assert.match(await rows.first().innerText(),/Show About/);
    assert.match(await rows.last().innerText(),/Finish interaction/);
    assert(await page.getByRole('button',{name:'Move action 3 earlier',exact:true}).isDisabled());
    await page.locator('[data-text-apply]').click();
    await page.waitForFunction(()=>document.querySelector('.lp-status')?.textContent?.includes('No game actions ran'));
    await page.waitForFunction(()=>document.querySelector('[data-text-apply]')?.disabled);
    assert.match(await rows.first().innerText(),/Show About/);
    await page.getByRole('button',{name:'Undo',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.siv-sequence>li')?.textContent?.includes('Set Help seen'));
    await page.getByRole('button',{name:'Redo',exact:true}).click();
    await page.waitForFunction(()=>document.querySelector('.siv-sequence>li')?.textContent?.includes('Show About'));
    for(let i=3;i<8;i++)await page.getByLabel('Add action',{exact:true}).selectOption('setVariable');
    assert.equal(await rows.count(),8);assert(await page.getByLabel('Add action',{exact:true}).isDisabled());
    await page.locator('[data-text-cancel]').click();await page.locator('.siv-actions').waitFor();assert.equal(await rows.count(),3);

    await open({variant,state:'invalid',theme:'dark',viewport:'wide'});await page.locator('.siv-actions').waitFor();
    await page.locator('[data-text-apply]').click();assert.match(await page.locator('.siv-error[role="alert"]:visible').innerText(),/whole number/);
    assert.equal(await page.getByLabel('Action 1 value',{exact:true}).getAttribute('aria-invalid'),'true');
    assert(await page.getByLabel('Action 1 value',{exact:true}).evaluate(e=>!!document.getElementById(e.getAttribute('aria-describedby'))));
    await page.getByRole('button',{name:'1 Choose',exact:true}).click();
    await page.locator('[data-node-id="body"]').dblclick();await page.locator('.siv-retained').waitFor();
    await page.getByRole('button',{name:'Return to Close',exact:true}).click();await page.locator('.siv-actions').waitFor();
    await rows.first().locator('details').evaluate(d=>d.open=true);
    assert.equal(await page.getByLabel('Action 1 value',{exact:true}).inputValue(),'12 + 1');

    await open({variant,state:'text',theme:'dark',viewport:'wide'});await page.getByRole('button',{name:'Insert variable',exact:true}).waitFor();
    await page.getByLabel('Sample player_name',{exact:true}).fill('{b}[coins]');
    assert(await page.locator('[data-text-apply]').isDisabled());
    const text=page.getByLabel('Text',{exact:true});await text.fill('Before REPLACE after');await text.evaluate(e=>e.setSelectionRange(7,14));
    await page.getByLabel('Existing variable',{exact:true}).selectOption('help_seen');await page.getByRole('button',{name:'Insert variable',exact:true}).click();
    assert.deepEqual(await text.evaluate(e=>({value:e.value,start:e.selectionStart,end:e.selectionEnd,focused:document.activeElement===e})),{value:'Before [help_seen!q] after',start:20,end:20,focused:true});
    assert.equal(await page.locator('.siv-actions').count(),0);
    assert.equal(await page.locator('.screen-text-typography').count(),1);
    assert.equal(await page.locator('.screen-text-layout').count(),1);

    for(const state of ['stale','conflict','missing']){
      await open({variant,state,theme:'dark',viewport:'wide'});await page.locator('.siv-actions').waitFor();
      if(state!=='missing')await page.getByLabel('Add action',{exact:true}).selectOption('setVariable');
      await page.locator('[data-text-apply]').click();assert.match(await page.locator('.siv-error[role="alert"]:visible,.screen-text-error[role="alert"]:visible').innerText(),/retained/);
      assert(!(await page.locator('[data-text-cancel]').isDisabled()));
    }
    for(const state of ['component','custom']){
      await open({variant,state,theme:'dark',viewport:'wide'});await page.locator('.siv-actions').waitFor();assert(await page.getByLabel('Add action',{exact:true}).isDisabled());
    }
    await open({variant,state:'panel',theme:'dark',viewport:'wide'});await page.locator('.siv-actions').waitFor();assert(!(await page.getByLabel('Add action',{exact:true}).locator('option').allTextContents()).includes('Finish interaction'));
  }
}
