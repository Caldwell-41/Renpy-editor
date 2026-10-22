#!/usr/bin/env python3
"""Dependency-free structural, privacy, and documentation checks for the repository."""

from __future__ import annotations

import html
import re
import string
import subprocess
import sys
import unicodedata
from collections.abc import Iterator
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md",
    "README.md",
    "SECURITY.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "NOTICE",
    "docs/INDEX.md",
    "docs/PRODUCT.md",
    "docs/ARCHITECTURE.md",
    "docs/DATA_MODEL.md",
    "docs/UI.md",
    "docs/SECURITY.md",
    "docs/TESTING.md",
    "docs/ROADMAP.md",
    "docs/status/CURRENT.md",
    "docs/research/STACK_AND_SPIKES.md",
    "docs/research/PARSER_ROUND_TRIP.md",
    "docs/research/PARSER_SPIKE_RESULTS.md",
    "docs/adr/0001-lossless-source-model.md",
    "docs/adr/0002-versioned-renpy-sdk-adapter.md",
    "docs/adr/0003-tauri-desktop-runtime.md",
    "docs/dependencies/phase-1a.md",
    "docs/fixtures/REPRESENTATIVE_GAME.md",
    "tests/fixtures/crossroads-at-sundown/manifest.json",
    "spikes/lossless-source/source_model.py",
    "spikes/lossless-source/tests/test_source_model.py",
    "spikes/renpy-sdk/archive_safety.py",
    "spikes/renpy-sdk/sdk_adapter.py",
    "spikes/renpy-sdk/tests/test_archive_safety.py",
    "spikes/renpy-sdk/tests/test_sdk_adapter.py",
    "app/package.json",
    "app/package-lock.json",
    "app/Cargo.toml",
    "app/Cargo.lock",
    "app/src-tauri/tauri.conf.json",
    "app/src-tauri/capabilities/main.json",
    "app/src-tauri/permissions/core-request.toml",
    "app/src-core/src/lib.rs",
)
TEXT_SUFFIXES = {
    ".cjs",
    ".css",
    ".example",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".ps1",
    ".py",
    ".rpy",
    ".rs",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}
TEXT_FILENAMES = {
    ".editorconfig",
    ".gitattributes",
    ".gitignore",
    "Dockerfile",
    "LICENSE",
    "Makefile",
    "NOTICE",
}
SKIP_PARTS = {
    ".git",
    ".toolchains",
    "__pycache__",
    "node_modules",
    "target",
    "dist",
    "dist-tests",
    "gen",
    "build",
    "out",
}

SECRET_PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "GitHub token": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "OpenAI-style key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "Anthropic-style key": re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "GitLab token": re.compile(r"\bglpat-[0-9A-Za-z_-]{20,}\b"),
    "npm token": re.compile(r"\bnpm_[0-9A-Za-z]{20,}\b"),
    "Slack token": re.compile(r"\bxox[baprs]-[0-9A-Za-z-]{20,}\b"),
    "Stripe live secret": re.compile(r"\bsk_live_[0-9A-Za-z]{16,}\b"),
}
MACHINE_PATHS = {
    "Windows user path": re.compile(r"[A-Za-z]:\\Users\\[^\\\s]+", re.IGNORECASE),
    "macOS user path": re.compile(r"/Users/[^/\s]+"),
    "Linux home path": re.compile(r"/home/[^/\s]+"),
}
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
ALLOWED_EMAIL_DOMAINS = {"example.com", "users.noreply.github.com", "github.com"}
MARKDOWN_DESTINATION = r"(<[^>\n]*>|(?:\\.|[^\s()\\]|\([^()\n]*\))+)"
MARKDOWN_LINK = re.compile(
    r"(?<!!)\[[^\]\n]+\]\(\s*" + MARKDOWN_DESTINATION
    + r"(?:[ \t]+(?:\"[^\"\n]*\"|'[^'\n]*'|\([^()\n]*\)))?\s*\)"
)
MARKDOWN_REFERENCE = re.compile(
    r"^ {0,3}\[([^\]\n]+)\]:[ \t]*" + MARKDOWN_DESTINATION, re.MULTILINE
)
INLINE_CODE = re.compile(r"(?<!`)(`+)(?!`)(.*?)\1(?!`)", re.DOTALL)


def markdown_prose(content: str) -> str:
    """Keep line positions while hiding fenced examples, indented code and comments."""
    lines = []
    fence = ""
    list_indent = None
    in_comment = False
    for line in content.splitlines(keepends=True):
        indent = len(line) - len(line.lstrip(" "))
        item = re.match(r"^ *(?:[-+*]|[0-9]+[.)])[ \t]+", line)
        is_list_item = item and (indent < 4 or (list_indent is not None and indent < list_indent + 4))
        if not fence and is_list_item:
            list_indent = item.end()
            logical_line = line[list_indent:]
        elif list_indent is not None and indent >= list_indent:
            logical_line = line[list_indent:]
        else:
            if line.strip():
                list_indent = None
            logical_line = line
        marker = re.match(r"^ {0,3}(`{3,}|~{3,})", logical_line)
        if fence:
            closing_fence = r" {0,3}" + re.escape(fence[0]) + r"{" + str(len(fence)) + r",}[ \t]*\n?"
            if re.fullmatch(closing_fence, logical_line):
                fence = ""
            lines.append(blank_example(line))
        elif marker and not in_comment:
            fence = marker[1]
            lines.append(blank_example(line))
        elif logical_line.startswith(("    ", "\t")) and not in_comment:
            lines.append(blank_example(line))
        else:
            # Comment syntax inside a code example is literal. Preserve positions
            # while masking only real comments, including ones spanning lines.
            scan = INLINE_CODE.sub(lambda m: blank_example(m[0]), logical_line)
            visible = []
            position = 0
            while position < len(logical_line):
                if in_comment:
                    end = logical_line.find("-->", position)
                    stop = len(logical_line) if end < 0 else end + 3
                    visible.append(blank_example(logical_line[position:stop]))
                    in_comment = end < 0
                    position = stop
                else:
                    start = scan.find("<!--", position)
                    if start < 0:
                        visible.append(logical_line[position:])
                        break
                    visible.append(logical_line[position:start])
                    position = start
                    in_comment = True
            lines.append("".join(visible))
    return "".join(lines)


def blank_example(text: str) -> str:
    return "".join("\n" if char == "\n" else " " for char in text)


def markdown_anchors(prose: str) -> set[str]:
    anchors = set(re.findall(r"<a\s+(?:id|name)=[\"']([^\"']+)", prose))
    used = set()
    previous = ""
    for line in prose.splitlines():
        heading = re.match(r"^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+[ \t]*)?$", line)
        title = heading[1] if heading else ""
        if not title and previous.strip() and re.fullmatch(r" {0,3}(?:=+|-+)[ \t]*", line):
            title = previous.strip()
        previous = line
        if not title:
            continue
        code = {}

        def preserve_code(match):
            token = f"\0{len(code)}\0"
            code[token] = match[2]
            return token

        title = INLINE_CODE.sub(preserve_code, title)
        title = MARKDOWN_LINK.sub(lambda m: m[0][1:m[0].index("]")], title)
        title = re.sub(r"<[^>]+>", "", title)
        title = re.sub(r"(?<!\w)(_+)(\S(?:.*?\S)?)\1(?!\w)", r"\2", title)
        title = html.unescape(title)
        for token, literal in code.items():
            title = title.replace(token, literal)
        title = title.lower()
        base = "".join(
            char for char in title
            if char in "-_ " or unicodedata.category(char)[0] in "LNM"
        )
        base = base.replace(" ", "-")
        slug = base
        ordinal = 0
        while slug in used:
            ordinal += 1
            slug = f"{base}-{ordinal}"
        used.add(slug)
        anchors.add(slug)
    return anchors


def markdown_link_targets(prose: str) -> Iterator[tuple[int, str]]:
    # Inline code is still needed for heading text, but never supplies a link target.
    prose = INLINE_CODE.sub(lambda m: blank_example(m[0]), prose)
    for match in MARKDOWN_LINK.finditer(prose):
        yield prose.count("\n", 0, match.start()) + 1, match[1].strip("<>")
    definitions = {
        " ".join(match[1].lower().split()): match[2].strip("<>")
        for match in MARKDOWN_REFERENCE.finditer(prose)
    }
    for match in re.finditer(r"(?<!!)\[([^\]\n]+)\](?:[ \t]*\[([^\]\n]*)\])?", prose):
        if prose[match.end():match.end() + 1] in ("(", ":"):
            continue
        label = " ".join((match[2] or match[1]).lower().split())
        if label in definitions:
            yield prose.count("\n", 0, match.start()) + 1, definitions[label]


def repository_files() -> list[Path]:
    return [
        path
        for path in ROOT.rglob("*")
        if path.is_file() and not any(part in SKIP_PARTS for part in path.relative_to(ROOT).parts)
    ]


def check_required(errors: list[str]) -> None:
    for relative in REQUIRED:
        if not (ROOT / relative).is_file():
            errors.append(f"missing required file: {relative}")


def check_text(files: list[Path], errors: list[str]) -> None:
    for path in files:
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in TEXT_FILENAMES:
            continue
        relative = path.relative_to(ROOT)
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            errors.append(f"not UTF-8: {relative}")
            continue
        if content and not content.endswith("\n"):
            errors.append(f"missing final newline: {relative}")
        for line_number, line in enumerate(content.splitlines(), 1):
            if line.endswith((" ", "\t")) and path.suffix.lower() != ".md":
                errors.append(f"trailing whitespace: {relative}:{line_number}")
        privacy_patterns = SECRET_PATTERNS
        if relative != Path("scripts/validate.py"):
            privacy_patterns = {**privacy_patterns, **MACHINE_PATHS}
        for label, pattern in privacy_patterns.items():
            if pattern.search(content):
                errors.append(f"possible {label}: {relative}")
        for match in EMAIL.finditer(content):
            domain = match.group(0).rsplit("@", 1)[1].lower()
            if domain not in ALLOWED_EMAIL_DOMAINS:
                errors.append(f"non-placeholder email address: {relative}")


def check_markdown_links(files: list[Path], errors: list[str]) -> None:
    prose_by_path = {
        path.resolve(): markdown_prose(path.read_text(encoding="utf-8"))
        for path in files if path.suffix.lower() == ".md"
    }
    anchors_by_path = {path: markdown_anchors(prose) for path, prose in prose_by_path.items()}
    for path, prose in prose_by_path.items():
        for line, target in markdown_link_targets(prose):
            target = re.sub(r"\\([" + re.escape(string.punctuation) + r"])", r"\1", target)
            if re.match(r"^[A-Za-z][A-Za-z0-9+.-]*:", target) or target.startswith("//"):
                continue
            parsed = urlsplit(target)
            candidate = (path.parent / unquote(parsed.path)).resolve() if parsed.path else path
            if not candidate.exists():
                errors.append(f"broken relative link in {path.relative_to(ROOT)}:{line}: {target}")
            elif parsed.fragment and candidate in anchors_by_path:
                fragment = unquote(parsed.fragment)
                if fragment not in anchors_by_path[candidate]:
                    errors.append(f"broken section link in {path.relative_to(ROOT)}:{line}: {target}")


def check_git_diff(errors: list[str]) -> None:
    result = subprocess.run(
        ["git", "diff", "--check", "--cached"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode:
        errors.append(result.stdout.strip() or result.stderr.strip() or "git diff --check failed")


def main() -> int:
    errors: list[str] = []
    files = repository_files()
    check_required(errors)
    check_text(files, errors)
    check_markdown_links(files, errors)
    check_git_diff(errors)
    if errors:
        print("Validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Validation passed for {len(files)} repository files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
