import { build } from 'vite';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const output = new URL('../../../../.toolchains/story-draft-conflict/', import.meta.url);
// macOS review export: shrink copies only; never alter the approved art.
mkdirSync(output, { recursive: true });
const art = new URL('../story-revamp/art/', import.meta.url);
execFileSync('sips', ['-Z', '750', '-s', 'format', 'jpeg', '-s', 'formatOptions', '65', fileURLToPath(new URL('bg-rainy-platform.webp', art)), '--out', fileURLToPath(new URL('platform-review.jpg', output))], { stdio: 'ignore' });
execFileSync('sips', ['-Z', '520', '-s', 'format', 'png', fileURLToPath(new URL('mara-neutral.webp', art)), '--out', fileURLToPath(new URL('mara-review.png', output))], { stdio: 'ignore' });
const result = await build({
  plugins: [{ name: 'small-review-art', enforce: 'pre', resolveId(id) {
    if (id.endsWith('/bg-rainy-platform.webp')) return fileURLToPath(new URL('platform-review.jpg', output));
    if (id.endsWith('/mara-neutral.webp')) return fileURLToPath(new URL('mara-review.png', output));
  } }],
  configFile: false, root: fileURLToPath(new URL('../../../', import.meta.url)), publicDir: false, logLevel: 'warn',
  build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL('./standalone.ts', import.meta.url)), formats: ['iife'], name: 'StoryDraftConflict' } },
});
const assets = Array.isArray(result) ? result.flatMap(r => r.output) : result.output;
const js = assets.filter(a => a.type === 'chunk').map(a => a.code).join('\n');
const css = assets.filter(a => a.type === 'asset' && a.fileName.endsWith('.css')).map(a => a.source).join('\n');
// Import app fonts/controls, but remove page-level sizing from the inline document.
const inlineCss = css.replace(/(\d+(?:\.\d+)?)(?:d|s|l)?vh\b/g, (_, value) => `${Number(value) * 7.2}px`)
  .replace(/height:\s*100%/g, 'height:auto');
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Story draft conflict · unapproved</title><style>${inlineCss}
:root{--font-ui:var(--font-sans,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);--font-source:var(--font-mono,monospace)}
html,body{margin:0!important;padding:0!important;min-width:0!important;min-height:0!important;height:auto!important;background:transparent!important;color:var(--foreground);font-family:var(--font-sans,system-ui)}#preview{width:100%;min-width:0}
/* Restore aspect-bound image sizing after removing document-level percentages. */
.sdc-background{height:100%}.sdc-character>img{height:160%}
</style></head><body><div id="preview"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
mkdirSync(output, { recursive: true });
writeFileSync(new URL('review.html', output), html);
console.log(fileURLToPath(new URL('review.html', output)));
