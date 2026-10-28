# Public numeric layout qualification fixture. No project code is imported.
screen numeric():
    fixed:
        id "root_layout"
        fixed:
            id "free"
            xpos 10
            ypos 20
            xsize 200
            ysize 100
            text "Free":
                id "free_text"
                xsize 100
                ysize 40
        frame:
            id "panel"
            xpos 0.5
            ypos 0.5
            xanchor 0.5
            yanchor 0.5
            xsize 300
            ysize 180
            padding (12, 18)
            text "Anchored":
                id "panel_text"
                xsize 180
                ysize 40
        frame:
            id "bounds"
            xpos 40
            ypos 50
            xminimum 240
            xmaximum 240
            yminimum 160
            ymaximum 160
            left_padding 12
            right_padding 12
            top_padding 18
            bottom_padding 18
            vbox:
                id "stack"
                xsize 100
                ysize 100
                spacing 8
                text "First":
                    id "caption"
                    xsize 80
                    ysize 40
                    xalign 0.5
                textbutton "Close":
                    id "action"
                    xsize 100
                    ysize 60
                    padding (0, 0)
                    action NullAction()
        add "assets/help.png":
            id "asset"
            xpos 1
            ypos 0.0
            xanchor 0
            yanchor 0
            xsize 64
            ysize 48
