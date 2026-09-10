# Completed task: lossless source and fixture spike

**Completed:** 2026-09-10

## Outcome

Created the synthetic Crossroads at Sundown source corpus, byte/hash manifest, encoded
CRLF/BOM cases, and isolated exact-byte partial-CST/range-patch spike. Twelve tests pass;
the 620 KB microbenchmark's five seven-sample medians ranged from 68.45 to 75.62 ms
on Linux/Python 3.12.14 (median of medians: 73.16 ms).

## Decisions

[ADR 0001](../../adr/0001-lossless-source-model.md) accepts exact source bytes plus a
conservative partial CST and verified minimal patches as the source architecture. The
disposable Python tokenizer is not selected as production implementation.

## Validation

```bash
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 spikes/lossless-source/benchmark.py
python3 -m py_compile spikes/lossless-source/source_model.py \
  spikes/lossless-source/benchmark.py \
  spikes/lossless-source/tests/test_source_model.py
python3 scripts/validate.py
git diff --check
```

## Limitations and next action

Ren'Py SDK correctness, Windows/macOS behavior, incremental nested parsing, stable ID
remapping, atomic writes and three-way merge remain unproven. Next: validate the
integrated fixture through a versioned official Ren'Py 8.5.3 SDK adapter.
