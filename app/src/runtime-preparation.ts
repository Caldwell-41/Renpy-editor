import type { CoreOperation } from "./protocol.js";
import type { SourceInventory, SourceWorkspaceController } from "./source-ui.js";
import { focusSceneDraft, hasSceneDraft } from "./scene-ui.js";

export type RuntimeKind = "run" | "validate";
export type RuntimeRevisionChoice = "saveAll" | "saved" | "commitScene" | "cancel";
export interface RuntimePreparation {
  readonly preparationId: string;
  readonly savedRevision: string;
  readonly draftCount: number;
  readonly trustId: string | null;
}
export interface RuntimePreparationActions {
  readonly controller?: SourceWorkspaceController;
  readonly sceneRoot: ParentNode;
  readonly current: () => boolean;
  readonly coordinate: <T>(task: () => Promise<T>) => Promise<T>;
  readonly request: <T>(operation: CoreOperation, payload?: Readonly<Record<string, unknown>>) => Promise<T>;
  readonly choose: (input: { readonly sourceDrafts: number; readonly pendingScene: boolean }) => Promise<RuntimeRevisionChoice>;
}

/** Foundation for both commands; the caller supplies the existing authoring lease
 * and session-bound request function. It never grants trust or starts a process. */
export async function prepareRuntimeInput(kind: RuntimeKind, sdkId: string, actions: RuntimePreparationActions): Promise<RuntimePreparation | undefined> {
  return actions.coordinate(async () => {
    const lease = await actions.controller?.prepareTransition("runtime");
    if (actions.controller && !lease) return undefined;
    try {
      if (!actions.current()) return undefined;
      const inventory = await actions.request<SourceInventory>("source.list");
      const pendingScene = hasSceneDraft(actions.sceneRoot);
      const choice = inventory.dirtyCount || pendingScene
        ? await actions.choose({ sourceDrafts: inventory.dirtyCount, pendingScene }) : "saved";
      if (!actions.current() || choice === "cancel") return undefined;
      if (choice === "commitScene" || (pendingScene && choice === "saveAll")) {
        focusSceneDraft(actions.sceneRoot);
        return undefined; // Existing explicit Commit, then retry; never auto-commit.
      }
      if (choice === "saveAll") {
        await actions.request<SourceInventory>("source.saveAll");
        await actions.controller?.refreshAccepted();
      }
      if (!actions.current()) return undefined;
      const preparation = await actions.request<RuntimePreparation>("runtime.prepare", { kind, sdkId, revisionChoice: "saved" });
      if (!actions.current()) {
        // This remains bound to the captured old session; it cannot cancel a new one.
        await actions.request("runtime.cancelPreparation", { preparationId: preparation.preparationId });
        return undefined;
      }
      return preparation;
    } finally { lease?.release(); }
  });
}
