import type { LabMount } from '../../contracts.ts';
import { mountEditor } from './index.ts';
export const mount: LabMount = (host, context) => mountEditor(host, context, 'blank');
