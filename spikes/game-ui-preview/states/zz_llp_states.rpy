# Test screens and styles for #216. The driver copies this file into the
# generated project. Throwaway, never merged.

# The game-wide look. It sets a value for each state with a prefixed property,
# as gui.text_properties("button") does in a stock project.
style button:
    idle_background "#202020"
    hover_background "#006000"
    selected_background "#000060"
    insensitive_background "#101010"

style button_text:
    idle_color "#808080"
    hover_color "#00ff00"
    selected_color "#0000ff"
    insensitive_color "#404040"

# Look groups. A group is a style prefix, as "navigation" is in a stock project.
# T0 and B0 have no own value.
style llp_t0_button is button
style llp_t0_button_text is button_text

# Case 1: the group has an unprefixed own value.
style llp_t1_button is button
style llp_t1_button_text is button_text:
    color "#ff0000"

# Case 3: the group has an own value with the idle_ prefix.
style llp_t3_button is button
style llp_t3_button_text is button_text:
    idle_color "#ff0000"

# The group has an own Idle value and an own Hover value. Hover comes first in
# the source, to show that the order of the lines does not matter.
style llp_t5_button is button
style llp_t5_button_text is button_text:
    hover_color "#ffff00"
    color "#ff0000"

# The group has an own Hover value only. T6 adds an own Idle value on the button.
style llp_t6_button is button
style llp_t6_button_text is button_text:
    hover_color "#ffff00"

style llp_b0_button is button
style llp_b0_button_text is button_text

style llp_b1_button is button:
    background "#800000"
style llp_b1_button_text is button_text

style llp_b3_button is button:
    idle_background "#800000"
style llp_b3_button_text is button_text

style llp_b5_button is button:
    hover_background "#808000"
    background "#800000"
style llp_b5_button_text is button_text

style llp_b6_button is button:
    hover_background "#808000"
style llp_b6_button_text is button_text

screen llp_states(sel=None, sens=None):
    add Solid("#000000")
    vbox:
        pos (40, 20)
        spacing 8
        vbox:
            style_prefix "llp_t0"
            textbutton "T0 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_t1"
            textbutton "T1 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_t0"
            textbutton "T2 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) text_color "#ff0000"
        vbox:
            style_prefix "llp_t3"
            textbutton "T3a HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_t0"
            textbutton "T3b HHH" action NullAction() selected sel sensitive sens xysize (380, 80) text_idle_color "#ff0000"
        vbox:
            style_prefix "llp_t5"
            textbutton "T5 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_t6"
            textbutton "T6 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) text_color "#ff0000"
        vbox:
            style_prefix "llp_t1"
            textbutton "T7 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) text_hover_color "#ffff00"
    vbox:
        pos (500, 20)
        spacing 8
        vbox:
            style_prefix "llp_b0"
            textbutton "B0 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_b1"
            textbutton "B1 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_b0"
            textbutton "B2 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) background "#800000"
        vbox:
            style_prefix "llp_b3"
            textbutton "B3a HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_b0"
            textbutton "B3b HHH" action NullAction() selected sel sensitive sens xysize (380, 80) idle_background "#800000"
        vbox:
            style_prefix "llp_b5"
            textbutton "B5 HHH" action NullAction() selected sel sensitive sens xysize (380, 80)
        vbox:
            style_prefix "llp_b6"
            textbutton "B6 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) background "#800000"
        vbox:
            style_prefix "llp_b1"
            textbutton "B7 HHH" action NullAction() selected sel sensitive sens xysize (380, 80) hover_background "#808000"

# Case 5. One look group with a different text color and background in every state.
style llp_f_button is button:
    idle_background "#301000"
    hover_background "#a04000"
    selected_idle_background "#003060"
    selected_hover_background "#0070c0"
    insensitive_background "#303030"
style llp_f_button_text is button_text:
    idle_color "#c0c0c0"
    hover_color "#ffffff"
    selected_idle_color "#ffd000"
    selected_hover_color "#fff0a0"
    insensitive_color "#707070"

transform llp_lift:
    on hover:
        linear 0.1 yoffset -12
    on idle:
        linear 0.1 yoffset 0

# sel and sens name the one button that is selected or disabled for real.
screen llp_force(sel=0, sens=0):
    add Solid("#000000")
    vbox:
        style_prefix "llp_f"
        pos (40, 20)
        spacing 8
        textbutton "F1 HHH" action NullAction() selected (sel == 1) sensitive (sens != 1) xysize (380, 80)
        textbutton "F2 HHH" action NullAction() xysize (380, 80)
        textbutton "F3 HHH" action NullAction() xysize (380, 80)
    vbox:
        style_prefix "llp_f"
        pos (500, 120)
        textbutton "F4 HHH" action NullAction() xysize (380, 80) at llp_lift
