init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

testsuite arithmetic_92:
    after testcase:
        exit

    testcase values:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (score == 9007199254740994) timeout 10
        assert eval (money == 7) timeout 10
        assert eval (opaque_neighbor == "kept") timeout 10
        $ print("ARITHMETIC_92_VALUES score=9007199254740994 money=7 opaque=kept", flush=True)
        advance until screen "main_menu"
        exit

    testcase wrong_outcome:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (money == 8) timeout 1
        $ print("ARITHMETIC_92_WRONG_ACCEPTED", flush=True)
        exit
