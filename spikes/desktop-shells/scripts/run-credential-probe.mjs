import { spawn } from "node:child_process";
import { homedir } from "node:os";
import path from "node:path";

async function main() {
const candidate = process.argv[2];
if (!new Set(["electron", "tauri"]).has(candidate)) throw new Error("credential candidate is invalid");
const secret = process.env.LOOMLIGHT_SPIKE_CREDENTIAL_SECRET;
const account = process.env.LOOMLIGHT_SPIKE_CREDENTIAL_ACCOUNT;
if (!secret || secret.length < 24 || !account || account.length < 12) throw new Error("credential fixture is unavailable");

const executable = candidate === "electron"
  ? (process.platform === "win32"
      ? path.resolve("artifacts/electron/LoomlightSpike-win32-x64/LoomlightSpike.exe")
      : path.resolve("artifacts/electron/LoomlightSpike-darwin-arm64/LoomlightSpike.app/Contents/MacOS/LoomlightSpike"))
  : (process.platform === "win32"
      ? path.resolve("src-tauri/target/release/loomlight-desktop-tauri-spike.exe")
      : path.resolve("src-tauri/target/release/loomlight-desktop-tauri-spike"));

const output = [];
let outputBytes = 0;
let timedOut = false;
let overflow = false;
const child = spawn(executable, [], { env: process.env, shell: false, windowsHide: true });
const capture = (chunk) => {
  outputBytes += chunk.length;
  if (outputBytes > 65_536) {
    overflow = true;
    child.kill("SIGKILL");
    return;
  }
  output.push(Buffer.from(chunk));
};
child.stdout.on("data", capture);
child.stderr.on("data", capture);
const timer = setTimeout(() => {
  timedOut = true;
  child.kill("SIGKILL");
}, 30_000);
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("close", resolve);
}).finally(() => clearTimeout(timer));

const captured = Buffer.concat(output).toString("utf8");
const sensitive = [secret, account, process.cwd(), homedir(), process.env.RUNNER_TEMP]
  .filter((value) => typeof value === "string" && value.length >= 8);
if (sensitive.some((value) => captured.includes(value))) throw new Error("credential probe output failed redaction");
if (timedOut) throw new Error("credential probe exceeded 30 seconds");
if (overflow) throw new Error("credential probe exceeded output limit");
if (code !== 0) throw new Error(`credential probe failed with status ${code}`);

const records = captured.trim().split(/\r?\n/).filter(Boolean);
const result = JSON.parse(records.at(-1) ?? "{}");
const expectedEvidence = `${candidate}-packaged-credential`;
if (result.evidence !== expectedEvidence || result.passed !== true || result.rendererCreated !== false) {
  throw new Error("credential probe returned invalid evidence");
}
process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch(() => {
  process.stderr.write('{"evidence":"credential-probe-runner","passed":false,"error":"probe runner failed"}\n');
  process.exitCode = 1;
});
