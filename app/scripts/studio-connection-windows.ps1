param(
 [Parameter(Mandatory=$true)][ValidateSet('preflight','entry-preflight','entry-alpha','entry-gamma','entry-cancel','entry-beta','observe','observe-reload','cleanup-after-failure')][string]$Stage,
 [Parameter(Mandatory=$true)][string]$Output,
 [Parameter(Mandatory=$true)][string]$ProductRepo,
 [Parameter(Mandatory=$true)][string]$Executable,
 [int]$ProcessId=0,[string]$Root,[string]$Step,[int]$Phase=0
)
# Current connection mode. Import definitions only; frozen stage entry never runs.
$ErrorActionPreference='Stop';Set-StrictMode -Version Latest
$receipt=[ordered]@{contract=2;stage=$Stage;step=$Step;phase=$Phase;passed=$false;processId=$ProcessId;executableSHA256=$null;inputDesktop=$null;checks=[ordered]@{};captures=@();controls=@();fieldEntries=@();uiaStaleRetries=0;cleanup=[ordered]@{modal=$false;faultRestored=$true};layer='Packaged WebView flow plus owned native dialog OS input; not human acceptance'}
New-Item -ItemType Directory -Path $Output -ErrorAction Stop | Out-Null
function Definitions([string]$File,[string[]]$Names,[switch]$NativeType) {
 $tokens=$null;$errors=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile($File,[ref]$tokens,[ref]$errors)
 if($errors.Count){throw 'Native helper syntax invalid'}
 if($NativeType){
  $types=@($ast.FindAll({param($n)$n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Add-Type'},$true))
  if($types.Count -ne 1){throw 'Native dialog declaration changed'}
  # The current native draft has its own exact title; all ownership/child/focus
  # checks come from the already qualified primitives, without modifying them.
  $source=$types[0].Extent.Text
  if(-not $source.Contains('Remember Studio API key on this computer')){throw 'Expected legacy title missing'}
  $source.Replace('Remember Studio API key on this computer','Use API key for this connection draft')
 }
 foreach($name in $Names){
  $functions=@($ast.FindAll({param($n)$n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true))
  if($functions.Count -ne 1){throw ('Unique native helper missing: '+$name)}
  $functions[0].Extent.Text
 }
}
function Native-Label($Handle){$text=New-Object System.Text.StringBuilder 64;[void][StudioNative]::GetWindowTextW($Handle,$text,64);return $text.ToString()}
function Public-Entry {
 Wait-Step 'Owned current draft dialog' {$script:entry=Entry-Handle;$script:entry -ne [IntPtr]::Zero}
 Select-Entry $script:entry
 $edit=Entry-Control $script:entry 100;[void](Entry-Control $script:entry 1);[void](Entry-Control $script:entry 2)
 Click-MaskedField $edit;Wait-Step 'Verified masked child focus' {Masked-FocusReady $edit}
 $receipt.dialog.maskedFieldFocusConfirmed=$true;$receipt.dialog.focusedFieldHandle=$edit.ToInt64()
 if($Stage -eq 'entry-preflight'){
  Click-EntryControl $script:entry 2;Wait-Step 'Early owned Cancel dismissed' {-not (Entry-Exists $script:entry)}
  $receipt.checks.earlyCancel=$true;return
 }
 $label=switch($Stage){'entry-alpha'{'alpha'}'entry-gamma'{'gamma'}'entry-beta'{'beta'}'entry-cancel'{'alpha'}}
 Assert-EntryOwner $script:entry
 Assert-Native (Masked-FocusReady $edit) 'Masked child lost keyboard focus'
 [System.Windows.Forms.SendKeys]::SendWait('loomlight-public-windows-'+$label)
 $receipt.checks.osKeyboardInput=$true
 if($Stage -in @('entry-alpha','entry-cancel')){
  $resolved=[IO.Path]::GetFullPath($Root);$parent=[IO.Path]::GetDirectoryName($resolved)
  Assert-Native ($parent -eq [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') -and [IO.Path]::GetFileName($resolved).StartsWith('loomlight-studio-windows-connection-')) 'Isolated entry fault root refused'
  Assert-Native (((Get-Item -LiteralPath $resolved).Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) 'Entry fault root link refused'
  $script:profilePath=Join-Path $resolved 'ai-profiles.json'
  Assert-Native (((Get-Item -LiteralPath $script:profilePath).Attributes -band [IO.FileAttributes]::ReparsePoint) -eq 0) 'Entry fault file link refused'
  $script:original=[IO.File]::ReadAllBytes($script:profilePath)
  [IO.File]::WriteAllBytes((Join-Path $Output 'entry-before.bin'),$script:original)
  $script:fault=[Text.Encoding]::UTF8.GetBytes('controlled current native entry fault')
  [IO.File]::WriteAllBytes($script:profilePath,$script:fault);$script:faultActive=$true;$receipt.cleanup.faultRestored=$false
  Click-EntryControl $script:entry 1
  Wait-Step 'Failed entry retains same native dialog' {(Entry-Exists $script:entry) -and (Native-Label (Entry-Control $script:entry 1)) -eq 'Retry save'}
  Assert-Native ((Entry-Control $script:entry 100) -eq $edit) 'Retained secure field changed'
  Restore-Fault
  $receipt.checks.failedEntryRetained=$true
  if($Stage -eq 'entry-cancel'){
   Click-EntryControl $script:entry 2;Wait-Step 'Failed entry Cancel dismissed' {-not (Entry-Exists $script:entry)}
   $receipt.checks.failedEntryCancel=$true;return
  }
  # No second typing/read occurs: the same secure field supplies the retry.
  Click-EntryControl $script:entry 1;$receipt.checks.retainedInputRetry=$true
 }else{Click-EntryControl $script:entry 1}
 Wait-Step 'Current draft entry dismissed' {-not (Entry-Exists $script:entry)}
 $receipt.checks.nativeCredentialEntry=$true
}
function Restore-Fault {
 if($script:faultActive){
  Assert-Native ([Convert]::ToBase64String([IO.File]::ReadAllBytes($script:profilePath)) -eq [Convert]::ToBase64String($script:fault)) 'Unknown record change; fault restoration refused'
  [IO.File]::WriteAllBytes($script:profilePath,$script:original);$script:faultActive=$false;$receipt.cleanup.faultRestored=$true
 }
}
function Select-CurrentForeground {
 Select-MainWindow -ObserveOnly
 [void][RewriteNative]::SetForegroundWindow($script:handle)
 Wait-Native {[RewriteNative]::GetForegroundWindow() -eq $script:handle}
}
function Current-ClientSize {
 $client=New-Object CurrentStudioWindow+RECT
 Assert-Native ([CurrentStudioWindow]::GetClientRect($script:handle,[ref]$client)) 'Current client bounds unavailable'
 return @([int]($client.Right-$client.Left),[int]($client.Bottom-$client.Top))
}
function Current-WorkArea {return ([System.Windows.Forms.Screen]::FromHandle($script:handle)).WorkingArea}
function Current-Placement($Rect,$WorkArea,$Client,[int]$Dpi) {
 Assert-Native ($Dpi -ge 72 -and $Dpi -le 480 -and $Client.Count -eq 2 -and $Client[0] -gt 0 -and $Client[1] -gt 0) 'Current DPI/client bounds refused'
 $frameWidth=$Rect.Width-$Client[0];$frameHeight=$Rect.Height-$Client[1]
 Assert-Native ($frameWidth -ge 0 -and $frameWidth -le 256 -and $frameHeight -ge 0 -and $frameHeight -le 256) 'Current window frame refused'
 $margin=[int][Math]::Ceiling(8*$Dpi/96.0)
 $minimum=@([int][Math]::Ceiling(560*$Dpi/96.0),[int][Math]::Ceiling(480*$Dpi/96.0))
 $width=[int][Math]::Min($Rect.Width,$WorkArea.Width-2*$margin)
 $height=[int][Math]::Min($Rect.Height,$WorkArea.Height-2*$margin)
 Assert-Native ($width-$frameWidth -ge $minimum[0] -and $height-$frameHeight -ge $minimum[1]) 'Current desktop cannot fit the minimum test viewport'
 $left=[int][Math]::Max($WorkArea.Left+$margin,[Math]::Min($Rect.Left,$WorkArea.Right-$margin-$width))
 $top=[int][Math]::Max($WorkArea.Top+$margin,[Math]::Min($Rect.Top,$WorkArea.Bottom-$margin-$height))
 return [ordered]@{target=@($left,$top,$width,$height);minimumClient=$minimum;frame=@($frameWidth,$frameHeight);margin=$margin}
}
function Fit-CurrentWindow {
 # This adapter alone may resize the disposable current scenario. Frozen layout
 # helpers still require the complete observed window to fit and never resize it.
 Select-CurrentForeground
 Assert-Native ((Entry-Handle) -eq [IntPtr]::Zero) 'Current viewport requires no owned modal'
 $rect=Window-Rect $script:handle
 $area=Current-WorkArea
 $dpi=[int][RewriteNative]::GetDpiForWindow($script:handle);$client=Current-ClientSize
 $receipt.currentWindow=[ordered]@{before=@($rect.Left,$rect.Top,$rect.Width,$rect.Height);clientBefore=$client;workArea=@($area.Left,$area.Top,$area.Width,$area.Height);dpi=$dpi;verified=$false}
 $plan=Current-Placement $rect $area $client $dpi
 $receipt.currentWindow.target=$plan.target;$receipt.currentWindow.minimumClient=$plan.minimumClient;$receipt.currentWindow.frame=$plan.frame;$receipt.currentWindow.margin=$plan.margin
 $target=$plan.target
 if((@($rect.Left,$rect.Top,$rect.Width,$rect.Height) -join ',') -ne ($target -join ',')) {
  # SWP_NOZORDER | SWP_NOACTIVATE. Resize only the verified owned main window.
  Assert-Native ([RewriteNative]::SetWindowPos($script:handle,[IntPtr]::Zero,$target[0],$target[1],$target[2],$target[3],0x14)) 'Current owned viewport placement failed'
 }
 Wait-Native {
  $actual=Window-Rect $script:handle
  return (@($actual.Left,$actual.Top,$actual.Width,$actual.Height) -join ',') -eq ($target -join ',')
 }
 $after=Window-Rect $script:handle;$actualClient=Current-ClientSize
 $receipt.currentWindow.after=@($after.Left,$after.Top,$after.Width,$after.Height);$receipt.currentWindow.clientAfter=$actualClient
 Assert-Native ($area.Contains($after) -and $actualClient[0] -ge $plan.minimumClient[0] -and $actualClient[1] -ge $plan.minimumClient[1]) 'Current observed viewport does not fit'
 Ensure-ObservableWindow
 $receipt.currentWindow.verified=$true;$receipt.checks.currentViewport=$true
}
function Recovery-ControlFacts {
 $retry=Button 'Retry loading profiles'
 return [ordered]@{found=($null -ne $retry);enabled=if($null -ne $retry){$retry.Current.IsEnabled}else{$null};offscreen=if($null -ne $retry){$retry.Current.IsOffscreen}else{$null};type=if($null -ne $retry){$retry.Current.ControlType.ProgrammaticName}else{$null}}
}
function Observe-CurrentReload {
 $receipt.reloadObservation=[ordered]@{statusMatched=$false;retry=$null;mutations=[ordered]@{}}
 # Keep the original shared 20-second observation bound while retaining each
 # subcondition independently; splitting the diagnostics must not double the wait.
 Wait-Step 'Current confirmed-save read-only reload' {
  $receipt.reloadObservation.statusMatched=Has-Text 'Profile saved; saved profiles could not be reloaded.'
  $receipt.reloadObservation.retry=Recovery-ControlFacts
  return $receipt.reloadObservation.statusMatched -and $receipt.reloadObservation.retry.found -and $receipt.reloadObservation.retry.enabled
 }
 $receipt.checks.reloadStatusObserved=$true
 $retry=Control 'Retry loading profiles';Focus-Control $retry
 $receipt.reloadObservation.retry=Recovery-ControlFacts
 Assert-Native (-not $retry.Current.IsOffscreen) 'Current Retry remains outside viewport'
 $receipt.checks.retryVisible=$true;$receipt.checks.retryEnabled=$true
 foreach($name in @('Save profile','Connect',('Replace credential'+[char]0x2026),'Remove credential')){
  $disabled=Has-ButtonState $name $false;$receipt.reloadObservation.mutations[$name]=$disabled
  Assert-Native $disabled ('Mutation control not disabled: '+$name)
 }
 $receipt.checks.mutationsDisabled=$true
}
function Close-CurrentSettings {
 $close=Button 'Close settings';$receipt.closeObservation=[ordered]@{settingsFound=($null -ne $close);settingsDismissed=$false}
 if($null -ne $close){
  Wait-Step 'Owned Settings close enabled' {Has-ButtonState 'Close settings' $true}
  Click-Control 'Close settings'
  Wait-Step 'Owned Settings modal dismissed' {$null -eq (Button 'Close settings')}
 }
 $receipt.closeObservation.settingsDismissed=$true;$receipt.checks.settingsDismissed=$true
}
function Close-CurrentOwned {
 # Ordinary close needs verified ownership/foreground, not an accepted screenshot.
 Cancel-OwnedEntry
 Select-CurrentForeground
 Assert-Native ((Entry-Handle) -eq [IntPtr]::Zero) 'Failure close still has an owned modal'
 Close-CurrentSettings
 Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Failure close lost foreground'
 $receipt.checks.closeForeground=$true
 [System.Windows.Forms.SendKeys]::SendWait('%{F4}');$receipt.checks.closeInput=$true
}
function Current-OwnerAbsent {
 try{$owner=[System.Diagnostics.Process]::GetProcessById($ProcessId);$owner.Dispose();return $false}
 catch [System.ArgumentException]{return $true}
}
function Finish-CurrentModal {
 try{Cancel-OwnedEntry}
 catch{
  # Normal close may finish before this independent final check. Only actual
  # process absence qualifies; access/ownership errors on a live PID still fail.
  if($Stage -ne 'cleanup-after-failure' -or -not (Current-OwnerAbsent)){throw}
  $receipt.cleanup.ownerExitedDuringClose=$true
 }
 $receipt.cleanup.modal=$true
}
$script:faultActive=$false
try{
 $names=@('Frozen-Definitions','Wait-Step','Entry-Handle','Assert-EntryOwner','Entry-Exists','Entry-Foreground','Entry-Control','Masked-FocusReady','Click-EntryControl','Click-MaskedField','Select-Entry','Cancel-OwnedEntry','Select-MainWindow','Control','Value','Field-TypeAllowed')
 foreach($definition in (Definitions (Join-Path $ProductRepo 'app/scripts/studio-setup-windows.ps1') $names -NativeType)){. ([scriptblock]::Create($definition))}
 foreach($definition in (Frozen-Definitions)){. ([scriptblock]::Create($definition))}
 Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class CurrentStudioWindow {
 [StructLayout(LayoutKind.Sequential)] public struct RECT {public int Left,Top,Right,Bottom;}
 [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr handle,out RECT rect);
}
'@
 [void][RewriteNative]::SetProcessDPIAware();$receipt.inputDesktop=Input-Desktop
 Assert-Native ($receipt.inputDesktop -eq 'Default' -and [Environment]::UserInteractive -and [Environment]::Is64BitProcess) 'Interactive Windows x64 required'
 $receipt.checks.interactiveDesktop=$true
 if($Stage -ne 'preflight'){
  $owned=Get-Process -Id $ProcessId
  Assert-Native ([IO.Path]::GetFullPath($owned.Path) -eq [IO.Path]::GetFullPath($Executable)) 'Owned executable/PID mismatch'
  $receipt.executableSHA256=[RewriteNative]::HashFile($Executable)
  Select-MainWindow -ObserveOnly
  if($Stage.StartsWith('entry-')){Public-Entry}
  elseif($Stage -eq 'cleanup-after-failure'){
   Close-CurrentOwned
  }else{
   Fit-CurrentWindow
   Assert-Native ((Entry-Handle) -eq [IntPtr]::Zero) 'Unexpected owned credential modal'
   if($Stage -eq 'observe-reload'){
    Observe-CurrentReload
   }elseif($Step -in @('preflight-cancelled','cancelled')){
    Wait-Step 'Native Cancel status observed' {Has-Text 'cancelled'};$receipt.checks.cancelStatus=$true
   }elseif($Step.StartsWith('get-')){
    Wait-Step 'Current connected status observed' {Has-Text 'Connected.'};$receipt.checks.connectedStatus=$true
   }elseif($Step -in @('alpha-saved','gamma-saved','beta-reloaded','reopened')){
    Wait-Step 'Current configured credential observed' {Has-Text 'Credential: configured'}
    $receipt.checks.configuredStatus=$true
    $model=Control 'Model ID';Assert-Native (Field-TypeAllowed 'Model ID' $model.Current.ControlType) 'Model control type changed'
    Focus-Control $model
    Assert-Native ((Value 'Model ID') -eq 'loomlight-synthetic-model') 'Nonsecret model readback changed'
    $receipt.checks.modelReadback=$true
   }elseif($Step -eq 'removed'){
    Wait-Step 'Current removed credential observed' {Has-Text 'Credential: missing'};$receipt.checks.removedStatus=$true
   }elseif($Step -ne 'complete'){throw 'Unlisted observation step'}
   $receipt.captures=@(Capture 'observed' (Window-Rect $script:handle));$receipt.checks.captureNonblank=$true
  }
 }
 $receipt.passed=$true
}catch{$receipt.error=$_.Exception.Message}
finally{
 if($Stage -eq 'observe-reload' -and -not $receipt.passed){try{$receipt.reloadFailureControl=Recovery-ControlFacts}catch{$receipt.reloadDiagnosticError=$_.Exception.GetType().Name}}
 try{Restore-Fault}catch{$receipt.cleanup.faultError=$_.Exception.Message;$receipt.passed=$false}
 if($ProcessId -gt 0){try{Finish-CurrentModal}catch{$receipt.cleanup.modalError=$_.Exception.Message;$receipt.passed=$false}}
 $receipt | ConvertTo-Json -Depth 24 | Out-File -FilePath (Join-Path $Output 'receipt.json') -Encoding utf8
}
if(-not $receipt.passed){exit 1}
