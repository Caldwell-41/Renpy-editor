# Phase 0 continuation handover

**Prepared:** 2026-09-11<br>
**Phase:** 0 — Foundation and proof<br>
**Repository:** `Caldwell-41/Renpy-editor` (confirmed private)<br>
**Branch:** `main`

## Read first

Read, in order:

1. [`AGENTS.md`](../../AGENTS.md) for repository rules and validation expectations.
2. [Current status](CURRENT.md) for the short source of truth.
3. [Active Phase 0 evidence task](../tasks/active/phase-0-evidence-spikes.md).
4. [Desktop evidence](../research/DESKTOP_SPIKE_RESULTS.md) and the
   [stack/spike plan](../research/STACK_AND_SPIKES.md).
5. [Roadmap](../ROADMAP.md), [security baseline](../SECURITY.md), and
   [testing strategy](../TESTING.md) before changing scope.

The approved product brief remains authoritative. Do not reopen its settled product
decisions unless repository evidence presents a material conflict.

## Confirmed decisions and boundaries

- Support only Windows x86-64 and macOS Apple Silicon ARM64. Intel macOS is out of
  scope.
- Stay within Phase 0 until its evidence gates are complete. Do not start the full
  production application yet.
- `.rpy` source is authoritative and must be preserved losslessly. ADR 0001 accepts
  exact source bytes, a conservative partial CST, and verified range patches.
- SDK work uses an exact-version allowlist and checksum-first staged installation.
  ADR 0002 records the accepted boundary; the SDK is not bundled.
- No desktop stack has been accepted. Tauri 2 is the leading hypothesis and Electron
  is the explicit fallback, subject to equivalent measured evidence.
- Use only repository-local Git identity with the configured GitHub noreply address.
  Never change global Git configuration.
- Keep fixtures synthetic. Do not commit SDKs, generated packages, signing material,
  credentials, private game content, or machine-specific paths.

## Completed evidence

- Repository foundation, agent guidance, product/architecture/data/UI/security/test
  documentation, roadmap, task tracking, audit, and low-fidelity UI checkpoint.
- Synthetic Crossroads at Sundown fixture corpus with byte/hash baselines, BOM/CRLF
  cases, and 12 passing lossless-source tests.
- Linux Ren'Py 8.5.3 SDK evidence for version, compile, lint, tests, normal run,
  development warp, diagnostics, and PC distribution.
- Nineteen dependency-free SDK installer/security tests covering checksums, archive
  containment, links, collisions, limits, interruption, command allowlisting,
  timeouts, output limits, version matching, trust, and diagnostic parsing.
- Disposable shared-contract Electron and Tauri shells under
  `spikes/desktop-shells/`, including Monaco, contained file access, SHA-guarded
  same-directory replacement, file watching, a mock SDK boundary, restrictive CSP,
  Electron preload isolation, and Tauri capabilities.
- The initial target matrix passed on Windows x64 and macOS ARM64: shared tests,
  Electron package and launch smoke, Tauri Rust tests, and Tauri packaging.
- Repository quality CI passed after the latest evidence documentation update.

Evidence links:

- [Green desktop target matrix](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329)
- [Green repository quality run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34568130411)

The retained target artifacts are unsigned research outputs, not a product release.

## Exact next bounded task

Bring the mock-SDK process boundary to equivalent, testable behavior before doing any
other desktop work.

Current implementation facts:

- `src/shared/node-adapter.ts` streams Electron child output, caps combined output,
  and supports cancellation, but does not yet expose a tested timeout or complete
  path/event redaction contract.
- `src-tauri/src/main.rs` currently calls `Command::output()` synchronously, returns a
  fixed completed run identifier, and cannot cancel an active child.
- `src/shared/contracts.ts` has start/cancel operations but no explicit validated
  timeout field or shared process-event schema.

Implement and prove:

1. One shared typed start/cancel/event contract with validated run identifiers and a
   bounded timeout.
2. Direct argument arrays only; no shell invocation and no arbitrary executable or
   command names.
3. Incremental stdout/stderr events with one combined byte cap and a terminal event
   that distinguishes exit, cancellation, timeout, and truncation.
4. Redaction of project/machine paths and environment values from events and errors.
5. Real cancellation of an active child in Electron and Tauri without orphaning it.
6. Deterministic mock modes for ordinary output, stderr, delay, and output flooding.
7. Unit tests for normal exit, denial, cancellation, timeout, truncation, direct
   arguments, redaction, unknown/stale run IDs, and cleanup.
8. The existing Windows x64/macOS ARM64 workflow remains green for both packaged
   candidates. Record commands, failures, and results in the desktop evidence file.

Keep this work disposable and stack-neutral. Do not accept a stack solely because
process parity passes.

## Remaining Phase 0 sequence

After process parity, complete these evidence gates in this order unless new evidence
shows a dependency conflict:

1. Packaged security-denial E2E and target filesystem/watch/atomicity/path cases.
2. Shared UI behavior for docking, drag/drop, media, keyboard, screen readers, focus,
   resizing, reduced motion, and current OS WebView differences.
3. Native credential-store prototypes with UI/log/project leak tests.
4. Deterministic 1k/10k/50k branch-graph measurements without blocking Monaco.
5. Preview/source-mapping fidelity experiment with faithful, approximate, and
   runtime-only behavior recorded explicitly.
6. Official Ren'Py 8.5.3 SDK and secure-install evidence on Windows and macOS,
   including paths, cancellation, package install/launch, signing, and quarantine
   observations.
7. Cold start, memory, artifact size by candidate, latency, flakiness, dependency and
   licence inventory, and developer-complexity comparison.
8. Select the desktop stack in a new ADR, revise the threat model and architecture for
   it, close the active spike task, and only then plan the Phase 1 production scaffold.

## Validation commands

From the repository root:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

For the desktop spike:

```bash
cd spikes/desktop-shells
npm ci
npm test
npm run build:ui
```

Rust tests and both packages must run through
`.github/workflows/desktop-spikes.yml` on the two target runners. Treat a failed job
as evidence to diagnose, not as a reason to infer behavior from the other platform.

## Git and publishing state

- The working tree was clean when this handover was prepared; no process-parity code
  change was started.
- The local and remote commit identifiers can differ because this environment lacked
  a shell HTTPS credential helper and published through the authenticated GitHub Git
  Data API. The implementation/evidence checkpoint had identical local and remote
  tree SHA `345a86f414b176b08d4204310bd7f69e61935af4` before this handover commit.
- Before publishing more work, fetch the current private `main` ref, create a commit
  with that remote commit as its parent, and update `main` without force. Verify the
  resulting remote tree exactly matches the intended local tree.
- Do not change visibility, create another repository, force-push, or rewrite history.

## User dependencies

There is no current product decision blocking Phase 0. Hosted CI covers the confirmed
architectures. Later physical install/launch and UX checks can use one dedicated,
low-privilege Windows x64 machine and one Apple Silicon Mac. Do not ask the user to
share runner registration tokens, signing keys, or credentials in chat.
