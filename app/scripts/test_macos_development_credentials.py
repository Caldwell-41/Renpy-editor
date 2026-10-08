import importlib.util
import copy
from pathlib import Path
import tempfile
import time
import unittest
import uuid

spec = importlib.util.spec_from_file_location("dev_probe", Path(__file__).with_name("macos-development-credentials.py"))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

class DevelopmentFixtureTests(unittest.TestCase):
    def test_exact_fixture_and_all_request_boundaries(self):
        fixture = probe.fixture()
        self.assertEqual([p['profileId'] for p in fixture['profileStore']['profiles']], list(probe.IDS.values()))
        for phase, labels in probe.SCHEDULE.items():
            for index, label in enumerate(labels):
                token = 'Bearer ' + fixture['nativeInputs'][label]
                self.assertTrue(probe.accepted_request(phase, index, 'GET', '/v1/models', token))
                for method, path, auth in [('POST', '/v1/models', token), ('GET', '/models', token), ('GET', '/v1/models', 'Bearer wrong')]:
                    self.assertFalse(probe.accepted_request(phase, index, method, path, auth))
            self.assertFalse(probe.accepted_request(phase, len(labels), 'GET', '/v1/models', token))
        self.assertEqual(sum(map(len, probe.SCHEDULE.values())), 8)

    def test_transition_rejects_failed_wrong_identity_and_build(self):
        old = dict(certificateSHA1='pin', designatedRequirement='requirement', identifier='id', executableSHA256='a', bundleVersion='1')
        new = dict(old, executableSHA256='b', bundleVersion='2')
        previous = dict(passed=True, phase=2, bundle=old)
        probe.check_transition(3, new, previous)
        for candidate, receipt in [(old, previous), (dict(new, identifier='other'), previous), (new, dict(previous, passed=False)), (new, dict(previous, phase=1))]:
            with self.assertRaises(ValueError): probe.check_transition(3, candidate, receipt)
        probe.check_transition(4, new, dict(passed=True, phase=3, bundle=new))

    def test_isolation_private_snapshot_and_no_credential_creation(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-studio-dev-credentials-') as directory:
            root = Path(directory)
            probe.write(root/'ai-profiles.json', probe.fixture()['profileStore'], exclusive=True)
            self.assertEqual(probe.isolated_root({'root':directory}), root)
            snap = probe.snapshot(root)
            self.assertEqual(list(snap['files']), ['ai-profiles.json'])
            (root/'ai-profiles.json').chmod(0o644)
            with self.assertRaises(ValueError): probe.snapshot(root)
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaises(ValueError): probe.isolated_root({'root':directory})

    def test_steps_refuse_out_of_order_and_unconfirmed_save(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-studio-dev-credentials-') as directory, tempfile.TemporaryDirectory() as report:
            root, output = Path(directory), Path(report)
            probe.write(root/'ai-profiles.json', probe.fixture()['profileStore'], exclusive=True)
            probe.write(output/'state.json', {'root': directory}, exclusive=True)
            probe.write(output/'phase-1-launch.json', {'deadlineUnix': time.time()+60}, exclusive=True)
            probe.write(output/'phase-1-before.json', probe.snapshot(root), exclusive=True)
            with self.assertRaisesRegex(ValueError, 'out-of-order'):
                probe.step(output, 1, 'gamma-saved')
            with self.assertRaisesRegex(ValueError, 'did not publish'):
                probe.step(output, 1, 'alpha-saved')
            self.assertFalse((output/'phase-1-step-1.json').exists())
            self.assertFalse((root/'credentials-dev').exists())

    def test_confirmed_saves_require_owned_private_format_files_for_every_profile(self):
        for label in probe.IDS:
            with self.subTest(label=label), tempfile.TemporaryDirectory(prefix='loomlight-studio-dev-credentials-') as directory:
                root = Path(directory)
                previous = {'store': copy.deepcopy(probe.fixture()['profileStore'])}
                current = copy.deepcopy(previous)
                generation, credential_id = str(uuid.uuid4()), str(uuid.uuid4())
                current['store'].update(schemaVersion=2, developmentGenerations=[generation], activeDevelopmentGeneration=generation)
                profile, old = probe.active(current, label), probe.active(previous, label)
                profile['revision'] += 1
                profile['credential'] = dict(credentialId=credential_id, origin='http://127.0.0.1:46081',
                    revision=old['credential']['revision']+1 if old['credential'] else 1,
                    storage=dict(kind='developmentFile', generationId=generation))
                key, record = probe.paths(root, current, label)
                record.parent.mkdir(mode=0o700, parents=True)
                key.write_bytes(b'LLKEY\x01' + bytes(32)); key.chmod(0o600)
                record.write_bytes(b'LLREC\x01' + bytes(41)); record.chmod(0o600)
                probe.confirmed_save(root, current, previous, label)
                for mutation in ['missing', 'native', 'unowned', 'wrong-active', 'disabled', 'wrong-revision', 'wrong-origin']:
                    bad = copy.deepcopy(current)
                    candidate = probe.active(bad, label)
                    if mutation == 'missing': candidate['credential'] = None
                    elif mutation == 'native': candidate['credential'].pop('storage')
                    elif mutation == 'unowned': bad['store']['developmentGenerations'] = []
                    elif mutation == 'wrong-active': bad['store']['activeDevelopmentGeneration'] = str(uuid.uuid4())
                    elif mutation == 'disabled': candidate['disabled'] = True
                    elif mutation == 'wrong-revision': candidate['credential']['revision'] += 1
                    elif mutation == 'wrong-origin': candidate['credential']['origin'] = 'http://127.0.0.1:1'
                    with self.assertRaises(ValueError): probe.confirmed_save(root, bad, previous, label)
                for path in [key, record]:
                    original = path.read_bytes()
                    for bad_bytes in [b'', original[:5]+b'\x02'+original[6:], original+bytes(4143)]:
                        path.write_bytes(bad_bytes)
                        with self.assertRaises(ValueError): probe.confirmed_save(root, current, previous, label)
                    path.unlink()
                    with self.assertRaises(ValueError): probe.confirmed_save(root, current, previous, label)
                    path.write_bytes(original); path.chmod(0o600)

    def test_cancel_rejects_file_change_even_when_profiles_are_identical(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-studio-dev-credentials-') as directory, tempfile.TemporaryDirectory() as report:
            root, output = Path(directory), Path(report)
            store = copy.deepcopy(probe.fixture()['profileStore'])
            generation, credential_id = str(uuid.uuid4()), str(uuid.uuid4())
            store.update(schemaVersion=2, developmentGenerations=[generation], activeDevelopmentGeneration=generation)
            store['profiles'][0]['credential'] = dict(credentialId=credential_id, origin='http://127.0.0.1:46081', revision=1,
                storage=dict(kind='developmentFile', generationId=generation))
            probe.write(root/'ai-profiles.json', store, exclusive=True)
            probe.write(output/'state.json', {'root':directory}, exclusive=True)
            probe.write(output/'phase-3-launch.json', {'deadlineUnix':time.time()+60}, exclusive=True)
            index = probe.STEPS[3].index('cancelled')
            probe.write(output/f'phase-3-step-{index}.json', {'snapshot':probe.snapshot(root)}, exclusive=True)
            probe.write(root/'changed.json', {}, exclusive=True)
            with self.assertRaisesRegex(ValueError, 'persistent files'):
                probe.step(output, 3, 'cancelled')
            self.assertFalse((output/f'phase-3-step-{index+1}.json').exists())

if __name__ == '__main__': unittest.main()
