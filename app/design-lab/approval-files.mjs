import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { parseApprovalRecord } from "./approval.ts";

const roots = ["app/src", "app/design-lab", "app/public"];
const fixed = ["app/package.json", "app/package-lock.json", "app/tsconfig.json", "app/vite.config.ts"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".json", ".html", ".css", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".wasm", ".txt", ".wav", ".ogg", ".mp3", ".mp4", ".webm"]);
const skipped = new Set(["node_modules", ".vite", "dist", "dist-tests"]);
export function isDesignSourceInput(file) {
  return fixed.includes(file) || roots.some(root => file.startsWith(root + "/")) &&
    !file.split("/").some(part => skipped.has(part)) && extensions.has(path.posix.extname(file).toLowerCase());
}
export function sourcePaths(root) { return [...roots, ...fixed].map(relative => path.join(root, relative)); }
function digest(files) {
  const hash = createHash("sha256");
  for (const [name, bytes] of [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) {
    hash.update(name).update("\0").update(createHash("sha256").update(bytes).digest());
  }
  return hash.digest("hex");
}
function git(root, args, encoding) { return execFileSync("git", args, { cwd: root, encoding, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 32 * 1024 * 1024 }); }

function approvalPaths(root) {
  const paths = [];
  function walk(relative) {
    for (const entry of readdirSync(path.join(root, relative), { withFileTypes: true })) {
      const file = relative + "/" + entry.name;
      if (entry.isDirectory()) walk(file);
      else if (entry.name === "approval.json") {
        if (!entry.isFile()) throw new Error(`Approval records must be regular files: ${file}`);
        paths.push(file);
      }
    }
  }
  walk("docs/design");
  return paths;
}

export function workingFingerprint(root) {
  const files = [];
  function walk(relative) {
    const absolute = path.join(root, relative);
    if (!existsSync(absolute)) return;
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) throw new Error(`Design source must use regular files: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(absolute)) if (!skipped.has(name)) walk(relative + "/" + name);
    } else if (isDesignSourceInput(relative)) files.push([relative, readFileSync(absolute)]);
  }
  for (const relative of [...roots, ...fixed]) walk(relative);
  return digest(files);
}

export function committedFingerprint(root, commit) {
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error("A full source commit is required.");
  const entries = git(root, ["ls-tree", "-rz", commit, "--", ...roots, ...fixed], "utf8").split("\0").filter(Boolean);
  const files = [];
  for (const entry of entries) {
    const separator = entry.indexOf("\t");
    const file = entry.slice(separator + 1);
    if (!isDesignSourceInput(file)) continue;
    const [mode, type, object] = entry.slice(0, separator).split(" ");
    if (!["100644", "100755"].includes(mode) || type !== "blob") throw new Error(`Design source must use regular files: ${file}`);
    files.push([file, git(root, ["cat-file", "blob", object])]);
  }
  if (!files.length) throw new Error("Source commit contains no Design Lab/frontend inputs.");
  return digest(files);
}

export function captureSource(root) {
  const commit = git(root, ["rev-parse", "HEAD"], "utf8").trim();
  const fingerprint = workingFingerprint(root);
  if (committedFingerprint(root, commit) !== fingerprint) {
    throw new Error("Commit the candidate frontend/lab source before recording approval. Unrelated documentation edits can remain uncommitted.");
  }
  for (const file of approvalPaths(root)) {
    try { git(root, ["cat-file", "-e", `${commit}:${file}`]); }
    catch { throw new Error(`Include the draft approval record in the candidate commit: ${file}`); }
  }
  return { commit, fingerprint };
}

export function loadApprovalRecords(root) {
  const records = [];
  const sourceCache = new Map();
  let current;
  for (const file of approvalPaths(root)) {
    const record = parseApprovalRecord(JSON.parse(readFileSync(path.join(root, file), "utf8")));
    const sourceMatches = {};
    for (const revision of record.revisions) if (revision.approval) {
      const source = revision.approval.source;
      if (!sourceCache.has(source.commit)) sourceCache.set(source.commit, committedFingerprint(root, source.commit));
      if (sourceCache.get(source.commit) !== source.fingerprint) throw new Error(`Approval fingerprint does not match its source commit: ${file}/${revision.id}`);
      for (const capture of revision.approval.captures) {
        if (!existsSync(path.join(root, capture.path)) || !lstatSync(path.join(root, capture.path)).isFile()) {
          throw new Error(`Missing retained reference capture: ${capture.path}`);
        }
        if (createHash("sha256").update(readFileSync(path.join(root, capture.path))).digest("hex") !== capture.sha256) {
          throw new Error(`Retained reference capture has changed: ${capture.path}`);
        }
      }
      current ??= workingFingerprint(root);
      sourceMatches[revision.id] = current === source.fingerprint;
    }
    records.push({ path: file, record, sourceMatches });
  }
  if (new Set(records.map(item => item.record.screenId)).size !== records.length) throw new Error("Duplicate screen approval records");
  return records;
}
