# Qualification-only entry and observers. Captured source files remain unchanged.
init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

    def _ui_observe_python():
        if getattr(renpy.store, "_ui_trace_enabled", False):
            state = (trust, money)
            assert type(trust) is int and type(money) is float
            if not _ui_trace or _ui_trace[-1] != state:
                _ui_trace.append(state)

    config.python_callbacks.append(_ui_observe_python)

    def _ui_button(operation):
        # Read the actions of real rendered Buttons. Do not rebuild their lambdas.
        found = []
        def visit(displayable):
            if isinstance(displayable, renpy.display.behavior.Button):
                action = displayable.action
                first = action[0] if isinstance(action, (list, tuple)) else action
                if isinstance(first, Function) and first.args[2] == operation:
                    found.append(displayable)
        renpy.get_screen("arithmetic_dialog").visit_all(visit)
        assert len(found) == 1, (operation, len(found))
        return found[0]

    def _ui_activate(operation):
        # Timer dispatch preserves normal interaction/Return handling. This is
        # rendered-action activation, not a physical mouse/keyboard gesture.
        renpy.show_screen("_ui_dispatch", emitted_action=_ui_button(operation).action)

screen _ui_dispatch(emitted_action):
    timer 0.01 action emitted_action

default arith_flag = False
default arith_title = "literal"
default _ui_trace_enabled = False
default _ui_trace = []
default _ui_continuations = 0

label start:
    $ _ui_trace_enabled = True
    call loomlight_scene_f430d949a634431c803871a25441d72d
    $ _ui_trace_enabled = False
    "UI story complete"
    # Explicit fixture setup, independent of Story's declaration defaults.
    $ money = 4.5
    $ trust = 5
    $ reward = 0
    call loomlight_scene_129a77c88ff94281893c1a373bd563cd
    "UI condition complete"
    call screen arithmetic_dialog
    $ _ui_continuations += 1
    "UI text first"
    $ trust = 7
    $ bonus = 3
    call screen arithmetic_dialog
    $ _ui_continuations += 1
    "UI text second"
    call screen arithmetic_dialog
    $ _ui_continuations += 1
    "UI image first"
    $ bonus = 2
    call screen arithmetic_dialog
    $ _ui_continuations += 1
    "UI complete"
    return

testsuite arithmetic_ui:
    after testcase:
        exit

    testcase values:
        assert screen "main_menu" timeout 10
        $ renpy.start_predict_screen("arithmetic_dialog")
        pause 0.2
        assert eval (trust == 5 and money == 4.5 and reward == 0 and bonus == 7)
        click "Start"
        assert "Arithmetic journey" timeout 10
        assert eval (_ui_trace == [(5, 4.5), (5, 9.5), (6, 9.5), (6, 1.5), (5, 1.5), (6, 1.5), (27, 1.5)])
        assert eval (trust == 27 and type(trust) is int and money == 1.5 and type(money) is float and arith_flag is True and arith_title == "retained text")
        $ print("ARITHMETIC_UI_STORY precision=6 protected=5 nested=27:int money=1.5:float flag=True title=retained_text", flush=True)
        advance
        assert "UI story complete" timeout 10
        advance
        assert "Fraction accepted" timeout 10
        assert eval (money == 4.5 and type(money) is float)
        advance
        assert "UI condition complete" timeout 10
        advance
        assert screen "arithmetic_dialog" timeout 10
        assert eval ("Balance: 4.5" in renpy.get_screen("arithmetic_dialog")._tts_all(False))
        $ renpy.restart_interaction()
        pause 0.2
        assert eval (renpy.is_selected(_ui_button("add").action) is False)
        $ renpy.display.behavior.predict_action(_ui_button("add").action)
        $ renpy.display.behavior.predict_action(_ui_button("remainder").action)
        $ renpy.display.behavior.predict_action(_ui_button("divide").action)
        assert eval (trust == 5 and reward == 0 and money == 4.5 and _ui_continuations == 0)
        $ _ui_activate("divide")
        assert eval (money == 2.25 and type(money) is float) timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        $ _ui_activate("divide")
        assert eval (money == 1.125 and type(money) is float) timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        assert eval (trust == 5 and reward == 0 and _ui_continuations == 0)
        $ print("ARITHMETIC_UI_DIVIDE 4.5/2=2.25/2=1.125:float continuation=0", flush=True)
        # Change current operands after screen evaluation. Captured amounts fail.
        $ money = 9.5
        $ trust = 6
        $ _ui_activate("remainder")
        assert "UI text first" timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        assert eval (money == 2.0 and type(money) is float and trust == 6 and reward == 12 and type(reward) is int and _ui_continuations == 1)
        advance
        assert screen "arithmetic_dialog" timeout 10
        assert eval ("Balance: 2.0" in renpy.get_screen("arithmetic_dialog")._tts_all(False))
        $ _ui_activate("remainder")
        assert "UI text second" timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        assert eval (money == 2.0 and reward == 14 and trust == 7 and _ui_continuations == 2)
        $ print("ARITHMETIC_UI_TEXT first=2.0:float/12:int second=2.0:float/14:int current=True", flush=True)
        advance
        assert screen "arithmetic_dialog" timeout 10
        $ _ui_activate("add")
        assert "UI image first" timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        assert eval (trust == 10 and reward == 20 and _ui_continuations == 3)
        advance
        assert screen "arithmetic_dialog" timeout 10
        $ _ui_activate("add")
        assert "UI complete" timeout 10
        $ renpy.hide_screen("_ui_dispatch")
        assert eval (trust == 12 and type(trust) is int and reward == 24 and type(reward) is int and money == 2.0 and type(money) is float and _ui_continuations == 4)
        $ print("ARITHMETIC_UI_IMAGE first=10/20 second=12/24:int bonus=3,2 ordered=True", flush=True)
        $ print("ARITHMETIC_UI_VALUES inert=True text=True condition=True rendered_actions=True continuation=4", flush=True)
        exit

    testcase wrong_outcome:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic journey" timeout 10
        assert eval (trust == 26) timeout 1
        $ print("ARITHMETIC_UI_WRONG_ACCEPTED", flush=True)
        exit
