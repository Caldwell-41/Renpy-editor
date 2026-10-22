# Qualification instrumentation. Added only to an explicitly prepared scratch preview.
init python:
    _canvas_reference_phase = 0
    def _canvas_reference_capture():
        global _canvas_reference_phase
        phase = _canvas_reference_phase
        if phase == 2:
            config.screen_width, config.screen_height = 1024, 768
            renpy.display.interface.set_mode()
            renpy.set_physical_size((1024, 768))
            _canvas_reference_phase += 1
            renpy.restart_interaction()
            return
        if phase >= 5:
            return
        aspect = "1280x720" if phase < 2 else "1024x768"
        state = "normal" if phase in (0, 3) else "hover"
        button = renpy.get_displayable("loomlight_help", "help_button", base=True)
        if button is None:
            return
        button.set_style_prefix("idle_" if state == "normal" else "hover_", True)
        renpy.display.render.invalidate(button)
        screen = renpy.get_screen("loomlight_help")
        renpy.display.render.invalidate(screen)
        filename = "reference-" + aspect + "-" + state + ".png"
        renpy.render_to_file(screen, filename, resize=True)
        physical_filename = "reference-" + aspect + "-" + state + "-drawable.png"
        renpy.render_to_file(screen, physical_filename, resize=False)
        measured = {}
        for name in ("help_panel", "help_group", "help_text", "help_image", "help_button"):
            d = renpy.get_displayable("loomlight_help", name, base=True)
            r = renpy.render(d, config.screen_width, config.screen_height, 0, 0)
            measured[name] = list(r.get_size())
        print("CANVAS_REFERENCE " + __import__("json").dumps(dict(filename=filename, drawableFilename=physical_filename, aspect=[config.screen_width, config.screen_height], state=state, geometry=measured, menu=main_menu, renderer=renpy.get_renderer_info(), physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt, widgetSelection="base")), flush=True)
        _canvas_reference_phase += 1
    config.overlay_screens.append("loomlight_canvas_reference")
screen loomlight_canvas_reference():
    timer 0.3 repeat True action Function(_canvas_reference_capture)
