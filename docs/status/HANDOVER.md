# Phase 0 corrective handover

**Prepared:** 2026-09-13<br>
**Phase:** 0 corrective checkpoint complete; ready for Phase 1 planning<br>
**Repository:** `Caldwell-41/Renpy-editor` (confirmed private)<br>
**Branch:** `main`

## Read first

1. [`AGENTS.md`](../../AGENTS.md)
2. [Current status](CURRENT.md)
3. [ADR 0003](../adr/0003-tauri-desktop-runtime.md)
4. [Desktop evidence](../research/DESKTOP_SPIKE_RESULTS.md)
5. [Phase 1 scaffold task](../tasks/active/phase-1-scaffold.md)

The approved product brief remains authoritative. Phase 1 still requires separate
explicit approval; this handover is not that approval.

## Accepted boundaries

- Windows x86-64 and macOS Apple Silicon ARM64 are the only supported targets. Intel
  macOS is out of scope.
- `.rpy` files remain authoritative and losslessly preserved. ADR 0001 accepts exact
  bytes, a conservative partial CST, and verified minimal range patches.
- ADR 0002 accepts the exact-version Ren'Py adapter and checksum-first staged install.
  Ren'Py 8.5.3 is the verified compatibility baseline and is not bundled.
- ADR 0003 selects Tauri 2 with an unprivileged shared UI and a narrow Rust privileged
  core. Electron remains the explicit fallback under the ADR's reconsideration
  conditions.
- Projects, generated content, IPC payloads, archives, and LLM output remain
  untrusted. Opening source never executes project Python; trusted SDK operations use
  direct arguments, bounded/redacted output, cancellation, and a minimal environment.
- Phase 0 code under `spikes/` is disposable evidence. Do not silently promote it
  into the production architecture.

## Evidence closure

- Corrective source/preview suite: 19 source tests plus seven mapping tests; final
  quality run 34743055274 is green.
- Preview/source mapping: seven mapping tests and trusted runtime evidence classify
  behavior as faithful, approximate, or runtime-only.
- SDK/install: 24 tests plus final run
  [34731460283](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34731460283)
  on Windows x64, macOS ARM64, and the Linux regression baseline.
- Packaged denial/filesystem/process:
  [34700476448](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34700476448).
- Shared Monaco UI/WebView:
  [34701370897](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701370897).
- Native credential storage and leak scan:
  [34722411465](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722411465).
- Deterministic 1k/10k/50k graph:
  [34722954424](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722954424).
- Final equivalent comparison:
  [34733246868](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34733246868).
  Both target jobs and all twelve candidate launches passed. Tauri's unpacked
  application payloads were about 98% smaller; Electron started faster; Windows
  descendant-tree memory was higher for Tauri. The macOS Tauri sampler was incomplete,
  so no total-memory percentage is retained. Interaction and Monaco guards passed.

Failed runs remain evidence. Runs 34732252587 and 34732654915 exposed measurement
sampling/exit defects. Run 34733107607 exposed a 506.2 ms macOS Electron filter result
against the fixed 500 ms graph limit; a narrower chunking correction retained the
limit and the final run passed. Earlier packaged-denial, UI, credential, and SDK
failures are catalogued in their research documents.

## Known limitations

Manual NVDA/VoiceOver interaction, subjective real-media quality, physical Windows
SmartScreen, browser-origin macOS quarantine, Developer ID signing/notarisation,
signed upgrades, complete accounting of launchd-owned WKWebView services, and
production automatic-layout performance remain later validation work. They are not
inferred successes and did not distinguish the Phase 0 candidates enough to block the
decision.

Production file writing remains blocked by parser Gate E: the spike detects known
races and preserves recovery data, but cannot make a portable compare-and-swap promise
against non-cooperating external writers in the final validation-to-rename interval.
The attached review reproducer was not present in the checked-out workspace; every
reported case was independently reproduced against remote `main` at `831c9e3`.

## Corrective closure

- Implementation commits: `2b78d067`, `96ca1cd3`, `d11f9dd2`, and `08de1e4e`.
- [SDK run 34742452653](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34742452653)
  passes the trusted fixture on Linux, Windows x64, and macOS ARM64 at `2b78d067`;
  later commits changed only the desktop probe.
- [Desktop run 34743055306](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055306)
  passes both complete target jobs at `08de1e4e`, including explicit Tauri command
  permissions, authorised/unauthorised webviews, approved/forged projects,
  deterministic save regressions, and valid media playback.
- [Quality run 34743055274](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055274)
  passes at `08de1e4e`.
- Failed/cancelled corrective runs 34742452515, 34742542992, and 34742865491 remain
  evidence of the compile type mismatch and two non-portable probe observations.

## Exact stopping point

Stop here. Phase 1 may be planned but must not begin without explicit approval. Follow
[`phase-1-scaffold.md`](../tasks/active/phase-1-scaffold.md) only after that approval.

## Validation

The corrective implementation passed 27 desktop shared tests, 26 source/mapping tests,
24 SDK tests, the UI production build, repository validation, quality run 34743055274,
SDK run 34742452653, and both target jobs in desktop run 34743055306. The
documentation-only closure must pass:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

## Publishing rules

Confirm remote `main` before every write, commit coherently, and update it only by
fast-forward. Do not change visibility, force-push, rewrite history, commit generated
packages/SDKs/credentials/logs, or trigger expensive evidence workflows for
documentation-only closure.
