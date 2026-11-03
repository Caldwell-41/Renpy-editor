"""Offline admission checks. Synthetic captures are never rendering evidence."""
import copy
import importlib.util
import json
import shutil
from pathlib import Path
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from PIL import Image

SPEC = importlib.util.spec_from_file_location('base_help_fidelity', Path(__file__).with_name('base_help_fidelity.py'))
proof = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(proof)
RUNNER_SPEC = importlib.util.spec_from_file_location('base_help_runner', Path(__file__).with_name('qualify-base-help-fidelity.py'))
runner = importlib.util.module_from_spec(RUNNER_SPEC)
RUNNER_SPEC.loader.exec_module(runner)


def accepted_fixture():
    """A synthetic receipt for gate tests, distinct from the public-core export."""
    source = proof.FIXTURE.read_text(encoding='utf-8')
    files = {proof.SOURCE_PATH: {'text': source, 'sha256': proof.digest(source.encode())}}
    metadata = json.dumps({'schemaVersion': 8})
    files['.renpy-editor/source-map.json'] = dict(text=metadata, sha256=proof.digest(metadata.encode()))
    cases = []
    for screen, width, height, state in proof.MATRIX:
        kinds = ['screen', 'fixed', 'frame', 'vbox' if screen == proof.SCREENS[0] else 'fixed', 'text', 'image', 'textbutton']
        nodes = [dict(start=index, kind=kind, properties={}) for index, kind in enumerate(kinds)]
        nodes[4]['properties']['font'] = 'fonts/base_help_font.ttf'
        nodes[5]['literal'] = 'images/ui base_help_seal.png'
        nodes[6]['properties']['text_font'] = 'fonts/base_help_font.ttf'
        request = dict(path=proof.SOURCE_PATH, screenName=screen, width=width, height=height, buttonState=state, expectedRevision=files[proof.SOURCE_PATH]['sha256'])
        plan = dict(revision=request['expectedRevision'], width=width, height=height, buttonState=state, available=True, limits=[], nodes=nodes)
        cases.append(dict(screen=screen, request=request, plan=plan))
    assets = [dict(kind=kind, relativePath=path, sha256=proof.digest(fixture.read_bytes())) for kind, (path, fixture) in proof.ASSETS.items()]
    return dict(outcome=proof.OUTCOME, publicCoreRequests=True, sourceMapSchemaVersion=8, files=files, assets=assets, cases=cases,
                exporterSourceSHA256=proof.digest((proof.REPO / 'app/src-core/src/screens/base_help_canvas_tests.rs').read_bytes()))


def captures(root, accepted, role):
    root.mkdir()
    (root / 'accepted.json').write_text(json.dumps(accepted), encoding='utf-8', newline='\n')
    records = []
    for case_key in proof.MATRIX:
        screen, width, height, state = case_key
        filename = proof.name(case_key) + '.png'
        image = Image.new('RGBA', (width, height), '#273649' if state == 'normal' else '#463729')
        image.putpixel((30, 30), (211, 218, 224, 255))
        image.save(root / filename)
        records.append(dict(screen=screen, aspect=[width, height], state=state, filename=filename,
                            imageSHA256=proof.digest((root / filename).read_bytes()), inputs=proof.inputs(accepted),
                            revision=proof.inputs(accepted)[proof.SOURCE_PATH], renderer='gl2',
                            sdkVersion='8.5.3.26051504', physical=[width, height], drawPerVirtual=2, guidesExcluded=True,
                            geometry=[dict(start=start, x=10, y=20, width=30, height=40) for start in range(2, 7)]))
    receipt = dict(outcome=proof.OUTCOME, role=role, passed=True, cleanupComplete=True, sourceUnchanged=True,
                   acceptedSHA256=proof.digest((root / 'accepted.json').read_bytes()), target='macos-arm64',
                   candidate='a' * 40, rendererSHA256=proof.digest((proof.REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()),
                   coreTestSHA256=proof.digest(b'designated core test'),
                   inputs=proof.inputs(accepted), sdkProcesses=4, confirmedSDKProcesses=4, uncertainSDKProcesses=0, sdkCliProcesses=3, helperSessions=1,
                   helperStartAccounting=dict(ownerStarts=1, ownerReturns=1, confirmed=1, charged=1, unconfirmed=0, uncertain=False),
                   caseStatuses=[dict(status='passed') for case in proof.MATRIX],
                   shutdown=dict(cooperative=True, cleanupComplete=True, exitCode=0), records=records,
                   commands=[dict(name=name, exitCode=0, timedOut=False, outputLimited=False, started=True, charged=1, uncertainStart=False, cleanupComplete=True) for name in ['compile', 'lint', 'run', 'run']])
    (root / 'result.json').write_text(json.dumps(receipt), encoding='utf-8', newline='\n')
    return receipt


class AdmissionTests(unittest.TestCase):
    def test_reference_retains_scratch_until_process_cleanup_is_proven(self):
        execute = runner.run_reference_command
        for cleanup in (None, False, True):
            with self.subTest(cleanup=cleanup), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                accepted = accepted_fixture()
                source = root / 'accepted.json'
                source.write_text(json.dumps(accepted), encoding='utf-8')
                output = root / 'normal'
                scratch = []
                def install(archive, checksum, destination):
                    destination.mkdir(parents=True)
                    scratch.append(destination.parent)
                error = OSError('controlled SDK failure')
                if cleanup is not None:
                    error.command_output = 'partial output'
                    error.command_exit_code = 61
                    error.command_cleanup_complete = cleanup
                    error.command_process_reaped = cleanup
                def fail(*args, **kwargs): raise error
                args = SimpleNamespace(accepted=source, archive=root/'unused', checksums=root/'unused',
                                       candidate='a'*40, output=output)
                manifest = dict(acceptedSHA256=proof.digest(source.read_bytes()))
                with patch.object(runner, 'preflight', return_value=manifest), \
                     patch.object(runner, 'install_verified_tar', side_effect=install), \
                     patch.object(runner, 'launcher_for', return_value=('unused-sdk',)), \
                     patch.object(runner, 'run_reference_command',
                                  side_effect=lambda argv, row: execute(argv, row, execute=fail)):
                    try:
                        with self.assertRaises(OSError) as raised: runner.reference(args)
                        self.assertIs(raised.exception, error)
                        receipt = json.loads((output/'result.json').read_text(encoding='utf-8'))
                        self.assertEqual(scratch[0].exists(), cleanup is not True)
                        self.assertEqual(receipt['scratchRemoved'], cleanup is True)
                        self.assertEqual(receipt['cleanupComplete'], cleanup is True)
                        self.assertEqual(receipt['scratchPath'], str(scratch[0]))
                        self.assertEqual(receipt['commands'][0]['argv'][0], 'unused-sdk')
                    finally:
                        shutil.rmtree(scratch[0], ignore_errors=True)

    def test_reference_errors_retain_started_or_uncertain_attempts_and_partial_cleanup(self):
        for observed in [False, True]:
            error = OSError('controlled adapter failure')
            if observed:
                error.command_output = 'retained output'
                error.command_exit_code = 61
                error.command_cleanup_complete = True
            def fail(*args, **kwargs):
                raise error
            row = {}
            with self.assertRaises(OSError) as caught:
                runner.run_reference_command(('unused',), row, execute=fail)
            self.assertIs(caught.exception, error)
            self.assertEqual(row['charged'], 1)
            self.assertEqual(row['started'], True if observed else None)
            self.assertEqual(row['uncertainStart'], not observed)
            self.assertEqual(row['cleanupComplete'], observed)
            if observed:
                self.assertEqual(row['partialOutput'], 'retained output')
                self.assertEqual(row['exitCode'], 61)

    def test_matching_old_candidates_cannot_pass_the_reviewed_candidate_gate(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            accepted = accepted_fixture()
            helper, normal = root / 'helper', root / 'normal'
            captures(helper, accepted, 'hidden-helper')
            captures(normal, accepted, 'normal-game')
            core = root / 'core-test'
            core.write_bytes(b'designated core test')
            with self.assertRaises(AssertionError):
                proof.compare(helper, normal, root / 'comparison', expected_candidate='c' * 40, core_test=core)

    def test_uniform_opaque_frames_cannot_count_as_a_composition(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / 'helper'
            accepted = accepted_fixture()
            receipt = captures(root, accepted, 'hidden-helper')
            row = receipt['records'][0]
            path = root / row['filename']
            Image.new('RGBA', tuple(row['aspect']), '#273649').save(path)
            row['imageSHA256'] = proof.digest(path.read_bytes())
            (root / 'result.json').write_text(json.dumps(receipt), encoding='utf-8', newline='\n')
            with self.assertRaises(AssertionError):
                proof.validate_capture_set(root, accepted, 'hidden-helper')

    def test_preflight_requires_complete_exact_source_matrix_and_typed_asset_hashes(self):
        accepted = accepted_fixture()
        proof.validate_accepted(accepted)
        for fault in ['partial', 'revision', 'font', 'asset', 'schema', 'source', 'state', 'substitute-font', 'limits']:
            with self.subTest(fault=fault):
                altered = copy.deepcopy(accepted)
                if fault == 'partial':
                    altered['cases'].pop()
                elif fault == 'revision':
                    altered['cases'][0]['plan']['revision'] = '0' * 64
                elif fault == 'font':
                    altered['assets'][0]['sha256'] = '0' * 64
                elif fault == 'asset':
                    altered['assets'] = altered['assets'][:1]
                elif fault == 'schema':
                    altered['sourceMapSchemaVersion'] = 7
                elif fault == 'source':
                    altered['files'][proof.SOURCE_PATH]['text'] += '\n'
                elif fault == 'state':
                    altered['cases'][0]['request']['buttonState'] = 'selected'
                elif fault == 'substitute-font':
                    altered['cases'][0]['plan']['nodes'][4]['properties']['font'] = 'DejaVuSans.ttf'
                else:
                    altered['cases'][0]['plan']['limits'] = ['Unresolved custom code']
                with self.assertRaises((AssertionError, KeyError, ValueError)):
                    proof.validate_accepted(altered)

    def test_exact_capture_gate_rejects_missing_stale_wrong_state_asset_and_pixel_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            accepted = accepted_fixture()
            helper, normal = root / 'helper', root / 'normal'
            original = captures(helper, accepted, 'hidden-helper')
            captures(normal, accepted, 'normal-game')
            core = root / 'core-test'
            core.write_bytes(b'designated core test')
            self.assertTrue(proof.compare(helper, normal, root / 'positive', expected_candidate='a' * 40, core_test=core)['passed'])
            for fault in ['missing', 'revision', 'state', 'asset', 'geometry', 'cleanup', 'scale', 'target', 'renderer', 'blank', 'pixel', 'core-binary']:
                with self.subTest(fault=fault):
                    receipt = copy.deepcopy(original)
                    row = receipt['records'][0]
                    image_path = helper / row['filename']
                    image_bytes = image_path.read_bytes()
                    if fault == 'missing':
                        receipt['records'].pop()
                    elif fault == 'revision':
                        row['revision'] = '0' * 64
                    elif fault == 'state':
                        row['state'] = 'hover'
                    elif fault == 'asset':
                        row['inputs']['game/images/ui base_help_seal.png'] = '0' * 64
                    elif fault == 'geometry':
                        row['geometry'][0]['x'] += 1
                    elif fault == 'cleanup':
                        receipt['cleanupComplete'] = False
                    elif fault == 'scale':
                        row['drawPerVirtual'] = 1
                    elif fault == 'target':
                        receipt['target'] = 'windows-x64'
                    elif fault == 'core-binary':
                        receipt['coreTestSHA256'] = '0' * 64
                    elif fault == 'renderer':
                        row['renderer'] = 'sw'
                    else:
                        with Image.open(image_path) as opened:
                            image = opened.convert('RGBA')
                        if fault == 'blank':
                            image = Image.new('RGBA', image.size)
                        else:
                            image.putpixel((20, 20), (255, 0, 0, 255))
                        image.save(image_path)
                        row['imageSHA256'] = proof.digest(image_path.read_bytes())
                    (helper / 'result.json').write_text(json.dumps(receipt), encoding='utf-8', newline='\n')
                    with self.assertRaises((AssertionError, KeyError, ValueError)):
                        proof.compare(helper, normal, root / fault, expected_candidate='a' * 40, core_test=core)
                    image_path.write_bytes(image_bytes)
                    (helper / 'result.json').write_text(json.dumps(original), encoding='utf-8', newline='\n')


if __name__ == '__main__':
    unittest.main()
