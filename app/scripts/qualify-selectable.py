"""One bounded fresh paired selectable outcome run; no retries or monitoring."""
import argparse,hashlib,json,os,platform,re,shutil,subprocess,sys,tempfile
from pathlib import Path
from rewrite_probe_gate import validate_report
from rewrite_native_evidence import required_stages
REPO=Path(__file__).resolve().parents[2];APP=REPO/'app'
SDK_HASH='eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def cargo_gate(text,count):
    assert re.search(rf'test result: ok\. {count} passed; 0 failed; 0 ignored; 0 measured;',text)
def renderer_gate(text):
    for k,n in [('tests',132),('pass',132),('fail',0),('cancelled',0),('skipped',0),('todo',0)]:assert re.search(r'(?:ℹ|#) '+k+' '+str(n)+r'(?:\r?\n)',text)
def manifest_gate(directory,value):
    assert value['schemaVersion']==1 and value['files']
    assert {p.relative_to(directory).as_posix():sha(p) for p in directory.rglob('*') if p.is_file() and p.name!='manifest.json'}==value['files']
def command(argv):
    if argv[0]=='npm':
        node=Path(shutil.which('node'))
        shim=Path(shutil.which('npm'))
        resolved=shim.resolve()
        npm_cli=os.environ.get('REWRITE_NPM_CLI') or str(resolved if resolved.name=='npm-cli.js' else shim.parent/'node_modules/npm/bin/npm-cli.js')
        assert Path(npm_cli).is_file(), 'Selected npm CLI unavailable'
        return [str(node),npm_cli,*argv[1:]]
    return argv

def unittest_gate(text,count):
    assert re.search(rf'Ran {count} tests? in ',text) and re.search(r'\nOK\s*$',text)

def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);p.add_argument('--archive',type=Path,required=True);p.add_argument('--checksums',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
    win=platform.system()=='Windows';assert (win and platform.machine()=='AMD64') or (platform.system()=='Darwin' and platform.machine()=='arm64')
    assert os.environ['GITHUB_RUN_ATTEMPT']=='1' and os.environ['GITHUB_REF']=='refs/heads/codex/provider-qualification'
    candidate=subprocess.check_output(['git','rev-parse','HEAD'],cwd=REPO,text=True).strip();assert candidate==os.environ['GITHUB_SHA']
    paths=subprocess.check_output(['git','ls-files','app','tests/fixtures/source-foundation','.github/workflows/selectable-proposals.yml','.github/workflows/production-scaffold.yml','spikes/renpy-sdk'],cwd=REPO,text=True).splitlines()
    identity={'candidate':candidate,'tree':subprocess.check_output(['git','rev-parse','HEAD^{tree}'],cwd=REPO,text=True).strip(),'runId':os.environ['GITHUB_RUN_ID'],'attempt':1,'os':platform.system(),'architecture':platform.machine(),'action':'editScene','inputs':{path:sha(REPO/path) for path in paths},'toolchains':{t:subprocess.check_output(command([t,'--version']),cwd=APP,text=True).strip() for t in ('node','npm','cargo','rustc')}}
    assert identity['toolchains']['node']=='v24.19.0' and identity['toolchains']['npm']=='11.9.0' and identity['toolchains']['rustc'].startswith('rustc 1.90.0 ')
    (a.output/'identity.json').write_text(json.dumps(identity,indent=2)+'\n');checks=[];ledger=[];sdkroot=None;root=None;failure=None
    def entry(kind,ordinal):
        ledger.append({'kind':kind,'ordinal':ordinal});(a.output/'attempt-ledger.json').write_text(json.dumps(ledger,indent=2)+'\n')
    def run(name,args,gate=None,timeout=600):
        try:
            r=subprocess.run(command(args),cwd=APP,capture_output=True,text=True,encoding='utf-8',errors='replace',timeout=timeout);text=r.stdout+r.stderr;(a.output/(name+'.log')).write_text(text)
            assert r.returncode==0,name
            if gate:gate(text)
            checks.append({'name':name,'passed':True,'exitCode':r.returncode})
            return text
        except Exception as error:
            checks.append({'name':name,'passed':False,'failure':type(error).__name__});raise
    try:
        run('renderer',['npm','run','check'],renderer_gate);run('frontend',['npm','run','build'])
        run('core',['cargo','test','-p','loomlight-core','--locked','selectable','--','--nocapture'],lambda t:cargo_gate(t,8))
        run('prompts',['cargo','test','-p','loomlight-core','--locked','prompts::tests'],lambda t:cargo_gate(t,5))
        run('gates',[sys.executable,'-m','unittest','discover','-s','scripts','-p','test_selectable_qualification.py','-v'],lambda t:unittest_gate(t,12))
        run('probe-snapshot',['cargo','test','-p','loomlight-desktop','--locked','snapshot_paths'],lambda t:cargo_gate(t,2))
        run('native-worker',['cargo','test','-p','loomlight-desktop','--locked','ai_requests::tests'],lambda t:cargo_gate(t,6))
        run('controller-build',['cargo','build','-p','loomlight-desktop','--locked','--example','rewrite-controller-driver'])
        driver='target/debug/examples/rewrite-controller-driver'+('.exe' if win else '')
        run('controller',['node','tests/selectable-controller.dispatch.mjs',driver,'--game-output',str(a.output/'games.json')],lambda t: (_ for _ in ()).throw(AssertionError('Controller marker missing')) if 'PASS: selectable actual controller/native HTTP' not in t else None)
        sys.path.insert(0,str(REPO/'spikes/renpy-sdk'));from archive_safety import expected_sha256,install_verified_tar
        assert sha(a.archive)==expected_sha256(a.checksums.read_text(),'renpy-8.5.3-sdk.tar.bz2')==SDK_HASH
        sdkroot=Path(tempfile.gettempdir())/('loomlight-selectable-sdk-'+identity['runId']);assert not sdkroot.exists();install_verified_tar(a.archive,SDK_HASH,sdkroot)
        run('sdk',[sys.executable,'scripts/selectable-sdk.py','--sdk',str(sdkroot/'renpy-8.5.3-sdk'),'--fixture',str(a.output/'games.json'),'--output',str(a.output/'sdk-commands')],lambda t: (_ for _ in ()).throw(AssertionError('SDK marker missing')) if 'PASS: pinned Ren’Py selectable create/update' not in t else None,400)
        (a.output/'sdk-identity.json').write_text(json.dumps({'passed':True,'version':'8.5.3','archiveSHA256':sha(a.archive),'fixtureSHA256':sha(a.output/'games.json'),'driverSHA256':sha(APP/driver)},indent=2)+'\n')
        if win:
            build=int(os.environ['BUILD_ORDINAL']);first=int(os.environ['FIRST_LAUNCH_ORDINAL']);assert 1<=build<=4 and 1<=first<=7
            run('native-preflight',['powershell.exe','-NoProfile','-File','scripts/rewrite-windows-native.ps1','-Stage','preflight','-Output',str(a.output/'native-preflight')],timeout=75)
            entry('package-build',build);run('package',['npm','exec','--','tauri','build','--','--locked'],timeout=1800)
            executable=APP/'target/release/loomlight.exe';run('package-privacy',['node','scripts/scan-artifacts.mjs','dist',str(executable),'target/release/bundle'])
            package=a.output/'package';package.mkdir();shutil.copy2(executable,package/'loomlight.exe')
            (a.output/'package-inputs.json').write_text(json.dumps({**identity,'executableSHA256':sha(executable),'packageBuildOrdinal':build},indent=2)+'\n')
            root=Path(tempfile.gettempdir())/('loomlight-rewrite-ci-'+identity['runId']);assert not root.exists()
            for phase in (1,2):
                entry('app-launch',first+phase-1)
                run(f'phase-{phase}',[sys.executable,'scripts/dialogue-rewrite-probe.py','--selectable-edits','--executable',str(executable),'--root',str(root),'--output',str(a.output/'walkthrough'),'--native-driver',str(APP/'scripts/rewrite-windows-native.ps1'),'--phase',str(phase)],timeout=960)
                report=json.loads((a.output/'walkthrough'/f'phase-{phase}.json').read_text());validate_report(report,phase,batch=True)
                assert len(report['requestBodySHA256'])==(6 if phase==1 else 0)
                if phase==1:assert set(report['nativeStageReceipts'])==required_stages(batch=True)
        run('evidence-privacy',['node','scripts/scan-artifacts.mjs',str(a.output)])
    except Exception as error:failure=type(error).__name__+': '+str(error);raise
    finally:
        if sdkroot and sdkroot.exists():shutil.rmtree(sdkroot)
        cleanup={'sdkRootRemoved':not sdkroot or not sdkroot.exists(),'ownedRootRemoved':not root or not root.exists(),'credentialReferencesRemoved':not win or root is None}
        if root and root.exists():
            # The application owns deletion. Read only redacted profile references,
            # never keys/ciphertext. Missing failure receipts keep cleanup unresolved.
            try:
                reports=[json.loads(p.read_text()) for p in (a.output/'walkthrough').glob('phase-*.json')]
                profile=json.loads((root/'ai-profiles.json').read_text())
                if reports and reports[-1].get('cleanupComplete') is True and all(p.get('credential') is None for p in profile['profiles']):
                    cleanup['credentialReferencesRemoved']=True;shutil.rmtree(root);cleanup['ownedRootRemoved']=not root.exists()
            except (OSError,ValueError,KeyError):
                cleanup['failureReceiptUnavailable']=False
        cleanup['cleanupComplete']=all(cleanup.values());(a.output/'cleanup.json').write_text(json.dumps(cleanup,indent=2)+'\n')
        (a.output/'result.json').write_text(json.dumps({'passed':failure is None and cleanup['cleanupComplete'],'failure':failure,'checks':checks,'packageBuilds':sum(e['kind']=='package-build' for e in ledger),'appLaunches':sum(e['kind']=='app-launch' for e in ledger),'localSignedMacNative':'required separately; automated Mac CI has no package or editor launch'},indent=2)+'\n')
        files={p.relative_to(a.output).as_posix():sha(p) for p in a.output.rglob('*') if p.is_file()};(a.output/'manifest.json').write_text(json.dumps({'schemaVersion':1,'files':files},indent=2)+'\n')
    assert cleanup['cleanupComplete']
if __name__=='__main__':main()
