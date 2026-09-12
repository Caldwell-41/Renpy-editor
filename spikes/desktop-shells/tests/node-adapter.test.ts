import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
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

test("handles spaces, Unicode, and deep target paths without leaking paths in errors", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "loomlight target ü "));
  const segments = Array.from({ length: 20 }, (_, index) => `deep-${index}`);
  const directory = path.join(root, "game space", "日本語", ...segments);
  await mkdir(directory, { recursive: true });
  const relative = ["game space", "日本語", ...segments, "scene ü.rpy"].join("/");
  await writeFile(path.join(root, ...relative.split("/")), "label start:\n    return\n", "utf8");
  const before = await readText(root, relative);
  const after = await writeTextAtomic(root, relative, before.sha256, `${before.contents}# updated\n`);
  assert.match(after.contents, /updated/);
  await assert.rejects(() => readText(root, "game space/missing.rpy"), (error: Error) => {
    assert.equal(error.message, "file is unavailable");
    assert.equal(error.message.includes(root), false);
    return true;
  });
});

test("reports target watch latency and cleans up the watcher", async () => {
  const root = await fixture();
  const started = performance.now();
  let events = 0;
  const latency = await new Promise<number>(async (resolve, reject) => {
    const guard = setTimeout(() => reject(new Error("watch event timed out")), 5_000);
    const watcher = await watchText(root, "game/script.rpy", () => {
      events += 1;
      clearTimeout(guard);
      watcher.close();
      resolve(performance.now() - started);
    });
    await writeFile(path.join(root, "game", "script.rpy"), "external edit\n", "utf8");
  });
  assert.ok(latency < 5_000);
  assert.ok(events >= 1);
  console.log(JSON.stringify({ evidence: "node-watch", platform: process.platform, latencyMs: Math.round(latency), events }));
});

test("does not leave temporary files after stale or successful replacement", async () => {
  const root = await fixture();
  const before = await readText(root, "game/script.rpy");
  await writeTextAtomic(root, before.relativePath, before.sha256, `${before.contents}# safe\n`);
  const entries = await import("node:fs/promises").then(({ readdir }) => readdir(path.join(root, "game")));
  assert.deepEqual(entries, ["script.rpy"]);
  await rm(root, { recursive: true, force: true });
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
