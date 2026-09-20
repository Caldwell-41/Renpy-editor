# Ren'Py 8.5 automated-test syntax exercised by the SDK adapter spike.
label preview_runtime_probe:
    $ route = "riverside"
    $ trust = 0
    scene expression Solid("#18202b")
    with dissolve
    show alex neutral at radio_left
    show screen route_status
    ar neutral "Runtime mapping first beat."
    $ trust += fixture_route_bonus(route)
    ar pleased "Runtime mapping second beat."
    hide screen route_status
    return

testsuite sdk_adapter:
    testcase arithmetic:
        assert eval (fixture_route_bonus("riverside") == 1)

    testcase preview_mapping:
        run Jump("preview_runtime_probe")
        advance until "Runtime mapping first beat."
        assert eval (route == "riverside" and trust == 0)
        assert eval renpy.showing("alex")
        assert screen "route_status"
        advance until "Runtime mapping second beat."
        assert eval (trust == 1)
        assert screen "route_status"

    teardown:
        exit
