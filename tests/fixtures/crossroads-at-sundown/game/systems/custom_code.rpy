# This Python is valid project code but opaque to the Phase 0 visual model.
init python:
    def fixture_route_bonus(selected_route):
        if selected_route == "riverside":
            return 1
        return 0

label custom_code_boundary:
    $ diagnostic_value = {"route": route, "trust": trust}
    "The dictionary expression must remain exactly where it was authored."
    return
