"""Owned-component proof admission checks. These tests never start an SDK."""
import hashlib
import copy
import importlib.util
import json
from pathlib import Path
import unittest
import tempfile
from unittest.mock import patch
from types import SimpleNamespace
from PIL import Image, ImageDraw

SPEC = importlib.util.spec_from_file_location('owned_component', Path(__file__).with_name('qualify-owned-component.py'))
proof = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(proof)


def identity(number):
    return f'00000000-0000-4000-8000-{number:012x}'


def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()


def core_log(token):
    return ('running 1 test\ncomponent-inputs-sha256: ' + token + '\n'
            'test screens::components::tests::runtime_fixtures::frozen_two_panel_outputs_come_from_actual_component_transactions ... ok\n'
            'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 607 filtered out; finished in 2.71s\n')


def manifest(independent_comment=''):
    owners = [dict(id=identity(i), rootId=identity(i + 10), name=name,
                   path=f'game/ui/{name}.rpy', kind=kind)
              for i, name, kind in [(1, 'notes', 'panel'), (2, 'other', 'panel'),
                                    (3, 'shared_output', 'component'), (4, 'independent_output', 'component')]]
    project = dict(projectId=identity(99), sdk=dict(version='8.5.3', adapter='renpy-8.5.3'), resolution=dict(width=1280, height=720))
    stages = {}
    for stage in ['shared', 'independent']:
        active = owners[:3] if stage == 'shared' else owners
        sources, uses, use_lines = {}, [], {}
        for index, owner in enumerate(owners[:2]):
            component = owners[3] if stage == 'independent' and index == 1 else owners[2]
            line = f'        use {component["name"]} # loomlight-element: {identity(40 + index)}\n'
            sources[owner['path']] = (f'# loomlight-screen: {owner["id"]}\nscreen {owner["name"]}():\n'
                f'    fixed: # loomlight-element: {identity(30 + index)}\n'
                f'        xpos {40 if index == 0 else 680}\n        ypos 40\n        xsize 500\n        ysize 180\n' + line)
            if stage == 'independent' and index == 1:
                sources[owner['path']] += independent_comment
            uses.append(dict(screenId=owner['id'], componentId=component['id'], nodeId=identity(40 + index)))
            use_lines[owner['id']] = line
        for index, owner in enumerate(active[2:]):
            text = 'Shared edited' if index == 0 else 'Independent copy'
            sources[owner['path']] = (f'# loomlight-screen: {owner["id"]}\nscreen {owner["name"]}():\n'
                f'    vbox: # loomlight-element: {identity(50 + index * 2)}\n'
                f'        text {json.dumps(text)} # loomlight-element: {identity(51 + index * 2)}\n')
        mapping = dict(schemaVersion=7, projectId=project['projectId'], sources=list(sources), ownedScreens=active, componentUses=uses)
        sources.update({'.renpy-editor/project.json': json.dumps(project),
                        '.renpy-editor/source-map.json': json.dumps(mapping),
                        '.renpy-editor/authoring.json': '{}'})
        files = {path: dict(text=text, sha256=digest(text)) for path, text in sources.items()}
        map_revision = files['.renpy-editor/source-map.json']['sha256']
        inventory_revision = ('a' if stage == 'shared' else 'b') * 64
        targets = []
        for owner, usage in zip(owners[:2], uses):
            component = next(o for o in active if o['id'] == usage['componentId'])
            dependencies = [dict(id=owner['id'], revision=files[owner['path']]['sha256']),
                            dict(id=usage['nodeId'], revision=digest(use_lines[owner['id']])),
                            dict(id=component['id'], revision=files[component['path']]['sha256'])]
            targets.append(dict(binding=dict(screenId=owner['id'], sourceName=owner['name']), kind='panel', path=owner['path'], rootId=owner['rootId'],
                revisions=dict(source=files[owner['path']]['sha256'], sourceMap=map_revision, inventory=inventory_revision, effects='c' * 64),
                effects=dict(revision='c' * 64, unknown=False, hiddenScreens=[], dependencies=dependencies)))
        catalog = dict(projectRevision=files['.renpy-editor/project.json']['sha256'], sourceMapRevision=map_revision,
                       inventoryRevision=inventory_revision,
                       owned=[dict(o, resolved=True, sourceRevision=files[o['path']]['sha256']) for o in active])
        stages[stage] = dict(files=files, targets=targets, catalog=catalog)
    return dict(publicCoreRequests=True, executedSdk=False, sdkVersion='8.5.3', stages=stages,
                screenNames=['notes', 'other'], componentIds=[owners[2]['id'], owners[3]['id']],
                useIds=[identity(40), identity(41)],
                positions=[dict(screenId=owners[i]['id'], parentId=identity(30 + i), x=x, y=40) for i, x in enumerate([40, 680])])


class InputAdmission(unittest.TestCase):
    def test_core_receipt_requires_one_matching_digest_and_one_successful_export(self):
        token = 'a' * 64
        log = ('running 1 test\ncomponent-inputs-sha256: ' + token + '\n'
               'test screens::components::tests::runtime_fixtures::frozen_two_panel_outputs_come_from_actual_component_transactions ... ok\n'
               'test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 607 filtered out; finished in 2.71s\n')
        proof.validate_core_output(log, token)
        for fault in [log.replace('component-inputs-sha256: ' + token + '\n', ''),
                      log + 'component-inputs-sha256: ' + token + '\n',
                      log.replace(token, 'b' * 64), log + log,
                      log.replace(' ... ok', ' ... FAILED'),
                      log.replace('0 failed', '1 failed')]:
            with self.subTest(log=fault), self.assertRaises(ValueError):
                proof.validate_core_output(fault, token)

    def test_exact_shared_and_independent_sources_produce_only_runnable_ui_files(self):
        accepted = manifest()
        sources = proof.validate_inputs(accepted)
        self.assertEqual(set(sources), {'shared', 'independent'})
        self.assertEqual(len(sources['shared']), 3)
        self.assertEqual(len(sources['independent']), 4)
        self.assertTrue(all(path.startswith('game/ui/') for stage in sources.values() for path in stage))
        for stage, files in sources.items():
            for path, text in files.items():
                self.assertEqual(text, accepted['stages'][stage]['files'][path]['text'])

    def test_missing_duplicate_extra_or_wrong_source_is_rejected(self):
        for fault in ['missing', 'duplicate', 'extra', 'extra_script', 'wrong_literal', 'parameterized', 'unrelated_drift']:
            accepted = manifest()
            snapshot = accepted['stages']['shared']
            if fault == 'missing':
                del snapshot['files']['game/ui/shared_output.rpy']
            elif fault == 'duplicate':
                snapshot['catalog']['owned'].append(copy.deepcopy(snapshot['catalog']['owned'][0]))
            elif fault in ('extra', 'extra_script'):
                path = 'game/ui/unowned.rpy' if fault == 'extra' else 'game/unaccounted.rpy'
                snapshot['files'][path] = dict(text='screen unowned():\n    pass\n', sha256=digest('screen unowned():\n    pass\n'))
            elif fault == 'unrelated_drift':
                for stage, text in [('shared', '# kept\n'), ('independent', '# changed\n')]:
                    accepted['stages'][stage]['files']['game/script.rpy'] = dict(text=text, sha256=digest(text))
            else:
                path = 'game/ui/shared_output.rpy' if fault == 'wrong_literal' else 'game/ui/notes.rpy'
                old = snapshot['files'][path]['text']
                text = old.replace('Shared edited', 'Wrong text') if fault == 'wrong_literal' else old.replace('use shared_output ', 'use shared_output() ')
                snapshot['files'][path] = dict(text=text, sha256=digest(text))
                next(owner for owner in snapshot['catalog']['owned'] if owner['path'] == path)['sourceRevision'] = digest(text)
            with self.subTest(fault=fault), self.assertRaises(ValueError):
                proof.validate_inputs(accepted)

    def test_metadata_identity_revision_and_copy_scope_must_match_frozen_bytes(self):
        for fault in ['wrong_binding', 'duplicate_binding', 'wrong_owner', 'wrong_revision', 'missing_target',
                      'duplicate_target', 'wrong_dependency', 'owner_alias', 'child_alias', 'unsafe_path', 'copy_drift']:
            accepted = manifest('# changed comment\n' if fault == 'copy_drift' else '')
            snapshot = accepted['stages']['shared']
            mapping = json.loads(snapshot['files']['.renpy-editor/source-map.json']['text'])
            if fault == 'wrong_binding':
                mapping['componentUses'][0]['componentId'] = identity(2)
            elif fault == 'duplicate_binding':
                mapping['componentUses'].append(copy.deepcopy(mapping['componentUses'][0]))
            elif fault == 'wrong_owner':
                mapping['ownedScreens'][0]['rootId'] = identity(200)
            elif fault == 'wrong_revision':
                snapshot['targets'][0]['revisions']['sourceMap'] = '0' * 64
            elif fault == 'missing_target':
                snapshot['targets'].pop()
            elif fault == 'duplicate_target':
                snapshot['targets'][1] = copy.deepcopy(snapshot['targets'][0])
            elif fault == 'wrong_dependency':
                snapshot['targets'][0]['effects']['dependencies'][0]['revision'] = '0' * 64
            elif fault == 'owner_alias':
                mapping['ownedScreens'][2]['id'] = identity(12)
            elif fault == 'child_alias':
                independent = accepted['stages']['independent']
                path = 'game/ui/independent_output.rpy'
                text = independent['files'][path]['text'].replace(identity(52), identity(50))
                independent['files'][path] = dict(text=text, sha256=digest(text))
                next(o for o in independent['catalog']['owned'] if o['name'] == 'independent_output')['sourceRevision'] = digest(text)
                for target in independent['targets']:
                    for dependency in target['effects']['dependencies']:
                        if dependency['id'] == identity(4):
                            dependency['revision'] = digest(text)
            elif fault == 'unsafe_path':
                snapshot['files']['../outside.rpy'] = dict(text='', sha256=digest(''))
            if fault in ['wrong_binding', 'duplicate_binding', 'wrong_owner', 'owner_alias']:
                text = json.dumps(mapping)
                snapshot['files']['.renpy-editor/source-map.json'] = dict(text=text, sha256=digest(text))
                snapshot['catalog']['sourceMapRevision'] = digest(text)
                for target in snapshot['targets']:
                    target['revisions']['sourceMap'] = digest(text)
            with self.subTest(fault=fault), self.assertRaises(ValueError):
                proof.validate_inputs(accepted)


class RuntimeAdmission(unittest.TestCase):
    def test_images_require_exact_literal_pixels_and_visible_output_at_both_positions(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            image = Image.new('RGBA', (1280, 720), (0, 0, 0, 0))
            draw = ImageDraw.Draw(image)
            draw.rectangle((45, 45, 100, 65), fill='white')
            draw.rectangle((685, 45, 750, 65), fill='white')
            for name in ['actual', 'literal']:
                image.save(root / f'shared-1280x720-{name}.png')
            record = proof.validate_images(root, 'shared', 1280, 720)
            self.assertEqual(record['differingPixels'], 0)
            self.assertEqual(set(record['imageHashes']), {'actual', 'literal'})
            for fault in ['missing', 'wrong_size', 'pixel', 'blank', 'missing_second', 'solid_white', 'hidden_rgb']:
                for name in ['actual', 'literal']:
                    image.save(root / f'shared-1280x720-{name}.png')
                path = root / 'shared-1280x720-actual.png'
                if fault == 'missing':
                    path.unlink()
                elif fault == 'wrong_size':
                    Image.new('RGBA', (640, 360)).save(path)
                elif fault == 'pixel':
                    wrong = image.copy(); wrong.putpixel((50, 50), (255, 0, 0, 255)); wrong.save(path)
                elif fault in ('solid_white', 'hidden_rgb'):
                    wrong = Image.new('RGBA', image.size, (255, 255, 255, 255) if fault == 'solid_white' else (0, 0, 0, 255))
                    if fault == 'hidden_rgb':
                        for x in (40, 680):
                            wrong.putpixel((x + 5, 45), (255, 255, 255, 0))
                    for name in ('actual', 'literal'):
                        wrong.save(root / f'shared-1280x720-{name}.png')
                else:
                    wrong = Image.new('RGBA', image.size)
                    if fault == 'missing_second':
                        ImageDraw.Draw(wrong).rectangle((45, 45, 100, 65), fill='white')
                    for name in ['actual', 'literal']:
                        wrong.save(root / f'shared-1280x720-{name}.png')
                with self.subTest(fault=fault), self.assertRaises(ValueError):
                    proof.validate_images(root, 'shared', 1280, 720)

    def test_runtime_requires_unique_matching_stage_and_independent_text_semantics(self):
        record = dict(sdkVersion='8.5.3.26021501', stage='independent', aspect=[1280, 720],
                      acceptedSHA256='a' * 64, runId=identity(90),
                      imageHashes=dict(actual='d' * 64, literal='d' * 64),
                      renderer='gl2', physical=[1280, 720], drawPerVirtual=1.0,
                      actualTexts=['Shared edited', 'Independent copy'],
                      literalTexts=['Shared edited', 'Independent copy'], metadataPresent=False)
        log = 'OWNED_COMPONENT_PROOF ' + json.dumps(record) + '\n'
        self.assertEqual(proof.validate_runtime_output(log, 'independent', 1280, 720, 'a' * 64, identity(90)), record)
        for fault in ['missing', 'duplicate', 'stage', 'aspect', 'sdkVersion', 'actualTexts',
                      'literalTexts', 'metadataPresent', 'renderer', 'physical', 'drawPerVirtual', 'duplicate_json', 'acceptedSHA256', 'runId', 'imageHashes']:
            wrong = copy.deepcopy(record)
            replacements = dict(stage='shared', aspect=[1024, 768], sdkVersion='8.4.0',
                                actualTexts=['Shared edited', 'Shared edited'], literalTexts=[],
                                metadataPresent=True, renderer='', physical=[0, 720], drawPerVirtual=0,
                                acceptedSHA256='b' * 64, runId=identity(91), imageHashes=dict(actual='wrong'))
            if fault in replacements:
                wrong[fault] = replacements[fault]
            text = 'OWNED_COMPONENT_PROOF ' + json.dumps(wrong) + '\n'
            if fault == 'missing':
                text = 'RenPy exited without proof\n'
            elif fault == 'duplicate':
                text += text
            elif fault == 'duplicate_json':
                text = text.replace('"stage": "independent"', '"stage": "shared", "stage": "independent"')
            with self.subTest(fault=fault), self.assertRaises(ValueError):
                proof.validate_runtime_output(text, 'independent', 1280, 720, 'a' * 64, identity(90))


class CommandAdmission(unittest.TestCase):
    def test_missing_runtime_proof_stops_campaign_after_first_run(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]) as temporary:
            root = Path(temporary)
            accepted, log, output = root / 'accepted.json', root / 'core.log', root / 'attempt'
            accepted.write_text(json.dumps(manifest()))
            log.write_text(core_log(hashlib.sha256(accepted.read_bytes()).hexdigest()))
            checksum = root / 'checksums.txt'
            checksum.write_text('# sha256\n' + proof.SDK_SHA + '  renpy-8.5.3-sdk.tar.bz2\n')
            def fake_install(archive, digest, destination):
                sdk = destination / 'renpy-8.5.3-sdk'
                sdk.mkdir(parents=True)
                (sdk / 'renpy.sh').write_text('mocked launcher only')
            success_without_proof = SimpleNamespace(exit_code=0, output='no proof', timed_out=False,
                                                    output_limited=False, duration_seconds=0.1)
            with patch.object(proof, 'install_verified_tar', side_effect=fake_install), patch.object(proof, 'run_bounded', return_value=success_without_proof) as launch:
                with self.assertRaisesRegex(ValueError, 'missing or duplicate runtime proof'):
                    proof.main(['--allow-fixture-execution', '--sdk-process-limit', '8', '--accepted', str(accepted),
                                '--core-log', str(log), '--output', str(output),
                                '--archive', str(root / 'renpy-8.5.3-sdk.tar.bz2'), '--checksums', str(checksum)])
                self.assertEqual(launch.call_count, 3)
            result = json.loads((output / 'result.json').read_text())
            self.assertEqual(result['sdkProcesses'], 3)
            self.assertFalse(result['passed'])
            self.assertEqual(result['records'], [])
            self.assertTrue(result['cleanupComplete'])

    def test_failed_sdk_attempt_is_charged_once_stops_and_cleans_local_scratch(self):
        for failure in [SimpleNamespace(exit_code=61, output='fixture failed', timed_out=False,
                                        output_limited=False, duration_seconds=0.1), OSError('launch outcome unknown')]:
            with self.subTest(failure=failure), tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]) as temporary:
                root = Path(temporary)
                accepted, log, output = root / 'accepted.json', root / 'core.log', root / 'attempt'
                accepted.write_text(json.dumps(manifest()))
                log.write_text(core_log(hashlib.sha256(accepted.read_bytes()).hexdigest()))
                checksum = root / 'checksums.txt'
                checksum.write_text('# sha256\n' + proof.SDK_SHA + '  renpy-8.5.3-sdk.tar.bz2\n')
                def fake_install(archive, digest, destination):
                    sdk = destination / 'renpy-8.5.3-sdk'
                    sdk.mkdir(parents=True)
                    (sdk / 'renpy.sh').write_text('not executable; mocked test boundary only')
                with patch.object(proof, 'install_verified_tar', side_effect=fake_install), patch.object(proof, 'run_bounded') as launch:
                    if isinstance(failure, Exception):
                        launch.side_effect = failure
                    else:
                        launch.return_value = failure
                    with self.assertRaises((ValueError, OSError)):
                        proof.main(['--allow-fixture-execution', '--sdk-process-limit', '8', '--accepted', str(accepted),
                                    '--core-log', str(log), '--output', str(output),
                                    '--archive', str(root / 'renpy-8.5.3-sdk.tar.bz2'), '--checksums', str(checksum)])
                    launch.assert_called_once()
                result = json.loads((output / 'result.json').read_text())
                self.assertFalse(result['passed'])
                self.assertEqual(result['sdkProcesses'], 1)
                self.assertEqual(len(result['commands']), 1)
                self.assertTrue(result['scratchCleanupComplete'])
                self.assertEqual(result['cleanupComplete'], not isinstance(failure, Exception))
                self.assertFalse(list(output.glob('.component-proof-*')))

    def test_prepared_runtime_project_has_exact_ui_bytes_and_independent_literal_fixture(self):
        sources = proof.validate_inputs(manifest())
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for stage in ['shared', 'independent']:
                project = root / stage
                hashes = proof.prepare_runtime_project(project, sources[stage], stage, 1280, 720, root,
                                                       dict(acceptedSHA256='a' * 64, runId=identity(90)))
                self.assertFalse((project / '.renpy-editor').exists())
                self.assertEqual(len(hashes), len(sources[stage]) + 4)
                for path, text in sources[stage].items():
                    self.assertEqual((project / path).read_bytes(), text.encode())
                reference = (project / 'game/reference.rpy').read_text()
                self.assertNotRegex(reference, r'(?m)^\s*use ')
                self.assertNotIn('loomlight-element', reference)
                self.assertEqual(reference.count('text "Shared edited"'), 2 if stage == 'shared' else 1)
                self.assertEqual(reference.count('text "Independent copy"'), 0 if stage == 'shared' else 1)
                self.assertIn('label start:', (project / 'game/script.rpy').read_text())
                self.assertNotIn('Start()', (project / 'game/script.rpy').read_text())

    def test_validate_only_and_invalid_input_never_install_or_launch_sdk(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).resolve().parents[2]) as temporary:
            root = Path(temporary)
            accepted, log, output = root / 'accepted.json', root / 'core.log', root / 'validated'
            accepted.write_text(json.dumps(manifest()))
            log.write_text(core_log(hashlib.sha256(accepted.read_bytes()).hexdigest()))
            with patch.object(proof, 'install_verified_tar') as install, patch.object(proof, 'run_bounded') as launch:
                proof.main(['--validate-only', '--accepted', str(accepted), '--core-log', str(log), '--output', str(output)])
                result = json.loads((output / 'result.json').read_text())
                self.assertFalse(result['executedSdk'])
                self.assertEqual(result['sdkProcesses'], 0)
                self.assertEqual(len(result['plannedCases']), 4)
                self.assertEqual(len(result['runtimeProjectSHA256']), 4)
                for stage in ['shared', 'independent']:
                    for aspect in ['1280x720', '1024x768']:
                        runnable = output / 'runnable' / f'{stage}-{aspect}'
                        self.assertTrue((runnable / 'game/ui/notes.rpy').is_file())
                        self.assertFalse((runnable / '.renpy-editor').exists())
                self.assertFalse(result['passed'])
                self.assertTrue(result['inputsValidated'])
                log.write_text(core_log('b' * 64))
                with self.assertRaises(ValueError):
                    proof.main(['--allow-fixture-execution', '--sdk-process-limit', '8', '--accepted', str(accepted),
                                '--core-log', str(log), '--output', str(root / 'invalid'),
                                '--archive', str(root / 'missing-sdk.tar.bz2'), '--checksums', str(root / 'missing-checksums.txt')])
                self.assertFalse((root / 'invalid').exists())
                install.assert_not_called()
                launch.assert_not_called()


if __name__ == '__main__':
    unittest.main()
