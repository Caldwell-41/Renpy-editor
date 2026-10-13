//! Disposable Story controller qualification. No renderer fixture IPC, SDK or credentials.
use loomlight_core::{dispatch::ApplicationHost, lifecycle::LifecycleService, CoreResponse};
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
use std::path::{Path, PathBuf};

fn emit(value: Value) {
    println!("{value}");
    io::stdout().flush().unwrap();
}
fn value(host: &ApplicationHost, operation: &str, payload: Value) -> Value {
    let response = serde_json::to_value(host.dispatch(json!({"protocolVersion":1,
        "requestId":uuid::Uuid::new_v4().to_string(),"operation":operation,"payload":payload}), false)).unwrap();
    assert_eq!(response["ok"], true, "fixture dispatch: {response}");
    response["value"].clone()
}
fn source_save(host: &ApplicationHost, session: &str, path: &str, text: &str) {
    let opened=value(host,"source.open",json!({"sessionId":session,"path":path}));
    let draft=value(host,"source.updateDraft",json!({"sessionId":session,"path":path,
        "expectedBaseRevision":opened["baseRevision"],"text":text,"selectionStart":0,"selectionEnd":0}));
    value(host,"source.save",json!({"sessionId":session,"path":path,
        "expectedBaseRevision":draft["baseRevision"],"expectedDraftVersion":draft["draftVersion"]}));
}
fn apply(host: &ApplicationHost, session: &str, command: Value) -> Value {
    let ws=value(host,"scene.list",json!({"sessionId":session}));
    value(host,"scene.apply",json!({"sessionId":session,"expectedProjectRevision":ws["projectRevision"],
        "expectedSourceMapRevision":ws["sourceMapRevision"],"command":command}))
}
fn seed(host: &ApplicationHost, session: &str) {
    for (name,kind,default) in [("trust","int",json!("5")),("mood","string",json!("ready")),
        ("precision","int",json!("9007199254740993"))] {
        value(host,"variable.create",json!({"sessionId":session,"technicalName":name,"variableType":kind,"defaultValue":default}));
    }
    let ws=value(host,"scene.list",json!({"sessionId":session}));
    let entry=ws["scenes"][0].clone();
    let mut created=Vec::new();
    for name in ["Called scene","High ending","Low ending"] {
        let ws=apply(host,session,json!({"type":"createScene","chapterId":entry["chapterId"],"displayName":name}));
        let scene=ws["scenes"].as_array().unwrap().iter().find(|s|s["displayName"]==name).unwrap().clone();
        let line=if name=="Called scene" {"Called entry"} else {name};
        source_save(host,session,scene["sourcePath"].as_str().unwrap(),
            &format!("label {}:\n    \"{line}\"\n    return\n",scene["technicalLabel"].as_str().unwrap()));
        created.push(scene);
    }
    source_save(host,session,entry["sourcePath"].as_str().unwrap(),&format!(
        "\u{feff}label {}:\n    # exact Story fixture café 雪\n    python:\n        opaque_neighbor = \"kept\"\n    if flag:\n        # nested neighbour retained\n        \"Nested retained\"\n    elif trust == 4:\n        \"Boundary preserved\"\n    else:\n        pass\n    \"Caller resumed\"\n    menu:\n        \"Ready route\" if trust >= 5:\n            jump {}\n        \"Low route\" if trust >= 0 and trust < 5:\n            jump {}\n    \"Nothing available\"\n    return\n",
        entry["technicalLabel"].as_str().unwrap(),created[1]["technicalLabel"].as_str().unwrap(),created[2]["technicalLabel"].as_str().unwrap()));
    let ws=value(host,"scene.list",json!({"sessionId":session}));
    let scene=ws["scenes"].as_array().unwrap().iter().find(|s|s["id"]==entry["id"]).unwrap();
    let anchor=scene["beats"].as_array().unwrap().iter().find(|b|b["payload"]["text"]=="Caller resumed").unwrap();
    apply(host,session,json!({"type":"insertBeat","sceneId":scene["id"],"expectedSourceRevision":scene["sourceRevision"],
        "beforeBeatId":anchor["id"],"beat":{"type":"call","sceneId":created[0]["id"],"returnLabel":null}}));
    apply(host,session,json!({"type":"selectScene","sceneId":entry["id"]}));
}
fn files(dir: &Path, base: &Path, snapshot: &mut serde_json::Map<String, Value>) {
    for entry in std::fs::read_dir(dir).unwrap() {
        let entry=entry.unwrap();let kind=entry.file_type().unwrap();let path=entry.path();
        assert!(!kind.is_symlink(),"fixture does not accept links");
        if kind.is_dir() {files(&path,base,snapshot);} else if kind.is_file() {
            let rel=path.strip_prefix(base).unwrap().to_str().unwrap().replace('\\',"/");
            assert!(!rel.contains("savetoken") && !rel.ends_with(".key"));
            snapshot.insert(rel,json!(std::fs::read(path).unwrap()));
        }
    }
}
fn main() {
    let args=std::env::args().skip(1).collect::<Vec<_>>();
    let index=args.iter().position(|a|a=="--root").expect("explicit owned fixture root required");
    let root=PathBuf::from(args.get(index+1).unwrap());
    assert_eq!(root.parent(),Some(std::env::temp_dir().as_path()));
    assert!(root.file_name().unwrap().to_str().unwrap().starts_with("loomlight-phase3a-controller-"));
    let reopen=args.iter().any(|a|a=="--reopen");
    let retain=args.iter().any(|a|a=="--retain");
    let service=if reopen {assert!(root.is_dir());LifecycleService::new(root.clone()).unwrap()}
        else {assert!(!root.exists());LifecycleService::prepare_source_foundation_probe(root.clone()).unwrap()};
    let host=ApplicationHost::new(service);
    if !reopen {
        let p=host.with_service(|s|s.open_path(&root.join("synthetic-project")).unwrap()).unwrap();
        seed(&host,&p.session_id);
        value(&host,"project.close",json!({"sessionId":p.session_id}));
    }
    emit(json!({"ready":true,"fixtureId":root.file_name().unwrap().to_str().unwrap(),"reopen":reopen}));
    for line in io::stdin().lock().lines() {
        let request:Value=serde_json::from_str(&line.unwrap()).unwrap();
        if request["driver"]=="snapshot" {
            let mut snapshot=serde_json::Map::new();files(&root.join("synthetic-project"),&root.join("synthetic-project"),&mut snapshot);
            emit(json!({"snapshot":snapshot}));continue;
        }
        if request["driver"]=="externalAppend" {
            let relative=request["path"].as_str().unwrap();
            let allowed=host.with_service(|s|s.scene_workspace().unwrap().scenes.iter().any(|scene|scene.source_path==relative)).unwrap();
            assert!(allowed,"ordinary external edit must target one current Scene source");
            let path=root.join("synthetic-project").join(relative);
            let mut bytes=std::fs::read(&path).unwrap();bytes.extend(b"# ordinary external Story writer\n");
            std::fs::write(path,&bytes).unwrap();emit(json!({"externalBytes":bytes}));continue;
        }
        let op=request["operation"].as_str().unwrap();
        // Narrow test process: unexpected execution/content-send operations fail closed.
        let allowed=matches!(op,"system.health"|"system.version"|"preferences.read"|"preferences.write"|
            "project.listRecent"|"project.openRecent"|"project.current"|"project.close"|"project.status"|"project.flush"|
            "scene.list"|"scene.apply"|"scene.recovery"|"scene.resolveRecovery"|"flow.list"|"authoring.list"|
            "source.list"|"source.open"|"source.updateDraft"|"source.save"|"source.discard"|"source.applyBoth"|
            "source.saveAll"|"source.discardAll");
        let response=if allowed {host.dispatch(request,false)} else {
            CoreResponse::failure(request["requestId"].as_str().unwrap().to_owned(),"PROBE_OPERATION_REFUSED","Only the selected synthetic authoring operations are available.")
        };
        emit(serde_json::to_value(response).unwrap());
    }
    // EOF is an ordinary owned shutdown. Harness separately owns abnormal-exit cleanup.
    if let Some(p)=host.with_service(|s|s.current()).unwrap() {value(&host,"project.close",json!({"sessionId":p.session_id}));}
    assert!(host.shutdown());drop(host);
    if !retain {std::fs::remove_dir_all(&root).unwrap();assert!(!root.exists());}
}
