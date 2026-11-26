import type { LabMount } from '../../contracts.ts';
import { mountTemplates } from './index.ts';
export const mount: LabMount = (host, context) => mountTemplates(host, context, 'board');
