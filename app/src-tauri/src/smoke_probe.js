setTimeout(async () => {
  const invoke = window.__TAURI_INTERNALS__.invoke;
  const known = await invoke("core_request", {
    request: { protocolVersion: 1, requestId: "smoke-health", operation: "system.health", payload: {} },
  }).then((value) => value?.ok === true && value?.value?.status === "ready", () => false);
  const malformedPayloadDenied = await invoke("core_request", {
    request: { protocolVersion: 1, requestId: "smoke-malformed", operation: "system.health", payload: { extra: true } },
  }).then((value) => value?.ok === false && value?.error?.code === "INVALID_PAYLOAD", () => false);
  const unknownCommandDenied = await invoke("unlisted_command", {}).then(() => false, () => true);
  const ambientFilesystemDenied = await invoke("plugin:fs|read_text_file", { path: "/synthetic-denied" }).then(() => false, () => true);
  const ambientProcessDenied = await invoke("plugin:shell|execute", { program: "synthetic-denied" }).then(() => false, () => true);
  const ambientHttpDenied = await invoke("plugin:http|fetch", { url: "https://example.invalid" }).then(() => false, () => true);
  const networkDenied = await fetch("https://example.invalid/loomlight-probe").then(() => false, () => true);
  window.open("https://example.invalid/loomlight-popup");
  const popupRequestIssued = true;
  const nodeGlobalsDenied = typeof process === "undefined" && typeof require === "undefined";
  const rendererSecretsAbsent =
    !Object.keys(window).some((key) => /loomlight.*(?:credential|secret|token)|(?:credential|secret).*loomlight/i.test(key)) &&
    localStorage.length === 0 &&
    sessionStorage.length === 0 &&
    !document.documentElement.textContent.includes("sentinel");
  const buttons = [...document.querySelectorAll("button")];
  const newProject = buttons.find((button) => button.textContent === "New Project");
  const openProject = buttons.find((button) => button.textContent === "Open Loomlight Project");
  const welcomeLifecycleVisible = Boolean(newProject && openProject);
  newProject?.click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const pageText = document.body.textContent ?? "";
  const newProjectWizardVisible =
    pageText.includes("Project details") &&
    pageText.includes("Ren'Py SDK") &&
    pageText.includes("Game configuration") &&
    pageText.includes("Review & Create");
  let supportingAuthoringUiPassed = false;
  let supportingAuthoringStage = "not-started";
  let sceneAuthoringUiPassed = false;
  let sceneAuthoringStage = "not-started";
  let sourceAuthoringUiPassed = false;
  let sourceAuthoringStage = "not-started";
  let restoreSmokeRequester = () => {};
  try {
    const project = {
      sessionId: "smoke-session", projectId: "smoke-project", title: "Smoke Project",
      folderName: "smoke-project", chapterId: "chapter", chapterName: "Chapter 1",
      sceneId: "scene", sceneName: "Scene 1", sdkVersion: "8.5.3",
      resolution: { width: 1920, height: 1080 },
    };
    const model = {
      schemaVersion: 1, projectId: "smoke-project",
      characters: [{
        id: "character", technicalName: "alice", displayName: "Alice",
        dialogueColor: "#abcdef", defaultAppearanceId: "appearance-one",
        source: { path: "game/definitions/characters.rpy", statement: "define alice = Character(\"Alice\", color=\"#abcdef\")", sourceRevision: "0".repeat(64) },
      }],
      appearances: [
        { id: "appearance-one", characterId: "character", label: "happy", attributes: { expression: "happy", outfit: "default", pose: "default" }, renderMode: "staticImportedAsset", assetId: "asset-one" },
        { id: "appearance-two", characterId: "character", label: "sad", attributes: { expression: "sad", outfit: "default", pose: "default" }, renderMode: "staticImportedAsset", assetId: "asset-two" },
      ],
      assets: [{ id: "legacy", kind: "background", displayName: "Cafe", relativePath: "game/images/bg_cafe.png", discoveryName: "bg cafe", sha256: "1".repeat(64), byteCount: 4, status: "compatibilityRequired" }],
      variables: [{ id: "score", technicalName: "score", variableType: "int", defaultValue: "9007199254740993", source: { path: "game/definitions/variables.rpy", statement: "default score = 9007199254740993", sourceRevision: "2".repeat(64) } }],
    };
    const sceneWorkspace = {
      projectRevision: "3".repeat(64), sourceMapRevision: "4".repeat(64), entrySceneId: "scene",
      lastOpen: { chapterId: "chapter", sceneId: "scene" }, canUndo: true, canRedo: false,
      chapters: [
        { id: "chapter", displayName: "Chapter 1", directory: "game/chapters/chapter_01" },
        { id: "chapter-two", displayName: "Chapter 2", directory: "game/chapters/chapter_02" },
      ],
      scenes: [{
        id: "scene", chapterId: "chapter", displayName: "Scene 1", technicalLabel: "scene_one",
        sourcePath: "game/chapters/chapter_01/scene_001.rpy", sourceRevision: "5".repeat(64), sourceConflict: false, partial: true,
        beats: [
          { id: "custom", byteStart: 16, byteEnd: 30, protected: true, payload: { type: "customCode", source: "python:", reason: "Runtime-dependent source" } },
          { id: "background", byteStart: 30, byteEnd: 50, protected: false, payload: { type: "background", assetId: "background", transition: "dissolve" } },
          { id: "dialogue", byteStart: 50, byteEnd: 70, protected: false, payload: { type: "dialogue", characterId: "character", text: "Hello" } },
          { id: "music", byteStart: 70, byteEnd: 90, protected: false, payload: { type: "playMusic", assetId: "music" } },
          { id: "choice", byteStart: 90, byteEnd: 130, protected: false, payload: { type: "choice", options: [{ text: "Continue", destinationSceneId: "scene-two" }] } },
        ],
      }, {
        id: "scene-two", chapterId: "chapter-two", displayName: "Scene 2", technicalLabel: "scene_two",
        sourcePath: "game/chapters/chapter_02/scene_001.rpy", sourceRevision: "6".repeat(64), sourceConflict: false, partial: false,
        beats: [{ id: "return-two", byteStart: 16, byteEnd: 27, protected: false, payload: { type: "return" } }],
      }],
      authoring: {
        characters: model.characters,
        appearances: model.appearances,
        assets: [
          { id: "background", kind: "background", displayName: "Cafe", status: "available", sha256: "7".repeat(64) },
          { id: "asset-one", kind: "characterAppearance", displayName: "Alice happy", status: "available", sha256: "8".repeat(64) },
          { id: "music", kind: "music", displayName: "Theme", status: "available", sha256: "9".repeat(64) },
        ],
        variables: model.variables,
      },
    };
    let sourceDocument = {
      path: "game/chapters/chapter_01/scene_001.rpy", text: "label scene_one:\n    python:\n        score += 1\n    return\n",
      state: "clean", editable: true, dirty: false, baseRevision: "5".repeat(64), liveRevision: "5".repeat(64), draftVersion: 0,
      hasBom: false, newline: "LF", partial: true, diagnostics: [], selectionStart: 0, selectionEnd: 0,
      selectedSceneId: null, selectedBeatId: null, canApplyBoth: false, combinedPreview: null, externalText: null,
      ranges: [
        { sceneId: "scene", beatId: "custom", kind: "customCode", byteStart: 17, byteEnd: 49, editorStart: 17, editorEnd: 49, protected: true },
        { sceneId: "scene", beatId: "return", kind: "return", byteStart: 49, byteEnd: 60, editorStart: 49, editorEnd: 60, protected: false },
      ],
    };
    const called = new Set();
    const operationCounts = new Map();
    const sourceCommandTrace = [];
    let acceptedSourceText = sourceDocument.text;
    let retainedSourceDraft = null;
    let exactInteger = false;
    let exactIntegerUpdate = false;
    let releaseVariableUpdate;
    let overlappingFlushSuppressed = false;
    let importChoiceCount = 0;
    let sceneApplyCount = 0;
    const mediaPurposes = [];
    let projectStatus = "saved";
    let recoveryReport = { items: [] };
    const smokeRequester = async (operation, payload = {}) => {
      const request = {
        protocolVersion: 1,
        requestId: `packaged-smoke-${crypto.randomUUID()}`,
        operation,
        payload,
      };
      called.add(request.operation);
      operationCounts.set(request.operation, (operationCounts.get(request.operation) ?? 0) + 1);
      let value = model;
      if (request.operation === "project.openPicker") value = project;
      if (request.operation === "project.listRecent") value = [];
      if (request.operation === "project.status") {
        value = projectStatus === "recoveryRequired"
          ? "recoveryRequired"
          : projectStatus === "conflict"
            ? "conflict"
            : sourceDocument.state === "conflict" || sourceDocument.state === "invalid" || sourceDocument.state === "unavailable"
              ? "conflict"
              : sourceDocument.dirty ? "pendingValidation" : "saved";
      }
      if (request.operation === "project.flush") value = null;
      if (request.operation === "scene.list") value = sceneWorkspace;
      if (request.operation === "scene.apply") {
        sceneApplyCount += 1;
        value = sceneWorkspace;
      }
      if (request.operation === "scene.recovery") value = recoveryReport;
      if (request.operation === "source.list") value = {
        files: [{ path: sourceDocument.path, state: sourceDocument.state, sceneId: "scene", dirty: sourceDocument.dirty, readOnly: false }],
        dirtyCount: sourceDocument.dirty ? 1 : 0, draftBytes: sourceDocument.dirty ? sourceDocument.text.length : 0,
      };
      if (request.operation === "source.open") value = sourceDocument;
      if (request.operation === "source.updateDraft") {
        const nextDraft = request.payload.text === acceptedSourceText ? null : request.payload.text;
        const changed = retainedSourceDraft !== nextDraft;
        retainedSourceDraft = nextDraft;
        sourceDocument = {
          ...sourceDocument,
          text: request.payload.text,
          state: nextDraft === null ? "clean" : "dirty",
          dirty: nextDraft !== null,
          draftVersion: sourceDocument.draftVersion + Number(changed),
          selectionStart: request.payload.selectionStart,
          selectionEnd: request.payload.selectionEnd,
        };
        value = sourceDocument;
      }
      if (request.operation === "source.save") {
        acceptedSourceText = retainedSourceDraft ?? acceptedSourceText;
        retainedSourceDraft = null;
        sourceDocument = { ...sourceDocument, state: "clean", dirty: false, draftVersion: sourceDocument.draftVersion + 1 };
        value = sourceDocument;
      }
      if (request.operation === "scene.resolveRecovery") {
        projectStatus = "saved";
        recoveryReport = { items: [] };
        value = recoveryReport;
      }
      if (request.operation === "media.present") {
        mediaPurposes.push(request.payload.purpose);
        const audio = request.payload.purpose === "audioAudition";
        value = {
          assetId: request.payload.assetId, purpose: request.payload.purpose,
          mimeType: audio ? "audio/ogg" : "image/png", dataBase64: audio ? "T2dnUw==" : "iVBORw0KGgo=",
          sha256: audio ? "9".repeat(64) : "7".repeat(64), byteCount: 8,
          width: audio ? null : 1, height: audio ? null : 1,
          cacheKey: `${request.payload.assetId}:smoke`,
        };
      }
      if (request.operation === "asset.chooseImport") {
        importChoiceCount += 1;
        value = importChoiceCount === 1
          ? { authorityId: "retained-import", displayName: "happy.png", byteCount: 4, extension: "png" }
          : { cancelled: true };
      }
      if (request.operation === "variable.create") {
        exactInteger = request.payload.defaultValue === "9223372036854775807";
      }
      if (request.operation === "variable.update") {
        exactIntegerUpdate = request.payload.defaultValue === "-9223372036854775808";
        await new Promise((resolve) => { releaseVariableUpdate = resolve; });
      }
      return { protocolVersion: 1, requestId: request.requestId, ok: true, value };
    };
    supportingAuthoringStage = "install-requester";
    if (typeof window.__loomlightInstallSmokeRequester !== "function") throw new Error("Missing smoke requester hook.");
    restoreSmokeRequester = window.__loomlightInstallSmokeRequester(smokeRequester);
    const waitFor = async (condition, description) => {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (condition()) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      throw new Error(`Timed out waiting for ${description}`);
    };
    const awaitSurface = async (label) => {
      supportingAuthoringStage = label;
      await waitFor(
        () => [...document.querySelectorAll("button")].some((item) => item.textContent === label),
        label,
      );
    };
    const awaitCall = async (operation) => {
      supportingAuthoringStage = operation;
      await waitFor(() => called.has(operation), operation);
      await new Promise((resolve) => setTimeout(resolve, 20));
    };
    const awaitSceneCommit = async (count, description) => {
      await waitFor(() => sceneApplyCount >= count, description);
      await waitFor(
        () => document.querySelector("#app-status")?.textContent === "Saved"
          && !document.querySelector('.scene-draft[data-unsubmitted="true"]'),
        `${description} committed render`,
      );
    };
    const click = (label) => {
      const target = [...document.querySelectorAll("button")].find((item) => item.textContent === label);
      if (!target) throw new Error(`Missing ${label}`);
      target.click();
    };
    const control = (label) => {
      const wrapper = [...document.querySelectorAll("label")].find((item) => item.firstElementChild?.textContent === label);
      const target = wrapper?.querySelector("input, select");
      if (!target) throw new Error(`Missing ${label}`);
      return target;
    };
    supportingAuthoringStage = "welcome";
    click("Loomlight");
    await awaitSurface("Open Loomlight Project");
    click("Open Loomlight Project");
    await awaitSurface("Characters");
    click("Characters");
    await awaitSurface("Add Appearance");
    const characterVisible = document.body.textContent.includes("Add Appearance");
    supportingAuthoringStage = "set-default";
    click("Set default");
    await awaitCall("appearance.setDefault");
    click("Characters");
    await awaitSurface("Add Appearance");
    supportingAuthoringStage = "edit-character";
    click("Edit");
    const characterName = control("Display name");
    characterName.value = "Alice Updated";
    characterName.dispatchEvent(new Event("input", { bubbles: true }));
    click("Save Character");
    await awaitCall("character.update");
    click("Characters");
    await awaitSurface("Add Appearance");
    supportingAuthoringStage = "add-appearance";
    click("Add Appearance");
    const expression = control("Expression token");
    expression.value = "delighted";
    expression.dispatchEvent(new Event("input", { bubbles: true }));
    click("Choose image…");
    await awaitCall("asset.import");
    click("Characters");
    await awaitSurface("Create Character");
    supportingAuthoringStage = "create-character";
    control("Technical variable (fixed after creation)").value = "new_character";
    control("Display name").value = "New Character";
    click("Create Character");
    await awaitCall("character.create");
    click("Variables");
    await awaitSurface("Create Variable");
    supportingAuthoringStage = "create-variable";
    control("Technical name (fixed after creation)").value = "maximum";
    const variableType = control("Type");
    variableType.value = "int";
    variableType.dispatchEvent(new Event("change", { bubbles: true }));
    const defaultValue = control("Default value");
    defaultValue.value = "9223372036854775807";
    defaultValue.dispatchEvent(new Event("input", { bubbles: true }));
    click("Create Variable");
    await awaitCall("variable.create");
    click("Variables");
    await awaitSurface("Edit default");
    supportingAuthoringStage = "update-variable";
    click("Edit default");
    const editedDefault = control("Default value");
    editedDefault.value = "-9223372036854775808";
    editedDefault.dispatchEvent(new Event("input", { bubbles: true }));
    click("Save Default");
    await waitFor(() => called.has("variable.update"), "variable.update");
    supportingAuthoringStage = "overlapping-flush";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    overlappingFlushSuppressed = !called.has("project.flush")
      && document.querySelector("#app-status")?.textContent === "Authoring operation in progress — no additional Flush started";
    releaseVariableUpdate?.();
    await waitFor(() => document.querySelector("#app-status")?.textContent === "Saved", "completed variable update");
    supportingAuthoringStage = "flush";
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
    await awaitCall("project.flush");
    click("Assets");
    await awaitSurface("Choose and import…");
    supportingAuthoringStage = "cancel-import";
    const technical = control("Technical name");
    technical.value = "theme";
    technical.dispatchEvent(new Event("input", { bubbles: true }));
    click("Choose and import…");
    await waitFor(() => importChoiceCount === 2, "cancelled asset choice");
    await new Promise((resolve) => setTimeout(resolve, 20));
    const cancelledPreserved = technical.value === "theme"
      && [...document.querySelectorAll("button")].find((item) => item.textContent === "Choose and import…")?.disabled === false;
    supportingAuthoringStage = "repair-compatibility";
    click("Repair Ren'Py asset names");
    await awaitCall("asset.repairCompatibility");
    supportingAuthoringUiPassed = characterVisible
      && exactInteger
      && exactIntegerUpdate
      && overlappingFlushSuppressed
      && cancelledPreserved
      && called.has("appearance.setDefault")
      && called.has("character.create")
      && called.has("character.update")
      && called.has("variable.create")
      && called.has("variable.update")
      && called.has("asset.chooseImport")
      && called.has("asset.import")
      && called.has("project.flush")
      && called.has("asset.repairCompatibility");
    const requiredCalls = ["appearance.setDefault", "character.create", "character.update", "variable.create", "variable.update", "asset.chooseImport", "asset.import", "project.flush", "asset.repairCompatibility"];
    supportingAuthoringStage = !characterVisible ? "missing-character-surface"
      : !exactInteger ? "inexact-variable-create"
      : !exactIntegerUpdate ? "inexact-variable-update"
      : !overlappingFlushSuppressed ? "overlapping-flush-not-suppressed"
      : !cancelledPreserved ? "cancel-state-lost"
      : requiredCalls.find((operation) => !called.has(operation)) ?? "complete";

    sceneAuthoringStage = "open-scene-workspace";
    click("Story");
    await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Add Beat"), "Add Beat");
    await waitFor(() => called.has("scene.list") && called.has("media.present"), "Scene data and image presentation");
    const previewVisible = document.body.textContent.includes("Scene Preview")
      && document.body.textContent.includes("Beats")
      && document.body.textContent.includes("Partial / unknown")
      && document.body.textContent.includes("Visible state and provenance");
    const allocation = control("Preview size");
    const allocationCorrect = allocation.value === "52";
    const accessibleReorder = [...document.querySelectorAll("button")]
      .some((item) => item.ariaLabel === "Move scene Scene 1 down")
      && [...document.querySelectorAll("button")]
        .some((item) => item.ariaLabel === "Move beat 3 down");
    sceneAuthoringStage = "continue-dialogue";
    const dialogueButton = [...document.querySelectorAll("button")]
      .find((item) => item.textContent?.startsWith("3. Dialogue"));
    if (!dialogueButton) throw new Error("Missing Dialogue Beat");
    dialogueButton.click();
    const dialogue = document.querySelector(".expanded-beat textarea");
    if (!dialogue) throw new Error("Missing expanded Dialogue editor");
    dialogue.value = "Packaged Scene authoring";
    dialogue.dispatchEvent(new Event("input", { bubbles: true }));
    dialogue.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }));
    await awaitSceneCommit(1, "Dialogue continuation transaction");
    sceneAuthoringStage = "choice-create-scene";
    const choiceButton = [...document.querySelectorAll("button")]
      .find((item) => item.textContent?.startsWith("5. Choice"));
    if (!choiceButton) throw new Error("Missing Choice Beat");
    choiceButton.click();
    click("Create New Scene");
    const choiceFields = [...document.querySelectorAll(".choice-new-scene input")];
    if (choiceFields.length !== 2) throw new Error("Missing Create New Scene fields");
    choiceFields[0].value = "A new path";
    choiceFields[0].dispatchEvent(new Event("input", { bubbles: true }));
    choiceFields[1].value = "New destination";
    choiceFields[1].dispatchEvent(new Event("input", { bubbles: true }));
    click("Create Scene and option");
    await awaitSceneCommit(2, "Create New Scene Choice transaction");
    sceneAuthoringStage = "audio-audition";
    const audioBeforeClick = mediaPurposes.filter((purpose) => purpose === "audioAudition").length;
    click("Audition current music");
    await waitFor(() => mediaPurposes.filter((purpose) => purpose === "audioAudition").length > audioBeforeClick, "explicit audio audition");
    const audioIntentional = audioBeforeClick === 0;

    sourceAuthoringStage = "open-source-workspace";
    click("Source");
    await waitFor(() => document.querySelector(".source-editor"), "Source editor");
    const sourceSurfaceVisible = document.body.textContent.includes("Mapped ranges")
      && document.body.textContent.includes("Custom Code")
      && document.querySelectorAll(".source-line-numbers").length === 1;
    sourceAuthoringStage = "retain-button-draft";
    let sourceEditor = document.querySelector(".source-editor");
    sourceEditor.value = sourceEditor.value.replace("score += 1", "score += 2");
    sourceEditor.dispatchEvent(new Event("input", { bubbles: true }));
    await waitFor(() => sourceDocument.dirty, "Source draft retention");
    await waitFor(() => {
      const save = document.querySelector('button[data-source-action="save"]');
      return save && !save.disabled && document.querySelector("#app-status")?.textContent === "Pending validation";
    }, "Source dirty UI state");
    const buttonSaveBefore = operationCounts.get("source.save") ?? 0;
    const buttonFlushBefore = operationCounts.get("project.flush") ?? 0;
    sourceAuthoringStage = "source-button-save";
    click("Save Source");
    await waitFor(() => (operationCounts.get("source.save") ?? 0) === buttonSaveBefore + 1 && !sourceDocument.dirty, "visible Source acceptance");
    await waitFor(() => document.querySelector("[data-source-busy]")?.getAttribute("data-source-busy") === "false", "Source Save barrier release");
    const buttonFlushDelta = (operationCounts.get("project.flush") ?? 0) - buttonFlushBefore;
    sourceCommandTrace.push(`button:source:generation-current:completed:saves=1:flushes=${buttonFlushDelta}:saved`);
    sourceEditor = document.querySelector(".source-editor");
    const selectionUpdateBefore = operationCounts.get("source.updateDraft") ?? 0;
    sourceEditor.setSelectionRange(5, 5);
    sourceEditor.dispatchEvent(new Event("select", { bubbles: true }));
    await waitFor(
      () => (operationCounts.get("source.updateDraft") ?? 0) > selectionUpdateBefore
        && !sourceDocument.dirty
        && sourceDocument.selectionStart === 5
        && sourceDocument.selectionEnd === 5,
      "selection-only clean stability",
    );

    sourceAuthoringStage = "retain-shortcut-draft";
    sourceEditor.value = sourceEditor.value.replace("score += 2", "score += 3");
    sourceEditor.dispatchEvent(new Event("input", { bubbles: true }));
    await waitFor(() => sourceDocument.dirty, "fresh shortcut Source draft");
    const shortcutSaveBefore = operationCounts.get("source.save") ?? 0;
    const shortcutFlushBefore = operationCounts.get("project.flush") ?? 0;
    sourceAuthoringStage = "source-synthetic-shortcut-save";
    sourceEditor.focus();
    const sourceSaveShortcut = new Event("keydown", { bubbles: true, cancelable: true, composed: true });
    const macPlatform = /Mac|iPhone|iPad|iPod/.test(navigator.platform);
    Object.defineProperties(sourceSaveShortcut, {
      key: { value: "s" },
      ctrlKey: { value: !macPlatform },
      metaKey: { value: macPlatform },
      altKey: { value: false },
      shiftKey: { value: false },
      repeat: { value: false },
      isComposing: { value: false },
    });
    if (sourceEditor.dispatchEvent(sourceSaveShortcut)) throw new Error("Source save shortcut was not handled by the focused editor");
    try {
      await waitFor(() => (operationCounts.get("source.save") ?? 0) === shortcutSaveBefore + 1 && !sourceDocument.dirty, "synthetic Source shortcut acceptance");
    } catch (error) {
      const status = document.querySelector("#app-status")?.textContent ?? "missing";
      throw new Error(`${error instanceof Error ? error.message : String(error)}; status=${status}; counts=${JSON.stringify(Object.fromEntries(operationCounts))}`);
    }
    const shortcutFlushDelta = (operationCounts.get("project.flush") ?? 0) - shortcutFlushBefore;
    sourceCommandTrace.push(`keyboard-synthetic:source:${macPlatform ? "meta" : "ctrl"}+s:generation-current:completed:saves=1:flushes=${shortcutFlushDelta}:saved`);
    await waitFor(() => document.querySelector("#app-status")?.textContent === "Saved", "Source saved status");

    sourceAuthoringStage = "source-clean-flush";
    const cleanFlushBefore = operationCounts.get("project.flush") ?? 0;
    const cleanSaveBefore = operationCounts.get("source.save") ?? 0;
    sourceEditor = document.querySelector(".source-editor");
    sourceEditor.focus();
    const cleanShortcut = new KeyboardEvent("keydown", { key: "s", ctrlKey: !macPlatform, metaKey: macPlatform, bubbles: true, cancelable: true });
    sourceEditor.dispatchEvent(cleanShortcut);
    await waitFor(() => (operationCounts.get("project.flush") ?? 0) === cleanFlushBefore + 1, "clean Source Flush");
    const cleanSaveDelta = (operationCounts.get("source.save") ?? 0) - cleanSaveBefore;
    sourceCommandTrace.push(`keyboard-synthetic:source-clean:${macPlatform ? "meta" : "ctrl"}+s:generation-current:completed:saves=${cleanSaveDelta}:flushes=1:saved`);

    sourceAuthoringStage = "non-source-flush";
    click("Characters");
    await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Add Appearance"), "non-Source workspace");
    const nonSourceFlushBefore = operationCounts.get("project.flush") ?? 0;
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: !macPlatform, metaKey: macPlatform, bubbles: true, cancelable: true }));
    await waitFor(() => (operationCounts.get("project.flush") ?? 0) === nonSourceFlushBefore + 1, "non-Source Flush");
    sourceCommandTrace.push(`keyboard-synthetic:non-source:${macPlatform ? "meta" : "ctrl"}+s:completed:flushes=1:saved`);
    sourceAuthoringUiPassed = sourceSurfaceVisible
      && sourceDocument.text.includes("score += 3")
      && called.has("source.list")
      && called.has("source.open")
      && called.has("source.updateDraft")
      && (operationCounts.get("source.save") ?? 0) === shortcutSaveBefore + 1
      && (operationCounts.get("project.flush") ?? 0) === nonSourceFlushBefore + 1
      && buttonFlushDelta === 0
      && shortcutFlushDelta === 0
      && cleanSaveDelta === 0;
    sourceAuthoringStage = sourceAuthoringUiPassed ? "complete" : "assertions-failed";

    sceneAuthoringStage = "safe-recovery";
    projectStatus = "recoveryRequired";
    recoveryReport = { items: [{
      transactionId: "smoke-recovery", state: { name: "recoveryRequired" }, code: null,
      mutations: ["stagedWithBaseIntact"],
      affected: [{ path: "game/chapters/chapter_01/scene_001.rpy", acceptedRetained: true, displacedRetained: true }],
    }] };
    click("Characters"); await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Add Appearance"), "Characters during recovery smoke"); click("Story");
    await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Keep current project files"), "safe recovery action");
    const recoveryEvidenceVisible = document.body.textContent.includes("Accepted copy")
      && document.body.textContent.includes("Displaced copy");
    const recoveryConfirm = document.querySelector("#confirm-smoke-recovery");
    if (!recoveryConfirm) throw new Error("Missing recovery confirmation");
    recoveryConfirm.click(); click("Keep current project files");
    await waitFor(() => document.body.textContent.includes("Scene Preview"), "Scene Preview after recovery");
    const safeRecoveryCompleted = projectStatus === "saved";

    sceneAuthoringStage = "ambiguous-recovery";
    projectStatus = "recoveryRequired";
    recoveryReport = { items: [{
      transactionId: "smoke-ambiguous", state: { name: "recoveryRequired" }, code: null,
      mutations: ["ambiguous"],
      affected: [{ path: "game/chapters/chapter_02/scene_001.rpy", acceptedRetained: true, displacedRetained: true }],
    }] };
    click("Characters"); await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Add Appearance"), "Characters before ambiguous recovery"); click("Story");
    await waitFor(() => document.body.textContent.includes("This state is ambiguous"), "ambiguous recovery refusal");
    const ambiguousRefused = ![...document.querySelectorAll("button")]
      .some((item) => item.textContent?.includes("project files") || item.textContent?.includes("Loomlight files"));

    sceneAuthoringStage = "conflict-presentation";
    projectStatus = "conflict";
    sceneWorkspace.scenes[0].sourceConflict = true;
    click("Characters"); await waitFor(() => [...document.querySelectorAll("button")].some((item) => item.textContent === "Add Appearance"), "Characters before conflict state"); click("Story");
    await waitFor(() => document.body.textContent.includes("Source conflict"), "Scene source conflict state");
    const conflictVisible = document.body.textContent.includes("Scene writes and history are blocked");
    sceneWorkspace.scenes[0].sourceConflict = false;
    sceneAuthoringUiPassed = previewVisible
      && allocationCorrect
      && accessibleReorder
      && sceneApplyCount >= 2
      && audioIntentional
      && recoveryEvidenceVisible
      && safeRecoveryCompleted
      && ambiguousRefused
      && conflictVisible
      && called.has("scene.list")
      && called.has("scene.apply")
      && called.has("scene.recovery")
      && called.has("scene.resolveRecovery")
      && called.has("media.present");
    sceneAuthoringStage = sceneAuthoringUiPassed ? "complete" : "assertions-failed";
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (sourceAuthoringStage !== "not-started" && sourceAuthoringStage !== "complete") {
      sourceAuthoringStage = `${sourceAuthoringStage}: ${detail}`;
    } else if (sceneAuthoringStage !== "not-started" && sceneAuthoringStage !== "complete") {
      sceneAuthoringStage = `${sceneAuthoringStage}: ${detail}`;
    } else if (supportingAuthoringStage !== "not-started" && supportingAuthoringStage !== "complete") {
      supportingAuthoringStage = `${supportingAuthoringStage}: ${detail}`;
    }
    if (supportingAuthoringStage !== "complete") supportingAuthoringUiPassed = false;
    sceneAuthoringUiPassed = false;
    sourceAuthoringUiPassed = false;
  } finally {
    restoreSmokeRequester();
  }
  const shellSaveTrace = typeof window.__loomlightReadSaveTrace === "function"
    ? window.__loomlightReadSaveTrace().join("|")
    : "missing";
  const sourceCommandTracePassed = sourceCommandTrace.length === 4
    && sourceCommandTrace[0]?.includes("button:source:generation-current:completed:saves=1:flushes=0:saved")
    && sourceCommandTrace[1]?.includes("keyboard-synthetic:source:")
    && sourceCommandTrace[1]?.includes(":completed:saves=1:flushes=0:saved")
    && sourceCommandTrace[2]?.includes("keyboard-synthetic:source-clean:")
    && sourceCommandTrace[2]?.includes(":completed:saves=0:flushes=1:saved")
    && sourceCommandTrace[3]?.includes("keyboard-synthetic:non-source:")
    && sourceCommandTrace[3]?.includes(":completed:flushes=1:saved")
    && shellSaveTrace.includes("route=source;origin=toolbar")
    && shellSaveTrace.includes("route=source;origin=keyboard")
    && shellSaveTrace.includes("phase=accepted")
    && shellSaveTrace.includes("phase=flushed")
    && shellSaveTrace.includes("route=flush;origin=keyboard;context=non-source;phase=completed");
  await invoke("core_request", {
    request: {
      protocolVersion: 1,
      requestId: "smoke-report",
      operation: "probe.smokeReport",
      payload: {
        ambientFilesystemDenied,
        ambientHttpDenied,
        ambientProcessDenied,
        malformedPayloadDenied,
        networkDenied,
        nodeGlobalsDenied,
        popupRequestIssued,
        rendererSecretsAbsent,
        sceneAuthoringStage,
        sceneAuthoringUiPassed,
        sourceAuthoringStage,
        sourceAuthoringUiPassed,
        sourceCommandTrace: `${sourceCommandTrace.join("|")}|shell=${shellSaveTrace}`,
        sourceCommandTracePassed,
        supportingAuthoringStage,
        supportingAuthoringUiPassed,
        welcomeLifecycleVisible,
        newProjectWizardVisible,
        unauthorisedWindowDenied: known && window.__loomlightUnauthorisedDenied === true,
        unknownCommandDenied,
      },
    },
  }).then((value) => {
    if (value?.ok !== true) throw new Error("Smoke report was rejected.");
  });
}, 100);
