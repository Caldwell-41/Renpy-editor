"""Checksum-first and containment-safe tar installation for the SDK spike."""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import shutil
import stat
import tarfile
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath


class ArchiveSafetyError(ValueError):
    """Raised before an unsafe or invalid archive can be promoted."""


@dataclass(frozen=True)
class ArchiveLimits:
    max_members: int = 100_000
    max_file_bytes: int = 512 * 1024 * 1024
    max_total_bytes: int = 2 * 1024 * 1024 * 1024
    max_depth: int = 32


WINDOWS_RESERVED = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}
SHA256_LINE = re.compile(r"^([0-9a-fA-F]{64})[ \t]+\*?([^\r\n]+)$")


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def expected_sha256(checksums: str, filename: str) -> str:
    in_sha256 = False
    for raw_line in checksums.splitlines():
        line = raw_line.strip()
        if line.lower() == "# sha256":
            in_sha256 = True
            continue
        if in_sha256 and line.startswith("# "):
            break
        if not in_sha256:
            continue
        match = SHA256_LINE.match(line)
        if match and match.group(2) == filename:
            return match.group(1).lower()
    raise ArchiveSafetyError(f"no SHA-256 entry for {filename!r}")


def verify_sha256(path: Path, expected: str) -> str:
    if not re.fullmatch(r"[0-9a-fA-F]{64}", expected):
        raise ArchiveSafetyError("expected SHA-256 must contain 64 hexadecimal characters")
    actual = sha256_file(path)
    if not hmac.compare_digest(actual, expected.lower()):
        raise ArchiveSafetyError(f"SHA-256 mismatch for {path.name}")
    return actual


def _safe_name(raw_name: str, limits: ArchiveLimits) -> PurePosixPath:
    if not raw_name or "\\" in raw_name or "\x00" in raw_name:
        raise ArchiveSafetyError(f"unsafe archive path: {raw_name!r}")
    name = raw_name.rstrip("/")
    path = PurePosixPath(name)
    if not name or path.is_absolute() or any(part in {"", ".", ".."} for part in path.parts):
        raise ArchiveSafetyError(f"unsafe archive path: {raw_name!r}")
    if len(path.parts) > limits.max_depth:
        raise ArchiveSafetyError(f"archive path is too deep: {raw_name!r}")
    for part in path.parts:
        stem = part.rstrip(" .").split(".", 1)[0].upper()
        if part != part.rstrip(" .") or stem in WINDOWS_RESERVED or ":" in part:
            raise ArchiveSafetyError(f"non-portable archive path: {raw_name!r}")
    return path


def _link_destination(member_path: PurePosixPath, link_name: str, hardlink: bool) -> PurePosixPath:
    if not link_name or "\\" in link_name or PurePosixPath(link_name).is_absolute():
        raise ArchiveSafetyError(f"unsafe link target: {link_name!r}")
    base = PurePosixPath() if hardlink else member_path.parent
    parts: list[str] = []
    for part in (base / PurePosixPath(link_name)).parts:
        if part in {"", "."}:
            continue
        if part == "..":
            if not parts:
                raise ArchiveSafetyError(f"link escapes archive root: {link_name!r}")
            parts.pop()
        else:
            parts.append(part)
    if not parts:
        raise ArchiveSafetyError(f"unsafe link target: {link_name!r}")
    return PurePosixPath(*parts)


def validate_members(members: list[tarfile.TarInfo], limits: ArchiveLimits = ArchiveLimits()) -> None:
    if len(members) > limits.max_members:
        raise ArchiveSafetyError("archive has too many members")
    seen: set[str] = set()
    portable_seen: set[str] = set()
    kinds: dict[PurePosixPath, str] = {}
    total = 0
    links: list[tuple[tarfile.TarInfo, PurePosixPath, PurePosixPath]] = []
    for member in members:
        path = _safe_name(member.name, limits)
        key = path.as_posix()
        portable_key = key.casefold()
        if key in seen:
            raise ArchiveSafetyError(f"duplicate archive entry: {key}")
        if portable_key in portable_seen:
            raise ArchiveSafetyError(f"case-colliding archive entry: {key}")
        seen.add(key)
        portable_seen.add(portable_key)
        if member.isfile():
            if member.size < 0 or member.size > limits.max_file_bytes:
                raise ArchiveSafetyError(f"archive member is too large: {key}")
            total += member.size
            kinds[path] = "file"
        elif member.isdir():
            kinds[path] = "directory"
        elif member.issym() or member.islnk():
            destination = _link_destination(path, member.linkname, member.islnk())
            kinds[path] = "symlink" if member.issym() else "hardlink"
            links.append((member, path, destination))
        else:
            raise ArchiveSafetyError(f"unsupported archive member type: {key}")
        if total > limits.max_total_bytes:
            raise ArchiveSafetyError("archive expands beyond the total size limit")
    for member, _, destination in links:
        target_kind = kinds.get(destination)
        if target_kind is None:
            raise ArchiveSafetyError(f"link target is absent: {member.linkname!r}")
        if member.islnk() and target_kind != "file":
            raise ArchiveSafetyError(f"hardlink target is not a regular file: {member.linkname!r}")


def _extract_validated(archive: tarfile.TarFile, members: list[tarfile.TarInfo], root: Path) -> None:
    root.mkdir(mode=0o700)
    paths = {member: root.joinpath(*_safe_name(member.name, ArchiveLimits()).parts) for member in members}
    for member in members:
        if member.isdir():
            paths[member].mkdir(parents=True, exist_ok=True)
    for member in members:
        destination = paths[member]
        if member.isfile():
            destination.parent.mkdir(parents=True, exist_ok=True)
            source = archive.extractfile(member)
            if source is None:
                raise ArchiveSafetyError(f"could not read archive member: {member.name}")
            with source, destination.open("xb") as output:
                shutil.copyfileobj(source, output, length=1024 * 1024)
            destination.chmod(0o755 if member.mode & stat.S_IXUSR else 0o644)
    for member in members:
        destination = paths[member]
        member_path = _safe_name(member.name, ArchiveLimits())
        if member.issym():
            destination.parent.mkdir(parents=True, exist_ok=True)
            os.symlink(member.linkname, destination)
        elif member.islnk():
            target = root.joinpath(*_link_destination(member_path, member.linkname, True).parts)
            os.link(target, destination)


def install_verified_tar(
    archive_path: Path,
    expected_digest: str,
    destination: Path,
    limits: ArchiveLimits = ArchiveLimits(),
) -> str:
    """Verify, safely extract to a sibling stage, then atomically promote."""
    digest = verify_sha256(archive_path, expected_digest)
    destination = destination.resolve()
    if destination.exists():
        raise ArchiveSafetyError(f"destination already exists: {destination.name}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=f".{destination.name}.stage-", dir=destination.parent))
    payload = stage / "payload"
    try:
        with tarfile.open(archive_path, mode="r:*") as archive:
            members = archive.getmembers()
            validate_members(members, limits)
            _extract_validated(archive, members, payload)
        os.replace(payload, destination)
    except Exception:
        shutil.rmtree(stage, ignore_errors=True)
        raise
    else:
        stage.rmdir()
    return digest


def install_validated_zip(
    archive_path: Path,
    destination: Path,
    limits: ArchiveLimits = ArchiveLimits(),
) -> str:
    """Containment-check a locally built package, stage it, and atomically promote it."""
    destination = destination.resolve()
    if destination.exists():
        raise ArchiveSafetyError(f"destination already exists: {destination.name}")
    destination.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=f".{destination.name}.stage-", dir=destination.parent))
    payload = stage / "payload"
    try:
        with zipfile.ZipFile(archive_path) as archive:
            members = archive.infolist()
            if len(members) > limits.max_members:
                raise ArchiveSafetyError("archive has too many members")
            seen: set[str] = set()
            portable_seen: set[str] = set()
            total = 0
            validated: list[tuple[zipfile.ZipInfo, PurePosixPath]] = []
            for member in members:
                path = _safe_name(member.filename, limits)
                key = path.as_posix()
                if key in seen:
                    raise ArchiveSafetyError(f"duplicate archive entry: {key}")
                if key.casefold() in portable_seen:
                    raise ArchiveSafetyError(f"case-colliding archive entry: {key}")
                seen.add(key)
                portable_seen.add(key.casefold())
                mode = member.external_attr >> 16
                if stat.S_ISLNK(mode):
                    raise ArchiveSafetyError(f"package symlink is unsupported: {key}")
                if not member.is_dir():
                    if member.file_size < 0 or member.file_size > limits.max_file_bytes:
                        raise ArchiveSafetyError(f"archive member is too large: {key}")
                    total += member.file_size
                    if total > limits.max_total_bytes:
                        raise ArchiveSafetyError("archive expands beyond the total size limit")
                validated.append((member, path))

            payload.mkdir(mode=0o700)
            for member, path in validated:
                target = payload.joinpath(*path.parts)
                if member.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(member) as source, target.open("xb") as output:
                    shutil.copyfileobj(source, output, length=1024 * 1024)
                mode = member.external_attr >> 16
                target.chmod(0o755 if mode & stat.S_IXUSR else 0o644)
        os.replace(payload, destination)
    except Exception:
        shutil.rmtree(stage, ignore_errors=True)
        raise
    else:
        stage.rmdir()
    return sha256_file(archive_path)
