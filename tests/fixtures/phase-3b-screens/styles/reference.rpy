# Independent literal reference for L07 source produced through public requests.
screen style_reference():
    frame:
        id "panel"
        xpos 40
        ypos 40
        xsize 500
        ysize 300
        background "#123456"
        foreground Frame(Composite((6, 6), (0, 0), Transform(Solid("#abcdef"), xysize=(6, 2)), (0, 4), Transform(Solid("#abcdef"), xysize=(6, 2)), (0, 2), Transform(Solid("#abcdef"), xysize=(2, 2)), (4, 2), Transform(Solid("#abcdef"), xysize=(2, 2))), 2, 2)
        text "Choose a route. The last tram leaves at midnight.":
            id "body"
            xpos 20
            ypos 20
            xsize 400
            font "fonts/style_font.ttf"
            size BODY_SIZE
            color "#ace"
            text_align 0.5
            bold True
            italic True
    textbutton "Continue":
        id "button"
        action NullAction()
        xpos 600
        ypos 100
        xsize 240
        ysize 60
        text_style "text"
        text_size 24
        text_color "#ffeecc"
        text_text_align 0.5
        text_bold False
        text_italic False
        background "#234567"
        foreground Frame(Composite((4, 4), (0, 0), Transform(Solid("#fedcba"), xysize=(4, 1)), (0, 3), Transform(Solid("#fedcba"), xysize=(4, 1)), (0, 1), Transform(Solid("#fedcba"), xysize=(1, 2)), (3, 1), Transform(Solid("#fedcba"), xysize=(1, 2))), 1, 1)
        text_hover_color "#ffffff"
        hover_background "#345678"
        hover_foreground Frame(Composite((8, 8), (0, 0), Transform(Solid("#ffaa00"), xysize=(8, 3)), (0, 5), Transform(Solid("#ffaa00"), xysize=(8, 3)), (0, 3), Transform(Solid("#ffaa00"), xysize=(3, 2)), (5, 3), Transform(Solid("#ffaa00"), xysize=(3, 2))), 3, 3)
        text_selected_color "#ccffff"
        selected_background "#456789"
        text_insensitive_color "#888888"
        insensitive_background "#222222"

screen style_other_reference():
    text "Choose a route. The last tram leaves at midnight.":
        id "body"
        xpos 100
        ypos 100
        xsize 400
        font "fonts/style_font.ttf"
        size 32
        color "#ace"
        text_align 0.5
        bold True
        italic True
