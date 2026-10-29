"""Qualify public-core TTF/OTF source against independent literal Ren'Py output."""
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

from PIL import Image, ImageChops

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
FIXTURES = REPO / 'tests/fixtures/phase-3b-screens/fonts'
BODY = 'Choose a route before the last tram leaves at midnight. Return to the map whenever you need help.'
EXPECTED = {
    'title': dict(text='Help with your route', font='fonts/help_ttf.ttf', size=38, color='#f1e9d6', align=0.0, bold=True, italic=False, x=20, y=20, width=600),
    'body': dict(text=BODY, font='fonts/help_otf.otf', size=26, color='#ace8', align=0.5, bold=False, italic=True, x=20, y=100, width=300),
    'right': dict(text='Return to the map', font='fonts/help_ttf.ttf', size=26, color='#12345678', align=1.0, bold=True, italic=True, x=20, y=310, width=300),
    'minimum': dict(text='Small', font='fonts/help_ttf.ttf', size=1, color='#fff', align=0.0, bold=False, italic=False, x=20, y=500, width=120),
    'maximum': dict(text='I', font='fonts/help_otf.otf', size=512, color='#ffff', align=0.0, bold=False, italic=False, x=800, y=20, width=200),
}


def validate(record, aspect):
    assert record['aspect'] == list(aspect)
    assert record['sdkVersion'].startswith('8.5.3.')
    assert record['renderer'] in ('gl2', 'angle2')
    assert set(record['rectangles']) == set(record['referenceRectangles']) == set(EXPECTED)
    assert record['rectangles'] == record['referenceRectangles'], 'Placement/wrapping differs from the literal reference'
    assert record['fonts'] == {name: row['font'] for name, row in EXPECTED.items()}, 'Wrong actual font'
    for name, row in EXPECTED.items():
        x, y, width, height = record['rectangles'][name]
        assert [x, y] == [row['x'], row['y']], (name, 'wrong placement')
        assert 0 < width <= row['width'], (name, 'text exceeds its wrapping limit')
        assert 0 < height and x + width <= aspect[0] and y + height <= aspect[1]
    assert record['rectangles']['body'][3] > 52, 'The body must wrap across several lines'


def reference_source():
    return (FIXTURES / 'reference.rpy').read_text()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['archive', 'checksums', 'accepted', 'output']:
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--allow-fixture-execution', action='store_true', required=True)
    parser.add_argument('--reuse-compile-lint', type=Path)
    args = parser.parse_args()
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=False)
    result = dict(passed=False, sdkProcesses=0, commands=[], records=[], cleanupComplete=False,
                  os=platform.system(), architecture=platform.machine(),
                  candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                  checkerSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
    scratch = None
    try:
        accepted = json.loads(args.accepted.read_text())
        source = accepted['source'].encode()
        assert accepted['publicCoreRequests'] is True
        assert hashlib.sha256(source).hexdigest() == accepted['sha256']
        assert len(accepted['elements']) == 5
        for element in accepted['elements']:
            row = EXPECTED[element['name']]
            assert all(element[k] == row[k] for k in ['font', 'size', 'color', 'align', 'bold', 'italic', 'width'])
            assert element['position'] == [row['x'], row['y']]
        assert expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA
        assert {a['relativePath'] for a in accepted['assets']} == {'game/fonts/help_ttf.ttf', 'game/fonts/help_otf.otf'}
        (output / 'accepted.json').write_bytes(args.accepted.read_bytes())
        result['acceptedSHA256'] = hashlib.sha256(args.accepted.read_bytes()).hexdigest()
        if args.reuse_compile_lint:
            previous = json.loads((args.reuse_compile_lint / 'result.json').read_text())
            assert (args.reuse_compile_lint / 'accepted.json').read_bytes() == args.accepted.read_bytes(), 'Compile/lint inputs changed'
            checked = previous['commands'][:2]
            assert [r['name'] for r in checked] == ['compile', 'lint']
            assert all(r['exitCode'] == 0 and not r['timedOut'] and not r['outputLimited'] for r in checked)
            result['reusedCompileLint'] = dict(candidate=previous['candidate'], acceptedSHA256=previous['acceptedSHA256'], commands=checked)
        with tempfile.TemporaryDirectory(prefix='loomlight-project-font-') as temporary:
            scratch = Path(temporary)
            install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            launcher = launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
            project = scratch / 'project'
            (project / 'game/fonts').mkdir(parents=True)
            (project / 'game/accepted.rpy').write_bytes(source)
            for asset in accepted['assets']:
                extension = asset['relativePath'].rsplit('.', 1)[1]
                font = FIXTURES / f'SourceSans3-Regular.{extension}'
                assert hashlib.sha256(font.read_bytes()).hexdigest() == asset['sha256']
                shutil.copyfile(font, project / asset['relativePath'])
            reference = reference_source()
            (project / 'game/reference.rpy').write_text(reference)
            (project / 'game/default.rpy').write_text(reference.replace('font_reference', 'font_default').replace('fonts/help_ttf.ttf', 'DejaVuSans.ttf').replace('fonts/help_otf.otf', 'DejaVuSans.ttf'))
            (project / 'game/script.rpy').write_text('label start:\n    $ renpy.set_physical_size((config.screen_width, config.screen_height))\n    $ renpy.display.interface.set_mode()\n    show screen notes\n    show screen font_reference\n    show screen font_default\n    show screen font_finish\n    $ renpy.pause(hard=True)\n    return\n')
            env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if platform.system() == 'Windows' else 'gl2',
                       RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1', RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
            env.pop('SDL_VIDEODRIVER', None)
            env.pop('SDL_RENDER_DRIVER', None)
            for aspect in [(1280, 720), (1024, 768)]:
                (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight font proof"\ndefine config.screen_width = {aspect[0]}\ndefine config.screen_height = {aspect[1]}\ndefine config.save_directory = None\ndefine config.sound = False\n')
                images = {name: output / f'{name}-{aspect[0]}x{aspect[1]}.png' for name in ['accepted', 'reference', 'default']}
                proof = '''init python:
    def font_finish_proof():
        try:
            from renpy.test.testfocus import focus_from_displayable
            rectangles, reference_rectangles, fonts = {}, {}, {}
            for name in NAMES:
                actual = renpy.get_displayable("notes", name, base=True)
                expected = renpy.get_displayable("font_reference", name, base=True)
                assert actual is not None and expected is not None, name
                for key in ["font", "size", "color", "text_align", "bold", "italic"]:
                    assert getattr(actual.style, key) == getattr(expected.style, key), (name, key)
                fonts[name] = actual.style.font
                for widget, target in [(actual, rectangles), (expected, reference_rectangles)]:
                    focus = focus_from_displayable(widget)
                    assert focus is not None, name
                    target[name] = [focus.x, focus.y, focus.w, focus.h]
            for screen, filename in CAPTURES:
                render = renpy.render(renpy.get_screen(screen), config.screen_width, config.screen_height, 0, 0)
                renpy.render_to_file(render, filename, resize=True)
            print("PROJECT_FONT_PROOF " + __import__("json").dumps(dict(aspect=[config.screen_width, config.screen_height], sdkVersion=renpy.version_only, renderer=renpy.get_renderer_info()["renderer"], rectangles=rectangles, referenceRectangles=reference_rectangles, fonts=fonts, physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt)), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)
screen font_finish():
    timer 0.5 action Function(font_finish_proof)
'''.replace('NAMES', repr(list(EXPECTED))).replace('CAPTURES', repr([('notes', str(images['accepted'])), ('font_reference', str(images['reference'])), ('font_default', str(images['default']))]))
                ast.parse(textwrap.dedent(proof.split('screen font_finish():')[0].removeprefix('init python:\n')))
                (project / 'game/proof.rpy').write_text(proof)
                commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if aspect == (1280, 720) and not args.reuse_compile_lint else []
                commands.append((f'font-{aspect[0]}x{aspect[1]}', ['run']))
                for name, arguments in commands:
                    previous = dict(os.environ)
                    try:
                        os.environ.clear(); os.environ.update(env)
                        result['sdkProcesses'] += 1
                        command = run_bounded(tuple(map(str, [*launcher, project, *arguments])), timeout_seconds=60, output_limit=2_000_000)
                    except OSError:
                        result['sdkProcesses'] -= 1
                        raise
                    finally:
                        os.environ.clear(); os.environ.update(previous)
                    (output / f'{name}.log').write_text(command.output)
                    result['commands'].append(dict(name=name, exitCode=command.exit_code, timedOut=command.timed_out, outputLimited=command.output_limited))
                    if command.exit_code or command.timed_out or command.output_limited:
                        for filename in ['log.txt', 'traceback.txt', 'errors.txt']:
                            if (project / filename).is_file(): shutil.copyfile(project / filename, output / f'{name}-{filename}')
                    assert command.exit_code == 0 and not command.timed_out and not command.output_limited, name
                    assert (project / 'game/accepted.rpy').read_bytes() == source
                lines = [line.removeprefix('PROJECT_FONT_PROOF ') for line in command.output.splitlines() if line.startswith('PROJECT_FONT_PROOF ')]
                assert len(lines) == 1, 'Missing or duplicate font evidence'
                record = json.loads(lines[0]); validate(record, aspect)
                with Image.open(images['accepted']) as a, Image.open(images['reference']) as b, Image.open(images['default']) as default:
                    actual, wanted, fallback = a.convert('RGBA'), b.convert('RGBA'), default.convert('RGBA')
                    assert actual.size == wanted.size == fallback.size == aspect
                    assert ImageChops.difference(actual, wanted).getextrema() == ((0, 0),) * 4, 'Reference pixels differ'
                    for name in ['title', 'body']:
                        x, y, width, height = record['rectangles'][name]
                        box = (x, y, x + width, y + height)
                        assert ImageChops.difference(actual.crop(box), fallback.crop(box)).getbbox(), f'{name} did not demonstrate its project font'
                result['records'].append(dict(record, differingPixels=0, sourceSHA256=accepted['sha256'], imageHashes={name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in images.items()}))
        result['cleanupComplete'] = not scratch.exists()
        result['passed'] = result['cleanupComplete'] and len(result['records']) == 2
    except Exception as error:
        result['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        if scratch is not None: result['cleanupComplete'] = not scratch.exists()
        (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
        print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
