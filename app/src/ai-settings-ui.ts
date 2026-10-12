import { requestCore } from "./bridge.ts";
import type { CoreOperation } from "./protocol.ts";
interface StudioSettings { label:string; endpoint:string; model:string; privateHttp:boolean; contextCeiling:number; contextBudget:number; maximumResponse:number; temperature?:number; topP?:number }
interface Profile { profileId:string; revision:number; settings:StudioSettings; credentialStatus:string; credentialError?:string|null; disabled:boolean; compatibilityState?:string; compatibilityPayload?:string; discovery:null|{models:string[]; selectedAvailable:boolean; status:string} }
interface Snapshot { token:string; profiles:Profile[]; cleanup:{profileId:string;deferred?:boolean}[]; storageNotice?:string; saveStatus?:string }
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text="",cls=""):HTMLElementTagNameMap[K] {const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;}
export interface StudioSettingsController { canLeave():boolean; dispose():void }
export function mountStudioSettings(content:HTMLElement,footer:HTMLElement):StudioSettingsController {
  const root=el("div","","studio-settings");content.append(root);
  let snapshot:Snapshot|null=null,selected:string|null=null,busy=false,dirty=false,testId:string|null=null,testGeneration=0,disposed=false;
  const status=el("p","Loading saved profiles…","muted");status.role="status";
  const chooser=el("select");chooser.ariaLabel="Saved Studio profile";
  const fields=el("div");
  const input=(label:string,description:string,type="text"):HTMLInputElement=>{
    const line=el("div","","setting-row"),copy=el("div"),name=el("label",label),n=el("input");
    n.type=type;n.id=`studio-${label.toLowerCase().replace(/[^a-z]+/g,"-")}`;name.htmlFor=n.id;n.ariaLabel=label;
    copy.append(name,el("p",description,"muted"));line.append(copy,n);fields.append(line);return n;
  };
  const draftState=el("p","","studio-draft-state");
  root.append(el("h3","Unsloth Studio"),el("p","Saved on this computer. Saving does not connect.","muted"),chooser,status,fields);
  const label=input("Profile name","A local name for this connection."),endpoint=input("Endpoint","Base endpoint; loopback HTTP or verified HTTPS."),model=input("Model ID","Enter an exact model ID, or choose one after Refresh models.");
  const choices=el("datalist");choices.id="studio-model-choices";model.setAttribute("list",choices.id);root.append(choices);
  const privateHttp=input("Allow private-network HTTP","HTTP is unencrypted. Requires explicit opt-in for private LAN/VPN addresses.","checkbox");
  const ceiling=input("Configured capacity — unverified","Change loaded context in Studio if needed.","number"),budget=input("Total context budget","Includes input, response reserve and margin.","number"),response=input("Maximum response","A default token allowance; no generation is sent here.","number");
  [ceiling,budget,response].forEach(n=>{n.min="1";n.step="1";});
  const temperature=input("Temperature","How varied the writing is. Start at 1; lower it for more restrained output.","number"),topP=input("Top-p","How broad the word choices are. Start at 0.95.","number");
  temperature.min="0";temperature.max="2";temperature.step="0.01";topP.min="0";topP.max="1";topP.step="0.01";
  const credential=el("p","Credential: not configured","muted"),actions=el("div","","studio-actions");
  const button=(text:string):HTMLButtonElement=>{const b=el("button",text,"button");b.type="button";actions.append(b);return b;};
  const save=button("Save profile"),entry=button("Enter credential…"),removeKey=button("Remove credential"),discover=button("Refresh models"),remove=button("Remove profile"),retryRead=button("Retry"),reload=button("Reload saved profiles");save.classList.add("primary");
  const testSetup=button("Test setup"),cancelTest=button("Cancel setup test"),testPreview=el("details");testPreview.append(el("summary","Synthetic setup test request"));const testBody=el("pre");testPreview.append(testBody);root.append(testPreview);
  const cleanup=el("div"),storageNotice=el("p","","muted");
  const connection=el("section","","studio-group"),defaultsGroup=el("section","","studio-group"),keyGroup=el("section","","studio-group"),advanced=el("details","","studio-advanced"),maintenance=el("details","","studio-maintenance"),setup=el("section","","studio-group");
  connection.append(el("h4","Connection"));for(const n of [label,endpoint,model])connection.append(n.closest(".setting-row")!);
  defaultsGroup.append(el("h4","Response defaults"),el("p","Tokens measure request and response length. The total budget includes input, response reserve and a margin.","muted"));for(const n of [budget,response])defaultsGroup.append(n.closest(".setting-row")!);
  advanced.append(el("summary","Advanced settings · capacity, sampling and transport"));for(const n of [ceiling,temperature,topP,privateHttp])advanced.append(n.closest(".setting-row")!);
  const keyActions=el("div","","studio-actions"),setupActions=el("div","","studio-actions"),maintenanceActions=el("div","","studio-actions"),saveActions=el("div","","studio-actions studio-save-actions");
  keyActions.append(entry,removeKey);keyGroup.append(el("h4","Saved key"),credential,el("p","Configured keys are reused across sessions. Entry and replacement use the native dialog. Local removal does not revoke the key at Studio.","muted"),keyActions,storageNotice,cleanup);
  setupActions.append(testSetup,cancelTest);setup.append(el("h4","Setup readiness"),el("p","Test setup sends only the fixed test message below, with no project content.","muted"),setupActions,testPreview);
  maintenanceActions.append(discover,retryRead,reload,remove);maintenance.append(el("summary","Model list and profile maintenance"),el("p","Refresh models sends one authenticated GET. Availability does not prove capacity or proposal compatibility.","muted"),maintenanceActions);
  fields.append(connection,keyGroup,defaultsGroup,advanced);saveActions.append(draftState,save);root.append(setup,maintenance,saveActions);actions.remove();
  const active=():boolean=>!disposed&&root.isConnected;
  const state=():void=>{
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=busy||(!snapshot&&n!==retryRead&&n!==reload));
    const testing=testId!==null;testSetup.disabled=busy||testing||!snapshot||!selected||dirty||snapshot.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";cancelTest.disabled=!testing;
    save.disabled=busy||testing||!snapshot;entry.disabled=busy||!snapshot||!selected||dirty;removeKey.disabled=busy||!snapshot||!selected||dirty;remove.disabled=busy||!snapshot||!selected||dirty;entry.disabled ||= snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus==="unsupported";discover.disabled=busy||!snapshot||!selected||dirty||snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";
    if(testing){root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=n!==cancelTest);}
    draftState.textContent=busy?"Working…":dirty?"Unsaved profile changes":!snapshot?"Saved profiles unavailable":selected?"Saved profile settings":"New profile · unsaved";
    root.dataset.dirty=String(dirty);root.dataset.busy=String(busy||testing);cancelTest.hidden=!testing;
    footer.textContent="Profile changes need explicit Save. Refresh models and Test setup connect only when selected.";
  };
  const draw=():void=>{
    if(!snapshot||!active())return;
    chooser.replaceChildren();snapshot.profiles.forEach(p=>{const o=el("option",p.settings.label);o.value=p.profileId;chooser.append(o);});const fresh=el("option","New Studio profile");fresh.value="";chooser.append(fresh);chooser.value=selected??"";
    const p=snapshot.profiles.find(p=>p.profileId===selected);const s=p?.settings;
    for(const [input,error] of errors){error.textContent="";input.removeAttribute("aria-invalid");}
    label.value=s?.label??"Studio";endpoint.value=s?.endpoint??"http://127.0.0.1:8888/v1";model.value=s?.model??"";privateHttp.checked=s?.privateHttp??false;ceiling.value=String(s?.contextCeiling??8192);budget.value=String(s?.contextBudget??4096);response.value=String(s?.maximumResponse??1024);temperature.value=String(s?.temperature??1);topP.value=String(s?.topP??0.95);
    credential.textContent=`Credential: ${p?.credentialStatus??"not configured"}${p?.disabled?" · profile disabled":""}`;entry.textContent=p?.credentialStatus==="configured"?"Replace credential…":["unavailable","deferred","missing"].includes(p?.credentialStatus??"")&&p?.credentialError?"Re-enter API key":"Enter credential…";
    storageNotice.textContent=snapshot.storageNotice??"";
    status.textContent=p?.credentialError??p?.discovery?.status??(p?.compatibilityState==="ready"?"Saved configuration":"Not checked for this saved configuration");
    testBody.textContent=p?.compatibilityPayload??"Save a profile to inspect the fixed synthetic request. No project content is sent.";
    if(p?.compatibilityState)status.textContent+=p.compatibilityState==="ready"?" · Setup tested for structured proposals":" · Setup untested; run Test setup before a project send";
    choices.replaceChildren();p?.discovery?.models.forEach(id=>{const o=el("option");o.value=id;choices.append(o);});
    cleanup.replaceChildren();for(const id of new Set(snapshot.cleanup.filter(c=>!c.deferred).map(c=>c.profileId))){const b=el("button","Retry owned credential cleanup","button");b.addEventListener("click",()=>{if(canLeave())void run("ai.cleanup",{profileId:id,token:snapshot!.token});});cleanup.append(b,el("p","A retained credential needs cleanup. No other profile's key is removed.","muted"));}
    if(snapshot.cleanup.some(c=>c.deferred))cleanup.append(el("p","Apple Keychain cleanup deferred; owned references retained.","muted"));
    dirty=false;state();
  };
  const run=async(op:CoreOperation,payload:Record<string,unknown>={},initial=false):Promise<void>=>{
    if(busy)return;busy=true;state();status.textContent=op==="ai.discover"?"Refreshing models…":"Working…";
    try{const result=await requestCore<Snapshot&{cancelled?:boolean;reloadRequired?:boolean}>(op,payload);if(!active())return;
      if(!result.ok){status.textContent=result.error.message;return;}
      if(result.value.reloadRequired){snapshot=null;status.textContent=result.value.saveStatus??"Saved; reload required.";return;}
      if(result.value.cancelled){status.textContent="Credential entry cancelled; saved profile unchanged.";return;}
      snapshot=result.value;if(initial)selected=snapshot.profiles[0]?.profileId??null;else if(!selected&&op==="ai.saveProfile")selected=snapshot.profiles.at(-1)?.profileId??null;else if(selected&&!snapshot.profiles.some(p=>p.profileId===selected))selected=null;
      draw();if(result.value.saveStatus)status.textContent=result.value.saveStatus;
    }catch{if(active())status.textContent="AI settings service unavailable. Saved data is retained.";}finally{busy=false;if(active())state();}
  };
  const canLeave=():boolean=>{if(busy||testId){status.textContent="Finish the current action or cancel the setup test before leaving.";return false;}return !dirty||window.confirm("Discard unsaved Studio profile changes?");};
  const validators=new Map<HTMLInputElement,()=>string>();
  const bytes=(text:string):number=>new TextEncoder().encode(text).length;
  const nameRule=(n:HTMLInputElement,max:number,name:string):string=>!n.value.trim()?`Enter ${name}.`:bytes(n.value)>max||/[\u0000-\u001f\u007f-\u009f]/u.test(n.value)?`Use at most ${max} UTF-8 bytes and no control characters.`:"";
  validators.set(label,()=>nameRule(label,80,"a profile name"));validators.set(model,()=>nameRule(model,256,"the exact model ID"));
  // Transport canonicalization/admission remains core-owned. Do not invent a
  // renderer URL policy or normalize the author's endpoint behind their back.
  validators.set(endpoint,()=>endpoint.value.trim()?"":"Enter the Studio base endpoint.");
  const whole=(n:HTMLInputElement,min:number,max:number):boolean=>!!n.value.trim()&&Number.isInteger(Number(n.value))&&Number(n.value)>=min&&Number(n.value)<=max;
  validators.set(ceiling,()=>whole(ceiling,256,2000000)?"":"Enter a whole number from 256 to 2,000,000 tokens.");
  validators.set(budget,()=>whole(budget,256,2000000)&&Number(budget.value)<=Number(ceiling.value)?"":"Enter a whole number from 256 tokens up to the configured capacity.");
  validators.set(response,()=>whole(response,1,2000000)&&Number(response.value)+128<Number(budget.value)?"":"Enter a whole number greater than 0, leaving more than 128 tokens in the total budget.");
  validators.set(temperature,()=>temperature.value.trim()&&Number.isFinite(Number(temperature.value))&&Number(temperature.value)>=0&&Number(temperature.value)<=2?"":"Enter a number from 0 to 2.");
  validators.set(topP,()=>topP.value.trim()&&Number.isFinite(Number(topP.value))&&Number(topP.value)>=0&&Number(topP.value)<=1?"":"Enter a number from 0 to 1.");
  const errors=new Map<HTMLInputElement,HTMLElement>();
  const validate=(n:HTMLInputElement):boolean=>{const text=validators.get(n)!();errors.get(n)!.textContent=text;n.setAttribute("aria-invalid",String(!!text));return !text;};
  for(const n of validators.keys()){const error=el("span","","field-error");error.id=`${n.id}-error`;errors.set(n,error);n.setAttribute("aria-describedby",error.id);n.closest(".setting-row")!.append(error);let composing=false;n.addEventListener("compositionstart",()=>{composing=true;});n.addEventListener("compositionend",()=>{composing=false;});n.addEventListener("blur",()=>{if(!composing)validate(n);});n.addEventListener("input",()=>{if(!composing&&error.textContent)validate(n);});}
  fields.addEventListener("input",()=>{const first=!dirty;dirty=true;if(first)status.textContent="Unsaved changes. Save before testing this setup or managing its key. Readiness applies only to the saved configuration.";state();});
  chooser.addEventListener("change",()=>{if(!canLeave()){chooser.value=selected??"";return;}selected=chooser.value||null;draw();});
  save.addEventListener("click",()=>{
    let first:HTMLInputElement|undefined;for(const n of validators.keys())if(!validate(n))first??=n;
    if(first){const details=first.closest("details");if(details)details.open=true;status.textContent="Correct the marked fields before saving. Your profile changes are retained.";first.focus();return;}
    const t=Number(temperature.value),p=Number(topP.value);
    if(!temperature.value.trim()||!topP.value.trim()||!Number.isFinite(t)||t<0||t>2||!Number.isFinite(p)||p<0||p>1){status.textContent="Temperature must be 0–2 and Top-p must be 0–1. Saved settings are unchanged.";return;}
    void run("ai.saveProfile",{token:snapshot!.token,profileId:selected,settings:{label:label.value,endpoint:endpoint.value,model:model.value,privateHttp:privateHttp.checked,contextCeiling:Number(ceiling.value),contextBudget:Number(budget.value),maximumResponse:Number(response.value),temperature:t,topP:p}});
  });
  for(const [b,op] of [[entry,"ai.enterCredential"],[removeKey,"ai.removeCredential"],[discover,"ai.discover"],[remove,"ai.removeProfile"]] as const)b.addEventListener("click",()=>void run(op,{token:snapshot!.token,profileId:selected}));
  testSetup.addEventListener("click",()=>void(async()=>{
    if(testSetup.disabled||!snapshot||!selected)return;
    const version=++testGeneration;busy=true;state();
    try{
      const started=await requestCore<{requestId:string}>("ai.testCompatibility",{token:snapshot.token,profileId:selected,sessionId:null,timeoutSeconds:60});
      if(!started.ok)throw Error(started.error.message);testId=started.value.requestId;busy=false;state();
      const poll=async():Promise<void>=>{
        if(!active()||version!==testGeneration){await requestCore("ai.cancelRequest",{requestId:started.value.requestId});return;}
        try{
          const result=await requestCore<{done:boolean;state:string;message:string|null}>("ai.requestStatus",{requestId:started.value.requestId});
          if(!active()||version!==testGeneration)return;
          if(!result.ok)throw Error(result.error.message);
          if(!result.value.done){status.textContent="Testing this saved setup… No project content is sent.";setTimeout(()=>void poll(),250);return;}
          testId=null;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Setup tested for structured proposals. Every generated result still needs review.":result.value.message??"Setup test did not complete; no compatibility recorded.";state();
        }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Setup test status unavailable; Cancel remains available.";state();}
      };void poll();
    }catch(e){testId=null;busy=false;status.textContent=e instanceof Error?e.message:"Setup test unavailable.";state();}
  })());
  cancelTest.addEventListener("click",()=>void(async()=>{
    if(!testId)return;const id=testId,version=++testGeneration;
    try{
      const result=await requestCore<{state:string}>("ai.cancelRequest",{requestId:id});
      if(!active()||version!==testGeneration)return;
      if(result.ok){testId=null;busy=false;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Setup test already completed. Its result remains recorded.":"Setup test cancelled. No compatibility recorded.";}else status.textContent=result.error.message;
    }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Setup test cancellation unavailable; retry Cancel.";}
    state();
  })());
  retryRead.addEventListener("click",()=>{if(canLeave())void run("ai.profiles");});
  reload.addEventListener("click",()=>{if(canLeave())void run("ai.profiles",{},true);});
  void run("ai.profiles",{},true);
  return {canLeave,dispose:()=>{disposed=true;++testGeneration;root.remove();}};
}
