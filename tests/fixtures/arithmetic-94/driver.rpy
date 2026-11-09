init -999 python:
    import os
    os.environ["SDL_AUDIODRIVER"] = "dummy"

testsuite arithmetic_94:
    after testcase:
        exit

    testcase values:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (type(score) is int and type(money) is int and type(remainder) is int and type(minimum) is int) timeout 10
        assert eval (score == 36028797018963992) timeout 10
        assert eval (money == -15) timeout 10
        assert eval (remainder == -2) timeout 10
        assert eval (minimum == 0) timeout 10
        assert eval (opaque_neighbor == "kept") timeout 10
        assert eval (type(fraction) is float and fraction == 2.5) timeout 10
        assert eval (type(quotient) is float and quotient.hex() == '0x1.5555555555556p+51') timeout 10
        assert eval (type(floorfloat) is float and floorfloat == 9.0) timeout 10
        assert eval (type(remfloat) is float and remfloat.hex() == '0x1.0000000000000p-54') timeout 10
        assert eval (type(widened) is float and widened == -3.0) timeout 10
        assert eval (type(mixed) is float and mixed == 9007199254740992.0) timeout 10
        assert eval (type(signedzero) is float and signedzero.hex() == '-0x0.0p+0') timeout 10
        assert eval (type(subnormal) is float and subnormal.hex() == '0x0.0000000000001p-1022') timeout 10
        assert eval (9007199254740993 > 9007199254740992.0 and 9007199254740993 != 9007199254740992.0) timeout 10
        assert eval (9223372036854775807 < 9223372036854775808.0 and -9223372036854775808 == -9223372036854775808.0) timeout 10
        assert eval (numeric_branch is True) timeout 10
        assert "Fraction 2.5" timeout 10
        assert eval (renpy.substitute("Fraction [fraction!q]", scope={"fraction": 1e-7}) == "Fraction 1e-07") timeout 10
        $ print("ARITHMETIC_94_NUMERIC quotient=0x1.5555555555556p+51 floor=9.0 remainder=0x1.0000000000000p-54 widened=float:-3.0 mixed=float:9007199254740992.0 zero=-0x0.0p+0 subnormal=0x0.0000000000001p-1022 default=float:2.5 comparisons=True text=Fraction_2.5 sample=Fraction_1e-07", flush=True)
        $ renpy.hide_screen("arithmetic_decimal_text")
        $ print("ARITHMETIC_94_VALUES score=36028797018963992 money=-15 remainder=-2 minimum=0 opaque=kept", flush=True)
        advance until screen "main_menu"
        exit

    testcase wrong_outcome:
        assert screen "main_menu" timeout 10
        click "Start"
        assert "Arithmetic accepted" timeout 10
        assert eval (money == -14) timeout 1
        $ print("ARITHMETIC_94_WRONG_ACCEPTED", flush=True)
        exit
