# Fixture-only presentation and observation. Accepted panel/Story files stay exact.
define config.name = "Help dialog qualification"
define config.screen_width = int(__import__("os").environ.get("LOOMLIGHT_DIALOG_WIDTH", "1280"))
define config.screen_height = int(__import__("os").environ.get("LOOMLIGHT_DIALOG_HEIGHT", "720"))
define config.save_directory = None
define config.default_text_cps = 0

screen hd_fixture_main_menu():
    textbutton "Start" action Start()

label main_menu:
    call screen hd_fixture_main_menu
    return

screen say(who, what):
    window:
        yalign 1.0
        xfill True
        ysize 100
        if who is not None:
            text who id "who"
        text what id "what"

init python:
    import hashlib as _hd_hashlib
    import json as _hd_json
    import os as _hd_os
    import renpy.test.testfocus as _hd_testfocus

    with open(_hd_os.path.join(config.basedir, "accepted-runtime.json"), "rb") as _hd_file:
        _hd_manifest_bytes = _hd_file.read()
    _hd_manifest = _hd_json.loads(_hd_manifest_bytes)
    _hd_manifest_sha = _hd_hashlib.sha256(_hd_manifest_bytes).hexdigest()
    _hd_seen_labels = []
    _hd_observations = []
    _hd_inputs = []
    _hd_outside = None
    _hd_frame_rect = None
    _hd_started_from_menu = False
    _hd_following_count = 0
    _hd_done_count = 0
    _hd_underlying_count = 0
    _hd_baseline_count = 0
    with open(_hd_os.path.join(config.basedir, *_hd_manifest["entry"]["sourcePath"].split("/")), "rb") as _hd_source:
        _hd_story_source = _hd_source.read()
    _hd_markers = {}
    for _hd_beat in _hd_manifest["entry"]["beats"]:
        if _hd_beat["payload"]["type"] == "narration":
            _hd_markers[_hd_story_source[:_hd_beat["byteStart"]].count(b"\n") + 1] = _hd_beat["payload"]["text"]

    def _hd_statement_seen(statement):
        global _hd_following_count, _hd_done_count
        filename, line = renpy.get_filename_line()
        if filename.replace("\\", "/").endswith(_hd_manifest["entry"]["sourcePath"]):
            marker = _hd_markers.get(line)
            if statement == "say" and marker == "HD_AFTER":
                _hd_following_count += 1
            elif statement == "say" and marker == "HD_DONE":
                _hd_done_count += 1
    config.statement_callbacks.append(_hd_statement_seen)

    def _hd_touch():
        global _hd_underlying_count
        _hd_underlying_count += 1
    config.overlay_screens.append("hd_underlying")

    def _hd_label_seen(name, abnormal):
        _hd_seen_labels.append(name)

    config.label_callback = _hd_label_seen

    def _hd_line():
        screen = renpy.get_screen("say")
        return screen.scope.get("what") if screen is not None else None

    def _hd_close_focused():
        close = _hd_testfocus.find_focus("Close", False)
        return close is not None and renpy.display.focus.get_focused() is close.widget

    def _hd_observe(step):
        close = _hd_testfocus.find_focus("Close", False)
        _hd_observations.append(dict(
            step=step, followingCount=_hd_following_count, doneCount=_hd_done_count, underlyingCount=_hd_underlying_count,
            dialogVisible=renpy.get_screen(_hd_manifest["dialog"]["name"]) is not None,
            modal=bool(renpy.get_screen(_hd_manifest["dialog"]["name"]).modal) if renpy.get_screen(_hd_manifest["dialog"]["name"]) is not None else False,
            gameMenu=bool(renpy.context()._menu),
            focusedClose=_hd_close_focused(),
            defaultClose=close is not None and bool(close.widget.default),
            mousePoint=list(renpy.test.testmouse.mouse_pos) if renpy.test.testmouse.mouse_pos is not None else None))

    def _hd_measure_outside():
        # Pinned 8.5.3 render-tree observer. It never changes the authored screen.
        screen = renpy.get_screen(_hd_manifest["dialog"]["name"])
        renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
        frames = [(child, offset) for child, offset in zip(screen.child.children, screen.child.offsets)
                  if isinstance(child, renpy.display.layout.Window)]
        if len(frames) != 1:
            raise Exception("Expected one actual rendered Help frame")
        frame, (x, y) = frames[0]
        width, height = renpy.render(frame, config.screen_width, config.screen_height, 0, 0).get_size()
        rect = [int(x), int(y), int(width), int(height)]
        for point in [(0, 0), (config.screen_width - 1, 0), (0, config.screen_height - 1), (config.screen_width - 1, config.screen_height - 1)]:
            if not (x <= point[0] < x + width and y <= point[1] < y + height):
                return rect, point
        raise Exception("No outside click position in game bounds")

    def _hd_emit(case):
        hashes = {}
        for record in _hd_manifest["files"]:
            with open(_hd_os.path.join(config.basedir, *record["path"].split("/")), "rb") as source:
                hashes[record["path"]] = _hd_hashlib.sha256(source.read()).hexdigest()
        print("HELP_DIALOG_OBSERVED " + _hd_json.dumps(dict(
            schemaVersion=1, sdkVersion=".".join(str(n) for n in renpy.version_tuple[:3]), case=case,
            manifestSHA256=_hd_manifest_sha, acceptedHashes=hashes,
            normalEntry=all(label in _hd_seen_labels for label in
                ["start", _hd_manifest["entry"]["technicalLabel"]]),
            startedFromMenu=_hd_started_from_menu, resolution=[config.screen_width, config.screen_height], underlyingBaselineCount=_hd_baseline_count,
            observations=_hd_observations, inputs=_hd_inputs,
            defaultGameEscape="K_ESCAPE" in config.keymap["game_menu"],
            outsidePoint=list(_hd_outside) if _hd_outside is not None else None,
            frameRect=_hd_frame_rect)), flush=True)

# Fixture control stays behind the accepted modal screen. Its click is verified
# before the Call so a zero counter during Call cannot pass with an inert control.
screen hd_underlying():
    zorder -1
    textbutton "Underlying control":
        xpos 0
        ypos 0
        xsize 240
        ysize 40
        action Function(_hd_touch)
