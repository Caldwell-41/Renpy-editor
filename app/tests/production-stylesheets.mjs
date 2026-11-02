import {readFile} from 'node:fs/promises';

// These browser entries skip native bootstrap code, but must use its real CSS.
export async function productionStylesheetLinks(){
  const bootstrap=await readFile(new URL('../src/bootstrap.ts',import.meta.url),'utf8');
  const names=[...bootstrap.matchAll(/^import\s+["']\.\/([^"']+\.css)["'];?\s*$/gm)].map(match=>match[1]);
  if(!names.length)throw Error('Production bootstrap declares no stylesheets');
  return names.map(name=>`<link rel="stylesheet" href="/src/${name}">`).join('');
}
