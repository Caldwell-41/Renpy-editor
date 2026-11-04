// Experience-first Help study. Fictional data and all changes stay in memory.
import type { LabContext } from '../../contracts.ts';
import './style.css';
export type Variant = 'inspector' | 'steps' | 'story-split';
type Kind = 'panel' | 'dialog';
type View = 'empty' | 'create' | 'design' | 'story';
type Node = 'title' | 'explanation' | 'image' | 'close';
type Beat = 'callScreen' | 'showScreen' | 'hideScreen' | 'sceneCall' | 'return';
type Placement = 'before-intro' | 'before-following' | 'before-return';
interface StoryDraft { type: Beat; target: string; position: Placement }
const placements: [Placement,string][] = [['before-intro','Before the introduction'],['before-following',`Before "Ready? Let's go."`],['before-return','Before Return / end']];
const positionCaption = (p:Placement) => p==='before-intro'?'Before the introduction':p==='before-following'?'After the introduction':'Before Return / end';
interface Appearance { title: string; explanation: string; image: string; closeLabel: string; action: string }
interface Screen { name: string; kind: Kind; appearance: Appearance }
const esc = (s: string) => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const names: Record<Node,string> = {title:'Title',explanation:'Explanation',image:'Image',close:'Close button'};
const beatName = (b: Beat) => ({callScreen:'Call screen',showScreen:'Show screen',hideScreen:'Hide screen',sceneCall:'Call Scene',return:'Return / end'})[b];
const defaults = (kind: Kind, image='controls_guide'): Appearance => ({title:'How to play',explanation:'Choose a reply to continue the story. Press Escape or Close to return.',image,closeLabel:'Close',action:kind==='dialog'?'finish':'hide'});
export function mountStudy(host: HTMLElement, context: LabContext, variant: Variant) {
  const start = context.state==='start';
  let view: View = start ? variant==='story-split'?'story':'create' : ['create','no-images'].includes(context.state)?'create':['story','unknown','missing'].includes(context.state)?'story':'design';
  const initialKind: Kind = context.state==='panel'?'panel':'dialog';
  let screen: Screen | null = start||['create','no-images'].includes(context.state)?null:{name:'help',kind:initialKind,appearance:defaults(initialKind)};
  let draft = screen?{...screen.appearance}:defaults('dialog');
  let creation = {name:'help',starter:'help',kind:'panel' as Kind,image:context.state==='no-images'?'':'controls_guide'};
  let imageAvailable = context.state!=='no-images', unresolved = context.state==='missing', unknown = context.state==='unknown';
  let selected: Node = context.state==='invalid'?'close':'title';
  if(context.state==='invalid')draft.action='hide';
  let story:StoryDraft = {type:screen?.kind==='panel'?'showScreen':'callScreen',target:screen?'help':'',position:'before-following'};
  let accepted:StoryDraft|null = null;
  let creationError='', appearanceError=context.state==='invalid'?'Hide screen cannot finish this dialog. Your draft is kept. Choose Finish interaction.':'', storyError='';
  let status='', sourceOpen=false, assetsOpen=false, toolsOpen=false;
  let playing=false, phase:'waiting'|'finished'='waiting', following=0, gameStatus='';
  let applies=0, creationPending=view==='create';
  let creationOrigin:'screens'|'story'='screens';
  const btn = (id:string,text:string,primary=false,disabled=false,attrs='',className='') => `<button type="button" data-do="${id}" class="${primary?'hd3-primary':''} ${className}" ${disabled?'disabled':''} ${attrs}>${esc(text)}</button>`;
  const field = (label:string,id:string,value:string,area:string,multi=false) => `<label>${esc(label)}${multi?`<textarea data-field="${id}" data-area="${area}" rows="4">${esc(value)}</textarea>`:`<input data-field="${id}" data-area="${area}" value="${esc(value)}" ${id==='name'?'autocapitalize="off" spellcheck="false"':''}>`}</label>`;
  const pick = (label:string,id:string,options:[string,string][],value:string,area:string) => `<label>${esc(label)}<select data-field="${id}" data-area="${area}">${options.map(([v,t])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(t)}</option>`).join('')}</select></label>`;
  const dirty = () => !!screen&&JSON.stringify(draft)!==JSON.stringify(screen.appearance);
  const imageOptions = (): [string,string][] => imageAvailable?[['controls_guide','controls_guide'],['map_legend','map_legend']]:[['','No UI images available']];
  function targets(type: Beat): [string,string][] {
    const kind:Kind = type==='callScreen'?'dialog':'panel';
    const items:[string,string][] = kind==='dialog'?[['map_help','map_help · Dialog']]:[['hud','hud · Panel']];
    if(screen&&screen.kind===kind&&!unresolved)items.unshift([screen.name,`${screen.name} · ${kind==='dialog'?'Dialog':'Panel'}`]);
    return items;
  }
  function createForm() {
    return `<section class="hd3-editor" aria-label="New screen"><h2>Create Help</h2>${pick('Starter','starter',[['help','Help'],['blank','Blank']],creation.starter,'creation')}${field('Source name','name',creation.name,'creation')}<p class="hd3-field-help">A lowercase name used in your Ren'Py source.</p>${pick('Kind','kind',[['panel','Panel'],['dialog','Dialog']],creation.kind,'creation')}<p class="hd3-purpose">${creation.kind==='panel'?'Story continues while the panel stays open. Use Show and Hide in Story.':'Story waits until the player closes the dialog. Use Call screen in Story.'}</p>${creation.starter==='help'?`${pick('UI image','image',imageOptions(),creation.image,'creation')}${imageAvailable?'<p class="hd3-field-help">480 × 240 pixels. Change its appearance after creation.</p>':`<div class="hd3-warning"><p>Help needs a UI image. Import one in Assets, then return. Your name and Help selection stay here.</p>${btn('assets','Open Assets')}</div>`}<p>Help starts with a title, explanation, image and Close button. Each stays editable in Screens.</p>`:'<p>Blank uses the existing New screen flow. This study covers Help.</p>'}${creationError?`<p class="hd3-error" role="alert">${esc(creationError)}</p>`:''}<div class="hd3-actions">${btn('create',`Create ${creation.kind}`,true,creation.starter==='help'&&!imageAvailable)}${btn('cancel-create','Cancel')}</div></section>`;
  }
  function artwork(id:string) {
    return `<svg viewBox="0 0 360 110" aria-hidden="true"><path d="M10 85L75 35 125 80 195 18 255 65 310 38 350 85M30 100H330" fill="none" stroke="currentColor" stroke-width="2"/></svg><span data-preview="image">${esc(id)} · 480 × 240</span>`;
  }
  function canvas() {
    if(view==='empty')return `<section class="hd3-canvas hd3-empty"><h2>Make a Help screen</h2><p>Create a screen, edit its appearance, then choose where it opens in Story.</p>${btn('new','New screen',true)}</section>`;
    if(view==='create'&&!imageAvailable&&creation.starter==='help')return '<section class="hd3-canvas hd3-empty"><h2>Add a UI image to start</h2><p>Your Help preview will appear here after you return from Assets.</p></section>';
    if(view==='create'&&creation.starter==='blank')return '<section class="hd3-canvas hd3-empty"><h2>Blank screen</h2><p>No Help nodes are included.</p></section>';
    const a=view==='create'?defaults(creation.kind,creation.image):draft;
    return `<section class="hd3-canvas" aria-label="Screen canvas"><div class="hd3-canvas-tools"><span>${view==='create'?'Starter preview':'Screen canvas'}</span><span>${view==='create'?'':dirty()?'Draft appearance':'Saved appearance'}</span></div><div class="hd3-composition"><button type="button" data-node="title" class="hd3-node hd3-title ${selected==='title'&&view==='design'?'hd3-selected':''}" ${view==='create'?'disabled':''}><span data-preview="title">${esc(a.title)}</span></button><button type="button" data-node="explanation" class="hd3-node ${selected==='explanation'&&view==='design'?'hd3-selected':''}" ${view==='create'?'disabled':''}><span data-preview="explanation">${esc(a.explanation)}</span></button><button type="button" data-node="image" aria-label="Select UI image" class="hd3-node hd3-art ${selected==='image'&&view==='design'?'hd3-selected':''}" ${view==='create'?'disabled':''}>${artwork(a.image)}</button><button type="button" data-node="close" class="hd3-node hd3-close ${selected==='close'&&view==='design'?'hd3-selected':''}" ${view==='create'?'disabled':''}><span data-preview="closeLabel">${esc(a.closeLabel)}</span></button></div><p class="hd3-canvas-help">${view==='design'?'Select an element to edit it. Canvas buttons never run game actions.':'Title, explanation, image and Close are ordinary editable elements.'}</p></section>`;
  }
  function closeFields() {
    const expected=screen?.kind==='dialog'?'finish':'hide';
    const options:[string,string][] = [[expected,expected==='finish'?'Finish interaction':'Hide this panel']];
    if(draft.action!==expected)options.unshift([draft.action,draft.action==='hide'?'Hide screen · invalid for this dialog':'Finish interaction · invalid for this panel']);
    return `${field('Close label','closeLabel',draft.closeLabel,'appearance')}${pick('Close action','action',options,draft.action,'appearance')}<p>${screen?.kind==='dialog'?'Close finishes this dialog and resumes Story.':'Close hides this panel. Story keeps going.'}</p><details class="hd3-dismissal" ${selected==='close'?'open':''}><summary>Dismissal defaults</summary><dl><dt>Escape</dt><dd>${screen?.kind==='dialog'?'Finish interaction':'Hide this panel'}</dd><dt>Outside click</dt><dd>Keep open</dd><dt>Initial focus</dt><dd>Close</dd><dt>Blocks the game</dt><dd>${screen?.kind==='dialog'?'Yes':'No'}</dd></dl></details>`;
  }
  function propertyFields() {
    if(variant==='steps')return `${field('Title','title',draft.title,'appearance')}${field('Explanation','explanation',draft.explanation,'appearance',true)}${pick('UI image','image',imageOptions(),draft.image,'appearance')}<p class="hd3-field-help">480 × 240 pixels</p><h3>Close button</h3>${closeFields()}`;
    if(selected==='title')return field('Title text','title',draft.title,'appearance');
    if(selected==='explanation')return field('Explanation text','explanation',draft.explanation,'appearance',true);
    if(selected==='image')return `${pick('UI image','image',imageOptions(),draft.image,'appearance')}<p>480 × 240 pixels</p>`;
    return closeFields();
  }
  function properties() {
    return `<section class="hd3-editor hd3-properties" aria-label="Appearance editor"><h2>${variant==='steps'?'Edit the appearance':names[selected]}</h2>${unresolved?'<p class="hd3-warning">This screen is unavailable. Your draft stays here until its source is resolved.</p>':''}${propertyFields()}${appearanceError?`<div class="hd3-error" role="alert"><p>${esc(appearanceError)}</p>${draft.action!==(screen?.kind==='dialog'?'finish':'hide')&&selected!=='close'?btn('edit-close','Edit Close action'):''}</div>`:''}<div class="hd3-edit-footer"><span data-dirty>${dirty()?'Unsaved appearance changes':'Appearance saved'}</span><div class="hd3-actions">${btn('apply','Apply changes',true,!dirty())}${btn('cancel-edit','Cancel',false,!dirty()&&!appearanceError)}</div></div></section>`;
  }
  function storyForm() {
    const isScreen=['callScreen','showScreen','hideScreen'].includes(story.type);
    const list=targets(story.type);
    const options:[string,string][] = [['',story.type==='callScreen'?'Choose a dialog…':'Choose a panel…'],...list];
    if(story.target&&!list.some(([id])=>id===story.target))options.unshift([story.target,`${story.target} · unavailable`]);
    const unavailable=!!story.target&&!list.some(([id])=>id===story.target);
    return `<section class="hd3-editor hd3-story-editor" aria-label="Story Beat editor"><h2>${accepted?'Edit screen Beat':'Add screen Beat'}</h2><div class="hd3-placement">${accepted?`<p>Position · ${esc(positionCaption(accepted.position))}</p>`:pick('Insert before','position',placements,story.position,'story')}</div>${pick('Beat type','beat',[['callScreen','Call screen'],['showScreen','Show screen'],['hideScreen','Hide screen'],['sceneCall','Call Scene'],['return','Return / end']],story.type,'story')}${isScreen?`${pick(story.type==='callScreen'?'Dialog':'Panel','target',options,story.target,'story')}<p class="hd3-purpose">${story.type==='callScreen'?'Wait here until the dialog finishes, then continue at the next Beat.':story.type==='showScreen'?'Keep the panel open while Story continues.':'Hide the panel at this point. Story continues.'}</p>${unavailable?`<p class="hd3-warning">The original ${esc(story.target)} screen is unavailable. Choose an available ${story.type==='callScreen'?'dialog':'panel'} explicitly. Your draft is kept.</p>`:''}${!screen&&story.type==='callScreen'?`${btn('new-dialog','Create a dialog in Screens')}<p class="hd3-field-help">Return to this insertion point after editing its appearance.</p>`:''}`:story.type==='sceneCall'?'<p>Call another Scene, then return here when that Scene ends. This is separate from a screen Call.</p>':'<p>Return from this Story body. This does not finish a screen interaction.</p>'}${unknown?'<p class="hd3-warning">An active interaction is unresolved. Review Source and effects before adding this Beat. No continuation is assumed.</p>':''}${storyError?`<p class="hd3-error" role="alert">${esc(storyError)}</p>`:''}<div class="hd3-story-footer"><div class="hd3-actions">${btn('add-beat',`${accepted?'Apply':'Add'} ${beatName(story.type)}`,true,isScreen&&!story.target)}${btn('cancel-beat','Cancel')}</div>${btn('source','Source and effects',false,false,'','hd3-text-action')}</div>${dirty()?`<p class="hd3-retained">Story uses the saved appearance. Your unsaved edits are still in Screens. ${btn('design','Return to appearance')}</p>`:''}</section>`;
  }
  function timeline(inline=false) {
    const position=accepted?.position??story.position;
    const anchors:Placement[]=['before-intro','before-following','before-return'];
    const content=[`<strong>Dialogue</strong><p>"Before we leave, take a look at the controls."</p>`,`<strong>Dialogue</strong><p>"Ready? Let's go."</p>`,'<strong>Return / end</strong><p>Return to the Scene caller or end this Story body.</p>'];
    let ordinal=0;
    const rows=anchors.map((anchor,index)=>{
      let insertion='';
      if(position===anchor) {
        const number=accepted?String(++ordinal).padStart(2,'0'):'+';
        insertion=`<li class="hd3-insertion" data-position="${anchor}" data-accepted="${!!accepted}"><span class="hd3-number">${number}</span><div class="hd3-insertion-body">${accepted?`<strong>${beatName(accepted.type)} · ${esc(accepted.target)}</strong><p>${accepted.type==='callScreen'?'Wait for Finish interaction.':'Continue Story.'}</p>`:`<strong>Place the screen here</strong><p>${esc(positionCaption(story.position))}</p>`}${inline?storyForm():''}</div></li>`;
      }
      return insertion+`<li data-anchor="${anchor}"><span class="hd3-number">${String(++ordinal).padStart(2,'0')}</span><div>${content[index]}</div></li>`;
    }).join('');
    return `<section class="hd3-timeline"><h2>First steps</h2><ol>${rows}</ol></section>`;
  }
  function sourcePanel() {
    if(!sourceOpen)return '';
    const a=screen?.appearance;
    const action=screen?.kind==='dialog'?'Return()':`Hide(${JSON.stringify(screen?.name)})`;
    const source=screen&&a?`screen ${screen.name}():\n    modal ${screen.kind==='dialog'?'True':'False'}\n    key "game_menu" action ${action}\n    frame:\n        vbox:\n            text ${JSON.stringify(a.title)}\n            text ${JSON.stringify(a.explanation)}\n            add ${JSON.stringify('ui/'+a.image+'.png')} xysize (480, 240)\n            textbutton ${JSON.stringify(a.closeLabel)}:\n                action ${action}\n                default_focus True`:'';
    const command=accepted&&['callScreen','showScreen','hideScreen'].includes(accepted.type)?`${accepted.type==='callScreen'?'call':accepted.type==='showScreen'?'show':'hide'} screen ${accepted.target}`:'';
    const storyLines=[`"Before we leave, take a look at the controls."`,`"Ready? Let's go."`,'return'];
    if(command&&accepted){const position=accepted.position;storyLines.splice(placements.findIndex(([p])=>p===position),0,command);}
    const storySource='label first_steps:\n    '+storyLines.join('\n    ');
    return `<section class="hd3-source" aria-label="Source and effects"><div class="hd3-section-row"><h2>Source and effects</h2>${btn('source','Close Source')}</div><p>Example source for the saved sample. It never runs in this page.</p>${unresolved?'<p class="hd3-warning">The original screen cannot be resolved. Its draft target is retained.</p>':source?`<h3>Screen source</h3><pre data-source="screen">${esc(source)}</pre>`:'<p>Create a screen in Screens to inspect its saved source.</p>'}<h3>Story source</h3>${command?`<pre data-source="story">${esc(storySource)}</pre>`:'<p>No screen Beat has been added. Use in Story only selects its target.</p>'}<h3>Effects</h3><p>${unknown?'Active interaction unknown. Finish cannot assume a safe continuation.':'Call waits for Finish interaction. Hide dismisses shown panels. Custom actions remain unknown.'}</p><p>Screens are parameterless. Calls use static names and capture no return value.</p></section>`;
  }
  function playback() {
    if(!playing||!screen)return '';
    const a=screen.appearance;
    const position=accepted?.type==='callScreen'&&accepted.target===screen.name?accepted.position:'before-following';
    const next=position==='before-intro'?`"Before we leave, take a look at the controls."`:position==='before-following'?`"Ready? Let's go."`:'Return / end';
    return `<section class="hd3-playback" aria-label="Dialog playback simulation"><div class="hd3-section-row"><strong>Browser simulation</strong>${btn('stop','Back to editor')}</div><p class="hd3-playback-copy">${phase==='waiting'?`Call screen ${esc(screen.name)} is waiting.`:'The dialog finished. Story continued once.'}</p><div class="hd3-stage" data-outside="true"><div class="hd3-game-line ${phase==='finished'?'hd3-next-line':''}"><span>${phase==='waiting'?'Waiting at Call':'Following Beat'}</span><p>${phase==='waiting'?'Story is waiting for Help to finish.':esc(next)}</p></div>${phase==='waiting'?`<section class="hd3-game-dialog" role="dialog" aria-modal="true" aria-labelledby="hd3-game-title"><h2 id="hd3-game-title">${esc(a.title)}</h2><p>${esc(a.explanation)}</p><div class="hd3-art">${artwork(a.image)}</div>${btn('finish',a.closeLabel,true)}</section>`:''}</div><div class="hd3-playback-footer"><span role="status">${esc(gameStatus||'Close has initial focus. Escape also finishes. Outside clicks keep Help open.')}</span>${phase==='finished'?btn('again','Try again'):btn('advance','Continue Story',false,true)}</div><p class="hd3-simulation-note">This checks the browser prototype. Ren'Py behavior still needs qualification.</p></section>`;
  }
  function reviewTools() {
    return `<details class="hd3-review-tools" ${toolsOpen?'open':''}><summary>Prototype conditions and state</summary>${screen?btn('invalid-action','Load an invalid dismissal draft'):''}${pick('Interaction context','unknown',[['known','Known interaction'],['unknown','Unknown active interaction']],unknown?'unknown':'known','tools')}<pre data-debug>${esc(JSON.stringify({view,screen,creation,draft,selected,story,accepted,unknown,unresolved,playing,phase,followingBeatRuns:following,acceptedAppearanceChanges:applies},null,2))}</pre></details>`;
  }
  function render(focus?:string) {
    const scroll=window.scrollY;
    host.className=`hd3-study hd3-layout-${variant}`;
    host.dataset.view=view;
    host.dataset.playing=String(playing);
    const inScreens=view!=='story';
    const title=inScreens?view==='create'?'New screen':screen?`${screen.name} · ${screen.kind==='dialog'?'Dialog':'Panel'}`:'Screens':'Story · First steps';
    host.innerHTML=`<div class="hd3-app-header"><strong>Loomlight</strong><span>The crossing</span><span class="hd3-version">Help ${variant==='inspector'?'A4':variant==='steps'?'B4':'C4'}</span></div><nav class="hd3-nav" aria-label="Workspace">${btn('screens','Screens',false,false,`aria-current="${inScreens?'page':'false'}"`)}${btn('story','Story',false,false,`aria-current="${!inScreens?'page':'false'}"`)}<span>${esc(title)}</span><div class="hd3-nav-actions">${variant==='story-split'&&view==='design'?btn('new','New screen'):''}${screen&&view==='design'?`${screen.kind==='dialog'?btn('try','Try dialog'):''}${btn('use-story','Use in Story',true)}`:''}</div></nav>${variant==='steps'?`<nav class="hd3-step-nav" aria-label="Help setup">${btn('new','1  Create',false,false,`aria-current="${view==='create'?'step':'false'}"`)}${btn('design','2  Appearance',false,!screen,`aria-current="${view==='design'?'step':'false'}"`)}${btn('use-story','3  Story',false,!screen,`aria-current="${view==='story'?'step':'false'}"`)}</nav>`:''}${variant==='story-split'&&inScreens?`<div class="hd3-return">${btn('story','Return to First steps')}<span>${esc(positionCaption(story.position))}</span></div>`:''}<div class="hd3-work hd3-view-${view}">${variant==='inspector'?`<aside class="hd3-tree"><h2>${inScreens?'Choose':'Scenes'}</h2>${inScreens?`${btn('new','New screen')}${screen?btn('design',screen.name):''}${screen&&view==='design'?`<h3>Elements</h3>${(Object.keys(names) as Node[]).map(n=>btn('node-'+n,names[n],false,false,`aria-pressed="${selected===n}"`)).join('')}`:''}`:'<p>Chapter 1</p><strong>First steps</strong>'}</aside>`:''}${view==='create'?variant==='steps'?`${createForm()}${canvas()}`:`${canvas()}${createForm()}`:view==='empty'?canvas():view==='story'?variant==='story-split'?timeline(true):`${timeline()}${storyForm()}`:variant==='steps'?`${properties()}${canvas()}`:`${canvas()}${properties()}`}</div>${screen&&view==='design'?`<div class="hd3-screen-utilities">${variant!=='inspector'?`<nav class="hd3-node-nav" aria-label="Elements">${(Object.keys(names) as Node[]).map(n=>btn('node-'+n,names[n],false,false,`aria-pressed="${selected===n}"`)).join('')}</nav>`:''}${btn('source','View in Source')}</div>`:''}${status?`<div class="hd3-status" role="status">${esc(status)}</div>`:''}${sourcePanel()}${reviewTools()}${assetsOpen?`<section class="hd3-assets-handoff" role="dialog" aria-modal="true" aria-label="Assets handoff"><h2>Import a UI image in Assets</h2><p>The existing Assets import flow is outside this prototype. Your creation draft is still here.</p><div class="hd3-actions">${btn('image-ready','Simulate import and return',true)}${btn('cancel-assets','Return without importing')}</div></section>`:''}${playback()}`;
    bind();
    window.scrollTo({top:scroll});
    if(assetsOpen)host.querySelector<HTMLButtonElement>('.hd3-assets-handoff .hd3-primary')?.focus({preventScroll:true});
    else if(playing&&phase==='waiting')host.querySelector<HTMLButtonElement>('[data-do="finish"]')?.focus({preventScroll:true});
    else if(focus)host.querySelector<HTMLElement>(focus)?.focus({preventScroll:true});
  }
  function refreshDraft() {
    for(const key of ['title','explanation','image','closeLabel'] as const) {
      const el=host.querySelector<HTMLElement>(`[data-preview="${key}"]`);
      if(el)el.textContent=key==='image'?`${draft.image} · 480 × 240`:draft[key];
    }
    host.querySelectorAll<HTMLElement>('[data-dirty]').forEach(el=>el.textContent=dirty()?'Unsaved appearance changes':'Appearance saved');
    const apply=host.querySelector<HTMLButtonElement>('[data-do="apply"]');if(apply)apply.disabled=!dirty();
    const cancel=host.querySelector<HTMLButtonElement>('[data-do="cancel-edit"]');if(cancel)cancel.disabled=!dirty()&&!appearanceError;
    const debug=host.querySelector('[data-debug]');if(debug)debug.textContent=JSON.stringify({view,screen,creation,draft,story,accepted,followingBeatRuns:following},null,2);
    host.querySelector('.hd3-canvas-tools span:last-child')?.replaceChildren(document.createTextNode(dirty()?'Draft appearance':'Saved appearance'));
  }
  function toStory() {
    view='story';
    if(screen){story={...story,type:screen.kind==='dialog'?'callScreen':'showScreen',target:screen.name};status=`${screen.name} selected. Add a Beat to place it in Story.`;}
  }
  function finish() {
    if(!playing||phase!=='waiting')return;
    if(unknown){gameStatus='Finish refused. The active interaction is unresolved. The dialog stays open.';render();return;}
    phase='finished';following++;gameStatus='Help closed. The following Beat ran once.';render('[data-do="again"]');
  }
  function action(id:string) {
    if(id==='new'){if(!creationPending)creation={name:'help',starter:'help',kind:'panel',image:imageAvailable?'controls_guide':''};creationPending=true;creationOrigin='screens';view='create';creationError='';status='';}
    if(id==='new-dialog'){creationPending=true;creationOrigin='story';view='create';creation.kind='dialog';creation.starter='help';creationError='';status='Create the dialog in Screens, then return to First steps.';}
    if(id==='screens'||id==='design'){view=screen?'design':'create';}
    if(id==='story')view='story';
    if(id==='use-story')toStory();
    if(id.startsWith('node-')){selected=id.slice(5) as Node;view='design';}
    if(id==='edit-close')selected='close';
    if(id==='invalid-action'&&screen){draft.action=screen.kind==='dialog'?'hide':'finish';selected='close';view='design';appearanceError='';}
    if(id==='create') {
      creationError='';
      if(!/^[a-z][a-z0-9_]{0,63}$/.test(creation.name))creationError='Use a lowercase name beginning with a letter, up to 64 characters. Your name is kept.';
      else if(['map_help','hud',screen?.name].includes(creation.name))creationError='That source name is already in use. Choose another name. Your draft is kept.';
      else if(creation.starter==='blank'){status='Blank keeps its existing creation flow. This Help study does not simulate its result.';}
      else if(!imageAvailable){creationError='Help needs a UI image. Import one in Assets, then return.';}
      else {creationPending=false;screen={name:creation.name,kind:creation.kind,appearance:defaults(creation.kind,creation.image)};draft={...screen.appearance};unresolved=false;selected='title';view='design';appearanceError='';status=`${screen.name} created. Select an element to edit its appearance.`;}
    }
    if(id==='cancel-create'){creationPending=false;creation={name:'help',starter:'help',kind:'panel',image:imageAvailable?'controls_guide':''};creationError='';view=creationOrigin==='story'?'story':screen?'design':'empty';status='Creation cancelled. No screen was added.';}
    if(id==='assets')assetsOpen=true;
    if(id==='cancel-assets')assetsOpen=false;
    if(id==='image-ready'){imageAvailable=true;creation.image='controls_guide';assetsOpen=false;status='Returned from Assets. Your creation draft is kept.';}
    if(id==='apply'&&screen) {
      appearanceError='';
      if(unresolved)appearanceError='The original screen is unavailable. Your appearance draft is kept. Review Source and effects.';
      else if(draft.action!==(screen.kind==='dialog'?'finish':'hide'))appearanceError=screen.kind==='dialog'?'Hide screen cannot finish this dialog. Your draft is kept. Choose Finish interaction.':'Finish interaction cannot dismiss a shown panel. Your draft is kept. Choose Hide this panel.';
      else if(unknown)appearanceError='The active interaction is unresolved. Your appearance draft is kept. Review Source and effects.';
      else if(dirty()){screen.appearance={...draft};applies++;status='Appearance changes applied.';}
    }
    if(id==='cancel-edit'&&screen){draft={...screen.appearance};appearanceError='';status='Unsaved appearance changes cancelled.';}
    if(id==='add-beat') {
      storyError='';
      if(!['callScreen','showScreen','hideScreen'].includes(story.type))status=`${beatName(story.type)} keeps its existing Story operation. It is separate from Call screen and Finish interaction.`;
      else if(!targets(story.type).some(([target])=>target===story.target))storyError='Choose an available screen explicitly. Your original target and Beat draft are kept.';
      else if(!placements.some(([p])=>p===story.position))storyError='Choose an available insertion point. Your draft is kept.';
      else if(accepted&&story.position!==accepted.position)storyError='Use Story Move to change an existing Beat position. Your draft is kept.';
      else if(unknown)storyError='The active interaction is unresolved. Your Beat draft is kept. Review Source and effects.';
      else{accepted={...story};status=`${beatName(accepted.type)} ${accepted.target} added ${positionCaption(accepted.position).toLowerCase()}.`;}
    }
    if(id==='cancel-beat'){story=accepted?{...accepted}:{type:screen?.kind==='panel'?'showScreen':'callScreen',target:screen?.name??'',position:'before-following'};storyError='';status=accepted?'Beat draft cancelled. The saved Beat is unchanged.':'Beat draft cancelled. No Beat was added.';}
    if(id==='source')sourceOpen=!sourceOpen;
    if(id==='try'&&screen?.kind==='dialog'){if(unresolved)appearanceError='The original screen is unavailable. Your draft is kept.';else{playing=true;phase='waiting';following=0;gameStatus=dirty()?'Trying the saved appearance. Apply your edits in Screens to include them.':'';}}
    if(id==='stop'){playing=false;status='Browser simulation stopped.';}
    if(id==='again'){phase='waiting';following=0;gameStatus='';}
    if(id==='finish'){finish();return;}
    if(id==='advance'){gameStatus='Story is waiting for the dialog to finish.';}
    const focus=id==='cancel-create'?(view==='story'?'[data-do="new-dialog"]':'[data-do="new"]'):id==='stop'?'[data-do="try"]':id==='image-ready'?'[data-do="create"]':id==='cancel-assets'?'[data-do="assets"]':id.startsWith('node-')?`[data-do="${id}"]`:`[data-do="${id}"]`;
    render(focus);
  }
  function bind() {
    host.querySelector<HTMLDetailsElement>('.hd3-review-tools')?.addEventListener('toggle',e=>toolsOpen=(e.currentTarget as HTMLDetailsElement).open);
    host.querySelectorAll<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('[data-field]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',()=>{
      const key=el.dataset.field!,area=el.dataset.area!,value=el.value;
      if(area==='creation')Object.assign(creation,{[key]:value});
      if(area==='appearance'){Object.assign(draft,{[key]:value});if(key==='action'&&!unknown&&value===(screen?.kind==='dialog'?'finish':'hide'))appearanceError='';}
      if(area==='story') {
        if(key==='beat') {story.type=value as Beat;const options=targets(story.type);if(!options.some(([name])=>name===story.target))story.target='';}
        if(key==='target')story.target=value;
        if(key==='position')story.position=value as Placement;
      }
      if(area==='tools')unknown=value==='unknown';
      if(el.tagName==='SELECT'){render(`[data-area="${area}"][data-field="${key}"]`);if(area==='story'&&key==='position'&&variant==='story-split')host.querySelector<HTMLElement>('.hd3-story-editor')?.scrollIntoView?.({block:'nearest'});}else if(area==='appearance')refreshDraft();
    }));
    host.querySelectorAll<HTMLButtonElement>('[data-do]').forEach(el=>el.onclick=()=>action(el.dataset.do!));
    host.querySelectorAll<HTMLButtonElement>('[data-node]').forEach(el=>el.onclick=()=>{selected=el.dataset.node as Node;render();host.querySelector<HTMLElement>(variant==='steps'?`[data-area="appearance"][data-field="${selected==='close'?'closeLabel':selected}"]`:`[data-node="${selected}"]`)?.focus({preventScroll:true});});
    host.querySelector<HTMLElement>('[data-outside]')?.addEventListener('click',e=>{if(phase==='waiting'&&!(e.target instanceof Element&&e.target.closest('.hd3-game-dialog'))){gameStatus='Outside click kept Help open. Story is still waiting.';const s=host.querySelector('.hd3-playback-footer [role="status"]');if(s)s.textContent=gameStatus;host.querySelector<HTMLButtonElement>('[data-do="finish"]')?.focus({preventScroll:true});}});
  }
  const keydown=(e:KeyboardEvent)=>{
    if(e.key==='Escape') {
      e.preventDefault();e.stopPropagation();
      if(assetsOpen){action('cancel-assets');return;}
      if(playing){if(phase==='waiting')finish();else action('stop');return;}
      action(view==='create'?'cancel-create':view==='story'?'cancel-beat':'cancel-edit');
    }
    if(e.key==='Tab'&&(playing||assetsOpen)) {
      const scope=host.querySelector(assetsOpen?'.hd3-assets-handoff':'.hd3-playback')!;
      const controls=[...scope.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const i=controls.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length]?.focus();
    }
  };
  const modalKeydown=(event:KeyboardEvent)=>{if((playing||assetsOpen)&&!event.composedPath().includes(host))keydown(event);};
  host.ownerDocument.addEventListener('keydown',modalKeydown,true);
  host.addEventListener('keydown',keydown);render();
  return ()=>{host.ownerDocument.removeEventListener('keydown',modalKeydown,true);host.removeEventListener('keydown',keydown);host.replaceChildren();};
}
