# Each selected testcase starts through the unchanged normal label start.
# Actions below use the engine test input queue, never call Hide directly.
testsuite help_panel:
    before testcase:
        $ _test.timeout = 10.0
        assert screen "hp_fixture_main_menu" timeout 10
        $ _hp_started_from_menu = bool(main_menu and renpy.get_screen("hp_fixture_main_menu"))
        run Start()
        advance until eval (_hp_line() == "HP_BASELINE")
        $ _hp_observe("baseline")
        advance
        assert eval (_hp_line() == "HP_SHOWN_0") timeout 10
        assert screen "help_panel" timeout 10
        pause 0.2
        $ _hp_observe("shown")

    teardown:
        exit

    testcase show_persists:
        advance
        $ _hp_inputs.append("advance")
        assert eval (_hp_line() == "HP_SHOWN_1") timeout 10
        $ _hp_observe("advance1")
        advance
        $ _hp_inputs.append("advance")
        assert eval (_hp_line() == "HP_SHOWN_2") timeout 10
        $ _hp_observe("advance2")
        $ _hp_emit("show_persists")

    testcase authored_hide:
        advance
        advance
        $ _hp_inputs.extend(["advance", "advance"])
        assert eval (_hp_line() == "HP_SHOWN_2") timeout 10
        $ _hp_observe("beforeHide")
        advance
        $ _hp_inputs.append("advance")
        assert eval (_hp_line() == "HP_HIDDEN") timeout 10
        assert not screen "help_panel" timeout 10
        $ _hp_observe("hidden")
        $ _hp_emit("authored_hide")

    testcase reshow_close:
        advance
        advance
        advance
        advance
        $ _hp_inputs.extend(["advance"] * 4)
        assert eval (_hp_line() == "HP_RESHOWN") timeout 10
        assert screen "help_panel" timeout 10
        $ _hp_observe("reshown")
        click "Close"
        $ _hp_inputs.append("clickClose")
        assert not screen "help_panel" timeout 10
        $ _hp_observe("closed")
        $ _hp_emit("reshow_close")

    testcase outside_click:
        $ _hp_frame_rect, _hp_outside = _hp_measure_outside()
        click pos _hp_outside
        $ _hp_inputs.append("clickOutside")
        pause 0.2
        assert screen "help_panel" timeout 10
        $ _hp_observe("outside")
        $ _hp_emit("outside_click")

    testcase escape:
        assert eval ("K_ESCAPE" in config.keymap["game_menu"])
        $ _hp_frame_rect, _hp_outside = _hp_measure_outside()
        keysym "K_ESCAPE" pos _hp_outside
        $ _hp_inputs.append("K_ESCAPE")
        assert not screen "help_panel" timeout 10
        $ _hp_observe("escaped")
        $ _hp_emit("escape")

    testcase keyboard_close:
        $ _hp_frame_rect, _hp_outside = _hp_measure_outside()
        move pos _hp_outside
        $ _hp_inputs.append("moveOutside")
        pause 0.2
        keysym "K_DOWN" pos _hp_outside
        $ _hp_inputs.append("K_DOWN")
        assert eval (_hp_close_focused()) timeout 10
        $ _hp_observe("focused")
        keysym "K_RETURN" pos _hp_outside
        $ _hp_inputs.append("K_RETURN")
        assert not screen "help_panel" timeout 10
        $ _hp_observe("activated")
        $ _hp_emit("keyboard_close")
