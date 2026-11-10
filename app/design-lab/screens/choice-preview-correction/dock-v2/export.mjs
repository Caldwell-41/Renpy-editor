import {pathToFileURL,fileURLToPath} from 'node:url';
import {readFileSync,writeFileSync} from 'node:fs';
const vite=process.env.CHOICE_REVIEW_VITE??fileURLToPath(new URL('../../../../node_modules/vite/dist/node/index.js',import.meta.url));
const {build}=await import(pathToFileURL(vite));
const result=await build({configFile:false,root:fileURLToPath(new URL('./',import.meta.url)),publicDir:false,logLevel:'warn',build:{write:false,minify:false,lib:{entry:fileURLToPath(new URL('./review.ts',import.meta.url)),formats:['iife'],name:'ChoiceDockV2Review'}}});
const assets=Array.isArray(result)?result.flatMap(r=>r.output):result.output;
const js=assets.filter(a=>a.type==='chunk').map(a=>a.code).join('\n');
const css=readFileSync(new URL('./styles.css',import.meta.url),'utf8');
const output=new URL('../../../../../docs/design/choice-preview-correction/review-v2.html',import.meta.url);
const image=size=>'data:image/png;base64,'+readFileSync(new URL(`./captures/v2/dock-v2-duplicate-dark-${size}-top.png`,output)).toString('base64');
const wide=image('1100x720'),narrow=image('720x850');
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:dark}html,body{margin:0;background:transparent;color:var(--foreground);font-family:var(--font-sans,system-ui)}
${css}
.review-controls{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;margin:0 0 8px;font-size:12px}.review-controls label{display:flex;align-items:center;gap:6px}.review-controls select{font:inherit;color:var(--foreground);background:var(--secondary);border:1px solid var(--border);padding:4px;max-width:100%}.story-context{display:block;width:100%;height:auto}.detail-label{font-size:13px;font-weight:600;margin:16px 0 8px}#preview-detail{height:110px;border:1px solid var(--border);overflow:hidden}.cp2-summary{--cp2-bg:#22211f;--cp2-border:#48473e;--cp2-text:#eeece6;--cp2-muted:#c4bfb1;--cp2-unknown:#e4bf7e;--font-ui:var(--font-sans,system-ui)}
</style></head><body>
<div class="review-controls"><label>Story page <select id="review-size"><option value="wide">1100 × 720</option><option value="narrow">720 × 850</option></select></label><span>A v2 · Draft</span></div>
<img class="story-context" id="story-context" alt="Draft A v2 in the current Story page at 1100 by 720." data-wide="${wide}" data-narrow="${narrow}">
<p class="detail-label">Preview detail</p>
<div class="review-controls"><label>Sample <select id="review-sample"><option value="duplicate">Duplicate captions + narration</option><option value="character">Character prompt</option><option value="long">Long prompt + options</option><option value="none">No prompt</option></select></label></div>
<div id="preview-detail"></div>
<script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
writeFileSync(output,html);console.log(fileURLToPath(output));
