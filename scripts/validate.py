#!/usr/bin/env python3
"""Dependency-free structural, privacy, and documentation checks for the repository."""

from __future__ import annotations

from dataclasses import dataclass
import os
import re
import subprocess
import sys
from pathlib import Path

from codex_local import LocalConfigError, TEMPLATE, git_paths, is_local_only, read_config, read_config_bytes

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = (
    "AGENTS.md", "README.md", "SECURITY.md", "CONTRIBUTING.md", "LICENSE", "NOTICE",
    "docs/INDEX.md", "docs/PRODUCT.md", "docs/ARCHITECTURE.md", "docs/DATA_MODEL.md",
    "docs/UI.md", "docs/SECURITY.md", "docs/TESTING.md", "docs/ROADMAP.md",
    "docs/status/CURRENT.md", "docs/research/STACK_AND_SPIKES.md",
    "docs/research/PARSER_ROUND_TRIP.md", "docs/research/PARSER_SPIKE_RESULTS.md",
    "docs/adr/0001-lossless-source-model.md", "docs/adr/0002-versioned-renpy-sdk-adapter.md",
    "docs/adr/0003-tauri-desktop-runtime.md", "docs/dependencies/phase-1a.md",
    "docs/fixtures/REPRESENTATIVE_GAME.md", "tests/fixtures/crossroads-at-sundown/manifest.json",
    "spikes/lossless-source/source_model.py", "spikes/lossless-source/tests/test_source_model.py",
    "spikes/renpy-sdk/archive_safety.py", "spikes/renpy-sdk/sdk_adapter.py",
    "spikes/renpy-sdk/tests/test_archive_safety.py", "spikes/renpy-sdk/tests/test_sdk_adapter.py",
    "app/package.json", "app/package-lock.json", "app/Cargo.toml", "app/Cargo.lock",
    "app/src-tauri/tauri.conf.json", "app/src-tauri/capabilities/main.json",
    "app/src-tauri/permissions/core-request.toml", "app/src-core/src/lib.rs",
    "config/codex-client.example.json", "docs/LOCAL_CODEX_CONFIG.md",
    "docs/CI_ORCHESTRATION.md",
)
TEXT_SUFFIXES = {
    ".cjs", ".css", ".example", ".html", ".js", ".json", ".md", ".mjs", ".ps1",
    ".py", ".rpy", ".rs", ".sh", ".toml", ".ts", ".tsx", ".txt", ".yaml", ".yml",
}
TEXT_FILENAMES = {
    ".editorconfig", ".gitattributes", ".gitignore", "Dockerfile", "LICENSE", "Makefile", "NOTICE",
}
SECRET_PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "GitHub token": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b"),
    "OpenAI-style key": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "Anthropic-style key": re.compile(r"\bsk-ant-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "GitLab token": re.compile(r"\bglpat-[A-Za-z0-9_-]{20,}\b"),
    "npm token": re.compile(r"\bnpm_[A-Za-z0-9]{20,}\b"),
    "Slack token": re.compile(r"\bxox[baprs]-[A-Za-z0-9-]{20,}\b"),
    "Stripe live secret": re.compile(r"\bsk_live_[A-Za-z0-9]{16,}\b"),
}
MACHINE_PATHS = {
    "Windows user path": re.compile(r"[A-Za-z]:\\Users\\[^\\\s]+", re.IGNORECASE),
    "macOS user path": re.compile(r"/Users/[^/\s]+"),
    "Linux home path": re.compile(r"/home/[^/\s]+"),
}
EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
ALLOWED_EMAIL_DOMAINS = {"example.com", "users.noreply.github.com", "github.com"}
MARKDOWN_LINK = re.compile(r"(?<!!)\[[^\]]+\]\(([^)]+)\)")


@dataclass(frozen=True)
class StagedEntry:
    mode: str
    oid: str
    stage: int
    path_bytes: bytes

    @property
    def path(self) -> str:
        return os.fsdecode(self.path_bytes)


def _git(args: list[str], *, input_bytes: bytes | None = None) -> subprocess.CompletedProcess:
    try:
        return subprocess.run(
            ["git", *args], cwd=ROOT, input=input_bytes, capture_output=True,
            check=False, timeout=30,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise LocalConfigError("Git inspection failed; details withheld.") from None


def staged_entries() -> tuple[bytes, list[StagedEntry]]:
    result = _git(["ls-files", "--stage", "-z"])
    if result.returncode or len(result.stdout) > 32 * 1024 * 1024:
        raise LocalConfigError("Cannot inspect the staged candidate safely.")
    entries: list[StagedEntry] = []
    for item in result.stdout.split(b"\0"):
        if not item:
            continue
        try:
            metadata, path = item.split(b"\t", 1)
            mode, oid, stage = metadata.split(b" ", 2)
            entries.append(StagedEntry(mode.decode("ascii"), oid.decode("ascii"), int(stage), path))
        except (ValueError, UnicodeError):
            raise LocalConfigError("Invalid staged entry metadata; publication blocked.") from None
    return result.stdout, entries


def staged_blob(entry: StagedEntry) -> bytes:
    if entry.stage != 0 or entry.mode not in {"100644", "100755"}:
        raise LocalConfigError("Unmerged or disallowed staged entry mode; publication blocked.")
    if not re.fullmatch(r"[0-9a-f]{40,64}", entry.oid):
        raise LocalConfigError("Invalid staged object identity; publication blocked.")
    result = _git(["cat-file", "blob", entry.oid])
    if result.returncode or len(result.stdout) > 8 * 1024 * 1024:
        raise LocalConfigError("A staged object could not be read safely; publication blocked.")
    return result.stdout


def repository_files() -> list[Path]:
    paths = git_paths(ROOT, "--cached", "--others", "--exclude-standard")
    return [
        ROOT / relative for relative in sorted(set(paths))
        if not is_local_only(relative)
        and not (ROOT / relative).is_symlink()
        and (ROOT / relative).is_file()
    ]


def check_content(relative: Path, content: str, errors: list[str], *, snapshot: str) -> None:
    label = f"{relative} ({snapshot})"
    if content and not content.endswith("\n"):
        errors.append(f"missing final newline: {label}")
    suffix = relative.suffix.lower()
    for line_number, line in enumerate(content.splitlines(), 1):
        if line.endswith((" ", "\t")) and suffix != ".md":
            errors.append(f"trailing whitespace: {label}:{line_number}")
    privacy_patterns = SECRET_PATTERNS
    if relative != Path("scripts/validate.py"):
        privacy_patterns = {**privacy_patterns, **MACHINE_PATHS}
    for pattern_label, pattern in privacy_patterns.items():
        if pattern.search(content):
            errors.append(f"possible {pattern_label}: {label}")
    for match in EMAIL.finditer(content):
        domain = match.group(0).rsplit("@", 1)[1].lower()
        if domain not in ALLOWED_EMAIL_DOMAINS:
            errors.append(f"non-placeholder email address: {label}")


def check_staged_privacy(errors: list[str]) -> bytes:
    raw, entries = staged_entries()
    staged_names = {entry.path for entry in entries if entry.stage == 0}
    if TEMPLATE not in staged_names:
        errors.append("required client template is absent from the staged candidate")
    for entry in entries:
        relative_text = entry.path
        if is_local_only(relative_text):
            errors.append("local-only configuration/evidence is staged; path and values withheld")
            continue
        try:
            relative = Path(relative_text)
            content_bytes = staged_blob(entry)
        except LocalConfigError as error:
            errors.append(str(error))
            continue
        if relative.as_posix() == TEMPLATE:
            try:
                read_config_bytes(content_bytes, template=True)
            except LocalConfigError:
                errors.append("staged client example must be valid and contain placeholders only; values withheld")
        if relative.suffix.lower() not in TEXT_SUFFIXES and relative.name not in TEXT_FILENAMES:
            continue
        try:
            content = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            errors.append(f"not UTF-8: {relative} (staged)")
            continue
        check_content(relative, content, errors, snapshot="staged")
    return raw


def check_local_privacy(errors: list[str]) -> bytes:
    raw = check_staged_privacy(errors)
    tracked = git_paths(ROOT, "--cached")
    if any(is_local_only(p) for p in tracked):
        errors.append("local-only configuration/evidence is tracked; stop publication and untrack it")
    if any((ROOT / p).is_symlink() for p in tracked):
        errors.append("tracked symlink requires review; validator will not follow it")
    exposed = git_paths(ROOT, "--others", "--exclude-standard")
    if any(is_local_only(path) for path in exposed):
        errors.append("reserved private runtime artifact is exposed as untracked data; names withheld")
    try:
        read_config(ROOT / TEMPLATE, template=True)
    except LocalConfigError:
        errors.append("working client example must be valid and contain placeholders only; values withheld")
    return raw


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
            errors.append(f"not UTF-8: {relative} (working copy)")
            continue
        check_content(relative, content, errors, snapshot="working copy")


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
    result = _git(["diff", "--check", "--cached"])
    if result.returncode:
        errors.append("git diff --check failed; inspect the staged diff locally")


def main() -> int:
    errors: list[str] = []
    try:
        initial_index = check_local_privacy(errors)
        files = repository_files()
        check_required(errors)
        check_text(files, errors)
        check_markdown_links(files, errors)
        check_git_diff(errors)
        final_index, _ = staged_entries()
        if final_index != initial_index:
            errors.append("Git index changed during validation; re-run against the exact candidate")
    except (LocalConfigError, OSError):
        print("Validation could not inspect repository files safely; details withheld.", file=sys.stderr)
        return 1
    if errors:
        print("Validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print(f"Validation passed for {len(files)} repository files and the exact staged snapshot.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
