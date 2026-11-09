import type { StyleCatalog } from "./screen-text.ts";

export interface ScreenTargetBinding { screenId: string; sourceName: string }
export interface AuthoringRevisionChange { before: string; after: string }
// Integer values use canonical decimal strings, as in existing Story authoring.
export type ScreenVariableValue = boolean | number | string;
export type ScreenArithmeticValue = import("./scene-ui.ts").IntegerAdjustment;
export type ScreenAction =
  | { type: "setVariable"; variableId: string; value: ScreenVariableValue | ScreenArithmeticValue }
  | { type: "showScreen"; target: ScreenTargetBinding }
  | { type: "hideScreen"; target: ScreenTargetBinding }
  | { type: "finishInteraction" };
export interface VariableBinding { variableId: string }
export interface VariableSample {
  variableId: string; expectedSourceRevision: string; value: ScreenVariableValue;
}
export interface ScreenRevisions { source: string; sourceMap: string; inventory: string; effects: string }
export interface ScreenEffects {
  revision: string; unknown: boolean; hiddenScreens: string[]; finishesInteraction: boolean;
  shownScreens: string[]; assignedVariables: string[]; readVariables?: string[];
  dependencies: { id: string; revision: string }[];
}
export interface OwnedScreen {
  id: string; rootId: string; path: string; name: string; kind: "panel" | "dialog" | "component";
  resolved: boolean; sourceRevision: string | null;
}
export interface ScreenCatalog {
  projectRevision: string; sourceMapRevision: string; inventoryRevision: string;
  owned: OwnedScreen[]; styles?: StyleCatalog;
}
export interface ResolvedScreenTarget {
  binding: ScreenTargetBinding; kind: "panel" | "dialog" | "component"; blocking: boolean; path: string; rootId: string;
  canShowHide: boolean;
  revisions: ScreenRevisions; effects: ScreenEffects;
}
export interface ComponentChange { componentId: string; screenId: string; useId: string }
export interface HelpStarter {
  title: string; explanation: string; assetId: string; expectedAssetSha256: string;
  width: number; height: number;
}
export interface ReviewedUse {
  screenId: string; componentId: string; nodeId: string; path: string; screenName: string;
  span: { start: number; end: number } | null; sourceRevision: string | null; resolved: boolean;
}
export interface ComponentReview {
  component: ResolvedScreenTarget; affectedScreens: OwnedScreen[]; uses: ReviewedUse[]; complete: boolean;
}

// Additional core inspection fields consumed by the arithmetic editor handoff.
export type ScreenActionAssignment = NonNullable<import("./scene-ui.ts").SceneBeat["assignment"]>;
export interface ScreenArithmeticInspection {
  actionVariables: import("./screen-interactions.ts").ScreenVariable[];
  actionCapabilities: {
    operators: string[]; operations: ScreenArithmeticValue["operation"][];
    maxBytes: number; maxNodes: number; maxDepth: number;
    integerTransport: "signedI64String"; decimalTransport: "finiteFloat64"; functions: false;
  };
}
export interface ScreenActionInspection {
  actionAssignments: (ScreenActionAssignment | null)[];
  actionProtectionReason: string | null;
}
