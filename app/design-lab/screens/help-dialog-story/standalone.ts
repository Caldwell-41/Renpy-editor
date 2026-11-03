import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import { definition } from './definition.ts';
import { mountStudy, type Variant } from './workspace.ts';
const host=document.querySelector<HTMLElement>('#preview')!;
const controls=document.createElement('nav');controls.className='hd-comparison';controls.ariaLabel='Prototype comparison controls';
const root=document.createElement('div');
const query=new URLSearchParams(location.search);
let variant=(query.get('variant')??'inspector-v4') as Variant, state=query.get('state')??'start';
let dispose: (()=>void)|undefined;
for(const v of definition.variants){const b=document.createElement('button');b.textContent=v.title;b.dataset.variant=v.id;b.onclick=()=>{variant=v.id as Variant;render();};controls.append(b);}
const states=document.createElement('select');states.ariaLabel='Fresh sample scenario';for(const s of definition.states)states.add(new Option(s.title,s.id));states.value=state;states.onchange=()=>{state=states.value;render();};controls.append(states);const reset=document.createElement('button');reset.textContent='Reset sample';reset.onclick=()=>render();controls.append(reset);const note=document.createElement('span');note.className='hd-review-note';note.textContent='Prototype · edits stay in this page';controls.append(note);
host.append(controls,root);
function render(){dispose?.();root.dataset.ready='false';controls.querySelectorAll<HTMLButtonElement>('button[data-variant]').forEach(b=>b.ariaPressed=String(b.dataset.variant===variant));dispose=mountStudy(root,{state,theme:'dark'},variant.replace(/-v4$/, '') as Variant);root.dataset.ready='true';try{const url=new URL(location.href);url.searchParams.set('variant',variant);url.searchParams.set('state',state);history.replaceState(null,'',url);}catch{ /* Embedded previews may restrict URL changes. */ }}
render();

window.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||(event.target instanceof Element&&event.target.closest('input,textarea,select,[contenteditable]')))return;const i=definition.variants.findIndex(v=>v.id===variant);variant=definition.variants[(i+(event.key==='ArrowRight'?1:-1)+definition.variants.length)%definition.variants.length]!.id as Variant;render();});
