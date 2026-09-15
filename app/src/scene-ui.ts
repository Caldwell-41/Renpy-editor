export type PlacementRef = "left" | "centre" | "right";
export type TransitionRef = "none" | "dissolve" | "fade";

export interface ChoiceOption {
  readonly text: string;
  readonly destinationSceneId: string;
}

export type BeatPayload =
  | { readonly type: "background"; readonly assetId: string; readonly transition: TransitionRef }
  | { readonly type: "showCharacter"; readonly characterId: string; readonly appearanceId: string; readonly placement: PlacementRef; readonly transition: TransitionRef }
  | { readonly type: "hideCharacter"; readonly characterId: string; readonly transition: TransitionRef }
  | { readonly type: "changeAppearance"; readonly characterId: string; readonly appearanceId: string; readonly transition: TransitionRef }
  | { readonly type: "placement"; readonly characterId: string; readonly placement: PlacementRef }
  | { readonly type: "dialogue"; readonly characterId: string; readonly text: string }
  | { readonly type: "narration"; readonly text: string }
  | { readonly type: "playMusic"; readonly assetId: string }
  | { readonly type: "stopMusic" }
  | { readonly type: "playSfx"; readonly assetId: string }
  | { readonly type: "transition"; readonly transition: Exclude<TransitionRef, "none"> }
  | { readonly type: "setVariable"; readonly variableId: string; readonly value: boolean | string }
  | { readonly type: "choice"; readonly options: readonly ChoiceOption[] }
  | { readonly type: "jump"; readonly sceneId: string }
  | { readonly type: "return" }
  | { readonly type: "customCode"; readonly source: string; readonly reason: string };

export interface SceneBeat {
  readonly id: string;
  readonly byteStart: number;
  readonly byteEnd: number;
  readonly protected: boolean;
  readonly payload: BeatPayload;
}

export interface SceneDocument {
  readonly id: string;
  readonly chapterId: string;
  readonly displayName: string;
  readonly technicalLabel: string;
  readonly sourcePath: string;
  readonly sourceRevision: string;
  readonly sourceConflict: boolean;
  readonly partial: boolean;
  readonly beats: readonly SceneBeat[];
}

interface Chapter { readonly id: string; readonly displayName: string; readonly directory: string }
interface Character { readonly id: string; readonly displayName: string; readonly technicalName: string }
interface Appearance { readonly id: string; readonly characterId: string; readonly label: string; readonly assetId?: string }
interface Asset { readonly id: string; readonly kind: "background" | "characterAppearance" | "music" | "sfx"; readonly displayName: string; readonly status: string; readonly sha256?: string }
interface Variable { readonly id: string; readonly technicalName: string; readonly variableType: "bool" | "int" | "string"; readonly defaultValue: boolean | string }

export interface SceneWorkspace {
  readonly projectRevision: string;
  readonly sourceMapRevision: string;
  readonly entrySceneId: string;
  readonly lastOpen: { readonly chapterId: string; readonly sceneId: string };
  readonly chapters: readonly Chapter[];
  readonly scenes: readonly SceneDocument[];
  readonly authoring: {
    readonly characters: readonly Character[];
    readonly appearances: readonly Appearance[];
    readonly assets: readonly Asset[];
    readonly variables: readonly Variable[];
  };
  readonly canUndo: boolean;
  readonly canRedo: boolean;
}

export interface MediaPresentation {
  readonly assetId: string;
  readonly purpose: "thumbnail" | "imagePreview" | "audioAudition";
  readonly mimeType: string;
  readonly dataBase64: string;
  readonly sha256: string;
  readonly byteCount: number;
  readonly width?: number;
  readonly height?: number;
  readonly cacheKey: string;
}

export interface PreviewCharacter {
  readonly characterId: string;
  readonly appearanceId: string;
  readonly placement: PlacementRef;
  readonly visibleBeatId: string;
  readonly appearanceBeatId: string;
  readonly placementBeatId: string;
}

export interface ScenePreviewState {
  readonly throughBeatId?: string;
  readonly partial: boolean;
  readonly unknownBeatIds: readonly string[];
  readonly background?: { readonly assetId: string; readonly beatId: string };
  readonly backgroundUnknown: boolean;
  readonly characters: readonly PreviewCharacter[];
  readonly charactersUnknown: boolean;
  readonly music?: { readonly assetId: string; readonly beatId: string };
  readonly musicUnknown: boolean;
  readonly variables: Readonly<Record<string, { readonly value: boolean | string; readonly beatId: string }>>;
  readonly variablesUnknown: boolean;
  readonly overlay?: { readonly kind: "dialogue" | "narration" | "choice" | "jump" | "return"; readonly text: string; readonly beatId: string };
}

export function deriveScenePreview(scene: SceneDocument, throughBeatId?: string): ScenePreviewState {
  const stop = throughBeatId === undefined ? scene.beats.length - 1 : scene.beats.findIndex((beat) => beat.id === throughBeatId);
  const limit = stop < 0 ? scene.beats.length - 1 : stop;
  let background: ScenePreviewState["background"];
  let backgroundUnknown = false;
  let characters: PreviewCharacter[] = [];
  let charactersUnknown = false;
  let music: ScenePreviewState["music"];
  let musicUnknown = false;
  let variables: Record<string, { value: boolean | string; beatId: string }> = {};
  let variablesUnknown = false;
  let overlay: ScenePreviewState["overlay"];
  const unknownBeatIds: string[] = [];
  for (const beat of scene.beats.slice(0, limit + 1)) {
    const payload = beat.payload;
    if (payload.type === "customCode") {
      unknownBeatIds.push(beat.id); background = undefined; backgroundUnknown = true;
      characters = []; charactersUnknown = true; music = undefined; musicUnknown = true;
      variables = {}; variablesUnknown = true; overlay = undefined; continue;
    }
    switch (payload.type) {
      case "background": background = { assetId: payload.assetId, beatId: beat.id }; backgroundUnknown = false; break;
      case "showCharacter": {
        characters = characters.filter((item) => item.characterId !== payload.characterId);
        characters.push({ characterId: payload.characterId, appearanceId: payload.appearanceId, placement: payload.placement, visibleBeatId: beat.id, appearanceBeatId: beat.id, placementBeatId: beat.id });
        break;
      }
      case "hideCharacter": characters = characters.filter((item) => item.characterId !== payload.characterId); break;
      case "changeAppearance": characters = characters.map((item) => item.characterId === payload.characterId ? { ...item, appearanceId: payload.appearanceId, appearanceBeatId: beat.id } : item); break;
      case "placement": characters = characters.map((item) => item.characterId === payload.characterId ? { ...item, placement: payload.placement, placementBeatId: beat.id } : item); break;
      case "playMusic": music = { assetId: payload.assetId, beatId: beat.id }; musicUnknown = false; break;
      case "stopMusic": music = undefined; musicUnknown = false; break;
      case "setVariable": variables[payload.variableId] = { value: payload.value, beatId: beat.id }; break;
      case "dialogue": overlay = { kind: "dialogue", text: payload.text, beatId: beat.id }; break;
      case "narration": overlay = { kind: "narration", text: payload.text, beatId: beat.id }; break;
      case "choice": overlay = { kind: "choice", text: payload.options.map((option) => option.text).join(" · "), beatId: beat.id }; break;
      case "jump": overlay = { kind: "jump", text: "Jump", beatId: beat.id }; break;
      case "return": overlay = { kind: "return", text: "Return / End", beatId: beat.id }; break;
      case "playSfx": case "transition": break;
    }
  }
  return { throughBeatId: scene.beats[limit]?.id, partial: unknownBeatIds.length > 0, unknownBeatIds, background, backgroundUnknown, characters, charactersUnknown, music, musicUnknown, variables, variablesUnknown, overlay };
}

export type SceneCommand = Readonly<Record<string, unknown>> & { readonly type: string };

export interface RecoveryEvidence { readonly path: string; readonly acceptedRetained: boolean; readonly displacedRetained: boolean }
export type RecoveryMutationState = "preparedWithoutStage" | "stagedWithBaseIntact" | "exchangeCompleteExpected" | "exchangeCompleteConflict" | "externalRevisionWithAcceptedCopy" | "durable" | "ambiguous";
export interface RecoveryItem {
  readonly transactionId: string;
  readonly state: { readonly name: string };
  readonly code?: string;
  readonly mutations: readonly RecoveryMutationState[];
  readonly affected: readonly RecoveryEvidence[];
}
export interface RecoveryReport { readonly items: readonly RecoveryItem[] }

export interface SceneActions {
  readonly apply: (command: SceneCommand, expected: Pick<SceneWorkspace, "projectRevision" | "sourceMapRevision">) => Promise<SceneWorkspace>;
  readonly status: (message: string, kind?: "normal" | "error") => void;
  readonly present: (assetId: string, purpose: MediaPresentation["purpose"]) => Promise<MediaPresentation>;
  readonly resolution: { readonly width: number; readonly height: number };
}

export interface RecoveryActions {
  readonly resolve: (transactionId: string, resolution: "keepCurrent" | "acceptLoomlight") => Promise<RecoveryReport>;
  readonly status: (message: string, kind?: "normal" | "error") => void;
  readonly completed: () => void;
}

const beatLabels: Record<BeatPayload["type"], string> = {
  background: "Background",
  showCharacter: "Show Character",
  hideCharacter: "Hide Character",
  changeAppearance: "Change Appearance",
  placement: "Placement",
  dialogue: "Dialogue",
  narration: "Narration",
  playMusic: "Play Music",
  stopMusic: "Stop Music",
  playSfx: "Play SFX",
  transition: "Transition",
  setVariable: "Set Variable",
  choice: "Choice",
  jump: "Jump",
  return: "Return / End",
  customCode: "Custom Code",
};

function button(label: string, className = "button secondary"): HTMLButtonElement {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = label;
  return element;
}

function input(value = ""): HTMLInputElement {
  const element = document.createElement("input");
  element.type = "text";
  element.value = value;
  return element;
}

function labelled(label: string, control: HTMLElement): HTMLLabelElement {
  const wrapper = document.createElement("label");
  wrapper.className = "field compact-field";
  const caption = document.createElement("span");
  caption.textContent = label;
  wrapper.append(caption, control);
  return wrapper;
}

function selectOf<T extends string>(values: readonly { readonly value: T; readonly label: string }[], selected?: string): HTMLSelectElement {
  const control = document.createElement("select");
  for (const item of values) {
    const option = document.createElement("option");
    option.value = item.value;
    option.textContent = item.label;
    option.selected = selected === item.value;
    control.append(option);
  }
  return control;
}

function entitySelect(values: readonly { readonly id: string; readonly label: string }[], selected?: string): HTMLSelectElement {
  return selectOf(values.map((item) => ({ value: item.id, label: item.label })), selected);
}

function dirtyDraft(group: HTMLElement, controls: readonly HTMLElement[]): void {
  group.classList.add("scene-draft");
  for (const control of controls) {
    for (const event of ["input", "change"]) control.addEventListener(event, () => {
      group.dataset.unsubmitted = "true";
    });
  }
}

export function hasSceneDraft(root: ParentNode = document): boolean {
  return root.querySelector('.scene-draft[data-unsubmitted="true"]') !== null;
}

export function focusSceneDraft(root: ParentNode = document): void {
  root.querySelector<HTMLElement>('.scene-draft[data-unsubmitted="true"] input, .scene-draft[data-unsubmitted="true"] textarea, .scene-draft[data-unsubmitted="true"] select')?.focus();
}

function friendlyError(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function presentationUrl(media: MediaPresentation): string {
  const binary = atob(media.dataBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: media.mimeType }));
}

export function renderSceneAuthoring(
  host: HTMLElement,
  treeHost: HTMLElement,
  initial: SceneWorkspace,
  actions: SceneActions,
): () => void {
  let model = initial;
  let selectedBeatId: string | undefined;
  let mediaGeneration = 0;
  const imageCache = new Map<string, { readonly key: string; readonly url: string }>();
  const pendingImages = new Map<string, Promise<MediaPresentation>>();
  const audioUrls = new Set<string>();
  let disposed = false;

  const mutate = async (command: SceneCommand, after?: (before: SceneWorkspace, next: SceneWorkspace) => void): Promise<void> => {
    const before = model;
    actions.status("Saving…");
    try {
      const next = await actions.apply(command, before);
      model = next;
      after?.(before, next);
      draw();
      actions.status("Saved");
    } catch (error) {
      actions.status(friendlyError(error, "Scene change could not be saved"), "error");
      focusSceneDraft(host);
    }
  };

  const draftGuard = (): boolean => {
    if (!hasSceneDraft(host)) return true;
    actions.status("Commit or cancel the Scene editor before navigating.", "error");
    focusSceneDraft(host);
    return false;
  };

  const draw = (): void => {
    mediaGeneration += 1;
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
    treeHost.replaceChildren();
    host.replaceChildren();
    const selectedScene = model.scenes.find((scene) => scene.id === model.lastOpen.sceneId) ?? model.scenes[0];
    if (!selectedScene) {
      const empty = document.createElement("p"); empty.className = "error-message"; empty.textContent = "No valid Scene is available."; host.append(empty); return;
    }
    drawTree(selectedScene);
    drawBeats(selectedScene);
  };

  const drawTree = (selectedScene: SceneDocument): void => {
    const heading = document.createElement("div"); heading.className = "tree-heading";
    const label = document.createElement("p"); label.className = "eyebrow"; label.textContent = "Story tree";
    const create = button("New Chapter", "text-button");
    create.addEventListener("click", () => inlineName(treeHost, "Chapter name", "New Chapter", (displayName) => mutate({ type: "createChapter", displayName })));
    heading.append(label, create); treeHost.append(heading);
    model.chapters.forEach((chapter, chapterIndex) => {
      const chapterGroup = document.createElement("section"); chapterGroup.className = "tree-chapter";
      const row = document.createElement("div"); row.className = "tree-chapter-row";
      const name = document.createElement("strong"); name.textContent = chapter.displayName;
      const tools = document.createElement("div"); tools.className = "tree-tools";
      const rename = button("Rename", "icon-button"); rename.ariaLabel = `Rename chapter ${chapter.displayName}`;
      rename.addEventListener("click", () => inlineName(chapterGroup, "Chapter name", chapter.displayName, (displayName) => mutate({ type: "renameChapter", chapterId: chapter.id, displayName })));
      const up = button("↑", "icon-button"); up.ariaLabel = `Move chapter ${chapter.displayName} up`; up.disabled = chapterIndex === 0;
      up.addEventListener("click", () => void mutate({ type: "moveChapter", chapterId: chapter.id, direction: "up" }));
      const down = button("↓", "icon-button"); down.ariaLabel = `Move chapter ${chapter.displayName} down`; down.disabled = chapterIndex === model.chapters.length - 1;
      down.addEventListener("click", () => void mutate({ type: "moveChapter", chapterId: chapter.id, direction: "down" }));
      const remove = button("Delete", "icon-button"); remove.ariaLabel = `Delete empty chapter ${chapter.displayName}`;
      remove.disabled = model.chapters.length === 1 || model.scenes.some((scene) => scene.chapterId === chapter.id);
      remove.addEventListener("click", () => confirmAction(chapterGroup, `Delete empty chapter “${chapter.displayName}”?`, () => mutate({ type: "deleteChapter", chapterId: chapter.id })));
      tools.append(rename, up, down, remove); row.append(name, tools); chapterGroup.append(row);
      const scenes = model.scenes.filter((scene) => scene.chapterId === chapter.id);
      scenes.forEach((scene, sceneIndex) => {
        const sceneRow = document.createElement("div"); sceneRow.className = `tree-scene-row${scene.id === selectedScene.id ? " selected" : ""}`;
        const open = button(scene.displayName, "tree-scene-open");
        if (scene.id === selectedScene.id) open.ariaCurrent = "page";
        open.addEventListener("click", () => { if (scene.id !== selectedScene.id && draftGuard()) void mutate({ type: "selectScene", sceneId: scene.id }); });
        const controls = document.createElement("div"); controls.className = "tree-tools";
        const renameScene = button("Rename", "icon-button"); renameScene.ariaLabel = `Rename scene ${scene.displayName}`;
        renameScene.addEventListener("click", () => inlineName(sceneRow, "Scene name", scene.displayName, (displayName) => mutate({ type: "renameScene", sceneId: scene.id, displayName })));
        const moveUp = button("↑", "icon-button"); moveUp.ariaLabel = `Move scene ${scene.displayName} up`; moveUp.disabled = sceneIndex === 0;
        moveUp.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "up", expectedSourceRevision: scene.sourceRevision }));
        const moveDown = button("↓", "icon-button"); moveDown.ariaLabel = `Move scene ${scene.displayName} down`; moveDown.disabled = sceneIndex === scenes.length - 1;
        moveDown.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: chapter.id, direction: "down", expectedSourceRevision: scene.sourceRevision }));
        const removeScene = button("Delete", "icon-button"); removeScene.ariaLabel = `Delete scene ${scene.displayName}`;
        removeScene.disabled = scene.id === model.entrySceneId || model.scenes.length === 1;
        removeScene.addEventListener("click", () => confirmAction(sceneRow, `Delete Scene “${scene.displayName}”? Incoming or opaque references will refuse this operation.`, () => mutate({ type: "deleteScene", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision })));
        controls.append(renameScene, moveUp, moveDown, removeScene);
        if (model.chapters.length > 1) {
          const target = entitySelect(model.chapters.filter((item) => item.id !== chapter.id).map((item) => ({ id: item.id, label: item.displayName })));
          target.ariaLabel = `Destination chapter for ${scene.displayName}`;
          const move = button("Move", "icon-button"); move.addEventListener("click", () => void mutate({ type: "moveScene", sceneId: scene.id, chapterId: target.value, direction: null, expectedSourceRevision: scene.sourceRevision }));
          controls.append(target, move);
        }
        sceneRow.append(open, controls); chapterGroup.append(sceneRow);
      });
      const newScene = button("+ New Scene", "tree-new-scene");
      newScene.addEventListener("click", () => inlineName(chapterGroup, "Scene name", "New Scene", (displayName) => mutate({ type: "createScene", chapterId: chapter.id, displayName })));
      chapterGroup.append(newScene); treeHost.append(chapterGroup);
    });
  };

  const openNewBeat = (scene: SceneDocument, initialType: BeatPayload["type"] = "dialogue"): void => {
    if (!draftGuard()) return;
    selectedBeatId = undefined;
    draw();
    const current = model.scenes.find((item) => item.id === scene.id);
    const list = host.querySelector<HTMLElement>(".beats-list");
    if (current && list) renderNewBeat(list, current, initialType);
  };

  const loadImage = async (assetId: string, purpose: "thumbnail" | "imagePreview", image: HTMLImageElement, errorHost: HTMLElement): Promise<void> => {
    const generation = mediaGeneration;
    const assetHash = model.authoring.assets.find((asset) => asset.id === assetId)?.sha256;
    const cached = imageCache.get(assetId);
    if (cached && assetHash && cached.key.endsWith(assetHash)) { image.src = cached.url; return; }
    if (cached) { URL.revokeObjectURL(cached.url); imageCache.delete(assetId); }
    try {
      let pending = pendingImages.get(assetId);
      if (!pending) {
        pending = actions.present(assetId, purpose);
        pendingImages.set(assetId, pending);
        void pending.then(() => pendingImages.delete(assetId), () => pendingImages.delete(assetId));
      }
      const media = await pending;
      if (disposed || generation !== mediaGeneration || !image.isConnected) return;
      const url = presentationUrl(media);
      const replaced = imageCache.get(assetId);
      if (replaced) URL.revokeObjectURL(replaced.url);
      imageCache.set(assetId, { key: media.cacheKey, url }); image.src = url;
    } catch (error) {
      if (disposed || generation !== mediaGeneration || !errorHost.isConnected) return;
      image.remove(); const message = document.createElement("span"); message.className = "preview-media-error"; message.textContent = friendlyError(error, "Media unavailable"); errorHost.append(message);
    }
  };

  const audition = async (assetId: string, hostElement: HTMLElement, trigger: HTMLButtonElement): Promise<void> => {
    const generation = mediaGeneration; trigger.disabled = true; actions.status("Preparing audio audition…");
    try {
      const media = await actions.present(assetId, "audioAudition");
      if (disposed || generation !== mediaGeneration || !hostElement.isConnected) return;
      const url = presentationUrl(media); audioUrls.add(url);
      const audio = document.createElement("audio"); audio.controls = true; audio.autoplay = true; audio.src = url; audio.addEventListener("ended", () => { URL.revokeObjectURL(url); audioUrls.delete(url); });
      hostElement.replaceChildren(audio); actions.status("Audio audition started by user");
    } catch (error) { if (generation === mediaGeneration) { trigger.disabled = false; actions.status(friendlyError(error, "Audio audition unavailable"), "error"); trigger.focus(); } }
  };

  const renderPreview = (preview: HTMLElement, scene: SceneDocument): void => {
    const state = deriveScenePreview(scene, selectedBeatId);
    const selectedIndex = state.throughBeatId ? scene.beats.findIndex((beat) => beat.id === state.throughBeatId) : scene.beats.length - 1;
    const header = document.createElement("div"); header.className = "preview-header";
    const heading = document.createElement("h2"); heading.textContent = "Scene Preview";
    const through = document.createElement("span"); through.textContent = selectedIndex >= 0 ? `Through Beat ${selectedIndex + 1}` : "Scene start";
    if (state.partial) { const badge = document.createElement("strong"); badge.className = "partial-badge"; badge.textContent = "Partial / unknown"; header.append(heading, through, badge); } else header.append(heading, through);
    const surround = document.createElement("div"); surround.className = "preview-surround";
    const canvas = document.createElement("div"); canvas.className = "preview-canvas"; canvas.style.aspectRatio = `${actions.resolution.width} / ${actions.resolution.height}`;
    if (state.background) {
      const image = document.createElement("img"); image.className = "preview-background"; image.alt = model.authoring.assets.find((asset) => asset.id === state.background?.assetId)?.displayName ?? "Scene background";
      canvas.append(image); void loadImage(state.background.assetId, "imagePreview", image, canvas);
    } else {
      const empty = document.createElement("p"); empty.className = "preview-empty"; empty.textContent = state.backgroundUnknown ? "Background unknown after Custom Code" : "No background at this point"; canvas.append(empty);
    }
    for (const visible of state.characters) {
      const figure = document.createElement("figure"); figure.className = `preview-character ${visible.placement}`;
      const appearance = model.authoring.appearances.find((item) => item.id === visible.appearanceId);
      const character = model.authoring.characters.find((item) => item.id === visible.characterId);
      if (appearance?.assetId) { const image = document.createElement("img"); image.alt = `${character?.displayName ?? "Character"} — ${appearance.label}`; figure.append(image); void loadImage(appearance.assetId, "imagePreview", image, figure); }
      const caption = document.createElement("figcaption"); caption.textContent = character?.displayName ?? "Character"; figure.append(caption); canvas.append(figure);
    }
    if (state.charactersUnknown) { const unknown = document.createElement("span"); unknown.className = "preview-unknown-layer"; unknown.textContent = "Other character state may be unknown"; canvas.append(unknown); }
    if (state.overlay) { const overlay = document.createElement("div"); overlay.className = `preview-overlay ${state.overlay.kind}`; overlay.textContent = state.overlay.text || (state.overlay.kind === "dialogue" ? "Empty dialogue" : state.overlay.kind); canvas.append(overlay); }
    surround.append(canvas); preview.append(header, surround);

    const details = document.createElement("div"); details.className = "preview-details";
    const provenance = document.createElement("div"); provenance.className = "preview-provenance";
    const provenanceHeading = document.createElement("h3"); provenanceHeading.textContent = "Visible state and provenance"; provenance.append(provenanceHeading);
    const contribution = (label: string, beatId: string | undefined, addType: BeatPayload["type"]): void => {
      const row = document.createElement("div"); row.className = "provenance-row"; const name = document.createElement("span"); name.textContent = label; row.append(name);
      if (beatId) { const index = scene.beats.findIndex((beat) => beat.id === beatId); const edit = button(`Edit Beat ${index + 1}`, "text-button"); edit.addEventListener("click", () => { if (draftGuard()) { selectedBeatId = beatId; draw(); host.querySelector<HTMLElement>(".beat-card.selected")?.scrollIntoView?.({ block: "nearest" }); } }); row.append(edit); }
      const add = button("Add change here", "text-button"); add.addEventListener("click", () => openNewBeat(scene, addType)); row.append(add); provenance.append(row);
    };
    contribution(state.backgroundUnknown ? "Background · unknown" : "Background", state.background?.beatId, "background");
    state.characters.forEach((character) => contribution(`${model.authoring.characters.find((item) => item.id === character.characterId)?.displayName ?? "Character"} · ${character.placement}`, character.appearanceBeatId, "changeAppearance"));
    contribution(state.musicUnknown ? "Music · unknown" : "Music", state.music?.beatId, "playMusic");
    const knownVariables = Object.entries(state.variables); knownVariables.forEach(([id, value]) => contribution(`Variable ${model.authoring.variables.find((item) => item.id === id)?.technicalName ?? id} = ${String(value.value)}`, value.beatId, "setVariable"));
    if (state.variablesUnknown && !knownVariables.length) { const unknown = document.createElement("p"); unknown.className = "muted"; unknown.textContent = "Variable state is unknown after Custom Code."; provenance.append(unknown); }
    details.append(provenance);
    const media = document.createElement("div"); media.className = "preview-media"; const mediaHeading = document.createElement("h3"); mediaHeading.textContent = "Scene media"; media.append(mediaHeading);
    const referenced = new Set<string>(); if (state.background) referenced.add(state.background.assetId); state.characters.forEach((character) => { const assetId = model.authoring.appearances.find((item) => item.id === character.appearanceId)?.assetId; if (assetId) referenced.add(assetId); });
    for (const assetId of referenced) { const tile = document.createElement("div"); tile.className = "asset-thumbnail"; const image = document.createElement("img"); const asset = model.authoring.assets.find((item) => item.id === assetId); image.alt = asset?.displayName ?? "Asset thumbnail"; const label = document.createElement("span"); label.textContent = asset?.displayName ?? "Asset"; tile.append(image, label); media.append(tile); void loadImage(assetId, "thumbnail", image, tile); }
    const selectedBeat = scene.beats.find((beat) => beat.id === selectedBeatId);
    const audible = selectedBeat?.payload.type === "playSfx" ? selectedBeat.payload.assetId : state.music?.assetId;
    if (audible) { const audioHost = document.createElement("div"); audioHost.className = "audio-audition"; const play = button(selectedBeat?.payload.type === "playSfx" ? "Audition selected SFX" : "Audition current music"); play.addEventListener("click", () => void audition(audible, audioHost, play)); media.append(play, audioHost); }
    details.append(media); preview.append(details);
  };

  const drawBeats = (scene: SceneDocument): void => {
    const header = document.createElement("header"); header.className = "scene-header";
    const titleBlock = document.createElement("div");
    const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = model.chapters.find((chapter) => chapter.id === scene.chapterId)?.displayName ?? "Scene";
    const title = document.createElement("h1"); title.textContent = scene.displayName;
    const technical = document.createElement("code"); technical.textContent = `${scene.technicalLabel} · ${scene.sourcePath}`;
    titleBlock.append(eyebrow, title, technical);
    const history = document.createElement("div"); history.className = "scene-history";
    const undo = button("Undo"); undo.disabled = !model.canUndo; undo.addEventListener("click", () => { if (draftGuard()) void mutate({ type: "undo" }); });
    const redo = button("Redo"); redo.disabled = !model.canRedo; redo.addEventListener("click", () => { if (draftGuard()) void mutate({ type: "redo" }); });
    history.append(undo, redo); header.append(titleBlock, history); host.append(header);
    if (scene.sourceConflict) {
      const conflict = document.createElement("section"); conflict.className = "state-banner error-state"; conflict.role = "alert";
      const heading = document.createElement("h2"); heading.textContent = "Source conflict";
      const copy = document.createElement("p"); copy.textContent = "This Scene changed outside Loomlight. Scene writes and history are blocked until the exact source revision is reconciled.";
      conflict.append(heading, copy); host.append(conflict);
    } else if (scene.partial) {
      const partial = document.createElement("p"); partial.className = "state-banner partial-state"; partial.textContent = "Preview and reference certainty are partial because this Scene contains protected Custom Code."; host.append(partial);
    }
    const stack = document.createElement("div"); stack.className = "scene-stack";
    const preview = document.createElement("section"); preview.className = "preview-region"; preview.setAttribute("aria-label", "Scene Preview");
    const beatsRegion = document.createElement("section"); beatsRegion.className = "beats-region"; beatsRegion.setAttribute("aria-label", "Beats writing surface");
    stack.append(preview, beatsRegion); host.append(stack); renderPreview(preview, scene);
    const toolbar = document.createElement("div"); toolbar.className = "beats-toolbar";
    const heading = document.createElement("h2"); heading.textContent = "Beats";
    const add = button("Add Beat", "button primary"); add.disabled = scene.sourceConflict;
    add.addEventListener("click", () => openNewBeat(scene));
    const allocation = document.createElement("input"); allocation.type = "range"; allocation.min = "35"; allocation.max = "70"; allocation.value = "52"; allocation.ariaLabel = "Preview vertical allocation";
    allocation.addEventListener("input", () => { stack.style.setProperty("--preview-share", `${allocation.value}fr`); stack.style.setProperty("--beats-share", `${100 - Number(allocation.value)}fr`); });
    const tools = document.createElement("div"); tools.className = "beats-tools"; tools.append(labelled("Preview size", allocation), add);
    toolbar.append(heading, tools); beatsRegion.append(toolbar);
    const list = document.createElement("div"); list.className = "beats-list"; list.setAttribute("role", "list"); beatsRegion.append(list);
    scene.beats.forEach((beat, index) => {
      const card = document.createElement("article"); card.className = `beat-card${selectedBeatId === beat.id ? " selected" : ""}`; card.setAttribute("role", "listitem");
      const compact = document.createElement("div"); compact.className = "beat-compact";
      const select = button(`${index + 1}. ${beatLabels[beat.payload.type]}`, "beat-select"); select.ariaExpanded = String(selectedBeatId === beat.id);
      const summary = document.createElement("span"); summary.className = "beat-summary"; summary.textContent = beatSummary(beat.payload, model);
      select.append(summary); select.addEventListener("click", () => { if (draftGuard()) { selectedBeatId = selectedBeatId === beat.id ? undefined : beat.id; draw(); } });
      const controls = document.createElement("div"); controls.className = "beat-controls";
      const up = button("↑", "icon-button"); up.ariaLabel = `Move beat ${index + 1} up`; up.disabled = index === 0 || beat.protected || scene.beats[index - 1]?.protected === true || scene.sourceConflict;
      up.addEventListener("click", () => void mutate({ type: "moveBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, direction: "up" }));
      const down = button("↓", "icon-button"); down.ariaLabel = `Move beat ${index + 1} down`; down.disabled = index === scene.beats.length - 1 || beat.protected || scene.beats[index + 1]?.protected === true || scene.sourceConflict;
      down.addEventListener("click", () => void mutate({ type: "moveBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, direction: "down" }));
      const remove = button("Delete", "icon-button"); remove.ariaLabel = `Delete beat ${index + 1}`; remove.disabled = beat.protected || beat.payload.type === "return" || scene.sourceConflict;
      remove.addEventListener("click", () => confirmAction(card, `Delete Beat ${index + 1}?`, () => mutate({ type: "removeBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id })));
      controls.append(up, down, remove); compact.append(select, controls); card.append(compact);
      if (selectedBeatId === beat.id) renderExistingBeat(card, scene, beat, index);
      list.append(card);
    });
  };

  const renderExistingBeat = (card: HTMLElement, scene: SceneDocument, beat: SceneBeat, index: number): void => {
    if (beat.protected) {
      const protectedPanel = document.createElement("div"); protectedPanel.className = "protected-code";
      const explanation = document.createElement("p"); explanation.textContent = beat.payload.type === "customCode" ? beat.payload.reason : "Protected source";
      const source = document.createElement("pre"); source.textContent = beat.payload.type === "customCode" ? beat.payload.source : "";
      protectedPanel.append(explanation, source); card.append(protectedPanel); return;
    }
    const editor = buildBeatEditor(model, beat.payload);
    const panel = editor.host; panel.classList.add("expanded-beat");
    if (beat.payload.type === "choice") {
      const createDestination = button("Create New Scene", "button secondary");
      createDestination.addEventListener("click", () => {
        if (panel.dataset.unsubmitted === "true") {
          actions.status("Commit or cancel current Choice edits before creating a destination.", "error");
          editor.focus();
          return;
        }
        if (panel.querySelector(".choice-new-scene")) return;
        const form = document.createElement("div"); form.className = "choice-new-scene scene-draft";
        const optionText = input(); const sceneName = input("New Scene");
        const chapter = entitySelect(model.chapters.map((item) => ({ id: item.id, label: item.displayName })), scene.chapterId);
        const cancelNew = button("Cancel", "text-button"); cancelNew.addEventListener("click", () => form.remove());
        const createNew = button("Create Scene and option", "button primary");
        createNew.addEventListener("click", () => {
          try {
            void mutate({ type: "createSceneFromChoice", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, choiceBeatId: beat.id, optionText: requiredText(optionText, "Choice text"), chapterId: required(chapter), displayName: requiredText(sceneName, "Scene name") });
          } catch (error) { actions.status(friendlyError(error, "New Scene details are invalid"), "error"); optionText.focus(); }
        });
        form.append(labelled("Choice text", optionText), labelled("New Scene name", sceneName), labelled("Chapter", chapter), cancelNew, createNew);
        dirtyDraft(form, [optionText, sceneName, chapter]); panel.append(form); optionText.focus();
      });
      panel.append(createDestination);
    }
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => { selectedBeatId = undefined; draw(); });
    const commit = button("Commit Beat", "button primary"); commit.disabled = scene.sourceConflict;
    const save = async (continueDialogue: boolean): Promise<void> => {
      try {
        const payload = editor.read();
        if (continueDialogue && payload.type === "dialogue") {
          const oldIds = new Set(model.scenes.find((item) => item.id === scene.id)?.beats.map((item) => item.id));
          await mutate({ type: "continueDialogue", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, characterId: payload.characterId, text: payload.text }, (_before, next) => {
            selectedBeatId = next.scenes.find((item) => item.id === scene.id)?.beats.find((item) => item.payload.type === "dialogue" && !oldIds.has(item.id))?.id;
          });
        } else {
          await mutate({ type: "updateBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beatId: beat.id, beat: payload }, () => { selectedBeatId = undefined; });
        }
      } catch (error) {
        actions.status(friendlyError(error, `Beat ${index + 1} is invalid`), "error");
        editor.focus();
      }
    };
    commit.addEventListener("click", () => void save(false));
    if (beat.payload.type === "dialogue") editor.primary.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") { event.preventDefault(); void save(true); }
    });
    actionsRow.append(cancel, commit); panel.append(actionsRow); dirtyDraft(panel, editor.controls); card.append(panel);
  };

  const renderNewBeat = (list: HTMLElement, scene: SceneDocument, initialType: BeatPayload["type"] = "dialogue"): void => {
    if (list.querySelector(".new-beat")) return;
    const panel = document.createElement("section"); panel.className = "new-beat scene-draft"; panel.setAttribute("aria-labelledby", "new-beat-title");
    const heading = document.createElement("h3"); heading.id = "new-beat-title"; heading.textContent = "Add Beat";
    const types = (Object.keys(beatLabels) as BeatPayload["type"][]).filter((type) => type !== "customCode");
    const type = selectOf(types.map((value) => ({ value, label: beatLabels[value] })), initialType);
    const editorHost = document.createElement("div");
    let editor = buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model));
    const replaceEditor = (): void => { editor = buildBeatEditor(model, defaultPayload(type.value as BeatPayload["type"], model)); editorHost.replaceChildren(editor.host); dirtyDraft(panel, editor.controls); };
    type.addEventListener("change", replaceEditor); replaceEditor();
    const actionsRow = document.createElement("div"); actionsRow.className = "row-actions";
    const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => panel.remove());
    const commit = button("Add Beat", "button primary"); commit.addEventListener("click", async () => {
      try {
        const payload = editor.read();
        const oldIds = new Set(scene.beats.map((item) => item.id));
        await mutate({ type: "insertBeat", sceneId: scene.id, expectedSourceRevision: scene.sourceRevision, beforeBeatId: null, beat: payload }, (_before, next) => {
          selectedBeatId = next.scenes.find((item) => item.id === scene.id)?.beats.find((item) => !oldIds.has(item.id))?.id;
        });
      } catch (error) {
        actions.status(friendlyError(error, "Beat is invalid"), "error"); editor.focus();
      }
    });
    actionsRow.append(cancel, commit); dirtyDraft(panel, [type]); panel.append(heading, labelled("Beat type", type), editorHost, actionsRow); list.prepend(panel); type.focus();
  };

  draw();
  return () => {
    disposed = true;
    mediaGeneration += 1;
    pendingImages.clear();
    for (const image of imageCache.values()) URL.revokeObjectURL(image.url);
    imageCache.clear();
    for (const url of audioUrls) URL.revokeObjectURL?.(url);
    audioUrls.clear();
  };
}

function inlineName(host: HTMLElement, label: string, current: string, commit: (value: string) => Promise<void>): void {
  if (host.querySelector(":scope > .tree-inline")) return;
  const panel = document.createElement("div"); panel.className = "tree-inline scene-draft";
  const name = input(current); const save = button("Save", "button primary"); const cancel = button("Cancel", "text-button");
  save.addEventListener("click", async () => { if (!name.value.trim()) { name.setCustomValidity("A display name is required."); name.reportValidity(); name.focus(); return; } await commit(name.value.trim()); });
  cancel.addEventListener("click", () => panel.remove()); panel.append(labelled(label, name), cancel, save); dirtyDraft(panel, [name]); host.append(panel); name.select();
}

function confirmAction(host: HTMLElement, copy: string, commit: () => Promise<void>): void {
  if (host.querySelector(":scope > .confirm-row")) return;
  const panel = document.createElement("div"); panel.className = "confirm-row"; const text = document.createElement("span"); text.textContent = copy;
  const cancel = button("Cancel", "text-button"); cancel.addEventListener("click", () => panel.remove()); const confirm = button("Confirm delete", "button danger"); confirm.addEventListener("click", () => void commit()); panel.append(text, cancel, confirm); host.append(panel);
}

function beatSummary(payload: BeatPayload, model: SceneWorkspace): string {
  const character = (id: string): string => model.authoring.characters.find((item) => item.id === id)?.displayName ?? "Unknown Character";
  const asset = (id: string): string => model.authoring.assets.find((item) => item.id === id)?.displayName ?? "Unknown Asset";
  const scene = (id: string): string => model.scenes.find((item) => item.id === id)?.displayName ?? "Unknown Scene";
  switch (payload.type) {
    case "background": return `${asset(payload.assetId)} · ${payload.transition}`;
    case "showCharacter": return `${character(payload.characterId)} · ${payload.placement}`;
    case "hideCharacter": return character(payload.characterId);
    case "changeAppearance": return character(payload.characterId);
    case "placement": return `${character(payload.characterId)} · ${payload.placement}`;
    case "dialogue": return `${character(payload.characterId)}: ${payload.text || "Empty dialogue"}`;
    case "narration": return payload.text || "Empty narration";
    case "playMusic": case "playSfx": return asset(payload.assetId);
    case "stopMusic": return "Stop current music";
    case "transition": return payload.transition;
    case "setVariable": return `${model.authoring.variables.find((item) => item.id === payload.variableId)?.technicalName ?? "variable"} = ${String(payload.value)}`;
    case "choice": return `${payload.options.length} option${payload.options.length === 1 ? "" : "s"}`;
    case "jump": return scene(payload.sceneId);
    case "return": return "Scene terminal";
    case "customCode": return payload.reason;
  }
}

interface BeatEditor { readonly host: HTMLElement; readonly controls: readonly HTMLElement[]; readonly primary: HTMLElement; readonly read: () => BeatPayload; readonly focus: () => void }

function buildBeatEditor(model: SceneWorkspace, payload: BeatPayload): BeatEditor {
  const host = document.createElement("div"); host.className = "beat-fields"; const controls: HTMLElement[] = [];
  const add = (label: string, control: HTMLElement): void => { controls.push(control); host.append(labelled(label, control)); };
  const transitions = (includeNone = true) => selectOf(([...(includeNone ? [{ value: "none" as const, label: "None" }] : []), { value: "dissolve" as const, label: "Dissolve" }, { value: "fade" as const, label: "Fade" }]), "transition" in payload ? payload.transition : "none");
  const placements = (selected?: string) => selectOf([{ value: "left" as const, label: "Left" }, { value: "centre" as const, label: "Centre" }, { value: "right" as const, label: "Right" }], selected);
  const characters = (selected?: string) => entitySelect(model.authoring.characters.map((item) => ({ id: item.id, label: item.displayName })), selected);
  const assets = (kind: Asset["kind"], selected?: string) => entitySelect(model.authoring.assets.filter((item) => item.kind === kind && item.status === "available").map((item) => ({ id: item.id, label: item.displayName })), selected);
  const scenes = (selected?: string) => entitySelect(model.scenes.map((item) => ({ id: item.id, label: item.displayName })), selected);
  let read: () => BeatPayload;
  switch (payload.type) {
    case "background": { const asset = assets("background", payload.assetId); const transition = transitions(); add("Background", asset); add("Transition", transition); read = () => ({ type: "background", assetId: required(asset), transition: transition.value as TransitionRef }); break; }
    case "showCharacter": { const character = characters(payload.characterId); const appearance = entitySelect(model.authoring.appearances.map((item) => ({ id: item.id, label: item.label })), payload.appearanceId); const placement = placements(payload.placement); const transition = transitions(); add("Character", character); add("Appearance", appearance); add("Placement", placement); add("Transition", transition); read = () => ({ type: "showCharacter", characterId: required(character), appearanceId: required(appearance), placement: placement.value as PlacementRef, transition: transition.value as TransitionRef }); break; }
    case "hideCharacter": { const character = characters(payload.characterId); const transition = transitions(); add("Character", character); add("Transition", transition); read = () => ({ type: "hideCharacter", characterId: required(character), transition: transition.value as TransitionRef }); break; }
    case "changeAppearance": { const character = characters(payload.characterId); const appearance = entitySelect(model.authoring.appearances.map((item) => ({ id: item.id, label: item.label })), payload.appearanceId); const transition = transitions(); add("Character", character); add("Appearance", appearance); add("Transition", transition); read = () => ({ type: "changeAppearance", characterId: required(character), appearanceId: required(appearance), transition: transition.value as TransitionRef }); break; }
    case "placement": { const character = characters(payload.characterId); const placement = placements(payload.placement); add("Character", character); add("Placement", placement); read = () => ({ type: "placement", characterId: required(character), placement: placement.value as PlacementRef }); break; }
    case "dialogue": { const character = characters(payload.characterId); const text = document.createElement("textarea"); text.value = payload.text; text.rows = 4; add("Speaker", character); add("Dialogue", text); read = () => ({ type: "dialogue", characterId: required(character), text: text.value }); break; }
    case "narration": { const text = document.createElement("textarea"); text.value = payload.text; text.rows = 4; add("Narration", text); read = () => ({ type: "narration", text: text.value }); break; }
    case "playMusic": { const asset = assets("music", payload.assetId); add("Music", asset); read = () => ({ type: "playMusic", assetId: required(asset) }); break; }
    case "stopMusic": read = () => ({ type: "stopMusic" }); break;
    case "playSfx": { const asset = assets("sfx", payload.assetId); add("SFX", asset); read = () => ({ type: "playSfx", assetId: required(asset) }); break; }
    case "transition": { const transition = transitions(false); add("Transition", transition); read = () => ({ type: "transition", transition: transition.value as "dissolve" | "fade" }); break; }
    case "setVariable": {
      const variable = entitySelect(model.authoring.variables.map((item) => ({ id: item.id, label: `${item.technicalName} · ${item.variableType}` })), payload.variableId);
      const valueHost = document.createElement("div"); let value: HTMLInputElement | HTMLSelectElement;
      const rebuild = (): void => { const selected = model.authoring.variables.find((item) => item.id === variable.value); if (selected?.variableType === "bool") value = selectOf([{ value: "false", label: "False" }, { value: "true", label: "True" }], String(payload.value)); else { value = input(String(payload.value)); if (selected?.variableType === "int") value.inputMode = "numeric"; } controls.push(value); valueHost.replaceChildren(value); };
      variable.addEventListener("change", rebuild); rebuild(); add("Variable", variable); host.append(labelled("Value", valueHost));
      read = () => { const selected = model.authoring.variables.find((item) => item.id === required(variable)); if (!selected) throw new Error("Select a Variable."); if (selected.variableType === "bool") return { type: "setVariable", variableId: selected.id, value: value.value === "true" }; if (selected.variableType === "int" && !validInt64(value.value)) throw new Error("Enter a canonical signed 64-bit decimal integer."); return { type: "setVariable", variableId: selected.id, value: value.value }; }; break;
    }
    case "choice": {
      const optionHost = document.createElement("div"); optionHost.className = "choice-options"; host.append(optionHost);
      const rows: { text: HTMLInputElement; destination: HTMLSelectElement; row: HTMLElement }[] = [];
      const addOption = (option: ChoiceOption = { text: "", destinationSceneId: model.scenes[0]?.id ?? "" }): void => { const row = document.createElement("div"); row.className = "choice-option"; const text = input(option.text); text.ariaLabel = "Choice option text"; const destination = scenes(option.destinationSceneId); destination.ariaLabel = "Choice destination Scene"; const markDirty = (): void => { const draft = host.closest<HTMLElement>(".scene-draft"); if (draft) draft.dataset.unsubmitted = "true"; }; text.addEventListener("input", markDirty); destination.addEventListener("change", markDirty); const remove = button("Remove", "text-button"); remove.addEventListener("click", () => { const index = rows.findIndex((item) => item.row === row); if (index >= 0) rows.splice(index, 1); row.remove(); markDirty(); }); row.append(text, destination, remove); rows.push({ text, destination, row }); controls.push(text, destination); optionHost.append(row); };
      payload.options.forEach(addOption); if (!rows.length) addOption(); const addChoice = button("Add option", "text-button"); addChoice.addEventListener("click", () => { addOption(); const draft = host.closest<HTMLElement>(".scene-draft"); if (draft) draft.dataset.unsubmitted = "true"; }); host.append(addChoice);
      read = () => { if (!rows.length) throw new Error("A Choice needs at least one option."); return { type: "choice", options: rows.map((row) => ({ text: requiredText(row.text, "Choice text"), destinationSceneId: required(row.destination) })) }; }; break;
    }
    case "jump": { const destination = scenes(payload.sceneId); add("Destination Scene", destination); read = () => ({ type: "jump", sceneId: required(destination) }); break; }
    case "return": read = () => ({ type: "return" }); break;
    case "customCode": read = () => payload; break;
  }
  const primary = controls[controls.length - 1] ?? host;
  return { host, controls, primary, read: read!, focus: () => (controls[0] as HTMLElement | undefined)?.focus() };
}

function defaultPayload(type: BeatPayload["type"], model: SceneWorkspace): BeatPayload {
  const characterId = model.authoring.characters[0]?.id ?? ""; const appearanceId = model.authoring.appearances.find((item) => item.characterId === characterId)?.id ?? "";
  switch (type) {
    case "background": return { type, assetId: model.authoring.assets.find((item) => item.kind === "background")?.id ?? "", transition: "none" };
    case "showCharacter": return { type, characterId, appearanceId, placement: "centre", transition: "none" };
    case "hideCharacter": return { type, characterId, transition: "none" };
    case "changeAppearance": return { type, characterId, appearanceId, transition: "none" };
    case "placement": return { type, characterId, placement: "centre" };
    case "dialogue": return { type, characterId, text: "" };
    case "narration": return { type, text: "" };
    case "playMusic": return { type, assetId: model.authoring.assets.find((item) => item.kind === "music")?.id ?? "" };
    case "stopMusic": return { type };
    case "playSfx": return { type, assetId: model.authoring.assets.find((item) => item.kind === "sfx")?.id ?? "" };
    case "transition": return { type, transition: "dissolve" };
    case "setVariable": { const variable = model.authoring.variables[0]; return { type, variableId: variable?.id ?? "", value: variable?.defaultValue ?? "" }; }
    case "choice": return { type, options: [{ text: "", destinationSceneId: model.scenes[0]?.id ?? "" }] };
    case "jump": return { type, sceneId: model.scenes[0]?.id ?? "" };
    case "return": return { type };
    case "customCode": return { type, source: "", reason: "Protected source" };
  }
}

function required(control: HTMLSelectElement): string { if (!control.value) { control.focus(); throw new Error("Select an available item first."); } return control.value; }
function requiredText(control: HTMLInputElement, name: string): string { if (!control.value.trim()) { control.focus(); throw new Error(`${name} is required.`); } return control.value.trim(); }
function validInt64(value: string): boolean { if (!/^-?(0|[1-9][0-9]*)$/.test(value) || value === "-0") return false; try { const parsed = BigInt(value); return parsed >= -9223372036854775808n && parsed <= 9223372036854775807n; } catch { return false; } }

export function renderRecoverySurface(host: HTMLElement, report: RecoveryReport, actions: RecoveryActions): void {
  host.replaceChildren(); host.className = "recovery-workspace";
  const eyebrow = document.createElement("p"); eyebrow.className = "eyebrow"; eyebrow.textContent = "Read-only project inspection";
  const title = document.createElement("h1"); title.textContent = "Recovery required";
  const copy = document.createElement("p"); copy.className = "panel-copy"; copy.textContent = "Loomlight will not write project files until each interrupted transaction reaches a proven terminal state. Evidence is retained after resolution.";
  host.append(eyebrow, title, copy);
  if (!report.items.length) { const done = document.createElement("p"); done.className = "state-banner success-state"; done.textContent = "Recovery is complete. Revalidating the project…"; host.append(done); actions.completed(); return; }
  for (const item of report.items) {
    const panel = document.createElement("section"); panel.className = "recovery-item";
    const heading = document.createElement("h2"); heading.textContent = `Transaction ${item.transactionId}`;
    const state = document.createElement("p"); state.textContent = `Journal state: ${item.state.name}${item.code ? ` · ${item.code}` : ""}`;
    const evidence = document.createElement("table"); const head = document.createElement("thead"); const headRow = document.createElement("tr"); ["Affected path", "Accepted copy", "Displaced copy"].forEach((label) => { const th = document.createElement("th"); th.textContent = label; headRow.append(th); }); head.append(headRow); const body = document.createElement("tbody");
    item.affected.forEach((entry) => { const row = document.createElement("tr"); [entry.path, entry.acceptedRetained ? "Retained" : "Not present", entry.displacedRetained ? "Retained" : "Not present"].forEach((value) => { const cell = document.createElement("td"); cell.textContent = value; row.append(cell); }); body.append(row); }); evidence.append(head, body);
    const safeKeep = item.mutations.every((value) => value === "preparedWithoutStage" || value === "stagedWithBaseIntact");
    const safeAccept = item.mutations.every((value) => value === "exchangeCompleteExpected" || value === "durable");
    const explanation = document.createElement("p"); explanation.className = safeKeep || safeAccept ? "muted" : "error-message";
    explanation.textContent = safeKeep ? "The current project bytes are still the verified base. Keeping them is supported." : safeAccept ? "Every target contains the verified Loomlight result. Accepting it is supported." : "This state is ambiguous. Loomlight will retain evidence and remain blocked; no automatic resolution is offered.";
    panel.append(heading, state, evidence, explanation);
    if (safeKeep || safeAccept) {
      const confirm = document.createElement("input"); confirm.type = "checkbox"; confirm.id = `confirm-${item.transactionId}`;
      const confirmLabel = labelled("I reviewed the affected files and retained evidence", confirm);
      const resolve = button(safeKeep ? "Keep current project files" : "Accept verified Loomlight files", "button danger"); resolve.disabled = true; confirm.addEventListener("change", () => { resolve.disabled = !confirm.checked; });
      resolve.addEventListener("click", async () => { resolve.disabled = true; actions.status("Resolving and revalidating…"); try { const next = await actions.resolve(item.transactionId, safeKeep ? "keepCurrent" : "acceptLoomlight"); renderRecoverySurface(host, next, actions); } catch (error) { resolve.disabled = !confirm.checked; actions.status(friendlyError(error, "Recovery could not be resolved"), "error"); confirm.focus(); } });
      panel.append(confirmLabel, resolve);
    }
    host.append(panel);
  }
}
