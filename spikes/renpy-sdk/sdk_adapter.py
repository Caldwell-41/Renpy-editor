"""Version-specific, allowlisted Ren'Py subprocess adapter for the Phase 0 spike."""

from __future__ import annotations

import os
import queue
import re
import signal
import subprocess
import threading
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


SUPPORTED_VERSION = "8.5.3"
VERSION_PATTERN = re.compile(r"Ren'Py (?P<version>\d+\.\d+(?:\.\d+)?)")
DIAGNOSTIC_PATTERNS = (
    re.compile(r'File "(?P<file>[^"]+)", line (?P<line>\d+)(?:, in [^:]+)?:?\s*(?P<message>.*)'),
    re.compile(r"(?P<file>[^\r\n:]+\.rpy):(?P<line>\d+):\s*(?P<message>.+)"),
)


class AdapterError(RuntimeError):
    pass


class Command(str, Enum):
    VERSION = "version"
    HELP = "help"
    COMPILE = "compile"
    LINT = "lint"
    TEST = "test"
    RUN = "run"
    WARP = "warp"
    DISTRIBUTE = "distribute"
    DISTRIBUTE_HELP = "distribute-help"


PROJECT_CODE_COMMANDS = {
    Command.COMPILE,
    Command.LINT,
    Command.TEST,
    Command.RUN,
    Command.WARP,
    Command.DISTRIBUTE,
    Command.DISTRIBUTE_HELP,
}


@dataclass(frozen=True)
class Diagnostic:
    file: str
    line: int
    severity: str
    message: str


@dataclass(frozen=True)
class CommandResult:
    argv: tuple[str, ...]
    exit_code: int
    output: str
    duration_seconds: float
    timed_out: bool
    output_limited: bool
    diagnostics: tuple[Diagnostic, ...]


def launcher_for(sdk_root: Path, platform: str = os.name) -> tuple[str, ...]:
    root = sdk_root.resolve()
    if platform == "nt":
        executable = root / "lib" / "py3-windows-x86_64" / "python.exe"
        renpy_py = root / "renpy.py"
        if not executable.is_file() or not renpy_py.is_file():
            raise AdapterError("Ren'Py Windows launcher files are missing")
        return (str(executable), str(renpy_py))
    executable = root / "renpy.sh"
    if not executable.is_file():
        raise AdapterError("Ren'Py launcher is missing")
    return (str(executable),)


def command_argv(
    sdk_root: Path,
    command: Command,
    project: Path | None = None,
    *,
    warp_target: str | None = None,
    output_dir: Path | None = None,
    testcase: str | None = None,
    allow_project_execution: bool = False,
    platform: str = os.name,
) -> tuple[str, ...]:
    prefix = launcher_for(sdk_root, platform)
    if command in PROJECT_CODE_COMMANDS and not allow_project_execution:
        raise AdapterError("project-loading command requires explicit trust")
    if command in PROJECT_CODE_COMMANDS and (project is None or not project.resolve().is_dir()):
        raise AdapterError("an existing project directory is required")
    if command is Command.VERSION:
        return (*prefix, "--version")
    if command is Command.HELP:
        return (*prefix, "--help")
    project_arg = str(project.resolve()) if project else ""
    if command is Command.COMPILE:
        return (*prefix, project_arg, "compile")
    if command is Command.LINT:
        return (*prefix, project_arg, "lint", "--error-code")
    if command is Command.TEST:
        if testcase and not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.-]*", testcase):
            raise AdapterError("testcase name is invalid")
        return (*prefix, project_arg, "test", *((testcase,) if testcase else ()))
    if command is Command.RUN:
        return (*prefix, project_arg, "run")
    if command is Command.WARP:
        if not warp_target or not re.fullmatch(r"[^:\r\n]+\.rpy:\d+", warp_target):
            raise AdapterError("warp target must be a relative .rpy filename and line")
        return (*prefix, project_arg, "run", "--warp", warp_target)
    if command in {Command.DISTRIBUTE, Command.DISTRIBUTE_HELP}:
        launcher_project = str((sdk_root.resolve() / "launcher").resolve())
        args = (*prefix, launcher_project, "distribute", project_arg)
        if command is Command.DISTRIBUTE_HELP:
            return (*args, "--help")
        if output_dir is None:
            raise AdapterError("distribution output directory is required")
        args += (
            "--destination", str(output_dir.resolve()),
            "--package", "pc",
            "--no-update",
        )
        return args
    raise AdapterError(f"command is not allowlisted: {command!r}")


def parse_version(output: str) -> str:
    match = VERSION_PATTERN.search(output)
    if not match:
        raise AdapterError("could not parse Ren'Py version")
    version = match.group("version")
    if version != SUPPORTED_VERSION:
        raise AdapterError(f"unsupported Ren'Py version {version}; expected {SUPPORTED_VERSION}")
    return version


def parse_diagnostics(output: str) -> tuple[Diagnostic, ...]:
    diagnostics: list[Diagnostic] = []
    for line in output.splitlines():
        for pattern in DIAGNOSTIC_PATTERNS:
            match = pattern.search(line)
            if match:
                message = match.group("message").strip() or "Ren'Py diagnostic"
                lower = message.lower()
                severity = "warning" if "warning" in lower else "error"
                diagnostics.append(Diagnostic(match.group("file"), int(match.group("line")), severity, message))
                break
    return tuple(diagnostics)


def run_bounded(argv: tuple[str, ...], *, timeout_seconds: float = 120, output_limit: int = 2_000_000) -> CommandResult:
    if timeout_seconds <= 0 or output_limit <= 0:
        raise ValueError("timeout and output limit must be positive")
    started = time.monotonic()
    process = subprocess.Popen(
        argv,
        stdin=subprocess.DEVNULL,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        shell=False,
        start_new_session=(os.name != "nt"),
        creationflags=(subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0),
    )
    chunks: queue.Queue[bytes | None] = queue.Queue(maxsize=8)

    def kill_process_tree() -> None:
        if process.poll() is not None:
            return
        try:
            if os.name == "nt":
                subprocess.run(
                    ("taskkill", "/PID", str(process.pid), "/T", "/F"),
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    check=False,
                    shell=False,
                )
                if process.poll() is None:
                    process.kill()
            else:
                os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass

    def read_output() -> None:
        assert process.stdout is not None
        for chunk in iter(lambda: process.stdout.read(8192), b""):
            chunks.put(chunk)
        chunks.put(None)

    reader = threading.Thread(target=read_output, daemon=True)
    reader.start()
    captured = bytearray()
    limited = False
    timed_out = False
    finished_reading = False
    while not finished_reading:
        remaining = timeout_seconds - (time.monotonic() - started)
        if remaining <= 0:
            timed_out = True
            kill_process_tree()
            remaining = 1
        try:
            chunk = chunks.get(timeout=min(max(remaining, 0.05), 0.25))
        except queue.Empty:
            continue
        if chunk is None:
            finished_reading = True
        elif len(captured) < output_limit:
            room = output_limit - len(captured)
            captured.extend(chunk[:room])
            if len(chunk) > room:
                limited = True
                kill_process_tree()
        else:
            limited = True
            kill_process_tree()
    exit_code = process.wait()
    reader.join(timeout=1)
    if process.stdout is not None:
        process.stdout.close()
    reader.join(timeout=1)
    if process.stdout is not None:
        process.stdout.close()
    output = captured.decode("utf-8", errors="replace")
    return CommandResult(
        argv=argv,
        exit_code=exit_code,
        output=output,
        duration_seconds=time.monotonic() - started,
        timed_out=timed_out,
        output_limited=limited,
        diagnostics=parse_diagnostics(output),
    )
