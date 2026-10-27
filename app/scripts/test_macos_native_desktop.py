"""Exercise desktop admission and power ownership at the native runner boundary."""
import json
import io
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from macos_native_desktop import native_desktop


class Power:
    """Controlled macOS power/session API boundary; no desktop or app is changed."""
    def __init__(self, **state):
        self.desktop = dict(onConsole=True, loginDone=True, screenLocked=False,
                            displayActive=True, displayAsleep=False)
        self.desktop.update(state)
        self.held = {}

    def state(self):
        return self.desktop.copy()

    def hold(self, kind):
        identifier = len(self.held) + 1
        self.held[identifier] = kind
        return identifier

    def release(self, identifier):
        del self.held[identifier]


class NativeDesktopTests(unittest.TestCase):
    def test_locked_desktop_refuses_before_the_child_can_launch(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / 'desktop.json'
            power = Power()
            power.desktop['screenLocked'] = True
            with self.assertRaisesRegex(RuntimeError, 'unlocked.*awake'):
                with native_desktop(path, platform='darwin', power=power):
                    self.fail('A locked desktop must never reach child launch')
            self.assertFalse(power.held)
            self.assertFalse(json.loads(path.read_text())['admitted'])

    def test_child_lifetime_holds_display_and_system_idle_assertions(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / 'desktop.json'
            power = Power()
            with native_desktop(path, platform='darwin', power=power):
                self.assertCountEqual(power.held.values(),
                                      ['PreventUserIdleDisplaySleep', 'PreventUserIdleSystemSleep'])
            self.assertFalse(power.held)
            self.assertTrue(json.loads(path.read_text())['cleanupComplete'])

    def test_unsafe_or_unreadable_desktop_never_launches(self):
        for change in (dict(displayAsleep=True), dict(displayActive=False), dict(onConsole=False),
                       dict(loginDone=None), dict(screenLocked=None)):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as root:
                power = Power(**change)
                with self.assertRaises(RuntimeError):
                    with native_desktop(Path(root) / 'desktop.json', platform='darwin', power=power):
                        self.fail('Unsafe desktop reached child launch')
                self.assertFalse(power.held)

    def test_failure_and_interruption_release_owned_assertions(self):
        for error in (ValueError('child failed'), KeyboardInterrupt()):
            with self.subTest(error=type(error).__name__), tempfile.TemporaryDirectory() as root:
                power = Power()
                path = Path(root) / 'desktop.json'
                with self.assertRaises(type(error)):
                    with native_desktop(path, platform='darwin', power=power):
                        raise error
                self.assertFalse(power.held)
                self.assertTrue(json.loads(path.read_text())['cleanupComplete'])

    def test_partial_acquisition_or_desktop_change_releases_before_refusal(self):
        for fail in ('acquire', 'desktop'):
            with self.subTest(fail=fail), tempfile.TemporaryDirectory() as root:
                power = Power()
                hold = power.hold
                def acquire(kind):
                    if power.held:
                        if fail == 'acquire':
                            raise RuntimeError('assertion refused')
                        power.desktop['screenLocked'] = True
                    return hold(kind)
                power.hold = acquire
                with self.assertRaises(RuntimeError):
                    with native_desktop(Path(root) / 'desktop.json', platform='darwin', power=power):
                        self.fail('Incomplete admission reached child launch')
                self.assertFalse(power.held)

    def test_release_failure_does_not_skip_other_assertion_cleanup(self):
        with tempfile.TemporaryDirectory() as root:
            power = Power()
            release = power.release
            def refuse_one(identifier):
                if identifier == 2:
                    raise RuntimeError('release refused')
                release(identifier)
            power.release = refuse_one
            path = Path(root) / 'desktop.json'
            with self.assertRaisesRegex(RuntimeError, 'release refused'):
                with native_desktop(path, platform='darwin', power=power):
                    pass
            self.assertNotIn(1, power.held)
            self.assertFalse(json.loads(path.read_text())['cleanupComplete'])

    def test_other_hosts_need_no_mac_api_or_receipt(self):
        with tempfile.TemporaryDirectory() as root:
            path = Path(root) / 'desktop.json'
            with patch('macos_native_desktop.MacPower', side_effect=AssertionError('Mac API on Windows')):
                with native_desktop(path, platform='win32'):
                    pass
            self.assertFalse(path.exists())

    def test_runtime_runner_refuses_locked_host_before_popen(self):
        with tempfile.TemporaryDirectory() as root:
            power = Power(screenLocked=True)
            with patch('sys.argv', ['run-runtime-ui-probes.py', sys.executable, root, 'screen-composition']), \
                    patch('sys.platform', 'darwin'), \
                    patch('macos_native_desktop.MacPower', return_value=power), \
                    patch('subprocess.Popen', side_effect=AssertionError('App launched while locked')) as launch:
                with self.assertRaisesRegex(RuntimeError, 'unlocked.*awake'):
                    runpy.run_path(str(Path(__file__).with_name('run-runtime-ui-probes.py')))
            launch.assert_not_called()

    def test_runtime_runner_reaps_child_before_releasing_power_on_all_exits(self):
        for outcome in ('normal', 'failed', 'timeout', 'interrupted'):
            with self.subTest(outcome=outcome), tempfile.TemporaryDirectory() as root:
                power = Power()
                testcase = self
                class Child:
                    pid = 2147483000
                    stdout = io.BytesIO()
                    alive = True
                    waited = False
                    def wait(self, timeout):
                        testcase.assertEqual(len(power.held), 2, 'Power must outlive the app')
                        if not self.waited:
                            self.waited = True
                            if outcome == 'timeout':
                                raise subprocess.TimeoutExpired('controlled-child', timeout)
                            if outcome == 'interrupted':
                                raise KeyboardInterrupt()
                        self.alive = False
                        return 1 if outcome == 'failed' else 0
                    def poll(self):
                        return None if self.alive else 0
                child = Child()
                with patch('sys.argv', ['run-runtime-ui-probes.py', sys.executable, root, 'screen-composition']), \
                        patch('sys.platform', 'darwin'), \
                        patch('macos_native_desktop.MacPower', return_value=power), \
                        patch('subprocess.Popen', return_value=child), \
                        patch('os.killpg', create=True), patch('subprocess.run'), \
                        patch('sys.stdout', new=io.StringIO()):
                    with self.assertRaises((SystemExit, KeyboardInterrupt)):
                        runpy.run_path(str(Path(__file__).with_name('run-runtime-ui-probes.py')))
                self.assertFalse(child.alive, 'Runner left a child after power release')
                self.assertFalse(power.held)
                receipt = json.loads((Path(root) / 'runtime-ui-screen-composition-desktop.json').read_text())
                self.assertTrue(receipt['admitted'] and receipt['cleanupComplete'])

    def test_runtime_runner_reaps_child_if_output_reader_cannot_start(self):
        with tempfile.TemporaryDirectory() as root:
            power = Power()
            testcase = self
            class Child:
                pid = 2147483000
                alive = True
                def poll(self):
                    return None if self.alive else 0
                def wait(self, timeout):
                    testcase.assertEqual(len(power.held), 2)
                    self.alive = False
                    return -1
            child = Child()
            with patch('sys.argv', ['run-runtime-ui-probes.py', sys.executable, root, 'screen-composition']), \
                    patch('sys.platform', 'darwin'), \
                    patch('macos_native_desktop.MacPower', return_value=power), \
                    patch('subprocess.Popen', return_value=child), \
                    patch('threading.Thread.start', side_effect=RuntimeError('reader start failed')), \
                    patch('os.killpg', create=True), patch('subprocess.run'):
                with self.assertRaisesRegex(RuntimeError, 'reader start failed'):
                    runpy.run_path(str(Path(__file__).with_name('run-runtime-ui-probes.py')))
            self.assertFalse(child.alive)
            self.assertFalse(power.held)


if __name__ == '__main__':
    unittest.main()
