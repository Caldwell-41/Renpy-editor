// Reproducible standalone HTML derived from the same registered Design Lab mount.
import { build } from "vite";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = new URL("../../../../.toolchains/components-and-help-panel/", import.meta.url);
const result = await build({
  configFile: false, root, publicDir: false, logLevel: "warn",
  build: { write: false, minify: false, lib: { entry: fileURLToPath(new URL("./standalone.ts", import.meta.url)), formats: ["iife"], name: "ComponentsAndHelpStudy" } },
});
const assets = Array.isArray(result) ? result.flatMap(item => item.output) : result.output;
const js = assets.filter(item => item.type === "chunk").map(item => item.code).join("\n");
// The offline page uses production palette/typography declarations and the scoped
// study stylesheet. Unrelated production layout rules are not needed in this wrapper.
const palette = ["styles.css", "ui-refresh.css"].map(name => readFileSync(new URL(`../../../src/${name}`, import.meta.url), "utf8").match(/:root[^{}]*\{[^{}]*\}/g)?.join("\n") ?? "").join("\n");
const css = readFileSync(new URL("./style.css", import.meta.url), "utf8");
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Components and Help panel · Draft alternatives</title><style>${palette}\n${css}
html,body{margin:0;padding:0;height:auto;min-height:0;background:transparent;color:var(--foreground,var(--text-primary));font-family:var(--font-sans,var(--font-ui));font-size:12px}#preview{background:transparent;padding:0;border:0}button,input,select,textarea{font:inherit}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px}[hidden]{display:none!important}
.cp-comparison{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding:0;background:transparent}.cp-comparison button,.cp-comparison select{font:11px var(--font-ui);color:var(--text-primary);background:var(--surface-panel);border:1px solid var(--border-strong);border-radius:0;min-height:30px;padding:5px 8px}.cp-comparison button[aria-pressed=true]{border-color:var(--accent-primary);color:var(--accent-primary)}.cp-comparison select{max-width:210px}.cp-comparison select:first-of-type{margin-left:auto}
/* The inline host supplies these theme tokens. Files keep the imported palette. */
:root{--surface-app:var(--background,#20201e);--surface-panel:var(--card,#282825);--surface-raised:var(--secondary,#30302c);--surface-hover:var(--muted,#363631);--text-primary:var(--foreground,#eeece5);--text-secondary:var(--muted-foreground,#c8c5bb);--border-normal:var(--border,#45443e);--border-strong:var(--border,#68655c);--font-ui:var(--font-sans,system-ui);--font-source:var(--font-mono,monospace)}
</style></head><body><div id="preview"></div><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`;
mkdirSync(output, { recursive: true }); writeFileSync(new URL("comparison.html", output), html);
writeFileSync(new URL("empty-images.html", output), html.replace('id="preview"', 'id="preview" data-initial-state="no-images"'));
console.log(fileURLToPath(new URL("comparison.html", output)));
