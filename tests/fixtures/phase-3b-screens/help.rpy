# Fictional screen-source proof. Opaque regions must survive unchanged.
init python:
    screen_proof_neighbor = "kept exactly"

screen loomlight_help():
    modal True
    frame:
        id "help_panel"
        xsize 640  # Preserve this comment and the surrounding whitespace.
        ysize 360
        xalign 0.5
        yalign 0.5
        vbox:
            spacing 12
            text "Help café #1"
            add "help.png":
                xsize 96
                ysize 64
            textbutton "Close":
                action Return()
            if False:
                text "Opaque conditional neighbor"
