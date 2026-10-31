"""Semantic capture checks and strict literal equality, without starting an SDK."""
import importlib.util
import base64
import hashlib
from io import BytesIO
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

spec = importlib.util.spec_from_file_location('shared_style', Path(__file__).with_name('qualify-shared-style.py'))
style = importlib.util.module_from_spec(spec)
spec.loader.exec_module(style)
helper_spec = importlib.util.spec_from_file_location('shared_style_helper', Path(__file__).with_name('qualify-shared-style-helper.py'))
helper = importlib.util.module_from_spec(helper_spec)
helper_spec.loader.exec_module(helper)


class SharedStyleImages(unittest.TestCase):
    def image(self, border=(66, 80, 93, 100), interior=(17, 51, 85, 254)):
        image = Image.new('RGBA', (1280, 720))
        image.putpixel((40, 40), border)
        image.putpixel((43, 43), interior)
        return image

    def test_actual_windows_and_mac_samples_use_premultiplied_color(self):
        for border in [(66, 80, 93, 100), (37, 45, 52, 56), (170, 204, 238, 254), (171, 205, 239, 255)]:
            with self.subTest(border=border):
                style.validate_frame_semantics(self.image(border))

    def test_missing_or_wrong_border_and_filled_or_transparent_interior_fail(self):
        for border, interior in [
            ((0, 0, 0, 0), (17, 51, 85, 254)),
            ((7, 20, 33, 100), (17, 51, 85, 254)),
            ((66, 80, 93, 100), (170, 204, 238, 254)),
            ((66, 80, 93, 100), (0, 0, 0, 0)),
            ((66, 80, 93, 100), (9, 26, 43, 128)),
        ]:
            with self.subTest(border=border, interior=interior), self.assertRaises(AssertionError):
                style.validate_frame_semantics(self.image(border, interior))

    def test_literal_gate_rejects_even_one_channel_unit_or_alpha_difference(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            for index, state in enumerate(style.STATES):
                image = self.image()
                image.putpixel((600, 100), (index, 0, 0, 255))
                for name in ['notes', 'about', 'style_reference', 'style_other_reference']:
                    image.save(output / f'shared-1280x720-{state}-{name}.png')
            self.assertEqual(len(style.validate_images(output, 'shared', 1280, 720)), 4)
            actual = output / 'shared-1280x720-normal-notes.png'
            for pixel in [(1, 0, 0, 255), (0, 0, 0, 254)]:
                image = self.image()
                image.putpixel((600, 100), pixel)
                image.save(actual)
                with self.subTest(pixel=pixel), self.assertRaisesRegex(AssertionError, 'literal reference differs'):
                    style.validate_images(output, 'shared', 1280, 720)


class SharedStyleCampaign(unittest.TestCase):
    def manifest(self, identity):
        stages = {}
        for stage in ['shared', 'independent']:
            stages[stage] = {}
            for screen in ['notes', 'about']:
                name = 'body_style' if stage == 'shared' else f'll_copy_{identity:032x}'
                source = f'# loomlight-screen: 00000000-0000-4000-8000-{identity:012x}\nscreen {screen}():\n    text "Caption":\n        style "{name}"\n\nstyle {name} is text:\n    size 32\n'
                stages[stage][f'game/ui/{screen}.rpy'] = dict(text=source, sha256=hashlib.sha256(source.encode()).hexdigest())
        return dict(publicCoreRequests=True, stages=stages, assets=[dict(id=f'00000000-0000-4000-8000-{identity:012x}')])

    def campaign(self, root):
        directory, normal = root / 'helper', root / 'sdk'
        directory.mkdir(); normal.mkdir()
        accepted = self.manifest(1)
        for path in [directory, normal]:
            (path / 'accepted.json').write_text(json.dumps(accepted))
        rows, frames = [], []
        for stage in ['shared', 'independent']:
            for width, height in helper.ASPECTS:
                for index, state in enumerate(helper.STATES):
                    rows.append(dict(stage=stage, aspect=[width, height], state=state, physical=[width, height], drawPerVirtual=1))
                    for screen, reference in [('notes', 'style_reference'), ('about', 'style_other_reference')]:
                        name = f'{stage}-{width}x{height}-{state}-{screen}'
                        image = Image.new('RGBA', (width, height), (32 + index, 64, 96, 255))
                        image.save(normal / f'{stage}-{width}x{height}-{state}-{reference}.png')
                        buffer = BytesIO(); image.save(buffer, format='PNG')
                        frame = dict(phase='ready', buttonState=state, width=width, height=height,
                                     revision=accepted['stages'][stage][f'game/ui/{screen}.rpy']['sha256'],
                                     diagnostics=dict(physical=[width, height], drawPerVirtual=1),
                                     image='data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode())
                        (directory / f'{name}.json').write_text(json.dumps(frame))
                        frames.append(dict(stage=stage, aspect=[width, height], state=state, screen=screen))
        (normal / 'result.json').write_text(json.dumps(dict(passed=True, records=rows)))
        (directory / 'result.json').write_text(json.dumps(dict(passed=True, helperSessions=1, pendingMatchesAccepted=True,
                records=frames, shutdowns=[dict(cleanupComplete=True, cooperative=True, exitCode=0)])))
        return directory, normal

    def test_same_source_campaign_passes_all_32_comparisons_and_rejects_bad_evidence(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory, normal = self.campaign(Path(temporary))
            result = helper.validate(directory, normal)
            self.assertTrue(result['passed'])
            self.assertEqual(len(result['records']), 32)
            self.assertEqual(helper.audit_rejections(directory, normal),
                             ['different-source-snapshot', 'missing-frame', 'wrong-source', 'wrong-state', 'blank-frame'])

    def test_new_project_ids_cannot_reuse_old_helper_images(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory, normal = self.campaign(Path(temporary))
            (normal / 'accepted.json').write_text(json.dumps(self.manifest(2)))
            with self.assertRaisesRegex(AssertionError, 'Accepted source snapshots differ'):
                helper.validate(directory, normal)


if __name__ == '__main__':
    unittest.main()
