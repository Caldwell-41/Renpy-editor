import { requestCore } from "./bridge.ts";
import type { CoreOperation } from "./protocol.ts";
interface StudioSettings { label:string; endpoint:string; model:string; privateHttp:boolean; contextCeiling:number; contextBudget:number; maximumResponse:number }
interface Profile { profileId:string; revision:number; settings:StudioSettings; credentialStatus:string; credentialError?:string|null; disabled:boolean; discovery:null|{models:string[]; selectedAvailable:boolean; status:string} }
interface Snapshot { token:string; profiles:Profile[]; cleanup:{profileId:string;deferred?:boolean}[]; storageNotice?:string; saveStatus?:string }
function el<K extends keyof HTMLElementTagNameMap>(tag:K,text="",cls=""):HTMLElementTagNameMap[K] {const n=document.createElement(tag);n.textContent=text;n.className=cls;return n;}
export function mountStudioSettings(content:HTMLElement,footer:HTMLElement):void {
  const root=el("div","","studio-settings");content.append(root);
  let snapshot:Snapshot|null=null,selected:string|null=null,busy=false,dirty=false;
  const status=el("p","Loading saved profiles…","muted");status.role="status";
  const chooser=el("select");chooser.ariaLabel="Saved Studio profile";
  const fields=el("div");
  const input=(label:string,description:string,type="text"):HTMLInputElement=>{
    const line=el("div","","setting-row"),copy=el("div"),name=el("label",label),n=el("input");
    n.type=type;n.id=`studio-${label.toLowerCase().replace(/[^a-z]+/g,"-")}`;name.htmlFor=n.id;n.ariaLabel=label;
    copy.append(name,el("p",description,"muted"));line.append(copy,n);fields.append(line);return n;
  };
  root.append(el("h3","Unsloth Studio"),el("p","Remember a connection on this computer. Saving never connects.","muted"),chooser,fields);
  const label=input("Profile name","A local name for this connection."),endpoint=input("Endpoint","Base endpoint; loopback HTTP or verified HTTPS."),model=input("Model ID","Enter an exact model ID, or choose one after Refresh models.");
  const choices=el("datalist");choices.id="studio-model-choices";model.setAttribute("list",choices.id);root.append(choices);
  const privateHttp=input("Allow private-network HTTP","HTTP is unencrypted. Requires explicit opt-in for private LAN/VPN addresses.","checkbox");
  const ceiling=input("Configured capacity — unverified","Change loaded context in Studio if needed.","number"),budget=input("Total context budget","Includes input, response reserve and margin.","number"),response=input("Maximum response","A default token allowance; no generation is sent here.","number");
  [ceiling,budget,response].forEach(n=>{n.min="1";n.step="1";});
  const credential=el("p","Credential: not configured","muted"),actions=el("div","","studio-actions");
  const button=(text:string):HTMLButtonElement=>{const b=el("button",text,"button");b.type="button";actions.append(b);return b;};
  const save=button("Save profile"),entry=button("Enter credential…"),removeKey=button("Remove credential"),discover=button("Refresh models"),remove=button("Remove profile"),retryRead=button("Retry"),reload=button("Reload saved profiles");save.classList.add("primary");
  const cleanup=el("div"),storageNotice=el("p","","muted");
  root.append(credential,storageNotice,el("p","Remember on this computer · secure native entry. Local removal does not revoke the key at Studio.","muted"),actions,status,cleanup,el("p","Refresh models sends one explicit authenticated GET. Discovery confirms availability only; context capacity and generation compatibility remain unverified.","muted"));
  const active=():boolean=>root.isConnected;
  const state=():void=>{
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLButtonElement>("input,select,button").forEach(n=>n.disabled=busy||(!snapshot&&n!==retryRead&&n!==reload));
    save.disabled=busy||!snapshot;entry.disabled=busy||!snapshot||!selected||dirty;removeKey.disabled=busy||!snapshot||!selected||dirty;remove.disabled=busy||!snapshot||!selected||dirty;entry.disabled ||= snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus==="unsupported";discover.disabled=busy||!snapshot||!selected||dirty||snapshot?.profiles.find(p=>p.profileId===selected)?.credentialStatus!=="configured";
    footer.textContent="Profile changes need explicit Save. Refresh models connects only when selected.";
  };
  const draw=():void=>{
    if(!snapshot||!active())return;
    chooser.replaceChildren();snapshot.profiles.forEach(p=>{const o=el("option",p.settings.label);o.value=p.profileId;chooser.append(o);});const fresh=el("option","New Studio profile");fresh.value="";chooser.append(fresh);chooser.value=selected??"";
    const p=snapshot.profiles.find(p=>p.profileId===selected);const s=p?.settings;
    label.value=s?.label??"Studio";endpoint.value=s?.endpoint??"http://127.0.0.1:8888/v1";model.value=s?.model??"";privateHttp.checked=s?.privateHttp??false;ceiling.value=String(s?.contextCeiling??8192);budget.value=String(s?.contextBudget??4096);response.value=String(s?.maximumResponse??1024);
    credential.textContent=`Credential: ${p?.credentialStatus??"not configured"}${p?.disabled?" · profile disabled":""}`;entry.textContent=p?.credentialStatus==="configured"?"Replace credential…":["unavailable","deferred","missing"].includes(p?.credentialStatus??"")&&p?.credentialError?"Re-enter API key":"Enter credential…";
    storageNotice.textContent=snapshot.storageNotice??"";
    status.textContent=p?.credentialError??p?.discovery?.status??"Not checked for this saved configuration";
    choices.replaceChildren();p?.discovery?.models.forEach(id=>{const o=el("option");o.value=id;choices.append(o);});
    cleanup.replaceChildren();for(const id of new Set(snapshot.cleanup.filter(c=>!c.deferred).map(c=>c.profileId))){const b=el("button","Retry owned credential cleanup","button");b.addEventListener("click",()=>void run("ai.cleanup",{profileId:id,token:snapshot!.token}));cleanup.append(b,el("p","A retained credential needs cleanup. No other profile's key is removed.","muted"));}
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
  fields.addEventListener("input",()=>{dirty=true;status.textContent="Unsaved changes; save before credential or discovery actions.";state();});
  chooser.addEventListener("change",()=>{selected=chooser.value||null;draw();});
  save.addEventListener("click",()=>void run("ai.saveProfile",{token:snapshot!.token,profileId:selected,settings:{label:label.value,endpoint:endpoint.value,model:model.value,privateHttp:privateHttp.checked,contextCeiling:Number(ceiling.value),contextBudget:Number(budget.value),maximumResponse:Number(response.value)}}));
  for(const [b,op] of [[entry,"ai.enterCredential"],[removeKey,"ai.removeCredential"],[discover,"ai.discover"],[remove,"ai.removeProfile"]] as const)b.addEventListener("click",()=>void run(op,{token:snapshot!.token,profileId:selected}));
  retryRead.addEventListener("click",()=>void run("ai.profiles"));
  reload.addEventListener("click",()=>void run("ai.profiles",{},true));
  void run("ai.profiles",{},true);
}
