"""Shared command accounting and cleanup for accepted-source normal-game proofs."""
import importlib.util
import json
import os
from pathlib import Path
import shutil

# Keep the historical runner and its bounded process adapter as the SDK owner.
_spec = importlib.util.spec_from_file_location('base_help_qualification', Path(__file__).with_name('qualify-base-help-fidelity.py'))
sdk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sdk)


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


def finalize(receipt, scratch, output):
    receipt['confirmedSDKProcesses'] = sum(row.get('started') is True for row in receipt['commands'])
    receipt['uncertainSDKProcesses'] = sum(row.get('uncertainStart', True) for row in receipt['commands'])
    reaped = all(row.get('cleanupComplete') is True and row.get('processReaped') is True and row.get('uncertainStart') is False for row in receipt['commands'])
    try:
        if scratch is not None and scratch.exists() and reaped:
            assert scratch.is_absolute() and scratch.name.startswith(('loomlight-nested-normal-', 'loomlight-sample-normal-'))
            shutil.rmtree(scratch)
    except OSError as error:
        receipt['cleanupFailure'] = str(error)
    receipt['cleanupComplete'] = reaped and (scratch is None or not scratch.exists())
    receipt['passed'] = receipt['passed'] and receipt['cleanupComplete']
    (output / 'result.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
