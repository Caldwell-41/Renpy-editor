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
         ('recursivePrompt', 'nested_prompt', 'CHOICE_103_NESTED simultaneous=yes call=returned shared=1'),
         ('mixedAvailability', 'mixed_availability', 'CHOICE_104_MIXED hidden=yes locked=rendered pointer=inert keyboard=available shared=1'),
         ('allUnavailable', 'all_unavailable', 'CHOICE_104_UNAVAILABLE picks=0 bodies=0 shared=1'),
         ('allDisabled', 'all_disabled', 'CHOICE_104_DISABLED picks=0 bodies=0 shared=1'),
         ('allHidden', 'all_hidden', 'CHOICE_104_HIDDEN picks=0 bodies=0 shared=1'),
         ('repeatConversation', 'repeat_conversation', 'CHOICE_105_REPEAT earlier=once prompt=again availability=changed call=resumed stack=stable shared=1'),
         ('repeatExhausted', 'repeat_exhausted', 'CHOICE_105_EXHAUSTED gate=reevaluated earlier=once shared=1'),
         ('repeatNested', 'repeat_nested', 'CHOICE_105_NESTED owner=inner character=again outer=resumed earlier=once shared=1')]


PICKED_CASES = [('pickedShow', 'picked_show', 'CHOICE_106_SHOW identity=separate reentry=scene selectable=yes'),
                ('pickedMark', 'picked_mark_save', 'CHOICE_106_SAVE actual=slot picked=first process=closing'),
                ('pickedMark', 'picked_load', 'CHOICE_106_LOAD process=new retained=yes marked=selectable'),
                ('pickedMark', 'picked_rollback_new', 'CHOICE_106_ROLLBACK restored=yes newgame=fresh'),
                ('pickedHide', 'picked_hide', 'CHOICE_106_HIDE duplicates=independent disabled=skipped shared=once'),
                ('pickedRepeat', 'picked_repeat', 'CHOICE_106_REPEAT store=shared prompt=again call=resumed'),
                ('pickedReturn', 'picked_return', 'CHOICE_106_RETURN recorded=before-transfer'),
                ('pickedImmediateRepeat', 'picked_immediate_repeat', 'CHOICE_106_IMMEDIATE_REPEAT recorded=yes hidden=first'),
                ('pickedInstances', 'picked_instances', 'CHOICE_106_INSTANCES keys=separate captions=identical'),
                ('pickedRepeatHide', 'picked_repeat_hide', 'CHOICE_106_REPEAT_HIDE picked=hidden unavailable=disabled gate=combined')]
PICKED_KEYS = {'pickedShow', 'pickedMark', 'pickedHide', 'pickedRepeat', 'pickedAdapter', 'pickedTarget', 'pickedIdentities', 'pickedReturn', 'pickedImmediateRepeat', 'pickedInstances', 'pickedInstanceIdentities', 'pickedRepeatHide'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def preflight(args):
    evidence = json.loads(args.authored.read_text())
    assert evidence['passed'] is True and evidence['actualCore'] is True and evidence['actualMain'] is True
    assert evidence['cleanupComplete'] is True
    runtime = evidence['runtime']
    availability = {'mixedAvailability', 'allUnavailable', 'allDisabled', 'allHidden', 'choiceAdapter', 'choiceTemplate'}
    assert (set(runtime) - PICKED_KEYS - availability - {'repeatConversation', 'repeatExhausted', 'repeatNested'}) in ({'continuation', 'return', 'jump', 'entryLabel', 'target'},
                            {'continuation', 'return', 'jump', 'entryLabel', 'target', 'recursive'},
                            {'continuation', 'return', 'jump', 'entryLabel', 'target', 'recursive', 'narrationPrompt', 'characterPrompt', 'recursivePrompt', 'characterDefinition'})
    if '_ll_mode=' not in runtime['continuation']:
        if 'repeatConversation' in runtime:
            assert {'repeatConversation', 'repeatExhausted', 'repeatNested'}.issubset(runtime)
            for variant in ('repeatConversation', 'repeatExhausted', 'repeatNested'):
                assert runtime[variant].count('$ choice_visits = choice_visits + 1') == 1
                assert all(text in runtime[variant] for text in ('Ask about the station', 'Ask about the ticket', 'Leave', 'What would you like to ask?', 'Station call resumed', ' from _ll_call_', 'jump _ll_choice_'))
                assert runtime[variant].count('"Shared once"') == 1
            assert runtime['repeatConversation'].count('label _ll_choice_') == 1
            assert runtime['repeatNested'].count('label _ll_choice_') == 2
            assert 'bec "Inside, ask again?"' in runtime['repeatNested'] and 'if (choice_flag == False):' in runtime['repeatNested']
            assert runtime['repeatExhausted'].count('(_ll_available=(choice_flag == False))') == 3
        if 'mixedAvailability' in runtime:
            assert availability.issubset(runtime)
            assert 'screen _ll_choice_v1(items):' in runtime['choiceAdapter']
            assert 'textbutton i.caption action i.action sensitive i.kwargs.get("_ll_available", True)' in runtime['choiceAdapter']
            assert '"Secret" if (choice_flag == True):' in runtime['mixedAvailability']
            assert '"Locked" (_ll_available=(choice_flag == True)) if True:' in runtime['mixedAvailability']
            assert runtime['allDisabled'].count('(_ll_available=(choice_flag == True))') == 3
            assert 'screen=' not in runtime['allHidden']
            assert all(runtime[v].count('"Shared once"') == 1 for v in ('mixedAvailability', 'allUnavailable', 'allDisabled', 'allHidden'))
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
    assert driver.count(b'    testcase ') == 32 and b'--warp' not in driver
    assert expected_sha256(args.checksums.read_text(), args.archive.name) == PIN
    assert digest(args.archive.read_bytes()) == PIN
    if args.picked_only:
        assert PICKED_KEYS.issubset(runtime)
        keys = runtime['pickedIdentities']
        assert len(set([keys['choice'], *keys['options']])) == 4
        for variant, mode in [('pickedShow', 'showNormally'), ('pickedMark', 'markPicked'), ('pickedHide', 'hidePicked')]:
            source = runtime[variant]
            assert '_ll_mode="' + mode + '"' in source
            assert source.count('$ _ll_picked_v1[') == 3
            assert source.count('jump ' + runtime['entryLabel']) == 0
            assert runtime['pickedTarget'].count('jump ' + runtime['entryLabel']) == 1
        assert 'default _ll_picked_v1 = {}' in runtime['pickedAdapter']
    return runtime, driver


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--authored', type=Path, required=True)
    parser.add_argument('--archive', type=Path, required=True)
    parser.add_argument('--checksums', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preflight', action='store_true')
    parser.add_argument('--availability-only', action='store_true')
    parser.add_argument('--repeat-only', action='store_true')
    parser.add_argument('--picked-only', action='store_true')
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
                   sourceHashes={key: digest(value.encode()) for key, value in runtime.items() if isinstance(value, str)},
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
                variants = ['continuation', 'return', 'jump', 'returnCaller'] + (['recursive', 'recursiveCaller'] if 'recursive' in runtime else []) + (['narrationPrompt', 'characterPrompt', 'recursivePrompt'] if 'narrationPrompt' in runtime else [])
                availability = ['mixedAvailability', 'allUnavailable', 'allDisabled', 'allHidden'] if 'mixedAvailability' in runtime else []
                repeats = ['repeatConversation', 'repeatExhausted', 'repeatNested'] if 'repeatConversation' in runtime else []
                variants = ['pickedShow', 'pickedMark', 'pickedHide', 'pickedRepeat', 'pickedReturn', 'pickedImmediateRepeat', 'pickedInstances', 'pickedRepeatHide'] if args.picked_only else repeats if args.repeat_only else availability if args.availability_only else variants + availability + repeats
                assert sum((args.repeat_only, args.availability_only, args.picked_only)) <= 1
                assert variants
                for variant in variants:
                    game = scratch / variant
                    (game / 'game').mkdir(parents=True)
                    sources = {'story.rpy': runtime['return' if variant == 'returnCaller' else 'recursive' if variant == 'recursiveCaller' else variant], 'target.rpy': runtime['pickedTarget'] if variant in ('pickedShow', 'pickedMark', 'pickedHide', 'pickedReturn', 'pickedImmediateRepeat', 'pickedInstances') else runtime['target'],
                               'script.rpy': 'label start:\n    ' + ('call ' + runtime['entryLabel'] + ' from choice_fixture_return\n    \"Caller resumed\"\n    return\n' if variant in ('returnCaller', 'recursiveCaller') else 'jump ' + runtime['entryLabel'] + '\n'),
                               'driver.rpy': driver.decode()}
                    if '_ll_mode=' in sources['story.rpy']:
                        sources['loomlight_choice_v1.rpy'] = runtime.get('pickedAdapter', runtime['choiceAdapter'])
                    if variant.startswith('picked'):
                        sources['loomlight_choice_v1.rpy'] = runtime['pickedAdapter']
                        sources['fixture_ids.rpy'] = 'define choice106_id = ' + repr(runtime['pickedIdentities']['choice']) + '\ndefine choice106_options = ' + repr(tuple(runtime['pickedIdentities']['options'])) + '\n'
                        if variant == 'pickedInstances':
                            sources['fixture_ids.rpy'] += 'define choice106_second_id = ' + repr(runtime['pickedInstanceIdentities']['choice']) + '\ndefine choice106_second_options = ' + repr(tuple(runtime['pickedInstanceIdentities']['options'])) + '\n'
                    elif variant in availability or variant in repeats:
                        sources['loomlight_choice_v1.rpy'] = runtime['choiceAdapter']
                    if 'Prompt' in variant or variant in repeats or variant in ('pickedRepeat', 'pickedRepeatHide'):
                        sources['characters.rpy'] = runtime['characterDefinition']
                    for name, source in sources.items():
                        (game / 'game' / name).write_bytes(source.encode())
                    checks = [(Command.COMPILE, None, None), (Command.LINT, None, None)]
                    checks += [(Command.TEST, case, marker) for v, case, marker in CASES + PICKED_CASES if v == variant]
                    if variant == 'pickedShow':
                        checks.append((Command.TEST, 'picked_wrong_outcome', None))
                    if variant == 'continuation':
                        checks.append((Command.TEST, 'wrong_outcome', None))
                    if variant == 'repeatConversation':
                        checks.append((Command.TEST, 'repeat_wrong_outcome', None))
                    for command, case, marker in checks:
                        name = variant + '-' + (case or command.value)
                        row = dict(name=name, passed=False, expected='rejected wrong outcome' if case in ('wrong_outcome', 'repeat_wrong_outcome', 'picked_wrong_outcome') else 'success')
                        receipt['children'].append(row)
                        if case == 'picked_load':
                            saves = {str(p.relative_to(scratch)): digest(p.read_bytes()) for p in scratch.rglob('choice106-LT1.save')}
                            assert saves and saves == receipt['savedArtifacts'], 'missing/changed save before new-process Load'
                            row['loadedArtifacts'] = saves
                        result = run_bounded(command_argv(sdk, command, game, testcase='choice_body::' + case if case else None,
                                                         allow_project_execution=True), timeout_seconds=60, output_limit=2_000_000)
                        (args.output / (name + '.log')).write_text(result.output)
                        row.update(exitCode=result.exit_code, timedOut=result.timed_out, outputLimited=result.output_limited,
                                   durationSeconds=result.duration_seconds, argv=list(result.argv))
                        if case in ('wrong_outcome', 'repeat_wrong_outcome', 'picked_wrong_outcome'):
                            assertion = 'AssertionError: assert eval (_choice106_state(1))' if case == 'picked_wrong_outcome' else 'AssertionError: assert eval (choice_visits == 2)' if case == 'repeat_wrong_outcome' else 'AssertionError: assert eval (choice_flag is False)'
                            row['passed'] = result.exit_code != 0 and '[rpytest] Status: FAILED' in result.output and assertion in result.output and 'CHOICE_101_WRONG_ACCEPTED' not in result.output and 'CHOICE_105_WRONG_ACCEPTED' not in result.output and 'CHOICE_106_WRONG_ACCEPTED' not in result.output
                        else:
                            row['passed'] = result.exit_code == 0 and (marker is None or result.output.count(marker) == 1 and '[rpytest] Status: PASSED' in result.output)
                        assert row['passed'] and not result.timed_out and not result.output_limited, name
                        if case == 'picked_mark_save':
                            receipt['savedArtifacts'] = {str(p.relative_to(scratch)): digest(p.read_bytes()) for p in scratch.rglob('choice106-LT1.save')}
                            assert receipt['savedArtifacts'], 'successful process must close with a real save artifact'

                        assert all((game / 'game' / name).read_bytes() == source.encode() for name, source in sources.items())
            finally:
                os.environ.clear()
                os.environ.update(old_env)
        receipt['passed'] = True
    finally:
        receipt['cleanupComplete'] = scratch is None or not scratch.exists()
        (args.output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print('Selected Choice normal-entry compile, lint and play children passed.')


if __name__ == '__main__':
    main()
