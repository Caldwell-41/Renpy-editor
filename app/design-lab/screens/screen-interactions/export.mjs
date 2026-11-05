import {build} from 'vite';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../../../',import.meta.url));
const stub=fileURLToPath(new URL('../../native.ts',import.meta.url));
const result=await build({configFile:false,root:app,publicDir:false,logLevel:'warn',plugins:[{name:'mock-native-refusal',enforce:'pre',resolveId(id){if(id==='@tauri-apps/api/core')return stub;if(id.startsWith('@tauri-apps/'))throw Error('Native APIs are unavailable in this mock.');}}],build:{write:false,minify:false,lib:{entry:fileURLToPath(new URL('./standalone.ts',import.meta.url)),formats:['iife'],name:'ScreenInteractions'}}});
const outputs=Array.isArray(result)?result.flatMap(r=>r.output):result.output;
const js=outputs.filter(x=>x.type==='chunk').map(x=>x.code).join('\n');
const css=outputs.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>x.source).join('\n');
if(!css.includes('.screen-flow')||!css.includes('.app-shell'))throw Error('Production Screens and shell CSS must be bundled.');
const html=`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Screens · Action editor comparison</title><style>${css}
html,body{margin:0;padding:0;height:100%;background:var(--surface-app);color:var(--text-primary);font-family:var(--font-ui)}#comparison{height:44px;box-sizing:border-box;display:flex;align-items:center;gap:16px;padding:6px 16px;border-bottom:1px solid var(--border-normal);font-size:11px;background:var(--surface-panel)}#comparison label{display:flex;align-items:center;gap:6px;min-width:0}#comparison select{padding:4px 6px;font:inherit;border-radius:0;max-width:220px}#comparison>span{margin-left:auto;font-size:10px}#preview{height:calc(100dvh - 44px)}#preview .app-shell{height:100%}#preview .screens-editor[data-ui-text=true] .screen-card.screen-text{height:calc(100dvh - 294px)}@media(max-width:800px){#preview .screens-editor[data-ui-text=true] .screen-card.screen-text{height:calc(100dvh - 284px)}}@media(max-width:650px){#comparison{gap:8px;padding:6px 8px}#comparison select{max-width:150px}#comparison>span{display:none}#comparison{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)}#comparison select{min-width:0;width:0;flex:1;max-width:none}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style></head><body><div id="comparison"></div><div id="preview"></div><script>${js.replaceAll('</script','<\\/script')}</script></body></html>`;
const output=new URL('../../../../.toolchains/screen-interactions/',import.meta.url);mkdirSync(output,{recursive:true});
for(const name of ['comparison.html','hosted.html']){const temp=new URL(name+'.tmp',output);writeFileSync(temp,html);renameSync(temp,new URL(name,output));}
console.log(fileURLToPath(new URL('hosted.html',output)));
