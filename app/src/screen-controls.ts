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
  replacementSha256?: string;
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
