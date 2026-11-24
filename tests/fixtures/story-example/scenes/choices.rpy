label ${Choices}:
    "The tram pulls away."
    menu:
        mara "Where do you sit?"
        "By the window":
            "Rain streaks the glass."
            menu:
                "Watch the rain":
                    pass
                "Close your eyes":
                    pass
        "Near the door":
            pass
        "Show your pass" if (has_pass == True):
            "The driver nods."
            jump ${Variables}
        "Get off here":
            return
    menu:
        "Ask about the route":
            "Mara points at the map."
        "Check the timetable":
            "The next tram is tomorrow."
        "Pay the fare" if (fare >= 3.0):
            pass
        "Sit down":
            pass
    menu:
        "Wave to Eli":
            "Eli waves back."
        "Read the poster":
            pass
        "Peek at the driver" if (flag == False):
            pass
        "Move on":
            pass
    "The doors close."
    return
