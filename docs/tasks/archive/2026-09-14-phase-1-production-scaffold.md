# Task: Phase 1 production scaffold

**Status:** Complete 2026-09-14<br>
**Scope:** Minimal production foundation only; no authoring feature implementation

## Entry condition

Do not begin this task until the Phase 0 corrective checkpoint is closed and the user
explicitly approves Phase 1. Accepted Phase 0 architecture decisions are dependencies,
not permission to implement.

The broader ordered Phase 1 milestones and fixed product/UX decisions are recorded in
[phase-1-vertical-slice.md](../active/phase-1-vertical-slice.md). That plan does not expand this
scaffold task: this remains the first bounded implementation gate and must complete
before later authoring milestones begin.

## Outcome sought

Create a clean production Tauri 2 workspace and validation skeleton that proves the
accepted desktop boundary on Windows x64 and macOS ARM64 without promoting disposable
spike code or prematurely implementing the vertical slice. Establish only the shared
visual-design primitives needed to prevent later feature components from hard-coding a
dark palette; do not polish authoring screens in this task.

## Dependencies

- [ADR 0001: lossless source model](../../adr/0001-lossless-source-model.md)
- [ADR 0002: SDK adapter/install](../../adr/0002-versioned-renpy-sdk-adapter.md)
- [ADR 0003: Tauri desktop runtime](../../adr/0003-tauri-desktop-runtime.md)
- [Architecture](../../ARCHITECTURE.md)
- [Security baseline](../../SECURITY.md)
- [Testing strategy](../../TESTING.md)
- [UI/design system](../../UI.md)
- [Phase 1 roadmap outcome](../../ROADMAP.md)
- [Phase 1 vertical-slice plan](../active/phase-1-vertical-slice.md)

## Bounded implementation

1. Create production workspace/package manifests pinned to reviewed Tauri 2,
   TypeScript, and Rust versions. Keep `spikes/` separate.
2. Establish the unprivileged local web UI and one explicit main-window capability.
   Do not grant general shell, filesystem, or HTTP plugin permissions.
3. Define the first versioned request/result envelope and schema validation shared by
   UI and Rust. Implement only harmless health/version and synthetic denial probes
   needed to validate the boundary.
4. Create empty production ports/interfaces for source transactions, project files,
   Ren'Py, Git, credentials, and network providers. Do not implement their workflows.
5. Add unit/static tests for command allowlisting, malformed payload denial, renderer
   privilege absence, CSP/navigation policy, redacted errors, and capability scope.
6. Add path-scoped quality and packaged smoke jobs for Windows x64 and macOS ARM64,
   using locked dependencies and commit-pinned third-party Actions. Reuse Phase 0
   evidence workflow lessons without copying its disposable application.
7. Establish the Quiet Studio Dark design-system foundation only: semantic
   surface/text/border/accent/status tokens, system UI typography, a reviewed
   monospace Source stack, modest radius/elevation primitives, reduced-motion support,
   and theme plumbing that can admit a later light theme. Feature components must use
   semantic tokens rather than hard-coded dark colours. Do not implement polished
   Scene/Source/Branches styling here.
8. Record exact versions, commands, packages, target results, failures, retained
   artifacts, and reviewed visual primitives; update canonical status and handover.

## Non-goals

- No project creation, source parser/patch implementation, authoring workspaces,
  branch graph, preview, asset pipeline, Git/GitHub, LLM, credential UI, or SDK
  download/run workflow.
- No polished feature screens, dashboard/card system, UI Designer, Timeline, or other
  authoring UI beyond the minimal local shell/probes required to validate the boundary.
- No SDK bundling, updater, signing/notarisation, public release, telemetry, or
  production migration of Electron.
- No copying the Phase 0 shells as the application architecture. Small algorithms or
  fixtures may be reimplemented only with explicit provenance and production tests.

## Acceptance criteria

- A fresh checkout can install/build/test the scaffold with locked dependencies.
- Packaged Windows x64 and macOS ARM64 smoke runs prove the same minimal local UI and
  deny unlisted/malformed commands, external navigation, popups, network, ambient
  filesystem/process access, and renderer secrets.
- The Rust core exposes only the documented command envelope and capability; all
  future adapters are interfaces with no hidden authority.
- Semantic visual tokens/theme primitives exist, are used by the minimal shell rather
  than literal palette values, respect reduced motion, and leave a viable light-theme
  path without adding authoring functionality or widening privileges.
- Repository validation, dependency/licence inventory, privacy scan, unit/static
  tests, Rust tests, and target package smoke are green or an exact unavoidable
  exception is documented.
- No Phase 1 authoring feature or generated Ren'Py project exists at checkpoint close.

## Expected touched areas

Production workspace/manifests, a new production UI/core boundary, shared visual-token
primitives, target-scoped CI, tests, dependency locks, `docs/ARCHITECTURE.md`,
`docs/SECURITY.md`, `docs/UI.md`, `docs/TESTING.md`, `docs/status/CURRENT.md`, and this
task. Avoid changes to disposable evidence unless a discovered regression requires a
separately documented fix.

## Completion handoff

Report the exact commits, target runs, dependency versions, privilege surface, visual
primitives, validation results, retained limitations, and the next bounded vertical-
slice task. After this gate passes, the next planned milestone is 1B transaction/file
coordination and recovery; do not jump directly to Scene authoring. Phase 1 work beyond
this scaffold requires the scaffold gate to pass.

## Implementation checkpoint — 2026-09-14

The first production implementation is under `app/` and remains separate from Phase 0
spikes. It includes the Cargo core/desktop split, one schema-validated version 1 command
envelope, main-window-only capability, denial probes, empty future ports, locked npm and
Cargo graphs, the semantic Quiet Studio theme foundation, static/unit/Rust core tests,
artifact privacy/licence scripts, and the path-scoped two-target production workflow.

Local npm checks/build, the seven-test independent Rust core suite, repository
validator, artifact scan, npm audit, Phase 0 regressions, and whitespace/privacy checks
pass. The executor lacks the system WebKit/GTK development packages needed for a full
host Tauri build, and its package manager cannot acquire them due container identity
restrictions. A Windows MSVC target compile check passed before the executor toolchain
cache was recycled; this is compile evidence only, not a target package/smoke pass.

## Target evidence and resolved blocker — 2026-09-14

- Commits from `f9b43880` through `c4f2bd18` preserve the bounded scaffold scope.
  The follow-ups corrected npm argument forwarding, made popup/capability probes
  native-observed and timing-safe, added a main-WebView handler guard, and removed a
  WebView2-global false positive from the secret probe.
- [Quality run 34782008928](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34782008928)
  passed at `ae447584`.
- [Production run 34782008915](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34782008915)
  used Node 24.19.0, npm 11.17.0 supplied by that runner image, and Rust/Cargo 1.90.0.
  macOS 26.6.2 ARM64 passed frontend tests, Rust core/desktop tests, packaging,
  injected WebView boundary smoke, privacy scan, and dependency/licence inventory.
  It produced `Loomlight.app` and `Loomlight_0.1.0_aarch64.dmg`; the smoke emitted
  `navigationDenied: true`, `popupDenied: true`, and
  `webviewRestrictionsPassed: true`.
- The same run's Windows Server 2025 x64 job passed frontend and Rust tests and
  produced `loomlight.exe`, `Loomlight_0.1.0_x64_en-US.msi`, and
  `Loomlight_0.1.0_x64-setup.exe`. Its smoke passed command/payload, capability,
  filesystem/process/HTTP/network, Node-global, popup, and navigation denials, but a
  generic WebView2 global containing “token” made `rendererSecretsAbsent` false.
  Commit `c4f2bd18` corrects the heuristic while retaining empty-storage/Node checks,
  Loomlight-specific secret-global checks, sentinel-text denial, and the separate
  exact-sentinel artifact scan.
- Runs 34780357847, 34780490758, 34780802995, 34781085182, 34781283266,
  34781484402, and 34781840747 retain the cancelled or failed command-forwarding and
  packaged-probe evidence that led to those corrections. Skipped steps are not passes.
- Repository artifact uploads reported exhausted GitHub storage quota. The workflow
  still attempts private seven-day evidence upload but does not let quota failure mask
  the package/security result.
- Replacement production run 34782646465 and quality run 34782646499 at
  `c4f2bd18` failed during runner setup with zero steps. The workflow now installs
  exact npm 11.9.0 after selecting Node 24.19.0, but this change also remains target-
  unexecuted while hosted capacity is unavailable.

The hosted-runner interruption was resolved without weakening the gate.
[Production run 34792368716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368716)
at `0a6a6c5d1ee30fc0626d4edeca0f23db611490bb` passed both supported targets with
Node 24.19.0, npm 11.9.0, and Rust/Cargo 1.90.0:

- Windows x64 job 103818859749 built `loomlight.exe`,
  `Loomlight_0.1.0_x64_en-US.msi`, and `Loomlight_0.1.0_x64-setup.exe`; its packaged
  smoke reported x86_64 Windows with navigation, popup, and aggregate WebView
  restrictions true.
- macOS ARM64 job 103818859932 built `Loomlight.app` and
  `Loomlight_0.1.0_aarch64.dmg`; its packaged smoke reported aarch64 macOS with the
  same restrictions true.
- Both jobs passed frontend checks/build, the core and desktop Rust suites, artifact
  secret scans over six production files, and inventories of 76 npm plus 433 Cargo
  entries. Lightweight evidence artifacts 10328234722 (Windows) and 10328548641
  (macOS) were retained for seven days. Full packages were intentionally skipped on
  this routine push under the documented cost-control policy, not reported as retained
  artifacts.
- [Quality run 34792368711](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368711)
  passed at the same commit.

All Phase 1A acceptance criteria are satisfied. The production privilege surface
remains one versioned `core_request` command for health/version and synthetic denial
probes, granted only to the local `main` WebView and guarded by its Rust caller label.
Future adapters remain empty markers. Phase 1B is a separately approval-gated planning
artifact; no Phase 1B or authoring implementation is part of this closure.
