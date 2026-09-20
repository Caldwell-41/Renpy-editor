# Crossroads at Sundown — synthetic integration fixture.

label start:
    scene expression Solid("#18202b")
    with fade

    show expression Text("ALEX", size=90, color="#9ad1ff") as alex at left
    show expression Text("MORGAN", size=90, color="#ffc38f") as morgan at right

    ar neutral "The transmitter is finally quiet."
    mv thoughtful "Campus trivia starts in twenty minutes."

    menu travel_choice:
        "Where should they go?"

        "Join the rooftop event":
            $ route = "rooftop"
            $ trust += 1
            jump scene_rooftop

        "Walk beside the river":
            $ route = "riverside"
            jump scene_riverside
