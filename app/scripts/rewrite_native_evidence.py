"""Require actual native-driver receipts and intact captures before stage acknowledgement."""
import hashlib
import json
import struct
from pathlib import Path

NATIVE_STAGES = {'observe-light', 'observe-dark', 'observe-narrow', 'physical-send', 'physical-accept'}


def validate_native_stage(directory, stage, pid, executable_digest, continuing=False):
    directory = Path(directory)
    receipt = json.loads((directory / f'{stage}.json').read_text(encoding='utf-8-sig'))
    if stage not in NATIVE_STAGES or receipt.get('stage') != stage or receipt.get('passed') is not True:
        raise ValueError('Successful exact native stage required')
    if receipt.get('processId') != pid or receipt.get('executableSHA256') != executable_digest:
        raise ValueError('Owned native process/binary evidence mismatch')
    if receipt.get('inputDesktop') != 'Default' or receipt.get('layer') != 'Windows UI Automation observation and OS SendInput; automated, not human acceptance':
        raise ValueError('Interactive native evidence required')
    if continuing and receipt.get('action') != 'continueScene':
        raise ValueError('Changed-action native evidence required')
    checks = receipt.get('checks', {})
    required = {'ownedWindow', 'nativeControls', 'captureNonblank', 'controlsInViewport'}
    required |= {'themeLight'} if stage == 'observe-light' else set()
    required |= {'themeDark'} if stage == 'observe-dark' else set()
    required |= {'compactWidth'} if stage == 'observe-narrow' else set()
    required |= {'osMouseInput', 'inertProposalObserved'} if stage == 'physical-send' else set()
    required |= {'osMouseInput', 'savedOnceObserved'} if stage == 'physical-accept' else set()
    if any(checks.get(name) is not True for name in required):
        raise ValueError('Required native observation/action is missing')
    captures = receipt.get('captures')
    expected = 2 if stage.startswith('physical-') else 1
    if not isinstance(captures, list) or len(captures) != expected:
        raise ValueError('Every native before/after capture required')
    if len({capture.get('file') for capture in captures}) != expected:
        raise ValueError('Distinct native captures required')
    for capture in captures:
        name = capture.get('file', '')
        if not name.startswith(stage + '-') or any(c in name for c in '/\\:') or Path(name).name != name or not name.endswith('.png'):
            raise ValueError('Contained native PNG required')
        data = (directory / name).read_bytes()
        if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR' or len(data) < 512:
            raise ValueError('Native PNG missing or invalid')
        dimensions = list(struct.unpack('>II', data[16:24]))
        if dimensions != [capture.get('width'), capture.get('height')] or min(dimensions) < 100:
            raise ValueError('Native capture dimensions mismatch')
        if capture.get('sha256') != hashlib.sha256(data).hexdigest() or capture.get('sampleRange', 0) < 20:
            raise ValueError('Native capture changed or blank')
    if stage == 'observe-light' and not captures[0].get('meanBrightness', 0) > 130:
        raise ValueError('Light screenshot evidence missing')
    if stage == 'observe-dark' and not 0 < captures[0].get('meanBrightness', 255) < 120:
        raise ValueError('Dark screenshot evidence missing')
    if stage == 'observe-narrow' and (receipt.get('dpi', 0) < 96 or captures[0]['width'] * 96 / receipt['dpi'] > 800):
        raise ValueError('Compact screenshot evidence missing')
    if stage.startswith('physical-') and captures[0]['sha256'] == captures[1]['sha256']:
        raise ValueError('Native action did not change captured state')
    return receipt
