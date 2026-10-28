"""Render L06's public-core image source in normal pinned Ren'Py entry.

Checks actual assets and displayed dimensions at both aspects. This is separate
from the inert canvas helper, desktop input and visual design acceptance.
"""
import argparse
import ast
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import textwrap

from PIL import Image

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
FIXTURES = REPO / 'tests/fixtures/phase-3b-screens/ui-image'
ASSETS = {'seal.png': 'images/ui png.png', 'seal.jpg': 'images/ui jpeg.jpg',
          'seal.webp': 'images/ui lossless.webp', 'seal-lossy.webp': 'images/ui lossy.webp',
          'seal-alpha.webp': 'images/ui alpha.webp'}
EXPECTED = {'png': [20, 20, 120, 60], 'jpeg': [180, 20, 96, 48],
            'lossless': [340, 20, 160, 80], 'lossy': [540, 20, 128, 64],
            'alpha': [720, 20, 80, 40], 'stretch': [20, 160, 120, 90]}
ELEMENT_ASSETS = dict(png='seal.png', jpeg='seal.jpg', lossless='seal.webp',
                      lossy='seal-lossy.webp', alpha='seal-alpha.webp', stretch='seal.png')


def validate(record, aspect, image=None):
    assert record['aspect'] == list(aspect)
    assert record['sdkVersion'].startswith('8.5.3')
    assert record['rectangles'] == EXPECTED, (record['rectangles'], EXPECTED)
    if image is None:
        return
    with Image.open(image) as captured:
        assert captured.size == aspect
        rgba = captured.convert('RGBA')
        background = rgba.getpixel((0, 0))
        for name, (x, y, width, height) in EXPECTED.items():
            with Image.open(FIXTURES / ELEMENT_ASSETS[name]) as original:
                rgb = original.convert('RGB')
                for dx, dy in [(1, 1), (3, 1), (1, 3), (3, 3)]:
                    wanted = rgb.getpixel((original.width * dx // 4, original.height * dy // 4))
                    actual = rgba.getpixel((x + width * dx // 4, y + height * dy // 4))
                    assert actual[:3] == wanted, (name, actual, wanted)
                    assert actual[3] == 255, (name, 'opaque quadrant missing')
            assert rgba.getpixel((x + width + 3, y + height // 2)) == background, (name, 'right edge leaks')
            assert rgba.getpixel((x + width // 2, y + height + 3)) == background, (name, 'bottom edge leaks')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['archive', 'checksums', 'accepted', 'output']:
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--allow-fixture-execution', action='store_true', required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    result = dict(passed=False, sdkProcesses=0, os=platform.system(), architecture=platform.machine(),
                  records=[], commands=[], cleanupComplete=False,
                  candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip())
    scratch = None
    try:
        for bad in [{}, dict(aspect=[1280, 720], sdkVersion='8.5.3', rectangles={})]:
            try:
                validate(bad, (1280, 720))
            except (AssertionError, KeyError):
                pass
            else:
                raise AssertionError('Missing or wrong evidence was admitted')
        result['rejectingGateSelfCheck'] = True
        accepted = json.loads(args.accepted.read_text())
        assert accepted['publicCoreRequests'] is True
        source = accepted['source'].encode()
        assert hashlib.sha256(source).hexdigest() == accepted['sha256']
        assert {row['name']: row['rectangle'] for row in accepted['elements']} == EXPECTED
        assert len(accepted['elements']) == 6
        assert {row['fixture']: row['runtimePath'] for row in accepted['assets']} == ASSETS
        assert len(accepted['assets']) == 5
        assert expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA
        for asset in accepted['assets']:
            assert hashlib.sha256((FIXTURES / asset['fixture']).read_bytes()).hexdigest() == asset['sha256']
        shutil.copyfile(args.accepted, output / 'accepted.json')
        with tempfile.TemporaryDirectory(prefix='loomlight-ui-image-sdk-') as temporary:
            scratch = Path(temporary)
            install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            launcher = launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
            project = scratch / 'project'
            (project / 'game/ui').mkdir(parents=True)
            (project / 'game/images').mkdir()
            (project / 'game/ui/images.rpy').write_bytes(source)
            for fixture, runtime_path in ASSETS.items():
                shutil.copyfile(FIXTURES / fixture, project / 'game' / runtime_path)
            (project / 'game/script.rpy').write_text('label start:\n    show screen notes\n    show screen ui_image_finish_screen\n    $ renpy.pause(hard=True)\n    return\n')
            env = dict(os.environ, SDL_VIDEODRIVER='dummy', SDL_AUDIODRIVER='dummy', RENPY_RENDERER='sw',
                       RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1',
                       RENPY_SKIP_SPLASHSCREEN='1', RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
            for aspect in [(1280, 720), (1024, 768)]:
                (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight UI image proof"\ndefine config.screen_width = {aspect[0]}\ndefine config.screen_height = {aspect[1]}\ndefine config.save_directory = None\ndefine config.sound = False\n')
                image = output / f'sdk-{aspect[0]}x{aspect[1]}.png'
                proof = '''init python:
    def ui_image_finish():
        try:
            from renpy.test.testfocus import focus_from_displayable
            rectangles = {}
            for name in NAMES:
                widget = renpy.get_displayable("notes", name, base=True)
                assert widget is not None, name
                focus = focus_from_displayable(widget)
                assert focus is not None, name
                rectangles[name] = [focus.x, focus.y, focus.w, focus.h]
            render = renpy.render(renpy.get_screen("notes"), config.screen_width, config.screen_height, 0, 0)
            surface = renpy.display.draw.render_to_texture(render, True)
            renpy.display.pgrender.pygame.image.save(surface, IMAGE)
            print("UI_IMAGE_GEOMETRY " + __import__("json").dumps(dict(aspect=[config.screen_width, config.screen_height], sdkVersion=renpy.version_only, rectangles=rectangles)), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)
screen ui_image_finish_screen():
    timer 0.5 action Function(ui_image_finish)
'''.replace('NAMES', repr(list(EXPECTED))).replace('IMAGE)', repr(str(image)) + ')')
                ast.parse(textwrap.dedent(proof.split('screen ui_image_finish_screen():')[0].removeprefix('init python:\n')))
                (project / 'game/proof.rpy').write_text(proof)
                commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if aspect == (1280, 720) else []
                commands.append((f'images-{aspect[0]}x{aspect[1]}', ['run']))
                for name, arguments in commands:
                    previous = dict(os.environ)
                    try:
                        os.environ.clear()
                        os.environ.update(env)
                        result['sdkProcesses'] += 1
                        command = run_bounded(tuple(map(str, [*launcher, project, *arguments])), timeout_seconds=60, output_limit=2_000_000)
                    except OSError:
                        result['sdkProcesses'] -= 1
                        raise
                    finally:
                        os.environ.clear()
                        os.environ.update(previous)
                    (output / (name + '.log')).write_text(command.output)
                    result['commands'].append(dict(name=name, exitCode=command.exit_code, timedOut=command.timed_out, outputLimited=command.output_limited))
                    if command.exit_code != 0 or command.timed_out or command.output_limited:
                        for filename in ['log.txt', 'traceback.txt', 'errors.txt']:
                            if (project / filename).is_file():
                                shutil.copyfile(project / filename, output / (name + '-' + filename))
                    assert command.exit_code == 0 and not command.timed_out and not command.output_limited, name + ' failed'
                    assert (project / 'game/ui/images.rpy').read_bytes() == source, 'Accepted source changed'
                lines = [line[len('UI_IMAGE_GEOMETRY '):] for line in command.output.splitlines() if line.startswith('UI_IMAGE_GEOMETRY ')]
                assert len(lines) == 1, 'Missing or duplicate geometry'
                record = json.loads(lines[0])
                validate(record, aspect, image)
                result['records'].append(dict(record, sourceSHA256=accepted['sha256'], imageSHA256=hashlib.sha256(image.read_bytes()).hexdigest()))
        result['cleanupComplete'] = not scratch.exists()
        result['passed'] = result['cleanupComplete'] and len(result['records']) == 2
    except Exception as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        if scratch is not None:
            result['cleanupComplete'] = not scratch.exists()
        (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
