# Public synthetic fixture. Each runtime id is read-only source instrumentation.
screen nested():
    window:
        id "outer"
        xsize 600
        ysize 320
        align (0.5, 0.5)
        padding (10, 10)
        background "#202938"
        hbox:
            id "row"
            spacing 10
            grid 2 2:
                id "cells"
                allow_underfull True
                spacing 4
                frame:
                    id "one"
                    xsize 80
                    ysize 50
                    padding (0, 0)
                    background "#446688"
                    text "One"
                frame:
                    id "two"
                    xsize 80
                    ysize 50
                    padding (0, 0)
                    background "#668844"
                    text "Two"
                frame:
                    id "three"
                    xsize 80
                    ysize 50
                    padding (0, 0)
                    background "#886644"
                    text "Three"
            viewport:
                id "clip"
                xsize 180
                ysize 80
                fixed:
                    id "content"
                    xsize 300
                    ysize 200
                    frame:
                        id "overflow"
                        xsize 300
                        ysize 200
                        padding (0, 0)
                        background "#aa2244"
                        text "Clipped content"
                    text "Hidden below opening":
                        ypos 150
