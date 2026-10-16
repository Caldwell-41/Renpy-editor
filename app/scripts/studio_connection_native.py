"""Explicit current Windows connection qualification; legacy ordinals stay frozen."""
import argparse
from collections import Counter
import copy
import hashlib
import hmac
import http.server
import importlib.util
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tempfile
import threading
import time
import uuid

APP = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('legacy_windows_credentials', APP / 'scripts/windows-studio-credentials.py')
legacy = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(legacy)
SCHEDULE = {1: ['alpha', 'gamma', 'alpha', 'alpha'], 2: ['alpha', 'beta', 'beta']}
OBSERVATIONS = {1: ['preflight-cancelled', 'alpha-saved', 'gamma-saved', 'cancelled', 'get-1-complete', 'get-2-complete', 'complete'],
                2: ['reopened', 'get-1-complete', 'beta-reloaded', 'get-2-complete', 'removed', 'complete']}
ENTRIES = {1: {'preflight-cancel':'entry-preflight', 'alpha-entry':'entry-alpha', 'gamma-entry':'entry-gamma', 'cancel-entry':'entry-cancel'},
           2: {'beta-entry':'entry-beta'}}
RELOAD_RESPONSE = dict(saved=True, profileId=legacy.A, cleanupPending=True)
CHECKS = {1: ['Fixed Windows phase selected', 'Shared v2 profiles and foreign cleanup retained', 'Initial fixture has no native keys',
              'Early native Cancel preserves complete initial snapshot', 'Retained-field Retry saved A while foreign cleanup remained pending',
              'Failed native entry then Cancel preserved complete redacted snapshot', 'WebView contains no secret field']
             + ['Native draft key leaves saved profiles unchanged'] * 2,
          2: ['Fixed Windows phase selected', 'Shared v2 profiles and foreign cleanup retained',
              'Full process reopen reused both remembered keys without discovery', 'Replacement preserved B and retired only owned A',
              'Removal disabled A and preserved B', 'All Windows keys/profiles removed; foreign owned cleanup retained', 'WebView contains no secret field',
              'Native draft key leaves saved profiles unchanged',
              'Confirmed publication exposes a read-only reload after snapshot failure'] + legacy.RELOAD_CHECKS}
for phase in CHECKS:
    CHECKS[phase] += ['Explicit authenticated discovery completed in this action', 'Discovery did not persist profile changes'] * len(SCHEDULE[phase])


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write(path, value):
    with Path(path).open('x', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2); stream.write('\n')


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_report(reports, phase, requests, code):
    if phase not in SCHEDULE or len(reports) != 1:
        raise ValueError('Exactly one current phase report required')
    report = reports[0]; details = report.get('details', {})
    if (code != 0 or report.get('evidence') != 'runtime-ui-packaged' or report.get('case') != 'studio-settings'
            or report.get('passed') is not True or report.get('cleanupComplete') is not True
            or details.get('passed') is not True or details.get('contract') != 2 or details.get('phase') != phase
            or details.get('stage') != 'complete' or Counter(details.get('checks', [])) != Counter(CHECKS[phase])
            or requests != [dict(sequence=n+1, label=label, accepted=True) for n, label in enumerate(SCHEDULE[phase])]):
        raise ValueError('Current connection report, assertions, cleanup or request order refused')
    if phase == 2 and details.get('reloadResponse') != RELOAD_RESPONSE:
        raise ValueError('Current confirmed Save/read-only reload response missing')
    legacy.validate_client_timings(report)


def validate_saved(before, after, profile_id):
    old = next(p for p in before['profiles'] if p['profileId'] == profile_id)
    actual = next(p for p in after['profiles'] if p['profileId'] == profile_id)
    credential = actual.get('credential')
    if (not isinstance(credential, dict) or set(credential) - {'credentialId','origin','revision','service'}
            or credential.get('service', 'app.loomlight.desktop.ai.v1') != 'app.loomlight.desktop.ai.v1'
            or credential.get('origin') != 'http://127.0.0.1:46082'
            or credential.get('revision') != (old['credential']['revision'] + 1 if old['credential'] else 1)):
        raise ValueError('Current Windows native reference refused')
    identifier = uuid.UUID(credential['credentialId'])
    if identifier.version != 4 or str(identifier) != credential['credentialId'] or credential == old['credential']:
        raise ValueError('Fresh owned native identity missing')
    if old['credential'] and old['credential']['credentialId'] == credential['credentialId']:
        raise ValueError('Retired identity reused')
    existing = [p.get('credential') for p in before['profiles']] + [c['credential'] for c in before['cleanup']]
    if any(c and c['credentialId'] == credential['credentialId'] for c in existing):
        raise ValueError('Native identity collides with a known reference')
    expected = copy.deepcopy(before)
    expected['revision'] += 3 if old['credential'] else 2
    target = next(p for p in expected['profiles'] if p['profileId'] == profile_id)
    target.update(credential=credential, revision=old['revision']+1, disabled=False)
    target['settings'].update(contextCeiling=target['settings']['contextBudget'], thinking=True,
                              temperature=1.0, topP=0.95, modelLoad=dict(parallel=1,gpuMemoryMode='manual',fit='off'))
    if after != expected:
        raise ValueError('Current complete connection publication differs')


def validate_snapshots(root, phase):
    snap = lambda name: read(root / f'.studio-windows-{phase}-{name}.json')
    if phase == 1:
        initial = read(legacy.FIXTURE)
        if snap('preflight-cancelled') != initial: raise ValueError('Early Cancel mutated fixture')
        alpha, gamma = snap('alpha-saved'), snap('gamma-saved')
        validate_saved(initial, alpha, legacy.A); validate_saved(alpha, gamma, legacy.B)
        if not gamma == snap('cancelled') == snap('complete') == read(root/'ai-profiles.json'):
            raise ValueError('Cancel, discovery or phase exit changed saved profiles')
    else:
        before = read(root/'.studio-windows-1-complete.json'); beta = snap('beta-saved')
        if snap('reopened') != before: raise ValueError('Reopen changed saved profiles')
        validate_saved(before, beta, legacy.A)
        if not beta == snap('beta-reload-required') == snap('beta-reloaded'):
            raise ValueError('Read-only retry changed published profiles')
        expected = copy.deepcopy(beta); expected['revision'] += 2
        expected['profiles'][0].update(credential=None,disabled=True,revision=expected['profiles'][0]['revision']+1)
        if snap('removed') != expected: raise ValueError('Owned removal changed unrelated state')
        legacy.validate_removed(beta, snap('complete'))
        if snap('complete') != read(root/'ai-profiles.json'): raise ValueError('Final snapshot changed')


def validate_native(receipt, stage, step, phase, pid, executable_hash, directory):
    checks = receipt.get('checks', {})
    if (receipt.get('contract') != 2 or receipt.get('passed') is not True or receipt.get('stage') != stage
            or receipt.get('step') != step or receipt.get('phase') != phase or receipt.get('processId') != pid
            or receipt.get('inputDesktop') != 'Default' or checks.get('interactiveDesktop') is not True):
        raise ValueError('Current native stage identity refused')
    if stage == 'preflight': return
    if receipt.get('executableSHA256') != executable_hash or checks.get('ownedWindow') is not True:
        raise ValueError('Current native process ownership missing')
    if receipt.get('cleanup', {}).get('modal') is not True or receipt['cleanup'].get('faultRestored') is not True:
        raise ValueError('Independent modal/fault cleanup unproved')
    if stage.startswith('entry-'):
        dialog = receipt.get('dialog', {})
        if (dialog.get('processId') != pid or dialog.get('class') != '#32770'
                or not all(dialog.get(k) is True for k in ('owned','foregroundConfirmed','maskedFieldFocusConfirmed'))
                or sorted(c.get('id') for c in dialog.get('children', [])) != [1,2,100]):
            raise ValueError('Current secure native children/focus missing')
        if not isinstance(dialog.get('owner'), int) or dialog['owner'] <= 0 or not isinstance(dialog.get('handle'), int) or dialog['handle'] <= 0 or dialog['handle'] == dialog['owner']:
            raise ValueError('Unique owned dialog handle missing')
        for child in dialog['children']:
            if (child.get('parent') != dialog.get('handle') or child.get('processId') != pid
                    or child.get('count') != 1 or not all(child.get(k) is True for k in ('matched','visible','enabled'))):
                raise ValueError('Current native child ownership refused')
            style = child.get('style', 0)
            if not isinstance(style, int) or not style & 0x40000000 or not isinstance(child.get('handle'), int) or child['handle'] <= 0:
                raise ValueError('Typed child window style/handle missing')
            if child['id'] == 100:
                if child.get('kind') != 'Edit' or child.get('password') is not True or not style & 0x20 or style & 0x800 or dialog.get('focusedFieldHandle') != child['handle']:
                    raise ValueError('Verified masked edit/focus missing')
            elif child.get('kind') != 'Button' or style & 15 > 1:
                raise ValueError('Typed push button missing')
        clicks = {'entry-preflight':[100,2], 'entry-alpha':[100,1,1], 'entry-gamma':[100,1], 'entry-beta':[100,1], 'entry-cancel':[100,1,2]}
        if dialog.get('clickedChildIds') != clicks[stage]:
            raise ValueError('Exact physical child actions missing')
        required = {'entry-preflight':['earlyCancel'], 'entry-alpha':['failedEntryRetained','retainedInputRetry','nativeCredentialEntry','osKeyboardInput'],
                    'entry-gamma':['nativeCredentialEntry','osKeyboardInput'], 'entry-beta':['nativeCredentialEntry','osKeyboardInput'],
                    'entry-cancel':['failedEntryRetained','failedEntryCancel','osKeyboardInput']}[stage]
        if not all(checks.get(k) is True for k in ['osMouseInput', *required]):
            raise ValueError('Current physical entry/retry/Cancel evidence missing')
    elif stage in ('observe','observe-reload'):
        if stage == 'observe-reload' and not all(checks.get(k) is True for k in ('mutationsDisabled','retryEnabled')):
            raise ValueError('Native read-only reload controls missing')
        required = ('cancelStatus' if step in ('preflight-cancelled','cancelled') else 'connectedStatus' if step.startswith('get-')
                    else 'configuredStatus' if step in ('alpha-saved','gamma-saved','beta-reloaded','reopened') else 'removedStatus' if step=='removed' else None)
        if required and checks.get(required) is not True: raise ValueError('Required native status missing')
        if required=='configuredStatus' and checks.get('modelReadback') is not True: raise ValueError('Model readback missing')
        if len(receipt.get('captures', [])) != 1: raise ValueError('Exact native capture missing')
        capture = receipt['captures'][0]
        if capture.get('file') != 'observed.png': raise ValueError('Unexpected native capture path')
        spec=importlib.util.spec_from_file_location('native_capture', APP/'scripts/studio-setup-native.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        module.validate_capture(directory/'observed.png',capture)


def native(output, executable, stage, phase=0, pid=0, root=None, step=''):
    directory = output / 'native' / f'{phase}-{stage}-{step or "action"}'
    directory.parent.mkdir(parents=True, exist_ok=True)
    command = ['powershell.exe','-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',str(APP/'scripts/studio-connection-windows.ps1'),
               '-Stage',stage,'-Output',str(directory),'-ProductRepo',str(APP.parent),'-Executable',str(executable),
               '-ProcessId',str(pid),'-Phase',str(phase),'-Step',step]
    if root is not None: command += ['-Root',str(root)]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired as error:
        directory.mkdir(parents=True, exist_ok=True)
        decode = lambda value: value.decode('utf-8', errors='replace') if isinstance(value, bytes) else value or ''
        (directory/'driver.log').write_text(decode(error.stdout)+decode(error.stderr),encoding='utf-8')
        write(directory/'timeout.json',dict(passed=False,stage=stage,deadlineSeconds=120))
        raise ValueError('Native stage timed out; partial log and fixture retained') from error
    directory.mkdir(parents=True, exist_ok=True)
    (directory/'driver.log').write_text(result.stdout+result.stderr,encoding='utf-8')
    if result.returncode: raise ValueError('Native stage failed: '+stage)
    receipt = read(directory/'receipt.json')
    validate_native(receipt,stage,step,phase,pid,sha(executable) if pid else None,directory)
    return receipt


def package_inputs():
    return dict(sources=legacy.source_inputs(),dist=legacy.tree_inputs(APP/'dist'),generated=legacy.generated_inputs())


def build(output, candidate, ordinal):
    if platform.system() != 'Windows' or platform.machine().lower() not in ('amd64','x86_64'):
        raise ValueError('Actual Windows x64 required')
    if ordinal not in (1,2) or os.getenv('GITHUB_RUN_ATTEMPT') != '1' or subprocess.check_output(['git','rev-parse','HEAD'],text=True,cwd=APP).strip()!=candidate:
        raise ValueError('Exact candidate and selected first-attempt CI ordinal required')
    output.mkdir(parents=True,exist_ok=False)
    legacy.OUTPUT = output
    legacy.configure_npm_hook()
    executable = output/'package/loomlight.exe'
    native(output,executable,'preflight')
    write(output/'build-attempt.json',dict(candidate=candidate,ordinal=ordinal,packageAllowance=1,launchAllowance=2,getAllowance=7))
    command=['node',str(APP/'node_modules/@tauri-apps/cli/tauri.js'),'build','--no-bundle','--','--locked']
    passed=False;process=None;forced=False;code=None
    try:
        with (output/'build.log').open('w',encoding='utf-8') as log:
            process=subprocess.Popen(command,cwd=APP,stdout=log,stderr=subprocess.STDOUT)
            write(output/'build-launch.json',dict(pid=process.pid,deadlineSeconds=1200,command=command))
            code=process.wait(timeout=1200)
        if code != 0: raise ValueError('Current native package build failed')
        executable.parent.mkdir();shutil.copy2(Path(os.environ['CARGO_TARGET_DIR'])/'release/loomlight.exe',executable)
        inputs=package_inputs()
        if not legacy.package_inputs_match(inputs['sources'],inputs['sources']): raise ValueError('Complete generated permissions missing')
        write(output/'package.json',dict(candidate=candidate,ordinal=ordinal,sha256=sha(executable),inputs=inputs))
        passed=True
    finally:
        if process is not None and process.poll() is None:
            forced=True
            try:
                subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],capture_output=True,timeout=5,check=False)
                process.wait(timeout=5)
            except (OSError,subprocess.SubprocessError): pass
        try: absent=process is not None and legacy.pid_absent(process.pid)
        except (OSError,ValueError): absent=False
        stopped=process is not None and process.poll() is not None
        write(output/'build-result.json',dict(passed=passed and stopped and absent and not forced,
              exitCode=code,pid=process.pid if process else None,stopped=stopped,pidAbsent=absent,forcedExit=forced))
        if passed and (not stopped or not absent or forced): raise ValueError('Complete build process exit unproved')


def launch(output, phase, root, package):
    executable=output/'package/loomlight.exe'
    if package_inputs()!=package['inputs'] or sha(executable)!=package['sha256']:
        raise ValueError('Exact packaged/runtime inputs changed')
    if phase==2 and read(output/'phase-1.json').get('passed') is not True: raise ValueError('Initial phase did not pass')
    if subprocess.run(['tasklist','/FI','IMAGENAME eq loomlight.exe','/FO','CSV','/NH'],capture_output=True,text=True,check=True).stdout.lower().find('"loomlight.exe"')>=0:
        raise ValueError('Existing Loomlight process must retain ownership')
    write(output/f'phase-{phase}-attempt.json',dict(contract=2,phase=phase,packageSha256=package['sha256'],getAllowance=len(SCHEDULE[phase]),launchAllowance=1,deadlineSeconds=300))
    events=[]
    class Handler(http.server.BaseHTTPRequestHandler):
        def log_message(self,*_): pass
        def request(self):
            index=len(events);label=SCHEDULE[phase][index] if index<len(SCHEDULE[phase]) else 'over-budget'
            accepted=index<len(SCHEDULE[phase]) and self.command=='GET' and self.path=='/v1/models' and hmac.compare_digest(self.headers.get('Authorization',''),'Bearer '+legacy.KEYS.get(label,'refused'))
            events.append(dict(sequence=index+1,label=label,accepted=accepted))
            body=json.dumps({'data':[{'id':'loomlight-synthetic-model'}]} if accepted else {'error':'fixture refused'}).encode()
            self.send_response(200 if accepted else 403);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
        do_GET=do_POST=do_PUT=do_DELETE=do_PATCH=do_HEAD=do_OPTIONS=request
        def handle(self): self.connection.settimeout(2);super().handle()
    process=None;server=None;worker=None;started=time.monotonic();result=dict(contract=2,phase=phase,passed=False,requests=events,cleanup={})
    env=dict(os.environ,LOOMLIGHT_RUNTIME_UI_PROBE='studio-settings',LOOMLIGHT_STUDIO_PROBE_ROOT=str(root),LOOMLIGHT_STUDIO_WINDOWS_PHASE=str(phase),LOOMLIGHT_STUDIO_WINDOWS_CONTRACT='2',LOOMLIGHT_STUDIO_WINDOWS_EVIDENCE='1')
    if phase==2: env['LOOMLIGHT_STUDIO_WINDOWS_RELOAD_FAILURE']=legacy.read(legacy.RELOAD)['selector']
    if any(k.startswith('LOOMLIGHT_') and ('PROBE' in k or 'SMOKE' in k or 'STUDIO_' in k) for k in os.environ): raise ValueError('Inherited fixture overrides refused')
    handled=set();observed=[];native_records=[]
    try:
        server=http.server.HTTPServer(('127.0.0.1',46082),Handler)
        worker=threading.Thread(target=server.serve_forever,kwargs={'poll_interval':.05},daemon=True);worker.start()
        with (output/f'phase-{phase}.log').open('wb') as log:
            process=subprocess.Popen([str(executable)],env=env,stdout=log,stderr=subprocess.STDOUT)
            write(output/f'phase-{phase}-launch.json',dict(pid=process.pid,packageSha256=package['sha256']))
            while process.poll() is None:
                if time.monotonic()-started>300: raise TimeoutError('Current phase exceeded 300 seconds')
                marker=root/'.studio-windows-step.json'
                if marker.exists():
                    try: value=read(marker)
                    except (ValueError,OSError): value={}
                    step=value.get('step') if value.get('phase')==str(phase) else None
                    if step and step not in handled:
                        if step in ENTRIES[phase]:
                            native_records.append(native(output,executable,ENTRIES[phase][step],phase,process.pid,root,step))
                        elif step in OBSERVATIONS[phase]:
                            native_records.append(native(output,executable,'observe',phase,process.pid,root,step));observed.append(step)
                            write(root/f'.studio-windows-observed-{phase}-{step}.json',dict(phase=str(phase),step=step,observed=True))
                        elif step=='beta-reload-required' and phase==2:
                            native_records.append(native(output,executable,'observe-reload',phase,process.pid,root,step))
                            write(root/'.studio-windows-current-reload-observed.json',dict(contract=2,phase=2,observed=True))
                        handled.add(step)
                time.sleep(.05)
        result['exitCode']=process.returncode
        reports=[]
        for line in (output/f'phase-{phase}.log').read_text(errors='replace').splitlines():
            try:
                value=json.loads(line)
                if isinstance(value,dict) and value.get('evidence')=='runtime-ui-packaged':reports.append(value)
            except ValueError: pass
        result['reports']=reports
        validate_report(reports,phase,events,process.returncode)
        if observed!=OBSERVATIONS[phase] or not set(ENTRIES[phase]).issubset(handled): raise ValueError('Complete ordered native sequence missing')
        validate_snapshots(root,phase)
        result['passed']=True
    except Exception as error:
        result['failure']=type(error).__name__+': '+str(error)
    finally:
        if process is not None and process.poll() is None:
            try: native(output,executable,'cleanup-after-failure',phase,process.pid,root,'failure')
            except Exception as error: result['cleanup']['normalCloseError']=type(error).__name__
            try: process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                result['cleanup']['forcedExit']=True
                try:
                    subprocess.run(['taskkill','/PID',str(process.pid),'/T','/F'],capture_output=True,timeout=5,check=False)
                    process.wait(timeout=5)
                except Exception as error: result['cleanup']['stopError']=type(error).__name__
        result['cleanup']['processStopped']=process is not None and process.poll() is not None
        try: result['cleanup']['pidAbsent']=process is not None and legacy.pid_absent(process.pid)
        except Exception as error:
            result['cleanup']['pidAbsent']=False;result['cleanup']['pidError']=type(error).__name__
        if server is not None:
            try: server.shutdown()
            except Exception as error: result['cleanup']['listenerShutdownError']=type(error).__name__
            try: server.server_close()
            except Exception as error: result['cleanup']['listenerCloseError']=type(error).__name__
        if worker is not None:
            try: worker.join(timeout=2)
            except Exception as error: result['cleanup']['listenerJoinError']=type(error).__name__
        result['cleanup']['listenerStopped']=worker is not None and not worker.is_alive() and not any(k.startswith('listener') and k.endswith('Error') for k in result['cleanup'])
        result['cleanup']['rootPreserved']=root.is_dir()
        result['cleanup']['ownedCredentials']=('removed' if phase==2 else 'retained-for-reopen') if result['passed'] else 'unproved-retained'
        result['native']=native_records;result['elapsedSeconds']=round(time.monotonic()-started,3)
        result['passed']=result['passed'] and result['cleanup']['processStopped'] and result['cleanup']['listenerStopped'] and result['cleanup']['pidAbsent'] and not result['cleanup'].get('forcedExit',False) and result['elapsedSeconds']<=300
        write(output/f'phase-{phase}.json',result)
    if not result['passed']: raise ValueError('Current native phase failed; retained attempt cannot be replayed')


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['build','run']);parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--candidate',required=True);parser.add_argument('--ordinal',type=int,choices=[1,2],required=True)
    args=parser.parse_args(argv);output=args.output.resolve()
    if args.action=='build': build(output,args.candidate,args.ordinal);return
    package=read(output/'package.json')
    if package['candidate']!=args.candidate or package['ordinal']!=args.ordinal or read(output/'build-result.json').get('passed') is not True:
        raise ValueError('Selected current package missing')
    write(output/'run-attempt.json',dict(candidate=args.candidate,ordinal=args.ordinal,launchAllowance=2,getAllowance=7))
    root=Path(tempfile.mkdtemp(prefix='loomlight-studio-windows-connection-'))
    (root/'ai-profiles.json').write_bytes(legacy.FIXTURE.read_bytes())
    write(output/'root.json',dict(root=str(root),fixtureSha256=sha(legacy.FIXTURE)))
    for phase in (1,2):launch(output,phase,root,package)
    write(output/'result.json',dict(passed=True,contract=2,candidate=args.candidate,ordinal=args.ordinal,phases=2,launches=2,gets=7))


if __name__=='__main__':main()
