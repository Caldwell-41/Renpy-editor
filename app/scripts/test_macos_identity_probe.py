import importlib.util
import copy
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('identity_probe', Path(__file__).with_name('macos-identity-probe.py'))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class IdentityProbeTests(unittest.TestCase):
    def test_current_report_requires_exact_contract_case_assertions_identity_and_cleanup(self):
        for phase in probe.SCHEDULE:
            details = dict(contract=2, phase=phase, passed=True, stage='complete',
                           checks=probe.expected_checks(phase), localGets=len(probe.SCHEDULE[phase]),
                           processId=42, executablePath='/public/Loomlight.app/Contents/MacOS/loomlight')
            report = dict(evidence='runtime-ui-packaged', case='studio-settings', passed=True,
                          cleanupComplete=True, details=details)
            events = [dict(sequence=n+1, accepted=True) for n in range(len(probe.SCHEDULE[phase]))]
            args = (phase, 42, details['executablePath'], events, 0, False)
            probe.validate_report([report], *args)
            for field, value in [('contract', 1), ('phase', 9), ('passed', False),
                                 ('stage', 'open'), ('processId', 43), ('executablePath', '/other'),
                                 ('localGets', 99), ('checks', []),
                                 ('checks', details['checks'][:-1]), ('checks', details['checks'] * 2)]:
                bad = copy.deepcopy(report); bad['details'][field] = value
                with self.subTest(phase=phase, field=field), self.assertRaises(ValueError):
                    probe.validate_report([bad], *args)
            for field, value in [('case', 'other'), ('evidence', 'mock'), ('passed', False), ('cleanupComplete', False)]:
                bad = copy.deepcopy(report); bad[field] = value
                with self.assertRaises(ValueError): probe.validate_report([bad], *args)
            for reports in ([], [report, report]):
                with self.assertRaises(ValueError): probe.validate_report(reports, *args)
            with self.assertRaises(ValueError): probe.validate_report([report], phase, 42, details['executablePath'], events, 1, False)
            with self.assertRaises(ValueError): probe.validate_report([report], phase, 42, details['executablePath'], events, 0, True)
            with self.assertRaises(ValueError): probe.validate_report([report], phase, 42, details['executablePath'], events + [dict(sequence=99, accepted=True)], 0, False)

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
