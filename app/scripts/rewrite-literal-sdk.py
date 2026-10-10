#!/usr/bin/env python3
"""Harmless pinned-SDK compilation/lint and actual substitution/text-token assertions."""
import argparse,json,os,subprocess,tempfile,sys
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--sdk',type=Path,required=True);p.add_argument('--driver',type=Path,required=True);p.add_argument('--output',type=Path);a=p.parse_args()
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'spikes/renpy-sdk'))
from sdk_adapter import launcher_for
if a.output:a.output.mkdir(parents=True,exist_ok=False)
encoded=json.loads(subprocess.check_output([str(a.driver.resolve())],text=True))['encoded']
# Decode source with the same supported escapes, then quote as Python only for assertions.
import ast
text=ast.literal_eval('"'+encoded+'"')
expected='[1 + 2] [str(7)] {a=jump:label}link{/a} {image=fixture} brackets [x] braces {x} quotes " slash \\ café 雪 True friend'
with tempfile.TemporaryDirectory(prefix='loomlight-rewrite-sdk-') as tmp:
 root=Path(tmp);(root/'game').mkdir()
 launcher=launcher_for(a.sdk)
 command_index=0
 def run(args,timeout=60):
  global command_index
  command_index+=1
  try:
   result=subprocess.run([*launcher,*map(str,args)],stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=timeout,cwd=a.sdk.resolve())
   output=result.stdout
  except subprocess.TimeoutExpired as e:
   output=e.stdout or '';output=output.decode('utf-8',errors='replace') if isinstance(output,bytes) else output
   if a.output:
    (a.output/f'command-{command_index}.log').write_text(output,encoding='utf-8')
    if (root/'log.txt').is_file():(a.output/f'command-{command_index}-renpy.log').write_bytes((root/'log.txt').read_bytes())
   raise
  if a.output:
   (a.output/f'command-{command_index}.log').write_text(output,encoding='utf-8')
   if (root/'log.txt').is_file():(a.output/f'command-{command_index}-renpy.log').write_bytes((root/'log.txt').read_bytes())
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
    advance until screen "main_menu"
    assert screen "main_menu"
testsuite global:
    teardown:
        exit
'''.replace('INPUT',repr(text)).replace('EXPECTED',repr(expected)).replace('ENCODED',encoded)
 (root/'game/script.rpy').write_text(code,encoding='utf-8')
 for command in ('compile','lint'):
  run([root,command,*(['--error-code'] if command=='lint' else [])])
 if not (root/'literal-assertions.done').is_file():raise RuntimeError('SDK assertions never ran')
 output=run([root,'test','loomlight_literal_rewrite'])
 if 'loomlight_literal_rewrite' not in output or 'PASSED' not in output:raise RuntimeError('Named standard-template test did not pass')
 print('PASS: pinned Ren’Py standard-template compile/lint, substitution/tokenization and named startup/say/return smoke preserve literal expressions/tags and existing placeholders/formatting')
