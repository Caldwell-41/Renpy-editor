# Input uses the pinned engine's test queue. It is not physical input evidence.
testsuite screen_controls:
    before testcase:
        $ _test.timeout = 10.0
        assert screen "sc_fixture_main_menu" timeout 10
        $ _sc_started_from_menu = bool(main_menu and renpy.get_screen("sc_fixture_main_menu"))

    after testcase:
        assert screen "control_dialog" timeout 10
        $ _sc_sys.setprofile(_sc_profile)
        move pos (config.screen_width - 1, config.screen_height - 1)
        pause 0.2
        $ _sc_bar_observe("initial")
        $ _sc_prefix_observe()
        $ _sc_sample_appearances()
        click pos (100, 112)
        assert eval (control_score == -5) timeout 10
        $ _sc_bar_observe("minimum")
        click pos (419, 112)
        assert eval (control_score == 15) timeout 10
        $ _sc_bar_observe("maximum")
        keysym "K_RETURN" pos (419, 112)
        keysym "K_LEFT" pos (419, 112)
        assert eval (control_score == 14) timeout 10
        $ _sc_bar_observe("keyboard")
        keysym "K_RETURN" pos (419, 112)
        move pos (180, 220)
        pause 0.2
        $ _sc_prefix_observe()
        click pos (180, 220)
        assert not screen "control_dialog" timeout 10
        assert eval (_sc_line() == ("SC_AFTER" if _sc_case == "normal" else "SC_PREVIEW_AFTER")) timeout 10
        pause 0.2
        $ _sc_sys.setprofile(None)
        assert eval (_sc_following == 1 and _sc_done == 0 and control_score == 7)
        assert eval (_sc_calls == _sc_manifest["actions"] and _sc_samples_inert)
        assert not screen "notes"
        $ _sc_emit()

    teardown:
        $ _sc_sys.setprofile(None)
        exit

    testcase normal:
        run Start()
        $ _sc_case = "normal"
        advance until eval (_sc_line() == "SC_BEFORE")
        advance until screen "control_dialog"

    testcase preview:
        run Start("sc_deliberate_preview")
        $ _sc_case = "preview"
        assert screen "control_dialog" timeout 10
