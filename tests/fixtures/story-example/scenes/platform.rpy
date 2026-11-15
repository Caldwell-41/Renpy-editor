label ${Platform}:
    # exact opaque neighbor and nested source survive visual edit
    python:
        opaque_neighbor = "kept"
    if flag:
        if trust >= 5 and mood == "ready" and precision == 9007199254740993:
            # nested comment retained café 雪
            bec "Deep original"
        elif trust == 4:
            bec "Boundary branch"
        else:
            bec "Other nested branch"
    else:
        bec "Low branch"
    "Caller resumed"
    menu:
        "Ready route" if trust >= 5:
            jump ${High ending}
        "Low route" if trust >= 0 and trust < 5:
            jump ${Low ending}
    "Nothing available"
    return
