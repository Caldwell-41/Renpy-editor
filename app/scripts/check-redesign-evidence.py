"""Focused result/identity gates for the approved walkthrough redesign.

This validates evidence only; it never runs the editor, Studio, or project content.
"""
import argparse
import ast
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import platform
import re
import shutil
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[2]
DOM_FILES = (
    'ai-settings.dom.test.ts', 'reference-ui.dom.test.ts',
    'assistance-refinement.dom.test.ts', 'rewrite-ui.dom.test.ts', 'prompt-ui.dom.test.ts', 'studio-request.dom.test.ts',
)
CARGO_REQUIRED = {
    'references::tests::': (
        'references::tests::reviewed_game_creation_is_atomic_preserves_source_and_refuses_changed_review',
        'references::tests::planning_creation_and_restore_preserve_ids_extensions_and_current_game_link',
        'references::tests::restore_refuses_proposals_missing_stale_support_and_stale_library_without_writes',
        'references::tests::project_context_save_history_bounds_and_extensions_leave_legacy_lore_exact',
        'references::tests::virtual_writing_save_uses_stable_ids_and_refuses_duplicate_or_changed_association',
    ),
    'prompts::tests::': ('prompts::tests::shared_project_context_exact_preview_omission_budget_and_unknown_data_preservation',),
    'shared_project_context': ('rewrite::tests::shared_project_context_exact_send_include_omit_and_changed_notes_refuse_without_writes',),
    'ai_request::model_readiness_tests::': (
        'ai_request::model_readiness_tests::supported_local_load_verifies_exact_context_and_fresh_status_before_generation',
        'ai_request::model_readiness_tests::sufficient_loaded_model_reused_without_version_inventory_load_or_reload',
        'ai_request::model_readiness_tests::capacity_conflict_loading_and_unknown_status_refuse_without_generation_or_mutation',
        'ai_request::model_readiness_tests::cancellation_during_local_load_closes_only_owned_socket_and_never_generates',
    ),
    'ai_requests::tests::': (
        'ai_requests::tests::model_readiness_refusal_publishes_diagnosis_without_generation_or_provider_details',
        'ai_requests::tests::compatibility_native_worker_exact_probe_and_strict_publication_no_project_writes',
    ),
}
spec = importlib.util.spec_from_file_location('q1_gate', Path(__file__).with_name('check-q1-prep-gates.py'))
q1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q1)


def gate(env, head, machine):
    return (env.get('OUTCOME') == 'walkthrough-redesign'
            and env.get('GITHUB_REF') == 'refs/heads/codex/phase3a-story-logic'
            and env.get('GITHUB_RUN_ATTEMPT') == '1'
            and env.get('ORDINAL') in ('1', '2', '3')
            and env.get('EXCLUDED_SELECTORS') == 'false'
            and re.fullmatch(r'[0-9a-f]{40}', env.get('EXPECTED_CANDIDATE', '')) is not None
            and env['EXPECTED_CANDIDATE'] == env.get('GITHUB_SHA') == head
            and ((env.get('RUNNER_OS') == 'Windows' and machine.lower() in ('amd64', 'x86_64'))
                 or (env.get('RUNNER_OS') == 'macOS' and machine.lower() in ('arm64', 'aarch64'))))


def dom_names():
    names = []
    for name in DOM_FILES:
        source = (ROOT / 'app/tests' / name).read_text(encoding='utf-8')
        found = [ast.literal_eval(m.group(1)) for m in re.finditer(r'''^\s*test\(\s*((?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*'))\s*,''', source, re.M)]
        if not found:
            raise ValueError('Selected DOM file discovered zero tests: ' + name)
        names.extend(found)
    if len(names) != len(set(names)):
        raise ValueError('Duplicate selected DOM test names')
    return names


def dom_ok(text, expected):
    summaries = {}
    for key in ('tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'):
        values = re.findall(r'^# ' + key + r' (\d+)\s*$', text, re.M)
        if len(values) != 1:
            return False
        summaries[key] = int(values[0])
    actual = re.findall(r'^ok \d+ - (.+?)\s*$', text, re.M)
    return (bool(expected) and sorted(actual) == sorted(expected)
            and summaries == {'tests': len(expected), 'pass': len(expected), 'fail': 0,
                              'cancelled': 0, 'skipped': 0, 'todo': 0}
            and not re.search(r'^not ok |# (?:SKIP|TODO)\b', text, re.M))


def cargo_ok(text, listing, scope):
    if scope not in CARGO_REQUIRED:
        return False
    expected = re.findall(r'^([A-Za-z0-9_:]+): test\s*$', listing, re.M)
    actual = q1.TEST_LINE.findall(text)
    summaries = q1.SUMMARY.findall(text)
    good, _ = q1.cargo_log_ok(text, CARGO_REQUIRED[scope])
    return (good and bool(expected) and len(summaries) == 1
            and len(expected) == len(set(expected))
            and sorted(name for name, status in actual if status == 'ok') == sorted(expected)
            and all(status == 'ok' for _, status in actual)
            and int(summaries[0][1]) == len(expected)
            and all(int(summaries[0][i]) == 0 for i in (2, 3, 4)))


def browser_ok(folder):
    metrics = json.loads((folder / 'metrics.json').read_text(encoding='utf-8'))
    receipts = metrics.get('receipts', [])
    expected = {(surface, theme, size) for surface in ('characters', 'relationships', 'knowledge', 'history', 'lorebook', 'settings', 'assist')
                for theme in ('light', 'dark') for size in ('wide', 'compact')}
    actual = {(r.get('surface'), r.get('theme'), r.get('size')) for r in receipts}
    identity = metrics.get('inputIdentity', {})
    before = identity.get('before', {})
    after = identity.get('after', {})
    files = before.get('files', {})
    inputs_ok = (identity.get('unchanged') is True and bool(files) and files == after.get('files')
                 and re.fullmatch(r'[0-9a-f]{40}', before.get('checkoutHead') or '') is not None
                 and before.get('checkoutHead') == after.get('checkoutHead')
                 and all(isinstance(name, str) and re.fullmatch(r'[0-9a-f]{64}', value or '') for name, value in files.items()))
    images_ok = True
    for receipt in receipts:
        image = folder / str(receipt.get('image', ''))
        if not image.is_file():
            images_ok = False; break
        data = image.read_bytes()
        dimensions = (1440, 900) if receipt.get('size') == 'wide' else (600, 720)
        if (len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n'
                or data[8:16] != b'\x00\x00\x00\x0dIHDR'
                or struct.unpack('>II', data[16:24]) != dimensions
                or hashlib.sha256(data).hexdigest() != receipt.get('imageSha256')):
            images_ok = False; break
    return (inputs_ok and images_ok and actual == expected and len(receipts) == len(expected) and metrics.get('errors') == []
            and metrics.get('cleanup') == {'browser':'closed','server':'closed'}
            and all(r.get('viewportOverflow') is False and r.get('actionsVisible') is True for r in receipts)
            and len(list(folder.glob('*.png'))) == len(expected)
            and len({r.get('image') for r in receipts}) == len(expected)
            and all(r.get('image') == f"{r['surface']}-{r['theme']}-{r['size']}.png" and (folder / r['image']).is_file() for r in receipts))


def seal(folder):
    folder.mkdir(parents=True, exist_ok=True)
    git = lambda *args: subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()
    names = git('ls-files', 'app', '.github/workflows', 'scripts/validate.py').splitlines()
    missing = [name for name in names if not (ROOT / name).is_file()]
    inputs = {name: hashlib.sha256((ROOT / name).read_bytes()).hexdigest() for name in names if (ROOT / name).is_file()}
    identity = {'candidate': git('rev-parse', 'HEAD'), 'tree': git('rev-parse', 'HEAD^{tree}'),
                'runId': os.getenv('GITHUB_RUN_ID'), 'attempt': os.getenv('GITHUB_RUN_ATTEMPT'),
                'outcome': 'walkthrough-redesign', 'runner': os.getenv('RUNNER_OS'),
                'machine': platform.machine(), 'inputs': inputs}
    retained = []
    renderer = ROOT / 'app/dist'
    if renderer.is_dir():
        shutil.copytree(renderer, folder / 'renderer', dirs_exist_ok=True)
    for log in folder.glob('*.log'):
        for binary in re.findall(r'Running unittests .+? \((.+?)\)', log.read_text(encoding='utf-8', errors='replace')):
            source = (ROOT / 'app' / binary).resolve()
            if not source.is_relative_to((ROOT / 'app/target').resolve()):
                raise ValueError('Test binary outside build output')
            if source.is_file():
                destination = folder / 'test-executables' / source.name
                destination.parent.mkdir(exist_ok=True)
                if not destination.exists():
                    shutil.copy2(source, destination)
                    retained.append({'name': source.name, 'sha256': hashlib.sha256(destination.read_bytes()).hexdigest()})
    identity['missingTrackedInputs'] = missing
    identity['sourceMatchesCandidate'] = not missing and all(hashlib.sha256(subprocess.check_output(['git','show','HEAD:' + name],cwd=ROOT)).hexdigest() == checksum for name, checksum in inputs.items())
    identity['retainedTestExecutables'] = retained
    identity['selectedDomTests'] = dom_names()
    (folder / 'identity.json').write_text(json.dumps(identity, indent=2) + '\n', encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=('gate', 'dom', 'cargo', 'browser', 'seal'))
    parser.add_argument('path', nargs='?')
    parser.add_argument('scope', nargs='?')
    parser.add_argument('listing', nargs='?')
    args = parser.parse_args()
    if args.mode == 'gate':
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
        good = gate(os.environ, head, platform.machine())
    elif args.mode == 'dom':
        good = dom_ok(Path(args.path).read_text(encoding='utf-8'), dom_names())
    elif args.mode == 'cargo':
        good = cargo_ok(Path(args.path).read_text(encoding='utf-8'), Path(args.listing).read_text(encoding='utf-8'), args.scope)
    elif args.mode == 'browser':
        good = browser_ok(Path(args.path))
    else:
        seal(Path(args.path)); good = True
    if not good:
        raise SystemExit('Required redesign evidence gate refused: ' + args.mode)
    print('PASS: redesign ' + args.mode)


if __name__ == '__main__':
    main()
