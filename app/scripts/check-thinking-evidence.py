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
import struct
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


MAC_SNAPSHOT_TESTS = frozenset('test_macos_development_credentials.DevelopmentFixtureTests.' + name for name in (
    'test_reload_selector_preparation_is_read_only_and_rejects_changed_fixture',
    'test_isolation_private_snapshot_and_no_credential_creation',
    'test_steps_refuse_out_of_order_and_unconfirmed_save',
    'test_cancel_rejects_file_change_even_when_profiles_are_identical',
))
WINDOWS_NATIVE_TESTS = frozenset({
    'test_studio_connection_native.CurrentConnectionTests.test_actual_current_driver_fits_small_desktop_and_closes_without_geometry_gate',
})
PYTHON_REQUIRED = MAC_SNAPSHOT_TESTS | WINDOWS_NATIVE_TESTS | {
    'test_nested_fidelity.NestedFidelityGates.test_normal_instrumentation_parses_without_importing_helper_construction',
    'test_nested_fidelity.NestedFidelityGates.test_normal_sample_is_applied_after_game_start_defaults',
    'test_nested_fidelity.NestedFidelityGates.test_normal_observer_measures_the_sized_add_instead_of_its_named_image',
    'test_macos_identity_probe.IdentityProbeTests.test_current_report_requires_exact_contract_case_assertions_identity_and_cleanup',
    'test_studio_connection_native.CurrentConnectionTests.test_current_report_requires_complete_case_contract_requests_timings_and_cleanup',
    'test_studio_connection_native.CurrentConnectionTests.test_current_publication_requires_exact_settings_revision_ownership_and_unrelated_profiles',
    'test_studio_connection_native.CurrentConnectionTests.test_native_receipt_rejects_unowned_focus_children_failed_retry_or_cleanup',
    'test_studio_connection_native.CurrentConnectionTests.test_failed_build_retains_exclusive_attempt_and_never_creates_positive_package',
    'test_studio_connection_native.CurrentConnectionTests.test_current_viewport_rejects_clipping_wrong_dpi_frame_placement_and_small_client',
    'test_studio_connection_native.CurrentConnectionTests.test_state_retention_keeps_exact_partial_json_and_requires_complete_snapshots',
    'test_studio_connection_native.CurrentConnectionTests.test_owned_credential_audit_checks_only_saved_synthetic_references',
    'test_studio_connection_native.CurrentConnectionTests.test_close_receipt_rejects_key_delivery_without_settings_dismissal',
    'test_studio_connection_native.CurrentConnectionTests.test_observation_failure_retains_original_error_and_independent_close_state',
    'test_macos_studio_request.SyntheticRequestTests.test_known_unused_blocked_fixture_cleanup_requires_exact_seed_and_no_process',
    'test_windows_studio_credentials.WindowsFixtureGate.test_failed_build_preserves_exclusive_terminal_and_cannot_redispatch',
    'test_windows_studio_credentials.WindowsFixtureGate.test_source_inventory_requires_generated_permissions_without_prior_builds',
    'test_harness_checks.HarnessChecks.test_failure_timeout_and_spawn_failure_keep_logs_and_do_not_hide_later_results',
    'test_harness_checks.HarnessChecks.test_zero_exit_cannot_override_rejected_evidence',
    'test_harness_checks.HarnessChecks.test_retention_gate_rejects_missing_duplicate_and_unexpected_skipped_cases',
}


def python_results(output):
    """Verbose unittest warnings can interrupt a result line before its final ok."""
    rows = []
    pending = None
    for line in output.splitlines():
        header = re.fullmatch(r'test_\w+ \(([\w.]+)\) \.\.\. (.*)', line)
        if header:
            if pending is not None:
                raise ValueError('Previous Python test has no completed result')
            pending, status = header.groups()
        elif pending is not None:
            status = line.strip()
        else:
            continue
        if status == 'ok' or status.startswith('skipped '):
            rows.append((pending, status))
            pending = None
    if pending is not None:
        raise ValueError('Python test has no completed result')
    return rows


def verify_python(output, runner):
    """Allow only named host exclusions, never an unexpected skip or zero discovery."""
    if runner not in ('Windows', 'macOS'):
        raise ValueError('Explicit supported Python test host required')
    expected_skips = MAC_SNAPSHOT_TESTS if runner == 'Windows' else WINDOWS_NATIVE_TESTS
    runs = re.findall(r'^Ran (\d+) tests? in [^\n]+$', output, re.M)
    summaries = re.findall(r'^OK(?: \(skipped=(\d+)\))?\s*$', output, re.M)
    rows = python_results(output)
    skipped = [name for name, status in rows if status.startswith('skipped ')]
    completed = {name for name, status in rows if status == 'ok'}
    if (len(runs) != 1 or int(runs[0]) < len(PYTHON_REQUIRED)
            or summaries != [str(len(expected_skips))]
            or len(rows) != int(runs[0])
            or len(rows) != len({name for name, _ in rows})
            or len(skipped) != len(expected_skips) or set(skipped) != expected_skips
            or not PYTHON_REQUIRED.difference(expected_skips).issubset(completed)
            or re.search(r'^(?:FAILED|ERROR:|FAIL:|UNEXPECTED SUCCESS:)', output, re.M)):
        raise ValueError('Python harness failed, omitted required cases or skipped outside its host contract')
    return {'tests': int(runs[0]), 'passed': int(runs[0]) - len(skipped), 'hostExcluded': sorted(skipped)}


def browser_ok(folder, surfaces=('characters', 'relationships', 'knowledge', 'history', 'lorebook', 'settings', 'assist')):
    metrics = json.loads((folder / 'metrics.json').read_text(encoding='utf-8'))
    receipts = metrics.get('receipts', [])
    expected = {(surface, theme, size) for surface in surfaces
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
    images=[]
    for receipt in receipts:
        images.append((receipt, f"{receipt.get('surface')}-{receipt.get('theme')}-{receipt.get('size')}.png"))
        if receipt.get('surface') == 'settings':
            captures=receipt.get('captures', [])
            if (len(captures)!=3 or {c.get('view') for c in captures}!={'connection','connect','response'}
                    or any(c.get('actionsVisible') is not True or not c.get('actions') or any(a.get('visible') is not True for a in c['actions']) for c in captures)):
                return False
            for capture in captures:
                images.append(({**capture, 'size':receipt.get('size')}, f"settings-{capture['view']}-{receipt.get('theme')}-{receipt.get('size')}.png"))
    for receipt, expected_name in images:
        if receipt.get('image') != expected_name:
            return False
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
            and metrics.get('prohibited', []) == []
            and len(list(folder.glob('*.png'))) == len(images)
            and len({r.get('image') for r in receipts}) == len(expected)
            and all(r.get('image') == f"{r['surface']}-{r['theme']}-{r['size']}.png" and (folder / r['image']).is_file() for r in receipts))


def candidate_mismatches(inputs, root):
    # Checkout bytes include the repository's declared transformations (e.g. CRLF
    # PowerShell files). Compare with Git's checkout representation, retaining raw
    # file hashes in the receipt; never normalize or ignore an edited input here.
    return [name for name, checksum in inputs.items()
            if hashlib.sha256(subprocess.check_output(
                ['git', 'cat-file', '--filters', 'HEAD:' + name], cwd=root)).hexdigest() != checksum]


def identity_ok(report, head, tree):
    return (report.get('candidate') == head and report.get('tree') == tree
            and report.get('sourceMatchesCandidate') is True
            and report.get('missingTrackedInputs') == []
            and report.get('mismatchedTrackedInputs') == [])




HELP_ARTIFACTS = {
    'core': ('core-artifacts.jsonl', 'loomlight_core', True),
    'controller': ('controller-artifacts.jsonl', 'help-controller-driver', False),
}


def retain_binaries(folder, build_root, *, artifacts=None):
    """Always retain available compiler-artifact outputs, even if a later test fails."""
    folder = folder.resolve()
    build_root = build_root.resolve()
    receipt = {}
    errors = []
    mixed_output = artifacts is not None
    selected = artifacts if mixed_output else {
        name: (name + '-artifacts.jsonl', None, True) for name in ('core', 'desktop')
    }
    for name, (stream_name, target_name, test_profile) in selected.items():
        target = folder / (name + ('-tests.bin' if test_profile else '.bin'))
        incomplete = False
        try:
            target.unlink(missing_ok=True)
            stream = folder / stream_name
            candidates = []
            if stream.exists():
                for line in stream.read_text(encoding='utf-8').splitlines():
                    if mixed_output and not line.startswith('{'):
                        continue  # Cargo's test runner still emits ordinary result lines.
                    try:
                        row = json.loads(line)
                    except json.JSONDecodeError:
                        incomplete = True
                        continue  # Retain earlier artifacts even after a truncated record.
                    if not isinstance(row, dict):
                        incomplete = True
                        continue
                    if (row.get('reason') == 'compiler-artifact'
                            and row.get('profile', {}).get('test') is test_profile
                            and (target_name is None or row.get('target', {}).get('name') == target_name)
                            and row.get('executable')):
                        source = Path(row['executable']).resolve()
                        if not mixed_output or source not in candidates:
                            candidates.append(source)
            if not candidates:
                receipt[name] = {'state': 'not-compiled'}
            else:
                if len(candidates) != 1 or not candidates[0].is_relative_to(build_root):
                    raise ValueError('Ambiguous executable or path outside the build root')
                source = candidates[0]
                if not source.is_file():
                    receipt[name] = {'state': 'unavailable', 'source': source.relative_to(build_root).as_posix()}
                    errors.append(name)
                else:
                    expected = hashlib.sha256(source.read_bytes()).hexdigest()
                    shutil.copy2(source, target)
                    data = target.read_bytes()
                    if hashlib.sha256(data).hexdigest() != expected:
                        raise ValueError('Retained executable differs from the produced executable')
                    receipt[name] = {'state': 'compiled', 'file': target.name, 'sha256': expected,
                                     'bytes': len(data), 'header': data[:8].hex(),
                                     'source': source.relative_to(build_root).as_posix()}
            if incomplete:
                if not candidates:
                    raise ValueError('Compiler stream is incomplete without an available artifact')
                receipt[name]['incompleteStream'] = True
                errors.append(name)
        except (OSError, ValueError, KeyError, TypeError) as error:
            receipt[name] = {'state':'retention-failed', 'failureType':type(error).__name__}
            errors.append(name)
            try:
                target.unlink(missing_ok=True)
            except OSError as cleanup_error:
                receipt[name]['cleanupFailureType'] = type(cleanup_error).__name__
    (folder / 'test-binaries.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    if errors:
        raise ValueError('Test binary retention failed: ' + ', '.join(errors))
    return receipt


def seal(folder, repo, outcome='thinking-and-harness-repair'):
    folder=folder.resolve();repo=repo.resolve();folder.mkdir(parents=True,exist_ok=True)
    git = lambda *args: subprocess.check_output(['git', *args], cwd=repo, text=True).strip()
    names = git('ls-files', '.gitattributes', 'app', 'tests/fixtures', '.github/workflows', 'scripts/validate.py', 'spikes/renpy-sdk').splitlines()
    missing = [name for name in names if not (repo / name).is_file()]
    inputs = {name:hashlib.sha256((repo / name).read_bytes()).hexdigest() for name in names if name not in missing}
    mismatches = candidate_mismatches(inputs, repo)
    identity = {'candidate':git('rev-parse', 'HEAD'), 'tree':git('rev-parse', 'HEAD^{tree}'),
                'outcome':outcome, 'runId':os.getenv('GITHUB_RUN_ID'), 'attempt':os.getenv('GITHUB_RUN_ATTEMPT'),
                'workflow':os.getenv('GITHUB_WORKFLOW'), 'workflowRef':os.getenv('GITHUB_WORKFLOW_REF'),
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
    parser.add_argument('action', choices=('cargo', 'dom', 'python', 'browser', 'retain', 'seal', 'identity'))
    parser.add_argument('path', type=Path)
    parser.add_argument('other', nargs='?', type=Path)
    parser.add_argument('--runner', choices=('Windows', 'macOS'))
    parser.add_argument('--outcome', choices=('thinking-and-harness-repair', 'harness-regressions', 'current-studio-connection'), default='thinking-and-harness-repair')
    args = parser.parse_args()
    if args.action == 'cargo':
        print(verify_cargo(args.path.read_text(encoding='utf-8'), args.other.read_text(encoding='utf-8')))
    elif args.action == 'dom':
        print(verify_dom(args.path.read_text(encoding='utf-8')))
    elif args.action == 'python':
        print(json.dumps(verify_python(args.path.read_text(encoding='utf-8'), args.runner)))
    elif args.action == 'browser':
        if not browser_ok(args.path, ('settings',)):
            raise SystemExit('Required Thinking/connection browser evidence refused')
    elif args.action == 'retain':
        retain_binaries(args.path, args.other)
    elif args.action == 'seal':
        seal(args.path, args.other, args.outcome)
    else:
        report = json.loads(args.path.read_text(encoding='utf-8'))
        head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
        tree = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], text=True).strip()
        binaries = json.loads((args.path.parent / 'test-binaries.json').read_text(encoding='utf-8'))
        if not identity_ok(report, head, tree) or not verify_binaries(args.path.parent, binaries):
            raise SystemExit('Complete source and both compiled test binaries required')
