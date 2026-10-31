"""Bind unchanged CI1 helper/native evidence to the normal-only L07 correction."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from runtime_probe_cases import runtime_report_ok

REPO = Path(__file__).resolve().parents[2]
CI1 = 'd422d76fce1262fd7c625b3d73a510af7611fdab'
CORRECTION_FILES = {
    '.github/workflows/shared-style.yml', '.github/workflows/screens-source.yml',
    'app/scripts/qualify-shared-style.py', 'app/scripts/test_qualify_shared_style.py',
    'app/scripts/audit-shared-style-reuse.py',
    'app/tests/shared-style.browser.mjs',
}


def validate(directory):
    directory = Path(directory)
    changed = subprocess.check_output(['git', 'diff', '--name-only', CI1, 'HEAD'], cwd=REPO, text=True).splitlines()
    assert all(path.startswith('docs/') or path in CORRECTION_FILES for path in changed), changed
    assert (directory / 'candidate.txt').read_text().strip() == CI1
    package = json.loads((directory / 'package-identity.json').read_text(encoding='utf-8-sig'))
    binary = (directory / 'loomlight.exe').read_bytes()
    binary_hash = hashlib.sha256(binary).hexdigest()
    assert package['candidate'] == CI1 and package['architecture'] == 'Windows x64'
    assert binary_hash == package['executableSHA256'].lower() == 'fbfbc97fc2f69e969dad161c97bc173730c6b4f4d5dcd33a01173cb764e3d53d'
    pe = int.from_bytes(binary[0x3c:0x40], 'little')
    assert binary[:2] == b'MZ' and binary[pe:pe+4] == b'PE\0\0' and binary[pe+4:pe+6] == b'\x64\x86'
    native = json.loads((directory / 'native/runtime-ui-shared-style.json').read_text())
    assert native['passed'] is True and native['exitCode'] == 0 and native['timedOut'] is False
    assert not native['externalErrors'] and len(native['reports']) == 1
    assert runtime_report_ok('shared-style', native['reports'][0], target_os='windows')
    helper = json.loads((directory / 'helper/result.json').read_text())
    assert helper['passed'] is True and helper['pendingMatchesAccepted'] is True
    assert helper['sdkCliProcesses'] == 3 and helper['helperSessions'] == len(helper['shutdowns']) == 1
    assert len(helper['records']) == 32
    assert all(row == dict(cleanupComplete=True, cooperative=True, exitCode=0) for row in helper['shutdowns'])
    renderer = REPO / 'app/src-core/src/screens/canvas-renderer.rpy'
    assert helper['rendererSHA256'] == hashlib.sha256(renderer.read_bytes()).hexdigest()
    assert (directory / 'helper/accepted.json').read_bytes() == (directory / 'inputs/accepted.json').read_bytes()
    receipts = ['helper/result.json', 'native/runtime-ui-shared-style.json', 'package-identity.json']
    return dict(sourceRun=41175476001, sourceAttempt=1, sourceCandidate=CI1,
                candidate=subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip(),
                executableSHA256=binary_hash, unchangedProductionInputs=True,
                reusedSlices=['helper-producer', 'packaged-native'],
                receiptHashes={path: hashlib.sha256((directory / path).read_bytes()).hexdigest() for path in receipts})


if __name__ == '__main__':
    result = validate(sys.argv[1])
    Path(sys.argv[2]).write_text(json.dumps(result, indent=2) + '\n')
    print('PASS unchanged CI1 helper/native evidence; normal qualification still required.')
