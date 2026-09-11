import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { MockSdkEvent, MockSdkRequest } from "../src/shared/contracts.js";
import { MockSdkRuns, readText, StaleFileError, watchText, writeTextAtomic } from "../src/shared/node-adapter.js";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "loomlight-desktop-spike-"));
  await mkdir(path.join(root, "game"));
  await writeFile(path.join(root, "game", "script.rpy"), "label start:\n    return\n", "utf8");
  return root;
}

test("reads and atomically replaces a project file with a matching base", async () => {
  const root = await fixture();
  const before = await readText(root, "game/script.rpy");
  const after = await writeTextAtomic(root, before.relativePath, before.sha256, `${before.contents}# safe\n`);
  assert.equal(await readFile(path.join(root, "game", "script.rpy"), "utf8"), after.contents);
  assert.notEqual(after.sha256, before.sha256);
});

test("refuses a stale-base write", async () => {
  const root = await fixture();
  const before = await readText(root, "game/script.rpy");
  await writeFile(path.join(root, "game", "script.rpy"), "external edit\n", "utf8");
  await assert.rejects(() => writeTextAtomic(root, before.relativePath, before.sha256, "overwrite\n"), StaleFileError);
});

test("refuses a symlink that escapes the project root", async (context) => {
  const root = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), "loomlight-outside-"));
  await writeFile(path.join(outside, "private.rpy"), "secret\n", "utf8");
  try {
    await symlink(path.join(outside, "private.rpy"), path.join(root, "game", "linked.rpy"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") context.skip("symlinks unavailable");
    throw error;
  }
  await assert.rejects(() => readText(root, "game/linked.rpy"), /escapes/);
  await assert.rejects(() => watchText(root, "game/linked.rpy", () => {}), /escapes/);
});

test("runs only the internal mock SDK executable with direct arguments", async () => {
  const runner = new MockSdkRuns();
  const events: MockSdkEvent[] = [];
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("mock SDK timed out")), 5_000);
    runner.start({ operation: "startMockSdk", command: "diagnostics", args: ["argument with spaces", ";ignored"], timeoutMs: 1_000 }, (event) => {
      events.push(event);
      if (event.type === "terminal") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const output = events.map((event) => (event as { text?: string }).text ?? "").join("");
  assert.match(output, /argument with spaces/);
  assert.match(output, /;ignored/);
  assert.deepEqual(events.find((event) => event.type === "terminal"), { runId: events[0]!.runId, type: "terminal", reason: "exit", code: 0, signal: null });
});

async function run(request: Omit<MockSdkRequest, "operation">, action?: (runner: MockSdkRuns, runId: string) => void) {
  const runner = new MockSdkRuns();
  const events: MockSdkEvent[] = [];
  await new Promise<void>((resolve, reject) => {
    const guard = setTimeout(() => reject(new Error("test runner timed out")), 5_000);
    const runId = runner.start({ operation: "startMockSdk", ...request }, (event) => {
      events.push(event);
      if (event.type === "terminal") { clearTimeout(guard); resolve(); }
    });
    action?.(runner, runId);
  });
  assert.equal(runner.activeCount, 0);
  return events;
}

test("streams stderr and redacts paths and environment values", async () => {
  const secret = process.env.PATH ?? "missing-environment-value";
  const events = await run({ command: "stderr", args: ["/private/project/game", secret], timeoutMs: 1_000 });
  const output = events.flatMap((event) => event.type === "stderr" ? [event.text] : []).join("");
  assert.match(output, /REDACTED_PATH/);
  assert.doesNotMatch(output, /\/private\/project/);
  if (secret.length >= 8) assert.doesNotMatch(output, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("cancels a live child and rejects stale cancellation", async () => {
  const events = await run({ command: "delay", args: [], timeoutMs: 3_000 }, (runner, runId) => {
    assert.equal(runner.cancel(runId), true);
    assert.equal(runner.cancel("stale-run"), false);
  });
  const terminal = events.at(-1);
  assert.equal(terminal?.type === "terminal" ? terminal.reason : undefined, "cancelled");
});

test("times out a live child", async () => {
  const events = await run({ command: "delay", args: [], timeoutMs: 20 });
  const terminal = events.at(-1);
  assert.equal(terminal?.type === "terminal" ? terminal.reason : undefined, "timeout");
});

test("caps combined output and reports truncation", async () => {
  const events = await run({ command: "flood", args: [], timeoutMs: 1_000 });
  const bytes = events.reduce((total, event) => total + (event.type === "stdout" || event.type === "stderr" ? Buffer.byteLength(event.text) : 0), 0);
  assert.ok(bytes <= 65_536);
  const terminal = events.at(-1);
  assert.equal(terminal?.type === "terminal" ? terminal.reason : undefined, "truncated");
});
