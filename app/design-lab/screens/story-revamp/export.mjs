import { build } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const stub = fileURLToPath(new URL('../../native.ts', import.meta.url));
const result = await build({ configFile: false, root, publicDir: false, logLevel: 'warn', plugins: [{ name: 'prototype-native-boundary', enforce: 'pre', resolveId(id) { if (id === '@tauri-apps/api/core') return stub; if (id.startsWith('@tauri-apps/')) throw Error('Native APIs are unavailable in this prototype.'); } }], build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./standalone.ts', import.meta.url)), formats: ['iife'], name: 'StoryRevamp' } } });
const assets = Array.isArray(result) ? result.flatMap(r => r.output) : result.output;
const js = assets.filter(a => a.type === 'chunk').map(a => a.code).join('\n');
const css = assets.filter(a => a.type === 'asset' && a.fileName.endsWith('.css')).map(a => a.source).join('\n');
// The inline viewer grows with content. Contain the imported app's viewport rules
// inside the same 720px product window used by the standalone review files.
const inlineCss = css.replace(/(\d+(?:\.\d+)?)(?:d|s|l)?vh\b/g, (_, value) => `${Number(value) * 7.2}px`)
  .replace(/([^{}]+)\{([^{}]*)\}/g, (rule, selectors, declarations) => {
    if (!selectors.split(',').some(s => /^(html|body|#app)$/.test(s.trim()))) return rule;
    return `${selectors}{${declarations.replace(/(^|;)\s*height:\s*100%\s*;?/g, '$1height:auto;')}}`;
  });
const output = new URL('../../../../.toolchains/story-revamp/', import.meta.url); mkdirSync(output, { recursive: true });
for (const variant of ['cue-sheet', 'shot-reel', 'stage-tracks']) {
  const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Story prototype · ${variant}</title><style>${css}
html,body{margin:0!important;height:auto!important;min-height:0!important;background:transparent!important;font-family:var(--font-ui);color:var(--text-primary)}#comparison{display:flex;align-items:center;flex-wrap:wrap;gap:8px 16px;padding:8px 0;font-size:11px;min-height:38px;box-sizing:border-box}#comparison label{display:flex;gap:7px;align-items:center;min-width:0}#comparison select{font:inherit;padding:4px 6px;min-height:26px;border-radius:0;max-width:160px}#comparison>span{margin-left:auto;color:var(--text-secondary);font-size:10px}#preview{height:calc(100dvh - 42px);background:var(--surface-app);position:relative;overflow:hidden}#preview .sr-shell{height:100%}@media(max-width:700px){#comparison>span{width:100%;margin:0}#preview{height:calc(100dvh - 65px)}#comparison{gap:6px 10px}#comparison select{max-width:140px}}
</style></head><body data-variant="${variant}"><div id="comparison"></div><div id="preview"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
  writeFileSync(new URL(`${variant}.html`, output), html);
  writeFileSync(new URL(`inline-${variant}.html`, output), html.replace(`<style>${css}`, `<style>${inlineCss}`).replaceAll('calc(100dvh - 42px)', '820px').replaceAll('calc(100dvh - 65px)', '820px'));
}
console.log(fileURLToPath(output));
