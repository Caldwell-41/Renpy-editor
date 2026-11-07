"""Windows logic fixtures for studio-setup-windows.ps1 helpers used by the connection driver."""
import os
from pathlib import Path
import subprocess
import unittest


# Only Windows can execute the PowerShell helpers; Mac collects no cases from this file.
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
