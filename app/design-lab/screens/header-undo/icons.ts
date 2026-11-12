import type { LabContext } from '../../contracts.ts';
import { mountHeaderUndo } from './index.ts';
export const mount = (host: HTMLElement, context: LabContext) => mountHeaderUndo(host, context, 'icons');
