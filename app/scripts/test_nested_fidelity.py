"""Offline L19 gate checks with controlled capture data, no SDK/helper starts."""
import ast
import copy
import json
from pathlib import Path
import tempfile
import textwrap
import unittest

from PIL import Image
import nested_fidelity as fidelity


class NestedFidelityGates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import os
        path = os.environ.get('LOOMLIGHT_NESTED_FIDELITY_INPUTS')
        if path is None:
            raise RuntimeError('Set LOOMLIGHT_NESTED_FIDELITY_INPUTS to the public-core offline export')
        cls.raw = (Path(path) / 'accepted.json').read_bytes()
        cls.accepted = fidelity.validate_accepted(json.loads(cls.raw))

    def test_acceptance_rejects_missing_matrix_stale_metadata_and_executable_nodes(self):
        for mutate in (lambda data: data['cases'].pop(),
                       lambda data: data['files'].pop(json.loads(data['files']['.renpy-editor/project.json']['text'])['scenes'][0]['sourcePath']),
                       lambda data: data['files']['.renpy-editor/source-map.json'].update(sha256='0'*64),
                       lambda data: data['cases'][0]['plan']['nodes'][1].update(kind='python')):
            with self.subTest(mutate=mutate):
                accepted = copy.deepcopy(self.accepted); mutate(accepted)
                with self.assertRaises(AssertionError):
                    fidelity.validate_accepted(accepted)

    def test_normal_instrumentation_parses_without_importing_helper_construction(self):
        source = (fidelity.FIXTURE_ROOT / 'nested-fidelity-proof.rpy').read_text()
        python = source.split('init python:\n', 1)[1].split('screen nested_fidelity_capture():')[0]
        ast.parse(textwrap.dedent(python))
        self.assertIn('renpy.get_screen("nested_fidelity")', python)
        self.assertNotIn('_canvas_build', python)
        self.assertNotIn('renpy.display.layout.', python)

    def test_normal_sample_is_applied_after_game_start_defaults(self):
        source = (fidelity.FIXTURE_ROOT / 'nested-fidelity-proof.rpy').read_text()
        start = source.split('label start:', 1)[1].split('show screen nested_fidelity', 1)[0]
        assignments = [line.strip()[2:] for line in start.splitlines() if line.strip().startswith('$ nested_caption =')]
        self.assertEqual(len(assignments), 1, "Apply the sample after Ren'Py start defaults, before showing its screen")
        # Execute only this repository-owned literal assignment, with a controlled
        # namespace. No SDK or project initializer is imported or executed.
        namespace = dict(nested_caption='Nested café', NESTED_SAMPLE="[never()] {b}literal{/b}")
        exec(compile(assignments[0], '<trusted normal fixture assignment>', 'exec'), {}, namespace)
        self.assertEqual(namespace['nested_caption'], namespace['NESTED_SAMPLE'])

    def test_normal_observer_measures_the_sized_add_instead_of_its_named_image(self):
        import hashlib
        from contextlib import redirect_stdout
        from io import StringIO
        from types import SimpleNamespace

        source = (fidelity.FIXTURE_ROOT / 'nested-fidelity-proof.rpy').read_text()
        python = textwrap.dedent(source.split('init python:\n', 1)[1].split('screen nested_fidelity_capture():')[0])
        namespace = {}
        exec(compile(python, '<trusted normal fixture observer>', 'exec'), namespace)

        class Displayable:
            def __init__(self, name=None, children=(), main=None, size=(80, 40)):
                self.id, self.children, self._main, self.size = name, children, main, size
                self.offsets = [(index * 60, 0) for index in range(len(children))]

            def visit(self):
                return self.children

            def render(self, width, height, st, at):
                for child in self.children:
                    child.render(width, height, st, at)
                return SimpleNamespace(get_size=lambda: self.size)

        # Screen Language's sl2add returns a sizing Transform with _main set to
        # the image; SLDisplayable assigns the widget ID to that inner image.
        # Observe the actual wrapper, including repeated component instances.
        images = [Displayable('seal'), Displayable('seal')]
        first, second = [Displayable(children=(image,), main=image, size=(49, 63)) for image in images]
        title = Displayable('title', size=(78, 30))
        root = Displayable('cell', (first, second, title), size=(160, 90))
        rows = [dict(widgetId=name, selectionStart=index, clips=False)
                for index, name in enumerate(('cell', 'seal', 'seal', 'title'))]

        def quit_game(status, save):
            raise SystemExit(status)

        with tempfile.TemporaryDirectory() as directory:
            project = Path(directory)
            source_path = project / fidelity.SOURCE
            source_path.parent.mkdir(parents=True)
            source_path.write_bytes(b'# controlled source\n')
            namespace.update(
                NESTED_CASE=dict(widgets=rows, viewportState=dict(x=0, y=0)),
                NESTED_SAMPLE='literal', nested_caption='literal', main_menu=False,
                NESTED_INPUTS={fidelity.SOURCE: hashlib.sha256(source_path.read_bytes()).hexdigest()},
                NESTED_OUTPUT=directory,
                config=SimpleNamespace(basedir=directory, screen_width=1280, screen_height=720),
                renpy=SimpleNamespace(
                    get_screen=lambda name: SimpleNamespace(child=root), free_memory=lambda: None,
                    render=lambda screen, w, h, st, at: screen.child.render(w, h, st, at),
                    render_to_file=lambda render, path, resize: Image.new('RGBA', (1280, 720)).save(path),
                    get_renderer_info=lambda: dict(renderer='gl2'), version_only='8.5.3.26051504',
                    get_physical_size=lambda: (1280, 720),
                    display=SimpleNamespace(draw=SimpleNamespace(draw_per_virt=1)), quit=quit_game))
            output = StringIO()
            with redirect_stdout(output), self.assertRaises(SystemExit) as stopped:
                namespace['_nested_capture']()
            self.assertEqual(stopped.exception.code, 0)
            records = output.getvalue().splitlines()
            self.assertEqual(len(records), 1)
            result = json.loads(records[0].removeprefix('NESTED_FIDELITY '))
            self.assertEqual([(box['start'], box['width'], box['height']) for box in result['geometry']],
                             [(0, 160, 90), (1, 49, 63), (2, 49, 63), (3, 78, 30)])

    def captures(self, root, role):
        (root / 'accepted.json').write_bytes(self.raw)
        records = []
        for case in self.accepted['cases']:
            width, height = case['request']['width'], case['request']['height']
            filename = f'nested_fidelity-{width}x{height}-normal.png'
            image = Image.new('RGBA', (width, height), '#182839')
            image.putpixel((10, 10), (200, 100, 50, 255)); image.save(root / filename)
            geometry = [dict(start=widget['selectionStart'], x=10, y=20, width=30, height=40)
                        for widget in case['widgets'] if widget['widgetId'] != 'hidden_label']
            records.append(dict(screen='nested_fidelity', aspect=[width,height], state='normal', viewportState=dict(x=0,y=0),
                                filename=filename, imageSHA256=fidelity.digest((root / filename).read_bytes()), geometry=geometry,
                                inputs=fidelity.inputs(self.accepted), revision=self.accepted['files'][fidelity.SOURCE]['sha256'], guidesExcluded=True,
                                renderer='gl2', sdkVersion='8.5.3.26051504', physical=[width,height], drawPerVirtual=1))
        receipt = dict(outcome=fidelity.OUTCOME, role=role, candidate='a'*40, target='macos-arm64', passed=True, sourceUnchanged=True,
                       cleanupComplete=True, acceptedSHA256=fidelity.digest(self.raw), inputs=fidelity.inputs(self.accepted), records=records,
                       rendererSHA256=fidelity.digest((fidelity.REPO / 'app/src-core/src/screens/canvas-renderer.rpy').read_bytes()))
        if role == 'normal-game':
            receipt.update(commands=[dict(name=name, started=True, exitCode=0, cleanupComplete=True, uncertainStart=False, timedOut=False, outputLimited=False) for name in ('compile','lint','run','run')], sdkProcesses=4, confirmedSDKProcesses=4, uncertainSDKProcesses=0)
        else:
            receipt.update(sdkCliProcesses=3, helperSessions=1, helperStartAccounting=dict(ownerStarts=1,ownerReturns=1,confirmed=1,charged=1,uncertain=False),
                           shutdown=dict(cooperative=True,cleanupComplete=True,exitCode=0), coreTestSHA256=fidelity.digest(b'offline test executable'), caseStatuses=[dict(status='passed')]*2)
        (root / 'result.json').write_text(json.dumps(receipt))
        return receipt

    def test_comparison_rejects_a_single_pixel_geometry_order_and_failed_cleanup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); helper = root/'helper'; normal=root/'normal'; helper.mkdir(); normal.mkdir()
            core = root/'core'; core.write_bytes(b'offline test executable')
            self.captures(helper, 'hidden-helper'); reference = self.captures(normal, 'normal-game')
            self.assertTrue(fidelity.compare(helper, normal, root/'exact', expected_candidate='a'*40, core_test=core)['passed'])
            filename = reference['records'][0]['filename']
            with Image.open(normal / filename) as image:
                image.putpixel((11, 10), (199,100,50,255)); image.save(normal / filename)
            reference['records'][0]['imageSHA256'] = fidelity.digest((normal / filename).read_bytes())
            (normal/'result.json').write_text(json.dumps(reference))
            with self.assertRaisesRegex(AssertionError, 'Rendering differences'):
                fidelity.compare(helper, normal, root/'different', expected_candidate='a'*40, core_test=core)
            reference = self.captures(normal, 'normal-game')
            reference['records'][0]['geometry'].reverse()
            (normal/'result.json').write_text(json.dumps(reference))
            with self.assertRaisesRegex(AssertionError, 'hit region'):
                fidelity.validate_captures(normal, self.accepted, 'normal-game')
            reference = self.captures(normal, 'normal-game'); reference['cleanupComplete'] = False
            (normal/'result.json').write_text(json.dumps(reference))
            with self.assertRaises(AssertionError):
                fidelity.validate_captures(normal, self.accepted, 'normal-game')


if __name__ == '__main__':
    unittest.main()
