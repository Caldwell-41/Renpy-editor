import type { LabMount } from '../../contracts.ts';
import { mountDetail } from './index.ts';
export const mount: LabMount = (host, context) => mountDetail(host, context, 'point');
