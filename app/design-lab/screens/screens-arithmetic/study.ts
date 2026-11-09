// Three control variants in the existing Screens host. Fictional memory only.
import type {LabContext} from '../../contracts.ts';
import {labPage,action} from '../../page.ts';
import {ScreensWorkspace} from '../../../src/screen-ui.ts';
import {loadPreferences} from '../../../src/preferences.ts';
import {icon} from '../../../src/icons.ts';
import {fixture,clone,render} from '../shared-look/editor-sample.ts';
import {mountControls} from './controls.ts';
import {mountDecimals} from './decimals.ts';
import '../../../src/screen-ui.css';
import './style.css';
export async function mountArithmetic(host:HTMLElement,context:LabContext,variant:string){
  document.documentElement.dataset.theme=context.theme;
  if(context.state==='variables'||context.state==='condition')return mountDecimals(host,context,variant);
  await loadPreferences();document.documentElement.dataset.theme=context.theme;
  let disposed=false,entered=false;
  const data=fixture(''),doc=data.documents[0]!;
  doc.authoringRevision='fictional-authoring';
  doc.screens[0]!.nodes.find(n=>n.id==='body')!.literal='Balance: 1.25\nTrust: 5';
  doc.screens[0]!.nodes.find(n=>n.id==='close')!.literal=context.state==='imagebutton'?'▶':'Continue';
  const frame=labPage(host,context,{screen:'screens',title:'Screens',subtitle:''});frame.heading.remove();frame.shell.classList.add('screen-interactions-study');
  host.dataset.arithmeticVariant=variant;host.classList.add('sa-host');
  frame.shell.querySelector('.lp-sample')!.textContent='Arithmetic controls · Draft';
  frame.shell.querySelector('.lp-fiction')!.textContent='Browser mock · No game actions run';
  const nav=action('Screens',()=>{});nav.className='tree-item selected';nav.ariaLabel='Screens';nav.prepend(icon('panel'));frame.shell.querySelector('[aria-label="Source"]')!.after(nav);
  const report=(text:string)=>{frame.status.textContent=text;};
  frame.shell.addEventListener('click',event=>{if((event.target as HTMLElement).closest('.lp-navigation,.brand,.lp-studio-link,.lp-runtime-link')){event.preventDefault();event.stopImmediatePropagation();report('Only Screens is active in this mock.');}},{capture:true});
  const workspace=new ScreensWorkspace({projectId:'screens-arithmetic',resolution:{width:1280,height:720},current:()=>!disposed,coordinate:task=>task(),source:()=>report('Source navigation is simulated.'),preview:()=>report('No game actions run. Use Test in Ren\'Py in the real app.'),saved:()=>report('Browser memory only.'),request:async<T>(operation:string,p:Record<string,unknown>={}):Promise<T>=>{
    if(operation==='source.list')return {files:data.documents.map(d=>({path:d.path}))}as T;
    if(operation==='screens.list')return {projectRevision:'fixture-1',sourceMapRevision:'map-1',inventoryRevision:'sample',owned:data.documents.map((d,i)=>({id:d.screens[0]!.name,rootId:'root',name:d.screens[0]!.name,path:d.path,kind:i?'panel':'dialog',resolved:true,sourceRevision:d.revision}))}as T;
    if(operation==='screens.inspect')return clone(data.documents.find(d=>d.path===p.path))as T;
    if(operation==='authoring.list')return {assets:[],variables:[]}as T;
    if(operation==='screens.canvasRender'){
      const result=render(doc,p);
      if(context.state==='imagebutton'){
        const canvas=document.createElement('canvas');canvas.width=Number(p.width??1280);canvas.height=Number(p.height??720);const c=canvas.getContext('2d')!;
        // Preserve the existing browser-drawn background. Only the imagebutton
        // shape is fictional here; it is not an asset-resolution/runtime proof.
        const image=await new Promise<HTMLImageElement>(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.src=result.image;});c.drawImage(image,0,0);
        const x=canvas.width*.13,y=canvas.height*.67;c.fillStyle='#cba979';c.fillRect(x-12,y,220,58);c.fillStyle='#202322';c.beginPath();c.moveTo(x+80,y+12);c.lineTo(x+80,y+46);c.lineTo(x+110,y+29);c.fill();
        result.image=canvas.toDataURL('image/png');
      }return result as T;
    }
    if(operation==='source.open')return {path:doc.path,text:'Fictional browser sample. No source file is opened.',dirty:false,baseRevision:doc.revision,hasBom:false}as T;
    if(operation==='scene.list')return {projectRevision:'fixture-1',sourceMapRevision:'map-1'}as T;
    throw Error(`This prototype refuses ${operation}.`);
  }});workspace.mount(frame.content);
  const editor=document.createElement('div');editor.className='sa-editor';const controls=mountControls(editor,context,variant);
  // The established bars/imagebuttons study uses this same replacement boundary.
  // Only the proposed inspector is replaced. Appearance/layout controls stay with
  // their approved references and are outside this focused comparison.
  const attach=()=>{
    if(!entered){const row=host.querySelector<HTMLElement>('[data-node-id="close"]');if(row){entered=true;row.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));}}
    const card=host.querySelector<HTMLElement>('.screen-card');
    if(entered&&card&&!card.contains(editor)){const original=document.createElement('div');original.hidden=true;original.append(...card.childNodes);card.replaceChildren(original,editor);card.className='screen-card screen-text sa-card';card.setAttribute('aria-label','Arithmetic inspector');}
    const image=host.querySelector<HTMLImageElement>('.screen-render');if(image&&image.alt!=='Browser-drawn screen sample')image.alt='Browser-drawn screen sample';
    const status=host.querySelector('.screen-canvas-status');if(image&&status&&status.textContent!=='Inert browser canvas. Actions run only during play.')status.textContent='Inert browser canvas. Actions run only during play.';
  };
  const observer=new MutationObserver(attach);observer.observe(host,{childList:true,subtree:true});attach();
  return()=>{disposed=true;observer.disconnect();controls();workspace.dispose();host.classList.remove('sa-host');};
}
