#!/usr/bin/env python3
"""Exclusive packaged rewrite walkthrough and process reopen, controlled loopback only.
Physical send/accept and theme/compact markers require actual native observation.
"""
import argparse,hashlib,json,os,subprocess,threading,time
from pathlib import Path
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from rewrite_probe_gate import validate_report
p=argparse.ArgumentParser();p.add_argument('--executable',type=Path,required=True);p.add_argument('--root',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--phase',type=int,choices=(1,2),required=True);a=p.parse_args()
if not a.executable.is_file() or not a.root.name.startswith('loomlight-rewrite-'):raise SystemExit('Owned executable/root required')
if a.phase==1 and a.root.exists():raise SystemExit('Fresh fixture required')
if a.phase==2:validate_report(json.loads((a.output/'phase-1.json').read_text()),1)
a.output.mkdir(parents=True,exist_ok=True);logpath=a.output/f'phase-{a.phase}.log'
if logpath.exists():raise SystemExit('Fresh log required; no replay')
root=a.root/'synthetic-project';editor=root/'.renpy-editor'
owned_files=['ai.json','references.json','source-map.json','project.json']
def project_bytes():
 return {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
before=project_bytes() if a.phase==2 else None
requests=[];errors=[]
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_POST(self):
  try:
   if self.path!='/v1/chat/completions' or self.headers.get('Authorization')!='Bearer loomlight-public-rewrite-fixture':raise ValueError('Fixture route/auth mismatch')
   size=int(self.headers['Content-Length'])
   if not 0<size<=2*1024*1024:raise ValueError('Fixture body bound')
   body=self.rfile.read(size);v=json.loads(body);u=json.loads(v['messages'][1]['content']);task=u['task']
   if v['model']!='synthetic-rewrite-model' or v['response_format']['json_schema']['strict'] is not True or v['enable_tools'] is not False or v['enabled_tools']!=[] or v['stream'] is not False or len(u['references'])!=2:raise ValueError('Fixture contract mismatch')
   segments=u['responseContract']['segments'];segments[0]['literal']='New [str(7)] {a=jump:label} café 雪 '
   if task=='FIXTURE_UNSAFE':segments[1]['token']='forged'
   text=json.dumps({'schemaVersion':1,'action':'rewriteDialogue','target':{'sceneId':u['story']['sceneId'],'beatId':u['story']['beatId']},'segments':segments},ensure_ascii=False)
   if task=='FIXTURE_MALFORMED':text='{"schemaVersion":1,"schemaVersion":1}'
   requests.append(hashlib.sha256(body).hexdigest())
   if task=='FIXTURE_DELAY':
    (a.root/'server-delay.done').touch();time.sleep(2)
   response=json.dumps({'model':v['model'],'choices':[{'index':0,'finish_reason':'stop','message':{'role':'assistant','content':text}}]},ensure_ascii=False).encode()
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(response)));self.end_headers();self.wfile.write(response)
  except (BrokenPipeError,ConnectionResetError):pass
  except Exception as e:errors.append(type(e).__name__)
server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.daemon_threads=True
thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
endpoint=f'http://127.0.0.1:{server.server_address[1]}/v1'
env=dict(os.environ,LOOMLIGHT_RUNTIME_UI_PROBE='dialogue-rewrite',LOOMLIGHT_REWRITE_PROBE_ROOT=str(a.root),LOOMLIGHT_REWRITE_PROBE_PHASE=str(a.phase),LOOMLIGHT_REWRITE_PROBE_ENDPOINT=endpoint,TMPDIR=str(a.root.parent))
process=subprocess.Popen([str(a.executable.resolve())],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,start_new_session=True)
print(json.dumps({'evidence':'rewrite-launch','phase':a.phase,'pid':process.pid,'executableSHA256':hashlib.sha256(a.executable.read_bytes()).hexdigest()}),flush=True)
report=None;restore=None;started=time.monotonic()
try:
 with logpath.open('x') as log:
  for line in process.stdout:
   log.write(line);log.flush()
   try:item=json.loads(line)
   except ValueError:continue
   print(json.dumps(item),flush=True)
   if item.get('evidence')=='rewrite-stage' and item.get('stage')=='external-source':
    source=root/json.loads((editor/'project.json').read_bytes())['scenes'][0]['sourcePath'];restore=(source,source.read_bytes());source.write_bytes(restore[1]+b'# external fixture edit\n');(a.root/'external-source.done').touch()
   if item.get('evidence')=='rewrite-stage' and item.get('stage')=='restore-source':
    restore[0].write_bytes(restore[1]);(a.root/'restore-source.done').touch()
   if item.get('evidence')=='runtime-ui-packaged':report=item
 code=process.wait(timeout=15)
 # Preserve a terminal report even when the required gate rejects it.
 if report:(a.output/f'phase-{a.phase}.json').write_text(json.dumps(report,indent=2)+'\n')
 if code or not report:raise ValueError('Required packaged proof failed; diagnose before retry')
 validate_report(report,a.phase)
 if errors:raise ValueError('Fixture server failed')
 if a.phase==1 and requests!=report['details']['reviewedBodyDigests']:raise ValueError('Exact reviewed bodies do not match all five HTTP requests')
 if a.phase==2 and (requests or project_bytes()!=before):raise ValueError('Process reopen sent HTTP or changed project bytes')
 report['requestBodySHA256']=requests;report['elapsedSeconds']=round(time.monotonic()-started,2);report['metadataSHA256']={f:hashlib.sha256((editor/f).read_bytes()).hexdigest() for f in owned_files}
 (a.output/f'phase-{a.phase}.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'evidence':'rewrite-accepted','phase':a.phase,'requestCount':len(requests),'metadataSHA256':report['metadataSHA256']}),flush=True)
finally:
 if process.poll() is None:
  process.terminate()
  try:process.wait(timeout=10)
  except subprocess.TimeoutExpired:process.kill();process.wait(timeout=10)
 server.shutdown();server.server_close();thread.join(timeout=2)
