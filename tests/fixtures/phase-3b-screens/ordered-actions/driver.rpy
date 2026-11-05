# Fixture-only observation. Accepted source and built-in actions stay unchanged.
define config.name = "Ordered action qualification"
define config.screen_width = int(__import__("os").environ.get("LOOMLIGHT_ACTIONS_WIDTH", "1280"))
define config.screen_height = int(__import__("os").environ.get("LOOMLIGHT_ACTIONS_HEIGHT", "720"))
define config.save_directory = None
define config.default_text_cps = 0

screen oa_fixture_main_menu():
    textbutton "Start" action Start()

label main_menu:
    call screen oa_fixture_main_menu
    return

screen say(who, what):
    window:
        yalign 1.0
        xfill True
        ysize 100
        text what id "what"

init python:
    import hashlib as _oa_hashlib
    import json as _oa_json
    import os as _oa_os
    import sys as _oa_sys

    with open(_oa_os.path.join(config.basedir, "accepted-runtime.json"), "rb") as _oa_file:
        _oa_manifest_bytes = _oa_file.read()
    _oa_manifest = _oa_json.loads(_oa_manifest_bytes)
    _oa_manifest_sha = _oa_hashlib.sha256(_oa_manifest_bytes).hexdigest()
    _oa_trace = []
    _oa_observations = []
    _oa_labels = []
    _oa_following = 0
    _oa_done = 0
    _oa_started_from_menu = False
    _oa_action_codes = {
        SetVariable.__call__.__code__: "setVariable",
        Show.__call__.__code__: "showScreen",
        Hide.__call__.__code__: "hideScreen",
        Return.__call__.__code__: "finishInteraction",
    }
    _oa_variable_ids = {v["technicalName"]: v["id"] for v in _oa_manifest["variables"]}
    with open(_oa_os.path.join(config.basedir, *_oa_manifest["entry"]["sourcePath"].split("/")), "rb") as _oa_file:
        _oa_story = _oa_file.read()
    _oa_markers = {
        _oa_story[:b["byteStart"]].count(b"\n") + 1: b["payload"]["text"]
        for b in _oa_manifest["entry"]["beats"] if b["payload"]["type"] == "narration"
    }

    def _oa_profile(frame, event, arg):
        # Observe the pinned engine's actual __call__ methods without wrapping them.
        if event != "call" or frame.f_code not in _oa_action_codes:
            return
        action = frame.f_locals.get("self")
        kind = _oa_action_codes[frame.f_code]
        if kind == "setVariable":
            if not isinstance(action, SetVariable) or action.field not in _oa_variable_ids:
                return
            value = action.value
            if type(value) is int:
                value = str(value)
            item = dict(type=kind, variableId=_oa_variable_ids[action.field], value=value)
        elif kind in ("showScreen", "hideScreen"):
            if action.screen != _oa_manifest["panel"]["name"]:
                return
            item = dict(type=kind, target=dict(screenId=_oa_manifest["panel"]["id"], sourceName=action.screen))
        else:
            item = dict(type=kind)
        _oa_trace.append(dict(action=item, panelVisible=renpy.get_screen(_oa_manifest["panel"]["name"]) is not None))

    def _oa_statement(statement):
        global _oa_following, _oa_done
        filename, line = renpy.get_filename_line()
        if statement == "say" and filename.replace("\\", "/").endswith(_oa_manifest["entry"]["sourcePath"]):
            marker = _oa_markers.get(line)
            if marker == "OA_AFTER":
                _oa_following += 1
            elif marker == "OA_DONE":
                _oa_done += 1
    config.statement_callbacks.append(_oa_statement)

    def _oa_label(name, abnormal):
        _oa_labels.append(name)
    config.label_callback = _oa_label

    def _oa_line():
        screen = renpy.get_screen("say")
        return screen.scope.get("what") if screen is not None else None

    def _oa_observe(step):
        _oa_observations.append(dict(step=step, followingCount=_oa_following, doneCount=_oa_done,
            ready=action_ready, score=str(action_score), caption=action_caption,
            dialogVisible=renpy.get_screen(_oa_manifest["dialog"]["name"]) is not None,
            panelVisible=renpy.get_screen(_oa_manifest["panel"]["name"]) is not None,
            calls=len(_oa_trace)))

    def _oa_emit(case):
        hashes = {}
        for record in _oa_manifest["files"]:
            with open(_oa_os.path.join(config.basedir, *record["path"].split("/")), "rb") as source:
                hashes[record["path"]] = _oa_hashlib.sha256(source.read()).hexdigest()
        print("ORDERED_ACTIONS_OBSERVED " + _oa_json.dumps(dict(schemaVersion=1, sdkVersion=".".join(str(n) for n in renpy.version_tuple[:3]), case=case,
            manifestSHA256=_oa_manifest_sha, acceptedHashes=hashes, resolution=[config.screen_width, config.screen_height],
            normalEntry=all(label in _oa_labels for label in ["start", _oa_manifest["entry"]["technicalLabel"]]),
            startedFromMenu=_oa_started_from_menu, calls=_oa_trace, observations=_oa_observations,
            observer="sys.setprofile built-in action calls", builtinsUnmodified=True)), flush=True)
