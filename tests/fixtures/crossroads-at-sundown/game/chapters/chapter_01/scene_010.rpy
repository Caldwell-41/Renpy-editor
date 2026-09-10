label scene_rooftop:
    scene expression Solid("#402c5a")
    with dissolve

    call rooftop_briefing
    $ heard_rooftop_news = True
    $ time_of_day = "night"
    jump scene_platform

label rooftop_briefing:
    mv pleased "You can see the whole city from here."
    ar amused "And exactly none of the quiz answers."
    return
