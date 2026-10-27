"""Compare accepted numeric source with actual pinned-SDK layout at two aspects.

This measures geometry in normal game entry. It makes no GPU/pixel-fidelity claim.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
COMMON = {
    'free': [10, 20, 200, 100],
    'bounds': [40, 50, 260, 160], 'stack': [52, 68, 100, 100],
    'action': [52, 0, 100, 60],
    'asset': [1, 0, 64, 48],
}
EXPECTED = {
    (1280, 720): dict(COMMON, panel=[800, 270, 320, 180]),
    (1024, 768): dict(COMMON, panel=[608, 294, 320, 180]),
}


def validate_geometry(record, aspect):
    assert record['aspect'] == list(aspect), 'Wrong internal aspect'
    assert record['sdkVersion'].startswith('8.5.3'), 'Wrong SDK version'
    actual = record['rectangles']
    assert set(actual) == set(EXPECTED[aspect]) | {'free_text', 'panel_text', 'caption'}, 'Missing or extra widgets'
    for name, rectangle in EXPECTED[aspect].items():
        assert len(actual[name]) == 4 and all(type(v) in (int, float) and math.isfinite(v) for v in actual[name]), name
        if name != 'action': assert actual[name] == rectangle, f'{name}: {actual[name]} != {rectangle}'
    # Text bounds are content-sized. Its supplied space is a wrapping/height limit,
    # not a request to stretch glyphs. Check placement against that measured size.
    free, panel, caption = actual['free_text'], actual['panel_text'], actual['caption']
    for rectangle, width in [(free, 100), (panel, 180), (caption, 80)]:
        assert len(rectangle) == 4 and all(type(v) in (int,float) and math.isfinite(v) for v in rectangle)
        assert 0 < rectangle[2] <= width and 0 < rectangle[3] <= 40
    assert free[:2] == [10, 20]
    assert panel[:2] == [actual['panel'][0] + 16, actual['panel'][1] + 20]
    assert caption[:2] == [52 + (100 - caption[2]) * 0.5, 68]
    assert actual['action'] == [52, 68 + caption[3] + 12, 100, 60]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--accepted', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--allow-fixture-execution', action='store_true', required=True)
    args = parser.parse_args()
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    result = dict(passed=False, sdkProcesses=0, os=platform.system(), architecture=platform.machine(),
                  sdkSHA256=SDK_SHA, records=[], commands=[], cleanupComplete=False,
                  candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                  runId=os.environ.get('GITHUB_RUN_ID'), attempt=os.environ.get('GITHUB_RUN_ATTEMPT'))
    scratch = None
    try:
        # Reject wrong/missing evidence before any expensive process starts.
        example = dict(EXPECTED[(1280, 720)], free_text=[10,20,46,27], panel_text=[816,290,105,27], caption=[78,68,48,27], action=[52,107,100,60])
        validate_geometry(dict(aspect=[1280,720],sdkVersion='8.5.3',rectangles=example),(1280,720))
        for wrong in [{}, dict(example, panel=[0, 0, 320, 180])]:
            try:
                validate_geometry(dict(aspect=[1280, 720], sdkVersion='8.5.3', rectangles=wrong), (1280, 720))
            except AssertionError:
                pass
            else:
                raise AssertionError('The geometry gate admitted a known wrong result')
        result['rejectingGateSelfCheck'] = True
        accepted = json.loads(args.accepted.read_text())
        source = accepted['source'].encode()
        assert hashlib.sha256(source).hexdigest() == accepted['sha256']
        assert accepted['parentConstraintRejected'] is True
        assert expected_sha256(args.checksums.read_text(), args.archive.name) == SDK_SHA
        result['acceptedSHA256'] = accepted['sha256']
        shutil.copyfile(args.accepted, output / 'accepted.json')
        (output / 'accepted.rpy').write_bytes(source)
        with tempfile.TemporaryDirectory(prefix='loomlight-numeric-sdk-') as temporary:
            scratch = Path(temporary)
            install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            sdk = scratch / 'sdk/renpy-8.5.3-sdk'; launcher = launcher_for(sdk)
            project = scratch / 'project'; (project / 'game/ui').mkdir(parents=True)
            (project / 'game/assets').mkdir()
            (project / 'game/ui/layout.rpy').write_bytes(source)
            shutil.copyfile(REPO / 'tests/fixtures/phase-1h/assets/booth.png', project / 'game/assets/help.png')
            names = list(COMMON) + ['free_text', 'panel', 'panel_text', 'caption']
            (project / 'game/proof.rpy').write_text('''init python:
    def numeric_geometry():
        from renpy.test.testfocus import focus_from_displayable
        rectangles = {}
        for name in ''' + repr(names) + ''':
            widget = renpy.get_displayable("numeric", name, base=True)
            assert widget is not None, name
            focus = focus_from_displayable(widget)
            assert focus is not None, name
            rectangles[name] = [focus.x, focus.y, focus.w, focus.h]
        return dict(aspect=[config.screen_width, config.screen_height], sdkVersion=renpy.version_only, rectangles=rectangles)
    def numeric_finish():
        try:
            print("NUMERIC_GEOMETRY " + __import__("json").dumps(numeric_geometry()), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)
screen numeric_finish_screen():
    timer 0.5 action Function(numeric_finish)
''')
            (project / 'game/script.rpy').write_text('label start:\n    show screen numeric\n    show screen numeric_finish_screen\n    $ renpy.pause(hard=True)\n    return\n')
            env = dict(os.environ, SDL_VIDEODRIVER='dummy', SDL_AUDIODRIVER='dummy', RENPY_RENDERER='sw',
                       RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1',
                       RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
            def options(width, height):
                (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight numeric geometry proof"\ndefine config.screen_width = {width}\ndefine config.screen_height = {height}\ndefine config.save_directory = None\ndefine config.sound = False\n')
            def run(name, arguments):
                result['sdkProcesses'] += 1
                previous = dict(os.environ)
                try:
                    os.environ.clear(); os.environ.update(env)
                    command = run_bounded(tuple(map(str, [*launcher, project, *arguments])), timeout_seconds=60, output_limit=2_000_000)
                except OSError:
                    result['sdkProcesses'] -= 1
                    raise
                finally:
                    os.environ.clear(); os.environ.update(previous)
                (output / (name + '.log')).write_text(command.output)
                result['commands'].append(dict(name=name, exitCode=command.exit_code, timedOut=command.timed_out,
                    outputLimited=command.output_limited, durationSeconds=command.duration_seconds))
                if command.exit_code != 0 or command.timed_out or command.output_limited:
                    retained = output / (name + '-files'); retained.mkdir()
                    for filename in ['log.txt', 'traceback.txt', 'errors.txt']:
                        path = project / filename
                        if path.exists(): shutil.copyfile(path, retained / filename)
                    shutil.copytree(project / 'game', retained / 'game', ignore=shutil.ignore_patterns('*.rpyc', 'cache', 'saves'))
                assert command.exit_code == 0 and not command.timed_out and not command.output_limited, name + ' failed'
                assert (project / 'game/ui/layout.rpy').read_bytes() == source, 'Accepted source changed'
                return command.output
            options(1280, 720)
            run('compile', ['compile']); run('lint', ['lint', '--error-code'])
            for aspect in EXPECTED:
                options(*aspect)
                text = run(f'geometry-{aspect[0]}x{aspect[1]}', ['run'])
                lines = [line.removeprefix('NUMERIC_GEOMETRY ') for line in text.splitlines() if line.startswith('NUMERIC_GEOMETRY ')]
                assert len(lines) == 1, 'Missing or duplicate geometry record'
                record = json.loads(lines[0]); validate_geometry(record, aspect); result['records'].append(record)
            result['acceptedSourceUnchanged'] = True
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
