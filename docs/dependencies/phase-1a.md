# Phase 1A dependency and licence inventory

**Reviewed:** 2026-09-14<br>
**Scope:** Production scaffold only

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

Build/development dependencies are `@tauri-apps/cli` 2.11.4 (Apache-2.0 OR MIT),
`tauri-build` 2.6.3 (Apache-2.0 OR MIT), TypeScript 7.0.2 (Apache-2.0), Vite 8.3.0
(MIT), and `@types/node` 24.7.0 (MIT). No runtime plugin package is installed for
filesystem, shell/process, HTTP, opener, credentials, updates, or persistence.

## Transitive inventory

The locked dependency graph currently contains 76 npm package entries and 433 Cargo
package entries across all target/platform conditionals, including the two local
workspace crates. All third-party entries report a licence expression. CI recreates a
machine-readable, versioned inventory from both lockfiles on each supported target and
retains it with the private build evidence for seven days.

Cargo's cross-platform graph includes target-conditional packages that are not shipped
on both production targets. The inventory records them rather than treating a host-only
subset as the complete supply-chain surface. Dependency upgrades require lockfile diff,
licence, capability, and target-build review.
