import {
  renderSourceWorkspace,
  type SourceDocument,
  type SourceInventory,
  type SourceWorkspaceController,
} from "../src/source-ui.ts";

declare global {
  interface Window {
    __sourceBrowserEvidence: {
      acceptedText: string;
      dirty: boolean;
      draftVersion: number;
      flushes: number;
      saves: number;
      updates: number;
      status: string;
      controller: SourceWorkspaceController;
    };
  }
}

const acceptedRevision = "a".repeat(64);
let acceptedText = 'label scene:\n    "Hello browser"\n    return\n';
let retainedDraft: string | undefined;
let model: SourceDocument = {
  path: "game/scene.rpy",
  text: acceptedText,
  state: "clean",
  editable: true,
  dirty: false,
  baseRevision: acceptedRevision,
  liveRevision: acceptedRevision,
  draftVersion: 0,
  hasBom: false,
  newline: "LF",
  partial: false,
  diagnostics: [],
  ranges: [],
  selectionStart: 0,
  selectionEnd: 0,
  canApplyBoth: false,
};
let updates = 0;
let saves = 0;
let flushes = 0;
let status = "";
const inventory = (): SourceInventory => ({
  files: [{ path: model.path, state: model.state, dirty: model.dirty, readOnly: false }],
  dirtyCount: model.dirty ? 1 : 0,
  draftBytes: model.dirty ? (model.text?.length ?? 0) : 0,
});
const syncEvidence = (): void => {
  if (!("__sourceBrowserEvidence" in window)) return;
  Object.assign(window.__sourceBrowserEvidence, {
    acceptedText,
    dirty: model.dirty,
    draftVersion: model.draftVersion,
    flushes,
    saves,
    updates,
    status,
  });
};

const controller = renderSourceWorkspace(
  document.querySelector("#host")!,
  document.querySelector("#tree")!,
  inventory(),
  {
    status: (message) => {
      status = message;
      document.querySelector("#status")!.textContent = message;
      syncEvidence();
    },
    reloadInventory: async () => inventory(),
    open: async () => model,
    update: async (request) => {
      updates += 1;
      const nextDraft = request.text === acceptedText ? undefined : request.text;
      const changed = retainedDraft !== nextDraft;
      retainedDraft = nextDraft;
      model = {
        ...model,
        text: request.text,
        dirty: nextDraft !== undefined,
        state: nextDraft === undefined ? "clean" : "dirty",
        draftVersion: model.draftVersion + Number(changed),
        selectionStart: request.selectionStart,
        selectionEnd: request.selectionEnd,
      };
      syncEvidence();
      return model;
    },
    save: async () => {
      saves += 1;
      acceptedText = retainedDraft ?? acceptedText;
      retainedDraft = undefined;
      model = { ...model, text: acceptedText, dirty: false, state: "clean", draftVersion: model.draftVersion + 1 };
      syncEvidence();
      return model;
    },
    discard: async () => model,
    applyBoth: async () => model,
    viewScene: () => {},
    requestSave: async (sourceController, intent) => {
      await sourceController.executeSave(intent, async () => { flushes += 1; syncEvidence(); });
    },
    registerController: () => () => {},
    runCoordinated: async (_label, task) => task(),
    refreshPersistence: syncEvidence,
  },
);

window.__sourceBrowserEvidence = {
  acceptedText,
  dirty: model.dirty,
  draftVersion: model.draftVersion,
  flushes,
  saves,
  updates,
  status,
  controller,
};
syncEvidence();
