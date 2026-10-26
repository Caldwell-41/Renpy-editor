"""Admit the selected L02 SDK case only with its named result and matching receipts."""
import hashlib
import json
from pathlib import Path
import re
import sys

CASE = 'lifecycle::runtime_tests::owned_composition_sdk_preview_and_cleanup'


def verify(log: Path, evidence: Path, accepted: Path, target_os: str) -> None:
    output = log.read_text(encoding='utf-8')
    if len(re.findall(r'^test ' + re.escape(CASE) + r' \.\.\. ok$', output, re.M)) != 1:
        raise ValueError('The required named SDK case did not pass exactly once')
    if len(re.findall(r'^test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; \d+ filtered out;.*$', output, re.M)) != 1:
        raise ValueError('One executed SDK test with no failures or ignored cases is required')
    result = json.loads((evidence / 'result.json').read_text(encoding='utf-8'))
    digest = hashlib.sha256(accepted.read_bytes()).hexdigest()
    if (result.get('passed') is not True or result.get('composition') is not True
            or result.get('nativeWebView') is not False or result.get('acceptedSHA256') != digest):
        raise ValueError('The composition receipt must match the renderer-accepted source')
    receipts = result.get('receipts', [])
    if [r.get('kind') for r in receipts] != ['validate', 'run']:
        raise ValueError('Compile/lint and deliberate preview receipts are required')
    for receipt in receipts:
        kind = receipt['kind']
        terminal = json.loads((evidence / f'{kind}-terminal.json').read_text(encoding='utf-8'))
        status = receipt.get('terminal', {})
        exit_code = status.get('exitCode')
        clean_exit = exit_code == 0 or kind == 'run' and (
            target_os == 'windows' and exit_code == -1073741510
            or target_os == 'macos' and 'exitCode' in status and exit_code is None)
        diagnostics = terminal.get('diagnostics', {}).get('diagnostics')
        preview = receipt.get('preparation', {}).get('preview', {})
        if (status != terminal.get('status') or status.get('cleanupComplete') is not True
                or status.get('outputTruncated') is not False or not clean_exit
                or status.get('phase') != ('exited' if kind == 'validate' else 'cancelled')
                or not isinstance(diagnostics, list) or any(d.get('severity') == 'error' for d in diagnostics)
                or preview.get('expectedRevision') != digest or preview.get('screenName') != 'travel_notes'):
            raise ValueError(f'The {kind} receipt lacks successful cleanup or matching preview input')
    if ('OWNED_COMPOSITION_PREVIEW ' not in receipts[1]['terminal'].get('output', '')
            or not (evidence / 'preview.png').read_bytes().startswith(b'\x89PNG\r\n\x1a\n')):
        raise ValueError('The deliberate preview must retain its actual render')


if __name__ == '__main__':
    if len(sys.argv) != 5 or sys.argv[4] not in ('windows', 'macos'):
        raise SystemExit('usage: composition_sdk_evidence.py LOG EVIDENCE ACCEPTED_SOURCE windows|macos')
    verify(*(Path(value) for value in sys.argv[1:4]), sys.argv[4])
    print('The named composition SDK case and matching cleanup receipts passed.')
