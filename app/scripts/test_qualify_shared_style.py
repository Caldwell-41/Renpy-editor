"""Semantic capture checks and strict literal equality, without starting an SDK."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from PIL import Image

spec = importlib.util.spec_from_file_location('shared_style', Path(__file__).with_name('qualify-shared-style.py'))
style = importlib.util.module_from_spec(spec)
spec.loader.exec_module(style)


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


if __name__ == '__main__':
    unittest.main()
