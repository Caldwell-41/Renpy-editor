"""Qualify frozen UI/core-authored Choice bodies through pinned normal-entry play.

One invocation is one SDK harness start. Every compile/lint/play child keeps its
own exit status and log. No editor/package/browser launch is involved.
"""
import argparse
import hashlib
import json
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
from sdk_adapter import Command, command_argv, run_bounded

PIN = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
CASES = [('continuation', 'yes', 'CHOICE_101_YES flag=True shared=1'),
         ('continuation', 'no', 'CHOICE_101_NO flag=False shared=1'),
         ('return', 'return_option', 'CHOICE_101_RETURN caller=none shared=0'),
         ('jump', 'jump_option', 'CHOICE_101_JUMP target=1 shared=0'),
         ('returnCaller', 'return_to_caller', 'CHOICE_101_RETURN caller=resumed shared=0'),
         ('recursive', 'nested_normal', 'CHOICE_102_NORMAL call=returned inner=joined outer=joined'),
         ('recursive', 'nested_jump', 'CHOICE_102_JUMP target=entered shared=0'),
         ('recursive', 'nested_return', 'CHOICE_102_RETURN caller=none shared=0'),
         ('recursiveCaller', 'nested_return_caller', 'CHOICE_102_RETURN caller=resumed shared=0'),
         ('narrationPrompt', 'narration_prompt', 'CHOICE_103_NARRATION simultaneous=yes shared=1'),
         ('characterPrompt', 'character_prompt', 'CHOICE_103_CHARACTER simultaneous=yes shared=1'),
         ('recursivePrompt', 'nested_prompt', 'CHOICE_103_NESTED simultaneous=yes call=returned shared=1')]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def preflight(args):
    evidence = json.loads(args.authored.read_text())
    assert evidence['passed'] is True and evidence['actualCore'] is True and evidence['actualMain'] is True
    assert evidence['cleanupComplete'] is True
    runtime = evidence['runtime']
    assert set(runtime) in ({'continuation', 'return', 'jump', 'entryLabel', 'target'},
                            {'continuation', 'return', 'jump', 'entryLabel', 'target', 'recursive'},
                            {'continuation', 'return', 'jump', 'entryLabel', 'target', 'recursive', 'narrationPrompt', 'characterPrompt', 'recursivePrompt', 'characterDefinition'})
    if 'narrationPrompt' in runtime:
        assert runtime['characterDefinition'] == 'define bec = Character("Bec", color="#ffffff")\n'
        assert runtime['narrationPrompt'] == runtime['continuation'].replace('    menu:\n', '    menu:\n        "Choose a route"\n', 1)
        assert runtime['characterPrompt'] == runtime['narrationPrompt'].replace('"Choose a route"', 'bec "Where shall we go?"')
        assert runtime['recursivePrompt'] == runtime['recursive'].replace('    menu:\n', '    menu:\n        "Choose a route"\n', 1).replace('                menu:\n', '                menu:\n                    bec "Inside, which route?"\n')
    if 'recursive' in runtime:
        assert all(text in runtime['recursive'] for text in ['Before call', ' from _ll_call_', 'Resume inside option', 'if (choice_flag == True):', 'Inner normal', 'After nested'])
        assert runtime['recursive'].count('\"Shared once\"') == 1
    assert runtime['continuation'].count('"Shared once"') == 1
    assert '"No":\n            pass' in runtime['continuation']
    assert '$ choice_flag = True' in runtime['continuation']
    assert runtime['entryLabel'].replace('_', '').isalnum()
    driver = (REPO / 'tests/fixtures/choice-101/driver.rpy').read_bytes()
    assert driver.count(b'    testcase ') == 13 and b'--warp' not in driver
    assert expected_sha256(args.checksums.read_text(), args.archive.name) == PIN
    assert digest(args.archive.read_bytes()) == PIN
    return runtime, driver


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--authored', type=Path, required=True)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preflight', action='store_true')
    parser.add_argument('--allow-fixture-execution', action='store_true')
    args = parser.parse_args()
    runtime, driver = preflight(args)
    if args.preflight:
        print('Choice fixture and official pinned archive preflight passed. No SDK started.')
        return
    assert args.allow_fixture_execution, 'deliberate execution grant required'
    args.output.mkdir(parents=True, exist_ok=False)
    receipt = dict(passed=False, harnessStarts=1, children=[], host=platform.platform(),
                   candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                   sdkSHA256=PIN, authoredSHA256=digest(args.authored.read_bytes()), driverSHA256=digest(driver),
                   sourceHashes={key: digest(value.encode()) for key, value in runtime.items()},
                   nativeEditorLaunches=0, cleanupComplete=False)
    (args.output / 'authored.json').write_bytes(args.authored.read_bytes())
    scratch = None
    try:
        with tempfile.TemporaryDirectory(prefix='choice-sdk-', dir=args.output) as directory:
            scratch = Path(directory)
            install_verified_tar(args.archive.resolve(), PIN, scratch / 'sdk')
            sdk = scratch / 'sdk/renpy-8.5.3-sdk'
            env = dict(os.environ, RENPY_PATH_TO_SAVES=str(scratch / 'saves'), SDL_AUDIODRIVER='dummy',
                       PYTHONDONTWRITEBYTECODE='1', TMPDIR=str(scratch), TMP=str(scratch), TEMP=str(scratch))
            old_env = dict(os.environ)
            os.environ.update(env)
            try:
                for variant in ['continuation', 'return', 'jump', 'returnCaller'] + (['recursive', 'recursiveCaller'] if 'recursive' in runtime else []) + (['narrationPrompt', 'characterPrompt', 'recursivePrompt'] if 'narrationPrompt' in runtime else []):
                    game = scratch / variant
                    (game / 'game').mkdir(parents=True)
                    sources = {'story.rpy': runtime['return' if variant == 'returnCaller' else 'recursive' if variant == 'recursiveCaller' else variant], 'target.rpy': runtime['target'],
                               'script.rpy': 'label start:\n    ' + ('call ' + runtime['entryLabel'] + ' from choice_fixture_return\n    \"Caller resumed\"\n    return\n' if variant in ('returnCaller', 'recursiveCaller') else 'jump ' + runtime['entryLabel'] + '\n'),
                               'driver.rpy': driver.decode()}
                    if 'Prompt' in variant:
                        sources['characters.rpy'] = runtime['characterDefinition']
                    for name, source in sources.items():
                        (game / 'game' / name).write_bytes(source.encode())
                    checks = [(Command.COMPILE, None, None), (Command.LINT, None, None)]
                    checks += [(Command.TEST, case, marker) for v, case, marker in CASES if v == variant]
                    if variant == 'continuation':
                        checks.append((Command.TEST, 'wrong_outcome', None))
                    for command, case, marker in checks:
                        name = variant + '-' + (case or command.value)
                        row = dict(name=name, passed=False, expected='rejected wrong outcome' if case == 'wrong_outcome' else 'success')
                        receipt['children'].append(row)
                        result = run_bounded(command_argv(sdk, command, game, testcase='choice_body::' + case if case else None,
                                                         allow_project_execution=True), timeout_seconds=60, output_limit=2_000_000)
                        (args.output / (name + '.log')).write_text(result.output)
                        row.update(exitCode=result.exit_code, timedOut=result.timed_out, outputLimited=result.output_limited,
                                   durationSeconds=result.duration_seconds, argv=list(result.argv))
                        if case == 'wrong_outcome':
                            row['passed'] = result.exit_code != 0 and '[rpytest] Status: FAILED' in result.output and 'AssertionError: assert eval (choice_flag is False)' in result.output and 'CHOICE_101_WRONG_ACCEPTED' not in result.output
                        else:
                            row['passed'] = result.exit_code == 0 and (marker is None or result.output.count(marker) == 1 and '[rpytest] Status: PASSED' in result.output)
                        assert row['passed'] and not result.timed_out and not result.output_limited, name
                        assert all((game / 'game' / name).read_bytes() == source.encode() for name, source in sources.items())
            finally:
                os.environ.clear()
                os.environ.update(old_env)
        receipt['passed'] = True
    finally:
        receipt['cleanupComplete'] = scratch is None or not scratch.exists()
        (args.output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Choice normal-entry compile, lint and play passed; wrong outcome rejected.')


if __name__ == '__main__':
    main()
