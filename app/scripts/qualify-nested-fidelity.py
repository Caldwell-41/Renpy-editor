"""Explicit L19 normal-game proof, offline preflight or exact comparison."""
import argparse
import ast
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap

from nested_fidelity import (ASPECTS, ASSETS, FIXTURE_ROOT, FIXTURES, OUTCOME, REPO,
                             compare, digest, inputs, validate_accepted)

# Preserve the historical L18 runner and its accounting. Reuse its bounded SDK
# command adapter without selecting or executing any historical proof branch.
_spec = importlib.util.spec_from_file_location('base_help_qualification', REPO / 'app/scripts/qualify-base-help-fidelity.py')
_base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_base)
PROOF = FIXTURE_ROOT / 'nested-fidelity-proof.rpy'


def preflight(accepted_path, archive, checksums, candidate):
    accepted = validate_accepted(json.loads(accepted_path.read_text()))
    assert _base.expected_sha256(checksums.read_text(), archive.name) == _base.SDK_SHA
    assert digest(archive.read_bytes()) == _base.SDK_SHA
    source = PROOF.read_text().split('screen nested_fidelity_capture():')[0].split('init python:\n', 1)[1]
    ast.parse(textwrap.dedent(source))
    actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    assert actual == candidate, 'Different candidate'
    subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', 'app/src-core', 'app/scripts/nested_fidelity.py', 'app/scripts/qualify-nested-fidelity.py', *[str(FIXTURE_ROOT / name) for name in FIXTURES.values()], str(PROOF)], cwd=REPO, check=True)
    return dict(outcome=OUTCOME, candidate=candidate, target=_base.target(), acceptedSHA256=digest(accepted_path.read_bytes()),
                inputs=inputs(accepted), proofSHA256=digest(PROOF.read_bytes()), startedSDKProcesses=0,
                plannedSDKProcesses=dict(compile=1, lint=1, normalGame=2, adapterValidationAndDiscovery=3, hiddenHelper=1), totalSDKProcesses=8)


def reference(args):
    manifest = preflight(args.accepted, args.archive, args.checksums, args.candidate)
    accepted = json.loads(args.accepted.read_text())
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    shutil.copyfile(args.accepted, output / 'accepted.json')
    (output / 'preflight.json').write_text(json.dumps(manifest, indent=2) + '\n')
    receipt = dict(outcome=OUTCOME, role='normal-game', target=manifest['target'], candidate=args.candidate,
                   acceptedSHA256=manifest['acceptedSHA256'], inputs=inputs(accepted), passed=False,
                   rendererSHA256=digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()),
                   commands=[], records=[], sdkProcesses=0, sourceUnchanged=False, cleanupComplete=False)
    scratch = None
    try:
        scratch = Path(tempfile.mkdtemp(prefix='loomlight-nested-normal-'))
        receipt['scratchPath'] = str(scratch)
        _base.install_verified_tar(args.archive, _base.SDK_SHA, scratch / 'sdk')
        launcher = _base.launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
        project = scratch / 'project'
        for path, row in accepted['files'].items():
            destination = project / path; destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(row['text'].encode())
        for path, fixture in ASSETS.values():
            destination = project / path; destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(FIXTURE_ROOT / fixture, destination)
        env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if manifest['target'] == 'windows-x64' else 'gl2', RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1', RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
        env.pop('SDL_VIDEODRIVER', None); env.pop('SDL_RENDER_DRIVER', None)
        for width, height in ASPECTS:
            (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight nested fidelity"\ndefine config.screen_width = {width}\ndefine config.screen_height = {height}\ndefine config.sound = False\ndefine config.save_directory = None\n')
            case = next(case for case in accepted['cases'] if (case['request']['width'], case['request']['height']) == (width, height))
            data = dict(NESTED_CASE=case, NESTED_INPUTS=inputs(accepted), NESTED_OUTPUT=str(output))
            variables = json.loads(accepted['files']['.renpy-editor/authoring.json']['text'])['variables']
            for sample in case['request']['variableSamples']:
                variable = next(variable for variable in variables if variable['id'] == sample['variableId'])
                assert variable['technicalName'] == 'nested_caption' and isinstance(sample['value'], str)
                data[variable['technicalName']] = sample['value']
            initializer = 'init python:\n' + ''.join(f'    {key} = {value!r}\n' for key, value in data.items())
            (project / 'game/nested_proof.rpy').write_text(initializer + '\n' + PROOF.read_text())
            commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if (width, height) == ASPECTS[0] else []
            for operation, arguments in [*commands, ('run', ['run'])]:
                row = dict(name=operation, aspect=[width,height], charged=1, started=None, uncertainStart=True, cleanupComplete=False)
                receipt['commands'].append(row); receipt['sdkProcesses'] += 1
                (output / 'launch-manifest.json').write_text(json.dumps(receipt, indent=2) + '\n')
                previous = dict(os.environ)
                try:
                    os.environ.clear(); os.environ.update(env)
                    result = _base.run_reference_command(tuple(map(str, [*launcher, project, *arguments])), row)
                except BaseException:
                    (output / f'{width}x{height}-{operation}.log').write_text(row.get('partialOutput', ''))
                    raise
                finally:
                    os.environ.clear(); os.environ.update(previous)
                (output / f'{width}x{height}-{operation}.log').write_text(result.output)
                assert result.exit_code == 0 and not result.timed_out and not result.output_limited
                if operation == 'run':
                    records = [json.loads(line.removeprefix('NESTED_FIDELITY ')) for line in result.output.splitlines() if line.startswith('NESTED_FIDELITY ')]
                    assert len(records) == 1 and records[0]['aspect'] == [width, height]
                    receipt['records'].extend(records)
        receipt['sourceUnchanged'] = all(digest((project / path).read_bytes()) == sha for path, sha in inputs(accepted).items())
        assert receipt['sourceUnchanged'] and len(receipt['records']) == 2
        receipt['passed'] = True
    except BaseException as error:
        receipt['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        receipt['confirmedSDKProcesses'] = sum(row.get('started') is True for row in receipt['commands'])
        receipt['uncertainSDKProcesses'] = sum(row.get('uncertainStart', True) for row in receipt['commands'])
        reaped = all(row.get('cleanupComplete') is True and row.get('processReaped') is True and row.get('uncertainStart') is False for row in receipt['commands'])
        try:
            if scratch is not None and scratch.exists() and reaped:
                shutil.rmtree(scratch)
        except OSError as error:
            receipt['cleanupFailure'] = str(error)
        receipt['cleanupComplete'] = reaped and (scratch is None or not scratch.exists())
        receipt['passed'] = receipt['passed'] and receipt['cleanupComplete']
        (output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    assert receipt['passed']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='operation', required=True)
    for operation in ('preflight', 'reference'):
        command = sub.add_parser(operation)
        for name in ('accepted', 'archive', 'checksums'):
            command.add_argument('--' + name, type=Path, required=True)
        command.add_argument('--candidate', required=True)
        if operation == 'reference':
            command.add_argument('--output', type=Path, required=True)
            command.add_argument('--allow-fixture-execution', action='store_true', required=True)
    command = sub.add_parser('compare')
    for name in ('helper', 'normal', 'output', 'core-test'):
        command.add_argument('--' + name, type=Path, required=True)
    command.add_argument('--candidate', required=True)
    args = parser.parse_args()
    if args.operation == 'preflight':
        print(json.dumps(preflight(args.accepted, args.archive, args.checksums, args.candidate), indent=2))
    elif args.operation == 'reference':
        reference(args)
    else:
        print(json.dumps(compare(args.helper, args.normal, args.output, expected_candidate=args.candidate, core_test=args.core_test), indent=2))


if __name__ == '__main__':
    main()
