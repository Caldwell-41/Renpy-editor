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
  const originalInternalInvoke = window.__TAURI_INTERNALS__.invoke;
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
    const called = new Set();
    let exactInteger = false;
    let exactIntegerUpdate = false;
    let importChoiceCount = 0;
    window.__TAURI_INTERNALS__.invoke = async (command, args) => {
      if (command !== "core_request") return originalInternalInvoke(command, args);
      const request = args.request;
      called.add(request.operation);
      let value = model;
      if (request.operation === "project.openPicker") value = project;
      if (request.operation === "project.listRecent") value = [];
      if (request.operation === "project.status") value = "saved";
      if (request.operation === "project.flush") value = null;
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
      }
      return { protocolVersion: 1, requestId: request.requestId, ok: true, value };
    };
    const wait = () => new Promise((resolve) => setTimeout(resolve, 0));
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
    click("Loomlight");
    await wait();
    click("Open Loomlight Project");
    await wait();
    click("Characters");
    await wait();
    const characterVisible = document.body.textContent.includes("Add Appearance");
    click("Set default");
    await wait();
    click("Characters");
    await wait();
    click("Edit");
    const characterName = control("Display name");
    characterName.value = "Alice Updated";
    characterName.dispatchEvent(new Event("input", { bubbles: true }));
    click("Save Character");
    await wait();
    click("Characters");
    await wait();
    click("Add Appearance");
    const expression = control("Expression token");
    expression.value = "delighted";
    expression.dispatchEvent(new Event("input", { bubbles: true }));
    click("Choose image…");
    await wait();
    click("Characters");
    await wait();
    control("Technical variable (fixed after creation)").value = "new_character";
    control("Display name").value = "New Character";
    click("Create Character");
    await wait();
    click("Variables");
    await wait();
    control("Technical name (fixed after creation)").value = "maximum";
    const variableType = control("Type");
    variableType.value = "int";
    variableType.dispatchEvent(new Event("change", { bubbles: true }));
    const defaultValue = control("Default value");
    defaultValue.value = "9223372036854775807";
    defaultValue.dispatchEvent(new Event("input", { bubbles: true }));
    click("Create Variable");
    await wait();
    click("Variables");
    await wait();
    click("Edit default");
    const editedDefault = control("Default value");
    editedDefault.value = "-9223372036854775808";
    editedDefault.dispatchEvent(new Event("input", { bubbles: true }));
    click("Save Default");
    await wait();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s", ctrlKey: true, bubbles: true }));
    await wait();
    click("Assets");
    await wait();
    const technical = control("Technical name");
    technical.value = "theme";
    technical.dispatchEvent(new Event("input", { bubbles: true }));
    click("Choose and import…");
    await wait();
    const cancelledPreserved = technical.value === "theme"
      && [...document.querySelectorAll("button")].find((item) => item.textContent === "Choose and import…")?.disabled === false;
    click("Repair Ren'Py asset names");
    await wait();
    supportingAuthoringUiPassed = characterVisible
      && exactInteger
      && exactIntegerUpdate
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
  } catch {
    supportingAuthoringUiPassed = false;
  } finally {
    window.__TAURI_INTERNALS__.invoke = originalInternalInvoke;
  }
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
