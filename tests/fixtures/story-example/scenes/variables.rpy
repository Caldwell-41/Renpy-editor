label ${Variables}:
    $ has_pass = True
    $ mood = "tired"
    $ trust = trust * 2 - 3
    $ trust %= 4
    $ precision = 9223372036854775807
    $ fare += 0.25
    $ fare //= 1
    $ fare *= 1.5
    if (has_pass == True):
        "The pass is ready."
    else:
        "No pass yet."
    return
