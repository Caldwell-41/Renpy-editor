#!/usr/bin/env python3
"""One task-specific signed-app walkthrough with public loopback fixtures.

No build, install, credential value read, general UI driver or automatic retry.
Native actions/observations are performed through the supported computer-use tool.
"""
import argparse
import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import shutil
import signal
import socket
import subprocess
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

spec=importlib.util.spec_from_file_location('macos_package',Path(__file__).with_name('macos-package.py'))
package=importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)
PORT=46082
OWNER='loomlight-studio-request-v1\n'
PUBLIC_KEY='loomlight-public-request-alpha'
PROMPT='This is a synthetic Loomlight connection test. Reply with the short text: Loomlight synthetic response. No tools.'

def write(path,value):
    with path.open('x') as file:
        os.chmod(path,0o600)
        json.dump(value,file,indent=2)
        file.write('\n')

def manifest():
    # Recorded source/config/profile groups; original manifests are never backfilled.
    files=[]
    for folder in ['src','src-core/src','src-tauri/src','src-tauri/permissions','src-tauri/capabilities','tests/fixtures/studio-request']:
        files.extend(p for p in (package.APP/folder).rglob('*') if p.is_file())
    files.extend(package.APP/p for p in ['Cargo.toml','Cargo.lock','src-core/Cargo.toml','src-tauri/Cargo.toml','src-tauri/build.rs','src-tauri/identity_policy.rs','src-tauri/macos-signing.json','src-tauri/tauri.conf.json','package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts'])
    return {p.relative_to(package.APP).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(set(files)) if p.exists()}

def accepted(method,path,auth,body):
    expected={'model':'synthetic-model','messages':[{'role':'user','content':PROMPT}],'stream':False,'max_tokens':1024,'enable_thinking':False,'enable_tools':False,'enabled_tools':[]}
    return method=='POST' and path=='/v1/chat/completions' and hmac.compare_digest(auth,'Bearer '+PUBLIC_KEY) and body==expected

def start_server(output,count=4):
    events=[];gate=threading.Lock();stop=threading.Event()
    class Handler(BaseHTTPRequestHandler):
        def log_message(self,*_):pass
        def handle_request(self):
            started=time.monotonic()
            size=int(self.headers.get('Content-Length','0'))
            raw=self.rfile.read(size) if 0<size<=4096 else b''
            try:body=json.loads(raw)
            except (ValueError,UnicodeError):body=None
            with gate:
                index=len(events)+1
                good=index<=count and accepted(self.command,self.path,self.headers.get('Authorization',''),body)
                event={'sequence':index,'accepted':good,'method':self.command,'bodyBytes':len(raw),'bodySha256':hashlib.sha256(raw).hexdigest(),'variant':{1:'complete',2:'stall-until-cancel',3:'authentication-error',4:'complete-usage-unknown',5:'stall-until-exit'}.get(index,'refused')}
                events.append(event);write(output/f'request-{index}-start.json',event)
            if good and index in (2,5):
                self.connection.settimeout(1)
                closed=False
                while not stop.is_set() and time.monotonic()-started<900:
                    try:
                        if self.connection.recv(1)==b'':closed=True;break
                    except socket.timeout:continue
                    except (ConnectionResetError,OSError):closed=True;break
                write(output/f'request-{index}-end.json',{'clientClosed':closed,'elapsedMs':round((time.monotonic()-started)*1000,3)})
                return
            if good and index==1:stop.wait(8) # App response deadline remains 600 s; operator observations separate.
            value={'model':'synthetic-model','choices':[{'index':0,'finish_reason':'stop','message':{'role':'assistant','content':'Loomlight synthetic response.'}}]}
            if index==1:value['usage']={'prompt_tokens':42,'completion_tokens':4,'total_tokens':46,'completion_tokens_details':{'reasoning_tokens':0}}
            status=200 if good and index!=3 else 401 if good else 403
            data=json.dumps(value).encode() if status==200 else b'{"error":"untrusted synthetic error body must not be exposed"}'
            self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.send_header('Connection','close');self.end_headers()
            try:self.wfile.write(data);sent=True
            except (BrokenPipeError,ConnectionResetError):sent=False
            write(output/f'request-{index}-end.json',{'httpStatus':status,'sent':sent,'elapsedMs':round((time.monotonic()-started)*1000,3)})
        do_POST=handle_request
        do_GET=handle_request
        do_PUT=handle_request
        do_DELETE=handle_request
    server=ThreadingHTTPServer(('127.0.0.1',PORT),Handler);server.daemon_threads=False
    listener=threading.Thread(target=server.serve_forever);listener.start()
    return server,listener,stop,events

def launch(bundle,output,number=1):
    if output.exists():raise ValueError('Launch output exists; ambiguous/repeated dispatch refused')
    if number not in (1,2,3) or output.name!=f'launch-{number}':raise ValueError('Exact bounded launch identity required')
    for prior in range(1,number):
        folder=output.parent/f'launch-{prior}'
        terminal=json.loads((folder/'exit.json').read_text())
        cleaned=json.loads((folder/'cleanup.json').read_text())
        if terminal['normal'] or not cleaned['ownedFixtureRemoved']:raise ValueError('Reserve requires a failed terminal cleaned attempt and a separately identified correction')
    if subprocess.run(['pgrep','-x','loomlight'],capture_output=True).returncode==0:raise ValueError('A Loomlight process already exists; no second owner')
    identity=package.verify(bundle,package.approved_fingerprint(json.loads((package.APP/'src-tauri/macos-signing.json').read_text())['certificateSha1']))
    output.mkdir(parents=True,mode=0o700)
    root=Path(tempfile.mkdtemp(prefix='loomlight-studio-request-'));os.chmod(root,0o700);(root/'.request-owner').write_text(OWNER);os.chmod(root/'.request-owner',0o600)
    write(output/'state.json',{'root':str(root),'bundle':str(bundle),'identity':identity,'source':subprocess.check_output(['git','rev-parse','HEAD'],cwd=package.APP,text=True).strip(),'manifest':manifest(),'allowance':{'builds':2,'launches':3},'launch':number})
    server,listener,stop,events=start_server(output)
    env={k:v for k,v in os.environ.items() if not k.startswith('LOOMLIGHT_')}
    env.update(LOOMLIGHT_RUNTIME_UI_PROBE='studio-request',LOOMLIGHT_STUDIO_PROBE_ROOT=str(root))
    process=None;start=time.monotonic();code=None;forced=False
    try:
        with (output/'app-stdout.log').open('xb') as stdout,(output/'app-stderr.log').open('xb') as stderr:
            process=subprocess.Popen([str(bundle/'Contents/MacOS/loomlight')],env=env,stdout=stdout,stderr=stderr,start_new_session=True)
            write(output/'launch.json',{'pid':process.pid,'accepted':True,'executableSHA256':identity['executableSHA256']})
            print(json.dumps({'launched':True,'pid':process.pid,'root':str(root)}),flush=True)
            try:code=process.wait(timeout=1800)
            except subprocess.TimeoutExpired:
                forced=True;os.killpg(process.pid,signal.SIGTERM)
                try:code=process.wait(timeout=10)
                except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);code=process.wait()
    finally:
        if process is not None and process.poll() is None:
            forced=True;os.killpg(process.pid,signal.SIGTERM)
            try:code=process.wait(timeout=10)
            except subprocess.TimeoutExpired:os.killpg(process.pid,signal.SIGKILL);code=process.wait()
        stop.set();server.shutdown();server.server_close();listener.join(timeout=2)
        write(output/'exit.json',{'code':code,'normal':code==0 and not forced,'forced':forced,'elapsedMs':round((time.monotonic()-start)*1000,3),'listenerStopped':not listener.is_alive(),'requests':len(events),'allAccepted':all(e['accepted'] for e in events)})
    if code!=0 or forced or len(events)!=4 or not all(e['accepted'] for e in events):raise ValueError('Native launch did not complete the exact four-request walkthrough; preserve receipts')
    print(json.dumps({'exitedNormally':True,'listenerStopped':True,'requests':4}),flush=True)

def cleanup(output):
    state=json.loads((output/'state.json').read_text());exit_receipt=json.loads((output/'exit.json').read_text());root=Path(state['root'])
    unused=(output/'operator-stop.json').is_file() and exit_receipt['requests']==0 and not (root/'credentials-dev').exists()
    if not exit_receipt['listenerStopped'] or (not exit_receipt['normal'] and not unused):raise ValueError('Exit/listener evidence missing; root retained')
    if root.parent!=Path(tempfile.gettempdir()) or not root.name.startswith('loomlight-studio-request-') or root.is_symlink() or (root/'.request-owner').read_text()!=OWNER:raise ValueError('Fixture ownership refused')
    profile=json.loads((root/'ai-profiles.json').read_text())
    seed=json.loads((package.APP/'tests/fixtures/studio-request/profiles.json').read_text())
    if unused:
        if profile!=seed:raise ValueError('Unused fixture changed; ownership cleanup refused')
        pid=json.loads((output/'launch.json').read_text())['pid']
        try:os.kill(pid,0)
        except ProcessLookupError:pass
        else:raise ValueError('Owned app still exists; cleanup refused')
    elif profile['profiles'] or profile['cleanup'] or list(root.glob('credentials-dev/generations/*/records/*.sealed')):raise ValueError('Use supported Remove profile/owned cleanup first; no recovery or credential enumeration')
    for event in ([] if unused else range(1,5)):
        if not json.loads((output/f'request-{event}-start.json').read_text())['accepted']:raise ValueError('Request evidence refused')
    sources={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'synthetic-project/game').rglob('*.rpy')}
    write(output/'cleanup-before.json',{'exactOwnedRoot':True,'unusedFixture':unused,'profiles':len(profile['profiles']),'cleanupReferences':len(profile['cleanup']),'sealedRecords':0,'sources':sources,'profileSHA256':hashlib.sha256((root/'ai-profiles.json').read_bytes()).hexdigest()})
    shutil.rmtree(root)
    write(output/'cleanup.json',{'ownedFixtureRemoved':not root.exists(),'credentialRemovedThroughProduct':None if unused else True,'credentialsCreated':0 if unused else 1,'unrelatedDataAccessed':False})

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);group=parser.add_mutually_exclusive_group(required=True);group.add_argument('--bundle',type=Path);group.add_argument('--cleanup',action='store_true');parser.add_argument('--launch',type=int,choices=[1,2,3],default=1);args=parser.parse_args()
    try:
        if args.cleanup:cleanup(args.output.resolve())
        else:launch(args.bundle.resolve(),args.output.resolve(),args.launch)
    except (ValueError,OSError,subprocess.SubprocessError) as error:
        print(f'Walkthrough refused: {error}');raise SystemExit(1)
