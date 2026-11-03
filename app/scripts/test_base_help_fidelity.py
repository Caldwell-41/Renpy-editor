"""Offline admission checks. Synthetic captures are never rendering evidence."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

from PIL import Image

SPEC = importlib.util.spec_from_file_location('base_help_fidelity', Path(__file__).with_name('base_help_fidelity.py'))
proof = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(proof)


def accepted_fixture():
    """A synthetic receipt for gate tests, distinct from the public-core export."""
    source = proof.FIXTURE.read_text()
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
    (root / 'accepted.json').write_text(json.dumps(accepted))
    records = []
    for case_key in proof.MATRIX:
        screen, width, height, state = case_key
        filename = proof.name(case_key) + '.png'
        Image.new('RGBA', (width, height), '#273649' if state == 'normal' else '#463729').save(root / filename)
        records.append(dict(screen=screen, aspect=[width, height], state=state, filename=filename,
                            imageSHA256=proof.digest((root / filename).read_bytes()), inputs=proof.inputs(accepted),
                            revision=proof.inputs(accepted)[proof.SOURCE_PATH], renderer='gl2',
                            sdkVersion='8.5.3.26051504', physical=[width, height], drawPerVirtual=2, guidesExcluded=True,
                            geometry=[dict(start=start, x=10, y=20, width=30, height=40) for start in range(2, 7)]))
    receipt = dict(outcome=proof.OUTCOME, role=role, passed=True, cleanupComplete=True, sourceUnchanged=True,
                   acceptedSHA256=proof.digest((root / 'accepted.json').read_bytes()), target='macos-arm64',
                   candidate='a' * 40, rendererSHA256=proof.digest((proof.REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()),
                   coreTestSHA256='b' * 64,
                   inputs=proof.inputs(accepted), sdkProcesses=4, sdkCliProcesses=3, helperSessions=1,
                   shutdown=dict(cooperative=True, cleanupComplete=True, exitCode=0), records=records,
                   commands=[dict(name=name, exitCode=0, timedOut=False, outputLimited=False) for name in ['compile', 'lint', 'run', 'run']])
    (root / 'result.json').write_text(json.dumps(receipt))
    return receipt


class AdmissionTests(unittest.TestCase):
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
            self.assertTrue(proof.compare(helper, normal, root / 'positive')['passed'])
            for fault in ['missing', 'revision', 'state', 'asset', 'geometry', 'cleanup', 'scale', 'target', 'renderer', 'blank', 'pixel']:
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
                    (helper / 'result.json').write_text(json.dumps(receipt))
                    with self.assertRaises((AssertionError, KeyError, ValueError)):
                        proof.compare(helper, normal, root / fault)
                    image_path.write_bytes(image_bytes)
                    (helper / 'result.json').write_text(json.dumps(original))


if __name__ == '__main__':
    unittest.main()
