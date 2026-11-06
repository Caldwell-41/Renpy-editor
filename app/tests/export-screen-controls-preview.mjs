import {build} from 'vite';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const dataPath=process.argv[2];if(!dataPath)throw Error('Pass the actual UI/core preview-data.json receipt');
const data=JSON.parse(await readFile(dataPath,'utf8'));
const result=await build({configFile:false,root:process.cwd(),publicDir:false,logLevel:'warn',plugins:[{name:'offline-native',enforce:'pre',resolveId(id){if(id==='@tauri-apps/api/core')return resolve('design-lab/native.ts');if(id.startsWith('@tauri-apps/'))throw Error('Native APIs are unavailable in this comparison');}}],build:{write:false,minify:true,target:'esnext',lib:{entry:resolve('tests/screen-controls-preview.ts'),formats:['es'],name:'ProductionControls'}}});
const outputs=(Array.isArray(result)?result:[result]).flatMap(r=>r.output),js=outputs.filter(x=>x.type==='chunk').map(x=>x.code).join('\n'),css=outputs.filter(x=>x.type==='asset'&&x.fileName.endsWith('.css')).map(x=>x.source).join('\n').replace(/([\d.]+)(?:d|s|l)?vh\b/g,(_,n)=>`${Number(n)*8.2}px`);
const output=resolve('../.toolchains/51-52-ui/visual');await mkdir(output,{recursive:true});
for(const state of ['button','bar','invalid-size']){
  const html=`<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><style>${css}\nhtml,body{margin:0;padding:0;background:transparent;color:var(--text-primary);font-family:var(--font-ui)}#preview,#preview>.app-shell{height:820px}*{animation:none!important;transition:none!important}.control-production-comparison .lp-content{overflow:auto}.control-production-comparison .sce-body{max-height:540px}</style></head><body><div id="preview"></div><script>window.controlComparison=${JSON.stringify({data,state}).replaceAll('<','\\u003c')}</script><script type="module">${js.replaceAll('</script','<\\/script')}</script></body></html>`;
  await writeFile(resolve(output,`${state}.html`),html);
}
console.log(output);
