"""Offline arithmetic for the standalone Mac recorder; final acceptance is external."""
import argparse
import hashlib
import json
import math
import re
from pathlib import Path


def validate_content_references(plan):
    """Check the reference construction contract, not native provenance or coverage."""
    endpoint = plan.get('endpoint')
    if endpoint == 'settled-confirmation':
        raise ValueError('Settled confirmation requires compositor-bound generation evidence; pixel hashes cannot prove it')
    if endpoint != 'visible-content':
        return
    held = False
    for action in plan['actions']:
        if action['kind'] == 'down': held = True
        if action['kind'] == 'up': held = False
        if not action.get('sample') and (action['kind'] == 'key' or action['kind'] == 'move' and held):
            raise ValueError('Unsampled content actions leave the helper source generations unreferenced')
    samples = [a['sample'] for a in plan['actions'] if a.get('sample')]
    if len({s['series'] for s in samples}) != 1:
        raise ValueError('Use one interaction series per visible-content reference plan')
    move = samples[0]['series'] == 'move'
    if move and plan.get('moveRendering') not in ('isolated-panel', 'guides-only'):
        raise ValueError('Declare the actual move rendering route')
    sources = {'baseline'}
    for sample in samples:
        if sample['id'] in sources:
            raise ValueError('Reference source state IDs must be unique and must not use baseline')
        reference = sample.get('reference', {})
        if reference.get('settled') != sample['sha256']:
            raise ValueError('Each input needs its independent settled native content reference')
        translated = reference.get('translated', {})
        if move and plan['moveRendering'] == 'isolated-panel':
            if set(translated) != sources:
                raise ValueError('Translated route references must cover baseline and every earlier helper source state')
            if any(sha != sample['sha256'] for sha in translated.values()):
                raise ValueError('Rendering routes differ: this crop is not invariant; do not reuse settled references')
        elif translated:
            raise ValueError('Text, resize and guides-only moves have no translated content response')
        sources.add(sample['id'])


def analyze(plan, events, frames, session):
    samples = [a['sample'] for a in plan['actions'] if a.get('sample')]
    expected = {s['id']: s for s in samples}
    if not samples or len(expected) != len(samples):
        raise ValueError('Unique nonempty sample IDs required')
    validate_content_references(plan)
    if (plan.get('endpoint') not in ('helper-content', 'settled-reference', 'visible-content', 'editing-guide')
            or any(s['series'] not in ('text', 'move', 'resize')
                   or not re.fullmatch('[a-f0-9]{64}', s['sha256']) for s in samples)):
        raise ValueError('Unknown endpoint, series or pixel digest')
    if (session.get('protocol') != 1 or session.get('complete') is not True
            or session.get('clockValidated') is not True or session.get('failure') or session.get('failures')):
        raise ValueError('Incomplete session or unvalidated clock')
    if [e.get('id') for e in events] != [(a.get('sample') or {}).get('id') for a in plan['actions']]:
        raise ValueError('Every scheduled action must have exactly one input receipt')
    verify_actions(plan, events, session)
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
    for i, event in enumerate(events):
        for field in ('beforeNs', 'afterNs'):
            require_timestamp(event[field])
        start = event['beforeNs']
        if (event['afterNs'] < start or start < 0
                or (i and start <= events[i - 1]['beforeNs'])):
            raise ValueError('Invalid input clock or order')
    rows = match_transitions(expected, events, frames)
    groups = {}
    for name in sorted({r['series'] for r in rows}):
        selected = [r for r in rows if r['series'] == name]
        values = sorted(r['latencyMs'] if r['latencyMs'] is not None else math.inf for r in selected)
        p95 = values[math.ceil(.95 * len(values)) - 1]
        groups[name] = dict(inputs=len(values), unmatched=sum(math.isinf(v) for v in values),
                            ambiguous=sum(r['status'] == 'ambiguous-repeated-state' for r in selected),
                            alreadyVisible=sum(r['status'] == 'already-visible' for r in selected),
                            notObserved=sum(r['status'] == 'not-observed' for r in selected),
                            within100ms=sum(r['within100ms'] for r in selected),
                            p95Ms=p95 if math.isfinite(p95) else None,
                            maximumMs=max(values) if all(math.isfinite(v) for v in values) else None,
                            pass100ms=sum(r['within100ms'] for r in selected) >= .95 * len(values))
    return dict(analysisVersion=2, series=groups, samples=rows,
                declaredEndpoint=plan['endpoint'],
                measurementScope='invariant-content-reference-match' if plan['endpoint'] == 'visible-content' else 'reference-pixel-match',
                contentTimingQualified=False,
                arithmeticPass=plan['endpoint'] != 'editing-guide' and all(g['pass100ms'] for g in groups.values()),
                nativePresentationQualified=False,
                limitation='Exact reference-pixel transition arithmetic only; matching settled pixels does not prove '
                           'settled confirmation or first visible content. Repeated unresolved states are ambiguous. '
                           'Native reference provenance, actual route coverage, generation ordering and capture coverage require audit.')


def match_transitions(expected, events, frames):
    # A later input is workload, not a response deadline. Keep delayed transitions,
    # but never credit one transition to multiple unresolved inputs for the same pixels.
    timeline = [(e['beforeNs'], 0, e) for e in events if e.get('id') is not None]
    timeline += [(f['displayNs'], 1, f) for f in frames]
    timeline.sort(key=lambda item: (item[0], item[1]))
    rows, pending, visible = [], {}, None
    for timestamp, kind, item in timeline:
        if kind == 0:
            if visible is None:
                raise ValueError('A captured baseline before each input is required')
            sample = expected[item['id']]
            row = dict(id=item['id'], series=sample['series'], latencyMs=None,
                       within100ms=False, status='not-observed')
            rows.append(row)
            if visible == sample['sha256']:
                row['status'] = 'already-visible'
            else:
                pending.setdefault(sample['sha256'], []).append((timestamp, row))
        elif item['sha256'] != visible:
            visible = item['sha256']
            candidates = pending.pop(visible, [])
            if len(candidates) == 1:
                start, row = candidates[0]
                latency = (timestamp - start) / 1_000_000
                row.update(latencyMs=latency, within100ms=latency <= 100, status='observed')
            else:
                for _, row in candidates:
                    row['status'] = 'ambiguous-repeated-state'
    return rows


def require_timestamp(value):
    if type(value) is not int or not 0 <= value <= 2**64 - 1:
        raise ValueError('Unsigned integer nanosecond timestamp required')


def verify_actions(plan, events, session):
    start = session.get('inputStartNs')
    require_timestamp(start)
    held = False
    flags = dict(shift=1 << 17, control=1 << 18, option=1 << 19, command=1 << 20)
    for action, event in zip(plan['actions'], events):
        for field in ('scheduledNs', 'eventNs', 'beforeNs'):
            require_timestamp(event.get(field))
        if (event.get('kind') != action['kind'] or event['eventNs'] != event['beforeNs']
                or event['scheduledNs'] != start + int(action['atMs'] * 1_000_000)
                or event['beforeNs'] < event['scheduledNs']):
            raise ValueError('Posted action identity, stamp or schedule differs from plan')
        expected_flags = sum(flags[m] for m in set(action.get('modifiers', [])))
        if (type(event.get('modifiers')) is not int
                or event['modifiers'] & sum(flags.values()) != expected_flags):
            raise ValueError('Posted modifiers differ from plan')
        if action['kind'] == 'key':
            if event.get('keyCode') != action['keyCode'] or event.get('nativeType') != 10:
                raise ValueError('Posted key or modifier differs from plan')
        else:
            kind = action['kind']
            # CoreGraphics CGEventType values, checked independently of the logical kind.
            expected_type = {'down': 1, 'up': 2, 'move': 6 if held else 5}.get(kind)
            bounds = session.get('windowBounds', [])
            if (len(bounds) != 4 or event.get('nativeType') != expected_type
                    or event.get('pointX') != bounds[0] + action['x']
                    or event.get('pointY') != bounds[1] + action['y']):
                raise ValueError('Posted pointer differs from planned window coordinates')
            if kind == 'down':
                if held: raise ValueError('Duplicate pointer down')
                held = True
            elif kind == 'up':
                if not held: raise ValueError('Pointer up without down')
                held = False
        sample = action.get('sample')
        if sample and not (sample['series'] == 'text' and action['kind'] == 'key'
                           or sample['series'] in ('move', 'resize') and action['kind'] == 'move' and held):
            raise ValueError('Sample series does not describe the posted interaction')
    if held:
        raise ValueError('Unreleased pointer in planned sequence')


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
