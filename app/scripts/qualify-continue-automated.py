"""Focused ARM64 CI proof without a signed package or editor app launch.
Approved Mac signing/native proof remains on the retained local host.
"""
import argparse, hashlib, json, os, platform, re, shutil, subprocess, sys, tempfile
from pathlib import Path
REPO=Path(__file__).resolve().parents[2];APP=REPO/'app'
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--archive',type=Path,required=True);p.add_argument('--checksums',type=Path,required=True);a=p.parse_args()
a.output.mkdir(parents=True,exist_ok=False)
drafting=os.environ.get('DRAFT_SCENE')=='true'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
identity={'candidate':subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip(),'runId':os.environ['GITHUB_RUN_ID'],'attempt':int(os.environ['GITHUB_RUN_ATTEMPT']),'architecture':platform.machine(),'os':platform.system(),'action':'draftScene' if drafting else 'continueScene','packageBuilds':0,'appLaunches':0,'toolchains':{tool:subprocess.check_output([tool,'--version'],cwd=APP,text=True).strip() for tool in ('node','npm','rustc','cargo')}}
assert identity['architecture']=='arm64' and identity['os']=='Darwin' and identity['attempt']==1 and identity['candidate']==os.environ['GITHUB_SHA']
assert identity['toolchains']['node']=='v24.19.0' and identity['toolchains']['npm']=='11.9.0' and identity['toolchains']['rustc'].startswith('rustc 1.90.0 ')
paths=subprocess.check_output(['git','ls-files','app','.github/workflows/production-scaffold.yml','spikes/renpy-sdk'],cwd=REPO,text=True).splitlines();identity['inputs']={path:sha(REPO/path) for path in paths}
(a.output/'identity.json').write_text(json.dumps(identity,indent=2)+'\n')
checks=[]
def run(name,argv,count=None,timeout=600):
 try:
  r=subprocess.run(argv,cwd=APP,capture_output=True,text=True,timeout=timeout)
  (a.output/(name+'.log')).write_text(r.stdout+r.stderr)
  assert r.returncode==0,name
  if name=='renderer':
   assert re.search(r'(?:ℹ|#) tests 127(?:\r?\n)',r.stdout) and re.search(r'(?:ℹ|#) pass 127(?:\r?\n)',r.stdout), 'Required renderer cases missing'
   for outcome in ('fail','cancelled','skipped','todo'):
    assert re.search(r'(?:ℹ|#) '+outcome+r' 0(?:\r?\n)',r.stdout), 'Unsuccessful renderer cases are not acceptance'
  if name=='sdk':assert ('PASS: pinned Ren’Py actual accepted Draft Scene' if drafting else 'PASS: pinned Ren’Py actual accepted Continue Scene group') in r.stdout
  if count is not None:assert f'test result: ok. {count} passed; 0 failed; 0 ignored;' in r.stdout,name
  checks.append({'name':name,'passed':True,'command':argv})
 except subprocess.TimeoutExpired as error:
  output=(error.stdout or b'')+(error.stderr or b'')
  if isinstance(output,bytes):output=output.decode('utf-8',errors='replace')
  (a.output/(name+'.log')).write_text(output+'\nTimed out; required case failed.\n')
  checks.append({'name':name,'passed':False,'command':argv,'error':'timeout'});raise
 except Exception as error:
  checks.append({'name':name,'passed':False,'command':argv,'error':type(error).__name__});raise
sdkroot=Path(tempfile.gettempdir())/('loomlight-continue-sdk-'+identity['runId'])
try:
 run('renderer',['npm','run','check']);run('frontend',['npm','run','build'])
 run('core',['cargo','test','-p','loomlight-core','--locked','rewrite'],21)
 run('prompts',['cargo','test','-p','loomlight-core','--locked','prompts::tests'],5)
 run('transport',['cargo','test','-p','loomlight-core','--locked','ai_request::tests'],8)
 run('native-worker',['cargo','test','-p','loomlight-desktop','--locked','ai_requests::tests'],6)
 run('controller-build',['cargo','build','-p','loomlight-desktop','--locked','--example','rewrite-controller-driver'])
 run('controller',['node','tests/rewrite-controller.dispatch.mjs','target/debug/examples/rewrite-controller-driver','--draft-scene' if drafting else '--continue-scene'])
 assert 'PASS: actual controller/native credentials/exact strict-schema HTTP' in (a.output/'controller.log').read_text()
 run('literal-build',['cargo','build','-p','loomlight-core','--locked','--example','draft-literal-driver' if drafting else 'continue-literal-driver'])
 sys.path.insert(0,str(REPO/'spikes/renpy-sdk'));from archive_safety import expected_sha256,install_verified_tar
 expected='eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
 assert sha(a.archive)==expected_sha256(a.checksums.read_text(),'renpy-8.5.3-sdk.tar.bz2')==expected
 assert not sdkroot.exists();install_verified_tar(a.archive,expected,sdkroot)
 run('sdk',[sys.executable,'scripts/rewrite-literal-sdk.py','--draft-scene' if drafting else '--continue-scene','--sdk',str(sdkroot/'renpy-8.5.3-sdk'),'--driver','target/debug/examples/draft-literal-driver' if drafting else 'target/debug/examples/continue-literal-driver','--output',str(a.output/'sdk-commands')],timeout=400)
 (a.output/'sdk-identity.json').write_text(json.dumps({'passed':True,'version':'8.5.3','archiveSHA256':sha(a.archive),'literalDriverSHA256':sha(APP/('target/debug/examples/draft-literal-driver' if drafting else 'target/debug/examples/continue-literal-driver'))},indent=2)+'\n')
finally:
 if sdkroot.exists():shutil.rmtree(sdkroot)
 (a.output/'cases.json').write_text(json.dumps({'passed':len(checks)==10 and all(c['passed'] for c in checks),'checks':checks,'sdkRootRemoved':not sdkroot.exists()},indent=2)+'\n')
 # Store actual failures as failures. Artifact privacy is enforced before upload.
 r=subprocess.run(['node','scripts/scan-artifacts.mjs',str(a.output)],cwd=APP,capture_output=True,text=True);(a.output/'privacy.log').write_text(r.stdout+r.stderr)
 (a.output/'manifest.json').write_text(json.dumps({p.relative_to(a.output).as_posix():sha(p) for p in a.output.rglob('*') if p.is_file()},indent=2)+'\n')
 if r.returncode:raise RuntimeError('Evidence privacy scan failed')
