"""Compare public-core shared/copy source with independent literal Ren'Py screens."""
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
STATES = dict(normal='idle_', hover='hover_', selected='selected_idle_', disabled='insensitive_')
ASPECTS = [(1280, 720), (1024, 768)]


def validate_frame_semantics(image):
    samples = []
    # render_to_surface captures premultiplied RGB. A fitted window partially
    # covers the corner, even after resize=True restores virtual dimensions.
    for point, color, opaque in [((40, 40), '#abcdef', False), ((43, 43), '#123456', True)]:
        pixel = image.getpixel(point)
        target = tuple(int(color[i:i+2], 16) * pixel[3] // 255 for i in (1, 3, 5))
        sample = dict(point=list(point), rgba=list(pixel), color=color, expectedPremultipliedRGB=list(target))
        assert pixel[3] >= (254 if opaque else 1), sample
        assert all(abs(a-b) <= 1 for a, b in zip(pixel[:3], target)), sample
        samples.append(sample)
    return samples


def validate_images(output, stage, width, height):
    records = []
    for state in STATES:
        hashes = {}
        for actual, reference in [('notes', 'style_reference'), ('about', 'style_other_reference')]:
            paths = [output / f'{stage}-{width}x{height}-{state}-{name}.png' for name in [actual, reference]]
            images = [Image.open(path).convert('RGBA') for path in paths]
            assert all(image.size == (width, height) for image in images)
            assert images[0].getbbox(), 'Blank rendering is not evidence'
            assert ImageChops.difference(*images).getextrema() == ((0, 0),) * 4, (stage, state, actual, 'literal reference differs')
            if actual == 'notes':
                # Check that a border leaves the interior visible. Literal equality
                # alone would miss the same invalid constructor in both fixtures.
                try:
                    samples = validate_frame_semantics(images[0])
                except AssertionError as error:
                    raise AssertionError((stage, state, [width, height], error.args)) from error
            hashes[actual] = hashlib.sha256(paths[0].read_bytes()).hexdigest()
            hashes[reference] = hashlib.sha256(paths[1].read_bytes()).hexdigest()
        records.append(dict(stage=stage, aspect=[width, height], state=state, differingPixels=0, imageHashes=hashes, semanticSamples=samples))
    assert len({r['imageHashes']['notes'] for r in records}) == 4, 'Button states must produce distinct output'
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['archive', 'checksums', 'accepted', 'output']:
        parser.add_argument('--' + name, type=Path, required=True)
    parser.add_argument('--allow-fixture-execution', action='store_true', required=True)
    args = parser.parse_args()
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    source_files = sorted([*REPO.glob('app/src-core/src/screens*.rs'), *REPO.glob('app/src-core/src/screens/*.rs'), REPO / 'app/src-core/src/screens/canvas-renderer.rpy'])
    result = dict(passed=False, sdkProcesses=0, commands=[], records=[], cleanupComplete=False,
                  sourceFilesSHA256={p.relative_to(REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in source_files},
                  os=platform.system(), architecture=platform.machine(),
                  candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                  checkerSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
    scratch = None
    try:
        accepted = json.loads(args.accepted.read_text()); assert accepted['publicCoreRequests'] is True
        assert set(accepted['stages']) == {'shared', 'independent'}
        assert expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA
        for sources in accepted['stages'].values():
            assert set(sources) == {'game/ui/notes.rpy', 'game/ui/about.rpy'}
            for source in sources.values():
                assert hashlib.sha256(source['text'].encode()).hexdigest() == source['sha256']
        (output / 'accepted.json').write_bytes(args.accepted.read_bytes())
        with tempfile.TemporaryDirectory(prefix='loomlight-style-proof-') as temporary:
            scratch = Path(temporary); install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            launcher = launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
            project = scratch / 'project'; (project / 'game/fonts').mkdir(parents=True)
            font = REPO / 'tests/fixtures/phase-3b-screens/fonts/SourceSans3-Regular.ttf'
            assert len(accepted['assets']) == 1 and accepted['assets'][0]['sha256'] == hashlib.sha256(font.read_bytes()).hexdigest()
            assert accepted['assets'][0]['relativePath'] == 'game/fonts/style_font.ttf'
            shutil.copyfile(font, project / 'game/fonts/style_font.ttf')
            env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if platform.system() == 'Windows' else 'gl2', RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1', RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
            env.pop('SDL_VIDEODRIVER', None); env.pop('SDL_RENDER_DRIVER', None)
            for stage, sources in accepted['stages'].items():
                for path, source in sources.items():
                    target = project / path; target.parent.mkdir(parents=True, exist_ok=True); target.write_text(source['text'])
                body_size = 32 if stage == 'shared' else 40
                reference = (REPO / 'tests/fixtures/phase-3b-screens/styles/reference.rpy').read_text().replace('BODY_SIZE', str(body_size))
                (project / 'game/reference.rpy').write_text(reference)
                for width, height in ASPECTS:
                    (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight style proof"\ndefine config.screen_width = {width}\ndefine config.screen_height = {height}\ndefine config.save_directory = None\ndefine config.sound = False\n')
                    captures = {state: {name: str(output / f'{stage}-{width}x{height}-{state}-{name}.png') for name in ['notes', 'about', 'style_reference', 'style_other_reference']} for state in STATES}
                    proof = '''init python:
    def style_finish_proof():
        try:
            for screen, expected in [("notes", BODY_SIZE), ("about", 32)]:
                widget = renpy.get_displayable(screen, "body", base=True)
                assert widget is not None and widget.style.size == expected, (screen, expected)
                assert widget.style.font == "fonts/style_font.ttf", screen
            for state, prefix in STATES.items():
                for screen in ["notes", "style_reference"]:
                    renpy.get_displayable(screen, "button", base=True).set_style_prefix(prefix, True)
                renpy.display.render.process_redraws()
                for screen, filename in CAPTURES[state].items():
                    render = renpy.render(renpy.get_screen(screen), config.screen_width, config.screen_height, 0, 0)
                    renpy.render_to_file(render, filename, resize=True)
            print("SHARED_STYLE_PROOF " + __import__("json").dumps(dict(sdkVersion=renpy.version_only, renderer=renpy.get_renderer_info()["renderer"], physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt, states=list(STATES))), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)
screen style_finish():
    timer 0.5 action Function(style_finish_proof)
'''.replace('BODY_SIZE', str(body_size)).replace('STATES', repr(STATES)).replace('CAPTURES', repr(captures))
                    # Validate only the fixture-owned Python. Project source remains data.
                    ast.parse(textwrap.dedent(proof.split('screen style_finish():')[0].removeprefix('init python:\n')))
                    (project / 'game/proof.rpy').write_text(proof)
                    (project / 'game/script.rpy').write_text('label start:\n    $ renpy.set_physical_size((config.screen_width, config.screen_height))\n    $ renpy.display.interface.set_mode()\n    show screen notes\n    show screen about\n    show screen style_reference\n    show screen style_other_reference\n    show screen style_finish\n    $ renpy.pause(hard=True)\n    return\n')
                    commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if (width, height) == ASPECTS[0] else []
                    commands.append(('run', ['run']))
                    for name, arguments in commands:
                        previous = dict(os.environ)
                        try:
                            os.environ.clear(); os.environ.update(env); result['sdkProcesses'] += 1
                            command = run_bounded(tuple(map(str, [*launcher, project, *arguments])), timeout_seconds=60, output_limit=2_000_000)
                        except OSError:
                            result['sdkProcesses'] -= 1; raise
                        finally:
                            os.environ.clear(); os.environ.update(previous)
                        (output / f'{stage}-{width}x{height}-{name}.log').write_text(command.output)
                        result['commands'].append(dict(stage=stage, aspect=[width, height], name=name, exitCode=command.exit_code, timedOut=command.timed_out, outputLimited=command.output_limited))
                        assert not command.exit_code and not command.timed_out and not command.output_limited, result['commands'][-1]
                        if name == 'run':
                            rows = [line.removeprefix('SHARED_STYLE_PROOF ') for line in command.output.splitlines() if line.startswith('SHARED_STYLE_PROOF ')]
                            assert len(rows) == 1, 'Missing normal-entry proof'
                            record = json.loads(rows[0]); assert record['sdkVersion'].startswith('8.5.3.') and record['states'] == list(STATES)
                            result['records'].extend([dict(row, **record) for row in validate_images(output, stage, width, height)])
            assert len(result['records']) == 16
            result['passed'] = True
    finally:
        result['cleanupComplete'] = scratch is not None and not scratch.exists()
        (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    assert result['passed'] and result['cleanupComplete']
    print('PASS 16 shared/copy/state/aspect literal SDK comparisons; zero differing pixels.')

if __name__ == '__main__':
    main()
