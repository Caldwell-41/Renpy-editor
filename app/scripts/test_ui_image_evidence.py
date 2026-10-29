"""L06 SDK geometry admission rejects wrong or incomplete observations."""
import copy
import importlib.util
from pathlib import Path
import unittest
import tempfile

from PIL import Image

spec = importlib.util.spec_from_file_location('ui_image_qualification', Path(__file__).with_name('qualify-ui-image.py'))
qualification = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qualification)


def receipt():
    return dict(aspect=[1280, 720], sdkVersion='8.5.3', rectangles={
        'png': [20, 20, 120, 60], 'jpeg': [180, 20, 96, 48],
        'lossless': [340, 20, 160, 80], 'lossy': [540, 20, 128, 64],
        'alpha': [720, 20, 80, 40], 'stretch': [20, 160, 120, 90]})


class UiImageEvidence(unittest.TestCase):
    def test_requires_each_expected_asset_rectangle_and_pinned_version(self):
        qualification.validate(receipt(), (1280, 720))
        wrong = [dict(), dict(aspect=[1280, 720], sdkVersion='8.5.3', rectangles={})]
        for name in receipt()['rectangles']:
            missing = receipt()
            del missing['rectangles'][name]
            wrong.append(missing)
            wrong_size = receipt()
            wrong_size['rectangles'][name][2] += 1
            wrong.append(wrong_size)
        bad = receipt()
        bad['sdkVersion'] = '8.4.0'
        wrong.append(bad)
        bad = receipt()
        bad['aspect'] = [1024, 768]
        wrong.append(bad)
        for bad in wrong:
            with self.subTest(bad=bad), self.assertRaises((AssertionError, KeyError)):
                qualification.validate(copy.deepcopy(bad), (1280, 720))

    def test_rejects_placeholder_pixels_with_otherwise_correct_geometry(self):
        with tempfile.TemporaryDirectory() as temporary:
            image = Path(temporary) / 'blank.png'
            Image.new('RGBA', (1280, 720), (0, 0, 0, 0)).save(image)
            reference = Path(temporary) / 'reference.png'
            for color in [(0, 0, 0, 0), (0, 0, 255, 255)]:
                Image.new('RGBA', (1280, 720), color).save(reference)
                with self.assertRaises(AssertionError):
                    qualification.validate(receipt(), (1280, 720), image, reference)


class UiImageNativeEvidence(unittest.TestCase):
    def test_rejects_missing_native_stages_decode_and_source(self):
        from runtime_probe_cases import runtime_report_ok, RUNTIME_STAGES
        from uuid import UUID
        ids = [str(UUID(int=i)) for i in (1,2)]
        owner = dict(id=str(UUID(int=3)),rootId=ids[0],name='travel_notes',path='game/ui/travel_notes.rpy',resolved=True)
        value = dict(evidence='runtime-ui-packaged',case='ui-image',passed=True,cleanupComplete=True,details=dict(
            scenario='ui-image',stage='complete',stages=[dict(stage=s) for s in (*RUNTIME_STAGES['ui-image'],'complete')],
            identity=owner,identities=ids,nativeWebView=True,sdkExecuted=False,imageDecoded=True,
            acceptedSource=f'# loomlight-screen: {owner["id"]}\nscreen travel_notes():\n add "images/ui station_seal.png": # loomlight-element: {ids[1]}\n xsize 200\n ysize 70\n use source_only_footer()\n text "Protected neighbor"'))
        self.assertTrue(runtime_report_ok('ui-image',value))
        for field,wrong in [('imageDecoded',False),('nativeWebView',False),('sdkExecuted',True),('acceptedSource',''),('identity',None),('identities',[]),('stages',[])]:
            bad=copy.deepcopy(value);bad['details'][field]=wrong
            self.assertFalse(runtime_report_ok('ui-image',bad),field)
