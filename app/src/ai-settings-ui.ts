import { requestCore } from "./bridge.ts";
import type { CoreOperation } from "./protocol.ts";
interface ModelLoadSettings { parallel:number; gpuMemoryMode:"auto"|"manual"; fit:"on"|"off" }
interface ModelLoadValues { contextLength:number; parallel:number; gpuMemoryMode:"auto"|"manual"; fit:"on"|"off" }
interface ModelLoadReport { modelId:string; resolvedModelId?:string; requested:ModelLoadValues; saved:Partial<ModelLoadValues>|null; effective:Partial<ModelLoadValues>|null; autoSwitchEnabled:boolean|null; applied:boolean; warnings:string[]; message:string }
interface StudioSettings { modelLoad?:ModelLoadSettings; label:string; endpoint:string; model:string; privateHttp:boolean; contextCeiling:number; contextBudget:number; maximumResponse:number; thinking?:boolean; temperature?:number; topP?:number }
interface Profile { profileId:string; revision:number; settings:StudioSettings; credentialStatus:string; credentialError?:string|null; disabled:boolean; compatibilityState?:string; compatibilityPayload?:string; discovery:null|{models:string[]; selectedAvailable:boolean; status:string;inventory?:{id:string;loaded:boolean|null;actualContext:number|null}[]} }
interface ConnectionDraft {draftId:string;revision:number;credentialReady:boolean;state:string;message:string;models:string[];cancelled?:boolean}
interface Snapshot { token:string; profiles:Profile[]; cleanup:{profileId:string;deferred?:boolean}[]; storageNotice?:string; saveStatus?:string }
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text="",cls=""):HTMLElementTagNameMap[K] {const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;}
export interface StudioSettingsController { canLeave():boolean; dispose():void }
export function mountStudioSettings(content:HTMLElement,footer:HTMLElement):StudioSettingsController {
  const root=el("div","","studio-settings");content.append(root);
  let snapshot:Snapshot|null=null,selected:string|null=null,busy=false,dirty=false,testId:string|null=null,testGeneration=0,disposed=false,readFailed=false,hasLoaded=false;
  let connectionDraft:ConnectionDraft|null=null,connectionGeneration=0,connecting=false,addressDirty=false;
  const status=el("p","Loading saved profiles…","muted");status.role="status";
  const chooser=el("select");chooser.ariaLabel="Saved Studio profile";
  const fields=el("div");
  const input=(label:string,description:string,type="text"):HTMLInputElement=>{
    const line=el("div","","setting-row"),copy=el("div"),name=el("label",label),n=el("input");
    n.type=type;n.id=`studio-${label.toLowerCase().replace(/[^a-z]+/g,"-")}`;name.htmlFor=n.id;n.ariaLabel=label;
    copy.append(name,el("p",description,"muted"));line.append(copy,n);fields.append(line);return n;
  };
  const choice=(label:string,description:string,options:readonly (readonly [string,string])[]):HTMLSelectElement=>{
    const row=el("div","","setting-row"),copy=el("div"),name=el("label",label),select=el("select");select.id=`studio-${label.toLowerCase().replace(/[^a-z]+/g,"-")}`;select.ariaLabel=label;name.htmlFor=select.id;
    for(const [value,text]of options){const option=el("option",text);option.value=value;select.append(option);}copy.append(name,el("p",description,"muted"));row.append(copy,select);fields.append(row);return select;
  };
  const draftState=el("p","","studio-draft-state");
  root.append(el("h3","Unsloth Studio"),el("p","Profiles are saved only on this computer. Saving a profile does not connect.","muted"),chooser,status,fields);
  const label=input("Profile name","A local name for this connection."),endpoint=input("Endpoint","Base endpoint; loopback HTTP or verified HTTPS."),model=input("Model ID","Enter an exact model ID, or choose one after you Refresh models.");
  const choices=el("datalist");choices.id="studio-model-choices";model.setAttribute("list",choices.id);root.append(choices);
  const privateHttp=input("Allow private-network HTTP","HTTP is unencrypted. Private LAN/VPN addresses need explicit opt-in. Loopback HTTP needs no private-network opt-in.","checkbox");
  const budget=input("Context length","Total tokens for the request and response. The response reserve and safety margin must fit within this total. Also used when requesting model-load context.","number"),response=input("Maximum response length","Maximum number of tokens to generate. Reaching this limit may cut the response short.","number");
  [budget,response].forEach(n=>{n.min="1";n.step="1";});
  const thinking=input("Thinking","Let the model think before answering. Thinking uses part of the response allowance and may take longer.","checkbox");
  const parallel=input("Parallel slots","How many decoding slots Studio should allow for this model. Choose a whole number from 1 to 64.","number");parallel.min="1";parallel.max="64";parallel.step="1";
  const gpuMemoryMode=choice("GPU memory mode","Automatic lets Studio choose memory placement. Manual requests Studio's manual mode; it does not guarantee a GPU-layer count.",[["auto","Automatic"],["manual","Manual"]]);
  const memoryFit=choice("Automatic memory fitting","Off requests no automatic fitting. Actual loaded settings are checked separately and may differ.",[["on","On"],["off","Off"]]);
  const temperature=input("Temperature","How varied the writing is. Start at 1; lower it for more restrained output.","number"),topP=input("Top-p","How broad the word choices are. Start at 0.95.","number");
  temperature.min="0";temperature.max="2";temperature.step="0.01";topP.min="0";topP.max="1";topP.step="0.01";
  const credential=el("p","Credential: not configured","muted"),actions=el("div","","studio-actions");
  const button=(text:string):HTMLButtonElement=>{const b=el("button",text,"button");b.type="button";actions.append(b);return b;};
  const save=button("Save profile"),entry=button("Enter credential…"),removeKey=button("Remove credential"),discover=button("Connect"),remove=button("Remove profile"),retryRead=button("Retry loading profiles"),reload=button("Reload profiles"),readModelLoad=button("Read model-load settings"),applyModelLoad=button("Apply model-load settings");save.classList.add("primary");
  const cancelConnection=button("Cancel connection"),connectionStatus=el("p","Enter an API key, then Connect to retrieve available models.","muted");connectionStatus.role="status";
  const testSetup=button("Test response format"),cancelTest=button("Cancel response format test"),testPreview=el("details");testPreview.append(el("summary","Synthetic response format test request"));const testBody=el("pre");testPreview.append(testBody);root.append(testPreview);
  const cleanup=el("div"),storageNotice=el("p","","muted"),testStatus=el("p","","muted");
  const connection=el("section","","studio-group"),defaultsGroup=el("section","","studio-group"),keyGroup=el("section","","studio-group"),advanced=el("details","","studio-advanced"),maintenance=el("details","","studio-maintenance"),setup=el("section","","studio-group"),danger=el("section","","studio-group studio-danger-zone"),loadGroup=el("section","","studio-group studio-model-loading"),loadReport=el("div","","studio-model-load-report");loadReport.hidden=true;
  connection.append(el("h4","Connection"));for(const n of [label,endpoint,privateHttp])connection.append(n.closest(".setting-row")!);
  const connectGroup=el("section","","studio-group studio-connect"),modelGroup=el("section","","studio-group studio-model-choice"),modelActions=el("div","","studio-actions");modelActions.append(discover,cancelConnection);connectGroup.append(connectionStatus,modelActions);modelGroup.append(model.closest(".setting-row")!);
  const privateRow=privateHttp.closest<HTMLElement>(".setting-row")!;
  const transportVisibility=():void=>{privateRow.hidden=!endpoint.value.trim()||/^https:/i.test(endpoint.value.trim());};
  endpoint.addEventListener("input",transportVisibility);
  defaultsGroup.append(el("h4","Response defaults"),el("p","Tokens measure request and response length. The context length includes input, response reserve and a margin.","muted"));for(const n of [budget,response,thinking])defaultsGroup.append(n.closest(".setting-row")!);
  const loadActions=el("div","","studio-actions");loadActions.append(readModelLoad,applyModelLoad);
  loadGroup.append(el("h4","Model loading"),el("p","Suggested starting values are 1 slot, Manual memory mode and fitting Off. You can change them. The Context length above is also the requested model-load context.","muted"));
  for(const n of [parallel,gpuMemoryMode,memoryFit])loadGroup.append(n.closest(".setting-row")!);
  loadGroup.append(el("p","Save profile stores these preferences only on this computer and sends nothing. Read contacts Studio to inspect this saved model. Save profile first to store model-loading preferences before applying them to Studio. Apply explicitly updates that model's saved Studio settings; it does not reload an active model or enable automatic model switching.","muted"),loadActions,loadReport);
  advanced.append(el("summary","Advanced settings · sampling"));for(const n of [temperature,topP])advanced.append(n.closest(".setting-row")!);
  const keyActions=el("div","","studio-actions"),setupActions=el("div","","studio-actions"),maintenanceActions=el("div","","studio-actions"),saveActions=el("div","","studio-actions studio-save-actions");
  keyActions.append(entry,removeKey);keyGroup.append(el("h4","API Key"),credential,keyActions,storageNotice,cleanup);
  setupActions.append(testSetup,cancelTest);setup.append(el("h4","Response format test"),el("p","Send a small test request to check whether Unsloth Studio can return the response format Loomlight needs. No project content is sent.","muted"),testStatus,setupActions,testPreview);
  maintenanceActions.append(retryRead,reload);maintenance.append(el("summary","Profile maintenance"),maintenanceActions);
  const removalConfirmation=el("div"),removalNotice=el("p"),removalActions=el("div","","studio-actions"),cancelRemoval=el("button","Cancel","button"),confirmRemoval=el("button","Remove profile","button danger");
  cancelRemoval.type=confirmRemoval.type="button";removalConfirmation.hidden=true;remove.classList.add("danger");
  removalActions.append(cancelRemoval,confirmRemoval);removalConfirmation.append(removalNotice,removalActions);danger.append(el("h4","Danger Zone"),remove,removalConfirmation);
  fields.append(connection,keyGroup,connectGroup,modelGroup,defaultsGroup,loadGroup,advanced);saveActions.append(draftState,save);root.append(setup,maintenance,danger,saveActions);actions.remove();
  const active=():boolean=>!disposed&&root.isConnected;
  const resetLoadReport=():void=>{loadReport.replaceChildren();loadReport.hidden=true;delete loadReport.dataset.outcome;delete loadReport.dataset.modelId;};
  const state=():void=>{
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=busy||(!snapshot&&n!==retryRead&&n!==reload));
    retryRead.hidden=!readFailed;
    const testing=testId!==null;testSetup.disabled=busy||testing||!snapshot||!selected||dirty||snapshot.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";cancelTest.disabled=!testing;
    save.disabled=busy||testing||!snapshot||((!selected||addressDirty)&&!connectionDraft)||!!connectionDraft&&(connectionDraft.state!=="connected"||!connectionDraft.models.includes(model.value));entry.disabled=busy||testing||!snapshot||!endpoint.value.trim();removeKey.disabled=busy||!snapshot||!selected||dirty;remove.disabled=busy||!snapshot||!selected||dirty;confirmRemoval.disabled=remove.disabled;cancelRemoval.disabled=busy;entry.disabled ||= snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus==="unsupported";discover.disabled=busy||testing||!snapshot||!endpoint.value.trim()||!(connectionDraft?.credentialReady||snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus==="configured");
    cancelConnection.hidden=!connecting;cancelConnection.disabled=!connecting;model.disabled=busy||testing||!snapshot||(!connectionDraft&&(!selected||addressDirty))||!!connectionDraft&&connectionDraft.state!=="connected";modelGroup.hidden=(!selected||addressDirty)&&connectionDraft?.state!=="connected";
    const managementProfile=snapshot?.profiles.find(p=>p.profileId===selected);
    readModelLoad.disabled=busy||testing||!snapshot||!selected||dirty||managementProfile?.disabled===true||managementProfile?.credentialStatus!=="configured";
    applyModelLoad.disabled=readModelLoad.disabled||!managementProfile?.settings.modelLoad;
    if(testing){root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=n!==cancelTest);}
    draftState.textContent=busy?"Working…":dirty?"Unsaved profile changes":!snapshot?"Saved profiles unavailable":selected?"Saved profile settings":"New profile · unsaved";
    root.dataset.dirty=String(dirty);root.dataset.busy=String(busy||testing);cancelTest.hidden=!testing;
    footer.textContent="Connect checks access and retrieves models. Test response format sends a separate synthetic request. Save profile stores settings and the draft key locally.";
  };
  const draw=():void=>{
    if(!snapshot||!active())return;
    chooser.replaceChildren();snapshot.profiles.forEach(p=>{const o=el("option",p.settings.label);o.value=p.profileId;chooser.append(o);});const fresh=el("option","New Studio profile");fresh.value="";chooser.append(fresh);chooser.value=selected??"";
    const p=snapshot.profiles.find(p=>p.profileId===selected);const s=p?.settings;clearConnection();addressDirty=false;resetLoadReport();
    for(const [input,error] of errors){error.textContent="";input.removeAttribute("aria-invalid");}
    label.value=s?.label??"Studio";endpoint.value=s?.endpoint??"http://127.0.0.1:8888/v1";model.value=s?.model??"";privateHttp.checked=s?.privateHttp??false;budget.value=String(s?.contextBudget??32768);response.value=String(s?.maximumResponse??16384);thinking.checked=s?.thinking??true;transportVisibility();removalConfirmation.hidden=true;remove.hidden=false;temperature.value=String(s?.temperature??1);topP.value=String(s?.topP??0.95);parallel.value=String(s?.modelLoad?.parallel??1);gpuMemoryMode.value=s?.modelLoad?.gpuMemoryMode??"manual";memoryFit.value=s?.modelLoad?.fit??"off";
    credential.textContent=`Credential: ${p?.credentialStatus??"not configured"}${p?.disabled?" · profile disabled":""}`;entry.textContent=p?.credentialStatus==="configured"?"Replace credential…":["unavailable","deferred","missing"].includes(p?.credentialStatus??"")&&p?.credentialError?"Re-enter API key":"Enter credential…";
    storageNotice.textContent=/Mac/i.test(window.navigator.platform)||snapshot.storageNotice?.startsWith("Temporary Mac development storage")?"macOS: API keys are encrypted and stored on this computer. Software running under your user account may be able to decrypt them.":snapshot.storageNotice??"";
    status.textContent=p?.credentialError??p?.discovery?.status??(p?"Saved configuration":"New profile · unsaved");
    const detected=p?.discovery?.inventory?.find(item=>item.id===p.settings.model);
    if(detected?.loaded&&detected.actualContext)status.textContent+=` · Detected loaded context: ${detected.actualContext.toLocaleString()} tokens (read-only)`;
    connectionStatus.textContent="Enter an API key, then Connect to retrieve available models.";
    testBody.textContent=p?.compatibilityPayload??"Save a profile to inspect the fixed synthetic request. No project content is sent.";
    testStatus.textContent=p?(p.compatibilityState==="ready"?"Response format tested for structured proposals":"Response format not tested yet"):"";testStatus.hidden=!p;
    choices.replaceChildren();p?.discovery?.models.forEach(id=>{const o=el("option");o.value=id;choices.append(o);});
    cleanup.replaceChildren();for(const id of new Set(snapshot.cleanup.filter(c=>!c.deferred).map(c=>c.profileId))){const b=el("button","Retry owned credential cleanup","button");b.addEventListener("click",()=>{if(canLeave())void run("ai.cleanup",{profileId:id,token:snapshot!.token});});cleanup.append(b,el("p","A retained credential needs cleanup. No other profile's key is removed.","muted"));}
    if(snapshot.cleanup.some(c=>c.deferred))cleanup.append(el("p","Apple Keychain cleanup deferred; owned references retained.","muted"));
    dirty=false;state();
  };
  const run=async(op:CoreOperation,payload:Record<string,unknown>={}):Promise<void>=>{
    if(busy)return;busy=true;state();status.textContent=op==="ai.discover"?"Refreshing models…":"Working…";
    try{const result=await requestCore<Snapshot&{cancelled?:boolean;reloadRequired?:boolean}>(op,payload);if(!active())return;
      if(!result.ok){if(op==="ai.profiles")readFailed=true;status.textContent=result.error.message;return;}
      if(result.value.reloadRequired){snapshot=null;readFailed=true;status.textContent=result.value.saveStatus??"Saved; reload required.";return;}
      if(result.value.cancelled){status.textContent="Credential entry cancelled; saved profile unchanged.";return;}
      snapshot=result.value;readFailed=false;if(!hasLoaded){selected=snapshot.profiles[0]?.profileId??null;hasLoaded=true;}else if(!selected&&op==="ai.saveProfile")selected=snapshot.profiles.at(-1)?.profileId??null;else if(selected&&!snapshot.profiles.some(p=>p.profileId===selected))selected=null;
      draw();if(result.value.saveStatus)status.textContent=result.value.saveStatus;
    }catch{if(op==="ai.profiles")readFailed=true;if(active())status.textContent="AI settings service unavailable. Saved data is retained.";}finally{busy=false;if(active())state();}
  };
  const canLeave=():boolean=>{if(busy||testId){status.textContent="Finish the current action or cancel the response format test before leaving.";return false;}return !dirty||window.confirm("Discard unsaved Studio profile changes?");};
  const validators=new Map<HTMLInputElement|HTMLSelectElement,()=>string>();
  const bytes=(text:string):number=>new TextEncoder().encode(text).length;
  const nameRule=(n:HTMLInputElement,max:number,name:string):string=>!n.value.trim()?`Enter ${name}.`:bytes(n.value)>max||/[\u0000-\u001f\u007f-\u009f]/u.test(n.value)?`Use at most ${max} UTF-8 bytes and no control characters.`:"";
  validators.set(label,()=>nameRule(label,80,"a profile name"));validators.set(model,()=>nameRule(model,256,"the exact model ID"));
  // Transport canonicalization/admission remains core-owned. Do not invent a
  // renderer URL policy or normalize the author's endpoint behind their back.
  validators.set(endpoint,()=>endpoint.value.trim()?"":"Enter the Studio base endpoint.");
  const whole=(n:HTMLInputElement,min:number,max:number):boolean=>!!n.value.trim()&&Number.isInteger(Number(n.value))&&Number(n.value)>=min&&Number(n.value)<=max;
  validators.set(budget,()=>whole(budget,256,2000000)?"":"Enter a whole number from 256 to 2,000,000 tokens.");
  validators.set(response,()=>whole(response,1,2000000)&&Number(response.value)+128<Number(budget.value)?"":"Enter a whole number greater than 0, leaving more than 128 tokens in the context length.");
  validators.set(parallel,()=>whole(parallel,1,64)?"":"Enter a whole number from 1 to 64 parallel slots.");
  validators.set(gpuMemoryMode,()=>["auto","manual"].includes(gpuMemoryMode.value)?"":"Choose Automatic or Manual GPU memory mode.");
  validators.set(memoryFit,()=>["on","off"].includes(memoryFit.value)?"":"Choose On or Off for automatic memory fitting.");
  validators.set(temperature,()=>temperature.value.trim()&&Number.isFinite(Number(temperature.value))&&Number(temperature.value)>=0&&Number(temperature.value)<=2?"":"Enter a number from 0 to 2.");
  validators.set(topP,()=>topP.value.trim()&&Number.isFinite(Number(topP.value))&&Number(topP.value)>=0&&Number(topP.value)<=1?"":"Enter a number from 0 to 1.");
  const errors=new Map<HTMLInputElement|HTMLSelectElement,HTMLElement>();
  const validate=(n:HTMLInputElement|HTMLSelectElement):boolean=>{const text=validators.get(n)!();errors.get(n)!.textContent=text;n.setAttribute("aria-invalid",String(!!text));return !text;};
  for(const n of validators.keys()){const error=el("span","","field-error");error.id=`${n.id}-error`;errors.set(n,error);n.setAttribute("aria-describedby",error.id);n.closest(".setting-row")!.append(error);let composing=false;n.addEventListener("compositionstart",()=>{composing=true;});n.addEventListener("compositionend",()=>{composing=false;});n.addEventListener("blur",()=>{if(!composing)validate(n);});n.addEventListener("input",()=>{if(!composing&&error.textContent)validate(n);});}
  const changed=():void=>{resetLoadReport();removalConfirmation.hidden=true;remove.hidden=false;const first=!dirty;dirty=true;if(first)status.textContent="Unsaved changes. Save before connecting or managing this model or its key. Readiness applies only to the saved configuration.";state();};
  fields.addEventListener("input",changed);fields.addEventListener("change",changed);
  for(const input of [endpoint,privateHttp]){input.addEventListener("input",()=>clearConnection(true));input.addEventListener("change",()=>clearConnection(true));}
  chooser.addEventListener("change",()=>{if(!canLeave()){chooser.value=selected??"";return;}selected=chooser.value||null;draw();});
  save.addEventListener("click",()=>void(async()=>{
    let first:HTMLInputElement|HTMLSelectElement|undefined;for(const n of validators.keys())if(!validate(n))first??=n;
    if(first){const details=first.closest("details");if(details)details.open=true;status.textContent="Correct the marked fields before saving. Your profile changes are retained.";first.focus();return;}
    const t=Number(temperature.value),p=Number(topP.value);
    if(!temperature.value.trim()||!topP.value.trim()||!Number.isFinite(t)||t<0||t>2||!Number.isFinite(p)||p<0||p>1){status.textContent="Temperature must be 0–2 and Top-p must be 0–1. Saved settings are unchanged.";return;}
    const settings={label:label.value,endpoint:endpoint.value,model:model.value,privateHttp:privateHttp.checked,contextCeiling:Number(budget.value),contextBudget:Number(budget.value),maximumResponse:Number(response.value),thinking:thinking.checked,temperature:t,topP:p,modelLoad:{parallel:Number(parallel.value),gpuMemoryMode:gpuMemoryMode.value,fit:memoryFit.value}};
    if(connectionDraft){
      const draft=connectionDraft,version=connectionGeneration;busy=true;state();
      try{const result=await requestCore<{profileId:string;cleanupPending:boolean}>("ai.saveConnection",{draftId:draft.draftId,revision:draft.revision,settings});if(!active()||version!==connectionGeneration)return;if(!result.ok)throw Error(result.error.message);selected=result.value.profileId;clearConnection();dirty=false;snapshot=null;busy=false;await run("ai.profiles");if(active())status.textContent=readFailed?"Profile saved; saved profiles could not be reloaded. Retry loading profiles before further changes.":result.value.cleanupPending?"Profile saved; owned credential cleanup is pending.":"Profile saved. Test response format before generating.";}
      catch(error){if(active())status.textContent=error instanceof Error?error.message:"Profile save unavailable; draft retained.";}finally{busy=false;if(active())state();}
    }else await run("ai.saveProfile",{token:snapshot!.token,profileId:selected,settings});
  })());
  for(const [b,op] of [[removeKey,"ai.removeCredential"]] as const)b.addEventListener("click",()=>void run(op,{token:snapshot!.token,profileId:selected}));
  const target=(draft:ConnectionDraft)=>({draftId:draft.draftId,revision:draft.revision});
  const clearConnection=(changedAddress=false):void=>{
    ++connectionGeneration;connecting=false;const previous=connectionDraft;connectionDraft=null;
    if(previous)void requestCore("ai.discardConnection",target(previous)).catch(()=>{});
    if(changedAddress){addressDirty=true;model.value="";choices.replaceChildren();connectionStatus.textContent="Address changed. Enter the API key for this address and Connect again.";state();}
  };
  const ensureConnection=async(version:number):Promise<ConnectionDraft>=>{
    if(connectionDraft)return connectionDraft;
    const result=await requestCore<ConnectionDraft>("ai.beginConnection",{token:snapshot!.token,profileId:selected,endpoint:endpoint.value,privateHttp:privateHttp.checked});
    if(!result.ok)throw Error(result.error.message);
    if(!active()||version!==connectionGeneration){void requestCore("ai.discardConnection",target(result.value));throw Error("Connection draft changed.");}
    connectionDraft=result.value;return result.value;
  };
  const showConnection=(value:ConnectionDraft):void=>{
    connectionDraft=value;connectionStatus.textContent=value.message;
    credential.textContent=value.credentialReady?"API key ready in this native connection draft; Save profile stores it locally.":"Enter an API key for this connection.";
    choices.replaceChildren();for(const id of value.models){const option=el("option");option.value=id;choices.append(option);}
    if(value.state!=="connected"||!value.models.includes(model.value))model.value="";
    state();
  };
  entry.addEventListener("click",()=>void(async()=>{
    if(entry.disabled)return;const version=connectionGeneration,previousDraft=connectionDraft;busy=true;state();
    try{const draft=await ensureConnection(version);const result=await requestCore<ConnectionDraft>("ai.enterConnectionKey",target(draft));if(!active()||version!==connectionGeneration)return;if(!result.ok)throw Error(result.error.message);if(result.value.cancelled&&!previousDraft){clearConnection();connectionStatus.textContent="API key entry cancelled; saved profile unchanged.";}else{showConnection(result.value);if(result.value.cancelled)connectionStatus.textContent="API key entry cancelled; draft retained.";else{dirty=true;resetLoadReport();}}}
    catch(error){if(active()&&version===connectionGeneration)connectionStatus.textContent=error instanceof Error?error.message:"Native API key entry unavailable; draft retained.";}finally{busy=false;if(active())state();}
  })());
  discover.addEventListener("click",()=>void(async()=>{
    if(discover.disabled)return;const version=connectionGeneration;busy=true;connecting=true;state();connectionStatus.textContent="Connecting and retrieving available models…";
    try{const draft=await ensureConnection(version);const result=await requestCore<ConnectionDraft>("ai.connect",target(draft));if(!active()||version!==connectionGeneration)return;if(!result.ok)throw Error(result.error.message);showConnection(result.value);
      while(active()&&version===connectionGeneration&&connectionDraft?.state==="connecting"){
        await new Promise<void>(resolve=>window.setTimeout(resolve,120));
        if(!active()||version!==connectionGeneration)return;
        const status=await requestCore<ConnectionDraft>("ai.connectionStatus",target(connectionDraft));if(!active()||version!==connectionGeneration)return;if(!status.ok)throw Error(status.error.message);showConnection(status.value);
      }
    }catch(error){if(active()&&version===connectionGeneration)connectionStatus.textContent=error instanceof Error?error.message:"Connection unavailable; draft retained.";}finally{if(version===connectionGeneration){busy=false;connecting=false;if(active())state();}}
  })());
  cancelConnection.addEventListener("click",()=>void(async()=>{
    const draft=connectionDraft;++connectionGeneration;connecting=false;if(!draft){busy=false;state();return;}
    try{const result=await requestCore<ConnectionDraft>("ai.cancelConnection",target(draft));if(active()&&connectionDraft?.draftId===draft.draftId){if(result.ok)showConnection(result.value);else connectionStatus.textContent=result.error.message;}}
    finally{busy=false;if(active())state();}
  })());
  remove.addEventListener("click",()=>{
    if(remove.disabled||!snapshot||!selected)return;
    const profile=snapshot.profiles.find(p=>p.profileId===selected);if(!profile)return;
    removalNotice.textContent=`Remove “${profile.settings.label}” from this computer? Its locally saved API key will also be removed, or retained for owned cleanup if removal cannot complete. This does not revoke the key at Studio.`;
    remove.hidden=true;removalConfirmation.hidden=false;cancelRemoval.focus();
  });
  cancelRemoval.addEventListener("click",()=>{removalConfirmation.hidden=true;remove.hidden=false;remove.focus();});
  confirmRemoval.addEventListener("click",()=>{
    if(confirmRemoval.disabled||removalConfirmation.hidden||!snapshot||!selected)return;
    void run("ai.removeProfile",{token:snapshot.token,profileId:selected});
  });
  const loadFields:[keyof ModelLoadValues,string][]=[["contextLength","Context length"],["parallel","Parallel slots"],["gpuMemoryMode","GPU memory mode"],["fit","Automatic memory fitting"]];
  const loadValue=(key:keyof ModelLoadValues,value:unknown):string=>{
    if(key==="contextLength"||key==="parallel")return typeof value==="number"&&Number.isInteger(value)&&value>0?`${value.toLocaleString()}${key==="contextLength"?" tokens":""}`:"Unverified";
    if(key==="gpuMemoryMode")return value==="auto"?"Automatic":value==="manual"?"Manual":"Unverified";
    return value==="on"?"On":value==="off"?"Off":"Unverified";
  };
  const renderLoadReport=(report:ModelLoadReport,applying:boolean):void=>{
    resetLoadReport();loadReport.hidden=false;loadReport.dataset.outcome=applying?(report.applied?"applied":"unverified"):"read";loadReport.dataset.modelId=report.modelId;
    loadReport.append(el("h5",`Model-load settings · ${report.modelId}`));if(report.resolvedModelId)loadReport.append(el("p",`Studio override target: ${report.resolvedModelId}`,"muted"));
    loadReport.append(el("p",report.message),el("p",applying?(report.applied?"Studio accepted the update. Check the saved and loaded values below. An active model has not been reloaded.":"The update was sent, but its saved configuration is unverified. Read the values and warnings below. An active model has not been reloaded."):"No model-load settings were applied by this action."));
    const table=el("table"),head=el("thead"),titles=el("tr");for(const title of ["Setting","Requested","Saved in Studio","Actually loaded"]){const th=el("th",title);th.scope="col";titles.append(th);}head.append(titles);const body=el("tbody");
    const warnings=[...report.warnings];
    for(const [key,title]of loadFields){const row=el("tr"),name=el("th",title);name.scope="row";row.append(name);for(const value of [report.requested[key],report.saved?.[key],report.effective?.[key]])row.append(el("td",loadValue(key,value)));body.append(row);
      for(const [source,values]of [["Saved in Studio",report.saved],["Actually loaded",report.effective]] as const){const actual=values?.[key];if(loadValue(key,actual)!=="Unverified"&&actual!==report.requested[key])warnings.push(`${source}: ${title} is ${loadValue(key,actual)}; requested ${loadValue(key,report.requested[key])}.`);}
    }
    table.append(head,body);loadReport.append(table,el("p","Unverified means Studio did not report a confirmed value. Differences are warnings; writing requests are checked against the actual loaded capacity.","muted"));
    loadReport.append(el("p",`Automatic model switching: ${report.autoSwitchEnabled===true?"On":report.autoSwitchEnabled===false?"Off":"Unverified"}. Loomlight has not changed this server-wide setting.`));
    if(report.autoSwitchEnabled!==true)warnings.push(report.autoSwitchEnabled===false?"Automatic model switching is off. Saved overrides will not cause API-driven loading on their own.":"Automatic model switching is unverified. Saved overrides may not cause API-driven loading.");
    if(warnings.length){const box=el("div","","studio-model-load-warnings");box.role="status";box.style.color="var(--status-warning)";box.append(el("strong","Configuration warnings"));const list=el("ul");for(const warning of new Set(warnings))list.append(el("li",warning));box.append(list);loadReport.append(box);}
  };
  const manageModelLoad=async(operation:"ai.readModelLoadSettings"|"ai.applyModelLoadSettings"):Promise<void>=>{
    const action=operation==="ai.applyModelLoadSettings"?applyModelLoad:readModelLoad;
    if(action.disabled||!snapshot||!selected||!active())return;
    const origin={token:snapshot.token,profileId:selected,modelId:snapshot.profiles.find(p=>p.profileId===selected)!.settings.model};
    busy=true;resetLoadReport();state();status.textContent=operation==="ai.applyModelLoadSettings"?"Applying saved model-load settings…":"Reading model-load settings…";
    try{
      const result=await requestCore<ModelLoadReport>(operation,{token:origin.token,profileId:origin.profileId});if(!active())return;
      if(!result.ok)throw new Error(result.error.message);
      if(dirty||selected!==origin.profileId||snapshot?.token!==origin.token){status.textContent="Model-load action completed, but this form changed. Read again for the saved configuration.";return;}
      if(result.value.modelId!==origin.modelId)throw new Error("Studio returned a report for a different model. Read again before applying settings.");
      renderLoadReport(result.value,operation==="ai.applyModelLoadSettings");status.textContent=result.value.message;
    }catch(error){if(!active())return;const detail=error instanceof Error?error.message:"The Studio management service is unavailable.";const message=operation==="ai.applyModelLoadSettings"?`Studio did not confirm the apply outcome. The server may already have saved settings. Read model-load settings before applying again. ${detail}`:`Model-load settings could not be read. ${detail}`;resetLoadReport();loadReport.hidden=false;loadReport.dataset.outcome="error";loadReport.append(el("p",message,"error-message"));status.textContent=message;}
    finally{busy=false;if(active())state();}
  };
  readModelLoad.addEventListener("click",()=>{void manageModelLoad("ai.readModelLoadSettings");});applyModelLoad.addEventListener("click",()=>{void manageModelLoad("ai.applyModelLoadSettings");});
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
          if(!result.value.done){status.textContent="Testing this saved connection… No project content is sent.";setTimeout(()=>void poll(),250);return;}
          testId=null;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Response format tested for structured proposals. Every generated result still needs review.":result.value.message??"Response format test did not complete; no compatibility recorded.";state();
        }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Response format test status unavailable; Cancel remains available.";state();}
      };void poll();
    }catch(e){testId=null;busy=false;status.textContent=e instanceof Error?e.message:"Response format test unavailable.";state();}
  })());
  cancelTest.addEventListener("click",()=>void(async()=>{
    if(!testId)return;const id=testId,version=++testGeneration;
    try{
      const result=await requestCore<{state:string}>("ai.cancelRequest",{requestId:id});
      if(!active()||version!==testGeneration)return;
      if(result.ok){testId=null;busy=false;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Response format test already completed. Its result remains recorded.":"Response format test cancelled. No compatibility recorded.";}else status.textContent=result.error.message;
    }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Response format test cancellation unavailable; retry Cancel.";}
    state();
  })());
  retryRead.addEventListener("click",()=>{if(canLeave())void run("ai.profiles");});
  reload.addEventListener("click",()=>{if(canLeave())void run("ai.profiles");});
  void run("ai.profiles");
  return {canLeave,dispose:()=>{clearConnection();disposed=true;++testGeneration;root.remove();}};
}
