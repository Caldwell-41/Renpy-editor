"""Reject incomplete Phase 3A proof; these checks never execute project content."""
import argparse
import hashlib
import json
from pathlib import Path
import re

SDK_TEST = 'renpy::tests::phase3a::phase3a_conditions_calls_sdk_gate'
CORE_TESTS = (
    'renpy::tests::phase3a::phase3a_sdk_fixture_source_save_preserves_bom',
    'conditions::tests::phase3a_exact_values_types_and_precedence',
    'conditions::tests::phase3a_bounds_and_missing_state_remain_unknown',
    'conditions::tests::phase3a_expression_render_resolves_types_and_roundtrips_full_depth',
    'conditions::source_tests::phase3a_python_literals_and_trivia_stay_opaque',
    'conditions::source_tests::phase3a_v3_migration_preserves_ids_extras_and_source',
    'conditions::source_tests::phase3a_nested_dispatch_minimal_edit_history_and_reopen',
    'rewrite::tests::phase3a_new_nested_targets_do_not_expand_ai_allowlist',
    'rewrite::tests::phase3a_logic_context_and_generated_fields_keep_ai_allowlist_closed',
    'scene::logic::tests::phase3a_calls_generate_distinct_labels_minimal_target_edit_and_history',
    'scene::logic::tests::phase3a_guarded_menu_requires_explicit_root_ending',
    'scene::logic::tests::phase3a_v3_v4_call_menu_refinement_preserves_records_and_reopen',
    'scene::logic::flow_tests::phase3a_guarded_calls_and_menu_flow_keep_exact_continuations',
    'scene::logic::flow_tests::phase3a_authored_recursive_calls_refuse_and_source_cycles_remain_unknown',
    'scene::logic::boundary_tests::phase3a_guarded_menu_field_edits_preserve_exact_formatting',
    'scene::logic::boundary_tests::phase3a_source_eof_continuation_and_duplicate_labels_are_unknown',
    'scene::logic::boundary_tests::phase3a_unsafe_refinement_and_stash_collision_refuse_without_writes',
)
DOM_TESTS = (
    'Call and guarded Choice are read-only with exact Source navigation and no mutations',
    'Call and every guarded option leave preview state unknown without filtering choices',
    'recursive and unknown branch captions remain accurate and do not execute sibling bodies',
    'Branches presents body, guards and Call continuations with exact source locations',
    'mapped Story source revision is forwarded through main and retained by Source on refusal',
    'ordinary neighbors cannot move through read-only Call and guarded Choice rows',
    'core guard conditions remain distinct from Choice availability and missing Call targets are diagnosed',
)
CASES = ('conditions-low', 'conditions-high', 'conditions-boundary',
         'no-option-fallthrough', 'nested-call-return', 'reject-wrong-outcome')
SUMMARY = re.compile(r'^test result: (ok|FAILED)\. (\d+) passed; (\d+) failed; (\d+) ignored; (\d+) measured; (\d+) filtered out;', re.M)


def cargo_ok(text, required=(), minimum=1):
    summaries = SUMMARY.findall(text)
    if len(summaries) != 1:
        raise ValueError('exactly one test-binary summary required')
    state, passed, failed, ignored, measured, _ = summaries[0]
    if state != 'ok' or int(passed) < max(minimum, len(required)) or any(int(x) for x in (failed, ignored, measured)):
        raise ValueError('positive, zero-failure/ignored test summary required')
    for name in required:
        if len(re.findall(r'^test ' + re.escape(name) + r' \.\.\. ok$', text, re.M)) != 1:
            raise ValueError('required named test missing, duplicate or not passed: ' + name)
    return int(passed)


def dom_ok(text):
    for key, expected in (('tests', len(DOM_TESTS)), ('pass', len(DOM_TESTS)),
                          ('fail', 0), ('cancelled', 0), ('skipped', 0), ('todo', 0)):
        matches = re.findall(r'(?:ℹ|#) ' + key + r' (\d+)\s', text)
        if matches != [str(expected)]:
            raise ValueError('exact positive renderer summary required: ' + key)
    for title in DOM_TESTS:
        if title not in text:
            raise ValueError('required renderer case missing: ' + title)
    return len(DOM_TESTS)


def records(text, prefix):
    values = []
    for line in text.splitlines():
        if line.startswith(prefix):
            value = json.loads(line[len(prefix):])
            if not isinstance(value, dict):
                raise ValueError('expected JSON object')
            values.append(value)
    return values


def sdk_ok(text):
    cargo_ok(text, (SDK_TEST,))
    cases = records(text, 'phase-3a-sdk-case: ')
    if [c.get('case') for c in cases] != list(CASES):
        raise ValueError('exact ordered runtime cases required')
    for case in cases:
        reject = case['case'] == 'reject-wrong-outcome'
        if case.get('passed') is not True or case.get('timedOut') is not False or case.get('outputLimited') is not False or case.get('expectedRejection') is not reject:
            raise ValueError('runtime outcome incomplete or failed')
        code = case.get('exitCode')
        if type(code) is not int or (code == 0) == reject:
            raise ValueError('actual runtime exit did not match case oracle')
    terminals = records(text, 'phase-3a-sdk-terminal: ')
    if len(terminals) != 1:
        raise ValueError('exact terminal report required')
    terminal = terminals[0]
    for key in ('passed', 'cleanupComplete', 'metadataAbsent', 'acceptedSourceUnchanged'):
        if terminal.get(key) is not True:
            raise ValueError('terminal success/cleanup/source guarantees missing: ' + key)
    for key, count in (('sdkInstalls', 1), ('guiGenerations', 1), ('compileCommands', 1), ('lintCommands', 1), ('runtimeCases', len(CASES)), ('versionChecks', 2), ('guiImageCommands', 1), ('adapterSpawns', 12)):
        if type(terminal.get(key)) is not int or terminal[key] != count:
            raise ValueError('actual cumulative SDK operations wrong: ' + key)
    return {'cases': cases, 'terminal': terminal}


def seal(directory):
    manifest = {p.relative_to(directory).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(directory.rglob('*')) if p.is_file() and p.name != 'manifest.json'}
    (directory / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('action', choices=('sdk', 'seal'))
    parser.add_argument('path', type=Path)
    args = parser.parse_args()
    if args.action == 'seal':
        seal(args.path)
    else:
        print(json.dumps(sdk_ok(args.path.read_text(encoding='utf-8')), indent=2))
