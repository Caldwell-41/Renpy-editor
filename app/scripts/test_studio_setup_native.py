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
    value = {'passed': True, 'candidate': h.CANDIDATE, 'tree': h.TREE, 'executableSHA256': h.EXE_SHA, 'artifact': copy.deepcopy(h.ARTIFACT), 'materialInputCount': 269, 'materialInputDigest': h.INPUT_DIGEST, 'launchOrdinals': [8, 9], 'appLaunches': 2, 'packageAttempts': 0, 'completedStages': list(h.STAGES), 'normalExits': [0, 0], 'requests': [{'sequence': n, 'accepted': True, 'method': 'POST', 'path': '/v1/chat/completions', 'bodySHA256': hashes[n-1], **({'clientClosed': True} if n == 2 else {'responseSent': True})} for n in (1, 2, 3)], 'requestPreviewSHA256': hashes}
    for name in ['sourceBaselineBeforeSeed', 'noSaveHTTP', 'cancelProfileUnchanged', 'reopenNoHTTP', 'reopenProfileUnchanged', 'sourceUnchanged', 'profileReferencesRemoved', 'rootRemoved', 'listenerStopped', 'noCredentialRead', 'noDiscovery']:
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
        mutations = [('launchOrdinals', [8, 9, 10]), ('launchOrdinals', [7, 8]), ('launchOrdinals', [6, 7]), ('launchOrdinals', [5, 6]), ('launchOrdinals', [4, 5]), ('launchOrdinals', [3, 4]), ('launchOrdinals', [1, 2]), ('appLaunches', 3), ('packageAttempts', 1), ('artifact', {**h.ARTIFACT, 'attempt': 2})]
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
            receipt = {'passed': True, 'stage': 'seed', 'processId': 123, 'executableSHA256': h.EXE_SHA, 'inputDesktop': 'Default', 'checks': {k: True for k in ['ownedWindow', 'osMouseInput', 'osKeyboardInput', 'controlsInViewport', 'navigationControlsReady', 'savedControlsReady', *h.CHECKS['seed']]}, 'captures': [{'file': 'native.png', 'sha256': h.sha(image), 'width': 200, 'height': 100, 'sampleRange': 40}], 'preview': {'raw': raw, 'rawSHA256': hashlib.sha256(raw.encode()).hexdigest(), 'body': body}}
            receipt['dialog'] = {'processId':123,'class':'#32770','handle':55,'owner':44,'owned':True,'foregroundConfirmed':True,'maskedFieldFocusConfirmed':True}
            receipt['dialog'].update(focusedFieldHandle=1100, clickedChildIds=[100,1], children=[{'id':i,'count':1,'handle':1000+i,'parent':55,'processId':123,'kind':'Edit' if i==100 else 'Button','password':i==100,'style':0x50000020 if i==100 else 0x50000000,'matched':True,'visible':True,'enabled':True} for i in [100,1,2]])
            for name in ['defaults.png','synthetic-preview.png']:(root/name).write_bytes(png())
            receipt['captures'] = [{**receipt['captures'][0], 'file': name} for name in ['defaults.png','synthetic-preview.png']]
            receipt['fieldEntries'] = [{'name': n, 'type': 'ControlType.Edit', 'physicalClick': True, 'keyboardFocusConfirmed': True, 'readbackMatched': True, 'expected': 'public fixture', 'lastReadback': 'public fixture'} for n in ['Profile name', 'Endpoint', 'Model ID', 'Temperature', 'Top-p']]
            receipt['controls'] = [{'name': n, 'value': v, 'enabled': True, 'owner': 123} for n, v in [('Temperature', '1'), ('Top-p', '0.95'), ('Temperature', '0.8'), ('Top-p', '0.9')]]
            receipt['fieldEntries'][2]['type'] = 'ControlType.ComboBox'
            h.validate_stage(receipt, 'seed', 123, root)
            for kind in ['pid', 'image', 'input', 'preview', 'missing', 'duplicate', 'field', 'defaults', 'navigation', 'field-focus', 'field-readback', 'field-type', 'wrong-combo', 'capture-role', 'saved-ready', 'dialog-focus', 'native-child-password', 'native-child-parent', 'native-child-missing', 'native-child-click']:
                value = copy.deepcopy(receipt)
                if kind == 'pid': value['processId'] = 321
                elif kind == 'image': value['captures'][0]['sha256'] = '0' * 64
                elif kind == 'input': value['checks']['osKeyboardInput'] = False
                elif kind == 'preview': value['preview']['body']['enable_tools'] = True
                elif kind == 'navigation': value['checks']['navigationControlsReady'] = False
                elif kind == 'field-focus': value['fieldEntries'][0]['keyboardFocusConfirmed'] = False
                elif kind == 'field-readback': value['fieldEntries'][0]['lastReadback'] = 'different'
                elif kind == 'wrong-combo': value['fieldEntries'][0]['type'] = 'ControlType.ComboBox'
                elif kind == 'capture-role': value['captures'] = value['captures'][:1]
                elif kind == 'saved-ready': value['checks']['savedControlsReady'] = False
                elif kind == 'native-child-password': value['dialog']['children'][0]['password'] = False
                elif kind == 'native-child-parent': value['dialog']['children'][0]['parent'] = 77
                elif kind == 'native-child-missing': value['dialog']['children'] = []
                elif kind == 'native-child-click': value['dialog']['clickedChildIds'] = [100]
                elif kind == 'dialog-focus': value['dialog']['maskedFieldFocusConfirmed'] = False
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
foreach($name in @('Field-TypeAllowed','Set-Field')) {
    $function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
    if($null -eq $function) {throw ('Missing actual field helper: '+$name)}
    . ([scriptblock]::Create($function.Extent.Text))
}
# Exercise the actual type predicate shared by guard and focus, including
# rejecting all other combo boxes. Mocked focus sequencing is not native proof.
foreach($name in @('Profile name','Endpoint','Model ID','Temperature','Top-p')) {
    if(-not (Field-TypeAllowed $name ([System.Windows.Automation.ControlType]::Edit))) {throw 'Typed edit rejected'}
    if((Field-TypeAllowed $name ([System.Windows.Automation.ControlType]::ComboBox)) -ne ($name -eq 'Model ID')) {throw 'Overbroad combo admission'}
    foreach($type in @([System.Windows.Automation.ControlType]::Text,[System.Windows.Automation.ControlType]::Button,[System.Windows.Automation.ControlType]::List)) {
        if(Field-TypeAllowed $name $type) {throw 'Nontyping control admitted'}
    }
}
$predicates=$focus.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Field-TypeAllowed'},$true)
if($predicates.Count -ne 1) {throw 'Actual focus must use reviewed type predicate'}
$receipt=[ordered]@{checks=[ordered]@{};fieldEntries=@()}
$script:events=@();$script:polls=0;$script:blocked=$false;$script:value='before';$script:type=[System.Windows.Automation.ControlType]::Edit
function Assert-Native($State,$Message) {if(-not $State) {throw $Message}}
function Control($Name) {return [pscustomobject]@{Current=[pscustomobject]@{IsPassword=$false;ControlType=$script:type}}}
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
$script:events=@();$script:polls=0;$script:blocked=$false;$script:type=[System.Windows.Automation.ControlType]::ComboBox
Set-Field 'Model ID' 'closeout-synthetic-setup'
if(($script:events -join ',') -ne 'owner,click,owner,keys' -or -not $receipt.fieldEntries[-1].readbackMatched) {throw 'Editable model combo missing physical focus/readback'}
$script:events=@();$caught=$false
try {Set-Field 'Endpoint' 'public fixture'} catch {$caught=$_.Exception.Message -eq 'Typed nonpassword field required'}
if(-not $caught -or $script:events.Count -ne 0 -or $receipt.fieldEntries[-1].type -ne 'ControlType.ComboBox' -or $null -ne $receipt.fieldEntries[-1].before) {throw 'Unlisted combo allowed typing/value read or missed diagnostics'}
$script:events=@();$caught=$false
try {Set-Field 'Credential' 'forbidden'} catch {$caught=$_.Exception.Message -eq 'Nonsecret fixture field whitelist required'}
if(-not $caught -or $script:events.Count -ne 0) {throw 'Unlisted field allowed input or diagnostics'}
Write-Output 'PASS: actual field entry requires physical target focus and records exact nonsecret readback'
""".replace('__SCRIPT__', script_path.as_posix().replace("'", "''"))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('PASS: actual field entry', result.stdout)

        def test_actual_owned_dialog_api_uses_handle_pid_class_and_owner(self):
            script_path = Path(__file__).with_name('studio-setup-windows.ps1').resolve()
            script = r"""
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile('__SCRIPT__',[ref]$tokens,[ref]$errors)
if($errors.Count) {throw 'Native harness syntax invalid'}
$types=$ast.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Add-Type'},$true)
if($types.Count -ne 1) {throw 'Exact native API declaration required'}
. ([scriptblock]::Create($types[0].Extent.Text))
$ProductRepo=Split-Path (Split-Path (Split-Path '__SCRIPT__'))
foreach($name in @('Frozen-Definitions','Wait-Step','Entry-Handle','Assert-EntryOwner','Entry-Exists','Entry-Foreground','Entry-Control','Click-EntryControl','Masked-FocusReady','Select-Entry','Cancel-OwnedEntry')) {
    $f=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
    if($null -eq $f) {throw ('Missing actual native helper '+$name)}
    . ([scriptblock]::Create($f.Extent.Text))
}
foreach($definition in (Frozen-Definitions)) {. ([scriptblock]::Create($definition))}
[void][RewriteNative]::SetProcessDPIAware()
function Wait-Native([scriptblock]$Check) {
    for($i=0;$i -lt 50;$i++) {[System.Windows.Forms.Application]::DoEvents();if(& $Check) {return};Start-Sleep -Milliseconds 20}
    throw 'Controlled fixture bounded wait failed'
}

Add-Type @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
public static class NativeDialogFixture {
    [DllImport("user32.dll",CharSet=CharSet.Unicode,ExactSpelling=true)] public static extern IntPtr CreateWindowExW(uint extended,string kind,string title,uint style,int x,int y,int width,int height,IntPtr owner,IntPtr menu,IntPtr instance,IntPtr data);
    [DllImport("user32.dll")] public static extern bool DestroyWindow(IntPtr window);
    public delegate IntPtr WndProc(IntPtr h,uint message,IntPtr w,IntPtr l);
    [DllImport("user32.dll",EntryPoint="SetWindowLongPtrW",ExactSpelling=true)] public static extern IntPtr SetWindowLongPtr(IntPtr h,int index,IntPtr value);
    [DllImport("user32.dll",EntryPoint="CallWindowProcW",ExactSpelling=true)] public static extern IntPtr CallWindowProc(IntPtr previous,IntPtr h,uint message,IntPtr w,IntPtr l);
    [DllImport("user32.dll")] public static extern bool EnableWindow(IntPtr h,bool enabled);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h,int command);
    static Dictionary<IntPtr,IntPtr> old=new Dictionary<IntPtr,IntPtr>();
    static WndProc proc=Handle;
    public static bool cancelled;
    static IntPtr Handle(IntPtr h,uint message,IntPtr w,IntPtr l) {
        if(message==0x111 && (w.ToInt64()&0xffff)==1) return IntPtr.Zero;
        if(message==0x111 && (w.ToInt64()&0xffff)==2) {cancelled=true;DestroyWindow(h);return IntPtr.Zero;}
        return CallWindowProc(old[h],h,message,w,l);
    }
    public static void Hook(IntPtr h) {var previous=SetWindowLongPtr(h,-4,Marshal.GetFunctionPointerForDelegate(proc));if(previous==IntPtr.Zero) throw new InvalidOperationException("Fixture subclass unavailable");old[h]=previous;}
    public static IntPtr Child(IntPtr parent,string kind,int id,uint style,int x,int y,int width,int height) {
        var h=CreateWindowExW(0,kind,"",style|0x50000000,x,y,width,height,parent,new IntPtr(id),IntPtr.Zero,IntPtr.Zero);
        if(h==IntPtr.Zero) throw new InvalidOperationException("Native child fixture unavailable");return h;
    }
    public static IntPtr Create(string kind,string title,IntPtr owner) {
        var result=CreateWindowExW(0,kind,title,0x90000000,20,20,240,160,owner,IntPtr.Zero,IntPtr.Zero,IntPtr.Zero);
        if(result==IntPtr.Zero) throw new InvalidOperationException("Fixture window unavailable"); return result;
    }
}
'@
$handles=New-Object System.Collections.Generic.List[IntPtr]
try {
    $owner=[NativeDialogFixture]::Create('STATIC','Controlled owner',[IntPtr]::Zero);$handles.Add($owner)
    $other=[NativeDialogFixture]::Create('STATIC','Other controlled owner',[IntPtr]::Zero);$handles.Add($other)
    $title='Remember Studio API key on this computer'
    $dialog=[NativeDialogFixture]::Create('#32770',$title,$owner);$handles.Add($dialog)
    $pidValue=[uint32]$PID
    if(-not [StudioNative]::EntryMatches($dialog,$pidValue,$owner)) {throw 'Actual owned standard dialog rejected'}
    if([StudioNative]::EntryMatches($dialog,0,$owner) -or [StudioNative]::EntryMatches($dialog,$pidValue,$other)) {throw 'Foreign PID/owner admitted'}
    if([StudioNative]::GetAncestor($dialog,3) -ne $owner) {throw 'Actual root owner API differs'}
    $field=[NativeDialogFixture]::Child($dialog,'Edit',100,0x008100A0,10,10,200,24)
    $remember=[NativeDialogFixture]::Child($dialog,'Button',1,0x00010001,30,60,70,24)
    $cancel=[NativeDialogFixture]::Child($dialog,'Button',2,0x00010000,120,60,70,24)
    foreach($id in @(100,1,2)) {if(-not ([StudioNative]::Child($dialog,$id,$pidValue)).matched) {throw ('Actual native child rejected '+$id)}}
    if(([StudioNative]::Child($dialog,100,0)).matched -or ([StudioNative]::Child($other,100,$pidValue)).matched) {throw 'Wrong child PID/parent admitted'}
    [void][NativeDialogFixture]::EnableWindow($field,$false)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Disabled password field admitted'}
    [void][NativeDialogFixture]::EnableWindow($field,$true)
    [void][NativeDialogFixture]::ShowWindow($field,0)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Hidden password field admitted'}
    [void][NativeDialogFixture]::ShowWindow($field,5)
    [void][NativeDialogFixture]::DestroyWindow($field)
    $field=[NativeDialogFixture]::Child($dialog,'Edit',100,0x00810080,10,10,200,24)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Unmasked edit admitted'}
    [void][NativeDialogFixture]::DestroyWindow($field)
    $field=[NativeDialogFixture]::Child($dialog,'Edit',100,0x008108A0,10,10,200,24)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Read-only password edit admitted'}
    [void][NativeDialogFixture]::DestroyWindow($field)
    $field=[NativeDialogFixture]::Child($dialog,'STATIC',100,0,10,10,200,24)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Wrong field class admitted'}
    [void][NativeDialogFixture]::DestroyWindow($field)
    $field=[NativeDialogFixture]::Child($dialog,'Edit',100,0x008100A0,10,10,200,24)
    $duplicateField=[NativeDialogFixture]::Child($dialog,'Edit',100,0x008100A0,10,100,200,24)
    if(([StudioNative]::Child($dialog,100,$pidValue)).matched) {throw 'Duplicate field ID admitted'}
    [void][NativeDialogFixture]::DestroyWindow($duplicateField)
    [void][NativeDialogFixture]::DestroyWindow($remember)
    $wrongButton=[NativeDialogFixture]::Child($dialog,'STATIC',1,0,30,60,70,24)
    if(([StudioNative]::Child($dialog,1,$pidValue)).matched) {throw 'Wrong button class admitted'}
    [void][NativeDialogFixture]::DestroyWindow($wrongButton)
    $wrongButton=[NativeDialogFixture]::Child($dialog,'Button',1,3,30,60,70,24)
    if(([StudioNative]::Child($dialog,1,$pidValue)).matched) {throw 'Checkbox style admitted as Remember'}
    [void][NativeDialogFixture]::DestroyWindow($wrongButton)
    $remember=[NativeDialogFixture]::Child($dialog,'Button',1,0x00010001,30,60,70,24)
    $ProcessId=$PID;$Executable=(Get-Process -Id $ProcessId).Path;$script:mainWindowHandle=$owner
    $receipt=[ordered]@{checks=[ordered]@{}}
    [NativeDialogFixture]::Hook($dialog)
    Select-Entry $dialog
    [void][NativeDialogFixture]::DestroyWindow($cancel)
    $cancel=[NativeDialogFixture]::Child($dialog,'Button',2,0x00010000,800,800,70,24)
    $caught=$false;try {Click-EntryControl $dialog 2} catch {$caught=$_.Exception.Message -eq 'Native child outside owned dialog viewport'}
    if(-not $caught -or $receipt.checks.Contains('osMouseInput')) {throw 'Out-of-viewport native child allowed physical input'}
    [void][NativeDialogFixture]::DestroyWindow($cancel)
    $cancel=[NativeDialogFixture]::Child($dialog,'Button',2,0x00010000,120,60,70,24)
    [void][RewriteNative]::SetForegroundWindow($other)
    Wait-Step 'Controlled foreign foreground' {[RewriteNative]::GetForegroundWindow() -eq $other}
    $caught=$false;try {Click-EntryControl $dialog 100} catch {$caught=$_.Exception.Message -eq 'Native entry lost foreground before native child click'}
    if(-not $caught -or $receipt.checks.Contains('osMouseInput')) {throw 'Foreground loss allowed native mouse input'}
    Select-Entry $dialog
    $nativeField=Entry-Control $dialog 100
    Click-EntryControl $dialog 100
    Wait-Step 'Real controlled masked focus' {Masked-FocusReady $nativeField}
    if(Masked-FocusReady $cancel) {throw 'Wrong focused child admitted'}
    Click-EntryControl $dialog 1
    Wait-Step 'Real controlled button focus' {[StudioNative]::Focused($dialog,$remember)}
    # Revert to the field before testing physical Cancel and observed destruction.
    Click-EntryControl $dialog 100
    Cancel-OwnedEntry
    if(-not [NativeDialogFixture]::cancelled -or [StudioNative]::IsWindow($dialog) -or -not $receipt.checks.nativeDialogCancelled) {throw 'Actual physical Cancel did not dismiss owned dialog'}
    $dialog=[NativeDialogFixture]::Create('#32770',$title,$owner);$handles.Add($dialog)
    foreach($kind in @('STATIC','#32770')) {
        $wrongTitle=if($kind -eq '#32770') {'Wrong title'} else {$title}
        $wrong=[NativeDialogFixture]::Create($kind,$wrongTitle,$owner);$handles.Add($wrong)
        if([StudioNative]::EntryMatches($wrong,$pidValue,$owner)) {throw 'Wrong class/title admitted'}
    }
    $ProcessId=$PID;$Executable=(Get-Process -Id $ProcessId).Path;$script:mainWindowHandle=$owner
    function Assert-Native($State,$Message) {if(-not $State) {throw $Message}}
    $function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Entry-Handle'},$true)
    . ([scriptblock]::Create($function.Extent.Text))
    if((Entry-Handle) -ne $dialog) {throw 'Actual enumerated dialog missing'}
    $duplicate=[NativeDialogFixture]::Create('#32770',$title,$owner);$handles.Add($duplicate)
    $caught=$false;try {Entry-Handle} catch {$caught=$_.Exception.Message -eq 'Ambiguous owned native entry dialogs'}
    if(-not $caught) {throw 'Ambiguous owned dialogs admitted'}
    [void][NativeDialogFixture]::DestroyWindow($duplicate)
    [void][NativeDialogFixture]::DestroyWindow($dialog)
    if((Entry-Handle) -ne [IntPtr]::Zero) {throw 'Missing dialog incorrectly admitted'}
    Write-Output 'PASS: actual Win32 owned dialog lookup rejects wrong PID owner class title ambiguity and absence'
} finally {foreach($handle in $handles) {if([StudioNative]::IsWindow($handle)) {[void][NativeDialogFixture]::DestroyWindow($handle)}}}
""".replace('__SCRIPT__', script_path.as_posix().replace("'", "''"))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('PASS: actual Win32 owned dialog lookup', result.stdout)

        def test_actual_secure_entry_and_modal_cleanup_reject_missing_focus(self):
            script_path = Path(__file__).with_name('studio-setup-windows.ps1').resolve()
            script = r"""
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
Add-Type -AssemblyName UIAutomationClient,UIAutomationTypes
$tokens=$null;$errors=$null
$ast=[System.Management.Automation.Language.Parser]::ParseFile('__SCRIPT__',[ref]$tokens,[ref]$errors)
if($errors.Count) {throw 'Native helper syntax invalid'}
foreach($name in @('Wait-Step','Wait-SavedControls','Secure-Entry','Cancel-OwnedEntry','Cleanup-Profile','Preview-Raw','Preview')) {
    $f=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
    if($null -eq $f) {throw ('Missing actual helper '+$name)}
    . ([scriptblock]::Create($f.Extent.Text))
}
$ProcessId=123;$script:mode='ok';$script:events=@();$script:polls=0;$script:active=$true
$receipt=[ordered]@{checks=[ordered]@{}}
function Assert-Native($State,$Message) {if(-not $State) {throw $Message}}
function Wait-Native([scriptblock]$Check) {for($i=0;$i -lt 5;$i++) {if(& $Check) {return}};throw 'Bounded timeout'}
function Wait-ButtonReady($Name) {$script:events+=@('ready:'+ $Name)}
function Click-Control($Name) {$script:events+=@('click:'+ $Name);if($Name -in @('Remember','Cancel')) {$script:active=$false}}
function Entry-Handle {$script:polls++;if($script:mode -eq 'missing' -or $script:polls -lt 3) {return [IntPtr]::Zero};return [IntPtr]55}
function Assert-EntryOwner($Handle) {if($script:mode -eq 'wrong-owner') {throw 'Native entry handle/owner changed'};$script:events+=@('owner')}
function Select-Entry($Handle) {
    Assert-EntryOwner $Handle
    if($script:mode -eq 'foreground') {throw 'Native wait failed: Native credential dialog foreground / Bounded timeout'}
    $receipt.dialog=[ordered]@{maskedFieldFocusConfirmed=$false}
    $script:window=New-Object PSObject
    $script:window | Add-Member ScriptMethod FindAll {param($Scope,$Condition) return ,@([pscustomobject]@{Current=[pscustomobject]@{IsPassword=$true;ProcessId=123}})}
}
function Entry-Control($Dialog,$Id) {Assert-EntryOwner $Dialog;return [IntPtr](1000+$Id)}
function Click-EntryControl($Dialog,$Id) {Assert-EntryOwner $Dialog;$script:events+=@('click-native:'+ $Id);if($Id -in @(1,2)) {$script:active=$false}}
function Click-MaskedField($Edit) {$script:events+=@('masked-click')}
function Masked-FocusReady($Edit) {$script:events+=@('focus');return ($script:mode -ne 'focus')}
function Entry-Foreground($Handle) {return ($script:mode -ne 'lost-foreground')}
function Send-PublicFixture {$script:events+=@('keys')}
function Entry-Exists($Handle) {return $script:active}
function Select-MainWindow {$script:events+=@('main')}
function Has-Text($Text) {return $true}
function Has-ButtonState($Name,$Enabled) {return $true}
Secure-Entry
if(-not $receipt.dialog.maskedFieldFocusConfirmed -or $script:events -notcontains 'keys' -or $script:events -notcontains 'click-native:1' -or $script:events[-1] -ne 'main') {throw 'Secure entry sequence incomplete'}
foreach($mode in @('missing','wrong-owner','foreground','focus','lost-foreground')) {
    $script:mode=$mode;$script:events=@();$script:polls=0;$script:active=$true;$receipt=[ordered]@{checks=[ordered]@{}};$caught=$false
    try {Secure-Entry} catch {$caught=$true}
    if(-not $caught -or $script:events -contains 'keys' -or $receipt.checks.Contains('nativeCredentialEntry')) {throw ('Unsafe native typing on '+$mode)}
    if($mode -eq 'missing' -and $receipt.pendingNativeAction -ne 'Native credential dialog lookup') {throw 'Lookup failure phase missing'}
    if($mode -eq 'focus' -and $receipt.pendingNativeAction -ne 'Native masked field keyboard focus') {throw 'Focus failure phase missing'}
}
$script:mode='ok';$script:polls=3;$script:active=$true;$script:events=@();$receipt=[ordered]@{checks=[ordered]@{}}
Cancel-OwnedEntry
if($script:events -notcontains 'click-native:2' -or $script:active -or -not $receipt.checks.nativeDialogCancelled) {throw 'Owned modal not cancelled before main cleanup'}
$script:mode='missing';$script:events=@();Cancel-OwnedEntry
if($script:events.Count -ne 0) {throw 'Absent modal caused input'}
$script:controlPolls=0;$script:controlsBlocked=$false
function Has-ButtonState($Name,$Enabled) {$script:controlPolls++;return (-not $script:controlsBlocked -and $script:controlPolls -ge 3)}
Wait-SavedControls 'Saved async fixture' 'Already drawn text'
if($script:controlPolls -ne 3) {throw 'Saved text bypassed enabled-control readiness'}
$script:controlsBlocked=$true;$caught=$false
try {Wait-SavedControls 'Blocked async fixture' 'Already drawn text'} catch {$caught=$true}
if(-not $caught -or $receipt.pendingNativeAction -ne 'Blocked async fixture') {throw 'Disabled saved state passed'}
$script:previewPolls=0
function Nodes {
    $script:previewPolls++
    $text=if($script:previewPolls -lt 3) {'{"model":"closeout-synthetic-setup","response_format":{"json_schema":{"name":"loomlight_compatibility_v1"'} else {'{"model":"closeout-synthetic-setup","response_format":{"json_schema":{"name":"loomlight_compatibility_v1"}}}'}
    $node=[pscustomobject]@{Current=[pscustomobject]@{Name=$text;IsPassword=$false}}
    $node | Add-Member ScriptMethod TryGetCurrentPattern {param($Pattern,$Result) return $false}
    return @($node)
}
function Click-Any($Name) {$script:events+=@('preview-toggle')}
function Capture-Stage($Name) {$script:events+=@('capture:'+ $Name)}
$script:events=@();Preview
if($script:previewPolls -ne 3 -or $receipt.preview.body.model -ne 'closeout-synthetic-setup' -or ($script:events -join ',') -ne 'ready:Save profile,preview-toggle,capture:synthetic-preview,preview-toggle') {throw 'Incomplete preview was accepted or no observed preview capture'}
$script:testing=$true;$script:dirty=$true;$script:profile=$true;$script:events=@();$script:reloadPending=$false;$script:reloadPolls=0
function Has-ButtonState($Name,$Enabled) {
    if($Name -eq 'Remove profile' -and $script:reloadPending) {$script:reloadPolls++;if($script:reloadPolls -ge 3) {$script:dirty=$false}}
    $actual=switch($Name) {
        'Cancel setup test' {$script:testing}
        'Save profile' {-not $script:testing}
        'Remove profile' {-not $script:testing -and -not $script:dirty -and $script:profile}
        default {$true}
    }
    return ($actual -eq $Enabled)
}
function Has-Text($Text) {return ($Text -eq 'Credential: not configured' -and -not $script:profile)}
function Click-Control($Name) {
    if(-not (Has-ButtonState $Name $true)) {throw 'Disabled cleanup control'}
    $script:events+=@('click:'+ $Name)
    if($Name -eq 'Cancel setup test') {$script:testing=$false}
    if($Name -eq 'Reload saved profiles') {$script:reloadPending=$true}
    if($Name -eq 'Remove profile') {$script:profile=$false}
}
Cleanup-Profile
if($script:profile -or $script:dirty -or $script:testing -or $script:reloadPolls -lt 3 -or ($script:events -join ',') -ne 'click:Cancel setup test,ready:Reload saved profiles,click:Reload saved profiles,click:Remove profile,capture:removed') {throw 'Pending request and dirty profile cleanup not resolved in order'}
Write-Output 'PASS: actual secure entry sequence rejects missing ownership foreground and masked focus; modal cleanup cancels owned dialog'
""".replace('__SCRIPT__', script_path.as_posix().replace("'", "''"))
            result = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-Command', script], capture_output=True, text=True, timeout=30)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            self.assertIn('PASS: actual secure entry sequence', result.stdout)

        def test_actual_navigation_helper_waits_for_enabled_controls_without_early_input(self):
            script_path = Path(__file__).with_name('studio-setup-windows.ps1').resolve()
            script = r"""
    $ErrorActionPreference='Stop'
    Set-StrictMode -Version Latest
    $tokens=$null;$errors=$null
    $ast=[System.Management.Automation.Language.Parser]::ParseFile('__SCRIPT__',[ref]$tokens,[ref]$errors)
    if($errors.Count) {throw 'External native harness syntax invalid'}
    foreach($name in @('Wait-Step','Wait-ButtonReady','Open-Settings','Failure-CaptureAllowed')) {
        $function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
        if($null -eq $function) {throw ('Missing navigation helper: '+$name)}
        . ([scriptblock]::Create($function.Extent.Text))
    }
    $receipt=[ordered]@{checks=[ordered]@{}}
    $script:clicks=@();$script:polls=@{};$script:ready=@{};$script:blocked=$false;$script:testingState=$false;$script:closeShown=$false
    function Button($Name) {if($script:closeShown -and $Name -eq 'Close settings') {return [pscustomobject]@{Current=[pscustomobject]@{IsEnabled=$true}}};return $null}
    function Has-ButtonState($Name,$Enabled) {
        if($script:testingState) {return ($Name -eq 'Cancel setup test' -and $Enabled)}
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
    $script:blocked=$false;$script:testingState=$true;$script:closeShown=$true;$receipt.checks.Clear()
    Open-Settings -AllowCancel
    if(-not $receipt.checks.navigationControlsReady) {throw 'Active request blocked cleanup entry before Cancel'}
    $receipt.checks.Clear();$caught=$false
    try {Open-Settings} catch {$caught=$_.Exception.Message -eq 'Bounded readiness timeout'}
    if(-not $caught -or $receipt.checks.Contains('navigationControlsReady')) {throw 'Ordinary Settings entry accepted testing state'}
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
