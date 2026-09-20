import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const cargoIndex = process.argv.indexOf("--cargo-metadata");
const outputIndex = process.argv.indexOf("--output");
if (cargoIndex < 0 || outputIndex < 0 || !process.argv[cargoIndex + 1] || !process.argv[outputIndex + 1]) {
  throw new Error("usage: report-static-comparison.mjs --cargo-metadata FILE --output FILE");
}

const lock = JSON.parse(await readFile(path.join(root, "package-lock.json"), "utf8"));
const cargo = JSON.parse(await readFile(process.argv[cargoIndex + 1], "utf8"));
const npmPackages = Object.entries(lock.packages).filter(([name]) => name !== "");
const cargoPackages = cargo.packages.filter((item) => item.source !== null);
const licenses = (packages, field) => {
  const counts = {};
  for (const item of packages) {
    const value = field(item) || "UNKNOWN";
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
};

const groups = {
  shared: ["src/shared/contracts.ts", "src/ui/main.ts", "src/ui/graph-evidence.ts", "src/ui/index.html", "src/ui/style.css"],
  electron: ["src/electron/main.ts", "src/electron/preload.cts", "src/electron/mock-sdk.ts", "src/shared/node-adapter.ts", "scripts/package-electron.mjs"],
  tauri: ["src-tauri/src/main.rs", "src-tauri/src/security_probe.js", "src-tauri/src/unauthorised_permission_probe.js", "src-tauri/src/ui_probe.js", "src-tauri/src/graph_probe.js", "src-tauri/src/measurement_probe.js", "src-tauri/build.rs", "src-tauri/tauri.conf.json", "src-tauri/capabilities/default.json", "src-tauri/permissions/desktop-operations.toml"],
};
const complexity = {};
for (const [name, files] of Object.entries(groups)) {
  const lines = await Promise.all(files.map(async (file) => (await readFile(path.join(root, file), "utf8")).split(/\r?\n/u).filter((line) => line.trim()).length));
  complexity[name] = { files: files.length, nonblankLines: lines.reduce((sum, value) => sum + value, 0), languages: [...new Set(files.map((file) => path.extname(file).slice(1)))].sort() };
}

const report = {
  schemaVersion: 1,
  npm: { packages: npmPackages.length, licenses: licenses(npmPackages, ([, item]) => item.license) },
  cargo: { registryPackages: cargoPackages.length, licenses: licenses(cargoPackages, (item) => item.license) },
  complexity,
  interpretation: {
    sharedUiAppliesToBoth: true,
    electronPrivilegedLanguage: "TypeScript/JavaScript",
    tauriPrivilegedLanguage: "Rust plus injected JavaScript",
    cargoIncludesTransitiveBuildAndTargetDependencies: true,
    npmLockIncludesSharedAndBothCandidatesBuildTooling: true,
  },
};
await writeFile(process.argv[outputIndex + 1], `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report));
