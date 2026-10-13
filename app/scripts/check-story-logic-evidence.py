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
    'scene::logic::body_tests::phase3a_body_nested_minimal_bytes_ids_extras_history_reopen',
    'scene::logic::body_tests::phase3a_body_owner_header_anchor_and_terminal_refusals_write_nothing',
    'scene::logic::body_tests::phase3a_body_eof_separator_preserves_previous_child_identity',
    'scene::logic::body_tests::phase3a_body_calls_and_guarded_choices_preserve_labels_and_neighbors',
    'scene::logic::body_tests::phase3a_body_candidate_transfers_close_jump_choice_gaps_allow_pure_jump_loops',
    'scene::logic::structural_review_tests::phase3a_body_new_fallthrough_and_opaque_root_end_refuse',
    'scene::logic::structural_review_tests::phase3a_body_create_scene_from_choice_checks_candidate_routes',
    'scene::logic::structural_tests::phase3a_structure_condition_branch_edits_empty_pass_history_reopen',
    'scene::logic::structural_tests::phase3a_structure_branch_kind_owner_unknown_and_initial_if_refusals',
    'scene::logic::structural_tests::phase3a_structure_leaf_moves_whole_subtrees_stable_ids_and_empty_bodies',
    'scene::logic::structural_tests::phase3a_structure_selected_unwrap_preserves_only_selected_body_and_trivia',
    'scene::logic::structural_tests::phase3a_structure_minimal_condition_header_and_opaque_reindent_refusals',
    'scene::logic::structural_tests::phase3a_structure_nonlast_selected_trivia_and_unqualified_promotion',
)
DOM_TESTS = (
    'Unknown guarded Choice is read-only with exact Source navigation and no mutations',
    'Call and every guarded option leave preview state unknown without filtering choices',
    'recursive and unknown branch captions remain accurate and do not execute sibling bodies',
    'Branches presents body, guards and Call continuations with exact source locations',
    'mapped Story source revision is forwarded through main and retained by Source on refusal',
    'ordinary neighbors use explicit immediate-sibling moves around Call and Choice rows',
    'core guard conditions remain distinct from Choice availability and missing Call targets are diagnosed',
)
CONTROLLER_TESTS = (
    'Guarded Choice actual Story dispatch preserves exact neighbours',
    'Call destination actual Story dispatch preserves its return label',
    'Explicit branch Beat insertion captures body and sibling position',
    'Condition builder and If Else If Otherwise controls preserve exact ownership',
    'Nested keyboard and explicit cross-body moves preserve subtree identity',
    'Delete versus unwrap and empty bodies preserve safe source boundaries',
    'Manual branch preview and Branches navigation agree with exact Source locations',
    'Cancel and dirty Source draft refusal retain pending author input',
    'Ordinary external edits and stale revisions refuse with zero source writes',
    'Undo Redo preserves exact bytes and process reopen retains maps with session history reset',
)


AUTHORING_DOM_TESTS = (
    'Call edit keeps label and captured envelopes; stale refusal keeps fields and disabled controls',
    'missing Call destination stays visible, fails blur and submission, and never chooses first Scene',
    'guarded Choice validates exact integer at blur/submission; IME and failed writes retain every field',
    'explicit branch insertion preserves body, before-terminator position, and per-type drafts',
    'root Call insertion is explicit before Return and generates no renderer-owned return label',
    'guard-only Choice edit preserves raw captions and guarded option-count controls stay constrained',
    'unchanged pending commit blocks another draft and late disposed refusal cannot affect replacement view',
)
FINAL_DOM_FILES = (
    'dist-tests/tests/phase3a-renderer.dom.test.js',
    'dist-tests/tests/story-authoring.dom.test.js',
    'dist-tests/tests/story-structure.dom.test.js',
    'dist-tests/tests/scene-authoring.dom.test.js',
    'dist-tests/tests/save-command.dom.test.js',
)
FINAL_DOM_TESTS = (
    'Unknown guarded Choice is read-only with exact Source navigation and no mutations',
    'Call and every guarded option leave preview state unknown without filtering choices',
    'recursive and unknown branch captions remain accurate and do not execute sibling bodies',
    'Branches presents body, guards and Call continuations with exact source locations',
    'mapped Story source revision is forwarded through main and retained by Source on refusal',
    'ordinary neighbors use explicit immediate-sibling moves around Call and Choice rows',
    'core guard conditions remain distinct from Choice availability and missing Call targets are diagnosed',
    'the shell owns Save routing across Source, clean fallback, modifiers, remount, modal, and retention failure',
    'nested child commits carry owner and retain input on stale/session refusal',
    'root controls respect nested children and conditional insertion boundaries',
    'Scene authoring exposes hierarchy, every Beat, natural dialogue continuation, and Create New Scene',
    'recovery UI offers only proven resolutions and keeps ambiguous transactions blocked',
    'failed Beat validation preserves the draft and restores focus',
    'preview reconstruction is Beat-local, provenance-aware, and truthful after Custom Code',
    'preview presents images through the bounded bridge and auditions audio only on request',
    'pending media is cancelled logically and disposed with the project view',
    'simultaneous Story preview and thumbnail keep their displayed URLs alive',
    'closeout: Background clears previously visible Characters',
    'closeout: Add change here retains selected Beat anchor',
    'Background resolves default-layer uncertainty after Custom Code without clearing music or variable uncertainty',
    'dialogue navigation protects IME and shares one pending commit',
    'adding a Beat saves once and returns a collapsed row without a second commit',
    'new Beat waits for its receipt, restores failure input, and focuses the saved row',
    'held Beat drag scrolls the visible writing panel edges and stops on cancellation',
    'preview reset updates the divider and layout without a hidden slider',
    'pointer Beat reorder cancels outside, on Escape and across protected boundaries',
    'shipped source-foundation native driver completes against strict renderer fixture',
    'Call edit keeps label and captured envelopes; stale refusal keeps fields and disabled controls',
    'missing Call destination stays visible, fails blur and submission, and never chooses first Scene',
    'guarded Choice validates exact integer at blur/submission; IME and failed writes retain every field',
    'explicit branch insertion preserves body, before-terminator position, and per-type drafts',
    'root Call insertion is explicit before Return and generates no renderer-owned return label',
    'guard-only Choice edit preserves raw captions and guarded option-count controls stay constrained',
    'unchanged pending commit blocks another draft and late disposed refusal cannot affect replacement view',
    'full condition builder hydrates All/Any/Not, exact values and boolean comparison operands without flattening',
    'create Condition submits explicit root anchor and full typed boolean combinations in one command',
    'Else If insertion exposes first-match order and captures containing group parent',
    'nested Otherwise creation and condition editing use group-parent qualification, not selected branch ownership',
    'explicit leaf move shows destination, excludes pass anchors and retains every field on core refusal',
    'whole condition move excludes own descendant bodies; headers never become ordinary Beat targets',
    'keyboard up/down moves use immediate body siblings and one captured transaction',
    'delete whole group and selected unwrap remain distinct; initial If cannot be removed as a branch',
    'manual preview never runs sibling bodies and changing its selection retains editing draft',
    'collapse cannot hide drafts; branch focus retains ancestors and empty pass is inert',
    'Call navigation captures target and caller revisions; continuation requests core-mapped location',
    'Branches forwards selected guarded origin and exact body/continuation targets',
    'manual selected branch terminals and Choices stop before unvisited root effects',
    'whole-group confirmation and collapse summary count protected Custom Code and branches',
    'dirty structural input blocks tree New/Rename entry; dirty tree input blocks unrelated Story forms',
    'unchanged pending condition commit locks tree authoring and cannot admit another tree draft',
    'unresolved manual conditions stop at the actual header; explicit no-match visits the chosen continuation',
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


def dom_ok(text, required=DOM_TESTS):
    for key, expected in (('tests', len(required)), ('pass', len(required)),
                          ('fail', 0), ('cancelled', 0), ('skipped', 0), ('todo', 0)):
        matches = re.findall(r'(?:ℹ|#) ' + key + r' (\d+)\s', text)
        if matches != [str(expected)]:
            raise ValueError('exact positive renderer summary required: ' + key)
    for title in required:
        passed = re.findall(r'^(?:✔ |ok \d+ - )' + re.escape(title) + r'(?: \([0-9.]+ms\))?\s*$', text, re.M)
        if len(passed) != 1:
            raise ValueError('required renderer case missing, duplicate or not passed: ' + title)
    return len(required)


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
    for key in ('passed', 'cleanupComplete', 'metadataAbsent', 'acceptedSourceUnchanged', 'savedCallee', 'safeEditQualified', 'loadedReturn', 'structuralConditionQualified'):
        if terminal.get(key) is not True:
            raise ValueError('terminal success/cleanup/source guarantees missing: ' + key)
    for key, count in (('sdkInstalls', 1), ('guiGenerations', 1), ('compileCommands', 1), ('lintCommands', 1), ('runtimeCases', len(CASES)), ('versionChecks', 2), ('guiImageCommands', 1), ('adapterSpawns', 12)):
        if type(terminal.get(key)) is not int or terminal[key] != count:
            raise ValueError('actual cumulative SDK operations wrong: ' + key)
    save, edit, load = (one_record(text, prefix) for prefix in
                        ('phase-3a-sdk-save: ', 'phase-3a-sdk-safe-edit: ', 'phase-3a-sdk-load: '))
    if save.get('slot') != 'phase3a-callee' or save.get('canLoad') is not True:
        raise ValueError('fixed raw slot must exist before the Source edit')
    for key, expected in (('flag', True), ('trust', '5'), ('precision', '9007199254740993'), ('mood', 'ready')):
        if type(save.get(key)) is not type(expected) or save[key] != expected or type(load.get(key)) is not type(expected) or load.get(key) != expected:
            raise ValueError('saved/loaded state does not match high route: ' + key)
    base = save.get('baseDepth')
    if type(base) is not int or base < 0 or type(save.get('calleeDepth')) is not int or save.get('calleeDepth') != base + 2:
        raise ValueError('actual saved nested Call depth missing')
    if any(type(load.get(key)) is not int for key in ('baseDepth', 'savedCalleeDepth', 'returnedDepth')):
        raise ValueError('loaded Call depths must be exact integers')
    if (load.get('slot') != save['slot'] or load.get('baseDepth') != base
            or load.get('savedCalleeDepth') != base + 2 or load.get('returnedDepth') != base
            or load.get('editedContinuation') != 'Caller safely edited'):
        raise ValueError('loaded nested state must return to the edited caller')
    if (type(edit.get('replacementCount')) is not int or edit.get('replacementCount') != 1 or edit.get('beforeText') != 'Caller resumed'
            or edit.get('afterText') != 'Caller safely edited' or edit.get('bomPreserved') is not True
            or edit.get('allOtherBytesPreserved') is not True):
        raise ValueError('exact safe Source edit guarantees missing')
    for key in ('beforeSHA256', 'afterSHA256'):
        if not isinstance(edit.get(key), str) or not re.fullmatch('[a-f0-9]{64}', edit[key]):
            raise ValueError('safe Source edit hash missing')
    if edit['beforeSHA256'] == edit['afterSHA256']:
        raise ValueError('safe Source edit did not change caller')
    labels = [edit.get(key) for key in ('entryReturnLabel', 'calleeReturnLabel')]
    if any(not isinstance(label, str) or not re.fullmatch('[A-Za-z_][A-Za-z0-9_]*', label) for label in labels) or labels[0] == labels[1]:
        raise ValueError('distinct stable return labels missing')
    condition = one_record(text, 'phase-3a-sdk-structural-condition: ')
    if (condition.get('operation') != 'updateConditionBranch' or condition.get('passed') is not True
            or condition.get('oldHeader') != '    if flag:\n' or condition.get('newHeader') != '    if (flag == True):\n'
            or condition.get('expectedBody') != {'type': 'root'} or condition.get('bomPreserved') is not True
            or condition.get('allOtherBytesPreserved') is not True):
        raise ValueError('actual structural header emitter proof required')
    return {'cases': cases, 'terminal': terminal, 'save': save, 'safeEdit': edit, 'load': load, 'structuralCondition': condition}


def one_record(text, prefix):
    values = records(text, prefix)
    if len(values) != 1:
        raise ValueError('exactly one actual receipt required: ' + prefix)
    return values[0]


def sdk_artifacts_ok(directory, report):
    for name, key in (('save-receipt.json', 'save'), ('safe-edit.json', 'safeEdit'), ('load-receipt.json', 'load')):
        if json.loads((directory / name).read_text(encoding='utf-8')) != report[key]:
            raise ValueError('SDK file/log receipt mismatch: ' + name)
    condition = report['structuralCondition']
    if json.loads((directory / 'structural-condition.json').read_text(encoding='utf-8')) != condition:
        raise ValueError('structural condition file/log mismatch')
    old_condition = (directory / 'structural-condition-before.rpy').read_bytes()
    new_condition = (directory / 'structural-condition-accepted.rpy').read_bytes()
    old_header, new_header = condition['oldHeader'].encode(), condition['newHeader'].encode()
    if (old_condition.count(old_header) != 1 or old_condition.replace(old_header,new_header,1) != new_condition
            or not new_condition.startswith(b'\xef\xbb\xbf')
            or hashlib.sha256(old_condition).hexdigest() != condition.get('beforeSHA256')
            or hashlib.sha256(new_condition).hexdigest() != condition.get('afterSHA256')):
        raise ValueError('structural header emitter must preserve every other accepted byte')
    before = (directory / 'calls-accepted-entry.rpy').read_bytes()
    after = (directory / 'safe-edited-entry.rpy').read_bytes()
    if before.count(new_header) != 1 or after.count(new_header) != 1:
        raise ValueError('actual SDK cases must consume the structurally authored header')
    old, new = b'"Caller resumed"', b'"Caller safely edited"'
    if before.count(old) != 1 or before.replace(old, new, 1) != after or not after.startswith(b'\xef\xbb\xbf'):
        raise ValueError('saved-caller edit is not the exact qualified text delta')
    edit = report['safeEdit']
    if hashlib.sha256(before).hexdigest() != edit['beforeSHA256'] or hashlib.sha256(after).hexdigest() != edit['afterSHA256']:
        raise ValueError('safe Source edit bytes/hash mismatch')
    callee = (directory / 'calls-accepted-callee.rpy').read_bytes()
    for source, label in ((before, edit['entryReturnLabel']), (after, edit['entryReturnLabel']), (callee, edit['calleeReturnLabel'])):
        if source.count((' from ' + label).encode()) != 1:
            raise ValueError('stable return label missing or duplicated in accepted bytes')
    for case in CASES:
        digests = json.loads((directory / (case + '-source-digests.json')).read_text(encoding='utf-8'))
        entry = after if case in ('nested-call-return', 'reject-wrong-outcome') else before
        if digests.get(edit['path']) != hashlib.sha256(entry).hexdigest():
            raise ValueError('runtime case must seal its current accepted caller snapshot')
    for path in directory.rglob('*'):
        if path.is_file() and (path.suffix not in ('.rpy', '.json', '.log') or any(
                part.lower() in ('saves', "ren'py data", 'savetoken') for part in path.relative_to(directory).parts)):
            raise ValueError('save bytes/token material must not enter artifacts')
    return True


def controller_ok(text):
    report = one_record(text, 'phase-3a-controller-terminal: ')
    if report.get('selection') != 'full' or report.get('passed') is not True or report.get('cleanupComplete') is not True:
        raise ValueError('complete actual Story controller proof required')
    cases = report.get('cases', [])
    if [case.get('name') for case in cases] != list(CONTROLLER_TESTS) or any(case.get('passed') is not True for case in cases):
        raise ValueError('exact actual Story controller cases required')
    for key, expected in (('driverStarts', 2), ('sdkCommands', 0), ('credentialOperations', 0), ('aiOperations', 0)):
        if type(report.get(key)) is not int or report[key] != expected:
            raise ValueError('actual controller operation count wrong: ' + key)
    exits = report.get('driverExits')
    if not isinstance(exits, list) or len(exits) != 2 or any(exit.get('normal') is not True or exit.get('reaped') is not True for exit in exits):
        raise ValueError('both separate driver processes must exit normally and be reaped')
    reopen = cases[-1]
    for key in ('processRestart', 'staleSessionRefused', 'sourceMapsRetained', 'sessionHistoryReset'):
        if reopen.get(key) is not True:
            raise ValueError('separate process reopen guarantee missing: ' + key)
    return report


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
