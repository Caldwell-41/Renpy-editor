//! One native-owned, memory-only Settings draft. No key in renderer IPC or logs.
use loomlight_core::{ai_credentials::{self as credentials, Secret, Secrets}, ai_profiles::{canonical_endpoint, StudioProfile, StudioSettings}, ai_request::{self, Cancel}, dispatch::ApplicationHost, CoreResponse};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::{Arc, Mutex, OnceLock};

#[derive(Deserialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
struct Begin {token:String,profile_id:Option<String>,endpoint:String,private_http:bool}
#[derive(Deserialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
struct Target {draft_id:String,revision:u64}
#[derive(Deserialize)]
#[serde(rename_all="camelCase",deny_unknown_fields)]
struct Save {draft_id:String,revision:u64,settings:StudioSettings}
struct Draft {
    id:String,revision:u64,token:String,profile_id:Option<String>,endpoint:String,private_http:bool,
    key:Option<Secret>,state:&'static str,message:&'static str,models:Vec<String>,cancel:Cancel,
}
impl Draft {
    fn view(&self)->Value {json!({"draftId":self.id,"revision":self.revision,"credentialReady":self.key.is_some(),"state":self.state,"message":self.message,"models":self.models})}
    fn matches(&self,target:&Target)->bool {self.id==target.draft_id && self.revision==target.revision}
    fn profile(&self)->StudioProfile {
        let origin=canonical_endpoint(&self.endpoint,self.private_http).expect("validated draft endpoint").1;
        serde_json::from_value(json!({"profileId":self.id,"revision":1,"disabled":false,"settings":{"label":"Connection draft","endpoint":self.endpoint,"model":"native-connection-discovery","privateHttp":self.private_http,"contextBudget":32768,"contextCeiling":32768,"maximumResponse":16384},"credential":{"credentialId":self.id,"revision":1,"origin":origin}})).expect("native draft profile")
    }
}
#[derive(Default)]
pub struct Service {draft:Mutex<Option<Draft>>,worker:Mutex<Option<std::thread::JoinHandle<()>>>}
static SERVICE:OnceLock<Arc<Service>>=OnceLock::new();
pub fn service()->&'static Arc<Service>{SERVICE.get_or_init(||Arc::new(Service::default()))}
const STALE:&str="Connection draft changed. Enter the key and Connect again.";
impl Service {
    pub fn shutdown(&self) {
        if let Ok(mut state)=self.draft.lock(){if let Some(draft)=state.take(){draft.cancel.cancel();}}
        if let Ok(mut worker)=self.worker.lock(){if let Some(worker)=worker.take(){let _=worker.join();}}
    }
    fn begin(&self,host:&ApplicationHost,input:Begin,secrets:&impl Secrets)->credentials::Result<Value> {
        let _guard=crate::ai_requests::service().begin_model_settings(&Cancel::default())?;
        let (endpoint,origin)=canonical_endpoint(&input.endpoint,input.private_http)?;
        let store=host.with_service(|s|credentials::checked(s,&input.token)).map_err(|_|"Settings busy.")??;
        let key=if let Some(id)=&input.profile_id {
            let profile=store.profiles.iter().find(|p|&p.profile_id==id).ok_or("Profile missing.")?;
            if profile.credential_bound() && profile.credential.as_ref().is_some_and(|c|c.origin==origin) {
                secrets.read(id,profile.credential.as_ref().unwrap()).ok().flatten()
            }else{None}
        }else{None};
        self.shutdown();
        let draft=Draft{id:uuid::Uuid::new_v4().to_string(),revision:1,token:input.token,profile_id:input.profile_id,endpoint,private_http:input.private_http,key,state:"ready",message:"Enter an API key, then Connect to retrieve available models.",models:vec![],cancel:Cancel::default()};
        let view=draft.view();*self.draft.lock().map_err(|_|"Draft unavailable.")?=Some(draft);Ok(view)
    }
    fn status(&self,host:&ApplicationHost,target:&Target)->credentials::Result<Value> {
        let mut state=self.draft.lock().map_err(|_|"Draft unavailable.")?;
        let draft=state.as_mut().filter(|d|d.matches(target)).ok_or(STALE)?;
        if host.with_service(|s|credentials::checked(s,&draft.token).is_ok()).unwrap_or(true)==false {
            draft.cancel.cancel();draft.models.clear();draft.state="expired";draft.message="Saved profiles changed. Reload profiles and Connect again.";
        }
        Ok(draft.view())
    }
    fn key(&self,host:&ApplicationHost,target:&Target,key:&str)->credentials::Result<credentials::SaveOutcome> {
        if !credentials::valid_key(key){return Err("Use 1–4096 printable non-space ASCII characters.");}
        let mut state=self.draft.lock().map_err(|_|"Draft unavailable.")?;
        let draft=state.as_mut().filter(|d|d.matches(target)&&d.state!="connecting").ok_or(STALE)?;
        host.with_service(|s|credentials::checked(s,&draft.token)).map_err(|_|"Settings busy.")??;
        draft.key=Some(Secret::new(key.into()));draft.revision=draft.revision.checked_add(1).ok_or("Draft revision exhausted.")?;
        draft.models.clear();draft.state="ready";draft.message="API key is ready in this draft. Connect to retrieve models; Save profile stores it locally.";
        Ok(credentials::SaveOutcome::Saved)
    }
    fn connect(self:&Arc<Self>,host:&ApplicationHost,target:Target)->credentials::Result<Value> {
        let request_cancel=Cancel::default();
        let guard=crate::ai_requests::service().begin_model_settings(&request_cancel)?;
        let (profile,key,cancel,token,view)={
            let mut state=self.draft.lock().map_err(|_|"Draft unavailable.")?;
            let draft=state.as_mut().filter(|d|d.matches(&target)&&d.state!="connecting").ok_or(STALE)?;
            host.with_service(|s|credentials::checked(s,&draft.token)).map_err(|_|"Settings busy.")??;
            let key=Secret::new(draft.key.as_ref().ok_or("Enter an API key before connecting.")?.to_string());
            draft.cancel=request_cancel;draft.models.clear();draft.state="connecting";draft.message="Connecting and retrieving available models…";
            (draft.profile(),key,draft.cancel.clone(),draft.token.clone(),draft.view())
        };
        let owner=self.clone();let host=host.clone();
        let worker=std::thread::spawn(move||{
            let _guard=guard;
            let deadline=std::time::Instant::now()+std::time::Duration::from_secs(15);
            let result=ai_request::discover_connection(profile,key,&cancel);
            let current=host.with_service_until(deadline,|s|credentials::checked(s,&token).is_ok()).unwrap_or(false);
            if let Ok(mut state)=owner.draft.lock(){if let Some(draft)=state.as_mut().filter(|d|d.matches(&target)) {
                if cancel.cancelled() || !current {draft.models.clear();draft.state="cancelled";draft.message="Connection cancelled or settings changed. Your draft details are retained; Connect again.";}
                else {match result {
                    Ok(found)=>{draft.models=found.models;draft.state="connected";draft.message=if draft.models.is_empty(){"Connected, but Studio returned no models. Make a model available in Studio, then Connect again."}else{"Connected. Choose a model, then Save profile."};}
                    Err(_)=>{draft.models.clear();draft.state="failed";draft.message="Could not connect or authenticate. Check the address, private-HTTP option and API key, then Connect again.";}
                }}
            }}
        });
        if let Some(old)=self.worker.lock().map_err(|_|"Connection worker unavailable.")?.replace(worker){let _=old.join();}
        Ok(view)
    }
    fn cancel(&self,target:&Target,discard:bool)->credentials::Result<Value> {
        let mut state=self.draft.lock().map_err(|_|"Draft unavailable.")?;
        let draft=state.as_mut().filter(|d|d.id==target.draft_id&&(discard||d.revision==target.revision)).ok_or(STALE)?;
        draft.cancel.cancel();draft.models.clear();draft.state="cancelled";draft.message="Connection cancelled. Draft details and key are retained until you leave Settings.";
        let view=draft.view();if discard{state.take();}Ok(view)
    }
    fn save(&self,host:&ApplicationHost,input:Save,secrets:&impl Secrets)->credentials::Result<Value> {
        let guard=crate::ai_requests::service().begin_model_settings(&Cancel::default())?;
        let mut state=self.draft.lock().map_err(|_|"Draft unavailable.")?;
        let target=Target{draft_id:input.draft_id,revision:input.revision};
        let draft=state.as_mut().filter(|d|d.matches(&target)&&d.state=="connected").ok_or("Connect successfully before saving this connection.")?;
        let(endpoint,_)=canonical_endpoint(&input.settings.endpoint,input.settings.private_http)?;
        if endpoint!=draft.endpoint || input.settings.private_http!=draft.private_http || !draft.models.contains(&input.settings.model) {return Err("Choose a model from this connection's current results.");}
        let _change=crate::ai_requests::service().change();
        let before=host.with_service(|s|credentials::checked(s,&draft.token)).map_err(|_|"Settings busy.")??;
        let result=host.with_service(|s|credentials::save_connection(s,secrets,&draft.token,draft.profile_id.as_deref(),input.settings,draft.key.as_ref().ok_or("Enter an API key.")?)).map_err(|_|"Settings busy.")?;
        let (profile_id,outcome)=match result {Ok(value)=>value,Err(error)=>{
            // Ownership staging/cleanup can advance metadata on failure. Retain a
            // retry only when every saved profile is still exactly the original.
            if let Ok(Ok(actual))=host.with_service(|s|credentials::Records::read(s)) {
                if actual.profiles==before.profiles {draft.token=credentials::token(&actual);}
            }
            return Err(error);
        }};
        draft.state="saved";draft.key=None;draft.models.clear();drop(state);drop(guard);
        Ok(json!({"saved":true,"profileId":profile_id,"cleanupPending":outcome==credentials::SaveOutcome::SavedCleanupPending}))
    }
}

pub fn dispatch(app:&tauri::AppHandle,host:&ApplicationHost,id:String,operation:&str,payload:Value)->CoreResponse {
    let result=(||->credentials::Result<Value>{
        let owner=service();
        if operation=="ai.beginConnection" {return owner.begin(host,serde_json::from_value(payload).map_err(|_|"Invalid connection draft payload.")?,&crate::ai_settings::secrets(host)?);}
        if operation=="ai.saveConnection" {
            let saved=owner.save(host,serde_json::from_value(payload).map_err(|_|"Invalid connected profile payload.")?,&crate::ai_settings::secrets(host)?)?;
            #[cfg(target_os="windows")]
            { use tauri::Manager;
              if let Some(state)=app.try_state::<crate::ai_reload_fixture::ConnectionState>() {
                // The real confirmed response stays true; fixture mismatch is not
                // reported as a failed Save or as the selected snapshot failure.
                if let Ok(mut fixture)=state.0.lock() {let _=host.with_service(|s|fixture.confirm(s,saved["profileId"].as_str().unwrap_or_default(),saved["cleanupPending"]==true));}
              }
            }
            return Ok(saved);
        }
        let target:Target=serde_json::from_value(payload).map_err(|_|"Invalid connection target.")?;
        match operation {
            "ai.connectionStatus"=>owner.status(host,&target),
            "ai.connect"=>owner.connect(host,target),
            "ai.cancelConnection"=>owner.cancel(&target,false),
            "ai.discardConnection"=>owner.cancel(&target,true),
            "ai.enterConnectionKey"=>{
                let _guard=crate::ai_requests::service().begin_model_settings(&Cancel::default())?;
                owner.status(host,&target)?;
                let result=crate::ai_settings::native_entry(app,true,|key|owner.key(host,&target,key))?;
                let state=owner.draft.lock().map_err(|_|"Draft unavailable.")?;
                let draft=state.as_ref().filter(|d|d.id==target.draft_id).ok_or(STALE)?;
                let mut view=draft.view();view["cancelled"]=json!(result.is_none());Ok(view)
            }
            _=>Err("Connection operation unavailable."),
        }
    })();
    match result {Ok(value)=>CoreResponse::success(id,value),Err(message)=>CoreResponse::failure(id,"AI_CONNECTION_REFUSED",message)}
}

#[cfg(test)]
mod tests {
    use super::*;
    use loomlight_core::{ai_credentials::Records,ai_profiles::{OwnedCredential,ProfileStore},lifecycle::LifecycleService};
    use std::{collections::HashMap,io::{Read,Write},net::TcpListener,time::{Duration,Instant}};
    static SERIAL:Mutex<()>=Mutex::new(());
    #[derive(Default)]
    struct Keys(Mutex<HashMap<String,String>>);
    impl Secrets for Keys {
        fn read(&self,_:&str,c:&OwnedCredential)->credentials::Result<Option<Secret>> {Ok(self.0.lock().unwrap().get(&c.credential_id).cloned().map(Secret::new))}
        fn add(&self,_:&str,c:&OwnedCredential,key:&str)->credentials::Result<()> {self.0.lock().unwrap().insert(c.credential_id.clone(),key.into());Ok(())}
        fn delete(&self,_:&str,c:&OwnedCredential)->credentials::Result<()> {self.0.lock().unwrap().remove(&c.credential_id);Ok(())}
    }
    fn host()->(tempfile::TempDir,ApplicationHost) {let dir=tempfile::tempdir().unwrap();let host=ApplicationHost::new(LifecycleService::new(dir.path().to_owned()).unwrap());(dir,host)}
    fn begin(owner:&Service,host:&ApplicationHost,keys:&Keys,endpoint:String)->Target {
        let token=host.with_service(|s|credentials::token(&s.read().unwrap())).unwrap();
        let view=owner.begin(host,Begin{token,profile_id:None,endpoint,private_http:false},keys).unwrap();
        serde_json::from_value(json!({"draftId":view["draftId"],"revision":view["revision"]})).unwrap()
    }
    fn target(owner:&Service)->Target {let state=owner.draft.lock().unwrap();let d=state.as_ref().unwrap();Target{draft_id:d.id.clone(),revision:d.revision}}
    fn wait(owner:&Service,host:&ApplicationHost,target:&Target)->Value {let deadline=Instant::now()+Duration::from_secs(3);loop {let v=owner.status(host,target).unwrap();if v["state"]!="connecting" {return v;}assert!(Instant::now()<deadline);std::thread::yield_now();}}
    fn start_server(code:u16,wait:Option<std::sync::mpsc::Receiver<()>>)->(String,std::thread::JoinHandle<()>,std::sync::mpsc::Receiver<()>) {
        serve(TcpListener::bind("127.0.0.1:0").unwrap(),code,wait,"fixture")
    }
    fn serve(listener:TcpListener,code:u16,wait:Option<std::sync::mpsc::Receiver<()>>,model:&'static str)->(String,std::thread::JoinHandle<()>,std::sync::mpsc::Receiver<()>) {
        let endpoint=format!("http://{}/v1",listener.local_addr().unwrap());let(tx,rx)=std::sync::mpsc::channel();
        let thread=std::thread::spawn(move||{let(mut socket,_)=listener.accept().unwrap();socket.set_read_timeout(Some(Duration::from_secs(3))).unwrap();let mut bytes=Vec::new();while !bytes.ends_with(b"\r\n\r\n"){let mut b=[0];assert_eq!(socket.read(&mut b).unwrap(),1);bytes.push(b[0]);assert!(bytes.len()<8192);}
            let request=String::from_utf8(bytes).unwrap();assert!(request.starts_with("GET /v1/models HTTP/1.1"));assert!(request.to_ascii_lowercase().contains("authorization: bearer public-draft-key"));let _=tx.send(());if let Some(wait)=wait{let _=wait.recv_timeout(Duration::from_secs(3));}
            let body=json!({"data":[{"id":model,"loaded":false,"quant":"Q4_K_M"}]}).to_string();let _=write!(socket,"HTTP/1.1 {code} Result\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}",body.len());
        });(endpoint,thread,rx)
    }
    #[test]
    fn current_windows_fixture_fails_one_read_only_after_real_connected_save_without_rewriting_bytes() {
        let _serial=SERIAL.lock().unwrap();
        struct WindowsKeys(Keys);
        impl Secrets for WindowsKeys {
            fn read(&self,p:&str,c:&OwnedCredential)->credentials::Result<Option<Secret>> {self.0.read(p,c)}
            fn add(&self,p:&str,c:&OwnedCredential,k:&str)->credentials::Result<()> {self.0.add(p,c,k)}
            fn delete(&self,p:&str,c:&OwnedCredential)->credentials::Result<()> {
                if !c.storage.is_native(){return Err("Foreign fixture cleanup preserved");} self.0.delete(p,c)
            }
        }
        let dir=tempfile::Builder::new().prefix("loomlight-studio-windows-connection-").tempdir().unwrap();
        let records=LifecycleService::new(dir.path().to_owned()).unwrap();
        let fixture:ProfileStore=serde_json::from_str(crate::windows_studio_probe::FIXTURE).unwrap();
        std::fs::write(dir.path().join("ai-profiles.json"),serde_json::to_vec(&fixture).unwrap()).unwrap();
        let keys=WindowsKeys(Keys::default());
        assert!(crate::ai_reload_fixture::ConnectionReload::arm(&records).is_err());
        for profile in &fixture.profiles {
            let mut settings=profile.settings.clone(); settings.context_ceiling=settings.context_budget;
            settings.thinking=Some(true);settings.temperature=Some(1.0);settings.top_p=Some(0.95);settings.model_load=Some(Default::default());
            credentials::save_connection(&records,&keys,&credentials::token(&records.read().unwrap()),Some(&profile.profile_id),settings,"public-draft-key").unwrap();
        }
        let before=records.read().unwrap();crate::windows_studio_probe::validate_current(&before,2).unwrap();
        for change in 0..5 {
            let mut wrong=before.clone();
            match change {
                0=>wrong.revision+=1,
                1=>wrong.profiles[0].credential.as_mut().unwrap().service=loomlight_core::ai_profiles::CredentialService::Loomlight,
                2=>wrong.profiles[0].settings.thinking=Some(false),
                3=>wrong.cleanup.clear(),
                _=>{wrong.profiles.pop();},
            }
            assert!(crate::windows_studio_probe::validate_current(&wrong,2).is_err());
        }
        let mut fault=crate::ai_reload_fixture::ConnectionReload::arm(&records).unwrap();
        assert!(fault.confirm(&records,crate::ai_reload_fixture::WINDOWS_PROFILE,true).is_err());
        assert_eq!(fault.read(&records).unwrap(),before);
        let host=ApplicationHost::new(records);let owner=Arc::new(Service::default());
        let(endpoint,server,_)=serve(TcpListener::bind("127.0.0.1:46082").unwrap(),200,None,"loomlight-synthetic-model");
        let view=owner.begin(&host,Begin{token:credentials::token(&before),profile_id:Some(before.profiles[0].profile_id.clone()),endpoint,private_http:false},&keys).unwrap();
        let initial:Target=serde_json::from_value(json!({"draftId":view["draftId"],"revision":view["revision"]})).unwrap();
        owner.key(&host,&initial,"public-draft-key").unwrap();let input=target(&owner);
        owner.connect(&host,Target{draft_id:input.draft_id.clone(),revision:input.revision}).unwrap();
        assert_eq!(wait(&owner,&host,&input)["state"],"connected");server.join().unwrap();
        let path=dir.path().join("ai-profiles.json");let original=std::fs::read(&path).unwrap();
        assert!(host.with_service(|s|fault.confirm(s,crate::ai_reload_fixture::WINDOWS_PROFILE,true)).unwrap().is_err());
        assert_eq!(original,std::fs::read(&path).unwrap());
        let settings=before.profiles[0].settings.clone();
        let saved=owner.save(&host,Save{draft_id:input.draft_id,revision:input.revision,settings},&keys).unwrap();
        assert_eq!(saved["cleanupPending"],true);
        let published=std::fs::read(&path).unwrap();assert_ne!(original,published);
        host.with_service(|s|fault.confirm(s,crate::ai_reload_fixture::WINDOWS_PROFILE,true)).unwrap().unwrap();
        assert!(host.with_service(|s|fault.read(s)).unwrap().is_err());
        assert_eq!(published,std::fs::read(&path).unwrap());
        for _ in 0..2 {assert!(host.with_service(|s|fault.read(s)).unwrap().is_ok());assert_eq!(published,std::fs::read(&path).unwrap());}
        assert!(host.with_service(|s|fault.confirm(s,crate::ai_reload_fixture::WINDOWS_PROFILE,true)).unwrap().is_err());
        owner.shutdown();
    }
    #[test]
    fn draft_connect_without_profile_or_model_save_reopen_and_no_secret_ipc() {
        let _serial=SERIAL.lock().unwrap();let(dir,host)=host();let keys=Keys::default();let owner=Arc::new(Service::default());let(endpoint,server,_)=start_server(200,None);
        let input=begin(&owner,&host,&keys,endpoint.clone());owner.key(&host,&input,"public-draft-key").unwrap();let input=target(&owner);
        assert!(host.with_service(|s|s.read().unwrap().profiles.is_empty()).unwrap());assert!(keys.0.lock().unwrap().is_empty());
        owner.connect(&host,Target{draft_id:input.draft_id.clone(),revision:input.revision}).unwrap();let view=wait(&owner,&host,&input);assert_eq!(view["state"],"connected");assert_eq!(view["models"],json!(["fixture"]));assert!(!view.to_string().contains("public-draft-key"));server.join().unwrap();
        let settings:StudioSettings=serde_json::from_value(json!({"label":"Draft first","endpoint":endpoint,"model":"fixture","privateHttp":false,"contextBudget":32768,"contextCeiling":32768,"maximumResponse":16384,"thinking":true})).unwrap();
        let saved=owner.save(&host,Save{draft_id:input.draft_id,revision:input.revision,settings:settings.clone()},&keys).unwrap();assert_eq!(saved["saved"],true);
        let records=LifecycleService::new(dir.path().to_owned()).unwrap();let reopened=records.read().unwrap();assert_eq!(reopened.profiles.len(),1);assert_eq!(reopened.profiles[0].settings,settings);
        assert_eq!(&*keys.read(&reopened.profiles[0].profile_id,reopened.profiles[0].credential.as_ref().unwrap()).unwrap().unwrap(),"public-draft-key");assert!(owner.draft.lock().unwrap().as_ref().unwrap().key.is_none());owner.shutdown();
    }
    #[test]
    fn draft_failure_retry_cancel_and_changed_target_preserve_profiles_and_discard_late_results() {
        let _serial=SERIAL.lock().unwrap();let(_dir,host)=host();let keys=Keys::default();let owner=Arc::new(Service::default());let(endpoint,server,_)=start_server(401,None);
        let input=begin(&owner,&host,&keys,endpoint);owner.key(&host,&input,"public-draft-key").unwrap();let input=target(&owner);owner.connect(&host,Target{draft_id:input.draft_id.clone(),revision:input.revision}).unwrap();let view=wait(&owner,&host,&input);assert_eq!(view["state"],"failed");assert_eq!(view["credentialReady"],true);server.join().unwrap();owner.shutdown();
        let(release,blocked)=std::sync::mpsc::channel();let(endpoint,server,received)=start_server(200,Some(blocked));let input=begin(&owner,&host,&keys,endpoint);owner.key(&host,&input,"public-draft-key").unwrap();let input=target(&owner);owner.connect(&host,Target{draft_id:input.draft_id.clone(),revision:input.revision}).unwrap();received.recv_timeout(Duration::from_secs(3)).unwrap();owner.cancel(&input,false).unwrap();release.send(()).unwrap();let result=wait(&owner,&host,&input);assert_ne!(result["state"],"connected");assert_eq!(result["models"],json!([]));server.join().unwrap();owner.shutdown();
        let input=begin(&owner,&host,&keys,"http://127.0.0.1:8888/v1".into());owner.key(&host,&input,"public-draft-key").unwrap();assert!(owner.status(&host,&input).is_err());let current=target(&owner);owner.cancel(&current,true).unwrap();assert!(owner.status(&host,&current).is_err());assert_eq!(host.with_service(|s|s.read().unwrap()).unwrap(),ProfileStore::default());assert!(keys.0.lock().unwrap().is_empty());
        assert!(serde_json::from_value::<Begin>(json!({"token":"t","profileId":null,"endpoint":"http://127.0.0.1:8888/v1","privateHttp":false,"key":"forbidden"})).is_err());
    }
    #[test]
    fn draft_saved_key_stays_owned_and_changed_profiles_or_origins_cannot_accept_late_results() {
        let _serial=SERIAL.lock().unwrap();let(_dir,host)=host();let keys=Keys::default();let owner=Arc::new(Service::default());
        let(release,blocked)=std::sync::mpsc::channel();let(endpoint,server,received)=start_server(200,Some(blocked));
        let settings:StudioSettings=serde_json::from_value(json!({"label":"Saved","endpoint":endpoint,"model":"fixture","privateHttp":false,"contextBudget":32768,"contextCeiling":32768,"maximumResponse":16384})).unwrap();
        let(id,_)=host.with_service(|s|credentials::save_connection(s,&keys,&credentials::token(&s.read().unwrap()),None,settings,"public-saved-key")).unwrap().unwrap();
        let saved=host.with_service(|s|s.read().unwrap()).unwrap();let owned=saved.profiles[0].credential.clone().unwrap();
        let view=owner.begin(&host,Begin{token:credentials::token(&saved),profile_id:Some(id.clone()),endpoint:endpoint.clone(),private_http:false},&keys).unwrap();assert_eq!(view["credentialReady"],true);
        let input=target(&owner);owner.key(&host,&input,"public-draft-key").unwrap();assert_eq!(host.with_service(|s|s.read().unwrap()).unwrap(),saved);assert_eq!(&*keys.read(&id,&owned).unwrap().unwrap(),"public-saved-key");
        let input=target(&owner);owner.connect(&host,Target{draft_id:input.draft_id.clone(),revision:input.revision}).unwrap();received.recv_timeout(Duration::from_secs(3)).unwrap();
        host.with_service(|s|{let old=s.read().unwrap();let mut settings=old.profiles[0].settings.clone();settings.label="External profile edit".into();credentials::save(s,&credentials::token(&old),Some(&id),settings).unwrap();}).unwrap();
        release.send(()).unwrap();assert_ne!(wait(&owner,&host,&input)["state"],"connected");server.join().unwrap();owner.shutdown();
        let current=host.with_service(|s|s.read().unwrap()).unwrap();assert_eq!(current.profiles[0].credential.as_ref(),Some(&owned));assert_eq!(&*keys.read(&id,&owned).unwrap().unwrap(),"public-saved-key");
        let view=owner.begin(&host,Begin{token:credentials::token(&current),profile_id:Some(id),endpoint:"http://127.0.0.1:9999/v1".into(),private_http:false},&keys).unwrap();assert_eq!(view["credentialReady"],false);owner.shutdown();
    }
}
