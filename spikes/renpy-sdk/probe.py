#!/usr/bin/env python3
"""Run a reproducible Ren'Py 8.5.3 Linux probe against a copied fixture."""

from __future__ import annotations

import argparse
import json
import platform
import re
import shutil
import tempfile
from dataclasses import asdict
from pathlib import Path, PureWindowsPath

from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import Command, command_argv, parse_version, run_bounded


def sdk_root_inside(installed: Path) -> Path:
    candidates = [installed, *installed.iterdir()]
    matches = [candidate for candidate in candidates if (candidate / "renpy.sh").is_file()]
    if len(matches) != 1:
        raise RuntimeError("installed archive must contain exactly one Ren'Py SDK root")
    return matches[0]


def _redact_text(value: str, redactions: tuple[Path, ...]) -> str:
    redacted = value
    candidates = {
        variant
        for path in redactions
        for variant in (str(path), str(path).replace("\\", "/"), str(path).replace("/", "\\"))
        if variant
    }
    for candidate in sorted(candidates, key=len, reverse=True):
        redacted = re.sub(re.escape(candidate), "<redacted-path>", redacted, flags=re.IGNORECASE)
    return redacted


def _redact_argument(value: str) -> str:
    if Path(value).is_absolute() or PureWindowsPath(value).is_absolute():
        return PureWindowsPath(value).name if PureWindowsPath(value).is_absolute() else Path(value).name
    return value


def result_record(
    name: str, result: object, redactions: tuple[Path, ...] = ()
) -> dict[str, object]:
    record = asdict(result)  # type: ignore[arg-type]
    record["name"] = name
    record["argv"] = [_redact_argument(arg) for arg in record["argv"]]
    record["output"] = _redact_text(str(record["output"])[-8_000:], redactions)
    for diagnostic in record["diagnostics"]:
        diagnostic["file"] = _redact_text(str(diagnostic["file"]), redactions)
        diagnostic["message"] = _redact_text(str(diagnostic["message"]), redactions)
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--sdk-root", type=Path)
    source.add_argument("--archive", type=Path)
    parser.add_argument("--checksums", type=Path)
    parser.add_argument("--fixture", required=True, type=Path)
    parser.add_argument("--allow-project-execution", action="store_true")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    if not args.allow_project_execution:
        parser.error("--allow-project-execution is required because Ren'Py loads project code")
    if args.archive and not args.checksums:
        parser.error("--checksums is required with --archive")

    with tempfile.TemporaryDirectory(prefix="renpy-sdk-probe-") as temporary:
        scratch = Path(temporary)
        if args.archive:
            filename = args.archive.name
            checksum_text = args.checksums.read_text(encoding="utf-8")
            digest = expected_sha256(checksum_text, filename)
            installed = scratch / "installed"
            install_verified_tar(args.archive, digest, installed)
            sdk_root = sdk_root_inside(installed)
        else:
            sdk_root = args.sdk_root.resolve()
            digest = "preinstalled-sdk"

        project = scratch / "fixture project — unicode"
        shutil.copytree(args.fixture.resolve(), project)
        redactions = (scratch, sdk_root, project, args.archive.resolve() if args.archive else sdk_root)
        records: list[dict[str, object]] = []

        version = run_bounded(command_argv(sdk_root, Command.VERSION), timeout_seconds=30)
        parsed_version = parse_version(version.output)
        records.append(result_record("version", version, redactions))
        help_result = run_bounded(command_argv(sdk_root, Command.HELP), timeout_seconds=30)
        records.append(result_record("help", help_result, redactions))

        for name, command, timeout, kwargs in (
            ("compile", Command.COMPILE, 120, {}),
            ("lint", Command.LINT, 120, {}),
            ("test", Command.TEST, 120, {"testcase": "sdk_adapter"}),
            ("run", Command.RUN, 8, {}),
            ("warp", Command.WARP, 8, {"warp_target": "script.rpy:4"}),
            ("distribute-help", Command.DISTRIBUTE_HELP, 60, {}),
            ("distribute", Command.DISTRIBUTE, 240, {"output_dir": scratch / "distributions"}),
        ):
            argv = command_argv(
                sdk_root,
                command,
                project,
                allow_project_execution=True,
                **kwargs,
            )
            records.append(result_record(name, run_bounded(argv, timeout_seconds=timeout), redactions))

        report = {
            "schema_version": 1,
            "platform": platform.platform(),
            "python": platform.python_version(),
            "sdk_version": parsed_version,
            "archive_sha256": digest,
            "fixture": args.fixture.name,
            "commands": records,
        }
        output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
        if args.output:
            args.output.write_text(output, encoding="utf-8")
        print(output, end="")

        expected_success = {
            "version", "help", "compile", "lint", "test", "distribute-help", "distribute"
        }
        failures = [record["name"] for record in records if record["name"] in expected_success and record["exit_code"] != 0]
        launches = [record for record in records if record["name"] in {"run", "warp"}]
        unsafe_launches = [
            record for record in launches
            if not record["timed_out"] or record["diagnostics"]
        ]
        if failures or unsafe_launches:
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
