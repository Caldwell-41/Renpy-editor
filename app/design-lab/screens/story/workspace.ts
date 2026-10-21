import type { LabContext } from '../../contracts.ts';
import { action, element as el, labelled, labPage } from '../../page.ts';
import { icon } from '../../../src/icons.ts';
import { fixture, makeBeat, kindName, summary, types, type Beat, type Scene } from './fixture.ts';
import './styles.css';

export function mountStory(host: HTMLElement, context: LabContext, variant: 'manuscript'|'stage') {
  let scenes = fixture(context.state), sceneId = scenes[0]!.id;
  let selected = scenes[0]!.beats.find(b=>b.kind==='dialogue')?.id ?? '';
  let drafts = new Map<string,Beat>(), undo: string[] = [], redo: string[] = [];
  let focusMode = false, previewOpen = true, treeOpen = innerWidth >= 760, busy = false;
  let disposed = false, previewThrough = true, branchMode = 'None selected';
  let pendingTimer: ReturnType<typeof setTimeout>|undefined;
  const frame = labPage(host, context, { screen:'story', title:'Story', subtitle: variant==='manuscript'?'Manuscript desk':'Stage & sequence', dirty:()=>drafts.size>0 });
  frame.shell.classList.add('st-shell'); frame.content.classList.add('st-content');
  const toolbar = el('div','st-toolbar'), sceneNav = el('div','st-scene-nav'), workspace = el('div',`st-workspace st-${variant}`);
  frame.content.append(sceneNav, toolbar, workspace);
  const scene = () => scenes.find(s=>s.id===sceneId)!;
  const allBeats = (beats:Beat[]):Beat[] => beats.flatMap(b=>[b,...b.branches.flatMap(branch=>allBeats(branch.beats))]);
  const current = () => allBeats(scene().beats).find(b=>b.id===selected);
  const draft = (b:Beat) => drafts.get(b.id) ?? structuredClone(b);
  const status = (text:string, error=false) => {frame.status.textContent=text;frame.status.classList.toggle('st-error',error);};
  const record = () => {undo.push(JSON.stringify(scenes));redo=[];};
  const change = (fn:()=>void, message='Saved in sample') => {record();fn();draw();status(message);};
  function findBody(id:string, beats=scene().beats):Beat[]|undefined {if(beats.some(b=>b.id===id))return beats; for(const b of beats)for(const branch of b.branches){const found=findBody(id,branch.beats);if(found)return found;}return undefined;}
  function modal(title:string) {
    const previous=document.activeElement as HTMLElement|null;
    const dialog=el('dialog','lp-dialog st-dialog');dialog.ariaLabel=title;
    const head=el('div','st-dialog-head');head.append(el('h2','',title),action('Close',()=>dialog.close()));
    dialog.append(head);frame.shell.append(dialog);
    dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus();});
    dialog.showModal(); return dialog;
  }
  function text(value:string,label:string,multiline:true):HTMLTextAreaElement;
  function text(value:string,label:string,multiline?:false):HTMLInputElement;
  function text(value:string,label:string,multiline:boolean):HTMLInputElement|HTMLTextAreaElement;
  function text(value:string,label:string,multiline=false) {const input=multiline?el('textarea'):el('input');input.value=value;input.ariaLabel=label;return input;}
  function select(values:string[], value:string, label:string) {const input=el('select');input.ariaLabel=label;for(const title of values){const o=el('option','',title);o.value=title;input.append(o);}input.value=value;return input;}
  function targetSelect(value:string,label='Destination scene') {const input=el('select');input.ariaLabel=label;for(const s of scenes){const o=el('option','',s.name);o.value=s.id;input.append(o);}input.value=value;return input;}
  function confirm(title:string, copy:string, label:string, done:()=>void) {const d=modal(title);d.append(el('p','',copy),action('Keep editing',()=>d.close()),action(label,()=>{d.close();done();},true));}
  function save(b:Beat, onSuccess?:()=>void) {
    const d=drafts.get(b.id);if(!d||busy)return;
    if((d.kind==='dialogue'||d.kind==='narration')&&!d.text.trim()){status('Write some text before saving this beat.',true);workspace.querySelector<HTMLTextAreaElement>('textarea')?.focus();return;}
    busy=true;draw();status('Saving sample beat…');pendingTimer=setTimeout(()=>{if(disposed)return;busy=false;if(context.state==='error'){draw();status('Simulated save failure. Your draft is kept. Try a different sample to save.',true);return;}record();Object.assign(b,structuredClone(d));drafts.delete(b.id);draw();status('Saved in sample');onSuccess?.();},300);
  }
  function saveAll(){if(!drafts.size||busy)return; if(context.state==='error'){status('Simulated save failure. All drafts are kept.',true);return;} const empty=[...drafts.values()].find(b=>(b.kind==='dialogue'||b.kind==='narration')&&!b.text.trim());if(empty){selected=empty.id;draw();status('Write some text before saving this beat.',true);return;}change(()=>{for(const b of scenes.flatMap(s=>allBeats(s.beats))){const d=drafts.get(b.id);if(d)Object.assign(b,structuredClone(d));}drafts.clear();});}
  function selectBeat(id:string){selected=id;draw();workspace.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({block:'nearest'});}
  function newBeat(body=scene().beats) {
    const d=modal('Add a beat');d.append(el('p','muted','Choose what happens next. You can reorder this beat later.'));
    const kind=select(types.filter(t=>t[0]!=='customCode').map(t=>t[1]),'Dialogue','Beat type');d.append(labelled('Beat type',kind));
    d.append(action('Add beat',()=>{const type=types.find(t=>t[1]===kind.value)![0];const b=makeBeat(type);change(()=>{const terminal=body.findIndex(b=>['choice','jump','return'].includes(b.kind));body.splice(terminal<0?body.length:terminal,0,b);selected=b.id;},'Beat added in sample. Fill in its details.');d.close();workspace.querySelector<HTMLInputElement|HTMLTextAreaElement>('textarea,input')?.focus();},true));
  }
  function selectScene(id:string) {if(id===sceneId)return;const go=()=>{sceneId=id;selected=scene().beats.find(b=>b.kind==='dialogue')?.id??scene().beats[0]?.id??'';draw();};if(drafts.size)confirm('Switch scenes?','Your unfinished beats stay in this sample. You can return and continue editing.','Switch and keep drafts',go);else go();}
  function organize() {
    const d=modal('Organize story');const list=el('div','st-organize');
    function render(){list.replaceChildren();for(const chapter of [...new Set(scenes.map(s=>s.chapter))]){const section=el('section');section.append(el('h3','',chapter));for(const s of scenes.filter(s=>s.chapter===chapter)){const row=el('div','st-organize-row');const name=text(s.name,`Scene name for ${s.name}`);row.append(name,action('Rename',()=>{if(!name.value.trim())return;change(()=>s.name=name.value);render();}),action('Move up',()=>{const i=scenes.indexOf(s);if(i>0)change(()=>{scenes.splice(i,1);scenes.splice(i-1,0,s);});render();}));const chapterTarget=select([...new Set(scenes.map(s=>s.chapter))],s.chapter,`Chapter for ${s.name}`);row.append(chapterTarget,action('Move',()=>{change(()=>s.chapter=chapterTarget.value);render();}));const remove=action('Delete scene',()=>confirm('Delete scene?',`${s.name} will be removed from this sample. Undo can restore it.`,'Delete scene',()=>{change(()=>{scenes=scenes.filter(x=>x!==s);if(sceneId===s.id){sceneId=scenes[0]!.id;selected='';}});render();}));remove.disabled=s.id==='arrival'||scenes.some(other=>allBeats(other.beats).some(b=>b.target===s.id||b.options.some(o=>o.target===s.id)));remove.title=remove.disabled?'Entry scenes and referenced scenes cannot be deleted.':'';row.append(remove);section.append(row);}list.append(section);}}
    render();const name=text('Untitled scene','New scene name');const chapters=select([...new Set(scenes.map(s=>s.chapter))],scene().chapter,'Chapter');d.append(list,labelled('New scene name',name),labelled('Chapter',chapters),action('Create scene',()=>{if(!name.value.trim())return;const s:Scene={id:`scene-${Date.now()}`,name:name.value,chapter:chapters.value,beats:[]};change(()=>scenes.push(s),'Scene created in sample');render();}));
    const newChapter=text('Chapter 3 · Morning','New chapter name');d.append(labelled('New chapter name',newChapter),action('Create chapter and scene',()=>{if(!newChapter.value.trim())return;change(()=>scenes.push({id:`scene-${Date.now()}`,name:'Untitled scene',chapter:newChapter.value,beats:[]}));render();}));
    d.append(el('p','muted','Empty chapters have no stored record in this sample. Referenced scenes and the entry scene cannot be deleted.'));
  }
  function moveBeat(b:Beat) {
    const d=modal('Move beat');const bodies:{label:string;beats:Beat[]}[]=[{label:'Scene body',beats:scene().beats}];
    for(const parent of allBeats(scene().beats).filter(x=>x.kind==='condition'&&x!==b&&!allBeats([b]).includes(x)))for(const branch of parent.branches)bodies.push({label:`${branch.name} · ${branch.condition||'fallback'}`,beats:branch.beats});
    const target=select(bodies.map(x=>x.label),bodies[0]!.label,'Destination body');d.append(labelled('Destination body',target),action('Move beat',()=>{change(()=>{const body=findBody(b.id)!;body.splice(body.indexOf(b),1);const dest=bodies.find(x=>x.label===target.value)!.beats;const terminal=dest.findIndex(x=>['choice','jump','return'].includes(x.kind));dest.splice(terminal<0?dest.length:terminal,0,b);});d.close();},true));
  }
  function structural(b:Beat) {
    const menu=el('details','st-beat-actions');const label=el('summary','','Beat actions');menu.append(label);const tools=el('div','st-action-popover');
    const move=(dir:number)=>{const body=findBody(b.id)!;const i=body.indexOf(b);if(i+dir<0||i+dir>=body.length||['choice','jump','return'].includes(b.kind)||['choice','jump','return'].includes(body[i+dir]!.kind))return;change(()=>{body.splice(i,1);body.splice(i+dir,0,b);});};
    const up=action('Move up',()=>move(-1));up.disabled=findBody(b.id)?.indexOf(b)===0||b.kind==='customCode'||['choice','jump','return'].includes(b.kind);
    const down=action('Move down',()=>move(1));down.disabled=b.kind==='customCode'||['choice','jump','return'].includes(b.kind)||findBody(b.id)?.at(-1)===b;
    tools.append(up,down,action('Move to branch…',()=>moveBeat(b)),action('Delete beat',()=>confirm('Delete beat?',`Remove this ${kindName(b.kind).toLowerCase()} and its contained beats? Undo can restore it.`,'Delete beat',()=>change(()=>{const body=findBody(b.id)!;body.splice(body.indexOf(b),1);drafts.delete(b.id);selected='';}))));
    if(b.kind==='customCode'){tools.replaceChildren(action('View in Source',()=>frame.navigate('source')));}
    menu.append(tools);return menu;
  }
  function editor(b:Beat):HTMLElement {
    const panel=el('section','st-editor');panel.dataset.editor=b.id;
    const head=el('div','st-editor-heading');head.append(el('span','eyebrow',`Edit ${kindName(b.kind).toLowerCase()}`),structural(b));panel.append(head);
    let edit=draft(b);
    const update=()=>{drafts.set(b.id,edit);saveButton.disabled=busy;discardButton.disabled=busy;saveAllButton.disabled=busy;draftNote.textContent='Unsaved draft';status('Unsaved sample changes');renderPreview();};
    function field(name:string, key:'text'|'speaker'|'asset'|'placement'|'transition'|'target'|'value', options?:string[], help='') {
      const input=options?select(options,edit[key],name):key==='target'?targetSelect(edit[key],name):text(edit[key],name,key==='text');if(input instanceof HTMLTextAreaElement)input.rows=context.state==='long'?8:4;
      input.addEventListener(options||key==='target'?'change':'input',()=>{edit[key]=input.value;update();});panel.append(labelled(name,input,help));return input;
    }
    if(b.kind==='customCode') {panel.append(el('p','st-notice','This source block stays read-only. It can run Python in Ren\'Py. The sample never executes it.'),el('pre','st-code',b.text),action('View in Source',()=>frame.navigate('source')));return panel;}
    if(['dialogue','showCharacter','hideCharacter','changeAppearance','placement'].includes(b.kind))field(b.kind==='dialogue'?'Speaker':'Character','speaker',['Mara','Eli']);
    if(['dialogue','narration'].includes(b.kind))field(b.kind==='dialogue'?'Dialogue':'Narration','text',undefined,b.kind==='dialogue'?'Write the line the player will read. Text stays in your draft until you save.':'Narration appears without a speaker.');
    if(['background','showCharacter','changeAppearance','playMusic','playSfx'].includes(b.kind))field(b.kind==='background'?'Background':b.kind==='playMusic'?'Music':b.kind==='playSfx'?'Sound effect':'Appearance','asset',b.kind==='background'?['Rainy platform','Tram interior']:b.kind==='playMusic'?['Night service','Distant rain']:b.kind==='playSfx'?['Tram bell','Doors closing']:['Raincoat','Evening coat']);
    if(['showCharacter','placement'].includes(b.kind))field('Placement','placement',['Left','Centre','Right']);
    if(['background','showCharacter','hideCharacter','changeAppearance','transition'].includes(b.kind))field('Transition','transition',['None','Dissolve','Fade']);
    if(b.kind==='setVariable'){panel.append(el('p','muted','Variable · has_ticket (Boolean)'));field('Value','value',['true','false']);}
    if(b.kind==='jump'||b.kind==='call') {field('Destination scene','target');panel.append(el('p','st-help',b.kind==='call'?'Returns to the next beat after this call. Preview becomes unknown at a call.':'A jump leaves this scene and does not rejoin.'));panel.append(action('Open destination',()=>selectScene(edit.target)));if(b.kind==='call')panel.append(action('View continuation',()=>{const body=findBody(b.id)!;const next=body[body.indexOf(b)+1];if(next)selectBeat(next.id);else status('This call has no following beat.');}));}
    if(b.kind==='choice') {
      const options=el('div','st-options');function drawOptions(){options.replaceChildren();edit.options.forEach((option,index)=>{const row=el('section','st-option');row.append(el('h4','',`Option ${index+1}`));const label=text(option.text,`Option ${index+1} text`),dest=targetSelect(option.target,`Option ${index+1} destination`),condition=text(option.condition,`Option ${index+1} availability`);label.oninput=()=>{option.text=label.value;update();};dest.onchange=()=>{option.target=dest.value;update();};condition.oninput=()=>{option.condition=condition.value;update();};row.append(labelled(`Option ${index+1} text`,label),labelled(`Option ${index+1} destination`,dest),labelled(`Option ${index+1} availability`,condition,'Leave blank for always available. Conditions are illustrative; this preview does not evaluate them.'),action('Remove option',()=>{edit.options.splice(index,1);drawOptions();update();}));options.append(row);});}drawOptions();panel.append(options,action('Add option',()=>{edit.options.push({text:'New option',target:'shared',condition:''});drawOptions();update();}),action('Create destination scene',()=>{const d=modal('Create choice destination');const name=text('A new stop','Scene name'),option=text('Follow the signal','Choice text');d.append(labelled('Scene name',name),labelled('Choice text',option),action('Create scene and option',()=>{if(!name.value.trim()||!option.value.trim())return;record();const s={id:`scene-${Date.now()}`,name:name.value,chapter:scene().chapter,beats:[]};scenes.push(s);edit.options.push({text:option.value,target:s.id,condition:''});drafts.set(b.id,edit);d.close();draw();status('Scene created. Save the choice to keep its option in this sample.');},true));}));
    }
    if(b.kind==='condition') {
      panel.append(el('p','st-help','Each branch owns its beats. A continuing branch rejoins after the group; Jump and Return do not. Manual preview is a view choice, not an evaluated condition.'));
      const branches=el('div');function renderBranches(){branches.replaceChildren();edit.branches.forEach((branch,i)=>{const section=el('section','st-option');section.append(el('h4','',branch.name));if(branch.name!=='Otherwise'){const input=text(branch.condition,`${branch.name} condition`);input.oninput=()=>{branch.condition=input.value;update();};section.append(labelled(`${branch.name} condition`,input,'Use a saved variable comparison, such as trust >= 3. Unsupported syntax stays in Source in the app.'));}section.append(el('p','muted',`${branch.beats.length} contained beats`));if(i>0)section.append(action(`Remove ${branch.name} branch`,()=>confirm('Remove branch?','This removes the branch and its contained beats in your draft.','Remove branch',()=>{edit.branches.splice(i,1);renderBranches();update();})));branches.append(section);});}renderBranches();panel.append(branches,action('Add Else If',()=>{edit.branches.splice(edit.branches.findIndex(x=>x.name==='Otherwise')<0?edit.branches.length:edit.branches.findIndex(x=>x.name==='Otherwise'),0,{name:'Else If',condition:'trust >= 3',beats:[]});renderBranches();update();}),action('Add Otherwise',()=>{if(!edit.branches.some(x=>x.name==='Otherwise')){edit.branches.push({name:'Otherwise',condition:'',beats:[]});renderBranches();update();}}),action('Unwrap condition…',()=>{const d=modal('Keep one branch');const choice=select(b.branches.map((x,i)=>`${i+1}. ${x.name}`),'1. If','Branch to keep');d.append(labelled('Branch to keep',choice),el('p','','The selected branch becomes ordinary beats. Other branches are removed.'),action('Unwrap condition',()=>{const index=Number(choice.value.split('.')[0])-1;change(()=>{const body=findBody(b.id)!;body.splice(body.indexOf(b),1,...structuredClone(b.branches[index]!.beats));drafts.delete(b.id);selected='';});d.close();},true));}));
    }
    if(b.kind==='return')panel.append(el('p','st-help','End this scene, or return to its caller. The editor does not claim a continuing route after this beat.'));
    if(b.kind==='stopMusic')panel.append(el('p','st-help','Stop the music that is playing at this point.'));
    const draftNote=el('span','st-draft-note',drafts.has(b.id)?'Unsaved draft':'Saved beat');
    const saveButton=action('Save beat',()=>save(b),true),discardButton=action('Discard beat draft',()=>confirm('Discard this beat draft?','The saved beat stays unchanged.','Discard draft',()=>{drafts.delete(b.id);draw();status('Draft discarded in sample');}));saveButton.disabled=!drafts.has(b.id)||busy;discardButton.disabled=!drafts.has(b.id)||busy;
    const cancel=action('Close editor',()=>{selected='';draw();status(drafts.has(b.id)?'Editor closed. Your draft is kept.':'Ready in sample');});
    const footer=el('div','st-save-row');footer.append(draftNote,discardButton,cancel,saveButton);panel.append(footer);return panel;
  }
  let previewNode:HTMLElement|undefined;
  function renderPreview(){if(!previewNode)return;previewNode.replaceChildren();const b=previewThrough?current():allBeats(scene().beats).at(-1),effective=b?drafts.get(b.id)??b:undefined;
    const head=el('div','st-preview-heading');head.append(el('span','eyebrow','Scene preview'),el('span','muted',previewThrough?'Through selected beat':'Whole scene'));previewNode.append(head);
    const canvas=el('div','st-canvas');canvas.ariaLabel='Illustrative game preview';const station=el('div','st-station');station.append(el('span','st-station-sign','LAST SERVICE'),el('span','st-platform-line'));canvas.append(station);
    const unknown=effective&&['customCode','condition','call','choice'].includes(effective.kind);
    const overlay=el('div','st-game-text');overlay.append(el('strong','',effective?.kind==='dialogue'?effective.speaker:unknown?'Preview boundary':'The last service'),el('p','',unknown?`State is unknown after ${kindName(effective!.kind).toLowerCase()}. ${branchMode==='None selected'?'Choose a branch to illustrate it.':`Illustrating ${branchMode}.`}`:effective&&(effective.kind==='dialogue'||effective.kind==='narration')?effective.text:'Rain gathers at the edge of the empty platform.'));canvas.append(overlay);previewNode.append(canvas);
    const controls=el('div','st-preview-tools');const through=action(previewThrough?'Selected beat':'Whole scene',()=>{previewThrough=!previewThrough;renderPreview();});through.ariaPressed=String(previewThrough);const branch=select(['None selected','If · has_ticket = true','Otherwise'],'None selected','Manual preview branch');branch.value=branchMode;branch.onchange=()=>{branchMode=branch.value;renderPreview();};controls.append(through,branch,action('Scene details',details));previewNode.append(controls,el('p','st-preview-note','Illustrative view · No game execution or condition evaluation'));
  }
  function details(){const d=modal('Scene details');const manual=select(['None selected','If · has_ticket = true','Otherwise'],branchMode,'Manual preview branch');manual.onchange=()=>{branchMode=manual.value;renderPreview();};d.append(labelled('Manual preview branch',manual,'Choose a branch to illustrate it. This does not evaluate its condition.'),el('p','',`${scene().name} · ${allBeats(scene().beats).length} beats`),el('h3','','At the selected beat'),el('p','','Background · Rainy platform'),el('p','','Character · Mara, raincoat, centre'),el('p','','Music · Night service'),el('p','','Variables · has_ticket = true (illustrative)'),el('p','muted','Changes after custom code, calls and unevaluated flow are unknown. No audio is played in this sample.'),action('Edit background beat',()=>{const b=scene().beats.find(x=>x.kind==='background');d.close();if(b)selectBeat(b.id);}),action('Add change here',()=>{d.close();newBeat();}),action('View scene in Source',()=>frame.navigate('source')));}
  function assist() {
    if(drafts.size){status('Save or discard your beat drafts before preparing Assist.',true);return;}
    const d=modal('Assist with this scene');let timer:ReturnType<typeof setTimeout>|undefined;let active=true;
    d.addEventListener('close',()=>{active=false;clearTimeout(timer);});
    const body=el('div','st-assist');d.append(body);
    const task=text('Keep the uneasy tone. Make the line more specific to the station.','Task instructions',true);task.rows=3;
    const actionKind=select(['Rewrite dialogue','Edit scene','Continue scene','Draft scene'],'Rewrite dialogue','Assist action');
    const profile=select(['Local writing model · sample','Editing model · sample'],'Local writing model · sample','Provider and model');
    const budget=text('32768','Context length (tokens)'),response=text('16384','Maximum response length (tokens)');budget.type=response.type='number';
    const contextCheck=el('input');contextCheck.type='checkbox';contextCheck.checked=true;
    const card=el('input'),lore=el('input');card.type=lore.type='checkbox';card.checked=true;
    const form=()=>{body.replaceChildren(el('p','st-assist-step','1 · Prepare'),labelled('Action',actionKind),labelled('Provider and model',profile),labelled('Task instructions',task),labelled('Include shared project context',contextCheck),labelled('Mara · approved character v2',card),labelled('The night service · approved lore v1',lore),labelled('Context length (tokens)',budget),labelled('Maximum response length (tokens)',response),el('p','st-help','Only saved content and selected approved references enter this sample request. Unsaved drafts are excluded.'));
      body.append(action('Prepare request',()=>{if(Number(budget.value)<Number(response.value)+500||Number(response.value)<=0){body.append(el('p','st-error','The response and input need to fit inside the context length.'));return;}prepared();},true));};
    const captured=current()?.text??'The station waits.';
    const proposed='The bell rang twice. That used to mean the driver was waiting for someone.';
    const prepared=()=>{body.replaceChildren(el('p','st-assist-step','2 · Inspect request'),el('h3','',actionKind.value),el('p','',`${profile.value} · input ~420 tokens + response ${response.value} + margin 256 / ${budget.value}`),el('p','muted',`References · ${card.checked?'Mara v2':''}${lore.checked?' · The night service v1':''}`));const exact=el('details');exact.append(el('summary','','Inspect sample payload'),el('pre','st-code',JSON.stringify({action:actionKind.value,task:task.value,savedText:captured,sharedContext:contextCheck.checked,references:[...(card.checked?['Mara v2']:[]),...(lore.checked?['Night service v1']:[])]},null,2)));body.append(exact,el('p','st-notice','Simulated request. No project text leaves this browser.'),action('Back to preparation',form),action('Generate sample',()=>{body.replaceChildren(el('p','st-assist-step','3 · Generating sample'),el('p','','Preparing a fictional proposal…'),action('Cancel generation',()=>{clearTimeout(timer);prepared();status('Sample generation cancelled. No proposal applied.');}));timer=setTimeout(()=>{if(active)review();},700);},true));};
    const review=()=>{const original=el('div','st-review-before'),after=el('div','st-review-after');original.append(el('h4','','Saved text'),el('p','',captured));after.append(el('h4','','Proposed text'),el('p','',proposed));body.replaceChildren(el('p','st-assist-step','4 · Review proposal'),original,after,el('p','muted','Reasoning is separate from story text. Accepting makes one sample change; Undo remains available.'),action('Reject proposal',()=>{d.close();status('Proposal rejected. Saved text is unchanged.');}),action('Accept and save',()=>{if(context.state==='error'){body.append(el('p','st-error','Simulated acceptance failure. Proposal kept for review.'));return;}change(()=>{const b=current();if(actionKind.value==='Rewrite dialogue'&&b&&['dialogue','narration'].includes(b.kind))b.text=proposed;else {const beat=makeBeat('narration');beat.text=proposed;if(actionKind.value==='Draft scene'){const s={id:`scene-${Date.now()}`,name:'The returning tram',chapter:scene().chapter,beats:[beat]};scenes.push(s);sceneId=s.id;selected=beat.id;}else{const i=scene().beats.findIndex(x=>['choice','jump','return'].includes(x.kind));scene().beats.splice(i<0?scene().beats.length:i,0,beat);selected=beat.id;}}},'Proposal accepted and saved as one sample change');d.close();},true));};form();
  }
  const saveAllButton=action('Save drafts',saveAll,true);
  function draw(){
    const focused=document.activeElement;
    const focusLabel=focused instanceof HTMLInputElement||focused instanceof HTMLTextAreaElement||focused instanceof HTMLSelectElement ? focused.ariaLabel : null;
    const caret=focused instanceof HTMLInputElement||focused instanceof HTMLTextAreaElement ? focused.selectionStart : null;
    const fieldScroll=focused instanceof HTMLTextAreaElement ? focused.scrollTop : 0;
    const listScroll=workspace.querySelector<HTMLElement>('.st-beat-list')?.scrollTop??0;
    toolbar.replaceChildren();sceneNav.replaceChildren();workspace.replaceChildren();workspace.dataset.focus=String(focusMode);workspace.dataset.tree=String(treeOpen);workspace.dataset.preview=String(previewOpen);
    const scenePicker=targetSelect(sceneId,'Open scene');scenePicker.onchange=()=>selectScene(scenePicker.value);
    const sceneHeading=el('div','st-scene-heading');sceneHeading.append(el('span','eyebrow',scene().chapter),el('h2','',scene().name));sceneNav.append(sceneHeading,scenePicker,action('Organize…',organize));
    const toggleTree=action('',()=>{treeOpen=!treeOpen;draw();toolbar.querySelector<HTMLElement>('.st-tree-toggle')?.focus();});toggleTree.className='icon-button st-tree-toggle';toggleTree.ariaLabel=treeOpen?'Collapse story tree':'Expand story tree';toggleTree.ariaExpanded=String(treeOpen);toggleTree.append(icon(treeOpen?'panel':'panelOpen'));
    const undoButton=action('Undo',()=>{if(drafts.size){status('Save or discard drafts before Undo.',true);return;}if(!undo.length)return;redo.push(JSON.stringify(scenes));scenes=JSON.parse(undo.pop()!);if(!scenes.some(s=>s.id===sceneId))sceneId=scenes[0]!.id;draw();status('Undid one sample change');});undoButton.disabled=!undo.length||busy;
    const redoButton=action('Redo',()=>{if(drafts.size){status('Save or discard drafts before Redo.',true);return;}if(!redo.length)return;undo.push(JSON.stringify(scenes));scenes=JSON.parse(redo.pop()!);draw();status('Redid one sample change');});redoButton.disabled=!redo.length||busy;
    const writing=action(focusMode?'Exit writing focus':'Writing focus',()=>{focusMode=!focusMode;draw();toolbar.querySelector<HTMLButtonElement>('[aria-pressed]')?.focus();});writing.ariaPressed=String(focusMode);
    const previewToggle=action(previewOpen?'Hide preview':'Show preview',()=>{previewOpen=!previewOpen;draw();});
    const add=action('Add beat',()=>newBeat(),true),assistButton=action('Assist…',assist);
    saveAllButton.disabled=!drafts.size||busy;
    toolbar.append(toggleTree,undoButton,redoButton,writing,previewToggle,el('span','st-toolbar-spacer'),assistButton,add);frame.tools.replaceChildren(saveAllButton);
    const tree=el('aside','st-tree');tree.ariaLabel='Story tree';for(const chapter of [...new Set(scenes.map(s=>s.chapter))]){const group=el('details','st-chapter');group.open=true;group.append(el('summary','',chapter));for(const s of scenes.filter(s=>s.chapter===chapter)){const button=action(s.name,()=>selectScene(s.id));button.className=`st-scene-button${s.id===sceneId?' selected':''}`;button.ariaCurrent=s.id===sceneId?'page':null;group.append(button);}tree.append(group);}tree.append(action('New scene…',organize));workspace.append(tree);
    const center=el('div','st-center'),preview=el('section','st-preview');previewNode=preview;renderPreview();
    const list=el('section','st-beat-list');list.ariaLabel='Scene beats';
    const listHeading=el('div','st-list-heading');listHeading.append(el('h3','','Scene beats'),el('span','muted',`${allBeats(scene().beats).length} beats`));list.append(listHeading);
    function rows(beats:Beat[],parent:HTMLElement,depth=0){beats.forEach((b,index)=>{const card=el('article',`st-beat st-beat-${b.kind}`);card.dataset.beat=b.id;card.dataset.selected=String(b.id===selected);card.style.setProperty('--st-depth',String(depth));
      const button=action('',()=>selectBeat(b.id));button.className='st-beat-select';button.ariaLabel=`Select ${kindName(b.kind)} beat ${index+1}${depth?' in branch':''}`;button.ariaExpanded=String(b.id===selected);
      const number=el('span','st-beat-number',String(index+1).padStart(2,'0')),copy=el('div','st-beat-copy');copy.append(el('span','st-beat-kind',`${kindName(b.kind)}${drafts.has(b.id)?' · Draft':''}`),el('p','',summary(drafts.get(b.id)??b)));button.append(number,copy);card.append(button);
      if(variant==='manuscript'&&b.id===selected)card.append(editor(b));
      if(b.kind==='condition'){const branches=el('details','st-branches');branches.open=true;branches.append(el('summary','','Branch bodies'));for(const branch of b.branches){const section=el('div','st-branch');section.append(el('div','st-branch-label',`${branch.name}${branch.condition?` · ${branch.condition}`:''}`));rows(branch.beats,section,depth+1);if(!branch.beats.length)section.append(el('p','muted','Empty branch'));section.append(action(`Add beat to ${branch.name}`,()=>newBeat(branch.beats)));branches.append(section);}branches.append(el('p','st-rejoin','Continuing branches rejoin here'));card.append(branches);}parent.append(card);});}
    if(!scene().beats.length){const empty=el('div','st-empty');empty.append(el('h3','','A scene starts with one beat'),el('p','muted','Write a line, set the scene, or let a choice open the next path.'),action('Write the first beat',()=>newBeat(),true));list.append(empty);}else rows(scene().beats,list);
    list.append(action('Add beat at end…',()=>newBeat()));
    if(variant==='manuscript'){center.append(preview,list);workspace.append(center);}else{const editing=el('div','st-editing');editing.append(preview);const b=current();if(b)editing.append(editor(b));else editing.append(el('div','st-no-selection','Select a beat to edit it.'));center.append(editing,list);workspace.append(center);}
    list.scrollTop=listScroll;
    if(focusLabel){const restored=[...workspace.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('input,textarea,select')].find(x=>x.ariaLabel===focusLabel);if(restored){restored.focus({preventScroll:true});if(caret!==null&&(restored instanceof HTMLInputElement||restored instanceof HTMLTextAreaElement)){try{restored.setSelectionRange(caret,caret);}catch{}}if(restored instanceof HTMLTextAreaElement)restored.scrollTop=fieldScroll;}}
  }
  draw();
  if(variant==='manuscript'){const list=workspace.querySelector<HTMLElement>('.st-beat-list'),card=workspace.querySelector<HTMLElement>('[data-selected="true"]');if(list&&card)list.scrollTop=card.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;}
  if(context.state==='error')status('Save refusal sample. Edits remain available after the simulated error.');
  return ()=>{disposed=true;clearTimeout(pendingTimer);frame.shell.querySelectorAll('dialog').forEach(d=>d.close());};
}
