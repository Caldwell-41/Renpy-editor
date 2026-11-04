"""#47 accepted-source export and normal-play action qualification.

Offline preparation never starts Ren'Py. SDK execution requires a reservation.
"""
import argparse
import hashlib
import importlib.util
import json
import os
import platform
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile

REPO = Path(__file__).resolve().parents[2]
FIXTURE = REPO / 'tests/fixtures/phase-3b-screens/ordered-actions'
EXPORT_TEST = 'screens::tests::actions::runtime::ordered_actions_export_public_core_normal_entry_without_engine_execution'
CASES = ('click', 'keyboard')
RESOLUTIONS = ([1280, 720], [1024, 768])
_spec = importlib.util.spec_from_file_location('help_process_utilities', Path(__file__).with_name('qualify-help-dialog.py'))
process = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(process)
base = process.base
require, digest, load_json, portable_file, write_json = base.require, base.digest, base.load_json, base.portable_file, base.write_json


def record_environment(result):
    # Fixed local version commands never inspect or execute a game project.
    result.update(os=platform.system(),architecture=platform.machine(),
                  toolchains=dict(python=platform.python_version(),pythonImplementation=platform.python_implementation()))
    for name,command in [('cargo',['cargo','--version']),('rustc',['rustc','-Vv'])]:
        version = subprocess.run(command,check=True,capture_output=True,text=True,timeout=10)
        result['toolchains'][name] = version.stdout.strip()


def validate_environment(result):
    require(isinstance(result.get('os'),str) and bool(result['os'])
            and isinstance(result.get('architecture'),str) and bool(result['architecture']),'missing producer target')
    toolchains = result.get('toolchains',{})
    require(all(isinstance(toolchains.get(name),str) and bool(toolchains[name])
                for name in ('python','pythonImplementation','cargo','rustc')),'missing producer toolchains')


def validate_runtime_output(text, case, manifest_sha, manifest, resolution):
    require(case in CASES and resolution in RESOLUTIONS, 'unknown case/resolution')
    lines = text.splitlines()
    require(lines.count('[rpytest] Status: PASSED') == 1, 'missing/duplicate engine completion')
    require(any(re.search(r'\bglobal\.ordered_actions::' + re.escape(case) + r'\b', line) for line in lines), 'missing named engine case')
    summaries = [line for line in lines if line.startswith('[rpytest] Test cases :')]
    require(len(summaries) == 1 and list(map(int, re.findall(r'\d+', summaries[0]))) == [2,1,0,0,0,1,0], 'wrong selected engine case summary')
    duration = re.findall(r'\[rpytest\] Time: ([0-9.]+) s', text)
    require(len(duration) == 1 and float(duration[0]) > 0, 'missing engine duration')
    rows = [load_json(line.removeprefix('ORDERED_ACTIONS_OBSERVED ')) for line in lines if line.startswith('ORDERED_ACTIONS_OBSERVED ')]
    require(len(rows) == 1, 'missing/duplicate observed action evidence')
    row = rows[0]
    require(row.get('schemaVersion') == 1 and row.get('sdkVersion') == '8.5.3' and row.get('case') == case, 'wrong runtime version/case')
    hashes = {r['path']:r['sha256'] for r in manifest['files']}
    require(row.get('manifestSHA256') == manifest_sha and row.get('acceptedHashes') == hashes and row.get('resolution') == resolution, 'wrong accepted source/aspect')
    require(row.get('normalEntry') is True and row.get('startedFromMenu') is True, 'normal Story entry required')
    require(row.get('builtinsUnmodified') is True and row.get('observer') == 'sys.setprofile built-in action calls', 'action replacement is not independent observation')
    calls = row.get('calls', [])
    require(len(calls) == 8 and json.dumps([c.get('action') for c in calls],sort_keys=True) == json.dumps(manifest['actions'],sort_keys=True), 'actions did not execute exactly once in displayed order')
    require(all(type(c.get('panelVisible')) is bool for c in calls) and [c.get('panelVisible') for c in calls] == [False,False,False,True,True,True,False,False], 'Show/Hide order not observed')
    observations = row.get('observations', [])
    require(len(observations) == 3 and [o.get('step') for o in observations] == ['waiting','finished','settled'], 'missing waiting/settled observations')
    for observation in observations:
        waiting = observation['step'] == 'waiting'
        expected = dict(followingCount=0 if waiting else 1, doneCount=0, calls=0 if waiting else 8,
                        dialogVisible=waiting, panelVisible=False, ready=False, score='0' if waiting else '-7',
                        caption='Initial' if waiting else manifest['expected']['caption'])
        for field,value in expected.items():
            actual = observation.get(field)
            require(type(actual) is type(value) and actual == value, 'wrong observed state: ' + field)
    return row


def validate_bundle(root):
    manifest = load_json(portable_file(root, 'manifest.json').read_text(encoding='utf-8'))
    require(manifest.get('schemaVersion') == 1 and manifest.get('sdkVersion') == '8.5.3'
            and manifest.get('publicCoreRequests') is True and manifest.get('engineStarted') is False, 'wrong source provenance')
    require(manifest.get('runtimeReady') is True and manifest.get('normalStoryCallAdmitted') is True,
            'pre-integration export cannot qualify completed actions/Story Call')
    files = manifest.get('files', [])
    require(1 <= len(files) <= 32, 'unbounded/missing accepted inputs')
    hashes = {}
    def verify(record):
        path = portable_file(root, record['path'])
        require(type(record['bytes']) is int and 0 <= record['bytes'] <= 2_000_000 and path.stat().st_size == record['bytes'], 'wrong input size')
        require(re.fullmatch('[a-f0-9]{64}', record['sha256']) and digest(path) == record['sha256'], 'changed accepted input')
        return path
    for record in files:
        relative = record['path']
        require(relative.startswith('game/') and relative.endswith('.rpy') and relative not in hashes, 'unexpected/duplicate runnable input')
        verify(record); hashes[relative] = record['sha256']
    actual = set()
    for path in (root / 'game').rglob('*'):
        require(not path.is_symlink(), 'linked runnable input')
        if path.is_file(): actual.add(path.relative_to(root).as_posix())
    require(actual == set(hashes), 'missing/undeclared runnable input')
    metadata = {}
    for key,name in [('project','project.json'),('sourceMap','source-map.json'),('authoring','authoring.json')]:
        record = manifest['metadata'][key]
        require(record['path'] == name, 'wrong metadata sidecar')
        metadata[key] = load_json(verify(record).read_text(encoding='utf-8'))
    project,mapping,authoring = (metadata[k] for k in ('project','sourceMap','authoring'))
    require(mapping['schemaVersion'] == 8 and project['projectId'] == mapping['projectId'] == authoring['projectId'], 'wrong source identity')
    require(project['sdk'] == {'adapter':'renpy-8.5.3','version':'8.5.3'}, 'wrong pinned SDK')
    panel,dialog,entry = (manifest[k] for k in ('panel','dialog','entry'))
    owners = {o['id']:o for o in mapping['ownedScreens']}
    for owner,kind in [(panel,'panel'),(dialog,'dialog')]:
        expected = {k:owner[k] for k in ('id','rootId','name','path','kind')}
        require(owner['kind'] == kind and owners.get(owner['id']) == expected, 'wrong owned screen context')
        source = portable_file(root, owner['path']).read_text(encoding='utf-8')
        require('# loomlight-screen: ' + owner['id'] in source, 'missing screen source owner')
    require(project['entrySceneId'] == entry['id'] and entry['sourceRevision'] == hashes[entry['sourcePath']], 'wrong Story entry')
    bootstrap = portable_file(root,'game/script.rpy').read_text(encoding='utf-8-sig').splitlines()
    require(bootstrap[-2:] == ['label start:','    jump ' + entry['technicalLabel']], 'wrong normal start')
    target = manifest['finalTarget']
    binding = dict(screenId=dialog['id'], sourceName=dialog['name'])
    require(target['binding'] == binding and target['kind'] == 'dialog' and target['blocking'] is True
            and target['effects']['unknown'] is False and target['effects']['finishesInteraction'] is True, 'completed action effects must be known')
    require(target['revisions']['source'] == hashes[dialog['path']] and target['revisions']['sourceMap'] == manifest['metadata']['sourceMap']['sha256'], 'wrong action/identity revisions')
    beats = entry['beats']
    require([b['payload']['type'] for b in beats] == ['narration','callScreen','narration','narration','return'], 'wrong normal Story sequence')
    require([beats[i]['payload']['text'] for i in (0,2,3)] == ['OA_BEFORE','OA_AFTER','OA_DONE'], 'wrong continuation markers')
    require(beats[1]['protected'] is False and beats[1]['payload']['target'] == binding
            and beats[1]['payload']['revisions'] == target['revisions'], 'completed normal Call was not admitted')
    variables = {v['technicalName']:v for v in manifest['variables']}
    require(set(variables) == {'action_ready','action_score','action_caption'}, 'wrong variable fixtures')
    for variable in variables.values():
        require(variable in authoring['variables'] and variable['source']['sourceRevision'] == hashes[variable['source']['path']], 'wrong variable source mapping')
    require(len(manifest['actions']) == 8 and manifest['actions'][-1] == {'type':'finishInteraction'}, 'wrong bounded sequence')
    node = next((n for n in manifest['document']['screens'][0]['nodes'] if n['id'] == manifest['buttonId']), None)
    require(node is not None and node['actions'] == manifest['actions'], 'displayed and accepted actions disagree')
    return manifest


def inputs():
    material = process.inputs()
    for name in ('app/scripts/qualify-ordered-actions.py','app/scripts/test_qualify_ordered_actions.py'):
        material[name] = digest(REPO / name)
    return material


def validate_core_output(text, manifest_sha):
    require(text.splitlines().count('test ' + EXPORT_TEST + ' ... ok') == 1, 'required exporter missing/duplicated')
    require(len(re.findall(r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; \d+ filtered out; finished in [0-9.]+s',text)) == 1, 'wrong exporter completion')
    rows = [load_json(line.removeprefix('ORDERED_ACTIONS_FIXTURE ')) for line in text.splitlines() if line.startswith('ORDERED_ACTIONS_FIXTURE ')]
    require(rows == [dict(schemaVersion=1,manifestSHA256=manifest_sha,publicCoreRequests=True,engineStarted=False,runtimeReady=True)], 'wrong/incomplete exporter receipt')


def prepare(output, expected_candidate):
    output = base.fresh_output(output)
    result = dict(passed=False, engineStarted=False, sdkProcessesStarted=0, checks=[], candidate=expected_candidate)
    temporary = None
    try:
        record_environment(result)
        material = inputs(); process.require_candidate(expected_candidate, material)
        result['inputsSHA256'] = process.inputs_fingerprint(material)
        write_json(output / 'inputs.json',material)
        temporary = output / 'tmp'; temporary.mkdir()
        build = Path(os.environ.get('CARGO_TARGET_DIR',REPO / 'app/target')).resolve()
        require(build.is_relative_to(REPO),'build output must stay in this worktree')
        env = dict(os.environ,CARGO_TARGET_DIR=str(build),TMPDIR=str(temporary),TMP=str(temporary),TEMP=str(temporary),
                   PYTHONDONTWRITEBYTECODE='1',LOOMLIGHT_ACTIONS_FIXTURE_DIR=str(output / 'accepted'))
        spec = importlib.util.spec_from_file_location('source_binary_retention',REPO / 'app/scripts/qualify-screens-source.py')
        source_gate = importlib.util.module_from_spec(spec); spec.loader.exec_module(source_gate)
        def retain(text):
            binary = source_gate.retain_test_binary(text,output)
            if binary is not None: binary.update(candidate=expected_candidate,producingInputsSHA256=result['inputsSHA256'])
            result['testBinary'] = binary
        text = process.run_logged(output,'core-export',['cargo','test','-p','loomlight-core','--locked','--offline','--lib',
                  '--message-format=json',EXPORT_TEST,'--','--exact','--nocapture'],REPO / 'app',env,result['checks'],180,retain_output=retain)
        require(result.get('testBinary') is not None,'missing retained source producer binary')
        manifest = validate_bundle(output / 'accepted'); result['manifestSHA256'] = digest(output / 'accepted/manifest.json')
        validate_core_output(text,result['manifestSHA256'])
        require(inputs() == material,'producer inputs changed')
        process.validate_process_checks(result['checks'],['core-export'])
        process.require_candidate(expected_candidate,inputs())
        result.update(passed=True,acceptedFileCount=len(manifest['files']))
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__,message=str(error)); raise
    finally:
        process.finish_cleanup(result,temporary); write_json(output / 'result.json',result)
        require(result['cleanupComplete'],'source producer cleanup incomplete')


def validate_prepared(prepared, expected_candidate):
    result = load_json(portable_file(prepared,'result.json').read_text(encoding='utf-8'))
    validate_environment(result)
    material = inputs(); process.require_candidate(expected_candidate,material)
    fingerprint = process.inputs_fingerprint(material)
    require(result.get('candidate') == expected_candidate and result.get('inputsSHA256') == fingerprint,'wrong source candidate/fingerprint')
    require(result.get('passed') is True and result.get('engineStarted') is False and result.get('sdkProcessesStarted') == 0
            and result.get('cleanupComplete') is True,'incomplete offline producer')
    require(load_json(portable_file(prepared,'inputs.json').read_text(encoding='utf-8')) == material,'changed producer inputs')
    process.validate_process_checks(result.get('checks',[]),['core-export'])
    manifest = validate_bundle(prepared / 'accepted')
    require(digest(prepared / 'accepted/manifest.json') == result['manifestSHA256'],'changed source manifest')
    validate_core_output(portable_file(prepared,'core-export.log').read_text(encoding='utf-8'),result['manifestSHA256'])
    binary = result['testBinary']; process.validate_binary_binding(binary,expected_candidate,fingerprint)
    retained = portable_file(prepared,binary['path'])
    require(digest(retained) == binary['sha256'] and retained.stat().st_size == binary['bytes'],'changed source producer binary')
    return manifest


def stage_game(accepted, manifest, game):
    game.mkdir(parents=True,exist_ok=False)
    for record in manifest['files']:
        target = game / record['path']; target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(portable_file(accepted,record['path']),target)
    shutil.copyfile(accepted / 'manifest.json',game / 'accepted-runtime.json')
    for source,name in [('driver.rpy','zz_ordered_actions_driver.rpy'),('tests.rpy','zz_ordered_actions_tests.rpy')]:
        target = game / 'game' / name
        require(not target.exists(),'runtime fixture collision')
        shutil.copyfile(FIXTURE / source,target)


def qualify_sdk(args):
    require(args.allow_fixture_execution is True,'explicit reserved fixture execution required')
    prepared = args.prepared.resolve(); manifest = validate_prepared(prepared,args.expected_candidate)
    output = base.fresh_output(args.output)
    result = dict(passed=False,checks=[],runtimeObserved=[],sdkVersion='8.5.3',sdkSHA256=base.SDK_SHA256,
                  sdkLaunchAttempts=0,sdkProcessesStarted=0,sdkUncertainReservations=0,sdkRefusedLaunches=0,
                  helperStarts=0,nativeEditorLaunches=0,physicalInputProven=False,candidate=args.expected_candidate,
                  os=platform.system(),architecture=platform.machine(),manifestSHA256=digest(prepared / 'accepted/manifest.json'))
    temporary = None
    try:
        record_environment(result)
        sys.path.insert(0,str(REPO / 'spikes/renpy-sdk'))
        from archive_safety import expected_sha256, install_verified_tar
        from sdk_adapter import Command, command_argv, parse_version
        require(expected_sha256(args.checksums.read_text(encoding='utf-8'),args.archive.name) == base.SDK_SHA256,'SDK checksum pin mismatch')
        shutil.copyfile(prepared / 'inputs.json',output / 'inputs.json')
        shutil.copyfile(prepared / 'accepted/manifest.json',output / 'accepted-manifest.json')
        temporary = Path(tempfile.mkdtemp(prefix='ordered-actions-',dir=output))
        install_verified_tar(args.archive.resolve(),base.SDK_SHA256,temporary / 'sdk')
        sdk = temporary / 'sdk/renpy-8.5.3-sdk'; game = temporary / 'game-project'
        stage_game(prepared / 'accepted',manifest,game)
        env = dict(os.environ,RENPY_PATH_TO_SAVES=str(temporary / 'saves'),SDL_AUDIODRIVER='dummy',
                   PYTHONDONTWRITEBYTECODE='1',TMPDIR=str(temporary),TMP=str(temporary),TEMP=str(temporary))
        def run(name,command,timeout):
            return process.run_sdk_logged(result,output,name,command,sdk,env,timeout)
        parse_version(run('sdk-version',command_argv(sdk,Command.VERSION),30))
        run('sdk-compile',command_argv(sdk,Command.COMPILE,game,allow_project_execution=True),90)
        run('sdk-lint',command_argv(sdk,Command.LINT,game,allow_project_execution=True),90)
        hashes = {record['path']:record['sha256'] for record in manifest['files']}
        for resolution in RESOLUTIONS:
            env.update(LOOMLIGHT_ACTIONS_WIDTH=str(resolution[0]),LOOMLIGHT_ACTIONS_HEIGHT=str(resolution[1]))
            for case in CASES:
                name = f'{resolution[0]}x{resolution[1]}-{case}'
                text = run(name,command_argv(sdk,Command.TEST,game,testcase='ordered_actions::'+case,allow_project_execution=True),45)
                result['runtimeObserved'].append(validate_runtime_output(text,case,result['manifestSHA256'],manifest,resolution))
                require(all(digest(game / path) == sha for path,sha in hashes.items()),'accepted source changed')
        require({(r['case'],tuple(r['resolution'])) for r in result['runtimeObserved']} == {(c,tuple(r)) for c in CASES for r in RESOLUTIONS},'incomplete runtime matrix')
        names = ['sdk-version','sdk-compile','sdk-lint']+[f'{r[0]}x{r[1]}-{c}' for r in RESOLUTIONS for c in CASES]
        process.validate_process_checks(result['checks'],names)
        require(result['sdkProcessesStarted'] == 7 and result['sdkLaunchAttempts'] == 7
                and result['sdkUncertainReservations'] == 0 and result['sdkRefusedLaunches'] == 0,'wrong SDK accounting')
        require(inputs() == load_json((prepared / 'inputs.json').read_text(encoding='utf-8')),'source inputs changed during qualification')
        result.update(passed=True,acceptedSourceUnchanged=True)
    except BaseException as error:
        result['failure'] = dict(type=type(error).__name__,message=str(error)); raise
    finally:
        process.finish_cleanup(result,temporary);write_json(output / 'result.json',result)
        require(result['cleanupComplete'],'SDK process/scratch cleanup incomplete')


def main(argv=None):
    require(sys.version_info >= (3,11),'Python3.11 or later required')
    parser = argparse.ArgumentParser(description=__doc__);commands = parser.add_subparsers(dest='command',required=True)
    prepare_parser = commands.add_parser('prepare');prepare_parser.add_argument('--output',type=Path,required=True)
    validate_parser = commands.add_parser('validate');validate_parser.add_argument('--prepared',type=Path,required=True)
    sdk = commands.add_parser('sdk')
    for name in ('prepared','output','archive','checksums'): sdk.add_argument('--'+name,type=Path,required=True)
    sdk.add_argument('--allow-fixture-execution',action='store_true',required=True)
    for command in (prepare_parser,validate_parser,sdk): command.add_argument('--expected-candidate',required=True)
    args = parser.parse_args(argv)
    if args.command == 'prepare': prepare(args.output,args.expected_candidate)
    elif args.command == 'validate': validate_prepared(args.prepared.resolve(),args.expected_candidate)
    else: qualify_sdk(args)


if __name__ == '__main__': main()
