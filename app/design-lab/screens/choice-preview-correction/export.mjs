import {pathToFileURL,fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const vite=process.env.CHOICE_REVIEW_VITE??fileURLToPath(new URL('../../../node_modules/vite/dist/node/index.js',import.meta.url));
const {build}=await import(pathToFileURL(vite));
const result=await build({configFile:false,root:fileURLToPath(new URL('./',import.meta.url)),publicDir:false,logLevel:'warn',build:{write:false,minify:false,lib:{entry:fileURLToPath(new URL('./review.ts',import.meta.url)),formats:['iife'],name:'ChoicePreviewReview'}}});
const assets=Array.isArray(result)?result.flatMap(r=>r.output):result.output;
const js=assets.filter(a=>a.type==='chunk').map(a=>a.code).join('\n');
// The review embeds only the scoped summary CSS, without the full editor shell.
const css=readFileSync(new URL('./draft.css',import.meta.url),'utf8').split('body{margin:0}')[0];
const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{color-scheme:dark}html,body{margin:0;background:transparent;color:var(--foreground);font-family:var(--font-sans,system-ui)}
${css}
.cpc-review-controls{display:flex;gap:12px;align-items:center;font-size:12px;padding:0 0 8px}.cpc-review-controls select{background:var(--secondary);color:var(--foreground);border:1px solid var(--border);font:inherit;padding:4px;max-width:100%}.cpc-review-example{margin:0 0 18px;min-width:0}.cpc-review-example h3{font-size:14px;margin:8px 0 4px;font-weight:600}.cpc-review-example p{font-size:12px;line-height:1.5;margin:0 0 6px;color:var(--muted-foreground)}.cpc-review-frame{height:110px;border:1px solid var(--border);overflow:hidden}.cpc-summary{--cpc-bg:#22211f;--cpc-panel:#292823;--cpc-border:#48473e;--cpc-text:#eeece6;--cpc-muted:#c4bfb1;--cpc-unknown:#e4bf7e;--font-ui:var(--font-sans,system-ui)}
</style></head><body><div id="comparison"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
const output=new URL('../../../../docs/design/choice-preview-correction/review-v1.html',import.meta.url);
mkdirSync(new URL('./',output),{recursive:true});writeFileSync(output,html);console.log(fileURLToPath(output));
