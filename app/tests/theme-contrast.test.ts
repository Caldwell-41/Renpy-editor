import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type Theme = "dark" | "light";
const styles = readFileSync("src/styles.css", "utf8");
const refresh = readFileSync("src/ui-refresh.css", "utf8");
const ui = readFileSync("../docs/UI.md", "utf8");

function block(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(selector);
  assert.notEqual(start, -1, selector);
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  return new Map([...body.matchAll(/(--[a-z-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map(match => [match[1]!, match[2]!]));
}
const tokens: Record<Theme, Map<string, string>> = {
  dark: block(styles, ':root, :root[data-theme="dark"]'),
  light: block(styles, ':root[data-theme="light"] {'),
};
const syntax: Record<Theme, Map<string, string>> = {
  dark: block(refresh, ":root{--syntax-keyword"),
  light: block(refresh, ':root[data-theme="light"]{--syntax-keyword'),
};
const token = (theme: Theme, name: string) => {
  const value = tokens[theme].get(name) ?? syntax[theme].get(name);
  assert.ok(value, `${theme} ${name}`);
  return value;
};

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high! + 0.05) / (low! + 0.05);
}

test("Brass and slate tokens match the palette table in UI.md", () => {
  const section = ui.slice(ui.indexOf("### Palette: Brass and slate"));
  const rows = [...section.matchAll(/^\| `(--[a-z-]+)` \| `(#[0-9a-f]{6})` \| `(#[0-9a-f]{6})` \|$/gm)];
  assert.ok(rows.length >= 15, "palette table rows");
  for (const [, name, dark, light] of rows) {
    assert.equal(token("dark", name!), dark, `dark ${name}`);
    assert.equal(token("light", name!), light, `light ${name}`);
  }
  const arms = section.match(/^\| Branch arm 1 to 4 \| ((?:`#[0-9a-f]{6}` ?){4}) \| ((?:`#[0-9a-f]{6}` ?){4}) \|$/m);
  assert.ok(arms, "arm row");
  const names = ["one", "two", "three", "four"];
  for (const [theme, cell] of [["dark", arms[1]!], ["light", arms[2]!]] as const) {
    assert.deepEqual(names.map(n => token(theme, `--choice-arm-${n}`)), cell.match(/#[0-9a-f]{6}/g));
  }
});

test("only styles.css defines the colour tokens", () => {
  for (const name of ["--surface-app", "--accent-primary", "--status-error", "--focus-ring"]) {
    assert.ok(!refresh.includes(`${name}:`), `ui-refresh.css redefines ${name}`);
  }
});

// Normal text needs 4.5:1 on every surface a row can take, including hover, selected and the active Source line.
const surfaces = ["--surface-app", "--surface-panel", "--surface-raised", "--surface-hover", "--surface-selected", "--accent-subtle"];
const readable = [
  "--text-primary", "--text-secondary", "--text-muted", "--accent-primary", "--accent-hover",
  "--status-success", "--status-warning", "--status-error", "--status-info", "--status-partial",
  "--syntax-keyword", "--syntax-string", "--syntax-comment", "--syntax-number",
];
for (const theme of ["dark", "light"] as const) {
  test(`${theme} text and status colours stay readable on every surface`, () => {
    const failures: string[] = [];
    for (const name of readable) for (const surface of surfaces) {
      const ratio = contrast(token(theme, name), token(theme, surface));
      if (ratio < 4.5) failures.push(`${name} on ${surface} ${ratio.toFixed(2)}`);
    }
    assert.deepEqual(failures, []);
  });
  test(`${theme} accent button text and focus ring are legible`, () => {
    for (const accent of ["--accent-primary", "--accent-hover"]) {
      assert.ok(contrast(token(theme, "--on-accent"), token(theme, accent)) >= 4.5, accent);
    }
    for (const surface of surfaces) assert.ok(contrast(token(theme, "--focus-ring"), token(theme, surface)) >= 3, surface);
  });
}
