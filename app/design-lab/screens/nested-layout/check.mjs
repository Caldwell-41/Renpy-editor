import assert from "node:assert/strict";
export default async function check({page,open}){
 for(const variant of ["focused","worksheet","source-led"]){
  await page.setViewportSize({width:1100,height:720});await open({variant,theme:"dark"});
  const source=page.getByLabel("Accepted sample source",{exact:true});
  if(variant!=="source-led")await page.getByRole("main").getByRole("button",{name:"Source",exact:true}).click();
  const columns=page.getByRole("textbox",{name:"Columns",exact:true}), apply=page.getByRole("button",{name:"Apply layout",exact:true});
  await apply.click();assert(await page.getByRole("button",{name:"Undo",exact:true}).isDisabled());
  await columns.fill("1");await apply.click();assert.match(await page.getByRole("alert").innerText(),/capacity must hold/);assert.equal(await columns.inputValue(),"1");
  await page.getByRole("button",{name:"Cancel",exact:true}).click();assert.equal(await columns.inputValue(),"2");
  await columns.fill("3");await columns.press("Enter");assert.match(await source.innerText(),/grid 3 3 allow_underfull True/);
  await page.getByRole("button",{name:"Undo",exact:true}).click();assert.equal(await columns.inputValue(),"2");
  await page.getByRole("button",{name:"Redo",exact:true}).click();assert.equal(await columns.inputValue(),"3");
  await page.getByRole("button",{name:"Select source Advance",exact:true}).click();assert.match(await page.locator('.nl-constraint').innerText(),/Grid controls cell placement/);
  await page.getByRole("button",{name:"Move later",exact:true}).click();assert((await source.innerText()).indexOf('Click or Enter')<(await source.innerText()).indexOf('Advance'));
  await page.getByRole("textbox",{name:"Text",exact:true}).fill("Retained draft");
  await page.getByRole("button",{name:"Select viewport",exact:true}).click();await page.getByRole("button",{name:"Select source Advance",exact:true}).click();assert.equal(await page.getByRole("textbox",{name:"Text",exact:true}).inputValue(),"Retained draft");await page.getByRole("button",{name:"Cancel",exact:true}).click();
  await page.getByRole("button",{name:"Select viewport",exact:true}).click();assert.match(await page.locator('.nl-inspector').innerText(),/Wheel, drag, scrollbars/);
  await page.getByRole("textbox",{name:"Height",exact:true}).fill("180");await apply.click();assert.match(await source.innerText(),/ysize 180/);
  await page.getByRole("button",{name:"Add element",exact:true}).first().click();await page.getByLabel("Inside parent",{exact:true}).selectOption("window");await page.getByRole("button",{name:"Add to sample",exact:true}).click();assert.match(await page.getByRole("alert").innerText(),/cannot accept/);
  await page.getByLabel("Inside parent",{exact:true}).selectOption("stack");await page.getByLabel("Element type",{exact:true}).selectOption("hbox");await page.getByRole("button",{name:"Add to sample",exact:true}).click();assert.match(await source.innerText(),/hbox:/);
  await open({variant,state:"conflict",theme:"dark"});await columns.fill("4");await apply.click();assert.match(await page.getByRole("alert").innerText(),/Source changed/);assert.equal(await columns.inputValue(),"4");
  await open({variant,state:"source-only",theme:"dark"});assert(await page.getByRole("textbox",{name:"Height",exact:true}).getAttribute("readonly")!==null);assert.match(await page.locator('.nl-canvas').innerText(),/cannot represent/);
  await page.setViewportSize({width:560,height:640});await open({variant,viewport:"compact",theme:"dark"});await columns.fill("3");await apply.click();assert.equal(await columns.inputValue(),"3");assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 }
}
