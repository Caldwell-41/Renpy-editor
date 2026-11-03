# Normal menu -> unchanged start -> accepted Story. Input uses the engine queue.
testsuite help_dialog:
    before testcase:
        $ _test.timeout = 10.0
        assert screen "hd_fixture_main_menu" timeout 10
        $ _hd_started_from_menu = bool(main_menu and renpy.get_screen("hd_fixture_main_menu"))
        run Start()
        advance until eval (_hd_line() == "HD_BEFORE")
        click "Underlying control"
        assert eval (_hd_underlying_count == 1)
        $ _hd_baseline_count = _hd_underlying_count
        $ _hd_underlying_count = 0
        advance
        assert screen "help_dialog" timeout 10
        pause 0.2
        $ _hd_frame_rect, _hd_outside = _hd_measure_outside()
        $ _hd_observe("waiting")
        assert eval (_hd_following_count == 0 and _hd_done_count == 0)

    after testcase:
        assert not screen "help_dialog" timeout 10
        assert eval (_hd_line() == "HD_AFTER") timeout 10
        $ _hd_observe("finished")
        pause 0.2
        $ _hd_observe("settled")
        assert eval (_hd_following_count == 1 and _hd_done_count == 0 and _hd_underlying_count == 0)
        $ _hd_emit(_hd_case)

    teardown:
        exit

    testcase close:
        $ _hd_case = "close"
        click "Close"
        $ _hd_inputs.append("clickClose")

    testcase escape:
        $ _hd_case = "escape"
        assert eval ("K_ESCAPE" in config.keymap["game_menu"])
        keysym "K_ESCAPE" pos _hd_outside
        $ _hd_inputs.append("K_ESCAPE")

    testcase keyboard_close:
        $ _hd_case = "keyboard_close"
        move pos _hd_outside
        $ _hd_inputs.append("moveOutside")
        pause 0.2
        keysym "K_DOWN" pos _hd_outside
        $ _hd_inputs.append("K_DOWN")
        assert eval (_hd_close_focused()) timeout 10
        $ _hd_observe("focused")
        keysym "K_RETURN" pos _hd_outside
        $ _hd_inputs.append("K_RETURN")

    testcase outside_blocks:
        $ _hd_case = "outside_blocks"
        click pos (8, 8)
        $ _hd_inputs.append("clickUnderlying")
        click pos _hd_outside
        $ _hd_inputs.append("clickOutside")
        keysym "K_SPACE" pos _hd_outside
        $ _hd_inputs.append("K_SPACE")
        pause 0.2
        assert screen "help_dialog" timeout 10
        assert eval (_hd_following_count == 0 and _hd_underlying_count == 0)
        $ _hd_observe("blocked")
        click "Close"
        $ _hd_inputs.append("clickClose")
