# Fixture-only observation and deliberate preview entry. Accepted files stay exact.
define config.name = "Screen control qualification"
define config.screen_width = int(__import__("os").environ.get("LOOMLIGHT_CONTROLS_WIDTH", "1280"))
define config.screen_height = int(__import__("os").environ.get("LOOMLIGHT_CONTROLS_HEIGHT", "720"))
define config.save_directory = None
define config.default_text_cps = 0

screen sc_fixture_main_menu():
    vbox:
        textbutton "Start" action Start()
        textbutton "Preview controls" action Start("sc_deliberate_preview")

label main_menu:
    call screen sc_fixture_main_menu
    return

label sc_deliberate_preview:
    show screen notes
    call screen control_dialog
    "SC_PREVIEW_AFTER"
    "SC_PREVIEW_DONE"
    return

screen say(who, what):
    window:
        yalign 1.0
        xfill True
        ysize 100
        text what id "what"

init python:
    import hashlib as _sc_hashlib
    import json as _sc_json
    import os as _sc_os
    import sys as _sc_sys
    import pygame_sdl2 as _sc_pygame

    with open(_sc_os.path.join(config.basedir, "accepted-runtime.json"), "rb") as _sc_file:
        _sc_manifest_bytes = _sc_file.read()
    _sc_manifest = _sc_json.loads(_sc_manifest_bytes)
    _sc_manifest_sha = _sc_hashlib.sha256(_sc_manifest_bytes).hexdigest()
    _sc_labels = []
    _sc_calls = []
    _sc_bar_values = []
    _sc_appearances = []
    _sc_prefixes = []
    _sc_started_from_menu = False
    _sc_samples_inert = False
    _sc_following = 0
    _sc_done = 0
    _sc_action_codes = {
        SetVariable.__call__.__code__: "setVariable",
        Hide.__call__.__code__: "hideScreen",
        Return.__call__.__code__: "finishInteraction",
    }
    with open(_sc_os.path.join(config.basedir, *_sc_manifest["entry"]["sourcePath"].split("/")), "rb") as _sc_file:
        _sc_story = _sc_file.read()
    _sc_markers = {
        _sc_story[:beat["byteStart"]].count(b"\n") + 1: beat["payload"]["text"]
        for beat in _sc_manifest["entry"]["beats"] if beat["payload"]["type"] == "narration"
    }
    with open(_sc_os.path.join(config.gamedir, "zz_screen_controls_driver.rpy"), "rb") as _sc_file:
        _sc_preview_markers = {number: line.strip().decode("ascii")[1:-1]
                               for number, line in enumerate(_sc_file.read().splitlines(), 1)
                               if line.strip() in (b'"SC_PREVIEW_AFTER"', b'"SC_PREVIEW_DONE"')}

    def _sc_profile(frame, event, arg):
        if event != "call" or frame.f_code not in _sc_action_codes:
            return
        action = frame.f_locals.get("self")
        kind = _sc_action_codes[frame.f_code]
        if kind == "setVariable":
            if action.field != _sc_manifest["variable"]["technicalName"]:
                return
            item = dict(type=kind, variableId=_sc_manifest["variable"]["id"], value=str(action.value))
        elif kind == "hideScreen":
            if action.screen != _sc_manifest["panel"]["name"]:
                return
            item = dict(type=kind, target=dict(screenId=_sc_manifest["panel"]["id"], sourceName=action.screen))
        else:
            item = dict(type=kind)
        _sc_calls.append(item)

    def _sc_statement(statement):
        global _sc_following, _sc_done
        if statement != "say":
            return
        filename, line = renpy.get_filename_line()
        filename = filename.replace("\\", "/")
        if filename.endswith(_sc_manifest["entry"]["sourcePath"]):
            marker = _sc_markers.get(line)
        elif filename.endswith("zz_screen_controls_driver.rpy"):
            marker = _sc_preview_markers.get(line)
        else:
            return
        if marker in ("SC_AFTER", "SC_PREVIEW_AFTER"):
            _sc_following += 1
        elif marker in ("SC_DONE", "SC_PREVIEW_DONE"):
            _sc_done += 1
    config.statement_callbacks.append(_sc_statement)

    def _sc_label(name, abnormal):
        _sc_labels.append(name)
    config.label_callback = _sc_label

    def _sc_line():
        screen = renpy.get_screen("say")
        return screen.scope.get("what") if screen is not None else None

    def _sc_control(kind):
        screen = renpy.get_screen(_sc_manifest["dialog"]["name"])
        renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
        matches = [child for child in screen.child.children if isinstance(child, kind)]
        if len(matches) != 1:
            raise Exception("Expected one actual rendered control: " + kind.__name__)
        return matches[0]

    def _sc_bar_observe(step):
        _sc_bar_values.append(dict(step=step, value=str(control_score)))

    def _sc_prefix_observe():
        _sc_prefixes.append(_sc_control(renpy.display.behavior.ImageButton).style.prefix)

    def _sc_sample_appearances():
        global _sc_samples_inert, _sc_bar_size, _sc_bar_range, _sc_bar_offset, _sc_bar_step
        before = (control_score, len(_sc_calls))
        bar = _sc_control(renpy.display.behavior.Bar)
        _sc_bar_size = list(renpy.render(bar, 320, 24, 0, 0).get_size())
        _sc_bar_range, _sc_bar_offset, _sc_bar_step = bar.value.range, bar.value.offset, bar.value.step
        button = _sc_control(renpy.display.behavior.ImageButton)
        saved_prefix = button.style.prefix
        image_node = next(node for screen in _sc_manifest["document"]["screens"] for node in screen["nodes"]
                          if node["id"] == _sc_manifest["imageButtonId"])
        assets = {asset["id"]: asset for asset in _sc_manifest["sidecars"]["authoring"]["assets"]}
        # Exercise native six-state rendering without inventing selection/sensitivity actions.
        # These are engine appearance samples, separate from actual idle/hover input below.
        try:
            for state, prefix in (("normal", "idle_"), ("hover", "hover_"),
                                  ("selected", "selected_idle_"), ("selectedHover", "selected_hover_"),
                                  ("disabled", "insensitive_"), ("selectedDisabled", "selected_insensitive_")):
                button.set_style_prefix(prefix, True)
                renpy.display.render.invalidate(button)
                # Match the established canvas-reference capture path. Invalidation
                # schedules redraw; free_memory removes renders cached within this callback.
                renpy.free_memory()
                rendered = renpy.render(button, 160, 80, 0, 0)
                pixels = renpy.render_to_surface(rendered, resize=True)
                asset = assets[image_node["imageButtonAppearances"][state]["assetId"]]
                relative = asset["relativePath"].removeprefix("game/")
                reference = renpy.display.behavior.ImageButton(
                    Transform(relative, xysize=(160, 80)), action=Null(), xsize=160, ysize=80)
                reference.per_interact()
                reference.set_style_prefix(prefix, True)
                renpy.free_memory()
                reference_pixels = renpy.render_to_surface(reference, 160, 80, resize=True)
                raw_image = _sc_pygame.image.load(_sc_os.path.join(config.gamedir, relative))
                name = "%dx%d-%s-%s" % (config.screen_width, config.screen_height, _sc_case, state)
                captures = _sc_os.environ["LOOMLIGHT_CONTROLS_CAPTURE_DIR"]
                _sc_pygame.image.save(pixels, _sc_os.path.join(captures, name + "-actual.png"))
                _sc_pygame.image.save(reference_pixels, _sc_os.path.join(captures, name + "-reference.png"))
                _sc_appearances.append(dict(state=state, renderedSize=list(rendered.get_size()),
                    rgba=list(pixels.get_at((80, 40))), referenceRGBA=list(reference_pixels.get_at((80, 40))),
                    sourceRGBA=list(raw_image.get_at((40, 20))),
                    pixelsSHA256=_sc_hashlib.sha256(_sc_pygame.image.tostring(pixels, "RGBA")).hexdigest(),
                    referenceSHA256=_sc_hashlib.sha256(_sc_pygame.image.tostring(reference_pixels, "RGBA")).hexdigest()))
        finally:
            button.set_style_prefix(saved_prefix, True)
            renpy.display.render.invalidate(button)
        _sc_samples_inert = before == (control_score, len(_sc_calls))

    def _sc_emit():
        hashes = {}
        for record in _sc_manifest["files"]:
            with open(_sc_os.path.join(config.basedir, *record["path"].split("/")), "rb") as source:
                hashes[record["path"]] = _sc_hashlib.sha256(source.read()).hexdigest()
        print("SCREEN_CONTROLS_OBSERVED " + _sc_json.dumps(dict(
            schemaVersion=1, sdkVersion=".".join(str(n) for n in renpy.version_tuple[:3]), case=_sc_case,
            manifestSHA256=_sc_manifest_sha, acceptedHashes=hashes,
            resolution=[config.screen_width, config.screen_height], startedFromMenu=_sc_started_from_menu,
            normalEntry=all(label in _sc_labels for label in ["start", _sc_manifest["entry"]["technicalLabel"]]),
            previewEntry="sc_deliberate_preview" in _sc_labels,
            calls=_sc_calls, observer="sys.setprofile built-in action calls", builtinsUnmodified=True,
            bar=_sc_bar_values, barSize=_sc_bar_size, barRange=_sc_bar_range,
            barOffset=_sc_bar_offset, barStep=_sc_bar_step,
            appearances=_sc_appearances, actualPrefixes=_sc_prefixes, stateSamplesInert=_sc_samples_inert,
            finalValue=str(control_score), followingCount=_sc_following, doneCount=_sc_done,
            panelVisible=renpy.get_screen(_sc_manifest["panel"]["name"]) is not None,
            dialogVisible=renpy.get_screen(_sc_manifest["dialog"]["name"]) is not None)), flush=True)
