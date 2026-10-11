"""Pinned SDK execution of exact accepted create/update candidates, metadata absent."""
import argparse, ast, hashlib, json, re, subprocess, sys, tempfile
from pathlib import Path

def validate(value):
    assert set(value)=={'schemaVersion','cases'} and value['schemaVersion']==1 and len(value['cases'])==2
    for case in value['cases']:
        assert set(case)=={'schemaVersion','source','sourceSHA256','scenes'} and case['schemaVersion']==1
        assert set(case['source'])==set(case['sourceSHA256']) and len(case['scenes'])==1
        assert 6<=len(case['source'])<=12
        for path,text in case['source'].items():
            assert path.startswith('game/') and path.endswith('.rpy') and '\\' not in path and ':' not in path
            assert all(p not in ('','.','..') for p in path.split('/')) and isinstance(text,str) and len(text.encode())<=2*1024*1024
            assert hashlib.sha256(text.encode()).hexdigest()==case['sourceSHA256'][path]
        scene=case['scenes'][0];assert set(scene)=={'id','label','path'} and scene['path'] in case['source']
        assert re.fullmatch('loomlight_scene_[0-9a-f]{32}',scene['label'])
    return value['cases']

def main():
    p=argparse.ArgumentParser();p.add_argument('--sdk',type=Path,required=True);p.add_argument('--fixture',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    cases=validate(json.loads(a.fixture.read_text()));a.output.mkdir(parents=True,exist_ok=False)
    sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'spikes/renpy-sdk'));from sdk_adapter import launcher_for
    launcher=launcher_for(a.sdk);count=0;results=[]
    with tempfile.TemporaryDirectory(prefix='loomlight-selectable-sdk-') as temp:
        for i,case in enumerate(cases):
            root=Path(temp)/str(i);(root/'game').mkdir(parents=True)
            def run(args,timeout=120):
                nonlocal count
                count+=1;r=subprocess.run([*launcher,*map(str,args)],cwd=a.sdk.resolve(),capture_output=True,text=True,timeout=timeout)
                (a.output/f'command-{count}.log').write_text(r.stdout+r.stderr);assert r.returncode==0,f'SDK command {count} failed';return r.stdout+r.stderr
            run(['launcher','generate_gui',root,'--width','1280','--height','720','--template',a.sdk.resolve()/'gui','--start']);run([root,'gui_images'])
            scaffold={'game/gui.rpy','game/screens.rpy','game/options.rpy'}
            for path,text in case['source'].items():
                if path in scaffold and not text:continue
                target=root/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(text.encode())
            assert not (root/'.renpy-editor').exists()
            rows=[];speakers=[]
            names={}
            for line in case['source']['game/definitions/characters.rpy'].splitlines():
                m=re.fullmatch(r'define ([a-zA-Z_][a-zA-Z0-9_]*) = Character\(("(?:[^"\\]|\\.)*"), color="#[0-9a-f]{6}"\)',line)
                if m:names[m[1]]=ast.literal_eval(m[2])
            for line in case['source'][case['scenes'][0]['path']].splitlines():
                line=line.strip()
                if line.startswith('"Selectable ') or line.startswith('selectable_new "Selectable ') or line.startswith('bec "Selectable '):
                    raw=line[line.index('"'):];rows.append(ast.literal_eval(raw));speakers.append(line[:line.index('"')].strip() or None)
            expected=[f'Selectable 0 [str(7)] café 雪 True friend [literal] {{brace}}', 'Selectable 1 [str(7)] café 雪 ']
            if i==1:expected+=['Selectable 2 [str(7)] café 雪 ','Selectable 3 [str(7)] café 雪 ']
            expected+=['Selectable insertion [str(7)] {b}literal{/b} 雪','Selectable group narration']
            assert len(rows)==len(expected)
            runtime='''init 999 python:
    from renpy import substitutions as _sel_substitutions
    from renpy.text import textsupport as _sel_textsupport
    from renpy.text.textsupport import TEXT, TAG
    _who_values = {}
    for _speaker, (_input, _expected) in NAMES.items():
        _value = _sel_substitutions.substitute(_input, force=True, translate=False)[0]
        _tokens = _sel_textsupport.tokenize(_value)
        assert not [v for k,v in _tokens if k == TAG], "Generated Character name tags became active"
        assert "".join(v for k,v in _tokens if k == TEXT) == _expected, "Generated Character name changed"
        _who_values[_speaker] = _value
    _sel_values = []
    for _input, _expected, _tags in CASES:
        _value = _sel_substitutions.substitute(_input, scope={"flag": True}, force=True, translate=False)[0]
        _tokens = _sel_textsupport.tokenize(_value)
        assert [v for k,v in _tokens if k == TAG] == _tags, "Generated markup became active"
        assert "".join(v for k,v in _tokens if k == TEXT) == _expected, "Literal display changed"
        _sel_values.append(_value)
'''.replace('NAMES',repr({k:(v,('Selectable New' if k=='selectable_new' else 'Selectable Updated')+' [loomlight_untrusted()] {b}literal{/b}') for k,v in names.items() if k=='selectable_new' or i==1})).replace('CASES',repr([(raw,text,['b','/b'] if n==0 else []) for n,(raw,text) in enumerate(zip(rows,expected))]))
            test=runtime+'''testcase loomlight_selectable:
    assert screen "main_menu"
    click "Start"
    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == "True café 雪") timeout 10
    advance
'''
            for n in range(len(expected)):
                test+=f'    pause until eval (renpy.get_screen("say") and renpy.get_screen("say").scope["what"] == _sel_values[{n}]) timeout 10\n    assert eval (renpy.get_screen("say").scope["what"] == _sel_values[{n}])\n'
                if speakers[n]:test+=f'    assert eval (renpy.get_screen("say").scope["who"] == _who_values[{speakers[n]!r}])\n'
                test+='    advance until screen "main_menu"\n' if n==len(expected)-1 else '    advance\n'
            test+='''    pause until screen "main_menu" timeout 10
    assert screen "main_menu"
testsuite global:
    teardown:
        exit
'''
            (root/'game/selectable_test.rpy').write_text(test)
            run([root,'compile']);run([root,'lint','--error-code']);output=run([root,'test','loomlight_selectable'])
            assert '[rpytest] Status: PASSED' in output and 'loomlight_selectable' in output
            for path,text in case['source'].items():
                if path in scaffold and not text:continue
                assert (root/path).read_bytes()==text.encode()
            results.append({'case':'create' if i==0 else 'update','passed':True,'metadataAbsent':True,'acceptedSourceUnchanged':True,'sourceSHA256':case['sourceSHA256']})
    (a.output/'result.json').write_text(json.dumps({'passed':True,'sdkVersion':'8.5.3','commands':count,'cases':results,'cleanupComplete':True},indent=2)+'\n')
    print('PASS: pinned Ren’Py selectable create/update exact accepted source, literal text, protected tokens, Return, metadata-free runtime and cleanup')
if __name__=='__main__':main()
