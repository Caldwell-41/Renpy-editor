label ${Tram}:
    scene bg rainy_platform with dissolve
    play music music_theme
    show mara neutral at left
    mara "The last tram is late again."
    "Rain runs down the shelter glass."
    show mara smile with dissolve
    show mara at center
    show eli neutral at right with fade
    eli "Room for one more?"
    play sound sfx_bell
    show screen ticket_panel
    hide screen ticket_panel
    call screen fare_dialog
    with fade
    scene bg tram_interior with fade
    hide eli with dissolve
    stop music
    $ trust += 1
    jump ${Choices}
