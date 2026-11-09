import type { LabMount } from '../../contracts.ts';
import { mountConflict } from './index.ts';
export const mount: LabMount = (host, context) => mountConflict(host, context, 'inline');
