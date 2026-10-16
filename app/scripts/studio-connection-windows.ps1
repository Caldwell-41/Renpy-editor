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
$script:faultActive=$false
try{
 $names=@('Frozen-Definitions','Wait-Step','Entry-Handle','Assert-EntryOwner','Entry-Exists','Entry-Foreground','Entry-Control','Masked-FocusReady','Click-EntryControl','Click-MaskedField','Select-Entry','Cancel-OwnedEntry','Select-MainWindow','Control','Value','Field-TypeAllowed')
 foreach($definition in (Definitions (Join-Path $ProductRepo 'app/scripts/studio-setup-windows.ps1') $names -NativeType)){. ([scriptblock]::Create($definition))}
 foreach($definition in (Frozen-Definitions)){. ([scriptblock]::Create($definition))}
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
   Cancel-OwnedEntry;Select-MainWindow
   Assert-Native ([RewriteNative]::GetForegroundWindow() -eq $script:handle) 'Failure close lost foreground'
   [System.Windows.Forms.SendKeys]::SendWait('%{F4}');$receipt.checks.closeInput=$true
  }else{
   Select-MainWindow
   Assert-Native ((Entry-Handle) -eq [IntPtr]::Zero) 'Unexpected owned credential modal'
   if($Stage -eq 'observe-reload'){
    Wait-Step 'Current confirmed-save read-only reload' {(Has-Text 'Profile saved; saved profiles could not be reloaded.') -and (Has-ButtonState 'Retry loading profiles' $true)}
    foreach($name in @('Save profile','Connect',('Replace credential'+[char]0x2026),'Remove credential')){Assert-Native (Has-ButtonState $name $false) ('Mutation control not disabled: '+$name)}
    $receipt.checks.mutationsDisabled=$true;$receipt.checks.retryEnabled=$true
   }elseif($Step -in @('preflight-cancelled','cancelled')){
    Wait-Step 'Native Cancel status observed' {Has-Text 'cancelled'};$receipt.checks.cancelStatus=$true
   }elseif($Step.StartsWith('get-')){
    Wait-Step 'Current connected status observed' {Has-Text 'Connected.'};$receipt.checks.connectedStatus=$true
   }elseif($Step -in @('alpha-saved','gamma-saved','beta-reloaded','reopened')){
    Wait-Step 'Current configured credential observed' {Has-Text 'Credential: configured'}
    $receipt.checks.configuredStatus=$true
    $model=Control 'Model ID';Assert-Native (Field-TypeAllowed 'Model ID' $model.Current.ControlType) 'Model control type changed'
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
 try{Restore-Fault}catch{$receipt.cleanup.faultError=$_.Exception.Message;$receipt.passed=$false}
 if($ProcessId -gt 0){try{Cancel-OwnedEntry;$receipt.cleanup.modal=$true}catch{$receipt.cleanup.modalError=$_.Exception.Message;$receipt.passed=$false}}
 $receipt | ConvertTo-Json -Depth 24 | Out-File -FilePath (Join-Path $Output 'receipt.json') -Encoding utf8
}
if(-not $receipt.passed){exit 1}
