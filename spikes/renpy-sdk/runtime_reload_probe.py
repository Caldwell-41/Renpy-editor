"""Pinned-SDK feasibility only: not the production runtime or the R1 gate.

Creates only synthetic projects. Exercises the real engine's reload callback,
not native keyboard delivery. Reports partial failures and always cleans its child.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import signal
import subprocess
import tempfile
import threading
import time
from pathlib import Path

from archive_safety import install_verified_tar
from sdk_adapter import Command, command_argv, parse_version


SDK_SHA256 = "eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45"
OUTPUT_LIMIT = 512 * 1024
START_SECONDS = 30
OBSERVE_SECONDS = 3
LONG_PLAY_SECONDS = 10


def fixture(developer: bool, revision: str) -> str:
    # Only fixed probe values enter this synthetic source, never user project text.
    assert revision in {"old", "new"}
    return f'''define config.name = "Loomlight runtime feasibility"
define config.save_directory = None
define config.developer = {developer!r}
define config.autoreload = False
define config.sound = False
init python:
    import json
    import os
    def probe_event(kind):
        with open(os.path.join(config.basedir, "events.jsonl"), "a") as stream:
            stream.write(json.dumps({{"kind": kind, "revision": "{revision}", "autoreload": renpy.get_autoreload()}}) + "\\n")
    def probe_tick():
        command_path = os.path.join(config.basedir, "command.txt")
        if os.path.isfile(command_path):
            with open(command_path) as stream:
                command = stream.read()
            os.unlink(command_path)
            probe_event("command:" + command)
            if command == "reload":
                _reload_game()
                probe_event("reload-returned")
            elif command == "quit":
                renpy.quit()
        heartbeat_pending = os.path.join(config.basedir, "heartbeat.pending")
        with open(heartbeat_pending, "w") as stream:
            stream.write("{revision}")
        os.replace(heartbeat_pending, os.path.join(config.basedir, "heartbeat.txt"))
    probe_event("init")
screen probe_driver():
    timer 0.1 repeat True action Function(probe_tick)
label start:
    show screen probe_driver
    scene expression Solid("#18202b")
    $ probe_event("dialogue")
    "{revision} dialogue"
    jump start
'''


def environment(headless: bool) -> dict[str, str]:
    allowed = {"PATH", "HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "SYSTEMROOT",
               "WINDIR", "TMPDIR", "TEMP", "TMP", "LANG", "LC_ALL", "LC_CTYPE",
               "DISPLAY", "XAUTHORITY"}
    result = {key: value for key, value in os.environ.items() if key in allowed}
    result.update(RENPY_SKIP_MAIN_MENU="1", RENPY_DISABLE_SOUND="1",
                  RENPY_DISABLE_BACKUPS="I take responsibility for this.")
    if headless:
        result.update(SDL_VIDEODRIVER="dummy", SDL_AUDIODRIVER="dummy", RENPY_RENDERER="sw")
    return result


class ProbeFailure(RuntimeError):
    pass


class Game:
    def __init__(self, sdk: Path, project: Path, env: dict[str, str]):
        self.project = project
        self.output = bytearray()
        self.flood = threading.Event()
        self.process = subprocess.Popen(
            command_argv(sdk, Command.RUN, project, allow_project_execution=True),
            env=env, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, shell=False, start_new_session=(os.name != "nt"),
            creationflags=(subprocess.CREATE_NEW_PROCESS_GROUP if os.name == "nt" else 0),
        )
        self.reader = threading.Thread(target=self._read, daemon=True)
        self.reader.start()

    def _read(self) -> None:
        assert self.process.stdout is not None
        with self.process.stdout as stream:
            while chunk := stream.read(8192):
                keep = min(len(chunk), max(0, OUTPUT_LIMIT - len(self.output)))
                self.output.extend(chunk[:keep])
                if keep < len(chunk):
                    self.flood.set()

    def events(self) -> list[dict]:
        path = self.project / "events.jsonl"
        if not path.exists():
            return []
        lines = path.read_text(encoding="utf-8").splitlines(keepends=True)
        return [json.loads(line) for line in lines if line.endswith("\n")]

    def check(self) -> None:
        if self.flood.is_set():
            raise ProbeFailure("SDK output exceeded the 512 KiB probe limit")
        if self.process.poll() is not None:
            raise ProbeFailure(f"SDK exited before the observation: {self.process.returncode}")
        for name in ("traceback.txt", "errors.txt"):
            if (self.project / name).exists():
                raise ProbeFailure(f"SDK produced {name}; staying alive is not a pass")

    def wait_for(self, predicate, seconds: float = START_SECONDS) -> None:
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            self.check()
            if predicate():
                return
            time.sleep(0.05)
        raise ProbeFailure("SDK observation deadline expired")

    def observe(self, seconds: float) -> None:
        deadline = time.monotonic() + seconds
        while time.monotonic() < deadline:
            self.check()
            time.sleep(0.05)

    def send(self, command: str) -> None:
        # Atomic delivery avoids the timer consuming a partially written command.
        path = self.project / "command.pending"
        path.write_text(command, encoding="utf-8")
        path.replace(self.project / "command.txt")

    def close(self) -> dict:
        started = time.monotonic()
        forced = self.process.poll() is None
        tree_cleanup_failed = False
        if forced:
            if os.name == "nt":
                system_root = os.environ.get("SYSTEMROOT", os.environ.get("SystemRoot", ""))
                taskkill = Path(system_root) / "System32" / "taskkill.exe"
                try:
                    subprocess.run([str(taskkill), "/PID", str(self.process.pid), "/T", "/F"],
                                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL, timeout=5, check=False)
                except (OSError, subprocess.TimeoutExpired):
                    tree_cleanup_failed = True
                finally:
                    if self.process.poll() is None:
                        self.process.kill()
            else:
                try:
                    # Harness teardown only. Graceful Stop/escalation belongs to R1.
                    # SIGTERM can open a game-controlled confirmation screen.
                    os.killpg(self.process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
        self.process.wait(timeout=5)
        self.reader.join(timeout=1)
        if self.reader.is_alive():
            raise ProbeFailure("Probe reader did not close; no descendant-cleanup claim")
        if tree_cleanup_failed:
            raise ProbeFailure("Windows harness tree cleanup failed; parent was reaped")
        if self.flood.is_set():
            raise ProbeFailure("SDK output limit reached during cleanup")
        return {"forced": forced, "exitCode": self.process.returncode,
                "cleanupSeconds": round(time.monotonic() - started, 3)}


def run_case(sdk: Path, project: Path, developer: bool, env: dict[str, str], result: dict) -> None:
    (project / "game").mkdir(parents=True)
    source = project / "game" / "script.rpy"
    source.write_text(fixture(developer, "old"), encoding="utf-8")
    game = Game(sdk, project, env)
    try:
        game.wait_for(lambda: (project / "heartbeat.txt").exists())
        game.wait_for(lambda: any(e["kind"] == "dialogue" for e in game.events()))
        start = time.monotonic()
        game.observe(LONG_PLAY_SECONDS)
        result["playSecondsBeforeEdit"] = round(time.monotonic() - start, 3)
        source.write_text(fixture(developer, "new"), encoding="utf-8")
        game.observe(OBSERVE_SECONDS)
        if any(e["revision"] == "new" for e in game.events()):
            raise ProbeFailure("Saving alone unexpectedly executed the new revision")
        if (project / "heartbeat.txt").read_text() != "old":
            raise ProbeFailure("Loaded script heartbeat did not retain the old revision")
        result["saveDidNotReload"] = True
        game.send("reload")
        game.wait_for(lambda: any(e["kind"] == "command:reload" for e in game.events()))
        if developer:
            game.wait_for(lambda: any(e["kind"] == "init" and e["revision"] == "new"
                                     for e in game.events()))
            result["autoreloadFalseStillAllowsOneReload"] = True
        else:
            game.wait_for(lambda: any(e["kind"] == "reload-returned" for e in game.events()))
            game.observe(OBSERVE_SECONDS)
            if any(e["revision"] == "new" for e in game.events()):
                raise ProbeFailure("Developer-off callback unexpectedly reloaded")
            result["developerOffSuppressesDefaultReloadCallback"] = True
        result["events"] = game.events()
        if developer:
            game.send("quit")
            game.process.wait(timeout=10)
            if game.process.returncode != 0:
                raise ProbeFailure("Natural quit failed")
            result["naturalExit"] = True
    finally:
        result["cleanup"] = game.close()
        for name in ("errors.txt", "traceback.txt"):
            path = project / name
            if path.exists():
                with path.open("rb") as stream:
                    stream.seek(max(0, path.stat().st_size - 3000))
                    tail = stream.read(3000).decode("utf-8", errors="replace")
                result["sdkFailureTail"] = tail.replace(str(project), "[fixture]").replace(str(sdk), "[sdk]")
        if "sdkFailureTail" in result:
            raise ProbeFailure("SDK error artifact present after fixture cleanup")
    # Deliberate new process must load the saved bytes; this is not a snapshot.
    (project / "heartbeat.txt").unlink(missing_ok=True)
    before = len(game.events())
    game = Game(sdk, project, env)
    try:
        game.wait_for(lambda: any(e["kind"] == "dialogue" and e["revision"] == "new"
                                 for e in game.events()[before:]))
        result["stopRunLoadsSavedRevision"] = True
    finally:
        result["restartCleanup"] = game.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--headless", action="store_true", help="Linux dummy video; not native rendering")
    args = parser.parse_args()
    report = {"status": "FAIL", "layer": "actual SDK / synthetic reload callback / isolated fixture",
              "platform": platform.system(), "architecture": platform.machine(),
              "headless": args.headless, "sdkSha256": SDK_SHA256, "cases": [],
              "probeSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "candidate": os.environ.get("GITHUB_SHA"),
              "productionService": "NOT RUN", "nativeKeyboard": "NOT RUN",
              "descendantCleanup": "NOT RUN", "r1": "INCOMPLETE"}
    try:
        with tempfile.TemporaryDirectory(prefix="loomlight-runtime-proof-") as directory:
            root = Path(directory)
            install_verified_tar(args.archive, SDK_SHA256, root / "sdk")
            sdk = root / "sdk" / "renpy-8.5.3-sdk"
            env = environment(args.headless)
            version = subprocess.run(command_argv(sdk, Command.VERSION), env=env,
                                     stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                                     stderr=subprocess.STDOUT, timeout=30, check=True)
            output = version.stdout.decode("utf-8", errors="replace")
            parse_version(output)
            report["sdkVersion"] = output.strip()
            for developer in (True, False):
                result = {"developer": developer, "status": "FAIL"}
                report["cases"].append(result)
                run_case(sdk, root / ("developer-on" if developer else "developer-off"),
                         developer, env, result)
                result["status"] = "PASS"
            report["status"] = "PASS"
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        # Fixed exception type/message for our assertions; no arbitrary SDK output or paths.
        report["failureType"] = type(error).__name__
        if isinstance(error, ProbeFailure):
            report["failure"] = str(error)
    finally:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
