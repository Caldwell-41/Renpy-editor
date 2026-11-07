"""Explicit Windows desktop fixture; ordinary offline discovery must not run it."""
import os
from pathlib import Path
import subprocess
import unittest


class NativeDialogChecks(unittest.TestCase):
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


if __name__ == '__main__':
    if os.name != 'nt':
        raise SystemExit('This check requires an interactive Windows desktop.')
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(NativeDialogChecks)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    raise SystemExit(0 if result.testsRun == 1 and not result.skipped and result.wasSuccessful() else 1)
