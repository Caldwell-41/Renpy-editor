# Task: Phase 1 production scaffold

**Status:** In progress; explicitly approved 2026-09-14<br>
**Scope:** Minimal production foundation only; no authoring feature implementation

## Entry condition

Do not begin this task until the Phase 0 corrective checkpoint is closed and the user
explicitly approves Phase 1. Accepted Phase 0 architecture decisions are dependencies,
not permission to implement.

The broader ordered Phase 1 milestones and fixed product/UX decisions are recorded in
[phase-1-vertical-slice.md](phase-1-vertical-slice.md). That plan does not expand this
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
- [Phase 1 vertical-slice plan](phase-1-vertical-slice.md)

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

Local npm checks/build and the independent Rust core suite pass. The executor lacks the
system WebKit/GTK development packages needed for a full host Tauri build, and its
package manager cannot acquire them due container identity restrictions. This is not a
target exception: Windows x64 and macOS ARM64 desktop tests, packaging, and injected
WebView smoke must pass in CI before this task can close.
