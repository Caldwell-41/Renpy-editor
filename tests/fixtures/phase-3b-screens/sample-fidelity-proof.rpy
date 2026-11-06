# L20 observes normal Screen Language output. Never loaded by the inert helper.
init python:
    import hashlib as _sample_hash
    import json as _sample_json

    _sample_index = -1

    def _sample_advance():
        global _sample_index
        _sample_index += 1
        if _sample_index == len(SAMPLE_CASES):
            renpy.quit(status=0, save=False)
            return
        for name, value in SAMPLE_CASES[_sample_index]["values"].items():
            setattr(renpy.store, name, value)
        renpy.show_screen("sample_fidelity")
        renpy.restart_interaction()

    def _sample_capture():
        try:
            case = SAMPLE_CASES[_sample_index]
            assert all(getattr(renpy.store, name) == value for name, value in case["values"].items())
            screen = renpy.get_screen("sample_fidelity")
            widgets, seen, wrapped = {}, set(), set()
            names = {row["widgetId"] for row in case["widgets"]}
            def discover(displayable):
                if id(displayable) in seen:
                    return
                seen.add(id(displayable))
                # Screen Language names the inner image, but sl2add's _main wrapper
                # owns its authored sizing. Measure that actual SDK wrapper once.
                main = getattr(displayable, "_main", None)
                name = getattr(main if main is not None else displayable, "id", None)
                if name in names and id(displayable) not in wrapped:
                    widgets.setdefault(name, []).append(displayable)
                    if main is not None:
                        wrapped.add(id(main))
                for child in displayable.visit():
                    discover(child)
            discover(screen.child)
            tracked, ordinals = {}, {}
            for row in case["widgets"]:
                name = row["widgetId"]
                ordinal = ordinals.get(name, 0)
                widget = widgets[name][ordinal]
                ordinals[name] = ordinal + 1
                assert id(widget) not in tracked
                tracked[id(widget)] = (widget, row)
            assert sum(len(values) for values in widgets.values()) == len(tracked)
            prefix = {"normal":"idle_", "hover":"hover_", "selected":"selected_idle_", "selectedHover":"selected_hover_", "disabled":"insensitive_", "selectedDisabled":"selected_insensitive_"}[case["state"]]
            for widget, row in tracked.values():
                if row["widgetId"] in ("local_button", "shared_button", "image_button", "score_bar"):
                    widget.set_style_prefix(prefix, True)
            measured, originals = {}, []
            for widget, row in tracked.values():
                if row["clips"]:
                    assert widget.xadjustment.value == widget.yadjustment.value == 0
                def observe(widget):
                    original = widget.render
                    def render(width, height, st, at):
                        result = original(width, height, st, at)
                        measured[id(widget)] = result.get_size()
                        return result
                    originals.append((widget, original))
                    widget.render = render
                observe(widget)
            renpy.free_memory()
            rendered = renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
            geometry, found = [], set()
            # Intersect against the real SDK viewport's constrained size. No
            # displayable construction or helper layout routine is used here.
            def locate(displayable, x, y, clip=None):
                identity = id(displayable)
                if identity in tracked:
                    assert identity not in found and identity in measured
                    found.add(identity)
                    row = tracked[identity][1]
                    width, height = measured[identity]
                    left, top, right, bottom = x, y, x + width, y + height
                    if clip is not None:
                        left, top = max(left, clip[0]), max(top, clip[1])
                        right, bottom = min(right, clip[2]), min(bottom, clip[3])
                    if right > left and bottom > top:
                        geometry.append(dict(start=row["selectionStart"], x=left, y=top, width=right-left, height=bottom-top))
                    if row["clips"]:
                        clip = left, top, right, bottom
                for child, offset in zip(getattr(displayable, "children", []), getattr(displayable, "offsets", [])):
                    locate(child, x + offset[0], y + offset[1], clip)
            locate(screen.child, 0, 0)
            assert len(found) == len(tracked)
            filename = "sample_fidelity-%sx%s-%s.png" % (config.screen_width, config.screen_height, case["id"])
            path = SAMPLE_OUTPUT + "/" + filename
            renpy.render_to_file(rendered, path, resize=True)
            for widget, original in originals:
                widget.render = original
            actual_inputs = {}
            for relative in SAMPLE_INPUTS:
                with open(config.basedir + "/" + relative, "rb") as source:
                    actual_inputs[relative] = _sample_hash.sha256(source.read()).hexdigest()
            assert actual_inputs == SAMPLE_INPUTS and not main_menu
            assert all(getattr(renpy.store, name) == value for name, value in case["values"].items())
            with open(path, "rb") as image:
                image_hash = _sample_hash.sha256(image.read()).hexdigest()
            record = dict(screen="sample_fidelity", aspect=[config.screen_width, config.screen_height], state=case["state"], id=case["id"],
                filename=filename, imageSHA256=image_hash, geometry=geometry, inputs=actual_inputs,
                revision=actual_inputs["game/ui/sample_fidelity.rpy"], guidesExcluded=True,
                renderer=renpy.get_renderer_info()["renderer"], sdkVersion=renpy.version_only,
                physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt)
            print("SAMPLE_FIDELITY " + _sample_json.dumps(record), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        _sample_advance()

screen sample_fidelity_capture():
    timer 0.5 repeat True action Function(_sample_capture)

label start:
    # Defaults have run. Only this deliberate proof sets game sample variables.
    $ renpy.set_physical_size((config.screen_width, config.screen_height))
    $ renpy.display.interface.set_mode()
    $ _sample_advance()
    show screen sample_fidelity_capture
    $ renpy.pause(hard=True)
    return
