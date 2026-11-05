import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from "../../launch-browser.mjs";
import check from './check.mjs';
const output = new URL('../../../../.toolchains/story-revamp/', import.meta.url);
await mkdir(new URL('captures/', output), { recursive: true });
const report = { cases: [], errors: [], interactions: false };
let browser;
try {
  browser = await launchBrowser({ channel: 'chrome', headless: true });
  report.browserVersion = browser.version();
  const page = await browser.newPage(); page.setDefaultTimeout(8000);
  page.on('pageerror', e => report.errors.push(e.message));
  const sizes = { wide: { width: 1600, height: 1000 }, laptop: { width: 1100, height: 720 }, compact: { width: 560, height: 640 } };
  async function open({ variant = 'cue-sheet', state = 'populated', theme = 'dark', viewport = 'wide' } = {}) {
    await page.setViewportSize(sizes[viewport]);
    const url = pathToFileURL(fileURLToPath(new URL(`${variant}.html`, output)));
    url.search = new URLSearchParams({ variant, state, theme }).toString();
    const server = process.env.STORY_LAB_URL;
    const target = server ? `${server}/preview.html?${new URLSearchParams({screen: 'story-revamp', variant, state, theme, viewport: viewport === 'compact' ? 'compact' : 'wide'})}` : url.href;
    await page.goto(target); await page.locator('[data-ready="true"]').waitFor(); return page;
  }
  for (const variant of ['cue-sheet', 'shot-reel', 'stage-tracks']) for (const state of ['populated', 'empty', 'branching', 'protected']) for (const theme of ['dark', 'light']) for (const viewport of ['wide', 'laptop', 'compact']) {
    await open({ variant, state, theme, viewport });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${variant}/${state}/${theme}/${viewport}: horizontal overflow`);
    if (state === 'populated') {
      if (variant !== 'cue-sheet') assert(await page.getByRole('button', { name: 'Next dialogue', exact: true }).evaluate(button => {
        const r = button.getBoundingClientRect(), area = button.closest('.sr-workarea').getBoundingClientRect();
        return r.top >= area.top && r.bottom <= area.bottom && document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') === button;
      }), `Next dialogue must be visible and unobscured at ${viewport}`);

      await page.screenshot({ path: fileURLToPath(new URL(`captures/${variant}-${theme}-${viewport}.png`, output)), fullPage: true });
      if (theme === 'dark' && viewport === 'wide') {
        await page.getByRole('button', { name: 'Writing focus', exact: true }).click();
        await page.screenshot({ path: fileURLToPath(new URL(`captures/${variant}-focused.png`, output)), fullPage: true });
      }
    }
    report.cases.push({ variant, state, theme, viewport });
  }
  await check({ page, open }); report.interactions = true;
  assert.deepEqual(report.errors, []);
} catch (e) { report.errors.push(e.message); throw e; }
finally { await browser?.close(); await writeFile(new URL('report.json', output), JSON.stringify(report, null, 2)); }
console.log(`${report.cases.length} renders; scene creation, writing, focus parity, music, undo, guarded choices and branch insertion passed.`);
