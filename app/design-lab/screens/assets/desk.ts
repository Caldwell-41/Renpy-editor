import { mountAssets } from './workspace.ts';
import type { LabMount } from '../../contracts.ts';
export const mount: LabMount = (host, context) => mountAssets(host, context, 'desk');
