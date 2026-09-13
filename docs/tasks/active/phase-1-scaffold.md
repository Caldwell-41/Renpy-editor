# Task: Phase 1 production scaffold

**Status:** Blocked pending explicit Phase 1 approval<br>
**Scope:** Minimal production foundation only; no authoring feature implementation

## Entry condition

Do not begin this task until the user explicitly approves Phase 1. Phase 0 is complete
and its accepted decisions are dependencies, not permission to implement.

## Outcome sought

Create a clean production Tauri 2 workspace and validation skeleton that proves the
accepted desktop boundary on Windows x64 and macOS ARM64 without promoting disposable
spike code or prematurely implementing the vertical slice.

## Dependencies

- [ADR 0001: lossless source model](../../adr/0001-lossless-source-model.md)
- [ADR 0002: SDK adapter/install](../../adr/0002-versioned-renpy-sdk-adapter.md)
- [ADR 0003: Tauri desktop runtime](../../adr/0003-tauri-desktop-runtime.md)
- [Architecture](../../ARCHITECTURE.md)
- [Security baseline](../../SECURITY.md)
- [Testing strategy](../../TESTING.md)
- [Phase 1 roadmap outcome](../../ROADMAP.md)

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
7. Record exact versions, commands, packages, target results, failures, and retained
   artifacts; update canonical status and handover.

## Non-goals

- No project creation, source parser/patch implementation, authoring workspaces,
  branch graph, preview, asset pipeline, Git/GitHub, LLM, credential UI, or SDK
  download/run workflow.
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
- Repository validation, dependency/licence inventory, privacy scan, unit/static
  tests, Rust tests, and target package smoke are green or an exact unavoidable
  exception is documented.
- No Phase 1 authoring feature or generated Ren'Py project exists at checkpoint close.

## Expected touched areas

Production workspace/manifests, a new production UI/core boundary, target-scoped CI,
tests, dependency locks, `docs/ARCHITECTURE.md`, `docs/SECURITY.md`,
`docs/TESTING.md`, `docs/status/CURRENT.md`, and this task. Avoid changes to
disposable evidence unless a discovered regression requires a separately documented
fix.

## Completion handoff

Report the exact commits, target runs, dependency versions, privilege surface,
validation results, retained limitations, and the next bounded vertical-slice task.
Phase 1 work beyond this scaffold requires the scaffold gate to pass.
