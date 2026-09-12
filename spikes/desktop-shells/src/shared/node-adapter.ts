import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs, watch, type FSWatcher } from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import type { FileVersion, MockSdkEvent, MockSdkRequest, MockSdkTerminalReason } from "./contracts.js";
import { validateRelativePath } from "./contracts.js";

const MAX_OUTPUT = 65_536;

export class StaleFileError extends Error {}

export function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

async function containedPath(rootInput: string, relativeInput: string, mustExist: boolean) {
  const relativePath = validateRelativePath(relativeInput);
  const root = await fs.realpath(rootInput).catch(() => { throw new Error("project root is unavailable"); });
  const candidate = path.resolve(root, ...relativePath.split("/"));
  const parent = await fs.realpath(path.dirname(candidate)).catch(() => { throw new Error("file parent is unavailable"); });
  const relativeParent = path.relative(root, parent);
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent)) {
    throw new Error("path escapes project root");
  }
  if (mustExist) {
    const resolved = await fs.realpath(candidate).catch(() => { throw new Error("file is unavailable"); });
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
  const contents = await fs.readFile(safe.target, "utf8").catch(() => { throw new Error("file could not be read"); });
  return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
}

export async function writeTextAtomic(
  root: string,
  relativePath: string,
  expectedSha256: string,
  contents: string,
): Promise<FileVersion> {
  const safe = await containedPath(root, relativePath, false);
  const current = await fs.readFile(safe.target).catch(() => { throw new Error("file could not be read"); });
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
    throw new Error("atomic replacement failed");
  }
  return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
}

export async function watchText(root: string, relativePath: string, changed: () => void): Promise<FSWatcher> {
  const safe = await containedPath(root, relativePath, true);
  try {
    return watch(safe.target, { persistent: false }, () => changed());
  } catch {
    throw new Error("file could not be watched");
  }
}

export class MockSdkRuns {
  readonly #runs = new Map<string, { child: ChildProcess; cancel: () => void }>();

  get activeCount(): number { return this.#runs.size; }

  #redact(text: string): string {
    let clean = text.replace(/(?:[A-Za-z]:\\|\/)(?:[^\s"']+[\\/])*[^\s"']*/gu, "[REDACTED_PATH]");
    const values = Object.values(process.env).filter((value): value is string => typeof value === "string" && value.length >= 8);
    for (const value of values) clean = clean.split(value).join("[REDACTED_ENV]");
    return clean;
  }

  start(request: MockSdkRequest, emit: (event: MockSdkEvent) => void): string {
    const runId = randomUUID();
    const script = fileURLToPath(new URL("../electron/mock-sdk.js", import.meta.url));
    const child = spawn(process.execPath, [script, request.command, ...request.args], {
      shell: false,
      windowsHide: true,
      env: { PATH: process.env.PATH ?? "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let bytes = 0;
    let terminal: MockSdkTerminalReason | undefined;
    const decoders = { stdout: new StringDecoder("utf8"), stderr: new StringDecoder("utf8") };
    const stop = (reason: MockSdkTerminalReason) => {
      if (terminal) return;
      terminal = reason;
      child.kill();
    };
    this.#runs.set(runId, { child, cancel: () => stop("cancelled") });
    const timer = setTimeout(() => stop("timeout"), request.timeoutMs);
    const stream = (channel: "stdout" | "stderr", chunk: Buffer) => {
      if (terminal) return;
      const remaining = MAX_OUTPUT - bytes;
      const accepted = chunk.subarray(0, Math.max(0, remaining));
      bytes += accepted.length;
      const output = this.#redact(decoders[channel].write(accepted));
      if (output) emit({ runId, type: channel, text: output });
      if (chunk.length > remaining || bytes >= MAX_OUTPUT) stop("truncated");
    };
    child.stdout.on("data", (chunk: Buffer) => stream("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => stream("stderr", chunk));
    child.once("error", () => stop("startError"));
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      this.#runs.delete(runId);
      emit({ runId, type: "terminal", reason: terminal ?? "exit", code, signal });
    });
    return runId;
  }

  cancel(runId: string): boolean {
    const run = this.#runs.get(runId);
    if (!run) return false;
    run.cancel();
    return true;
  }
}
