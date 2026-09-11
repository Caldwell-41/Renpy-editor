# Synthetic Phase 0 desktop-shell fixture.
define guide = Character("Guide")

label start:
    scene black
    guide "A normal Ren'Py file remains authoritative."
    menu:
        "Continue":
            jump ending

label ending:
    return
