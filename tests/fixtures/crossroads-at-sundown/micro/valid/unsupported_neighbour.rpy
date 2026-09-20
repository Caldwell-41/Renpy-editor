label unsupported_neighbour:
    ar "Supported dialogue before opaque code."

    python:
        payload = {
            "keep_spacing" :  True,
            "nested": [1, 2, {"value": "unchanged"}],
        }
        renpy.log(repr(payload))

    ar "Supported dialogue after opaque code."
    return
