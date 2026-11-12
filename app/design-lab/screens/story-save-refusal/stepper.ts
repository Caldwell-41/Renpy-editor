import type { LabMount } from '../../contracts.ts';
import { mountRefusal } from './index.ts';
export const mount: LabMount = (host, context) => mountRefusal(host, context, 'stepper');
