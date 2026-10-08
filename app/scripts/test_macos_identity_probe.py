import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('identity_probe', Path(__file__).with_name('macos-identity-probe.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class IdentityProbeTests(unittest.TestCase):
    def test_request_schedule_rejects_wrong_key_route_method_and_excess(self):
        for phase, expected in probe.SCHEDULE.items():
            for index, label in enumerate(expected):
                auth = 'Bearer ' + probe.SYNTHETIC[label]
                self.assertTrue(probe.accepted_request(phase, index, 'GET', '/v1/models', auth))
                for method, path, header in [('POST', '/v1/models', auth), ('GET', '/other', auth),
                                             ('GET', '/v1/models', 'Bearer wrong')]:
                    self.assertFalse(probe.accepted_request(phase, index, method, path, header))
            self.assertFalse(probe.accepted_request(phase, len(expected), 'GET', '/v1/models',
                                                   'Bearer ' + probe.SYNTHETIC['alpha']))
        self.assertEqual(sum(map(len, probe.SCHEDULE.values())), 8)
        self.assertFalse(probe.accepted_request(3, 2, 'GET', '/v1/models', 'Bearer ' + probe.SYNTHETIC['alpha']))

    def test_only_update_changes_binary_and_version_with_same_identity(self):
        old = dict(certificateSHA1='A', designatedRequirement='exact', executableSHA256='first', bundleVersion='0.1.0')
        new = dict(old, executableSHA256='second', bundleVersion='0.1.1')
        probe.check_transition(2, old, dict(passed=True, phase=1, bundle=old))
        probe.check_transition(3, new, dict(passed=True, phase=2, bundle=old))
        probe.check_transition(4, new, dict(passed=True, phase=3, bundle=new))
        for phase, current, prior in [(2, new, old), (3, old, old), (4, old, new)]:
            with self.assertRaises(ValueError):
                probe.check_transition(phase, current, dict(passed=True, phase=phase-1, bundle=prior))
        for field in ['certificateSHA1', 'designatedRequirement', 'bundleVersion']:
            with self.assertRaises(ValueError):
                probe.check_transition(2, dict(old, **{field:'changed'}), dict(passed=True, phase=1, bundle=old))
        for previous in [dict(passed=False, phase=1, bundle=old), dict(passed=True, phase=2, bundle=old), {}]:
            with self.assertRaises(ValueError):
                probe.check_transition(2, old, previous)


if __name__ == '__main__':
    unittest.main()
