"""Throwaway measurement driver for #198. Never merged.

Usage: python driver.py --sdk <verified 8.5.3 SDK> --work <dir> --out <dir> [--phase all|smoke]

One run of this script is one attempt under the limit recorded on #198. It
starts at most --max-processes SDK processes and stops after --max-seconds.
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
        self.io, self.seq, self.budget = io, 0, budget
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
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
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

    # Drafts with errors, each followed by a good draft.
    broken = session["broken"] = []
    for case, bad in (("parse", saved.replace('id "window"', 'id "window"\n        xoffset (', 1)),
                      ("runtime", saved.replace('id "window"', 'id "window"\n        $ llp_boom = 1 // llp_zero', 1))):
        for i in range(3):
            err = helper.ask(dict(kind="load", file=screens_rpy, line=line, text=bad, screen="say"))
            good_started = time.perf_counter()
            good = helper.ask(dict(kind="load", file=screens_rpy, line=line,
                                   text=saved.replace('id "window"', 'id "window"\n        xoffset %d' % (10 + i), 1), screen="say"))
            broken.append(dict(case=case, errorOk=err.get("ok"), error=err.get("error"),
                               messages=err.get("messages"), trace=(err.get("trace") or "")[-600:],
                               errorMs=err.get("e2eMs"), errorToGoodImageMs=(good["_seen"] - err["_seen"]) * 1000,
                               goodAfterErrorMs=(good["_seen"] - good_started) * 1000, goodOk=good.get("ok"),
                               processAlive=helper.process.poll() is None))
    session["broken"] = broken
    helper.ask(dict(kind="load", file=screens_rpy, line=line, text=saved, screen="say"))

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
        for name, path in s["paths"].items():
            lines.append("path %s: e2e %s helper %s changed %s" % (name, stats([r.get("e2eMs") for r in path]),
                         stats([r.get("helperMs") for r in path]), [r.get("changed") for r in path]))
        for name, path in s["drafts"].items():
            lines.append("draft %s: e2e %s changed %s" % (name, stats([r.get("e2eMs") for r in path]), [r.get("changed") for r in path]))
        for name, screen in s["screens"].items():
            verdicts = {}
            for row in screen["lines"]:
                verdicts[row["verdict"]] = verdicts.get(row["verdict"], 0) + 1
            checks = [c for c in (screen["rectChecks"] or []) if "bestMatch" in c]
            exact = sum(1 for c in checks if c["zeroMatch"] >= 0.9)
            off = [max(abs(c["dx"]), abs(c["dy"])) for c in checks if c["bestMatch"] >= 0.9]
            lines.append("screen %s: elements %d lines %s coverage %s rect checked %d exact %d max offset %s skipped %d" % (
                name, screen["elements"], verdicts, json.dumps(screen["coverage"]), len(checks), exact,
                max(off) if off else None, len(screen["rectChecks"] or []) - len(checks)))
        for b in s["broken"]:
            lines.append("broken %s: ok=%s error=%s errorMs=%.0f errorToGood=%.0f alive=%s" % (
                b["case"], b["errorOk"], b["error"], b["errorMs"] or -1, b["errorToGoodImageMs"], b["processAlive"]))
        p = s["pointer"]
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
    ap.add_argument("--phase", default="all", choices=["all", "smoke"])
    ap.add_argument("--max-processes", type=int, default=15)
    ap.add_argument("--max-seconds", type=int, default=600)
    args = ap.parse_args()
    budget = Budget(args.max_processes, args.max_seconds)
    os.makedirs(args.work, exist_ok=True)
    os.makedirs(args.out, exist_ok=True)
    log = open(os.path.join(args.out, "sdk-output.log"), "ab")
    results = dict(host=dict(platform=sys.platform, python=sys.version.split()[0]), variants={})
    commit = subprocess.run(["git", "-C", REPO, "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    results["commit"] = commit

    stock = os.path.join(args.work, "stock-src")
    if not os.path.isdir(stock):
        results["generateMs"] = generate_stock(args.sdk, stock, budget, log)
    large = os.path.join(args.work, "large-src")
    if args.phase == "all":
        results["largeStoryLines"] = write_large(stock, large)

    plan = [("stock", stock, 4)] if args.phase == "smoke" else [("stock", stock, 4), ("large", large, 3)]
    reps = {"stock": 10, "large": 6}
    try:
        for variant, source, starts in plan:
            data = results["variants"].setdefault(variant, dict(starts=[]))
            copy = os.path.join(args.work, "copy-" + variant)
            shutil.rmtree(copy, ignore_errors=True)
            began = time.perf_counter()
            shutil.copytree(source, copy)
            data["copyMs"] = (time.perf_counter() - began) * 1000
            for k in range(1 if args.phase == "smoke" else starts):
                io = os.path.join(args.work, "io-%s-%d" % (variant, k))
                helper = Helper(args.sdk, copy, io, budget, log)
                start = dict(compiled=k == 0, launchToImageMs=helper.first["launchToImageMs"],
                             helperFirst={key: helper.first.get(key) for key in ("tInit", "tCommand", "tMain", "tRequest", "tPng", "native", "renderer", "physical", "drawPerVirt")})
                try:
                    if args.phase == "smoke" or k == 1:
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
                    if k == 1 or args.phase == "smoke":
                        data["focus"] = stopped["focus"]
                data["starts"].append(start)
                shutil.copy(os.path.join(io, "frame-0.png"), os.path.join(args.out, "%s-first-%d.png" % (variant, k)))
    except BaseException as e:
        import traceback
        results["error"] = traceback.format_exc()
        print(results["error"], file=sys.stderr)
    finally:
        results["processesUsed"] = budget.processes - budget.left
        with open(os.path.join(args.out, "results.json"), "w", encoding="utf-8") as f:
            json.dump(results, f, indent=1, default=str)
        summary = summarize(results)
        with open(os.path.join(args.out, "summary.txt"), "w", encoding="utf-8") as f:
            f.write(summary + "\n")
        print(summary)
        print("processes used:", results["processesUsed"])


if __name__ == "__main__":
    main()
