"""Windows qualification observer; no desktop changes or input injection."""
import ctypes
from ctypes import wintypes as w
import json
from pathlib import Path
import sys
import time

editor, profile, stop, output = int(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]), Path(sys.argv[4])
user = ctypes.WinDLL('user32', use_last_error=True)
callback_type = ctypes.WINFUNCTYPE(w.BOOL, w.HWND, w.LPARAM)
user.GetForegroundWindow.restype = w.HWND
user.GetWindowThreadProcessId.argtypes = [w.HWND, ctypes.POINTER(w.DWORD)]
user.GetWindowThreadProcessId.restype = w.DWORD
user.IsWindowVisible.argtypes, user.IsWindowVisible.restype = [w.HWND], w.BOOL
user.EnumWindows.argtypes, user.EnumWindows.restype = [callback_type, w.LPARAM], w.BOOL

def pid(window):
    value = w.DWORD()
    if not window or not user.GetWindowThreadProcessId(window, ctypes.byref(value)):
        return 0
    return value.value

if pid(user.GetForegroundWindow()) != editor:
    raise SystemExit('Editor must own foreground before observation')
targets = set()
samples = helper_samples = visible = foreground = failures = 0
maximum_gap = 0
started = previous = time.monotonic()
output.with_name(output.name + '.ready').write_text('ready')
while not stop.exists() and time.monotonic() - started < 90:
    for path in profile.glob('canvas-helper-*/helper.pid'):
        try:
            value = int(path.read_text())
            if value > 0:
                targets.add(value)
        except (OSError, ValueError):
            pass
    foreground += pid(user.GetForegroundWindow()) != editor
    found = [False]
    def inventory(window, context):
        global visible
        owner = pid(window)
        found[0] |= owner == editor
        visible += owner in targets and bool(user.IsWindowVisible(window))
        return True
    if not user.EnumWindows(callback_type(inventory), 0) or not found[0]:
        failures += 1
    samples += 1
    helper_samples += bool(targets)
    if helper_samples == 11:
        output.with_name(output.name + '.observed').write_text('observed')
    now = time.monotonic()
    maximum_gap = max(maximum_gap, now - previous)
    previous = now
    time.sleep(.005)
output.write_text(json.dumps(dict(editorPID=editor, helperPIDs=sorted(targets), samples=samples, helperSamples=helper_samples, activationEventsObserved=False,
    visibleSamples=visible, foregroundChanges=foreground, activationChanges=None,
    inventoryFailures=failures, maximumSampleGapMilliseconds=maximum_gap*1000, stopped=stop.exists()), indent=2))
