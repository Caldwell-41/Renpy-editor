# Phase 0 completion handover

**Prepared:** 2026-09-13<br>
**Phase:** 0 complete; Phase 1 awaiting explicit approval<br>
**Repository:** `Caldwell-41/Renpy-editor` (confirmed private)<br>
**Branch:** `main`

## Read first

1. [`AGENTS.md`](../../AGENTS.md)
2. [Current status](CURRENT.md)
3. [ADR 0003](../adr/0003-tauri-desktop-runtime.md)
4. [Desktop evidence](../research/DESKTOP_SPIKE_RESULTS.md)
5. [Phase 1 scaffold task](../tasks/active/phase-1-scaffold.md)

The approved product brief remains authoritative. Phase 1 requires a separate explicit
approval; this handover is not that approval.

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

- Source-model golden/token/CST evidence: 12 core tests, ADR 0001 accepted.
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
  Both target jobs and all twelve candidate launches passed. Tauri packages were about
  98% smaller; Electron started faster; Tauri used much less observed macOS memory but
  more Windows WebView2 process-tree memory. Interaction and Monaco guards passed for
  both.

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

## Exact next bounded task

Wait for explicit Phase 1 approval. Once approved, follow
[`phase-1-scaffold.md`](../tasks/active/phase-1-scaffold.md): create the minimal
production Tauri workspace and CI skeleton, preserve the accepted source/security/SDK
ports, and prove the initial command/capability boundary on both targets. Do not add
authoring features, LLM/Git integrations, SDK bundling, release signing, or copy the
spike wholesale during that scaffold checkpoint.

## Validation

The final implementation checkpoint passed 21 desktop shared tests, the UI production
build, repository validation, quality run 34733246871, and both target jobs in desktop
run 34733246868. The Phase 0 documentation closure must pass:

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
