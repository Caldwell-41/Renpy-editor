import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('current_connection',Path(__file__).with_name('studio_connection_native.py'))
probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)


class CurrentConnectionTests(unittest.TestCase):
    def viewport(self):
        return dict(before=[0,9,1044,759],clientBefore=[1024,720],workArea=[0,0,1024,728],dpi=96,
                    target=[8,8,1008,712],after=[8,8,1008,712],clientAfter=[988,673],minimumClient=[560,480],frame=[20,39],margin=8,verified=True)

    def test_current_viewport_rejects_clipping_wrong_dpi_frame_placement_and_small_client(self):
        value=self.viewport();probe.validate_viewport(value)
        for field, changed in [('after',[0,9,1044,759]),('target',[0,0,1024,768]),('clientAfter',[559,480]),
                               ('dpi',0),('dpi',True),('frame',[0,0]),('minimumClient',[100,100]),('margin',0),
                               ('workArea',[0,0,500,400]),('clientBefore',[2000,720]),('verified',False)]:
            bad=copy.deepcopy(value);bad[field]=changed
            with self.subTest(field=field),self.assertRaises(ValueError):probe.validate_viewport(bad)
        with self.assertRaises(ValueError):probe.validate_viewport(None)
        scaled=dict(value,before=[0,13,1566,1138],clientBefore=[1536,1080],workArea=[0,0,1536,1092],dpi=144,
                    target=[12,12,1512,1068],after=[12,12,1512,1068],clientAfter=[1482,1010],minimumClient=[840,720],frame=[30,58],margin=12)
        probe.validate_viewport(scaled)

    def test_close_receipt_rejects_key_delivery_without_settings_dismissal(self):
        receipt=dict(contract=2,stage='cleanup-after-failure',step='failure',phase=2,passed=True,processId=42,inputDesktop='Default',executableSHA256='digest',
                     checks=dict(interactiveDesktop=True,ownedWindow=True,settingsDismissed=True,closeForeground=True,closeInput=True),cleanup=dict(modal=True,faultRestored=True))
        args=('cleanup-after-failure','failure',2,42,'digest',Path('.'))
        probe.validate_native(receipt,*args)
        for field in ['settingsDismissed','closeForeground','closeInput']:
            bad=copy.deepcopy(receipt);bad['checks'][field]=False
            with self.subTest(field=field),self.assertRaises(ValueError):probe.validate_native(bad,*args)
        del receipt['checks']['settingsDismissed']
        with self.assertRaises(ValueError):probe.validate_native(receipt,*args)

    def test_state_retention_keeps_exact_partial_json_and_requires_complete_snapshots(self):
        with tempfile.TemporaryDirectory(prefix='loomlight-studio-windows-connection-') as directory,tempfile.TemporaryDirectory() as evidence:
            root=Path(directory);out=Path(evidence);fixture=probe.legacy.FIXTURE.read_bytes()
            (root/'ai-profiles.json').write_bytes(fixture)
            (root/'.studio-windows-1-preflight-cancelled.json').write_bytes(fixture)
            (root/'.studio-windows-step.json').write_text('{"phase":"1","step":"preflight-cancelled"}')
            (root/'unselected-private-file').write_text('must not be retained')
            result=probe.retain_state(out,root,1,False);retained=out/result['directory']
            receipt=probe.read(retained/'retention.json')
            self.assertEqual((retained/'profile-store.json').read_bytes(),fixture)
            self.assertEqual(receipt['files']['snapshot-1-alpha-saved.json']['state'],'not-reached')
            self.assertEqual(receipt['files']['profile-store.json']['sha256'],probe.sha(root/'ai-profiles.json'))
            self.assertFalse((retained/'unselected-private-file').exists())
            self.assertFalse(any(p.name.startswith('.') for p in retained.iterdir()))
            with self.assertRaises(FileExistsError):probe.retain_state(out,root,1,False)
            with tempfile.TemporaryDirectory() as missing:
                with self.assertRaises(ValueError):probe.retain_state(Path(missing),root,1,True)
                self.assertFalse(probe.read(Path(missing)/'phase-1-state/retention.json')['passed'])
            for p in (1,2):
                for step in probe.SNAPSHOTS[p]:(root/f'.studio-windows-{p}-{step}.json').write_bytes(fixture)
            for phase in (1,2):
                with tempfile.TemporaryDirectory() as complete:self.assertTrue(probe.retain_state(Path(complete),root,phase,True)['passed'])
            (root/'ai-profiles.json').write_text('controlled invalid record')
            with tempfile.TemporaryDirectory() as invalid:
                with self.assertRaises(ValueError):probe.retain_state(Path(invalid),root,1,False)
                self.assertFalse((Path(invalid)/'phase-1-state/profile-store.json').exists())

    def test_owned_credential_audit_checks_only_saved_synthetic_references(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);alpha=probe.read(probe.legacy.FIXTURE)
            alpha['profiles'][0]['credential']=dict(credentialId='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')
            gamma=copy.deepcopy(alpha);gamma['profiles'][1]['credential']=dict(credentialId='ffffffff-ffff-4fff-8fff-ffffffffffff')
            beta=copy.deepcopy(gamma);beta['profiles'][0]['credential']=dict(credentialId='99999999-9999-4999-8999-999999999999')
            for p,step,value in [(1,'alpha-saved',alpha),(1,'gamma-saved',gamma),(2,'beta-saved',beta)]:probe.write(root/f'.studio-windows-{p}-{step}.json',value)
            for phase,present,count in [(1,True,2),(2,False,3)]:
                with patch.object(probe.legacy,'native_present',return_value=present) as inspect:
                    result=probe.audit_owned_credentials(root,phase)
                    self.assertEqual(len(result['checked']),count);self.assertEqual(inspect.call_count,count)
                    self.assertTrue(all(call.args[0]['profileId'] in (probe.legacy.A,probe.legacy.B) for call in inspect.call_args_list))
                with patch.object(probe.legacy,'native_present',return_value=not present),self.assertRaises(ValueError):probe.audit_owned_credentials(root,phase)

    def test_observation_failure_retains_original_error_and_independent_close_state(self):
        class Process:
            pid=42
            returncode=None
            def poll(self):return self.returncode
            def wait(self,timeout):
                if self.returncode is None:raise subprocess.TimeoutExpired('controlled app',timeout)
                return self.returncode
        for close_fails,retention_fails,listener_fails in [(False,False,False),(True,False,False),(False,True,False),(False,False,True)]:
            with self.subTest(close_fails=close_fails,retention_fails=retention_fails,listener_fails=listener_fails),tempfile.TemporaryDirectory(prefix='loomlight-studio-windows-connection-') as directory,tempfile.TemporaryDirectory() as evidence:
                root=Path(directory);out=Path(evidence);(root/'ai-profiles.json').write_bytes(probe.legacy.FIXTURE.read_bytes())
                probe.write(root/'.studio-windows-step.json',dict(phase='1',step='preflight-cancelled'))
                process=Process();inputs={};package=dict(inputs=inputs,sha256='digest')
                def native(output,exe,stage,*args):
                    if stage=='observe':raise ValueError('original observation rejection')
                    self.assertEqual(stage,'cleanup-after-failure')
                    if close_fails:raise ValueError('independent close rejection')
                    process.returncode=0
                    return dict(passed=True,checks=dict(closeInput=True,closeForeground=True))
                def execute(command,**kwargs):
                    if command[0]=='taskkill':process.returncode=-1
                    return subprocess.CompletedProcess(command,0,stdout='')
                with patch.object(probe,'package_inputs',return_value=inputs),patch.object(probe,'sha',return_value='digest'),patch.object(probe.subprocess,'run',side_effect=execute),patch.object(probe.subprocess,'Popen',return_value=process),patch.object(probe,'native',side_effect=native),patch.object(probe.legacy,'pid_absent',return_value=True),patch.object(probe.http.server,'HTTPServer'),patch.object(probe.threading,'Thread') as thread:
                    thread.return_value.is_alive.return_value=listener_fails
                    if retention_fails:
                        with patch.object(probe,'retain_state',side_effect=ValueError('independent retention rejection')),self.assertRaises(ValueError):probe.launch(out,1,root,package)
                    else:
                        with self.assertRaises(ValueError):probe.launch(out,1,root,package)
                result=probe.read(out/'phase-1.json')
                self.assertIn('original observation rejection',result['failure'])
                self.assertEqual(bool(result['cleanup'].get('forcedExit')),close_fails)
                self.assertEqual('normalCloseError' in result['cleanup'],close_fails)
                self.assertEqual(result['stateRetention']['passed'],not retention_fails)
                self.assertTrue(result['cleanup']['processStopped'])
                self.assertEqual(result['cleanup']['listenerStopped'],not listener_fails)
                self.assertEqual(result['cleanup']['ownedCredentials']['state'],'unproved-retained')

    @unittest.skipUnless(os.name=='nt','Actual current native driver regression requires Windows PowerShell')
    def test_actual_current_driver_fits_small_desktop_and_closes_without_geometry_gate(self):
        driver=Path(__file__).with_name('studio-connection-windows.ps1').resolve()
        script=r'''
$ErrorActionPreference='Stop';Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Drawing,System.Windows.Forms
Add-Type @'
using System;
public static class RewriteNative {
 public static int X,Y,Width,Height,Moves; public static bool AllowMove=true,Focused=true;
 public static uint GetDpiForWindow(IntPtr h){return 96;}
 public static bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int w,int height,uint flags){
  if(h!=new IntPtr(42)||flags!=0x14)throw new Exception("Ownership/flags");
  Moves++;if(!AllowMove)return false;X=x;Y=y;Width=w;Height=height;return true;
 }
 public static bool SetForegroundWindow(IntPtr h){return true;}
 public static IntPtr GetForegroundWindow(){return new IntPtr(Focused?42:99);}
}
'@
$tokens=$null;$errors=$null;$ast=[System.Management.Automation.Language.Parser]::ParseFile('__DRIVER__',[ref]$tokens,[ref]$errors)
if($errors.Count){throw ($errors|Out-String)}
foreach($name in @('Current-Placement','Fit-CurrentWindow','Select-CurrentForeground','Close-CurrentSettings','Close-CurrentOwned','Current-OwnerAbsent','Finish-CurrentModal','Recovery-ControlFacts','Observe-CurrentReload')){
 $f=@($ast.FindAll({param($n)$n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq $name},$true))
 if($f.Count -ne 1){throw 'Unique current function required'};. ([scriptblock]::Create($f[0].Extent.Text))
}
function Assert-Native([bool]$Condition,[string]$Message){if(-not $Condition){throw $Message}}
function Wait-Native([scriptblock]$Check){if(-not (& $Check)){throw 'Controlled bounded wait failed'}}
function Select-MainWindow{param([switch]$ObserveOnly);if(-not $ObserveOnly){throw 'Size-dependent selection invoked'};$script:handle=[IntPtr]42}
function Entry-Handle{return [IntPtr]::Zero}
function Current-WorkArea{return [System.Drawing.Rectangle]::new(0,0,1024,728)}
function Window-Rect($Handle){return [System.Drawing.Rectangle]::new([RewriteNative]::X,[RewriteNative]::Y,[RewriteNative]::Width,[RewriteNative]::Height)}
function Current-ClientSize{return @(([RewriteNative]::Width-20),([RewriteNative]::Height-39))}
function Ensure-ObservableWindow{$r=Window-Rect $script:handle;Assert-Native ((Current-WorkArea).Contains($r)) 'Still clipped'}
function Cancel-OwnedEntry{$script:cancelled=$true}
function Button([string]$Name){if($Name -ne 'Close settings'){throw 'Unexpected control'};if($script:settingsOpen){return @{Current=@{IsEnabled=$true}}};return $null}
function Has-ButtonState([string]$Name,[bool]$Enabled){return $script:settingsOpen -and $Enabled}
function Wait-Step([string]$Name,[scriptblock]$Check){Wait-Native $Check}
function Click-Control([string]$Name){if($Name -ne 'Close settings' -or -not $script:settingsOpen){throw 'Wrong modal action'};$script:settingsOpen=$false}
function Reset-Test{
 [RewriteNative]::X=0;[RewriteNative]::Y=9;[RewriteNative]::Width=1044;[RewriteNative]::Height=759;[RewriteNative]::Moves=0;[RewriteNative]::AllowMove=$true;[RewriteNative]::Focused=$true
 $script:receipt=@{checks=@{}};$script:cancelled=$false;$script:settingsOpen=$true
}
Reset-Test;Fit-CurrentWindow
Assert-Native (($receipt.currentWindow.after -join ',') -eq '8,8,1008,712' -and $receipt.currentWindow.verified -and [RewriteNative]::Moves -eq 1) 'Exact small-desktop fit missing'
Fit-CurrentWindow;Assert-Native ([RewriteNative]::Moves -eq 1) 'Already fitting viewport resized again'
$plan=Current-Placement ([System.Drawing.Rectangle]::new(0,13,1566,1138)) ([System.Drawing.Rectangle]::new(0,0,1536,1092)) @(1536,1080) 144
Assert-Native (($plan.target -join ',') -eq '12,12,1512,1068' -and ($plan.minimumClient -join ',') -eq '840,720') 'DPI/frame plan changed'
foreach($failure in @('small','move','focus','frame')){
 Reset-Test;$caught=$false
 try{
  if($failure -eq 'small'){[void](Current-Placement ([System.Drawing.Rectangle]::new(0,0,1044,759)) ([System.Drawing.Rectangle]::new(0,0,500,400)) @(1024,720) 96)}
  elseif($failure -eq 'frame'){[void](Current-Placement ([System.Drawing.Rectangle]::new(0,0,1044,759)) ([System.Drawing.Rectangle]::new(0,0,1024,728)) @(2000,720) 96)}
  else{if($failure -eq 'move'){[RewriteNative]::AllowMove=$false}else{[RewriteNative]::Focused=$false};Fit-CurrentWindow}
 }catch{$caught=$true}
 Assert-Native $caught ('Invalid viewport admitted: '+$failure)
}
# Extracted actual close function runs on oversized geometry; intercept only OS key
# delivery so this fixture never closes a real window or uses another process.
$close=$ast.Find({param($n)$n -is [System.Management.Automation.Language.FunctionDefinitionAst] -and $n.Name -eq 'Close-CurrentOwned'},$true).Extent.Text
if(-not $close.Contains("[System.Windows.Forms.SendKeys]::SendWait('%{F4}')")){throw 'Expected physical close primitive changed'}
$close=$close.Replace("[System.Windows.Forms.SendKeys]::SendWait('%{F4}')",'if($script:settingsOpen){throw "Settings still blocks app exit"};$script:sentClose=$true')
. ([scriptblock]::Create($close))
Reset-Test;$script:sentClose=$false;Close-CurrentOwned
Assert-Native ($script:cancelled -and $script:sentClose -and $receipt.checks.settingsDismissed -and -not $script:settingsOpen -and $receipt.checks.closeForeground -and [RewriteNative]::Moves -eq 0) 'Owned close omitted Settings or depends on accepted geometry'
Reset-Test;[RewriteNative]::Focused=$false;$script:sentClose=$false;$caught=$false
try{Close-CurrentOwned}catch{$caught=$true}
Assert-Native ($caught -and -not $script:sentClose) 'Unowned foreground received close'
$script:Stage='cleanup-after-failure';$script:ProcessId=$PID
$script:receipt=@{cleanup=@{}}
Assert-Native (-not (Current-OwnerAbsent)) 'Live process accepted as absent'
$gone=Start-Process cmd.exe -ArgumentList '/c exit 0' -NoNewWindow -Wait -PassThru
$script:ProcessId=$gone.Id
function Cancel-OwnedEntry{throw 'Controlled already-exited owner'}
Finish-CurrentModal
Assert-Native ($receipt.cleanup.modal -and $receipt.cleanup.ownerExitedDuringClose) 'Ordinary close race lost modal absence proof'
$script:ProcessId=$PID;$caught=$false
try{Finish-CurrentModal}catch{$caught=$true}
Assert-Native $caught 'Live owner cleanup error was hidden'
function Has-Text([string]$Text){return $script:statusMatched}
function Button([string]$Name){if($Name -ne 'Retry loading profiles'){throw 'Unexpected diagnostic control'};if($script:retryFound){return @{Current=@{IsEnabled=$true;IsOffscreen=$false;ControlType=@{ProgrammaticName='ControlType.Button'}}}};return $null}
function Control([string]$Name){return Button $Name}
function Focus-Control($Control){$script:retryFocused=$true}
function Has-ButtonState([string]$Name,[bool]$Enabled){return -not $Enabled}
foreach($pair in @(@($false,$true),@($true,$false),@($true,$true))){
 $script:statusMatched=$pair[0];$script:retryFound=$pair[1];$script:retryFocused=$false;$script:receipt=@{checks=@{}};$caught=$false
 try{Observe-CurrentReload}catch{$caught=$true}
 Assert-Native ($caught -eq (-not ($pair[0] -and $pair[1]))) 'Recovery accepted a missing status/control'
 Assert-Native ($receipt.reloadObservation.statusMatched -eq $pair[0] -and $receipt.reloadObservation.retry.found -eq $pair[1]) 'Recovery subcondition diagnostics missing'
 if(-not $caught){Assert-Native ($script:retryFocused -and $receipt.checks.retryVisible -and $receipt.checks.mutationsDisabled) 'Recovery focus/control proof missing'}
}
Write-Output 'PASS: actual current fit/close functions reject invalid geometry and preserve close ownership'
'''.replace('__DRIVER__',driver.as_posix().replace("'","''"))
        result=subprocess.run(['powershell.exe','-NoProfile','-NonInteractive','-Command',script],capture_output=True,text=True,timeout=45)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

    def report(self,phase):
        details=dict(passed=True,contract=2,phase=phase,stage='complete',checks=list(probe.CHECKS[phase]),
                     clientTimings=[dict(actionStarted=1,requestStarted=2,requestEnded=3,completed=4),dict(actionStarted=5,requestStarted=6,requestEnded=7,completed=8)])
        if phase==2:details['reloadResponse']=dict(probe.RELOAD_RESPONSE)
        return dict(evidence='runtime-ui-packaged',case='studio-settings',passed=True,cleanupComplete=True,details=details)

    def test_current_report_requires_complete_case_contract_requests_timings_and_cleanup(self):
        for phase in (1,2):
            report=self.report(phase);requests=[dict(sequence=n+1,label=label,accepted=True) for n,label in enumerate(probe.SCHEDULE[phase])]
            probe.validate_report([report],phase,requests,0)
            for field,value in [('contract',1),('phase',3),('stage','open'),('passed',False),('checks',[]),('checks',report['details']['checks']*2),('clientTimings',[])]:
                bad=copy.deepcopy(report);bad['details'][field]=value
                with self.subTest(phase=phase,field=field),self.assertRaises(ValueError):probe.validate_report([bad],phase,requests,0)
            for field,value in [('case','old'),('passed',False),('cleanupComplete',False),('evidence','mock')]:
                bad=copy.deepcopy(report);bad[field]=value
                with self.assertRaises(ValueError):probe.validate_report([bad],phase,requests,0)
            for reports in ([],[report,report]):
                with self.assertRaises(ValueError):probe.validate_report(reports,phase,requests,0)
            for changed in (requests[:-1],requests+requests[:1],list(reversed(requests))):
                with self.assertRaises(ValueError):probe.validate_report([report],phase,changed,0)
            with self.assertRaises(ValueError):probe.validate_report([report],phase,requests,1)
            if phase==2:
                del report['details']['reloadResponse']
                with self.assertRaises(ValueError):probe.validate_report([report],phase,requests,0)

    def test_current_publication_requires_exact_settings_revision_ownership_and_unrelated_profiles(self):
        before=probe.read(probe.legacy.FIXTURE);after=copy.deepcopy(before);after['revision']+=2
        target=after['profiles'][0];target.update(revision=2,credential=dict(credentialId='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',origin='http://127.0.0.1:46082',revision=1))
        target['settings'].update(contextCeiling=4096,thinking=True,temperature=1.0,topP=.95,modelLoad=dict(parallel=1,gpuMemoryMode='manual',fit='off'))
        probe.validate_saved(before,after,probe.legacy.A)
        for key,value in [('revision',99),('cleanup',[]),('developmentGenerations',[])]:
            bad=copy.deepcopy(after);bad[key]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        for field,value in [('thinking',False),('contextCeiling',8192),('model','other')]:
            bad=copy.deepcopy(after);bad['profiles'][0]['settings'][field]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        for field,value in [('service','app.loomlight'),('storage',{'kind':'developmentFile'}),('revision',2),('credentialId','not-a-uuid')]:
            bad=copy.deepcopy(after);bad['profiles'][0]['credential'][field]=value
            with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)
        bad=copy.deepcopy(after);bad['profiles'][1]['settings']['label']='changed'
        with self.assertRaises(ValueError):probe.validate_saved(before,bad,probe.legacy.A)

    def test_bad_host_candidate_and_ordinal_refuse_before_build_or_output(self):
        with tempfile.TemporaryDirectory() as directory:
            out=Path(directory)/'attempt'
            with patch.object(probe.platform,'system',return_value='Darwin'),patch.object(probe.subprocess,'run') as dispatch:
                with self.assertRaises(ValueError):probe.build(out,'candidate',1)
                dispatch.assert_not_called();self.assertFalse(out.exists())
            with patch.object(probe.platform,'system',return_value='Windows'),patch.object(probe.platform,'machine',return_value='AMD64'),patch.dict(probe.os.environ,{'GITHUB_RUN_ATTEMPT':'2'}):
                with self.assertRaises(ValueError):probe.build(out,'candidate',1)
                self.assertFalse(out.exists())
            with patch.object(probe.platform,'system',return_value='Windows'),patch.object(probe.platform,'machine',return_value='AMD64'),patch.dict(probe.os.environ,{'GITHUB_RUN_ATTEMPT':'1'}),patch.object(probe.subprocess,'check_output') as identity:
                with self.assertRaises(ValueError):probe.build(out,'candidate',4)
                identity.assert_not_called();self.assertFalse(out.exists())

    def test_failed_build_retains_exclusive_attempt_and_never_creates_positive_package(self):
        with tempfile.TemporaryDirectory() as directory:
            out=Path(directory)/'attempt'
            with patch.object(probe.platform,'system',return_value='Windows'),patch.object(probe.platform,'machine',return_value='AMD64'),patch.dict(probe.os.environ,{'GITHUB_RUN_ATTEMPT':'1'}),patch.object(probe.subprocess,'check_output',return_value='candidate\n'),patch.object(probe.legacy,'configure_npm_hook'),patch.object(probe,'native'),patch.object(probe.subprocess,'Popen',side_effect=OSError('controlled spawn failure')):
                with self.assertRaises(OSError):probe.build(out,'candidate',1)
                self.assertTrue((out/'build-attempt.json').exists())
                self.assertFalse(probe.read(out/'build-result.json')['passed'])
                self.assertFalse((out/'package.json').exists())
                with self.assertRaises(FileExistsError):probe.build(out,'candidate',1)

    def test_native_receipt_rejects_unowned_focus_children_failed_retry_or_cleanup(self):
        receipt=dict(contract=2,stage='entry-alpha',step='alpha-entry',phase=1,passed=True,processId=42,inputDesktop='Default',executableSHA256='digest',
            checks=dict(interactiveDesktop=True,ownedWindow=True,osMouseInput=True,osKeyboardInput=True,failedEntryRetained=True,retainedInputRetry=True,nativeCredentialEntry=True),
            cleanup=dict(modal=True,faultRestored=True),dialog=dict(processId=42,handle=9,owner=8,**{'class':'#32770'},owned=True,foregroundConfirmed=True,maskedFieldFocusConfirmed=True,focusedFieldHandle=110,clickedChildIds=[100,1,1],
                children=[dict(id=n,handle=110 if n==100 else 20+n,parent=9,processId=42,count=1,matched=True,visible=True,enabled=True,kind='Edit' if n==100 else 'Button',password=n==100,style=0x40000020 if n==100 else 0x40000000) for n in (100,1,2)]))
        args=('entry-alpha','alpha-entry',1,42,'digest',Path('.'))
        probe.validate_native(receipt,*args)
        for field,value in [('owned',False),('foregroundConfirmed',False),('maskedFieldFocusConfirmed',False),('children',[])]:
            bad=copy.deepcopy(receipt);bad['dialog'][field]=value
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field in receipt['checks']:
            bad=copy.deepcopy(receipt);bad['checks'][field]=False
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field in receipt['cleanup']:
            bad=copy.deepcopy(receipt);bad['cleanup'][field]=False
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)
        for field,value in [('kind','Text'),('password',False),('style',0),('parent',99),('handle',0)]:
            bad=copy.deepcopy(receipt);bad['dialog']['children'][0][field]=value
            with self.assertRaises(ValueError):probe.validate_native(bad,*args)


if __name__=='__main__':unittest.main()
