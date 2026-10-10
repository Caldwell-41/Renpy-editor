#!/usr/bin/env python3
"""Harmless pinned-SDK compilation/lint and actual substitution/text-token assertions."""
import argparse,json,os,subprocess,tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--sdk',type=Path,required=True);p.add_argument('--driver',type=Path,required=True);a=p.parse_args()
encoded=json.loads(subprocess.check_output([str(a.driver.resolve())],text=True))['encoded']
# Decode source with the same supported escapes, then quote as Python only for assertions.
import ast
text=ast.literal_eval('"'+encoded+'"')
expected='[1 + 2] [str(7)] {a=jump:label}link{/a} {image=fixture} brackets [x] braces {x} quotes " slash \\ café 雪 True friend'
with tempfile.TemporaryDirectory(prefix='loomlight-rewrite-sdk-') as tmp:
 root=Path(tmp);(root/'game').mkdir()
 executable=a.sdk/'renpy.sh' if os.name!='nt' else a.sdk/'renpy.exe'
 def run(args,timeout=60):
  result=subprocess.run([str(executable.resolve()),*map(str,args)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=timeout,cwd=a.sdk.resolve())
  if result.returncode:raise RuntimeError(f'SDK {args} failed: {result.stdout[-2000:]}')
  return result.stdout
 run(['launcher','generate_gui',root,'--width','1280','--height','720','--template',a.sdk.resolve()/'gui','--start'])
 run([root,'gui_images'])
 code='''default flag = True
init 999 python:
    from renpy import substitutions as _rewrite_substitutions
    from renpy.text import textsupport as _rewrite_textsupport
    from renpy.text.textsupport import TEXT, TAG
    _literal_input = INPUT
    _substituted = _rewrite_substitutions.substitute(_literal_input, scope={"flag": True}, force=True, translate=False)[0]
    _tokens = _rewrite_textsupport.tokenize(_substituted)
    assert [v for k, v in _tokens if k == TAG] == ["b", "/b"], "Generated tags became active"
    assert "".join(v for k, v in _tokens if k == TEXT) == EXPECTED, "Generated prose did not display literally"
    with open(config.basedir + "/literal-assertions.done", "w") as _f:
        _f.write("passed")
label start:
    "ENCODED"
    return
testcase loomlight_literal_rewrite:
    assert screen "main_menu"
    click "Start"
    assert screen "say"
    advance
    assert screen "main_menu"
    exit
'''.replace('INPUT',repr(text)).replace('EXPECTED',repr(expected)).replace('ENCODED',encoded)
 (root/'game/script.rpy').write_text(code,encoding='utf-8')
 for command in ('compile','lint'):
  run([root,command,*(['--error-code'] if command=='lint' else [])])
 if not (root/'literal-assertions.done').is_file():raise RuntimeError('SDK assertions never ran')
 output=run([root,'test','loomlight_literal_rewrite'])
 if 'loomlight_literal_rewrite' not in output or 'PASSED' not in output:raise RuntimeError('Named standard-template test did not pass')
 print('PASS: pinned Ren’Py standard-template compile/lint, substitution/tokenization and named startup/say/return smoke preserve literal expressions/tags and existing placeholders/formatting')
