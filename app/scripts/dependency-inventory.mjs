import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

function argument(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing ${name}`);
  return process.argv[index + 1];
}

const cargoPath = argument("--cargo-metadata");
const outputPath = argument("--output");
const npmLock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
const cargoMetadata = JSON.parse(await readFile(cargoPath, "utf8"));

const npmPackages = Object.entries(npmLock.packages)
  .filter(([path]) => path !== "")
  .map(([path, metadata]) => ({
    name: path.replace(/^node_modules\//, ""),
    version: metadata.version,
    license: metadata.license ?? "UNKNOWN",
    development: metadata.dev === true,
  }))
  .sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));

const workspaceIds = new Set(cargoMetadata.workspace_members);
const cargoPackages = cargoMetadata.packages
  .map((metadata) => ({
    name: metadata.name,
    version: metadata.version,
    license: metadata.license ?? "UNKNOWN",
    source: metadata.source ?? "workspace",
    workspace: workspaceIds.has(metadata.id),
  }))
  .sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));

const unknown = [
  ...npmPackages.filter((entry) => entry.license === "UNKNOWN").map((entry) => `npm:${entry.name}`),
  ...cargoPackages.filter((entry) => entry.license === "UNKNOWN" && !entry.workspace).map((entry) => `cargo:${entry.name}`),
];
if (unknown.length > 0) throw new Error(`Dependencies without declared licences: ${unknown.join(", ")}`);

await writeFile(outputPath, `${JSON.stringify({ npmPackages, cargoPackages }, null, 2)}\n`, "utf8");
console.log(`Recorded ${npmPackages.length} npm and ${cargoPackages.length} Cargo package entries.`);
