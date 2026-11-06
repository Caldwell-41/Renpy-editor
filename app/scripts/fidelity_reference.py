"""Shared normal-game proof runner for accepted-source canvas qualification."""
import argparse
import ast
from dataclasses import dataclass, field
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import textwrap
from typing import Callable

from base_help_fidelity import digest
from fidelity_comparison import ASPECTS, FIXTURE_ROOT, REPO, inputs

# Keep the historical runner and its bounded process adapter as the SDK owner.
_spec = importlib.util.spec_from_file_location('base_help_qualification', Path(__file__).with_name('qualify-base-help-fidelity.py'))
sdk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sdk)


@dataclass(frozen=True)
class Proof:
    """One normal-game proof. `name` ('nested', 'sample') names its fixture, screen and output marker."""
    name: str
    outcome: str
    inputs: tuple  # Repository paths, beyond the shared ones, that must match the candidate.
    assets: Callable[[], dict]  # Project-relative path -> bytes.
    admit: Callable[[dict], dict]
    initializer: Callable[[dict, list, Path], dict]  # (accepted, cases at one aspect, output) -> proof globals.
    compare: Callable
    env: dict = field(default_factory=dict)

    @property
    def fixture(self):
        return FIXTURE_ROOT / f'{self.name}-fidelity-proof.rpy'

    @property
    def marker(self):
        return f'{self.name.upper()}_FIDELITY '


def preflight(proof, accepted_path, archive, checksums, candidate):
    accepted = proof.admit(json.loads(accepted_path.read_text(encoding='utf-8')))
    assert sdk.expected_sha256(checksums.read_text(encoding='utf-8'), archive.name) == sdk.SDK_SHA
    assert digest(archive.read_bytes()) == sdk.SDK_SHA
    source = proof.fixture.read_text(encoding='utf-8').split(f'screen {proof.name}_fidelity_capture():')[0].split('init python:\n', 1)[1]
    ast.parse(textwrap.dedent(source))
    actual = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    assert actual == candidate, 'Different candidate'
    clean = ['app/src-core', 'app/scripts/fidelity_reference.py', 'app/scripts/fidelity_comparison.py', str(proof.fixture), *proof.inputs]
    subprocess.run(['git', 'diff', '--quiet', 'HEAD', '--', *clean], cwd=REPO, check=True)
    return dict(outcome=proof.outcome, candidate=candidate, target=sdk.target(), acceptedSHA256=digest(accepted_path.read_bytes()),
                inputs=inputs(accepted), proofSHA256=digest(proof.fixture.read_bytes()), startedSDKProcesses=0,
                plannedSDKProcesses=dict(compile=1, lint=1, normalGame=2, adapterValidationAndDiscovery=3, hiddenHelper=1), totalSDKProcesses=8)


def run_command(launcher, project, arguments, operation, aspect, env, output, receipt):
    width, height = aspect
    row = dict(name=operation, aspect=list(aspect), charged=1, started=None, uncertainStart=True, cleanupComplete=False)
    receipt['commands'].append(row)
    receipt['sdkProcesses'] += 1
    (output / 'launch-manifest.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    previous = dict(os.environ)
    try:
        os.environ.clear()
        os.environ.update(env)
        result = sdk.run_reference_command(tuple(map(str, [*launcher, project, *arguments])), row)
    except BaseException:
        (output / f'{width}x{height}-{operation}.log').write_text(row.get('partialOutput', ''), encoding='utf-8')
        raise
    finally:
        os.environ.clear()
        os.environ.update(previous)
    (output / f'{width}x{height}-{operation}.log').write_text(result.output, encoding='utf-8')
    assert result.exit_code == 0 and not result.timed_out and not result.output_limited
    return result


def finalize(receipt, scratch, prefix, output):
    receipt['confirmedSDKProcesses'] = sum(row.get('started') is True for row in receipt['commands'])
    receipt['uncertainSDKProcesses'] = sum(row.get('uncertainStart', True) for row in receipt['commands'])
    reaped = all(row.get('cleanupComplete') is True and row.get('processReaped') is True and row.get('uncertainStart') is False for row in receipt['commands'])
    try:
        if scratch is not None and scratch.exists() and reaped:
            assert scratch.is_absolute() and scratch.name.startswith(prefix)
            shutil.rmtree(scratch)
    except OSError as error:
        receipt['cleanupFailure'] = str(error)
    receipt['cleanupComplete'] = reaped and (scratch is None or not scratch.exists())
    receipt['passed'] = receipt['passed'] and receipt['cleanupComplete']
    (output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')


def reference(proof, args):
    manifest = preflight(proof, args.accepted, args.archive, args.checksums, args.candidate)
    accepted = json.loads(args.accepted.read_text(encoding='utf-8'))
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    shutil.copyfile(args.accepted, output / 'accepted.json')
    (output / 'preflight.json').write_text(json.dumps(manifest, indent=2) + '\n')
    receipt = dict(outcome=proof.outcome, role='normal-game', target=manifest['target'], candidate=args.candidate,
                   acceptedSHA256=manifest['acceptedSHA256'], inputs=inputs(accepted), passed=False,
                   rendererSHA256=digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()),
                   commands=[], records=[], sdkProcesses=0, sourceUnchanged=False, cleanupComplete=False)
    scratch, prefix = None, f'loomlight-{proof.name}-normal-'
    try:
        scratch = Path(tempfile.mkdtemp(prefix=prefix))
        receipt['scratchPath'] = str(scratch)
        sdk.install_verified_tar(args.archive, sdk.SDK_SHA, scratch / 'sdk')
        launcher = sdk.launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
        project = scratch / 'project'
        files = {path: row['text'].encode() for path, row in accepted['files'].items()}
        for path, raw in {**files, **proof.assets()}.items():
            destination = project / path; destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(raw)
        env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if manifest['target'] == 'windows-x64' else 'gl2', RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1', RENPY_PATH_TO_SAVES=str(scratch / 'saves'), **proof.env)
        env.pop('SDL_VIDEODRIVER', None); env.pop('SDL_RENDER_DRIVER', None)
        for width, height in ASPECTS:
            (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight {proof.name} fidelity"\ndefine config.screen_width = {width}\ndefine config.screen_height = {height}\ndefine config.sound = False\ndefine config.save_directory = None\n')
            cases = [dict(case) for case in accepted['cases'] if (case['request']['width'], case['request']['height']) == (width, height)]
            data = proof.initializer(accepted, cases, output)
            initializer = 'init python:\n' + ''.join(f'    {key} = {value!r}\n' for key, value in data.items())
            (project / f'game/{proof.name}_proof.rpy').write_text(initializer + '\n' + proof.fixture.read_text(encoding='utf-8'), encoding='utf-8')
            commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if (width, height) == ASPECTS[0] else []
            for operation, arguments in [*commands, ('run', ['run'])]:
                result = run_command(launcher, project, arguments, operation, (width, height), env, output, receipt)
                if operation == 'run':
                    records = [json.loads(line.removeprefix(proof.marker)) for line in result.output.splitlines() if line.startswith(proof.marker)]
                    assert len(records) == len(cases) and all(row['aspect'] == [width, height] for row in records)
                    receipt['records'].extend(records)
        receipt['sourceUnchanged'] = all(digest((project / path).read_bytes()) == sha for path, sha in inputs(accepted).items())
        assert receipt['sourceUnchanged'] and len(receipt['records']) == len(accepted['cases'])
        receipt['passed'] = True
    except BaseException as error:
        receipt['failure'] = dict(type=type(error).__name__, message=str(error))
        raise
    finally:
        finalize(receipt, scratch, prefix, output)
    assert receipt['passed']


def main(proof, description):
    parser = argparse.ArgumentParser(description=description)
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
        print(json.dumps(preflight(proof, args.accepted, args.archive, args.checksums, args.candidate), indent=2))
    elif args.operation == 'reference':
        reference(proof, args)
    else:
        print(json.dumps(proof.compare(args.helper, args.normal, args.output, expected_candidate=args.candidate, core_test=args.core_test), indent=2))
