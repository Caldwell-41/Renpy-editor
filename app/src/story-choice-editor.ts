// The Choice editor (UI.md "Choices"; `story-revamp` / `combined-v1` and
// `story-combined-editor` / `replace-v2`). Options are numbered blocks in their arm
// colours. The prompt, captions, order, Only when, If false and Picked options are the
// Choice's beat draft; option identity is the option's id, so reordering moves each
// option with its beats. Each block also shows the option's beats and its Then ending,
// read from the current scene: those edit other beats, so they act at once through the
// Story controller and never enter this draft.
import { validateField } from "./authoring-input.ts";
import type { BeatPayload, ChoiceOption, ChoicePrompt, Condition, PickedPolicy, SceneBeat, SceneDocument } from "./scene-ui.ts";
import type { BeatEditor, EditorContext } from "./story-beat-editors.ts";
import { characterItems, narrationItem, requiredText } from "./story-beat-editors.ts";
import { buildRuleBuilder, type RuleBuilder } from "./story-condition-editor.ts";
import { backingSelect, button, dropdownKeys, element, field, focusFirst, iconButton, openSheet, personList, segmented, type ChoiceItem } from "./story-editor-controls.ts";
import { storyIcon } from "./story-icons.ts";
import { armOf, bodyOf, nodeBeats } from "./story-tracks.ts";

type Choice = Extract<BeatPayload, { type: "choice" }>;
/** What Then sets an option's ending to. */
export type Ending = { readonly type: "continue" } | { readonly type: "jump"; readonly sceneId: string } | { readonly type: "repeatChoice" } | { readonly type: "return" };
/** What the Choice editor needs from the Story controller. */
export interface ChoiceHost {
  /** The shown scene, its beat numbers and whether Story may change it. Undefined when the Choice is gone. */
  readonly structure: () => { readonly scene: SceneDocument; readonly numbers: ReadonlyMap<string, string>; readonly locked: boolean } | undefined;
  readonly beatName: (beat: SceneBeat) => string;
  readonly beatSummary: (beat: SceneBeat) => string;
  readonly sceneName: (sceneId: string) => string;
  /** The beat number the story continues at after the Choice, if any. */
  readonly continuation: () => string | undefined;
  readonly select: (beatId: string) => void;
  /** Opens an option in the Branch path and selects its first beat. */
  readonly openOption: (optionId: string) => void;
  /** Opens Add a beat for an option, before its ending. */
  readonly addBeat: (optionId: string, opener: HTMLElement) => void;
  readonly setEnding: (optionId: string, ending: Ending) => void;
  readonly viewSource: (beat: SceneBeat) => void;
  readonly openScene: (sceneId: string) => void;
  /** Marks an option's button on the stage while the author points at or focuses its block. */
  readonly markStage: (optionId: string | undefined) => void;
}

const endings = [
  { type: "continue", label: "Continue after the Choice", icon: "continue" },
  { type: "jump", label: "Go to a scene", icon: "jump", detail: "Jump. Does not come back" },
  { type: "repeatChoice", label: "Repeat this Choice", icon: "repeatChoice", detail: "Shows the menu and prompt again" },
  { type: "return", label: "Return", icon: "return", detail: "To the caller, or the main menu" },
] as const;
const pickedItems: ChoiceItem[] = [{ value: "showNormally", label: "Show normally" }, { value: "markPicked", label: "Mark picked" }, { value: "hidePicked", label: "Hide picked" }];
const policyItems: ChoiceItem[] = [{ value: "hide", label: "Hide" }, { value: "showDisabled", label: "Show disabled" }];

/** One option block's state. `key` is stable for the editor's life; `id` is the option's identity in source. */
interface OptionState { readonly key: number; readonly id?: string; text: string; policy: "hide" | "showDisabled"; guardOpen: boolean; readonly builder: RuleBuilder }
interface Saved { readonly prompt: boolean; readonly speaker: string; readonly promptText: string; readonly picked: string; readonly pickedChanged: boolean; readonly options: readonly { readonly key: number; readonly id?: string; readonly text: string; readonly policy: "hide" | "showDisabled"; readonly guardOpen: boolean; readonly builder: unknown }[] }

export function buildChoiceEditor(payload: Choice, context: EditorContext, choice: ChoiceHost): BeatEditor {
  const { model } = context, variables = model.authoring.variables;
  const host = element("div", "beat-fields story-fields story-choice-editor");
  // The prompt: narration or a Character line shown with the options. Empty text is no prompt.
  let hasPrompt = !!payload.prompt;
  const speakerItems = [...characterItems(model), narrationItem];
  const speaker = backingSelect("Prompt speaker", speakerItems, payload.prompt?.type === "dialogue" ? payload.prompt.characterId : "narration");
  const promptText = element("input"); promptText.type = "text"; promptText.value = payload.prompt?.text ?? ""; promptText.setAttribute("aria-label", "Prompt text"); promptText.placeholder = "e.g. Where do you want to go?";
  const promptRow = element("div", "story-prompt");
  const drawPrompt = (): void => {
    promptRow.replaceChildren();
    if (hasPrompt) { promptRow.append(field("Prompt", personList(speaker, speakerItems, context.thumbnail), speaker, promptText)); return; }
    const empty = element("div", "story-guard story-prompt-empty"); empty.append(storyIcon("dialogue"), element("span", "story-guard-text", "No prompt with the options"));
    const add = button("+ Prompt", "button secondary", () => { hasPrompt = true; drawPrompt(); promptText.focus(); host.dispatchEvent(new Event("change", { bubbles: true })); });
    add.setAttribute("aria-label", "Add a prompt shown with the options"); empty.append(add); promptRow.append(empty);
  };
  drawPrompt(); host.append(promptRow);

  const list = element("div", "story-options");
  let keys = 0;
  const original = (id?: string): ChoiceOption | undefined => id === undefined ? undefined : payload.options.find(option => option.id === id);
  const newOption = (option: ChoiceOption, key = ++keys): OptionState => ({
    key, ...(option.id ? { id: option.id } : {}), text: option.text, policy: option.unavailablePolicy ?? "hide", guardOpen: false,
    builder: buildRuleBuilder(variables, option.condition, { keyword: "if", label: "Only when", empty: "Always available", required: false, caption: option.condition?.status === "unknown" ? option.condition.source : undefined, source: () => { const beat = choice.structure()?.scene.beats.find(item => item.id === option.id); if (beat) choice.viewSource(beat); } }),
  });
  let options: OptionState[] = payload.options.map(option => newOption(option));
  if (!options.length) options.push(newOption({ text: "" }));
  // Draws one option's beats, Then row and destination from the current scene.
  const structureSlots = new Map<number, HTMLElement>();
  const drawStructure = (option: OptionState, index: number): void => {
    const slot = structureSlots.get(option.key); if (!slot) return;
    slot.replaceChildren();
    const shown = choice.structure();
    const header = option.id ? shown?.scene.beats.find(beat => beat.id === option.id) : undefined, groupId = header?.conditionalBranch?.groupId;
    if (!shown || !option.id || !header || groupId === undefined) { slot.append(element("p", "story-field-hint", option.id ? "This option's beats are no longer in source." : "Starts empty. Continue after the Choice.")); return; }
    const { scene, numbers, locked } = shown, body = { type: "branch" as const, groupId, branchId: option.id }, info = bodyOf(scene, body);
    const nodes = nodeBeats(scene, body), ending = info?.ending;
    const endedBy = ending?.type === "ends" ? scene.beats.find(beat => beat.id === ending.beatId) : undefined;
    const explicit = endedBy && ["jump", "repeatChoice", "return"].includes(endedBy.payload.type) ? endedBy : undefined;
    const code = endedBy?.payload.type === "customCode" ? endedBy : undefined;
    // The option's own beats, before its ending. The Custom Code beat that may leave the option keeps its row and note.
    const beats = nodes.filter(beat => beat !== explicit && beat !== code), last = beats.at(-1);
    const leaves = ending?.type === "unknown" && last?.payload.type === "customCode" ? last : undefined;
    const rows = beats.length > 3 ? [...beats.slice(0, leaves ? 2 : 3), ...leaves ? [leaves] : []] : beats;
    if (rows.length) {
      const group = element("div", "story-option-beats"); group.role = "group"; group.setAttribute("aria-label", `Option ${index + 1} beats`);
      for (const beat of rows) {
        const kind = beat.conditionalBranch ? "condition" : beat.payload.type, number = numbers.get(beat.id) ?? "";
        const text = beat.payload.type === "dialogue" || beat.payload.type === "narration" ? choice.beatSummary(beat) : beat.payload.type === "customCode" ? `Custom Code · ${beat.payload.source.trim()}` : `${choice.beatName(beat)} · ${choice.beatSummary(beat)}`;
        const row = button("", "story-option-beat", () => choice.select(beat.id)); row.setAttribute("aria-label", `Edit ${number} ${choice.beatName(beat)}: ${choice.beatSummary(beat)}`);
        row.append(storyIcon(kind), element("span", "story-option-beat-number", number), element("span", "story-option-beat-text", text)); group.append(row);
        if (beat === leaves) group.append(element("p", "story-warn story-beat-note", "Ending unknown: Custom Code can leave this option"));
      }
      if (beats.length > rows.length) group.append(button(`+${beats.length - rows.length} more · Show`, "story-option-more", () => choice.openOption(option.id!)));
      slot.append(group);
    }
    const then = element("div", "story-then"); then.append(element("span", "story-then-label", "Then"));
    const add = button("+ Beat", "button secondary story-then-add", () => choice.addBeat(option.id!, add)); add.disabled = locked;
    add.setAttribute("aria-label", add.title = `Add a beat to option ${index + 1}${explicit || code ? ", before its ending" : ""}`);
    add.dataset.beatOpener = `option:${option.id}`;
    if (code || (endedBy && !explicit)) {
      // Custom Code, or a nested condition or Choice, ends this option: its ending is written there, not here.
      then.classList.add("story-then-replaced");
      const text = element("div", "story-then-text");
      if (code?.payload.type === "customCode") {
        const line = element("p", "story-ending"); line.append("Ends with Custom Code: ", element("code", "", code.payload.source.trim().replace(/^\$\s*/, "")));
        text.append(line, button("Edit in Source", "story-link", () => choice.viewSource(code)));
      } else text.append(element("p", "story-ending", `Ends at ${numbers.get(endedBy!.id) ?? ""} ${choice.beatName(endedBy!)}`));
      then.append(text, add); slot.append(then); return;
    }
    const current = explicit ? endings.find(item => item.type === explicit.payload.type)! : endings[0];
    const menu = element("details", "story-dropdown story-outcome"), summary = element("summary", "story-person"); summary.dataset.control = "";
    summary.append(storyIcon(current.icon), element("span", "story-person-name", current.label), element("span", "story-caret", "▾"));
    summary.setAttribute("aria-label", `Option ${index + 1} then: ${current.label}`);
    if (locked) { summary.setAttribute("aria-disabled", "true"); summary.addEventListener("click", event => event.preventDefault()); }
    const choices = element("div", "story-dropdown-list"); choices.role = "listbox"; choices.setAttribute("aria-label", `Option ${index + 1} then`);
    const next = choice.continuation();
    for (const item of endings) {
      const detail = item.type === "continue" ? next ? `Goes on to ${next}` : "Goes on to the end of the scene" : item.detail;
      const option_ = button("", "story-dropdown-option", () => {
        menu.open = false;
        if (item.type === current.type) { summary.focus(); return; }
        if (item.type === "jump") { pickScene(summary, index, undefined, sceneId => choice.setEnding(option.id!, { type: "jump", sceneId })); return; }
        choice.setEnding(option.id!, { type: item.type });
      });
      option_.role = "option"; option_.tabIndex = -1; option_.setAttribute("aria-selected", String(item.type === current.type)); option_.setAttribute("aria-label", `${item.label}. ${detail}`);
      const words = element("span", "story-outcome-words"); words.append(element("strong", "", item.label), element("span", "", detail));
      option_.append(storyIcon(item.icon), words); choices.append(option_);
    }
    choices.append(element("p", "story-menu-foot", `Option ${index + 1}'s beats follow below. Then changes only its ending.`));
    dropdownKeys(menu, summary, choices); menu.append(summary, choices); then.append(menu, add); slot.append(then);
    if (explicit?.payload.type === "jump") slot.append(destinationRow(index, explicit.payload.sceneId, sceneId => choice.setEnding(option.id!, { type: "jump", sceneId }), locked));
  };
  // A scene card: the scene's opening background, name and first line. It opens the scene sheet.
  const sceneItem = (scene: SceneDocument, current: SceneDocument | undefined): ChoiceItem => {
    const background = scene.beats.find(beat => !beat.owner && beat.payload.type === "background")?.payload;
    const chapter = model.chapters.find(item => item.id === scene.chapterId)?.displayName;
    return { value: scene.id, label: scene.displayName, ...(background?.type === "background" ? { asset: background.assetId } : {}), detail: scene.id === current?.id ? "This scene" : chapter ?? "" };
  };
  const pickScene = (trigger: HTMLElement, index: number, selected: string | undefined, chosen: (sceneId: string) => void): void => {
    const keep = selected ? choice.sceneName(selected) : "the current ending";
    openSheet(trigger, { kind: "scene", title: `Option ${index + 1} goes to`, search: "Search scenes", items: model.scenes.map(scene => sceneItem(scene, choice.structure()?.scene)), selected: selected ?? "", keep, thumbnail: context.thumbnail,
      hint: `Click a scene to send option ${index + 1} there. Esc keeps ${keep}.`, choose: value => { if (value !== selected) chosen(value); } });
  };
  const destinationRow = (index: number, sceneId: string, chosen: (sceneId: string) => void, locked: boolean): HTMLElement => {
    const row = element("div", "story-asset-row story-destination"); row.role = "group"; row.setAttribute("aria-label", `Option ${index + 1} goes to`);
    const target = model.scenes.find(scene => scene.id === sceneId);
    const picture = element("span", "story-thumb story-thumb-scene"); picture.setAttribute("aria-hidden", "true");
    const background = target?.beats.find(beat => !beat.owner && beat.payload.type === "background")?.payload;
    if (background?.type === "background") { const image = element("img"); image.alt = ""; picture.append(image); context.thumbnail(background.assetId, image, picture); } else picture.classList.add("story-thumb-blank");
    const firstLine = target?.beats.find(beat => !beat.owner && (beat.payload.type === "dialogue" || beat.payload.type === "narration") && beat.payload.text.trim())?.payload;
    const text = element("span", "story-asset-text"); text.append(element("strong", "", target?.displayName ?? "Missing scene"), element("span", "", firstLine && "text" in firstLine ? `“${firstLine.text}”` : "No lines yet"));
    const pick = button("", "story-destination-pick", () => pickScene(pick, index, sceneId, chosen)); pick.disabled = locked;
    pick.setAttribute("aria-label", `Change where option ${index + 1} goes: ${target?.displayName ?? "missing scene"}`); pick.title = "Choose a scene";
    pick.append(picture, text, element("span", "story-caret", "▾"));
    const open = iconButton("open", `Open ${target?.displayName ?? "destination"}`, () => choice.openScene(sceneId)); open.disabled = !target;
    row.append(pick, open); return row;
  };

  const twins = (index: number): number => options.findIndex((other, at) => at !== index && other.text.trim() && other.text.trim() === options[index]!.text.trim());
  const drawOptions = (): void => {
    const active = document.activeElement instanceof HTMLElement && list.contains(document.activeElement) ? document.activeElement.dataset.choiceFocus : undefined;
    list.replaceChildren(); structureSlots.clear();
    options.forEach((option, index) => list.append(optionBlock(option, index)));
    if (active) list.querySelector<HTMLElement>(`[data-choice-focus="${active}"]`)?.focus();
  };
  const changed = (): void => { host.dispatchEvent(new Event("change", { bubbles: true })); };
  const move = (index: number, step: -1 | 1): void => {
    const to = index + step; if (to < 0 || to >= options.length) return;
    const moved = options[index]!; options.splice(index, 1); options.splice(to, 0, moved); drawOptions(); changed();
    const direction = to === 0 ? "down" : to === options.length - 1 ? "up" : step < 0 ? "up" : "down";
    list.querySelector<HTMLElement>(`[data-choice-focus="move-${moved.key}-${direction}"]`)?.focus();
  };
  const optionBlock = (option: OptionState, index: number): HTMLElement => {
    const block = element("div", "story-option"); block.role = "group"; block.setAttribute("aria-label", `Option ${index + 1}`); block.dataset.choiceIndex = String(index);
    if (option.id) block.dataset.optionId = option.id;
    const shown = choice.structure(), header = option.id ? shown?.scene.beats.find(beat => beat.id === option.id) : undefined;
    block.dataset.arm = String(shown && header?.conditionalBranch ? armOf(shown.scene, { type: "branch", groupId: header.conditionalBranch.groupId, branchId: header.id }) : (index % 4) + 1);
    const top = element("div", "story-option-top");
    const text = element("input"); text.type = "text"; text.value = option.text; text.setAttribute("aria-label", "Choice option text"); text.placeholder = "What the player can choose"; text.dataset.choiceFocus = `text-${option.key}`;
    const validate = validateField(text, () => { requiredText(text, "Choice text"); });
    text.addEventListener("input", () => { option.text = text.value; const twin = block.querySelector(".story-option-twin"); const at = twins(index); if (twin) twin.textContent = at >= 0 ? twinText(at) : ""; });
    texts.set(option.key, { text, validate });
    const up = iconButton("up", `Move option ${index + 1} up`, () => move(index, -1), "story-icon-button story-option-move"); up.disabled = index === 0; up.dataset.choiceFocus = `move-${option.key}-up`;
    const down = iconButton("down", `Move option ${index + 1} down`, () => move(index, 1), "story-icon-button story-option-move"); down.disabled = index === options.length - 1; down.dataset.choiceFocus = `move-${option.key}-down`;
    const remove = iconButton("close", `Remove option ${index + 1}`, () => {
      options.splice(index, 1); drawOptions(); changed();
      list.querySelectorAll<HTMLInputElement>('input[aria-label="Choice option text"]')[Math.min(index, options.length - 1)]?.focus();
    }); remove.disabled = options.length === 1; if (remove.disabled) remove.title = "A Choice needs at least one option.";
    top.append(element("span", "story-option-number", String(index + 1)), text, up, down, remove); block.append(top);
    const twin = element("p", "story-option-twin", twins(index) >= 0 ? twinText(twins(index)) : ""); block.append(twin);
    const slot = element("div", "story-option-structure"); structureSlots.set(option.key, slot); block.append(slot); drawStructure(option, index);
    block.append(guardRow(option, index));
    block.addEventListener("pointerenter", () => choice.markStage(option.id));
    block.addEventListener("pointerleave", () => { if (!block.contains(document.activeElement)) choice.markStage(undefined); });
    block.addEventListener("focusin", () => choice.markStage(option.id));
    block.addEventListener("focusout", event => { if (!block.contains(event.relatedTarget as Node | null)) choice.markStage(undefined); });
    return block;
  };
  const twinText = (at: number): string => `Same text as option ${at + 1}. Still a separate option with its own picked history.`;
  const texts = new Map<number, { text: HTMLInputElement; validate: () => void }>();
  // "Always available" or "Only when …", with the rule builder on request, then If false.
  const guardRow = (option: OptionState, index: number): HTMLElement => {
    const group = element("div", "story-guard-group");
    const policy = backingSelect(`Option ${index + 1} if false`, policyItems, option.policy);
    policy.addEventListener("change", () => { option.policy = policy.value as OptionState["policy"]; });
    const whenFalse = element("div", "story-when-false"); whenFalse.append(element("span", "story-then-label", "If false"), segmented(policy, policyItems), policy);
    const builder = option.builder;
    const close = (): void => { option.guardOpen = false; draw(); group.querySelector<HTMLElement>(".story-guard > button")?.focus(); };
    const draw = (): void => {
      group.replaceChildren();
      const summary = builder.summary();
      if (option.guardOpen && builder.editable) {
        const open = element("div", "story-guard-open"); open.role = "group"; open.setAttribute("aria-label", `Option ${index + 1} only when`);
        const head = element("div", "story-guard-head");
        head.append(element("span", "story-field-label", "Only when"), button("Done", "button secondary", () => { try { builder.read(); close(); } catch { /* The builder marks the field to fix. */ } }));
        open.append(head, builder.host); group.append(open);
      } else {
        const row = element("div", "story-guard"), text = element("span", "story-guard-text");
        if (summary) { text.append("Only when ", element("strong", "", summary)); text.title = `Only when ${summary}`; } else text.textContent = "Always available";
        const toggle = button(summary ? "Edit" : "+ Condition", "button secondary", () => {
          option.guardOpen = true; draw();
          if (!builder.summary()) builder.host.querySelector<HTMLButtonElement>(".story-add-rule")?.click();
          focusFirst(builder.host);
        });
        toggle.setAttribute("aria-label", summary ? `Edit when option ${index + 1} is available` : `Add a condition to option ${index + 1}`);
        if (!builder.editable) toggle.remove();
        row.append(storyIcon("condition"), text, ...builder.editable ? [toggle] : [builder.host]); group.append(row);
      }
      if (summary) group.append(whenFalse);
    };
    builder.host.addEventListener("change", () => { if (group.isConnected && !builder.summary() && !option.guardOpen) draw(); });
    draw(); return group;
  };
  drawOptions(); host.append(list);
  const addOption = button("+ Add option", "button secondary story-add-option", () => {
    options.push(newOption({ text: "" })); drawOptions(); changed();
    list.querySelectorAll<HTMLInputElement>('input[aria-label="Choice option text"]')[options.length - 1]?.focus();
  });
  host.append(addOption);
  // Picked options: what the Choice does with options the player picked in this save.
  let pickedChanged = false;
  const picked = backingSelect("Picked options", pickedItems, payload.pickedPolicy ?? "showNormally");
  picked.addEventListener("change", () => { pickedChanged = true; });
  host.append(field("Picked options", segmented(picked, pickedItems), picked, element("p", "story-field-hint", "Uses what the player picked in this save. Marked options stay selectable.")));
  const none = element("p", "story-field-hint");
  const drawNone = (): void => { const next = choice.continuation(); none.textContent = `If no option can be picked, the story continues ${next ? `at ${next}` : "after the Choice"} and records no pick.`; };
  drawNone(); host.append(none);

  const read = (): BeatPayload => {
    if (!options.length) throw new Error("A Choice needs at least one option.");
    const prompt: ChoicePrompt | undefined = hasPrompt && promptText.value.trim() ? speaker.value === "narration" ? { type: "narration", text: promptText.value } : { type: "dialogue", characterId: speaker.value, text: promptText.value } : undefined;
    const read: ChoiceOption[] = [];
    for (const option of options) {
      texts.get(option.key)?.validate();
      let condition: Condition | undefined;
      // An incomplete rule opens its builder, so the author sees the field to fix.
      try { condition = option.builder.read(); } catch (error) { if (!option.guardOpen) { option.guardOpen = true; drawOptions(); } throw error; }
      read.push({ ...(option.id ? { id: option.id } : {}), text: texts.get(option.key)?.text.value ?? option.text, ...(condition ? { condition, ...(option.policy === "showDisabled" ? { unavailablePolicy: "showDisabled" as const } : {}) } : {}) });
    }
    return { type: "choice", ...((payload.pickedPolicy || pickedChanged) ? { pickedPolicy: picked.value as PickedPolicy } : {}), ...(prompt ? { prompt } : {}), options: read };
  };
  // Draft-step Undo restores the prompt, the option blocks and their order (ADR 0025).
  const internals = {
    capture: (): Saved => ({ prompt: hasPrompt, speaker: speaker.value, promptText: promptText.value, picked: picked.value, pickedChanged, options: options.map(option => ({ key: option.key, ...(option.id ? { id: option.id } : {}), text: option.text, policy: option.policy, guardOpen: option.guardOpen, builder: option.builder.capture() })) }),
    restore: (value: unknown): void => {
      const saved = value as Saved, kept = new Map(options.map(option => [option.key, option]));
      hasPrompt = saved.prompt; speaker.value = saved.speaker; promptText.value = saved.promptText; picked.value = saved.picked; pickedChanged = saved.pickedChanged;
      options = saved.options.map(item => {
        const option = kept.get(item.key) ?? newOption({ text: item.text, ...(item.id ? { id: item.id } : {}), ...(original(item.id)?.condition ? { condition: original(item.id)!.condition! } : {}) }, item.key);
        option.text = item.text; option.policy = item.policy; option.guardOpen = item.guardOpen; option.builder.restore(item.builder); return option;
      });
      drawPrompt(); drawOptions();
    },
  };
  const primary = list.querySelector<HTMLElement>('input[aria-label="Choice option text"]') ?? host;
  return {
    host, controls: [promptText], primary, read, internals, focus: () => focusFirst(host),
    refresh: () => { options.forEach((option, index) => drawStructure(option, index)); drawNone(); },
  };
}
