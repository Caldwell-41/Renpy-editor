#!/usr/bin/env python3
"""One owned native reference-library launch. No credential/network/SDK execution.

Phase 1 stops at named observation markers for native keyboard/focus/screenshots;
create <stage>.done in the printed fixture root only after the observed action.
Phase 2 reuses the same fixture and requires byte-exact persisted metadata.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

p = argparse.ArgumentParser()
p.add_argument('--executable', type=Path, required=True)
p.add_argument('--root', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--phase', type=int, choices=(1, 2), required=True)
p.add_argument('--reopen-after-observation-timeout', action='store_true',
               help='Verify persisted data after a recorded phase-1 visual pause timeout; does not accept phase 1')
a = p.parse_args()
if not a.executable.is_file() or not a.root.name.startswith('loomlight-reference-'):
    raise SystemExit('Owned executable/fixture required')
if a.phase == 1 and a.root.exists():
    raise SystemExit('Fresh fixture required; no replay')
if a.phase == 2 and not (a.output / 'phase-1.json').is_file():
    if not a.reopen_after_observation_timeout:
        raise SystemExit('Phase 1 acceptance required')
    reports = []
    for line in (a.output / 'phase-1.log').read_text().splitlines():
        try:
            item = json.loads(line)
        except ValueError:
            continue
        if item.get('evidence') == 'runtime-ui-packaged':
            reports.append(item)
    if len(reports) != 1 or reports[0].get('passed') is not False:
        raise SystemExit('One failed phase-1 receipt required')
    details = reports[0].get('details', {})
    if (details.get('stage') != 'observe-light' or
        details.get('failure') != 'Error: Observation timeout at observe-light' or
        'Close and reopen preserve exact complete metadata' not in details.get('checks', [])):
        raise SystemExit('Only a diagnosed visual observation timeout may resume reopen')
a.output.mkdir(parents=True, exist_ok=True)
metadata = a.root / 'synthetic-project/.renpy-editor/references.json'
before = metadata.read_bytes() if a.phase == 2 else None
backup = None
started = time.monotonic()
env = dict(os.environ, LOOMLIGHT_RUNTIME_UI_PROBE='reference-library',
           LOOMLIGHT_REFERENCE_PROBE_ROOT=str(a.root), LOOMLIGHT_REFERENCE_PROBE_PHASE=str(a.phase))
# The fixed owned root must be below the application's temp directory.
env['TMPDIR'] = str(a.root.parent)
process = subprocess.Popen([str(a.executable.resolve())], env=env, stdout=subprocess.PIPE,
                           stderr=subprocess.STDOUT, text=True, start_new_session=True)
print(json.dumps({'evidence':'reference-launch','phase':a.phase,'pid':process.pid,
                  'executableSHA256':hashlib.sha256(a.executable.read_bytes()).hexdigest()}), flush=True)
report = None
try:
    with (a.output / f'phase-{a.phase}.log').open('x') as log:
        for line in process.stdout:
            log.write(line); log.flush()
            try:
                item = json.loads(line)
            except ValueError:
                continue
            print(json.dumps(item), flush=True)
            if item.get('evidence') == 'reference-stage':
                stage = item['stage']
                if stage == 'external-edit':
                    value = json.loads(metadata.read_bytes()); value['externalExtension'] = {'retained':True}
                    temporary = metadata.with_suffix('.external.json'); temporary.write_text(json.dumps(value,ensure_ascii=False))
                    os.replace(temporary, metadata)
                elif stage == 'malformed':
                    backup = metadata.read_bytes(); metadata.write_bytes(b'{"schemaVersion":1, malformed')
                elif stage == 'newer':
                    metadata.write_bytes(b'{"schemaVersion":2,"futureLibrary":{"retained":true}}')
                elif stage == 'restore':
                    if backup is None: raise ValueError('No retained original')
                    metadata.write_bytes(backup)
                else:
                    continue
                (a.root / f'{stage}.done').touch()
            if item.get('evidence') == 'runtime-ui-packaged':
                report = item
    code = process.wait(timeout=15)
    if code or not report or not report.get('passed'):
        raise ValueError('Native required proof failed; retain evidence, no automatic replay')
    after = metadata.read_bytes()
    if before is not None and before != after:
        raise ValueError('Process reopen changed persisted metadata')
    report['metadataSHA256'] = hashlib.sha256(after).hexdigest()
    report['elapsedSeconds'] = round(time.monotonic()-started,2)
    (a.output / f'phase-{a.phase}.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({'evidence':'reference-accepted','phase':a.phase,'metadataSHA256':report['metadataSHA256']}),flush=True)
finally:
    if process.poll() is None:
        process.terminate()
        try: process.wait(timeout=10)
        except subprocess.TimeoutExpired: process.kill(); process.wait(timeout=10)
