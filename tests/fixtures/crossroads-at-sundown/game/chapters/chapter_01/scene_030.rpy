label scene_platform:
    scene expression Solid("#252525")
    show screen route_status

    if trust >= 1:
        ar pleased "Same plan next week?"
        $ persistent.shared_plan_unlocked = True
        jump ending_shared
    else:
        mv neutral "I think we take different trams from here."
        jump ending_separate

label ending_shared:
    "They leave with a plan."
    return

label ending_separate:
    "They leave by separate exits."
    return
