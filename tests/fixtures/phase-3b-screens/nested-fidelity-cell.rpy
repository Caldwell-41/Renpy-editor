# L19 second-level component. This source is evaluated only by the normal game.
screen nested_component_1():
    frame:
        id "first_cell"
        xsize 160
        ysize 90
        padding (9, 7)
        background "#34516c"
        hbox:
            id "cell_row"
            spacing 7
            add "images/ui nested_seal.png":
                id "seal"
                xsize 49
                ysize 63
            text "[nested_caption!q]":
                id "title"
                style "nested_body"
                xsize 78
