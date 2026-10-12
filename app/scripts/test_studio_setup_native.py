"""Reject partial, stale, wrong-package or leaked native Settings qualification."""
import copy
import hashlib
import importlib.util
import json
import os
import subprocess
import struct
import zlib
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('studio_setup_native', Path(__file__).with_name('studio-setup-native.py'))
h = importlib.util.module_from_spec(spec)
spec.loader.exec_module(h)


def png(width=200, height=100):
    def chunk(kind, payload):
        return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload) & 0xffffffff)
    pixels = b''.join(b'\0' + bytes((x * 37 + y * 61) % 256 for x in range(width * 3)) for y in range(height))
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(pixels)) + chunk(b'IEND', b'')


def terminal():
    hashes = ['a' * 64, 'b' * 64, 'b' * 64]
    value = {'passed': True, 'candidate': h.CANDIDATE, 'tree': h.TREE, 'executableSHA256': h.EXE_SHA, 'artifact': copy.deepcopy(h.ARTIFACT), 'materialInputCount': 269, 'materialInputDigest': h.INPUT_DIGEST, 'launchOrdinals': [5, 6], 'appLaunches': 2, 'packageAttempts': 0, 'completedStages': list(h.STAGES), 'normalExits': [0, 0], 'requests': [{'sequence': n, 'accepted': True, 'method': 'POST', 'path': '/v1/chat/completions', 'bodySHA256': hashes[n-1], **({'clientClosed': True} if n == 2 else {'responseSent': True})} for n in (1, 2, 3)], 'requestPreviewSHA256': hashes}
    for name in ['noSaveHTTP', 'cancelProfileUnchanged', 'reopenNoHTTP', 'reopenProfileUnchanged', 'sourceUnchanged', 'profileReferencesRemoved', 'rootRemoved', 'listenerStopped', 'noCredentialRead', 'noDiscovery']:
        value[name] = True
    return value


def profile():
    p = {'profileId': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'revision': 3, 'disabled': False, 'settings': {'label': 'Closeout native setup', 'endpoint': 'http://127.0.0.1:8765/v1', 'model': h.MODEL, 'privateHttp': False, 'contextCeiling': 8192, 'contextBudget': 4096, 'maximumResponse': 1024, 'temperature': .8, 'topP': .9}, 'credential': {'credentialId': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'origin': 'http://127.0.0.1:8765', 'revision': 1}}
    p['compatibility'] = {'schemaVersion': 1, 'configurationDigest': h.compatibility_digest(p), 'checkedAtUnixSeconds': 1}
    return {'schemaVersion': 1, 'revision': 4, 'profiles': [p], 'cleanup': []}


class NativeSettingsGate(unittest.TestCase):
    def test_exact_success_is_accepted(self):
        h.validate_terminal(terminal())
        h.validate_profile(profile(), 'http://127.0.0.1:8765/v1', (.8, .9), True)
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaises(FileNotFoundError): h.read_profiles(root)
            (root/'ai-profiles.json').write_text(json.dumps(profile()))
            self.assertEqual(h.read_profiles(root), profile())

    def test_missing_failed_cancelled_and_skipped_proof_never_pass(self):
        for field in ['passed', 'sourceUnchanged', 'rootRemoved', 'profileReferencesRemoved', 'listenerStopped', 'reopenNoHTTP', 'cancelProfileUnchanged', 'noCredentialRead', 'noDiscovery']:
            for bad in [False, None, 'true', 'skipped']:
                v = terminal(); v[field] = bad
                with self.subTest(field=field, bad=bad), self.assertRaises(AssertionError):
                    h.validate_terminal(v)
        for field in ['candidate', 'tree', 'executableSHA256', 'materialInputDigest']:
            v = terminal(); v[field] = '0' * len(v[field])
            with self.subTest(field=field), self.assertRaises(AssertionError):
                h.validate_terminal(v)
        v = terminal(); v['completedStages'].remove('cancel')
        with self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['normalExits'][1] = 1
        with self.assertRaises(AssertionError): h.validate_terminal(v)

    def test_no_extra_launch_build_discovery_or_request(self):
        mutations = [('launchOrdinals', [5, 6, 7]), ('launchOrdinals', [4, 5]), ('launchOrdinals', [3, 4]), ('launchOrdinals', [1, 2]), ('appLaunches', 3), ('packageAttempts', 1), ('artifact', {**h.ARTIFACT, 'attempt': 2})]
        for key, bad in mutations:
            v = terminal(); v[key] = bad
            with self.subTest(key=key), self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['requests'].append(copy.deepcopy(v['requests'][-1]))
        with self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['requests'][0]['method'] = 'GET'
        with self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['requests'][1]['clientClosed'] = False
        with self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['requests'][2]['accepted'] = False
        with self.assertRaises(AssertionError): h.validate_terminal(v)
        v = terminal(); v['requestPreviewSHA256'][0] = 'c' * 64
        with self.assertRaises(AssertionError): h.validate_terminal(v)

    def test_configuration_and_credential_changes_invalidate_ready_digest(self):
        for change in ['sampling', 'model', 'endpoint', 'credential', 'disabled', 'schema']:
            v = profile(); p = v['profiles'][0]
            if change == 'sampling': p['settings']['temperature'] = .7
            elif change == 'model': p['settings']['model'] = 'another-model'
            elif change == 'endpoint': p['settings']['endpoint'] = 'http://127.0.0.1:8766/v1'
            elif change == 'credential': p['credential']['revision'] = 2
            elif change == 'disabled': p['disabled'] = True
            else: p['compatibility']['schemaVersion'] = 2
            with self.subTest(change=change), self.assertRaises(AssertionError): h.validate_profile(v, 'http://127.0.0.1:8765/v1', (.8, .9), True)
        v = profile(); v['cleanup'].append({'profileId': 'retained'})
        with self.assertRaises(AssertionError): h.validate_profile(v, 'http://127.0.0.1:8765/v1', (.8, .9), True)
        v = profile(); v['profiles'][0].pop('compatibility')
        h.validate_profile(v, 'http://127.0.0.1:8765/v1', (.8, .9), False)
        with self.assertRaises(AssertionError): h.validate_profile(v, 'http://127.0.0.1:8765/v1', (.8, .9), True)

    def test_fixture_admission_has_exact_body_and_never_discovers(self):
        body = h.expected_body(.8, .9)
        encode = lambda value: json.dumps(value, separators=(',', ':')).encode()
        args = ('POST', '/v1/chat/completions', 'Bearer ' + h.PUBLIC_KEY)
        self.assertTrue(h.accepted_request(*args, encode(body), 1))
        for field, bad in [('temperature', .7), ('top_p', .85), ('model', 'real-model'), ('enable_tools', True), ('stream', 0), ('max_tokens', 1024.0), ('messages', [{'role': 'user', 'content': 'project text'}])]:
            value = copy.deepcopy(body); value[field] = bad
            with self.subTest(field=field): self.assertFalse(h.accepted_request(*args, encode(value), 1))
        for method, path, auth, sequence in [('GET', '/v1/models', args[2], 1), ('POST', '/v1/chat/completions', 'Bearer other', 1), ('POST', '/v1/chat/completions', args[2], 4)]:
            self.assertFalse(h.accepted_request(method, path, auth, encode(body), sequence))
        duplicate = encode(body).replace(b'"stream":false', b'"stream":true,"stream":false')
        self.assertFalse(h.accepted_request(*args, duplicate, 1))
        self.assertFalse(h.accepted_request(*args, b' ' * 4097, 1))

    def test_png_gate_rejects_fake_truncated_wrong_dimensions_changed_and_blank(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'native.png'
            good = png()
            capture = {'width': 200, 'height': 100, 'sampleRange': 40, 'sha256': hashlib.sha256(good).hexdigest()}
            path.write_bytes(good)
            h.validate_capture(path, capture)
            for kind in ['signature-only', 'padded-header', 'truncated', 'wrong-dimensions', 'changed', 'blank']:
                data, metadata = good, copy.deepcopy(capture)
                if kind == 'signature-only': data = b'\x89PNG\r\n\x1a\npublic test data'
                elif kind == 'padded-header': data = good[:24] + b'junk' * 200
                elif kind == 'truncated': data = good[:-4]
                elif kind == 'wrong-dimensions': metadata['width'] += 1
                elif kind == 'changed': data = good[:-1] + bytes([good[-1] ^ 1])
                else: metadata['sampleRange'] = 0
                # Give malformed files an honest digest: framing must reject them.
                if kind != 'changed': metadata['sha256'] = hashlib.sha256(data).hexdigest()
                path.write_bytes(data)
                with self.subTest(kind=kind), self.assertRaises((ValueError, zlib.error)): h.validate_capture(path, metadata)


    def test_native_stages_require_pid_actual_captures_input_and_exact_preview(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp); image = root / 'native.png'; image.write_bytes(png())
            body = h.expected_body(.8, .9); raw = json.dumps(body, separators=(',', ':'))
            receipt = {'passed': True, 'stage': 'seed', 'processId': 123, 'executableSHA256': h.EXE_SHA, 'inputDesktop': 'Default', 'checks': {k: True for k in ['ownedWindow', 'osMouseInput', 'osKeyboardInput', 'controlsInViewport', 'navigationControlsReady', *h.CHECKS['seed']]}, 'captures': [{'file': 'native.png', 'sha256': h.sha(image), 'width': 200, 'height': 100, 'sampleRange': 40}], 'preview': {'raw': raw, 'rawSHA256': hashlib.sha256(raw.encode()).hexdigest(), 'body': body}}
            receipt['fieldEntries'] = [{'name': n, 'type': 'ControlType.Edit', 'physicalClick': True, 'keyboardFocusConfirmed': True, 'readbackMatched': True, 'expected': 'public fixture', 'lastReadback': 'public fixture'} for n in ['Profile name', 'Endpoint', 'Model ID', 'Temperature', 'Top-p']]
            receipt['controls'] = [{'name': n, 'value': v, 'enabled': True, 'owner': 123} for n, v in [('Temperature', '1'), ('Top-p', '0.95'), ('Temperature', '0.8'), ('Top-p', '0.9')]]
            h.validate_stage(receipt, 'seed', 123, root)
            for kind in ['pid', 'image', 'input', 'preview', 'missing', 'duplicate', 'field', 'defaults', 'navigation', 'field-focus', 'field-readback', 'field-type']:
                value = copy.deepcopy(receipt)
                if kind == 'pid': value['processId'] = 321
                elif kind == 'image': value['captures'][0]['sha256'] = '0' * 64
                elif kind == 'input': value['checks']['osKeyboardInput'] = False
                elif kind == 'preview': value['preview']['body']['enable_tools'] = True
                elif kind == 'navigation': value['checks']['navigationControlsReady'] = False
                elif kind == 'field-focus': value['fieldEntries'][0]['keyboardFocusConfirmed'] = False
                elif kind == 'field-readback': value['fieldEntries'][0]['lastReadback'] = 'different'
                elif kind == 'field-type': value['fieldEntries'][0]['type'] = 'ControlType.Text'
                elif kind == 'field': value['controls'][-1]['value'] = '0.95'
                elif kind == 'defaults': value['controls'] = value['controls'][2:]
                elif kind == 'duplicate':
                    raw = value['preview']['raw'].replace('"stream":false', '"stream":true,"stream":false');value['preview']['raw'] = raw;value['preview']['rawSHA256'] = hashlib.sha256(raw.encode()).hexdigest()
                else: value['captures'] = []
                with self.subTest(kind=kind), self.assertRaises((AssertionError, ValueError, zlib.error)): h.validate_stage(value, 'seed', 123, root)


# Windows executes the actual PowerShell helper test; Mac collects only portable gates.
if os.name == 'nt':
    class NativeReadinessPolling(unittest.TestCase):
        def test_actual_field_entry_rejects_wrong_focus_and_waits_before_typing(self):
            script_path = Path(__file__).with_name('studio-setup-windows.ps1').resolve()
            script = r"""
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName UIAutomationClient
# Observe only the desktop root; no app launch or focus mutation occurs.
$root=[System.Windows.Automation.AutomationElement]::RootElement
if($null -eq $root) {throw 'Observed UIAutomation root unavailable'}
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile('__SCRIPT__',[ref]$tokens,[ref]$errors)
if($errors.Count) {throw 'Native harness syntax invalid'}
# Resolve and invoke each actual production Compare owner and overload. A
# regression to AutomationElement.Compare must fail before mocks are installed.
$focus=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Field-FocusReady'},$true)
if($null -eq $focus) {throw 'Actual focus helper missing'}
$comparisons=$focus.FindAll({param($n) $n -is [System.Management.Automation.Language.InvokeMemberExpressionAst] -and $n.Static -and $n.Member.Value -eq 'Compare'},$true)
if($comparisons.Count -ne 2) {throw 'Both production focus comparisons required'}
foreach($call in $comparisons) {
    if($call.Expression -isnot [System.Management.Automation.Language.TypeExpressionAst]) {throw 'Static production Compare owner required'}
    $owner=[type]$call.Expression.TypeName.FullName
    $compare=$owner.GetMethod('Compare',[type[]]@([System.Windows.Automation.AutomationElement],[System.Windows.Automation.AutomationElement]))
    if($null -eq $compare -or -not $compare.IsStatic) {throw 'Production Compare API owner/overload invalid'}
    if(-not $compare.Invoke($null,[object[]]@($root,$root))) {throw 'Actual production Compare API did not match identical observed elements'}
}
$function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Set-Field'},$true)
. ([scriptblock]::Create($function.Extent.Text))
$receipt=[ordered]@{checks=[ordered]@{};fieldEntries=@()}
$script:events=@();$script:polls=0;$script:blocked=$false;$script:value='before'
function Assert-Native($State,$Message) {if(-not $State) {throw $Message}}
function Control($Name) {return [pscustomobject]@{Current=[pscustomobject]@{IsPassword=$false;ControlType=[System.Windows.Automation.ControlType]::Edit}}}
function Value($Name) {return $script:value}
function Assert-FieldOwner {$script:events+=@('owner')}
function Click-Any($Name) {$script:events+=@('click')}
function Field-FocusReady($Control) {$script:polls++;return (-not $script:blocked -and $script:polls -ge 3)}
function Wait-Native([scriptblock]$Check) {for($i=0;$i -lt 5;$i++) {if(& $Check) {return}};throw 'Bounded focus timeout'}
function Send-FieldKeys($Text) {
    if($script:polls -lt 3 -or $script:blocked -or $script:events -notcontains 'click') {throw 'Keys before physical target focus'}
    $script:events+=@('keys');$script:value=$Text
}
Set-Field 'Profile name' 'public fixture'
if(($script:events -join ',') -ne 'owner,click,owner,keys') {throw 'Wrong guarded input sequence'}
$entry=$receipt.fieldEntries[0]
if($entry.before -ne 'before' -or $entry.lastReadback -ne 'public fixture' -or -not $entry.keyboardFocusConfirmed -or -not $entry.readbackMatched) {throw 'Field diagnostics missing'}
$script:events=@();$script:polls=0;$script:blocked=$true;$caught=$false
try {Set-Field 'Profile name' 'public fixture'} catch {$caught=$_.Exception.Message -eq 'Bounded focus timeout'}
if(-not $caught -or $script:events -contains 'keys' -or $receipt.fieldEntries[1].keyboardFocusConfirmed) {throw 'Wrong focus allowed typing'}
$script:events=@();$caught=$false
try {Set-Field 'Credential' 'forbidden'} catch {$caught=$_.Exception.Message -eq 'Nonsecret fixture field whitelist required'}
if(-not $caught -or $script:events.Count -ne 0) {throw 'Unlisted field allowed input or diagnostics'}
Write-Output 'PASS: actual field entry requires physical target focus and records exact nonsecret readback'
""".replace('__SCRIPT__', script_path.as_posix().replace("'", "''"))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('PASS: actual field entry', result.stdout)

        def test_actual_navigation_helper_waits_for_enabled_controls_without_early_input(self):
            script_path = Path(__file__).with_name('studio-setup-windows.ps1').resolve()
            script = r"""
    $ErrorActionPreference='Stop'
    Set-StrictMode -Version Latest
    $tokens=$null;$errors=$null
    $ast=[System.Management.Automation.Language.Parser]::ParseFile('__SCRIPT__',[ref]$tokens,[ref]$errors)
    if($errors.Count) {throw 'External native harness syntax invalid'}
    foreach($name in @('Wait-ButtonReady','Open-Settings','Failure-CaptureAllowed')) {
        $function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
        if($null -eq $function) {throw ('Missing navigation helper: '+$name)}
        . ([scriptblock]::Create($function.Extent.Text))
    }
    $receipt=[ordered]@{checks=[ordered]@{}}
    $script:clicks=@();$script:polls=@{};$script:ready=@{};$script:blocked=$false
    function Button($Name) {return $null}
    function Has-ButtonState($Name,$Enabled) {
        if(-not $script:polls.ContainsKey($Name)) {$script:polls[$Name]=0}
        $script:polls[$Name]++
        if($script:blocked) {return $false}
        $ready=$script:polls[$Name] -ge 3
        $script:ready[$Name]=$ready
        return $ready
    }
    function Wait-Native([scriptblock]$Check) {
        for($i=0;$i -lt 5;$i++) {if(& $Check) {return}}
        throw 'Bounded readiness timeout'
    }
    function Click-Control($Name) {
        if(-not $script:ready.ContainsKey($Name) -or -not $script:ready[$Name]) {throw 'Input before readiness'}
        $script:clicks+=@($Name)
    }
    Open-Settings
    if(($script:clicks -join ',') -ne 'Settings,AI providers' -or $receipt.checks.navigationControlsReady -ne $true) {throw 'Missing observed navigation'}
    foreach($name in @('Settings','AI providers','Save profile')) {if($script:polls[$name] -ne 3) {throw 'Missing/disabled control released wait'}}
    $script:clicks=@();$script:blocked=$true;$receipt.checks.Clear();$caught=$false
    try {Open-Settings} catch {$caught=$_.Exception.Message -eq 'Bounded readiness timeout'}
    if(-not $caught -or $script:clicks.Count -ne 0 -or $receipt.checks.Contains('navigationControlsReady')) {throw 'Unavailable controls allowed input or passed readiness'}
    if(-not (Failure-CaptureAllowed $true 1 $true $false)) {throw 'Single foreground owned nonpassword window rejected'}
    foreach($foreground in @($false,$true)) {
        foreach($count in @(0,1,2)) {
            foreach($main in @($false,$true)) {
                foreach($password in @($false,$true)) {
                    $expected=($foreground -and $count -eq 1 -and $main -and -not $password)
                    if((Failure-CaptureAllowed $foreground $count $main $password) -ne $expected) {throw 'Unsafe failure screenshot admission'}
                }
            }
        }
    }
    Write-Output 'PASS: actual native navigation helper delays input until readiness and rejects bounded absence'
    """.replace('__SCRIPT__', script_path.as_posix().replace("'", "''"))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('PASS: actual native navigation helper', result.stdout)

if __name__ == '__main__':
    unittest.main()
