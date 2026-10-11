#!/usr/bin/env python3
"""Run exact synthetic accepted source, with editor metadata absent, on pinned Ren'Py."""
import argparse
import ast
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile


def validate_fixture(value):
    assert set(value) == {'schemaVersion', 'source', 'scenes', 'sourceSHA256'}
    assert type(value['schemaVersion']) is int and value['schemaVersion'] == 1
    source, scenes = value['source'], value['scenes']
    assert isinstance(source, dict) and 8 <= len(source) <= 12 and len(scenes) == 2
    assert set(value['sourceSHA256']) == set(source)
    for path, text in source.items():
        parts = path.split('/')
        assert parts[0] == 'game' and all(p and p not in ('.', '..') and ':' not in p and '\\' not in p for p in parts)
        assert path.endswith('.rpy') and isinstance(text, str) and len(text.encode()) <= 2 * 1024 * 1024
        assert hashlib.sha256(text.encode()).hexdigest() == value['sourceSHA256'][path]
    assert {'game/script.rpy', 'game/definitions/characters.rpy', 'game/definitions/variables.rpy'} <= set(source)
    labels = set()
    for scene in scenes:
        assert set(scene) == {'id', 'label', 'path'} and scene['path'] in source
        assert re.fullmatch(r'loomlight_scene_[0-9a-f]{32}', scene['label'])
        assert scene['label'] not in labels
        labels.add(scene['label'])
    return source, scenes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--sdk', type=Path, required=True)
    parser.add_argument('--fixture', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    source, scenes = validate_fixture(json.loads(args.fixture.read_text()))
    sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'spikes/renpy-sdk'))
    from sdk_adapter import launcher_for
    launcher = launcher_for(args.sdk)
    args.output.mkdir(parents=True, exist_ok=False)
    count = 0
    with tempfile.TemporaryDirectory(prefix='loomlight-phase2-sdk-') as temp:
        root = Path(temp)
        (root / 'game').mkdir()
        def run(arguments, timeout=90):
            nonlocal count
            count += 1
            result = subprocess.run([*launcher, *map(str, arguments)], cwd=args.sdk.resolve(), capture_output=True, text=True, timeout=timeout)
            (args.output / f'command-{count}.log').write_text(result.stdout + result.stderr)
            assert result.returncode == 0, f'Integrated SDK command {count} failed'
            return result.stdout + result.stderr
        run(['launcher', 'generate_gui', root, '--width', '1280', '--height', '720', '--template', args.sdk.resolve() / 'gui', '--start'])
        run([root, 'gui_images'])
        # The editor fixture has empty GUI scaffolding; the same standard template
        # used by accepted individual SDK cases supplies that scaffolding only.
        scaffold = {'game/gui.rpy', 'game/screens.rpy', 'game/options.rpy'}
        for path, text in source.items():
            if path in scaffold and not text:
                continue
            target = root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(text.encode())
            assert hashlib.sha256(target.read_bytes()).hexdigest() == hashlib.sha256(text.encode()).hexdigest()
        assert not (root / '.renpy-editor').exists()
        # Runtime assertions are in a separate test file; accepted game source is
        # never rewritten. Start both the entry path and the new draft explicitly.
        def narration(prefix):
            rows = [line.strip() for text in source.values() for line in text.splitlines() if line.strip().startswith('"' + prefix)]
            assert rows and len(set(rows)) == 1
            return ast.literal_eval(rows[0])
        rewrite_text = narration('Integrated literal')
        new_text = narration('Integrated new')
        dialogue_rows = [line.strip().partition('"')[2] for text in source.values() for line in text.splitlines() if line.strip().startswith('bec "Second literal')]
        assert dialogue_rows and len(set(dialogue_rows)) == 1
        dialogue_text = ast.literal_eval('"' + dialogue_rows[0])
        runtime = """init 999 python:
    from renpy import substitutions as _phase2_substitutions
    from renpy.text import textsupport as _phase2_textsupport
    from renpy.text.textsupport import TEXT, TAG
    _phase2_runtime = []
    for _input, _expected, _tags in CASES:
        _value = _phase2_substitutions.substitute(_input, scope={"flag": True}, force=True, translate=False)[0]
        _tokens = _phase2_textsupport.tokenize(_value)
        assert [v for k, v in _tokens if k == TAG] == _tags, "Integrated generated markup became active"
        assert "".join(v for k, v in _tokens if k == TEXT) == _expected, "Integrated prose changed display meaning"
        _phase2_runtime.append(_value)
""".replace('CASES', repr([(rewrite_text, 'Integrated literal [str(7)] {a=jump:label} café 雪 True friend [literal] {brace}', ['b', '/b']), (new_text, 'Integrated new [str(7)] {b}literal{/b} café 雪', []), (dialogue_text, 'Second literal [flag] {b}line{/b}', [])]))
        test = runtime + '''testcase loomlight_phase2_integrated:
    assert screen "main_menu"
    click "Start"
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == "True café 雪") timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == "True café 雪")
    advance
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _phase2_runtime[0]) timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == _phase2_runtime[0])
    advance
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _phase2_runtime[1]) timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == _phase2_runtime[1])
    advance
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _phase2_runtime[2]) timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == _phase2_runtime[2])
    advance until screen "main_menu"
    assert screen "main_menu"
    run Start(DRAFT_LABEL)
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _phase2_runtime[1]) timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == _phase2_runtime[1])
    advance
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _phase2_runtime[2]) timeout 10
    assert eval (renpy.get_screen("say").scope["what"] == _phase2_runtime[2])
    advance until screen "main_menu"
    assert screen "main_menu"
testsuite global:
    teardown:
        exit
'''.replace('DRAFT_LABEL', repr(scenes[1]['label']))
        (root / 'game/phase2_test.rpy').write_text(test)
        run([root, 'compile'])
        run([root, 'lint', '--error-code'])
        output = run([root, 'test', 'loomlight_phase2_integrated'], timeout=120)
        assert '[rpytest] Status: PASSED' in output and 'loomlight_phase2_integrated' in output
        for path, text in source.items():
            if path in scaffold and not text:
                continue
            assert (root / path).read_bytes() == text.encode(), 'SDK changed accepted source'
        (args.output / 'result.json').write_text(json.dumps({'passed': True, 'sdkVersion': '8.5.3', 'commands': count, 'metadataAbsent': True, 'acceptedSourceUnchanged': True, 'sourceSHA256': {p: hashlib.sha256(t.encode()).hexdigest() for p,t in source.items()}, 'scaffoldOnly': sorted(scaffold)}, indent=2) + '\n')
    print('PASS: pinned Ren’Py integrated exact accepted source/entry rewrite/Continue/Draft/Return/literal text/metadata-free runtime/owned cleanup')


if __name__ == '__main__':
    main()
