/** Dialog presentation preserves the existing form and transaction owner. */
export function catalogDialog(content: HTMLElement, title: string, trigger?: HTMLElement): () => void {
  if(content.closest('[aria-modal="true"]')) return ()=>{};
  const previous = trigger ?? document.activeElement as HTMLElement | null;
  const initial=[...content.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("input,select,textarea")].map(control=>({control,value:control.value,checked:control instanceof HTMLInputElement?control.checked:undefined}));
  const placeholder = document.createComment("catalog form");
  content.before(placeholder);
  const overlay = document.createElement("div"); overlay.className = "leave-source-dialog catalog-dialog";
  overlay.setAttribute("role", "dialog"); overlay.setAttribute("aria-modal", "true"); overlay.setAttribute("aria-label", title);
  const panel = document.createElement("section"); panel.className = "catalog-dialog-panel";
  const header = document.createElement("header"); header.className = "panel-heading";
  const heading = document.createElement("h2"); heading.textContent = title;
  const close = document.createElement("button"); close.type = "button"; close.className = "icon-button panel-close";
  close.textContent = "×"; close.ariaLabel = `Close ${title}`; close.title = close.ariaLabel;
  header.append(heading, close);
  const footer = document.createElement("div"); footer.className = "catalog-dialog-footer";
  const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "button"; cancel.textContent = "Cancel";
  const submit=content.querySelector<HTMLButtonElement>(":scope > .catalog-submit, :scope > .row-actions > button.primary");
  const submitPlaceholder=document.createComment("catalog submit");if(submit){submit.before(submitPlaceholder);footer.append(cancel,submit);}else footer.append(cancel); content.hidden = false; panel.append(header, content, footer); overlay.append(panel);
  (document.querySelector("#app .app-shell") ?? document.querySelector("#app") ?? document.body).prepend(overlay);
  const finish = (): void => {
    if(submit&&submitPlaceholder.isConnected)submitPlaceholder.replaceWith(submit);
    if(content.classList.contains("inline-editor")){content.remove();placeholder.remove();}
    else if (placeholder.isConnected) { placeholder.replaceWith(content); content.hidden = true; }
    overlay.remove(); if(previous?.isConnected) previous.focus();
  };
  const requestClose = (): void => {
    // An in-flight write owns completion; dismissal cannot detach its controls.
    if(submit?.disabled||content.querySelector('button.primary:disabled,[data-busy="true"]')) return;
    if(content.querySelector('[data-unsubmitted="true"]')) {
      if(panel.querySelector('.discard-question')) return;
      const question=document.createElement('div'); question.className='discard-question';
      const copy=document.createElement('p'); copy.textContent='Discard unsubmitted changes? Completed imports are kept.';
      const keep=document.createElement('button'); keep.type='button'; keep.className='button'; keep.textContent='Keep editing';
      const discard=document.createElement('button'); discard.type='button'; discard.className='button danger'; discard.textContent='Discard changes';
      keep.onclick=()=>{question.remove();content.querySelector<HTMLElement>('input,select')?.focus();};
      discard.onclick=()=>{initial.forEach(({control,value,checked})=>{control.value=value;if(checked!==undefined)(control as HTMLInputElement).checked=checked;});content.dispatchEvent(new window.Event('catalog-discard'));content.querySelectorAll<HTMLElement>('[data-unsubmitted]').forEach(e=>delete e.dataset.unsubmitted);finish();window.dispatchEvent(new window.Event('loomlight-catalog-discarded'));};
      question.append(copy,keep,discard);panel.append(question);keep.focus();return;
    }
    finish();
  };
  close.onclick=requestClose; cancel.onclick=requestClose;
  overlay.addEventListener('keydown', event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();requestClose();}
    if(event.key==='Tab'){
      const controls=[...panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(e=>!e.hidden&&!e.closest('[hidden]'));
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  content.querySelector<HTMLElement>('input,select,button')?.focus();
  return finish;
}
