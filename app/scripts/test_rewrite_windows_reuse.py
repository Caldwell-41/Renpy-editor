"""Retained evidence must reject changed runtime inputs or corrupt artifacts."""
import copy
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('windows_rewrite', Path(__file__).with_name('qualify-rewrite-windows.py'))
recipe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recipe)


class RetainedEvidenceGate(unittest.TestCase):
    def test_skipped_package_cannot_promote_cache_or_pass_terminal_audit(self):
        for outcome in ('skipped', 'failure'):
            with self.subTest(outcome=outcome), tempfile.TemporaryDirectory() as temp:
                output = Path(temp)
                env = {'GITHUB_SHA': 'a'*40, 'GITHUB_RUN_ID': 'diagnostic',
                       'PACKAGE_OUTCOME': outcome, 'FOCUSED_OUTCOME': 'failure',
                       'NATIVE_OUTCOME': 'skipped', 'SDK_OUTCOME': 'success',
                       'CAPABILITY_OUTCOME': 'success'}
                with patch.dict(os.environ, env), patch.object(recipe, 'retain') as retain, \
                        patch.object(recipe, 'run', return_value=''):
                    with self.assertRaises(RuntimeError):
                        recipe.finish(output)
                    self.assertEqual(retain.call_count, 0 if outcome == 'skipped' else 1)
                terminal = json.loads((output/'terminal-audit.json').read_text())
                self.assertFalse(terminal['passed'])
                self.assertEqual(terminal['outcomes']['PACKAGE_OUTCOME'], outcome)
                self.assertFalse(any(terminal['reportsPresent'].values()))

    def test_continue_renderer_gate_executes_and_rejects_partial_or_unsuccessful_runs(self):
        for prefix, newline in (('ℹ', '\n'), ('#', '\r\n')):
            passed = newline.join(f'{prefix} {name} {count}' for name, count in
                                  [('tests', 131), ('pass', 131), ('fail', 0), ('cancelled', 0), ('skipped', 0), ('todo', 0)]) + newline
            recipe.validate_continue_renderer(passed)
            for name in ('tests', 'pass', 'fail', 'cancelled', 'skipped', 'todo'):
                original = f'{prefix} {name} '+('131' if name in ('tests', 'pass') else '0')
                for invalid in (passed.replace(original, ''), passed.replace(original, f'{prefix} {name} 1')):
                    with self.subTest(prefix=prefix, outcome=name), self.assertRaises(AssertionError):
                        recipe.validate_continue_renderer(invalid)

    @unittest.skipUnless(os.name == 'nt', 'Actual Windows PowerShell polling regression requires Windows')
    def test_native_polling_handles_transient_nodes_without_accepting_missing_proof(self):
        # Execute the real helpers, not a Python model. The remaining driver is
        # not invoked: these synthetic UIA states consume no app launch.
        driver = Path(__file__).with_name('rewrite-windows-native.ps1').resolve()
        script = r'''
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$tokens=$null; $errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile('__DRIVER__',[ref]$tokens,[ref]$errors)
if($errors.Count) { throw ($errors | Out-String) }
foreach($name in @('Wait-Native','Has-Text','Has-ButtonState')) {
    $function=$ast.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name},$true)
    if($null -eq $function) { throw ('Missing real helper: '+$name) }
    . ([scriptblock]::Create($function.Extent.Text))
}
function Assert-Test($Condition,[string]$Message) { if(-not $Condition) { throw $Message } }
function Nodes { return $script:nodes }
function Button([string]$Name) { return $script:button }
$receipt=@{uiaStaleRetries=0}
$script:nodes=@([pscustomobject]@{Current=[pscustomobject]@{Name=$null}},[pscustomobject]@{Current=[pscustomobject]@{Name=''}},[pscustomobject]@{Current=[pscustomobject]@{Name='Proposal received. No source changed.'}})
Assert-Test (Has-Text 'Proposal received. No source changed.') 'Null/empty names hid later result'
Assert-Test (-not (Has-Text 'Accepted and saved as one change.')) 'Unobserved result was accepted'
$script:nodes=@(); Assert-Test (-not (Has-Text 'Proposal')) 'Empty tree supplied result'
$script:nodes=[pscustomobject]@{Current=[pscustomobject]@{Name='Accepted and saved as one change.'}}
Assert-Test (Has-Text 'Accepted and saved as one change.') 'Singleton tree lost result'
$script:button=$null
Assert-Test (-not (Has-ButtonState 'Accept 1 change' $true)) 'Missing button supplied enabled proof'
Assert-Test (-not (Has-ButtonState 'Accept 1 change' $false)) 'Missing button supplied disabled proof'
foreach($enabled in @($true,$false)) {
    $script:button=[pscustomobject]@{Current=[pscustomobject]@{IsEnabled=$enabled}}
    Assert-Test (Has-ButtonState 'Accept 1 change' $enabled) 'Present button state lost'
    Assert-Test (-not (Has-ButtonState 'Accept 1 change' (-not $enabled))) 'Wrong state accepted'
}
$script:polls=0
Wait-Native {
    $script:polls++
    if($script:polls -eq 1) { throw [System.Windows.Automation.ElementNotAvailableException]::new('removed descendant') }
    if($script:polls -eq 2) { throw [System.Reflection.TargetInvocationException]::new([System.Windows.Automation.ElementNotAvailableException]::new('wrapped removed descendant')) }
    return ($script:polls -ge 4)
}
Assert-Test ($script:polls -eq 4 -and $receipt.uiaStaleRetries -eq 2) 'Stale or false poll released wait'
$script:polls=0; $caught=$false
try { Wait-Native { $script:polls++; throw [System.InvalidOperationException]::new('real failure') } }
catch { $caught=$_.Exception.Message -eq 'real failure' }
Assert-Test ($caught -and $script:polls -eq 1) 'Real failure swallowed or retried'
Write-Output 'PASS: real native polling rejects absent proof and propagates real errors'
'''.replace('__DRIVER__', driver.as_posix().replace("'", "''"))
        result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script],
                                capture_output=True, text=True, timeout=45)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('PASS: real native polling', result.stdout)

    def test_recorded_toolchain_drift_is_rejected_before_checks_or_reuse(self):
        engines = json.loads((recipe.APP/'package.json').read_text())['engines']
        pinned = {'node': 'v'+engines['node'], 'npm': engines['npm']}
        recipe.validate_toolchains(pinned)
        for tool, value in (('node', 'v0.0.0'), ('npm', '11.17.0')):
            with self.subTest(tool=tool), self.assertRaises(AssertionError):
                recipe.validate_toolchains(dict(pinned, **{tool: value}))

    @unittest.skipUnless(os.name == 'nt', 'Actual window-placement helper regression requires Windows')
    def test_native_window_placement_preserves_layout_and_rejects_unobservable_states(self):
        driver = Path(__file__).with_name('rewrite-windows-native.ps1').resolve()
        script = r'''
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
public static class RewriteNative {
    public static int X,Y,Width,Height,Moves;
    public static bool AllowMove=true;
    public static bool Resize=false;
    public static int GetSystemMetrics(int index) { return index==78 ? 1920 : index==79 ? 1080 : 0; }
    public static bool SetWindowPos(IntPtr handle,IntPtr after,int x,int y,int width,int height,uint flags) {
        if(handle!=new IntPtr(42) || flags!=0x15 || width!=0 || height!=0) throw new Exception("Unexpected ownership/resize flags");
        Moves++;
        if(!AllowMove) return false;
        X=x;Y=y;if(Resize) Width--;
        return true;
    }
}
'@
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile('__DRIVER__',[ref]$tokens,[ref]$errors)
if($errors.Count) { throw ($errors | Out-String) }
foreach($name in @('Assert-Native','Ensure-ObservableWindow')) {
    $function=$ast.Find({param($node) $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name},$true)
    if($null -eq $function) { throw ('Missing real helper: '+$name) }
    . ([scriptblock]::Create($function.Extent.Text))
}
function Window-Rect($Handle) { return [System.Drawing.Rectangle]::new([RewriteNative]::X,[RewriteNative]::Y,[RewriteNative]::Width,[RewriteNative]::Height) }
function Wait-Native([scriptblock]$Check) { if(-not (& $Check)) { throw 'Placement still clipped' } }
function Reset-Test($X,$Y,$Width,$Height) {
    [RewriteNative]::X=$X;[RewriteNative]::Y=$Y;[RewriteNative]::Width=$Width;[RewriteNative]::Height=$Height
    [RewriteNative]::Moves=0;[RewriteNative]::AllowMove=$true;[RewriteNative]::Resize=$false
    $script:handle=[IntPtr]42;$script:receipt=@{}
}
Reset-Test 400 300 1280 900
Ensure-ObservableWindow
Assert-Native ([RewriteNative]::X -eq 400 -and [RewriteNative]::Y -eq 180 -and [RewriteNative]::Moves -eq 1) 'Clipped layout was not placed wholly on desktop'
Assert-Native ($receipt.windowPlacement.moved -and $receipt.windowPlacement.after[2] -eq 1280 -and $receipt.windowPlacement.after[3] -eq 900) 'Placement receipt lost exact layout'
Reset-Test 50 50 1280 900
Ensure-ObservableWindow
Assert-Native (-not $receipt.windowPlacement.moved -and [RewriteNative]::Moves -eq 0) 'Already observable window moved'
foreach($failure in @('oversize','move','resize')) {
    Reset-Test -10 -20 1280 900
    if($failure -eq 'oversize') { [RewriteNative]::Width=1921 }
    if($failure -eq 'move') { [RewriteNative]::AllowMove=$false }
    if($failure -eq 'resize') { [RewriteNative]::Resize=$true }
    $caught=$false
    try { Ensure-ObservableWindow } catch { $caught=$true }
    Assert-Native $caught ('Unobservable/changed layout supplied proof: '+$failure)
}
Write-Output 'PASS: actual placement helper preserves required layout and rejects invalid states'
'''.replace('__DRIVER__', driver.as_posix().replace("'", "''"))
        result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script],
                                capture_output=True, text=True, timeout=45)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn('PASS: actual placement helper', result.stdout)

    def inputs(self):
        return {p: 'original' for p in (
            'app/Cargo.lock', 'app/package-lock.json', 'app/package.json',
            'app/src-tauri/src/main.rs', 'app/src-tauri/src/ai_native/windows.rs',
            'app/src-tauri/tauri.conf.json', 'app/src-core/src/rewrite.rs',
            'app/src/rewrite-ui.ts', 'app/src-tauri/permissions/core.toml',
            'app/src-core/src/rewrite/tests.rs')}

    def test_only_selected_harness_changes_can_reuse(self):
        original = self.inputs()
        changed = copy.deepcopy(original)
        for p in recipe.REUSE_HARNESS_PATHS:
            changed[p] = 'new harness'
        recipe.validate_reuse_inputs(original, changed)
        for p in set(original)-recipe.REUSE_HARNESS_PATHS:
            with self.subTest(path=p):
                invalid = dict(changed, **{p: 'changed runtime'})
                with self.assertRaises(AssertionError):
                    recipe.validate_reuse_inputs(original, invalid)
        for invalid in ({}, dict(changed, **{'app/src/new-runtime.ts': 'new'})):
            with self.assertRaises(AssertionError):
                recipe.validate_reuse_inputs(original, invalid)
        removed = dict(changed); removed.pop('app/src-tauri/permissions/core.toml')
        with self.assertRaises(AssertionError):
            recipe.validate_reuse_inputs(original, removed)

    def test_manifest_is_portable_and_rejects_missing_changed_and_escape(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root/'package').mkdir()
            exe = root/'package/loomlight.exe'; exe.write_bytes(b'exact candidate')
            sha = hashlib.sha256(exe.read_bytes()).hexdigest()
            recipe.validate_reuse_manifest(root, {'package\\loomlight.exe': sha})
            recipe.validate_reuse_manifest(root, {'package/loomlight.exe': sha})
            for invalid in ({}, {'package/missing.exe': sha}, {'../outside': sha}, {'C:/outside': sha}, {'package/loomlight.exe': 'incorrect'}):
                with self.subTest(invalid=invalid), self.assertRaises(AssertionError):
                    recipe.validate_reuse_manifest(root, invalid)
            exe.write_bytes(b'different candidate')
            with self.assertRaises(AssertionError):
                recipe.validate_reuse_manifest(root, {'package/loomlight.exe': sha})

    def test_focused_reuse_requires_unchanged_test_and_example_inputs(self):
        original = self.inputs()
        original['app/src-tauri/examples/rewrite-controller-driver.rs'] = 'original'
        allowed = recipe.REUSE_HARNESS_PATHS - {'app/src-core/src/rewrite/tests.rs', 'app/src-tauri/examples/rewrite-controller-driver.rs'}
        changed = dict(original, **{'app/scripts/rewrite-windows-native.ps1': 'new native driver'})
        recipe.validate_reuse_inputs(original, changed, allowed)
        for path in ('app/src-core/src/rewrite/tests.rs', 'app/src-tauri/examples/rewrite-controller-driver.rs'):
            with self.subTest(path=path), self.assertRaises(AssertionError):
                recipe.validate_reuse_inputs(original, dict(changed, **{path: 'changed test'}), allowed)

    def test_reuse_cannot_promote_unsuccessful_case_or_changed_binary(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root/'package').mkdir()
            exe = root/'package/loomlight.exe'; exe.write_bytes(b'exact candidate')
            receipt = {'passed': True, 'sdkPassed': True, 'packagePassed': True, 'sourceRunId': 'original', 'executableSHA256': hashlib.sha256(exe.read_bytes()).hexdigest()}
            (root/'reuse.json').write_text(json.dumps(receipt))
            recipe.verify_reuse(root, 'package')
            for field in ('passed', 'sdkPassed', 'packagePassed'):
                broken = dict(receipt, **{field: False}); (root/'reuse.json').write_text(json.dumps(broken))
                with self.subTest(field=field), self.assertRaises(AssertionError):
                    recipe.verify_reuse(root, 'sdk' if field == 'sdkPassed' else 'package')
            (root/'reuse.json').write_text(json.dumps(receipt)); exe.write_bytes(b'changed')
            with self.assertRaises(AssertionError):
                recipe.verify_reuse(root, 'package')


if __name__ == '__main__':
    unittest.main()
