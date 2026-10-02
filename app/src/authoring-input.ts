/** New technical tokens follow the core's lowercase ASCII, 64-byte contract. */
export function technicalName(value: string, label = "Technical name"): string {
  const normalized = value.trim().replace(/[A-Z]/g, letter => letter.toLowerCase());
  if (!/^[a-z][a-z0-9_]{0,63}$/.test(normalized)) {
    throw new Error(`${label} must begin with a letter and use 1–64 letters, numbers or underscores.`);
  }
  return normalized;
}

export function technicalNameInput(control: HTMLInputElement): void {
  control.autocapitalize = "none";
  control.autocomplete = "off";
  control.setAttribute("autocorrect", "off");
  control.spellcheck = false;
  control.pattern = "[A-Za-z][A-Za-z0-9_]{0,63}";
}

export const technicalNameHelp = "Technical names are saved in lowercase. Use letters, numbers and underscores.";
