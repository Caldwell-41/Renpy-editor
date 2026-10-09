#!/usr/bin/env python3
"""One exclusive packaged prompt/context launch; phase 2 requires byte-exact reopen.
Create observation <stage>.done markers only after actual native input/observation.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
from prompt_probe_gate import validate_report
p=argparse.ArgumentParser()
p.add_argument('--executable',type=Path,required=True)
p.add_argument('--root',type=Path,required=True)
p.add_argument('--output',type=Path,required=True)
p.add_argument('--phase',type=int,choices=(1,2),required=True)
a=p.parse_args()
if not a.executable.is_file() or not a.root.name.startswith('loomlight-prompt-'):raise SystemExit('Owned executable/root required')
if a.phase==1 and a.root.exists():raise SystemExit('Fresh fixture required')
if a.phase==2:
 receipt=json.loads((a.output/'phase-1.json').read_text())
 validate_report(receipt,1)
a.output.mkdir(parents=True,exist_ok=True)
logpath=a.output/f'phase-{a.phase}.log'
if logpath.exists():raise SystemExit('No replay; fresh phase log required')
editor=a.root/'synthetic-project/.renpy-editor'
paths=[editor/'ai.json',editor/'references.json']
before=[p.read_bytes() for p in paths] if a.phase==2 else None
started=time.monotonic()
env=dict(os.environ,LOOMLIGHT_RUNTIME_UI_PROBE='prompt-context',LOOMLIGHT_PROMPT_PROBE_ROOT=str(a.root),LOOMLIGHT_PROMPT_PROBE_PHASE=str(a.phase),TMPDIR=str(a.root.parent))
process=subprocess.Popen([str(a.executable.resolve())],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
print(json.dumps({'evidence':'prompt-launch','phase':a.phase,'pid':process.pid,'executableSHA256':hashlib.sha256(a.executable.read_bytes()).hexdigest()}),flush=True)
report=None
try:
 with logpath.open('x') as log:
  for line in process.stdout:
   log.write(line);log.flush()
   try:item=json.loads(line)
   except ValueError:continue
   print(json.dumps(item),flush=True)
   if item.get('evidence')=='prompt-stage' and item['stage']=='external-prompt':
    value=json.loads(paths[0].read_bytes());value['externalExtension']={'retained':True}
    temporary=paths[0].with_suffix('.external.json');temporary.write_text(json.dumps(value,ensure_ascii=False));os.replace(temporary,paths[0]);(a.root/'external-prompt.done').touch()
   if item.get('evidence')=='runtime-ui-packaged':report=item
 code=process.wait(timeout=15)
 if code or not report or not report.get('passed') or not report.get('cleanupComplete'):raise ValueError('Required packaged proof failed; diagnose before retry')
 validate_report(report,a.phase)
 after=[p.read_bytes() for p in paths]
 if before is not None and before!=after:raise ValueError('Process reopen mutated prompt/reference metadata')
 doc=json.loads(after[0]);assert doc['futureSettings']=={'retained':True} and doc['prompts']['futureAction']['text']=='Unrelated action retained' and doc['styleNotes']=='Public fixture style notes.'
 report['metadataSHA256']={p.name:hashlib.sha256(data).hexdigest() for p,data in zip(paths,after)}
 report['elapsedSeconds']=round(time.monotonic()-started,2)
 (a.output/f'phase-{a.phase}.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'evidence':'prompt-accepted','phase':a.phase,'metadataSHA256':report['metadataSHA256']}),flush=True)
finally:
 if process.poll() is None:
  process.terminate()
  try:process.wait(timeout=10)
  except subprocess.TimeoutExpired:process.kill();process.wait(timeout=10)
