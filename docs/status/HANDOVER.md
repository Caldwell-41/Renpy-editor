# Phase 0 continuation handover

**Prepared:** 2026-09-12<br>
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
- Packaged probes now cover Electron renderer isolation, bridge shape, unlisted IPC,
  traversal, network, popup, and navigation denial, plus Tauri core read/replace,
  stale-hash, traversal, missing-file, process, symlink, watch, and complex-path cases.
  Run 34691607349 also revealed that expected Electron denials logged absolute packaged
  paths and that Tauri on Windows reported `navigationDenied: false` without returning
  a failing process status. Those are active evidence defects, not successful gates.
- Dependency caching and per-workflow/ref concurrency are implemented and measured.
  Warm run 34691607349 reduced Windows desktop time from 15:23 to 5:42 and macOS from
  2:34 to 1:57. SDK archive caching preserves checksum verification but did not
  materially improve the approximately 1:10 SDK probe.
- Corrective run 34699898544 passed the complete Windows packaged checkpoint, including
  explicit Tauri navigation denial. macOS passed every Electron assertion except the
  synthetic-sensitive-output observation and exited non-zero as intended. A delay-only
  follow-up reproduced the macOS failure, identifying packaged Electron child mode—not
  a simple event race—as the remaining difference. The allowlisted mock child now sets
  `ELECTRON_RUN_AS_NODE=1` in its otherwise minimal environment; target verification is
  recorded in green run 34700476448. That run closes equivalent packaged denial,
  filesystem, watch, symlink, long-path, and redaction evidence on both targets.
- Repository quality CI passed after the latest evidence documentation update.

Evidence links:

- [Green desktop target matrix](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329)
- [Green repository quality run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34568130411)
- [Green process-parity target matrix](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34577431423)
- [Green process-parity quality run](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34577431448)

The retained target artifacts are unsigned research outputs, not a product release.

## Exact next bounded task

Complete the shared UI/WebView behavior checkpoint using the existing shared Monaco
surface before credential-store or graph work.

Implement and prove on Windows x64 and macOS ARM64:

1. Use one shared deterministic UI fixture and the same assertions in Electron and
   Tauri; do not create separate product-like interfaces.
2. Exercise dock/panel resizing, native-window resize response, keyboard shortcuts,
   tab/focus order, focus return, and Monaco responsiveness.
3. Record automated accessibility semantics plus target screen-reader limitations;
   verify reduced-motion behavior without claiming a full manual assistive-tech pass.
4. Use synthetic files for drag/drop and local image/audio/video behavior. Record
   unsupported codecs or autoplay/platform policy differences explicitly.
5. Distinguish DOM/component evidence from packaged WebView2/WKWebView E2E, retain
   relevant measurements, and run the changed-path matrix only for the final coherent
   checkpoint.

Keep the work disposable and stack-neutral. Do not begin media/accessibility work or
accept a stack in this task.

## Remaining Phase 0 sequence

After process parity, complete these evidence gates in this order unless new evidence
shows a dependency conflict:

1. **Complete:** Packaged security-denial and equivalent target filesystem/watch/
   atomicity/path evidence.
2. **Next:** Shared UI behavior for docking, drag/drop, media, keyboard, screen readers, focus,
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

- Remote `main` was `b59a6f6496f6c50c4ef42d9be710ded68235b624` when this handover was reconciled.
  Commits `93647a7`, `69035da`, and `a6b4e58` contain the packaged denial, filesystem,
  watch, symlink, and Tauri WebView probes; later commits add the accepted cache work.
- The local and remote commit identifiers can differ when an environment lacks a shell
  HTTPS credential helper and publishes through the authenticated GitHub Git Data API.
- Before publishing more work, fetch the current private `main` ref, create a commit
  with that remote commit as its parent, and update `main` without force. Verify the
  resulting remote tree exactly matches the intended local tree.
- Do not change visibility, create another repository, force-push, or rewrite history.

## User dependencies

There is no current product decision blocking Phase 0. Hosted CI covers the confirmed
architectures. Later physical install/launch and UX checks can use one dedicated,
low-privilege Windows x64 machine and one Apple Silicon Mac. Do not ask the user to
share runner registration tokens, signing keys, or credentials in chat.
