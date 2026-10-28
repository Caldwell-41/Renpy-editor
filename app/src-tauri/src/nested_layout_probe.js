// L04 synthetic native-WebView input through production controls and core requests.
(async () => {
  const stages=[];let stage='open',serial=0,sessionId,identity,acceptedSource,identities,awaitedControl='recent project';
  const assert=(value,message)=>{if(!value)throw Error(message);};
  const until=async condition=>{const end=performance.now()+30000;while(!await condition()){if(performance.now()>end)throw Error(`Timeout: ${stage}`);await new Promise(resolve=>setTimeout(resolve,30));}};
  const request=async(operation,payload={})=>{
    const response=await window.__TAURI_INTERNALS__.invoke('core_request',{request:{protocolVersion:1,requestId:`nested-${++serial}`,operation,payload:operation==='project.current'?payload:{sessionId,...payload}}});
    if(!response.ok)throw Object.assign(Error(`${operation}: ${response.error.code}`),{code:response.error.code});return response.value;
  };
  const call=(operation,payload={})=>['project.current','source.open','screens.inspect','screens.list'].includes(operation)
    ?window.__loomlightProbeRetryBusy(()=>request(operation,payload)):request(operation,payload);
  const find=window.__loomlightProbeFindButton;
  const click=async name=>{awaitedControl=`button ${name}`;await until(()=>find(name)&&!find(name).disabled);find(name).click();};
  const checkpoint=name=>{stage=name;stages.push({stage});};
  const row=id=>[...document.querySelectorAll('.screen-tree [data-node-id]')].find(element=>element.dataset.nodeId===id);
  const selected=()=>document.querySelector('.screen-tree [aria-selected="true"]')?.dataset.nodeId;
  const select=async(id,design=false)=>{await until(()=>row(id)&&!row(id).disabled);row(id).click();if(design)row(id).dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));};
  const source=async()=>(await call('source.open',{path:identity.path})).text;
  const inspect=async()=>(await call('screens.inspect',{path:identity.path})).screens.find(screen=>screen.name==='travel_notes').nodes;
  const input=(label,value)=>{const field=document.querySelector(`input[aria-label="${label}"],textarea[aria-label="${label}"]`);assert(field,`${label} exists`);field.focus();field.value=value;field.dispatchEvent(new Event('input',{bubbles:true}));return field;};
  const add=async(parent,kind,text='')=>{
    await select(parent);await click('Add element');await until(()=>document.querySelector(`[data-kind="${kind}"]`));document.querySelector(`[data-kind="${kind}"]`).click();
    if(kind==='text')input('New element text',text);
    await click(`Add ${{window:'window',hbox:'horizontal group',viewport:'viewport',grid:'grid',text:'text'}[kind]}`);
    await until(()=>!document.querySelector('.screen-addition'));
    const node=(await inspect()).find(node=>node.id===selected());assert(node?.kind===kind,'Addition keeps a distinct owned identity');return node.id;
  };
  const history=async(direction,expected,id)=>{await click(direction);await until(async()=>await source()===expected&&selected()===id);};
  try {
    await until(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();await click('Screens');
    sessionId=(await call('project.current')).sessionId;
    await click('New blank screen');await until(()=>document.querySelector('[aria-label="Screen name"]'));
    input('Screen name','travel_notes').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    await until(()=>document.querySelector('.screen-tree [data-node-id]'));identity=(await call('screens.list')).owned[0];assert(identity?.resolved,'Owned screen resolves');
    const windowId=await add(identity.rootId,'window'),box=await add(windowId,'hbox'),viewport=await add(box,'viewport'),grid=await add(viewport,'grid');
    const texts=[];for(const text of ['One','Two','Three'])texts.push(await add(grid,'text',text));
    identities=[identity.rootId,windowId,box,viewport,grid,...texts];assert(new Set(identities).size===8,'All identities are distinct');
    checkpoint('nested-composition-passed');

    await select(grid,true);awaitedControl='grid fields';await until(()=>document.querySelector('[data-layout-field=columns]'));
    input('Columns','4');input('Rows','1');input('Spacing','8');await click('Apply layout');await until(()=>document.querySelector('.layout-state')?.textContent==='Saved');
    const gridSaved=await source();assert(gridSaved.includes('grid 4 1:')&&gridSaved.includes('spacing 8'),'Grid header and spacing are saved together');
    const invalid=input('Columns','1');await click('Apply layout');assert(invalid.value==='1'&&invalid.getAttribute('aria-invalid')==='true','Capacity refusal retains input and field error');assert(await source()===gridSaved,'Invalid capacity writes nothing');
    await click('Cancel layout');await click('Apply layout');await until(()=>document.querySelector('.screen-message')?.textContent.includes('No change'));
    await click('Undo');await until(()=>document.querySelector('[data-layout-field=columns]')?.value==='2');await click('Redo');await until(()=>document.querySelector('[data-layout-field=columns]')?.value==='4');assert(await source()===gridSaved,'Redo restores exact grid source');
    checkpoint('grid-layout-passed');

    await click('Back to elements');await select(viewport,true);await until(()=>document.querySelector('[data-layout-field=ysize]'));
    input('Width','240');input('Height','80');await click('Apply layout');await until(()=>document.querySelector('.layout-state')?.textContent==='Saved');
    const viewportSaved=await source();const height=input('Height','90');await click('View in Source');await until(()=>document.querySelector('.screen-source-dialog[open]'));
    assert(document.querySelector('.screen-source-dialog pre').textContent===viewportSaved,'Source modal shows accepted bytes without drafts');
    await click('Close source');assert(height.value==='90','Closing Source retains the height draft');await click('Cancel layout');
    await click('View in Source');await until(()=>document.querySelector('.screen-source-dialog[open]'));await click('Edit in Source');await until(()=>document.querySelector('.source-editor'));
    const editor=window.__loomlightProbeEditor(document.querySelector('.source-editor'));
    const protectedSource=viewportSaved+'    use source_only_footer()\n\nscreen source_only_footer():\n    text "Protected neighbor"\n';
    editor.value=protectedSource;editor.dispatchEvent(new Event('input',{bubbles:true}));await click('Save Source');await until(()=>document.querySelector('#app-status')?.textContent==='Saved');await click('Screens');await click('1  Choose');
    await until(()=>document.querySelector('.screen-tree [data-node-id^="source-"]'));
    assert(identities.every(id=>row(id)),'Source reconciliation preserves every owned identity');assert(await source()===protectedSource,'Opaque source remains exact');
    checkpoint('viewport-source-passed');

    await select(viewport);await click('Remove element');await until(()=>document.querySelector('.screen-removal-dialog[open]'));
    assert(document.activeElement.textContent==='Cancel','Removal starts on Cancel');await click('Cancel');assert(await source()===protectedSource,'Cancel writes nothing');
    await click('Remove element');await click('Remove group and 4 children');await until(()=>!document.querySelector('.screen-removal-dialog[open]'));
    const removed=await source();assert(removed.includes('use source_only_footer()'),'Removal preserves opaque neighbor');
    await history('Undo',protectedSource,viewport);await history('Redo',removed,box);await history('Undo',protectedSource,viewport);
    acceptedSource=await source();checkpoint('nested-history-passed');
    await click('Close Project');await until(()=>document.querySelector('.recent-open'));document.querySelector('.recent-open').click();await until(()=>find('Screens'));
    const reopened=await call('project.current');assert(reopened.sessionId!==sessionId,'Reopen changes session');sessionId=reopened.sessionId;await click('Screens');await until(()=>row(viewport));
    assert(await source()===acceptedSource&&identities.every(id=>row(id)),'Reopen preserves source and identities');checkpoint('nested-reopen-passed');checkpoint('complete');
    await call('probe.runtimeUiReport',{scenario:'nested-layout',passed:true,stage,stages,identity,identities,acceptedSource,nativeWebView:true,sdkExecuted:false});
  } catch(error) {
    await call('probe.runtimeUiReport',{scenario:'nested-layout',passed:false,stage,stages,identity,awaitedControl,fields:[...document.querySelectorAll('[data-layout-field]')].map(field=>[field.dataset.layoutField,field.value]),error:String(error),feedback:document.querySelector('.screen-message')?.textContent,nativeWebView:true,sdkExecuted:false});
  }
})();
