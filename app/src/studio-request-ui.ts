import { requestCore } from "./bridge.ts";
import type { CoreOperation } from "./protocol.ts";
interface Profile {profileId:string;credentialStatus:string;disabled:boolean;settings:{label:string;endpoint:string;model:string;contextBudget:number;maximumResponse:number}}
interface Snapshot {token:string;profiles:Profile[]}
interface Status {requestId:string;state:string;done:boolean;httpStatus:number|null;elapsedMs:number;message:string|null;estimatedInput:number;margin:number;maximumResponse:number;completion:null|{text:string;model:string;finishReason:string;responseBytes:number;usage:{promptTokens:number|null;completionTokens:number|null;totalTokens:number|null;reasoningTokens:number|null}}}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,text=""):HTMLElementTagNameMap[K]{const n=document.createElement(tag);n.textContent=text;return n;}
/** Nonmodal synthetic request panel. Local status observation never sends HTTP. */
export function openStudioRequest(sessionId:string|null):void {
  if(document.querySelector('.studio-request'))return;
  const panel=node('aside');panel.className='studio-request';panel.ariaLabel='Studio synthetic request';
  const title=node('h3','Studio request'),copy=node('p','Send a fixed synthetic message. No project content is included. Literal loopback HTTP only; thinking and tools are off.');
  const profile=node('select');profile.ariaLabel='Request profile';
  const timeoutLabel=node('label','Response deadline (seconds)'),timeout=node('input');timeout.type='number';timeout.min='30';timeout.max='1800';timeout.step='1';timeout.value='600';timeout.ariaLabel='Response deadline (seconds)';timeoutLabel.append(timeout);
  const preview=node('p'),status=node('p','Loading saved request profiles…');status.role='status';status.className='studio-request-status';status.ariaLive='polite';
  const output=node('pre');output.className='studio-request-output';
  const actions=node('div');actions.className='studio-actions';
  const button=(text:string):HTMLButtonElement=>{const b=node('button',text);b.className='button';actions.append(b);return b;};
  const send=button('Send synthetic request'),cancel=button('Cancel request'),reload=button('Reload request profiles'),close=button('Close request panel');send.classList.add('primary');
  panel.append(title,copy,profile,timeoutLabel,preview,actions,status,output);document.body.append(panel);
  let snapshot:Snapshot|null=null,requestId:string|null=null,active=false,busy=false,generation=0,timer:ReturnType<typeof setTimeout>|undefined;
  const state=():void=>{const p=snapshot?.profiles.find(p=>p.profileId===profile.value);send.disabled=busy||active||!p||p.disabled||p.credentialStatus!=='configured';cancel.disabled=busy||!active;reload.disabled=busy||active;profile.disabled=busy||active;timeout.disabled=busy||active;};
  const draw=():void=>{const p=snapshot?.profiles.find(p=>p.profileId===profile.value);preview.textContent=p?`${p.settings.endpoint} · Model: ${p.settings.model} · Context budget ${p.settings.contextBudget} (capacity unverified) · Response reserve ${p.settings.maximumResponse}`:'Configure a saved Studio profile and credential in Settings.';state();};
  const call=async<T>(operation:CoreOperation,payload:Record<string,unknown>={}):Promise<T>=>{const r=await requestCore<T>(operation,payload);if(!r.ok)throw Error(r.error.message);return r.value;};
  const display=(value:Status):void=>{
    const ending=value.done&&value.state==='expired'&&!value.message?'Configuration or project changed; response discarded.':value.message;
    status.textContent=ending??`${value.state==='completed'?'Completed':value.state} · ${value.httpStatus===null?'HTTP status unknown':`HTTP ${value.httpStatus}`} · ${Math.round(value.elapsedMs)} ms · input estimate ${value.estimatedInput} + margin ${value.margin} + response reserve ${value.maximumResponse}`;
    if(ending)status.textContent+=` · ${value.httpStatus===null?'HTTP status unknown':`HTTP ${value.httpStatus}`} · ${Math.round(value.elapsedMs)} ms`;
    status.dataset.state=value.state;output.textContent='';
    if(value.completion){const c=value.completion,u=c.usage;status.textContent+=` · finish: ${c.finishReason} · usage input ${u.promptTokens??'unknown'}, output ${u.completionTokens??'unknown'}, total ${u.totalTokens??'unknown'}, reasoning ${u.reasoningTokens??'unknown'}`;output.textContent=c.text;}
    active=!value.done;state();
  };
  const poll=async(id:string,version:number):Promise<void>=>{
    if(version!==generation||!panel.isConnected)return;
    try{const value=await call<Status>('ai.requestStatus',{requestId:id});if(version!==generation||!panel.isConnected)return;display(value);if(!value.done)timer=setTimeout(()=>void poll(id,version),250);}
    catch(error){if(version===generation&&panel.isConnected){status.textContent=error instanceof Error?error.message:'Request status unavailable.';active=true;state();}} // Keep Cancel available on observation failure.
  };
  const load=async():Promise<void>=>{busy=true;output.textContent="";state();try{snapshot=await call<Snapshot>('ai.profiles');if(!panel.isConnected)return;profile.replaceChildren();for(const p of snapshot.profiles){const o=node('option',p.settings.label);o.value=p.profileId;profile.append(o);}status.textContent='Ready. Send is explicit; loading and saving never send a request.';draw();}catch(error){status.textContent=error instanceof Error?error.message:'Saved profiles unavailable.';}finally{busy=false;state();}};
  send.addEventListener('click',()=>void(async()=>{if(send.disabled||!snapshot)return;const version=++generation;clearTimeout(timer);busy=true;state();output.textContent='';status.textContent='Sending synthetic request…';try{const value=await call<Status>('ai.sendSynthetic',{token:snapshot.token,profileId:profile.value,sessionId,timeoutSeconds:Number(timeout.value)});requestId=value.requestId;if(version!==generation||!panel.isConnected){await call('ai.cancelRequest',{requestId});return;}busy=false;display(value);void poll(requestId,version);}catch(error){status.textContent=error instanceof Error?error.message:'Request service unavailable.';}finally{busy=false;state();}})());
  cancel.addEventListener('click',()=>void(async()=>{if(!requestId||cancel.disabled)return;++generation;clearTimeout(timer);busy=true;state();status.textContent='Cancelling client request…';try{display(await call<Status>('ai.cancelRequest',{requestId}));}catch(error){status.textContent=error instanceof Error?error.message:'Cancellation unavailable.';}finally{busy=false;state();}})());
  profile.addEventListener('change',()=>{output.textContent='';status.textContent='Ready for selected saved profile.';draw();});
  reload.addEventListener('click',()=>void load());
  close.addEventListener('click',()=>void(async()=>{if(busy)return;if(active&&requestId){busy=true;state();try{await call('ai.cancelRequest',{requestId});}catch{busy=false;status.textContent='Client cleanup is incomplete; keep this panel open and cancel again.';state();return;}}++generation;clearTimeout(timer);panel.remove();})());
  state();void load();
}
