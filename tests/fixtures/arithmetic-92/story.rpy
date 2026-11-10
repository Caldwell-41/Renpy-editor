label scene_one:
    $ score = 9007199254740993
    $ score += +2 # compound stays byte-identical
    $ score = score - 1 # explicit operand is edited
    python:
        opaque_neighbor = "kept"
    $ money = 10
    "Arithmetic accepted"
    return
