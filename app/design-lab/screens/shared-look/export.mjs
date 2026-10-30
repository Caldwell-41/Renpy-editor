// Bundle the Design Lab study as one offline HTML file for inline review.
import { build } from "vite";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const output = fileURLToPath(new URL("../../../../.toolchains/l07-shared-look/", import.meta.url));
const result = await build({
  configFile: false, root, publicDir: false, logLevel: "warn",
  build: { write: false, minify: false, lib: { entry: new URL("./standalone.ts", import.meta.url).pathname, formats: ["iife"], name: "SharedLookStudy" } },
});
const assets = Array.isArray(result) ? result.flatMap(item => item.output) : result.output;
const css = assets.filter(item => item.type === "asset" && item.fileName.endsWith(".css")).map(item => String(item.source)).join("\n");
const js = assets.filter(item => item.type === "chunk").map(item => item.code).join("\n");
const html = `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Shared looks · #43 · Draft designs</title><style>${css.replace(/([\d.]+)(?:d|s|l)?vh\b/g, (_match, value) => `${Number(value) * 6.4}px`)}
html,body{height:auto;min-height:0;margin:0;padding:0;background:transparent;overflow:visible;color:var(--foreground,var(--text-primary));font-family:var(--font-sans,system-ui)}
.look-comparison{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}.look-comparison .button{font-size:12px;border-radius:0;padding:7px 10px;background:transparent;color:var(--foreground,var(--text-primary));border:1px solid var(--border,var(--border-normal))}.look-comparison .button[aria-pressed=true]{border-color:var(--accent-primary);color:var(--accent-primary)}.look-comparison .lp-field{margin:0 0 0 auto;display:flex;flex-direction:row;align-items:center;font-size:11px;gap:8px}.look-comparison .lp-label{font-size:11px;font-weight:400;white-space:nowrap}.look-comparison select{font-size:11px;border-radius:0;max-width:170px}.look-comparison-root .app-shell{height:720px;min-height:0;background:var(--background,var(--surface-app))}.look-comparison-root .app-header{min-height:40px}.look-comparison-root .lp-navigation{display:none}.look-comparison-root .lp-project-shell{grid-template-columns:minmax(0,1fr)}.look-comparison-root .app-footer{min-height:26px}.look-comparison-root .lp-sample{display:none}.look-comparison-root .lp-main{padding-bottom:15px}.look-comparison-root .lp-shell .brand{font-size:13px}.look-comparison-root .lp-studio-link{display:none}
</style></head><body><div id="preview"></div><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>`;
mkdirSync(output, { recursive: true }); writeFileSync(path.join(output, "shared-look.html"), html);
console.log(path.join(output, "shared-look.html"));
