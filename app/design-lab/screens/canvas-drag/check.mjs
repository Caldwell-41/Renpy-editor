import assert from 'node:assert/strict';
export default async function check({page,open}) {
  for(const variant of ['handle','border','body']) {
    for(const viewport of ['wide','compact']) {
      await page.setViewportSize(viewport==='wide'?{width:1100,height:720}:{width:560,height:640});
      await open({variant,state:'delayed',theme:'dark',viewport});
      const outline=page.locator('.drag-outline'), content=page.locator('.drag-content');
      const move=page.locator(variant==='handle'?'.drag-handle':variant==='border'?'.edge-top':'.drag-body');
      const before=await outline.getAttribute('style');
      const target=await move.boundingBox();
      await page.mouse.move(target.x+target.width/2,target.y+target.height/2);await page.mouse.down();
      await page.mouse.move(target.x+target.width/2+24,target.y+target.height/2+16);
      assert.notEqual(await outline.getAttribute('style'),before,`${variant}/${viewport}: guide follows held input`);
      assert.equal(await content.evaluate(e=>e.style.left),'320px','Delayed content stays at previous position');
      await page.keyboard.press('Escape');await page.mouse.up();
      assert.equal(await outline.getAttribute('style'),before,'Escape restores original guide');
      assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isEnabled(),false);
      await move.focus();await page.keyboard.press('Shift+ArrowRight');
      assert.equal(await outline.evaluate(e=>e.style.left),'328px');
      await page.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(await outline.evaluate(e=>e.style.left),'320px');
      await page.getByRole('button',{name:'Redo',exact:true}).click();
      assert.equal(await outline.evaluate(e=>e.style.left),'328px');
      await page.getByRole('button',{name:'Reset',exact:true}).click();
      const next=await move.boundingBox();
      await page.mouse.move(next.x+next.width/2,next.y+next.height/2);await page.mouse.down();
      await page.mouse.move(next.x+next.width/2+24,next.y+next.height/2+16);await page.mouse.up();
      assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isEnabled(),true);
      await page.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(await outline.evaluate(e=>e.style.left),'320px');
      assert.equal(await page.getByRole('button',{name:'Undo',exact:true}).isEnabled(),false,'One gesture has one history entry');
      const resize=page.getByRole('button',{name:'Resize frame',exact:true});
      await resize.focus();await page.keyboard.press('ArrowRight');
      assert.equal(await page.getByRole('spinbutton',{name:'Frame width',exact:true}).inputValue(),'641');
      await page.getByRole('spinbutton',{name:'Frame width',exact:true}).fill('700');
      await page.getByRole('button',{name:'Apply size',exact:true}).click();
      assert.equal(await outline.evaluate(e=>e.style.width),'700px');
      await page.getByRole('button',{name:'Reset',exact:true}).click();
      if(variant==='body') await page.locator('.drag-body').dblclick({position:{x:60,y:50}});
      else await page.getByRole('button',{name:'Select Help text',exact:true}).click();
      assert.equal(await outline.isVisible(),false,'Child selection remains available');
      await page.getByRole('button',{name:'Help frame',exact:true}).click();
      assert.equal(await outline.isVisible(),true);
      await page.reload();await page.locator('#preview[data-ready=true]').waitFor();
      assert.equal(await outline.evaluate(e=>e.style.left),'320px','Reload resets the sample');
    }
  }
}
