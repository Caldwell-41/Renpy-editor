import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { MockSdkEvent, MockSdkRequest } from "../src/shared/contracts.js";
import { ApprovedProjectRegistry, MockSdkRuns, readText, StaleFileError, watchText, writeTextAtomic } from "../src/shared/node-adapter.js";

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "loomlight-desktop-spike-"));
  await mkdir(path.join(root, "game"));
  await writeFile(path.join(root, "game", "script.rpy"), "label start:\n    return\n", "utf8");
  const registry = new ApprovedProjectRegistry();
  const projectId = await registry.approveFromTrustedBackend(root);
  return { root, registry, projectId };
}

test("reads and atomically replaces a project file with a matching base", async () => {
  const { root, registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  const after = await writeTextAtomic(registry, projectId, before.relativePath, before.sha256, `${before.contents}# safe\n`);
  assert.equal(await readFile(path.join(root, "game", "script.rpy"), "utf8"), after.contents);
  assert.notEqual(after.sha256, before.sha256);
});

test("refuses a stale-base write", async () => {
  const { root, registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  await writeFile(path.join(root, "game", "script.rpy"), "external edit\n", "utf8");
  await assert.rejects(() => writeTextAtomic(registry, projectId, before.relativePath, before.sha256, "overwrite\n"), StaleFileError);
});

test("refuses a symlink that escapes the project root", async (context) => {
  const { root, registry, projectId } = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), "loomlight-outside-"));
  await writeFile(path.join(outside, "private.rpy"), "secret\n", "utf8");
  try {
    await symlink(path.join(outside, "private.rpy"), path.join(root, "game", "linked.rpy"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") context.skip("symlinks unavailable");
    throw error;
  }
  await assert.rejects(() => readText(registry, projectId, "game/linked.rpy"), /symbolic-link|escapes/);
  await assert.rejects(() => watchText(registry, projectId, "game/linked.rpy", () => {}), /symbolic-link|escapes/);
});

test("handles spaces, Unicode, and deep target paths without leaking paths in errors", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "loomlight target ü "));
  const registry = new ApprovedProjectRegistry();
  const projectId = await registry.approveFromTrustedBackend(root);
  const segments = Array.from({ length: 20 }, (_, index) => `deep-${index}`);
  const directory = path.join(root, "game space", "日本語", ...segments);
  await mkdir(directory, { recursive: true });
  const relative = ["game space", "日本語", ...segments, "scene ü.rpy"].join("/");
  await writeFile(path.join(root, ...relative.split("/")), "label start:\n    return\n", "utf8");
  const before = await readText(registry, projectId, relative);
  const after = await writeTextAtomic(registry, projectId, relative, before.sha256, `${before.contents}# updated\n`);
  assert.match(after.contents, /updated/);
  await assert.rejects(() => readText(registry, projectId, "game space/missing.rpy"), (error: Error) => {
    assert.equal(error.message, "file is unavailable");
    assert.equal(error.message.includes(root), false);
    return true;
  });
});

test("reports target watch latency and cleans up the watcher", async () => {
  const { root, registry, projectId } = await fixture();
  const started = performance.now();
  const observations = await new Promise<{ latency: number; events: number }>(async (resolve, reject) => {
    const guard = setTimeout(() => reject(new Error("watch event timed out")), 5_000);
    let first: number | undefined;
    let events = 0;
    const watcher = await watchText(registry, projectId, "game/script.rpy", () => {
      events += 1;
      first ??= performance.now() - started;
      if (events === 1) setTimeout(() => { clearTimeout(guard); watcher.close(); resolve({ latency: first!, events }); }, 100);
    });
    await writeFile(path.join(root, "game", "script.rpy"), "external edit\n", "utf8");
  });
  assert.ok(observations.latency < 5_000);
  assert.ok(observations.events >= 1);
  console.log(JSON.stringify({ evidence: "node-watch", platform: process.platform, latencyMs: Math.round(observations.latency), events: observations.events }));
});

test("does not leave temporary files after stale or successful replacement", async () => {
  const { root, registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  await writeTextAtomic(registry, projectId, before.relativePath, before.sha256, `${before.contents}# safe\n`);
  const entries = await readdir(path.join(root, "game"));
  assert.deepEqual(entries, ["script.rpy"]);
  await rm(root, { recursive: true, force: true });
});

test("denies unknown project identifiers and changed approved-root identity", async () => {
  const { root, registry, projectId } = await fixture();
  await assert.rejects(() => readText(registry, "00000000-0000-4000-8000-000000000000", "game/script.rpy"), /not approved/);
  const displaced = `${root}-displaced`;
  await rename(root, displaced);
  await mkdir(root);
  await assert.rejects(() => readText(registry, projectId, "game/script.rpy"), /identity changed/);
  await rm(root, { recursive: true, force: true });
  await rm(displaced, { recursive: true, force: true });
});

test("detects a deterministic external edit during save and retains recovery", async () => {
  const { root, registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  let release!: () => void;
  let reached!: () => void;
  const atHook = new Promise<void>((resolve) => { reached = resolve; });
  const continueSave = new Promise<void>((resolve) => { release = resolve; });
  const saving = writeTextAtomic(registry, projectId, before.relativePath, before.sha256, "proposed edit\n", {
    afterTemporarySync: async () => { reached(); await continueSave; },
  });
  await atHook;
  await writeFile(path.join(root, "game", "script.rpy"), "external edit\n", "utf8");
  release();
  await assert.rejects(saving, (error: StaleFileError) => {
    assert.match(error.message, /during save/);
    assert.ok(error.recoveryRelativePath);
    return true;
  });
  assert.equal(await readFile(path.join(root, "game", "script.rpy"), "utf8"), "external edit\n");
  const recovery = (await readdir(path.join(root, "game"))).find((entry) => entry.endsWith(".recovery"));
  assert.ok(recovery);
  assert.equal(await readFile(path.join(root, "game", recovery!), "utf8"), "proposed edit\n");
});

test("serializes internal saves and rejects the second stale transaction", async () => {
  const { registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  let release!: () => void;
  let reached!: () => void;
  const atHook = new Promise<void>((resolve) => { reached = resolve; });
  const continueSave = new Promise<void>((resolve) => { release = resolve; });
  const first = writeTextAtomic(registry, projectId, before.relativePath, before.sha256, "first\n", {
    afterTemporarySync: async () => { reached(); await continueSave; },
  });
  await atHook;
  const second = writeTextAtomic(registry, projectId, before.relativePath, before.sha256, "second\n");
  release();
  await first;
  await assert.rejects(second, StaleFileError);
});

test("retains a recovery file when atomic replacement fails", async () => {
  const { root, registry, projectId } = await fixture();
  const before = await readText(registry, projectId, "game/script.rpy");
  await assert.rejects(
    () => writeTextAtomic(registry, projectId, before.relativePath, before.sha256, "recover me\n", {
      replace: async () => { throw new Error("injected replacement failure"); },
    }),
    /recovery retained/,
  );
  const recovery = (await readdir(path.join(root, "game"))).find((entry) => entry.endsWith(".recovery"));
  assert.ok(recovery);
  assert.equal(await readFile(path.join(root, "game", recovery!), "utf8"), "recover me\n");
  assert.equal(await readFile(path.join(root, "game", "script.rpy"), "utf8"), before.contents);
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
  const privatePath = path.resolve("private project with spaces", "game");
  const events = await run({ command: "stderr", args: [privatePath, secret], timeoutMs: 1_000 });
  const output = events.flatMap((event) => event.type === "stderr" ? [event.text] : []).join("");
  assert.match(output, /REDACTED_PATH/);
  assert.equal(output.includes(privatePath), false);
  assert.doesNotMatch(output, /private project with spaces/);
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
