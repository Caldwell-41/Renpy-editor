"""Verify both published metadata and bytes before selected public SDK execution."""
import hashlib
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "spikes/renpy-sdk"))
from archive_safety import expected_sha256

archive, checksums = map(Path, sys.argv[1:])
expected = "eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45"
assert expected_sha256(checksums.read_text(), "renpy-8.5.3-sdk.tar.bz2") == expected
assert hashlib.file_digest(archive.open("rb"), "sha256").hexdigest() == expected
print("Pinned official SDK metadata and archive checksum match.")
