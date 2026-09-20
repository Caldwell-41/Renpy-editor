#!/usr/bin/env python3
"""Deterministic microbenchmark for the disposable lossless-source spike."""

from __future__ import annotations

import importlib.util
import statistics
import sys
import time
from pathlib import Path


HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("source_model", HERE / "source_model.py")
assert SPEC and SPEC.loader
SOURCE_MODEL = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = SOURCE_MODEL
SPEC.loader.exec_module(SOURCE_MODEL)


def main() -> None:
    scene = b'label scene_%05d:\n    ar "Synthetic line %05d."\n    return\n\n'
    source = b"".join(scene % (index, index) for index in range(10_000))
    samples = []
    document = None
    for _ in range(7):
        started = time.perf_counter()
        document = SOURCE_MODEL.parse(source)
        samples.append((time.perf_counter() - started) * 1_000)
    assert document and document.serialize() == source
    print(f"bytes={len(source)} nodes={len(document.nodes)}")
    print(f"parse_ms_median={statistics.median(samples):.2f} samples=7")


if __name__ == "__main__":
    main()
