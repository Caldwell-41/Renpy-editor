import importlib.util
import json
import hashlib
import plistlib
from types import SimpleNamespace
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("macos_package", Path(__file__).with_name("macos-package.py"))
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


class PackageIdentityTests(unittest.TestCase):
    def test_environment_cannot_choose_a_different_certificate(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "src-tauri").mkdir()
            policy = root / "src-tauri/macos-signing.json"
            with patch.object(package, "APP", root):
                policy.write_text(json.dumps({"certificateSha1": None}))
                with self.assertRaises(ValueError):
                    package.approved_fingerprint("A" * 40)
                policy.write_text(json.dumps({"certificateSha1": "A" * 40}))
                self.assertEqual(package.approved_fingerprint("a" * 40), "A" * 40)
                with self.assertRaises(ValueError):
                    package.approved_fingerprint("B" * 40)

    def test_rejects_ad_hoc_and_widened_requirements(self):
        pin = "A" * 40
        good = f'designated => identifier "app.loomlight.desktop" and certificate leaf = H"{pin}"'
        package.check_requirement(good, pin)
        for value in ['designated => cdhash H"' + pin + '"',
                      'designated => identifier "app.loomlight.desktop"',
                      good + " or true", good.replace("certificate leaf =", "anchor"),
                      good.replace(pin, "B" * 40),
                      good.replace("app.loomlight.desktop", "app.loomlight"),
                      good.replace("app.loomlight.desktop", "APP.LOOMLIGHT.DESKTOP")]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                package.check_requirement(value, pin)

    def test_rejects_produced_bundle_drift(self):
        info = {"CFBundleName": "Loomlight", "CFBundleDisplayName": "Loomlight",
                "CFBundleIdentifier": "app.loomlight.desktop", "CFBundleExecutable": "loomlight",
                "CFBundleVersion": "0.1.0", "CFBundleShortVersionString": "0.1.0"}
        package.check_plist(Path("Loomlight.app"), info)
        for key in info:
            changed = dict(info, **{key: "" if "Version" in key else "wrong"})
            with self.subTest(key=key), self.assertRaises(ValueError):
                package.check_plist(Path("Loomlight.app"), changed)
        with self.assertRaises(ValueError):
            package.check_plist(Path("Loomlight-0.1.0.app"), info)

    def test_extracts_public_certificate_with_equals_and_rejects_wrong_certificate(self):
        certificate = b"public certificate fixture"
        pin = hashlib.sha1(certificate).hexdigest().upper()
        with tempfile.TemporaryDirectory() as temp:
            bundle = Path(temp) / "Loomlight.app"
            (bundle / "Contents/MacOS").mkdir(parents=True)
            (bundle / "Contents/MacOS/loomlight").write_bytes(b"executable fixture")
            info = {"CFBundleName": "Loomlight", "CFBundleDisplayName": "Loomlight",
                    "CFBundleIdentifier": "app.loomlight.desktop", "CFBundleExecutable": "loomlight",
                    "CFBundleVersion": "0.1.0", "CFBundleShortVersionString": "0.1.0"}
            (bundle / "Contents/Info.plist").write_bytes(plistlib.dumps(info))
            def run(args, **kwargs):
                if "--display" in args and "-r-" in args:
                    return SimpleNamespace(stdout=f'designated => identifier "app.loomlight.desktop" and certificate leaf = H"{pin}"\n', stderr='Identifier=app.loomlight.desktop\n')
                if "--display" in args:
                    extraction = [v for v in args if v.startswith("--extract-certificates=")]
                    self.assertEqual(len(extraction), 1)
                    Path(extraction[0].split("=", 1)[1] + "0").write_bytes(certificate)
                return SimpleNamespace(stdout="", stderr="")
            with patch.object(package, "run", run):
                self.assertTrue(package.verify(bundle, pin)["strictSignatureVerified"])
                certificate = b"different public certificate fixture"
                with self.assertRaisesRegex(ValueError, "different signing certificate"):
                    package.verify(bundle, pin)

    def test_rejects_missing_or_ad_hoc_identity(self):
        for identity in ["", "-", "Loomlight Local Development", "A" * 39]:
            with self.subTest(identity=identity), self.assertRaises(ValueError):
                package.fingerprint(identity)


if __name__ == "__main__":
    unittest.main()
