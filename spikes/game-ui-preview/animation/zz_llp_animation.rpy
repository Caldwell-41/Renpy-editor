# Test screens for the six inferences of #213. The driver copies this file into
# the generated project. Throwaway, never merged. A trailing "# @NAME" names an
# element for the driver.

# Preset 2 of #196, with an "on show" and an "on hide" block. Inference 1 names it.
transform ll_fade(in_time=0.25, out_time=0.25):
    on show:
        alpha 0.0
        linear in_time alpha 1.0
    on hide:
        linear out_time alpha 0.0

# An entrance that runs only when the "show" event arrives.
transform llp_on_show(duration=0.3):
    on show:
        alpha 0.0
        linear duration alpha 1.0

# The form that #196 calls unsafe: one transform handles show and hover.
transform llp_one(duration=1.0):
    on show:
        alpha 0.0
        linear duration alpha 1.0
    on hover:
        easein 0.12 yoffset -4
    on idle:
        easein 0.12 yoffset 0

# Inference 1. Each button fades in for 1 s and has a hover lift.
screen llp_m1():
    add Solid("#000000")
    textbutton "A1 HHH" action NullAction() pos (40, 40) xysize (380, 80) background "#c06000" at ll_fade(1.0), ll_hover_lift  # @A1
    textbutton "A2 HHH" action NullAction() pos (40, 200) xysize (380, 80) background "#c06000" at ll_fade_in(1.0), ll_hover_lift  # @A2
    textbutton "A3 HHH" action NullAction() pos (40, 360) xysize (380, 80) background "#c06000" at llp_one(1.0)  # @A3
    textbutton "A4 HHH" action NullAction() pos (40, 520) xysize (380, 80) background "#c06000" at ll_hover_lift, ll_fade(1.0)  # @A4

# Inference 1, the order of the list. Each entrance lasts 0.3 s. The test
# hovers a button after its entrance has ended.
screen llp_m1b():
    add Solid("#000000")
    textbutton "B1 HHH" action NullAction() pos (40, 40) xysize (380, 80) background "#c06000" at ll_fade_in(0.3), ll_hover_lift  # @B1
    textbutton "B2 HHH" action NullAction() pos (40, 200) xysize (380, 80) background "#c06000" at ll_hover_lift, ll_fade_in(0.3)  # @B2
    textbutton "B3 HHH" action NullAction() pos (40, 360) xysize (380, 80) background "#c06000" at ll_fade(0.3), ll_hover_lift  # @B3
    textbutton "B4 HHH" action NullAction() pos (40, 520) xysize (380, 80) background "#c06000" at ll_hover_lift, ll_fade(0.3)  # @B4
    textbutton "B5 HHH" action NullAction() pos (40, 680) xysize (380, 80) background "#c06000" at ll_hover_lift  # @B5

# Inference 3. A zoom on a button in a box, and on buttons with other anchors.
screen llp_m3():
    add Solid("#000000")
    vbox:
        pos (40, 40)
        spacing 10
        textbutton "G1 HHH" action NullAction() xysize (380, 80) background "#800000"  # @G1
        textbutton "G2 HHH" action NullAction() xysize (380, 80) background "#008000" at ll_hover_grow  # @G2
        textbutton "G3 HHH" action NullAction() xysize (380, 80) background "#000080"  # @G3
    hbox:
        pos (500, 40)
        spacing 10
        textbutton "H1" action NullAction() xysize (200, 80) background "#804000"  # @H1
        textbutton "H2" action NullAction() xysize (200, 80) background "#408000" at ll_hover_grow  # @H2
        textbutton "H3" action NullAction() xysize (200, 80) background "#004080"  # @H3
    textbutton "G4 HHH" action NullAction() xysize (380, 80) background "#808000" xalign 0.5 ypos 400 at ll_hover_grow  # @G4
    textbutton "G5 HHH" action NullAction() xysize (380, 80) background "#800080" xalign 1.0 yalign 1.0 at ll_hover_grow  # @G5
    vbox:
        pos (40, 600)
        spacing 10
        textbutton "P1 HHH" action NullAction() xysize (380, 80) background "#008080"  # @P1
        textbutton "P2 HHH" action NullAction() xysize (380, 80) background "#ff00ff" at ll_pop(0.3)  # @P2
        textbutton "P3 HHH" action NullAction() xysize (380, 80) background "#606060"  # @P3

# Inference 4. A hover lift of 4 pixels, and one of 12 pixels to compare.
screen llp_m4():
    add Solid("#000000")
    textbutton "L4 HHH" action NullAction() pos (40, 40) xysize (380, 80) background "#c06000" at ll_hover_lift  # @L4
    textbutton "L12 HHH" action NullAction() pos (40, 300) xysize (380, 80) background "#c06000" at ll_hover_lift(0.12, -12)  # @L12

# Inference 5. A screen that stays up while the player skips. Both entrances last 3 s.
screen llp_m5_hud():
    textbutton "U1" action NullAction() pos (1500, 20) xysize (120, 60) background "#ff00ff" at ll_fade_in(3.0)  # @U1
    textbutton "U2" action NullAction() pos (1640, 20) xysize (120, 60) background "#00ffff" at llp_on_show(3.0)  # @U2

# Inference 6. Where the "show" event arrives. K4 is nested in a box, as a control.
screen llp_m6_part(flag=True):
    textbutton "K3" action NullAction() pos (320, 40) xysize (120, 80) background "#0000ff" at llp_on_show(1.0)  # @K3
    if flag:
        textbutton "K5" action NullAction() pos (600, 40) xysize (120, 80) background "#00ffff" at llp_on_show(1.0)  # @K5

screen llp_m6_wrap():
    transclude

screen llp_m6(flag=True):
    add Solid("#000000")
    textbutton "K1" action NullAction() pos (40, 40) xysize (120, 80) background "#ff0000" at llp_on_show(1.0)  # @K1
    if flag:
        textbutton "K2" action NullAction() pos (180, 40) xysize (120, 80) background "#00ff00" at llp_on_show(1.0)  # @K2
    use llp_m6_part(flag)
    vbox:
        pos (460, 40)
        textbutton "K4" action NullAction() xysize (120, 80) background "#ffff00" at llp_on_show(1.0)  # @K4
    use llp_m6_wrap:
        textbutton "K6" action NullAction() pos (740, 40) xysize (120, 80) background "#ff00ff" at llp_on_show(1.0)  # @K6
