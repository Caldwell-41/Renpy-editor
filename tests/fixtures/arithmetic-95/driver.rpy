init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

    def _arithmetic_95_invalid():
        saved = renpy.store.trust
        renpy.store.trust = 9223372036854775807
        try:
            renpy.run(renpy.get_displayable("arithmetic_clicks", "arithmetic_image").action)
        except ArithmeticError as error:
            return "integerOverflow" in str(error) and renpy.store.trust == 9223372036854775807
        finally:
            renpy.store.trust = saved
        return False

testsuite arithmetic_95:
    after testcase:
        exit

    testcase values:
        assert screen "main_menu" timeout 10
        $ renpy.start_predict_screen("arithmetic_clicks")
        pause 0.2
        assert eval (trust == 5 and reward == 0 and points == 0 and fraction == 8.0)
        click "Start"
        assert screen "arithmetic_clicks" timeout 10
        # Nonfocusable caption. Use the actual screen displayable, per H69.
        assert eval ("5" in renpy.get_screen("arithmetic_clicks")._tts_all(False))
        $ renpy.restart_interaction()
        pause 0.2
        assert eval (trust == 5 and reward == 0 and points == 0 and continuations == 0)
        assert eval (renpy.is_selected(renpy.get_displayable("arithmetic_clicks", "arithmetic_image").action) is False)
        $ renpy.display.behavior.predict_action(renpy.get_displayable("arithmetic_clicks", "arithmetic_image").action)
        assert eval (trust == 5 and reward == 0 and points == 0)
        click "Calculate"
        assert eval (trust == 6 and reward == 12 and points == 2 and fraction == 4.0) timeout 10
        $ print("ARITHMETIC_95_FIRST 6/12 points=2 fraction=4.0", flush=True)
        click "Calculate"
        assert eval (trust == 7 and reward == 14 and points == 4 and fraction == 2.0) timeout 10
        $ print("ARITHMETIC_95_SECOND 7/14 points=4 fraction=2.0", flush=True)
        click "Change operand"
        assert eval (bonus == 5) timeout 10
        keysym "K_RETURN" "Calculate"
        assert eval (trust == 8 and reward == 16 and points == 9 and fraction == 1.0) timeout 10
        click screen "arithmetic_clicks" id "arithmetic_image"
        assert eval (trust == 9 and reward == 18 and points == 14 and fraction == 0.5) timeout 10
        keysym "K_RETURN" screen "arithmetic_clicks" id "arithmetic_image"
        assert eval (trust == 10 and reward == 20 and points == 19 and fraction == 0.25) timeout 10
        assert eval (type(trust) is int and type(reward) is int and type(points) is int)
        assert eval (type(fraction) is float and type(widened) is float and widened == 2.0)
        assert eval (type(floor_value) is int and floor_value == -3 and type(remainder_value) is int and remainder_value == 2)
        assert eval (type(precise) is int and precise == 9007199254740993)
        assert eval (_arithmetic_95_invalid())
        assert eval (trust == 10 and reward == 20 and points == 19)
        assert eval (continuations == 0)
        $ print("ARITHMETIC_95_CURRENT trust=10 reward=20 points=19 fraction=0.25 floor=-3 remainder=2 precise=9007199254740993 widened=float:2.0", flush=True)
        click "Finish"
        assert "Arithmetic complete" timeout 10
        assert eval (continuations == 1)
        $ print("ARITHMETIC_95_VALUES inert=True click=True keyboard=True textbutton=True imagebutton=True continuation=1", flush=True)
        exit

    testcase wrong_outcome:
        assert screen "main_menu" timeout 10
        click "Start"
        assert screen "arithmetic_clicks" timeout 10
        click "Calculate"
        assert eval (reward == 10) timeout 1
        $ print("ARITHMETIC_95_WRONG_ACCEPTED", flush=True)
        exit
