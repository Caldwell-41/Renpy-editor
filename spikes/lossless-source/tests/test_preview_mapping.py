from __future__ import annotations

import hashlib
import shutil
import sys
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path

SPIKE_ROOT = Path(__file__).resolve().parents[1]
FIXTURE_ROOT = SPIKE_ROOT.parents[1] / "tests/fixtures/crossroads-at-sundown"
sys.path.insert(0, str(SPIKE_ROOT))

from preview_mapping import (  # noqa: E402
    AmbiguousSelection,
    Fidelity,
    MappingError,
    ResolvedBeat,
    RuntimeOnlyLocation,
    SourceLocation,
    StaleMapping,
    default_five_beat_specs,
    map_runtime_location,
    resolve_beat,
    select_beat,
    verify_current,
)


class PreviewMappingTests(unittest.TestCase):
    def setUp(self) -> None:
        self.specs = default_five_beat_specs()
        self.beats = tuple(resolve_beat(FIXTURE_ROOT, spec) for spec in self.specs)

    def test_five_beats_resolve_to_exact_unchanged_bytes(self) -> None:
        before = {
            path.relative_to(FIXTURE_ROOT).as_posix(): path.read_bytes()
            for path in FIXTURE_ROOT.rglob("*.rpy")
        }
        self.assertEqual(len(self.beats), 5)
        for beat in self.beats:
            source = (FIXTURE_ROOT / beat.relative_path).read_bytes()
            self.assertGreater(beat.end, beat.start)
            self.assertGreaterEqual(beat.end_line, beat.start_line)
            self.assertEqual(beat.revision, hashlib.sha256(source).hexdigest())
            verify_current(FIXTURE_ROOT, beat)
        after = {
            path.relative_to(FIXTURE_ROOT).as_posix(): path.read_bytes()
            for path in FIXTURE_ROOT.rglob("*.rpy")
        }
        self.assertEqual(before, after)

    def test_surface_claims_cover_all_fidelity_classes(self) -> None:
        claims = {
            claim.fidelity
            for beat in self.beats
            for claim in (beat.visual_list, beat.embedded_preview, beat.timeline)
        }
        self.assertEqual(claims, set(Fidelity))
        self.assertTrue(all(
            claim.limitation
            for beat in self.beats
            for claim in (beat.visual_list, beat.embedded_preview, beat.timeline)
        ))

    def test_stale_revision_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            copied = Path(temporary) / "fixture"
            shutil.copytree(FIXTURE_ROOT, copied)
            beat = resolve_beat(copied, self.specs[0])
            target = copied / beat.relative_path
            target.write_bytes(target.read_bytes() + b"\n# external edit\n")
            with self.assertRaisesRegex(StaleMapping, "source revision changed"):
                verify_current(copied, beat)

    def test_selection_uses_unique_narrowest_or_reports_ambiguity(self) -> None:
        beat = self.beats[0]
        broad = replace(beat, beat_id="broad", start=0, end=beat.end + 10)
        selected = select_beat((broad, beat), beat.relative_path, beat.start)
        self.assertIsInstance(selected, ResolvedBeat)
        self.assertEqual(selected.beat_id, beat.beat_id)  # type: ignore[union-attr]
        duplicate = replace(beat, beat_id="same-span")
        ambiguous = select_beat((beat, duplicate), beat.relative_path, beat.start)
        self.assertEqual(ambiguous, AmbiguousSelection((beat.beat_id, "same-span")))
        self.assertIsNone(select_beat(self.beats, "game/script.rpy", 0))

    def test_runtime_diagnostic_maps_to_exact_relative_source(self) -> None:
        location = map_runtime_location(FIXTURE_ROOT, "game/script.rpy", 5)
        self.assertIsInstance(location, SourceLocation)
        source = (FIXTURE_ROOT / "game/script.rpy").read_bytes()
        self.assertEqual(source[location.start:location.end], b"    with fade\n")  # type: ignore[union-attr]
        self.assertNotIn(str(FIXTURE_ROOT), repr(location))

    def test_unsafe_missing_and_out_of_range_locations_are_rejected(self) -> None:
        for path in ("/private/game/script.rpy", "../script.rpy", "game\\script.rpy"):
            with self.subTest(path=path), self.assertRaisesRegex(MappingError, "safe project-relative"):
                map_runtime_location(FIXTURE_ROOT, path, 1)
        with self.assertRaisesRegex(MappingError, "source file is unavailable"):
            map_runtime_location(FIXTURE_ROOT, "game/missing.rpy", 1)
        with self.assertRaisesRegex(MappingError, "outside source"):
            map_runtime_location(FIXTURE_ROOT, "game/script.rpy", 999)

    def test_translated_and_generated_locations_remain_runtime_only(self) -> None:
        translated = map_runtime_location(
            FIXTURE_ROOT, "game/tl/es/fixture_strings.rpy", 1, translated=True
        )
        generated = map_runtime_location(
            FIXTURE_ROOT, "game/generated/trace.rpy", 20, generated=True
        )
        self.assertIsInstance(translated, RuntimeOnlyLocation)
        self.assertIsInstance(generated, RuntimeOnlyLocation)
        self.assertEqual(translated.status, "runtime-only")  # type: ignore[union-attr]
        self.assertEqual(generated.status, "runtime-only")  # type: ignore[union-attr]


if __name__ == "__main__":
    unittest.main()
