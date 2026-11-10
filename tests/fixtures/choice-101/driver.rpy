# Fixture presentation only. The Story bytes come from production UI/core authoring.
define config.name = "Choice body qualification"
define config.screen_width = 1280
define config.screen_height = 720
define config.save_directory = None
define config.default_text_cps = 0

default choice_flag = False
default choice_visits = 0

init python:
    # The menu resets store variables after an uncaught Return. Observe the
    # actual saved-source Return before that reset, outside the store being reset.
    renpy._choice101_return_flags = []
    def _choice101_statement(name):
        if name == "return" and renpy.get_filename_line()[0].endswith("story.rpy"):
            renpy._choice101_return_flags.append(bool(renpy.store.choice_flag))
    config.statement_callbacks.append(_choice101_statement)

    def _choice103_visible_prompt(who, what):
        # Text selectors search focus targets. Noninteracting menu dialogue has
        # no dialogue-advance focus, so inspect the displayed say widget itself.
        say = renpy.get_screen("say")
        widget = renpy.get_displayable("say", "what")
        if say is None or widget is None or (renpy.get_screen("choice") is None and renpy.get_screen("_ll_choice_v1") is None):
            return False
        rendered = renpy.test.testfocus.focus_from_displayable(widget)
        return (say.scope["who"] == who and say.scope["what"] == what
                and what in widget._tts_all(False)
                and rendered is not None and rendered.w > 0 and rendered.h > 0)


    def _choice104_locked_render():
        screen = renpy.get_screen("_ll_choice_v1")
        if screen is None:
            return None
        widgets = []
        screen.visit_all(widgets.append)
        for widget in widgets:
            if isinstance(widget, renpy.text.text.Text) and widget._tts_all(False).strip() == "Locked":
                rendered = renpy.test.testfocus.focus_from_displayable(widget)
                if rendered is not None and rendered.w > 0 and rendered.h > 0:
                    return rendered
        return None

    def _choice104_locked_pos():
        rendered = _choice104_locked_render()
        return (int(rendered.x + rendered.w / 2), int(rendered.y + rendered.h / 2))

    def _choice104_mixed():
        screen = renpy.get_screen("_ll_choice_v1")
        if screen is None or _choice104_locked_render() is None:
            return False
        items = screen.scope["items"]
        # Retain real native actions to inspect picks after this interaction ends.
        renpy._choice104_items = items
        return ([i.caption for i in items] == ["Locked", "Available"]
                and all(isinstance(i.action, renpy.ui.ChoiceReturn) for i in items)
                and renpy.test.testfocus.find_focus("Locked", False) is None
                and renpy.test.testfocus.find_focus("Available", False) is not None
                and not any(i.action.get_chosen() for i in items))


screen choice_body_main_menu():
    textbutton "Start" action Start()

label main_menu:
    call screen choice_body_main_menu
    return

screen say(who, what):
    window:
        yalign 1.0
        if who is not None:
            text who id "who"
        text what id "what"

style choice_vbox is vbox
style choice_button is button
style choice_button_text is button_text

screen choice(items):
    style_prefix "choice"

    vbox:
        for i in items:
            textbutton i.caption action i.action

testsuite choice_body:
    after testcase:
        exit

    testcase yes:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes"
        assert "Shared once" timeout 10
        assert eval (choice_flag is True)
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_101_YES flag=True shared=1", flush=True)
        exit

    testcase no:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "No"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False)
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_101_NO flag=False shared=1", flush=True)
        exit

    testcase return_option:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes"
        assert screen "choice_body_main_menu" timeout 10
        assert eval (renpy._choice101_return_flags == [True])
        $ print("CHOICE_101_RETURN caller=none shared=0", flush=True)
        exit

    testcase jump_option:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes"
        assert "Transferred" timeout 10
        assert eval (choice_flag is True)
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_101_JUMP target=1 shared=0", flush=True)
        exit

    testcase wrong_outcome:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False) timeout 1
        $ print("CHOICE_101_WRONG_ACCEPTED", flush=True)
        exit

    testcase return_to_caller:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes"
        assert "Caller resumed" timeout 10
        assert eval (choice_flag is True and renpy._choice101_return_flags == [True])
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_101_RETURN caller=resumed shared=0", flush=True)
        exit

    testcase nested_normal:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes, please"
        assert "Before call" timeout 10
        keysym "K_RETURN"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert "Resume inside option" timeout 10
        keysym "K_RETURN"
        assert screen "choice" timeout 10
        click "Inner normal"
        assert "Inside inner" timeout 10
        keysym "K_RETURN"
        assert "After nested" timeout 10
        keysym "K_RETURN"
        assert "Shared once" timeout 10
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_102_NORMAL call=returned inner=joined outer=joined", flush=True)
        exit

    testcase nested_jump:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes, please"
        assert "Before call" timeout 10
        keysym "K_RETURN"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert "Resume inside option" timeout 10
        keysym "K_RETURN"
        assert screen "choice" timeout 10
        click "Inner jump"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_102_JUMP target=entered shared=0", flush=True)
        exit

    testcase nested_return:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes, please"
        assert "Before call" timeout 10
        keysym "K_RETURN"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert "Resume inside option" timeout 10
        keysym "K_RETURN"
        assert screen "choice" timeout 10
        click "Inner return"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_102_RETURN caller=none shared=0", flush=True)
        exit

    testcase nested_return_caller:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        click "Yes, please"
        assert "Before call" timeout 10
        keysym "K_RETURN"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert "Resume inside option" timeout 10
        keysym "K_RETURN"
        assert screen "choice" timeout 10
        click "Inner return"
        assert "Caller resumed" timeout 10
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_102_RETURN caller=resumed shared=0", flush=True)
        exit

    testcase narration_prompt:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        assert screen "say" timeout 10
        assert eval (_choice103_visible_prompt(None, "Choose a route")) timeout 10
        assert "Yes" timeout 10
        assert "No" timeout 10
        click "Yes"
        assert "Shared once" timeout 10
        assert eval (choice_flag is True)
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_103_NARRATION simultaneous=yes shared=1", flush=True)
        exit

    testcase character_prompt:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        assert screen "say" timeout 10
        assert eval (_choice103_visible_prompt("Bec", "Where shall we go?")) timeout 10
        assert "Yes" timeout 10
        assert "No" timeout 10
        click "No"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False)
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_103_CHARACTER simultaneous=yes shared=1", flush=True)
        exit

    testcase nested_prompt:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "choice" timeout 10
        assert eval (_choice103_visible_prompt(None, "Choose a route")) timeout 10
        assert "Yes, please" timeout 10
        click "Yes, please"
        assert "Before call" timeout 10
        keysym "K_RETURN"
        assert "Transferred" timeout 10
        keysym "K_RETURN"
        assert "Resume inside option" timeout 10
        keysym "K_RETURN"
        assert screen "choice" timeout 10
        assert screen "say" timeout 10
        assert eval (_choice103_visible_prompt("Bec", "Inside, which route?")) timeout 10
        assert "Inner normal" timeout 10
        assert "Inner jump" timeout 10
        assert "Inner return" timeout 10
        click "Inner normal"
        assert "Inside inner" timeout 10
        keysym "K_RETURN"
        assert "After nested" timeout 10
        keysym "K_RETURN"
        assert "Shared once" timeout 10
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_103_NESTED simultaneous=yes call=returned shared=1", flush=True)
        exit


    testcase mixed_availability:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "_ll_choice_v1" timeout 10
        assert eval (_choice104_mixed()) timeout 10
        click pos (_choice104_locked_pos())
        pause 0.2
        assert screen "_ll_choice_v1"
        assert eval (choice_flag is False and not any(i.action.get_chosen() for i in renpy._choice104_items))
        keysym "K_UP"
        keysym "K_DOWN"
        assert eval (renpy.display.focus.get_focused() is not None and "Available" in renpy.display.focus.get_focused()._tts_all(False)) timeout 10
        keysym "K_RETURN"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False)
        assert eval (not renpy._choice104_items[0].action.get_chosen() and renpy._choice104_items[1].action.get_chosen())
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_104_MIXED hidden=yes locked=rendered pointer=inert keyboard=available shared=1", flush=True)
        exit

    testcase all_unavailable:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False and renpy.get_screen("_ll_choice_v1") is None and not any(label in ("Secret", "Locked", "Available") for location, label in renpy.game.persistent._chosen))
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_104_UNAVAILABLE picks=0 bodies=0 shared=1", flush=True)
        exit

    testcase all_disabled:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False and renpy.get_screen("_ll_choice_v1") is None and not any(label in ("Secret", "Locked", "Available") for location, label in renpy.game.persistent._chosen))
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_104_DISABLED picks=0 bodies=0 shared=1", flush=True)
        exit

    testcase all_hidden:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert "Shared once" timeout 10
        assert eval (choice_flag is False and renpy.get_screen("choice") is None and not any(label in ("Secret", "Locked", "Available") for location, label in renpy.game.persistent._chosen))
        keysym "K_RETURN"
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_104_HIDDEN picks=0 bodies=0 shared=1", flush=True)
        exit

    testcase repeat_conversation:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "_ll_choice_v1" timeout 10
        assert eval (_choice103_visible_prompt(None, "What would you like to ask?")) timeout 10
        assert eval (choice_visits == 1 and not choice_flag and renpy.test.testfocus.find_focus("Ask about the ticket", False) is None)
        $ renpy._choice105_stack = len(renpy.game.context().return_stack)
        click "Ask about the station"
        assert "Station answer" timeout 10
        advance
        assert "Transferred" timeout 10
        advance
        assert "Station call resumed" timeout 10
        advance
        assert screen "_ll_choice_v1" timeout 10
        assert eval (_choice103_visible_prompt(None, "What would you like to ask?")) timeout 10
        assert eval (choice_visits == 1 and choice_flag and len(renpy.game.context().return_stack) == renpy._choice105_stack)
        assert "Ask about the ticket" timeout 10
        click "Ask about the ticket"
        assert "Ticket answer" timeout 10
        advance
        assert screen "_ll_choice_v1" timeout 10
        assert eval (_choice103_visible_prompt(None, "What would you like to ask?")) timeout 10
        click "Ask about the station"
        assert "Station answer" timeout 10
        advance
        assert "Transferred" timeout 10
        advance
        assert "Station call resumed" timeout 10
        advance
        assert screen "_ll_choice_v1" timeout 10
        assert eval (choice_visits == 1 and len(renpy.game.context().return_stack) == renpy._choice105_stack)
        click "Leave"
        assert "Shared once" timeout 10
        assert eval (choice_visits == 1 and choice_flag)
        advance
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_105_REPEAT earlier=once prompt=again availability=changed call=resumed stack=stable shared=1", flush=True)
        exit

    testcase repeat_exhausted:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "_ll_choice_v1" timeout 10
        click "Ask about the station"
        assert "Station answer" timeout 10
        advance
        assert "Transferred" timeout 10
        advance
        assert "Station call resumed" timeout 10
        advance
        assert "Shared once" timeout 10
        assert eval (choice_visits == 1 and choice_flag and renpy.get_screen("_ll_choice_v1") is None)
        advance
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_105_EXHAUSTED gate=reevaluated earlier=once shared=1", flush=True)
        exit

    testcase repeat_nested:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "_ll_choice_v1" timeout 10
        click "Nested conversation"
        assert screen "choice" timeout 10
        assert eval (_choice103_visible_prompt("Bec", "Inside, ask again?")) timeout 10
        $ renpy._choice105_stack = len(renpy.game.context().return_stack)
        click "Inner ask"
        assert "Inner answer" timeout 10
        advance
        assert screen "choice" timeout 10
        assert eval (_choice103_visible_prompt("Bec", "Inside, ask again?")) timeout 10
        assert eval (renpy.test.testfocus.find_focus("Nested conversation", False) is None and choice_visits == 1)
        click "Inner ask"
        assert "Inner answer" timeout 10
        advance
        assert screen "choice" timeout 10
        assert eval (len(renpy.game.context().return_stack) == renpy._choice105_stack)
        click "Inner leave"
        assert "Outer resumed" timeout 10
        advance
        assert "Shared once" timeout 10
        assert eval (choice_visits == 1 and not choice_flag)
        advance
        assert screen "choice_body_main_menu" timeout 10
        $ print("CHOICE_105_NESTED owner=inner character=again outer=resumed earlier=once shared=1", flush=True)
        exit

    testcase repeat_wrong_outcome:
        assert screen "choice_body_main_menu" timeout 10
        click "Start"
        assert screen "_ll_choice_v1" timeout 10
        assert eval (choice_visits == 2) timeout 1
        $ print("CHOICE_105_WRONG_ACCEPTED", flush=True)
        exit
