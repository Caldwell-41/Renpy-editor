# L18 normal-game instrumentation. Never copied into the hidden helper.
init python:
    import json as _base_help_json
    import hashlib as _base_help_hashlib

    def _base_help_capture():
        try:
            records = []
            for case in BASE_HELP_CASES:
                request = case["request"]
                screen_name, state = case["screen"], request["buttonState"]
                widgets = {name: renpy.get_displayable(screen_name, name, base=True) for name in ("panel", "group", "body", "seal", "close")}
                assert all(widget is not None for widget in widgets.values())
                widgets["close"].set_style_prefix("idle_" if state == "normal" else "hover_", True)
                measured, originals = {}, []
                # Observe the SDK's actual parent-constrained render sizes, rather
                # than re-rendering every widget against the whole screen.
                def observe(widget):
                    original = widget.render
                    def render(width, height, st, at):
                        result = original(width, height, st, at)
                        measured[id(widget)] = result.get_size()
                        return result
                    originals.append((widget, original))
                    widget.render = render
                for widget in widgets.values():
                    observe(widget)
                renpy.free_memory()
                screen = renpy.get_screen(screen_name)
                rendered = renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
                geometry, found = [], set()
                identities = {id(widget): case["plan"]["nodes"][index + 2]["start"] for index, widget in enumerate(widgets.values())}
                def locate(displayable, x, y):
                    identity = id(displayable)
                    if identity in identities:
                        assert identity in measured and identity not in found
                        found.add(identity)
                        width, height = measured[identity]
                        geometry.append(dict(start=identities[identity], x=x, y=y, width=width, height=height))
                    for child, offset in zip(getattr(displayable, "children", []), getattr(displayable, "offsets", [])):
                        locate(child, x + offset[0], y + offset[1])
                locate(screen, 0, 0)
                assert len(geometry) == 5
                filename = "%s-%sx%s-%s.png" % (screen_name, config.screen_width, config.screen_height, state)
                path = BASE_HELP_OUTPUT + "/" + filename
                renpy.render_to_file(rendered, path, resize=True)
                for widget, original in originals:
                    widget.render = original
                actual_inputs = {}
                for relative in BASE_HELP_INPUTS:
                    with open(config.basedir + "/" + relative, "rb") as source:
                        actual_inputs[relative] = _base_help_hashlib.sha256(source.read()).hexdigest()
                assert actual_inputs == BASE_HELP_INPUTS
                with open(path, "rb") as image:
                    image_hash = _base_help_hashlib.sha256(image.read()).hexdigest()
                assert not main_menu
                records.append(dict(screen=screen_name, aspect=[config.screen_width, config.screen_height], state=state,
                    filename=filename, imageSHA256=image_hash, geometry=geometry, inputs=actual_inputs,
                    revision=actual_inputs["game/ui/base_help_fidelity.rpy"], guidesExcluded=True,
                    renderer=renpy.get_renderer_info()["renderer"], sdkVersion=renpy.version_only,
                    physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt))
            print("BASE_HELP_FIDELITY " + _base_help_json.dumps(records), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)

screen base_help_fidelity_capture():
    timer 0.5 action Function(_base_help_capture)

label start:
    $ renpy.set_physical_size((config.screen_width, config.screen_height))
    $ renpy.display.interface.set_mode()
    show screen base_help_fidelity
    show screen base_help_anchors
    show screen base_help_fidelity_capture
    $ renpy.pause(hard=True)
    return
