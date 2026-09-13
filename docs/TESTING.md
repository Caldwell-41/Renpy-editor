# Testing strategy

## Current Phase 0 command

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
security/adapter/reporting tests. The path-scoped
`.github/workflows/sdk-spike.yml` performs the pinned official Windows x64, macOS ARM64,
and Linux-regression integration matrix.
`.github/workflows/desktop-spikes.yml` packages disposable Electron and Tauri shells
on Windows x64 and macOS ARM64; these jobs are Phase 0 evidence, not release builds.
The initial full matrix passed in
[run 34547542329](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34547542329).
Later packaged-denial probes ran in 34691607349, but the recorded job conclusion is not
sufficient evidence: Windows printed `navigationDenied: false` for Tauri while the step
still passed, and expected Electron denial exceptions exposed absolute packaged paths.
Corrective runs then proved those failure paths were enforced. The final
[packaged security/filesystem run 34700476448](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34700476448)
passed every explicit assertion on Windows x64 and macOS ARM64, including long paths,
symlinks, watch events, redaction, and Tauri navigation denial. The corrected shared UI/WebView
[run 34701370897](https://github.com/Caldwell-41/Renpy-editor/actions/runs/34701370897)
passes identical packaged wide/narrow assertions in Electron and Tauri on Windows
x64 and macOS ARM64. It covers DOM accessibility semantics, docks/resizing,
keyboard/focus, reduced motion, synthetic media drag/drop, codec observations, and a
loose Monaco edit guard; it does not claim a manual NVDA or VoiceOver pass.
That old run recorded only synthetic elements and codec capability strings. The
corrective target run must additionally decode and advance valid repository-controlled
Ogg Vorbis and VP9 WebM fixtures; until then, media playback is pending.
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
descendant-tree idle/stress observations, unpacked application payload size, 10k interaction/Monaco and 50k
stress behavior, dependency/licence locks, and source complexity. Runs 34732252587,
34732654915, and 34733107607 remain failed evidence for sampler attribution,
comparison-vs-diagnostic exit criteria, and macOS filter-yield flakiness. ADR 0003
supports Tauri 2 from the bounded gate set. The macOS observation may omit
launchd-owned WKWebView/XPC services and cannot support total-memory savings. There is
no production application build or Phase 1 cross-platform suite yet.

## Planned layers

| Layer | Deterministic coverage |
| --- | --- |
| Unit | Source tokens/CST, serializers, graph/state, path/archive safety, transactions, SDK adapters, LLM schemas/context |
| Golden | Byte-identical no-op round trips and minimal source-range patches over representative `.rpy` files |
| Property/fuzz | Parser recovery, indentation/strings, path normalization, archive entries, transaction sequences |
| Integration | Pinned official SDK compile, lint `--error-code`, tests, run harness, diagnostics, distributions |
| Desktop E2E | Project creation, scene edit, source sync, external conflict, preview/run, LLM review, Git checkpoint |
| Cross-platform | Windows and macOS file watching, paths, subprocesses, credential store, package/install/launch |
| Security/privacy | IPC denial, traversal/symlinks, hostile projects/LLM data, redacted logs, fixture/package PII scan |
| Performance | Large scripts/assets/graphs, incremental parse, patch latency, preview responsiveness, memory budgets |

## Representative source coverage

Fixtures cover comments/formatting, dialogue/narration, labels, menus and conditions,
variables, calls/jumps/returns, screens, ATL/transforms, audio/movies, translations,
embedded Python, custom statements, malformed/incomplete edits, and non-ASCII text.
Details and synthetic naming rules are in
[fixtures/REPRESENTATIVE_GAME.md](fixtures/REPRESENTATIVE_GAME.md).

## Required quality gate by change type

| Change | Minimum gate |
| --- | --- |
| Documentation/governance | Validator, link/privacy scan, `git diff --check` |
| Source model/serializer | Unit + golden + targeted fuzz + fixture SDK lint |
| Files/SDK/process | Unit + hostile-path/archive tests + platform integration |
| UI workflow | Unit/component + accessibility + changed-path desktop E2E |
| Generated Ren'Py | Official pinned SDK compile + lint + relevant automated test |
| Packaging/release | Windows/macOS package, install/launch smoke, contents/privacy scan |
| LLM adapter/action | Schema/adversarial tests, locality/consent UI, diff/partial acceptance, no-network default |

## Result recording

Spike and CI results record exact command, OS/architecture, dependency and SDK
versions, fixture revision, outcome, timings where relevant, and known exclusions. A green
Linux-only test cannot close a Windows/macOS criterion. Flaky tests are defects to
isolate and fix, not gates to retry indefinitely.

## Initial performance hypotheses

The spikes will establish evidence-based budgets. Starting targets to test—not yet
accepted requirements—are: visible edit feedback within 100 ms, incremental source
mapping within 250 ms for a typical scene file, responsive pan/filter on a 10,000-node
synthetic graph through virtualization, and no UI-thread blocking during SDK or Git
operations.
