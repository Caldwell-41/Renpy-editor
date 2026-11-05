# L19 accepted-source fixture. Ownership markers are supplied by the exporter.
screen nested_fidelity():
    fixed:
        id "stage"
        window:
            id "outer"
            xsize 900
            ysize 440
            align (0.5, 0.5)
            padding (19, 23, 29, 31)
            background "#182839"
            hbox:
                id "row"
                spacing 17
                use nested_component_0 # @USE_FIRST@
                use nested_component_0 # @USE_SECOND@
        frame:
            id "front"
            xpos 0.5
            ypos 0.5
            xanchor 0.5
            yanchor 0.5
            xsize 180
            ysize 65
            padding (7, 9)
            background "#bb6428"
            text "Later sibling in front":
                id "front_label"
                style "nested_body"
                size 18
                xsize 150

style nested_body is text:
    font "fonts/nested_font.ttf"
    size 20
    color "#eee2cc"
