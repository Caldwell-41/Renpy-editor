import { execFileSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { lstat, readdir } from "node:fs/promises";
import path from "node:path";

async function main() {
const values = [process.env.LOOMLIGHT_SPIKE_CREDENTIAL_SECRET, process.env.LOOMLIGHT_SPIKE_CREDENTIAL_ACCOUNT]
  .filter((value) => typeof value === "string" && value.length >= 12)
  .map((value) => Buffer.from(value, "utf8"));
if (values.length !== 2) throw new Error("credential scan fixture is unavailable");

const requested = process.argv.slice(2);
const tracked = requested[0] === "--tracked";
if (tracked) requested.shift();
const files = new Set();
if (tracked) {
  const repository = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
  for (const relative of execFileSync("git", ["ls-files", "-z"], { cwd: repository, encoding: "utf8" }).split("\0").filter(Boolean)) {
    files.add(path.join(repository, relative));
  }
}

async function collect(target) {
  const metadata = await lstat(target);
  if (metadata.isSymbolicLink()) return;
  if (metadata.isDirectory()) {
    for (const entry of await readdir(target)) await collect(path.join(target, entry));
  } else if (metadata.isFile()) {
    files.add(path.resolve(target));
  }
}
for (const target of requested) await collect(target);

async function contains(file, needle) {
  let tail = Buffer.alloc(0);
  for await (const chunk of createReadStream(file)) {
    const searchable = Buffer.concat([tail, chunk]);
    if (searchable.includes(needle)) return true;
    tail = searchable.subarray(Math.max(0, searchable.length - needle.length + 1));
  }
  return false;
}

let leakCount = 0;
for (const file of files) {
  for (const value of values) {
    if (await contains(file, value)) { leakCount += 1; break; }
  }
}
const result = { evidence: "credential-plaintext-scan", passed: leakCount === 0, scannedFiles: files.size, leakCount };
process.stdout.write(`${JSON.stringify(result)}\n`);
if (leakCount !== 0) process.exitCode = 1;
}

main().catch(() => {
  process.stderr.write('{"evidence":"credential-plaintext-scan","passed":false,"error":"scan failed"}\n');
  process.exitCode = 1;
});
