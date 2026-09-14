# Phase 1 production dependency and licence inventory

**Reviewed:** 2026-09-14 after the Phase 1B target gate<br>
**Scope:** Phase 1A scaffold plus Phase 1B transaction foundation

## Locked toolchains

- Node.js 24.19.0 and npm 11.9.0 (`package.json` engines and explicit CI install)
- Rust 1.90.0 with `rustfmt` (`rust-toolchain.toml`)
- TypeScript 7.0.2 and Vite 8.3.0
- Tauri JavaScript API 2.11.1, CLI 2.11.4, Rust crate 2.11.5, and build crate 2.6.3

The separate JavaScript and Rust versions reflect their independently published locked
packages; they are not floating ranges. `package-lock.json` and `Cargo.lock` are
committed. Install/build commands use `npm ci` and Cargo `--locked`.

## Direct production dependencies

| Package | Purpose | Declared licence |
| --- | --- | --- |
| `@tauri-apps/api` 2.11.1 | Invoke the single desktop command | Apache-2.0 OR MIT |
| `tauri` 2.11.5 | Desktop runtime and WebView boundary | Apache-2.0 OR MIT |
| `serde` 1.0.229 | Typed result serialization | Apache-2.0 OR MIT |
| `serde_json` 1.0.151 | JSON envelope validation/serialization | Apache-2.0 OR MIT |
| `hex` 0.4.3 | Encode SHA-256 revisions and journal checksums | Apache-2.0 OR MIT |
| `sha2` 0.10.9 | Source revision and journal hashing | Apache-2.0 OR MIT |
| `libc` 0.2.189 | macOS F_FULLFSYNC and rename-exchange bindings | Apache-2.0 OR MIT |
| `windows-sys` 0.61.2 | Windows identity and replacement bindings | Apache-2.0 OR MIT |

Build/development dependencies are `@tauri-apps/cli` 2.11.4 (Apache-2.0 OR MIT),
`tauri-build` 2.6.3 (Apache-2.0 OR MIT), TypeScript 7.0.2 (Apache-2.0), Vite 8.3.0
(MIT), `@types/node` 24.7.0 (MIT), and `tempfile` 3.27.0 (Apache-2.0 OR MIT)
for isolated transaction fixtures. No runtime plugin package is installed for
filesystem, shell/process, HTTP, opener, credentials, updates, or persistence.

## Transitive inventory

The locked dependency graph currently contains 76 npm package entries and 437 Cargo
package entries across all target/platform conditionals, including the two local
workspace crates. All third-party entries report a licence expression. CI recreates a
machine-readable, versioned inventory from both lockfiles on each supported target and
retains it with lightweight build evidence for seven days. Full packages are retained
only for explicitly requested manual workflow runs.

Cargo's cross-platform graph includes target-conditional packages that are not shipped
on both production targets. The inventory records them rather than treating a host-only
subset as the complete supply-chain surface. Dependency upgrades require lockfile diff,
licence, capability, and target-build review.
