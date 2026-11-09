import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import {mountArithmetic} from './study.ts';
import {definition} from './definition.ts';
const params=new URLSearchParams(location.search),variants=definition.variants;
let variant=variants.some(v=>v.id===params.get('variant'))?params.get('variant')!:variants[0]!.id;
let state=definition.states.some(s=>s.id===params.get('state'))?params.get('state')!:'button';
const host=document.querySelector<HTMLElement>('#preview')!,toolbar=document.querySelector<HTMLElement>('#comparison')!;
let dispose:(()=>void)|undefined,sequence=0;
const picker=document.createElement('select');picker.ariaLabel='Review state';
for(const s of definition.states){const o=document.createElement('option');o.value=s.id;o.textContent=s.title;picker.append(o);}picker.value=state;
const left=document.createElement('button'),right=document.createElement('button'),label=document.createElement('strong');left.textContent='←';right.textContent='→';left.ariaLabel='Previous variant';right.ariaLabel='Next variant';toolbar.append(left,label,right,picker);
async function mount(){const current=++sequence;dispose?.();host.replaceChildren();label.textContent=variants.find(v=>v.id===variant)!.title;const cleanup=await mountArithmetic(host,{state,theme:'dark'},variant);if(current!==sequence){cleanup();return;}dispose=cleanup;host.dataset.ready='true';}
function change(offset:number){variant=variants[(variants.findIndex(v=>v.id===variant)+offset+variants.length)%variants.length]!.id;update();}
function update(){try{const url=new URL(location.href);url.searchParams.set('variant',variant);url.searchParams.set('state',state);history.replaceState(null,'',url);}catch{/* Inline sandbox may forbid changing its URL. */}void mount();}
left.onclick=()=>change(-1);right.onclick=()=>change(1);picker.onchange=()=>{state=picker.value;update();};
document.addEventListener('keydown',e=>{if((e.target as HTMLElement).closest('input,textarea,select,[contenteditable]'))return;if(e.key==='ArrowLeft'){e.preventDefault();change(-1);}if(e.key==='ArrowRight'){e.preventDefault();change(1);}});void mount();
