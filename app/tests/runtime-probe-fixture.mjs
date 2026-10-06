// Driver compatibility fixture only. The native gates remain responsible for
// filesystem persistence, IPC, process ownership and real Ren'Py outcomes.
export function runtimeProbeFixture(mode) {
  const revision = 'a'.repeat(64);
  const entryPath = 'game/chapters/chapter_01/scene_001.rpy';
  const diagnosticPath = 'game/雪 diagnostic.rpy';
  const project = {sessionId:'session-0',projectId:'runtime-fixture',title:'Runtime UI fixture',folderName:'runtime-fixture',chapterId:'chapter',chapterName:'Chapter One',sceneId:'entry',sceneName:'Entry',sdkVersion:'8.5.3',resolution:{width:1280,height:720}};
  const choice = {id:'choice',byteStart:16,byteEnd:140,protected:false,payload:{type:'choice',options:[{text:'Route A',destinationSceneId:'a'},{text:'Route B',destinationSceneId:'b'}]}};
  const scenes = ['entry','a','b'].map(id=>({id,chapterId:'chapter',displayName:id,technicalLabel:id,sourcePath:id==='entry'?entryPath:`game/${id}.rpy`,sourceRevision:revision,sourceConflict:false,partial:false,beats:id==='entry'?[choice]:[]}));
  const model = {projectRevision:revision,sourceMapRevision:revision,entrySceneId:'entry',lastOpen:{chapterId:'chapter',sceneId:'entry'},chapters:[{id:'chapter',displayName:'Chapter One',directory:'game/chapters/chapter_01'}],scenes,authoring:{characters:[],appearances:[],assets:[],variables:[]},canUndo:false,canRedo:false};
  const entryText = () => `label entry:\n    menu:\n${choice.payload.options.map(o=>`        "${o.text}":\n            jump ${o.destinationSceneId}`).join('\n')}\n`;
  const accepted = new Map([[entryPath,entryText()],[diagnosticPath,`label diagnostic_case:\r\n    ${mode==='compile'?'not a statement':'scene loomlight_image_that_does_not_exist'}\r\n`]]);
  const drafts = new Map();
  let session = 0, phase = 'running', savedWhileRunning = false;
  const calls = [];
  const document = (path, target={}) => ({path,text:drafts.get(path)?.text??accepted.get(path),state:drafts.has(path)?'dirty':'clean',dirty:drafts.has(path),editable:true,baseRevision:revision,liveRevision:revision,draftVersion:1,hasBom:false,newline:path===diagnosticPath?'CRLF':'LF',partial:false,diagnostics:[],ranges:[],selectionStart:target.selectionStart??target.byteStart??drafts.get(path)?.selectionStart??0,selectionEnd:target.selectionEnd??target.byteEnd??drafts.get(path)?.selectionEnd??0,canApplyBoth:false});
  const inventory = () => ({files:[...accepted.keys()].map(path=>({path,state:drafts.has(path)?'dirty':'clean',dirty:drafts.has(path),readOnly:false})),dirtyCount:drafts.size,draftBytes:[...drafts.values()].reduce((n,d)=>n+d.text.length,0)});
  const flow = () => ({revision,entrySceneId:'entry',nodes:scenes.map(s=>({sceneId:s.id,name:s.displayName,label:s.technicalLabel,location:{path:s.sourcePath,revision,byteStart:0,byteEnd:16},partial:false,stale:false})),edges:choice.payload.options.map((o,i)=>({id:`edge-${i}`,sceneId:'entry',beatId:'choice',optionOrdinal:i,text:o.text,kind:'choice',location:{path:entryPath,revision,byteStart:16,byteEnd:140},destination:{kind:'resolved',sceneId:o.destinationSceneId},editable:true})),observation:{status:'checked',checkedAt:Date.now(),fromCache:false},partial:false,stale:false,overLimit:false,notice:'Driver fixture'});
  const status = () => ({operationId:'op',phase:mode==='compile'||mode==='lint'?'failed':phase,exitCode:null,output:phase==='cancelled'?'':mode==='runtime-error'?'R2_RUNTIME_ERROR_ORACLE':`R2_ROUTE_${mode==='route-b'?'b':'a'}_DIALOGUE_STATE_ASSET_PASS`,nextSequence:1,outputTruncated:false,earlierRevision:savedWhileRunning,cleanupComplete:mode==='compile'||mode==='lint'||phase==='cancelled',launchRevision:revision,revisionStale:false});
  const diagnostics = () => ({diagnostics:mode.startsWith('route')?[]:[{id:0,origin:mode==='runtime-error'?'runtime':mode,severity:'error',message:'Driver fixture diagnostic',path:diagnosticPath,line:2,column:null,sourceRevision:revision,operationId:'op',sessionId:project.sessionId,freshness:'unverified'}]});
  const request = async (operation,payload={}) => {
    calls.push(operation);
    let value;
    switch(operation) {
      case 'project.listRecent':value=[{id:'fixture',projectId:project.projectId,title:project.title,displayPath:'Fixtures / Runtime',lastOpenedUnixMs:Date.UTC(2026,8,29),status:'available'}];break;
      case 'project.openRecent':project.sessionId=`session-${++session}`;value=project;break;
      case 'project.current':value=project;break;
      case 'project.status':case 'project.flush':value='saved';break;
      case 'project.close':value=null;break;
      case 'scene.list':value=model;break;
      case 'scene.apply': {
        if(payload.command.type==='updateBeat'){choice.payload=payload.command.beat;accepted.set(entryPath,entryText());}
        else if(payload.command.type==='selectScene')model.lastOpen.sceneId=payload.command.sceneId;
        else throw Error(`Unexpected fixture Scene command: ${payload.command.type}`);
        value=model;break;
      }
      case 'flow.list':value=flow();break;
      case 'source.list':value=inventory();break;
      case 'source.open':value=document(payload.path,payload);break;
      case 'source.updateDraft':drafts.set(payload.path,payload);value=document(payload.path,payload);break;
      case 'source.save':accepted.set(payload.path,drafts.get(payload.path).text);drafts.delete(payload.path);savedWhileRunning=true;value=document(payload.path);break;
      case 'source.discard':drafts.delete(payload.path);value=document(payload.path);break;
      case 'source.saveAll':return {protocolVersion:1,requestId:'fixture',ok:false,error:{code:'SOURCE_REFUSED',message:'Mapped label changed; no files saved'}};
      case 'sdk.discover':value=[{id:'sdk',version:'8.5.3',compatible:true,displayName:'Fixture SDK'}];break;
      case 'runtime.installPolicy':case 'runtime.cancelPreparation':value=null;break;
      case 'runtime.prepare':value={preparationId:'prepare',savedRevision:revision,draftCount:drafts.size,trustId:null,projectPath:'Fixture project',sdkPath:'Fixture SDK',sdkVersion:'8.5.3',sdkRevision:revision,inputs:[diagnosticPath],trustNotice:'Fixture only'};break;
      case 'runtime.grantTrust':value={trustId:'trust'};break;
      case 'runtime.start':value={...status(),nextSequence:0,output:''};break;
      case 'runtime.status':value={...status(),output:payload.afterSequence===1?'':status().output};break;
      case 'runtime.stop':phase='cancelled';value=status();break;
      case 'runtime.diagnostics':value=diagnostics();break;
      case 'runtime.resolveDiagnostic':value={path:diagnosticPath,expectedRevision:revision,byteStart:'label diagnostic_case:\r\n'.length,byteEnd:accepted.get(diagnosticPath).length-2};break;
      default:throw Error(`Unmodelled driver fixture operation: ${operation}`);
    }
    return {protocolVersion:1,requestId:'fixture',ok:true,value:structuredClone(value)};
  };
  return {request,calls};
}
