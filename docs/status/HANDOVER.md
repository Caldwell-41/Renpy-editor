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
- Mock-SDK process parity now passes on both targets: typed bounded timeouts,
  allowlisted direct arguments, incremental bounded/redacted events, real
  cancellation, deterministic output modes, terminal reasons, stale-ID handling,
  and active-run cleanup.
- Repository quality CI passed after the latest evidence documentation update.

Evidence links:

- [Green desktop target matrix](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329)
- [Green repository quality run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34568130411)
- [Green process-parity target matrix](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34577431423)
- [Green process-parity quality run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34577431448)

The retained target artifacts are unsigned research outputs, not a product release.

## Exact next bounded task

Add packaged security-denial E2E and target filesystem/watch/atomicity/path evidence
before doing any other desktop work.

Implement and prove on Windows x64 and macOS ARM64:

1. Packaged Electron and Tauri probes deny unlisted IPC/capabilities, arbitrary
   process commands, navigation, network access, and filesystem escape.
2. Selected-root reads, file watching, external-change notification, SHA-stale write
   rejection, and same-directory atomic replacement behave equivalently.
3. Spaces, Unicode, target-appropriate long paths, missing files, symlinks, and path
   traversal are exercised without exposing absolute machine paths in UI or logs.
4. Watch latency and duplicate/coalesced event behavior are recorded rather than
   assumed identical between operating systems.
5. Tests execute against packaged candidates where the boundary depends on packaging;
   unit-only evidence is labelled separately.
6. The Windows x64/macOS ARM64 workflow remains green and the desktop evidence file
   records commands, failures, platform differences, and retained artifacts.

Keep the work disposable and stack-neutral. Do not begin media/accessibility work or
accept a stack in this task.

## Remaining Phase 0 sequence

After process parity, complete these evidence gates in this order unless new evidence
shows a dependency conflict:

1. **Next:** Packaged security-denial E2E and target filesystem/watch/atomicity/path cases.
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

- Process parity was implemented in commits `f7e62e1` and `144c0fe`; its target
  matrix and repository-quality run are green. No packaged-denial work has started.
- The local and remote commit identifiers can differ because this environment lacked
  a shell HTTPS credential helper and published through the authenticated GitHub Git
  Data API. The implementation/evidence checkpoint had identical local and remote
  tree SHA `bae8df4f546f9217c7fb79eec8cad2d5b24e616e` before this evidence-doc update.
- Before publishing more work, fetch the current private `main` ref, create a commit
  with that remote commit as its parent, and update `main` without force. Verify the
  resulting remote tree exactly matches the intended local tree.
- Do not change visibility, create another repository, force-push, or rewrite history.

## User dependencies

There is no current product decision blocking Phase 0. Hosted CI covers the confirmed
architectures. Later physical install/launch and UX checks can use one dedicated,
low-privilege Windows x64 machine and one Apple Silicon Mac. Do not ask the user to
share runner registration tokens, signing keys, or credentials in chat.
