#!/usr/bin/env python3
"""Emit bounded JSON for the disposable five-beat preview mapping probe."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from time import perf_counter

from preview_mapping import default_five_beat_specs, resolve_beat


def main() -> int:
    root = Path(__file__).resolve().parents[2] / "tests/fixtures/crossroads-at-sundown"
    started = perf_counter()
    beats = tuple(resolve_beat(root, spec) for spec in default_five_beat_specs())
    resolution_ms = round((perf_counter() - started) * 1_000, 3)
    record = {
        "schemaVersion": 1,
        "evidence": "preview-source-mapping-static",
        "passed": True,
        "fixture": "crossroads-at-sundown",
        "beatCount": len(beats),
        "resolutionMs": resolution_ms,
        "beats": [asdict(beat) for beat in beats],
        "projectPythonExecuted": False,
        "sourceAuthority": "exact-rpy-bytes",
    }
    print(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
