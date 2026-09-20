screen route_status():
    frame:
        align (0.98, 0.02)
        padding (18, 12)

        vbox:
            spacing 4
            text "Route: [route]"
            text "Trust: [trust]"
            if heard_rooftop_news:
                text "News heard" color "#9ad1ff"
