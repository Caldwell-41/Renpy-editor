"""Qualify public-transaction component output against independent literal SDK output.

--validate-only checks frozen inputs without installing or launching an SDK.
Execution needs --allow-fixture-execution, --sdk-process-limit 8, and verified
official archive/checksum inputs. It stops on the first failure without retries.
"""
import hashlib
import ast
import re
import uuid
import json
import math
import argparse
import platform
import subprocess
import sys
import textwrap
import tempfile
import os
import shutil
from pathlib import Path, PurePosixPath
from PIL import Image, ImageChops, __version__ as PILLOW_VERSION

REPO = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / 'spikes/renpy-sdk'))
from archive_safety import expected_sha256, install_verified_tar
from sdk_adapter import Command, command_argv, run_bounded

SDK_SHA = 'eb0a9be7f0fb13632fe25ceade9a8bed5a1b4d6b6e83bd19eeeb29e1a1bb4a45'
STAGES = ('shared', 'independent')
ASPECTS = ((1280, 720), (1024, 768))
SDK_VERSION = '8.5.3'
TEXTS = {'shared_output': 'Shared edited', 'independent_output': 'Independent copy'}
METADATA = {'.renpy-editor/project.json', '.renpy-editor/source-map.json', '.renpy-editor/authoring.json'}
BASE_SOURCES = {'game/chapters/chapter_01/scene_001.rpy', 'game/definitions/characters.rpy',
                'game/definitions/variables.rpy', 'game/gui.rpy', 'game/options.rpy', 'game/screens.rpy', 'game/script.rpy'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def canonical_id(value):
    require(isinstance(value, str) and str(uuid.UUID(value)) == value, 'noncanonical identity')
    return value


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'duplicate JSON evidence key')
        result[key] = value
    return result


def strict_json(text):
    def invalid_constant(value):
        raise ValueError('nonfinite JSON evidence')
    return json.loads(text, object_pairs_hook=unique_object, parse_constant=invalid_constant)


def hash_value(value):
    require(isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value), 'invalid revision')


def validate_core_output(text, accepted_digest):
    hash_value(accepted_digest)
    lines = text.splitlines()
    tokens = [line for line in lines if 'component-inputs-sha256:' in line]
    require(tokens == ['component-inputs-sha256: ' + accepted_digest], 'missing, duplicate or mixed-run receipt digest')
    name = 'screens::components::tests::runtime_fixtures::frozen_two_panel_outputs_come_from_actual_component_transactions'
    require([line for line in lines if line.startswith('test ') and ' ... ' in line] == [f'test {name} ... ok'], 'exact successful fixture required')
    summaries = [line for line in lines if line.startswith('test result:')]
    require(len(summaries) == 1 and re.fullmatch(r'test result: ok\. 1 passed; 0 failed; 0 ignored; 0 measured; [0-9]+ filtered out; finished in [0-9.]+s', summaries[0]), 'missing or failed fixture summary')
    require(lines.count('running 1 test') == 1 and 'FAILED' not in text, 'failed or mixed core run')


def validate_runtime_output(text, stage, width, height, accepted_digest, run_id):
    try:
        require(stage in STAGES and (width, height) in ASPECTS, 'unsupported runtime case')
        rows = [line.removeprefix('OWNED_COMPONENT_PROOF ') for line in text.splitlines() if line.startswith('OWNED_COMPONENT_PROOF ')]
        require(len(rows) == 1, 'missing or duplicate runtime proof')
        record = strict_json(rows[0])
        require(record['acceptedSHA256'] == accepted_digest and record['runId'] == run_id, 'mixed runtime receipt')
        require(record['stage'] == stage and record['aspect'] == [width, height], 'mixed runtime case')
        require(isinstance(record['sdkVersion'], str) and record['sdkVersion'].startswith(SDK_VERSION + '.'), 'wrong runtime SDK')
        expected = ['Shared edited', 'Shared edited' if stage == 'shared' else 'Independent copy']
        require(record['actualTexts'] == record['literalTexts'] == expected, 'wrong or missing runtime text output')
        require(record['metadataPresent'] is False, 'editor metadata entered runnable project')
        require(set(record['imageHashes']) == {'actual', 'literal'}, 'missing runtime screenshot hashes')
        for value in record['imageHashes'].values():
            hash_value(value)
        require(isinstance(record['renderer'], str) and bool(record['renderer'].strip()), 'missing renderer')
        physical = record['physical']
        require(isinstance(physical, list) and len(physical) == 2 and all(type(v) is int and v > 0 for v in physical), 'missing physical dimensions')
        scale = record['drawPerVirtual']
        values = scale if isinstance(scale, list) else [scale]
        require(len(values) in (1, 2) and all(type(v) in (float, int) and math.isfinite(v) and v > 0 for v in values), 'missing draw scale')
        return record
    except (KeyError, TypeError, AttributeError) as error:
        raise ValueError('malformed runtime proof') from error


def validate_images(output, stage, width, height):
    images, hashes = [], {}
    for name in ('actual', 'literal'):
        path = output / f'{stage}-{width}x{height}-{name}.png'
        try:
            with Image.open(path) as image:
                require(image.size == (width, height), 'wrong screenshot dimensions')
                images.append(image.convert('RGBA'))
            hashes[name] = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError as error:
            raise ValueError('missing or invalid screenshot') from error
    require(ImageChops.difference(*images).getextrema() == ((0, 0),) * 4, 'literal reference pixels differ')
    for x in (40, 680):
        crop = images[0].crop((x, 40, min(x + 500, width), 220))
        require(any(band.getbbox() for band in crop.split()[:3]) and crop.getchannel('A').getbbox(), 'missing visible output at panel position')
    return dict(stage=stage, aspect=[width, height], differingPixels=0, imageHashes=hashes)


def parse_source(text, owner):
    """Recognize only the frozen two-panel qualification profile, without rewriting it."""
    lines = text.splitlines(keepends=True)
    require(len(lines) >= 3 and text.endswith('\n'), 'incomplete owned declaration')
    require(lines[0].lstrip('\ufeff').rstrip('\r\n') == f'# loomlight-screen: {owner["id"]}', 'owner marker mismatch')
    require(lines[1].rstrip('\r\n') == f'screen {owner["name"]}():', 'wrong owned declaration')
    body = []
    for raw in lines[2:]:
        code = raw.rstrip('\r\n')
        if not code.strip() or code.lstrip().startswith('#'):
            continue
        if code.strip() == 'pass':
            require(code in ('    pass', '        pass'), 'unsupported fixture indentation')
            continue
        body.append((code, raw))
    container = 'fixed' if owner['kind'] == 'panel' else 'vbox'
    require(bool(body), 'missing fixture body')
    match = re.fullmatch(rf'    {container}: # loomlight-element: (\S+)', body[0][0])
    require(match is not None, 'unsupported fixture container')
    parent_id = canonical_id(match[1])
    if container == 'fixed':
        require(len(body) == 6, 'unsupported fixture statements')
        properties = {}
        for code, _ in body[1:-1]:
            match = re.fullmatch(r'        (xpos|ypos|xsize|ysize) ([0-9]+)', code)
            require(match is not None and match[1] not in properties, 'unsupported fixture property')
            properties[match[1]] = int(match[2])
        require(properties == dict(xpos=40 if owner['name'] == 'notes' else 680, ypos=40, xsize=500, ysize=180), 'wrong panel placement')
        match = re.fullmatch(r'        use ([A-Za-z_][A-Za-z0-9_]*) # loomlight-element: (\S+)', body[-1][0])
        require(match is not None, 'unsupported fixture use')
        return dict(ids=[parent_id, canonical_id(match[2])], parentId=parent_id,
                    useId=match[2], componentName=match[1], useLine=body[-1][1])
    require(len(body) == 2, 'unsupported component body')
    match = re.fullmatch(r'        text (.+) # loomlight-element: (\S+)', body[1][0])
    require(match is not None, 'unsupported component text')
    try:
        literal = ast.literal_eval(match[1])
    except (SyntaxError, ValueError) as error:
        raise ValueError('component text must be literal') from error
    require(literal == TEXTS[owner['name']], 'wrong component literal')
    return dict(ids=[parent_id, canonical_id(match[2])], literal=literal)


def validate_stage(accepted, stage, snapshot, parsed):
    files, catalog = snapshot['files'], snapshot['catalog']
    require(METADATA <= set(files), 'missing metadata evidence')
    mapping = strict_json(files['.renpy-editor/source-map.json']['text'])
    project = strict_json(files['.renpy-editor/project.json']['text'])
    require(mapping['schemaVersion'] == 7, 'wrong source-map schema')
    require(canonical_id(project['projectId']) == mapping['projectId'], 'wrong project identity')
    require(project['sdk']['version'] == SDK_VERSION and project['sdk']['adapter'] == 'renpy-8.5.3', 'wrong project SDK')
    require(project['resolution'] == dict(width=1280, height=720), 'wrong source resolution')
    owners = mapping['ownedScreens']
    identities = [canonical_id(owner[key]) for owner in owners for key in ('id', 'rootId')]
    require(len(identities) == len(set(identities)), 'aliased owned identity')
    require(len(owners) == len(catalog['owned']), 'missing owned metadata')
    by_name = {owner['name']: owner for owner in owners}
    require(set(by_name) == set(parsed) and len(by_name) == len(owners), 'duplicate owned metadata')
    for owner in catalog['owned']:
        require(all(owner[key] == by_name[owner['name']][key] for key in ('id', 'rootId', 'name', 'path', 'kind')), 'owner metadata mismatch')
    require(len(set(mapping['sources'])) == len(mapping['sources']) and set(o['path'] for o in owners) <= set(mapping['sources']) <= set(files), 'missing or duplicate source-map path')
    node_ids = [value for nodes in parsed.values() for value in nodes['ids']]
    require(len(node_ids) == len(set(node_ids)) and set(node_ids).isdisjoint(identities), 'aliased source element identity')
    require(accepted['screenNames'] == ['notes', 'other'], 'wrong panel names')
    require(len(accepted['componentIds']) == 2 and len(set(accepted['componentIds'])) == 2, 'wrong component identities')
    require(by_name['shared_output']['id'] == accepted['componentIds'][0], 'wrong shared component')
    if stage == 'independent':
        require(by_name['independent_output']['id'] == accepted['componentIds'][1], 'wrong independent component')
    require(len(accepted['useIds']) == 2 and len(set(accepted['useIds'])) == 2, 'wrong use identities')
    uses = mapping['componentUses']
    require(len(uses) == 2, 'missing or duplicate bound use')
    positions = []
    for index, name in enumerate(['notes', 'other']):
        owner, nodes = by_name[name], parsed[name]
        component_name = 'independent_output' if stage == 'independent' and index == 1 else 'shared_output'
        require(nodes['componentName'] == component_name and nodes['useId'] == accepted['useIds'][index], 'wrong source use')
        binding = dict(screenId=owner['id'], nodeId=nodes['useId'], componentId=by_name[component_name]['id'])
        require(uses.count(binding) == 1, 'bound use metadata mismatch')
        positions.append(dict(screenId=owner['id'], parentId=nodes['parentId'], x=40 if index == 0 else 680, y=40))
    require(accepted['positions'] == positions, 'position identity mismatch')
    require(catalog['projectRevision'] == files['.renpy-editor/project.json']['sha256'], 'project revision mismatch')
    require(catalog['sourceMapRevision'] == files['.renpy-editor/source-map.json']['sha256'], 'source-map revision mismatch')
    hash_value(catalog['inventoryRevision'])
    targets = snapshot['targets']
    require(len(targets) == 2 and {target['binding']['sourceName'] for target in targets} == {'notes', 'other'}, 'missing or duplicate panel target')
    for target in targets:
        name = target['binding']['sourceName']
        owner, nodes = by_name[name], parsed[name]
        require(target['binding'] == dict(screenId=owner['id'], sourceName=name), 'wrong target binding')
        require(target['kind'] == 'panel' and target['path'] == owner['path'] and target['rootId'] == owner['rootId'], 'wrong target ownership')
        revisions, effects = target['revisions'], target['effects']
        require(revisions['source'] == files[owner['path']]['sha256'], 'target source revision mismatch')
        require(revisions['sourceMap'] == catalog['sourceMapRevision'] and revisions['inventory'] == catalog['inventoryRevision'], 'target metadata revision mismatch')
        require(effects['unknown'] is False and effects['hiddenScreens'] == [], 'nonpassive fixture effects')
        hash_value(effects['revision'])
        require(revisions['effects'] == effects['revision'], 'effect revision mismatch')
        component = by_name[nodes['componentName']]
        expected = {owner['id']: files[owner['path']]['sha256'], nodes['useId']: sha256(nodes['useLine']), component['id']: files[component['path']]['sha256']}
        dependencies = effects['dependencies']
        require(len(dependencies) == 3 and {row['id']: row['revision'] for row in dependencies} == expected, 'binding dependency mismatch')
    return mapping


def _validate_inputs(accepted):
    require(accepted['publicCoreRequests'] is True and accepted['executedSdk'] is False, 'public core preparation required')
    require(accepted['sdkVersion'] == SDK_VERSION, 'wrong pinned SDK')
    require(set(accepted['stages']) == set(STAGES), 'missing or extra stage')
    result, mappings = {}, {}
    for stage in STAGES:
        snapshot = accepted['stages'][stage]
        require(len(snapshot['files']) <= 128 and METADATA <= set(snapshot['files']), 'missing or oversized source set')
        require(len({path.casefold() for path in snapshot['files']}) == len(snapshot['files']), 'duplicate portable path')
        for path, record in snapshot['files'].items():
            relative = PurePosixPath(path)
            require(relative.as_posix() == path and not relative.is_absolute() and not ({'.', '..'} & set(relative.parts)) and '\\' not in path and '\0' not in path, 'unsafe source path')
            require(path in METADATA or path.startswith('game/') and path.endswith('.rpy'), 'unexpected source file')
            require(sha256(record['text']) == record['sha256'], 'source hash mismatch')
        owners = snapshot['catalog']['owned']
        require(len(owners) == (3 if stage == 'shared' else 4), 'wrong owned source count')
        names = {'notes', 'other', 'shared_output'} | ({'independent_output'} if stage == 'independent' else set())
        require({owner['name'] for owner in owners} == names, 'wrong owned names')
        sources, parsed = {}, {}
        for owner in owners:
            path = owner['path']
            require(path == f'game/ui/{owner["name"]}.rpy', 'wrong owned source path')
            require(owner['resolved'] is True, 'unresolved owned source')
            require(path not in sources, 'duplicate owned source')
            require(path in snapshot['files'], 'missing owned source')
            record = snapshot['files'][path]
            require(record['sha256'] == owner['sourceRevision'], 'owner source revision mismatch')
            expected_kind = 'panel' if owner['name'] in ('notes', 'other') else 'component'
            require(owner['kind'] == expected_kind, 'wrong owned role')
            parsed[owner['name']] = parse_source(record['text'], owner)
            sources[path] = record['text']
        require({path for path in snapshot['files'] if path.startswith('game/ui/')} == set(sources), 'extra UI source')
        require(set(snapshot['files']) <= METADATA | BASE_SOURCES | set(sources), 'extra unaccounted script')
        mappings[stage] = validate_stage(accepted, stage, snapshot, parsed)
        result[stage] = sources
    before, after = mappings['shared'], mappings['independent']
    require(all(owner in after['ownedScreens'] for owner in before['ownedScreens']), 'copy changed original ownership')
    require({k: v for k, v in before.items() if k not in ('sources', 'ownedScreens', 'componentUses')} == {k: v for k, v in after.items() if k not in ('sources', 'ownedScreens', 'componentUses')}, 'copy changed unrelated metadata')
    require(set(after['sources']) == set(before['sources']) | {'game/ui/independent_output.rpy'}, 'wrong copy source scope')
    for path in ('game/ui/notes.rpy', 'game/ui/shared_output.rpy'):
        require(result['shared'][path] == result['independent'][path], 'copy changed original or other use')
    require(result['shared']['game/ui/other.rpy'].replace('use shared_output #', 'use independent_output #') == result['independent']['game/ui/other.rpy'], 'copy changed more than selected use')
    shared_files, independent_files = (accepted['stages'][stage]['files'] for stage in STAGES)
    require(set(independent_files) == set(shared_files) | {'game/ui/independent_output.rpy'}, 'wrong copy file set')
    for path in set(shared_files) - {'.renpy-editor/source-map.json', 'game/ui/other.rpy'}:
        require(accepted['stages']['shared']['files'][path] == accepted['stages']['independent']['files'][path], 'copy changed unrelated project metadata')
    return result


def validate_inputs(accepted):
    try:
        return _validate_inputs(accepted)
    except (KeyError, IndexError, TypeError, AttributeError) as error:
        raise ValueError('missing or malformed input evidence') from error


def read_bounded(path, limit):
    with path.open('rb') as stream:
        data = stream.read(limit + 1)
    require(len(data) <= limit, 'oversized input evidence')
    return data


def prepare_runtime_project(project, sources, stage, width, height, output, receipt):
    """Write exact accepted UI files and separate trusted proof code, without execution."""
    require(stage in STAGES and (width, height) in ASPECTS, 'unsupported proof case')
    project.mkdir(parents=True, exist_ok=False)
    game = project / 'game'
    game.mkdir()
    for path, text in sources.items():
        target = project / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(text.encode('utf-8'))
    reference = REPO / f'tests/fixtures/phase-3b-screens/components/reference-{stage}.rpy'
    (game / 'reference.rpy').write_bytes(reference.read_bytes())
    (game / 'options.rpy').write_text(
        'define config.name = "Loomlight owned component proof"\n'
        f'define config.screen_width = {width}\ndefine config.screen_height = {height}\n'
        'define config.save_directory = None\ndefine config.sound = False\n', encoding='utf-8')
    captures = {name: str(output / f'{stage}-{width}x{height}-{name}.png') for name in ('actual', 'literal')}
    record = dict(receipt, stage=stage, aspect=[width, height])
    proof = '''init python:
    def owned_component_texts(displayable):
        found = []
        active = set()
        remaining = [1024]
        def walk(node, depth):
            remaining[0] -= 1
            if remaining[0] < 0 or depth > 64 or id(node) in active:
                raise ValueError("unbounded runtime displayable tree")
            active.add(id(node))
            try:
                if isinstance(node, renpy.text.text.Text):
                    if not all(isinstance(part, str) for part in node.text):
                        raise ValueError("unexpected embedded text displayable")
                    found.append("".join(node.text))
                else:
                    for child in node.visit():
                        walk(child, depth + 1)
            finally:
                active.remove(id(node))
        walk(displayable, 0)
        return found

    def owned_component_finish_proof():
        try:
            import hashlib
            import json
            import os
            captures = CAPTURES
            record = RECORD
            texts = {}
            hashes = {}
            for name, screen_name in [("actual", "owned_component_actual_pair"), ("literal", "owned_component_literal_pair")]:
                screen = renpy.get_screen(screen_name)
                if screen is None:
                    raise ValueError("missing proof screen")
                render = renpy.render(screen, config.screen_width, config.screen_height, 0, 0)
                renpy.render_to_file(render, captures[name], resize=True)
                texts[name] = owned_component_texts(screen)
                with open(captures[name], "rb") as stream:
                    hashes[name] = hashlib.sha256(stream.read()).hexdigest()
            record.update(sdkVersion=renpy.version_only, renderer=renpy.get_renderer_info()["renderer"],
                          physical=list(renpy.get_physical_size()), drawPerVirtual=renpy.display.draw.draw_per_virt,
                          actualTexts=texts["actual"], literalTexts=texts["literal"], imageHashes=hashes,
                          metadataPresent=os.path.exists(os.path.join(config.basedir, ".renpy-editor")))
            print("OWNED_COMPONENT_PROOF " + json.dumps(record), flush=True)
        except BaseException:
            __import__("traceback").print_exc()
            renpy.quit(status=61, save=False)
        renpy.quit(status=0, save=False)

screen owned_component_actual_pair():
    use notes
    use other

screen owned_component_finish():
    timer 0.5 action Function(owned_component_finish_proof)
'''.replace('CAPTURES', repr(captures)).replace('RECORD', repr(record))
    # Only trusted fixture Python is parsed here. Exported project source is data.
    ast.parse(textwrap.dedent(proof.removeprefix('init python:\n').split('\nscreen owned_component_actual_pair():')[0]))
    (game / 'proof.rpy').write_text(proof, encoding='utf-8')
    (game / 'script.rpy').write_text('''label start:
    $ renpy.set_physical_size((config.screen_width, config.screen_height))
    $ renpy.display.interface.set_mode()
    show screen owned_component_actual_pair
    show screen owned_component_literal_pair
    show screen owned_component_finish
    $ renpy.pause(hard=True)
    return
''', encoding='utf-8')
    return runtime_source_hashes(project)


def runtime_source_hashes(project):
    return {p.relative_to(project).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((project / 'game').rglob('*.rpy'))}


def execute_qualification(args, output, result):
    """Only called after explicit execution admission; never retries a failed attempt."""
    result['cleanupComplete'] = False
    scratch = None
    try:
        with tempfile.TemporaryDirectory(prefix='.component-proof-', dir=output) as temporary:
            scratch = Path(temporary)
            result['sdkArchiveSHA256'] = install_verified_tar(args.archive, SDK_SHA, scratch / 'sdk')
            sdk = scratch / 'sdk/renpy-8.5.3-sdk'
            env = dict(os.environ, SDL_AUDIODRIVER='dummy', RENPY_RENDERER='angle2' if platform.system() == 'Windows' else 'gl2',
                       RENPY_SCALE_FACTOR='1', RENPY_DISABLE_SOUND='1', RENPY_SKIP_MAIN_MENU='1', RENPY_SKIP_SPLASHSCREEN='1')
            env.pop('SDL_VIDEODRIVER', None)
            env.pop('SDL_RENDER_DRIVER', None)
            for stage in STAGES:
                for width, height in ASPECTS:
                    case = f'{stage}-{width}x{height}'
                    project = scratch / case
                    # Use the preflighted runnable bytes, separate from bytecode and saves.
                    shutil.copytree(output / 'runnable' / case, project)
                    hashes = result['runtimeProjectSHA256'][case]
                    env['RENPY_PATH_TO_SAVES'] = str(scratch / ('saves-' + case))
                    commands = [Command.COMPILE, Command.LINT] if (width, height) == ASPECTS[0] else []
                    for command in [*commands, Command.RUN]:
                        require(result['sdkProcesses'] < args.sdk_process_limit, 'SDK process allocation exhausted')
                        require(not (project / '.renpy-editor').exists(), 'metadata in runnable project')
                        require(runtime_source_hashes(project) == hashes, 'runnable bytes changed before SDK launch')
                        argv = command_argv(sdk, command, project, allow_project_execution=True)
                        row = dict(stage=stage, aspect=[width, height], name=command.value, outcome='unknown')
                        result['commands'].append(row)
                        # Charge before handing off to the adapter. An uncertain start still consumes the allocation.
                        result['sdkProcesses'] += 1
                        result['executedSdk'] = True
                        previous = dict(os.environ)
                        try:
                            os.environ.clear()
                            os.environ.update(env)
                            observed = run_bounded(argv, timeout_seconds=60, output_limit=2_000_000)
                        finally:
                            os.environ.clear()
                            os.environ.update(previous)
                        (output / f'{case}-{command.value}.log').write_text(observed.output, encoding='utf-8')
                        row.update(outcome='returned', exitCode=observed.exit_code, timedOut=observed.timed_out,
                                   outputLimited=observed.output_limited, durationSeconds=observed.duration_seconds)
                        require(not observed.exit_code and not observed.timed_out and not observed.output_limited, 'SDK command failed; no automatic retry')
                        require(runtime_source_hashes(project) == hashes and not (project / '.renpy-editor').exists(), 'SDK changed accepted runnable input')
                        if command is Command.RUN:
                            record = validate_runtime_output(observed.output, stage, width, height, result['acceptedSHA256'], result['runId'])
                            images = validate_images(output, stage, width, height)
                            require(record['imageHashes'] == images['imageHashes'], 'runtime screenshot hashes do not match attached images')
                            result['records'].append(dict(record, differingPixels=images['differingPixels']))
            require(len(result['commands']) == result['sdkProcesses'] == 8, 'missing SDK command evidence')
            require(len(result['records']) == 4 and {(r['stage'], tuple(r['aspect'])) for r in result['records']} == {(s, a) for s in STAGES for a in ASPECTS}, 'missing or duplicate runtime case')
        result['passed'] = True
    finally:
        result['scratchCleanupComplete'] = scratch is not None and not scratch.exists()
        result['cleanupComplete'] = result['scratchCleanupComplete'] and all(row['outcome'] == 'returned' for row in result['commands'])


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--validate-only', action='store_true')
    mode.add_argument('--allow-fixture-execution', action='store_true')
    for name in ('accepted', 'core-log', 'output'):
        parser.add_argument('--' + name, required=True, type=Path)
    for name in ('archive', 'checksums'):
        parser.add_argument('--' + name, type=Path)
    parser.add_argument('--candidate', help='Expected full checkout SHA; defaults to current HEAD')
    parser.add_argument('--sdk-process-limit', type=int)
    args = parser.parse_args(argv)
    accepted_bytes = read_bounded(args.accepted, 4_000_000)
    accepted_digest = hashlib.sha256(accepted_bytes).hexdigest()
    sources = validate_inputs(strict_json(accepted_bytes.decode('utf-8')))
    core_bytes = read_bounded(args.core_log, 2_000_000)
    validate_core_output(core_bytes.decode('utf-8'), accepted_digest)
    candidate = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=REPO, text=True).strip()
    require(re.fullmatch('[0-9a-f]{40}', candidate) and args.candidate in (None, candidate), 'candidate does not match checkout')
    if args.allow_fixture_execution:
        require(args.sdk_process_limit == 8 and args.archive is not None and args.checksums is not None, 'execution requires an explicit eight-process allocation and verified archive inputs')
        require(expected_sha256(read_bounded(args.checksums, 100_000).decode('utf-8'), args.archive.name) == SDK_SHA, 'wrong official SDK checksum')
    output = args.output.resolve()
    require(output.is_relative_to(REPO) and output != REPO and not output.exists(), 'output must be fresh and local to this worktree')
    output.mkdir(parents=True)
    source_paths = sorted([*REPO.glob('app/src-core/src/screens*.rs'), *REPO.glob('app/src-core/src/screens/*.rs')])
    result = dict(passed=False, inputsValidated=True, executedSdk=False, sdkProcesses=0, commands=[], records=[],
                  runId=str(uuid.uuid4()), runtimeProjectSHA256={},
                  cleanupComplete=True, scratchCleanupComplete=True, candidate=candidate, acceptedSHA256=accepted_digest,
                  coreLogSHA256=hashlib.sha256(core_bytes).hexdigest(), checkerSHA256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  sourceFilesSHA256={p.relative_to(REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in source_paths},
                  os=platform.system(), architecture=platform.machine(),
                  plannedCases=[dict(stage=stage, aspect=list(aspect)) for stage in STAGES for aspect in ASPECTS],
                  plannedSdkProcesses=8)
    evidence_paths = [REPO / 'spikes/renpy-sdk/archive_safety.py', REPO / 'spikes/renpy-sdk/sdk_adapter.py',
                      *sorted((REPO / 'tests/fixtures/phase-3b-screens/components').glob('reference-*.rpy'))]
    result['proofFilesSHA256'] = {p.relative_to(REPO).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in evidence_paths}
    result['pythonVersion'] = platform.python_version()
    result['pillowVersion'] = PILLOW_VERSION
    (output / 'accepted.json').write_bytes(accepted_bytes)
    (output / 'core.log').write_bytes(core_bytes)
    try:
        for stage in STAGES:
            for width, height in ASPECTS:
                case = f'{stage}-{width}x{height}'
                result['runtimeProjectSHA256'][case] = prepare_runtime_project(
                    output / 'runnable' / case, sources[stage], stage, width, height, output,
                    dict(acceptedSHA256=accepted_digest, runId=result['runId']))
        if args.allow_fixture_execution:
            execute_qualification(args, output, result)
    finally:
        (output / 'result.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    return result


if __name__ == '__main__':
    main()
