# Lossless source spike results

**Run:** 2026-09-10<br>
**Environment:** Linux 6.18.35 x86_64, Python 3.12.14<br>
**Scope:** Phase 0 source-preservation direction; not a full Ren'Py parser

## Outcome

The spike supports adopting an exact-byte source buffer plus conservative partial CST
and verified range patches as the persistence foundation. Unsupported or incomplete
content remains opaque source, and external grammar libraries may add structure but
must not own serialization. This direction is recorded in
[ADR 0001](../adr/0001-lossless-source-model.md).

## Candidate screen

GitHub discovery found five public projects named `tree-sitter-renpy`; none belongs to
the official Ren'Py organisation. The two newest candidates documented material gaps:

| Candidate at inspected commit | Evidence | Result |
| --- | --- | --- |
| [`rdelacrz/tree-sitter-renpy@6d098a7`](https://github.com/rdelacrz/tree-sitter-renpy/tree/6d098a7c1eb594a59395d51575a39fd0f55a4ac9) | One initial commit; no declared repository licence; README says indented block bodies are opaque `body_line` nodes after its indentation scanner was removed | Useful highlighting experiment, but it cannot map nested scene/menu/screen beats and cannot be adopted without a licence |
| [`ZeynTheDev/tree-sitter-renpy@8a98470`](https://github.com/ZeynTheDev/tree-sitter-renpy/tree/8a98470c0eba8d9c41d12e5a75118fa6aed4cfb7) | README identifies v0.4.0 and says screens, GUI/layout blocks, complex transforms, and ATL are not parsed; repository metadata exposes no declared licence | Broader statement experiment, but misses required initial-release surfaces and cannot be adopted without a licence |

The other discovered repositories were not advanced because a community grammar is
not required to test the core preservation strategy, and the leading candidates
already failed coverage/licence adoption gates. Re-evaluate them by pinned commit in a
later grammar-coverage spike; do not copy grammar code into this repository.

## Implemented evidence

The isolated `spikes/lossless-source` implementation:

- keeps the original bytes as the only serialized source;
- maps every physical line to an exact byte range and conservative kind;
- recognizes a limited Phase 1-oriented statement/property subset;
- marks embedded Python, `$` lines, and unknown syntax opaque;
- locates quoted dialogue content with a byte scanner;
- applies sorted, expected-byte patches against a SHA-256 base revision;
- rejects stale revisions, overlapping patches, unexpected bytes, and unsafe ranges;
- never executes or imports Ren'Py project code.

The synthetic corpus contains 15 `.rpy` files plus encoded CRLF and UTF-8-BOM cases.
It includes modular project source, dialogue, menus, state, calls/jumps, screens, ATL,
media statements, translation, embedded Python, unsupported neighbours, Unicode, and
incomplete editor buffers. `manifest.json` pins tracked bytes and SHA-256 values.

## Results

Command:

```bash
python3 -m unittest discover -s spikes/lossless-source/tests -v
```

Result: **12/12 tests passed**. Covered byte-identical no-op round trips, manifest
integrity, encoded CRLF/BOM, minimal dialogue patch boundaries, opaque Python
preservation, incomplete input, stale-base rejection, overlapping-change rejection,
non-overlapping patches, expected-byte mismatches, escaped quotes, and source mapping.

Command:

```bash
python3 spikes/lossless-source/benchmark.py
```

Result on the environment above: a deterministic 620,000-byte, 40,000-physical-line
synthetic source produced five seven-sample medians from 68.45 to 75.62 ms, with a
**73.16 ms median of those medians**. This is a disposable microbenchmark, not a
cross-platform performance guarantee.

## Gate assessment

| Gate | Result | Qualification |
| --- | --- | --- |
| A — no-op fidelity | Pass for corpus | Serialization returns original bytes; broader syntax corpus will continue growing |
| B — minimal edits | Partial pass | Dialogue edit proven; other Phase 1 semantic edit builders remain future work; SDK validation pending |
| C — partial visual fallback | Direction passes | Opaque Python/unknown nodes preserve location/bytes; grouped nested CST and UI badge remain unimplemented |
| D — live editing/mapping | Partial pass | Exact physical-line/source offsets and incomplete preservation proven; incremental reparse and stable-ID remap pending |
| E — external transactions | Partial pass | Base hash, expected bytes and overlap detection proven; three-way merge, watcher and atomic disk recovery pending |

## Limitations and next evidence

- This tokenizer is intentionally not production code and does not parse full nested
  Ren'Py grammar, Python expressions, multiline strings, or semantic references.
- It ran only on Linux. Windows/macOS line, path, watcher and atomic-write behavior is
  unproven.
- The integrated fixture has not yet been compiled or linted by Ren'Py 8.5.3; media
  microfixtures intentionally reference absent synthetic files and require isolation.
- Stable editor IDs, incremental parsing, CST recovery quality, semantic patch builders,
  and three-way reconciliation require production-oriented spikes after SDK validation.

The next bounded task should run the official Ren'Py 8.5.3 SDK adapter against the
integrated fixture, correct any syntax/order assumptions, and record structured
compile/lint diagnostics before desktop-stack implementation begins.
