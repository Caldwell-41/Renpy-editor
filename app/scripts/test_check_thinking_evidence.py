import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('thinking_evidence', Path(__file__).with_name('check-thinking-evidence.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class GateTests(unittest.TestCase):
    listing = 'scope::first: test\nscope::second: test\n'
    output = 'test scope::first ... ok\ntest scope::second ... ok\ntest result: ok. 2 passed; 0 failed; 0 ignored; 3 filtered out; finished in 0.01s\n'

    def test_complete(self):
        self.assertEqual(module.verify_cargo(self.listing, self.output), 2)

    def test_zero(self):
        with self.assertRaises(ValueError):
            module.verify_cargo('', 'test result: ok. 0 passed; 0 failed; 0 ignored;')

    def test_ignored(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output.replace('scope::second ... ok', 'scope::second ... ignored'))

    def test_duplicate(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output + 'test scope::first ... ok\n')

    def test_failed(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing, self.output.replace('2 passed; 0 failed', '1 passed; 1 failed'))

    def test_different_selection(self):
        with self.assertRaises(ValueError):
            module.verify_cargo(self.listing.replace('scope::second', 'scope::other'), self.output)


if __name__ == '__main__':
    unittest.main()
