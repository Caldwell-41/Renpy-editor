"""Disposable Phase 0 preview/source-mapping evidence; not production code."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from hashlib import sha256
from pathlib import Path, PurePosixPath


class MappingError(ValueError):
    """A mapping cannot be resolved without guessing."""


class StaleMapping(MappingError):
    """The authoritative source bytes changed after mapping."""


class Fidelity(str, Enum):
    FAITHFUL = "faithful"
    APPROXIMATE = "approximate"
    RUNTIME_ONLY = "runtime-only"


@dataclass(frozen=True, slots=True)
class SurfaceClaim:
    fidelity: Fidelity
    limitation: str


@dataclass(frozen=True, slots=True)
class BeatSpec:
    beat_id: str
    relative_path: str
    start_anchor: bytes
    end_anchor: bytes
    visual_list: SurfaceClaim
    embedded_preview: SurfaceClaim
    timeline: SurfaceClaim


@dataclass(frozen=True, slots=True)
class ResolvedBeat:
    beat_id: str
    relative_path: str
    start: int
    end: int
    start_line: int
    end_line: int
    revision: str
    visual_list: SurfaceClaim
    embedded_preview: SurfaceClaim
    timeline: SurfaceClaim


@dataclass(frozen=True, slots=True)
class AmbiguousSelection:
    beat_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class SourceLocation:
    relative_path: str
    line: int
    start: int
    end: int
    revision: str
    status: str = "exact"


@dataclass(frozen=True, slots=True)
class RuntimeOnlyLocation:
    relative_path: str
    line: int
    reason: str
    status: str = "runtime-only"


def _safe_relative_path(value: str) -> PurePosixPath:
    path = PurePosixPath(value)
    if not value or "\\" in value or path.is_absolute() or ".." in path.parts:
        raise MappingError("source path is not a safe project-relative path")
    return path


def _read_contained(root: Path, relative_path: str) -> tuple[str, bytes]:
    relative = _safe_relative_path(relative_path)
    root_resolved = root.resolve()
    candidate = (root_resolved / Path(*relative.parts)).resolve()
    try:
        candidate.relative_to(root_resolved)
    except ValueError as exc:
        raise MappingError("source path escapes the project root") from exc
    if not candidate.is_file():
        raise MappingError(f"source file is unavailable: {relative.as_posix()}")
    return relative.as_posix(), candidate.read_bytes()


def _unique_anchor(source: bytes, anchor: bytes, beat_id: str) -> int:
    first = source.find(anchor)
    if first < 0 or source.find(anchor, first + 1) >= 0:
        raise MappingError(f"beat {beat_id} anchor is missing or ambiguous")
    return first


def _line_bounds(source: bytes, offset: int) -> tuple[int, int]:
    start = source.rfind(b"\n", 0, offset) + 1
    newline = source.find(b"\n", offset)
    return start, len(source) if newline < 0 else newline + 1


def _line_number(source: bytes, offset: int) -> int:
    return source.count(b"\n", 0, offset) + 1


def resolve_beat(root: Path, spec: BeatSpec) -> ResolvedBeat:
    relative, source = _read_contained(root, spec.relative_path)
    anchor_start = _unique_anchor(source, spec.start_anchor, spec.beat_id)
    anchor_end = _unique_anchor(source, spec.end_anchor, spec.beat_id)
    if anchor_end < anchor_start:
        raise MappingError(f"beat {spec.beat_id} anchors are reversed")
    start, _ = _line_bounds(source, anchor_start)
    _, end = _line_bounds(source, anchor_end + len(spec.end_anchor) - 1)
    return ResolvedBeat(
        beat_id=spec.beat_id,
        relative_path=relative,
        start=start,
        end=end,
        start_line=_line_number(source, start),
        end_line=_line_number(source, max(start, end - 1)),
        revision=sha256(source).hexdigest(),
        visual_list=spec.visual_list,
        embedded_preview=spec.embedded_preview,
        timeline=spec.timeline,
    )


def verify_current(root: Path, beat: ResolvedBeat) -> None:
    _, source = _read_contained(root, beat.relative_path)
    if sha256(source).hexdigest() != beat.revision:
        raise StaleMapping(f"beat {beat.beat_id} source revision changed")


def select_beat(
    beats: tuple[ResolvedBeat, ...], relative_path: str, offset: int
) -> ResolvedBeat | AmbiguousSelection | None:
    relative = _safe_relative_path(relative_path).as_posix()
    matches = [
        beat for beat in beats
        if beat.relative_path == relative and beat.start <= offset < beat.end
    ]
    if not matches:
        return None
    shortest = min(beat.end - beat.start for beat in matches)
    narrowest = [beat for beat in matches if beat.end - beat.start == shortest]
    if len(narrowest) != 1:
        return AmbiguousSelection(tuple(sorted(beat.beat_id for beat in narrowest)))
    return narrowest[0]


def map_runtime_location(
    root: Path,
    relative_path: str,
    line: int,
    *,
    translated: bool = False,
    generated: bool = False,
) -> SourceLocation | RuntimeOnlyLocation:
    relative = _safe_relative_path(relative_path).as_posix()
    if translated or generated:
        reason = "translated runtime location" if translated else "generated runtime location"
        return RuntimeOnlyLocation(relative, line, reason)
    relative, source = _read_contained(root, relative)
    lines = source.splitlines(keepends=True)
    if line < 1 or line > len(lines):
        raise MappingError(f"runtime line is outside source: {relative}:{line}")
    start = sum(len(item) for item in lines[: line - 1])
    end = start + len(lines[line - 1])
    return SourceLocation(relative, line, start, end, sha256(source).hexdigest())


def default_five_beat_specs() -> tuple[BeatSpec, ...]:
    faithful = Fidelity.FAITHFUL
    approximate = Fidelity.APPROXIMATE
    runtime = Fidelity.RUNTIME_ONLY
    return (
        BeatSpec(
            "literal-dialogue", "game/testcases.rpy",
            b'    ar neutral "Runtime mapping first beat."',
            b'    ar neutral "Runtime mapping first beat."',
            SurfaceClaim(faithful, "literal speaker token and dialogue bytes only"),
            SurfaceClaim(approximate, "text layout, tags, substitution, and font metrics need Ren'Py"),
            SurfaceClaim(faithful, "declared narrative order only"),
        ),
        BeatSpec(
            "scene-transition", "game/testcases.rpy",
            b'    scene expression Solid("#18202b")', b"    with dissolve",
            SurfaceClaim(faithful, "scene and transition statements retain exact source order"),
            SurfaceClaim(approximate, "solid colour can be staged but fade timing/easing is engine-owned"),
            SurfaceClaim(approximate, "declared transition has no authoritative rendered duration"),
        ),
        BeatSpec(
            "atl-transform", "game/testcases.rpy",
            b"    show alex neutral at radio_left", b"    show alex neutral at radio_left",
            SurfaceClaim(faithful, "ATL statements and exact ranges can be listed"),
            SurfaceClaim(approximate, "staging can illustrate offsets but not Ren'Py ATL execution"),
            SurfaceClaim(approximate, "declared segments are visible; runtime interpolation is not simulated"),
        ),
        BeatSpec(
            "python-screen-state", "game/screens/route_status.rpy",
            b"screen route_status():", b'                text "News heard" color "#9ad1ff"',
            SurfaceClaim(approximate, "screen structure is partial and Python expressions stay opaque"),
            SurfaceClaim(runtime, "interpolation, conditionals, styles, and screen evaluation require Ren'Py"),
            SurfaceClaim(runtime, "state-dependent screen changes require runtime state"),
        ),
        BeatSpec(
            "media-runtime", "micro/valid/media_and_atl.rpy",
            b"label media_statements:", b"    return",
            SurfaceClaim(faithful, "media commands, channels, and authored order can be listed"),
            SurfaceClaim(runtime, "decode, playback, movie display, channel policy, and fades require Ren'Py"),
            SurfaceClaim(runtime, "authoritative duration and synchronization require decoded runtime media"),
        ),
    )
