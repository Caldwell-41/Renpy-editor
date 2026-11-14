import type { LabMount } from '../../contracts.ts';
import { mountFixes } from './index.ts';
export const mount: LabMount = (host, context) => mountFixes(host, context, 'a');
