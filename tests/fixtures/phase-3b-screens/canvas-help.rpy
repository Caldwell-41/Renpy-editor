# Public representative composition. Actions run only in deliberate preview.
screen loomlight_help():
    fixed:
        frame:
            id "help_panel"
            xsize 640
            ysize 360
            xalign 0.5
            yalign 0.5
            padding (24, 24)
            background "#202938"
            vbox:
                id "help_group"
                spacing 12
                text "Help café. This deliberately narrow paragraph wraps across several lines.":
                    id "help_text"
                    font "assets/canvas.ttf"
                    size 24
                    color "#f4e4d0"
                    xsize 360
                add "assets/help.png":
                    id "help_image"
                    xsize 64
                    ysize 48
                textbutton "Close Help":
                    id "help_button"
                    text_font "assets/canvas.ttf"
                    text_size 24
                    text_color "#f4e4d0"
                    background "#3a5068"
                    hover_background "#6b4d28"
                    padding (8, 8)
                    action Return()
