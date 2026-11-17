# Throwaway spike for #198. Never merged. Loads beside the project through
# RENPY_SEARCHPATH, keeps one long interaction like the game menu, and answers
# requests from the driver through numbered JSON files in LLP_IO.

init -999 python:
    import os as _llp_os
    import sys as _llp_sys
    import json as _llp_json
    import time as _llp_time
    import runpy as _llp_runpy
    import traceback as _llp_tb
    import contextlib as _llp_contextlib

    _llp_io = _llp_os.environ["LLP_IO"]
    _llp_S = _llp_sys.modules["renpy"].session.setdefault("_llp", dict(
        seq=0, boot=None, starts=0, restart=None, job=None, wait=None,
        draws=0, last_draw=0.0, event_seen=0.0, good={}, scene=None, inflight=False))
    _llp_S["starts"] += 1
    _llp_S.setdefault("tInit", []).append(_llp_time.perf_counter())

    if _llp_S["boot"] is None:
        # The bootstrap writes helper.pid and installs the hidden-window guard.
        # The session keeps its Objective-C callbacks alive across utter_restart.
        _llp_boot = _llp_runpy.run_path(_llp_os.path.join(_llp_io, "canvas-bootstrap.py"), run_name="_llp_bootstrap")
        _llp_boot["install"](_llp_io)
        _llp_S["boot"] = _llp_boot

    def _llp_command():
        renpy.arguments.takes_no_arguments("Loomlight preview spike")
        _llp_S.setdefault("tCommand", []).append(_llp_time.perf_counter())
        return True

    renpy.arguments.register_command("loomlight_preview", _llp_command, uses_display=True)
    config.label_overrides["start"] = "_llp_main"
    config.autoreload = False

init python:
    import renpy.test.testmouse as _llp_mouse

    def _llp_perf():
        return _llp_time.perf_counter()

    def _llp_write(name, data):
        tmp = _llp_os.path.join(_llp_io, name + ".tmp")
        with open(tmp, "w", encoding="utf-8") as output:
            _llp_json.dump(data, output)
        _llp_os.replace(tmp, _llp_os.path.join(_llp_io, name))

    def _llp_native():
        try:
            return _llp_S["boot"]["install"].__globals__["_native_status"]()
        except Exception as e:
            return dict(error=repr(e))

    def _llp_hook():
        iface = renpy.display.interface
        if not getattr(iface, "_llp_hooked", False):
            original = iface.draw_screen
            def draw_screen(*args, **kwargs):
                result = original(*args, **kwargs)
                now = _llp_perf()
                _llp_S["draws"] += 1
                _llp_S["last_draw"] = now
                wait = _llp_S.get("wait")
                if wait is not None and wait.get("firstDraw") is None and now > wait["since"]:
                    wait["firstDraw"] = now
                return result
            iface.draw_screen = draw_screen
            iface._llp_hooked = True
        focus = renpy.display.focus
        if not getattr(focus.mouse_handler, "_llp", False):
            original_handler = focus.mouse_handler
            def mouse_handler(ev, x, y, default=False):
                if ev is not None and getattr(ev, "test", False):
                    _llp_S["event_seen"] = _llp_perf()
                    _llp_S["event_xy"] = (x, y)
                return original_handler(ev, x, y, default=default)
            mouse_handler._llp = True
            focus.mouse_handler = mouse_handler

    @_llp_contextlib.contextmanager
    def _llp_keep_screens():
        # The engine shows say and choice as transient screens. The helper keeps
        # them so they survive between requests.
        screen_module = renpy.display.screen
        exports = _llp_sys.modules["renpy.exports"]
        original = screen_module.show_screen
        def show_screen(*args, **kwargs):
            kwargs["_transient"] = False
            return original(*args, **kwargs)
        screen_module.show_screen = show_screen
        exports.show_screen = show_screen
        try:
            yield
        finally:
            screen_module.show_screen = original
            exports.show_screen = original

    def _llp_clear():
        for name in ("say", "choice", "menu", "main_menu", "preferences", "confirm"):
            if renpy.get_screen(name):
                renpy.hide_screen(name)

    def _llp_show(scene):
        _llp_clear()
        kind = scene["screen"]
        store.main_menu = kind == "main_menu"
        with _llp_keep_screens():
            if kind == "say":
                renpy.say(Character(scene.get("who", "Sample")), scene.get("what", "Sample line."), interact=False)
            elif kind == "choice":
                renpy.display_menu([(caption, i) for i, caption in enumerate(scene["items"])], interact=False)
            else:
                renpy.show_screen(kind)
        renpy.restart_interaction()

    def _llp_geometry(keep=False):
        render_type = renpy.display.render.Render
        button_type = renpy.display.behavior.Button
        window_type = renpy.display.layout.Window
        out, objects, seen = [], [], set()
        def walk(r, x, y, depth, transformed, container):
            # A textbutton puts its line on the inner Text. Record the nearest
            # enclosing Button as the element's clickable box.
            own = container
            for d in (getattr(r, "render_of", None) or []):
                if isinstance(d, button_type):
                    own = dict(x=x, y=y, w=r.width, h=r.height)
            for d in (getattr(r, "render_of", None) or []):
                location = getattr(d, "_location", None)
                if location and id(d) not in seen:
                    seen.add(id(d))
                    out.append(dict(file=location[0], line=location[1], cls=type(d).__name__,
                                    x=x, y=y, w=r.width, h=r.height, depth=depth, transformed=transformed,
                                    button=isinstance(d, button_type), window=isinstance(d, window_type),
                                    container=own if own is not container or isinstance(d, button_type) else container))
                    objects.append(r)
            inner = transformed or r.forward is not None
            for child in (getattr(r, "children", None) or []):
                c = child[0]
                if isinstance(c, render_type):
                    walk(c, x + child[1], y + child[2], depth + 1, inner, own)
        walk(renpy.display.interface.surftree, 0, 0, 0, False, None)
        if keep:
            return out, objects
        return out

    def _llp_capture(req, geometry=False, extra=None):
        captured = _llp_perf()
        n = req["id"]
        tmp = _llp_os.path.join(_llp_io, "frame-%d.tmp.png" % n)
        surface = renpy.display.draw.screenshot(renpy.display.interface.surftree)
        read = _llp_perf()
        renpy.display.scale.image_save_unscaled(surface, tmp)
        _llp_os.replace(tmp, _llp_os.path.join(_llp_io, "frame-%d.png" % n))
        written = _llp_perf()
        extra = dict(extra or {}, readbackMs=(read - captured) * 1000, encodeMs=(written - read) * 1000,
                     frameSize=list(surface.get_size()))
        wait = _llp_S.get("lastWait") or {}
        result = dict(id=n, kind=req["kind"], ok=True, tRequest=_llp_S["t_req"], tCapture=captured, tPng=written,
                      helperMs=(written - _llp_S["t_req"]) * 1000, pngMs=(written - captured) * 1000,
                      firstDrawMs=((wait["firstDraw"] - _llp_S["t_req"]) * 1000) if wait.get("firstDraw") else None,
                      waitOk=wait.get("ok"), draws=_llp_S["draws"], native=_llp_native(),
                      drawPerVirt=renpy.display.draw.draw_per_virt, physical=list(renpy.get_physical_size()),
                      renderer=renpy.get_renderer_info()["renderer"], starts=_llp_S["starts"])
        if geometry:
            result["geometry"] = _llp_geometry()
        if extra:
            result.update(extra)
        _llp_write("result-%d.json" % n, result)

    def _llp_match(frame, iso, g, scale):
        """Find where the element's own opaque pixels sit in the full frame."""
        fw, fh = frame.get_size()
        iw, ih = iso.get_size()
        step = max(1, min(iw, ih) // 10)
        points = []
        for py in range(0, ih, step):
            for px in range(0, iw, step):
                c = iso.get_at((px, py))
                if c[3] >= 250:
                    points.append((px, py, c))
        if len(points) > 60:
            points = points[::len(points) // 60 + 1]
        if len(points) < 5:
            return dict(points=len(points), verdict="too-transparent")
        ox, oy = int(round(g["x"] * scale)), int(round(g["y"] * scale))
        reach = 8
        def score(dx, dy):
            hit = 0
            for px, py, c in points:
                x, y = ox + dx + px, oy + dy + py
                if 0 <= x < fw and 0 <= y < fh:
                    f = frame.get_at((x, y))
                    if abs(f[0] - c[0]) + abs(f[1] - c[1]) + abs(f[2] - c[2]) < 24:
                        hit += 1
            return hit
        at_zero = score(0, 0)
        best = (at_zero, 0, 0)
        if at_zero < len(points):
            for dy in range(-reach, reach + 1):
                for dx in range(-reach, reach + 1):
                    s = score(dx, dy)
                    if s > best[0]:
                        best = (s, dx, dy)
        return dict(points=len(points), zeroMatch=at_zero / float(len(points)), bestMatch=best[0] / float(len(points)),
                    dx=best[1] / scale, dy=best[2] / scale, isoSize=[iw, ih])

    def _llp_rects(req):
        started = _llp_perf()
        frame = renpy.display.draw.screenshot(renpy.display.interface.surftree)
        geometry, renders = _llp_geometry(keep=True)
        scale = renpy.display.draw.draw_per_virt
        checks = []
        for i, g in enumerate(geometry):
            if g["cls"] in ("ScreenDisplayable", "Timer") or g["transformed"] or g["w"] < 4 or g["h"] < 4:
                continue
            if g["w"] >= config.screen_width and g["h"] >= config.screen_height:
                continue
            try:
                iso = renpy.display.draw.screenshot(renders[i])
                check = _llp_match(frame, iso, g, scale)
            except Exception as e:
                check = dict(error=repr(e))
            check.update(index=i, file=g["file"], line=g["line"], cls=g["cls"], x=g["x"], y=g["y"], w=g["w"], h=g["h"])
            checks.append(check)
        _llp_capture(req, geometry=True, extra=dict(rectChecks=checks, rectMs=(_llp_perf() - started) * 1000))
        return
        yield

    def _llp_evict(screen):
        # Screen analysis is cached under (name, variant, location). A draft keeps
        # the same file and line, so without this the old tree keeps running.
        cache = renpy.sl2.slast.scache
        keys = [k for k in list(cache.const_analyzed) if k[0] == screen]
        for k in keys:
            cache.const_analyzed.pop(k, None)
            cache.not_const_analyzed.pop(k, None)
        return len(keys)

    def _llp_load(req):
        started = _llp_perf()
        text = "\n" * (req["line"] - 1) + req["text"]
        evicted = _llp_evict(req["screen"]) if req.get("screen") else 0
        name = renpy.load_string(text, req["file"])
        loaded = _llp_perf()
        if name is None:
            errors = [str(e) for e in renpy.parser.get_parse_errors()]
            _llp_write("result-%d.json" % req["id"], dict(id=req["id"], kind=req["kind"], ok=False, error="parse",
                       messages=errors, tRequest=_llp_S["t_req"], tError=_llp_perf(),
                       helperMs=(_llp_perf() - _llp_S["t_req"]) * 1000))
            return
        if req.get("rebuild") == "style":
            renpy.style.rebuild()
        elif req.get("rebuild") == "gui":
            gui.rebuild()
        rebuilt = _llp_perf()
        if _llp_S["scene"] is not None:
            _llp_show(_llp_S["scene"])
        else:
            renpy.restart_interaction()
        yield dict(settle=True)
        if req.get("screen"):
            _llp_S["good"][req["screen"]] = (text, req["file"])
        _llp_capture(req, extra=dict(loadMs=(loaded - started) * 1000, rebuildMs=(rebuilt - loaded) * 1000, evicted=evicted))

    def _llp_pointer(req):
        focused = renpy.display.interface.mouse_focused
        renpy.display.interface.mouse_focused = True
        for action in req["actions"]:
            if action[0] == "move":
                _llp_mouse.move_mouse(action[1], action[2])
            elif action[0] == "click":
                _llp_mouse.click_mouse(1, action[1], action[2])
        yield dict(event=True, settle=req.get("settle", False), timeout=req.get("timeout", 1.0))
        _llp_capture(req, geometry=req.get("geometry", False), extra=dict(
            mouseFocusedBefore=focused, eventXY=_llp_S.get("event_xy"),
            eventMs=(_llp_S["event_seen"] - _llp_S["t_req"]) * 1000 if _llp_S["event_seen"] > _llp_S["t_req"] else None))

    def _llp_after_restart():
        pending = _llp_S["restart"]
        _llp_S["restart"] = None
        _llp_S["t_req"] = pending["tRequest"]
        if _llp_S["scene"] is not None:
            _llp_show(_llp_S["scene"])
        yield dict(settle=True, timeout=5.0)
        _llp_capture(pending["req"], extra=dict(tInit=_llp_S["tInit"][-1], tCommand=_llp_S["tCommand"][-1], tMain=_llp_S["tMain"]))

    def _llp_handle(req):
        kind = req["kind"]
        if kind == "scene":
            _llp_S["scene"] = req["scene"]
            _llp_show(req["scene"])
            yield dict(settle=True, timeout=req.get("timeout", 2.0))
            _llp_capture(req, geometry=req.get("geometry", False), extra=dict(
                tInit=_llp_S["tInit"][-1], tCommand=_llp_S["tCommand"][-1], tMain=_llp_S["tMain"]))
        elif kind == "rects":
            for step in _llp_rects(req):
                yield step
        elif kind == "load":
            for step in _llp_load(req):
                yield step
        elif kind == "pointer":
            for step in _llp_pointer(req):
                yield step
        elif kind == "restart":
            _llp_S["restart"] = dict(req=req, tRequest=_llp_S["t_req"])
            _llp_S["job"] = None
            renpy.utter_restart(keep_renderer=True)
        elif kind == "stop":
            _llp_write("result-%d.json" % req["id"], dict(id=req["id"], kind=kind, ok=True, native=_llp_native()))
            renpy.quit(relaunch=False, status=0, save=False)

    def _llp_step():
        try:
            wait = next(_llp_S["job"])
            wait["since"] = _llp_perf()
            wait["firstDraw"] = None
            _llp_S["wait"] = wait
        except StopIteration:
            _llp_S["job"] = None
            _llp_S["wait"] = None
            _llp_S["inflight"] = False
            _llp_S["seq"] += 1

    def _llp_tick():
        S = _llp_S
        if S["job"] is not None:
            wait = S["wait"]
            since = wait["since"]
            drawn = S["last_draw"] > since
            if wait.get("event"):
                drawn = drawn and S["event_seen"] >= since and S["last_draw"] > S["event_seen"]
            ok = drawn and not (wait.get("settle") and renpy.display.interface.ongoing_transition)
            if not ok and _llp_perf() - since < wait.get("timeout", 2.0):
                return
            wait["ok"] = ok
            S["lastWait"] = wait
            _llp_step()
            return
        path = _llp_os.path.join(_llp_io, "request-%d.json" % S["seq"])
        if not _llp_os.path.exists(path):
            return
        with open(path, encoding="utf-8") as source:
            req = _llp_json.load(source)
        S["t_req"] = _llp_perf()
        S["req"] = req
        S["inflight"] = True
        S["job"] = _llp_handle(req)
        _llp_step()

    def _llp_main_loop():
        S = _llp_S
        S["tMain"] = _llp_perf()
        _llp_hook()
        renpy.context()._menu = True
        _preferences.fullscreen = False
        size = (config.screen_width, config.screen_height)
        if tuple(renpy.get_physical_size()) != size:
            renpy.set_physical_size(size)
            renpy.display.interface.set_mode()
        if S["restart"] is not None:
            S["inflight"] = True
            S["job"] = _llp_after_restart()
            _llp_step()
        while True:
            try:
                renpy.call_screen("_llp_driver")
            except renpy.game.CONTROL_EXCEPTIONS:
                raise
            except Exception:
                trace = _llp_tb.format_exc()
                failed = _llp_perf()
                S["job"] = None
                S["wait"] = None
                for screen, (text, filename) in list(S["good"].items()):
                    try:
                        _llp_evict(screen)
                        renpy.load_string(text, filename)
                    except Exception:
                        pass
                _llp_clear()
                if S["inflight"]:
                    _llp_write("result-%d.json" % S["seq"], dict(id=S["seq"], kind=S["req"]["kind"], ok=False,
                               error="runtime", trace=trace, tRequest=S["t_req"], tError=failed,
                               helperMs=(failed - S["t_req"]) * 1000))
                    S["inflight"] = False
                    S["seq"] += 1
                else:
                    _llp_write("unexpected-%d.txt" % int(failed * 1000), dict(trace=trace))

screen _llp_driver():
    zorder 1000
    timer 0.005 repeat True action Function(_llp_tick, _update_screens=False)

label _llp_main:
    python:
        _llp_main_loop()
    return
