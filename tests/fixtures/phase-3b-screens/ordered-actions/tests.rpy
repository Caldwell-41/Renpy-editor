testsuite ordered_actions:
    before testcase:
        $ _test.timeout = 10.0
        assert screen "oa_fixture_main_menu" timeout 10
        $ _oa_started_from_menu = bool(main_menu and renpy.get_screen("oa_fixture_main_menu"))
        run Start()
        advance until eval (_oa_line() == "OA_BEFORE")
        $ _oa_sys.setprofile(_oa_profile)
        advance until screen "actions_dialog"
        pause 0.2
        $ _oa_observe("waiting")
        assert eval (len(_oa_trace) == 0 and _oa_following == 0)

    after testcase:
        assert not screen "actions_dialog" timeout 10
        assert eval (_oa_line() == "OA_AFTER") timeout 10
        $ _oa_observe("finished")
        pause 0.2
        $ _oa_observe("settled")
        $ _oa_sys.setprofile(None)
        assert eval (_oa_following == 1 and _oa_done == 0 and len(_oa_trace) == 8)
        assert eval ([row["action"] for row in _oa_trace] == _oa_manifest["actions"])
        assert eval (action_ready is False and str(action_score) == "-7" and action_caption == _oa_manifest["expected"]["caption"])
        assert not screen "notes"
        $ _oa_emit(_oa_case)

    teardown:
        $ _oa_sys.setprofile(None)
        exit

    testcase click:
        $ _oa_case = "click"
        click "Apply sequence"

    testcase keyboard:
        $ _oa_case = "keyboard"
        move pos (config.screen_width - 1, config.screen_height - 1)
        keysym "K_DOWN"
        keysym "K_RETURN"
