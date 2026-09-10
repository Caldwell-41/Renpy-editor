from __future__ import annotations

import hashlib
import io
import sys
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from archive_safety import ArchiveLimits, ArchiveSafetyError, expected_sha256, install_verified_tar


def make_tar(path: Path, entries: list[tuple[str, bytes | str, str]]) -> str:
    with tarfile.open(path, "w:bz2") as archive:
        for name, value, kind in entries:
            info = tarfile.TarInfo(name)
            if kind == "file":
                data = value if isinstance(value, bytes) else value.encode()
                info.size = len(data)
                archive.addfile(info, io.BytesIO(data))
            elif kind == "dir":
                info.type = tarfile.DIRTYPE
                archive.addfile(info)
            elif kind == "symlink":
                info.type = tarfile.SYMTYPE
                info.linkname = str(value)
                archive.addfile(info)
            elif kind == "hardlink":
                info.type = tarfile.LNKTYPE
                info.linkname = str(value)
                archive.addfile(info)
    return hashlib.sha256(path.read_bytes()).hexdigest()


class ArchiveSafetyTests(unittest.TestCase):
    def test_extracts_valid_archive_and_promotes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "sdk.tar.bz2"
            digest = make_tar(archive, [("renpy/file.txt", b"ok", "file")])
            destination = root / "installed"
            self.assertEqual(install_verified_tar(archive, digest, destination), digest)
            self.assertEqual((destination / "renpy/file.txt").read_bytes(), b"ok")
            self.assertFalse(any(root.glob(".installed.stage-*")))

    def test_checksum_mismatch_leaves_no_destination(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "sdk.tar.bz2"
            make_tar(archive, [("file", b"ok", "file")])
            with self.assertRaisesRegex(ArchiveSafetyError, "mismatch"):
                install_verified_tar(archive, "0" * 64, root / "installed")
            self.assertFalse((root / "installed").exists())

    def test_parses_only_sha256_section(self) -> None:
        text = "# md5\n" + "0" * 64 + " sdk.tar\n# sha256\n" + "a" * 64 + " sdk.tar\n"
        self.assertEqual(expected_sha256(text, "sdk.tar"), "a" * 64)

    def test_rejects_traversal_absolute_and_backslash_paths(self) -> None:
        for bad in ("../escape", "/absolute", "dir\\escape"):
            with self.subTest(bad=bad), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                archive = root / "bad.tar.bz2"
                digest = make_tar(archive, [(bad, b"bad", "file")])
                with self.assertRaises(ArchiveSafetyError):
                    install_verified_tar(archive, digest, root / "installed")

    def test_rejects_escaping_symlink_and_hardlink(self) -> None:
        cases = [("root/link", "../../escape", "symlink"), ("root/link", "../escape", "hardlink")]
        for entry in cases:
            with self.subTest(entry=entry), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                archive = root / "bad.tar.bz2"
                digest = make_tar(archive, [entry])
                with self.assertRaises(ArchiveSafetyError):
                    install_verified_tar(archive, digest, root / "installed")

    def test_rejects_duplicate_case_collision_and_reserved_names(self) -> None:
        cases = [
            [("same", b"a", "file"), ("same", b"b", "file")],
            [("Name", b"a", "file"), ("name", b"b", "file")],
            [("root/CON.txt", b"a", "file")],
        ]
        for entries in cases:
            with self.subTest(entries=entries), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                archive = root / "bad.tar.bz2"
                digest = make_tar(archive, entries)
                with self.assertRaises(ArchiveSafetyError):
                    install_verified_tar(archive, digest, root / "installed")

    def test_rejects_oversized_deep_and_existing_destination(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "bad.tar.bz2"
            digest = make_tar(archive, [("a/b/c", b"1234", "file")])
            with self.assertRaises(ArchiveSafetyError):
                install_verified_tar(archive, digest, root / "one", ArchiveLimits(max_file_bytes=3))
            with self.assertRaises(ArchiveSafetyError):
                install_verified_tar(archive, digest, root / "two", ArchiveLimits(max_depth=2))
            existing = root / "existing"
            existing.mkdir()
            with self.assertRaisesRegex(ArchiveSafetyError, "already exists"):
                install_verified_tar(archive, digest, existing)

    def test_interrupted_extraction_never_promotes(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive = root / "sdk.tar.bz2"
            digest = make_tar(archive, [("renpy/file", b"ok", "file")])
            destination = root / "installed"
            with patch("archive_safety._extract_validated", side_effect=RuntimeError("interrupted")):
                with self.assertRaisesRegex(RuntimeError, "interrupted"):
                    install_verified_tar(archive, digest, destination)
            self.assertFalse(destination.exists())
            self.assertFalse(any(root.glob(".installed.stage-*")))


if __name__ == "__main__":
    unittest.main()
