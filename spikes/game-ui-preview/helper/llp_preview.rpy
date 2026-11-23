# Throwaway spike for #198, extended for #216 and #213. Never merged. Loads beside the project through
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
            _llp_json.dump(data, output, default=str)
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
                _llp_S["root_widget"] = args[0]
                hold = _llp_S.get("hold")
                if hold and not _llp_S.get("bursting"):
                    # A transform never lets its time go back. Until the set-time
                    # frames start, the engine's own frames stay at animation time 0.
                    zero = _llp_entry_time(hold)
                    if zero:
                        iface.frame_time = zero
                result = original(*args, **kwargs)
                now = _llp_perf()
                _llp_S["last_frame_time"] = iface.frame_time
                rec = _llp_S.get("rec")
                if rec is not None and not _llp_S.get("bursting"):
                    _llp_record(rec)
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
        if not getattr(focus.before_interact, "_llp", False):
            original_before = focus.before_interact
            def before_interact(roots):
                roots = list(roots)
                _llp_S["roots"] = roots
                result = original_before(roots)
                try:
                    _llp_apply_forced(roots)
                except Exception:
                    # Drop the request, so one bad entry cannot fail every interaction.
                    _llp_S["forced"] = None
                    _llp_S["forceApplied"] = dict(error=_llp_tb.format_exc()[-600:])
                return result
            before_interact._llp = True
            focus.before_interact = before_interact

    # The "force" request (#216). Each entry names an element by source file and
    # line and gives the state to show. The helper applies the entries at every
    # interaction start, after per_interact and the engine's focus pass have set
    # the real states, so a forced state survives a screen update or a draft.
    # It changes only the look: the button keeps its real action and focus.
    _llp_FORCED = {
        "idle": ("", "idle"), "hover": (None, "hover"), "disabled": (None, "insensitive"),
        "selected": ("selected_", "idle"), "selected_hover": ("selected_", "hover"),
        "selected_disabled": ("selected_", "insensitive"),
    }

    def _llp_same_file(location, wanted):
        return location[0].replace("\\", "/").endswith(wanted)

    def _llp_apply_forced(roots):
        entries = _llp_S.get("forced") or []
        applied = [0] * len(entries)
        _llp_S["forceApplied"] = applied
        if not entries:
            return
        button_type = renpy.display.behavior.Button
        found = []
        for root in roots:
            root.visit_all(found.append)
        # A textbutton keeps its source line on the inner Text. Force the Button.
        inner = {id(d.child) for d in found if isinstance(d, button_type) and d.child is not None}
        for d in found:
            if id(d) in inner:
                continue
            locations = [getattr(d, "_location", None)]
            if isinstance(d, button_type) and d.child is not None:
                locations.append(getattr(d.child, "_location", None))
            for i, entry in enumerate(entries):
                if not any(l and l[1] == entry["line"] and _llp_same_file(l, entry["file"]) for l in locations):
                    continue
                role, state = _llp_FORCED[entry["state"]]
                if role is None:
                    role = getattr(d, "role", "")
                d.set_style_prefix(role + state + "_", True)
                if entry.get("events", True):
                    # With "hover" this is what focus(default=True) does: the
                    # transform event starts a hover animation, with no sound
                    # and no hovered action.
                    d.set_transform_event(role + state)
                    child = getattr(d, "child", None)
                    if child is not None:
                        child.set_transform_event(role + state)
                applied[i] += 1

    def _llp_force(req):
        _llp_S["forced"] = [e for e in req.get("states", []) if e.get("state")]
        renpy.restart_interaction()
        yield dict(settle=True, min=req.get("min", 0), timeout=req.get("timeout", 2.0))
        _llp_capture(req, geometry=req.get("geometry", False), extra=dict(forceApplied=_llp_S.get("forceApplied")))

    # ---- #213: frames at a set animation time, a record of the engine's own
    # frames, and a story mode that runs real lines of dialogue and menus. ----

    def _llp_entry_time(name):
        """The time at which the engine first drew the named screen."""
        d = renpy.get_screen(name)
        if d is None:
            return None
        for entries in renpy.game.context().scene_lists.layers.values():
            for e in entries:
                if e.displayable is d:
                    return e.show_time
        return None

    def _llp_times():
        """Seconds since each shown screen was first drawn, at the last frame."""
        frame_time = renpy.display.interface.frame_time
        out = {}
        for entries in renpy.game.context().scene_lists.layers.values():
            for e in entries:
                if isinstance(e.tag, str) and not e.tag.startswith("_llp"):
                    out[e.tag] = (frame_time - e.show_time) if e.show_time else None
        return out

    def _llp_states(spec):
        """The transform values and the button states of the elements named by file and line."""
        transform_type = renpy.display.transform.Transform
        button_type = renpy.display.behavior.Button
        found, seen, transforms, buttons = [], set(), [], []
        for root in _llp_S.get("roots") or []:
            root.visit_all(found.append)
        def matches(d, targets):
            locations = [getattr(d, "_location", None)]
            if isinstance(d, button_type) and d.child is not None:
                locations.append(getattr(d.child, "_location", None))
            for t in targets:
                if any(l and l[1] == t["line"] and _llp_same_file(l, t["file"]) for l in locations):
                    return t
            return None
        for d in found:
            if id(d) in seen:
                continue
            seen.add(id(d))
            if isinstance(d, transform_type) and spec.get("transforms"):
                # "at a, b" nests transforms. nest counts from the element out.
                nest, child = 1, d.child
                while isinstance(child, transform_type):
                    nest += 1
                    child = child.child
                t = matches(child, spec["transforms"]) if child is not None else None
                if t is not None:
                    state = d.state
                    transforms.append(dict(line=t["line"], nest=nest, alpha=getattr(state, "alpha", None),
                                           xoffset=getattr(state, "xoffset", None), yoffset=getattr(state, "yoffset", None),
                                           zoom=getattr(state, "zoom", None), st=getattr(d, "st", None),
                                           event=getattr(d, "last_transform_event", None)))
            elif isinstance(d, button_type) and spec.get("buttons"):
                t = matches(d, spec["buttons"])
                if t is not None:
                    buttons.append(dict(line=t["line"], prefix=d.style.prefix, focused=d.is_focused()))
        return transforms, buttons

    def _llp_runs(surface, origin, row=None, col=None):
        """Runs of one color along a row or a column of the frame, in virtual pixels."""
        scale = renpy.display.draw.draw_per_virt
        width, height = surface.get_size()
        if row is not None:
            fixed, count, limit, start_at = int(round((row - origin[1]) * scale)), width, height, origin[0]
            get = lambda i: tuple(surface.get_at((i, fixed)))
        else:
            fixed, count, limit, start_at = int(round((col - origin[0]) * scale)), height, width, origin[1]
            get = lambda i: tuple(surface.get_at((fixed, i)))
        if not 0 <= fixed < limit:
            return None
        runs, start, current = [], 0, get(0)
        for i in range(1, count + 1):
            c = get(i) if i < count else None
            if c != current:
                if i - start >= 4 and current[3] != 0 and current[:3] != (0, 0, 0):
                    runs.append([list(current), round(start / scale + start_at, 2), round(i / scale + start_at, 2)])
                start, current = i, c
        return runs[:60]

    def _llp_sample(surface, spec, origin=(0, 0)):
        iface = renpy.display.interface
        out = dict(t=_llp_perf(), frameTime=iface.frame_time, screens=_llp_times(), skipping=renpy.config.skipping,
                   step=_llp_S.get("storyStep"), line=_llp_S.get("storyLine"))
        if spec.get("transforms") or spec.get("buttons"):
            out["transforms"], out["buttons"] = _llp_states(spec)
        if surface is not None:
            scale = renpy.display.draw.draw_per_virt
            width, height = surface.get_size()
            def pixel(x, y):
                px, py = int(round((x - origin[0]) * scale)), int(round((y - origin[1]) * scale))
                if 0 <= px < width and 0 <= py < height:
                    return list(surface.get_at((px, py)))
                return None
            out["points"] = [pixel(x, y) for x, y in spec.get("points", [])]
            out["rows"] = [_llp_runs(surface, origin, row=y) for y in spec.get("rows", [])]
            out["cols"] = [_llp_runs(surface, origin, col=x) for x in spec.get("cols", [])]
        return out

    def _llp_shot(region=None):
        """Read back the last frame, or one region of it given in virtual pixels."""
        tree = renpy.display.interface.surftree
        if region and not _llp_S.get("regionError"):
            try:
                return renpy.display.draw.screenshot(tree.subsurface(tuple(region)))
            except Exception:
                # Fall back to the full frame, and report it.
                _llp_S["regionError"] = _llp_tb.format_exc()[-600:]
        return renpy.display.draw.screenshot(tree)

    def _llp_hash(surface):
        import io, hashlib
        with io.BytesIO() as data:
            renpy.display.module.save_png(surface, data, 0)
            return hashlib.sha256(data.getvalue()).hexdigest()[:16]

    def _llp_record(rec):
        """Called after each frame that the engine draws by itself."""
        if len(rec["samples"]) >= rec.get("limit", 300):
            return
        try:
            surface = _llp_shot(rec.get("region")) if rec.get("pixels", True) else None
            origin = rec["region"][:2] if rec.get("region") else (0, 0)
            sample = _llp_sample(surface, rec.get("probe") or {}, origin)
            if rec.get("hash") and surface is not None:
                sample["sha"] = _llp_hash(surface)
        except Exception:
            sample = dict(error=_llp_tb.format_exc()[-600:])
        rec["samples"].append(sample)

    def _llp_deliver(surface, mode, path):
        """Write one frame for the driver. png0 is a PNG with no compression."""
        if mode == "png":
            renpy.display.scale.image_save_unscaled(surface, path + ".tmp.png")
        elif mode == "png0":
            with open(path + ".tmp.png", "wb") as output:
                renpy.display.module.save_png(surface, output, 0)
        else:
            raise ValueError(mode)
        _llp_os.replace(path + ".tmp.png", path + ".png")

    def _llp_burst(req, base, segments):
        """Render frames at set times. base is the engine time of animation time 0.

        The engine reads one clock, renpy.display.core.get_time. For each frame
        the helper sets that clock and the frame time, drops the cached renders
        of every displayable that asked for a redraw, and renders the screen
        tree. It does not draw to the window: the readback draws the tree into
        the engine's own framebuffer.
        """
        iface, core, render = renpy.display.interface, renpy.display.core, renpy.display.render
        mode, region, probe = req.get("deliver", "none"), req.get("region"), req.get("probe")
        origin = region[:2] if region else (0, 0)
        real, clock = core.get_time, [base]
        frames, errors = [], []
        core.get_time = lambda: clock[0]
        _llp_S["bursting"] = True
        def draw(t, count):
            for i in range(count):
                # A far-future clock makes process_redraws drop every queued
                # redraw, also one queued at a later engine time.
                clock[0] = 1e18
                render.process_redraws()
                clock[0] = base + t
                iface.frame_time = clock[0]
                iface.draw_screen(_llp_S["root_widget"], None, False)
        try:
            for segment in segments:
                if "states" in segment:
                    _llp_S["forced"] = [e for e in segment["states"] if e.get("state")]
                    _llp_apply_forced(_llp_S["roots"])
                # A transform takes an event at the first render after it, and the
                # outer transform of an "at" list takes it one render later.
                # "at" is the time of the event. "prime" renders the first time
                # again, so that every transform of the list starts at that time.
                renders = 1 + segment.get("prime", 0)
                if segment.get("at") is not None:
                    draw(segment["at"], renders)
                    renders = 1
                for t in segment["times"]:
                    started = _llp_perf()
                    draw(t, renders)
                    renders = 1
                    rendered = _llp_perf()
                    surface = _llp_shot(region)
                    read = _llp_perf()
                    row = dict(t=t, renderMs=(rendered - started) * 1000, readMs=(read - rendered) * 1000,
                               size=list(surface.get_size()))
                    if mode != "none" and not errors:
                        try:
                            _llp_deliver(surface, mode, _llp_os.path.join(_llp_io, "burst-%d-%d" % (req["id"], len(frames))))
                        except Exception:
                            errors.append(_llp_tb.format_exc()[-600:])
                    row["encodeMs"] = (_llp_perf() - read) * 1000
                    row["doneMs"] = (_llp_perf() - _llp_S["t_req"]) * 1000
                    if probe:
                        row["sample"] = _llp_sample(surface, probe, origin)
                    if req.get("hash"):
                        row["sha"] = _llp_hash(surface)
                    frames.append(row)
        finally:
            core.get_time = real
            _llp_S["bursting"] = False
        return frames, errors

    def _llp_draft(req):
        """Load the screen draft that a request carries. Returns an error result or None."""
        draft = req.get("load")
        if not draft:
            return None
        text = "\n" * (draft["line"] - 1) + draft["text"]
        if draft.get("screen"):
            _llp_evict(draft["screen"])
        if renpy.load_string(text, draft["file"]) is None:
            return dict(id=req["id"], kind=req["kind"], ok=False, error="parse",
                        messages=[str(e) for e in renpy.parser.get_parse_errors()])
        if draft.get("screen"):
            _llp_S["good"][draft["screen"]] = (text, draft["file"])
        return None

    def _llp_frames(req):
        """Optionally load a draft and show a screen again, then render frames at set times."""
        started = _llp_perf()
        failed = _llp_draft(req)
        if failed is not None:
            _llp_write("result-%d.json" % req["id"], failed)
            return
        loaded = _llp_perf()
        draws = _llp_S["draws"]
        if req.get("scene"):
            _llp_S["scene"] = req["scene"]
            _llp_S["forced"] = []
            if req.get("base") == "show":
                _llp_S["hold"] = req["scene"]["screen"]
            _llp_show(req["scene"])
            yield dict(timeout=req.get("timeout", 2.0))
        shown = _llp_perf()
        base = _llp_S["last_frame_time"]
        if req.get("base") == "show":
            base = _llp_entry_time(req["scene"]["screen"]) or base
        ahead = _llp_S["last_frame_time"] - base
        try:
            frames, errors = _llp_burst(req, base, req["segments"])
        finally:
            _llp_S["hold"] = None
        done = _llp_perf()
        _llp_S["forced"] = []
        renpy.restart_interaction()
        _llp_write("result-%d.json" % req["id"], dict(
            id=req["id"], kind=req["kind"], ok=not errors, errors=errors, frames=frames,
            loadMs=(loaded - started) * 1000, showMs=(shown - loaded) * 1000, burstMs=(done - shown) * 1000,
            helperMs=(done - _llp_S["t_req"]) * 1000, engineFramesBefore=_llp_S["draws"] - draws,
            engineAheadMs=ahead * 1000, native=_llp_native(), drawPerVirt=renpy.display.draw.draw_per_virt,
            renderer=renpy.get_renderer_info()["renderer"], forceApplied=_llp_S.get("forceApplied"),
            regionError=_llp_S.get("regionError")))

    def _llp_match(req):
        """Record the frames the engine draws by itself in real time. Then render
        the same animation times with a set clock, and report both."""
        failed = _llp_draft(req)
        if failed is not None:
            _llp_write("result-%d.json" % req["id"], failed)
            return
        region, seconds = req.get("region"), req.get("seconds", 0.4)
        def recorder():
            return dict(region=region, probe=req.get("probe"), hash=True, limit=req.get("limit", 80), samples=[])
        quiet = dict(req, deliver="none", hash=True)
        if req.get("states"):
            # Hover in, then hover out, each from rest.
            _llp_S["scene"] = req["scene"]
            _llp_S["forced"] = []
            _llp_show(req["scene"])
            yield dict(min=0.4, timeout=3.0)
            parts = []
            for states in (req["states"], req["rest"]):
                rec = recorder()
                _llp_S["forced"] = states
                renpy.restart_interaction()
                _llp_S["rec"] = rec
                yield dict(min=seconds, timeout=seconds + 2.0)
                _llp_S["rec"] = None
                first = rec["samples"][0]["frameTime"] if rec["samples"] else 0
                for s in rec["samples"]:
                    s["at"] = s.get("frameTime", first) - first
                parts.append(rec["samples"])
            _llp_S["forced"] = []
            renpy.restart_interaction()
            yield dict(min=0.4, timeout=3.0)
            gap = (parts[0][-1]["at"] if parts[0] else 0) + 0.05
            segments = [dict(states=req["states"], times=[s["at"] for s in parts[0]]),
                        dict(states=req["rest"], times=[gap + s["at"] for s in parts[1]])]
            real = parts[0] + parts[1]
            frames, errors = _llp_burst(quiet, _llp_S["last_frame_time"], segments)
        else:
            tag = req["tag"]
            rec = recorder()
            _llp_S["scene"] = req["scene"]
            _llp_S["forced"] = []
            _llp_show(req["scene"])
            _llp_S["rec"] = rec
            yield dict(min=seconds, timeout=seconds + 2.0)
            _llp_S["rec"] = None
            # The first frame of a screen has no show time yet, and the engine
            # renders it at animation time 0.
            real = [s for s in rec["samples"] if "screens" in s and tag in s["screens"]]
            for s in real:
                s["at"] = s["screens"][tag] or 0.0
            _llp_S["hold"] = req["scene"]["screen"]
            _llp_show(req["scene"])
            yield dict(timeout=2.0)
            base = _llp_entry_time(req["scene"]["screen"]) or _llp_S["last_frame_time"]
            try:
                frames, errors = _llp_burst(quiet, base, [dict(times=[s["at"] for s in real])])
            finally:
                _llp_S["hold"] = None
        _llp_S["forced"] = []
        renpy.restart_interaction()
        def brief(sample, sha, at):
            return dict(at=at, sha=sha, transforms=sample.get("transforms"), error=sample.get("error"))
        _llp_write("result-%d.json" % req["id"], dict(
            id=req["id"], kind=req["kind"], ok=not errors, errors=errors,
            real=[brief(s, s.get("sha"), s.get("at")) for s in real],
            set=[brief(f.get("sample") or {}, f.get("sha"), f["t"]) for f in frames], native=_llp_native(),
            regionError=_llp_S.get("regionError")))

    def _llp_trace(req):
        """Post pointer moves at a fixed interval and record every frame the engine draws."""
        rec = dict(probe=req.get("probe"), pixels=False, limit=req.get("limit", 600), samples=[])
        renpy.display.interface.mouse_focused = True
        _llp_S["rec"] = rec
        for x, y in req["moves"]:
            _llp_mouse.move_mouse(x, y)
            rec["samples"].append(dict(move=[x, y], t=_llp_perf()))
            yield dict(nodraw=True, min=req.get("interval", 0.016), timeout=1.0)
        yield dict(nodraw=True, min=req.get("after", 0.3), timeout=2.0)
        _llp_S["rec"] = None
        _llp_write("result-%d.json" % req["id"], dict(id=req["id"], kind=req["kind"], ok=True, samples=rec["samples"],
                                                     native=_llp_native()))

    def _llp_story(req):
        """Run real lines of dialogue and real menus, as a game does. The main
        loop runs the steps. This request samples frames and ends each step."""
        S = _llp_S
        _llp_clear()
        S["scene"] = None
        S["forced"] = []
        S["story"] = req
        S["storyStep"] = -1
        S["storyAbort"] = False
        S["storyLines"] = []
        S["stepStart"] = _llp_perf()
        probe = req.get("probe") or {}
        samples, records, notes = [], {}, []
        S["end"] = True
        for i, step in enumerate(req["steps"]):
            if S["storyAbort"]:
                break
            if step["do"] == "skip":
                rec = dict(probe=probe, pixels=step.get("pixels", True), limit=step.get("limit", 300), samples=[])
                yield dict(nodraw=True, until=lambda i=i: S["storyStep"] is None or S["storyStep"] >= i, timeout=5.0)
                S["rec"] = rec
                yield dict(nodraw=True, until=lambda i=i: S["storyStep"] is None or S["storyStep"] > i,
                           timeout=step.get("timeout", 15.0))
                S["rec"] = None
                records[str(i)] = rec["samples"]
                if not S["lastWait"]["ok"]:
                    notes.append("step %d did not end by itself" % i)
                    S["storyAbort"] = True
            elif step["do"] in ("say", "menu"):
                yield dict(until=lambda i=i: S["storyStep"] == i and S["last_draw"] > S["stepStart"], timeout=5.0)
                if not S["lastWait"]["ok"]:
                    notes.append("step %d did not start" % i)
                    S["storyAbort"] = True
                    break
                for want in step.get("capture", []):
                    yield dict(until=lambda want=want: _llp_perf() - S["stepStart"] >= want, timeout=want + 2.0)
                    sample = _llp_sample(_llp_shot(), probe)
                    sample["want"] = want
                    samples.append(sample)
                S["end"] = True
        yield dict(nodraw=True, until=lambda: S["storyStep"] is None and S.get("story") is None, timeout=15.0)
        if not S["lastWait"]["ok"]:
            notes.append("the story did not end")
        _llp_write("result-%d.json" % req["id"], dict(
            id=req["id"], kind=req["kind"], ok=not notes, notes=notes, samples=samples, records=records,
            lines=S["storyLines"], skipDelay=config.skip_delay, native=_llp_native()))

    def _llp_run_story():
        """Called by the main loop, outside any interaction."""
        S = _llp_S
        req = S["story"]
        unseen = _preferences.skip_unseen
        who = Character("Eileen")
        renpy.show_screen("_llp_driver")
        try:
            for i, step in enumerate(req["steps"]):
                S["stepStart"] = _llp_perf()
                S["storyStep"] = i
                S["storyLine"] = None
                do = step["do"]
                if do == "say":
                    renpy.say(who, step["what"])
                elif do == "menu":
                    renpy.display_menu([(caption, n) for n, caption in enumerate(step["items"])])
                elif do == "skip":
                    _preferences.skip_unseen = True
                    renpy.config.skipping = step.get("mode", "slow")
                    for n in range(step["count"]):
                        S["storyLine"] = n
                        began = _llp_perf()
                        renpy.say(who, "Line %d that the player skips." % n)
                        S["storyLines"].append(dict(step=i, line=n, ms=(_llp_perf() - began) * 1000,
                                                    skipping=renpy.config.skipping))
                    renpy.config.skipping = None
                elif do == "show":
                    renpy.show_screen(step["screen"])
                elif do == "hide":
                    renpy.hide_screen(step["screen"])
        finally:
            renpy.config.skipping = None
            _preferences.skip_unseen = unseen
            S["storyStep"] = None
            S["story"] = None
            S["rec"] = None
            renpy.hide_screen("_llp_driver")

    _llp_KINDS = dict(frames=_llp_frames, match=_llp_match, trace=_llp_trace, story=_llp_story)

    def _llp_hex(color):
        if color is None:
            return None
        return "#%02x%02x%02x" % (color[0], color[1], color[2]) + ("" if len(color) < 4 or color[3] == 255 else "%02x" % color[3])

    def _llp_describe(d):
        if d is None:
            return None
        color = getattr(d, "color", None)
        return _llp_hex(color) if color is not None else type(d).__name__

    def _llp_probe(surface, targets):
        """For each button named by file and line: its style prefix, the values its
        style gives now, and the colors of its pixels in the captured frame."""
        render_type = renpy.display.render.Render
        button_type = renpy.display.behavior.Button
        scale = renpy.display.draw.draw_per_virt
        width, height = surface.get_size()
        rows, seen = [], set()
        def pixel(x, y):
            px, py = int(round(x * scale)), int(round(y * scale))
            if 0 <= px < width and 0 <= py < height:
                return tuple(surface.get_at((px, py)))[:3]
            return None
        def text_pixel(x, y, w, h, behind):
            counts = {}
            for py in range(int(y * scale), min(height, int((y + h) * scale)), 2):
                for px in range(int(x * scale), min(width, int((x + w) * scale)), 2):
                    c = tuple(surface.get_at((px, py)))[:3]
                    if behind is None or abs(c[0] - behind[0]) + abs(c[1] - behind[1]) + abs(c[2] - behind[2]) > 8:
                        counts[c] = counts.get(c, 0) + 1
            if not counts:
                return None, 0
            best = max(counts, key=counts.get)
            return best, counts[best]
        def walk(r, x, y, button):
            for d in (getattr(r, "render_of", None) or []):
                if isinstance(d, button_type):
                    button = (d, x, y, r.width, r.height)
            for d in (getattr(r, "render_of", None) or []):
                location = getattr(d, "_location", None)
                if not location or id(d) in seen:
                    continue
                for t in targets:
                    if location[1] == t["line"] and _llp_same_file(location, t["file"]):
                        seen.add(id(d))
                        row = dict(line=location[1], cls=type(d).__name__, x=x, y=y, w=r.width, h=r.height)
                        if button is not None:
                            b, bx, by, bw, bh = button
                            behind = pixel(bx + bw - 5, by + bh - 5)
                            found, count = text_pixel(x, y, r.width, r.height, behind)
                            row.update(button=dict(x=bx, y=by, w=bw, h=bh), prefix=b.style.prefix, role=b.role,
                                       focusable=b.focusable, focused=b.is_focused(), textPrefix=d.style.prefix,
                                       styleBackground=_llp_describe(b.style.background),
                                       styleColor=_llp_hex(getattr(d.style, "color", None)),
                                       pixelBackground=_llp_hex(behind), pixelText=_llp_hex(found), pixelTextCount=count)
                        rows.append(row)
            for child in (getattr(r, "children", None) or []):
                c = child[0]
                if isinstance(c, render_type):
                    walk(c, x + child[1], y + child[2], button)
        walk(renpy.display.interface.surftree, 0, 0, None)
        return rows

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
        for name in ("say", "choice", "menu", "main_menu", "preferences", "confirm", _llp_S.get("shown")):
            if name and renpy.get_screen(name):
                # No "on hide" animation: a hiding copy would stay beside the next screen.
                renpy.hide_screen(name, immediately=True)

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
                renpy.show_screen(kind, **scene.get("args", {}))
        _llp_S["shown"] = kind
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
        if req.get("probe"):
            result["probe"] = _llp_probe(surface, req["probe"])
        if req.get("sample"):
            result["sample"] = _llp_sample(surface, req["sample"])
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
        yield dict(event=True, settle=req.get("settle", False), min=req.get("min", 0), timeout=req.get("timeout", 1.0))
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
            yield dict(settle=True, min=req.get("min", 0), timeout=req.get("timeout", 2.0))
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
        elif kind == "force":
            for step in _llp_force(req):
                yield step
        elif kind in _llp_KINDS:
            for step in _llp_KINDS[kind](req):
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
            _llp_S["errors"] = 0
            _llp_S["job"] = None
            _llp_S["wait"] = None
            _llp_S["inflight"] = False
            _llp_S["seq"] += 1

    def _llp_tick():
        _llp_tick_inner()
        S = _llp_S
        if S.get("storyAbort") and S.get("storyStep") is not None:
            return True
        if S.get("end"):
            # A story step is over. A value from the timer action ends the
            # interaction, as a click ends a line of dialogue.
            S["end"] = False
            return True

    def _llp_tick_inner():
        S = _llp_S
        if S["job"] is not None:
            wait = S["wait"]
            since = wait["since"]
            drawn = wait.get("nodraw") or S["last_draw"] > since
            if wait.get("event"):
                drawn = drawn and S["event_seen"] >= since and S["last_draw"] > S["event_seen"]
            ok = drawn and not (wait.get("settle") and renpy.display.interface.ongoing_transition)
            ok = ok and _llp_perf() - since >= wait.get("min", 0)
            ok = ok and (wait.get("until") is None or wait["until"]())
            if not ok and _llp_perf() - since < wait.get("timeout", 2.0):
                return
            wait["ok"] = bool(ok)
            S["lastWait"] = wait
            _llp_step()
            return
        path = _llp_os.path.join(_llp_io, "request-%d.json" % S["seq"])
        if not _llp_os.path.exists(path):
            return
        try:
            with open(path, encoding="utf-8") as source:
                req = _llp_json.load(source)
        except PermissionError:
            # Windows: the driver's os.replace can briefly lock the file. Retry next tick.
            return
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
                if S.get("story") is not None:
                    _llp_run_story()
                else:
                    renpy.call_screen("_llp_driver")
            except renpy.game.CONTROL_EXCEPTIONS:
                raise
            except Exception:
                trace = _llp_tb.format_exc()
                failed = _llp_perf()
                # A failed screen update leaves the UI stack open, as in
                # renpy.display.error. Reset it before the next interaction.
                renpy.ui.reset()
                S["errors"] = S.get("errors", 0) + 1
                if S["errors"] > 20:
                    _llp_write("error-storm.json", dict(trace=trace))
                    _llp_os._exit(75)
                S["job"] = None
                S["wait"] = None
                S["hold"] = None
                S["rec"] = None
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
