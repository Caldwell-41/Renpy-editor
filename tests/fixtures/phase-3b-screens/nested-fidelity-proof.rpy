# L19 observes normal Screen Language output. Never loaded by the inert helper.
init python:
    import hashlib as _nested_hash
    import json as _nested_json

    def _nested_capture():
        try:
            case = NESTED_CASE
            assert nested_caption == NESTED_SAMPLE
            screen = renpy.get_screen("nested_fidelity")
            widgets, seen = {}, set()
            def discover(displayable):
                if id(displayable) in seen:
                    return
                seen.add(id(displayable))
                name = getattr(displayable, "id", None)
                if name in {row["widgetId"] for row in case["widgets"]}:
                    widgets.setdefault(name, []).append(displayable)
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
            filename = "nested_fidelity-%sx%s-normal.png" % (config.screen_width, config.screen_height)
            path = NESTED_OUTPUT + "/" + filename
            renpy.render_to_file(rendered, path, resize=True)
            for widget, original in originals:
                widget.render = original
            actual_inputs = {}
            for relative in NESTED_INPUTS:
                with open(config.basedir + "/" + relative, "rb") as source:
                    actual_inputs[relative] = _nested_hash.sha256(source.read()).hexdigest()
            assert actual_inputs == NESTED_INPUTS and not main_menu
            with open(path, "rb") as image:
                image_hash = _nested_hash.sha256(image.read()).hexdigest()
            record = dict(screen="nested_fidelity", aspect=[config.screen_width, config.screen_height], state="normal",
                filename=filename, imageSHA256=image_hash, geometry=geometry, inputs=actual_inputs,
                revision=actual_inputs["game/ui/nested_fidelity.rpy"], guidesExcluded=True, viewportState=case["viewportState"],
                renderer=renpy.get_renderer_info()["renderer"], sdkVersion=renpy.version_only,
                physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt)
            print("NESTED_FIDELITY " + _nested_json.dumps(record), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)

screen nested_fidelity_capture():
    timer 0.5 action Function(_nested_capture)

label start:
    # Ren'Py applies default statements on entry. Set the comparison sample after them.
    $ nested_caption = NESTED_SAMPLE
    $ renpy.set_physical_size((config.screen_width, config.screen_height))
    $ renpy.display.interface.set_mode()
    show screen nested_fidelity
    show screen nested_fidelity_capture
    $ renpy.pause(hard=True)
    return
