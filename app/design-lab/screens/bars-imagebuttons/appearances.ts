import type { ImageButtonAppearances } from '../../../src/screen-controls.ts';
export type ImageState = keyof ImageButtonAppearances;
// Coordinator verified these chains against pinned Ren'Py 8.5.3 behavior.py.
export const fallbackChains: Record<ImageState, readonly ImageState[]> = {
  normal: ['normal'],
  hover: ['hover', 'normal'],
  selected: ['selected', 'normal'],
  selectedHover: ['selectedHover', 'hover', 'normal'],
  disabled: ['disabled', 'normal'],
  selectedDisabled: ['selectedDisabled', 'disabled', 'normal'],
};
export function resolvedAppearance(appearances: ImageButtonAppearances, state: ImageState) {
  const resolvedState = fallbackChains[state].find(candidate => appearances[candidate] !== null)!;
  return { state: resolvedState, reference: appearances[resolvedState]! };
}
