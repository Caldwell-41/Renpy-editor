import { preferenceError, readPreferences, subscribePreferences, updatePreferences } from "./preferences.ts";
import { requestCore } from "./bridge.ts";
import { mountPromptPreparation, type PromptActions, type PromptController } from "./prompt-ui.ts";
import { mountStudioSettings } from "./ai-settings-ui.ts";
interface SettingsContext { title: string; sdkVersion: string; resolution: { width: number; height: number }; runtime: () => void; prompts?: PromptActions }
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text = "", className = ""): HTMLElementTagNameMap[K] { const el = document.createElement(tag); el.textContent = text; el.className = className; return el; }
export function openSettings(context?: SettingsContext): void {
  if (document.querySelector('[aria-modal="true"]')) return;
  const previous = document.activeElement as HTMLElement | null;
  const background = document.querySelector<HTMLElement>(".app-shell"); if (background) background.inert = true;
  const overlay = node("div", "", "settings-overlay"); overlay.role = "dialog"; overlay.ariaModal = "true"; overlay.ariaLabel = "Settings";
  const rail = node("nav", "", "settings-rail"); rail.ariaLabel = "Settings categories";
  const header = node("header", "", "settings-header"); const close = node("button", "Close settings", "button");
  const scope=node("div","","settings-scope");scope.role="tablist";scope.ariaLabel="Settings scope";
  const application=node("button","Application","button");application.role="tab";
  const project=node("button","Current project","button");project.role="tab";project.disabled=!context;if(!context)project.title="Open a project to view its settings";
  scope.append(application,project);header.append(node("h1", "Settings"),scope,close);
  let applicationCategory="Workspace";
  const categorySelect=node("select","","settings-category-select");categorySelect.ariaLabel="Settings category";
  const categories=["Workspace","Source editor","AI providers","Keyboard shortcuts","About"];
  categories.forEach(category=>{const option=node("option",category);option.value=category;categorySelect.append(option);});
  categorySelect.addEventListener("change",()=>draw(categorySelect.value));
  application.addEventListener("click",()=>draw(applicationCategory));project.addEventListener("click",()=>draw("Current project"));
  const body = node("div", "", "settings-body");
  const content = node("section", "", "settings-content");
  const footer = node("footer", "", "settings-footer"); footer.role = "status";
  const notify = (): void => { footer.textContent = preferenceError() || "Preferences save automatically on this device."; footer.dataset.kind = preferenceError() ? "error" : "normal"; };
  const unsubscribe = subscribePreferences(notify);
  let promptController:PromptController|undefined;
  const finish = (): void => { if(promptController&&!promptController.canLeave())return;promptController?.dispose(); unsubscribe(); overlay.remove(); if (background) background.inert = false; previous?.focus(); };
  close.addEventListener("click", finish);
  function row(label: string, description: string, control: HTMLElement): void {
    const line = node("div", "", "setting-row"); const copy = node("div"); const text = node("label", label); const id = `setting-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`; text.htmlFor = id; control.id = id;control.ariaLabel=label;
    copy.append(text, node("p", description, "muted")); line.append(copy, control); content.append(line);
  }
  function select(values: [string,string][], chosen: string, change: (value:string)=>void): HTMLSelectElement { const control = node("select"); values.forEach(([value,label]) => { const o = node("option", label); o.value = value; control.append(o); }); control.value = chosen; control.addEventListener("change", () => change(control.value)); return control; }
  function segments(values:[string,string][],chosen:string,change:(value:string)=>void):HTMLElement{
    const group=node("div","","setting-segments");group.role="radiogroup";
    values.forEach(([value,label])=>{const b=node("button",label);b.role="radio";b.ariaChecked=String(value===chosen);b.tabIndex=value===chosen?0:-1;const choose=():void=>{group.querySelectorAll<HTMLButtonElement>("button").forEach(button=>{button.ariaChecked=String(button===b);button.tabIndex=button===b?0:-1;});change(value);};b.addEventListener("click",choose);b.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight"].includes(e.key))return;e.preventDefault();const buttons=[...group.querySelectorAll<HTMLButtonElement>("button")];const next=buttons[(buttons.indexOf(b)+(e.key==="ArrowRight"?1:buttons.length-1))%buttons.length]!;next.click();next.focus();});group.append(b);});return group;
  }
  function draw(category: string): void {
    if(promptController&&!promptController.canLeave())return;promptController?.dispose();promptController=undefined;
    content.replaceChildren(); const prefs = readPreferences();
    const projectScope=category==="Current project";
    if(!projectScope)applicationCategory=category;
    application.ariaSelected=String(!projectScope);project.ariaSelected=String(projectScope);
    rail.hidden=projectScope;categorySelect.hidden=projectScope;body.classList.toggle("project-settings",projectScope);categorySelect.value=category;
    rail.querySelectorAll("button").forEach(b => b.ariaCurrent = b.textContent === category ? "page" : "false");
    content.append(node("h2", category));
    if (category === "Workspace") {
      content.append(node("p", "Make room for the way you work.", "muted"), node("h3", "Display"));
      row("Theme", "Changes the editor interface, not your game.", select([["system","Follow system"],["light","Light · Paper & teal"],["dark","Dark · Charcoal & copper"]],prefs.theme,v => void updatePreferences({theme:v as typeof prefs.theme})));
      row("Interface size", "Adjust controls and text throughout Loomlight.", segments([["small","Small"],["default","Default"],["large","Large"]],prefs.density,v => void updatePreferences({density:v as typeof prefs.density})));
      const preview = node("div", "", "settings-sample"); preview.append(node("span", "Preview"), node("button", "Sample button", "button"), node("span", "Your workspace, at the selected size.")); content.append(preview, node("h3", "Workspace layout"));
      const remember = node("input"); remember.type = "checkbox"; remember.checked = prefs.rememberLayout; remember.addEventListener("change", () => void updatePreferences({rememberLayout:remember.checked})); row("Remember panel layout", "Restore panel sizes and visibility when you reopen Loomlight.", remember);
      const reset = node("button", "Reset layout", "button"); reset.addEventListener("click", () => { void updatePreferences({layouts:{}}); window.dispatchEvent(new Event("loomlight-reset-layout")); }); row("Restore default layout", "Your project content and appearance preferences stay unchanged.", reset);
      content.append(node("h3","Source text"));row("Source text size","Adjust code text independently of the interface.",select([10,12,14,16,18,20,24].map(n=>[String(n),`${n} px`]),String(prefs.sourceFontSize),v=>void updatePreferences({sourceFontSize:Number(v)})));content.append(node("pre",'label start:\n    scene bg apartment_night\n    "Another long day…"',"source-sample"));
      const source=node("button","More Source editor preferences","text-button");source.addEventListener("click",()=>draw("Source editor"));content.append(source);
    } else if (category === "AI providers") {
      mountStudioSettings(content,footer);
    } else if (category === "Source editor") {
      row("Text size", "Change code text without changing the rest of the interface.", select([10,12,14,16,18,20,24].map(n => [String(n), `${n} px`]),String(prefs.sourceFontSize),v => void updatePreferences({sourceFontSize:Number(v)})));
      content.append(node("pre", 'label start:\n    scene bg apartment_night\n    "Another long day…"', "source-sample"));
      content.append(node("p", "Source changes stay as session drafts until you explicitly save them.", "muted"));
    } else if (category === "Keyboard shortcuts") {
      const search = node("input"); search.type = "search"; search.placeholder = "Find a shortcut…"; search.ariaLabel = "Find a shortcut"; content.append(search);
      const mod = /Mac/.test(navigator.platform) ? "⌘" : "Ctrl";
      const rows = [[`${mod}+S`, "Save — current Source draft or project changes"], [`${mod}+Enter`, "Commit the current dialogue"], [`Shift+${mod}+Enter`, "Commit and continue dialogue"], [`${mod}+F`, "Find in Source"], ["Escape", "Dismiss a dialog"], ["Tab / Shift+Tab", "Move between controls"], ["Arrow keys", "Adjust focused sliders and graph controls"]];
      const list = node("div"); content.append(list); const filter = (): void => { list.replaceChildren(); rows.filter(r => r.join(" ").toLowerCase().includes(search.value.toLowerCase())).forEach(([key,description]) => { const r = node("div", "", "setting-row"); r.append(node("span", description),node("kbd",key)); list.append(r); }); }; search.addEventListener("input",filter); filter();
    } else if (category === "Current project" && context) {
      content.append(node("p",context.title,"muted"));
      row("Ren’Py SDK", "Pinned runtime version for this project.",node("span",context.sdkVersion));
      row("Game resolution", "Read-only here; this is independent of interface size.",node("span",`${context.resolution.width} × ${context.resolution.height}`));
      const manage=node("button","Manage SDK & execution trust","button"); manage.addEventListener("click",()=>{finish();context.runtime();});
      row("Preview & Run", "Inspect SDK selection and session trust using the existing runtime controls.",manage);
      if(context.prompts)promptController=mountPromptPreparation(content,context.prompts);
    } else if (category === "About") {
      const version=node("p","Loading version…"); content.append(version);
      void requestCore<{applicationVersion:string;protocolVersion:number}>("system.version").then(r=>{ if(overlay.isConnected) version.textContent = r.ok ? `Loomlight ${r.value.applicationVersion}` : "Version unavailable"; }).catch(()=>version.textContent="Version unavailable");
      const copy=node("button","Copy basic diagnostics","button"); copy.addEventListener("click",()=>{ void navigator.clipboard.writeText(`${version.textContent}\nTheme: ${readPreferences().theme}\nInterface: ${readPreferences().density}`).then(()=>{footer.textContent="Basic diagnostics copied. No project content or file paths included.";}).catch(()=>{footer.textContent="Clipboard unavailable.";}); }); content.append(copy,node("p","Basic diagnostics exclude project content and file paths.","muted"));
    }
  }
  categories.forEach(category => { const b=node("button",category,"settings-category"); b.disabled=category==="Current project" && !context; if(b.disabled)b.title="Open a project to view its settings"; b.addEventListener("click",()=>draw(category)); rail.append(b); });
  overlay.addEventListener("keydown",event=>{
    if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="s"&&promptController){event.preventDefault();event.stopPropagation();content.querySelector<HTMLButtonElement>(".prompt-actions .primary")?.click();return;}
    if(event.key==="Escape"){event.preventDefault();finish();}
    if(event.key!=="Tab")return;
    const controls=[...overlay.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter(n=>!n.closest('[hidden]')); const first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  });
  body.append(categorySelect,rail,content); overlay.append(header,body,footer); document.body.append(overlay); draw("Workspace");notify();close.focus();
}
