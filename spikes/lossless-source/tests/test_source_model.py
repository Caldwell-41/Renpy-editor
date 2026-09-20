from __future__ import annotations

import base64
import importlib.util
import json
import sys
import unittest
from hashlib import sha256
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
SPIKE = ROOT / "spikes" / "lossless-source"
FIXTURE = ROOT / "tests" / "fixtures" / "crossroads-at-sundown"
SPEC = importlib.util.spec_from_file_location("source_model", SPIKE / "source_model.py")
assert SPEC and SPEC.loader
SOURCE_MODEL = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = SOURCE_MODEL
SPEC.loader.exec_module(SOURCE_MODEL)


class LosslessSourceTests(unittest.TestCase):
    def test_all_rpy_files_round_trip_byte_identically(self) -> None:
        files = sorted(FIXTURE.rglob("*.rpy"))
        self.assertGreaterEqual(len(files), 10)
        for path in files:
            with self.subTest(path=path.relative_to(FIXTURE)):
                source = path.read_bytes()
                self.assertEqual(SOURCE_MODEL.parse(source).serialize(), source)

    def test_encoded_crlf_and_bom_round_trip(self) -> None:
        for path in sorted((FIXTURE / "encoded").glob("*.b64")):
            with self.subTest(path=path.name):
                source = base64.b64decode(path.read_text(encoding="ascii"))
                self.assertEqual(SOURCE_MODEL.parse(source).serialize(), source)
        crlf = base64.b64decode((FIXTURE / "encoded/crlf_dialogue.rpy.b64").read_text())
        bom = base64.b64decode((FIXTURE / "encoded/bom_dialogue.rpy.b64").read_text())
        self.assertIn(b"\r\n", crlf)
        self.assertTrue(bom.startswith(b"\xef\xbb\xbf"))

    def test_minimal_dialogue_patch_changes_only_content_range(self) -> None:
        source = (FIXTURE / "game/chapters/chapter_01/scene_010.rpy").read_bytes()
        document = SOURCE_MODEL.parse(source)
        node = next(node for node in document.nodes if node.kind == "dialogue")
        patch = SOURCE_MODEL.make_quoted_patch(document, node, "A wider view, same quiet city.")
        result = SOURCE_MODEL.apply_patches(document, [patch], document.revision)
        self.assertEqual(result[: patch.start], source[: patch.start])
        self.assertEqual(result[patch.start : patch.start + len(patch.replacement)], patch.replacement)
        self.assertEqual(result[patch.start + len(patch.replacement) :], source[patch.end :])

    def test_quote_scanner_ignores_escaped_inner_quotes(self) -> None:
        source = (FIXTURE / "micro/valid/lexical.rpy").read_bytes()
        document = SOURCE_MODEL.parse(source)
        node = next(node for node in document.nodes if node.kind == "narration")
        start, end = SOURCE_MODEL.quoted_content_span(node)
        self.assertEqual(
            source[start:end],
            b'Escaped quote: \\"yes\\" and interpolation: [sample_text!q]',
        )

    def test_dialogue_patch_targets_what_not_literal_speaker(self) -> None:
        source = b'label start:\n    "Alice" "Original dialogue"\n'
        document = SOURCE_MODEL.parse(source)
        node = document.nodes[1]
        self.assertEqual(node.kind, "dialogue")
        patch = SOURCE_MODEL.make_quoted_patch(document, node, "Replacement dialogue")
        result = SOURCE_MODEL.apply_patches(document, [patch], document.revision)
        self.assertEqual(result, b'label start:\n    "Alice" "Replacement dialogue"\n')

    def test_dialogue_replacement_escapes_delimiter_and_backslashes(self) -> None:
        cases = [
            (b'    e "Original"\n', 'He said "hello" at C:\\tram.', b'    e "He said \\"hello\\" at C:\\\\tram."\n'),
            (b"    'Original'\n", "It's \\safe", b"    'It\\'s \\\\safe'\n"),
        ]
        for source, replacement, expected in cases:
            with self.subTest(source=source):
                document = SOURCE_MODEL.parse(source)
                patch = SOURCE_MODEL.make_quoted_patch(document, document.nodes[0], replacement)
                self.assertEqual(SOURCE_MODEL.apply_patches(document, [patch], document.revision), expected)

    def test_supported_character_narrator_and_mixed_quote_speakers(self) -> None:
        source = b'    "Narration"\n    e happy "Character"\n    \'Alice\' "Literal speaker" # keep\n'
        document = SOURCE_MODEL.parse(source)
        self.assertEqual([node.kind for node in document.nodes], ["narration", "dialogue", "dialogue"])
        literal = document.nodes[2]
        patch = SOURCE_MODEL.make_quoted_patch(document, literal, "Changed")
        self.assertEqual(
            SOURCE_MODEL.apply_patches(document, [patch], document.revision),
            b'    "Narration"\n    e happy "Character"\n    \'Alice\' "Changed" # keep\n',
        )

    def test_init_priority_python_strings_are_opaque(self) -> None:
        source = b'init -10 python:\n    greeting = "not dialogue"\n\nlabel start:\n    e "Dialogue"\n'
        document = SOURCE_MODEL.parse(source)
        self.assertEqual(document.nodes[0].kind, "opaque_python_header")
        self.assertEqual(document.nodes[1].kind, "opaque_python_body")
        with self.assertRaises(SOURCE_MODEL.SourceError):
            SOURCE_MODEL.make_quoted_patch(document, document.nodes[1], "unsafe")

        variants = SOURCE_MODEL.parse(
            b'python hide:\n    secret = "hidden"\npython in mystore:\n    other = "hidden"\n'
        )
        self.assertEqual(
            [node.kind for node in variants.nodes],
            ["opaque_python_header", "opaque_python_body", "opaque_python_header", "opaque_python_body"],
        )

    def test_unsupported_and_multiline_syntax_refuses_visual_edit(self) -> None:
        for source in [
            b'    e "first" + "second"\n',
            b'    e "unterminated\n',
            b'    e "line one\nline two"\n',
            b'    python:\n        value = \'quoted\'\n',
        ]:
            with self.subTest(source=source):
                document = SOURCE_MODEL.parse(source)
                for node in document.nodes:
                    if node.kind not in {"blank", "opaque_python_header"}:
                        self.assertNotIn(node.kind, {"dialogue", "narration"})

    def test_dialogue_patch_preserves_crlf_and_unrelated_bytes(self) -> None:
        source = b'# before\r\nlabel start:\r\n    e "Original"\r\n    $ untouched = "yes"\r\n'
        document = SOURCE_MODEL.parse(source)
        node = next(node for node in document.nodes if node.kind == "dialogue")
        patch = SOURCE_MODEL.make_quoted_patch(document, node, "Changed")
        result = SOURCE_MODEL.apply_patches(document, [patch], document.revision)
        self.assertEqual(result, b'# before\r\nlabel start:\r\n    e "Changed"\r\n    $ untouched = "yes"\r\n')
        self.assertEqual(result.count(b"\r\n"), source.count(b"\r\n"))

    def test_replacement_with_physical_newline_is_refused(self) -> None:
        document = SOURCE_MODEL.parse(b'    e "Original"\n')
        with self.assertRaisesRegex(SOURCE_MODEL.SourceError, "single-line"):
            SOURCE_MODEL.make_quoted_patch(document, document.nodes[0], "line one\nline two")

    def test_source_offset_maps_back_to_physical_node(self) -> None:
        source = b'label start:\n    "Mapped."\n'
        document = SOURCE_MODEL.parse(source)
        offset = source.index(b"Mapped")
        node = document.node_at(offset)
        self.assertIsNotNone(node)
        self.assertEqual(node.kind, "narration")
        self.assertEqual(node.line, 2)

    def test_opaque_python_block_survives_neighbour_edit(self) -> None:
        source = (FIXTURE / "micro/valid/unsupported_neighbour.rpy").read_bytes()
        document = SOURCE_MODEL.parse(source)
        opaque = [node for node in document.nodes if node.is_opaque]
        self.assertGreaterEqual(len(opaque), 6)
        first_dialogue = next(node for node in document.nodes if node.kind == "dialogue")
        patch = SOURCE_MODEL.make_quoted_patch(document, first_dialogue, "Edited nearby dialogue.")
        result = SOURCE_MODEL.apply_patches(document, [patch], document.revision)
        for node in opaque:
            self.assertIn(node.raw, result)

    def test_incomplete_input_is_preserved_and_uneditable_as_dialogue(self) -> None:
        source = (FIXTURE / "micro/recovery/incomplete_dialogue.rpy").read_bytes()
        document = SOURCE_MODEL.parse(source)
        self.assertEqual(document.serialize(), source)
        node = document.nodes[-1]
        with self.assertRaises(SOURCE_MODEL.SourceError):
            SOURCE_MODEL.make_quoted_patch(document, node, "replacement")

    def test_stale_revision_is_rejected(self) -> None:
        document = SOURCE_MODEL.parse(b'label start:\n    "Hello."\n')
        node = next(node for node in document.nodes if node.kind == "narration")
        patch = SOURCE_MODEL.make_quoted_patch(document, node, "Changed.")
        with self.assertRaises(SOURCE_MODEL.RevisionConflict):
            SOURCE_MODEL.apply_patches(document, [patch], "0" * 64)

    def test_mismatched_expected_bytes_are_rejected(self) -> None:
        source = b"0123456789"
        document = SOURCE_MODEL.parse(source)
        patch = SOURCE_MODEL.Patch(2, 4, b"AB", b"not-the-source")
        with self.assertRaises(SOURCE_MODEL.PatchConflict):
            SOURCE_MODEL.apply_patches(document, [patch], document.revision)

    def test_overlapping_staged_and_external_changes_are_rejected(self) -> None:
        left = SOURCE_MODEL.Patch(5, 10, b"left", b"12345")
        right = SOURCE_MODEL.Patch(8, 12, b"right", b"5678")
        with self.assertRaises(SOURCE_MODEL.PatchConflict):
            SOURCE_MODEL.assert_patch_sets_do_not_overlap([left], [right])

    def test_non_overlapping_changes_can_share_a_base(self) -> None:
        source = b"0123456789"
        document = SOURCE_MODEL.parse(source)
        left = SOURCE_MODEL.Patch(1, 2, b"A", b"1")
        right = SOURCE_MODEL.Patch(8, 9, b"B", b"8")
        SOURCE_MODEL.assert_patch_sets_do_not_overlap([left], [right])
        self.assertEqual(
            SOURCE_MODEL.apply_patches(document, [left, right], document.revision),
            b"0A234567B9",
        )

    def test_manifest_hashes_and_metadata_match(self) -> None:
        manifest = json.loads((FIXTURE / "manifest.json").read_text(encoding="utf-8"))
        self.assertEqual(manifest["schema_version"], 1)
        self.assertGreaterEqual(len(manifest["files"]), 10)
        for entry in manifest["files"]:
            path = FIXTURE / entry["path"]
            source = path.read_bytes()
            self.assertEqual(sha256(source).hexdigest(), entry["sha256"])
            self.assertEqual(len(source), entry["bytes"])


if __name__ == "__main__":
    unittest.main()
