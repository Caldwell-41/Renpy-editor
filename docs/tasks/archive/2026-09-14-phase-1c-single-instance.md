# Task: Phase 1C single-instance lifecycle micro-remediation

**Status:** Complete 2026-09-14<br>
**Scope:** Single-instance lifecycle boundary only; Phase 1D remains unapproved

## Finding and invariant

Phase 1C assumed one desktop process owns application lifecycle state but did not
enforce that assumption. Two independently running processes could therefore construct
separate `LifecycleService` values and both mutate application-local state such as
Recent Projects.

Loomlight is a single-instance desktop application. The primary process is the sole
owner/coordinator of mutable application lifecycle state. Independent concurrent
Loomlight instances and multi-process editing are unsupported.

## Bounded design

- Pin and register the maintained Tauri 2 single-instance plugin as the first plugin,
  before desktop `setup` and `LifecycleService::new`.
- On a second launch, restore, show, and request focus for the existing `main` window.
  Ignore arguments and the secondary working directory; no new project-open routing is
  introduced.
- Add no renderer API or capability permission. Do not add project locks, Recent
  Projects multi-writer coordination, or general multi-process support.

## Required evidence

- Existing local frontend, repository, source-spike, and SDK-spike regressions, plus
  the supported-target core suites.
- Desktop compilation/tests and production packaging on Windows x64 and macOS ARM64.
- On each supported target, a packaged primary publishes a deterministic readiness
  marker only after lifecycle construction and main-window creation. Launching the same
  executable again must notify that primary and exit; the secondary's isolated output
  must not contain the readiness marker. The primary must subsequently complete the
  existing lifecycle/UI and WebView security smoke.
- Dependency/licence inventory and artifact secret scanning remain green.

## Validation and evidence

Local validation:

- `npm ci --ignore-scripts`, `npm run check`, and `npm run build`: passed; six
  frontend/protocol/security tests passed.
- `python3 scripts/validate.py`: passed for 183 repository files.
- Lossless-source suite: 26 passed. SDK spike suite: 24 passed.
- Lossless-source benchmark: 106.44 ms median for 620,000 bytes / 40,000 nodes.
- Rust formatting check and `git diff --check`: passed.
- This workspace did not provide the pinned Rust 1.90 toolchain. A fallback Cargo 1.75
  attempt could not parse locked Edition 2024 dependencies and is not claimed as test
  evidence; supported-target CI supplied the authoritative Cargo evidence.

[Production run 34906232240](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34906232240)
at implementation commit `e1e8dac27b5d98ceca58e7a14a4361c93854b7ff` passed:

- Windows x64 job `104183422740`: 65 platform core tests passed, three intentional
  subprocess workers ignored; the exact official SDK lifecycle gate passed; desktop
  tests, packaging, packaged dual-launch/WebView smoke, artifact scan, and inventory
  passed.
- macOS ARM64 job `104183422612`: 68 platform core tests passed, three intentional
  subprocess workers ignored; the exact official SDK lifecycle gate passed; desktop
  tests, packaging, packaged dual-launch/WebView smoke, artifact scan, and inventory
  passed.
- Both secondary-process logs are empty. Both primary logs record the post-setup
  lifecycle-owner readiness marker, `single-instance-secondary-rejected` with
  `primaryWindowFound: true`, and the final existing lifecycle/UI/security report with
  `singleInstancePassed: true`.
- Evidence artifacts are `10372748134` (Windows, SHA-256
  `949213ab719c6d8c895cae933839459d97670f89dbdb37281f62a0b483af38e7`) and
  `10373200561` (macOS, SHA-256
  `75fc9d2b01dcdcce046b4f1a838e5496129989a1fad1031ea28cb2c06515bb03`).
- Quality run `34906232244` passed.

## Focused closure review

The plugin remains the first registered Tauri plugin and runs before application
`setup`; `LifecycleService::new` remains inside `setup`, after that arbitration. The
secondary callback carries no project arguments or editing operations and only makes
best-effort native unminimise/show/focus requests. It adds no JavaScript API or WebView
permission, and the existing capability, CSP, navigation, popup, ambient plugin, and
IPC denial checks remain green.

The pinned direct dependency is `tauri-plugin-single-instance` 2.4.4, licensed
Apache-2.0 OR MIT. Known platform limitation: an OS/window manager may decline a focus
request, so focus is best effort; failure does not permit a second lifecycle owner.

Phase 1C is clean and re-closed. Phase 1D was not started and remains separately
approval-gated.
