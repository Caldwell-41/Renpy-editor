import { readdir, readFile, stat } from "node:fs/promises";
import process from "node:process";

const targets = process.argv.slice(2);
if (targets.length === 0) throw new Error("Provide at least one artifact path.");

const forbiddenNames = /(?:^|\/)(?:\.env(?:\..+)?|[^/]+\.(?:pem|key|p12|pfx)|credentials?\.json|secrets?\.json)$/i;
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];
const sentinel = process.env.LOOMLIGHT_SMOKE_SECRET;
const failures = [];
let files = 0;

async function visit(path) {
  const metadata = await stat(path);
  if (metadata.isDirectory()) {
    for (const entry of await readdir(path)) await visit(`${path}/${entry}`);
    return;
  }
  files += 1;
  if (forbiddenNames.test(path.replaceAll("\\", "/"))) failures.push(`forbidden filename: ${path}`);
  const content = await readFile(path);
  const text = content.toString("latin1");
  for (const pattern of secretPatterns) if (pattern.test(text)) failures.push(`secret pattern in: ${path}`);
  if (sentinel && text.includes(sentinel)) failures.push(`runtime sentinel in: ${path}`);
}

for (const target of targets) await visit(target);
if (failures.length > 0) throw new Error(failures.join("\n"));
console.log(`Artifact privacy scan passed for ${files} files.`);
