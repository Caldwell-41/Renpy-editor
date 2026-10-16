"""Reject partial qualification and retain the actual compiled tests on failure."""
import argparse
import hashlib
import importlib.util
import json
import os
import platform
from pathlib import Path
import re
import shutil
import subprocess


def verify_cargo(listing, output):
    selected = re.findall(r'^([^\s]+): test$', listing, re.M)
    results = re.findall(r'^test ([^\s]+) \.\.\. (ok|FAILED|ignored)$', output, re.M)
    summaries = re.findall(r'^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured;', output, re.M)
    if (not selected or len(set(selected)) != len(selected)
            or sorted(results) != sorted((name, 'ok') for name in selected)
            or summaries != [('ok', str(len(selected)), '0', '0', '0')]):
        raise ValueError('Selected Cargo tests did not all execute and pass exactly once')
    return len(selected)


DOM_REQUIRED = ('the shell owns Save routing across Source, clean fallback, modifiers, remount, modal, and retention failure',
                'prepared identity probe drives all four actual Settings DOM flows with no secret IPC',
                'prepared Windows probe drives both actual Settings phases with exact secret-free operations',
                'complete selectable native probe drives production shell/controller through delayed history, update, refusals and reopen',
                'supporting authoring ignores stale completions and reports persistence truthfully')


def verify_dom(output):
    counts = {}
    for key in ('tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'):
        values = re.findall(r'^# ' + key + r' (\d+)\s*$', output, re.M)
        if len(values) != 1:
            raise ValueError('Missing or duplicate renderer summary: ' + key)
        counts[key] = int(values[0])
    names = re.findall(r'^\s*ok \d+ - (.+?)\s*$', output, re.M)
    if (counts['tests'] < 1 or counts['pass'] != counts['tests'] or len(names) != counts['tests']
            or any(counts[key] for key in ('fail', 'cancelled', 'skipped', 'todo'))
            or any(name not in names for name in DOM_REQUIRED)
            or re.search(r'^\s*not ok |# (?:SKIP|TODO)\b', output, re.M)):
        raise ValueError('Full renderer selection did not execute and pass without skips')
    return counts['tests']


def redesign_checker():
    spec = importlib.util.spec_from_file_location('redesign_evidence', Path(__file__).with_name('check-redesign-evidence.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def retain_binaries(folder, build_root):
    """Always retain available compiler-artifact outputs, even if a later test fails."""
    folder = folder.resolve()
    build_root = build_root.resolve()
    receipt = {}
    errors = []
    for name in ('core', 'desktop'):
        try:
            stream = folder / (name + '-artifacts.jsonl')
            candidates = []
            if stream.exists():
                for line in stream.read_text(encoding='utf-8').splitlines():
                    row = json.loads(line)
                    if row.get('reason') == 'compiler-artifact' and row.get('profile', {}).get('test') and row.get('executable'):
                        candidates.append(Path(row['executable']).resolve())
            if not candidates:
                receipt[name] = {'state': 'not-compiled'}
                continue
            if len(candidates) != 1 or not candidates[0].is_relative_to(build_root):
                raise ValueError('Ambiguous test binary or path outside the build root')
            source = candidates[0]
            target = folder / (name + '-tests.bin')
            shutil.copy2(source, target)
            data = target.read_bytes()
            receipt[name] = {'state': 'compiled', 'file': target.name, 'sha256': hashlib.sha256(data).hexdigest(),
                             'bytes': len(data), 'header': data[:8].hex()}
        except (OSError, ValueError, KeyError, TypeError) as error:
            receipt[name] = {'state':'retention-failed', 'failureType':type(error).__name__}
            errors.append(name)
    (folder / 'test-binaries.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    if errors:
        raise ValueError('Test binary retention failed: ' + ', '.join(errors))
    return receipt


def seal(folder, repo):
    folder=folder.resolve();repo=repo.resolve();folder.mkdir(parents=True,exist_ok=True)
    checker = redesign_checker()
    checker.ROOT = repo
    git = lambda *args: subprocess.check_output(['git', *args], cwd=repo, text=True).strip()
    names = git('ls-files', '.gitattributes', 'app', 'tests/fixtures', '.github/workflows', 'scripts/validate.py', 'spikes/renpy-sdk').splitlines()
    missing = [name for name in names if not (repo / name).is_file()]
    inputs = {name:hashlib.sha256((repo / name).read_bytes()).hexdigest() for name in names if name not in missing}
    mismatches = checker.candidate_mismatches(inputs)
    identity = {'candidate':git('rev-parse', 'HEAD'), 'tree':git('rev-parse', 'HEAD^{tree}'),
                'outcome':'thinking-and-harness-repair', 'runId':os.getenv('GITHUB_RUN_ID'), 'attempt':os.getenv('GITHUB_RUN_ATTEMPT'),
                'machine':platform.machine(), 'runner':os.getenv('RUNNER_OS'), 'inputs':inputs,
                'missingTrackedInputs':missing, 'mismatchedTrackedInputs':mismatches,
                'sourceMatchesCandidate':bool(inputs) and not missing and not mismatches}
    (folder / 'identity.json').write_text(json.dumps(identity,indent=2)+'\n',encoding='utf-8')
    manifest = {p.relative_to(folder).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in folder.rglob('*') if p.is_file() and p != folder / 'manifest.json'}
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')


def verify_binaries(folder, receipt):
    try:
        for name in ('core','desktop'):
            row=receipt[name]
            if row.get('state')!='compiled' or row.get('file')!=name+'-tests.bin':return False
            data=(folder/row['file']).read_bytes()
            if not data or len(data)!=row.get('bytes') or hashlib.sha256(data).hexdigest()!=row.get('sha256') or data[:8].hex()!=row.get('header'):return False
        return True
    except (OSError, KeyError, TypeError):
        return False


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=('cargo', 'dom', 'browser', 'retain', 'seal', 'identity'))
    parser.add_argument('path', type=Path)
    parser.add_argument('other', nargs='?', type=Path)
    args = parser.parse_args()
    if args.action == 'cargo':
        print(verify_cargo(args.path.read_text(encoding='utf-8'), args.other.read_text(encoding='utf-8')))
    elif args.action == 'dom':
        print(verify_dom(args.path.read_text(encoding='utf-8')))
    elif args.action == 'browser':
        if not redesign_checker().browser_ok(args.path, ('settings',)):
            raise SystemExit('Required Thinking/connection browser evidence refused')
    elif args.action == 'retain':
        retain_binaries(args.path, args.other)
    elif args.action == 'seal':
        seal(args.path, args.other)
    else:
        report = json.loads(args.path.read_text(encoding='utf-8'))
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
        tree = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip()
        binaries = json.loads((args.path.parent / 'test-binaries.json').read_text(encoding='utf-8'))
        if not redesign_checker().identity_ok(report, head, tree) or not verify_binaries(args.path.parent, binaries):
            raise SystemExit('Complete source and both compiled test binaries required')
