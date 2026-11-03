# L18 exact-source fixture. Never used by the historical L17 proof.
screen base_help_fidelity():
    fixed:
        frame:
            id "panel"
            xsize 620
            ysize 540
            xpos 0.5
            ypos 0.5
            xanchor 0.5
            yanchor 0.5
            padding (17, 23, 31, 29)
            background "#243148"
            vbox:
                id "group"
                spacing 13
                text "Help café. This paragraph wraps with a project font, a shared Style and a local size override.\nSecond paragraph.":
                    id "body"
                    style "base_help_body"
                    size 25
                    xsize 346
                    text_align 0.5
                    bold True
                    italic True
                add "images/ui base_help_seal.png":
                    id "seal"
                    xsize 113
                    ysize 57
                    xpos 0.75
                    xanchor 0.5
                textbutton "Close Help":
                    id "close"
                    style "base_help_button"
                    text_style "base_help_button"
                    padding (9, 6, 15, 10)
                    action Return()

screen base_help_anchors():
    fixed:
        frame:
            id "panel"
            xsize 500
            ysize 420
            xpos 0.75
            ypos 0.65
            xanchor 250
            yanchor 210
            left_padding 11
            right_padding 27
            top_padding 19
            bottom_padding 33
            background "#1c3041"
            fixed:
                id "group"
                text "An anchored caption wraps inside a bounded width.":
                    id "body"
                    style "base_help_body"
                    xsize 254
                    xpos 0.5
                    ypos 13
                    xanchor 0.5
                    text_align 1.0
                add "images/ui base_help_seal.png":
                    id "seal"
                    xsize 71
                    ysize 109
                    xpos 23
                    ypos 140
                textbutton "Close Help":
                    id "close"
                    style "base_help_button"
                    text_style "base_help_button"
                    xpos 0.9
                    ypos 0.9
                    xanchor 1.0
                    yanchor 1.0
                    padding (12, 7)
                    action Return()

style base_help_body is text:
    font "fonts/base_help_font.ttf"
    size 22
    color "#f1e3ce"

style base_help_button is button:
    font "fonts/base_help_font.ttf"
    size 23
    color "#eddfce"
    hover_color "#fcf7eb"
    background "#365478"
    hover_background "#69502d"
