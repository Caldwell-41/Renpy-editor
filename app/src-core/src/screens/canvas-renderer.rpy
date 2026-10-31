# Loomlight-only renderer. This private project contains no game source or bytecode.
init -999 python:
    import os as _canvas_early_os
    try:
        import runpy as _canvas_runpy
        _canvas_bootstrap = _canvas_runpy.run_path(config.basedir + "/canvas-bootstrap.py", run_name="_loomlight_canvas")
        _canvas_native = _canvas_bootstrap["install"](config.basedir)
    except BaseException:
        _canvas_early_os._exit(72)

define config.screen_width = 1920
define config.screen_height = 1080
define config.name = "Loomlight canvas helper"
define config.save_directory = None
define config.sound = False
define config.developer = False
define config.console = False
define config.autoreload = False

init python:
    import json as _canvas_json
    import os as _canvas_os
    import time as _canvas_time
    _canvas_previous_cleanup_ms = 0.0

    if _canvas_os.name == "nt":
        import ctypes as _canvas_ctypes
        from ctypes import wintypes as _canvas_wintypes
        import msvcrt as _canvas_msvcrt
        _canvas_kernel = _canvas_ctypes.WinDLL("kernel32", use_last_error=True)
        _canvas_kernel.CreateFileW.argtypes = [_canvas_wintypes.LPCWSTR, _canvas_wintypes.DWORD, _canvas_wintypes.DWORD, _canvas_wintypes.LPVOID, _canvas_wintypes.DWORD, _canvas_wintypes.DWORD, _canvas_wintypes.HANDLE]
        _canvas_kernel.CreateFileW.restype = _canvas_wintypes.HANDLE
        _canvas_kernel.CloseHandle.argtypes = [_canvas_wintypes.HANDLE]
        _canvas_kernel.CloseHandle.restype = _canvas_wintypes.BOOL
        _canvas_kernel.SetFileInformationByHandle.argtypes = [_canvas_wintypes.HANDLE, _canvas_ctypes.c_int, _canvas_wintypes.LPVOID, _canvas_wintypes.DWORD]
        _canvas_kernel.SetFileInformationByHandle.restype = _canvas_wintypes.BOOL
        class _CanvasRenameInfo(_canvas_ctypes.Structure):
            _fields_ = [("Flags", _canvas_wintypes.DWORD), ("RootDirectory", _canvas_wintypes.HANDLE), ("FileNameLength", _canvas_wintypes.DWORD), ("FileName", _canvas_ctypes.c_ushort * 1)]

    def _canvas_replace(source, target):
        if _canvas_os.name != "nt":
            return _canvas_os.replace(source, target)
        # The core can still be reading the previous PNG/result. Replace its
        # directory entry while preserving that reader's complete old file.
        encoded = target.encode("utf-16-le")
        size = _canvas_ctypes.sizeof(_CanvasRenameInfo) + len(encoded)
        alignment = _canvas_ctypes.sizeof(_canvas_wintypes.HANDLE)
        storage = (_canvas_wintypes.HANDLE * ((size + alignment - 1) // alignment))()
        info = _CanvasRenameInfo.from_buffer(storage)
        info.Flags, info.FileNameLength = 0x1 | 0x2, len(encoded)
        _canvas_ctypes.memmove(_canvas_ctypes.addressof(storage) + _CanvasRenameInfo.FileName.offset, encoded, len(encoded))
        handle = _canvas_kernel.CreateFileW(source, 0x10000, 0x1 | 0x2 | 0x4, None, 3, 0x200000, None)
        if handle == _canvas_ctypes.c_void_p(-1).value:
            raise _canvas_ctypes.WinError(_canvas_ctypes.get_last_error())
        try:
            if not _canvas_kernel.SetFileInformationByHandle(handle, 22, _canvas_ctypes.byref(info), size):
                raise _canvas_ctypes.WinError(_canvas_ctypes.get_last_error())
        finally:
            _canvas_kernel.CloseHandle(handle)

    def _canvas_request_file():
        path = config.basedir + "/request.json"
        if _canvas_os.name != "nt":
            return open(path, encoding="utf-8")
        # The publisher atomically replaces this file. Windows readers must share
        # delete access so neither open conflicts with the other's rename handle.
        handle = _canvas_kernel.CreateFileW(path, 0x80000000, 0x1 | 0x2 | 0x4, None, 3, 0x80, None)
        if handle == _canvas_ctypes.c_void_p(-1).value:
            raise _canvas_ctypes.WinError(_canvas_ctypes.get_last_error())
        try:
            descriptor = _canvas_msvcrt.open_osfhandle(handle, _canvas_os.O_RDONLY | _canvas_os.O_BINARY)
        except BaseException:
            _canvas_kernel.CloseHandle(handle)
            raise
        try:
            return _canvas_os.fdopen(descriptor, "r", encoding="utf-8")
        except BaseException:
            _canvas_os.close(descriptor)
            raise

    class _CanvasNode(renpy.Displayable):
        def __init__(self, child, start, clips=False):
            super(_CanvasNode, self).__init__()
            self.children, self.offsets = [child], [(0, 0)]
            self.start = start
            self.clips = clips
        def visit(self):
            return self.children
        def get_placement(self):
            return self.children[0].get_placement()
        def render(self, width, height, st, at):
            child = renpy.render(self.children[0], width, height, st, at)
            self.measured = child.width, child.height
            result = renpy.Render(child.width, child.height)
            result.blit(child, (0, 0))
            return result

    def _canvas_build(plan):
        by_parent = {}
        objects = {}
        for node in plan["nodes"]:
            by_parent.setdefault(node["parent"], []).append(node)
        def build(node):
            p = dict(node["properties"])
            if "padding" in p:
                p["padding"] = tuple(p["padding"])
            for key in list(p):
                if key.endswith("foreground"):
                    border = p[key]
                    w, c = border["width"], border["color"]
                    n = 2 * w + 2
                    p[key] = Frame(Composite((n, n), (0, 0), Transform(Solid(c), xysize=(n, w)), (0, w + 2), Transform(Solid(c), xysize=(n, w)), (0, w), Transform(Solid(c), xysize=(w, 2)), (w + 2, w), Transform(Solid(c), xysize=(w, 2))), w, w)
            kind = node["kind"]
            if kind in ("screen", "fixed", "vbox", "hbox"):
                d = renpy.display.layout.MultiBox(layout={"vbox":"vertical", "hbox":"horizontal"}.get(kind, "fixed"), style=kind if kind in ("vbox", "hbox") else "fixed", **p)
            elif kind in ("frame", "window"):
                d = renpy.display.layout.Window(style=kind, **p)
            elif kind == "grid":
                d = renpy.display.layout.Grid(p.pop("columns"), p.pop("rows"), style="grid", **p)
            elif kind == "viewport":
                d = renpy.display.viewport.Viewport(style="viewport", **p)
            elif kind == "text":
                d = renpy.text.text.Text(node["literal"], substitute=False, **p)
            elif kind == "image":
                d = renpy.display.transform.Transform(renpy.display.im.Image(node["literal"]), **p)
            elif kind == "textbutton":
                d = renpy.ui._textbutton(node["literal"], substitute=False, **p)
                d.set_style_prefix({"normal":"idle_", "hover":"hover_", "selected":"selected_idle_", "disabled":"insensitive_"}[plan["buttonState"]], True)
            else:
                raise ValueError("Unsupported canvas kind")
            for child in by_parent.get(node["start"], []):
                d.add(build(child))
            if kind in ("frame", "window", "viewport") and not by_parent.get(node["start"]):
                # Screen Language supplies an implicit Fixed for zero children.
                d.add(renpy.display.layout.MultiBox(layout="fixed", style="fixed"))
            if kind == "grid":
                while len(d.children) < d.cols * d.rows:
                    d.add(renpy.display.layout.Null())
            tracked = _CanvasNode(d, node["start"], clips=kind == "viewport")
            objects[id(tracked)] = node["start"]
            return tracked
        root = build(by_parent[None][0])
        return root, objects

    def _canvas_render(request):
        global _canvas_previous_cleanup_ms
        started = _canvas_time.perf_counter()
        plan = request["plan"]
        config.screen_width, config.screen_height = plan["width"], plan["height"]
        if getattr(_canvas_render, "dimensions", None) != (plan["width"], plan["height"]):
            renpy.set_physical_size((plan["width"], plan["height"]))
            renpy.display.interface.set_mode()
            _canvas_render.dimensions = (plan["width"], plan["height"])
        if renpy.get_renderer_info()["renderer"] != ("angle2" if _canvas_os.name == "nt" else "gl2"):
            _canvas_os._exit(74)
        _canvas_native = _canvas_bootstrap["status"](config.basedir)
        root, objects = _canvas_build(plan)
        rendered = renpy.render(root, plan["width"], plan["height"], 0, 0)
        geometry = []
        def intersect(rect, clip):
            if clip is None:
                return rect
            left, top = max(rect[0], clip[0]), max(rect[1], clip[1])
            right, bottom = min(rect[0]+rect[2], clip[0]+clip[2]), min(rect[1]+rect[3], clip[1]+clip[3])
            return (left, top, max(0, right-left), max(0, bottom-top))
        def locate(d, x, y, clip=None):
            if id(d) in objects:
                rect = intersect((x, y, d.measured[0], d.measured[1]), clip)
                if rect[2] > 0 and rect[3] > 0:
                    geometry.append(dict(start=objects[id(d)], x=rect[0], y=rect[1], width=rect[2], height=rect[3]))
                if d.clips:
                    clip = rect
            for child, offset in zip(getattr(d,"children",[]), getattr(d,"offsets",[])):
                locate(child, x+offset[0], y+offset[1], clip)
        locate(root, 0, 0)
        image = config.basedir + "/frame-next.png"
        renpy.render_to_file(rendered, image, resize=True)
        _canvas_replace(image, config.basedir + "/frame.png")
        rendered_at = _canvas_time.perf_counter()
        with open(config.basedir + "/result-next.json", "w", encoding="utf-8") as output:
            _canvas_json.dump(dict(frameId=request["frameId"], width=plan["width"], height=plan["height"], buttonState=plan["buttonState"], geometry=geometry, renderer=renpy.get_renderer_info()["renderer"], diagnostics=dict(native=_canvas_native, physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt, renderMilliseconds=(rendered_at-started)*1000, previousCleanupMilliseconds=_canvas_previous_cleanup_ms)), output)
        _canvas_replace(config.basedir + "/result-next.json", config.basedir + "/result.json")
        renpy.free_memory()
        _canvas_previous_cleanup_ms = (_canvas_time.perf_counter()-rendered_at)*1000

label start:
    $ renpy.pause(0.01)
    python:
        _canvas_previous = None
        while True:
            if _canvas_os.path.exists(config.basedir + "/stop"):
                with open(config.basedir + "/stopped.json", "w") as _canvas_ack:
                    _canvas_json.dump(dict(stopped=True), _canvas_ack)
                break
            try:
                with _canvas_request_file() as _canvas_input:
                    _canvas_request = _canvas_json.load(_canvas_input)
                if _canvas_request["frameId"] != _canvas_previous:
                    _canvas_render(_canvas_request)
                    _canvas_previous = _canvas_request["frameId"]
            except FileNotFoundError:
                pass
            except Exception:
                with open(config.basedir + "/render-refusal.txt", "w", encoding="utf-8") as _canvas_error:
                    __import__("traceback").print_exc(file=_canvas_error)
                _canvas_os._exit(73)
            _canvas_time.sleep(0.004)
        renpy.quit(relaunch=False, status=0, save=False)
