"""Offline arithmetic for the standalone Mac recorder; final acceptance is external."""
import argparse
import hashlib
import json
import math
import re
from pathlib import Path


def analyze(plan, events, frames, session):
    samples = [a['sample'] for a in plan['actions'] if a.get('sample')]
    expected = {s['id']: s for s in samples}
    if not samples or len(expected) != len(samples):
        raise ValueError('Unique nonempty sample IDs required')
    if (plan.get('endpoint') not in ('helper-content', 'editing-guide')
            or any(s['series'] not in ('text', 'move', 'resize')
                   or not re.fullmatch('[a-f0-9]{64}', s['sha256']) for s in samples)):
        raise ValueError('Unknown endpoint, series or pixel digest')
    if (session.get('protocol') != 1 or session.get('complete') is not True
            or session.get('clockValidated') is not True or session.get('failure')):
        raise ValueError('Incomplete session or unvalidated clock')
    if [e.get('id') for e in events] != [(a.get('sample') or {}).get('id') for a in plan['actions']]:
        raise ValueError('Every scheduled action must have exactly one input receipt')
    if not frames:
        raise ValueError('Captured frames required')
    for i, frame in enumerate(frames):
        for field in ('displayNs', 'arrivalNs'):
            require_timestamp(frame[field])
        if not re.fullmatch('[a-f0-9]{64}', frame['sha256']):
            raise ValueError('Invalid captured pixel digest')
        if (frame['displayNs'] > frame['arrivalNs'] or frame['displayNs'] < 0
                or (i and frame['displayNs'] <= frames[i - 1]['displayNs'])):
            raise ValueError('Invalid frame clock or order')
    rows = []
    for i, event in enumerate(events):
        for field in ('beforeNs', 'afterNs'):
            require_timestamp(event[field])
        start = event['beforeNs']
        if (event['afterNs'] < start or start < 0
                or (i and start <= events[i - 1]['beforeNs'])):
            raise ValueError('Invalid input clock or order')
        if event.get('id') is None:
            continue
        # Superseded input is never credited to a later, visually identical state.
        end = events[i + 1]['beforeNs'] if i + 1 < len(events) else frames[-1]['displayNs'] + 1
        prior = [f for f in frames if f['displayNs'] < start]
        if not prior:
            raise ValueError('A captured baseline before each input is required')
        match = next((f for f in frames if start <= f['displayNs'] < end
                      and f['sha256'] == expected[event['id']]['sha256']), None)
        if prior[-1]['sha256'] == expected[event['id']]['sha256']:
            match = None
        latency = (match['displayNs'] - start) / 1_000_000 if match else None
        rows.append(dict(id=event['id'], series=expected[event['id']]['series'],
                         latencyMs=latency, within100ms=latency is not None and latency <= 100))
    groups = {}
    for name in sorted({r['series'] for r in rows}):
        selected = [r for r in rows if r['series'] == name]
        values = sorted(r['latencyMs'] if r['latencyMs'] is not None else math.inf for r in selected)
        p95 = values[math.ceil(.95 * len(values)) - 1]
        groups[name] = dict(inputs=len(values), unmatched=sum(math.isinf(v) for v in values),
                            within100ms=sum(r['within100ms'] for r in selected),
                            p95Ms=p95 if math.isfinite(p95) else None,
                            maximumMs=max(values) if all(math.isfinite(v) for v in values) else None,
                            pass100ms=sum(r['within100ms'] for r in selected) >= .95 * len(values))
    return dict(series=groups, samples=rows,
                arithmeticPass=plan['endpoint'] == 'helper-content' and all(g['pass100ms'] for g in groups.values()),
                nativePresentationQualified=False,
                limitation='Arithmetic only. Native route, reference content and capture coverage require audit.')


def require_timestamp(value):
    if type(value) is not int or not 0 <= value <= 2**64 - 1:
        raise ValueError('Unsigned integer nanosecond timestamp required')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('receipt', type=Path)
    args = parser.parse_args()
    root = args.receipt.resolve()
    analysis_path = root / 'analysis.json'
    if analysis_path.exists() or analysis_path.is_symlink():
        raise ValueError('Analysis already exists; preserve the earlier receipt')
    plan = json.loads((root / 'plan.json').read_text())
    session = json.loads((root / 'session.json').read_text())
    events = [json.loads(s) for s in (root / 'inputs.jsonl').read_text().splitlines()]
    frames = [json.loads(s) for s in (root / 'frames.jsonl').read_text().splitlines()]
    for sha in {f['sha256'] for f in frames}:
        if not re.fullmatch('[a-f0-9]{64}', sha):
            raise ValueError('Invalid captured pixel digest')
        raw = root / 'frames' / (sha + '.rgba')
        pixels = raw.read_bytes() if not raw.is_symlink() else b''
        if (len(pixels) != plan['crop']['width'] * plan['crop']['height'] * 4
                or hashlib.sha256(pixels).hexdigest() != sha):
            raise ValueError('Captured pixels missing or changed')
    if any(f.get('width') != plan['crop']['width'] or f.get('height') != plan['crop']['height'] for f in frames):
        raise ValueError('Captured dimensions differ from the planned crop')
    report = analyze(plan, events, frames, session)
    with analysis_path.open('x') as stream:
        stream.write(json.dumps(report, indent=2, allow_nan=False) + '\n')
    print(json.dumps(report['series'], indent=2))
    if not report['arithmeticPass']:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
