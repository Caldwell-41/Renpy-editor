# loomlight-screen: 07732fb0-88ac-4f90-a29c-fb04b2905d6e
screen arithmetic_dialog():
    modal True
    key "game_menu" action Return()
    pass
    text "Balance: [money!q]" # loomlight-element: e34c1029-2fc1-4dd5-89b8-3b44589b8433
    textbutton "Continue": # loomlight-element: cdb4beb8-2dfb-4071-add9-29f9ef86eb11
        action [Function(_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.assign, "money", "decimal", "remainder", "(9.5 + 0.5) / 4", lambda: _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", money)) % (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", 9.5)) + (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", 0.5)))) / (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", 4)))))), Function(_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.assign, "reward", "int", "assign", "trust * 2", lambda: _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", trust)) * (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", 2)))), Return()]
    textbutton "Protected": # loomlight-element: 9da3fabf-7b5b-4774-8512-4715bd6bc479
        action SetVariable("trust", trust + 1)
    imagebutton: # loomlight-element: 5eca578f-8fa7-4e6d-9c1a-1a0d20a0c5be
        xsize 240
        ysize 64
        idle Transform("images/ui station_seal.png", xysize=(240, 64))
        action [Function(_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.assign, "trust", "int", "add", "bonus", lambda: _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", trust)) + (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", bonus)))), Function(_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.assign, "reward", "int", "assign", "trust * 2", lambda: _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", trust)) * (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("int", 2)))), Return()]
    imagebutton: # loomlight-element: e67ff514-3533-407a-a179-b0771053aee3
        xpos 23
        xsize 280
        ysize 64
        idle Transform("images/ui station_seal.png", xysize=(280, 64))
        action Function(_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.assign, "money", "decimal", "divide", "2.0", lambda: _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", money)) / (_ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked("decimal", 2.0))))

# Loomlight bounded numeric actions v1. Keep this adapter with its screen source.
init -100 python:
    class _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e:
        @staticmethod
        def checked(kind, value):
            import math
            if kind == "int":
                if type(value) is not int:
                    raise ArithmeticError("Loomlight arithmetic: incompatibleOperand")
                if not -9223372036854775808 <= value <= 9223372036854775807:
                    raise ArithmeticError("Loomlight arithmetic: integerOverflow")
            else:
                if type(value) not in (int, float):
                    raise ArithmeticError("Loomlight arithmetic: incompatibleOperand")
                if not math.isfinite(value):
                    raise ArithmeticError("Loomlight arithmetic: nonFiniteResult")
            return value

        @staticmethod
        def assign(target, kind, operation, operand, compute):
            value = compute()
            if kind == "decimal":
                value = float(value)
            _ll_numeric_07732fb088ac4f90a29cfb04b2905d6e.checked(kind, value)
            setattr(renpy.store, target, value)
            # Returning None keeps later actions and call-screen continuation intact.
# competing accepted Source
