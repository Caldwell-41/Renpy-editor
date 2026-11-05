# L19 reusable source. The two uses share styles, images and the project font.
screen nested_component_0():
    vbox:
        id "bundle"
        spacing 11
        xsize 390
        ymaximum 370
        grid 2 1:
            id "cells"
            spacing 9
            use nested_component_1 # @USE_CELL@
            frame:
                id "second_cell"
                xsize 160
                ysize 90
                padding (11, 7)
                background "#315943"
                text "A second grid cell wraps at its parent width":
                    id "cell_label"
                    style "nested_body"
                    xmaximum 138
        viewport:
            id "clip"
            xsize 330
            ysize 115
            fixed:
                id "overflow"
                xsize 440
                ysize 230
                frame:
                    id "overflow_panel"
                    xsize 440
                    ysize 230
                    padding (13, 9)
                    background "#542d55"
                    text "Stationary viewport at the top left":
                        id "visible_label"
                        style "nested_body"
                        xsize 410
                text "Outside the viewport opening":
                    id "hidden_label"
                    style "nested_body"
                    ypos 170
