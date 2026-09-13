import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const uiRoot = path.resolve("src/ui");

test("shared UI exposes dock, focus, live-region, and media semantics", async () => {
  const html = await readFile(path.join(uiRoot, "index.html"), "utf8");
  assert.match(html, /aria-controls="controls" aria-expanded="true"/);
  assert.match(html, /aria-controls="inspector" aria-expanded="true"/);
  assert.match(html, /aria-controls="bottom-panel" aria-expanded="true"/);
  assert.equal((html.match(/role="separator"/g) ?? []).length, 2);
  assert.equal((html.match(/aria-orientation="vertical"/g) ?? []).length, 2);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="status"/);
  assert.match(html, /Local previews only; files are not uploaded/);
});

test("shared UI has reduced-motion and local object-URL policy", async () => {
  const [html, css] = await Promise.all([
    readFile(path.join(uiRoot, "index.html"), "utf8"),
    readFile(path.join(uiRoot, "style.css"), "utf8"),
  ]);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /data-reduced-motion/);
  assert.match(html, /img-src 'self' data: blob:/);
  assert.match(html, /media-src 'self' blob:/);
  assert.match(html, /connect-src 'none'/);
  assert.doesNotMatch(html, /https?:\/\//);
});

test("graph evidence covers deterministic scale, virtualization, and Monaco coexistence", async () => {
  const [surface, graph, electron, tauri] = await Promise.all([
    readFile(path.join(uiRoot, "main.ts"), "utf8"),
    readFile(path.join(uiRoot, "graph-evidence.ts"), "utf8"),
    readFile(path.resolve("src/electron/main.ts"), "utf8"),
    readFile(path.resolve("src-tauri/src/main.rs"), "utf8"),
  ]);
  assert.match(graph, /\[1_000, 10_000, 50_000\]/);
  assert.match(graph, /new (?:Uint8|Int32|Float32)Array/);
  assert.match(graph, /FILTER_CHUNK = 1_024/);
  assert.match(graph, /viewportCullMs/);
  assert.match(graph, /editorEditDelayMs/);
  assert.match(graph, /stableRelayout/);
  assert.match(graph, /PerformanceObserver/);
  assert.match(surface, /__loomlightRunGraphEvidence/);
  assert.match(electron, /electron-packaged-graph/);
  assert.match(tauri, /tauri-packaged-graph/);
});

test("packaged comparison repeats equivalent startup, memory, and graph measurements", async () => {
  const [runner, inventory, electron, tauri] = await Promise.all([
    readFile(path.resolve("scripts/measure-packaged-candidate.mjs"), "utf8"),
    readFile(path.resolve("scripts/report-static-comparison.mjs"), "utf8"),
    readFile(path.resolve("src/electron/main.ts"), "utf8"),
    readFile(path.resolve("src-tauri/src/main.rs"), "utf8"),
  ]);
  assert.match(runner, /index <= 3/);
  assert.match(runner, /coldStartMs/);
  assert.match(runner, /idleWorkingSetBytes/);
  assert.match(runner, /stressPeakWorkingSetBytes/);
  assert.match(runner, /interaction10kP95Ms/);
  assert.match(runner, /measurementPassed/);
  assert.match(inventory, /licenses/);
  assert.match(inventory, /nonblankLines/);
  assert.match(electron, /electron-packaged-measurement/);
  assert.match(electron, /case50k\?\.totalMs < 15_000/);
  assert.match(tauri, /tauri-packaged-measurement/);
  assert.match(tauri, /measurement_passed/);
  assert.match(tauri, /LOOMLIGHT_SPIKE_MEASUREMENT_PROBE/);
});
