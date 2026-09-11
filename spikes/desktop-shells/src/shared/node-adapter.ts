import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs, watch, type FSWatcher } from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import type { FileVersion, MockSdkRequest } from "./contracts.js";
import { validateRelativePath } from "./contracts.js";

const MAX_OUTPUT = 65_536;

export class StaleFileError extends Error {}

export function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

async function containedPath(rootInput: string, relativeInput: string, mustExist: boolean) {
  const relativePath = validateRelativePath(relativeInput);
  const root = await fs.realpath(rootInput);
  const candidate = path.resolve(root, ...relativePath.split("/"));
  const parent = await fs.realpath(path.dirname(candidate));
  const relativeParent = path.relative(root, parent);
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent)) {
    throw new Error("path escapes project root");
  }
  if (mustExist) {
    const resolved = await fs.realpath(candidate);
    const relativeResolved = path.relative(root, resolved);
    if (relativeResolved.startsWith("..") || path.isAbsolute(relativeResolved)) {
      throw new Error("path escapes project root");
    }
    return { root, target: resolved, relativePath };
  }
  try {
    const stat = await fs.lstat(candidate);
    if (stat.isSymbolicLink()) throw new Error("symbolic-link targets are denied");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return { root, target: candidate, relativePath };
}

export async function readText(root: string, relativePath: string): Promise<FileVersion> {
  const safe = await containedPath(root, relativePath, true);
  const contents = await fs.readFile(safe.target, "utf8");
  return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
}

export async function writeTextAtomic(
  root: string,
  relativePath: string,
  expectedSha256: string,
  contents: string,
): Promise<FileVersion> {
  const safe = await containedPath(root, relativePath, false);
  const current = await fs.readFile(safe.target);
  if (sha256(current) !== expectedSha256) {
    throw new StaleFileError("source changed since it was read");
  }
  const temporary = path.join(path.dirname(safe.target), `.${path.basename(safe.target)}.${randomUUID()}.tmp`);
  const handle = await fs.open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await fs.rename(temporary, safe.target);
  } catch (error) {
    await fs.rm(temporary, { force: true });
    throw error;
  }
  return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
}

export async function watchText(root: string, relativePath: string, changed: () => void): Promise<FSWatcher> {
  const safe = await containedPath(root, relativePath, true);
  return watch(safe.target, { persistent: false }, () => changed());
}

export class MockSdkRuns {
  readonly #runs = new Map<string, ChildProcess>();

  start(request: MockSdkRequest, emit: (event: object) => void): string {
    const runId = randomUUID();
    const script = fileURLToPath(new URL("../electron/mock-sdk.js", import.meta.url));
    const child = spawn(process.execPath, [script, request.command, ...request.args], {
      shell: false,
      windowsHide: true,
      env: { PATH: process.env.PATH ?? "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    this.#runs.set(runId, child);
    let bytes = 0;
    const stream = (channel: "stdout" | "stderr", chunk: Buffer) => {
      if (bytes >= MAX_OUTPUT) return;
      const text = chunk.subarray(0, MAX_OUTPUT - bytes).toString("utf8");
      bytes += Buffer.byteLength(text);
      emit({ runId, type: channel, text });
      if (bytes >= MAX_OUTPUT) child.kill();
    };
    child.stdout.on("data", (chunk: Buffer) => stream("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => stream("stderr", chunk));
    child.on("close", (code, signal) => {
      this.#runs.delete(runId);
      emit({ runId, type: "exit", code, signal, truncated: bytes >= MAX_OUTPUT });
    });
    return runId;
  }

  cancel(runId: string): boolean {
    return this.#runs.get(runId)?.kill() ?? false;
  }
}
