// Four accepted-source frames through production dispatch. No editing or timing campaign.
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdir, readFile, writeFile, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {driverProcess} from './phase2-driver-process.mjs';
import {buildCanvasDriver} from './canvas-driver.mjs';

const output = resolve(process.env.LOOMLIGHT_CANVAS_EVIDENCE);
const executable = buildCanvasDriver();
await mkdir(output, {recursive: true});
const root = join(tmpdir(), `loomlight-canvas-controller-${randomUUID()}`);
const child = driverProcess(executable, [root], {timeout: 60000});
const records = [];
let passed = false;
const call = async (operation, payload = {}) => {
  const response = await child.request({protocolVersion: 1, requestId: randomUUID(), operation, payload});
  assert.equal(response.ok, true, JSON.stringify(response));
  return response.value;
};
const inputs = async () => Object.fromEntries(await Promise.all(
  ['ui/help.rpy', 'assets/canvas.ttf', 'assets/help.png'].map(async path =>
    [path, createHash('sha256').update(await readFile(join(root, 'synthetic-project/game', path))).digest('hex')])));
try {
  assert.equal((await child.next()).ready, true);
  const before = await inputs();
  const recent = await call('project.listRecent');
  const {sessionId} = await call('project.openRecent', {recentId: recent[0].id});
  const path = 'game/ui/help.rpy';
  const doc = await call('screens.inspect', {sessionId, path});
  await writeFile(join(output, 'inputs.json'), JSON.stringify(before, null, 2));
  await writeFile(join(output, 'reservation.json'), JSON.stringify({sdkProcesses: 1, acceptedSHA256: before['ui/help.rpy']}, null, 2));
  for (const [width, height] of [[1280, 720], [1024, 768]]) {
    for (const buttonState of ['normal', 'hover']) {
      const request = {sessionId, path, screenName: 'loomlight_help', expectedRevision: doc.revision, width, height, buttonState};
      const plan = await call('screens.canvasPlan', request);
      assert.equal(plan.available, true);
      assert.deepEqual(plan.limits, []);
      const started = await call('screens.canvasRender', request);
      const deadline = Date.now() + 30000;
      let frame = started;
      while (frame.phase === 'starting' && Date.now() < deadline) {
        await delay(16);
        frame = await call('screens.canvasStatus', {sessionId, frameId: started.frameId});
      }
      assert.equal(frame.phase, 'ready', JSON.stringify(frame));
      assert.equal(frame.renderer, process.platform === 'win32' ? 'angle2' : 'gl2');
      assert.equal(frame.width, width);
      assert.equal(frame.height, height);
      assert.equal(frame.buttonState, buttonState);
      const filename = `helper-${width}x${height}-${buttonState}.png`;
      await writeFile(join(output, filename), Buffer.from(frame.image.split(',')[1], 'base64'));
      records.push({...frame, image: undefined, filename, plan});
    }
  }
  assert.deepEqual(await inputs(), before);
  assert.equal((await call('screens.inspect', {sessionId, path})).revision, doc.revision);
  passed = true;
} finally {
  try { await child.stop(); }
  finally {
    const fixtureRemoved = await access(root).then(() => false, () => true);
    const driver = child.exitStatus();
    await writeFile(join(output, 'result.json'), JSON.stringify({passed: passed && fixtureRemoved && driver.exitCode === 0,
      records, driver, fixtureRemoved, nativeWebView: false}, null, 2));
    assert.equal(fixtureRemoved, true);
  }
}
