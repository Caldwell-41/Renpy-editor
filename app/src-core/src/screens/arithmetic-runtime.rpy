
# Loomlight bounded numeric actions v1. Keep this adapter with its screen source.
init -100 python:
    class LL_NUMERIC:
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
            LL_NUMERIC.checked(kind, value)
            setattr(renpy.store, target, value)
            # Returning None keeps later actions and call-screen continuation intact.
