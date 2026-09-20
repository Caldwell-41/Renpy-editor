import { execFile, spawn } from "node:child_process";
import { readdir, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const candidate = process.argv[2];
const outputIndex = process.argv.indexOf("--output");
if (!new Set(["electron", "tauri"]).has(candidate) || outputIndex < 0 || !process.argv[outputIndex + 1]) {
  throw new Error("usage: measure-packaged-candidate.mjs electron|tauri --output FILE");
}

async function findOne(directory, predicate) {
  const matches = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      if (predicate(target, entry)) matches.push(target);
      if (entry.isDirectory() && !target.endsWith(".app")) await visit(target);
    }
  }
  await visit(directory);
  if (matches.length !== 1) throw new Error(`expected one packaged artifact, found ${matches.length}`);
  return matches[0];
}

async function candidatePaths() {
  if (candidate === "electron") {
    const packaged = process.platform === "win32"
      ? path.join(root, "artifacts/electron/LoomlightSpike-win32-x64")
      : path.join(root, "artifacts/electron/LoomlightSpike-darwin-arm64/LoomlightSpike.app");
    const executable = process.platform === "win32"
      ? path.join(packaged, "LoomlightSpike.exe")
      : path.join(packaged, "Contents/MacOS/LoomlightSpike");
    return { packaged, executable };
  }
  if (process.platform === "win32") {
    const executable = path.join(root, "src-tauri/target/release/loomlight-desktop-tauri-spike.exe");
    return { packaged: executable, executable };
  }
  const packaged = await findOne(path.join(root, "src-tauri/target/release/bundle/macos"), (target, entry) => entry.isDirectory() && target.endsWith(".app"));
  return { packaged, executable: path.join(root, "src-tauri/target/release/loomlight-desktop-tauri-spike") };
}

async function artifactMetrics(target) {
  const details = await stat(target);
  if (details.isFile()) return { bytes: details.size, files: 1 };
  let bytes = 0; let files = 0;
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (entry.isFile()) { bytes += (await stat(child)).size; files += 1; }
    }
  }
  await visit(target);
  return { bytes, files };
}

function execFileText(command, args) {
  return new Promise((resolve, reject) => execFile(command, args, { encoding: "utf8", windowsHide: true }, (error, stdout) => error ? reject(error) : resolve(stdout)));
}

async function sampleMemory(rootPid) {
  if (process.platform === "win32") {
    const stdout = await execFileText("powershell", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(here, "process-tree-memory.ps1"), String(rootPid)]);
    return JSON.parse(stdout);
  }
  const stdout = await execFileText("ps", ["-axo", "pid=,ppid=,rss="]);
  const rows = stdout.trim().split(/\n/u).map((line) => line.trim().split(/\s+/u).map(Number));
  const ids = new Set([rootPid]);
  let changed;
  do {
    changed = false;
    for (const [pid, ppid] of rows) if (ids.has(ppid) && !ids.has(pid)) { ids.add(pid); changed = true; }
  } while (changed);
  const selected = rows.filter(([pid]) => ids.has(pid));
  return { workingSetBytes: selected.reduce((sum, row) => sum + row[2] * 1024, 0), privateBytes: null, processes: selected.length };
}

const round = (value) => Math.round(value * 100) / 100;
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? null;

async function oneRun(executable, index) {
  const started = performance.now();
  const child = spawn(executable, [], {
    cwd: root,
    detached: process.platform !== "win32",
    env: { ...process.env, LOOMLIGHT_SPIKE_MEASUREMENT_PROBE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let stage = "starting"; let coldStartMs = null; let processStartupMs = null; let complete = null; let buffer = ""; let stderr = "";
  const samples = [];
  const pending = new Set();
  const samplingStages = new Set();
  const sample = () => {
    if (stage === "starting" || samplingStages.has(stage)) return;
    const sampleStage = stage;
    samplingStages.add(sampleStage);
    const promise = sampleMemory(child.pid).then((memory) => samples.push({ stage: sampleStage, ...memory })).catch(() => {}).finally(() => {
      pending.delete(promise); samplingStages.delete(sampleStage);
    });
    pending.add(promise);
  };
  const timer = setInterval(sample, 1_000);
  const timeout = setTimeout(() => {
    if (process.platform === "win32") spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true });
    else { try { process.kill(-child.pid, "SIGKILL"); } catch {} }
  }, 60_000);
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4_000); });
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/u); buffer = lines.pop() ?? "";
    for (const line of lines) {
      try {
        const record = JSON.parse(line);
        if (!String(record.evidence ?? "").endsWith("packaged-measurement")) continue;
        if (record.stage === "ready") { coldStartMs = performance.now() - started; processStartupMs = record.processStartupMs ?? null; stage = "idle"; sample(); }
        else if (record.stage === "stress-start") { stage = "stress"; sample(); }
        else if (record.stage === "complete") complete = record;
      } catch {}
    }
  });
  const exitCode = await new Promise((resolve) => child.once("exit", resolve));
  clearInterval(timer); clearTimeout(timeout); await Promise.allSettled([...pending]);
  const idle = samples.filter((item) => item.stage === "idle");
  const stress = samples.filter((item) => item.stage === "stress");
  const case10k = complete?.cases?.find((item) => item.size === 10_000);
  return {
    index, passed: exitCode === 0 && complete?.measurementPassed === true && coldStartMs !== null && idle.length > 0 && stress.length > 0,
    exitCode, coldStartMs: round(coldStartMs ?? 0), processStartupMs,
    idleWorkingSetBytes: median(idle.map((item) => item.workingSetBytes)),
    idlePrivateBytes: median(idle.map((item) => item.privateBytes).filter((value) => value !== null)),
    idleProcessCount: median(idle.map((item) => item.processes)),
    stressPeakWorkingSetBytes: Math.max(0, ...stress.map((item) => item.workingSetBytes)),
    stressPeakPrivateBytes: stress.some((item) => item.privateBytes !== null) ? Math.max(0, ...stress.map((item) => item.privateBytes ?? 0)) : null,
    stressPeakProcessCount: Math.max(0, ...stress.map((item) => item.processes)),
    interaction10kP95Ms: case10k?.interactionP95Ms ?? null,
    monacoEditDelay10kMs: case10k?.editorEditDelayMs ?? null,
    monacoEditLatency10kMs: case10k?.editorEditLatencyMs ?? null,
    graph10kTotalMs: case10k?.totalMs ?? null,
    measurementPassed: complete?.measurementPassed ?? false,
    graphPassed: complete?.passed ?? false,
    graphCases: complete?.cases?.map((item) => ({
      size: item.size,
      passed: item.passed,
      totalMs: item.totalMs,
      interactionP95Ms: item.interactionP95Ms,
      editorEditDelayMs: item.editorEditDelayMs,
      editorEditLatencyMs: item.editorEditLatencyMs,
      longTaskMaxMs: item.longTaskMaxMs,
    })) ?? [],
    stderr: exitCode === 0 ? "" : stderr.replaceAll(root, "<redacted-path>"),
  };
}

const paths = await candidatePaths();
const runs = [];
for (let index = 1; index <= 3; index += 1) runs.push(await oneRun(paths.executable, index));
const artifact = await artifactMetrics(paths.packaged);
const report = {
  schemaVersion: 1,
  candidate,
  platform: `${os.platform()}-${os.arch()}-${os.release()}`,
  node: process.version,
  repetitions: runs.length,
  passed: runs.every((run) => run.passed),
  artifact,
  coldStartMedianMs: median(runs.map((run) => run.coldStartMs)),
  idleWorkingSetMedianBytes: median(runs.map((run) => run.idleWorkingSetBytes)),
  stressPeakWorkingSetMaxBytes: Math.max(...runs.map((run) => run.stressPeakWorkingSetBytes)),
  runs,
};
await writeFile(process.argv[outputIndex + 1], `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report));
if (!report.passed) process.exitCode = 1;
