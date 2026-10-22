# Loomlight-only renderer. This private project contains no game source or bytecode.
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
        def __init__(self, child, start):
            super(_CanvasNode, self).__init__()
            self.children, self.offsets = [child], [(0, 0)]
            self.start = start
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
            kind = node["kind"]
            if kind in ("screen", "fixed", "vbox"):
                d = renpy.display.layout.MultiBox(layout="vertical" if kind == "vbox" else "fixed", style="vbox" if kind == "vbox" else "fixed", **p)
            elif kind == "frame":
                d = renpy.display.layout.Window(style="frame", **p)
            elif kind == "text":
                d = renpy.text.text.Text(node["literal"], substitute=False, **p)
            elif kind == "image":
                d = renpy.display.transform.Transform(renpy.display.im.Image(node["literal"]), **p)
            elif kind == "textbutton":
                d = renpy.ui._textbutton(node["literal"], substitute=False, **p)
                d.set_style_prefix("hover_" if plan["buttonState"] == "hover" else "idle_", True)
            else:
                raise ValueError("Unsupported canvas kind")
            for child in by_parent.get(node["start"], []):
                d.add(build(child))
            tracked = _CanvasNode(d, node["start"])
            objects[id(tracked)] = node["start"]
            return tracked
        root = build(by_parent[None][0])
        return root, objects

    def _canvas_render(request):
        global _canvas_previous_cleanup_ms
        started = _canvas_time.perf_counter()
        plan = request["plan"]
        config.screen_width, config.screen_height = plan["width"], plan["height"]
        root, objects = _canvas_build(plan)
        rendered = renpy.render(root, plan["width"], plan["height"], 0, 0)
        geometry = []
        def locate(d, x, y):
            if id(d) in objects:
                geometry.append(dict(start=objects[id(d)], x=x, y=y, width=d.measured[0], height=d.measured[1]))
            for child, offset in zip(getattr(d,"children",[]), getattr(d,"offsets",[])):
                locate(child, x+offset[0], y+offset[1])
        locate(root, 0, 0)
        # 8.5.3 software screenshot() returns the display buffer, ignoring its
        # argument. Draw the supplied Render into its own engine surface instead.
        surface = renpy.display.draw.render_to_texture(rendered, True)
        image = config.basedir + "/frame-next.png"
        renpy.display.core.pygame.image.save(surface, image)
        _canvas_os.replace(image, config.basedir + "/frame.png")
        rendered_at = _canvas_time.perf_counter()
        with open(config.basedir + "/result-next.json", "w", encoding="utf-8") as output:
            _canvas_json.dump(dict(frameId=request["frameId"], width=plan["width"], height=plan["height"], buttonState=plan["buttonState"], geometry=geometry, renderer=renpy.get_renderer_info()["renderer"], diagnostics=dict(renderMilliseconds=(rendered_at-started)*1000, previousCleanupMilliseconds=_canvas_previous_cleanup_ms)), output)
        _canvas_os.replace(config.basedir + "/result-next.json", config.basedir + "/result.json")
        renpy.free_memory()
        _canvas_previous_cleanup_ms = (_canvas_time.perf_counter()-rendered_at)*1000

label start:
    $ renpy.pause(0.01)
    python:
        _canvas_previous = None
        while True:
            try:
                with _canvas_request_file() as _canvas_input:
                    _canvas_request = _canvas_json.load(_canvas_input)
                if _canvas_request["frameId"] != _canvas_previous:
                    _canvas_render(_canvas_request)
                    _canvas_previous = _canvas_request["frameId"]
            except FileNotFoundError:
                pass
            _canvas_time.sleep(0.004)
