import type { InteractionEdit } from "./screen-interactions.ts";
import type { LayoutEdits } from "./screen-layout.ts";

// Shared wire contracts. Integer values retain the existing decimal-string format.
export interface IntegerBarBinding {
  variableId: string;
  minimum: string;
  maximum: string;
}
export interface BarAppearance {
  leftBar: string | null;
  rightBar: string | null;
  thumb: string | null;
}
export interface ControlImageReference {
  assetId: string;
  expectedAssetSha256: string;
  replacementSha256?: string | null;
}
// Ren'Py owns fallbacks for null optional states. Normal always has an asset.
export interface ImageButtonAppearances {
  normal: ControlImageReference;
  hover: ControlImageReference | null;
  selected: ControlImageReference | null;
  selectedHover: ControlImageReference | null;
  disabled: ControlImageReference | null;
  selectedDisabled: ControlImageReference | null;
}

interface ControlSize {
  width: number;
  height: number;
}
interface BarValues extends ControlSize {
  binding: IntegerBarBinding;
  appearance: BarAppearance;
}
interface ImageButtonValues extends ControlSize {
  appearances: ImageButtonAppearances;
}
interface BarChange extends BarValues {
  expectedAuthoringRevision: string;
  layout?: LayoutEdits;
}
interface ImageButtonChange extends ImageButtonValues {
  interaction: InteractionEdit;
  layout?: LayoutEdits;
}

// Editing retains the existing parent. Additions choose a qualified parent.
export type ScreenControlCommand =
  | ({ type: "addBar"; parentId: string } & BarChange)
  | ({ type: "bar"; nodeId: string } & BarChange)
  | ({ type: "addImageButton"; parentId: string } & ImageButtonChange)
  | ({ type: "imageButton"; nodeId: string } & ImageButtonChange);

export interface BarSample extends BarValues {
  nodeStart: number;
  expectedAuthoringRevision: string;
}
export interface BarAddition extends BarValues {
  parentStart: number;
  expectedAuthoringRevision: string;
}
export interface ImageButtonSample extends ImageButtonValues { nodeStart: number }
export interface ImageButtonAddition extends ImageButtonValues { parentStart: number }
export type ControlButtonState =
  | "normal" | "hover" | "selected" | "selectedHover" | "disabled" | "selectedDisabled";
