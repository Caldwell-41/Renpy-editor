import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { Window } from 'happy-dom';

const helper = await readFile(new URL('../../src-tauri/src/native_editor_probe.js', import.meta.url), 'utf8');

test('native driver matches a recent title independently of its date without prefix ambiguity', async () => {
  const browser = new Window();
  browser.document.body.innerHTML = '<button class="recent-open">Runtime UI fixture extra<span class="recent-time">Sep 30, 2026</span></button><button class="recent-open">Runtime UI fixture<span class="recent-time">Sep 30, 2026</span></button><button>Source</button>';
  const scope: { __loomlightProbeFindButton?: (label: string) => HTMLElement } = {};
  runInNewContext(helper, { window: scope, document: browser.document, performance, setTimeout });
  assert.equal([...browser.document.querySelectorAll('button')].find(b => b.textContent === 'Runtime UI fixture'), undefined, 'old exact-text selector must reject this dated fixture');
  assert.equal(scope.__loomlightProbeFindButton!('Runtime UI fixture'), browser.document.querySelectorAll('button')[1]);
  assert.equal(scope.__loomlightProbeFindButton!('Source'), browser.document.querySelectorAll('button')[2]);
  assert.equal(scope.__loomlightProbeFindButton!('Runtime UI'), undefined);
  await browser.happyDOM.close();
});

test('native observation retries only busy rejection and retains failures and deadline', async () => {
  const scope: { __loomlightProbeRetryBusy?: <T>(task: () => Promise<T>, timeout?: number) => Promise<T> } = {};
  runInNewContext(helper, { window: scope, document: {}, performance, setTimeout });
  let calls = 0;
  const value = await scope.__loomlightProbeRetryBusy!(async () => {
    if (++calls < 3) throw Object.assign(new Error('busy'), { code: 'RUNTIME_BUSY' });
    return 'retained';
  });
  assert.equal(value, 'retained'); assert.equal(calls, 3);
  calls = 0;
  await assert.rejects(scope.__loomlightProbeRetryBusy!(async () => { calls++; throw Object.assign(new Error('invalid source'), { code: 'INVALID_SOURCE' }); }), /invalid source/);
  assert.equal(calls, 1, 'real errors must not be retried');
  calls = 0;
  await assert.rejects(scope.__loomlightProbeRetryBusy!(async () => { calls++; throw Object.assign(new Error('busy deadline'), { code: 'RUNTIME_BUSY' }); }, 0), /busy deadline/);
  assert.equal(calls, 1, 'deadline must remain rejecting');
});
