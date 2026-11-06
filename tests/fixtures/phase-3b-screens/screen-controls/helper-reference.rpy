# Independent literal reference. No canvas plan or product renderer is imported.
define config.name = "Control helper reference"
define config.screen_width = 1280
define config.screen_height = 720
define config.save_directory = None

screen main_menu():
    text "Control helper reference"

init python:
    import hashlib as _ref_hashlib
    import json as _ref_json
    import os as _ref_os

    def _control_reference_matrix():
        with open(config.basedir + "/reference-input.json", encoding="utf-8") as stream:
            admitted = _ref_json.load(stream)
        rows = []
        for width, height in ((1280, 720), (1024, 768)):
            config.screen_width, config.screen_height = width, height
            renpy.set_physical_size((width, height))
            renpy.display.interface.set_mode()
            for state, path in admitted["appearances"].items():
                # The literal ImageButton and enclosing Fixed are independent of
                # the helper's property conversion, tracking and plan traversal.
                child = renpy.display.behavior.ImageButton(
                    Transform(path, xysize=(160, 80)), action=Null(),
                    xpos=100, ypos=180, xsize=160, ysize=80)
                child.per_interact()
                root = Fixed(child, xsize=width, ysize=height)
                renpy.free_memory()
                rendered = renpy.render(root, width, height, 0, 0)
                filename = "%dx%d-%s.png" % (width, height, state)
                target = _ref_os.path.join(_ref_os.environ["LOOMLIGHT_CONTROL_REFERENCE_OUTPUT"], filename)
                renpy.render_to_file(rendered, target, resize=True)
                with open(target, "rb") as stream:
                    sha = _ref_hashlib.sha256(stream.read()).hexdigest()
                rows.append(dict(width=width, height=height, state=state, filename=filename,
                    sha256=sha, renderer=renpy.get_renderer_info()["renderer"],
                    physical=list(renpy.get_physical_size()),
                    drawPerVirtual=renpy.display.draw.draw_per_virt))
        print("CONTROL_HELPER_REFERENCE " + _ref_json.dumps(dict(
            manifestSHA256=admitted["manifestSHA256"], records=rows)), flush=True)

testsuite control_helper_reference:
    testcase matrix:
        $ _control_reference_matrix()
        exit
