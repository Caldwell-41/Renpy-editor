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
The isolated source spike adds 12 dependency-free unit/golden tests; the SDK boundary
adds 19 dependency-free security/adapter tests. The manually dispatched
`.github/workflows/sdk-spike.yml` performs the pinned official Linux integration run.
`.github/workflows/desktop-spikes.yml` packages disposable Electron and Tauri shells
on Windows x64 and macOS ARM64; these jobs are Phase 0 evidence, not release builds.
There is no production application build or cross-platform suite yet.

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
