import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";
const server = await createServer({root:fileURLToPath(new URL("..",import.meta.url)),logLevel:"error",server:{host:"127.0.0.1",port:0}});
let browser;
try {
  await server.listen();
  browser=await chromium.launch({channel:"chrome",headless:true});
  const page=await browser.newPage({viewport:{width:1100,height:720},reducedMotion:"reduce"});
  const errors=[]; page.on("pageerror",error=>errors.push(error.message));
  await page.route("**/__runtime",route=>route.fulfill({contentType:"text/html",body:'<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/src/styles.css"><main class="app-shell"><header class="app-header"><span>Loomlight · Saved</span></header><section style="min-width:0;padding:24px">Story workspace</section></main>'}));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__runtime`);
  await page.evaluate(async()=>{
    const {RuntimeWorkspace}=await import("/src/runtime-ui.ts");
    const runtime=new RuntimeWorkspace({sessionId:"session",sdkVersion:"8.5.3",current:()=>true,capture:()=>({sceneRoot:document.body,current:()=>true}),coordinate:task=>task(),navigate:async()=>{},refreshPersistence:()=>{},request:async operation=>{
      if(operation==="sdk.discover")return[{id:"sdk",version:"8.5.3",compatible:true,displayName:"SDK"}];
      if(operation==="source.list")return{dirtyCount:0,files:[]};
      if(operation==="runtime.prepare")return{preparationId:"p",savedRevision:"abc".repeat(20),trustId:null,projectPath:"synthetic-project",sdkPath:"verified-sdk",sdkVersion:"8.5.3",sdkRevision:"123".repeat(20),inputs:["game/雪 diagnostic.rpy"],trustNotice:"Compile, lint and play execute project Python. Session consent is not a sandbox."};
      if(operation==="runtime.grantTrust")return{trustId:"trust"};
      if(operation==="runtime.start"||operation==="runtime.status")return{operationId:"op",phase:"failed",exitCode:1,output:"",nextSequence:0,outputTruncated:true,earlierRevision:false,cleanupComplete:true,launchRevision:"abc".repeat(20),revisionStale:true};
      if(operation==="runtime.diagnostics")return{diagnostics:[{id:0,origin:"compile",severity:"error",message:'File "game/雪 diagnostic.rpy", line 2: expected statement.\n    invalid statement\n    ^',path:"game/雪 diagnostic.rpy",line:2,column:null,sourceRevision:"abc",operationId:"op",sessionId:"session",freshness:"unverified"}]};
      return{};
    }});
    document.querySelector("header").append(runtime.toolbar);document.querySelector("main").append(runtime.panel);window.__runtime=runtime;
  });
  await page.getByRole("button",{name:"Validate",exact:true}).click();
  await page.getByRole("dialog",{name:"Allow project execution?"}).waitFor();
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),"Cancel");
  await page.keyboard.press("Tab");
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),"Trust for this session and continue");
  await page.getByRole("button",{name:"Trust for this session and continue"}).click();
  await page.getByRole("button",{name:"Open game/雪 diagnostic.rpy:2",exact:true}).waitFor();
  for(const width of [1100,640]){
    await page.setViewportSize({width,height:720});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    if(process.env.LOOMLIGHT_RUNTIME_SCREENSHOT_DIR)await page.screenshot({path:`${process.env.LOOMLIGHT_RUNTIME_SCREENSHOT_DIR}/runtime-${width}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({layer:`${process.platform} Chrome; rendered runtime, injected requester, synthetic keyboard`,widths:[1100,640],focus:"pass",overflow:"none",pageErrors:errors}));
}finally{await browser?.close();await server.close();}
