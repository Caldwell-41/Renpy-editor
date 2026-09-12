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
