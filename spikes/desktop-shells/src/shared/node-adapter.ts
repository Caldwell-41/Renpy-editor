import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs, watch, type BigIntStats, type FSWatcher } from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { StringDecoder } from "node:string_decoder";
import { fileURLToPath } from "node:url";
import type { FileVersion, MockSdkEvent, MockSdkRequest, MockSdkTerminalReason } from "./contracts.js";
import { validateRelativePath } from "./contracts.js";

const MAX_OUTPUT = 65_536;

export class StaleFileError extends Error {
  constructor(message: string, readonly recoveryRelativePath?: string) { super(message); }
}

export interface SaveHooks {
  afterTemporarySync?(): Promise<void> | void;
  replace?(temporary: string, target: string): Promise<void>;
}

interface ApprovedProject { root: string; identity: string }

function identity(stat: BigIntStats): string {
  return `${stat.dev}:${stat.ino}:${stat.mode}`;
}

export class ApprovedProjectRegistry {
  readonly #projects = new Map<string, ApprovedProject>();
  readonly #saveTails = new Map<string, Promise<void>>();

  async approveFromTrustedBackend(rootInput: string): Promise<string> {
    const root = await fs.realpath(rootInput).catch(() => { throw new Error("project root is unavailable"); });
    const stat = await fs.stat(root, { bigint: true });
    if (!stat.isDirectory()) throw new Error("project root is unavailable");
    const projectId = randomUUID();
    this.#projects.set(projectId, { root, identity: identity(stat) });
    return projectId;
  }

  async resolve(projectId: string): Promise<string> {
    const project = this.#projects.get(projectId);
    if (!project) throw new Error("project is not approved");
    const canonical = await fs.realpath(project.root).catch(() => { throw new Error("approved project is unavailable"); });
    const stat = await fs.stat(canonical, { bigint: true });
    if (canonical !== project.root || identity(stat) !== project.identity) {
      throw new Error("approved project identity changed");
    }
    return project.root;
  }

  async withSaveLock<T>(projectId: string, relativePath: string, action: () => Promise<T>): Promise<T> {
    const key = `${projectId}\0${relativePath}`;
    const previous = this.#saveTails.get(key) ?? Promise.resolve();
    let release!: () => void;
    const own = new Promise<void>((resolve) => { release = resolve; });
    const tail = previous.then(() => own);
    this.#saveTails.set(key, tail);
    await previous;
    try { return await action(); }
    finally {
      release();
      if (this.#saveTails.get(key) === tail) this.#saveTails.delete(key);
    }
  }
}

export function sha256(contents: string | Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

async function containedPath(registry: ApprovedProjectRegistry, projectId: string, relativeInput: string, mustExist: boolean) {
  const relativePath = validateRelativePath(relativeInput);
  const root = await registry.resolve(projectId);
  const candidate = path.resolve(root, ...relativePath.split("/"));
  const parent = await fs.realpath(path.dirname(candidate)).catch(() => { throw new Error("file parent is unavailable"); });
  const relativeParent = path.relative(root, parent);
  if (relativeParent.startsWith("..") || path.isAbsolute(relativeParent)) {
    throw new Error("path escapes project root");
  }
  if (mustExist) {
    const metadata = await fs.lstat(candidate).catch(() => { throw new Error("file is unavailable"); });
    if (metadata.isSymbolicLink()) throw new Error("symbolic-link targets are denied");
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

export async function readText(registry: ApprovedProjectRegistry, projectId: string, relativePath: string): Promise<FileVersion> {
  const safe = await containedPath(registry, projectId, relativePath, true);
  const contents = await fs.readFile(safe.target, "utf8").catch(() => { throw new Error("file could not be read"); });
  return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
}

export async function writeTextAtomic(
  registry: ApprovedProjectRegistry,
  projectId: string,
  relativePath: string,
  expectedSha256: string,
  contents: string,
  hooks: SaveHooks = {},
): Promise<FileVersion> {
  return registry.withSaveLock(projectId, relativePath, async () => {
    const safe = await containedPath(registry, projectId, relativePath, false);
    const current = await fs.readFile(safe.target).catch(() => { throw new Error("file could not be read"); });
    const initialStat = await fs.stat(safe.target, { bigint: true }).catch(() => { throw new Error("file could not be read"); });
    if (sha256(current) !== expectedSha256) throw new StaleFileError("source changed since it was read");

    const nonce = randomUUID();
    const temporary = path.join(path.dirname(safe.target), `.${path.basename(safe.target)}.${nonce}.tmp`);
    const recovery = path.join(path.dirname(safe.target), `.${path.basename(safe.target)}.${nonce}.recovery`);
    const recoveryRelativePath = path.posix.join(path.posix.dirname(safe.relativePath), path.basename(recovery));
    const handle = await fs.open(temporary, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY, 0o600);
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } catch {
      await handle.close().catch(() => undefined);
      await fs.rm(temporary, { force: true });
      throw new Error("temporary write failed");
    }
    await handle.close();
    await hooks.afterTemporarySync?.();

    const preserveRecovery = async (message: string): Promise<never> => {
      await fs.rename(temporary, recovery).catch(() => undefined);
      throw new StaleFileError(message, recoveryRelativePath);
    };
    const checked = await containedPath(registry, projectId, relativePath, false).catch(() => preserveRecovery("project path changed during save"));
    if (checked.target !== safe.target) return preserveRecovery("project path changed during save");
    const latest = await fs.readFile(safe.target).catch(() => preserveRecovery("source changed during save"));
    const latestStat = await fs.stat(safe.target, { bigint: true }).catch(() => preserveRecovery("source changed during save"));
    if (sha256(latest) !== expectedSha256 || identity(latestStat) !== identity(initialStat)) {
      return preserveRecovery("source changed during save");
    }
    try {
      if (hooks.replace) await hooks.replace(temporary, safe.target);
      else await fs.rename(temporary, safe.target);
    } catch {
      await fs.rename(temporary, recovery).catch(() => undefined);
      throw new Error(`atomic replacement failed; recovery retained as ${recoveryRelativePath}`);
    }
    if (process.platform !== "win32") {
      const directory = await fs.open(path.dirname(safe.target), constants.O_RDONLY);
      try { await directory.sync(); } finally { await directory.close(); }
    }
    return { relativePath: safe.relativePath, contents, sha256: sha256(contents) };
  });
}

export async function watchText(registry: ApprovedProjectRegistry, projectId: string, relativePath: string, changed: () => void): Promise<FSWatcher> {
  const safe = await containedPath(registry, projectId, relativePath, true);
  try {
    return watch(safe.target, { persistent: false }, () => changed());
  } catch {
    throw new Error("file could not be watched");
  }
}

export class MockSdkRuns {
  readonly #runs = new Map<string, { child: ChildProcess; cancel: () => void }>();

  get activeCount(): number { return this.#runs.size; }

  #redact(text: string, knownPaths: readonly string[] = []): string {
    let clean = text;
    for (const value of knownPaths) clean = clean.split(value).join("[REDACTED_PATH]");
    clean = clean.replace(/(?:[A-Za-z]:\\|\/)(?:[^\s"']+[\\/])*[^\s"']*/gu, "[REDACTED_PATH]");
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
      env: { PATH: process.env.PATH ?? "", ELECTRON_RUN_AS_NODE: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const knownPaths = request.args.filter((argument) => path.isAbsolute(argument));
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
      const output = this.#redact(decoders[channel].write(accepted), knownPaths);
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
