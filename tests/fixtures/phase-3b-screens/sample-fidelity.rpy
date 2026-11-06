# L20 accepted-source fixture. Only the explicit normal-game proof executes this.
screen sample_fidelity():
    fixed:
        id "stage"
        text "Score [sample_score!q] / [flag!q]":
            id "numbers"
            xpos 40
            ypos 30
            font "fonts/sample_font.ttf"
            size 24
            color "#e8e0d0"
        text "[sample_caption!q]":
            id "caption"
            xpos 40
            ypos 80
            font "fonts/sample_font.ttf"
            size 20
            color "#c8d8e8"
        textbutton "Local [sample_score!q] coins": # loomlight-element: a1111111-1111-4111-8111-111111111111
            id "local_button"
            xpos 40
            ypos 140
            xsize 340
            ysize 64
            text_font "fonts/sample_font.ttf"
            text_size 24
            text_color "#e8e0d0"
            text_hover_color "#00ff00"
            text_selected_color "#ffdd00"
            text_insensitive_color "#999999"
            background "#243148"
            hover_background "#365478"
            selected_background "#69502d"
            insensitive_background "#222222"
            action SetVariable("sample_score", 7)
        textbutton "Shared appearance": # loomlight-element: a2222222-2222-4222-8222-222222222222
            id "shared_button"
            xpos 40
            ypos 230
            xsize 340
            ysize 64
            style "sample_button"
            text_style "sample_button"
            action NullAction()
        imagebutton: # loomlight-element: a3333333-3333-4333-8333-333333333333
            id "image_button"
            xpos 40
            ypos 320
            xsize 80
            ysize 40
            idle Transform("images/ui sample_state_0.png", xysize=(80, 40))
            hover Transform("images/ui sample_state_1.png", xysize=(80, 40))
            selected_idle Transform("images/ui sample_state_2.png", xysize=(80, 40))
            selected_hover Transform("images/ui sample_state_3.png", xysize=(80, 40))
            insensitive Transform("images/ui sample_state_4.png", xysize=(80, 40))
            selected_insensitive Transform("images/ui sample_state_5.png", xysize=(80, 40))
            action NullAction()
        bar: # loomlight-element: a4444444-4444-4444-8444-444444444444
            id "score_bar"
            xpos 40
            ypos 400
            xsize 340
            ysize 24
            value VariableValue("sample_score", min=-5, max=15, step=1, force_step=True)
            left_bar "#28783c"
            right_bar "#202830"
            thumb "#e0e0e0"
            hover_left_bar "#3c9c58"
            hover_thumb "#ffffff"
            selected_left_bar "#a07828"
            selected_thumb "#ffd060"
            insensitive_left_bar "#555555"

style sample_button is button:
    font "fonts/sample_font.ttf"
    size 23
    color "#eddfce"
    hover_color "#fcf7eb"
    selected_color "#f0cc60"
    insensitive_color "#888888"
    background "#365478"
    hover_background "#69502d"
    selected_background "#28783c"
    insensitive_background "#303030"
