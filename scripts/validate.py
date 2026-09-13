#!/usr/bin/env python3
"""Dependency-free structural, privacy, and documentation checks for Phase 0."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md",
    "README.md",
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
TEXT_SUFFIXES = {".md", ".py", ".yml", ".yaml", ".toml", ".json", ".txt", ".example"}
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
    "GitHub token": re.compile(r"\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "OpenAI-style key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
}
MACHINE_PATHS = {
    "Windows user path": re.compile(r"[A-Za-z]:\\Users\\[^\\\s]+", re.IGNORECASE),
    "macOS user path": re.compile(r"/Users/[^/\s]+"),
    "Linux home path": re.compile(r"/home/[^/\s]+"),
}
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
ALLOWED_EMAIL_DOMAINS = {"example.com", "users.noreply.github.com", "github.com"}
MARKDOWN_LINK = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")


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
        if path.suffix.lower() not in TEXT_SUFFIXES and path.name not in {
            ".editorconfig", ".gitattributes", ".gitignore"
        }:
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
    for path in files:
        if path.suffix.lower() != ".md":
            continue
        content = path.read_text(encoding="utf-8")
        for target in MARKDOWN_LINK.findall(content):
            target = target.split("#", 1)[0]
            if not target or "://" in target or target.startswith(("mailto:", "#")):
                continue
            candidate = (path.parent / target).resolve()
            if not candidate.exists():
                errors.append(f"broken relative link in {path.relative_to(ROOT)}: {target}")


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
