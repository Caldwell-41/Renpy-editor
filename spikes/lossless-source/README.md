# Lossless source spike

Disposable Phase 0 evidence, not production architecture.

The spike proves a narrow claim: a source service can preserve original bytes, map
physical source ranges, classify a conservative supported subset, keep embedded or
unknown code opaque, and apply verified minimal patches without whole-file rewriting.
It does not claim to parse all Ren'Py grammar or validate semantic correctness.

Run from the repository root:

```bash
python3 -m unittest discover -s spikes/lossless-source/tests -v
python3 spikes/lossless-source/benchmark.py
```

The implementation has no third-party dependencies. It is deliberately isolated so
it can be deleted or replaced after the source-model ADR.
