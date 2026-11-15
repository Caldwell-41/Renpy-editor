label ${Code}:
    "The driver hums along to the radio."
    $ tram_number = 40
    python:
        late_minutes = 7
    menu:
        "Ring the bell":
            "Ding."
            return "rang"
        "Stay quiet":
            pass
    menu:
        "Hold the door" if custom_check():
            pass
        "Let it close":
            pass
    if trust in (1, 2):
        "Unsupported test"
    if missing_flag == 4:
        "Missing Variable route"
    elif mood:
        "Mismatched Variable route"
    "End of the line."
    return
