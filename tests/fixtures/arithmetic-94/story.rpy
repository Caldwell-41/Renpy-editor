label scene_one:
    $ score = 9007199254740993
    $ bonus = 3
    $ score *= 2 # compound operand is edited
    $ score = score - 1 # explicit formula is edited
    $ money = -7
    $ money //= bonus
    $ remainder = 7 % -3
    $ minimum = -9223372036854775808
    $ minimum %= -1
    if bonus > 0:
        $ money = money * (bonus + 1) # nested formula is edited
    python:
        opaque_neighbor = "kept"
    if score > 9007199254740992.0:
        $ numeric_branch = True
    show screen arithmetic_decimal_text
    "Arithmetic accepted"
    return
