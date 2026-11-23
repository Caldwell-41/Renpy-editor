# The file of preset definitions that Loomlight would write once into a
# project (#203). The first parameter of each transform is Duration, the one
# setting that the panel has. Throwaway copy for #213, never merged.

transform ll_fade_in(duration=0.25):
    alpha 0.0
    linear duration alpha 1.0

transform ll_slide_up(duration=0.3, distance=40):
    yoffset distance
    alpha 0.0
    easein duration yoffset 0 alpha 1.0

transform ll_slide_left(duration=0.3, distance=60):
    xoffset (-distance)
    alpha 0.0
    easein duration xoffset 0 alpha 1.0

transform ll_slide_right(duration=0.3, distance=60):
    xoffset distance
    alpha 0.0
    easein duration xoffset 0 alpha 1.0

transform ll_pop(duration=0.25):
    zoom 0.85
    alpha 0.0
    parallel:
        easein_back duration zoom 1.0
    parallel:
        linear (duration * 0.6) alpha 1.0

transform ll_hover_lift(duration=0.12, dy=-4):
    on hover:
        easein duration yoffset dy
    on idle:
        easein duration yoffset 0

transform ll_hover_grow(duration=0.12, scale=1.05):
    on hover:
        easein duration zoom scale
    on idle:
        easein duration zoom 1.0

transform ll_hover_brighten(duration=0.12, amount=0.15):
    matrixcolor BrightnessMatrix(0.0)
    on hover:
        linear duration matrixcolor BrightnessMatrix(amount)
    on idle:
        linear duration matrixcolor BrightnessMatrix(0.0)
