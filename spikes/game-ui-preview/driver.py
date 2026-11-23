"""Throwaway measurement driver for #198, extended for #216 and #213. Never merged.

Usage: python driver.py --sdk <verified 8.5.3 SDK> --work <dir> --out <dir>
                        [--phase all|smoke|broken|states|animation|burst]

The phase "animation" runs the six inference cases of #213 and then the frame
burst. The phase "burst" runs only the frame burst.

One run of this script is one attempt under the limit recorded on the ticket.
It starts at most --max-processes SDK processes and stops after --max-seconds.
"""
import argparse
import hashlib
import json
import os
import shutil
import statistics
import subprocess
import sys
import threading
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
BOOTSTRAP = os.path.join(REPO, "app", "src-core", "src", "renpy", "runtime", "canvas-bootstrap.py")
WINDOWS = os.name == "nt"


class Budget:
    def __init__(self, processes, seconds):
        self.processes, self.left = processes, processes
        self.deadline = time.monotonic() + seconds

    def take(self, what):
        if self.left <= 0:
            raise SystemExit("process budget exhausted before " + what)
        if time.monotonic() > self.deadline:
            raise SystemExit("time budget exhausted before " + what)
        self.left -= 1

    def check(self):
        if time.monotonic() > self.deadline:
            raise TimeoutError("run time budget exhausted")


def sdk_command(sdk, args):
    if WINDOWS:
        return [os.path.join(sdk, "lib", "py3-windows-x86_64", "python.exe"), os.path.join(sdk, "renpy.py")] + args
    return [os.path.join(sdk, "renpy.sh")] + args


def generate_stock(sdk, target, budget, log):
    stage = target + ".stage"
    shutil.rmtree(stage, ignore_errors=True)
    started = time.perf_counter()
    budget.take("generate_gui")
    subprocess.run(sdk_command(sdk, ["launcher", "generate_gui", stage, "--width", "1920", "--height", "1080",
                                     "--template", os.path.join(sdk, "gui"), "--start"]),
                   check=True, stdout=log, stderr=subprocess.STDOUT, timeout=180, cwd=sdk)
    budget.take("gui_images")
    subprocess.run(sdk_command(sdk, [stage, "gui_images"]), check=True, stdout=log, stderr=subprocess.STDOUT, timeout=180, cwd=sdk)
    os.replace(stage, target)
    return (time.perf_counter() - started) * 1000


def write_large(stock, target):
    """The stock project plus a 20,000-line story and 100 extra screens."""
    shutil.rmtree(target, ignore_errors=True)
    shutil.copytree(stock, target)
    lines = ["define llp_e = Character(\"Eileen\")", ""]
    for n in range(800):
        lines.append("label llp_story_%d:" % n)
        for k in range(18):
            lines.append("    llp_e \"Line %d of scene %d. The story goes on for a while so the script is large.\"" % (k, n))
        lines += ["    menu:", "        \"Go on\":", "            jump llp_story_%d" % (n + 1), "        \"Stay\":",
                  "            \"You stay.\"", "    return", ""]
    lines += ["label llp_story_800:", "    return"]
    with open(os.path.join(target, "game", "zz_llp_story.rpy"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    screens = []
    for n in range(100):
        screens += ["screen llp_extra_%d(value=0):" % n, "    frame:", "        xalign 0.5", "        vbox:",
                    "            spacing 10", "            text \"Extra screen %d\"" % n,
                    "            textbutton \"Action\" action NullAction()",
                    "            for i in range(3):", "                text \"Row [i] [value]\"",
                    "            bar value value range 10", ""]
    with open(os.path.join(target, "game", "zz_llp_screens.rpy"), "w", encoding="utf-8") as f:
        f.write("\n".join(screens) + "\n")
    return len(lines)


def block(path, header):
    """Return (first line, text) of the top-level block that starts with header."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    for i, line in enumerate(lines):
        if line.startswith(header):
            end = i + 1
            while end < len(lines) and (not lines[end].strip() or lines[end][0] in " \t#"):
                end += 1
            return i + 1, "\n".join(lines[i:end]) + "\n"
    raise KeyError(header)


def replace_line(path, prefix, new_line):
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    for i, line in enumerate(lines):
        if line.startswith(prefix):
            lines[i] = new_line
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines))
            return i + 1
    raise KeyError(prefix)


def set_say_offset(path, value):
    """Insert or update an xoffset line after id "window" in screen say."""
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    start = next(i for i, l in enumerate(lines) if l.startswith("screen say("))
    anchor = next(i for i in range(start, len(lines)) if lines[i].strip() == 'id "window"')
    indent = lines[anchor][: len(lines[anchor]) - len(lines[anchor].lstrip())]
    if lines[anchor + 1].strip().startswith("xoffset"):
        lines[anchor + 1] = indent + "xoffset %d" % value
    else:
        lines.insert(anchor + 1, indent + "xoffset %d" % value)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def set_dialogue_color(path, color):
    with open(path, encoding="utf-8") as f:
        lines = f.read().split("\n")
    start = next(i for i, l in enumerate(lines) if l.startswith("style say_dialogue:"))
    if lines[start + 1].strip().startswith("color "):
        lines[start + 1] = "    color \"%s\"" % color
    else:
        lines.insert(start + 1, "    color \"%s\"" % color)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


class FocusWatch(threading.Thread):
    """Samples the foreground application while a helper runs."""

    def __init__(self):
        super().__init__(daemon=True)
        self.samples, self.stop = [], threading.Event()

    def front(self):
        if WINDOWS:
            import ctypes
            from ctypes import wintypes
            user = ctypes.WinDLL("user32")
            hwnd = user.GetForegroundWindow()
            pid = wintypes.DWORD()
            user.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
            return pid.value
        out = subprocess.run(["lsappinfo", "front"], capture_output=True, text=True).stdout.strip()
        info = subprocess.run(["lsappinfo", "info", "-only", "pid", out], capture_output=True, text=True).stdout
        digits = "".join(c for c in info.split("=")[-1] if c.isdigit())
        return int(digits) if digits else None

    def run(self):
        while not self.stop.is_set():
            try:
                self.samples.append((time.perf_counter(), self.front()))
            except Exception as e:
                self.samples.append((time.perf_counter(), repr(e)))
            self.stop.wait(0.25)


def windows_spawn(argv, cwd, desktop_env):
    """Start the SDK on a private desktop, as canvas-owner.c does."""
    import ctypes
    from ctypes import wintypes
    user = ctypes.WinDLL("user32", use_last_error=True)
    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    name = "LoomlightSpike-%d-%d" % (os.getpid(), int(time.time() * 1000))
    user.CreateDesktopW.restype = wintypes.HANDLE
    user.CreateDesktopW.argtypes = [wintypes.LPCWSTR, wintypes.LPCWSTR, wintypes.LPVOID, wintypes.DWORD, wintypes.DWORD, wintypes.LPVOID]
    desktop = user.CreateDesktopW(name, None, None, 0, 0x0002 | 0x0001 | 0x0080 | 0x0040, None)
    if not desktop:
        raise ctypes.WinError(ctypes.get_last_error())

    class STARTUPINFOW(ctypes.Structure):
        _fields_ = [("cb", wintypes.DWORD), ("lpReserved", wintypes.LPWSTR), ("lpDesktop", wintypes.LPWSTR),
                    ("lpTitle", wintypes.LPWSTR), ("dwX", wintypes.DWORD), ("dwY", wintypes.DWORD),
                    ("dwXSize", wintypes.DWORD), ("dwYSize", wintypes.DWORD), ("dwXCountChars", wintypes.DWORD),
                    ("dwYCountChars", wintypes.DWORD), ("dwFillAttribute", wintypes.DWORD), ("dwFlags", wintypes.DWORD),
                    ("wShowWindow", wintypes.WORD), ("cbReserved2", wintypes.WORD), ("lpReserved2", wintypes.LPVOID),
                    ("hStdInput", wintypes.HANDLE), ("hStdOutput", wintypes.HANDLE), ("hStdError", wintypes.HANDLE)]

    class PROCESS_INFORMATION(ctypes.Structure):
        _fields_ = [("hProcess", wintypes.HANDLE), ("hThread", wintypes.HANDLE), ("dwProcessId", wintypes.DWORD),
                    ("dwThreadId", wintypes.DWORD)]

    startup = STARTUPINFOW()
    startup.cb = ctypes.sizeof(startup)
    startup.lpDesktop = name
    info = PROCESS_INFORMATION()
    desktop_env["LOOMLIGHT_CANVAS_DESKTOP"] = name
    block_env = "".join("%s=%s\0" % (k, v) for k, v in desktop_env.items()) + "\0"
    kernel.CreateProcessW.argtypes = [wintypes.LPCWSTR, wintypes.LPWSTR, wintypes.LPVOID, wintypes.LPVOID, wintypes.BOOL,
                                      wintypes.DWORD, wintypes.LPCWSTR, wintypes.LPCWSTR, ctypes.c_void_p, ctypes.c_void_p]
    command = ctypes.create_unicode_buffer(subprocess.list2cmdline(argv))
    if not kernel.CreateProcessW(argv[0], command, None, None, False, 0x08000000 | 0x00000400,
                                 ctypes.create_unicode_buffer(block_env), cwd, ctypes.byref(startup), ctypes.byref(info)):
        user.CloseDesktop(desktop)
        raise ctypes.WinError(ctypes.get_last_error())
    kernel.CloseHandle(info.hThread)

    class Handle:
        pid = info.dwProcessId

        def poll(self):
            code = wintypes.DWORD()
            kernel.GetExitCodeProcess(info.hProcess, ctypes.byref(code))
            return None if code.value == 259 else code.value

        def wait(self, timeout):
            kernel.WaitForSingleObject(info.hProcess, int(timeout * 1000))
            return self.poll()

        def kill(self):
            kernel.TerminateProcess(info.hProcess, 1)

        def close(self):
            kernel.CloseHandle(info.hProcess)
            user.CloseDesktop(desktop)

    return Handle()


class Helper:
    def __init__(self, sdk, project, io, budget, log):
        self.io, self.seq, self.budget, self.history = io, 0, budget, []
        shutil.rmtree(io, ignore_errors=True)
        os.makedirs(os.path.join(io, "search"))
        os.makedirs(os.path.join(io, "saves"))
        shutil.copy(os.path.join(HERE, "helper", "llp_preview.rpy"), os.path.join(io, "search"))
        shutil.copy(BOOTSTRAP, os.path.join(io, "canvas-bootstrap.py"))
        env = dict(os.environ)
        env.update({
            "SDL_MAC_BACKGROUND_APP": "1", "RENPY_HIGHDPI": "1.0", "SDL_AUDIODRIVER": "dummy",
            "RENPY_RENDERER": "angle2" if WINDOWS else "gl2", "RENPY_DISABLE_SOUND": "1",
            "RENPY_DISABLE_BACKUPS": "I take responsibility for this.", "RENPY_SKIP_MAIN_MENU": "1",
            "RENPY_SKIP_SPLASHSCREEN": "1", "RENPY_SIMPLE_EXCEPTIONS": "1",
            "RENPY_SEARCHPATH": os.path.join(io, "search"), "RENPY_PATH_TO_SAVES": os.path.join(io, "saves"),
            "RENPY_MULTIPERSISTENT": os.path.join(io, "saves"), "LLP_IO": io,
        })
        argv = sdk_command(sdk, [project, "loomlight_preview", "--savedir", os.path.join(io, "saves")])
        self.write_request(dict(kind="scene", scene=dict(screen="say", who="Eileen", what="The first frame of the preview.")))
        budget.take("helper start")
        self.watch = FocusWatch()
        self.watch.start()
        self.t_launch = time.perf_counter()
        if WINDOWS:
            self.process = windows_spawn(argv, project, env)
        else:
            self.process = subprocess.Popen(argv, cwd=project, env=env, stdout=log, stderr=subprocess.STDOUT)
        self.first = self.result(0, timeout=120)
        self.first["launchToImageMs"] = (self.first["_seen"] - self.t_launch) * 1000

    def write_request(self, req):
        req = dict(req, id=self.seq)
        tmp = os.path.join(self.io, "request.tmp")
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(req, f)
        written = time.perf_counter()
        os.replace(tmp, os.path.join(self.io, "request-%d.json" % self.seq))
        self.seq += 1
        return req["id"], written

    def result(self, n, timeout=30):
        path = os.path.join(self.io, "result-%d.json" % n)
        deadline = time.perf_counter() + timeout
        while not os.path.exists(path):
            if time.perf_counter() > deadline:
                raise TimeoutError("no result %d" % n)
            if getattr(self, "process", None) is not None and self.process.poll() is not None:
                raise RuntimeError("helper exited with %r before result %d" % (self.process.poll(), n))
            self.budget.check()
            time.sleep(0.001)
        seen = time.perf_counter()
        while True:
            # On Windows a file just moved into place by os.replace can refuse
            # a reader for a moment with a sharing violation.
            try:
                with open(path, encoding="utf-8") as f:
                    data = json.load(f)
                break
            except PermissionError:
                if time.perf_counter() > deadline:
                    raise
                time.sleep(0.001)
        data["_seen"] = seen
        png = os.path.join(self.io, "frame-%d.png" % n)
        if os.path.exists(png):
            with open(png, "rb") as f:
                data["_sha"] = hashlib.sha256(f.read()).hexdigest()[:16]
        return data

    def ask(self, req, started=None, timeout=30):
        n, written = self.write_request(req)
        data = self.result(n, timeout)
        data["e2eMs"] = (data["_seen"] - (started or written)) * 1000
        self.history.append(dict(request=req, result=data))
        return data

    def stop(self):
        out = dict(focus=self.focus_report())
        try:
            n, _ = self.write_request(dict(kind="stop"))
            out["stopResult"] = self.result(n, timeout=10)
            out["exit"] = self.process.wait(timeout=10)
        except Exception as e:
            out["stopError"] = repr(e)
            self.process.kill()
            out["killed"] = True
        self.watch.stop.set()
        if WINDOWS:
            self.process.close()
        return out

    def focus_report(self):
        pid_file = os.path.join(self.io, "helper.pid")
        helper_pid = int(open(pid_file).read()) if os.path.exists(pid_file) else None
        pids = {self.process.pid, helper_pid}
        fronts = [s[1] for s in self.watch.samples]
        return dict(samples=len(fronts), helperFront=sum(1 for p in fronts if p in pids),
                    distinctFront=sorted({str(p) for p in fronts}), helperPid=helper_pid)


def stats(values):
    values = [v for v in values if v is not None]
    if not values:
        return None
    values = sorted(values)
    p95 = values[min(len(values) - 1, int(round(0.95 * (len(values) - 1))))]
    return dict(n=len(values), median=round(statistics.median(values), 1), p95=round(p95, 1),
                min=round(values[0], 1), max=round(values[-1], 1))


DISPLAY_KEYWORDS = {
    "Text": {"text", "label", "textbutton"}, "Button": {"textbutton", "button", "imagebutton", "hotspot"},
    "Window": {"frame", "window", "label"}, "MultiBox": {"vbox", "hbox", "fixed", "side"},
    "Grid": {"grid"}, "Viewport": {"viewport"}, "VPGrid": {"vpgrid"}, "Bar": {"bar", "vbar"},
    "ScreenDisplayable": {"screen"}, "Input": {"input"}, "Null": {"null"},
}


def check_lines(project, geometry):
    cache, rows = {}, []
    for g in geometry:
        path = os.path.join(project, g["file"])
        if path not in cache:
            try:
                with open(path, encoding="utf-8") as f:
                    cache[path] = f.read().split("\n")
            except OSError:
                cache[path] = None
        lines = cache[path]
        source = lines[g["line"] - 1].strip() if lines and 0 < g["line"] <= len(lines) else None
        keyword = source.split()[0].rstrip(":") if source else None
        expected = DISPLAY_KEYWORDS.get(g["cls"])
        verdict = "match" if expected and keyword in expected else ("add" if keyword in ("add", "image") else "check")
        rows.append(dict(cls=g["cls"], file=g["file"], line=g["line"], keyword=keyword, verdict=verdict, source=source))
    return rows


def coverage(project, screens, geometry):
    """Displayable statements in the named screens, and which of them produced an element."""
    path = os.path.join(project, "game", "screens.rpy")
    keywords = set().union(*DISPLAY_KEYWORDS.values()) - {"screen"} | {"add", "image"}
    located = {g["line"] for g in geometry if g["file"].replace("\\", "/").endswith("game/screens.rpy")}
    out = {}
    for name in screens:
        first, text = block(path, "screen %s(" % name)
        statements = []
        for offset, line in enumerate(text.split("\n")):
            word = line.strip().split(" ")[0].rstrip(":") if line.strip() else ""
            if word in keywords and offset > 0:
                statements.append(first + offset)
        out[name] = dict(statements=len(statements), located=sum(1 for s in statements if s in located),
                         missing=[s for s in statements if s not in located])
    return out


def with_offset(text, value):
    """Set the xoffset line that follows id "window", replacing any that is there."""
    lines = text.split("\n")
    anchor = next(i for i, l in enumerate(lines) if l.strip() == 'id "window"')
    if lines[anchor + 1].strip().startswith("xoffset"):
        del lines[anchor + 1]
    lines.insert(anchor + 1, "        xoffset %d" % value)
    return "\n".join(lines)


def measure_broken(helper, screens_rpy, session):
    line, saved = block(screens_rpy, "screen say(")
    broken = session["broken"] = []
    for case, bad in (("parse", saved.replace('id "window"', 'id "window"\n        xoffset (', 1)),
                      ("runtime", saved.replace('id "window"', 'id "window"\n        $ llp_boom = 1 // llp_zero', 1))):
        for i in range(3):
            err = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=bad, screen="say"))
            good_started = time.perf_counter()
            good = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=with_offset(saved, 10 + 30 * i), screen="say"))
            broken.append(dict(case=case, errorOk=err.get("ok"), error=err.get("error"),
                               messages=err.get("messages"), trace=(err.get("trace") or "")[-600:],
                               errorMs=err.get("e2eMs"), errorToGoodImageMs=(good["_seen"] - err["_seen"]) * 1000,
                               goodAfterErrorMs=(good["_seen"] - good_started) * 1000, goodOk=good.get("ok"),
                               goodMessages=good.get("messages"), goodSha=good.get("_sha"),
                               processAlive=helper.process.poll() is None))
    helper.ask(dict(kind="load", file=screens_rpy, line=line, text=saved, screen="say"))


def measure_session(helper, project, variant, reps, out, session):
    screens_rpy = os.path.join(project, "game", "screens.rpy")
    gui_rpy = os.path.join(project, "game", "gui.rpy")
    session["first"] = helper.first

    # Geometry, source lines and rectangles on three stock screens.
    scenes = {
        "say": dict(screen="say", who="Eileen", what="A sample line of dialogue for the say screen."),
        "choice": dict(screen="choice", items=["First choice", "Second choice", "Third choice"]),
        "preferences": dict(screen="preferences"),
    }
    session["screens"] = {}
    for name, scene in scenes.items():
        shown = helper.ask(dict(kind="scene", scene=scene, geometry=True))
        rects = helper.ask(dict(kind="rects"), timeout=120)
        geometry = rects.get("geometry", [])
        session["screens"][name] = dict(showMs=shown.get("e2eMs"), helperMs=shown.get("helperMs"),
                                        elements=len(geometry), lines=check_lines(project, geometry),
                                        rectChecks=rects.get("rectChecks"), native=rects.get("native"),
                                        sha=shown.get("_sha"))
        cover_names = {"say": ["say"], "choice": ["choice"], "preferences": ["preferences", "game_menu", "navigation"]}[name]
        session["screens"][name]["coverage"] = coverage(project, cover_names, geometry)
        shutil.copy(os.path.join(helper.io, "frame-%d.png" % shown["id"]), os.path.join(out, "%s-%s.png" % (variant, name)))

    # Reload paths after a source write. The say screen stays on the canvas.
    helper.ask(dict(kind="scene", scene=scenes["say"]))
    paths = session["paths"] = {"screen": [], "style": [], "gui": [], "restart": []}
    prev = None
    for i in range(reps):
        started = time.perf_counter()
        set_say_offset(screens_rpy, 40 if i % 2 == 0 else 0)
        line, text = block(screens_rpy, "screen say(")
        r = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=text, screen="say"), started)
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        paths["screen"].append(r)
    for i in range(reps):
        started = time.perf_counter()
        set_dialogue_color(screens_rpy, "#ff8080" if i % 2 == 0 else "#80ff80")
        line, text = block(screens_rpy, "style say_dialogue:")
        r = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=text, rebuild="style"), started)
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        paths["style"].append(r)
    for i in range(reps):
        started = time.perf_counter()
        line = replace_line(gui_rpy, "define gui.text_size", "define gui.text_size = %d" % (44 if i % 2 == 0 else 33))
        r = helper.ask(dict(kind="load", file=gui_rpy, line=line, text="define gui.text_size = %d\n" % (44 if i % 2 == 0 else 33),
                            rebuild="gui"), started)
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        paths["gui"].append(r)
    for i in range(max(3, reps // 2)):
        started = time.perf_counter()
        set_say_offset(screens_rpy, 80 if i % 2 == 0 else 20)
        r = helper.ask(dict(kind="restart"), started, timeout=120)
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        paths["restart"].append(r)
    session["paths"] = paths

    # Values that are not in the source file: drafts loaded without a write.
    drafts = session["drafts"] = {"screen": [], "gui": []}
    line, saved = block(screens_rpy, "screen say(")
    for i in range(reps):
        text = saved.replace('id "window"', 'id "window"\n        yoffset %d' % (-60 if i % 2 == 0 else -20), 1)
        r = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=text, screen="say"))
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        drafts["screen"].append(r)
    gui_line = replace_line(gui_rpy, "define gui.text_size", "define gui.text_size = 33")
    for i in range(reps):
        r = helper.ask(dict(kind="load", file=gui_rpy, line=gui_line, text="define gui.text_size = %d\n" % (50 if i % 2 == 0 else 28),
                            rebuild="gui"))
        r["changed"] = r.get("_sha") != prev
        prev = r.get("_sha")
        drafts["gui"].append(r)
    session["drafts"] = drafts
    helper.ask(dict(kind="load", file=screens_rpy, line=line, text=saved, screen="say"))

    measure_broken(helper, screens_rpy, session)

    # Try it: pointer moves and clicks.
    menu = helper.ask(dict(kind="scene", scene=dict(screen="main_menu"), geometry=True))
    shutil.copy(os.path.join(helper.io, "frame-%d.png" % menu["id"]), os.path.join(out, "%s-main_menu.png" % variant))
    texts = [g for g in menu.get("geometry", []) if g.get("container")]
    rows = check_lines(project, texts)
    found = next((g for g, row in zip(texts, rows) if row["source"] and "Preferences" in row["source"]), None)
    target = found["container"] if found else None
    buttons = texts
    pointer = session["pointer"] = dict(buttons=len(buttons), target=target, moves=[], click=None)
    if target:
        cx, cy = int(target["x"] + target["w"] / 2), int(target["y"] + target["h"] / 2)
        for i in range(reps):
            xy = (cx, cy) if i % 2 == 0 else (1900, 20)
            r = helper.ask(dict(kind="pointer", actions=[["move", xy[0], xy[1]]], timeout=1.0))
            r["changed"] = r.get("_sha") != prev
            prev = r.get("_sha")
            pointer["moves"].append(r)
        r = helper.ask(dict(kind="pointer", actions=[["click", cx, cy]], settle=True, timeout=3.0, geometry=True))
        r["changed"] = r.get("_sha") != prev
        r["screensAfter"] = sorted({g["file"] + ":" + str(g["line"]) for g in r.get("geometry", []) if g["cls"] == "ScreenDisplayable"})
        r.pop("geometry", None)
        pointer["click"] = r
        shutil.copy(os.path.join(helper.io, "frame-%d.png" % r["id"]), os.path.join(out, "%s-after-click.png" % variant))
    session["pointer"] = pointer


STATES_FILE = "game/zz_llp_states.rpy"
SHOWN = ("pixelText", "pixelBackground", "prefix", "styleColor", "styleBackground", "focused", "focusable")


def measure_states(helper, project, out, session):
    """#216: the states rule (cases 1 to 4) and forced states (case 5)."""
    lines = {}
    with open(os.path.join(project, STATES_FILE), encoding="utf-8") as f:
        for number, line in enumerate(f, 1):
            if line.strip().startswith("textbutton \""):
                lines[line.split("\"")[1].split(" ")[0]] = number
    grid = [n for n in lines if n[0] in "TB"]
    look = ["F1", "F2", "F3"]
    frames = session["frames"] = {}
    centers = {}

    def target(name, state=None, events=True):
        return dict(file=STATES_FILE, line=lines[name], state=state, events=events)

    def note(label, result, names):
        rows = {}
        for row in result.get("probe") or []:
            name = next(n for n in names if lines[n] == row["line"])
            rows[name] = {k: row.get(k) for k in SHOWN}
            rows[name]["buttonY"] = (row.get("button") or {}).get("y")
            if row.get("button"):
                b = row["button"]
                centers[name] = (int(b["x"] + b["w"] / 2), int(b["y"] + b["h"] / 2))
        frames[label] = dict(ok=result.get("ok"), sha=result.get("_sha"), waitOk=result.get("waitOk"),
                             e2eMs=result.get("e2eMs"), forceApplied=result.get("forceApplied"), error=result.get("error"),
                             trace=(result.get("trace") or "")[-800:] or None, native=result.get("native"), rows=rows)
        png = os.path.join(helper.io, "frame-%d.png" % result["id"])
        if os.path.exists(png):
            shutil.copy(png, os.path.join(out, "states-%s.png" % label))
        return result

    def scene(label, screen, names, **args):
        return note(label, helper.ask(dict(kind="scene", scene=dict(screen=screen, args=args),
                                           probe=[target(n) for n in names])), names)

    def force(label, entries, names, wait=0):
        return note(label, helper.ask(dict(kind="force", states=entries, min=wait,
                                           probe=[target(n) for n in names])), names)

    def point(label, xy, names, wait=0):
        return note(label, helper.ask(dict(kind="pointer", actions=[["move", xy[0], xy[1]]], min=wait, timeout=1.5,
                                           probe=[target(n) for n in names])), names)

    away = (1900, 1060)
    everything = look + ["F4"]

    # Case 5, forced frames. No pointer event has reached the helper yet.
    scene("force-idle", "llp_force", everything)
    for state in ("hover", "selected", "disabled", "selected_hover", "selected_disabled"):
        force("force-F1-%s" % state, [target("F1", state)], everything)
    force("force-F1-hover-noevents", [target("F1", "hover", events=False)], everything)
    force("force-F2-hover", [target("F2", "hover")], everything)
    for state in ("hover", "selected", "disabled"):
        force("force-group-%s" % state, [target(n, state) for n in look], everything)
    force("force-mixed", [target("F1", "hover"), target("F2", "selected"), target("F3", "disabled")], everything)
    force("force-F4-hover", [target("F4", "hover")], everything, wait=0.5)
    force("force-F4-hover-noevents", [target("F4", "hover", events=False)], everything, wait=0.5)
    force("force-cleared", [], everything, wait=0.5)

    # Does a forced state survive a redraw of the screen with new arguments?
    force("force-F2-hover-again", [target("F2", "hover")], everything)
    scene("force-F2-hover-reshown", "llp_force", everything)
    force("force-cleared-2", [], everything)

    # Case 5, real frames.
    scene("real-F1-selected", "llp_force", everything, sel=1)
    scene("real-F1-disabled", "llp_force", everything, sens=1)
    scene("real-idle", "llp_force", everything)
    point("real-F1-hover", centers["F1"], everything)
    point("real-F2-hover", centers["F2"], everything)
    point("real-F4-hover", centers["F4"], everything, wait=0.5)
    point("real-away", away, everything, wait=0.5)
    scene("real-F1-selected-2", "llp_force", everything, sel=1)
    point("real-F1-selected-hover", centers["F1"], everything)
    point("real-away-2", away, everything)
    # A forced state after the pointer has been used and rests on empty space.
    scene("real-idle-2", "llp_force", everything)
    force("force-F2-hover-after-pointer", [target("F2", "hover")], everything)
    force("force-cleared-3", [], everything)

    # Cases 1 to 4. Real states first, then the same states forced on all sixteen
    # buttons at once.
    scene("grid-idle", "llp_states", grid)
    scene("grid-selected", "llp_states", grid, sel=True)
    scene("grid-disabled", "llp_states", grid, sens=False)
    scene("grid-idle-2", "llp_states", grid)
    grid_centers = {n: centers[n] for n in grid}
    for name in grid:
        point("grid-hover-%s" % name, grid_centers[name], [name])
    point("grid-away", away, grid)
    scene("grid-selected-2", "llp_states", grid, sel=True)
    for name in grid:
        point("grid-selected-hover-%s" % name, grid_centers[name], [name])
    point("grid-away-2", away, grid)
    scene("grid-idle-3", "llp_states", grid)
    for state in ("hover", "selected", "disabled", "selected_hover"):
        force("grid-force-%s" % state, [target(n, state) for n in grid], grid)
    force("grid-force-cleared", [], grid)

    # The digest: one row for each grid button, real and forced values for each state.
    def value(label, name):
        row = frames[label]["rows"].get(name) or {}
        return "%s on %s" % (row.get("pixelText"), row.get("pixelBackground"))

    table = session["table"] = {}
    for name in grid:
        table[name] = dict(
            idle=value("grid-idle", name), hover=value("grid-hover-%s" % name, name),
            selected=value("grid-selected", name), selectedHover=value("grid-selected-hover-%s" % name, name),
            disabled=value("grid-disabled", name), forcedHover=value("grid-force-hover", name),
            forcedSelected=value("grid-force-selected", name), forcedDisabled=value("grid-force-disabled", name),
            forcedSelectedHover=value("grid-force-selected_hover", name))
    pairs = [("force-F1-hover", "real-F1-hover"), ("force-F1-hover-noevents", "real-F1-hover"),
             ("force-F2-hover", "real-F2-hover"), ("force-F1-selected", "real-F1-selected"),
             ("force-F1-disabled", "real-F1-disabled"), ("force-F1-selected_hover", "real-F1-selected-hover"),
             ("force-F4-hover", "real-F4-hover"), ("force-F4-hover-noevents", "real-F4-hover"),
             ("force-cleared", "force-idle"), ("real-away", "force-idle"), ("force-F2-hover-reshown", "force-F2-hover"),
             ("force-F2-hover-after-pointer", "force-F2-hover"), ("force-cleared-3", "force-idle"),
             ("grid-force-cleared", "grid-idle")]
    session["same"] = {"%s = %s" % pair: frames[pair[0]]["sha"] == frames[pair[1]]["sha"] and frames[pair[0]]["sha"] is not None
                       for pair in pairs}


def summarize_states(session):
    lines = ["## states"]
    for name, row in (session.get("table") or {}).items():
        lines.append("%-4s %s" % (name, json.dumps(row)))
    for pair, same in (session.get("same") or {}).items():
        lines.append("same frame %s: %s" % (pair, same))
    for label, frame in (session.get("frames") or {}).items():
        if label.startswith("grid-") and not frame.get("error"):
            if not (label.startswith("grid-force") and frame.get("forceApplied")):
                continue
        lines.append("%s ok=%s wait=%s applied=%s %s" % (label, frame["ok"], frame["waitOk"], frame["forceApplied"],
                     frame.get("error") or ""))
        for name, row in frame["rows"].items():
            if not label.startswith("grid-"):
                lines.append("    %s %s" % (name, json.dumps(row)))
    return "\n".join(lines)


ANIM_FILE = "game/zz_llp_animation.rpy"
MOTION_FILE = "game/loomlight_motion.rpy"
SCREENS_FILE = "game/screens.rpy"


def retry_io(action):
    """Run a file action again while Windows refuses it with a sharing violation."""
    deadline = time.perf_counter() + 5
    while True:
        try:
            return action()
        except PermissionError:
            if time.perf_counter() > deadline:
                raise
            time.sleep(0.001)


def read_lines(path):
    def read():
        with open(path, encoding="utf-8") as f:
            return f.read().split("\n")
    return retry_io(read)


def prepare_animation(project, cases):
    """#213: add the preset definitions. For the inference cases, also add the
    test screens and put presets on the say and choice screens. Returns the
    line of each named element."""
    shutil.copy(os.path.join(HERE, "animation", "loomlight_motion.rpy"), os.path.join(project, MOTION_FILE))
    marks = {}
    if not cases:
        return marks
    shutil.copy(os.path.join(HERE, "animation", "zz_llp_animation.rpy"), os.path.join(project, ANIM_FILE))
    for number, line in enumerate(read_lines(os.path.join(project, ANIM_FILE)), 1):
        if "# @" in line:
            marks[line.split("# @")[1].strip()] = number
    path = os.path.join(project, SCREENS_FILE)
    lines = read_lines(path)
    marker = '    textbutton "%s" action NullAction() pos (%d, %d) xysize (120, 60) background "%s" at %s'
    say = next(i for i, l in enumerate(lines) if l.startswith("screen say("))
    lines[say + 1:say + 1] = [marker % ("S1", 900, 20, "#00ff00", "llp_on_show(0.3)"),
                              marker % ("S2", 1040, 20, "#0000ff", "ll_fade_in(0.3)")]
    window = next(i for i in range(say, len(lines)) if lines[i].strip() == 'id "window"')
    lines.insert(window + 1, "        at ll_fade_in(0.3)")
    choice = next(i for i, l in enumerate(lines) if l.startswith("screen choice("))
    lines[choice + 1:choice + 1] = [marker % ("C1", 900, 100, "#00ff00", "llp_on_show(0.3)"),
                                    marker % ("C2", 1040, 100, "#0000ff", "ll_fade_in(0.3)")]
    vbox = next(i for i in range(choice, len(lines)) if lines[i].strip() == "vbox:")
    lines.insert(vbox + 1, "        at ll_slide_up(0.3)")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    # Index i is line i + 1. The "window:" statement is the line before its id.
    marks.update(S1=say + 2, S2=say + 3, SW=window, C1=choice + 2, C2=choice + 3, CV=vbox + 1)
    return marks


def target(marks, name, **more):
    return dict(file=SCREENS_FILE if name[0] in "SC" else ANIM_FILE, line=marks[name], **more)


def near(value, digits=4):
    return None if value is None else round(float(value), digits)


def tstate(sample, line):
    """The values of the transforms on one element. An "at" list gives several."""
    rows = [r for r in (sample.get("transforms") or []) if r["line"] == line]
    if not rows:
        return None

    def pick(key, choose):
        values = [float(r[key]) for r in rows if r.get(key) is not None]
        return near(choose(values)) if values else None

    return dict(alpha=pick("alpha", min), yoffset=pick("yoffset", lambda v: max(v, key=abs)),
                xoffset=pick("xoffset", lambda v: max(v, key=abs)), zoom=pick("zoom", lambda v: max(v, key=lambda z: abs(z - 1))),
                transforms=len(rows))


def prefix_of(sample, line):
    return next((b["prefix"] for b in (sample.get("buttons") or []) if b["line"] == line), None)


def tint(color, base):
    """If color is base under an alpha over black, return that alpha."""
    if color is None:
        return None
    seen = [c * color[3] / 255.0 for c in color[:3]]
    k = max(range(3), key=lambda i: base[i])
    alpha = seen[k] / base[k]
    if alpha < 0.04 or alpha > 1.04:
        return None
    if all(abs(seen[i] - base[i] * alpha) <= 6 for i in range(3)):
        return round(alpha, 3)
    return None


def rgb(text):
    return [int(text[i:i + 2], 16) for i in (1, 3, 5)]


def extent(runs, base, dimmed=False):
    """Where a solid box of the base color lies along one scan line."""
    hits = []
    for color, start, end in runs or []:
        alpha = tint(color, base)
        if alpha is not None and (dimmed or alpha > 0.96):
            hits.append((start, end, alpha))
    if not hits:
        return None
    return [min(h[0] for h in hits), max(h[1] for h in hits)] + ([hits[0][2]] if dimmed else [])


def frames_table(result, describe):
    rows = []
    for f in result.get("frames") or []:
        row = dict(t=near(f["t"]))
        row.update(describe(f.get("sample") or {}))
        rows.append(row)
    return dict(ok=result.get("ok"), error=result.get("error"), errors=result.get("errors"),
                trace=(result.get("trace") or "")[-800:] or None, engineAheadMs=near(result.get("engineAheadMs"), 1),
                forceApplied=result.get("forceApplied"), frames=rows)


def case_two_transforms(helper, marks):
    """Inference 1: two transforms in one "at" list, each with its own events."""
    names = ["A1", "A2", "A3", "A4"]
    tops = dict(A1=40, A2=200, A3=360, A4=520)
    base = rgb("#c06000")
    probe = dict(transforms=[target(marks, n) for n in names], buttons=[target(marks, n) for n in names],
                 points=[[410, tops[n] + 8] for n in names])

    def describe(sample):
        row = {}
        for i, n in enumerate(names):
            state = tstate(sample, marks[n]) or {}
            pixel = (sample.get("points") or [None] * 4)[i]
            row[n] = dict(alpha=state.get("alpha"), yoffset=state.get("yoffset"), prefix=prefix_of(sample, marks[n]),
                          pixelAlpha=tint(pixel, base))
        return row

    out = {}
    hover = [target(marks, n, state="hover") for n in names]
    idle = [target(marks, n, state="idle") for n in names]
    # "unprimed" renders one frame for each time, as the engine does. "primed"
    # renders the frame of an event three times, which the engine does not do.
    for label, prime in (("primed", 2), ("unprimed", 0)):
        r = helper.ask(dict(kind="frames", scene=dict(screen="llp_m1"), base="show", probe=probe, segments=[
            dict(times=[0.0, 0.2]),
            dict(states=hover, prime=prime, times=[0.2, 0.26, 0.32, 0.5]),
            dict(states=idle, prime=prime, times=[0.5, 0.56, 0.62, 1.0, 1.2])]))
        out[label] = frames_table(r, describe)
    # The same with a real pointer in real time: hover during the fade.
    real = out["pointer"] = []
    for name in ("A1", "A2", "A3"):
        y = tops[name] + 40
        steps = [("shown", dict(kind="scene", scene=dict(screen="llp_m1"), sample=probe)),
                 ("pointer on " + name, dict(kind="pointer", actions=[["move", 230, y]], min=0.3, timeout=2.0, sample=probe)),
                 ("pointer still on " + name, dict(kind="pointer", actions=[["move", 231, y]], min=0.9, timeout=2.5, sample=probe)),
                 ("pointer away", dict(kind="pointer", actions=[["move", 1900, 1060]], min=0.4, timeout=2.0, sample=probe))]
        for label, req in steps:
            r = helper.ask(req)
            sample = r.get("sample") or {}
            row = dict(step=label, ok=r.get("ok"), st=near((sample.get("screens") or {}).get("llp_m1"), 3))
            row.update(describe(sample))
            real.append(row)
    return out


def case_order(helper, marks):
    """Inference 1, the order of the "at" list: hover after the entrance has ended."""
    names = ["B1", "B2", "B3", "B4", "B5"]
    tops = dict(B1=40, B2=200, B3=360, B4=520, B5=680)
    probe = dict(transforms=[target(marks, n) for n in names], buttons=[target(marks, n) for n in names])

    def describe(sample):
        return {n: dict(alpha=(tstate(sample, marks[n]) or {}).get("alpha"), yoffset=(tstate(sample, marks[n]) or {}).get("yoffset"),
                        prefix=prefix_of(sample, marks[n])) for n in names}

    out = dict(pointer=[])
    for name in names:
        y = tops[name] + 40
        helper.ask(dict(kind="scene", scene=dict(screen="llp_m1b")))
        steps = [("0.7 s after the screen appears", dict(kind="pointer", actions=[["move", 1900, 1060]], min=0.7, timeout=2.0, sample=probe)),
                 ("pointer on the button", dict(kind="pointer", actions=[["move", 230, y]], min=0.4, timeout=2.0, sample=probe)),
                 ("pointer moves on the button", dict(kind="pointer", actions=[["move", 240, y]], min=0.4, timeout=2.0, sample=probe)),
                 ("pointer away", dict(kind="pointer", actions=[["move", 1900, 1060]], min=0.4, timeout=2.0, sample=probe)),
                 ("a new interaction starts", dict(kind="force", states=[], min=0.4, sample=probe))]
        for label, req in steps:
            r = helper.ask(req)
            state = describe(r.get("sample") or {})[name]
            out["pointer"].append(dict(button=name, step=label, **state))
    # The same with a forced Hover at set times: hover at 0.6 s, idle at 0.8 s.
    hover = [target(marks, n, state="hover") for n in names]
    idle = [target(marks, n, state="idle") for n in names]
    r = helper.ask(dict(kind="frames", scene=dict(screen="llp_m1b"), base="show", probe=probe, segments=[
        dict(times=[0.15, 0.6]),
        dict(states=hover, at=0.6, times=[0.6, 0.66, 0.72, 0.8]),
        dict(states=idle, at=0.8, times=[0.86, 0.92, 1.0])]))
    out["forced"] = frames_table(r, describe)
    # A forced Hover in the engine's own loop, and the same times with a set clock.
    r = helper.ask(dict(kind="match", scene=dict(screen="llp_m1b"), states=hover, rest=idle, seconds=0.3,
                        region=[30, 30, 400, 740], probe=probe), timeout=60)
    real, fixed = r.get("real") or [], r.get("set") or []
    lift = lambda frames, n: min([(tstate(f, marks[n]) or {}).get("yoffset") or 0 for f in frames] or [None])
    out["match"] = dict(ok=r.get("ok"), error=r.get("error") or (r.get("errors") or [None])[0], trace=(r.get("trace") or "")[-800:] or None,
                        realFrames=len(real), setFrames=len(fixed),
                        sameImage=sum(1 for a, b in zip(real, fixed) if a.get("sha") and a.get("sha") == b.get("sha")),
                        largestLiftInEngineFrames={n: lift(real, n) for n in names},
                        largestLiftInSetFrames={n: lift(fixed, n) for n in names})
    return out


def case_show_reach(helper, marks):
    """Inference 6: "on show" under an "if" and through "use"."""
    names = ["K1", "K2", "K3", "K4", "K5", "K6"]
    lefts = dict(K1=40, K2=180, K3=320, K4=460, K5=600, K6=740)
    colors = dict(K1="#ff0000", K2="#00ff00", K3="#0000ff", K4="#ffff00", K5="#00ffff", K6="#ff00ff")
    probe = dict(transforms=[target(marks, n) for n in names], points=[[lefts[n] + 110, 46] for n in names])

    def describe(sample):
        row = {}
        for i, n in enumerate(names):
            state = tstate(sample, marks[n]) or {}
            pixel = (sample.get("points") or [None] * 6)[i]
            row[n] = dict(alpha=state.get("alpha"), pixelAlpha=tint(pixel, rgb(colors[n])))
        return row

    r = helper.ask(dict(kind="frames", scene=dict(screen="llp_m6"), base="show", probe=probe,
                        segments=[dict(times=[0.0, 0.25, 0.5, 1.0])]))
    return frames_table(r, describe)


def case_zoom(helper, marks):
    """Inference 3: a zoom on a button in a box."""
    grown = ["G2", "H2", "G4", "G5"]
    probe = dict(transforms=[target(marks, n) for n in grown + ["P2"]], cols=[410, 900, 1140, 1910], rows=[134, 46, 406, 1070])
    colors = dict(G1="#800000", G2="#008000", G3="#000080", H1="#804000", H2="#408000", H3="#004080", G4="#808000",
                  G5="#800080", P1="#008080", P2="#ff00ff", P3="#606060")

    def describe(sample):
        cols, rows = sample.get("cols") or [None] * 4, sample.get("rows") or [None] * 4
        where = lambda runs, n: extent(runs, rgb(colors[n]), dimmed=n == "P2")
        row = dict(zoom={n: (tstate(sample, marks[n]) or {}).get("zoom") for n in grown + ["P2"]})
        row["y"] = {n: where(cols[0], n) for n in ("G1", "G2", "G3", "P1", "P2", "P3")}
        row["y"].update(H2=where(cols[1], "H2"), G4=where(cols[2], "G4"), G5=where(cols[3], "G5"))
        row["x"] = dict(G2=where(rows[0], "G2"), H1=where(rows[1], "H1"), H2=where(rows[1], "H2"), H3=where(rows[1], "H3"),
                        G4=where(rows[2], "G4"), G5=where(rows[3], "G5"))
        return row

    hover = [target(marks, n, state="hover") for n in grown]
    idle = [target(marks, n, state="idle") for n in grown]
    r = helper.ask(dict(kind="frames", scene=dict(screen="llp_m3"), base="show", probe=probe, segments=[
        dict(times=[0.06, 0.15, 0.3, 0.6]),
        dict(states=hover, at=0.6, times=[0.6, 0.66, 0.8]),
        dict(states=idle, at=0.8, times=[0.8, 1.0])]))
    return frames_table(r, describe)


def case_edge(helper, marks):
    """Inference 4: the pointer at the edge of a button with a hover lift."""
    probe = dict(transforms=[target(marks, "L4"), target(marks, "L12")], buttons=[target(marks, "L4"), target(marks, "L12")])
    helper.ask(dict(kind="scene", scene=dict(screen="llp_m4")))
    out = []

    def away():
        helper.ask(dict(kind="trace", moves=[[1900, 1060]], after=0.4, probe=probe))

    def digest(label, name, samples):
        frames = [s for s in samples if "move" not in s and "error" not in s]
        prefixes = [prefix_of(s, marks[name]) for s in frames]
        offsets = [(tstate(s, marks[name]) or {}).get("yoffset") for s in frames]
        offsets = [o for o in offsets if o is not None]
        runs = []
        for p in prefixes:
            if runs and runs[-1][0] == p:
                runs[-1][1] += 1
            else:
                runs.append([p, 1])
        seconds = (frames[-1]["t"] - frames[0]["t"]) if len(frames) > 1 else 0
        return dict(case=label, button=name, moves=sum(1 for s in samples if "move" in s), frames=len(frames),
                    seconds=near(seconds, 2), stateChanges=max(0, len(runs) - 1), stateRuns=runs[:40],
                    yoffsetMin=min(offsets) if offsets else None, yoffsetMax=max(offsets) if offsets else None,
                    finalState=prefixes[-1] if prefixes else None, finalYoffset=offsets[-1] if offsets else None,
                    errors=sum(1 for s in samples if "error" in s))

    def trace(label, name, moves, after=0.4):
        away()
        r = helper.ask(dict(kind="trace", moves=moves, interval=0.016, after=after, probe=probe), timeout=30)
        out.append(digest(label, name, r.get("samples") or []))

    line = lambda y: [[100 + i, y] for i in range(60)]
    trace("pointer moves along the middle, y 80", "L4", line(80))
    trace("pointer moves along the strip 2 px above the bottom edge, y 118", "L4", line(118))
    trace("pointer moves along the last row, y 119", "L4", line(119))
    trace("pointer moves 2 px above the top edge, y 38", "L4", line(38))
    trace("pointer moves along the top row, y 40", "L4", line(40))
    trace("12 px lift: pointer moves 6 px above the bottom edge, y 374", "L12", line(374))
    trace("one move into the strip, y 118, then rest for 1 s", "L4", [[100, 118]], after=1.0)
    # The pointer still rests in the strip. Start a new interaction a few times,
    # as a screen update does in a game.
    rests = []
    for i in range(4):
        r = helper.ask(dict(kind="force", states=[], min=0.3, sample=probe))
        sample = r.get("sample") or {}
        rests.append(dict(state=prefix_of(sample, marks["L4"]), yoffset=(tstate(sample, marks["L4"]) or {}).get("yoffset")))
    away()
    return dict(traces=out, restingPointerThenNewInteraction=rests)


SAY_POINTS = [[1010, 26], [1150, 26], [1010, 106], [1150, 106], [1610, 26], [1750, 26]]
GREEN, BLUE, PINK, CYAN = [0, 255, 0], [0, 0, 255], [255, 0, 255], [0, 255, 255]


def story_row(sample, marks, names):
    points = sample.get("points") or [None] * 6
    pixels = dict(S1=tint(points[0], GREEN), S2=tint(points[1], BLUE), C1=tint(points[2], GREEN), C2=tint(points[3], BLUE),
                  U1=tint(points[4], PINK), U2=tint(points[5], CYAN))
    row = dict(step=sample.get("step"), line=sample.get("line"), skipping=sample.get("skipping"),
               screens={k: near(v, 3) for k, v in (sample.get("screens") or {}).items()})
    for n in names:
        state = tstate(sample, marks[n]) or {}
        row[n] = dict(alpha=state.get("alpha"), yoffset=state.get("yoffset"))
        if n in pixels and sample.get("points"):
            row[n]["pixelAlpha"] = pixels[n]
    return row


def case_lines(helper, marks):
    """Inference 2: an entrance on the say and choice screens, over real lines and menus."""
    names = ["SW", "S1", "S2", "CV", "C1", "C2"]
    probe = dict(transforms=[target(marks, n) for n in names], points=SAY_POINTS)
    steps = [dict(do="say", what="Line %d of the story." % i, capture=[0.1, 0.6]) for i in range(3)]
    steps += [dict(do="menu", items=["First choice", "Second choice"], capture=[0.1, 0.6]) for i in range(2)]
    steps += [dict(do="say", what="A line after the menus.", capture=[0.1, 0.6])]
    r = helper.ask(dict(kind="story", steps=steps, probe=probe), timeout=90)
    rows = []
    for s in r.get("samples") or []:
        row = story_row(s, marks, names)
        row["what"] = steps[s["step"]]["do"] if s.get("step") is not None else None
        row["wanted"] = s.get("want")
        rows.append(row)
    return dict(ok=r.get("ok"), notes=r.get("notes"), error=r.get("error"), trace=(r.get("trace") or "")[-800:] or None,
                samples=rows)


def case_skip(helper, marks):
    """Inference 5: ATL while the player skips."""
    names = ["SW", "S1", "S2", "U1", "U2"]
    probe = dict(transforms=[target(marks, n) for n in names], points=SAY_POINTS)
    steps = [dict(do="show", screen="llp_m5_hud"),
             dict(do="say", what="A line before the skip.", capture=[0.1]),
             dict(do="skip", count=40, pixels=False),
             dict(do="skip", count=25, pixels=True),
             dict(do="say", what="A line after the skip.", capture=[0.2, 0.6]),
             dict(do="hide", screen="llp_m5_hud")]
    r = helper.ask(dict(kind="story", steps=steps, probe=probe), timeout=90)
    out = dict(ok=r.get("ok"), notes=r.get("notes"), error=r.get("error"), trace=(r.get("trace") or "")[-800:] or None,
               skipDelayMs=r.get("skipDelay"), captures=[story_row(s, marks, names) for s in r.get("samples") or []], skips=[])
    for index, samples in sorted((r.get("records") or {}).items()):
        rows = [story_row(s, marks, names) for s in samples if "error" not in s]
        lines = [l for l in (r.get("lines") or []) if l["step"] == int(index)]

        def spread(name, key):
            values = [row[name].get(key) for row in rows if row[name].get(key) is not None]
            if not values:
                return None
            return dict(min=min(values), median=near(statistics.median(values)), max=max(values), n=len(values))

        hud = [(row["screens"].get("llp_m5_hud"), row["U1"]["alpha"], row["U2"]["alpha"]) for row in rows]
        hud = [h for h in hud if h[0] is not None]
        out["skips"].append(dict(
            step=int(index), frames=len(rows), linesSeen=len({row["line"] for row in rows}), lines=len(lines),
            lineMs=stats([l["ms"] for l in lines]), stillSkippingAfterEachLine=all(l["skipping"] for l in lines),
            skippingInFrames=sorted({str(row["skipping"]) for row in rows}),
            sayScreenAgeMs=stats([1000 * row["screens"]["say"] for row in rows if row["screens"].get("say") is not None]),
            S1=dict(alpha=spread("S1", "alpha"), pixelAlpha=spread("S1", "pixelAlpha")),
            S2=dict(alpha=spread("S2", "alpha"), pixelAlpha=spread("S2", "pixelAlpha")),
            SW=dict(alpha=spread("SW", "alpha")),
            hudFirst=hud[0] if hud else None, hudLast=hud[-1] if hud else None,
            hudAlphaRises=all(b[1] >= a[1] and b[2] >= a[2] for a, b in zip(hud, hud[1:]))
            if hud and all(h[1] is not None and h[2] is not None for h in hud) else None,
            first=rows[:3], last=rows[-2:]))
    return out


def run_cases(helper, marks, session):
    """#213: the six inferences. One failed case does not stop the others."""
    cases = session["cases"] = {}
    plan = [("1 two transforms", case_two_transforms), ("1 order", case_order), ("6 show reach", case_show_reach), ("3 zoom", case_zoom),
            ("4 edge", case_edge), ("2 lines", case_lines), ("5 skip", case_skip)]
    for name, run in plan:
        try:
            # A screen with an "on hide" block stays for a moment. Let it go first.
            helper.ask(dict(kind="scene", scene=dict(screen="llp_m4"), min=0.5))
            helper.ask(dict(kind="force", states=[]))
            cases[name] = run(helper, marks)
        except Exception:
            import traceback
            cases[name] = dict(failed=traceback.format_exc()[-1500:])
        if helper.process.poll() is not None:
            break


def remove_frames(io, request):
    """Count and delete the frame files of one burst request."""
    count, size = 0, 0
    while True:
        path = os.path.join(io, "burst-%d-%d.png" % (request, count))
        if not os.path.exists(path):
            break
        size += os.path.getsize(path)
        retry_io(lambda: os.remove(path))
        count += 1
    return count, size


def measure_burst(helper, project, session, reps, fps=30):
    """#213: the frame burst, and the check of set-time frames against the engine's own frames.

    The entrance is on a box of the stock preferences screen. The hover
    animation is on the Preferences button of the stock navigation screen. Each
    request carries the change as an unsaved draft, as an author's choice does.
    """
    path = os.path.join(project, "game", "screens.rpy")
    pref_line, pref_text = block(path, "screen preferences(")
    nav_line, nav_text = block(path, "screen navigation(")
    pref_lines, nav_lines = pref_text.split("\n"), nav_text.split("\n")
    radio = next(i for i, l in enumerate(pref_lines) if l.strip() == 'style_prefix "radio"')
    indent = pref_lines[radio][:len(pref_lines[radio]) - len(pref_lines[radio].lstrip())]
    box_line = pref_line + radio - 1
    button = next(i for i, l in enumerate(nav_lines) if l.strip().startswith('textbutton _("Preferences")'))
    button_line = nav_line + button

    def entrance(preset):
        lines = list(pref_lines)
        lines.insert(radio + 1, indent + "at " + preset)
        return dict(file=path, line=pref_line, text="\n".join(lines), screen="preferences")

    def hover(preset):
        lines = list(nav_lines)
        lines[button] += " at " + preset
        return dict(file=path, line=nav_line, text="\n".join(lines), screen="navigation")

    def plain(line, text, screen):
        helper.ask(dict(kind="load", file=path, line=line, text=text, screen=screen))

    scene = dict(screen="preferences")
    shown = helper.ask(dict(kind="scene", scene=scene, geometry=True))
    in_screens = lambda g: g["file"].replace("\\", "/").endswith(SCREENS_FILE)
    box = next(g for g in shown["geometry"] if g["line"] == box_line and in_screens(g) and g["cls"] == "MultiBox")
    label = next(g for g in shown["geometry"] if g["line"] == button_line and in_screens(g) and g.get("container"))
    # A box reports the space it was offered. Its content is the text of the lines in its block.
    last = radio + 1
    while last < len(pref_lines) and (not pref_lines[last].strip() or pref_lines[last].startswith(indent)):
        last += 1
    inside = [g for g in shown["geometry"] if in_screens(g) and g["cls"] == "Text" and pref_line + radio < g["line"] < pref_line + last]
    box = dict(x=box["x"], y=box["y"], w=max(g["x"] + g["w"] for g in inside) - box["x"],
               h=max(g["y"] + g["h"] for g in inside) - box["y"])

    def around(rect, margin):
        x0, y0 = max(0, int(rect["x"] - margin)), max(0, int(rect["y"] - margin))
        x1, y1 = min(1920, int(rect["x"] + rect["w"] + margin) + 1), min(1080, int(rect["y"] + rect["h"] + margin) + 1)
        return [x0, y0, x1 - x0, y1 - y0]

    box_region, button_region = around(box, 64), around(label["container"], 24)
    box_target = dict(file=SCREENS_FILE, line=box_line)
    button_target = dict(file=SCREENS_FILE, line=button_line)
    hover_on, hover_off = [dict(button_target, state="hover")], [dict(button_target, state="idle")]
    entrance_times = [k / fps for k in range(int(round(0.3 * fps)) + 1)]
    in_times = [k / fps for k in range(int(0.12 * fps) + 1)] + [0.12]
    out_times = [0.12 + k / fps for k in range(1, int(0.12 * fps) + 1)] + [0.24]
    entrances = ["ll_slide_up(0.3)", "ll_fade_in(0.3)", "ll_pop(0.3)", "ll_slide_left(0.3)", "ll_slide_right(0.3)"]
    hovers = ["ll_hover_lift(0.12)", "ll_hover_grow(0.12)", "ll_hover_brighten(0.12)"]
    burst = session["burst"] = dict(
        fps=fps, frameSize=shown.get("frameSize"), drawPerVirt=shown.get("drawPerVirt"), renderer=shown.get("renderer"),
        boxRegion=box_region, buttonRegion=button_region, entranceTimes=entrance_times, hoverTimes=in_times + out_times,
        reps=reps, runs={})

    def entrance_request(i, deliver, region, probe=None):
        return dict(kind="frames", load=entrance(entrances[i % len(entrances)]), scene=scene, base="show", deliver=deliver,
                    region=region, probe=probe, segments=[dict(times=entrance_times)])

    def hover_request(i, deliver, region, probe=None):
        return dict(kind="frames", load=hover(hovers[i % len(hovers)]), scene=scene, deliver=deliver, region=region,
                    probe=probe, segments=[dict(states=hover_on, at=0.0, times=in_times),
                                           dict(states=hover_off, at=0.12, times=out_times)])

    def series(name, make, deliver, region):
        rows = burst["runs"][name] = []
        for i in range(reps):
            r = helper.ask(make(i, deliver, region), timeout=60)
            frames = r.get("frames") or []
            count, size = remove_frames(helper.io, r["id"])
            rows.append(dict(ok=r.get("ok"), error=r.get("error") or (r.get("errors") or [None])[0], e2eMs=r.get("e2eMs"),
                             helperMs=r.get("helperMs"), loadMs=r.get("loadMs"), showMs=r.get("showMs"),
                             burstMs=r.get("burstMs"), firstFrameMs=frames[0]["doneMs"] if frames else None,
                             frames=len(frames), files=count, bytes=size, frameSize=frames[0]["size"] if frames else None,
                             renderMs=[f["renderMs"] for f in frames], readMs=[f["readMs"] for f in frames],
                             encodeMs=[f["encodeMs"] for f in frames], forceApplied=r.get("forceApplied"),
                             engineFramesBefore=r.get("engineFramesBefore"), hidden=(r.get("native") or {}),
                             regionError=r.get("regionError"), trace=(r.get("trace") or "")[-800:] or None))

    modes = [("full frame, PNG", "png", None), ("full frame, PNG with no compression", "png0", None),
             ("element region, PNG", "png", True), ("element region, PNG with no compression", "png0", True),
             ("full frame, no file", "none", None)]
    for label_text, deliver, region in modes:
        series("entrance 0.3 s: " + label_text, entrance_request, deliver, box_region if region else None)
    plain(pref_line, pref_text, "preferences")
    for label_text, deliver, region in modes:
        series("hover 0.12 s in and out: " + label_text, hover_request, deliver, button_region if region else None)

    # The values of the animation at each set time, for a check against the ATL formula.
    values = session["values"] = {}
    r = helper.ask(entrance_request(0, "none", box_region, probe=dict(transforms=[box_target])))
    values["ll_slide_up(0.3) on the box"] = [dict(t=near(f["t"]), **(tstate(f["sample"], box_line) or {})) for f in r.get("frames") or []]
    plain(pref_line, pref_text, "preferences")
    r = helper.ask(hover_request(0, "none", button_region, probe=dict(transforms=[button_target], buttons=[button_target])))
    values["ll_hover_lift(0.12) on the button"] = [
        dict(t=near(f["t"]), state=prefix_of(f["sample"], button_line), **(tstate(f["sample"], button_line) or {}))
        for f in r.get("frames") or []]

    # Set-time frames against the frames that the engine draws by itself.
    match = session["match"] = {}

    def compare(name, r, line):
        real, fixed = r.get("real") or [], r.get("set") or []
        pairs = []
        for a, b in zip(real, fixed):
            sa, sb = tstate(a, line) or {}, tstate(b, line) or {}
            pairs.append(dict(at=near(a.get("at")), same=a.get("sha") is not None and a.get("sha") == b.get("sha"),
                              real=dict(alpha=sa.get("alpha"), yoffset=sa.get("yoffset"), xoffset=sa.get("xoffset"), zoom=sa.get("zoom")),
                              set=dict(alpha=sb.get("alpha"), yoffset=sb.get("yoffset"), xoffset=sb.get("xoffset"), zoom=sb.get("zoom"))))

        def worst(key):
            gaps = [abs(p["real"][key] - p["set"][key]) for p in pairs if p["real"].get(key) is not None and p["set"].get(key) is not None]
            return near(max(gaps), 6) if gaps else None

        match[name] = dict(ok=r.get("ok"), error=r.get("error") or (r.get("errors") or [None])[0],
                           trace=(r.get("trace") or "")[-800:] or None, realFrames=len(real), setFrames=len(fixed),
                           sameImage=sum(1 for p in pairs if p["same"]), distinctImages=len({a.get("sha") for a in real}),
                           worstGap=dict(alpha=worst("alpha"), yoffset=worst("yoffset"), xoffset=worst("xoffset"), zoom=worst("zoom")),
                           different=[p for p in pairs if not p["same"]][:6], sample=pairs[:12])

    for preset in ("ll_slide_up(0.3)", "ll_pop(0.3)", "ll_fade_in(0.3)"):
        r = helper.ask(dict(kind="match", load=entrance(preset), scene=scene, tag="menu", seconds=0.45, region=box_region,
                            probe=dict(transforms=[box_target])), timeout=60)
        compare("entrance " + preset, r, box_line)
    plain(pref_line, pref_text, "preferences")
    # The last one is the form of #203 for an entrance and a hover animation on one button.
    for preset in hovers + ["ll_fade_in(0.3), ll_hover_lift(0.12)"]:
        r = helper.ask(dict(kind="match", load=hover(preset), scene=scene, states=hover_on, rest=hover_off, seconds=0.3,
                            region=button_region, probe=dict(transforms=[button_target])), timeout=60)
        compare("hover " + preset, r, button_line)
    plain(nav_line, nav_text, "navigation")


def flat(rows, key):
    return [v for row in rows for v in (row.get(key) or [])]


def summarize_animation(session):
    """A digest of the #213 results that fits in a terminal."""
    out = dict(cases=session.get("cases"), values=session.get("values"), match=session.get("match"))
    burst = session.get("burst")
    if burst:
        table = {}
        for name, rows in burst["runs"].items():
            good = [r for r in rows if r["ok"]]
            hidden = [r["hidden"] for r in rows]
            table[name] = dict(
                ok="%d of %d" % (len(good), len(rows)), error=next((r["error"] for r in rows if r["error"]), None),
                regionError=next((r["regionError"] for r in rows if r.get("regionError")), None),
                framesPerBurst=sorted({r["frames"] for r in rows}), filesPerBurst=sorted({r["files"] for r in rows}),
                frameSize=next((r["frameSize"] for r in rows if r["frameSize"]), None),
                bytesPerFrame=stats([r["bytes"] / r["files"] for r in rows if r["files"]]),
                requestToLastFrameMs=stats([r["e2eMs"] for r in good]), requestToFirstFrameMs=stats([r["firstFrameMs"] for r in good]),
                draftLoadMs=stats([r["loadMs"] for r in good]), showMs=stats([r["showMs"] for r in good]),
                burstMs=stats([r["burstMs"] for r in good]), perFrameRenderMs=stats(flat(good, "renderMs")),
                perFrameReadbackMs=stats(flat(good, "readMs")), perFrameEncodeMs=stats(flat(good, "encodeMs")),
                forceApplied=sorted({json.dumps(r["forceApplied"]) for r in rows}),
                notHidden=sum(1 for h in hidden if h.get("hidden") is not True),
                nativeSample=hidden[0] if hidden else None)
        out["burst"] = dict({k: v for k, v in burst.items() if k != "runs"}, table=table)
    return json.dumps(out, indent=1, default=str)


def summarize(results):
    lines = []
    for variant, data in results["variants"].items():
        lines.append("## %s" % variant)
        lines.append("copy build ms: %s" % data.get("copyMs"))
        lines.append("starts: %s" % json.dumps([dict(compiled=s.get("compiled"), launchToImageMs=round(s["launchToImageMs"]))
                                                 for s in data["starts"] if "launchToImageMs" in s]))
        s = data.get("session")
        if not s:
            continue
        if "cases" in s or "burst" in s:
            lines.append(summarize_animation(s))
            lines.append("focus: %s" % json.dumps(data.get("focus")))
            continue
        if "frames" in s:
            lines.append(summarize_states(s))
            lines.append("focus: %s" % json.dumps(data.get("focus")))
            continue
        for name, path in s.get("paths", {}).items():
            lines.append("path %s: e2e %s helper %s changed %s" % (name, stats([r.get("e2eMs") for r in path]),
                         stats([r.get("helperMs") for r in path]), [r.get("changed") for r in path]))
        for name, path in s.get("drafts", {}).items():
            lines.append("draft %s: e2e %s changed %s" % (name, stats([r.get("e2eMs") for r in path]), [r.get("changed") for r in path]))
        for name, screen in s.get("screens", {}).items():
            verdicts = {}
            for row in screen["lines"]:
                verdicts[row["verdict"]] = verdicts.get(row["verdict"], 0) + 1
            checks = [c for c in (screen["rectChecks"] or []) if "bestMatch" in c]
            exact = sum(1 for c in checks if c["zeroMatch"] >= 0.9)
            off = [max(abs(c["dx"]), abs(c["dy"])) for c in checks if c["bestMatch"] >= 0.9]
            lines.append("screen %s: elements %d lines %s coverage %s rect checked %d exact %d max offset %s skipped %d" % (
                name, screen["elements"], verdicts, json.dumps(screen["coverage"]), len(checks), exact,
                max(off) if off else None, len(screen["rectChecks"] or []) - len(checks)))
        for b in s.get("broken", []):
            lines.append("broken %s: ok=%s error=%s errorMs=%.0f errorToGood=%.0f alive=%s" % (
                b["case"], b["errorOk"], b["error"], b["errorMs"] or -1, b["errorToGoodImageMs"], b["processAlive"]))
        p = s.get("pointer")
        if not p:
            continue
        lines.append("pointer moves e2e %s changed %s" % (stats([r.get("e2eMs") for r in p["moves"]]), [r.get("changed") for r in p["moves"]]))
        if p["click"]:
            lines.append("click e2e %.0f firstDraw %s changed %s screens %s" % (p["click"]["e2eMs"], p["click"].get("firstDrawMs"),
                         p["click"]["changed"], p["click"]["screensAfter"]))
        lines.append("focus: %s" % json.dumps(data.get("focus")))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sdk", required=True)
    ap.add_argument("--work", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--phase", default="all", choices=["all", "smoke", "broken", "states", "animation", "burst"])
    ap.add_argument("--reps", type=int, default=20, help="bursts for each row of the frame burst")
    ap.add_argument("--max-processes", type=int, default=15)
    ap.add_argument("--max-seconds", type=int, default=600)
    args = ap.parse_args()
    budget = Budget(args.max_processes, args.max_seconds)
    os.makedirs(args.work, exist_ok=True)
    os.makedirs(args.out, exist_ok=True)
    log = open(os.path.join(args.out, "sdk-output.log"), "ab")
    results = dict(host=dict(platform=sys.platform, python=sys.version.split()[0]), variants={})
    if hasattr(os, "getloadavg"):
        results["host"]["loadBefore"] = os.getloadavg()
    commit = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    results["commit"] = commit

    stock = os.path.join(args.work, "stock-src")
    if not os.path.isdir(stock):
        results["generateMs"] = generate_stock(args.sdk, stock, budget, log)
    large = os.path.join(args.work, "large-src")
    if args.phase == "all":
        results["largeStoryLines"] = write_large(stock, large)

    animation = args.phase in ("animation", "burst")
    single = args.phase in ("smoke", "broken", "states") or animation
    plan = [("stock", stock, 4)] if single else [("stock", stock, 4), ("large", large, 3)]
    reps = {"stock": 10, "large": 6}
    try:
        for variant, source, starts in plan:
            data = results["variants"].setdefault(variant, dict(starts=[]))
            copy = os.path.join(args.work, "copy-" + variant)
            shutil.rmtree(copy, ignore_errors=True)
            began = time.perf_counter()
            shutil.copytree(source, copy)
            data["copyMs"] = (time.perf_counter() - began) * 1000
            if args.phase == "states":
                # The test screens load with the project, so they go in before the helper starts.
                shutil.copy(os.path.join(HERE, "states", "zz_llp_states.rpy"), os.path.join(copy, STATES_FILE))
            if animation:
                marks = prepare_animation(copy, cases=args.phase == "animation")
            # "animation" uses one helper for the inference cases and a new one for the frame burst.
            for k in range(2 if args.phase == "animation" else 1 if single else starts):
                io = os.path.join(args.work, "io-%s-%d" % (variant, k))
                helper = Helper(args.sdk, copy, io, budget, log)
                start = dict(compiled=k == 0, launchToImageMs=helper.first["launchToImageMs"], tLaunch=helper.t_launch,
                             helperFirst={key: helper.first.get(key) for key in ("tInit", "tCommand", "tMain", "tRequest", "tPng", "native", "renderer", "physical", "drawPerVirt")})
                try:
                    if animation:
                        data.setdefault("session", {})
                        if args.phase == "animation" and k == 0:
                            run_cases(helper, marks, data["session"])
                        else:
                            measure_burst(helper, copy, data["session"], args.reps)
                    elif args.phase == "states":
                        data["session"] = {}
                        measure_states(helper, copy, args.out, data["session"])
                    elif args.phase == "broken":
                        data["session"] = {}
                        helper.ask(dict(kind="scene", scene=dict(screen="say", who="Eileen", what="A sample line.")))
                        measure_broken(helper, os.path.join(copy, "game", "screens.rpy"), data["session"])
                    elif args.phase == "smoke" or k == 1:
                        if args.phase == "smoke":
                            data["session"] = None
                            r = helper.ask(dict(kind="scene", scene=dict(screen="preferences"), geometry=True))
                            data["smoke"] = dict(prefs=dict(e2eMs=r["e2eMs"], elements=len(r.get("geometry", []))),
                                                 lines=check_lines(copy, r.get("geometry", []))[:40])
                            shutil.copy(os.path.join(io, "frame-%d.png" % r["id"]), os.path.join(args.out, "smoke-preferences.png"))
                        else:
                            data["session"] = {}
                            measure_session(helper, copy, variant, reps[variant], args.out, data["session"])
                finally:
                    stopped = helper.stop()
                    start["stop"] = stopped
                    if animation:
                        data.setdefault("focus", []).append(stopped["focus"])
                        # Every request and result, so that a digest can be made again without a run.
                        with open(os.path.join(args.out, "raw-%d.json" % k), "w", encoding="utf-8") as f:
                            json.dump(helper.history, f, default=str)
                    elif k == 1 or single:
                        data["focus"] = stopped["focus"]
                data["starts"].append(start)
                shutil.copy(os.path.join(io, "frame-0.png"), os.path.join(args.out, "%s-first-%d.png" % (variant, k)))
    except BaseException as e:
        import traceback
        results["error"] = traceback.format_exc()
        print(results["error"], file=sys.stderr)
    finally:
        results["processesUsed"] = budget.processes - budget.left
        if hasattr(os, "getloadavg"):
            results["host"]["loadAfter"] = os.getloadavg()
        with open(os.path.join(args.out, "results.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=1, default=str)
        summary = summarize(results)
        with open(os.path.join(args.out, "summary.txt"), "w", encoding="utf-8") as f:
            f.write(summary + "\n")
        print(summary)
        print("processes used:", results["processesUsed"])


if __name__ == "__main__":
    main()
