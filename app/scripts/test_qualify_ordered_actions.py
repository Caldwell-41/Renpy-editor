"""Offline admission tests for normal-play action evidence. Starts no engine."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
import tempfile

spec = importlib.util.spec_from_file_location('ordered_actions_gate', Path(__file__).with_name('qualify-ordered-actions.py'))
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class OrderedActionsEvidence(unittest.TestCase):
    def setUp(self):
        self.actions = [dict(type='setVariable', variableId='ready', value=True),
                        dict(type='setVariable', variableId='score', value='9007199254740993'),
                        dict(type='showScreen', target=dict(screenId='panel', sourceName='notes')),
                        dict(type='setVariable', variableId='score', value='-7'),
                        dict(type='setVariable', variableId='caption', value='[score] {b}literal{/b}'),
                        dict(type='hideScreen', target=dict(screenId='panel', sourceName='notes')),
                        dict(type='setVariable', variableId='ready', value=False), dict(type='finishInteraction')]
        self.manifest = dict(actions=self.actions, files=[dict(path='game/script.rpy', sha256='b'*64)],
                             expected=dict(ready=False, score='-7', caption='[score] {b}literal{/b}', panelVisible=False, followingCount=1))
        waiting = dict(step='waiting', followingCount=0, doneCount=0, ready=False, score='0', caption='Initial',
                       dialogVisible=True, panelVisible=False, calls=0)
        final = dict(followingCount=1, doneCount=0, ready=False, score='-7', caption=self.manifest['expected']['caption'],
                     dialogVisible=False, panelVisible=False, calls=8)
        self.row = dict(schemaVersion=1, sdkVersion='8.5.3', case='click', resolution=[1280, 720],
                        manifestSHA256='a'*64, acceptedHashes={'game/script.rpy':'b'*64},
                        normalEntry=True, startedFromMenu=True, builtinsUnmodified=True,
                        observer='sys.setprofile built-in action calls',
                        calls=[dict(action=action, panelVisible=visible) for action, visible in zip(self.actions, [False, False, False, True, True, True, False, False])],
                        observations=[waiting, dict(final, step='finished'), dict(final, step='settled')])

    def log(self, row):
        return ('global.ordered_actions::' + row['case'] + '\n[rpytest] Status: PASSED\n'
                '[rpytest] Test cases : 2 | 1 passed | 0 xfailed | 0 failed | 0 xpassed | 1 skipped | 0 not run\n'
                '[rpytest] Time: 0.5 s\nORDERED_ACTIONS_OBSERVED ' + json.dumps(row))

    def validate(self, row, log=None):
        return gate.validate_runtime_output(log or self.log(row), row['case'], 'a'*64, self.manifest, [1280, 720])

    def test_complete_observed_order_is_admitted(self):
        self.assertEqual(self.validate(self.row), self.row)

    def test_reporter_trailing_whitespace_is_admitted(self):
        text = self.log(self.row).replace('Status: PASSED\n', 'Status: PASSED \t\r\n')
        self.assertEqual(self.validate(self.row, text), self.row)

    def test_duplicate_reordered_missing_or_wrong_visibility_action_refuses(self):
        for mutate in [lambda r: r['calls'].append(copy.deepcopy(r['calls'][0])),
                       lambda r: r['calls'].reverse(), lambda r: r['calls'].pop(),
                       lambda r: r['calls'][3].update(panelVisible=False)]:
            bad=copy.deepcopy(self.row); mutate(bad)
            with self.assertRaises(ValueError): self.validate(bad)

    def test_wrong_source_entry_count_type_or_settled_value_refuses(self):
        for field,value in [('manifestSHA256','c'*64),('acceptedHashes',{}),('normalEntry',False),
                            ('startedFromMenu',False),('builtinsUnmodified',False)]:
            bad=copy.deepcopy(self.row); bad[field]=value
            with self.subTest(field=field),self.assertRaises(ValueError): self.validate(bad)
        for field,value in [('followingCount',2),('doneCount',1),('ready',0),('score',-7),('caption','evaluated'),('calls',9)]:
            bad=copy.deepcopy(self.row);bad['observations'][-1][field]=value
            with self.subTest(field=field),self.assertRaises(ValueError): self.validate(bad)

    def test_zero_skipped_duplicate_or_missing_engine_result_refuses(self):
        text=self.log(self.row)
        for bad in [text.replace('1 passed','0 passed'),text.replace('0 failed','1 failed'),
                    text.replace('1 skipped','0 skipped'),text.replace('Status: PASSED','Status: FAILED'),
                    text.replace('0.5 s','0.0 s'),text+'\nORDERED_ACTIONS_OBSERVED '+json.dumps(self.row),
                    text.replace('[rpytest] Status: PASSED\n',''),
                    text+'\n[rpytest] Status: PASSED \t',
                    text.replace('Status: PASSED','Status: PASSED extra')]:
            with self.assertRaises(ValueError): self.validate(self.row,bad)

    def test_preintegration_export_cannot_qualify_as_runtime_ready(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/'manifest.json').write_text(json.dumps(dict(schemaVersion=1,sdkVersion='8.5.3',
                publicCoreRequests=True,engineStarted=False,runtimeReady=False,normalStoryCallAdmitted=False)))
            with self.assertRaisesRegex(ValueError,'pre-integration export'):
                gate.validate_bundle(root)


if __name__ == '__main__': unittest.main()
