import { requestCore } from "./bridge.ts";
import type { CoreOperation } from "./protocol.ts";
interface StudioSettings { label:string; endpoint:string; model:string; privateHttp:boolean; contextCeiling:number; contextBudget:number; maximumResponse:number; temperature?:number; topP?:number }
interface Profile { profileId:string; revision:number; settings:StudioSettings; credentialStatus:string; credentialError?:string|null; disabled:boolean; compatibilityState?:string; compatibilityPayload?:string; discovery:null|{models:string[]; selectedAvailable:boolean; status:string;inventory?:{id:string;loaded:boolean|null;actualContext:number|null}[]} }
interface Snapshot { token:string; profiles:Profile[]; cleanup:{profileId:string;deferred?:boolean}[]; storageNotice?:string; saveStatus?:string }
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text="",cls=""):HTMLElementTagNameMap[K] {const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;}
export interface StudioSettingsController { canLeave():boolean; dispose():void }
export function mountStudioSettings(content:HTMLElement,footer:HTMLElement):StudioSettingsController {
  const root=el("div","","studio-settings");content.append(root);
  let snapshot:Snapshot|null=null,selected:string|null=null,busy=false,dirty=false,testId:string|null=null,testGeneration=0,disposed=false,readFailed=false,hasLoaded=false;
  const status=el("p","Loading saved profiles…","muted");status.role="status";
  const chooser=el("select");chooser.ariaLabel="Saved Studio profile";
  const fields=el("div");
  const input=(label:string,description:string,type="text"):HTMLInputElement=>{
    const line=el("div","","setting-row"),copy=el("div"),name=el("label",label),n=el("input");
    n.type=type;n.id=`studio-${label.toLowerCase().replace(/[^a-z]+/g,"-")}`;name.htmlFor=n.id;n.ariaLabel=label;
    copy.append(name,el("p",description,"muted"));line.append(copy,n);fields.append(line);return n;
  };
  const draftState=el("p","","studio-draft-state");
  root.append(el("h3","Unsloth Studio"),el("p","Profiles are saved only on this computer. Saving a profile does not connect.","muted"),chooser,status,fields);
  const label=input("Profile name","A local name for this connection."),endpoint=input("Endpoint","Base endpoint; loopback HTTP or verified HTTPS."),model=input("Model ID","Enter an exact model ID, or choose one after you Refresh models.");
  const choices=el("datalist");choices.id="studio-model-choices";model.setAttribute("list",choices.id);root.append(choices);
  const privateHttp=input("Allow private-network HTTP","HTTP is unencrypted. Private LAN/VPN addresses need explicit opt-in. Loopback HTTP needs no private-network opt-in.","checkbox");
  const budget=input("Context length","Total tokens for the request and response. The response reserve and safety margin must fit within this total. Also used when requesting model-load context.","number"),response=input("Maximum response length","Maximum number of tokens to generate. Reaching this limit may cut the response short.","number");
  [budget,response].forEach(n=>{n.min="1";n.step="1";});
  const temperature=input("Temperature","How varied the writing is. Start at 1; lower it for more restrained output.","number"),topP=input("Top-p","How broad the word choices are. Start at 0.95.","number");
  temperature.min="0";temperature.max="2";temperature.step="0.01";topP.min="0";topP.max="1";topP.step="0.01";
  const credential=el("p","Credential: not configured","muted"),actions=el("div","","studio-actions");
  const button=(text:string):HTMLButtonElement=>{const b=el("button",text,"button");b.type="button";actions.append(b);return b;};
  const save=button("Save profile"),entry=button("Enter credential…"),removeKey=button("Remove credential"),discover=button("Refresh models"),remove=button("Remove profile"),retryRead=button("Retry loading profiles"),reload=button("Reload profiles");save.classList.add("primary");
  const testSetup=button("Test connection"),cancelTest=button("Cancel connection test"),testPreview=el("details");testPreview.append(el("summary","Synthetic connection test request"));const testBody=el("pre");testPreview.append(testBody);root.append(testPreview);
  const cleanup=el("div"),storageNotice=el("p","","muted"),testStatus=el("p","","muted");
  const connection=el("section","","studio-group"),defaultsGroup=el("section","","studio-group"),keyGroup=el("section","","studio-group"),advanced=el("details","","studio-advanced"),maintenance=el("details","","studio-maintenance"),setup=el("section","","studio-group"),danger=el("section","","studio-group studio-danger-zone");
  connection.append(el("h4","Connection"));for(const n of [label,endpoint,privateHttp,model])connection.append(n.closest(".setting-row")!);
  const modelActions=el("div","","studio-actions");modelActions.append(discover);connection.append(modelActions);
  const privateRow=privateHttp.closest<HTMLElement>(".setting-row")!;
  const transportVisibility=():void=>{privateRow.hidden=!endpoint.value.trim()||/^https:/i.test(endpoint.value.trim());};
  endpoint.addEventListener("input",transportVisibility);
  defaultsGroup.append(el("h4","Response defaults"),el("p","Tokens measure request and response length. The context length includes input, response reserve and a margin.","muted"));for(const n of [budget,response])defaultsGroup.append(n.closest(".setting-row")!);
  advanced.append(el("summary","Advanced settings · sampling"));for(const n of [temperature,topP])advanced.append(n.closest(".setting-row")!);
  const keyActions=el("div","","studio-actions"),setupActions=el("div","","studio-actions"),maintenanceActions=el("div","","studio-actions"),saveActions=el("div","","studio-actions studio-save-actions");
  keyActions.append(entry,removeKey);keyGroup.append(el("h4","API Key"),credential,keyActions,storageNotice,cleanup);
  setupActions.append(testSetup,cancelTest);setup.append(el("h4","Connection test"),el("p","Send a small test request to check whether Unsloth Studio can return the response format Loomlight needs. No project content is sent.","muted"),testStatus,setupActions,testPreview);
  maintenanceActions.append(retryRead,reload);maintenance.append(el("summary","Profile maintenance"),maintenanceActions);
  const removalConfirmation=el("div"),removalNotice=el("p"),removalActions=el("div","","studio-actions"),cancelRemoval=el("button","Cancel","button"),confirmRemoval=el("button","Remove profile","button danger");
  cancelRemoval.type=confirmRemoval.type="button";removalConfirmation.hidden=true;remove.classList.add("danger");
  removalActions.append(cancelRemoval,confirmRemoval);removalConfirmation.append(removalNotice,removalActions);danger.append(el("h4","Danger Zone"),remove,removalConfirmation);
  fields.append(connection,keyGroup,defaultsGroup,advanced);saveActions.append(draftState,save);root.append(setup,maintenance,danger,saveActions);actions.remove();
  const active=():boolean=>!disposed&&root.isConnected;
  const state=():void=>{
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=busy||(!snapshot&&n!==retryRead&&n!==reload));
    retryRead.hidden=!readFailed;
    const testing=testId!==null;testSetup.disabled=busy||testing||!snapshot||!selected||dirty||snapshot.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";cancelTest.disabled=!testing;
    save.disabled=busy||testing||!snapshot;entry.disabled=busy||!snapshot||!selected||dirty;removeKey.disabled=busy||!snapshot||!selected||dirty;remove.disabled=busy||!snapshot||!selected||dirty;confirmRemoval.disabled=remove.disabled;cancelRemoval.disabled=busy;entry.disabled ||= snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus==="unsupported";discover.disabled=busy||!snapshot||!selected||dirty||snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";
    if(testing){root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=n!==cancelTest);}
    draftState.textContent=busy?"Working…":dirty?"Unsaved profile changes":!snapshot?"Saved profiles unavailable":selected?"Saved profile settings":"New profile · unsaved";
    root.dataset.dirty=String(dirty);root.dataset.busy=String(busy||testing);cancelTest.hidden=!testing;
    footer.textContent="Profile changes need explicit Save. Refresh models and Test connection connect only when selected.";
  };
  const draw=():void=>{
    if(!snapshot||!active())return;
    chooser.replaceChildren();snapshot.profiles.forEach(p=>{const o=el("option",p.settings.label);o.value=p.profileId;chooser.append(o);});const fresh=el("option","New Studio profile");fresh.value="";chooser.append(fresh);chooser.value=selected??"";
    const p=snapshot.profiles.find(p=>p.profileId===selected);const s=p?.settings;
    for(const [input,error] of errors){error.textContent="";input.removeAttribute("aria-invalid");}
    label.value=s?.label??"Studio";endpoint.value=s?.endpoint??"http://127.0.0.1:8888/v1";model.value=s?.model??"";privateHttp.checked=s?.privateHttp??false;budget.value=String(s?.contextBudget??32768);response.value=String(s?.maximumResponse??8192);transportVisibility();removalConfirmation.hidden=true;remove.hidden=false;temperature.value=String(s?.temperature??1);topP.value=String(s?.topP??0.95);
    credential.textContent=`Credential: ${p?.credentialStatus??"not configured"}${p?.disabled?" · profile disabled":""}`;entry.textContent=p?.credentialStatus==="configured"?"Replace credential…":["unavailable","deferred","missing"].includes(p?.credentialStatus??"")&&p?.credentialError?"Re-enter API key":"Enter credential…";
    storageNotice.textContent=/Mac/i.test(window.navigator.platform)||snapshot.storageNotice?.startsWith("Temporary Mac development storage")?"macOS: API keys are encrypted and stored on this computer. Software running under your user account may be able to decrypt them.":snapshot.storageNotice??"";
    status.textContent=p?.credentialError??p?.discovery?.status??(p?"Saved configuration":"New profile · unsaved");
    const detected=p?.discovery?.inventory?.find(item=>item.id===p.settings.model);
    if(detected?.loaded&&detected.actualContext)status.textContent+=` · Detected loaded context: ${detected.actualContext.toLocaleString()} tokens (read-only)`;
    testBody.textContent=p?.compatibilityPayload??"Save a profile to inspect the fixed synthetic request. No project content is sent.";
    testStatus.textContent=p?(p.compatibilityState==="ready"?"Connection tested for structured proposals":"Setup not tested yet"):"";testStatus.hidden=!p;
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
  const canLeave=():boolean=>{if(busy||testId){status.textContent="Finish the current action or cancel the connection test before leaving.";return false;}return !dirty||window.confirm("Discard unsaved Studio profile changes?");};
  const validators=new Map<HTMLInputElement,()=>string>();
  const bytes=(text:string):number=>new TextEncoder().encode(text).length;
  const nameRule=(n:HTMLInputElement,max:number,name:string):string=>!n.value.trim()?`Enter ${name}.`:bytes(n.value)>max||/[\u0000-\u001f\u007f-\u009f]/u.test(n.value)?`Use at most ${max} UTF-8 bytes and no control characters.`:"";
  validators.set(label,()=>nameRule(label,80,"a profile name"));validators.set(model,()=>nameRule(model,256,"the exact model ID"));
  // Transport canonicalization/admission remains core-owned. Do not invent a
  // renderer URL policy or normalize the author's endpoint behind their back.
  validators.set(endpoint,()=>endpoint.value.trim()?"":"Enter the Studio base endpoint.");
  const whole=(n:HTMLInputElement,min:number,max:number):boolean=>!!n.value.trim()&&Number.isInteger(Number(n.value))&&Number(n.value)>=min&&Number(n.value)<=max;
  validators.set(budget,()=>whole(budget,256,2000000)?"":"Enter a whole number from 256 to 2,000,000 tokens.");
  validators.set(response,()=>whole(response,1,2000000)&&Number(response.value)+128<Number(budget.value)?"":"Enter a whole number greater than 0, leaving more than 128 tokens in the context length.");
  validators.set(temperature,()=>temperature.value.trim()&&Number.isFinite(Number(temperature.value))&&Number(temperature.value)>=0&&Number(temperature.value)<=2?"":"Enter a number from 0 to 2.");
  validators.set(topP,()=>topP.value.trim()&&Number.isFinite(Number(topP.value))&&Number(topP.value)>=0&&Number(topP.value)<=1?"":"Enter a number from 0 to 1.");
  const errors=new Map<HTMLInputElement,HTMLElement>();
  const validate=(n:HTMLInputElement):boolean=>{const text=validators.get(n)!();errors.get(n)!.textContent=text;n.setAttribute("aria-invalid",String(!!text));return !text;};
  for(const n of validators.keys()){const error=el("span","","field-error");error.id=`${n.id}-error`;errors.set(n,error);n.setAttribute("aria-describedby",error.id);n.closest(".setting-row")!.append(error);let composing=false;n.addEventListener("compositionstart",()=>{composing=true;});n.addEventListener("compositionend",()=>{composing=false;});n.addEventListener("blur",()=>{if(!composing)validate(n);});n.addEventListener("input",()=>{if(!composing&&error.textContent)validate(n);});}
  fields.addEventListener("input",()=>{removalConfirmation.hidden=true;remove.hidden=false;const first=!dirty;dirty=true;if(first)status.textContent="Unsaved changes. Save before testing this connection or managing its key. Readiness applies only to the saved configuration.";state();});
  chooser.addEventListener("change",()=>{if(!canLeave()){chooser.value=selected??"";return;}selected=chooser.value||null;draw();});
  save.addEventListener("click",()=>{
    let first:HTMLInputElement|undefined;for(const n of validators.keys())if(!validate(n))first??=n;
    if(first){const details=first.closest("details");if(details)details.open=true;status.textContent="Correct the marked fields before saving. Your profile changes are retained.";first.focus();return;}
    const t=Number(temperature.value),p=Number(topP.value);
    if(!temperature.value.trim()||!topP.value.trim()||!Number.isFinite(t)||t<0||t>2||!Number.isFinite(p)||p<0||p>1){status.textContent="Temperature must be 0–2 and Top-p must be 0–1. Saved settings are unchanged.";return;}
    void run("ai.saveProfile",{token:snapshot!.token,profileId:selected,settings:{label:label.value,endpoint:endpoint.value,model:model.value,privateHttp:privateHttp.checked,contextCeiling:Number(budget.value),contextBudget:Number(budget.value),maximumResponse:Number(response.value),temperature:t,topP:p}});
  });
  for(const [b,op] of [[entry,"ai.enterCredential"],[removeKey,"ai.removeCredential"],[discover,"ai.discover"]] as const)b.addEventListener("click",()=>void run(op,{token:snapshot!.token,profileId:selected}));
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
          testId=null;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Connection tested for structured proposals. Every generated result still needs review.":result.value.message??"Connection test did not complete; no compatibility recorded.";state();
        }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Connection test status unavailable; Cancel remains available.";state();}
      };void poll();
    }catch(e){testId=null;busy=false;status.textContent=e instanceof Error?e.message:"Connection test unavailable.";state();}
  })());
  cancelTest.addEventListener("click",()=>void(async()=>{
    if(!testId)return;const id=testId,version=++testGeneration;
    try{
      const result=await requestCore<{state:string}>("ai.cancelRequest",{requestId:id});
      if(!active()||version!==testGeneration)return;
      if(result.ok){testId=null;busy=false;await run("ai.profiles");if(!active()||version!==testGeneration)return;status.textContent=result.value.state==="completed"?"Connection test already completed. Its result remains recorded.":"Connection test cancelled. No compatibility recorded.";}else status.textContent=result.error.message;
    }catch(e){if(!active()||version!==testGeneration)return;status.textContent=e instanceof Error?e.message:"Connection test cancellation unavailable; retry Cancel.";}
    state();
  })());
  retryRead.addEventListener("click",()=>{if(canLeave())void run("ai.profiles");});
  reload.addEventListener("click",()=>{if(canLeave())void run("ai.profiles");});
  void run("ai.profiles");
  return {canLeave,dispose:()=>{disposed=true;++testGeneration;root.remove();}};
}
