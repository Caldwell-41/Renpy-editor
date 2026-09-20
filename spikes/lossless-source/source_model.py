"""Lossless byte-slice source model used only for the Phase 0 parser spike."""

from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import re
from typing import Iterable


SUPPORTED_HEADS = {
    "call",
    "camera",
    "default",
    "define",
    "elif",
    "else",
    "for",
    "hide",
    "if",
    "image",
    "jump",
    "label",
    "menu",
    "pass",
    "play",
    "queue",
    "return",
    "scene",
    "screen",
    "show",
    "stop",
    "style",
    "transform",
    "translate",
    "use",
    "voice",
    "while",
    "window",
    "with",
}
SCREEN_ATL_HEADS = {
    "align",
    "alpha",
    "at",
    "button",
    "frame",
    "grid",
    "hbox",
    "imagebutton",
    "linear",
    "null",
    "padding",
    "repeat",
    "spacing",
    "subpixel",
    "text",
    "textbutton",
    "vbox",
    "viewport",
    "xalign",
    "yalign",
}


class SourceError(ValueError):
    """Base error for rejected source operations."""


class RevisionConflict(SourceError):
    """The document changed after a patch was proposed."""


class PatchConflict(SourceError):
    """Patch ranges overlap or expected source bytes do not match."""


@dataclass(frozen=True, slots=True)
class SourceNode:
    kind: str
    start: int
    end: int
    line: int
    indent: int
    raw: bytes

    @property
    def is_opaque(self) -> bool:
        return self.kind.startswith("opaque")


@dataclass(frozen=True, slots=True)
class Patch:
    start: int
    end: int
    replacement: bytes
    expected: bytes


@dataclass(frozen=True, slots=True)
class SourceDocument:
    source: bytes
    nodes: tuple[SourceNode, ...]

    @property
    def revision(self) -> str:
        return sha256(self.source).hexdigest()

    def serialize(self) -> bytes:
        return self.source

    def node_at(self, offset: int) -> SourceNode | None:
        return next((node for node in self.nodes if node.start <= offset < node.end), None)


def _indent_width(content: bytes) -> int:
    width = 0
    for byte in content:
        if byte == 0x20:
            width += 1
        elif byte == 0x09:
            width += 8 - (width % 8)
        else:
            break
    return width


PYTHON_HEADER = re.compile(
    r"^(?:python\b|init(?:\s+[+-]?\d+)?\s+python\b).*:\s*(?:#.*)?$"
)
IDENTIFIER = re.compile(r"^[A-Za-z_]\w*$")


def _quoted_spans(data: bytes) -> list[tuple[int, int, int]]:
    """Return complete quote spans as (opening, content-end, delimiter)."""

    spans: list[tuple[int, int, int]] = []
    index = 0
    while index < len(data):
        quote = data[index]
        if quote not in (0x22, 0x27):
            index += 1
            continue
        escaped = False
        end = index + 1
        while end < len(data):
            current = data[end]
            if current == quote and not escaped:
                spans.append((index, end, quote))
                index = end + 1
                break
            if current == 0x5C and not escaped:
                escaped = True
            else:
                escaped = False
            end += 1
        else:
            return []
    return spans


def _dialogue_span(data: bytes) -> tuple[int, int, int] | None:
    """Recognise the deliberately small, single-line editable say subset."""

    line = data.rstrip(b"\r\n")
    leading = len(line) - len(line.lstrip(b" \t"))
    statement = line[leading:]
    try:
        statement.decode("utf-8")
    except UnicodeDecodeError:
        return None

    spans = _quoted_spans(statement)
    if not spans:
        return None
    last_end = spans[-1][1] + 1
    trailing = statement[last_end:].strip()
    if trailing and not trailing.startswith(b"#"):
        return None

    if spans[0][0] == 0:
        if len(spans) == 1:
            chosen = spans[0]  # narrator dialogue
        elif len(spans) == 2:
            between = statement[spans[0][1] + 1 : spans[1][0]]
            if not between or not between.isspace():
                return None
            chosen = spans[1]  # literal speaker followed by dialogue
        else:
            return None
    else:
        if len(spans) != 1:
            return None
        prefix = statement[: spans[0][0]].strip().decode("utf-8")
        if not prefix or not all(IDENTIFIER.fullmatch(token) for token in prefix.split()):
            return None
        chosen = spans[0]  # character plus optional image attributes

    return leading + chosen[0] + 1, leading + chosen[1], chosen[2]


def _classify(stripped: str, inside_python: bool, raw: bytes | None = None) -> str:
    if not stripped:
        return "blank"
    if stripped.startswith("#"):
        return "comment"
    if inside_python:
        return "opaque_python_body"
    if stripped.startswith("$"):
        return "opaque_python_line"
    if PYTHON_HEADER.fullmatch(stripped):
        return "opaque_python_header"

    if raw is not None:
        span = _dialogue_span(raw)
        if span is not None:
            return "narration" if stripped.startswith(('"', "'")) and len(_quoted_spans(raw.lstrip(b" \t").rstrip(b"\r\n"))) == 1 else "dialogue"

    head = stripped.split(None, 1)[0].rstrip(":")
    if head in SUPPORTED_HEADS:
        return head
    if head in SCREEN_ATL_HEADS:
        return f"visual_property:{head}"

    return "opaque_unknown"


def parse(source: bytes) -> SourceDocument:
    """Map every byte to a physical-line node without normalizing source text."""

    nodes: list[SourceNode] = []
    offset = 0
    python_indents: list[int] = []

    for line_number, raw in enumerate(source.splitlines(keepends=True), 1):
        content = raw.rstrip(b"\r\n")
        indent = _indent_width(content)
        decoded = content.decode("utf-8-sig" if line_number == 1 else "utf-8", "replace")
        stripped = decoded.lstrip(" \t")

        if stripped and not stripped.startswith("#"):
            while python_indents and indent <= python_indents[-1]:
                python_indents.pop()
        inside_python = bool(python_indents and indent > python_indents[-1])
        kind = _classify(stripped, inside_python, raw)

        nodes.append(SourceNode(kind, offset, offset + len(raw), line_number, indent, raw))
        if kind == "opaque_python_header":
            python_indents.append(indent)
        offset += len(raw)

    if offset < len(source):
        raw = source[offset:]
        decoded = raw.decode("utf-8", "replace")
        indent = _indent_width(raw)
        kind = _classify(decoded.lstrip(" \t"), bool(python_indents), raw)
        nodes.append(SourceNode(kind, offset, len(source), len(nodes) + 1, indent, raw))

    return SourceDocument(source, tuple(nodes))


def quoted_content_span(node: SourceNode, occurrence: int = 0) -> tuple[int, int]:
    """Return a quoted content byte range using a scanner, not a rewrite regex."""

    data = node.raw.rstrip(b"\r\n")
    found = -1
    index = 0
    while index < len(data):
        quote = data[index]
        if quote not in (0x22, 0x27):
            index += 1
            continue
        escaped = False
        end = index + 1
        while end < len(data):
            current = data[end]
            if current == quote and not escaped:
                if occurrence == 0:
                    return node.start + index + 1, node.start + end
                occurrence -= 1
                found = end
                break
            if current == 0x5C and not escaped:
                escaped = True
            else:
                escaped = False
            end += 1
        if end >= len(data):
            break
        index = max(end + 1, found + 1)
    raise SourceError(f"line {node.line} has no complete requested quoted string")


def make_quoted_patch(document: SourceDocument, node: SourceNode, replacement: str) -> Patch:
    if node.kind not in {"dialogue", "narration"}:
        raise SourceError(f"{node.kind} is not an editable dialogue node")
    span = _dialogue_span(node.raw)
    if span is None:
        raise SourceError(f"line {node.line} is outside the supported dialogue subset")
    if "\n" in replacement or "\r" in replacement or any(ord(char) < 0x20 and char != "\t" for char in replacement):
        raise SourceError("replacement must be single-line dialogue text")
    relative_start, relative_end, delimiter = span
    start, end = node.start + relative_start, node.start + relative_end
    escaped = replacement.replace("\\", "\\\\")
    escaped = escaped.replace(chr(delimiter), "\\" + chr(delimiter))
    return Patch(start, end, escaped.encode("utf-8"), document.source[start:end])


def apply_patches(document: SourceDocument, patches: Iterable[Patch], base_revision: str) -> bytes:
    if document.revision != base_revision:
        raise RevisionConflict("source revision changed before apply")

    ordered = sorted(patches, key=lambda patch: (patch.start, patch.end))
    previous_end = -1
    for patch in ordered:
        if patch.start < 0 or patch.end < patch.start or patch.end > len(document.source):
            raise PatchConflict("patch lies outside the source document")
        if patch.start < previous_end:
            raise PatchConflict("patch ranges overlap")
        if document.source[patch.start : patch.end] != patch.expected:
            raise PatchConflict("patch expected bytes do not match source")
        previous_end = patch.end

    result = bytearray()
    cursor = 0
    for patch in ordered:
        result.extend(document.source[cursor : patch.start])
        result.extend(patch.replacement)
        cursor = patch.end
    result.extend(document.source[cursor:])
    return bytes(result)


def assert_patch_sets_do_not_overlap(left: Iterable[Patch], right: Iterable[Patch]) -> None:
    """Reject overlapping staged/external edits expressed against the same base."""

    left_ranges = [(patch.start, patch.end) for patch in left]
    right_ranges = [(patch.start, patch.end) for patch in right]
    for left_start, left_end in left_ranges:
        for right_start, right_end in right_ranges:
            if left_start < right_end and right_start < left_end:
                raise PatchConflict("staged and external edits overlap")
