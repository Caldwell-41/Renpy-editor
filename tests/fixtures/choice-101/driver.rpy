# Fixture presentation only. The Story bytes come from production UI/core authoring.
define config.name = "Choice body qualification"
define config.screen_width = 1280
define config.screen_height = 720
define config.save_directory = None
define config.default_text_cps = 0

default choice_flag = False

init python:
    # The menu resets store variables after an uncaught Return. Observe the
    # actual saved-source Return before that reset, outside the store being reset.
    renpy._choice101_return_flags = []
    def _choice101_statement(name):
        if name == "return" and renpy.get_filename_line()[0].endswith("story.rpy"):
            renpy._choice101_return_flags.append(bool(renpy.store.choice_flag))
    config.statement_callbacks.append(_choice101_statement)

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

screen choice(items):
    vbox:
        for item in items:
            textbutton item.caption action item.action

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
        assert "Choose a route" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "Choose a route" and renpy.get_screen("say").scope["who"] is None)
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
        assert "Bec" timeout 10
        assert "Where shall we go?" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "Where shall we go?" and renpy.get_screen("say").scope["who"] == "Bec")
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
        assert "Choose a route" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "Choose a route" and renpy.get_screen("say").scope["who"] is None)
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
        assert "Bec" timeout 10
        assert "Inside, which route?" timeout 10
        assert eval (renpy.get_screen("say").scope["what"] == "Inside, which route?" and renpy.get_screen("say").scope["who"] == "Bec")
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
