init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

testsuite arithmetic_93:
    after testcase:
        exit

    testcase values:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (score == 36028797018963992) timeout 10
        assert eval (money == -15) timeout 10
        assert eval (remainder == -2) timeout 10
        assert eval (minimum == 0) timeout 10
        assert eval (opaque_neighbor == "kept") timeout 10
        $ print("ARITHMETIC_93_VALUES score=36028797018963992 money=-15 remainder=-2 minimum=0 opaque=kept", flush=True)
        advance until screen "main_menu"
        exit

    testcase wrong_outcome:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (money == -14) timeout 1
        $ print("ARITHMETIC_93_WRONG_ACCEPTED", flush=True)
        exit
