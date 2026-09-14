# Testing strategy

## Current production scaffold and Phase 0 regression commands

From `app/`, the Phase 1A production checks are:

```bash
npm ci --ignore-scripts
npm run check
npm run build
cargo fmt --check --all
cargo test -p loomlight-core --locked
cargo test -p loomlight-desktop --locked
npm exec -- tauri build -- --locked
```

The full desktop Rust test, package, and injected packaged-WebView probe run separately
on Windows x64 and macOS ARM64 in `production-scaffold.yml`. The core-only Cargo test is
also runnable where a complete Tauri desktop build environment is unavailable. This is
not a substitute for either target gate.

Retain the Phase 0 regression suite:

```bash
python3 scripts/validate.py
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 -m unittest discover -s spikes/renpy-sdk/tests -v
python3 spikes/lossless-source/benchmark.py
git diff --check
```

The validator checks the required document structure, UTF-8/final newlines, internal
Markdown links, common secret patterns, personal email domains, and user-home paths.
The isolated source/preview spike has 26 dependency-free unit/golden tests (19 source
tests and seven fidelity-mapping tests); the SDK boundary adds 24 dependency-free
security/adapter/reporting tests. The Phase 0 SDK and desktop evidence workflows remain
available by explicit `workflow_dispatch`, but no longer run automatically on routine
pushes. This keeps the historical regression/evidence machinery reproducible without
spending Windows/macOS runner capacity during current production development.
`.github/workflows/sdk-spike.yml` performs the pinned official Windows x64, macOS ARM64,
and Linux-regression integration matrix when manually requested.
`.github/workflows/desktop-spikes.yml` packages disposable Electron and Tauri shells
on Windows x64 and macOS ARM64 when manually requested; these jobs are Phase 0 evidence,
not release builds.
The initial full matrix passed in
[run 34547542329](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329).
Later packaged-denial probes ran in 34691607349, but the recorded job conclusion is not
sufficient evidence: Windows printed `navigationDenied: false` for Tauri while the step
still passed, and expected Electron denial exceptions exposed absolute packaged paths.
Corrective runs then proved those failure paths were enforced. The final
[packaged security/filesystem run 34700476448](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34700476448)
passed every explicit assertion on Windows x64 and macOS ARM64, including long paths,
symlinks, watch events, redaction, and Tauri navigation denial. The corrected shared
UI/WebView [run 34701370897](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701370897)
passes identical packaged wide/narrow assertions in Electron and Tauri on Windows x64
and macOS ARM64. It covers DOM accessibility semantics, docks/resizing, keyboard/focus,
reduced motion, synthetic media drag/drop, codec observations, and a loose Monaco edit
guard; it does not claim a manual NVDA or VoiceOver pass.
Corrective [run 34743055306](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34743055306)
additionally decoded and advanced valid repository-controlled Ogg Vorbis and VP9 WebM
fixtures in both candidates on both supported targets.
The packaged credential-store
[run 34722411465](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722411465)
passes on both targets: no renderer/credential IPC, OS-native round trip and cleanup,
bounded/redacted probe output, and zero plaintext sentinel matches in tracked source,
the project fixture, packages, executables/bundles, or retained-artifact inputs.
The packaged branch-graph
[run 34722954424](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34722954424)
passes the same deterministic 1,000-, 10,000-, and 50,000-node workload in Electron
Chromium and Tauri WebView2/WKWebView on both targets. It asserts the predeclared 10k
usability budget, viewport culling, stable relayout, interaction p95, and scheduled
Monaco delay/edit bounds; the 50k case remains a separate stress result.
The preview/source-mapping follow-up
[run 34723797776](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34723797776)
also passed the trusted Ren'Py 8.5.3 Linux runtime case for the mapped transition,
named transform, screen presence, literal dialogue, and Python-dependent state. Static
and Linux evidence are supplemented by the final target SDK/install
[run 34731460283](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34731460283).
That matrix passed exact version, compile/lint/test/run/warp, bounded target
distribution, containment-checked package installation and launch, plus unsigned
Authenticode and macOS codesign/Gatekeeper/quarantine observations. Physical
SmartScreen, quarantine-origin, signing, and notarisation UX remain release checks.
The final equivalent desktop comparison
[run 34733246868](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34733246868)
passed all three fresh launches per candidate and target, recorded cold start,
descendant-tree idle/stress observations, unpacked application payload size, 10k
interaction/Monaco and 50k stress behavior, dependency/licence locks, and source
complexity. Runs 34732252587, 34732654915, and 34733107607 remain failed evidence for
sampler attribution, comparison-vs-diagnostic exit criteria, and macOS filter-yield
flakiness. ADR 0003 supports Tauri 2 from the bounded gate set. The macOS observation
may omit launchd-owned WKWebView/XPC services and cannot support total-memory savings.
The Phase 1A production workflow runs the full Windows x64/macOS ARM64 package matrix
for relevant production changes pushed to `main` and by explicit manual dispatch. It
does not run on pull requests, so a reviewed change is not charged once before merge
and again after merge, and documentation-only changes do not launch desktop packaging.
Routine runs retain lightweight packaged smoke and dependency/licence evidence only;
full application bundles are uploaded only for manual production runs. The workflow
continues to use locked npm/Cargo dependencies and commit-pinned checkout, Node setup,
Rust cache, and artifact-upload Actions.
[Run 34782008915](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34782008915)
passed the complete macOS ARM64 gate and packaged Windows x64, where one subsequently
corrected renderer-secret false positive remained. Runs 34782646465 and 34782646499
then failed at hosted-runner setup with zero steps after repository artifact storage
reported quota exhaustion; they remain failure evidence, not passes.
[Run 34792368716](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34792368716)
at `0a6a6c5d` closes the corrected gate: Windows x64 job 103818859749 and macOS ARM64
job 103818859932 each passed locked install, frontend and Rust tests, packaging,
injected packaged-WebView denial smoke, artifact privacy scan, and dependency/licence
inventory. Lightweight evidence artifacts 10328234722 and 10328548641 were retained;
full packages were intentionally not uploaded on this routine push.

Phase 1B closed on
[run 34797222616](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34797222616)
at `85690bd4ebde95f9ee707175e54336bfd83af0f8`. Windows x64 job 103832559663
and macOS ARM64 job 103832559907 each passed the same 24-test transaction suite (plus
the ignored worker invoked by its parent at seven real termination boundaries),
desktop tests, packaging, packaged denial smoke, artifact secret scan, and the 76 npm /
437 Cargo dependency inventory. Both used Node 24.19.0, npm 11.9.0, and Rust/Cargo
1.90.0. Retained lightweight artifacts are 10330271852 (Windows) and 10329987775
(macOS); routine full-package upload was intentionally skipped.

Run 34796513503 passed at the preceding implementation commit. Contract reconciliation
then found that pre-commit stage/accepted copies and journal temporaries used ordinary
`sync_all` on macOS; `85690bd4` routes them through the required platform flush, and
the final matrix above exercises that correction.

Run 34796369255 at `cc1ea6b8` is retained failed evidence. Both targets stopped at the
core step because the repository-write transport had truncated `Cargo.lock`; the
complete locally validated lockfile was restored in `ecc369a7` before the passing
matrix. This was a diagnosed committed-input defect, not a flaky target result.

## Planned layers

| Layer | Deterministic coverage |
| --- | --- |
| Unit | Source tokens/CST, serializers, graph/state, path/archive safety, transactions, SDK adapters, schemas |
| Golden | Byte-identical no-op round trips and minimal source-range patches over representative `.rpy` files |
| Property/fuzz | Parser recovery, indentation/strings, path normalization, archive entries, transaction sequences |
| Integration | Pinned official SDK compile, lint `--error-code`, tests, run harness, diagnostics, distributions |
| Desktop E2E | Project create/save/close/reopen, Scene edit, source sync, external conflict, preview/run, Git checkpoint |
| Cross-platform | Windows and macOS file watching, paths, subprocesses, credential store, package/install/launch |
| Security/privacy | IPC denial, traversal/symlinks, hostile projects, redacted logs, fixture/package PII scan |
| Performance | Large scripts/assets/graphs, incremental parse, patch latency, preview responsiveness, memory budgets |

Phase 2 LLM-specific schema/adversarial/context/consent tests are intentionally not a
Phase 1 Desktop E2E requirement.

## Phase 1 milestone gates

The implementation sequence in
[`tasks/active/phase-1-vertical-slice.md`](tasks/active/phase-1-vertical-slice.md) is
quality-gated rather than one large feature branch:

| Milestone | Minimum evidence before proceeding |
| --- | --- |
| 1A scaffold | Locked fresh install/build/test; command/capability denial; CSP/navigation/network/ambient host denial; privacy/licence checks; packaged Windows x64/macOS ARM64 smoke; semantic theme tokens/reduced-motion foundation |
| 1B transactions | External-writer races, stale revisions, path/file identity and symlink substitution, crash-point recovery, durability semantics, undo/redo conflict boundaries on both targets |
| 1C project lifecycle | New-project staging/failure cleanup; detected/install/browse SDK; conventional Ren'Py template paths and standard GUI; create/validate/close/reopen; game runs without `.renpy-editor/` |
| 1D authoring models | Character/appearance, copied image/audio assets, automatic-discovery naming collisions, basic variables, source round-trip/reload identity |
| 1E Scene | Bounded Beat workflow, preview/partial state, choice linking, Story tree file lifecycle, stale `.rpyc` cleanup/ghost-script regression, undo/redo, accessibility, Quiet Studio Dark conformance |
| 1F Source | Partial CST/range mapping, no-op/minimal-patch golden tests, direct source→Scene sync, exact custom-code preservation, external conflicts |
| 1G completion | Branch graph from shared edges, authoritative SDK diagnostics/run, local Git status/diff/checkpoint, technical-surface design consistency |
| 1H acceptance | Fresh end-to-end Windows/macOS create→author→save→close→reopen→validate→run→Git workflow plus transaction, source, privacy/security, packaged app, accessibility, and visual-system gates |

A green result from one platform cannot close a cross-platform milestone. Failed and
flaky runs remain evidence; isolate and fix defects rather than retrying until green.

The Phase 1B core suite also launches a child copy of the Rust test process and exits
it at prepared, staged, commit-intent, exchanged, verified, committed, and durable
journal boundaries. A fresh service then classifies the retained state. In-process
hooks deterministically race external content/identity/path changes before and after
the platform operation. The production Windows/macOS matrix runs this same suite in
release mode and retains its log with the existing packaged-boundary and dependency
evidence; it is not duplicated in a second expensive matrix.

## Representative source coverage

Fixtures cover comments/formatting, dialogue/narration, labels, menus and conditions,
variables, calls/jumps/returns, screens, ATL/transforms, audio/movies, translations,
embedded Python, custom statements, malformed/incomplete edits, and non-ASCII text.
Details and synthetic naming rules are in
[fixtures/REPRESENTATIVE_GAME.md](fixtures/REPRESENTATIVE_GAME.md).

Phase 1 adds production fixtures for the generated conventional project scaffold,
Scene-per-file lifecycle, automatic image/audio discovery naming, stale `.rpyc`
cleanup, unsupported/custom-code placement, and external-edit/recovery cases. Fixtures
remain synthetic and must not contain private game content.

## Required quality gate by change type

| Change | Minimum gate |
| --- | --- |
| Documentation/governance | Validator, link/privacy scan, `git diff --check` |
| Source model/serializer | Unit + golden + targeted fuzz + fixture SDK lint |
| Files/SDK/process | Unit + hostile-path/archive/transaction tests + platform integration |
| Scene/file lifecycle | Reference checks + transaction/recovery + stale `.rpyc` cleanup + SDK lint/run |
| UI workflow | Unit/component + keyboard/accessibility + changed-path desktop E2E + visual-token conformance |
| Generated Ren'Py | Official pinned SDK compile + lint + relevant automated test + standard-template smoke |
| Packaging/release | Windows/macOS package, install/launch smoke, contents/privacy scan |
| LLM adapter/action (Phase 2+) | Schema/adversarial tests, locality/consent UI, diff/partial acceptance, no-network default |

## Result recording

Spike and CI results record exact command, OS/architecture, dependency and SDK
versions, fixture revision, outcome, timings where relevant, and known exclusions. A
green Linux-only test cannot close a Windows/macOS criterion. Flaky tests are defects
to isolate and fix, not gates to retry indefinitely.

## Initial performance hypotheses

Phase 0 established initial bounded evidence; production Phase 1 should remeasure where
the real implementation could materially differ. Starting targets to test, rather than
silently assume, are visible edit feedback within 100 ms, incremental source mapping
within 250 ms for a typical Scene file, responsive pan/filter on a 10,000-node graph
through virtualization where that graph work is in scope, and no UI-thread blocking
during SDK or Git operations.
