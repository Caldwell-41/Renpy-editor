import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
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
  const events: object[] = [];
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("mock SDK timed out")), 5_000);
    runner.start({ operation: "startMockSdk", command: "diagnostics", args: ["argument with spaces", ";ignored"] }, (event) => {
      events.push(event);
      if ((event as { type?: string }).type === "exit") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const output = events.map((event) => (event as { text?: string }).text ?? "").join("");
  assert.match(output, /argument with spaces/);
  assert.match(output, /;ignored/);
  assert.ok(events.some((event) => (event as { type?: string }).type === "exit"));
});
