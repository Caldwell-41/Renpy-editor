import '../../../src/styles.css';
import '../../../src/ui-refresh.css';
import {mountStudy,type Variant} from './study.ts';
const params=new URLSearchParams(location.search);
const variants:readonly [Variant,string][]=[['reference','Existing Screens'],['inspector','A · Expandable actions'],['worksheet','B · Sequence and editor'],['workspace','C · Direct rows']];
let variant:Variant=variants.some(([id])=>id===params.get('variant'))?params.get('variant') as Variant:'inspector';
let state=params.get('state')??'button';
const states=[['button','Button actions'],['text','Text and samples'],['choose','Choose elements'],['panel','Panel Hide'],['invalid','Invalid integer'],['missing','Missing variable'],['stale','Source changed'],['conflict','Source conflict'],['custom','Custom actions'],['component','Component actions'],['limit','Eight actions']];
const toolbar=document.querySelector<HTMLElement>('#comparison')!,host=document.querySelector<HTMLElement>('#preview')!;
toolbar.innerHTML=`<label>Compare <select aria-label="Review option">${variants.map(([id,title])=>`<option value="${id}">${title}</option>`).join('')}</select></label><label>Sample <select aria-label="Review state">${states.map(([id,title])=>`<option value="${id}">${title}</option>`).join('')}</select></label><span>Draft · No project files or game execution</span>`;
const variantPicker=toolbar.querySelector<HTMLSelectElement>('[aria-label="Review option"]')!,statePicker=toolbar.querySelector<HTMLSelectElement>('[aria-label="Review state"]')!;
variantPicker.value=variant;statePicker.value=state;
let dispose:(()=>void)|undefined,sequence=0;
async function mount(){const current=++sequence;dispose?.();host.replaceChildren();host.dataset.ready='false';const cleanup=await mountStudy(host,{state,theme:'dark'},variant);if(current!==sequence){cleanup();return;}dispose=cleanup;host.dataset.ready='true';const url=new URL(location.href);url.searchParams.set('variant',variant);url.searchParams.set('state',state);history.replaceState(null,'',url);}
toolbar.addEventListener('change',()=>{variant=variantPicker.value as Variant;state=statePicker.value;void mount();});
void mount();
