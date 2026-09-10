label scene_riverside:
    scene expression Solid("#173f46")
    with dissolve

    mv thoughtful "The river route is quieter."
    $ trust += fixture_route_bonus(route)
    $ time_of_day = "night"
    jump scene_platform
