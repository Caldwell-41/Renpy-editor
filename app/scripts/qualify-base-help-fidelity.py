"""Explicit L18 normal-game execution or offline preflight/exact comparison."""
import argparse
import ast
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import tempfile
import textwrap

from base_help_fidelity import (ASPECTS, ASSETS, FIXTURE, OUTCOME, REPO, SOURCE_PATH,
                                compare, digest, inputs, validate_accepted)

sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import launcher_for, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
PROOF = REPO / 'tests/fixtures/phase-3b-screens/base-help-fidelity-proof.rpy'


def target():
    current = (platform.system(), platform.machine().lower())
    assert current in [('Darwin', 'arm64'), ('Windows', 'amd64'), ('Windows', 'x86_64')], current
    return 'macos-arm64' if current[0] == 'Darwin' else 'windows-x64'


def preflight(accepted_path, archive, checksums):
    accepted = validate_accepted(json.loads(accepted_path.read_text()))
    assert expected_sha256(checksums.read_text(), archive.name) == SDK_SHA
    assert digest(archive.read_bytes()) == SDK_SHA, 'SDK archive checksum differs'
    trusted_python = PROOF.read_text().split('screen base_help_fidelity_capture():')[0].removeprefix('# L18 normal-game instrumentation. Never copied into the hidden helper.\ninit python:\n')
    ast.parse(textwrap.dedent(trusted_python))
    return dict(outcome=OUTCOME, target=target(), acceptedSHA256=digest(accepted_path.read_bytes()),
                fixtureSHA256=digest(FIXTURE.read_bytes()), proofSHA256=digest(PROOF.read_bytes()),
                sdkArchiveSHA256=SDK_SHA, inputs=inputs(accepted), startedProcesses=0,
                plannedSDKProcesses=dict(compile=1, lint=1, normalGame=2, adapterValidationAndDiscovery=3, hiddenHelper=1),
                totalSDKProcesses=8)


def reference(args):
    manifest = preflight(args.accepted, args.archive, args.checksums)
    accepted = json.loads(args.accepted.read_text())
    output = args.output.resolve(); output.mkdir(parents=True, exist_ok=False)
    (output / 'preflight.json').write_text(json.dumps(manifest, indent=2) + '\n')
    shutil.copyfile(args.accepted, output / 'accepted.json')
    receipt = dict(outcome=OUTCOME, role='normal-game', target=target(), passed=False,
                   candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                   acceptedSHA256=manifest['acceptedSHA256'], inputs=inputs(accepted), sdkProcesses=0,
                   rendererSHA256=digest((REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()),
                   commands=[], records=[], cleanupComplete=False, sourceUnchanged=False)
    scratch = None
    try:
        with tempfile.TemporaryDirectory(prefix='loomlight-base-help-normal-') as temporary:
            scratch = Path(temporary)
            install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            launcher = launcher_for(scratch / 'sdk/renpy-8.5.3-sdk')
            project = scratch / 'project'; (project / 'game/ui').mkdir(parents=True)
            (project / SOURCE_PATH).write_bytes(accepted['files'][SOURCE_PATH]['text'].encode())
            for path, fixture in ASSETS.values():
                destination = project / path; destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(fixture, destination)
            env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if target() == 'windows-x64' else 'gl2',
                       RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1',
                       RENPY_PATH_TO_SAVES=str(scratch / 'saves'))
            env.pop('SDL_VIDEODRIVER', None); env.pop('SDL_RENDER_DRIVER', None)
            for width, height in ASPECTS:
                (project / 'game/options.rpy').write_text(f'define config.name = "Loomlight base Help fidelity"\ndefine config.screen_width = {width}\ndefine config.screen_height = {height}\ndefine config.sound = False\ndefine config.save_directory = None\n')
                cases = [case for case in accepted['cases'] if (case['request']['width'], case['request']['height']) == (width, height)]
                data = dict(BASE_HELP_CASES=cases, BASE_HELP_INPUTS=inputs(accepted), BASE_HELP_OUTPUT=str(output))
                initializer = 'init python:\n' + ''.join(f'    {key} = {value!r}\n' for key, value in data.items())
                (project / 'game/base_help_proof.rpy').write_text(initializer + '\n' + PROOF.read_text())
                commands = [('compile', ['compile']), ('lint', ['lint', '--error-code'])] if (width, height) == ASPECTS[0] else []
                commands.append(('run', ['run']))
                for operation, arguments in commands:
                    # Retain intent before each process attempt. Actual OSError refusal
                    # starts no SDK; failed/cancelled starts remain charged.
                    row = dict(name=operation, aspect=[width, height], started=False)
                    receipt['commands'].append(row)
                    (output / 'launch-manifest.json').write_text(json.dumps(receipt, indent=2) + '\n')
                    previous = dict(os.environ)
                    try:
                        os.environ.clear(); os.environ.update(env)
                        receipt['sdkProcesses'] += 1; row['started'] = True
                        command = run_bounded(tuple(map(str, [*launcher, project, *arguments])), timeout_seconds=60, output_limit=2_000_000)
                    except OSError:
                        receipt['sdkProcesses'] -= 1; row['started'] = False
                        raise
                    finally:
                        os.environ.clear(); os.environ.update(previous)
                    row.update(exitCode=command.exit_code, timedOut=command.timed_out, outputLimited=command.output_limited)
                    (output / f'{width}x{height}-{operation}.log').write_text(command.output)
                    assert not command.exit_code and not command.timed_out and not command.output_limited, row
                    if operation == 'run':
                        rows = [json.loads(line.removeprefix('BASE_HELP_FIDELITY ')) for line in command.output.splitlines() if line.startswith('BASE_HELP_FIDELITY ')]
                        assert len(rows) == 1 and len(rows[0]) == 4, 'Incomplete normal-game captures'
                        receipt['records'].extend(rows[0])
            receipt['sourceUnchanged'] = all(digest((project / path).read_bytes()) == sha for path, sha in inputs(accepted).items())
            assert receipt['sourceUnchanged'] and len(receipt['records']) == 8
            receipt['passed'] = True
    finally:
        receipt['cleanupComplete'] = scratch is not None and not scratch.exists()
        (output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n')
    assert receipt['passed'] and receipt['cleanupComplete']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest='operation', required=True)
    for operation in ['preflight', 'reference']:
        command = sub.add_parser(operation)
        for key in ['accepted', 'archive', 'checksums']:
            command.add_argument('--' + key, type=Path, required=True)
        if operation == 'reference':
            command.add_argument('--output', type=Path, required=True)
            command.add_argument('--allow-fixture-execution', action='store_true', required=True)
    command = sub.add_parser('compare')
    for key in ['helper', 'normal', 'output']:
        command.add_argument('--' + key, type=Path, required=True)
    args = parser.parse_args()
    if args.operation == 'preflight':
        print(json.dumps(preflight(args.accepted, args.archive, args.checksums), indent=2))
    elif args.operation == 'reference':
        reference(args)
    else:
        print(json.dumps(compare(args.helper, args.normal, args.output), indent=2))


if __name__ == '__main__':
    main()
