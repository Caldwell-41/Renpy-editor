param(
    [Parameter(Mandatory=$true)][ValidateSet('preflight','observe-initial','seed','ready-first','invalidate','cancel','ready-final','close','reopen','cleanup','close-reopen','cleanup-after-failure','close-after-failure')][string]$Stage,
    [Parameter(Mandatory=$true)][string]$Output,
    [Parameter(Mandatory=$true)][string]$ProductRepo,
    [Parameter(Mandatory=$true)][string]$Executable,
    [int]$ProcessId=0,
    [string]$Endpoint,
    [string]$FixtureSignal
)
# External host-only native proof. No renderer evaluation, secret read, discovery,
# app build, process creation, or implicit retry occurs in this script.
$ErrorActionPreference='Stop'
Set-StrictMode -Version Latest
$receipt=[ordered]@{stage=$Stage;passed=$false;processId=$ProcessId;executableSHA256=$null;inputDesktop=$null;checks=[ordered]@{};captures=@();controls=@();fieldEntries=@();uiaStaleRetries=0;layer='Windows UIA observation and physical OS keyboard/mouse input; not human acceptance'}
Add-Type @'
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public static class StudioNative {
    public delegate bool WindowVisitor(IntPtr window, IntPtr data);
    [DllImport("user32.dll")] public static extern bool EnumWindows(WindowVisitor visitor, IntPtr data);
    [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr window);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr window);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr window, out uint pid);
    [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr window, uint command);
    [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr window, uint flags);
    [DllImport("user32.dll", CharSet=CharSet.Unicode,ExactSpelling=true)] public static extern int GetWindowTextW(IntPtr window, StringBuilder text, int count);
    [DllImport("user32.dll", CharSet=CharSet.Unicode,ExactSpelling=true)] public static extern int GetClassNameW(IntPtr window, StringBuilder text, int count);
    public static uint PID(IntPtr window) { uint pid; GetWindowThreadProcessId(window, out pid); return pid; }
    public static bool EntryMatches(IntPtr window, uint pid, IntPtr owner) {
        if (!IsWindow(window) || !IsWindowVisible(window) || PID(window)!=pid || GetWindow(window,4)!=owner) return false;
        var title=new StringBuilder(128); var kind=new StringBuilder(64);
        GetWindowTextW(window,title,title.Capacity); GetClassNameW(window,kind,kind.Capacity);
        return kind.ToString()=="#32770" && title.ToString()=="Remember Studio API key on this computer";
    }
    public static IntPtr[] Entries(uint pid, IntPtr owner) {
        var found=new List<IntPtr>();
        if (!EnumWindows(delegate(IntPtr window, IntPtr data) {
            if (EntryMatches(window,pid,owner)) found.Add(window); return true;
        }, IntPtr.Zero)) throw new InvalidOperationException("Owned window enumeration failed");
        return found.ToArray();
    }
}
'@
function Wait-Step([string]$Name,[scriptblock]$Check) {
    $receipt.pendingNativeAction=$Name
    try {Wait-Native $Check} catch {throw ('Native wait failed: '+$Name+' / '+$_.Exception.Message)}
}
function Entry-Handle {
    $owned=Get-Process -Id $ProcessId
    Assert-Native ([IO.Path]::GetFullPath($owned.Path) -eq [IO.Path]::GetFullPath($Executable)) 'Dialog owner executable mismatch'
    $handles=@([StudioNative]::Entries([uint32]$ProcessId,$script:mainWindowHandle))
    Assert-Native ($handles.Count -le 1) 'Ambiguous owned native entry dialogs'
    if($handles.Count -eq 1) {return $handles[0]}
    return [IntPtr]::Zero
}
function Assert-EntryOwner($Handle) {
    Assert-Native ((Entry-Handle) -eq $Handle -and $Handle -ne [IntPtr]::Zero) 'Native entry handle/owner changed'
}
function Entry-Exists($Handle) {return [StudioNative]::IsWindow($Handle)}
function Entry-Foreground($Handle) {return [RewriteNative]::GetForegroundWindow() -eq $Handle}
function Masked-FocusReady($Edit) {
    $focused=[System.Windows.Automation.AutomationElement]::FocusedElement
    return ($null -ne $focused -and $focused.Current.IsPassword -and $focused.Current.HasKeyboardFocus -and [System.Windows.Automation.Automation]::Compare($Edit,$focused))
}
function Click-MaskedField($Edit) {
    Focus-Control $Edit
    Assert-EntryOwner $script:handle
    Assert-Native (Entry-Foreground $script:handle) 'Native entry lost foreground before masked mouse input'
    $bounds=$Edit.Current.BoundingRectangle
    Assert-Native ([RewriteNative]::Click([int]($bounds.Left+$bounds.Width/2),[int]($bounds.Top+$bounds.Height/2))) 'Masked field physical click failed'
    $receipt.checks.osMouseInput=$true
}
function Send-PublicFixture {[System.Windows.Forms.SendKeys]::SendWait('loomlight-public-setup-fixture')}
function Select-Entry($Handle) {
    Assert-EntryOwner $Handle
    $receipt.dialog=[ordered]@{handle=$Handle.ToInt64();owner=$script:mainWindowHandle.ToInt64();processId=$ProcessId;class='#32770';owned=$true;foregroundConfirmed=$false;maskedFieldFocusConfirmed=$false}
    [void][RewriteNative]::SetForegroundWindow($Handle)
    Wait-Step 'Native credential dialog foreground' {Entry-Foreground $Handle}
    Assert-EntryOwner $Handle
    $script:window=[System.Windows.Automation.AutomationElement]::FromHandle($Handle);$script:handle=$Handle
    Assert-Native ($script:window.Current.ProcessId -eq $ProcessId) 'Native entry UIA/PID mismatch'
    $receipt.dialog.foregroundConfirmed=$true
    Ensure-ObservableWindow
}
function Cancel-OwnedEntry {
    $entry=Entry-Handle
    if($entry -eq [IntPtr]::Zero) {return}
    Select-Entry $entry
    Wait-ButtonReady 'Cancel';Click-Control 'Cancel'
    Wait-Step 'Native credential dialog cancelled' {-not (Entry-Exists $entry)}
    $receipt.checks.nativeDialogCancelled=$true
}
function Frozen-Definitions {
    $path=Join-Path $ProductRepo 'app/scripts/rewrite-windows-native.ps1'
    $tokens=$null;$errors=$null
    $ast=[System.Management.Automation.Language.Parser]::ParseFile($path,[ref]$tokens,[ref]$errors)
    if($errors.Count) {throw 'Frozen native helper syntax invalid'}
    # Import only the two Add-Type declarations and selected function definitions.
    # Never dot-source the product script's stage entry or launch any product probe.
    $types=$ast.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Add-Type'},$true)
    if($types.Count -ne 2) {throw 'Frozen Add-Type declarations changed'}
    $definitions=New-Object System.Collections.Generic.List[string]
    foreach($type in $types) {$definitions.Add($type.Extent.Text)}
    foreach($name in @('Assert-Native','Input-Desktop','Capture','Window-Rect','Ensure-ObservableWindow','Wait-Native','Nodes','Button','Has-Text','Has-ButtonState','Focus-Control','Click-Control')) {
        $function=$ast.Find({param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true)
        if($null -eq $function) {throw ('Frozen native helper missing: '+$name)}
        $definitions.Add($function.Extent.Text)
    }
    return $definitions.ToArray()
}
function Control([string]$Name) {
    $condition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty,$Name)
    $nodes=$script:window.FindAll([System.Windows.Automation.TreeScope]::Descendants,$condition)
    $matches=@($nodes | Where-Object {$_.Current.ControlType -ne [System.Windows.Automation.ControlType]::Text -and $_.Current.IsEnabled})
    Assert-Native ($matches.Count -eq 1) ('Exactly one native control required: '+$Name)
    return $matches[0]
}
function Click-Any([string]$Name) {
    $control=Control $Name
    Focus-Control $control
    Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Owned window lost foreground'
    $bounds=$control.Current.BoundingRectangle
    Assert-Native ([RewriteNative]::Click([int]($bounds.Left+$bounds.Width/2),[int]($bounds.Top+$bounds.Height/2))) 'OS mouse input failed'
    $receipt.checks.osMouseInput=$true
}
function Value([string]$Name) {
    $control=Control $Name
    Assert-Native (-not $control.Current.IsPassword) 'Password value reads are forbidden'
    $pattern=$null
    if($control.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern,[ref]$pattern)) {return $pattern.Current.Value}
    if($control.TryGetCurrentPattern([System.Windows.Automation.RangeValuePattern]::Pattern,[ref]$pattern)) {return $pattern.Current.Value.ToString([Globalization.CultureInfo]::InvariantCulture)}
    throw ('Observable nonsecret value pattern unavailable: '+$Name)
}
function Assert-FieldOwner {
    $owned=Get-Process -Id $ProcessId
    Assert-Native ([IO.Path]::GetFullPath($owned.Path) -eq [IO.Path]::GetFullPath($Executable)) 'Field owner executable mismatch'
    Assert-Native ($script:window.Current.ProcessId -eq $ProcessId) 'Field owner window/PID mismatch'
    Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Owned window lost foreground before typing'
}
function Field-TypeAllowed([string]$Name,$Type) {
    # Model ID is a text input with a datalist in the frozen product. WebView
    # exposes that editable input as ComboBox; other fields must stay typed.
    return ($Type -in @([System.Windows.Automation.ControlType]::Edit,[System.Windows.Automation.ControlType]::Spinner) -or ($Name -eq 'Model ID' -and $Type -eq [System.Windows.Automation.ControlType]::ComboBox))
}
function Field-FocusReady($Control) {
    $focused=[System.Windows.Automation.AutomationElement]::FocusedElement
    if($null -eq $focused -or $focused.Current.IsPassword -or -not $focused.Current.HasKeyboardFocus) {return $false}
    if(-not (Field-TypeAllowed $Control.Current.Name $focused.Current.ControlType)) {return $false}
    if([System.Windows.Automation.Automation]::Compare($Control,$focused)) {return $true}
    foreach($child in $Control.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.Condition]::TrueCondition)) {
        if([System.Windows.Automation.Automation]::Compare($child,$focused)) {return $true}
    }
    return $false
}
function Send-FieldKeys([string]$Text) {
    [System.Windows.Forms.SendKeys]::SendWait('^a')
    [System.Windows.Forms.SendKeys]::SendWait($Text)
    [System.Windows.Forms.SendKeys]::SendWait('{TAB}')
}
function Set-Field([string]$Name,[string]$Text) {
    Assert-Native ($Name -in @('Profile name','Endpoint','Model ID','Temperature','Top-p')) 'Nonsecret fixture field whitelist required'
    $receipt.pendingNativeAction='Set field: '+$Name
    $control=Control $Name
    $diagnostic=[ordered]@{name=$Name;expected=$Text;before=$null;lastReadback=$null;type=$control.Current.ControlType.ProgrammaticName;physicalClick=$false;keyboardFocusConfirmed=$false;readbackMatched=$false}
    $receipt.fieldEntries+=@($diagnostic)
    Assert-Native (-not $control.Current.IsPassword -and (Field-TypeAllowed $Name $control.Current.ControlType)) 'Typed nonpassword field required'
    $diagnostic.before=Value $Name
    Assert-FieldOwner
    Click-Any $Name
    $diagnostic.physicalClick=$true
    Wait-Native {Field-FocusReady (Control $Name)}
    $diagnostic.keyboardFocusConfirmed=$true
    Assert-FieldOwner
    Send-FieldKeys $Text
    $receipt.checks.osKeyboardInput=$true
    $receipt.pendingNativeAction='Read back field: '+$Name
    Wait-Native {$diagnostic.lastReadback=Value $Name;$diagnostic.lastReadback -eq $Text}
    $diagnostic.readbackMatched=$true
}
function Observe-Field([string]$Name,[string]$Expected) {
    $control=Control $Name;Focus-Control $control
    Assert-Native ((Value $Name) -eq $Expected) ('Native saved value mismatch: '+$Name)
    $receipt.controls+=@([ordered]@{name=$Name;value=(Value $Name);type=$control.Current.ControlType.ProgrammaticName;enabled=$control.Current.IsEnabled;owner=$script:window.Current.ProcessId;elementProcessId=$control.Current.ProcessId})
}
function Capture-Stage([string]$Name) {
    Assert-Native ($script:handle -eq $script:mainWindowHandle -and [RewriteNative]::GetForegroundWindow() -eq $script:mainWindowHandle) 'Capture requires owned foreground main window'
    Assert-Native ((Entry-Handle) -eq [IntPtr]::Zero) 'Native entry dialog suppresses stage capture'
    Assert-Native ($script:window.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::IsPasswordProperty,$true)).Count -eq 0) 'Password field suppresses stage capture'
    $receipt.captures+=@(Capture $Name (Window-Rect $script:handle))
}
function Wait-ButtonReady([string]$Name) {
    $receipt.pendingNativeAction=$Name
    # A native window/foreground handle does not establish WebView readiness.
    # Re-query the exact typed button using the qualified bounded polling helper.
    Wait-Native {Has-ButtonState $Name $true}
}
function Wait-SavedControls([string]$Phase,[string]$Text,[string]$ButtonName='Save profile') {
    Wait-Step $Phase {(Has-Text $Text) -and (Has-ButtonState $ButtonName $true)}
}
function Open-Settings {
    if($null -eq (Button 'Close settings')) {
        Wait-ButtonReady 'Settings';Click-Control 'Settings'
        Wait-ButtonReady 'AI providers';Click-Control 'AI providers'
    }
    Wait-ButtonReady 'Save profile'
    $receipt.checks.navigationControlsReady=$true
}
function Failure-CaptureAllowed([bool]$ForegroundOwned,[int]$OwnedWindowCount,[bool]$MainWindowObserved,[bool]$PasswordPresent) {
    return ($ForegroundOwned -and $OwnedWindowCount -eq 1 -and $MainWindowObserved -and -not $PasswordPresent)
}
function Observe-FailureState {
    # Observation only: no focus change, clicking, ValuePattern, TextPattern,
    # password text, OS credentials or renderer bridge. Failures stay failed.
    $snapshot=[ordered]@{ownedWindowVerified=$false;selectedWindowIsMain=$false;foregroundOwned=$false;ownedTopLevelCount=0;mainWindowObserved=$false;expectedButtons=@();observedButtons=@();otherButtonCount=0;passwordControlPresent=$false;capture=$null;captureSuppressed=$true}
    $receipt.failureSnapshot=$snapshot
    if($ProcessId -le 0 -or -not $receipt.checks.Contains('ownedWindow')) {return}
    $owned=Get-Process -Id $ProcessId
    Assert-Native ([IO.Path]::GetFullPath($owned.Path) -eq [IO.Path]::GetFullPath($Executable)) 'Failure observation owner mismatch'
    Assert-Native ($script:window.Current.ProcessId -eq $ProcessId) 'Failure observation window/PID mismatch'
    $snapshot.ownedWindowVerified=$true
    $snapshot.selectedWindowIsMain=($script:handle -eq $script:mainWindowHandle)
    $snapshot.foregroundOwned=($snapshot.selectedWindowIsMain -and [RewriteNative]::GetForegroundWindow() -eq $script:mainWindowHandle)
    # Native secure entry is a separate top-level window. Observe every owned
    # top-level tree, including hidden/modal windows; never read control values.
    $ownerCondition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ProcessIdProperty,$ProcessId)
    $ownedWindows=[System.Windows.Automation.AutomationElement]::RootElement.FindAll([System.Windows.Automation.TreeScope]::Children,$ownerCondition)
    $passwordCondition=[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::IsPasswordProperty,$true)
    foreach($ownedWindow in $ownedWindows) {
        $snapshot.ownedTopLevelCount++
        if([int64]$ownedWindow.Current.NativeWindowHandle -eq $script:mainWindowHandle.ToInt64()) {$snapshot.mainWindowObserved=$true}
        if($ownedWindow.Current.IsPassword -or $ownedWindow.FindAll([System.Windows.Automation.TreeScope]::Descendants,$passwordCondition).Count -gt 0) {$snapshot.passwordControlPresent=$true}
    }
    $names=@('Settings','AI providers','Close settings','Save profile','Test setup','Cancel setup test','Remove profile','Remember','Cancel')
    foreach($name in $names) {
        $control=Button $name
        $snapshot.expectedButtons+=@([ordered]@{name=$name;present=($null -ne $control);enabled=($null -ne $control -and $control.Current.IsEnabled)})
    }
    foreach($node in (Nodes)) {
        if($node.Current.IsPassword) {$snapshot.passwordControlPresent=$true;continue}
        if($node.Current.ControlType -eq [System.Windows.Automation.ControlType]::Button) {
            if($node.Current.Name -in $names) {
                $snapshot.observedButtons+=@([ordered]@{name=$node.Current.Name;enabled=$node.Current.IsEnabled;offscreen=$node.Current.IsOffscreen;type=$node.Current.ControlType.ProgrammaticName})
            } else {$snapshot.otherButtonCount++}
        }
    }
    # An overlapping secure dialog or unrelated foreground window suppresses
    # pixels. Recheck foreground immediately before capture; never change focus.
    $snapshot.foregroundOwned=($snapshot.selectedWindowIsMain -and [RewriteNative]::GetForegroundWindow() -eq $script:mainWindowHandle)
    if(Failure-CaptureAllowed $snapshot.foregroundOwned $snapshot.ownedTopLevelCount $snapshot.mainWindowObserved $snapshot.passwordControlPresent) {
        $snapshot.capture=Capture 'failure-owned-window' (Window-Rect $script:mainWindowHandle)
        $snapshot.captureSuppressed=$false
    }
}

function Preview {
    Wait-ButtonReady 'Save profile'
    Click-Any 'Synthetic setup test request'
    Wait-Step 'Complete synthetic preview JSON' {$script:previewRaw=Preview-Raw;$null -ne $script:previewRaw}
    $raw=$script:previewRaw
    $body=$raw | ConvertFrom-Json
    Assert-Native ($body.model -eq 'closeout-synthetic-setup' -and $body.response_format.json_schema.name -eq 'loomlight_compatibility_v1') 'Synthetic native preview identity mismatch'
    $bytes=[Text.Encoding]::UTF8.GetBytes($raw)
    $hash=[Security.Cryptography.SHA256]::Create()
    try {$digest=[BitConverter]::ToString($hash.ComputeHash($bytes)).Replace('-','').ToLowerInvariant()} finally {$hash.Dispose()}
    $receipt.preview=[ordered]@{raw=$raw;rawSHA256=$digest;body=$body}
    $receipt.checks.syntheticPreview=$true
    Capture-Stage 'synthetic-preview'
    Click-Any 'Synthetic setup test request'
}
function Preview-Raw {
    foreach($node in (Nodes)) {
        if($node.Current.IsPassword) {continue}
        $text=$node.Current.Name
        $candidates=@($text)
        $pattern=$null
        if($node.TryGetCurrentPattern([System.Windows.Automation.TextPattern]::Pattern,[ref]$pattern)) {
            $candidates+=@($pattern.DocumentRange.GetText(4096))
        }
        foreach($candidate in $candidates) {
            if(-not $candidate) {continue}
            $candidate=$candidate.Trim()
            if(-not $candidate.StartsWith('{') -or -not $candidate.Contains('loomlight_compatibility_v1')) {continue}
            try {
                $body=$candidate | ConvertFrom-Json -ErrorAction Stop
                if($body.model -eq 'closeout-synthetic-setup' -and $body.response_format.json_schema.name -eq 'loomlight_compatibility_v1') {return $candidate}
            } catch {continue}
        }
    }
    return $null
}
function Secure-Entry {
    $receipt.pendingNativeAction='Enter public fixture credential'
    $receipt.checks.credentialEntryAttempted=$true
    Wait-ButtonReady ('Enter credential'+[char]0x2026);Click-Control ('Enter credential'+[char]0x2026)
    Wait-Step 'Native credential dialog lookup' {$script:entryHandle=Entry-Handle;$script:entryHandle -ne [IntPtr]::Zero}
    $dialogHandle=$script:entryHandle;Select-Entry $dialogHandle
    $dialog=$script:window
    $edits=$dialog.FindAll([System.Windows.Automation.TreeScope]::Descendants,[System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::ControlTypeProperty,[System.Windows.Automation.ControlType]::Edit))
    Assert-Native ($edits.Count -eq 1 -and $edits[0].Current.IsPassword -and $edits[0].Current.ProcessId -eq $ProcessId) 'One owned masked native entry field required'
    # Only write the known public fixture value. Never request its ValuePattern,
    # text, native window text, OS credential, or renderer key data.
    Click-MaskedField $edits[0]
    Wait-Step 'Native masked field keyboard focus' {Masked-FocusReady $edits[0]}
    Assert-EntryOwner $dialogHandle
    Assert-Native (Entry-Foreground $dialogHandle) 'Native entry lost foreground before public fixture typing'
    $receipt.dialog.maskedFieldFocusConfirmed=$true
    $receipt.pendingNativeAction='Type public fixture into verified native masked field'
    Send-PublicFixture
    Assert-EntryOwner $dialogHandle
    Assert-Native (Entry-Foreground $dialogHandle) 'Native entry lost foreground before Remember'
    Click-Control 'Remember'
    Wait-Step 'Native credential dialog saved and dismissed' {-not (Entry-Exists $dialogHandle)}
    $receipt.checks.nativeCredentialEntry=$true;$receipt.checks.osKeyboardInput=$true
    Select-MainWindow
    Wait-SavedControls 'Saved credential status and enabled Settings' 'Credential: configured'
}
function Select-MainWindow {
    param([switch]$ObserveOnly)
    Wait-Native {(Get-Process -Id $ProcessId).MainWindowHandle -ne [IntPtr]::Zero}
    $script:handle=[StudioNative]::GetAncestor((Get-Process -Id $ProcessId).MainWindowHandle,3)
    $script:mainWindowHandle=$script:handle
    $script:window=[System.Windows.Automation.AutomationElement]::FromHandle($script:handle)
    Assert-Native ($script:window.Current.ProcessId -eq $ProcessId) 'Owned window/PID mismatch'
    $receipt.checks.ownedWindow=$true
    if($ObserveOnly) {return}
    [void][RewriteNative]::SetForegroundWindow($script:handle)
    Wait-Native {[RewriteNative]::GetForegroundWindow() -eq $script:handle}
    Ensure-ObservableWindow
}
try {
    foreach($definition in (Frozen-Definitions)) { . ([scriptblock]::Create($definition)) }
    [void][RewriteNative]::SetProcessDPIAware()
    $receipt.inputDesktop=Input-Desktop
    Assert-Native ($receipt.inputDesktop -eq 'Default' -and [Environment]::UserInteractive -and [Environment]::Is64BitProcess) 'Interactive Windows x64 required'
    $receipt.executableSHA256=[RewriteNative]::HashFile($Executable)
    Assert-Native ($receipt.executableSHA256 -eq '0231a7cd751cd2c52c63c5936db532a2cc156cb020ba46f990a78142c0419b76') 'Frozen executable mismatch'
    if($Stage -eq 'preflight') {
        $bounds=New-Object System.Drawing.Rectangle 0,0,([RewriteNative]::GetSystemMetrics(0)),([RewriteNative]::GetSystemMetrics(1))
        if(($bounds.Width -lt 1280 -or $bounds.Height -lt 960) -and (Get-Command Set-DisplayResolution -ErrorAction SilentlyContinue)) {Set-DisplayResolution -Width 1920 -Height 1080 -Force | Out-Null;Start-Sleep -Milliseconds 500}
        $bounds=New-Object System.Drawing.Rectangle 0,0,([RewriteNative]::GetSystemMetrics(0)),([RewriteNative]::GetSystemMetrics(1))
        Assert-Native ($bounds.Width -ge 1280 -and $bounds.Height -ge 960 -and [System.Windows.Automation.AutomationElement]::RootElement -ne $null) 'Required native desktop unavailable'
        $receipt.captures=@(Capture 'preflight-desktop' $bounds)
    } else {
        $owned=Get-Process -Id $ProcessId
        Assert-Native ([IO.Path]::GetFullPath($owned.Path) -eq [IO.Path]::GetFullPath($Executable)) 'Owned executable/PID mismatch'
        Select-MainWindow -ObserveOnly
        if($Stage -in @('cleanup','cleanup-after-failure','close','close-reopen','close-after-failure')) {Cancel-OwnedEntry}
        Select-MainWindow
        if($Stage -notin @('observe-initial','close','close-reopen','close-after-failure')) {Open-Settings}
        switch($Stage) {
            'observe-initial' {
                Wait-ButtonReady 'Settings'
                $receipt.checks.sourceBaselineReady=$true
            }
            'seed' {
                Observe-Field 'Temperature' '1';Observe-Field 'Top-p' '0.95';$receipt.checks.defaults=$true;Capture-Stage 'defaults'
                Set-Field 'Profile name' 'Closeout native setup';Set-Field 'Endpoint' $Endpoint;Set-Field 'Model ID' 'closeout-synthetic-setup'
                Set-Field 'Temperature' '0.8';Set-Field 'Top-p' '0.9'
                $receipt.checks.profileSaveAttempted=$true
                Click-Control 'Save profile'
                Wait-SavedControls 'Initial profile saved and fields enabled' 'Credential: missing'
                Wait-ButtonReady ('Enter credential'+[char]0x2026)
                $receipt.checks.savedControlsReady=$true
                Observe-Field 'Temperature' '0.8';Observe-Field 'Top-p' '0.9';$receipt.checks.samplingSaved=$true
                Secure-Entry;Preview
            }
            'ready-first' {
                Click-Control 'Test setup';$receipt.checks.explicitSetup=$true
                Wait-SavedControls 'First setup ready and controls enabled' 'Setup tested for structured proposals. Every generated result still needs review.' 'Test setup'
                $receipt.checks.ready=$true;Capture-Stage 'ready'
            }
            'invalidate' {
                Set-Field 'Temperature' '0.7';Set-Field 'Top-p' '0.85';Click-Control 'Save profile'
                Wait-SavedControls 'Sampling saved, invalidated and fields enabled' 'Setup untested; run Test setup before a project send'
                $receipt.checks.savedControlsReady=$true
                Observe-Field 'Temperature' '0.7';Observe-Field 'Top-p' '0.85';$receipt.checks.samplingSaved=$true;$receipt.checks.readinessInvalidated=$true
                Preview
            }
            'cancel' {
                Click-Control 'Test setup';$receipt.checks.explicitSetup=$true
                Wait-Native {Has-ButtonState 'Cancel setup test' $true}
                Wait-Native {Test-Path -LiteralPath $FixtureSignal}
                $received=Get-Content -LiteralPath $FixtureSignal -Raw | ConvertFrom-Json
                Assert-Native ($received.sequence -eq 2 -and $received.accepted -eq $true) 'Exact stalled synthetic POST was not received'
                Click-Control 'Cancel setup test'
                Wait-Step 'Setup cancelled and controls enabled' {(Has-Text 'Setup test cancelled. No compatibility recorded.') -and (Has-ButtonState 'Test setup' $true) -and (Has-ButtonState 'Cancel setup test' $false)}
                $receipt.checks.cancelled=$true;$receipt.checks.untested=$true;Capture-Stage 'cancelled'
            }
            'ready-final' {
                Click-Control 'Test setup';$receipt.checks.explicitSetup=$true
                Wait-SavedControls 'Final setup ready and controls enabled' 'Setup tested for structured proposals. Every generated result still needs review.' 'Test setup'
                $receipt.checks.ready=$true;Capture-Stage 'ready'
            }
            'reopen' {
                Observe-Field 'Temperature' '0.7';Observe-Field 'Top-p' '0.85';$receipt.checks.savedSampling=$true
                Assert-Native (Has-Text 'Credential: configured') 'Saved credential unavailable on process reopen'
                Assert-Native (Has-Text 'Setup tested for structured proposals') 'Saved readiness unavailable on reopen'
                $receipt.checks.savedCredentialConfigured=$true;$receipt.checks.ready=$true
                Preview
            }
            {$_ -in @('cleanup','cleanup-after-failure')} {
                if(Has-ButtonState 'Cancel setup test' $true) {Click-Control 'Cancel setup test';Wait-Step 'Cleanup request cancelled' {(Has-ButtonState 'Cancel setup test' $false) -and (Has-ButtonState 'Save profile' $true)}}
                if(Has-ButtonState 'Remove profile' $true) {Click-Control 'Remove profile';Wait-SavedControls 'Owned profile removed and controls enabled' 'Credential: not configured'}
                Assert-Native (Has-Text 'Credential: not configured') 'Owned profile cleanup incomplete'
                $receipt.checks.profileRemoved=$true;$receipt.checks.noConfiguredCredential=$true;Capture-Stage 'removed'
            }
            {$_ -in @('close','close-reopen','close-after-failure')} {
                if($null -ne (Button 'Close settings')) {Click-Control 'Close settings'}
                Select-MainWindow
                Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Owned close lost foreground'
                [System.Windows.Forms.SendKeys]::SendWait('%{F4}')
                $receipt.pendingNativeAction='Owned main close input sent; child exit checked by controller'
                $receipt.checks.normalClose=$true;$receipt.checks.osKeyboardInput=$true
            }
        }
    }
    $receipt.passed=$true
} catch {
    $receipt.error=$_.Exception.Message
    try {Observe-FailureState} catch {$receipt.failureSnapshotError=$_.Exception.Message}
} finally {
    $receipt | ConvertTo-Json -Depth 24 | Out-File -FilePath (Join-Path $Output 'receipt.json') -Encoding utf8
}
if(-not $receipt.passed) {exit 1}
