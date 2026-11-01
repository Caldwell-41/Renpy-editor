# Fixture-only presentation and observation. Accepted panel/Story files stay exact.
define config.name = "Help panel qualification"
define config.screen_width = 1280
define config.screen_height = 720
define config.save_directory = None
define config.default_text_cps = 0

screen say(who, what):
    window:
        yalign 1.0
        xfill True
        ysize 100
        if who is not None:
            text who id "who"
        text what id "what"

init python:
    import hashlib as _hp_hashlib
    import json as _hp_json
    import os as _hp_os
    import renpy.test.testfocus as _hp_testfocus

    with open(_hp_os.path.join(config.basedir, "accepted-runtime.json"), "rb") as _hp_file:
        _hp_manifest_bytes = _hp_file.read()
    _hp_manifest = _hp_json.loads(_hp_manifest_bytes)
    _hp_manifest_sha = _hp_hashlib.sha256(_hp_manifest_bytes).hexdigest()
    _hp_seen_labels = []
    _hp_observations = []
    _hp_inputs = []
    _hp_outside = None
    _hp_frame_rect = None

    def _hp_label_seen(name, abnormal):
        _hp_seen_labels.append(name)

    config.label_callback = _hp_label_seen

    def _hp_line():
        screen = renpy.get_screen("say")
        return screen.scope.get("what") if screen is not None else None

    def _hp_observe(step):
        close = _hp_testfocus.find_focus("Close", False)
        _hp_observations.append(dict(
            step=step, line=_hp_line(),
            panelVisible=renpy.get_screen(_hp_manifest["panel"]["name"]) is not None,
            gameMenu=bool(renpy.context()._menu),
            focusedClose=close is not None and renpy.display.focus.get_focused() is close.widget))

    def _hp_measure_outside():
        # Pinned 8.5.3 render-tree observer. It never changes the authored screen.
        screen = renpy.get_screen(_hp_manifest["panel"]["name"])
        renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
        frames = [(child, offset) for child, offset in zip(screen.child.children, screen.child.offsets)
                  if isinstance(child, renpy.display.layout.Window)]
        if len(frames) != 1:
            raise Exception("Expected one actual rendered Help frame")
        frame, (x, y) = frames[0]
        width, height = renpy.render(frame, config.screen_width, config.screen_height, 0, 0).get_size()
        rect = [int(x), int(y), int(width), int(height)]
        for point in [(0, 0), (1279, 0), (0, 719), (1279, 719)]:
            if not (x <= point[0] < x + width and y <= point[1] < y + height):
                return rect, point
        raise Exception("No outside click position in game bounds")

    def _hp_emit(case):
        hashes = {}
        for record in _hp_manifest["files"]:
            with open(_hp_os.path.join(config.basedir, *record["path"].split("/")), "rb") as source:
                hashes[record["path"]] = _hp_hashlib.sha256(source.read()).hexdigest()
        print("HELP_PANEL_OBSERVED " + _hp_json.dumps(dict(
            schemaVersion=1, sdkVersion=".".join(str(n) for n in renpy.version_tuple[:3]), case=case,
            manifestSHA256=_hp_manifest_sha, acceptedHashes=hashes,
            normalEntry=all(label in _hp_seen_labels for label in
                ["start", _hp_manifest["entry"]["label"], _hp_manifest["story"]["label"]]),
            observations=_hp_observations, inputs=_hp_inputs,
            defaultGameEscape="K_ESCAPE" in config.keymap["game_menu"],
            outsidePoint=list(_hp_outside) if _hp_outside is not None else None,
            frameRect=_hp_frame_rect)), flush=True)
