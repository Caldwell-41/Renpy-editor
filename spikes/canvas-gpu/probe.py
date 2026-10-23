"""Bounded Windows GPU capability, private desktop and cooperative-exit proof."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import sys
import tempfile
import time

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
DIGEST = "eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45"


def replace_once(text, before, after):
    if text.count(before) != 1:
        raise ValueError("Production renderer changed; review the probe adapter")
    return text.replace(before, after)


def renderer():
    text = (REPO / "app/src-core/src/screens/canvas-renderer.rpy").read_text()
    text = replace_once(text, '        root, objects = _canvas_build(plan)', '''        if getattr(_canvas_render, "dimensions", None) != (plan["width"], plan["height"]):
            renpy.set_physical_size((plan["width"], plan["height"]))
            renpy.display.interface.set_mode()
            _canvas_render.dimensions = (plan["width"], plan["height"])
        if renpy.get_renderer_info()["renderer"] != "angle2":
            _canvas_os._exit(74)
        root, objects = _canvas_build(plan)''')
    text = replace_once(text, '''        # 8.5.3 software screenshot() returns the display buffer, ignoring its
        # argument. Draw the supplied Render into its own engine surface instead.
        surface = renpy.display.draw.render_to_texture(rendered, True)
        image = config.basedir + "/frame-next.png"
        renpy.display.core.pygame.image.save(surface, image)''', '''        image = config.basedir + "/frame-next.png"
        renpy.render_to_file(rendered, image, resize=True)''')
    text = replace_once(text, '        while True:\n            try:', '''        while True:
            if _canvas_os.path.exists(config.basedir + "/stop"):
                with open(config.basedir + "/stopped.json", "w") as _canvas_ack:
                    _canvas_json.dump(dict(stopped=True), _canvas_ack)
                break
            try:''')
    text += '\n        renpy.quit(relaunch=False, status=0, save=False)\n'
    return (HERE / "bootstrap.rpy").read_text() + "\n" + text


def native_ok(value):
    return (value.get("stage") == "complete" and value.get("forced") is False
            and value.get("jobEmpty") is True and value.get("desktopClosed") is True
            and value.get("observerStopped") is True
            and type(value.get("samples")) is int and value["samples"] > 1
            and all(type(value.get(key)) is int and value[key] == 0 for key in
                    ("foregroundChanges", "focusChanges", "visibleSamples", "inventoryFailures")))


def case_ok(native, acknowledgment, desktop, frame_count, refuse):
    if not native_ok(native) or native.get("helperExit") != (72 if refuse else 0):
        return False
    if refuse:
        return acknowledgment == dict(refused=True, stage="selected-refusal") and frame_count == 0
    return (acknowledgment == dict(stopped=True) and frame_count == 4
            and desktop == dict(privateDesktop=True, differsFromInputDesktop=True)
            and native.get("privateWindows", 0) > 0)


def read_record(path):
    try:
        return json.loads(path.read_text())
    except (OSError, ValueError):
        return None


def check():
    # Check the expensive-run admission gate against missing/failed evidence.
    baseline = dict(stage="complete", forced=False, jobEmpty=True, desktopClosed=True, observerStopped=True,
                    samples=10, foregroundChanges=0, focusChanges=0,
                    visibleSamples=0, inventoryFailures=0)
    assert native_ok(baseline)
    for key in baseline:
        missing = dict(baseline)
        del missing[key]
        assert not native_ok(missing), key
    for key in ("foregroundChanges", "focusChanges", "visibleSamples", "inventoryFailures"):
        assert not native_ok(dict(baseline, **{key: 1})), key
    assert not native_ok(dict(baseline, forced=True))
    assert not native_ok(dict(baseline, observerStopped=False))
    assert not native_ok(dict(baseline, samples=0))
    refusal = dict(baseline, helperExit=72)
    assert case_ok(refusal, dict(refused=True, stage="selected-refusal"), None, 0, True)
    for wrong in (None, {}, dict(refused=True), dict(refused=True, stage="desktop-verification")):
        assert not case_ok(refusal, wrong, None, 0, True)
    normal = dict(baseline, helperExit=0, privateWindows=1)
    desktop = dict(privateDesktop=True, differsFromInputDesktop=True)
    assert case_ok(normal, dict(stopped=True), desktop, 4, False)
    assert not case_ok(normal, None, desktop, 4, False)
    assert not case_ok(normal, dict(stopped=True), None, 4, False)
    assert not case_ok(normal, dict(stopped=True), desktop, 0, False)
    generated = renderer()
    # Parse each Ren'Py Python block with the host interpreter before spending an SDK run.
    import textwrap
    lines = generated.splitlines()
    for i, line in enumerate(lines):
        if line.rstrip().endswith("python:"):
            indent = len(line) - len(line.lstrip())
            block = []
            for following in lines[i + 1:]:
                if following.strip() and len(following) - len(following.lstrip()) <= indent:
                    break
                block.append(following)
            compile(textwrap.dedent("\n".join(block)), "probe-renderer", "exec")
    print("Probe generation and rejecting admission checks pass.")


def plan(width, height, state):
    return dict(width=width, height=height, buttonState=state, nodes=[
        dict(start=0, parent=None, kind="screen", properties={}),
        dict(start=1, parent=0, kind="frame", properties=dict(xsize=640, ysize=360, xalign=.5, yalign=.5, background="#202938")),
        dict(start=2, parent=1, kind="vbox", properties=dict(spacing=12)),
        dict(start=3, parent=2, kind="text", literal="GPU canvas café. This sentence wraps over several lines.", properties=dict(font="assets/canvas.ttf", size=28, xsize=300, color="#f4e4d0")),
        dict(start=4, parent=2, kind="textbutton", literal="Continue", properties=dict(text_font="assets/canvas.ttf", text_size=28)),
    ])


def run_case(owner, sdk, output, scratch, refuse):
    output.mkdir()
    game = scratch / "game"
    (game / "assets").mkdir(parents=True)
    (game / "renderer.rpy").write_text(renderer(), encoding="utf-8")
    shutil.copyfile(sdk / "renpy/common/DejaVuSans.ttf", game / "assets/canvas.ttf")
    env = {key: value for key, value in os.environ.items() if not key.startswith(("RENPY_", "SDL_", "PYTHON", "LOOMLIGHT_PROBE_"))}
    env.update(RENPY_RENDERER="angle2", SDL_AUDIODRIVER="dummy", RENPY_DISABLE_SOUND="1",
               RENPY_DISABLE_BACKUPS="I take responsibility for this.", RENPY_SKIP_MAIN_MENU="1",
               RENPY_SKIP_SPLASHSCREEN="1", LOOMLIGHT_PROBE_REFUSE="1" if refuse else "0")
    (output / "reservation.json").write_text(json.dumps(dict(sdkProcesses=1, case="refusal" if refuse else "render-stop")))
    process = subprocess.Popen([str(owner), str(sdk / "lib/py3-windows-x86_64/python.exe"),
                                str(sdk / "renpy.py"), str(scratch), str(output / "native.json")], env=env)
    records = []
    error = None
    try:
        if not refuse:
            for i, (width, height, state) in enumerate(((1280, 720, "normal"), (1280, 720, "hover"),
                                                       (1024, 768, "normal"), (1024, 768, "hover"))):
                frame = f"gpu-{i}"
                (scratch / "request-next.json").write_text(json.dumps(dict(frameId=frame, plan=plan(width, height, state))))
                (scratch / "request-next.json").replace(scratch / "request.json")
                deadline = time.monotonic() + 15
                while True:
                    if (scratch / "result.json").exists():
                        result = json.loads((scratch / "result.json").read_text())
                        if result["frameId"] == frame:
                            break
                    assert process.poll() is None, "Native owner exited before frame"
                    assert time.monotonic() < deadline, "GPU frame deadline expired"
                    time.sleep(.01)
                assert result["renderer"] == "angle2" and (result["width"], result["height"]) == (width, height)
                assert result["geometry"][1]["width"] == 640 and result["geometry"][1]["height"] == 360
                pixels = (scratch / "frame.png").read_bytes()
                assert pixels.startswith(b"\x89PNG\r\n\x1a\n") and pixels[12:16] == b"IHDR"
                assert struct.unpack(">II", pixels[16:24]) == (width, height)
                name = f"{width}x{height}-{state}"
                shutil.copyfile(scratch / "frame.png", output / f"{name}.png")
                (output / f"{name}.json").write_text(json.dumps(result, indent=2))
                records.append(result)
            (scratch / "stop").touch()
        process.wait(timeout=35)
    except Exception as exc:
        error = str(exc)
    finally:
        # The native owner has a bounded timeout and owns the child job. Let it
        # preserve its forced-cleanup receipt if a frame failed.
        if process.poll() is None:
            (scratch / "stop").touch()
            try:
                process.wait(timeout=35)
            except subprocess.TimeoutExpired:
                process.kill()  # Closing the owner's job handle kills its descendants.
                process.wait()
        for name in ("log.txt", "process.log", "traceback.txt", "desktop.json", "refusal.json", "stopped.json"):
            if (scratch / name).exists():
                shutil.copyfile(scratch / name, output / name)
        native = read_record(output / "native.json")
        if not isinstance(native, dict):
            native = {}
        ack_path = output / ("refusal.json" if refuse else "stopped.json")
        acknowledgment = read_record(ack_path)
        desktop = read_record(output / "desktop.json")
        passed = (error is None and process.returncode == 0
                  and case_ok(native, acknowledgment, desktop, len(records), refuse))
        if (output / "log.txt").exists():
            passed = passed and "Backing up script files to" not in (output / "log.txt").read_text(errors="replace")
        try:
            shutil.rmtree(scratch)
        except OSError as exc:
            error = f"Fixture cleanup failed: {exc}"
            passed = False
        result = dict(passed=passed, error=error, frames=len(records), native=native,
                      acknowledgment=acknowledgment, desktop=desktop,
                      fixtureRemoved=not scratch.exists(),
                      physicalKeyboard=False, productionIntegration=False, matchedFidelity=False)
        (output / "result.json").write_text(json.dumps(result, indent=2))
        print(json.dumps(result))
    return passed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--owner", type=Path)
    parser.add_argument("--archive", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    check()
    if args.check:
        return
    assert os.name == "nt" and args.owner and args.archive and args.output
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(REPO / "spikes/renpy-sdk"))
    from archive_safety import install_verified_tar
    with tempfile.TemporaryDirectory(prefix="gpu-sdk-") as temporary:
        temporary = Path(temporary)
        install_verified_tar(args.archive, DIGEST, temporary / "sdk")
        sdk = temporary / "sdk/renpy-8.5.3-sdk"
        results = []
        for name, refuse in (("render-stop", False), ("refusal", True)):
            results.append(run_case(args.owner.resolve(), sdk, output / name, temporary / name, refuse))
    hashes = {str(path.relative_to(output)): hashlib.sha256(path.read_bytes()).hexdigest()
              for path in output.rglob("*") if path.is_file()}
    (output / "hashes.json").write_text(json.dumps(hashes, indent=2))
    if not all(results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
