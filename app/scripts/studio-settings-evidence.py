"""External Settings qualification; always reuse the frozen product and CI1 evidence."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path, PurePosixPath
import platform
import stat
import subprocess
import zipfile

CANDIDATE = '929af6f23f1fe79af2665a4cc71c276a64ffd80d'
TREE = '9f034ca6cae69ef11e87d6a95a332152a9998eaa'
INPUT_DIGEST = '3c244dc28f7a4fd201ffd00b92d0df462aa2429c4d2139cf10adf6e91f97a1bd'
EXE = '0231a7cd751cd2c52c63c5936db532a2cc156cb020ba46f990a78142c0419b76'
RUN = '38224940778'
ARTIFACTS = {
 'Windows': (11736026789, 'selectable-Windows-38224940778-1', 'e6fbc03a1ab74749724c038614ccccaf044873187d28e4a75200e718e2ff4345'),
 'Darwin': (11735996238, 'selectable-macOS-38224940778-1', 'fbcc886ed660e0a3b5f9f58610185ef5d5143a69c8d07606633d10fd04c7ee80'),
}
HARNESS = ('.github/workflows/production-scaffold.yml', '.github/workflows/studio-settings-native.yml',
 'app/scripts/studio-settings-evidence.py', 'app/scripts/test_studio_settings_evidence.py',
 'app/scripts/studio-setup-native.py', 'app/scripts/studio-setup-windows.ps1', 'app/scripts/test_studio_setup_native.py')
def digest(raw): return hashlib.sha256(raw).hexdigest()
def load(path): return json.loads(path.read_text(encoding='utf-8-sig'))
def write(path, value): path.write_text(json.dumps(value, indent=2)+'\n', encoding='utf-8')
def git(repo, *args): return subprocess.check_output(['git', *args], cwd=repo)
def manifest(root, filename):
 expected=load(root/filename)
 actual={p.relative_to(root).as_posix():digest(p.read_bytes()) for p in root.rglob('*') if p.is_file() and p!=root/filename}
 assert expected == {'schemaVersion':1,'files':actual} and actual, 'Artifact manifest mismatch'
def extract(archive, destination):
 with zipfile.ZipFile(archive) as z:
  seen=set(); total=0
  for e in z.infolist():
   assert e.orig_filename==e.filename, 'Raw archive name was normalized'
   p=PurePosixPath(e.filename)
   assert e.filename and '\\' not in e.filename and not p.is_absolute() and all(x not in ('..','.') and ':' not in x for x in p.parts), 'Unsafe archive entry'
   assert e.filename == p.as_posix()+('/' if e.is_dir() else ''), 'Noncanonical archive entry'
   assert e.filename not in seen and not stat.S_ISLNK(e.external_attr>>16), 'Duplicate/link archive entry'
   seen.add(e.filename); total+=e.file_size
   assert total<=50*1024*1024, 'Artifact size exceeded'
  destination.mkdir(exist_ok=False)
  z.extractall(destination)
def verify_reuse(product, artifact, target):
 manifest(artifact,'artifact-manifest.json'); q=artifact/'qualification'; manifest(q,'manifest.json')
 ident=load(q/'identity.json'); boot=load(artifact/'bootstrap.json'); pipeline=load(artifact/'pipeline.json'); result=load(q/'result.json')
 assert git(product,'rev-parse','HEAD').decode().strip()==CANDIDATE and git(product,'rev-parse','HEAD^{tree}').decode().strip()==TREE
 for d in (ident,boot,pipeline): assert d['candidate']==CANDIDATE and d['runId']==RUN
 assert ident['attempt']==boot['attempt']==1 and ident['tree']==TREE
 assert ident['os']==boot['os']==target and ident['architecture']==boot['architecture']==('AMD64' if target=='Windows' else 'arm64')
 assert pipeline['passed'] is True and result['passed'] is True and result['failure'] is None and load(q/'cleanup.json')['cleanupComplete'] is True
 paths=git(product,'ls-files','app','tests/fixtures/source-foundation','tests/fixtures/studio-request','.github/workflows/selectable-proposals.yml','.github/workflows/production-scaffold.yml','spikes/renpy-sdk').decode().splitlines()
 assert len(paths)==269 and set(paths)==set(ident['inputs'])
 inputs={}; transforms=[]
 for name in paths:
  raw=git(product,'show',CANDIDATE+':'+name); inputs[name]=digest(raw)
  allowed={digest(raw)}
  if name.endswith('.ps1'): allowed.add(digest(raw.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n')))
  assert digest((product/name).read_bytes()) in allowed, 'Product checkout input differs: '+name
  if ident['inputs'][name]!=digest(raw):
   assert name.endswith('.ps1') and ident['inputs'][name]==digest(raw.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n'))
   transforms.append(name)
 assert digest(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode())==INPUT_DIGEST
 assert result['packageBuilds']==(1 if target=='Windows' else 0) and result['appLaunches']==(2 if target=='Windows' else 0)
 if target=='Windows':
  package=load(q/'package-inputs.json')
  assert package['candidate']==CANDIDATE and package['inputs']==ident['inputs'] and package['packageBuildOrdinal']==1
  assert digest((q/'package/loomlight.exe').read_bytes())==package['executableSHA256']==EXE
 return {'passed':True,'productCandidate':CANDIDATE,'productTree':TREE,'inputs':inputs,'productInputDigest':INPUT_DIGEST,'declaredCRLFTransforms':transforms,'reuseRunId':RUN,'reuseAttempt':1,'packageBuilds':0,'reusedPackageBuildOrdinal':1 if target=='Windows' else None,'reusedExecutableSHA256':EXE if target=='Windows' else None}
def prepare(product, harness, output):
 output.mkdir(exist_ok=False)
 report={'passed':False,'productCandidate':CANDIDATE,'harnessCandidate':git(harness,'rev-parse','HEAD').decode().strip(),'runId':os.environ.get('GITHUB_RUN_ID'),'attempt':os.environ.get('GITHUB_RUN_ATTEMPT'),'os':platform.system(),'architecture':platform.machine(),'packageBuilds':0,'appLaunches':0}
 try:
  assert os.environ['GITHUB_REF']=='refs/heads/codex/provider-qualification' and os.environ['GITHUB_RUN_ATTEMPT']=='1' and report['harnessCandidate']==os.environ['GITHUB_SHA']
  assert os.environ['DISPATCH_ORDINAL']=='3' and os.environ['FIRST_LAUNCH_ORDINAL']=='3'
  assert (report['os'],report['architecture']) in [('Windows','AMD64'),('Darwin','arm64')]
  report['harnessInputs']={p:digest((harness/p).read_bytes()) for p in HARNESS}
  report['harnessInputDigest']=digest(json.dumps(report['harnessInputs'],sort_keys=True,separators=(',',':')).encode())
  aid,name,expected=ARTIFACTS[report['os']]
  meta=json.loads(subprocess.check_output(['gh','api',f'repos/Caldwell-41/Renpy-editor/actions/artifacts/{aid}']))
  assert meta['id']==aid and meta['name']==name and meta['expired'] is False and meta['digest']=='sha256:'+expected and meta['workflow_run']['id']==int(RUN) and meta['workflow_run']['head_sha']==CANDIDATE
  write(output/'reuse-artifact.json',meta)
  archive=output/'reuse.zip'
  with archive.open('wb') as f: subprocess.run(['gh','api',f'repos/Caldwell-41/Renpy-editor/actions/artifacts/{aid}/zip'],stdout=f,check=True,timeout=120)
  assert digest(archive.read_bytes())==expected, 'Pinned artifact ZIP differs'
  extract(archive,output/'reuse'); archive.unlink()
  report.update(verify_reuse(product,output/'reuse',report['os']))
 except Exception as error:
  report['passed']=False; report['failure']=str(error); raise
 finally: write(output/'identity.json',report)
def finish(output):
 output.mkdir(parents=True,exist_ok=True)
 report={'passed':False,'packageBuilds':0,'appLaunches':0,'productCandidate':CANDIDATE,'failure':'Preparation identity missing'}
 failure=None
 reservations=sorted((output/'native').glob('launch-*-reserved.json'))
 consumed=len(reservations)
 try:
  report=load(output/'identity.json')
  if (output/'native/terminal.json').is_file():
   native=load(output/'native/terminal.json')
   ordinals=native.get('launchOrdinals',[])
   if isinstance(ordinals,list): consumed=max(consumed,len(ordinals))
  report['appLaunches']=consumed
  assert report['passed'] is True
  assert load(output/'validator-result.json')['passed'] is True
  if report['os']=='Windows':
   native=load(output/'native/terminal.json')
   spec=importlib.util.spec_from_file_location('native_setup',Path(__file__).with_name('studio-setup-native.py'))
   module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
   module.validate_terminal(native)
   assert load(output/'native-privacy.json')['passed'] is True
   assert native['harnessRef']==report['harnessCandidate']
   expected={Path(p).name:h for p,h in report['harnessInputs'].items() if Path(p).name in ('studio-setup-native.py','studio-setup-windows.ps1','test_studio_setup_native.py')}
   assert native['harnessFiles']==expected
   assert len(reservations)==2 and consumed==2 and native['launchOrdinals']==[3,4], 'Attempt reservations differ'
   pids={}
   for ordinal,phase in ((3,1),(4,2)):
    reserved=load(output/f'native/launch-{ordinal}-reserved.json')
    assert reserved=={'ordinal':ordinal,'candidate':CANDIDATE,'executableSHA256':EXE,'phase':phase}
    started=load(output/f'native/launch-{ordinal}-started.json')
    assert started['ordinal']==ordinal and started['executableSHA256']==EXE and type(started['pid']) is int and started['pid']>0
    pids[ordinal]=started['pid']
   for stage in module.STAGES:
    folder=output/'native'/stage
    module.validate_stage(load(folder/'receipt.json'),stage,pids[4 if stage in ('reopen','cleanup','close-reopen') else 3],folder)
  else: assert not reservations and consumed==0, 'Unexpected Mac editor attempts'
 except Exception as error: failure=str(error) or type(error).__name__
 report.update(passed=failure is None,failure=failure,appLaunches=consumed,reservedAppLaunches=len(reservations))
 write(output/'pipeline.json',report)
 write(output/'artifact-manifest.json',{'schemaVersion':1,'files':{p.relative_to(output).as_posix():digest(p.read_bytes()) for p in output.rglob('*') if p.is_file() and p!=output/'artifact-manifest.json'}})
 return failure is None
def main():
 p=argparse.ArgumentParser();p.add_argument('stage',choices=['prepare','finish']);p.add_argument('--product-repo',type=Path);p.add_argument('--harness-repo',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 if a.stage=='prepare': prepare(a.product_repo,a.harness_repo,a.output)
 elif not finish(a.output): raise SystemExit('Settings qualification failed; evidence retained')
if __name__=='__main__':main()
