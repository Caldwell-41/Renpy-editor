/** New technical tokens follow the core's lowercase ASCII, 64-byte contract. */
export function technicalName(value: string, label = "Technical name"): string {
  const normalized = value.trim().replace(/[A-Z]/g, letter => letter.toLowerCase());
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(normalized)) {
    throw new Error(`${label} must begin with a letter and use 1–64 letters, numbers or underscores.`);
  }
  return normalized;
}

export function technicalNameInput(control: HTMLInputElement): void {
  control.dataset.technicalName = "true";
  control.autocapitalize = "none";
  control.autocomplete = "off";
  control.setAttribute("autocorrect", "off");
  control.spellcheck = false;
  control.pattern = "[A-Za-z][A-Za-z0-9_]{0,63}";
}

export const technicalNameHelp = "Technical names are saved in lowercase. Use letters, numbers and underscores.";

export function namingHelp(label: HTMLElement, control: HTMLElement): void {
  if(!control.hasAttribute('data-technical-name') && !/display name/i.test(label.textContent ?? '')) return;
  const help=document.createElement('details');help.className='naming-help';
  const trigger=document.createElement('summary');trigger.textContent='ⓘ';trigger.ariaLabel='Naming guidance';
  const text=document.createElement('span');text.className='naming-tooltip';
  text.textContent=control.hasAttribute('data-technical-name')
    ? 'Use a descriptive lowercase name starting with a letter, such as bec, uni_night or relationship_score. Separate words with underscores; avoid spaces, punctuation and Ren’Py reserved names. Loomlight saves 1–64 letters, numbers or underscores. Character and Variable technical names are fixed after creation; Appearance expressions can be edited.'
    : 'Use a readable name with spaces and capitals, such as Bec or University at Night. This label is separate from the technical name used in Ren’Py source.';
  help.append(trigger,text);label.append(help);
  let composing=false;control.addEventListener('compositionstart',()=>{composing=true;});control.addEventListener('compositionend',()=>{composing=false;});
  control.addEventListener('blur',()=>{if(!composing && control.hasAttribute('data-technical-name') && control instanceof HTMLInputElement)control.value=control.value.trim().replace(/[A-Z]/g,c=>c.toLowerCase());});
}
