import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

export default async function check({page,open}) {
  const variant="focused-refined";
  const capture=name=>page.screenshot({path:fileURLToPath(new URL(`../../../../.toolchains/design-lab/pages/nested-layout/a2-${name}.png`,import.meta.url))});
  const button=name=>page.getByRole('button',{name,exact:true});
  const field=name=>page.getByRole('textbox',{name,exact:true});
  const choose=id=>page.locator(`.nr-tree [data-node="${id}"]`);
  const apply=()=>button('Apply changes').click();
  const source=page.getByLabel('Accepted sample source',{exact:true});
  const showSource=()=>page.getByRole('main').getByRole('button',{name:'Source',exact:true}).click();
  await page.setViewportSize({width:1100,height:720});await open({variant,theme:'dark'});
  const applyBounds=await button('Apply changes').boundingBox();assert(applyBounds.y+applyBounds.height<680,'Apply stays visible');
  await apply();assert(await button('Undo').isDisabled(),'No-op has no history');
  await field('Columns').fill('1');await field('Columns').press('Enter');
  assert.match(await page.getByRole('alert').innerText(),/6 children but only 3 cells/);assert.equal(await field('Columns').inputValue(),'1');assert.equal(await field('Columns').getAttribute('aria-invalid'),'true');
  assert(await field('Columns').evaluate(el=>el===document.activeElement));await capture('invalid-grid-dark-wide');
  await field('Columns').press('Escape');assert.equal(await field('Columns').inputValue(),'2');
  await field('Columns').fill('3');await field('Columns').press('Enter');assert(await field('Columns').evaluate(el=>el===document.activeElement));
  await showSource();assert.match(await source.innerText(),/grid 3 3 allow_underfull True/);await button('Close source').click();
  await button('Undo').click();assert.equal(await field('Columns').inputValue(),'2');await button('Redo').click();assert.equal(await field('Columns').inputValue(),'3');
  await button('1  Choose').click();await choose('cell0').dblclick();assert.match(await page.locator('.nr-constraint').innerText(),/Grid controls cell placement/);
  assert(await field('Horizontal position').isEditable()===false);assert(await field('Vertical position').isEditable()===false);
  await field('Text').fill('Draft instruction');await button('Edit grid').click();await button('1  Choose').click();assert.match(await choose('cell0').innerText(),/Draft/);await choose('cell0').dblclick();assert.equal(await field('Text').inputValue(),'Draft instruction');await button('Cancel').click();
  await button('Move later').click();await showSource();assert((await source.innerText()).indexOf('Click or Enter')<(await source.innerText()).indexOf('Advance'));await button('Close source').click();
  await button('1  Choose').click();await choose('window').dblclick();
  await button('Bottom right').click();await apply();await showSource();assert.match(await source.innerText(),/xpos 1\.0/);assert.match(await source.innerText(),/xanchor 1\.0/);await button('Close source').click();
  await page.locator('details[data-group="Padding"] > summary').click();await field('Left padding').fill('32');await field('Left padding').press('Enter');assert.equal(await page.locator('details[data-group="Padding"]').getAttribute('open'),'');
  await button('1  Choose').click();await choose('viewport').dblclick();await field('Height').fill('180');await apply();assert.match(await page.locator('.nr-panel').innerText(),/Scrolling stays in Source/);await capture('viewport-dark-wide');
  await page.getByRole('main').getByRole('button',{name:'Add element',exact:true}).click();await page.getByLabel('Inside parent',{exact:true}).selectOption('window');
  await page.locator('.nr-commit').getByRole('button',{name:'Add element',exact:true}).click();assert.match(await page.getByRole('alert').innerText(),/cannot accept another child/);
  await button('Use vertical group').click();assert.equal(await page.getByRole('alert').isVisible(),false,'Changing to a valid parent clears the old refusal');await page.getByLabel('Element type',{exact:true}).selectOption('hbox');await capture('addition-dark-wide');
  await page.locator('.nr-commit').getByRole('button',{name:'Add element',exact:true}).click();
  await button('Remove element').click();const dialog=page.getByRole('dialog',{name:/Remove Horizontal group/});await dialog.waitFor();assert.equal(await dialog.getByRole('button',{name:'Cancel',exact:true}).evaluate(el=>el===document.activeElement),true);
  const panelBefore=await page.locator('.nr-panel').boundingBox();await page.keyboard.press('Escape');assert.deepEqual(await page.locator('.nr-panel').boundingBox(),panelBefore,'Removal cancellation does not shift geometry');
  await button('Remove element').click();await page.getByRole('dialog').getByRole('button',{name:'Remove',exact:true}).click();assert.equal(await page.locator('.nr-tree [data-node="new1"]').count(),0);await button('Undo removal').click();assert.equal(await page.locator('.nr-tree [data-node="new1"]').getAttribute('aria-selected'),'true');
  await choose('row').click();await button('Remove element').click();assert.match(await page.getByRole('dialog').innerText(),/Advance/);await capture('group-removal-dark-wide');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  await choose('fixed').click();await button('Remove element').click();assert.match(await page.getByRole('alert').innerText(),/protected Source/);assert.equal(await page.getByRole('dialog').count(),0);
  await choose('close').dblclick();await button('3  Connect').click();assert.match(await page.locator('.nr-body').innerText(),/Hide Help/);await capture('connect-dark-wide');
  await button("Test in Ren'Py").click();assert.match(await page.getByRole('dialog').innerText(),/No SDK starts here/);await page.getByRole('dialog').getByRole('button',{name:'Back to editing',exact:true}).click();
  await open({variant,state:'conflict',theme:'dark'});await field('Columns').fill('4');await apply();assert.match(await page.getByRole('alert').innerText(),/Source changed/);assert.equal(await field('Columns').inputValue(),'4');await capture('conflict-dark-wide');
  await open({variant,state:'source-only',theme:'dark'});assert.equal(await field('Height').isEditable(),false);assert.match(await page.locator('.nl-canvas').innerText(),/region needs Source/);await capture('source-only-dark-wide');
  await open({variant,theme:'dark'});await button('1  Choose').click();await choose('window').dblclick();await field('Width').fill('800');await button('Focus preview').click();await button('Back to editing').first().click();assert.equal(await field('Width').inputValue(),'800');await button('Cancel').click();
  for(const resolution of ['1024','1280']){await page.getByLabel('Sample resolution',{exact:true}).selectOption(resolution);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const game=await page.locator('.nl-game').boundingBox(),canvas=await page.locator('.nl-canvas').boundingBox();assert(game.width<=canvas.width+1);assert(game.height<=canvas.height+1);}
  await page.getByLabel('Canvas zoom',{exact:true}).selectOption('1');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Zoom scroll stays inside preview');
  await page.setViewportSize({width:560,height:640});await open({variant,viewport:'compact',theme:'dark'});await field('Columns').fill('3');await apply();assert.equal(await field('Columns').inputValue(),'3');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await capture('editing-dark-compact');
}
