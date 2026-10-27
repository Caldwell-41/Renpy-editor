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

let errorSequence = 0;
/** Completion/submission validation. Incomplete typing and IME remain untouched. */
export function validateField(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, check: () => void): () => void {
  const error = document.createElement("span"); error.className = "field-error"; error.id = `authoring-field-error-${++errorSequence}`; error.hidden = true; error.role = "alert";
  control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"), error.id].filter(Boolean).join(" "));
  let composing = false;
  const validate = (): void => {
    try { check(); control.removeAttribute("aria-invalid"); error.hidden = true; error.textContent = ""; }
    catch (failure) {
      const message = failure instanceof Error ? failure.message : "Check this field.";
      if (error.textContent !== message) error.textContent = message;
      error.hidden = false;
      if (!error.isConnected) control.insertAdjacentElement("afterend", error);
      control.setAttribute("aria-invalid", "true"); throw failure;
    }
  };
  control.addEventListener("compositionstart", () => { composing = true; });
  control.addEventListener("compositionend", () => { composing = false; });
  control.addEventListener("blur", () => { if (!composing) { try { validate(); } catch { /* Display beside the field. */ } } });
  control.addEventListener("input", () => { if (!composing && control.getAttribute("aria-invalid") === "true") { try { validate(); } catch { /* Keep current error. */ } } });
  control.addEventListener("change", () => { if (!composing) { try { validate(); } catch { /* Field completion displays the error. */ } } });
  return validate;
}

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
