"""Reject incomplete packaged-WebView control evidence without launching an app."""
import copy
import unittest
from uuid import UUID
from runtime_probe_cases import runtime_report_ok


STAGES = ('controls-bar-passed', 'controls-picker-passed', 'controls-validation-passed',
          'controls-history-passed', 'controls-source-passed', 'controls-reopen-passed')


def receipt():
    ids = [str(UUID(int=index)) for index in range(1, 7)]
    owner = dict(id=ids[0], rootId=ids[1], name='travel_notes', kind='dialog',
                 path='game/ui/travel_notes.rpy', resolved=True)
    reference = dict(assetId=ids[5], expectedAssetSha256='a' * 64, replacementSha256=None)
    states = ('normal', 'hover', 'selected', 'selectedHover', 'disabled', 'selectedDisabled')
    source = (f'# loomlight-screen: {ids[0]}\nscreen travel_notes():\n'
              f'    # loomlight-element: {ids[2]}\n    bar:\n'
              '        value VariableValue("coins", min=-10, max=90, step=1, force_step=True)\n'
              '        xsize 360\n        ysize 24\n'
              f'    # loomlight-element: {ids[3]}\n    imagebutton:\n'
              + ''.join(f'        {key} Transform("images/ui station_seal.png", xysize=(300, 80))\n'
                        for key in ('idle', 'hover', 'selected_idle', 'selected_hover', 'insensitive', 'selected_insensitive'))
              + '        action [SetVariable("coins", 21), Return()]\n'
              + '    use source_only_footer()\n\nscreen source_only_footer():\n    text "Protected neighbor"\n')
    return dict(evidence='runtime-ui-packaged', case='screen-controls', passed=True, cleanupComplete=True,
                details=dict(scenario='screen-controls', stage='complete',
                             stages=[dict(stage=name) for name in (*STAGES, 'complete')],
                             identity=owner, identities=ids[1:4], acceptedSource=source,
                             binding=dict(variableId=ids[4], minimum='-10', maximum='90'),
                             appearances={state:dict(reference) for state in states},
                             imageDecoded=True, nativeWebView=True, sdkExecuted=False))


class ScreenControlNativeEvidence(unittest.TestCase):
    def test_admits_complete_control_sequence(self):
        self.assertTrue(runtime_report_ok('screen-controls', receipt()))

    def test_refuses_missing_stages_references_source_and_native_boundary(self):
        for field, value in [('stages', []), ('binding', None), ('appearances', {}),
                             ('acceptedSource', ''), ('identity', None), ('identities', []),
                             ('imageDecoded', False), ('nativeWebView', False), ('sdkExecuted', True)]:
            with self.subTest(field=field):
                value_receipt = receipt()
                value_receipt['details'][field] = value
                self.assertFalse(runtime_report_ok('screen-controls', value_receipt))

    def test_refuses_partial_states_and_wrong_dimensions(self):
        for mutate in (lambda details: details['appearances'].pop('selectedHover'),
                       lambda details: details['binding'].update(minimum='-9'),
                       lambda details: details.update(acceptedSource=details['acceptedSource'].replace('(300, 80)', '(300, 81)')),
                       lambda details: details['appearances']['hover'].update(expectedAssetSha256='bad')):
            value = copy.deepcopy(receipt())
            mutate(value['details'])
            self.assertFalse(runtime_report_ok('screen-controls', value))


if __name__ == '__main__':
    unittest.main()
