// The Story Combined beat editors (`story-revamp` / `combined-v1`; UI.md "Beat editors").
// Each editor builds its fields and reads a beat payload; the Story controller in
// scene-ui.ts owns its draft, preview, Commit and Cancel. Backgrounds and expressions use
// picker sheets, short choices use switches, speakers and characters use portrait lists.
// Set variable keeps #96's equation row; screen beats keep their catalog picker.
import { validateField } from "./authoring-input.ts";
import type { BeatPayload, PlacementRef, SceneActions, SceneWorkspace, TransitionRef } from "./scene-ui.ts";
import type { ScreenRevisions, ScreenTargetBinding } from "./screen-contracts.ts";
import { buildAssignmentEditor, type ValidateAssignment } from "./story-arithmetic-editor.ts";
import type { NewVariable } from "./story-condition-editor.ts";
import { backingSelect, element, field, focusFirst, friendlyError, labelled, listChoice, personList, pictureField, refuseChoice, requireChoice, segmented, unavailable, type ChoiceItem, type Thumbnail } from "./story-editor-controls.ts";

/** Beat kind names, as Story Combined v1 names them everywhere: titles, Add a beat, Tracks and Undo. */
export const beatLabels: Record<BeatPayload["type"], string> = {
  background: "Background",
  showCharacter: "Show character",
  hideCharacter: "Hide character",
  showScreen: "Show screen",
  callScreen: "Call screen",
  hideScreen: "Hide screen",
  changeAppearance: "Change appearance",
  placement: "Move character",
  dialogue: "Dialogue",
  narration: "Narration",
  playMusic: "Play music",
  stopMusic: "Stop music",
  playSfx: "Sound effect",
  transition: "Transition",
  setVariable: "Set variable",
  choice: "Choice",
  jump: "Jump",
  call: "Call scene",
  repeatChoice: "Repeat this Choice",
  return: "Return",
  customCode: "Custom Code",
};

/** What an editor keeps outside its controls, such as a Choice's option rows, for draft-step Undo. */
export interface EditorInternals { readonly capture: () => unknown; readonly restore: (saved: unknown) => void }
export interface BeatEditor {
  readonly host: HTMLElement;
  readonly controls: readonly HTMLElement[];
  readonly primary: HTMLElement;
  readonly secondary?: HTMLElement;
  readonly read: () => BeatPayload;
  readonly focus: () => void;
  readonly internals?: EditorInternals;
  /** Redraws what the editor shows from the current scene, such as a Choice's option beats. */
  readonly refresh?: () => void;
}
/** What every beat editor needs from Story. */
export interface EditorContext {
  readonly model: SceneWorkspace;
  /** An existing beat, rather than a new one. */
  readonly existing: boolean;
  readonly actions?: SceneActions;
  readonly validate?: ValidateAssignment;
  readonly thumbnail: Thumbnail;
  /** Shows a payload on the stage while a picker sheet points at a picture; undefined stops. */
  readonly preview?: (payload?: BeatPayload) => void;
  /** "+ New variable…" in a rule builder's variable list. */
  readonly newVariable?: NewVariable;
}

export function requiredText(control: HTMLInputElement, name: string): string { if (!control.value.trim()) { control.focus(); throw new Error(`${name} is required.`); } return control.value.trim(); }

const transitionItems = (none = true): ChoiceItem[] => [...none ? [{ value: "none", label: "None" }] : [], { value: "dissolve", label: "Dissolve" }, { value: "fade", label: "Fade" }];
const placementItems: ChoiceItem[] = [{ value: "left", label: "Left" }, { value: "centre", label: "Centre" }, { value: "right", label: "Right" }];
/** Speakers and characters, with the portrait of their default or first appearance. */
export function characterItems(model: SceneWorkspace): ChoiceItem[] {
  return model.authoring.characters.map(character => {
    const appearance = model.authoring.appearances.find(item => item.id === character.defaultAppearanceId) ?? model.authoring.appearances.find(item => item.characterId === character.id);
    return { value: character.id, label: character.displayName, ...(character.dialogueColor ? { ring: character.dialogueColor } : {}), ...(appearance?.assetId ? { asset: appearance.assetId } : {}) };
  });
}
export const narrationItem: ChoiceItem = { value: "narration", label: "Narration · no speaker", icon: "narration" };

export function buildBeatEditor(payload: BeatPayload, context: EditorContext): BeatEditor {
  const { model } = context;
  if (payload.type === "setVariable") return buildAssignmentEditor(model, payload, context.validate);
  if (payload.type === "showScreen" || payload.type === "hideScreen" || payload.type === "callScreen") return buildScreenBeatEditor(payload, context.existing, context.actions);
  const host = element("div", "beat-fields story-fields"); const controls: HTMLElement[] = [];
  const hint = (text: string): HTMLElement => element("p", "story-field-hint", text);
  const choiceField = (label: string, select: HTMLSelectElement, control: HTMLElement): HTMLElement => { controls.push(select); const node = field(label, control, select); host.append(node); return node; };
  const transition = (none = true): HTMLSelectElement => {
    const select = backingSelect("Transition", transitionItems(none), "transition" in payload ? payload.transition : none ? "none" : "dissolve");
    choiceField("Transition", select, segmented(select, transitionItems(none))); return select;
  };
  const placement = (selected: string): HTMLSelectElement => { const select = backingSelect("Position", placementItems, selected); choiceField("Position", select, segmented(select, placementItems)); return select; };
  const character = (selected: string, label = "Character"): HTMLSelectElement => { const select = backingSelect(label, characterItems(model), selected); choiceField(label, select, personList(select, characterItems(model), context.thumbnail)); return select; };
  const assets = (kind: "background" | "music" | "sfx"): ChoiceItem[] => model.authoring.assets.filter(item => item.kind === kind && item.status === "available").map(item => ({ value: item.id, label: item.displayName, ...(kind === "background" ? { asset: item.id } : {}) }));
  const name = (id: string): string => model.authoring.characters.find(item => item.id === id)?.displayName ?? "this character";
  // An expression picture row; its sheet offers the chosen character's appearances.
  const expression = (who: HTMLSelectElement, selected: string, previewOf: (appearanceId: string) => BeatPayload): HTMLSelectElement => {
    const all: ChoiceItem[] = model.authoring.appearances.map(item => ({ value: item.id, label: item.label, ...(item.assetId ? { asset: item.assetId } : {}) }));
    const select = backingSelect("Expression", all, selected);
    const mine = (): ChoiceItem[] => all.filter(item => model.authoring.appearances.find(appearance => appearance.id === item.value)?.characterId === who.value);
    const row = pictureField(select, {
      kind: "expression", get items() { return mine(); }, thumbnail: context.thumbnail, search: "Search expressions", empty: "No expression chosen",
      title: () => `Choose ${name(who.value)}'s expression`, note: () => `${mine().length} expression${mine().length === 1 ? "" : "s"} for ${name(who.value)}`,
      preview: value => context.preview?.(value === undefined ? undefined : previewOf(value)),
    });
    who.addEventListener("change", () => select.dispatchEvent(new Event("story-redraw")));
    choiceField("Expression", select, row); return select;
  };
  const appearanceOf = (who: HTMLSelectElement, select: HTMLSelectElement): string => {
    const id = requireChoice(select, "Choose an expression.");
    if (model.authoring.appearances.find(item => item.id === id)?.characterId !== who.value) refuseChoice(select, `Choose one of ${name(who.value)}'s expressions.`);
    return id;
  };
  let read: () => BeatPayload, primary: HTMLElement | undefined;
  switch (payload.type) {
    case "background": {
      const asset = backingSelect("Background", assets("background"), payload.assetId);
      choiceField("Background", asset, pictureField(asset, {
        kind: "background", items: assets("background"), thumbnail: context.thumbnail, search: "Search backgrounds", empty: "No background chosen",
        title: () => "Choose a background", note: () => "Clears characters from the stage",
        preview: value => context.preview?.(value === undefined ? undefined : { type: "background", assetId: value, transition: transitionSelect.value as TransitionRef }),
      }));
      const transitionSelect = transition();
      read = () => ({ type: "background", assetId: requireChoice(asset), transition: transitionSelect.value as TransitionRef }); break;
    }
    case "showCharacter": {
      const who = character(payload.characterId); let position: HTMLSelectElement, fade: HTMLSelectElement;
      const look = expression(who, payload.appearanceId, appearanceId => ({ type: "showCharacter", characterId: who.value, appearanceId, placement: position.value as PlacementRef, transition: fade.value as TransitionRef }));
      position = placement(payload.placement); fade = transition();
      read = () => ({ type: "showCharacter", characterId: requireChoice(who), appearanceId: appearanceOf(who, look), placement: position.value as PlacementRef, transition: fade.value as TransitionRef }); break;
    }
    case "hideCharacter": { const who = character(payload.characterId), fade = transition(); read = () => ({ type: "hideCharacter", characterId: requireChoice(who), transition: fade.value as TransitionRef }); break; }
    case "changeAppearance": {
      const who = character(payload.characterId); let fade: HTMLSelectElement;
      const look = expression(who, payload.appearanceId, appearanceId => ({ type: "changeAppearance", characterId: who.value, appearanceId, transition: fade.value as TransitionRef }));
      fade = transition();
      read = () => ({ type: "changeAppearance", characterId: requireChoice(who), appearanceId: appearanceOf(who, look), transition: fade.value as TransitionRef }); break;
    }
    case "placement": { const who = character(payload.characterId), position = placement(payload.placement); read = () => ({ type: "placement", characterId: requireChoice(who), placement: position.value as PlacementRef }); break; }
    case "dialogue": case "narration": {
      // Narration is its own mode in the speaker list, not a fake Character.
      const items = [...characterItems(model), narrationItem], speaker = backingSelect("Speaker", items, payload.type === "narration" ? "narration" : payload.characterId);
      choiceField("Speaker", speaker, personList(speaker, items, context.thumbnail));
      const text = element("textarea"); text.value = payload.text; text.rows = 4; controls.push(text); primary = text;
      const words = element("label", "field compact-field story-prose"); const caption = element("span", "story-visually-hidden");
      const show = (): void => { caption.textContent = speaker.value === "narration" ? "Narration" : "Dialogue"; text.setAttribute("aria-label", caption.textContent); };
      speaker.addEventListener("change", show); show(); words.append(caption, text);
      host.append(words, hint("Shift+Cmd/Ctrl+Enter: next line · Enter: line break in this text"));
      read = () => speaker.value === "narration" ? { type: "narration", text: text.value } : { type: "dialogue", characterId: requireChoice(speaker), text: text.value }; break;
    }
    case "playMusic": case "playSfx": {
      const kind = payload.type === "playMusic" ? "music" : "sfx", label = kind === "music" ? "Music" : "Sound effect", items = assets(kind);
      const asset = backingSelect(label, items, payload.assetId); choiceField(label, asset, listChoice(asset, items, payload.type));
      host.append(hint(kind === "music" ? "Loops until stopped or replaced. Selecting it never plays it; use the audition in In effect." : "Plays once. Selecting it never plays it; use the audition in In effect."));
      read = () => ({ type: payload.type, assetId: requireChoice(asset) }) as BeatPayload; break;
    }
    case "stopMusic": host.append(hint("Stops the current music.")); read = () => ({ type: "stopMusic" }); break;
    case "transition": { const fade = transition(false); host.append(hint("Applies to the next visual change.")); read = () => ({ type: "transition", transition: fade.value as "dissolve" | "fade" }); break; }
    case "jump": case "call": {
      const label = payload.type === "call" ? "Call destination Scene" : "Destination Scene";
      // A plain select of scenes; a missing scene stays as an unavailable row until replaced.
      const destination = backingSelect(label, model.scenes.map(scene => ({ value: scene.id, label: scene.displayName })), payload.sceneId);
      destination.hidden = false; destination.tabIndex = 0; destination.className = ""; controls.push(destination);
      host.append(labelled(label, destination));
      const required = (): string => { if (unavailable(destination)) { destination.focus(); throw new Error("Select an available item first."); } return destination.value; };
      const validate = validateField(destination, () => { required(); });
      host.append(hint(payload.type === "call" ? "Returns to the next beat. The editor preview does not run the called scene." : "Leaves this scene and does not return."));
      read = payload.type === "call" ? () => { validate(); return { type: "call", sceneId: required(), returnLabel: payload.returnLabel }; } : () => ({ type: "jump", sceneId: required() }); break;
    }
    case "repeatChoice": host.append(hint("Shows its Choice again, with its prompt. Change this with the option's Then.")); read = () => payload; break;
    case "return": host.append(hint("Returns to the caller, or the main menu. Add a beat with Jump or Return in its place to change this ending.")); read = () => ({ type: "return" }); break;
    case "customCode": case "choice": read = () => payload; break;
  }
  // Writing goes to the text; otherwise the first field to fix, or the first control.
  return { host, controls, primary: primary ?? controls.at(-1) ?? host, read: read!, focus: () => { const invalid = host.querySelector<HTMLElement>('[aria-invalid="true"]:not([hidden])'); if (!invalid && primary) primary.focus(); else focusFirst(host); } };
}


function buildScreenBeatEditor(payload: Extract<BeatPayload, { type: "showScreen" | "hideScreen" | "callScreen" }>, existing: boolean, actions?: SceneActions): BeatEditor {
  const calling=payload.type==="callScreen",kind=calling?"dialog":"panel",caption=calling?"Dialog":"Panel";
  const intent = { ...payload.target }, originalRevisions = payload.revisions ? { ...payload.revisions } : undefined;
  const host = document.createElement("div"); host.className = "beat-fields story-screen-fields";
  const picker = document.createElement("select"); picker.setAttribute("aria-label", `${caption} screen`); picker.disabled = true;
  const purpose = document.createElement("p"); purpose.textContent = calling ? "Call waits for Finish interaction. Dialog defaults use Close and Escape; outside clicks keep it open. Scene Call and Story Return are separate operations." : payload.type === "showScreen"
    ? "Show keeps the panel open while dialogue continues. Hide, Close and game Escape dismiss it. Outside clicks keep it open."
    : "Hide removes the panel at this point in the story. Dialogue continues.";
  const message = document.createElement("p"); message.role = "status"; message.setAttribute("aria-live", "polite"); message.textContent = `Loading ${kind} screens…`;
  host.append(labelled(`${caption} screen`, picker), purpose, message);
  const secondary=document.createElement("details"),summary=document.createElement("summary");summary.textContent="Source and effects";
  const effects=document.createElement("p");effects.textContent="No screen Beat has been added. Source shows accepted appearance.";
  const source=document.createElement("button");source.type="button";source.className="text-button";source.textContent="View screen in Source";source.disabled=true;secondary.append(summary,effects,source);
  let captured: { target: ScreenTargetBinding; revisions: ScreenRevisions } | undefined;
  let generation = 0;
  const panels = new Map<string, ScreenTargetBinding>();
  const placeholder = (label: string) => { const option = document.createElement("option"); option.value = intent.screenId; option.textContent = label; option.dataset.unavailable = "true"; picker.replaceChildren(option); };
  placeholder(intent.sourceName || `Loading ${kind}s…`);
  const fail = (error: unknown) => { captured = undefined;source.disabled=true;source.onclick=null;effects.textContent="No available accepted screen source for this selection."; message.textContent = `${friendlyError(error, `${caption} target unavailable.`)} Choose an available ${kind} explicitly. Input retained.`; };
  const resolve = async () => {
    const run = ++generation; captured = undefined;source.disabled=true;source.onclick=null;
    const binding = panels.get(picker.value);
    if (!binding || !actions?.resolveScreenTarget) { fail(Error(`${caption} target unavailable.`)); return; }
    message.textContent = `Checking ${kind}…`;
    try {
      const resolved = await actions.resolveScreenTarget({ ...binding });
      if (run !== generation || actions.current?.() === false) return;
      if (resolved.kind !== kind || resolved.binding.screenId !== binding.screenId || resolved.binding.sourceName !== binding.sourceName) throw Error(`${caption} identity changed.`);
      if(calling && (!resolved.blocking || resolved.effects.unknown)) throw Error("Call needs a blocking Dialog with known interaction effects.");
      effects.textContent=resolved.effects.unknown ? "Effects unknown. Review accepted Source before play." : resolved.effects.finishesInteraction ? "Accepted Return() can finish this dialog. Normal play owns continuation." : "Accepted panel effects are qualified.";
      source.disabled=!actions.viewSource;source.onclick=()=>actions.viewSource?.(resolved.path,undefined,undefined,resolved.revisions.source);
      captured = { target: { ...resolved.binding }, revisions: { ...resolved.revisions } };
      message.textContent = resolved.effects.unknown ? "Some screen effects are unknown. Review Source and effects before play." : `${caption} ready.`;
    } catch (error) { if (run === generation) fail(error); }
  };
  picker.addEventListener("change", () => { void resolve(); });
  void (async () => {
    try {
      if (!actions?.screenCatalog || !actions.resolveScreenTarget) throw Error(`${caption} screens are unavailable in this workspace.`);
      const catalog = await actions.screenCatalog();
      if (actions.current?.() === false) return;
      const owned = catalog.owned.filter(screen => screen.kind === kind && screen.resolved);
      picker.replaceChildren();
      for (const screen of owned) {
        const option = document.createElement("option"); option.value = screen.id; option.textContent = screen.name; picker.append(option);
        panels.set(screen.id, { screenId: screen.id, sourceName: screen.name });
      }
      const match = owned.find(screen => screen.id === intent.screenId && screen.name === intent.sourceName);
      if (intent.screenId && !match) {
        const option = document.createElement("option"); option.value = ""; option.textContent = `${intent.sourceName} · Unavailable`; option.dataset.unavailable = "true"; picker.prepend(option); picker.value = "";
        fail(Error(`The original ${kind} is missing or renamed.`));
      } else if (!owned.length) { placeholder(`No available ${caption} screens`); fail(Error(`Create a ${caption} in Screens first.`)); }
      else if (existing) {
        picker.value = intent.screenId;
        if (!originalRevisions) fail(Error("The original target is unresolved."));
        else if (match?.sourceRevision !== originalRevisions.source) fail(Error(`The ${kind} changed after this Beat was loaded.`));
        else { captured = { target: { ...intent }, revisions: originalRevisions }; message.textContent = `${caption} ready.`; }
      } else { if (match) picker.value = match.id; await resolve(); }
      picker.disabled = !owned.length;
    } catch (error) { fail(error); }
  })();
  return { host, secondary:existing?undefined:secondary, controls: [picker], primary: picker, focus: () => picker.focus(), read: () => {
    if (!captured || picker.selectedOptions[0]?.dataset.unavailable === "true") throw Error(message.textContent || `Select an available ${caption} first.`);
    return { type: payload.type, target: { ...captured.target }, revisions: { ...captured.revisions } };
  } };
}

export function defaultPayload(type: BeatPayload["type"], model: SceneWorkspace, screenHint?: ScreenTargetBinding): BeatPayload {
  const characterId = model.authoring.characters[0]?.id ?? ""; const appearanceId = model.authoring.appearances.find((item) => item.characterId === characterId)?.id ?? "";
  switch (type) {
    case "background": return { type, assetId: model.authoring.assets.find((item) => item.kind === "background")?.id ?? "", transition: "none" };
    case "showCharacter": return { type, characterId, appearanceId, placement: "centre", transition: "none" };
    case "hideCharacter": return { type, characterId, transition: "none" };
    case "showScreen": case "hideScreen": case "callScreen": return { type, target: screenHint ? { ...screenHint } : { screenId: "", sourceName: "" } };
    case "changeAppearance": return { type, characterId, appearanceId, transition: "none" };
    case "placement": return { type, characterId, placement: "centre" };
    case "dialogue": return { type, characterId, text: "" };
    case "narration": return { type, text: "" };
    case "playMusic": return { type, assetId: model.authoring.assets.find((item) => item.kind === "music")?.id ?? "" };
    case "stopMusic": return { type };
    case "playSfx": return { type, assetId: model.authoring.assets.find((item) => item.kind === "sfx")?.id ?? "" };
    case "transition": return { type, transition: "dissolve" };
    case "setVariable": { const variable = model.authoring.variables[0]; return { type, variableId: variable?.id ?? "", value: variable?.defaultValue ?? "" }; }
    case "choice": return { type, pickedPolicy: "showNormally", options: [{ text: "" }] };
    case "jump": return { type, sceneId: model.scenes[0]?.id ?? "" };
    case "call": return { type, sceneId: model.scenes[0]?.id ?? "", returnLabel: null };
    case "repeatChoice": return { type };
    case "return": return { type };
    case "customCode": return { type, source: "", reason: "Protected source" };
  }
}
